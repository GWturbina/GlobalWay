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
      // ✅ ИСПРАВЛЕНО: Абсолютный путь от корня (без './')
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
    
    // ✅ ИСПРАВЛЕНО: Счётчик успешно инициализированных контрактов
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

      // ✅ ИСПРАВЛЕНО: Итоговая статистика
      console.log(`📊 Contracts initialized: ${successCount}/${totalCount}`);
      
      // Минимум требуется: GlobalWay, Token, Stats, Governance
      const criticalContracts = [
        this.contracts.globalway,
        this.contracts.token,
        this.contracts.stats,
        this.contracts.governance
      ];
      
      const allCriticalLoaded = criticalContracts.every(c => c !== null && c !== undefined);
      
      if (!allCriticalLoaded) {
        console.error('❌ Critical contracts missing! Cannot proceed.');
        return false;
      }
      
      console.log('✅ All critical contracts initialized successfully');
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

async buyLevel(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    
    const price = ethers.utils.parseEther(CONFIG.LEVEL_PRICES[level - 1]);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    console.log(`🔄 Buying level ${level} for ${CONFIG.LEVEL_PRICES[level - 1]} BNB`);
    console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);

    // 🔥 ИСПРАВЛЕНИЕ: Умная задержка для разных устройств
    const delay = isMobile ? 3000 : 1000;
    console.log(`⏳ Waiting ${delay}ms for wallet readiness...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  
    console.log('📤 Sending transaction...');
    console.log('💡 SafePal will open for confirmation...');
    
    // 🔥 ИСПРАВЛЕНИЕ: Добавляем retry механизм
    let tx;
    let lastError;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries + 1}`);
            
            // 🔥 ИСПРАВЛЕНИЕ: Явные параметры газа для всех устройств
            const txParams = {
                value: price
            };

            // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Явные лимиты газа
            if (isMobile) {
               // Для SafePal Mobile - более высокие лимиты
               txParams.gasLimit = 500000; // Увеличено до 500K
               txParams.gasPrice = ethers.utils.parseUnits('5', 'gwei'); // Явная цена газа
               console.log('📱 Using mobile-optimized gas settings');
            } else {
                // Для десктоп - стандартные настройки
               txParams.gasLimit = 300000;
                console.log('💻 Using desktop gas settings');
            }
            
            tx = await this.contracts.globalway.buyLevel(level, txParams);
            console.log('✅ Transaction sent:', tx.hash);
            break; // Успех, выходим из цикла retry
            
        } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            
            if (attempt <= maxRetries) {
                // 🔥 ИСПРАВЛЕНИЕ: Экспоненциальная задержка между попытками
                const retryDelay = 2000 * attempt;
                console.log(`🔄 Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error('❌ All transaction attempts failed');
                
                // 🔥 ИСПРАВЛЕНИЕ: Более понятные сообщения об ошибках
                let userMessage = 'Transaction failed';
                if (error.message.includes('user rejected') || error.message.includes('User denied')) {
                    userMessage = 'Transaction cancelled in wallet';
                } else if (error.message.includes('insufficient funds')) {
                    userMessage = 'Insufficient BNB balance';
                } else if (error.message.includes('network') || error.message.includes('chain')) {
                    userMessage = 'Network error. Please check your connection';
                } else if (isMobile) {
                    userMessage = 'Mobile wallet connection failed. Please try again';
                }
                
                throw new Error(userMessage);
            }
        }
    }
    
    // 🔥 ИСПРАВЛЕНИЕ: Улучшенное ожидание подтверждения
    console.log('⏳ Transaction pending, waiting for confirmation...');
    
    try {
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Transaction timeout - it may still process')), 180000) // 3 минуты
            )
        ]);
        
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        console.log('🎉 Level purchase successful!');
        
        // 🔥 ИСПРАВЛЕНИЕ: Более надежная проверка событий
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
                
                console.log(`📊 Marketing events - Matrix: ${matrixEvents}, Referral: ${referralEvents}`);
                
                if (matrixEvents > 0) console.log('✅ Matrix bonus distributed');
                if (referralEvents > 0) console.log('✅ Referral bonus distributed');
                
            } catch (eventError) {
                console.warn('⚠️ Could not parse marketing events:', eventError.message);
            }
        }
        
        return tx;
        
    } catch (waitError) {
        if (waitError.message.includes('timeout')) {
            console.warn('⚠️ Transaction confirmation timeout, but it may still process');
            console.log('📊 Transaction hash:', tx.hash);
            return tx;
        }
        console.error('❌ Transaction confirmation failed:', waitError);
        throw waitError;
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
    return await this.contracts.globalway.users(address);
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

  // ✅ ИСПРАВЛЕНО: Нормализация данных матрицы
  async getMatrixPosition(level, position) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    try {
      const pos = await this.contracts.globalway.getMatrixPosition(level, position);
      
      // Контракт может вернуть tuple [address, uint256] или объект {user, position}
      const normalizedData = {
        user: pos[0] || pos.user || ethers.constants.AddressZero,
        position: pos[1] !== undefined ? pos[1] : (pos.position !== undefined ? pos.position : 0)
      };
      
      // Если адрес нулевой, возвращаем пустую позицию
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

  async getTotalVolume() {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.totalVolume();
  }

  async isLevelActive(address, level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.isLevelActive(address, level);
  }

  async getMatrixCounter(level) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.matrixCounter(level);
  }

  async isQuarterlyActive(address) {
    if (!this.contracts.globalway) throw new Error('GlobalWay not initialized');
    return await this.contracts.globalway.isQuarterlyActive(address);
  }

  // === STATS ===

  async getUserFullInfo(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getUserFullInfo(address);
  }

  async getContractOverview() {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getContractOverview();
  }

  async getUserIdByAddress(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    const id = await this.contracts.stats.getUserIdByAddress(address);
    return id.toNumber();
  }

  async getAddressByUserId(userId) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getAddressByUserId(userId);
  }

  async getMatrixStats(address, level) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getMatrixStats(address, level);
  }

  async getLeadershipInfo(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getLeadershipInfo(address);
  }

  async getInvestmentInfo(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getInvestmentInfo(address);
  }

  async getPricesAndRewards() {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getPricesAndRewards();
  }

  async getUsersBulkInfo(addresses) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getUsersBulkInfo(addresses);
  }

  async getPackagePrice(address, packageType) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getPackagePrice(address, packageType);
  }

  async getUserActivityStatus(address) {
    if (!this.contracts.stats) throw new Error('Stats not initialized');
    return await this.contracts.stats.getUserActivityStatus(address);
  }

  // === TOKEN ===

  async getTokenBalance(address) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const balance = await this.contracts.token.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  async getTokenPrice() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const price = await this.contracts.token.currentPrice();
    return ethers.utils.formatEther(price);
  }

  async getRealTokenPrice() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const price = await this.contracts.token.getRealTokenPrice();
    return ethers.utils.formatEther(price);
  }

  async getTotalSupply() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const supply = await this.contracts.token.totalSupply();
    return ethers.utils.formatEther(supply);
  }

  async getCirculatingSupply() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const supply = await this.contracts.token.getCirculatingSupply();
    return ethers.utils.formatEther(supply);
  }

  async getTotalBurned() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const burned = await this.contracts.token.totalBurned();
    return ethers.utils.formatEther(burned);
  }

  async getMarketCap() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const cap = await this.contracts.token.getMarketCap();
    return ethers.utils.formatEther(cap);
  }

  async getTotalMinted() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const minted = await this.contracts.token.totalMinted();
    return ethers.utils.formatEther(minted);
  }

  async getTotalTokensBought() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const bought = await this.contracts.token.totalTokensBought();
    return ethers.utils.formatEther(bought);
  }

  async getTotalTokensSold() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const sold = await this.contracts.token.totalTokensSold();
    return ethers.utils.formatEther(sold);
  }

  async getTradingEnabled() {
    if (!this.contracts.token) throw new Error('Token not initialized');
    return await this.contracts.token.tradingEnabled();
  }

  async buyTokens(amount, maxPricePerToken) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const cost = await this.contracts.token.calculatePurchaseCostWithCommission(
      ethers.utils.parseEther(amount)
    );
    const maxPrice = maxPricePerToken ? ethers.utils.parseEther(maxPricePerToken) : ethers.constants.MaxUint256;
    const tx = await this.contracts.token.buyTokens(
      ethers.utils.parseEther(amount),
      maxPrice,
      { value: cost }
    );
    await tx.wait();
    return tx.hash;
  }

  async sellTokens(amount, minPricePerToken = 0) {
    if (!this.contracts.token) throw new Error('Token not initialized');
    const tx = await this.contracts.token.sellTokens(
      ethers.utils.parseEther(amount),
      ethers.utils.parseEther(minPricePerToken.toString())
    );
    await tx.wait();
    return tx.hash;
  }

  async addTokenToWallet() {
    if (!window.ethereum) throw new Error('No wallet detected');
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONFIG.CONTRACTS.GWTToken,
          symbol: 'GWT',
          decimals: 18,
          image: `${window.location.origin}/assets/planets/gwt-coin.png`
        }
      }
    });
  }

  // === LEADER POOL ===

  async getUserRank(address) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getUserRank(address);
  }

  async canClaimRank(address, rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.canClaimRank(address, rank);
  }

  async hasClaimedRank(address, rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.hasClaimedRank(address, rank);
  }

  async claimRankBonus(rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    const tx = await this.contracts.leaderPool.claimRankBonus(rank);
    await tx.wait();
    return tx.hash;
  }

  async distributeRankPool(rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    const tx = await this.contracts.leaderPool.distributeRankPool(rank);
    await tx.wait();
    return tx.hash;
  }

  async getQualifiedUsers(rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getQualifiedUsers(rank);
  }

  async getQualifiedCount(rank) {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    const count = await this.contracts.leaderPool.getQualifiedCount(rank);
    return count.toNumber();
  }

  async getPoolsInfo() {
    if (!this.contracts.leaderPool) throw new Error('LeaderPool not initialized');
    return await this.contracts.leaderPool.getPoolsInfo();
  }

  // === INVESTMENT ===

  async isUserInvestor(address) {
    if (!this.contracts.investment) throw new Error('Investment not initialized');
    return await this.contracts.investment.isUserInvestor(address);
  }

  async getInvestmentPoolInfo(address) {
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
}

const contracts = new ContractsManager();
