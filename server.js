const express = require('express');
const { addTransactionToMempool, getAllMempoolTransactions } = require('./persistence/mempoolPersistence');
const { getAllBlocks, getLatestBlock,saveBlock } = require('./persistence/blockPersistence');
const { getSolde } = require('./persistence/transactionPersistence');
const { validateAndSaveMinedBlock } = require('./persistence/blockPersistence');
const Block = require('./models/Block');
const Transaction = require('./models/Transaction');
const app = express();
const Blockchain = require('./models/Blockchain'); 
 
const { createNewMinerWallet } = require('./persistence/walletPersistence');
const { loadBlockchain, saveBlockchain } = require('./persistence/blockchainPersistence');
const { getAllWallets, addOrUpdateWallet } = require('./persistence/walletPersistence');
const { calculateGenesisBlockHash }  = require('./utils');
const cors = require('cors');

const PORT = 3000;

app.use(cors()); 
app.use(express.json());
 

async function isInitialized() {
  try {
    const blockchain = await loadBlockchain();

    if (blockchain && blockchain.head) {
      return true; 
    }

    console.log('Blockchain not initialized yet.');
    // ** Do NOT wait here, just return to wait for wallets asynchronously **
    return false; // Not initialized yet

  } catch (error) {
    console.error('Error checking blockchain initialization:', error);
  }
}


async function waitAndInitializeGenesisBlock() {
  console.log('Waiting 5 minutes for wallets creation...');
  await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); 

  try {
    const blockchain = await loadBlockchain();
    
    if (blockchain && blockchain.head) {
      console.log('Blockchain was initialized while waiting.');
      return;
    }
    const wallets = await getAllWallets();
    if (wallets.length === 0) {
      console.error("No wallets created during the wait period.");
      return;
    }
    const totalInitialCoins = 1000;
    const amountPerWallet = Math.floor(totalInitialCoins / wallets.length);
    const genesisTransactions = wallets.map(w => ({
      sender: "0x0",
      receiver: w.pkey,
      amount: amountPerWallet,
      fees: 0,
      signature: "GENESIS_TRANSACTION",
    }));

    const genesisBlock = new Block(
      0,
      '',
      '0',
      new Date().toISOString(),
      0,
      0,
      0,
      'genesis'
    );
    genesisBlock.transactions = genesisTransactions;
    genesisBlock.hash = calculateGenesisBlockHash(genesisBlock);
    await saveBlock(genesisBlock);
    let myBlockchain = new Blockchain();
    myBlockchain.head = genesisBlock.hash;
    await saveBlockchain(myBlockchain);
    console.log('Genesis block created successfully.');

    for (const wallet of wallets) {
      wallet.solde += amountPerWallet;
      wallet.receivedTransactions.push(...genesisTransactions.filter(tx => tx.receiver === wallet.pkey));
      await addOrUpdateWallet(wallet);
    }
  } catch (error) {
    console.error('Error initializing genesis block after wait:', error);
  }
}

 
app.get('/', (req, res) => {
    res.send('UemfBlockchain server is running.');
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
app.post('/solde', async (req, res) => {
    const address = req.body.address ;
    
    try {
        const balance = await getSolde(address);
        console.log("Balance is", balance);
        res.status(200).json({ address, balance });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance.' });
    }
}
);
 
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

app.get('/wallets', async (req, res) => {
    try {
        const wallets = await getAllWallets();
        res.status(200).json(wallets);
        
    } catch (error) {
       
        res.status(500).json({ error: 'Failed to get wallets.' });
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
app.get('/isInitialized', async (req, res) => {
    try {
        const initialized = await isInitialized();
        console.log('Blockchain initialized:', initialized);
        res.status(200).json({ initialized });
    } catch (error) {
        console.error('Error checking initialization:', error);
        res.status(500).json({ error: 'Failed to check initialization.' });
    }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Check if blockchain is initialized right now
  const isinitialized = await isInitialized();
    if (isinitialized) {
      console.log('Blockchain is already initialized.');
       
    }else {
       waitAndInitializeGenesisBlock();
    }
});