const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const leadService = require('./services/lead.service');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
    stream: { write: msg => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health'
}));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Bhavesh Khade IELTS Automation', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
    try {
        const stats = await leadService.getStats();
        res.json({ stats, uptime: process.uptime() });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

app.use('/webhook', routes);

app.get('/', (req, res) => {
    res.json({ service: 'Bhavesh Khade IELTS Lead Automation', status: 'running' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
