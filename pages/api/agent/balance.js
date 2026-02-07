/**
 * GET /api/agent/balance?wallet=xxx
 * 
 * Check an agent's wallet balance
 * Useful for agents to verify they have funds before making requests
 */

const { SolanaPaymentVerifier, SERVICE_WALLET, PRICING } = require('../../../lib/solana');

const paymentVerifier = new SolanaPaymentVerifier();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({
      error: 'MISSING_PARAMETER',
      message: 'wallet (public key) is required'
    });
  }

  try {
    const balance = await paymentVerifier.getBalance(wallet);
    
    // Calculate how many operations they can afford
    const canAfford = {
      voicemail_process: Math.floor(balance / PRICING.voicemail.process),
      voicemail_priority: Math.floor(balance / PRICING.voicemail.priority),
      kyc_verify: Math.floor(balance / PRICING.kyc.verify),
    };

    return res.status(200).json({
      wallet,
      balance_sol: balance,
      balance_usd_approx: `$${(balance * 200).toFixed(2)}`, // Approximate at $200/SOL
      service_wallet: SERVICE_WALLET,
      can_afford: canAfford,
      pricing: PRICING,
      funded: balance > 0,
      minimum_for_voicemail: balance >= PRICING.voicemail.process,
    });

  } catch (error) {
    console.error('Balance check error:', error);
    return res.status(500).json({
      error: 'CHECK_FAILED',
      message: 'Failed to check balance'
    });
  }
}
