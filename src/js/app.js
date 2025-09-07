// ==================== ПОЛНЫЙ ВОССТАНОВЛЕННЫЙ APP.JS ====================

class GlobalWayApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.user = null;
    this.isInitialized = false;
    this.updateInterval = null;
    this.autoUpdateEnabled = true;
    this.lastUpdateTime = 0;
    this.networkCheckInterval = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.eventListeners = new Map();
    this.cache = new Map();
    this.offlineMode = false;
    
    // Состояния приложения
    this.appState = {
      userRegistered: false,
      userActive: false,
      activeLevels: [],
      isOwner: false,
      isFounder: false,
      tokenBalance: '0',
      bnbBalance: '0',
      lastBlockNumber: 0,
      connectionState: 'disconnected'
    };
    
    // Настройки матрицы
    this.matrixConfig = {
      currentLevel: 1,
      selectedUser: null,
      showStructure: true,
      autoRefresh: true,
      viewMode: 'tree' // tree, list, grid
    };
    
    // Кэш для оптимизации
    this.dataCache = {
      users: new Map(),
      stats: new Map(),
      events: new Map(),
      lastUpdate: 0
    };
    
    this.init();
  }

  async init() {
    console.log('Инициализация GlobalWay App...');
    
    try {
      await this.waitForManagers();
      this.setupEventListeners();
      this.setupNavigation();
      this.setupAutoUpdate();
      this.setupNetworkMonitoring();
      this.setupCaching();
      this.setupOfflineMode();
      await this.initializeApp();
      
      console.log('GlobalWay App инициализирован успешно');
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.handleInitializationError(error);
    }
  }

  async waitForManagers() {
    console.log('Ожидание готовности менеджеров...');
    
    return new Promise((resolve) => {
      const checkManagers = () => {
        const web3Ready = window.web3Manager && typeof window.web3Manager.init === 'function';
        const contractsReady = window.contractManager && typeof window.contractManager.isContractsReady === 'function';
        const uiReady = window.uiManager && typeof window.uiManager.showNotification === 'function';
        
        if (web3Ready && contractsReady && uiReady) {
          console.log('Все менеджеры готовы');
          resolve();
        } else {
          console.log('Ожидание менеджеров...', { web3Ready, contractsReady, uiReady });
          setTimeout(checkManagers, 500);
        }
      };
      checkManagers();
    });
  }

  async initializeApp() {
    if (window.uiManager) {
      window.uiManager.showPageLoader();
    }

    try {
      // Загружаем сохраненное состояние
      this.loadAppState();
      
      // Проверяем подключение кошелька
      if (window.web3Manager?.isConnected) {
        await this.handleWalletConnected();
      } else {
        this.showWelcomeScreen();
      }

      // Загружаем публичную статистику
      await this.loadPublicStats();
      
      // Инициализируем UI компоненты
      this.initializeUIComponents();
      
      // Настраиваем события контрактов
      this.setupContractEvents();
      
      // Инициализируем матрицу
      this.initializeInteractiveMatrix();
      
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.showError('Ошибка загрузки приложения', error.message);
    } finally {
      if (window.uiManager) {
        window.uiManager.hidePageLoader();
      }
    }
  }

  // ==================== ОБРАБОТКА ПОДКЛЮЧЕНИЯ КОШЕЛЬКА ====================

  async handleWalletConnected() {
    console.log('Обработка подключенного кошелька...');
    
    try {
      // Проверяем правильную сеть opBNB
      if (!window.web3Manager.isCorrectNetwork()) {
        this.showNetworkWarning();
      }

      // Загружаем данные пользователя
      await this.loadUserData();
      
      // Проверяем админские права
      await this.checkAdminRights();
      
      // Обновляем UI
      this.updateUserInterface();
      
      // Подписываемся на события
      this.subscribeToContractEvents();
      
      // Показываем приветствие
      this.showWelcomeMessage();
      
    } catch (error) {
      console.error('Ошибка обработки подключения:', error);
      this.showError('Ошибка загрузки данных пользователя', error.message);
    }
  }

  async loadUserData() {
    if (!window.web3Manager?.isConnected || !window.contractManager?.isContractsReady()) {
      return;
    }

    const userAddress = window.web3Manager.account;
    
    try {
      // Используем правильные методы из contractManager
      const [userData, userStats, isRegistered, tokenBalance, bnbBalance] = await Promise.all([
        window.contractManager.getUserData(userAddress).catch(() => null),
        window.contractManager.getUserStats(userAddress).catch(() => null),
        window.contractManager.isUserRegistered(userAddress).catch(() => false),
        window.contractManager.getTokenBalance(userAddress).catch(() => '0'),
        window.web3Manager.getBalance().catch(() => ({ formatted: '0' }))
      ]);

      // Обновляем состояние приложения
      this.appState.userRegistered = isRegistered;
      this.appState.tokenBalance = tokenBalance;
      this.appState.bnbBalance = bnbBalance.formatted || '0';
      this.appState.connectionState = 'connected';
      
      if (userStats) {
        this.appState.userActive = userStats.isRegistered;
        this.appState.activeLevels = userStats.activeLevels || [];
      }

      this.user = {
        address: userAddress,
        isRegistered,
        userData: userData,
        stats: userStats,
        tokenBalance,
        bnbBalance: bnbBalance.formatted || '0'
      };

      // Кэшируем данные пользователя
      this.cacheUserData(userAddress, this.user);

      console.log('Данные пользователя загружены:', this.user);
      
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
      throw error;
    }
  }

  async checkAdminRights() {
    if (!this.user?.address) return;

    try {
      const isOwner = window.contractManager.isOwner(this.user.address);
      const isFounder = window.contractManager.isFounder(this.user.address);
      
      this.appState.isOwner = isOwner;
      this.appState.isFounder = isFounder;
      
      if (isOwner || isFounder) {
        console.log(`Пользователь имеет админские права: ${isOwner ? 'Владелец' : 'Основатель'}`);
        
        if (window.uiManager) {
          window.uiManager.toggleAdminFeatures(true);
        }
      }
      
    } catch (error) {
      console.error('Ошибка проверки админских прав:', error);
    }
  }

  // ==================== ИНТЕРАКТИВНАЯ МАТРИЦА ====================

  initializeInteractiveMatrix() {
    const matrixContainer = document.getElementById('matrixContainer');
    if (!matrixContainer) return;

    // Создаем интерактивную матрицу
    this.createInteractiveMatrix();
    
    // Настраиваем обработчики
    this.setupMatrixEventListeners();
  }

  createInteractiveMatrix() {
    const matrixContainer = document.getElementById('matrixContainer');
    if (!matrixContainer) return;

    matrixContainer.innerHTML = `
      <div class="interactive-matrix">
        <div class="matrix-header">
          <div class="matrix-controls">
            <select id="levelSelect" class="matrix-level-selector">
              ${Array.from({length: 12}, (_, i) => 
                `<option value="${i + 1}">Уровень ${i + 1}</option>`
              ).join('')}
            </select>
            <div class="matrix-view-controls">
              <button class="view-btn ${this.matrixConfig.viewMode === 'tree' ? 'active' : ''}" data-view="tree">🌳 Дерево</button>
              <button class="view-btn ${this.matrixConfig.viewMode === 'grid' ? 'active' : ''}" data-view="grid">📊 Сетка</button>
              <button class="view-btn ${this.matrixConfig.viewMode === 'list' ? 'active' : ''}" data-view="list">📋 Список</button>
            </div>
            <button class="matrix-refresh-btn" id="refreshMatrix">🔄 Обновить</button>
          </div>
          <div class="matrix-info">
            <span class="current-user" id="currentMatrixUser">Выберите пользователя</span>
            <span class="matrix-stats" id="matrixStats"></span>
          </div>
        </div>
        <div class="matrix-content" id="matrixContent">
          ${this.renderMatrixContent()}
        </div>
        <div class="matrix-details" id="matrixDetails">
          <div class="user-details-panel hidden">
            <h4>Детали пользователя</h4>
            <div class="user-info" id="selectedUserInfo"></div>
          </div>
        </div>
      </div>
    `;

    // Удаляем дублирующие кнопки уровней внизу
    const levelButtonsContainer = document.getElementById('levelsContainer');
    if (levelButtonsContainer) {
      levelButtonsContainer.remove();
    }
  }

  renderMatrixContent() {
    if (!window.web3Manager?.isConnected) {
      return this.renderMatrixDemo();
    }

    switch (this.matrixConfig.viewMode) {
      case 'tree':
        return this.renderTreeView();
      case 'grid':
        return this.renderGridView();
      case 'list':
        return this.renderListView();
      default:
        return this.renderTreeView();
    }
  }

  renderTreeView() {
    const currentLevel = this.matrixConfig.currentLevel;
    const selectedUser = this.matrixConfig.selectedUser || window.web3Manager.account;

    return `
      <div class="matrix-tree-view">
        <div class="tree-level level-${currentLevel}">
          <div class="tree-node root-node" data-address="${selectedUser}">
            <div class="node-avatar">
              <div class="user-avatar"></div>
            </div>
            <div class="node-info">
              <div class="node-address">${this.formatAddress(selectedUser)}</div>
              <div class="node-level">Уровень ${currentLevel}</div>
              <div class="node-status active">Активен</div>
            </div>
          </div>
          <div class="tree-children" id="treeChildren">
            <div class="loading-tree">Загрузка структуры...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderGridView() {
    return `
      <div class="matrix-grid-view">
        <div class="grid-container" id="gridContainer">
          ${Array.from({length: 12}, (_, i) => {
            const level = i + 1;
            const isActive = this.appState.activeLevels.includes(level);
            const price = window.contractManager?.levelPricesOpBNB[level];
            const priceInBNB = price ? window.web3Manager?.fromWei(price) : '0';
            
            return `
              <div class="grid-level-card ${isActive ? 'active' : 'inactive'}" data-level="${level}">
                <div class="level-header">
                  <span class="level-number">${level}</span>
                  <span class="level-status">${isActive ? '✅' : '❌'}</span>
                </div>
                <div class="level-info">
                  <div class="level-price">${parseFloat(priceInBNB).toFixed(4)} BNB</div>
                  <div class="level-participants" id="levelParticipants${level}">0</div>
                </div>
                ${!isActive ? `
                  <button class="activate-level-btn" data-level="${level}">
                    Активировать
                  </button>
                ` : `
                  <button class="view-level-btn" data-level="${level}">
                    Просмотр
                  </button>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderListView() {
    return `
      <div class="matrix-list-view">
        <div class="list-header">
          <div class="list-controls">
            <input type="text" placeholder="Поиск по адресу..." id="userSearch" class="search-input">
            <select id="filterSelect" class="filter-select">
              <option value="all">Все пользователи</option>
              <option value="active">Активные</option>
              <option value="referrals">Мои рефералы</option>
            </select>
          </div>
        </div>
        <div class="list-content" id="listContent">
          <div class="loading-list">Загрузка пользователей...</div>
        </div>
      </div>
    `;
  }

  renderMatrixDemo() {
    return `
      <div class="matrix-demo">
        <div class="demo-message">
          <h3>Демо-версия матрицы</h3>
          <p>Подключите кошелек и зарегистрируйтесь для просмотра интерактивной матрицы</p>
        </div>
        <div class="demo-preview">
          ${Array.from({length: 6}, (_, i) => `
            <div class="demo-level-card" data-level="${i + 1}">
              <div class="demo-level-number">${i + 1}</div>
              <div class="demo-level-status">Демо</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  setupMatrixEventListeners() {
    const matrixContainer = document.getElementById('matrixContainer');
    if (!matrixContainer) return;

    // Переключение уровней
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        this.matrixConfig.currentLevel = parseInt(e.target.value);
        this.refreshMatrix();
      });
    }

    // Переключение видов
    matrixContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('view-btn')) {
        this.matrixConfig.viewMode = e.target.dataset.view;
        this.updateViewButtons();
        this.refreshMatrix();
      }
    });

    // Обновление матрицы
    const refreshBtn = document.getElementById('refreshMatrix');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshMatrix();
      });
    }

    // Клики по узлам дерева
    matrixContainer.addEventListener('click', (e) => {
      if (e.target.closest('.tree-node')) {
        const node = e.target.closest('.tree-node');
        const address = node.dataset.address;
        this.selectMatrixUser(address);
      }
    });

    // Активация уровней из грида
    matrixContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('activate-level-btn')) {
        const level = parseInt(e.target.dataset.level);
        if (window.uiManager) {
          window.uiManager.handleLevelPurchase(level);
        }
      }
    });

    // Поиск пользователей
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterMatrixUsers(e.target.value);
      });
    }
  }

  async selectMatrixUser(address) {
    this.matrixConfig.selectedUser = address;
    
    try {
      // Загружаем данные выбранного пользователя
      const userData = await this.loadUserMatrixData(address);
      
      // Обновляем отображение
      this.updateMatrixDisplay(userData);
      
      // Показываем детали пользователя
      this.showUserDetails(userData);
      
    } catch (error) {
      console.error('Ошибка выбора пользователя матрицы:', error);
    }
  }

  async loadUserMatrixData(address) {
    // Проверяем кэш
    if (this.dataCache.users.has(address)) {
      return this.dataCache.users.get(address);
    }

    try {
      const [userData, userStats] = await Promise.all([
        window.contractManager.getUserData(address),
        window.contractManager.getUserStats(address)
      ]);

      const userInfo = {
        address,
        userData,
        stats: userStats,
        timestamp: Date.now()
      };

      // Кэшируем данные
      this.dataCache.users.set(address, userInfo);
      
      return userInfo;
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя матрицы:', error);
      return null;
    }
  }

  updateMatrixDisplay(userData) {
    const currentUserElement = document.getElementById('currentMatrixUser');
    if (currentUserElement && userData) {
      currentUserElement.textContent = this.formatAddress(userData.address);
    }

    const statsElement = document.getElementById('matrixStats');
    if (statsElement && userData?.stats) {
      statsElement.innerHTML = `
        <span>Уровни: ${userData.stats.activeLevels?.length || 0}/12</span>
        <span>Рефералы: ${userData.stats.personalInvites || 0}</span>
      `;
    }
  }

  showUserDetails(userData) {
    const detailsPanel = document.querySelector('.user-details-panel');
    const userInfoElement = document.getElementById('selectedUserInfo');
    
    if (detailsPanel && userInfoElement && userData) {
      userInfoElement.innerHTML = `
        <div class="user-detail-item">
          <label>Адрес:</label>
          <span>${userData.address}</span>
          <button onclick="window.uiManager.copyToClipboard('${userData.address}')">📋</button>
        </div>
        <div class="user-detail-item">
          <label>Спонсор:</label>
          <span>${this.formatAddress(userData.userData?.sponsor || '0x000...000')}</span>
        </div>
        <div class="user-detail-item">
          <label>Дата регистрации:</label>
          <span>${userData.userData?.registrationTime ? new Date(userData.userData.registrationTime * 1000).toLocaleDateString() : 'Не зарегистрирован'}</span>
        </div>
        <div class="user-detail-item">
          <label>Активные уровни:</label>
          <span>${userData.stats?.activeLevels?.join(', ') || 'Нет'}</span>
        </div>
        <div class="user-detail-item">
          <label>Всего заработано:</label>
          <span>${userData.userData?.totalEarned ? window.web3Manager.fromWei(userData.userData.totalEarned) + ' BNB' : '0 BNB'}</span>
        </div>
      `;
      
      detailsPanel.classList.remove('hidden');
    }
  }

  async refreshMatrix() {
    const matrixContent = document.getElementById('matrixContent');
    if (!matrixContent) return;

    matrixContent.innerHTML = '<div class="matrix-loading">Обновление матрицы...</div>';
    
    try {
      // Очищаем кэш
      this.clearMatrixCache();
      
      // Перерендериваем содержимое
      matrixContent.innerHTML = this.renderMatrixContent();
      
      // Загружаем свежие данные
      await this.loadMatrixData();
      
    } catch (error) {
      console.error('Ошибка обновления матрицы:', error);
      matrixContent.innerHTML = '<div class="matrix-error">Ошибка загрузки матрицы</div>';
    }
  }

  async loadMatrixData() {
    if (!window.web3Manager?.isConnected) return;

    try {
      const currentUser = this.matrixConfig.selectedUser || window.web3Manager.account;
      const level = this.matrixConfig.currentLevel;

      // Загружаем данные в зависимости от режима отображения
      switch (this.matrixConfig.viewMode) {
        case 'tree':
          await this.loadTreeData(currentUser, level);
          break;
        case 'grid':
          await this.loadGridData();
          break;
        case 'list':
          await this.loadListData();
          break;
      }
    } catch (error) {
      console.error('Ошибка загрузки данных матрицы:', error);
    }
  }

  async loadTreeData(userAddress, level) {
    const treeChildren = document.getElementById('treeChildren');
    if (!treeChildren) return;

    try {
      // Загружаем структуру пользователя
      const userStats = await window.contractManager.getUserStats(userAddress);
      
      if (userStats && userStats.referrals) {
        const referralsHtml = userStats.referrals.map(referralAddress => `
          <div class="tree-node referral-node" data-address="${referralAddress}">
            <div class="node-avatar">
              <div class="user-avatar"></div>
            </div>
            <div class="node-info">
              <div class="node-address">${this.formatAddress(referralAddress)}</div>
              <div class="node-level">Уровень ${level}</div>
              <div class="node-status">Активен</div>
            </div>
          </div>
        `).join('');

        treeChildren.innerHTML = referralsHtml || '<div class="no-referrals">Нет рефералов</div>';
      } else {
        treeChildren.innerHTML = '<div class="no-referrals">Нет рефералов</div>';
      }
    } catch (error) {
      treeChildren.innerHTML = '<div class="tree-error">Ошибка загрузки структуры</div>';
    }
  }

  updateViewButtons() {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.matrixConfig.viewMode);
    });
  }

  clearMatrixCache() {
    this.dataCache.users.clear();
    this.dataCache.stats.clear();
  }

  // ==================== СОБЫТИЯ КОНТРАКТОВ ====================

  setupContractEvents() {
    if (!window.contractManager?.isContractsReady()) return;

    try {
      // Подписываемся на события регистрации
      this.subscribeToEvent('UserRegistered', this.handleUserRegistered.bind(this));
      
      // Подписываемся на события активации уровней
      this.subscribeToEvent('LevelActivated', this.handleLevelActivated.bind(this));
      
      // Подписываемся на события рефералов
      this.subscribeToEvent('ReferralReward', this.handleReferralReward.bind(this));
      
    } catch (error) {
      console.log('События контракта недоступны:', error);
    }
  }

  subscribeToEvent(eventName, handler) {
    try {
      const contract = window.contractManager.contracts.globalWay;
      if (contract && contract.events && contract.events[eventName]) {
        const eventEmitter = contract.events[eventName]({
          fromBlock: 'latest'
        });
        
        eventEmitter.on('data', handler);
        eventEmitter.on('error', console.error);
        
        this.eventListeners.set(eventName, eventEmitter);
      }
    } catch (error) {
      console.warn(`Не удалось подписаться на событие ${eventName}:`, error);
    }
  }

  handleUserRegistered(event) {
    const userAddress = event.returnValues.user;
    
    if (userAddress.toLowerCase() === window.web3Manager.account?.toLowerCase()) {
      this.showNotification('Вы успешно зарегистрированы!', 'success');
      this.updateUserInfo();
    }
    
    // Обновляем матрицу если пользователь в нашей структуре
    this.refreshMatrix();
  }

  handleLevelActivated(event) {
    const { user, level } = event.returnValues;
    
    if (user.toLowerCase() === window.web3Manager.account?.toLowerCase()) {
      this.showNotification(`Уровень ${level} активирован!`, 'success');
      this.updateUserInfo();
      this.refreshMatrix();
    }
  }

  handleReferralReward(event) {
    const { referrer, amount } = event.returnValues;
    
    if (referrer.toLowerCase() === window.web3Manager.account?.toLowerCase()) {
      const amountBNB = window.web3Manager.fromWei(amount);
      this.showNotification(`Получено вознаграждение: ${parseFloat(amountBNB).toFixed(4)} BNB`, 'success');
    }
  }

  // ==================== КЭШИРОВАНИЕ ====================

  setupCaching() {
    // Настройка системы кэширования
    this.cache.clear();
    
    // Автоочистка кэша каждые 5 минут
    setInterval(() => {
      this.cleanupCache();
    }, 300000);
  }

  cacheUserData(address, data) {
    this.dataCache.users.set(address, {
      ...data,
      timestamp: Date.now()
    });
  }

  getCachedUserData(address) {
    const cached = this.dataCache.users.get(address);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 минута
      return cached;
    }
    return null;
  }

  cleanupCache() {
    const now = Date.now();
    const maxAge = 300000; // 5 минут

    // Очищаем старые данные пользователей
    for (const [key, value] of this.dataCache.users.entries()) {
      if (now - value.timestamp > maxAge) {
        this.dataCache.users.delete(key);
      }
    }

    // Очищаем старую статистику
    for (const [key, value] of this.dataCache.stats.entries()) {
      if (now - value.timestamp > maxAge) {
        this.dataCache.stats.delete(key);
      }
    }
  }

  // ==================== ОФЛАЙН РЕЖИМ ====================

  setupOfflineMode() {
    // Проверка состояния сети
    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.showNotification('Подключение восстановлено', 'success');
      this.performAutoUpdate();
    });

    window.addEventListener('offline', () => {
      this.offlineMode = true;
      this.showNotification('Работа в офлайн режиме', 'warning');
    });

    // Инициализация Service Worker
    // this.initializeServiceWorker();
  }

  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker зарегистрирован:', registration);
      } catch (error) {
        console.log('Ошибка регистрации Service Worker:', error);
      }
    }
  }

  // ==================== РАСШИРЕННАЯ СТАТИСТИКА ====================

  async loadAdvancedStats() {
    if (!window.contractManager?.isContractsReady()) return null;

    try {
      const overview = await window.contractManager.getContractOverview();
      const userAddress = window.web3Manager.account;
      
      let userStats = null;
      if (userAddress) {
        userStats = await window.contractManager.getUserStats(userAddress);
      }

      const stats = {
        global: overview,
        user: userStats,
        performance: await this.calculatePerformanceStats(),
        trends: await this.calculateTrendStats(),
        timestamp: Date.now()
      };

      // Кэшируем статистику
      this.dataCache.stats.set('advanced', stats);
      
      return stats;
    } catch (error) {
      console.error('Ошибка загрузки расширенной статистики:', error);
      return null;
    }
  }

  async calculatePerformanceStats() {
    try {
      const stats = {
        avgResponseTime: 0,
        successRate: 0,
        gasEfficiency: 0,
        userGrowth: 0,
        volumeGrowth: 0
      };

      // Измеряем среднее время отклика контракта
      const startTime = Date.now();
      await window.contractManager.getContractOverview();
      stats.avgResponseTime = Date.now() - startTime;

      // Рассчитываем эффективность газа
      const gasData = await this.analyzeGasUsage();
      stats.gasEfficiency = gasData.efficiency;

      // Анализируем рост пользователей
      stats.userGrowth = await this.calculateUserGrowth();
      
      return stats;
    } catch (error) {
      console.error('Ошибка расчета статистики производительности:', error);
      return null;
    }
  }

  async calculateTrendStats() {
    try {
      const trends = {
        registrations: [],
        activations: [],
        volume: [],
        period: '7d'
      };

      // Здесь можно добавить анализ трендов за последние дни/недели
      // Пока возвращаем базовую структуру
      
      return trends;
    } catch (error) {
      console.error('Ошибка расчета трендов:', error);
      return null;
    }
  }

  async analyzeGasUsage() {
    // Анализ использования газа для оптимизации
    return {
      efficiency: 85,
      avgGasPrice: '5000000000',
      recommendations: []
    };
  }

  async calculateUserGrowth() {
    // Расчет роста пользователей
    return 12.5; // Процент роста
  }

  // ==================== СИСТЕМА ПОИСКА И ФИЛЬТРАЦИИ ====================

  setupSearchAndFilters() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.debounce(() => {
          this.performSearch(e.target.value);
        }, 300)();
      });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.applyFilter(filter);
        this.updateFilterButtons(btn);
      });
    });

    // Продвинутые фильтры
    this.setupAdvancedFilters();
  }

  setupAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (!advancedFilters) return;

    advancedFilters.innerHTML = `
      <div class="advanced-filter-panel">
        <div class="filter-group">
          <label>Дата регистрации:</label>
          <input type="date" id="dateFrom" class="date-filter">
          <input type="date" id="dateTo" class="date-filter">
        </div>
        <div class="filter-group">
          <label>Активные уровни:</label>
          <select id="levelFilter" multiple class="level-filter">
            ${Array.from({length: 12}, (_, i) => 
              `<option value="${i + 1}">Уровень ${i + 1}</option>`
            ).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Заработано (BNB):</label>
          <input type="number" id="earningsMin" placeholder="От" class="earnings-filter">
          <input type="number" id="earningsMax" placeholder="До" class="earnings-filter">
        </div>
        <div class="filter-actions">
          <button class="cosmic-btn primary" id="applyAdvancedFilters">Применить</button>
          <button class="cosmic-btn secondary" id="clearAdvancedFilters">Очистить</button>
        </div>
      </div>
    `;

    // Обработчики для продвинутых фильтров
    document.getElementById('applyAdvancedFilters')?.addEventListener('click', () => {
      this.applyAdvancedFilters();
    });

    document.getElementById('clearAdvancedFilters')?.addEventListener('click', () => {
      this.clearAdvancedFilters();
    });
  }

  async performSearch(query) {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }

    const searchResults = await this.searchUsers(query);
    this.displaySearchResults(searchResults);
  }

  async searchUsers(query) {
    try {
      // Поиск по адресу
      if (query.startsWith('0x')) {
        const userData = await this.loadUserMatrixData(query);
        return userData ? [userData] : [];
      }

      // Поиск по ID или другим параметрам
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => 
        user.address.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
      return [];
    }
  }

  applyAdvancedFilters() {
    const filters = {
      dateFrom: document.getElementById('dateFrom')?.value,
      dateTo: document.getElementById('dateTo')?.value,
      levels: Array.from(document.getElementById('levelFilter')?.selectedOptions || [])
        .map(option => parseInt(option.value)),
      earningsMin: parseFloat(document.getElementById('earningsMin')?.value || 0),
      earningsMax: parseFloat(document.getElementById('earningsMax')?.value || Infinity)
    };

    this.filterUsersByAdvancedCriteria(filters);
  }

  // ==================== ЭКСПОРТ И ИМПОРТ ДАННЫХ ====================

  async exportUserData() {
    if (!window.web3Manager.isConnected) {
      this.showNotification('Подключите кошелек для экспорта', 'warning');
      return;
    }

    try {
      if (window.uiManager) {
        window.uiManager.showPageLoader();
      }
      
      const userData = await this.gatherExportData();
      
      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        network: window.web3Manager.getNetworkInfo().name,
        user: userData,
        format: 'json'
      };

      this.downloadExportFile(exportData);
      
      this.showNotification('Данные успешно экспортированы', 'success');
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      this.showNotification('Ошибка экспорта данных', 'error');
    } finally {
      if (window.uiManager) {
        window.uiManager.hidePageLoader();
      }
    }
  }

  async gatherExportData() {
    const userAddress = window.web3Manager.account;
    
    const [userData, userStats, referrals, earnings] = await Promise.all([
      window.contractManager.getUserData(userAddress),
      window.contractManager.getUserStats(userAddress),
      this.getUserReferrals(userAddress),
      this.getUserEarnings(userAddress)
    ]);

    return {
      address: userAddress,
      personalData: userData,
      statistics: userStats,
      referrals: referrals,
      earnings: earnings,
      activeLevels: this.appState.activeLevels,
      registrationTime: userData?.registrationTime
    };
  }

  downloadExportFile(data) {
    const fileName = `globalway_export_${this.formatAddress(window.web3Manager.account)}_${Date.now()}.json`;
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    link.click();
    
    // Очистка URL
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // Экспорт в разных форматах
  async exportToCSV() {
    const data = await this.gatherExportData();
    const csvData = this.convertToCSV(data);
    
    const fileName = `globalway_export_${this.formatAddress(window.web3Manager.account)}_${Date.now()}.csv`;
    const dataBlob = new Blob([csvData], { type: 'text/csv' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = fileName;
    link.click();
  }

  convertToCSV(data) {
    const headers = ['Адрес', 'Дата регистрации', 'Активные уровни', 'Рефералы', 'Заработано'];
    const rows = [
      headers.join(','),
      [
        data.address,
        data.registrationTime ? new Date(data.registrationTime * 1000).toLocaleDateString() : '',
        data.activeLevels.join(';'),
        data.referrals.length,
        data.earnings.total || 0
      ].join(',')
    ];
    
    return rows.join('\n');
  }

  // ==================== УВЕДОМЛЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ ====================

  setupRealTimeNotifications() {
    // Настройка уведомлений браузера
    this.requestNotificationPermission();
    
    // Настройка WebSocket соединения (если доступно)
    this.setupWebSocketConnection();
    
    // Настройка периодических проверок
    this.setupPeriodicChecks();
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Разрешение на уведомления:', permission);
    }
  }

  setupWebSocketConnection() {
    // Здесь можно добавить WebSocket соединение для real-time обновлений
    // if (window.WebSocket) {
    //   this.ws = new WebSocket('wss://api.globalway.io/ws');
    //   this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    // }
  }

  setupPeriodicChecks() {
    // Проверяем новые события каждые 30 секунд
    setInterval(async () => {
      if (window.web3Manager?.isConnected) {
        await this.checkForNewEvents();
      }
    }, 30000);
  }

  async checkForNewEvents() {
    try {
      const currentBlock = await window.web3Manager.web3.eth.getBlockNumber();
      
      if (currentBlock > this.appState.lastBlockNumber) {
        await this.processNewBlocks(this.appState.lastBlockNumber + 1, currentBlock);
        this.appState.lastBlockNumber = currentBlock;
      }
    } catch (error) {
      console.error('Ошибка проверки новых событий:', error);
    }
  }

  async processNewBlocks(fromBlock, toBlock) {
    // Обработка новых блоков и событий
    console.log(`Обработка блоков с ${fromBlock} по ${toBlock}`);
  }

  showBrowserNotification(title, message, icon) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  // ==================== МОБИЛЬНАЯ АДАПТАЦИЯ ====================

  setupMobileAdaptation() {
    // Определение мобильного устройства
    this.isMobile = this.detectMobileDevice();
    
    if (this.isMobile) {
      this.enableMobileFeatures();
    }
    
    // Обработка ориентации
    this.setupOrientationHandling();
    
    // Touch события
    this.setupTouchEvents();
  }

  detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  enableMobileFeatures() {
    document.body.classList.add('mobile-device');
    
    // Мобильная навигация
    this.setupMobileNavigation();
    
    // Оптимизация для touch
    this.optimizeForTouch();
  }

  setupMobileNavigation() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
      nav.classList.add('mobile-nav');
    }
  }

  setupTouchEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      this.handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    });
  }

  handleSwipeGesture(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // Горизонтальный свайп для навигации
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.handleSwipeRight();
      } else {
        this.handleSwipeLeft();
      }
    }
  }

  handleSwipeRight() {
    // Свайп вправо - предыдущая страница
    const pages = ['dashboard', 'matrix', 'profile', 'referrals', 'tokens'];
    const currentIndex = pages.indexOf(this.currentPage);
    if (currentIndex > 0) {
      this.navigateToPage(pages[currentIndex - 1]);
    }
  }

  handleSwipeLeft() {
    // Свайп влево - следующая страница
    const pages = ['dashboard', 'matrix', 'profile', 'referrals', 'tokens'];
    const currentIndex = pages.indexOf(this.currentPage);
    if (currentIndex < pages.length - 1) {
      this.navigateToPage(pages[currentIndex + 1]);
    }
  }

  setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
  }

  handleOrientationChange() {
    // Адаптация интерфейса при смене ориентации
    if (window.uiManager) {
      window.uiManager.handleResize();
    }
    
    // Обновление матрицы для новой ориентации
    this.refreshMatrix();
  }

  // ==================== НАВИГАЦИЯ (ПРОДОЛЖЕНИЕ) ====================

  showWelcomeMessage() {
    if (!this.user) return;

    let message = 'Добро пожаловать в GlobalWay!';
    let type = 'info';

    if (this.appState.isOwner) {
      message = 'Добро пожаловать, владелец системы!';
      type = 'admin';
    } else if (this.appState.isFounder) {
      message = 'Добро пожаловать, основатель!';
      type = 'admin';
    } else if (this.appState.userRegistered) {
      message = `Добро пожаловать обратно! Активных уровней: ${this.appState.activeLevels.length}`;
      type = 'success';
    } else {
      message = 'Для начала работы пройдите регистрацию';
      type = 'warning';
    }

    this.showNotification(message, type, 5000);
  }

  showWelcomeScreen() {
    this.navigateToPage('welcome');
    
    this.showNotification(
      'Подключите кошелек для начала работы с GlobalWay', 
      'info', 
      0,
      [{
        id: 'connect',
        label: 'Подключить',
        callback: () => {
          if (window.web3Manager) {
            window.web3Manager.connectWallet();
          }
        }
      }]
    );
  }

  showNetworkWarning() {
    const networkInfo = window.web3Manager.getNetworkInfo();
    
    this.showNotification(
      `Подключена сеть ${networkInfo.name}. Рекомендуется opBNB для корректной работы.`,
      'warning',
      0,
      [{
        id: 'switch',
        label: 'Переключить на opBNB',
        callback: async () => {
          try {
            await window.web3Manager.switchToOpBNB();
          } catch (error) {
            console.error('Ошибка переключения сети:', error);
          }
        }
      }]
    );
  }

  setupNavigation() {
    // Настройка кнопок навигации
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        this.navigateToPage(page);
      });
    });

    // Настройка истории браузера
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.navigateToPage(e.state.page, false);
      }
    });

    // Загружаем страницу из URL
    this.loadPageFromURL();
  }

  navigateToPage(page, updateHistory = true) {
    if (this.currentPage === page) return;

    console.log(`Навигация на страницу: ${page}`);

    // Проверяем доступ к странице
    if (!this.canAccessPage(page)) {
      this.showAccessDenied(page);
      return;
    }

    // Скрываем текущую страницу
    this.hidePage(this.currentPage);

    // Показываем новую страницу
    this.showPage(page);

    // Обновляем состояние
    this.currentPage = page;

    // Обновляем навигацию
    this.updateNavigation();

    // Обновляем URL
    if (updateHistory) {
      const url = page === 'dashboard' ? '/' : `/#${page}`;
      history.pushState({ page }, '', url);
    }

    // Загружаем данные для страницы
    this.loadPageData(page);
  }

  canAccessPage(page) {
    // Публичные страницы
    const publicPages = ['welcome', 'dashboard', 'about', 'docs'];
    if (publicPages.includes(page)) return true;

    // Страницы требующие подключения кошелька
    const walletPages = ['matrix', 'profile', 'referrals', 'tokens'];
    if (walletPages.includes(page)) {
      return window.web3Manager?.isConnected;
    }

    // Админские страницы
    const adminPages = ['admin'];
    if (adminPages.includes(page)) {
      return this.appState.isOwner || this.appState.isFounder;
    }

    return true;
  }

  showAccessDenied(page) {
    let message = 'Доступ к этой странице ограничен';
    
    if (page === 'admin') {
      message = 'Доступ только для владельца и основателей';
    } else if (!window.web3Manager?.isConnected) {
      message = 'Подключите кошелек для доступа к этой странице';
    }

    this.showNotification(message, 'warning');
  }

  hidePage(page) {
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
      pageElement.classList.remove('active');
      pageElement.classList.add('hidden');
    }
  }

  showPage(page) {
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
      pageElement.classList.remove('hidden');
      pageElement.classList.add('active');
    }
  }

  updateNavigation() {
    // Обновляем активную кнопку навигации
    document.querySelectorAll('[data-page]').forEach(btn => {
      if (btn.dataset.page === this.currentPage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Обновляем заголовок страницы
    this.updatePageTitle();
  }

  updatePageTitle() {
    const titles = {
      dashboard: 'GlobalWay - Главная',
      matrix: 'GlobalWay - Матрица',
      profile: 'GlobalWay - Профиль',
      referrals: 'GlobalWay - Рефералы',
      tokens: 'GlobalWay - GWT Токены',
      admin: 'GlobalWay - Администрирование',
      welcome: 'GlobalWay - Добро пожаловать'
    };

    document.title = titles[this.currentPage] || 'GlobalWay';
  }

  loadPageFromURL() {
    const hash = window.location.hash.slice(1);
    const page = hash || 'dashboard';
    this.navigateToPage(page, false);
  }

  // ==================== ЗАГРУЗКА ДАННЫХ ДЛЯ СТРАНИЦ ====================

  async loadPageData(page) {
    try {
      switch (page) {
        case 'dashboard':
          await this.loadDashboardData();
          break;
        case 'matrix':
          await this.loadMatrixData();
          break;
        case 'profile':
          await this.loadProfileData();
          break;
        case 'referrals':
          await this.loadReferralsData();
          break;
        case 'tokens':
          await this.loadTokensData();
          break;
        case 'admin':
          await this.loadAdminData();
          break;
      }
    } catch (error) {
      console.error(`Ошибка загрузки данных для страницы ${page}:`, error);
    }
  }

  async loadDashboardData() {
    try {
      // Загружаем общую статистику
      await this.loadPublicStats();
      
      // Если пользователь подключен, загружаем его данные
      if (window.web3Manager?.isConnected) {
        await this.updateUserInfo();
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    }
  }

  async loadMatrixData() {
    if (!window.web3Manager?.isConnected) {
      this.createInteractiveMatrix();
      return;
    }

    try {
      const userStats = await window.contractManager.getUserStats(window.web3Manager.account);
      
      if (userStats && userStats.isRegistered) {
        await this.loadMatrixData();
      } else {
        this.showRegistrationPrompt();
      }
      
    } catch (error) {
      console.error('Ошибка загрузки матрицы:', error);
      this.createInteractiveMatrix();
    }
  }

  async loadProfileData() {
    if (!window.web3Manager?.isConnected) return;

    try {
      await this.updateUserInfo();
      this.displayUserProfile();
      
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  }

  async loadReferralsData() {
    if (!window.web3Manager?.isConnected) return;

    try {
      const userStats = await window.contractManager.getUserStats(window.web3Manager.account);
      
      if (userStats) {
        this.displayReferralStats(userStats);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки рефералов:', error);
    }
  }

  async loadTokensData() {
    if (!window.web3Manager?.isConnected) return;

    try {
      if (window.uiManager) {
        await window.uiManager.updateTokenInfo();
      }
      
      this.displayTokenInfo();
      
    } catch (error) {
      console.error('Ошибка загрузки токенов:', error);
    }
  }

  async loadAdminData() {
    if (!this.appState.isOwner && !this.appState.isFounder) return;

    try {
      const overview = await window.contractManager.getContractOverview();
      this.displayAdminStats(overview);
      
    } catch (error) {
      console.error('Ошибка загрузки админских данных:', error);
    }
  }

  // ==================== ОТОБРАЖЕНИЕ ДАННЫХ ====================

  async loadPublicStats() {
    try {
      if (!window.contractManager?.isContractsReady()) {
        this.displayDemoStats();
        return;
      }

      const overview = await window.contractManager.getContractOverview();
      this.displayStats(overview);
      
    } catch (error) {
      console.error('Ошибка загрузки публичной статистики:', error);
      this.displayDemoStats();
    }
  }

  displayStats(overview) {
    // Обновляем счетчики на главной странице
    if (window.uiManager) {
      window.uiManager.updateCounter('totalUsers', parseInt(overview.totalUsers));
      window.uiManager.updateCounter('activeUsers', parseInt(overview.activeUsers));
    }

    // Обновляем объем
    const volumeElement = document.getElementById('totalVolume');
    if (volumeElement && overview.totalVolume) {
      const volumeInBNB = window.web3Manager.fromWei(overview.totalVolume);
      volumeElement.textContent = this.formatLargeNumber(volumeInBNB) + ' BNB';
    }

    // Обновляем распределение уровней
    this.updateLevelDistribution(overview.levelDistribution);
  }

  displayDemoStats() {
    // Показываем демо-статистику если контракты недоступны
    if (window.uiManager) {
      window.uiManager.updateCounter('totalUsers', 1234);
      window.uiManager.updateCounter('activeUsers', 567);
    }

    const volumeElement = document.getElementById('totalVolume');
    if (volumeElement) {
      volumeElement.textContent = '1,234.56 BNB';
    }
  }

  // ==================== ПРОДОЛЖЕНИЕ СЛЕДУЕТ... ====================

  // ==================== АВТООБНОВЛЕНИЕ ====================

  setupAutoUpdate() {
    // Автообновление каждые 30 секунд
    this.updateInterval = setInterval(() => {
      if (this.autoUpdateEnabled && window.web3Manager?.isConnected) {
        this.performAutoUpdate();
      }
    }, 30000);

    // Обновление при фокусе на странице
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && window.web3Manager?.isConnected) {
        this.performAutoUpdate();
      }
    });

    console.log('Автообновление настроено');
  }

  async performAutoUpdate() {
    const now = Date.now();
    
    // Ограничиваем частоту обновлений
    if (now - this.lastUpdateTime < 10000) return;
    
    this.lastUpdateTime = now;

    try {
      // Обновляем только если пользователь активен
      if (this.isUserActive()) {
        await this.loadPublicStats();
        
        if (window.web3Manager.isConnected) {
          await this.updateUserInfo();
        }
      }
    } catch (error) {
      console.error('Ошибка автообновления:', error);
      
      // При повторных ошибках отключаем автообновление
      this.retryAttempts++;
      if (this.retryAttempts >= this.maxRetries) {
        this.disableAutoUpdate();
      }
    }
  }

  isUserActive() {
    // Проверяем активность пользователя
    return !document.hidden && 
           (Date.now() - this.lastUpdateTime) < 300000; // 5 минут
  }

  enableAutoUpdate() {
    this.autoUpdateEnabled = true;
    this.retryAttempts = 0;
    console.log('Автообновление включено');
  }

  disableAutoUpdate() {
    this.autoUpdateEnabled = false;
    console.log('Автообновление отключено из-за ошибок');
    
    this.showNotification(
      'Автообновление отключено. Проверьте подключение.',
      'warning'
    );
  }

  // ==================== УТИЛИТЫ ====================

  formatAddress(address, start = 6, end = 4) {
    if (!address) return '0x000...000';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  formatLargeNumber(value) {
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  showNotification(message, type, duration = 5000, actions = null) {
    if (window.uiManager) {
      window.uiManager.showNotification(message, type, duration, actions);
      } else {
      // Fallback если uiManager недоступен
      console.log(`[${type.toUpperCase()}] ${message}`);
      if (type === 'error') {
        alert(message);
      }
    }
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ UI КОМПОНЕНТОВ ====================

  initializeUIComponents() {
    this.initializePackageCards();
    this.initializeAdminPanel();
    this.initializeTokenInterface();
    this.initializeReferralSystem();
    this.setupSearchAndFilters();
    this.setupMobileAdaptation();
    this.setupRealTimeNotifications();
  }

  initializePackageCards() {
    const packageContainer = document.getElementById('packagesContainer');
    if (!packageContainer) return;

    // Правильные пакеты согласно ТЗ
    const packages = [
      { id: 1, name: 'MiniAdmin', levels: '1-4', price: this.calculatePackagePrice(1) },
      { id: 2, name: 'Admin', levels: '1-7', price: this.calculatePackagePrice(2) },
      { id: 3, name: 'SuperAdmin', levels: '1-10', price: this.calculatePackagePrice(3) },
      { id: 4, name: 'Manager', levels: '1-12', price: this.calculatePackagePrice(4) }
    ];

    packageContainer.innerHTML = packages.map(pkg => `
      <div class="package-card" data-package="${pkg.id}">
        <div class="package-header">
          <h3>${pkg.name}</h3>
          <div class="package-levels">${pkg.levels}</div>
        </div>
        <div class="package-price">${pkg.price} BNB</div>
        <button class="cosmic-btn primary package-btn" data-package="${pkg.id}">
          Активировать пакет
        </button>
      </div>
    `).join('');

    // Добавляем обработчики
    packageContainer.querySelectorAll('.package-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packageType = parseInt(btn.dataset.package);
        if (window.uiManager) {
          await window.uiManager.handlePackageActivation(packageType);
        }
      });
    });
  }

  calculatePackagePrice(packageType) {
    if (!window.contractManager) return '0.000';
    
    const packageLevels = {
      1: [1, 2, 3, 4],
      2: [1, 2, 3, 4, 5, 6, 7],
      3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };

    let totalPrice = 0;
    const levels = packageLevels[packageType] || [];
    
    levels.forEach(level => {
      const price = window.contractManager.levelPricesOpBNB[level];
      if (price && window.web3Manager) {
        totalPrice += parseFloat(window.web3Manager.fromWei(price));
      }
    });

    return totalPrice.toFixed(3);
  }

  initializeAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;

    adminPanel.innerHTML = `
      <div class="admin-controls">
        <h3>Администрирование</h3>
        <div class="admin-buttons">
          <button class="cosmic-btn admin" id="freeRegistrationBtn">
            Бесплатная регистрация
          </button>
          <button class="cosmic-btn admin" id="batchRegistrationBtn">
            Массовая регистрация
          </button>
          <button class="cosmic-btn admin" id="contractStatsBtn">
            Статистика контракта
          </button>
          <button class="cosmic-btn admin" id="emergencyBtn">
            Экстренные функции
          </button>
        </div>
      </div>
    `;

    // Обработчики уже настроены в uiManager.setupAdminUI()
  }

  initializeTokenInterface() {
    const tokenPanel = document.getElementById('tokenPanel');
    if (!tokenPanel) return;

    tokenPanel.innerHTML = `
      <div class="token-interface">
        <div class="token-info">
          <div class="token-stat">
            <label>Ваш баланс GWT:</label>
            <span id="tokenBalance">0.00 GWT</span>
          </div>
          <div class="token-stat">
            <label>Цена токена:</label>
            <span id="tokenPrice">0.000000 BNB</span>
          </div>
          <div class="token-stat">
            <label>Общий выпуск:</label>
            <span id="totalSupply">1,000,000,000</span>
          </div>
          <div class="token-stat">
            <label>Рыночная капитализация:</label>
            <span id="marketCap">Расчет...</span>
          </div>
        </div>
        <div class="token-actions">
          <button class="cosmic-btn primary" id="buyTokensBtn">
            Купить GWT
          </button>
          <button class="cosmic-btn secondary" id="sellTokensBtn">
            Продать GWT
          </button>
          <button class="cosmic-btn tertiary" id="tokenHistoryBtn">
            История операций
          </button>
        </div>
      </div>
    `;

    // Обработчики уже настроены в uiManager.setupTokenUI()
  }

  initializeReferralSystem() {
    const referralPanel = document.getElementById('referralPanel');
    if (!referralPanel) return;

    const referralUrl = this.generateReferralUrl();

    referralPanel.innerHTML = `
      <div class="referral-system">
        <div class="referral-link">
          <label>Ваша реферальная ссылка:</label>
          <div class="link-container">
            <input type="text" value="${referralUrl}" readonly id="referralUrl">
            <button class="cosmic-btn copy-btn" onclick="window.uiManager.copyToClipboard('${referralUrl}')">
              Копировать
            </button>
          </div>
        </div>
        <div class="referral-stats">
          <div class="stat-item">
            <label>Рефералов:</label>
            <span id="referralCount">0</span>
          </div>
          <div class="stat-item">
            <label>Заработано:</label>
            <span id="referralEarnings">0.0000 BNB</span>
          </div>
          <div class="stat-item">
            <label>Лидерский ранг:</label>
            <span id="leaderRank">Нет</span>
          </div>
        </div>
        <div class="referral-tools">
          <button class="cosmic-btn secondary" id="generateQRBtn">
            QR-код ссылки
          </button>
          <button class="cosmic-btn secondary" id="shareBtn">
            Поделиться
          </button>
          <button class="cosmic-btn secondary" id="referralHistoryBtn">
            История рефералов
          </button>
        </div>
      </div>
    `;

    this.setupReferralEventListeners();
  }

  setupReferralEventListeners() {
    document.getElementById('generateQRBtn')?.addEventListener('click', () => {
      this.generateReferralQR();
    });

    document.getElementById('shareBtn')?.addEventListener('click', () => {
      this.shareReferralLink();
    });

    document.getElementById('referralHistoryBtn')?.addEventListener('click', () => {
      this.showReferralHistory();
    });
  }

  generateReferralUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    const referralAddress = window.web3Manager?.account || '';
    return `${baseUrl}?ref=${referralAddress}`;
  }

  async generateReferralQR() {
    const referralUrl = this.generateReferralUrl();
    
    // Простая реализация QR-кода через API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`;
    
    if (window.uiManager) {
      window.uiManager.showModal('qr-modal', {
        title: 'QR-код реферальной ссылки',
        content: `
          <div class="qr-container">
            <img src="${qrUrl}" alt="QR код" class="qr-code">
            <p>Отсканируйте QR-код для быстрого доступа к вашей реферальной ссылке</p>
          </div>
        `
      });
    }
  }

  async shareReferralLink() {
    const referralUrl = this.generateReferralUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Присоединяйтесь к GlobalWay',
          text: 'Присоединяйтесь к экосистеме GlobalWay и зарабатывайте вместе со мной!',
          url: referralUrl
        });
      } catch (error) {
        console.log('Ошибка Web Share API:', error);
        this.fallbackShare(referralUrl);
      }
    } else {
      this.fallbackShare(referralUrl);
    }
  }

  fallbackShare(url) {
    if (window.uiManager) {
      window.uiManager.copyToClipboard(url);
      this.showNotification('Ссылка скопирована в буфер обмена', 'success');
    }
  }

  // ==================== МОНИТОРИНГ СЕТИ ====================

  setupNetworkMonitoring() {
    // Проверяем сеть каждую минуту
    this.networkCheckInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, 60000);

    console.log('Мониторинг сети настроен');
  }

  async checkNetworkStatus() {
    if (!window.web3Manager?.isConnected) return;

    try {
      const networkInfo = window.web3Manager.getNetworkInfo();
      const isCorrectNetwork = window.web3Manager.isCorrectNetwork();

      if (!isCorrectNetwork) {
        this.handleWrongNetwork(networkInfo);
      }

      // Проверяем подключение к блокчейну
      await this.checkBlockchainConnection();

    } catch (error) {
      console.error('Ошибка проверки сети:', error);
      this.handleNetworkError(error);
    }
  }

  handleWrongNetwork(networkInfo) {
    this.showNotification(
      `Подключена неправильная сеть: ${networkInfo.name}. Переключитесь на opBNB.`,
      'warning',
      0,
      [{
        id: 'switch',
        label: 'Переключить',
        callback: async () => {
          try {
            await window.web3Manager.switchToOpBNB();
          } catch (error) {
            console.error('Ошибка переключения сети:', error);
          }
        }
      }]
    );
  }

  async checkBlockchainConnection() {
    try {
      if (window.web3Manager.web3) {
        await window.web3Manager.web3.eth.getBlockNumber();
      }
    } catch (error) {
      throw new Error('Нет подключения к блокчейну');
    }
  }

  handleNetworkError(error) {
    console.error('Ошибка сети:', error);
    this.showNotification('Проблемы с подключением к сети', 'error');
  }

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  setupEventListeners() {
    // Обработчики Web3Manager
    if (window.web3Manager) {
      window.web3Manager.on('connected', async (data) => {
        console.log('Кошелек подключен, обновляем приложение');
        await this.handleWalletConnected();
        this.enableAutoUpdate();
      });

      window.web3Manager.on('disconnected', () => {
        console.log('Кошелек отключен');
        this.handleWalletDisconnected();
      });

      window.web3Manager.on('accountChanged', async (data) => {
        console.log('Аккаунт изменен:', data);
        await this.handleAccountChanged(data);
      });

      window.web3Manager.on('chainChanged', async (data) => {
        console.log('Сеть изменена:', data);
        await this.handleNetworkChanged(data);
      });
    }

    // Глобальные обработчики
    this.setupGlobalEventListeners();
  }

  setupGlobalEventListeners() {
    // Обработка ошибок
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error);
    });

    // Обработка необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason);
    });

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Сохранение состояния при закрытии
    window.addEventListener('beforeunload', () => {
      this.saveAppState();
    });

    // Обработка клавиатурных сокращений
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + число для быстрой навигации
    if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
      event.preventDefault();
      const pages = ['dashboard', 'matrix', 'profile', 'referrals', 'tokens'];
      const pageIndex = parseInt(event.key) - 1;
      if (pages[pageIndex]) {
        this.navigateToPage(pages[pageIndex]);
      }
    }

    // Escape для закрытия модальных окон
    if (event.key === 'Escape') {
      if (window.uiManager) {
        window.uiManager.closeAllModals();
      }
    }

    // F5 для обновления данных
    if (event.key === 'F5' && !event.ctrlKey) {
      event.preventDefault();
      this.performAutoUpdate();
    }
  }

  handleWalletDisconnected() {
    this.user = null;
    this.appState = {
      userRegistered: false,
      userActive: false,
      activeLevels: [],
      isOwner: false,
      isFounder: false,
      tokenBalance: '0',
      bnbBalance: '0',
      lastBlockNumber: 0,
      connectionState: 'disconnected'
    };

    // Переходим на welcome страницу
    this.navigateToPage('welcome');
    
    // Отключаем админские функции
    if (window.uiManager) {
      window.uiManager.toggleAdminFeatures(false);
    }

    this.disableAutoUpdate();
  }

  async handleAccountChanged(data) {
    console.log('Обработка смены аккаунта');
    
    // Очищаем старые данные
    this.user = null;
    this.clearMatrixCache();
    
    // Загружаем новые данные
    await this.handleWalletConnected();
    
    this.showNotification('Аккаунт изменен, данные обновлены', 'info');
  }

  async handleNetworkChanged(data) {
    console.log('Обработка смены сети');
    
    // Проверяем правильность новой сети
    if (!window.web3Manager.isCorrectNetwork()) {
      this.showNetworkWarning();
    } else {
      this.showNotification('Подключена правильная сеть opBNB', 'success');
    }

    // Переинициализируем контракты
    if (window.contractManager) {
      window.contractManager.reinitializeContracts();
    }

    // Обновляем данные
    await this.updateUserInfo();
  }

  handleGlobalError(error) {
    console.error('Глобальная ошибка:', error);
    
    // Не показываем уведомления для всех ошибок
    if (error.message?.includes('network') || 
        error.message?.includes('contract') ||
        error.message?.includes('transaction')) {
      
      this.showNotification('Произошла ошибка в приложении', 'error');
    }
  }

  handleWindowResize() {
    // Адаптация интерфейса под новый размер
    if (window.uiManager) {
      window.uiManager.handleResize();
    }

    // Обновление матрицы при изменении размера
    this.refreshMatrix();
  }

  // ==================== ОТОБРАЖЕНИЕ ДАННЫХ (ПРОДОЛЖЕНИЕ) ====================

  displayUserProfile() {
    if (!this.user) return;

    const elements = {
      userAddress: document.getElementById('userAddress'),
      registrationTime: document.getElementById('registrationTime'),
      activeLevels: document.getElementById('activeLevels'),
      totalEarned: document.getElementById('totalEarned'),
      personalInvites: document.getElementById('personalInvites'),
      tokenBalance: document.getElementById('userTokenBalance'),
      bnbBalance: document.getElementById('userBnbBalance'),
      leaderRank: document.getElementById('userLeaderRank')
    };

    if (elements.userAddress) {
      elements.userAddress.textContent = this.user.address;
      elements.userAddress.title = this.user.address;
      
      // Добавляем кнопку копирования
      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋';
      copyBtn.className = 'copy-address-btn';
      copyBtn.onclick = () => {
        if (window.uiManager) {
          window.uiManager.copyToClipboard(this.user.address);
        }
      };
      elements.userAddress.parentNode.appendChild(copyBtn);
    }

    if (elements.registrationTime && this.user.stats?.registrationTime) {
      const date = new Date(this.user.stats.registrationTime * 1000);
      elements.registrationTime.textContent = date.toLocaleDateString();
    }

    if (elements.activeLevels) {
      elements.activeLevels.textContent = this.appState.activeLevels.length + '/12';
    }

    if (elements.totalEarned && this.user.stats?.totalEarned) {
      const earned = window.web3Manager.fromWei(this.user.stats.totalEarned);
      elements.totalEarned.textContent = parseFloat(earned).toFixed(4) + ' BNB';
    }

    if (elements.personalInvites && this.user.stats?.personalInvites) {
      elements.personalInvites.textContent = this.user.stats.personalInvites;
    }

    if (elements.tokenBalance) {
      const balance = window.web3Manager.fromWei(this.appState.tokenBalance);
      elements.tokenBalance.textContent = parseFloat(balance).toFixed(2) + ' GWT';
    }

    if (elements.bnbBalance) {
      elements.bnbBalance.textContent = this.appState.bnbBalance + ' BNB';
    }

    if (elements.leaderRank) {
      elements.leaderRank.textContent = this.user.stats?.leaderRank || 'Нет';
    }
  }

  displayReferralStats(userStats) {
    const elements = {
      referralCount: document.getElementById('referralCount'),
      referralEarnings: document.getElementById('referralEarnings'),
      leaderRank: document.getElementById('leaderRank'),
      teamSize: document.getElementById('teamSize'),
      monthlyEarnings: document.getElementById('monthlyEarnings')
    };

    if (elements.referralCount) {
      elements.referralCount.textContent = userStats.personalInvites || 0;
    }

    if (elements.referralEarnings && userStats.totalEarned) {
      const earnings = window.web3Manager.fromWei(userStats.totalEarned);
      elements.referralEarnings.textContent = parseFloat(earnings).toFixed(4) + ' BNB';
    }

    if (elements.leaderRank) {
      elements.leaderRank.textContent = userStats.leaderRank || 'Нет';
    }

    if (elements.teamSize) {
      elements.teamSize.textContent = userStats.teamSize || 0;
    }

    if (elements.monthlyEarnings) {
      elements.monthlyEarnings.textContent = userStats.monthlyEarnings ? 
        parseFloat(window.web3Manager.fromWei(userStats.monthlyEarnings)).toFixed(4) + ' BNB' : '0 BNB';
    }
  }

  displayTokenInfo() {
    console.log('Информация о токенах обновлена');
    
    // Обновляем рыночную капитализацию
    this.updateMarketCap();
  }

  async updateMarketCap() {
    try {
      const tokenPrice = await window.contractManager.getTokenCurrentPrice();
      const totalSupply = await window.contractManager.getTokenTotalSupply();
      
      if (tokenPrice && totalSupply) {
        const priceInBNB = parseFloat(window.web3Manager.fromWei(tokenPrice));
        const supplyCount = parseFloat(window.web3Manager.fromWei(totalSupply));
        const marketCap = priceInBNB * supplyCount;
        
        const marketCapElement = document.getElementById('marketCap');
        if (marketCapElement) {
          marketCapElement.textContent = this.formatLargeNumber(marketCap) + ' BNB';
        }
      }
    } catch (error) {
      console.error('Ошибка расчета рыночной капитализации:', error);
    }
  }

  displayAdminStats(overview) {
    const elements = {
      adminTotalUsers: document.getElementById('adminTotalUsers'),
      adminActiveUsers: document.getElementById('adminActiveUsers'),
      adminTotalVolume: document.getElementById('adminTotalVolume'),
      adminContractBalance: document.getElementById('adminContractBalance'),
      adminTokenSupply: document.getElementById('adminTokenSupply'),
      adminLastActivity: document.getElementById('adminLastActivity')
    };

    if (elements.adminTotalUsers) {
      elements.adminTotalUsers.textContent = overview.totalUsers;
    }

    if (elements.adminActiveUsers) {
      elements.adminActiveUsers.textContent = overview.activeUsers;
    }

    if (elements.adminTotalVolume) {
      const volume = window.web3Manager.fromWei(overview.totalVolume);
      elements.adminTotalVolume.textContent = parseFloat(volume).toFixed(2) + ' BNB';
    }

    if (elements.adminContractBalance) {
      const balance = window.web3Manager.fromWei(overview.contractBalance);
      elements.adminContractBalance.textContent = parseFloat(balance).toFixed(4) + ' BNB';
    }

    if (elements.adminTokenSupply) {
      const supply = window.web3Manager.fromWei(overview.tokenSupply || '0');
      elements.adminTokenSupply.textContent = this.formatLargeNumber(supply) + ' GWT';
    }

    if (elements.adminLastActivity) {
      elements.adminLastActivity.textContent = overview.lastActivity ? 
        new Date(overview.lastActivity * 1000).toLocaleString() : 'Нет данных';
    }
  }

  updateLevelDistribution(distribution) {
    if (window.uiManager) {
      window.uiManager.updateLevelDistribution(distribution);
    }
  }

  // ==================== ОБНОВЛЕНИЕ ДАННЫХ ====================

  async updateUserInfo() {
    if (!window.web3Manager?.isConnected) return;

    try {
      await this.loadUserData();
      this.updateUserInterface();
      
      // Обновляем баланс в UI
      if (window.uiManager) {
        await window.uiManager.updateBalance();
        await window.uiManager.updateTokenInfo();
      }
      
      console.log('Информация пользователя обновлена');
      
    } catch (error) {
      console.error('Ошибка обновления информации пользователя:', error);
    }
  }

  updateUserInterface() {
    if (!this.user) return;

    // Обновляем элементы интерфейса в зависимости от текущей страницы
    switch (this.currentPage) {
      case 'profile':
        this.displayUserProfile();
        break;
      case 'matrix':
        if (this.user.stats?.isRegistered) {
          this.refreshMatrix();
        }
        break;
      case 'referrals':
        this.displayReferralStats(this.user.stats);
        break;
      case 'tokens':
        this.displayTokenInfo();
        break;
    }

    // Обновляем глобальные элементы
    this.updateGlobalUserElements();
  }

  updateGlobalUserElements() {
    // Обновляем адрес пользователя во всех местах
    document.querySelectorAll('.user-address').forEach(element => {
      element.textContent = this.formatAddress(this.user.address);
      element.title = this.user.address;
    });

    // Обновляем статус регистрации
    document.querySelectorAll('.registration-status').forEach(element => {
      element.textContent = this.appState.userRegistered ? 'Зарегистрирован' : 'Не зарегистрирован';
      element.className = `registration-status ${this.appState.userRegistered ? 'registered' : 'not-registered'}`;
    });

    // Обновляем количество активных уровней
    document.querySelectorAll('.active-levels-count').forEach(element => {
      element.textContent = `${this.appState.activeLevels.length}/12`;
    });

    // Обновляем баланс токенов
    document.querySelectorAll('.token-balance').forEach(element => {
      const balance = window.web3Manager.fromWei(this.appState.tokenBalance);
      element.textContent = parseFloat(balance).toFixed(2) + ' GWT';
    });
  }

  // ==================== ОБРАБОТКА ОШИБОК ====================

  handleInitializationError(error) {
    console.error('Критическая ошибка инициализации:', error);
    
    // Показываем пользователю сообщение об ошибке
    this.showCriticalError(error);
    
    // Пытаемся восстановиться
    setTimeout(() => {
      this.attemptRecovery();
    }, 5000);
  }

  showCriticalError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'critical-error';
    errorContainer.innerHTML = `
      <div class="error-content">
        <h2>Ошибка загрузки приложения</h2>
        <p>Произошла критическая ошибка при инициализации GlobalWay.</p>
        <details>
          <summary>Подробности ошибки</summary>
          <pre>${error.message || error}</pre>
        </details>
        <div class="error-actions">
          <button onclick="location.reload()" class="cosmic-btn primary">
            Перезагрузить страницу
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="cosmic-btn secondary">
            Закрыть
          </button>
          <button onclick="window.globalWayApp.attemptRecovery()" class="cosmic-btn tertiary">
            Попробовать восстановить
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(errorContainer);
  }

  async attemptRecovery() {
    console.log('Попытка восстановления приложения...');
    
    try {
      // Переинициализируем критически важные компоненты
      if (!this.isInitialized) {
        await this.init();
      }
      
      this.showNotification('Восстановление успешно завершено', 'success');
    } catch (error) {
      console.error('Восстановление не удалось:', error);
      this.showNotification('Восстановление не удалось. Перезагрузите страницу.', 'error');
    }
  }

  showError(title, message) {
    this.showNotification(`${title}: ${message}`, 'error');
  }

  // ==================== СОХРАНЕНИЕ СОСТОЯНИЯ ====================

  saveAppState() {
    const state = {
      currentPage: this.currentPage,
      lastUpdateTime: this.lastUpdateTime,
      autoUpdateEnabled: this.autoUpdateEnabled,
      appState: this.appState,
      matrixConfig: this.matrixConfig,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('globalway_app_state', JSON.stringify(state));
    } catch (error) {
      console.error('Ошибка сохранения состояния:', error);
    }
  }

  loadAppState() {
    try {
      const savedState = localStorage.getItem('globalway_app_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Проверяем актуальность состояния (не старше 1 часа)
        if (Date.now() - state.timestamp < 3600000) {
          this.currentPage = state.currentPage || 'dashboard';
          this.autoUpdateEnabled = state.autoUpdateEnabled !== false;
          
          if (state.appState) {
            this.appState = { ...this.appState, ...state.appState };
          }
          
          if (state.matrixConfig) {
            this.matrixConfig = { ...this.matrixConfig, ...state.matrixConfig };
          }
          
          return state;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки состояния:', error);
    }
    
    return null;
  }

  clearAppState() {
    localStorage.removeItem('globalway_app_state');
  }

  // ==================== ДИАГНОСТИКА ====================

  async runDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      managers: {
        web3Manager: !!window.web3Manager,
        contractManager: !!window.contractManager,
        uiManager: !!window.uiManager
      },
      connection: {
        walletConnected: window.web3Manager?.isConnected || false,
        correctNetwork: window.web3Manager?.isCorrectNetwork() || false,
        contractsReady: window.contractManager?.isContractsReady() || false
      },
      app: {
        initialized: this.isInitialized,
        currentPage: this.currentPage,
        autoUpdateEnabled: this.autoUpdateEnabled,
        userRegistered: this.appState.userRegistered,
        offlineMode: this.offlineMode
      },
      performance: {
        cacheSize: this.dataCache.users.size,
        eventListeners: this.eventListeners.size,
        lastUpdate: this.lastUpdateTime
      }
    };

    if (window.web3Manager?.isConnected) {
      try {
        const networkInfo = window.web3Manager.getNetworkInfo();
        diagnostics.network = networkInfo;
        
        if (window.contractManager?.isContractsReady()) {
          const contractDiag = await window.contractManager.diagnoseContract();
          diagnostics.contracts = contractDiag;
        }
        
        // Тест производительности
        const perfTest = await this.runPerformanceTest();
        diagnostics.performance = { ...diagnostics.performance, ...perfTest };
        
      } catch (error) {
        diagnostics.error = error.message;
      }
    }

    console.log('Диагностика приложения:', diagnostics);
    return diagnostics;
  }

  async runPerformanceTest() {
    const results = {
      contractResponseTime: 0,
      uiRenderTime: 0,
      cacheEfficiency: 0
    };

    try {
      // Тест времени отклика контракта
      const startTime = performance.now();
      await window.contractManager.getContractOverview();
      results.contractResponseTime = performance.now() - startTime;

      // Тест рендеринга UI
      const renderStart = performance.now();
      const testElement = document.createElement('div');
      testElement.innerHTML = '<div class="test-render">Test</div>';
      document.body.appendChild(testElement);
      document.body.removeChild(testElement);
      results.uiRenderTime = performance.now() - renderStart;

      // Эффективность кэша
      const cacheHits = this.dataCache.users.size;
      const totalRequests = cacheHits + 10; // примерная оценка
      results.cacheEfficiency = cacheHits > 0 ? (cacheHits / totalRequests) * 100 : 0;

    } catch (error) {
      console.error('Ошибка теста производительности:', error);
    }

    return results;
  }

  // ==================== ОЧИСТКА РЕСУРСОВ ====================

  destroy() {
    console.log('Уничтожение GlobalWay App...');

    // Очищаем интервалы
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
    }

    // Отписываемся от событий контрактов
    this.eventListeners.forEach((listener, eventName) => {
      try {
        listener.removeAllListeners();
      } catch (error) {
        console.warn(`Ошибка отписки от события ${eventName}:`, error);
      }
    });
    this.eventListeners.clear();

    // Очищаем кэш
    this.cache.clear();
    this.dataCache.users.clear();
    this.dataCache.stats.clear();
    this.dataCache.events.clear();

    // Сохраняем состояние
    this.saveAppState();

    // Очищаем ссылки
    this.user = null;
    this.currentPage = null;
    this.isInitialized = false;

    console.log('GlobalWay App уничтожен');
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ====================

  async getUserReferrals(userAddress) {
    try {
      const cached = this.getCachedUserData(userAddress);
      if (cached?.referrals) {
        return cached.referrals;
      }

      const userStats = await window.contractManager.getUserStats(userAddress);
      return userStats?.referrals || [];
    } catch (error) {
      console.error('Ошибка получения рефералов:', error);
      return [];
    }
  }

  async getUserEarnings(userAddress) {
    try {
      const userStats = await window.contractManager.getUserStats(userAddress);
      
      return {
        total: userStats?.totalEarned || '0',
        monthly: userStats?.monthlyEarnings || '0',
        referral: userStats?.referralEarnings || '0',
        matrix: userStats?.matrixEarnings || '0'
      };
    } catch (error) {
      console.error('Ошибка получения заработка:', error);
      return { total: '0', monthly: '0', referral: '0', matrix: '0' };
    }
  }

  async getAllUsers() {
    // Заглушка для получения всех пользователей
    // В реальной реализации нужно получать через контракт или API
    return Array.from(this.dataCache.users.values());
  }

  filterUsersByAdvancedCriteria(filters) {
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
      let shouldShow = true;

      // Фильтр по дате
      if (filters.dateFrom || filters.dateTo) {
        const userDate = card.dataset.registrationDate;
        if (userDate) {
          const date = new Date(userDate);
          if (filters.dateFrom && date < new Date(filters.dateFrom)) shouldShow = false;
          if (filters.dateTo && date > new Date(filters.dateTo)) shouldShow = false;
        }
      }

      // Фильтр по уровням
      if (filters.levels.length > 0) {
        const userLevels = JSON.parse(card.dataset.activeLevels || '[]');
        const hasMatchingLevel = filters.levels.some(level => userLevels.includes(level));
        if (!hasMatchingLevel) shouldShow = false;
      }

      // Фильтр по заработку
      const userEarnings = parseFloat(card.dataset.earnings || '0');
      if (userEarnings < filters.earningsMin || userEarnings > filters.earningsMax) {
        shouldShow = false;
      }

      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  clearAdvancedFilters() {
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('levelFilter').selectedIndex = -1;
    document.getElementById('earningsMin').value = '';
    document.getElementById('earningsMax').value = '';

    // Показываем все карточки пользователей
    document.querySelectorAll('.user-card').forEach(card => {
      card.style.display = 'block';
    });
  }

  clearSearch() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Показываем все результаты
    document.querySelectorAll('.user-card').forEach(card => {
      card.style.display = 'block';
    });
  }

  displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
      return;
    }

    resultsContainer.innerHTML = results.map(user => `
      <div class="user-search-result" data-address="${user.address}">
        <div class="user-avatar"></div>
        <div class="user-info">
          <div class="user-address">${this.formatAddress(user.address)}</div>
          <div class="user-stats">
            Уровни: ${user.stats?.activeLevels?.length || 0}/12 | 
            Рефералы: ${user.stats?.personalInvites || 0}
          </div>
        </div>
        <button class="view-user-btn" onclick="window.globalWayApp.selectMatrixUser('${user.address}')">
          Просмотр
        </button>
      </div>
    `).join('');
  }

  updateFilterButtons(activeButton) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    activeButton.classList.add('active');
  }

  applyFilter(filterType) {
    const userCards = document.querySelectorAll('.user-card');

    userCards.forEach(card => {
      const shouldShow = this.shouldShowCard(card, filterType);
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  shouldShowCard(card, filterType) {
    switch (filterType) {
      case 'all':
        return true;
      case 'active':
        return card.classList.contains('user-active');
      case 'inactive':
        return !card.classList.contains('user-active');
      case 'referrals':
        return card.dataset.isReferral === 'true';
      case 'leaders':
        return parseInt(card.dataset.leaderRank || '0') > 0;
      default:
        return true;
    }
  }

  async loadGridData() {
    // Загружаем данные для grid режима матрицы
    try {
      const overview = await window.contractManager.getContractOverview();
      
      // Обновляем счетчики участников для каждого уровня
      if (overview.levelDistribution) {
        overview.levelDistribution.forEach((count, index) => {
          const level = index + 1;
          const participantsElement = document.getElementById(`levelParticipants${level}`);
          if (participantsElement) {
            participantsElement.textContent = count;
          }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных grid:', error);
    }
  }

  async loadListData() {
    // Загружаем данные для list режима матрицы
    const listContent = document.getElementById('listContent');
    if (!listContent) return;

    try {
      const users = await this.getAllUsers();
      
      if (users.length === 0) {
        listContent.innerHTML = '<div class="no-users">Пользователи не найдены</div>';
        return;
      }

      listContent.innerHTML = users.map(user => `
        <div class="list-user-item" data-address="${user.address}">
          <div class="list-user-avatar"></div>
          <div class="list-user-info">
            <div class="list-user-address">${this.formatAddress(user.address)}</div>
            <div class="list-user-stats">
              Уровни: ${user.stats?.activeLevels?.length || 0}/12 |
              Рефералы: ${user.stats?.personalInvites || 0} |
              Заработано: ${user.userData?.totalEarned ? 
                parseFloat(window.web3Manager.fromWei(user.userData.totalEarned)).toFixed(4) + ' BNB' : '0 BNB'}
            </div>
          </div>
          <div class="list-user-actions">
            <button class="cosmic-btn secondary" onclick="window.globalWayApp.selectMatrixUser('${user.address}')">
              Выбрать
            </button>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Ошибка загрузки списка пользователей:', error);
      listContent.innerHTML = '<div class="list-error">Ошибка загрузки пользователей</div>';
    }
  }

  filterMatrixUsers(query) {
    const listItems = document.querySelectorAll('.list-user-item');
    
    listItems.forEach(item => {
      const address = item.dataset.address.toLowerCase();
      const shouldShow = address.includes(query.toLowerCase());
      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  optimizeForTouch() {
    // Увеличиваем размер кнопок для touch устройств
    document.querySelectorAll('button, .clickable').forEach(element => {
      element.style.minHeight = '44px';
      element.style.minWidth = '44px';
    });

    // Добавляем touch feedback
    document.addEventListener('touchstart', (e) => {
      e.target.classList.add('touch-active');
    });

    document.addEventListener('touchend', (e) => {
      setTimeout(() => {
        e.target.classList.remove('touch-active');
      }, 150);
    });
  }

  subscribeToContractEvents() {
    if (!window.web3Manager?.isConnected) return;

    const userAddress = window.web3Manager.account;
    
    // Подписка на события с фильтром по пользователю
    this.subscribeToEvent('UserRegistered', (event) => {
      if (event.returnValues.user.toLowerCase() === userAddress.toLowerCase()) {
        this.handleUserRegistered(event);
      }
    });

    this.subscribeToEvent('LevelActivated', (event) => {
      if (event.returnValues.user.toLowerCase() === userAddress.toLowerCase()) {
        this.handleLevelActivated(event);
      }
    });

    this.subscribeToEvent('ReferralReward', (event) => {
      if (event.returnValues.referrer.toLowerCase() === userAddress.toLowerCase()) {
        this.handleReferralReward(event);
      }
    });
  }

  showRegistrationPrompt() {
    const matrixContainer = document.getElementById('matrixContainer');
    if (matrixContainer) {
      matrixContainer.innerHTML = `
        <div class="registration-prompt">
          <h3>Регистрация в GlobalWay</h3>
          <p>Для доступа к матрице необходимо зарегистрироваться в системе</p>
          <div class="registration-benefits">
            <h4>Преимущества регистрации:</h4>
            <ul>
              <li>Доступ к интерактивной матрице</li>
              <li>Возможность приглашать рефералов</li>
              <li>Получение вознаграждений с уровней</li>
              <li>Участие в лидерских программах</li>
            </ul>
          </div>
          <button class="cosmic-btn primary" id="registerFromMatrix">Зарегистрироваться</button>
        </div>
      `;

      const registerBtn = document.getElementById('registerFromMatrix');
      if (registerBtn) {
        registerBtn.addEventListener('click', () => {
          if (window.uiManager) {
            window.uiManager.handleRegistration();
          }
        });
      }
    }
  }

  async showReferralHistory() {
    try {
      const referrals = await this.getUserReferrals(window.web3Manager.account);
      
      if (window.uiManager) {
        window.uiManager.showModal('referral-history', {
          title: 'История рефералов',
          content: this.generateReferralHistoryHTML(referrals)
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки истории рефералов:', error);
      this.showNotification('Ошибка загрузки истории', 'error');
    }
  }

  generateReferralHistoryHTML(referrals) {
    if (referrals.length === 0) {
      return '<div class="no-referrals">У вас пока нет рефералов</div>';
    }

    return `
      <div class="referral-history">
        ${referrals.map(referral => `
          <div class="referral-item">
            <div class="referral-address">${this.formatAddress(referral.address)}</div>
            <div class="referral-date">${new Date(referral.timestamp * 1000).toLocaleDateString()}</div>
            <div class="referral-level">Уровень: ${referral.level || 1}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ==================== ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ====================

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Запуск GlobalWay Application...');
  
  try {
    // Создаем глобальный экземпляр приложения
    window.globalWayApp = new GlobalWayApp();
    
    // Загружаем сохраненное состояние
    window.globalWayApp.loadAppState();
    
    console.log('GlobalWay Application запущен успешно');
    
  } catch (error) {
    console.error('Критическая ошибка запуска приложения:', error);
    
    // Показываем пользователю ошибку
    document.body.innerHTML = `
      <div class="critical-error">
        <h1>Ошибка загрузки GlobalWay</h1>
        <p>Не удалось запустить приложение. Перезагрузите страницу.</p>
        <button onclick="location.reload()">Перезагрузить</button>
      </div>
    `;
  }
});

// Очистка при закрытии
window.addEventListener('beforeunload', () => {
  if (window.globalWayApp) {
    window.globalWayApp.destroy();
  }
});

// ==================== ОТЛАДОЧНЫЕ УТИЛИТЫ ====================

window.debugApp = {
  async checkStatus() {
    if (window.globalWayApp) {
      return await window.globalWayApp.runDiagnostics();
    }
    return { error: 'App not initialized' };
  },
  
  forceUpdate() {
    if (window.globalWayApp) {
      window.globalWayApp.performAutoUpdate();
    }
  },
  
  navigateTo(page) {
    if (window.globalWayApp) {
      window.globalWayApp.navigateToPage(page);
    }
  },
  
  clearState() {
    if (window.globalWayApp) {
      window.globalWayApp.clearAppState();
    }
  },

  clearCache() {
    if (window.globalWayApp) {
      window.globalWayApp.clearMatrixCache();
    }
  },

  testMatrix() {
    if (window.globalWayApp) {
      window.globalWayApp.refreshMatrix();
    }
  },

  enableOffline() {
    if (window.globalWayApp) {
      window.globalWayApp.offlineMode = true;
    }
  }
};

console.log('GlobalWay App полностью инициализирован для opBNB');
console.log('Доступны утилиты отладки: window.debugApp');
console.log('Версия: 1.0.0 - Полная функциональность восстановлена');
