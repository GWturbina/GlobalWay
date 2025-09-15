/**
 * Contract Manager для GlobalWay
 * Управляет взаимодействием с смарт-контрактами GlobalWay, GWTToken, GlobalWayStats
 */

class ContractManager {
  constructor() {
    this.contracts = {};
    this.web3 = null;
    this.networkId = 204; // opBNB
    this.isInitialized = false;
    
    // Адреса контрактов на opBNB
    this.contractAddresses = {
      GlobalWay: "0x64De05a0c818a925711EA0874FD972Bdc2edb2aA",
      GWTToken: "0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc",
      GlobalWayStats: "0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4"
    };

    // Привилегированные адреса
    this.privilegedAddresses = {
      OWNER: "0x7261b8aeaee2f806f64001596a67d68f2055acd2",
      FOUNDERS: [
        "0x03284a899147f5a07f82c622f34df92198671635",
        "0x9b49bd9c9458615e11c051afd1ebe983563b67ee",
        "0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7"
      ],
      DIRECTORS: [
        "0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA",
        "0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639",
        "0x0561671297Eed07accACB41b4882ED61e87E3644",
        "0x012E0B2b502FE0131Cb342117415a43d59094D6d",
        "0x15b546a61865bdc46783ACfc50c3101a1121c69B",
        "0xB5986B808dad481ad86D63DF152cC0ad7B473e48",
        "0x4d2C77e59538deFe89E3B2951680547FC24aD52C",
        "0xAB17aDbe29c4E1d695C239206682B02ebdB3f707"
      ]
    };

    // Пулы адресов
    this.poolAddresses = {
      TREASURY: "0xe58f778236c1d3ccecf14ec1274761559685a336",
      OPS: "0x956c8350b874d01d32236eb2944089b54c3b9670",
      DEV: "0xf8c5504dc1e5165a0748a3dc410384bfcbab13dd",
      CHARITY: "0x09c3bd32eb0617e29e41382b738c4e3cc932a611",
      TOKENOMICS: "0xbdc29886c91878c1ba9ce0626da5e1961324354f"
    };

    // Цены уровней (неизменны)
    this.levelPrices = {
      1: "0.0015", 2: "0.003", 3: "0.006", 4: "0.012",
      5: "0.024", 6: "0.048", 7: "0.096", 8: "0.192",
      9: "0.384", 10: "0.768", 11: "1.536", 12: "3.072"
    };

    // Награды токенами за уровни
    this.levelRewards = {
      1: 5, 2: 5, 3: 10, 4: 15, 5: 35, 6: 75,
      7: 150, 8: 300, 9: 600, 10: 1200, 11: 2400, 12: 4500
    };

    // Квартальная активность
    this.quarterlyFee = "0.075";
  }

  /**
   * Инициализация контрактов
   */
  async initialize(web3Instance) {
    if (!web3Instance) {
      throw new Error('Web3 instance required');
    }

    this.web3 = web3Instance;

    try {
      // Загружаем ABI контрактов
      const [globalWayABI, gwtTokenABI, globalWayStatsABI] = await Promise.all([
        this.loadContractABI('GlobalWay'),
        this.loadContractABI('GWTToken'),
        this.loadContractABI('GlobalWayStats')
      ]);

      // Создаем экземпляры контрактов
      this.contracts.GlobalWay = new this.web3.eth.Contract(
        globalWayABI,
        this.contractAddresses.GlobalWay
      );

      this.contracts.GWTToken = new this.web3.eth.Contract(
        gwtTokenABI,
        this.contractAddresses.GWTToken
      );

      this.contracts.GlobalWayStats = new this.web3.eth.Contract(
        globalWayStatsABI,
        this.contractAddresses.GlobalWayStats
      );

      this.isInitialized = true;
      console.log('📋 Contract Manager initialized successfully');

    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }

  /**
   * Загрузка ABI контракта
   */
  async loadContractABI(contractName) {
    try {
      const response = await fetch(`/contracts/${contractName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${contractName} ABI`);
      }
      const contractData = await response.json();
      return contractData.abi;
    } catch (error) {
      console.error(`❌ Failed to load ${contractName} ABI:`, error);
      throw error;
    }
  }

