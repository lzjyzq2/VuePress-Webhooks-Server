const express = require('express');
const cookieParser = require('cookie-parser');
const exec = require('child_process');
const utils = require('./util.js');
const log = require('./log.js');

const os = /^win/.test(process.platform) ? 'windows' : 'other'

// 初始化配置
const config = utils.loadConfig();

const {
    options: {
        port,
        public,
        platform,
        method,
        type,
        customUrl,
        responseSucc,
        responseFail,
        responseErr,
    }
} = config;

// 初始化express
const app = express();
if (type === 'json') {
    app.use(express.json())
} else if (type === 'urlencoded') {
    app.use(express.urlencoded({
        extended: true
    }))
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
app.use(cookieParser());
logger.info(`访问验证是否启用：${config.options.requireLogin}`);
const skipValidationList = [
    /^\/helloworld$/, /^\/login$/, /^\/api\/login/,new RegExp(customUrl,'g')
]
app.use("/", (req, res, next) => {
    if (config.options.requireLogin) {
        let requestUrl = req.originalUrl;
        let referer = req.headers.referer ? req.headers.referer : '';
        logger.info(`访问验证URL[${requestUrl}]`)
        for (let i = 0; i < skipValidationList.length; i++) {
            if (requestUrl.match(skipValidationList[i])) {
                logger.info(`跳过验证`);
                next('route');
                return;
            }
        }
        if (referer.indexOf('/login') > 0) {
            logger.info(`跳过验证`)
            next('route');
        } else {
            if (req.cookies && req.cookies.token) {
                let token = req.cookies.token;
                let access = utils.checkToken(token, config.options.accessToken);
                if (access) {
                    logger.info(`验证Token[${token}]:通过`)
                    next('route');
                } else {
                    logger.info(`验证Token[${token}]:未通过`)
                    res.redirect('/login');
                }
            } else {
                logger.info(`登录验证:未通过`)
                res.redirect('/login');
            }
        }
    } else {
        next();
    }

})
logger.info("working in " + process.cwd());
app.use(express.static(public))

app.get('/helloworld', (req, res) => {
    res.send('Hello World!')
})
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html', (err) => {
        if (err) {
            logger.err(err);
        }
    })
})
app.get('/api/login', (req, res) => {
    let token = req.query.token ? req.query.token : '';
    logger.info(`访问验证[${token}]`)
    if (token == config.options.accessToken) {
        res.cookie('token', utils.generateToken(config.options.accessToken))
        res.send({ code: 200, message: "验证成功" });
    } else {
        res.send({ code: 400, message: "验证失败" });
    }
})
logger.info(shell);
app.all(customUrl, (req, res) => {
    if (method === req.method) {
        if (validators[platform](ctx, req)) {
            res.send(JSON.stringify(responseSucc));
            exec.execFile(shell, null, {
                cwd: process.cwd()
            }, function (error, stdout, stderr) {
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