// Получение цены уровня
    async getLevelPrice(level) {
        try {
            return await this.contracts.globalWay.methods.levelPrices(level).call();
        } catch (error) {
            console.error('Get level price error:', error);
            return '0';
        }
    },
    
    // Расчет цены пакета
    async calculateBulkPrice(maxLevel) {
        try {
            return await this.contracts.globalWay.methods.calculateBulkPrice(maxLevel).call();
        } catch (error) {
            console.error('Calculate bulk price error:', error);
            return '0';
        }
    },
    
    // Получение общей статистики контракта
    async getContractOverview() {
        try {
            const overview = await this.contracts.globalWay.methods.getContractOverview().call();
            return {
                totalUsers: overview.totalUsers,
                activeUsers: overview.activeUsers,
                totalVolume: Web3Manager.web3.utils.fromWei(overview.totalVolume, 'ether'),
                contractBalance: Web3Manager.web3.utils.fromWei(overview.contractBalance, 'ether'),
                levelDistribution: overview.levelDistribution
            };
        } catch (error) {
            console.error('Get contract overview error:', error);
            return null;
        }
    },
    
    // ========== GWT Token Methods ==========
    
    // Получение баланса токенов
    async getTokenBalance(address) {
        try {
            const balance = await this.contracts.gwtToken.methods.balanceOf(address).call();
            return Web3Manager.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Get token balance error:', error);
            return '0';
        }
    },
    
    // Получение текущей цены токена
    async getCurrentTokenPrice() {
        try {
            const price = await this.contracts.gwtToken.methods.getCurrentPrice().call();
            return Web3Manager.web3.utils.fromWei(price, 'ether');
        } catch (error) {
            console.error('Get token price error:', error);
            return '0';
        }
    },
    
    // Покупка токенов
    async buyTokens(tokenAmount, bnbAmount) {
        try {
            const tx = await this.contracts.gwtToken.methods.buyTokens(tokenAmount)
                .send({ 
                    from: Web3Manager.currentAccount,
                    value: Web3Manager.web3.utils.toWei(bnbAmount, 'ether')
                });
            return tx;
        } catch (error) {
            console.error('Buy tokens error:', error);
            throw error;
        }
    },
    
    // Продажа токенов
    async sellTokens(tokenAmount) {
        try {
            const tx = await this.contracts.gwtToken.methods.sellTokens(tokenAmount)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Sell tokens error:', error);
            throw error;
        }
    },
    
    // ========== GlobalWayStats Methods ==========
    
    // Получение полной информации о пользователе
    async getUserFullInfo(address) {
        try {
            return await this.contracts.globalWayStats.methods.getUserFullInfo(address).call();
        } catch (error) {
            console.error('Get user full info error:', error);
            return null;
        }
    },
    
    // Получение статистики матрицы
    async getMatrixStats(user, level) {
        try {
            return await this.contracts.globalWayStats.methods.getMatrixStats(user, level).call();
        } catch (error) {
            console.error('Get matrix stats error:', error);
            return null;
        }
    },
    
    // Получение разбивки доходов
    async getEarningsBreakdown(address) {
        try {
            const earnings = await this.contracts.globalWayStats.methods.getEarningsBreakdown(address).call();
            return {
                totalEarned: Web3Manager.web3.utils.fromWei(earnings.totalEarned, 'ether'),
                personalBonus: Web3Manager.web3.utils.fromWei(earnings.personalBonus, 'ether'),
                referralBonus: Web3Manager.web3.utils.fromWei(earnings.referralBonus, 'ether'),
                matrixBonus: Web3Manager.web3.utils.fromWei(earnings.matrixBonus, 'ether'),
                leaderBonus: Web3Manager.web3.utils.fromWei(earnings.leaderBonus, 'ether'),
                investmentReturns: Web3Manager.web3.utils.fromWei(earnings.investmentReturns, 'ether')
            };
        } catch (error) {
            console.error('Get earnings breakdown error:', error);
            return null;
        }
    },
    
    // ========== Admin Methods ==========
    
    // Проверка владельца
    async isOwner(address) {
        return address.toLowerCase() === this.MANAGEMENT.OWNER.toLowerCase();
    },
    
    // Проверка основателя
    async isFounder(address) {
        return this.MANAGEMENT.FOUNDERS.some(
            founder => founder.toLowerCase() === address.toLowerCase()
        );
    },
    
    // Проверка члена правления
    async isBoardMember(address) {
        return this.MANAGEMENT.BOARD.some(
            member => member.toLowerCase() === address.toLowerCase()
        );
    },
    
    // Проверка прав администратора
    async hasAdminAccess(address) {
        return await this.isOwner(address) || 
               await this.isFounder(address) || 
               await this.isBoardMember(address);
    },
    
    // Бесплатная регистрация с уровнями (только для админа)
    async freeRegistrationWithLevels(userAddress, sponsorAddress, maxLevel) {
        try {
            // Проверка прав
            if (!await this.hasAdminAccess(Web3Manager.currentAccount)) {
                throw new Error('Access denied');
            }
            
            const tx = await this.contracts.globalWay.methods
                .freeRegistrationWithLevels(userAddress, maxLevel)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Free registration error:', error);
            throw error;
        }
    },
    
    // Пакетная бесплатная регистрация
    async batchFreeRegistration(users, sponsor, maxLevel) {
        try {
            // Проверка прав
            if (!await this.hasAdminAccess(Web3Manager.currentAccount)) {
                throw new Error('Access denied');
            }
            
            const tx = await this.contracts.globalWay.methods
                .batchFreeRegistration(users, sponsor, maxLevel)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Batch registration error:', error);
            throw error;
        }
    },
    
    // ========== Pool Management Methods ==========
    
    // Получение баланса пула
    async getPoolBalance(poolAddress) {
        try {
            const balance = await Web3Manager.web3.eth.getBalance(poolAddress);
            return Web3Manager.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Get pool balance error:', error);
            return '0';
        }
    },
    
    // Вывод средств из пула (требует голосования для больших сумм)
    async withdrawFromPool(poolName, toAddress, amount) {
        try {
            // Проверка прав
            if (!await this.hasAdminAccess(Web3Manager.currentAccount)) {
                throw new Error('Access denied');
            }
            
            const poolAddress = this.POOLS[poolName.toUpperCase()];
            if (!poolAddress) {
                throw new Error('Invalid pool name');
            }
            
            // Для сумм больше 5 BNB требуется голосование
            const amountInBNB = parseFloat(amount);
            if (amountInBNB > 5) {
                throw new Error('This amount requires voting approval (8 votes)');
            }
            
            // Здесь будет логика вывода средств через мультиподпись
            console.log('Withdrawal request:', { poolName, toAddress, amount });
            
        } catch (error) {
            console.error('Withdraw from pool error:', error);
            throw error;
        }
    },
    
    // ========== Utility Methods ==========
    
    // Форматирование адреса транзакции для эксплорера
    getTransactionUrl(txHash) {
        return `https://opbnbscan.com/tx/${txHash}`;
    },
    
    // Форматирование адреса для эксплорера
    getAddressUrl(address) {
        return `https://opbnbscan.com/address/${address}`;
    },
    
    // Конвертация Wei в BNB
    fromWei(value) {
        return Web3Manager.web3.utils.fromWei(value, 'ether');
    },
    
    // Конвертация BNB в Wei
    toWei(value) {
        return Web3Manager.web3.utils.toWei(value, 'ether');
    },
    
    // Получение событий контракта
    async getContractEvents(eventName, fromBlock = 0, toBlock = 'latest') {
        try {
            return await this.contracts.globalWay.getPastEvents(eventName, {
                fromBlock: fromBlock,
                toBlock: toBlock
            });
        } catch (error) {
            console.error('Get events error:', error);
            return [];
        }
    },
    
    // Проверка статуса транзакции
    async checkTransactionStatus(txHash) {
        try {
            const receipt = await Web3Manager.web3.eth.getTransactionReceipt(txHash);
            return {
                success: receipt.status,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed
            };
        } catch (error) {
            console.error('Check transaction status error:', error);
            return null;
        }
    }
};/* ========================================
   GlobalWay - Smart Contract Integration
   ======================================== */

