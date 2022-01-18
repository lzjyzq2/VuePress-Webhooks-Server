const express = require('express');
const cookieParser = require('cookie-parser');
const exec = require('child_process');
const utils = require('./util.js');
const log = require('./log.js');
const database = require("./db/database.js");
const path = require('path');

const os = /^win/.test(process.platform) ? 'windows' : 'other'

// 初始化配置
const config = utils.loadConfig();

const {
    options: {
        port
    }
} = config;
// 初始化express
const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());

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

const shellPathsCache = utils.generateShell(ctx);

const logger = log(ctx);
ctx.$logger = logger;

const db = database();
ctx.$db = db;

logger.info(`访问验证是否启用：${config.options.requireLogin}`);

// 当前列表内容将会跳过验证
const skipValidationList = [
    /^\/helloworld$/, /^\/login$/, /^\/api\/login/, /^\/api\/docs/, /^\/api\/activate$/, /^\/activate$/, /~\/api\/loginMode$/
]

app.use("/", (req, res, next) => {
    if (config.options.requireLogin) {
        let requestUrl = req.originalUrl;
        let referer = req.headers.referer ? req.headers.referer : '';
        logger.info(`访问验证URL[${requestUrl}]`);
        for (const skipValidation of skipValidationList) {
            if (requestUrl.match(skipValidation)) {
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
                let access = false;
                switch (config.options.LoginMode) {
                    case "user-login":
                        access = utils.checkLoginToken(token);
                        break;
                    case "access-token":
                        access = utils.checkToken(token, config.options.accessToken);
                        break;
                }

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

app.get('/helloworld', (req, res) => {
    res.send('Hello World!')
})
app.get('/api/loginMode', (req, res) => {
    let loginMode = config.options.LoginMode;
    res.send({ code: 200, message: "成功", data: { loginMode } })
})
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html', (err) => {
        if (err) {
            logger.err(err);
        }
    })
})
app.get('/list', (req, res) => {
    res.sendFile(__dirname + '/list.html', (err) => {
        if (err) {
            logger.err(err);
        }
    })
})
app.get('/activate', (req, res) => {
    res.sendFile(__dirname + '/pages/activate.html', (err) => {
        if (err) {
            logger.err(err);
        }
    })
})
app.get('/api/login', async (req, res) => {
    switch (config.options.LoginMode) {
        case "user-login":
            let username = req.query.username ? req.query.username : '';
            let password = req.query.password ? req.query.password : '';
            let user = await db.table.User.findOne({ where: { username } });
            if (user) {
                // 用户已验证&&用户可用&&密码正确
                if (user.authenticated && user.available && utils._convertPwd(password, user.salt) === user.password) {
                    let token = utils.generateLoginToken(username)
                    user.token = token;
                    user.save();
                    res.cookie('token', token);
                    res.send({ code: 200, message: "登录成功" });
                } else {
                    res.send({ code: 400, message: "登录失败，联系管理员" });
                }
            } else {
                res.send({ code: 400, message: "用户不存在" });
            }
            break;
        case "access-token":
            let token = req.query.token ? req.query.token : '';
            logger.info(`登录验证[${token}]`)
            if (token == config.options.accessToken) {
                res.cookie('token', utils.generateToken(config.options.accessToken))
                res.send({ code: 200, message: "验证成功" });
            } else {
                res.send({ code: 400, message: "验证失败" });
            }
            break;
    }
})

app.get('/api/docs', (req, res) => {
    try {
        let docs = [];
        for (const item of config.options.tasks) {
            docs.push({ name: item.name, url: item.url })
        }
        res.send({ code: 200, message: "获取成功", data: docs });
    } catch (err) {
        logger.error(err);
        res.send({ code: 400, message: "获取文档列表失败" });
    }
})

app.post('/api/activate', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let captcha = req.body.captcha;
    const user = await db.table.User.findOne({ where: { username } })
    if (user) {
        if (!user.authenticated) {
            if (utils._convertPwd(password, user.salt) === user.password && captcha === user.captcha) {
                res.send({ code: 200, message: "验证成功" });
                user.authenticated = true;
                user.available = true;
                user.save();
            } else {
                res.send({ code: 400, message: "验证失败" });
            }
        } else {
            res.send({ code: 400, message: "无需验证" })
        }
    } else {
        res.send({ code: 400, message: "该用户不存在" });
    }
})

for (const shellPathName of Object.keys(shellPathsCache)) {
    logger.info(`Shell Path[${shellPathName}]:${shellPathsCache[shellPathName]}`);
}

for (const item of config.options.tasks) {
    skipValidationList.push(new RegExp(item.customUrl, 'g'));
    app.use(item.url, express.static(path.resolve(item.public)));
    app.all(item.customUrl, (req, res) => {
        if (item.method === req.method) {
            if (validators[item.platform](ctx, req,item)) {
                res.send(JSON.stringify(item.responseSucc));
                let out = exec.execFile(shellPathsCache[item.name], null, {
                    cwd: process.cwd()
                });
                out.stdout.on('data', (data) => {
                    if (data !== '') {
                        logger.info(data);
                    }
                });
            } else {
                res.status(item.responseFail.code).send(JSON.stringify(item.responseFail));
            }
        } else {
            res.status(item.responseErr.code).send(item.responseErr)
        }
    })
}

app.listen(port, () => {
    logger.info(`app listening at http://localhost:${port}`);
})