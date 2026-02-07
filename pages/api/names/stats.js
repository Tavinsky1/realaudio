/**
 * GET /api/names/stats
 * 
 * Get agent name registry statistics
 */

const { registry } = require('../../../lib/agent-names');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const stats = registry.getStats();

    return res.status(200).json({
      success: true,
      stats: {
        total_names: stats.total_names,
        registered_names: stats.registered_names,
        reserved_names: stats.reserved_names,
      },
      latest_registrations: stats.latest_registrations,
      pricing: {
        regular: { tier: 'regular (5+ chars)', price: '5 USDC' },
        premium: { tier: 'premium (4 chars)', price: '25 USDC' },
        ultra: { tier: 'ultra (3 chars)', price: '100 USDC' },
        legendary: { tier: 'legendary (1-2 chars, dictionary)', price: '250 USDC' },
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'STATS_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Stats retrieval failed'
    });
  }
}
