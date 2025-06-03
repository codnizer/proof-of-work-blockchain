
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
        }
        );

        // Step 5: Save block
        submittedBlock.blockchain = blockchain.name;
        await saveBlock(submittedBlock);
        await removeTransactionFromMempool(submittedBlock.transactions);

        // Step 6: Update miner wallet
        let minerWallet = await getWalletByPublicKey(submittedBlock.miner);
        const totalFees = await submittedBlock.transactions.reduce((acc, tx) => acc + (tx.fees || 0), 0);
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


module.exports = {validateAndSaveMinedBlock, getAllMempoolTransactions, saveMempoolTransactions, addTransactionToMempool, removeTransactionFromMempool, mineMempoolTransactions };


