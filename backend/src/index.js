require('dotenv').config();
const express = require('express');
const cors = require('cors');

const initializeDatabases = require('./middleware/database');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROUTES
// ==========================================
app.use('/', webhookRoutes);

// ==========================================
// INITIALIZATION
// ==========================================
async function start() {
    try {
        // Khởi động cả 2 Database
        await initializeDatabases();

        // Khởi động Server
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động server:', error);
        process.exit(1);
    }
}

start();