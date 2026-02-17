const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
};
