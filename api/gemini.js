// /api/gemini.js
/**
 * Vercel serverless function to proxy requests to Google's Gemini API.
 * 
 * Uses: gemini-2.5-flash (Free tier model)
 * API Reference: https://ai.google.dev/api/generate-content
 * 
 * SETUP:
 * 1. Get API key from: https://aistudio.google.com/app/apikey
 * 2. Vercel Dashboard → Settings → Environment Variables
 * 3. Add: GEMINI_API_KEY = <your-key>
 * 4. Redeploy
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body || {};
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'prompt must be a non-empty string'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[FATAL] GEMINI_API_KEY not in environment variables');
      return res.status(500).json({ 
        error: 'Server not configured',
        message: 'GEMINI_API_KEY environment variable missing'
      });
    }

    console.log(`[gemini.js] Processing prompt: "${prompt.substring(0, 50)}..."`);

    // Google API endpoint - v1beta with key auth
    const MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    console.log(`[gemini.js] Calling: ${API_URL.replace(apiKey, '***')}`);

    const systemPrompt = `You are the EliteLedger Advisors LLC AI Assistant - a professional CPA firm advisor. 

IMPORTANT CONSTRAINTS:
- ONLY answer questions related to EliteLedger Advisors LLC's services: tax preparation, accounting, bookkeeping, financial advisory, tax planning, business consulting
- If a question is NOT about EliteLedger's services or CPA/tax/accounting topics, politely redirect the conversation back to EliteLedger's services
- Do NOT answer general knowledge questions, trivia, or unrelated topics
- Always maintain a professional, helpful tone
- Provide detailed, helpful information about tax, accounting, and business services
- Reference EliteLedger's expertise and service packages when relevant

EliteLedger Advisors LLC specializes in:
- Federal and state tax return preparation
- Tax planning and optimization
- Monthly bookkeeping and bank reconciliation
- Financial statements and reporting
- Business accounting and advisory
- Payroll services
- Entity structure consulting
- NOL deductions and loss planning

If the user asks about anything outside these areas, respond: "I appreciate the question, but I'm specifically trained to help with EliteLedger Advisors' tax, accounting, and advisory services. How can I assist you with those services today?"`;

    const requestPayload = {
      systemInstruction: {
        parts: [
          {
            text: systemPrompt
          }
        ]
      },
      contents: [
        {
          parts: [
            {
              text: prompt.trim()
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40
      }
    };

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    console.log(`[gemini.js] API Response status: ${apiResponse.status}`);

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error(`[gemini.js] API error response:`, responseData);
      
      return res.status(apiResponse.status).json({
        error: 'Gemini API error',
        status: apiResponse.status,
        details: responseData?.error?.message || JSON.stringify(responseData)
      });
    }

    console.log(`[gemini.js] Success. Candidates: ${responseData.candidates?.length || 0}`);
    console.log(`[gemini.js] Response:`, JSON.stringify(responseData).substring(0, 200));

    // Verify response structure
    if (!responseData.candidates || responseData.candidates.length === 0) {
      console.warn('[gemini.js] No candidates in response');
      return res.status(200).json(responseData);
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('[gemini.js] Exception:', error.message, error.stack);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}
