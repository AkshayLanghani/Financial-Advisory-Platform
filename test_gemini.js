const fs = require('fs');
(async ()=>{
  try{
    const env = fs.readFileSync('.env','utf8');
    const m = env.match(/GEMINI_API_KEY=(.*)/);
    const key = m && m[1] ? m[1].trim() : '';
    if(!key){ console.error('No GEMINI_API_KEY found in .env'); process.exit(2); }

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generate?key=${key}`;
    const payload = { prompt: `Test ping from local proxy`, temperature: 0.2, max_output_tokens: 128 };

    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.log('upstream status', res.status);
    const text = await res.text();
    console.log('upstream body:', text);
  }catch(err){ console.error('fetch error', err); process.exit(1); }
})();
