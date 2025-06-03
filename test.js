
const { saveBlockchain, loadBlockchain } = require('./persistence/blockchainPersistence');
 
const Blockchain = require('./models/Blockchain');
const myblockchain = new Blockchain("uemf",6,300,50,"uemfCoin");
 

 
 saveBlockchain(myblockchain).then((result) => {
    console.log('Blockchain saved:', result);
}
).catch((error) => {    
    console.error('Error saving blockchain:', error);       
}
)

// Load the blockchain

 loadBlockchain().then((data) => {  
    console.log(data)

}).catch((error) => {
    console.error('Error loading blockchain:', error);
}
)
 