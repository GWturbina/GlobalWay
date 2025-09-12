// src/js/contracts.js
(() => {
  // Адреса на opBNB (прод)
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

  // ======= VIEW helpers =======

  async function getUserData(address) {
    // GlobalWay.getUserData(address) → isRegistered, sponsor, registrationTime, lastActivity, personalInvites, totalEarned, leaderRank
    return GW.methods.getUserData(address).call(); // :contentReference[oaicite:14]{index=14}
  }

  async function getUserStats(address) {
    // GlobalWay.getUserStats(address) → isRegistered, activeLevels[], personalInvites, totalEarned, registrationTime, leaderRank, referrals[]
    return GW.methods.getUserStats(address).call(); // :contentReference[oaicite:15]{index=15}
  }

  async function isUserActive(address) {
    return GW.methods.isUserActive(address).call(); // :contentReference[oaicite:16]{index=16}
  }

  async function userHasLevel(address, level) {
    return GW.methods.userLevels(address, level).call(); // :contentReference[oaicite:17]{index=17}
  }

  async function levelPrice(level) {
    return GW.methods.levelPrices(level).call(); // :contentReference[oaicite:18]{index=18}
  }

  async function getPricesAndRewards() {
    // GlobalWayStats.getPricesAndRewards() → {prices[], rewards[]}
    return GWS.methods.getPricesAndRewards().call(); // :contentReference[oaicite:19]{index=19}
  }

  async function getPackagePrice(address, maxLevel) {
    // Удобно для «быстрых пакетов»
    return GWS.methods.getPackagePrice(address, maxLevel).call(); // :contentReference[oaicite:20]{index=20}
  }

  // ======= WRITE helpers =======

  async function buyLevel(level, from) {
    const priceWei = await levelPrice(level);
    return GW.methods.buyLevel(level).send({ from, value: priceWei }); // :contentReference[oaicite:21]{index=21}
  }

  async function buyPackage(maxLevel, from) {
    // Суммируем только НЕактивные уровни → берём готовую сумму с контракта статистики
    const totalCost = await getPackagePrice(from, maxLevel);
    // Пакетная покупка одной транзакцией реализуется on-chain или циклом?
    // Если в основном контракте нет buyLevels(max), делаем последовательную покупку неактивных уровней:
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
    // Если QUARTERLY_FEE не вынесен в константу, UI даёт сумму; иначе можно прочитать из Stats/Overview
    return GW.methods.payQuarterlyActivity().send({ from, value: valueWei }); // :contentReference[oaicite:22]{index=22}
  }

  window.ContractsGW = {
    initContracts,
    getUserData,
    getUserStats,
    isUserActive,
    userHasLevel,
    levelPrice,
    getPricesAndRewards,
    getPackagePrice,
    buyLevel,
    buyPackage,
    payQuarterly,
  };
})();
