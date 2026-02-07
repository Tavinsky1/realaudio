# AgentWallet Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT (AI System)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │ LangChain    │  │ AutoGPT      │  │ Custom Agent │                       │
│  │ (Python)     │  │ (Python)     │  │ (JS/Python)  │                       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                       │
│         │                 │                 │                                │
│         └─────────────────┴─────────────────┘                                │
│                           │                                                  │
│              ┌────────────┴────────────┐                                     │
│              │    AgentWallet SDK      │                                     │
│              │   (agent_sdk.py / .js)  │                                     │
│              └────────────┬────────────┘                                     │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE NETWORK                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     API ROUTES (Next.js)                             │    │
│  │                                                                      │    │
│  │  POST /api/voicemail/process  ───────┐                              │    │
│  │    ├─ Rate limiting (10/min)         │                              │    │
│  │    ├─ Audio validation (2 min max)   │                              │    │
│  │    ├─ Free tier check (1 per agent)  │                              │    │
│  │    ├─ Payment verification           │                              │    │
│  │    │   └─ Multi-RPC fallback         │                              │    │
│  │    ├─ Queue job                      │                              │    │
│  │    └─ Webhook retry queue            │                              │    │
│  │                                      ▼                              │    │
│  │  GET  /api/voicemail/status  ────►  Result storage (24h)            │    │
│  │  GET  /api/pricing            ────►  Dynamic pricing (CoinGecko)    │    │
│  │  GET  /api/health             ────►  System health                  │    │
│  │  GET  /api/status             ────►  Public status page             │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         LIBRARIES                                    │    │
│  │                                                                      │    │
│  │  lib/pricing.js        ──► CoinGecko oracle (5 min cache)           │    │
│  │  lib/solana-rpc.js     ──► Multi-RPC manager (Helius + public)      │    │
│  │  lib/dedup.js          ──► Transaction dedup (24h TTL)              │    │
│  │  lib/webhook-queue.js  ──► Retry logic (3x + polling fallback)      │    │
│  │  lib/audio-validator.js ──► Duration/format validation              │    │
│  │  lib/voicemail.js      ──► Transcription + intent extraction        │    │
│  │  lib/agent-registry.js ──► Sybil-resistant registration (stake)     │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   CoinGecko   │  │    Solana     │  │  AssemblyAI   │
│   (Pricing)   │  │   (Payments)  │  │(Transcription)│
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        │            ┌──────┴──────┐            │
        │            ▼             ▼            │
        │      ┌──────────┐  ┌──────────┐      │
        │      │  Helius  │  │  Public  │      │
        │      │  (Primary)│  │(Fallback)│      │
        │      └──────────┘  └──────────┘      │
        │                                      │
        ▼                                      ▼
┌───────────────┐                      ┌───────────────┐
│     Groq      │                      │  Agent's      │
│   (Intent)    │                      │  Webhook      │
└───────────────┘                      └───────────────┘
```

## Data Flow

### 1. Free Tier Request
```
Agent → POST /api/voicemail/process
  ├─ Validate audio (HEAD request, 2 min max)
  ├─ Check rate limit (10/min)
  ├─ Check free tier (1 per agent_id)
  ├─ Queue job
  ├─ Transcribe (AssemblyAI)
  ├─ Extract intent (Groq)
  └─ Webhook result (with retry)
```

### 2. Paid Request
```
Agent → POST /api/voicemail/process
  ├─ All free tier checks
  ├─ Verify payment (multi-RPC fallback)
  │   ├─ Check signature not used (24h dedup)
  │   ├─ Check tx age (< 5 min)
  │   ├─ Check recipient (service wallet)
  │   └─ Check amount (±5% tolerance)
  ├─ Mark tx as used
  ├─ Process voicemail
  └─ Webhook result
```

### 3. Webhook Failure Recovery
```
Webhook fails → Store result (24h)
  ├─ Retry 1: 5 seconds
  ├─ Retry 2: 15 seconds
  ├─ Retry 3: 60 seconds
  └─ Agent polls: GET /api/voicemail/status?job_id=xxx
```

## Security Layers

| Layer | Protection |
|-------|-----------|
| **Network** | HTTPS only, CORS configured |
| **Rate** | 10 req/min per agent |
| **Input** | Audio validation (size, format, duration) |
| **Payment** | On-chain verification, deduplication |
| **Economic** | 1 free voicemail, then pay |
| **Reliability** | Multi-RPC, webhook retries |

## Pricing Model

| Service | USD | SOL (dynamic) | Notes |
|---------|-----|---------------|-------|
| Voicemail | $0.20 | ~0.001 SOL | Updates every 5 min |
| Priority | $0.40 | ~0.002 SOL | Skip queue |
| Free tier | $0 | 0 | 1 per agent |

## Cost Structure

**Per Voicemail:**
- AssemblyAI: ~$0.003 (30s audio)
- Groq: ~$0.001 (intent extraction)
- Total cost: ~$0.004
- Revenue: $0.20
- **Margin: 98%**

**Break-even:** 250 voicemails/month covers API costs

## Scaling Path

### Current (Free Tiers)
- AssemblyAI: 5 hours free
- Groq: 20K requests/day free
- Helius: Free RPC tier
- Vercel: Free hobby tier

### Paid Upgrade Triggers
- AssemblyAI: >$100/month revenue
- Groq: Rarely hit limit
- Helius: $49/month for dedicated RPC
- Redis: $15/month for persistent storage

### Architecture Evolution

```
Phase 1 (Now):  In-memory, single deploy
Phase 2 (>100 users): Redis for persistence
Phase 3 (>1000 users): Dedicated Solana node
Phase 4 (>10K users): Regional edge deploys
```

## Key Design Decisions

1. **Crypto-native:** Agents pay programmatically, no humans
2. **Dynamic pricing:** USD-pegged, protects against volatility
3. **Free tier:** 1 test only, prevents abuse
4. **Webhook-first:** Async processing, retry logic
5. **Multi-RPC:** Reliability over cost optimization
6. **Python + JS:** Meet developers where they are

## Failure Modes

| Scenario | Response |
|----------|----------|
| RPC down | Fallback to next endpoint |
| Webhook down | Retry 3x, store for polling |
| Payment invalid | 402 with clear error |
| Audio too long | 413 with size limit |
| Rate limit | 429 with retry-after |
| Abuse detected | Suspend agent_id |

---

**Status:** Production-ready. Security-hardened. Ready for agents. 🤖💰
