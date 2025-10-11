// ui.js - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
class UIManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.currentLevel = 1;
    this.currentMatrixLevel = 1;
    this.userInfo = null;
    this.userStats = null;
    this.buyingLevel = false;
    this.adminAutoOpened = false;
  }

  async init() {
    await this.loadComponents();
    this.setupNavigation();
    this.setupModals();
    await this.updateUI();
  }

  async loadComponents() {
    const components = ['dashboard', 'partners', 'matrix', 'tokens', 'projects', 'admin'];
    for (const comp of components) {
      try {
        const response = await fetch(`components/${comp}.html`);
        const html = await response.text();
        const element = document.getElementById(comp);
        if (element) {
          element.innerHTML = html;
        }
      } catch (error) {
        console.error(`Error loading component ${comp}:`, error);
      }
    }
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        this.showPage(page);
      });
    });
  }

  showPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const pageElement = document.getElementById(page);
    if (pageElement) pageElement.classList.add('active');
    
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    this.currentPage = page;
    this.loadPageData(page);
  }

  async loadPageData(page) {
    Utils.showLoader(true);
    try {
      switch(page) {
        case 'dashboard':
          await this.loadDashboard();
          break;
        case 'partners':
          await this.loadPartners();
          break;
        case 'matrix':
          await this.loadMatrix();
          break;
        case 'tokens':
          await this.loadTokens();
          break;
        case 'projects':
          await this.loadProjects();
          break;
        case 'admin':
          await this.loadAdmin();
          break;
      }
    } catch (error) {
      console.error('Error loading page:', error);
      Utils.showNotification('Error loading data', 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async updateUI() {
    if (!web3Manager.connected) {
      this.showConnectionAlert();
      return;
    }

    await this.loadUserData();
    this.updateHeader();
    this.updateCabinet();
  
    // ✅ ИСПРАВЛЕНО: Показываем админ-элементы СРАЗУ
    if (web3Manager.isAdmin()) {
      console.log('✅ Admin access granted');
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = '';
        console.log('✅ Showing admin element:', el.className);
      });

      // Теперь пытаемся открыть админку автоматически
      if ((web3Manager.isOwner() || web3Manager.isFounder()) && !this.adminAutoOpened) {
        this.adminAutoOpened = true;
        console.log('🔄 Attempting to auto-open admin panel...');
        
        // Простое решение: просто открываем страницу admin через 2 секунды
        setTimeout(() => {
          this.showPage('admin');
          console.log('✅ Admin panel auto-opened');
        }, 2000);
      }
    }
  }

  // ✅ ИСПРАВЛЕНО: Добавлена обработка ошибок сети
  async loadUserData() {
    try {
      const addr = web3Manager && web3Manager.address ? web3Manager.address : null;
      if (!addr) {
        console.warn('loadUserData: no address available yet');
        this.userStats = { 
          activeLevels: [], 
          leaderRank: 0,
          isRegistered: false,
          personalInvites: 0,
          totalEarned: ethers.BigNumber.from(0),
          referrals: []
        };
        return;
      }

      // ✅ ИСПРАВЛЕНО: Обработка ошибок сети
      let info;
      try {
        info = await contracts.getUserFullInfo(addr);
      } catch (networkError) {
        console.error('Network error loading user data:', networkError);
        Utils.showNotification('Network error. Please check your connection to opBNB.', 'error');
        this.userStats = { 
          activeLevels: [], 
          leaderRank: 0,
          isRegistered: false,
          personalInvites: 0,
          totalEarned: ethers.BigNumber.from(0),
          referrals: []
        };
        return;
      }

      // Преобразуем все BigNumber и Proxy объекты в обычные значения
      this.userStats = {
        isRegistered: Boolean(info.isRegistered),
        sponsor: info.sponsor || ethers.constants.AddressZero,
        registrationTime: info.registrationTime,
        lastActivity: info.lastActivity,
        personalInvites: info.personalInvites && typeof info.personalInvites.toNumber === 'function'
          ? info.personalInvites.toNumber()
          : Number(info.personalInvites || 0),
        totalEarned: info.totalEarned || ethers.BigNumber.from(0),
        isInactive: Boolean(info.isInactive),
        userId: info.userId,
        leaderRank: 0,
        activeLevels: [],
        referrals: info.referrals || [],
        isInvestor: Boolean(info.isInvestor)
      };

      // Преобразуем activeLevels правильно
      if (Array.isArray(info.activeLevels)) {
        this.userStats.activeLevels = info.activeLevels.map(l => {
          if (l && typeof l.toNumber === 'function') return l.toNumber();
          return Number(l);
        });
      }

      // Получаем leaderRank из LeaderPool
      try {
        if (contracts.contracts.leaderPool) {
          const rank = await contracts.contracts.leaderPool.getUserRank(addr);
          this.userStats.leaderRank = rank && typeof rank.toNumber === 'function' 
            ? rank.toNumber() 
            : Number(rank || 0);
          console.log('✅ Leader rank loaded:', this.userStats.leaderRank);
        }
      } catch (e) {
        console.warn('⚠️ LeaderPool not available:', e.message);
        this.userStats.leaderRank = 0;
      }

      console.log('✅ User data loaded:', this.userStats);

    } catch (error) {
      console.error('Error loading user data:', error);
      this.userStats = { 
        activeLevels: [], 
        leaderRank: 0,
        isRegistered: false,
        personalInvites: 0,
        totalEarned: ethers.BigNumber.from(0),
        referrals: []
      };
    }
  }

  showConnectionAlert() {
    const alert = document.getElementById('connectionAlert');
    const message = document.getElementById('alertMessage');
    const action = document.getElementById('alertAction');
    
    if (!web3Manager.connected) {
      if (message) message.textContent = 'Please connect your wallet';
      if (action) {
        action.textContent = 'Connect';
        action.onclick = () => app.connectWallet();
      }
    } else if (!this.userStats?.isRegistered) {
      if (message) message.textContent = 'You need to register first';
      if (action) {
        action.textContent = 'Register';
        action.onclick = () => this.showRegistrationModal();
      }
    }
    
    if (alert) alert.style.display = 'block';
  }

  updateHeader() {
    const status = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectBtn');
    
    if (web3Manager.connected && connectBtn) {
      connectBtn.textContent = Utils.formatAddress(web3Manager.address);
      if (status) status.classList.add('connected');
    }
  }

  updateCabinet() {
    const userAddressEl = document.getElementById('userAddress');
    if (userAddressEl) {
      userAddressEl.textContent = Utils.formatAddress(web3Manager.address);
    }
  
    web3Manager.getBalance().then(balance => {
      const balanceEl = document.getElementById('userBalance');
      if (balanceEl) {
        balanceEl.textContent = `${Utils.formatBNB(balance)} BNB`;
      }
    }).catch(error => {
      console.error('Error getting balance:', error);
    });
  
    if (this.userStats && this.userStats.userId) {
      const userId = this.userStats.userId.toNumber ? this.userStats.userId.toNumber() : Number(this.userStats.userId);
      const userIdEl = document.getElementById('userId');
      const userRankEl = document.getElementById('userRank');
      const refLinkEl = document.getElementById('refLink');
      
      if (userIdEl) userIdEl.textContent = Utils.formatUserId(userId);
      if (userRankEl) userRankEl.textContent = Utils.getRankName(this.userStats.leaderRank);
      
      if (refLinkEl) {
        const refLink = `${window.location.origin}?ref=${userId}`;
        refLinkEl.value = refLink;
      }
    }
  }

  // === DASHBOARD ===

  async loadDashboard() {
    this.setupLevelButtons();
    this.setupBulkButtons();
    await this.loadQuarterlyInfo();
    await this.loadEarnings();
    await this.loadHistory();
    await this.loadTokensSummary();
  }

  async buyLevel(level) {
    if (this.buyingLevel) {
      console.log('⚠️ Purchase already in progress');
      return;
    }

    const isActive = this.userStats?.activeLevels.includes(level);
    if (isActive) {
      Utils.showNotification('Level already purchased', 'error');
      return;
    }

    const price = CONFIG.LEVEL_PRICES[level - 1];
    if (!confirm(`Buy level ${level} for ${price} BNB?`)) return;

    this.buyingLevel = true;
    Utils.showLoader(true);

    try {
      console.log(`🔄 Buying level ${level}...`);
      const tx = await contracts.buyLevel(level);
      console.log('✅ Level purchased:', tx);
  
      await this.loadUserData();
      await this.updateUI();
      await this.loadDashboard();
      
      Utils.showNotification(`Level ${level} activated successfully!`, 'success');
    } catch (error) {
      console.error('❌ Error buying level:', error);
      Utils.showNotification('Transaction failed: ' + error.message, 'error');
    } finally {
      this.buyingLevel = false;
      Utils.showLoader(false);
    }
  }

  setupLevelButtons() {
    const container = document.getElementById('individualLevels');
    if (!container) return;
    
    container.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.dataset.level = i;
    
      const isActive = this.userStats?.activeLevels.includes(i);
      
      btn.innerHTML = `
        <span class="level-num">${i}</span>
        <span class="level-price">${CONFIG.LEVEL_PRICES[i-1]} BNB</span>
        ${isActive ? '<span style="color:#00ff00;font-size:10px;margin-top:2px;">✓ КУПЛЕНО</span>' : ''}
      `;
  
      if (isActive) {
        btn.classList.add('purchased', 'activated');
        btn.disabled = true;
        btn.style.cssText = `
          opacity: 0.5 !important; 
          cursor: not-allowed !important; 
          background: linear-gradient(135deg, #6c757d, #5a6268) !important;
          border-color: #6c757d !important;
          pointer-events: none !important;
        `;
        btn.setAttribute('disabled', 'true');
      } else {
        btn.addEventListener('click', () => {
          if (!this.buyingLevel) {
            this.buyLevel(i);
          }
        });
      }
    
      container.appendChild(btn);
    }
  }

  setupBulkButtons() {
    document.querySelectorAll('.bulk-btn').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    
      newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
      
        if (this.buyingLevel) {
          console.log('Already buying');
          return;
        }
        
        const maxLevel = parseInt(newBtn.dataset.levels);
        const packageType = parseInt(newBtn.dataset.package);
        await this.buyPackage(packageType, maxLevel);
      }, { once: false });
    });
  }

  async loadQuarterlyInfo() {
    if (!this.userStats || !this.userStats.isRegistered) {
      console.log('⚠️ User not registered, skipping quarterly info');
      const quarterlyEl = document.getElementById('quarterlyActivity');
      if (quarterlyEl) quarterlyEl.style.display = 'none';
      return;
    }

    try {
      const quarterlyInfo = await contracts.getUserQuarterlyInfo(web3Manager.address);
      
      const lastPayment = quarterlyInfo.lastPayment && typeof quarterlyInfo.lastPayment.toNumber === 'function'
        ? quarterlyInfo.lastPayment.toNumber()
        : Number(quarterlyInfo.lastPayment || 0);
        
      const quarterCount = quarterlyInfo.quarterCount && typeof quarterlyInfo.quarterCount.toNumber === 'function'
        ? quarterlyInfo.quarterCount.toNumber()
        : Number(quarterlyInfo.quarterCount || 0);
      
      let nextPayment;
      if (lastPayment > 0) {
        nextPayment = lastPayment + (90 * 86400);
      } else {
        const regTime = this.userStats.registrationTime && typeof this.userStats.registrationTime.toNumber === 'function'
          ? this.userStats.registrationTime.toNumber()
          : Math.floor(Date.now() / 1000);
        nextPayment = regTime + (90 * 86400);
      }
  
      const currentQuarterEl = document.getElementById('currentQuarter');
      const lastPaymentEl = document.getElementById('lastPayment');
      const nextPaymentEl = document.getElementById('nextPayment');
      
      if (currentQuarterEl) currentQuarterEl.textContent = quarterCount || '0';
      if (lastPaymentEl) lastPaymentEl.textContent = lastPayment > 0 ? Utils.formatDate(lastPayment) : 'Not paid yet';
      if (nextPaymentEl) nextPaymentEl.textContent = Utils.formatDate(nextPayment);
  
      const daysLeft = Utils.getDaysUntil(nextPayment);
      if (daysLeft <= 10 && daysLeft > 0) {
        const warning = document.getElementById('paymentWarning');
        const daysRemainingEl = document.getElementById('daysRemaining');
        if (warning && daysRemainingEl) {
          daysRemainingEl.textContent = daysLeft;
          warning.style.display = 'flex';
        }
      }
  
      const payActivityBtn = document.getElementById('payActivityBtn');
      if (payActivityBtn) {
        const newBtn = payActivityBtn.cloneNode(true);
        payActivityBtn.parentNode.replaceChild(newBtn, payActivityBtn);
        newBtn.addEventListener('click', () => this.payQuarterly());
      }
    } catch (error) {
      console.error('Error loading quarterly info:', error);
      const quarterlyEl = document.getElementById('quarterlyActivity');
      if (quarterlyEl) quarterlyEl.style.display = 'none';
    }
  }

  // ✅ ИСПРАВЛЕНО: Улучшена обработка ошибок и показ лоадера
