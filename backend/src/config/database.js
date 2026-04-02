const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo kết nối tới PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false, // Tắt log các câu lệnh SQL trên terminal cho đỡ rối
        pool: {
            max: 5, // Số lượng kết nối tối đa
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;