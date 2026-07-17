const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
