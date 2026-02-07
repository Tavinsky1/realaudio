# Security Policy

## 🔒 Security Measures

### Rate Limiting
- **10 requests per minute** per agent ID
- Prevents abuse and DDoS attacks
- Tracked in-memory (resets on deploy)

### Payment Verification
- All Solana transactions verified on-chain
- Transaction deduplication (24-hour tracking)
- 5-minute transaction age limit
- Service wallet verification

### Input Validation
- Audio URL format validation
- File size limits (max 10MB soft, 20MB hard)
- Audio duration limits (max 2 minutes)
- Request body validation
- Domain whitelist for audio hosting

### Error Handling
- Production mode hides detailed error messages
- No stack traces exposed in API responses
- Sanitized error messages for users

### Environment Security
- All API keys stored in environment variables
- No credentials in code or git history
- `.env.local` excluded from repository

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please email: [your-email]

**Please do NOT:**
- Open public GitHub issues for security vulnerabilities
- Share exploit details publicly before they're fixed

## 🛡️ Best Practices for Deployment

### Vercel Configuration
1. Enable preview protection
2. Set production environment variables only
3. Enable automatic HTTPS
4. Use Vercel's built-in DDoS protection

### API Keys
- Rotate keys regularly
- Use separate keys for development and production
- Monitor API usage for anomalies

### Monitoring
- Check `/analytics` dashboard regularly
- Watch for unusual traffic patterns
- Monitor error rates

## 📋 Security Checklist

Before going live:
- [ ] All environment variables set in Vercel
- [ ] No API keys in code or documentation
- [ ] Rate limiting enabled
- [ ] Service wallet configured correctly
- [ ] Error messages sanitized for production
- [ ] Analytics monitoring set up

## 🔐 Infrastructure Security

### Solana Wallet
- Service wallet address is public (blockchain nature)
- Private keys never exposed or stored in code
- Transactions verified on-chain only

### Third-Party Services
- **AssemblyAI**: Audio transcription (API key protected)
- **Groq**: LLM inference (API key protected)
- **CoinGecko**: Public pricing API (no auth required)
- **Solana RPC**: Public endpoints with fallback

## 🚫 What We Don't Store

- User audio files (processed from URLs only)
- Payment method details
- Personal information
- Transaction private keys
- Webhook URLs (not persisted)

## ⚡ Automatic Protections

### Vercel Platform
- Edge network DDoS protection
- Automatic SSL/TLS certificates
- Serverless function isolation
- Built-in CDN

### Application Level
- Request validation before processing
- Async job queue (prevents blocking)
- Multi-RPC fallback (resilience)
- Webhook retry with exponential backoff

---

**Last Updated**: February 7, 2026
