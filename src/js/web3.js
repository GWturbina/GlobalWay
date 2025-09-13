// Web3 Module - GlobalWay Integration
const Web3Module = {
    state: {
        web3: null,
        account: null,
        isConnected: false,
        provider: null,
        chainId: null,
        balance: '0',
        walletType: 'None'
    },

    // Конфигурация сети opBNB
    targetChainId: 204,
    networkConfig: {
        chainId: '0xCC',
        chainName: 'opBNB Mainnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
        blockExplorerUrls: ['https://opbnbscan.com/']
    },

    // События
    events: new EventTarget(),

    // Инициализация модуля
    async init() {
        console.log('Web3Module: Initializing...');
        
        try {
            await this.detectWalletProviders();
            await this.initializeWeb3();
            await this.tryReconnect();
            this.setupEventListeners();
            
            console.log('Web3Module: Initialized successfully');
            return true;
        } catch (error) {
            console.error('Web3Module initialization failed:', error);
            return false;
        }
    },

    // Детекция доступных кошельков
    async detectWalletProviders() {
        console.log('Detecting wallet providers...');
        
        // Приоритет SafePal для мобильных устройств
        if (window.safePal && window.safePal.ethereum) {
            console.log('SafePal wallet detected as primary provider');
            window.ethereum = window.safePal.ethereum;
            this.state.walletType = 'SafePal';
            return;
        }
        
        // Проверка других кошельков
        if (window.ethereum) {
            if (window.ethereum.isMetaMask) {
                console.log('MetaMask detected');
                this.state.walletType = 'MetaMask';
            } else if (window.ethereum.isTrustWallet) {
                console.log('Trust Wallet detected');
                this.state.walletType = 'TrustWallet';
            } else if (window.ethereum.isBinance) {
                console.log('Binance Wallet detected');
                this.state.walletType = 'Binance';
            } else {
                console.log('Generic Web3 provider detected');
                this.state.walletType = 'Web3';
            }
        } else {
            console.warn('No Web3 provider detected');
            this.state.walletType = 'None';
        }
    },

    // Инициализация Web3
    async initializeWeb3() {
        if (!window.ethereum) {
            throw new Error('No Web3 provider available');
        }

        this.state.web3 = new Web3(window.ethereum);
        this.state.provider = window.ethereum;
        console.log(`Web3 initialized with ${this.state.walletType}`);
    },

    // Попытка автоматического переподключения
    async tryReconnect() {
        const savedAccount = localStorage.getItem('connectedAccount');
        const savedWallet = localStorage.getItem('walletType');
        
        if (savedAccount && savedWallet) {
            console.log('Attempting to reconnect...');
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                
                if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
                    await this.setAccount(accounts[0]);
                    await this.checkNetwork();
                    this.updateAccountInfo();
                    console.log(`Reconnected to ${this.state.walletType}: ${this.state.account}`);
                }
            } catch (error) {
                console.error('Reconnection failed:', error);
                this.clearStoredConnection();
            }
        }
    },

    // Основная функция подключения кошелька
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('No Web3 wallet detected. Please install SafePal, MetaMask, or another Web3 wallet.');
            }

            console.log('Requesting wallet connection...');
            
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned from wallet');
            }

            await this.setAccount(accounts[0]);
            await this.checkNetwork();
            this.updateAccountInfo();
            this.saveConnection();

            UI.showNotification(`Connected to ${this.state.walletType}`, 'success');
            this.events.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: { account: this.state.account, walletType: this.state.walletType }
            }));

            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            UI.showNotification(`Connection failed: ${error.message}`, 'error');
            return false;
        }
    },

    // Установка аккаунта
    async setAccount(account) {
        this.state.account = account.toLowerCase();
        this.state.isConnected = true;
        
        // Обновление UI
        this.updateWalletDisplay();
    },

    // Проверка и переключение сети
    async checkNetwork() {
        try {
            const chainId = await this.state.web3.eth.getChainId();
            this.state.chainId = chainId;
            
            console.log(`Current network: ${chainId}, required: ${this.targetChainId}`);
            
            if (chainId === this.targetChainId) {
                console.log('Already on correct network (opBNB)');
                return true;
            }
            
            console.log('Need to switch to opBNB network...');
            return await this.switchToOpBNB();
        } catch (error) {
            console.error('Network check failed:', error);
            return false;
        }
    },

    // Переключение на opBNB
    async switchToOpBNB() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.targetChainId.toString(16)}` }]
            });
            
            console.log('Network switched successfully');
            this.state.chainId = this.targetChainId;
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                console.log('Adding opBNB network...');
                return await this.addOpBNBNetwork();
            }
            console.error('Network switch failed:', switchError);
            return false;
        }
    },

    // Добавление сети opBNB
    async addOpBNBNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [this.networkConfig]
            });
            
            console.log('opBNB network added successfully');
            this.state.chainId = this.targetChainId;
            return true;
        } catch (error) {
            console.error('Failed to add opBNB network:', error);
            return false;
        }
    },

    // Обновление информации об аккаунте
    async updateAccountInfo() {
        if (!this.state.account || !this.state.web3) return;
        
        try {
            console.log('Updating account info...');
            
            const balance = await this.state.web3.eth.getBalance(this.state.account);
            this.state.balance = this.fromWei(balance);
            
            this.updateWalletDisplay();
        } catch (error) {
            console.error('Failed to update account info:', error);
        }
    },

    // Обновление отображения кошелька
    updateWalletDisplay() {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        const walletType = document.getElementById('walletType');
        const walletUserId = document.getElementById('walletUserId');
        const roleIndicator = document.getElementById('roleIndicator');

        if (this.state.isConnected && this.state.account) {
            // Скрыть кнопку подключения
            if (connectBtn) connectBtn.style.display = 'none';
            
            // Показать информацию о кошельке
            if (walletInfo) walletInfo.classList.remove('hidden');
            if (walletAddress) walletAddress.textContent = this.formatAddress(this.state.account);
            if (walletBalance) walletBalance.textContent = `${parseFloat(this.state.balance).toFixed(4)} BNB`;
            if (walletType) walletType.textContent = this.state.walletType;
            
            // Обновить user ID и роль
            if (walletUserId) walletUserId.textContent = this.getUserId();
            if (roleIndicator) {
                const role = this.getUserRole();
                roleIndicator.textContent = role;
                roleIndicator.classList.remove('hidden');
                
                // Показать админ панель если нужно
                this.updateAdminAccess(role);
            }
        } else {
            // Показать кнопку подключения
            if (connectBtn) connectBtn.style.display = 'block';
            if (walletInfo) walletInfo.classList.add('hidden');
        }
    },

    // Определение роли пользователя
    getUserRole() {
        if (!this.state.account) return 'User';
        
        // Проверка на владельца контракта
        if (this.isOwner()) return 'Owner';
        if (this.isFounder()) return 'Founder';
        if (this.isBoard()) return 'Board';
        
        return 'User';
    },

    // Проверка на владельца
    isOwner() {
        const ownerAddress = '0x0099188030174e381e7a7ee36d2783ecc31b6728';
        return this.state.account && this.state.account.toLowerCase() === ownerAddress.toLowerCase();
    },

    // Проверка на учредителя
    isFounder() {
        const founderAddresses = [
            '0x0099188030174e381e7a7ee36d2783ecc31b6728'
        ];
        return this.state.account && founderAddresses.some(addr => 
            addr.toLowerCase() === this.state.account.toLowerCase()
        );
    },

    // Проверка на члена совета директоров
    isBoard() {
        const boardAddresses = [
            '0x0099188030174e381e7a7ee36d2783ecc31b6728'
        ];
        return this.state.account && boardAddresses.some(addr => 
            addr.toLowerCase() === this.state.account.toLowerCase()
        );
    },

    // Обновление доступа к админ панели
    updateAdminAccess(role) {
        const adminNavBtn = document.getElementById('adminNavBtn');
        
        if (role === 'Owner' || role === 'Founder') {
            if (adminNavBtn) adminNavBtn.classList.remove('hidden');
        } else {
            if (adminNavBtn) adminNavBtn.classList.add('hidden');
        }
    },

    // Генерация ID пользователя
    getUserId() {
        if (!this.state.account) return 'GW0000000';
        
        const hash = this.state.account.slice(2);
        const numericId = parseInt(hash.slice(-6), 16) % 10000000;
        return `GW${numericId.toString().padStart(7, '0')}`;
    },

    // Отключение кошелька
    async disconnect() {
        this.state.account = null;
        this.state.isConnected = false;
        this.state.balance = '0';
        
        this.clearStoredConnection();
        this.updateWalletDisplay();
        
        this.events.dispatchEvent(new CustomEvent('walletDisconnected'));
        UI.showNotification('Wallet disconnected', 'info');
    },

    // Сохранение подключения
    saveConnection() {
        localStorage.setItem('connectedAccount', this.state.account);
        localStorage.setItem('walletType', this.state.walletType);
    },

    // Очистка сохраненного подключения
    clearStoredConnection() {
        localStorage.removeItem('connectedAccount');
        localStorage.removeItem('walletType');
    },

    // Настройка слушателей событий
    setupEventListeners() {
        if (!window.ethereum) return;
        
        console.log('Setting up wallet event listeners...');
        
        // Смена аккаунта
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                this.disconnect();
            } else if (accounts[0].toLowerCase() !== this.state.account) {
                this.setAccount(accounts[0]);
                this.updateAccountInfo();
                this.saveConnection();
            }
        });
        
        // Смена сети
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('Chain changed:', chainId);
            this.state.chainId = parseInt(chainId, 16);
            
            if (this.state.chainId !== this.targetChainId) {
                UI.showNotification('Please switch to opBNB network', 'warning');
            } else {
                UI.showNotification('Connected to opBNB network', 'success');
            }
            
            // Перезагрузка данных контрактов
            if (window.ContractsModule && this.state.isConnected) {
                ContractsModule.loadUserData(true);
            }
        });
        
        // Отключение кошелька
        window.ethereum.on('disconnect', () => {
            console.log('Wallet disconnected');
            this.disconnect();
        });
    },

    // Отправка транзакции
    async sendTransaction(to, value, data = '0x') {
        if (!this.state.web3 || !this.state.account) {
            throw new Error('Wallet not connected');
        }
        
        const gasPrice = await this.state.web3.eth.getGasPrice();
        const gasLimit = data === '0x' ? 21000 : await this.state.web3.eth.estimateGas({
            from: this.state.account,
            to: to,
            value: value,
            data: data
        });
        
        const txParams = {
            from: this.state.account,
            to: to,
            value: value,
            gas: Math.floor(gasLimit * 1.2),
            gasPrice: gasPrice,
            data: data
        };
        
        return await this.state.web3.eth.sendTransaction(txParams);
    },

    // Ожидание подтверждения транзакции
    async waitForTransaction(txHash, timeout = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const receipt = await this.state.web3.eth.getTransactionReceipt(txHash);
                if (receipt) return receipt;
            } catch (error) {
                console.warn('Transaction not yet mined:', txHash);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Transaction timeout');
    },

    // Утилиты
    formatAddress(address) {
        if (!address) return '0x000...000';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    toWei(amount) {
        return this.state.web3.utils.toWei(amount.toString(), 'ether');
    },

    fromWei(amount) {
        return this.state.web3.utils.fromWei(amount.toString(), 'ether');
    },

    isAddress(address) {
        return this.state.web3.utils.isAddress(address);
    },

    // Проверка наличии админ прав
    hasAdminAccess() {
        return this.isOwner() || this.isFounder();
    }
};

// Экспорт модуля
window.Web3Module = Web3Module;
