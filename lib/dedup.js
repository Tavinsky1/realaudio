/**
 * Transaction Deduplication
 * 
 * Prevents double-spend attacks by tracking processed signatures.
 * Uses in-memory Map with TTL (resets on deploy, but that's fine for MVP).
 * 
 * For production: Replace with Redis or DynamoDB.
 * 
 * @module lib/dedup
 */

const TTL = 24 * 60 * 60 * 1000; // 24 hours

class TransactionDeduplicator {
  constructor() {
    this.processed = new Map(); // signature -> { timestamp, details }
    this.lastCleanup = Date.now();
  }

  /**
   * Check if transaction was already processed
   * @param {string} signature
   * @returns {boolean}
   */
  has(signature) {
    this.cleanup();
    return this.processed.has(signature);
  }

  /**
   * Mark transaction as processed
   * @param {string} signature
   * @param {object} details
   */
  add(signature, details = {}) {
    this.processed.set(signature, {
      timestamp: Date.now(),
      details,
    });
    
    // Periodic cleanup
    if (Date.now() - this.lastCleanup > 60 * 60 * 1000) {
      this.cleanup();
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    const expired = [];

    for (const [signature, data] of this.processed.entries()) {
      if (now - data.timestamp > TTL) {
        expired.push(signature);
      }
    }

    for (const signature of expired) {
      this.processed.delete(signature);
    }

    this.lastCleanup = now;
  }

  /**
   * Get stats
   */
  stats() {
    return {
      totalTracked: this.processed.size,
      oldestEntry: this.processed.size > 0 
        ? new Date(Math.min(...[...this.processed.values()].map(v => v.timestamp)))
        : null,
    };
  }
}

// Singleton
const dedup = new TransactionDeduplicator();

module.exports = { TransactionDeduplicator, dedup };
