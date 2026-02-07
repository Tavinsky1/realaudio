/**
 * POST /api/names/register
 * 
 * Register an agent name
 */

const { PublicKey } = require('@solana/web3.js');
const { registry } = require('../../../lib/agent-names');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, owner_wallet, payment_tx } = req.body;

    if (!name || !owner_wallet || !payment_tx) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Required: name, owner_wallet, payment_tx',
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
