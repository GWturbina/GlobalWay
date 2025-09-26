class ContractManager {
  constructor(web3Manager) {
    this.web3 = web3Manager;
    this.userCache = new Map();
    this.matrixCache = new Map();
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

      const data = this.encodeMethodCall(method, params);
      
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

      const data = this.encodeMethodCall(method, params);

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

  encodeMethodCall(method, params) {
    const methodSignature = `${method.name}(${method.inputs.map(i => i.type).join(',')})`;
    const methodId = this.web3Keccak256(methodSignature).slice(0, 10);
    
    let encodedParams = '';
    method.inputs.forEach((input, index) => {
      encodedParams += this.encodeParam(input.type, params[index] || '');
    });
    
    return methodId + encodedParams;
  }

  encodeParam(type, value) {
    if (type === 'address') {
      return value.replace('0x', '').padStart(64, '0');
    } else if (type.startsWith('uint')) {
      return BigInt(value || 0).toString(16).padStart(64, '0');
    } else if (type === 'bool') {
      return value ? '1'.padStart(64, '0') : '0'.padStart(64, '0');
    }
    return '0'.padStart(64, '0');
  }

  decodeResult(method, result) {
    if (!method.outputs || method.outputs.length === 0) {
      return null;
    }

    const output = method.outputs[0];
    const cleanResult = result.replace('0x', '');

    if (output.type === 'bool') {
      return parseInt(cleanResult, 16) === 1;
    } else if (output.type.startsWith('uint')) {
      return parseInt(cleanResult, 16).toString();
    } else if (output.type === 'address') {
      return '0x' + cleanResult.slice(-40);
    }

    return cleanResult;
  }

  // Используем встроенную функцию web3 для keccak256
  web3Keccak256(text) {
    // Попробуем использовать ethers.js если он доступен в глобальной области
    if (typeof ethers !== 'undefined' && ethers.utils) {
      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(text));
    }
    
    // Если ethers недоступен, используем Web3.js
    if (typeof Web3 !== 'undefined' && Web3.utils) {
      return Web3.utils.keccak256(text);
    }
    
    // Fallback - используем простой хеш (НЕ для продакшена!)
    console.warn('Using simplified hash - not cryptographically secure!');
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }

  // Регистрация по ID
  async registerUserWithId(sponsorId) {
    if (!sponsorId) {
      // Регистрация без спонсора - случайное назначение
      return await this.sendTransaction('stats', 'assignIdToExistingUser', []);
    }
    
    // Очищаем ID от префикса GW если есть
    const cleanId = sponsorId.toString().replace(/^GW/i, '');
    
    if (!/^\d{7}$/.test(cleanId)) {
      throw new Error('Invalid sponsor ID format. Use GW1234567 or 1234567');
    }

    return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
  }

  // Contract-specific methods
  async isUserRegistered(address = null) {
    address = address || this.web3.account;
    if (!address) return false;

    try {
      return await this.callContract('globalway', 'isUserRegistered', [address]);
    } catch (error) {
      return false;
    }
  }

  async getUserData(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    const cacheKey = `userData_${address}`;
    if (this.userCache.has(cacheKey)) {
      return this.userCache.get(cacheKey);
    }

    try {
      const data = await this.callContract('globalway', 'getUserData', [address]);
      
      // Парсим активные уровни из контракта
      const activeLevels = [];
      for (let i = 1; i <= 12; i++) {
        const isActive = await this.callContract('globalway', 'isLevelActive', [address, i]);
        if (isActive) activeLevels.push(i);
      }
      
      const parsedData = {
        isRegistered: data.isRegistered,
        sponsor: data.sponsor,
        registrationTime: parseInt(data.registrationTime),
        lastActivity: parseInt(data.lastActivity),
        personalInvites: parseInt(data.personalInvites),
        totalEarned: data.totalEarned,
        leaderRank: parseInt(data.leaderRank),
        quarterlyCounter: parseInt(data.quarterlyCounter || 0),
        activeLevels: activeLevels
      };
      
      this.userCache.set(cacheKey, parsedData);
      return parsedData;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  async registerUser(sponsorAddress) {
    console.warn('registerUser deprecated, use registerUserWithId instead');
    if (!sponsorAddress) {
      throw new Error('Sponsor address required');
    }

    return await this.sendTransaction('globalway', 'register', [sponsorAddress]);
  }

  async buyLevel(level, price) {
    const priceWei = (parseFloat(price) * 1e18).toString(16);
    return await this.sendTransaction('globalway', 'buyLevel', [level], '0x' + priceWei);
  }

  async payQuarterlyActivity() {
    const feeWei = (0.075 * 1e18).toString(16);
    return await this.sendTransaction('globalway', 'payQuarterlyActivity', [], '0x' + feeWei);
  }

  async getTokenBalance(address = null) {
    address = address || this.web3.account;
    if (!address) return '0';

    try {
      return await this.callContract('token', 'balanceOf', [address]);
    } catch (error) {
      return '0';
    }
  }

  // Методы для работы с ID
async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      // Сначала проверяем регистрацию
      const isRegistered = await this.isUserRegistered(address);
      if (!isRegistered) {
        return null; // Не вызываем контракт если не зарегистрирован
      }
    
      const id = await this.callContract('stats', 'getUserIdByAddress', [address]);
      return id || null;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  }

  async getAddressByUserId(userId) {
    try {
      // Remove GW prefix if present
      const cleanId = userId.replace(/^GW/i, '');
      return await this.callContract('stats', 'getAddressByUserId', [cleanId]);
    } catch (error) {
      console.error('Failed to get address by ID:', error);
      return null;
    }
  }

  async assignIdByOwner(userAddress) {
    try {
      return await this.sendTransaction('stats', 'assignIdByOwner', [userAddress]);
    } catch (error) {
      console.error('Failed to assign ID:', error);
      throw error;
    }
  }

  // Matrix Methods с реальными вызовами контракта
  async getMatrixData(userAddress, level) {
    const cacheKey = `matrix_${userAddress}_${level}`;
    if (this.matrixCache.has(cacheKey)) {
      return this.matrixCache.get(cacheKey);
    }

    try {
      const stats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      
      // Получаем позиции матрицы
      const positions = [];
      for (let i = 1; i <= 6; i++) {
        try {
          const posAddress = await this.callContract('globalway', 'getUserByMatrixPosition', [level, i]);
          if (posAddress && posAddress !== '0x0000000000000000000000000000000000000000') {
            const posUserId = await this.getUserIdByAddress(posAddress);
            const posUserData = await this.getUserData(posAddress);
            const posType = await this.getMatrixPositionType(userAddress, level, i);
            
            positions.push({
              position: i,
              id: posUserId ? `GW${posUserId}` : null,
              address: posAddress,
              type: this.getPositionTypeFromCode(posType),
              level: level,
              qualification: this.getQualificationLevel(
                posUserData?.personalInvites || 0, 
                posUserData?.totalEarned || 0
              ),
              sponsorId: posUserData?.sponsor ? await this.getUserIdByAddress(posUserData.sponsor) : null,
              activationDate: posUserData?.registrationTime ? new Date(posUserData.registrationTime * 1000) : null
            });
          } else {
            positions.push({
              position: i,
              id: null,
              address: null,
              type: 'available',
              level: 0,
              qualification: null,
              sponsorId: null,
              activationDate: null
            });
          }
        } catch (err) {
          console.warn(`Failed to get position ${i}:`, err);
          positions.push({
            position: i,
            id: null,
            address: null,
            type: 'available',
            level: 0,
            qualification: null,
            sponsorId: null,
            activationDate: null
          });
        }
      }
      
      // Получаем табличные данные
      const matrixUsers = await this.callContract('stats', 'getUsersInMatrixLevel', [level, 100, 0]);
      const tableData = [];
      
      if (matrixUsers && Array.isArray(matrixUsers)) {
        for (let i = 0; i < matrixUsers.length; i++) {
          const addr = matrixUsers[i];
          if (addr && addr !== '0x0000000000000000000000000000000000000000') {
            const userData = await this.getUserData(addr);
            const userId = await this.getUserIdByAddress(addr);
            
            tableData.push({
              number: i + 1,
              id: userId ? `GW${userId}` : 'GW0000000',
              address: addr,
              sponsorId: userData?.sponsor ? await this.getUserIdByAddress(userData.sponsor) : 'GW0000000',
              activationDate: userData?.registrationTime ? new Date(userData.registrationTime * 1000) : new Date(),
              level: level,
              qualification: this.getQualificationLevel(userData?.personalInvites || 0, userData?.totalEarned || 0)
            });
          }
        }
      }
      
      const data = {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          qualification: 'Gold',
          type: 'partner'
        },
        positions: positions,
        tableData: tableData,
        stats: {
          total: stats?.totalPositions || 0,
          partners: stats?.partnerPositions || 0,
          charity: stats?.charityPositions || 0,
          technical: stats?.technicalPositions || 0
        }
      };
      
      this.matrixCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get matrix data:', error);
      // Возвращаем пустую структуру вместо null
      return {
        topUser: {
          id: 'GW0000000',
          address: userAddress,
          level: level,
          qualification: 'None',
          type: 'partner'
        },
        positions: Array(6).fill(null).map((_, i) => ({
          position: i + 1,
          id: null,
          address: null,
          type: 'available',
          level: 0,
          qualification: null,
          sponsorId: null,
          activationDate: null
        })),
        tableData: [],
        stats: {
          total: 0,
          partners: 0,
          charity: 0,
          technical: 0
        }
      };
    }
  }

  async getMatrixPosition(userAddress, level, position) {
    try {
      return await this.callContract('globalway', 'getMatrixPosition', [userAddress, level, position]);
    } catch (error) {
      console.error('Failed to get matrix position:', error);
      return null;
    }
  }

  async getUserByMatrixPosition(level, position) {
    try {
      return await this.callContract('globalway', 'getUserByMatrixPosition', [level, position]);
    } catch (error) {
      console.error('Failed to get user by position:', error);
      return null;
    }
  }

  async getMatrixStats(userAddress, level) {
    try {
      const stats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      return {
        totalPositions: parseInt(stats.totalPositions || 0),
        partnerPositions: parseInt(stats.userPosition || 0),
        charityPositions: 0, // Нужно будет добавить в контракт
        technicalPositions: 0 // Нужно будет добавить в контракт
      };
    } catch (error) {
      console.error('Failed to get matrix stats:', error);
      return {
        totalPositions: 0,
        partnerPositions: 0,
        charityPositions: 0,
        technicalPositions: 0
      };
    }
  }

  async getMatrixUpline(userAddress, level) {
    try {
      const stats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      return stats.upline || [];
    } catch (error) {
      console.error('Failed to get matrix upline:', error);
      return [];
    }
  }

  async getMatrixDownline(userAddress, level) {
    try {
      const stats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      return stats.downline || [];
    } catch (error) {
      console.error('Failed to get matrix downline:', error);
      return [];
    }
  }

  async getUsersInMatrixLevel(level, limit = 100, offset = 0) {
    try {
      // Этот метод нужно добавить в контракт GlobalWayStats
      // Пока возвращаем пустой массив
      return [];
    } catch (error) {
      console.error('Failed to get users in matrix level:', error);
      return [];
    }
  }

  async getMatrixPositionType(userAddress, level, position) {
    try {
      // Этот метод нужно добавить в контракт
      // Пока возвращаем тип по умолчанию
      return 1; // partner
    } catch (error) {
      console.error('Failed to get position type:', error);
      return 0; // available
    }
  }

  // Получение ID от контракта вместо генерации
  async generateUserId(address) {
    if (!address) return '0000000';
    
    try {
      // Сначала пробуем получить существующий ID
      const existingId = await this.getUserIdByAddress(address);
      if (existingId && existingId !== '0') {
        return existingId;
      }
      
      // Если ID нет, возвращаем временный локальный ID
      let hash = 0;
      const cleanAddr = address.toLowerCase().replace('0x', '');
      
      for (let i = 0; i < cleanAddr.length; i++) {
        const char = cleanAddr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return (Math.abs(hash % 9000000) + 1000000).toString();
    } catch (error) {
      console.error('Failed to generate user ID:', error);
      return '0000000';
    }
  }

  // Convert user ID back to address
  async getAddressFromUserId(userId) {
    const cleanId = userId.toString().replace(/^GW/i, '');
    
    try {
      return await this.getAddressByUserId(cleanId);
    } catch (error) {
      return null;
    }
  }

  // Clear cache when user changes
  clearCache() {
    this.userCache.clear();
    this.matrixCache.clear();
  }

  // Matrix qualification helpers
  getQualificationLevel(personalInvites, teamVolume) {
    if (personalInvites >= 10 && teamVolume >= 100) return 'Gold';
    if (personalInvites >= 5 && teamVolume >= 50) return 'Silver';
    if (personalInvites >= 2 && teamVolume >= 10) return 'Bronze';
    return 'None';
  }

  // Position type helpers
  getPositionTypeFromCode(code) {
    const types = {
      0: 'available',
      1: 'partner',
      2: 'charity', 
      3: 'technical'
    };
    return types[code] || 'available';
  }

  // Matrix overflow logic
  calculateNextPosition(currentPosition, isLeftFull, isRightFull) {
    // Binary matrix logic: left-right filling
    if (currentPosition === 1) {
      return isLeftFull ? 2 : 1; // First line
    } else if (currentPosition === 2) {
      return isRightFull ? 1 : 2; // First line  
    }
    
    // Second line positions 3,4,5,6
    const secondLinePositions = [3, 4, 5, 6];
    for (let pos of secondLinePositions) {
      // Check if position is available
      if (!isLeftFull && pos <= 4) return pos;
      if (!isRightFull && pos > 4) return pos;
    }
    
    return 3; // Default to position 3
  }
}

const contractManager = new ContractManager(web3Manager);
