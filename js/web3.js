class Web3Manager {
  constructor() {
    this.provider = null;
    this.account = null;
    this.isConnected = false;
    this.contracts = {};
  }

  async init() {
    await this.detectProvider();
    await this.setupEventListeners();
    await this.tryReconnect();
  }

  async detectProvider() {
    // ТОЛЬКО SafePal! Никаких других кошельков
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (typeof window !== 'undefined') {
        // ПРИОРИТЕТ 1: SafePal через собственный объект
        if (window.safepal && window.safepal.ethereum) {
          this.provider = window.safepal.ethereum;
          console.log('✅ SafePal detected via window.safepal.ethereum');
          return;
        }
        
        // ПРИОРИТЕТ 2: SafePal через ethereum с проверкой isSafePal
        if (window.ethereum && window.ethereum.isSafePal === true) {
          this.provider = window.ethereum;
          console.log('✅ SafePal detected via window.ethereum.isSafePal');
          return;
        }
        
        // ПРИОРИТЕТ 3: Проверка провайдеров массива
        if (window.ethereum && window.ethereum.providers) {
          const safePalProvider = window.ethereum.providers.find(p => 
            p.isSafePal === true || 
            p.constructor.name === 'SafePalProvider' ||
            (p._metamask && p._metamask.isSafePal)
          );
          if (safePalProvider) {
            this.provider = safePalProvider;
            console.log('✅ SafePal found in providers array');
            return;
          }
        }
        
        // ПРИОРИТЕТ 4: Последняя проверка window.ethereum (только если точно SafePal)
        if (window.ethereum && 
            (navigator.userAgent.includes('SafePal') || 
             window.ethereum.constructor.name === 'SafePalProvider')) {
          this.provider = window.ethereum;
          console.log('✅ SafePal detected via user agent check');
          return;
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // ОТКАЗ если SafePal не найден
    console.error('❌ SafePal wallet not found!');
    throw new Error('SafePal wallet required! Please install SafePal wallet and disable other wallets.');
  }

  async setupEventListeners() {
    if (this.provider && this.provider.on) {
      try {
        this.provider.removeAllListeners?.();
      } catch (e) {
        console.warn('Could not remove listeners:', e);
      }
      
      this.provider.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        this.handleAccountsChanged(accounts);
      });

      this.provider.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId);
        this.handleChainChanged(chainId);
      });

      this.provider.on('disconnect', () => {
        console.log('Provider disconnected');
        this.disconnect();
      });
    }
  }

  async connect() {
    try {
      if (!this.provider) {
        await this.detectProvider();
      }

      console.log('🔗 Connecting to SafePal...');

      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock SafePal wallet.');
      }

      this.account = accounts[0];
      await this.switchToOpBNB();
      
      this.isConnected = true;
      localStorage.setItem('walletConnected', 'safepal');
      localStorage.setItem('connectedAccount', this.account);
      
      console.log('✅ SafePal connected:', this.account);
      
      await this.loadContracts();
      this.updateUI();
      
      return this.account;
    } catch (error) {
      console.error('❌ SafePal connection failed:', error);
      this.disconnect();
      
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending');
      } else {
        throw new Error(`SafePal connection failed: ${error.message}`);
      }
    }
  }

  async switchToOpBNB() {
    try {
      console.log('🔄 Switching to opBNB network...');
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONFIG.CHAIN_ID }]
      });
      console.log('✅ Successfully switched to opBNB');
    } catch (switchError) {
      console.log('⚠️ Switch error:', switchError);
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          console.log('➕ Adding opBNB network...');
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CONFIG.CHAIN_ID,
              chainName: CONFIG.CHAIN_NAME,
              nativeCurrency: CONFIG.CURRENCY,
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [CONFIG.EXPLORER_URL]
            }]
          });
          console.log('✅ opBNB network added successfully');
        } catch (addError) {
          console.error('❌ Failed to add network:', addError);
          throw new Error('Failed to add opBNB network. Please add it manually in SafePal.');
        }
      } else {
        console.error('❌ Network switch failed:', switchError);
        throw switchError;
      }
    }
  }

  async tryReconnect() {
    const wasConnected = localStorage.getItem('walletConnected');
    const savedAccount = localStorage.getItem('connectedAccount');
    
    if (wasConnected === 'safepal' && savedAccount && this.provider) {
      try {
        console.log('🔄 Trying to reconnect to:', savedAccount);
        const accounts = await this.provider.request({
          method: 'eth_accounts'
        });
        
        if (accounts.includes(savedAccount)) {
          this.account = savedAccount;
          this.isConnected = true;
          await this.loadContracts();
          this.updateUI();
          console.log('✅ Auto-reconnected successfully');
        } else {
          console.log('⚠️ Saved account not found');
          this.disconnect();
        }
      } catch (error) {
        console.warn('⚠️ Auto-reconnect failed:', error);
        this.disconnect();
      }
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting wallet...');
    this.account = null;
    this.isConnected = false;
    this.contracts = {};
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('connectedAccount');
    this.updateUI();
  }

  handleAccountsChanged(accounts) {
    console.log('🔄 Handling account change:', accounts);
    if (accounts.length === 0) {
      this.disconnect();
    } else if (accounts[0] !== this.account) {
      this.account = accounts[0];
      localStorage.setItem('connectedAccount', this.account);
      this.loadContracts();
      this.updateUI();
      if (window.uiManager && window.uiManager.loadUserData) {
        window.uiManager.loadUserData();
      }
    }
  }

  handleChainChanged(chainId) {
    console.log('🔄 Chain changed to:', chainId);
    if (chainId !== CONFIG.CHAIN_ID) {
      console.warn('⚠️ Wrong network:', chainId, 'Expected:', CONFIG.CHAIN_ID);
      if (window.uiManager && window.uiManager.showError) {
        window.uiManager.showError('Please switch to opBNB network in SafePal');
      }
    }
    setTimeout(() => location.reload(), 1000);
  }

  async loadContracts() {
    try {
      console.log('📄 Loading contract ABIs...');
      
      const contractPaths = {
        globalway: './contracts/GlobalWay.json',
        stats: './contracts/GlobalWayStats.json', 
        token: './contracts/GWTToken.json'
      };

      for (const [name, path] of Object.entries(contractPaths)) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const contractData = await response.json();
            this.contracts[name] = {
              address: CONFIG.CONTRACTS[name.toUpperCase()],
              abi: contractData.abi || contractData
            };
            console.log(`✅ Contract ${name} loaded`);
          } else {
            console.warn(`⚠️ Failed to load contract ${name}:`, response.statusText);
          }
        } catch (error) {
          console.warn(`❌ Error loading contract ${name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load contracts:', error);
    }
  }

  async getBalance() {
    if (!this.account || !this.provider) return '0';
    
    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.account, 'latest']
      });
      
      const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
      console.log('💰 Balance loaded:', balanceInEth, 'BNB');
      return balanceInEth;
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return '0';
    }
  }

  updateUI() {
    const connectBtn = document.getElementById('connectBtn');
    const userAddress = document.getElementById('userAddress');
    const userBalance = document.getElementById('userBalance');
    
    if (this.isConnected && this.account) {
      if (connectBtn) {
        connectBtn.textContent = getTranslation('wallet.connected') || 'Connected';
        connectBtn.style.color = '#28a745';
        connectBtn.disabled = true;
      }
      
      if (userAddress) {
        userAddress.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
      }
      
      this.getBalance().then(balance => {
        if (userBalance) {
          userBalance.textContent = `${balance} BNB`;
        }
      });
      
      this.checkAdminAccess();
      
    } else {
      if (connectBtn) {
        connectBtn.textContent = getTranslation('wallet.connect') || 'Connect SafePal';
        connectBtn.style.color = '#FFD700';
        connectBtn.disabled = false;
      }
      
      if (userAddress) userAddress.textContent = '0x000...000';
      if (userBalance) userBalance.textContent = '0.000 BNB';
      
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(el => el.style.display = 'none');
    }
  }

  checkAdminAccess() {
    if (!this.account) return;
    
    const account = this.account.toLowerCase();
    const isOwner = account === CONFIG.ADDRESSES.OWNER.toLowerCase();
    const isFounder = CONFIG.ADDRESSES.FOUNDERS.some(f => 
      f.toLowerCase() === account
    );
    const isBoard = CONFIG.ADDRESSES.BOARD.some(b => 
      b.toLowerCase() === account
    );
    
    if (isOwner || isFounder || isBoard) {
      console.log('✅ Admin access granted for:', account);
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(el => el.style.display = 'block');
    }
  }
}

const web3Manager = new Web3Manager();
