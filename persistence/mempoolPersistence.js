
const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/mempool.json');
const Wallet = require('../models/Wallet'); // Assuming Wallet model is defined in models/wallet.js
const {getSolde  } = require('./transactionPersistence'); // Assuming this function retrieves the balance of an address
const { getAllBlocks, getLatestBlock, saveBlock } = require('./blockPersistence'); // Assuming these functions are defined in blockPersistence.js
const { loadBlockchain, saveBlockchain } = require('./blockchainPersistence');
 const Block = require('../models/Block'); // Assuming Block model is defined in models/block.js
const {getWalletByPublicKey,addOrUpdateWallet} = require('./walletPersistence'); // Assuming this function retrieves a wallet by its public key

const {validateTransaction} = require('./transactionPersistence')
const {wrapKeyPair} = require('../utils'); // Assuming this function wraps a key pair for storage
const crypto = require('crypto');
const calculateHash = (block) => {

        const { height, previousHash, timestamp, transactions, difficulty, blockReward, nonce, miner } = block;
        const txData = JSON.stringify(transactions);
        return crypto.createHash('sha256')
            .update(`${height}${previousHash}${timestamp}${txData}${difficulty}${blockReward}${nonce}${miner}`)
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
    await validateTransaction(transaction);
    console.log("Adding transaction to mempool:");
    try {
        let transactions = await getAllMempoolTransactions();
       /*  console.log(transactions) */
       transaction.mempool = true; // Mark transaction as in mempool
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
        
        console.log("Updated Recipient Wallet:", recipientWallet);
        await addOrUpdateWallet(recipientWallet);
        console.log("Transaction executed successfully");
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
        await submittedBlock.transactions.forEach(tx => {
            passTransaction(tx); 
            tx.block= submittedBlock.hash; // Link transaction to the block
            tx.mempool=false; // Mark transaction as not in mempool
        }
        );

        // Step 5: Save block
        submittedBlock.blockchain = blockchain.name;
        await saveBlock(submittedBlock);
        await removeTransactionFromMempool(submittedBlock.transactions);

        // Step 6: Update miner wallet
        let minerWallet = await getWalletByPublicKey(submittedBlock.miner);
        const totalFees = await submittedBlock.transactions.reduce((acc, tx) => acc + (tx.fees || 0), 0);
       console.log("Miner Wallet before update:", minerWallet);
        minerWallet.solde += submittedBlock.blockReward + totalFees;
        await submittedBlock.transactions.forEach(tx => {
minerWallet.minedTransactions.push(tx)
 }  );
        
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


module.exports = {validateAndSaveMinedBlock, getAllMempoolTransactions, saveMempoolTransactions, addTransactionToMempool, removeTransactionFromMempool };


