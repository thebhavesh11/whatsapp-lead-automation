const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

class LeadService {
    async createLead(data) {
        const { name, phone, email, campaign_name, ad_name } = data;
        const res = await pool.query(
            `INSERT INTO leads (name, phone, email, campaign_name, ad_name, status)
             VALUES ($1,$2,$3,$4,$5,'NEW') RETURNING *`,
            [name, phone, email, campaign_name, ad_name]
        );
        return res.rows[0];
    }

    async findByPhone(phone) {
        const res = await pool.query('SELECT * FROM leads WHERE phone=$1', [phone]);
        return res.rows[0];
    }

    async findById(id) {
        const res = await pool.query('SELECT * FROM leads WHERE id=$1', [id]);
        return res.rows[0];
    }

    async updateLead(id, data) {
        const fields = [], values = [];
        let i = 1;
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined && k !== 'id') { fields.push(`${k}=$${i++}`); values.push(v); }
        }
        if (!fields.length) return null;
        values.push(id);
        const res = await pool.query(
            `UPDATE leads SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, values
        );
        return res.rows[0];
    }

    async updateLeadInfo(id, info) {
        const u = {};
        if (info.country_goal) u.country_goal = info.country_goal;
        if (info.target_band) u.target_band = parseFloat(info.target_band);
        if (info.exam_timeline) u.exam_timeline = info.exam_timeline;
        if (info.budget_level) u.budget_level = info.budget_level;
        if (info.intent_level) u.intent_level = info.intent_level;
        if (Object.keys(u).length) return this.updateLead(id, u);
    }

    async getLeadsForFollowUp() {
        const res = await pool.query(`
            SELECT * FROM leads
            WHERE status NOT IN ('INACTIVE','HUMAN_CONTROL')
            AND last_message_at IS NOT NULL
            AND last_message_at < NOW() - INTERVAL '2 hours'
            AND follow_up_count < 3
            ORDER BY last_message_at ASC`);
        return res.rows;
    }

    async getInactiveLeads() {
        const res = await pool.query(`
            SELECT * FROM leads
            WHERE status NOT IN ('INACTIVE','HUMAN_CONTROL')
            AND last_message_at < NOW() - INTERVAL '48 hours'
            AND follow_up_count >= 3`);
        return res.rows;
    }

    async getStats() {
        const res = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as new_leads_today,
                COUNT(*) FILTER (WHERE status='HOT') as hot_leads,
                COUNT(*) FILTER (WHERE status='WARM') as warm_leads,
                COUNT(*) FILTER (WHERE status='COLD') as cold_leads,
                COUNT(*) FILTER (WHERE status='HUMAN_CONTROL') as human_handovers,
                COUNT(*) FILTER (WHERE status='INACTIVE') as inactive,
                COUNT(*) FILTER (WHERE status NOT IN ('INACTIVE')) as total_active
            FROM leads`);
        return res.rows[0];
    }
}

module.exports = new LeadService();
