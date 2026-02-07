/**
 * AgentWallet SDK
 * 
 * Drop-in client for AI agents to use AgentWallet Protocol services
 * 
 * Usage:
 *   const { AgentWallet } = require('./agent-sdk');
 *   const wallet = new AgentWallet(agentKeypair);
 *   await wallet.payAndProcessVoicemail(audioUrl, webhookUrl);
 */

const { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');

const DEFAULT_ENDPOINT = 'https://inksky.net';
const SERVICE_WALLET = new PublicKey('8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY');

class AgentWallet {
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

  /**
   * Get agent's wallet address
   */
  get address() {
    return this.keypair.publicKey.toString();
  }

  /**
   * Check balance
   * @returns {Promise<number>} SOL balance
   */
  async getBalance() {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Send payment to service
   * @param {number} amountSol - Amount in SOL
   * @returns {Promise<string>} Transaction signature
   */
  async sendPayment(amountSol) {
    const lamports = amountSol * LAMPORTS_PER_SOL;
    
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: SERVICE_WALLET,
        lamports,
      })
    );

    const signature = await this.connection.sendTransaction(tx, [this.keypair]);
    await this.connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  }

  /**
   * Process a voicemail
   * @param {string} audioUrl - URL to audio file
   * @param {string} webhookUrl - Callback URL
   * @param {Object} options
   * @param {boolean} options.priority - Skip queue (2x price)
   * @returns {Promise<Object>} Job status
   */
  async processVoicemail(audioUrl, webhookUrl, options = {}) {
    const price = options.priority ? 0.002 : 0.001;
    
    // Check balance first
    const balance = await this.getBalance();
    if (balance < price) {
      throw new Error(`Insufficient balance: ${balance} SOL, need ${price} SOL`);
    }

    // Send payment
    const signature = await this.sendPayment(price);

    // Make API request
    const response = await fetch(`${this.endpoint}/api/voicemail/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: audioUrl,
        webhook_url: webhookUrl,
        agent_id: this.address,
        payment: { signature },
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
    this.wallet = new AgentWallet(keypair, options);
    this.budget = options.budget || 0.1; // Default 0.1 SOL budget
    this.spent = 0;
  }

  /**
   * Execute a task with budget checking
   */
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

  /**
   * Process voicemail within budget
   */
  async handleVoicemail(audioUrl, webhookUrl) {
    return this.execute(
      () => this.wallet.processVoicemail(audioUrl, webhookUrl),
      0.001
    );
  }
}

module.exports = {
  AgentWallet,
  AutonomousAgent,
  SERVICE_WALLET: SERVICE_WALLET.toString(),
};
