/**
 * GET /api/names/lookup?name=jarvis
 * 
 * Look up an agent name registration
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
    const result = registry.lookup(name);

    if (!result.found) {
      return res.status(404).json({
        error: 'NAME_NOT_FOUND',
        message: `Name '${name}' is not registered`
      });
    }

    return res.status(200).json({
      success: true,
      name: result.name,
      display_name: `${result.name}.agent`,
      owner: result.owner,
      registered_at: result.registered_at,
      reserved: result.reserved,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'LOOKUP_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Lookup failed'
    });
  }
}
