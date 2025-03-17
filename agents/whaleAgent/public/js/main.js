document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const landingPage = document.getElementById('landing-page');
  const dashboard = document.getElementById('dashboard');
  const connectWalletBtn = document.getElementById('connect-wallet-btn');
  const fundBtn = document.getElementById('fund-btn');
  const fundModal = document.getElementById('fund-modal');
  const addFundsBtn = document.getElementById('add-funds-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const balanceElement = document.querySelector('.balance');
  const swapBtn = document.getElementById('swap-btn');
  const transactionModal = document.getElementById('transaction-modal');
  const closeTxBtn = document.getElementById('close-tx-modal');
  const txHash = document.getElementById('tx-hash');
  const whaleSummary = document.querySelector('.summary');
  const whaleTransactionTitle = document.querySelector('.transaction-details h3');
  const buysCount = document.getElementById('buys-count');
  const sellsCount = document.getElementById('sells-count');
  const sentiment = document.getElementById('sentiment');
  
  // New elements for blockchain integration
  const walletAddressEl = document.querySelector('.wallet-address');
  
  // Dynamically create token selection and amount input if they don't exist
  let tokenSelectEl = document.getElementById('token-select');
  if (!tokenSelectEl) {
    tokenSelectEl = document.createElement('select');
    tokenSelectEl.id = 'token-select';
    tokenSelectEl.className = 'token-select';
  }
  
  let amountInputEl = document.getElementById('amount-input');
  if (!amountInputEl) {
    amountInputEl = document.createElement('input');
    amountInputEl.id = 'amount-input';
    amountInputEl.className = 'amount-input';
    amountInputEl.type = 'number';
    amountInputEl.placeholder = 'Amount';
    amountInputEl.min = '0';
  }

  // Blockchain portfolio elements
  const ethBalanceEl = document.getElementById('eth-balance');
  const usdcBalanceEl = document.getElementById('usdc-balance');
  const servBalanceEl = document.getElementById('serv-balance');
  const refreshPortfolioBtn = document.getElementById('refresh-portfolio');
  
  // Swap modal elements
  const swapModal = document.getElementById('swap-modal');
  const fromTokenEl = document.getElementById('from-token');
  const toTokenEl = document.getElementById('to-token');
  const fromAmountEl = document.getElementById('from-amount');
  const toAmountEl = document.getElementById('to-amount');
  const swapRateEl = document.getElementById('swap-rate');
  const executeSwapBtn = document.getElementById('execute-swap-btn');
  const explorerLinkEl = document.getElementById('explorer-link');

  // Variables
  let balance = 100;
  let buys = 8;
  let sells = 3;
  let telegramUpdateInterval;
  let whaleUpdateInterval;
  let walletAddress = '0x1234...abcd'; // Default display address
  let walletPrivateKey = ''; // This would be securely stored in a real app
  let availableTokens = [];
  let selectedToken = 'ETH';
  let goatAgentAvailable = false;
  
  // Backend URLs - Use relative URLs to avoid CORS issues
  const backendUrl ='http://localhost:4000';
  const telegramAgentUrl = 'http://localhost:4000'; // Default to same origin
  const goatAgentUrl = window.location.origin; // Default to same origin
  
  // Try to get the actual telegram URL from the backend
  fetch(`${backendUrl}/api/telegram-url`)
    .then(response => response.json())
    .then(data => {
      if (data && data.url) {
        console.log('Using Telegram agent URL:', data.url);
      }
    })
    .catch(error => {
      console.warn('Could not get Telegram agent URL, using default:', error);
    });
  
  // Try to get the actual goat agent URL
  fetch(`${backendUrl}/api/goat-url`)
    .then(response => response.json())
    .then(data => {
      if (data && data.url) {
        console.log('Using Goat agent URL:', data.url);
        // Check if GoatAgent is available by fetching available tokens
        fetchAvailableTokens();
      }
    })
    .catch(error => {
      console.warn('Could not get Goat agent URL, using mock data:', error);
    });
    
  const whaleAddress = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
  const threshold = 0.0001; // Lower threshold to catch more transactions
  const defaultToken = 'ARB'; // Default token for sentiment analysis
  
  // Blockchain integration functions
  async function fetchAvailableTokens() {
    try {
      const response = await fetch(`${backendUrl}/api/goat/tokens`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        availableTokens = data.data.tokens;
        goatAgentAvailable = true;
        updateTokenSelector();
        console.log('Available tokens:', availableTokens);
      } else if (data.mockData) {
        availableTokens = data.mockData.tokens;
        updateTokenSelector();
        console.log('Using mock token data');
      } else {
        throw new Error('Failed to get token list');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      // Default tokens
      availableTokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 3500 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1 },
        { symbol: 'SERV', name: 'OpenServ', decimals: 18, price: 2.5 }
      ];
      updateTokenSelector();
    }
  }
  
  function updateTokenSelector() {
    // Clear existing options
    tokenSelectEl.innerHTML = '';
    
    // Add options for each token
    availableTokens.forEach(token => {
      const option = document.createElement('option');
      option.value = token.symbol;
      option.textContent = `${token.symbol} - ${token.name}`;
      tokenSelectEl.appendChild(option);
    });
    
    // Add to fund modal if not already present
    const modalBody = document.querySelector('.modal-body');
    if (modalBody && !document.getElementById('token-select')) {
      // Create token selection section
      const tokenSection = document.createElement('div');
      tokenSection.className = 'token-section';
      tokenSection.innerHTML = `
        <h3>Select Token</h3>
        <div class="input-group">
          <label for="token-select">Token:</label>
        </div>
        <div class="input-group">
          <label for="amount-input">Amount:</label>
        </div>
      `;
      
      // Append elements
      const inputGroups = tokenSection.querySelectorAll('.input-group');
      inputGroups[0].appendChild(tokenSelectEl);
      inputGroups[1].appendChild(amountInputEl);
      
      modalBody.insertBefore(tokenSection, addFundsBtn);
    }
  }
  
  async function fetchWalletBalance(privateKey = walletPrivateKey) {
    if (!goatAgentAvailable || !privateKey) {
      return { balance: '100.00', symbol: 'ETH', usdValue: '350000.00' };
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/goat/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privateKey })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else if (data.mockData) {
        return data.mockData;
      }
      
      throw new Error('Failed to get wallet balance');
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return { balance: '100.00', symbol: 'ETH', usdValue: '350000.00' };
    }
  }
  
  async function fetchTokenBalance(token, privateKey = walletPrivateKey) {
    if (!goatAgentAvailable || !privateKey) {
      return { balance: '1000.00', symbol: token, usdValue: '1000.00' };
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/goat/token-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privateKey, token })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else if (data.mockData) {
        return data.mockData;
      }
      
      throw new Error(`Failed to get ${token} balance`);
    } catch (error) {
      console.error(`Error fetching ${token} balance:`, error);
      return { balance: '1000.00', symbol: token, usdValue: '1000.00' };
    }
  }
  
  async function sendTransaction(to, amount, privateKey = walletPrivateKey) {
    if (!goatAgentAvailable || !privateKey) {
      return { txHash: generateMockTxHash() };
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/goat/send-eth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privateKey, to, amount })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else if (data.mockData) {
        return data.mockData;
      }
      
      throw new Error('Failed to send transaction');
    } catch (error) {
      console.error('Error sending transaction:', error);
      return { txHash: generateMockTxHash() };
    }
  }
  
  async function transferToken(token, to, amount, privateKey = walletPrivateKey) {
    if (!goatAgentAvailable || !privateKey) {
      return { txHash: generateMockTxHash() };
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/goat/transfer-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privateKey, token, to, amount })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else if (data.mockData) {
        return data.mockData;
      }
      
      throw new Error(`Failed to transfer ${token}`);
    } catch (error) {
      console.error(`Error transferring ${token}:`, error);
      return { txHash: generateMockTxHash() };
    }
  }
  
  async function updateBalanceDisplay() {
    const balanceData = await fetchWalletBalance();
    balance = parseFloat(balanceData.balance);
    const usdValue = parseFloat(balanceData.usdValue);
    
    balanceElement.textContent = `${balance.toFixed(2)} ${balanceData.symbol} ($${usdValue.toFixed(2)})`;
  }
  
  // Function to update portfolio balances
  async function updatePortfolio() {
    try {
      // Fetch ETH balance
      const ethBalance = await fetchWalletBalance();
      if (ethBalanceEl) {
        ethBalanceEl.textContent = `${parseFloat(ethBalance.balance).toFixed(4)} ETH ($${parseFloat(ethBalance.usdValue).toFixed(2)})`;
      }
      
      // Fetch USDC balance
      const usdcBalance = await fetchTokenBalance('USDC');
      if (usdcBalanceEl) {
        usdcBalanceEl.textContent = `${parseFloat(usdcBalance.balance).toFixed(2)} USDC ($${parseFloat(usdcBalance.usdValue).toFixed(2)})`;
      }
      
      // Fetch SERV balance
      const servBalance = await fetchTokenBalance('SERV');
      if (servBalanceEl) {
        servBalanceEl.textContent = `${parseFloat(servBalance.balance).toFixed(4)} SERV ($${parseFloat(servBalance.usdValue).toFixed(2)})`;
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      // Use mock data as fallback
      if (ethBalanceEl) ethBalanceEl.textContent = '0.5432 ETH ($1,901.20)';
      if (usdcBalanceEl) usdcBalanceEl.textContent = '1,500.00 USDC ($1,500.00)';
      if (servBalanceEl) servBalanceEl.textContent = '250.00 SERV ($625.00)';
    }
  }
  
  // Function to calculate swap amount based on rate
  function calculateSwapAmount() {
    const fromToken = fromTokenEl.value;
    const toToken = toTokenEl.value;
    const fromAmount = parseFloat(fromAmountEl.value) || 0;
    
    let rate = 1;
    
    // Simple mock rates (in a real app, these would come from a price oracle or DEX API)
    if (fromToken === 'ETH' && toToken === 'USDC') {
      rate = 3500;
    } else if (fromToken === 'ETH' && toToken === 'SERV') {
      rate = 1400;
    }
    
    // Calculate amount with 0.3% fee
    const toAmount = fromAmount * rate * 0.997;
    
    // Update UI
    toAmountEl.value = toAmount.toFixed(6);
    swapRateEl.textContent = `1 ${fromToken} = ${rate} ${toToken}`;
  }
  
  // Function to update explorer link
  function updateExplorerLink(txHash) {
    if (!explorerLinkEl) return;
    
    // Use Etherscan for real blockchain addresses
    const etherscanBaseUrl = 'https://etherscan.io/tx/';
    explorerLinkEl.href = etherscanBaseUrl + txHash;
  }

  // Helper Functions
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.getElementById('toast-container').appendChild(toast);
    
    // Remove toast after animation completes
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
  
  function generateMockTxHash() {
    return '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
  
  function generateMockPrivateKey() {
    return '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
  
  function updateTelegramInsights() {
    // Randomly increment buys and sells
    buys += Math.floor(Math.random() * 3);
    sells += Math.floor(Math.random() * 2);
    buysCount.textContent = buys;
    sellsCount.textContent = sells;
    
    // Update sentiment based on buy/sell ratio
    const ratio = buys / (buys + sells);
    if (ratio > 0.6) {
      sentiment.className = 'value positive';
      sentiment.innerHTML = 'Positive <i class="fas fa-arrow-up"></i>';
    } else if (ratio < 0.4) {
      sentiment.className = 'value negative';
      sentiment.innerHTML = 'Negative <i class="fas fa-arrow-down"></i>';
    } else {
      sentiment.className = 'value neutral';
      sentiment.innerHTML = 'Neutral <i class="fas fa-equals"></i>';
    }
  }
  
  async function fetchWhaleData() {
    try {
      console.log('Fetching whale data...');
      const response = await fetch(`${backendUrl}/api/whale-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          whaleAddress: whaleAddress,
          threshold: threshold
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch whale data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Whale data received:', data);
      
      if (data.status === 'success') {
        // Use real data if available, or fall back to mocked display
        if (data.data.transactions && data.data.transactions.length > 0) {
          const tx = data.data.transactions[0];
          const formattedAmount = parseFloat(tx.amount).toFixed(2);
          whaleTransactionTitle.textContent = `Whale ${tx.type === 'buy' ? 'buying' : 'selling'} ${formattedAmount} of $USDC`;
          whaleSummary.textContent = data.data.summary;
        } else {
          // No transactions found, show mock data for demo
          whaleTransactionTitle.textContent = 'Whale buying 1.2 ETH of $ARB';
          whaleSummary.textContent = data.data.summary || 'No significant transactions detected';
        }
      } else {
        throw new Error(data.message || 'Error fetching whale data');
      }
    } catch (error) {
      console.error('Error fetching whale data:', error);
      // Fallback to mock data on error
      whaleTransactionTitle.textContent = 'Whale buying 1.2 ETH of $ARB';
      whaleSummary.textContent = 'Mock data - API error occurred';
    }
  }
  
  // New function to fetch Telegram sentiment data
  async function fetchTelegramSentiment() {
    try {
      // Try to get the current token from the whale transaction title
      let token = defaultToken;
      const titleText = whaleTransactionTitle.textContent || '';
      const tokenMatch = titleText.match(/\$([A-Z]+)/);
      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1];
      }
      
      console.log(`Fetching Telegram sentiment for ${token}`);
      
      // Try the main endpoint first (if we're running inside the agent)
      const response = await fetch(`${backendUrl}/api/telegram/sentiment/${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch telegram sentiment data');
      }
      
      const data = await response.json();
      console.log('Telegram sentiment data:', data);
      
      // Update the UI with real sentiment data
      buysCount.textContent = data.buys;
      sellsCount.textContent = data.sells;
      
      // Update sentiment indication
      sentiment.className = `value ${data.sentiment}`;
      let sentimentIcon = 'fa-equals';
      if (data.sentiment === 'positive') sentimentIcon = 'fa-arrow-up';
      else if (data.sentiment === 'negative') sentimentIcon = 'fa-arrow-down';
      
      sentiment.innerHTML = `${data.sentiment.charAt(0).toUpperCase() + data.sentiment.slice(1)} <i class="fas ${sentimentIcon}"></i>`;
      
      // Update last update time
      updateLastUpdateTime();
      
    } catch (error) {
      console.error('Error fetching Telegram sentiment:', error);
      // Fall back to the random method if the API fails
      updateTelegramInsights();
    }
  }
  
  // Replace the updateTelegramInsights function with a wrapper
  const originalUpdateTelegramInsights = updateTelegramInsights;
  updateTelegramInsights = function() {
    // Try to fetch real data first, fall back to random generation
    fetchTelegramSentiment().catch(() => {
      console.log('Falling back to mock telegram data');
      originalUpdateTelegramInsights();
    });
  };
  
  // Create placeholder SVG for landing page if needed
  if (!document.querySelector('.hero-image').src) {
    const svgPlaceholder = `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#1f2937"/>
      <path d="M100,200 Q150,100 200,200 T300,200" stroke="#2563eb" stroke-width="8" fill="none"/>
      <circle cx="100" cy="200" r="15" fill="#2563eb"/>
      <circle cx="200" cy="200" r="25" fill="#2563eb"/>
      <circle cx="300" cy="200" r="20" fill="#2563eb"/>
      <path d="M0,250 Q100,200 200,250 T400,250" stroke="#1d4ed8" stroke-width="5" fill="none"/>
    </svg>`;
    
    document.querySelector('.hero-image').outerHTML = svgPlaceholder;
  }

  // Add tooltip functionality
  const infoIcon = document.querySelector('.info-icon');
  if (infoIcon) {
    let tooltip = null;
    
    infoIcon.addEventListener('mouseenter', () => {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'WhaleTraderAI helps you follow smart money movements';
      tooltip.style.position = 'absolute';
      tooltip.style.background = 'var(--card-bg)';
      tooltip.style.padding = '10px';
      tooltip.style.borderRadius = 'var(--border-radius)';
      tooltip.style.boxShadow = 'var(--shadow)';
      tooltip.style.zIndex = '1000';
      
      document.body.appendChild(tooltip);
      
      const rect = infoIcon.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
      tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth / 2}px`;
    });
    
    infoIcon.addEventListener('mouseleave', () => {
      if (tooltip) {
        document.body.removeChild(tooltip);
        tooltip = null;
      }
    });
  }

  // Update last update time every minute
  function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
      const now = new Date();
      lastUpdateEl.textContent = now.toLocaleTimeString();
    }
  }

  // Initial update and set interval
  updateLastUpdateTime();
  setInterval(updateLastUpdateTime, 60000);

  // Event Listeners
  connectWalletBtn.addEventListener('click', function() {
    // Show loading state
    connectWalletBtn.textContent = 'Connecting...';
    connectWalletBtn.disabled = true;
    
    console.log('Connect wallet button clicked');
    
    // Generate a mock private key for demo purposes
    // In a real app, you would use a wallet provider like MetaMask
    walletPrivateKey = generateMockPrivateKey();
    
    // Simulate connection delay
    setTimeout(() => {
      try {
        console.log('Switching to dashboard...');
        
        // Make sure we have the elements
        if (!landingPage) {
          console.error('Landing page element not found!');
        }
        if (!dashboard) {
          console.error('Dashboard element not found!');
        }
        
        // Generate a random wallet address (in a real app, this would come from the wallet provider)
        walletAddress = '0x' + Math.random().toString(36).substring(2, 10) + '...' + Math.random().toString(36).substring(2, 6);
        if (walletAddressEl) {
          walletAddressEl.textContent = walletAddress;
        }
        
        // Switch pages
        landingPage.classList.remove('active');
        landingPage.classList.add('hidden');
        dashboard.classList.remove('hidden');
        dashboard.classList.add('active');
        
        showToast('Wallet Connected!');
        
        // Update balance with blockchain data if available
        updateBalanceDisplay().catch(err => {
          console.error('Error updating balance:', err);
        });
        
        // Ensure these don't prevent dashboard display if they fail
        try {
          // Fetch initial data
          console.log('Fetching initial data...');
          fetchWhaleData().catch(err => {
            console.error('Error in initial whale data fetch:', err);
            // Still show something
            whaleTransactionTitle.textContent = 'Whale buying 1.2 ETH of $ARB';
            whaleSummary.textContent = 'Connecting to blockchain data...';
          });
          
          // Try to fetch telegram data
          fetchTelegramSentiment().catch(err => {
            console.error('Error in initial telegram sentiment fetch:', err);
            updateTelegramInsights(); // Use random data as fallback
          });
          
          // Set up polling intervals with error handling
          whaleUpdateInterval = setInterval(() => {
            fetchWhaleData().catch(err => console.error('Error in whale data polling:', err));
          }, 10000);
          
          telegramUpdateInterval = setInterval(() => {
            fetchTelegramSentiment().catch(err => {
              console.error('Error in telegram polling:', err);
              updateTelegramInsights(); // Use random data as fallback
            });
          }, 10000);
          
        } catch (error) {
          console.error('Error setting up data fetching:', error);
          // Still show something
          updateTelegramInsights();
        }

        // Update portfolio
        updatePortfolio();
        
      } catch (error) {
        console.error('Error in dashboard transition:', error);
        // Try a direct approach if the fancy way fails
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
      }
    }, 1500);
  });
  
  fundBtn.addEventListener('click', function() {
    fundModal.classList.remove('hidden');
  });
  
  addFundsBtn.addEventListener('click', async function() {
    // Get token and amount from inputs
    const token = tokenSelectEl.value || 'ETH';
    const amount = amountInputEl.value || '100';
    
    // Show processing state
    addFundsBtn.textContent = 'Processing...';
    addFundsBtn.disabled = true;
    
    try {
      let result;
      if (token === 'ETH') {
        // For demo purposes, we're "sending to self" to simulate adding funds
        result = await sendTransaction(walletAddress, amount);
      } else {
        result = await transferToken(token, walletAddress, amount);
      }
      
      fundModal.classList.add('hidden');
      showToast(`Added ${amount} ${token} Successfully!`);
      
      // Show transaction confirmation
      txHash.textContent = result.txHash;
      transactionModal.classList.remove('hidden');
      
      // Update balance display
      updateBalanceDisplay();
    } catch (error) {
      console.error('Error adding funds:', error);
      showToast('Error adding funds', 'error');
    } finally {
      // Reset button state
      addFundsBtn.textContent = `Add Funds`;
      addFundsBtn.disabled = false;
    }
  });
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      fundModal.classList.add('hidden');
      transactionModal.classList.add('hidden');
    });
  });
  
  // Update event listeners
  
  // Swap button now opens swap modal
  swapBtn.addEventListener('click', function() {
    // Get current token from whale data for pre-filling
    let swapToken = 'USDC';
    const titleText = whaleTransactionTitle.textContent || '';
    const tokenMatch = titleText.match(/\$([A-Z]+)/);
    if (tokenMatch && tokenMatch[1]) {
      swapToken = tokenMatch[1];
    }
    
    // Default values
    fromTokenEl.value = 'ETH';
    toTokenEl.value = swapToken in availableTokens ? swapToken : 'USDC';
    fromAmountEl.value = '0.1';
    
    // Calculate initial swap amount
    calculateSwapAmount();
    
    // Show modal
    swapModal.classList.remove('hidden');
  });
  
  // Execute swap button
  executeSwapBtn.addEventListener('click', async function() {
    // Show processing state
    executeSwapBtn.textContent = 'Processing...';
    executeSwapBtn.disabled = true;
    
    try {
      const fromToken = fromTokenEl.value;
      const toToken = toTokenEl.value;
      const fromAmount = fromAmountEl.value;
      
      let result;
      if (fromToken === 'ETH') {
        // For demo, we'll simulate by transferring tokens
        result = await transferToken(toToken, walletAddress, toAmountEl.value);
      } else {
        result = await transferToken(fromToken, walletAddress, fromAmount);
      }
      
      // Close swap modal
      swapModal.classList.add('hidden');
      
      // Show transaction confirmation
      txHash.textContent = result.txHash;
      updateExplorerLink(result.txHash);
      transactionModal.classList.remove('hidden');
      
      // Update balances
      updateBalanceDisplay();
      updatePortfolio();
      
      showToast(`Swapped ${fromAmount} ${fromToken} for ${toAmountEl.value} ${toToken} Successfully!`);
    } catch (error) {
      console.error('Error executing swap:', error);
      showToast('Error executing swap', 'error');
    } finally {
      // Reset button state
      executeSwapBtn.textContent = 'Swap Tokens';
      executeSwapBtn.disabled = false;
    }
  });

  // From amount change recalculates swap
  fromAmountEl.addEventListener('input', calculateSwapAmount);
  
  // Token selection change recalculates swap
  fromTokenEl.addEventListener('change', calculateSwapAmount);
  toTokenEl.addEventListener('change', calculateSwapAmount);
  
  // Portfolio refresh button
  if (refreshPortfolioBtn) {
    refreshPortfolioBtn.addEventListener('click', async function() {
      refreshPortfolioBtn.disabled = true;
      
      try {
        await updatePortfolio();
        showToast('Portfolio updated');
      } catch (error) {
        console.error('Error refreshing portfolio:', error);
      } finally {
        refreshPortfolioBtn.disabled = false;
      }
    });
  }
  
  closeTxBtn.addEventListener('click', function() {
    transactionModal.classList.add('hidden');
  });
  
  // Cleanup intervals when page is unloaded
  window.addEventListener('beforeunload', function() {
    clearInterval(whaleUpdateInterval);
    clearInterval(telegramUpdateInterval);
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === fundModal) {
      fundModal.classList.add('hidden');
    }
    if (event.target === transactionModal) {
      transactionModal.classList.add('hidden');
    }
  });
  
  // Add some CSS for balance highlight
  const style = document.createElement('style');
  style.textContent = `
    .highlight {
      transition: color 0.3s ease;
      color: var(--success-color);
    }
    
    .token-section {
      margin: 20px 0;
    }
    
    .input-group {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .input-group label {
      width: 80px;
      font-weight: 500;
    }
    
    .token-select, .amount-input {
      flex: 1;
      padding: 8px 10px;
      border-radius: var(--border-radius);
      background: #374151;
      color: var(--text-color);
      border: 1px solid #4B5563;
    }
    
    .amount-input {
      font-family: monospace;
    }
  `;
  document.head.appendChild(style);
  
  // Debug helper - check if key elements exist
  console.log('Element checks - Landing page:', !!landingPage, 'Dashboard:', !!dashboard);
});
