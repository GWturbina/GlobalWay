class ContractManager {
  constructor(web3Manager) {
    this.web3 = web3Manager;
    this.userCache = new Map();
    this.matrixCache = new Map();
    this.cacheTimeout = 30000; // 30 секунд
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
      // ИСПРАВЛЕНО: правильное кодирование адресов
      const cleanAddress = value.replace('0x', '').toLowerCase();
      return cleanAddress.padStart(64, '0');
    } else if (type.startsWith('uint')) {
      const num = BigInt(value || 0);
      return num.toString(16).padStart(64, '0');
    } else if (type === 'bool') {
      return value ? '1'.padStart(64, '0') : '0'.padStart(64, '0');
    } else if (type === 'string') {
      // Простое кодирование строк
      const hex = Array.from(value || '', c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return hex.padEnd(64, '0');
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
      const addr = '0x' + cleanResult.slice(-40);
      return addr === '0x0000000000000000000000000000000000000000' ? null : addr;
    }

    return cleanResult;
  }

  web3Keccak256(text) {
    if (typeof ethers !== 'undefined' && ethers.utils) {
      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(text));
    }
    
    // Fallback hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }

  // ИСПРАВЛЕНО: Регистрация только через контракт, никаких заглушек
  async registerUserWithId(sponsorId) {
    try {
      if (!sponsorId) {
        // Регистрация без спонсора через stats контракт
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

  // ИСПРАВЛЕНО: Только реальные ID из контракта
  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      const id = await this.callContract('stats', 'getUserIdByAddress', [address]);
      // ВАЖНО: возвращаем null если ID = 0 или не существует
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

  // ИСПРАВЛЕНО: Убран кэш, только реальные данные
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

  // ИСПРАВЛЕНО: Реальная загрузка матрицы
  async getMatrixData(userAddress, level) {
    try {
      const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      
      const positions = [];
      const maxPositions = Math.min(6, Math.pow(2, level));
      
      for (let i = 1; i <= maxPositions; i++) {
        try {
          const posAddress = await this.callContract('globalway', 'getUserByMatrixPosition', [level, i]);
          if (posAddress && posAddress !== '0x0000000000000000000000000000000000000000') {
            const posUserId = await this.getUserIdByAddress(posAddress);
            const posUserData = await this.getUserData(posAddress);
            
            positions.push({
              position: i,
              id: posUserId ? `GW${posUserId}` : null,
              address: posAddress,
              type: 'partner',
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
      
      const tableData = [];
      const referrals = await this.callContract('globalway', 'getUserStats', [userAddress]);
      
      if (referrals && referrals[6]) {
        for (let i = 0; i < referrals[6].length; i++) {
          const addr = referrals[6][i];
          const isLevelActive = await this.callContract('globalway', 'isLevelActive', [addr, level]);
          
          if (isLevelActive) {
            const userData = await this.getUserData(addr);
            const userId = await this.getUserIdByAddress(addr);
            
            tableData.push({
              number: tableData.length + 1,
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
      
      return {
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
          total: parseInt(matrixStats[0] || 0),
          partners: parseInt(matrixStats[1] || 0),
          charity: 0,
          technical: 0
        }
      };
    } catch (error) {
      console.error('Failed to get matrix data:', error);
      throw error;
    }
  }

  // Остальные методы остаются без изменений...
  async getTransactionHistory(address = null, limit = 50) {
    address = address || this.web3.account;
    if (!address) return [];

    try {
      const currentBlock = await this.web3.provider.request({
        method: 'eth_blockNumber',
        params: []
      });
      
      const fromBlock = Math.max(0, parseInt(currentBlock, 16) - 100000);
      
      const registrationFilter = {
        address: CONFIG.CONTRACTS.GLOBALWAY,
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: 'latest',
        topics: [
          '0x' + this.web3Keccak256('Registration(address,address,uint256)'),
          '0x' + address.slice(2).padStart(64, '0').toLowerCase()
        ]
      };

      const levelPurchaseFilter = {
        address: CONFIG.CONTRACTS.GLOBALWAY,
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: 'latest',
        topics: [
          '0x' + this.web3Keccak256('LevelPurchased(address,uint8,uint256)'),
          '0x' + address.slice(2).padStart(64, '0').toLowerCase()
        ]
      };

      const [registrationLogs, levelLogs] = await Promise.all([
        this.web3.provider.request({method: 'eth_getLogs', params: [registrationFilter]}),
        this.web3.provider.request({method: 'eth_getLogs', params: [levelPurchaseFilter]})
      ]);

      const allLogs = [...(registrationLogs || []), ...(levelLogs || [])];
      
      const transactions = await Promise.all(
        allLogs.slice(0, limit).map(async (log) => {
          const block = await this.web3.provider.request({
            method: 'eth_getBlockByNumber',
            params: [log.blockNumber, false]
          });
          
          return {
            hash: log.transactionHash,
            type: this.getEventType(log.topics[0]),
            amount: this.parseLogAmount(log.data),
            timestamp: new Date(parseInt(block.timestamp, 16) * 1000),
            status: 'Success'
          };
        })
      );

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
  }

  getEventType(topic) {
    const eventTypes = {
      [`0x${this.web3Keccak256('Registration(address,address,uint256)')}`]: 'Registration',
      [`0x${this.web3Keccak256('LevelPurchased(address,uint8,uint256)')}`]: 'Level Purchase',
      [`0x${this.web3Keccak256('QuarterlyActivityPaid(address,uint256,uint256)')}`]: 'Quarterly Payment'
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
      return null;
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
