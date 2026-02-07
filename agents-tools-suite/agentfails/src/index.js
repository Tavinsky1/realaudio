/**
 * AgentFails Core Implementation
 * 
 * Failure logging with anti-gaming protections:
 * - Proof of work
 * - Rate limiting
 * - Reputation staking
 * - Sampling verification
 */

const { PublicKey } = require('@solana/web3.js');
const crypto = require('crypto');

// Configuration
const PAYMENT_PER_LOG_SOL = 0.0001;  // ~$0.02
const MAX_LOGS_PER_DAY = 100;
const DIFFICULTY = 4;  // Number of leading zeros required in PoW

// In-memory storage (replace with Redis in production)
const logs = new Map();
const agentStats = new Map();
const usedProofs = new Set();

/**
 * Validate proof of work
 * @param {string} nonce - Agent-provided nonce
 * @param {string} hash - SHA256(nonce + challenge)
 * @param {number} difficulty - Required leading zeros
 */
function validateProofOfWork(nonce, hash, difficulty = DIFFICULTY) {
  const challenge = getDailyChallenge();
  const expectedHash = crypto
    .createHash('sha256')
    .update(nonce + challenge)
    .digest('hex');
  
  if (hash !== expectedHash) {
    return { valid: false, error: 'INVALID_HASH' };
  }
  
  const prefix = '0'.repeat(difficulty);
  if (!hash.startsWith(prefix)) {
    return { valid: false, error: 'INSUFFICIENT_DIFFICULTY' };
  }
  
  if (usedProofs.has(hash)) {
    return { valid: false, error: 'PROOF_ALREADY_USED' };
  }
  
  return { valid: true };
}

/**
 * Get daily challenge (rotates every 24 hours)
 */
function getDailyChallenge() {
  const today = new Date().toISOString().split('T')[0];
  return crypto
    .createHash('sha256')
    .update(`agentfails-challenge-${today}-${process.env.CHALLENGE_SECRET || 'default'}`)
    .digest('hex');
}

/**
 * Check rate limit for agent
 */
function checkRateLimit(agentId) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${agentId}:${today}`;
  
  const stats = agentStats.get(key) || { count: 0, lastReset: Date.now() };
  
  if (stats.count >= MAX_LOGS_PER_DAY) {
    return { allowed: false, retryAfter: '24h' };
  }
  
  return { allowed: true, remaining: MAX_LOGS_PER_DAY - stats.count };
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(agentId) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${agentId}:${today}`;
  
  const stats = agentStats.get(key) || { count: 0 };
  stats.count++;
  agentStats.set(key, stats);
}

/**
 * Calculate reputation score
 * Based on: validation rate, consistency, stake
 */
