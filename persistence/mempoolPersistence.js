
const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/mempool.json');
const Wallet = require('../models/Wallet'); // Assuming Wallet model is defined in models/wallet.js
const {getSolde  } = require('./transactionPersistence'); // Assuming this function retrieves the balance of an address
const { getAllBlocks, getLatestBlock, saveBlock } = require('./blockPersistence'); // Assuming these functions are defined in blockPersistence.js
const { loadBlockchain, saveBlockchain } = require('./blockchainPersistence');
 const Block = require('../models/Block'); // Assuming Block model is defined in models/block.js
const {getWalletByPublicKey,addOrUpdateWallet} = require('./walletPersistence'); // Assuming this function retrieves a wallet by its public key
 const crypto = require('crypto');
const calculateHash = (block) => {
    return crypto.createHash('sha256')
        .update(block.height + block.previousHash + block.timestamp + block.nonce + JSON.stringify(block.transactions))
        .digest('hex');
}

 const getAllMempoolTransactions = async ( ) => {
    
         try{
            let transactions = await JSON.parse(await fs.readFile(pathDb, 'utf8'));
            if (transactions == null) {
                transactions = [];
            }
            return transactions;        

         }catch (error) {
            throw( error);
            }
}

const saveMempoolTransactions = async (transactions) => {
    try {
        const data = JSON.stringify(transactions, null, 2);
        await fs.writeFile(pathDb, data, 'utf8');
        return true;
    }
    catch (error) {
        throw( error);
    }
}

// should be 2 fuctions one only add to mempool and the other one add to mempool and update wallets
const addTransactionToMempool = async (transaction) => {
    console.log("Adding transaction to mempool:", transaction);
    try {
        let transactions = await getAllMempoolTransactions();
        console.log(transactions)
        transactions.push(transaction);
        await saveMempoolTransactions(transactions);

        return true;
    }
    catch (error) {
        console.log("Error adding transaction to mempool:", error);
        throw( error);
    }
}

const passTransaction = async (transaction) => {
    console.log("Executing transaction ", transaction);
    try {
        
        //update wallets of the sender and recipient
        let senderWallet = await getWalletByPublicKey(transaction.sender);
        console.log("Sender Wallet:", senderWallet);
        let recipientWallet = await getWalletByPublicKey(transaction.receiver);
        console.log("Recipient Wallet:", recipientWallet);
        senderWallet.solde =  senderWallet.solde- transaction.amount - transaction.fees;
        senderWallet.sentTransactions.push(transaction);
        recipientWallet.receivedTransactions.push(transaction);
        recipientWallet.solde = recipientWallet.solde + transaction.amount;
        await addOrUpdateWallet(senderWallet);
        await addOrUpdateWallet(recipientWallet);
        console.log("Transaction executed successfully:", transaction);
        return true;
    }
    catch (error) {
        console.log("Error executing transaction", error);
        throw( error);
    }
}


const removeTransactionFromMempool = async (transactionsToRemove) => {
    try {
        let transactions = await getAllMempoolTransactions();
        const signaturesToRemove = transactionsToRemove.map(t => t.signature);
        transactions = transactions.filter(t => !signaturesToRemove.includes(t.signature));
        await saveMempoolTransactions(transactions);
        return true;
    } catch (error) {
        console.error("Error removing transactions from mempool:", error);
        throw error;
    }
}

//it should be updated to take the entire block specific elements from frontend
const mineMempoolTransactions = async (miner) => {
    try {
        //should be updated to the selected transactions
        const transactions = await getAllMempoolTransactions();
        console.log(transactions);
        if (!transactions || transactions.length === 0) {
           throw new Error('No transactions to mine.');
        
        }

        const latestBlock = await getLatestBlock();
        const blockchain = await loadBlockchain();
        console.log("Blockchain loaded:", blockchain);

        const height = latestBlock ? latestBlock.height + 1 : 0;
        const previousBlock = latestBlock ? latestBlock.hash : '0';
        const timestamp = Date.now();
        const difficulty = blockchain.difficulty;
        const blockReward = blockchain.blockReward;
        

        // Create a block
        const newBlock = new Block(
            height,
            "", // hash will be calculated after PoW
            previousBlock,
            timestamp,
            difficulty,
            blockReward,
            0,
            miner
        );

        newBlock.transactions = transactions;
        newBlock.hash = calculateHash(newBlock);
      /*   mineBlockPoW(newBlock, difficulty); */
        newBlock.blockchain=blockchain.name;
        await transactions.forEach(tx => {
            passTransaction(tx); 
        }
        );
        await saveBlock(newBlock);
        await removeTransactionFromMempool(transactions) ; // Clear mempool
        console.log("New block miner:", newBlock.miner);
        let minerWallet = await getWalletByPublicKey(newBlock.miner);
        console.log("Miner Wallet:", minerWallet);
        let totalFees = transactions.reduce((acc, tx) => acc + (tx.fees || 0), 0);
        minerWallet.solde += newBlock.blockReward + totalFees; // Add block reward and total fees to miner's wallet
        await transactions.forEach(tx => {
        minerWallet.minedTransactions.push(tx)
        }  );
        console.log("Updated Miner Wallet:", minerWallet);
        await addOrUpdateWallet(minerWallet);
        blockchain.head = newBlock.hash; // Update blockchain head
        await saveBlockchain(blockchain)
        return  newBlock ;

    } catch (err) {
        console.error("Error during mining:");
        throw err;
    }
}


module.exports = { getAllMempoolTransactions, saveMempoolTransactions, addTransactionToMempool, removeTransactionFromMempool, mineMempoolTransactions };


