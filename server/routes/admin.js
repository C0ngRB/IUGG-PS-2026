const express = require('express');
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (req.query.search) {
      where.push('(full_name LIKE ? OR email LIKE ?)');
      const s = `%${req.query.search}%`;
      params.push(s, s);
    }
    if (req.query.type && ['student', 'regular'].includes(req.query.type)) {
      where.push('participant_type = ?');
      params.push(req.query.type);
    }
    if (req.query.payment && ['pending', 'paid'].includes(req.query.payment)) {
      where.push('payment_status = ?');
      params.push(req.query.payment);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT id, full_name, email, affiliation, participant_type,
              oral_presentation, job_title, role, payment_status, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, affiliation, mobile, participant_type,
              oral_presentation, job_title, role, payment_status, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ errors: ['User not found'] });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  }
});

module.exports = router;
