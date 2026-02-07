/**
 * POST /api/voicemail/process
 * 
 * Agents submit voicemail audio for processing
 * Payment: 0.25 USDC (stable, no volatility)
 * 
 * Request:
 * {
 *   "audio_url": "https://example.com/voicemail.mp3",
 *   "webhook_url": "https://agent-callback.com/result",
 *   "agent_id": "agent_unique_id",
 *   "payment": {
 *     "signature": "solana_tx_signature",
 *     "token": "USDC"
 *   },
 *   "priority": false
 * }
 */

const { USDCPaymentVerifier, PRICE_PER_VOICEMAIL_USDC, SERVICE_WALLET } = require('../../../lib/solana');
const { oracle } = require('../../../lib/pricing');
const { dedup } = require('../../../lib/dedup');
const { validator } = require('../../../lib/validator');
const { audioValidator } = require('../../../lib/audio-validator');
const { rpcManager } = require('../../../lib/solana-rpc');
const { webhookQueue } = require('../../../lib/webhook-queue');
const { VoicemailProcessor } = require('../../../lib/voicemail');

// Configuration
const FREE_TIER_LIMIT = 1;

// Services
const paymentVerifier = new USDCPaymentVerifier();
const voicemailProcessor = new VoicemailProcessor();

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

// Idempotency cache - prevents duplicate processing of same voicemail
const idempotencyCache = new Map();
const IDEMPOTENCY_TTL = 5 * 60 * 1000; // 5 minutes

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

function getIdempotencyKey(audioUrl, agentId) {
  return `${agentId}:${audioUrl}`;
}

function checkIdempotency(audioUrl, agentId) {
  const key = getIdempotencyKey(audioUrl, agentId);
  const now = Date.now();
  
  // Clean expired entries
  for (const [k, v] of idempotencyCache.entries()) {
    if (now - v.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(k);
    }
  }
  
  const cached = idempotencyCache.get(key);
  if (cached) {
    return { isDuplicate: true, previousResponse: cached.response };
  }
  
  return { isDuplicate: false };
}

