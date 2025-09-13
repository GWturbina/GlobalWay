// src/js/ui.js

const UI = {
    // Текущая активная страница
    currentPage: 'dashboard',
    
    // Переводы
    translations: {},
    currentLanguage: 'en',
    
    // Флаги состояния
    isLoading: false,
    isMobile: window.innerWidth < 768,

    // Инициализация UI
    async init() {
        // Загрузка переводов
        await this.loadTranslations();
        
        // Установка обработчиков событий
        this.setupEventListeners();
        
        // Определение типа устройства
        this.detectDevice();
        
        // Загрузка сохраненного языка
        const savedLanguage = localStorage.getItem('language') || 'en';
        this.setLanguage(savedLanguage);
        
        // Загрузка HTML компонентов
        await this.loadComponents();
        
        // Показ начальной страницы
        this.showPage('dashboard');
        
        // Скрытие загрузочного экрана
        this.hideLoadingScreen();
    },

    // Определение устройства
    detectDevice() {
        this.isMobile = window.innerWidth < 768;
        
        // Адаптация навигации
        const nav = document.getElementById('mainNavigation');
        if (nav) {
            if (this.isMobile) {
                nav.classList.add('bottom-nav');
                nav.classList.remove('top-nav');
            } else {
                nav.classList.add('top-nav');
                nav.classList.remove('bottom-nav');
            }
        }
        
        // Слушатель изменения размера окна
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            if (wasMobile !== this.isMobile) {
                this.detectDevice();
            }
        });
    },

    // Загрузка переводов
    async loadTranslations() {
        try {
            const languages = ['en', 'ru', 'uk'];
            for (const lang of languages) {
                const response = await fetch(`/src/translations/${lang}.json`);
                this.translations[lang] = await response.json();
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    },

    // Установка языка
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        document.getElementById('languageSelect').value = lang;
        this.updatePageTranslations();
    },

    // Обновление переводов на странице
    updatePageTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });
    },

    // Получение перевода
    getTranslation(key) {
        return this.translations[this.currentLanguage]?.[key] || key;
    },

    // Загрузка HTML компонентов
    async loadComponents() {
        const pages = ['dashboard', 'partners', 'matrix', 'tokens', 'settings', 'projects', 'admin'];
        
        for (const page of pages) {
            try {
                const response = await fetch(`/components/${page}.html`);
                const html = await response.text();
                const pageElement = document.getElementById(page);
                if (pageElement) {
                    pageElement.innerHTML = html;
                }
            } catch (error) {
                console.error(`Error loading ${page} component:`, error);
            }
        }
    },

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка подключения кошелька
        document.getElementById('connectWallet')?.addEventListener('click', async () => {
            await Web3Module.connect();
        });

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Смена языка
        document.getElementById('languageSelect')?.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Клик вне модального окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    // Показ страницы
    showPage(pageName) {
        // Проверка доступа к админке
        if (pageName === 'admin' && !Web3Module.isOwner()) {
            this.showNotification('Access denied', 'error');
            return;
        }

        // Скрытие всех страниц
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Показ выбранной страницы
        const page = document.getElementById(pageName);
        if (page) {
            page.classList.add('active');
            this.currentPage = pageName;

            // Обновление активной кнопки навигации
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === pageName) {
                    btn.classList.add('active');
                }
            });

            // Загрузка данных страницы
            this.loadPageData(pageName);
        }
    },

    // Загрузка данных для страницы
    async loadPageData(pageName) {
        if (!Web3Module.state.isConnected) {
            this.showWalletRequired();
            return;
        }

        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'partners':
                await this.loadPartnersData();
                break;
            case 'matrix':
                await this.loadMatrixData();
                break;
            case 'tokens':
                await this.loadTokensData();
                break;
            case 'settings':
                await this.loadSettingsData();
                break;
            case 'projects':
                await this.loadProjectsData();
                break;
            case 'admin':
                await this.loadAdminData();
                break;
        }
    },

    // Загрузка данных Dashboard
    async loadDashboardData() {
        const userData = await ContractsModule.loadUserData();
        if (!userData) return;

        // Обновление информации пользователя
        this.updateElement('userAddress', Web3Module.formatAddress(Web3Module.state.account));
        this.updateElement('userBalance', `${await this.getBalance()} BNB`);
        this.updateElement('userId', userData.isRegistered ? this.generateUserId(Web3Module.state.account) : 'Not registered');
        this.updateElement('userRank', this.getRankName(userData.leaderRank));
        this.updateElement('sponsorId', userData.sponsor !== '0x0000000000000000000000000000000000000000' ? 
            this.generateUserId(userData.sponsor) : 'No sponsor');

        // Реферальная ссылка
        if (userData.isRegistered) {
            const refLink = `${window.location.origin}/ref/GW${this.generateUserId(Web3Module.state.account)}`;
            this.updateElement('referralLink', refLink);
        }

        // Обновление уровней
        this.updateLevels(userData.activeLevels);

        // Квартальная активность
        this.updateQuarterlyStatus(userData.quarterlyStatus);

        // Доходы
        this.updateEarnings(userData);

        // Статистика
        await this.updateContractStats();
    },

    // Генерация ID пользователя (7 случайных цифр)
    generateUserId(address) {
        // Используем последние символы адреса для генерации псевдослучайного ID
        const seed = parseInt(address.slice(-8), 16);
        const id = (seed % 9000000) + 1000000; // Гарантирует 7 цифр
        return id.toString();
    },

    // Получение названия ранга
    getRankName(rank) {
        const ranks = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Royal'];
        return ranks[rank] || 'None';
    },

    // Обновление элемента
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    // Получение баланса
    async getBalance() {
        try {
            const balance = await Web3Module.state.web3.eth.getBalance(Web3Module.state.account);
            return parseFloat(Web3Module.fromWei(balance)).toFixed(4);
        } catch (error) {
            return '0.0000';
        }
    },

    // Обновление уровней
    updateLevels(activeLevels) {
        for (let i = 1; i <= 12; i++) {
            const levelBtn = document.querySelector(`[data-level="${i}"]`);
            if (levelBtn) {
                if (activeLevels.includes(i)) {
                    levelBtn.classList.add('active');
                    levelBtn.classList.remove('inactive');
                } else {
                    levelBtn.classList.add('inactive');
                    levelBtn.classList.remove('active');
                }
            }
        }
    },

    // Обновление квартальной активности
    updateQuarterlyStatus(status) {
        if (status) {
            this.updateElement('quarterlyStatus', status.isPaid ? 'Active' : 'Inactive');
            this.updateElement('quarterNumber', `Quarter ${status.quarterNumber}`);
            this.updateElement('nextPaymentDate', status.nextPaymentDate ? 
                status.nextPaymentDate.toLocaleDateString() : 'Not paid');
            
            // Предупреждение за 10 дней
            if (status.nextPaymentDate) {
                const daysLeft = Math.floor((status.nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 10 && daysLeft > 0) {
                    this.showNotification(`Quarterly payment due in ${daysLeft} days!`, 'warning');
                }
            }
        }
    },

    // Обновление доходов
    updateEarnings(userData) {
        const earnings = {
            'Level 1-3': '0.000',
            'Level 4-6': '0.000',
            'Level 7-9': '0.000',
            'Level 10-12': '0.000'
        };

        // Здесь должна быть логика расчета доходов по уровням
        
        Object.entries(earnings).forEach(([level, amount]) => {
            const element = document.querySelector(`[data-earnings="${level}"]`);
            if (element) {
                element.textContent = `${amount} BNB`;
            }
        });

        this.updateElement('totalEarnings', `${userData.totalEarned} BNB`);
    },

    // Обновление статистики контракта
    async updateContractStats() {
        const stats = await ContractsModule.getContractStats();
        if (stats) {
            this.updateElement('totalUsers', stats.totalUsers);
            this.updateElement('activeUsers', stats.activeUsers);
            this.updateElement('totalVolume', `${parseFloat(stats.totalVolume).toFixed(4)} BNB`);
            this.updateElement('contractBalance', `${parseFloat(stats.contractBalance).toFixed(4)} BNB`);
        }
    },

    // Обновление UI кошелька
    updateWalletUI(address, balance, walletType) {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        
        if (address) {
            connectBtn.style.display = 'none';
            walletInfo.classList.remove('hidden');
            
            this.updateElement('walletAddress', address);
            this.updateElement('walletBalance', `${balance} BNB`);
            this.updateElement('walletType', walletType);
            
            // Показ админ кнопки если владелец
            if (Web3Module.isOwner()) {
                this.showAdminButton();
            }
        } else {
            connectBtn.style.display = 'block';
            walletInfo.classList.add('hidden');
            this.hideAdminButton();
        }
    },

    // Показ кнопки админки
    showAdminButton() {
        const adminBtn = document.querySelector('[data-page="admin"]');
        if (adminBtn) {
            adminBtn.classList.remove('hidden');
            adminBtn.classList.add('admin-only');
        }
    },

    // Скрытие кнопки админки
    hideAdminButton() {
        const adminBtn = document.querySelector('[data-page="admin"]');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
    },

    // Показ уведомления
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type} notification-slide-in`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Удаление через 5 секунд
        setTimeout(() => {
            notification.classList.add('notification-slide-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Клик для закрытия
        notification.addEventListener('click', () => {
            notification.classList.add('notification-slide-out');
            setTimeout(() => notification.remove(), 300);
        });
    },

    // Показ модального окна
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Закрытие модального окна
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Закрытие всех модальных окон
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    // Показ загрузки
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        }
        this.isLoading = true;
    },

    // Скрытие загрузки
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        }
        this.isLoading = false;
    },

    // Скрытие загрузочного экрана
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => loadingScreen.remove(), 500);
            }, 1000);
        }
    },

    // Показ сообщения о необходимости подключения кошелька
    showWalletRequired() {
        const pages = document.querySelectorAll('.page.active .wallet-required');
        pages.forEach(page => {
            page.style.display = 'block';
        });
    },

    // Копирование в буфер обмена
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('Copy failed', 'error');
        }
    }
};

// Экспорт
window.UI = UI;
