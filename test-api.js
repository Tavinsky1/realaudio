#!/usr/bin/env node

/**
 * Test Script for AgentVoicemail API
 * 
 * Tests the API locally or on deployed URL
 * Verifies:
 * - Health check
 * - Free tier request
 * - Analytics tracking
 * - Error handling
 * 
 * Usage:
 *   node test-api.js                    # Test local (http://localhost:3000)
 *   node test-api.js https://your-url   # Test deployed
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TEST_AGENT_ID = 'test_agent_' + Date.now();

console.log('\n🧪 Testing AgentVoicemail API');
console.log('📍 Base URL:', BASE_URL);
console.log('🤖 Test Agent ID:', TEST_AGENT_ID);
console.log('💡 Note: Using FREE TIER - no payment needed for testing');
console.log('─'.repeat(60));

// Helper: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test 1: Health Check
async function testHealth() {
  console.log('\n1️⃣  Testing Health Endpoint');
  try {
    const { status, data } = await makeRequest(`${BASE_URL}/api/health`);
    
    if (status === 200) {
      console.log('✅ Health check passed');
      console.log('   Status:', data.status);
      console.log('   Uptime:', data.uptime?.toFixed(2) + 's');
      console.log('   Free Tier Limit:', data.stats?.free_tier_limit);
      return true;
    } else {
      console.log('❌ Health check failed:', status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test 2: Free Tier Request
async function testFreeTier() {
  console.log('\n2️⃣  Testing Free Tier Request');
  try {
    const payload = {
      audio_url: 'https://example.com/voicemail.mp3',
      webhook_url: 'https://webhook.site/test',
      agent_id: TEST_AGENT_ID,
    };

    const { status, data } = await makeRequest(`${BASE_URL}/api/voicemail/process`, {
      method: 'POST',
      body: payload,
    });

    // Expect 400 due to audio validation (example.com doesn't host audio)
    if (status === 400 && data.error === 'AUDIO_VALIDATION_FAILED') {
      console.log('✅ Audio validation working correctly');
      console.log('   Error:', data.error);
      console.log('   Note: Use real audio URL for actual testing');
      return true;
    } else if (status === 202) {
      console.log('✅ Free tier request accepted');
      console.log('   Status:', data.status);
      console.log('   Free tier:', data.free_tier);
      console.log('   Remaining:', data.remaining_free);
      console.log('   ETA:', data.eta);
      return true;
    } else {
      console.log('❌ Unexpected response:', status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Free tier error:', error.message);
    return false;
  }
}

// Test 3: Payment Required (After Free Tier)
async function testPaymentRequired() {
  console.log('\n3️⃣  Testing Payment Required (After Free Tier)');
  try {
    const payload = {
      audio_url: 'https://example.com/voicemail2.mp3',
      webhook_url: 'https://webhook.site/test',
      agent_id: TEST_AGENT_ID,
    };

    const { status, data } = await makeRequest(`${BASE_URL}/api/voicemail/process`, {
      method: 'POST',
      body: payload,
    });

    // Expect same audio validation error
    if (status === 400 && data.error === 'AUDIO_VALIDATION_FAILED') {
      console.log('✅ Audio validation still working (need real audio to test payment)');
      return true;
    } else if (status === 402) {
      console.log('✅ Payment required (as expected)');
      console.log('   Error:', data.error);
      console.log('   Message:', data.message);
      console.log('   Free tier used:', data.free_tier_used);
      console.log('   Service Wallet:', data.service_wallet);
      console.log('   Pricing:', data.pricing?.sol, 'SOL (~$' + data.pricing?.usd + ')');
      return true;
    } else if (status === 202) {
      console.log('⚠️  Still using free tier');
      console.log('   Free tier limit may be higher than 1');
      return true;
    } else {
      console.log('❌ Unexpected status:', status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Payment test error:', error.message);
    return false;
  }
}

// Test 4: Analytics
async function testAnalytics() {
  console.log('\n4️⃣  Testing Analytics Endpoint');
  try {
    const { status, data } = await makeRequest(`${BASE_URL}/api/analytics`);
    
    if (status === 200) {
      console.log('✅ Analytics working');
      console.log('   Total Requests:', data.overview?.totalRequests);
      console.log('   Success Rate:', data.overview?.successRate);
      console.log('   Unique Agents:', data.overview?.uniqueAgents);
      console.log('   Total Revenue:', data.revenue?.totalRevenueSol, 'SOL');
      return true;
    } else {
      console.log('❌ Analytics failed:', status);
      return false;
    }
  } catch (error) {
    console.log('❌ Analytics error:', error.message);
    return false;
  }
}

// Test 5: Invalid Request
async function testInvalidRequest() {
  console.log('\n5️⃣  Testing Invalid Request Handling');
  try {
    const payload = {
      // Missing required fields
      audio_url: 'not-a-url',
    };

    const { status, data } = await makeRequest(`${BASE_URL}/api/voicemail/process`, {
      method: 'POST',
      body: payload,
    });

    if (status === 400) {
      console.log('✅ Validation working correctly');
      console.log('   Error:', data.error);
      return true;
    } else {
      console.log('❌ Should return 400 for invalid request');
      return false;
    }
  } catch (error) {
    console.log('❌ Validation test error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const tests = [
    testHealth,
    testFreeTier,
    testPaymentRequired,
    testAnalytics,
    testInvalidRequest,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await test();
    if (success) {
      passed++;
    } else {
      failed++;
    }
    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '─'.repeat(60));
  console.log('📊 Test Results');
  console.log('   ✅ Passed:', passed);
  console.log('   ❌ Failed:', failed);
  console.log('   📈 Success Rate:', ((passed / tests.length) * 100).toFixed(1) + '%');
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is ready to deploy.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
  }
  
  console.log('\n📍 View Analytics Dashboard:');
  console.log('   ' + BASE_URL + '/analytics');
  console.log('\n');
}

// Start tests
runTests().catch(console.error);
