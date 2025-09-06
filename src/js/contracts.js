// ==================== КОНТРАКТЫ ====================

class ContractManager {
  constructor() {
    this.contracts = {};
    this.contractAddresses = {
      globalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
      globalWayStats: '0x20B923c5cbcdc51D0233Da5017b7554CBfB76dF0',
      gwtToken: '0xd9145CCE52D386f254917e481eB44e9943F39138'
    };
    
    // ИСПРАВЛЕНО: Правильные цены для opBNB (в wei)
    this.levelPricesOpBNB = {
      1: '562500000000000', // 0.0005625 opBNB
      2: '1125000000000000', // 0.001125 opBNB  
      3: '2250000000000000', // 0.00225 opBNB
      4: '4500000000000000', // 0.0045 opBNB
      5: '9000000000000000', // 0.009 opBNB
      6: '18000000000000000', // 0.018 opBNB
      7: '36000000000000000', // 0.036 opBNB
      8: '72000000000000000', // 0.072 opBNB
      9: '144000000000000000', // 0.144 opBNB
      10: '288000000000000000', // 0.288 opBNB
      11: '576000000000000000', // 0.576 opBNB
      12: '1152000000000000000' // 1.152 opBNB
    };
    
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
        "inputs": [],
        "name": "QUARTERLY_FEE", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view", "type": "function"
      },
      {
        "inputs": [],
        "name": "payQuarterlyActivity", "outputs": [], "stateMutability": "payable", "type": "function"
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
        console.warn('⌀ Web3Manager не готов после 10 попыток, работаем без контрактов');
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
      return await this.contracts.globalWay.methods.activatePackage(packageType).send({
        from: fromAddress,
        value: value
      });
    } catch (error) {
      console.error('Activate package error:', error);
      throw error;
    }
  }

  async payQuarterlyActivity(fromAddress, value) {
    try {
      return await this.contracts.globalWay.methods.payQuarterlyActivity().send({
        from: fromAddress,
        value: value
      });
    } catch (error) {
      console.error('Pay quarterly error:', error);
      throw error;
    }
  }

  async freeRegistrationWithLevels(userAddress, maxLevel, fromAddress) {
    try {
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
      return await this.contracts.globalWayStats.methods.getUserFullInfo(userAddress).call();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  }

  async getPackagePrice(userAddress, packageType) {
    try {
      // ИСПРАВЛЕНО: Правильный расчет цены пакета с учетом уже активированных уровней
      const userInfo = await this.getUserFullInfo(userAddress);
      const activeLevels = userInfo.activeLevels || [];
      
      const packageLevels = {
        1: [1, 2, 3, 4], // MiniAdmin (1-4)
        2: [1, 2, 3, 4, 5, 6, 7], // Admin (1-7)
        3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // SuperAdmin (1-10)
        4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Manager (1-12)
      };

      const targetLevels = packageLevels[packageType];
      const levelsToActivate = targetLevels.filter(level => !activeLevels.includes(level));
      
      let totalPrice = '0';
      for (const level of levelsToActivate) {
        const levelPrice = this.levelPricesOpBNB[level];
        totalPrice = (BigInt(totalPrice) + BigInt(levelPrice)).toString();
      }
      
      return totalPrice;
    } catch (error) {
      console.error('Get package price error:', error);
      throw error;
    }
  }

  async getContractOverview() {
    try {
      return await this.contracts.globalWayStats.methods.getContractOverview().call();
    } catch (error) {
      console.error('Get contract overview error:', error);
      throw error;
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

  // ==================== ЦЕНЫ ====================

  async getLevelPrice(level) {
    try {
      // ИСПРАВЛЕНО: Возвращаем правильные цены для opBNB
      return this.levelPricesOpBNB[level] || '0';
    } catch (error) {
      console.error('Get level price error:', error);
      throw error;
    }
  }

  async calculateBulkPrice(maxLevel, userAddress = null) {
    try {
      let totalPrice = '0';
      
      if (userAddress) {
        // Учитываем уже активированные уровни
        const userInfo = await this.getUserFullInfo(userAddress);
        const activeLevels = userInfo.activeLevels || [];
        
        for (let level = 1; level <= maxLevel; level++) {
          if (!activeLevels.includes(level)) {
            const levelPrice = this.levelPricesOpBNB[level];
            totalPrice = (BigInt(totalPrice) + BigInt(levelPrice)).toString();
          }
        }
      } else {
        // Полная стоимость всех уровней
        for (let level = 1; level <= maxLevel; level++) {
          const levelPrice = this.levelPricesOpBNB[level];
          totalPrice = (BigInt(totalPrice) + BigInt(levelPrice)).toString();
        }
      }
      
      return totalPrice;
    } catch (error) {
      console.error('Calculate bulk price error:', error);
      throw error;
    }
  }

  async getQuarterlyFee() {
    try {
      // ИСПРАВЛЕНО: Возвращаем фиксированную квартальную плату для opBNB
      return '2250000000000000'; // 0.00225 opBNB
    } catch (error) {
      console.error('Get quarterly fee error:', error);
      throw error;
    }
  }

  // ==================== ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ ====================

  async getUserData(userAddress) {
    try {
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
      return '1000000000000000000000000';
    }
    
    const supply = await this.contracts.gwtToken.methods.totalSupply().call();
    return supply;
  } catch (error) {
    console.error('Get token total supply error:', error);
    return '1000000000000000000000000';
  }
}

async getTokenCurrentPrice() {
  try {
    if (!this.contracts.gwtToken) {
      console.warn('GWT Token contract not initialized');
      return '10000000000000000';
    }
    
    const price = await this.contracts.gwtToken.methods.getCurrentPrice().call();
    return price;
  } catch (error) {
    console.error('Get token price error:', error);
    return '10000000000000000';
  }
}

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  reinitializeContracts() {
    console.log('🔄 Переинициализация контрактов для новой сети...');
    this.setupContracts();
  }

  // Получение информации о пакетах
  getPackageInfo(packageType) {
    const packageData = {
      1: {
        name: 'MiniAdmin',
        levels: [1, 2, 3, 4],
        description: 'Уровни 1-4'
      },
      2: {
        name: 'Admin',
        levels: [1, 2, 3, 4, 5, 6, 7],
        description: 'Уровни 1-7'
      },
      3: {
        name: 'SuperAdmin',
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        description: 'Уровни 1-10'
      },
      4: {
        name: 'Manager',
        levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        description: 'Уровни 1-12'
      }
    };

    return packageData[packageType] || null;
  }

  // Проверка доступности контрактов
  isContractsReady() {
    return !!(this.contracts.globalWay && this.contracts.globalWayStats && this.contracts.gwtToken);
  }

  // Получение текущей сети
  getCurrentNetwork() {
    return window.web3Manager?.getNetworkId() || null;
  }

  // Форматирование адреса
  formatAddress(address) {
    if (!address) return '0x000...000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Проверка валидности адреса
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Конвертация в Wei
  toWei(value) {
    if (window.web3Manager?.web3) {
      return window.web3Manager.web3.utils.toWei(value.toString(), 'ether');
    }
    return value;
  }

  // Конвертация из Wei
  fromWei(value) {
    if (window.web3Manager?.web3) {
      return window.web3Manager.web3.utils.fromWei(value.toString(), 'ether');
    }
    return value;
  }

  // Обработка ошибок контрактов
  handleContractError(error, operation = 'contract operation') {
    console.error(`Contract error during ${operation}:`, error);
    
    let message = `Ошибка при ${operation}`;
    
    if (error.message?.includes('User denied')) {
      message = 'Транзакция отклонена пользователем';
    } else if (error.message?.includes('insufficient funds')) {
      message = 'Недостаточно средств для выполнения операции';
    } else if (error.message?.includes('execution reverted')) {
      message = 'Транзакция отклонена смарт-контрактом';
    } else if (error.message?.includes('network')) {
      message = 'Ошибка сети. Проверьте подключение';
    }
    
    return new Error(message);
  }

  // Получение газа для транзакции
  async estimateGas(method, fromAddress, value = '0') {
    try {
      const gasEstimate = await method.estimateGas({
        from: fromAddress,
        value: value
      });
      
      return Math.floor(gasEstimate * 1.2); // +20% запас
    } catch (error) {
      console.warn('Не удалось оценить газ:', error);
      return 300000; // Дефолтное значение
    }
  }

  // Мониторинг транзакций
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

  // Очистка ресурсов
  destroy() {
    this.contracts = {};
    console.log('ContractManager destroyed');
  }
}

// Глобальная инициализация
window.contractManager = new ContractManager();

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContractManager;
}