async loadEarnings() {
  if (!this.userStats) return;
  
  try {
    const container = document.getElementById('earningsRank');
    if (container) container.innerHTML = '';
    
    const totalEarned = ethers.utils.formatEther(this.userStats.totalEarned);
    
    let directBonus = 0;
    let partnerBonus = 0;
    let matrixBonus = parseFloat(totalEarned); // Используем totalEarned как матричный бонус
    let leaderBonus = 0;
    
    // ✅ ПРАВИЛЬНО: Проверяем РЕАЛЬНЫЕ события из контракта
    try {
      const provider = web3Manager.provider;
      const globalwayContract = contracts.contracts.globalway;
      
      if (provider && globalwayContract) {
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 2000);
        
        // ✅ Используем событие LevelActivated (оно точно есть)
        try {
          const levelActivatedFilter = globalwayContract.filters.LevelActivated(web3Manager.address);
          const levelEvents = await globalwayContract.queryFilter(levelActivatedFilter, fromBlock, currentBlock);
          console.log(`✅ Found ${levelEvents.length} LevelActivated events`);
        } catch (e) {
          console.warn('⚠️ LevelActivated event not found:', e.message);
        }
        
        // ✅ Проверяем наличие UserRegistered
        try {
          const userRegisteredFilter = globalwayContract.filters.UserRegistered(web3Manager.address);
          const regEvents = await globalwayContract.queryFilter(userRegisteredFilter, fromBlock, currentBlock);
          console.log(`✅ Found ${regEvents.length} UserRegistered events`);
        } catch (e) {
          console.warn('⚠️ UserRegistered event not found:', e.message);
        }
      }
    } catch (eventsError) {
      console.warn('⚠️ Could not load events:', eventsError.message);
    }
    
    const earnings = {
      'Direct Bonus': directBonus.toFixed(4),
      'Partner Bonus': partnerBonus.toFixed(4),
      'Matrix Bonus': matrixBonus.toFixed(4),
      'Leadership Bonus': leaderBonus.toFixed(4)
    };
    
    if (container) {
      for (const [label, value] of Object.entries(earnings)) {
        const item = document.createElement('div');
        item.className = 'earnings-item';
        item.innerHTML = `
          <span>${label}:</span>
          <span>${Utils.formatBNB(value)} BNB</span>
        `;
        container.appendChild(item);
      }
    }
    
    const totalIncomeEl = document.getElementById('totalIncome');
    if (totalIncomeEl) {
      totalIncomeEl.textContent = `${Utils.formatBNB(totalEarned)} BNB`;
    }
      
    const rankBadge = document.getElementById('currentRankBadge');
    if (rankBadge) {
      rankBadge.textContent = Utils.getRankName(this.userStats.leaderRank);
      rankBadge.className = `rank-badge rank-${this.userStats.leaderRank}`;
    }
    
    console.log('✅ Earnings loaded');
  } catch (error) {
    console.error('Error loading earnings:', error);
  }
}

