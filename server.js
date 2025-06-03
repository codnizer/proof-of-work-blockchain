const express = require('express');
const bodyParser = require('body-parser');
const { addTransactionToMempool, getAllMempoolTransactions, removeTransactionFromMempool } = require('./persistence/mempoolPersistence');
const { getAllBlocks, getLatestBlock, saveBlock } = require('./persistence/blockPersistence');
const { loadBlockchain, saveBlockchain } = require('./persistence/blockchainPersistence');
 const { getSolde } = require('./persistence/transactionPersistence');
 const { mineMempoolTransactions } = require('./persistence/mempoolPersistence');
const Block = require('./models/Block');

const app = express();
const PORT = 3000;

const crypto = require('crypto');
const { createNewMinerWallet } = require('./persistence/walletPersistence');

// Simple hash function for PoW
const calculateHash = (block) => {
    return crypto.createHash('sha256')
        .update(block.height + block.previousHash + block.timestamp + block.nonce + JSON.stringify(block.transactions))
        .digest('hex');
}

// Basic proof-of-work
const mineBlockPoW = (block, difficulty) => {
    const target = '0'.repeat(difficulty);
    while (!block.hash.startsWith(target)) {
        block.nonce++;
        block.hash = calculateHash(block);
    }
}

app.use(bodyParser.json());
 
// Health check
app.get('/', (req, res) => {
    res.send('🟢 uemfBlockchain server is running.');
});

app.post('/transaction', async (req, res) => {
    const tx = req.body;

    // You must add digital signature verification here

    try {
        await addTransactionToMempool(tx);
        res.status(200).send({ message: 'Transaction added to mempool.' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to add transaction.' });
    }
});

app.get('/mempool', async (req, res) => {
    try {
        const mempool = await getAllMempoolTransactions();
        res.status(200).json(mempool);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load mempool.' });
    }
});  
app.get('/solde', async (req, res) => {
    const address = req.body.address ;
    try {
        const balance = await getSolde(address);
        res.status(200).json({ address, balance });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance.' });
    }
}
);
app.post('/mine', async (req, res) => {
    if (!req.body.miner) {
        return res.status(400).json({ error: 'Miner address is required.' });
    }
    try {
        
    const block = await mineMempoolTransactions(req.body?.miner)
        res.status(200).json({ message: 'Mining completed successfully.',newBlock: block });
    }
    catch (error) {
        console.error('Mining error:', error);
        res.status(500).json({ error: 'Failed to mine transactions.' });
    }
    
});
app.get('/blocks', async (req, res) => {
    try {
        const blocks = await getAllBlocks();
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch blocks.' });
    }
});

app.get('/blocks/latest', async (req, res) => {
    try {
        const block = await getLatestBlock();
        res.json(block);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest block.' });
    }
});
app.post('/wallet/create', async (req, res) => {
    try {
        const keyPair = await createNewMinerWallet();
        res.status(201).json({
            message: 'New wallet created successfully.',
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey // ⚠️ In production, never expose this directly!
        });
    } catch (error) {
        console.error('Wallet creation error:', error);
        res.status(500).json({ error: 'Failed to create wallet.' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
