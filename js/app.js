// 🔥 ОЧИСТКА КЭША - ДОБАВЛЕНО В НАЧАЛО ФАЙЛА
const APP_VERSION = '1.2.0';
(function() {
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion !== APP_VERSION) {
    (async () => {
      console.log('🔄 New version detected, clearing cache...');
      console.log(`Old version: ${storedVersion}, New version: ${APP_VERSION}`);

      // Сохраним критичные ключи (например language) перед очисткой
      const savedLang = localStorage.getItem('language');

      // 🔥 НОВОЕ: Очистка Service Worker кеша — ждём завершения
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            try {
              console.log('🗑️ Unregistering Service Worker', reg);
              await reg.unregister();
            } catch (e) {
              console.warn('Service worker unregister failed:', e);
            }
          }
        } catch (e) {
          console.warn('Failed to get serviceWorker registrations:', e);
        }
      }

      // Очистка localStorage, но сохраним язык
      try {
        localStorage.clear();
        if (savedLang) localStorage.setItem('language', savedLang);
        localStorage.setItem('app_version', APP_VERSION);
      } catch (e) {
        console.warn('localStorage clear failed:', e);
      }

      console.log('✅ Cache cleared successfully');

      // 🔥 НОВОЕ: Надёжный reload с cache-busting (замена URL)
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', APP_VERSION);
        // replace не сохраняет в history — удобно для перезагрузки
        window.location.replace(url.toString());
      } catch (e) {
        console.warn('Failed to reload via replace, falling back to reload():', e);
        window.location.reload();
      }
    })();
  }
})();

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

      // Если web3Manager уже auto-connected (например в расширении), инициализируем контракты
      try {
        if (web3Manager && web3Manager.connected && web3Manager.signer) {
          console.log('🔗 Auto-connected wallet detected, initializing contracts...');
          await contracts.init();
          console.log('✅ Contracts initialized during auto-connect');
        } else {
          // Если нет авто-коннекта, не инициализируем контракты пока нет кошелька
          console.log('ℹ️ No auto-connect detected — contracts will be initialized on connect');
        }
      } catch (e) {
        console.warn('⚠️ Contracts init during auto-connect failed:', e);
      }

      await uiManager.init();
      console.log('✅ UI initialized');

      // Навешиваем обработчики — делаем это быстро, но безопасно
      this.setupEvents();
      this.setupCopyButtons();

      await this.handleUrlParams();

      // changeLanguage использует fetch — await полезен
      await this.setupLanguage();

      this.initialized = true;
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      try { Utils.showNotification('Initialization failed', 'error'); } catch(e){ console.warn(e); }
    }
  }

  setupEvents() {
    // Навешиваем обработчики в очереди событий — используем requestIdleCallback если доступно,
    // иначе короткая setTimeout (100ms) — меньшая задержка, чем 2000ms, но дающая время рендеру
    const attach = () => {
      try {
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
              Utils.copyToClipboard(refLink.value || refLink.textContent || '');
            } else {
              Utils.showNotification('Referral link not available', 'error');
            }
          });
        }

        const generateQRBtn = document.getElementById('generateQR');
        if (generateQRBtn) {
          generateQRBtn.addEventListener('click', () => this.generateRefQR());
        }

        // Делегирование: ускоряет и устойчивее, чем навешивать на каждую .planet
        const planetsContainer = document.getElementById('planetsContainer');
        if (planetsContainer) {
          planetsContainer.addEventListener('click', (e) => {
            const planet = e.target.closest('.planet');
            if (!planet) return;
            const planetType = planet.dataset && planet.dataset.planet;
            if (planetType) this.showPlanetInfo(planetType);
          });
        } else {
          // fallback: навешиваем по классу
          document.querySelectorAll('.planet').forEach(planet => {
            planet.addEventListener('click', (e) => {
              const planetType = e.currentTarget.dataset && e.currentTarget.dataset.planet;
              if (planetType) this.showPlanetInfo(planetType);
            });
          });
        }
      } catch (e) {
        console.warn('setupEvents attach failed:', e);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(attach, { timeout: 200 });
    } else {
      setTimeout(attach, 100);
    }
  }

  setupCopyButtons() {
    try {
      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const text = e.currentTarget.dataset && e.currentTarget.dataset.copy;
          if (text) {
            Utils.copyToClipboard(text);
          } else {
            Utils.showNotification('Copy text missing', 'error');
          }
        });
      });
    } catch (e) {
      console.warn('setupCopyButtons failed:', e);
    }
  }

  async handleUrlParams() {
    try {
      const params = Utils.getUrlParams();

      if (params && params.ref) {
        let sponsorAddress;

        if (params.ref.startsWith('GW')) {
          const userId = Utils.parseUserId(params.ref);
          if (!isNaN(userId)) {
            localStorage.setItem('referrerId', userId.toString());
            console.log('✅ Referrer ID saved:', userId);
          }
        } else if (!isNaN(params.ref)) {
          localStorage.setItem('referrerId', params.ref);
          console.log('✅ Referrer ID saved:', params.ref);
        } else if (Utils.validateAddress(params.ref)) {
          localStorage.setItem('referrer', params.ref);
          console.log('✅ Referrer address saved:', params.ref);
        }
      }

      if (params && params.page) {
        // увеличиваем задержку для мобильных провайдеров, но даём возможность UI прогрузиться
        await new Promise(r => setTimeout(r, 800)); // 800ms — компромисс
        if (uiManager && typeof uiManager.showPage === 'function') {
          uiManager.showPage(params.page);
        }
      }
    } catch (e) {
      console.warn('handleUrlParams error:', e);
    }
  }

  async setupLanguage() {
    try {
      const langSelects = document.querySelectorAll('#langSelect, #langSelectHeader');
      const savedLang = localStorage.getItem('language') || 'en';

      langSelects.forEach(select => {
        try {
          select.value = savedLang;
          select.addEventListener('change', (e) => {
            const lang = e.target.value;
            this.changeLanguage(lang);
          });
        } catch (e) {
          // ignoring potential errors for non-input elements
        }
      });

      await this.changeLanguage(savedLang);
    } catch (e) {
      console.warn('setupLanguage error:', e);
    }
  }

  async changeLanguage(lang) {
    try {
      const response = await fetch(`translations/${lang}.json`);
      if (!response.ok) throw new Error(`Language file ${lang} load failed: ${response.status}`);
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
        try { select.value = lang; } catch(e) {}
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

      if (!address) {
        throw new Error('No address returned from web3Manager.connect()');
      }

      console.log('✅ Wallet connected:', address);

      console.log('📦 Initializing contracts...');
      try {
        await contracts.init(); // await — важно
      } catch (e) {
        Utils.showLoader(false);
        Utils.showNotification(
          'Failed to initialize smart contracts. Please refresh the page and try again.',
          'error'
        );
        console.error('❌ Contract initialization failed during connect:', e);
        throw e;
      }

      console.log('✅ All contracts initialized successfully');
      console.log('📊 Initialized contracts:', Object.keys(contracts.contracts || {}).filter(k => contracts.contracts[k]));

      Utils.showNotification('Wallet connected!', 'success');

      const isRegistered = await contracts.isUserRegistered(address).catch(err => {
        console.warn('isUserRegistered call failed:', err);
        return false;
      });

      console.log('📝 User registered:', isRegistered);

      if (!isRegistered) {
        let referrer = localStorage.getItem('referrer');
        const referrerId = localStorage.getItem('referrerId');

        if (referrerId && !referrer) {
          try {
            if (contracts.contracts && contracts.contracts.stats) {
              referrer = await contracts.getAddressByUserId(parseInt(referrerId));
              if (referrer) {
                localStorage.setItem('referrer', referrer);
                console.log('✅ Referrer address resolved:', referrer);
              }
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

        await uiManager.updateUI();

        // Явное обновление header после подключения
        try { uiManager.updateHeader(); } catch(e) { console.warn('updateHeader failed:', e); }
        try { uiManager.updateCabinet(); } catch(e) { console.warn('updateCabinet failed:', e); }

        // Проверяем админ права
        try {
          if (web3Manager.isAdmin && web3Manager.isAdmin()) {
            document.body.classList.add('admin-access');
            console.log('✅ Admin class added to body after wallet connect');
          }
        } catch (e) {
          console.warn('isAdmin check failed:', e);
        }

        uiManager.showPage('dashboard');

        Utils.showNotification('Welcome to GlobalWay!', 'success');
      }
    } catch (error) {
      console.error('Connect error:', error);
      try { Utils.showNotification('Connection failed: ' + (error && error.message ? error.message : error), 'error'); } catch(e){}
    } finally {
      Utils.showLoader(false);
    }
  }

  async openDapp() {
    try {
      if (!web3Manager || !web3Manager.connected) {
        console.log('🔌 Connecting wallet from landing...');
        await this.connectWallet();
      }

      const landing = document.getElementById('landing');
      const dapp = document.getElementById('dapp');

      if (landing) landing.classList.remove('active');
      if (dapp) dapp.classList.add('active');

    } catch (error) {
      console.error('Failed to open DApp:', error);
      try { Utils.showNotification('Please connect your wallet first', 'error'); } catch(e){}
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
    if (!refLinkEl) {
      Utils.showNotification('Referral link element not found', 'error');
      return;
    }

    const refLink = refLinkEl.value || refLinkEl.textContent;
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
    try {
      // Используем единый провайдер: SafePal предпочтительнее если есть
      const provider = window.safepal || window.ethereum;
      if (!provider) return;

      // Если провайдер поддерживает .on (event emitter)
      if (typeof provider.on === 'function') {
        // Чтобы избежать дублирующих обработчиков — удаляем старые слушатели при наличии removeListener
        const safeHandler = async (accounts) => {
          try {
            if (!accounts || accounts.length === 0) {
              await web3Manager.disconnect();
              window.location.reload();
            } else if (accounts[0] !== web3Manager.address) {
              window.location.reload();
            }
          } catch (e) { console.warn('safeHandler err', e); }
        };

        try {
          if (typeof provider.removeListener === 'function') {
            provider.removeListener('accountsChanged', safeHandler);
            provider.removeListener('chainChanged', () => window.location.reload());
          }
        } catch(e) { /* ignore */ }

        provider.on('accountsChanged', safeHandler);
        provider.on('chainChanged', () => {
          try { window.location.reload(); } catch(e) { console.warn(e); }
        });
      }
    } catch (e) {
      console.warn('monitorAccount error:', e);
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
  try {
    if (!event.error || !event.error.message || !event.error.message.includes('ResizeObserver')) {
      Utils.showNotification('An error occurred', 'error');
    }
  } catch(e) {}
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  try { Utils.showNotification('Transaction rejected or failed', 'error'); } catch(e){}
});
