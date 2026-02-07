/**
 * GET /api/voicemail/status?job_id=xxx
 * 
 * Check status of a voicemail processing job
 */

const { voicemailProcessor } = require('./process');
const { applyRateLimit } = require('../../../lib/rate-limiter');

// Rate limit: 30 requests per minute per IP (status checks)
const RATE_LIMIT = { maxRequests: 30, windowMs: 60000 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  // Apply rate limiting
  const allowed = applyRateLimit(req, res, RATE_LIMIT);
  if (!allowed) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many status check requests. Maximum 30 per minute.',
    });
  }

  const { job_id } = req.query;

  if (!job_id) {
    return res.status(400).json({
      error: 'MISSING_PARAMETER',
      message: 'job_id is required'
    });
  }

  const status = voicemailProcessor.getJobStatus(job_id);

  if (status.status === 'unknown') {
    return res.status(404).json({
      error: 'JOB_NOT_FOUND',
      message: 'Job ID not found or expired'
    });
  }

  return res.status(200).json(status);
}
