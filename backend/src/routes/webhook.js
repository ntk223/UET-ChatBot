const express = require('express');
const { handleWebhook } = require('../services/chatbotService');

const router = express.Router();

/**
 * POST /webhook
 * Xử lý tin nhắn từ user
 *
 * Body:
 * - sender_id: ID của user
 * - message_text: Nội dung tin nhắn (tùy chọn)
 * - payload_value: Giá trị payload từ button (tùy chọn)
 */
router.post('/webhook', async (req, res) => {
    try {
        const { sender_id, message_text, payload_value } = req.body;

        const response = await handleWebhook(sender_id, message_text, payload_value);
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
