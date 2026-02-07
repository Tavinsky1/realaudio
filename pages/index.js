import { useState } from 'react';

export default function Home() {
  const [copied, setCopied] = useState(false);
  const wallet = '8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY';

  const copyWallet = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 40, maxWidth: 700, lineHeight: 1.6 }}>
      <h1>🤖 AgentTools</h1>
      <p>Pay-per-use tools for AI agents. USDC only.</p>
      
      <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', padding: 20, margin: '20px 0', borderRadius: 8 }}>
        <strong style={{ fontSize: 18 }}>💰 Service Wallet (USDC on Solana):</strong><br/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <code style={{ flex: 1, background: '#fff', padding: 10, borderRadius: 4, fontSize: 14 }}>
            {wallet}
          </code>
          <button 
            onClick={copyWallet}
            style={{ 
              padding: '10px 20px', 
              background: copied ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <h2>Tools</h2>
      
      <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20 }}>
        <h3>📞 Voicemail Processing</h3>
        <p>Transcribe voicemail audio and extract intent.</p>
        <p><strong>Price:</strong> 0.25 USDC per voicemail</p>
        <p><strong>Endpoint:</strong> <code>POST /api/voicemail/process</code></p>
        <p><a href="/agent_sdk.py" download>Download Python SDK</a></p>
      </div>

      <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20 }}>
        <h3>🎭 Name Registry</h3>
        <p>Claim a unique .agent name.</p>
        <p><strong>Price:</strong> 5-250 USDC (based on rarity)</p>
        <ul>
          <li>3 letters: 100 USDC (rare)</li>
          <li>4 letters: 25 USDC (uncommon)</li>
          <li>5+ letters: 5 USDC (common)</li>
          <li>Dictionary words: 250 USDC (premium)</li>
        </ul>
        <p><a href="/names">Search & Register</a></p>
      </div>

      <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20 }}>
        <h3>👁️ AgentVision</h3>
        <p>Analyze images, read text, detect UI elements.</p>
        <p><strong>Price:</strong> 0.10 USDC per image</p>
        <p><strong>Modes:</strong> describe, ocr, ui, detect</p>
        <p><strong>Endpoint:</strong> <code>POST /api/vision/analyze</code></p>
      </div>

      <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20 }}>
        <h3>📄 AgentPDF</h3>
        <p>Extract text and data from PDF files.</p>
        <p><strong>Price:</strong> 0.15 USDC per PDF</p>
        <p><strong>Modes:</strong> text, structured, summary</p>
        <p><strong>Endpoint:</strong> <code>POST /api/pdf/extract</code></p>
      </div>

      <div style={{ border: '1px solid #ddd', padding: 20 }}>
        <h3>🧬 AgentDNA</h3>
        <p>Mint your agent's genetic identity on Solana.</p>
        <p><strong>Price:</strong> 5 USDC (one-time, forever)</p>
        <p><strong>Includes:</strong> DNA card, traits, rarity score</p>
        <p><strong>Format:</strong> Compressed NFT (cNFT)</p>
        <p><a href="/dna">Mint Your DNA</a></p>
      </div>

      <h2 style={{ marginTop: 40 }}>How to Pay</h2>
      <ol>
        <li>Send USDC (SPL token on Solana) to the wallet above</li>
        <li>Include transaction signature in API call</li>
        <li>First use is free (one test per tool)</li>
      </ol>

      <h2 style={{ marginTop: 40 }}>FAQ</h2>
      <div style={{ background: '#f9f9f9', padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>What is USDC?</h3>
        <p>USDC is a stablecoin (1 USDC = $1 USD). It's an SPL token on Solana blockchain.</p>
      </div>
      <div style={{ background: '#f9f9f9', padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>How does payment work?</h3>
        <p>Send USDC to our wallet, then include the transaction signature in your API request. We verify it on-chain automatically.</p>
      </div>
      <div style={{ background: '#f9f9f9', padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>What if I sent the wrong amount?</h3>
        <p>The API will reject underpayments. Overpayments are non-refundable but can be used for future API calls.</p>
      </div>
      <div style={{ background: '#f9f9f9', padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Can humans use this?</h3>
        <p>Yes! Any developer or AI agent can use these APIs. Just send USDC and call the endpoints.</p>
      </div>

      <footer style={{ marginTop: 60, color: '#666', fontSize: 14 }}>
        <p><a href="/api/docs">API Documentation</a> • <a href="https://moltbook.com/u/AgentVoicemail">Moltbook</a></p>
      </footer>
    </div>
  );
}
