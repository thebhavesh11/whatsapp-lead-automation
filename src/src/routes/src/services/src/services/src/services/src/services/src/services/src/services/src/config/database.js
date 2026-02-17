const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20
});

async function initializeDatabase() {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connected');
}

async function query(text, params) {
    return pool.query(text, params);
}

module.exports = { pool, query, initializeDatabase };
