/**
 * Admin Controller для GlobalWay
 * Управляет административными функциями, правами доступа, делегированием
 */

class AdminController {
  constructor() {
    this.currentUserRole = null;
    this.currentUserAddress = null;
    this.permissions = [];
    this.statistics = {};
    this.delegations = [];
    this.withdrawalRequests = [];
    this.votingData = {};
    this.initialized = false;
  }

  /**
   * Привилегированные адреса из ТЗ
   */
  static PRIVILEGED_ADDRESSES = {
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

  /**
   * Права доступа по ролям
   */
  static ADMIN_PERMISSIONS = {
    owner: ['all'],
    founder: ['all'],
    director: ['delegation', 'mailing', 'support', 'news'],
    support: ['mailing', 'support', 'news']
  };

  /**
   * Пулы адресов из ТЗ
   */
  static POOL_ADDRESSES = {
    TREASURY: "0xe58f778236c1d3ccecf14ec1274761559685a336",
    OPS: "0x956c8350b874d01d32236eb2944089b54c3b9670", 
    DEV: "0xf8c5504dc1e5165a0748a3dc410384bfcbab13dd",
    CHARITY: "0x09c3bd32eb0617e29e41382b738c4e3cc932a611",
    TOKENOMICS: "0xbdc29886c91878c1ba9ce0626da5e1961324354f"
  };

  /**
   * Инициализация админ контроллера
   */
  async initialize() {
    try {
      await this.checkAdminAccess();
      
      if (this.currentUserRole) {
        this.setupPermissions();
        await this.loadStatistics();
        this.setupEventListeners();
        this.initializeRealTimeUpdates();
        
        this.initialized = true;
        console.log(`👑 Admin Controller initialized for role: ${this.currentUserRole}`);
        
        // Событие готовности админки
        window.dispatchEvent(new CustomEvent('adminReady', {
          detail: {
            role: this.currentUserRole,
            address: this.currentUserAddress,
            permissions: this.permissions
          }
        }));
      }
    } catch (error) {
      console.error('❌ Failed to initialize Admin Controller:', error);
      throw error;
    }
  }

  /**
   * Проверка административного доступа
   */
  async checkAdminAccess() {
    try {
      // Получаем адрес пользователя
      if (window.web3Manager && window.web3Manager.currentAccount) {
        this.currentUserAddress = window.web3Manager.currentAccount.toLowerCase();
      } else {
        throw new Error('Wallet not connected');
      }

      // Определяем роль
      this.currentUserRole = this.determineUserRole(this.currentUserAddress);
      
      if (!this.currentUserRole) {
        throw new Error('Access denied: insufficient privileges');
      }

      return true;
    } catch (error) {
      console.error('❌ Admin access check failed:', error);
      this.currentUserRole = null;
      this.currentUserAddress = null;
      return false;
    }
  }

  /**
   * Определение роли пользователя
   */
  determineUserRole(address) {
    address = address.toLowerCase();
    
    if (AdminController.PRIVILEGED_ADDRESSES.OWNER.toLowerCase() === address) {
      return 'owner';
    }
    
    if (AdminController.PRIVILEGED_ADDRESSES.FOUNDERS.map(a => a.toLowerCase()).includes(address)) {
      return 'founder';
    }
    
    if (AdminController.PRIVILEGED_ADDRESSES.DIRECTORS.map(a => a.toLowerCase()).includes(address)) {
      return 'director';
    }
    
    return null;
  }

  /**
   * Настройка прав доступа
   */
  setupPermissions() {
    this.permissions = AdminController.ADMIN_PERMISSIONS[this.currentUserRole] || [];
    console.log(`🔐 Permissions set for ${this.currentUserRole}:`, this.permissions);
  }

  /**
   * Проверка права доступа к функции
   */
  hasPermission(permission) {
    return this.permissions.includes('all') || this.permissions.includes(permission);
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Бесплатная активация
    this.bindEvent('activateUser', () => this.activateUser());
    this.bindEvent('batchActivateTeam', () => this.batchActivateTeam());
    this.bindEvent('setPermission', () => this.setUserPermission());

    // Управление контрактами
    this.bindEvent('pauseContract', () => this.pauseContract());
    this.bindEvent('unpauseContract', () => this.unpauseContract());
    this.bindEvent('connectProject', () => this.connectProject());
    this.bindEvent('disconnectProject', () => this.disconnectProject());

    // Блокировка пользователей
    this.bindEvent('blockUser', () => this.blockUser());
    this.bindEvent('replaceAddress', () => this.replaceUserAddress());

    // Финансы
    this.bindEvent('submitWithdrawal', () => this.submitWithdrawal());
    this.setupWithdrawalTabs();

    // Делегирование
    this.bindEvent('delegatePermissions', () => this.delegatePermissions());

    // Проекты
    this.bindEvent('saveProjectChanges', () => this.saveProjectChanges());
    this.bindEvent('addRoadmapItem', () => this.addRoadmapItem());

    // Рассылка
    this.bindEvent('sendMessage', () => this.sendMessage());
    this.bindEvent('previewMessage', () => this.previewMessage());

    // Новости
    this.bindEvent('publishNews', () => this.publishNews());
    this.bindEvent('saveDraftNews', () => this.saveDraftNews());

    // Обновление статистики
    this.bindEvent('refreshStats', () => this.loadStatistics());
  }

  /**
   * Привязка события к элементу
   */
  bindEvent(elementId, callback) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', callback);
    }
  }

  /**
   * Загрузка статистики в реальном времени
   */
  async loadStatistics() {
    if (!this.hasPermission('dashboard')) return;

    try {
      const refreshBtn = document.getElementById('refreshStats');
      if (refreshBtn) {
        window.uiController?.showLoadingState(refreshBtn, 'Updating...');
      }

      // Получение статистики из контрактов
      const stats = await this.fetchContractStatistics();
      
      // Обновление UI
      this.updateStatisticsUI(stats);
      
      // Сохранение в кеш
      this.statistics = stats;
      
      window.uiController?.showNotification('Statistics updated successfully', 'success');
      
    } catch (error) {
      console.error('Error loading statistics:', error);
      window.uiController?.showNotification('Failed to load statistics', 'error');
    } finally {
      const refreshBtn = document.getElementById('refreshStats');
      if (refreshBtn) {
        window.uiController?.hideLoadingState(refreshBtn);
      }
    }
  }

  /**
   * Получение статистики из контрактов
   */
  async fetchContractStatistics() {
    try {
      // Здесь будет реальная интеграция с контрактами
      // Пока используем заглушки с реалистичными данными
      const stats = {
        users: {
          total: await this.getRandomStat(1200, 1300),
          active: await this.getRandomStat(800, 900),
          todayRegistrations: await this.getRandomStat(20, 30),
          byLevel: {
            1: 347, 2: 298, 3: 234, 4: 189, 
            5: 156, 6: 123, 7: 98, 8: 76,
            9: 54, 10: 32, 11: 18, 12: 12
          }
        },
        finances: {
          contractBalance: await this.getRandomStat(240, 260),
          totalVolume: await this.getRandomStat(15000, 16000),
          poolBalances: {
            treasury: await this.getRandomStat(85, 95),
            charity: await this.getRandomStat(55, 65),
            development: await this.getRandomStat(30, 40),
            tokenomics: await this.getRandomStat(60, 70)
          }
        },
        tokens: {
          totalSupply: 1000000000,
          circulating: await this.getRandomStat(120000000, 130000000),
          currentPrice: (Math.random() * 0.01 + 0.005).toFixed(6),
          tradingVolume24h: await this.getRandomStat(50000, 100000)
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching contract statistics:', error);
      throw error;
    }
  }

  /**
   * Генерация случайной статистики для демонстрации
   */
  async getRandomStat(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Обновление UI статистики
   */
  updateStatisticsUI(stats) {
    const updates = [
      ['totalUsers', stats.users.total],
      ['statTotalUsers', stats.users.total],
      ['statActiveUsers', stats.users.active],
      ['statTodayRegistrations', stats.users.todayRegistrations],
      ['contractBalance', stats.finances.contractBalance.toFixed(3)],
      ['statContractBalance', stats.finances.contractBalance.toFixed(3)],
      ['statTotalVolume', stats.finances.totalVolume.toFixed(2)],
      ['statTreasury', stats.finances.poolBalances.treasury.toFixed(3)],
      ['statCharity', stats.finances.poolBalances.charity.toFixed(3)],
      ['statDevelopment', stats.finances.poolBalances.development.toFixed(3)],
      ['statTokenomics', stats.finances.poolBalances.tokenomics.toFixed(3)],
      ['statCirculating', this.formatNumber(stats.tokens.circulating)],
      ['statCurrentPrice', stats.tokens.currentPrice]
    ];

    updates.forEach(([elementId, value]) => {
      this.updateStatWithAnimation(elementId, value);
    });
  }

  /**
   * Обновление статистики с анимацией
   */
  updateStatWithAnimation(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('animate-success');
      element.textContent = value;
      setTimeout(() => element.classList.remove('animate-success'), 600);
    }
  }

  /**
   * Форматирование чисел
   */
  formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * Бесплатная активация пользователя
   */
  async activateUser() {
    if (!this.hasPermission('dashboard')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    const userAddress = document.getElementById('activationUserAddress')?.value;
    const sponsorAddress = document.getElementById('activationSponsorAddress')?.value;
    const maxLevel = document.getElementById('activationMaxLevel')?.value;

    if (!userAddress || !sponsorAddress) {
      window.uiController?.showNotification('Please fill all required fields', 'error');
      return;
    }

    if (!this.isValidAddress(userAddress) || !this.isValidAddress(sponsorAddress)) {
      window.uiController?.showNotification('Invalid wallet address format', 'error');
      return;
    }

    try {
      const activateBtn = document.getElementById('activateUser');
      window.uiController?.showLoadingState(activateBtn, 'Activating...');

      // Вызов смарт-контракта
      if (window.contractManager) {
        await window.contractManager.freeActivateUser(userAddress, sponsorAddress, maxLevel);
      }

      // Логирование операции
      this.logAdminAction('USER_ACTIVATION', {
        userAddress,
        sponsorAddress,
        maxLevel,
        executor: this.currentUserAddress
      });

      window.uiController?.showNotification(
        `User activated successfully with ${maxLevel} levels`, 
        'success'
      );

      // Очистка формы
      document.getElementById('activationUserAddress').value = '';
      document.getElementById('activationSponsorAddress').value = '';

    } catch (error) {
      console.error('Error activating user:', error);
      window.uiController?.showNotification(
        `Activation failed: ${error.message}`, 
        'error'
      );
    } finally {
      const activateBtn = document.getElementById('activateUser');
      window.uiController?.hideLoadingState(activateBtn);
    }
  }

  /**
   * Пакетная активация команды
   */
  async batchActivateTeam() {
    if (!this.hasPermission('dashboard')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    const members = document.getElementById('batchMembers')?.value.split('\n').filter(a => a.trim());
    const sponsors = document.getElementById('batchSponsors')?.value.split('\n').filter(a => a.trim());
    const levels = document.getElementById('batchLevels')?.value.split('\n').filter(l => l.trim());

    if (!members?.length || !sponsors?.length || !levels?.length) {
      window.uiController?.showNotification('Please fill all fields', 'error');
      return;
    }

    if (members.length !== sponsors.length || members.length !== levels.length) {
      window.uiController?.showNotification(
        'Members, sponsors and levels must have the same count', 
        'error'
      );
      return;
    }

    // Валидация адресов
    const invalidAddresses = [...members, ...sponsors].filter(addr => !this.isValidAddress(addr));
    if (invalidAddresses.length > 0) {
      window.uiController?.showNotification(
        `Invalid addresses found: ${invalidAddresses.join(', ')}`, 
        'error'
      );
      return;
    }

    try {
      const batchBtn = document.getElementById('batchActivateTeam');
      window.uiController?.showLoadingState(batchBtn, 'Processing...');

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < members.length; i++) {
        try {
          if (window.contractManager) {
            await window.contractManager.freeActivateUser(members[i], sponsors[i], levels[i]);
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to activate ${members[i]}:`, error);
          failureCount++;
        }
      }

      // Логирование пакетной операции
      this.logAdminAction('BATCH_ACTIVATION', {
        totalMembers: members.length,
        successCount,
        failureCount,
        executor: this.currentUserAddress
      });

      window.uiController?.showNotification(
        `Batch activation completed: ${successCount} success, ${failureCount} failed`, 
        successCount > 0 ? 'success' : 'warning'
      );

      if (successCount > 0) {
        // Очистка полей при успехе
        document.getElementById('batchMembers').value = '';
        document.getElementById('batchSponsors').value = '';
        document.getElementById('batchLevels').value = '';
      }

    } catch (error) {
      console.error('Error in batch activation:', error);
      window.uiController?.showNotification('Batch activation failed', 'error');
    } finally {
      const batchBtn = document.getElementById('batchActivateTeam');
      window.uiController?.hideLoadingState(batchBtn);
    }
  }

  /**
   * Управление контрактами
   */
  async pauseContract() {
    if (!this.hasPermission('addresses')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    if (!confirm('Are you sure you want to pause the contract? This will stop all operations.')) {
      return;
    }

    try {
      if (window.contractManager) {
        await window.contractManager.pauseContract();
      }

      this.logAdminAction('CONTRACT_PAUSED', {
        executor: this.currentUserAddress,
        timestamp: Date.now()
      });

      window.uiController?.showNotification('Contract paused successfully', 'warning');
    } catch (error) {
      console.error('Error pausing contract:', error);
      window.uiController?.showNotification('Failed to pause contract', 'error');
    }
  }

  async unpauseContract() {
    if (!this.hasPermission('addresses')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    try {
      if (window.contractManager) {
        await window.contractManager.unpauseContract();
      }

      this.logAdminAction('CONTRACT_UNPAUSED', {
        executor: this.currentUserAddress,
        timestamp: Date.now()
      });

      window.uiController?.showNotification('Contract unpaused successfully', 'success');
    } catch (error) {
      console.error('Error unpausing contract:', error);
      window.uiController?.showNotification('Failed to unpause contract', 'error');
    }
  }

  /**
   * Вывод средств
   */
  async submitWithdrawal() {
    if (!this.hasPermission('finances')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    const address = document.getElementById('withdrawalAddress')?.value;
    const amount = parseFloat(document.getElementById('withdrawalAmount')?.value);
    const note = document.getElementById('withdrawalNote')?.value;
    const activePool = document.querySelector('.withdrawal-tab-btn.active')?.dataset.pool;

    if (!address || !amount || !activePool) {
      window.uiController?.showNotification('Please fill all required fields', 'error');
      return;
    }

    if (!this.isValidAddress(address)) {
      window.uiController?.showNotification('Invalid withdrawal address', 'error');
      return;
    }

    // Проверка лимитов
    const needsVoting = this.needsVotingForWithdrawal(activePool, amount);
    
    if (needsVoting && !this.hasVotingRights()) {
      window.uiController?.showNotification('Insufficient voting rights', 'error');
      return;
    }

    try {
      const withdrawalData = {
        id: Date.now().toString(),
        pool: activePool,
        address: address,
        amount: amount,
        note: note,
        needsVoting: needsVoting,
        submittedBy: this.currentUserAddress,
        timestamp: Date.now(),
        status: needsVoting ? 'pending_vote' : 'approved'
      };

      if (needsVoting) {
        // Инициация голосования
        await this.initiateVoting(withdrawalData);
        window.uiController?.showNotification(
          'Withdrawal submitted for voting (minimum 8 votes required)', 
          'info'
        );
      } else {
        // Прямое выполнение
        await this.executeWithdrawal(withdrawalData);
        window.uiController?.showNotification('Withdrawal executed successfully', 'success');
      }

      // Логирование
      this.logAdminAction('WITHDRAWAL_SUBMITTED', withdrawalData);

      // Очистка формы
      document.getElementById('withdrawalAddress').value = '';
      document.getElementById('withdrawalAmount').value = '';
      document.getElementById('withdrawalNote').value = '';

    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      window.uiController?.showNotification('Withdrawal submission failed', 'error');
    }
  }

  /**
   * Проверка необходимости голосования
   */
  needsVotingForWithdrawal(pool, amount) {
    if (pool === 'emergency') return true;
    return amount > 5; // Лимит 5 BNB без голосования
  }

  /**
   * Проверка прав голосования
   */
  hasVotingRights() {
    return ['owner', 'founder', 'director'].includes(this.currentUserRole);
  }

  /**
   * Инициация голосования
   */
  async initiateVoting(withdrawalData) {
    this.votingData[withdrawalData.id] = {
      ...withdrawalData,
      votes: [],
      votesFor: 0,
      votesAgainst: 0,
      abstained: 0,
      requiredVotes: 8
    };

    // Уведомление всех с правами голосования
    this.notifyVoters(withdrawalData);
  }

  /**
   * Уведомление избирателей
   */
  notifyVoters(withdrawalData) {
    const message = `New withdrawal request requires voting: ${withdrawalData.amount} BNB from ${withdrawalData.pool} pool`;
    
    // Здесь будет отправка уведомлений всем учредителям и директорам
    console.log('Voting notification sent:', message);
  }

  /**
   * Выполнение вывода средств
   */
  async executeWithdrawal(withdrawalData) {
    // Здесь будет вызов смарт-контракта для вывода
    if (window.contractManager) {
      await window.contractManager.withdrawFunds(
        withdrawalData.pool,
        withdrawalData.address,
        withdrawalData.amount
      );
    }
  }

  /**
   * Делегирование полномочий
   */
  async delegatePermissions() {
    if (!this.hasPermission('delegation')) {
      window.uiController?.showNotification('Access denied', 'error');
      return;
    }

    const partnerAddress = document.getElementById('delegationAddress')?.value;
    const note = document.getElementById('delegationNote')?.value;
    
    // Собираем выбранные права
    const selectedPermissions = Array.from(
      document.querySelectorAll('input[name="permissions"]:checked')
    ).map(input => input.value);

    if (!partnerAddress || selectedPermissions.length === 0) {
      window.uiController?.showNotification('Please fill all required fields', 'error');
      return;
    }

    if (!this.isValidAddress(partnerAddress)) {
      window.uiController?.showNotification('Invalid partner address', 'error');
      return;
    }

    // Проверка прав делегирования
    if (!this.canDelegate(selectedPermissions)) {
      window.uiController?.showNotification('You cannot delegate these permissions', 'error');
      return;
    }

    try {
      const delegationData = {
        id: Date.now().toString(),
        partnerAddress: partnerAddress,
        permissions: selectedPermissions,
        note: note,
        delegatedBy: this.currentUserAddress,
        delegatedByRole: this.currentUserRole,
        timestamp: Date.now(),
        status: 'active'
      };

      // Сохранение делегирования
      this.delegations.push(delegationData);
      
      // Логирование
      this.logAdminAction('PERMISSIONS_DELEGATED', delegationData);

      window.uiController?.showNotification(
        `Permissions delegated successfully to ${partnerAddress.slice(0, 8)}...`, 
        'success'
      );

      // Обновление таблицы делегирований
      this.updateDelegationTable();

      // Очистка формы
      document.getElementById('delegationAddress').value = '';
      document.getElementById('delegationNote').value = '';
      document.querySelectorAll('input[name="permissions"]').forEach(input => {
        input.checked = false;
      });

    } catch (error) {
      console.error('Error delegating permissions:', error);
      window.uiController?.showNotification('Delegation failed', 'error');
    }
  }

  /**
   * Проверка возможности делегирования
   */
  canDelegate(permissions) {
    // Владелец может делегировать все
    if (this.currentUserRole === 'owner') return true;
    
    // Учредители могут делегировать своей команде
    if (this.currentUserRole === 'founder') return true;
    
    // Директора имеют ограниченные права
    if (this.currentUserRole === 'director') {
      const allowedForDirectors = ['mailing', 'support', 'news'];
      return permissions.every(perm => allowedForDirectors.includes(perm));
    }
    
    return false;
  }

  /**
   * Обновление таблицы делегирований
   */
  updateDelegationTable() {
    const tableBody = document.getElementById('delegationTable');
    if (!tableBody) return;

    tableBody.innerHTML = this.delegations.map(delegation => `
      <tr>
        <td>${delegation.partnerAddress.slice(0, 8)}...${delegation.partnerAddress.slice(-4)}</td>
        <td>${delegation.permissions.join('/')}</td>
        <td>${delegation.delegatedByRole.toUpperCase()}</td>
        <td>${new Date(delegation.timestamp).toLocaleDateString()}</td>
        <td>
          <button class="btn-danger btn-sm" onclick="adminController.revokeDelegation('${delegation.id}')">
            Revoke
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Отзыв делегирования
   */
  async revokeDelegation(delegationId) {
    const delegation = this.delegations.find(d => d.id === delegationId);
    if (!delegation) return;

    if (!confirm(`Revoke permissions for ${delegation.partnerAddress}?`)) {
      return;
    }

    try {
      // Помечаем как отозванное
      delegation.status = 'revoked';
      delegation.revokedAt = Date.now();
      delegation.revokedBy = this.currentUserAddress;

      this.logAdminAction('PERMISSIONS_REVOKED', {
        delegationId,
        partnerAddress: delegation.partnerAddress,
        revokedBy: this.currentUserAddress
      });

      window.uiController?.showNotification('Permissions revoked successfully', 'success');
      this.updateDelegationTable();

    } catch (error) {
      console.error('Error revoking delegation:', error);
      window.uiController?.showNotification('Failed to revoke permissions', 'error');
    }
  }

  /**
   * Настройка табов вывода средств
   */
  setupWithdrawalTabs() {
    const withdrawalTabs = document.querySelectorAll('.withdrawal-tab-btn');
    
    withdrawalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        withdrawalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const pool = tab.dataset.pool;
        this.updateWithdrawalLimits(pool);
      });
    });
    
    // Отслеживание изменения суммы
    const amountInput = document.getElementById('withdrawalAmount');
    if (amountInput) {
      amountInput.addEventListener('input', (e) => {
        const amount = parseFloat(e.target.value) || 0;
        const activePool = document.querySelector('.withdrawal-tab-btn.active')?.dataset.pool;
        
        const votingSection = document.getElementById('votingSection');
        if (votingSection) {
          if (this.needsVotingForWithdrawal(activePool, amount)) {
            votingSection.style.display = 'block';
          } else {
            votingSection.style.display = 'none';
          }
        }
      });
    }
  }

  /**
   * Обновление лимитов вывода
   */
  updateWithdrawalLimits(pool) {
    const limitElement = document.getElementById('amountLimit');
    if (!limitElement) return;

    const limits = {
      charity: 'Limit without voting: 5 BNB',
      treasury: 'Limit without voting: 5 BNB',
      development: 'Limit without voting: 5 BNB',
      emergency: 'Voting required for any amount'
    };
    
    limitElement.textContent = limits[pool] || 'Unknown pool';
  }

  /**
   * Инициализация обновлений в реальном времени
   */
  initializeRealTimeUpdates() {
    // Обновление статистики каждые 30 секунд
    setInterval(() => {
      if (this.hasPermission('dashboard')) {
        this.loadStatistics();
      }
    }, 30000);

    // Проверка голосований каждые 60 секунд
    setInterval(() => {
      this.checkVotingStatus();
    }, 60000);
  }

  /**
   * Проверка статуса голосований
   */
  checkVotingStatus() {
    Object.values(this.votingData).forEach(voting => {
      if (voting.status === 'pending_vote' && voting.votesFor >= voting.requiredVotes) {
        this.executeVotedWithdrawal(voting);
      }
    });
  }

  /**
   * Выполнение одобренного голосованием вывода
   */
  async executeVotedWithdrawal(voting) {
    try {
      await this.executeWithdrawal(voting);
      voting.status = 'executed';
      voting.executedAt = Date.now();
      
      window.uiController?.showNotification(
        `Withdrawal executed: ${voting.amount} BNB from ${voting.pool}`, 
        'success'
      );
    } catch (error) {
      console.error('Error executing voted withdrawal:', error);
      voting.status = 'failed';
    }
  }

  /**
   * Валидация адреса кошелька
   */
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Логирование административных действий
   */
  logAdminAction(action, data) {
    const logEntry = {
      action,
      data,
      executor: this.currentUserAddress,
      executorRole: this.currentUserRole,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    // Сохранение в localStorage (в реальном проекте - на сервер)
    const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('admin_logs', JSON.stringify(logs));

    console.log('Admin action logged:', logEntry);
  }

  /**
   * Заглушки для остальных методов
   */
  async setUserPermission() { 
    window.uiController?.showNotification('Permission set successfully', 'success'); 
  }
  
  async connectProject() { 
    window.uiController?.showNotification('Project connected', 'success'); 
  }
  
  async disconnectProject() { 
    window.uiController?.showNotification('Project disconnected', 'warning'); 
  }
  
  async blockUser() { 
    window.uiController?.showNotification('User blocked', 'warning'); 
  }
  
  async replaceUserAddress() { 
    window.uiController?.showNotification('Address replaced', 'success'); 
  }
  
  async saveProjectChanges() { 
    window.uiController?.showNotification('Project changes saved', 'success'); 
  }
  
  async addRoadmapItem() { 
    window.uiController?.showNotification('Roadmap item added', 'success'); 
  }
  
  async sendMessage() { 
    window.uiController?.showNotification('Message sent to all recipients', 'success'); 
  }
  
  async previewMessage() { 
    window.uiController?.showModal('previewModal', { title: 'Message Preview' }); 
  }
  
  async publishNews() { 
    window.uiController?.showNotification('News published successfully', 'success'); 
  }
  
  async saveDraftNews() { 
    window.uiController?.showNotification('News saved as draft', 'success'); 
  }

  /**
   * Проверка готовности
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Получение роли пользователя
   */
  getUserRole() {
    return this.currentUserRole;
  }

  /**
   * Получение адреса пользователя
   */
  getUserAddress() {
    return this.currentUserAddress;
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    this.initialized = false;
    this.delegations = [];
    this.withdrawalRequests = [];
    this.votingData = {};
    console.log('Admin Controller destroyed');
  }
}

// Создание глобального экземпляра
const adminController = new AdminController();

// Глобальная доступность
window.adminController = adminController;

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = adminController;
}
