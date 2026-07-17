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
