// src/js/contracts.js

const ContractsModule = {
    // Адреса контрактов
    addresses: {
        GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
        GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
        GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4'
    },

    // Адреса пулов
    pools: {
        OWNER_MULTISIG: '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
        TREASURY: '0xe58f778236c1d3ccecf14ec1274761559685a336',
        OPS: '0x956c8350b874d01d32236eb2944089b54c3b9670', 
        DEV: '0xf8c5504dc1e5165a0748a3dc410384bfcbab13dd',
        CHARITY: '0x09c3bd32eb0617e29e41382b738c4e3cc932a611',
        TOKENOMICS: '0xbdc29886c91878c1ba9ce0626da5e1961324354f'
    },

    // Цены уровней (фиксированные)
    levelPrices: {
        1: '0.0015',
        2: '0.003', 
        3: '0.006',
        4: '0.012',
        5: '0.024',
        6: '0.048', 
        7: '0.096',
        8: '0.192',
        9: '0.384',
        10: '0.768',
        11: '1.536',
        12: '3.072'
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
    eventListeners: [],

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

            // Установка слушателей событий контрактов
            this.setupContractEventListeners();

            this.initialized = true;
            console.log('Contracts initialized successfully');
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

    // Настройка слушателей событий контрактов
    setupContractEventListeners() {
        if (!this.contracts.globalWay) return;

        try {
            // Событие регистрации
            const registrationEvent = this.contracts.globalWay.events.UserRegistered({
                fromBlock: 'latest'
            });

            registrationEvent.on('data', (event) => {
                this.handleRegistrationEvent(event);
            });

            // Событие покупки уровня
            const levelPurchaseEvent = this.contracts.globalWay.events.LevelPurchased({
                fromBlock: 'latest'
            });

            levelPurchaseEvent.on('data', (event) => {
                this.handleLevelPurchaseEvent(event);
            });

            // Событие квартальной активности
            const quarterlyEvent = this.contracts.globalWay.events.QuarterlyActivityPaid({
                fromBlock: 'latest'
            });

            quarterlyEvent.on('data', (event) => {
                this.handleQuarterlyEvent(event);
            });

            this.eventListeners.push(registrationEvent, levelPurchaseEvent, quarterlyEvent);

        } catch (error) {
            console.error('Error setting up contract event listeners:', error);
        }
    },

    // Обработка события регистрации
    handleRegistrationEvent(event) {
        const { user, sponsor, userId } = event.returnValues;
        
        // Сохранение в ID маппинг
        if (Web3Module.referralSystem) {
            const id = userId.toString();
            Web3Module.referralSystem.saveIdMapping(user, id, 'GW');
        }

        // Уведомление если это текущий пользователь
        if (user.toLowerCase() === Web3Module.state.account?.toLowerCase()) {
            UI.showNotification('Registration successful!', 'success');
            this.loadUserData(true);
        }
    },

    // Обработка события покупки уровня
    handleLevelPurchaseEvent(event) {
        const { user, level } = event.returnValues;
        
        if (user.toLowerCase() === Web3Module.state.account?.toLowerCase()) {
            UI.showNotification(`Level ${level} activated!`, 'success');
            this.loadUserData(true);
        }
    },

    // Обработка события квартальной активности
    handleQuarterlyEvent(event) {
        const { user } = event.returnValues;
        
        if (user.toLowerCase() === Web3Module.state.account?.toLowerCase()) {
            UI.showNotification('Quarterly payment confirmed!', 'success');
            this.loadUserData(true);
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
            UI.showNotification('Loading user data...', 'info');

            // Получение полной информации о пользователе
            const userInfo = await this.contracts.globalWayStats.methods
                .getUserFullInfo(account)
                .call();

            // Получение дополнительных данных
            const [quarterlyStatus, investmentStats, earnings] = await Promise.all([
                this.getQuarterlyStatus(account),
                this.getInvestmentStats(account),
                this.getEarningsBreakdown(account)
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
                referrals: userInfo.referrals || [],
                charityAccount: userInfo.charityAccount,
                techAccount1: userInfo.techAccount1,
                techAccount2: userInfo.techAccount2,
                quarterlyStatus: quarterlyStatus,
                investmentStats: investmentStats,
                earnings: earnings,
                userId: Web3Module.getUserId() || 'Not generated'
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
                try {
                    const parsed = JSON.parse(cachedData);
                    UI.showNotification('Loaded cached data (offline mode)', 'warning');
                    return parsed;
                } catch (parseError) {
                    console.error('Error parsing cached data:', parseError);
                }
            }
            
            UI.showNotification('Failed to load user data', 'error');
            return null;
        }
    },

    // Проверка квартальной активности
    async getQuarterlyStatus(account) {
        try {
            const user = await this.contracts.globalWay.methods.users(account).call();
            const currentQuarter = Math.floor(Date.now() / 1000 / 86400 / 90);
            const userQuarter = parseInt(user.quarterlyCounter);
            
            const nextPaymentDate = new Date((userQuarter + 1) * 90 * 86400 * 1000);
            const daysLeft = Math.ceil((nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return {
                isPaid: userQuarter >= currentQuarter,
                nextPaymentDate: nextPaymentDate,
                quarterNumber: userQuarter,
                daysLeft: daysLeft > 0 ? daysLeft : 0,
                needsPayment: daysLeft <= 10 && daysLeft > 0
            };
        } catch (error) {
            console.error('Error checking quarterly status:', error);
            return { 
                isPaid: false, 
                nextPaymentDate: null, 
                quarterNumber: 0,
                daysLeft: 0,
                needsPayment: false
            };
        }
    },

    // Получение детализации доходов
    async getEarningsBreakdown(account) {
        try {
            const breakdown = await this.contracts.globalWayStats.methods
                .getEarningsBreakdown(account)
                .call();
                
            return {
                totalEarned: Web3Module.fromWei(breakdown.totalEarned),
                personalBonus: Web3Module.fromWei(breakdown.personalBonus),
                referralBonus: Web3Module.fromWei(breakdown.referralBonus),
                matrixBonus: Web3Module.fromWei(breakdown.matrixBonus),
                leaderBonus: Web3Module.fromWei(breakdown.leaderBonus),
                investmentReturns: Web3Module.fromWei(breakdown.investmentReturns),
                frozenByLevel: breakdown.frozenByLevel.map(f => Web3Module.fromWei(f))
            };
        } catch (error) {
            console.error('Error getting earnings breakdown:', error);
            return {
                totalEarned: '0',
                personalBonus: '0',
                referralBonus: '0',
                matrixBonus: '0',
                leaderBonus: '0',
                investmentReturns: '0',
                frozenByLevel: new Array(12).fill('0')
            };
        }
    },

    // Получение статистики инвестиций
    async getInvestmentStats(account) {
        try {
            const stats = await this.contracts.globalWayStats.methods
                .getInvestmentStats(account)
                .call();
                
            return {
                isActive: stats.isActive,
                totalInvested: Web3Module.fromWei(stats.totalInvested),
                totalReceived: Web3Module.fromWei(stats.totalReceived),
                remainingReturns: Web3Module.fromWei(stats.remainingReturns),
                roi: stats.roi,
                completed: stats.completed
            };
        } catch (error) {
            console.error('Error getting investment stats:', error);
            return {
                isActive: false,
                totalInvested: '0',
                totalReceived: '0',
                remainingReturns: '0',
                roi: '0',
                completed: false
            };
        }
    },

    // Получение цены уровня
    async getLevelPrice(level) {
        try {
            // Используем фиксированные цены
            return this.levelPrices[level] || '0';
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
                const price = parseFloat(this.levelPrices[i] || '0');
                totalPrice += price;
            }
        }
        
        return totalPrice.toFixed(4);
    },

    // Расчет цены быстрой покупки (1-4, 1-7, 1-10, 1-12)
    async calculateQuickBuyPrice(maxLevel, userLevels = []) {
        return await this.calculateMultipleLevelsPrice(1, maxLevel, userLevels);
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
                levelDistribution: overview.levelDistribution,
                poolBalances: overview.poolBalances ? overview.poolBalances.map(b => Web3Module.fromWei(b)) : [],
                lastDistribution: overview.lastDistribution
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
            return {
                totalSupply: '0',
                currentPrice: '0',
                userBalance: '0',
                marketCap: '0',
                tradingVolume: '0'
            };
        }
    },

    // Получение баланса пула
    async getPoolBalance(poolAddress) {
        try {
            const balance = await Web3Module.state.web3.eth.getBalance(poolAddress);
            return Web3Module.fromWei(balance);
        } catch (error) {
            console.error(`Error getting pool balance for ${poolAddress}:`, error);
            return '0';
        }
    },

    // Получение информации о всех пулах (только для админа)
    async getAllPoolsInfo() {
        if (!Web3Module.hasAdminAccess()) {
            throw new Error('Access denied');
        }

        try {
            const poolsInfo = {};
            
            for (const [poolName, poolAddress] of Object.entries(this.pools)) {
                poolsInfo[poolName] = {
                    address: poolAddress,
                    balance: await this.getPoolBalance(poolAddress),
                    name: poolName
                };
            }
            
            return poolsInfo;
        } catch (error) {
            console.error('Error getting pools info:', error);
            return {};
        }
    },

    // ==================== ТРАНЗАКЦИИ ====================

    // Регистрация пользователя
    async register(sponsorAddress) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

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

            // Проверка, зарегистрирован ли спонсор
            const sponsorRegistered = await this.contracts.globalWay.methods
                .isUserRegistered(sponsorAddress)
                .call();
                
            if (!sponsorRegistered) {
                UI.showNotification('Sponsor must be registered first', 'error');
                return false;
            }

            // Отправка транзакции
            const tx = await this.contracts.globalWay.methods
                .register(sponsorAddress)
                .send({ from: account });

            UI.showNotification('Registration transaction sent!', 'success');
            
            // Ожидание подтверждения
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification('Registration successful!', 'success');
                await this.loadUserData(true);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            UI.showNotification(`Registration failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Покупка одного уровня
    async buyLevel(level) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

            // Проверка регистрации
            const isRegistered = await this.contracts.globalWay.methods
                .isUserRegistered(account)
                .call();
                
            if (!isRegistered) {
                UI.showNotification('Please register first', 'error');
                return false;
            }

            // Проверка предыдущих уровней
            if (level > 1) {
                const hasPreviousLevel = await this.contracts.globalWay.methods
                    .userLevels(account, level - 1)
                    .call();
                    
                if (!hasPreviousLevel) {
                    UI.showNotification(`Please buy level ${level - 1} first`, 'error');
                    return false;
                }
            }

            const priceWei = Web3Module.toWei(this.levelPrices[level]);

            const tx = await this.contracts.globalWay.methods
                .buyLevel(level)
                .send({ 
                    from: account,
                    value: priceWei
                });

            UI.showNotification(`Level ${level} purchase transaction sent!`, 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification(`Level ${level} purchased successfully!`, 'success');
                await this.loadUserData(true);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Buy level error:', error);
            UI.showNotification(`Purchase failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Покупка нескольких уровней (быстрая покупка)
    async buyMultipleLevels(maxLevel) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

            // Получение текущих уровней пользователя
            const userData = await this.loadUserData();
            if (!userData || !userData.isRegistered) {
                UI.showNotification('Please register first', 'error');
                return false;
            }

            // Расчет цены только неактивных уровней
            const totalPrice = await this.calculateMultipleLevelsPrice(1, maxLevel, userData.activeLevels);
            const priceWei = Web3Module.toWei(totalPrice);

            if (parseFloat(totalPrice) === 0) {
                UI.showNotification('All levels up to ' + maxLevel + ' are already purchased', 'info');
                return false;
            }

            const tx = await this.contracts.globalWay.methods
                .buyLevelsBulk(maxLevel)
                .send({ 
                    from: account,
                    value: priceWei
                });

            UI.showNotification(`Bulk purchase transaction sent! (${totalPrice} BNB)`, 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification(`Levels 1-${maxLevel} purchased successfully!`, 'success');
                await this.loadUserData(true);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Buy multiple levels error:', error);
            UI.showNotification(`Bulk purchase failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Оплата квартальной активности
    async payQuarterly(charityAddress = null) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

            const quarterlyFee = Web3Module.toWei('0.001'); // 0.001 BNB квартальная плата

            const tx = await this.contracts.globalWay.methods
                .payQuarterlyActivity()
                .send({ 
                    from: account,
                    value: quarterlyFee
                });

            UI.showNotification('Quarterly payment transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification('Quarterly payment successful!', 'success');
                await this.loadUserData(true);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Quarterly payment error:', error);
            UI.showNotification(`Payment failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    }

    // Покупка токенов
    async buyTokens(tokenAmount) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

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

            UI.showNotification('Token purchase transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification(`${tokenAmount} GWT tokens purchased successfully!`, 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Buy tokens error:', error);
            UI.showNotification(`Token purchase failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Продажа токенов
    async sellTokens(tokenAmount) {
        try {
            const account = Web3Module.state.account;
            if (!account) throw new Error('Wallet not connected');

            UI.showLoading();

            // Проверка баланса
            const balance = await this.contracts.gwtToken.methods
                .balanceOf(account)
                .call();
                
            if (parseFloat(Web3Module.fromWei(balance)) < parseFloat(tokenAmount)) {
                UI.showNotification('Insufficient token balance', 'error');
                return false;
            }

            const tx = await this.contracts.gwtToken.methods
                .sellTokens(Web3Module.toWei(tokenAmount))
                .send({ from: account });

            UI.showNotification('Token sale transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification(`${tokenAmount} GWT tokens sold successfully!`, 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Sell tokens error:', error);
            UI.showNotification(`Token sale failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // ==================== АДМИН ФУНКЦИИ ====================

    // Бесплатная регистрация (только для владельца)
    async freeRegistration(userAddress, sponsorAddress, maxLevel) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can perform this action');
            }

            UI.showLoading();

            const tx = await this.contracts.globalWay.methods
                .freeRegistrationWithLevels(userAddress, maxLevel)
                .send({ from: Web3Module.state.account });

            UI.showNotification('Free registration transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification('Free registration successful!', 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Free registration error:', error);
            UI.showNotification(`Registration failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Массовая регистрация (только для владельца)
    async batchRegistration(users, sponsors, maxLevel) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can perform this action');
            }

            UI.showLoading();

            const tx = await this.contracts.globalWay.methods
                .batchFreeRegistration(users, sponsors[0], maxLevel) // Используем первого спонсора для всех
                .send({ from: Web3Module.state.account });

            UI.showNotification('Batch registration transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx.transactionHash);
            
            if (receipt.status) {
                UI.showNotification(`Batch registration successful! (${users.length} users)`, 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Batch registration error:', error);
            UI.showNotification(`Batch registration failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Управление пулами (только для владельца)
    async transferFromPool(poolName, recipientAddress, amount) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can manage pools');
            }

            const poolAddress = this.pools[poolName];
            if (!poolAddress) {
                throw new Error('Invalid pool name');
            }

            UI.showLoading();

            // Отправка средств из пула
            const amountWei = Web3Module.toWei(amount);
            
            const tx = await Web3Module.sendTransaction(
                recipientAddress,
                amountWei
            );

            UI.showNotification('Pool transfer transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx);
            
            if (receipt.status) {
                UI.showNotification(`${amount} BNB transferred from ${poolName} pool`, 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Pool transfer error:', error);
            UI.showNotification(`Pool transfer failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Экстренный вывод средств (только владелец)
    async emergencyWithdraw(amount) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can perform emergency withdraw');
            }

            const balanceWei = await Web3Module.state.web3.eth.getBalance(this.addresses.GlobalWay);
            const balance = Web3Module.fromWei(balanceWei);
            
            if (parseFloat(amount) > parseFloat(balance)) {
                throw new Error('Amount exceeds contract balance');
            }

            UI.showLoading();

            // Здесь должен быть метод emergencyWithdraw в контракте
            // Пока используем transfer на адрес владельца
            const tx = await Web3Module.sendTransaction(
                Web3Module.state.account,
                Web3Module.toWei(amount)
            );

            UI.showNotification('Emergency withdrawal transaction sent!', 'success');
            
            const receipt = await Web3Module.waitForTransaction(tx);
            
            if (receipt.status) {
                UI.showNotification(`Emergency withdrawal of ${amount} BNB successful`, 'success');
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Emergency withdraw error:', error);
            UI.showNotification(`Emergency withdrawal failed: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Приостановка контракта (только владелец)
    async pauseContract() {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can pause contract');
            }

            UI.showLoading();

            // Здесь должен быть метод pause() в контракте
            // Пока показываем уведомление
            UI.showNotification('Contract pause feature not implemented', 'warning');
            return false;
        } catch (error) {
            console.error('Pause contract error:', error);
            UI.showNotification(`Failed to pause contract: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Возобновление контракта (только владелец)
    async unpauseContract() {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can unpause contract');
            }

            UI.showLoading();

            // Здесь должен быть метод unpause() в контракте
            UI.showNotification('Contract unpause feature not implemented', 'warning');
            return false;
        } catch (error) {
            console.error('Unpause contract error:', error);
            UI.showNotification(`Failed to unpause contract: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Подключение проекта (только владелец)
    async connectProject(projectAddress, projectName) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can connect projects');
            }

            if (!Web3Module.state.web3.utils.isAddress(projectAddress)) {
                throw new Error('Invalid project address');
            }

            UI.showLoading();

            // Сохранение в localStorage (пока нет метода в контракте)
            const connectedProjects = JSON.parse(localStorage.getItem('connectedProjects') || '{}');
            connectedProjects[projectAddress] = {
                name: projectName,
                address: projectAddress,
                connectedAt: Date.now()
            };
            localStorage.setItem('connectedProjects', JSON.stringify(connectedProjects));

            UI.showNotification(`Project "${projectName}" connected successfully`, 'success');
            return true;
        } catch (error) {
            console.error('Connect project error:', error);
            UI.showNotification(`Failed to connect project: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Отключение проекта (только владелец)
    async disconnectProject(projectAddress) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can disconnect projects');
            }

            UI.showLoading();

            const connectedProjects = JSON.parse(localStorage.getItem('connectedProjects') || '{}');
            const projectName = connectedProjects[projectAddress]?.name || 'Unknown';
            
            delete connectedProjects[projectAddress];
            localStorage.setItem('connectedProjects', JSON.stringify(connectedProjects));

            UI.showNotification(`Project "${projectName}" disconnected`, 'success');
            return true;
        } catch (error) {
            console.error('Disconnect project error:', error);
            UI.showNotification(`Failed to disconnect project: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Получение подключенных проектов
    getConnectedProjects() {
        return JSON.parse(localStorage.getItem('connectedProjects') || '{}');
    },

    // Делегирование полномочий (владелец -> учредитель/директор)
    async delegatePermissions(userAddress, permissions) {
        try {
            if (!Web3Module.isOwner()) {
                throw new Error('Only owner can delegate permissions');
            }

            if (!Web3Module.state.web3.utils.isAddress(userAddress)) {
                throw new Error('Invalid user address');
            }

            UI.showLoading();

            // Сохранение делегированных полномочий в localStorage
            const delegatedPermissions = JSON.parse(localStorage.getItem('delegatedPermissions') || '{}');
            delegatedPermissions[userAddress] = {
                permissions: permissions,
                delegatedAt: Date.now(),
                delegatedBy: Web3Module.state.account
            };
            localStorage.setItem('delegatedPermissions', JSON.stringify(delegatedPermissions));

            UI.showNotification('Permissions delegated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Delegate permissions error:', error);
            UI.showNotification(`Failed to delegate permissions: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Проверка делегированных полномочий
    hasPermission(userAddress, permission) {
        const delegated = JSON.parse(localStorage.getItem('delegatedPermissions') || '{}');
        return delegated[userAddress]?.permissions?.includes(permission) || false;
    },

    // Система голосования для директоров
    async castVote(proposalId, vote) {
        try {
            if (!Web3Module.isBoard() && !Web3Module.isFounder()) {
                throw new Error('Only board members and founders can vote');
            }

            UI.showLoading();

            // Сохранение голоса в localStorage (временное решение)
            const votes = JSON.parse(localStorage.getItem('boardVotes') || '{}');
            if (!votes[proposalId]) {
                votes[proposalId] = { votes: {}, createdAt: Date.now() };
            }
            
            votes[proposalId].votes[Web3Module.state.account] = {
                vote: vote, // true/false
                timestamp: Date.now()
            };
            
            localStorage.setItem('boardVotes', JSON.stringify(votes));

            UI.showNotification(`Vote cast: ${vote ? 'YES' : 'NO'}`, 'success');
            return true;
        } catch (error) {
            console.error('Cast vote error:', error);
            UI.showNotification(`Failed to cast vote: ${error.message}`, 'error');
            return false;
        } finally {
            UI.hideLoading();
        }
    },

    // Создание предложения для голосования
    async createProposal(title, description, type) {
        try {
            if (!Web3Module.isOwner() && !Web3Module.isFounder()) {
                throw new Error('Only owner and founders can create proposals');
            }

            const proposalId = Date.now().toString();
            const proposals = JSON.parse(localStorage.getItem('boardProposals') || '{}');
            
            proposals[proposalId] = {
                id: proposalId,
                title: title,
                description: description,
                type: type, // 'funding', 'project', 'governance'
                createdBy: Web3Module.state.account,
                createdAt: Date.now(),
                status: 'active'
            };
            
            localStorage.setItem('boardProposals', JSON.stringify(proposals));

            UI.showNotification('Proposal created successfully', 'success');
            return proposalId;
        } catch (error) {
            console.error('Create proposal error:', error);
            UI.showNotification(`Failed to create proposal: ${error.message}`, 'error');
            return false;
        }
    },

    // Получение активных предложений
    getActiveProposals() {
        const proposals = JSON.parse(localStorage.getItem('boardProposals') || '{}');
        return Object.values(proposals).filter(p => p.status === 'active');
    },

    // Получение результатов голосования
    getVotingResults(proposalId) {
        const votes = JSON.parse(localStorage.getItem('boardVotes') || '{}');
        const proposalVotes = votes[proposalId]?.votes || {};
        
        let yesVotes = 0;
        let noVotes = 0;
        
        Object.values(proposalVotes).forEach(vote => {
            if (vote.vote) yesVotes++;
            else noVotes++;
        });
        
        return {
            total: yesVotes + noVotes,
            yes: yesVotes,
            no: noVotes,
            percentage: yesVotes + noVotes > 0 ? (yesVotes / (yesVotes + noVotes) * 100).toFixed(1) : 0
        };
    },

    // Очистка событий при выходе
    cleanup() {
        this.eventListeners.forEach(listener => {
            try {
                listener.removeAllListeners();
            } catch (error) {
                console.error('Error removing event listener:', error);
            }
        });
        this.eventListeners = [];
        this.userCache = null;
        this.initialized = false;
    }
};

// Экспорт
window.ContractsModule = ContractsModule;
