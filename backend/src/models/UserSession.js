const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSession = sequelize.define('UserSession', {
    platform_user_id: {
        type: DataTypes.STRING,
        primaryKey: true // ID của Zalo/Messenger
    },
    current_node_id: {
        type: DataTypes.UUID,
        allowNull: true // Trỏ đến ID của bảng Nodes
    }
}, {
    tableName: 'user_sessions',
    timestamps: true
});

module.exports = UserSession;