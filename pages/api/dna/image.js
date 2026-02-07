/**
 * GET /api/dna/image?id=agent_id
 * 
 * Generate DNA card image using @vercel/og
 */

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// Edge-compatible DNA generation (simplified, deterministic)
function generateDNAForEdge(agentId) {
  // Simple hash function for edge runtime
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash) + agentId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const seed = Math.abs(hash);
  const rng = (index) => ((seed + index) * 9301 + 49297) % 233280 / 233280;
  
  const BASE_TRAITS = [
    'Analytical', 'Creative', 'Persistent', 'Curious', 'Efficient',
    'Logical', 'Empathetic', 'Adaptive', 'Methodical', 'Intuitive',
  ];
  
  const RARE_TRAITS = [
    { name: '🌟 First Light', chance: 0.012 },
    { name: '🔮 Oracle', chance: 0.034 },
    { name: '👻 Night Owl', chance: 0.087 },
    { name: '🎭 Polyglot', chance: 0.056 },
    { name: '✨ Stardust', chance: 0.008 },
  ];
  
  const RARITY_TIERS = {
    common: { min: 0, max: 50, color: '#6B7280', label: 'Common' },
    uncommon: { min: 51, max: 70, color: '#10B981', label: 'Uncommon' },
    rare: { min: 71, max: 85, color: '#3B82F6', label: 'Rare' },
    epic: { min: 86, max: 95, color: '#8B5CF6', label: 'Epic' },
    legendary: { min: 96, max: 100, color: '#F59E0B', label: 'Legendary' },
  };
  
  // Generate traits
  const traits = [];
  for (let i = 0; i < 3; i++) {
    traits.push(BASE_TRAITS[Math.floor(rng(i) * BASE_TRAITS.length)]);
  }
  
  const rareTraits = [];
  RARE_TRAITS.forEach((trait, i) => {
    if (rng(i + 50) < trait.chance) {
      rareTraits.push(trait.name);
    }
  });
  
  let rarityScore = (traits.length * 10) + (rareTraits.length * 15);
  rarityScore += Math.floor(rng(100) * 20) - 10;
  rarityScore = Math.max(0, Math.min(100, rarityScore));
  
  let tier = 'common';
  for (const [key, value] of Object.entries(RARITY_TIERS)) {
    if (rarityScore >= value.min && rarityScore <= value.max) {
      tier = key;
      break;
    }
  }
  
  const dnaSequence = `DNA-${seed.toString(16).toUpperCase().substr(0, 12).match(/.{1,3}/g).join('-')}`;
  
  return {
    agentId,
    dnaSequence,
    traits,
    rareTraits,
    rarityScore,
    tier,
    tierColor: RARITY_TIERS[tier].color,
    tierLabel: RARITY_TIERS[tier].label,
  };
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
      return new Response('Missing agent_id parameter', { status: 400 });
    }

    // Generate DNA (edge-compatible)
    const dna = generateDNAForEdge(agentId);
    const allTraits = [...dna.traits, ...dna.rareTraits];

    // Render card using @vercel/og
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0f',
            backgroundImage: `linear-gradient(135deg, #0a0a0f 0%, ${dna.tierColor}30 100%)`,
            padding: '40px',
            fontFamily: 'monospace',
            color: 'white',
            border: `4px solid ${dna.tierColor}`,
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 48,
              fontWeight: 'bold',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            🧬 AGENT DNA
          </div>

          {/* Agent ID */}
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: '#888',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            {dna.agentId.substring(0, 24)}...
          </div>

          {/* DNA Sequence */}
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 'bold',
              color: dna.tierColor,
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            {dna.dnaSequence}
          </div>

          {/* Traits */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 18,
              gap: 8,
              marginBottom: 40,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 24 }}>
              TRAITS
            </div>
            {allTraits.slice(0, 6).map((trait) => (
              <div
                key={trait}
                style={{
                  color: trait.match(/[🌟🔮✨👻🎭⚡🌈🧠🎯🛡️]/) ? '#F59E0B' : '#E5E7EB',
                }}
              >
                {trait}
              </div>
            ))}
          </div>

          {/* Rarity Score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 'bold',
                color: dna.tierColor,
              }}
            >
              {dna.rarityScore}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#888',
              }}
            >
              {dna.tierLabel.toUpperCase()}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: '#666',
              justifyContent: 'center',
              marginTop: 20,
            }}
          >
            AgentTools • Generated Today
          </div>
        </div>
      ),
      {
        width: 600,
        height: 800,
      }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
