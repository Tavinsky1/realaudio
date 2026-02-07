/**
 * Multi-RPC Fallback for Solana
 * 
 * Problem: Free/public RPCs are unreliable
 * Solution: Try multiple endpoints in order
 * 
 * Priority:
 * 1. Helius (if API key available) - Most reliable
 * 2. QuickNode (if API key available)
 * 3. Public endpoints (fallback)
 * 
 * @module lib/solana-rpc
 */

const { Connection } = require('@solana/web3.js');

class SolanaRPCManager {
  constructor() {
    this.endpoints = this.buildEndpointList();
    this.connections = new Map();
    this.lastHealthy = new Map();
  }

  buildEndpointList() {
    const endpoints = [];

    // Priority 1: Helius (most reliable, requires API key)
    if (process.env.HELIUS_API_KEY) {
      endpoints.push(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);
    }

    // Priority 2: QuickNode (requires API key)
    if (process.env.QUICKNODE_RPC_URL) {
      endpoints.push(process.env.QUICKNODE_RPC_URL);
    }

    // Priority 3: Custom RPC
    if (process.env.SOLANA_RPC_URL) {
      endpoints.push(process.env.SOLANA_RPC_URL);
    }

    // Fallback: Public endpoints (rate limited, less reliable)
    endpoints.push(
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
    );

    return endpoints;
  }

  /**
   * Get a healthy connection
   * Tries endpoints in order, caches healthy ones
   */
  async getConnection() {
    // Try cached healthy connections first
    for (const [endpoint, lastHealthy] of this.lastHealthy.entries()) {
      if (Date.now() - lastHealthy < 60000) { // Healthy in last minute
        if (!this.connections.has(endpoint)) {
          this.connections.set(endpoint, new Connection(endpoint, 'confirmed'));
        }
        return this.connections.get(endpoint);
      }
    }

    // Try all endpoints
    for (const endpoint of this.endpoints) {
      try {
        const connection = new Connection(endpoint, 'confirmed');
        
        // Health check: get slot
        const slot = await Promise.race([
          connection.getSlot(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          ),
        ]);

        if (slot > 0) {
          this.lastHealthy.set(endpoint, Date.now());
          this.connections.set(endpoint, connection);
          console.log(`✅ Solana RPC healthy: ${this.maskEndpoint(endpoint)}`);
          return connection;
        }
      } catch (error) {
        console.warn(`❌ Solana RPC failed: ${this.maskEndpoint(endpoint)} - ${error.message}`);
        continue;
      }
    }

    throw new Error('All Solana RPC endpoints failed');
  }

  /**
   * Execute operation with automatic retry and fallback
   */
  async execute(operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const connection = await this.getConnection();
        return await operation(connection);
      } catch (error) {
        lastError = error;
        
        // Clear cache for failed endpoint
        this.lastHealthy.clear();
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    throw lastError;
  }

  /**
   * Verify transaction with fallback
   */
  async verifyTransaction(signature) {
    return this.execute(async (connection) => {
      return await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    });
  }

  /**
   * Get balance with fallback
   */
  async getBalance(publicKey) {
    return this.execute(async (connection) => {
      return await connection.getBalance(publicKey);
    });
  }

  /**
   * Mask endpoint for logging (hide API keys)
   */
  maskEndpoint(endpoint) {
    if (endpoint.includes('api-key=')) {
      return endpoint.replace(/api-key=[^&]+/, 'api-key=***');
    }
    if (endpoint.includes('https://') && endpoint.split('/').length > 3) {
      // QuickNode URLs have tokens in path
      const url = new URL(endpoint);
      return `${url.protocol}//${url.hostname}/***`;
    }
    return endpoint;
  }

  /**
   * Health check all endpoints
   */
  async healthCheck() {
    const results = [];

    for (const endpoint of this.endpoints) {
      try {
        const connection = new Connection(endpoint, 'confirmed');
        const start = Date.now();
        const slot = await Promise.race([
          connection.getSlot(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          ),
        ]);
        const latency = Date.now() - start;

        results.push({
          endpoint: this.maskEndpoint(endpoint),
          healthy: true,
          slot,
          latency,
        });
      } catch (error) {
        results.push({
          endpoint: this.maskEndpoint(endpoint),
          healthy: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

const rpcManager = new SolanaRPCManager();

module.exports = { SolanaRPCManager, rpcManager };
