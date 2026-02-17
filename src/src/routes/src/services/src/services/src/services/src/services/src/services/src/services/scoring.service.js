const logger = require('../utils/logger');

class ScoringService {
    calculateScore(lead, history) {
        let score = 0;

        if (lead.exam_timeline === '1_MONTH') score += 20;
        else if (lead.exam_timeline === '2_3_MONTHS') score += 15;
        else if (lead.exam_timeline === '6_PLUS_MONTHS') score += 5;

        if (lead.budget_level === 'CONFIRMED') score += 15;
        else if (lead.budget_level === 'UNCERTAIN') score += 5;

        if (lead.target_band >= 7.5) score += 10;
        else if (lead.target_band >= 7.0) score += 8;
        else if (lead.target_band >= 6.5) score += 5;

        if (lead.country_goal === 'Canada') score += 10;
        else if (['Australia','UK'].includes(lead.country_goal)) score += 5;

        const userMsgs = history.filter(m => m.sender === 'user');
        if (userMsgs.length >= 5) score += 10;
        else if (userMsgs.length >= 3) score += 5;

        if (lead.intent_level === 'HIGH') score += 15;
        else if (lead.intent_level === 'LOW') score -= 10;

        if (!lead.country_goal && !lead.target_band && history.length > 4) score -= 10;

        const final = Math.max(0, Math.min(100, score));
        logger.info('Score calculated', { leadId: lead.id, score: final });
        return final;
    }

    getStatus(score) {
        if (score >= 60) return 'HOT';
        if (score >= 30) return 'WARM';
        return 'COLD';
    }
}

module.exports = new ScoringService();
