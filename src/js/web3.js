// src/js/web3.js

const Web3Module = {
    // Конфигурация сети opBNB
    config: {
        chainId: '0xCC', // 204 в hex
        chainName: 'opBNB Mainnet',
        rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        blockExplorerUrls: ['https://opbnbscan.com/']
    },

    // Состояние подключения
    state: {
        web3: null,
        account: null,
        chainId: null,
        walletType: null,
        isConnected: false,
        provider: null
    },

    // Реферальная система
    referralSystem: {
        currentUserId: null,
        referralMapping: new Map(), // ID -> Address mapping
        addressMapping: new Map(), // Address -> ID mapping
        
        // Генерация случайного 7-значного ID
        generateRandomId() {
            let id;
            do {
                id = Math.floor(1000000 + Math.random() * 9000000).toString();
            } while (this.referralMapping.has(id)); // Проверка уникальности
            return id;
        },

        // Сохранение маппинга ID
        saveIdMapping(address, id, prefix = 'GW') {
            const fullId = prefix + id;
            this.referralMapping.set(id, address.toLowerCase());
            this.addressMapping.set(address.toLowerCase(), id);
            
            // Сохранение в localStorage
            const mappings = JSON.parse(localStorage.getItem('idMappings') || '{}');
            mappings[id] = {
                address: address.toLowerCase(),
                prefix: prefix,
                fullId: fullId,
                timestamp: Date.now()
            };
            localStorage.setItem('idMappings', JSON.stringify(mappings));
            
            // Отправка события для логирования
            this.logIdEvent('ID_CREATED', { id, address, prefix, fullId });
        },

        // Получение ID по адресу
        getIdByAddress(address) {
            return this.addressMapping.get(address.toLowerCase());
        },

        // Получение адреса по ID
        getAddressById(id) {
            return this.referralMapping.get(id);
        },

        // Загрузка существующих маппингов
        loadMappings() {
            const mappings = JSON.parse(localStorage.getItem('idMappings') || '{}');
            Object.entries(mappings).forEach(([id, data]) => {
                this.referralMapping.set(id, data.address);
                this.addressMapping.set(data.address, id);
            });
        },

        // Обработка входящей реферальной ссылки
        processReferralUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            
            if (refParam) {
                // Парсинг префикса и ID (например: GW5472846)
                const match = refParam.match(/^([A-Z]{2})(\d{7})$/);
                if (match) {
                    const [, prefix, id] = match;
                    const sponsorAddress = this.getAddressById(id);
                    
                    if (sponsorAddress) {
                        localStorage.setItem('pendingSponsor', sponsorAddress);
                        localStorage.setItem('referralPrefix', prefix);
                        localStorage.setItem('referralId', id);
                        
                        UI.showNotification(`Referral link detected: ${prefix}${id}`, 'info');
                        return { sponsorAddress, prefix, id };
                    } else {
                        UI.showNotification('Invalid referral link', 'error');
                    }
                }
            }
            return null;
        },

        // Генерация реферальной ссылки
        generateReferralLink(address, prefix = 'GW') {
            let id = this.getIdByAddress(address);
            if (!id) {
                id = this.generateRandomId();
                this.saveIdMapping(address, id, prefix);
            }
            
            const baseUrl = window.location.origin;
            return `${baseUrl}/?ref=${prefix}${id}`;
        },

        // Логирование событий для backend/blockchain
        logIdEvent(eventType, data) {
            const logEntry = {
                timestamp: Date.now(),
                eventType,
                data,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Сохранение в localStorage для последующей синхронизации
            const logs = JSON.parse(localStorage.getItem('idEventLogs') || '[]');
            logs.push(logEntry);
            // Ограничиваем размер лога
            if (logs.length > 1000) {
                logs.splice(0, 100);
            }
            localStorage.setItem('idEventLogs', JSON.stringify(logs));
            
            // Попытка отправки на backend (если будет реализован)
            this.syncToBackend(logEntry);
        },

        // Синхронизация с backend (заготовка)
        async syncToBackend(logEntry) {
            // Здесь будет логика отправки на backend API
            // Пока сохраняем локально
            console.log('ID Event logged:', logEntry);
        }
    },

    // Инициализация
    async init() {
        console.log('Web3Module: Initializing...');
        
        // Загрузка существующих маппингов
        this.referralSystem.loadMappings();
        
        // Обработка реферальной ссылки
        this.referralSystem.processReferralUrl();

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Приоритет SafePal кошелька
        await this.detectAndSetupWallet();

        // Проверка сохраненного подключения
        const savedAccount = localStorage.getItem('connectedAccount');
        if (savedAccount && this.state.provider) {
            await this.reconnect();
        }

        // Слушатели событий
        this.setupEventListeners();
        
        console.log('Web3Module: Initialized successfully');
    },

    // НОВЫЙ МЕТОД: Улучшенное обнаружение кошельков с приоритетом SafePal
    async detectAndSetupWallet() {
        console.log('Detecting wallet providers...');
        
        // Функция определения типа устройства
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && !isMobile;
        
        let preferredProvider = null;
        let walletType = null;

        // ПРИОРИТЕТ 1: SafePal (особенно важно на мобильных устройствах)
        if (window.ethereum?.isSafePal) {
            preferredProvider = window.ethereum;
            walletType = 'SafePal';
            console.log('SafePal wallet detected as primary provider');
        }
        // ПРИОРИТЕТ 2: Если несколько провайдеров, ищем SafePal среди них
        else if (window.ethereum?.providers) {
            const safePalProvider = window.ethereum.providers.find(p => p.isSafePal);
            if (safePalProvider) {
                preferredProvider = safePalProvider;
                walletType = 'SafePal';
                console.log('SafePal found among multiple providers');
            } else {
                // Fallback к первому доступному провайдеру
                preferredProvider = window.ethereum.providers[0];
                walletType = this.detectWalletType(preferredProvider);
                console.log(`Fallback to: ${walletType}`);
            }
        }
        // ПРИОРИТЕТ 3: Единственный ethereum провайдер (не SafePal)
        else if (window.ethereum) {
            preferredProvider = window.ethereum;
            walletType = this.detectWalletType(window.ethereum);
            console.log(`Single provider detected: ${walletType}`);
        }
        // ПРИОРИТЕТ 4: Мобильные специфичные провайдеры
        else if (isMobile) {
            // На мобильных устройствах проверяем специфичные объекты
            if (window.safepal) {
                preferredProvider = window.safepal;
                walletType = 'SafePal Mobile';
                console.log('SafePal mobile provider detected');
            } else if (window.trustwallet) {
                preferredProvider = window.trustwallet;
                walletType = 'Trust Wallet';
                console.log('Trust Wallet mobile provider detected');
            }
        }

        if (preferredProvider) {
            this.state.provider = preferredProvider;
            this.state.walletType = walletType;
            
            // Создание экземпляра Web3 с предпочтительным провайдером
            this.state.web3 = new Web3(preferredProvider);
            
            console.log(`Web3 initialized with ${walletType}`);
            return true;
        } else {
            console.error('No Web3 wallet detected');
            // Показываем специфичные инструкции в зависимости от устройства
            if (isMobile) {
                UI.showNotification('Please install SafePal mobile app or open this page in SafePal browser', 'error');
            } else {
                UI.showNotification('Please install SafePal browser extension or another Web3 wallet', 'error');
            }
            return false;
        }
    },

    // Определение типа кошелька
    detectWalletType(provider) {
        if (provider.isSafePal) return 'SafePal';
        if (provider.isMetaMask) return 'MetaMask';
        if (provider.isTrust) return 'Trust Wallet';
        if (provider.isCoinbaseWallet) return 'Coinbase Wallet';
        if (provider.isBinance) return 'Binance Wallet';
        if (provider.isTokenPocket) return 'TokenPocket';
        return 'Unknown Wallet';
    },

    // Улучшенное подключение кошелька
    async connect() {
        try {
            console.log('Attempting wallet connection...');
            
            // Проверка наличия провайдера
            if (!this.state.provider) {
                await this.detectAndSetupWallet();
                if (!this.state.provider) {
                    throw new Error('No wallet provider found');
                }
            }

            console.log(`Connecting to ${this.state.walletType}...`);

            // Запрос подключения
            let accounts;
            
            // Специальная обработка для SafePal
            if (this.state.walletType.includes('SafePal')) {
                try {
                    // Для SafePal используем специфичный метод если доступен
                    if (this.state.provider.request) {
                        accounts = await this.state.provider.request({ 
                            method: 'eth_requestAccounts' 
                        });
                    } else if (this.state.provider.enable) {
                        accounts = await this.state.provider.enable();
                    } else {
                        throw new Error('SafePal provider methods not available');
                    }
                } catch (error) {
                    console.error('SafePal specific connection failed:', error);
                    // Fallback к стандартному методу
                    accounts = await this.state.provider.request({ 
                        method: 'eth_requestAccounts' 
                    });
                }
            } else {
                // Стандартный запрос для других кошельков
                accounts = await this.state.provider.request({ 
                    method: 'eth_requestAccounts' 
                });
            }

            if (accounts && accounts.length > 0) {
                this.state.account = accounts[0];
                this.state.isConnected = true;

                console.log(`Connected to ${this.state.walletType}: ${this.state.account}`);

                // Проверка и переключение сети
                await this.checkAndSwitchNetwork();

                // Генерация ID для нового пользователя если нет
                if (!this.referralSystem.getIdByAddress(this.state.account)) {
                    const newId = this.referralSystem.generateRandomId();
                    this.referralSystem.saveIdMapping(this.state.account, newId, 'GW');
                    console.log(`Generated new ID: GW${newId} for ${this.state.account}`);
                }

                // Сохранение в localStorage
                localStorage.setItem('connectedAccount', this.state.account);
                localStorage.setItem('walletType', this.state.walletType);

                // Обновление UI
                await this.updateAccountInfo();

                UI.showNotification(`Wallet connected successfully via ${this.state.walletType}`, 'success');
                return true;
            } else {
                throw new Error('No accounts returned from wallet');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            
            // Более детальная обработка ошибок
            let errorMessage = 'Failed to connect wallet';
            
            if (error.code === 4001) {
                errorMessage = 'Connection rejected by user';
            } else if (error.code === -32002) {
                errorMessage = 'Connection request already pending';
            } else if (error.message.includes('SafePal')) {
                errorMessage = 'SafePal connection failed. Please try opening in SafePal browser';
            }
            
            UI.showNotification(errorMessage, 'error');
            return false;
        }
    },

    // Переподключение при загрузке
    async reconnect() {
        try {
            console.log('Attempting to reconnect...');
            
            if (!this.state.provider) {
                await this.detectAndSetupWallet();
                if (!this.state.provider) {
                    console.log('No provider available for reconnection');
                    return false;
                }
            }

            // Получение аккаунтов без запроса разрешения
            let accounts;
            try {
                if (this.state.provider.request) {
                    accounts = await this.state.provider.request({ method: 'eth_accounts' });
                } else {
                    // Fallback для некоторых кошельков
                    accounts = await this.state.web3.eth.getAccounts();
                }
            } catch (error) {
                console.log('Failed to get accounts on reconnect:', error);
                this.disconnect();
                return false;
            }

            if (accounts && accounts.length > 0) {
                this.state.account = accounts[0];
                this.state.isConnected = true;
                
                await this.checkAndSwitchNetwork();
                await this.updateAccountInfo();
                
                console.log(`Reconnected to ${this.state.walletType}: ${this.state.account}`);
                return true;
            } else {
                console.log('No accounts available for reconnection');
                this.disconnect();
                return false;
            }
        } catch (error) {
            console.error('Reconnection error:', error);
            this.disconnect();
            return false;
        }
    },

    // Отключение кошелька
    disconnect() {
        console.log('Disconnecting wallet...');
        
        this.state.account = null;
        this.state.isConnected = false;
        this.state.walletType = null;
        // НЕ сбрасываем provider, чтобы можно было переподключиться
        
        localStorage.removeItem('connectedAccount');
        localStorage.removeItem('walletType');
        
        UI.updateWalletUI(null, null, null);
        UI.showNotification('Wallet disconnected', 'info');
    },

    async checkAndSwitchNetwork() {
    try {
        const chainId = await this.state.web3.eth.getChainId();
        console.log(`Current network: ${chainId}, required: ${this.targetChainId}`);
        
        if (chainId === this.targetChainId) {
            console.log('Already on correct network (opBNB)');
            return true; // ✅ УЖЕ НА ПРАВИЛЬНОЙ СЕТИ - НЕ ПЕРЕКЛЮЧАТЬ
        }
        
        console.log('Switching to opBNB network...');
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.targetChainId.toString(16)}` }]
            });
            
            console.log('Network switched successfully');
            return true;
        } catch (switchError) {
            // Если сеть не добавлена, пытаемся добавить
            if (switchError.code === 4902) {
                console.log('Adding opBNB network...');
                await this.addOpBNBNetwork();
                return true;
            }
            throw switchError;
        }
    } catch (error) {
        console.error('Network configuration error:', error);
        // ⚠️ НЕ БРОСАТЬ ОШИБКУ - ПРОДОЛЖАТЬ РАБОТУ
        return false;
    }
},
                
                // Повторная проверка после переключения
                const newChainId = await this.state.web3.eth.getChainId();
                if (newChainId !== 204) {
                    throw new Error('Failed to switch to opBNB network');
                }
            }
            return true;
        } catch (error) {
            console.error('Network configuration error:', error);
            UI.showNotification('Please switch to opBNB network manually', 'error');
            return false;
        }
    },

    // Обновление информации аккаунта
    async updateAccountInfo() {
        if (!this.state.account) return;

        try {
            console.log('Updating account info...');
            
            // Получение баланса
            const balanceWei = await this.state.web3.eth.getBalance(this.state.account);
            const balance = this.state.web3.utils.fromWei(balanceWei, 'ether');
            
            // Форматирование адреса
            const shortAddress = this.formatAddress(this.state.account);

            // Получение ID пользователя
            const userId = this.referralSystem.getIdByAddress(this.state.account) || 'Not generated';

            // Обновление UI
            UI.updateWalletUI(shortAddress, parseFloat(balance).toFixed(4), this.state.walletType, userId);

            // Загрузка данных пользователя из контракта
            if (window.ContractsModule?.initialized) {
                await ContractsModule.loadUserData();
            }
        } catch (error) {
            console.error('Error updating account info:', error);
        }
    },

    // Форматирование адреса
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },

    // Полный адрес для проверки админа
    getFullAddress() {
        return this.state.account ? this.state.account.toLowerCase() : null;
    },

    // Получение ID пользователя
    getUserId() {
        return this.referralSystem.getIdByAddress(this.state.account);
    },

    // Генерация реферальной ссылки
    getReferralLink() {
        if (!this.state.account) return null;
        return this.referralSystem.generateReferralLink(this.state.account);
    },

    // Проверка, является ли текущий аккаунт владельцем
    isOwner() {
        const ownerAddress = '0x7261b8aeaee2f806f64001596a67d68f2055acd2';
        return this.getFullAddress() === ownerAddress.toLowerCase();
    },

    // Проверка, является ли аккаунт учредителем
    isFounder() {
        const founders = [
            '0x03284a899147f5a07f82c622f34df92198671635', // F1
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee', // F2
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'  // F3
        ];
        const currentAddress = this.getFullAddress();
        return founders.some(founder => founder.toLowerCase() === currentAddress);
    },

    // Проверка, является ли аккаунт директором
    isBoard() {
        const boards = [
            '0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA', // B1
            '0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639', // B2
            '0x0561671297Eed07accACB41b4882ED61e87E3644', // B3
            '0x012E0B2b502FE0131Cb342117415a43d59094D6d', // B4
            '0x15b546a61865bdc46783ACfc50c3101a1121c69B', // B5
            '0xB5986B808dad481ad86D63DF152cC0ad7B473e48', // B6
            '0x4d2C77e59538deFe89E3B2951680547FC24aD52C', // B7
            '0xAB17aDbe29c4E1d695C239206682B02ebdB3f707'  // B8
        ];
        const currentAddress = this.getFullAddress();
        return boards.some(board => board.toLowerCase() === currentAddress);
    },

    // Проверка доступа к админ-функциям
    hasAdminAccess() {
        return this.isOwner() || this.isFounder() || this.isBoard();
    },

    // Настройка слушателей событий
    setupEventListeners() {
        if (!this.state.provider) return;

        console.log('Setting up wallet event listeners...');

        // Изменение аккаунта
        this.state.provider.on('accountsChanged', async (accounts) => {
            console.log('Accounts changed:', accounts);
            
            if (accounts.length > 0) {
                const newAccount = accounts[0];
                if (newAccount !== this.state.account) {
                    this.state.account = newAccount;
                    await this.updateAccountInfo();
                    
                    UI.showNotification('Account changed, refreshing data...', 'info');
                    
                    // Автообновление через 2 секунды
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } else {
                console.log('No accounts available, disconnecting...');
                this.disconnect();
            }
        });

        // Изменение сети
        this.state.provider.on('chainChanged', (chainId) => {
            console.log('Chain changed to:', chainId);
            
            UI.showNotification('Network changed, reloading...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });

        // Отключение
        this.state.provider.on('disconnect', (error) => {
            console.log('Provider disconnected:', error);
            this.disconnect();
        });

        // Подключение (для некоторых кошельков)
        this.state.provider.on('connect', (connectInfo) => {
            console.log('Provider connected:', connectInfo);
        });
    },

    // Подписание транзакции с улучшенной обработкой ошибок
    async sendTransaction(to, value, data = '0x') {
        try {
            if (!this.state.account) {
                throw new Error('Wallet not connected');
            }

            console.log('Preparing transaction...', { to, value, data });

            const params = {
                from: this.state.account,
                to: to,
                value: this.state.web3.utils.toHex(value),
                data: data
            };

            // Оценка газа с повторными попытками
            let gas;
            for (let i = 0; i < 3; i++) {
                try {
                    gas = await this.state.web3.eth.estimateGas(params);
                    console.log(`Gas estimated: ${gas}`);
                    break;
                } catch (gasError) {
                    console.warn(`Gas estimation attempt ${i + 1} failed:`, gasError);
                    if (i === 2) throw gasError;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            params.gas = this.state.web3.utils.toHex(Math.floor(gas * 1.2)); // +20% для безопасности

            console.log('Sending transaction with params:', params);

            // Отправка транзакции
            const txHash = await this.state.provider.request({
                method: 'eth_sendTransaction',
                params: [params]
            });

            console.log('Transaction sent:', txHash);
            return txHash;
        } catch (error) {
            console.error('Transaction error:', error);
            
            // Более детальная обработка ошибок
            if (error.code === 4001) {
                throw new Error('Transaction was rejected by user');
            } else if (error.code === -32603) {
                throw new Error('Internal JSON-RPC error');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient BNB balance');
            } else if (error.message.includes('gas')) {
                throw new Error('Gas estimation failed - transaction may fail');
            } else {
                throw new Error(`Transaction failed: ${error.message}`);
            }
        }
    },

    // Ожидание подтверждения транзакции с прогрессом
    async waitForTransaction(txHash, showProgress = true) {
        let receipt = null;
        let attempts = 0;
        const maxAttempts = 60; // Увеличено для медленных сетей

        console.log(`Waiting for transaction ${txHash}...`);

        if (showProgress) {
            UI.showNotification('Transaction sent, waiting for confirmation...', 'info');
        }

        while (!receipt && attempts < maxAttempts) {
            try {
                receipt = await this.state.web3.eth.getTransactionReceipt(txHash);
                if (!receipt) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    attempts++;
                    
                    if (showProgress && attempts % 10 === 0) {
                        UI.showNotification(`Still waiting... (${attempts * 3}s)`, 'info');
                    }
                }
            } catch (error) {
                console.warn(`Receipt check attempt ${attempts + 1} failed:`, error);
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;
            }
        }

        if (!receipt) {
            throw new Error('Transaction timeout - please check manually');
        }

        if (receipt.status === false || receipt.status === '0x0') {
            throw new Error('Transaction failed');
        }

        console.log('Transaction confirmed:', receipt);
        return receipt;
    },

    // Конвертация в Wei
    toWei(amount) {
        return this.state.web3.utils.toWei(amount.toString(), 'ether');
    },

    // Конвертация из Wei
    fromWei(amount) {
        return this.state.web3.utils.fromWei(amount.toString(), 'ether');
    },

    // Экспорт данных для админа
    exportUserDatabase() {
        if (!this.isOwner()) {
            throw new Error('Only owner can export database');
        }
        
        const data = {
            idMappings: JSON.parse(localStorage.getItem('idMappings') || '{}'),
            eventLogs: JSON.parse(localStorage.getItem('idEventLogs') || '[]'),
            timestamp: Date.now(),
            version: '1.0',
            networkInfo: {
                chainId: this.state.chainId,
                walletType: this.state.walletType
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `globalway-database-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Импорт базы данных
    importUserDatabase(jsonData) {
        if (!this.isOwner()) {
            throw new Error('Only owner can import database');
        }
        
        try {
            const data = JSON.parse(jsonData);
            
            if (data.idMappings) {
                localStorage.setItem('idMappings', JSON.stringify(data.idMappings));
                this.referralSystem.loadMappings();
            }
            
            if (data.eventLogs) {
                localStorage.setItem('idEventLogs', JSON.stringify(data.eventLogs));
            }
            
            UI.showNotification('Database imported successfully', 'success');
        } catch (error) {
            throw new Error('Invalid database format');
        }
    },

    // Получение информации о подключении
    getConnectionInfo() {
        return {
            isConnected: this.state.isConnected,
            account: this.state.account,
            walletType: this.state.walletType,
            chainId: this.state.chainId,
            hasProvider: !!this.state.provider
        };
    },

    // Проверка поддержки функций кошелька
    getWalletCapabilities() {
        if (!this.state.provider) return null;
        
        return {
            canSwitchChain: !!this.state.provider.request,
            canAddChain: !!this.state.provider.request,
            supportsEvents: !!this.state.provider.on,
            walletType: this.state.walletType,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
    }
};

// Экспорт для использования в других модулях
window.Web3Module = Web3Module;
