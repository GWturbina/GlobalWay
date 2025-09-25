class GlobalWayApp {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Initialize components
      await this.initializeApp();
      
      // Check for referral link
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
      this.showError('Failed to initialize application');
    }
  }

  async initializeApp() {
    // Set initial page state
    document.getElementById('landing').classList.add('active');
    
    // Check if user came directly to dapp
    if (window.location.hash === '#dapp') {
      uiManager.showDApp();
    }
  }

  handleReferralLink() {
    const path = window.location.pathname;
    const refMatch = path.match(/\/ref(\d{7})/);
    
    if (refMatch) {
      const referralId = refMatch[1];
      localStorage.setItem('referralId', referralId);
      
      // Redirect to main page
      window.history.replaceState({}, '', '/');
      
      // Show registration prompt
      setTimeout(() => {
        this.showRegistrationPrompt(referralId);
      }, 2000);
    }
  }

  showRegistrationPrompt(referralId) {
    const modal = document.getElementById('planetModal');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');
    
    if (modal && title && text) {
      title.textContent = 'Welcome to GlobalWay!';
      text.innerHTML = `
        <p>You've been invited by user ID: <strong>GW${referralId}</strong></p>
        <p>Connect your SafePal wallet to join the GlobalWay community!</p>
        <button class="btn-primary" onclick="web3Manager.connect().then(() => this.closest('.modal').style.display='none')" style="margin-top: 16px;">
          Connect Wallet & Join
        </button>
      `;
      modal.style.display = 'block';
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
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'btn-secondary';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
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
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new GlobalWayApp();
  app.init();
});
