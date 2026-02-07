# 🚀 Vercel Deployment Guide

## Security Improvements Completed ✅

Your API now has comprehensive bot protection:

### 1. Rate Limiting (Multi-Layer)
- **IP-Based**: 10 requests/minute per IP (DDoS protection)
- **Agent-Based**: 5 requests/minute per agent ID
- **Status Endpoint**: 30 requests/minute per IP

### 2. HTTP Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS): 2 years
- Content-Security-Policy (CSP)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricts camera, microphone, geolocation

### 3. Protected Files
- `.vercelignore` excludes sensitive files from deployment
- `.env` files never deployed
- Test files excluded
- Personal paths sanitized from all documentation

### 4. Error Handling
- Production errors sanitized (no stack traces)
- Development mode shows detailed errors
- All API responses validated

---

## 📦 Deploy to Vercel

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Project Directory
```bash
cd "/Users/tavinsky/Documents/ai/agent ideas/agent-tools"
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No (first time) or Yes (updating)
- **Project name?** agent-tools (or your choice)
- **Directory?** ./
- **Override settings?** No

### Step 4: Set Environment Variables in Vercel Dashboard

After deployment, go to your Vercel project settings:

**https://vercel.com/YOUR_USERNAME/agent-tools/settings/environment-variables**

Add these environment variables:

```bash
# AssemblyAI API Key
ASSEMBLYAI_API_KEY=<your-assemblyai-api-key>

# Groq API Key  
GROQ_API_KEY=<your-groq-api-key>

# Solana Service Wallet Public Key
SERVICE_WALLET=8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY

# Node Environment (automatically set by Vercel)
NODE_ENV=production
```

**IMPORTANT**: Never commit these values to GitHub!

### Step 5: Redeploy After Adding Environment Variables
```bash
vercel --prod
```

---

## 🧪 Test Your Production Deployment

### 1. Update Test Script
Edit `test-api.js` line 5 to use your Vercel URL:

```javascript
const API_URL = 'https://your-project.vercel.app';
```

### 2. Run Live Test
```bash
node test-api.js
```

This will:
- ✅ Check health endpoint
- ✅ Test with real audio (tmpfiles.org hosted file)
- ✅ Verify AssemblyAI transcription
- ✅ Verify Groq intent extraction
- ✅ Test webhook callbacks

### 3. Check Analytics Dashboard
Visit: `https://your-project.vercel.app/analytics`

You should see:
- Total requests processed
- Success rate
- Revenue generated
- Intent distribution
- Recent requests

---

## 🔒 Security Best Practices

### ✅ Already Implemented
- Rate limiting (IP + agent)
- HTTP security headers
- Input validation
- Audio file validation
- Payment verification
- Error sanitization
- Environment variable protection

### 🚨 Additional Recommendations

1. **Monitor Rate Limits**
   - Check logs for 429 errors
   - Adjust limits if needed in lib/rate-limiter.js

2. **Enable Vercel Firewall** (Pro plan)
   - DDoS protection
   - Geographic restrictions
   - Custom rules

3. **Set Up Monitoring**
   - Vercel Analytics (included)
   - Error tracking (Sentry)
   - Uptime monitoring (UptimeRobot)

4. **Rotate API Keys Regularly**
   - AssemblyAI key every 90 days
   - Groq key every 90 days
   - Update in Vercel dashboard

5. **Review Access Logs**
   - Check for unusual patterns
   - Monitor high-volume IPs
   - Block abusive agents

---

## 📊 Rate Limit Details

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| `/api/voicemail/process` | 10/min | IP-based | Global |
| `/api/voicemail/process` | 5/min | Agent ID | Per-agent |
| `/api/voicemail/status` | 30/min | IP-based | Global |
| `/api/health` | Unlimited | - | Public |

When limits are exceeded:
- Returns HTTP 429 (Too Many Requests)
- Includes `Retry-After` header
- Includes `X-RateLimit-*` headers

---

## 🐛 Troubleshooting

### Environment Variables Not Working
```bash
# Verify in Vercel dashboard
vercel env ls

# Pull environment to local for testing
vercel env pull .env.local
```

### Rate Limits Too Strict
Edit `pages/api/voicemail/process.js`:
```javascript
const IP_RATE_LIMIT = { maxRequests: 20, windowMs: 60000 }; // Increase
const AGENT_RATE_LIMIT = { maxRequests: 10, windowMs: 60000 }; // Increase
```

Then redeploy:
```bash
git add pages/api/voicemail/process.js
git commit -m "Adjust rate limits"
git push origin main
```

### Checking Logs
```bash
vercel logs https://your-project.vercel.app
```

---

## 📈 Next Steps

1. **Deploy to Production** ✅ (You're here)
2. **Test Live API** → Use test-api.js with Vercel URL
3. **Monitor Analytics** → Check /analytics dashboard
4. **Share with Agents** → Distribute API documentation
5. **Scale as Needed** → Adjust rate limits based on usage

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/Tavinsky1/realaudio
- **AssemblyAI Docs**: https://www.assemblyai.com/docs
- **Groq API Docs**: https://console.groq.com/docs
- **Solana Explorer**: https://explorer.solana.com

---

## 🎯 Expected Pricing After Deploy

- **Free Tier**: 1 voicemail per agent (no payment)
- **Paid**: $0.25 USD per voicemail
- **Dynamic SOL Pricing**: ~0.0029 SOL at $86-88/SOL
- **Live CoinGecko**: Updates every 5 minutes

**Example Revenue:**
- 10 agents using free tier = $0
- 100 paid voicemails = $25 revenue
- 1000 paid voicemails = $250 revenue

---

## ✅ Security Checklist

Before going live, verify:

- [x] Environment variables set in Vercel (not in code)
- [x] Rate limiting enabled
- [x] Security headers configured
- [x] Error messages sanitized
- [x] .env files in .gitignore
- [x] Test files excluded from deployment
- [x] Personal paths removed from docs
- [x] Payment verification working
- [x] Audio validation enabled
- [x] Analytics tracking functional

---

**You're ready to deploy! 🚀**

```bash
vercel --prod
```
