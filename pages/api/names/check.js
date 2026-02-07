/**
 * GET /api/names/check?name=xyz
 * 
 * Check name availability and price
 */

const { registry } = require('../../../lib/agent-names');

// Rate limiting - prevent DDoS
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 checks per minute per IP

function checkRateLimit(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  
  const requests = rateLimits.get(ip).filter(t => t > windowStart);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }
  
  requests.push(now);
  rateLimits.set(ip, requests);
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit
  const rateCheck = checkRateLimit(req);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests. Try again in 60 seconds.'
    });
  }

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      error: 'NAME_REQUIRED',
      message: 'Provide a name to check',
    });
  }

  const validation = registry.validateName(name);
  const pricing = registry.getPrice(name);
  const isAvailable = registry.isAvailable(name);
  const suggestions = !isAvailable ? registry.searchAvailable(name) : [];

  return res.json({
    name: name,
    normalized: validation.normalized,
    available: isAvailable,
    valid: validation.valid,
    errors: validation.errors,
    pricing: {
      price: pricing.price,
      currency: 'USDC',
      usd_equiv: `$${pricing.price}`,
      tier: pricing.tier,
      label: pricing.label,
    },
    suggestions: suggestions,
  });
}
