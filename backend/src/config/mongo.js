const mongoose = require('mongoose');
require('dotenv').config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công! Đã sẵn sàng hứng Chat Log.');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
    }
};

module.exports = connectMongo;
