// src/js/contracts.js

const ContractsModule = {
    // Адреса контрактов
    addresses: {
        GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
        GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
        GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4'
    },

    // Экземпляры контрактов
    contracts: {
        globalWay: null,
        gwtToken: null,
        globalWayStats: null
    },

    // ABI контрактов
    abis: {
        globalWay: null,
        gwtToken: null,
        globalWayStats: null
    },

    // Состояние
    initialized: false,
    userCache: null,
    lastCacheUpdate: 0,
    cacheTimeout: 30000, // 30 секунд

    // Инициализация контрактов
    async init() {
        try {
            // Загрузка ABI
            await this.loadABIs();

            // Проверка Web3
            if (!Web3Module.state.web3) {
                console.error('Web3 not initialized');
                return false;
            }

            // Создание экземпляров контрактов
            this.contracts.globalWay = new Web3Module.state.web3.eth.Contract(
                this.abis.globalWay,
                this.addresses.GlobalWay
            );

            this.contracts.gwtToken = new Web3Module.state.web3.eth.Contract(
                this.abis.gwtToken,
                this.addresses.GWTToken
            );

            this.contracts.globalWayStats = new Web3Module.state.web3.eth.Contract(
                this.abis.globalWayStats,
                this.addresses.GlobalWayStats
            );

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Contracts initialization error:', error);
            return false;
        }
    },

    // Загрузка ABI
    async loadABIs() {
        try {
            const [globalWayABI, gwtTokenABI, globalWayStatsABI] = await Promise.all([
                fetch('/contracts/GlobalWay.json').then(r => r.json()),
                fetch('/contracts/GWTToken.json').then(r => r.json()),
                fetch('/contracts/GlobalWayStats.json').then(r => r.json())
            ]);

            this.abis.globalWay = globalWayABI.abi;
            this.abis.gwtToken = gwtTokenABI.abi;
            this.abis.globalWayStats = globalWayStatsABI.abi;
        } catch (error) {
            console.error('Error loading ABIs:', error);
            throw error;
        }
    },

    // ==================== ЧТЕНИЕ ДАННЫХ ====================

    // Загрузка данных пользователя
    async loadUserData(forceRefresh = false) {
        const account = Web3Module.state.account;
        if (!account || !this.initialized) return null;

        // Проверка кэша
        const now = Date.now();
        if (!forceRefresh && this.userCache && (now - this.lastCacheUpdate) < this.cacheTimeout) {
            return this.userCache;
        }

        try {
            // Получение полной информации о пользователе
            const userInfo = await this.contracts.globalWayStats.methods
                .getUserFullInfo(account)
                .call();

            // Получение дополнительных данных
            const [quarterlyStatus, investmentStats] = await Promise.all([
                this.getQuarterlyStatus(account),
                this.getInvestmentStats(account)
            ]);

            // Формирование объекта данных
            const userData = {
                isRegistered: userInfo.isRegistered,
                sponsor: userInfo.sponsor,
                registrationTime: userInfo.registrationTime,
                lastActivity: userInfo.lastActivity,
                personalInvites: userInfo.personalInvites,
                totalEarned: Web3Module.fromWei(userInfo.totalEarned),
                leaderRank: userInfo.leaderRank,
                activeLevels: userInfo.activeLevels.map(l => parseInt(l)),
                referrals: userInfo.referrals,
                charityAccount: userInfo.charityAccount,
                techAccount1: userInfo.techAccount1,
                techAccount2: userInfo.techAccount2,
                quarterlyStatus: quarterlyStatus,
                investmentStats: investmentStats
            };

            // Кэширование
            this.userCache = userData;
            this.lastCacheUpdate = now;

            // Сохранение в localStorage для оффлайн
            localStorage.setItem('userDataCache', JSON.stringify(userData));
            localStorage.setItem('userDataCacheTime', now.toString());

            return userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            
            // Попытка загрузить из localStorage
            const cachedData = localStorage.getItem('userDataCache');
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            
            return null;
        }
    },

    // Проверка квартальной активности
    async getQuarterlyStatus(account) {
        try {
            const user = await this.contracts.globalWay.methods.users(account).call();
            const currentQuarter = Math.floor(Date.now() / 1000 / 86400 / 90);
            const userQuarter = parseInt(user.quarterlyCounter);
            
            return {
                isPaid: userQuarter >= currentQuarter,
                nextPaymentDate: new Date((userQuarter + 1) * 90 * 86400 * 1000),
                quarterNumber: userQuarter
            };
        } catch (error) {
            console.error('Error checking quarterly status:', error);
            return { isPaid: false, nextPaymentDate: null, quarterNumber: 0 };
        }
    },

    // Получение статистики инвестиций
    async getInvestmentStats(account) {
        try {
            return await this.contracts.globalWayStats.methods
                .getInvestmentStats(account)
                .call();
        } catch (error) {
            console.error('Error getting investment stats:', error);
            return null;
        }
    },

    // Получение цены уровня
    async getLevelPrice(level) {
        try {
            const price = await this.contracts.globalWay.methods
                .levelPrices(level)
                .call();
            return Web3Module.fromWei(price);
        } catch (error) {
            console.error('Error getting level price:', error);
            return '0';
        }
    },

    // Расчет стоимости нескольких уровней
    async calculateMultipleLevelsPrice(fromLevel, toLevel, userLevels = []) {
        let totalPrice = 0;
        
        for (let i = fromLevel; i <= toLevel; i++) {
            if (!userLevels.includes(i)) {
                const price = await this.contracts.globalWay.methods
                    .levelPrices(i)
                    .call();
                totalPrice += parseFloat(Web3Module.fromWei(price));
            }
        }
        
        return totalPrice.toFixed(4);
    },

    // Получение статистики контракта
    async getContractStats() {
        try {
            const overview = await this.contracts.globalWayStats.methods
                .getContractOverview()
                .call();
            
            return {
                totalUsers: overview.totalUsers,
                totalVolume: Web3Module.fromWei(overview.totalVolume),
                activeUsers: overview.activeUsers,
                contractBalance: Web3Module.fromWei(overview.contractBalance),
                levelDistribution: overview.levelDistribution
            };
        } catch (error) {
            console.error('Error getting contract stats:', error);
            return null;
        }
    },

    // Получение данных о токене
    async getTokenData() {
        try {
            const account = Web3Module.state.account;
            
            const [totalSupply, price, balance, marketCap, volume] = await Promise.all([
                this.contracts.gwtToken.methods.totalSupply().call(),
                this.contracts.gwtToken.methods.getCurrentPrice().call(),
                account ? this.contracts.gwtToken.methods.balanceOf(account).call() : '0',
                this.contracts.gwtToken.methods.getMarketCap().call(),
                this.contracts.gwtToken.methods.getTradingVolume().call()
            ]);
            
            return {
                totalSupply: Web3Module.fromWei(totalSupply),
                currentPrice: Web3Module.fromWei(price),
                userBalance: Web3Module.fromWei(balance),
                marketCap: Web3Module.fromWei(marketCap),
                tradingVolume: Web3Module.fromWei(volume)
            };
        } catch (error) {
            console.error('Error getting token data:', error);
            return null;
        }
    },

    // ==================== ТРАНЗАКЦИИ ====================

    // Регистрация пользователя
    async register(sponsorAddress) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            // Проверка, не зарегистрирован ли уже
            const isRegistered = await this.contracts.globalWay.methods
                .isUserRegistered(account)
                .call();
            
            if (isRegistered) {
                UI.showNotification('Already registered', 'warning');
                return false;
            }

            // Валидация адреса спонсора
            if (!Web3Module.state.web3.utils.isAddress(sponsorAddress)) {
                UI.showNotification('Invalid sponsor address', 'error');
                return false;
            }

            // Отправка транзакции
            const tx = await this.contracts.globalWay.methods
                .register(sponsorAddress)
                .send({ from: account });

            UI.showNotification('Registration successful!', 'success');
            await this.loadUserData(true);
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            UI.showNotification('Registration failed', 'error');
            return false;
        }
    },

    // Покупка одного уровня
    async buyLevel(level) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            const price = await this.contracts.globalWay.methods
                .levelPrices(level)
                .call();

            const tx = await this.contracts.globalWay.methods
                .buyLevel(level)
                .send({ 
                    from: account,
                    value: price
                });

            UI.showNotification(`Level ${level} purchased successfully!`, 'success');
            await this.loadUserData(true);
            return true;
        } catch (error) {
            console.error('Buy level error:', error);
            UI.showNotification('Purchase failed', 'error');
            return false;
        }
    },

    // Покупка нескольких уровней
    async buyMultipleLevels(maxLevel) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            // Расчет общей стоимости
            const totalPrice = await this.contracts.globalWay.methods
                .calculateBulkPrice(maxLevel)
                .call({ from: account });

            const tx = await this.contracts.globalWay.methods
                .buyLevelsBulk(maxLevel)
                .send({ 
                    from: account,
                    value: totalPrice
                });

            UI.showNotification(`Levels 1-${maxLevel} purchased successfully!`, 'success');
            await this.loadUserData(true);
            return true;
        } catch (error) {
            console.error('Buy multiple levels error:', error);
            UI.showNotification('Purchase failed', 'error');
            return false;
        }
    },

    // Оплата квартальной активности
    async payQuarterly(charityAddress = null) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            const quarterlyFee = await this.contracts.globalWay.methods
                .QUARTERLY_FEE()
                .call();

            // Если указан адрес благотворительности, сначала устанавливаем его
            if (charityAddress && Web3Module.state.web3.utils.isAddress(charityAddress)) {
                // Здесь должна быть функция установки charity адреса если она есть в контракте
            }

            const tx = await this.contracts.globalWay.methods
                .payQuarterlyActivity()
                .send({ 
                    from: account,
                    value: quarterlyFee
                });

            UI.showNotification('Quarterly payment successful!', 'success');
            await this.loadUserData(true);
            return true;
        } catch (error) {
            console.error('Quarterly payment error:', error);
            UI.showNotification('Payment failed', 'error');
            return false;
        }
    },

    // Покупка токенов
    async buyTokens(tokenAmount) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            // Расчет стоимости в BNB
            const cost = await this.contracts.gwtToken.methods
                .calculatePurchaseCost(Web3Module.toWei(tokenAmount))
                .call();

            const tx = await this.contracts.gwtToken.methods
                .buyTokens(Web3Module.toWei(tokenAmount))
                .send({ 
                    from: account,
                    value: cost
                });

            UI.showNotification('Tokens purchased successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Buy tokens error:', error);
            UI.showNotification('Purchase failed', 'error');
            return false;
        }
    },

    // Продажа токенов
    async sellTokens(tokenAmount) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            const tx = await this.contracts.gwtToken.methods
                .sellTokens(Web3Module.toWei(tokenAmount))
                .send({ from: account });

            UI.showNotification('Tokens sold successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Sell tokens error:', error);
            UI.showNotification('Sale failed', 'error');
            return false;
        }
    },

    // ==================== АДМИН ФУНКЦИИ ====================

    // Бесплатная регистрация (только для владельца)
    async freeRegistration(userAddress, sponsorAddress, maxLevel) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can perform this action');
            }

            const tx = await this.contracts.globalWay.methods
                .freeRegistrationWithLevels(userAddress, maxLevel)
                .send({ from: Web3Module.state.account });

            UI.showNotification('Free registration successful!', 'success');
            return true;
        } catch (error) {
            console.error('Free registration error:', error);
            UI.showNotification('Registration failed', 'error');
            return false;
        }
    },

    // Массовая регистрация (только для владельца)
    async batchRegistration(users, sponsor, maxLevel) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can perform this action');
            }

            const tx = await this.contracts.globalWay.methods
                .batchFreeRegistration(users, sponsor, maxLevel)
                .send({ from: Web3Module.state.account });

            UI.showNotification('Batch registration successful!', 'success');
            return true;
        } catch (error) {
            console.error('Batch registration error:', error);
            UI.showNotification('Registration failed', 'error');
            return false;
        }
    }
};

// Экспорт
window.ContractsModule = ContractsModule;
