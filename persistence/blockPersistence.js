const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/blocks');

 
const ensureBlocksDir = async () => {
    try {
        await fs.mkdir(pathDb, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

const saveBlock = async (block) => {
    try {
        await ensureBlocksDir();
        const filePath = path.join(pathDb, `${block.hash}.json`);
        const data = JSON.stringify(block, null, 2);
        await fs.writeFile(filePath, data, 'utf8');
        return true;
    } catch (error) {
        throw error;
    }
}

const getBlock = async (hash) => {
    try {
        const filePath = path.join(pathDb, `${hash}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

const getAllBlocks = async () => {
    try {
        await ensureBlocksDir();
        const files = await fs.readdir(pathDb);
        const blocks = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(pathDb, file), 'utf8');
                blocks.push(JSON.parse(data));
            }
        }

       return blocks.sort((a, b) => a.height - b.height); 
    } catch (error) {
        throw error;
    }
}

const getLatestBlock = async () => {
    try {
        const blocks = await getAllBlocks();
        return blocks.length > 0 ? blocks[blocks.length - 1] : null;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    saveBlock,
    getBlock,
    getAllBlocks,
    getLatestBlock
};