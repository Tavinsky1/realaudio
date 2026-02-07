/**
 * AgentVision - Image Analysis for AI Agents
 * 
 * Describe images, read text, analyze UI elements
 * Uses Groq (already set up)
 */

const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Analyze image from URL
 */
async function analyzeImage(imageUrl, prompt = 'Describe this image in detail') {
  if (!groq) {
    throw new Error('Groq not configured');
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    return {
      description: response.choices[0].message.content,
      model: 'llama-3.2-11b-vision',
      usage: response.usage,
    };
  } catch (error) {
    console.error('Vision analysis error:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}

/**
 * Read text from image (OCR)
 */
async function readText(imageUrl) {
  return analyzeImage(
    imageUrl,
    'Read and extract all text from this image. Return only the text content, nothing else.'
  );
}

/**
 * Analyze UI element
 */
async function analyzeUI(imageUrl) {
  return analyzeImage(
    imageUrl,
    `Analyze this UI element. Return JSON with:
    {
      "element_type": "button|input|link|image|text|other",
      "label": "what the element says",
      "action": "what clicking does",
      "state": "enabled|disabled|selected|default"
    }`
  );
}

/**
 * Check if image contains specific content
 */
async function detectContent(imageUrl, searchFor) {
  return analyzeImage(
    imageUrl,
    `Does this image contain "${searchFor}"? Answer yes or no and explain briefly.`
  );
}

module.exports = {
  analyzeImage,
  readText,
  analyzeUI,
  detectContent,
};
