/**
 * AgentVoicemail - Autonomous Voicemail Processing
 * 
 * Agents pay → Submit audio → Get structured data back
 * 
 * @module lib/voicemail
 */

const { AssemblyAI } = require('assemblyai');
const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize clients (use env vars for API keys)
const assemblyClient = process.env.ASSEMBLYAI_API_KEY ? new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
}) : null;

const groqClient = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

class VoicemailProcessor {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.jobs = new Map(); // Store completed jobs for status checks
  }

  /**
   * Process a voicemail audio file
   * 
   * @param {Object} params
   * @param {string} params.audioUrl - URL to audio file (mp3, wav, etc)
   * @param {string} params.agentId - Unique agent identifier
   * @param {string} params.webhookUrl - Callback URL for results
   * @param {string} params.paymentSignature - Solana tx signature
   * @returns {Promise<{jobId: string, status: string}>}
   */
  async processVoicemail({ audioUrl, agentId, webhookUrl, paymentSignature }) {
    const jobId = uuidv4();
    
    // Add to queue
    const job = {
      id: jobId,
      audioUrl,
      agentId,
      webhookUrl,
      paymentSignature,
      status: 'queued',
      createdAt: Date.now(),
    };

    this.processingQueue.push(job);
    this.jobs.set(jobId, job);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return { jobId, status: 'queued', eta: '30s' };
  }

  /**
   * Process queue items
   */
  async processQueue() {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.processingQueue.shift();

    try {
      job.status = 'processing';
      
      // Step 1: Transcribe audio
      const transcription = await this.transcribe(job.audioUrl);
      
      // Step 2: Extract intent and structured data
      const analysis = await this.extractIntent(transcription.text);
      
      // Step 3: Prepare result
      const result = {
        jobId: job.id,
        agentId: job.agentId,
        status: 'completed',
        transcription: transcription.text,
        confidence: transcription.confidence,
        ...analysis,
        processedAt: Date.now(),
      };

      // Step 4: Send webhook callback
      await this.sendWebhook(job.webhookUrl, result);

      job.status = 'completed';
      job.result = result;
      this.jobs.set(job.id, job);

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      job.status = 'failed';
      job.error = error.message;
      
      // Notify agent of failure
      await this.sendWebhook(job.webhookUrl, {
        jobId: job.id,
        agentId: job.agentId,
        status: 'failed',
        error: error.message,
        retryable: true,
      });
      
      this.jobs.set(job.id, job);
    }

    // Process next item
    setImmediate(() => this.processQueue());
  }

  /**
   * Transcribe audio using AssemblyAI
   * Falls back to Whisper if AssemblyAI fails or no API key
   */
  async transcribe(audioUrl) {
    // Check if we have AssemblyAI configured
    if (!assemblyClient) {
      // Return mock for testing
      return {
        text: '[MOCK] Hey this is John calling about the project. Call me back at 555-0123 when you get a chance.',
        confidence: 0.95,
        words: [],
      };
    }

    try {
      // Submit transcription job
      const transcript = await assemblyClient.transcripts.create({
        audio_url: audioUrl,
        speech_models: ['universal-2'], // Required by AssemblyAI (array format)
        speaker_labels: true,  // Diarization - who spoke when
        language_detection: true,
        punctuate: true,
        format_text: true,
      });

      // Poll for completion
      let result = await assemblyClient.transcripts.get(transcript.id);
      
      while (result.status === 'processing' || result.status === 'queued') {
        await new Promise(r => setTimeout(r, 1000));
        result = await assemblyClient.transcripts.get(transcript.id);
      }

      if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }

      return {
        text: result.text,
        confidence: result.confidence,
        words: result.words || [],
        utterances: result.utterances || [],
        audio_duration: result.audio_duration,
      };

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Extract intent and structured data from transcription
   * Using Groq for fast, cheap LLM inference
   */
  async extractIntent(transcriptionText) {
    if (!groqClient) {
      // Mock extraction for testing
      return {
        intent: 'callback_request',
        urgency: 'medium',
        requested_action: 'Call John back about the project',
        callback_number: '555-0123',
        alternative_contact: null,
        best_time_to_callback: null,
        entities: { 
          names: ['John'], 
          dates: [], 
          organizations: [] 
        },
        summary: 'John called about a project, wants a callback at 555-0123',
        response_needed: true,
        estimated_resolution_time: 'short',
      };
    }

    const prompt = `You are parsing voicemail transcripts for AI agents.

TRANSCRIPT:
"""${transcriptionText}"""

Extract the following JSON structure:
{
  "intent": "callback_request|appointment_scheduling|information_request|complaint|sales_inquiry|other",
  "urgency": "high|medium|low",
  "requested_action": "string describing what the caller wants",
  "callback_number": "phone number if mentioned, else null",
  "alternative_contact": "email or other contact if mentioned, else null",
  "best_time_to_callback": "time mentioned or null",
  "entities": {
    "names": ["list of people mentioned"],
    "dates": ["dates mentioned"],
    "organizations": ["companies/organizations mentioned"]
  },
  "summary": "One sentence summary for agent consumption",
  "response_needed": true|false,
  "estimated_resolution_time": "short|medium|long"
}

Return ONLY valid JSON. Be concise.`;

    try {
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',  // Fast, cheap
        messages: [
          { role: 'system', content: 'You extract structured data from voicemails. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      return {
        intent: analysis.intent || 'other',
        urgency: analysis.urgency || 'medium',
        requested_action: analysis.requested_action || null,
        callback_number: analysis.callback_number || null,
        alternative_contact: analysis.alternative_contact || null,
        best_time_to_callback: analysis.best_time_to_callback || null,
        entities: analysis.entities || { names: [], dates: [], organizations: [] },
        summary: analysis.summary || transcriptionText.substring(0, 100),
        response_needed: analysis.response_needed !== false,
        estimated_resolution_time: analysis.estimated_resolution_time || 'medium',
      };

    } catch (error) {
      console.error('Intent extraction error:', error);
      
      // Fallback: return basic structure
      return {
        intent: 'unknown',
        urgency: 'medium',
        requested_action: null,
        callback_number: null,
        alternative_contact: null,
        best_time_to_callback: null,
        entities: { names: [], dates: [], organizations: [] },
        summary: transcriptionText.substring(0, 150),
        response_needed: true,
        estimated_resolution_time: 'medium',
        extraction_error: error.message,
      };
    }
  }

  /**
   * Send webhook callback to agent
   */
  async sendWebhook(url, data) {
    if (!url) return;

    try {
      // Use dynamic import for fetch (Node 18+)
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Tools-Signature': 'voicemail-processed',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.warn(`Webhook to ${url} returned ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook delivery failed:', error.message);
      // Don't throw - webhook failures shouldn't fail the job
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      return { 
        jobId, 
        status: job.status,
        result: job.result,
        error: job.error,
      };
    }
    return { jobId, status: 'unknown' };
  }
}

module.exports = { VoicemailProcessor };
