/**
 * GET /api/badges/stats
 * 
 * Get badge system statistics
 */

const { badgeSystem } = require('../../../lib/badges');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const stats = badgeSystem.getStats();
    const verified = badgeSystem.getAllVerified();

    return res.status(200).json({
      success: true,
      stats,
      verified_agents: verified,
      pricing: {
        initial: '10 USDC (1 year)',
        renewal: '2 USDC per year',
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'STATS_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Stats retrieval failed'
    });
  }
}
