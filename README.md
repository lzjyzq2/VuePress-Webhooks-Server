# VuePress-Webhooks-Server
根据webhook的调用，拉取仓库中的文档并进行编译，同时允许通过Web访问编译后网页文件。  
According to the call of webhook, pull the documents in the repository and compile them, the compiled web files can be accessed through web pages.  
## 用法
### 使用`npm`
- 创建一个目录
```
mkdir vuepress-starter && cd vuepress-starter
```
- 使用包管理器进行初始化
```
npm init
```
- 将 VuePress-Webhooks-Server 安装为本地依赖
```
npm i vuepress-webhooks-server
```
- 克隆文档到本地
    > 若无应先创建
    - 将文档仓库重命名为`docs`（默认配置），如需自定义请修改`config.js`
- 增加`config.js`
其中`platform`、`key`、`git`为必选配置,其他选项视情况自行配置。
```js
module.exports = {
    validators: {
        "github": "vuepress-webhooks-server/validator/github.js",
        "gitea": "vuepress-webhooks-server/validator/gitea.js"
        // 使用自带github、gitea验证器时，应配置
        // platform、key、type、git
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

        // 文档所在路径，若自定义应修改script中命令
        docs:"./docs",
        
        // 工作目录
        workPath:process.cwd(),
        

        // script中的编译命令
        // 此项会渲染到pull.bat中，用来编译文件
        buildCmd:"docs:build",

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
- 在`package.json`中添加`scripts`
```json
"scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs",
    "VuepressWS": "VuepressWS run"
  }
```
- 初次编译
```
npm run docs:build
```
- 启动服务
```
npm run VuepressWS
```
- 是否启动成功
```
visit http://[host]:[port]/helloworld
```
- 目录应如下
```
  -- vuepress-starter
   |-- .vuepressws
        |-- shell
              |-- ...
   |-- docs
        |-- ......
   |
   |-- config.js
   |-- package-lock.json
   |-- package.json
   |-- log  // 默认
        |-- log.log
```
- 配置文档仓库WebHook
    > 注意：使用前应确保代码托管平台能够访问到Webhook地址。
- end
### 使用源代码
- 克隆项目到本地
```
git clone https://github.com/lzjyzq2/VuePress-Webhooks-Builder.git
```
- 安装依赖
```
npm install
```
- 增加`config.js`  
同`使用npm`，应注意`validators`中路径。
```
validators: {
    "github": "./validator/github.js",
    "gitea": "./validator/github.js"
    // 使用自带github、gitea验证器时，应配置
    // platform、key、type、git
},
```
- 修改shell命令(可选)
    > 脚本位于`shell`文件夹下
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
- end
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
    validators: {
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
## 访问验证
如需对访问加以限制可在`config.js`中配置如下配置:
```
// 在config.js中配置
module.exports = {

    options:{
        
        //是否需要验证
        requireLogin:true,
        // 访问口令
        accessToken:"需要输入的验证口令",
    }
}
```