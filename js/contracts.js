/* jshint esversion: 11 */
/* global web3Manager, ethers, CONFIG, Promise */

class ContractsManager {
  constructor() {
    this.contracts = {};
    this.abis = {
      globalway: null,
      token: null,
      stats: null,
      leaderPool: null,
      investment: null,
      quarterly: null,
      governance: null,
      techAccounts: null,
      marketing: null,
      bridge: null
    };
  }

  async loadABIs() {
    console.log('⏳ Loading contract ABIs from separate files...');

    try {
      // Список контрактов для загрузки
      const contracts = [
        { key: 'globalway', file: 'GlobalWay.json' },
        { key: 'token', file: 'GWTToken.json' },
        { key: 'stats', file: 'Stats.json' },
        { key: 'leaderPool', file: 'LeaderPool.json' },
        { key: 'investment', file: 'Investment.json' },
        { key: 'quarterly', file: 'Quarterly.json' },
        { key: 'governance', file: 'Governance.json' },
        { key: 'techAccounts', file: 'TechAccounts.json' },
        { key: 'marketing', file: 'Marketing.json' },
        { key: 'bridge', file: 'Bridge.json' }
      ];

      let loadedCount = 0;
      
      // Загружаем каждый контракт отдельно
      for (const contract of contracts) {
        try {
          console.log(`🔍 Loading ${contract.file}...`);
          
          // Пробуем разные пути
          const paths = [
            `/contracts/abis/${contract.file}`,
            `./contracts/abis/${contract.file}`,
            `contracts/abis/${contract.file}`
          ];
          
          let loaded = false;
          
          for (const path of paths) {
            try {
              const response = await fetch(path);
              
              if (response.ok) {
                const data = await response.json();
                this.abis[contract.key] = data.abi;
                console.log(`✅ ${contract.file} loaded (${data.abi.length} items)`);
                loadedCount++;
                loaded = true;
                break;
              }
            } catch (e) {
              // Пробуем следующий путь
            }
          }
          
          if (!loaded) {
            console.warn(`⚠️ Could not load ${contract.file}`);
          }
          
        } catch (error) {
          console.error(`❌ Error loading ${contract.file}:`, error.message);
        }
      }
      
      console.log(`✅ ABIs loaded: ${loadedCount}/${contracts.length}`);
      console.log('📊 Loaded ABIs:', {
        GlobalWay: !!this.abis.globalway,
        GWTToken: !!this.abis.token,
        Stats: !!this.abis.stats,
        LeaderPool: !!this.abis.leaderPool,
        Investment: !!this.abis.investment,
        Quarterly: !!this.abis.quarterly,
        Governance: !!this.abis.governance,
        TechAccounts: !!this.abis.techAccounts,
        Marketing: !!this.abis.marketing,
        Bridge: !!this.abis.bridge
      });
      
    } catch (error) {
      console.error('❌ Failed to load ABIs:', error);
      console.error('Make sure ABI files exist in /contracts/abis/ folder');
    }
  }

