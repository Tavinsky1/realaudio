/**
 * Analytics & Monitoring System
 * 
 * Tracks:
 * - Traffic volume
 * - Success/failure rates
 * - Processing times
 * - Popular agents
 * - Revenue (free vs paid)
 * 
 * @module lib/analytics
 */

class Analytics {
  constructor() {
    this.events = [];
    this.MAX_EVENTS = 10000; // Keep last 10k events in memory
    
    // Aggregated metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      freeRequests: 0,
      paidRequests: 0,
      totalRevenueSol: 0,
      uniqueAgents: new Set(),
      errorTypes: {},
      processingTimes: [],
      startTime: Date.now(),
    };
  }

  /**
   * Track a request event
   */
  trackRequest({ 
    agentId, 
    success = true, 
    isFree = false, 
    amountSol = 0,
    processingTime = null,
    error = null,
    intent = null,
    urgency = null,
  }) {
    const event = {
      timestamp: Date.now(),
      agentId,
      success,
      isFree,
      amountSol,
      processingTime,
      error,
      intent,
      urgency,
    };

    // Add to event log
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift(); // Remove oldest
    }

    // Update aggregated metrics
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (error) {
        this.metrics.errorTypes[error] = (this.metrics.errorTypes[error] || 0) + 1;
      }
    }

    if (isFree) {
      this.metrics.freeRequests++;
    } else {
      this.metrics.paidRequests++;
      this.metrics.totalRevenueSol += amountSol;
    }

    this.metrics.uniqueAgents.add(agentId);

    if (processingTime) {
      this.metrics.processingTimes.push(processingTime);
      // Keep only last 1000 processing times
      if (this.metrics.processingTimes.length > 1000) {
        this.metrics.processingTimes.shift();
      }
    }
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const processingTimes = this.metrics.processingTimes;
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : null;

    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    const uptime = Date.now() - this.metrics.startTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

    return {
      overview: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        successRate: `${successRate}%`,
        uniqueAgents: this.metrics.uniqueAgents.size,
        uptimeHours,
      },
      revenue: {
        freeRequests: this.metrics.freeRequests,
        paidRequests: this.metrics.paidRequests,
        totalRevenueSol: this.metrics.totalRevenueSol.toFixed(6),
        estimatedUsdRevenue: (this.metrics.totalRevenueSol * 200).toFixed(2), // Approximate
      },
      performance: {
        avgProcessingTimeMs: avgProcessingTime ? avgProcessingTime.toFixed(0) : null,
        totalProcessed: processingTimes.length,
      },
      errors: {
        topErrors: Object.entries(this.metrics.errorTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([error, count]) => ({ error, count })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent events (last N)
   */
  getRecentEvents(limit = 100) {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(startTime, endTime) {
    return this.events.filter(e => 
      e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Get intent distribution
   */
  getIntentDistribution() {
    const intents = {};
    this.events.forEach(e => {
      if (e.intent && e.success) {
        intents[e.intent] = (intents[e.intent] || 0) + 1;
      }
    });
    
    return Object.entries(intents)
      .sort((a, b) => b[1] - a[1])
      .map(([intent, count]) => ({ intent, count }));
  }

  /**
   * Get urgency distribution
   */
  getUrgencyDistribution() {
    const urgencies = {};
    this.events.forEach(e => {
      if (e.urgency && e.success) {
        urgencies[e.urgency] = (urgencies[e.urgency] || 0) + 1;
      }
    });
    
    return Object.entries(urgencies)
      .sort((a, b) => b[1] - a[1])
      .map(([urgency, count]) => ({ urgency, count }));
  }

  /**
   * Get agent leaderboard (most active)
   */
  getAgentLeaderboard(limit = 10) {
    const agentCounts = {};
    this.events.forEach(e => {
      agentCounts[e.agentId] = (agentCounts[e.agentId] || 0) + 1;
    });

    return Object.entries(agentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([agentId, requestCount]) => ({ agentId, requestCount }));
  }

  /**
   * Get hourly breakdown (last 24 hours)
   */
  getHourlyBreakdown() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= oneDayAgo);

    const hourly = new Array(24).fill(0).map((_, i) => ({
      hour: i,
      requests: 0,
      successful: 0,
      failed: 0,
    }));

    recentEvents.forEach(e => {
      const date = new Date(e.timestamp);
      const hour = date.getHours();
      hourly[hour].requests++;
      if (e.success) {
        hourly[hour].successful++;
      } else {
        hourly[hour].failed++;
      }
    });

    return hourly;
  }

  /**
   * Clear all analytics data (admin function)
   */
  reset() {
    this.events = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      freeRequests: 0,
      paidRequests: 0,
      totalRevenueSol: 0,
      uniqueAgents: new Set(),
      errorTypes: {},
      processingTimes: [],
      startTime: Date.now(),
    };
  }
}

// Singleton instance
const analytics = new Analytics();

module.exports = { Analytics, analytics };
