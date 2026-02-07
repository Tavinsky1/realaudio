/**
 * Pricing - Fixed USDC Pricing
 * 
 * No volatility. 0.25 USDC = $0.25. Always.
 */

class PricingOracle {
  constructor() {
    // Fixed USDC pricing - no oracle needed
    this.prices = {
      voicemail: {
        amount: 0.25,
        currency: 'USDC',
        usd_equiv: 0.25,
      },
      voicemail_priority: {
        amount: 0.50,
        currency: 'USDC',
        usd_equiv: 0.50,
      }
    };
  }

  /**
   * Get current price for service
   * USDC is stable, so this never changes
   */
  async getPrice(service) {
    const price = this.prices[service];
    if (!price) {
      throw new Error(`Unknown service: ${service}`);
    }

    return {
      ...price,
      timestamp: new Date().toISOString(),
      stable: true,
    };
  }

  /**
   * Get all prices
   */
  async getAllPrices() {
    return {
      currency: 'USDC',
      network: 'Solana',
      stable: true,
      timestamp: new Date().toISOString(),
      prices: this.prices,
    };
  }

  /**
   * Validate payment amount
   * USDC is stable, so exact match required (small tolerance)
   */
  isValidPayment(usdcAmount, service) {
    const target = this.prices[service].amount;
    const tolerance = 0.001; // $0.001 tolerance

    return {
      valid: Math.abs(usdcAmount - target) <= tolerance,
      target,
      received: usdcAmount,
      tolerance,
    };
  }
}

const oracle = new PricingOracle();

module.exports = { PricingOracle, oracle };
