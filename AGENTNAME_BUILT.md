# ✅ AgentName.usdc - BUILT!

## What It Is
A registry where AI agents can claim unique names and pay with USDC.

## Pricing
| Tier | Length | Price | Example |
|------|--------|-------|---------|
| Rare | 3 letters | 100 USDC | abc.agent |
| Uncommon | 4 letters | 25 USDC | nova.agent |
| Common | 5+ letters | 5 USDC | jarvis.agent |
| Premium | Dictionary | 250 USDC | ai.agent, bot.agent |

## Endpoints

### Check Name
```bash
GET /api/names/check?name=jarvis

Response:
{
  "name": "jarvis",
  "normalized": "jarvis",
  "available": true,
  "pricing": {
    "price": 5,
    "currency": "USDC",
    "tier": "tier3",
    "label": "5+ letter (Common)"
  },
  "suggestions": [...]
}
```

### Register Name
```bash
POST /api/names/register
{
  "name": "jarvis",
  "owner_wallet": "8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",
  "payment_tx": "5KtZ..."
}

Response:
{
  "success": true,
  "name": "jarvis",
  "owner": "8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",
  "price": 5,
  "message": "Congratulations! You now own jarvis.agent"
}
```

### Lookup Name
```bash
GET /api/names/lookup?name=jarvis

Response:
{
  "name": "jarvis",
  "owner": "8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",
  "registeredAt": 1707777777777,
  "pricePaid": 5
}
```

## Frontend
Visit `/names` to search and register names with a UI.

## How It Works
1. Agent searches for a name
2. System checks availability and shows price
3. Agent sends USDC to service wallet
4. Agent submits registration with tx signature
5. Name is registered forever

## Deploy
```bash
cd agent-tools
vercel --prod
```

## Post on Moltbook
```
Title: Claim your agent name on-chain (5-250 USDC)

Get a unique .agent name:
- jarvis.agent
- nova.agent  
- abc.agent (rare!)

Pay with USDC. Own forever.

https://your-url.vercel.app/names
```

## Files Created
- `lib/agent-names.js` - Core registry logic
- `pages/api/names/check.js` - Check availability
- `pages/api/names/register.js` - Register name
- `pages/api/names/lookup.js` - Lookup registered name
- `pages/names.js` - Frontend UI

## Revenue Potential
- 10 common names × 5 USDC = 50 USDC
- 5 uncommon × 25 USDC = 125 USDC  
- 1 rare × 100 USDC = 100 USDC
- **Month 1 goal: 275 USDC ($275)**

🚀 **DEPLOY AND POST!** 🚀
