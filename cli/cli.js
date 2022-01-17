#!/usr/bin/env node
const commander = require('commander');
const database = require("../db/database")
const util = require("../util")
const db = database();

const program = new commander.Command();
program.version(`Vuepress-Webhook-Server ${require('../package').version}`)
    .usage('<command> [options]');
program.command("run")
    .description("run server work in current directory")
    .action(() => {
        require('../index')
    })
program.command("add-user <username> <password> <email>")
    .description("添加一个用户,其格式为:用户名称 用户密码 用户邮件；\n例如:example@ex.com password example@ex.com")
    .action(async (username, password, email) => {
        //console.log(username,password,email)
        let result = await util.register(username, password, email);
        if (result == 0) {
            console.log("添加失败，已存在该用户");
        } else if (result == -1) {
            console.log("注册信息有误");
        } else {
            console.log("已添加添加用户");
        }
    })
program.command("rem-user <username>")
    .description("移除一个用户,其格式为:用户名称")
    .action(async (username) => {
        let result = await util.removeUser(username);
        if (result == 0) {
            console.log("该用户不存在");
        } else {
            console.log("已删除该用户");
        }
    })
program.command("dis-user <username> [disable]")
    .description("禁用或解除禁用一个用户,其格式为:<username> [dis|undis]")
    .action(async (username, disable) => {
        if (!disable) {
            disable = 'dis';
        }
        if (disable !== 'undis' && disable !== 'dis') {
            throw new commander.InvalidArgumentError('错误的禁用选项');
        }
        let hint = disable === 'dis' ? '已禁用该用户' : '已恢复该用户'
        let result = await util.disableUser(username, disable);
        if (result == 0) {
            console.log("该用户不存在");
        } else {
            console.log(hint);
        }
    })
program.parse(process.argv);