const axios = require('axios');
const crypto = require('crypto');
const readline = require('readline');

// Replace with your actual miner's public key
const MINER_PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0cNxFLxF7s9mfevxsseHKEIXtfm16rxIgbwzphyq5SP4r4UZ1KUyrDSvDyjJYuET9Q1XQHr+rZwlLWVEYi8I4DT9QtCf4LLRjZzfPGyaVj3lhibHzZmp1E474nL3H7vN14iB1INMnd4kXDxXk8TgBdgmQqlIRYkcu9oeLbSamxwR4lbxweL/+f/y98QfOXSqeiOCs2jfkmQsdcHVzDxISqRjYVnbuXvdXZYyNjhCqVYUvV6xasCvbMWOKWjmf/QL0fxv4p9cquhrjEFNAgikzFJmYsbaufmETWf/n+V3cSUV2qybb7Zu0GDPXjm5d7kWhphLo70pIirT2ExYpFe8TQIDAQAB";

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Simple hash function for blocks
function calculateHash(block) {
    const { height, previousHash, timestamp, transactions, difficulty, blockReward, nonce, miner } = block;
    const txData = JSON.stringify(transactions);
    return crypto.createHash('sha256')
        .update(`${height}${previousHash}${timestamp}${txData}${difficulty}${blockReward}${nonce}${miner}`)
        .digest('hex');
}

// Proof-of-work function
function mineBlock(block, difficulty) {
    const prefix = '0'.repeat(difficulty);
    while (true) {
        block.hash = calculateHash(block);
        if (block.hash.startsWith(prefix)) {
            return block;
        }
        block.nonce++;
    }
}

// Display transactions and let user select which ones to include
async function selectTransactions(mempool) {
    return new Promise((resolve) => {
        console.log("\n Available transactions in mempool:");
        mempool.forEach((tx, index) => {
            console.log(`[${index}] Sender: ${tx.sender.substring(0, 20)}...`);
            console.log(`    Receiver: ${tx.receiver.substring(0, 20)}...`);
            console.log(`    Amount: ${tx.amount} | Fees: ${tx.fees}`);
            console.log("----------------------------------------");
        });

        rl.question("\n Enter transaction numbers to include (comma separated, 'a' for all, 'n' for none): ", (answer) => {
            let selectedTransactions = [];
            
            if (answer.toLowerCase() === 'a') {
                selectedTransactions = [...mempool];
            } else if (answer.toLowerCase() !== 'n') {
                const indices = answer.split(',').map(num => parseInt(num.trim()));
                selectedTransactions = mempool.filter((_, index) => indices.includes(index));
            }
            
            console.log(`✅ Selected ${selectedTransactions.length} transactions to include in block`);
            resolve(selectedTransactions);
        });
    });
}

// Mining bot loop
async function startMining() {
    try {
        // Step 1: Fetch mining job
        const jobRes = await axios.get('http://localhost:3000/getMiningJob');
        const { height, previousHash, difficulty, blockReward, mempool } = jobRes.data;
        const timestamp = Date.now();

        // Step 2: Let miner select transactions
        const selectedTransactions = await selectTransactions(mempool);

        // Step 3: Build block with selected transactions
        let block = {
            height,
            hash: "", // To be calculated
            previousHash,
            timestamp,
            difficulty,
            blockReward,
            nonce: 0,
            miner: MINER_PUBLIC_KEY,
            transactions: selectedTransactions
        };

        console.log("\n⛏️  Mining new block...");
        const minedBlock = mineBlock(block, difficulty);
        console.log(`\n✅ Block mined with hash: ${minedBlock.hash}`);

        // Step 4: Submit block
        const submitRes = await axios.post('http://localhost:3000/submitBlock', {
            block: minedBlock
        });

        console.log("🧾 Server response:", submitRes.data.message);

    } catch (err) {
        console.error("❌ Mining failed:", err.response?.data?.error || err.message);
    }
}

// Start mining in a continuous loop
async function runMiningBot() {
    while (true) {
        await startMining();
        // Wait for 5 seconds before starting next mining cycle
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// Start the mining bot
console.log("Starting MinerBot with transaction selection...");
runMiningBot();

// Close readline interface on process exit
process.on('exit', () => {
    rl.close();
});