const fs = require('fs').promises;  
const path = require('path');
 
const pathDb = path.join(process.cwd(), 'database/blockchain.json');

const saveBlockchain = async (blockchain) => {
    try {
        const { name, difficulty, miningInterval, blockReward, denom, head } = blockchain;
        if (head != null) {
            blockchain.head = head.hash; 
        }
        const data = JSON.stringify( { name, difficulty, miningInterval, blockReward, denom, head }, null, 2);  
        await fs.writeFile(pathDb, data, 'utf8');  
        return true;
    } catch (error) {
        return false;
    }
}



const loadBlockchain = async () => {
    return new Promise((resolve, reject) => {
        fs.readFile(pathDb, 'utf8')
            .then(data => {
                const blockchain = JSON.parse(data);
                resolve(blockchain);
            })
            .catch(error => {
                reject(error);
            });
    }
    );
}
 
 
           

module.exports = { saveBlockchain,loadBlockchain };