/**
 * POST /api/badges/verify
 * 
 * Get a verified badge for your agent
 * Price: 10 USDC one-time, 2 USDC/year renewal
 * 
 * Request:
 * {
 *   "agent_id": "your_agent_id",
 *   "owner": "wallet_or_identifier",
 *   "payment": {
 *     "signature": "solana_tx_signature"
 *   },
 *   "renewal": false
 * }
 */

const { badgeSystem } = require('../../../lib/badges');
const { USDCPaymentVerifier, SERVICE_WALLET } = require('../../../lib/solana');
const { applyRateLimit } = require('../../../lib/rate-limiter');

const paymentVerifier = new USDCPaymentVerifier();

// Pricing
const BADGE_PRICE = 10; // USDC
const RENEWAL_PRICE = 2; // USDC per year

// Rate limit: 3 verifications per hour per IP
const RATE_LIMIT = { maxRequests: 3, windowMs: 3600000 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  // Apply rate limiting
  const allowed = applyRateLimit(req, res, RATE_LIMIT);
  if (!allowed) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many verification attempts. Maximum 3 per hour.',
    });
  }

  try {
    const { agent_id, owner, payment, renewal } = req.body;

    // Validation
    if (!agent_id || !owner || !payment?.signature) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'agent_id, owner, and payment.signature are required'
      });
    }

    // Determine expected amount
    const expectedAmount = renewal ? RENEWAL_PRICE : BADGE_PRICE;

    // Verify USDC payment
    const verification = await paymentVerifier.verifyPayment(
      payment.signature,
      SERVICE_WALLET,
      expectedAmount
    );

    if (!verification.valid) {
      return res.status(402).json({
        error: 'PAYMENT_INVALID',
        message: verification.error,
        expected_amount: expectedAmount,
        currency: 'USDC',
        service_wallet: SERVICE_WALLET.toBase58(),
      });
    }

    // Issue or renew badge
    const badge = renewal
      ? badgeSystem.renewBadge(agent_id, payment.signature)
      : badgeSystem.issueBadge(agent_id, owner, payment.signature);

    return res.status(201).json({
      success: true,
      message: renewal ? 'Badge renewed successfully' : 'Badge issued successfully',
      badge: {
        agent_id: badge.agent_id,
        owner: badge.owner,
        issued_at: badge.issued_at,
        expires_at: badge.expires_at,
        status: badge.status,
      },
      verification_url: `https://realaudio.vercel.app/api/badges/check?agent_id=${agent_id}`,
      payment: {
        amount: expectedAmount,
        currency: 'USDC',
        tx_signature: payment.signature,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'VERIFICATION_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Verification failed'
    });
  }
}
