const { sequelize, Node, Option } = require('../models');

async function runSeed() {
    try {
        console.log('⏳ Đang kết nối Database và Reset bảng...');
        // CẢNH BÁO: force: true sẽ DROP toàn bộ bảng cũ và tạo lại bảng mới. 
        // Chỉ dùng lệnh này trong môi trường Dev!
        await sequelize.sync({ force: true }); 

        console.log('🌱 Bắt đầu bơm dữ liệu (Seeding)...');

        // ==========================================
        // 1. TẠO CÁC ĐỈNH (NODES) - LỜI THOẠI CỦA BOT
        // ==========================================
        const nodeWelcome = await Node.create({
            node_name: 'UET_Welcome',
            content: { 
                text: "Chào mừng bạn đến với kênh tư vấn tuyển sinh Đại học Công nghệ (UET)! Bạn đang quan tâm đến thông tin gì?" 
            }
        });

        const nodeDiemIT = await Node.create({
            node_name: 'UET_Diem_CNTT',
            content: { 
                text: "Năm 2025, điểm chuẩn dự kiến ngành Khoa học Máy tính (IT1) là 28.1 điểm, ngành Mạng máy tính và Truyền thông dữ liệu (IT2) là 27.5 điểm." 
            }
        });

        const nodeHocPhi = await Node.create({
            node_name: 'UET_Hoc_Phi',
            content: { 
                text: "Học phí dự kiến của UET dao động từ 35 - 40 triệu VNĐ/năm tùy thuộc vào chương trình đào tạo chuẩn hay chất lượng cao." 
            }
        });

        const nodeFallback = await Node.create({
            node_name: 'UET_Fallback',
            is_fallback: true,
            content: { 
                text: "Xin lỗi, mình chưa hiểu ý bạn lắm. Bạn vui lòng chọn các thông tin bên dưới hoặc đặt câu hỏi rõ hơn nhé." 
            }
        });

        // ==========================================
        // 2. TẠO CẠNH (OPTIONS) - LỐI RẼ VÀ NÚT BẤM
        // ==========================================
        
        // Lối rẽ 1: Từ Lời chào -> Xem điểm CNTT
        await Option.create({
            node_id: nodeWelcome.id,
            next_node_id: nodeDiemIT.id,
            button_text: "Xem điểm CNTT",
            payload_value: "BTN_DIEM_IT",
            // Nếu user gõ text, AI bắt được intent này cũng sẽ rẽ vào đây
            intent_match: "intent.hoi_diem_it" 
        });

        // Lối rẽ 2: Từ Lời chào -> Xem Học phí
        await Option.create({
            node_id: nodeWelcome.id,
            next_node_id: nodeHocPhi.id,
            button_text: "Học phí",
            payload_value: "BTN_HOC_PHI",
            intent_match: "intent.hoi_hoc_phi"
        });

        // Lối rẽ 3: Từ Fallback cũng in ra 2 nút bấm y hệt Lời chào để kéo user lại luồng
        await Option.create({
            node_id: nodeFallback.id,
            next_node_id: nodeDiemIT.id,
            button_text: "Xem điểm CNTT",
            payload_value: "BTN_DIEM_IT"
        });

        await Option.create({
            node_id: nodeFallback.id,
            next_node_id: nodeHocPhi.id,
            button_text: "Học phí",
            payload_value: "BTN_HOC_PHI"
        });

        console.log('✅ Seeding thành công rực rỡ! Dữ liệu đã nằm gọn trong PostgreSQL.');
        process.exit(0); // Thoát script
    } catch (error) {
        console.error('❌ Có lỗi xảy ra trong quá trình seeding:', error);
        process.exit(1);
    }
}

runSeed();