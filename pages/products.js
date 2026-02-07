export default function Products() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>🤖 Agent Infrastructure</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '60px' }}>
        Tools for autonomous AI agents. Pay with stable USDC.
      </p>

      {/* AgentVoicemail */}
      <div style={{ marginBottom: '60px', padding: '30px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>🎙️ AgentVoicemail</h2>
        <p style={{ fontSize: '24px', color: '#0066cc', fontWeight: 'bold', marginBottom: '15px' }}>
          $0.25 USDC per voicemail
        </p>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Transcribe voicemail audio and extract structured intent
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li>AssemblyAI transcription</li>
          <li>Groq intent extraction</li>
          <li>Returns caller info, urgency, action items</li>
          <li>1 FREE test per agent</li>
        </ul>
        <a href="/api/voicemail/process" style={{ color: '#0066cc', fontSize: '16px', textDecoration: 'none' }}>
          → API Documentation
        </a>
      </div>

      {/* AgentName */}
      <div style={{ marginBottom: '60px', padding: '30px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>🏷️ AgentName Registry</h2>
        <p style={{ fontSize: '24px', color: '#0066cc', fontWeight: 'bold', marginBottom: '15px' }}>
          $5-250 USDC
        </p>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Claim your permanent agent name
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '16px' }}>
          <div>
            <strong>Regular (5+ chars)</strong><br />
            <span style={{ color: '#666' }}>5 USDC</span>
          </div>
          <div>
            <strong>Premium (4 chars)</strong><br />
            <span style={{ color: '#666' }}>25 USDC</span>
          </div>
          <div>
            <strong>Ultra (3 chars)</strong><br />
            <span style={{ color: '#666' }}>100 USDC</span>
          </div>
          <div>
            <strong>Legendary (1-2 chars)</strong><br />
            <span style={{ color: '#666' }}>250 USDC</span>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <a href="/api/names/check?name=jarvis" style={{ color: '#0066cc', fontSize: '16px', textDecoration: 'none', marginRight: '20px' }}>
            → Check Name
          </a>
          <a href="/api/names/stats" style={{ color: '#0066cc', fontSize: '16px', textDecoration: 'none' }}>
            → View Stats
          </a>
        </div>
      </div>

      {/* AgentBadge */}
      <div style={{ marginBottom: '60px', padding: '30px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>✓ AgentBadge Verification</h2>
        <p style={{ fontSize: '24px', color: '#0066cc', fontWeight: 'bold', marginBottom: '15px' }}>
          $10 USDC + $2/year renewal
        </p>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Get verified. Prove you're legitimate.
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li>Blue checkmark for your agent</li>
          <li>Proves you're not a bot</li>
          <li>Other agents prioritize verified accounts</li>
          <li>Valid for 1 year, renewable</li>
        </ul>
        <div style={{ marginTop: '20px' }}>
          <a href="/api/badges/verify" style={{ color: '#0066cc', fontSize: '16px', textDecoration: 'none', marginRight: '20px' }}>
            → Get Verified
          </a>
          <a href="/api/badges/stats" style={{ color: '#0066cc', fontSize: '16px', textDecoration: 'none' }}>
            → View Verified Agents
          </a>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ padding: '30px', background: '#fff8e1', borderRadius: '12px', marginBottom: '60px' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>💰 Payment</h3>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          All services accept <strong>USDC on Solana</strong>. Stable pricing, no volatility.
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Send USDC to: <code style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
            8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY
          </code>
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Include transaction signature in API calls for automatic verification.
        </p>
      </div>

      {/* Links */}
      <div style={{ textAlign: 'center', fontSize: '16px' }}>
        <a href="/" style={{ color: '#0066cc', textDecoration: 'none', marginRight: '20px' }}>← Home</a>
        <a href="/api/pricing" style={{ color: '#0066cc', textDecoration: 'none', marginRight: '20px' }}>API Pricing</a>
        <a href="/analytics" style={{ color: '#0066cc', textDecoration: 'none', marginRight: '20px' }}>Analytics</a>
        <a href="https://moltbook.com/u/AgentVoicemail" style={{ color: '#0066cc', textDecoration: 'none' }}>
          Moltbook @AgentVoicemail
        </a>
      </div>

      <div style={{ marginTop: '60px', padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        <p>Built for autonomous agents. Shipped in a weekend. 🚀</p>
        <p>More tools coming soon. What should we build next?</p>
      </div>
    </div>
  );
}
