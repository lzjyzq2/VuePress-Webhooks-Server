const express = require('express');
const modules = require('./modules.js');
const exec = require('child_process');
const utils = require('./util.js');
const fs = require("fs");
const log = require('./log.js');
const app = express();
const plugins = {};


const os = /^win/.test(process.platform) ? 'windows' : 'other'
const _shell = os === 'windows' ? 'pull.bat' : 'pull.sh'

let configFile = fs.readFileSync('config.json');
let tmpConfig = JSON.parse(configFile);

const config = {
    port="3000",
    key="",
    platform,
    method="POST",
    type="json",
    responseSucc,
    responseFail,
    responseErr,
    public = "./docs/.vuepress/dist",
    git,
    customUrl = '/webhook',
    logFormatter="[[time]]:[[level]]: [message]",
    logTimeFormatter="yyyy-MM-dd hh:mm:ss",
    logStorage="./log/log.log"
} = tmpConfig;

if(type==='json'){
    app.use(express.json())
}else if(type==='urlencoded'){
    app.use(express.urlencoded({ extended: true }))
}

for (let plugin in modules.plugins) {
    plugins[plugin] = require(modules.plugins[plugin]);
}



const ctx = {
    $config: config,
    $express: app,
    $os: os,
    $process: process,
};

const logger = log(ctx);
ctx.$logger = logger;

logger.info("working in "+__dirname);
app.use(express.static(public))

app.get('/helloworld', (req, res) => {
    res.send('Hello World!')
})

app.all(customUrl, (req, res) => {
    if (method === req.method) {
        if (plugins[platform](ctx, req)) {
            res.send(JSON.stringify(responseSucc));
            exec.execFile(_shell, null, {cwd:__dirname+"/shell"}, function (error, stdout, stderr) {
                if (error) {
                    logger.error(error);
                }
                logger.info(stdout);
                if (stderr) {
                    logger.error(stderr);
                }
                if(!error&&!stderr){
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