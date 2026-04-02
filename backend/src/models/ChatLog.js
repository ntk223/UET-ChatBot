const mongoose = require('mongoose');

const ChatLogSchema = new mongoose.Schema({
    platform_user_id: { type: String, required: true, index: true },
    sender_type: { type: String, enum: ['USER', 'BOT'], required: true },
    
    // Lưu nội dung người dùng gõ
    message_text: { type: String },
    
    // Lưu các nút bấm nếu người dùng tương tác qua nút
    payload_value: { type: String },
    
    // --- Phần thống kê AI ---
    intent_detected: { type: String }, // Ý định nhận diện được
    is_fallback: { type: Boolean, default: false } // Đánh dấu true nếu bot không hiểu
}, { 
    timestamps: true // Tự động tạo trường createdAt và updatedAt
});

module.exports = mongoose.model('ChatLog', ChatLogSchema);
