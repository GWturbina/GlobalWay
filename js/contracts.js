class ContractManager {
  constructor(web3Manager) {
    this.web3 = web3Manager;
    this.userCache = new Map();
    this.matrixCache = new Map();
    this.cacheTimeout = 30000;
  }

  async callContract(contractName, methodName, params = []) {
  if (!this.web3.isConnected) throw new Error('Wallet not connected');
  
  const contract = this.web3.contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not loaded`);
  
  try {
    const method = contract.abi.find(item => 
      item.type === 'function' && item.name === methodName
    );
    if (!method) throw new Error(`Method ${methodName} not found`);
    
    // Используем ethers для кодирования
    const iface = new ethers.utils.Interface([method]);
    const data = iface.encodeFunctionData(methodName, params);
    
    const result = await this.web3.provider.request({
      method: 'eth_call',
      params: [{
        to: contract.address,
        data: data
      }, 'latest']
    });
    
    const decoded = iface.decodeFunctionResult(methodName, result);
    return decoded.length === 1 ? decoded[0] : decoded;
  } catch (error) {
    console.error(`Call failed: ${contractName}.${methodName}`, error);
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

      const iface = new ethers.utils.Interface([method]);
      const data = iface.encodeFunctionData(methodName, params);

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

  async registerUserWithId(sponsorId) {
    try {
      if (!sponsorId) {
        return await this.sendTransaction('stats', 'assignIdToExistingUser', []);
      }
      
      const cleanId = sponsorId.toString().replace(/^GW/i, '');
      
      if (!/^\d{7}$/.test(cleanId)) {
        throw new Error('Invalid sponsor ID format. Use GW1234567 or 1234567');
      }

      return await this.sendTransaction('stats', 'registerWithSponsorId', [cleanId]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async getUserIdByAddress(address = null) {
    address = address || this.web3.account;
    if (!address) return null;

    try {
      const id = await this.callContract('stats', 'getUserIdByAddress', [address]);
      return id && id !== '0' && id.toString() !== '0' ? id.toString() : null;
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
        totalEarned: userData[5].toString(),
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
      const priceWei = '0x' + Math.floor(parseFloat(price) * 1e18).toString(16);
      return await this.sendTransaction('globalway', 'buyLevel', [level], priceWei);
    } catch (error) {
      console.error('Level purchase failed:', error);
      throw error;
    }
  }

  async payQuarterlyActivity() {
    try {
      const feeWei = '0x' + Math.floor(0.075 * 1e18).toString(16);
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
      const balance = await this.callContract('token', 'balanceOf', [address]);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  async getMatrixData(userAddress, level) {
    try {
      const matrixStats = await this.callContract('stats', 'getMatrixStats', [userAddress, level]);
      const userId = await this.getUserIdByAddress(userAddress);
      
      const downline = matrixStats[3] || [];
      const positions = [];
      
      for (let i = 0; i < downline.length; i++) {
        const addr = downline[i];
        if (addr && addr !== '0x0000000000000000000000000000000000000000') {
          const downlineId = await this.getUserIdByAddress(addr);
          positions.push({
            address: addr,
            id: downlineId ? `GW${downlineId}` : 'Empty',
            type: 'partner'
          });
        }
      }
      
      return {
        topUser: {
          id: userId ? `GW${userId}` : 'GW0000000',
          address: userAddress,
          level: level,
          type: 'partner'
        },
        positions: positions,
        tableData: [],
        stats: {
          total: parseInt(matrixStats[0]) || 0,
          partners: positions.length,
          charity: 0,
          technical: 0
        }
      };
    } catch (error) {
      console.error('Failed to get matrix data:', error);
      throw error;
    }
  }

  async getTransactionHistory(address = null, limit = 50) {
  address = address || this.web3.account;
  if (!address) return [];
  
  try {
    const currentBlock = await this.web3.provider.request({
      method: 'eth_blockNumber', 
      params: []
    });
    
    const fromBlock = Math.max(0, parseInt(currentBlock) - 10000);
    
    const logs = await this.web3.provider.request({
      method: 'eth_getLogs',
      params: [{
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: 'latest',
        address: [CONFIG.CONTRACTS.GLOBALWAY, CONFIG.CONTRACTS.STATS],
        topics: [null, '0x' + address.slice(2).padStart(64, '0')]
      }]
    });
    
    const transactions = logs.map(log => ({
      hash: log.transactionHash,
      type: this.getEventTypeFromTopic(log.topics[0]),
      amount: log.data ? (parseInt(log.data, 16) / 1e18).toFixed(4) : '0',
      timestamp: new Date(parseInt(log.blockNumber, 16) * 1000),
      status: 'Success'
    })).slice(0, limit);
    
    return transactions;
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

  getEventTypeFromTopic(topic) {
  const topics = {
    '0x5b2db1322f4dc81333a576053319e00e39635c3e10d0e43b7beedcfe86df5d47': 'Registration',
    '0x8f92f221143688195d2e98b7ceacf03bb9e784419bb0a6a059e5fb96e3e6f9fb': 'Level Purchase',
    '0xbb32e1c5b6e6f5e0e0f5d7c4e4b7b6d3e5e4f5e6f7e8f9e0e1e2e3e4e5e6e7e8': 'Quarterly Payment'
  };
  return topics[topic] || 'Transaction';
}

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
        totalUsers: overview[0].toString(),
        activeUsers: overview[2].toString(),
        contractBalance: overview[6].toString(),
        totalVolume: overview[1].toString()
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
