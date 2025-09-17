/* ========================================
   GlobalWay - Web3 Integration
   ======================================== */

window.Web3Manager = {
    // Константы
    NETWORK_ID: 204, // opBNB mainnet
    RPC_URL: 'https://opbnb-mainnet-rpc.bnbchain.org',
    NETWORK_NAME: 'opBNB Mainnet',
    NATIVE_CURRENCY: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    BLOCK_EXPLORER: 'https://opbnbscan.com',
    
    // Переменные состояния
    web3: null,
    provider: null,
    currentAccount: null,
    isConnected: false,
    
    // Инициализация Web3
    async init() {
        try {
            // Проверяем наличие Web3 провайдеров
            if (typeof window.ethereum !== 'undefined') {
                this.provider = window.ethereum;
                this.web3 = new Web3(window.ethereum);
            } else {
                console.log('Web3 provider not found');
                return false;
            }
            
            // Слушаем изменения аккаунта и сети
            this.setupEventListeners();
            
            // Проверяем сохраненное подключение
            const savedConnection = localStorage.getItem('walletConnected');
            if (savedConnection === 'true') {
                await this.reconnect();
            }
            
            return true;
        } catch (error) {
            console.error('Web3 initialization error:', error);
            return false;
        }
    },
    
    // Настройка слушателей событий
    setupEventListeners() {
        if (!this.provider) return;
        
        // Изменение аккаунта
        this.provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.currentAccount = accounts[0];
                window.dispatchEvent(new CustomEvent('accountChanged', { 
                    detail: { account: accounts[0] }
                }));
            }
        });
        
        // Изменение сети
        this.provider.on('chainChanged', (chainId) => {
            const networkId = parseInt(chainId, 16);
            if (networkId !== this.NETWORK_ID) {
                this.switchToOpBNB();
            }
        });
        
        // Отключение
        this.provider.on('disconnect', () => {
            this.disconnect();
        });
    },
    
    // Подключение кошелька
    async connect() {
        try {
            // Проверяем сеть
            const networkId = await this.web3.eth.net.getId();
            if (networkId !== this.NETWORK_ID) {
                await this.switchToOpBNB();
            }
            
            // Запрашиваем аккаунты
            const accounts = await this.provider.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                this.isConnected = true;
                localStorage.setItem('walletConnected', 'true');
                
                window.dispatchEvent(new CustomEvent('walletConnected', { 
                    detail: { 
                        account: this.currentAccount,
                        balance: await this.getBalance(this.currentAccount)
                    }
                }));
                
                return this.currentAccount;
            }
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    },
    
    // Переподключение
    async reconnect() {
        try {
            const accounts = await this.provider.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                this.isConnected = true;
                
                // Проверяем сеть
                const networkId = await this.web3.eth.net.getId();
                if (networkId !== this.NETWORK_ID) {
                    await this.switchToOpBNB();
                }
                
                window.dispatchEvent(new CustomEvent('walletReconnected', { 
                    detail: { account: this.currentAccount }
                }));
                
                return this.currentAccount;
            }
        } catch (error) {
            console.error('Reconnection error:', error);
            this.disconnect();
        }
    },
    
    // Отключение
    disconnect() {
        this.currentAccount = null;
        this.isConnected = false;
        localStorage.removeItem('walletConnected');
        
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
    },
    
    // Переключение на opBNB
    async switchToOpBNB() {
        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.NETWORK_ID.toString(16)}` }],
            });
        } catch (switchError) {
            // Если сети нет, добавляем её
            if (switchError.code === 4902) {
                try {
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${this.NETWORK_ID.toString(16)}`,
                            chainName: this.NETWORK_NAME,
                            nativeCurrency: this.NATIVE_CURRENCY,
                            rpcUrls: [this.RPC_URL],
                            blockExplorerUrls: [this.BLOCK_EXPLORER]
                        }],
                    });
                } catch (addError) {
                    throw addError;
                }
            } else {
                throw switchError;
            }
        }
    },
    
    // Получение баланса
    async getBalance(address) {
        try {
            const balance = await this.web3.eth.getBalance(address);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Get balance error:', error);
            return '0';
        }
    },
    
    // Форматирование адреса
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    // Отправка транзакции
    async sendTransaction(to, value, data = '0x') {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            const gasLimit = await this.web3.eth.estimateGas({
                from: this.currentAccount,
                to: to,
                value: value,
                data: data
            });
            
            const tx = {
                from: this.currentAccount,
                to: to,
                value: value,
                gas: Math.floor(gasLimit * 1.2),
                gasPrice: gasPrice,
                data: data
            };
            
            const txHash = await this.provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
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
        while (!receipt) {
            receipt = await this.web3.eth.getTransactionReceipt(txHash);
            if (!receipt) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return receipt;
    }
};