function cacheResponse(audioUrl, agentId, response) {
  const key = getIdempotencyKey(audioUrl, agentId);
  idempotencyCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // Validate request body
    const validation = await validator.validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        errors: validation.errors,
      });
    }

    const { audio_url, webhook_url, agent_id, payment, priority } = req.body;

    // Validate audio URL
    const audioCheck = await audioValidator.validate(audio_url);
    if (!audioCheck.valid) {
      return res.status(400).json({
        error: 'AUDIO_VALIDATION_FAILED',
        errors: audioCheck.errors,
      });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(agent_id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests. Maximum 10 per minute per agent.',
        retry_after: `${rateCheck.retryAfter}s`,
      });
    }

    // Idempotency check - prevent duplicate processing
    const idempotencyCheck = checkIdempotency(audio_url, agent_id);
    if (idempotencyCheck.isDuplicate) {
      return res.status(200).json({
        ...idempotencyCheck.previousResponse,
        idempotent: true,
        message: 'Duplicate request detected. Returning cached response.'
      });
    }

    // Get current pricing (fixed USDC)
    const serviceType = priority ? 'voicemail_priority' : 'voicemail';
    const pricing = await oracle.getPrice(serviceType);

    // Track free tier usage
    const used = (global.agentUsage?.get(agent_id) || 0);
    const isFreeTier = used < FREE_TIER_LIMIT;

    if (!isFreeTier) {
      // Paid tier - validate payment
      if (!payment?.signature) {
        return res.status(402).json({
          error: 'PAYMENT_REQUIRED',
          message: `Free tier exhausted (${FREE_TIER_LIMIT} voicemail). Payment required.`,
          pricing,
          service_wallet: SERVICE_WALLET,
          payment_instructions: {
            amount: PRICE_PER_VOICEMAIL_USDC,
            currency: 'USDC',
            network: 'Solana',
            recipient: SERVICE_WALLET,
            note: 'Send USDC (SPL token), not SOL',
          },
          free_tier_used: used,
        });
      }

      // Check for duplicate payment
      if (dedup.has(payment.signature)) {
        return res.status(402).json({
          error: 'DUPLICATE_PAYMENT',
          message: 'This transaction has already been used.',
        });
      }

      // Verify USDC payment
      try {
        const tx = await rpcManager.verifyTransaction(payment.signature);

        if (!tx) {
          return res.status(402).json({
            error: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found on Solana. Wait a few seconds and retry.',
          });
        }

        // Check age (< 5 minutes)
        const txTime = tx.blockTime * 1000;
        if (Date.now() - txTime > 5 * 60 * 1000) {
          return res.status(402).json({
            error: 'TRANSACTION_EXPIRED',
            message: 'Transaction is older than 5 minutes. Create a new payment.',
          });
        }

        // Parse and verify USDC amount
        const usdcTransfer = paymentVerifier.parseUSDCTransfer(tx, SERVICE_WALLET);
        
        if (!usdcTransfer) {
          return res.status(402).json({
            error: 'NO_USDC_FOUND',
            message: 'No USDC transfer found in transaction. Did you send SOL instead of USDC?',
            expected: 'USDC (SPL token)',
            recipient: SERVICE_WALLET,
          });
        }

        const paymentCheck = oracle.isValidPayment(usdcTransfer.amount, serviceType);
        
        if (!paymentCheck.valid) {
          return res.status(402).json({
            error: 'INSUFFICIENT_PAYMENT',
            message: 'Payment amount does not match required price.',
            required: { usdc: pricing.amount, usd: pricing.usd_equiv },
            received: usdcTransfer.amount,
            currency: 'USDC',
          });
        }

        // Mark as processed
        dedup.add(payment.signature, {
          agent_id,
          service: serviceType,
          amount: usdcTransfer.amount,
          currency: 'USDC',
        });

      } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
          error: 'VERIFICATION_FAILED',
          message: 'Failed to verify payment on Solana.',
        });
      }
    } else {
      // Free tier - track usage
      if (!global.agentUsage) global.agentUsage = new Map();
      global.agentUsage.set(agent_id, used + 1);
    }

    // Queue the job with webhook
    const processAndNotify = async () => {
      try {
        const result = await voicemailProcessor.processVoicemail({
          audioUrl: audio_url,
          agentId: agent_id,
          webhookUrl: webhook_url,
          paymentSignature: payment?.signature || 'FREE_TIER',
        });

        // Store result and queue webhook
        await webhookQueue.storeAndNotify(
          result.jobId,
          agent_id,
          webhook_url,
          {
            job_id: result.jobId,
            agent_id: agent_id,
            status: 'completed',
            ...result,
          }
        );

        return result;
      } catch (error) {
        console.error('Processing error:', error);
        
        await webhookQueue.storeAndNotify(
          'failed_' + Date.now(),
          agent_id,
          webhook_url,
          {
            agent_id: agent_id,
            status: 'failed',
            error: error.message,
          }
        );
        
        throw error;
      }
    };

    // Start processing (don't await, return immediately)
    processAndNotify();

    const response = {
      status: 'queued',
      message: 'Voicemail processing started',
      free_tier: isFreeTier,
      remaining_free: isFreeTier ? FREE_TIER_LIMIT - used - 1 : 0,
      charged: isFreeTier ? null : {
        amount: pricing.amount,
        currency: 'USDC',
        usd_equiv: pricing.usd_equiv,
      },
      payment_verified: !isFreeTier,
      eta: priority ? '10s' : '30s',
      _links: {
        pricing: '/api/pricing',
        status: '/api/status',
      }
    };

    // Cache response for idempotency
    cacheResponse(audio_url, agent_id, response);

    return res.status(202).json(response);

  } catch (error) {
    console.error('Process voicemail error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export { voicemailProcessor };
