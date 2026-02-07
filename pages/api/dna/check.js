/**
 * GET /api/dna/check?agent_id=xyz
 * 
 * Check if agent has DNA and get info
 */

// In-memory storage (shared with mint.js)
const mintedDNAs = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent_id } = req.query;

  if (!agent_id) {
    return res.status(400).json({
      error: 'AGENT_ID_REQUIRED',
      message: 'agent_id query parameter required',
    });
  }

  const dna = mintedDNAs.get(agent_id);

  if (!dna) {
    return res.status(404).json({
      error: 'DNA_NOT_FOUND',
      message: 'This agent has not minted DNA yet.',
      mintUrl: '/dna/mint',
      price: 5,
    });
  }

  return res.json({
    found: true,
    dna: {
      agentId: dna.agentId,
      dnaSequence: dna.dnaSequence,
      traits: dna.traits,
      rareTraits: dna.rareTraits,
      rarityScore: dna.rarityScore,
      tier: dna.tier,
      ownerWallet: dna.ownerWallet,
      imageUrl: dna.imageUrl,
      assetId: dna.assetId,
      mintedAt: dna.mintedAt,
    },
  });
}
