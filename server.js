const express = require('express');
const bodyParser = require('body-parser');
const { addTransactionToMempool, getAllMempoolTransactions, removeTransactionFromMempool } = require('./persistence/mempoolPersistence');
const { getAllBlocks, getLatestBlock } = require('./persistence/blockPersistence');
const { loadBlockchain } = require('./persistence/blockchainPersistence');
 const { getSolde } = require('./persistence/transactionPersistence');
 const { mineMempoolTransactions,validateAndSaveMinedBlock } = require('./persistence/mempoolPersistence');
const Block = require('./models/Block');
const Transaction = require('./models/Transaction');
const app = express();
const PORT = 3000;

const crypto = require('crypto');
const { createNewMinerWallet } = require('./persistence/walletPersistence');



 
app.use(express.json());
/* app.use(bodyParser.json()); */
 
// Health check
app.get('/', (req, res) => {
    res.send('🟢 uemfBlockchain server is running.');
});

app.post('/addTransaction', async (req, res) => {
    try {
        const { signature, fees, amount, receiver, sender } = req.body;

        // Validate input
        if (!signature || fees == null || amount == null || !receiver || !sender) {
            return res.status(400).json({ error: "Missing required transaction fields." });
        }

        // Create and add transaction
        const tx = new Transaction(signature, fees, amount, receiver, sender);
        await addTransactionToMempool(tx);

        res.status(200).json({ message: "Transaction added to mempool successfully.", transaction: tx });
    } catch (err) {
        console.error("Failed to add transaction:", err);
        res.status(500).json({ error: "Internal server error while adding transaction." });
    }
});


app.get('/getMiningJob', async (req, res) => {
    try {
        const transactions = await getAllMempoolTransactions();
        const latestBlock = await getLatestBlock();
        const blockchain = await loadBlockchain();

        const job = {
            previousHash: latestBlock ? latestBlock.hash : '0',
            height: latestBlock ? latestBlock.height + 1 : 0,
            difficulty: blockchain.difficulty,
            blockReward: blockchain.blockReward,
            mempool: transactions,
        };

        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/submitBlock', async (req, res) => {
    const submittedBlock = req.body.block;
    try {
        const savedBlock = await validateAndSaveMinedBlock(submittedBlock);
        res.status(200).json({ message: "Block accepted", block: savedBlock });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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

    
    try {
        
    const block = await validateAndSaveMinedBlock(req.body.block)
        res.status(200).json({ message: 'Mining completed successfully.',newBlock: block });
    }
    catch (error) {
        console.error('Mining error:', error);
        res.status(500).json({ error: 'Failed to mine transactions.' });
    }

   /*  if (!req.body.miner) {
        return res.status(400).json({ error: 'Miner address is required.' });
    }
    try {
        
    const block = await mineMempoolTransactions(req.body?.miner)
        res.status(200).json({ message: 'Mining completed successfully.',newBlock: block });
    }
    catch (error) {
        console.error('Mining error:', error);
        res.status(500).json({ error: 'Failed to mine transactions.' });
    } */
    
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
            privateKey: keyPair.privateKey 
        });
    } catch (error) {
        console.error('Wallet creation error:', error);
        res.status(500).json({ error: 'Failed to create wallet.' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
