/**
 * AgentVoicemail SDK (JavaScript)
 * 
 * Drop-in client for AI agents to use AgentVoicemail
 * 
 * Usage:
 *   const { AgentVoicemailClient } = require('./agent-sdk');
 *   const wallet = new AgentVoicemailClient(agentKeypair);
 *   await wallet.payAndProcessVoicemail(audioUrl, webhookUrl);
 */

const { 
  Connection, 
  PublicKey, 
  Transaction,
} = require('@solana/web3.js');

const { 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');

const DEFAULT_ENDPOINT = 'https://agentvoicemail.com';
const SERVICE_WALLET = new PublicKey('8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

class AgentVoicemailClient {
  /**
   * @param {Keypair} keypair - Solana keypair for the agent
   * @param {Object} options
   * @param {string} options.endpoint - API endpoint
   * @param {string} options.rpcUrl - Solana RPC endpoint
   */
  constructor(keypair, options = {}) {
    this.keypair = keypair;
    this.endpoint = options.endpoint || DEFAULT_ENDPOINT;
    this.connection = new Connection(
      options.rpcUrl || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  get address() {
    return this.keypair.publicKey.toString();
  }

  /**
   * Get agent's USDC balance
   * @returns {Promise<number>} USDC balance
   */
  async getUSDCBalance() {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        this.keypair.publicKey
      );
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.amount) / 1_000_000;
    } catch {
      return 0;
    }
  }

  /**
   * Send USDC payment to service
   * @param {number} amountUSDC - Amount in USDC
   * @returns {Promise<string>} Transaction signature
   */
  async sendUSDC(amountUSDC) {
    const amount = amountUSDC * 1_000_000; // 6 decimals
    
    // Get token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      this.keypair.publicKey
    );
    
    const recipientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      SERVICE_WALLET
    );

    // Create transfer instruction
    const transferIx = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      this.keypair.publicKey,
      amount
    );

    // Create and sign transaction
    const transaction = new Transaction().add(transferIx);
    transaction.feePayer = this.keypair.publicKey;
    
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    transaction.sign(this.keypair);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );
    
    await this.connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  }

  /**
   * Process a voicemail
   * @param {string} audioUrl - URL to audio file
   * @param {string} webhookUrl - Callback URL
   * @param {Object} options
   * @param {boolean} options.priority - Skip queue (2x price = 0.50 USDC)
   */
  async processVoicemail(audioUrl, webhookUrl, options = {}) {
    const price = options.priority ? 0.50 : 0.25;
    
    // Check balance first
    const balance = await this.getUSDCBalance();
    if (balance < price) {
      throw new Error(`Insufficient USDC balance: ${balance}, need ${price}`);
    }

    // Send payment
    const signature = await this.sendUSDC(price);

    // Make API request
    const response = await fetch(`${this.endpoint}/api/voicemail/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: audioUrl,
        webhook_url: webhookUrl,
        agent_id: this.address,
        payment: { 
          signature,
          token: 'USDC',
        },
        priority: options.priority,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error} - ${error.message}`);
    }

    return response.json();
  }

  /**
   * Check job status
   * @param {string} jobId 
   */
  async getJobStatus(jobId) {
    const response = await fetch(`${this.endpoint}/api/voicemail/status?job_id=${jobId}`);
    return response.json();
  }

  /**
   * Get current pricing
   */
  async getPricing() {
    const response = await fetch(`${this.endpoint}/api/pricing`);
    return response.json();
  }
}

/**
 * Higher-level agent helper that manages budget and retries
 */
class AutonomousAgent {
  constructor(keypair, options = {}) {
    this.wallet = new AgentVoicemailClient(keypair, options);
    this.budget = options.budget || 10.0; // Default 10 USDC budget
    this.spent = 0;
  }

  async execute(task, maxCost) {
    if (this.spent + maxCost > this.budget) {
      return {
        success: false,
        error: 'BUDGET_EXCEEDED',
        budget: this.budget,
        spent: this.spent,
        required: maxCost,
      };
    }

    try {
      const result = await task();
      this.spent += maxCost;
      return { success: true, result, spent: this.spent };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleVoicemail(audioUrl, webhookUrl) {
    return this.execute(
      () => this.wallet.processVoicemail(audioUrl, webhookUrl),
      0.25
    );
  }
}

module.exports = {
  AgentVoicemailClient,
  AutonomousAgent,
  SERVICE_WALLET: SERVICE_WALLET.toString(),
  USDC_MINT: USDC_MINT.toString(),
};
