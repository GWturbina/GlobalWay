/* ========================================
   GlobalWay - Main Application
   ======================================== */

window.GlobalWayApp = {
    // Состояние приложения
    state: {
        initialized: false,
        user: null,
        isLoading: true
    },
    
    // Инициализация приложения
    async init() {
        try {
            console.log('GlobalWay App initializing...');
            
            // Показываем загрузку
            this.showInitialLoading();
            
            // Инициализируем базу данных
            await StorageManager.initDB();
            
            // Инициализируем i18n
            await i18n.init();
            
            // Инициализируем Web3
            await Web3Manager.init();
            
            // Инициализируем контракты
            await ContractManager.init();
            
            // Инициализируем UI
            UI.init();
            
            // Инициализируем авторизацию
            await Auth.init();
            
            // Регистрируем Service Worker для PWA
            await this.registerServiceWorker();
            
            // Устанавливаем обработчики событий
            this.setupEventListeners();
            
            // Проверяем автоподключение кошелька
            await this.checkAutoConnect();
            
            this.state.initialized = true;
            this.hideInitialLoading();
            
            console.log('GlobalWay App initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showInitError(error);
        }
    },
    
    // Показать начальную загрузку
    showInitialLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.style.opacity = '0.5';
        }
    },
    
    // Скрыть начальную загрузку
    hideInitialLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.style.opacity = '1';
        }
        this.state.isLoading = false;
    },
    
    // Показать ошибку инициализации
    showInitError(error) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="init-error">
                <h2>Initialization Error</h2>
                <p>${error.message || 'Failed to initialize application'}</p>
                <button onclick="location.reload()">Reload</button>
            </div>
        `;
    },
    
    // Регистрация Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Проверка обновлений
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            UI.showNotification('New version available! Refresh to update.', 'info');
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Событие подключения кошелька
        window.addEventListener('walletConnected', async (event) => {
            const { account, balance } = event.detail;
            await this.handleWalletConnected(account, balance);
        });
        
        // Событие отключения кошелька
        window.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnected();
        });
        
        // Событие смены аккаунта
        window.addEventListener('accountChanged', async (event) => {
            const { account } = event.detail;
            await this.handleAccountChanged(account);
        });
        
        // Событие смены языка
        window.addEventListener('languageChanged', () => {
            if (Router.currentPage) {
                Router.refresh();
            }
        });
        
        // Событие смены страницы
        window.addEventListener('pageChanged', (event) => {
            this.updatePageTitle(event.detail.page);
        });
        
        // Обработка офлайн/онлайн
        window.addEventListener('online', () => {
            UI.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            UI.showNotification('No internet connection', 'warning');
        });
    },
    
    // Проверка автоподключения
    async checkAutoConnect() {
        const savedWallet = localStorage.getItem('walletConnected');
        if (savedWallet === 'true' && Web3Manager.provider) {
            try {
                await Web3Manager.reconnect();
            } catch (error) {
                console.error('Auto-connect failed:', error);
            }
        }
    },
    
    // Обработка подключения кошелька
    async handleWalletConnected(account, balance) {
        try {
            // Проверяем регистрацию пользователя
            const userData = await ContractManager.getUserData(account);
            
            // Получаем или создаем ID пользователя
            let user = await StorageManager.getUserByAddress(account);
            
            if (!user && userData && userData.isRegistered) {
                // Сохраняем пользователя в локальной базе
                user = await StorageManager.saveUser({
                    address: account.toLowerCase(),
                    id: StorageManager.generateUserId(),
                    registrationTime: userData.registrationTime,
                    sponsor: userData.sponsor
                });
            }
            
            this.state.user = {
                address: account,
                id: user?.id || null,
                balance: balance,
                isRegistered: userData?.isRegistered || false,
                userData: userData
            };
            
            // Обновляем UI
            this.updateUserInterface();
            
            // Проверяем админские права
            await this.checkAdminAccess();
            
        } catch (error) {
            console.error('Handle wallet connected error:', error);
        }
    },
    
    // Обработка отключения кошелька
    handleWalletDisconnected() {
        this.state.user = null;
        this.updateUserInterface();
        
        // Скрываем админскую кнопку
        const adminButton = document.querySelector('.nav-item.admin-only');
        if (adminButton) {
            adminButton.style.display = 'none';
        }
    },
    
    // Обработка смены аккаунта
    async handleAccountChanged(account) {
        if (!account) {
            this.handleWalletDisconnected();
            return;
        }
        
        const balance = await Web3Manager.getBalance(account);
        await this.handleWalletConnected(account, balance);
    },
    
    // Проверка админского доступа
    async checkAdminAccess() {
        if (!this.state.user || !this.state.user.address) return;
        
        const hasAccess = await ContractManager.hasAdminAccess(this.state.user.address);
        
        const adminButton = document.querySelector('.nav-item.admin-only');
        if (adminButton) {
            adminButton.style.display = hasAccess ? 'flex' : 'none';
        }
    },
    
    // Обновление пользовательского интерфейса
    updateUserInterface() {
        // Обновляем кнопку подключения кошелька
        const connectButtons = document.querySelectorAll('.connect-wallet-btn');
        connectButtons.forEach(btn => {
            if (this.state.user) {
                btn.textContent = Web3Manager.formatAddress(this.state.user.address);
                btn.classList.add('connected');
            } else {
                btn.textContent = i18n.t('dashboard.connectWallet');
                btn.classList.remove('connected');
            }
        });
        
        // Если мы на странице Dashboard, обновляем данные
        if (Router.isCurrentPage('dashboard')) {
            if (window.DashboardController) {
                window.DashboardController.updateUserData();
            }
        }
    },
    
    // Обновление заголовка страницы
    updatePageTitle(page) {
        const pageName = i18n.t(`nav.${page}`);
        document.title = `GlobalWay - ${pageName}`;
    },
    
    // Получение текущего пользователя
    getCurrentUser() {
        return this.state.user;
    },
    
    // Проверка подключения
    isConnected() {
        return Web3Manager.isConnected && this.state.user !== null;
    },
    
    // Проверка регистрации
    isRegistered() {
        return this.state.user?.isRegistered || false;
    },
    
    // Получение ID пользователя
    getUserId() {
        return this.state.user?.id || null;
    },
    
    // Генерация реферальной ссылки
    getReferralLink() {
        const userId = this.getUserId();
        if (!userId) return null;
        
        return `https://globalway.club/ref${userId}`;
    },
    
    // Форматирование ID с префиксом проекта
    formatProjectId(projectPrefix) {
        const userId = this.getUserId();
        if (!userId) return null;
        
        return StorageManager.generateProjectId(userId, projectPrefix);
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    GlobalWayApp.init();
});
