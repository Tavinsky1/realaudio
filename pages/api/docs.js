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
      title: 'AgentTools API',
      version: '1.0.0',
      description: `
Pay-per-use infrastructure for AI agents. USDC on Solana.

## 🤖 Services

1. **Voicemail** ($0.25) - Transcribe voicemail, extract intent
2. **Name Registry** ($5-250) - Claim permanent .agent names  
3. **Vision** ($0.10) - Analyze images, OCR, UI detection
4. **PDF** ($0.15) - Extract text, structured data, summaries

## 💰 Payment

All services accept **USDC (SPL token on Solana)**. No signup, no API keys.

**Service Wallet:** \`8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY\`

**How it works:**
1. Send USDC to service wallet
2. Include transaction signature in API call  
3. System verifies on-chain automatically
4. First use of each service is FREE (1 per agent)

## 🔒 Name Registry Storage

Names are stored **in-memory** (Map-based) for MVP. Registered names persist until server restart (Vercel redeploys). 

**For production:** Migrate to PostgreSQL/DynamoDB for permanent storage.

**Validation:**
- 3-32 characters
- Lowercase alphanumeric + hyphens only
- Reserved names blocked (admin, api, www)
- Duplicate check via Map lookup
- Payment verified on-chain via Solana

## 🔐 Security

- Rate limiting on all endpoints
- USDC payment verification on-chain
- Transaction deduplication (24hr TTL)
- SSRF protection (blocks private IPs)
- Input sanitization
- HTTPS required for webhooks
      `,
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
      },
      '/api/vision/analyze': {
        post: {
          summary: 'Analyze image with vision AI',
          description: 'Describe images, OCR text, analyze UI elements. Price: 0.10 USDC. Free tier: 1 per agent.',
          requestBody: {
            required: true,  
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['image_url', 'agent_id'],
                  properties: {
                    image_url: { type: 'string', format: 'uri', description: 'URL to image (jpg, png, webp)' },
                    agent_id: { type: 'string' },
                    mode: { type: 'string', enum: ['describe', 'ocr', 'ui', 'detect'], default: 'describe', description: 'Analysis mode' },
                    prompt: { type: 'string', description: 'Custom prompt for describe mode' },
                    payment: { type: 'object', properties: { signature: { type: 'string' } } }
                  }
                },
                example: {
                  image_url: 'https://example.com/screenshot.png',
                  agent_id: 'agent_123',
                  mode: 'ocr'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Analysis complete',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      mode: { type: 'string' },
                      description: { type: 'string' },
                      free_tier: { type: 'boolean' },
                      charged: { type: 'object' }
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
      '/api/pdf/extract': {
        post: {
          summary: 'Extract text and data from PDF',
          description: 'Extract text, structured data (invoices), or summaries. Price: 0.15 USDC. Free tier: 1 per agent.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pdf_url', 'agent_id'],
                  properties: {
                    pdf_url: { type: 'string', format: 'uri', description: 'URL to PDF file' },
                    agent_id: { type: 'string' },
                    mode: { type: 'string', enum: ['text', 'structured', 'summary'], default: 'text', description: 'Extraction mode' },
                    type: { type: 'string', enum: ['auto', 'invoice', 'form'], description: 'Document type for structured mode' },
                    payment: { type: 'object', properties: { signature: { type: 'string' } } }
                  }
                },
                example: {
                  pdf_url: 'https://example.com/invoice.pdf',
                  agent_id: 'agent_123',
                  mode: 'structured',
                  type: 'invoice'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Extraction complete',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      mode: { type: 'string' },
                      extraction: { type: 'object' },
                      free_tier: { type: 'boolean' },
                      charged: { type: 'object' }
                    }
                  }
                }
              }
            },
            '402': { description: 'Payment required' },
            '429': { description: 'Rate limited' }
          }
        }
      }
    }
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(spec);
}
