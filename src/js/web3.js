(function () {
  const OPBNB = {
    chainIdHex: '0xCC',         // 204
    chainIdDec: 204,
    chainName: 'opBNB Mainnet',
    rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
    blockExplorerUrls: ['https://opbnbscan.com'],
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  };

  class Web3Manager {
    constructor() {
      this.provider = null;
      this.web3 = null;
      this.address = null;
      this.chainId = null;
      this.connected = false;
    }

    // ——— Приоритет SafePal ———
    _detectProvider() {
      // 1) Явный объект SafePal (если есть)
      if (window.safepal && window.safepal.ethereum) return window.safepal.ethereum;

      // 2) Общий инжект (в SafePal in-app это тоже window.ethereum)
      if (window.ethereum) {
        // Пометки разл. кошельков могут быть такими:
        // isSafePal, isTrust, isTokenPocket, isOKXWallet и т.д.
        const eth = window.ethereum;
        if (eth.isSafePal || eth.isTokenPocket || eth.isTrust || eth.isOKXWallet) return eth;
        // даже если нет флагов, в dApp-браузере SafePal — это нужный провайдер
        return eth;
      }

      // 3) Старые провайдеры (редко)
      if (window.BinanceChain) return window.BinanceChain;

      return null;
    }

    async init() {
      this.provider = this._detectProvider();

      if (!this.provider) {
        console.warn('SafePal/ethereum provider not found');
        // Не падаем приложением — просто показываем подсказку в UI
        this._notifyNoProvider();
        return this; // позволяем UI загрузиться
      }

      // Подписки
      if (this.provider.on) {
        this.provider.on('chainChanged', (cid) => {
          // cid может быть '0xCC' строкой
          this.chainId = typeof cid === 'string' ? parseInt(cid, 16) : cid;
          if (this.chainId !== OPBNB.chainIdDec) {
            uiManager?.showNotification?.('Переключаем сеть на opBNB…', 'info');
            this.ensureNetwork().catch(console.error);
          }
        });
        this.provider.on('accountsChanged', (accounts) => {
          this.address = (accounts && accounts[0]) || null;
          this.connected = !!this.address;
          uiManager?.showNotification?.(this.connected ? 'Кошелёк переподключён' : 'Кошелёк отключён', 'info');
        });
      }

      // Создаём web3 поверх найденного провайдера
      this.web3 = new Web3(this.provider);

      // Пробуем узнать сеть
      try {
        const cid = await this.provider.request({ method: 'eth_chainId' });
        this.chainId = typeof cid === 'string' ? parseInt(cid, 16) : cid;
      } catch (e) {
        console.warn('eth_chainId failed', e);
      }

      // Если уже не на opBNB — переключим (без паники)
      if (this.chainId !== OPBNB.chainIdDec) {
        try { await this.ensureNetwork(); } catch (e) { console.warn('ensureNetwork', e); }
      }

      // НЕ запрашиваем аккаунт автоматически — ждём нажатие кнопки «Подключить кошелёк»
      return this;
    }

    async connect() {
      if (!this.provider) {
        this._notifyNoProvider();
        throw new Error('Provider not found');
      }
      await this.ensureNetwork();

      // SafePal/ethereum: запрос адресов
      const accs = await this.provider.request({ method: 'eth_requestAccounts' });
      this.address = accs[0] || null;
      this.connected = !!this.address;

      if (!this.connected) throw new Error('User rejected or no account');
      return this.address;
    }

    async ensureNetwork() {
      if (!this.provider) throw new Error('Provider not found');

      // Уже opBNB?
      let cid;
      try {
        const raw = await this.provider.request({ method: 'eth_chainId' });
        cid = typeof raw === 'string' ? parseInt(raw, 16) : raw;
      } catch { cid = this.chainId; }

      if (cid === OPBNB.chainIdDec) return true;

      try {
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: OPBNB.chainIdHex }],
        });
        this.chainId = OPBNB.chainIdDec;
        return true;
      } catch (e) {
        // 4902 — сеть не добавлена
        if (e && (e.code === 4902 || e.message?.includes('Unrecognized chain ID'))) {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: OPBNB.chainIdHex,
              chainName: OPBNB.chainName,
              nativeCurrency: OPBNB.nativeCurrency,
              rpcUrls: OPBNB.rpcUrls,
              blockExplorerUrls: OPBNB.blockExplorerUrls,
            }],
          });
          this.chainId = OPBNB.chainIdDec;
          return true;
        }
        throw e;
      }
    }

    getWeb3() {
      if (!this.web3) throw new Error('Web3 not initialized');
      return this.web3;
    }

    getAddress() { return this.address; }

    _notifyNoProvider() {
      const msg = 'Кошелёк не найден. Откройте dApp в SafePal или установите SafePal (приоритет).';
      console.warn(msg);
      // Пара аккуратных подсказок в UI:
      try {
        uiManager?.showNotification?.(msg, 'warning', 6000);
        const btn = document.querySelector('.connect-wallet-btn');
        if (btn) btn.classList.add('button-glow');
      } catch {}
    }
  }

  window.web3Manager = new Web3Manager();
})();
