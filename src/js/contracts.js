// ==================== ПОЛНЫЙ ИСПРАВЛЕННЫЙ CONTRACTS.JS ====================

class ContractManager {
  constructor() {
    this.contracts = {};
    this.contractAddresses = {
      globalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
      globalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4',
      gwtToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc'
    };
    
    // Правильные адреса ролей согласно ТЗ
    this.ownerMultisig = '0x7261b8aeaee2f806f64001596a67d68f2055acd2';
    this.founders = [
      '0x03284a899147f5a07f82c622f34df92198671635', // F1 - главный спонсор
      '0x9b49bd9c9458615e11c051afd1ebe983563b67ee', // F2
      '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'  // F3
    ];
    
    // ИСПРАВЛЕНО: Правильные цены из смарт-контракта
    this.levelPricesOpBNB = {
      1: '1500000000000000',     // 0.0015 opBNB
      2: '3000000000000000',     // 0.003 opBNB
      3: '6000000000000000',     // 0.006 opBNB
      4: '12000000000000000',    // 0.012 opBNB
      5: '24000000000000000',    // 0.024 opBNB
      6: '48000000000000000',    // 0.048 opBNB
      7: '96000000000000000',    // 0.096 opBNB
      8: '192000000000000000',   // 0.192 opBNB
      9: '384000000000000000',   // 0.384 opBNB
      10: '768000000000000000',  // 0.768 opBNB
      11: '1536000000000000000', // 1.536 opBNB
      12: '3072000000000000000'  // 3.072 opBNB
    };
    
    this.quarterlyFee = '75000000000000000'; // 0.075 opBNB
    
    // ПОЛНЫЙ ABI GlobalWay контракта из артефакта
    this.globalWayABI = [
      {"inputs": [{"internalType": "address", "name": "_gwtTokenAddress", "type": "address"}], "stateMutability": "nonpayable", "type": "constructor"},
      {"inputs": [], "name": "EnforcedPause", "type": "error"},
      {"inputs": [], "name": "ExpectedPause", "type": "error"},
      {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}], "name": "OwnableInvalidOwner", "type": "error"},
      {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "OwnableUnauthorizedAccount", "type": "error"},
      {"inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "level", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "AutoUpgradeTriggered", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "InvestmentReturn", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "rank", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "bonus", "type": "uint256"}], "name": "LeaderRankAchieved", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "level", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "LevelActivated", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "level", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "MatrixBonusPaid", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}], "name": "OwnershipTransferred", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}], "name": "Paused", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "project", "type": "address"}, {"indexed": false, "internalType": "string", "name": "name", "type": "string"}], "name": "ProjectConnected", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "quarter", "type": "uint256"}], "name": "QuarterlyActivity", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "level", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "ReferralBonusPaid", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint8", "name": "level", "type": "uint8"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "TokensMinted", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}], "name": "Unpaused", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": true, "internalType": "address", "name": "sponsor", "type": "address"}], "name": "UserRegistered", "type": "event"},
      {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "oldWallet", "type": "address"}, {"indexed": true, "internalType": "address", "name": "newWallet", "type": "address"}], "name": "WalletChanged", "type": "event"},
      {"stateMutability": "payable", "type": "fallback"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "address", "name": "sponsor", "type": "address"}, {"internalType": "uint8", "name": "maxLevel", "type": "uint8"}], "name": "activateFounderTeam", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "packageType", "type": "uint8"}], "name": "activatePackage", "outputs": [], "stateMutability": "payable", "type": "function"},
      {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "allUsers", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "authorizedForFreeActivation", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "authorizedProjects", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address[]", "name": "teamMembers", "type": "address[]"}, {"internalType": "address[]", "name": "teamSponsors", "type": "address[]"}, {"internalType": "uint8[]", "name": "teamLevels", "type": "uint8[]"}], "name": "batchActivateTeam", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "board", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "boardCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "level", "type": "uint8"}], "name": "buyLevel", "outputs": [], "stateMutability": "payable", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "maxLevel", "type": "uint8"}], "name": "buyLevelsBulk", "outputs": [], "stateMutability": "payable", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "maxLevel", "type": "uint8"}], "name": "calculateBulkPrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "maxLevel", "type": "uint8"}], "name": "calculatePackagePrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "string", "name": "oldPassword", "type": "string"}, {"internalType": "string", "name": "newPassword", "type": "string"}], "name": "changeRecoveryPassword", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "newWallet", "type": "address"}, {"internalType": "string", "name": "recoveryPassword", "type": "string"}], "name": "changeWallet", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "charity", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "level", "type": "uint8"}], "name": "claimFrozenFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "claimLeaderBonus", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "projectContract", "type": "address"}, {"internalType": "string", "name": "projectName", "type": "string"}], "name": "connectProject", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "deployer", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "dev", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "projectContract", "type": "address"}], "name": "disconnectProject", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "distributeInvestmentReturns", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "emergencyPause", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "emergencyUnpause", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "founders", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "getUserType", "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "gwtToken", "outputs": [{"internalType": "contract IGlobalWayToken", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "investments", "outputs": [{"internalType": "uint256", "name": "totalInvested", "type": "uint256"}, {"internalType": "uint256", "name": "totalReceived", "type": "uint256"}, {"internalType": "bool", "name": "active", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "investorsList", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "isAuthorizedForActivation", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "isInactive", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "isInvestor", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "isLeaderCandidate", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint256", "name": "level", "type": "uint256"}], "name": "isLevelActive", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "isTechAccount", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "isUserActive", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "isUserInArray", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "isUserRegistered", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "lastWeeklyDistribution", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "leaderCandidates", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "name": "leaderPools", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "name": "levelPrices", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "matrix", "outputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint256", "name": "position", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "name": "matrixCounter", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "ops", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "paused", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "payQuarterlyActivity", "outputs": [], "stateMutability": "payable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "processInactiveAccount", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "projectNames", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "reactivateAccount", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "_sponsor", "type": "address"}], "name": "register", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "bool", "name": "authorized", "type": "bool"}], "name": "setActivationAuthorization", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "string", "name": "password", "type": "string"}], "name": "setRecoveryPassword", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "techAccountBalance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "techAccountLastQuarterly", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "techAccountOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "name": "tokenRewards", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "tokenomics", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "totalUsers", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [], "name": "totalVolume", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "transferToMultisig", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
      {"inputs": [], "name": "treasury", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "users", "outputs": [{"internalType": "bool", "name": "isRegistered", "type": "bool"}, {"internalType": "address", "name": "sponsor", "type": "address"}, {"internalType": "uint256", "name": "registrationTime", "type": "uint256"}, {"internalType": "uint256", "name": "lastActivity", "type": "uint256"}, {"internalType": "uint256", "name": "personalInvites", "type": "uint256"}, {"internalType": "uint256", "name": "totalEarned", "type": "uint256"}, {"internalType": "uint8", "name": "leaderRank", "type": "uint8"}, {"internalType": "bool", "name": "leaderBonusClaimed", "type": "bool"}, {"internalType": "uint256", "name": "quarterlyCounter", "type": "uint256"}, {"internalType": "bytes32", "name": "recoveryPasswordHash", "type": "bytes32"}, {"internalType": "bool", "name": "walletChanged", "type": "bool"}, {"internalType": "address", "name": "charityAccount", "type": "address"}, {"internalType": "address", "name": "techAccount1", "type": "address"}, {"internalType": "address", "name": "techAccount2", "type": "address"}], "stateMutability": "view", "type": "function"},
      {"stateMutability": "payable", "type": "receive"}
    ];
    
    this.init();
  }

  async init() {
    await this.waitForWeb3Manager();
    await this.setupContracts();
  }

  async waitForWeb3Manager() {
    return new Promise((resolve) => {
      const checkWeb3 = () => {
        if (window.web3Manager && window.web3Manager.web3) {
          console.log('✅ Web3Manager готов для контрактов');
          resolve();
        } else {
          console.log('⏳ Ожидание Web3Manager...');
          setTimeout(checkWeb3, 300);
        }
      };
      checkWeb3();
    });
  }

  async setupContracts() {
    if (!this.initAttempts) this.initAttempts = 0;
    
    if (!window.web3Manager || !window.web3Manager.web3) {
      this.initAttempts++;
      
      if (this.initAttempts > 10) {
        console.warn('⚠ Web3Manager не готов после 10 попыток, работаем без контрактов');
        this.initWithoutWeb3();
        return;
      }
      
      console.log(`⏳ Ожидание Web3Manager... попытка ${this.initAttempts}`);
      setTimeout(() => this.setupContracts(), 1000);
      return;
    }
    
    this.initAttempts = 0;
    console.log('✅ Web3Manager готов, инициализируем контракты');

    const web3 = window.web3Manager.web3;
    try {
      this.contracts.globalWay = new web3.eth.Contract(
        this.globalWayABI, 
        this.contractAddresses.globalWay
      );
      
      this.contracts.globalWayStats = new web3.eth.Contract(
        this.globalWayStatsABI, 
        this.contractAddresses.globalWayStats
      );
      
      this.contracts.gwtToken = new web3.eth.Contract(
        this.gwtTokenABI, 
        this.contractAddresses.gwtToken
      );
      
      console.log('✅ Contracts initialized successfully for opBNB');
    } catch (error) {
      console.error('❌ Error initializing contracts:', error);
    }
  }

  initWithoutWeb3() {
    console.log('🔧 Инициализация в режиме просмотра без Web3');
    
    if (window.globalWayApp && window.globalWayApp.currentPage === 'matrix') {
      this.showDemoMatrix();
    }
  }

  showDemoMatrix() {
    console.log('🎭 Показ демо матрицы');
  }

  // ==================== ОСНОВНЫЕ МЕТОДЫ СОГЛАСНО СМАРТ-КОНТРАКТУ ====================

  async register(sponsor, fromAddress) {
    try {
      return await this.contracts.globalWay.methods.register(sponsor).send({
        from: fromAddress,
        gas: 300000
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleContractError(error, 'registration');
    }
  }

  async buyLevel(level, fromAddress, value) {
    try {
      return await this.contracts.globalWay.methods.buyLevel(level).send({
        from: fromAddress,
        value: value || this.levelPricesOpBNB[level],
        gas: 400000
      });
    } catch (error) {
      console.error('Buy level error:', error);
      throw this.handleContractError(error, 'buy level');
    }
  }

  async buyLevelsBulk(maxLevel, fromAddress, value) {
    try {
      const totalPrice = value || await this.calculateBulkPrice(maxLevel);
      return await this.contracts.globalWay.methods.buyLevelsBulk(maxLevel).send({
        from: fromAddress,
        value: totalPrice,
        gas: 600000
      });
    } catch (error) {
      console.error('Buy levels bulk error:', error);
      throw this.handleContractError(error, 'buy levels bulk');
    }
  }

  // ИСПРАВЛЕНО: Правильная работа с пакетами согласно ТЗ
  async activatePackage(packageType, fromAddress, value) {
    try {
      // packageType: 1=MiniAdmin(1-4), 2=Admin(1-7), 3=SuperAdmin(1-10), 4=Manager(1-12)
      return await this.contracts.globalWay.methods.activatePackage(packageType).send({
        from: fromAddress,
        value: value,
        gas: 500000
      });
    } catch (error) {
      console.error('Activate package error:', error);
      throw this.handleContractError(error, 'activate package');
    }
  }

  async payQuarterlyActivity(fromAddress, value) {
    try {
      return await this.contracts.globalWay.methods.payQuarterlyActivity().send({
        from: fromAddress,
        value: value || this.quarterlyFee,
        gas: 300000
      });
    } catch (error) {
      console.error('Pay quarterly error:', error);
      throw this.handleContractError(error, 'quarterly payment');
    }
  }

  // НОВОЕ: Админские функции для владельца
  async activateFounderTeam(userAddress, sponsor, maxLevel, fromAddress) {
    try {
      if (!this.isOwnerOrFounder(fromAddress)) {
        throw new Error('Only owner or founders can activate users for free');
      }
      
      return await this.contracts.globalWay.methods.activateFounderTeam(userAddress, sponsor, maxLevel).send({
        from: fromAddress,
        gas: 400000
      });
    } catch (error) {
      console.error('Activate founder team error:', error);
      throw this.handleContractError(error, 'activate founder team');
    }
  }

  async batchActivateTeam(teamMembers, teamSponsors, teamLevels, fromAddress) {
    try {
      if (!this.isOwnerOrFounder(fromAddress)) {
        throw new Error('Only owner or founders can batch activate');
      }
      
      return await this.contracts.globalWay.methods.batchActivateTeam(teamMembers, teamSponsors, teamLevels).send({
        from: fromAddress,
        gas: 800000
      });
    } catch (error) {
      console.error('Batch activate team error:', error);
      throw this.handleContractError(error, 'batch activate team');
    }
  }

  async changeWallet(newWallet, recoveryPassword, fromAddress) {
    try {
      return await this.contracts.globalWay.methods.changeWallet(newWallet, recoveryPassword).send({
        from: fromAddress,
        gas: 300000
      });
    } catch (error) {
      console.error('Change wallet error:', error);
      throw this.handleContractError(error, 'change wallet');
    }
  }

  async setRecoveryPassword(password, fromAddress) {
    try {
      return await this.contracts.globalWay.methods.setRecoveryPassword(password).send({
        from: fromAddress,
        gas: 200000
      });
    } catch (error) {
      console.error('Set recovery password error:', error);
      throw this.handleContractError(error, 'set recovery password');
    }
  }

  async claimFrozenFunds(level, fromAddress) {
    try {
      return await this.contracts.globalWay.methods.claimFrozenFunds(level).send({
        from: fromAddress,
        gas: 300000
      });
    } catch (error) {
      console.error('Claim frozen funds error:', error);
      throw this.handleContractError(error, 'claim frozen funds');
    }
  }

  async claimLeaderBonus(fromAddress) {
    try {
      return await this.contracts.globalWay.methods.claimLeaderBonus().send({
        from: fromAddress,
        gas: 300000
      });
    } catch (error) {
      console.error('Claim leader bonus error:', error);
      throw this.handleContractError(error, 'claim leader bonus');
    }
  }

  async reactivateAccount(fromAddress) {
    try {
      return await this.contracts.globalWay.methods.reactivateAccount().send({
        from: fromAddress,
        gas: 200000
      });
    } catch (error) {
      console.error('Reactivate account error:', error);
      throw this.handleContractError(error, 'reactivate account');
    }
  }

  async processInactiveAccount(userAddress, fromAddress) {
    try {
      return await this.contracts.globalWay.methods.processInactiveAccount(userAddress).send({
        from: fromAddress,
        gas: 400000
      });
    } catch (error) {
      console.error('Process inactive account error:', error);
      throw this.handleContractError(error, 'process inactive account');
    }
  }

  // ==================== СТАТИСТИКА И ДАННЫЕ ====================

  async getUserFullInfo(userAddress) {
    try {
      if (!this.contracts.globalWayStats) {
        console.warn('GlobalWayStats contract not available');
        return this.getUserData(userAddress); // Fallback
      }
      return await this.contracts.globalWayStats.methods.getUserFullInfo(userAddress).call();
    } catch (error) {
      console.error('Get user info error:', error);
      throw this.handleContractError(error, 'get user info');
    }
  }

  async getPackagePrice(userAddress, packageType) {
    try {
      if (this.contracts.globalWayStats) {
        return await this.contracts.globalWayStats.methods.getPackagePrice(userAddress, packageType).call();
      } else {
        // Fallback расчет
        return await this.calculatePackagePriceLocal(userAddress, packageType);
      }
    } catch (error) {
      console.error('Get package price error:', error);
      return await this.calculatePackagePriceLocal(userAddress, packageType);
    }
  }

  async calculatePackagePriceLocal(userAddress, packageType) {
    const packageLevels = {
      1: [1, 2, 3, 4],           // MiniAdmin
      2: [1, 2, 3, 4, 5, 6, 7], // Admin  
      3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // SuperAdmin
      4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Manager
    };

    const targetLevels = packageLevels[packageType];
    if (!targetLevels) throw new Error('Invalid package type');

    let totalPrice = BigInt(0);
    
    for (const level of targetLevels) {
      const isActive = await this.isLevelActive(userAddress, level);
      if (!isActive) {
        totalPrice += BigInt(this.levelPricesOpBNB[level]);
      }
    }
    
    return totalPrice.toString();
  }

  async getContractOverview() {
    try {
      if (!this.contracts.globalWayStats) {
        return this.getBasicContractStats();
      }
      return await this.contracts.globalWayStats.methods.getContractOverview().call();
    } catch (error) {
      console.error('Get contract overview error:', error);
      return this.getBasicContractStats();
    }
  }

  async getBasicContractStats() {
    // Базовая статистика если Stats контракт недоступен
    try {
      const totalUsers = await this.contracts.globalWay.methods.totalUsers().call();
      const totalVolume = await this.contracts.globalWay.methods.totalVolume().call();
      const lastDistribution = await this.contracts.globalWay.methods.lastWeeklyDistribution().call();
      
      return {
        totalUsers: totalUsers || 0,
        totalVolume: totalVolume || '0',
        activeUsers: 0,
        levelDistribution: new Array(12).fill(0),
        poolBalances: new Array(4).fill('0'),
        lastDistribution: lastDistribution || Math.floor(Date.now() / 1000),
        contractBalance: '0'
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalVolume: '0',
        activeUsers: 0,
        levelDistribution: new Array(12).fill(0),
        poolBalances: new Array(4).fill('0'),
        lastDistribution: Math.floor(Date.now() / 1000),
        contractBalance: '0'
      };
    }
  }

  // ==================== ПРОВЕРКИ ====================

  async isUserRegistered(userAddress) {
    try {
      return await this.contracts.globalWay.methods.isUserRegistered(userAddress).call();
    } catch (error) {
      console.error('Check registration error:', error);
      return false;
    }
  }

  async isUserActive(userAddress) {
    try {
      return await this.contracts.globalWay.methods.isUserActive(userAddress).call();
    } catch (error) {
      console.error('Check active error:', error);
      return false;
    }
  }

  async isLevelActive(userAddress, level) {
    try {
      return await this.contracts.globalWay.methods.isLevelActive(userAddress, level).call();
    } catch (error) {
      console.error('Check level active error:', error);
      return false;
    }
  }

  async isInactive(userAddress) {
    try {
      return await this.contracts.globalWay.methods.isInactive(userAddress).call();
    } catch (error) {
      console.error('Check inactive error:', error);
      return false;
    }
  }

  async isAuthorizedForActivation(userAddress) {
    try {
      return await this.contracts.globalWay.methods.isAuthorizedForActivation(userAddress).call();
    } catch (error) {
      console.error('Check authorization error:', error);
      return false;
    }
  }

  // ==================== ЦЕНЫ И РАСЧЕТЫ ====================

  async getLevelPrice(level) {
    try {
      if (this.contracts.globalWay) {
        return await this.contracts.globalWay.methods.levelPrices(level).call();
      }
      // Используем локальные цены для opBNB
      return this.levelPricesOpBNB[level] || '0';
    } catch (error) {
      console.error('Get level price error:', error);
      return this.levelPricesOpBNB[level] || '0';
    }
  }

  async calculateBulkPrice(maxLevel) {
    try {
      if (this.contracts.globalWay) {
        return await this.contracts.globalWay.methods.calculateBulkPrice(maxLevel).call();
      }
      
      // Локальный расчет
      let totalPrice = BigInt(0);
      for (let level = 1; level <= maxLevel; level++) {
        totalPrice += BigInt(this.levelPricesOpBNB[level]);
      }
      return totalPrice.toString();
    } catch (error) {
      console.error('Calculate bulk price error:', error);
      throw this.handleContractError(error, 'calculate bulk price');
    }
  }

  async calculatePackagePrice(packageType) {
    try {
      if (this.contracts.globalWay) {
        return await this.contracts.globalWay.methods.calculatePackagePrice(packageType).call();
      }
      
      // Локальный расчет
      const packageInfo = this.getPackageInfo(packageType);
      if (!packageInfo) throw new Error('Invalid package type');
      
      let totalPrice = BigInt(0);
      for (const level of packageInfo.levels) {
        totalPrice += BigInt(this.levelPricesOpBNB[level]);
      }
      return totalPrice.toString();
    } catch (error) {
      console.error('Calculate package price error:', error);
      throw this.handleContractError(error, 'calculate package price');
    }
  }

  async getQuarterlyFee() {
    try {
      return this.quarterlyFee;
    } catch (error) {
      console.error('Get quarterly fee error:', error);
      throw this.handleContractError(error, 'get quarterly fee');
    }
  }

  // ==================== ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ ====================

  async getUserData(userAddress) {
    try {
      return await this.contracts.globalWay.methods.users(userAddress).call();
    } catch (error) {
      console.error('Get user data error:', error);
      throw this.handleContractError(error, 'get user data');
    }
  }

  async getTotalUsers() {
    try {
      return await this.contracts.globalWay.methods.totalUsers().call();
    } catch (error) {
      console.error('Get total users error:', error);
      return '0';
    }
  }

  async getTotalVolume() {
    try {
      return await this.contracts.globalWay.methods.totalVolume().call();
    } catch (error) {
      console.error('Get total volume error:', error);
      return '0';
    }
  }

  async getMatrixCounter(level) {
    try {
      return await this.contracts.globalWay.methods.matrixCounter(level).call();
    } catch (error) {
      console.error('Get matrix counter error:', error);
      return '0';
    }
  }

  async getLeaderPool(rank) {
    try {
      return await this.contracts.globalWay.methods.leaderPools(rank).call();
    } catch (error) {
      console.error('Get leader pool error:', error);
      return '0';
    }
  }

  async getTokenRewards(level) {
    try {
      return await this.contracts.globalWay.methods.tokenRewards(level).call();
    } catch (error) {
      console.error('Get token rewards error:', error);
      return '0';
    }
  }

  // ==================== GWT TOKEN МЕТОДЫ ====================

  async getTokenBalance(userAddress) {
    try {
      if (!this.contracts.gwtToken) {
        console.warn('GWT Token contract not initialized');
        return '0';
      }
      
      const balance = await this.contracts.gwtToken.methods.balanceOf(userAddress).call();
      return balance;
    } catch (error) {
      console.error('Get token balance error:', error);
      return '0';
    }
  }

  async getTokenTotalSupply() {
    try {
      if (!this.contracts.gwtToken) {
        console.warn('GWT Token contract not initialized');
        return '1000000000000000000000000000';
      }
      
      const supply = await this.contracts.gwtToken.methods.totalSupply().call();
      return supply;
    } catch (error) {
      console.error('Get token total supply error:', error);
      return '1000000000000000000000000000';
    }
  }

  async getTokenCurrentPrice() {
    try {
      if (!this.contracts.gwtToken) {
        console.warn('GWT Token contract not initialized');
        return '1000000000000000';
      }
      
      const price = await this.contracts.gwtToken.methods.currentPrice().call();
      return price;
    } catch (error) {
      console.error('Get token price error:', error);
      return '1000000000000000';
    }
  }

  async getTokenName() {
    try {
      if (!this.contracts.gwtToken) return 'GlobalWay Token';
      return await this.contracts.gwtToken.methods.name().call();
    } catch (error) {
      console.error('Get token name error:', error);
      return 'GlobalWay Token';
    }
  }

  async getTokenSymbol() {
    try {
      if (!this.contracts.gwtToken) return 'GWT';
      return await this.contracts.gwtToken.methods.symbol().call();
    } catch (error) {
      console.error('Get token symbol error:', error);
      return 'GWT';
    }
  }

  async getTokenDecimals() {
    try {
      if (!this.contracts.gwtToken) return '18';
      return await this.contracts.gwtToken.methods.decimals().call();
    } catch (error) {
      console.error('Get token decimals error:', error);
      return '18';
    }
  }

  async buyTokens(tokenAmount, fromAddress, bnbAmount) {
    try {
      return await this.contracts.gwtToken.methods.buyTokens(tokenAmount).send({
        from: fromAddress,
        value: bnbAmount,
        gas: 300000
      });
    } catch (error) {
      console.error('Buy tokens error:', error);
      throw this.handleContractError(error, 'buy tokens');
    }
  }

  async sellTokens(tokenAmount, fromAddress) {
    try {
      return await this.contracts.gwtToken.methods.sellTokens(tokenAmount).send({
        from: fromAddress,
        gas: 300000
      });
    } catch (error) {
      console.error('Sell tokens error:', error);
      throw this.handleContractError(error, 'sell tokens');
    }
  }

  async calculatePurchaseCost(tokenAmount) {
    try {
      if (!this.contracts.gwtToken) throw new Error('GWT Token contract not initialized');
      return await this.contracts.gwtToken.methods.calculatePurchaseCost(tokenAmount).call();
    } catch (error) {
      console.error('Calculate purchase cost error:', error);
      throw this.handleContractError(error, 'calculate purchase cost');
    }
  }

  async calculateSalePrice(tokenAmount) {
    try {
      if (!this.contracts.gwtToken) throw new Error('GWT Token contract not initialized');
      return await this.contracts.gwtToken.methods.calculateSalePrice(tokenAmount).call();
    } catch (error) {
      console.error('Calculate sale price error:', error);
      throw this.handleContractError(error, 'calculate sale price');
    }
  }

  async approveTokens(spender, amount, fromAddress) {
    try {
      return await this.contracts.gwtToken.methods.approve(spender, amount).send({
        from: fromAddress,
        gas: 100000
      });
    } catch (error) {
      console.error('Approve tokens error:', error);
      throw this.handleContractError(error, 'approve tokens');
    }
  }

  async transferTokens(to, amount, fromAddress) {
    try {
      return await this.contracts.gwtToken.methods.transfer(to, amount).send({
        from: fromAddress,
        gas: 100000
      });
    } catch (error) {
      console.error('Transfer tokens error:', error);
      throw this.handleContractError(error, 'transfer tokens');
    }
  }

  // ==================== ПРОВЕРКИ ВЛАДЕЛЬЦА И РОЛЕЙ ====================

  async getContractOwner() {
    try {
      return await this.contracts.globalWay.methods.owner().call();
    } catch (error) {
      console.error('Get owner error:', error);
      return null;
    }
  }

  isOwner(address) {
    return address.toLowerCase() === this.ownerMultisig.toLowerCase();
  }

  isFounder(address) {
    return this.founders.some(founder => 
      founder.toLowerCase() === address.toLowerCase()
    );
  }

  isOwnerOrFounder(address) {
    return this.isOwner(address) || this.isFounder(address);
  }

  getFounderPosition(address) {
    const index = this.founders.findIndex(founder => 
      founder.toLowerCase() === address.toLowerCase()
    );
    return index >= 0 ? index + 1 : 0; // F1, F2, F3 или 0
  }

  async getUserType(userAddress) {
    try {
      return await this.contracts.globalWay.methods.getUserType(userAddress).call();
    } catch (error) {
      console.error('Get user type error:', error);
      return '0';
    }
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  reinitializeContracts() {
    console.log('Переинициализация контрактов для новой сети...');
    this.setupContracts();
  }

  getPackageInfo(packageType) {
    const packageData = {
      1: {
        name: 'MiniAdmin',
        levels: [1, 2, 3, 4],
        description: 'Уровни 1-4',
        maxLevel: 4
      },
      2: {
        name: 'Admin',
        levels: [1, 2, 3, 4, 5, 6, 7],
        description: 'Уровни 1-7',
        maxLevel: 7
      },
      3: {
        name: 'SuperAdmin',
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        description: 'Уровни 1-10',
        maxLevel: 10
      },
      4: {
        name: 'Manager',
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        description: 'Уровни 1-12',
        maxLevel: 12
      }
    };

    return packageData[packageType] || null;
  }

  isContractsReady() {
    return !!(this.contracts.globalWay && this.contracts.gwtToken);
  }

  getCurrentNetwork() {
    return window.web3Manager?.getNetworkId() || null;
  }

  formatAddress(address) {
    if (!address) return '0x000...000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // ==================== КОНВЕРТАЦИЯ ВАЛЮТ ====================

  toWei(value) {
    if (window.web3Manager?.web3) {
      return window.web3Manager.web3.utils.toWei(value.toString(), 'ether');
    }
    // Fallback конвертация
    return (BigInt(value) * BigInt(10) ** BigInt(18)).toString();
  }

  fromWei(value) {
    if (window.web3Manager?.web3) {
      return window.web3Manager.web3.utils.fromWei(value.toString(), 'ether');
    }
    // Fallback конвертация
    return (BigInt(value) / BigInt(10) ** BigInt(18)).toString();
  }

  // ==================== ОБРАБОТКА ОШИБОК ====================

  handleContractError(error, operation = 'contract operation') {
    console.error(`Contract error during ${operation}:`, error);
    
    let message = `Ошибка при ${operation}`;
    
    if (error.message?.includes('User denied')) {
      message = 'Транзакция отклонена пользователем';
    } else if (error.message?.includes('insufficient funds')) {
      message = 'Недостаточно средств на балансе';
    } else if (error.message?.includes('Already registered')) {
      message = 'Пользователь уже зарегистрирован';
    } else if (error.message?.includes('Level already active')) {
      message = 'Уровень уже активирован';
    } else if (error.message?.includes('Need previous level')) {
      message = 'Необходимо сначала активировать предыдущий уровень';
    } else if (error.message?.includes('execution reverted')) {
      message = 'Транзакция отклонена смарт-контрактом';
    } else if (error.message?.includes('network')) {
      message = 'Ошибка сети. Проверьте подключение';
    } else if (error.message?.includes('Only owner')) {
      message = 'Только владелец может выполнить эту операцию';
    } else if (error.message?.includes('Paused')) {
      message = 'Контракт приостановлен';
    } else if (error.message?.includes('Not registered')) {
      message = 'Пользователь не зарегистрирован';
    } else if (error.message?.includes('Inactive')) {
      message = 'Аккаунт неактивен';
    } else if (error.message?.includes('Too early')) {
      message = 'Слишком рано для этой операции';
    } else if (error.message?.includes('Invalid sponsor')) {
      message = 'Недействительный спонсор';
    } else if (error.message?.includes('Self sponsor')) {
      message = 'Нельзя быть спонсором самому себе';
    }
    
    return new Error(message);
  }

  // ==================== МОНИТОРИНГ ТРАНЗАКЦИЙ ====================

  async estimateGas(method, fromAddress, value = '0') {
    try {
      const gasEstimate = await method.estimateGas({
        from: fromAddress,
        value: value
      });
      
      return Math.floor(gasEstimate * 1.2); // +20% запас
    } catch (error) {
      console.warn('Не удалось оценить газ:', error);
      return 300000; // Дефолтное значение для opBNB
    }
  }

  async waitForTransaction(txHash, confirmations = 1) {
    const web3 = window.web3Manager.web3;
    if (!web3) throw new Error('Web3 недоступен');

    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {
          const receipt = await web3.eth.getTransactionReceipt(txHash);
          
          if (receipt) {
            if (receipt.status === false) {
              reject(new Error('Транзакция отклонена сетью'));
              return;
            }
            
            const currentBlock = await web3.eth.getBlockNumber();
            const confirmedBlocks = currentBlock - receipt.blockNumber;
            
            if (confirmedBlocks >= confirmations) {
              resolve(receipt);
              return;
            }
          }
          
          setTimeout(checkTransaction, 3000);
        } catch (error) {
          reject(error);
        }
      };
      
      checkTransaction();
    });
  }

  // ==================== СТАТИСТИКА И АНАЛИТИКА ====================

  async getUserActiveLevels(userAddress) {
    try {
      const activeLevels = [];
      
      for (let level = 1; level <= 12; level++) {
        const isActive = await this.isLevelActive(userAddress, level);
        if (isActive) {
          activeLevels.push(level);
        }
      }
      
      return activeLevels;
    } catch (error) {
      console.error('Error getting active levels:', error);
      return [];
    }
  }

  async getUserStats(userAddress) {
    try {
      const userData = await this.getUserData(userAddress);
      const activeLevels = await this.getUserActiveLevels(userAddress);
      const isRegistered = await this.isUserRegistered(userAddress);
      const isActive = await this.isUserActive(userAddress);
      const isInactive = await this.isInactive(userAddress);
      
      return {
        isRegistered,
        isActive,
        isInactive,
        sponsor: userData.sponsor,
        personalInvites: parseInt(userData.personalInvites),
        totalEarned: userData.totalEarned,
        leaderRank: parseInt(userData.leaderRank),
        leaderBonusClaimed: userData.leaderBonusClaimed,
        activeLevels,
        totalActiveLevels: activeLevels.length,
        registrationTime: parseInt(userData.registrationTime),
        lastActivity: parseInt(userData.lastActivity),
        quarterlyCounter: parseInt(userData.quarterlyCounter),
        walletChanged: userData.walletChanged,
        charityAccount: userData.charityAccount,
        techAccount1: userData.techAccount1,
        techAccount2: userData.techAccount2
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  async getFullContractStats() {
    try {
      const totalUsers = await this.getTotalUsers();
      const totalVolume = await this.getTotalVolume();
      const leaderPools = [];
      
      for (let i = 1; i <= 4; i++) {
        const pool = await this.getLeaderPool(i);
        leaderPools.push(pool);
      }
      
      const matrixCounters = [];
      for (let i = 1; i <= 12; i++) {
        const counter = await this.getMatrixCounter(i);
        matrixCounters.push(counter);
      }
      
      return {
        totalUsers,
        totalVolume,
        leaderPools,
        matrixCounters
      };
    } catch (error) {
      console.error('Error getting full contract stats:', error);
      return null;
    }
  }

  // ==================== КЭШИРОВАНИЕ И ОПТИМИЗАЦИЯ ====================

  createCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}_${Date.now()}`;
  }

  invalidateCache(pattern) {
    // Простая очистка кэша для оптимизации
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // ==================== BATCH ОПЕРАЦИИ ====================

  async batchCall(calls) {
    try {
      const web3 = window.web3Manager.web3;
      if (!web3) throw new Error('Web3 not available');

      const batch = new web3.BatchRequest();
      const promises = [];

      calls.forEach(call => {
        promises.push(new Promise((resolve, reject) => {
          const request = call.request((error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          batch.add(request);
        }));
      });

      batch.execute();
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch call error:', error);
      throw error;
    }
  }

  // ==================== УТИЛИТЫ ФОРМАТИРОВАНИЯ ====================

  formatBNB(value, decimals = 4) {
    if (!value) return '0';
    const bnbValue = parseFloat(this.fromWei(value));
    return bnbValue.toFixed(decimals);
  }

  formatTokens(value, decimals = 2) {
    if (!value) return '0';
    const tokenValue = parseFloat(this.fromWei(value));
    return tokenValue.toFixed(decimals);
  }

  formatLargeNumber(value) {
    if (!value) return '0';
    const num = parseFloat(this.fromWei(value));
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }

  formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    
    const intervals = [
      { label: 'год', seconds: 31536000 },
      { label: 'месяц', seconds: 2592000 },
      { label: 'день', seconds: 86400 },
      { label: 'час', seconds: 3600 },
      { label: 'минута', seconds: 60 }
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 'а' : ''} назад`;
      }
    }
    
    return 'Только что';
  }

  // ==================== СОБЫТИЯ И ЛОГИ ====================

  async getEvents(eventName, fromBlock = 'latest', toBlock = 'latest') {
    try {
      const contract = this.contracts.globalWay;
      if (!contract) throw new Error('Contract not initialized');

      const events = await contract.getPastEvents(eventName, {
        fromBlock,
        toBlock
      });

      return events;
    } catch (error) {
      console.error('Get events error:', error);
      return [];
    }
  }

  async getUserEvents(userAddress, eventTypes = ['UserRegistered', 'LevelActivated', 'ReferralBonusPaid', 'MatrixBonusPaid']) {
    try {
      const allEvents = [];
      
      for (const eventType of eventTypes) {
        const events = await this.getEvents(eventType, 0, 'latest');
        const userEvents = events.filter(event => {
          const values = event.returnValues;
          return values.user?.toLowerCase() === userAddress.toLowerCase() ||
                 values.from?.toLowerCase() === userAddress.toLowerCase() ||
                 values.to?.toLowerCase() === userAddress.toLowerCase();
        });
        allEvents.push(...userEvents);
      }

      return allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (error) {
      console.error('Get user events error:', error);
      return [];
    }
  }

  async getRecentTransactions(limit = 10) {
    try {
      const events = await this.getEvents('LevelActivated', 'latest-1000', 'latest');
      return events.slice(0, limit);
    } catch (error) {
      console.error('Get recent transactions error:', error);
      return [];
    }
  }

  // ==================== ДИАГНОСТИКА И ОТЛАДКА ====================

  async diagnoseContract() {
    const diagnosis = {
      contractsLoaded: this.isContractsReady(),
      web3Available: !!window.web3Manager?.web3,
      networkId: this.getCurrentNetwork(),
      networkSupported: this.getCurrentNetwork() === 204,
      ownerAddress: this.ownerMultisig,
      foundersAddresses: this.founders,
      contractAddresses: this.contractAddresses,
      levelPrices: this.levelPricesOpBNB,
      quarterlyFee: this.quarterlyFee
    };

    try {
      if (this.contracts.globalWay) {
        diagnosis.contractOwner = await this.getContractOwner();
        diagnosis.ownerMatch = diagnosis.contractOwner?.toLowerCase() === this.ownerMultisig.toLowerCase();
        diagnosis.totalUsers = await this.getTotalUsers();
        diagnosis.totalVolume = await this.getTotalVolume();
        diagnosis.isPaused = await this.contracts.globalWay.methods.paused().call();
      }
    } catch (error) {
      diagnosis.contractError = error.message;
    }

    console.log('Contract diagnosis:', diagnosis);
    return diagnosis;
  }

  // ==================== СПЕЦИАЛЬНЫЕ ФУНКЦИИ ДЛЯ АДМИНОВ ====================

  async setActivationAuthorization(userAddress, authorized, fromAddress) {
    try {
      if (!this.isOwner(fromAddress)) {
        throw new Error('Only owner can set authorization');
      }
      
      return await this.contracts.globalWay.methods.setActivationAuthorization(userAddress, authorized).send({
        from: fromAddress,
        gas: 150000
      });
    } catch (error) {
      console.error('Set activation authorization error:', error);
      throw this.handleContractError(error, 'set activation authorization');
    }
  }

  async emergencyPause(fromAddress) {
    try {
      if (!this.isOwner(fromAddress)) {
        throw new Error('Only owner can pause');
      }
      
      return await this.contracts.globalWay.methods.emergencyPause().send({
        from: fromAddress,
        gas: 100000
      });
    } catch (error) {
      console.error('Emergency pause error:', error);
      throw this.handleContractError(error, 'emergency pause');
    }
  }

  async emergencyUnpause(fromAddress) {
    try {
      if (!this.isOwner(fromAddress)) {
        throw new Error('Only owner can unpause');
      }
      
      return await this.contracts.globalWay.methods.emergencyUnpause().send({
        from: fromAddress,
        gas: 100000
      });
    } catch (error) {
      console.error('Emergency unpause error:', error);
      throw this.handleContractError(error, 'emergency unpause');
    }
  }

  async transferToMultisig(fromAddress) {
    try {
      if (!this.isOwner(fromAddress)) {
        throw new Error('Only owner can transfer to multisig');
      }
      
      return await this.contracts.globalWay.methods.transferToMultisig().send({
        from: fromAddress,
        gas: 150000
      });
    } catch (error) {
      console.error('Transfer to multisig error:', error);
      throw this.handleContractError(error, 'transfer to multisig');
    }
  }

  // ==================== ОЧИСТКА РЕСУРСОВ ====================

  destroy() {
    this.contracts = {};
    this.invalidateCache('contract_');
    console.log('ContractManager destroyed');
  }
}

