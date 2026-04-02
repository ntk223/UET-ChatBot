# UET Chatbot Platform

Nền tảng chatbot tích hợp cho Đại học Công nghệ - ĐHQGHN, xây dựng bằng Node.js, PostgreSQL, MongoDB và Rasa.

## 📋 Mô Tả Dự Án

Platform cung cấp:
- **Chatbot thông minh** với State Machine để quản lý flow conversational
- **Intent recognition** tích hợp Rasa NLU
- **Dual Database**: PostgreSQL (structured data) + MongoDB (chat logs)
- **Event logging** cho phân tích tương tác người dùng

## 🏗️ Cấu Trúc Dự Án

```
uet-chatbot-platform/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── config/          # Database config
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Middleware
│   ├── package.json
│   └── .env                 # Environment variables
├── nlu-engine/              # Rasa NLU service
├── devops/                  # Deployment configs
└── README.md
```

## 🔧 Yêu Cầu

- **Node.js**: >= 14.x
- **npm** hoặc **yarn**
- **PostgreSQL**: >= 12
- **MongoDB**: >= 4.4
- **Rasa**: >= 3.x (chạy riêng biệt)

## 🚀 Cài Đặt & Chạy

### 1. Clone Repository
```bash
git clone <repository-url>
cd uet-chatbot-platform
```

### 2. Cài Đặt Backend

```bash
cd backend
npm install
```

### 3. Cấu Hình Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASS=secretpassword
DB_NAME=uet_chatbot_core
MONGO_URI=mongodb://root:secretpassword@localhost:27017/uet_chatbot_logs?authSource=admin
```

### 4. Khởi Tạo Database

```bash
# Tạo database (postgresql, mongodb đã có user/password trong .env)
cd devops
docker-compose up -d
```

```bash
# Seed PostgreSQL (nếu cần)
cd backend
npm run seed
```
### 5. Khởi Động Rasa (riêng biệt)

```bash
cd nlu-engine
# Activate virtual environment
source venv/bin/activate
```

```bash
# Cài đặt Rasa (nếu chưa có)
pip install rasa

# Train Rasa model
rasa train

# Chạy Rasa server
rasa run --enable-api
```

### 6. Chạy Backend

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

## 📡 API Endpoints

### POST `/webhook`

Endpoint chính để xử lý tin nhắn từ user.

**Request Body**:
```json
{
    "sender_id": "user_123",
    "message_text": "cntt năm nay lấy bao nhiêu điểm?",
}
```

**Response**:
```json
{
  "bot_says": "Chào bạn! Tôi có thể giúp gì cho bạn?",
  "buttons": [
    {
      "title": "Hỗ trợ học tập",
      "payload": "support_education"
    },
    {
      "title": "Thông tin tuyển sinh",
      "payload": "admission_info"
    }
  ]
}
```

**Parameters**:
- `sender_id` *(required)*: ID định danh user (string)
- `message_text` *(optional)*: Nội dung tin nhắn tự do
- `payload_value` *(optional)*: Giá trị từ button/action

## 🔄 Luồng Xử Lý Tin Nhắn

```
User Message → Webhook
    ↓
Detect Intent (Rasa) [nếu là text tự do]
    ↓
Lưu log User vào MongoDB
    ↓
Tìm/tạo User Session
    ↓
State Machine → Tìm Node tiếp theo
    ↓
Fallback [nếu không tìm thấy Option]
    ↓
Lấy Bot Response & Buttons
    ↓
Lưu log Bot vào MongoDB
    ↓
Trả response cho client
```

## 📊 Database Schema

### PostgreSQL (Sequelize)

**nodes** - Các nút trong chatbot
```
id, node_name, content (JSON), is_fallback, created_at
```

**options** - Nút con / Button choices
```
id, node_id, button_text, payload_value, intent_match, next_node_id
```

**user_sessions** - Trạng thái user
```
id, platform_user_id, current_node_id, created_at, updated_at
```

### MongoDB (Mongoose)

**chat_logs** - Lịch sử chat
```
{
  platform_user_id,
  sender_type: 'USER' | 'BOT',
  message_text,
  intent_detected,
  is_fallback,
  created_at
}
```

## 🧪 Testing

```bash
# Dùng curl
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "user_123",
    "message_text": "cntt năm nay lấy bao nhiêu điểm?",
    "payload_value": null
  }'

# Hoặc dùng Postman / Insomnia
```
