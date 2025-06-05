
const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/mempool.json');

const {getWalletByPublicKey,addOrUpdateWallet} = require('./walletPersistence'); // Assuming this function retrieves a wallet by its public key





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

 const addTransactionToMempool = async (transaction) => {
    
    const { validateTransaction } = require('./transactionPersistence');
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

const passTransactionFromMempool = async (transaction) => {
    
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






module.exports = {getAllMempoolTransactions, saveMempoolTransactions, addTransactionToMempool, removeTransactionFromMempool,passTransactionFromMempool };


