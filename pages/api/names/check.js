/**
 * GET /api/names/check?name=jarvis
 * 
 * Check if agent name is available and get pricing
 */

const { registry } = require('../../../lib/agent-names');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      error: 'MISSING_PARAMETER',
      message: 'name parameter is required'
    });
  }

  try {
    const availability = registry.isAvailable(name);
    const pricing = registry.getPrice(name);

    return res.status(200).json({
      name: name.toLowerCase().trim(),
      available: availability.available,
      reason: availability.reason || null,
      price: availability.available ? pricing : null,
      display_name: `${name.toLowerCase().trim()}.agent`,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Check failed'
    });
  }
}
