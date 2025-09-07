// ==================== ПОЛНЫЙ ИСПРАВЛЕННЫЙ CONTRACTS.JS ====================

class ContractManager {
  constructor() {
    this.contracts = {};
    this.contractAddresses = {
      globalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
      globalWayStats: '0x20B923c5cbcdc51D0233Da5017b7554CBfB76dF0',
      gwtToken: '0xd9145CCE52D386f254917e481eB44e9943F39138'
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
    
    // ПОЛНЫЙ ABI GlobalWay контракта
    this.globalWayABI = [
      {
        "inputs": [{"internalType": "address", "name": "_gwtTokenAddress", "type": "address"}],
        "stateMutability": "nonpayable", "type": "constructor"
      },
      {
        "inputs": [{"internalType": "address", "name": "_sponsor", "type": "address"}],
        "name": "register", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "level", "type": "uint8"}],
        "name": "buyLevel", "outputs": [], "stateMutability": "payable", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "maxLevel", "type": "uint8"}],
        "name": "buyLevelsBulk", "outputs": [], "stateMutability": "payable", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "packageType", "type": "uint8"}],
        "name": "activatePackage", "outputs": [], "stateMutability": "payable", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "address", "name": "sponsor", "type": "address"}, {"internalType": "uint8", "name": "maxLevel", "type": "uint8"}],
        "name": "activateFounderTeam", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [{"internalType": "address[]", "name": "teamMembers", "type": "address[]"}, {"internalType": "address[]", "name": "teamSponsors", "type": "address[]"}, {"internalType": "uint8[]", "name": "teamLevels", "type": "uint8[]"}],
        "name": "batchActivateTeam", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [],
        "name": "payQuarterlyActivity", "outputs": [], "stateMutability": "payable", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "isUserRegistered", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "isUserActive", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint256", "name": "level", "type": "uint256"}],
        "name": "isLevelActive", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "name": "levelPrices", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "maxLevel", "type": "uint8"}],
        "name": "calculateBulkPrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint8", "name": "packageType", "type": "uint8"}],
        "name": "calculatePackagePrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [],
        "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [],
        "name": "QUARTERLY_FEE", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "users", "outputs": [
          {"internalType": "bool", "name": "isRegistered", "type": "bool"},
          {"internalType": "address", "name": "sponsor", "type": "address"},
          {"internalType": "uint256", "name": "registrationTime", "type": "uint256"},
          {"internalType": "uint256", "name": "lastActivity", "type": "uint256"},
          {"internalType": "uint256", "name": "personalInvites", "type": "uint256"},
          {"internalType": "uint256", "name": "totalEarned", "type": "uint256"},
          {"internalType": "uint8", "name": "leaderRank", "type": "uint8"},
          {"internalType": "bool", "name": "leaderBonusClaimed", "type": "bool"},
          {"internalType": "uint256", "name": "quarterlyCounter", "type": "uint256"},
          {"internalType": "bytes32", "name": "recoveryPasswordHash", "type": "bytes32"},
          {"internalType": "bool", "name": "walletChanged", "type": "bool"},
          {"internalType": "address", "name": "charityAccount", "type": "address"},
          {"internalType": "address", "name": "techAccount1", "type": "address"},
          {"internalType": "address", "name": "techAccount2", "type": "address"}
        ],
        "stateMutability": "view", "type": "function"
      }
    ];

    // ПОЛНЫЙ ABI GlobalWayStats контракта
    this.globalWayStatsABI = [
      {
        "inputs": [{"internalType": "address", "name": "_globalWayAddress", "type": "address"}],
        "stateMutability": "nonpayable", "type": "constructor"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUserFullInfo",
        "outputs": [{
          "components": [
            {"internalType": "bool", "name": "isRegistered", "type": "bool"},
            {"internalType": "address", "name": "sponsor", "type": "address"},
            {"internalType": "uint256", "name": "registrationTime", "type": "uint256"},
            {"internalType": "uint256", "name": "lastActivity", "type": "uint256"},
            {"internalType": "uint256", "name": "personalInvites", "type": "uint256"},
            {"internalType": "uint256", "name": "totalEarned", "type": "uint256"},
            {"internalType": "uint8", "name": "leaderRank", "type": "uint8"},
            {"internalType": "bool", "name": "leaderBonusClaimed", "type": "bool"},
            {"internalType": "uint256", "name": "quarterlyCounter", "type": "uint256"},
            {"internalType": "bool", "name": "walletChanged", "type": "bool"},
            {"internalType": "address", "name": "charityAccount", "type": "address"},
            {"internalType": "address", "name": "techAccount1", "type": "address"},
            {"internalType": "address", "name": "techAccount2", "type": "address"},
            {"internalType": "bool", "name": "isInactive", "type": "bool"},
            {"internalType": "uint256[]", "name": "activeLevels", "type": "uint256[]"},
            {"internalType": "uint256[]", "name": "frozenFunds", "type": "uint256[]"},
            {"internalType": "address[]", "name": "referrals", "type": "address[]"}
          ],
          "internalType": "struct GlobalWayStats.UserFullInfo", "name": "info", "type": "tuple"
        }],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "uint8", "name": "packageType", "type": "uint8"}],
        "name": "getPackagePrice",
        "outputs": [{"internalType": "uint256", "name": "totalCost", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [],
        "name": "getContractOverview",
        "outputs": [{
          "components": [
            {"internalType": "uint256", "name": "totalUsers", "type": "uint256"},
            {"internalType": "uint256", "name": "totalVolume", "type": "uint256"},
            {"internalType": "uint256", "name": "activeUsers", "type": "uint256"},
            {"internalType": "uint256[]", "name": "levelDistribution", "type": "uint256[]"},
            {"internalType": "uint256[]", "name": "poolBalances", "type": "uint256[]"},
            {"internalType": "uint256", "name": "lastDistribution", "type": "uint256"},
            {"internalType": "uint256", "name": "contractBalance", "type": "uint256"}
          ],
          "internalType": "struct GlobalWayStats.ContractOverview", "name": "overview", "type": "tuple"
        }],
        "stateMutability": "view", "type": "function"
      }
    ];

    // ПОЛНЫЙ ABI GWT Token контракта
    this.gwtTokenABI = [
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [],
        "name": "currentPrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
        "name": "buyTokens", "outputs": [], "stateMutability": "payable", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
        "name": "sellTokens", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
        "name": "calculatePurchaseCost", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
        "name": "calculateSalePrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      }
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
  async freeRegistrationWithLevels(userAddress, maxLevel, fromAddress) {
    try {
      if (!this.isOwnerOrFounder(fromAddress)) {
        throw new Error('Only owner or founders can activate users for free');
      }
      
      return await this.contracts.globalWay.methods.activateFounderTeam(userAddress, this.founders[0], maxLevel).send({
        from: fromAddress,
        gas: 400000
      });
    } catch (error) {
      console.error('Free registration error:', error);
      throw this.handleContractError(error, 'free registration');
    }
  }

  async batchFreeRegistration(users, sponsor, maxLevel, fromAddress) {
    try {
      if (!this.isOwnerOrFounder(fromAddress)) {
        throw new Error('Only owner or founders can batch activate');
      }
      
      const sponsors = new Array(users.length).fill(sponsor);
      const levels = new Array(users.length).fill(maxLevel);
      
      return await this.contracts.globalWay.methods.batchActivateTeam(users, sponsors, levels).send({
        from: fromAddress,
        gas: 800000
      });
    } catch (error) {
      console.error('Batch registration error:', error);
      throw this.handleContractError(error, 'batch registration');
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

  // ==================== ЦЕНЫ И РАСЧЕТЫ ====================

  async getLevelPrice(level) {
    try {
      // Используем локальные цены для opBNB
      return this.levelPricesOpBNB[level] || '0';
    } catch (error) {
      console.error('Get level price error:', error);
      throw this.handleContractError(error, 'get level price');
    }
  }

  async calculateBulkPrice(maxLevel, userAddress = null) {
    try {
      let totalPrice = BigInt(0);
      
      if (userAddress) {
        // Учитываем уже активированные уровни
        for (let level = 1; level <= maxLevel; level++) {
          const isActive = await this.isLevelActive(userAddress, level);
          if (!isActive) {
            totalPrice += BigInt(this.levelPricesOpBNB[level]);
          }
        }
      } else {
        // Полная стоимость всех уровней
        for (let level = 1; level <= maxLevel; level++) {
          totalPrice += BigInt(this.levelPricesOpBNB[level]);
        }
      }
      
      return totalPrice.toString();
    } catch (error) {
      console.error('Calculate bulk price error:', error);
      throw this.handleContractError(error, 'calculate bulk price');
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
    return value;
  }

  fromWei(value) {
    if (window.web3Manager?.web3) {
      return window.web3Manager.web3.utils.fromWei(value.toString(), 'ether');
    }
    return value;
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
      
      return {
        isRegistered,
        sponsor: userData.sponsor,
        personalInvites: parseInt(userData.personalInvites),
        totalEarned: userData.totalEarned,
        leaderRank: parseInt(userData.leaderRank),
        activeLevels,
        totalActiveLevels: activeLevels.length,
        registrationTime: parseInt(userData.registrationTime),
        lastActivity: parseInt(userData.lastActivity)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
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

  async getUserEvents(userAddress, eventTypes = ['UserRegistered', 'LevelActivated']) {
    try {
      const allEvents = [];
      
      for (const eventType of eventTypes) {
        const events = await this.getEvents(eventType, 0, 'latest');
        const userEvents = events.filter(event => 
          event.returnValues.user?.toLowerCase() === userAddress.toLowerCase()
        );
        allEvents.push(...userEvents);
      }

      return allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (error) {
      console.error('Get user events error:', error);
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
      contractAddresses: this.contractAddresses
    };

    try {
      if (this.contracts.globalWay) {
        diagnosis.contractOwner = await this.getContractOwner();
        diagnosis.ownerMatch = diagnosis.contractOwner?.toLowerCase() === this.ownerMultisig.toLowerCase();
      }
    } catch (error) {
      diagnosis.contractError = error.message;
    }

    console.log('Contract diagnosis:', diagnosis);
    return diagnosis;
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
    const isOwner = window.contractManager.isOwner(window.web3Manager?.account || '');
    console.log('Contract owner:', owner);
    console.log('Current user is owner:', isOwner);
    return { owner, isOwner };
  },
  
  async diagnose() {
    return await window.contractManager.diagnoseContract();
  }
};

console.log('✅ ContractManager полностью инициализирован для opBNB сети');
console.log('🔧 Доступны утилиты отладки: window.debugContract');
