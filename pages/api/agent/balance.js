/**
 * GET /api/agent/balance?wallet=xxx
 * 
 * Check an agent's USDC balance
 */

const { USDCPaymentVerifier, SERVICE_WALLET, PRICING } = require('../../../lib/solana');

const paymentVerifier = new USDCPaymentVerifier();

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
    const balance = await paymentVerifier.getUSDCBalance(wallet);
    
    // Calculate how many operations they can afford
    const canAfford = {
      voicemail: Math.floor(balance / PRICING.voicemail.process),
      voicemail_priority: Math.floor(balance / PRICING.voicemail.priority),
    };

    return res.status(200).json({
      wallet,
      balance_usdc: balance,
      balance_usd: `$${balance.toFixed(2)}`,
      service_wallet: SERVICE_WALLET,
      usdc_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      can_afford: canAfford,
      pricing: PRICING,
      funded: balance > 0,
      minimum_for_voicemail: balance >= PRICING.voicemail.process,
      note: 'USDC is a stablecoin. 1 USDC = $1.00',
    });

  } catch (error) {
    console.error('Balance check error:', error);
    return res.status(500).json({
      error: 'CHECK_FAILED',
      message: 'Failed to check balance'
    });
  }
}
