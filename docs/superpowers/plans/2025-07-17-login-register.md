# 登录/注册功能 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 IUGG-PS2026 会议网站增加完整的登录/注册系统，包含用户仪表盘、管理员后台和扫码付费页。

**架构：** 前端 SPA（静态 HTML/JS）+ Express API 后端 + JWT 认证 + 阿里云 RDS MySQL。

**技术栈：** Node.js, Express, mysql2, bcryptjs, jsonwebtoken, 纯前端 HTML/CSS/JS

---

### 任务 1：后端项目初始化

**文件：**
- 创建：`server/package.json`
- 创建：`server/.env.example`

- [ ] **步骤 1：创建 server/package.json**

```json
{
  "name": "iugg-ps2026-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js",
    "seed": "node seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.0"
  }
}
```

- [ ] **步骤 2：创建 server/.env.example**

```
DB_HOST=your-rds-host.aliyuncs.com
DB_PORT=3306
DB_USER=iugg2026
DB_PASSWORD=your-password
DB_NAME=iugg2026
JWT_SECRET=generate-a-random-secret-string
JWT_EXPIRES_IN=7d
PORT=3000
ADMIN_DEFAULT_PASSWORD=预设的管理员密码
```

- [ ] **步骤 3：安装依赖 + Commit**

```bash
cd server && npm install
cd ..
git add server/package.json server/package-lock.json server/.env.example
git commit -m "feat: init backend project with dependencies"
```

---

### 任务 2：数据库连接模块

**文件：**
- 创建：`server/db.js`

- [ ] **步骤 1：创建 server/db.js**

```javascript
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

- [ ] **步骤 2：Commit**

```bash
git add server/db.js
git commit -m "feat: add database connection pool"
```

---

### 任务 3：数据库 Schema 迁移脚本

**文件：**
- 创建：`server/migrate.js`

- [ ] **步骤 1：创建 server/migrate.js**

```javascript
require('dotenv').config();
const mysql = require('mysql2/promise');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  affiliation VARCHAR(300) NOT NULL,
  mobile VARCHAR(30) NOT NULL,
  participant_type ENUM('student','regular') NOT NULL,
  oral_presentation TINYINT(1) NOT NULL,
  job_title VARCHAR(100) NULL,
  role ENUM('user','admin') DEFAULT 'user',
  payment_status ENUM('pending','paid') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Running migration...');
  await conn.query(SCHEMA);
  console.log('Migration complete: users table created.');
  await conn.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
```

- [ ] **步骤 2：Commit**

```bash
git add server/migrate.js
git commit -m "feat: add database migration script"
```

---

### 任务 4：管理员种子脚本

**文件：**
- 创建：`server/seed.js`

- [ ] **步骤 1：创建 server/seed.js**

```javascript
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const ADMINS = [
  { email: 'jgyan@whu.edu.cn',    full_name: 'Jianguo Yan' },
  { email: 'denggaoqiu@whu.edu.cn', full_name: 'Denggao Qiu' },
  { email: 'miaodrb@whu.edu.cn',   full_name: 'DRB Miao' },
];

async function seed() {
  if (!process.env.ADMIN_DEFAULT_PASSWORD) {
    console.error('Set ADMIN_DEFAULT_PASSWORD in .env');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, 10);

  for (const admin of ADMINS) {
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [admin.email]);
    if (rows.length > 0) {
      console.log(`Admin already exists: ${admin.email}, skipping.`);
      continue;
    }
    await conn.query(
      `INSERT INTO users (full_name, email, password_hash, affiliation, mobile, participant_type, oral_presentation, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [admin.full_name, admin.email, passwordHash, 'IUGG-PS2026', '', 'regular', 0, 'admin']
    );
    console.log(`Admin created: ${admin.email}`);
  }

  await conn.end();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
```

- [ ] **步骤 2：Commit**

```bash
git add server/seed.js
git commit -m "feat: add admin seed script"
```

---

### 任务 5：Express 应用入口

**文件：**
- 创建：`server/index.js`

- [ ] **步骤 1：创建 server/index.js**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **步骤 2：Commit**

```bash
git add server/index.js
git commit -m "feat: add Express app entry point"
```

---

### 任务 6：JWT 认证中间件

**文件：**
- 创建：`server/middleware/auth.js`

- [ ] **步骤 1：创建 server/middleware/auth.js**

```javascript
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
```

- [ ] **步骤 2：Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: add JWT auth middleware"
```

---

### 任务 7：认证路由 (register / login / me)

**文件：**
- 创建：`server/routes/auth.js`

- [ ] **步骤 1：创建 server/routes/auth.js**

```javascript
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

    // Validation
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

    // Check duplicate email
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
```

- [ ] **步骤 2：Commit**

```bash
git add server/routes/auth.js
git commit -m "feat: add auth routes (register, login, me)"
```

---

### 任务 8：管理员路由

**文件：**
- 创建：`server/routes/admin.js`

- [ ] **步骤 1：创建 server/routes/admin.js**

```javascript
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
```

- [ ] **步骤 2：Commit**

```bash
git add server/routes/admin.js
git commit -m "feat: add admin routes (users list, user detail)"
```

---

### 任务 9：前端 CSS 扩展

**文件：**
- 修改：`css/styles.css`

- [ ] **步骤 1：在 styles.css 末尾追加样式**

在 `css/styles.css` 文件末尾追加以下内容（紧接现有最后一行之后）：

```css
/* =========================
   Auth / Dashboard / Admin styles
   ========================= */

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f8;
  padding: 40px 20px;
}

.auth-wrapper {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #d0d7e2;
  background: #f9fbfd;
}

.auth-tab {
  flex: 1;
  text-align: center;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7685;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-family: inherit;
}

.auth-tab.active {
  color: #0b2341;
  border-bottom-color: #ffb547;
  background: #fff;
}

.auth-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #12212f;
  margin-bottom: 4px;
}

