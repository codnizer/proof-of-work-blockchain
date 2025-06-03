    const API = "http://localhost:3000"; // change if hosted elsewhere
    
    // DOM Elements
    const elements = {
      transactionForm: document.getElementById("transactionForm"),
      balanceForm: document.getElementById("balanceForm"),
      refreshMempoolBtn: document.getElementById("refreshMempoolBtn"),
      mineBtn: document.getElementById("mineBtn"),
      txResult: document.getElementById("txResult"),
      balanceResult: document.getElementById("balanceResult"),
      mineResult: document.getElementById("mineResult"),
      mempoolList: document.getElementById("mempoolList"),
      mempoolEmpty: document.getElementById("mempoolEmpty"),
      mempoolCount: document.getElementById("mempoolCount"),
      balanceDisplay: document.querySelector('.balance-display'),
      balanceAddress: document.getElementById("balanceAddress"),
      blockHeight: document.getElementById("blockHeight"),
      nodeStatus: document.getElementById("nodeStatus"),
      apiEndpoint: document.getElementById("apiEndpoint"),
      createWalletBtn: document.getElementById("createWalletBtn"),
      walletResult: document.getElementById("walletResult"),
      publicKeyDisplay: document.getElementById("publicKeyDisplay"),
      privateKeyDisplay: document.getElementById("privateKeyDisplay"),
      
      // Buttons with spinners
      txBtn: document.getElementById("txBtn"),
      txBtnText: document.getElementById("txBtnText"),
      txSpinner: document.getElementById("txSpinner"),
      balanceBtn: document.getElementById("balanceBtn"),
      balanceBtnText: document.getElementById("balanceBtnText"),
      balanceSpinner: document.getElementById("balanceSpinner"),
      mineBtnText: document.getElementById("mineBtnText"),
      mineSpinner: document.getElementById("mineSpinner"),
      walletBtnText: document.getElementById("createWalletBtnText"),
      walletSpinner: document.getElementById("walletSpinner")
    };

    // Initialize the app
    function init() {
      // Set the API endpoint display
      elements.apiEndpoint.textContent = API;
      
      // Attach event listeners
      elements.transactionForm?.addEventListener("submit", handleTransactionSubmit);
      elements.balanceForm?.addEventListener("submit", handleBalanceCheck);
      elements.refreshMempoolBtn?.addEventListener("click", loadMempool);
      elements.mineBtn?.addEventListener("click", startMining);
      elements.createWalletBtn?.addEventListener("click", createWallet);
      
      // Attach copy event listeners
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', copyToClipboard);
      });
      
      // Initialize navigation
      initNavigation();
      
      // Load initial data if on relevant page
      if (document.querySelector('.page-container.active').id === 'transactions-page') {
        loadMempool();
      }
      
      checkNodeStatus();
    }

    // Initialize navigation
    function initNavigation() {
      // Handle nav link clicks
      document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const pageId = this.getAttribute('data-page');
          navigateTo(pageId);
        });
      });
      
      // Check for initial page from URL hash
      const hash = window.location.hash.substring(1);
      if (hash) {
        navigateTo(hash);
      }
    }
    
    // Navigate to a specific page
    function navigateTo(pageId) {
      // Hide all pages
      document.querySelectorAll('.page-container').forEach(page => {
        page.classList.remove('active');
      });
      
      // Show selected page
      const page = document.getElementById(`${pageId}-page`);
      if (page) {
        page.classList.add('active');
      } else {
        // Default to dashboard if page not found
        document.getElementById('dashboard-page').classList.add('active');
      }
      
      // Update active nav link
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      document.querySelector(`.nav-link[data-page="${pageId}"]`)?.classList.add('active');
      
      // Update URL hash
      window.location.hash = pageId;
      
      // Load data if needed
      if (pageId === 'transactions') {
        loadMempool();
      } else if (pageId === 'explorer') {
        loadBlockchain();
      }
    }

    // Handle transaction submission
    async function handleTransactionSubmit(e) {
      e.preventDefault();
      showLoading(elements.txBtn, elements.txBtnText, elements.txSpinner);

      let sender = document.getElementById("sender").value.trim();
      let receiver = document.getElementById("receiver").value.trim();

      // Convert escaped \n to real line breaks if needed
      if (sender.includes("\\n")) sender = sender.split("\\n").join("\n");
      if (receiver.includes("\\n")) receiver = receiver.split("\\n").join("\n");

      const tx = {
        sender,
        receiver,
        amount: parseFloat(document.getElementById("amount").value),
        fees: parseFloat(document.getElementById("fees").value),
        signature: document.getElementById("signature").value
      };

      try {
        const res = await fetch(`${API}/addTransaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx)
        });

        const data = await res.json();

        if (res.ok) {
          showResult(elements.txResult, "✅ Transaction added to mempool.", true);
          elements.transactionForm.reset();
          document.getElementById("fees").value = "0.1";
          loadMempool();
        } else {
          showResult(elements.txResult, `❌ Error: ${data.error || "Failed to add transaction"}`, false);
        }
      } catch (error) {
        showResult(elements.txResult, `❌ Network error: ${error.message}`, false);
      } finally {
        hideLoading(elements.txBtn, elements.txBtnText, elements.txSpinner);
      }
    }

    // Handle balance check
    async function handleBalanceCheck(e) {
      e.preventDefault();
      showLoading(elements.balanceBtn, elements.balanceBtnText, elements.balanceSpinner);

      const addressInput = document.getElementById("address");
      let address = addressInput?.value?.trim();

      // Convert visible \n into real line breaks, if needed
      if (address.includes("\\n")) {
        address = address.split("\\n").join("\n");
      }

      if (!address) {
        showResult(elements.balanceResult, "❌ Please enter a public key", false);
        hideLoading(elements.balanceBtn, elements.balanceBtnText, elements.balanceSpinner);
        return;
      }

      try {
        const res = await fetch(`${API}/solde`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ address })
        });

        const data = await res.json();
        console.log("Balance response:", data);

        if (res.ok) {
          elements.balanceDisplay.textContent = `${data.balance} UC`;
          elements.balanceAddress.textContent = address;
          elements.balanceAddress.title = address;
        } else {
          elements.balanceDisplay.textContent = "0.00 UC";
          showResult(elements.balanceResult, `❌ Error: ${data.error || "Address not found"}`, false);
        }
      } catch (error) {
        showResult(elements.balanceResult, `❌ Network error: ${error.message}`, false);
      } finally {
        hideLoading(elements.balanceBtn, elements.balanceBtnText, elements.balanceSpinner);
      }
    }

    // Load mempool transactions
    async function loadMempool() {
      try {
        const res = await fetch(`${API}/mempool`);
        const mempool = await res.json();
        
        if (!elements.mempoolList) return;
        
        elements.mempoolList.innerHTML = "";
        
        if (mempool.length === 0) {
          elements.mempoolEmpty.style.display = "block";
          elements.mempoolCount.textContent = "0";
          return;
        }
        
        elements.mempoolEmpty.style.display = "none";
        elements.mempoolCount.textContent = mempool.length;
        
        mempool.forEach(tx => {
          const txElement = document.createElement("div");
          txElement.className = "transaction-item";
          txElement.innerHTML = `
            <div class="d-flex justify-content-between">
              <div>
                <div class="fw-bold">${tx.amount} UC</div>
                <div class="small text-muted">Fee: ${tx.fees} UC</div>
              </div>
              <div class="text-end">
                <div class="small"><span class="text-primary">From:</span> <span class="address-truncate" title="${tx.sender}">${tx.sender.slice(0, 10)}...${tx.sender.slice(-8)}</span></div>
                <div class="small"><span class="text-success">To:</span> <span class="address-truncate" title="${tx.receiver}">${tx.receiver.slice(0, 10)}...${tx.receiver.slice(-8)}</span></div>
              </div>
            </div>
          `;
          elements.mempoolList.appendChild(txElement);
        });
      } catch (error) {
        console.error("Error loading mempool:", error);
      }
    }

    // Start mining process
    async function startMining() {
      showLoading(elements.mineBtn, elements.mineBtnText, elements.mineSpinner);
      
      const minerAddress = document.getElementById("minerAddress").value || "demo_miner";
      
      try {
        // Get mining job
        const jobRes = await fetch(`${API}/getMiningJob`);
        if (!jobRes.ok) throw new Error("Failed to get mining job");
        const job = await jobRes.json();
        
        // Create mined block
        const minedBlock = {
          height: job.height,
          previousHash: job.previousHash,
          transactions: job.mempool,
          nonce: Math.floor(Math.random() * 1e6),
          timestamp: Date.now(),
          miner: minerAddress
        };

        // Submit mined block
        const submitRes = await fetch(`${API}/submitBlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ block: minedBlock })
        });
        
        const data = await submitRes.json();
        
        if (submitRes.ok) {
          showResult(elements.mineResult, "✅ Block mined and submitted successfully!", true);
          // Refresh mempool
          loadMempool();
          // Update blockchain height
          checkNodeStatus();
        } else {
          showResult(elements.mineResult, `❌ Mining failed: ${data.error || "Unknown error"}`, false);
        }
      } catch (error) {
        showResult(elements.mineResult, `❌ Error: ${error.message}`, false);
      } finally {
        hideLoading(elements.mineBtn, elements.mineBtnText, elements.mineSpinner);
      }
    }

    // Create a new wallet
    async function createWallet(e) {
      e.preventDefault();  
      showLoading(elements.createWalletBtn, elements.walletBtnText, elements.walletSpinner);
      
      try {
        const res = await fetch(`${API}/wallet/create`, {
          method: "POST"
        });
        
        const data = await res.json();
        
        if (res.ok) {
          elements.publicKeyDisplay.textContent = data.publicKey;
          elements.privateKeyDisplay.textContent = data.privateKey;
          elements.walletResult.style.display = "block";
          
          // Add event listeners to new copy buttons
          document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', copyToClipboard);
          });
        } else {
          showResult(elements.walletResult, `❌ Error: ${data.error || "Failed to create wallet"}`, false);
        }
      } catch (error) {
        showResult(elements.walletResult, `❌ Network error: ${error.message}`, false);
      } finally {
        hideLoading(elements.createWalletBtn, elements.walletBtnText, elements.walletSpinner);
      }
    }

    // Copy key to clipboard
    function copyToClipboard(e) {
      const keyType = e.target.getAttribute('data-key');
      const text = keyType === 'public' 
        ? elements.publicKeyDisplay.textContent 
        : elements.privateKeyDisplay.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        const originalText = e.target.innerHTML;
        e.target.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
          e.target.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }

    // Check node status
    async function checkNodeStatus() {
      try {
        // Check root endpoint for health
        const healthRes = await fetch(`${API}/`);
        if (healthRes.ok) {
          elements.nodeStatus.innerHTML = '<i class="bi bi-circle-fill text-success me-1"></i> Node running';
        } else {
          throw new Error('Node not healthy');
        }
        
        // Get latest block for height
        const latestRes = await fetch(`${API}/blocks/latest`);
        if (latestRes.ok) {
          const latestBlock = await latestRes.json();
          elements.blockHeight.textContent = `Height: ${latestBlock.height || 0}`;
        } else {
          elements.blockHeight.textContent = 'Height: 0';
        }
      } catch (error) {
        elements.nodeStatus.innerHTML = '<i class="bi bi-circle-fill text-danger me-1"></i> Node not responding';
        elements.blockHeight.textContent = 'Height: --';
      }
    }

    // Show loading state
    function showLoading(button, buttonText, spinner) {
      if (!button || !buttonText || !spinner) return;
      button.disabled = true;
      buttonText.textContent = buttonText.textContent.replace("...", "");
      spinner.style.display = "inline-block";
    }

    // Hide loading state
    function hideLoading(button, buttonText, spinner) {
      if (!button || !buttonText || !spinner) return;
      button.disabled = false;
      spinner.style.display = "none";
    }

    // Show result message
    function showResult(element, message, isSuccess) {
      if (!element) return;
      element.textContent = message;
      element.className = isSuccess ? "mt-3 alert alert-success" : "mt-3 alert alert-danger";
      element.style.display = "block";
      
      // Auto-hide success messages after 5 seconds
      if (isSuccess) {
        setTimeout(() => {
          element.style.display = "none";
        }, 5000);
      }
    }

    // Blockchain Explorer Variables
    const BLOCKS_PER_PAGE = 5;
    let currentPage = 1;
    let totalPages = 1;
    let allBlocks = [];

    // DOM Elements for Blockchain Explorer
    const blockchainElements = {
      blockchainVisual: document.getElementById('blockchainVisual'),
      blocksContainer: document.getElementById('blocksContainer'),
      blockDetailView: document.getElementById('blockDetailView'),
      backToChainBtn: document.getElementById('backToChainBtn'),
      refreshBlockchainBtn: document.getElementById('refreshBlockchainBtn'),
      detailHeight: document.getElementById('detailHeight'),
      detailHash: document.getElementById('detailHash'),
      detailPreviousHash: document.getElementById('detailPreviousHash'),
      detailTimestamp: document.getElementById('detailTimestamp'),
      detailDifficulty: document.getElementById('detailDifficulty'),
      detailBlockReward: document.getElementById('detailBlockReward'),
      detailNonce: document.getElementById('detailNonce'),
      detailMiner: document.getElementById('detailMiner'),
      transactionsList: document.getElementById('transactionsList'),
      txCount: document.getElementById('txCount'),
      pagination: document.getElementById('pagination'),
      prevPageBtn: document.getElementById('prevPageBtn'),
      nextPageBtn: document.getElementById('nextPageBtn'),
      pageInfo: document.getElementById('pageInfo'),
      blockSearch: document.getElementById('blockSearch'),
      searchBlockBtn: document.getElementById('searchBlockBtn')
    };

    // Initialize Blockchain Explorer
    function initBlockchainExplorer() {
      // Load blockchain data
      loadBlockchain();
      
      // Attach event listeners
      blockchainElements.refreshBlockchainBtn?.addEventListener('click', loadBlockchain);
      blockchainElements.backToChainBtn?.addEventListener('click', () => {
        blockchainElements.blockDetailView.classList.remove('active');
      });
      blockchainElements.prevPageBtn?.addEventListener('click', () => changePage(-1));
      blockchainElements.nextPageBtn?.addEventListener('click', () => changePage(1));
      blockchainElements.searchBlockBtn?.addEventListener('click', searchBlock);
    }

    // Load blockchain data
    async function loadBlockchain() {
      try {
        const res = await fetch(`${API}/blocks`);
        allBlocks = await res.json();
        
        // Sort blocks by height descending (latest first)
        allBlocks.sort((a, b) => b.height - a.height);
        
        totalPages = Math.ceil(allBlocks.length / BLOCKS_PER_PAGE);
        currentPage = 1;
        
        renderBlocks();
        updatePagination();
      } catch (error) {
        console.error('Failed to load blockchain:', error);
        if (blockchainElements.blocksContainer) {
          blockchainElements.blocksContainer.innerHTML = `
            <div class="alert alert-danger">Failed to load blockchain data</div>
          `;
        }
      }
    }

    // Render blocks for current page
    function renderBlocks() {
      if (!blockchainElements.blocksContainer) return;
      
      blockchainElements.blocksContainer.innerHTML = '';
      
      const startIndex = (currentPage - 1) * BLOCKS_PER_PAGE;
      const endIndex = Math.min(startIndex + BLOCKS_PER_PAGE, allBlocks.length);
      const blocksToShow = allBlocks.slice(startIndex, endIndex);
      
      if (blocksToShow.length === 0) {
        blockchainElements.blocksContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-inbox fs-1 text-muted"></i>
            <p class="mt-2">No blocks found</p>
          </div>
        `;
        return;
      }
      
      blocksToShow.forEach(block => {
        const blockEl = document.createElement('div');
        blockEl.className = `block ${block.height === 0 ? 'genesis' : ''}`;
        blockEl.dataset.height = block.height;
        
        // Format timestamp
        const timestamp = new Date(block.timestamp).toLocaleString();
        
        blockEl.innerHTML = `
          <div class="block-header">
            <div class="block-height">Block #${block.height}</div>
            <div class="block-hash" title="${block.hash}">${truncateHash(block.hash)}</div>
          </div>
          
          <div class="block-details">
            <div class="block-detail">
              <div class="block-detail-label">Timestamp</div>
              <div>${timestamp}</div>
            </div>
            <div class="block-detail">
              <div class="block-detail-label">Miner</div>
              <div>${truncateHash(block.miner || 'Unknown')}</div>
            </div>
            <div class="block-detail">
              <div class="block-detail-label">Transactions</div>
              <div>${block.transactions.length}</div>
            </div>
            <div class="block-detail">
              <div class="block-detail-label">Difficulty</div>
              <div>${block.difficulty}</div>
            </div>
          </div>
          
          <div class="block-transactions">
            <span class="tx-count">${block.transactions.length} TX</span>
          </div>
        `;
        
        blockEl.addEventListener('click', () => showBlockDetail(block));
        blockchainElements.blocksContainer.appendChild(blockEl);
      });
    }

    // Show block detail view
    function showBlockDetail(block) {
      if (!blockchainElements.blockDetailView) return;
      
      blockchainElements.blockDetailView.classList.add('active');
      
      // Format timestamp
      const timestamp = new Date(block.timestamp).toLocaleString();
      
      // Set block details
      blockchainElements.detailHeight.textContent = block.height;
      blockchainElements.detailHash.textContent = block.hash;
      blockchainElements.detailPreviousHash.textContent = block.previousHash || 'Genesis Block';
      blockchainElements.detailTimestamp.textContent = timestamp;
      blockchainElements.detailDifficulty.textContent = block.difficulty;
      blockchainElements.detailBlockReward.textContent = `${block.blockReward} UC`;
      blockchainElements.detailNonce.textContent = block.nonce;
      blockchainElements.detailMiner.textContent = block.miner || 'Unknown';
      
      // Set transaction count
      blockchainElements.txCount.textContent = block.transactions.length;
      
      // Render transactions
      blockchainElements.transactionsList.innerHTML = '';
      
      if (block.transactions.length === 0) {
        blockchainElements.transactionsList.innerHTML = `
          <div class="alert alert-info">No transactions in this block</div>
        `;
      } else {
        block.transactions.forEach(tx => {
          console.log("Transaction:", tx);
          const txEl = document.createElement('div');
          txEl.className = 'tx-item';
          
          txEl.innerHTML = `
            <div class="tx-header">
              <div class="tx-amount">${tx.amount} UC</div>
              <div class="text-muted">Fee: ${tx.fees} UC</div>
            </div>
            <div class="tx-parties">
              <div class="tx-from" title="${tx.sender}">From: ${truncateHash(tx.sender)}</div>
              <div class="tx-arrow"><i class="bi bi-arrow-right"></i></div>
              <div class="tx-to" title="${tx.receiver}">To: ${truncateHash(tx.receiver)}</div>
            </div>
          `;
          
          blockchainElements.transactionsList.appendChild(txEl);
        });
      }
      
      // Scroll to detail view
      blockchainElements.blockDetailView.scrollIntoView({ behavior: 'smooth' });
    }

    // Helper function to truncate hashes
    function truncateHash(hash, startLength = 6, endLength = 4) {
      if (!hash || hash.length <= startLength + endLength) return hash;
      return `${hash.substring(0, startLength)}...${hash.substring(hash.length - endLength)}`;
    }

    // Change page
    function changePage(direction) {
      const newPage = currentPage + direction;
      
      if (newPage < 1 || newPage > totalPages) return;
      
      currentPage = newPage;
      renderBlocks();
      updatePagination();
    }

    // Update pagination controls
    function updatePagination() {
      if (!blockchainElements.pageInfo || !blockchainElements.prevPageBtn || !blockchainElements.nextPageBtn) return;
      
      blockchainElements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      blockchainElements.prevPageBtn.disabled = currentPage === 1;
      blockchainElements.nextPageBtn.disabled = currentPage === totalPages;
    }

    // Search for a block by height or hash
    function searchBlock() {
      const searchTerm = blockchainElements.blockSearch?.value?.trim();
      
      if (!searchTerm) {
        loadBlockchain();
        return;
      }
      
      // Try to parse as number (height)
      const height = parseInt(searchTerm);
      
      if (!isNaN(height)) {
        const block = allBlocks.find(b => b.height === height);
        if (block) {
          showBlockDetail(block);
          return;
        }
      }
      
      // Search by hash
      const block = allBlocks.find(b => 
        b.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.previousHash.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (block) {
        showBlockDetail(block);
      } else {
        alert('Block not found');
      }
    }

    // Initialize the application
    document.addEventListener("DOMContentLoaded", () => {
      init();
      initBlockchainExplorer();
    });