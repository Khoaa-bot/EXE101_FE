import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { testDbConnection } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// DB Connection Check Endpoint
app.get('/api/db-check', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 2 AS test_value, NOW() as current_time');
    res.json({
      success: true,
      message: 'Connected to Aiven MySQL successfully!',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  await testDbConnection();
});
