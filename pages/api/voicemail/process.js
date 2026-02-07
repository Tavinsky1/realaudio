/**
 * POST /api/voicemail/process
 * 
 * Agents submit voicemail audio for processing
 * Payment: Dynamic SOL price (~$0.25 USD)
 * 
 * SECURITY HARDENED VERSION:
 * - Audio validation before processing
 * - Multi-RPC fallback for Solana
 * - Webhook retry queue
 * - Rate limiting
 * - Reduced free tier (1 instead of 3)
 * 
 * Request:
 * {
 *   "audio_url": "https://example.com/voicemail.mp3",
 *   "webhook_url": "https://agent-callback.com/result",
 *   "agent_id": "agent_unique_id",
 *   "payment": {
 *     "signature": "solana_tx_signature",
 *     "sender": "agent_wallet_pubkey"
 *   },
 *   "priority": false
 * }
 */

const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { oracle } = require('../../../lib/pricing');
const { dedup } = require('../../../lib/dedup');
const { validator } = require('../../../lib/validator');
const { audioValidator } = require('../../../lib/audio-validator');
const { rpcManager } = require('../../../lib/solana-rpc');
const { webhookQueue } = require('../../../lib/webhook-queue');
const { VoicemailProcessor } = require('../../../lib/voicemail');
const { analytics } = require('../../../lib/analytics');
const { applyRateLimit, getClientIdentifier } = require('../../../lib/rate-limiter');

// Configuration
const SERVICE_WALLET = new PublicKey(process.env.SERVICE_WALLET || 'YOUR_SERVICE_WALLET_HERE');
const FREE_TIER_LIMIT = 1; // REDUCED from 3 to 1

// Services
const voicemailProcessor = new VoicemailProcessor();

// Rate limiting configuration
// Per-IP rate limit: 10 requests per minute (global protection)
// Per-agent rate limit: 5 requests per minute (agent-specific protection)
const IP_RATE_LIMIT = { maxRequests: 10, windowMs: 60000 };
const AGENT_RATE_LIMIT = { maxRequests: 5, windowMs: 60000 };

const agentRateLimits = new Map();

function checkAgentRateLimit(agentId) {
  const now = Date.now();
  const record = agentRateLimits.get(agentId);
  
  if (!record) {
    const resetTime = now + AGENT_RATE_LIMIT.windowMs;
    agentRateLimits.set(agentId, { count: 1, resetTime });
    return { allowed: true, remaining: AGENT_RATE_LIMIT.maxRequests - 1 };
  }
  
  if (now > record.resetTime) {
    const resetTime = now + AGENT_RATE_LIMIT.windowMs;
    agentRateLimits.set(agentId, { count: 1, resetTime });
    return { allowed: true, remaining: AGENT_RATE_LIMIT.maxRequests - 1 };
  }
  
  record.count++;
  
  if (record.count > AGENT_RATE_LIMIT.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  
  return { allowed: true, remaining: AGENT_RATE_LIMIT.maxRequests - record.count };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // IP-based rate limiting (global protection against DDoS)
    const ipAllowed = applyRateLimit(req, res, IP_RATE_LIMIT);
    if (!ipAllowed) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests from your IP. Maximum 10 per minute.',
      });
    }

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

    // Agent-based rate limiting (per-agent protection)
    const agentRateCheck = checkAgentRateLimit(agent_id);
    if (!agentRateCheck.allowed) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests for this agent. Maximum 5 per minute per agent.',
        retry_after: `${agentRateCheck.retryAfter}s`,
      });
    }

    // Get current pricing
    const serviceType = priority ? 'voicemail_priority' : 'voicemail';
    const pricing = await oracle.getPrice(serviceType);

    // Track free tier usage (in-memory, resets on deploy)
    const used = (global.agentUsage?.get(agent_id) || 0);
    const isFreeTier = used < FREE_TIER_LIMIT;

    if (!isFreeTier) {
      // Paid tier - validate payment
      if (!payment?.signature) {
        return res.status(402).json({
          error: 'PAYMENT_REQUIRED',
          message: `Free tier exhausted (${FREE_TIER_LIMIT} voicemail). Payment required.`,
          pricing,
          service_wallet: SERVICE_WALLET.toString(),
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

      // Verify on Solana with fallback RPCs
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

        // Verify recipient
        const accountKeys = tx.transaction.message.accountKeys.map(k => k.toString());
        const recipientIndex = accountKeys.indexOf(SERVICE_WALLET.toString());

        if (recipientIndex === -1) {
          return res.status(402).json({
            error: 'INVALID_RECIPIENT',
            message: 'Payment was not sent to the correct service wallet.',
            expected: SERVICE_WALLET.toString(),
          });
        }

        // Verify amount
        const preBalance = tx.meta.preBalances[recipientIndex];
        const postBalance = tx.meta.postBalances[recipientIndex];
        const receivedSol = (postBalance - preBalance) / LAMPORTS_PER_SOL;

        const paymentCheck = oracle.isValidPayment(receivedSol, serviceType, pricing.rate);
        
        if (!paymentCheck.valid) {
          return res.status(402).json({
            error: 'INSUFFICIENT_PAYMENT',
            message: 'Payment amount does not match required price.',
            required: { sol: pricing.sol, usd: pricing.usd },
            received: receivedSol,
            tolerance: '5%',
          });
        }

        // Mark as processed
        dedup.add(payment.signature, {
          agent_id,
          service: serviceType,
          amount: receivedSol,
        });

      } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
          error: 'VERIFICATION_FAILED',
          message: 'Failed to verify payment on Solana. All RPC endpoints failed.',
        });
      }
    } else {
      // Free tier - track usage
      if (!global.agentUsage) global.agentUsage = new Map();
      global.agentUsage.set(agent_id, used + 1);
    }

    // Queue the job with webhook
    const processAndNotify = async () => {
      const startTime = Date.now();
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

        // Track successful request in analytics
        const processingTime = Date.now() - startTime;
        analytics.trackRequest({
          agentId: agent_id,
          success: true,
          isFree: isFreeTier,
          amountSol: isFreeTier ? 0 : pricing.sol,
          processingTime,
          intent: result.intent,
          urgency: result.urgency,
        });

        return result;
      } catch (error) {
        console.error('Processing error:', error);
        
        // Track failed request in analytics
        const processingTime = Date.now() - startTime;
        analytics.trackRequest({
          agentId: agent_id,
          success: false,
          isFree: isFreeTier,
          amountSol: 0,
          processingTime,
          error: error.message,
        });
        
        // Notify of failure
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

    return res.status(202).json({
      status: 'queued',
      message: 'Voicemail processing started',
      free_tier: isFreeTier,
      remaining_free: isFreeTier ? FREE_TIER_LIMIT - used - 1 : 0,
      charged: isFreeTier ? null : pricing,
      payment_verified: !isFreeTier,
      eta: priority ? '10s' : '30s',
      _links: {
        pricing: '/api/pricing',
        status: '/api/status',
        docs: 'https://inksky.net/docs/voicemail',
      }
    });

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
