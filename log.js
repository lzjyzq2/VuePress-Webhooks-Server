const utils = require('./util.js')
const fs = require("fs");
const path = require('path');

const log = function ({
    $config
}) {
    let log = $config.options.log;
    const { options: {
        logFormatter,
        logTimeFormatter,
        logStorage
    } } = $config;

    const timeRegExp = new RegExp('\\[time\\]', 'gm');
    const levelRegExp = new RegExp('\\[level\\]', 'gm');
    const messageRegExp = new RegExp('\\[message\\]', 'gm');

    _mkdirs = function (dirpath) {
        if (!fs.existsSync(path.dirname(dirpath))) {
            _mkdirs(path.dirname(dirpath));
        }
        fs.mkdirSync(dirpath);
    }
    let dirPath = path.dirname(logStorage);
    fs.existsSync(dirPath) == false && _mkdirs(dirPath);

    const error = function (message) {
        logger('error', message);
    }


    const info = function (message) {
        logger('info', message);
    }

    const warning = function (message) {
        logger('warning', message);
    }
    const logger = function (level, message) {
        let record = _formatter(level, message)
        console.log(record);
        if (log) {
            fs.writeFile(logStorage, `${record}\n`, {
                flag: 'a'
            }, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    }

    _formatter = function (level, message) {
        let time = utils.formatDate(new Date(), logTimeFormatter);
        let logStr = logFormatter.replace(timeRegExp, time).replace(levelRegExp, level).replace(messageRegExp, message);
        return logStr;
    }

    const _logger = {
        error: error,
        info: info,
        warning: warning,
        log: logger,
        _formatter: _formatter
    };
    return _logger;

}


module.exports = log;