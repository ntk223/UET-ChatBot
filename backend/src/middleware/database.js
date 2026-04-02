const sequelize = require('../config/database');
const connectMongo = require('../config/mongo');

/**
 * Khởi động cả 2 Database: PostgreSQL và MongoDB
 */
async function initializeDatabases() {
    try {
        // Kết nối MongoDB
        await connectMongo();
        console.log('✅ MongoDB connected');

        // Kết nối PostgreSQL
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('✅ PostgreSQL connected and synced');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabases;
