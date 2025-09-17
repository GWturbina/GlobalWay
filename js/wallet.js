/* ========================================
   GlobalWay - Wallet Management
   ПРИОРИТЕТ: SafePal
   ======================================== */

window.WalletManager = {
    // Приоритет кошельков
    WALLET_PRIORITY: ['SafePal', 'WalletConnect', 'MetaMask'],
    
    // Определение типов кошельков
    WALLET_IDENTIFIERS: {
        SafePal: {
            check: () => window.ethereum && window.ethereum.isSafePal,
            name: 'SafePal',
            icon: '🔐'
        },
        WalletConnect: {
            check: () => window.ethereum && window.ethereum.isWalletConnect,
            name: 'WalletConnect',
            icon: '🔗'
        },
        MetaMask: {
            check: () => window.ethereum && window.ethereum.isMetaMask && !window.ethereum.isSafePal,
            name: 'MetaMask',
            icon: '🦊'
        }
    },
    
    currentWallet: null,
    
    // Определение доступных кошельков
    detectWallets() {
        const available = [];
        
        for (const [key, wallet] of Object.entries(this.WALLET_IDENTIFIERS)) {
            if (wallet.check()) {
                available.push({
                    id: key,
                    name: wallet.name,
                    icon: wallet.icon
                });
            }
        }
        
        // Сортируем по приоритету
        available.sort((a, b) => {
            const priorityA = this.WALLET_PRIORITY.indexOf(a.id);
            const priorityB = this.WALLET_PRIORITY.indexOf(b.id);
            return priorityA - priorityB;
        });
        
        return available;
    },
    
    // Получение приоритетного кошелька
    getPriorityWallet() {
        const wallets = this.detectWallets();
        
        // Всегда возвращаем SafePal если доступен
        const safePal = wallets.find(w => w.id === 'SafePal');
        if (safePal) return safePal;
        
        // Иначе первый из доступных
        return wallets[0] || null;
    },
    
    // Проверка мобильного устройства
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Подключение кошелька
    async connectWallet() {
        try {
            // На мобильных устройствах
            if (this.isMobile()) {
                return await this.connectMobileWallet();
            }
            
            // На десктопе
            return await this.connectDesktopWallet();
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    },
    
    // Подключение на мобильном
    async connectMobileWallet() {
        // Проверяем, открыт ли сайт в браузере SafePal
        if (window.ethereum && window.ethereum.isSafePal) {
            this.currentWallet = 'SafePal';
            return await Web3Manager.connect();
        }
        
        // Проверяем установлен ли SafePal
        const safepalUrl = `https://link.safepal.io/wc?uri=${encodeURIComponent(window.location.href)}`;
        
        // Показываем модальное окно выбора
        const choice = await this.showWalletChoice([
            {
                name: 'SafePal Wallet',
                action: () => {
                    if (this.isInAppBrowser()) {
                        alert('Please open this site in SafePal Wallet browser');
                    } else {
                        window.location.href = safepalUrl;
                    }
                }
            },
            {
                name: 'WalletConnect',
                action: async () => {
                    // Логика WalletConnect
                    await this.connectViaWalletConnect();
                }
            }
        ]);
        
        return choice;
    },
    
    // Подключение на десктопе
    async connectDesktopWallet() {
        const priorityWallet = this.getPriorityWallet();
        
        if (!priorityWallet) {
            throw new Error('No wallet detected. Please install SafePal extension.');
        }
        
        // Если доступен SafePal - используем его
        if (priorityWallet.id === 'SafePal') {
            this.currentWallet = 'SafePal';
            return await Web3Manager.connect();
        }
        
        // Показываем предупреждение о приоритете SafePal
        const useCurrent = confirm(
            `SafePal wallet is recommended for best experience.\n` +
            `You have ${priorityWallet.name} available. Continue with ${priorityWallet.name}?`
        );
        
        if (useCurrent) {
            this.currentWallet = priorityWallet.id;
            return await Web3Manager.connect();
        }
        
        return null;
    },
    
    // Проверка in-app браузера
    isInAppBrowser() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return ua.includes("FBAN") || ua.includes("FBAV") || ua.includes("Instagram");
    },
    
    // Показать выбор кошелька
    async showWalletChoice(options) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'wallet-modal';
            modal.innerHTML = `
                <div class="wallet-modal-content">
                    <h3>Connect Wallet</h3>
                    <div class="wallet-options">
                        ${options.map(opt => `
                            <button class="wallet-option" data-wallet="${opt.name}">
                                ${opt.name}
                            </button>
                        `).join('')}
                    </div>
                    <button class="wallet-cancel">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Обработчики
            options.forEach((opt, index) => {
                modal.querySelectorAll('.wallet-option')[index].onclick = async () => {
                    document.body.removeChild(modal);
                    resolve(await opt.action());
                };
            });
            
            modal.querySelector('.wallet-cancel').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
        });
    },
    
    // WalletConnect подключение
    async connectViaWalletConnect() {
        // Здесь будет логика WalletConnect
        // Пока заглушка
        alert('WalletConnect integration coming soon. Please use SafePal.');
        return null;
    },
    
    // Получение информации о текущем кошельке
    getCurrentWalletInfo() {
        if (!this.currentWallet) return null;
        
        return {
            type: this.currentWallet,
            ...this.WALLET_IDENTIFIERS[this.currentWallet],
            address: Web3Manager.currentAccount,
            shortAddress: Web3Manager.formatAddress(Web3Manager.currentAccount)
        };
    },
    
    // Переподключение при обновлении страницы
    async autoReconnect() {
        const savedWallet = localStorage.getItem('currentWallet');
        if (savedWallet && Web3Manager.isConnected) {
            this.currentWallet = savedWallet;
            return true;
        }
        return false;
    }
};