  init() {
    if (!web3Manager.signer) {
      console.log('⚠️ No signer - waiting for wallet connection');
      return false;
    }

    console.log('🔗 Initializing contracts...');
    
    let successCount = 0;
    let totalCount = 0;
    
    try {
      // GlobalWay (главный контракт)
      totalCount++;
      if (this.abis.globalway && Array.isArray(this.abis.globalway)) {
        try {
          this.contracts.globalway = new ethers.Contract(
            CONFIG.CONTRACTS.GlobalWay,
            this.abis.globalway,
            web3Manager.signer
          );
          console.log('✅ GlobalWay initialized');
          successCount++;
        } catch (error) {
          console.error('❌ GlobalWay initialization failed:', error);
        }
      } else {
        console.error('❌ GlobalWay ABI missing or invalid');
      }

      // GWTToken
      totalCount++;
      if (this.abis.token && Array.isArray(this.abis.token)) {
        try {
          this.contracts.token = new ethers.Contract(
            CONFIG.CONTRACTS.GWTToken,
            this.abis.token,
            web3Manager.signer
          );
          console.log('✅ GWTToken initialized');
          successCount++;
        } catch (error) {
          console.error('❌ GWTToken initialization failed:', error);
        }
      } else {
        console.error('❌ GWTToken ABI missing or invalid');
      }

      // Stats
      totalCount++;
      if (this.abis.stats && Array.isArray(this.abis.stats)) {
        try {
          this.contracts.stats = new ethers.Contract(
            CONFIG.CONTRACTS.Stats,
            this.abis.stats,
            web3Manager.signer
          );
          console.log('✅ Stats initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Stats initialization failed:', error);
        }
      } else {
        console.error('❌ Stats ABI missing or invalid');
      }

      // LeaderPool
      totalCount++;
      if (this.abis.leaderPool && Array.isArray(this.abis.leaderPool)) {
        try {
          this.contracts.leaderPool = new ethers.Contract(
            CONFIG.CONTRACTS.LeaderPool,
            this.abis.leaderPool,
            web3Manager.signer
          );
          console.log('✅ LeaderPool initialized');
          successCount++;
        } catch (error) {
          console.error('❌ LeaderPool initialization failed:', error);
        }
      } else {
        console.error('❌ LeaderPool ABI missing or invalid');
      }

      // Investment
      totalCount++;
      if (this.abis.investment && Array.isArray(this.abis.investment)) {
        try {
          this.contracts.investment = new ethers.Contract(
            CONFIG.CONTRACTS.Investment,
            this.abis.investment,
            web3Manager.signer
          );
          console.log('✅ Investment initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Investment initialization failed:', error);
        }
      } else {
        console.error('❌ Investment ABI missing or invalid');
      }

      // Quarterly
      totalCount++;
      if (this.abis.quarterly && Array.isArray(this.abis.quarterly)) {
        try {
          this.contracts.quarterly = new ethers.Contract(
            CONFIG.CONTRACTS.Quarterly,
            this.abis.quarterly,
            web3Manager.signer
          );
          console.log('✅ Quarterly initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Quarterly initialization failed:', error);
        }
      } else {
        console.error('❌ Quarterly ABI missing or invalid');
      }

      // Governance
      totalCount++;
      if (this.abis.governance && Array.isArray(this.abis.governance)) {
        try {
          this.contracts.governance = new ethers.Contract(
            CONFIG.CONTRACTS.Governance,
            this.abis.governance,
            web3Manager.signer
          );
          console.log('✅ Governance initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Governance initialization failed:', error);
        }
      } else {
        console.error('❌ Governance ABI missing or invalid');
      }

      // TechAccounts
      totalCount++;
      if (this.abis.techAccounts && Array.isArray(this.abis.techAccounts)) {
        try {
          this.contracts.techAccounts = new ethers.Contract(
            CONFIG.CONTRACTS.TechAccounts,
            this.abis.techAccounts,
            web3Manager.signer
          );
          console.log('✅ TechAccounts initialized');
          successCount++;
        } catch (error) {
          console.error('❌ TechAccounts initialization failed:', error);
        }
      } else {
        console.error('❌ TechAccounts ABI missing or invalid');
      }

      // Marketing
      totalCount++;
      if (this.abis.marketing && Array.isArray(this.abis.marketing)) {
        try {
          this.contracts.marketing = new ethers.Contract(
            CONFIG.CONTRACTS.Marketing,
            this.abis.marketing,
            web3Manager.signer
          );
          console.log('✅ Marketing initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Marketing initialization failed:', error);
        }
      } else {
        console.error('❌ Marketing ABI missing or invalid');
      }

      // Bridge
      totalCount++;
      if (this.abis.bridge && Array.isArray(this.abis.bridge)) {
        try {
          this.contracts.bridge = new ethers.Contract(
            CONFIG.CONTRACTS.Bridge,
            this.abis.bridge,
            web3Manager.signer
          );
          console.log('✅ Bridge initialized');
          successCount++;
        } catch (error) {
          console.error('❌ Bridge initialization failed:', error);
        }
      } else {
        console.error('❌ Bridge ABI missing or invalid');
      }

      console.log(`📊 Contracts initialized: ${successCount}/${totalCount}`);
      
      // Минимум требуется: GlobalWay, Token, Stats, Governance
      const criticalContracts = [
        this.contracts.globalway,
        this.contracts.token,
        this.contracts.stats,
        this.contracts.governance
      ];
      
      const criticalInitialized = criticalContracts.every(c => c !== null && c !== undefined);
      
      if (criticalInitialized) {
        console.log('✅ All critical contracts initialized');
        return true;
      } else {
        console.error('❌ Some critical contracts failed to initialize');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Critical error during contract initialization:', error);
      return false;
    }
  }

  // === USER INFO ===
  
  async isUserExists(address) {
    if (!this.contracts.globalway) return false;
    try {
      const userInfo = await this.contracts.globalway.users(address);
      return userInfo[0]; // isRegistered - первое поле в структуре
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  async getUserInfo(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      return await this.contracts.globalway.users(address);
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  async getUserId(address) {
    if (!this.contracts.globalway) return 0;
    try {
      // Получаем индекс пользователя из массива allUsers
      const totalUsers = await this.contracts.globalway.totalUsers();
      for (let i = 0; i < totalUsers; i++) {
        const userAddr = await this.contracts.globalway.allUsers(i);
        if (userAddr.toLowerCase() === address.toLowerCase()) {
          return i + 1; // ID начинается с 1
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return 0;
    }
  }

  async getIdToAddress(userId) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      // ID начинается с 1, массив с 0
      if (userId < 1) return ethers.constants.AddressZero;
      return await this.contracts.globalway.allUsers(userId - 1);
    } catch (error) {
      console.error('Error getting address by ID:', error);
      return ethers.constants.AddressZero;
    }
  }

  // === HELPER FUNCTIONS FOR REGISTRATION ===

  async getUserAddress(userId) {
    return await this.getIdToAddress(userId);
  }

  async getUserFullInfo(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    try {
      const userInfo = await this.getUserInfo(address);
      const userId = await this.getUserId(address);
      const stats = await this.getUserStats(address);
      const levels = await this.getUserLevels(address, 1);
      
      return {
        isRegistered: await this.isUserExists(address),
        sponsor: userInfo.referrer || ethers.constants.AddressZero,
        registrationTime: userInfo.registrationTime || 0,
        lastActivity: userInfo.lastActivity || 0,
        personalInvites: stats.partnersCount || 0,
        totalEarned: stats.totalEarned ? ethers.utils.parseEther(stats.totalEarned) : ethers.BigNumber.from(0),
        isInactive: false,
        userId: userId,
        referrals: await this.getPartners(address),
        activeLevels: levels,
        isInvestor: false
      };
    } catch (error) {
      console.error('Error getting full user info:', error);
      return {
        isRegistered: false,
        sponsor: ethers.constants.AddressZero,
        registrationTime: 0,
        lastActivity: 0,
        personalInvites: 0,
        totalEarned: ethers.BigNumber.from(0),
        isInactive: false,
        userId: 0,
        referrals: [],
        activeLevels: [],
        isInvestor: false
      };
    }
  }

  // === REGISTRATION ===

  async register(referrerId) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    try {
      const price = await this.contracts.globalway.REGISTRATION_COST();
      const tx = await this.contracts.globalway.register(referrerId, {
        value: price
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getRegistrationCost() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const cost = await this.contracts.globalway.REGISTRATION_COST();
      return ethers.utils.formatEther(cost);
    } catch (error) {
      console.error('Error getting registration cost:', error);
      return '0.0015';
    }
  }

  // === LEVELS ===

  async buyLevel(matrix, level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    try {
      const price = await this.contracts.globalway.levelPrices(level);
      const tx = await this.contracts.globalway.activateLevel(level, {
        value: price
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Buy level error:', error);
      throw error;
    }
  }

  async getLevelPrice(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const price = await this.contracts.globalway.levelPrices(level);
      return ethers.utils.formatEther(price);
    } catch (error) {
      console.error('Error getting level price:', error);
      return CONFIG.LEVEL_PRICES[level - 1] || '0';
    }
  }

  async getUserLevels(address, matrix) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const levels = [];
      for (let i = 1; i <= 12; i++) {
        const hasLevel = await this.contracts.globalway.isLevelActive(address, i);
        levels.push(hasLevel);
      }
      return levels;
    } catch (error) {
      console.error('Error getting user levels:', error);
      return Array(12).fill(false);
    }
  }

  // === TOKEN FUNCTIONS ===

  async getTokenBalance(address) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    try {
      const balance = await this.contracts.token.balanceOf(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  async getTokenTotalSupply() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    try {
      const supply = await this.contracts.token.totalSupply();
      return ethers.utils.formatEther(supply);
    } catch (error) {
      console.error('Error getting total supply:', error);
      return '0';
    }
  }

  async transferTokens(to, amount) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.contracts.token.transfer(to, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  }

  async approveTokens(spender, amount) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.contracts.token.approve(spender, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Approve error:', error);
      throw error;
    }
  }

  // === QUARTERLY ACTIVITY ===

  async getQuarterlyInfo(address) {
    if (!this.contracts.quarterly) throw new Error('Quarterly not initialized');
    try {
      const info = await this.contracts.quarterly.getQuarterlyInfo(address);
      return {
        currentQuarter: info.currentQuarter?.toNumber() || 0,
        lastPayment: info.lastPayment?.toNumber() || 0,
        nextPayment: info.nextPayment?.toNumber() || 0,
        isActive: info.isActive || false
      };
    } catch (error) {
      console.error('Error getting quarterly info:', error);
      return {
        currentQuarter: 0,
        lastPayment: 0,
        nextPayment: 0,
        isActive: false
      };
    }
  }

  async payQuarterlyActivity() {
    if (!this.contracts.quarterly) throw new Error('Quarterly not initialized');
    try {
      const cost = ethers.utils.parseEther(CONFIG.QUARTERLY_COST);
      const tx = await this.contracts.quarterly.payActivity({
        value: cost
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Pay activity error:', error);
      throw error;
    }
  }

  // === STATS ===

  async getGlobalStats() {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    try {
      const stats = await this.contracts.stats.getGlobalStats();
      return {
        totalUsers: stats.totalUsers?.toNumber() || 0,
        totalTransactions: stats.totalTransactions?.toNumber() || 0,
        totalVolume: ethers.utils.formatEther(stats.totalVolume || '0')
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      return {
        totalUsers: 0,
        totalTransactions: 0,
        totalVolume: '0'
      };
    }
  }

  async getUserStats(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    try {
      const stats = await this.contracts.stats.getUserFullStats(address);
      return {
        totalEarned: ethers.utils.formatEther(stats.totalEarned || '0'),
        partnersCount: stats.partnersCount?.toNumber() || 0,
        matrixIncome: ethers.utils.formatEther(stats.matrixIncome || '0'),
        partnerIncome: ethers.utils.formatEther(stats.partnerIncome || '0')
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalEarned: '0',
        partnersCount: 0,
        matrixIncome: '0',
        partnerIncome: '0'
      };
    }
  }

  // === PARTNER STRUCTURE ===

  async getReferrer(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const userInfo = await this.contracts.globalway.users(address);
      return userInfo.referrer || ethers.constants.AddressZero;
    } catch (error) {
      console.error('Error getting referrer:', error);
      return ethers.constants.AddressZero;
    }
  }

  async getPartners(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      return await this.contracts.globalway.getUserReferrals(address);
    } catch (error) {
      console.error('Error getting partners:', error);
      return [];
    }
  }

  async getPartnersCount(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const referrals = await this.contracts.globalway.getUserReferrals(address);
      return referrals.length;
    } catch (error) {
      console.error('Error getting partners count:', error);
      return 0;
    }
  }

  // === MATRIX INFO ===

  async getUserMatrix(address, level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      return await this.contracts.globalway.usersX3Matrix(address, level);
    } catch (error) {
      console.error('Error getting matrix info:', error);
      return null;
    }
  }

  // === GOVERNANCE ===

  async isOwner(address) {
    if (!this.contracts.governance) return false;
    try {
      const owner = await this.contracts.governance.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error checking owner:', error);
      return false;
    }
  }

  async isFounder(address) {
    if (!this.contracts.governance) return false;
    try {
      return await this.contracts.governance.isFounder(address);
    } catch (error) {
      console.error('Error checking founder status:', error);
      return false;
    }
  }

  async isBoardMember(address) {
    if (!this.contracts.governance) return false;
    try {
      return await this.contracts.governance.isBoardMember(address);
    } catch (error) {
      console.error('Error checking board status:', error);
      return false;
    }
  }

  async isUserBlocked(address) {
    if (!this.contracts.governance) return false;
    try {
      return await this.contracts.governance.isUserBlocked(address);
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }

  async getBlockReason(address) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    return await this.contracts.governance.getBlockReason(address);
  }

  async getBoardMembers() {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    return await this.contracts.governance.getBoardMembers();
  }

  async blockUser(address, reason) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.blockUser(address, reason);
    await tx.wait();
    return tx.hash;
  }

  async unblockUser(address) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.unblockUser(address);
    await tx.wait();
    return tx.hash;
  }

  async addBoardMember(address) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.addBoardMember(address);
    await tx.wait();
    return tx.hash;
  }

