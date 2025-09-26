class Web3Manager {
  constructor() {
    this.provider = null;
    this.account = null;
    this.isConnected = false;
    this.contracts = {};
    this.currentChainId = null;
    this.connectionTimeout = 10000; // 10 секунд
  }

  async init() {
    await this.detectProvider();
    await this.setupEventListeners();
    await this.tryReconnect();
  }

  // ИСПРАВЛЕНО: Простая и четкая логика определения SafePal
  async detectProvider() {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      if (typeof window !== 'undefined') {
        // Проверка SafePal в порядке приоритета
        if (window.safepal && window.safepal.ethereum) {
          this.provider = window.safepal.ethereum;
          console.log('✅ SafePal detected via window.safepal.ethereum');
          return;
        }
        
        if (window.ethereum && window.ethereum.isSafePal === true) {
          this.provider = window.ethereum;
          console.log('✅ SafePal detected via window.ethereum.isSafePal');
          return;
        }
        
        if (window.ethereum && window.ethereum.providers) {
          const safePalProvider = window.ethereum.providers.find(p => p.isSafePal === true);
          if (safePalProvider) {
            this.provider = safePalProvider;
            console.log('✅ SafePal found in providers array');
            return;
          }
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // ИСПРАВЛЕНО: Проверяем мобильное устройство и предлагаем открыть в SafePal
    if (this.isMobileDevice()) {
      console.log('📱 Mobile device detected, SafePal app may be required');
      throw new Error('MOBILE_SAFEPAL_REQUIRED');
    }
    
    console.error('❌ SafePal wallet not found!');
    throw new Error('SafePal wallet required! Please install SafePal wallet extension.');
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

      // ИСПРАВЛЕНО: Обработка мобильного устройства
      if (this.isMobileDevice()) {
        console.log('Mobile device detected, checking SafePal DApp browser');
        // Не блокируем, продолжаем подключение
      }

      // Таймаут для подключения
      const connectPromise = this.provider.request({
        method: 'eth_requestAccounts'
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout);
      });

      let accounts;
      try {
        accounts = await Promise.race([connectPromise, timeoutPromise]);
      } catch (error) {
        if (this.isMobileDevice()) {
          throw new Error('Please open this page in SafePal DApp browser');
        }
        throw error;
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock SafePal wallet.');
      }

      this.account = accounts[0];
      
      // ИСПРАВЛЕНО: Проверяем сеть только если не в opBNB
      const currentChain = await this.getCurrentNetwork();
      if (currentChain !== CONFIG.CHAIN_ID) {
        await this.switchToOpBNB();
      }
      
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
      
      if (error.message === 'MOBILE_SAFEPAL_REQUIRED') {
        this.showMobileInstructions();
        return;
      }
      
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending in SafePal');
      } else {
        throw new Error(`SafePal connection failed: ${error.message}`);
      }
    }
  }

  // ИСПРАВЛЕНО: Правильные инструкции для мобильного
  showMobileInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center; color: white;
      font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 90%; text-align: center;">
        <h3>📱 Mobile Device Detected</h3>
        <p>To use GlobalWay on mobile:</p>
        <ol style="text-align: left; margin: 20px 0;">
          <li>Open SafePal app</li>
          <li>Go to "Discover" or "DApps"</li>
          <li>Enter this URL: <strong>${window.location.href}</strong></li>
          <li>Or scan QR code (if available)</li>
        </ol>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px;">
          Got it
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  async switchToOpBNB() {
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONFIG.CHAIN_ID }]
      });
      
      this.currentChainId = CONFIG.CHAIN_ID;
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
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [CONFIG.EXPLORER_URL]
            }]
          });
          
          this.currentChainId = CONFIG.CHAIN_ID;
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

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isInSafePalBrowser() {
    return !!(window.safepal || 
              (window.ethereum && window.ethereum.isSafePal) ||
              navigator.userAgent.includes('SafePal'));
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
          
          // Проверяем сеть при переподключении
          const currentChain = await this.getCurrentNetwork();
          if (currentChain !== CONFIG.CHAIN_ID) {
            console.log('⚠️ Wrong network on reconnect, switching...');
            await this.switchToOpBNB();
          }
          
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
    this.currentChainId = null;
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

  // ИСПРАВЛЕНО: Без автоматической перезагрузки страницы
  handleChainChanged(chainId) {
  console.log('🔄 Chain changed to:', chainId);
  this.currentChainId = chainId;
  
  if (chainId !== CONFIG.CHAIN_ID) {
    console.warn('⚠️ Wrong network:', chainId, 'Expected:', CONFIG.CHAIN_ID);
    
    if (window.uiManager && window.uiManager.showError) {
      window.uiManager.showError('Please switch to opBNB network in SafePal');
    }
    
    setTimeout(async () => {
      try {
        await this.switchToOpBNB();
        if (window.uiManager && window.uiManager.showSuccess) {
          window.uiManager.showSuccess('Network switched to opBNB');
        }
        if (window.uiManager && window.uiManager.loadUserData) {
          await window.uiManager.loadUserData();
        }
      } catch (error) {
        console.error('Auto network switch failed:', error);
      }
    }, 1000);
  } else {
    console.log('✅ Correct network connected');
    if (window.uiManager && window.uiManager.loadUserData) {
      window.uiManager.loadUserData();
    }
  }
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
        connectBtn.style.pointerEvents = 'auto';
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

  async getCurrentNetwork() {
    if (!this.provider) return null;
    
    try {
      return await this.provider.request({ method: 'eth_chainId' });
    } catch (error) {
      console.error('Failed to get current network:', error);
      return null;
    }
  }

  isOnCorrectNetwork() {
    return this.currentChainId === CONFIG.CHAIN_ID;
  }
}

const web3Manager = new Web3Manager();
