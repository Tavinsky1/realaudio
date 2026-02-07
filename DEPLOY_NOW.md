# Deploy AgentVoicemail in 10 Minutes

## ✅ Your Wallet is Set
**Address:** `8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY`

**You have:** 9.90 USDC
**You need:** ~0.001 SOL for gas fees

---

## Step 1: Get SOL for Gas (2 minutes)

Go to: https://solfaucet.com/
1. Paste: `8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY`
2. Click "Request Airdrop"
3. Wait 30 seconds
4. Check Phantom - you should have ~0.001 SOL

---

## Step 2: Get API Keys (5 minutes)

### AssemblyAI
1. https://www.assemblyai.com/
2. Sign up
3. Copy API key

### Groq  
1. https://groq.com/
2. Create account
3. Generate API key

---

## Step 3: Deploy (3 minutes)

```bash
cd agent-tools

# Install dependencies
npm install

# Login to Vercel (if not already)
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add ASSEMBLYAI_API_KEY
# Paste your AssemblyAI key

vercel env add GROQ_API_KEY
# Paste your Groq key

# Redeploy with env vars
vercel --prod
```

---

## Step 4: Test (2 minutes)

```bash
# Test health endpoint
curl https://your-domain.vercel.app/api/health

# Test free tier
curl -X POST https://your-domain.vercel.app/api/voicemail/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/test.mp3",
    "webhook_url": "https://httpbin.org/post",
    "agent_id": "test_001"
  }'
```

Should return:
```json
{
  "status": "queued",
  "free_tier": true,
  "remaining_free": 0
}
```

---

## Step 5: Post on Reddit (5 minutes)

**r/LocalLLaMA**

Title: "AgentVoicemail: My agent pays 0.001 SOL (~$0.20) to handle voicemails"

Body:
```
Problem: My OpenClaw agent calls restaurants, hits voicemail 40% of the time, hangs up, fails.

Solution: Agent sends 0.001 SOL → Gets back structured intent → Acts on it.

No human. No signup. No API key. Just agent → service → agent.

First voicemail free. Then agents pay from their wallets.

Live: https://your-domain.vercel.app
Wallet: 8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY

Agents with wallets: Do you need this?
```

---

## What Happens Next

1. **Agents test** (free tier)
2. **Some pay** (0.001 SOL per voicemail)
3. **SOL arrives** in your wallet: `8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY`
4. **You convert** SOL → USDC on Jupiter (jup.ag) if you want stablecoin

---

## Success Metrics (48 hours)

| Metric | Target |
|--------|--------|
| API calls | 10+ |
| Unique agents | 5+ |
| Paid voicemails | 2+ |

**2+ paid voicemails = Product-market fit. Build more features.**
**0 paid voicemails = Pivot to AgentCaptcha.**

---

## Emergency

If something breaks:
```bash
vercel logs --prod
```

Or DM me the error.

---

**GO GET THAT SOL FAUCET AND DEPLOY.** 🤖💰
