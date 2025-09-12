(function () {
  // Адреса ваших контрактов (если поменяются — исправьте тут)
  const ADDR = {
    GlobalWay:      "0x64De05a0c818a925711EA0874FD972Bdc2edb2aA",
    GlobalWayStats: "0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4",
    GWTToken:       "0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc",
  };

  class ContractManager {
    constructor() {
      this.GlobalWay = null;
      this.GlobalWayStats = null;
      this.GWTToken = null;
    }

    async init() {
      const w3 = window.web3Manager.getWeb3();

      async function loadJson(path) {
        const r = await fetch(path, { cache: "no-cache" });
        if (!r.ok) throw new Error("Cannot load " + path);
        const j = await r.json();
        return j.abi || j; // если файл — «голый ABI»
      }

      const [gwAbi, statsAbi, tokenAbi] = await Promise.all([
        loadJson("/contracts/GlobalWay.json"),
        loadJson("/contracts/GlobalWayStats.json"),
        loadJson("/contracts/GWTToken.json"),
      ]);

      this.GlobalWay      = new w3.eth.Contract(gwAbi, ADDR.GlobalWay);
      this.GlobalWayStats = new w3.eth.Contract(statsAbi, ADDR.GlobalWayStats);
      this.GWTToken       = new w3.eth.Contract(tokenAbi, ADDR.GWTToken);
      return this;
    }

    // ---------- READ ----------
    async isOwner(addr) {
      try { return await this.GlobalWay.methods.isOwner(addr).call(); }
      catch { return false; }
    }
    async getUserData(addr) {
      return await this.GlobalWay.methods.getUserData(addr).call();
    }
    async getMatrixStats(addr, level) {
      return await this.GlobalWayStats.methods.getMatrixStats(addr, level).call();
    }

    // ---------- ADMIN (feature-detected) ----------
    async admin_freeActivate({ user, sponsor, maxLevel }) {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.freeActivate && !m.freeActivation && !m.ownerActivate) {
        throw new Error("freeActivate(...) method not found in ABI");
      }
      const fn = m.freeActivate || m.freeActivation || m.ownerActivate;
      return await fn(user, sponsor, maxLevel).send({ from });
    }

    async admin_batchActivate({ users, sponsors, maxLevels }) {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.batchActivate && !m.massActivate) {
        throw new Error("batchActivate(...) method not found in ABI");
      }
      const fn = m.batchActivate || m.massActivate;
      return await fn(users, sponsors, maxLevels).send({ from });
    }

    async admin_setAuthorization({ addr, enabled }) {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.setAuthorization && !m.setAuthorizer && !m.setAdmin) {
        throw new Error("setAuthorization(...) method not found in ABI");
      }
      const fn = m.setAuthorization || m.setAuthorizer || m.setAdmin;
      return await fn(addr, enabled).send({ from });
    }

    async admin_pause() {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.pause) throw new Error("pause() not found in ABI");
      return await m.pause().send({ from });
    }

    async admin_unpause() {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.unpause && !m.resume) throw new Error("unpause() not found in ABI");
      const fn = m.unpause || m.resume;
      return await fn().send({ from });
    }

    async admin_connectProject({ projectAddress, projectName }) {
      const from = window.web3Manager.getAddress();
      const m = this.GlobalWay.methods;
      if (!m.connectProject && !m.addProject) {
        throw new Error("connectProject(address,string) not found in ABI");
      }
      const fn = m.connectProject || m.addProject;
      return await fn(projectAddress, projectName).send({ from });
    }
  }

  window.contractManager = new ContractManager();
})();
