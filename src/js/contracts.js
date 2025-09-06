// ==================== КОНТРАКТЫ ====================

class ContractManager {
  constructor() {
    this.contracts = {};
    this.contractAddresses = {
      globalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
      globalWayStats: '0x20B923c5cbcdc51D0233Da5017b7554CBfB76dF0',
      gwtToken: '0xd9145CCE52D386f254917e481eB44e9943F39138'
    };
    
    // ИСПРАВЛЕНО: Упрощенная ABI без проблемных методов
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
        "inputs": [],
        "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}, {"internalType": "uint8", "name": "maxLevel", "type": "uint8"}],
        "name": "freeRegistrationWithLevels", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      {
        "inputs": [{"internalType": "address[]", "name": "users", "type": "address[]"}, {"internalType": "address", "name": "sponsor", "type": "address"}, {"internalType": "uint8", "name": "maxLevel", "type": "uint8"}],
        "name": "batchFreeRegistration", "outputs": [], "stateMutability": "nonpayable", "type": "function"
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
          {"internalType": "uint256", "name": "quarterlyCounter", "type": "uint256"}
        ],
        "stateMutability": "view", "type": "function"
      }
    ];

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
        "name": "getCurrentPrice", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
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
        // ИСПРАВЛЕНО: Проверяем что Web3Manager готов И web3 инициализирован
        if (window.web3Manager && window.web3Manager.isInitialized) {
          console.log('✅ Web3Manager готов для контрактов');
          resolve();
        } else {
          console.log('⏳ Ожидание Web3Manager...');
          setTimeout(checkWeb3, 500); // Увеличил интервал
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
        console.warn('❌ Web3Manager не готов после 10 попыток, работаем без контрактов');
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
      
      console.log('Contracts initialized successfully');
    } catch (error) {
      console.error('Error initializing contracts:', error);
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

  // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

  async register(sponsor, fromAddress) {
    try {
      if (!this.contracts.globalWay) {
        throw new Error('Контракт не инициализирован');
      }
      return await this.contracts.globalWay.methods.register(sponsor).send({
        from: fromAddress
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async buyLevel(level, fromAddress, value) {
    try {
      if (!this.contracts.globalWay) {
        throw new Error('Контракт не инициализирован');
      }
      return await this.contracts.globalWay.methods.buyLevel(level).send({
        from: fromAddress,
        value: value
      });
    } catch (error) {
      console.error('Buy level error:', error);
      throw error;
    }
  }

  async activatePackage(packageType, fromAddress, value) {
    try {
      if (!this.contracts.globalWay) {
        throw new Error('Контракт не инициализирован');
      }
      return await this.contracts.globalWay.methods.activatePackage(packageType).send({
        from: fromAddress,
        value: value
      });
    } catch (error) {
      console.error('Activate package error:', error);
      throw error;
    }
  }

  // ИСПРАВЛЕНО: Удален проблемный метод квартальной активности
  async getQuarterlyFee() {
    // Возвращаем фиксированную стоимость вместо вызова контракта
    return window.web3Manager.web3.utils.toWei('0.001', 'ether'); // 0.001 opBNB
  }

  async payQuarterlyActivity(fromAddress, value) {
    // Заглушка для квартальной активности
    console.warn('Квартальная активность будет добавлена в следующем обновлении контракта');
    throw new Error('Функция квартальной активности временно недоступна');
  }

  async freeRegistrationWithLevels(userAddress, maxLevel, fromAddress) {
    try {
      if (!this.contracts.globalWay) {
        throw new Error('Контракт не инициализирован');
      }
      return await this.contracts.globalWay.methods.freeRegistrationWithLevels(userAddress, maxLevel).send({
        from: fromAddress
      });
    } catch (error) {
      console.error('Free registration error:', error);
      throw error;
    }
  }

  async batchFreeRegistration(users, sponsor, maxLevel, fromAddress) {
    try {
      if (!this.contracts.globalWay) {
        throw new Error('Контракт не инициализирован');
      }
      return await this.contracts.globalWay.methods.batchFreeRegistration(users, sponsor, maxLevel).send({
        from: fromAddress
      });
    } catch (error) {
      console.error('Batch registration error:', error);
      throw error;
    }
  }

  // ==================== СТАТИСТИКА ====================

  async getUserFullInfo(userAddress) {
    try {
      if (!this.contracts.globalWayStats) {
        throw new Error('Контракт статистики не инициализирован');
      }
      return await this.contracts.globalWayStats.methods.getUserFullInfo(userAddress).call();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  }

  async getPackagePrice(userAddress, packageType) {
    try {
      if (!this.contracts.globalWayStats) {
        throw new Error('Контракт статистики не инициализирован');
      }
      return await this.contracts.globalWayStats.methods.getPackagePrice(userAddress, packageType).call();
    } catch (error) {
      console.error('Get package price error:', error);
      throw error;
    }
  }

  async getContractOverview() {
    try {
      if (!this.contracts.globalWayStats) {
        throw new Error('Контракт статистики не инициализирован');
      }
      return await this.contracts.globalWayStats.methods.getContractOverview().call();
    } catch (error) {
      console.error('Get contract overview error:', error);
      throw error;
    }
  }

  // ==================== ПРОВЕРКИ ====================

  async isUserRegistered(userAddress) {
    try {
      if (!this.contracts.globalWay) {
        return false;
      }
      return await this.contracts.globalWay.methods.isUserRegistered(userAddress).call();
    } catch (error) {
      console.error('Check registration error:', error);
      return false;
    }
  }

  async isUserActive(userAddress) {
    try {
      if (!this.contracts.globalWay) {
        return false;
      }
      return await this.contracts.globalWay.methods.isUserActive(userAddress).call();
    } catch (error) {
      console.error('Check active error:', error);
      return false;
    }
  }

  async isLevelActive(userAddress, level) {
    try {
      if (!this.contracts.globalWay) {
        return false;
      }
      return await this.contracts.globalWay.methods.isLevelActive(userAddress, level).call();
    } catch (error) {
      console.error('Check level active error:', error);
      return false;
    }
  }

  // ==================== ЦЕНЫ ====================

  async getLevelPrice(level) {
    try {
      if (!this.contracts.globalWay) {
        // ИСПРАВЛЕНО: Возвращаем фронтенд цены для opBNB если контракт недоступен
        const prices = {
          1: window.web3Manager.web3.utils.toWei('0.00015', 'ether'),
          2: window.web3Manager.web3.utils.toWei('0.0003', 'ether'),
          3: window.web3Manager.web3.utils.toWei('0.0006', 'ether'),
          4: window.web3Manager.web3.utils.toWei('0.00225', 'ether'),
          5: window.web3Manager.web3.utils.toWei('0.0045', 'ether'),
          6: window.web3Manager.web3.utils.toWei('0.009', 'ether'),
          7: window.web3Manager.web3.utils.toWei('0.018', 'ether'),
          8: window.web3Manager.web3.utils.toWei('0.036', 'ether'),
          9: window.web3Manager.web3.utils.toWei('0.072', 'ether'),
          10: window.web3Manager.web3.utils.toWei('0.144', 'ether'),
          11: window.web3Manager.web3.utils.toWei('0.288', 'ether'),
          12: window.web3Manager.web3.utils.toWei('0.576', 'ether')
        };
        return prices[level] || '0';
      }
      return await this.contracts.globalWay.methods.levelPrices(level).call();
    } catch (error) {
      console.error('Get level price error:', error);
      throw error;
    }
  }

  async calculateBulkPrice(maxLevel) {
    try {
      if (!this.contracts.globalWay) {
        // ИСПРАВЛЕНО: Рассчитываем стоимость пакета на фронтенде
        let totalPrice = 0;
        for (let i = 1; i <= maxLevel; i++) {
          const levelPrice = await this.getLevelPrice(i);
          totalPrice += parseFloat(window.web3Manager.web3.utils.fromWei(levelPrice, 'ether'));
        }
        return window.web3Manager.web3.utils.toWei(totalPrice.toString(), 'ether');
      }
      return await this.contracts.globalWay.methods.calculateBulkPrice(maxLevel).call();
    } catch (error) {
      console.error('Calculate bulk price error:', error);
      throw error;
    }
  }

  // ==================== ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ ====================

  async getUserData(userAddress) {
    try {
      if (!this.contracts.globalWay) {
        // ИСПРАВЛЕНО: Возвращаем демо данные если контракт недоступен
        return {
          isRegistered: false,
          sponsor: '0x0000000000000000000000000000000000000000',
          registrationTime: 0,
          lastActivity: 0,
          personalInvites: 0,
          totalEarned: '0',
          leaderRank: 0,
          leaderBonusClaimed: false,
          quarterlyCounter: 0
        };
      }
      return await this.contracts.globalWay.methods.users(userAddress).call();
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  }

  // ==================== GWT TOKEN МЕТОДЫ ====================

  async getTokenBalance(userAddress) {
    try {
      if (!this.contracts.gwtToken) {
        return '0';
      }
      return await this.contracts.gwtToken.methods.balanceOf(userAddress).call();
    } catch (error) {
      console.error('Get token balance error:', error);
      return '0';
    }
  }

  async getTokenTotalSupply() {
    try {
      if (!this.contracts.gwtToken) {
        return window.web3Manager.web3.utils.toWei('1000000', 'ether'); // 1M токенов демо
      }
      return await this.contracts.gwtToken.methods.totalSupply().call();
    } catch (error) {
      console.error('Get token total supply error:', error);
      return '0';
    }
  }

  async getTokenCurrentPrice() {
    try {
      if (!this.contracts.gwtToken) {
        return window.web3Manager.web3.utils.toWei('0.01', 'ether'); // $0.01 демо цена
      }
      return await this.contracts.gwtToken.methods.getCurrentPrice().call();
    } catch (error) {
      console.error('Get token price error:', error);
      return '0';
    }
  }

  async transferToken(to, amount, fromAddress) {
    try {
      if (!this.contracts.gwtToken) {
        throw new Error('Токен контракт не инициализирован');
      }
      return await this.contracts.gwtToken.methods.transfer(to, amount).send({
        from: fromAddress
      });
    } catch (error) {
      console.error('Transfer token error:', error);
      throw error;
    }
  }
}

// Глобальная инициализация
window.contractManager = new ContractManager();

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContractManager;
}
