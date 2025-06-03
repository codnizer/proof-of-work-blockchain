const axios = require('axios');
const crypto = require('crypto');

// Replace with your actual miner's public key
const MINER_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkR43GqCp9+qhX3PZH8Lg\ngTLHJPpuCYeRloGmfn+UoVYt0650nzcek5hs0jbF9jm5gK6UQYwwxcK8DaIMVAR4\nhKfzHnG8ua+OrTGlHXwC/QRjnsHuun+meyCt+xTe7sQdnMO8GEALl75flhRyCPgF\nmszA0en51gqFgD6aSwssec0SZYeqQJUIlH3LKqMK3DesY97VltgH7K73uAstiaG7\n766LN+7e/+VZRq0SyNGsdIPd2VMGwiQLMS14ZohndX31Fgqf/ucRKj9wMeM6LYHj\n6A9SZ2mDIhOJ/0y4DepIRnttxK8nrOeOYfv2q+zdXpFIk/dEIbJrESlykCB/Gp50\n/wIDAQAB\n-----END PUBLIC KEY-----\n";

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

// Mining bot loop
async function startMining() {
    try {
        // Step 1: Fetch mining job
        const jobRes = await axios.get('http://localhost:3000/getMiningJob');
        const { height, previousHash, difficulty, blockReward, mempool } = jobRes.data;
        const timestamp = Date.now();

        // Step 2: Build block
        let block = {
            height,
            hash: "", // To be calculated
            previousHash,
            timestamp,
            difficulty,
            blockReward,
            nonce: 0,
            miner: MINER_PUBLIC_KEY,
            transactions: mempool
        };

        console.log("⛏️  Mining new block...");
        const minedBlock = mineBlock(block, difficulty);
        console.log(`✅ Block mined with hash: ${minedBlock.hash}`);

        // Step 3: Submit block
        const submitRes = await axios.post('http://localhost:3000/submitBlock', {
            block: minedBlock
        });

        console.log("🧾 Server response:", submitRes.data.message);

    } catch (err) {
        console.error("❌ Mining failed:", err.response?.data?.error || err.message);
    }
}

// Start mining every X seconds
setInterval(startMining, 15000); // 15 seconds per attempt