.form-group label .required {
  color: #c00;
}

.form-group label .optional {
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d0d7e2;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  background: #fff;
  color: #1b2733;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ffb547;
  box-shadow: 0 0 0 3px rgba(255, 181, 71, 0.15);
}

.form-error {
  color: #c00;
  font-size: 12px;
  margin-top: 2px;
  min-height: 16px;
}

.form-errors {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #b91c1c;
  display: none;
}

.form-errors:not(:empty) {
  display: block;
}

.form-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.auth-link {
  text-align: center;
  margin-top: 14px;
  font-size: 13px;
  color: #6b7685;
}

.auth-link a {
  color: #0055aa;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}

/* Dashboard */
.dash-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #0b2341;
  color: #fff;
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
}

.dash-brand {
  font-size: 18px;
  font-weight: 700;
}

.dash-brand small {
  font-weight: 400;
  font-size: 12px;
  opacity: 0.75;
  display: block;
}

.dash-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.dash-content {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 20px;
}

.dash-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.dash-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #d0d7e2;
}

.dash-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #12212f;
  margin: 0 0 12px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e9f0;
}

.status-pill {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-ok {
  background: #d1fae5;
  color: #065f46;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.dash-info {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.65;
  margin-top: 8px;
}

.dash-info strong {
  color: #12212f;
}

.dash-action {
  margin-top: 12px;
}

.dash-action a {
  color: #0055aa;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.dash-action a:hover {
  text-decoration: underline;
}

/* Admin */
.adm-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #0b2341;
  color: #fff;
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
}

.adm-brand {
  font-size: 18px;
  font-weight: 700;
}

.adm-brand small {
  font-weight: 400;
  font-size: 12px;
  opacity: 0.75;
  display: block;
}

.adm-content {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 20px;
}

.adm-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
}

.adm-tab {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #d0d7e2;
  background: #fff;
  color: #6b7685;
  cursor: pointer;
  font-family: inherit;
}

.adm-tab:first-child {
  border-radius: 6px 0 0 6px;
}

.adm-tab:last-child {
  border-radius: 0 6px 6px 0;
}

.adm-tab.active {
  background: #0b2341;
  color: #fff;
  border-color: #0b2341;
}

.adm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  border: 1px solid #d0d7e2;
  border-bottom: none;
  flex-wrap: wrap;
  gap: 8px;
}

.adm-search {
  padding: 7px 12px;
  border: 1px solid #d0d7e2;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.adm-filter {
  padding: 7px 12px;
  border: 1px solid #d0d7e2;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
}

.adm-table-wrap {
  background: #fff;
  border: 1px solid #d0d7e2;
  border-radius: 0 0 8px 8px;
  overflow-x: auto;
}

.adm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.adm-table th {
  text-align: left;
  color: #6b7685;
  font-weight: 600;
  padding: 10px 14px;
  border-bottom: 1px solid #d0d7e2;
  font-size: 12px;
  text-transform: uppercase;
  background: #f9fbfd;
}

.adm-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f4fa;
  color: #374151;
}

.adm-table tr:hover td {
  background: #f9fbfd;
}

.adm-table .row-link {
  color: #0055aa;
  font-weight: 500;
  cursor: pointer;
}

.adm-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 12px;
  color: #6b7685;
}

