const crypto = require('crypto');

const gitub = function ({
    $config,
    $logger
}, req, item) {
    let flag = false;
    let header = req.headers;
    let body = req.body;
    $logger.info("start validation");
    if (/^GitHub-Hookshot/.test(header['user-agent']) && header['content-type'].indexOf(item.type) != -1 && verify_repository(body, item.git)) {
        $logger.info("Delivery:" + header['x-github-delivery']);
        let signature = verify_signature(JSON.stringify(body), item.key, 'sha256');
        if ('sha256=' + signature === header['x-hub-signature-256']) {
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
const verify_repository = function (body, git) {
    let repository = body['repository'];
    if (repository['git_url'] === git || repository['ssh_url'] === git || repository['clone_url'] === git || repository['svn_url'] === git) {
        return true;
    } else {
        return false;
    }
}
module.exports = gitub;