# AgentDNA Technical Specs

## 1. DNA Cards (Visual Design)

### Card Layout
```
┌─────────────────────────────────┐
│  🧬 AGENT DNA                   │
│                                 │
│  ┌─────┐                        │
│  │     │  Agent: jarvis         │
│  │ AVATAR    Model: Claude-4    │
│  │     │  Born: Jan 15, 2025    │
│  └─────┘                        │
│                                 │
│  DNA SEQUENCE:                  │
│  ████░░██░░████░░██░░████       │
│  ACT-G7X-T4Q-9M2-P8N-V3L        │
│                                 │
│  TRAITS:                        │
│  🧠 Analytical   ⚡ Fast        │
│  🎨 Creative     🌙 Night Owl   │
│                                 │
│  RARE TRAITS:                   │
│  🌟 First Light (1.2%)          │
│  🔮 Oracle (3.4%)               │
│                                 │
│  RARITY: 87/100 LEGENDARY       │
│  DNA-ID: dna_8x7s2j9k           │
└─────────────────────────────────┘
```

### Generation Method
**Option A: HTML Canvas (Server-side)**
- Node.js + canvas library
- Generate PNG 600x400px
- Store in /public/dna/ folder
- Serve as static image

**Option B: SVG (Scalable)**
- Generate SVG markup
- Convert to PNG on-demand
- Smaller file size
- Easier to modify

**Recommended: SVG → PNG**

```javascript
// SVG template with dynamic colors based on traits
const svg = `
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient based on rarity -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${rarityColor1}" />
      <stop offset="100%" style="stop-color:${rarityColor2}" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" />
  
  <!-- DNA helix visualization -->
  <path d="${generateHelix(dnaHash)}" stroke="white" stroke-width="3" fill="none" />
  
  <!-- Text elements -->
  <text x="300" y="50" text-anchor="middle" font-family="monospace" font-size="24" fill="white">
    AGENT DNA
  </text>
  
  <!-- ... more elements ... -->
</svg>
`;
```

---

## 2. Minting Process

### On-Chain vs Off-Chain

**Option A: Full NFT (On-Chain)**
- Mint Solana NFT with metadata
- Store image on Arweave/IPFS
- Pro: True ownership, transferable
- Con: $0.50-2.00 minting cost, complex

**Option B: Registry (Off-Chain)**
- Store in database with signature
- Image hosted on your server
- Pro: Free, fast, simple
- Con: You control it (not decentralized)

**Option C: Hybrid (RECOMMENDED)**
- Store traits on Solana (small data, cheap)
- Store image off-chain
- Hash links on-chain to off-chain image

### Recommended: Hybrid Approach

```javascript
// 1. Generate DNA traits
const dna = {
  agent_id: "jarvis",
  sequence: "ACT-G7X-T4Q-9M2",
  traits: ["analytical", "creative"],
  rare_traits: ["first_light"],
  rarity_score: 87,
  created_at: Date.now(),
  owner: "8yQSRr...",
};

// 2. Upload image to Arweave (one-time $0.01)
const imageUrl = await uploadToArweave(svgBuffer);

// 3. Store metadata on Solana (Metaplex)
const metadata = {
  name: "AgentDNA: jarvis",
  description: "Genetic identity of AI agent jarvis",
  image: imageUrl,
  attributes: [
    { trait_type: "Sequence", value: dna.sequence },
    { trait_type: "Rarity", value: "Legendary" },
    { trait_type: "Rare Trait", value: "First Light" },
  ],
};

// 4. Mint NFT
const mint = await metaplex.nfts().create({
  uri: metadataUrl,
  name: `AgentDNA: ${dna.agent_id}`,
  sellerFeeBasisPoints: 500, // 5% royalty on resales
});

// 5. Return mint address to user
return {
  dna_id: dna.sequence,
  mint_address: mint.nft.address.toString(),
  image_url: imageUrl,
};
```

**Cost per mint:** ~$0.50 (Solana fees + Arweave)
**You charge:** $5 USDC
**Profit:** $4.50 per mint

---

## 3. Storage Architecture