.adm-pagination button {
  padding: 4px 12px;
  border: 1px solid #d0d7e2;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.adm-pagination button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Payment page */
.pay-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #0b2341;
  color: #fff;
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
}

.pay-content {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 20px;
}

.pay-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #d0d7e2;
  overflow: hidden;
}

.pay-card-header {
  background: linear-gradient(135deg, #0b2341, #243b64);
  color: #fff;
  padding: 24px;
  text-align: center;
}

.pay-card-header h3 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.pay-amount {
  font-size: 36px;
  font-weight: 700;
  margin-top: 8px;
  color: #ffb547;
}

.pay-amount small {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.85;
}

.pay-card-body {
  padding: 32px;
}

.pay-section {
  margin-bottom: 28px;
}

.pay-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #12212f;
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e9f0;
}

.pay-section p {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
  margin: 0;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: #f9fbfd;
  border: 1px solid #e5e9f0;
  border-radius: 10px;
  text-align: center;
}

.qr-placeholder img {
  max-width: 240px;
  border-radius: 8px;
}

.pay-note {
  background: #fef9e7;
  border-left: 3px solid #ffb547;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: #92400e;
  line-height: 1.6;
}

.pay-footer-actions {
  text-align: center;
  margin-top: 24px;
}

/* Buttons */
.btn-gold {
  display: inline-block;
  padding: 10px 28px;
  background: #ffb547;
  color: #12212f;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
}

.btn-gold:hover {
  background: #ff9f0f;
}

