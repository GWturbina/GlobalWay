/**
 * Web3 Manager для GlobalWay с приоритетом SafePal
 * Управляет подключением кошельков и взаимодействием с блокчейном opBNB
 */

class Web3Manager {
  constructor() {
    this.provider = null;
    this.web3 = null;
    this.currentAccount = null;
    this.networkId = null;
    this.isConnecting = false;
    this.isConnected = false;
    
    // Конфигурация сети opBNB
    this.opBNBConfig = {
      chainId: '0xCC', // 204 в hex
      chainName: 'opBNB',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
      blockExplorerUrls: ['https://opbnbscan.com']
    };

    this.eventListeners = new Map();
    this.initializeEvents();
  }

  /**
   * Инициализация слушателей событий
   */
  initializeEvents() {
    // Слушаем изменения аккаунта
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.handleAccountsChanged(accounts);
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.handleChainChanged(chainId);
      });

      window.ethereum.on('disconnect', () => {
        this.handleDisconnect();
      });
    }
  }

  /**
   * Проверка доступности кошельков с приоритетом SafePal
   */
  detectAvailableWallets() {
    const wallets = [];

    // Приоритет #1: SafePal
    if (window.safepalProvider || (window.ethereum && window.ethereum.isSafePal)) {
      wallets.push({
        name: 'SafePal',
        provider: window.safepalProvider || window.ethereum,
        priority: 1,
        icon: '🔐',
        isPreferred: true
      });
    }

    // Другие кошельки как fallback
    if (window.ethereum && !window.ethereum.isSafePal) {
      if (window.ethereum.isMetaMask) {
        wallets.push({
          name: 'MetaMask',
          provider: window.ethereum,
          priority: 3,
          icon: '🦊',
          isPreferred: false
        });
      } else if (window.ethereum.isTrustWallet) {
        wallets.push({
          name: 'Trust Wallet',
          provider: window.ethereum,
          priority: 2,
          icon: '🛡️',
          isPreferred: false
        });
      } else {
        wallets.push({
          name: 'Web3 Wallet',
          provider: window.ethereum,
          priority: 4,
          icon: '🌐',
          isPreferred: false
        });
      }
    }

    // WalletConnect как последний вариант
    if (typeof WalletConnect !== 'undefined') {
      wallets.push({
        name: 'WalletConnect',
        provider: 'walletconnect',
        priority: 5,
        icon: '🔗',
        isPreferred: false
      });
    }

    return wallets.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Подключение кошелька с приоритетом SafePal
   */
  async connectWallet(preferredWallet = null) {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;
    
    try {
      const availableWallets = this.detectAvailableWallets();
      
      if (availableWallets.length === 0) {
        throw new Error('No wallet detected. Please install SafePal or another Web3 wallet.');
      }

      // Выбираем кошелек
      let selectedWallet;
      if (preferredWallet) {
        selectedWallet = availableWallets.find(w => w.name === preferredWallet);
      }
      
      // Если не найден предпочитаемый, берем первый (SafePal в приоритете)
      if (!selectedWallet) {
        selectedWallet = availableWallets[0];
      }

      console.log(`🔌 Connecting to ${selectedWallet.name}...`);

      if (selectedWallet.name === 'WalletConnect') {
        await this.connectWalletConnect();
      } else {
        await this.connectProvider(selectedWallet.provider);
      }

      // Проверяем и переключаем на opBNB сеть
      await this.ensureOpBNBNetwork();

      this.isConnected = true;
      this.dispatchEvent('walletConnected', {
        wallet: selectedWallet.name,
        account: this.currentAccount,
        network: this.networkId
      });

      console.log(`✅ Connected to ${selectedWallet.name}: ${this.currentAccount}`);
      
      return {
        success: true,
        wallet: selectedWallet.name,
        account: this.currentAccount
      };

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      this.dispatchEvent('walletError', { error: error.message });
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Подключение к провайдеру
   */
  async connectProvider(provider) {
    this.provider = provider;
    
    // Инициализируем Web3
    if (typeof Web3 !== 'undefined') {
      this.web3 = new Web3(this.provider);
    } else {
      throw new Error('Web3 library not found');
    }

    // Запрашиваем доступ к аккаунтам
    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    this.currentAccount = accounts[0];
    
    // Получаем ID сети
    const chainId = await this.provider.request({
      method: 'eth_chainId'
    });
    
    this.networkId = parseInt(chainId, 16);
  }

  /**
   * Подключение через WalletConnect
   */
  async connectWalletConnect() {
    // Этот метод будет реализован при необходимости
    throw new Error('WalletConnect integration not yet implemented');
  }

  /**
   * Проверка и переключение на сеть opBNB
   */
  async ensureOpBNBNetwork() {
    const targetChainId = 204; // opBNB chainId
    
    if (this.networkId === targetChainId) {
      console.log('✅ Already connected to opBNB network');
      return;
    }

    try {
      // Пытаемся переключиться на opBNB
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.opBNBConfig.chainId }]
      });
      
      this.networkId = targetChainId;
      console.log('✅ Switched to opBNB network');
      
    } catch (switchError) {
      // Если сеть не добавлена, добавляем её
      if (switchError.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [this.opBNBConfig]
          });
          
          this.networkId = targetChainId;
          console.log('✅ Added and switched to opBNB network');
          
        } catch (addError) {
          throw new Error(`Failed to add opBNB network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch to opBNB network: ${switchError.message}`);
      }
    }
  }

  /**
   * Отключение кошелька
   */
  async disconnectWallet() {
    this.provider = null;
    this.web3 = null;
    this.currentAccount = null;
    this.networkId = null;
    this.isConnected = false;

    // Очищаем сохраненное состояние
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('selectedWallet');

    this.dispatchEvent('walletDisconnected');
    console.log('🔌 Wallet disconnected');
  }

  /**
   * Получение баланса аккаунта
   */
  async getBalance(address = null) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    const account = address || this.currentAccount;
    if (!account) {
      throw new Error('No account specified');
    }

    try {
      const balanceWei = await this.web3.eth.getBalance(account);
      const balanceEth = this.web3.utils.fromWei(balanceWei, 'ether');
      return parseFloat(balanceEth);
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Отправка транзакции
   */
  async sendTransaction(to, value, data = '0x', gasLimit = null) {
    if (!this.web3 || !this.currentAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      const txParams = {
        from: this.currentAccount,
        to: to,
        value: this.web3.utils.toWei(value.toString(), 'ether'),
        data: data
      };

      // Оценка газа если не указан
      if (!gasLimit) {
        try {
          txParams.gas = await this.web3.eth.estimateGas(txParams);
        } catch (gasError) {
          console.warn('Gas estimation failed, using default');
          txParams.gas = 21000;
        }
      } else {
        txParams.gas = gasLimit;
      }

      // Получение цены газа
      const gasPrice = await this.web3.eth.getGasPrice();
      txParams.gasPrice = gasPrice;

      // Отправка транзакции
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      console.log('📤 Transaction sent:', txHash);
      return txHash;

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Получение статуса транзакции
   */
  async getTransactionStatus(txHash) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      if (receipt) {
        return {
          status: receipt.status ? 'success' : 'failed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          receipt: receipt
        };
      } else {
        return { status: 'pending' };
      }
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * Ожидание подтверждения транзакции
   */
  async waitForTransaction(txHash, maxWaitTime = 300000) { // 5 минут
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getTransactionStatus(txHash);
        
        if (status.status === 'success') {
          return status;
        } else if (status.status === 'failed') {
          throw new Error('Transaction failed');
        }
        
        // Ждем 3 секунды перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        if (error.message !== 'Transaction failed') {
          console.warn('Error checking transaction status:', error);
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Transaction timeout');
  }

  /**
   * Подпись сообщения
   */
  async signMessage(message) {
    if (!this.provider || !this.currentAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [
          this.web3.utils.utf8ToHex(message),
          this.currentAccount
        ]
      });

      return signature;
    } catch (error) {
      console.error('❌ Message signing failed:', error);
      throw error;
    }
  }

  /**
   * Проверка подписи
   */
  verifySignature(message, signature, address) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const recoveredAddress = this.web3.eth.accounts.recover(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Обработчики событий кошелька
   */
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else if (accounts[0] !== this.currentAccount) {
      this.currentAccount = accounts[0];
      this.dispatchEvent('accountChanged', { account: this.currentAccount });
      console.log('👤 Account changed to:', this.currentAccount);
    }
  }

  handleChainChanged(chainId) {
    this.networkId = parseInt(chainId, 16);
    this.dispatchEvent('networkChanged', { networkId: this.networkId });
    console.log('🌐 Network changed to:', this.networkId);
    
    // Проверяем, что мы на правильной сети
    if (this.networkId !== 204) {
      this.dispatchEvent('wrongNetwork', { 
        current: this.networkId, 
        required: 204 
      });
    }
  }

  handleDisconnect() {
    this.disconnectWallet();
  }

  /**
   * Система событий
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  removeEventListener(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(eventName, data = {}) {
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event handler error for ${eventName}:`, error);
        }
      });
    }

    // Также диспетчеризируем глобальное событие
    window.dispatchEvent(new CustomEvent(`web3-${eventName}`, { detail: data }));
  }

  /**
   * Автоматическое переподключение при загрузке страницы
   */
  async autoConnect() {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const savedWallet = localStorage.getItem('selectedWallet');

    if (wasConnected && savedWallet) {
      try {
        await this.connectWallet(savedWallet);
        console.log('🔄 Auto-reconnected to wallet');
      } catch (error) {
        console.log('ℹ️ Auto-reconnect failed, user needs to connect manually');
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('selectedWallet');
      }
    }
  }

  /**
   * Проверка состояния подключения
   */
  isWalletConnected() {
    return this.isConnected && this.currentAccount && this.networkId === 204;
  }

  /**
   * Получение информации о текущем подключении
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      account: this.currentAccount,
      networkId: this.networkId,
      isCorrectNetwork: this.networkId === 204,
      provider: this.provider
    };
  }

  /**
   * Форматирование адреса
   */
  formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) {
      return address;
    }
    
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Проверка валидности адреса
   */
  isValidAddress(address) {
    if (!this.web3) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    return this.web3.utils.isAddress(address);
  }
}

// Создаем глобальный экземпляр
const web3Manager = new Web3Manager();

// Автоматическое переподключение при загрузке
document.addEventListener('DOMContentLoaded', () => {
  web3Manager.autoConnect();
});

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = web3Manager;
}

// Глобальная доступность
window.web3Manager = web3Manager;
