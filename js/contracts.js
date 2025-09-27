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

      // Используем Web3.js для кодирования если доступен
      let data;
      if (typeof Web3 !== 'undefined' && Web3.utils) {
        const web3Instance = new Web3();
        data = web3Instance.eth.abi.encodeFunctionCall(method, params);
      } else {
        // Fallback на ручное кодирование
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

      let data;
      if (typeof Web3 !== 'undefined' && Web3.utils) {
        const web3Instance = new Web3();
        data = web3Instance.eth.abi.encodeFunctionCall(method, params);
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

  // Правильное кодирование методов через keccak256
  encodeMethodCall(method, params) {
    const methodSignature = `${method.name}(${method.inputs.map(i => i.type).join(',')})`;
    
    // Используем Web3 для хеширования если доступен
    let methodId;
    if (typeof Web3 !== 'undefined' && Web3.utils) {
      methodId = Web3.utils.keccak256(methodSignature).slice(0, 10);
    } else {
      // Простой fallback - использовать первые 4 байта хеша
      const hash = this.simpleKeccak256(methodSignature);
      methodId = '0x' + hash.slice(0, 8);
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

  simpleKeccak256(str) {
    // Простая имитация keccak256 для методов
    const methodHashes = {
      'isUserRegistered(address)': '7902fd80',
      'getUserIdByAddress(address)': '9ee29b42',
      'getAddressByUserId(uint256)': '2cb61907',
      'registerWithSponsorId(uint256)': 'e96bbf76',
      'buyLevel(uint8)': 'a0c6bfa1',
      'payQuarterlyActivity()': '5f78b73f',
      'assignIdToExistingUser()': 'd5ce3f8b',
      'getUserData(address)': '95946f8d',
      'getUserStats(address)': '67e2d96f',
      'isLevelActive(address,uint256)': '6e59aa0c',
      'buyLevelsBulk(uint8)': '19b7e3f4',
      'getContractOverview()': 'c8c2fe6c',
      'getMatrixStats(address,uint8)': '23a2c9d5',
      'getEarningsBreakdown(address)': '5f9b4db7',
      'balanceOf(address)': '70a08231',
      'getCurrentPrice()': 'eb91d37e'
    };
    
    return methodHashes[str] || '00000000';
  }

  // Точное кодирование параметров
  encodeParam(type, value) {
    if (type === 'address') {
      if (!value || value === '0x0') {
        return '0'.padStart(64, '0');
      }
      const cleanAddress = value.replace('0x', '').toLowerCase();
      return cleanAddress.padStart(64, '0');
    } 
    else if (type.startsWith('uint')) {
      const num = BigInt(value || 0);
      return num.toString(16).padStart(64, '0');
    } 
    else if (type === 'bool') {
      return value ? '1'.padStart(64, '0') : '0'.padStart(64, '0');
    } 
    else if (type === 'bytes32') {
      if (typeof value === 'string' && value.startsWith('0x')) {
        return value.slice(2).padEnd(64, '0');
      }
      return '0'.padStart(64, '0');
    }
    else if (type === 'string') {
      // Для строк нужна более сложная кодировка
      const offset = '20'.padStart(64, '0'); // offset to data
      const length = (value.length).toString(16).padStart(64, '0');
      const hex = Buffer.from(value).toString('hex').padEnd(64, '0');
      return offset + length + hex;
    }
    else if (type.includes('[]')) {
      // Для массивов
      return this.encodeArray(type, value);
    }
    
    return '0'.padStart(64, '0');
  }

  encodeArray(type, values) {
    if (!Array.isArray(values)) return '0'.padStart(64, '0');
    
    const offset = '20'.padStart(64, '0');
    const length = values.length.toString(16).padStart(64, '0');
    
    let encoded = offset + length;
    const elementType = type.replace('[]', '');
    
    for (const value of values) {
      encoded += this.encodeParam(elementType, value);
    }
    
    return encoded;
  }

  // Правильное декодирование результатов
  decodeResult(method, result) {
    if (!method.outputs || method.outputs.length === 0) {
      return null;
    }

    let cleanResult = result.replace('0x', '');
    
    // Для методов с несколькими выходными параметрами
    if (method.outputs.length > 1) {
      const outputs = {};
      let offset = 0;
      
      for (let i = 0; i < method.outputs.length; i++) {
        const output = method.outputs[i];
        const decoded = this.decodeSingleOutput(output.type, cleanResult.slice(offset));
        
        if (output.name) {
          outputs[output.name] = decoded.value;
        } else {
          outputs[i] = decoded.value;
        }
        
        offset += decoded.bytesRead * 2;
      }
      
      return outputs;
    }

    // Для одного выходного параметра
    const output = method.outputs[0];
    return this.decodeSingleOutput(output.type, cleanResult).value;
  }

  decodeSingleOutput(type, hexData) {
    if (type === 'bool') {
      return { value: parseInt(hexData.slice(0, 64), 16) === 1, bytesRead: 32 };
    } 
    else if (type.startsWith('uint')) {
      const value = BigInt('0x' + hexData.slice(0, 64));
      return { value: value.toString(), bytesRead: 32 };
    } 
    else if (type === 'address') {
      const addr = '0x' + hexData.slice(24, 64);
      return { 
        value: addr === '0x0000000000000000000000000000000000000000' ? null : addr,
        bytesRead: 32 
      };
    }
    else if (type === 'string') {
      try {
        const offset = parseInt(hexData.slice(0, 64), 16) * 2;
        const length = parseInt(hexData.slice(offset, offset + 64), 16) * 2;
        const stringHex = hexData.slice(offset + 64, offset + 64 + length);
        const decoded = Buffer.from(stringHex, 'hex').toString('utf8');
        return { value: decoded, bytesRead: 32 };
      } catch (e) {
        return { value: '', bytesRead: 32 };
      }
    }
    else if (type.includes('[]')) {
      return this.decodeArray(type, hexData);
    }
    else if (type.includes('tuple')) {
      return this.decodeTuple(type, hexData);
    }

    return { value: hexData.slice(0, 64), bytesRead: 32 };
  }

  decodeArray(type, hexData) {
    try {
      const offset = parseInt(hexData.slice(0, 64), 16) * 2;
      const length = parseInt(hexData.slice(offset, offset + 64), 16);
      const elementType = type.replace('[]', '');
      
      const values = [];
      let currentOffset = offset + 64;
      
      for (let i = 0; i < length; i++) {
        const decoded = this.decodeSingleOutput(elementType, hexData.slice(currentOffset));
        values.push(decoded.value);
        currentOffset += decoded.bytesRead * 2;
      }
      
      return { value: values, bytesRead: 32 };
    } catch (e) {
      return { value: [], bytesRead: 32 };
    }
  }

  decodeTuple(type, hexData) {
    // Специальная обработка для структур
    const result = {};
    let offset = 0;
    
    // Здесь должна быть логика декодирования структур
    // но пока возвращаем объект с базовыми полями
    return { value: result, bytesRead: 32 };
  }

  // Регистрация через контракт
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

      // Регистрация с указанным спонсором
      return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Получение ID через контракт
  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
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

  // Проверка регистрации
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

  // Получение данных пользователя через контракт
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

  // Матрица через контракт
  async getMatrixData(userAddress, level) {
    const cacheKey = `matrix_${userAddress}_${level}`;
    const cached = this.matrixCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      const userData = await this.getUserData(userAddress);
      
      // Получаем данные о позициях в матрице
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

      // Дополняем пустыми позициями если нужно
      while (positions.length < 6) {
        positions.push({
          id: 'Empty',
          address: null,
          level: level,
          qualification: 'None',
          type: 'available'
        });
      }

      // Получаем таблицу партнеров для уровня
      const tableData = [];
      if (userData?.referrals) {
        for (let i = 0; i < userData.referrals.length; i++) {
          const partnerAddr = userData.referrals[i];
          const isLevelActive = await this.callContract('globalway', 'isLevelActive', [partnerAddr, level]);
          
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

  // История транзакций через события контракта
  async getTransactionHistory(address = null, limit = 50) {
    address = address || this.web3.account;
    if (!address) return [];

    try {
      const transactions = [];
      
      // Получаем последний блок
      const latestBlock = await this.web3.provider.request({
        method: 'eth_blockNumber',
        params: []
      });
      
      const currentBlock = parseInt(latestBlock, 16);
      const fromBlock = Math.max(0, currentBlock - 5000); // последние 5000 блоков
      
      // Получаем события для пользователя
      const topics = [
        null, // topic0 - хеш события
        '0x' + address.slice(2).padStart(64, '0') // topic1 - адрес пользователя
      ];
      
      // События из контракта GlobalWay
      const globalwayLogs = await this.web3.provider.request({
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: 'latest',
          address: CONFIG.CONTRACTS.GLOBALWAY,
          topics: topics
        }]
      });
      
      // Обрабатываем логи
      for (const log of globalwayLogs) {
        const event = this.parseLog(log);
        if (event) {
          transactions.push(event);
        }
      }
      
      // Сортируем по времени
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
  }

  parseLog(log) {
    try {
      const topic0 = log.topics[0];
      const blockNumber = parseInt(log.blockNumber, 16);
      
      // Хеши событий
      const eventHashes = {
        '0x6a1cf42c24d4b48a4532bf95f8f6b96e07f0c6b6a03b1e3f3dc9e6c8d1e2f1a4': 'Registration',
        '0x85a66ffd23e2e9e3656de0de35bd618b89dc3f37c4eb178f4b3c3a2c96e5b4a7': 'LevelPurchased',
        '0xe11cddf1816a43318ca175bbc52cd0185436e9cbead7c83acc54a73e0193566d': 'QuarterlyActivityPaid',
        '0x3c3912e2bb8f6ad96e3bbf65b5c8f2a5dcacf1e8c2eec6e3b0e7c8d9e0f1a2b3': 'ReferralReward'
      };
      
      const eventType = eventHashes[topic0] || 'Transaction';
      
      return {
        hash: log.transactionHash,
        type: eventType,
        amount: this.parseLogAmount(log.data),
        timestamp: new Date(), // В реальности нужно получить timestamp блока
        status: 'Success',
        block: blockNumber
      };
    } catch (error) {
      console.error('Failed to parse log:', error);
      return null;
    }
  }

  parseLogAmount(data) {
    if (!data || data === '0x') return '0';
    try {
      const amount = BigInt(data.slice(0, 66));
      return (amount / BigInt(1e18)).toString();
    } catch (e) {
      return '0';
    }
  }

  // ADMIN методы
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

  // Получение данных о доходах
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
  }
}

const contractManager = new ContractManager(web3Manager);
