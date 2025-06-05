const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/blocks');
const { loadBlockchain, saveBlockchain } = require('./blockchainPersistence');
const { getAllMempoolTransactions, passTransactionFromMempool, removeTransactionFromMempool } = require('./mempoolPersistence');
const { getWalletByPublicKey, addOrUpdateWallet } = require('./walletPersistence');
const { calculateHash } = require('../utils');

const ensureBlocksDir = async () => {
    try {
        await fs.mkdir(pathDb, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

const saveBlock = async (block) => {
    try {
        await ensureBlocksDir();
        const filePath = path.join(pathDb, `${block.hash}.json`);
        const data = JSON.stringify(block, null, 2);
        await fs.writeFile(filePath, data, 'utf8');
        return true;
    } catch (error) {
        throw error;
    }
}

const getBlock = async (hash) => {
    try {
        const filePath = path.join(pathDb, `${hash}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

const getAllBlocks = async () => {
    try {
        await ensureBlocksDir();
        const files = await fs.readdir(pathDb);
        const blocks = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(pathDb, file), 'utf8');
                blocks.push(JSON.parse(data));
            }
        }

       return blocks.sort((a, b) => a.height - b.height); 
    } catch (error) {
        throw error;
    }
}

const getLatestBlock = async () => {
    try {
        const blocks = await getAllBlocks();
        return blocks.length > 0 ? blocks[blocks.length - 1] : null;
    } catch (error) {
        throw error;
    }
}

const validateAndSaveMinedBlock = async (submittedBlock) => {

    

    try {
        const blockchain = await loadBlockchain();
        const latestBlock = await getLatestBlock();

        // Step 1: Validate block structure
        if (!submittedBlock || !Array.isArray(submittedBlock.transactions)) {
            throw new Error("Invalid block structure.");
        }

        // Step 2: Validate previous hash
        if (submittedBlock.previousHash !== (latestBlock ? latestBlock.hash : '0')) {
            throw new Error("Invalid previous block hash.");
        }

        // Step 3: Recalculate hash and check difficulty
        const recalculatedHash = calculateHash(submittedBlock);
        if (recalculatedHash !== submittedBlock.hash) {
            throw new Error("Invalid block hash.");
        }

        const difficultyPrefix = '0'.repeat(blockchain.difficulty);
        if (!submittedBlock.hash.startsWith(difficultyPrefix)) {
            throw new Error("Block does not satisfy difficulty.");
        }

        // Step 4: Validate transactions (light check here; expand as needed)
        const allMempoolTxs = await getAllMempoolTransactions();
        const submittedTxIds = await submittedBlock.transactions.map(tx => tx.signature);
        const isTxValid = await submittedTxIds.every(signature => allMempoolTxs.find(tx => tx.signature === signature));

        if (!isTxValid) {
            throw new Error("Block contains invalid or outdated transactions.");
        }
        

        for (const tx of submittedBlock.transactions) {
    await passTransactionFromMempool(tx); 
    tx.block = submittedBlock.hash;
    tx.mempool = false;
}

        // Step 5: Save block
        submittedBlock.blockchain = blockchain.name;
        await saveBlock(submittedBlock);
        await removeTransactionFromMempool(submittedBlock.transactions);

        // Step 6: Update miner wallet
        let minerWallet = await getWalletByPublicKey(submittedBlock.miner);
        const totalFees = await submittedBlock.transactions.reduce((acc, tx) => acc + (tx.fees || 0), 0);
       console.log("Miner Wallet before update:", minerWallet);
        minerWallet.solde += submittedBlock.blockReward + totalFees;

         for (const tx of submittedBlock.transactions) {
minerWallet.minedTransactions.push(tx)
}

        await addOrUpdateWallet(minerWallet);

        // Step 7: Update chain head
        blockchain.head = submittedBlock.hash;
        await saveBlockchain(blockchain);

        return submittedBlock;

    } catch (err) {
        console.error("Error validating mined block:", err.message);
        throw err;
    }
};


module.exports = {
    saveBlock,
    getBlock,
    getAllBlocks,
    getLatestBlock,
    validateAndSaveMinedBlock
};