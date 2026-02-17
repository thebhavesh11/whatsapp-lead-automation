const express = require('express');
const facebookController = require('../controllers/facebookWebhook.controller');
const whatsappController = require('../controllers/whatsappWebhook.controller');

const router = express.Router();

router.get('/facebook', facebookController.verify);
router.post('/facebook', facebookController.handleLead);

router.get('/whatsapp', whatsappController.verify);
router.post('/whatsapp', whatsappController.handleMessage);

module.exports = router;
