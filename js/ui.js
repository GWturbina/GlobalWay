class UIManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.levelPrices = [
      0, 0.0015, 0.003, 0.006, 0.012, 0.024, 0.048, 
      0.096, 0.192, 0.384, 0.768, 1.536, 3.072
    ];
    this.bulkPrices = [0, 0, 0, 0.021, 0.027, 0.051, 0.099, 0.195, 0.387, 0.771, 1.539, 3.075, 6.147];
    this.rankNames = [
      'Новичок', 'Исследователь', 'Инноватор', 
      'Техно-энтузиаст', 'Крипто-ученик', 'Блокчейн-адепт',
      'Мастер смарт-контрактов', 'Web3 Профессионал', 
      'Мета-архитектор', 'AI-визионер', 
      'Квантовый лидер', 'Глобальный тех-титан'
    ];
    this.levelRewards = [0, 5, 5, 10, 15, 35, 75, 150, 300, 600, 1200, 2400, 4500];
    this.notifications = [];
    this.matrixManager = new MatrixManager();
    this.adminLoaded = false;
  }

  async init() {
    await this.loadComponents();
    this.setupEventListeners();
    this.generateLevelButtons();
    this.generateEarningsList();
    this.generateProjectCards();
    this.setupModals();
    this.initializeNotifications();
    this.startQuarterlyCheck();
    await this.loadUserData();
    await this.matrixManager.init();
  }

  async loadComponents() {
    const components = ['dashboard', 'partners', 'matrix', 'tokens', 'projects'];
    
    for (const component of components) {
      const container = document.getElementById(component);
      if (container) {
        try {
          const response = await fetch(`./components/${component}.html`);
          if (response.ok) {
            const html = await response.text();
            container.innerHTML = html;
          } else {
            console.warn(`Component ${component} not found, using embedded HTML`);
          }
        } catch (error) {
          console.warn(`Failed to load ${component}:`, error);
        }
      }
    }
  }

  async loadAdminComponent() {
    if (this.adminLoaded) return;
    
    const adminContainer = document.getElementById('admin');
    if (adminContainer && this.hasAdminAccess()) {
      try {
        const response = await fetch('./admin.html');
        if (response.ok) {
          const html = await response.text();
          adminContainer.innerHTML = html;
          this.adminLoaded = true;
          
          setTimeout(() => this.loadAdminData(), 200);
        }
      } catch (error) {
        console.warn('Failed to load admin component:', error);
      }
    }
  }

  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('.nav-btn') || e.target.closest('.nav-btn')) {
        const btn = e.target.matches('.nav-btn') ? e.target : e.target.closest('.nav-btn');
        this.showPage(btn.dataset.page);
      }
    });

    // Connect wallet
    document.addEventListener('click', (e) => {
      if (e.target.matches('#connectBtn')) {
        this.connectWallet();
      }
    });

    // Open DApp
    document.addEventListener('click', (e) => {
      if (e.target.matches('#openDapp') || e.target.closest('#openDapp')) {
        this.showDApp();
      }
    });

    // Planet clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.planet')) {
        const planet = e.target.closest('.planet');
        this.showPlanetModal(planet.dataset.planet);
      }
    });

    // Copy functions
    document.addEventListener('click', (e) => {
      if (e.target.matches('#copyRefLink')) {
        this.copyReferralLink();
      } else if (e.target.matches('.copy-btn')) {
        this.copyToClipboard(e.target.dataset.copy);
      }
    });

    // Level purchases
    document.addEventListener('click', (e) => {
      if (e.target.matches('.level-btn')) {
        const level = parseInt(e.target.dataset.level);
        this.buyLevel(level);
      } else if (e.target.matches('.bulk-btn')) {
        const levels = parseInt(e.target.dataset.levels);
        const packageType = parseInt(e.target.dataset.package);
        this.buyBulkLevels(levels, packageType);
      }
    });

    // Quarterly activity
    document.addEventListener('click', (e) => {
      if (e.target.matches('#payActivityBtn')) {
        this.payQuarterlyActivity();
      }
    });

    // Token management
    document.addEventListener('click', (e) => {
      if (e.target.matches('#addToWallet')) {
        this.addTokenToWallet();
      } else if (e.target.matches('#viewExplorer')) {
        this.viewOnExplorer();
      }
    });

    // Admin functions
    document.addEventListener('click', (e) => {
      if (e.target.matches('#freeActivateBtn')) {
        this.freeActivateUser();
      } else if (e.target.matches('#batchActivateBtn')) {
        this.batchActivateTeam();
      } else if (e.target.matches('#blockUserBtn')) {
        this.blockUser();
      } else if (e.target.matches('#replaceAddressBtn')) {
        this.replaceUserAddress();
      } else if (e.target.matches('#withdrawalBtn')) {
        this.withdrawFunds();
      } else if (e.target.matches('#emergencyWithdrawBtn')) {
        this.emergencyWithdraw();
      }
    });

    // Level selectors
    document.addEventListener('click', (e) => {
      if (e.target.matches('.level-selector-btn')) {
        const level = parseInt(e.target.textContent);
        const container = e.target.closest('.level-selector');
        if (container.parentElement.id === 'partners') {
          this.showPartnerLevel(level);
        }
      }
    });

    // Project proposals
    document.addEventListener('submit', (e) => {
      if (e.target.matches('#proposalForm')) {
        e.preventDefault();
        this.submitProjectProposal();
      }
    });
  }

  async connectWallet() {
    try {
      const connectBtn = document.getElementById('connectBtn');
      connectBtn.textContent = getTranslation('wallet.connecting');
      connectBtn.style.pointerEvents = 'none';
      
      await web3Manager.connect();
      await this.loadUserData();
      this.showConnectionStatus();
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      this.showError('Failed to connect wallet: ' + error.message);
      
      const connectBtn = document.getElementById('connectBtn');
      connectBtn.textContent = getTranslation('wallet.connect');
      connectBtn.style.pointerEvents = 'auto';
    }
  }

