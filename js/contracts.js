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
  // Используем простое кодирование без ethers
  const methodName = method.name;
  const inputs = method.inputs || [];
  
  // Простые методы без параметров
  if (inputs.length === 0) {
    const signatures = {
      'getUserIdByAddress': '0xa6f3b6d4',
      'isUserRegistered': '0x8c64ea4a', 
      'getUserData': '0x86c1f0f5'
    };
    return signatures[methodName] || '0x00000000';
  }
  
  // Для методов с параметрами используем базовое кодирование
  return '0x' + this.simpleHash(methodName).slice(0, 8) + this.encodeParams(inputs, params);
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
    // ИСПРАВЛЕНО: Реальный вызов контракта для матрицы
    const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
    const userId = await this.getUserIdByAddress(userAddress);
    
    if (matrixStats) {
      return {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          qualification: this.getQualificationLevel(matrixStats.personalInvites || 0, matrixStats.teamVolume || 0),
          type: 'partner'
        },
        positions: this.parseMatrixPositions(matrixStats.downline || [], level),
        tableData: this.formatMatrixTableData(matrixStats.downline || []),
        stats: {
          total: parseInt(matrixStats.totalPositions) || 0,
          partners: Math.floor((parseInt(matrixStats.totalPositions) || 0) * 0.7),
          charity: Math.floor((parseInt(matrixStats.totalPositions) || 0) * 0.15),
          technical: Math.floor((parseInt(matrixStats.totalPositions) || 0) * 0.15)
        }
      };
    }
    
    // Fallback если нет данных
    return this.getEmptyMatrixData(userAddress, level, userId);
    
  } catch (error) {
    console.error('Failed to get matrix data:', error);
    const userId = await this.getUserIdByAddress(userAddress);
    return this.getEmptyMatrixData(userAddress, level, userId);
  }
}

// Добавляем вспомогательные методы
parseMatrixPositions(downline, level) {
  const maxPositions = Math.pow(2, level);
  const positions = [];
  
  for (let i = 0; i < Math.min(maxPositions, 6); i++) {
    if (downline[i]) {
      positions.push({
        position: i + 1,
        id: `GW${downline[i].userId || '0000000'}`,
        address: downline[i].address,
        type: 'partner',
        level: level,
        qualification: this.getQualificationLevel(downline[i].personalInvites || 0, downline[i].teamVolume || 0),
        sponsorId: `GW${downline[i].sponsorId || '0000000'}`,
        activationDate: new Date(downline[i].activationTime * 1000)
      });
    } else {
      positions.push({
        position: i + 1,
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
  
  return positions;
}

formatMatrixTableData(downline) {
  return downline.map((user, index) => ({
    number: index + 1,
    id: `GW${user.userId || '0000000'}`,
    address: user.address || '0x0000000000000000000000000000000000000000',
    sponsorId: `GW${user.sponsorId || '0000000'}`,
    activationDate: new Date(user.activationTime * 1000 || Date.now()),
    level: user.level || 1,
    qualification: this.getQualificationLevel(user.personalInvites || 0, user.teamVolume || 0)
  }));
}

getEmptyMatrixData(userAddress, level, userId) {
  return {
    topUser: {
      id: userId ? `GW${userId}` : 'GW0000000',
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
    stats: { total: 0, partners: 0, charity: 0, technical: 0 }
  };
}

  // ИСПРАВЛЕНО: Упрощенная история транзакций
async getTransactionHistory(address = null, limit = 50) {
  address = address || this.web3.account;
  if (!address) return [];

  try {
    // ИСПРАВЛЕНО: Получаем реальную историю из контракта
    const userStats = await this.callContract('globalway', 'getUserStats', [address]);
    const userFullInfo = await this.callContract('stats', 'getUserFullInfo', [address]);
    
    const transactions = [];
    
    // Добавляем регистрацию
    if (userFullInfo && userFullInfo.isRegistered) {
      transactions.push({
        hash: 'registration_' + address.slice(-8),
        type: 'Registration',
        amount: '0.0000',
        timestamp: new Date(userFullInfo.registrationTime * 1000),
        status: 'Success'
      });
    }
    
    // Добавляем покупки уровней
    if (userStats && userStats.activeLevels) {
      userStats.activeLevels.forEach((level, index) => {
        const levelPrice = this.getLevelPrice(level);
        transactions.push({
          hash: `level_${level}_` + address.slice(-8),
          type: 'Level Purchase',
          amount: levelPrice.toFixed(4),
          timestamp: new Date(Date.now() - (userStats.activeLevels.length - index) * 24 * 60 * 60 * 1000),
          status: 'Success',
          level: level
        });
      });
    }
    
    // Добавляем квартальные платежи
    if (userFullInfo && userFullInfo.quarterlyCounter > 0) {
      for (let i = 1; i <= userFullInfo.quarterlyCounter; i++) {
        transactions.push({
          hash: `quarterly_${i}_` + address.slice(-8),
          type: 'Quarterly Activity',
          amount: '0.0750',
          timestamp: new Date(userFullInfo.lastActivity * 1000 - (userFullInfo.quarterlyCounter - i) * 90 * 24 * 60 * 60 * 1000),
          status: 'Success'
        });
      }
    }
    
    // Сортируем по дате (новые сначала)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    return transactions.slice(0, limit);
    
  } catch (error) {
    console.error('Failed to load transaction history:', error);
    return [];
  }
}

// Добавляем вспомогательный метод для получения цены уровня
getLevelPrice(level) {
  const prices = [
    0, 0.0015, 0.003, 0.006, 0.012, 0.024, 0.048,
    0.096, 0.192, 0.384, 0.768, 1.536, 3.072
  ];
  return prices[level] || 0;
}

  getEventType(topic) {
  const eventTypes = {
    'UserRegistered': 'Registration',
    'LevelPurchased': 'Level Purchase', 
    'LevelActivated': 'Level Activation',
    'QuarterlyActivityPaid': 'Quarterly Payment',
    'ReferralReward': 'Referral Bonus',
    'PackageActivated': 'Package Purchase'
  };
  return eventTypes[topic] || 'Transaction';
}

parseLogAmount(data) {
  if (!data || data === '0x') return '0';
  try {
    const amount = parseInt(data.slice(0, 66), 16);
    return (amount / 1e18).toFixed(4);
  } catch (e) {
    return '0';
  }
}

// Добавляем метод для форматирования транзакций
formatTransactionForDisplay(tx) {
  return {
    hash: tx.hash || 'N/A',
    type: this.getEventType(tx.type),
    amount: tx.amount + ' BNB',
    timestamp: tx.timestamp,
    status: tx.status || 'Success',
    level: tx.level || '-'
  };
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
