const axios = require('axios');
const crypto = require('crypto');

// Replace with your actual miner's public key
const MINER_PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsX92TbruUCX34je63MGTTmtCaARWnTMmPQmcLYP/z/bAhesOuwadwTElL6YXQB2evRTNIQ9FlyoxuwS1zmKBkkVL3Wwcyz8dO0QYq5ReFRcjSG/+KWRHhlRmV2+CTObfNxk1cTeCWJ8R969pz8gbovE2LfQmJgnJq9zIP0XgHcB32KQ8nuzfQD9B/xTrBvXUiCJV5sMxnez2lEc6x938udolss0QFcRpxuewH01UG72sM9rO8q2eSq0ckDIbMmm006WnHZ4zWbbpcSpC8ct2V5/151ifWt3f1F+ApMcKe6UGfRsuYeej+Dc09SyBusXY/CUrRU5dWw8ludNaZYbkyQIDAQAB";

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
