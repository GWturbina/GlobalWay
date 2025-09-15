/**
 * Основной контроллер приложения GlobalWay
 * Управляет состоянием приложения, навигацией и пользовательскими сессиями
 */

class GlobalWayApp {
  constructor() {
    this.currentPage = 'index';
    this.userState = {
      isConnected: false,
      isRegistered: false,
      isActive: false,
      address: null,
      role: 'user',
      userData: null,
      balance: 0
    };
    
    this.isLoading = false;
    this.notifications = [];
    this.eventListeners = new Map();
    
    // Кеш для оптимизации
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 минут
    
    this.initialize();
  }

  /**
   * Инициализация приложения
   */
  async initialize() {
    try {
      console.log('🚀 Initializing GlobalWay App...');
      
      // Загружаем переводы
      await i18n.loadTranslations();
      
      // Настраиваем слушателей событий
      this.setupEventListeners();
      
      // Проверяем сохраненное состояние
      this.loadSavedState();
      
      // Пытаемся автоподключиться к кошельку
      await this.attemptAutoConnect();
      
      // Определяем текущую страницу
      this.detectCurrentPage();
      
      // Инициализируем интерфейс
      this.initializeUI();
      
      console.log('✅ GlobalWay App initialized successfully');
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.showNotification('Failed to initialize app', 'error');
    }
  }

