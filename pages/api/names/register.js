/**
 * POST /api/names/register
 * 
 * Register an agent name
 */

const { PublicKey } = require('@solana/web3.js');
const { registry } = require('../../../lib/agent-names');

// Rate limiting - prevent spam registrations
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 registrations per hour per IP

function checkRateLimit(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  
  const requests = rateLimits.get(ip).filter(t => t > windowStart);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: 3600 };
  }
  
  requests.push(now);
  rateLimits.set(ip, requests);
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit
  const rateCheck = checkRateLimit(req);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: `Too many registration attempts. Try again in ${Math.ceil(rateCheck.retryAfter / 60)} minutes.`,
      retry_after_seconds: rateCheck.retryAfter
    });
  }

  try {
    const { name, owner_wallet, payment_tx } = req.body;

    if (!name || !owner_wallet || !payment_tx) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Required: name, owner_wallet, payment_tx',
      });
    }

    // Sanitize inputs to prevent injection attacks
    if (typeof name !== 'string' || name.length > 32) {
      return res.status(400).json({
        error: 'INVALID_NAME',
        message: 'Name must be a string (max 32 characters)'
      });
    }

    if (typeof payment_tx !== 'string' || payment_tx.length > 100) {
      return res.status(400).json({
        error: 'INVALID_TRANSACTION',
        message: 'Transaction signature invalid'
      });
    }

    // Validate wallet address
    try {
      new PublicKey(owner_wallet);
    } catch {
      return res.status(400).json({
        error: 'INVALID_WALLET',
        message: 'Invalid Solana wallet address',
      });
    }

    // Register
    const result = await registry.registerName(name, owner_wallet, payment_tx);

    if (!result.success) {
      return res.status(400).json({
        error: 'REGISTRATION_FAILED',
        errors: result.errors || [result.error],
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      name: result.name,
      owner: result.owner,
      price: result.price,
      tier: result.tier,
      message: `Congratulations! You now own ${result.name}.agent`,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Registration failed',
    });
  }
}
