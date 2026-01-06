// /api/gemini.js
/**
 * Vercel serverless function to proxy requests to Google's Gemini API.
 * 
 * This uses the Gemini 2.5 Flash model (free tier):
 * - Model: gemini-2.5-flash
 * - Free input/output tokens
 * - Fast response times
 * - Supports text, image, video, audio
 * 
 * SETUP INSTRUCTIONS:
 * 1. Get your free API key: https://aistudio.google.com/app/apikey
 * 2. In Vercel Dashboard → Project Settings → Environment Variables
 * 3. Add: GEMINI_API_KEY = <your-api-key-here>
 * 4. Redeploy the project
 * 
 * Reference: https://ai.google.dev/pricing
 */

export default async function handler(req, res) {
  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse request
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Request must include "prompt" (string)' });
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('ERROR: GEMINI_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'GEMINI_API_KEY not found in Vercel Environment Variables'
      });
    }

    // Google Generative AI REST API endpoint (v1beta)
    // Uses gemini-2.5-flash (free tier model)
    const MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    // Request payload following Google's API format
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      // Generation config - optimize for chat
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.95,
        topK: 40
      }
    };

    // Call Google's Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      
      return res.status(response.status).json({
        error: 'Gemini API Error',
        status: response.status,
        message: errorData?.error?.message || 'Unable to generate response'
      });
    }

    // Parse and forward the response
    const data = await response.json();
    
    // Response format: data.candidates[0].content.parts[0].text
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
