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
