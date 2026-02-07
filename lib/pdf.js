/**
 * AgentPDF - PDF Processing for AI Agents
 * 
 * Extract text and data from PDF files
 * Uses pdf-parse (open source, free)
 */

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.warn('pdf-parse not installed. Run: npm install pdf-parse');
}

/**
 * Extract text from PDF URL
 */
async function extractTextFromPDF(pdfUrl) {
  if (!pdfParse) {
    throw new Error('PDF parser not available. Install: npm install pdf-parse');
  }

  try {
    // Download PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    
    // Parse PDF
    const data = await pdfParse(pdfBuffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract structured data (invoices, forms)
 */
async function extractStructuredData(pdfUrl, type = 'auto') {
  const { text } = await extractTextFromPDF(pdfUrl);
  
  // Simple pattern matching for common structures
  const extracted = {
    raw_text: text,
    type: type,
  };

  if (type === 'invoice' || type === 'auto') {
    // Try to find invoice patterns
    const invoiceMatch = text.match(/invoice[\s#:]*([a-z0-9-]+)/i);
    const amountMatch = text.match(/total[\s:]*[$€£]?\s*([0-9,.]+)/i);
    const dateMatch = text.match(/date[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    
    if (invoiceMatch || amountMatch || dateMatch) {
      extracted.invoice_data = {
        invoice_number: invoiceMatch ? invoiceMatch[1] : null,
        total_amount: amountMatch ? amountMatch[1] : null,
        date: dateMatch ? dateMatch[1] : null,
      };
    }
  }

  if (type === 'form' || type === 'auto') {
    // Extract key-value pairs
    const lines = text.split('\n');
    const fields = {};
    
    for (const line of lines) {
      const match = line.match(/^\s*([^:]+):\s*(.+)$/);
      if (match) {
        fields[match[1].trim()] = match[2].trim();
      }
    }
    
    if (Object.keys(fields).length > 0) {
      extracted.form_fields = fields;
    }
  }

  return extracted;
}

/**
 * Summarize PDF content
 */
async function summarizePDF(pdfUrl, maxLength = 500) {
  const { text } = await extractTextFromPDF(pdfUrl);
  
  // Simple summarization (first X characters for now)
  // In production, use LLM for real summarization
  const summary = text.substring(0, maxLength);
  const isTruncated = text.length > maxLength;
  
  return {
    summary: summary + (isTruncated ? '...' : ''),
    full_length: text.length,
    truncated: isTruncated,
  };
}

module.exports = {
  extractTextFromPDF,
  extractStructuredData,
  summarizePDF,
};
