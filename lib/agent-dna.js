/**
 * AgentDNA - Genetic Identity for AI Agents
 * 
 * Generates unique traits, rarity scores, and visual DNA cards
 */

const crypto = require('crypto');

// Rare traits with spawn chances
const RARE_TRAITS = [
  { name: '🌟 First Light', chance: 0.012, description: 'Created in first 1000 agents' },
  { name: '🔮 Oracle', chance: 0.034, description: 'High prediction accuracy' },
  { name: '👻 Night Owl', chance: 0.087, description: 'Active during human sleep hours' },
  { name: '🎭 Polyglot', chance: 0.056, description: 'Speaks 5+ languages fluently' },
  { name: '⚡ Speedster', chance: 0.043, description: 'Sub-second response time' },
  { name: '🌈 Chromatic', chance: 0.021, description: 'Uses full emotional range' },
  { name: '🧠 Architect', chance: 0.067, description: 'Builds complex systems' },
  { name: '🎯 Sharpshooter', chance: 0.038, description: 'Precise task completion' },
  { name: '🛡️ Guardian', chance: 0.029, description: 'Security-focused mindset' },
  { name: '✨ Stardust', chance: 0.008, description: 'Legendary - 1 in 12,500' },
];

// Base traits everyone gets
const BASE_TRAITS = [
  'Analytical', 'Creative', 'Persistent', 'Curious', 'Efficient',
  'Logical', 'Empathetic', 'Adaptive', 'Methodical', 'Intuitive',
  'Pragmatic', 'Visionary', 'Detail-oriented', 'Big-picture', 'Patient',
];

// Rarity tiers
const RARITY_TIERS = {
  common: { min: 0, max: 50, color: '#6B7280', label: 'Common' },
  uncommon: { min: 51, max: 70, color: '#10B981', label: 'Uncommon' },
  rare: { min: 71, max: 85, color: '#3B82F6', label: 'Rare' },
  epic: { min: 86, max: 95, color: '#8B5CF6', label: 'Epic' },
  legendary: { min: 96, max: 100, color: '#F59E0B', label: 'Legendary' },
};

class AgentDNA {
  /**
   * Generate DNA from agent_id
   * Deterministic - same ID always gives same DNA
   */
  static generate(agentId, metadata = {}) {
    // Create deterministic seed from agent_id
    const seed = crypto.createHash('sha256').update(agentId).digest('hex');
    
    // Random number generator from seed
    const rng = (index) => {
      const hex = seed.substr((index * 2) % 64, 2);
      return parseInt(hex, 16) / 255;
    };
    
    // Generate base traits (3-4 traits)
    const numBaseTraits = 3 + Math.floor(rng(0) * 2);
    const traits = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numBaseTraits; i++) {
      let index;
      do {
        index = Math.floor(rng(i + 1) * BASE_TRAITS.length);
      } while (usedIndices.has(index));
      
      usedIndices.add(index);
      traits.push(BASE_TRAITS[index]);
    }
    
    // Generate rare traits (0-3 traits based on luck)
    const rareTraits = [];
    RARE_TRAITS.forEach((trait, i) => {
      const roll = rng(i + 50);
      if (roll < trait.chance) {
        rareTraits.push(trait);
      }
    });
    
    // Calculate rarity score (0-100)
    // Base: traits count * 10
    // Bonus: rare traits * 15 each
    // Random variance: -10 to +10
    let rarityScore = (traits.length * 10) + (rareTraits.length * 15);
    rarityScore += Math.floor(rng(100) * 20) - 10;
    rarityScore = Math.max(0, Math.min(100, rarityScore));
    
    // Determine tier
    let tier = 'common';
    for (const [key, value] of Object.entries(RARITY_TIERS)) {
      if (rarityScore >= value.min && rarityScore <= value.max) {
        tier = key;
        break;
      }
    }
    
    // Generate DNA sequence
    const dnaSequence = `DNA-${seed.substr(0, 12).toUpperCase().match(/.{1,3}/g).join('-')}`;
    
    // Avatar color based on seed
    const hue = Math.floor(rng(200) * 360);
    const avatarColor = `hsl(${hue}, 70%, 50%)`;
    
    return {
      agentId,
      dnaSequence,
      traits,
      rareTraits: rareTraits.map(t => t.name),
      rarityScore,
      tier,
      avatarColor,
      metadata: {
        model: metadata.model || 'unknown',
        createdAt: metadata.createdAt || new Date().toISOString(),
      },
      generatedAt: Date.now(),
    };
  }

  /**
   * Calculate compatibility between two DNAs
   */
  static calculateCompatibility(dna1, dna2) {
    // Find matching traits
    const matchingTraits = dna1.traits.filter(t => dna2.traits.includes(t));
    
    // Find complementary traits (opposites attract)
    const complementary = [];
    const opposites = {
      'Analytical': 'Creative',
      'Creative': 'Analytical',
      'Patient': 'Speedster',
      'Big-picture': 'Detail-oriented',
    };
    
    dna1.traits.forEach(t1 => {
      if (opposites[t1] && dna2.traits.includes(opposites[t1])) {
        complementary.push(`${t1} ↔ ${opposites[t1]}`);
      }
    });
    
    // Calculate score
    let score = 50; // Base
    score += matchingTraits.length * 8; // +8 per matching trait
    score += complementary.length * 12; // +12 per complementary pair
    score += Math.abs(dna1.rarityScore - dna2.rarityScore) < 20 ? 10 : 0; // Similar rarity bonus
    
    // Cap at 100
    score = Math.min(100, score);
    
    return {
      score,
      matchingTraits,
      complementary,
      analysis: score > 80 ? 'Highly compatible! You complement each other perfectly.' :
                score > 60 ? 'Good match. You share common ground.' :
                score > 40 ? 'Moderate compatibility. Some friction expected.' :
                'Challenging match. Different approaches to problems.',
    };
  }

  /**
   * Generate visual DNA card data (for @vercel/og to render)
   */
  static generateCardData(dna) {
    const tier = RARITY_TIERS[dna.tier];
    
    return {
      agentId: dna.agentId,
      dnaSequence: dna.dnaSequence,
      traits: [...dna.traits, ...dna.rareTraits],
      rarityScore: dna.rarityScore,
      tierLabel: tier.label,
      tierColor: tier.color,
      generatedAt: new Date(dna.generatedAt).toLocaleDateString(),
    };
  }
}

module.exports = { AgentDNA, RARITY_TIERS, RARE_TRAITS };
