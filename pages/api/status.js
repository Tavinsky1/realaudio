/**
 * GET /api/status
 * 
 * Public status page showing:
 * - Current SOL/USD rate
 * - API health
 * - Service stats
 * - Recent activity
 * 
 * Builds trust with agents before they pay
 */

const { oracle } = require('../../lib/pricing');
const { rpcManager } = require('../../lib/solana-rpc');
const { webhookQueue } = require('../../lib/webhook-queue');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // Gather metrics
    const pricing = await oracle.getAllPrices();
    const solanaHealth = await rpcManager.healthCheck();
    const webhookStats = webhookQueue.getStats();

    // Calculate uptime (Vercel resets on deploy, so this is per-deploy)
    const uptime = process.uptime();
    const uptimeFormatted = {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime),
    };

    // Response
    const status = {
      service: 'AgentTools',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      
      pricing: {
        current: pricing,
        updated_at: pricing.timestamp,
      },
      
      infrastructure: {
        solana: {
          status: solanaHealth.some(h => h.healthy) ? 'healthy' : 'degraded',
          endpoints: solanaHealth.map(h => ({
            url: h.endpoint,
            healthy: h.healthy,
            latency: h.latency,
          })),
        },
        webhooks: {
          queue_length: webhookStats.queueLength,
          delivered: webhookStats.delivered,
          pending: webhookStats.pending,
          failed: webhookStats.failed,
        },
      },
      
      service: {
        uptime: uptimeFormatted,
        free_tier: {
          enabled: true,
          limit: 1, // Updated to 1
          message: '1 free voicemail per registered agent',
        },
        limits: {
          max_audio_duration: '120 seconds',
          max_file_size: '10 MB',
          rate_limit: '10 requests/minute per agent',
        },
      },
      
      endpoints: {
        pricing: '/api/pricing',
        health: '/api/health',
        voicemail: '/api/voicemail/process',
        status: '/api/voicemail/status',
      },
      
      links: {
        docs: '/api/docs',
        github: 'https://github.com/Tavinsky1/realaudio',
        moltbook: 'https://moltbook.com/u/AgentVoicemail',
      },
    };

    return res.status(200).json(status);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      service: 'AgentTools',
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
