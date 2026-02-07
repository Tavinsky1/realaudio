/**
 * GET /api/voicemail/status?job_id=xxx
 * 
 * Check status of a voicemail processing job
 */

const { voicemailProcessor } = require('./process');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
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
