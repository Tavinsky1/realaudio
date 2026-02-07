"""
AgentWallet Python SDK

Drop-in client for AI agents to use AgentWallet Protocol services.
Most AI agents are built in Python (LangChain, AutoGPT, etc.)

Usage:
    from agent_sdk import AgentWallet
    
    wallet = AgentWallet(private_key=os.environ["AGENT_PRIVATE_KEY"])
    result = wallet.process_voicemail(
        audio_url="https://...",
        webhook_url="https://..."
    )
"""

import os
import time
import base58
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed


@dataclass
class PricingInfo:
    """Current pricing information"""
    sol_usd_rate: float
    voicemail_sol: float
    voicemail_usd: float
    timestamp: str


@dataclass
class ProcessResult:
    """Result from processing a voicemail"""
    job_id: str
    status: str
    free_tier: bool
    remaining_free: int
    charged: Optional[Dict[str, float]]
    payment_verified: bool


class AgentWallet:
    """
    AgentWallet client for autonomous AI agents.
    
    Handles:
    - Balance checking
    - Payment sending
    - Voicemail processing
    - Webhook result retrieval
    """
    
    DEFAULT_ENDPOINT = "https://inksky.net"
    SERVICE_WALLET = Pubkey.from_string(
        os.environ.get("SERVICE_WALLET", "YOUR_SERVICE_WALLET_HERE")
    )
    
    def __init__(
        self,
        private_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        rpc_url: Optional[str] = None
    ):
        """
        Initialize AgentWallet
        
        Args:
            private_key: Base58-encoded private key, or loads from AGENT_PRIVATE_KEY env var
            endpoint: API endpoint, defaults to https://inksky.net
            rpc_url: Solana RPC URL, defaults to mainnet-beta
        """
        if private_key is None:
            private_key = os.environ.get("AGENT_PRIVATE_KEY")
        
        if not private_key:
            raise ValueError("Private key required. Set AGENT_PRIVATE_KEY env var or pass to constructor.")
        
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
    
    def get_balance(self) -> float:
        """Get SOL balance"""
        response = self.client.get_balance(self.keypair.pubkey())
        lamports = response.value
        return lamports / 1_000_000_000  # Convert to SOL
    
    def get_pricing(self) -> PricingInfo:
        """Get current pricing from API"""
        response = requests.get(f"{self.endpoint}/api/pricing")
        response.raise_for_status()
        data = response.json()
        
        return PricingInfo(
            sol_usd_rate=data.get("sol_usd_rate", 200),
            voicemail_sol=data["prices"]["voicemail"]["sol"],
            voicemail_usd=data["prices"]["voicemail"]["usd"],
            timestamp=data.get("timestamp", ""),
        )
    
    def get_health(self) -> Dict[str, Any]:
        """Get API health status"""
        response = requests.get(f"{self.endpoint}/api/health")
        response.raise_for_status()
        return response.json()
    
    def send_payment(self, amount_sol: float) -> str:
        """
        Send SOL payment to service wallet
        
        Args:
            amount_sol: Amount in SOL
            
        Returns:
            Transaction signature
        """
        lamports = int(amount_sol * 1_000_000_000)
        
        # Get recent blockhash
        blockhash_response = self.client.get_latest_blockhash()
        blockhash = blockhash_response.value.blockhash
        
        # Create transfer instruction
        transfer_ix = transfer(
            TransferParams(
                from_pubkey=self.keypair.pubkey(),
                to_pubkey=self.SERVICE_WALLET,
                lamports=lamports,
            )
        )
        
        # Create and sign transaction
        transaction = Transaction.new_signed_with_payer(
            [transfer_ix],
            self.keypair.pubkey(),
            [self.keypair],
            blockhash,
        )
        
        # Send transaction
        response = self.client.send_transaction(transaction)
        signature = response.value
        
        # Wait for confirmation
        self.client.confirm_transaction(signature, commitment=Confirmed)
        
        return str(signature)
    
    def process_voicemail(
        self,
        audio_url: str,
        webhook_url: str,
        priority: bool = False,
        max_retries: int = 3
    ) -> ProcessResult:
        """
        Process a voicemail
        
        Automatically handles free tier and payment if needed.
        
        Args:
            audio_url: URL to audio file (mp3, wav, etc.)
            webhook_url: Callback URL for results
            priority: Skip queue for faster processing (2x price)
            max_retries: Max payment retries
            
        Returns:
            ProcessResult with job_id and status
        """
        # Get current pricing
        pricing = self.get_pricing()
        price_sol = pricing.voicemail_sol * (2 if priority else 1)
        
        print(f"💰 Current price: {price_sol:.6f} SOL (~${pricing.voicemail_usd:.2f} USD)")
        
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
            print(f"⚠️ Payment required: {price_sol:.6f} SOL")
            
            # Check balance
            balance = self.get_balance()
            if balance < price_sol:
                raise ValueError(
                    f"Insufficient balance: {balance:.6f} SOL, "
                    f"need {price_sol:.6f} SOL"
                )
            
            # Send payment
            signature = self.send_payment(price_sol)
            print(f"✅ Payment sent: {signature}")
            
            # Retry with payment
            payload["payment"] = {"signature": signature}
            
            for attempt in range(max_retries):
                response = requests.post(
                    f"{self.endpoint}/api/voicemail/process",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                
                if response.status_code != 402:  # Not payment error
                    break
                
                # Wait a bit for transaction to confirm
                time.sleep(2)
            
            data = response.json()
        
        if not response.ok:
            raise APIError(f"API Error: {data.get('error')} - {data.get('message')}")
        
        return ProcessResult(
            job_id=data["job_id"],
            status=data["status"],
            free_tier=data.get("free_tier", False),
            remaining_free=data.get("remaining_free", 0),
            charged=data.get("charged"),
            payment_verified=data.get("payment_verified", False),
        )
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check status of a job"""
        response = requests.get(f"{self.endpoint}/api/voicemail/status?job_id={job_id}")
        response.raise_for_status()
        return response.json()
    
    def wait_for_completion(
        self,
        job_id: str,
        timeout: int = 120,
        poll_interval: int = 5
    ) -> Dict[str, Any]:
        """
        Poll for job completion
        
        Args:
            job_id: Job ID to check
            timeout: Max seconds to wait
            poll_interval: Seconds between polls
            
        Returns:
            Final job result
        """
        start = time.time()
        
        while time.time() - start < timeout:
            status = self.get_job_status(job_id)
            
            if status.get("status") == "completed":
                return status
            
            if status.get("status") == "failed":
                raise ProcessingError(f"Job failed: {status.get('error')}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Job {job_id} did not complete within {timeout}s")


class AgentBudgetManager:
    """
    Higher-level manager for agents with budget constraints
    """
    
    def __init__(
        self,
        wallet: AgentWallet,
        budget_sol: float = 0.1,
        max_cost_per_operation: float = 0.01
    ):
        self.wallet = wallet
        self.budget_sol = budget_sol
        self.spent_sol = 0.0
        self.max_cost_per_operation = max_cost_per_operation
    
    def can_afford(self, cost_sol: float) -> bool:
        """Check if operation is within budget"""
        return (self.spent_sol + cost_sol) <= self.budget_sol
    
    def execute(self, operation, cost_sol: float, *args, **kwargs):
        """
        Execute operation within budget
        
        Args:
            operation: Callable to execute
            cost_sol: Expected cost
            *args, **kwargs: Arguments for operation
            
        Returns:
            Operation result or budget exceeded error
        """
        if not self.can_afford(cost_sol):
            return {
                "success": False,
                "error": "BUDGET_EXCEEDED",
                "budget": self.budget_sol,
                "spent": self.spent_sol,
                "required": cost_sol,
            }
        
        if cost_sol > self.max_cost_per_operation:
            return {
                "success": False,
                "error": "COST_EXCEEDS_MAX",
                "max": self.max_cost_per_operation,
                "required": cost_sol,
            }
        
        try:
            result = operation(*args, **kwargs)
            self.spent_sol += cost_sol
            return {"success": True, "result": result, "spent": self.spent_sol}
        except Exception as e:
            return {"success": False, "error": str(e)}


class APIError(Exception):
    """API request failed"""
    pass


class ProcessingError(Exception):
    """Job processing failed"""
    pass


# Example usage
if __name__ == "__main__":
    import os
    
    # Initialize wallet
    wallet = AgentWallet()
    
    print(f"🤖 Agent address: {wallet.address}")
    print(f"💳 Balance: {wallet.get_balance():.6f} SOL")
    
    # Process voicemail
    try:
        result = wallet.process_voicemail(
            audio_url="https://example.com/voicemail.mp3",
            webhook_url="https://my-agent.com/webhook",
        )
        
        print(f"✅ Job queued: {result.job_id}")
        print(f"📊 Free tier: {result.free_tier}, Remaining: {result.remaining_free}")
        
        # Wait for completion (optional - webhook is preferred)
        final = wallet.wait_for_completion(result.job_id, timeout=60)
        print(f"📝 Transcription: {final.get('result', {}).get('transcription', 'N/A')[:100]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
