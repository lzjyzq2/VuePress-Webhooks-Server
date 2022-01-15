#!/usr/bin/env node
const program = require('commander');
const database = require("../db/database")
const util = require("../util")
const db = database();


program.version(`Vuepress-Webhook-Server ${require('../package').version}`)
    .usage('<command> [options]');
program.command("run")
    .description("run server work in current directory")
    .action(() => {
        require('../index')
    })
program.command("add-user <username> <password> <email>")
    .description("添加一个用户,其格式为:用户名称 用户密码 用户邮件；\n例如:example@ex.com password example@ex.com")
    .action(async (username,password,email) => {
        //console.log(username,password,email)
        let result = await util.register(username,password,email);
        if(result==0){
            console.log("添加失败，已存在该用户");
        }else if(result==-1){
            console.log("注册信息有误");
        }else{
            console.log("已添加添加用户");
        }
    })
program.command("rem-user")
    .description("添加一个用户,其格式为")
    .action((info) => {

    })
program.command("dis-user")
    .description("添加一个用户,其格式为")
    .action((info) => {
        
    })
program.parse(process.argv);