module.exports = {
    validators: {
        
    },
    options: {
        port: 3000,

        public: "./docs/.vuepress/dist",

        key: "document-key-adihwwd3445ada",

        platform: "github",

        method: "POST",

        type: "json",

        customUrl: "/webhook",

        responseSucc: {
            code: 200,
            message: "start pull"
        },

        responseFail: {
            code: 400,
            message: "validation failed"
        },
        responseErr: {
            code: 500,
            message: "wrong request"
        },
        git: "",
        log: true,
        logFormatter: "[[time]]:[[level]]: [message]",
        logTimeFormatter: "yyyy-MM-dd hh:mm:ss",
        logStorage: "./log/log.log"
    }
}