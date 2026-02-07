/**
 * Analytics Dashboard
 * Real-time monitoring of AgentWallet Protocol metrics
 */

import { useState, useEffect } from 'react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('summary');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch analytics data
  const fetchData = async () => {
    try {
      const response = await fetch(`/api/analytics?view=${view}`);
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [view, autoRefresh]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📊 AgentWallet Analytics</h1>
        <div style={styles.controls}>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{...styles.button, ...(autoRefresh ? styles.buttonActive : {})}}
          >
            {autoRefresh ? '● Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button onClick={fetchData} style={styles.button}>Refresh Now</button>
        </div>
      </header>

      {/* Overview Cards */}
      {data?.overview && (
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Total Requests</div>
            <div style={styles.cardValue}>{data.overview.totalRequests}</div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardLabel}>Success Rate</div>
            <div style={{...styles.cardValue, color: parseFloat(data.overview.successRate) > 90 ? '#22c55e' : '#f59e0b'}}>
              {data.overview.successRate}
            </div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardLabel}>Unique Agents</div>
            <div style={styles.cardValue}>{data.overview.uniqueAgents}</div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardLabel}>Uptime</div>
            <div style={styles.cardValue}>{data.overview.uptimeHours}h</div>
          </div>
        </div>
      )}

      {/* Revenue */}
      {data?.revenue && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Revenue</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Free Requests</div>
              <div style={styles.cardValue}>{data.revenue.freeRequests}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Paid Requests</div>
              <div style={styles.cardValue}>{data.revenue.paidRequests}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Total SOL Revenue</div>
              <div style={{...styles.cardValue, color: '#9333ea'}}>
                ◎ {data.revenue.totalRevenueSol}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Est. USD Revenue</div>
              <div style={styles.cardValue}>${data.revenue.estimatedUsdRevenue}</div>
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {data?.performance && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚡ Performance</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Avg Processing Time</div>
              <div style={styles.cardValue}>
                {data.performance.avgProcessingTimeMs ? `${data.performance.avgProcessingTimeMs}ms` : 'N/A'}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Total Processed</div>
              <div style={styles.cardValue}>{data.performance.totalProcessed}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Intents */}
      {data?.intents && data.intents.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📞 Voicemail Intents</h2>
          <div style={styles.list}>
            {data.intents.slice(0, 5).map((item, i) => (
              <div key={i} style={styles.listItem}>
                <span style={styles.listLabel}>{item.intent}</span>
                <span style={styles.listValue}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Urgencies */}
      {data?.urgencies && data.urgencies.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⏰ Urgency Levels</h2>
          <div style={styles.list}>
            {data.urgencies.map((item, i) => (
              <div key={i} style={styles.listItem}>
                <span style={styles.listLabel}>{item.urgency}</span>
                <span style={styles.listValue}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Agents */}
      {data?.topAgents && data.topAgents.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🤖 Most Active Agents</h2>
          <div style={styles.list}>
            {data.topAgents.map((agent, i) => (
              <div key={i} style={styles.listItem}>
                <span style={styles.listLabel}>{agent.agentId.substring(0, 20)}...</span>
                <span style={styles.listValue}>{agent.requestCount} requests</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Errors */}
      {data?.errors?.topErrors && data.errors.topErrors.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>❌ Top Errors</h2>
          <div style={styles.list}>
            {data.errors.topErrors.map((error, i) => (
              <div key={i} style={styles.listItem}>
                <span style={{...styles.listLabel, color: '#ef4444', fontFamily: 'monospace', fontSize: '12px'}}>
                  {error.error}
                </span>
                <span style={styles.listValue}>{error.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {(!data || data.overview?.totalRequests === 0) && (
        <div style={styles.empty}>
          <h3>No data yet</h3>
          <p>Analytics will appear once requests start coming in.</p>
          <p>Test the API: <code>POST /api/voicemail/process</code></p>
        </div>
      )}

      <footer style={styles.footer}>
        <p>Last updated: {data?.timestamp || new Date().toISOString()}</p>
        <p><a href="/" style={styles.link}>← Back to Home</a></p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0a0a0a',
    color: '#e5e5e5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
  },
  controls: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonActive: {
    backgroundColor: '#22c55e',
    color: '#000',
    border: 'none',
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#666',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #333',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#fff',
  },
  list: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333',
    overflow: 'hidden',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #333',
  },
  listLabel: {
    color: '#e5e5e5',
  },
  listValue: {
    color: '#999',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333',
  },
  footer: {
    marginTop: '60px',
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    borderTop: '1px solid #333',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
};
