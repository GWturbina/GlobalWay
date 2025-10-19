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
    Utils.showNotification('Connecting wallet...', 'info');
    
    console.log('🔌 Connecting wallet...');
    
    const address = await web3Manager.connect();
    console.log('✅ Wallet connected:', address);
    
    // 🔥 ИСПРАВЛЕНИЕ: Умные задержки для разных устройств
    const isMobile = web3Manager.isMobile;
    const connectDelay = isMobile ? 2500 : 1000;
    console.log(`⏳ Waiting ${connectDelay}ms for full connection...`);
    await new Promise(resolve => setTimeout(resolve, connectDelay));
    
    // 🔥 ИСПРАВЛЕНИЕ: Расширенная проверка готовности подключения
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
    
    // 🔥 ИСПРАВЛЕНИЕ: Увеличенная задержка перед инициализацией контрактов
    const initDelay = isMobile ? 1000 : 500;
    await new Promise(resolve => setTimeout(resolve, initDelay));
    
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
    
    // 🔥 ИСПРАВЛЕНИЕ: Более тщательная проверка критических контрактов
    const criticalContracts = ['globalway', 'token', 'stats'];
    const missingContracts = criticalContracts.filter(contract => !contracts.contracts[contract]);
    
    if (missingContracts.length > 0) {
      throw new Error(`Critical contracts not initialized: ${missingContracts.join(', ')}`);
    }
    
    console.log('✅ All contracts initialized successfully');
    console.log('📊 Initialized contracts:', Object.keys(contracts.contracts).filter(k => contracts.contracts[k]));
    
    Utils.showNotification('Wallet connected successfully!', 'success');
    
    // 🔥 ИСПРАВЛЕНИЕ: Проверка регистрации с улучшенной обработкой
    let isRegistered = false;
    try {
      isRegistered = await contracts.isUserRegistered(address);
      console.log('📝 User registered:', isRegistered);
    } catch (regError) {
      console.error('❌ Error checking registration:', regError);
      // Продолжаем, так как это может быть временной ошибкой
    }
    
if (!isRegistered) {
  let referrer = localStorage.getItem('referrer');
  
  const referrerId = localStorage.getItem('referrerId');
  if (referrerId && !referrer) {
    try {
      if (contracts.contracts.stats) {
        console.log('🔍 Resolving referrer ID:', referrerId);
        referrer = await contracts.getAddressByUserId(parseInt(referrerId));
        
        if (referrer && referrer !== ethers.constants.AddressZero) {
          localStorage.setItem('referrer', referrer);
          console.log('✅ Referrer address resolved:', referrer);
        } else {
          console.warn('⚠️ Referrer ID resolved to zero address');
        }
      } else {
        console.warn('⚠️ Stats contract not available for referrer resolution');
      }
    } catch (error) {
      console.error('Error resolving referrer ID:', error);
    }
  }
  
  // ГЛАВНОЕ ИСПРАВЛЕНИЕ: Всегда показываем регистрацию
  if (referrer && Utils.validateAddress(referrer)) {
    console.log('✅ Valid referrer found, showing registration modal');
    await new Promise(resolve => setTimeout(resolve, 500));
    uiManager.showRegistrationModal();
  } else {
    console.warn('⚠️ No valid referrer, showing referral input dialog');
    
    // Показываем модальное окно с просьбой о реферере
    const needRefModal = document.createElement('div');
    needRefModal.className = 'modal';
    needRefModal.id = 'needReferralModal';
    needRefModal.style.display = 'block';
    needRefModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px; margin: 50px auto; padding: 30px; background: #1a1a2e; border-radius: 10px; text-align: center;">
        <h3 style="color: #00ff88; margin-bottom: 20px;">Registration Required</h3>
        <p style="color: #ccc; margin-bottom: 20px;">To register in GlobalWay, please provide a referral link or ID from your sponsor.</p>
        
        <input type="text" id="manualReferrer" placeholder="Enter referrer address or ID (e.g., GW123456)" 
               style="width: 100%; padding: 12px; margin: 15px 0; border-radius: 5px; border: 1px solid #00ff88; background: #0f0f1e; color: #fff;">
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
          <button id="registerWithRefBtn" onclick="app.registerWithManualReferrer()" 
                  style="flex: 1; padding: 12px; background: #00ff88; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            Register
          </button>
          <button onclick="document.getElementById('needReferralModal').remove()" 
                  style="flex: 1; padding: 12px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
            Cancel
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(needRefModal);
  }
} else {
  await this.showDAppInterface();
}
    
  } catch (error) {
    console.error('Connect error:', error);
    
    // 🔥 ИСПРАВЛЕНИЕ: Более точные сообщения об ошибках
    let errorMessage = 'Connection failed';
    if (error.message.includes('user rejected') || error.message.includes('User denied')) {
      errorMessage = 'Connection cancelled in wallet';
    } else if (error.message.includes('SafePal') || error.message.includes('wallet')) {
      errorMessage = 'Wallet connection failed. Please ensure SafePal is installed and try again.';
    } else if (error.message.includes('network') || error.message.includes('chain')) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message;
    }
    
    Utils.showNotification(errorMessage, 'error');
  } finally {
    Utils.showLoader(false);
  }
}

