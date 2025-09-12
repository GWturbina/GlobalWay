// contracts.js — GlobalWay opBNB integration (SafePal-first) — FULL
(function (global) {
  'use strict';

  const NET_ID = 204; // opBNB Mainnet

  // Deployed addresses (update if needed)
  const ADDR = {
    GlobalWay: "0x64De05a0c818a925711EA0874FD972Bdc2edb2aA",
    GlobalWayStats: "0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4",
    GWTToken: "0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc",
  };

  function toBNB(wei) { try { return global.Web3.utils.fromWei(String(wei), 'ether'); } catch { return '0'; } }

  class ContractManager {
    constructor(web3) {
      this.web3 = web3;
      this.accounts = [];
      this.contracts = {};
      this.state = {
        prices: [],     // array index = level
        rewards: [],
        overview: null,
        userInfo: null,
      };
    }

    async _loadABI(path) {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`ABI fetch failed: ${path}`);
      return res.json();
    }

    async init() {
      if (!this.web3) throw new Error('Web3 not initialized');
      const [gwABI, statsABI, tokenABI] = await Promise.all([
        this._loadABI('/src/abi/GlobalWay.json'),
        this._loadABI('/src/abi/GlobalWayStats.json'),
        this._loadABI('/src/abi/GWTToken.json'),
      ]);
      this.contracts.GlobalWay      = new this.web3.eth.Contract(gwABI.abi, ADDR.GlobalWay);
      this.contracts.GlobalWayStats = new this.web3.eth.Contract(statsABI.abi, ADDR.GlobalWayStats);
      this.contracts.GWTToken       = new this.web3.eth.Contract(tokenABI.abi, ADDR.GWTToken);
      this.accounts = await this.web3.eth.getAccounts();
      return true;
    }

    // ---------- Views ----------
    async getLevelPrices() {
      const res = await this.contracts.GlobalWayStats.methods.getPricesAndRewards().call();
      const prices  = res.prices  || res[0] || [];
      const rewards = res.rewards || res[1] || [];
      this.state.prices = prices;
      this.state.rewards = rewards;
      // human
      return prices.map(x => toBNB(x));
    }

    async getPackagePrice(maxLevel, account) {
      const user = account || (await this.getPrimaryAccount());
      const res = await this.contracts.GlobalWayStats.methods.getPackagePrice(user, maxLevel).call();
      return res.totalCost || res; // wei
    }

    async getOverview() {
      const ov = await this.contracts.GlobalWayStats.methods.getContractOverview().call();
      this.state.overview = ov;
      return ov;
    }

    async getUserFullInfo(account) {
      const user = account || (await this.getPrimaryAccount());
      const info = await this.contracts.GlobalWayStats.methods.getUserFullInfo(user).call();
      this.state.userInfo = info;
      return info;
    }

    async isOwner(account) {
      const user = account || (await this.getPrimaryAccount());
      return await this.contracts.GlobalWay.methods.isOwner(user).call();
    }

    async isRegistered(account) {
      const user = account || (await this.getPrimaryAccount());
      return await this.contracts.GlobalWay.methods.isUserRegistered(user).call();
    }

    async isLevelActive(level, account) {
      const user = account || (await this.getPrimaryAccount());
      return await this.contracts.GlobalWay.methods.isLevelActive(user, level).call();
    }

    async getMatrixStats(level, account) {
      const user = account || (await this.getPrimaryAccount());
      return await this.contracts.GlobalWayStats.methods.getMatrixStats(user, level).call();
    }

    async getPrimaryAccount() {
      const accs = await this.web3.eth.getAccounts();
      if (!accs || !accs.length) throw new Error('Wallet not connected');
      this.accounts = accs;
      return accs[0];
    }

    // ---------- Front validation helpers (no skips) ----------
    async getHighestActiveLevel(account) {
      const user = account || (await this.getPrimaryAccount());
      let highest = 0;
      for (let l = 1; l <= 12; l++) {
        try {
          const active = await this.contracts.GlobalWay.methods.isLevelActive(user, l).call();
          if (active) highest = l; else break;
        } catch (e) {
          console.warn('[GW] isLevelActive error at', l, e);
          break;
        }
      }
      return highest;
    }

    async calculateMissingCost(maxLevel, account) {
      if (!Number.isInteger(maxLevel) || maxLevel < 1 || maxLevel > 12) {
        throw new Error('maxLevel must be within 1..12');
      }
      if (!this.state.prices || !this.state.prices.length) {
        await this.getLevelPrices();
      }
      const user = account || (await this.getPrimaryAccount());
      const highest = await this.getHighestActiveLevel(user);
      if (highest >= maxLevel) return '0';

      const BN = this.web3.utils.toBN;
      let total = BN('0');
      for (let l = Math.max(highest + 1, 1); l <= maxLevel; l++) {
        const p = this.state.prices[l];
        if (p) total = total.add(BN(String(p)));
      }
      return total.toString(); // wei
    }

    // ---------- Mutations ----------
    async buyLevel(level) {
      const from = await this.getPrimaryAccount();
      let priceWei;
      try {
        if (!this.state.prices.length) await this.getLevelPrices();
        priceWei = this.state.prices[level] ?? await this.contracts.GlobalWay.methods.levelPrices(level).call();
      } catch {
        priceWei = await this.contracts.GlobalWay.methods.levelPrices(level).call();
      }
      return this.contracts.GlobalWay.methods.buyLevel(level).send({ from, value: priceWei });
    }

    async buyLevelsBulk(maxLevel) {
      const from = await this.getPrimaryAccount();
      const totalCost = await this.contracts.GlobalWay.methods.calculateBulkPrice(maxLevel).call({ from });
      return this.contracts.GlobalWay.methods.buyLevelsBulk(maxLevel).send({ from, value: totalCost });
    }

    async buyPackageByMaxLevel(maxLevel) {
      return this.buyLevelsBulk(maxLevel);
    }

    async register(sponsor) {
      const from = await this.getPrimaryAccount();
      return this.contracts.GlobalWay.methods.register(sponsor).send({ from });
    }

    async payQuarterly() {
      const from = await this.getPrimaryAccount();
      const fee = await this.contracts.GlobalWay.methods.QUARTERLY_FEE().call();
      return this.contracts.GlobalWay.methods.payQuarterlyActivity().send({ from, value: fee });
    }

    // ---------- Token helpers ----------
    async getTokenPrice() {
      return await this.contracts.GWTToken.methods.getCurrentPrice().call();
    }
    async buyTokens(tokenAmount) {
      const from = await this.getPrimaryAccount();
      const cost = await this.contracts.GWTToken.methods.calculatePurchaseCost(tokenAmount).call();
      return this.contracts.GWTToken.methods.buyTokens(tokenAmount).send({ from, value: cost });
    }
    async sellTokens(tokenAmount) {
      const from = await this.getPrimaryAccount();
      return this.contracts.GWTToken.methods.sellTokens(tokenAmount).send({ from });
    }
  }

  global.ContractManager = ContractManager;
})(window);
