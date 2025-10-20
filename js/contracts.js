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
      marketing: null
    };
  }

  async loadABIs() {
    console.log('⏳ Loading contract ABIs from contracts-config.json...');

    try {
      const response = await fetch('/contracts/contracts-config.json');
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const configData = await response.json();
  
      if (configData.contracts) {
        this.abis.globalway = configData.contracts.GlobalWay?.abi || null;
        this.abis.token = configData.contracts.GWTToken?.abi || null;
        this.abis.stats = configData.contracts.GlobalWayStats?.abi || null;
        this.abis.leaderPool = configData.contracts.GlobalWayLeaderPool?.abi || null;
        this.abis.investment = configData.contracts.GlobalWayInvestment?.abi || null;
        this.abis.quarterly = configData.contracts.GlobalWayQuarterly?.abi || null;
        this.abis.governance = configData.contracts.GlobalWayGovernance?.abi || null;
        this.abis.techAccounts = configData.contracts.GlobalWayTechAccounts?.abi || null;
        this.abis.marketing = configData.contracts.GlobalWayMarketing?.abi || null;
      
        console.log('✅ ABIs loaded successfully');
      } else {
        console.error('❌ Invalid structure in contracts-config.json');
      }
    } catch (error) {
      console.error('❌ Failed to load contracts-config.json:', error);
      console.error('Attempted path: /contracts/contracts-config.json');
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
            CONFIG.CONTRACTS.GlobalWayStats,
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
            CONFIG.CONTRACTS.GlobalWayLeaderPool,
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
            CONFIG.CONTRACTS.GlobalWayInvestment,
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
            CONFIG.CONTRACTS.GlobalWayQuarterly,
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
            CONFIG.CONTRACTS.GlobalWayGovernance,
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
            CONFIG.CONTRACTS.GlobalWayTechAccounts,
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
            CONFIG.CONTRACTS.GlobalWayMarketing,
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

      console.log(`📊 Contracts initialized: ${successCount}/${totalCount}`);
      
      // Минимум требуется: GlobalWay, Token, Stats, Governance
      const criticalContracts = [
        this.contracts.globalway,
        this.contracts.token,
        this.contracts.stats,
        this.contracts.governance
      ];
      
      const criticalInitialized = criticalContracts.every(c => c !== null && c !== undefined);
      
      if (!criticalInitialized) {
        console.error('❌ Critical contracts not initialized');
        return false;
      }
      
      console.log('✅ All critical contracts initialized');
      return true;

    } catch (error) {
      console.error('❌ Contract init failed:', error);
      return false;
    }
  }

  // === GLOBALWAY ===
  
  async isUserRegistered(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      return await this.contracts.globalway.isUserRegistered(address);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  async register(sponsorAddress) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const tx = await this.contracts.globalway.register(sponsorAddress);
    await tx.wait();
    return tx.hash;
  }

