class UIManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.currentLevel = 1;
    this.currentMatrixLevel = 1;
    this.userInfo = null;
    this.userStats = null;
    this.buyingLevel = false;
    this.adminAutoOpened = false;
    this.viewingUserAddress = null;
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
      
      // 🔥 НОВОЕ: Задержка для SafePal на мобильном
      if (web3Manager.isMobile) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await this.loadUserData();
      
      // 🔥 НОВОЕ: Проверяем что данные загружены
      if (!this.userStats) {
        console.warn('⚠️ User stats not loaded, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.loadUserData();
      }
      
      // 🔥 НОВОЕ: Принудительное обновление header и cabinet
      await new Promise(resolve => setTimeout(resolve, 200));
      this.updateHeader();
      this.updateCabinet();
      
      // 🔥 НОВОЕ: Ещё одно обновление header через секунду (для кнопки Connect)
      setTimeout(() => {
        this.updateHeader();
        console.log('🔄 Header force-updated after 1s');
      }, 1000);
  
      if (web3Manager.isAdmin()) {
        console.log('✅ Admin access granted');
      
        // 🔥 ИСПРАВЛЕНИЕ: Добавляем класс к body
        document.body.classList.add('admin-access');
      
        document.querySelectorAll('.admin-only').forEach(el => {
          el.style.display = '';
          console.log('✅ Showing admin element:', el.className);
        });
        
        if ((web3Manager.isOwner() || web3Manager.isFounder()) && !this.adminAutoOpened) {
          this.adminAutoOpened = true;
          console.log('🔄 Attempting to auto-open admin panel...');
          
          setTimeout(() => {
            this.showPage('admin');
            console.log('✅ Admin panel auto-opened');
          }, 2000);
        }
      }
    }
    
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

      if (Array.isArray(info.activeLevels)) {
        this.userStats.activeLevels = info.activeLevels.map(l => {
          if (l && typeof l.toNumber === 'function') return l.toNumber();
          return Number(l);
        });
      }

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
    
    console.log('🔄 updateHeader called, connected:', web3Manager.connected, 'address:', web3Manager.address);
    
    // 🔥 НОВОЕ: Проверяем что адрес реально есть
    if (web3Manager.connected && web3Manager.address && connectBtn) {
      connectBtn.textContent = Utils.formatAddress(web3Manager.address);
      if (status) status.classList.add('connected');
      console.log('✅ Header updated with address:', web3Manager.address);
    } else {
      console.warn('⚠️ Cannot update header - not connected or no address');
      if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
      }
      if (status) status.classList.remove('connected');
    }
  }
  
  updateCabinet() {
    // 🔥 НОВОЕ: Проверяем коннект перед обновлением
    if (!web3Manager.connected || !web3Manager.address) {
      console.warn('⚠️ Cannot update cabinet - wallet not connected');
      return;
    }
    
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
    
    // 🔥 НОВОЕ: Проверка подключения кошелька
    if (!web3Manager.connected || !web3Manager.signer) {
      Utils.showNotification('Wallet not connected. Please connect first.', 'error');
      console.error('❌ Wallet not connected');
      return;
    }
    
    // 🔥 ИСПРАВЛЕНО: Проверка контракта В САМОМ НАЧАЛЕ
    if (!contracts.contracts.globalway) {
      Utils.showNotification('Contracts not ready. Please refresh page.', 'error');
      console.error('❌ GlobalWay contract not initialized');
      return;
    }
    
    const isActive = this.userStats && this.userStats.activeLevels && this.userStats.activeLevels.includes(level);
    
    if (isActive) {
      Utils.showNotification('Level already purchased', 'error');
      return;
    }
    
    const price = CONFIG.LEVEL_PRICES[level - 1];
    
    if (!confirm(`Buy level ${level} for ${price} BNB?`)) {
      return;
    }
    
    // 🔥 ИСПРАВЛЕНО: Флаг ПОСЛЕ confirm
    this.buyingLevel = true;
    
    try {
      console.log(`💳 Buying level ${level} for ${price} BNB...`);
      
      // 🔥 ИСПРАВЛЕНО: Показываем loader ДО транзакции
      Utils.showLoader(true);
      
      // 🔥 НОВОЕ: Перепроверяем контракты перед транзакцией
      if (!contracts.contracts.globalway || !web3Manager.signer) {
        throw new Error('Contracts or signer lost during transaction. Please reconnect.');
      }
      
      // 🔥 НОВОЕ: Небольшая задержка для SafePal на мобильном
      if (web3Manager.isMobile) {
        console.log('📱 Mobile delay before transaction...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Вызываем транзакцию
      console.log('📤 Sending transaction to blockchain...');
      const tx = await contracts.buyLevel(level);
      
      console.log('✅ Transaction sent:', tx);
      console.log('⏳ Waiting for blockchain confirmation...');
      
      // 🔥 НОВОЕ: Даём время на подтверждение
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Обновляем данные
      await this.loadUserData();
      await this.updateUI();
      await this.loadDashboard();
      
      Utils.showNotification(`Level ${level} activated successfully!`, 'success');
      
    } catch (error) {
      console.error('❌ Error buying level:', error);
      
      let errorMsg = 'Transaction failed';
      if (error.message) {
        if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          errorMsg = 'Transaction cancelled';
        } else if (error.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient BNB balance';
        } else {
          errorMsg = error.message;
        }
      }
      
      Utils.showNotification(errorMsg, 'error');
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
    
      const isActive = this.userStats && this.userStats.activeLevels && this.userStats.activeLevels.includes(i);
      
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
        
        // 🔥 НОВОЕ: Проверка валидности данных
        if (!maxLevel || !packageType) {
          console.error('Invalid button data:', { maxLevel, packageType });
          return;
        }
        
        console.log('📦 Buying package:', { packageType, maxLevel });
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

  async loadEarnings() {
    if (!this.userStats) return;
    
    try {
    const container = document.getElementById('earningsRank');
      if (container) container.innerHTML = '';
    
      const provider = web3Manager.provider;
      const marketingContract = contracts.contracts.marketing;
    
      if (!provider || !marketingContract) {
        console.warn('⚠️ Marketing contract not available');
        if (container) {
          container.innerHTML = `
            <div class="earnings-item"><span>Direct Bonus:</span><span>0.0000 BNB</span></div>
            <div class="earnings-item"><span>Partner Bonus:</span><span>0.0000 BNB</span></div>
            <div class="earnings-item"><span>Matrix Bonus:</span><span>0.0000 BNB</span></div>
            <div class="earnings-item"><span>Leadership Bonus:</span><span>0.0000 BNB</span></div>
          `;
        }
        return;
      }
    
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 50000);
    
      console.log(`📊 Loading earnings from block ${fromBlock} to ${currentBlock}`);
    
      let directBonus = 0;
      let partnerBonus = 0;
      let matrixBonus = 0;
      let leaderBonus = 0;
      
      try {
      const personalFilter = marketingContract.filters.PersonalBonusPaid(null, web3Manager.address);
        const personalEvents = await marketingContract.queryFilter(personalFilter, fromBlock, currentBlock);
        
        personalEvents.forEach(event => {
          const amount = parseFloat(ethers.utils.formatEther(event.args.amount));
          directBonus += amount;
        });
      
        console.log(`✅ Personal bonus: ${directBonus} BNB (${personalEvents.length} events)`);
      } catch (e) {
        console.warn('⚠️ PersonalBonusPaid not found:', e.message);
      }
    
      try {
        const referralFilter = marketingContract.filters.ReferralBonusPaid(null, web3Manager.address);
        const referralEvents = await marketingContract.queryFilter(referralFilter, fromBlock, currentBlock);
      
        referralEvents.forEach(event => {
          const amount = parseFloat(ethers.utils.formatEther(event.args.amount));
          partnerBonus += amount;
        });
      
        console.log(`✅ Referral bonus: ${partnerBonus} BNB (${referralEvents.length} events)`);
      } catch (e) {
        console.warn('⚠️ ReferralBonusPaid not found:', e.message);
      }
    
      try {
        const matrixFilter = marketingContract.filters.MatrixBonusPaid(null, web3Manager.address);
        const matrixEvents = await marketingContract.queryFilter(matrixFilter, fromBlock, currentBlock);
      
        matrixEvents.forEach(event => {
          const amount = parseFloat(ethers.utils.formatEther(event.args.amount));
          matrixBonus += amount;
        });
      
        console.log(`✅ Matrix bonus: ${matrixBonus} BNB (${matrixEvents.length} events)`);
      } catch (e) {
        console.warn('⚠️ MatrixBonusPaid not found:', e.message);
      }
      
      if (container) {
        const earnings = {
          'Direct Bonus': directBonus.toFixed(6),
          'Partner Bonus': partnerBonus.toFixed(6),
          'Matrix Bonus': matrixBonus.toFixed(6),
          'Leadership Bonus': leaderBonus.toFixed(6)
        };
      
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
    
      const totalIncome = directBonus + partnerBonus + matrixBonus + leaderBonus;
      const totalIncomeEl = document.getElementById('totalIncome');
      if (totalIncomeEl) {
        totalIncomeEl.textContent = `${Utils.formatBNB(totalIncome.toFixed(6))} BNB`;
      }
    
      const rankBadge = document.getElementById('currentRankBadge');
      if (rankBadge) {
        rankBadge.textContent = Utils.getRankName(this.userStats.leaderRank);
        rankBadge.className = `rank-badge rank-${this.userStats.leaderRank}`;
      }
    
      console.log('✅ Earnings loaded:', {
        direct: directBonus,
        partner: partnerBonus,
        matrix: matrixBonus,
        total: totalIncome
      });
    
    } catch (error) {
      console.error('❌ Error loading earnings:', error);
    }
  }

  async loadHistory() {
    const tbody = document.getElementById('historyTable');
    if (!tbody) return;
  
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  
    try {
      const provider = web3Manager.provider;
      const marketingContract = contracts.contracts.marketing;
      const globalwayContract = contracts.contracts.globalway;
    
      if (!provider || !globalwayContract) {
        tbody.innerHTML = '<tr><td colspan="6">Contracts not initialized</td></tr>';
        return;
      }
      
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = 0; // ✅ Загружать все блоки
    
      const allEvents = [];
    
      try {
        const levelFilter = globalwayContract.filters.LevelActivated(web3Manager.address);
        const levelEvents = await globalwayContract.queryFilter(levelFilter, fromBlock, currentBlock);
      
        for (const event of levelEvents) {
          const block = await provider.getBlock(event.blockNumber);
          allEvents.push({
            timestamp: block.timestamp,
            type: 'Level Purchase',
            details: `Level ${event.args.level}`,
            amount: `-${ethers.utils.formatEther(event.args.amount)}`,
            hash: event.transactionHash,
            class: 'amount-out'
          });
        }
      
        console.log(`✅ Loaded ${levelEvents.length} level purchases`);
      } catch (e) {
        console.warn('⚠️ LevelActivated events not found');
      }
    
      if (marketingContract) {
        try {
          const personalFilter = marketingContract.filters.PersonalBonusPaid(null, web3Manager.address);
          const personalEvents = await marketingContract.queryFilter(personalFilter, fromBlock, currentBlock);
        
          for (const event of personalEvents) {
            const block = await provider.getBlock(event.blockNumber);
            allEvents.push({
              timestamp: block.timestamp,
              type: 'Direct Bonus',
              details: 'Personal referral',
              amount: `+${ethers.utils.formatEther(event.args.amount)}`,
              hash: event.transactionHash,
              class: 'amount-in'
            });
          }
        
          console.log(`✅ Loaded ${personalEvents.length} personal bonuses`);
        } catch (e) {
          console.warn('⚠️ PersonalBonusPaid not found');
        }
      
        try {
          const referralFilter = marketingContract.filters.ReferralBonusPaid(null, web3Manager.address);
          const referralEvents = await marketingContract.queryFilter(referralFilter, fromBlock, currentBlock);
        
          for (const event of referralEvents) {
            const block = await provider.getBlock(event.blockNumber);
            allEvents.push({
              timestamp: block.timestamp,
              type: 'Partner Bonus',
              details: `Level ${event.args.level || '-'}`,
              amount: `+${ethers.utils.formatEther(event.args.amount)}`,
              hash: event.transactionHash,
              class: 'amount-in'
            });
          }
        
          console.log(`✅ Loaded ${referralEvents.length} referral bonuses`);
        } catch (e) {
          console.warn('⚠️ ReferralBonusPaid not found');
        }
      
        try {
          const matrixFilter = marketingContract.filters.MatrixBonusPaid(null, web3Manager.address);
          const matrixEvents = await marketingContract.queryFilter(matrixFilter, fromBlock, currentBlock);
          
          for (const event of matrixEvents) {
            const block = await provider.getBlock(event.blockNumber);
            allEvents.push({
              timestamp: block.timestamp,
              type: 'Matrix Bonus',
              details: `Level ${event.args.level || '-'}`,
              amount: `+${ethers.utils.formatEther(event.args.amount)}`,
              hash: event.transactionHash,
              class: 'amount-in'
            });
          }
        
          console.log(`✅ Loaded ${matrixEvents.length} matrix bonuses`);
        } catch (e) {
          console.warn('⚠️ MatrixBonusPaid not found');
        }
      }
    
      allEvents.sort((a, b) => b.timestamp - a.timestamp);
    
      tbody.innerHTML = '';
    
      if (allEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No transactions yet</td></tr>';
        return;
      }
    
      allEvents.slice(0, 50).forEach(event => {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${Utils.formatDateTime(event.timestamp)}</td>
          <td>${event.type}</td>
          <td>${event.details}</td>
          <td class="${event.class}">${Utils.formatBNB(event.amount)} BNB</td>
          <td><a href="${CONFIG.NETWORK.explorer}/tx/${event.hash}" target="_blank">View</a></td>
        `;
      });
    
      console.log(`✅ History loaded: ${allEvents.length} total events`);
    
    } catch (error) {
      console.error('❌ Error loading history:', error);
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
      const partnersAtLevel = await this.getPartnersAtLevel(web3Manager.address, level);
      
      if (partnersAtLevel.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No partners at this level yet</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      
      for (let i = 0; i < partnersAtLevel.length; i++) {
        const addr = partnersAtLevel[i];
        
        try {
          const userId = await contracts.getUserIdByAddress(addr);
          const userInfo = await contracts.getUserFullInfo(addr);
          const sponsorId = userInfo.userId ? userInfo.userId.toNumber() : 0;
          
          const row = tbody.insertRow();
          row.innerHTML = `
            <td>${i + 1}</td>
            <td>${Utils.formatUserId(userId)}</td>
            <td>${Utils.formatAddress(addr)}</td>
            <td>${Utils.formatUserId(sponsorId)}</td>
            <td>-</td>
            <td>${level}</td>
            <td>${userInfo.personalInvites || 0}</td>
            <td>${Utils.getRankName(0)}</td>
          `;
        } catch (error) {
          console.error(`Error loading partner ${i}:`, error);
        }
      }
      
      console.log(`✅ Loaded ${partnersAtLevel.length} partners at level ${level}`);
      
    } catch (error) {
      console.error('Error loading partners:', error);
      tbody.innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
  }
  
  async getPartnersAtLevel(address, targetLevel) {
    if (targetLevel === 1) {
      return await contracts.getUserReferrals(address);
    }
    
    let currentLevelPartners = [address];
    
    for (let level = 1; level <= targetLevel; level++) {
      const nextLevelPartners = [];
      
      for (const partnerAddr of currentLevelPartners) {
        try {
          const referrals = await contracts.getUserReferrals(partnerAddr);
          nextLevelPartners.push(...referrals);
        } catch (error) {
          console.error(`Error getting referrals for ${partnerAddr}:`, error);
        }
      }
      
      currentLevelPartners = nextLevelPartners;
      
      if (currentLevelPartners.length > 1000) {
        console.warn(`⚠️ Too many partners at level ${level}: ${currentLevelPartners.length}. Stopping.`);
        break;
      }
    }
    
    return currentLevelPartners;
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
    
    this.viewingUserAddress = null;
    
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
      
      const targetAddress = this.viewingUserAddress || web3Manager.address;
      const isViewingSelf = targetAddress.toLowerCase() === web3Manager.address.toLowerCase();
      
      const isLevelActive = await contracts.isLevelActive(targetAddress, this.currentMatrixLevel);
      
      if (!isLevelActive) {
        console.log(`⚠️ Level ${this.currentMatrixLevel} not purchased by target user`);
        document.querySelectorAll('.matrix-position').forEach(el => {
          if (el) el.innerHTML = '<div class="position-locked">🔒 Level Locked</div>';
        });
        
        if (!isViewingSelf) {
          Utils.showNotification(`User hasn't activated level ${this.currentMatrixLevel}`, 'info');
        }
        return;
      }
      
      console.log(`✅ Loading matrix level ${this.currentMatrixLevel} for`, targetAddress);
      
      const globalPosition = await contracts.getUserMatrixPosition(this.currentMatrixLevel, targetAddress);
      const globalPosNum = globalPosition.toNumber ? globalPosition.toNumber() : Number(globalPosition);
      
      console.log(`📍 User global position: ${globalPosNum}`);
      
      const targetUserId = await contracts.getUserIdByAddress(targetAddress);
      
      const topPos = document.getElementById('topPosition');
      if (topPos) {
        topPos.innerHTML = `
          <div class="position-avatar">${isViewingSelf ? '👤' : '👁️'}</div>
          <div class="position-id">${Utils.formatUserId(targetUserId)}</div>
          <div class="position-type">${isViewingSelf ? 'You' : 'Viewing'}</div>
          <div style="font-size:10px;color:#888;margin-top:5px;">
            Local: 1 | Global: ${globalPosNum}
          </div>
        `;
        
        if (!isViewingSelf) {
          const returnBtn = document.createElement('button');
          returnBtn.textContent = '🏠 My Matrix';
          returnBtn.style.cssText = 'margin-top:5px;padding:5px 10px;font-size:11px;cursor:pointer;border-radius:4px;';
          returnBtn.onclick = () => this.returnToMyMatrix();
          topPos.appendChild(returnBtn);
        }
      }
      
      const leftChild = globalPosNum * 2;
      const rightChild = globalPosNum * 2 + 1;
      
      const leftLeftGrandchild = leftChild * 2;
      const leftRightGrandchild = leftChild * 2 + 1;
      const rightLeftGrandchild = rightChild * 2;
      const rightRightGrandchild = rightChild * 2 + 1;
      
      const allPositions = [
        leftChild,
        rightChild,
        leftLeftGrandchild,
        leftRightGrandchild,
        rightLeftGrandchild,
        rightRightGrandchild
      ];
      
      console.log('📊 Loading positions:', allPositions);
      
      for (let i = 0; i < allPositions.length; i++) {
        const element = document.getElementById(`position${i + 1}`);
        if (!element) continue;
        
        const globalPos = allPositions[i];
        
        try {
          const position = await contracts.getMatrixPosition(this.currentMatrixLevel, globalPos);
          
          if (position.user !== ethers.constants.AddressZero) {
            const positionUserId = await contracts.getUserIdByAddress(position.user);
            const type = await this.getPositionType(position.user);
            
            element.style.cursor = 'pointer';
            element.onclick = async () => {
              await this.viewUserMatrix(position.user);
            };
            
            const localPos = i + 2;
            
            element.innerHTML = `
              <div class="position-avatar">${type === 'user' ? '👤' : 
                                            type === 'partner' ? '👥' :
                                            type === 'charity' ? '❤️' :
                                            type === 'technical' ? '⚙️' : '?'}</div>
              <div class="position-id">${Utils.formatUserId(positionUserId)}</div>
              <div class="position-type">${type}</div>
              <div style="font-size:10px;color:#888;margin-top:5px;">
                Local: ${localPos} | Global: ${globalPos}
              </div>
            `;
            
            element.classList.remove('available');
            element.classList.add(type);
            
            console.log(`✅ Position ${i + 1} (local ${localPos}, global ${globalPos}): GW${positionUserId}`);
          } else {
            const localPos = i + 2;
            
            element.innerHTML = `
              <div class="position-avatar">⭕</div>
              <div class="position-id">Empty</div>
              <div class="position-type">available</div>
              <div style="font-size:10px;color:#888;margin-top:5px;">
                Local: ${localPos} | Global: ${globalPos}
              </div>
            `;
            
            element.classList.remove('partner', 'charity', 'technical', 'user');
            element.classList.add('available');
            element.style.cursor = 'default';
            element.onclick = null;
            
            console.log(`⭕ Position ${i + 1} (local ${localPos}, global ${globalPos}): Empty`);
          }
        } catch (error) {
          console.error(`❌ Error loading position ${i + 1} (global ${globalPos}):`, error);
          element.innerHTML = `
            <div class="position-avatar">❌</div>
            <div class="position-id">Error</div>
          `;
        }
      }
      
      console.log('✅ Matrix visualization loaded');
    } catch (error) {
      console.error('❌ Error loading matrix visualization:', error);
      Utils.showNotification('Failed to load matrix', 'error');
    }
  }

  async viewUserMatrix(userAddress) {
    try {
      console.log('👁️ Viewing matrix for:', userAddress);
      
      this.viewingUserAddress = userAddress;
      
      await this.loadMatrixVisualization();
      
      const userId = await contracts.getUserIdByAddress(userAddress);
      Utils.showNotification(`Viewing matrix of GW${userId}`, 'info');
      
    } catch (error) {
      console.error('Error viewing user matrix:', error);
      Utils.showNotification('Failed to load user matrix', 'error');
      this.viewingUserAddress = null;
    }
  }

  async returnToMyMatrix() {
    console.log('🏠 Returning to my matrix');
    this.viewingUserAddress = null;
    await this.loadMatrixVisualization();
    Utils.showNotification('Returned to your matrix', 'success');
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
      element.classList.remove('partner', 'charity', 'technical', 'user', 'viewed');
      element.classList.add('available');
    } else {
      if (avatar) {
        avatar.textContent = data.type === 'user' ? '👤' : 
                           data.type === 'viewed' ? '👁️' :
                           data.type === 'partner' ? '👥' :
                           data.type === 'charity' ? '❤️' :
                           data.type === 'technical' ? '⚙️' : '?';
      }
      
      if (id) id.textContent = Utils.formatUserId(data.id);
      if (type) type.textContent = data.type;
      
      element.classList.remove('available', 'partner', 'charity', 'technical', 'user', 'viewed');
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
      const targetAddress = this.viewingUserAddress || web3Manager.address;
      const isLevelActive = await contracts.isLevelActive(targetAddress, this.currentMatrixLevel);
      
      if (!isLevelActive) {
        tbody.innerHTML = '<tr><td colspan="7">Level not activated</td></tr>';
        return;
      }
      
      const globalPosition = await contracts.getUserMatrixPosition(this.currentMatrixLevel, targetAddress);
      const globalPosNum = globalPosition.toNumber ? globalPosition.toNumber() : Number(globalPosition);
      
      const startLocalPos = Math.pow(2, this.currentMatrixLevel);
      const endLocalPos = Math.pow(2, this.currentMatrixLevel + 1) - 1;
      
      console.log(`📊 Loading matrix table for level ${this.currentMatrixLevel}`);
      console.log(`   Local positions: ${startLocalPos}-${endLocalPos}`);
      console.log(`   User global position: ${globalPosNum}`);
      
      tbody.innerHTML = '';
      
      for (let localPos = startLocalPos; localPos <= endLocalPos; localPos++) {
        const depth = Math.floor(Math.log2(localPos));
        const offsetInLine = localPos - Math.pow(2, depth);
        
        const globalPos = globalPosNum * Math.pow(2, depth) + offsetInLine;
        
        try {
          const position = await contracts.getMatrixPosition(this.currentMatrixLevel, globalPos);
          
          if (position.user !== ethers.constants.AddressZero) {
            const userId = await contracts.getUserIdByAddress(position.user);
            const type = await this.getPositionType(position.user);
            
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${localPos}</td>
              <td>${globalPos}</td>
              <td>${Utils.formatUserId(userId)}</td>
              <td>${Utils.formatAddress(position.user)}</td>
              <td>-</td>
              <td>${this.currentMatrixLevel}</td>
              <td><span class="type-badge ${type}">${type}</span></td>
            `;
          } else {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${localPos}</td>
              <td>${globalPos}</td>
              <td colspan="5" style="text-align:center;color:#888;">Empty position</td>
            `;
          }
        } catch (error) {
          console.error(`Error loading position ${localPos} (global ${globalPos}):`, error);
        }
        
        if (localPos - startLocalPos >= 100) {
          const row = tbody.insertRow();
          row.innerHTML = `<td colspan="7" style="text-align:center;color:#ff9800;">Showing first 100 positions. Total: ${endLocalPos - startLocalPos + 1}</td>`;
          break;
        }
      }
      
      if (tbody.rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No positions yet</td></tr>';
      }
      
      console.log(`✅ Matrix table loaded: ${tbody.rows.length} rows`);
      
    } catch (error) {
      console.error('Error loading matrix table:', error);
      tbody.innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
    }
  }

  async loadMatrixStats() {
    try {
      const targetAddress = this.viewingUserAddress || web3Manager.address;
      const isLevelActive = await contracts.isLevelActive(targetAddress, this.currentMatrixLevel);
      
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
      
      const stats = await contracts.getMatrixStats(targetAddress, this.currentMatrixLevel);
      
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
          
          if (address === ethers.constants.AddressZero) {
            Utils.showNotification('User not found', 'error');
            return;
          }
          
          await this.viewUserMatrix(address);
          
        } catch (error) {
          Utils.showNotification('User not found', 'error');
        }
      } else {
        Utils.showNotification('Invalid user ID', 'error');
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
      const fromBlock = 0; // Загружать ВСЕ блоки с начала
      
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
// 🔥 ИСПРАВЛЕНО: Предотвращение двойного объявления
if (typeof window.uiManager === 'undefined') {
  window.uiManager = new UIManager();
}
// Для обратной совместимости
if (typeof window.UIManager === 'undefined') {
  window.UIManager = window.uiManager;
}
