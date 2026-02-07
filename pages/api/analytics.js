/**
 * GET /api/analytics
 * 
 * Real-time analytics dashboard data
 * Shows traffic, success rates, revenue, errors
 * 
 * Query params:
 * - view: summary|detailed|events|intents|agents|hourly
 * - limit: number of records (for events/agents)
 */

const { analytics } = require('../../lib/analytics');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const { view = 'summary', limit = 100 } = req.query;

    let data;

    switch (view) {
      case 'summary':
        // Default view with all key metrics
        data = {
          ...analytics.getSummary(),
          intents: analytics.getIntentDistribution(),
          urgencies: analytics.getUrgencyDistribution(),
          topAgents: analytics.getAgentLeaderboard(5),
        };
        break;

      case 'detailed':
        // Everything
        data = {
          summary: analytics.getSummary(),
          intents: analytics.getIntentDistribution(),
          urgencies: analytics.getUrgencyDistribution(),
          topAgents: analytics.getAgentLeaderboard(10),
          hourlyBreakdown: analytics.getHourlyBreakdown(),
          recentEvents: analytics.getRecentEvents(50),
        };
        break;

      case 'events':
        // Recent events log
        const eventLimit = Math.min(parseInt(limit) || 100, 1000);
        data = {
          events: analytics.getRecentEvents(eventLimit),
          total: analytics.metrics.totalRequests,
        };
        break;

      case 'intents':
        // Intent analysis
        data = {
          intents: analytics.getIntentDistribution(),
          urgencies: analytics.getUrgencyDistribution(),
          totalProcessed: analytics.metrics.successfulRequests,
        };
        break;

      case 'agents':
        // Agent leaderboard
        const agentLimit = Math.min(parseInt(limit) || 10, 100);
        data = {
          agents: analytics.getAgentLeaderboard(agentLimit),
          totalUniqueAgents: analytics.metrics.uniqueAgents.size,
        };
        break;

      case 'hourly':
        // 24-hour breakdown
        data = {
          hourly: analytics.getHourlyBreakdown(),
          timezone: 'UTC',
        };
        break;

      default:
        return res.status(400).json({
          error: 'INVALID_VIEW',
          message: 'Valid views: summary, detailed, events, intents, agents, hourly',
        });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      error: 'ANALYTICS_ERROR',
      message: error.message,
    });
  }
}
