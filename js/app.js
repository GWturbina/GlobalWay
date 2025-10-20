// 🔥 ИСПРАВЛЕНО: УДАЛЕНА агрессивная очистка кеша
// Теперь НЕ теряем referrer и другие важные данные!

class App {
  constructor() {
    this.initialized = false;
  }

async init() {
  try {
    console.log('Initializing GlobalWay DApp...');
    
    await contracts.loadABIs();
    console.log('✅ ABIs loaded');
    
    await web3Manager.init();
    console.log('✅ Web3 initialized');

    // 🔥 НОВОЕ: Инициализация системы регистрации
    await registrationManager.init();
    console.log('✅ Registration manager initialized');
    
    if (web3Manager.connected && web3Manager.signer) {
      console.log('🔗 Auto-connected wallet detected, initializing contracts...');
      const contractsInitialized = contracts.init();
  
      if (contractsInitialized) {
        console.log('✅ Contracts initialized during auto-connect');
      } else {
        console.warn('⚠️ Failed to initialize contracts during auto-connect');
      }
    }

    // 🔥 НОВОЕ: Проверка регистрации при автоподключении
    if (web3Manager.connected && web3Manager.address) {
      console.log('🔍 Checking registration status...');
  
      setTimeout(async () => {
        try {
          await uiManager.loadUserData();
          await registrationManager.showRegistrationModal();
        } catch (error) {
          console.error('⚠️ Error checking registration:', error);
        }
      }, 2000);
    }
    
    await uiManager.init();
    console.log('✅ UI initialized');
    
    this.setupEvents();
    
    this.setupCopyButtons();
    
    await this.handleUrlParams();
    
    this.setupLanguage();
    
    this.initialized = true;
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('Initialization error:', error);
    Utils.showNotification('Initialization failed', 'error');
  }
}

  setupEvents() {
    // 🔥 ИСПРАВЛЕНО: Убрана избыточная задержка 2000ms
    setTimeout(() => {
      const connectBtn = document.getElementById('connectBtn');
      if (connectBtn) {
        connectBtn.addEventListener('click', () => this.connectWallet());
      }
      
      const openDappBtn = document.getElementById('openDapp');
      if (openDappBtn) {
        openDappBtn.addEventListener('click', () => this.openDapp());
      }
    
      const copyRefLinkBtn = document.getElementById('copyRefLink');
      if (copyRefLinkBtn) {
        copyRefLinkBtn.addEventListener('click', () => {
          const refLink = document.getElementById('refLink');
          if (refLink) {
            Utils.copyToClipboard(refLink.value);
          }
        });
      }
    
      const generateQRBtn = document.getElementById('generateQR');
      if (generateQRBtn) {
        generateQRBtn.addEventListener('click', () => this.generateRefQR());
      }
    
      document.querySelectorAll('.planet').forEach(planet => {
        planet.addEventListener('click', (e) => {
          const planetType = e.currentTarget.dataset.planet;
          this.showPlanetInfo(planetType);
        });
      });
    }, 500); // 🔥 ИСПРАВЛЕНО: 500ms вместо 2000ms
  }

  setupCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.dataset.copy;
        Utils.copyToClipboard(text);
      });
    });
  }

  async handleUrlParams() {
      const params = Utils.getUrlParams();
    
      if (params.ref) {
        let sponsorAddress;
      
        if (params.ref.startsWith('GW')) {
          const userId = Utils.parseUserId(params.ref);
          localStorage.setItem('referrerId', userId.toString());
          console.log('✅ Referrer ID saved:', userId);
        } else if (!isNaN(params.ref)) {
          localStorage.setItem('referrerId', params.ref);
          console.log('✅ Referrer ID saved:', params.ref);
        } else if (Utils.validateAddress(params.ref)) {
          localStorage.setItem('referrer', params.ref);
          console.log('✅ Referrer address saved:', params.ref);
        }
      }
  
      if (params.page) {
        // 🔥 ИСПРАВЛЕНО: Оптимизированная задержка
        setTimeout(() => {
          if (uiManager && typeof uiManager.showPage === 'function') {
            uiManager.showPage(params.page);
          }
        }, 1000); // 🔥 ИСПРАВЛЕНО: 1000ms вместо 3000ms
      }
    }

  setupLanguage() {
    const langSelects = document.querySelectorAll('#langSelect, #langSelectHeader');
    const savedLang = localStorage.getItem('language') || 'en';
    
    langSelects.forEach(select => {
      select.value = savedLang;
      select.addEventListener('change', (e) => {
        const lang = e.target.value;
        this.changeLanguage(lang);
      });
    });
    
    this.changeLanguage(savedLang);
  }

  async changeLanguage(lang) {
    try {
      const response = await fetch(`translations/${lang}.json`);
      const translations = await response.json();
      
      document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.dataset.translate;
        const translation = this.getNestedTranslation(translations, key);
        if (translation) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translation;
          } else {
            el.textContent = translation;
          }
        }
      });
      
      localStorage.setItem('language', lang);
      
      document.querySelectorAll('#langSelect, #langSelectHeader').forEach(select => {
        select.value = lang;
      });
    } catch (error) {
      console.error('Language load error:', error);
    }
  }

  getNestedTranslation(obj, key) {
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
  }

 async connectWallet() {
  try {
    // 🔥 НОВОЕ: Проверяем что уже не подключены
    if (web3Manager.connected && web3Manager.address) {
      console.log('ℹ️ Already connected to:', web3Manager.address);
      Utils.showNotification('Wallet already connected', 'info');
      return;
    }
    
    Utils.showLoader(true);
    Utils.showNotification('Connecting wallet...', 'info');
    
    console.log('🔌 Connecting wallet...');
    
    const address = await web3Manager.connect();
    console.log('✅ Wallet connected:', address);
    
    // 🔥 ИСПРАВЛЕНО: Умная задержка только для мобильных
    if (web3Manager.isMobile) {
      console.log('⏳ Mobile device - waiting for full connection...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 🔥 1.5s вместо 2.5s
    } else {
      await new Promise(resolve => setTimeout(resolve, 500)); // 🔥 0.5s для desktop
    }
    
    // 🔥 ИСПРАВЛЕНО: Расширенная проверка готовности подключения
    if (!web3Manager.connected || !web3Manager.signer || !web3Manager.address) {
      console.error('❌ Connection state incomplete:', {
        connected: web3Manager.connected,
        signer: !!web3Manager.signer,
        address: !!web3Manager.address
      });
      throw new Error('Wallet connection incomplete. Please try again.');
    }
    
    console.log('📦 Initializing contracts...');
    Utils.showNotification('Initializing smart contracts...', 'info');
    
    // 🔥 ИСПРАВЛЕНО: Короткая задержка перед инициализацией
    await new Promise(resolve => setTimeout(resolve, 300)); // 🔥 300ms вместо 1000ms
    
    const contractsInitialized = contracts.init();
    
    if (!contractsInitialized) {
      Utils.showLoader(false);
      Utils.showNotification(
        'Failed to initialize smart contracts. Please refresh the page and try again.', 
        'error'
      );
      console.error('❌ Contract initialization returned false');
      console.log('Available ABIs:', Object.keys(contracts.abis).filter(k => contracts.abis[k]));
      return;
    }
    
    console.log('✅ Contracts initialized');
    
    // 🔥 НОВОЕ: Устанавливаем мониторинг смены аккаунта ПОСЛЕ подключения
    await this.monitorAccount();
    
    // 🔥 ИСПРАВЛЕНО: Быстрое переключение на DApp интерфейс
    await this.showDAppInterface();
    
  } catch (error) {
    console.error('❌ Wallet connection error:', error);
    
    let errorMessage;
    
    // 🔥 ИСПРАВЛЕНО: Лучшая обработка ошибок SafePal
    if (error.message.includes('User rejected') || error.message.includes('User denied')) {
      errorMessage = 'Connection cancelled';
    } else if (error.message.includes('Please complete connection in SafePal')) {
      errorMessage = error.message;
    } else if (error.message.includes('SafePal')) {
      if (web3Manager.isMobile) {
        errorMessage = 'SafePal Wallet not detected. Please:\n1. Install SafePal Wallet app\n2. Open this link in SafePal DApp browser';
      } else {
        errorMessage = 'SafePal extension not detected. Please install SafePal browser extension.';
      }
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection to opBNB network.';
    } else if (error.message.includes('opBNB')) {
      errorMessage = 'Please switch to opBNB network in your wallet';
    } else {
      errorMessage = error.message;
    }
    
    Utils.showNotification(errorMessage, 'error');
  } finally {
    Utils.showLoader(false);
  }
}

// 🔥 ИСПРАВЛЕНО: Оптимизированная загрузка интерфейса
async showDAppInterface() {
  const landing = document.getElementById('landing');
  const dapp = document.getElementById('dapp');
  
  if (landing) landing.classList.remove('active');
  if (dapp) dapp.classList.add('active');
  
  // 🔥 ИСПРАВЛЕНО: Короткая задержка для UI
  const uiDelay = web3Manager.isMobile ? 600 : 300; // 🔥 Уменьшено
  console.log(`⏳ Loading UI in ${uiDelay}ms...`);
  await new Promise(resolve => setTimeout(resolve, uiDelay));
  
  try {
    await uiManager.loadUserData();
    await uiManager.updateUI();
    
    // 🔥 ИСПРАВЛЕНО: Одно обновление вместо нескольких
    await new Promise(resolve => setTimeout(resolve, 200));
    uiManager.updateHeader();
    uiManager.updateCabinet();
    
    if (web3Manager.isAdmin()) {
      document.body.classList.add('admin-access');
      console.log('✅ Admin access granted');
    }
    
    uiManager.showPage('dashboard');
    await uiManager.loadPageData('dashboard');
    
    Utils.showNotification('Welcome to GlobalWay!', 'success');

    // 🔥 НОВОЕ: Проверка регистрации и показ модального окна
    setTimeout(async () => {
      await registrationManager.showRegistrationModal();
    }, 500);
    
  } catch (uiError) {
    console.error('❌ UI loading error:', uiError);
    Utils.showNotification('Interface loading failed. Please refresh.', 'error');
  }
}

  async openDapp() {
    try {
      if (!web3Manager.connected) {
        console.log('🔌 Connecting wallet from landing...');
        await this.connectWallet();
      }
    
      const landing = document.getElementById('landing');
      const dapp = document.getElementById('dapp');
    
      if (landing) landing.classList.remove('active');
      if (dapp) dapp.classList.add('active');
    
    } catch (error) {
      console.error('Failed to open DApp:', error);
      Utils.showNotification('Please connect your wallet first', 'error');
    }
  }

  showPlanetInfo(planetType) {
    const modal = document.getElementById('planetModal');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');
    
    if (!modal || !title || !text) return;
    
    const currentLang = localStorage.getItem('language') || 'en';
    
    const loadPlanetTranslations = async () => {
      try {
        const response = await fetch(`translations/${currentLang}.json`);
        const translations = await response.json();
        
        const planetKey = `planets.${planetType}`;
        const planetTitleKey = `${planetKey}Title`;
        const planetTextKey = `${planetKey}Text`;
        
        const planetTitle = this.getNestedTranslation(translations, planetTitleKey) || 
                           this.getNestedTranslation(translations, `planets.${planetType}`) ||
                           this.getDefaultPlanetTitle(planetType);
        
        const planetText = this.getNestedTranslation(translations, planetTextKey) ||
                          this.getDefaultPlanetText(planetType);
        
        title.textContent = planetTitle;
        text.textContent = planetText;
        modal.style.display = 'block';
        
      } catch (error) {
        console.error('Error loading planet translations:', error);
        
        const defaultInfo = this.getDefaultPlanetInfo(planetType);
        title.textContent = defaultInfo.title;
        text.textContent = defaultInfo.text;
        modal.style.display = 'block';
      }
    };
    
    loadPlanetTranslations();
  }

  getDefaultPlanetTitle(planetType) {
    const titles = {
      'club': 'Club GlobalWay',
      'mission': 'Our Mission',
      'goals': 'Club Goals',
      'roadmap': 'Roadmap',
      'projects': 'Our Projects'
    };
    return titles[planetType] || planetType;
  }

  getDefaultPlanetText(planetType) {
    const texts = {
      'club': 'A decentralized community platform built on opBNB blockchain, uniting people worldwide through innovative projects and partnerships.',
      'mission': 'To create a transparent, decentralized ecosystem where everyone can participate, earn, and contribute to the future of Web3.',
      'goals': 'Build 8+ innovative projects, create sustainable economy, establish global community, and achieve financial freedom for members.',
      'roadmap': '2025: Platform launch and 8 projects. 2026: GWT token enters securities market. 2027: Leadership among global communities. 2028: Building eco-settlements.',
      'projects': '8 revolutionary projects: KardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalSocial, GlobalBank, GlobalEdu, EcoVillages.'
    };
    return texts[planetType] || 'Information about this section.';
  }

  getDefaultPlanetInfo(planetType) {
    return {
      title: this.getDefaultPlanetTitle(planetType),
      text: this.getDefaultPlanetText(planetType)
    };
  }

  async generateRefQR() {
    const refLinkEl = document.getElementById('refLink');
    if (!refLinkEl) return;
    
    const refLink = refLinkEl.value;
    if (!refLink) {
      Utils.showNotification('No referral link available', 'error');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h3>Referral QR Code</h3>
        <div id="qrcode" style="display: flex; justify-content: center; padding: 20px;"></div>
        <p style="text-align: center; word-break: break-all;">${refLink}</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    await Utils.generateQR(refLink, 'qrcode');
    
    modal.querySelector('.close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  async monitorAccount() {
    // 🔥 ИСПРАВЛЕНО: Убрана проверка connected - теперь всегда устанавливаем слушатели
    console.log('🔊 Setting up account change listeners...');
    
    // 🔥 ИСПРАВЛЕНО: Сначала удаляем старые слушатели (если есть)
    if (window.ethereum && window.ethereum.removeListener) {
      try {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      } catch (e) {
        console.warn('Could not remove old ethereum listeners:', e);
      }
    }
    
    if (window.safepal && window.safepal.removeListener) {
      try {
        window.safepal.removeAllListeners('accountsChanged');
        window.safepal.removeAllListeners('chainChanged');
      } catch (e) {
        console.warn('Could not remove old safepal listeners:', e);
      }
    }
    
    // 🔥 ИСПРАВЛЕНО: Универсальный обработчик для любого провайдера
    const handleAccountsChanged = async (accounts) => {
      console.log('🔄 Account changed:', accounts);
      
      if (!accounts || accounts.length === 0) {
        console.log('❌ No accounts, disconnecting...');
        await web3Manager.disconnect();
        window.location.reload();
      } else if (web3Manager.address && accounts[0].toLowerCase() !== web3Manager.address.toLowerCase()) {
        console.log('🔄 Different account detected, reloading...');
        console.log('Old:', web3Manager.address);
        console.log('New:', accounts[0]);
        window.location.reload();
      }
    };
    
    const handleChainChanged = (chainId) => {
      console.log('🔄 Chain changed:', chainId);
      window.location.reload();
    };
    
    // Устанавливаем слушатели для window.ethereum
    if (window.ethereum) {
      console.log('✅ Setting up ethereum listeners');
      
      if (typeof window.ethereum.on === 'function') {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } else {
        console.warn('⚠️ window.ethereum.on not available, trying addEventListener');
        try {
          window.ethereum.addEventListener('accountsChanged', handleAccountsChanged);
          window.ethereum.addEventListener('chainChanged', handleChainChanged);
        } catch (e) {
          console.warn('Could not add ethereum event listeners:', e);
        }
      }
    }
    
    // Устанавливаем слушатели для window.safepal
    if (window.safepal) {
      console.log('✅ Setting up safepal listeners');
      
      if (typeof window.safepal.on === 'function') {
        window.safepal.on('accountsChanged', handleAccountsChanged);
        window.safepal.on('chainChanged', handleChainChanged);
      } else {
        console.warn('⚠️ window.safepal.on not available, trying addEventListener');
        try {
          window.safepal.addEventListener('accountsChanged', handleAccountsChanged);
          window.safepal.addEventListener('chainChanged', handleChainChanged);
        } catch (e) {
          console.warn('Could not add safepal event listeners:', e);
        }
      }
    }
    
    console.log('✅ Account monitoring active');
  }
}

const app = new App();

window.addEventListener('DOMContentLoaded', async () => {
  await app.init();
  app.monitorAccount();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('Service Worker registered');
  }).catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (!event.error.message.includes('ResizeObserver')) {
    Utils.showNotification('An error occurred', 'error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  Utils.showNotification('Transaction rejected or failed', 'error');
});
