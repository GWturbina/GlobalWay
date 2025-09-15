/**
 * UI Controller для GlobalWay
 * Управляет пользовательским интерфейсом, модальными окнами, уведомлениями
 */

class UIController {
  constructor() {
    this.activeModals = [];
    this.notifications = [];
    this.currentPage = null;
    this.isPageLoading = false;
    this.initialized = false;
  }

  /**
   * Инициализация UI контроллера
   */
  async initialize() {
    try {
      this.setupGlobalEventListeners();
      this.setupModalSystem();
      this.setupNotificationSystem();
      this.setupPageNavigation();
      this.setupResponsiveHandlers();
      this.setupKeyboardShortcuts();
      
      this.initialized = true;
      console.log('🎨 UI Controller initialized');
      
      // Диспетчеризируем событие готовности UI
      window.dispatchEvent(new CustomEvent('uiReady'));
      
    } catch (error) {
      console.error('❌ Failed to initialize UI Controller:', error);
    }
  }

  /**
   * Глобальные обработчики событий
   */
  setupGlobalEventListeners() {
    // Обработка изменения размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Обработка клавиатурных событий
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Обработка кликов по документу
    document.addEventListener('click', (e) => {
      this.handleDocumentClick(e);
    });

    // Обработка потери фокуса
    window.addEventListener('blur', () => {
      this.handleWindowBlur();
    });

    // Обработка получения фокуса
    window.addEventListener('focus', () => {
      this.handleWindowFocus();
    });
  }

  /**
   * Настройка системы модальных окон
   */
  setupModalSystem() {
    // Находим все модальные окна
    this.modals = document.querySelectorAll('.modal-overlay');
    
    this.modals.forEach(modal => {
      // Закрытие по кнопке X
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeModal(modal.id);
        });
      }

