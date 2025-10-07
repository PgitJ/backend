const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'localhost:5000';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false}
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
