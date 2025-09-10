// contracts.js - Smart contract interactions
class ContractManager {
  constructor() {
    this.contracts = {};
    this.addresses = {
      204: { // opBNB Mainnet
        GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
        GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4', 
        GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc'
      }
    };
    
    this.userData = {};
    this.contractData = {};
    this.levelPrices = [];
    this.isInitialized = false;
  }

  async initContracts() {
    if (!window.web3Manager || !window.web3Manager.isConnected) {
      console.log('⏳ Waiting for Web3 connection...');
      return;
    }

    console.log('📄 Initializing contracts...');

    try {
      const networkId = window.web3Manager.networkId;
      const addresses = this.addresses[networkId];
      
      if (!addresses) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      const web3 = window.web3Manager.web3;

      // Load contract ABIs
      const [globalWayABI, statsABI, tokenABI] = await Promise.all([
        this.loadContractABI('/contracts/GlobalWay.json'),
        this.loadContractABI('/contracts/GlobalWayStats.json'),
        this.loadContractABI('/contracts/GWTToken.json')
      ]);

      // Initialize contracts
      this.contracts.GlobalWay = new web3.eth.Contract(globalWayABI, addresses.GlobalWay);
      this.contracts.GlobalWayStats = new web3.eth.Contract(statsABI, addresses.GlobalWayStats);
      this.contracts.GWTToken = new web3.eth.Contract(tokenABI, addresses.GWTToken);

      console.log('✅ Contracts initialized');

      // Load initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      
      // Update UI with loaded data
      if (window.uiManager) {
        window.uiManager.updateUserInterface();
      }

    } catch (error) {
      console.error('❌ Contract initialization error:', error);
      window.web3Manager.showNotification('Contract initialization failed: ' + error.message, 'error');
    }
  }

  async loadContractABI(path) {
    try {
      const response = await fetch(path);
      const contractData = await response.json();
      return contractData.abi;
    } catch (error) {
      console.error(`Error loading ABI from ${path}:`, error);
      throw error;
    }
  }

  async loadInitialData() {
    console.log('📊 Loading initial contract data...');

    try {
      // Load level prices
      await this.loadLevelPrices();
      
      // Load contract overview
      await this.loadContractOverview();
      
      // Load user data if connected
      if (window.web3Manager.account) {
        await this.loadUserData();
      }

      console.log('✅ Initial data loaded');

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    }
  }

  async loadLevelPrices() {
    const prices = [];
    
    for (let level = 1; level <= 12; level++) {
      try {
        const price = await this.contracts.GlobalWay.methods.levelPrices(level).call();
        prices[level] = window.web3Manager.web3.utils.fromWei(price, 'ether');
      } catch (error) {
        console.error(`Error loading price for level ${level}:`, error);
        prices[level] = '0';
      }
    }
    
    this.levelPrices = prices;
    console.log('💰 Level prices loaded:', this.levelPrices);
  }

  async loadContractOverview() {
    try {
      const overview = await this.contracts.GlobalWay.methods.getContractOverview().call();
      
      this.contractData.overview = {
        totalUsers: overview.totalUsers,
        activeUsers: overview.activeUsers, 
        totalVolume: window.web3Manager.web3.utils.fromWei(overview.totalVolume, 'ether'),
        contractBalance: window.web3Manager.web3.utils.fromWei(overview.contractBalance, 'ether'),
        levelDistribution: overview.levelDistribution
      };

      console.log('📊 Contract overview loaded:', this.contractData.overview);

    } catch (error) {
      console.error('❌ Error loading contract overview:', error);
    }
  }

