/* ========================================
   GlobalWay - UI Management
   ======================================== */

window.UI = {
    // Инициализация UI
    init() {
        this.setupEventListeners();
        this.initPlanetAnimations();
        this.setupLanguageSelector();
        this.setupResponsive();
    },
    
    // Настройка слушателей событий
    setupEventListeners() {
        // Клик по планетам
        document.addEventListener('click', (event) => {
            const planet = event.target.closest('.planet');
            if (planet) {
                this.showPlanetInfo(planet.getAttribute('data-planet'));
            }
            
            // Клик вне модального окна
            const modal = event.target.closest('.modal');
            if (event.target.classList.contains('modal') && !modal) {
                this.closeModal();
            }
        });
        
        // Вход в Dapp
        const enterDapp = document.getElementById('enterDapp');
        if (enterDapp) {
            enterDapp.addEventListener('click', () => {
                this.enterDapp();
            });
        }
    },
    
    // Инициализация анимаций планет
    initPlanetAnimations() {
        const planets = document.querySelectorAll('.planet');
        planets.forEach((planet, index) => {
            // Случайная начальная позиция для анимации
            const delay = index * 4;
            planet.style.animationDelay = `${delay}s`;
        });
    },
    
    // Показ информации о планете
    showPlanetInfo(planetType) {
        const modal = document.getElementById('planetModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalText = document.getElementById('modalText');
        
        if (!modal || !modalTitle || !modalText) return;
        
        // Получаем перевод
        const title = i18n.t(`planets.${planetType}.title`);
        const text = i18n.t(`planets.${planetType}.text`);
        
        modalTitle.textContent = title;
        modalText.textContent = text;
        
        modal.style.display = 'flex';
    },
    
    // Закрытие модального окна
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    },
    
    // Вход в Dapp
    async enterDapp() {
        const landingContainer = document.getElementById('landing-container');
        const dashboardContainer = document.getElementById('dashboard-container');
        
        if (!landingContainer || !dashboardContainer) return;
        
        // Анимация перехода
        landingContainer.style.opacity = '0';
        
        setTimeout(() => {
            landingContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            dashboardContainer.style.opacity = '0';
            
            setTimeout(() => {
                dashboardContainer.style.opacity = '1';
            }, 50);
            
            // Инициализируем Dashboard
            Router.init();
        }, 300);
    },
    
    // Настройка селектора языка
    setupLanguageSelector() {
        const langSelect = document.getElementById('languageSelect');
        if (!langSelect) return;
        
        langSelect.addEventListener('change', (event) => {
            i18n.setLanguage(event.target.value);
        });
    },
    
    // Настройка адаптивности
    setupResponsive() {
        // Определение мобильного устройства
        const checkMobile = () => {
            const isMobile = window.innerWidth <= 768;
            document.body.classList.toggle('mobile', isMobile);
            
            // Перемещение навигации для мобильных
            const nav = document.getElementById('mainNav');
            if (nav) {
                if (isMobile) {
                    nav.classList.add('mobile-nav');
                } else {
                    nav.classList.remove('mobile-nav');
                }
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
    },
    
    // Показ уведомления
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    },
    
    // Получение иконки для уведомления
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },
    
    // Показ загрузки
    showLoading(container) {
        const loadingHTML = `
            <div class="loading-container">
                <div class="loading"></div>
                <p>${i18n.t('messages.loading')}</p>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.innerHTML = loadingHTML;
        }
    },
    
    // Скрытие загрузки
    hideLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        const loadingContainer = container?.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    },
    
    // Копирование в буфер обмена
    async copyToClipboard(text, showNotification = true) {
        try {
            await navigator.clipboard.writeText(text);
            if (showNotification) {
                this.showNotification(i18n.t('messages.copied'), 'success');
            }
            return true;
        } catch (error) {
            console.error('Copy error:', error);
            if (showNotification) {
                this.showNotification(i18n.t('messages.error'), 'error');
            }
            return false;
        }
    },
    
    // Форматирование адреса
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    // Создание модального окна
    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal fade-in';
        modal.innerHTML = `
            <div class="modal-content slide-in">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="UI.closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class || ''}" onclick="${btn.onclick}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        return modal;
    },
    
    // Создание таблицы
    createTable(headers, data, options = {}) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Заголовки
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Данные
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.innerHTML = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        tableWrapper.appendChild(table);
        return tableWrapper;
    },
    
    // Обновление значка уведомлений
    updateNotificationBadge(count) {
        const notificationIcon = document.getElementById('notificationIcon');
        if (!notificationIcon) return;
        
        const badge = notificationIcon.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            notificationIcon.style.display = count > 0 ? 'block' : 'none';
        }
    },
    
    // Анимация числа
    animateNumber(element, start, end, duration = 1000) {
        const startTime = Date.now();
        const difference = end - start;
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = start + (difference * progress);
            element.textContent = i18n.formatNumber(currentValue, 4);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
};
