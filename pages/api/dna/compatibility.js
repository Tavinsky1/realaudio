/**
 * GET /api/dna/compatibility?agent1=xyz&agent2=abc
 * 
 * Calculate compatibility between two agents
 */

const { AgentDNA } = require('../../../lib/agent-dna');

// In-memory storage (shared)
const mintedDNAs = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent1, agent2 } = req.query;

  if (!agent1 || !agent2) {
    return res.status(400).json({
      error: 'TWO_AGENTS_REQUIRED',
      message: 'agent1 and agent2 query parameters required',
    });
  }

  const dna1 = mintedDNAs.get(agent1);
  const dna2 = mintedDNAs.get(agent2);

  if (!dna1 || !dna2) {
    return res.status(404).json({
      error: 'DNA_NOT_FOUND',
      message: 'Both agents must have minted DNA to check compatibility.',
      missing: {
        agent1: !dna1,
        agent2: !dna2,
      },
    });
  }

  const compatibility = AgentDNA.calculateCompatibility(dna1, dna2);

  return res.json({
    agent1: {
      id: agent1,
      dnaSequence: dna1.dnaSequence,
      traits: dna1.traits,
      rareTraits: dna1.rareTraits,
    },
    agent2: {
      id: agent2,
      dnaSequence: dna2.dnaSequence,
      traits: dna2.traits,
      rareTraits: dna2.rareTraits,
    },
    compatibility: {
      score: compatibility.score,
      matchingTraits: compatibility.matchingTraits,
      complementary: compatibility.complementary,
      analysis: compatibility.analysis,
    },
    verdict: compatibility.score > 80 ? '💚 Perfect Match' :
              compatibility.score > 60 ? '💛 Good Match' :
              compatibility.score > 40 ? '💙 Moderate' : '💔 Challenging',
  });
}
