// ui.js - User Interface Management
class UIManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.notifications = [];
    this.translations = {};
    this.currentLanguage = 'en';
    this.modals = {};
    this.intervals = {};
    
    this.init();
  }

  async init() {
    console.log('🎨 Initializing UI Manager...');
    
    // Load translations
    await this.loadTranslations();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup modals
    this.setupModals();
    
    // Initialize navigation
    this.setupNavigation();
    
    // Setup form handlers
    this.setupFormHandlers();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('✅ UI Manager initialized');
  }

  async loadTranslations() {
    try {
      // Load saved language or default to English
      this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
      
      const response = await fetch(`/translations/${this.currentLanguage}.json`);
      this.translations = await response.json();
      
      // Apply translations
      this.applyTranslations();
      
    } catch (error) {
      console.error('❌ Error loading translations:', error);
      this.translations = {}; // Fallback to no translations
    }
  }

  applyTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (this.translations[key]) {
        element.textContent = this.translations[key];
      }
    });
  }

  setupEventListeners() {
    // Connect wallet button
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.handleConnectWallet());
    }

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = this.currentLanguage;
      languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e.target.value));
    }

    // Copy buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('copy-btn')) {
        this.handleCopyClick(e.target);
      }
    });

    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const page = button.getAttribute('data-page');
        if (page) {
          this.navigateToPage(page);
        }
      });
    });

    // Set initial page
    this.navigateToPage('dashboard');
  }

  navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-page="${pageName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.currentPage = pageName;

    // Load page-specific data
    this.loadPageData(pageName);
  }

  async loadPageData(pageName) {
    if (!window.contractManager.isInitialized) return;

    switch (pageName) {
      case 'dashboard':
        await this.updateDashboard();
        break;
      case 'matrix':
        await this.updateMatrix();
        break;
      case 'partners':
        await this.updatePartners();
        break;
      case 'tokens':
        await this.updateTokens();
        break;
      case 'admin':
        await this.updateAdmin();
        break;
    }
  }

  async updateDashboard() {
    const userData = window.contractManager.userData;
    
    if (!userData.isRegistered) {
      this.showRegistrationPrompt();
      return;
    }

    // Update user info
    this.updateElement('userAddress', window.web3Manager.formatAddress(userData.address));
    this.updateElement('userId', this.getUserId(userData.address));
    this.updateElement('userRank', this.getRankName(userData.leaderRank));
    this.updateElement('referralFrom', window.web3Manager.formatAddress(userData.sponsor));
    this.updateElement('totalEarned', `${parseFloat(userData.totalEarned).toFixed(4)} BNB`);

    // Update balance
    const balance = await window.web3Manager.getBalance();
    this.updateElement('userBalance', `${parseFloat(balance).toFixed(4)} BNB`);

    // Update level buttons
    this.updateLevelButtons();

    // Update referral link
    this.updateReferralLink();

    // Update quarterly info
    this.updateQuarterlyInfo();

    // Update token info
    this.updateTokenInfo();
  }

  updateLevelButtons() {
    const userData = window.contractManager.userData;
    const levelButtons = document.querySelectorAll('.level-button');

    levelButtons.forEach(button => {
      const level = parseInt(button.getAttribute('data-level'));
      const hasLevel = userData.activeLevels && userData.activeLevels.includes(level);
      
      // Update button appearance
      if (hasLevel) {
        button.classList.add('active');
        button.querySelector('.level-status').textContent = 'Active';
      } else {
        button.classList.remove('active');
        button.querySelector('.level-status').textContent = 'Available';
      }

      // Add click handler
      button.onclick = () => this.handleLevelPurchase(level);
    });

    // Update package buttons
    this.updatePackageButtons();
  }

  updatePackageButtons() {
    const packageButtons = document.querySelectorAll('.quick-buy-btn');
    
    packageButtons.forEach(button => {
      const maxLevel = parseInt(button.getAttribute('data-max-level'));
      const price = window.contractManager.calculatePackagePrice(maxLevel);
      
      const priceElement = button.querySelector('.buy-price');
      if (priceElement) {
        priceElement.textContent = `${price} BNB`;
      }

      button.onclick = () => this.handlePackagePurchase(maxLevel);
    });
  }

  updateReferralLink() {
    const userAddress = window.web3Manager.account;
    if (userAddress) {
      const referralLink = `${window.location.origin}?ref=${userAddress}`;
      this.updateElement('referralLink', referralLink);
      this.updateElement('partnerReferralLink', referralLink);
    }
  }

  updateQuarterlyInfo() {
    const userData = window.contractManager.userData;
    
    if (userData.quarterlyFee) {
      this.updateElement('quarterlyFeeAmount', `${userData.quarterlyFee} BNB`);
    }

    if (userData.quarterlyCounter) {
      this.updateElement('quarterNumber', userData.quarterlyCounter);
    }

    // Update quarterly payment button
    const payBtn = document.getElementById('payQuarterlyBtn');
    if (payBtn) {
      payBtn.onclick = () => this.handleQuarterlyPayment();
    }
  }

  updateTokenInfo() {
    const userData = window.contractManager.userData;
    
    if (userData.tokenBalance) {
      this.updateElement('tokenBalance', `${parseFloat(userData.tokenBalance).toFixed(0)} GWT`);
      this.updateElement('tokenBalanceDisplay', `${parseFloat(userData.tokenBalance).toFixed(0)} GWT`);
    }

    if (userData.tokenPrice) {
      const price = parseFloat(userData.tokenPrice);
      this.updateElement('tokenPrice', `$${price.toFixed(4)}`);
      this.updateElement('tokenPriceDisplay', `$${price.toFixed(4)}`);
      
      // Calculate token value
      const balance = parseFloat(userData.tokenBalance || 0);
      const value = balance * price;
      this.updateElement('tokenValue', `≈ $${value.toFixed(2)}`);
      this.updateElement('tokenValueDisplay', `≈ $${value.toFixed(2)}`);
    }
  }

  async updateMatrix() {
    // Matrix updates will be handled by the matrix canvas
    if (window.matrixCanvas) {
      // Refresh matrix data
      window.matrixCanvas.generateSampleData();
      window.matrixCanvas.draw();
    }
  }

  async updatePartners() {
    const userData = window.contractManager.userData;
    
    if (userData.referrals) {
      this.updateElement('totalInvited', userData.referrals.length);
      this.updateElement('activePartners', userData.referrals.length); // Simplified
    }

    if (userData.personalInvites) {
      this.updateElement('generalTeam', userData.personalInvites);
    }
  }

  async updateTokens() {
    await this.updateTokenInfo();
    
    // Setup trading tabs
    this.setupTradingTabs();
    
    // Update token statistics
    await this.updateTokenStatistics();
  }

  async updateTokenStatistics() {
    try {
      if (window.contractManager.contracts.GWTToken) {
        const totalSupply = await window.contractManager.contracts.GWTToken.methods.totalSupply().call();
        const marketCap = await window.contractManager.contracts.GWTToken.methods.getMarketCap().call();
        
        this.updateElement('totalSupply', this.formatNumber(window.web3Manager.web3.utils.fromWei(totalSupply, 'ether')));
        this.updateElement('marketCap', `$${this.formatNumber(window.web3Manager.web3.utils.fromWei(marketCap, 'ether'))}`);
      }
    } catch (error) {
      console.error('Error updating token statistics:', error);
    }
  }

  setupTradingTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        
        // Update tab buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.trading-content').forEach(content => {
          content.classList.add('hidden');
        });
        
        const targetContent = document.getElementById(`${tab}Tab`);
        if (targetContent) {
          targetContent.classList.remove('hidden');
        }
      });
    });

    // Setup trading inputs
    this.setupTradingInputs();
  }

  setupTradingInputs() {
    const buyAmountInput = document.getElementById('buyTokenAmount');
    const buyCostInput = document.getElementById('buyTokenCost');
    const sellAmountInput = document.getElementById('sellTokenAmount');
    const sellReceiveInput = document.getElementById('sellTokenReceive');

    if (buyAmountInput && buyCostInput) {
      buyAmountInput.addEventListener('input', () => {
        const amount = parseFloat(buyAmountInput.value) || 0;
        const price = parseFloat(window.contractManager.userData.tokenPrice || 0.01);
        const cost = amount * price;
        buyCostInput.value = cost.toFixed(6);
      });
    }

    if (sellAmountInput && sellReceiveInput) {
      sellAmountInput.addEventListener('input', () => {
        const amount = parseFloat(sellAmountInput.value) || 0;
        const price = parseFloat(window.contractManager.userData.tokenPrice || 0.01);
        const receive = amount * price * 0.9; // 10% commission
        sellReceiveInput.value = receive.toFixed(6);
      });
    }
  }

  async updateAdmin() {
    // Check if user is owner
    const isOwner = await this.checkOwnerStatus();
    
    if (!isOwner) {
      document.getElementById('adminFunctions').style.display = 'none';
      document.getElementById('notOwnerMessage').classList.remove('hidden');
      return;
    }

    document.getElementById('adminFunctions').style.display = 'block';
    document.getElementById('notOwnerMessage').classList.add('hidden');

    // Update admin statistics
    await this.updateAdminStats();
    
    // Setup admin form handlers
    this.setupAdminHandlers();
  }

  async checkOwnerStatus() {
    try {
      if (!window.contractManager.contracts.GlobalWay) return false;
      
      const owner = await window.contractManager.contracts.GlobalWay.methods.owner().call();
      const currentAccount = window.web3Manager.account;
      
      this.updateElement('currentAccount', window.web3Manager.formatAddress(currentAccount));
      this.updateElement('contractOwnerAddress', window.web3Manager.formatAddress(owner));
      this.updateElement('ownerStatus', owner.toLowerCase() === currentAccount.toLowerCase() ? 'Owner' : 'Not Owner');
      
      return owner.toLowerCase() === currentAccount.toLowerCase();
      
    } catch (error) {
      console.error('Error checking owner status:', error);
      return false;
    }
  }

  async updateAdminStats() {
    const overview = window.contractManager.contractData.overview;
    
    if (overview) {
      this.updateElement('adminTotalUsers', overview.totalUsers);
      this.updateElement('adminActiveUsers', overview.activeUsers);
      this.updateElement('adminContractBalance', `${parseFloat(overview.contractBalance).toFixed(4)} BNB`);
      this.updateElement('adminTotalVolume', `${parseFloat(overview.totalVolume).toFixed(4)} BNB`);
    }
  }

  setupFormHandlers() {
    // Level purchase handlers
    this.setupLevelHandlers();
    
    // Token trading handlers
    this.setupTokenHandlers();
    
    // Settings handlers
    this.setupSettingsHandlers();
  }

  setupLevelHandlers() {
    // Individual level purchase is handled in updateLevelButtons()
    
    // Quarterly payment
    const quarterlyBtn = document.getElementById('payQuarterlyBtn');
    if (quarterlyBtn) {
      quarterlyBtn.addEventListener('click', () => this.handleQuarterlyPayment());
    }
  }

  setupTokenHandlers() {
    const buyBtn = document.getElementById('buyTokensBtn');
    const sellBtn = document.getElementById('sellTokensBtn');

    if (buyBtn) {
      buyBtn.addEventListener('click', () => this.handleTokenPurchase());
    }

    if (sellBtn) {
      sellBtn.addEventListener('click', () => this.handleTokenSale());
    }
  }

  setupSettingsHandlers() {
    // Disconnect wallet
    const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        window.web3Manager.disconnect();
        this.showNotification('Wallet disconnected', 'info');
      });
    }

    // Language change in settings
    const settingsLangSelect = document.getElementById('languageSettingsSelect');
    if (settingsLangSelect) {
      settingsLangSelect.value = this.currentLanguage;
      settingsLangSelect.addEventListener('change', (e) => this.handleLanguageChange(e.target.value));
    }
  }

  setupAdminHandlers() {
    // Free user activation
    const activateBtn = document.getElementById('activateUserBtn');
    if (activateBtn) {
      activateBtn.addEventListener('click', () => this.handleFreeActivation());
    }

    // Batch activation
    const batchBtn = document.getElementById('batchActivateBtn');
    if (batchBtn) {
      batchBtn.addEventListener('click', () => this.handleBatchActivation());
    }

    // Refresh stats
    const refreshBtn = document.getElementById('refreshAdminStats');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.updateAdminStats());
    }
  }

  // Event Handlers
  async handleConnectWallet() {
    try {
      await window.web3Manager.connectWallet();
      this.showNotification('Wallet connected successfully!', 'success');
    } catch (error) {
      this.showNotification('Failed to connect wallet: ' + error.message, 'error');
    }
  }

  async handleLanguageChange(language) {
    this.currentLanguage = language;
    localStorage.setItem('selectedLanguage', language);
    
    await this.loadTranslations();
    this.showNotification('Language changed', 'success');
  }

  handleCopyClick(button) {
    const targetId = button.getAttribute('data-target') || 
                   button.previousElementSibling?.id ||
                   button.parentNode.querySelector('input')?.id;
    
    let textToCopy = '';
    
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      textToCopy = targetElement.value || targetElement.textContent;
    } else {
      // Try to find text in parent
      const parent = button.parentNode;
      const input = parent.querySelector('input');
      const span = parent.querySelector('span.value');
      
      if (input) textToCopy = input.value;
      else if (span) textToCopy = span.textContent;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showNotification('Copied to clipboard!', 'success');
        
        // Visual feedback
        const originalText = button.textContent;
        button.textContent = '✓';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      });
    }
  }

  async handleLevelPurchase(level) {
    if (!window.contractManager.isInitialized) {
      this.showNotification('Please wait for contracts to load', 'warning');
      return;
    }

    if (!window.contractManager.userData.isRegistered) {
      this.showRegistrationPrompt();
      return;
    }

    const price = window.contractManager.getLevelPrice(level);
    
    // Show confirmation modal
    this.showLevelPurchaseModal(level, price);
  }

  async handlePackagePurchase(maxLevel) {
    if (!window.contractManager.isInitialized) {
      this.showNotification('Please wait for contracts to load', 'warning');
      return;
    }

    if (!window.contractManager.userData.isRegistered) {
      this.showRegistrationPrompt();
      return;
    }

    const totalPrice = window.contractManager.calculatePackagePrice(maxLevel);
    
    // Show confirmation modal
    this.showPackagePurchaseModal(maxLevel, totalPrice);
  }

  async handleQuarterlyPayment() {
    if (!window.contractManager.isInitialized) {
      this.showNotification('Please wait for contracts to load', 'warning');
      return;
    }

    try {
      this.showNotification('Processing quarterly payment...', 'info');
      
      const result = await window.contractManager.payQuarterlyActivity();
      
      this.showNotification('Quarterly payment successful!', 'success');
      
    } catch (error) {
      this.showNotification('Quarterly payment failed: ' + error.message, 'error');
    }
  }

  async handleTokenPurchase() {
    const amountInput = document.getElementById('buyTokenAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
      this.showNotification('Please enter a valid amount', 'warning');
      return;
    }

    try {
      this.showNotification('Processing token purchase...', 'info');
      
      const result = await window.contractManager.buyTokens(amount.toString());
      
      this.showNotification(`Successfully purchased ${amount} GWT tokens!`, 'success');
      amountInput.value = '';
      
    } catch (error) {
      this.showNotification('Token purchase failed: ' + error.message, 'error');
    }
  }

  async handleTokenSale() {
    const amountInput = document.getElementById('sellTokenAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
      this.showNotification('Please enter a valid amount', 'warning');
      return;
    }

    try {
      this.showNotification('Processing token sale...', 'info');
      
      const result = await window.contractManager.sellTokens(amount.toString());
      
      this.showNotification(`Successfully sold ${amount} GWT tokens!`, 'success');
      amountInput.value = '';
      
    } catch (error) {
      this.showNotification('Token sale failed: ' + error.message, 'error');
    }
  }

  async handleFreeActivation() {
    const userAddress = document.getElementById('freeUserAddress').value;
    const maxLevel = parseInt(document.getElementById('freeUserMaxLevel').value);

    if (!userAddress || !window.web3Manager.web3.utils.isAddress(userAddress)) {
      this.showNotification('Please enter a valid address', 'warning');
      return;
    }

    try {
      this.showNotification('Processing free activation...', 'info');
      
      const result = await window.contractManager.freeRegistrationWithLevels(userAddress, maxLevel);
      
      this.showNotification('Free activation successful!', 'success');
      
      // Clear form
      document.getElementById('freeUserAddress').value = '';
      
    } catch (error) {
      this.showNotification('Free activation failed: ' + error.message, 'error');
    }
  }

  async handleBatchActivation() {
    const membersText = document.getElementById('teamMembers').value;
    const sponsorsText = document.getElementById('teamSponsors').value;
    const levelsText = document.getElementById('teamLevels').value;

    const members = membersText.split('\n').map(addr => addr.trim()).filter(addr => addr);
    const sponsors = sponsorsText.split('\n').map(addr => addr.trim()).filter(addr => addr);
    const levels = levelsText.split('\n').map(level => parseInt(level.trim())).filter(level => level);

    if (members.length === 0) {
      this.showNotification('Please enter team member addresses', 'warning');
      return;
    }

    if (members.length !== sponsors.length || members.length !== levels.length) {
      this.showNotification('Number of members, sponsors, and levels must match', 'warning');
      return;
    }

    try {
      this.showNotification('Processing batch activation...', 'info');
      
      // Use first sponsor for all (simplified)
      const result = await window.contractManager.batchFreeRegistration(members, sponsors[0], levels[0]);
      
      this.showNotification(`Successfully activated ${members.length} users!`, 'success');
      
      // Clear forms
      document.getElementById('teamMembers').value = '';
      document.getElementById('teamSponsors').value = '';
      document.getElementById('teamLevels').value = '';
      
    } catch (error) {
      this.showNotification('Batch activation failed: ' + error.message, 'error');
    }
  }

  // Modal Management
  setupModals() {
    this.modals = {
      levelModal: document.getElementById('levelModal'),
      multipleLevelsModal: document.getElementById('multipleLevelsModal'),
      tokenModal: document.getElementById('tokenModal')
    };

    // Setup modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
      button.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });
  }

  showLevelPurchaseModal(level, price) {
    this.updateElement('modalLevel', level);
    this.updateElement('modalPrice', `${price} BNB`);
    
    const confirmBtn = document.getElementById('confirmPurchase');
    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmLevelPurchase(level);
    }
    
    this.openModal('levelModal');
  }

  showPackagePurchaseModal(maxLevel, totalPrice) {
    this.updateElement('modalLevelsRange', `1-${maxLevel}`);
    this.updateElement('modalTotalPrice', `${totalPrice} BNB`);
    
    const confirmBtn = document.getElementById('confirmMultiplePurchase');
    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmPackagePurchase(maxLevel);
    }
    
    this.openModal('multipleLevelsModal');
  }

  async confirmLevelPurchase(level) {
    this.closeModal('levelModal');
    
    try {
      this.showNotification(`Purchasing level ${level}...`, 'info');
      
      const result = await window.contractManager.buyLevel(level);
      
      this.showNotification(`Level ${level} purchased successfully!`, 'success');
      
    } catch (error) {
      this.showNotification(`Level ${level} purchase failed: ` + error.message, 'error');
    }
  }

  async confirmPackagePurchase(maxLevel) {
    this.closeModal('multipleLevelsModal');
    
    try {
      this.showNotification(`Purchasing levels 1-${maxLevel}...`, 'info');
      
      const result = await window.contractManager.buyLevelsBulk(maxLevel);
      
      this.showNotification(`Levels 1-${maxLevel} purchased successfully!`, 'success');
      
    } catch (error) {
      this.showNotification(`Package purchase failed: ` + error.message, 'error');
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
  }

  // Notification System
  showNotification(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now(),
      message,
      type,
      duration
    };

    this.notifications.push(notification);
    this.displayNotification(notification);

    // Auto remove
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
  }

  displayNotification(notification) {
    const container = document.getElementById('notifications') || this.createNotificationContainer();
    
    const element = document.createElement('div');
    element.className = `notification ${notification.type}`;
    element.setAttribute('data-id', notification.id);
    
    element.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${notification.message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    element.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification.id);
    });

    container.appendChild(element);

    // Animate in
    setTimeout(() => {
      element.classList.add('show');
    }, 10);
  }

  removeNotification(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.classList.remove('show');
      setTimeout(() => {
        element.remove();
      }, 300);
    }

    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  }

  // Registration Prompt
  showRegistrationPrompt() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    
    if (referrer && window.web3Manager.web3.utils.isAddress(referrer)) {
      const message = `Register with sponsor ${window.web3Manager.formatAddress(referrer)}?`;
      
      if (confirm(message)) {
        this.handleRegistration(referrer);
      }
    } else {
      this.showNotification('You need to be registered to use this feature. Please contact support for registration.', 'warning');
    }
  }

  async handleRegistration(sponsorAddress) {
    try {
      this.showNotification('Processing registration...', 'info');
      
      const result = await window.contractManager.registerUser(sponsorAddress);
      
      this.showNotification('Registration successful!', 'success');
      
    } catch (error) {
      this.showNotification('Registration failed: ' + error.message, 'error');
    }
  }

  // Periodic Updates
  startPeriodicUpdates() {
    // Update user data every 30 seconds
    this.intervals.userData = setInterval(() => {
      if (window.web3Manager.isConnected && window.contractManager.isInitialized) {
        window.contractManager.refreshUserData();
      }
    }, 30000);

    // Update UI every 10 seconds
    this.intervals.ui = setInterval(() => {
      if (window.web3Manager.isConnected) {
        this.updateUserInterface();
      }
    }, 10000);
  }

  updateUserInterface() {
    // Update current page data
    this.loadPageData(this.currentPage);
    
    // Update wallet info in header
    window.web3Manager.updateUI();
  }

  // Utility Methods
  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      if (element.tagName === 'INPUT') {
        element.value = value;
      } else {
        element.textContent = value;
      }
    }
  }

  formatNumber(num) {
    const number = parseFloat(num);
    if (number >= 1000000000) {
      return (number / 1000000000).toFixed(1) + 'B';
    } else if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
   } else if (number >= 1000) {
     return (number / 1000).toFixed(1) + 'K';
   } else {
     return number.toFixed(2);
   }
 }

 getUserId(address) {
   // Simple hash-based ID generation for demo
   if (!address) return '---';
   const hash = address.slice(-8);
   return parseInt(hash, 16).toString().slice(-6);
 }

 getRankName(rankNumber) {
   const ranks = [
     'Newcomer',
     'Explorer', 
     'Innovator',
     'Tech Enthusiast',
     'Crypto Student',
     'Blockchain Adept',
     'Smart Contract Master',
     'Web3 Professional',
     'Meta Architect',
     'AI Visionary',
     'Quantum Leader',
     'Global Tech Titan'
   ];
   
   return ranks[rankNumber - 1] || 'Newcomer';
 }

 destroy() {
   // Clear intervals
   Object.values(this.intervals).forEach(interval => clearInterval(interval));
   
   // Remove event listeners
   this.notifications = [];
 }
}

// Initialize UIManager
window.uiManager = new UIManager();
