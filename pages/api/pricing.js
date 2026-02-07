/**
 * GET /api/pricing
 * 
 * Returns current dynamic pricing for all agent services
 * Prices update every 5 minutes based on SOL/USD rate
 */

const { oracle } = require('../../lib/pricing');
const { SERVICE_WALLET } = require('../../lib/solana');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const pricing = await oracle.getAllPrices();

    return res.status(200).json({
      service_wallet: SERVICE_WALLET,
      payment_chain: 'solana',
      accepted_tokens: ['SOL'],
      ...pricing,
      services: {
        voicemail: {
          description: 'Transcribe and extract intent from voicemail audio (max 2 min)',
          endpoints: {
            standard: {
              ...pricing.prices.voicemail,
              description: 'Normal queue processing (~30s)',
              method: 'POST',
              path: '/api/voicemail/process',
            },
            priority: {
              ...pricing.prices.voicemail_priority,
              description: 'Fast queue, skip line (~10s)',
              method: 'POST (with priority: true)',
            },
          },
          limits: {
            max_duration_seconds: 120,
            formats: ['mp3', 'wav', 'm4a', 'ogg', 'webm'],
          },
        },
        analytics: {
          description: 'Log agent failures for aggregated insights',
          coming_soon: true,
          price: pricing.prices.log_failure,
        },
        kyc: {
          description: 'Agent verification and reputation staking',
          coming_soon: true,
          price: pricing.prices.kyc_verify,
        },
      },
      free_tier: {
        enabled: true,
        limit: 3,
        description: 'First 3 voicemails free per agent_id',
      },
      getting_started: {
        step1: 'Create Solana wallet (Phantom, Solflare, etc.)',
        step2: `Fund with SOL, check current price at /api/health`,
        step3: 'Send payment to service wallet',
        step4: 'Include transaction signature in API calls',
        example: `curl -X POST https://inksky.net/api/voicemail/process \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "audio_url":"...",
    "webhook_url":"...",
    "agent_id":"...",
    "payment":{"signature":"5xKp..."}
  }'`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'PRICING_ERROR',
      message: 'Failed to fetch current pricing',
    });
  }
}
