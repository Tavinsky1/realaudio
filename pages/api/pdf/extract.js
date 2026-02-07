/**
 * POST /api/pdf/extract
 * 
 * Extract text and data from PDF
 * Price: 0.15 USDC
 */

const { extractTextFromPDF, extractStructuredData, summarizePDF } = require('../../../lib/pdf');
const { USDCPaymentVerifier, SERVICE_WALLET } = require('../../../lib/solana');
const { dedup } = require('../../../lib/dedup');

const PDF_PRICE_USDC = 0.15;

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
    const { pdf_url, mode, type, agent_id, payment } = req.body;

    if (!pdf_url || !agent_id) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Required: pdf_url, agent_id',
      });
    }

    // Validate PDF URL (prevent SSRF attacks)
    try {
      const parsed = new URL(pdf_url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'INVALID_URL', message: 'URL must be HTTP/HTTPS' });
      }
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(10|172\.1[6-9]|172\.2[0-9]|172\.3[01]|192\.168)\./.test(hostname)) {
        return res.status(400).json({ error: 'INVALID_URL', message: 'Private IPs not allowed' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_URL', message: 'Invalid PDF URL' });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(agent_id);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'RATE_LIMITED' });
    }

    // Free tier check
    const used = (global.agentUsage?.get(`${agent_id}:pdf`) || 0);
    const isFreeTier = used < 1;

    if (!isFreeTier && !payment?.signature) {
      return res.status(402).json({
        error: 'PAYMENT_REQUIRED',
        price: PDF_PRICE_USDC,
        currency: 'USDC',
        message: `Free tier exhausted. Send ${PDF_PRICE_USDC} USDC to ${SERVICE_WALLET}`,
      });
    }

    // Verify payment if not free tier
    if (!isFreeTier) {
      const verifier = new USDCPaymentVerifier();
      const result = await verifier.verifyPayment(payment.signature, PDF_PRICE_USDC);
      
      if (!result.valid) {
        return res.status(402).json({
          error: 'INVALID_PAYMENT',
          message: result.error,
        });
      }
      
      dedup.add(payment.signature, { agent_id, service: 'pdf' });
    } else {
      if (!global.agentUsage) global.agentUsage = new Map();
      global.agentUsage.set(`${agent_id}:pdf`, used + 1);
    }

    // Process PDF based on mode
    let extraction;
    switch (mode) {
      case 'structured':
        extraction = await extractStructuredData(pdf_url, type || 'auto');
        break;
      case 'summary':
        extraction = await summarizePDF(pdf_url);
        break;
      default:
        extraction = await extractTextFromPDF(pdf_url);
    }

    return res.json({
      success: true,
      mode: mode || 'text',
      extraction,
      free_tier: isFreeTier,
      charged: isFreeTier ? null : {
        amount: PDF_PRICE_USDC,
        currency: 'USDC',
      },
    });

  } catch (error) {
    console.error('PDF API error:', error);
    return res.status(500).json({
      error: 'EXTRACTION_FAILED',
      message: error.message,
    });
  }
}
