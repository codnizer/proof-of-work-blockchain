const fs = require('fs');
const { loadBlockchain } = require('./blockchainPersistence');
const { Transaction } = require('../models/Transaction'); // Assuming Transaction model is defined in models/transaction.js
const path = require('path');
const { verifySignatureCustom} = require('../utils'); // Assuming these functions are defined in utils.js
const { getBlock } = require('./blockPersistence'); // Assuming this function retrieves a block by its hash

const crypto = require('crypto');
 
const { getWalletByPublicKey } = require('./walletPersistence'); 

const getSolde = async (address) => {
    try {
        const blockchain = await loadBlockchain();

        if (!blockchain || !blockchain.head) {
            throw new Error('Blockchain is empty or not loaded');
        }

        let balance = 0;
        let currentBlockHash = blockchain.head;
        let currentBlock = await getBlock(currentBlockHash);
        while (currentBlock) {
            
            // If the address is the miner of the current block, add the block reward
            
            if (address === currentBlock.miner) {
                console.log("Adding block reward for miner:", currentBlock.miner);
                balance += currentBlock.blockReward || 0;
            }

            // Process transactions
            if (Array.isArray(currentBlock.transactions)) {
                for (const tx of currentBlock.transactions) {
                    if (tx.sender === address) {
                        balance -= (tx.amount || 0) + (tx.fees || 0);
                    } else if (tx.receipient === address) {
                        balance += (tx.amount || 0); // Only amount, NOT fees
                    }
                }
            }

            currentBlock = currentBlock.previousBlock; // Corrected field name to 'previousBlock'
        }

        return balance;
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
};


const verifierTransaction = async (transaction) => {
    try {
        const blockchain = await loadBlockchain();
        if (!blockchain || !blockchain.head) {
            throw new Error('Blockchain is empty or not loaded');
        }

        // Check if the transaction is already in the blockchain
        let currentBlock = blockchain.head;
        while (currentBlock) {
            if (currentBlock.transactions) {
                for (const tx of currentBlock.transactions) {
                    if (tx.hash === transaction.hash) {
                        return false; // Transaction already exists
                    }
                }
            }
            currentBlock = currentBlock.previous; // Assuming 'previous' points to the previous block
        }

         

    let data = transaction.sender + transaction.amount + transaction.receipient + transaction.fees
    let validSignature = verifySignatureCustom(data, transaction.sender, transaction.signature)
    if (!validSignature)
        return {
            valid: false,
            error: "invalid signature"
        }

    let solde = getSolde(transaction.sender)
    if (solde < transaction.amount + transaction.fees)
        return {
            valid: false,
            error: "pas de solde"
        }

    return {
        valid: true
    }



    } catch (error) {
        console.error('Error verifying transaction:', error);
        throw error;
    }
}




const validateTransaction = async (tx) => {
    const { signature, fees, amount, sender, receiver } = tx;

    // Validate structure
    if (!signature || fees == null || amount == null || !sender || !receiver) {
        throw new Error("Missing required transaction fields.");
    }

    if (fees < 0 || amount <= 0) {
        throw new Error("Invalid transaction fees or amount.");
    }

    // Check wallets exist
    console.log('receiver:', receiver);
    const senderWallet = await getWalletByPublicKey(sender);
    const receiverWallet = await getWalletByPublicKey(receiver);

    if (!senderWallet) {
        throw new Error("Sender wallet not found.");
    }

    if (!receiverWallet) {
        throw new Error("Receiver wallet not found.");
    }
    console.log("Sender Wallet:", senderWallet);

    // Check balance
   /*  const balance = senderWallet.solde; */
    const balance = await getSolde(sender);
    console.log("Balance of sender:", balance);
    if (balance < (amount + fees)) {
        throw new Error("Insufficient balance for transaction.");
    }

    // Verify signature (assumes tx hash is signature payload)
    const verify = crypto.createVerify('SHA256');
    verify.update(sender + receiver + amount + fees); // simplistic message structure
    verify.end();

    const isValidSignature = verify.verify(sender, signature, 'hex');
    if (!isValidSignature) {
        throw new Error("Invalid transaction signature.");
    }

    return true; // Transaction is valid
};



module.exports = {
    getSolde,
    verifierTransaction,
    validateTransaction
};