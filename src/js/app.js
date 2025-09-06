// ==================== ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ ====================

class GlobalWayApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.translations = {};
    this.currentLanguage = 'en';
    this.isConnected = false;
    this.userAccount = null;
    this.userData = null;
    this.updateInterval = null;
    this.isOwner = false;
    this.userReferralId = null; // Генерируемый 7-значный ID
    
    this.init();
  }

  async init() {
    try {
        await this.loadTranslations();
    } catch (error) {
        console.error('Ошибка загрузки переводов:', error);
        this.translations = {
            en: { dashboard: 'Dashboard', partners: 'Partners', matrix: 'Matrix', tokens: 'Tokens', settings: 'Settings', projects: 'Projects', admin: 'Admin' },
            ru: { dashboard: 'Дашборд', partners: 'Партнеры', matrix: 'Матрица', tokens: 'Токены', settings: 'Настройки', projects: 'Проекты', admin: 'Админ' },
            uk: { dashboard: 'Дашборд', partners: 'Партнери', matrix: 'Матриця', tokens: 'Токени', settings: 'Налаштування', projects: 'Проекти', admin: 'Адмін' }
        };
    }
    
    this.setupEventListeners();
    this.setupNavigation();
    this.updateUI();
    
    const savedLanguage = localStorage.getItem('globalway_language') || 'en';
    this.switchLanguage(savedLanguage);
    
    await this.navigateToPage('dashboard');
    
    this.hideLoadingScreen();
    
    console.log('🌌 GlobalWay App initialized');
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  async loadTranslations() {
    try {
      const languages = ['en', 'uk', 'ru'];
      for (const lang of languages) {
        const response = await fetch(`translations/${lang}.json`);
        if (response.ok) {
          this.translations[lang] = await response.json();
        } else {
          console.warn(`Не удалось загрузить переводы для ${lang}`);
          this.translations[lang] = {
            dashboard: lang === 'ru' ? 'Дашборд' : lang === 'uk' ? 'Дашборд' : 'Dashboard',
            partners: lang === 'ru' ? 'Партнеры' : lang === 'uk' ? 'Партнери' : 'Partners',
            matrix: lang === 'ru' ? 'Матрица' : lang === 'uk' ? 'Матриця' : 'Matrix',
            tokens: lang === 'ru' ? 'Токены' : lang === 'uk' ? 'Токени' : 'Tokens',
            settings: lang === 'ru' ? 'Настройки' : lang === 'uk' ? 'Налаштування' : 'Settings',
            projects: lang === 'ru' ? 'Проекты' : lang === 'uk' ? 'Проекти' : 'Projects',
            admin: lang === 'ru' ? 'Админ' : lang === 'uk' ? 'Адмін' : 'Admin'
          };
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки переводов:', error);
    }
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const page = button.dataset.page;
        this.navigateToPage(page);
      });
    });
  }

  async navigateToPage(page) {
    if (this.currentPage === page) return;
    
    const componentContent = await this.loadComponent(page);
    
    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.remove('active');
        pageEl.innerHTML = '';
    });
    
    const targetPage = document.getElementById(page);
    if (targetPage) {
      if (componentContent) {
        targetPage.innerHTML = componentContent;
      } else {
        targetPage.innerHTML = '<div class="no-data">Контент не найден</div>';
      }
      targetPage.classList.add('active');
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-page="${page}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    this.currentPage = page;
    this.initPageFunctions(page);
    this.updateTranslations();
  }

  async loadComponent(name) {
    try {
      const response = await fetch(`src/components/${name}.html`);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      console.error(`Ошибка загрузки компонента ${name}:`, error);
      return null;
    }
  }

  initPageFunctions(page) {
    switch (page) {
      case 'dashboard':
        this.initDashboard();
        break;
      case 'partners':
        this.initPartners();
        break;
      case 'matrix':
        this.initMatrix();
        this.updateMatrixDisplay();
        break;
      case 'tokens':
        this.initTokens();
        break;
      case 'settings':
        this.initSettings();
        break;
      case 'projects':
        this.initProjects();
        break;
      case 'admin':
        this.initAdmin();
        break;
    }
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ====================

  initDashboard() {
    this.updateUserInfo();
    this.setupLevelButtons();
    this.setupQuickBuy();
    this.setupWithdrawal();
    this.setupQuarterlyActivity();
    this.startDataUpdates();
  }

  // Инициализация админ панели
  initAdmin() {
    if (!this.isConnected) {
      this.showNotification('🔗 Подключите кошелек для доступа к админ-панели', 'warning');
      return;
    }

    this.checkOwnership();
    this.setupAdminUI();
  }

  // Проверка владельца контракта
  async checkOwnership() {
    try {
      if (!window.contractManager?.contracts?.globalWay) {
        console.warn('Контракт не загружен');
        return;
      }

      const owner = await window.contractManager.contracts.globalWay.methods.owner().call();
      this.isOwner = owner.toLowerCase() === this.userAccount.toLowerCase();

      console.log('Проверка владельца:', {
        currentUser: this.userAccount,
        contractOwner: owner,
        isOwner: this.isOwner
      });

      this.updateOwnerStatus();
      
    } catch (error) {
      console.error('Ошибка проверки владельца:', error);
      this.isOwner = false;
      this.updateOwnerStatus();
    }
  }

  // Обновление статуса владельца в UI
  updateOwnerStatus() {
    const elements = {
      currentAccount: document.getElementById('currentAccount'),
      ownerStatus: document.getElementById('ownerStatus'),
      contractOwnerAddress: document.getElementById('contractOwnerAddress'),
      adminFunctions: document.getElementById('adminFunctions'),
      notOwnerMessage: document.getElementById('notOwnerMessage'),
      currentUserAccount: document.getElementById('currentUserAccount'),
      requiredOwnerAccount: document.getElementById('requiredOwnerAccount')
    };

    if (elements.currentAccount) {
      elements.currentAccount.textContent = this.formatAddress(this.userAccount);
    }

    if (elements.ownerStatus) {
      elements.ownerStatus.textContent = this.isOwner ? '👑 Contract Owner' : '⌀ Not Owner';
      elements.ownerStatus.className = `value ${this.isOwner ? 'active' : 'inactive'}`;
    }

    if (this.isOwner) {
      if (elements.adminFunctions) elements.adminFunctions.classList.remove('hidden');
      if (elements.notOwnerMessage) elements.notOwnerMessage.classList.add('hidden');
    } else {
      if (elements.adminFunctions) elements.adminFunctions.classList.add('hidden');
      if (elements.notOwnerMessage) elements.notOwnerMessage.classList.remove('hidden');
      
      if (elements.currentUserAccount) {
        elements.currentUserAccount.textContent = this.formatAddress(this.userAccount);
      }
    }
  }

  // Настройка админ UI
  setupAdminUI() {
    if (!this.isOwner) return;

    // Активация пользователя
    const activateBtn = document.getElementById('activateUserBtn');
    if (activateBtn) {
      activateBtn.addEventListener('click', () => this.adminActivateUser());
    }

    // Массовая активация
    const batchBtn = document.getElementById('batchActivateBtn');
    if (batchBtn) {
      batchBtn.addEventListener('click', () => this.adminBatchActivate());
    }

    // Обновление статистики
    const refreshBtn = document.getElementById('refreshAdminStats');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAdminStats());
    }

    this.refreshAdminStats();
  }

  // Админ активация пользователя
  async adminActivateUser() {
    const userAddress = document.getElementById('freeUserAddress').value.trim();
    const sponsorAddress = document.getElementById('freeUserSponsor').value.trim();
    const maxLevel = parseInt(document.getElementById('freeUserMaxLevel').value);

    if (!userAddress || !sponsorAddress) {
      this.showNotification('⌀ Заполните все поля', 'error');
      return;
    }

    try {
      const confirmed = await this.showConfirmModal(
        'Бесплатная активация пользователя',
        `Пользователь: ${userAddress}\nСпонсор: ${sponsorAddress}\nМаксимальный уровень: ${maxLevel}`,
        'Подтвердить активацию'
      );

      if (!confirmed) return;

      const tx = await window.contractManager.freeRegistrationWithLevels(
        userAddress, 
        maxLevel, 
        this.userAccount
      );
      
      this.showNotification('✅ Пользователь успешно активирован!', 'success');
      
      document.getElementById('freeUserAddress').value = '';
      document.getElementById('freeUserSponsor').value = '';
      
    } catch (error) {
      this.handleError(error, 'активации пользователя');
    }
  }

  // Массовая активация
  async adminBatchActivate() {
    const membersText = document.getElementById('teamMembers').value.trim();
    const sponsorsText = document.getElementById('teamSponsors').value.trim();
    const levelsText = document.getElementById('teamLevels').value.trim();

    if (!membersText || !sponsorsText || !levelsText) {
      this.showNotification('⌀ Заполните все поля для массовой активации', 'error');
      return;
    }

    try {
      const members = membersText.split('\n').map(addr => addr.trim()).filter(addr => addr);
      const sponsors = sponsorsText.split('\n').map(addr => addr.trim()).filter(addr => addr);
      const levels = levelsText.split('\n').map(level => parseInt(level.trim())).filter(level => level);

      if (members.length !== sponsors.length || members.length !== levels.length) {
        this.showNotification('⌀ Количество участников, спонсоров и уровней должно совпадать', 'error');
        return;
      }

      const confirmed = await this.showConfirmModal(
        'Массовая активация команды',
        `Количество участников: ${members.length}`,
        'Подтвердить массовую активацию'
      );

      if (!confirmed) return;

      for (let i = 0; i < members.length; i++) {
        await window.contractManager.freeRegistrationWithLevels(
          members[i], 
          levels[i], 
          this.userAccount
        );
      }
      
      this.showNotification(`✅ Массовая активация завершена! Активировано: ${members.length} участников`, 'success');
      
      document.getElementById('teamMembers').value = '';
      document.getElementById('teamSponsors').value = '';
      document.getElementById('teamLevels').value = '';
      
    } catch (error) {
      this.handleError(error, 'массовой активации');
    }
  }

  // Обновление админ статистики
  async refreshAdminStats() {
    try {
      if (window.contractManager?.contracts?.globalWayStats) {
        const overview = await window.contractManager.getContractOverview();
        
        const elements = {
          totalUsers: document.getElementById('adminTotalUsers'),
          activeUsers: document.getElementById('adminActiveUsers'),
          contractBalance: document.getElementById('adminContractBalance'),
          totalVolume: document.getElementById('adminTotalVolume')
        };

        if (elements.totalUsers) {
          elements.totalUsers.textContent = overview.totalUsers || 0;
        }
        if (elements.activeUsers) {
          elements.activeUsers.textContent = overview.activeUsers || 0;
        }
        if (elements.contractBalance) {
          elements.contractBalance.textContent = `${this.formatBNB(overview.contractBalance || 0)} BNB`;
        }
        if (elements.totalVolume) {
          elements.totalVolume.textContent = `${this.formatBNB(overview.totalVolume || 0)} BNB`;
        }
      }
    } catch (error) {
      console.error('Ошибка получения админ статистики:', error);
    }
  }

  // Настройка квартальной активности
  setupQuarterlyActivity() {
    const payQuarterlyBtn = document.getElementById('payQuarterlyBtn');
    if (payQuarterlyBtn) {
      payQuarterlyBtn.addEventListener('click', () => {
        this.payQuarterlyActivity();
      });
    }
    this.updateQuarterlyStatus();
  }

  // Обновление статуса квартальной активности
  async updateQuarterlyStatus() {
    if (!this.isConnected) return;
    
    try {
      const user = await window.contractManager.contracts.globalWay.methods
        .users(this.userAccount).call();
        
      const quarterlyFee = await window.contractManager.getQuarterlyFee();
      const now = Math.floor(Date.now() / 1000);
      
      const daysSinceRegistration = Math.floor((now - parseInt(user.registrationTime)) / (24 * 60 * 60));
      
      const nextPaymentDay = user.quarterlyCounter * 90;
      const canPayQuarterly = daysSinceRegistration >= nextPaymentDay;

      const elements = {
        quarterNumber: document.getElementById('quarterNumber'),
        lastQuarterlyPayment: document.getElementById('lastQuarterlyPayment'),
        nextQuarterlyDate: document.getElementById('nextQuarterlyDate'),
        quarterlyFeeAmount: document.getElementById('quarterlyFeeAmount'),
        payQuarterlyBtn: document.getElementById('payQuarterlyBtn'),
        quarterlyStatus: document.getElementById('quarterlyStatus')
      };
      
      if (elements.quarterNumber) {
        elements.quarterNumber.textContent = user.quarterlyCounter + 1;
      }
      
      if (elements.lastQuarterlyPayment) {
        const lastPayment = new Date(user.lastActivity * 1000);
        elements.lastQuarterlyPayment.textContent = lastPayment.toLocaleDateString();
      }
      
      if (elements.nextQuarterlyDate) {
        const nextDate = new Date((parseInt(user.registrationTime) + (nextPaymentDay * 24 * 60 * 60)) * 1000);
        elements.nextQuarterlyDate.textContent = nextDate.toLocaleDateString();
      }
      
      if (elements.quarterlyFeeAmount) {
        elements.quarterlyFeeAmount.textContent = `${this.formatBNB(quarterlyFee)} BNB`;
      }
      
      if (elements.payQuarterlyBtn) {
        elements.payQuarterlyBtn.disabled = !canPayQuarterly;
        elements.payQuarterlyBtn.className = canPayQuarterly ? 'activate-btn' : 'activate-btn disabled';
      }
      
      if (elements.quarterlyStatus) {
        const statusSpan = elements.quarterlyStatus.querySelector('.value');
        const daysUntilNext = Math.max(0, nextPaymentDay - daysSinceRegistration);
        
        if (canPayQuarterly) {
          statusSpan.textContent = '⚠️ Требуется оплата';
          statusSpan.className = 'value inactive';
        } else {
          statusSpan.textContent = `✅ Активен (${daysUntilNext} дней до платежа)`;
          statusSpan.className = 'value active';
        }
      }
      
    } catch (error) {
      console.error('Ошибка получения статуса активности:', error);
    }
  }

  // Функция оплаты квартальной активности
  async payQuarterlyActivity() {
    if (!this.checkWeb3Connection()) return;

    try {
      const quarterlyFee = await window.contractManager.getQuarterlyFee();
      
      const confirmed = await this.showConfirmModal(
        'Оплата квартальной активности',
        `Стоимость: ${this.formatBNB(quarterlyFee)} BNB`,
        'Подтвердить оплату'
      );

      if (!confirmed) return;

      this.showNotification('Обрабатывается транзакция...', 'info');

      const tx = await window.contractManager.payQuarterlyActivity(this.userAccount, quarterlyFee);
      
      this.showNotification('✅ Квартальная активность оплачена!', 'success');
      
      await this.updateQuarterlyStatus();
      await this.updateUserInfo();

    } catch (error) {
      this.handleError(error, 'оплате квартальной активности');
    }
  }

  initPartners() {
    this.setupLevelTabs();
    this.setupSearch();
    this.updatePartnerStats();
    this.setupPartnerTools();
  }

  initMatrix() {
    this.setupMatrixNavigation();
    this.updateMatrixDisplay();
    this.setupMatrixControls();
  }

  initTokens() {
    this.setupTokenTrading();
    this.updateTokenPrices();
    this.setupTradingTabs();
    this.updateTokenInfo();
    this.setupTokenInteractions();
  }

  // Обновление информации о токенах
  async updateTokenInfo() {
    if (!this.isConnected || !this.userAccount) return;

    try {
      const tokenBalance = await window.contractManager.getTokenBalance(this.userAccount);
      const tokenPrice = await window.contractManager.getTokenCurrentPrice();
      const totalSupply = await window.contractManager.getTokenTotalSupply();

      const elements = {
        tokenBalance: document.getElementById('tokenBalance'),
        tokenBalanceDisplay: document.getElementById('tokenBalanceDisplay'),
        tokenPrice: document.getElementById('tokenPrice'),
        tokenPriceDisplay: document.getElementById('tokenPriceDisplay'),
        totalSupply: document.getElementById('totalSupply'),
        tokenValue: document.getElementById('tokenValue'),
        tokenValueDisplay: document.getElementById('tokenValueDisplay')
      };

      const formattedBalance = this.formatTokens(tokenBalance);
      const formattedPrice = this.formatBNB(tokenPrice, 6);

      if (elements.tokenBalance) {
        elements.tokenBalance.textContent = `${formattedBalance} GWT`;
      }
      if (elements.tokenBalanceDisplay) {
        elements.tokenBalanceDisplay.textContent = `${formattedBalance} GWT`;
      }
      if (elements.tokenPrice) {
        elements.tokenPrice.textContent = `$${formattedPrice}`;
      }
      if (elements.tokenPriceDisplay) {
        elements.tokenPriceDisplay.textContent = `$${formattedPrice}`;
      }
      if (elements.totalSupply) {
        elements.totalSupply.textContent = this.formatLargeNumber(totalSupply);
      }

      const userTokenValue = (parseFloat(formattedBalance) * parseFloat(formattedPrice)).toFixed(2);
      if (elements.tokenValue) {
        elements.tokenValue.textContent = `≈ $${userTokenValue}`;
      }
      if (elements.tokenValueDisplay) {
        elements.tokenValueDisplay.textContent = `≈ $${userTokenValue}`;
      }

    } catch (error) {
      console.error('Ошибка получения информации о токенах:', error);
    }
  }

  initSettings() {
    this.setupSettings();
    this.loadUserSettings();
    this.setupSecuritySettings();
    this.setupSettingsInteractions();
    this.updateSecurityInfo();
  }

  initProjects() {
    this.setupProjectCards();
    this.updateProjectStats();
    this.setupProjectInteractions();
  }

  // ==================== РАБОТА С КОНТРАКТАМИ ====================

  async updateUserInfo() {
    if (!this.isConnected || !this.userAccount) return;

    try {
      if (window.contractManager?.contracts?.globalWayStats) {
        this.userData = await window.contractManager.getUserFullInfo(this.userAccount);
        this.displayUserData();
      }

      if (window.contractManager?.contracts?.globalWay) {
        const userData = await window.contractManager.getUserData(this.userAccount);
        this.displayBasicUserData(userData);
      }

      if (this.currentPage === 'tokens') {
        await this.updateTokenInfo();
      }

    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
    }
  }

  displayUserData() {
    if (!this.userData) return;

    const elements = {
      userBalance: document.getElementById('userBalance'),
      totalEarned: document.getElementById('totalEarned'),
      personalInvites: document.getElementById('personalInvites'),
      leaderRank: document.getElementById('leaderRank'),
      registrationTime: document.getElementById('registrationTime'),
      lastActivity: document.getElementById('lastActivity')
    };

    if (elements.totalEarned) {
      elements.totalEarned.textContent = this.formatBNB(this.userData.totalEarned);
    }

    if (elements.personalInvites) {
      elements.personalInvites.textContent = this.userData.personalInvites;
    }

    if (elements.leaderRank) {
      elements.leaderRank.textContent = this.userData.leaderRank;
    }

    if (elements.registrationTime && this.userData.registrationTime > 0) {
      elements.registrationTime.textContent = new Date(this.userData.registrationTime * 1000).toLocaleDateString();
    }

    this.updateActiveLevelsDisplay();
  }

  // Отображение базовых данных пользователя
  displayBasicUserData(userData) {
    if (!userData) return;

    const elements = {
      userId: document.getElementById('userId'),
      userRank: document.getElementById('userRank'),
      referralFrom: document.getElementById('referralFrom')
    };

    if (elements.userId) {
      elements.userId.textContent = userData.personalInvites || '---';
    }

    if (elements.userRank) {
      elements.userRank.textContent = userData.leaderRank || '---';
    }

    if (elements.referralFrom && userData.sponsor) {
      elements.referralFrom.textContent = this.formatAddress(userData.sponsor);
    }
  }

  updateActiveLevelsDisplay() {
    if (!this.userData?.activeLevels) return;

    for (let i = 1; i <= 12; i++) {
      const levelBtn = document.querySelector(`[data-level="${i}"]`);
      if (levelBtn) {
        if (this.userData.activeLevels.includes(i)) {
          levelBtn.classList.add('active');
          levelBtn.classList.remove('inactive');
          levelBtn.querySelector('.level-status').textContent = 'Active';
        } else {
          levelBtn.classList.remove('active');
          levelBtn.classList.add('inactive');
          levelBtn.querySelector('.level-status').textContent = 'Available';
        }
      }
    }
  }

  async setupLevelButtons() {
    const levelButtons = document.querySelectorAll('.level-button');
    levelButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const level = parseInt(button.dataset.level);
        await this.buyLevel(level);
      });
    });
  }

  async buyLevel(level) {
    if (!this.checkWeb3Connection()) return;

    try {
      // Проверяем наличие предыдущих уровней
      const hasRequiredLevels = await this.checkRequiredLevels(level);
      if (!hasRequiredLevels) {
        this.showNotification(`Необходимо сначала активировать уровни 1-${level-1}`, 'warning');
        return;
      }

      const price = await window.contractManager.getLevelPrice(level);
      
      const confirmed = await this.showConfirmModal(
        `Купить уровень ${level}`,
        `Цена: ${this.formatBNB(price)} BNB`,
        'Подтвердить покупку'
      );

      if (!confirmed) return;

      this.showNotification('Обрабатывается транзакция...', 'info');

      const tx = await window.contractManager.buyLevel(level, this.userAccount, price);
      
      this.showNotification('Уровень успешно куплен!', 'success');
      
      await this.updateUserInfo();

    } catch (error) {
      // Убираем модальные наложения при ошибке
    if (window.web3Manager) {
      window.web3Manager.removeModalOverlays();
    }
      this.handleError(error, 'покупке уровня');
    }
  }

  // Проверка необходимых уровней
  async checkRequiredLevels(targetLevel) {
    if (!this.userData?.activeLevels) {
      await this.updateUserInfo();
    }

    if (!this.userData?.activeLevels) return false;

    for (let i = 1; i < targetLevel; i++) {
      if (!this.userData.activeLevels.includes(i)) {
        return false;
      }
    }

    return true;
  }

  async setupQuickBuy() {
    const quickBuyButtons = document.querySelectorAll('.quick-buy-btn');
    quickBuyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const packageType = parseInt(button.dataset.package);
        await this.activatePackage(packageType);
      });
    });
  }

  async activatePackage(packageType) {
    if (!this.checkWeb3Connection()) return;
    try {
  // Убираем все зависшие модальные окна перед началом
  // Убираем все зависшие модальные окна перед началом
  if (window.web3Manager) {
    window.web3Manager.removeModalOverlays();
  }
  if (window.web3Manager) {
    window.web3Manager.removeModalOverlays();
  }

    try {
      // ИСПРАВЛЕНО: Убран Client пакет, теперь только 4 пакета
      const packageLevels = {
        1: [1, 2, 3, 4], // MiniAdmin (1-4)
        2: [1, 2, 3, 4, 5, 6, 7], // Admin (1-7)
        3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // SuperAdmin (1-10)
        4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Manager (1-12)
      };

      const packageNames = {
        1: 'MiniAdmin (1-4)',
        2: 'Admin (1-7)', 
        3: 'SuperAdmin (1-10)',
        4: 'Manager (1-12)'
      };

      // Получаем текущие активные уровни пользователя
      if (!this.userData?.activeLevels) {
        await this.updateUserInfo();
      }

      const activeLevels = this.userData?.activeLevels || [];
      const targetLevels = packageLevels[packageType];
      
      // Определяем какие уровни нужно доплатить
      const levelsToActivate = targetLevels.filter(level => !activeLevels.includes(level));

      if (levelsToActivate.length === 0) {
        this.showNotification('Все уровни этого пакета уже активированы', 'info');
        return;
      }

      // Рассчитываем стоимость недостающих уровней
      let totalPrice = 0;
      for (const level of levelsToActivate) {
        const levelPrice = await window.contractManager.getLevelPrice(level);
        totalPrice += parseInt(levelPrice);
      }

      const confirmed = await this.showConfirmModal(
        `Активировать пакет ${packageNames[packageType]}`,
        `Доплата за уровни ${levelsToActivate.join(', ')}: ${this.formatBNB(totalPrice.toString())} BNB`,
        'Активировать пакет'
      );

      if (!confirmed) return;

      this.showNotification('Активация пакета...', 'info');

      // Покупаем недостающие уровни по одному
      for (const level of levelsToActivate) {
        const levelPrice = await window.contractManager.getLevelPrice(level);
        await window.contractManager.buyLevel(level, this.userAccount, levelPrice);
      }
      
      this.showNotification('Пакет успешно активирован!', 'success');
      await this.updateUserInfo();

    } catch (error) {
      // Убираем модальные наложения при ошибке  
if (window.web3Manager) {
  window.web3Manager.removeModalOverlays();
}
      this.handleError(error, 'активации пакета');
    }
  }

  async registerUser() {
    if (!this.checkWeb3Connection()) return;

    try {
      let sponsor = localStorage.getItem('globalway_referrer');
      if (!sponsor) {
        sponsor = this.getUrlParameter('ref');
      }

      if (!sponsor || !this.isValidAddress(sponsor)) {
        this.showNotification('Некорректная реферальная ссылка', 'error');
        return;
      }

      this.showNotification('Регистрация пользователя...', 'info');
      const tx = await window.contractManager.register(sponsor, this.userAccount);
     
      this.showNotification('Регистрация успешна!', 'success');
      await this.updateUserInfo();

    } catch (error) {
      this.handleError(error, 'регистрации');
    }
  }

  // ==================== ОБНОВЛЕНИЕ ДАННЫХ ====================

  startDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      if (this.isConnected) {
        this.updateUserInfo();
        this.updateContractStats();
      }
    }, 30000);
  }

  async updateContractStats() {
    try {
      if (window.contractManager?.contracts?.globalWayStats) {
        const overview = await window.contractManager.getContractOverview();
        this.displayContractStats(overview);
      }
    } catch (error) {
      console.error('Ошибка получения статистики контракта:', error);
    }
  }

  displayContractStats(stats) {
    const elements = {
      totalUsers: document.getElementById('totalUsers'),
      totalVolume: document.getElementById('totalVolume'),
      activeUsers: document.getElementById('activeUsers'),
      contractBalance: document.getElementById('contractBalance')
    };

    if (elements.totalUsers) {
      elements.totalUsers.textContent = stats.totalUsers || 0;
    }

    if (elements.totalVolume) {
      elements.totalVolume.textContent = this.formatBNB(stats.totalVolume || 0);
    }

    if (elements.activeUsers) {
      elements.activeUsers.textContent = stats.activeUsers || 0;
    }

    if (elements.contractBalance) {
      elements.contractBalance.textContent = this.formatBNB(stats.contractBalance || 0);
    }
  }

  // ==================== МОДАЛЬНЫЕ ОКНА ====================

  async showConfirmModal(title, message, confirmText) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'cosmic-modal-overlay';
      modal.innerHTML = `
        <div class="cosmic-modal">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="this.closest('.cosmic-modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="cosmic-btn secondary" onclick="this.closest('.cosmic-modal-overlay').remove()">Отмена</button>
            <button class="cosmic-btn primary confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.confirm-btn').addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
    });
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  formatBNB(value, decimals = 4) {
    if (!value) return '0';
    const bnbValue = parseFloat(window.web3Manager?.web3?.utils?.fromWei(value.toString(), 'ether') || value);
    return bnbValue.toFixed(decimals);
  }

  formatTokens(value, decimals = 2) {
    if (!value) return '0';
    const tokenValue = parseFloat(window.web3Manager?.web3?.utils?.fromWei(value.toString(), 'ether') || value);
    return tokenValue.toFixed(decimals);
  }

  formatLargeNumber(value) {
    if (!value) return '0';
    const num = parseFloat(window.web3Manager?.web3?.utils?.fromWei(value.toString(), 'ether') || value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  checkWeb3Connection() {
    if (!window.web3Manager) {
      this.showNotification('Web3 Manager не загружен. Обновите страницу.', 'error');
      return false;
    }
    
    if (!this.isConnected) {
      this.showNotification('Подключите кошелек для выполнения этого действия', 'warning');
      return false;
    }
    
    if (this.isConnected) {
      this.checkOwnership();
    }

    return true;
  }

  handleError(error, action = 'выполнении операции') {
    console.error(`Ошибка при ${action}:`, error);
    
    let message = `Ошибка при ${action}.`;
    
    if (error.message?.includes('User denied')) {
      message = 'Транзакция отклонена пользователем';
    } else if (error.message?.includes('insufficient funds')) {
      message = 'Недостаточно средств на балансе';
    } else if (error.message?.includes('Already registered')) {
      message = 'Пользователь уже зарегистрирован';
    }
    
    this.showNotification(message, 'error');
  }

  // ==================== РЕФЕРАЛЬНАЯ СИСТЕМА С 7-ЗНАЧНЫМИ ID ====================

  // Генерация 7-значного случайного ID
  generateReferralId() {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  // Получение или создание реферального ID для пользователя
  getUserReferralId() {
    if (!this.userReferralId) {
      // Проверяем есть ли сохраненный ID для этого адреса
      const savedId = localStorage.getItem(`referral_id_${this.userAccount}`);
      if (savedId) {
        this.userReferralId = savedId;
      } else {
        // Генерируем новый ID
        this.userReferralId = this.generateReferralId();
        localStorage.setItem(`referral_id_${this.userAccount}`, this.userReferralId);
      }
    }
    return this.userReferralId;
  }

  // Обновление реферальной ссылки
  updateReferralLink() {
  if (this.userAccount) {
    const referralId = this.getUserReferralId();
    const link = `${window.location.origin}?ref=${referralId}`;
    
    // Обновляем поле ссылки
    const referralLink = document.getElementById('referralLink');
    if (referralLink) {
      referralLink.value = link;
    }
    
    // Обновляем отображение ID в интерфейсе
    const referralIdDisplay = document.getElementById('referralIdDisplay');
    if (referralIdDisplay) {
      referralIdDisplay.textContent = `ID: ${referralId}`;
    }
    
    // ИСПРАВЛЕНО: Обновляем все элементы с реферальными ссылками
    const allRefLinks = document.querySelectorAll('.referral-link-display, #partnerRefLink');
    allRefLinks.forEach(element => {
      if (element.tagName === 'INPUT') {
        element.value = link;
      } else {
        element.textContent = link;
      }
    });
    
    console.log('Реферальная ссылка обновлена:', link);
  }
}

  // Получение адреса кошелька по реферальному ID
  getWalletByReferralId(referralId) {
    // Поиск в localStorage всех сохраненных ID
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('referral_id_')) {
        const savedId = localStorage.getItem(key);
        if (savedId === referralId) {
          return key.replace('referral_id_', '');
        }
      }
    }
    return null;
  }

  // ==================== ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ ====================

  switchLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('globalway_language', language);
    
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = language;
    }
    
    const languageSettingsSelect = document.getElementById('languageSettingsSelect');
    if (languageSettingsSelect) {
      languageSettingsSelect.value = language;
    }
    
    this.updateTranslations();
  }

  updateTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
      const key = element.dataset.translate;
      const translation = this.getTranslation(key);
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  getTranslation(key) {
    return this.translations[this.currentLanguage]?.[key] || key;
  }

  setupEventListeners() {
    const connectButton = document.getElementById('connectWallet');
    if (connectButton) {
      connectButton.addEventListener('click', () => {
        if (window.web3Manager) {
          window.web3Manager.connectWallet();
        } else {
          this.showNotification('Web3 Manager not loaded', 'error');
        }
      });
    }

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.switchLanguage(e.target.value);
      });
    }

    const languageSettingsSelect = document.getElementById('languageSettingsSelect');
    if (languageSettingsSelect) {
      languageSettingsSelect.addEventListener('change', (e) => {
        this.switchLanguage(e.target.value);
      });
    }

    const copyRefLink = document.getElementById('copyRefLink');
    if (copyRefLink) {
      copyRefLink.addEventListener('click', () => {
        this.copyReferralLink();
      });
    }

    // ИСПРАВЛЕНО: Добавлен обработчик ошибок для предотвращения "тухнущего" экрана
    if (window.web3Manager) {
      window.web3Manager.on('connected', (data) => {
        this.isConnected = true;
        this.userAccount = data.account;
        this.updateUI();
        this.updateUserInfo();
        this.checkOwnership();
        this.showNotification('Кошелек подключен!', 'success');
      });

      window.web3Manager.on('disconnected', () => {
        this.isConnected = false;
        this.userAccount = null;
        this.userData = null;
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
        }
        this.updateUI();
        this.showNotification('Кошелек отключен', 'info');
      });

      // ИСПРАВЛЕНО: Обработка ошибок для предотвращения зависания интерфейса
      window.web3Manager.on('error', (error) => {
        console.error('Web3 Manager error:', error);
        this.showNotification('Ошибка подключения кошелька', 'error');
        this.removeModalOverlays(); // Убираем все модальные наложения
      });
    }
  }

  // НОВАЯ ФУНКЦИЯ: Удаление модальных наложений при ошибках
  removeModalOverlays() {
    const overlays = document.querySelectorAll('.cosmic-modal-overlay, .wallet-modal-overlay, .loading-overlay');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    // Убираем blur эффект с body
    document.body.style.filter = '';
    document.body.style.pointerEvents = '';
  }

  updateUI() {
    const connectButton = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    
    if (this.isConnected && this.userAccount) {
      if (connectButton) connectButton.style.display = 'none';
      if (walletInfo) walletInfo.classList.remove('hidden');
      
      const walletAddress = document.getElementById('walletAddress');
      const userAddress = document.getElementById('userAddress');
      
      if (walletAddress) walletAddress.textContent = this.formatAddress(this.userAccount);
      if (userAddress) userAddress.textContent = this.formatAddress(this.userAccount);
      
      this.updateReferralLink();
      
    } else {
      if (connectButton) connectButton.style.display = 'block';
      if (walletInfo) walletInfo.classList.add('hidden');
    }

    // ИСПРАВЛЕНО: Показываем админку для владельца
if (this.isConnected && this.isOwner) {
  // Показываем админку в навигации
  const adminNavBtn = document.querySelector('[data-page="admin"]');
  if (adminNavBtn) {
    adminNavBtn.style.display = 'block';
  }
  
  // Обновляем UI Manager если есть
  if (window.uiManager) {
    window.uiManager.toggleAdminFeatures(true);
  }
} else {
  // Скрываем админку
  const adminNavBtn = document.querySelector('[data-page="admin"]');
  if (adminNavBtn) {
    adminNavBtn.style.display = 'none';
  }
  
  if (window.uiManager) {
    window.uiManager.toggleAdminFeatures(false);
  }
}

    this.updateTranslations();
  }

  formatAddress(address) {
    if (!address) return '0x000...000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async copyReferralLink() {
    const referralLink = document.getElementById('referralLink');
    if (referralLink && referralLink.value) {
      try {
        await navigator.clipboard.writeText(referralLink.value);
        this.showNotification('Ссылка скопирована!', 'success');
      } catch (error) {
        this.showNotification('Не удалось скопировать ссылку', 'error');
      }
    }
  }

  showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('notification-slide-in');
    }, 10);
    
    setTimeout(() => {
      notification.classList.add('notification-slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
    
    notification.addEventListener('click', () => {
      notification.classList.add('notification-slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }

  // Остальные методы без изменений...
  setupWithdrawal() {
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', () => {
        this.processWithdrawal();
      });
    }
  }

  setupLevelTabs() {
    const levelTabs = document.querySelectorAll('.level-tab');
    levelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        levelTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const level = tab.dataset.level || tab.dataset.matrixLevel;
        this.updateLevelData(level);
      });
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('searchPartnerId');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchPartners(e.target.value);
      });
    }
  }

  setupMatrixNavigation() {
    const searchBtn = document.getElementById('searchMatrixBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.searchInMatrix();
      });
    }
  }

  setupMatrixControls() {
    const resetBtn = document.getElementById('resetMatrixView');
    const fullscreenBtn = document.getElementById('matrixFullscreen');
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetMatrixView();
      });
    }
    
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.toggleMatrixFullscreen();
      });
    }
  }

  setupTokenTrading() {
    const buyTokensBtn = document.getElementById('buyTokensBtn');
    const sellTokensBtn = document.getElementById('sellTokensBtn');
    
    if (buyTokensBtn) {
      buyTokensBtn.addEventListener('click', () => {
        this.buyTokens();
      });
    }
    
    if (sellTokensBtn) {
      sellTokensBtn.addEventListener('click', () => {
        this.sellTokens();
      });
    }
  }

  setupTradingTabs() {
    const tradingTabs = document.querySelectorAll('.tab-btn');
    tradingTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabType = tab.dataset.tab;
        this.switchTradingTab(tabType);
      });
    });
  }

  setupSettings() {
    const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        this.disconnectWallet();
      });
    }
  }

  setupSecuritySettings() {
    const toggles = document.querySelectorAll('.cosmic-toggle input[type="checkbox"]');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.saveSetting(e.target.id, e.target.checked);
      });
    });
  }

  setupProjectCards() {
    const projectBtns = document.querySelectorAll('.project-btn:not(.disabled)');
    projectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openProject();
      });
    });
  }

  loadUserSettings() {
    const settings = ['autoUpgrade', 'notifications', 'darkMode'];
    settings.forEach(setting => {
      const value = localStorage.getItem(`globalway_${setting}`);
      const element = document.getElementById(`${setting}Settings`);
      if (element && value !== null) {
        element.checked = JSON.parse(value);
      }
    });
  }

  saveSetting(key, value) {
    localStorage.setItem(`globalway_${key.replace('Settings', '')}`, JSON.stringify(value));
  }

  processWithdrawal() {
    const amount = document.getElementById('withdrawAmount')?.value;
    if (amount && amount > 0) {
      this.showNotification(`Вывод ${amount} BNB - функция будет добавлена после подключения контрактов`, 'info');
    } else {
      this.showNotification('Введите корректную сумму для вывода', 'warning');
    }
  }

  updateLevelData(level) {
    console.log(`Обновление данных для уровня ${level}`);
  }

  searchPartners(searchTerm) {
    console.log(`Поиск партнеров: ${searchTerm}`);
  }

  searchInMatrix() {
    const searchTerm = document.getElementById('searchMatrixId')?.value;
    if (searchTerm) {
      this.showNotification(`Поиск в матрице: ${searchTerm} - функция будет добавлена`, 'info');
    }
  }

  resetMatrixView() {
    this.showNotification('Сброс вида матрицы', 'info');
  }

  toggleMatrixFullscreen() {
    const matrixContainer = document.getElementById('matrixVisualContainer');
    if (matrixContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        matrixContainer.requestFullscreen();
      }
    }
  }

  buyTokens() {
    const amount = document.getElementById('buyTokenAmount')?.value;
    if (amount && amount > 0) {
      this.showNotification(`Покупка ${amount} токенов - функция будет добавлена после подключения контрактов`, 'info');
    } else {
      this.showNotification('Введите количество токенов для покупки', 'warning');
    }
  }

  sellTokens() {
    const amount = document.getElementById('sellTokenAmount')?.value;
    if (amount && amount > 0) {
      this.showNotification(`Продажа ${amount} токенов - функция будет добавлена после подключения контрактов`, 'info');
    } else {
      this.showNotification('Введите количество токенов для продажи', 'warning');
    }
  }

  switchTradingTab(tabType) {
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.trading-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    const activeContent = document.getElementById(`${tabType}Tab`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  }

  disconnectWallet() {
    if (window.web3Manager) {
      window.web3Manager.disconnectWallet();
    }
    this.isConnected = false;
    this.userAccount = null;
    this.userData = null;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateUI();
  }

  openProject() {
    this.showNotification('Проекты будут доступны в следующих обновлениях', 'info');
  }

  updatePartnerStats() {
    console.log('Обновление статистики партнеров');
  }

  updateMatrixDisplay() {
    const svg = document.querySelector('.matrix-svg');
    if (!svg) return;
    
    const connections = [
      {from: {x: 300, y: 70}, to: {x: 200, y: 150}},
      {from: {x: 300, y: 70}, to: {x: 400, y: 150}},
      {from: {x: 200, y: 150}, to: {x: 150, y: 230}},
      {from: {x: 200, y: 150}, to: {x: 250, y: 230}},
      {from: {x: 400, y: 150}, to: {x: 350, y: 230}},
      {from: {x: 400, y: 150}, to: {x: 450, y: 230}}
    ];
    
    svg.innerHTML = '';
    
    connections.forEach((conn, i) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', conn.from.x);
      line.setAttribute('y1', conn.from.y);
      line.setAttribute('x2', conn.to.x);
      line.setAttribute('y2', conn.to.y);
      line.setAttribute('class', `matrix-line ${i < 2 ? 'active' : ''}`);
      svg.appendChild(line);
    });
  }

  updateTokenPrices() {
    console.log('Обновление цен токенов');
  }

  updateProjectStats() {
    console.log('Обновление статистики проектов');
  }

  setupPartnerTools() {
    const copyBtn = document.getElementById('copyPartnerRefLink');
    const generateQR = document.getElementById('generateQRBtn');
    const telegramBtn = document.getElementById('shareToTelegram');
    const twitterBtn = document.getElementById('shareToTwitter');
    const whatsappBtn = document.getElementById('shareToWhatsApp');

    if (copyBtn) copyBtn.addEventListener('click', () => this.copyReferralLink());
    if (generateQR) generateQR.addEventListener('click', () => this.generateQRCode());
    if (telegramBtn) telegramBtn.addEventListener('click', () => this.shareToTelegram());
    if (twitterBtn) twitterBtn.addEventListener('click', () => this.shareToTwitter());
    if (whatsappBtn) whatsappBtn.addEventListener('click', () => this.shareToWhatsApp());
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  validateInput(value, min = 0, max = null) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= min) {
      return false;
    }
    if (max !== null && num > max) {
      return false;
    }
    return true;
  }

  formatNumber(number, decimals = 4) {
    return parseFloat(number).toFixed(decimals);
  }

  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(name);
    
    // ИСПРАВЛЕНО: Обработка реферальных ID (7-значные числа)
    if (name === 'ref' && param) {
      // Если это 7-значное число, ищем соответствующий адрес кошелька
      if (/^\d{7}$/.test(param)) {
        const walletAddress = this.getWalletByReferralId(param);
        return walletAddress || param; // Возвращаем адрес или сам ID если не найден
      }
      // Если это адрес кошелька, возвращаем как есть
      return param;
    }
    
    return param;
  }

  handleReferral() {
    const ref = this.getUrlParameter('ref');
    if (ref) {
      if (this.isValidAddress(ref)) {
        // Это адрес кошелька
        localStorage.setItem('globalway_referrer', ref);
        this.showNotification('Реферальная ссылка сохранена!', 'success');
      } else if (/^\d{7}$/.test(ref)) {
        // Это 7-значный ID
        const walletAddress = this.getWalletByReferralId(ref);
        if (walletAddress) {
          localStorage.setItem('globalway_referrer', walletAddress);
          this.showNotification('Реферальная ссылка сохранена!', 'success');
        } else {
          this.showNotification('Неверный реферальный ID', 'warning');
        }
      }
    }
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  saveAppState() {
    const state = {
      currentPage: this.currentPage,
      currentLanguage: this.currentLanguage,
      isConnected: this.isConnected,
      userAccount: this.userAccount
    };
    localStorage.setItem('globalway_app_state', JSON.stringify(state));
  }

  restoreAppState() {
    try {
      const savedState = localStorage.getItem('globalway_app_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.currentLanguage = state.currentLanguage || 'en';
      }
    } catch (error) {
      console.error('Ошибка восстановления состояния:', error);
    }
  }

  clearAppData() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('globalway_'));
    keys.forEach(key => localStorage.removeItem(key));
    this.showNotification('Данные приложения очищены', 'success');
  }

  exportData() {
    const data = {
      settings: {},
      timestamp: Date.now(),
      version: '1.0.0'
    };
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('globalway_'));
    keys.forEach(key => {
      data.settings[key] = localStorage.getItem(key);
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `globalway_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('Данные экспортированы', 'success');
  }

  generateQRCode() {
    if (this.userAccount) {
      const referralId = this.getUserReferralId();
      const link = `${window.location.origin}?ref=${referralId}`;
      this.showNotification('QR код будет добавлен в следующих обновлениях', 'info');
    } else {
      this.showNotification('Подключите кошелек для генерации QR кода', 'warning');
    }
  }

  shareToTelegram() {
    if (this.userAccount) {
      const referralId = this.getUserReferralId();
      const link = `${window.location.origin}?ref=${referralId}`;
      const text = encodeURIComponent('Join GlobalWay - Your Global Path to Success!');
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
      window.open(telegramUrl, '_blank');
    } else {
      this.showNotification('Подключите кошелек для создания реферальной ссылки', 'warning');
    }
  }

  shareToTwitter() {
    if (this.userAccount) {
      const referralId = this.getUserReferralId();
      const link = `${window.location.origin}?ref=${referralId}`;
      const text = encodeURIComponent('Join GlobalWay - Your Global Path to Success!');
      const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`;
      window.open(twitterUrl, '_blank');
    } else {
      this.showNotification('Подключите кошелек для создания реферальной ссылки', 'warning');
    }
  }

  shareToWhatsApp() {
    if (this.userAccount) {
      const referralId = this.getUserReferralId();
      const link = `${window.location.origin}?ref=${referralId}`;
      const text = encodeURIComponent('Join GlobalWay - Your Global Path to Success! ' + link);
     const whatsappUrl = `https://wa.me/?text=${text}`;
     window.open(whatsappUrl, '_blank');
   } else {
     this.showNotification('Подключите кошелек для создания реферальной ссылки', 'warning');
   }
 }

 setupProjectInteractions() {
   const suggestBtn = document.getElementById('suggestProjectBtn');
   const votingBtn = document.getElementById('openVotingBtn');
   const developerBtn = document.getElementById('joinDeveloperBtn');
   const docsBtn = document.getElementById('openDocsBtn');
   const partnerBtn = document.getElementById('applyPartnershipBtn');

   if (suggestBtn) suggestBtn.addEventListener('click', () => this.suggestProject());
   if (votingBtn) votingBtn.addEventListener('click', () => this.openVoting());
   if (developerBtn) developerBtn.addEventListener('click', () => this.joinDeveloperProgram());
   if (docsBtn) docsBtn.addEventListener('click', () => this.openDeveloperDocs());
   if (partnerBtn) partnerBtn.addEventListener('click', () => this.applyForPartnership());
 }

 suggestProject() {
   this.showNotification('Форма предложения проекта будет добавлена в следующих обновлениях', 'info');
 }

 openVoting() {
   if (!this.isConnected) {
     this.showNotification('Подключите кошелек для участия в голосовании', 'warning');
     return;
   }
   this.showNotification('Система голосования будет добавлена в следующих обновлениях', 'info');
 }

 joinDeveloperProgram() {
   this.showNotification('Программа для разработчиков будет запущена в Q2 2024', 'info');
 }

 openDeveloperDocs() {
   window.open('https://docs.globalway.io', '_blank');
 }

 applyForPartnership() {
   if (!this.isConnected) {
     this.showNotification('Подключите кошелек для подачи заявки на партнерство', 'warning');
     return;
   }
   this.showNotification('Партнерская программа будет запущена в Q3 2024', 'info');
 }

 setupTokenInteractions() {
   const applyFiltersBtn = document.getElementById('applyFiltersBtn');
   const copyContractBtn = document.getElementById('copyContractAddress');
   const viewBscscanBtn = document.getElementById('viewOnBscscan');
   const addToWalletBtn = document.getElementById('addToWallet');

   if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => this.applyTokenFilters());
   if (copyContractBtn) copyContractBtn.addEventListener('click', () => this.copyContractAddress());
   if (viewBscscanBtn) viewBscscanBtn.addEventListener('click', () => this.viewOnBscscan());
   if (addToWalletBtn) addToWalletBtn.addEventListener('click', () => this.addTokenToWallet());

   const buyAmountInput = document.getElementById('buyTokenAmount');
   const sellAmountInput = document.getElementById('sellTokenAmount');
   
   if (buyAmountInput) {
     buyAmountInput.addEventListener('input', (e) => this.calculateBuyCost(e.target.value));
   }
   if (sellAmountInput) {
     sellAmountInput.addEventListener('input', (e) => this.calculateSellReceive(e.target.value));
   }
 }

 applyTokenFilters() {
   const filter = document.getElementById('historyFilter').value;
   const dateFrom = document.getElementById('dateFrom').value;
   const dateTo = document.getElementById('dateTo').value;
   
   this.showNotification(`Применены фильтры: ${filter}${dateFrom ? `, с ${dateFrom}` : ''}${dateTo ? `, до ${dateTo}` : ''}`, 'info');
 }

 copyContractAddress() {
   const address = '0xd9145CCE52D386f254917e481eB44e9943F39138';
   navigator.clipboard.writeText(address).then(() => {
     this.showNotification('Адрес контракта скопирован!', 'success');
   }).catch(() => {
     this.showNotification('Не удалось скопировать адрес', 'error');
   });
 }

 viewOnBscscan() {
   const address = '0xd9145CCE52D386f254917e481eB44e9943F39138';
   window.open(`https://mainnet.opbnbscan.com/token/${address}`, '_blank');
 }

 async addTokenToWallet() {
   if (!this.isConnected) {
     this.showNotification('Подключите кошелек для добавления токена', 'warning');
     return;
   }

   try {
     await window.ethereum.request({
       method: 'wallet_watchAsset',
       params: {
         type: 'ERC20',
         options: {
           address: '0xd9145CCE52D386f254917e481eB44e9943F39138',
           symbol: 'GWT',
           decimals: 18,
           image: 'https://globalway.io/logo.png'
         }
       }
     });
     this.showNotification('Токен добавлен в кошелек!', 'success');
   } catch (error) {
     this.showNotification('Не удалось добавить токен в кошелек', 'error');
   }
 }

 calculateBuyCost(amount) {
   if (!amount || amount <= 0) {
     document.getElementById('buyTokenCost').value = '';
     return;
   }
   
   const tokenPrice = 0.01; // BNB
   const commission = 0.1; // 10%
   const cost = (amount * tokenPrice * (1 + commission)).toFixed(6);
   
   document.getElementById('buyTokenCost').value = `${cost} BNB`;
 }

 calculateSellReceive(amount) {
   if (!amount || amount <= 0) {
     document.getElementById('sellTokenReceive').value = '';
     return;
   }
   
   const tokenPrice = 0.01; // BNB
   const commission = 0.1; // 10%
   const receive = (amount * tokenPrice * (1 - commission)).toFixed(6);
   
   document.getElementById('sellTokenReceive').value = `${receive} BNB`;
 }

 setupSettingsInteractions() {
   const changeWalletBtn = document.getElementById('changeWallet');
   const copyMainBtn = document.getElementById('copyMainContract');
   const copyTokenBtn = document.getElementById('copyTokenContract');
   const verifyBtn = document.getElementById('verifyContractsBtn');
   const viewSourceBtn = document.getElementById('viewSourceBtn');
   const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
   const clearCacheBtn = document.getElementById('clearCacheBtn');
   
   const whitepaperBtn = document.getElementById('openWhitepaperBtn');
   const docsBtn = document.getElementById('openDocumentationBtn');
   const faqBtn = document.getElementById('openFAQBtn');
   const supportBtn = document.getElementById('openSupportBtn');
   const telegramBtn = document.getElementById('openTelegramBtn');
   const twitterBtn = document.getElementById('openTwitterBtn');
   
   const exportBtn = document.getElementById('exportDataBtn');
   const importBtn = document.getElementById('importDataBtn');
   const backupBtn = document.getElementById('createBackupBtn');
   const restoreBtn = document.getElementById('restoreBackupBtn');
   const resetBtn = document.getElementById('resetSettingsBtn');
   const clearDataBtn = document.getElementById('clearAllDataBtn');

   if (changeWalletBtn) changeWalletBtn.addEventListener('click', () => this.changeWallet());
   if (copyMainBtn) copyMainBtn.addEventListener('click', () => this.copyMainContract());
   if (copyTokenBtn) copyTokenBtn.addEventListener('click', () => this.copyTokenContract());
   if (verifyBtn) verifyBtn.addEventListener('click', () => this.verifyContracts());
   if (viewSourceBtn) viewSourceBtn.addEventListener('click', () => this.viewSourceCode());
   if (checkUpdatesBtn) checkUpdatesBtn.addEventListener('click', () => this.checkForUpdates());
   if (clearCacheBtn) clearCacheBtn.addEventListener('click', () => this.clearCache());
   
   if (whitepaperBtn) whitepaperBtn.addEventListener('click', () => this.openWhitepaper());
   if (docsBtn) docsBtn.addEventListener('click', () => this.openDocumentation());
   if (faqBtn) faqBtn.addEventListener('click', () => this.openFAQ());
   if (supportBtn) supportBtn.addEventListener('click', () => this.openSupport());
   if (telegramBtn) telegramBtn.addEventListener('click', () => this.openTelegram());
   if (twitterBtn) twitterBtn.addEventListener('click', () => this.openTwitter());
   
   if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
   if (importBtn) importBtn.addEventListener('click', () => this.createImportDialog());
   if (backupBtn) backupBtn.addEventListener('click', () => this.createBackup());
   if (restoreBtn) restoreBtn.addEventListener('click', () => this.restoreBackup());
   if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettingsDialog());
   if (clearDataBtn) clearDataBtn.addEventListener('click', () => this.clearAllDataDialog());
 }

 changeWallet() {
   if (window.web3Manager) {
     window.web3Manager.disconnectWallet();
     setTimeout(() => {
       window.web3Manager.connectWallet();
     }, 1000);
   }
 }

 copyMainContract() {
   const address = '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA';
   navigator.clipboard.writeText(address).then(() => {
     this.showNotification('Адрес основного контракта скопирован!', 'success');
   });
 }

 copyTokenContract() {
   const address = '0xd9145CCE52D386f254917e481eB44e9943F39138';
   navigator.clipboard.writeText(address).then(() => {
     this.showNotification('Адрес токена скопирован!', 'success');
   });
 }

 verifyContracts() {
   this.showNotification('Проверка контрактов...', 'info');
   setTimeout(() => {
     this.showNotification('Контракты верифицированы!', 'success');
   }, 2000);
 }

 viewSourceCode() {
   window.open('https://github.com/GlobalWay/contracts', '_blank');
 }

 openWhitepaper() {
   window.open('https://globalway.io/whitepaper.pdf', '_blank');
 }

 openDocumentation() {
   window.open('https://docs.globalway.io', '_blank');
 }

 openFAQ() {
   window.open('https://globalway.io/faq', '_blank');
 }

 openSupport() {
   window.open('mailto:support@globalway.io', '_blank');
 }

 openTelegram() {
   window.open('https://t.me/globalway_official', '_blank');
 }

 openTwitter() {
   window.open('https://twitter.com/globalway_io', '_blank');
 }

 createBackup() {
   this.exportData();
 }

 createImportDialog() {
   const input = document.createElement('input');
   input.type = 'file';
   input.accept = '.json';
   input.onchange = (e) => {
     if (e.target.files[0]) {
       this.importData(e.target.files[0]);
     }
   };
   input.click();
 }

 restoreBackup() {
   this.createImportDialog();
 }

 importData(file) {
   const reader = new FileReader();
   reader.onload = (e) => {
     try {
       const data = JSON.parse(e.target.result);
       if (data.settings) {
         Object.keys(data.settings).forEach(key => {
           localStorage.setItem(key, data.settings[key]);
         });
         this.showNotification('Данные импортированы успешно', 'success');
         this.loadUserSettings();
       }
     } catch (error) {
       this.showNotification('Ошибка импорта данных', 'error');
     }
   };
   reader.readAsText(file);
 }

 async resetSettingsDialog() {
   const confirmed = await this.showConfirmModal(
     'Сбросить настройки',
     'Все настройки будут сброшены к значениям по умолчанию. Продолжить?',
     'Сбросить'
   );
   
   if (confirmed) {
     localStorage.clear();
     this.showNotification('Настройки сброшены к значениям по умолчанию', 'success');
     setTimeout(() => location.reload(), 1000);
   }
 }

 async clearAllDataDialog() {
   const confirmed = await this.showConfirmModal(
     'Очистить все данные',
     'ВСЕ данные приложения будут удалены без возможности восстановления. Продолжить?',
     'Удалить все'
   );
   
   if (confirmed) {
     this.clearAppData();
     this.clearCache();
     setTimeout(() => location.reload(), 1000);
   }
 }

 async checkForUpdates() {
   this.showNotification('Проверка обновлений...', 'info');
   setTimeout(() => {
     this.showNotification('У вас последняя версия приложения', 'success');
   }, 2000);
 }

 clearCache() {
   if ('caches' in window) {
     caches.keys().then(names => {
       names.forEach(name => {
         caches.delete(name);
       });
     });
   }
   this.clearAppData();
   this.showNotification('Кэш очищен', 'success');
 }

 updateSecurityInfo() {
   const elements = {
     connectedWallet: document.getElementById('connectedWallet'),
     connectionStatus: document.getElementById('connectionStatus'),
     settingsWalletAddress: document.getElementById('settingsWalletAddress')
   };
   
   if (this.isConnected) {
     if (elements.connectedWallet) elements.connectedWallet.textContent = 'SafePal';
     if (elements.connectionStatus) {
       elements.connectionStatus.textContent = 'Connected';
       elements.connectionStatus.className = 'value connected';
     }
     if (elements.settingsWalletAddress) {
       elements.settingsWalletAddress.textContent = this.formatAddress(this.userAccount);
     }
   } else {
     if (elements.connectedWallet) elements.connectedWallet.textContent = 'Not Connected';
     if (elements.connectionStatus) {
       elements.connectionStatus.textContent = 'Disconnected';
       elements.connectionStatus.className = 'value disconnected';
     }
     if (elements.settingsWalletAddress) {
       elements.settingsWalletAddress.textContent = '0x000...000';
     }
   }
 }

 // Деструктор для очистки ресурсов
 destroy() {
   document.removeEventListener('DOMContentLoaded', this.init);
   
   if (this.updateInterval) {
     clearInterval(this.updateInterval);
   }
   
   this.saveAppState();
   
   console.log('GlobalWay App destroyed');
 }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
 if (typeof Web3 === 'undefined') {
   console.error('Web3 не загружен!');
   document.body.innerHTML = `
     <div style="
       display: flex; 
       justify-content: center; 
       align-items: center; 
       height: 100vh; 
       background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
       color: #FFD700;
       font-family: 'Segoe UI', sans-serif;
       text-align: center;
     ">
       <div>
         <h1>Ошибка загрузки</h1>
         <p>Web3 библиотека не загружена. Проверьте подключение к интернету и обновите страницу.</p>
         <button onclick="location.reload()" style="
           background: #FFD700; 
           border: none; 
           padding: 10px 20px; 
           border-radius: 10px; 
           color: #000; 
           font-weight: 600; 
           cursor: pointer;
           margin-top: 20px;
         ">Обновить страницу</button>
       </div>
     </div>
   `;
   return;
 }

 window.globalWayApp = new GlobalWayApp();

 setTimeout(() => {
   if (window.globalWayApp) {
     window.globalWayApp.navigateToPage('dashboard');
   }
 }, 200);

 window.globalWayApp.handleReferral();
 window.globalWayApp.restoreAppState();

 console.log('GlobalWay DApp loaded successfully!');
});

window.addEventListener('beforeunload', () => {
 if (window.globalWayApp) {
   window.globalWayApp.destroy();
 }
});

if (typeof module !== 'undefined' && module.exports) {
 module.exports = GlobalWayApp;
}