async loadHistory() {
  const tbody = document.getElementById('historyTable');
  if (!tbody) return;
  
  try {
    const provider = web3Manager.provider;
    const globalwayContract = contracts.contracts.globalway;
    
    if (!provider || !globalwayContract) {
      tbody.innerHTML = '<tr><td colspan="6">Contract not initialized</td></tr>';
      return;
    }
    
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 4999);
    
    // ✅ ПРАВИЛЬНО: Используем событие LevelActivated (оно точно есть)
    try {
      const levelActivatedFilter = globalwayContract.filters.LevelActivated(web3Manager.address);
      const levelEvents = await globalwayContract.queryFilter(levelActivatedFilter, fromBlock, currentBlock);
      
      tbody.innerHTML = '';
      
      if (levelEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No transactions yet</td></tr>';
        return;
      }
      
      for (let i = 0; i < Math.min(levelEvents.length, 10); i++) {
        const event = levelEvents[i];
        const block = await provider.getBlock(event.blockNumber);
        const timestamp = block.timestamp;
        
        const level = event.args.level;
        const amount = ethers.utils.formatEther(event.args.amount);
        
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${Utils.formatDateTime(timestamp)}</td>
          <td>Level Purchase</td>
          <td>Level ${level}</td>
          <td class="amount-out">-${Utils.formatBNB(amount)} BNB</td>
          <td><a href="${CONFIG.NETWORK.explorer}/tx/${event.transactionHash}" target="_blank">View</a></td>
        `;
      }
      
      console.log('✅ History loaded with LevelActivated events');
    } catch (error) {
      console.error('Error loading LevelActivated events:', error);
      tbody.innerHTML = '<tr><td colspan="6">History will appear after activating levels</td></tr>';
    }
  } catch (error) {
    console.error('Error loading history:', error);
    tbody.innerHTML = '<tr><td colspan="6">Error loading history</td></tr>';
  }
}

  async loadTokensSummary() {
    try {
      const balance = await contracts.getTokenBalance(web3Manager.address);
      const price = await contracts.getRealTokenPrice();
      const value = parseFloat(balance) * parseFloat(price);
      
      const tokenAmountEl = document.getElementById('tokenAmount');
      const tokenPriceEl = document.getElementById('tokenPrice');
      const tokenValueEl = document.getElementById('tokenValue');
      
      if (tokenAmountEl) tokenAmountEl.textContent = `${Utils.formatNumber(balance)} GWT`;
      if (tokenPriceEl) tokenPriceEl.textContent = `$${Utils.formatNumber(price)}`;
      if (tokenValueEl) tokenValueEl.textContent = `$${Utils.formatNumber(value)}`;
    } catch (error) {
      console.error('Error loading tokens summary:', error);
    }
  }

  async buyPackage(packageType, maxLevel) {
    if (this.buyingLevel) return;
  
    if (!confirm(`Buy package 1-${maxLevel}?`)) return;
  
    this.buyingLevel = true;
    Utils.showLoader(true);
  
    try {
      const totalCost = await contracts.contracts.globalway.calculatePackagePrice(packageType);
      
      console.log(`📦 Activating package ${packageType} (levels 1-${maxLevel}), cost: ${ethers.utils.formatEther(totalCost)} BNB`);
      
      const tx = await contracts.contracts.globalway.activatePackage(packageType, { 
        value: totalCost 
      });
      
      await tx.wait();
      
      console.log('Package activated:', tx.hash);
      
      await this.loadUserData();
      await this.updateUI();
      await this.loadDashboard();
      
      Utils.showNotification(`Package 1-${maxLevel} activated!`, 'success');
    } catch (error) {
      console.error('Error buying package:', error);
      Utils.showNotification('Package activation failed: ' + error.message, 'error');
    } finally {
      this.buyingLevel = false;
      Utils.showLoader(false);
    }
  }

  async payQuarterly() {
    if (!confirm(`Pay quarterly activity for ${CONFIG.QUARTERLY_COST} BNB?`)) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.payQuarterlyActivity(null);
      Utils.showNotification('Quarterly payment successful!', 'success');
      await this.loadQuarterlyInfo();
    } catch (error) {
      console.error('Error paying quarterly:', error);
      Utils.showNotification('Payment failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  // === PARTNERS ===

  async loadPartners() {
    this.setupPartnerLevels();
    await this.loadPartnerStats();
    await this.loadQualifications();
    await this.loadPartnerEarnings();
  }

  setupPartnerLevels() {
    const container = document.getElementById('partnerLevels');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      if (i === this.currentLevel) btn.classList.add('active');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        this.currentLevel = i;
        this.loadPartnerLevel(i);
      });
      container.appendChild(btn);
    }
    
    this.loadPartnerLevel(1);
  }

  async loadPartnerLevel(level) {
    document.querySelectorAll('#partnerLevels .level-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i + 1 === level);
    });
    
    const currentLevelNumEl = document.getElementById('currentLevelNum');
    const currentLevelCostEl = document.getElementById('currentLevelCost');
    
    if (currentLevelNumEl) currentLevelNumEl.textContent = level;
    if (currentLevelCostEl) currentLevelCostEl.textContent = `${CONFIG.LEVEL_PRICES[level-1]} BNB`;
    
    await this.loadPartnerTable(level);
  }

  async loadPartnerTable(level) {
    const tbody = document.getElementById('partnersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    
    try {
      const referrals = await contracts.getUserReferrals(web3Manager.address);
      
      if (referrals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No partners yet</td></tr>';
        return;
      }
      
      const bulkInfo = await contracts.getUsersBulkInfo(referrals);
      tbody.innerHTML = '';
      
      for (let i = 0; i < referrals.length; i++) {
        const addr = referrals[i];
        const userId = await contracts.getUserIdByAddress(addr);
        
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${Utils.formatUserId(userId)}</td>
          <td>${Utils.formatAddress(addr)}</td>
          <td>${Utils.formatUserId(this.userStats?.userId.toNumber ? this.userStats.userId.toNumber() : Number(this.userStats?.userId || 0))}</td>
          <td>-</td>
          <td>${level}</td>
          <td>${bulkInfo.personalInvites[i]}</td>
          <td>${Utils.getRankName(bulkInfo.leaderRanks[i])}</td>
        `;
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      tbody.innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
  }

  async loadPartnerStats() {
    if (!this.userStats) return;
    
    const personalInvitesEl = document.getElementById('personalInvites');
    if (personalInvitesEl) {
      personalInvitesEl.textContent = this.userStats.personalInvites;
    }
    
    try {
      const referrals = await contracts.getUserReferrals(web3Manager.address);
      
      const activePartnersEl = document.getElementById('activePartners');
      const totalTeamEl = document.getElementById('totalTeam');
      
      if (activePartnersEl) activePartnersEl.textContent = referrals.length;
      if (totalTeamEl) totalTeamEl.textContent = referrals.length;
    } catch (error) {
      console.error('Error loading partner stats:', error);
    }
  }

  async loadQualifications() {
    if (!this.userStats) return;
    
    try {
      const leadershipInfo = await contracts.getLeadershipInfo(web3Manager.address);
      const currentRank = leadershipInfo.currentRank && typeof leadershipInfo.currentRank.toNumber === 'function'
        ? leadershipInfo.currentRank.toNumber()
        : Number(leadershipInfo.currentRank || 0);
      
      const ranks = ['bronze', 'silver', 'gold', 'platinum'];
      
      ranks.forEach((rank, i) => {
        const badge = document.getElementById(`${rank}Qual`);
        if (!badge) return;
        
        const progress = badge.querySelector('.progress');
        
        if (i < currentRank) {
          badge.classList.add('achieved');
          if (progress) progress.style.width = '100%';
        } else if (i === currentRank) {
          badge.classList.add('current');
          if (progress) progress.style.width = '50%';
        }
      });
    } catch (error) {
      console.error('Error loading qualifications:', error);
    }
  }

  async loadPartnerEarnings() {
    if (!this.userStats) return;
    
    const total = ethers.utils.formatEther(this.userStats.totalEarned);
    
    const directBonusEl = document.getElementById('directBonus');
    const partnerBonusEl = document.getElementById('partnerBonus');
    const matrixBonusEl = document.getElementById('matrixBonus');
    const leadershipBonusEl = document.getElementById('leadershipBonus');
    const totalEarnedEl = document.getElementById('totalEarned');
    
    if (directBonusEl) directBonusEl.textContent = '0 BNB';
    if (partnerBonusEl) partnerBonusEl.textContent = '0 BNB';
    if (matrixBonusEl) matrixBonusEl.textContent = `${Utils.formatBNB(total)} BNB`;
    if (leadershipBonusEl) leadershipBonusEl.textContent = '0 BNB';
    if (totalEarnedEl) totalEarnedEl.textContent = `${Utils.formatBNB(total)} BNB`;
  }

  // === MATRIX ===

  async loadMatrix() {
    this.setupMatrixLevels();
    await this.loadMatrixVisualization();
    await this.loadMatrixTable();
    await this.loadMatrixStats();
    this.setupMatrixSearch();
  }

  setupMatrixLevels() {
    const container = document.getElementById('matrixLevels');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      if (i === this.currentMatrixLevel) btn.classList.add('active');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        this.currentMatrixLevel = i;
        this.loadMatrixLevel(i);
      });
      container.appendChild(btn);
    }
  }

  async loadMatrixLevel(level) {
    document.querySelectorAll('#matrixLevels .level-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i + 1 === level);
    });
    
    const currentMatrixLevelEl = document.getElementById('currentMatrixLevel');
    if (currentMatrixLevelEl) currentMatrixLevelEl.textContent = level;
    
    const maxPositions = Math.pow(2, level) - 1;
    const maxPositionsInfoEl = document.getElementById('maxPositionsInfo');
    if (maxPositionsInfoEl) maxPositionsInfoEl.textContent = maxPositions;
    
    await this.loadMatrixVisualization();
    await this.loadMatrixTable();
    await this.loadMatrixStats();
  }

  async loadMatrixVisualization() {
    try {
      if (!this.userStats || !this.userStats.isRegistered) {
        console.log('⚠️ User not registered');
        document.querySelectorAll('.matrix-position').forEach(el => {
          if (el) el.innerHTML = '<div class="position-locked">🔒 Not Registered</div>';
        });
        return;
      }
      
      const isLevelActive = this.userStats.activeLevels.includes(this.currentMatrixLevel);
      if (!isLevelActive) {
        console.log(`⚠️ Level ${this.currentMatrixLevel} not purchased`);
        document.querySelectorAll('.matrix-position').forEach(el => {
          if (el) el.innerHTML = '<div class="position-locked">🔒 Level Locked</div>';
        });
        return;
      }
      
      console.log('✅ Loading matrix level', this.currentMatrixLevel);
      
      const userPosition = await contracts.getUserMatrixPosition(this.currentMatrixLevel, web3Manager.address);
      console.log('📍 User position in matrix:', userPosition.toNumber());
      
      const topPos = document.getElementById('topPosition');
      if (topPos) {
        const userId = this.userStats?.userId.toNumber ? this.userStats.userId.toNumber() : Number(this.userStats?.userId || 0);
        this.updateMatrixPosition(topPos, {
          user: web3Manager.address,
          id: userId,
          type: 'user'
        });
      }
      
      for (let i = 1; i <= 6; i++) {
        const element = document.getElementById(`position${i}`);
        if (!element) continue;
        
        try {
          const position = await contracts.getMatrixPosition(this.currentMatrixLevel, i);
          
          if (position.user !== ethers.constants.AddressZero) {
            const userId = await contracts.getUserIdByAddress(position.user);
            const type = await this.getPositionType(position.user);
            
            this.updateMatrixPosition(element, {
              user: position.user,
              id: userId,
              type: type
            });
            
            console.log(`✅ Position ${i} loaded:`, userId);
          } else {
            this.updateMatrixPosition(element, {
              user: ethers.constants.AddressZero,
              id: 0,
              type: 'available'
            });
          }
        } catch (error) {
          console.error(`❌ Error loading position ${i}:`, error);
          this.updateMatrixPosition(element, {
            user: ethers.constants.AddressZero,
            id: 0,
            type: 'available'
          });
        }
      }
      
      console.log('✅ Matrix visualization loaded');
    } catch (error) {
      console.error('❌ Error loading matrix visualization:', error);
    }
  }

  updateMatrixPosition(element, data) {
    if (!element) return;
    
    const avatar = element.querySelector('.position-avatar');
    const id = element.querySelector('.position-id');
    const type = element.querySelector('.position-type') || element.querySelector('.position-level');
    
    if (data.type === 'available') {
      if (avatar) avatar.textContent = '⭕';
      if (id) id.textContent = 'Empty';
      if (type) type.textContent = 'available';
      element.classList.remove('partner', 'charity', 'technical', 'user');
      element.classList.add('available');
    } else {
      if (avatar) {
        avatar.textContent = data.type === 'user' ? '👤' : 
                           data.type === 'partner' ? '👥' :
                           data.type === 'charity' ? '❤️' :
                           data.type === 'technical' ? '⚙️' : '?';
      }
      
      if (id) id.textContent = Utils.formatUserId(data.id);
      if (type) type.textContent = data.type;
      
      element.classList.remove('available', 'partner', 'charity', 'technical', 'user');
      element.classList.add(data.type);
    }
    
    element.onclick = () => this.showPositionDetails(data);
  }

  async getPositionType(address) {
    try {
      if (!contracts.contracts.globalway) return 'unknown';
      
      const charity = await contracts.contracts.globalway.charity();
      if (address.toLowerCase() === charity.toLowerCase()) return 'charity';
      
      if (address.toLowerCase() === web3Manager.address.toLowerCase()) return 'user';
      
      const referrals = await contracts.getUserReferrals(web3Manager.address);
      if (referrals.some(r => r.toLowerCase() === address.toLowerCase())) return 'partner';
      
      if (contracts.contracts.techAccounts) {
        const isTech = await contracts.contracts.techAccounts.isTechAccount(address);
        if (isTech) return 'technical';
      }
      
      return 'partner';
    } catch (error) {
      console.error('Error getting position type:', error);
      return 'unknown';
    }
  }

  async loadMatrixTable() {
    const tbody = document.getElementById('matrixTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    
    try {
      const maxPositions = Math.pow(2, this.currentMatrixLevel) - 1;
      tbody.innerHTML = '';
      
      let loadedCount = 0;
      
      for (let i = 1; i <= maxPositions && loadedCount < 20; i++) {
        try {
          const position = await contracts.getMatrixPosition(this.currentMatrixLevel, i);
          
          if (position.user !== ethers.constants.AddressZero) {
            const userId = await contracts.getUserIdByAddress(position.user);
            const type = await this.getPositionType(position.user);
            
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${i}</td>
              <td>${Utils.formatUserId(userId)}</td>
              <td>${Utils.formatAddress(position.user)}</td>
              <td>-</td>
              <td>-</td>
              <td>${this.currentMatrixLevel}</td>
              <td><span class="type-badge ${type}">${type}</span></td>
            `;
            
            loadedCount++;
          }
        } catch (error) {
          console.error(`Error loading matrix position ${i}:`, error);
        }
      }
      
      if (tbody.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No positions yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading matrix table:', error);
      tbody.innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
    }
  }

  async loadMatrixStats() {
    try {
      const isLevelActive = this.userStats && 
                           Array.isArray(this.userStats.activeLevels) && 
                           this.userStats.activeLevels.includes(this.currentMatrixLevel);
      
      if (!isLevelActive) {
        console.log(`⚠️ Level ${this.currentMatrixLevel} not purchased, skipping matrix stats`);
        const totalEl = document.getElementById('totalActivePositions');
        const partnerEl = document.getElementById('partnerPositions');
        const charityEl = document.getElementById('charityPositions');
        const techEl = document.getElementById('technicalPositions');
        
        if (totalEl) totalEl.textContent = '0';
        if (partnerEl) partnerEl.textContent = '0';
        if (charityEl) charityEl.textContent = '0';
        if (techEl) techEl.textContent = '0';
        return;
      }
      
      const stats = await contracts.getMatrixStats(web3Manager.address, this.currentMatrixLevel);
      
      const totalEl = document.getElementById('totalActivePositions');
      const partnerEl = document.getElementById('partnerPositions');
      const charityEl = document.getElementById('charityPositions');
      const techEl = document.getElementById('technicalPositions');
      
      if (totalEl) totalEl.textContent = stats.downline.length;
      if (partnerEl) partnerEl.textContent = stats.downline.length;
      if (charityEl) charityEl.textContent = '0';
      if (techEl) techEl.textContent = '0';
      
      console.log('✅ Matrix stats loaded:', stats.downline.length);
    } catch (error) {
      console.error('Error loading matrix stats:', error);
      const totalEl = document.getElementById('totalActivePositions');
      const partnerEl = document.getElementById('partnerPositions');
      const charityEl = document.getElementById('charityPositions');
      const techEl = document.getElementById('technicalPositions');
      
      if (totalEl) totalEl.textContent = '0';
      if (partnerEl) partnerEl.textContent = '0';
      if (charityEl) charityEl.textContent = '0';
      if (techEl) techEl.textContent = '0';
    }
  }

  setupMatrixSearch() {
    const searchBtn = document.getElementById('matrixSearchBtn');
    if (!searchBtn) return;
    
    searchBtn.addEventListener('click', async () => {
      const input = document.getElementById('matrixSearchInput');
      if (!input) return;
      
      const inputValue = input.value.trim();
      
      let userId;
      if (inputValue.startsWith('GW')) {
        userId = Utils.parseUserId(inputValue);
      } else {
        userId = parseInt(inputValue);
      }
      
      if (userId > 0) {
        try {
          const address = await contracts.getAddressByUserId(userId);
          const position = await contracts.getUserMatrixPosition(this.currentMatrixLevel, address);
          Utils.showNotification(`User found at position ${position}`, 'success');
        } catch (error) {
          Utils.showNotification('User not found', 'error');
        }
      }
    });
  }

  showPositionDetails(data) {
    const modal = document.getElementById('positionModal');
    if (!modal) return;
    
    const modalPositionIdEl = document.getElementById('modalPositionId');
    const modalAddressEl = document.getElementById('modalAddress');
    const modalLevelEl = document.getElementById('modalLevel');
    const modalStatusEl = document.getElementById('modalStatus');
    
    if (modalPositionIdEl) modalPositionIdEl.textContent = Utils.formatUserId(data.id);
    if (modalAddressEl) modalAddressEl.textContent = Utils.formatAddress(data.user);
    if (modalLevelEl) modalLevelEl.textContent = this.currentMatrixLevel;
    if (modalStatusEl) modalStatusEl.textContent = data.type;
    
    modal.style.display = 'block';
  }

  // === TOKENS ===

  async loadTokens() {
    await this.loadTokenBalance();
    await this.loadTokenStats();
    await this.loadTokenTrading();
    await this.loadTokenPools();
    await this.loadLevelRewards();
    await this.loadTokenHistory();
    this.setupTokenActions();
  }

  async loadTokenBalance() {
    try {
      const balance = await contracts.getTokenBalance(web3Manager.address);
      const price = await contracts.getRealTokenPrice();
      const value = parseFloat(balance) * parseFloat(price);
      
      const totalTokensEl = document.getElementById('totalTokens');
      const currentPriceEl = document.getElementById('currentPrice');
      const totalValueEl = document.getElementById('totalValue');
      
      if (totalTokensEl) totalTokensEl.textContent = `${Utils.formatNumber(balance)} GWT`;
      if (currentPriceEl) currentPriceEl.textContent = `$${Utils.formatNumber(price, 6)}`;
      if (totalValueEl) totalValueEl.textContent = `$${Utils.formatNumber(value)}`;
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  }

  async loadTokenStats() {
    try {
      const totalSupply = await contracts.getTotalSupply();
      const circSupply = await contracts.getCirculatingSupply();
      const burned = await contracts.getTotalBurned();
      const marketCap = await contracts.getMarketCap();
      
      const totalSupplyEl = document.getElementById('totalSupply');
      const circSupplyEl = document.getElementById('circSupply');
      const burnedTokensEl = document.getElementById('burnedTokens');
      const marketCapEl = document.getElementById('marketCap');
      
      if (totalSupplyEl) totalSupplyEl.textContent = `${Utils.formatNumber(totalSupply)} GWT`;
      if (circSupplyEl) circSupplyEl.textContent = `${Utils.formatNumber(circSupply)} GWT`;
      if (burnedTokensEl) burnedTokensEl.textContent = `${Utils.formatNumber(burned)} GWT`;
      if (marketCapEl) marketCapEl.textContent = `$${Utils.formatNumber(marketCap)}`;
    } catch (error) {
      console.error('Error loading token stats:', error);
    }
  }

  async loadTokenTrading() {
    try {
      const tradingEnabled = await contracts.getTradingEnabled();
      
      const statusTextEl = document.querySelector('.trading-status .status-text');
      const statusIndicatorEl = document.querySelector('.trading-status .status-indicator');
      const tradingControlsEl = document.querySelector('.trading-controls');
      const buyBtnEl = document.getElementById('buyBtn');
      const sellBtnEl = document.getElementById('sellBtn');
      const tradeAmountEl = document.getElementById('tradeAmount');
      
      if (tradingEnabled) {
        if (statusTextEl) statusTextEl.textContent = 'Enabled';
        if (statusIndicatorEl) {
          statusIndicatorEl.classList.remove('disabled');
          statusIndicatorEl.classList.add('enabled');
        }
        if (tradingControlsEl) tradingControlsEl.style.opacity = '1';
        if (buyBtnEl) buyBtnEl.disabled = false;
        if (sellBtnEl) sellBtnEl.disabled = false;
        if (tradeAmountEl) tradeAmountEl.disabled = false;
      } else {
        if (statusTextEl) statusTextEl.textContent = 'Disabled';
        if (statusIndicatorEl) {
          statusIndicatorEl.classList.remove('enabled');
          statusIndicatorEl.classList.add('disabled');
        }
        if (tradingControlsEl) tradingControlsEl.style.opacity = '0.5';
        if (buyBtnEl) buyBtnEl.disabled = true;
        if (sellBtnEl) sellBtnEl.disabled = true;
        if (tradeAmountEl) tradeAmountEl.disabled = true;
      }
    } catch (error) {
      console.error('Error loading token trading:', error);
    }
  }

  async loadTokenPools() {
    const pools = [
      { name: 'Marketing', allocation: '20%', tokens: '2M GWT' },
      { name: 'Team', allocation: '15%', tokens: '1.5M GWT' },
      { name: 'Development', allocation: '10%', tokens: '1M GWT' },
      { name: 'Community', allocation: '55%', tokens: '5.5M GWT' }
    ];
    
    const container = document.getElementById('tokenPools');
    if (!container) return;
    
    container.innerHTML = '';
    pools.forEach(pool => {
      const item = document.createElement('div');
      item.className = 'pool-item';
      item.innerHTML = `
        <div class="pool-name">${pool.name}</div>
        <div class="pool-allocation">${pool.allocation}</div>
        <div class="pool-tokens">${pool.tokens}</div>
      `;
      container.appendChild(item);
    });
  }

  async loadLevelRewards() {
    const container = document.getElementById('levelRewards');
    if (!container) return;
    
    container.innerHTML = '';
    
    let totalRewards = 0;
    
    for (let i = 1; i <= 12; i++) {
      const reward = CONFIG.TOKEN_REWARDS[i - 1];
      totalRewards += reward;
      
      const isActive = this.userStats?.activeLevels.includes(i);
      
      const card = document.createElement('div');
      card.className = `reward-card ${isActive ? 'claimed' : ''}`;
      card.innerHTML = `
        <div class="reward-level">Level ${i}</div>
        <div class="reward-amount">${reward} GWT</div>
        <div class="reward-status">${isActive ? '✓ Claimed' : 'Locked'}</div>
      `;
      container.appendChild(card);
    }
    
    const totalEl = document.getElementById('totalPossibleRewards');
    if (totalEl) {
      totalEl.textContent = `${totalRewards} GWT`;
    }
  }

  async loadTokenHistory() {
    const tbody = document.getElementById('tokenHistoryTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    try {
      const provider = web3Manager.provider;
      const tokenContract = contracts.contracts.token;
      
      if (!tokenContract) {
        tbody.innerHTML = '<tr><td colspan="5">Token contract not initialized</td></tr>';
        return;
      }
      
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 4999);
      
      const mintFilter = tokenContract.filters.TokensMinted(web3Manager.address);
      const mintEvents = await tokenContract.queryFilter(mintFilter, fromBlock, currentBlock);
      
      if (mintEvents.length === 0 && this.userStats?.activeLevels.length > 0) {
        this.userStats.activeLevels.forEach(level => {
          const row = tbody.insertRow();
          row.innerHTML = `
            <td>-</td>
            <td>Level Reward</td>
            <td>${level}</td>
            <td>${CONFIG.TOKEN_REWARDS[level - 1]} GWT</td>
            <td><span class="status-badge success">Claimed</span></td>
          `;
        });
      } else if (mintEvents.length > 0) {
        for (const event of mintEvents) {
          const block = await provider.getBlock(event.blockNumber);
          const timestamp = block.timestamp;
          const amount = ethers.utils.formatEther(event.args.amount);
          
          const row = tbody.insertRow();
          row.innerHTML = `
            <td>${Utils.formatDateTime(timestamp)}</td>
            <td>Token Mint</td>
            <td>-</td>
            <td>${Utils.formatNumber(amount)} GWT</td>
            <td><span class="status-badge success">Completed</span></td>
          `;
        }
      } else {
        tbody.innerHTML = '<tr><td colspan="5">No token history yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading token history:', error);
      tbody.innerHTML = '<tr><td colspan="5">Error loading history</td></tr>';
    }
  }

  setupTokenActions() {
    const addToWalletBtn = document.getElementById('addToWallet');
    if (addToWalletBtn) {
      addToWalletBtn.addEventListener('click', async () => {
        try {
          await contracts.addTokenToWallet();
          Utils.showNotification('Token added to wallet!', 'success');
        } catch (error) {
          Utils.showNotification('Failed to add token', 'error');
        }
      });
    }
    
    const viewExplorerBtn = document.getElementById('viewExplorer');
    if (viewExplorerBtn) {
      viewExplorerBtn.addEventListener('click', () => {
        Utils.openInExplorer(CONFIG.CONTRACTS.GWTToken, 'address');
      });
    }
    
    const buyBtn = document.getElementById('buyBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => this.buyTokens());
    }
    
    const sellBtn = document.getElementById('sellBtn');
    if (sellBtn) {
      sellBtn.addEventListener('click', () => this.sellTokens());
    }
    
    const tradeAmountInput = document.getElementById('tradeAmount');
    if (tradeAmountInput) {
      tradeAmountInput.addEventListener('input', (e) => {
        this.updateTradePreview(e.target.value);
      });
    }
  }

  async updateTradePreview(amount) {
    if (!amount || amount <= 0) return;
    
    try {
      const price = await contracts.getTokenPrice();
      const cost = parseFloat(amount) * parseFloat(price);
      
      const tradeCostEl = document.getElementById('tradeCost');
      if (tradeCostEl) {
        tradeCostEl.textContent = `${Utils.formatBNB(cost)} BNB`;
      }
      
      const newPriceEl = document.getElementById('newPrice');
      if (newPriceEl) {
        newPriceEl.textContent = `$${Utils.formatNumber(price, 6)}`;
      }
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  }

  async buyTokens() {
    const amountInput = document.getElementById('tradeAmount');
    if (!amountInput) return;
    
    const amount = amountInput.value;
    if (!amount || amount <= 0) {
      Utils.showNotification('Enter valid amount', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.buyTokens(amount);
      Utils.showNotification('Tokens purchased successfully!', 'success');
      await this.loadTokens();
      amountInput.value = '';
    } catch (error) {
      console.error('Error buying tokens:', error);
      Utils.showNotification('Purchase failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async sellTokens() {
    const amountInput = document.getElementById('tradeAmount');
    if (!amountInput) return;
    
    const amount = amountInput.value;
    if (!amount || amount <= 0) {
      Utils.showNotification('Enter valid amount', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.sellTokens(amount);
      Utils.showNotification('Tokens sold successfully!', 'success');
      await this.loadTokens();
      amountInput.value = '';
    } catch (error) {
      console.error('Error selling tokens:', error);
      Utils.showNotification('Sale failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  // === PROJECTS ===

  async loadProjects() {
    this.renderProjectCards();
    this.setupProjectProposal();
    this.loadProjectStats();
    this.setupProjectActions();
  }

  renderProjectCards() {
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    CONFIG.PROJECTS.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.dataset.status = project.status;
      
      const hasAccess = this.userStats?.activeLevels.length >= project.requiredLevel;
      
      card.innerHTML = `
        <div class="project-logo">
          <img src="${project.logo}" alt="${project.name}">
        </div>
        <div class="project-info">
          <h4>${project.name}</h4>
          <p>${project.description}</p>
          <div class="project-meta">
            <span class="project-status status-${project.status}">
              ${Utils.getProjectStatus(project.status)}
            </span>
            <span class="project-requirement">
              Level ${project.requiredLevel}+
            </span>
          </div>
        </div>
        <button class="project-btn" ${!hasAccess ? 'disabled' : ''} 
                onclick="uiManager.openProject('${project.id}')">
          ${hasAccess ? 'Open Project' : 'Locked'}
        </button>
      `;
      
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('project-btn')) {
          this.showProjectModal(project);
        }
      });
      
      container.appendChild(card);
    });
  }

  showProjectModal(project) {
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    
    const modalLogo = document.getElementById('projectModalLogo');
    const modalTitle = document.getElementById('projectModalTitle');
    const modalDescription = document.getElementById('projectModalDescription');
    const modalStatus = document.getElementById('projectModalStatus');
    const modalRequirements = document.getElementById('projectModalRequirements');
    const modalPrefix = document.getElementById('projectModalPrefix');
    const actionBtn = document.getElementById('projectModalAction');
    
    if (modalLogo) modalLogo.src = project.logo;
    if (modalTitle) modalTitle.textContent = project.name;
    if (modalDescription) modalDescription.textContent = project.description;
    if (modalStatus) {
        modalStatus.textContent = Utils.getProjectStatus(project.status);
        modalStatus.className = `project-status status-${project.status}`;
      }
      if (modalRequirements) modalRequirements.textContent = `Level ${project.requiredLevel}+`;
      if (modalPrefix) modalPrefix.textContent = `${project.prefix}-XXXXXXX`;
      
      const hasAccess = this.userStats?.activeLevels.length >= project.requiredLevel;
      if (actionBtn) {
        actionBtn.disabled = !hasAccess || project.status === 'planning';
        actionBtn.onclick = () => this.openProject(project.id);
      }
      
      modal.style.display = 'block';
    }

    openProject(projectId) {
      const project = CONFIG.PROJECTS.find(p => p.id === projectId);
      if (!project) return;
      
      const userId = this.userStats?.userId.toNumber ? this.userStats.userId.toNumber() : Number(this.userStats?.userId || 0);
      const fullId = `${project.prefix}${String(userId).padStart(7, '0')}`;
      
      Utils.showNotification(`Opening ${project.name} with ID: ${fullId}`, 'info');
    }

    setupProjectProposal() {
      const proposalForm = document.getElementById('proposalForm');
      if (!proposalForm) return;
      
      proposalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
          author: document.getElementById('proposalAuthor').value,
          contact: document.getElementById('proposalContact').value,
          sphere: document.getElementById('proposalSphere').value,
          idea: document.getElementById('proposalIdea').value,
          description: document.getElementById('proposalDescription').value
        };
        
        console.log('Project proposal submitted:', data);
        Utils.showNotification('Proposal submitted! Thank you.', 'success');
        e.target.reset();
      });
    }

    loadProjectStats() {
      const active = CONFIG.PROJECTS.filter(p => p.status === 'active').length;
      const dev = CONFIG.PROJECTS.filter(p => p.status === 'development').length;
      const coming = CONFIG.PROJECTS.filter(p => p.status === 'coming').length;
      const planning = CONFIG.PROJECTS.filter(p => p.status === 'planning').length;
      
      const totalEl = document.getElementById('totalProjects');
      const activeEl = document.getElementById('activeProjects');
      const devEl = document.getElementById('devProjects');
      const comingEl = document.getElementById('comingProjects');
      const reviewEl = document.getElementById('reviewProjects');
      
      if (totalEl) totalEl.textContent = CONFIG.PROJECTS.length;
      if (activeEl) activeEl.textContent = active;
      if (devEl) devEl.textContent = dev;
      if (comingEl) comingEl.textContent = coming;
      if (reviewEl) reviewEl.textContent = planning;
    }

    setupProjectActions() {
      const joinProgramBtn = document.getElementById('joinProgram');
      if (joinProgramBtn) {
        joinProgramBtn.addEventListener('click', () => {
          Utils.showNotification('Developer program coming soon!', 'info');
        });
      }
      
      const viewDocsBtn = document.getElementById('viewDocs');
      if (viewDocsBtn) {
        viewDocsBtn.addEventListener('click', () => {
          window.open('https://docs.globalway.io', '_blank');
        });
      }
    }

    // === ADMIN ===

    async loadAdmin() {
      if (window.adminManager) {
        await adminManager.init();
      }
    }

    // === MODALS ===

    setupModals() {
      document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
          e.target.closest('.modal').style.display = 'none';
        });
      });
      
      window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          e.target.style.display = 'none';
        }
      });
      
      const closeModalBtn = document.getElementById('closeModalBtn');
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
          const positionModal = document.getElementById('positionModal');
          if (positionModal) positionModal.style.display = 'none';
        });
      }
    }

    showRegistrationModal() {
      const params = Utils.getUrlParams();
      let refAddress = params.ref;
      
      if (!refAddress) {
        refAddress = localStorage.getItem('referrer');
      }
      
      if (!refAddress || !Utils.validateAddress(refAddress)) {
        Utils.showNotification('Invalid referral link', 'error');
        return;
      }
      
      if (confirm(`Register with sponsor: ${Utils.formatAddress(refAddress)}?`)) {
        this.register(refAddress);
      }
    }

    async register(sponsorAddress) {
      Utils.showLoader(true);
      try {
        const tx = await contracts.register(sponsorAddress);
        Utils.showNotification('Registration successful!', 'success');
        await Utils.sleep(2000);
        await this.loadUserData();
        await this.updateUI();
        this.showPage('dashboard');
      } catch (error) {
        console.error('Registration error:', error);
        Utils.showNotification('Registration failed: ' + error.message, 'error');
      } finally {
        Utils.showLoader(false);
      }
    }
  }

  const uiManager = new UIManager();
