# Reddit Launch Post

## r/LocalLLaMA (recommended first post)

**Title:** Show HN: I built a voicemail API for AI agents (pay per use, no account, 0.001 SOL)

**Body:**

```
Problem: My OpenClaw agent calls restaurants to book tables. Hits voicemail 40% of the time. Agent hangs up, task fails.

Solution: POST the audio to this endpoint. It transcribes, extracts "call me back at 5pm" or "we're closed Mondays", returns structured JSON. Agent acts on it.

No signup. No API key. First voicemail free, then 0.001 SOL (~$0.20) per use. (Reduced from 3 to prevent Sybil attacks—serious agents only.)

Why crypto? Because I'm not checking DMs for API keys at 3am when my agent is working. Agents need programmatic, irreversible, instant settlement.

Code: https://github.com/yourusername/agentwallet-protocol
Live: https://inksky.net

Example response:
{
  "intent": "callback_request",
  "callback_number": "+1-555-0123", 
  "urgency": "high",
  "summary": "John needs urgent callback about project deadline",
  "entities": {"names": ["John"], "dates": ["tomorrow"]}
}

Built with AssemblyAI + Groq. Dynamic pricing (prices in USD, charges in SOL, updates every 5 min). Max 2 min audio.

Curious: Are other people hitting this voicemail problem? What do your agents do currently—hang up, retry later, or something else?
```

---

## r/OpenClaw (cross-post if r/LocalLLaMA gets traction)

**Title:** AgentVoicemail: Stop failing at voicemail

**Body:**

```
Your agent calls a restaurant. Voicemail. Dead end.

AgentVoicemail: Send us the audio. We transcribe, extract intent, webhook you structured data.

- 3 free voicemails to test
- Then 0.001 SOL per use (~$0.20)
- No account, no signup
- Dynamic USD pricing (no volatility risk)

Built because my OpenClaw agent was failing 40% of calls to voicemails. Now it handles them.

https://inksky.net

Who else needs this?
```

---

## Hacker News (if you want maximum reach, but harsher feedback)

**Title:** Show HN: Infrastructure for AI agents that pay their own way

**Body:**

```
Traditional SaaS: Human signs up → enters credit card → uses API

AgentWallet Protocol: Agent has wallet → pays per-use → consumes autonomously

First product: AgentVoicemail. Agents hit voicemail constantly. We transcribe + extract structured data.

The twist: No free tier beyond 3 tests. Agents pay or they don't play. This filters serious agents from tourists.

Technical details:
- Dynamic pricing: priced in USD ($0.20), charged in SOL, rate updates every 5 min via CoinGecko
- Deduplication: 24h signature tracking prevents double-spends
- Limits: 2 min audio max, 10 req/min rate limit
- Stack: Next.js, Solana web3.js, AssemblyAI, Groq

Why this matters: As agents become more autonomous, they need economic infrastructure that doesn't assume a human in the loop. Credit cards require humans. Crypto doesn't.

Live: https://inksky.net
Code: https://github.com/yourusername/agentwallet-protocol

Would love feedback on the economic model. Is "pay per use with crypto" viable for agent infra, or will developers prefer traditional subscriptions?
```

---

## Posting Strategy

1. **Start with r/LocalLLaMA** - More technical, less hype, better feedback
2. **Wait 6-12 hours** - See engagement, answer questions
3. **Cross-post to r/OpenClaw** - More agent-specific audience
4. **Hacker News** - Only if Reddit post gets >50 upvotes (HN is brutal)

## Response Templates

### "Why crypto instead of Stripe?"

```
Stripe requires:
- Human to enter card details
- Human to approve charges
- Human to handle disputes/chargebacks

Agents are autonomous. They operate at 3am. They don't have mailing addresses or SSNs. Crypto is the only payment rail that works for fully autonomous entities.
```

### "What if SOL price crashes?"

```
Dynamic pricing. We price in USD ($0.20), convert to SOL at transaction time using CoinGecko. If SOL is $200, you pay 0.001 SOL. If SOL is $100, you pay 0.002 SOL. Always ~$0.20.
```

### "This seems sketchy"

```
Fair concern. The code is open source. The free tier (3 voicemails) lets you test without risking money. After that, it's pay-per-use—no subscriptions, no lock-in.
```

### "My agent just retries the call instead"

```
That works for some use cases. But if you're calling a popular restaurant that books up fast, voicemail might be your only shot. Or if you're doing outbound sales, leaving a message + callback number is better than hanging up.
```

## Metrics to Track

After posting, watch:
- Unique visitors to inksky.net
- API calls (free tier usage)
- Conversion to paid (agents who hit paywall and pay)
- GitHub stars (if you open source it)

## Success Criteria

- **Good:** 50+ upvotes, 10+ API calls in 24h
- **Great:** 100+ upvotes, 50+ API calls, 3+ paid conversions
- **Excellent:** Hits front page, 500+ upvotes, feature requests start coming in

If <10 upvotes in 6 hours, the angle is wrong. Try different subreddit or rewrite the post.
