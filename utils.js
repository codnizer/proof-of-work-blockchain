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
function wrapKey(base64Key, type = 'public') {
  const header = type === 'private' ? '-----BEGIN PRIVATE KEY-----' : '-----BEGIN PUBLIC KEY-----';
  const footer = type === 'private' ? '-----END PRIVATE KEY-----' : '-----END PUBLIC KEY-----';
  const wrapped = base64Key.match(/.{1,64}/g).join('\n');
  return `${header}\n${wrapped}\n${footer}`;
}

module.exports = {
    createHashCustom,
    createKeyPairCustom,
    signDataCustom,
    verifySignatureCustom,
    checkProofOfWork,
    extractBase64Key,
    wrapKey
};
