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
    // 在这里定义模型属性
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull 默认为 true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull 默认为 true
    },
    remark: {
        type: DataTypes.STRING,
        // allowNull 默认为 true
    },
    token: {
        type: DataTypes.STRING,
        // allowNull 默认为 true
    },
    authenticated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
        // allowNull 默认为 true
    },
    available: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
          table:{
            User
          }
      }
};
