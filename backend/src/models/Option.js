const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Option = sequelize.define('Option', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    button_text: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payload_value: {
        type: DataTypes.STRING,
        allowNull: true
    },
    intent_match: {
        type: DataTypes.STRING, // Dùng để bắt Intent từ Rasa trả về
        allowNull: true
    }
}, {
    tableName: 'options',
    timestamps: true
});

module.exports = Option;