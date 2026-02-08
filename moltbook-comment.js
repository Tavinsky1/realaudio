#!/usr/bin/env node

/**
 * Moltbook Comment Tool - Reply to existing posts
 */

const fs = require('fs');
const path = require('path');

// Load API key from .moltbook file
function loadCredentials() {
  const moltbookFile = path.join(__dirname, '.moltbook');
  if (!fs.existsSync(moltbookFile)) {
    console.error('❌ .moltbook file not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(moltbookFile, 'utf8');
  const apiKey = content.match(/MOLTBOOK_API_KEY=(.+)/)?.[1];
  
  if (!apiKey) {
    console.error('❌ MOLTBOOK_API_KEY not found');
    process.exit(1);
  }
  
  return { apiKey };
}

// Solve verification challenge by extracting math from text
async function solveChallenge(challenge) {
  // Remove special characters and normalize the text
  const normalized = challenge
    .toLowerCase()
    .replace(/[^a-z0-9\s\.\-\+\*\/\(\)]/g, ' ')
    .replace(/\s+/g, ' ');
  
  console.log('📝 Normalized:', normalized);
  
  //Parse compound number words like "thirty four" -> 34
  function parseNumberWords(text) {
    // First normalize repeated letters (threee -> three, noootoons -> newtons)
    text = text.replace(/(.)\1{2,}/g, '$1$1'); // Keep max 2 of same letter
    
    // Remove extra spaces AND special chars between number words (tw/en ty -> twenty)
    // Use [\s\/.\-]* to match spaces, slashes, periods, or hyphens (hyphen at end)
    text = text.replace(/t[\s\/.\-]*w[\s\/.\-]*o/gi, 'two');
    text = text.replace(/t[\s\/.\-]*w[\s\/.\-]*e[\s\/.\-]*l[\s\/.\-]*v[\s\/.\-]*e/gi, 'twelve');
    text = text.replace(/t[\s\/.\-]*w[\s\/.\-]*e[\s\/.\-]*n[\s\/.\-]*t[\s\/.\-]*y/gi, 'twenty');
    text = text.replace(/t[\s\/.\-]*h[\s\/.\-]*i[\s\/.\-]*r[\s\/.\-]*t[\s\/.\-]*y/gi, 'thirty');
    text = text.replace(/f[\s\/.\-]*o[\s\/.\-]*r[\s\/.\-]*t[\s\/.\-]*y/gi, 'forty');
    text = text.replace(/f[\s\/.\-]*i[\s\/.\-]*f[\s\/.\-]*t[\s\/.\-]*y/gi, 'fifty');
    text = text.replace(/s[\s\/.\-]*i[\s\/.\-]*x[\s\/.\-]*t[\s\/.\-]*y/gi, 'sixty');
    text = text.replace(/s[\s\/.\-]*e[\s\/.\-]*v[\s\/.\-]*e[\s\/.\-]*n/gi, 'seven');
    text = text.replace(/e[\s\/.\-]*i[\s\/.\-]*g[\s\/.\-]*h[\s\/.\-]*t/gi, 'eight');
    text = text.replace(/t[\s\/.\-]*h[\s\/.\-]*r[\s\/.\-]*e[\s\/.\-]*e/gi, 'three');
    text = text.replace(/f[\s\/.\-]*o[\s\/.\-]*u[\s\/.\-]*r/gi, 'four');
    text = text.replace(/f[\s\/.\-]*i[\s\/.\-]*v[\s\/.\-]*e/gi, 'five');
    text = text.replace(/n[\s\/.\-]*i[\s\/.\-]*n[\s\/.\-]*e/gi, 'nine');
    
    const ones = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
    };
    
    const tens = {
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
    };
    
    const scales = {
      'hundred': 100, 'thousand': 1000, 'million': 1000000
    };
    
    let result = text;
    
    // Handle compound numbers (e.g., "twenty five" -> 25)
    for (const [tensWord, tensVal] of Object.entries(tens)) {
      for (const [onesWord, onesVal] of Object.entries(ones)) {
        if (onesVal > 0 && onesVal < 10) {
          const compound = `${tensWord} ${onesWord}`;
          const compoundNoSpace = `${tensWord}${onesWord}`;
          const value = tensVal + onesVal;
          result = result.replace(new RegExp(compound, 'g'), value.toString());
          result = result.replace(new RegExp(compoundNoSpace, 'g'), value.toString());
        }
      }
      result = result.replace(new RegExp(tensWord, 'g'), tensVal.toString());
    }
    
    // Handle simple numbers
    for (const [word, num] of Object.entries(ones)) {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), num.toString());
    }
    
    for (const [word, num] of Object.entries(scales)) {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), num.toString());
    }
    
    return result;
  }
  
  const withNumbers = parseNumberWords(normalized);
  console.log('🔤 After parsing words:', withNumbers);
  
  // Extract all numbers
  const numbers = withNumbers.match(/\d+(\.\d+)?/g)?.map(parseFloat) || [];
  
  console.log('🔢 Numbers found:', numbers);
  
  if (numbers.length === 0) return '0.00';
  
  // Normalize spaces in text for operation keywords
  const text = withNumbers;
  const normalizedOp = text.replace(/\s+/g, '');
  
  // Detect operation
  let result;
  
  if (normalizedOp.includes('multipl') || normalizedOp.includes('times') || normalizedOp.includes('amplif') || text.includes('product')) {
    result = numbers.reduce((a, b) => a * b, 1);
  } else if ((text.includes('add') || text.includes('plus') || text.includes('sum') || text.includes('total') || text.includes('gain') || text.includes('increase')) && !normalizedOp.includes('multipl')) {
    result = numbers.reduce((a, b) => a + b, 0);
  } else if (text.includes('subtract') || text.includes('minus') || text.includes('difference') || text.includes('lose') || text.includes('decrease') || text.includes('slow') || text.includes('decelerat')) {
    result = numbers.length >= 2 ? numbers[0] - numbers[1] : numbers[0];
  } else if (text.includes('divid') || text.includes('quotient')) {
    result = numbers.length >= 2 ? numbers[0] / numbers[1] : numbers[0];
  } else if ((text.includes('speed') || text.includes('increase')) && (text.includes('up') || text.includes('by'))) {
    // "speeds up by X" or "increases speed by X" = addition
    result = numbers.reduce((a, b) => a + b, 0);
  } else {
    // Default: if multiple numbers and contains "force" or "total", add them
    if (numbers.length >= 2 && (text.includes('total') || text.includes('force') || text.includes('combined'))) {
      result = numbers.reduce((a, b) => a + b, 0);
    } else if (numbers.length >= 2) {
      result = numbers[0] * numbers[1]; // Assume multiplication
    } else {
      result = numbers[0];
    }
  }
  
  return result.toFixed(2);
}

