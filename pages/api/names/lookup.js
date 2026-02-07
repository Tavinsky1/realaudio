/**
 * GET /api/names/lookup?name=xyz
 * 
 * Lookup registered name
 */

const { registry } = require('../../../lib/agent-names');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      error: 'NAME_REQUIRED',
      message: 'Provide a name to lookup',
    });
  }

  const registration = registry.lookupName(name);

  if (!registration) {
    return res.status(404).json({
      error: 'NAME_NOT_FOUND',
      message: 'Name not registered',
      available: registry.isAvailable(name),
    });
  }

  return res.json({
    name: registration.name,
    displayName: registration.displayName,
    owner: registration.owner,
    registeredAt: registration.registeredAt,
    pricePaid: registration.pricePaid,
    expiresAt: registration.expiresAt, // null = forever
  });
}
