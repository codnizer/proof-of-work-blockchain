const fs = require('fs').promises;
const path = require('path');
const pathDb = path.join(process.cwd(), 'database/wallet.json');
const { createKeyPairCustom } = require('../utils');
const Wallet = require('../models/Wallet');

const getAllWallets = async () => {
    try {
        const rawData = await fs.readFile(pathDb, 'utf8');
        if (!rawData.trim()) return [];

        const wallets = JSON.parse(rawData);
        // Ensure it's an array
        if (!Array.isArray(wallets)) throw new Error('Wallets file is corrupted');
        return wallets;
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error('Error reading wallets:', error);
        return []; // safer to return empty than crash
    }
};

const saveAllWallets = async (wallets) => {
    if (!Array.isArray(wallets)) throw new Error('Wallets must be an array');
    const data = JSON.stringify(wallets, null, 2);
    await fs.writeFile(pathDb, data, 'utf8');
};

const getWalletByPublicKey = async (pkey) => {
    const wallets = await getAllWallets();
    return wallets.find(w => w.pkey === pkey) || null;
};

const addOrUpdateWallet = async (wallet) => {
    const wallets = await getAllWallets();
    const existingIndex = wallets.findIndex(w => w.pkey === wallet.pkey);

    if (existingIndex !== -1) {
        wallets[existingIndex] = wallet;
    } else {
        wallets.push(wallet);
    }

    await saveAllWallets(wallets);
    return true;
};

const createNewMinerWallet = async () => {
    const keyPair = createKeyPairCustom();
    console.log('Creating new miner wallet...', keyPair);

    const newWallet = new Wallet(keyPair.publicKey);

    await addOrUpdateWallet(newWallet);

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
