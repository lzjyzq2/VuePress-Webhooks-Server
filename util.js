const fs = require("fs");
const path = require("path");
const defaultConfig = require("./defaultConfig");
const ejs = require("ejs");
const _ = require('lodash');
const crypto = require('crypto');
const database = require("./db/database");
const db = database();

/**
 * 格式化时间与日期
 * yyyy - 年
 * MM - 月
 * dd - 日
 * hh - 时
 * mm - 分
 * ss - 秒
 * S - 毫秒
 * @param {Date} date 待格式化日期实例
 * @param {String} format 格式化样式
 * @example
 * {
 *    let r1 = formatDate(new Date(),'yyyy-MM-dd hh:mm:ss:S');
 *    // r1 = "2021-05-08 11:27:22:980";
 *    let r2 = formatDate(new Date(),'yy-MM-dd hh:mm:ss');
 *    // r2 = "21-05-08 11:31:09";
 *    let r3 = formatDate(new Date(),'hh:mm:ss');
 *    // r3 = "11:34:17";
 *    let r4 = formatDate(new Date(),"h:m:ss");
 *    // r4 = "11:36:57";
 *    let r5 = formatDate(new Date(),"h:m:s");
 *    // r5 = "11:37:2";
 *    let r6 = formatDate(new Date(),"yyyyMMddhhmmss");
 *    // r6 = "20210508114252";
 * }
 */
const formatDate = (date, format = 'yyyy-MM-dd hh:mm:ss') => {
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + "").substring(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substring(("" + o[k]).length)));
    return format;
}

const loadConfig = function () {
    let configPath = process.cwd() + path.sep + "config.js";
    let tempConfig = defaultConfig;
    if (fs.existsSync(configPath)) {
        let config = require(configPath);
        tempConfig = _.defaultsDeep(config, defaultConfig)
    }
    tempConfig.options = convertOldOption(tempConfig.options);
    return tempConfig;
}

const _chooseShellTemplate = function (ctx) {
    let tmp = ctx.$os === 'windows' ? '/shell/pull-template-bat' : '/shell/pull-template-sh';
    return `${__dirname}${path.sep}${tmp}`;
}

const renderShell = async function (ctx, item) {
    let info = {
        docs: item.docs,
        workPath: item.workPath,
        buildCmd: item.buildCmd
    }
    let output = await ejs.renderFile(_chooseShellTemplate(ctx), info);
    return output;
}
/**
 * 生成Shell
 * @param {Object} ctx VuepressWS context
 * @returns {Object} Shell Paths 
 */
const generateShell = function (ctx) {
    let shellDir = `${process.cwd()}${path.sep}.vuepressws${path.sep}shell`
    fs.existsSync(shellDir) === false && mkdirs(shellDir);
    let shellPathCache = {};
    for (const item of ctx.$config.options.tasks) {
        let targetFile = item.name + (ctx.$os === 'windows' ? '.bat' : '.sh');
        let shellPath = shellDir + path.sep + targetFile;
        renderShell(ctx, item).then(data => {
            fs.writeFileSync(shellPath, data, {
                flag: "w+"
            });
        })
        shellPathCache[item.name] = shellPath;
    }
    return shellPathCache;
}
const mkdirs = function (dirpath) {
    if (!fs.existsSync(path.dirname(dirpath))) {
        mkdirs(path.dirname(dirpath));
    }
    fs.mkdirSync(dirpath);
}
const checkToken = function (token, accessToken) {
    let flag = true;
    let subToken1 = token.substring(0, 32);
    let subToken2 = token.substring(32, token.length);
    let tempSubToken = crypto.createHash('md5').update(accessToken).digest("hex")
    if (tempSubToken != subToken1) {
        flag = false;
    }
    let timestamp = new Buffer.from(subToken2, 'hex').toString('utf8');
    if (timestamp.length >= 45) {
        let searchIndex = timestamp.lastIndexOf(subToken1);
        if (searchIndex == timestamp.length - subToken1.length) {

            timestamp = parseInt(timestamp.substring(0, searchIndex));
            if (timestamp <= 0) {
                flag = false;
            }
        } else {
            flag = false;
        }
    } else {
        flag = false;
    }
    return flag;
}
const generateToken = function (accessToken) {
    let subToken1 = crypto.createHash('md5').update(accessToken).digest("hex");
    let timestamp = new Date().getTime();
    return subToken1 + new Buffer.from(timestamp + subToken1).toString('hex');
}

/**
 * 判断当前option是否为旧配置
 * @param {Object} option 配置项
 * @returns true-未旧配置,false-新配置
 */
const isOldOption = function (option) {
    return (!(option.tasks && Array.isArray(option.tasks)) || option.public);
}
/**
 * 转换旧配置为新配置
 * @param {Object} option 配置项
 * @returns 转换后配置项
 */
const convertOldOption = function (option) {
    if (isOldOption(option)) {
        let attrs = [
            "name",
            "public",
            "key",
            "platform",
            "method",
            "type",
            "customUrl",
            "docs",
            "workPath",
            "buildCmd",
            "responseSucc",
            "responseFail",
            "responseErr",
            "git"
        ];
        if (!option.tasks) {
            option.tasks = [];
        }
        let tempTask = { name: "default", url: "/" };
        for (const attr of attrs) {
            if (option.hasOwnProperty(attr)) {
                tempTask[attr] = option[attr];
                delete option[attr];
            }
        }
        option.tasks.push(tempTask);
    }
    return option;
}

/**
 * 获取一个指定长度的字符串
 * @param {Number} e 长度
 * @returns 随机字符串
 */
const randomString = function (e) {
    e = e || 32;
    var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n
}

/**
 * 注册用户
 * @param {String} username 用户名
 * @param {String} password 密码
 * @param {String} email 邮箱
 * @returns 注册结果 1-成功,0-失败(已存在该用户)
 */
const register = async function (username, password, email) {
    try {
        if(!username||!password||!email){
            return -1;
        }
        const salt = randomString(8);
        let existUser = await db.table.User.findOne({ where: { username } })
        if (!existUser) {
            const practicalPwd = _convertPwd(password, salt);
            const user = db.table.User.build({ username, password: practicalPwd, email, salt });
            await user.save();
            return 1;
        } else {
            return 0;
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * 发送邮件
 */
const sendMail = function(){
    
}

/**
 * 加密密码
 * @param {string} password 密码
 * @param {String} salt 盐值
 * @returns 加密后密码
 */
const _convertPwd = function (password, salt) {
    let hashCrypto1 = crypto.createHash('SHA256');
    let hashCrypto2 = crypto.createHash('SHA256');
    return hashCrypto1.update(hashCrypto2.update(password).digest('hex') + salt).digest('hex');
}

module.exports = {
    formatDate: formatDate,
    loadConfig: loadConfig,
    renderShell: renderShell,
    generateShell: generateShell,
    mkdirs: mkdirs,
    checkToken: checkToken,
    generateToken: generateToken,
    convertOldOption: convertOldOption,
    isOldOption: isOldOption,
    register: register
}