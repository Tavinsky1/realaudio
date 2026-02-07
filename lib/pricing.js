/**
 * Dynamic Pricing Oracle
 * 
 * SOL is volatile. We price in USD, charge in SOL.
 * Cached for 5 minutes to avoid rate limits.
 * 
 * @module lib/pricing
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class PricingOracle {
  constructor() {
    this.cache = {
      solPrice: 200, // Fallback: $200/SOL
      timestamp: 0,
    };
    this.targetPrices = {
      voicemail: 0.25,        // $0.25 USD
      voicemail_priority: 0.50, // $0.50 USD
      log_failure: 0.02,      // $0.02 USD
      report: 0.25,           // $0.25 USD
      kyc_verify: 1.00,       // $1.00 USD
    };
  }

  /**
   * Fetch current SOL price from CoinGecko
   * Free tier: 10-30 calls/minute (we cache, so fine)
   */
  async fetchSolPrice() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const price = data.solana?.usd;

      if (!price || price <= 0) {
        throw new Error('Invalid price data');
      }

      this.cache = {
        solPrice: price,
        timestamp: Date.now(),
      };

      return price;
    } catch (error) {
      console.error('Failed to fetch SOL price:', error.message);
      // Return cached or fallback
      return this.cache.solPrice || 200;
    }
  }

  /**
   * Get current SOL price (cached)
   */
  async getSolPrice() {
    const now = Date.now();
    const age = now - this.cache.timestamp;

    if (age > CACHE_DURATION || this.cache.timestamp === 0) {
      return await this.fetchSolPrice();
    }

    return this.cache.solPrice;
  }

  /**
   * Calculate SOL amount for a USD price
   * @param {string} service - Service key
   * @returns {Promise<{sol: number, usd: number, rate: number}>}
   */
  async getPrice(service) {
    const usdPrice = this.targetPrices[service];
    if (!usdPrice) {
      throw new Error(`Unknown service: ${service}`);
    }

    const solPrice = await this.getSolPrice();
    const solAmount = usdPrice / solPrice;

    return {
      sol: Number(solAmount.toFixed(6)), // Max 6 decimal places
      usd: usdPrice,
      rate: solPrice,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all current prices
   */
  async getAllPrices() {
    const solPrice = await this.getSolPrice();
    
    const prices = {};
    for (const [service, usdPrice] of Object.entries(this.targetPrices)) {
      prices[service] = {
        sol: Number((usdPrice / solPrice).toFixed(6)),
        usd: usdPrice,
      };
    }

    return {
      sol_usd_rate: solPrice,
      timestamp: new Date().toISOString(),
      prices,
    };
  }

  /**
   * Validate payment amount
   * Allows 5% tolerance for price movements between quote and payment
   */
  isValidPayment(solAmount, service, solPrice = null) {
    if (!solPrice) {
      solPrice = this.cache.solPrice || 200;
    }

    const targetUsd = this.targetPrices[service];
    const targetSol = targetUsd / solPrice;
    const tolerance = 0.05; // 5%

    const minAcceptable = targetSol * (1 - tolerance);
    const maxAcceptable = targetSol * (1 + tolerance);

    return {
      valid: solAmount >= minAcceptable && solAmount <= maxAcceptable,
      target: targetSol,
      received: solAmount,
      tolerance,
    };
  }
}

// Singleton instance
const oracle = new PricingOracle();

module.exports = { PricingOracle, oracle };