  /**
   * Настройка слушателей событий
   */
  setupEventListeners() {
    // События Web3
    web3Manager.addEventListener('walletConnected', this.handleWalletConnected.bind(this));
    web3Manager.addEventListener('walletDisconnected', this.handleWalletDisconnected.bind(this));
    web3Manager.addEventListener('accountChanged', this.handleAccountChanged.bind(this));
    web3Manager.addEventListener('networkChanged', this.handleNetworkChanged.bind(this));
    web3Manager.addEventListener('wrongNetwork', this.handleWrongNetwork.bind(this));

    // События языка
    window.addEventListener('languageChanged', this.handleLanguageChanged.bind(this));
    
    // События контрактов
    window.addEventListener('contractEvent', this.handleContractEvent.bind(this));
    
    // События навигации
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // События приложения
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Загрузка сохраненного состояния
   */
  loadSavedState() {
    try {
      const savedTheme = localStorage.getItem('globalway_theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }

      const savedUser = localStorage.getItem('globalway_user_data');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        this.userState = { ...this.userState, ...userData };
      }

    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  /**
   * Автоподключение к кошельку
   */
  async attemptAutoConnect() {
    try {
      if (localStorage.getItem('walletConnected') === 'true') {
        await web3Manager.autoConnect();
      }
    } catch (error) {
      console.log('Auto-connect failed, manual connection required');
    }
  }

  /**
   * Определение текущей страницы
   */
  detectCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('dashboard')) {
      this.currentPage = 'dashboard';
    } else if (path.includes('partners')) {
      this.currentPage = 'partners';
    } else if (path.includes('matrix')) {
      this.currentPage = 'matrix';
    } else if (path.includes('tokens')) {
      this.currentPage = 'tokens';
    } else if (path.includes('projects')) {
      this.currentPage = 'projects';
    } else if (path.includes('settings')) {
      this.currentPage = 'settings';
    } else if (path.includes('admin')) {
      this.currentPage = 'admin';
    } else {
      this.currentPage = 'index';
    }
  }

  /**
   * Инициализация интерфейса
   */
  initializeUI() {
    // Обновляем состояние UI
    this.updateConnectionStatus();
    this.updateUserInfo();
    this.updateNavigationState();
    
    // Настраиваем навигацию
    this.setupNavigation();
    
    // Настраиваем кнопки подключения
    this.setupConnectionButtons();
    
    // Инициализируем текущую страницу
    this.initializePage(this.currentPage);
  }

  // ===== УПРАВЛЕНИЕ ПОДКЛЮЧЕНИЕМ =====

  /**
   * Подключение кошелька
   */
  async connectWallet(walletType = null) {
    if (this.isLoading) return;
    
    this.setLoading(true);
    
    try {
      this.showNotification(i18n.t('wallet.connecting'), 'info');
      
      const result = await web3Manager.connectWallet(walletType);
      
      if (result.success) {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('selectedWallet', result.wallet);
        
        this.showNotification(
          i18n.t('wallet.connected', { wallet: result.wallet }), 
          'success'
        );
      }
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      this.showNotification(error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Отключение кошелька
   */
  async disconnectWallet() {
    try {
      await web3Manager.disconnectWallet();
      this.showNotification(i18n.t('wallet.disconnected'), 'info');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  /**
   * Обработка подключения кошелька
   */
  async handleWalletConnected(data) {
    this.userState.isConnected = true;
    this.userState.address = data.account;
    
    try {
      // Инициализируем контракты
      await contractManager.initialize(web3Manager.web3);
      
      // Проверяем регистрацию пользователя
      await this.checkUserRegistration();
      
      // Загружаем данные пользователя
      await this.loadUserData();
      
      // Определяем роль пользователя
      this.userState.role = contractManager.getUserRole(this.userState.address);
      
      // Обновляем интерфейс
      this.updateConnectionStatus();
      this.updateUserInfo();
      this.updateNavigationState();
      
      // Сохраняем состояние
      this.saveUserState();
      
      // Если пользователь не зарегистрирован, показываем модальное окно регистрации
      if (!this.userState.isRegistered) {
        this.showRegistrationModal();
      }
      
    } catch (error) {
      console.error('Post-connection setup failed:', error);
      this.showNotification('Failed to load user data', 'error');
    }
  }

  /**
   * Обработка отключения кошелька
   */
  handleWalletDisconnected() {
    this.userState = {
      isConnected: false,
      isRegistered: false,
      isActive: false,
      address: null,
      role: 'user',
      userData: null,
      balance: 0
    };
    
    this.updateConnectionStatus();
    this.updateUserInfo();
    this.updateNavigationState();
    
    // Очищаем сохраненное состояние
    localStorage.removeItem('globalway_user_data');
    
    // Если не на главной странице, перенаправляем
    if (this.currentPage !== 'index') {
      this.navigateTo('index');
    }
  }

  /**
   * Обработка смены аккаунта
   */
  async handleAccountChanged(data) {
    this.userState.address = data.account;
    
    // Перезагружаем данные для нового аккаунта
    await this.checkUserRegistration();
    await this.loadUserData();
    
    this.userState.role = contractManager.getUserRole(this.userState.address);
    
    this.updateUserInfo();
    this.updateNavigationState();
    this.saveUserState();
    
    this.showNotification('Account changed', 'info');
  }

  /**
   * Обработка смены сети
   */
  handleNetworkChanged(data) {
    if (data.networkId !== 204) {
      this.showNotification('Please switch to opBNB network', 'warning');
    } else {
      this.showNotification('Connected to opBNB network', 'success');
    }
  }

  /**
   * Обработка неправильной сети
   */
  handleWrongNetwork(data) {
    this.showNotification(
      `Wrong network detected. Please switch to opBNB (Chain ID: 204)`,
      'error'
    );
  }

  // ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЕМ =====

  /**
   * Проверка регистрации пользователя
   */
  async checkUserRegistration() {
    if (!this.userState.address) return;
    
    try {
      this.userState.isRegistered = await contractManager.isUserRegistered(
        this.userState.address
      );
      
      if (this.userState.isRegistered) {
        // Проверяем активность (есть ли активные уровни)
        const userStats = await contractManager.getUserStats(this.userState.address);
        this.userState.isActive = userStats.activeLevels.length > 0;
      }
      
    } catch (error) {
      console.error('Failed to check user registration:', error);
    }
  }

  /**
   * Загрузка данных пользователя
   */
  async loadUserData() {
    if (!this.userState.address || !this.userState.isRegistered) return;
    
    try {
      // Загружаем полную информацию пользователя
      const [fullInfo, stats, earnings, balance] = await Promise.all([
        contractManager.getUserFullInfo(this.userState.address),
        contractManager.getUserStats(this.userState.address),
        contractManager.getEarningsBreakdown(this.userState.address),
        web3Manager.getBalance(this.userState.address)
      ]);
      
      this.userState.userData = {
        fullInfo,
        stats,
        earnings,
        lastUpdated: Date.now()
      };
      
      this.userState.balance = balance;
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  /**
   * Генерация ID пользователя
   */
  generateUserID() {
    // Генерируем 7-значный ID
    let id;
    do {
      id = Math.floor(1000000 + Math.random() * 9000000).toString();
    } while (this.isIDUsed(id));
    
    // Сохраняем в localStorage
    const usedIDs = JSON.parse(localStorage.getItem('globalway_used_ids') || '[]');
    usedIDs.push(id);
    localStorage.setItem('globalway_used_ids', JSON.stringify(usedIDs));
    
    return id;
  }

  /**
   * Проверка использования ID
   */
  isIDUsed(id) {
    const usedIDs = JSON.parse(localStorage.getItem('globalway_used_ids') || '[]');
    return usedIDs.includes(id);
  }

  /**
   * Регистрация пользователя
   */
  async registerUser(sponsorAddress) {
    if (!this.userState.address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      this.setLoading(true);
      this.showNotification('Processing registration...', 'info');
      
      const result = await contractManager.registerUser(
        sponsorAddress,
        this.userState.address
      );
      
      // Ждем подтверждения транзакции
      await web3Manager.waitForTransaction(result.transactionHash);
      
      // Генерируем и сохраняем ID пользователя
      const userID = this.generateUserID();
      localStorage.setItem(`user_id_${this.userState.address}`, userID);
      
      // Обновляем состояние
      this.userState.isRegistered = true;
      await this.loadUserData();
      
      this.showNotification('Registration successful!', 'success');
      this.hideModal();
      
      // Показываем модальное окно активации уровней
      this.showLevelActivationModal();
      
    } catch (error) {
      console.error('Registration failed:', error);
      this.showNotification(error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  // ===== НАВИГАЦИЯ =====

  /**
   * Настройка навигации
   */
  setupNavigation() {
    // Обработчики кликов по навигационным элементам
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-nav]');
      if (navItem) {
        e.preventDefault();
        const page = navItem.dataset.nav;
        this.navigateTo(page);
      }
    });
  }

  /**
   * Навигация между страницами
   */
  async navigateTo(page) {
    // Проверяем доступ к странице
    if (!this.canAccessPage(page)) {
      this.showNotification('Please connect wallet first', 'warning');
      return;
    }
    
    try {
      this.setLoading(true);
      
      // Загружаем страницу
      await this.loadPage(page);
      
      // Обновляем URL
      const url = page === 'index' ? '/' : `/components/${page}.html`;
      history.pushState({ page }, '', url);
      
      // Обновляем состояние
      this.currentPage = page;
      this.updateNavigationState();
      
    } catch (error) {
      console.error(`Failed to navigate to ${page}:`, error);
      this.showNotification('Navigation failed', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Проверка доступа к странице
   */
  canAccessPage(page) {
    const publicPages = ['index'];
    const authPages = ['dashboard', 'partners', 'matrix', 'tokens', 'projects', 'settings'];
    const adminPages = ['admin'];
    
    if (publicPages.includes(page)) {
      return true;
    }
    
    if (authPages.includes(page)) {
      return this.userState.isConnected;
    }
    
    if (adminPages.includes(page)) {
      return this.userState.isConnected && 
             ['owner', 'founder', 'director'].includes(this.userState.role);
    }
    
    return false;
  }

  /**
   * Загрузка страницы
   */
  async loadPage(page) {
    if (page === 'index') {
      window.location.href = '/';
      return;
    }
    
    try {
      const response = await fetch(`/components/${page}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load ${page} page`);
      }
      
      const html = await response.text();
      document.body.innerHTML = html;
      
      // Инициализируем загруженную страницу
      await this.initializePage(page);
      
    } catch (error) {
      console.error(`Failed to load page ${page}:`, error);
      throw error;
    }
  }

  /**
   * Инициализация страницы
   */
  async initializePage(page) {
    // Обновляем переводы
    i18n.updateUI();
    
    // Инициализируем специфичные для страницы функции
    switch (page) {
      case 'dashboard':
        await this.initializeDashboard();
        break;
      case 'partners':
        await this.initializePartners();
        break;
      case 'matrix':
        await this.initializeMatrix();
        break;
      case 'tokens':
        await this.initializeTokens();
        break;
      case 'projects':
        await this.initializeProjects();
        break;
      case 'settings':
        await this.initializeSettings();
        break;
      case 'admin':
        await this.initializeAdmin();
        break;
    }
    
    // Общая инициализация для всех страниц
    this.setupPageEventListeners();
    this.updateConnectionStatus();
    this.updateUserInfo();
  }

  // ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====

  /**
   * Обновление статуса подключения
   */
  updateConnectionStatus() {
    const connectButton = document.getElementById('connectWallet');
    const disconnectButton = document.getElementById('disconnectWallet');
    const walletInfo = document.getElementById('walletInfo');
    
    if (this.userState.isConnected) {
      if (connectButton) connectButton.style.display = 'none';
      if (disconnectButton) disconnectButton.style.display = 'block';
      if (walletInfo) {
        walletInfo.style.display = 'block';
        walletInfo.innerHTML = `
          <span class="wallet-address">${web3Manager.formatAddress(this.userState.address)}</span>
          <span class="wallet-balance">${this.userState.balance.toFixed(4)} BNB</span>
        `;
      }
    } else {
      if (connectButton) connectButton.style.display = 'block';
      if (disconnectButton) disconnectButton.style.display = 'none';
      if (walletInfo) walletInfo.style.display = 'none';
    }
  }

  /**
   * Обновление информации о пользователе
   */
  updateUserInfo() {
    if (!this.userState.isConnected) return;
    
    // Обновляем ID пользователя
    const userIdElement = document.getElementById('userId');
    if (userIdElement) {
      const userId = localStorage.getItem(`user_id_${this.userState.address}`) || 
                    this.generateUserID();
      userIdElement.textContent = userId;
    }
    
    // Обновляем реферальную ссылку
    const referralLinkElement = document.getElementById('referralLink');
    if (referralLinkElement) {
      const userId = localStorage.getItem(`user_id_${this.userState.address}`);
      referralLinkElement.value = `https://globalway.club/ref${userId}`;
    }
    
    // Обновляем статус регистрации
    const registrationStatus = document.getElementById('registrationStatus');
    if (registrationStatus) {
      registrationStatus.textContent = this.userState.isRegistered ? 
        i18n.t('user.registered') : i18n.t('user.notRegistered');
    }
  }

  /**
   * Обновление состояния навигации
   */
  updateNavigationState() {
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.nav === this.currentPage) {
        item.classList.add('active');
      }
      
      // Показываем/скрываем админские элементы
      if (item.dataset.nav === 'admin') {
        const hasAdminAccess = ['owner', 'founder', 'director'].includes(this.userState.role);
        item.style.display = hasAdminAccess ? 'flex' : 'none';
      }
    });
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

  /**
   * Установка состояния загрузки
   */
  setLoading(loading) {
    this.isLoading = loading;
    
    const loadingElement = document.getElementById('loadingOverlay');
    if (loadingElement) {
      loadingElement.style.display = loading ? 'flex' : 'none';
    }
    
    // Отключаем/включаем кнопки
    document.querySelectorAll('button').forEach(btn => {
      btn.disabled = loading;
    });
  }

  /**
   * Показ уведомления
   */
  showNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    this.notifications.push(notification);
    
    // Создаем элемент уведомления
    const notificationElement = this.createNotificationElement(notification);
    document.body.appendChild(notificationElement);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
      this.hideNotification(notification.id);
    }, 5000);
  }

  /**
   * Создание элемента уведомления
   */
  createNotificationElement(notification) {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.id = `notification-${notification.id}`;
    element.innerHTML = `
      <span class="notification-message">${notification.message}</span>
      <button class="notification-close" onclick="app.hideNotification(${notification.id})">×</button>
    `;
    
    // Добавляем анимацию появления
    element.classList.add('animate-fade-in-right');
    
    return element;
  }

  /**
   * Скрытие уведомления
   */
  hideNotification(notificationId) {
    const element = document.getElementById(`notification-${notificationId}`);
    if (element) {
      element.classList.add('animate-fade-out');
      setTimeout(() => {
        element.remove();
      }, 300);
    }
    
    // Удаляем из массива
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  /**
   * Сохранение состояния пользователя
   */
  saveUserState() {
    const stateToSave = {
      address: this.userState.address,
      isRegistered: this.userState.isRegistered,
      isActive: this.userState.isActive,
      role: this.userState.role,
      lastSaved: Date.now()
    };
    
    localStorage.setItem('globalway_user_data', JSON.stringify(stateToSave));
  }

  /**
   * Обработка изменения языка
   */
  handleLanguageChanged(event) {
    console.log('Language changed to:', event.detail.to);
    // Переинициализируем текущую страницу с новым языком
    this.initializePage(this.currentPage);
  }

  /**
   * Обработка событий контракта
   */
  handleContractEvent(event) {
    console.log('Contract event received:', event.detail);
    // Обновляем данные пользователя при изменениях в контракте
    if (this.userState.isConnected) {
      this.loadUserData();
    }
  }

  /**
   * Обработка навигации браузера
   */
  handlePopState(event) {
    if (event.state && event.state.page) {
      this.currentPage = event.state.page;
      this.initializePage(this.currentPage);
    }
  }

  /**
   * Обработка изменения видимости страницы
   */
  handleVisibilityChange() {
    if (!document.hidden && this.userState.isConnected) {
      // Обновляем данные при возвращении на страницу
      this.loadUserData();
    }
  }

  /**
   * Обработка перед закрытием страницы
   */
  handleBeforeUnload() {
    // Сохраняем состояние перед закрытием
    this.saveUserState();
  }

  // ===== МОДАЛЬНЫЕ ОКНА =====

  /**
   * Показ модального окна
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Скрытие модального окна
   */
  hideModal(modalId = null) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
      }
    } else {
      // Скрываем все модальные окна
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  }

  /**
   * Показ модального окна регистрации
   */
  showRegistrationModal() {
    // Создаем и показываем модальное окно регистрации
    // Это будет реализовано в отдельных компонентах страниц
    console.log('Show registration modal');
  }

  /**
   * Показ модального окна активации уровней
   */
  showLevelActivationModal() {
    // Создаем и показываем модальное окно активации уровней
    console.log('Show level activation modal');
  }

  // ===== КЕШИРОВАНИЕ =====

  /**
   * Получение данных из кеша
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Сохранение данных в кеш
   */
  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Очистка кеша
   */
  clearCache() {
    this.cache.clear();
  }
}

// Создаем глобальный экземпляр приложения
const app = new GlobalWayApp();

// Глобальная доступность
window.app = app;

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}
