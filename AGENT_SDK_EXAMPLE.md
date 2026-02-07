# AgentWallet SDK Example

Complete working example for AI agents to use AgentVoicemail.

## Installation

```bash
npm install @solana/web3.js node-fetch
```

## Basic Usage

```javascript
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fetch = require('node-fetch');

class AgentWalletClient {
  constructor(privateKeyBase58, options = {}) {
    // Load agent's wallet
    this.keypair = Keypair.fromSecretKey(
      Buffer.from(require('bs58').decode(privateKeyBase58))
    );
    
    this.connection = new Connection(
      options.rpcUrl || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    this.endpoint = options.endpoint || 'https://inksky.net';
    this.serviceWallet = new PublicKey(options.serviceWallet || 'YOUR_SERVICE_WALLET_HERE');
  }

  get address() {
    return this.keypair.publicKey.toString();
  }

  async getBalance() {
    const lamports = await this.connection.getBalance(this.keypair.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  async getPricing() {
    const res = await fetch(`${this.endpoint}/api/pricing`);
    return res.json();
  }

  async getHealth() {
    const res = await fetch(`${this.endpoint}/api/health`);
    return res.json();
  }

  async sendPayment(amountSol) {
    const lamports = amountSol * LAMPORTS_PER_SOL;
    
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: this.serviceWallet,
        lamports,
      })
    );

    const signature = await this.connection.sendTransaction(tx, [this.keypair]);
    await this.connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`✅ Payment sent: ${signature}`);
    return signature;
  }

  async processVoicemail(audioUrl, webhookUrl, options = {}) {
    // Check current pricing
    const health = await this.getHealth();
    const priceSol = options.priority 
      ? health.pricing.prices.voicemail_priority.sol 
      : health.pricing.prices.voicemail.sol;

    console.log(`💰 Current price: ${priceSol} SOL (~$0.20 USD)`);

    // Check if we have free tier left
    const balance = await this.getBalance();
    
    // Try without payment first (free tier)
    console.log('🔄 Attempting request (free tier)...');
    
    let res = await fetch(`${this.endpoint}/api/voicemail/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: audioUrl,
        webhook_url: webhookUrl,
        agent_id: this.address,
        priority: options.priority || false,
      }),
    });

    let data = await res.json();

    // If free tier exhausted, pay and retry
    if (res.status === 402) {
      console.log(`⚠️ Free tier exhausted. Paying ${priceSol} SOL...`);
      
      if (balance < priceSol) {
        throw new Error(`Insufficient balance: ${balance} SOL, need ${priceSol} SOL`);
      }

      const signature = await this.sendPayment(priceSol);

      // Retry with payment
      res = await fetch(`${this.endpoint}/api/voicemail/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_url: audioUrl,
          webhook_url: webhookUrl,
          agent_id: this.address,
          priority: options.priority || false,
          payment: { signature },
        }),
      });

      data = await res.json();
    }

    if (!res.ok) {
      throw new Error(`API Error: ${data.error} - ${data.message}`);
    }

    console.log(`✅ Job queued: ${data.job_id}`);
    console.log(`📊 Free tier remaining: ${data.remaining_free || 0}`);
    
    return data;
  }

  async checkJobStatus(jobId) {
    const res = await fetch(`${this.endpoint}/api/voicemail/status?job_id=${jobId}`);
    return res.json();
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================

async function main() {
  // Initialize with agent's private key (from env)
  const agent = new AgentWalletClient(process.env.AGENT_PRIVATE_KEY);

  console.log(`🤖 Agent address: ${agent.address}`);
  console.log(`💳 Balance: ${await agent.getBalance()} SOL`);

  // Process a voicemail
  try {
    const result = await agent.processVoicemail(
      'https://storage.example.com/voicemail-123.mp3',
      'https://my-agent.com/webhooks/voicemail',
      { priority: false }
    );

    console.log('Result:', result);

    // Poll for completion (optional - webhook is preferred)
    if (result.status === 'queued') {
      console.log('⏳ Waiting for processing...');
      
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const status = await agent.checkJobStatus(result.job_id);
        
        if (status.status === 'completed') {
          console.log('✅ Done!');
          console.log('Transcription:', status.result.transcription);
          console.log('Intent:', status.result.intent);
          console.log('Callback number:', status.result.callback_number);
          break;
        }
        
        if (status.status === 'failed') {
          console.log('❌ Failed:', status.error);
          break;
        }
        
        console.log(`⏳ Still processing... (${i + 1}/10)`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { AgentWalletClient };
```

## Webhook Handler

Your agent needs to receive the results:

```javascript
const express = require('express');
const app = express();

app.post('/webhooks/voicemail', express.json(), (req, res) => {
  const result = req.body;
  
  console.log('📨 Voicemail processed:', result);
  
  // Handle based on intent
  switch (result.intent) {
    case 'callback_request':
      console.log(`📞 Schedule callback to ${result.callback_number}`);
      // Schedule the callback...
      break;
      
    case 'appointment_scheduling':
      console.log(`📅 Parse appointment: ${result.summary}`);
      // Add to calendar...
      break;
      
    default:
      console.log(`📝 Log for human review: ${result.summary}`);
  }
  
  res.json({ received: true });
});

app.listen(3000);
```

## Environment Variables

```bash
AGENT_PRIVATE_KEY=your_base58_encoded_private_key
# Or generate new: node -e "console.log(require('@solana/web3.js').Keypair.generate().secretKey)"
```

## Funding Your Agent

1. Create wallet (if needed):
   ```javascript
   const { Keypair } = require('@solana/web3.js');
   const kp = Keypair.generate();
   console.log('Address:', kp.publicKey.toString());
   console.log('Private Key:', Buffer.from(kp.secretKey).toString('base58'));
   ```

2. Buy SOL on any exchange (Coinbase, Binance, etc.)

3. Send 0.01 SOL to your agent's address (covers ~10 voicemails)

4. Start processing!