  /**
   * Проверка инициализации
   */
  checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('Contract Manager not initialized');
    }
  }

  // ===== ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ =====

  /**
   * Проверка регистрации пользователя
   */
  async isUserRegistered(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWay.methods
        .isUserRegistered(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error checking user registration:', error);
      throw error;
    }
  }

  /**
   * Регистрация пользователя
   */
  async registerUser(sponsorAddress, fromAddress) {
    this.checkInitialized();
    try {
      const tx = this.contracts.GlobalWay.methods.register(sponsorAddress);
      
      return await this.sendTransaction(tx, fromAddress, {
        value: 0
      });
    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  /**
   * Получение данных пользователя
   */
  async getUserData(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWay.methods
        .getUserData(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error getting user data:', error);
      throw error;
    }
  }

  /**
   * Получение полной информации пользователя
   */
  async getUserFullInfo(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getUserFullInfo(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error getting user full info:', error);
      throw error;
    }
  }

  /**
   * Получение статистики пользователя
   */
  async getUserStats(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWay.methods
        .getUserStats(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }

  // ===== УРОВНИ И АКТИВАЦИЯ =====

  /**
   * Покупка одного уровня
   */
  async buyLevel(level, fromAddress) {
    this.checkInitialized();
    
    if (level < 1 || level > 12) {
      throw new Error('Invalid level: must be between 1 and 12');
    }

    try {
      const price = this.levelPrices[level];
      const tx = this.contracts.GlobalWay.methods.buyLevel(level);
      
      return await this.sendTransaction(tx, fromAddress, {
        value: this.web3.utils.toWei(price, 'ether')
      });
    } catch (error) {
      console.error(`❌ Failed to buy level ${level}:`, error);
      throw error;
    }
  }

  /**
   * Покупка уровней до указанного (bulk)
   */
  async buyLevelsBulk(maxLevel, fromAddress) {
    this.checkInitialized();
    
    if (maxLevel < 1 || maxLevel > 12) {
      throw new Error('Invalid max level: must be between 1 and 12');
    }

    try {
      const totalPrice = await this.calculateBulkPrice(maxLevel, fromAddress);
      const tx = this.contracts.GlobalWay.methods.buyLevelsBulk(maxLevel);
      
      return await this.sendTransaction(tx, fromAddress, {
        value: this.web3.utils.toWei(totalPrice.toString(), 'ether')
      });
    } catch (error) {
      console.error(`❌ Failed to buy levels up to ${maxLevel}:`, error);
      throw error;
    }
  }

  /**
   * Расчет стоимости bulk покупки
   */
  async calculateBulkPrice(maxLevel, userAddress) {
    this.checkInitialized();
    try {
      const priceWei = await this.contracts.GlobalWay.methods
        .calculateBulkPrice(maxLevel)
        .call({ from: userAddress });
      
      return this.web3.utils.fromWei(priceWei, 'ether');
    } catch (error) {
      console.error('❌ Error calculating bulk price:', error);
      throw error;
    }
  }

  /**
   * Проверка активности уровня
   */
  async isLevelActive(userAddress, level) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWay.methods
        .isLevelActive(userAddress, level)
        .call();
    } catch (error) {
      console.error('❌ Error checking level activity:', error);
      throw error;
    }
  }

  // ===== КВАРТАЛЬНАЯ АКТИВНОСТЬ =====

  /**
   * Оплата квартальной активности
   */
  async payQuarterlyActivity(fromAddress) {
    this.checkInitialized();
    try {
      const tx = this.contracts.GlobalWay.methods.payQuarterlyActivity();
      
      return await this.sendTransaction(tx, fromAddress, {
        value: this.web3.utils.toWei(this.quarterlyFee, 'ether')
      });
    } catch (error) {
      console.error('❌ Quarterly activity payment failed:', error);
      throw error;
    }
  }

  // ===== ТОКЕНЫ =====

  /**
   * Получение баланса GWT токенов
   */
  async getTokenBalance(userAddress) {
    this.checkInitialized();
    try {
      const balanceWei = await this.contracts.GWTToken.methods
        .balanceOf(userAddress)
        .call();
      
      return this.web3.utils.fromWei(balanceWei, 'ether');
    } catch (error) {
      console.error('❌ Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Получение текущей цены токена
   */
  async getTokenPrice() {
    this.checkInitialized();
    try {
      const priceWei = await this.contracts.GWTToken.methods
        .getCurrentPrice()
        .call();
      
      return this.web3.utils.fromWei(priceWei, 'ether');
    } catch (error) {
      console.error('❌ Error getting token price:', error);
      throw error;
    }
  }

  /**
   * Покупка токенов
   */
  async buyTokens(tokenAmount, fromAddress) {
    this.checkInitialized();
    try {
      const cost = await this.calculateTokenPurchaseCost(tokenAmount);
      const tx = this.contracts.GWTToken.methods.buyTokens(
        this.web3.utils.toWei(tokenAmount.toString(), 'ether')
      );
      
      return await this.sendTransaction(tx, fromAddress, {
        value: this.web3.utils.toWei(cost.toString(), 'ether')
      });
    } catch (error) {
      console.error('❌ Token purchase failed:', error);
      throw error;
    }
  }

  /**
   * Продажа токенов
   */
  async sellTokens(tokenAmount, fromAddress) {
    this.checkInitialized();
    try {
      const tx = this.contracts.GWTToken.methods.sellTokens(
        this.web3.utils.toWei(tokenAmount.toString(), 'ether')
      );
      
      return await this.sendTransaction(tx, fromAddress);
    } catch (error) {
      console.error('❌ Token sale failed:', error);
      throw error;
    }
  }

  /**
   * Расчет стоимости покупки токенов
   */
  async calculateTokenPurchaseCost(tokenAmount) {
    this.checkInitialized();
    try {
      const costWei = await this.contracts.GWTToken.methods
        .calculatePurchaseCost(this.web3.utils.toWei(tokenAmount.toString(), 'ether'))
        .call();
      
      return this.web3.utils.fromWei(costWei, 'ether');
    } catch (error) {
      console.error('❌ Error calculating purchase cost:', error);
      throw error;
    }
  }

  /**
   * Расчет дохода от продажи токенов
   */
  async calculateTokenSaleReturn(tokenAmount) {
    this.checkInitialized();
    try {
      const returnWei = await this.contracts.GWTToken.methods
        .calculateSaleReturn(this.web3.utils.toWei(tokenAmount.toString(), 'ether'))
        .call();
      
      return this.web3.utils.fromWei(returnWei, 'ether');
    } catch (error) {
      console.error('❌ Error calculating sale return:', error);
      throw error;
    }
  }

  // ===== МАТРИЦА =====

  /**
   * Получение статистики матрицы
   */
  async getMatrixStats(userAddress, level) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getMatrixStats(userAddress, level)
        .call();
    } catch (error) {
      console.error('❌ Error getting matrix stats:', error);
      throw error;
    }
  }

  // ===== ДОХОДЫ =====

  /**
   * Получение разбивки доходов
   */
  async getEarningsBreakdown(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getEarningsBreakdown(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error getting earnings breakdown:', error);
      throw error;
    }
  }

  /**
   * Получение информации о лидерстве
   */
  async getLeadershipInfo(userAddress) {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getLeadershipInfo(userAddress)
        .call();
    } catch (error) {
      console.error('❌ Error getting leadership info:', error);
      throw error;
    }
  }

  // ===== СТАТИСТИКА =====

  /**
   * Получение обзора контракта
   */
  async getContractOverview() {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getContractOverview()
        .call();
    } catch (error) {
      console.error('❌ Error getting contract overview:', error);
      throw error;
    }
  }

  /**
   * Получение цен и наград
   */
  async getPricesAndRewards() {
    this.checkInitialized();
    try {
      return await this.contracts.GlobalWayStats.methods
        .getPricesAndRewards()
        .call();
    } catch (error) {
      console.error('❌ Error getting prices and rewards:', error);
      throw error;
    }
  }

  // ===== АДМИНСКИЕ ФУНКЦИИ =====

  /**
   * Проверка прав доступа
   */
  getUserRole(userAddress) {
    const address = userAddress.toLowerCase();
    
    if (address === this.privilegedAddresses.OWNER.toLowerCase()) {
      return 'owner';
    }
    
    if (this.privilegedAddresses.FOUNDERS.some(addr => 
      addr.toLowerCase() === address)) {
      return 'founder';
    }
    
    if (this.privilegedAddresses.DIRECTORS.some(addr => 
      addr.toLowerCase() === address)) {
      return 'director';
    }
    
    return 'user';
  }

  /**
   * Бесплатная регистрация (только для админов)
   */
  async freeRegistrationWithLevels(userAddress, sponsorAddress, maxLevel, fromAddress) {
    this.checkInitialized();
    
    const role = this.getUserRole(fromAddress);
    if (!['owner', 'founder'].includes(role)) {
      throw new Error('Insufficient permissions for free registration');
    }

    try {
      const tx = this.contracts.GlobalWay.methods
        .freeRegistrationWithLevels(userAddress, sponsorAddress, maxLevel);
      
      return await this.sendTransaction(tx, fromAddress);
    } catch (error) {
      console.error('❌ Free registration failed:', error);
      throw error;
    }
  }

  /**
   * Пакетная бесплатная регистрация
   */
  async batchFreeRegistration(users, sponsors, maxLevels, fromAddress) {
    this.checkInitialized();
    
    const role = this.getUserRole(fromAddress);
    if (!['owner', 'founder'].includes(role)) {
      throw new Error('Insufficient permissions for batch registration');
    }

    try {
      const tx = this.contracts.GlobalWay.methods
        .batchFreeRegistration(users, sponsors, maxLevels);
      
      return await this.sendTransaction(tx, fromAddress);
    } catch (error) {
      console.error('❌ Batch registration failed:', error);
      throw error;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

  /**
   * Отправка транзакции с обработкой ошибок
   */
  async sendTransaction(txMethod, fromAddress, options = {}) {
    try {
      // Оценка газа
      const gasEstimate = await txMethod.estimateGas({
        from: fromAddress,
        ...options
      });

      // Добавляем 20% запаса к оценке газа
      const gasLimit = Math.ceil(gasEstimate * 1.2);

      // Отправляем транзакцию
      const result = await txMethod.send({
        from: fromAddress,
        gas: gasLimit,
        ...options
      });

      console.log('✅ Transaction successful:', result.transactionHash);
      return result;

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw this.parseContractError(error);
    }
  }

  /**
   * Парсинг ошибок контракта для пользователя
   */
  parseContractError(error) {
    const errorMessage = error.message || error.toString();
    
    // Общие ошибки
    if (errorMessage.includes('insufficient funds')) {
      return new Error('Insufficient BNB balance');
    }
    
    if (errorMessage.includes('User denied')) {
      return new Error('Transaction cancelled by user');
    }
    
    if (errorMessage.includes('Already registered')) {
      return new Error('User already registered');
    }
    
    if (errorMessage.includes('Invalid sponsor')) {
      return new Error('Invalid sponsor address');
    }
    
    if (errorMessage.includes('Level not active')) {
      return new Error('Previous level must be activated first');
    }
    
    // Возвращаем оригинальную ошибку если не можем распарсить
    return error;
  }

  /**
   * Форматирование адреса
   */
  formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Конвертация Wei в Ether
   */
  fromWei(value, unit = 'ether') {
    return this.web3.utils.fromWei(value.toString(), unit);
  }

  /**
   * Конвертация Ether в Wei
   */
  toWei(value, unit = 'ether') {
    return this.web3.utils.toWei(value.toString(), unit);
  }
}

// Создаем глобальный экземпляр
const contractManager = new ContractManager();

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = contractManager;
}

// Глобальная доступность
window.contractManager = contractManager;
