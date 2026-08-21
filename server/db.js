import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for Aiven MySQL Database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'exe101-be-db-devminhprogram-swp391-77b3.l.aivencloud.com',
  port: Number(process.env.DB_PORT) || 16921,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_DM1lVEFhIY5tlMBjQYj',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to Aiven MySQL database successfully!');
    const [rows] = await connection.query('SELECT 1 + 2 AS three');
    console.log('Test query output:', rows);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
}

export default pool;
