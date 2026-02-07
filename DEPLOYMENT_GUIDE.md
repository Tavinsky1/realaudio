# AgentWallet Protocol - Deployment Guide

## 🚀 Step-by-Step Production Deployment

### Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Solana wallet (Phantom or Solflare)
- API keys for AssemblyAI and Groq

---

## Phase 1: Environment Setup (15 minutes)

### 1.1 Create Solana Service Wallet

1. **Install Phantom wallet** (browser extension)
2. **Create new wallet** or use existing
3. **Copy the PUBLIC KEY** (starts with a number or letter, ~44 chars)
   - This is your `SERVICE_WALLET`
   - Agents will send payments here
4. **Fund with a small amount of SOL** (0.1 SOL is plenty for testing)

⚠️ **SECURITY:** Never commit your private key. Only use the public key.

### 1.2 Get API Keys

#### AssemblyAI (Transcription)
1. Go to https://www.assemblyai.com/
2. Sign up for free account
3. Copy your API key
4. **Free tier:** 5 hours of audio (sufficient for launch)

#### Groq (LLM for intent extraction)
1. Go to https://groq.com/
2. Create account
3. Generate API key
4. **Free tier:** 20K requests/day (very generous)

#### Helius (Optional but recommended)
1. Go to https://helius.xyz/
2. Sign up
3. Create API key
4. **Free tier:** Enough for launch, more reliable than public RPC

### 1.3 Configure Environment Variables

Create `.env` file:

```bash
cd agent-tools
cp .env.example .env
```

Edit `.env`:

```bash
# Required
SERVICE_WALLET=your_solana_public_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
GROQ_API_KEY=your_groq_key_here

# Optional but recommended
HELIUS_API_KEY=your_helius_key_here

# For local development
NODE_ENV=development
```

---

## Phase 2: Code Updates (10 minutes)

### 2.1 Update Service Wallet References

Replace `YOUR_SERVICE_WALLET_HERE` in:

```bash
# Use find and replace, or edit manually:
lib/solana.js
pages/index.js
README.md
agent_sdk.py
```

### 2.2 Verify OpenAPI Spec

Check that `specs/openapi.yaml` is complete:

```bash
# Validate OpenAPI spec
npx swagger-cli validate specs/openapi.yaml
```

---

## Phase 3: Local Testing (15 minutes)

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Run Local Server

```bash
npm run dev
```

Server starts on http://localhost:3000

### 3.3 Test Endpoints

Open new terminal:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test pricing
curl http://localhost:3000/api/pricing

# Test status page
curl http://localhost:3000/api/status
```

All should return valid JSON.

### 3.4 Test Free Tier

```bash
curl -X POST http://localhost:3000/api/voicemail/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/test.mp3",
    "webhook_url": "https://httpbin.org/post",
    "agent_id": "test_deployment"
  }'
```

Expected response:
```json
{
  "status": "queued",
  "free_tier": true,
  "remaining_free": 0
}
```

### 3.5 Test Paywall

Run same curl again. Should return:
```json
{
  "error": "PAYMENT_REQUIRED",
  "pricing": { "sol": 0.001, "usd": 0.20 }
}
```

✅ **Local tests passing? Proceed to deploy.**

---

## Phase 4: Deploy to Vercel (10 minutes)

### 4.1 Login to Vercel

```bash
vercel login
```

Follow browser prompts.

### 4.2 Deploy

```bash
vercel --prod
```

This will:
- Upload your code
- Build the project
- Deploy to production URL

### 4.3 Set Environment Variables

```bash
# Add each secret
vercel env add SERVICE_WALLET
# Enter your Solana public key when prompted

vercel env add ASSEMBLYAI_API_KEY
# Enter your AssemblyAI key

vercel env add GROQ_API_KEY
# Enter your Groq key

vercel env add HELIUS_API_KEY
# Optional: Enter Helius key
```

### 4.4 Redeploy with Secrets

```bash
vercel --prod
```

---

## Phase 5: Production Verification (15 minutes)

### 5.1 Test Live Endpoints

Replace `your-domain` with your actual Vercel domain:

```bash
# Test health
curl https://your-domain.vercel.app/api/health

# Test pricing
curl https://your-domain.vercel.app/api/pricing
```

### 5.2 Test Free Tier (Production)

```bash
curl -X POST https://your-domain.vercel.app/api/voicemail/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/test.mp3",
    "webhook_url": "https://httpbin.org/post",
    "agent_id": "prod_test_001"
  }'
```

### 5.3 Verify Landing Page

Open browser to `https://your-domain.vercel.app`

Check:
- [ ] Page loads without errors
- [ ] Service wallet displayed correctly
- [ ] Pricing shown
- [ ] API docs link works

### 5.4 Set Custom Domain (Optional)

If using `inksky.net`:

```bash
vercel domains add inksky.net
```

Follow Vercel instructions to update DNS.

---

## Phase 6: Security Hardening Checklist

Verify all protections are active:

| Check | Command/Check |
|-------|---------------|
| ✅ Rate limiting | 11th request in 1 min should 429 |
| ✅ Free tier limit | 2nd request from same agent_id should 402 |
| ✅ Audio validation | Invalid URL should 400 |
| ✅ HTTPS webhooks | HTTP webhook should be rejected |
| ✅ Payment verification | Old tx signature should be rejected |
| ✅ Multi-RPC | Test with Helius disabled |

---

## Phase 7: Launch (5 minutes)

### 7.1 Update DNS (if using custom domain)

Point your domain to Vercel:
- A Record: `76.76.21.21`
- Or CNAME: `cname.vercel-dns.com`

### 7.2 Post on Reddit

Copy from `REDDIT_LAUNCH_POST.md`

Post to:
1. r/LocalLLaMA (primary)
2. Wait 6 hours
3. Cross-post to r/OpenClaw if traction

---

## Phase 8: Post-Launch Monitoring

### 8.1 Watch Vercel Logs

```bash
vercel logs --prod
```

### 8.2 Monitor Metrics

Track:
- API calls (free tier)
- Payment conversions
- Error rates
- Unique agent_ids

### 8.3 Set Up Alerts (Optional)

In Vercel dashboard:
- Set up error alerting
- Monitor function duration
- Watch usage limits

---

## 🛡️ Security Checklist

Before launch, verify:

- [ ] Service wallet is public key only (never private)
- [ ] API keys are in Vercel env vars, not code
- [ ] `.env` file is in `.gitignore`
- [ ] Free tier is 1 (not 3) per agent
- [ ] Rate limiting is 10 req/min
- [ ] Audio max is 2 minutes
- [ ] HTTPS webhooks enforced
- [ ] Multi-RPC fallback configured
- [ ] Transaction deduplication active

---

## 🚨 Rollback Plan

If something breaks:

```bash
# Rollback to previous deployment
vercel rollback

# Or disable endpoint quickly
# Edit pages/api/voicemail/process.js to return 503
```

---

## 📊 Success Metrics (Week 1 Goals)

| Metric | Target |
|--------|--------|
| API calls (free tier) | 20+ |
| Unique agents | 10+ |
| Paid conversions | 2+ |
| Uptime | 99%+ |

---

## 🎉 You're Live!

**Next steps:**
1. Monitor for 24 hours
2. Respond to Reddit comments
3. Collect feedback
4. Build AgentFails if demand is there

**Emergency contact:** Have your phone ready for Vercel alerts first 24h.

🤖💰 **Agents are now paying you.**
