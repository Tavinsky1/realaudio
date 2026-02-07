/**
 * Webhook Queue with Retry Logic
 * 
 * Problem: Agent webhooks fail (down, timeout, etc.)
 * Solution: Store results, retry with backoff, allow polling fallback
 * 
 * @module lib/webhook-queue
 */

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 60s
const RESULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

class WebhookQueue {
  constructor() {
    this.results = new Map(); // jobId -> result
    this.pendingWebhooks = []; // Queue of pending webhooks
    this.processing = false;
  }

  /**
   * Store result and queue webhook
   */
  async storeAndNotify(jobId, agentId, webhookUrl, data) {
    const result = {
      jobId,
      agentId,
      webhookUrl,
      data,
      createdAt: Date.now(),
      attempts: 0,
      delivered: false,
      lastError: null,
    };

    // Store for polling fallback
    this.results.set(jobId, result);
    this.cleanup();

    // Queue webhook
    this.pendingWebhooks.push(result);
    
    // Start processor if not running
    if (!this.processing) {
      this.processQueue();
    }

    return result;
  }

  /**
   * Process webhook queue
   */
  async processQueue() {
    if (this.processing || this.pendingWebhooks.length === 0) {
      return;
    }

    this.processing = true;

    while (this.pendingWebhooks.length > 0) {
      const item = this.pendingWebhooks.shift();
      
      if (item.delivered || item.attempts >= MAX_RETRIES) {
        continue;
      }

      try {
        const success = await this.sendWebhook(item);
        
        if (success) {
          item.delivered = true;
          console.log(`✅ Webhook delivered: ${item.jobId}`);
        } else {
          item.attempts++;
          
          if (item.attempts < MAX_RETRIES) {
            const delay = RETRY_DELAYS[item.attempts - 1];
            console.log(`⏳ Webhook retry scheduled: ${item.jobId} in ${delay}ms`);
            
            setTimeout(() => {
              this.pendingWebhooks.push(item);
            }, delay);
          } else {
            console.warn(`❌ Webhook failed after ${MAX_RETRIES} attempts: ${item.jobId}`);
            item.lastError = 'MAX_RETRIES_EXCEEDED';
          }
        }
      } catch (error) {
        console.error(`Webhook error: ${item.jobId}`, error.message);
        item.lastError = error.message;
      }
    }

    this.processing = false;
  }

  /**
   * Send single webhook
   */
  async sendWebhook(item) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(item.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Tools-Signature': 'voicemail-processed',
          'X-Webhook-Attempt': item.attempts + 1,
        },
        body: JSON.stringify({
          ...item.data,
          _meta: {
            jobId: item.jobId,
            deliveredAt: new Date().toISOString(),
            attempt: item.attempts + 1,
          },
        }),
        timeout: 10000,
      });

      // 2xx = success
      return response.ok;

    } catch (error) {
      item.lastError = error.message;
      return false;
    }
  }

  /**
   * Get result by jobId (polling fallback)
   */
  getResult(jobId) {
    const result = this.results.get(jobId);
    
    if (!result) {
      return { found: false, error: 'RESULT_NOT_FOUND' };
    }

    return {
      found: true,
      jobId: result.jobId,
      status: result.delivered ? 'delivered' : 'pending',
      data: result.data,
      attempts: result.attempts,
      createdAt: result.createdAt,
      delivered: result.delivered,
    };
  }

  /**
   * Get result by transaction signature (alternative lookup)
   */
  getResultByTx(signature) {
    for (const result of this.results.values()) {
      if (result.data?.payment_signature === signature) {
        return this.getResult(result.jobId);
      }
    }
    return { found: false };
  }

  /**
   * Cleanup old results
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [jobId, result] of this.results.entries()) {
      if (now - result.createdAt > RESULT_TTL) {
        toDelete.push(jobId);
      }
    }

    for (const jobId of toDelete) {
      this.results.delete(jobId);
    }

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} old results`);
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    const results = Array.from(this.results.values());
    return {
      totalResults: results.length,
      delivered: results.filter(r => r.delivered).length,
      pending: results.filter(r => !r.delivered && r.attempts < MAX_RETRIES).length,
      failed: results.filter(r => !r.delivered && r.attempts >= MAX_RETRIES).length,
      queueLength: this.pendingWebhooks.length,
    };
  }
}

const webhookQueue = new WebhookQueue();

module.exports = { WebhookQueue, webhookQueue, MAX_RETRIES, RETRY_DELAYS };
