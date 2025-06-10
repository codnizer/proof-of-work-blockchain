
const { loadBlockchain } = require('./blockchainPersistence');
const { getBlock } = require('./blockPersistence'); 
const { wrapKey } = require('../utils');
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
        while (currentBlockHash) {
            const currentBlock = await getBlock(currentBlockHash);
            if (!currentBlock) break;
            // If the address is the miner of the current block, add the block reward and fees
            if (address === currentBlock.miner) {
                console.log("Adding block reward for miner");
                balance += currentBlock.blockReward || 0;
                console.log(currentBlock.blockReward);

                await currentBlock.transactions.forEach(tx => {
                        balance += tx.fees || 0;
                });
                console.log("Adding fees for miner");

                 console.log(balance);
            }

            // Process transactions in the block
            if (Array.isArray(currentBlock.transactions)) {
                for (const tx of currentBlock.transactions) {
                    if (tx.sender === address) {
                        balance -= (tx.amount || 0) + (tx.fees || 0);
                    } else if (tx.receiver === address) {
                        balance += tx.amount || 0;
                    } 
                }
            }

            currentBlockHash = currentBlock.previousHash;
        }

        return balance;
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
};


const validateTransaction = async (tx) => {
    const { signature, fees, amount, sender, receiver } = tx;

    // Validate structure
    if (!signature || fees == null || amount == null || !sender || !receiver) {
        throw new Error("Missing required transaction fields.");
    }

    if (fees < 0 || amount <= 0) {
        throw new Error("Invalid transaction fees or amount.");
    }

    
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
    const balance = await getSolde(sender);
    console.log("Balance of sender:", balance);
    if (balance < (amount + fees)) {
        throw new Error("Insufficient balance for transaction.");
    }

    // Verify signature
    const verify = crypto.createVerify('SHA256');
    verify.update(sender + receiver + amount + fees);
    verify.end();

    const pemSender = wrapKey(sender, 'public');
    const isValidSignature = verify.verify(pemSender, signature, 'hex');

    if (!isValidSignature) {
        throw new Error("Invalid transaction signature.");
    }

    return true; 
};




module.exports = {
    getSolde,
    validateTransaction
};