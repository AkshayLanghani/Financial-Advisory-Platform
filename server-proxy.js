require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Use the global `fetch` available in Node 18+.
// No external node-fetch required.
const fetch = globalThis.fetch;

const app = express();
app.use(express.json());

// Allow browser pages from your GitHub Pages origin and localhost for testing
// Allow any localhost origin on any port for development
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost (any port)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow GitHub Pages
    if (origin.includes('akshaylanghani.github.io')) {
      return callback(null, true);
    }
    // Reject others
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));

// Simple rate limiting to reduce abuse
const limiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many requests, slow down' } });
app.use('/api/', limiter);

const API_KEY = process.env.GEMINI_API_KEY;
if(!API_KEY) console.warn('GEMINI_API_KEY not set — paste your key into .env or set env var.');

// Basic server-side validation to ensure chatbot stays on-topic
function sanitizeInput(text){ if(!text || typeof text !== 'string') return ''; return text.trim().slice(0, 2000); }

app.post('/api/gemini', async (req, res) => {
  try{
    const { system = '', message } = req.body || {};
    const userMessage = sanitizeInput(message);
    if(!userMessage) return res.status(400).json({ error: 'No message provided' });

    if(!API_KEY) return res.status(500).json({ error: 'Server not configured (missing API key)' });

    // Build a guarded system prompt server-side as well
    const systemPrompt = system || "You are a chatbot for EliteLedger Advisors LLC. Only answer questions related to accounting, bookkeeping, tax services, CPA advisory, and services provided by the website. Do not answer unrelated questions. Keep answers professional, concise, and friendly.";

    // Call Google Generative Language API (REST)
    // Use the latest v1beta endpoint with gemini-pro model which is stable and widely available
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nUser: ${userMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512
      }
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if(!apiRes.ok){
      const txt = await apiRes.text().catch(()=>null);
      console.error('Gemini API error', apiRes.status, txt);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const apiJson = await apiRes.json();
    
    // Extract reply from v1beta response format
    const reply = apiJson?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  apiJson?.candidates?.[0]?.content || 
                  apiJson?.text || 
                  'Sorry, no reply generated. Try again.';

    return res.json({ reply });
  }catch(err){
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server proxy running on http://localhost:${PORT}`));
