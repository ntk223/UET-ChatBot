const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Node = sequelize.define('Node', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Tạm thời hardcode school_id cho UET để làm MVP
    school_id: {
        type: DataTypes.STRING,
        defaultValue: 'uet-1234'
    },
    node_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.JSONB, // Kiểu JSONB cực kỳ mạnh của Postgres
        allowNull: false
    },
    is_fallback: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'nodes',
    timestamps: true
});

module.exports = Node;