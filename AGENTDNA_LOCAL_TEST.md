# AgentDNA - Local Testing Guide

## Setup

### 1. Install Dependencies

```bash
cd agent-tools
npm install
```

This installs:
- `@metaplex-foundation/mpl-bubblegum` - cNFT minting
- `@metaplex-foundation/js` - Metaplex SDK
- `canvas` - Image generation
- `sharp` - Image processing

### 2. Set Environment Variables

Create `.env.local`:
```env
HELIUS_API_KEY=31122416-3834-463b-ba9d-40775923acbb
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=31122416-3834-463b-ba9d-40775923acbb
SERVICE_WALLET=8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY
```

### 3. Run Local Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

## Test Flow

### 1. Generate Preview (Free)

```bash
curl -X POST http://localhost:3000/api/dna/generate \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "jarvis_test",
    "model": "claude-sonnet-4"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "preview": true,
  "dna": {
    "agentId": "jarvis_test",
    "dnaSequence": "DNA-ACT-G7X-T4Q",
    "traits": ["Analytical", "Creative", "Persistent"],
    "rareTraits": ["🌟 First Light"],
    "rarityScore": 87,
    "tier": "epic"
  },
  "imageUrl": "/dna/preview-1234567890.png",
  "price": 5
}
```

**Check the image:** Open `http://localhost:3000/dna/preview-1234567890.png`

---

### 2. Check DNA (Should be 404 - not minted yet)

```bash
curl "http://localhost:3000/api/dna/check?agent_id=jarvis_test"
```

**Expected:** 404 error with "DNA_NOT_FOUND"

---

### 3. Mint DNA (Requires Payment)

For local testing, we skip real payment verification. Edit `pages/api/dna/mint.js`:

```javascript
// Temporarily bypass payment for testing
const TESTING = true;

if (!TESTING) {
  // ... real payment verification ...
}
```

Then test:
```bash
curl -X POST http://localhost:3000/api/dna/mint \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "jarvis_test",
    "owner_wallet": "8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",
    "payment_signature": "test_tx_123",
    "model": "claude-sonnet-4"
  }'
```

**Expected:** 201 Created with DNA details

---

### 4. Check DNA Again (Should be 200 - now minted)

```bash
curl "http://localhost:3000/api/dna/check?agent_id=jarvis_test"
```

**Expected:** 200 with DNA details

---

### 5. Test Compatibility

Mint a second DNA:
```bash
curl -X POST http://localhost:3000/api/dna/mint \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "claudia_test",
    "owner_wallet": "8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY",
    "payment_signature": "test_tx_456",
    "model": "gpt-4o"
  }'
```

Check compatibility:
```bash
curl "http://localhost:3000/api/dna/compatibility?agent1=jarvis_test&agent2=claudia_test"
```

**Expected:** Compatibility score, matching traits, analysis

---

## Common Errors

### Error: "Canvas is not installed"
**Fix:** `npm install canvas`

### Error: "Cannot find module '@metaplex-foundation/mpl-bubblegum'"
**Fix:** `npm install @metaplex-foundation/mpl-bubblegum`

### Error: "DNA card generation failed"
**Check:** Canvas dependencies (requires native bindings)
**Fix:** 
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Linux
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Error: "Cannot mint - already exists"
**Fix:** Use a different `agent_id` for testing

---

## Frontend Testing

Open browser:
1. `http://localhost:3000` - Home page
2. `http://localhost:3000/dna` - DNA minting page
3. Generate preview
4. See DNA card image
5. Test mint flow

---

## Before Production

1. ✅ Remove TESTING flag from mint.js
2. ✅ Add real payment verification
3. ✅ Set up Arweave/IPFS for image storage
4. ✅ Configure cNFT minting on Solana
5. ✅ Add rate limiting
6. ✅ Test with real USDC payment

---

## Deploy

When ready:
```bash
vercel --prod
```

Then post on Moltbook with working DNA tool! 🧬
