const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/wallet.json');
const { createKeyPairCustom } = require('../utils'); // Assuming createKeyPairCustom is defined in utils.js
const  Wallet  = require('../models/Wallet'); // Assuming Wallet model is defined in models/wallet.js
const getAllWallets = async () => {
    try {
        const rawData = await fs.readFile(pathDb, 'utf8');
        if (!rawData.trim()) return []; // Handle empty file safely
        const wallets = JSON.parse(rawData);
        return wallets || [];
    } catch (error) {
        if (error.code === 'ENOENT') return []; // Handle file not found
        throw error;
    }
};


const saveAllWallets = async (wallets) => {
    try {
        const data = JSON.stringify(wallets, null, 2);
        await fs.writeFile(pathDb, data, 'utf8');
        return true;
    } catch (error) {
        throw error;
    }
}

const getWalletByPublicKey = async (pkey) => {
    try {
        const wallets = await getAllWallets();
        return wallets.find(w => w.pkey === pkey) || null;
    } catch (error) {
        throw error;
    }
}

const addOrUpdateWallet = async (wallet) => {
    try {
        let wallets = await getAllWallets();
        const existingIndex = wallets.findIndex(w => w.pkey === wallet.pkey);
        if (existingIndex >= 0) {
            wallets[existingIndex] = wallet;
        } else {
            wallets.push(wallet);
        }
        await saveAllWallets(wallets);
        return true;
    } catch (error) {
        throw error;
    }
}

const createNewMinerWallet = async () => {
    const keyPair = createKeyPairCustom();
    console.log('Creating new miner wallet...', keyPair);
    const newWallet = new Wallet(keyPair.publicKey);

    // Save wallet to the DB
    await addOrUpdateWallet(newWallet);

    // Show keys to the user (private key should be stored securely)
    console.log('Your Public Key (use for receiving/mining):\n', keyPair.publicKey);
    console.log('Your Private Key (keep secret!):\n', keyPair.privateKey);

    return keyPair;
};



module.exports = {
    getAllWallets,
    saveAllWallets,
    getWalletByPublicKey,
    addOrUpdateWallet,
    createNewMinerWallet
};