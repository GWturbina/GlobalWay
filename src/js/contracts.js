(function () {
  // ====== СЕТЬ / ЭКСПЛОРЕР ======
  const OP_BNB_ID  = 204; // opBNB mainnet
  const EXPLORER   = (window.GW_EXPLORER && window.GW_EXPLORER.base) || "https://opbnbscan.com";

  // ====== АДРЕСА КОНТРАКТОВ (при необходимости обнови) ======
  const ADDR = {
    GlobalWay:      "0x64De05a0c818a925711EA0874FD972Bdc2edb2aA",
    GlobalWayStats: "0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4",
    GWTToken:       "0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc",
  };

  // Уровни, с которыми работает UI
  const MAX_LEVEL = 12;

  class ContractManager {
    constructor() {
      this.w3 = null;
      this.GlobalWay = null;
      this.GlobalWayStats = null;
      this.GWTToken = null;
    }

    async init() {
      this.w3 = window.web3Manager.getWeb3();

      async function loadAbi(path) {
        const r = await fetch(path, { cache: "no-cache" });
        if (!r.ok) throw new Error("Cannot load ABI: " + path);
        const j = await r.json();
        return j.abi || j;
      }

      const [gwAbi, statsAbi, tokenAbi] = await Promise.all([
        loadAbi("/contracts/GlobalWay.json"),
        loadAbi("/contracts/GlobalWayStats.json"),
        loadAbi("/contracts/GWTToken.json"),
      ]);

      this.GlobalWay      = new this.w3.eth.Contract(gwAbi, ADDR.GlobalWay);
      this.GlobalWayStats = new this.w3.eth.Contract(statsAbi, ADDR.GlobalWayStats);
      this.GWTToken       = new this.w3.eth.Contract(tokenAbi, ADDR.GWTToken);
      return this;
    }

    // ======== HELPERS ========
    getExplorerTxUrl(tx) { return `${EXPLORER}/tx/${tx}`; }
    _addr() {
      const a = window.web3Manager.getAddress();
      if (!a) throw new Error("Wallet not connected");
      return a;
    }

    // ======== READ ========
    async isOwner(addr) {
      try { return await this.GlobalWay.methods.isOwner(addr).call(); }
      catch { return false; }
    }

    async getUserData(addr) {
      try { return await this.GlobalWay.methods.getUserData(addr).call(); }
      catch { return {}; }
    }

    async getMatrixStats(addr, level) {
      return await this.GlobalWayStats.methods.getMatrixStats(addr, level).call();
    }

    async getLevelPrice(level) {
      return await this.GlobalWay.methods.levelPrices(level).call();
    }

    async calculateBulkPrice(maxLevel) {
      // как правило, возвращает сумму уровней 1..maxLevel
      return await this.GlobalWay.methods.calculateBulkPrice(maxLevel).call();
    }

    /**
     * Возвращает максимальный активный уровень пользователя.
     * Идём сверху вниз, проверяя распространённые варианты view-функций.
     */
    async getActiveMaxLevel(addr) {
      const m = this.GlobalWay.methods;
      // попробуем популярные view:
      const hasLevelFn =
        m.isLevelActive || m.hasLevel || m.isActiveAtLevel || m.levelActive;

      if (hasLevelFn) {
        for (let l = MAX_LEVEL; l >= 1; l--) {
          try {
            const ok = await hasLevelFn(addr, l).call();
            if (ok) return l;
          } catch { /* continue */ }
        }
        return 0;
      }

      // если нет явной функции — эвристика из getUserData
      try {
        const data = await this.getUserData(addr);
        // возможные поля: data.level, data.maxLevel, data.currentLevel
        const candidate = Number(
          data.maxLevel || data.currentLevel || data.level || 0
        );
        return Math.max(0, Math.min(MAX_LEVEL, candidate|0));
      } catch {
        return 0;
      }
    }

    /**
     * Считает сумму цен уровней [from..to] включительно.
     */
    async computeRangePrice(fromLevel, toLevel) {
      let sum = this.w3.utils.toBN(0);
      for (let l = fromLevel; l <= toLevel; l++) {
        const p = await this.getLevelPrice(l);
        sum = sum.add(this.w3.utils.toBN(p));
      }
      return sum.toString();
    }

    // ======== WRITE: LEVELS / PAYMENTS ========
    async buyLevel(level) {
      const from = this._addr();
      const value = await this.getLevelPrice(level);
      return await this.GlobalWay.methods.buyLevel(level).send({ from, value });
    }

    /**
     * Умная покупка «до L=targetMax», докупая только недостающее.
     * - Если контракт принимает buyLevelsBulk(maxLevel) и сам корректно
     *   учитывает уже купленные — передаём точную сумму недостающих уровней.
     * - Если такой функции нет — выполняем поштучные покупки недостающих уровней.
     */
    async buyLevelsSmart(targetMax) {
      const from = this._addr();
      const cur  = await this.getActiveMaxLevel(from);

      if (targetMax <= cur) {
        throw new Error("Target level already owned or below current");
      }

      const start = cur + 1;
      const end   = Math.min(targetMax, MAX_LEVEL);

      // пробуем «пакетную» функцию
      const m = this.GlobalWay.methods;
      const bulk = m.buyLevelsBulk || m.buyToLevel || m.buyPackage;

      if (bulk) {
        // Считаем «недостающую» сумму [start..end] вручную.
        const value = await this.computeRangePrice(start, end);
        const tx = await bulk(end).send({ from, value });
        return tx;
      }

      // Fallback: поштучно, чтобы не зависеть от ABI
      for (let l = start; l <= end; l++) {
        const price = await this.getLevelPrice(l);
        await this.GlobalWay.methods.buyLevel(l).send({ from, value: price });
      }
      // Вернём последний tx receipt из buyLevel
      return { status: true, info: `Bought L${start}..L${end}` };
    }

    async activatePackage(packageType) {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.activatePackage || m.activate || m.buyPackageType;
      if (!fn) throw new Error("activatePackage(...) not found in ABI");
      return await fn(packageType).send({ from });
    }

    async payQuarterly() {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.payQuarterlyActivity || m.payQuarter || m.payActivity;
      if (!fn) throw new Error("payQuarterlyActivity() not found in ABI");
      return await fn().send({ from });
    }

    // ======== ADMIN (как раньше) ========
    async admin_freeActivate({ user, sponsor, maxLevel }) {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.freeActivate || m.freeActivation || m.ownerActivate;
      if (!fn) throw new Error("freeActivate(...) not found in ABI");
      return await fn(user, sponsor, maxLevel).send({ from });
    }

    async admin_batchActivate({ users, sponsors, maxLevels }) {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.batchActivate || m.massActivate;
      if (!fn) throw new Error("batchActivate(...) not found in ABI");
      return await fn(users, sponsors, maxLevels).send({ from });
    }

    async admin_setAuthorization({ addr, enabled }) {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.setAuthorization || m.setAuthorizer || m.setAdmin;
      if (!fn) throw new Error("setAuthorization(...) not found in ABI");
      return await fn(addr, enabled).send({ from });
    }

    async admin_pause() {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      if (!m.pause) throw new Error("pause() not found in ABI");
      return await m.pause().send({ from });
    }

    async admin_unpause() {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.unpause || m.resume;
      if (!fn) throw new Error("unpause() not found in ABI");
      return await fn().send({ from });
    }

    async admin_connectProject({ projectAddress, projectName }) {
      const from = this._addr();
      const m = this.GlobalWay.methods;
      const fn = m.connectProject || m.addProject;
      if (!fn) throw new Error("connectProject(address,string) not found in ABI");
      return await fn(projectAddress, projectName).send({ from });
    }
  }

  window.contractManager = new ContractManager();
})();
