const fs = require('fs');
const { loadBlockchain } = require('./blockchainPersistence');
const { Transaction } = require('../models/Transaction'); // Assuming Transaction model is defined in models/transaction.js
const path = require('path');
const { verifySignatureCustom} = require('../utils'); // Assuming these functions are defined in utils.js
const { getBlock } = require('./blockPersistence'); // Assuming this function retrieves a block by its hash
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
            // Reward for mining
            console.log("Current Block ", currentBlock);
            console.log("Current Block Miner:", currentBlock.miner);
            console.log("Address:", address);
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

module.exports = {
    getSolde,
    verifierTransaction
};