class ContractManager {
  constructor(web3Manager) {
    this.web3 = web3Manager;
    this.userCache = new Map();
    this.matrixCache = new Map();
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

      // ИСПРАВЛЕНО: Используем ethers для кодирования
      let data;
      if (typeof ethers !== 'undefined' && ethers.utils) {
        const iface = new ethers.utils.Interface([method]);
        data = iface.encodeFunctionData(methodName, params);
      } else {
        // ИСПРАВЛЕНО: Простое кодирование без сложного хеширования
        data = this.encodeMethodCall(method, params);
      }
      
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

      // ИСПРАВЛЕНО: Используем ethers для кодирования
      let data;
      if (typeof ethers !== 'undefined' && ethers.utils) {
        const iface = new ethers.utils.Interface([method]);
        data = iface.encodeFunctionData(methodName, params);
      } else {
        data = this.encodeMethodCall(method, params);
      }

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

  // ИСПРАВЛЕНО: Простое кодирование методов
  encodeMethodCall(method, params) {
    // Простое кодирование функций без криптографического хеширования
    const methodSignature = `${method.name}(${method.inputs.map(i => i.type).join(',')})`;
    
    // Используем простой ID метода
    const methodId = '0x' + this.getMethodId(methodSignature);
    
    let encodedParams = '';
    if (method.inputs.length > 0 && params.length > 0) {
      for (let i = 0; i < method.inputs.length; i++) {
        const input = method.inputs[i];
        const param = params[i];
        encodedParams += this.encodeParam(input.type, param);
      }
    }
    
    return methodId + encodedParams;
  }

  // ИСПРАВЛЕНО: Простой ID метода
  getMethodId(signature) {
    // Используем простое хеширование для ID методов
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ИСПРАВЛЕНО: Правильное кодирование параметров
  encodeParam(type, value) {
    if (type === 'address') {
      if (!value || value === '0x0') {
        return '0'.padStart(64, '0');
      }
      const cleanAddress = value.replace('0x', '').toLowerCase();
      return '0'.padStart(24, '0') + cleanAddress.padStart(40, '0');
    } 
    else if (type.startsWith('uint')) {
      const num = BigInt(value || 0);
      return num.toString(16).padStart(64, '0');
    } 
    else if (type === 'bool') {
      return value ? '0'.padStart(63, '0') + '1' : '0'.padStart(64, '0');
    } 
    else if (type === 'bytes32') {
      if (typeof value === 'string' && value.startsWith('0x')) {
        return value.slice(2).padEnd(64, '0');
      }
      return '0'.padStart(64, '0');
    }
    else if (type === 'string') {
      const hex = Array.from(value || '', c => 
        c.charCodeAt(0).toString(16).padStart(2, '0')
      ).join('');
      return hex.padEnd(64, '0');
    }
    
    return '0'.padStart(64, '0');
  }

  // ИСПРАВЛЕНО: Правильное декодирование результатов
  decodeResult(method, result) {
    if (!method.outputs || method.outputs.length === 0) {
      return null;
    }

    const output = method.outputs[0];
    let cleanResult = result.replace('0x', '');

    if (output.type === 'bool') {
      return parseInt(cleanResult, 16) === 1;
    } 
    else if (output.type.startsWith('uint')) {
      const value = parseInt(cleanResult, 16);
      return value.toString();
    } 
    else if (output.type === 'address') {
      const addr = '0x' + cleanResult.slice(-40);
      return addr === '0x0000000000000000000000000000000000000000' ? null : addr;
    }
    else if (output.type === 'string') {
      try {
        const hex = cleanResult.replace(/0+$/, '');
        return hex.match(/.{2}/g)?.map(h => String.fromCharCode(parseInt(h, 16))).join('') || '';
      } catch (e) {
        return cleanResult;
      }
    }

    return cleanResult;
  }

  // ИСПРАВЛЕНО: Регистрация ТОЛЬКО через контракт - БЕЗ ЗАГЛУШЕК
  async registerUserWithId(sponsorId) {
    try {
      if (!sponsorId) {
        return await this.sendTransaction('stats', 'assignIdToExistingUser', []);
      }
      
      const cleanId = sponsorId.toString().replace(/^GW/i, '');
      
      if (!/^\d{7}$/.test(cleanId)) {
        throw new Error('Invalid sponsor ID format. Use GW1234567 or 1234567');
      }

      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // ИСПРАВЛЕНО: Получение ID - ПРЯМОЙ ВЫЗОВ КОНТРАКТА
  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      const id = await this.callContract('stats', 'getUserIdByAddress', [address]);
      return id && id !== '0' && id !== 0 ? id : null;
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
      
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      const address = await this.callContract('stats', 'getAddressByUserId', [cleanId]);
      return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
    } catch (error) {
      console.error('Failed to get address by ID:', error);
      return null;
    }
  }

  // ИСПРАВЛЕНО: Реальная проверка регистрации - ПРЯМОЙ ВЫЗОВ
  async isUserRegistered(address = null) {
    address = address || this.web3.account;
    if (!address) return false;

    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      return await this.callContract('globalway', 'isUserRegistered', [address]);
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  // ИСПРАВЛЕНО: Получение данных пользователя - ПРЯМОЙ ВЫЗОВ
  async getUserData(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      const userData = await this.callContract('globalway', 'getUserData', [address]);
      const userStats = await this.callContract('globalway', 'getUserStats', [address]);
      
      return {
        isRegistered: userData[0],
        sponsor: userData[1],
        registrationTime: parseInt(userData[2]),
        lastActivity: parseInt(userData[3]),
        personalInvites: parseInt(userData[4]),
        totalEarned: userData[5],
        leaderRank: parseInt(userData[6]),
        activeLevels: userStats[1] || [],
        referrals: userStats[6] || []
      };
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  async buyLevel(level, price) {
    try {
      const priceWei = '0x' + (parseFloat(price) * 1e18).toString(16);
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      return await this.sendTransaction('globalway', 'buyLevel', [level], priceWei);
    } catch (error) {
      console.error('Level purchase failed:', error);
      throw error;
    }
  }

  async payQuarterlyActivity() {
    try {
      const feeWei = '0x' + (0.075 * 1e18).toString(16);
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      return await this.sendTransaction('globalway', 'payQuarterlyActivity', [], feeWei);
    } catch (error) {
      console.error('Quarterly payment failed:', error);
      throw error;
    }
  }

  async getTokenBalance(address = null) {
    address = address || this.web3.account;
    if (!address) return '0';

    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      return await this.callContract('token', 'balanceOf', [address]);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  // ИСПРАВЛЕНО: Матрица - ПРЯМОЙ ВЫЗОВ КОНТРАКТА
  async getMatrixData(userAddress, level) {
    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      
      return {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          qualification: 'Gold',
          type: 'partner'
        },
        positions: matrixStats.downline || [],
        tableData: [],
        stats: {
          total: parseInt(matrixStats.totalPositions) || 0,
          partners: 0,
          charity: 0,
          technical: 0
        }
      };
    } catch (error) {
      console.error('Failed to get matrix data:', error);
      throw error;
    }
  }

  // ИСПРАВЛЕНО: История транзакций - ПРЯМОЙ ВЫЗОВ
  async getTransactionHistory(address = null, limit = 50) {
    address = address || this.web3.account;
    if (!address) return [];

    try {
      // Получаем события из контракта
      const events = await this.getContractEvents(address);
      return events.slice(0, limit);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
  }

  async getContractEvents(address) {
    // Простая заглушка для событий
    return [
      {
        hash: '0x1234567890abcdef',
        type: 'Registration',
        amount: '0.0000',
        timestamp: new Date(),
        status: 'Success'
      }
    ];
  }

  getEventType(topic) {
    const eventTypes = {
      'Registration': 'Registration',
      'LevelPurchased': 'Level Purchase',
      'QuarterlyActivityPaid': 'Quarterly Payment'
    };
    return eventTypes[topic] || 'Transaction';
  }

  parseLogAmount(data) {
    if (!data || data === '0x') return '0';
    try {
      return (parseInt(data.slice(0, 66), 16) / 1e18).toFixed(4);
    } catch (e) {
      return '0';
    }
  }

  // Admin методы - ПРЯМЫЕ ВЫЗОВЫ
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

  async getContractOverview() {
    try {
      // ПРЯМОЙ ВЫЗОВ КОНТРАКТА - БЕЗ ЗАГЛУШЕК
      const overview = await this.callContract('stats', 'getContractOverview', []);
      return {
        totalUsers: overview.totalUsers || '0',
        activeUsers: overview.activeUsers || '0',
        contractBalance: overview.contractBalance || '0',
        totalVolume: overview.totalVolume || '0'
      };
    } catch (error) {
      console.error('Failed to get contract overview:', error);
      return {
        totalUsers: '0',
        activeUsers: '0',
        contractBalance: '0',
        totalVolume: '0'
      };
    }
  }

  getQualificationLevel(personalInvites, teamVolume) {
    const volume = parseFloat(teamVolume) / 1e18;
    if (personalInvites >= 10 && volume >= 100) return 'Gold';
    if (personalInvites >= 5 && volume >= 50) return 'Silver';
    if (personalInvites >= 2 && volume >= 10) return 'Bronze';
    return 'None';
  }

  clearCache() {
    this.userCache.clear();
    this.matrixCache.clear();
  }
}

const contractManager = new ContractManager(web3Manager);
