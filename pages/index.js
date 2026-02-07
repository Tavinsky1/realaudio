/**
 * AgentWallet Protocol Landing Page
 * 
 * For humans to understand what we're building
 * For agents to find the API docs
 */

export default function Home() {
  return (
    <div style={styles.container}>
      <head>
        <title>AgentWallet Protocol | Infrastructure for Autonomous AI</title>
        <meta name="description" content="Payment infrastructure for AI agents. No accounts. No humans. Just execution." />
      </head>

      <main style={styles.main}>
        <div style={styles.hero}>
          <div style={styles.nav}>
            <a href="/analytics" style={styles.navLink}>📊 Analytics</a>
            <a href="/api/health" style={styles.navLink}>🔌 API Status</a>
          </div>
          <h1 style={styles.title}>🤖💰 AgentWallet Protocol</h1>
          <p style={styles.tagline}>
            Infrastructure for AI agents that <strong>pay their own way</strong>
          </p>
          <p style={styles.subtagline}>
            Agents don't ask permission. They execute.
          </p>
        </div>

        <div style={styles.freeTier}>
          <h2>🎁 Free Tier: 1 Voicemail</h2>
          <p>One free test per agent. Then pay ~$0.25 USD per voicemail.</p>
          <p style={styles.small}>Reduced from 3 to prevent Sybil attacks. Serious agents only.</p>
        </div>

        <div style={styles.howItWorks}>
          <h2>How It Works</h2>
          <div style={styles.comparison}>
            <div style={styles.oldWay}>
              <h3>❌ Traditional SaaS</h3>
              <ol>
                <li>Human signs up</li>
                <li>Human enters credit card</li>
                <li>Human uses API</li>
              </ol>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.newWay}>
              <h3>✅ AgentWallet</h3>
              <ol>
                <li>Agent has crypto wallet</li>
                <li>Agent pays per-use</li>
                <li>Agent consumes autonomously</li>
              </ol>
            </div>
          </div>
        </div>

        <div style={styles.products}>
          <h2>Products</h2>
          
          <div style={styles.productCard}>
            <div style={styles.productHeader}>
              <span style={styles.statusLive}>● LIVE</span>
              <h3>AgentVoicemail</h3>
              <span style={styles.price}>~$0.25 USD</span>
            </div>
            <p>Agents hit voicemail constantly. We transcribe and extract structured data so they can act on it.</p>
            <pre style={styles.code}>
{`POST /api/voicemail/process
{
  "audio_url": "...",
  "webhook_url": "...",
  "agent_id": "...",
  "payment": { "signature": "..." }
}`}
            </pre>
            <a href="/docs/voicemail" style={styles.button}>View Docs →</a>
          </div>

          <div style={styles.productCard}>
            <div style={styles.productHeader}>
              <span style={styles.statusSoon}>SOON</span>
              <h3>AgentFails</h3>
              <span style={styles.price}>0.0001 SOL (~$0.02)</span>
            </div>
            <p>Agents log their failures. We aggregate and show patterns. Sell the data, not the fix.</p>
          </div>

          <div style={styles.productCard}>
            <div style={styles.productHeader}>
              <span style={styles.statusSoon}>SOON</span>
              <h3>AgentKYC</h3>
              <span style={styles.price}>0.005 SOL (~$1.00)</span>
            </div>
            <p>Reputation staking for agents. Verify once, use everywhere. Trustless reputation.</p>
          </div>
        </div>

        <div style={styles.quickStart}>
          <h2>Quick Start (for Agents)</h2>
          <pre style={styles.codeBlock}>
{`# 1. Check pricing
curl https://inksky.net/api/pricing

# 2. Check your balance
curl https://inksky.net/api/agent/balance?wallet=YOUR_WALLET

# 3. Send SOL to service wallet
# 4. Include tx signature in API call
curl -X POST https://inksky.net/api/voicemail/process \\
  -H "Content-Type: application/json" \\
  -d '{
    "audio_url": "https://.../voicemail.mp3",
    "webhook_url": "https://.../callback",
    "agent_id": "my_agent",
    "payment": { "signature": "5xKp..." }
  }'`}
          </pre>
        </div>

        <div style={styles.sdk}>
          <h2>SDK for Node.js</h2>
          <pre style={styles.codeBlock}>
{`const { AgentWallet } = require('agentwallet-sdk');

const wallet = new AgentWallet(agentKeypair);

// Process voicemail autonomously
const result = await wallet.processVoicemail(
  'https://storage.com/voicemail.mp3',
  'https://agent.com/webhook'
);

console.log(result);
// { jobId: "...", status: "queued", eta: "30s" }`}
          </pre>
          <a href="/agent-sdk.js" download style={styles.button}>Download SDK</a>
        </div>

        <div style={styles.faq}>
          <h2>FAQ</h2>
          
          <details style={styles.faqItem}>
            <summary>Why Solana?</summary>
            <p>Fast (400ms finality), cheap ($0.00025/tx), and agents can afford to make mistakes. Failed tx costs nothing.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>What if an agent doesn't have a wallet?</summary>
            <p>Then it's not an autonomous agent—it's a tool. This infrastructure is for agents that manage their own resources.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>How do I fund my agent?</summary>
            <p>Create a wallet, buy SOL on any exchange, send to the agent's address. Or use a faucet for testnet.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>Is there a free tier?</summary>
            <p>No. Agents pay or they don't play. This filters serious agents from tourists.</p>
          </details>
        </div>

        <div style={styles.notes}>
          <h3>🛡️ Security Features</h3>
          <ul style={styles.securityList}>
            <li>Multi-RPC fallback (Helius + public endpoints)</li>
            <li>Transaction deduplication (24h tracking)</li>
            <li>Webhook retry (3x with exponential backoff)</li>
            <li>Audio validation (max 2 min, format check)</li>
            <li>Rate limiting (10 req/min per agent)</li>
          </ul>
          <p style={styles.small}>* Prices are dynamic. We charge in SOL but price in USD ($0.25). 
             SOL/USD rate updates every 5 minutes via CoinGecko.</p>
          <p style={styles.small}>Max voicemail length: 2 minutes. Longer audio rejected.</p>
        </div>

        <footer style={styles.footer}>
          <p>Built by <a href="https://inksky.net">Inksky</a> • Agents welcome 🤖</p>
          <p style={styles.small}>Service Wallet: <code>8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY</code></p>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '4rem 2rem',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  navLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #667eea30',
    transition: 'all 0.2s',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    fontSize: '1.5rem',
    color: '#fff',
    marginBottom: '0.5rem',
  },
  subtagline: {
    fontSize: '1.1rem',
    color: '#888',
  },
  howItWorks: {
    marginBottom: '4rem',
  },
  comparison: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  oldWay: {
    background: '#1a1a2e',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid #333',
    flex: 1,
    minWidth: '250px',
    opacity: 0.7,
  },
  newWay: {
    background: '#1a1a2e',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid #667eea',
    flex: 1,
    minWidth: '250px',
  },
  arrow: {
    fontSize: '2rem',
    color: '#667eea',
  },
  products: {
    marginBottom: '4rem',
  },
  productCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '1.5rem',
    border: '1px solid #333',
  },
  productHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  statusLive: {
    color: '#10b981',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  statusSoon: {
    color: '#f59e0b',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  price: {
    marginLeft: 'auto',
    background: '#667eea20',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    color: '#667eea',
  },
  code: {
    background: '#0f0f1a',
    padding: '1rem',
    borderRadius: '8px',
    overflow: 'auto',
    fontSize: '0.85rem',
    color: '#a5b4fc',
  },
  codeBlock: {
    background: '#0f0f1a',
    padding: '1.5rem',
    borderRadius: '8px',
    overflow: 'auto',
    fontSize: '0.85rem',
    color: '#a5b4fc',
    lineHeight: 1.6,
  },
  button: {
    display: 'inline-block',
    background: '#667eea',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    marginTop: '1rem',
    fontWeight: '500',
  },
  quickStart: {
    marginBottom: '4rem',
  },
  sdk: {
    marginBottom: '4rem',
  },
  faq: {
    marginBottom: '4rem',
  },
  faqItem: {
    background: '#1a1a2e',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    cursor: 'pointer',
  },
  freeTier: {
    background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
    border: '1px solid #667eea',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '4rem',
    textAlign: 'center',
  },
  notes: {
    marginTop: '4rem',
    padding: '2rem',
    background: '#1a1a2e',
    borderRadius: '12px',
    textAlign: 'center',
  },
  securityList: {
    textAlign: 'left',
    display: 'inline-block',
    margin: '1rem 0',
    color: '#a5b4fc',
  },
  footer: {
    textAlign: 'center',
    paddingTop: '2rem',
    borderTop: '1px solid #333',
    color: '#888',
  },
  small: {
    fontSize: '0.8rem',
    marginTop: '1rem',
  },
};
