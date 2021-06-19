const crypto = require('crypto');

const gitub = function ({
    $config,
    $logger
}, req) {
    let flag = false;
    let header = req.headers;
    let body = req.body;

    $logger.info("start validation");

    if (header['x-gitea-event']&& header['content-type'].indexOf($config.options.type) != -1 && verift_repository(body,$config.options.git)) {

        $logger.info("Delivery:" + header['x-gitea-delivery']);

        let signature = verify_signature(JSON.stringify(body,null,2).trim(), $config.options.key, 'sha256');

        if (signature === header['x-gitea-signature']&&body['secret']===$config.options.key) {
            $logger.info("validation successful");
            flag = true;
        }
    } else {
        $logger.warning("request header does not match the configuration")
    }
    
    return flag;
};

const verify_signature = function (payload_body, secrectKey, method) {
    let signature = crypto.createHmac(method, secrectKey)
        .update(payload_body)
        .digest()
        .toString('hex');
    return signature;
}
const verift_repository = function (body, git) {
    let repository = body['repository'];
    if (repository['ssh_url'] === git || repository['clone_url'] === git) {
        return true;
    }else{
        return false;
    }
}
module.exports = gitub;