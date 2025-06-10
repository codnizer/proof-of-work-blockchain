# Local Proof-of-Work UEMF Blockchain with Node.js  
## Blockchain Visualization  

A Node.js implementation of a Proof-of-Work blockchain network featuring real-time block visualization, transaction management, and mining operations.

---

## Table of Contents  
- [Overview](#overview)  
- [Features](#features)  
- [System Architecture](#system-architecture)  
- [Getting Started](#getting-started)  
- [Usage Guide](#usage-guide)  
- [Project Structure](#project-structure)  
- [Customization](#customization)  
- [Contributing](#contributing)  

---

## Overview  

This project implements a simplified Proof-of-Work (PoW) blockchain system using Node.js. It provides hands-on experience with blockchain fundamentals including:

- Block generation with adjustable difficulty  
- Transaction management with digital signatures  
- Wallet creation and security  
- Mining operations with block rewards  
- Web-based visualization of blockchain data  

The system consists of three main components:

- Blockchain server (Node.js/Express)  
- Mining client (Node.js bot)  
- Web interface for interaction and visualization  

---

## Features  

### ✅ Blockchain Core  
- Proof-of-Work consensus algorithm  
- Adjustable mining difficulty  
- Customizable block intervals (default: 10 minutes)  
- File-based block storage  

### 💰 Wallet System  
- Public/private key pair generation  
- Digital signature verification  
- Balance tracking based on UTXO model  
- Genesis block distribution  

### 🔁 Transaction Management  
- Mempool for pending transactions  
- Transaction validation (signature, balance)  
- Transaction fee system  
- Manual signing process  

### ⛏️ Mining Operations  
- Block rewards (default: 50 uemfCoin)  
- Competitive mining process  
- Automated mining bot  
- Reward + fee distribution  

### 🌐 Web Interface  
- Real-time blockchain visualization  
- Mempool transaction viewer  
- Wallet creation and management  
- Transaction creation form  
- Blockchain explorer  

---

## System Architecture  

### Components  
- **Server (Blockchain Node)**  
  - Express.js HTTP server  
  - Block generation scheduler  
  - Transaction validation and mempool management  
  - File-based database storage  
  - API endpoints for blockchain operations  

- **Client (Miner Bot)**  
  - Automated mining operations  
  - Transaction submission  
  - Wallet generation (public/private keys)  
  - Manual transaction signing  

- **Web Application**  
  - Blockchain visualization  
  - Mempool viewer  
  - Transaction creation interface  
  - Wallet management  
  - Balance tracking  

---

## Getting Started  

### Prerequisites  
- Node.js (v18+)  
- npm (v9+)  

### Installation  
Clone the repository:

```bash
git clone https://github.com/codnizer/proof-of-work-blockchain.git
 
```

### Create the database directory

```bash
mkdir database
```

### Running the Server

```bash
npm start
```
The server will start on port 3000. Access the web interface at http://localhost:3000.

## Usage Guide
### Creating a Wallet
Navigate to the Wallet page

Click "Create New Wallet"

Securely store your public and private keys

During initialization (first 10 minutes), wallets receive 100 uemfCoin

### Sending Transactions
Use the provided Node.js script to sign transactions:

```bash
node sign-transaction.js <receiverPublicKey> <amount> <fees>
``` 
Copy the generated signature

Fill out the transaction form on the Transactions page

Submit the transaction to the mempool

### Mining Blocks
Create a miner wallet

Run the mining bot:

```bash
node mining-bot.js
``` 
The bot will automatically:

Fetch mining jobs

Solve proof-of-work puzzles

Submit valid blocks

Reward: 50 uemfCoin + transaction fees

### Exploring the Blockchain
Navigate to the Explorer page

View the blockchain visualization

Click on any block to see details

View transactions within each block

## Project Structure
```bash
uemf-blockchain/
├── models/                 # Data models  
│   ├── Block.js            # Block class  
│   ├── Blockchain.js       # Blockchain class  
│   ├── Transaction.js      # Transaction class  
│   └── Wallet.js           # Wallet class  
├── persistence/            # Data storage  
│   ├── blockchainPersistence.js  
│   ├── blockPersistence.js  
│   ├── mempoolPersistence.js  
│   ├── transactionPersistence.js  
│   └── walletPersistence.js  
├── public/                 # Web client  
│   ├── index.html  
│   ├── script.js  
│   └── styles.css  
├── utils.js                # Helper functions  
├── server.js               # Main server  
├── package.json  
└── README.md  
``` 

## Customization
You can customize the blockchain through parameters in models/Blockchain.js:

```bash
 
constructor(
  name = "uemfBlockchain",
  difficulty = 6,           // Mining difficulty (number of leading zeros)
  miningInterval = 600,     // Block time in seconds (default: 10 minutes)
  blockReward = 50,         // Miner reward per block
  denom = "uemfCoin"        // Currency denomination
)
```

## Contributing
Contributions are welcome!
Please follow these steps:

Fork the repository

Create your feature branch:

```bash
git checkout -b feature/your-feature
```

Commit your changes:

```bash
git commit -am 'Add some feature'
```

Push to the branch:

```bash
git push origin feature/your-feature
```

Open a pull request



