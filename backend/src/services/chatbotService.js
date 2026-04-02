const { Node, Option, UserSession } = require('../models');
const ChatLog = require('../models/ChatLog');
const { analyzeText } = require('./rasaService');

const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Phân tích intent từ tin nhắn tự do
 */
async function detectIntent(messageText, senderId, shouldSkip) {
    if (shouldSkip || !messageText || messageText === 'Bắt đầu') {
        return null;
    }

    const rasaResult = await analyzeText(messageText, senderId);

    if (!rasaResult) return null;

    // Áp dụng ngưỡng tự tin (Confidence Threshold)
    if (rasaResult.confidence >= CONFIDENCE_THRESHOLD) {
        return rasaResult.intentName;
    }

    console.log('⚠️ Rasa intent tự tin quá thấp. Đẩy vào Fallback.');
    return 'intent_unknown';
}

/**
 * Lưu tin nhắn vào MongoDB (non-blocking)
 */
function logChatMessage(senderId, senderType, messageText, extraData = {}) {
    ChatLog.create({
        platform_user_id: senderId,
        sender_type: senderType,
        message_text: messageText || '',
        payload_value: extraData.payload_value || '',
        intent_detected: extraData.intent_detected || 'unknown',
        is_fallback: extraData.is_fallback || false
    }).catch(err => console.error(`❌ Failed to save ${senderType} log:`, err));
}

/**
 * Lấy Session hiện tại, tạo mới nếu chưa tồn tại
 */
async function getOrCreateSession(senderId) {
    const [session] = await UserSession.findOrCreate({
        where: { platform_user_id: senderId },
        defaults: { current_node_id: null }
    });
    return session;
}

/**
 * Xác định Node tiếp theo dựa trên State Machine logic
 */
async function getNextNode(session, messageText, intentName, payloadValue) {
    let nextNodeId = null;
    let isFallbackTriggered = false;

    // Nếu session mới hoặc user nhấn "Bắt đầu"
    if (!session.current_node_id || messageText === 'Bắt đầu') {
        const welcomeNode = await Node.findOne({ where: { node_name: 'UET_Welcome' } });
        nextNodeId = welcomeNode.id;
    } else {
        // Tìm Option phù hợp
        const optionQuery = { node_id: session.current_node_id };
        if (payloadValue) {
            optionQuery.payload_value = payloadValue;
        } else if (intentName) {
            optionQuery.intent_match = intentName;
        }

        const matchedOption = await Option.findOne({ where: optionQuery });

        if (matchedOption) {
            nextNodeId = matchedOption.next_node_id;
        } else {
            // Fallback nếu không tìm thấy Option phù hợp
            const fallbackNode = await Node.findOne({ where: { is_fallback: true } });
            nextNodeId = fallbackNode.id;
            isFallbackTriggered = true;
        }
    }

    return { nextNodeId, isFallbackTriggered };
}

/**
 * Lấy nội dung Bot và các tùy chọn
 */
async function getBotResponse(nodeId) {
    const botNode = await Node.findByPk(nodeId);
    const botOptions = await Option.findAll({
        where: { node_id: nodeId },
        attributes: ['button_text', 'payload_value']
    });

    return {
        bot_says: botNode.content.text,
        buttons: botOptions.map(opt => ({
            title: opt.button_text,
            payload: opt.payload_value
        }))
    };
}

/**
 * Xử lý Webhook chính
 */
async function handleWebhook(senderId, messageText, payloadValue) {
    try {
        // Phát hiện intent từ tin nhắn tự do
        const intentName = await detectIntent(messageText, senderId, !!payloadValue);

        // Lưu log của user (non-blocking)
        logChatMessage(senderId, 'USER', messageText, {
            payload_value: payloadValue,
            intent_detected: intentName
        });

        // Lấy hoặc tạo session
        const session = await getOrCreateSession(senderId);

        // Xác định Node tiếp theo
        const { nextNodeId, isFallbackTriggered } = await getNextNode(
            session,
            messageText,
            intentName,
            payloadValue
        );

        // Cập nhật vị trí Session
        session.current_node_id = nextNodeId;
        await session.save();

        // Lấy phản hồi của Bot
        const botResponse = await getBotResponse(nextNodeId);

        // Lưu log của bot (non-blocking)
        logChatMessage(senderId, 'BOT', botResponse.bot_says, {
            is_fallback: isFallbackTriggered
        });

        return botResponse;
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        throw error;
    }
}

module.exports = {
    handleWebhook,
    logChatMessage,
    detectIntent
};
