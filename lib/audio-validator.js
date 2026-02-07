/**
 * Audio Validation
 * 
 * Pre-validate audio before sending to AssemblyAI:
 * - Duration check (max 2 minutes)
 * - Format validation
 * - Size limits
 * - Optional: Basic content check (speech vs noise)
 * 
 * @module lib/audio-validator
 */

const MAX_DURATION_SECONDS = 120; // 2 minutes
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'aac'];

class AudioValidator {
  /**
   * Validate audio URL without downloading full file
   * Uses HEAD request to check headers
   */
  async validateAudioUrl(audioUrl) {
    try {
      const response = await fetch(audioUrl, { 
        method: 'HEAD',
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          valid: false,
          error: 'AUDIO_URL_UNREACHABLE',
          status: response.status,
        };
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      // Check file size
      if (contentLength) {
        const sizeMB = parseInt(contentLength) / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
          return {
            valid: false,
            error: 'FILE_TOO_LARGE',
            maxSizeMB: MAX_FILE_SIZE_MB,
            actualSizeMB: sizeMB.toFixed(2),
          };
        }
      }

      // Check content type
      if (contentType) {
        const isAudio = ALLOWED_FORMATS.some(format => 
          contentType.toLowerCase().includes(format)
        );
        
        if (!isAudio && !contentType.includes('application/octet-stream')) {
          // Warn but don't reject (some hosts serve audio as octet-stream)
          console.warn(`Suspicious content type: ${contentType}`);
        }
      }

      // Estimate duration from file size (rough heuristic)
      // MP3 at 128kbps ≈ 960KB per minute = ~16KB per second
      // WAV uncompressed ≈ 10MB per minute... highly variable!
      // Only reject if file is EXTREMELY large (> 20MB suggests long audio)
      if (contentLength) {
        const sizeMB = parseInt(contentLength) / (1024 * 1024);
        
        // Very rough check: If file > 20MB, likely longer than 2 min
        // This is conservative to avoid false positives
        if (sizeMB > 20) {
          return {
            valid: false,
            error: 'DURATION_EXCEEDS_LIMIT',
            maxDuration: MAX_DURATION_SECONDS,
            fileSizeMB: sizeMB.toFixed(2),
            message: `Audio file is very large (${sizeMB.toFixed(1)}MB). Likely exceeds ${MAX_DURATION_SECONDS}s limit.`,
          };
        }
      }

      return {
        valid: true,
        contentLength: contentLength ? parseInt(contentLength) : null,
        contentType,
      };

    } catch (error) {
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * Quick format check from URL extension
   */
  getFormatFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const ext = pathname.split('.').pop();
      
      if (ALLOWED_FORMATS.includes(ext)) {
        return { format: ext, known: true };
      }
      
      return { format: ext, known: false };
    } catch {
      return { format: null, known: false };
    }
  }

  /**
   * Check if URL is from suspicious domain
   * (Basic protection against abuse)
   */
  checkDomain(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Block known file hosting abuse domains
      const suspiciousPatterns = [
        /pastebin/,
        /ghostbin/,
        /zippyshare/,
        /mediafire.*\/download/, // Direct downloads only
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(hostname)) {
          return {
            allowed: false,
            error: 'SUSPICIOUS_DOMAIN',
            message: 'Audio hosting from this domain is not allowed',
          };
        }
      }

      // Prefer direct cloud storage
      const preferredDomains = [
        'amazonaws.com',
        'googleapis.com',
        'cloudflare',
        'digitaloceanspaces',
        'wasabisys',
        'backblazeb2',
      ];

      const isPreferred = preferredDomains.some(d => hostname.includes(d));

      return {
        allowed: true,
        preferred: isPreferred,
        hostname,
      };

    } catch {
      return { allowed: false, error: 'INVALID_URL' };
    }
  }

  /**
   * Full validation pipeline
   */
  async validate(audioUrl) {
    const errors = [];

    // Check URL format
    try {
      new URL(audioUrl);
    } catch {
      return { valid: false, errors: ['Invalid URL format'] };
    }

    // Check protocol
    if (!audioUrl.startsWith('https://')) {
      errors.push('Audio URL must use HTTPS');
    }

    // Check domain
    const domainCheck = this.checkDomain(audioUrl);
    if (!domainCheck.allowed) {
      return { valid: false, errors: [domainCheck.error] };
    }

    // Check format
    const formatCheck = this.getFormatFromUrl(audioUrl);
    if (!formatCheck.known) {
      console.warn(`Unknown audio format: ${formatCheck.format}`);
    }

    // Validate via HEAD request
    const headCheck = await this.validateAudioUrl(audioUrl);
    if (!headCheck.valid) {
      errors.push(headCheck.message || headCheck.error);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      format: formatCheck.format,
      size: headCheck.contentLength,
      preferred: domainCheck.preferred,
    };
  }
}

const audioValidator = new AudioValidator();

module.exports = { AudioValidator, audioValidator, MAX_DURATION_SECONDS, MAX_FILE_SIZE_MB };
