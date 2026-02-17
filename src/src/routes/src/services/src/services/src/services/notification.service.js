const logger = require('../utils/logger');

class NotificationService {
    async sendHotLeadAlert(lead) {
        const whatsappService = require('./whatsapp.service');
        const alertNumber = process.env.ALERT_WHATSAPP_NUMBER;
        if (!alertNumber) return;

        const message = `🔥 HOT LEAD - Bhavesh Khade IELTS

👤 Name: ${lead.name}
📱 Phone: +${lead.phone}
📧 Email: ${lead.email || 'N/A'}

🎯 Score: ${lead.score}/100
📊 Status: ${lead.status}

Details:
🌍 Country: ${lead.country_goal || 'Not asked yet'}
📈 Target Band: ${lead.target_band || 'Not asked yet'}
⏰ Timeline: ${lead.exam_timeline || 'Not asked yet'}
💰 Budget: ${lead.budget_level || 'Not asked yet'}

📣 Campaign: ${lead.campaign_name || 'Direct'}

⚡ ABHI CALL KARO - HOT LEAD HAI!`;

        try {
            await whatsappService.sendMessage(alertNumber, message);
            logger.info('Hot lead alert sent', { leadId: lead.id });
        } catch (e) {
            logger.error('Alert failed:', e.message);
        }
    }

    async sendHumanHandoverAlert(lead, reason) {
        const whatsappService = require('./whatsapp.service');
        const alertNumber = process.env.ALERT_WHATSAPP_NUMBER;
        if (!alertNumber) return;

        const reasons = {
            'HUMAN_REQUEST': '👤 Student ne human se baat maangi',
            'ANGRY': '😠 Student frustrated/angry lag raha hai',
            'PAYMENT_INTENT': '💰 Student fee dene ke liye ready hai!',
            'URGENT': '⚡ Exam bahut jaldi hai',
            'AI_ERROR': '🤖 AI error hua'
        };

        const message = `👤 HUMAN HANDOVER - Bhavesh Khade IELTS

Name: ${lead.name}
Phone: +${lead.phone}

Reason: ${reasons[reason] || reason}
Score: ${lead.score}/100

⚠️ AI band ho gaya. Aap directly contact karo!`;

        try {
            await whatsappService.sendMessage(alertNumber, message);
            logger.info('Handover alert sent', { leadId: lead.id });
        } catch (e) {
            logger.error('Handover alert failed:', e.message);
        }
    }

    async sendDailySummary(stats) {
        const whatsappService = require('./whatsapp.service');
        const alertNumber = process.env.ALERT_WHATSAPP_NUMBER;
        if (!alertNumber) return;

        const message = `📊 DAILY REPORT - Bhavesh Khade IELTS
${new Date().toLocaleDateString('en-IN')}

🆕 Aaj ke leads: ${stats.new_leads_today}
🔥 Hot leads: ${stats.hot_leads}
🟡 Warm leads: ${stats.warm_leads}
🔵 Cold leads: ${stats.cold_leads}

👤 Human handovers: ${stats.human_handovers}
😴 Inactive: ${stats.inactive}
📱 Total active: ${stats.total_active}

Good night! 🌙`;

        try {
            await whatsappService.sendMessage(alertNumber, message);
        } catch (e) {
            logger.error('Daily summary failed:', e.message);
        }
    }
}

module.exports = new NotificationService();