// 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: УПРОЩЁННАЯ функция buyLevel для SafePal Mobile
async buyLevel(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    const price = ethers.utils.parseEther(CONFIG.LEVEL_PRICES[level - 1]);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    console.log(`🛒 Buying level ${level} for ${CONFIG.LEVEL_PRICES[level - 1]} BNB`);
    console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);

    try {
        // 🔥 ИСПРАВЛЕНО: Минимальная задержка только для мобильных
        if (isMobile) {
            console.log('⏳ Mobile - preparing wallet...');
            await new Promise(resolve => setTimeout(resolve, 800)); // 🔥 800ms вместо 3000ms!
        }
        
        console.log('📤 Sending transaction to SafePal...');
        
        // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ПРОСТОЙ вызов БЕЗ явных параметров газа
        // Пусть SafePal сам установит оптимальные параметры!
        const tx = await this.contracts.globalway.buyLevel(level, {
            value: price
            // 🔥 НЕ указываем gasLimit и gasPrice - SafePal установит автоматически!
        });
        
        console.log('✅ Transaction sent:', tx.hash);
        console.log('⏳ Waiting for confirmation...');
        
        // 🔥 ИСПРАВЛЕНО: Разумный timeout 90 секунд
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Transaction confirmation timeout')), 90000)
            )
        ]);
        
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        console.log('🎉 Level purchased successfully!');
        
        // Парсинг событий (опционально)
        if (this.contracts.marketing && receipt.logs) {
            try {
                let matrixEvents = 0;
                let referralEvents = 0;
                
                receipt.logs.forEach(log => {
                    try {
                        if (log.address.toLowerCase() === CONFIG.CONTRACTS.GlobalWayMarketing.toLowerCase()) {
                            const parsedLog = this.contracts.marketing.interface.parseLog(log);
                            if (parsedLog) {
                                if (parsedLog.name === 'MatrixBonusPaid') matrixEvents++;
                                if (parsedLog.name === 'ReferralBonusPaid') referralEvents++;
                            }
                        }
                    } catch (e) {
                        // Игнорируем ошибки парсинга
                    }
                });
                
                if (matrixEvents > 0) console.log('✅ Matrix bonus distributed');
                if (referralEvents > 0) console.log('✅ Referral bonus distributed');
                
            } catch (eventError) {
                console.warn('⚠️ Could not parse events:', eventError.message);
            }
        }
        
        return tx;
        
    } catch (error) {
        console.error('❌ Transaction failed:', error);
        
        // 🔥 ИСПРАВЛЕНО: Понятные сообщения об ошибках
        if (error.message.includes('user rejected') || error.message.includes('User denied')) {
            throw new Error('Transaction cancelled in wallet');
        } else if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient BNB balance for transaction + gas');
        } else if (error.message.includes('timeout')) {
            throw new Error('Transaction confirmation timeout. Check your transaction in explorer.');
        } else if (error.message.includes('nonce')) {
            throw new Error('Transaction nonce error. Please wait and try again.');
        } else if (error.message.includes('already pending')) {
            throw new Error('You have a pending transaction. Please wait for it to complete.');
        } else if (isMobile && error.message.includes('execution reverted')) {
            throw new Error('Transaction failed. Please check: 1) You are registered, 2) Previous level is active, 3) Sufficient BNB balance');
        } else {
            throw new Error(error.message || 'Transaction failed. Please try again.');
        }
    }
}

  async buyLevelsBulk(maxLevel) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    let packageType;
    if (maxLevel === 3) packageType = 1;
    else if (maxLevel === 4) packageType = 2;
    else if (maxLevel === 7) packageType = 3;
    else if (maxLevel === 10) packageType = 4;
    else if (maxLevel === 12) packageType = 5;
    else throw new Error('Invalid max level. Must be 3, 4, 7, 10, or 12');
    
    return await this.activatePackage(packageType);
  }

  async activatePackage(packageType) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    const totalCost = await this.contracts.globalway.calculatePackagePrice(packageType);
    
    const tx = await this.contracts.globalway.activatePackage(packageType, { value: totalCost });
    await tx.wait();
    return tx.hash;
  }

  async getUserInfo(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    const [
      isRegistered,
      sponsor,
      registrationTime,
      lastActivity,
      personalInvites,
      totalEarned,
      isInactive
    ] = await this.contracts.globalway.users(address);
    
    const userId = await this.contracts.globalway.addressToId(address);
    const leaderRank = await this.contracts.stats.getLeaderRank(address);
    const activeLevels = await this.contracts.globalway.getUserActiveLevels(address);
    
    return {
      isRegistered,
      sponsor,
      registrationTime,
      lastActivity,
      personalInvites,
      totalEarned,
      isInactive,
      userId,
      leaderRank,
      activeLevels
    };
  }

  // === GET USER ADDRESS BY ID ===
  async getUserAddress(userId) {
    try {
      if (!this.contracts.globalway) {
        throw new Error('GlobalWay not initialized');
      }
      
      console.log('🔍 Getting address for user ID:', userId);
      
      // Вызываем функцию контракта для получения адреса по ID
      const address = await this.contracts.globalway.idToAddress(userId);
      
      // Проверяем что адрес не нулевой
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ User ID not found:', userId);
        return '0x0000000000000000000000000000000000000000';
      }
      
      console.log('✅ Address found:', address);
      return address;
      
    } catch (error) {
      console.error('❌ Error getting user address:', error);
      throw error;
    }
  }

  async getUserReferrals(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.getUserReferrals(address);
  }

  async getActiveLevels(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    const activeLevels = [];
    for (let i = 1; i <= 12; i++) {
      try {
        const isActive = await this.contracts.globalway.isLevelActive(address, i);
        if (isActive) activeLevels.push(i);
      } catch (error) {
        console.error(`Error checking level ${i}:`, error);
      }
    }
    return activeLevels;
  }

  async getMatrixPosition(level, position) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const pos = await this.contracts.globalway.getMatrixPosition(level, position);
      
      const normalizedData = {
        user: pos[0] || pos.user || ethers.constants.AddressZero,
        position: pos[1] !== undefined ? pos[1] : (pos.position !== undefined ? pos.position : 0)
      };
      
      if (normalizedData.user === ethers.constants.AddressZero) {
        console.log(`Position ${position} at level ${level} is empty`);
      }
      
      return normalizedData;
    } catch (error) {
      console.error(`Error getting matrix position ${position} at level ${level}:`, error);
      return {
        user: ethers.constants.AddressZero,
        position: 0
      };
    }
  }

  async getUserMatrixPosition(level, address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.getUserMatrixPosition(level, address);
  }

  async getLevelPrice(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.levelPrices(level);
  }

  async getTokenReward(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.tokenRewards(level);
  }

  async getTotalUsers() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.totalUsers();
  }

  async getUserFullInfo(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    try {
      return await this.contracts.stats.getUserFullInfo(address);
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        isRegistered: false,
        sponsor: ethers.constants.AddressZero,
        registrationTime: 0,
        lastActivity: 0,
        personalInvites: 0,
        totalEarned: ethers.BigNumber.from(0),
        isInactive: false,
        userId: 0,
        activeLevels: [],
        referrals: [],
        isInvestor: false
      };
    }
  }

  // === TOKEN ===

  async getTokenBalance(address) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    return await this.contracts.token.balanceOf(address);
  }

  async getTokenTotalSupply() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    return await this.contracts.token.totalSupply();
  }

  async getTokenName() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    return await this.contracts.token.name();
  }

  async getTokenSymbol() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    return await this.contracts.token.symbol();
  }

  async transferTokens(to, amount) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const amountWei = ethers.utils.parseEther(amount.toString());
    const tx = await this.contracts.token.transfer(to, amountWei);
    await tx.wait();
    return tx.hash;
  }

  // === STATS ===

  async getLeaderboardTop(count = 10) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    try {
      return await this.contracts.stats.getLeaderboard(count);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async getUserRank(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    try {
      return await this.contracts.stats.getUserRank(address);
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }

  async getSystemStats() {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getSystemStats();
  }

  async getUserDetailedStats(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getUserDetailedStats(address);
  }

  async getUserIdByAddress(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getUserIdByAddress(address);
  }

  async getAddressById(userId) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getAddressById(userId);
  }

  // === LEADER POOL ===

  async claimLeaderReward() {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    const tx = await this.contracts.leaderPool.claimReward();
    await tx.wait();
    return tx.hash;
  }

  async getLeaderReward(address) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getReward(address);
  }

  async getLeaderRank(address) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getUserRank(address);
  }

  async getLeaderPoolBalance() {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getPoolBalance();
  }

  // === INVESTMENT ===

  async becomeInvestor() {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    const requiredAmount = await this.contracts.investment.investorThreshold();
    const tx = await this.contracts.investment.becomeInvestor({ value: requiredAmount });
    await tx.wait();
    return tx.hash;
  }

  async claimInvestmentReward() {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    const tx = await this.contracts.investment.claimReward();
    await tx.wait();
    return tx.hash;
  }

  async getInvestmentReward(address) {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    return await this.contracts.investment.getReward(address);
  }

  async getInvestmentInfo(address) {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    return await this.contracts.investment.getInvestmentInfo(address);
  }

  async getPoolStats() {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    return await this.contracts.investment.getPoolStats();
  }

  // === QUARTERLY ===

  async payQuarterlyActivity(charityRecipient = null) {
    if (!this.contracts.quarterly) throw new Error('Quarterly not initialized');
    
    const price = ethers.utils.parseEther(CONFIG.QUARTERLY_COST);
    
    if (charityRecipient && charityRecipient !== ethers.constants.AddressZero) {
      const tx = await this.contracts.quarterly.payQuarterlyActivity(charityRecipient, { value: price });
      await tx.wait();
      return tx.hash;
    } else {
      const tx = await this.contracts.quarterly.payQuarterlyActivityRegular({ value: price });
      await tx.wait();
      return tx.hash;
    }
  }

  async canPayQuarterly(address) {
    if (!this.contracts.quarterly) throw new Error('Quarterly not initialized');
    return await this.contracts.quarterly.canPayQuarterly(address);
  }

  async getUserQuarterlyInfo(address) {
    if (!this.contracts.quarterly) throw new Error('Quarterly not initialized');
    return await this.contracts.quarterly.getUserQuarterlyInfo(address);
  }

  // === TECH ACCOUNTS ===

  async isTechAccount(address) {
    if (!this.contracts.techAccounts) return false;
    try {
      return await this.contracts.techAccounts.isTechAccount(address);
    } catch (error) {
      console.error('Error checking tech account:', error);
      return false;
    }
  }

  async getTechAccountInfo(address) {
    if (!this.contracts.techAccounts) throw new Error('TechAccounts not initialized');
    return await this.contracts.techAccounts.getTechAccountInfo(address);
  }

  async getAllTechAccounts() {
    if (!this.contracts.techAccounts) throw new Error('TechAccounts not initialized');
    return await this.contracts.techAccounts.getAllTechAccounts();
  }

  async processTechAccountQuarterly(techAccount) {
    if (!this.contracts.techAccounts) throw new Error('TechAccounts not initialized');
    const tx = await this.contracts.techAccounts.processTechAccountQuarterly(techAccount);
    await tx.wait();
    return tx.hash;
  }

  // === GOVERNANCE ===

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

  async getMarketingBalance() {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    return await this.contracts.marketing.getBalance();
  }

  async canWithdrawMarketing(address) {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    return await this.contracts.marketing.canWithdraw(address);
  }

async withdrawMarketing(amount, recipient) {
    if (!this.contracts.marketing) throw new Error('Marketing not initialized');
    const amountWei = ethers.utils.parseEther(amount.toString());
    const tx = await this.contracts.marketing.withdraw(amountWei, recipient);
    await tx.wait();
    return tx.hash;
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
