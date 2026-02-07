/**
 * USDC Payment Verification on Solana
 * 
 * Agents pay with USDC (SPL token) - stable, predictable
 */

const { Connection, PublicKey } = require('@solana/web3.js');

// USDC Token Mint (Official Solana USDC)
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Your service wallet (receives USDC)
const SERVICE_WALLET = new PublicKey('8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY');

// Price per voicemail in USDC (6 decimals)
const PRICE_PER_VOICEMAIL_USDC = 0.25;
const PRICE_USDC_LAMPORTS = PRICE_PER_VOICEMAIL_USDC * 1_000_000; // USDC has 6 decimals

// RPC endpoints
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

class USDCPaymentVerifier {
  constructor() {
    this.connection = new Connection(RPC_ENDPOINTS[0], 'confirmed');
    this.processedTxs = new Set();
  }

  /**
   * Verify a USDC payment transaction
   * 
   * @param {string} signature - Transaction signature
   * @param {number} expectedAmount - Expected USDC amount
   * @returns {Promise<{valid: boolean, error?: string, details?: object}>}
   */
  async verifyPayment(signature, expectedAmount = PRICE_PER_VOICEMAIL_USDC) {
    try {
      // Check if already processed
      if (this.processedTxs.has(signature)) {
        return { valid: false, error: 'TRANSACTION_ALREADY_PROCESSED' };
      }

      // Fetch transaction
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

      // Parse token transfers from transaction
      const usdcTransfer = this.parseUSDCTransfer(tx, SERVICE_WALLET.toString());
      
      if (!usdcTransfer) {
        return { valid: false, error: 'NO_USDC_TRANSFER_FOUND' };
      }

      // Verify amount (with small tolerance for fees/rounding)
      const receivedUSDC = usdcTransfer.amount;
      const expectedUSDC = expectedAmount;
      const tolerance = 0.001; // $0.001 tolerance

      if (receivedUSDC < expectedUSDC - tolerance) {
        return {
          valid: false,
          error: 'INSUFFICIENT_PAYMENT',
          details: {
            received: receivedUSDC,
            expected: expectedUSDC,
            currency: 'USDC',
          }
        };
      }

      // Mark as processed
      this.processedTxs.add(signature);
      
      // Cleanup old transactions
      if (this.processedTxs.size > 1000) {
        const iterator = this.processedTxs.values();
        this.processedTxs.delete(iterator.next().value);
      }

      return {
        valid: true,
        details: {
          signature,
          amount: receivedUSDC,
          sender: usdcTransfer.sender,
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
   * Parse USDC transfer from transaction
   * Looks for SPL token transfers to service wallet
   */
  parseUSDCTransfer(tx, recipientAddress) {
    try {
      // Check post token balances for USDC mint
      const postBalances = tx.meta.postTokenBalances || [];
      const preBalances = tx.meta.preTokenBalances || [];

      for (const post of postBalances) {
        // Check if this is USDC mint
        if (post.mint !== USDC_MINT.toString()) continue;
        
        // Check if recipient is service wallet
        if (post.owner !== recipientAddress) continue;

        // Find matching pre-balance
        const pre = preBalances.find(p => 
          p.accountIndex === post.accountIndex && 
          p.mint === USDC_MINT.toString()
        );

        if (pre) {
          const amount = parseFloat(post.uiTokenAmount.amount) / 1_000_000;
          const preAmount = parseFloat(pre.uiTokenAmount.amount) / 1_000_000;
          const received = amount - preAmount;

          if (received > 0) {
            // Find sender from transaction accounts
            const accountKeys = tx.transaction.message.accountKeys.map(k => k.toString());
            const sender = accountKeys.find((_, i) => {
              const preBal = tx.meta.preBalances[i];
              const postBal = tx.meta.postBalances[i];
              return preBal > postBal; // Sender pays gas
            });

            return {
              amount: received,
              sender,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  /**
   * Get USDC balance for a wallet
   * @param {string} pubkey - Wallet public key
   * @returns {Promise<number>} - Balance in USDC
   */
  async getUSDCBalance(pubkey) {
    try {
      const publicKey = new PublicKey(pubkey);
      
      // Find associated token account
      const { getAssociatedTokenAddress } = require('@solana/spl-token');
      const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      
      // Get balance
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.amount) / 1_000_000;
    } catch (error) {
      // No token account = 0 balance
      return 0;
    }
  }

  /**
   * Generate payment instructions for agents
   */
  getPaymentInstructions() {
    return {
      amount: PRICE_PER_VOICEMAIL_USDC,
      currency: 'USDC',
      network: 'Solana',
      tokenMint: USDC_MINT.toString(),
      recipient: SERVICE_WALLET.toString(),
      instructions: [
        `Send ${PRICE_PER_VOICEMAIL_USDC} USDC to: ${SERVICE_WALLET.toString()}`,
        'Use Solana SPL token transfer (not SOL)',
        'Include transaction signature in API call',
      ],
    };
  }
}

// Pricing info
const PRICING = {
  voicemail: {
    process: 0.25,
    priority: 0.50,
  }
};

module.exports = {
  USDCPaymentVerifier,
  USDC_MINT: USDC_MINT.toString(),
  SERVICE_WALLET: SERVICE_WALLET.toString(),
  PRICE_PER_VOICEMAIL_USDC,
  PRICE_USDC_LAMPORTS,
  PRICING,
};