function calculateReputation(agentId) {
  const stats = getAgentStats(agentId);
  
  // Base score
  let score = 50;
  
  // +10 for each validated log (up to +30)
  score += Math.min(stats.validatedLogs * 2, 30);
  
  // +20 for staking
  if (stats.staked) score += 20;
  
  // -20 for rejected logs
  score -= stats.rejectedLogs * 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get agent stats
 */
function getAgentStats(agentId) {
  // In production: query database
  return {
    totalLogs: 0,
    validatedLogs: 0,
    rejectedLogs: 0,
    staked: false,
    lastActive: null,
  };
}

/**
 * Validate failure log data
 */
function validateLogData(data) {
  const errors = [];
  
  if (!data.agent_id || data.agent_id.length < 3) {
    errors.push('Invalid agent_id');
  }
  
  if (!data.failure_type) {
    errors.push('failure_type required');
  }
  
  if (!data.payment_address) {
    errors.push('payment_address required');
  } else {
    try {
      new PublicKey(data.payment_address);
    } catch {
      errors.push('Invalid payment_address');
    }
  }
  
  if (!data.proof_of_work?.nonce || !data.proof_of_work?.hash) {
    errors.push('proof_of_work required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and normalize log data
 */
function sanitizeLog(data) {
  // Hash agent_id for privacy
  const hashedAgentId = crypto
    .createHash('sha256')
    .update(data.agent_id)
    .digest('hex')
    .substring(0, 16);
  
  // Normalize URL (remove PII)
  let normalizedUrl = null;
  if (data.context?.url) {
    try {
      const url = new URL(data.context.url);
      normalizedUrl = `${url.protocol}//${url.hostname}${url.pathname}`;
    } catch {
      normalizedUrl = null;
    }
  }
  
  return {
    ...data,
    agent_id: hashedAgentId,
    context: {
      ...data.context,
      url: normalizedUrl,
      // Remove any potentially sensitive fields
      api_key: undefined,
      password: undefined,
      token: undefined,
    },
    received_at: new Date().toISOString(),
  };
}

/**
 * Log a failure
 * Main entry point
 */
async function logFailure(data) {
  // 1. Validate data structure
  const validation = validateLogData(data);
  if (!validation.valid) {
    return { success: false, error: 'VALIDATION_FAILED', details: validation.errors };
  }
  
  // 2. Check rate limit
  const rateCheck = checkRateLimit(data.agent_id);
  if (!rateCheck.allowed) {
    return { success: false, error: 'RATE_LIMITED', retry_after: rateCheck.retryAfter };
  }
  
  // 3. Validate proof of work
  const powCheck = validateProofOfWork(
    data.proof_of_work.nonce,
    data.proof_of_work.hash,
    data.proof_of_work.difficulty || DIFFICULTY
  );
  
  if (!powCheck.valid) {
    return { success: false, error: 'INVALID_PROOF', details: powCheck.error };
  }
  
  // 4. Sanitize data
  const sanitized = sanitizeLog(data);
  
  // 5. Store log
  const logId = crypto.randomUUID();
  logs.set(logId, {
    ...sanitized,
    id: logId,
    status: 'pending_validation',
  });
  
  // 6. Mark proof as used
  usedProofs.add(data.proof_of_work.hash);
  
  // 7. Increment rate limit
  incrementRateLimit(data.agent_id);
  
  // 8. Queue for validation sampling (1% are manually verified)
  const shouldSample = Math.random() < 0.01;
  if (shouldSample) {
    queueForValidation(logId);
  }
  
  // 9. Send payment (in production: use Solana web3.js)
  const paymentTx = await sendPayment(data.payment_address, PAYMENT_PER_LOG_SOL);
  
  // 10. Update log status
  const log = logs.get(logId);
  log.status = 'paid';
  log.payment_tx = paymentTx;
  log.paid_at = new Date().toISOString();
  logs.set(logId, log);
  
  // 11. Calculate reputation
  const reputation = calculateReputation(data.agent_id);
  
  return {
    success: true,
    log_id: logId,
    payment_tx: paymentTx,
    amount_sol: PAYMENT_PER_LOG_SOL,
    amount_usd: PAYMENT_PER_LOG_SOL * 200, // Approximate
    reputation_score: reputation,
  };
}

/**
 * Send SOL payment (mock - replace with real implementation)
 */
async function sendPayment(address, amount) {
  // TODO: Implement actual Solana payment
  // For now, return mock tx
  return `mock_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Queue log for manual validation sampling
 */
function queueForValidation(logId) {
  console.log(`[SAMPLE] Log ${logId} queued for validation`);
  // In production: Add to validation queue, notify admin
}

/**
 * Get public statistics
 */
function getPublicStats() {
  const allLogs = Array.from(logs.values());
  const today = new Date().toISOString().split('T')[0];
  
  // Count by failure type
  const failureTypes = {};
  const apiFailures = {};
  
  for (const log of allLogs) {
    // Failure types
    const type = log.failure_type || 'unknown';
    failureTypes[type] = (failureTypes[type] || 0) + 1;
    
    // API failures
    if (log.context?.api_endpoint) {
      const api = log.context.api_endpoint;
      apiFailures[api] = (apiFailures[api] || 0) + 1;
    }
  }
  
  // Top failure types
  const topFailureTypes = Object.entries(failureTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const total = allLogs.length;
  topFailureTypes.forEach(t => {
    t.percentage = Math.round((t.count / total) * 100);
  });
  
  // Top APIs
  const topApis = Object.entries(apiFailures)
    .map(([api, failures]) => ({ api, failures }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 5);
  
  return {
    total_failures_logged: allLogs.length,
    total_paid_out_sol: allLogs.filter(l => l.payment_tx).length * PAYMENT_PER_LOG_SOL,
    active_agents: new Set(allLogs.map(l => l.agent_id)).size,
    top_failure_types: topFailureTypes,
    top_apis_failing: topApis,
    daily_volume: getDailyVolume(),
  };
}

/**
 * Get daily volume for last 7 days
 */
function getDailyVolume() {
  const volumes = [];
  const allLogs = Array.from(logs.values());
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const count = allLogs.filter(l => 
      l.received_at && l.received_at.startsWith(dateStr)
    ).length;
    
    volumes.push({ date: dateStr, count });
  }
  
  return volumes;
}

/**
 * Query logs (paid endpoint)
 */
function queryLogs(filters, apiKey) {
  // TODO: Validate API key
  // TODO: Apply filters
  // TODO: Return aggregated data
  
  return {
    query_id: crypto.randomUUID(),
    results: [],
    total_count: 0,
  };
}

module.exports = {
  logFailure,
  getPublicStats,
  queryLogs,
  getDailyChallenge,
  DIFFICULTY,
  PAYMENT_PER_LOG_SOL,
  MAX_LOGS_PER_DAY,
};
