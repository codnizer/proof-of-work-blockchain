const fs = require('fs').promises;
const path = require('path');
const {
    saveBlock,
    getBlock,
    getAllBlocks,
    getLatestBlock
} = require('../persistence/blockPersistence');
const Block = require('../models/Block');

 
const testBlock1 = new Block(
    3,
    '0000abc123',
    '0000prevha3h',
    Date.now(),
    4,
    50,
    12332,
    'miner3'
);
const testBlock2 = new Block(
    2,
    '0000def456',
    '0000abc123',
    Date.now() + 1000,
    4,
    50,
    67890,
    'miner2'
);
const test1 = async () => {
   await saveBlock(testBlock1);
   await saveBlock(testBlock2);
}
test1();
const test2 = async () => {
    const allblocks = await getAllBlocks()
console.log(allblocks);
}
return test2();










/* const testBlock2 = new Block(
    2,
    '0000def456',
    '0000abc123',
    Date.now() + 1000,
    4,
    50,
    67890,
    'miner2'
);



describe('Block Persistence', () => {
    beforeAll(async () => {
         
        try {
            const files = await fs.readdir(path.join(process.cwd(), 'database/blocks'));
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.unlink(path.join(process.cwd(), 'database/blocks', file));
                }
            }
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    });

    test('saveBlock should save a block successfully', async () => {
        const result = await saveBlock(testBlock1);
        expect(result).toBe(true);
        
        // Verify file was created
        const filePath = path.join(process.cwd(), 'database/blocks', `${testBlock1.hash}.json`);
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
    });

    test('getBlock should retrieve a saved block', async () => {
        await saveBlock(testBlock1);
        const retrievedBlock = await getBlock(testBlock1.hash);
        
        expect(retrievedBlock).not.toBeNull();
        expect(retrievedBlock.height).toBe(testBlock1.height);
        expect(retrievedBlock.hash).toBe(testBlock1.hash);
        expect(retrievedBlock.miner).toBe(testBlock1.miner);
    });

    test('getBlock should return null for non-existent block', async () => {
        const result = await getBlock('nonexistenthash');
        expect(result).toBeNull();
    });

    test('getAllBlocks should return all blocks in order', async () => {
        // Clear existing blocks
        const files = await fs.readdir(path.join(process.cwd(), 'database/blocks'));
        for (const file of files) {
            await fs.unlink(path.join(process.cwd(), 'database/blocks', file));
        }
        
        // Save blocks in reverse order
        await saveBlock(testBlock2);
        await saveBlock(testBlock1);
        
        const blocks = await getAllBlocks();
        
        expect(blocks.length).toBe(2);
        expect(blocks[0].hash).toBe(testBlock1.hash);
        expect(blocks[1].hash).toBe(testBlock2.hash);
    });

    test('getLatestBlock should return the block with highest height', async () => {
        // Clear existing blocks
        const files = await fs.readdir(path.join(process.cwd(), 'database/blocks'));
        for (const file of files) {
            await fs.unlink(path.join(process.cwd(), 'database/blocks', file));
        }
        
        // Save blocks
        await saveBlock(testBlock1);
        await saveBlock(testBlock2);
        
        const latestBlock = await getLatestBlock();
        
        expect(latestBlock).not.toBeNull();
        expect(latestBlock.height).toBe(testBlock2.height);
        expect(latestBlock.hash).toBe(testBlock2.hash);
    });

    test('getLatestBlock should return null when no blocks exist', async () => {
        // Clear existing blocks
        const files = await fs.readdir(path.join(process.cwd(), 'database/blocks'));
        for (const file of files) {
            await fs.unlink(path.join(process.cwd(), 'database/blocks', file));
        }
        
        const latestBlock = await getLatestBlock();
        expect(latestBlock).toBeNull();
    });
}); */