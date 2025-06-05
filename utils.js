const crypto = require('crypto');

 const calculateHash = (block) => {
 
         const { height, previousHash, timestamp, transactions, difficulty, blockReward, nonce, miner } = block;
         const txData = JSON.stringify(transactions);
         return crypto.createHash('sha256')
             .update(`${height}${previousHash}${timestamp}${txData}${difficulty}${blockReward}${nonce}${miner}`)
             .digest('hex');
 }


 const  calculateGenesisBlockHash = (block) => {
   const blockData = block.height + block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce + block.miner;
   return crypto.createHash('sha256').update(blockData).digest('hex');
 }

const createKeyPairCustom = () => {
    const keys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return keys;
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
    createKeyPairCustom,
    calculateHash,
    extractBase64Key,
    wrapKey,
    calculateGenesisBlockHash
};