.btn-outline-sm {
  padding: 5px 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.btn-outline-sm:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-gold-sm {
  padding: 5px 14px;
  background: #ffb547;
  color: #12212f;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* Loading spinner */
.spinner {
  display: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}

.spinner.show {
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add css/styles.css
git commit -m "feat: add auth/dashboard/admin/payment CSS styles"
```

---

### 任务 10：前端认证 JS 模块

**文件：**
- 创建：`js/auth.js`

- [ ] **步骤 1：创建 js/auth.js**

```javascript
const API_BASE = 'http://localhost:3000/api';

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  clearToken() {
    localStorage.removeItem('token');
  },

  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const token = this.getToken();
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) {
      throw { status: res.status, ...data };
    }
    return data;
  },

  async register(fields) {
    const data = await this.request('POST', '/auth/register', fields);
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await this.request('POST', '/auth/login', { email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async fetchMe() {
    const data = await this.request('GET', '/auth/me');
    this.setUser(data.user);
    return data.user;
  },

  async updateMe(fields) {
    const data = await this.request('PUT', '/auth/me', fields);
    this.setUser(data.user);
    return data.user;
  },

  logout() {
    this.clearToken();
    this.clearUser();
    window.location.href = 'index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'auth.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },
};
```

- [ ] **步骤 2：Commit**

```bash
git add js/auth.js
git commit -m "feat: add frontend auth module"
```

---

### 任务 11：登录/注册页面

**文件：**
- 创建：`auth.html`

- [ ] **步骤 1：创建 auth.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Log In / Register — IUGG-PS2026</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
<div class="auth-page">
  <div class="auth-wrapper">
    <div class="auth-tabs">
      <button class="auth-tab active" id="tabLogin">Log In</button>
      <button class="auth-tab" id="tabRegister">Register</button>
    </div>

    <!-- Login Form -->
    <form class="auth-form" id="loginForm">
      <div class="form-errors" id="loginErrors"></div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="loginEmail" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="loginPassword" placeholder="Enter password" required>
      </div>
      <button type="submit" class="btn-gold" style="width:100%">Log In</button>
      <div class="auth-link">
        Don't have an account? <a href="#" id="goRegister">Register here</a>
      </div>
    </form>

    <!-- Register Form -->
    <form class="auth-form" id="registerForm" style="display:none;">
      <div class="form-errors" id="registerErrors"></div>
      <div class="form-group">
        <label><span class="required">*</span> Full Name</label>
        <input type="text" id="regFullName" placeholder="Your full name" required>
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Email</label>
        <input type="email" id="regEmail" placeholder="you@example.com" required>
        <div class="form-error" id="emailError"></div>
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Affiliation</label>
        <input type="text" id="regAffiliation" placeholder="Your institution / organization" required>
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Mobile Number</label>
        <input type="tel" id="regMobile" placeholder="+86 138xxxx" required>
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Participant Type</label>
        <select id="regParticipantType" required>
          <option value="">-- Please select --</option>
          <option value="student">Students 学生</option>
          <option value="regular">Regular Participants 在职人员</option>
        </select>
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Oral Presentation</label>
        <select id="regOral" required>
          <option value="">-- Please select --</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div class="form-group">
        <label>Job Title <span class="optional">(Chinese experts only 仅中国专家填写)</span></label>
        <input type="text" id="regJobTitle" placeholder="e.g. Professor">
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Password</label>
        <input type="password" id="regPassword" placeholder="At least 8 characters" required minlength="8">
      </div>
      <div class="form-group">
        <label><span class="required">*</span> Confirm Password</label>
        <input type="password" id="regConfirm" placeholder="Re-enter password" required minlength="8">
        <div class="form-error" id="confirmError"></div>
      </div>
      <button type="submit" class="btn-gold" style="width:100%">Create Account &amp; Proceed to Payment</button>
      <div class="auth-link">
        Already have an account? <a href="#" id="goLogin">Log in</a>
      </div>
    </form>
  </div>
</div>

<script src="js/auth.js"></script>
<script>
(function () {
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  var tabLogin = document.getElementById('tabLogin');
  var tabRegister = document.getElementById('tabRegister');

  function showLogin() {
    loginForm.style.display = '';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  }

  function showRegister() {
    loginForm.style.display = 'none';
    registerForm.style.display = '';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }

  tabLogin.addEventListener('click', function (e) { e.preventDefault(); showLogin(); });
  tabRegister.addEventListener('click', function (e) { e.preventDefault(); showRegister(); });
  document.getElementById('goRegister').addEventListener('click', function (e) { e.preventDefault(); showRegister(); });
  document.getElementById('goLogin').addEventListener('click', function (e) { e.preventDefault(); showLogin(); });

  // Already logged in? Redirect
  if (Auth.isLoggedIn()) {
    if (Auth.isAdmin()) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  // Email validation
  var regEmail = document.getElementById('regEmail');
  var emailError = document.getElementById('emailError');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  regEmail.addEventListener('input', function () {
    if (regEmail.value && !EMAIL_RE.test(regEmail.value)) {
      emailError.textContent = 'Please enter a valid email address';
    } else {
      emailError.textContent = '';
    }
  });

  // Confirm password validation
  var regPassword = document.getElementById('regPassword');
  var regConfirm = document.getElementById('regConfirm');
  var confirmError = document.getElementById('confirmError');
  function checkConfirm() {
    if (regConfirm.value && regConfirm.value !== regPassword.value) {
      confirmError.textContent = 'Passwords do not match';
    } else {
      confirmError.textContent = '';
    }
  }
  regPassword.addEventListener('input', checkConfirm);
  regConfirm.addEventListener('input', checkConfirm);

  // Login
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var errors = document.getElementById('loginErrors');
    errors.innerHTML = '';

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      errors.innerHTML = '<div>Please fill in all fields</div>';
      return;
    }

    try {
      await Auth.login(email, password);
      if (Auth.isAdmin()) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      var msgs = err.errors || ['Login failed'];
      errors.innerHTML = msgs.map(function (m) { return '<div>' + m + '</div>'; }).join('');
    }
  });

  // Register
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var errors = document.getElementById('registerErrors');
    errors.innerHTML = '';

    var fields = {
      full_name: document.getElementById('regFullName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      affiliation: document.getElementById('regAffiliation').value.trim(),
      mobile: document.getElementById('regMobile').value.trim(),
      participant_type: document.getElementById('regParticipantType').value,
      oral_presentation: document.getElementById('regOral').value,
      job_title: document.getElementById('regJobTitle').value.trim(),
      password: document.getElementById('regPassword').value,
      confirm_password: document.getElementById('regConfirm').value,
    };

    // Client-side validation
    var clientErrors = [];
    if (!fields.full_name) clientErrors.push('Full name is required');
    if (!fields.email || !EMAIL_RE.test(fields.email)) clientErrors.push('Valid email is required');
    if (!fields.affiliation) clientErrors.push('Affiliation is required');
    if (!fields.mobile) clientErrors.push('Mobile number is required');
    if (!fields.participant_type) clientErrors.push('Select your participant type');
    if (!fields.oral_presentation) clientErrors.push('Select whether you will give an oral presentation');
    if (fields.password.length < 8) clientErrors.push('Password must be at least 8 characters');
    if (fields.password !== fields.confirm_password) clientErrors.push('Passwords do not match');

    if (clientErrors.length > 0) {
      errors.innerHTML = clientErrors.map(function (m) { return '<div>' + m + '</div>'; }).join('');
      return;
    }

    try {
      await Auth.register(fields);
      window.location.href = 'payment.html';
    } catch (err) {
      var msgs = err.errors || ['Registration failed'];
      errors.innerHTML = msgs.map(function (m) { return '<div>' + m + '</div>'; }).join('');
    }
  });
})();
</script>
</body>
</html>
```

- [ ] **步骤 2：Commit**

```bash
git add auth.html
git commit -m "feat: add login/register page"
```

---

### 任务 12：用户仪表盘页面

**文件：**
- 创建：`dashboard.html`

- [ ] **步骤 1：创建 dashboard.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard — IUGG-PS2026</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body style="background:#f4f6f8;min-height:100vh;">
<div class="dash-topbar">
  <div class="dash-brand">IUGG-PS2026<small>Dashboard</small></div>
  <div class="dash-user-info" id="userInfo"></div>
</div>

<div class="dash-content" id="dashContent" style="display:none;">
  <div class="dash-cards">
    <div class="dash-card" id="regCard"></div>
    <div class="dash-card" id="payCard"></div>
  </div>
  <div class="dash-cards">
    <div class="dash-card" id="profileCard"></div>
  </div>
</div>

<div id="loading" style="text-align:center;padding:60px;color:#6b7685;">Loading...</div>

<script src="js/auth.js"></script>
<script>
(function () {
  if (!Auth.requireAuth()) return;

  var user = Auth.getUser();

  function render() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashContent').style.display = '';

    // Top bar
    document.getElementById('userInfo').innerHTML =
      '&#128100; ' + user.full_name + ' (' + user.email + ') ' +
      '<button class="btn-outline-sm" onclick="Auth.logout()">Log Out</button>';

    // Registration card
    var regCard = document.getElementById('regCard');
    regCard.innerHTML =
      '<h3>Registration Status</h3>' +
      '<span class="status-pill status-ok">Registered</span>' +
      '<div class="dash-info">' +
      '<strong>Type:</strong> ' + (user.participant_type === 'student' ? 'Student' : 'Regular Participant') +
      ' &nbsp;|&nbsp; <strong>Oral:</strong> ' + (user.oral_presentation ? 'Yes' : 'No') + '<br>' +
      '<strong>Registered:</strong> ' + (user.created_at ? user.created_at.substring(0, 10) : 'N/A') +
      '</div>';

    // Payment card
    var payStatus = user.payment_status === 'paid' ? 'status-ok' : 'status-pending';
    var payText = user.payment_status === 'paid' ? 'Paid' : 'Pending';
    var feeAmount = user.participant_type === 'student' ? '¥1,000' : '¥2,000';
    var payCard = document.getElementById('payCard');
    payCard.innerHTML =
      '<h3>Payment Status</h3>' +
      '<span class="status-pill ' + payStatus + '">' + payText + '</span>' +
      '<div class="dash-info">' +
      '<strong>Fee:</strong> ' + feeAmount + ' CNY &nbsp;|&nbsp; <strong>Deadline:</strong> 1 Aug 2026' +
      '</div>' +
      (user.payment_status !== 'paid'
        ? '<div class="dash-action"><a href="payment.html">→ Complete Payment</a></div>'
        : '');

    // Profile card
    var profileCard = document.getElementById('profileCard');
    profileCard.innerHTML =
      '<h3>Profile</h3>' +
      '<div class="dash-info">' +
      '<strong>Full Name:</strong> ' + user.full_name + '<br>' +
      '<strong>Email:</strong> ' + user.email + '<br>' +
      '<strong>Affiliation:</strong> ' + user.affiliation + '<br>' +
      '<strong>Mobile:</strong> ' + user.mobile + '<br>' +
      '<strong>Participant Type:</strong> ' + (user.participant_type === 'student' ? 'Student' : 'Regular Participant') + '<br>' +
      '<strong>Oral Presentation:</strong> ' + (user.oral_presentation ? 'Yes' : 'No') + '<br>' +
      (user.job_title ? '<strong>Job Title:</strong> ' + user.job_title + '<br>' : '') +
      '</div>';
  }

  // Fetch fresh user data from server
  Auth.fetchMe().then(function (u) {
    user = u;
    render();
  }).catch(function () {
    // Token might be expired
    Auth.logout();
  });
})();
</script>
</body>
</html>
```

- [ ] **步骤 2：Commit**

```bash
git add dashboard.html
git commit -m "feat: add user dashboard page"
```

---

### 任务 13：扫码付费页面

**文件：**
- 创建：`payment.html`

- [ ] **步骤 1：创建 payment.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment — IUGG-PS2026</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body style="background:#f4f6f8;min-height:100vh;">
<div class="pay-topbar">
  <div class="dash-brand">IUGG-PS2026<small>Payment</small></div>
  <div class="dash-user-info" id="userInfo"></div>
</div>

<div class="pay-content">
  <div class="pay-card">
    <div class="pay-card-header">
      <h3>Registration Fee</h3>
      <div class="pay-amount" id="feeAmount">¥2,000 <small>CNY</small></div>
    </div>
    <div class="pay-card-body">
      <div class="pay-section">
        <h4>Payment Instructions 付费说明</h4>
        <p>
          <em>[付费说明占位 — 待甲方提供内容]</em><br><br>
          Please scan the QR code below to complete your payment.
          After payment, we will verify and update your registration status within 1-2 business days.
        </p>
      </div>
      <div class="pay-section">
        <h4>Scan to Pay 扫码支付</h4>
        <div class="qr-placeholder">
          <img src="images/QR.jpg" alt="Payment QR Code" style="max-width:240px;">
        </div>
      </div>
      <div class="pay-note">
        &#9888; After completing payment, please keep your transaction record.
        Your status will update after manual verification.<br>
        支付完成后请保留交易凭证，我们将在 1-2 个工作日内确认并更新您的注册状态。
      </div>
    </div>
  </div>
  <div class="pay-footer-actions">
    <a href="dashboard.html" class="btn-gold">Go to Dashboard</a>
    <p style="font-size:12px;color:#9ca3af;margin-top:10px;">Or pay later from your dashboard</p>
  </div>
</div>

<script src="js/auth.js"></script>
<script>
(function () {
  if (!Auth.requireAuth()) return;

  var user = Auth.getUser();
  document.getElementById('userInfo').innerHTML =
    '&#128100; ' + user.full_name + ' (' + user.email + ') ' +
    '<button class="btn-outline-sm" onclick="Auth.logout()">Log Out</button>';

  // Set fee based on participant type
  var feeEl = document.getElementById('feeAmount');
  if (user.participant_type === 'student') {
    feeEl.innerHTML = '¥1,000 <small>CNY</small>';
  }
})();
</script>
</body>
</html>
```

- [ ] **步骤 2：Commit**

```bash
git add payment.html
git commit -m "feat: add payment page with QR code"
```

---

### 任务 14：管理员后台页面

**文件：**
- 创建：`admin.html`
- 创建：`js/admin.js`

- [ ] **步骤 1：创建 js/admin.js**

```javascript
const Admin = {
  async getUsers(params) {
    var qs = new URLSearchParams(params).toString();
    var res = await fetch(API_BASE + '/admin/users?' + qs, {
      headers: {
        'Authorization': 'Bearer ' + Auth.getToken(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      var data = await res.json();
      throw data;
    }
    return res.json();
  },

  async getUserDetail(id) {
    var res = await fetch(API_BASE + '/admin/users/' + id, {
      headers: {
        'Authorization': 'Bearer ' + Auth.getToken(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      var data = await res.json();
      throw data;
    }
    return res.json();
  },
};
```

- [ ] **步骤 2：创建 admin.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin — IUGG-PS2026</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body style="background:#f4f6f8;min-height:100vh;">
<div class="adm-topbar">
  <div class="adm-brand">IUGG-PS2026<small>Admin Panel</small></div>
  <div class="dash-user-info" id="userInfo"></div>
</div>

<div class="adm-content">
  <div class="adm-tabs">
    <button class="adm-tab active" data-tab="users">Users</button>
    <button class="adm-tab" data-tab="payments">Payments</button>
  </div>

  <!-- Users Tab -->
  <div id="tabUsers">
    <div class="adm-toolbar">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input class="adm-search" id="searchInput" placeholder="Search name / email...">
        <select class="adm-filter" id="filterType">
          <option value="">All Types</option>
          <option value="student">Students</option>
          <option value="regular">Regular</option>
        </select>
        <select class="adm-filter" id="filterPayment">
          <option value="">All Payment</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <button class="btn-gold-sm" onclick="exportCSV()">Export CSV</button>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Affiliation</th>
            <th>Type</th><th>Oral</th><th>Payment</th><th>Registered</th>
          </tr>
        </thead>
        <tbody id="userTableBody"></tbody>
      </table>
      <div class="adm-pagination" id="pagination"></div>
    </div>
  </div>

  <!-- Payments Tab -->
  <div id="tabPayments" style="display:none;">
    <div style="background:#fff;padding:40px;border-radius:8px;border:1px solid #d0d7e2;text-align:center;color:#6b7685;">
      Payments management coming soon.
    </div>
  </div>
</div>

<script src="js/auth.js"></script>
<script src="js/admin.js"></script>
<script>
(function () {
  if (!Admin || !Auth.requireAdmin()) return;

  var currentPage = 1;
  var allUsers = [];

  var user = Auth.getUser();
  document.getElementById('userInfo').innerHTML =
    '&#128100; Admin (' + user.email + ') ' +
    '<button class="btn-outline-sm" onclick="Auth.logout()">Log Out</button>';

  // Tab switching
  document.querySelectorAll('.adm-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.adm-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var tabId = tab.getAttribute('data-tab');
      document.getElementById('tabUsers').style.display = tabId === 'users' ? '' : 'none';
      document.getElementById('tabPayments').style.display = tabId === 'payments' ? '' : 'none';
    });
  });

  function renderTable(users) {
    var tbody = document.getElementById('userTableBody');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af;">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(function (u) {
      var typeLabel = u.participant_type === 'student' ? 'Student' : 'Regular';
      var payClass = u.payment_status === 'paid' ? 'status-ok' : 'status-pending';
      var payText = u.payment_status === 'paid' ? 'Paid' : 'Pending';
      var oralText = u.oral_presentation ? 'Yes' : 'No';
      var created = u.created_at ? u.created_at.substring(0, 10) : '';
      return '<tr>' +
        '<td class="row-link" onclick="showUserDetail(' + u.id + ')">' + u.full_name + '</td>' +
        '<td>' + u.email + '</td>' +
        '<td>' + (u.affiliation || '') + '</td>' +
        '<td>' + typeLabel + '</td>' +
        '<td>' + oralText + '</td>' +
        '<td><span class="status-pill ' + payClass + '">' + payText + '</span></td>' +
        '<td>' + created + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderPagination(pagination) {
    var el = document.getElementById('pagination');
    var from = (pagination.page - 1) * pagination.limit + 1;
    var to = Math.min(pagination.page * pagination.limit, pagination.total);
    el.innerHTML =
      '<span>Showing ' + from + '-' + to + ' of ' + pagination.total + ' users</span>' +
      '<div style="display:flex;gap:6px;">' +
      '<button ' + (pagination.page <= 1 ? 'disabled' : '') + ' onclick="goPage(' + (pagination.page - 1) + ')">&larr; Prev</button>' +
      '<button ' + (pagination.page >= pagination.pages ? 'disabled' : '') + ' onclick="goPage(' + (pagination.page + 1) + ')">Next &rarr;</button>' +
      '</div>';
  }

  async function loadUsers() {
    var params = { page: currentPage, limit: 20 };
    var search = document.getElementById('searchInput').value.trim();
    var type = document.getElementById('filterType').value;
    var payment = document.getElementById('filterPayment').value;
    if (search) params.search = search;
    if (type) params.type = type;
    if (payment) params.payment = payment;

    try {
      var data = await Admin.getUsers(params);
      allUsers = data.users;
      renderTable(data.users);
      renderPagination(data.pagination);
    } catch (err) {
      document.getElementById('userTableBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:40px;color:#c00;">Failed to load users</td></tr>';
    }
  }

  window.goPage = function (page) {
    currentPage = page;
    loadUsers();
  };

  window.showUserDetail = async function (id) {
    try {
      var data = await Admin.getUserDetail(id);
      var u = data.user;
      alert(
        'Name: ' + u.full_name + '\n' +
        'Email: ' + u.email + '\n' +
        'Affiliation: ' + u.affiliation + '\n' +
        'Mobile: ' + u.mobile + '\n' +
        'Type: ' + u.participant_type + '\n' +
        'Oral: ' + (u.oral_presentation ? 'Yes' : 'No') + '\n' +
        'Job Title: ' + (u.job_title || 'N/A') + '\n' +
        'Payment: ' + u.payment_status + '\n' +
        'Registered: ' + (u.created_at ? u.created_at.substring(0, 10) : '')
      );
    } catch (err) {
      alert('Failed to load user details.');
    }
  };

  window.exportCSV = function () {
    if (allUsers.length === 0) return;
    var header = 'Name,Email,Affiliation,Type,Oral,Payment,Registered';
    var rows = allUsers.map(function (u) {
      return [
        '"' + u.full_name + '"',
        u.email,
        '"' + (u.affiliation || '') + '"',
        u.participant_type,
        u.oral_presentation ? 'Yes' : 'No',
        u.payment_status,
        u.created_at ? u.created_at.substring(0, 10) : '',
      ].join(',');
    });
    var csv = header + '\n' + rows.join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'iugg2026_users.csv';
    a.click();
  };

  // Debounced search
  var searchTimer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { currentPage = 1; loadUsers(); }, 300);
  });
  document.getElementById('filterType').addEventListener('change', function () { currentPage = 1; loadUsers(); });
  document.getElementById('filterPayment').addEventListener('change', function () { currentPage = 1; loadUsers(); });

  loadUsers();
})();
</script>
</body>
</html>
```

- [ ] **步骤 3：Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: add admin panel page"
```

