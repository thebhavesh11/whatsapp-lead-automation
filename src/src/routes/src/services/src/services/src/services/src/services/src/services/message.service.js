const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

class MessageService {
    async saveMessage(leadId, sender, messageText) {
        const res = await pool.query(
            `INSERT INTO messages (lead_id, sender, message_text) VALUES ($1,$2,$3) RETURNING *`,
            [leadId, sender, messageText]
        );
        return res.rows[0];
    }

    async getConversationHistory(leadId, limit = 20) {
        const res = await pool.query(
            `SELECT * FROM messages WHERE lead_id=$1 ORDER BY timestamp DESC LIMIT $2`,
            [leadId, limit]
        );
        return res.rows.reverse();
    }
}

module.exports = new MessageService();
