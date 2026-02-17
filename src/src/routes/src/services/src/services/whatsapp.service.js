const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.baseUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
        this.headers = {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        };
    }

    async sendMessage(to, message) {
        try {
            const res = await axios.post(`${this.baseUrl}/messages`, {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: message }
            }, { headers: this.headers });
            logger.info('WhatsApp sent', { to, id: res.data.messages[0].id });
            return res.data;
        } catch (error) {
            logger.error('WhatsApp send failed', { to, error: error.response?.data || error.message });
            throw error;
        }
    }

    async sendInitialMessage(lead) {
        const message = `Namaste ${lead.name}! 🙏

Bhavesh Khade IELTS Academy mein aapka swagat hai! 

Main aapka AI assistant hoon aur Canada ke liye aapki IELTS journey mein help karunga.

Batao - Canada ke liye aapko kitna band score chahiye? 🎯`;
        return this.sendMessage(lead.phone, message);
    }

    async sendFollowUp(lead, count) {
        let message;
        if (count === 1) {
            message = `Hi ${lead.name}! 👋

Aap busy honge, koi baat nahi! 

Jab bhi time mile, batao - Canada ke liye IELTS ki preparation kab se start karni hai? 

Hum FREE demo class bhi dete hain! 😊`;
        } else if (count === 2) {
            message = `${lead.name} ji, 

Bas ek baar baat karein - Canada PR ke liye sahi band score aur preparation ke baare mein! 

Kya aaj 5 minute ka time hai? 📞`;
        } else {
            message = `${lead.name} ji,

Bhavesh Khade IELTS Academy ki taraf se last message. 

Canada ka sapna zaroor poora hoga! Jab bhi ready ho, hum yahaan hain. 🇨🇦

All the best! ⭐`;
        }
        return this.sendMessage(lead.phone, message);
    }

    async markAsRead(messageId) {
        try {
            await axios.post(`${this.baseUrl}/messages`, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            }, { headers: this.headers });
        } catch (e) {
            logger.error('Mark read failed:', e.message);
        }
    }
}

module.exports = new WhatsAppService();