---

### 任务 15：主页导航集成 — 增加 Log in / Register 入口

**文件：**
- 修改：`index.html`

- [ ] **步骤 1：在桌面端导航末尾增加登录链接**

在 `index.html` 中找到 `.nav-desktop` 的最后一个 `<a>` 标签（Sponsors），在它之后添加：

```html
<a href="auth.html" class="nav-link" id="navAuth">Log in / Register</a>
```

同时修改 Sponsors 链接的 href（当前指向 `#committees`）：

```
将 <a href="#committees" class="nav-link">Sponsors</a>
改为 <a href="#sponsors" class="nav-link">Sponsors</a>
```

- [ ] **步骤 2：在移动端抽屉导航同样增加**

找到 `.nav-drawer` 中对应的位置，同样添加：

```html
<a href="auth.html" class="nav-link" id="navAuthMobile">Log in / Register</a>
```

- [ ] **步骤 3：在 index.html 引入 auth.js 并根据登录状态更新导航**

在 `index.html` 底部的 `</body>` 前，`<script src="script.js"></script>` 之后添加：

```html
<script src="js/auth.js"></script>
<script>
(function () {
  if (Auth.isLoggedIn()) {
    var user = Auth.getUser();
    var label = user.role === 'admin' ? 'Admin' : 'Dashboard';
    var href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';

    var navAuth = document.getElementById('navAuth');
    if (navAuth) {
      navAuth.textContent = label;
      navAuth.href = href;
      navAuth.title = user.email;
    }
    var navAuthMobile = document.getElementById('navAuthMobile');
    if (navAuthMobile) {
      navAuthMobile.textContent = label;
      navAuthMobile.href = href;
    }
  }
})();
</script>
```

