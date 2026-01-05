# Server proxy for EliteLedger Chat Assistant

This small Node.js proxy forwards chat requests from the static website to the Gemini (Generative Language) API while keeping your API key secret.

Where to paste your key
- Create a file named `.env` in the `website` folder (do not commit it).
- Paste this line, replacing the placeholder with your real key:

```
GEMINI_API_KEY=YOUR_REAL_GEMINI_KEY_HERE
```

Run locally

```powershell
cd "c:/Users/aksha/OneDrive/Desktop/web project/website"
npm install
node server-proxy.js
# open your site (serve static files or open contact.html) and the widget will POST to http://localhost:3000/api/gemini
```

Deploying
- Deploy this repository to a server (Heroku, Vercel, Render, etc.) and set the environment variable `GEMINI_API_KEY` in the host's dashboard (do NOT commit the key).
- If using Vercel, set the environment variable in the Project Settings -> Environment Variables as `GEMINI_API_KEY` and deploy.

Security notes
- Never paste the key into any client-side file (HTML/JS). Only on the server (the `.env` or the hosting provider's secret store).
- Keep `.env` in `.gitignore` (already added).
