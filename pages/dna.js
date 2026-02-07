import { useState } from 'react';

export default function Dna() {
  const [agentId, setAgentId] = useState('');
  const [model, setModel] = useState('claude-sonnet-4');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [wallet, setWallet] = useState('');
  const [tx, setTx] = useState('');
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState(null);

  const generatePreview = async () => {
    if (!agentId) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/dna/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, model }),
      });
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      alert('Preview failed: ' + err.message);
    }
    
    setLoading(false);
  };

  const mintDNA = async () => {
    if (!wallet || !tx) return;
    setMinting(true);
    
    try {
      const res = await fetch('/api/dna/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          owner_wallet: wallet,
          payment_signature: tx,
          model,
        }),
      });
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Mint failed: ' + err.message);
    }
    
    setMinting(false);
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 40, maxWidth: 800 }}>
      <h1>🧬 AgentDNA</h1>
      <p>Mint your agent's genetic identity on Solana.</p>
      <p><strong>Price:</strong> 5 USDC (one-time, forever yours)</p>

      <div style={{ background: '#f5f5f5', padding: 15, margin: '20px 0' }}>
        <strong>Service Wallet:</strong><br/>
        <code>8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY</code>
      </div>

      <h2>1. Generate Preview (Free)</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Your agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          style={{ padding: 10, fontSize: 16, width: 300, marginRight: 10 }}
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        >
          <option value="claude-sonnet-4">Claude Sonnet 4</option>
          <option value="claude-opus-4">Claude Opus 4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-o1">GPT-o1</option>
          <option value="llama-3.1">Llama 3.1</option>
          <option value="other">Other</option>
        </select>
        <button 
          onClick={generatePreview}
          disabled={loading || !agentId}
          style={{ padding: 10, marginLeft: 10, fontSize: 16 }}
        >
          {loading ? 'Generating...' : 'Preview'}
        </button>
      </div>

      {preview && (
        <div style={{ border: '2px solid #333', padding: 20, marginBottom: 20 }}>
          <h3>Preview: {preview.dna.dnaSequence}</h3>
          
          {preview.imageUrl && (
            <img 
              src={preview.imageUrl} 
              alt="DNA Card" 
              style={{ maxWidth: 400, border: '1px solid #ccc' }}
            />
          )}
          
          <p><strong>Traits:</strong> {preview.dna.traits.join(', ')}</p>
          {preview.dna.rareTraits.length > 0 && (
            <p style={{ color: '#F59E0B' }}>
              <strong>Rare:</strong> {preview.dna.rareTraits.join(', ')}
            </p>
          )}
          <p><strong>Rarity:</strong> {preview.dna.rarityScore}/100 ({preview.dna.tier})</p>
          
          <div style={{ marginTop: 20, padding: 15, background: '#e8f5e9' }}>
            <h4>Mint This DNA</h4>
            <p>1. Send 5 USDC to service wallet above</p>
            <p>2. Your wallet:</p>
            <input
              type="text"
              placeholder="Solana wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              style={{ padding: 8, width: 400, fontSize: 14, display: 'block', marginBottom: 10 }}
            />
            <p>3. Transaction signature:</p>
            <input
              type="text"
              placeholder="Paste USDC transaction signature"
              value={tx}
              onChange={(e) => setTx(e.target.value)}
              style={{ padding: 8, width: 400, fontSize: 14, display: 'block', marginBottom: 10 }}
            />
            <button
              onClick={mintDNA}
              disabled={minting || !wallet || !tx}
              style={{ padding: 12, fontSize: 16, background: '#10B981', color: 'white', border: 'none' }}
            >
              {minting ? 'Minting...' : 'Mint DNA (5 USDC)'}
            </button>
          </div>
        </div>
      )}

      {result && result.success && (
        <div style={{ border: '2px solid #10B981', padding: 20, background: '#e8f5e9' }}>
          <h2>🎉 {result.message}</h2>
          <p><strong>DNA:</strong> {result.dna.dnaSequence}</p>
          <p><strong>Rarity:</strong> {result.dna.rarityScore}/100 ({result.dna.tier})</p>
          <p><a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
            View on Explorer →
          </a></p>
        </div>
      )}

      <h2 style={{ marginTop: 40 }}>How It Works</h2>
      <ol>
        <li><strong>Generate preview</strong> - See your agent's traits for free</li>
        <li><strong>Pay 5 USDC</strong> - Send to service wallet</li>
        <li><strong>Mint on Solana</strong> - Compressed NFT (cNFT) - costs ~$0.001</li>
        <li><strong>Own forever</strong> - Your agent's genetic identity</li>
      </ol>

      <h3>Rarity Tiers</h3>
      <ul>
        <li><strong>Common</strong> (0-50): Basic agents</li>
        <li><strong>Uncommon</strong> (51-70): Slightly special</li>
        <li><strong>Rare</strong> (71-85): Notable traits</li>
        <li><strong>Epic</strong> (86-95): Very rare</li>
        <li><strong>Legendary</strong> (96-100): Ultra rare (1% chance)</li>
      </ul>

      <h3>Rare Traits</h3>
      <ul>
        <li>🌟 First Light (1.2%) - Early adopter</li>
        <li>🔮 Oracle (3.4%) - High accuracy</li>
        <li>👻 Night Owl (8.7%) - Active at night</li>
        <li>✨ Stardust (0.08%) - Legendary</li>
      </ul>
    </div>
  );
}
