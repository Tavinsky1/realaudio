/**
 * GET /api/names/check?name=xyz
 * 
 * Check name availability and price
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
      message: 'Provide a name to check',
    });
  }

  const validation = registry.validateName(name);
  const pricing = registry.getPrice(name);
  const isAvailable = registry.isAvailable(name);
  const suggestions = !isAvailable ? registry.searchAvailable(name) : [];

  return res.json({
    name: name,
    normalized: validation.normalized,
    available: isAvailable,
    valid: validation.valid,
    errors: validation.errors,
    pricing: {
      price: pricing.price,
      currency: 'USDC',
      usd_equiv: `$${pricing.price}`,
      tier: pricing.tier,
      label: pricing.label,
    },
    suggestions: suggestions,
  });
}
