const express = require('express');
const exec = require('child_process');
const utils = require('./util.js');
const log = require('./log.js');

const os = /^win/.test(process.platform) ? 'windows' : 'other'

// 初始化配置
const config = utils.loadConfig();

const { options: {
    port,
    public,
    platform,
    method,
    type,
    customUrl,
    responseSucc,
    responseFail,
    responseErr,
} } = config;

// 初始化express
const app = express();
if (type === 'json') {
    app.use(express.json())
} else if (type === 'urlencoded') {
    app.use(express.urlencoded({ extended: true }))
}

// 初始化验证器
const validators = {};
for (let validator in config.validators) {
    validators[validator] = require(config.validators[validator]);
}
// 初始化上下文
const ctx = {
    $config: config,
    $express: app,
    $os: os,
    $process: process,
};

const shell = utils.generateShell(ctx);

const logger = log(ctx);
ctx.$logger = logger;

logger.info("working in " + process.cwd());
app.use(express.static(public))

app.get('/helloworld', (req, res) => {
    res.send('Hello World!')
})
logger.info(shell);
app.all(customUrl, (req, res) => {
    if (method === req.method) {
        if (validators[platform](ctx, req)) {
            res.send(JSON.stringify(responseSucc));
            exec.execFile(shell, null, { cwd: process.cwd() }, function (error, stdout, stderr) {
                if (error) {
                    logger.error(error);
                }
                logger.info(stdout);
                if (stderr) {
                    logger.error(stderr);
                }
                if (!error && !stderr) {
                    logger.info("build successful");
                }
            })
        } else {
            res.send(JSON.stringify(responseFail));
        }
    } else {
        res.send(responseErr)
    }
})
app.listen(port, () => {
    logger.info(`app listening at http://localhost:${port}`);
})