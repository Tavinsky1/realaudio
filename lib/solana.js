/**
 * AgentWallet Protocol - Solana Payment Verification
 * 
 * Agents pay autonomously. No humans required.
 * 
 * @module lib/solana
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Your service wallet - agents pay to this address
const SERVICE_WALLET = new PublicKey('8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY');

// Price per voicemail in SOL (~$0.20 at current prices)
const PRICE_PER_VOICEMAIL_SOL = 0.001;
const PRICE_LAMPORTS = PRICE_PER_VOICEMAIL_SOL * LAMPORTS_PER_SOL;

// Solana RPC endpoints (free tier)
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',  // Public, rate limited
  'https://solana-api.projectserum.com',   // Fallback
];

class SolanaPaymentVerifier {
  constructor() {
    this.connection = new Connection(RPC_ENDPOINTS[0], 'confirmed');
    this.processedTxs = new Set(); // Prevent double-spending
  }

  /**
   * Verify a payment transaction
   * 
   * @param {string} signature - Transaction signature
   * @param {string} expectedAmount - Expected amount in SOL
   * @param {string} senderPubkey - Expected sender (optional, for agent tracking)
   * @returns {Promise<{valid: boolean, error?: string, details?: object}>}
   */
  async verifyPayment(signature, expectedAmount = PRICE_PER_VOICEMAIL_SOL, senderPubkey = null) {
    try {
      // Check if already processed (idempotency)
      if (this.processedTxs.has(signature)) {
        return { valid: false, error: 'TRANSACTION_ALREADY_PROCESSED' };
      }

      // Fetch transaction from Solana
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return { valid: false, error: 'TRANSACTION_NOT_FOUND' };
      }

      // Check if transaction is recent (within 5 minutes)
      const txTime = tx.blockTime * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - txTime > fiveMinutes) {
        return { valid: false, error: 'TRANSACTION_EXPIRED' };
      }

      // Verify recipient is our service wallet
      const accountKeys = tx.transaction.message.accountKeys.map(k => k.toString());
      const recipientIndex = accountKeys.indexOf(SERVICE_WALLET.toString());
      
      if (recipientIndex === -1) {
        return { valid: false, error: 'INVALID_RECIPIENT' };
      }

      // Verify amount
      const preBalance = tx.meta.preBalances[recipientIndex];
      const postBalance = tx.meta.postBalances[recipientIndex];
      const receivedLamports = postBalance - preBalance;
      const expectedLamports = expectedAmount * LAMPORTS_PER_SOL;

      if (receivedLamports < expectedLamports) {
        return { 
          valid: false, 
          error: 'INSUFFICIENT_PAYMENT',
          details: {
            received: receivedLamports / LAMPORTS_PER_SOL,
            expected: expectedAmount,
          }
        };
      }

      // Verify sender if specified
      if (senderPubkey) {
        const senderIndex = accountKeys.indexOf(senderPubkey);
        if (senderIndex === -1) {
          return { valid: false, error: 'INVALID_SENDER' };
        }
      }

      // Mark as processed
      this.processedTxs.add(signature);
      
      // Cleanup old transactions (keep last 1000)
      if (this.processedTxs.size > 1000) {
        const iterator = this.processedTxs.values();
        this.processedTxs.delete(iterator.next().value);
      }

      return {
        valid: true,
        details: {
          signature,
          amount: receivedLamports / LAMPORTS_PER_SOL,
          sender: accountKeys.find((_, i) => tx.meta.preBalances[i] > tx.meta.postBalances[i]),
          timestamp: txTime,
          slot: tx.slot,
        }
      };

    } catch (error) {
      console.error('Payment verification error:', error);
      return { valid: false, error: 'VERIFICATION_FAILED', details: error.message };
    }
  }

  /**
   * Get balance for a wallet
   * @param {string} pubkey - Wallet public key
   * @returns {Promise<number>} - Balance in SOL
   */
  async getBalance(pubkey) {
    try {
      const publicKey = new PublicKey(pubkey);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Balance check error:', error);
      return 0;
    }
  }

  /**
   * Generate a unique payment reference for tracking
   * @returns {string}
   */
  generatePaymentRef() {
    return `vm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Pricing tiers for different services
const PRICING = {
  voicemail: {
    process: 0.001,      // $0.20 - Transcribe + extract intent
    transcribe_only: 0.0005,  // $0.10 - Just transcription
    priority: 0.002,     // $0.40 - Skip queue, faster processing
  },
  kyc: {
    verify: 0.005,       // $1.00 - Agent verification badge
    monitor_monthly: 0.01,   // $2.00/month - Ongoing reputation
  },
  analytics: {
    log: 0.0001,         // $0.02 - Log a failure event
    report: 0.001,       // $0.20 - Generate analysis report
  }
};

module.exports = {
  SolanaPaymentVerifier,
  SERVICE_WALLET: SERVICE_WALLET.toString(),
  PRICE_PER_VOICEMAIL_SOL,
  PRICING,
  LAMPORTS_PER_SOL,
};
