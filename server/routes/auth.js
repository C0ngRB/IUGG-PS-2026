const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const { sendVerificationCode } = require('../email');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      full_name, email, password, confirm_password,
      affiliation, mobile, participant_type, oral_presentation, job_title,
    } = req.body;

    const errors = [];
    if (!full_name || !full_name.trim()) errors.push('Full name is required');
    if (!email || !EMAIL_RE.test(email)) errors.push('Valid email is required');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
    if (password !== confirm_password) errors.push('Passwords do not match');
    if (!affiliation || !affiliation.trim()) errors.push('Affiliation is required');
    if (!mobile || !mobile.trim()) errors.push('Mobile number is required');
    if (!['student', 'regular'].includes(participant_type)) errors.push('Participant type is required');
    if (oral_presentation === undefined || oral_presentation === null || oral_presentation === '') {
      errors.push('Oral presentation selection is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ errors: ['Email already registered'] });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const oral = typeof oral_presentation === 'string'
      ? (oral_presentation === 'yes' || oral_presentation === 'Yes' ? 1 : 0)
      : (oral_presentation ? 1 : 0);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, affiliation, mobile,
        participant_type, oral_presentation, job_title)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), email.toLowerCase().trim(), passwordHash, affiliation.trim(),
       mobile.trim(), participant_type, oral, job_title ? job_title.trim() : null]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ errors: ['Email and password are required'] });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ errors: ['Invalid email or password'] });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ errors: ['User not found'] });
    }
    res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const { full_name, affiliation, mobile, job_title } = req.body;
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (affiliation !== undefined) updates.affiliation = affiliation.trim();
    if (mobile !== undefined) updates.mobile = mobile.trim();
    if (job_title !== undefined) updates.job_title = job_title ? job_title.trim() : null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ errors: ['No fields to update'] });
    }

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(req.user.id);

    await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    const errors = [];
    if (!current_password) errors.push('Current password is required');
    if (!new_password || new_password.length < 8) errors.push('New password must be at least 8 characters');
    if (new_password !== confirm_password) errors.push('Passwords do not match');

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ errors: ['User not found'] });
    }

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ errors: ['Current password is incorrect'] });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ errors: ['Email is required'] });
    }

    const [rows] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    // Always return success to prevent email enumeration
    if (rows.length === 0) {
      return res.json({ message: 'If the email exists, a verification code has been sent.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE id = ?', [code, expires, rows[0].id]);

    await sendVerificationCode(email, code);

    res.json({ message: 'If the email exists, a verification code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, new_password, confirm_password } = req.body;

    const errors = [];
    if (!email) errors.push('Email is required');
    if (!code || code.length !== 6) errors.push('Valid 6-digit code is required');
    if (!new_password || new_password.length < 8) errors.push('New password must be at least 8 characters');
    if (new_password !== confirm_password) errors.push('Passwords do not match');

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const [rows] = await pool.query(
      'SELECT id, reset_code, reset_code_expires FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ errors: ['Invalid or expired verification code'] });
    }

    const user = rows[0];
    if (!user.reset_code || user.reset_code !== code || new Date() > new Date(user.reset_code_expires)) {
      return res.status(400).json({ errors: ['Invalid or expired verification code'] });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?',
      [hash, user.id]
    );

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

module.exports = router;
