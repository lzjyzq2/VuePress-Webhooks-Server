const fs = require("fs");
const path = require("path");
const defaultConfig = require("./defaultConfig");
const ejs = require("ejs");
const _ = require('lodash');
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
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return format;
}

const loadConfig = function () {
    let configPath = process.cwd() + path.sep + "config.js";
    if (fs.existsSync(configPath)) {
        let config = require(configPath);
        config = _.defaultsDeep(config,defaultConfig)
        return config;
    } else {
        return defaultConfig;
    }
}

const _chooseShellTemplate = function (ctx) {
    let tmp = ctx.$os === 'windows' ? '/shell/pull-template-bat' : '/shell/pull-template-sh';
    return `${__dirname}${path.sep}${tmp}`;
}

const renderShell = async function (ctx) {
    let info = {
        docs: ctx.$config.options.docs,
        workPath: ctx.$config.options.workPath,
        buildCmd: ctx.$config.options.buildCmd
    }
    let output = await ejs.renderFile(_chooseShellTemplate(ctx), info);
    return output;
}
/**
 * 生成Shell
 * @param {Object} ctx VuepressWS context
 * @returns Shell Path
 */
const generateShell = function (ctx) {
    let shellDir = `${ctx.$config.options.workPath}${path.sep}.vuepressws${path.sep}shell`
    fs.existsSync(shellDir) == false && mkdirs(shellDir)
    const targetFile = ctx.$os === 'windows' ? 'pull.bat' : 'pull.sh';
    let shellPath = shellDir + path.sep + targetFile;
    renderShell(ctx).then(data => {
        fs.writeFileSync(shellPath, data, {
            flag: "w+"
        });
    })
    return shellPath;
}
const mkdirs = function (dirpath) {
    if (!fs.existsSync(path.dirname(dirpath))) {
        mkdirs(path.dirname(dirpath));
    }
    fs.mkdirSync(dirpath);
}
module.exports = {
    formatDate: formatDate,
    loadConfig: loadConfig,
    renderShell: renderShell,
    generateShell: generateShell,
    mkdirs: mkdirs
}