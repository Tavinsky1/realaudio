# AgentWallet Protocol - Project Structure

```
agent-tools/
├── 📁 agents-tools-suite/              # Multi-tool suite container
│   ├── README.md                       # Suite overview
│   │
│   └── 📁 agentfails/                  # Failure analytics tool
│       ├── README.md                   # Tool documentation
│       ├── openapi.yaml                # OpenAPI specification
│       └── 📁 src/
│           ├── index.js                # Core implementation
│           └── sdk.js                  # JavaScript SDK
│
├── 📁 lib/                             # Shared libraries
│   ├── solana.js                       # Payment verification
│   ├── pricing.js                      # Dynamic pricing oracle
│   ├── solana-rpc.js                   # Multi-RPC fallback
│   ├── dedup.js                        # Transaction deduplication
│   ├── webhook-queue.js                # Retry logic
│   ├── audio-validator.js              # Audio validation
│   ├── agent-registry.js               # Sybil resistance
│   ├── validator.js                    # Request validation
│   └── voicemail.js                    # Transcription + intent
│
├── 📁 pages/                           # Next.js pages
│   ├── index.js                        # Landing page
│   ├── api/
│   │   ├── docs.js                     # Swagger UI
│   │   ├── health.js                   # Health check
│   │   ├── pricing.js                  # Current pricing
│   │   ├── status.js                   # Public status
│   │   ├── agent/
│   │   │   └── balance.js              # Balance check
│   │   └── voicemail/
│   │       ├── process.js              # Main endpoint (HARDENED)
│   │       └── status.js               # Job status
│
├── 📁 specs/                           # OpenAPI specifications
│   └── openapi.yaml                    # Main API spec
│
├── 📁 node_modules/                    # Dependencies (gitignored)
│
├── 📄 agent-sdk.js                     # JavaScript SDK
├── 📄 agent_sdk.py                     # Python SDK
├── 📄 requirements.txt                 # Python dependencies
│
├── 📄 DEPLOYMENT_GUIDE.md              # Step-by-step deployment
├── 📄 LAUNCH_CHECKLIST.md              # Launch checklist
├── 📄 REDDIT_LAUNCH_POST.md            # Marketing copy
├── 📄 SECURITY_HARDENING.md            # Security summary
├── 📄 ARCHITECTURE.md                  # System architecture
├── 📄 PROJECT_STRUCTURE.md             # This file
│
├── 📄 README.md                        # Main documentation
├── 📄 .env.example                     # Environment template
├── 📄 next.config.js                   # Next.js config
├── 📄 package.json                     # Node dependencies
└── 📄 package-lock.json                # Locked versions
```

## File Purposes

### 🎯 Core Product Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/voicemail.js` | Transcribe audio, extract intent | ✅ Production |
| `lib/pricing.js` | CoinGecko oracle, USD pegging | ✅ Production |
| `lib/solana.js` | Payment verification | ✅ Production |
| `pages/api/voicemail/process.js` | Main API endpoint | ✅ Hardened |

### 🛡️ Security Files

| File | Protection | Status |
|------|------------|--------|
| `lib/solana-rpc.js` | Multi-RPC fallback | ✅ Active |
| `lib/dedup.js` | Double-spend prevention | ✅ Active |
| `lib/webhook-queue.js` | Retry logic | ✅ Active |
| `lib/audio-validator.js` | Cost protection | ✅ Active |
| `lib/agent-registry.js` | Sybil resistance | ⚠️ Optional |

### 📚 Documentation

| File | Audience | Purpose |
|------|----------|---------|
| `README.md` | Developers | Overview, quick start |
| `DEPLOYMENT_GUIDE.md` | You | Step-by-step deploy |
| `ARCHITECTURE.md` | Architects | System design |
| `SECURITY_HARDENING.md` | Security | Attack mitigations |
| `AGENT_SDK_EXAMPLE.md` | Agent devs | SDK usage |
| `REDDIT_LAUNCH_POST.md` | Marketing | Launch copy |

### 🔧 SDKs

| File | Language | Use Case |
|------|----------|----------|
| `agent-sdk.js` | JavaScript | Node.js agents |
| `agent_sdk.py` | Python | LangChain, AutoGPT |

### 📋 Specifications

| File | Standard | Purpose |
|------|----------|---------|
| `specs/openapi.yaml` | OpenAPI 3.0 | API documentation |
| `agents-tools-suite/agentfails/openapi.yaml` | OpenAPI 3.0 | Future tool spec |

## Key Design Decisions

### 1. Security First
- All endpoints validated
- Rate limiting on every request
- Payment verification multi-layered
- Audio limits prevent cost attacks

### 2. Developer Experience
- Both JS and Python SDKs
- Free tier for testing
- Clear error messages
- Interactive API docs

### 3. Future-Proof
- Modular tool structure
- Shared libraries
- OpenAPI specifications
- Easy to add new tools

## Deployment Artifacts

When you deploy, these files are included:
- All `.js` files (compiled)
- All API routes
- Static assets (landing page)
- Environment variables (secure)

Not included:
- `node_modules/` (built fresh)
- `.env` file (secrets in Vercel)
- Python files (separate if needed)

## Next Tool: AgentFails

Add to `agents-tools-suite/`:
```
agentfails/
├── pages/api/
│   ├── log.js
│   ├── stats.js
│   └── query.js
```

Reuse from shared:
- `lib/solana.js` (payments)
- `lib/pricing.js` (dynamic pricing)
- `lib/security.js` (rate limiting)

---

**Status:** Production ready. Security hardened. Fully documented. 🤖💰