window.ContractManager = {
    // Адреса контрактов в сети opBNB
    CONTRACTS: {
        GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
        GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
        GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4'
    },
    
    // Адреса пулов
    POOLS: {
        TREASURY: '0xe58f778236c1d3ccecf14ec1274761559685a336',
        OPS: '0x956c8350b874d01d32236eb2944089b54c3b9670',
        DEV: '0xf8c5504dc1e5165a0748a3dc410384bfcbab13dd',
        CHARITY: '0x09c3bd32eb0617e29e41382b738c4e3cc932a611',
        TOKENOMICS: '0xbdc29886c91878c1ba9ce0626da5e1961324354f'
    },
    
    // Владелец и управление
    MANAGEMENT: {
        OWNER: '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
        FOUNDERS: [
            '0x03284a899147f5a07f82c622f34df92198671635',
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
        ],
        BOARD: [
            '0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA',
            '0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639',
            '0x0561671297Eed07accACB41b4882ED61e87E3644',
            '0x012E0B2b502FE0131Cb342117415a43d59094D6d',
            '0x15b546a61865bdc46783ACfc50c3101a1121c69B',
            '0xB5986B808dad481ad86D63DF152cC0ad7B473e48',
            '0x4d2C77e59538deFe89E3B2951680547FC24aD52C',
            '0xAB17aDbe29c4E1d695C239206682B02ebdB3f707'
        ]
    },
    
    // Экземпляры контрактов
    contracts: {
        globalWay: null,
        gwtToken: null,
        globalWayStats: null
    },
    
    // ABI контрактов (загружаются из JSON файлов)
    abis: {},
    
    // Инициализация контрактов
    async init() {
        try {
            // Загружаем ABI
            await this.loadABIs();
            
            // Создаем экземпляры контрактов
            if (Web3Manager.web3) {
                this.contracts.globalWay = new Web3Manager.web3.eth.Contract(
                    this.abis.GlobalWay,
                    this.CONTRACTS.GlobalWay
                );
                
                this.contracts.gwtToken = new Web3Manager.web3.eth.Contract(
                    this.abis.GWTToken,
                    this.CONTRACTS.GWTToken
                );
                
                this.contracts.globalWayStats = new Web3Manager.web3.eth.Contract(
                    this.abis.GlobalWayStats,
                    this.CONTRACTS.GlobalWayStats
                );
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Contract initialization error:', error);
            return false;
        }
    },
    
    // Загрузка ABI
    async loadABIs() {
        try {
            const [globalWay, gwtToken, globalWayStats] = await Promise.all([
                fetch('contracts/GlobalWay.json').then(r => r.json()),
                fetch('contracts/GWTToken.json').then(r => r.json()),
                fetch('contracts/GlobalWayStats.json').then(r => r.json())
            ]);
            
            this.abis.GlobalWay = globalWay.abi;
            this.abis.GWTToken = gwtToken.abi;
            this.abis.GlobalWayStats = globalWayStats.abi;
        } catch (error) {
            console.error('ABI loading error:', error);
            throw error;
        }
    },
    
    // ========== GlobalWay Contract Methods ==========
    
    // Регистрация пользователя
    async register(sponsorAddress) {
        try {
            const tx = await this.contracts.globalWay.methods.register(sponsorAddress)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    // Покупка уровня
    async buyLevel(level) {
        try {
            const price = await this.getLevelPrice(level);
            const tx = await this.contracts.globalWay.methods.buyLevel(level)
                .send({ 
                    from: Web3Manager.currentAccount,
                    value: price
                });
            return tx;
        } catch (error) {
            console.error('Buy level error:', error);
            throw error;
        }
    },
    
    // Покупка пакета уровней
    async buyLevelsBulk(maxLevel) {
        try {
            const totalPrice = await this.calculateBulkPrice(maxLevel);
            const tx = await this.contracts.globalWay.methods.buyLevelsBulk(maxLevel)
                .send({ 
                    from: Web3Manager.currentAccount,
                    value: totalPrice
                });
            return tx;
        } catch (error) {
            console.error('Bulk buy error:', error);
            throw error;
        }
    },
    
    // Оплата квартальной активности
    async payQuarterlyActivity() {
        try {
            const fee = await this.contracts.globalWay.methods.QUARTERLY_FEE().call();
            const tx = await this.contracts.globalWay.methods.payQuarterlyActivity()
                .send({ 
                    from: Web3Manager.currentAccount,
                    value: fee
                });
            return tx;
        } catch (error) {
            console.error('Quarterly payment error:', error);
            throw error;
        }
    },
    
    // Получение цены уровня
    async getLevelPrice(level) {
        try {
            return await this.contracts.globalWay.methods.levelPrices(level).call();
        } catch (error) {
            console.error('Get level price error:', error);
            return '0';
        }
    },
    
    // Расчет цены пакета
    async calculateBulkPrice(maxLevel) {
        try {
            return await this.contracts.globalWay.methods.calculateBulkPrice(maxLevel).call();
        } catch (error) {
            console.error('Calculate bulk price error:', error);
            return '0';
        }
    },
    
    // Получение общей статистики контракта
    async getContractOverview() {
        try {
            const overview = await this.contracts.globalWay.methods.getContractOverview().call();
            return {
                totalUsers: overview.totalUsers,
                activeUsers: overview.activeUsers,
                totalVolume: Web3Manager.web3.utils.fromWei(overview.totalVolume, 'ether'),
                contractBalance: Web3Manager.web3.utils.fromWei(overview.contractBalance, 'ether'),
                levelDistribution: overview.levelDistribution
            };
        } catch (error) {
            console.error('Get contract overview error:', error);
            return null;
        }
    },
    
    // ========== GWT Token Methods ==========
    
    // Получение баланса токенов
    async getTokenBalance(address) {
        try {
            const balance = await this.contracts.gwtToken.methods.balanceOf(address).call();
            return Web3Manager.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Get token balance error:', error);
            return '0';
        }
    },
    
    // Получение текущей цены токена
    async getCurrentTokenPrice() {
        try {
            const price = await this.contracts.gwtToken.methods.getCurrentPrice().call();
            return Web3Manager.web3.utils.fromWei(price, 'ether');
        } catch (error) {
            console.error('Get token price error:', error);
            return '0';
        }
    },
    
    // Покупка токенов
    async buyTokens(tokenAmount, bnbAmount) {
        try {
            const tx = await this.contracts.gwtToken.methods.buyTokens(tokenAmount)
                .send({ 
                    from: Web3Manager.currentAccount,
                    value: Web3Manager.web3.utils.toWei(bnbAmount, 'ether')
                });
            return tx;
        } catch (error) {
            console.error('Buy tokens error:', error);
            throw error;
        }
    },
    
    // Продажа токенов
    async sellTokens(tokenAmount) {
        try {
            const tx = await this.contracts.gwtToken.methods.sellTokens(tokenAmount)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Sell tokens error:', error);
            throw error;
        }
    },
    
    // ========== GlobalWayStats Methods ==========
    
    // Получение полной информации о пользователе
    async getUserFullInfo(address) {
        try {
            return await this.contracts.globalWayStats.methods.getUserFullInfo(address).call();
        } catch (error) {
            console.error('Get user full info error:', error);
            return null;
        }
    },
    
    // Получение статистики матрицы
    async getMatrixStats(user, level) {
        try {
            return await this.contracts.globalWayStats.methods.getMatrixStats(user, level).call();
        } catch (error) {
            console.error('Get matrix stats error:', error);
            return null;
        }
    },
    
    // Получение разбивки доходов
    async getEarningsBreakdown(address) {
        try {
            const earnings = await this.contracts.globalWayStats.methods.getEarningsBreakdown(address).call();
            return {
                totalEarned: Web3Manager.web3.utils.fromWei(earnings.totalEarned, 'ether'),
                personalBonus: Web3Manager.web3.utils.fromWei(earnings.personalBonus, 'ether'),
                referralBonus: Web3Manager.web3.utils.fromWei(earnings.referralBonus, 'ether'),
                matrixBonus: Web3Manager.web3.utils.fromWei(earnings.matrixBonus, 'ether'),
                leaderBonus: Web3Manager.web3.utils.fromWei(earnings.leaderBonus, 'ether'),
                investmentReturns: Web3Manager.web3.utils.fromWei(earnings.investmentReturns, 'ether')
            };
        } catch (error) {
            console.error('Get earnings breakdown error:', error);
            return null;
        }
    },
    
    // ========== Admin Methods ==========
    
    // Проверка владельца
    async isOwner(address) {
        return address.toLowerCase() === this.MANAGEMENT.OWNER.toLowerCase();
    },
    
    // Проверка основателя
    async isFounder(address) {
        return this.MANAGEMENT.FOUNDERS.some(
            founder => founder.toLowerCase() === address.toLowerCase()
        );
    },
    
    // Проверка члена правления
    async isBoardMember(address) {
        return this.MANAGEMENT.BOARD.some(
            member => member.toLowerCase() === address.toLowerCase()
        );
    },
    
    // Проверка прав администратора
    async hasAdminAccess(address) {
        return await this.isOwner(address) || 
               await this.isFounder(address) || 
               await this.isBoardMember(address);
    },
    
    // Бесплатная регистрация с уровнями (только для админа)
    async freeRegistrationWithLevels(userAddress, sponsorAddress, maxLevel) {
        try {
            // Проверка прав
            if (!await this.hasAdminAccess(Web3Manager.currentAccount)) {
                throw new Error('Access denied');
            }
            
            const tx = await this.contracts.globalWay.methods
                .freeRegistrationWithLevels(userAddress, maxLevel)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Free registration error:', error);
            throw error;
        }
    },
    
    // Пакетная бесплатная регистрация
    async batchFreeRegistration(users, sponsor, maxLevel) {
        try {
            // Проверка прав
            if (!await this.hasAdminAccess(Web3Manager.currentAccount)) {
                throw new Error('Access denied');
            }
            
            const tx = await this.contracts.globalWay.methods
                .batchFreeRegistration(users, sponsor, maxLevel)
                .send({ from: Web3Manager.currentAccount });
            return tx;
        } catch (error) {
            console.error('Batch registration error:', error);
            throw error;
        }
    },
    
    // ========== Utility Methods ==========
    
    // Форматирование адреса транзакции для эксплорера
    getTransactionUrl(txHash) {
        return `https://opbnbscan.com/tx/${txHash}`;
    },
    
    // Форматирование адреса для эксплорера
    getAddressUrl(address) {
        return `https://opbnbscan.com/address/${address}`;
    },
    
    // Конвертация Wei в BNB
    fromWei(value) {
        return Web3Manager.web3.utils.fromWei(value, 'ether');
    },
    
    // Конвертация BNB в Wei
    toWei(value) {
        return Web3Manager.web3.utils.toWei(value, 'ether');
    }
};ение данных пользователя
    async getUserData(address) {
        try {
            const data = await this.contracts.globalWay.methods.getUserData(address).call();
            return {
                isRegistered: data.isRegistered,
                sponsor: data.sponsor,
                registrationTime: data.registrationTime,
                lastActivity: data.lastActivity,
                personalInvites: data.personalInvites,
                totalEarned: Web3Manager.web3.utils.fromWei(data.totalEarned, 'ether'),
                leaderRank: data.leaderRank
            };
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    },
    
    // Получение статистики пользователя
    async getUserStats(address) {
        try {
            const stats = await this.contracts.globalWay.methods.getUserStats(address).call();
            return {
                isRegistered: stats.isRegistered,
                activeLevels: stats.activeLevels,
                personalInvites: stats.personalInvites,
                totalEarned: Web3Manager.web3.utils.fromWei(stats.totalEarned, 'ether'),
                registrationTime: stats.registrationTime,
                leaderRank: stats.leaderRank,
                referrals: stats.referrals
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            return null;
        }
    },
    
    // Проверка активности уровня
    async isLevelActive(user, level) {
        try {
            return await this.contracts.globalWay.methods.isLevelActive(user, level).call();
        } catch (error) {
            console.error('Level check error:', error);
            return false;
        }
    },
    
    // Получ
