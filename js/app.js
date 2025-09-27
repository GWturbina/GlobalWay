class GlobalWayApp {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
  }

  async init() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInit();
    return this.initializationPromise;
  }

  async performInit() {
    try {
      // Initialize components
      await this.initializeApp();
      
      // ПРАВИЛЬНАЯ ОБРАБОТКА РЕФЕРАЛЬНЫХ ССЫЛОК
      this.handleReferralLink();
      
      // Initialize managers
      await web3Manager.init();
      uiManager.init();
      initI18n();
      
      // Setup PWA
      this.setupPWA();
      
      this.initialized = true;
      console.log('GlobalWay DApp initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application: ' + error.message);
    }
  }

  async initializeApp() {
    // Set initial page state
    document.getElementById('landing').classList.add('active');
    
    // Check if user came directly to dapp
    if (window.location.hash === '#dapp' || localStorage.getItem('walletConnected')) {
      if (uiManager && uiManager.showDApp) {
        uiManager.showDApp();
      }
    }
  }

  // ПОЛНАЯ ПЕРЕРАБОТКА REFERRAL СИСТЕМЫ
  handleReferralLink() {
    const path = window.location.pathname;
    const refMatch = path.match(/\/ref(\d{7})/);
    
    if (refMatch) {
      const referralId = refMatch[1];
      
      // ВАЛИДАЦИЯ ФОРМАТА ID
      if (!/^\d{7}$/.test(referralId)) {
        console.warn('Invalid referral ID format:', referralId);
        this.cleanupURL();
        return;
      }

      // ПРОВЕРКА НА ФАЛЬШИВЫЕ ID
      if (referralId === '0000000' || referralId === '1111111') {
        console.warn('Invalid referral ID detected:', referralId);
        this.cleanupURL();
        return;
      }

      console.log('Valid referral ID found:', referralId);
      
      // СОХРАНЯЕМ ДЛЯ ИСПОЛЬЗОВАНИЯ ПРИ РЕГИСТРАЦИИ
      localStorage.setItem('pendingReferralId', referralId);
      
      // ОЧИЩАЕМ URL НО СОХРАНЯЕМ ID
      this.cleanupURL();
      
      // ПЕРЕХОДИМ НА DAPP И ПОКАЗЫВАЕМ РЕГИСТРАЦИЮ
      setTimeout(() => {
        this.showDAppWithRegistration(referralId);
      }, 1000);
    }
  }

  // НОВАЯ ФУНКЦИЯ ДЛЯ ПЕРЕХОДА К РЕГИСТРАЦИИ
  showDAppWithRegistration(referralId) {
    // ПЕРЕХОДИМ НА DAPP
    document.getElementById('landing').classList.remove('active');
    document.getElementById('dapp').classList.add('active');
    
    // ПОКАЗЫВАЕМ МОДАЛ РЕГИСТРАЦИИ С РЕФЕРАЛЬНЫМ ID
    this.showRegistrationPrompt(referralId);
  }

  cleanupURL() {
    const cleanURL = window.location.origin + window.location.pathname.replace(/\/ref\d{7}/, '');
    window.history.replaceState({}, document.title, cleanURL);
  }

  // ПРАВИЛЬНЫЙ ПРОМПТ РЕГИСТРАЦИИ С ПОДКЛЮЧЕНИЕМ КОШЕЛЬКА
  showRegistrationPrompt(referralId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center; color: white;
      font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 90%; text-align: center; position: relative;">
        <button onclick="this.closest('.modal-overlay').remove()" 
                style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: #999; font-size: 20px; cursor: pointer;">&times;</button>
        <h3>🎉 Welcome to GlobalWay!</h3>
        <p>You've been invited by user ID: <strong>GW${referralId}</strong></p>
        <p>Connect your SafePal wallet to join the GlobalWay community!</p>
        <div style="margin-top: 20px;">
          <button id="connectAndJoin" class="btn-primary" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin: 5px; cursor: pointer;">
            Connect SafePal & Join
          </button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin: 5px; cursor: pointer;">
            Maybe Later
          </button>
        </div>
      </div>
    `;
    
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    
    // ПРАВИЛЬНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ ПОДКЛЮЧЕНИЯ И РЕГИСТРАЦИИ
    modal.querySelector('#connectAndJoin').onclick = async () => {
      try {
        // СНАЧАЛА ПОДКЛЮЧАЕМ КОШЕЛЕК
        await web3Manager.connect();
        modal.remove();
        
        // ПОСЛЕ ПОДКЛЮЧЕНИЯ АВТОМАТИЧЕСКИ ВЫЗЫВАЕМ РЕГИСТРАЦИЮ
        setTimeout(async () => {
          try {
            // ПРОВЕРЯЕМ СУЩЕСТВУЕТ ЛИ СПОНСОР ЧЕРЕЗ КОНТРАКТ
            const sponsorAddress = await contractManager.getAddressByUserId(referralId);
            
            if (!sponsorAddress) {
              console.warn('Sponsor not found in contract:', referralId);
              this.showError('Sponsor ID not found. Registration without sponsor.');
              if (uiManager && uiManager.showRegistrationModal) {
                uiManager.showRegistrationModal();
              }
              return;
            }

            // ПРЯМОЙ ВЫЗОВ РЕГИСТРАЦИИ С SPONSOR ID
            await this.registerWithSponsorId(referralId);
          } catch (regError) {
            console.error('Registration failed:', regError);
            if (uiManager && uiManager.showRegistrationModal) {
              uiManager.showRegistrationModal();
            }
          }
        }, 1000);
        
      } catch (error) {
        console.error('Connection failed:', error);
        modal.remove();
        this.showError('Failed to connect wallet: ' + error.message);
      }
    };
    
    // AUTO-CLOSE ПОСЛЕ 30 СЕКУНД
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  }

  // НОВАЯ ФУНКЦИЯ ПРЯМОЙ РЕГИСТРАЦИИ С SPONSOR ID
  async registerWithSponsorId(sponsorId) {
    try {
      if (!web3Manager.isConnected) {
        throw new Error('Wallet not connected');
      }

      // ПРОВЕРЯЕМ ЧТО ПОЛЬЗОВАТЕЛЬ НЕ ЗАРЕГИСТРИРОВАН
      const isRegistered = await contractManager.isUserRegistered();
      if (isRegistered) {
        if (uiManager && uiManager.showSuccess) {
          uiManager.showSuccess('You are already registered!');
        }
        return;
      }

      // ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ СПОНСОРА ЧЕРЕЗ КОНТРАКТ
      const sponsorAddress = await contractManager.getAddressByUserId(sponsorId);
      if (!sponsorAddress || sponsorAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Sponsor ID not found in contract');
      }

      console.log('Valid sponsor found, registering with ID:', sponsorId);
      
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТНОГО МЕТОДА РЕГИСТРАЦИИ
      const txHash = await contractManager.sendTransaction(
        'stats', 
        'registerWithSponsorId', 
        [sponsorId], 
        '0x0' // NO PAYMENT REQUIRED FOR REGISTRATION
      );

      if (uiManager && uiManager.showSuccess) {
        uiManager.showSuccess(`Registration transaction sent: ${txHash}`);
      }

      // ОЧИЩАЕМ СОХРАНЕННЫЙ REFERRAL ID
      localStorage.removeItem('pendingReferralId');

      // ОБНОВЛЯЕМ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ЧЕРЕЗ 5 СЕКУНД
      setTimeout(() => {
        if (uiManager && uiManager.loadUserData) {
          uiManager.loadUserData();
        }
      }, 5000);

    } catch (error) {
      console.error('Registration with sponsor failed:', error);
      if (uiManager && uiManager.showError) {
        uiManager.showError('Registration failed: ' + error.message);
      }
      
      // ПОКАЗЫВАЕМ ОБЫЧНУЮ РЕГИСТРАЦИЮ ЕСЛИ СПОНСОР НЕ НАЙДЕН
      if (error.message.includes('not found')) {
        setTimeout(() => {
          if (uiManager && uiManager.showRegistrationModal) {
            uiManager.showRegistrationModal();
          }
        }, 2000);
      }
    }
  }

  // ВАЛИДАЦИЯ РЕФЕРАЛЬНОГО ID ЧЕРЕЗ КОНТРАКТ
  async validateReferralId(referralId) {
    try {
      const cleanId = referralId.toString().replace(/^GW/i, '');
      
      if (!/^\d{7}$/.test(cleanId)) {
        return { valid: false, reason: 'Invalid format' };
      }

      // ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ В КОНТРАКТЕ
      const sponsorAddress = await contractManager.getAddressByUserId(cleanId);
      
      if (!sponsorAddress || sponsorAddress === '0x0000000000000000000000000000000000000000') {
        return { valid: false, reason: 'Sponsor not found' };
      }

      // ПРОВЕРЯЕМ АКТИВНОСТЬ СПОНСОРА
      const isActive = await contractManager.callContract('globalway', 'isUserActive', [sponsorAddress]);
      
      if (!isActive) {
        return { valid: false, reason: 'Sponsor account inactive' };
      }

      return { valid: true, sponsorAddress: sponsorAddress };
    } catch (error) {
      console.error('Referral validation failed:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // ГЕНЕРАЦИЯ РЕФЕРАЛЬНОЙ ССЫЛКИ ТОЛЬКО ДЛЯ ЗАРЕГИСТРИРОВАННЫХ
  async generateReferralLink() {
    try {
      if (!web3Manager.isConnected) {
        throw new Error('Wallet not connected');
      }

      // ПРОВЕРЯЕМ РЕГИСТРАЦИЮ
      const isRegistered = await contractManager.isUserRegistered();
      if (!isRegistered) {
        throw new Error('User must be registered first');
      }

      // ПОЛУЧАЕМ РЕАЛЬНЫЙ ID ИЗ КОНТРАКТА
      let userId = await contractManager.getUserIdByAddress();
      
      if (!userId || userId === '0' || userId === 0) {
        // ЕСЛИ НЕТ ID - ПРИСВАИВАЕМ
        console.log('No ID found, assigning new ID...');
        await contractManager.sendTransaction('stats', 'assignIdToExistingUser', []);
        
        // ЖДЕМ И ПРОВЕРЯЕМ СНОВА
        await new Promise(resolve => setTimeout(resolve, 5000));
        userId = await contractManager.getUserIdByAddress();
        
        if (!userId || userId === '0' || userId === 0) {
          throw new Error('Failed to assign user ID');
        }
      }

      const referralLink = `${window.location.origin}/ref${userId}`;
      return { link: referralLink, id: userId };
    } catch (error) {
      console.error('Failed to generate referral link:', error);
      throw error;
    }
  }

  setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }

    // Install prompt
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button if needed
      this.showInstallPrompt(deferredPrompt);
    });
  }

  showInstallPrompt(deferredPrompt) {
    // НЕ ПОКАЗЫВАЕМ КНОПКУ УСТАНОВКИ НА МОБИЛЬНЫХ УСТРОЙСТВАХ
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return;
    }

    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'btn-secondary';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
    `;
    
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installed');
        }
        deferredPrompt = null;
        installBtn.remove();
      });
    });
    
    document.body.appendChild(installBtn);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installBtn.parentNode) {
        installBtn.remove();
      }
    }, 10000);
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ ПРИ ПОДКЛЮЧЕНИИ КОШЕЛЬКА
  async handleWalletConnected() {
    try {
      const pendingReferralId = localStorage.getItem('pendingReferralId');
      
      if (pendingReferralId) {
        console.log('Processing pending referral registration:', pendingReferralId);
        
        // ПРОВЕРЯЕМ НЕ ЗАРЕГИСТРИРОВАН ЛИ УЖЕ
        const isRegistered = await contractManager.isUserRegistered();
        
        if (!isRegistered) {
          await this.registerWithSponsorId(pendingReferralId);
        } else {
          console.log('User already registered, clearing pending referral');
          localStorage.removeItem('pendingReferralId');
        }
      }
    } catch (error) {
      console.error('Auto-registration failed:', error);
    }
  }

  // ПРОВЕРКА СТАТУСА ПОЛЬЗОВАТЕЛЯ ПРИ ЗАГРУЗКЕ
  async checkUserStatus() {
    try {
      if (!web3Manager.isConnected) return;

      const isRegistered = await contractManager.isUserRegistered();
      const userId = await contractManager.getUserIdByAddress();
      
      console.log('User status check:', {
        connected: web3Manager.isConnected,
        registered: isRegistered,
        userId: userId,
        account: web3Manager.account
      });

      return {
        connected: true,
        registered: isRegistered,
        hasId: userId && userId !== '0' && userId !== 0,
        userId: userId
      };
    } catch (error) {
      console.error('User status check failed:', error);
      return {
        connected: false,
        registered: false,
        hasId: false,
        userId: null
      };
    }
  }
}

// ПРАВИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ С ПРОВЕРКОЙ ГОТОВНОСТИ DOM
function initializeApp() {
  const app = new GlobalWayApp();
  
  // ДОБАВЛЯЕМ ОБРАБОТЧИК ПОДКЛЮЧЕНИЯ КОШЕЛЬКА
  if (typeof web3Manager !== 'undefined') {
    const originalConnect = web3Manager.connect.bind(web3Manager);
    web3Manager.connect = async function() {
      const result = await originalConnect();
      if (result && app.handleWalletConnected) {
        await app.handleWalletConnected();
      }
      return result;
    };
  }
  
  app.init().catch(error => {
    console.error('App initialization failed:', error);
  });
  
  // ЭКСПОРТИРУЕМ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
  window.globalWayApp = app;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
