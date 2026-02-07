/**
 * GET /api/health
 * 
 * Basic health check - public
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  return res.status(200).json({
    service: 'AgentVoicemail',
    status: 'operational',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      pricing: '/api/pricing',
      process: '/api/voicemail/process (POST)',
      status: '/api/voicemail/status (GET)',
    },
  });
}