  async loadUserData() {
    if (!window.web3Manager.account) return;

    console.log('👤 Loading user data...');

    try {
      const account = window.web3Manager.account;
      
      // Check if user is registered
      const isRegistered = await this.contracts.GlobalWay.methods.isUserRegistered(account).call();
      
      if (!isRegistered) {
        console.log('👤 User not registered');
        this.userData.isRegistered = false;
        return;
      }

      // Load user stats
      const userStats = await this.contracts.GlobalWay.methods.getUserStats(account).call();
      const userData = await this.contracts.GlobalWay.methods.getUserData(account).call();
      
      // Load detailed user info from stats contract
      const fullInfo = await this.contracts.GlobalWayStats.methods.getUserFullInfo(account).call();

      this.userData = {
        isRegistered: true,
        address: account,
        sponsor: userData.sponsor,
        registrationTime: userData.registrationTime,
        lastActivity: userData.lastActivity,
        personalInvites: userData.personalInvites,
        totalEarned: window.web3Manager.web3.utils.fromWei(userData.totalEarned, 'ether'),
        leaderRank: userData.leaderRank,
        activeLevels: userStats.activeLevels,
        referrals: userStats.referrals,
        fullInfo: fullInfo
      };

      // Load GWT token balance
      await this.loadTokenBalance();
      
      // Load quarterly activity info
      await this.loadQuarterlyInfo();

      console.log('✅ User data loaded:', this.userData);

    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  async loadTokenBalance() {
    if (!window.web3Manager.account) return;

    try {
      const balance = await this.contracts.GWTToken.methods.balanceOf(window.web3Manager.account).call();
      const price = await this.contracts.GWTToken.methods.getCurrentPrice().call();
      
      this.userData.tokenBalance = window.web3Manager.web3.utils.fromWei(balance, 'ether');
      this.userData.tokenPrice = window.web3Manager.web3.utils.fromWei(price, 'ether');

    } catch (error) {
      console.error('❌ Error loading token balance:', error);
      this.userData.tokenBalance = '0';
      this.userData.tokenPrice = '0.01';
    }
  }

  async loadQuarterlyInfo() {
    if (!window.web3Manager.account) return;

    try {
      const quarterlyFee = await this.contracts.GlobalWay.methods.QUARTERLY_FEE().call();
      
      this.userData.quarterlyFee = window.web3Manager.web3.utils.fromWei(quarterlyFee, 'ether');
      
      // Check quarterly status from user data
      const user = await this.contracts.GlobalWay.methods.users(window.web3Manager.account).call();
      this.userData.quarterlyCounter = user.quarterlyCounter;

    } catch (error) {
      console.error('❌ Error loading quarterly info:', error);
    }
  }

  // Contract interaction methods
  async registerUser(sponsorAddress) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log('📝 Registering user with sponsor:', sponsorAddress);

    try {
      const transaction = this.contracts.GlobalWay.methods.register(sponsorAddress);
      
      const result = await window.web3Manager.sendTransaction(transaction);
      
      console.log('✅ User registered:', result.transactionHash);
      
      // Refresh user data
      await this.loadUserData();
      
      return result;

    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  async buyLevel(level) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    if (!this.levelPrices[level]) {
      throw new Error(`Invalid level: ${level}`);
    }

    console.log(`💰 Buying level ${level} for ${this.levelPrices[level]} BNB`);

    try {
      const priceWei = window.web3Manager.web3.utils.toWei(this.levelPrices[level], 'ether');
      
      const transaction = this.contracts.GlobalWay.methods.buyLevel(level);
      
      const result = await window.web3Manager.sendTransaction(transaction, {
        value: priceWei
      });

      console.log(`✅ Level ${level} purchased:`, result.transactionHash);
      
      // Refresh user data
      await this.loadUserData();
      
      return result;

    } catch (error) {
      console.error(`❌ Error buying level ${level}:`, error);
      throw error;
    }
  }

  async buyLevelsBulk(maxLevel) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log(`💰 Buying levels 1-${maxLevel} in bulk`);

    try {
      const totalPrice = await this.contracts.GlobalWay.methods.calculateBulkPrice(maxLevel).call();
      
      const transaction = this.contracts.GlobalWay.methods.buyLevelsBulk(maxLevel);
      
      const result = await window.web3Manager.sendTransaction(transaction, {
        value: totalPrice
      });

      console.log(`✅ Levels 1-${maxLevel} purchased:`, result.transactionHash);
      
      // Refresh user data
      await this.loadUserData();
      
      return result;

    } catch (error) {
      console.error(`❌ Error buying levels 1-${maxLevel}:`, error);
      throw error;
    }
  }

  async payQuarterlyActivity() {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log('💰 Paying quarterly activity fee');

    try {
      const fee = this.userData.quarterlyFee || '0.075';
      const feeWei = window.web3Manager.web3.utils.toWei(fee, 'ether');
      
      const transaction = this.contracts.GlobalWay.methods.payQuarterlyActivity();
      
      const result = await window.web3Manager.sendTransaction(transaction, {
        value: feeWei
      });

      console.log('✅ Quarterly activity paid:', result.transactionHash);
      
      // Refresh user data
      await this.loadUserData();
      
      return result;

    } catch (error) {
      console.error('❌ Error paying quarterly activity:', error);
      throw error;
    }
  }

  async buyTokens(tokenAmount) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log(`🪙 Buying ${tokenAmount} GWT tokens`);

    try {
      const cost = await this.contracts.GWTToken.methods.calculatePurchaseCost(
        window.web3Manager.web3.utils.toWei(tokenAmount, 'ether')
      ).call();
      
      const transaction = this.contracts.GWTToken.methods.buyTokens(
        window.web3Manager.web3.utils.toWei(tokenAmount, 'ether')
      );
      
      const result = await window.web3Manager.sendTransaction(transaction, {
        value: cost
      });

      console.log(`✅ ${tokenAmount} GWT tokens purchased:`, result.transactionHash);
      
      // Refresh token balance
      await this.loadTokenBalance();
      
      return result;

    } catch (error) {
      console.error(`❌ Error buying ${tokenAmount} tokens:`, error);
      throw error;
    }
  }

