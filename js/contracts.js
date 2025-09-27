class ContractManager {
  constructor(web3Manager) {
    this.web3 = web3Manager;
    this.userCache = new Map();
    this.matrixCache = new Map();
    this.priceCache = new Map();
    this.cacheTimeout = 30000;
  }

  async callContract(contractName, methodName, params = []) {
    if (!this.web3.isConnected) {
      throw new Error('Wallet not connected');
    }

    const contract = this.web3.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not loaded`);
    }

    try {
      const method = contract.abi.find(item => 
        item.type === 'function' && item.name === methodName
      );

      if (!method) {
        throw new Error(`Method ${methodName} not found`);
      }

      // Используем Web3.js для кодирования
      if (typeof Web3 === 'undefined') {
        throw new Error('Web3 library required for contract interactions');
      }

      const web3Instance = new Web3();
      const data = web3Instance.eth.abi.encodeFunctionCall(method, params);
      
      const result = await this.web3.provider.request({
        method: 'eth_call',
        params: [{
          to: contract.address,
          data: data
        }, 'latest']
      });

      return this.decodeResult(method, result);
    } catch (error) {
      console.error(`Contract call failed: ${contractName}.${methodName}`, error);
      throw error;
    }
  }

  async sendTransaction(contractName, methodName, params = [], value = '0x0') {
    if (!this.web3.isConnected) {
      throw new Error('Wallet not connected');
    }

    const contract = this.web3.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not loaded`);
    }

    try {
      const method = contract.abi.find(item => 
        item.type === 'function' && item.name === methodName
      );

      if (!method) {
        throw new Error(`Method ${methodName} not found`);
      }

      if (typeof Web3 === 'undefined') {
        throw new Error('Web3 library required for contract interactions');
      }

      const web3Instance = new Web3();
      const data = web3Instance.eth.abi.encodeFunctionCall(method, params);

      const txHash = await this.web3.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.web3.account,
          to: contract.address,
          data: data,
          value: value
        }]
      });

      return txHash;
    } catch (error) {
      console.error(`Transaction failed: ${contractName}.${methodName}`, error);
      throw error;
    }
  }

  decodeResult(method, result) {
    if (!method.outputs || method.outputs.length === 0) {
      return null;
    }

    if (typeof Web3 === 'undefined') {
      throw new Error('Web3 library required for result decoding');
    }

    const web3Instance = new Web3();
    
    try {
      if (method.outputs.length === 1) {
        const decoded = web3Instance.eth.abi.decodeParameter(method.outputs[0].type, result);
        return decoded;
      } else {
        const types = method.outputs.map(output => output.type);
        const decoded = web3Instance.eth.abi.decodeParameters(types, result);
        
        // Преобразуем в объект с именами полей
        const resultObj = {};
        for (let i = 0; i < method.outputs.length; i++) {
          const output = method.outputs[i];
          if (output.name) {
            resultObj[output.name] = decoded[i];
          } else {
            resultObj[i] = decoded[i];
          }
        }
        return resultObj;
      }
    } catch (error) {
      console.error('Failed to decode result:', error);
      throw error;
    }
  }

  // РЕАЛЬНАЯ РЕГИСТРАЦИЯ ЧЕРЕЗ КОНТРАКТ
  async registerUserWithId(sponsorId) {
    try {
      if (!sponsorId) {
        // Получаем ID для уже зарегистрированного пользователя
        return await this.sendTransaction('stats', 'assignIdToExistingUser', []);
      }
      
      const cleanId = sponsorId.toString().replace(/^GW/i, '');
      
      if (!/^\d{7}$/.test(cleanId)) {
        throw new Error('Invalid sponsor ID format. Use GW1234567 or 1234567');
      }

      // Проверяем существует ли спонсор
      const sponsorAddress = await this.callContract('stats', 'getAddressByUserId', [cleanId]);
      if (!sponsorAddress || sponsorAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Sponsor ID not found');
      }

      // Регистрация с указанным спонсором
      return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // РЕАЛЬНОЕ ПОЛУЧЕНИЕ ID ЧЕРЕЗ КОНТРАКТ
  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      const id = await this.callContract('stats', 'getUserIdByAddress', [address]);
      return id && id !== '0' && id !== 0 ? id.toString() : null;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  }

  async getAddressByUserId(userId) {
    try {
      const cleanId = userId.toString().replace(/^GW/i, '');
      if (!/^\d{7}$/.test(cleanId)) {
        throw new Error('Invalid user ID format');
      }
      
      const address = await this.callContract('stats', 'getAddressByUserId', [cleanId]);
      return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
    } catch (error) {
      console.error('Failed to get address by ID:', error);
      return null;
    }
  }

  // РЕАЛЬНАЯ ПРОВЕРКА РЕГИСТРАЦИИ
  async isUserRegistered(address = null) {
    address = address || this.web3.account;
    if (!address) return false;

    try {
      return await this.callContract('globalway', 'isUserRegistered', [address]);
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  // РЕАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
  async getUserData(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    const cacheKey = `userData_${address}`;
    const cached = this.userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const userData = await this.callContract('globalway', 'getUserData', [address]);
      const userStats = await this.callContract('globalway', 'getUserStats', [address]);
      
      const data = {
        isRegistered: userData.isRegistered || userData[0],
        sponsor: userData.sponsor || userData[1],
        registrationTime: parseInt(userData.registrationTime || userData[2]),
        lastActivity: parseInt(userData.lastActivity || userData[3]),
        personalInvites: parseInt(userData.personalInvites || userData[4]),
        totalEarned: userData.totalEarned || userData[5],
        leaderRank: parseInt(userData.leaderRank || userData[6]),
        activeLevels: userStats.activeLevels || userStats[1] || [],
        referrals: userStats.referrals || userStats[6] || []
      };
      
      this.userCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // РЕАЛЬНАЯ ПОКУПКА УРОВНЯ
  async buyLevel(level, customPrice = null) {
    try {
      // Проверяем регистрацию
      const isRegistered = await this.isUserRegistered();
      if (!isRegistered) {
        throw new Error('User must be registered first');
      }

      // Проверяем предыдущие уровни
      for (let i = 1; i < level; i++) {
        const isActive = await this.callContract('globalway', 'userLevels', [this.web3.account, i]);
        if (!isActive) {
          throw new Error(`Level ${i} must be activated first`);
        }
      }

      // Получаем цену из контракта
      let price;
      if (customPrice) {
        price = customPrice;
      } else {
        const contractPrice = await this.callContract('globalway', 'levelPrices', [level]);
        price = contractPrice;
      }

      const priceWei = typeof price === 'string' ? price : '0x' + (BigInt(price) * BigInt(1e18)).toString(16);
      
      return await this.sendTransaction('globalway', 'buyLevel', [level], priceWei);
    } catch (error) {
      console.error('Level purchase failed:', error);
      throw error;
    }
  }

  // РЕАЛЬНАЯ МАССОВАЯ ПОКУПКА
  async buyLevelsBulk(maxLevel) {
    try {
      const isRegistered = await this.isUserRegistered();
      if (!isRegistered) {
        throw new Error('User must be registered first');
      }

      // Рассчитываем цену через контракт
      const totalPrice = await this.callContract('globalway', 'calculateBulkPrice', [maxLevel]);
      
      return await this.sendTransaction('globalway', 'buyLevelsBulk', [maxLevel], totalPrice);
    } catch (error) {
      console.error('Bulk purchase failed:', error);
      throw error;
    }
  }

  // РЕАЛЬНАЯ КВАРТАЛЬНАЯ ОПЛАТА
  async payQuarterlyActivity() {
    try {
      const fee = await this.callContract('globalway', 'QUARTERLY_FEE', []);
      return await this.sendTransaction('globalway', 'payQuarterlyActivity', [], fee);
    } catch (error) {
      console.error('Quarterly payment failed:', error);
      throw error;
    }
  }

  // РЕАЛЬНЫЙ БАЛАНС ТОКЕНОВ
  async getTokenBalance(address = null) {
    address = address || this.web3.account;
    if (!address) return '0';

    try {
      return await this.callContract('token', 'balanceOf', [address]);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  // РЕАЛЬНЫЕ ДАННЫЕ МАТРИЦЫ
  async getMatrixData(userAddress, level) {
    const cacheKey = `matrix_${userAddress}_${level}`;
    const cached = this.matrixCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Получаем данные матрицы из контракта
      const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      const userData = await this.getUserData(userAddress);
      
      // Строим позиции матрицы
      const positions = [];
      if (matrixStats.downline && Array.isArray(matrixStats.downline)) {
        for (let i = 0; i < Math.min(matrixStats.downline.length, 6); i++) {
          const addr = matrixStats.downline[i];
          if (addr && addr !== '0x0000000000000000000000000000000000000000') {
            const posUserId = await this.getUserIdByAddress(addr);
            const posUserData = await this.getUserData(addr);
            
            positions.push({
              id: posUserId ? `GW${posUserId}` : 'Empty',
              address: addr,
              level: level,
              qualification: this.getQualificationLevel(posUserData?.personalInvites || 0, posUserData?.totalEarned || '0'),
              type: 'partner',
              sponsorId: posUserData?.sponsor ? await this.getUserIdByAddress(posUserData.sponsor) : null
            });
          } else {
            positions.push({
              id: 'Empty',
              address: null,
              level: level,
              qualification: 'None',
              type: 'available'
            });
          }
        }
      }

      // Дополняем пустыми позициями
      while (positions.length < 6) {
        positions.push({
          id: 'Empty',
          address: null,
          level: level,
          qualification: 'None',
          type: 'available'
        });
      }

      // Получаем партнеров для таблицы
      const tableData = [];
      if (userData?.referrals) {
        for (let i = 0; i < userData.referrals.length; i++) {
          const partnerAddr = userData.referrals[i];
          const isLevelActive = await this.callContract('globalway', 'userLevels', [partnerAddr, level]);
          
          if (isLevelActive) {
            const partnerId = await this.getUserIdByAddress(partnerAddr);
            const partnerData = await this.getUserData(partnerAddr);
            
            tableData.push({
              number: tableData.length + 1,
              id: partnerId ? `GW${partnerId}` : 'GW0000000',
              address: partnerAddr,
              sponsorId: userId ? `GW${userId}` : 'GW0000000',
              activationDate: new Date(partnerData.registrationTime * 1000),
              level: level,
              qualification: this.getQualificationLevel(partnerData.personalInvites, partnerData.totalEarned)
            });
          }
        }
      }

      const data = {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          qualification: this.getQualificationLevel(userData?.personalInvites || 0, userData?.totalEarned || '0'),
          type: 'partner'
        },
        positions: positions,
        tableData: tableData,
        stats: {
          total: parseInt(matrixStats.totalPositions) || tableData.length,
          partners: tableData.filter(p => p.qualification !== 'None').length,
          charity: 0,
          technical: 0
        }
      };

      this.matrixCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to get matrix data:', error);
      throw error;
    }
  }

  // История транзакций требует внешнего сервиса индексации
  async getTransactionHistory(address = null, limit = 50) {
    address = address || this.web3.account;
    if (!address) return [];

    try {
      // Для получения истории транзакций нужен индексированный API (The Graph, Moralis, etc)
      console.warn('Transaction history requires blockchain indexer service');
      return [];
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
  }

  // РЕАЛЬНЫЙ ОБЗОР КОНТРАКТА
  async getContractOverview() {
    try {
      const overview = await this.callContract('stats', 'getContractOverview', []);
      return {
        totalUsers: overview.totalUsers || overview[0] || '0',
        activeUsers: overview.activeUsers || overview[2] || '0', 
        contractBalance: overview.contractBalance || overview[6] || '0',
        totalVolume: overview.totalVolume || overview[1] || '0',
        levelDistribution: overview.levelDistribution || overview[3] || [],
        poolBalances: overview.poolBalances || overview[4] || []
      };
    } catch (error) {
      console.error('Failed to get contract overview:', error);
      return {
        totalUsers: '0',
        activeUsers: '0',
        contractBalance: '0',
        totalVolume: '0',
        levelDistribution: [],
        poolBalances: []
      };
    }
  }

  // РЕАЛЬНЫЕ ДАННЫЕ О ДОХОДАХ
  async getEarningsBreakdown(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      const earnings = await this.callContract('stats', 'getEarningsBreakdown', [address]);
      return {
        totalEarned: earnings.totalEarned || earnings[0] || '0',
        personalBonus: earnings.personalBonus || earnings[1] || '0',
        referralBonus: earnings.referralBonus || earnings[2] || '0',
        matrixBonus: earnings.matrixBonus || earnings[3] || '0',
        leaderBonus: earnings.leaderBonus || earnings[4] || '0',
        investmentReturns: earnings.investmentReturns || earnings[5] || '0',
        frozenByLevel: earnings.frozenByLevel || earnings[6] || []
      };
    } catch (error) {
      console.error('Failed to get earnings breakdown:', error);
      return null;
    }
  }

  // ADMIN МЕТОДЫ
  async freeActivateUser(userAddress, maxLevel) {
    try {
      return await this.sendTransaction('globalway', 'freeRegistrationWithLevels', [userAddress, maxLevel]);
    } catch (error) {
      console.error('Free activation failed:', error);
      throw error;
    }
  }

  async batchActivateTeam(users, sponsor, maxLevel) {
    try {
      return await this.sendTransaction('globalway', 'batchFreeRegistration', [users, sponsor, maxLevel]);
    } catch (error) {
      console.error('Batch activation failed:', error);
      throw error;
    }
  }

  getQualificationLevel(personalInvites, teamVolume) {
    const invites = parseInt(personalInvites) || 0;
    const volume = BigInt(teamVolume || 0) / BigInt(1e18);
    
    if (invites >= 10 && volume >= BigInt(100)) return 'Platinum';
    if (invites >= 10 && volume >= BigInt(50)) return 'Gold';
    if (invites >= 5 && volume >= BigInt(25)) return 'Silver';
    if (invites >= 2 && volume >= BigInt(10)) return 'Bronze';
    return 'None';
  }

  clearCache() {
    this.userCache.clear();
    this.matrixCache.clear();
    this.priceCache.clear();
  }
}

const contractManager = new ContractManager(web3Manager);
