require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TO_EMAIL = 'akshaylanghani1@gmail.com';

function validEmail(e){ return typeof e==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validPhone(p){ if(typeof p!=='string') return false; const d=p.replace(/\D/g,''); return d.length>=7 && d.length<=15; }

app.post('/send', async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if(!name || !validEmail(email) || !validPhone(String(phone)) || !message){
    return res.status(400).json({ success:false, error: 'Invalid input' });
  }

  // create transporter from env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true') || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: TO_EMAIL,
    subject: `Website contact from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g,'<br/>')}</p>`
  };

  try{
    await transporter.sendMail(mailOptions);
    return res.json({ success:true });
  }catch(err){
    console.error('sendMail error', err);
    return res.status(500).json({ success:false, error: 'Failed to send' });
  }
});

app.listen(PORT, ()=>{
  console.log(`Email server listening on port ${PORT}`);
});
