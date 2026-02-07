/**
 * POST /api/names/register
 * 
 * Register an agent name (after USDC payment)
 * 
 * Request:
 * {
 *   "name": "jarvis",
 *   "owner": "agent_id or wallet",
 *   "payment": {
 *     "signature": "solana_tx_signature"
 *   }
 * }
 */

const { registry } = require('../../../lib/agent-names');
const { USDCPaymentVerifier, SERVICE_WALLET } = require('../../../lib/solana');
const { applyRateLimit } = require('../../../lib/rate-limiter');

const paymentVerifier = new USDCPaymentVerifier();

// Rate limit: 5 registrations per hour per IP
const RATE_LIMIT = { maxRequests: 5, windowMs: 3600000 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  // Apply rate limiting
  const allowed = applyRateLimit(req, res, RATE_LIMIT);
  if (!allowed) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many registration attempts. Maximum 5 per hour.',
    });
  }

  try {
    const { name, owner, payment } = req.body;

    // Validation
    if (!name || !owner || !payment?.signature) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'name, owner, and payment.signature are required'
      });
    }

    // Check availability
    const availability = registry.isAvailable(name);
    if (!availability.available) {
      return res.status(400).json({
        error: 'NAME_UNAVAILABLE',
        message: availability.reason
      });
    }

    // Get pricing
    const pricing = registry.getPrice(name);
    const expectedAmount = pricing.amount;

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

    // Register the name
    const result = registry.register(name, owner, payment.signature);

    return res.status(201).json({
      success: true,
      message: `Name registered: ${name}.agent`,
      name: result.name,
      display_name: `${result.name}.agent`,
      owner: result.owner,
      registered_at: result.registered_at,
      display_url: result.display_url,
      payment: {
        amount: expectedAmount,
        currency: 'USDC',
        tx_signature: payment.signature,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'REGISTRATION_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed'
    });
  }
}
