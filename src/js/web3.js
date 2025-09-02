// ==================== ПОЛНЫЙ WEB3 MANAGER С SAFEPAL ПРИОРИТЕТОМ ====================

class Web3Manager {
  constructor() {
    this.web3 = null;
    this.account = null;
    this.isConnected = false;
    this.provider = null;
    this.networkId = null;
    this.listeners = {};
    this.retryCount = 0;
    this.maxRetries = 3;
    this.isInitializing = false;
    this.supportedNetworks = {
      204: {  // opBNB - ОСНОВНАЯ СЕТЬ!
        name: 'opBNB Mainnet',
        symbol: 'BNB',
        rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
        blockExplorerUrls: ['https://mainnet.opbnbscan.com'],
        chainId: '0xCC'  // 204 в hex
      },
      56: {
        name: 'Binance Smart Chain',
        symbol: 'BNB',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/'],
        chainId: '0x38'
      },
      1: {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/'],
        chainId: '0x1'
      }
    };
    
    this.init();
  }

  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;
    
    console.log('🔍 Инициализация Web3Manager...');
    
    // Детекция мобильного устройства
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isAndroid = /Android/.test(navigator.userAgent);
    
    if (this.isMobile) {
      console.log('📱 Мобильное устройство обнаружено:', this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Unknown');
    }
    
    await this.detectWalletProvider();
    this.setupEventListeners();
    this.setupNetworkMonitoring();
    
    console.log('✅ Web3Manager инициализирован с приоритетом SafePal');
    this.isInitializing = false;
  }

  async detectWalletProvider() {
    console.log('🔍 Поиск кошелька SafePal...');
    
    // Ждем немного для полной загрузки расширения
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ИСПРАВЛЕНО: Правильная проверка SafePal
    if (window.safepalProvider) {
      console.log('✅ SafePal (safepalProvider) обнаружен');
      this.provider = window.safepalProvider;
      this.providerType = 'SafePal';
    } else if (window.safepal && window.safepal.ethereum) {
      console.log('✅ SafePal (safepal.ethereum) обнаружен');
      this.provider = window.safepal.ethereum;
      this.providerType = 'SafePal';
    } else if (window.ethereum && window.ethereum.isSafePal) {
      console.log('✅ SafePal (ethereum.isSafePal) обнаружен');
      this.provider = window.ethereum;
      this.providerType = 'SafePal';
    } else if (window.ethereum) {
      console.log('✅ Ethereum provider найден, проверяем тип...');
      this.provider = window.ethereum;
      
      if (window.ethereum.isMetaMask) {
        this.providerType = 'MetaMask';
      } else {
        this.providerType = 'Unknown Wallet';
      }
    } else {
      console.warn('❌ Кошелек не найден');
      this.provider = null;
      this.providerType = null;
    }
    
    if (this.provider) {
      this.web3 = new Web3(this.provider);
    }
  }

