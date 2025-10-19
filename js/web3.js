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

async connect() {
    try {
      console.log('🔌 Starting wallet connection...');
      console.log('📱 Device:', this.isMobile ? 'Mobile' : 'Desktop');
      console.log('🦊 SafePal Browser:', this.isSafePalBrowser);
      
      // Задержка перед началом
      if (this.isMobile) {
        console.log('⏳ Mobile device - waiting for app readiness...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Ищем SafePal провайдер
      console.log('🔍 Searching for SafePal provider...');
      const safePalFound = await this.waitForSafePal(6000);
      console.log('🔍 SafePal found:', safePalFound);
      
      // Проверяем наличие SafePal
      if (this.hasSafePalProvider()) {
        console.log('✅ SafePal provider detected');
        
        // Задержка перед подключением
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Подключаемся к SafePal
        await this.connectSafePal();
        
        // Проверяем что всё подключилось
        if (!this.signer || !this.address) {
          console.error('❌ SafePal connected but signer/address missing');
          throw new Error('SafePal connection incomplete. Please try again.');
        }
        
        // Дополнительная проверка для мобилы
        if (this.isMobile) {
          console.log('📱 Verifying mobile connection...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            const testAddress = await this.signer.getAddress();
            if (!testAddress || testAddress !== this.address) {
              throw new Error('Address mismatch');
            }
            console.log('✅ Mobile connection verified');
          } catch (verifyError) {
            console.error('❌ Mobile verification failed:', verifyError.message);
            throw new Error('Mobile wallet verification failed. Please reconnect.');
          }
        }
      }
      // Мобила но не браузер SafePal - предлагаем открыть приложение
      else if (this.isMobile && !this.isSafePalBrowser) {
        console.log('📱 Mobile but not SafePal browser');
        
        const userConfirmed = confirm(
          'To connect your wallet:\n\n' +
          '1. SafePal app will open\n' +
          '2. Approve connection\n' +
          '3. Return to this page\n\n' +
          'Press OK to continue'
        );
        
        if (!userConfirmed) {
          throw new Error('Connection cancelled');
        }
        
        await this.openSafePalApp();
        throw new Error('Please complete connection in SafePal app and return to this page.');
      }
      // SafePal не найден вообще
      else {
        const message = this.isMobile 
          ? 'SafePal app not detected. Please install SafePal Wallet and open this link in the app.'
          : 'SafePal wallet not detected. Please install SafePal extension.';
        
        throw new Error(message);
      }
      
      // Финальная проверка
      if (!this.provider || !this.signer || !this.address) {
        console.error('❌ Connection incomplete');
        throw new Error('Wallet connection failed. Please refresh and try again.');
      }
      
      // Проверяем сеть
      await this.checkNetwork();
      
      // Сохраняем подключение
      await this.saveConnection();
      
      // Финальная верификация адреса
      const finalAddress = await this.signer.getAddress();
      if (finalAddress !== this.address) {
        throw new Error('Address mismatch after connection');
      }
      
      this.connected = true;
      
      console.log('✅ Successfully connected:', this.address);
      return this.address;
      
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      
      this.connected = false;
      this.signer = null;
      this.address = null;
      
      // Показываем ошибку только если это не отмена пользователя
      if (!/cancelled|rejected|denied/i.test(error.message || '')) {
        if (error.message.includes('SafePal') || error.message.includes('wallet')) {
          alert(error.message);
        }
      }
      
      throw error;
    }
}
      
      // 🔥 ИСПРАВЛЕНИЕ: Priority 2 - Mobile deep link с улучшенным UX
      else if (this.isMobile && !this.isSafePalBrowser) {
        console.log('📱 Mobile but not SafePal browser. Triggering SafePal deep-link...');
        
        // 🔥 ИСПРАВЛЕНИЕ: Показываем инструкцию перед deep link
        const userConfirmed = confirm(
          'To connect your wallet:\n\n1. SafePal app will open\n2. Approve connection\n3. Return to this page\n4. Click Connect again\n\nPress OK to continue'
        );
        
        if (!userConfirmed) {
          throw new Error('Connection cancelled by user');
        }
        
        await this.openSafePalApp();
        
        // 🔥 ИСПРАВЛЕНИЕ: Более понятное сообщение
        throw new Error('Please complete connection in SafePal app and return to this page. Then click Connect again.');
      }
      // 🔥 ИСПРАВЛЕНИЕ: Priority 3 - Fallback с лучшим сообщением
      else {
        const message = this.isMobile 
          ? '❌ SafePal app not detected!\n\nPlease install SafePal Wallet from App Store/Play Store and open this link in the app.'
          : '❌ SafePal wallet not detected!\n\nDesktop: Install SafePal browser extension\nMobile: Open this link in SafePal Wallet app';
        
        throw new Error(message);
      }
      
      // 🔥 ИСПРАВЛЕНИЕ: Расширенная проверка готовности подключения
      if (!this.provider || !this.signer || !this.address) {
        console.error('❌ Connection state incomplete:', {
          provider: !!this.provider,
          signer: !!this.signer, 
          address: !!this.address
        });
        throw new Error('Wallet connection incomplete. Please refresh and try again.');
      }
      
      // 🔥 ИСПРАВЛЕНИЕ: Проверка сети с улучшенной обработкой ошибок
      await this.checkNetwork();
      
      // 🔥 ИСПРАВЛЕНИЕ: Сохранение подключения с проверкой
      await this.saveConnection();
      
      // 🔥 ИСПРАВЛЕНИЕ: Финальная проверка перед установкой connected
      const finalAddress = await this.signer.getAddress();
      if (finalAddress !== this.address) {
        throw new Error('Address mismatch after connection');
      }
      
      this.connected = true;
      
      console.log('✅ Successfully connected:', this.address);
      return this.address;
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      
      // 🔥 ИСПРАВЛЕНИЕ: Сбрасываем состояние при ошибке
      this.connected = false;
      this.signer = null;
      this.address = null;
      
      // 🔥 ИСПРАВЛЕНИЕ: Более умная обработка ошибок
      if (!/User rejected|User denied|Cancelled|user closed/i.test(error.message || '')) {
        // Показываем дружелюбное сообщение только для нетривиальных ошибок
        const errorMsg = error.message || 'Connection failed. Please try again.';
        
        // 🔥 ИСПРАВЛЕНИЕ: Используем alert только для критических ошибок
        if (error.message.includes('SafePal') || error.message.includes('wallet') || error.message.includes('connection')) {
          alert(errorMsg);
        } else {
          console.warn('Non-critical connection error:', errorMsg);
        }
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
      let rawProvider = null;

      if (window.safepal) {
        console.log('✅ Using window.safepal');
        rawProvider = window.safepal;
      } else if (window.ethereum && Array.isArray(window.ethereum.providers)) {
        console.log('🔍 Searching SafePal in ethereum.providers');
        rawProvider = window.ethereum.providers.find(p => p && (p.isSafePal || p.isSafePalWallet || p.isSafePalProvider));
      } else if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) {
        console.log('✅ Using window.ethereum (SafePal detected)');
        rawProvider = window.ethereum;
      }

      if (!rawProvider) {
        throw new Error('SafePal provider not found');
      }

      console.log('🔗 Creating ethers provider');
      this.provider = new ethers.providers.Web3Provider(rawProvider);

      console.log('📝 Requesting accounts from SafePal...');
      try {
        await this.provider.send('eth_requestAccounts', []);
      } catch (reqErr) {
        console.warn('eth_requestAccounts failed, trying fallback');
        if (rawProvider.request) {
          await rawProvider.request({ method: 'eth_requestAccounts' });
        } else {
          throw reqErr;
        }
      }

      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();
      
      // Задержка для стабильности
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('✅ SafePal connected:', this.address);
    } catch (error) {
      console.error('❌ SafePal connection failed:', error.message);
      throw error;
    }
}

