"""
AgentVoicemail Python SDK

Drop-in client for AI agents to use AgentVoicemail with USDC payments.
"""

import os
import time
import base58
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import TransferParams
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed

# Token program for SPL tokens (USDC)
TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
USDC_MINT = Pubkey.from_string("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
SERVICE_WALLET = Pubkey.from_string("8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY")


@dataclass
class PricingInfo:
    """Current pricing information"""
    amount: float
    currency: str
    usd_equiv: float


@dataclass
class ProcessResult:
    """Result from processing a voicemail"""
    job_id: str
    status: str
    free_tier: bool
    remaining_free: int
    charged: Optional[Dict[str, float]]
    payment_verified: bool


class AgentVoicemailClient:
    """
    AgentVoicemail client for autonomous AI agents.
    
    Handles:
    - USDC balance checking
    - USDC payment sending (SPL tokens)
    - Voicemail processing
    - Webhook result retrieval
    """
    
    DEFAULT_ENDPOINT = "https://agentvoicemail.com"
    
    def __init__(
        self,
        private_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        rpc_url: Optional[str] = None
    ):
        """
        Initialize AgentVoicemail Client
        
        Args:
            private_key: Base58-encoded private key
            endpoint: API endpoint
            rpc_url: Solana RPC URL
        """
        if private_key is None:
            private_key = os.environ.get("AGENT_PRIVATE_KEY")
        
        if not private_key:
            raise ValueError("Private key required.")
        
        # Load keypair
        secret_key = base58.b58decode(private_key)
        self.keypair = Keypair.from_bytes(secret_key)
        
        # Setup connections
        self.endpoint = endpoint or self.DEFAULT_ENDPOINT
        self.rpc_url = rpc_url or "https://api.mainnet-beta.solana.com"
        self.client = Client(self.rpc_url)
    
    @property
    def address(self) -> str:
        """Agent's wallet address (public key)"""
        return str(self.keypair.pubkey())
    
    def get_usdc_balance(self) -> float:
        """Get USDC balance"""
        try:
            # Find associated token account
            from spl.token.instructions import get_associated_token_address
            token_account = get_associated_token_address(
                self.keypair.pubkey(),
                USDC_MINT
            )
            
            balance = self.client.get_token_account_balance(token_account)
            return int(balance.value.amount) / 1_000_000  # USDC has 6 decimals
        except:
            return 0.0
    
    def get_pricing(self) -> PricingInfo:
        """Get current pricing from API"""
        response = requests.get(f"{self.endpoint}/api/pricing")
        response.raise_for_status()
        data = response.json()
        
        voicemail = data["prices"]["voicemail"]
        return PricingInfo(
            amount=voicemail["amount"],
            currency=voicemail["currency"],
            usd_equiv=voicemail["usd_equiv"],
        )
    
    def send_usdc_payment(self, amount_usdc: float) -> str:
        """
        Send USDC payment to service wallet
        
        Args:
            amount_usdc: Amount in USDC (e.g., 0.25)
            
        Returns:
            Transaction signature
        """
        try:
            from spl.token.instructions import (
                create_transfer_instruction,
                get_associated_token_address,
            )
            
            amount = int(amount_usdc * 1_000_000)  # 6 decimals
            
            # Get token accounts
            sender_token = get_associated_token_address(
                self.keypair.pubkey(), USDC_MINT
            )
            recipient_token = get_associated_token_address(
                SERVICE_WALLET, USDC_MINT
            )
            
            # Create transfer instruction
            transfer_ix = create_transfer_instruction(
                sender_token,
                recipient_token,
                self.keypair.pubkey(),
                amount,
            )
            
            # Create and send transaction
            blockhash = self.client.get_latest_blockhash().value.blockhash
            tx = Transaction.new_signed_with_payer(
                [transfer_ix],
                self.keypair.pubkey(),
                [self.keypair],
                blockhash,
            )
            
            signature = self.client.send_transaction(tx)
            self.client.confirm_transaction(signature.value, Confirmed)
            
            return str(signature.value)
            
        except Exception as e:
            raise Exception(f"USDC transfer failed: {str(e)}")
    
    def process_voicemail(
        self,
        audio_url: str,
        webhook_url: str,
        priority: bool = False,
        max_retries: int = 3
    ) -> ProcessResult:
        """
        Process a voicemail
        
        Automatically handles free tier and USDC payment if needed.
        
        Args:
            audio_url: URL to audio file
            webhook_url: Callback URL for results
            priority: Skip queue for faster processing (0.50 USDC)
            max_retries: Max payment retries
            
        Returns:
            ProcessResult with job_id and status
        """
        # Get current pricing
        pricing = self.get_pricing()
        price_usdc = pricing.amount * (2 if priority else 1)
        
        print(f"💰 Current price: {price_usdc} USDC (${price_usdc} USD)")
        
        # Try without payment first (free tier)
        print("🔄 Attempting request...")
        
        payload = {
            "audio_url": audio_url,
            "webhook_url": webhook_url,
            "agent_id": self.address,
            "priority": priority,
        }
        
        response = requests.post(
            f"{self.endpoint}/api/voicemail/process",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        
        data = response.json()
        
        # If free tier exhausted, pay and retry
        if response.status_code == 402:
            print(f"⚠️ Payment required: {price_usdc} USDC")
            
            # Check balance
            balance = self.get_usdc_balance()
            if balance < price_usdc:
                raise ValueError(
                    f"Insufficient USDC balance: {balance}, need {price_usdc}"
                )
            
            # Send USDC payment
            signature = self.send_usdc_payment(price_usdc)
            print(f"✅ USDC payment sent: {signature}")
            
            # Retry with payment
            payload["payment"] = {
                "signature": signature,
                "token": "USDC",
            }
            
            for attempt in range(max_retries):
                response = requests.post(
                    f"{self.endpoint}/api/voicemail/process",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                
                if response.status_code != 402:
                    break
                
                time.sleep(2)
            
            data = response.json()
        
        if not response.ok:
            raise Exception(f"API Error: {data.get('error')} - {data.get('message')}")
        
        print(f"✅ Job queued: {data.get('job_id')}")
        print(f"📊 Credits remaining: {data.get('remaining_free', 0)}")
        
        return ProcessResult(
            job_id=data.get("job_id"),
            status=data.get("status"),
            free_tier=data.get("free_tier", False),
            remaining_free=data.get("remaining_free", 0),
            charged=data.get("charged"),
            payment_verified=data.get("payment_verified", False),
        )
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check status of a job"""
        response = requests.get(f"{self.endpoint}/api/voicemail/status?job_id={job_id}")
        return response.json()
    
    def wait_for_completion(
        self,
        job_id: str,
        timeout: int = 120,
        poll_interval: int = 5
    ) -> Dict[str, Any]:
        """Poll for job completion"""
        start = time.time()
        
        while time.time() - start < timeout:
            status = self.get_job_status(job_id)
            
            if status.get("status") == "completed":
                return status
            
            if status.get("status") == "failed":
                raise Exception(f"Job failed: {status.get('error')}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Job {job_id} did not complete within {timeout}s")


# Example usage
if __name__ == "__main__":
    import os
    
    # Initialize
    client = AgentVoicemailClient()
    
    print(f"🤖 Agent address: {client.address}")
    print(f"💳 USDC Balance: {client.get_usdc_balance():.2f} USDC")
    
    try:
        result = client.process_voicemail(
            "https://example.com/voicemail.mp3",
            "https://my-agent.com/webhook",
        )
        
        print(f"✅ Job: {result.job_id}")
        
        # Wait for completion
        final = client.wait_for_completion(result.job_id, timeout=60)
        print(f"📝 Transcription: {final.get('result', {}).get('transcription', 'N/A')[:100]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
