/**
 * GET /api/health
 * 
 * Health check + current pricing info
 * Agents can call this to calculate costs client-side
 */

const { oracle } = require('../../lib/pricing');
const { dedup } = require('../../lib/dedup');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const pricing = await oracle.getAllPrices();
    const stats = dedup.stats();

    return res.status(200).json({
      status: 'healthy',
      service: 'AgentWallet Protocol',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pricing,
      stats: {
        transactions_tracked: stats.totalTracked,
        free_tier_limit: 1,
      },
      endpoints: {
        pricing: '/api/pricing',
        voicemail: '/api/voicemail/process',
        balance: '/api/agent/balance',
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}