// Открыть приложение SafePal через deep-link
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
        alert('Пожалуйста используйте мобильный телефон или откройте в браузере SafePal.');
        return;
      }

      console.log('🚀 Opening SafePal via deep-link');

      alert('SafePal откроется сейчас.\n\n1. Подтвердите подключение\n2. Вернитесь на эту страницу\n3. Нажмите Подключить еще раз');

      window.location.href = deepLink;

      // Если приложение не открылось через 3 секунды
      setTimeout(() => {
        if (!this.connected) {
          const install = confirm(
            'SafePal не обнаружен.\n\nУстановить SafePal Wallet?\n\nНажмите ОК чтобы перейти в магазин.'
          );
          if (install) {
            window.open(storeLink, '_blank');
          }
        }
      }, 3000);
    } catch (e) {
      console.error('Deep-link ошибка:', e.message);
    }
}

// Автоматическое подключение если кошелек уже был подключен
async autoConnect() {
    try {
      console.log('🔄 Пытаемся автоподключение...');
      
      if (this.isSafePalBrowser) {
        await this.waitForSafePal(8000);
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      let provider = null;

      if (this.hasSafePalProvider()) {
        if (window.safepal) {
          provider = new ethers.providers.Web3Provider(window.safepal);
        } else if (window.ethereum && Array.isArray(window.ethereum.providers)) {
          const p = window.ethereum.providers.find(p => p && (p.isSafePal || p.isSafePalWallet));
          if (p) provider = new ethers.providers.Web3Provider(p);
        } else if (window.ethereum && (window.ethereum.isSafePal || window.ethereum.isSafePalWallet)) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
        }
        console.log('✅ SafePal провайдер найден');
      } else if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log('✅ Ethereum провайдер найден');
      }

      if (!provider) {
        console.log('⚠️ Провайдер не найден');
        return;
      }

      const accounts = await provider.listAccounts();

      if (accounts && accounts.length > 0) {
        this.provider = provider;
        this.signer = provider.getSigner();
        this.address = accounts[0];
        this.connected = true;
        await this.checkNetwork();
        console.log('✅ Автоподключение успешно:', this.address);
      } else {
        console.log('⚠️ Аккаунты не найдены');
      }
    } catch (error) {
      console.error('❌ Автоподключение ошибка:', error.message);
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
