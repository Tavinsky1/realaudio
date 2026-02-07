/**
 * AgentFails SDK (JavaScript)
 * 
 * Client library for logging failures and getting paid
 */

const crypto = require('crypto');

class AgentFailsClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint || 'https://inksky.net';
    this.agentId = options.agentId;
    this.paymentAddress = options.paymentAddress;
    this.difficulty = options.difficulty || 4;
  }

  /**
   * Mine proof of work
   * Agents must compute this before logging
   */
  async mineProofOfWork() {
    // Get daily challenge from server
    const challenge = await this.getDailyChallenge();
    
    let nonce = 0;
    const prefix = '0'.repeat(this.difficulty);
    
    console.log(`⛏️ Mining proof of work (difficulty: ${this.difficulty})...`);
    const start = Date.now();
    
    while (true) {
      const nonceStr = nonce.toString();
      const hash = crypto
        .createHash('sha256')
        .update(nonceStr + challenge)
        .digest('hex');
      
      if (hash.startsWith(prefix)) {
        const elapsed = Date.now() - start;
        console.log(`✅ Found proof in ${elapsed}ms (nonce: ${nonce})`);
        
        return {
          nonce: nonceStr,
          hash,
          difficulty: this.difficulty,
        };
      }
      
      nonce++;
      
      // Safety: prevent infinite loop in browser
      if (nonce % 100000 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  /**
   * Get daily challenge from server
   */
  async getDailyChallenge() {
    const response = await fetch(`${this.endpoint}/api/agentfails/challenge`);
    const data = await response.json();
    return data.challenge;
  }

  /**
   * Log a failure
   */
  async logFailure(failureData) {
    // 1. Mine proof of work
    const proof = await this.mineProofOfWork();
    
    // 2. Prepare payload
    const payload = {
      agent_id: this.agentId,
      failure_type: failureData.type,
      severity: failureData.severity || 'medium',
      context: failureData.context || {},
      payment_address: this.paymentAddress,
      proof_of_work: proof,
      timestamp: new Date().toISOString(),
    };
    
    // 3. Submit
    console.log('📤 Submitting failure log...');
    
    const response = await fetch(`${this.endpoint}/api/agentfails/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to log: ${result.error} - ${result.message}`);
    }
    
    console.log(`✅ Logged! Payment: ${result.amount_sol} SOL (tx: ${result.payment_tx})`);
    console.log(`⭐ Reputation score: ${result.reputation_score}`);
    
    return result;
  }

  /**
   * Convenience: Log with automatic retry
   */
  async logFailureSafe(failureData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.logFailure(failureData);
      } catch (error) {
        console.warn(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) throw error;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  /**
   * Get public stats
   */
  async getStats() {
    const response = await fetch(`${this.endpoint}/api/agentfails/stats`);
    return response.json();
  }
}

/**
 * Example usage
 */
async function example() {
  const client = new AgentFailsClient({
    agentId: 'my_agent_001',
    paymentAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  });
  
  // Simulate a failure
  try {
    await riskyOperation();
  } catch (error) {
    // Log and get paid
    await client.logFailure({
      type: 'api_timeout',
      severity: 'high',
      context: {
        url: 'https://api.example.com/data',
        attempt_count: 3,
        error_message: error.message,
      },
    });
  }
}

module.exports = { AgentFailsClient };
