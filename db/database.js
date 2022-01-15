const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.sqlite'
});
sequelize.authenticate().then(res => {
    console.log('Connection has been established successfully.');
}).catch(error => {
    console.error('Unable to connect to the database:', error);
})
class User extends Model { }
User.init({
    // 用户名称
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    // 用户密码
    password: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull 默认为 true
    },
    // 用户邮件
    email: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull 默认为 true
    },
    // 用户备注
    remark: {
        type: DataTypes.STRING,
        // allowNull 默认为 true
    },
    // 用户token
    token: {
        type: DataTypes.STRING,
        // allowNull 默认为 true
    },
    // 是否已验证
    authenticated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
        // allowNull 默认为 true
    },
    // 当前账户是否可用
    available: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // 盐值
    salt: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    // 这是其他模型参数
    sequelize, // 我们需要传递连接实例
    modelName: 'User' // 我们需要选择模型名称
})

module.exports = function () {
    (async () => {
        // 仅创建表
        await sequelize.sync();
    })();
    return {
        sequelize,
        table: {
            User
        }
    }
};