      // Закрытие по клику на overlay
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });

      // Предотвращаем закрытие при клике внутри модального окна
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        modalContent.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    });
  }

  /**
   * Настройка системы уведомлений
   */
  setupNotificationSystem() {
    // Создаем контейнер для уведомлений если его нет
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    this.notificationContainer = container;
  }

  /**
   * Настройка навигации между страницами
   */
  setupPageNavigation() {
    // Обработка навигационных ссылок
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-item');
      if (navLink && navLink.href) {
        e.preventDefault();
        this.navigateToPage(navLink.href);
      }
    });

    // Определяем текущую страницу
    this.currentPage = this.getCurrentPageName();
    this.updateActiveNavigation();
  }

  /**
   * Настройка адаптивных обработчиков
   */
  setupResponsiveHandlers() {
    // Обработка ориентации устройства
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Мобильное меню
    this.setupMobileMenu();
  }

  /**
   * Настройка клавиатурных сочетаний
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC - закрытие модальных окон
      if (e.key === 'Escape') {
        this.closeTopModal();
      }

      // Ctrl/Cmd + K - поиск (будущий функционал)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openSearch();
      }

      // Ctrl/Cmd + / - справка
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.showHelp();
      }
    });
  }

  /**
   * Отображение модального окна
   */
  showModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with id '${modalId}' not found`);
      return false;
    }

    // Добавляем в стек активных модальных окон
    this.activeModals.push(modalId);

    // Применяем опции
    if (options.title) {
      const titleElement = modal.querySelector('.modal-title');
      if (titleElement) titleElement.textContent = options.title;
    }

    if (options.content) {
      const contentElement = modal.querySelector('.modal-text');
      if (contentElement) contentElement.innerHTML = options.content;
    }

    // Показываем модальное окно
    modal.classList.add('active');
    
    // Блокируем прокрутку body
    if (this.activeModals.length === 1) {
      document.body.style.overflow = 'hidden';
    }

    // Фокус на первом интерактивном элементе
    setTimeout(() => {
      const firstInput = modal.querySelector('input, button, select, textarea');
      if (firstInput) firstInput.focus();
    }, 100);

    // Событие открытия модального окна
    window.dispatchEvent(new CustomEvent('modalOpened', {
      detail: { modalId, options }
    }));

    return true;
  }

  /**
   * Закрытие модального окна
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return false;

    // Убираем из стека
    this.activeModals = this.activeModals.filter(id => id !== modalId);

    // Скрываем модальное окно
    modal.classList.remove('active');

    // Разблокируем прокрутку если это последнее модальное окно
    if (this.activeModals.length === 0) {
      document.body.style.overflow = '';
    }

    // Очищаем форму если есть
    const form = modal.querySelector('form');
    if (form) form.reset();

    // Событие закрытия модального окна
    window.dispatchEvent(new CustomEvent('modalClosed', {
      detail: { modalId }
    }));

    return true;
  }

  /**
   * Закрытие верхнего модального окна
   */
  closeTopModal() {
    if (this.activeModals.length > 0) {
      const topModalId = this.activeModals[this.activeModals.length - 1];
      this.closeModal(topModalId);
    }
  }

  /**
   * Отображение уведомления
   */
  showNotification(message, type = 'info', duration = 5000, options = {}) {
    const id = Date.now().toString();
    const notification = this.createNotificationElement(id, message, type, options);
    
    this.notificationContainer.appendChild(notification);
    this.notifications.push({ id, element: notification, type });

    // Анимация появления
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Автоматическое скрытие
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    return id;
  }

  /**
   * Создание элемента уведомления
   */
  createNotificationElement(id, message, type, options) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('data-notification-id', id);

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notification.innerHTML = `
      <span class="notification-icon">${icons[type] || icons.info}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" type="button">&times;</button>
    `;

    // Обработчик закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(id);
    });

    // Дополнительные опции
    if (options.action) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'notification-action btn-secondary btn-sm';
      actionBtn.textContent = options.actionText || 'Action';
      actionBtn.addEventListener('click', options.action);
      notification.insertBefore(actionBtn, closeBtn);
    }

    return notification;
  }

  /**
   * Удаление уведомления
   */
  removeNotification(id) {
    const notification = document.querySelector(`[data-notification-id="${id}"]`);
    if (notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  /**
   * Очистка всех уведомлений
   */
  clearNotifications() {
    this.notifications.forEach(({ id }) => {
      this.removeNotification(id);
    });
  }

  /**
   * Переход между страницами
   */
  async navigateToPage(url) {
    if (this.isPageLoading) return;

    try {
      this.isPageLoading = true;
      this.showPageLoadingIndicator();

      // Обновляем URL без перезагрузки
      history.pushState(null, '', url);
      
      // Здесь можно добавить SPA логику загрузки контента
      window.location.href = url;

    } catch (error) {
      console.error('❌ Navigation error:', error);
      this.showNotification('Failed to navigate to page', 'error');
    } finally {
      this.isPageLoading = false;
      this.hidePageLoadingIndicator();
    }
  }

  /**
   * Индикатор загрузки страницы
   */
  showPageLoadingIndicator() {
    let indicator = document.getElementById('pageLoadingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pageLoadingIndicator';
      indicator.className = 'page-loading-indicator';
      indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Loading...</span>
      `;
      document.body.appendChild(indicator);
    }
    indicator.classList.add('active');
  }

  hidePageLoadingIndicator() {
    const indicator = document.getElementById('pageLoadingIndicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
  }

  /**
   * Определение текущей страницы
   */
  getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename.replace('.html', '') || 'index';
  }

  /**
   * Обновление активной навигации
   */
  updateActiveNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      const href = item.getAttribute('href');
      if (href && href.includes(this.currentPage)) {
        item.classList.add('active');
      }
    });
  }

  /**
   * Настройка мобильного меню
   */
  setupMobileMenu() {
    const isMobile = () => window.innerWidth <= 768;
    
    if (isMobile()) {
      this.addMobileMenuBehavior();
    }
  }

  addMobileMenuBehavior() {
    const navigation = document.querySelector('.navigation');
    if (navigation) {
      // Скрытие при прокрутке вниз
      let lastScrollY = window.scrollY;
      
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          navigation.style.transform = 'translateY(100%)';
        } else {
          navigation.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
      });
    }
  }

  /**
   * Обработка изменения размера окна
   */
  handleResize() {
    // Пересчет позиций модальных окон
    this.activeModals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        this.recalculateModalPosition(modal);
      }
    });

    // Обновление мобильного поведения
    this.setupMobileMenu();
    
    // Событие изменения размера
    window.dispatchEvent(new CustomEvent('uiResize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768
      }
    }));
  }

  /**
   * Обработка изменения ориентации
   */
  handleOrientationChange() {
    // Исправление высоты viewport на мобильных
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Закрытие мобильных меню при повороте
    this.closeMobileMenus();
  }

  /**
   * Обработка нажатий клавиш
   */
  handleKeyDown(e) {
    // Предотвращение некоторых действий в модальных окнах
    if (this.activeModals.length > 0) {
      // Tab navigation внутри модального окна
      if (e.key === 'Tab') {
        this.handleModalTabNavigation(e);
      }
    }
  }

  /**
   * Обработка Tab навигации в модальных окнах
   */
  handleModalTabNavigation(e) {
    const activeModal = document.getElementById(this.activeModals[this.activeModals.length - 1]);
    if (!activeModal) return;

    const focusableElements = activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Обработка кликов по документу
   */
  handleDocumentClick(e) {
    // Закрытие выпадающих меню при клике вне их
    this.closeDropdownMenus(e);
    
    // Аналитика кликов (опционально)
    this.trackClick(e);
  }

  /**
   * Закрытие выпадающих меню
   */
  closeDropdownMenus(e) {
    const dropdowns = document.querySelectorAll('.dropdown.active');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  /**
   * Отслеживание кликов для аналитики
   */
  trackClick(e) {
    const target = e.target;
    const isButton = target.matches('button, .btn-primary, .btn-secondary');
    const isLink = target.matches('a[href]');
    
    if (isButton || isLink) {
      const elementType = isButton ? 'button' : 'link';
      const elementText = target.textContent.trim();
      const elementId = target.id;
      
      // Здесь можно отправлять данные в аналитику
      console.log('🔍 UI Interaction:', {
        type: elementType,
        text: elementText,
        id: elementId,
        page: this.currentPage,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Обработка потери фокуса окна
   */
  handleWindowBlur() {
    // Приостановка анимаций для экономии ресурсов
    document.body.classList.add('window-blurred');
  }

  /**
   * Обработка получения фокуса окна
   */
  handleWindowFocus() {
    // Возобновление анимаций
    document.body.classList.remove('window-blurred');
  }

  /**
   * Пересчет позиции модального окна
   */
  recalculateModalPosition(modal) {
    const content = modal.querySelector('.modal-content');
    if (content) {
      // Сброс стилей
      content.style.marginTop = '';
      
      // Центрирование если высота контента больше экрана
      const windowHeight = window.innerHeight;
      const contentHeight = content.offsetHeight;
      
      if (contentHeight > windowHeight * 0.9) {
        content.style.marginTop = '20px';
        content.style.marginBottom = '20px';
      }
    }
  }

  /**
   * Закрытие мобильных меню
   */
  closeMobileMenus() {
    const mobileMenus = document.querySelectorAll('.mobile-menu.active');
    mobileMenus.forEach(menu => {
      menu.classList.remove('active');
    });
  }

  /**
   * Открытие поиска (будущий функционал)
   */
  openSearch() {
    this.showNotification('Search functionality coming soon', 'info');
  }

  /**
   * Показ справки
   */
  showHelp() {
    const helpContent = `
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><kbd>Esc</kbd> - Close modal windows</li>
        <li><kbd>Ctrl/Cmd + K</kbd> - Open search</li>
        <li><kbd>Ctrl/Cmd + /</kbd> - Show this help</li>
      </ul>
      <h3>Navigation</h3>
      <ul>
        <li>Use navigation menu to switch between sections</li>
        <li>Click outside modal windows to close them</li>
        <li>Notifications auto-close after 5 seconds</li>
      </ul>
    `;

    this.showModal('helpModal', {
      title: 'Help & Shortcuts',
      content: helpContent
    });
  }

  /**
   * Утилиты для работы с формами
   */
  validateForm(formElement) {
    const requiredFields = formElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        this.highlightFieldError(field);
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    });
    
    return isValid;
  }

  highlightFieldError(field) {
    field.classList.add('field-error');
    
    // Убираем подсветку при вводе
    const removeError = () => {
      field.classList.remove('field-error');
      field.removeEventListener('input', removeError);
    };
    field.addEventListener('input', removeError);
  }

  clearFieldError(field) {
    field.classList.remove('field-error');
  }

  /**
   * Утилиты для работы с загрузкой
   */
  showLoadingState(element, text = 'Loading...') {
    if (!element) return;
    
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = `
      <span class="loading-spinner loading-spinner-sm"></span>
      ${text}
    `;
    element.classList.add('loading');
  }

  hideLoadingState(element) {
    if (!element) return;
    
    element.disabled = false;
    element.textContent = element.dataset.originalText || 'Submit';
    element.classList.remove('loading');
    delete element.dataset.originalText;
  }

  /**
   * Утилиты для анимаций
   */
  animateElement(element, animationClass, duration = 600) {
    return new Promise((resolve) => {
      element.classList.add(animationClass);
      
      setTimeout(() => {
        element.classList.remove(animationClass);
        resolve();
      }, duration);
    });
  }

  /**
   * Проверка готовности UI
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    // Удаляем все обработчики событий
    this.clearNotifications();
    this.activeModals.forEach(modalId => {
      this.closeModal(modalId);
    });
    
    this.initialized = false;
    console.log('🗑️ UI Controller destroyed');
  }
}

// Создаем глобальный экземпляр
const uiController = new UIController();

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    uiController.initialize();
  });
} else {
  uiController.initialize();
}

// Глобальная доступность
window.uiController = uiController;

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = uiController;
}
