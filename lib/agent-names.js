/**
 * AgentName Registry
 * 
 * Simple name registration system for AI agents
 * Uses USDC payments, stores in memory (upgrade to DB later)
 */

// In-memory storage (will migrate to DB if this works)
const registeredNames = new Map();

// Pricing tiers (USDC)
const PRICING = {
  regular: 5,      // 5+ characters
  premium: 25,     // 4 characters
  ultra: 100,      // 3 characters
  legendary: 250,  // dictionary words, 1-2 chars
};

// Reserved/banned names
const RESERVED = new Set([
  'admin', 'root', 'system', 'api', 'null', 'undefined',
  'test', 'demo', 'support', 'help', 'info', 'contact'
]);

// Dictionary words (charge premium)
const DICTIONARY_WORDS = new Set([
  'agent', 'brain', 'mind', 'soul', 'oracle', 'wisdom',
  'jarvis', 'friday', 'cortana', 'alexa', 'siri', 'claude',
  'ghost', 'spirit', 'echo', 'nova', 'atlas', 'titan'
]);

class AgentNameRegistry {
  constructor() {
    // Initialize with some reserved names
    RESERVED.forEach(name => {
      registeredNames.set(name.toLowerCase(), {
        owner: 'SYSTEM',
        registered_at: new Date().toISOString(),
        reserved: true,
      });
    });
  }

  /**
   * Check if name is available
   */
  isAvailable(name) {
    const normalized = name.toLowerCase().trim();
    
    // Validation
    if (normalized.length === 0 || normalized.length > 32) {
      return { available: false, reason: 'Name must be 1-32 characters' };
    }
    
    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      return { available: false, reason: 'Name can only contain lowercase letters, numbers, _ and -' };
    }
    
    if (registeredNames.has(normalized)) {
      return { available: false, reason: 'Name already taken' };
    }
    
    return { available: true };
  }

  /**
   * Get pricing for a name
   */
  getPrice(name) {
    const normalized = name.toLowerCase().trim();
    const length = normalized.length;
    
    if (DICTIONARY_WORDS.has(normalized)) {
      return { amount: PRICING.legendary, tier: 'legendary', currency: 'USDC' };
    }
    
    if (length <= 2) {
      return { amount: PRICING.legendary, tier: 'legendary', currency: 'USDC' };
    }
    
    if (length === 3) {
      return { amount: PRICING.ultra, tier: 'ultra', currency: 'USDC' };
    }
    
    if (length === 4) {
      return { amount: PRICING.premium, tier: 'premium', currency: 'USDC' };
    }
    
    return { amount: PRICING.regular, tier: 'regular', currency: 'USDC' };
  }

  /**
   * Register a name (after payment verified)
   */
  register(name, owner, txSignature) {
    const normalized = name.toLowerCase().trim();
    
    // Check availability
    const check = this.isAvailable(normalized);
    if (!check.available) {
      throw new Error(check.reason);
    }
    
    // Register
    const record = {
      name: normalized,
      owner,
      tx_signature: txSignature,
      registered_at: new Date().toISOString(),
      reserved: false,
    };
    
    registeredNames.set(normalized, record);
    
    return {
      success: true,
      name: normalized,
      display_url: `https://realaudio.vercel.app/n/${normalized}`,
      owner,
      registered_at: record.registered_at,
    };
  }

  /**
   * Lookup a name
   */
  lookup(name) {
    const normalized = name.toLowerCase().trim();
    const record = registeredNames.get(normalized);
    
    if (!record) {
      return { found: false };
    }
    
    return {
      found: true,
      name: record.name,
      owner: record.owner,
      registered_at: record.registered_at,
      reserved: record.reserved,
    };
  }

  /**
   * Get stats
   */
  getStats() {
    const names = Array.from(registeredNames.values());
    const nonReserved = names.filter(n => !n.reserved);
    
    return {
      total_names: registeredNames.size,
      registered_names: nonReserved.length,
      reserved_names: names.filter(n => n.reserved).length,
      latest_registrations: nonReserved
        .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
        .slice(0, 10)
        .map(n => ({ name: n.name, registered_at: n.registered_at })),
    };
  }

  /**
   * Get all names for an owner
   */
  getNamesByOwner(owner) {
    const names = Array.from(registeredNames.values())
      .filter(n => n.owner === owner && !n.reserved)
      .map(n => ({ name: n.name, registered_at: n.registered_at }));
    
    return names;
  }
}

// Singleton
const registry = new AgentNameRegistry();

module.exports = { registry, PRICING };
