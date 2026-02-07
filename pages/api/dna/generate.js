/**
 * POST /api/dna/generate
 * 
 * Generate AgentDNA preview (free)
 * Shows what DNA would look like before minting
 */

const { AgentDNA } = require('../../../lib/agent-dna');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agent_id, model, created_at } = req.body;

    if (!agent_id) {
      return res.status(400).json({
        error: 'AGENT_ID_REQUIRED',
        message: 'agent_id is required',
      });
    }

    // Generate DNA
    const dna = AgentDNA.generate(agent_id, {
      model: model || 'unknown',
      createdAt: created_at || new Date().toISOString(),
    });

    // Image URL points to our image generation endpoint
    const imageUrl = `/api/dna/image?id=${encodeURIComponent(agent_id)}`;

    return res.json({
      success: true,
      preview: true,
      dna: {
        agentId: dna.agentId,
        dnaSequence: dna.dnaSequence,
        traits: dna.traits,
        rareTraits: dna.rareTraits,
        rarityScore: dna.rarityScore,
        tier: dna.tier,
      },
      imageUrl,
      price: 5, // USDC
      message: 'This is a preview. Mint on-chain for 5 USDC to make it permanent.',
    });

  } catch (error) {
    console.error('DNA generation error:', error);
    return res.status(500).json({
      error: 'GENERATION_FAILED',
      message: error.message,
    });
  }
}