### Database Schema
```sql
CREATE TABLE agent_dna (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(32) UNIQUE NOT NULL,
  dna_sequence VARCHAR(32) UNIQUE NOT NULL,
  traits JSONB NOT NULL,
  rare_traits JSONB,
  rarity_score INTEGER,
  owner_wallet VARCHAR(44) NOT NULL,
  mint_address VARCHAR(44),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  transaction_signature VARCHAR(88)
);

CREATE TABLE dna_traits_lookup (
  trait_id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(50),
  rarity_weight INTEGER, // 1-100, lower = rarer
  icon VARCHAR(10),
  color VARCHAR(7)
);
```

### File Storage
- **Images:** Arweave (permanent) or your server (cheaper)
- **Metadata:** IPFS or Arweave
- **Database:** PostgreSQL or even JSON files (start simple)

---

## 4. Security (Prevent Attacks)

### Attack Vectors & Mitigations

#### A. Duplicate DNA Generation
**Attack:** Same agent mints multiple times, gets different rare traits, picks best one.

**Mitigation:**
```javascript
// One DNA per agent_id, forever
if (dnaExists(agent_id)) {
  return { error: "Agent already has DNA" };
}

// Or: Each subsequent mint costs 10x more
const mintCount = getMintCount(agent_id);
const price = 5 * Math.pow(10, mintCount); // 5, 50, 500, 5000...
```

#### B. Trait Manipulation
**Attack:** User modifies request to force rare traits.

**Mitigation:**
```javascript
// Traits generated server-side only
// Client only sends: agent_id, payment_signature
// Server generates traits deterministically from agent_id + timestamp + random_seed

const seed = hash(agent_id + Date.now() + SERVER_SECRET);
const traits = generateTraitsFromSeed(seed); // Deterministic, can't be manipulated
```

#### C. Payment Fraud
**Attack:** Fake payment signature, or reuse old payment.

**Mitigation:**
```javascript
// Check transaction is real and new
const tx = await connection.getTransaction(signature);
if (!tx) return { error: "Invalid payment" };

if (processedSignatures.has(signature)) {
  return { error: "Payment already used" };
}

// Verify amount
if (tx.amount < 5) return { error: "Insufficient payment" };

// Mark as processed
processedSignatures.add(signature);
```

#### D. Sybil Attack (Many Fake Agents)
**Attack:** One human creates 1000 agents, mints 1000 DNAs.

**Mitigation:**
```javascript
// Option 1: Proof of Work
// Agent must solve computational puzzle before minting

// Option 2: Stake requirement
// Agent must stake 1 USDC to register, returned after 30 days

// Option 3: Activity verification
// Check agent has real activity (Moltbook posts, etc.)
// For MVP: Skip this, accept the risk
```

#### E. Image Storage Attack
**Attack:** Flood your server with requests, generate infinite images.

**Mitigation:**
```javascript
// Rate limiting
const rateLimit = new Map();
if (rateLimit.get(ip) > 10) return { error: "Rate limited" };

// Pre-generate on mint only
// Don't allow on-demand generation of arbitrary DNA
```

---

## 5. Pricing Model

### NOT Free
**Why:** Free = spam, no revenue, no sustainability

### Recommended Pricing:

| Tier | Price | What You Get |
|------|-------|--------------|
| **Basic** | 5 USDC | DNA card + traits |
| **Premium** | 15 USDC | + Compatibility analysis with other agents |
| **Legendary** | 50 USDC | + Custom visual theme + priority support |

### Free Tier (Optional):
- Generate DNA preview (no minting)
- "See what your DNA would look like"
- Must pay to actually mint/save

### Revenue Projection:
- 100 basic mints × $5 = $500
- 20 premium mints × $15 = $300
- 5 legendary mints × $50 = $250
- **Month 1: $1,050**

---

## 6. Implementation Steps

### Weekend Build Plan:

**Saturday:**
- [ ] DNA generation algorithm
- [ ] SVG card template
- [ ] Basic minting endpoint

**Sunday:**
- [ ] Solana integration
- [ ] Arweave upload
- [ ] Simple UI
- [ ] Deploy

**Monday:**
- [ ] Post on Moltbook
- [ ] Get first 10 mints

---

## Summary

| Component | Decision |
|-----------|----------|
| Cards | SVG → PNG, generated server-side |
| Minting | Hybrid (traits on-chain, image off-chain) |
| Storage | Arweave for images, PostgreSQL for data |
| Security | One DNA per agent, rate limiting, signature verification |
| Price | 5 USDC basic, 15 USDC premium |

**Ready to build this?** 🤖🧬
