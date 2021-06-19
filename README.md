# VuePress-Webhooks-Builder
根据webhook的调用，拉取仓库中的文档并进行编译，同时允许通过Web访问编译后网页文件。  
According to the call of webhook, pull the documents in the repository and compile them, the compiled web files can be accessed through web pages.  
## 用法
- 克隆项目到本地
```
git clone https://github.com/lzjyzq2/VuePress-Webhooks-Builder.git
```
- 安装依赖
```
npm install
```
- 增加`config.js`
其中`platform`、`key`、`git`为必选配置,其他选项视情况自行配置。
```js
module.exports = {
    validators: {
        "github": "./validator/github.js",
        "gitea": "./validator/gitea.js"
    },
    options: {

        // 工作端口号
        port: 3000,
        // 公共静态文件目录
        public: "./docs/.vuepress/dist",
        // Webhook使用的加密key，应自行配置
        key: "document-key-adihwwd3445ada",
        
        // 所使用的代码托管平台
        // 与使用的验证器相对应
        platform: "github",
        
        // Webhook使用的请求方式
        method: "POST",
        
        // payload的格式类型
        type: "json",
        
        // 自定义WebHook访问路径
        customUrl: "/webhook",
        // 成功响应结果
        responseSucc: {
            code: 200,
            message: "start pull"
        },
        // 失败响应结果
        responseFail: {
            code: 400,
            message: "validation failed"
        },
        // 异常响应结果
        responseErr: {
            code: 500,
            message: "wrong request"
        },

        // git仓库地址
        git: "",
        // 是否开启日志记录（即是否输出到本地文件）
        log: true,
        // 日志格式
        logFormatter: "[[time]]:[[level]]: [message]",
        // 时间格式化
        logTimeFormatter: "yyyy-MM-dd hh:mm:ss",
        // 本地日志路径
        logStorage: "./log/log.log"
    }
}
```
- 修改shell命令(可选)
    > 脚本位于`validator`文件夹下
    - `pull.bat` - windows下拉取仓库脚本
    - `pull.sh`  - 其他操作系统下拉取仓库脚本
- 手动拉取文档仓库至目录下
    > 若无应先创建
    - 将文档仓库重命名为`docs`（Vuepress需要）
- 其目录应如下
    ```
    -- VuePress-Webhooks-Builder
     |-- docs
          |-- ......
     |-- shell
          |-- pull.bat
          |-- pull.sh
     |-- validator
          |-- ......
     |-- config.js
     |-- index.js
     |-- log.js
     |-- package-lock.json
     |-- package.json
     |-- util.js
    ```
- 配置`VuePress`
    > 进行`VuePress`配置: https://vuepress.vuejs.org/zh/guide/  
    > 注意：`config.js`中`public`应与`VuePress`的输出目录相对应。
- 手动执行一次`Build`
    > 当配置`VuePress`后，手动执行一次`build`。
- 启动服务
```
npm server:run
```
- 是否启动成功
```
visit http://[host]:[port]/helloworld
```
- 配置文档仓库WebHook
    > 注意：使用前应确保代码托管平台能够访问到Webhook地址。
## 自定义验证器
- 自行建立的验证器，应导出一个函数，并具有返回值。用以确认该请求是否验证通过。
```js
module.export = function(ctx,req){
    ...
    return false;
}
```
- 配置验证器
```js
// 在config.js中进行验证器配置
module.exports = {

    // 装载验证器
    plugins: {
        "github": "./validator/github.js",
        "gitea":"./validator/gitea.js"
        // platform: js file path
    },
    options:{
        // 配置要使用的验证器
        // 以gitea为例
        platform:"gitea"
        ......
    }
}
```