  async connectWallet() {
    console.log('🔗 Попытка подключения к кошельку...');
    
    // Мобильная версия - показываем опции
    if (this.isMobile && !this.provider) {
      return this.showMobileWalletOptions();
    }
    
    // Десктопная версия - проверяем наличие кошелька
    if (!this.provider) {
      this.showWalletInstallPrompt();
      return;
    }

    try {
      // Показываем тип подключаемого кошелька
      if (window.globalWayApp) {
        window.globalWayApp.showNotification(`Подключение ${this.providerType}...`, 'info');
      }

      // Запрос разрешения на подключение
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Нет доступных аккаунтов в кошельке');
      }

      this.account = accounts[0];
      this.isConnected = true;

      // Получаем информацию о сети
      const networkId = await this.provider.request({
        method: 'net_version'
      });
      
      this.networkId = parseInt(networkId);
      
      // Получаем баланс
      const balance = await this.web3.eth.getBalance(this.account);
      
      console.log('✅ Кошелек подключен:', {
        type: this.providerType,
        account: this.account,
        networkId: this.networkId,
        network: this.getNetworkName(this.networkId),
        balance: this.web3.utils.fromWei(balance, 'ether') + ' ' + this.getNetworkSymbol(this.networkId)
      });

      // ИСПРАВЛЕНО: Проверяем правильность сети (opBNB = 204)
      if (this.networkId !== 204) {
        console.warn('⚠️ Подключена неправильная сеть:', this.getNetworkName(this.networkId));
        
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Требуется переключение на opBNB сеть', 'warning');
        }
        
        // Предлагаем переключиться
        const shouldSwitch = await this.showNetworkSwitchPrompt();
        if (shouldSwitch) {
          await this.switchToOpBNB();
        }
      } else {
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Подключена правильная сеть opBNB', 'success');
        }
      }

      // Сохраняем статус подключения
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_type', this.providerType);

      this.emit('connected', {
        account: this.account,
        networkId: this.networkId,
        providerType: this.providerType,
        balance: balance
      });

      return this.account;

    } catch (error) {
      console.error('❌ Ошибка подключения к кошельку:', error);
      
      if (error.code === 4001) {
        throw new Error('Пользователь отклонил подключение');
      } else if (error.code === -32002) {
        throw new Error('Запрос на подключение уже обрабатывается');
      } else if (error.code === -32603) {
        throw new Error('Внутренняя ошибка кошелька');
      } else {
        throw new Error(`Ошибка подключения: ${error.message}`);
      }
    }
  }

  // ИСПРАВЛЕНО: Переключение на opBNB вместо BSC
  async switchToOpBNB() {
    console.log('🔄 Переключение на opBNB сеть...');
    
    try {
      // Пытаемся переключиться на opBNB
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xCC' }], // opBNB = 204 = 0xCC
      });
      
      this.networkId = 204;
      console.log('✅ Переключено на opBNB');
      
      if (window.globalWayApp) {
        window.globalWayApp.showNotification('Переключено на opBNB Mainnet', 'success');
      }
      
    } catch (switchError) {
      console.log('Ошибка переключения, код:', switchError.code);
      
      // Если сеть не добавлена, добавляем её
      if (switchError.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xCC',
              chainName: 'opBNB Mainnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
              blockExplorerUrls: ['https://mainnet.opbnbscan.com']
            }]
          });
          
          this.networkId = 204;
          console.log('✅ opBNB сеть добавлена и активирована');
          
          if (window.globalWayApp) {
            window.globalWayApp.showNotification('opBNB сеть добавлена и активирована', 'success');
          }
          
        } catch (addError) {
          console.error('❌ Ошибка добавления opBNB сети:', addError);
          
          if (window.globalWayApp) {
            window.globalWayApp.showNotification('Не удалось добавить opBNB сеть', 'error');
          }
          
          throw addError;
        }
      } else if (switchError.code === 4001) {
        console.log('Пользователь отклонил переключение сети');
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Переключение сети отклонено', 'warning');
        }
      } else {
        throw switchError;
      }
    }
  }

  async showNetworkSwitchPrompt() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'network-switch-modal';
      modal.innerHTML = `
        <div class="wallet-modal-overlay">
          <div class="wallet-modal-content">
            <div class="wallet-modal-header">
              <h3>Переключение сети</h3>
            </div>
            <div class="wallet-modal-body">
              <div class="network-icon">🌐</div>
              <p>Для корректной работы требуется сеть opBNB Mainnet</p>
              <p>Текущая сеть: <strong>${this.getNetworkName(this.networkId)}</strong></p>
              <div class="network-buttons">
                <button class="network-btn primary" onclick="document.querySelector('.network-switch-modal').remove(); resolve(true);">
                  Переключить на opBNB
                </button>
                <button class="network-btn secondary" onclick="document.querySelector('.network-switch-modal').remove(); resolve(false);">
                  Продолжить с текущей
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Привязываем resolve к кнопкам
      modal.querySelector('.network-btn.primary').onclick = () => {
        modal.remove();
        resolve(true);
      };
      
      modal.querySelector('.network-btn.secondary').onclick = () => {
        modal.remove();
        resolve(false);
      };

      document.body.appendChild(modal);
    });
  }

  showMobileWalletOptions() {
    console.log('📱 Показ опций мобильных кошельков...');
    
    // Получаем текущий URL
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    
    // Deep links для различных кошельков
    const walletLinks = {
      safepal: `https://link.safepal.io/browser?url=${encodedUrl}`,
      trust: `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}`,
      metamask: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`,
    };

    const modal = document.createElement('div');
    modal.className = 'mobile-wallet-modal';
    modal.innerHTML = `
      <div class="wallet-modal-overlay">
        <div class="wallet-modal-content">
          <div class="wallet-modal-header">
            <h3>Подключить кошелек</h3>
            <button class="wallet-modal-close" onclick="this.closest('.mobile-wallet-modal').remove()">&times;</button>
          </div>
          <div class="wallet-modal-body">
            <p>Выберите ваш кошелек для подключения:</p>
            <div class="wallet-options">
              <button class="wallet-option safepal recommended" onclick="window.location.href='${walletLinks.safepal}'">
                <div class="wallet-icon">🔐</div>
                <div class="wallet-info">
                  <div class="wallet-name">SafePal <span class="recommended-badge">Рекомендуется</span></div>
                  <div class="wallet-desc">Открыть в SafePal браузере</div>
                </div>
              </button>
              <button class="wallet-option trust" onclick="window.location.href='${walletLinks.trust}'">
                <div class="wallet-icon">🛡️</div>
                <div class="wallet-info">
                  <div class="wallet-name">Trust Wallet</div>
                  <div class="wallet-desc">Открыть в Trust Wallet</div>
                </div>
              </button>
              <button class="wallet-option copy" onclick="navigator.clipboard.writeText('${currentUrl}').then(() => alert('Ссылка скопирована! Вставьте её в браузер вашего кошелька'))">
                <div class="wallet-icon">📋</div>
                <div class="wallet-info">
                  <div class="wallet-name">Скопировать ссылку</div>
                  <div class="wallet-desc">Для вставки в любой кошелек</div>
                </div>
              </button>
            </div>
            <div class="wallet-instructions">
              <h4>Инструкция:</h4>
              <ol>
                <li>Выберите ваш кошелек из списка выше</li>
                <li>Если у вас SafePal - нажмите первую кнопку</li>
                <li>Приложение кошелька откроется автоматически</li>
                <li>Подтвердите подключение в кошельке</li>
              </ol>
              <div class="install-note">
                <strong>Нет кошелька?</strong> Скачайте SafePal из 
                <a href="https://apps.apple.com/app/safepal-wallet/id1548297139" target="_blank">App Store</a> или 
                <a href="https://play.google.com/store/apps/details?id=io.safepal.wallet" target="_blank">Google Play</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setupEventListeners() {
    if (!this.provider) return;

    console.log('🔗 Настройка обработчиков событий кошелька...');

    // Изменение аккаунта
    this.provider.on('accountsChanged', (accounts) => {
      console.log('👤 Аккаунт изменен:', accounts);
      
      if (accounts.length === 0) {
        console.log('🔌 Кошелек отключен (нет аккаунтов)');
        this.disconnectWallet();
      } else if (accounts[0] !== this.account) {
        const oldAccount = this.account;
        this.account = accounts[0];
        
        console.log('🔄 Переключение аккаунта:', {
          from: oldAccount,
          to: this.account
        });
        
        this.emit('accountChanged', {
          newAccount: this.account,
          oldAccount: oldAccount
        });
        
        // Обновляем данные пользователя
        if (window.globalWayApp) {
          window.globalWayApp.updateUserInfo();
        }
      }
    });

    // Изменение сети
    this.provider.on('chainChanged', (chainId) => {
      const newNetworkId = parseInt(chainId, 16);
      const oldNetworkId = this.networkId;
      
      console.log('🌐 Сеть изменена:', {
        from: this.getNetworkName(oldNetworkId),
        to: this.getNetworkName(newNetworkId),
        chainId: chainId
      });
      
      this.networkId = newNetworkId;
      
      this.emit('networkChanged', {
        newNetworkId: this.networkId,
        oldNetworkId: oldNetworkId,
        networkName: this.getNetworkName(this.networkId)
      });
      
      // ИСПРАВЛЕНО: Проверяем поддерживаемость сети (opBNB = 204)
      if (this.networkId !== 204) {
        console.warn('⚠️ Подключена неподдерживаемая сеть:', this.getNetworkName(this.networkId));
        if (window.globalWayApp) {
          window.globalWayApp.showNotification(
            `Подключена сеть ${this.getNetworkName(this.networkId)}. Рекомендуется opBNB.`, 
            'warning'
          );
        }
      } else {
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Подключена правильная сеть opBNB', 'success');
        }
      }
      
      // Перезагружаем контракты для новой сети
      if (window.contractManager) {
        window.contractManager.reinitializeContracts();
      }
    });

    // Подключение/отключение
    this.provider.on('connect', (connectInfo) => {
      console.log('🔗 Кошелек подключен:', connectInfo);
      this.networkId = parseInt(connectInfo.chainId, 16);
      
      this.emit('providerConnected', {
        chainId: connectInfo.chainId,
        networkId: this.networkId
      });
    });

    this.provider.on('disconnect', (error) => {
      console.log('❌ Кошелек отключен:', error);
      this.disconnectWallet();
    });
  }

  setupNetworkMonitoring() {
    // Периодическая проверка состояния подключения
    setInterval(async () => {
      if (this.isConnected && this.provider) {
        try {
          const isConnected = await this.provider.request({
            method: 'eth_accounts'
          });
          
          if (isConnected.length === 0 && this.isConnected) {
            console.warn('⚠️ Потеряно подключение к кошельку');
            this.disconnectWallet();
          }
        } catch (error) {
          if (error.code === 4100) {
            console.warn('⚠️ Провайдер недоступен');
            this.disconnectWallet();
          }
        }
      }
    }, 30000);
  }

  disconnectWallet() {
    console.log('🔌 Отключение кошелька...');
    
    const wasConnected = this.isConnected;
    
    this.account = null;
    this.isConnected = false;
    this.networkId = null;
    this.retryCount = 0;
    
    // Очищаем сохраненное состояние
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_type');
    localStorage.removeItem('wallet_account');
    
    if (wasConnected) {
      this.emit('disconnected');
      
      if (window.globalWayApp) {
        window.globalWayApp.showNotification('Кошелек отключен', 'info');
      }
    }
  }

  // ИСПРАВЛЕНО: Обновленные названия сетей
  getNetworkName(networkId) {
    const networks = {
      204: 'opBNB Mainnet',  // ОСНОВНАЯ СЕТЬ!
      56: 'Binance Smart Chain',
      1: 'Ethereum Mainnet',
      137: 'Polygon',
      250: 'Fantom',
      43114: 'Avalanche',
      42161: 'Arbitrum',
      10: 'Optimism',
      97: 'BSC Testnet',
      5611: 'opBNB Testnet'
    };
    
    return networks[networkId] || `Unknown Network (${networkId})`;
  }

  getNetworkSymbol(networkId) {
    const symbols = {
      204: 'BNB',  // opBNB использует BNB
      56: 'BNB',
      1: 'ETH',
      137: 'MATIC',
      250: 'FTM',
      43114: 'AVAX',
      42161: 'ETH',
      10: 'ETH',
      97: 'tBNB',
      5611: 'tBNB'
    };
    
    return symbols[networkId] || 'ETH';
  }

  // Остальные методы остаются без изменений...
  // (sendTransaction, signMessage, getBalance и т.д.)

  // Event emitter методы
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Ошибка в обработчике события ${event}:`, error);
        }
      });
    }
  }

  // Методы состояния
  isWalletConnected() {
    return this.isConnected && this.account;
  }

  getAccount() {
    return this.account;
  }

  getNetworkId() {
    return this.networkId;
  }

  getProviderType() {
    return this.providerType;
  }

  getWeb3() {
    return this.web3;
  }

  getProvider() {
    return this.provider;
  }
}

// Инициализация Web3Manager
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof Web3 === 'undefined') {
    console.error('❌ Web3 библиотека не загружена');
    return;
  }

  console.log('🚀 Запуск Web3Manager...');
  
  window.web3Manager = new Web3Manager();
  
  console.log('✅ Web3Manager готов к работе');
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Web3Manager;
}