- [ ] **步骤 4：Commit**

```bash
git add index.html
git commit -m "feat: add Log in / Register nav link to homepage"
```

---

### 任务 16：项目文档更新 + 最终检查

**文件：**
- 修改：`README.md`
- 创建：`server/README.md`

- [ ] **步骤 1：更新 README.md**

```markdown
# IUGG-PS2026 会议官网

2nd IUGG Symposium on Planetary Sciences 官方网站。

## 项目结构

- `index.html` — 主页
- `auth.html` — 登录/注册
- `dashboard.html` — 用户仪表盘
- `payment.html` — 扫码付费
- `admin.html` — 管理员后台
- `css/styles.css` — 样式
- `js/auth.js` — 认证模块
- `js/admin.js` — 管理模块
- `server/` — Express 后端

## 部署

### 前端

静态文件直接部署到 Web 服务器（Nginx/Apache），`css/`、`js/`、`images/` 和 HTML 文件放到同一目录。

### 后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填写阿里云 RDS 连接信息和 JWT_SECRET
npm install
node migrate.js     # 创建数据库表
node seed.js        # 创建管理员账号
npm start           # 启动 API 服务 (默认 3000 端口)
```

### 配置前端 API 地址

编辑 `js/auth.js` 中的 `API_BASE` 变量，改为后端实际部署地址。
```

- [ ] **步骤 2：Commit**

```bash
git add README.md
git commit -m "docs: update README with project structure and deployment guide"
```

---

### 任务 17：最终验证

- [ ] **步骤 1：确认所有文件存在**

```bash
git status
# 应包含以下新增文件：
# auth.html, dashboard.html, payment.html, admin.html
# js/auth.js, js/admin.js
# server/package.json, server/.env.example, server/index.js
# server/db.js, server/migrate.js, server/seed.js
# server/middleware/auth.js
# server/routes/auth.js, server/routes/admin.js
# images/QR.jpg
# docs/superpowers/specs/2025-07-17-login-register-design.md
# 修改：css/styles.css, index.html, README.md, .gitignore
```

- [ ] **步骤 2：确认 CSS 和 JS 引用路径正确**

各 HTML 文件中的 CSS/JS 引用确认：
- `auth.html` → `css/styles.css`, `js/auth.js`
- `dashboard.html` → `css/styles.css`, `js/auth.js`
- `payment.html` → `css/styles.css`, `js/auth.js`
- `admin.html` → `css/styles.css`, `js/auth.js`, `js/admin.js`
- `index.html` → `css/styles.css`, `script.js`, `js/auth.js`

- [ ] **步骤 3：Commit 最终检查**

```bash
git add -A
git status
git diff --staged --stat
git commit -m "chore: final verification and cleanup"
```
