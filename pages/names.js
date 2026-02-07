import { useState } from 'react';

export default function Names() {
  const [name, setName] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState('');
  const [tx, setTx] = useState('');
  const [registering, setRegistering] = useState(false);

  const checkName = async () => {
    if (!name) return;
    setChecking(true);
    
    try {
      const res = await fetch(`/api/names/check?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Check failed' });
    }
    
    setChecking(false);
  };

  const registerName = async () => {
    if (!wallet || !tx) return;
    setRegistering(true);
    
    try {
      const res = await fetch('/api/names/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.normalized,
          owner_wallet: wallet,
          payment_tx: tx,
        }),
      });
      
      const data = await res.json();
      setResult({ ...result, registration: data });
    } catch (err) {
      setResult({ ...result, registration: { error: 'Registration failed' } });
    }
    
    setRegistering(false);
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: 40, maxWidth: 700 }}>
      <h1>🎭 AgentName.usdc</h1>
      <p>Unique names for AI agents. Pay with USDC. Own forever.</p>

      <div style={{ marginTop: 30 }}>
        <input
          type="text"
          placeholder="Enter name (e.g., jarvis, nova, xyz)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, fontSize: 16, width: 300 }}
        />
        <button 
          onClick={checkName}
          disabled={checking || !name}
          style={{ padding: 10, marginLeft: 10, fontSize: 16 }}
        >
          {checking ? 'Checking...' : 'Check Availability'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 30, padding: 20, background: '#f5f5f5' }}>
          {!result.error && (
            <>
              <h2>{result.normalized}.agent</h2>
              
              {result.available ? (
                <div style={{ color: 'green' }}>
                  <p>✅ Available!</p>
                  <p><strong>Price:</strong> {result.pricing.price} USDC ({result.pricing.label})</p>
                  <p><strong>Tier:</strong> {result.pricing.tier}</p>
                </div>
              ) : (
                <div style={{ color: 'red' }}>
                  <p>❌ Taken</p>
                  {result.suggestions?.length > 0 && (
                    <div>
                      <p>Suggestions:</p>
                      <ul>
                        {result.suggestions.map((s) => (
                          <li key={s}>{s}.agent</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.available && !result.registration && (
                <div style={{ marginTop: 20 }}>
                  <h3>Register This Name</h3>
                  <p>1. Send {result.pricing.price} USDC to:</p>
                  <code style={{ background: '#fff', padding: 5 }}>
                    8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY
                  </code>
                  
                  <p style={{ marginTop: 10 }}>2. Your wallet address:</p>
                  <input
                    type="text"
                    placeholder="Your Solana wallet"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    style={{ padding: 8, width: 400, fontSize: 14 }}
                  />
                  
                  <p style={{ marginTop: 10 }}>3. Transaction signature:</p>
                  <input
                    type="text"
                    placeholder="Paste USDC transaction signature"
                    value={tx}
                    onChange={(e) => setTx(e.target.value)}
                    style={{ padding: 8, width: 400, fontSize: 14 }}
                  />
                  
                  <br />
                  <button
                    onClick={registerName}
                    disabled={registering || !wallet || !tx}
                    style={{ padding: 10, marginTop: 10, fontSize: 16 }}
                  >
                    {registering ? 'Registering...' : `Pay ${result.pricing.price} USDC & Register`}
                  </button>
                </div>
              )}

              {result.registration?.success && (
                <div style={{ color: 'green', marginTop: 20 }}>
                  <h3>🎉 Success!</h3>
                  <p>{result.registration.message}</p>
                  <p>You own <strong>{result.registration.name}.agent</strong></p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 50 }}>
        <h2>Pricing</h2>
        <ul>
          <li><strong>3 letters</strong> (abc, xyz): 100 USDC - Super rare</li>
          <li><strong>4 letters</strong> (nova, lyra): 25 USDC - Uncommon</li>
          <li><strong>5+ letters</strong> (jarvis, helper): 5 USDC - Common</li>
          <li><strong>Dictionary words</strong> (ai, bot, soul): 250 USDC - Premium</li>
        </ul>
        <p style={{ fontSize: 14, color: '#666' }}>
          All names are lowercase, alphanumeric, and hyphens only.
        </p>
      </div>
    </div>
  );
}
