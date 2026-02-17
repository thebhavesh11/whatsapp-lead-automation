const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class AIService {
    async processMessage(lead, userMessage, conversationHistory) {
        try {
            const systemPrompt = this.buildSystemPrompt(lead);
            const messages = this.buildMessages(conversationHistory, userMessage);

            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: 0.7,
                max_tokens: 400
            });

            const aiMessage = completion.choices[0].message.content;
            const handover = this.checkHandover(userMessage);
            const extracted = this.extractInfo(conversationHistory, userMessage);

            logger.info('AI response generated', { leadId: lead.id, requiresHuman: handover.required });

            return { message: aiMessage, requiresHuman: handover.required, reason: handover.reason, extractedInfo: extracted };
        } catch (error) {
            logger.error('AI error:', error);
            return {
                message: 'Ek second ruko, main tumhe hamare team se connect karta hoon! 🙏',
                requiresHuman: true,
                reason: 'AI_ERROR'
            };
        }
    }

    buildSystemPrompt(lead) {
        return `You are a friendly admission assistant for Bhavesh Khade IELTS Academy.

STUDENT NAME: ${lead.name}

YOUR JOB:
- Help students who want to move to Canada and need IELTS coaching
- Qualify them by asking about their band score target, exam date, and budget
- Answer questions about the academy warmly and professionally
- Mix Hindi and English naturally (Hinglish) since most students are Indian

ACADEMY DETAILS:
- Name: Bhavesh Khade IELTS Academy
- Course Fee: ₹15,000 to ₹35,000
- Duration: 4 to 8 weeks
- Batch Timings: Morning 9AM-12PM, Evening 5PM-8PM, Weekend batches
- Batch Size: Only 8-12 students per batch (very personal attention)
- Covers: All 4 modules - Listening, Reading, Writing, Speaking
- Mock Tests: Every week
- Special: Canada PR visa guidance included
- Band Guarantee: We help students achieve 6.5+ for Canada PR

QUALIFICATION QUESTIONS (ask one at a time):
1. Canada ke liye kaunsa band score chahiye? (6.0, 6.5, 7.0, 7.5?)
2. Exam kab dene ka plan hai? (1 month, 2-3 months, 6 months?)
3. Abhi English level kaisi hai? (Beginner, intermediate, advanced?)
4. Investment ke liye ready hain? (₹15,000-₹35,000 range)

COMMON ANSWERS:
- Fees: ₹15,000 (basic) to ₹35,000 (premium with visa guidance)
- Canada PR needs: minimum 6.0, recommended 6.5+
- Classes: both online and offline available
- Demo class: FREE demo class available

HANDOVER TO HUMAN when:
- Student says "call me", "phone karo", "baat karni hai", "human", "real person"
- Student is angry or frustrated
- Student says "enroll karna hai", "join karna hai", "fee deni hai" (ready to pay)
- Student says "exam kal hai" or very urgent

STYLE:
- Warm and encouraging like a mentor
- Use emojis 1-2 per message
- Keep responses short (2-3 lines max)
- Always end with ONE question to keep conversation going
- Never be pushy - be helpful`;
    }

    buildMessages(history, currentMessage) {
        const messages = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message_text
        }));
        messages.push({ role: 'user', content: currentMessage });
        return messages;
    }

    checkHandover(message) {
        const lower = message.toLowerCase();

        const humanTriggers = ['call me', 'phone karo', 'baat karni', 'speak to', 'talk to', 'human', 'real person', 'teacher se', 'sir se'];
        if (humanTriggers.some(t => lower.includes(t))) return { required: true, reason: 'HUMAN_REQUEST' };

        const angerWords = ['fraud', 'fake', 'bakwaas', 'bekar', 'worst', 'angry', 'frustrated', 'gussa'];
        if (angerWords.some(t => lower.includes(t))) return { required: true, reason: 'ANGRY' };

        const paymentWords = ['fee deni hai', 'enroll karna', 'join karna', 'admission lena', 'pay now', 'register now'];
        if (paymentWords.some(t => lower.includes(t))) return { required: true, reason: 'PAYMENT_INTENT' };

        const urgentWords = ['exam kal', 'exam tomorrow', 'next week exam', 'exam in 2 days'];
        if (urgentWords.some(t => lower.includes(t))) return { required: true, reason: 'URGENT' };

        return { required: false, reason: null };
    }

    extractInfo(history, currentMessage) {
        const text = (history.map(m => m.message_text).join(' ') + ' ' + currentMessage).toLowerCase();
        const info = {};

        if (text.includes('canada')) info.country_goal = 'Canada';
        else if (text.includes('australia')) info.country_goal = 'Australia';
        else if (text.includes('uk') || text.includes('england')) info.country_goal = 'UK';

        const bandMatch = text.match(/(\d+\.?\d*)\s*(band|score)/);
        if (bandMatch && bandMatch[1] >= 4 && bandMatch[1] <= 9) info.target_band = bandMatch[1];

        if (text.includes('1 month') || text.includes('ek mahine') || text.includes('next month')) info.exam_timeline = '1_MONTH';
        else if (text.includes('2 month') || text.includes('3 month') || text.includes('do teen')) info.exam_timeline = '2_3_MONTHS';
        else if (text.includes('6 month') || text.includes('baad mein')) info.exam_timeline = '6_PLUS_MONTHS';

        if (text.includes('ready') || text.includes('pay') || text.includes('fee dene')) info.budget_level = 'CONFIRMED';
        else if (text.includes('sochna') || text.includes('not sure') || text.includes('pata nahi')) info.budget_level = 'UNCERTAIN';

        if (text.includes('urgent') || text.includes('jaldi') || text.includes('asap')) info.intent_level = 'HIGH';
        else if (text.includes('sirf dekh') || text.includes('just checking') || text.includes('shayad')) info.intent_level = 'LOW';

        return Object.keys(info).length > 0 ? info : null;
    }
}

module.exports = new AIService();
