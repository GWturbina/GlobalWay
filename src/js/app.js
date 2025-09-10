// app.js - Main Application Controller
class GlobalWayApp {
  constructor() {
    this.isInitialized = false;
    this.loadingScreen = null;
    this.appContainer = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing GlobalWay App...');
    
    // Show loading screen
    this.showLoadingScreen();
    
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize components in order
      await this.initializeComponents();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup service worker for PWA
      this.setupServiceWorker();
      
      // Handle referral links
      this.handleReferralLink();
      
      // Setup auto-refresh
      this.setupAutoRefresh();
      
      this.isInitialized = true;
      
      // Hide loading screen
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 2000);
      
      console.log('✅ GlobalWay App initialized successfully');
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.showInitializationError(error);
    }
  }

  showLoadingScreen() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.appContainer = document.getElementById('app');
    
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'flex';
    }
    
    if (this.appContainer) {
      this.appContainer.style.display = 'none';
    }
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 500);
    }
    
    if (this.appContainer) {
      this.appContainer.style.display = 'block';
      this.appContainer.style.opacity = '0';
      setTimeout(() => {
        this.appContainer.style.opacity = '1';
      }, 100);
    }
  }

  async initializeComponents() {
    console.log('🔧 Initializing components...');
    
    // Components should initialize in this order:
    // 1. Web3Manager (already initialized)
    // 2. UIManager (already initialized) 
    // 3. ContractManager (will init when wallet connects)
    
    // Wait for managers to be available
    let attempts = 0;
    while ((!window.web3Manager || !window.uiManager || !window.contractManager) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.web3Manager || !window.uiManager || !window.contractManager) {
      throw new Error('Required managers not available');
    }
    
    // Setup component interactions
    this.setupComponentInteractions();
    
    // Setup contract event listeners
    this.setupContractEventListeners();
    
    console.log('✅ Components initialized');
  }

  setupComponentInteractions() {
    // Web3Manager events
    if (window.web3Manager) {
      // Override updateUI to trigger contract initialization
      const originalUpdateUI = window.web3Manager.updateUI;
      window.web3Manager.updateUI = function() {
        originalUpdateUI.call(this);
        
        // Initialize contracts when wallet connects
        if (this.isConnected && !window.contractManager.isInitialized) {
          window.contractManager.initContracts();
        }
      };
    }

    // ContractManager events
    if (window.contractManager) {
      // Override loadUserData to trigger UI updates
      const originalLoadUserData = window.contractManager.loadUserData;
      window.contractManager.loadUserData = async function() {
        await originalLoadUserData.call(this);
        
        // Update UI after loading user data
        if (window.uiManager) {
          window.uiManager.updateUserInterface();
        }
      };
    }
  }

  setupContractEventListeners() {
    // We'll set up event listeners after contracts are initialized
    document.addEventListener('contractsInitialized', () => {
      this.listenToContractEvents();
    });
  }

  listenToContractEvents() {
    console.log('👂 Setting up contract event listeners...');
    
    if (!window.contractManager.isInitialized) return;

    try {
      // Listen for user registration events
      window.contractManager.contracts.GlobalWay.events.UserRegistered({
        filter: { user: window.web3Manager.account }
      }, (error, event) => {
        if (error) {
          console.error('Registration event error:', error);
          return;
        }
        
        console.log('🎉 User registered:', event.returnValues);
        window.uiManager.showNotification('Registration successful!', 'success');
        window.contractManager.refreshUserData();
      });

      // Listen for level purchase events
      window.contractManager.contracts.GlobalWay.events.LevelPurchased({
        filter: { user: window.web3Manager.account }
      }, (error, event) => {
        if (error) {
          console.error('Level purchase event error:', error);
          return;
        }
        
        console.log('🎉 Level purchased:', event.returnValues);
        const level = event.returnValues.level;
        window.uiManager.showNotification(`Level ${level} activated!`, 'success');
        window.contractManager.refreshUserData();
      });

      // Listen for token purchase events
      window.contractManager.contracts.GWTToken.events.TokensPurchased({
        filter: { buyer: window.web3Manager.account }
      }, (error, event) => {
        if (error) {
          console.error('Token purchase event error:', error);
          return;
        }
        
        console.log('🎉 Tokens purchased:', event.returnValues);
        const amount = window.web3Manager.web3.utils.fromWei(event.returnValues.tokenAmount, 'ether');
        window.uiManager.showNotification(`${parseFloat(amount).toFixed(0)} GWT tokens purchased!`, 'success');
        window.contractManager.loadTokenBalance();
      });

      // Listen for quarterly payment events
      window.contractManager.contracts.GlobalWay.events.QuarterlyActivityPaid({
        filter: { user: window.web3Manager.account }
      }, (error, event) => {
        if (error) {
          console.error('Quarterly payment event error:', error);
          return;
        }
        
        console.log('🎉 Quarterly payment:', event.returnValues);
        window.uiManager.showNotification('Quarterly activity payment successful!', 'success');
        window.contractManager.refreshUserData();
      });

      console.log('✅ Contract event listeners set up');
      
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      if (window.uiManager) {
        window.uiManager.showNotification(
          'An unexpected error occurred. Please refresh the page.',
          'error'
        );
      }
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.uiManager) {
        window.uiManager.showNotification(
          'An error occurred during operation. Please try again.',
          'error'
        );
      }
    });

    // Web3 error handler
    if (window.ethereum) {
      window.ethereum.on('disconnect', () => {
        console.log('Web3 provider disconnected');
        if (window.uiManager) {
          window.uiManager.showNotification('Web3 provider disconnected', 'warning');
        }
      });
    }
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
  }

  handleReferralLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    
    if (referrer && window.web3Manager?.web3?.utils?.isAddress(referrer)) {
      console.log('🔗 Referral link detected:', referrer);
      
      // Store referrer for later use
      sessionStorage.setItem('referrer', referrer);
      
      // Clean URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Show notification about referral
      setTimeout(() => {
        if (window.uiManager) {
          window.uiManager.showNotification(
            `Referral detected: ${window.web3Manager.formatAddress(referrer)}`,
            'info'
          );
        }
      }, 3000);
    }
  }

  setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
      if (this.isInitialized && window.web3Manager.isConnected) {
        console.log('🔄 Auto-refreshing data...');
        window.contractManager.loadContractOverview();
        
        if (window.contractManager.userData.isRegistered) {
          window.contractManager.refreshUserData();
        }
      }
    }, 5 * 60 * 1000);
  }

  showInitializationError(error) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'initialization-error';
    errorMessage.innerHTML = `
      <div class="error-content">
        <h3>🚨 Initialization Error</h3>
        <p>Failed to initialize the application:</p>
        <code>${error.message}</code>
        <button onclick="location.reload()" class="retry-btn">
          🔄 Retry
        </button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
    
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'none';
    }
  }

  // Public methods for external use
  async connectWallet() {
    if (!window.web3Manager) {
      throw new Error('Web3Manager not available');
    }
    
    return await window.web3Manager.connectWallet();
  }

  async registerUser(sponsorAddress) {
    if (!window.contractManager) {
      throw new Error('ContractManager not available');
    }
    
    return await window.contractManager.registerUser(sponsorAddress);
  }

  async buyLevel(level) {
    if (!window.contractManager) {
      throw new Error('ContractManager not available');
    }
    
    return await window.contractManager.buyLevel(level);
  }

  showNotification(message, type) {
    if (window.uiManager) {
      window.uiManager.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // App state getters
  get isWalletConnected() {
    return window.web3Manager?.isConnected || false;
  }

  get isUserRegistered() {
    return window.contractManager?.userData?.isRegistered || false;
  }

  get currentAccount() {
    return window.web3Manager?.account || null;
  }

  get networkId() {
    return window.web3Manager?.networkId || null;
  }

  // Cleanup method
  destroy() {
    console.log('🧹 Cleaning up GlobalWay App...');
    
    // Cleanup managers
    if (window.uiManager) {
      window.uiManager.destroy();
    }
    
    // Clear intervals and timeouts
    // (Individual managers should handle their own cleanup)
    
    this.isInitialized = false;
  }
}

// Initialize app when script loads
document.addEventListener('DOMContentLoaded', () => {
  window.globalWayApp = new GlobalWayApp();
});

// Make app globally available
window.GlobalWayApp = GlobalWayApp;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalWayApp;
}