// 🔥 ДОБАВЬ ЭТУ ВСПОМОГАТЕЛЬНУЮ ФУНКЦИЮ В КЛАСС App:
async showDAppInterface() {
  const landing = document.getElementById('landing');
  const dapp = document.getElementById('dapp');
  
  if (landing) landing.classList.remove('active');
  if (dapp) dapp.classList.add('active');
  
  // 🔥 ИСПРАВЛЕНИЕ: Умные задержки для UI загрузки
  const uiDelay = web3Manager.isMobile ? 1200 : 600;
  console.log(`⏳ Loading UI in ${uiDelay}ms...`);
  await new Promise(resolve => setTimeout(resolve, uiDelay));
  
  // 🔥 ИСПРАВЛЕНИЕ: Последовательная загрузка данных с retry
  try {
    await uiManager.loadUserData();
    await uiManager.updateUI();
    
    // 🔥 ИСПРАВЛЕНИЕ: Принудительное обновление интерфейса
    await new Promise(resolve => setTimeout(resolve, 400));
    uiManager.updateHeader();
    uiManager.updateCabinet();
    
    // 🔥 ИСПРАВЛЕНИЕ: Проверка админских прав
    if (web3Manager.isAdmin()) {
      document.body.classList.add('admin-access');
      console.log('✅ Admin access granted');
    }
    
    // 🔥 ИСПРАВЛЕНИЕ: Показ dashboard с задержкой
    uiManager.showPage('dashboard');
    await new Promise(resolve => setTimeout(resolve, 300));
    await uiManager.loadPageData('dashboard');
    
    Utils.showNotification('Welcome to GlobalWay!', 'success');
    
  } catch (uiError) {
    console.error('❌ UI loading error:', uiError);
    Utils.showNotification('Interface loading failed. Please refresh.', 'error');
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

  async registerWithManualReferrer() {
    const input = document.getElementById('manualReferrer');
    if (!input) return;
    
    const referrerInput = input.value.trim();
    
    if (!referrerInput) {
      Utils.showNotification('Please enter referrer address or ID', 'error');
      return;
    }
    
    let referrer = referrerInput;
    
    try {
      if (referrerInput.startsWith('GW')) {
        console.log('Converting GW ID to address...');
        const userId = Utils.parseUserId(referrerInput);
        referrer = await contracts.getAddressByUserId(userId);
      } else if (!isNaN(referrerInput)) {
        console.log('Converting numeric ID to address...');
        referrer = await contracts.getAddressByUserId(parseInt(referrerInput));
      }
      
      if (referrer && Utils.validateAddress(referrer) && referrer !== ethers.constants.AddressZero) {
        console.log('✅ Valid referrer resolved:', referrer);
        localStorage.setItem('referrer', referrer);
        document.getElementById('needReferralModal').remove();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        uiManager.showRegistrationModal();
      } else {
        Utils.showNotification('Invalid referrer address or ID', 'error');
      }
    } catch (error) {
      console.error('Error resolving referrer:', error);
      Utils.showNotification('Could not find referrer. Please check the address or ID.', 'error');
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
