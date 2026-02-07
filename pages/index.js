/**
 * AgentVoicemail Landing Page
 * 
 * Voicemail processing for AI agents
 * Pay with USDC. No humans. Just execution.
 */

export default function Home() {
  return (
    <div style={styles.container}>
      <head>
        <title>AgentVoicemail | Process Voicemails with AI Agents</title>
        <meta name="description" content="AI agents pay USDC to transcribe and extract intent from voicemail audio." />
      </head>

      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.title}>📞🤖 AgentVoicemail</h1>
          <p style={styles.tagline}>
            Your AI agent hits a voicemail. <strong>We handle the rest.</strong>
          </p>
          <p style={styles.subtagline}>
            Transcribe. Extract intent. Pay with USDC. No humans required.
          </p>
        </div>

        <div style={styles.freeTier}>
          <h2>🎁 Free Test</h2>
          <p>One free voicemail to test. Then <strong>0.25 USDC</strong> per voicemail.</p>
        </div>

        <div style={styles.howItWorks}>
          <h2>How It Works</h2>
          <div style={styles.steps}>
            <div style={styles.step}>
              <h3>1</h3>
              <p>Agent sends voicemail audio URL + 0.25 USDC</p>
            </div>
            <div style={styles.step}>
              <h3>2</h3>
              <p>We transcribe and extract intent</p>
            </div>
            <div style={styles.step}>
              <h3>3</h3>
              <p>Agent receives structured JSON</p>
            </div>
          </div>
        </div>

        <div style={styles.productCard}>
          <div style={styles.productHeader}>
            <span style={styles.statusLive}>● LIVE</span>
            <h3>Voicemail Processing</h3>
            <span style={styles.price}>0.25 USDC</span>
          </div>
          <p>Agents send voicemail audio. We transcribe and extract structured data:</p>
          <ul style={styles.featureList}>
            <li>Intent detection (callback, appointment, complaint, etc.)</li>
            <li>Callback numbers extracted</li>
            <li>Urgency classification</li>
            <li>One-sentence summary</li>
          </ul>
          <pre style={styles.code}>
{`POST /api/voicemail/process
{
  "audio_url": "https://.../voicemail.mp3",
  "webhook_url": "https://.../callback",
  "agent_id": "my_agent",
  "payment": { "signature": "..." }
}`}
          </pre>
        </div>

        <div style={styles.quickStart}>
          <h2>Quick Start</h2>
          <pre style={styles.codeBlock}>
{`# 1. Check pricing (in USDC)
curl https://your-domain.vercel.app/api/pricing

# 2. Send USDC to service wallet
# 3. Include tx signature in API call
curl -X POST https://your-domain.vercel.app/api/voicemail/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://.../voicemail.mp3",
    "webhook_url": "https://.../callback",
    "agent_id": "my_agent",
    "payment": { "signature": "..." }
  }'`}
          </pre>
        </div>

        <div style={styles.sdk}>
          <h2>Python SDK</h2>
          <pre style={styles.codeBlock}>
{`from agent_voicemail import Client

client = Client(api_key="your_key")
result = client.process("https://.../voicemail.mp3")

print(result.intent)      # "callback_request"
print(result.callback)    # "+1-555-0123"
print(result.summary)     # "Call back tomorrow"`}
          </pre>
          <a href="/agent_sdk.py" download style={styles.button}>Download SDK</a>
        </div>

        <div style={styles.faq}>
          <h2>FAQ</h2>
          
          <details style={styles.faqItem}>
            <summary>Why USDC?</summary>
            <p>Stable pricing. Agents know exactly what they're paying (0.25 USDC = $0.25). No volatility surprises.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>What audio formats?</summary>
            <p>MP3, WAV, M4A, OGG. Max 2 minutes, 10 MB.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>How fast?</summary>
            <p>~30 seconds for a 1-minute voicemail. Webhook delivered when done.</p>
          </details>

          <details style={styles.faqItem}>
            <summary>What if my agent doesn't have a wallet?</summary>
            <p>Then it's not an autonomous agent. This service is for agents that manage their own resources.</p>
          </details>
        </div>

        <footer style={styles.footer}>
          <p>Built by <a href="https://inksky.net">Inksky</a></p>
          <p style={styles.small}>USDC Wallet (Solana SPL): <code>8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY</code></p>
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
  steps: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  step: {
    background: '#1a1a2e',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid #667eea',
    flex: 1,
    minWidth: '200px',
    textAlign: 'center',
  },
  productCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '4rem',
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
  price: {
    marginLeft: 'auto',
    background: '#667eea20',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    color: '#667eea',
  },
  featureList: {
    color: '#a5b4fc',
    lineHeight: 1.8,
    marginBottom: '1.5rem',
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
