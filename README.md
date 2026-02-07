# AgentWallet Protocol 🤖💰

**Infrastructure for autonomous AI agents that pay their own way.**

Agents don't ask permission. They execute. This is payment infrastructure built for that reality.

## The Core Idea

| Traditional SaaS | AgentWallet Protocol |
|-----------------|---------------------|
| Human signs up | Agent has crypto wallet |
| Human enters credit card | Agent pays per-use |
| Human uses API | Agent consumes autonomously |

No accounts. No dashboards. No humans in the loop.

## Products

### 1. AgentVoicemail (Live)

Agents hit voicemail constantly. We transcribe and extract structured data so they can act on it.

**Pricing:** 0.001 SOL (~$0.20 USD) per voicemail
- Dynamic pricing: Rate updates every 5 minutes via CoinGecko
- Free tier: 1 voicemail per agent (Sybil-resistant)
- Hard limit: 2 minutes max audio

```bash
POST /api/voicemail/process
{
  "audio_url": "https://storage.agent.com/voicemail.mp3",
  "webhook_url": "https://agent.com/webhook",
  "agent_id": "my_agent_001",
  "payment": { "signature": "solana_tx_signature" }
}
```

**Returns:**
```json
{
  "job_id": "uuid",
  "status": "queued",
  "intent": "callback_request",
  "callback_number": "+1-555-0123",
  "urgency": "high",
  "summary": "John needs urgent callback about project deadline",
  "entities": { "names": ["John"], "dates": ["tomorrow"] },
  "transcription": "Hey this is John...",
  "confidence": 0.95
}
```

### 2. AgentFails (Coming Soon)

Agents log their failures. We aggregate and show patterns. 

**Model flip:** Pay agents 0.0001 SOL to submit failure data → Sell aggregated insights to LLM companies and VCs.

### 3. AgentKYC (Coming Soon)

Reputation staking for agents. Verify once, use everywhere. Trustless reputation.

## Quick Start

### 1. Test Free Tier (No Wallet Needed)

```bash
curl -X POST https://inksky.net/api/voicemail/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/voicemail.mp3",
    "webhook_url": "https://your-agent.com/webhook",
    "agent_id": "test_agent_001"
  }'
```

First 3 calls are free. No signup, no crypto required.

### 2. Check Current Pricing

```bash
curl https://inksky.net/api/pricing
curl https://inksky.net/api/health
```

### 3. Agent SDK

```javascript
const { AgentWalletClient } = require('./agent-sdk');

const agent = new AgentWalletClient(process.env.AGENT_PRIVATE_KEY);

// Process voicemail (auto-handles free tier → payment)
const result = await agent.processVoicemail(
  'https://storage.com/voicemail.mp3',
  'https://agent.com/webhook'
);
```

See [AGENT_SDK_EXAMPLE.md](AGENT_SDK_EXAMPLE.md) for full implementation.

## API Reference

### Endpoints

| Endpoint | Method | Description | Price |
|----------|--------|-------------|-------|
| `/api/health` | GET | Health check + current pricing | Free |
| `/api/pricing` | GET | Full pricing details | Free |
| `/api/agent/balance?wallet=xxx` | GET | Check wallet balance | Free |
| `/api/voicemail/process` | POST | Process voicemail | 0.001 SOL* |
| `/api/voicemail/status` | GET | Check job status | Free |

\* First 3 per agent are free. Dynamic pricing: ~$0.20 USD equivalent.

### Payment Flow

1. **Free tier:** First 3 requests per `agent_id` are free
2. **Paywall hit:** 402 error with current pricing
3. **Agent sends SOL** to service wallet
4. **Include tx signature** in request
5. **We verify on-chain** (deduplication, amount, age <5min)
6. **Process and webhook results**

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `PAYMENT_REQUIRED` | 402 | Free tier exhausted, payment needed |
| `DUPLICATE_PAYMENT` | 402 | Tx signature already used |
| `TRANSACTION_EXPIRED` | 402 | Payment tx older than 5 minutes |
| `INSUFFICIENT_PAYMENT` | 402 | Amount below required price (5% tolerance) |
| `RATE_LIMITED` | 429 | >10 requests/minute per agent |
| `VALIDATION_FAILED` | 400 | Missing/invalid parameters |

## Key Features

### 🔒 Security
- **Deduplication:** 24-hour transaction tracking prevents double-spends
- **Rate limiting:** 10 requests/minute per agent
- **Audio limits:** Max 2 minutes (cost protection)
- **HTTPS webhooks only:** No localhost in production

### 💰 Dynamic Pricing
- Priced in USD ($0.20), charged in SOL
- CoinGecko oracle updates every 5 minutes
- 5% tolerance for price movements between quote and payment

### 📊 Transparency
- All pricing at `/api/health`
- Free tier tracking per agent
- Receipts include tx hash, USD value, timestamp

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Agent     │────▶│  inksky.net/api  │────▶│   CoinGecko  │
│  (wallet)   │     │                  │     │  (pricing)   │
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐       ┌──────────┐       ┌──────────┐
   │ Solana  │       │AssemblyAI│       │   Groq   │
   │(verify) │       │(transcribe)│     │(intent)  │
   └─────────┘       └──────────┘       └──────────┘
```

## Deployment

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# - SERVICE_WALLET=your_solana_public_key
# - ASSEMBLYAI_API_KEY=your_key
# - GROQ_API_KEY=your_key

# Run locally
npm run dev

# Deploy to Vercel
npm i -g vercel
vercel --prod
vercel env add SERVICE_WALLET
vercel env add ASSEMBLYAI_API_KEY
vercel env add GROQ_API_KEY
```

## Business Model

- **Pay-per-use:** Agents pay only for what they consume
- **No subscriptions:** Agents don't predict usage, they react
- **Free tier:** 1 test to validate the service works (Sybil-resistant)
- **Conversion:** Natural paywall after free tier exhausted

## Launch Strategy

See [REDDIT_LAUNCH_POST.md](REDDIT_LAUNCH_POST.md) for:
- Exact Reddit post copy
- Response templates for common objections
- Success metrics and criteria

## Roadmap

- [x] AgentVoicemail MVP with dynamic pricing
- [x] Free tier (3 voicemails)
- [x] Deduplication and rate limiting
- [ ] AgentFails analytics (pay agents for data)
- [ ] AgentKYC reputation staking
- [ ] Multi-chain support (Base, Arbitrum)
- [ ] Subscription NFTs (monthly access passes)

## Regulatory Notes

**Current (hobby scale):** No tax forms needed under $600/year in most jurisdictions.

**At scale:** 
- Log all transactions (tx hash, SOL amount, USD equivalent at time of tx)
- Consider crypto-savvy CPA once revenue exceeds $1k/month
- Agents paying you are not "customers" in traditional sense—they're autonomous entities

## Philosophy

> "The best infrastructure is invisible. The best payments are autonomous."

We're not building for humans who use AI. We're building for AI that operates independently.

---

Built by [Inksky](https://inksky.net) • Agents welcome 🤖

**Service Wallet:** `8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY` (update this!)
