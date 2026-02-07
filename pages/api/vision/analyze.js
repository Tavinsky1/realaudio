/**
 * POST /api/vision/analyze
 * 
 * Analyze image with vision model
 * Price: 0.10 USDC
 */

const { analyzeImage, readText, analyzeUI, detectContent } = require('../../../lib/vision');
const { USDCPaymentVerifier, SERVICE_WALLET } = require('../../../lib/solana');
const { dedup } = require('../../../lib/dedup');

const VISION_PRICE_USDC = 0.10;

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(agentId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimits.has(agentId)) {
    rateLimits.set(agentId, []);
  }
  
  const requests = rateLimits.get(agentId).filter(t => t > windowStart);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: 60 };
  }
  
  requests.push(now);
  rateLimits.set(agentId, requests);
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_url, prompt, mode, agent_id, payment } = req.body;

    if (!image_url || !agent_id) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Required: image_url, agent_id',
      });
    }

    // Validate image URL (prevent SSRF attacks)
    try {
      const parsed = new URL(image_url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'INVALID_URL', message: 'URL must be HTTP/HTTPS' });
      }
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(10|172\.1[6-9]|172\.2[0-9]|172\.3[01]|192\.168)\./.test(hostname)) {
        return res.status(400).json({ error: 'INVALID_URL', message: 'Private IPs not allowed' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_URL', message: 'Invalid image URL' });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(agent_id);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'RATE_LIMITED' });
    }

    // Free tier check
    const used = (global.agentUsage?.get(`${agent_id}:vision`) || 0);
    const isFreeTier = used < 1;

    if (!isFreeTier && !payment?.signature) {
      return res.status(402).json({
        error: 'PAYMENT_REQUIRED',
        price: VISION_PRICE_USDC,
        currency: 'USDC',
        message: `Free tier exhausted. Send ${VISION_PRICE_USDC} USDC to ${SERVICE_WALLET}`,
      });
    }

    // Verify payment if not free tier
    if (!isFreeTier) {
      const verifier = new USDCPaymentVerifier();
      const result = await verifier.verifyPayment(payment.signature, VISION_PRICE_USDC);
      
      if (!result.valid) {
        return res.status(402).json({
          error: 'INVALID_PAYMENT',
          message: result.error,
        });
      }
      
      dedup.add(payment.signature, { agent_id, service: 'vision' });
    } else {
      if (!global.agentUsage) global.agentUsage = new Map();
      global.agentUsage.set(`${agent_id}:vision`, used + 1);
    }

    // Analyze based on mode
    let analysis;
    switch (mode) {
      case 'ocr':
        analysis = await readText(image_url);
        break;
      case 'ui':
        analysis = await analyzeUI(image_url);
        break;
      case 'detect':
        analysis = await detectContent(image_url, prompt || 'object');
        break;
      default:
        analysis = await analyzeImage(image_url, prompt || 'Describe this image');
    }

    return res.json({
      success: true,
      mode: mode || 'describe',
      description: analysis.description,
      free_tier: isFreeTier,
      charged: isFreeTier ? null : {
        amount: VISION_PRICE_USDC,
        currency: 'USDC',
      },
    });

  } catch (error) {
    console.error('Vision API error:', error);
    return res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: error.message,
    });
  }
}
