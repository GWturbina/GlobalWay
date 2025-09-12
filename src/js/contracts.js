// src/js/contracts.js
(() => {
  const ADDR = {
    GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
    GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
    GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4',
  };

  let GW = null, GWT = null, GWS = null, w3 = null;

  async function _abi(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Не удалось загрузить ABI: ${path}`);
    return res.json();
    }

  async function initContracts() {
    w3 = await window.Web3GW.getWeb3();
    const [abiGW, abiGWT, abiGWS] = await Promise.all([
      _abi('/contracts/GlobalWay.json'),
      _abi('/contracts/GWTToken.json'),
      _abi('/contracts/GlobalWayStats.json'),
    ]);
    GW = new w3.eth.Contract(abiGW, ADDR.GlobalWay);
    GWT = new w3.eth.Contract(abiGWT, ADDR.GWTToken);
    GWS = new w3.eth.Contract(abiGWS, ADDR.GlobalWayStats);
    return { GW, GWT, GWS, ADDR };
  }

  // === VIEW ===
  async function getUserData(address) { return GW.methods.getUserData(address).call(); }
  async function getUserStats(address) { return GW.methods.getUserStats(address).call(); }
  async function isUserActive(address) { return GW.methods.isUserActive(address).call(); }
  async function userHasLevel(address, level) { return GW.methods.userLevels(address, level).call(); }
  async function levelPrice(level) { return GW.methods.levelPrices(level).call(); }
  async function getPricesAndRewards() { return GWS.methods.getPricesAndRewards().call(); }
  async function getPackagePrice(address, maxLevel) { return GWS.methods.getPackagePrice(address, maxLevel).call(); }

  // === WRITE ===
  async function buyLevel(level, from) {
    const priceWei = await levelPrice(level);
    return GW.methods.buyLevel(level).send({ from, value: priceWei });
  }

  async function buyPackage(maxLevel, from) {
    const { activeLevels } = await getUserStats(from);
    const activeSet = new Set((activeLevels || []).map(n => Number(n)));
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      if (!activeSet.has(lvl)) {
        const price = await levelPrice(lvl);
        await GW.methods.buyLevel(lvl).send({ from, value: price });
      }
    }
    return true;
  }

  async function payQuarterly(from, valueWei) {
    return GW.methods.payQuarterlyActivity().send({ from, value: valueWei });
  }

  window.ContractsGW = {
    initContracts,
    getUserData, getUserStats, isUserActive, userHasLevel,
    levelPrice, getPricesAndRewards, getPackagePrice,
    buyLevel, buyPackage, payQuarterly,
  };
})();
