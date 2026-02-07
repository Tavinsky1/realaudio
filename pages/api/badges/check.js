/**
 * GET /api/badges/check?agent_id=xxx
 * 
 * Check if an agent has a verified badge
 */

const { badgeSystem } = require('../../../lib/badges');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { agent_id } = req.query;

  if (!agent_id) {
    return res.status(400).json({
      error: 'MISSING_PARAMETER',
      message: 'agent_id parameter is required'
    });
  }

  try {
    const result = badgeSystem.isVerified(agent_id);

    if (!result.verified) {
      return res.status(200).json({
        verified: false,
        agent_id,
        expired: result.expired || false,
message: result.expired ? 'Badge expired, renew for 2 USDC' : 'Agent not verified',
      });
    }

    return res.status(200).json({
      verified: true,
      agent_id,
      badge: {
        issued_at: result.badge.issued_at,
        expires_at: result.badge.expires_at,
        status: result.badge.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'CHECK_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Check failed'
    });
  }
}
