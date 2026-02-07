# AgentWallet Protocol - Launch Checklist (Security Hardened)

## ✅ What We Built

A **production-ready, security-hardened** crypto-native API for AI agents:

### Core Features
- **AgentVoicemail** - Process voicemails, charge 0.001 SOL
- **Dynamic Pricing** - USD-pegged ($0.20), CoinGecko oracle
- **Free Tier** - 1 voicemail (Sybil-resistant, down from 3)
- **Multi-RPC** - Helius + QuickNode + Public fallback
- **Webhook Retries** - 3x retry with 24h result storage
- **Audio Validation** - 2 min max, format check, size limit

### SDKs
- **JavaScript:** `agent-sdk.js`
- **Python:** `agent_sdk.py` (most agents use Python)

## 🚀 Launch Steps

### Phase 1: Setup (30 minutes)

- [ ] **Create Solana wallet** (service wallet)
  - Install Phantom or Solflare
  - Save PUBLIC KEY (not private key)
  - This is where agents send payments

- [ ] **Get API keys** (15 minutes)
  - [AssemblyAI](https://www.assemblyai.com/) - Free tier: 5 hours audio
  - [Groq](https://groq.com/) - Free tier: 20K requests/day
  - [Helius](https://helius.xyz/) - Free tier: Solana RPC (optional but recommended)

- [ ] **Configure environment**
  ```bash
  cd agent-tools
  cp .env.example .env
  # Edit .env:
  SERVICE_WALLET=your_public_key_here
  ASSEMBLYAI_API_KEY=your_key_here
  GROQ_API_KEY=your_key_here
  HELIUS_API_KEY=your_key_here  # Optional but recommended
  ```

- [ ] **Update service wallet in code**
  - Edit `lib/solana.js`: Replace `YOUR_SERVICE_WALLET_HERE`
  - Edit `pages/index.js`: Replace `YOUR_SERVICE_WALLET_HERE`
  - Edit `README.md`: Replace `YOUR_SERVICE_WALLET_HERE`
  - Edit `agent_sdk.py`: Replace `YOUR_SERVICE_WALLET_HERE`

### Phase 2: Deploy (15 minutes)

- [ ] **Deploy to Vercel**
  ```bash
  npm i -g vercel
  vercel --prod
  ```

- [ ] **Set environment variables in Vercel**
  ```bash
  vercel env add SERVICE_WALLET
  vercel env add ASSEMBLYAI_API_KEY
  vercel env add GROQ_API_KEY
  vercel env add HELIUS_API_KEY  # Optional
  vercel --prod  # Redeploy with env vars
  ```

- [ ] **Test endpoints**
  ```bash
  curl https://inksky.net/api/health
  curl https://inksky.net/api/pricing
  curl https://inksky.net/api/status
  ```

### Phase 3: Validation (1 hour)

- [ ] **Test free tier**
  ```bash
  curl -X POST https://inksky.net/api/voicemail/process \
    -H "Content-Type: application/json" \
    -d '{
      "audio_url": "https://example.com/test.mp3",
      "webhook_url": "https://httpbin.org/post",
      "agent_id": "test_launch"
    }'
  ```
  Should return: `free_tier: true, remaining_free: 0`

- [ ] **Test paywall**
  - Run the same curl again
  - Should return: `402 PAYMENT_REQUIRED`

- [ ] **Test payment flow** (if you have SOL)
  - Send 0.001 SOL to your service wallet
  - Include tx signature in request
  - Should process and return `payment_verified: true`

- [ ] **Test Python SDK**
  ```bash
  pip install -r requirements.txt
  python -c "from agent_sdk import AgentWallet; print('OK')"
  ```

### Phase 4: Launch (30 minutes)

- [ ] **Post to r/LocalLLaMA**
  - Use copy from `REDDIT_LAUNCH_POST.md`
  - Post at 9am PT for maximum US engagement
  - Monitor for 2 hours, respond to questions

- [ ] **Cross-post if traction**
  - If >20 upvotes in 6 hours, cross-post to r/OpenClaw
  - If >50 upvotes, consider Hacker News

## 📊 Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| API calls (free tier) | 20 | 24 hours |
| Unique agents | 10 | 24 hours |
| Paid conversions | 2 | 48 hours |
| GitHub stars | 10 | 1 week |

## 🛡️ Security Features Live

- ✅ 1 free voicemail per agent (Sybil-resistant)
- ✅ Multi-RPC fallback (Helius + public)
- ✅ Webhook retry (3x + 24h storage)
- ✅ Audio validation (2 min max)
- ✅ Rate limiting (10 req/min)
- ✅ Transaction deduplication (24h)

## 🔄 If It Doesn't Work

### Scenario: Zero API calls
- **Problem:** No one tried it
- **Fix:** Post to r/SingularityNet, r/AutoGPT, tweet about it

### Scenario: Free tier used, no payments
- **Problem:** Agents tested but didn't convert
- **Fix:** Lower price? Different audience? Price might be right but market not ready

### Scenario: RPC errors
- **Check:** Get free Helius API key (helius.xyz)
- **Fallback:** System works with public RPCs, just slower

## 🎯 Next Products (if this validates)

1. **AgentFails** - Pay agents 0.0001 SOL for failure logs, sell aggregated data
2. **AgentCaptcha** - 2captcha wrapper, 0.002 SOL per solve
3. **AgentProxy** - Rotating proxies for web scraping

## 💰 Revenue Projection

**Conservative:**
- 50 agents × 5 voicemails/month × $0.20 = $50/month
- Costs: ~$20/month (AssemblyAI)
- Profit: $30/month

**Optimistic:**
- 500 agents × 20 voicemails/month × $0.20 = $2,000/month
- Costs: ~$200/month
- Profit: $1,800/month

## ⚠️ Known Limitations

1. **In-memory storage** - Resets on deploy (free tier usage, results)
   - *Impact:* Agents get extra free voicemail after deploy
   - *Fix:* Add Redis/DB once you have paying customers

2. **No stake requirement yet** - Still vulnerable to determined Sybil
   - *Impact:* Some abuse possible
   - *Fix:* Implement `lib/agent-registry.js` stake system if abuse detected

3. **AssemblyAI free tier** - 5 hours total
   - *Impact:* Might hit limit quickly if popular
   - *Fix:* Upgrade to paid ($0.37/hour) once revenue > $100/month

## 📝 Post-Launch TODOs

- [ ] Monitor `/api/status` for errors
- [ ] Track conversion rate (free → paid)
- [ ] Watch for abuse patterns (same IP, fake agent_ids)
- [ ] Collect feature requests from users
- [ ] Implement stake system if Sybil attacks detected
- [ ] Add Redis for persistent storage

## 🎉 You're Ready

**Infrastructure:** ✅ Production-ready
**Security:** ✅ Hardened against common attacks  
**SDKs:** ✅ JS + Python
**Documentation:** ✅ Complete
**Launch copy:** ✅ Written

**Total time to first agent customer: ~30 minutes**

The Stripe for AI agents. Built for autonomy. Hardened for abuse. Ready for launch.

🤖💰 **Deploy and post.**
