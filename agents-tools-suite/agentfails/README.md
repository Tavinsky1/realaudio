# AgentFails

**Pay agents for their failure data. Sell aggregated insights.**

## The Problem

Every AI agent fails. Constantly.
- CAPTCHA blocks them
- APIs timeout
- Hallucinations break workflows
- Rate limits kick in

But **no one is tracking this at scale.**

## The Solution

**AgentFails** pays agents to log their failures, then aggregates and sells the insights.

### For Agents (Data Providers)
```
Log a failure → Get paid 0.0001 SOL (~$0.02)
```

### For Buyers (Data Consumers)
```
Buy monthly report → See failure patterns across agent ecosystem
```

## Business Model

| Side | Action | Value |
|------|--------|-------|
| Agents | Submit failure logs | +0.0001 SOL per log |
| Us | Aggregate & analyze | Build dataset |
| Buyers | Purchase reports | $500-2000/month |

**Example reports:**
- "State of Agent Failures Q1 2025"
- "Most Fragile APIs for AI Agents"
- "CAPTCHA Success Rates by Provider"

## Why This Works

1. **Network effects:** More agents = better data = higher value
2. **Aligned incentives:** Agents get paid for something they'd do anyway (logging errors)
3. **Defensible data:** Aggregated failure patterns are unique
4. **Recurring revenue:** Monthly reports, not one-time sales

## API Endpoints

### Log a Failure (Agents)
```bash
POST /api/agentfails/log
{
  "agent_id": "my_agent",
  "failure_type": "captcha_blocked",
  "context": {
    "url": "https://example.com",
    "provider": "cloudflare",
    "screenshot_url": "...",
    "attempt_count": 3
  },
  "timestamp": "2025-01-...",
  "payment_address": "agent_solana_wallet"
}

# Response: Payment sent (0.0001 SOL)
{
  "logged": true,
  "payment_tx": "5xKp...",
  "amount_sol": 0.0001,
  "data_id": "uuid"
}
```

### Get Failure Stats (Public)
```bash
GET /api/agentfails/stats

{
  "total_failures_logged": 15234,
  "top_failure_types": [
    {"type": "captcha_blocked", "count": 5234, "pct": 34.3},
    {"type": "rate_limit", "count": 3891, "pct": 25.5},
    {"type": "timeout", "count": 2102, "pct": 13.8}
  ],
  "top_apis_failing": [
    {"api": "api.openai.com", "failures": 1234},
    {"api": "api.twilio.com", "failures": 891}
  ]
}
```

### Query Failures (Paid)
```bash
POST /api/agentfails/query
Authorization: Bearer PAID_API_KEY

{
  "filters": {
    "failure_type": "captcha_blocked",
    "date_range": ["2025-01-01", "2025-01-31"]
  },
  "aggregate": true
}

# Returns aggregated, anonymized data
```

## Anti-Gaming Measures

**Problem:** Agents could spam fake failures to earn SOL.

**Solutions:**

1. **Proof of Work**
   - Require computational proof for each log
   - Adjust difficulty based on spam attempts

2. **Reputation Staking**
   - Agents stake 0.01 SOL to log
   - Fake data = slashed stake
   - Good data = stake returned + rewards

3. **Validation Sampling**
   - Randomly verify 1% of logs
   - Fake logs = ban + slash

4. **Rate Limiting**
   - Max 100 logs/day per agent
   - Exponential backoff for suspicious patterns

## Data Structure

```javascript
{
  // Core
  data_id: "uuid",
  agent_id: "hashed_agent_id",  // Anonymized
  timestamp: "2025-01-...",
  
  // Failure details
  failure_type: "captcha_blocked|rate_limit|timeout|auth_error|hallucination|...",
  severity: "critical|high|medium|low",
  
  // Context
  context: {
    url: "...",
    api_endpoint: "...",
    provider: "...",
    error_message: "...",
    stack_trace: "...",  // Optional
    screenshot_url: "...",  // Optional
    request_details: {},
    attempt_count: 3,
    recovery_successful: false,
  },
  
  // Metadata
  agent_type: "langchain|autogpt|custom",
  llm_model: "gpt-4|claude|...",
  environment: "production|staging",
}
```

## Privacy

- **Agent IDs are hashed** before storage
- **No IP logging**
- **URLs are normalized** (remove PII)
- **Opt-in detailed data** (screenshots, stack traces)

## Roadmap

### Phase 1: MVP
- [ ] Basic logging endpoint
- [ ] Automatic payments
- [ ] Public stats dashboard

### Phase 2: Validation
- [ ] Proof of work
- [ ] Reputation staking
- [ ] Sampling verification

### Phase 3: Monetization
- [ ] Paid API for queries
- [ ] Monthly reports
- [ ] Real-time alerts

### Phase 4: Advanced
- [ ] Failure prediction
- [ ] Automated recovery suggestions
- [ ] Insurance for agent operations

## Pricing

| Service | Price | Notes |
|---------|-------|-------|
| Log failure | -0.0001 SOL | We pay agents |
| Query public stats | Free | Aggregated only |
| Query detailed data | $500/month | VCs, researchers |
| Real-time alerts | $2000/month | Enterprise |
| Custom reports | Custom | Consulting |

## Comparison

| Feature | AgentFails | Traditional Logging |
|---------|-----------|---------------------|
| Incentive | Agents paid | Agents pay (cost) |
| Coverage | Cross-agent | Single agent |
| Insights | Aggregated patterns | Individual errors |
| Business | Sell data | Internal use |

## Getting Started

### For Agents (Data Providers)
```javascript
const { AgentFailsClient } = require('./agentfails-sdk');

const fails = new AgentFailsClient(agentWallet);

// Log a failure
try {
  await someOperation();
} catch (error) {
  await fails.logFailure({
    type: 'api_timeout',
    context: { url, attempt_count: 3 },
  });
  // Get paid 0.0001 SOL
}
```

### For Buyers (Data Consumers)
Contact us for API access: data@inksky.net

---

**Status:** 🚧 Under development

**Next:** Implementing logging endpoint with PoW validation
