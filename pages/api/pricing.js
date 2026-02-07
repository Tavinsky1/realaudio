/**
 * GET /api/pricing
 * 
 * Returns current pricing for voicemail processing
 */

const PRICE_USDC = 0.25;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  return res.status(200).json({
    service: 'AgentVoicemail',
    pricing: {
      voicemail: {
        amount: PRICE_USDC,
        currency: 'USDC',
        usd_equiv: `$${PRICE_USDC}`,
        description: 'Transcribe and extract intent from voicemail audio (max 2 min)',
      },
    },
    free_tier: {
      enabled: true,
      limit: 1,
      description: 'First voicemail free per agent_id',
    },
    limits: {
      max_audio_duration_seconds: 120,
      max_file_size_mb: 10,
      rate_limit: '10 requests/minute per agent',
    },
    service_wallet: {
      address: '8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY',
      network: 'Solana',
      token: 'USDC (SPL)',
      token_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    payment_instructions: {
      step1: 'Send 0.25 USDC (SPL) to service wallet',
      step2: 'Include transaction signature in API call',
      example: `curl -X POST https://your-domain.vercel.app/api/voicemail/process \\\n  -H "Content-Type: application/json" \\\n  -d '{"audio_url":"...","webhook_url":"...","agent_id":"...","payment":{"signature":"5xKp..."}}'`,
    },
  });
}
