const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendVerificationCode(email, code) {
  const t = getTransporter();

  if (!t) {
    console.log('=== PASSWORD RESET CODE (SMTP not configured) ===');
    console.log('Email: ' + email);
    console.log('Code:  ' + code);
    console.log('=================================================');
    return;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'IUGG-PS2026 - Password Reset Code',
    text: 'Your password reset verification code is: ' + code + '\n\nThis code is valid for 10 minutes.\n\nIUGG-PS2026',
    html:
      '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">' +
      '<h2 style="color:#0b2341;">IUGG-PS2026</h2>' +
      '<p>Your password reset verification code is:</p>' +
      '<div style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0b2341;padding:16px;background:#f4f6f8;border-radius:8px;text-align:center;">' +
      code +
      '</div>' +
      '<p style="color:#6b7685;font-size:13px;">This code is valid for 10 minutes.</p>' +
      '<p style="color:#6b7685;font-size:13px;">If you did not request this, please ignore this email.</p>' +
      '</div>',
  });
}

module.exports = { sendVerificationCode };
