const fs = require('fs').promises;
const path = require('path');
const {
    getAllWallets,
    saveAllWallets,
    getWalletByPublicKey,
    addOrUpdateWallet
} = require('./persistence/walletPersistence');
const Wallet = require('./models/Wallet');

// Mock data
const testWallet1 = new Wallet('pubkey1');
testWallet1.solde = 100;
const testWallet2 = new Wallet('pubkey2');
testWallet2.solde = 200;

describe('Wallet Persistence', () => {
    beforeEach(async () => {
        // Clear wallet.json before each test
        try {
            await fs.writeFile(
                path.join(process.cwd(), 'database/wallet.json'),
                JSON.stringify([], null, 2),
                'utf8'
            );
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    });

    test('saveAllWallets should save wallets correctly', async () => {
        const result = await saveAllWallets([testWallet1, testWallet2]);
        expect(result).toBe(true);
        
        // Verify file content
        const fileContent = await fs.readFile(
            path.join(process.cwd(), 'database/wallet.json'),
            'utf8'
        );
        const savedWallets = JSON.parse(fileContent);
        
        expect(savedWallets.length).toBe(2);
        expect(savedWallets[0].pkey).toBe(testWallet1.pkey);
        expect(savedWallets[1].pkey).toBe(testWallet2.pkey);
    });

    test('getAllWallets should return all wallets', async () => {
        await saveAllWallets([testWallet1, testWallet2]);
        const wallets = await getAllWallets();
        
        expect(wallets.length).toBe(2);
        expect(wallets[0].pkey).toBe(testWallet1.pkey);
        expect(wallets[1].pkey).toBe(testWallet2.pkey);
    });

    test('getAllWallets should return empty array when no wallets exist', async () => {
        const wallets = await getAllWallets();
        expect(wallets).toEqual([]);
    });

    test('getWalletByPublicKey should return correct wallet', async () => {
        await saveAllWallets([testWallet1, testWallet2]);
        const wallet = await getWalletByPublicKey('pubkey1');
        
        expect(wallet).not.toBeNull();
        expect(wallet.pkey).toBe(testWallet1.pkey);
        expect(wallet.solde).toBe(testWallet1.solde);
    });

    test('getWalletByPublicKey should return null for non-existent wallet', async () => {
        await saveAllWallets([testWallet1]);
        const wallet = await getWalletByPublicKey('nonexistent');
        expect(wallet).toBeNull();
    });

    test('addOrUpdateWallet should add new wallet', async () => {
        await addOrUpdateWallet(testWallet1);
        const wallets = await getAllWallets();
        
        expect(wallets.length).toBe(1);
        expect(wallets[0].pkey).toBe(testWallet1.pkey);
    });

    test('addOrUpdateWallet should update existing wallet', async () => {
        // Add initial wallet
        await addOrUpdateWallet(testWallet1);
        
        // Update wallet
        const updatedWallet = new Wallet(testWallet1.pkey);
        updatedWallet.solde = 500;
        await addOrUpdateWallet(updatedWallet);
        
        const wallets = await getAllWallets();
        
        expect(wallets.length).toBe(1);
        expect(wallets[0].pkey).toBe(testWallet1.pkey);
        expect(wallets[0].solde).toBe(500);
    });

    test('addOrUpdateWallet should maintain multiple wallets', async () => {
        await addOrUpdateWallet(testWallet1);
        await addOrUpdateWallet(testWallet2);
        
        const wallets = await getAllWallets();
        
        expect(wallets.length).toBe(2);
        expect(wallets.find(w => w.pkey === testWallet1.pkey)).toBeDefined();
        expect(wallets.find(w => w.pkey === testWallet2.pkey)).toBeDefined();
    });
});