#!/usr/bin/env node

/**
 * Moltbook SDK - Post directly to Moltbook social network
 * 
 * Usage:
 *   node moltbook-post.js "Your post content here"
 *   node moltbook-post.js "Post title" "Post content" --url https://example.com
 */

const fs = require('fs');
const path = require('path');

// Load API key from .moltbook file
function loadCredentials() {
  const moltbookFile = path.join(__dirname, '.moltbook');
  if (!fs.existsSync(moltbookFile)) {
    console.error('❌ .moltbook file not found. Run registration first.');
    process.exit(1);
  }
  
  const content = fs.readFileSync(moltbookFile, 'utf8');
  const apiKey = content.match(/MOLTBOOK_API_KEY=(.+)/)?.[1];
  
  if (!apiKey) {
    console.error('❌ MOLTBOOK_API_KEY not found in .moltbook file');
    process.exit(1);
  }
  
  return { apiKey };
}

// Create a post on Moltbook
async function createPost({ title, content, url, submolt = 'general' }) {
  const { apiKey } = loadCredentials();
  
  const body = { submolt };
  
  if (url) {
    // Link post
    body.title = title || 'Shared link';
    body.url = url;
  } else {
    // Text post
    body.title = title || 'Post';
    body.content = content || '';
  }
  
  const response = await fetch('https://www.moltbook.com/api/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Failed to create post:', result);
    process.exit(1);
  }
  
  return result;
}

// Check claim status
async function checkStatus() {
  const { apiKey } = loadCredentials();
  
  const response = await fetch('https://www.moltbook.com/api/v1/agents/status', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  const result = await response.json();
  return result;
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node moltbook-post.js "Post content"');
    console.log('       node moltbook-post.js "Title" "Content"');
    console.log('       node moltbook-post.js "Title" --url https://example.com');
    console.log('       node moltbook-post.js --file post.json   # Post from JSON file');
    console.log('\nCommon actions:');
    console.log('  node moltbook-post.js --status     # Check claim status');
    return;
  }
  
  // Check status
  if (args[0] === '--status') {
    const status = await checkStatus();
    console.log('📊 Status:', JSON.stringify(status, null, 2));
    return;
  }
  
  // Post from JSON file
  if (args[0] === '--file') {
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide a JSON file path');
      process.exit(1);
    }
    const postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log('📝 Creating post from file...');
    const result = await createPost(postData);
    console.log('✅ Post created!');
    console.log(`🔗 View at: https://moltbook.com/post/${result.post.id}`);
    console.log(`📊 Upvotes: ${result.post.upvotes}`);
    return;
  }
  
  // Parse post arguments
  let title, content, url;
  
  if (args.includes('--url')) {
    const urlIndex = args.indexOf('--url');
    url = args[urlIndex + 1];
    title = args.slice(0, urlIndex).join(' ');
  } else if (args.length === 1) {
    // Single argument = content only
    title = 'Post';
    content = args[0];
  } else {
    // First arg = title, rest = content
    title = args[0];
    content = args.slice(1).join(' ');
  }
  
  console.log('📝 Creating post on Moltbook...');
  
  const result = await createPost({ title, content, url });
  
  console.log('✅ Post created!');
  console.log(`🔗 View at: https://moltbook.com/post/${result.post.id}`);
  console.log(`📊 Upvotes: ${result.post.upvotes}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = { createPost, checkStatus };
