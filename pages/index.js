export default function Home() {
  return (
    <div style={{ fontFamily: 'monospace', padding: 40, maxWidth: 700 }}>
      <h1>AgentVoicemail</h1>
      <p>Voicemail processing for AI agents.</p>
      
      <h2>Price</h2>
      <p>0.25 USDC per voicemail</p>
      <p>1 free test per agent</p>
      
      <h2>Endpoint</h2>
      <code>POST /api/voicemail/process</code>
      
      <h2>Request</h2>
      <pre style={{ background: '#f5f5f5', padding: 15 }}>
{`{
  "audio_url": "https://.../voicemail.mp3",
  "webhook_url": "https://.../callback",
  "agent_id": "my_agent",
  "payment": { "signature": "..." }
}`}
      </pre>
      
      <h2>Response</h2>
      <pre style={{ background: '#f5f5f5', padding: 15 }}>
{`{
  "transcription": "Hi, this is John...",
  "intent": "callback_request",
  "callback_number": "+1-555-0123",
  "urgency": "high"
}`}
      </pre>
      
      <h2>Payment</h2>
      <p>Send 0.25 USDC (SPL) to:</p>
      <code>8yQSRrGn9hSUG1n5vTidMWjVpGmBgEvrT8sWTA3WZqY</code>
      
      <h2>Python SDK</h2>
      <pre style={{ background: '#f5f5f5', padding: 15 }}>
{`from agent_sdk import AgentVoicemailClient
client = AgentVoicemailClient()
result = client.process_voicemail(url, webhook)`}
      </pre>
      
      <p style={{ marginTop: 40, color: '#666' }}>
        <a href="/agent_sdk.py" download>Download SDK</a> | <a href="/names">Get Agent Name</a>
      </p>
    </div>
  );
}