  async removeBoardMember(address) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.removeBoardMember(address);
    await tx.wait();
    return tx.hash;
  }

  async createWithdrawalProposal(recipient, amount, poolName, description) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const amountWei = ethers.utils.parseEther(amount.toString());
    const tx = await this.contracts.governance.createWithdrawalProposal(
      recipient,
      amountWei,
      poolName,
      description
    );
    await tx.wait();
    return tx.hash;
  }

  async voteOnProposal(proposalId, support) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.voteOnProposal(proposalId, support);
    await tx.wait();
    return tx.hash;
  }

  async executeProposal(proposalId) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    const tx = await this.contracts.governance.executeProposal(proposalId);
    await tx.wait();
    return tx.hash;
  }

  async getProposal(proposalId) {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    return await this.contracts.governance.getProposal(proposalId);
  }

  async getActiveProposals() {
    if (!this.contracts.governance) throw new Error('Governance not initialized');
    return await this.contracts.governance.getActiveProposals();
  }

  // === ADMIN FUNCTIONS ===

  async activateFounderTeam(user, sponsor, maxLevel) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.activateFounderTeam(user, sponsor, maxLevel);
    await tx.wait();
    return tx.hash;
  }

  async batchActivateTeam(members, sponsors, levels) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.batchActivateTeam(members, sponsors, levels);
    await tx.wait();
    return tx.hash;
  }

  async assignIdByOwner(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    const tx = await this.contracts.stats.assignIdByOwner(address);
    await tx.wait();
    return tx.hash;
  }

  async pause() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.emergencyPause();
    await tx.wait();
    return tx.hash;
  }

  async unpause() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.emergencyUnpause();
    await tx.wait();
    return tx.hash;
  }

  async authorizeExternalProject(projectAddress, status) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.authorizeExternalProject(projectAddress, status);
    await tx.wait();
    return tx.hash;
  }

  async emergencyWithdraw() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.emergencyWithdraw();
    await tx.wait();
    return tx.hash;
  }

  async processInactiveAccount(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.processInactiveAccount(address);
    await tx.wait();
    return tx.hash;
  }

  // === MARKETING POOL ===

  async getMarketingBalance(address) {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    try {
      const balance = await this.contracts.marketing.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting marketing balance:', error);
      return '0';
    }
  }

  async canWithdrawMarketing(address) {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    try {
      return await this.contracts.marketing.canWithdraw(address);
    } catch (error) {
      console.error('Error checking marketing withdrawal:', error);
      return false;
    }
  }

  async withdrawMarketing() {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    try {
      const tx = await this.contracts.marketing.withdraw();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Marketing withdrawal error:', error);
      throw error;
    }
  }

  // === LEADER POOL ===

  async getLeaderBalance(address) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    try {
      const balance = await this.contracts.leaderPool.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting leader balance:', error);
      return '0';
    }
  }

  async canWithdrawLeader(address) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    try {
      return await this.contracts.leaderPool.canWithdraw(address);
    } catch (error) {
      console.error('Error checking leader withdrawal:', error);
      return false;
    }
  }

  async withdrawLeader() {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    try {
      const tx = await this.contracts.leaderPool.withdraw();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Leader withdrawal error:', error);
      throw error;
    }
  }

  // === INVESTMENT POOL ===

  async getInvestmentBalance(address) {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    try {
      const balance = await this.contracts.investment.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting investment balance:', error);
      return '0';
    }
  }

  async canWithdrawInvestment(address) {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    try {
      return await this.contracts.investment.canWithdraw(address);
    } catch (error) {
      console.error('Error checking investment withdrawal:', error);
      return false;
    }
  }

  async withdrawInvestment() {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    try {
      const tx = await this.contracts.investment.withdraw();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Investment withdrawal error:', error);
      throw error;
    }
  }

  // === TOKEN PRICE ===
  async getRealTokenPrice() {
    try {
      if (!this.contracts.token) {
        console.warn('⚠️ Token contract not initialized');
        return '0';
      }
      
      // Пробуем получить цену из контракта
      if (typeof this.contracts.token.getTokenPrice === 'function') {
        const price = await this.contracts.token.getTokenPrice();
        return ethers.utils.formatUnits(price, 18);
      }
      
      // Если функция tokenPrice существует
      if (typeof this.contracts.token.tokenPrice === 'function') {
        const price = await this.contracts.token.tokenPrice();
        return ethers.utils.formatUnits(price, 18);
      }
      
      // Возвращаем значение по умолчанию из CONFIG
      if (CONFIG && CONFIG.TOKEN_PRICE) {
        return CONFIG.TOKEN_PRICE.toString();
      }
      
      return '0.01';
      
    } catch (error) {
      console.error('❌ Error getting token price:', error);
      return CONFIG && CONFIG.TOKEN_PRICE ? CONFIG.TOKEN_PRICE.toString() : '0.01';
    }
  }

  // === LEADERSHIP INFO ===
  async getLeadershipInfo(address) {
    try {
      if (!this.contracts.stats) {
        console.warn('⚠️ Stats contract not initialized');
        return {
          leaderRank: 0,
          qualificationProgress: 0,
          nextRankRequirement: 0
        };
      }
      
      const leaderRank = await this.contracts.stats.getLeaderRank(address);
      
      let qualificationProgress = 0;
      let nextRankRequirement = 0;
      
      if (typeof this.contracts.stats.getQualificationProgress === 'function') {
        qualificationProgress = await this.contracts.stats.getQualificationProgress(address);
      }
      
      const rankRequirements = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
      nextRankRequirement = rankRequirements[leaderRank] || 0;
      
      return {
        leaderRank: leaderRank,
        qualificationProgress: qualificationProgress,
        nextRankRequirement: nextRankRequirement
      };
      
    } catch (error) {
      console.error('❌ Error getting leadership info:', error);
      return {
        leaderRank: 0,
        qualificationProgress: 0,
        nextRankRequirement: 0
      };
    }
  }
}

const contracts = new ContractsManager();
