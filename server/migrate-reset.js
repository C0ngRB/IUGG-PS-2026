require('dotenv').config();
const mysql = require('mysql2/promise');

const ALTER = `
ALTER TABLE users
  ADD COLUMN reset_code VARCHAR(6) NULL,
  ADD COLUMN reset_code_expires DATETIME NULL;
`;

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Adding reset_code columns...');
  try {
    await conn.query(ALTER);
    console.log('Columns added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping.');
    } else {
      throw err;
    }
  }
  await conn.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
