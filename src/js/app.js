// src/js/app.js

const App = {
    // Состояние приложения
    state: {
        initialized: false,
        networkCheckInterval: null,
        dataRefreshInterval: null
    },

    // Инициализация приложения
    async init() {
        try {
            console.log('🚀 Initializing GlobalWay App...');

            // Инициализация UI
            await UI.init();

            // Инициализация Web3
            await Web3Module.init();

            // Инициализация контрактов
            if (Web3Module.state.web3) {
                await ContractsModule.init();
            }

            // Настройка обработчиков событий
            this.setupEventHandlers();

            // Запуск периодических проверок
            this.startIntervals();

            // Проверка PWA
            this.checkPWA();

            this.state.initialized = true;
            console.log('✅ App initialized successfully');

        } catch (error) {
            console.error('❌ App initialization error:', error);
            UI.showNotification('Application initialization failed', 'error');
        }
    },

    // Настройка обработчиков событий
    setupEventHandlers() {
        // Обработка покупки уровней
        document.addEventListener('click', async (e) => {
            // Покупка одного уровня
            if (e.target.matches('.level-button:not(.active)')) {
                const level = parseInt(e.target.dataset.level);
                await this.handleLevelPurchase(level);
            }

            // Быстрая покупка нескольких уровней
            if (e.target.matches('.quick-buy-btn')) {
                const maxLevel = parseInt(e.target.dataset.maxLevel);
                await this.handleMultipleLevelsPurchase(maxLevel);
            }

            // Копирование реферальной ссылки
            if (e.target.matches('.copy-btn')) {
                const input = document.getElementById('referralLink');
                if (input) {
                    await UI.copyToClipboard(input.value);
                }
            }

            // Оплата квартальной активности
            if (e.target.matches('#payQuarterly')) {
                await this.handleQuarterlyPayment();
            }
        });

        // Обработка торговли токенами
        document.getElementById('buyTokensBtn')?.addEventListener('click', async () => {
            await this.handleTokenPurchase();
        });

        document.getElementById('sellTokensBtn')?.addEventListener('click', async () => {
            await this.handleTokenSale();
        });

        // Обработка подтверждений в модальных окнах
        document.getElementById('confirmPurchase')?.addEventListener('click', async () => {
            await this.confirmLevelPurchase();
        });

        document.getElementById('confirmMultiplePurchase')?.addEventListener('click', async () => {
            await this.confirmMultipleLevelsPurchase();
        });

        document.getElementById('confirmQuarterly')?.addEventListener('click', async () => {
            await this.confirmQuarterlyPayment();
        });

        // Обработка админских функций
        if (Web3Module.isOwner()) {
            this.setupAdminHandlers();
        }
    },

    // Обработка покупки одного уровня
    async handleLevelPurchase(level) {
        if (!Web3Module.state.isConnected) {
            UI.showNotification('Please connect wallet first', 'warning');
            return;
        }

        const userData = await ContractsModule.loadUserData();
        if (!userData.isRegistered) {
            UI.showNotification('Please register first', 'warning');
            return;
        }

        // Проверка последовательности уровней
        for (let i = 1; i < level; i++) {
            if (!userData.activeLevels.includes(i)) {
                UI.showNotification(`Please purchase level ${i} first`, 'warning');
                return;
            }
        }

        // Получение цены
        const price = await ContractsModule.getLevelPrice(level);

        // Показ модального окна подтверждения
        UI.updateElement('modalLevel', level);
        UI.updateElement('modalPrice', `${price} BNB`);
        UI.showModal('levelModal');

        // Сохранение уровня для покупки
        this.state.pendingLevel = level;
    },

    // Обработка покупки нескольких уровней
    async handleMultipleLevelsPurchase(maxLevel) {
        if (!Web3Module.state.isConnected) {
            UI.showNotification('Please connect wallet first', 'warning');
            return;
        }

        const userData = await ContractsModule.loadUserData();
        if (!userData.isRegistered) {
            UI.showNotification('Please register first', 'warning');
            return;
        }

        // Определение начального уровня для покупки
        let fromLevel = 1;
        for (let i = 1; i <= maxLevel; i++) {
            if (!userData.activeLevels.includes(i)) {
                fromLevel = i;
                break;
            }
        }

        if (fromLevel > maxLevel) {
            UI.showNotification('All levels already purchased', 'info');
            return;
        }

        // Расчет общей стоимости
        const totalPrice = await ContractsModule.calculateMultipleLevelsPrice(
            fromLevel, 
            maxLevel, 
            userData.activeLevels
        );

        // Показ модального окна
        UI.updateElement('modalLevelsRange', `${fromLevel}-${maxLevel}`);
        UI.updateElement('modalTotalPrice', `${totalPrice} BNB`);
        UI.showModal('multipleLevelsModal');

        // Сохранение данных для покупки
        this.state.pendingMultipleLevels = { fromLevel, maxLevel };
    },

    // Подтверждение покупки уровня
    async confirmLevelPurchase() {
        const level = this.state.pendingLevel;
        if (!level) return;

        try {
            UI.showLoading(document.getElementById('confirmPurchase'));
            
            const success = await ContractsModule.buyLevel(level);
            
            if (success) {
                UI.closeModal('levelModal');
                await UI.loadDashboardData();
            }
        } finally {
            UI.hideLoading(document.getElementById('confirmPurchase'));
            this.state.pendingLevel = null;
        }
    },

    // Подтверждение покупки нескольких уровней
    async confirmMultipleLevelsPurchase() {
        const data = this.state.pendingMultipleLevels;
        if (!data) return;

        try {
            UI.showLoading(document.getElementById('confirmMultiplePurchase'));
            
            const success = await ContractsModule.buyMultipleLevels(data.maxLevel);
            
            if (success) {
                UI.closeModal('multipleLevelsModal');
                await UI.loadDashboardData();
            }
        } finally {
            UI.hideLoading(document.getElementById('confirmMultiplePurchase'));
            this.state.pendingMultipleLevels = null;
        }
    },

    // Обработка квартальной оплаты
    async handleQuarterlyPayment() {
        const userData = await ContractsModule.loadUserData();
        
        // Проверка, первый ли это платеж
        if (userData.quarterlyStatus.quarterNumber === 0) {
            // Показ поля для благотворительного адреса
            document.getElementById('charityAddressSection').style.display = 'block';
        } else {
            document.getElementById('charityAddressSection').style.display = 'none';
        }

        UI.showModal('quarterlyModal');
    },

    // Подтверждение квартальной оплаты
    async confirmQuarterlyPayment() {
        try {
            UI.showLoading(document.getElementById('confirmQuarterly'));
            
            const charityInput = document.getElementById('charityAddressInput');
            const charityAddress = charityInput ? charityInput.value : null;
            
            const success = await ContractsModule.payQuarterly(charityAddress);
            
            if (success) {
                UI.closeModal('quarterlyModal');
                await UI.loadDashboardData();
            }
        } finally {
            UI.hideLoading(document.getElementById('confirmQuarterly'));
        }
    },

    // Обработка покупки токенов
    async handleTokenPurchase() {
        const input = document.getElementById('buyTokenAmount');
        const amount = parseFloat(input.value);
        
        if (!amount || amount <= 0) {
            UI.showNotification('Please enter valid amount', 'warning');
            return;
        }

        try {
            UI.showLoading(document.getElementById('buyTokensBtn'));
            
            const success = await ContractsModule.buyTokens(amount);
            
            if (success) {
                input.value = '';
                await UI.loadTokensData();
            }
        } finally {
            UI.hideLoading(document.getElementById('buyTokensBtn'));
        }
    },

    // Обработка продажи токенов
    async handleTokenSale() {
        const input = document.getElementById('sellTokenAmount');
        const amount = parseFloat(input.value);
        
        if (!amount || amount <= 0) {
            UI.showNotification('Please enter valid amount', 'warning');
            return;
        }

        try {
            UI.showLoading(document.getElementById('sellTokensBtn'));
            
            const success = await ContractsModule.sellTokens(amount);
            
            if (success) {
                input.value = '';
                await UI.loadTokensData();
            }
        } finally {
            UI.hideLoading(document.getElementById('sellTokensBtn'));
        }
    },

    // Настройка админских обработчиков
    setupAdminHandlers() {
        // Бесплатная активация
        document.getElementById('freeActivateBtn')?.addEventListener('click', async () => {
            const userAddress = document.getElementById('adminUserAddress').value;
            const sponsorAddress = document.getElementById('adminSponsorAddress').value;
            const maxLevel = parseInt(document.getElementById('adminMaxLevel').value);

            if (!Web3Module.state.web3.utils.isAddress(userAddress)) {
                UI.showNotification('Invalid user address', 'error');
                return;
            }

            try {
                UI.showLoading(document.getElementById('freeActivateBtn'));
                await ContractsModule.freeRegistration(userAddress, sponsorAddress, maxLevel);
            } finally {
                UI.hideLoading(document.getElementById('freeActivateBtn'));
            }
        });

        // Массовая активация
        document.getElementById('batchActivateBtn')?.addEventListener('click', async () => {
            const usersText = document.getElementById('batchUsers').value;
            const users = usersText.split('\n').filter(addr => addr.trim());
            const sponsor = document.getElementById('batchSponsor').value;
            const maxLevel = parseInt(document.getElementById('batchMaxLevel').value);

            if (users.length === 0) {
                UI.showNotification('Please enter user addresses', 'error');
                return;
            }

            try {
                UI.showLoading(document.getElementById('batchActivateBtn'));
                await ContractsModule.batchRegistration(users, sponsor, maxLevel);
            } finally {
                UI.hideLoading(document.getElementById('batchActivateBtn'));
            }
        });
    },

    // Запуск периодических проверок
    startIntervals() {
        // Проверка сети каждые 10 секунд
        this.state.networkCheckInterval = setInterval(async () => {
            if (Web3Module.state.isConnected) {
                const correctNetwork = await Web3Module.checkAndSwitchNetwork();
                if (!correctNetwork) {
                    UI.updateElement('networkStatus', 'Wrong Network');
                } else {
                    UI.updateElement('networkStatus', 'opBNB');
                }
            }
        }, 10000);

        // Обновление данных каждые 30 секунд
        this.state.dataRefreshInterval = setInterval(async () => {
            if (Web3Module.state.isConnected && UI.currentPage === 'dashboard') {
                await UI.loadDashboardData();
            }
        }, 30000);
    },

    // Проверка PWA
    checkPWA() {
        // Проверка, установлено ли приложение
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running as PWA');
        }

        // Предложение установки
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Показ кнопки установки (если есть в UI)
            const installBtn = document.getElementById('installPWA');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', async () => {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        console.log('PWA installed');
                    }
                    deferredPrompt = null;
                });
            }
        });
    },

    // Остановка интервалов при выходе
    destroy() {
        if (this.state.networkCheckInterval) {
            clearInterval(this.state.networkCheckInterval);
        }
        if (this.state.dataRefreshInterval) {
            clearInterval(this.state.dataRefreshInterval);
        }
    }
};

// Запуск приложения при загрузке
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Очистка при выходе
window.addEventListener('beforeunload', () => {
    App.destroy();
});

// Экспорт для отладки
window.App = App;
