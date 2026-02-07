/**
 * AgentName Registry
 * 
 * Unique names for AI agents
 * Pay with USDC. Own forever.
 */

const { PublicKey } = require('@solana/web3.js');
const crypto = require('crypto');

// Pricing in USDC
const PRICING = {
  tier1: { length: 3, price: 100, label: '3-letter (Rare)' },
  tier2: { length: 4, price: 25, label: '4-letter (Uncommon)' },
  tier3: { minLength: 5, price: 5, label: '5+ letter (Common)' },
  dictionary: { words: ['ai', 'bot', 'agent', 'soul', 'mind', 'core'], price: 250, label: 'Dictionary (Premium)' }
};

// In-memory registry (replace with database in production)
const registeredNames = new Map();
const reservedNames = new Set(['admin', 'api', 'www', 'app', 'api', 'docs']);

class AgentNameRegistry {
  constructor() {
    this.serviceWallet = '8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY';
  }

  /**
   * Check if name is available
   */
  isAvailable(name) {
    const normalized = this.normalizeName(name);
    
    if (reservedNames.has(normalized)) return false;
    if (registeredNames.has(normalized)) return false;
    
    return true;
  }

  /**
   * Normalize name (lowercase, remove special chars)
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Validate name format
   */
  validateName(name) {
    const errors = [];
    const normalized = this.normalizeName(name);

    if (!normalized) {
      errors.push('Name cannot be empty');
      return { valid: false, errors };
    }

    if (normalized.length < 3) {
      errors.push('Name must be at least 3 characters');
    }

    if (normalized.length > 32) {
      errors.push('Name must be at most 32 characters');
    }

    if (reservedNames.has(normalized)) {
      errors.push('Name is reserved');
    }

    if (registeredNames.has(normalized)) {
      errors.push('Name is already taken');
    }

    return {
      valid: errors.length === 0,
      errors,
      normalized,
    };
  }

  /**
   * Get price for name
   */
  getPrice(name) {
    const normalized = this.normalizeName(name);
    const length = normalized.length;

    // Check dictionary words
    if (PRICING.dictionary.words.includes(normalized)) {
      return {
        price: PRICING.dictionary.price,
        tier: 'dictionary',
        label: PRICING.dictionary.label,
      };
    }

    // Check tiers by length
    if (length === 3) {
      return {
        price: PRICING.tier1.price,
        tier: 'tier1',
        label: PRICING.tier1.label,
      };
    }

    if (length === 4) {
      return {
        price: PRICING.tier2.price,
        tier: 'tier2',
        label: PRICING.tier2.label,
      };
    }

    return {
      price: PRICING.tier3.price,
      tier: 'tier3',
      label: PRICING.tier3.label,
    };
  }

  /**
   * Register a name
   */
  async registerName(name, ownerWallet, paymentTx) {
    const validation = this.validateName(name);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const normalized = validation.normalized;
    const pricing = this.getPrice(normalized);

    // Verify payment (simplified - in production verify USDC amount)
    // For now, just check tx exists
    if (!paymentTx || paymentTx.length < 10) {
      return {
        success: false,
        error: 'INVALID_PAYMENT',
        message: 'Valid payment transaction required',
      };
    }

    // Register the name
    const registration = {
      name: normalized,
      displayName: name,
      owner: ownerWallet,
      paymentTx,
      pricePaid: pricing.price,
      registeredAt: Date.now(),
      expiresAt: null, // Forever
    };

    registeredNames.set(normalized, registration);

    return {
      success: true,
      name: normalized,
      owner: ownerWallet,
      price: pricing.price,
      tier: pricing.tier,
    };
  }

  /**
   * Lookup a name
   */
  lookupName(name) {
    const normalized = this.normalizeName(name);
    return registeredNames.get(normalized) || null;
  }

  /**
   * Search available names
   */
  searchAvailable(query) {
    const normalized = this.normalizeName(query);
    if (!normalized) return [];

    const suggestions = [];
    
    // Try variations
    const variations = [
      normalized,
      `${normalized}-agent`,
      `${normalized}-ai`,
      `${normalized}-bot`,
      `the-${normalized}`,
      `${normalized}1`,
      `${normalized}2`,
      `${normalized}-io`,
    ];

    for (const variant of variations) {
      if (this.isAvailable(variant) && !suggestions.includes(variant)) {
        suggestions.push(variant);
      }
      if (suggestions.length >= 5) break;
    }

    return suggestions;
  }

  /**
   * Get all registered names (for admin)
   */
  getAllRegistrations() {
    return Array.from(registeredNames.values());
  }

  /**
   * Get stats
   */
  getStats() {
    const regs = this.getAllRegistrations();
    return {
      totalRegistered: regs.length,
      totalRevenue: regs.reduce((sum, r) => sum + r.pricePaid, 0),
      byTier: {
        tier1: regs.filter(r => r.pricePaid === 100).length,
        tier2: regs.filter(r => r.pricePaid === 25).length,
        tier3: regs.filter(r => r.pricePaid === 5).length,
        dictionary: regs.filter(r => r.pricePaid === 250).length,
      },
    };
  }
}

const registry = new AgentNameRegistry();

module.exports = {
  AgentNameRegistry,
  registry,
  PRICING,
};
