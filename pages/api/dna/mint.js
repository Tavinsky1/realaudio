/**
 * POST /api/dna/mint
 * 
 * Mint AgentDNA as cNFT (costs 5 USDC)
 */

const { AgentDNA } = require('../../../lib/agent-dna');
const { getCnftManager } = require('../../../lib/cnft');
const { USDCPaymentVerifier, SERVICE_WALLET } = require('../../../lib/solana');
const { dedup } = require('../../../lib/dedup');

const DNA_PRICE_USDC = 5;

// In-memory storage for now
const mintedDNAs = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agent_id, owner_wallet, payment_signature, model, created_at } = req.body;

    // Validation
    if (!agent_id || !owner_wallet || !payment_signature) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Required: agent_id, owner_wallet, payment_signature',
      });
    }

    // Check if already minted
    if (mintedDNAs.has(agent_id)) {
      return res.status(400).json({
        error: 'ALREADY_MINTED',
        message: 'This agent already has DNA. Each agent can only have one DNA.',
        existing: mintedDNAs.get(agent_id),
      });
    }

    // Check payment
    if (dedup.has(payment_signature)) {
      return res.status(402).json({
        error: 'PAYMENT_ALREADY_USED',
        message: 'This payment has already been used.',
      });
    }

    // Verify USDC payment
    const verifier = new USDCPaymentVerifier();
    const paymentResult = await verifier.verifyPayment(payment_signature, DNA_PRICE_USDC);

    if (!paymentResult.valid) {
      return res.status(402).json({
        error: 'PAYMENT_INVALID',
        message: paymentResult.error,
        required: `${DNA_PRICE_USDC} USDC`,
        serviceWallet: SERVICE_WALLET,
      });
    }

    // Mark payment as used
    dedup.add(payment_signature, { agent_id, service: 'dna' });

    // Generate DNA
    const dna = AgentDNA.generate(agent_id, {
      model: model || 'unknown',
      createdAt: created_at || new Date().toISOString(),
    });

    // Image URL points to our image generation endpoint
    const imageUrl = `/api/dna/image?id=${encodeURIComponent(agent_id)}`;

    // TODO: Mint cNFT on Solana
    // For now, simulate mint
    const mockAssetId = `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store minted DNA
    const mintedDNA = {
      ...dna,
      ownerWallet: owner_wallet,
      paymentSignature: payment_signature,
      imageUrl,
      assetId: mockAssetId,
      mintedAt: Date.now(),
    };
    
    mintedDNAs.set(agent_id, mintedDNA);

    return res.status(201).json({
      success: true,
      message: `🎉 Congratulations! You now own ${dna.dnaSequence}`,
      dna: {
        agentId: dna.agentId,
        dnaSequence: dna.dnaSequence,
        traits: dna.traits,
        rareTraits: dna.rareTraits,
        rarityScore: dna.rarityScore,
        tier: dna.tier,
        ownerWallet: owner_wallet,
      },
      imageUrl,
      assetId: mockAssetId,
      explorerUrl: `https://xray.helius.xyz/token/${mockAssetId}`, // Helius explorer
    });

  } catch (error) {
    console.error('DNA mint error:', error);
    return res.status(500).json({
      error: 'MINT_FAILED',
      message: error.message,
    });
  }
}
