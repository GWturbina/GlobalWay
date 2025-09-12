// src/js/contracts.js
// GlobalWay DApp — контрактный слой (SafePal-first). Полная версия для замены.

(function () {
  // ==== НАСТРОЙКИ СЕТИ / ЭКСПЛОРЕРА ====
  const EXPLORER = (function () {
    const base = (window.GW_EXPLORER && window.GW_EXPLORER.base) || 'https://opbnbscan.com';
    return {
      base,
      tx: (h) => `${base}/tx/${h}`,
      addr: (a) => `${base}/address/${a}`,
    };
  })();

  // ==== АДРЕСА КОНТРАКТОВ (opBNB) ====
  const ADDR = {
    GlobalWay:      '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
    GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4',
    GWTToken:       '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
  };

  // ==== ПОЛЕЗНЫЕ ХЕЛПЕРЫ ====
  const BN = (x) => window.web3Manager.getWeb3().utils.toBN(x);
  const toWei = (x) => window.web3Manager.getWeb3().utils.toWei(String(x), 'ether');
  const fromWei = (x) => window.web3Manager.getWeb3().utils.fromWei(String(x), 'ether');

  function hasViewMethod(contract, name) {
    return Boolean(contract?.methods?.[name]);
  }
  async function safeCall(contract, name, args = [], def = null) {
    if (!hasViewMethod(contract, name)) {
      console.warn(`[GW] ABI: method not found → ${name}()`);
      return def;
    }
    try {
      const res = await contract.methods[name](...args).call();
      return res;
    } catch (e) {
      console.warn(`[GW] View call failed → ${name}()`, e);
      return def;
    }
  }

  function txToast(hash) {
    try {
      uiManager?.showNotification?.(
        `<a class="link" target="_blank" href="${EXPLORER.tx(hash)}">Tx</a> отправлена`,
        'info',
        8000
      );
    } catch {}
  }

  // ==== ОСНОВНОЙ МЕНЕДЖЕР КОНТРАКТОВ ====
  class ContractManager {
    constructor() {
      this.web3 = null;
      this.account = null;

      this.abi = {
        GlobalWay: null,
        GlobalWayStats: null,
        GWTToken: null,
      };

      this.globalWay = null;
      this.globalWayStats = null;
      this.gwtToken = null;

      this.levelPrices = new Array(13).fill(null); // 1..12
      this.currentLevel = 0;

      this._initialDataLoaded = false;
    }

    async init() {
      console.log('📄 Initializing contracts...');
      this.web3 = window.web3Manager.getWeb3();

      // Загружаем ABI статикой
      const [gwAbi, gwsAbi, gwtAbi] = await Promise.all([
        fetch('/contracts/GlobalWay.json').then(r => r.json()).catch(() => null),
        fetch('/contracts/GlobalWayStats.json').then(r => r.json()).catch(() => null),
        fetch('/contracts/GWTToken.json').then(r => r.json()).catch(() => null),
      ]);

      this.abi.GlobalWay = gwAbi;
      this.abi.GlobalWayStats = gwsAbi;
      this.abi.GWTToken = gwtAbi;

      // Создаём инстансы контрактов (если ABI есть)
      if (gwAbi)  this.globalWay      = new this.web3.eth.Contract(gwAbi, ADDR.GlobalWay);
      if (gwsAbi) this.globalWayStats = new this.web3.eth.Contract(gwsAbi, ADDR.GlobalWayStats);
      if (gwtAbi) this.gwtToken       = new this.web3.eth.Contract(gwtAbi, ADDR.GWTToken);

      console.log('✅ Contracts initialized');

      // Если кошелёк уже подключён — подхватим адрес
      this.account = window.web3Manager.getAddress() || null;

      await this.loadInitialData(); // безопасно (с флагом)
    }

    async refreshAccount(addr) {
      this.account = addr || window.web3Manager.getAddress() || null;
      this._initialDataLoaded = false; // чтобы перезагрузить пользовательские части
      await this.loadInitialData();
    }

    // ==== НАЧАЛЬНЫЕ ДАННЫЕ (ОБЕСПЕЧ. ФЛАГ) ====
    async loadInitialData() {
      if (this._initialDataLoaded) {
        console.log('✅ Initial data already loaded (skip)');
        return;
      }
      console.log('📊 Loading initial contract data...');

      await this.loadLevelPrices();
      await this.loadContractOverview(); // безопасная версия
      await this.loadUserData();         // мягкая: не упадёт, если юзер не зарегистрирован

      this._initialDataLoaded = true;
      console.log('✅ Initial data loaded');
    }

    // ==== ЦЕНЫ УРОВНЕЙ ====
    async loadLevelPrices() {
      if (!this.globalWay) return;
      const prices = new Array(13).fill(null);
      for (let i = 1; i <= 12; i++) {
        const raw = await safeCall(this.globalWay, 'levelPrices', [i], null);
        if (raw) {
          prices[i] = fromWei(raw);
        }
      }
      this.levelPrices = prices;
      console.log('💰 Level prices loaded: ', prices);

      try { uiManager?.hydrateLevelPrices?.(prices); } catch {}
      try { uiManager?.hydrateBulkPrices?.(prices); } catch {}
    }

    // ==== ОБЗОР/СТАТИСТИКА — БЕЗОПАСНО ====
    async loadContractOverview() {
      console.log('📊 Loading contract overview...');
      const gw  = this.globalWay;
      const gws = this.globalWayStats;

      const overview = {};
      // Пробуем популярные методы — все через safeCall
      overview.owner       = await safeCall(gw,  'owner', [], null);
      overview.paused      = await safeCall(gw,  'paused', [], false);
      overview.totalUsers  = await safeCall(gw,  'totalUsers', [], null);

      if (gws) {
        overview.totalTurnover  = await safeCall(gws, 'totalTurnover', [], null);
        overview.totalPurchases = await safeCall(gws, 'totalPurchases', [], null);
      }

      console.log('📈 Overview:', overview);
      try { uiManager?.updateOverview?.(overview); } catch {}
    }

    // ==== ПОЛЬЗОВАТЕЛЬ ====
    async loadUserData() {
      if (!this.account || !this.globalWay) return;
      console.log('👤 Loading user data...');

      // Текущий уровень: если есть прямой метод — используем, иначе эвристика
      let cur = await safeCall(this.globalWay, 'currentLevel', [this.account], null);
      if (cur == null) {
        // Эвристика: ищем самый высокий активный уровень
        let top = 0;
        for (let i = 1; i <= 12; i++) {
          const active = await safeCall(this.globalWay, 'isLevelActive', [this.account, i], null);
          if (active) top = i;
        }
        cur = top;
      }
      this.currentLevel = Number(cur || 0);

      if (!this.currentLevel) {
        console.log('👤 User not registered');
      }

      try { uiManager?.updateUser?.({ address: this.account, level: this.currentLevel }); } catch {}
    }

    // ==== БИЗНЕС-ЛОГИКА ПОКУПОК ====
    bulkSumTo(targetLevel) {
      const cur = Number(this.currentLevel || 0);
      if (targetLevel <= cur) return BN(0);

      let sum = BN(0);
      for (let i = cur + 1; i <= targetLevel; i++) {
        const p = this.levelPrices[i];
        if (!p) continue;
        sum = sum.add(BN(toWei(p)));
      }
      return sum;
    }

    async buyLevel(level) {
      if (!this.account) throw new Error('Connect wallet first');
      if (!this.globalWay) throw new Error('Contract not ready');

      const priceEth = this.levelPrices[level];
      if (!priceEth) throw new Error('Price unavailable');

      const value = toWei(priceEth);

      const tx = this.globalWay.methods.buyLevel(level);
      const sendParams = { from: this.account, value };

      const hash = await new Promise((resolve, reject) => {
        tx.send(sendParams)
          .on('transactionHash', (h) => { txToast(h); resolve(h); })
          .on('error', reject);
      });

      try { uiManager?.showNotification?.(`Уровень L${level} — транзакция отправлена`, 'success'); } catch {}
      // Обновим состояние
      await this.loadUserData();
      await this.loadLevelPrices();
      return hash;
    }

    async buyLevelsBulk(targetLevel) {
      if (!this.account) throw new Error('Connect wallet first');
      if (!this.globalWay) throw new Error('Contract not ready');

      const total = this.bulkSumTo(targetLevel);
      if (total.isZero()) {
        uiManager?.showNotification?.('Все уровни до цели уже куплены', 'info');
        return null;
      }

      // Если в контракте есть buyLevelsBulk(uint8) — используем его,
      // иначе идём поштучно.
      if (hasViewMethod(this.globalWay, 'buyLevelsBulk')) {
        const tx = this.globalWay.methods.buyLevelsBulk(targetLevel);
        const sendParams = { from: this.account, value: total.toString() };
        const hash = await new Promise((resolve, reject) => {
          tx.send(sendParams)
            .on('transactionHash', (h) => { txToast(h); resolve(h); })
            .on('error', reject);
        });
        try { uiManager?.showNotification?.(`Пакет 1–${targetLevel}: отправлено`, 'success'); } catch {}
        await this.loadUserData();
        await this.loadLevelPrices();
        return hash;
      } else {
        // Последовательно покупаем недостающие уровни (меньше UX, но надежно)
        const cur = Number(this.currentLevel || 0);
        let lastHash = null;
        for (let i = cur + 1; i <= targetLevel; i++) {
          lastHash = await this.buyLevel(i);
        }
        return lastHash;
      }
    }

    async payQuarterly() {
      if (!this.account) throw new Error('Connect wallet first');
      if (!this.globalWay) throw new Error('Contract not ready');

      if (!hasViewMethod(this.globalWay, 'payQuarterlyActivity')) {
        uiManager?.showNotification?.('Метод квартального платежа не найден в ABI', 'warning');
        return null;
      }

      const tx = this.globalWay.methods.payQuarterlyActivity();
      const sendParams = { from: this.account }; // если payable — добавь value при необходимости

      const hash = await new Promise((resolve, reject) => {
        tx.send(sendParams)
          .on('transactionHash', (h) => { txToast(h); resolve(h); })
          .on('error', reject);
      });

      try { uiManager?.showNotification?.('Квартальный платёж отправлен', 'success'); } catch {}
      return hash;
    }

    // ==== РОЛИ / ВЛАДЕЛЕЦ ====
    async isOwner(addr) {
      if (!this.globalWay) return false;
      const owner = await safeCall(this.globalWay, 'owner', [], null);
      return owner && addr && owner.toLowerCase() === addr.toLowerCase();
    }

    // ==== ХЕЛПЕРЫ ДЛЯ UI ====
    hydrateLevelPrices(root = document) {
      try {
        const btns = root.querySelectorAll('[data-buy-level]');
        btns.forEach((btn) => {
          const lvl = Number(btn.getAttribute('data-buy-level'));
          const price = this.levelPrices[lvl];
          const node = btn.querySelector('.level-price');
          if (node && price) node.textContent = `${price} BNB`;
        });
      } catch {}
    }

    hydrateBulkPrices(root = document) {
      try {
        const targets = [4,7,10,12];
        const cur = Number(this.currentLevel || 0);
        targets.forEach((K) => {
          const el = root.querySelector(`[data-buy-bulk="${K}"] .buy-price`);
          if (!el) return;
          const sum = this.bulkSumTo(K);
          el.textContent = `${fromWei(sum)} BNB`;
          // Деактивировать, если уже куплено
          const btn = root.querySelector(`[data-buy-bulk="${K}"]`);
          if (btn) btn.disabled = (K <= cur);
        });
      } catch {}
    }
  }

  window.contractManager = new ContractManager();
})();