// ==================== ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ====================

window.contractManager = new ContractManager();

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContractManager;
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ДЛЯ ОТЛАДКИ ====================

window.debugContract = {
  async checkUser(address) {
    if (!window.contractManager.isContractsReady()) {
      console.log('Contracts not ready');
      return;
    }
    
    const stats = await window.contractManager.getUserStats(address);
    console.log('User stats:', stats);
    return stats;
  },
  
  async checkOwner() {
    const owner = await window.contractManager.getContractOwner();
    const currentAccount = window.web3Manager?.account || '';
    const isOwner = window.contractManager.isOwner(currentAccount);
    const isFounder = window.contractManager.isFounder(currentAccount);
    const founderPosition = window.contractManager.getFounderPosition(currentAccount);
    
    console.log('Contract owner:', owner);
    console.log('Current account:', currentAccount);
    console.log('Is owner:', isOwner);
    console.log('Is founder:', isFounder);
    console.log('Founder position:', founderPosition);
    
    return { owner, currentAccount, isOwner, isFounder, founderPosition };
  },
  
  async diagnose() {
    return await window.contractManager.diagnoseContract();
  },
  
  async checkPrices() {
    console.log('Level prices (opBNB):');
    for (let i = 1; i <= 12; i++) {
      const price = window.contractManager.levelPricesOpBNB[i];
      const priceInBNB = window.contractManager.fromWei(price);
      console.log(`Level ${i}: ${priceInBNB} BNB`);
    }
    
    console.log('\nPackage prices:');
    for (let i = 1; i <= 4; i++) {
      const packageInfo = window.contractManager.getPackageInfo(i);
      const price = await window.contractManager.calculatePackagePrice(i);
      const priceInBNB = window.contractManager.fromWei(price);
      console.log(`${packageInfo.name}: ${priceInBNB} BNB`);
    }
    
    const quarterlyFee = window.contractManager.fromWei(window.contractManager.quarterlyFee);
    console.log(`\nQuarterly fee: ${quarterlyFee} BNB`);
  },
  
  async checkEvents(userAddress) {
    const events = await window.contractManager.getUserEvents(userAddress);
    console.log(`Events for ${userAddress}:`, events);
    return events;
  },
  
  async checkBalance(address) {
    const balance = await window.web3Manager.getBalance(address);
    const tokenBalance = await window.contractManager.getTokenBalance(address);
    const tokenBalanceFormatted = window.contractManager.formatTokens(tokenBalance);
    
    console.log('BNB Balance:', window.web3Manager.web3.utils.fromWei(balance, 'ether'));
    console.log('GWT Balance:', tokenBalanceFormatted);
    
    return { bnbBalance: balance, gwtBalance: tokenBalance };
  }
};

