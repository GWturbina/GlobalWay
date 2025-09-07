// ==================== ПОЛНЫЙ ИСПРАВЛЕННЫЙ UI.JS ====================

class UIManager {
  constructor() {
    this.modals = {};
    this.notifications = [];
    this.loadingStates = new Map();
    this.tooltips = new Map();
    this.currentTheme = 'dark';
    this.progressModals = new Map();
    
    this.init();
  }

  init() {
    this.setupModals();
    this.setupNotifications();
    this.setupTooltips();
    this.setupLoadingStates();
    this.setupTheme();
    this.setupContractInteractionUI();
    this.setupWalletUI();
    this.setupAdminUI();
    this.setupTokenUI();
    console.log('🎨 UIManager инициализирован с поддержкой opBNB');
  }

  // ==================== МОДАЛЬНЫЕ ОКНА ====================

  setupModals() {
    const modals = document.querySelectorAll('.modal, .cosmic-modal-overlay');
    modals.forEach(modal => {
      const id = modal.id;
      if (id) {
        this.modals[id] = modal;
      }
      
      // Закрытие по клику на overlay
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
          this.hideModal(id);
        }
      });
      
      // Закрытие по кнопке
      const closeBtn = modal.querySelector('.modal-close, .close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideModal(id);
        });
      }
      
      // Закрытие по ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          this.hideModal(id);
        }
      });
    });
  }

  showModal(modalId, data = {}) {
    const modal = this.modals[modalId];
    if (modal) {
      // Заполняем данные в модальное окно
      this.populateModalData(modal, data);
      
      modal.classList.add('active');
      document.body.classList.add('modal-open');
      
      // Фокус на первый input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      
      // Анимация
      const modalContent = modal.querySelector('.modal-content, .cosmic-modal');
      if (modalContent) {
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
          modalContent.style.transform = 'scale(1)';
          modalContent.style.opacity = '1';
        }, 10);
      }
    }
  }

  hideModal(modalId) {
    const modal = this.modals[modalId];
    if (modal) {
      const modalContent = modal.querySelector('.modal-content, .cosmic-modal');
      
      if (modalContent) {
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.classList.remove('modal-open');
        }, 200);
      } else {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    }
  }

  populateModalData(modal, data) {
    Object.keys(data).forEach(key => {
      const element = modal.querySelector(`[data-field="${key}"]`);
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = data[key];
        } else {
          element.textContent = data[key];
        }
      }
    });
  }

  // ==================== СПЕЦИАЛЬНЫЕ МОДАЛЬНЫЕ ОКНА ====================

  showTransactionModal(title, details, onConfirm, onCancel) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'cosmic-modal-overlay';
      modal.innerHTML = `
        <div class="cosmic-modal">
          <div class="modal-header">
            <h3>🔍 ${title}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="transaction-details">
              ${Object.entries(details).map(([key, value]) => 
                `<div class="detail-row">
                  <span class="detail-label">${key}:</span>
                  <span class="detail-value">${value}</span>
                </div>`
              ).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="cosmic-btn secondary cancel-btn">✖ Отмена</button>
            <button class="cosmic-btn primary confirm-btn">✅ Подтвердить</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.classList.add('active');
      document.body.classList.add('modal-open');

      const confirmBtn = modal.querySelector('.confirm-btn');
      const cancelBtn = modal.querySelector('.cancel-btn');
      const closeBtn = modal.querySelector('.modal-close');

      const cleanup = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      };

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
        if (onConfirm) onConfirm();
      });

      [cancelBtn, closeBtn].forEach(btn => {
        btn.addEventListener('click', () => {
          cleanup();
          resolve(false);
          if (onCancel) onCancel();
        });
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
          if (onCancel) onCancel();
        }
      });
    });
  }

  showTransactionProgress(txHash, networkExplorer) {
    const modalId = `progress_${Date.now()}`;
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
    modal.id = modalId;
    modal.innerHTML = `
      <div class="cosmic-modal">
        <div class="modal-header">
          <h3>⏳ Обработка транзакции</h3>
        </div>
        <div class="modal-body">
          <div class="transaction-progress">
            <div class="progress-spinner"></div>
            <p>Транзакция отправлена в блокчейн...</p>
            <div class="tx-hash">
              <small>TX Hash:</small>
              <code>${this.formatAddress(txHash, 10, 10)}</code>
            </div>
            <a href="${networkExplorer}/tx/${txHash}" target="_blank" class="cosmic-btn secondary">
              🔗 Посмотреть в эксплорере
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    this.progressModals.set(modalId, modal);

    return {
      modal,
      updateStatus: (status, success = false) => {
        const progressDiv = modal.querySelector('.transaction-progress');
        if (success) {
          progressDiv.innerHTML = `
            <div class="success-icon">✅</div>
            <p>Транзакция успешно выполнена!</p>
            <div class="tx-hash">
              <small>TX Hash:</small>
              <code>${this.formatAddress(txHash, 10, 10)}</code>
            </div>
            <div class="modal-footer">
              <a href="${networkExplorer}/tx/${txHash}" target="_blank" class="cosmic-btn secondary">
                🔗 Посмотреть в эксплорере
              </a>
              <button class="cosmic-btn primary close-progress-btn">Закрыть</button>
            </div>
          `;
          
          modal.querySelector('.close-progress-btn').addEventListener('click', () => {
            this.closeProgressModal(modalId);
          });
        } else {
          progressDiv.querySelector('p').textContent = status;
        }
      },
      close: () => {
        this.closeProgressModal(modalId);
      }
    };
  }

  closeProgressModal(modalId) {
    const modal = this.progressModals.get(modalId);
    if (modal) {
      modal.remove();
      document.body.classList.remove('modal-open');
      this.progressModals.delete(modalId);
    }
  }

  // ==================== УВЕДОМЛЕНИЯ ====================

  setupNotifications() {
    this.notificationContainer = document.getElementById('notifications');
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notifications';
      this.notificationContainer.className = 'notifications-container';
      document.body.appendChild(this.notificationContainer);
    }
  }

  showNotification(message, type = 'info', duration = 5000, actions = []) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Иконки для разных типов
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      wallet: '👛',
      contract: '📜',
      transaction: '💰',
      admin: '⚙️',
      token: '🪙'
    };
    
    const icon = icons[type] || icons.info;
    
    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = `
        <div class="notification-actions">
          ${actions.map(action => 
            `<button class="notification-action" data-action="${action.id}">${action.label}</button>`
          ).join('')}
        </div>
      `;
    }
    
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icon}</span>
        <div class="notification-message">${message}</div>
        ${actionsHTML}
      </div>
    `;
    
    // Обработчики для действий
    actions.forEach(action => {
      const btn = notification.querySelector(`[data-action="${action.id}"]`);
      if (btn && action.callback) {
        btn.addEventListener('click', () => {
          action.callback();
          this.removeNotification(notification);
        });
      }
    });
    
    this.notificationContainer.appendChild(notification);
    this.notifications.push(notification);
    
    // Анимация появления
    setTimeout(() => {
      notification.classList.add('notification-slide-in');
    }, 10);
    
    // Автоматическое удаление
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }
    
    // Удаление по клику
    notification.addEventListener('click', (e) => {
      if (!e.target.classList.contains('notification-action')) {
        this.removeNotification(notification);
      }
    });
    
    return notification;
  }

  removeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.classList.add('notification-slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
          this.notifications = this.notifications.filter(n => n !== notification);
        }
      }, 300);
    }
  }

  showProgressNotification(message, type = 'info') {
    const notification = this.showNotification(message, type, 0);
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    progressBar.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div>';
    
    notification.querySelector('.notification-content').appendChild(progressBar);
    
    return {
      notification,
      updateProgress: (percentage) => {
        const fill = progressBar.querySelector('.progress-fill');
        fill.style.width = `${percentage}%`;
      },
      complete: (success = true, finalMessage = '') => {
        if (finalMessage) {
          notification.querySelector('.notification-message').textContent = finalMessage;
        }
        notification.className = `notification ${success ? 'success' : 'error'}`;
        setTimeout(() => {
          this.removeNotification(notification);
        }, 3000);
      }
    };
  }

  // ==================== НАСТРОЙКА UI ДЛЯ КОНТРАКТОВ ====================

  setupContractInteractionUI() {
    // Настройка кнопок покупки уровней
    document.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const level = parseInt(btn.dataset.level);
        await this.handleLevelPurchase(level);
      });
    });

    // Настройка кнопок пакетов
    document.querySelectorAll('[data-package]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packageType = parseInt(btn.dataset.package);
        await this.handlePackageActivation(packageType);
      });
    });

    // Настройка кнопки регистрации
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this.handleRegistration();
      });
    }

    // Настройка кнопки квартальной оплаты
    const quarterlyBtn = document.getElementById('quarterlyPaymentBtn');
    if (quarterlyBtn) {
      quarterlyBtn.addEventListener('click', () => {
        this.handleQuarterlyPayment();
      });
    }
  }

  // ИСПРАВЛЕНО: Правильная обработка покупки уровня с новыми ценами
  async handleLevelPurchase(level) {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    if (!window.contractManager?.isContractsReady()) {
      this.showNotification('📜 Контракты не готовы', 'error');
      return;
    }

    try {
      const levelBtn = document.querySelector(`[data-level="${level}"]`);
      this.showLoader(levelBtn);
      
      // ИСПРАВЛЕНО: Используем правильные цены из contractManager
      const price = await window.contractManager.getLevelPrice(level);
      const priceInBNB = window.web3Manager.fromWei(price);
      
      // Показываем модальное окно подтверждения
      const confirmed = await this.showTransactionModal(
        `Покупка уровня ${level}`,
        {
          'Уровень': level,
          'Цена': `${priceInBNB} BNB`,
          'Сеть': window.web3Manager.getNetworkInfo().name,
          'Адрес': this.formatAddress(window.web3Manager.account)
        }
      );

      if (!confirmed) {
        this.hideLoader(levelBtn, `Уровень ${level}`);
        return;
      }

      // ИСПРАВЛЕНО: Используем новый метод из contractManager
      const result = await window.contractManager.buyLevel(
        level, 
        window.web3Manager.account
      );

      // Показываем прогресс
      const progressModal = this.showTransactionProgress(
        result.hash || result, 
        window.web3Manager.getNetworkInfo().explorer
      );

      // Ждем подтверждения
      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Транзакция успешна!', true);
        this.showNotification(`✅ Уровень ${level} успешно куплен!`, 'success');
        
        // Обновляем UI
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
        
        // Обновляем кнопку уровня
        if (levelBtn) {
          levelBtn.classList.add('level-active');
          levelBtn.textContent = `Уровень ${level} ✓`;
          levelBtn.disabled = true;
        }
      } else {
        throw new Error('Транзакция не удалась');
      }

    } catch (error) {
      console.error('Ошибка покупки уровня:', error);
      this.showNotification(`❌ Ошибка покупки уровня: ${error.message}`, 'error');
    } finally {
      const levelBtn = document.querySelector(`[data-level="${level}"]`);
      this.hideLoader(levelBtn, `Уровень ${level}`);
    }
  }

  // ИСПРАВЛЕНО: Правильная обработка активации пакета
  async handlePackageActivation(packageType) {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    if (!window.contractManager?.isContractsReady()) {
      this.showNotification('📜 Контракты не готовы', 'error');
      return;
    }

    // ИСПРАВЛЕНО: Правильные названия пакетов согласно ТЗ
    const packageNames = {
      1: 'MiniAdmin (1-4)',
      2: 'Admin (1-7)', 
      3: 'SuperAdmin (1-10)',
      4: 'Manager (1-12)'
    };

    try {
      const packageBtn = document.querySelector(`[data-package="${packageType}"]`);
      this.showLoader(packageBtn);

      // ИСПРАВЛЕНО: Получаем цену с учетом уже активных уровней
      const price = await window.contractManager.getPackagePrice(
        window.web3Manager.account, 
        packageType
      );
      const priceInBNB = window.web3Manager.fromWei(price);
      
      if (price === '0') {
        this.showNotification('✅ Все уровни этого пакета уже активированы', 'info');
        this.hideLoader(packageBtn, packageNames[packageType]);
        return;
      }
      
      const packageInfo = window.contractManager.getPackageInfo(packageType);
      
      const confirmed = await this.showTransactionModal(
        `Активация пакета`,
        {
          'Пакет': packageNames[packageType],
          'Цена': `${priceInBNB} BNB`,
          'Включает': `Уровни 1-${packageInfo.maxLevel}`,
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) {
        this.hideLoader(packageBtn, packageNames[packageType]);
        return;
      }

      const progressNotification = this.showProgressNotification(
        `Активация пакета ${packageNames[packageType]}...`, 
        'info'
      );

      // ИСПРАВЛЕНО: Используем правильный метод activatePackage
      const result = await window.contractManager.activatePackage(
        packageType,
        window.web3Manager.account
      );

      progressNotification.updateProgress(50);
      
      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressNotification.complete(true, `Пакет ${packageNames[packageType]} активирован!`);
        
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
        
        // Обновляем UI пакета
        if (packageBtn) {
          packageBtn.classList.add('package-active');
          packageBtn.textContent = `${packageNames[packageType]} ✓`;
          packageBtn.disabled = true;
        }
      } else {
        throw new Error('Транзакция не удалась');
      }

    } catch (error) {
      console.error('Ошибка активации пакета:', error);
      this.showNotification(`❌ Ошибка активации: ${error.message}`, 'error');
    } finally {
      const packageBtn = document.querySelector(`[data-package="${packageType}"]`);
      this.hideLoader(packageBtn, packageNames[packageType]);
    }
  }

  // НОВОЕ: Обработка регистрации
  async handleRegistration() {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    // Получаем спонсора из URL или используем F1
    const urlParams = new URLSearchParams(window.location.search);
    const sponsor = urlParams.get('ref') || window.contractManager.founders[0];

    if (!window.contractManager.isValidAddress(sponsor)) {
      this.showNotification('❌ Неверный адрес спонсора', 'error');
      return;
    }

    try {
      // Проверяем, не зарегистрирован ли уже
      const isRegistered = await window.contractManager.isUserRegistered(window.web3Manager.account);
      if (isRegistered) {
        this.showNotification('ℹ️ Вы уже зарегистрированы', 'info');
        return;
      }

      const confirmed = await this.showTransactionModal(
        'Регистрация в GlobalWay',
        {
          'Спонсор': this.formatAddress(sponsor),
          'Стоимость': 'Бесплатно',
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) return;

      const result = await window.contractManager.register(sponsor, window.web3Manager.account);
      
      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Регистрация успешна!', true);
        this.showNotification('🎉 Добро пожаловать в GlobalWay!', 'success');
        
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
      }

    } catch (error) {
      console.error('Ошибка регистрации:', error);
      this.showNotification(`❌ Ошибка регистрации: ${error.message}`, 'error');
    }
  }

  // НОВОЕ: Обработка квартальной оплаты
  async handleQuarterlyPayment() {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    try {
      const fee = await window.contractManager.getQuarterlyFee();
      const feeInBNB = window.web3Manager.fromWei(fee);

      const confirmed = await this.showTransactionModal(
        'Квартальная оплата активности',
        {
          'Стоимость': `${feeInBNB} BNB`,
          'Период': '3 месяца',
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) return;

      const result = await window.contractManager.payQuarterlyActivity(window.web3Manager.account);
      
      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Оплата успешна!', true);
        this.showNotification('✅ Квартальная активность оплачена!', 'success');
        
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
      }

    } catch (error) {
      console.error('Ошибка квартальной оплаты:', error);
      this.showNotification(`❌ Ошибка оплаты: ${error.message}`, 'error');
    }
  }

  // ==================== НАСТРОЙКА UI КОШЕЛЬКА ====================

  setupWalletUI() {
    // Кнопка подключения кошелька
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        await this.handleWalletConnection();
      });
    }

    // Кнопка отключения
    const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        this.handleWalletDisconnection();
      });
    }

    // ИСПРАВЛЕНО: Правильные обработчики событий Web3Manager
    if (window.web3Manager) {
      window.web3Manager.on('connected', (data) => {
        this.updateWalletUI(true, data);
        this.showNotification(
          `🌟 ${window.web3Manager.getWalletType()} подключен!`, 
          'wallet'
        );
      });

      window.web3Manager.on('disconnected', () => {
        this.updateWalletUI(false);
        this.showNotification('👋 Кошелек отключен', 'info');
      });

      window.web3Manager.on('accountChanged', (data) => {
        this.showNotification('🔄 Аккаунт изменен', 'wallet');
        if (window.globalWayApp) {
          window.globalWayApp.updateUserInfo();
        }
      });

      // ИСПРАВЛЕНО: Правильное имя события
      window.web3Manager.on('chainChanged', (data) => {
        const networkInfo = window.web3Manager.getNetworkInfo();
        this.showNotification(`🌐 Сеть изменена: ${networkInfo.name}`, 'wallet');
        this.updateWalletUI(true, { networkInfo });
      });
    }
  }

  async handleWalletConnection() {
    try {
      const connectBtn = document.getElementById('connectWallet');
      this.showLoader(connectBtn);
      
      const success = await window.web3Manager.connectWallet();
      
      if (!success) {
        this.showNotification('❌ Не удалось подключить кошелек', 'error');
      }
    } catch (error) {
      console.error('Ошибка подключения:', error);
      this.showNotification('❌ Ошибка подключения кошелька', 'error');
    } finally {
      const connectBtn = document.getElementById('connectWallet');
      this.hideLoader(connectBtn, 'Подключить кошелек');
    }
  }

  handleWalletDisconnection() {
    window.web3Manager.disconnectWallet();
  }

  // ИСПРАВЛЕНО: Обновленный метод updateWalletUI
  updateWalletUI(connected, data = {}) {
    const elements = {
      connectBtn: document.getElementById('connectWallet'),
      walletInfo: document.getElementById('walletInfo'),
      walletAddress: document.getElementById('walletAddress'),
      walletType: document.getElementById('walletType'),
      networkStatus: document.getElementById('networkStatus'),
      balanceDisplay: document.getElementById('balanceDisplay')
    };

    if (connected) {
      if (elements.connectBtn) elements.connectBtn.style.display = 'none';
      if (elements.walletInfo) elements.walletInfo.classList.remove('hidden');
      
      if (elements.walletAddress && window.web3Manager.account) {
        elements.walletAddress.textContent = this.formatAddress(window.web3Manager.account);
        elements.walletAddress.title = window.web3Manager.account;
      }
      
      if (elements.walletType) {
        elements.walletType.textContent = window.web3Manager.getWalletType();
      }
      
      if (elements.networkStatus) {
        const networkInfo = window.web3Manager.getNetworkInfo();
        elements.networkStatus.textContent = networkInfo.name;
        elements.networkStatus.className = window.web3Manager.isCorrectNetwork() ? 
          'network-correct' : 'network-incorrect';
      }

      // Показываем баланс
      this.updateBalance();
    } else {
      if (elements.connectBtn) elements.connectBtn.style.display = 'block';
      if (elements.walletInfo) elements.walletInfo.classList.add('hidden');
    }
  }

  async updateBalance() {
    const balanceDisplay = document.getElementById('balanceDisplay');
    if (balanceDisplay && window.web3Manager.isConnected) {
      try {
        const balance = await window.web3Manager.getFormattedBalance();
        balanceDisplay.textContent = `${balance.formatted} ${balance.symbol}`;
      } catch (error) {
        balanceDisplay.textContent = '0.0000 BNB';
      }
    }
  }

  // ==================== АДМИНСКИЙ UI ====================

  setupAdminUI() {
    // Кнопки админских функций
    const freeRegBtn = document.getElementById('freeRegistrationBtn');
    if (freeRegBtn) {
      freeRegBtn.addEventListener('click', () => {
        this.showFreeRegistrationModal();
      });
    }

    const batchRegBtn = document.getElementById('batchRegistrationBtn');
    if (batchRegBtn) {
      batchRegBtn.addEventListener('click', () => {
        this.showBatchRegistrationModal();
      });
    }

    // Проверяем права владельца при подключении кошелька
    if (window.web3Manager) {
      window.web3Manager.on('connected', async () => {
        await this.checkAdminRights();
      });
    }
  }

  async checkAdminRights() {
    if (!window.web3Manager.isConnected || !window.contractManager.isContractsReady()) {
      return;
    }

    try {
      const currentAccount = window.web3Manager.account;
      const isOwner = window.contractManager.isOwner(currentAccount);
      const isFounder = window.contractManager.isFounder(currentAccount);
      
      if (isOwner || isFounder) {
        this.toggleAdminFeatures(true);
        this.showNotification(
          `Админские права активированы ${isOwner ? '(Владелец)' : '(Основатель)'}`, 
          'admin'
        );
      } else {
        this.toggleAdminFeatures(false);
      }
    } catch (error) {
      console.error('Ошибка проверки админских прав:', error);
    }
  }

  showFreeRegistrationModal() {
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
    modal.innerHTML = `
      <div class="cosmic-modal">
        <div class="modal-header">
          <h3>Бесплатная регистрация пользователя</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="admin-form">
            <div class="form-group">
              <label for="userAddress">Адрес пользователя:</label>
              <input type="text" id="userAddress" placeholder="0x..." required>
            </div>
            <div class="form-group">
              <label for="maxLevel">Максимальный уровень:</label>
              <select id="maxLevel" required>
                <option value="4">4 (MiniAdmin)</option>
                <option value="7">7 (Admin)</option>
                <option value="10">10 (SuperAdmin)</option>
                <option value="12">12 (Manager)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cosmic-btn secondary cancel-btn">Отмена</button>
          <button class="cosmic-btn primary confirm-btn">Активировать</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    const closeBtn = modal.querySelector('.modal-close');

    const cleanup = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    [cancelBtn, closeBtn].forEach(btn => {
      btn.addEventListener('click', cleanup);
    });

    confirmBtn.addEventListener('click', async () => {
      const userAddress = modal.querySelector('#userAddress').value;
      const maxLevel = parseInt(modal.querySelector('#maxLevel').value);

      if (!window.contractManager.isValidAddress(userAddress)) {
        this.showNotification('Неверный адрес пользователя', 'error');
        return;
      }

      cleanup();
      await this.handleFreeRegistration(userAddress, maxLevel);
    });
  }

  async handleFreeRegistration(userAddress, maxLevel) {
    try {
      const confirmed = await this.showTransactionModal(
        'Бесплатная активация пользователя',
        {
          'Пользователь': this.formatAddress(userAddress),
          'Максимальный уровень': maxLevel,
          'Стоимость': 'Бесплатно (админская функция)'
        }
      );

      if (!confirmed) return;

      const result = await window.contractManager.freeRegistrationWithLevels(
        userAddress,
        maxLevel,
        window.web3Manager.account
      );

      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Пользователь успешно активирован!', true);
        this.showNotification(
          `Пользователь ${this.formatAddress(userAddress)} активирован до уровня ${maxLevel}`, 
          'admin'
        );
      }

    } catch (error) {
      console.error('Ошибка бесплатной регистрации:', error);
      this.showNotification(`Ошибка активации: ${error.message}`, 'error');
    }
  }

  showBatchRegistrationModal() {
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
    modal.innerHTML = `
      <div class="cosmic-modal">
        <div class="modal-header">
          <h3>Массовая регистрация команды</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="admin-form">
            <div class="form-group">
              <label for="teamAddresses">Адреса команды (по одному в строке):</label>
              <textarea id="teamAddresses" rows="6" placeholder="0x...&#10;0x...&#10;0x..." required></textarea>
            </div>
            <div class="form-group">
              <label for="teamSponsor">Спонсор команды:</label>
              <input type="text" id="teamSponsor" placeholder="0x..." required>
            </div>
            <div class="form-group">
              <label for="teamMaxLevel">Максимальный уровень для всех:</label>
              <select id="teamMaxLevel" required>
                <option value="4">4 (MiniAdmin)</option>
                <option value="7">7 (Admin)</option>
                <option value="10">10 (SuperAdmin)</option>
                <option value="12">12 (Manager)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cosmic-btn secondary cancel-btn">Отмена</button>
          <button class="cosmic-btn primary confirm-btn">Активировать команду</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    const closeBtn = modal.querySelector('.modal-close');

    const cleanup = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    [cancelBtn, closeBtn].forEach(btn => {
      btn.addEventListener('click', cleanup);
    });

    confirmBtn.addEventListener('click', async () => {
      const addressesText = modal.querySelector('#teamAddresses').value;
      const sponsor = modal.querySelector('#teamSponsor').value;
      const maxLevel = parseInt(modal.querySelector('#teamMaxLevel').value);

      const addresses = addressesText.split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (addresses.length === 0) {
        this.showNotification('Введите адреса команды', 'error');
        return;
      }

      const invalidAddresses = addresses.filter(addr => !window.contractManager.isValidAddress(addr));
      if (invalidAddresses.length > 0) {
        this.showNotification(`Неверные адреса: ${invalidAddresses.join(', ')}`, 'error');
        return;
      }

      if (!window.contractManager.isValidAddress(sponsor)) {
        this.showNotification('Неверный адрес спонсора', 'error');
        return;
      }

      cleanup();
      await this.handleBatchRegistration(addresses, sponsor, maxLevel);
    });
  }

  async handleBatchRegistration(addresses, sponsor, maxLevel) {
    try {
      const confirmed = await this.showTransactionModal(
        'Массовая активация команды',
        {
          'Количество пользователей': addresses.length,
          'Спонсор': this.formatAddress(sponsor),
          'Максимальный уровень': maxLevel,
          'Стоимость': 'Бесплатно (админская функция)'
        }
      );

      if (!confirmed) return;

      const result = await window.contractManager.batchFreeRegistration(
        addresses,
        sponsor,
        maxLevel,
        window.web3Manager.account
      );

      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Команда успешно активирована!', true);
        this.showNotification(
          `${addresses.length} пользователей активированы до уровня ${maxLevel}`, 
          'admin'
        );
      }

    } catch (error) {
      console.error('Ошибка массовой регистрации:', error);
      this.showNotification(`Ошибка активации команды: ${error.message}`, 'error');
    }
  }

  // ==================== ТОКЕН UI ====================

  setupTokenUI() {
    // Кнопки для работы с токенами
    const buyTokensBtn = document.getElementById('buyTokensBtn');
    if (buyTokensBtn) {
      buyTokensBtn.addEventListener('click', () => {
        this.showBuyTokensModal();
      });
    }

    const sellTokensBtn = document.getElementById('sellTokensBtn');
    if (sellTokensBtn) {
      sellTokensBtn.addEventListener('click', () => {
        this.showSellTokensModal();
      });
    }

    // Обновляем информацию о токенах при подключении
    if (window.web3Manager) {
      window.web3Manager.on('connected', () => {
        this.updateTokenInfo();
      });
    }
  }

  async updateTokenInfo() {
    const elements = {
      tokenBalance: document.getElementById('tokenBalance'),
      tokenPrice: document.getElementById('tokenPrice'),
      totalSupply: document.getElementById('totalSupply')
    };

    if (!window.web3Manager.isConnected || !window.contractManager.isContractsReady()) {
      return;
    }

    try {
      if (elements.tokenBalance) {
        const balance = await window.contractManager.getTokenBalance(window.web3Manager.account);
        const formattedBalance = window.web3Manager.fromWei(balance);
        elements.tokenBalance.textContent = `${parseFloat(formattedBalance).toFixed(2)} GWT`;
      }

      if (elements.tokenPrice) {
        const price = await window.contractManager.getTokenCurrentPrice();
        const formattedPrice = window.web3Manager.fromWei(price);
        elements.tokenPrice.textContent = `${parseFloat(formattedPrice).toFixed(6)} BNB`;
      }

      if (elements.totalSupply) {
        const supply = await window.contractManager.getTokenTotalSupply();
        const formattedSupply = window.web3Manager.fromWei(supply);
        elements.totalSupply.textContent = this.formatLargeNumber(formattedSupply);
      }

    } catch (error) {
      console.error('Ошибка обновления информации о токенах:', error);
    }
  }

  showBuyTokensModal() {
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
    modal.innerHTML = `
      <div class="cosmic-modal">
        <div class="modal-header">
          <h3>Покупка GWT токенов</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="token-form">
            <div class="form-group">
              <label for="tokenAmount">Количество токенов GWT:</label>
              <input type="number" id="tokenAmount" placeholder="100" min="1" step="1" required>
            </div>
            <div class="form-group">
              <label for="bnbAmount">Стоимость в BNB:</label>
              <input type="number" id="bnbAmount" placeholder="0.001" min="0" step="0.000001" required>
            </div>
            <div class="token-info">
              <p>Текущая цена: <span id="currentTokenPrice">Загрузка...</span></p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cosmic-btn secondary cancel-btn">Отмена</button>
          <button class="cosmic-btn primary confirm-btn">Купить токены</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Загружаем текущую цену
    this.loadCurrentTokenPrice(modal);

    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    const closeBtn = modal.querySelector('.modal-close');
    const tokenAmountInput = modal.querySelector('#tokenAmount');
    const bnbAmountInput = modal.querySelector('#bnbAmount');

    const cleanup = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    [cancelBtn, closeBtn].forEach(btn => {
      btn.addEventListener('click', cleanup);
    });

    // Автоматический расчет стоимости
    tokenAmountInput.addEventListener('input', async () => {
      const amount = tokenAmountInput.value;
      if (amount && amount > 0) {
        try {
          const cost = await this.calculateTokenPurchaseCost(amount);
          bnbAmountInput.value = window.web3Manager.fromWei(cost);
        } catch (error) {
          console.error('Ошибка расчета стоимости:', error);
        }
      }
    });

    confirmBtn.addEventListener('click', async () => {
      const tokenAmount = tokenAmountInput.value;
      const bnbAmount = bnbAmountInput.value;

      if (!tokenAmount || !bnbAmount || tokenAmount <= 0 || bnbAmount <= 0) {
        this.showNotification('Введите корректные значения', 'error');
        return;
      }

      cleanup();
      await this.handleBuyTokens(tokenAmount, bnbAmount);
    });
  }

  async loadCurrentTokenPrice(modal) {
    try {
      const price = await window.contractManager.getTokenCurrentPrice();
      const formattedPrice = window.web3Manager.fromWei(price);
      const priceElement = modal.querySelector('#currentTokenPrice');
      if (priceElement) {
        priceElement.textContent = `${parseFloat(formattedPrice).toFixed(6)} BNB`;
      }
    } catch (error) {
      console.error('Ошибка загрузки цены токена:', error);
    }
  }

  async calculateTokenPurchaseCost(tokenAmount) {
    try {
      const tokenAmountWei = window.web3Manager.toWei(tokenAmount);
      // Здесь должен быть вызов метода calculatePurchaseCost из контракта
      // Пока используем простую формулу: количество * текущая цена
      const price = await window.contractManager.getTokenCurrentPrice();
      return (BigInt(tokenAmountWei) * BigInt(price) / BigInt(window.web3Manager.toWei('1'))).toString();
    } catch (error) {
      throw error;
    }
  }

  async handleBuyTokens(tokenAmount, bnbAmount) {
    try {
      const confirmed = await this.showTransactionModal(
        'Покупка GWT токенов',
        {
          'Количество токенов': `${tokenAmount} GWT`,
          'Стоимость': `${bnbAmount} BNB`,
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) return;

      const tokenAmountWei = window.web3Manager.toWei(tokenAmount);
      const bnbAmountWei = window.web3Manager.toWei(bnbAmount);

      const result = await window.contractManager.buyTokens(
        tokenAmountWei,
        window.web3Manager.account,
        bnbAmountWei
      );

      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Токены успешно куплены!', true);
        this.showNotification(`Куплено ${tokenAmount} GWT токенов`, 'token');
        await this.updateTokenInfo();
      }

    } catch (error) {
      console.error('Ошибка покупки токенов:', error);
      this.showNotification(`Ошибка покупки: ${error.message}`, 'error');
    }
  }

  showSellTokensModal() {
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
    modal.innerHTML = `
      <div class="cosmic-modal">
        <div class="modal-header">
          <h3>Продажа GWT токенов</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="token-form">
            <div class="form-group">
              <label for="sellTokenAmount">Количество токенов для продажи:</label>
              <input type="number" id="sellTokenAmount" placeholder="100" min="1" step="1" required>
            </div>
            <div class="token-info">
              <p>Ваш баланс: <span id="userTokenBalance">Загрузка...</span></p>
              <p>Цена продажи: <span id="sellTokenPrice">Загрузка...</span></p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cosmic-btn secondary cancel-btn">Отмена</button>
          <button class="cosmic-btn primary confirm-btn">Продать токены</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Загружаем информацию о балансе и цене
    this.loadUserTokenBalance(modal);

    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    const closeBtn = modal.querySelector('.modal-close');

    const cleanup = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    [cancelBtn, closeBtn].forEach(btn => {
      btn.addEventListener('click', cleanup);
    });

    confirmBtn.addEventListener('click', async () => {
      const tokenAmount = modal.querySelector('#sellTokenAmount').value;

      if (!tokenAmount || tokenAmount <= 0) {
        this.showNotification('Введите корректное количество токенов', 'error');
        return;
      }

      cleanup();
      await this.handleSellTokens(tokenAmount);
    });
  }

  async loadUserTokenBalance(modal) {
    try {
      const balance = await window.contractManager.getTokenBalance(window.web3Manager.account);
      const formattedBalance = window.web3Manager.fromWei(balance);
      const balanceElement = modal.querySelector('#userTokenBalance');
      if (balanceElement) {
        balanceElement.textContent = `${parseFloat(formattedBalance).toFixed(2)} GWT`;
      }

      const price = await window.contractManager.getTokenCurrentPrice();
      const formattedPrice = window.web3Manager.fromWei(price);
      const priceElement = modal.querySelector('#sellTokenPrice');
      if (priceElement) {
        priceElement.textContent = `${parseFloat(formattedPrice).toFixed(6)} BNB`;
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса токенов:', error);
    }
  }

  async handleSellTokens(tokenAmount) {
    try {
      const confirmed = await this.showTransactionModal(
        'Продажа GWT токенов',
        {
          'Количество токенов': `${tokenAmount} GWT`,
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) return;

      const tokenAmountWei = window.web3Manager.toWei(tokenAmount);

      const result = await window.contractManager.sellTokens(
        tokenAmountWei,
        window.web3Manager.account
      );

      const progressModal = this.showTransactionProgress(
        result.hash || result,
        window.web3Manager.getNetworkInfo().explorer
      );

      const receipt = await window.contractManager.waitForTransaction(result.hash || result, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Токены успешно проданы!', true);
        this.showNotification(`Продано ${tokenAmount} GWT токенов`, 'token');
        await this.updateTokenInfo();
      }

    } catch (error) {
      console.error('Ошибка продажи токенов:', error);
      this.showNotification(`Ошибка продажи: ${error.message}`, 'error');
    }
  }

  // ==================== ЗАГРУЗЧИКИ И СОСТОЯНИЯ ====================

  setupLoadingStates() {
    // Настройка глобальных загрузчиков
  }

  showLoader(element, text = 'Загрузка...') {
    if (!element) return;
    
    const originalContent = element.innerHTML;
    this.loadingStates.set(element, originalContent);
    
    element.innerHTML = `
      <div class="inline-loader">
        <div class="loader-spinner"></div>
        <span>${text}</span>
      </div>
    `;
    element.disabled = true;
  }

  hideLoader(element, restoreContent = null) {
    if (!element) return;
    
    const originalContent = restoreContent || this.loadingStates.get(element);
    if (originalContent) {
      element.innerHTML = originalContent;
      this.loadingStates.delete(element);
    }
    element.disabled = false;
  }

  // Глобальный загрузчик страницы
  showPageLoader() {
    let loader = document.getElementById('page-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-loader';
      loader.innerHTML = `
        <div class="page-loader-content">
          <div class="cosmic-loader"></div>
          <p>Загрузка...</p>
        </div>
      `;
      document.body.appendChild(loader);
    }
    loader.classList.add('active');
  }

  hidePageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.remove('active');
    }
  }

  // ==================== ПОДСКАЗКИ И ТЕМЫ ====================

  setupTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      const text = element.dataset.tooltip;
      
      element.addEventListener('mouseenter', () => {
        this.showTooltip(element, text);
      });
      
      element.addEventListener('mouseleave', () => {
        this.hideTooltip(element);
      });
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    this.tooltips.set(element, tooltip);
    
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
  }

  hideTooltip(element) {
    const tooltip = this.tooltips.get(element);
    if (tooltip) {
      tooltip.classList.remove('visible');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 200);
      this.tooltips.delete(element);
    }
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('globalway_theme') || 'dark';
    this.setTheme(savedTheme);
    
    // Кнопка переключения темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('globalway_theme', theme);
    
    // Обновляем иконку кнопки темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.showNotification(`Тема изменена на ${newTheme === 'dark' ? 'темную' : 'светлую'}`, 'info', 2000);
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

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

  animateElement(element, animationClass, duration = 500) {
    if (!element) return;
    
    element.classList.add(animationClass);
    setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);
  }

  // Копирование в буфер
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Скопировано в буфер обмена', 'success', 2000);
      return true;
    } catch (error) {
      console.error('Ошибка копирования:', error);
      this.showNotification('Не удалось скопировать', 'error');
      return false;
    }
  }

  // Валидация форм
  validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.showFieldError(input, 'Обязательное поле');
        isValid = false;
      } else {
        this.clearFieldError(input);
      }
    });
    
    return isValid;
  }

  showFieldError(input, message) {
    input.classList.add('error');
    
    let errorDiv = input.parentNode.querySelector('.field-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  clearFieldError(input) {
    input.classList.remove('error');
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // Обновление счетчиков в реальном времени
  updateCounter(elementId, targetValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const difference = targetValue - startValue;
    const startTime = performance.now();
    
    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentValue = Math.floor(startValue + difference * progress);
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };
    
    requestAnimationFrame(updateValue);
  }

  // НОВАЯ ФУНКЦИЯ: Добавление админ кнопки в навигацию
  addAdminNavButton() {
    const bottomNav = document.querySelector('.bottom-nav');
    const existingAdminBtn = document.querySelector('[data-page="admin"]');
    
    if (!existingAdminBtn && bottomNav) {
      const adminBtn = document.createElement('button');
      adminBtn.className = 'nav-btn admin-only';
      adminBtn.setAttribute('data-page', 'admin');
      adminBtn.innerHTML = `
        <div class="nav-icon" style="font-size: 20px;">⚙️</div>
        <span class="nav-text">Admin</span>
      `;
      
      bottomNav.appendChild(adminBtn);
      
      adminBtn.addEventListener('click', () => {
        if (window.globalWayApp) {
          window.globalWayApp.navigateToPage('admin');
        }
      });
    }
  }

  // НОВАЯ ФУНКЦИЯ: Переключение админ функций  
  toggleAdminFeatures(isOwner) {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
      if (isOwner) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    });

    if (isOwner) {
      this.addAdminNavButton();
    } else {
      const adminBtn = document.querySelector('[data-page="admin"]');
      if (adminBtn) adminBtn.remove();
    }
  }

  // ==================== СТАТИСТИКА И МОНИТОРИНГ ====================

  async updateDashboardStats() {
    if (!window.contractManager.isContractsReady()) return;

    try {
      const overview = await window.contractManager.getContractOverview();
      
      // Обновляем счетчики
      this.updateCounter('totalUsers', parseInt(overview.totalUsers));
      this.updateCounter('activeUsers', parseInt(overview.activeUsers));
      
      // Обновляем объем
      const volumeElement = document.getElementById('totalVolume');
      if (volumeElement) {
        const volumeInBNB = window.web3Manager.fromWei(overview.totalVolume);
        volumeElement.textContent = this.formatLargeNumber(volumeInBNB) + ' BNB';
      }

      // Обновляем баланс контракта
      const balanceElement = document.getElementById('contractBalance');
      if (balanceElement) {
        const balanceInBNB = window.web3Manager.fromWei(overview.contractBalance);
        balanceElement.textContent = parseFloat(balanceInBNB).toFixed(4) + ' BNB';
      }

      // Обновляем распределение уровней
      this.updateLevelDistribution(overview.levelDistribution);

    } catch (error) {
      console.error('Ошибка обновления статистики:', error);
    }
  }

  updateLevelDistribution(distribution) {
    const chartContainer = document.getElementById('levelChart');
    if (!chartContainer || !distribution) return;

    const maxValue = Math.max(...distribution);
    
    chartContainer.innerHTML = distribution.map((count, index) => {
      const level = index + 1;
      const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
      
      return `
        <div class="level-bar" data-level="${level}">
          <div class="level-label">L${level}</div>
          <div class="level-progress">
            <div class="level-fill" style="height: ${percentage}%"></div>
          </div>
          <div class="level-count">${count}</div>
        </div>
      `;
    }).join('');
  }

  // ==================== ПОИСК И ФИЛЬТРАЦИЯ ====================

  setupSearchAndFilters() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterUsers(e.target.value);
      });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.applyFilter(filter);
        
        // Обновляем активную кнопку
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  filterUsers(searchTerm) {
    const userCards = document.querySelectorAll('.user-card');
    const term = searchTerm.toLowerCase();

    userCards.forEach(card => {
      const address = card.dataset.address?.toLowerCase() || '';
      const name = card.querySelector('.user-name')?.textContent.toLowerCase() || '';
      
      if (address.includes(term) || name.includes(term)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
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
      case 'leaders':
        return card.dataset.leaderRank > 0;
      default:
        return true;
    }
  }

  // ==================== ЭКСПОРТ И ИМПОРТ ДАННЫХ ====================

  async exportUserData() {
    if (!window.web3Manager.isConnected) {
      this.showNotification('Подключите кошелек для экспорта', 'warning');
      return;
    }

    try {
      this.showPageLoader();
      
      const userData = await window.contractManager.getUserStats(window.web3Manager.account);
      
      const exportData = {
        address: window.web3Manager.account,
        network: window.web3Manager.getNetworkInfo().name,
        exportTime: new Date().toISOString(),
        ...userData
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `globalway_user_${this.formatAddress(window.web3Manager.account)}_${Date.now()}.json`;
      link.click();
      
      this.showNotification('Данные пользователя экспортированы', 'success');
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      this.showNotification('Ошибка экспорта данных', 'error');
    } finally {
      this.hidePageLoader();
    }
  }

  // ==================== УВЕДОМЛЕНИЯ О СОБЫТИЯХ ====================

  setupEventNotifications() {
    if (!window.contractManager.isContractsReady()) return;

    // Подписываемся на события контракта
    try {
      // Пример подписки на событие регистрации
      window.contractManager.contracts.globalWay.events.UserRegistered({
        filter: { user: window.web3Manager.account }
      }).on('data', (event) => {
        this.showNotification('Вы успешно зарегистрированы!', 'success');
      });

      // Подписка на активацию уровней
      window.contractManager.contracts.globalWay.events.LevelActivated({
        filter: { user: window.web3Manager.account }
      }).on('data', (event) => {
        const level = event.returnValues.level;
        this.showNotification(`Уровень ${level} активирован!`, 'success');
      });

    } catch (error) {
      console.log('События контракта недоступны:', error);
    }
  }

  // ==================== РЕЗЕРВНОЕ КОПИРОВАНИЕ СОСТОЯНИЯ ====================

  saveUIState() {
    const state = {
      theme: this.currentTheme,
      lastUpdate: Date.now(),
      notifications: this.notifications.length,
      activeModals: Object.keys(this.modals).filter(id => 
        this.modals[id].classList.contains('active')
      )
    };
    
    localStorage.setItem('ui_manager_state', JSON.stringify(state));
  }

  loadUIState() {
    try {
      const savedState = localStorage.getItem('ui_manager_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        if (state.theme) {
          this.setTheme(state.theme);
        }
        
        return state;
      }
    } catch (error) {
      console.error('Ошибка загрузки состояния UI:', error);
    }
    
    return null;
  }

  // ==================== ОБРАБОТКА ОШИБОК UI ====================

  handleUIError(error, context = 'UI operation') {
    console.error(`UI Error in ${context}:`, error);
    
    // Скрываем все загрузчики
    this.loadingStates.forEach((content, element) => {
      this.hideLoader(element);
    });
    
    // Закрываем модальные окна при критических ошибках
    if (error.message?.includes('contract') || error.message?.includes('network')) {
      Object.keys(this.modals).forEach(modalId => {
        this.hideModal(modalId);
      });
    }
    
    // Показываем пользователю понятную ошибку
    let userMessage = 'Произошла ошибка в интерфейсе';
    
    if (error.message?.includes('network')) {
      userMessage = 'Проблема с сетью. Проверьте подключение';
    } else if (error.message?.includes('contract')) {
      userMessage = 'Ошибка смарт-контракта';
    } else if (error.message?.includes('wallet')) {
      userMessage = 'Проблема с кошельком';
    }
    
    this.showNotification(userMessage, 'error');
  }

  // ==================== АДАПТИВНОСТЬ И МОБИЛЬНОСТЬ ====================

  setupResponsiveUI() {
    // Обработка изменения размера экрана
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Определение мобильного устройства
    this.isMobile = window.innerWidth <= 768;
    
    if (this.isMobile) {
      this.setupMobileUI();
    }
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        this.setupMobileUI();
      } else {
        this.setupDesktopUI();
      }
    }
    
    // Перепозиционируем модальные окна
    this.repositionModals();
  }

  setupMobileUI() {
    document.body.classList.add('mobile-ui');
    
    // Адаптируем модальные окна для мобильных
    const modals = document.querySelectorAll('.cosmic-modal');
    modals.forEach(modal => {
      modal.classList.add('mobile-modal');
    });
    
    // Упрощаем уведомления
    this.notificationContainer.classList.add('mobile-notifications');
  }

  setupDesktopUI() {
    document.body.classList.remove('mobile-ui');
    
    const modals = document.querySelectorAll('.cosmic-modal');
    modals.forEach(modal => {
      modal.classList.remove('mobile-modal');
    });
    
    this.notificationContainer.classList.remove('mobile-notifications');
  }

  repositionModals() {
    // Перепозиционируем активные модальные окна
    Object.values(this.modals).forEach(modal => {
      if (modal.classList.contains('active')) {
        const content = modal.querySelector('.modal-content, .cosmic-modal');
        if (content) {
          // Сброс позиционирования для пересчета
          content.style.transform = '';
          content.style.top = '';
          content.style.left = '';
        }
      }
    });
  }

  // ==================== ОЧИСТКА РЕСУРСОВ ====================

  destroy() {
    console.log('Уничтожение UIManager...');
    
    // Удаляем все подсказки
    this.tooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
    this.tooltips.clear();
    
    // Удаляем все уведомления
    this.notifications.forEach(notification => {
      this.removeNotification(notification);
    });
    
    // Очищаем состояния загрузки
    this.loadingStates.clear();
    
    // Закрываем все модальные окна
    Object.keys(this.modals).forEach(modalId => {
      this.hideModal(modalId);
    });
    
    // Очищаем прогресс модальные окна
    this.progressModals.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    this.progressModals.clear();
    
    // Сохраняем состояние перед уничтожением
    this.saveUIState();
    
    console.log('UIManager уничтожен');
  }
}

// ==================== ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ====================

// Глобальная инициализация
document.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
  
  // Интеграция с другими менеджерами
  if (window.web3Manager) {
    // Подписываемся на события Web3
    window.web3Manager.on('connected', (data) => {
      window.uiManager.updateWalletUI(true, data);
      window.uiManager.updateTokenInfo();
      window.uiManager.checkAdminRights();
    });
    
    window.web3Manager.on('disconnected', () => {
      window.uiManager.updateWalletUI(false);
      window.uiManager.toggleAdminFeatures(false);
    });

    window.web3Manager.on('chainChanged', (data) => {
      window.uiManager.updateWalletUI(true, data);
    });
  }
  
  // Автоматическое обновление статистики каждые 30 секунд
  setInterval(() => {
    if (window.uiManager && window.contractManager?.isContractsReady()) {
      window.uiManager.updateDashboardStats();
    }
  }, 30000);
  
  // Сохранение состояния UI каждые 5 минут
  setInterval(() => {
    if (window.uiManager) {
      window.uiManager.saveUIState();
    }
  }, 300000);
  
  // Обработка ошибок JavaScript
  window.addEventListener('error', (event) => {
    if (window.uiManager) {
      window.uiManager.handleUIError(event.error, 'Global error');
    }
  });
  
  // Очистка при закрытии страницы
  window.addEventListener('beforeunload', () => {
    if (window.uiManager) {
      window.uiManager.destroy();
    }
  });
  
  console.log('UI Manager инициализирован с интеграцией контрактов opBNB');
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}

// ==================== ГЛОБАЛЬНЫЕ УТИЛИТЫ UI ====================

// Утилиты для быстрого доступа из консоли
window.debugUI = {
  showAllModals: () => {
    Object.keys(window.uiManager.modals).forEach(id => {
      console.log(`Modal: ${id}`, window.uiManager.modals[id]);
    });
  },
  
  testNotification: (type = 'info') => {
    window.uiManager.showNotification(`Тест уведомления ${type}`, type);
  },
  
  clearNotifications: () => {
    window.uiManager.notifications.forEach(n => window.uiManager.removeNotification(n));
  },
  
  toggleTheme: () => {
    window.uiManager.toggleTheme();
  },
  
  showLoadingTest: () => {
    const btn = document.querySelector('button');
    if (btn) {
      window.uiManager.showLoader(btn, 'Тестирование...');
      setTimeout(() => window.uiManager.hideLoader(btn), 3000);
    }
  }
};

console.log('UIManager полностью инициализирован для opBNB сети');
console.log('Доступны утилиты отладки: window.debugUI');
