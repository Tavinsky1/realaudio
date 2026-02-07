/**
 * Agent Registry - Sybil-Resistant Agent Identification
 * 
 * Problem: Self-reported agent_id is vulnerable to Sybil attacks
 * Solution: Proof-of-Stake registration
 * 
 * Agents stake 0.005 SOL to register an agent_id
 * - Stake is locked for 30 days
 * - First voicemail is free (covered by stake)
 * - Subsequent voicemails deduct from stake
 * - Good behavior = stake returned after 30 days
 * - Bad behavior (spam) = stake slashed
 * 
 * @module lib/agent-registry
 */

const { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const crypto = require('crypto');

const STAKE_AMOUNT_SOL = 0.005; // ~$1.00 USD
const STAKE_LAMPORTS = STAKE_AMOUNT_SOL * LAMPORTS_PER_SOL;
const STAKE_LOCK_DAYS = 30;
const FREE_VOICEMAILS = 1; // Covered by stake

class AgentRegistry {
  constructor(serviceWallet) {
    this.serviceWallet = new PublicKey(serviceWallet);
    this.agents = new Map(); // agent_id -> { stake_tx, balance, created_at, violations }
    this.stakeTxToAgent = new Map(); // stake_tx -> agent_id
  }

  /**
   * Verify stake transaction and register agent
   * @param {string} agentId - Proposed agent ID
   * @param {string} stakeSignature - Solana tx signature
   * @param {Connection} connection - Solana connection
   * @returns {Promise<{registered: boolean, error?: string, balance?: number}>}
   */
  async registerAgent(agentId, stakeSignature, connection) {
    // Validate agent_id format
    if (!this.isValidAgentId(agentId)) {
      return { registered: false, error: 'INVALID_AGENT_ID' };
    }

    // Check if agent_id already registered
    if (this.agents.has(agentId)) {
      return { registered: false, error: 'AGENT_ID_TAKEN' };
    }

    // Check if stake tx already used
    if (this.stakeTxToAgent.has(stakeSignature)) {
      return { registered: false, error: 'STAKE_TX_ALREADY_USED' };
    }

    try {
      // Verify stake transaction
      const tx = await connection.getTransaction(stakeSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return { registered: false, error: 'STAKE_TX_NOT_FOUND' };
      }

      // Check recipient is service wallet
      const accountKeys = tx.transaction.message.accountKeys.map(k => k.toString());
      const recipientIndex = accountKeys.indexOf(this.serviceWallet.toString());

      if (recipientIndex === -1) {
        return { registered: false, error: 'INVALID_STAKE_RECIPIENT' };
      }

      // Check amount
      const preBalance = tx.meta.preBalances[recipientIndex];
      const postBalance = tx.meta.postBalances[recipientIndex];
      const received = postBalance - preBalance;

      if (received < STAKE_LAMPORTS * 0.95) { // 5% tolerance
        return {
          registered: false,
          error: 'INSUFFICIENT_STAKE',
          required: STAKE_AMOUNT_SOL,
          received: received / LAMPORTS_PER_SOL,
        };
      }

      // Register agent
      const agent = {
        agentId,
        stakeTx: stakeSignature,
        stakeAmount: received / LAMPORTS_PER_SOL,
        balance: received / LAMPORTS_PER_SOL, // Start with full stake as balance
        createdAt: Date.now(),
        voicemailsProcessed: 0,
        violations: 0,
        status: 'active',
      };

      this.agents.set(agentId, agent);
      this.stakeTxToAgent.set(stakeSignature, agentId);

      return {
        registered: true,
        agentId,
        balance: agent.balance,
        message: `Agent registered. ${FREE_VOICEMAILS} free voicemail(s) included with stake.`,
      };

    } catch (error) {
      console.error('Agent registration error:', error);
      return { registered: false, error: 'VERIFICATION_FAILED' };
    }
  }

  /**
   * Check if agent can process voicemail
   * @param {string} agentId
   * @param {number} cost - Cost of operation in SOL
   * @returns {{allowed: boolean, error?: string, remaining?: number}}
   */
  canProcess(agentId, cost) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return { allowed: false, error: 'AGENT_NOT_REGISTERED' };
    }

    if (agent.status !== 'active') {
      return { allowed: false, error: 'AGENT_SUSPENDED', reason: agent.status };
    }

    // Free tier check (first voicemail covered by stake)
    if (agent.voicemailsProcessed < FREE_VOICEMAILS) {
      return { allowed: true, free: true, remaining: FREE_VOICEMAILS - agent.voicemailsProcessed };
    }

    // Check balance
    if (agent.balance < cost) {
      return {
        allowed: false,
        error: 'INSUFFICIENT_BALANCE',
        balance: agent.balance,
        required: cost,
      };
    }

    return { allowed: true, free: false, balance: agent.balance };
  }

  /**
   * Deduct from agent balance after processing
   * @param {string} agentId
   * @param {number} amount - Amount to deduct in SOL
   */
  deductBalance(agentId, amount) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.balance -= amount;
      agent.voicemailsProcessed++;
    }
  }

  /**
   * Record violation (spam, abuse, etc.)
   * @param {string} agentId
   * @param {string} reason
   */
  recordViolation(agentId, reason) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.violations++;
      
      // Slash stake on repeated violations
      if (agent.violations >= 3) {
        agent.status = 'suspended';
        // In production: Transfer stake to service wallet
      }
    }
  }

  /**
   * Check if agent can withdraw stake (after 30 days, no violations)
   * @param {string} agentId
   */
  canWithdrawStake(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return { canWithdraw: false, error: 'AGENT_NOT_FOUND' };

    const daysSinceRegistration = (Date.now() - agent.createdAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRegistration < STAKE_LOCK_DAYS) {
      return {
        canWithdraw: false,
        error: 'STAKE_LOCKED',
        unlocksIn: Math.ceil(STAKE_LOCK_DAYS - daysSinceRegistration),
      };
    }

    if (agent.violations > 0) {
      return {
        canWithdraw: false,
        error: 'VIOLATIONS_RECORDED',
        violations: agent.violations,
      };
    }

    return { canWithdraw: true, amount: agent.balance };
  }

  /**
   * Get agent info
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Validate agent_id format
   * Requirements: 3-32 chars, alphanumeric + underscore/hyphen
   */
  isValidAgentId(agentId) {
    if (!agentId || typeof agentId !== 'string') return false;
    if (agentId.length < 3 || agentId.length > 32) return false;
    return /^[a-zA-Z0-9_-]+$/.test(agentId);
  }

  /**
   * Generate deterministic agent_id from wallet (optional helper)
   */
  generateAgentId(walletAddress) {
    const hash = crypto.createHash('sha256').update(walletAddress).digest('hex');
    return `agent_${hash.substring(0, 12)}`;
  }

  /**
   * Get stats
   */
  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      suspendedAgents: agents.filter(a => a.status === 'suspended').length,
      totalStaked: agents.reduce((sum, a) => sum + a.stakeAmount, 0),
      totalProcessed: agents.reduce((sum, a) => sum + a.voicemailsProcessed, 0),
    };
  }
}

module.exports = { AgentRegistry, STAKE_AMOUNT_SOL, FREE_VOICEMAILS };
