// 🔥 ОЧИСТКА КЭША - ДОБАВЛЕНО В НАЧАЛО ФАЙЛА
const APP_VERSION = '1.2.0';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
  console.log('🔄 New version detected, clearing cache...');
  console.log(`Old version: ${storedVersion}, New version: ${APP_VERSION}`);
  
  // 🔥 НОВОЕ: Очистка Service Worker кеша
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        console.log('🗑️ Unregistering Service Worker');
        reg.unregister();
      });
    });
  }
  
  // Очистка localStorage
  localStorage.clear();
  localStorage.setItem('app_version', APP_VERSION);
  
  console.log('✅ Cache cleared successfully');
  
  // 🔥 НОВОЕ: Перезагрузка страницы БЕЗ кеша
  setTimeout(() => {
    console.log('🔄 Reloading page without cache...');
    window.location.reload(true);
  }, 500);
}

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
    
    if (web3Manager.connected && web3Manager.signer) {
      console.log('🔗 Auto-connected wallet detected, initializing contracts...');
      const contractsInitialized = contracts.init();
      
      if (contractsInitialized) {
        console.log('✅ Contracts initialized during auto-connect');
      } else {
        console.warn('⚠️ Failed to initialize contracts during auto-connect');
      }
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
    // Задержка для мобильных браузеров
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
    }, 2000); 
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
        // 🔥 ИСПРАВЛЕНО: Увеличена задержка для SafePal на мобильном
        setTimeout(() => {
          if (uiManager && typeof uiManager.showPage === 'function') {
            uiManager.showPage(params.page);
          }
        }, 3000); // 3000мс вместо 500мс
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
    Utils.showLoader(true);
    
    console.log('🔌 Connecting wallet...');
    
    const address = await web3Manager.connect();
    console.log('✅ Wallet connected:', address);
    
    // 🔥 НОВОЕ: Ждём полного коннекта (особенно для SafePal на мобильном)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 🔥 НОВОЕ: Проверяем что коннект действительно установлен
    if (!web3Manager.connected || !web3Manager.signer) {
      throw new Error('Wallet connected but signer not ready. Please try again.');
    }
    
    console.log('📦 Initializing contracts...');
    
    // 🔥 НОВОЕ: Маленькая задержка перед инициализацией контрактов
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const contractsInitialized = contracts.init();
    
    if (!contractsInitialized) {
      Utils.showLoader(false);
      Utils.showNotification(
        'Failed to initialize smart contracts. Please refresh the page and try again.', 
        'error'
      );
      console.error('❌ Contract initialization returned false');
      console.log('Available ABIs:', Object.keys(contracts.abis).filter(k => contracts.abis[k]));
      console.log('Initialized contracts:', Object.keys(contracts.contracts).filter(k => contracts.contracts[k]));
      throw new Error('Contract initialization failed. Check console for details.');
    }
    
    // 🔥 НОВОЕ: Проверяем что критические контракты инициализированы
    if (!contracts.contracts.globalway || !contracts.contracts.token) {
      throw new Error('Critical contracts not initialized');
    }
    
    console.log('✅ All contracts initialized successfully');
    console.log('📊 Initialized contracts:', Object.keys(contracts.contracts).filter(k => contracts.contracts[k]));
    
    Utils.showNotification('Wallet connected!', 'success');
    
    const isRegistered = await contracts.isUserRegistered(address);
    console.log('📝 User registered:', isRegistered);
    
    if (!isRegistered) {
      let referrer = localStorage.getItem('referrer');
      
      const referrerId = localStorage.getItem('referrerId');
      if (referrerId && !referrer) {
        try {
          if (contracts.contracts.stats) {
            referrer = await contracts.getAddressByUserId(parseInt(referrerId));
            localStorage.setItem('referrer', referrer);
            console.log('✅ Referrer address resolved:', referrer);
          } else {
            console.warn('⚠️ Stats contract not initialized, cannot resolve referrer ID');
          }
        } catch (error) {
          console.error('Error resolving referrer ID:', error);
        }
      }
      
      if (referrer && Utils.validateAddress(referrer)) {
        uiManager.showRegistrationModal();
      } else {
        Utils.showNotification('You need a referral link to register', 'error');
      }
    } else {
      const landing = document.getElementById('landing');
      const dapp = document.getElementById('dapp');
      
      if (landing) landing.classList.remove('active');
      if (dapp) dapp.classList.add('active');
      
      // 🔥 НОВОЕ: Задержка перед загрузкой UI (даём время SafePal)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await uiManager.loadUserData();
      await uiManager.updateUI();
      
      // 🔥 НОВОЕ: Принудительное обновление header (для кнопки Connect)
      await new Promise(resolve => setTimeout(resolve, 300));
      uiManager.updateHeader();
      uiManager.updateCabinet();
      
      if (web3Manager.isAdmin()) {
        document.body.classList.add('admin-access');
        console.log('✅ Admin class added to body after wallet connect');
      }
      
      uiManager.showPage('dashboard');
      await uiManager.loadPageData('dashboard');
      
      Utils.showNotification('Welcome to GlobalWay!', 'success');
    }
    
  } catch (error) {
    console.error('Connect error:', error);
    Utils.showNotification('Connection failed: ' + error.message, 'error');
  } finally {
    Utils.showLoader(false);
  }
}

  async openDapp() {
    // 🔥 ИСПРАВЛЕНО: Сначала подключаем кошелек, потом показываем DApp
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
    if (!web3Manager.connected) return;
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          await web3Manager.disconnect();
          window.location.reload();
        } else if (accounts[0] !== web3Manager.address) {
          window.location.reload();
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    if (window.safepal) {
      window.safepal.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          await web3Manager.disconnect();
          window.location.reload();
        } else if (accounts[0] !== web3Manager.address) {
          window.location.reload();
        }
      });
      
      window.safepal.on('chainChanged', () => {
        window.location.reload();
      });
    }
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
