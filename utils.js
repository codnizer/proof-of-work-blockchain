const crypto = require('crypto');

const createHashCustom = input => {
    const sha = crypto.createHash('sha256');
    sha.update(input);
    return sha.digest('hex');
};

const createKeyPairCustom = () => {
    const keys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return keys;
};

const signDataCustom = (message, privKey) => {
    const signer = crypto.createSign('SHA256');
    signer.update(message);
    return signer.sign(privKey, 'base64');
};

const verifySignatureCustom = (message, pubKey, sig) => {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(message);
    return verifier.verify(pubKey, sig, 'base64');
};

const checkProofOfWork = (hashed, difficulty) => {
    return hashed.startsWith('0'.repeat(difficulty));
};
function extractBase64Key(pemKey) {
  return pemKey
    .replace(/-----BEGIN (?:PUBLIC|PRIVATE) KEY-----\n?/, '')
    .replace(/-----END (?:PUBLIC|PRIVATE) KEY-----\n?/, '')
    .replace(/\r?\n/g, '');  
}

console.log(extractBase64Key("-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArp7Eu7xjrw8a6zU88T0T\ndYY993F1CuwLExrV6sntO7zsr/pYKJdZ4QUXPqgMN5F67jkyjxyNjjsfFiIWs80X\naO8CSEoeXR0ulMMVYGAOgS2OafIPsUxC3cjHhE197+UeRZW1WckiXUzhqciQ/LdM\nuUJtw6Zl6BC+URMMkPHJPKfgqHDTGFBd0v2NCw/g2Is3tCBNRqLAgBTXez3NpW3E\nIsspZoOd6ZjHCjvSr5VVJ/JMinEbTh5BOg9uEMSpjm0Em+7njWyfKQ3oSc0ehp6Y\nmTRR4TmskPFyblhGNIlTM/TJ71LqvgxgODAX4x0750cb3CIfHNv07g9gT8Ki4dr7\nMwIDAQAB\n-----END PUBLIC KEY-----\n"))
module.exports = {
    createHashCustom,
    createKeyPairCustom,
    signDataCustom,
    verifySignatureCustom,
    checkProofOfWork,
    extractBase64Key
};
