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
      },
      137: {
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
        chainId: '0x89'
      }
    };
    
    this.init();
  }

  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;
    
    console.log('🔍 Инициализация Web3Manager...');
    
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
      console.warn('⌀ Кошелек не найден');
      this.provider = null;
      this.providerType = null;
    }
    
    if (this.provider) {
      this.web3 = new Web3(this.provider);
    }
  }

  async connectWallet() {
    console.log('🔗 Попытка подключения к кошельку...');
    
    if (this.isMobile && !this.provider) {
      return this.showMobileWalletOptions();
    }
    
    if (!this.provider) {
      this.showWalletInstallPrompt();
      return;
    }

    try {
      if (window.globalWayApp) {
        window.globalWayApp.showNotification(`Подключение ${this.providerType}...`, 'info');
      }

      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Нет доступных аккаунтов в кошельке');
      }

      this.account = accounts[0];
      this.isConnected = true;

      const networkId = await this.provider.request({
        method: 'net_version'
      });
      
      this.networkId = parseInt(networkId);
      
      const balance = await this.web3.eth.getBalance(this.account);
      
      console.log('✅ Кошелек подключен:', {
        type: this.providerType,
        account: this.account,
        networkId: this.networkId,
        network: this.getNetworkName(this.networkId),
        balance: this.web3.utils.fromWei(balance, 'ether') + ' ' + this.getNetworkSymbol(this.networkId)
      });

      if (this.networkId !== 204) {
        console.warn('⚠️ Подключена неправильная сеть:', this.getNetworkName(this.networkId));
        
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Требуется переключение на opBNB сеть', 'warning');
        }
        
        const shouldSwitch = await this.showNetworkSwitchPrompt();
        if (shouldSwitch) {
          await this.switchToOpBNB();
        }
      } else {
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Подключена правильная сеть opBNB', 'success');
        }
      }

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
      console.error('⌀ Ошибка подключения к кошельку:', error);
      
      // ИСПРАВЛЕНО: Убираем модальные наложения при ошибке
      this.removeModalOverlays();
      
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

  // НОВАЯ ФУНКЦИЯ: Удаление модальных наложений
  removeModalOverlays() {
    const overlays = document.querySelectorAll('.cosmic-modal-overlay, .wallet-modal-overlay, .loading-overlay, .network-switch-modal, .install-wallet-modal, .mobile-wallet-modal');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    // Убираем blur эффект с body
    document.body.style.filter = '';
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
  }

  showMobileWalletOptions() {
    console.log('📱 Показ опций мобильных кошельков...');
    
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    
    const walletLinks = {
      safepal: `https://link.safepal.io/browser?url=${encodedUrl}`,
      trust: `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}`,
      metamask: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`,
      coinbase: `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`
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
              <button class="wallet-option metamask" onclick="window.location.href='${walletLinks.metamask}'">
                <div class="wallet-icon">🦊</div>
                <div class="wallet-info">
                  <div class="wallet-name">MetaMask</div>
                  <div class="wallet-desc">Открыть в MetaMask</div>
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

    this.addModalStyles();
    document.body.appendChild(modal);
  }

  // НОВАЯ ФУНКЦИЯ: Добавление стилей для модальных окон
  addModalStyles() {
    if (document.getElementById('web3-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'web3-modal-styles';
    style.textContent = `
      .mobile-wallet-modal, .install-wallet-modal, .network-switch-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      
      .wallet-modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        backdrop-filter: blur(5px);
      }
      
      .wallet-modal-content {
        background: var(--card-bg, #1a1a2e);
        border-radius: 20px;
        max-width: 450px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        border: 2px solid var(--accent-gold, #FFD700);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .wallet-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25px;
        border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        background: rgba(255, 215, 0, 0.05);
      }
      
      .wallet-modal-header h3 {
        color: var(--accent-gold, #FFD700);
        margin: 0;
        font-size: 20px;
      }
      
      .wallet-modal-close {
        background: none;
        border: none;
        color: var(--text-secondary, #ccc);
        font-size: 28px;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
      }
      
      .wallet-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--accent-gold, #FFD700);
      }
      
      .wallet-modal-body {
        padding: 25px;
      }
      
      .wallet-options {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 25px;
      }
      
      .wallet-option {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 18px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 215, 0, 0.2);
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        position: relative;
      }
      
      .wallet-option:hover {
        background: rgba(255, 215, 0, 0.1);
        border-color: var(--accent-gold, #FFD700);
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(255, 215, 0, 0.2);
      }
      
      .wallet-option.recommended {
        border-color: var(--accent-gold, #FFD700);
        background: rgba(255, 215, 0, 0.08);
      }
      
      .recommended-badge {
        background: var(--accent-gold, #FFD700);
        color: #000;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .wallet-instructions {
        background: rgba(255, 215, 0, 0.08);
        border-radius: 15px;
        padding: 20px;
        border-left: 4px solid var(--accent-gold, #FFD700);
      }
      
      .install-note {
        background: rgba(255, 255, 255, 0.05);
        padding: 12px;
        border-radius: 10px;
        font-size: 13px;
        margin-top: 15px;
      }
      
      .network-buttons, .install-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin: 25px 0;
      }
      
      .network-btn, .install-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .network-btn.primary, .install-btn.primary {
        background: var(--accent-gold, #FFD700);
        color: #000;
      }
      
      .network-btn.secondary, .install-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary, #ccc);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
    `;

    document.head.appendChild(style);
  }

  showWalletInstallPrompt() {
    const isDesktop = !this.isMobile;
    let message, actionUrl;
    
    if (isDesktop) {
      message = 'Установите расширение SafePal для браузера';
      actionUrl = 'https://chrome.google.com/webstore/detail/safepal-extension-wallet/lgmpcpglpngdoalbgeoldeajfclnhafa';
    } else {
      message = 'Установите приложение SafePal';
      actionUrl = this.isIOS 
        ? 'https://apps.apple.com/app/safepal-wallet/id1548297139'
        : 'https://play.google.com/store/apps/details?id=io.safepal.wallet';
    }
    
    console.warn('⌀', message);
    
    if (window.globalWayApp) {
      window.globalWayApp.showNotification(message, 'warning');
    }

    this.showInstallModal(message, actionUrl);
  }

  showInstallModal(message, actionUrl) {
    const modal = document.createElement('div');
    modal.className = 'install-wallet-modal';
    modal.innerHTML = `
      <div class="wallet-modal-overlay">
        <div class="wallet-modal-content">
          <div class="wallet-modal-header">
            <h3>Требуется кошелек</h3>
            <button class="wallet-modal-close" onclick="this.closest('.install-wallet-modal').remove()">&times;</button>
          </div>
          <div class="wallet-modal-body">
            <div class="install-icon">🔐</div>
            <p>${message}</p>
            <div class="install-buttons">
              <button class="install-btn primary" onclick="window.open('${actionUrl}', '_blank')">
                Установить SafePal
              </button>
              <button class="install-btn secondary" onclick="this.closest('.install-wallet-modal').remove()">
                Позже
              </button>
            </div>
            <div class="install-help">
              <p>После установки обновите страницу для подключения</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addModalStyles();
    document.body.appendChild(modal);
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
                <button class="network-btn primary" id="switchToOpBNB">
                  Переключить на opBNB
                </button>
                <button class="network-btn secondary" id="continueWithCurrent">
                  Продолжить с текущей
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      modal.querySelector('#switchToOpBNB').onclick = () => {
        modal.remove();
        resolve(true);
      };
      
      modal.querySelector('#continueWithCurrent').onclick = () => {
        modal.remove();
        resolve(false);
      };

      this.addModalStyles();
      document.body.appendChild(modal);
    });
  }

  async switchToOpBNB() {
    console.log('🔄 Переключение на opBNB сеть...');
    
    try {
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
          console.error('⌀ Ошибка добавления opBNB сети:', addError);
          
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

  setupEventListeners() {
    if (!this.provider) return;

    console.log('🔗 Настройка обработчиков событий кошелька...');

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
        
        if (window.globalWayApp) {
          window.globalWayApp.updateUserInfo();
        }
      }
    });

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
      
      if (window.contractManager) {
        window.contractManager.reinitializeContracts();
      }
    });

    this.provider.on('connect', (connectInfo) => {
      console.log('🔗 Кошелек подключен:', connectInfo);
      this.networkId = parseInt(connectInfo.chainId, 16);
      
      this.emit('providerConnected', {
        chainId: connectInfo.chainId,
        networkId: this.networkId
      });
    });

    this.provider.on('disconnect', (error) => {
      console.log('⌀ Кошелек отключен:', error);
      this.disconnectWallet();
    });

    // ИСПРАВЛЕНО: Улучшенная обработка ошибок
    if (this.provider.on) {
      this.provider.on('error', (error) => {
        console.error('🚨 Ошибка провайдера:', error);
        this.handleProviderError(error);
        this.removeModalOverlays(); // Убираем зависшие модальные окна
      });
    }
  }

  setupNetworkMonitoring() {
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

  handleProviderError(error) {
    console.error('Ошибка провайдера:', error);
    
    // Убираем все модальные наложения при ошибке
    this.removeModalOverlays();
    
    switch(error.code) {
      case 4001:
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Запрос отклонен пользователем', 'warning');
        }
        break;
      case 4100:
        console.warn('Провайдер недоступен, переподключение...');
        this.reconnect();
        break;
      case 4200:
        console.warn('Метод не поддерживается провайдером');
        break;
      case 4900:
        this.disconnectWallet();
        break;
      default:
        if (window.globalWayApp) {
          window.globalWayApp.showNotification('Ошибка кошелька', 'error');
        }
    }
    
    this.emit('error', error);
  }

  async reconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error('⌀ Превышено количество попыток переподключения');
      this.disconnectWallet();
      return;
    }
    
    this.retryCount++;
    console.log(`🔄 Попытка переподключения ${this.retryCount}/${this.maxRetries}...`);
    
    try {
      await this.init();
      if (this.provider) {
        await this.connectWallet();
        this.retryCount = 0;
      }
    } catch (error) {
      console.error('Ошибка переподключения:', error);
      setTimeout(() => this.reconnect(), 2000 * this.retryCount);
    }
  }

  disconnectWallet() {
    console.log('🔌 Отключение кошелька...');
    
    const wasConnected = this.isConnected;
    
    this.account = null;
    this.isConnected = false;
    this.networkId = null;
    this.retryCount = 0;
    
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_type');
    localStorage.removeItem('wallet_account');
    
    // Убираем все модальные наложения
    this.removeModalOverlays();
    
    if (wasConnected) {
      this.emit('disconnected');
      
      if (window.globalWayApp) {
        window.globalWayApp.showNotification('Кошелек отключен', 'info');
      }
    }
  }

  // ==================== ТРАНЗАКЦИИ ====================

  async sendTransaction(transactionParams) {
    if (!this.isConnected) {
      throw new Error('Кошелек не подключен');
    }

    try {
      console.log('📤 Отправка транзакции:', transactionParams);
      
      if (!transactionParams.from) {
        transactionParams.from = this.account;
      }
      
      // ИСПРАВЛЕНО: Улучшенная оценка газа для opBNB
      if (!transactionParams.gas && !transactionParams.gasLimit) {
        try {
          const gasEstimate = await this.web3.eth.estimateGas(transactionParams);
          transactionParams.gas = Math.floor(gasEstimate * 1.2);
          console.log('⛽ Оценка газа:', gasEstimate, '→', transactionParams.gas);
        } catch (gasError) {
          console.warn('Не удалось оценить газ:', gasError);
          // Для opBNB устанавливаем меньший лимит газа
          transactionParams.gas = 200000;
        }
      }
      
      if (!transactionParams.gasPrice) {
        try {
          const gasPrice = await this.web3.eth.getGasPrice();
          transactionParams.gasPrice = gasPrice;
          console.log('💰 Цена газа:', this.web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');
        } catch (gasPriceError) {
          console.warn('Не удалось получить цену газа:', gasPriceError);
          // Для opBNB устанавливаем низкую цену газа
          transactionParams.gasPrice = '1000000000'; // 1 Gwei
        }
      }
      
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      });
      
      console.log('✅ Транзакция отправлена:', txHash);
      
      const receipt = await this.waitForTransaction(txHash);
      
      return {
        hash: txHash,
        receipt: receipt
      };
      
    } catch (error) {
      console.error('⌀ Ошибка отправки транзакции:', error);
      this.removeModalOverlays(); // Убираем зависшие модальные окна
      throw this.formatTransactionError(error);
    }
  }

  async waitForTransaction(txHash, confirmations = 1, timeout = 300000) {
    console.log(`⏳ Ожидание подтверждения транзакции ${txHash}...`);
    
    return new Promise((resolve, reject) => {
      let confirmedBlocks = 0;
      const startTime = Date.now();
      
      const checkTransaction = async () => {
        try {
          const receipt = await this.web3.eth.getTransactionReceipt(txHash);
          
          if (receipt) {
            if (receipt.status === false || receipt.status === '0x0') {
              reject(new Error('Транзакция отклонена сетью'));
              return;
            }
            
            const currentBlock = await this.web3.eth.getBlockNumber();
            confirmedBlocks = currentBlock - receipt.blockNumber;
            
            if (confirmedBlocks >= confirmations) {
              console.log(`✅ Транзакция подтверждена с ${confirmedBlocks} подтверждениями`);
              resolve(receipt);
              return;
            }
            
            console.log(`⏳ Подтверждения: ${confirmedBlocks}/${confirmations}`);
          }
          
          if (Date.now() - startTime > timeout) {
            reject(new Error('Таймаут ожидания транзакции'));
            return;
          }
          
          setTimeout(checkTransaction, 3000);
          
        } catch (error) {
          reject(error);
        }
      };
      
      checkTransaction();
    });
  }

  formatTransactionError(error) {
    if (error.code === 4001) {
      return new Error('Транзакция отклонена пользователем');
    } else if (error.code === -32603) {
      return new Error('Ошибка выполнения транзакции');
    } else if (error.message?.includes('insufficient funds')) {
      return new Error('Недостаточно средств для транзакции');
    } else if (error.message?.includes('gas')) {
      return new Error('Ошибка с газом транзакции');
    } else if (error.message?.includes('nonce')) {
      return new Error('Ошибка nonce, попробуйте снова');
    } else {
      return new Error(error.message || 'Неизвестная ошибка транзакции');
    }
  }

  // ==================== ПОДПИСАНИЕ ====================

  async signMessage(message) {
    if (!this.isConnected) {
      throw new Error('Кошелек не подключен');
    }

    try {
      console.log('🖊️ Подписание сообщения...');
      
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.account]
      });
      
      console.log('✅ Сообщение подписано');
      return signature;
      
    } catch (error) {
      console.error('⌀ Ошибка подписания:', error);
      this.removeModalOverlays();
      throw error;
    }
  }

  async signTypedData(typedData) {
    if (!this.isConnected) {
      throw new Error('Кошелек не подключен');
    }

    try {
      console.log('🖊️ Подписание структурированных данных...');
      
      const signature = await this.provider.request({
        method: 'eth_signTypedData_v4',
        params: [this.account, JSON.stringify(typedData)]
      });
      
      console.log('✅ Структурированные данные подписаны');
      return signature;
      
    } catch (error) {
      console.error('⌀ Ошибка подписания структурированных данных:', error);
      this.removeModalOverlays();
      throw error;
    }
  }

  // ==================== БАЛАНСЫ И УТИЛИТЫ ====================

  async getBalance(address = null) {
    if (!this.web3) {
      throw new Error('Web3 не инициализирован');
    }
    
    const targetAddress = address || this.account;
    if (!targetAddress) {
      throw new Error('Адрес не указан');
    }
    
    try {
      const balance = await this.web3.eth.getBalance(targetAddress);
      return {
        wei: balance,
        ether: this.web3.utils.fromWei(balance, 'ether'),
        formatted: parseFloat(this.web3.utils.fromWei(balance, 'ether')).toFixed(4)
      };
    } catch (error) {
      console.error('Ошибка получения баланса:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress, userAddress = null, decimals = 18) {
    if (!this.web3) {
      throw new Error('Web3 не инициализирован');
    }
    
    const targetAddress = userAddress || this.account;
    if (!targetAddress) {
      throw new Error('Адрес не указан');
    }
    
    try {
      const minABI = [{
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function"
      }];
      
      const contract = new this.web3.eth.Contract(minABI, tokenAddress);
      const balance = await contract.methods.balanceOf(targetAddress).call();
      
      return {
        wei: balance,
        formatted: this.web3.utils.fromWei(balance, decimals === 18 ? 'ether' : 'wei') / Math.pow(10, decimals - 18),
        raw: balance
      };
    } catch (error) {
      console.error('Ошибка получения баланса токена:', error);
      throw error;
    }
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  isValidAddress(address) {
    return this.web3 ? this.web3.utils.isAddress(address) : /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  formatAddress(address, length = 4) {
    if (!address) return '0x000...000';
    return `${address.slice(0, 2 + length)}...${address.slice(-length)}`;
  }

  getNetworkName(networkId) {
    const networks = {
      204: 'opBNB Mainnet',
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
      204: 'BNB',
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

  isValidNetwork(networkId) {
    return Object.keys(this.supportedNetworks).includes(networkId.toString());
  }

  // ИСПРАВЛЕНО: Добавлен недостающий метод getWalletType
  getWalletType() {
    return this.providerType || 'Unknown';
  }

  // ==================== EVENT EMITTER ====================

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

  // ==================== ГЕТТЕРЫ ====================

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

  // ==================== СОСТОЯНИЕ ====================

  saveState() {
    if (this.isConnected) {
      const state = {
        account: this.account,
        networkId: this.networkId,
        providerType: this.providerType,
        timestamp: Date.now()
      };
      
      localStorage.setItem('web3_manager_state', JSON.stringify(state));
      localStorage.setItem('wallet_connected', 'true');
    }
  }

  loadState() {
    try {
      const savedState = localStorage.getItem('web3_manager_state');
      const wasConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (savedState && wasConnected) {
        const state = JSON.parse(savedState);
        
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки состояния:', error);
    }
    
    return null;
  }

  clearState() {
    localStorage.removeItem('web3_manager_state');
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_type');
    localStorage.removeItem('wallet_account');
  }

  // ==================== ДИАГНОСТИКА ====================

  async getProviderInfo() {
    if (!this.provider) {
      return { error: 'Провайдер не найден' };
    }
    
    const info = {
      providerType: this.providerType,
      isConnected: this.isConnected,
      account: this.account,
      networkId: this.networkId,
      networkName: this.getNetworkName(this.networkId)
    };
    
    try {
      if (this.web3) {
        const blockNumber = await this.web3.eth.getBlockNumber();
        const gasPrice = await this.web3.eth.getGasPrice();
        
        info.blockNumber = blockNumber;
        info.gasPrice = this.web3.utils.fromWei(gasPrice, 'gwei') + ' Gwei';
        
        if (this.account) {
          const balance = await this.getBalance();
          info.balance = balance.formatted + ' ' + this.getNetworkSymbol(this.networkId);
        }
      }
    } catch (error) {
      info.error = error.message;
    }
    
    return info;
  }

  // ==================== ДЕСТРУКТОР ====================

  destroy() {
    console.log('🗑️ Уничтожение Web3Manager...');
    
    if (this.provider && this.provider.removeAllListeners) {
      this.provider.removeAllListeners();
    }
    
    clearInterval(this.networkMonitoringInterval);
    
    this.saveState();
    this.removeModalOverlays();
    
    this.listeners = {};
    this.web3 = null;
    this.provider = null;
  }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof Web3 === 'undefined') {
    console.error('⌀ Web3 библиотека не загружена');
    
    if (document.body) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 10000;
        max-width: 300px;
      `;
      errorDiv.textContent = 'Web3 библиотека не загружена. Проверьте подключение к интернету.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => errorDiv.remove(), 5000);
    }
    return;
  }

  console.log('🚀 Запуск Web3Manager...');
  
  window.web3Manager = new Web3Manager();
  
  // ИСПРАВЛЕНО: Улучшенное автоподключение
  const savedState = window.web3Manager.loadState();
  if (savedState) {
    console.log('🔄 Попытка автоподключения...');
    
    setTimeout(async () => {
      try {
        await window.web3Manager.connectWallet();
        console.log('✅ Автоподключение успешно');
      } catch (error) {
        console.log('⚠️ Автоподключение не удалось:', error.message);
        window.web3Manager.clearState();
      }
    }, 1000);
  }
  
  window.addEventListener('beforeunload', () => {
    if (window.web3Manager) {
      window.web3Manager.destroy();
    }
  });
  
  console.log('✅ Web3Manager готов к работе');
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Web3Manager;
}
