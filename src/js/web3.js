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
        isConnected: false
    },

    // Инициализация
    async init() {
        // Проверка наличия Web3 провайдеров
        if (typeof window.ethereum !== 'undefined') {
            // Определение типа кошелька
            if (window.ethereum.isSafePal) {
                this.state.walletType = 'SafePal';
            } else if (window.ethereum.isMetaMask) {
                this.state.walletType = 'MetaMask';
            } else if (window.ethereum.isTrust) {
                this.state.walletType = 'Trust Wallet';
            } else {
                this.state.walletType = 'Web3 Wallet';
            }

            // Создание экземпляра Web3
            this.state.web3 = new Web3(window.ethereum);

            // Проверка сохраненного подключения
            const savedAccount = localStorage.getItem('connectedAccount');
            if (savedAccount) {
                await this.reconnect();
            }

            // Слушатели событий
            this.setupEventListeners();
        } else {
            console.error('Web3 provider not found');
            UI.showNotification('Please install SafePal or another Web3 wallet', 'error');
        }
    },

    // Подключение кошелька
    async connect() {
        try {
            // Проверка наличия провайдера
            if (!window.ethereum) {
                UI.showNotification('Please install SafePal wallet', 'error');
                return false;
            }

            // Запрос подключения
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });

            if (accounts.length > 0) {
                this.state.account = accounts[0];
                this.state.isConnected = true;

                // Проверка и переключение сети
                await this.checkAndSwitchNetwork();

                // Сохранение в localStorage
                localStorage.setItem('connectedAccount', this.state.account);
                localStorage.setItem('walletType', this.state.walletType);

                // Обновление UI
                await this.updateAccountInfo();

                UI.showNotification('Wallet connected successfully', 'success');
                return true;
            }
        } catch (error) {
            console.error('Connection error:', error);
            UI.showNotification('Failed to connect wallet', 'error');
            return false;
        }
    },

    // Переподключение при загрузке
    async reconnect() {
        try {
            const accounts = await this.state.web3.eth.getAccounts();
            if (accounts.length > 0) {
                this.state.account = accounts[0];
                this.state.isConnected = true;
                await this.checkAndSwitchNetwork();
                await this.updateAccountInfo();
            } else {
                this.disconnect();
            }
        } catch (error) {
            console.error('Reconnection error:', error);
            this.disconnect();
        }
    },

    // Отключение кошелька
    disconnect() {
        this.state.account = null;
        this.state.isConnected = false;
        this.state.walletType = null;
        
        localStorage.removeItem('connectedAccount');
        localStorage.removeItem('walletType');
        
        UI.updateWalletUI(null, null, null);
        UI.showNotification('Wallet disconnected', 'info');
    },

    // Проверка и переключение сети
    async checkAndSwitchNetwork() {
        try {
            const chainId = await this.state.web3.eth.getChainId();
            this.state.chainId = chainId;

            if (chainId !== 204) {
                // Попытка переключить сеть
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: this.config.chainId }],
                    });
                } catch (switchError) {
                    // Если сеть не добавлена, добавляем её
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: this.config.chainId,
                                chainName: this.config.chainName,
                                rpcUrls: this.config.rpcUrls,
                                nativeCurrency: this.config.nativeCurrency,
                                blockExplorerUrls: this.config.blockExplorerUrls
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Network switch error:', error);
            UI.showNotification('Please switch to opBNB network', 'error');
            return false;
        }
    },

    // Обновление информации аккаунта
    async updateAccountInfo() {
        if (!this.state.account) return;

        try {
            // Получение баланса
            const balanceWei = await this.state.web3.eth.getBalance(this.state.account);
            const balance = this.state.web3.utils.fromWei(balanceWei, 'ether');
            
            // Форматирование адреса
            const shortAddress = this.formatAddress(this.state.account);

            // Обновление UI
            UI.updateWalletUI(shortAddress, parseFloat(balance).toFixed(4), this.state.walletType);

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

    // Проверка, является ли текущий аккаунт владельцем
    isOwner() {
        const ownerAddress = '0x7261b8aeaee2f806f64001596a67d68f2055acd2';
        return this.getFullAddress() === ownerAddress.toLowerCase();
    },

    // Проверка, является ли аккаунт учредителем
    isFounder() {
        const founders = [
            '0x03284a899147f5a07f82c622f34df92198671635',
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
        ];
        const currentAddress = this.getFullAddress();
        return founders.some(founder => founder.toLowerCase() === currentAddress);
    },

    // Проверка, является ли аккаунт директором
    isBoard() {
        const boards = [
            '0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA',
            '0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639',
            '0x0561671297Eed07accACB41b4882ED61e87E3644',
            '0x012E0B2b502FE0131Cb342117415a43d59094D6d',
            '0x15b546a61865bdc46783ACfc50c3101a1121c69B',
            '0xB5986B808dad481ad86D63DF152cC0ad7B473e48',
            '0x4d2C77e59538deFe89E3B2951680547FC24aD52C',
            '0xAB17aDbe29c4E1d695C239206682B02ebdB3f707'
        ];
        const currentAddress = this.getFullAddress();
        return boards.some(board => board.toLowerCase() === currentAddress);
    },

    // Настройка слушателей событий
    setupEventListeners() {
        if (!window.ethereum) return;

        // Изменение аккаунта
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
                this.state.account = accounts[0];
                await this.updateAccountInfo();
                // Перезагрузка страницы для обновления данных
                window.location.reload();
            } else {
                this.disconnect();
            }
        });

        // Изменение сети
        window.ethereum.on('chainChanged', (chainId) => {
            // Перезагрузка страницы при смене сети
            window.location.reload();
        });

        // Отключение
        window.ethereum.on('disconnect', () => {
            this.disconnect();
        });
    },

    // Подписание транзакции
    async sendTransaction(to, value, data = '0x') {
        try {
            const params = {
                from: this.state.account,
                to: to,
                value: this.state.web3.utils.toHex(value),
                data: data
            };

            // Оценка газа
            const gas = await this.state.web3.eth.estimateGas(params);
            params.gas = this.state.web3.utils.toHex(Math.floor(gas * 1.2)); // +20% для безопасности

            // Отправка транзакции
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [params]
            });

            return txHash;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    },

    // Ожидание подтверждения транзакции
    async waitForTransaction(txHash) {
        let receipt = null;
        let attempts = 0;
        const maxAttempts = 50;

        while (!receipt && attempts < maxAttempts) {
            receipt = await this.state.web3.eth.getTransactionReceipt(txHash);
            if (!receipt) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;
            }
        }

        if (!receipt) {
            throw new Error('Transaction timeout');
        }

        return receipt;
    },

    // Конвертация в Wei
    toWei(amount) {
        return this.state.web3.utils.toWei(amount.toString(), 'ether');
    },

    // Конвертация из Wei
    fromWei(amount) {
        return this.state.web3.utils.fromWei(amount.toString(), 'ether');
    }
};

// Экспорт для использования в других модулях
window.Web3Module = Web3Module;
