const axios = require('axios');

// Địa chỉ mặc định của Rasa NLU Server khi chạy local
const RASA_API_URL = process.env.RASA_URL || 'http://localhost:5005/model/parse';

const analyzeText = async (text, senderId) => {
    try {
        const response = await axios.post(RASA_API_URL, {
            text: text,
            message_id: senderId // Chuyền ID vào để Rasa biết ai đang chat (tuỳ chọn)
        });

        const { intent, entities, intent_ranking } = response.data;

        console.log(`🧠 [Rasa NLU] Đoán Intent: "${intent.name}" với độ tự tin: ${(intent.confidence * 100).toFixed(2)}%`);

        return {
            intentName: intent.name,
            confidence: intent.confidence,
            entities: entities
        };
    } catch (error) {
        console.error('❌ Lỗi kết nối đến Rasa Server:', error.message);
        return null;
    }
};

module.exports = {
    analyzeText
};