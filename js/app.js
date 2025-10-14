/* jshint esversion: 8 */
/* global CONFIG, Promise, ethers */
// js/web3.js
// Improved Web3Manager with robust SafePal detection and deep-link fallback
// Requirements: ethers (already loaded in index.html), CONFIG object available from js/config.js

class Web3Manager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.connected = false;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isSafePalBrowser = this.detectSafePalBrowser();
    // small safety: allow manual override via config
    if (typeof CONFIG !== 'undefined' && CONFIG.FORCE_SAFEPal_BROWSER === true) {
      this.isSafePalBrowser = true;
    }
  }

  // Robust detection: check userAgent, url, window.safepal, and ethereum.providers array
  detectSafePalBrowser() {
    try {
      const ua = navigator.userAgent || '';
      
       // 🔥 НОВОЕ: Логирование для отладки
      console.log('🔍 Detecting SafePal browser...');
      console.log('User-Agent:', ua);
      
       if (ua.includes('SafePal') || ua.includes('safepal')) {
        console.log('✅ SafePal detected via User-Agent');
        return true;
      }
      
      if (window.location.href && window.location.href.includes('safepal')) {
        console.log('✅ SafePal detected via URL');
        return true;
      }
      
      // Some SafePal versions inject as window.safepal OR set flags on window.ethereum
      if (window.safepal) {
        console.log('✅ SafePal detected via window.safepal');
        return true;
      }
      
      if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) {
        console.log('✅ SafePal detected via window.ethereum flags');
        return true;
      }
      
      // some providers expose multiple providers
      if (window.ethereum && Array.isArray(window.ethereum.providers)) {
        for (const p of window.ethereum.providers) {
           if (p && (p.isSafePal || p.isSafePalWallet || p.isSafePalProvider)) {
            console.log('✅ SafePal detected via ethereum.providers');
            return true;
          }
        }
      }
      
       console.log('⚠️ SafePal NOT detected');
      
    } catch (e) {
       console.warn('SafePal detect error', e);
     }
     return false;
   }

  // Initialize: wait for injected providers and try auto-connect if possible
  async init() {
    console.log('🔌 Initializing Web3Manager...');
    console.log('📱 Device:', this.isMobile ? 'Mobile' : 'Desktop');
    console.log('🦊 SafePal Browser:', this.isSafePalBrowser);

    // If in SafePal browser, wait a bit longer for injection
    if (this.isSafePalBrowser) {
      console.log('⏳ Waiting for SafePal injection (5s max)...');
      await this.waitForSafePal(10000);
      // try to detect provider now
      if (this.hasSafePalProvider()) {
        console.log('✅ SafePal provider detected during init');
        await this.autoConnect();
        return;
      }
    }

    // If saved wallet exists, try autoConnect
    const savedAddress = localStorage.getItem('walletAddress');
    const walletConnected = localStorage.getItem('walletConnected');

    if (savedAddress && walletConnected === 'true') {
      console.log('🔄 Found saved wallet, attempting auto-connect...');
      await this.autoConnect();
    }
  }

  // Public connect method — uses SafePal when available, fallbacks otherwise
  async connect() {
    try {
      console.log('🔌 Starting wallet connection...');
      console.log('📱 Device:', this.isMobile ? 'Mobile' : 'Desktop');
      console.log('🦊 SafePal Browser:', this.isSafePalBrowser);
      
      if (this.isMobile) {
        console.log('⏳ Mobile delay for better compatibility...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Always wait a bit for SafePal injection (safer UX)
      await this.waitForSafePal(5000);
      console.log('🔍 window.safepal:', !!window.safepal);
      console.log('🔍 window.ethereum:', !!window.ethereum);
      
      // Priority 1: SafePal (explicit object or marked ethereum provider)
      if (this.hasSafePalProvider()) {
        console.log('✅ SafePal provider prioritized for connection');
        await this.connectSafePal();
        
        // 🔥 НОВОЕ: Дополнительная проверка что signer готов
        if (!this.signer || !this.address) {
          throw new Error('SafePal connected but signer not ready');
        }
      }
      // Priority 2: mobile but not SafePal browser -> attempt deep link to open in SafePal app
      else if (this.isMobile && !this.isSafePalBrowser) {
        console.log('📱 Mobile but not SafePal browser. Triggering SafePal deep-link...');
        
        // 🔥 ИСПРАВЛЕНО: Не прерываем выполнение, а показываем инструкцию
        this.openSafePalApp();
        
        // 🔥 НОВОЕ: Показываем пользователю что делать
        throw new Error('Please complete connection in SafePal app and return to this page');
      }
      // 🔥 УДАЛЕНО: Priority 3 (MetaMask) больше не поддерживается - только SafePal!
      else {
        throw new Error('❌ No SafePal wallet detected!\n\nDesktop: install SafePal extension\nMobile: open this link in SafePal Wallet app');
      }
      
      // 🔥 НОВОЕ: Проверяем что все действительно готово перед продолжением
      if (!this.provider || !this.signer || !this.address) {
        throw new Error('Wallet connection incomplete. Missing provider, signer or address.');
      }
      
      await this.checkNetwork();
      await this.saveConnection();
      
      // 🔥 НОВОЕ: Устанавливаем connected только после всех проверок
      this.connected = true;
      
      console.log('✅ Connected:', this.address);
      return this.address;
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      if (!/User rejected|User denied/i.test(error.message || '')) {
        // show friendly message
        alert(error.message || 'Connection failed. Please try again.');
      }
      throw error;
    }
  }

  // Wait for SafePal provider to be injected (retries until timeout)
  async waitForSafePal(maxWaitTime = 10000) {
    const start = Date.now();
    const interval = 120;
    while (Date.now() - start < maxWaitTime) {
      if (this.hasSafePalProvider()) {
        console.log('✅ Detected SafePal provider after', Date.now() - start, 'ms');
        return true;
      }
      // also detect generic injected ethereum that may have SafePal inside providers
      if (window.ethereum && Array.isArray(window.ethereum.providers)) {
        if (window.ethereum.providers.some(p => p && (p.isSafePal || p.isSafePalWallet))) {
          console.log('✅ Detected SafePal provider inside ethereum.providers');
          return true;
        }
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    console.warn('⚠️ SafePal not found after', maxWaitTime, 'ms');
    return false;
  }

  // Utility: does an available provider look like SafePal?
  hasSafePalProvider() {
    try {
      if (window.safepal) return true;
      if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) return true;
      if (window.ethereum && Array.isArray(window.ethereum.providers)) {
        return window.ethereum.providers.some(p => p && (p.isSafePal || p.isSafePalWallet || p.isSafePalProvider));
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  // Connect specifically using SafePal provider
async connectSafePal() {
    try {
      // 🔥 ТОЛЬКО SafePal провайдеры, никакого MetaMask!
      let rawProvider = null;

      if (window.safepal) {
        console.log('✅ Using window.safepal');
        rawProvider = window.safepal;
      } else if (window.ethereum && Array.isArray(window.ethereum.providers)) {
        console.log('🔍 Searching SafePal in ethereum.providers');
        rawProvider = window.ethereum.providers.find(p => p && (p.isSafePal || p.isSafePalWallet || p.isSafePalProvider));
      } else if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) {
        console.log('✅ Using window.ethereum (SafePal flags detected)');
        rawProvider = window.ethereum;
      }

      if (!rawProvider) {
        throw new Error('SafePal provider not found');
      }

      console.log('🔗 Creating ethers provider from SafePal object');
      this.provider = new ethers.providers.Web3Provider(rawProvider);

      console.log('📝 Requesting SafePal accounts...');
      try {
        await this.provider.send('eth_requestAccounts', []);
      } catch (reqErr) {
        console.warn('eth_requestAccounts failed, trying provider.request fallback', reqErr);
        if (rawProvider.request) {
          await rawProvider.request({ method: 'eth_requestAccounts' });
        } else {
          throw reqErr;
        }
      }

      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();
      
      // 🔥 НОВОЕ: Дополнительная задержка для SafePal на мобильном
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ SafePal connected:', this.address);
    } catch (error) {
      console.error('❌ SafePal connection failed:', error);
      throw error;
    }
  }

  // 🔥 УДАЛЕНО: connectWithEthereum() - MetaMask больше не поддерживается!

  // Attempt to open SafePal application via deep-link
  async openSafePalApp() {
    try {
      const currentUrl = window.location.href;
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      let deepLink;
      let storeLink;

      if (isAndroid) {
        deepLink = `safepalwallet://open?url=${encodeURIComponent(currentUrl)}`;
        storeLink = 'https://play.google.com/store/apps/details?id=io.safepal.wallet';
      } else if (isIOS) {
        deepLink = `safepal://open?url=${encodeURIComponent(currentUrl)}`;
        storeLink = 'https://apps.apple.com/app/safepal-wallet/id1548297139';
      } else {
        alert('❌ Please use a mobile device or open in SafePal browser.');
        return;
      }

      console.log('🚀 Opening SafePal app via deep-link:', deepLink);

      // 🔥 НОВОЕ: Показываем инструкцию сразу
      alert('📱 Opening SafePal app...\n\n1. Approve connection in SafePal\n2. Return to this page\n3. Click Connect again');

      // Use location assignment to attempt to open native app
      window.location.href = deepLink;

      // 🔥 НОВОЕ: Если app не открылся - показываем ссылку на установку
      setTimeout(() => {
        if (!this.connected) {
          const install = confirm(
            'SafePal app not detected.\n\nInstall SafePal Wallet to continue.\n\nPress OK to open store.'
          );
          if (install) {
            window.open(storeLink, '_blank');
          }
        }
      }, 3000);
    } catch (e) {
      console.error('Deep-link failed', e);
    }
  }

  // Auto-connect: if accounts already available, use them
  async autoConnect() {
    try {
      console.log('🔄 Auto-connecting...');
      // Give SafePal a bit of time if flagged
      if (this.isSafePalBrowser) {
        await this.waitForSafePal(10000);
      } else {
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      let provider = null;

      if (this.hasSafePalProvider()) {
        // create provider from SafePal object
        if (window.safepal) provider = new ethers.providers.Web3Provider(window.safepal);
        else if (window.ethereum && Array.isArray(window.ethereum.providers)) {
          const p = window.ethereum.providers.find(p => p && (p.isSafePal || p.isSafePalWallet));
          if (p) provider = new ethers.providers.Web3Provider(p);
        } else if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
        }
        console.log('🔄 Auto-connect using SafePal provider');
      } else if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log('🔄 Auto-connect using ethereum provider');
      }

      if (!provider) {
        console.log('⚠️ No provider available for auto-connect');
        return;
      }

      const accounts = await provider.listAccounts();

      if (accounts && accounts.length > 0) {
        this.provider = provider;
        this.signer = provider.getSigner();
        this.address = accounts[0];
        this.connected = true;
        await this.checkNetwork();
        console.log('✅ Auto-connected:', this.address);
      } else {
        console.log('ℹ️ Auto-connect: no accounts available yet');
      }
    } catch (error) {
      console.error('❌ Auto-connect failed:', error);
    }
  }

  // Check current network and try to switch/add opBNB if necessary
  async checkNetwork() {
    try {
      if (!this.provider) throw new Error('No provider to check network');
      const network = await this.provider.getNetwork();
      console.log('🌐 Network:', network.chainId, network.name);

      // CONFIG.NETWORK.chainId should be numeric and .chainIdHex the hex string.
      if (typeof CONFIG === 'undefined' || !CONFIG.NETWORK) {
        console.warn('CONFIG.NETWORK not found — skipping network checks');
        return;
      }

      const desiredChainId = Number(CONFIG.NETWORK.chainId);
      if (network.chainId !== desiredChainId) {
        console.log('⚠️ Wrong network, trying to switch to opBNB...');
        await this.switchNetwork();
      } else {
        console.log('✅ Already on desired network (opBNB)');
      }
    } catch (error) {
      console.error('❌ Network check failed:', error);
      throw error;
    }
  }

  // Switch network (wallet_switchEthereumChain) or add it if missing
  async switchNetwork() {
    try {
      if (!this.provider) throw new Error('No provider to switch network');

      const chainIdHex = CONFIG.NETWORK.chainIdHex || '0x' + Number(CONFIG.NETWORK.chainId).toString(16);

      await this.provider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
      console.log('✅ Network switch requested');
    } catch (error) {
      // 4902 = chain not added
      if (error && error.code === 4902) {
        console.log('➕ Chain not found in wallet. Trying to add network...');
        await this.addNetwork();
      } else {
        console.error('❌ Switch failed:', error);
        throw new Error('Please switch to opBNB manually in your wallet');
      }
    }
  }

  // Add opBNB network to wallet
  async addNetwork() {
    try {
      if (!this.provider) throw new Error('No provider to add network');

      const chainIdHex = CONFIG.NETWORK.chainIdHex || '0x' + Number(CONFIG.NETWORK.chainId).toString(16);

      await this.provider.send('wallet_addEthereumChain', [{
        chainId: chainIdHex,
        chainName: CONFIG.NETWORK.name,
        nativeCurrency: CONFIG.NETWORK.currency,
        rpcUrls: [CONFIG.NETWORK.rpcUrl],
        blockExplorerUrls: [CONFIG.NETWORK.explorer]
      }]);
      console.log('✅ Network added to wallet');
    } catch (error) {
      console.error('❌ Add network failed:', error);
      throw new Error('Please add opBNB network manually in your wallet');
    }
  }

  // Persist user wallet address/flag locally
  async saveConnection() {
    try {
      if (this.address) {
        localStorage.setItem('walletAddress', this.address);
        localStorage.setItem('walletConnected', 'true');
        console.log('💾 Connection saved to localStorage');
      }
    } catch (e) {
      console.warn('Failed to save connection', e);
    }
  }

  // full disconnect: clear provider and local storage
  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.connected = false;

    try {
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletConnected');
    } catch (e) {
      // ignore
    }

    try {
      // Do not clear whole localStorage by default (it may break other app data).
      // But preserve compatibility: if CONFIG.CLEAR_ON_DISCONNECT is true, clear all.
      if (typeof CONFIG !== 'undefined' && CONFIG.CLEAR_ON_DISCONNECT === true) {
        localStorage.clear();
      }
    } catch (e) {
      // ignore
    }

    console.log('🔌 Disconnected & local state cleared');
  }

  // Get ETH/BNB balance string
  async getBalance() {
    if (!this.connected || !this.provider || !this.address) return '0';
    try {
      const bal = await this.provider.getBalance(this.address);
      return ethers.utils.formatEther(bal);
    } catch (error) {
      console.error('❌ Balance fetch error', error);
      return '0';
    }
  }

  // Return contract instance using signer
  getContract(name, abi) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    if (!CONFIG.CONTRACTS || !CONFIG.CONTRACTS[name]) {
      throw new Error(`Contract ${name} address not found in CONFIG.CONTRACTS`);
    }
    return new ethers.Contract(CONFIG.CONTRACTS[name], abi, this.signer);
  }

  // Helpers for roles
  isAdmin() {
    if (!this.address || !CONFIG.ADMIN) return false;
    const addr = this.address.toLowerCase();
    if (CONFIG.ADMIN.owner && addr === CONFIG.ADMIN.owner.toLowerCase()) return true;
    if (Array.isArray(CONFIG.ADMIN.founders) && CONFIG.ADMIN.founders.some(f => f.toLowerCase() === addr)) return true;
    if (Array.isArray(CONFIG.ADMIN.board) && CONFIG.ADMIN.board.some(b => b.toLowerCase() === addr)) return true;
    return false;
  }

  isOwner() {
    if (!this.address || !CONFIG.ADMIN) return false;
    const result = CONFIG.ADMIN.owner && this.address.toLowerCase() === CONFIG.ADMIN.owner.toLowerCase();
    console.log('🔍 isOwner check:', this.address, '→', result);
    return result;
  }

  isFounder() {
    if (!this.address || !CONFIG.ADMIN) return false;
    const addr = this.address.toLowerCase();
    const result = this.isOwner() || (Array.isArray(CONFIG.ADMIN.founders) && CONFIG.ADMIN.founders.some(f => f.toLowerCase() === addr));
    console.log('🔍 isFounder check:', this.address, '→', result);
    console.log('📋 Founders list:', CONFIG.ADMIN.founders);
    return result;
  }
  }

// single global instance for your app to use
const web3Manager = new Web3Manager();
