const sequelize = require('../config/database');
const Node = require('./Node');
const Option = require('./Option');
const UserSession = require('./UserSession');
// 1 Node có thể có nhiều Option (Lối rẽ) xuất phát từ nó
Node.hasMany(Option, { 
    foreignKey: 'node_id', 
    as: 'outgoing_options' 
});
Option.belongsTo(Node, { foreignKey: 'node_id', as: 'source_node' });

// 1 Option sẽ dẫn tới 1 Node tiếp theo (Node đích)
Option.belongsTo(Node, { foreignKey: 'next_node_id', as: 'target_node' });

module.exports = {
    sequelize,
    Node,
    Option,
    UserSession
};