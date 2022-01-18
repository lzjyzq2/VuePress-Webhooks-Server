const crypto = require('crypto');

const gitub = function ({
    $config,
    $logger
}, req, item) {
    let flag = false;
    let header = req.headers;
    let body = req.body;

    $logger.info("start validation");

    if (header['x-gitea-event'] && header['content-type'].indexOf(item.type) != -1 && verify_repository(body, item.git)) {

        $logger.info("Delivery:" + header['x-gitea-delivery']);

        let signature = verify_signature(JSON.stringify(body, null, 2).trim(), item.key, 'sha256');

        if (signature === header['x-gitea-signature'] && body['secret'] === item.key) {
            $logger.info("validation successful");
            flag = true;
        }
    } else {
        $logger.warning("request header does not match the configuration")
    }

    return flag;
};

/**
 * 检查签名
 * @param {object} payload_body 载荷
 * @param {object} secrectKey 
 * @param {string} method 
 * @returns signature
 */
const verify_signature = function (payload_body, secrectKey, method) {
    let signature = crypto.createHmac(method, secrectKey)
        .update(payload_body)
        .digest()
        .toString('hex');
    return signature;
}

/**
 * 检查仓库是否正确
 * @param {object} body 载荷
 * @param {*} git 仓库地址
 * @returns 
 */
const verify_repository = function (body, git) {
    let repository = body['repository'];
    if (repository['ssh_url'] === git || repository['clone_url'] === git) {
        return true;
    } else {
        return false;
    }
}
module.exports = gitub;