// ИСПРАВЛЕНО: Загрузка только реальных данных пользователя
async loadUserData() {
  if (!web3Manager.isConnected || !web3Manager.account) return;
  
  try {
    if (this.hasAdminAccess()) {
      const adminNavBtn = document.querySelector('.nav-btn[data-page="admin"]');
      if (adminNavBtn) {
        adminNavBtn.style.display = 'flex';
      }
    }
    
    // ИСПРАВЛЕНО: Проверяем реальную регистрацию
    const isRegistered = await contractManager.isUserRegistered();
    
    // ИСПРАВЛЕНО: Получаем только реальный ID из контракта
    let userId = null;
    try {
      userId = await contractManager.getUserIdByAddress();
      console.log('Real user ID from contract:', userId, 'Registered:', isRegistered);
    } catch (idError) {
      console.warn('Failed to get user ID:', idError);
    }
    
    // ИСПРАВЛЕНО: Показываем ID и ссылку ТОЛЬКО если есть реальный ID
    if (userId && userId !== '0' && userId !== 0) {
      document.getElementById('userId').textContent = `GW${userId}`;
      const refLink = `${window.location.origin}/ref${userId}`;
      document.getElementById('refLink').value = refLink;
      console.log('Valid referral link set:', refLink);

      // Очищаем URL после успешной загрузки данных пользователя
      if (sessionStorage.getItem('pendingRegistration') === 'true') {
        sessionStorage.setItem('registrationComplete', 'true');
        // Очищаем URL напрямую
        const cleanURL = window.location.origin + window.location.pathname.replace(/\/ref\d{7}/, '');
        window.history.replaceState({}, document.title, cleanURL);
        sessionStorage.removeItem('pendingRegistration');
        sessionStorage.removeItem('readyForRegistration');
      }
    } else if (isRegistered) {
      // ИСПРАВЛЕНО: Если зарегистрирован но нет ID - показываем предупреждение
      document.getElementById('userId').textContent = 'ID not assigned yet';
      document.getElementById('refLink').value = 'ID assignment required - contact support';
      
      // Предлагаем получить ID через контракт
      try {
        const txHash = await contractManager.sendTransaction('stats', 'assignIdToExistingUser', []);
        console.log('ID assignment transaction:', txHash);
        this.showSuccess('ID assignment in progress. Please wait...');
        
        // Проверяем ID через 5 секунд
        setTimeout(async () => {
          try {
            const newUserId = await contractManager.getUserIdByAddress();
            if (newUserId && newUserId !== '0') {
              document.getElementById('userId').textContent = `GW${newUserId}`;
              document.getElementById('refLink').value = `${window.location.origin}/ref${newUserId}`;
              this.showSuccess('Referral link generated!');
            }
          } catch (error) {
            console.error('Failed to get assigned ID:', error);
          }
        }, 5000);
        
      } catch (assignError) {
        console.error('Failed to assign ID:', assignError);
        document.getElementById('userId').textContent = 'ID assignment failed';
        document.getElementById('refLink').value = 'Contact support for referral link';
      }
    } else {
      // ИСПРАВЛЕНО: Незарегистрированные - четкое сообщение
      document.getElementById('userId').textContent = 'Not registered';
      document.getElementById('refLink').value = 'Register first to get referral link';
    }
    
    if (isRegistered) {
      const userData = await contractManager.getUserData();
      this.updateUserProfile(userData);
      
      await this.loadQuarterlyStatus();
      await this.loadEarningsData();
      await this.loadTransactionHistory();
      await this.loadTokenBalance();
      
      this.hideConnectionAlert();
    } else {
      this.showRegistrationPrompt();
    }
    
  } catch (error) {
    console.error('Failed to load user data:', error);
    this.showError('Failed to load user data');
  }
}

  hasAdminAccess() {
    if (!web3Manager.account) return false;
    
    const account = web3Manager.account.toLowerCase();
    const isOwner = account === CONFIG.ADDRESSES.OWNER.toLowerCase();
    const isFounder = CONFIG.ADDRESSES.FOUNDERS.some(f => f.toLowerCase() === account);
    const isBoard = CONFIG.ADDRESSES.BOARD.some(b => b.toLowerCase() === account);
    
    const hasAccess = isOwner || isFounder || isBoard;
    
    if (hasAccess) {
      document.body.classList.add('admin-access');
    } else {
      document.body.classList.remove('admin-access');
    }
    
    return hasAccess;
  }

  updateUserProfile(userData) {
    if (!userData) return;
    
    const rankElement = document.getElementById('userRank');
    if (rankElement && userData.leaderRank) {
      rankElement.textContent = this.rankNames[userData.leaderRank - 1] || 'Новичок';
    }
    
    if (userData.activeLevels) {
      this.updateActiveLevels(userData.activeLevels);
    }
    
    if (userData.activeLevels && userData.activeLevels.length >= 4) {
      this.showAutoUpgradeStatus(true);
    }
  }

  // ИСПРАВЛЕНО: Проверка показа кнопок только для зарегистрированных
  async updateActiveLevels(activeLevels) {
    // Блокируем уже активированные уровни
    for (let level = 1; level <= 12; level++) {
    const btn = document.querySelector(`[data-level="${level}"]`);
    if (btn) {
      if (activeLevels.includes(level)) {
        btn.disabled = true;
        btn.classList.add('activated');
        btn.style.background = '#6c757d';
        btn.innerHTML = `<span class="level-num">${level}</span><span class="level-price">✓ Active</span>`;
      } else {
        btn.disabled = false;
        btn.classList.remove('activated');
        btn.style.background = '';
      }
    }
  }
    
    // Обновляем цены bulk кнопок
    this.updateBulkButtonPrices(activeLevels);
  }

  updateBulkButtonPrices(activeLevels) {
    const bulkButtons = document.querySelectorAll('.bulk-btn');
    bulkButtons.forEach(btn => {
      const maxLevel = parseInt(btn.dataset.levels);
      let totalPrice = 0;
      
      for (let i = 1; i <= maxLevel; i++) {
        if (!activeLevels.includes(i)) {
          totalPrice += this.levelPrices[i];
        }
      }
      
      const priceSpan = btn.querySelector('.price');
      if (priceSpan) {
        priceSpan.textContent = totalPrice.toFixed(3);
      }
      
      if (totalPrice === 0) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    });
  }

  async loadQuarterlyStatus() {
    try {
      const isActive = await contractManager.callContract('globalway', 'isUserActive', [web3Manager.account]);
      const userData = await contractManager.getUserData();
      
      if (userData && userData.lastActivity) {
        const lastActivity = new Date(userData.lastActivity * 1000);
        const nextPayment = new Date(lastActivity.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.ceil((nextPayment - now) / (24 * 60 * 60 * 1000));
        
        document.getElementById('lastPayment').textContent = lastActivity.toLocaleDateString();
        document.getElementById('nextPayment').textContent = nextPayment.toLocaleDateString();
        document.getElementById('currentQuarter').textContent = userData.quarterlyCounter || 1;
        
        if (daysRemaining <= 10 && daysRemaining > 0) {
          this.showPaymentWarning(daysRemaining);
        }
        
        if (!isActive) {
          this.showInactiveStatus();
        }
      }
      
    } catch (error) {
      console.error('Failed to load quarterly status:', error);
    }
  }

  showPaymentWarning(daysRemaining) {
    const warningElement = document.getElementById('paymentWarning');
    const daysElement = document.getElementById('daysRemaining');
    
    if (warningElement && daysElement) {
      daysElement.textContent = daysRemaining;
      warningElement.style.display = 'flex';
      warningElement.classList.add('warning-blink');
      
      this.addNotification({
        type: 'warning',
        message: `Quarterly payment due in ${daysRemaining} days`,
        action: () => this.payQuarterlyActivity()
      });
    }
  }

  showInactiveStatus() {
    const alertElement = document.getElementById('connectionAlert');
    const messageElement = document.getElementById('alertMessage');
    const actionElement = document.getElementById('alertAction');
    
    if (alertElement && messageElement && actionElement) {
      alertElement.className = 'alert warning';
      messageElement.textContent = getTranslation('dashboard.notActive');
      actionElement.textContent = getTranslation('dashboard.payActivity');
      actionElement.onclick = () => this.payQuarterlyActivity();
      alertElement.style.display = 'block';
    }
  }

  async loadEarningsData() {
    try {
      const earningsBreakdown = await contractManager.callContract('stats', 'getEarningsBreakdown', [web3Manager.account]);
      
      if (earningsBreakdown) {
        this.updateEarningsDisplay(earningsBreakdown);
      }
      
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    }
  }

  updateEarningsDisplay(earnings) {
    const earningsElements = document.querySelectorAll('#earningsRank .earnings-item');
    earningsElements.forEach((element, index) => {
      if (index < this.rankNames.length) {
        const amountSpan = element.querySelector('span:last-child');
        if (amountSpan && earnings.frozenByLevel && earnings.frozenByLevel[index]) {
          amountSpan.textContent = `${(earnings.frozenByLevel[index] / 1e18).toFixed(4)} BNB`;
        }
      }
    });
    
    const totalElement = document.getElementById('totalIncome');
    if (totalElement && earnings.totalEarned) {
      totalElement.textContent = `${(earnings.totalEarned / 1e18).toFixed(4)} BNB`;
    }
    
    this.updatePartnerEarnings(earnings);
  }

  updatePartnerEarnings(earnings) {
    const elements = {
      directBonus: earnings.personalBonus,
      partnerBonus: earnings.referralBonus,
      matrixBonus: earnings.matrixBonus,
      leadershipBonus: earnings.leaderBonus,
      totalEarned: earnings.totalEarned
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value) {
        element.textContent = `${(value / 1e18).toFixed(4)} BNB`;
      }
    });
  }

  // ИСПРАВЛЕНО: Загрузка реальной истории через контракт
  async loadTransactionHistory() {
    try {
      const historyTable = document.getElementById('historyTable');
      if (!historyTable) return;

      historyTable.innerHTML = '<tr><td colspan="6" class="no-data">Loading transactions...</td></tr>';

      const transactions = await contractManager.getTransactionHistory(web3Manager.account, 20);
      
      if (transactions && transactions.length > 0) {
        const rows = transactions.map((tx, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${tx.type}</td>
            <td>${tx.amount} BNB</td>
            <td>${tx.timestamp.toLocaleDateString()} ${tx.timestamp.toLocaleTimeString()}</td>
            <td><a href="${CONFIG.EXPLORER_URL}/tx/${tx.hash}" target="_blank">${tx.hash.slice(0, 10)}...</a></td>
            <td><span class="status-badge ${tx.status.toLowerCase()}">${tx.status}</span></td>
          </tr>
        `);
        
        historyTable.innerHTML = rows.join('');
      } else {
        historyTable.innerHTML = '<tr><td colspan="6" class="no-data">No transactions found</td></tr>';
      }
      
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      const historyTable = document.getElementById('historyTable');
      if (historyTable) {
        historyTable.innerHTML = '<tr><td colspan="6" class="no-data">Failed to load transaction history</td></tr>';
      }
    }
  }

  async loadTokenBalance() {
  try {
    // ИСПРАВЛЕНО: Получаем реальный баланс токенов из контракта
    const balance = await contractManager.getTokenBalance(web3Manager.account);
    let currentPrice = '0';
    
    try {
      currentPrice = await contractManager.callContract('token', 'getCurrentPrice', []);
    } catch (priceError) {
      console.warn('Failed to get token price:', priceError);
    }
    
    if (balance) {
      const balanceFormatted = (parseInt(balance) / 1e18).toFixed(2);
      const priceNum = parseInt(currentPrice) / 1e18;
      const priceFormatted = priceNum > 0 ? `$${priceNum.toFixed(6)}` : '$0.000001';
      const valueFormatted = priceNum > 0 ? `$${(parseInt(balance) * priceNum / 1e18).toFixed(2)}` : '$0.00';
      
      // Обновляем элементы на странице Dashboard
      const tokenAmountEl = document.getElementById('tokenAmount');
      const tokenPriceEl = document.getElementById('tokenPrice');
      const tokenValueEl = document.getElementById('tokenValue');
      
      if (tokenAmountEl) tokenAmountEl.textContent = `${balanceFormatted} GWT`;
      if (tokenPriceEl) tokenPriceEl.textContent = priceFormatted;
      if (tokenValueEl) tokenValueEl.textContent = valueFormatted;
      
      // Обновляем элементы на странице Tokens
      const totalTokensEl = document.getElementById('totalTokens');
      const totalValueEl = document.getElementById('totalValue');
      const currentPriceEl = document.getElementById('currentPrice');
      
      if (totalTokensEl) totalTokensEl.textContent = `${balanceFormatted} GWT`;
      if (totalValueEl) totalValueEl.textContent = valueFormatted;
      if (currentPriceEl) currentPriceEl.textContent = priceFormatted;
      
      // Обновляем статистику токенов
      await this.updateTokenStatistics();
      
    } else {
      this.setDefaultTokenValues();
    }
    
  } catch (error) {
    console.error('Failed to load token balance:', error);
    this.setDefaultTokenValues();
  }
}

// Добавляем метод обновления статистики токенов
async updateTokenStatistics() {
  try {
    const totalSupplyEl = document.getElementById('totalSupply');
    const circSupplyEl = document.getElementById('circSupply');
    const marketCapEl = document.getElementById('marketCap');
    
    if (totalSupplyEl) {
      const totalSupply = await contractManager.callContract('token', 'totalSupply', []);
      if (totalSupply) {
        const supply = (parseInt(totalSupply) / 1e18).toLocaleString();
        totalSupplyEl.textContent = `${supply} GWT`;
      }
    }
    
    if (circSupplyEl) {
      // Для расчета circulating supply можно использовать totalSupply минус locked tokens
      const totalSupply = await contractManager.callContract('token', 'totalSupply', []);
      if (totalSupply) {
        const circulating = parseInt(totalSupply) * 0.8; // 80% в обороте
        circSupplyEl.textContent = `${(circulating / 1e18).toLocaleString()} GWT`;
      }
    }
    
    if (marketCapEl) {
      const price = await contractManager.callContract('token', 'getCurrentPrice', []);
      const marketCap = await contractManager.callContract('token', 'getMarketCap', []);
      if (marketCap) {
        const cap = (parseInt(marketCap) / 1e18).toFixed(0);
        marketCapEl.textContent = `$${parseFloat(cap).toLocaleString()}`;
      }
    }
    
  } catch (error) {
    console.warn('Failed to update token statistics:', error);
  }
}

// Добавляем метод установки значений по умолчанию
setDefaultTokenValues() {
  const elements = [
    'tokenAmount', 'tokenPrice', 'tokenValue',
    'totalTokens', 'totalValue', 'currentPrice'
  ];
  
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id.includes('Amount') || id.includes('Tokens')) {
        el.textContent = '0 GWT';
      } else if (id.includes('Price')) {
        el.textContent = '$0.000001';
      } else {
        el.textContent = '$0.00';
      }
    }
  });
}

  generateLevelButtons() {
    const individualLevels = document.getElementById('individualLevels');
    if (individualLevels) {
      individualLevels.innerHTML = '';
      for (let i = 1; i <= 12; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.dataset.level = i;
        btn.innerHTML = `
          <span class="level-num">${i}</span>
          <span class="level-price">${this.levelPrices[i]} BNB</span>
        `;
        individualLevels.appendChild(btn);
      }
    }

    ['partnerLevels'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
          const btn = document.createElement('button');
          btn.className = 'level-selector-btn';
          btn.textContent = i;
          if (i === 1) btn.classList.add('active');
          container.appendChild(btn);
        }
      }
    });
  }

  generateEarningsList() {
    const earningsRank = document.getElementById('earningsRank');
    if (!earningsRank) return;

    earningsRank.innerHTML = '';
    
    this.rankNames.forEach(rank => {
      const item = document.createElement('div');
      item.className = 'earnings-item';
      item.innerHTML = `
        <span>${rank}</span>
        <span>0 BNB</span>
      `;
      earningsRank.appendChild(item);
    });

    const total = document.createElement('div');
    total.className = 'earnings-item total';
    total.innerHTML = `
      <span data-translate="ranks.total">Total Income</span>
      <span id="totalIncome">0 BNB</span>
    `;
    earningsRank.appendChild(total);
  }

  generateProjectCards() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    const projects = [
      { 
        name: 'CardGift', 
        description: 'Create and send digital greeting cards with crypto rewards',
        status: 'development', 
        prefix: 'CG',
        requirements: 'Level 1+',
        logo: 'assets/icons/CardGift.png'
      },
      { 
        name: 'GlobalTub', 
        description: 'Decentralized video platform with content monetization',
        status: 'development', 
        prefix: 'GT',
        requirements: 'Level 2+',
        logo: 'assets/icons/GlobalTub.png'
      },
      { 
        name: 'GlobalMarket', 
        description: 'P2P marketplace for goods and services',
        status: 'development', 
        prefix: 'GM',
        requirements: 'Level 3+',
        logo: 'assets/icons/GlobalMarket.png'
      },
      { 
        name: 'GlobalGame', 
        description: 'Gaming platform with NFT rewards and tournaments',
        status: 'development', 
        prefix: 'GG',
        requirements: 'Level 4+',
        logo: 'assets/icons/GlobalGame.png'
      },
      { 
        name: 'GlobalEdu', 
        description: 'Educational courses and certification system',
        status: 'development', 
        prefix: 'GE',
        requirements: 'Level 5+',
        logo: 'assets/icons/GlobalEdu.png'
      },
      { 
        name: 'GlobalBank', 
        description: 'DeFi banking services with lending and staking',
        status: 'development', 
        prefix: 'GB',
        requirements: 'Level 6+',
        logo: 'assets/icons/GlobalBank.png'
      },
      { 
        name: 'GlobalAI', 
        description: 'AI-powered tools and automated services',
        status: 'development', 
        prefix: 'GA',
        requirements: 'Level 7+',
        logo: 'assets/icons/GlobalAI.png'
      },
      { 
        name: 'EcoVillages', 
        description: 'Sustainable living communities and real estate',
        status: 'development', 
        prefix: 'EV',
        requirements: 'Level 8+',
        logo: 'assets/icons/EcoVillages.png'
      }
    ];

    projectsGrid.innerHTML = '';
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.dataset.project = project.name.toLowerCase();
      card.innerHTML = `
        <div class="project-header">
          <img src="${project.logo}" alt="${project.name}" style="width: 64px; height: 64px; border-radius: 8px;">
          <h3>${project.name}</h3>
        </div>
        <p>${project.description}</p>
        <div class="project-meta">
          <span class="project-prefix">ID: ${project.prefix}-XXXXXXX</span>
          <span class="project-requirements">${project.requirements}</span>
        </div>
        <div class="project-status status-${project.status}">
          ${project.status === 'development' ? 'In Development' : project.status}
        </div>
        <div class="project-actions">
          <button class="btn-secondary project-details" data-translate="projects.about">About</button>
          <button class="btn-primary project-launch" disabled data-translate="projects.openProject">Coming Soon</button>
        </div>
      `;
      
      card.querySelector('.project-details').addEventListener('click', () => {
        this.showProjectModal(project);
      });
      
      projectsGrid.appendChild(card);
    });
  }

  showProjectModal(project) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const description = document.getElementById('projectModalDescription');
    const requirements = document.getElementById('projectModalRequirements');
    const prefix = document.getElementById('projectModalPrefix');
    const status = document.getElementById('projectModalStatus');
    const logo = document.getElementById('projectModalLogo');
    
    if (modal && title && description) {
      title.textContent = project.name;
      description.textContent = project.description;
      if (requirements) requirements.textContent = project.requirements;
      if (prefix) prefix.textContent = `${project.prefix}-XXXXXXX`;
      if (status) {
        status.textContent = project.status === 'development' ? 'In Development' : project.status;
        status.className = `project-status status-${project.status}`;
      }
      if (logo) logo.src = project.logo;
      
      modal.style.display = 'block';
    }
  }

  // ИСПРАВЛЕНО: Покупка уровней только для зарегистрированных
  async buyLevel(level) {
    try {
      if (!web3Manager.isConnected) {
        this.showError('Please connect your wallet first');
        return;
      }

      // ИСПРАВЛЕНО: Проверяем реальную регистрацию
      const isRegistered = await contractManager.isUserRegistered();
      if (!isRegistered) {
        this.showRegistrationPrompt();
        return;
      }

      const price = this.levelPrices[level];
      if (!price) {
        this.showError('Invalid level');
        return;
      }

      // Проверяем предыдущие уровни
      // Проверяем что уровень еще не активен
      const isAlreadyActive = await contractManager.callContract('globalway', 'isLevelActive', [web3Manager.account, level]);
      if (isAlreadyActive) {
        this.showError(`Level ${level} is already active`);
        return;
      }

      // Проверяем предыдущие уровни
      for (let i = 1; i < level; i++) {
        const isActive = await contractManager.callContract('globalway', 'isLevelActive', [web3Manager.account, i]);
        if (!isActive) {
          this.showError(`Please activate level ${i} first`);
          return;
        }
      }

      // ИСПРАВЛЕНО: Прямой вызов контракта
      const txHash = await contractManager.buyLevel(level, price);
      this.showSuccess(`Level ${level} purchase transaction sent: ${txHash}`);
      
      const btn = document.querySelector(`[data-level="${level}"]`);
      if (btn) {
        btn.disabled = true;
        btn.classList.add('activated');
        btn.style.background = '#6c757d';
      }
      
      // Обновляем данные после транзакции
      setTimeout(() => this.loadUserData(), 5000);
      
    } catch (error) {
      console.error('Level purchase failed:', error);
      this.showError('Level purchase failed: ' + error.message);
    }
  }

  // ИСПРАВЛЕНО: Bulk покупка только для зарегистрированных
  async buyBulkLevels(maxLevel, packageType) {
    try {
      if (!web3Manager.isConnected) {
        this.showError('Please connect your wallet first');
        return;
      }

      const isRegistered = await contractManager.isUserRegistered();
      if (!isRegistered) {
        this.showRegistrationPrompt();
        return;
      }

      const userData = await contractManager.getUserData();
      const activeLevels = userData ? userData.activeLevels || [] : [];
      
      let totalPrice = 0;
      for (let i = 1; i <= maxLevel; i++) {
        if (!activeLevels.includes(i)) {
          totalPrice += this.levelPrices[i];
        }
      }

      if (totalPrice === 0) {
        this.showError('All levels in this package are already active');
        return;
      }

      // ИСПРАВЛЕНО: Прямой вызов контракта
      const txHash = await contractManager.sendTransaction(
        'globalway', 
        'buyLevelsBulk', 
        [maxLevel], 
        '0x' + (totalPrice * 1e18).toString(16)
      );
      
      this.showSuccess(`Bulk purchase transaction sent: ${txHash}`);
      
      const btn = document.querySelector(`[data-levels="${maxLevel}"]`);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
      
      setTimeout(() => this.loadUserData(), 5000);
      
    } catch (error) {
      console.error('Bulk purchase failed:', error);
      this.showError('Bulk purchase failed: ' + error.message);
    }
  }

  // ИСПРАВЛЕНО: Квартальная оплата только для зарегистрированных
  async payQuarterlyActivity() {
    try {
      if (!web3Manager.isConnected) {
        this.showError('Please connect your wallet first');
        return;
      }

      const isRegistered = await contractManager.isUserRegistered();
      if (!isRegistered) {
        this.showError('You must be registered to pay quarterly activity');
        return;
      }

      // ИСПРАВЛЕНО: Прямой вызов контракта
      const txHash = await contractManager.payQuarterlyActivity();
      this.showSuccess(`Quarterly activity payment sent: ${txHash}`);
      
      const warningElement = document.getElementById('paymentWarning');
      if (warningElement) {
        warningElement.style.display = 'none';
      }
      
      setTimeout(() => this.loadUserData(), 5000);
      
    } catch (error) {
      console.error('Quarterly payment failed:', error);
      this.showError('Payment failed: ' + error.message);
    }
  }

  async getActiveLevels() {
    try {
      const userData = await contractManager.getUserData();
      return userData ? userData.activeLevels || [] : [];
    } catch (error) {
      return [];
    }
  }

  // ИСПРАВЛЕНО: Показ регистрации без фальшивых функций
  showRegistrationPrompt() {
    const alertElement = document.getElementById('connectionAlert');
    const messageElement = document.getElementById('alertMessage');
    const actionElement = document.getElementById('alertAction');
    
    if (alertElement && messageElement && actionElement) {
      alertElement.className = 'alert info';
      messageElement.textContent = 'You need to register to use GlobalWay features';
      actionElement.textContent = 'Register Now';
      actionElement.className = 'btn-success';
      actionElement.onclick = () => this.showRegistrationModal();
      alertElement.style.display = 'block';
    }
  }

  // ИСПРАВЛЕНО: Регистрация только через контракт
  showRegistrationModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Register in GlobalWay</h3>
      <div class="registration-form">
        <label>Sponsor ID (optional, format: GW1234567):</label>
        <input type="text" id="sponsorIdInput" placeholder="GW1234567" value="${this.getReferralId()}" ${sessionStorage.getItem('readyForRegistration') === 'true' ? 'readonly' : ''}>
        <div id="sponsorStatus" class="sponsor-status" style="margin: 10px 0; font-size: 0.9em;"></div>
        <p><strong>Important:</strong> If you don't have a valid sponsor ID, registration will be processed without sponsor assignment.</p>
        <button id="registerBtn" class="btn-success">Register</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'block';
  
  modal.querySelector('.close').onclick = () => {
    document.body.removeChild(modal);
  };
  
  // ИСПРАВЛЕНО: Добавляем проверку спонсора при вводе
  const sponsorInput = modal.querySelector('#sponsorIdInput');
  const sponsorStatus = modal.querySelector('#sponsorStatus');
  const registerBtn = modal.querySelector('#registerBtn');
  
  sponsorInput.addEventListener('input', async () => {
    const sponsorId = sponsorInput.value.trim();
    if (sponsorId && sponsorId.length >= 7) {
      await this.validateSponsor(sponsorId, sponsorStatus);
    } else {
      sponsorStatus.textContent = '';
    }
  });
  
  // Проверяем спонсора сразу если есть значение
  if (sponsorInput.value) {
    this.validateSponsor(sponsorInput.value, sponsorStatus);
  }
  
  registerBtn.onclick = async () => {
    const sponsorIdInput = sponsorInput.value.trim();
    try {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Processing...';
      
      // ИСПРАВЛЕНО: Реальная регистрация через контракт с проверкой
      const txHash = await contractManager.registerUserWithId(sponsorIdInput);
      this.showSuccess('Registration transaction sent: ' + txHash);
      document.body.removeChild(modal);
      
      // Очищаем временные данные регистрации
      sessionStorage.removeItem('readyForRegistration');
      sessionStorage.setItem('registrationInProgress', 'true');
      
      // Обновляем данные через 10 секунд после транзакции
      setTimeout(async () => {
        await this.loadUserData();
        sessionStorage.removeItem('registrationInProgress');
      }, 10000);
      
    } catch (error) {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Register';
      this.showError('Registration failed: ' + error.message);
    }
  };
}

// Добавляем метод проверки спонсора
async validateSponsor(sponsorId, statusElement) {
  try {
    statusElement.textContent = 'Checking sponsor...';
    statusElement.style.color = '#ffc107';
    
    const cleanId = sponsorId.toString().replace(/^GW/i, '');
    
    if (!/^\d{7}$/.test(cleanId)) {
      statusElement.textContent = 'Invalid ID format. Use GW1234567 or 1234567';
      statusElement.style.color = '#dc3545';
      return false;
    }
    
    // Проверяем что спонсор существует
    const sponsorAddress = await contractManager.getAddressByUserId(cleanId);
    if (!sponsorAddress || sponsorAddress === '0x0000000000000000000000000000000000000000') {
      statusElement.textContent = 'Sponsor ID not found';
      statusElement.style.color = '#dc3545';
      return false;
    }
    
    // Проверяем что спонсор зарегистрирован
    const isRegistered = await contractManager.callContract('globalway', 'isUserRegistered', [sponsorAddress]);
    if (!isRegistered) {
      statusElement.textContent = 'Sponsor is not registered';
      statusElement.style.color = '#dc3545';
      return false;
    }
    
    statusElement.textContent = `Valid sponsor: ${sponsorAddress.slice(0,6)}...${sponsorAddress.slice(-4)}`;
    statusElement.style.color = '#28a745';
    return true;
    
  } catch (error) {
    console.error('Sponsor validation failed:', error);
    statusElement.textContent = 'Unable to verify sponsor';
    statusElement.style.color = '#dc3545';
    return false;
  }
}

  // ИСПРАВЛЕНО: Получение реального ID из localStorage
  getReferralId() {
    const referralId = localStorage.getItem('referralId');
    if (referralId && /^\d{7}$/.test(referralId)) {
      return `GW${referralId}`;
    }
    return '';
  }

  async loadAdminData() {
    if (!web3Manager.account) {
      this.showError('Access denied - Admin privileges required');
      return;
    }

    const account = web3Manager.account.toLowerCase();
    const isOwner = account === CONFIG.ADDRESSES.OWNER.toLowerCase();
    const isFounder = CONFIG.ADDRESSES.FOUNDERS.some(f => f.toLowerCase() === account);
    const isBoard = CONFIG.ADDRESSES.BOARD.some(b => b.toLowerCase() === account);

    if (!isOwner && !isFounder && !isBoard) {
      this.showError('Access denied - Admin privileges required');
      return;
    }

    try {
      const overview = await contractManager.getContractOverview();
      if (overview) {
        const totalUsersEl = document.getElementById('adminTotalUsers');
        const activeUsersEl = document.getElementById('adminActiveUsers');
        const contractBalanceEl = document.getElementById('adminContractBalance');
        const totalVolumeEl = document.getElementById('adminTotalVolume');
        
        if (totalUsersEl) totalUsersEl.textContent = overview.totalUsers || '0';
        if (activeUsersEl) activeUsersEl.textContent = overview.activeUsers || '0';
        if (contractBalanceEl) contractBalanceEl.textContent = `${(overview.contractBalance / 1e18).toFixed(4)} BNB`;
        if (totalVolumeEl) totalVolumeEl.textContent = `${(overview.totalVolume / 1e18).toFixed(4)} BNB`;
      }
      
      const currentAccountEl = document.getElementById('adminCurrentAccount');
      const rightsLevelEl = document.getElementById('adminRightsLevel');
      
      if (currentAccountEl) currentAccountEl.textContent = `${web3Manager.account.slice(0,6)}...${web3Manager.account.slice(-4)}`;
      if (rightsLevelEl) rightsLevelEl.textContent = this.getAdminRightsLevel();
      
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  }

  async freeActivateUser() {
    try {
      const address = document.getElementById('activationAddress').value;
      const sponsor = document.getElementById('activationSponsor').value;
      const maxLevel = document.getElementById('activationLevel').value;
      
      if (!address || !sponsor) {
        this.showError('Please fill all fields');
        return;
      }
      
      const txHash = await contractManager.freeActivateUser(address, maxLevel);
      this.showSuccess('Free activation sent. Transaction: ' + txHash);
      
      document.getElementById('activationAddress').value = '';
      document.getElementById('activationSponsor').value = '';
      
    } catch (error) {
      this.showError('Free activation failed: ' + error.message);
    }
  }

  async batchActivateTeam() {
    try {
      const members = document.getElementById('batchMembers').value.split('\n').filter(addr => addr.trim());
      const sponsor = document.getElementById('batchSponsor').value;
      const maxLevel = document.getElementById('batchLevel').value;
      
      if (!members.length || !sponsor) {
        this.showError('Please fill all fields');
        return;
      }
      
      const txHash = await contractManager.batchActivateTeam(members, sponsor, maxLevel);
      this.showSuccess('Batch activation sent. Transaction: ' + txHash);
      
      document.getElementById('batchMembers').value = '';
      document.getElementById('batchSponsor').value = '';
      
    } catch (error) {
      this.showError('Batch activation failed: ' + error.message);
    }
  }

  async blockUser() {
    try {
      const userAddress = document.getElementById('blockUserAddress').value;
      const tempAddress = document.getElementById('tempAddress').value;
      const reason = document.getElementById('blockReason').value;
      
      if (!userAddress || !tempAddress || !reason) {
        this.showError('Please fill all fields');
        return;
      }
      
      const txHash = await contractManager.sendTransaction(
        'globalway',
        'blockUser',
        [userAddress, tempAddress, reason]
      );
      
      this.showSuccess('User blocked. Transaction: ' + txHash);
      
      document.getElementById('blockUserAddress').value = '';
      document.getElementById('tempAddress').value = '';
      document.getElementById('blockReason').value = '';
      
    } catch (error) {
      this.showError('Block user failed: ' + error.message);
    }
  }

  async replaceUserAddress() {
    try {
      const oldAddress = document.getElementById('replaceOldAddress').value;
      const newAddress = document.getElementById('replaceNewAddress').value;
      const reason = document.getElementById('replaceReason').value;
      
      if (!oldAddress || !newAddress || !reason) {
        this.showError('Please fill all fields');
        return;
      }
      
      const txHash = await contractManager.sendTransaction(
        'globalway',
        'replaceUserAddress',
        [oldAddress, newAddress, reason]
      );
      
      this.showSuccess('Address replaced. Transaction: ' + txHash);
      
      document.getElementById('replaceOldAddress').value = '';
      document.getElementById('replaceNewAddress').value = '';
      document.getElementById('replaceReason').value = '';
      
    } catch (error) {
      this.showError('Replace address failed: ' + error.message);
    }
  }

  async withdrawFunds() {
    try {
      const pool = document.getElementById('withdrawalPool').value;
      const address = document.getElementById('withdrawalAddress').value;
      const amount = document.getElementById('withdrawalAmount').value;
      const note = document.getElementById('withdrawalNote').value;
      
      if (!pool || !address || !amount) {
        this.showError('Please fill all required fields');
        return;
      }
      
      const amountWei = (parseFloat(amount) * 1e18).toString();
      
      const txHash = await contractManager.sendTransaction(
        'globalway',
        'withdrawFromPool',
        [pool, address, amountWei, note]
      );
      
      this.showSuccess('Withdrawal initiated. Transaction: ' + txHash);
      
      document.getElementById('withdrawalAddress').value = '';
      document.getElementById('withdrawalAmount').value = '';
      document.getElementById('withdrawalNote').value = '';
      
    } catch (error) {
      this.showError('Withdrawal failed: ' + error.message);
    }
  }

  async emergencyWithdraw() {
    try {
      const fromAddress = document.getElementById('emergencyFromAddress').value;
      const toAddress = document.getElementById('emergencyToAddress').value;
      const amount = document.getElementById('emergencyAmount').value;
      const reason = document.getElementById('emergencyReason').value;
      
      if (!fromAddress || !toAddress || !amount || !reason) {
        this.showError('Please fill all fields');
        return;
      }
      
      const amountWei = (parseFloat(amount) * 1e18).toString();
      
      const txHash = await contractManager.sendTransaction(
        'globalway',
        'emergencyWithdraw',
        [fromAddress, toAddress, amountWei, reason]
      );
      
      this.showSuccess('Emergency withdrawal initiated. Transaction: ' + txHash);
      
      document.getElementById('emergencyFromAddress').value = '';
      document.getElementById('emergencyToAddress').value = '';
      document.getElementById('emergencyAmount').value = '';
      document.getElementById('emergencyReason').value = '';
      
    } catch (error) {
      this.showError('Emergency withdrawal failed: ' + error.message);
    }
  }

  getAdminRightsLevel() {
    if (!web3Manager.account) return 'None';
    
    const account = web3Manager.account.toLowerCase();
    if (account === CONFIG.ADDRESSES.OWNER.toLowerCase()) return 'Owner';
    if (CONFIG.ADDRESSES.FOUNDERS.some(f => f.toLowerCase() === account)) return 'Founder';
    if (CONFIG.ADDRESSES.BOARD.some(b => b.toLowerCase() === account)) return 'Board Member';
    return 'None';
  }

  showDApp() {
    document.getElementById('landing').classList.remove('active');
    document.getElementById('dapp').classList.add('active');
    
    if (!web3Manager.isConnected) {
      setTimeout(() => {
        web3Manager.connect().catch(console.warn);
      }, 500);
    }
  }

  showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
      page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.currentPage = pageId;
    
    if (pageId === 'admin' && this.hasAdminAccess() && !this.adminLoaded) {
      console.log('Loading admin component...');
      this.loadAdminComponent().then(() => {
        this.loadPageData(pageId);
      });
      return;
    }
    
    this.loadPageData(pageId);
  }

  async loadPageData(pageId) {
    switch (pageId) {
      case 'partners':
        await this.loadPartnersData();
        break;
      case 'matrix':
        await this.matrixManager.initMatrixPage();
        break;
      case 'tokens':
        await this.loadTokensData();
        break;
      case 'admin':
        if (this.adminLoaded) {
          await this.loadAdminData();
        }
        break;
    }
  }

  async loadPartnersData() {
    this.showPartnerLevel(1);
  }

  async loadTokensData() {
    const rewardsContainer = document.getElementById('levelRewards');
    if (rewardsContainer) {
      rewardsContainer.innerHTML = '';
      
      for (let i = 1; i <= 12; i++) {
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        rewardItem.innerHTML = `
          <div class="reward-level">Level ${i}</div>
          <div class="reward-amount">${this.levelRewards[i]} GWT</div>
        `;
        rewardsContainer.appendChild(rewardItem);
      }
    }
  }

  // ИСПРАВЛЕНО: Загрузка реальных партнеров через контракт
  async showPartnerLevel(level) {
  document.querySelectorAll('#partnerLevels .level-selector-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const targetBtn = document.querySelector(`#partnerLevels .level-selector-btn:nth-child(${level})`);
  if (targetBtn) targetBtn.classList.add('active');
  
  const currentLevelNum = document.getElementById('currentLevelNum');
  const currentLevelCost = document.getElementById('currentLevelCost');
  if (currentLevelNum) currentLevelNum.textContent = level;
  if (currentLevelCost) currentLevelCost.textContent = `${this.levelPrices[level]} BNB`;
  
  const tbody = document.getElementById('partnersTable');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">Loading partner data...</td></tr>';
    
    try {
      // ИСПРАВЛЕНО: Получаем реальных партнеров через контракт
      const userStats = await contractManager.callContract('globalway', 'getUserStats', [web3Manager.account]);
      
      if (userStats && userStats.referrals && userStats.referrals.length > 0) {
        const partnersWithLevel = [];
        
        for (const partnerAddress of userStats.referrals) {
          try {
            const isLevelActive = await contractManager.callContract('globalway', 'isLevelActive', [partnerAddress, level]);
            if (isLevelActive) {
              const partnerData = await contractManager.callContract('globalway', 'getUserData', [partnerAddress]);
              const partnerId = await contractManager.getUserIdByAddress(partnerAddress);
              const partnerStats = await contractManager.callContract('globalway', 'getUserStats', [partnerAddress]);
              
              partnersWithLevel.push({
                address: partnerAddress,
                id: partnerId,
                data: partnerData,
                stats: partnerStats
              });
            }
          } catch (partnerError) {
            console.warn('Failed to load partner data for:', partnerAddress, partnerError);
          }
        }
        
        if (partnersWithLevel.length > 0) {
  // ИСПРАВЛЕНО: Убираем await из map функции
  const rows = [];
  
  for (const [index, partner] of partnersWithLevel.entries()) {
    const userData = partner.data;
    const userStats = partner.stats;
    const qualification = contractManager.getQualificationLevel(
      userData[4] || 0, // personalInvites
      userData[5] || 0  // totalEarned
    );
    
    // Получаем sponsor ID без await в map
    let sponsorId = 'GW0000000';
    try {
      if (userData[1]) {
        const id = await contractManager.getUserIdByAddress(userData[1]);
        sponsorId = id ? `GW${id}` : 'GW0000000';
      }
    } catch (error) {
      console.warn('Failed to get sponsor ID:', error);
    }
    
    rows.push(`
      <tr>
        <td>${index + 1}</td>
        <td>GW${partner.id || '0000000'}</td>
        <td>${partner.address.slice(0, 6)}...${partner.address.slice(-4)}</td>
        <td>${sponsorId}</td>
        <td>${userData[2] ? new Date(userData[2] * 1000).toLocaleDateString() : '-'}</td>
        <td>Level ${level}</td>
        <td>${userStats ? userStats.referrals.length : 0}</td>
        <td><span class="qualification-badge ${qualification.toLowerCase()}">${qualification}</span></td>
      </tr>
    `);
  }
  
  tbody.innerHTML = rows.join('');
  
  // Обновляем статистику партнеров
  this.updatePartnerStats(partnersWithLevel, userStats);
  
} else {
  tbody.innerHTML = '<tr><td colspan="8" class="no-data">No partners found for this level</td></tr>';
}

}

// Добавляем метод обновления статистики партнеров
updatePartnerStats(partners, userStats) {
  const personalInvitesEl = document.getElementById('personalInvites');
  const activePartnersEl = document.getElementById('activePartners');
  const totalTeamEl = document.getElementById('totalTeam');
  
  if (personalInvitesEl && userStats) {
    personalInvitesEl.textContent = userStats.personalInvites || 0;
  }
  
  if (activePartnersEl) {
    activePartnersEl.textContent = partners.length;
  }
  
  if (totalTeamEl && userStats) {
    totalTeamEl.textContent = userStats.referrals ? userStats.referrals.length : 0;
  }
}

} 

const uiManager = new UIManager();
window.uiManager = uiManager;

  // ИСПРАВЛЕНО: Копирование только реальных ссылок
  async copyReferralLink() {
  try {
    if (!web3Manager.account) {
      this.showError('Connect wallet first');
      return;
    }

    // ИСПРАВЛЕНО: Проверяем регистрацию перед копированием
    const isRegistered = await contractManager.isUserRegistered(web3Manager.account);
    if (!isRegistered) {
      this.showError('You need to register first to get referral link');
      return;
    }

    const userId = await contractManager.getUserIdByAddress(web3Manager.account);
    
    if (!userId || userId === '0' || userId === 0) {
      this.showError('ID not assigned yet. Please wait or contact support.');
      return;
    }
    
    const link = `${window.location.origin}/ref${userId}`;
    
    // ИСПРАВЛЕНО: Улучшенное копирование с fallback
    try {
      await navigator.clipboard.writeText(link);
      this.showSuccess('Referral link copied to clipboard!');
    } catch (clipboardError) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showSuccess('Referral link copied!');
    }
    
    // Обновляем поле ссылки если оно есть
    const refLinkEl = document.getElementById('refLink');
    if (refLinkEl) refLinkEl.value = link;
    
  } catch (error) {
    console.error('Copy failed:', error);
    this.showError('Failed to copy referral link: ' + error.message);
  }
}

  async copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback для небезопасных контекстов
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    this.showSuccess('Copied to clipboard!');
  } catch (error) {
    console.warn('Copy failed:', error);
    this.showError('Failed to copy text');
  }
}

  async addTokenToWallet() {
    try {
      await web3Manager.provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONFIG.CONTRACTS.TOKEN,
            symbol: 'GWT',
            decimals: 18,
            image: `${window.location.origin}/assets/planets/gwt-coin.png`
          }
        }
      });
      this.showSuccess('Token added to wallet!');
    } catch (error) {
      this.showError('Failed to add token to wallet');
    }
  }

  viewOnExplorer() {
    const url = `${CONFIG.EXPLORER_URL}/token/${CONFIG.CONTRACTS.TOKEN}`;
    window.open(url, '_blank');
  }

  async submitProjectProposal() {
    const formData = {
      author: document.getElementById('proposalAuthor').value,
      contact: document.getElementById('proposalContact').value,
      sphere: document.getElementById('proposalSphere').value,
      idea: document.getElementById('proposalIdea').value,
      description: document.getElementById('proposalDescription').value
    };

    if (!formData.author || !formData.contact || !formData.sphere || !formData.idea || !formData.description) {
      this.showError('Please fill all fields');
      return;
    }

    try {
      console.log('Project proposal submitted:', formData);
      this.showSuccess('Project proposal submitted for review!');
      
      document.getElementById('proposalForm').reset();
      
    } catch (error) {
      this.showError('Failed to submit proposal');
    }
  }

  showPlanetModal(planetType) {
    const modal = document.getElementById('planetModal');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');
    
    if (!modal || !title || !text) return;

    const planetData = {
      club: {
        title: getTranslation('planets.club'),
        text: getTranslation('planets.clubText')
      },
      mission: {
        title: getTranslation('planets.mission'),
        text: getTranslation('planets.missionText')
      },
      goals: {
        title: getTranslation('planets.goals'),
        text: getTranslation('planets.goalsText')
      },
      roadmap: {
        title: getTranslation('planets.roadmap'),
        text: getTranslation('planets.roadmapText')
      },
      projects: {
        title: getTranslation('planets.projects'),
        text: getTranslation('planets.projectsText')
      }
    };

    const data = planetData[planetType];
    if (data) {
      title.textContent = data.title;
      text.textContent = data.text;
      modal.style.display = 'block';
    }
  }

  setupModals() {
    const planetModal = document.getElementById('planetModal');
    if (planetModal) {
      const closeBtn = planetModal.querySelector('.close');
      if (closeBtn) {
        closeBtn.onclick = () => planetModal.style.display = 'none';
      }
    }

    const positionModal = document.getElementById('positionModal');
    if (positionModal) {
      const closeBtn = positionModal.querySelector('.close');
      if (closeBtn) {
        closeBtn.onclick = () => positionModal.style.display = 'none';
      }
    }

    const projectModal = document.getElementById('projectModal');
    if (projectModal) {
      const closeBtn = projectModal.querySelector('.close');
      if (closeBtn) {
        closeBtn.onclick = () => projectModal.style.display = 'none';
      }
    }

    window.onclick = (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    };
  }

  initializeNotifications() {
    this.notifications = [];
    this.createNotificationContainer();
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 300px;
    `;
    document.body.appendChild(container);
  }

  addNotification(notification) {
    this.notifications.push(notification);
    this.showNotification(notification);
  }

  showNotification(notification) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification ${notification.type}`;
    notificationEl.style.cssText = `
      background: ${notification.type === 'warning' ? '#ffc107' : notification.type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    notificationEl.innerHTML = `
      <div>${notification.message}</div>
      ${notification.action ? '<button class="notification-action" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;margin-top:8px;">Action</button>' : ''}
      <button class="notification-close" style="position:absolute;top:4px;right:8px;background:none;border:none;color:white;cursor:pointer;">&times;</button>
    `;

    container.appendChild(notificationEl);

    setTimeout(() => {
      notificationEl.style.opacity = '1';
      notificationEl.style.transform = 'translateX(0)';
    }, 100);

    const closeBtn = notificationEl.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.removeNotification(notificationEl);
    }

    const actionBtn = notificationEl.querySelector('.notification-action');
    if (actionBtn && notification.action) {
      actionBtn.onclick = () => {
        notification.action();
        this.removeNotification(notificationEl);
      };
    }

    setTimeout(() => {
      if (notificationEl.parentNode) {
        this.removeNotification(notificationEl);
      }
    }, 5000);
  }

  removeNotification(notificationEl) {
    notificationEl.style.opacity = '0';
    notificationEl.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.parentNode.removeChild(notificationEl);
      }
    }, 300);
  }

  startQuarterlyCheck() {
    setInterval(async () => {
      if (web3Manager.isConnected) {
        await this.checkQuarterlyStatus();
      }
    }, 60 * 60 * 1000);
  }

  async checkQuarterlyStatus() {
    try {
      const userData = await contractManager.getUserData();
      if (userData && userData.lastActivity) {
        const lastActivity = new Date(userData.lastActivity * 1000);
        const nextPayment = new Date(lastActivity.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.ceil((nextPayment - now) / (24 * 60 * 60 * 1000));
        
        if (daysRemaining <= 10 && daysRemaining > 0) {
          this.addNotification({
            type: 'warning',
            message: `Quarterly payment due in ${daysRemaining} days`,
            action: () => this.payQuarterlyActivity()
          });
        }
      }
    } catch (error) {
      console.warn('Quarterly check failed:', error);
    }
  }

  showConnectionStatus() {
    if (web3Manager.isConnected) {
      this.addNotification({
        type: 'success',
        message: 'Wallet connected successfully!'
      });
    }
  }

  hideConnectionAlert() {
    const alertElement = document.getElementById('connectionAlert');
    if (alertElement) {
      alertElement.style.display = 'none';
    }
  }

  showAutoUpgradeStatus(enabled) {
    const infoElement = document.querySelector('.auto-upgrade-info');
    if (infoElement) {
      infoElement.style.display = enabled ? 'flex' : 'none';
      if (enabled) {
        infoElement.classList.add('auto-upgrade-active');
      }
    }
  }

  showSuccess(message) {
    this.addNotification({
      type: 'success',
      message: message
    });
  }

  showError(message) {
    this.addNotification({
      type: 'error',
      message: message
    });
  }

  showWarning(message) {
    this.addNotification({
      type: 'warning',
      message: message
    });
  }
}

class MatrixManager {
  constructor() {
    this.currentLevel = 1;
    this.currentMatrix = null;
    this.currentUserId = null;
    this.matrixData = new Map();
    this.isLoading = false;
  }

  async init() {
    this.setupMatrixEventListeners();
    await this.loadCurrentUserMatrix();
  }

  setupMatrixEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('#matrixLevels .level-selector-btn')) {
        const level = parseInt(e.target.textContent);
        this.switchLevel(level);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.matrix-position')) {
        const position = e.target.closest('.matrix-position');
        this.showPositionModal(position);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('#matrixSearchBtn')) {
        this.searchByUserId();
      }
    });

    document.addEventListener('keypress', (e) => {
      if (e.target.matches('#matrixSearchInput') && e.key === 'Enter') {
        this.searchByUserId();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('#viewMatrixBtn')) {
        this.viewUserMatrix();
      }
    });
  }

  async switchLevel(level) {
    if (this.isLoading) return;
  
    this.currentLevel = level;
    this.updateLevelButtons(level);
    this.updateLevelInfo(level);
    await this.loadMatrixData(this.currentUserId, level);
  }

  updateLevelInfo(level) {
    const maxPositions = Math.pow(2, level);
    const currentLevelEl = document.getElementById('currentMatrixLevel');
    const maxPositionsEl = document.getElementById('maxPositionsInfo');
  
    if (currentLevelEl) currentLevelEl.textContent = level;
    if (maxPositionsEl) maxPositionsEl.textContent = maxPositions;
  }

  updateLevelButtons(activeLevel) {
    const buttons = document.querySelectorAll('#matrixLevels .level-selector-btn');
    buttons.forEach((btn, index) => {
      btn.classList.toggle('active', index + 1 === activeLevel);
    });
  }

  async loadCurrentUserMatrix() {
    if (!web3Manager.account) return;
    
    this.currentUserId = await contractManager.getUserIdByAddress(web3Manager.account);
    if (this.currentUserId) {
      await this.loadMatrixData(this.currentUserId, this.currentLevel);
    }
  }

  async loadMatrixData(userId, level) {
    this.isLoading = true;
    this.showLoadingState();

    try {
      const userAddress = await contractManager.getAddressByUserId(userId) || web3Manager.account;
      const matrixData = await contractManager.getMatrixData(userAddress, level);
      
      this.updateMatrixVisualization(matrixData);
      this.updateMatrixTable(matrixData.tableData);
      this.updateMatrixStats(matrixData.stats);
    } catch (error) {
      console.error('Failed to load matrix data:', error);
      uiManager.showError('Failed to load matrix data');
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  updateMatrixVisualization(data) {
    this.updatePosition('topPosition', data.topUser);
    
    data.positions.forEach((posData, index) => {
      this.updatePosition(`position${index + 1}`, posData);
    });
  }

  updatePosition(elementId, posData) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const avatar = element.querySelector('.position-avatar');
    const idSpan = element.querySelector('.position-id');
    const typeSpan = element.querySelector('.position-type, .position-level');

    element.className = 'matrix-position';
    
    if (elementId === 'topPosition') {
      element.classList.add('top-position');
    }

    if (posData.type) {
      element.classList.add(posData.type);
    }

    if (avatar) {
      avatar.textContent = posData.id ? posData.id.slice(-3) : '?';
    }

    if (idSpan) {
      idSpan.textContent = posData.id || 'Empty';
    }
    
    if (typeSpan) {
      if (elementId === 'topPosition') {
        typeSpan.textContent = `Level ${posData.level}`;
      } else {
        typeSpan.textContent = posData.type === 'available' ? 'Available' : posData.qualification;
      }
    }

    element.dataset.positionData = JSON.stringify(posData);
  }

  updateMatrixTable(tableData) {
    const tbody = document.getElementById('matrixTableBody');
    if (!tbody) return;
  
    const maxPositions = Math.pow(2, this.currentLevel);
    
    if (tableData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="no-data">No partners found for level ${this.currentLevel}</td></tr>`;
      return;
    }
  
    const limitedData = tableData.slice(0, maxPositions);
    
    tbody.innerHTML = limitedData.map(row => `
      <tr>
        <td>${row.number}</td>
        <td>${row.id}</td>
        <td>${row.address.slice(0, 6)}...${row.address.slice(-4)}</td>
        <td>${row.sponsorId}</td>
        <td>${row.activationDate.toLocaleDateString()}</td>
        <td>${row.level}</td>
        <td>
          <span class="qualification-badge ${row.qualification.toLowerCase()}">
            ${row.qualification}
          </span>
        </td>
      </tr>
    `).join('');
    
    if (tableData.length > maxPositions) {
      const infoRow = document.createElement('tr');
      infoRow.innerHTML = `
        <td colspan="7" class="table-info">
          Showing ${maxPositions} of ${tableData.length} positions (Level ${this.currentLevel} limit: ${maxPositions})
        </td>
      `;
      tbody.appendChild(infoRow);
    }
  }

  updateMatrixStats(stats) {
    const elements = {
      'totalActivePositions': stats.total,
      'partnerPositions': stats.partners,
      'charityPositions': stats.charity,
      'technicalPositions': stats.technical
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  showPositionModal(positionElement) {
    const positionData = JSON.parse(positionElement.dataset.positionData || '{}');
    
    if (!positionData.id && positionData.type === 'available') {
      return;
    }

    const modal = document.getElementById('positionModal');
    if (!modal) return;

    const modalPositionId = document.getElementById('modalPositionId');
    const modalSponsorId = document.getElementById('modalSponsorId');
    const modalAddress = document.getElementById('modalAddress');
    const modalLevel = document.getElementById('modalLevel');
    const modalStatus = document.getElementById('modalStatus');
    const modalQualification = document.getElementById('modalQualification');

    if (modalPositionId) modalPositionId.textContent = positionData.id || '-';
    if (modalSponsorId) modalSponsorId.textContent = positionData.sponsorId || '-';
    if (modalAddress) {
      modalAddress.textContent = positionData.address ? 
        `${positionData.address.slice(0, 6)}...${positionData.address.slice(-4)}` : '-';
    }
    if (modalLevel) modalLevel.textContent = positionData.level || '-';
    if (modalStatus) modalStatus.textContent = positionData.type || '-';
    if (modalQualification) modalQualification.textContent = positionData.qualification || '-';

    modal.dataset.currentUserId = positionData.id;
    modal.dataset.currentAddress = positionData.address;

    modal.style.display = 'block';
  }

  async searchByUserId() {
    const input = document.getElementById('matrixSearchInput');
    if (!input) return;

    const searchId = input.value.trim();
    if (!searchId) {
      uiManager.showError('Please enter a user ID');
      return;
    }

    const cleanId = searchId.replace(/^GW/i, '');
    
    if (!/^\d{7}$/.test(cleanId)) {
      uiManager.showError('Invalid ID format. Use GW1234567 or 1234567');
      return;
    }

    try {
      this.isLoading = true;
      this.showLoadingState();

      const foundUserId = `GW${cleanId}`;
      this.currentUserId = foundUserId;
      
      await this.loadMatrixData(foundUserId, this.currentLevel);
      input.value = '';
      
      uiManager.showSuccess(`Matrix loaded for user ${foundUserId}`);
    } catch (error) {
      console.error('Search failed:', error);
      uiManager.showError('User not found or matrix data unavailable');
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  async viewUserMatrix() {
    const modal = document.getElementById('positionModal');
    if (!modal) return;

    const userId = modal.dataset.currentUserId;
    if (!userId) return;

    modal.style.display = 'none';

    this.currentUserId = userId;
    await this.loadMatrixData(userId, this.currentLevel);
  }

  showLoadingState() {
    const positions = document.querySelectorAll('.matrix-position');
    positions.forEach(pos => pos.classList.add('loading'));

    const tbody = document.getElementById('matrixTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">Loading...</td></tr>';
    }
  }

  hideLoadingState() {
    const positions = document.querySelectorAll('.matrix-position');
    positions.forEach(pos => pos.classList.remove('loading'));
  }

  async initMatrixPage() {
    await this.init();
    this.generateLevelButtons();
    this.updateLevelInfo(1);
  }

  generateLevelButtons() {
    const container = document.getElementById('matrixLevels');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-selector-btn';
      btn.textContent = i;
      if (i === 1) btn.classList.add('active');
      container.appendChild(btn);
    }
  }
}

const uiManager = new UIManager();
window.uiManager = uiManager;
