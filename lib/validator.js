/**
 * Request Validation
 * 
 * - Audio URL validation
 * - Webhook URL validation  
 * - Audio duration limits (prevent cost attacks)
 * 
 * @module lib/validator
 */

const MAX_AUDIO_DURATION_SECONDS = 120; // 2 minutes hard cap
const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'webm'];

class RequestValidator {
  /**
   * Validate audio URL
   */
  validateAudioUrl(url) {
    try {
      const parsed = new URL(url);
      
      // Must be http or https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'URL must be HTTP or HTTPS' };
      }

      // Check file extension (optional but helpful)
      const ext = parsed.pathname.split('.').pop()?.toLowerCase();
      if (ext && !ALLOWED_AUDIO_FORMATS.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported format: ${ext}. Allowed: ${ALLOWED_AUDIO_FORMATS.join(', ')}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url) {
    try {
      const parsed = new URL(url);
      
      // Must be https (for security)
      if (parsed.protocol !== 'https:') {
        return { valid: false, error: 'Webhook must use HTTPS' };
      }

      // No localhost in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname;
        
        // Block localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
          return { valid: false, error: 'Localhost webhooks not allowed in production' };
        }
        
        // Block private IP ranges (SSRF protection)
        if (this.isPrivateIP(hostname)) {
          return { valid: false, error: 'Private IP addresses not allowed' };
        }
        
        // Block cloud metadata endpoints (AWS, GCP, Azure)
        if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
          return { valid: false, error: 'Metadata endpoints not allowed' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid webhook URL' };
    }
  }

  /**
   * Check if IP is in private range (SSRF protection)
   */
  isPrivateIP(hostname) {
    // Quick regex check for private IP ranges
    const privatePatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^127\./,                   // 127.0.0.0/8
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
      /^::1$/,                    // IPv6 localhost
      /^fe80:/,                   // IPv6 link-local
      /^fc00:/,                   // IPv6 unique local
    ];
    
    return privatePatterns.some(pattern => pattern.test(hostname));
  }

  /**
   * Estimate audio duration from URL (optional check)
   * Note: This is a heuristic. Real check happens at transcription time.
   */
  async estimateDuration(audioUrl) {
    try {
      // Try HEAD request to get Content-Length
      const response = await fetch(audioUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { canEstimate: false };
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      if (!contentLength) {
        return { canEstimate: false };
      }

      // Rough estimate: MP3 ~ 1MB per minute at 128kbps
      const bytes = parseInt(contentLength, 10);
      const estimatedSeconds = (bytes / (128 * 1024 / 8)) * 60;

      return {
        canEstimate: true,
        estimatedSeconds: Math.round(estimatedSeconds),
        contentLength: bytes,
        contentType,
        exceedsLimit: estimatedSeconds > MAX_AUDIO_DURATION_SECONDS,
      };
    } catch (error) {
      return { canEstimate: false, error: error.message };
    }
  }

  /**
   * Full request validation
   */
  async validateRequest(body) {
    const errors = [];

    // Required fields
    if (!body.audio_url) errors.push('audio_url is required');
    if (!body.webhook_url) errors.push('webhook_url is required');
    if (!body.agent_id) errors.push('agent_id is required');

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Validate URLs
    const audioCheck = this.validateAudioUrl(body.audio_url);
    if (!audioCheck.valid) errors.push(`audio_url: ${audioCheck.error}`);

    const webhookCheck = this.validateWebhookUrl(body.webhook_url);
    if (!webhookCheck.valid) errors.push(`webhook_url: ${webhookCheck.error}`);

    // Check for suspicious patterns
    if (body.agent_id.length > 100) {
      errors.push('agent_id too long (max 100 chars)');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}

const validator = new RequestValidator();

module.exports = { 
  RequestValidator, 
  validator, 
  MAX_AUDIO_DURATION_SECONDS,
  ALLOWED_AUDIO_FORMATS,
};
