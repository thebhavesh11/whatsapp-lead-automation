require('dotenv').config();
const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
const { startFollowUpJob } = require('./src/jobs/followup.job');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        logger.info('Starting Bhavesh Khade IELTS Lead Automation...');
        await initializeDatabase();
        logger.info('✅ Database connected');
        startFollowUpJob();
        logger.info('✅ Follow-up scheduler started');
        app.listen(PORT, () => {
            logger.info(`✅ Server running on port ${PORT}`);
            logger.info('Webhooks ready:');
            logger.info(`  Facebook: POST /webhook/facebook`);
            logger.info(`  WhatsApp: POST /webhook/whatsapp`);
        });
    } catch (error) {
        logger.error('Failed to start:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => { logger.info('Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { logger.info('Shutting down...'); process.exit(0); });
process.on('uncaughtException', (e) => { logger.error('Uncaught:', e); process.exit(1); });
process.on('unhandledRejection', (r) => { logger.error('Unhandled:', r); process.exit(1); });

startServer();