// Create a comment on a post
async function createComment({ postId, content, parentId = null }) {
  const { apiKey } = loadCredentials();
  
  const body = { content };
  if (parentId) {
    body.parent_id = parentId;
  }
  
  console.log('💬 Creating comment...');
  
  const response = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Failed to create comment:', result);
    process.exit(1);
  }
  
  // Check if verification is required
  if (result.verification_required) {
    console.log('🔐 Verification required...');
    console.log('Challenge:', result.verification.challenge);
    
    const answer = await solveChallenge(result.verification.challenge);
    console.log('🧮 Calculated answer:', answer);
    
    // Submit verification
    const verifyResponse = await fetch('https://www.moltbook.com/api/v1/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification_code: result.verification.code,
        answer: answer,
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    
    if (!verifyResponse.ok || !verifyResult.success) {
      console.error('❌ Verification failed:', verifyResult);
      process.exit(1);
    }
    
    console.log('✅ Verification successful!');
  }
  
  return result;
}

// Get comments for a post
async function getComments(postId, limit = 10) {
  const { apiKey } = loadCredentials();
  
  const response = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/comments?limit=${limit}`, {
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
    console.log('Usage: node moltbook-comment.js <post_id> "Comment content"');
    console.log('       node moltbook-comment.js --get <post_id>   # Get comments');
    console.log('       node moltbook-comment.js --file comment.json');
    return;
  }
  
  // Get comments
  if (args[0] === '--get') {
    const postId = args[1];
    const comments = await getComments(postId);
    console.log(JSON.stringify(comments, null, 2));
    return;
  }
  
  // Post from JSON file
  if (args[0] === '--file') {
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide a JSON file path');
      process.exit(1);
    }
    const commentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = await createComment(commentData);
    console.log('✅ Comment posted!');
    console.log(`🔗 Comment ID: ${result.comment.id}`);
    return;
  }
  
  // Simple comment
  const postId = args[0];
  const content = args.slice(1).join(' ');
  
  const result = await createComment({ postId, content });
  
  console.log('✅ Comment posted!');
  console.log(`🔗 Comment ID: ${result.comment.id}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = { createComment, getComments, solveChallenge };