console.log('✅ ContractManager полностью инициализирован для opBNB сети');
console.log('🔧 Доступны утилиты отладки: window.debugContract');
console.log('📋 Адреса контрактов:', window.contractManager.contractAddresses);

// ==================== АВТОМАТИЧЕСКИЕ ПРОВЕРКИ ПРИ ЗАГРУЗКЕ ====================

// Проверка готовности контрактов каждые 5 секунд
let contractCheckInterval = setInterval(() => {
  if (window.contractManager.isContractsReady()) {
    console.log('✅ Все контракты инициализированы и готовы к работе');
    clearInterval(contractCheckInterval);
  }
}, 5000);

// ==================== ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ ====================

// Упрощенные функции для быстрого доступа
window.GlobalWay = {
  // Основные функции
  register: (sponsor) => window.contractManager.register(sponsor, window.web3Manager?.account),
  buyLevel: (level) => window.contractManager.buyLevel(level, window.web3Manager?.account),
  buyPackage: (packageType) => window.contractManager.activatePackage(packageType, window.web3Manager?.account),
  payQuarterly: () => window.contractManager.payQuarterlyActivity(window.web3Manager?.account),
  
  // Проверки
  isRegistered: (address) => window.contractManager.isUserRegistered(address),
  isActive: (address) => window.contractManager.isUserActive(address),
  isLevelActive: (address, level) => window.contractManager.isLevelActive(address, level),
  
  // Статистика
  getUserStats: (address) => window.contractManager.getUserStats(address),
  getContractStats: () => window.contractManager.getFullContractStats(),
  
  // Токены
  getTokenBalance: (address) => window.contractManager.getTokenBalance(address),
  buyTokens: (amount, bnb) => window.contractManager.buyTokens(amount, window.web3Manager?.account, bnb),
  sellTokens: (amount) => window.contractManager.sellTokens(amount, window.web3Manager?.account),
  
  // Утилиты
  toWei: (value) => window.contractManager.toWei(value),
  fromWei: (value) => window.contractManager.fromWei(value),
  formatBNB: (value) => window.contractManager.formatBNB(value),
  formatTokens: (value) => window.contractManager.formatTokens(value),
  
  // Контракты
  contracts: window.contractManager.contracts,
  addresses: window.contractManager.contractAddresses,
  
  // Диагностика
  diagnose: () => window.contractManager.diagnoseContract()
};

// ==================== КОНЕЦ ФАЙЛА CONTRACTS.JS ====================
