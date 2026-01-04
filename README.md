# Contact form email server

This workspace contains a small static website and a minimal Node.js server to forward contact form submissions to email.

Quick start

1. Copy `.env.example` to `.env` and set your SMTP credentials.

2. Install dependencies and start the server:

```bash
cd "c:/Users/aksha/OneDrive/Desktop/web project/website"
npm install
npm start
```

3. Serve the static files (e.g., open `contact.html` in a browser) and ensure the form POSTs to the running server (default `http://localhost:3000/send`).

Testing via curl

```bash
curl -X POST http://localhost:3000/send -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","phone":"1234567890","message":"Hello"}'
```

Security notes

- Keep SMTP credentials secret; do not commit `.env` to version control.
- This server is minimal; consider adding rate-limiting, CAPTCHA, and stronger validation in production.
