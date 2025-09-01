// ==================== UI УПРАВЛЕНИЕ ====================

class UIManager {
  constructor() {
    this.modals = {};
    this.notifications = [];
    this.loadingStates = new Map();
    this.tooltips = new Map();
    this.currentTheme = 'dark';
    
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
    console.log('🎨 UIManager инициализирован');
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

  // НОВАЯ ФУНКЦИЯ: Заполнение данных в модальное окно
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

  // ==================== СПЕЦИАЛЬНЫЕ МОДАЛЬНЫЕ ОКНА ДЛЯ КОНТРАКТОВ ====================

  // НОВАЯ ФУНКЦИЯ: Модальное окно подтверждения транзакции
  showTransactionModal(title, details, onConfirm, onCancel) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'cosmic-modal-overlay';
      modal.innerHTML = `
        <div class="cosmic-modal">
          <div class="modal-header">
            <h3>🔐 ${title}</h3>
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
            <button class="cosmic-btn secondary cancel-btn">❌ Отмена</button>
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

  // НОВАЯ ФУНКЦИЯ: Модальное окно прогресса транзакции
  showTransactionProgress(txHash, networkExplorer) {
    const modal = document.createElement('div');
    modal.className = 'cosmic-modal-overlay';
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
            modal.remove();
            document.body.classList.remove('modal-open');
          });
        } else {
          progressDiv.querySelector('p').textContent = status;
        }
      },
      close: () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      }
    };
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
      transaction: '💰'
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

  // НОВАЯ ФУНКЦИЯ: Уведомление с прогрессом
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
        const level = btn.dataset.level;
        await this.handleLevelPurchase(level);
      });
    });

    // Настройка кнопок пакетов
    document.querySelectorAll('[data-package]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packageType = btn.dataset.package;
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
  }

  // НОВАЯ ФУНКЦИЯ: Обработка покупки уровня
  async handleLevelPurchase(level) {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    try {
      this.showLoader(document.querySelector(`[data-level="${level}"]`));
      
      // Получаем цену уровня
      const price = await window.contractManager.getLevelPrice(level);
      const priceInBNB = window.web3Manager.fromWei(price);
      
      // Показываем модальное окно подтверждения
      const confirmed = await this.showTransactionModal(
        `Покупка уровня ${level}`,
        {
          'Уровень': level,
          'Цена': `${priceInBNB} BNB`,
          'Сеть': window.web3Manager.getNetworkInfo().name
        }
      );

      if (!confirmed) {
        this.hideLoader(document.querySelector(`[data-level="${level}"]`), `Уровень ${level}`);
        return;
      }

      // Выполняем покупку
      const txHash = await window.contractManager.buyLevel(
        level, 
        window.web3Manager.account, 
        price
      );

      // Показываем прогресс
      const progressModal = this.showTransactionProgress(
        txHash, 
        window.web3Manager.getNetworkInfo().explorer
      );

      // Ждем подтверждения
      const receipt = await window.web3Manager.waitForTransaction(txHash, 1);
      
      if (receipt.status) {
        progressModal.updateStatus('Транзакция успешна!', true);
        this.showNotification(`✅ Уровень ${level} успешно куплен!`, 'success');
        
        // Обновляем UI
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
      } else {
        throw new Error('Транзакция не удалась');
      }

    } catch (error) {
      console.error('Ошибка покупки уровня:', error);
      this.showNotification(`❌ Ошибка покупки уровня: ${error.message}`, 'error');
    } finally {
      this.hideLoader(document.querySelector(`[data-level="${level}"]`), `Уровень ${level}`);
    }
  }

  // НОВАЯ ФУНКЦИЯ: Обработка активации пакета
  async handlePackageActivation(packageType) {
    if (!window.web3Manager?.isConnected) {
      this.showNotification('🔗 Сначала подключите кошелек', 'warning');
      return;
    }

    const packageNames = {
      1: 'Client (1-3)',
      2: 'MiniAdmin (1-4)',
      3: 'Admin (1-7)', 
      4: 'SuperAdmin (1-10)',
      5: 'Manager (1-12)'
    };

    try {
      // Получаем цену пакета
      const price = await window.contractManager.getPackagePrice(
        window.web3Manager.account, 
        packageType
      );
      const priceInBNB = window.web3Manager.fromWei(price);
      
      const confirmed = await this.showTransactionModal(
        `Активация пакета`,
        {
          'Пакет': packageNames[packageType],
          'Цена': `${priceInBNB} BNB`,
          'Включает': `Уровни 1-${packageType === 1 ? 3 : packageType === 2 ? 4 : packageType === 3 ? 7 : packageType === 4 ? 10 : 12}`
        }
      );

      if (!confirmed) return;

      const progressNotification = this.showProgressNotification(
        `Активация пакета ${packageNames[packageType]}...`, 
        'info'
      );

      const txHash = await window.contractManager.activatePackage(
        packageType,
        window.web3Manager.account,
        price
      );

      progressNotification.updateProgress(50);
      
      const receipt = await window.web3Manager.waitForTransaction(txHash, 1);
      
      if (receipt.status) {
        progressNotification.complete(true, `Пакет ${packageNames[packageType]} активирован!`);
        
        if (window.globalWayApp) {
          await window.globalWayApp.updateUserInfo();
        }
      } else {
        throw new Error('Транзакция не удалась');
      }

    } catch (error) {
      console.error('Ошибка активации пакета:', error);
      this.showNotification(`❌ Ошибка активации: ${error.message}`, 'error');
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

    // Обработка событий Web3
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

      window.web3Manager.on('accountChanged', () => {
        this.showNotification('🔄 Аккаунт изменен', 'wallet');
      });

      window.web3Manager.on('chainChanged', () => {
        const network = window.web3Manager.getNetworkInfo();
        this.showNotification(`🌐 Сеть изменена: ${network.name}`, 'wallet');
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

  updateWalletUI(connected, data = {}) {
    const elements = {
      connectBtn: document.getElementById('connectWallet'),
      walletInfo: document.getElementById('walletInfo'),
      walletAddress: document.getElementById('walletAddress'),
      walletType: document.getElementById('walletType'),
      networkStatus: document.getElementById('networkStatus')
    };

    if (connected) {
      if (elements.connectBtn) elements.connectBtn.style.display = 'none';
      if (elements.walletInfo) elements.walletInfo.classList.remove('hidden');
      
      if (elements.walletAddress && data.account) {
        elements.walletAddress.textContent = this.formatAddress(data.account);
      }
      
      if (elements.walletType) {
        elements.walletType.textContent = window.web3Manager.getWalletType();
      }
      
      if (elements.networkStatus) {
        const network = window.web3Manager.getNetworkInfo();
        elements.networkStatus.textContent = network.name;
        elements.networkStatus.className = window.web3Manager.isCorrectNetwork() ? 
          'network-correct' : 'network-incorrect';
      }
    } else {
      if (elements.connectBtn) elements.connectBtn.style.display = 'block';
      if (elements.walletInfo) elements.walletInfo.classList.add('hidden');
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
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('globalway_theme', theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  formatAddress(address, start = 6, end = 4) {
    if (!address) return '0x000...000';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
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
      this.showNotification('📋 Скопировано в буфер обмена', 'success', 2000);
      return true;
    } catch (error) {
      console.error('Ошибка копирования:', error);
      this.showNotification('❌ Не удалось скопировать', 'error');
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

  // Очистка ресурсов
  destroy() {
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
    
    console.log('🗑️ UIManager destroyed');
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
    });
    
    window.web3Manager.on('disconnected', () => {
      window.uiManager.updateWalletUI(false);
    });
  }
  
  console.log('🎨 UI Manager инициализирован с интеграцией контрактов');
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