  async sellTokens(tokenAmount) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log(`🪙 Selling ${tokenAmount} GWT tokens`);

    try {
      const transaction = this.contracts.GWTToken.methods.sellTokens(
        window.web3Manager.web3.utils.toWei(tokenAmount, 'ether')
      );
      
      const result = await window.web3Manager.sendTransaction(transaction);

      console.log(`✅ ${tokenAmount} GWT tokens sold:`, result.transactionHash);
      
      // Refresh token balance
      await this.loadTokenBalance();
      
      return result;

    } catch (error) {
      console.error(`❌ Error selling ${tokenAmount} tokens:`, error);
      throw error;
    }
  }

  // Admin functions
  async freeRegistrationWithLevels(userAddress, maxLevel) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log(`👑 Free registration for ${userAddress} with max level ${maxLevel}`);

    try {
      const transaction = this.contracts.GlobalWay.methods.freeRegistrationWithLevels(
        userAddress, 
        maxLevel
      );
      
      const result = await window.web3Manager.sendTransaction(transaction);

      console.log('✅ Free registration completed:', result.transactionHash);
      
      return result;

    } catch (error) {
      console.error('❌ Error in free registration:', error);
      throw error;
    }
  }

  async batchFreeRegistration(users, sponsor, maxLevel) {
    if (!this.isInitialized) {
      throw new Error('Contracts not initialized');
    }

    console.log(`👑 Batch registration for ${users.length} users`);

    try {
      const transaction = this.contracts.GlobalWay.methods.batchFreeRegistration(
        users, 
        sponsor, 
        maxLevel
      );
      
      const result = await window.web3Manager.sendTransaction(transaction);

      console.log('✅ Batch registration completed:', result.transactionHash);
      
      return result;

    } catch (error) {
      console.error('❌ Error in batch registration:', error);
      throw error;
    }
  }

  // Utility methods
  getLevelPrice(level) {
    return this.levelPrices[level] || '0';
  }

  calculatePackagePrice(maxLevel) {
    let total = 0;
    for (let i = 1; i <= maxLevel; i++) {
      total += parseFloat(this.levelPrices[i] || 0);
    }
    return total.toFixed(4);
  }

  isUserRegistered() {
    return this.userData.isRegistered || false;
  }

  hasLevel(level) {
    return this.userData.activeLevels && this.userData.activeLevels.includes(level);
  }

  refreshUserData() {
    if (window.web3Manager.isConnected) {
      this.loadUserData();
    }
  }

  clearUserData() {
    this.userData = {};
  }
}

// Initialize ContractManager
window.contractManager = new ContractManager();
