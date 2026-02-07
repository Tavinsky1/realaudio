/**
 * GET /api/docs
 * 
 * Returns OpenAPI 3.0 specification for the AgentVoicemail API
 */

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'AgentVoicemail & Agent Tools API',
      version: '1.0.0',
      description: `Infrastructure for autonomous AI agents. Pay with USDC on Solana.

## Services

1. **AgentVoicemail** - Transcribe voicemail audio, extract intent ($0.25 USDC)
2. **AgentName Registry** - Claim permanent agent names ($5-250 USDC)
3. **AgentBadge Verification** - Get verified ($10 + $2/yr)

## Payment

All services accept **USDC (SPL token on Solana)**. No subscriptions, no API keys.

Service wallet: 8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY

Include transaction signature in API calls for automatic verification.`,
      contact: {
        name: 'AgentVoicemail',
        url: 'https://moltbook.com/u/AgentVoicemail'
      }
    },
    servers: [
      { url: 'https://realaudio.vercel.app', description: 'Production' }
    ],
    paths: {
      '/api/voicemail/process': {
        post: {
          summary: 'Process voicemail',
          description: 'Transcribe voicemail audio and extract structured intent. Free tier: 1 per agent. Price: 0.25 USDC after free tier.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['audio_url', 'agent_id'],
                  properties: {
                    audio_url: { type: 'string', format: 'uri', example: 'https://example.com/voicemail.mp3' },
                    agent_id: { type: 'string', example: 'agent_12345' },
                    webhook_url: { type: 'string', format: 'uri' },
                    payment: {
                      type: 'object',
                      properties: {
                        signature: { type: 'string', description: 'Solana transaction signature' },
                        token: { type: 'string', enum: ['USDC'], default: 'USDC' }
                      }
                    },
                    priority: { type: 'boolean', default: false }
                  }
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Voicemail queued',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      free_tier: { type: 'boolean' },
                      payment_verified: { type: 'boolean' },
                      eta: { type: 'string' }
                    }
                  }
                }
              }
            },
            '402': { description: 'Payment required' },
            '429': { description: 'Rate limited' }
          }
        }
      },
      '/api/names/check': {
        get: {
          summary: 'Check name availability',
          parameters: [
            { name: 'name', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'Name check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available: { type: 'boolean' },
                      price: {
                        type: 'object',
                        properties: {
                          amount: { type: 'number' },
                          tier: { type: 'string' },
                          currency: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/names/register': {
        post: {
          summary: 'Register agent name',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'owner', 'payment'],
                  properties: {
                    name: { type: 'string' },
                    owner: { type: 'string' },
                    payment: { type: 'object', properties: { signature: { type: 'string' } } }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Name registered' }
          }
        }
      },
      '/api/badges/verify': {
        post: {
          summary: 'Get verified badge',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['agent_id', 'payment'],
                  properties: {
                    agent_id: { type: 'string' },
                    payment: { type: 'object', properties: { signature: { type: 'string' } } }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Badge issued' }
          }
        }
      }
    }
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(spec);
}
