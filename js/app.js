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
      
      // ИСПРАВЛЕНО: Проверяем реферальную ссылку
      this.handleReferralLink();
      
      // Initialize managers
      await web3Manager.init();
      if (typeof uiManager !== 'undefined') {
        uiManager.init();
      }
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

  // ИСПРАВЛЕНО: Проверка реферальной ссылки с валидацией
  handleReferralLink() {
    const path = window.location.pathname;
    const refMatch = path.match(/\/ref(\d{7})/);
    
    if (refMatch) {
      const referralId = refMatch[1];
      
      // ИСПРАВЛЕНО: Валидируем формат ID
      if (!/^\d{7}$/.test(referralId)) {
        console.warn('Invalid referral ID format:', referralId);
        this.cleanupURL();
        return;
      }

      // ИСПРАВЛЕНО: Проверяем что ID не является очевидно фальшивым
      if (referralId === '0000000' || referralId === '1111111') {
        console.warn('Invalid referral ID detected:', referralId);
        this.cleanupURL();
        return;
      }

      console.log('Valid referral ID found:', referralId);
      localStorage.setItem('referralId', referralId);
      sessionStorage.setItem('pendingRegistration', 'true');

      // НЕ очищаем URL, оставляем реферальную ссылку
      // this.cleanupURL(); - УБИРАЕМ ЭТУ СТРОКУ

      // Показываем промпт регистрации через 500мс
      setTimeout(() => {
        this.showRegistrationPrompt(referralId);
      }, 500);
    }
  }

  // ИСПРАВЛЕНО: Очистка URL без перезагрузки
  cleanupURL() {
    // Очищаем URL только после успешной регистрации
    if (sessionStorage.getItem('registrationComplete') === 'true') {
      const cleanURL = window.location.origin + window.location.pathname.replace(/\/ref\d{7}/, '');
      window.history.replaceState({}, document.title, cleanURL);
      sessionStorage.removeItem('pendingRegistration');
      sessionStorage.removeItem('registrationComplete');
    }
  }

  // ИСПРАВЛЕНО: Промпт регистрации с проверкой спонсора
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
    
    // ИСПРАВЛЕНО: Обработчик подключения кошелька
    modal.querySelector('#connectAndJoin').onclick = async () => {
      try {
        await web3Manager.connect();
        modal.remove();
        
        // Отмечаем что готовы к регистрации
        sessionStorage.setItem('readyForRegistration', 'true');
        
        // Переходим в DApp
        if (uiManager && uiManager.showDApp) {
          uiManager.showDApp();
        }
        
        // Показываем модал регистрации с предзаполненным ID
        setTimeout(() => {
          if (uiManager && uiManager.showRegistrationModal) {
            uiManager.showRegistrationModal();
          }
        }, 1000);
        
      } catch (error) {
        console.error('Connection failed:', error);
        modal.remove();
        this.showError('Failed to connect wallet: ' + error.message);
      }
    };
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
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
    // Не показываем кнопку установки на мобильных устройствах
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
}

// Инициализация с проверкой готовности DOM
function initializeApp() {
  const app = new GlobalWayApp();
  // ИСПРАВЛЕНО: Делаем app доступным глобально для других модулей
  window.app = app;
  
  app.init().catch(error => {
    console.error('App initialization failed:', error);
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ИСПРАВЛЕНО: Экспортируем класс для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalWayApp;
}
