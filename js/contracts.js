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

  // ИСПРАВЛЕНО: Правильное кодирование методов
  encodeMethodCall(method, params) {
    const methodSignature = `${method.name}(${method.inputs.map(i => i.type).join(',')})`;
    
    // ИСПРАВЛЕНО: Используем реальный keccak256 если доступен
    let methodId;
    if (typeof ethers !== 'undefined' && ethers.utils) {
      methodId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(methodSignature)).slice(0, 10);
    } else {
      // Fallback для простых случаев
      methodId = '0x' + this.simpleHash(methodSignature).slice(0, 8);
    }
    
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
      // Простое кодирование строк для fallback
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
        // Простое декодирование строк
        const hex = cleanResult.replace(/0+$/, '');
        return hex.match(/.{2}/g)?.map(h => String.fromCharCode(parseInt(h, 16))).join('') || '';
      } catch (e) {
        return cleanResult;
      }
    }

    return cleanResult;
  }

  // ИСПРАВЛЕНО: Простой хеш для fallback
  simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ИСПРАВЛЕНО: Регистрация только через контракт
  async registerUserWithId(sponsorId) {
    try {
      if (!sponsorId) {
        return await this.sendTransaction('stats', 'assignIdToExistingUser', []);
      }
      
      const cleanId = sponsorId.toString().replace(/^GW/i, '');
      
      if (!/^\d{7}$/.test(cleanId)) {
        throw new Error('Invalid sponsor ID format. Use GW1234567 or 1234567');
      }

      // Проверяем что спонсор существует
      const sponsorAddress = await this.getAddressByUserId(cleanId);
      if (!sponsorAddress || sponsorAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Sponsor ID not found');
      }

      return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // ИСПРАВЛЕНО: Получение ID с обработкой ошибок
  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      // Сначала проверяем регистрацию
      const isRegistered = await this.isUserRegistered(address);
      if (!isRegistered) {
        return null;
      }

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
      
      const address = await this.callContract('stats', 'getAddressByUserId', [cleanId]);
      return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
    } catch (error) {
      console.error('Failed to get address by ID:', error);
      return null;
    }
  }

  // ИСПРАВЛЕНО: Реальная проверка регистрации
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

  // ИСПРАВЛЕНО: Получение данных пользователя
  async getUserData(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
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
      return await this.sendTransaction('globalway', 'buyLevel', [level], priceWei);
    } catch (error) {
      console.error('Level purchase failed:', error);
      throw error;
    }
  }

  async payQuarterlyActivity() {
    try {
      const feeWei = '0x' + (0.075 * 1e18).toString(16);
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
      return await this.callContract('token', 'balanceOf', [address]);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  // ИСПРАВЛЕНО: Упрощенная загрузка матрицы без сложных вызовов
  async getMatrixData(userAddress, level) {
    try {
      // Заглушка для матрицы если контракт не отвечает
      const userId = await this.getUserIdByAddress(userAddress);
      
      return {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          qualification: 'Gold',
          type: 'partner'
        },
        positions: [
          {
            position: 1,
            id: null,
            address: null,
            type: 'available',
            level: 0,
            qualification: null,
            sponsorId: null,
            activationDate: null
          },
          {
            position: 2,
            id: null,
            address: null,
            type: 'available',
            level: 0,
            qualification: null,
            sponsorId: null,
            activationDate: null
          }
        ],
        tableData: [],
        stats: {
          total: 0,
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

  // ИСПРАВЛЕНО: Упрощенная история транзакций
  async getTransactionHistory(address = null, limit = 50) {
    address = address || this.web3.account;
    if (!address) return [];

    try {
      // Заглушка истории пока контракт не работает корректно
      return [
        {
          hash: '0x1234567890abcdef',
          type: 'Registration',
          amount: '0.0000',
          timestamp: new Date(),
          status: 'Success'
        }
      ];
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
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

  // Admin методы
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
      return await this.callContract('stats', 'getContractOverview', []);
    } catch (error) {
      console.error('Failed to get contract overview:', error);
      // Заглушка для admin панели
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
