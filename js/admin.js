class AdminManager {
  constructor() {
    this.isOwner = false;
    this.isFounder = false;
    this.isBoard = false;
  }

  async init() {
    if (!this.checkRights()) {
      return; // Останавливаем если нет прав
    }
    await this.loadAdminStats();
    this.setupAdminActions();
  }

  checkRights() {
    this.isOwner = web3Manager.isOwner();
    this.isFounder = web3Manager.isFounder();
    this.isBoard = web3Manager.isAdmin();

    const rightsLevel = this.isOwner ? 'Owner' :
                       this.isFounder ? 'Founder' :
                       this.isBoard ? 'Board Member' : 'No Access';

    const adminCurrentAccountEl = document.getElementById('adminCurrentAccount');
    const adminRightsLevelEl = document.getElementById('adminRightsLevel');

    if (adminCurrentAccountEl) adminCurrentAccountEl.textContent = Utils.formatAddress(web3Manager.address);
    if (adminRightsLevelEl) adminRightsLevelEl.textContent = rightsLevel;

    if (!this.isBoard) {
      console.error('❌ No admin access for:', web3Manager.address);
      console.log('Owner:', CONFIG.ADMIN.owner);
      console.log('Founders:', CONFIG.ADMIN.founders);
      console.log('Board:', CONFIG.ADMIN.board);

      Utils.showNotification('Access denied: Admin rights required', 'error');

      const adminPage = document.getElementById('admin');
      if (adminPage) {
        adminPage.innerHTML = `
          <div style="text-align: center; padding: 50px;">
            <h2>🔒 Access Denied</h2>
            <p>You don't have admin rights.</p>
            <p>Your address: <code>${web3Manager.address}</code></p>
            <p>Contact the system administrator.</p>
          </div>
        `;
      }
      return false;
    }

    console.log('✅ Admin access granted:', rightsLevel);

    // Добавляем класс к body
    document.body.classList.add('admin-access');

    return true;
  }

  async loadAdminStats() {
    try {
      const overview = await contracts.getContractOverview();

      const adminTotalUsersEl = document.getElementById('adminTotalUsers');
      const adminActiveUsersEl = document.getElementById('adminActiveUsers');
      const adminContractBalanceEl = document.getElementById('adminContractBalance');
      const adminTotalVolumeEl = document.getElementById('adminTotalVolume');
      const totalIdsAssignedEl = document.getElementById('totalIdsAssigned');

      if (adminTotalUsersEl) adminTotalUsersEl.textContent = overview.totalUsers.toString();
      if (adminActiveUsersEl) adminActiveUsersEl.textContent = '-';
      if (adminContractBalanceEl) {
        adminContractBalanceEl.textContent = `${Utils.formatBNB(ethers.utils.formatEther(overview.contractBalance))} BNB`;
      }
      if (adminTotalVolumeEl) {
        adminTotalVolumeEl.textContent = `${Utils.formatBNB(ethers.utils.formatEther(overview.totalVolume))} BNB`;
      }
      if (totalIdsAssignedEl) totalIdsAssignedEl.textContent = overview.totalUsers.toString();
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  }

  setupAdminActions() {
    // Free Activation
    const freeActivateBtn = document.getElementById('freeActivateBtn');
    if (freeActivateBtn) {
      freeActivateBtn.addEventListener('click', () => this.freeActivate());
    }

    // Batch Activation
    const batchActivateBtn = document.getElementById('batchActivateBtn');
    if (batchActivateBtn) {
      batchActivateBtn.addEventListener('click', () => this.batchActivate());
    }
    
    // Contract Management
    const pauseBtn = document.getElementById('pauseContractBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseContract());
    }
    
    const unpauseBtn = document.getElementById('unpauseContractBtn');
    if (unpauseBtn) {
      unpauseBtn.addEventListener('click', () => this.unpauseContract());
    }
    
    // Project Integration
    const connectBtn = document.getElementById('connectProjectBtn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectProject());
    }
    
    const disconnectBtn = document.getElementById('disconnectProjectBtn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.disconnectProject());
    }
    
    // ID Management
    const assignIdBtn = document.getElementById('assignIdBtn');
    if (assignIdBtn) {
      assignIdBtn.addEventListener('click', () => this.assignId());
    }
    
    // User Lookup
    const lookupBtn = document.getElementById('lookupBtn');
    if (lookupBtn) {
      lookupBtn.addEventListener('click', () => this.lookupUser());
    }
    
    // Emergency Withdraw
    const emergencyBtn = document.getElementById('emergencyWithdrawBtn');
    if (emergencyBtn) {
      emergencyBtn.addEventListener('click', () => this.emergencyWithdraw());
    }
    
    // Process Inactive
    const processInactiveBtn = document.getElementById('processInactiveBtn');
    if (processInactiveBtn) {
      processInactiveBtn.addEventListener('click', () => this.processInactive());
    }
    
    // Delegation Management
    const delegateBtn = document.getElementById('delegateRightsBtn');
    if (delegateBtn) {
      delegateBtn.addEventListener('click', () => this.delegateRights());
    }
    
    // User Management
    const blockUserBtn = document.getElementById('blockUserBtn');
    if (blockUserBtn) {
      blockUserBtn.addEventListener('click', () => this.blockUser());
    }
    
    const replaceAddressBtn = document.getElementById('replaceAddressBtn');
    if (replaceAddressBtn) {
      replaceAddressBtn.addEventListener('click', () => this.replaceAddress());
    }
    
    // Financial Management
    const withdrawalBtn = document.getElementById('withdrawalBtn');
    if (withdrawalBtn) {
      withdrawalBtn.addEventListener('click', () => this.createWithdrawalProposal());
    }
    
    // News Management
    const publishNewsBtn = document.getElementById('publishNewsBtn');
    if (publishNewsBtn) {
      publishNewsBtn.addEventListener('click', () => this.publishNews());
    }
  }

  async freeActivate() {
    if (!this.isFounder) {
      Utils.showNotification('Only Owner/Founders can activate', 'error');
      return;
    }
    
    const addressInput = document.getElementById('activationAddress');
    const sponsorInput = document.getElementById('activationSponsor');
    const levelInput = document.getElementById('activationLevel');
    
    if (!addressInput || !sponsorInput || !levelInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const address = addressInput.value;
    const sponsor = sponsorInput.value;
    const maxLevel = parseInt(levelInput.value);
    
    if (!Utils.validateAddress(address) || !Utils.validateAddress(sponsor)) {
      Utils.showNotification('Invalid addresses', 'error');
      return;
    }
    
    if (!confirm(`Activate ${Utils.formatAddress(address)} with ${maxLevel} levels?`)) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.activateFounderTeam(address, sponsor, maxLevel);
      Utils.showNotification('User activated successfully!', 'success');
      await this.loadAdminStats();
      
      addressInput.value = '';
      sponsorInput.value = '';
    } catch (error) {
      console.error('Activation error:', error);
      Utils.showNotification('Activation failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async batchActivate() {
    if (!this.isFounder) {
      Utils.showNotification('Only Owner/Founders can batch activate', 'error');
      return;
    }
    
    const membersTextarea = document.getElementById('batchMembers');
    const sponsorInput = document.getElementById('batchSponsor');
    const levelInput = document.getElementById('batchLevel');
    
    if (!membersTextarea || !sponsorInput || !levelInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const membersText = membersTextarea.value;
    const sponsor = sponsorInput.value;
    const maxLevel = parseInt(levelInput.value);
    
    const members = membersText.split('\n').map(a => a.trim()).filter(a => a);
    
    if (members.length === 0 || !Utils.validateAddress(sponsor)) {
      Utils.showNotification('Invalid input', 'error');
      return;
    }
    
    if (!confirm(`Batch activate ${members.length} users?`)) return;
    
    Utils.showLoader(true);
    try {
      const sponsors = new Array(members.length).fill(sponsor);
      const levels = new Array(members.length).fill(maxLevel);
      
      const tx = await contracts.batchActivateTeam(members, sponsors, levels);
      Utils.showNotification('Batch activation successful!', 'success');
      await this.loadAdminStats();
      
      membersTextarea.value = '';
      sponsorInput.value = '';
    } catch (error) {
      console.error('Batch activation error:', error);
      Utils.showNotification('Batch activation failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async pauseContract() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can pause contract', 'error');
      return;
    }
    
    if (!confirm('PAUSE CONTRACT? This will stop all operations!')) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.pause();
      Utils.showNotification('Contract paused', 'success');
    } catch (error) {
      console.error('Pause error:', error);
      Utils.showNotification('Pause failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async unpauseContract() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can unpause contract', 'error');
      return;
    }
    
    if (!confirm('UNPAUSE CONTRACT?')) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.unpause();
      Utils.showNotification('Contract unpaused', 'success');
    } catch (error) {
      console.error('Unpause error:', error);
      Utils.showNotification('Unpause failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async connectProject() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can connect projects', 'error');
      return;
    }
    
    const projectAddressInput = document.getElementById('projectContractAddress');
    const projectNameInput = document.getElementById('projectName');
    
    if (!projectAddressInput || !projectNameInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const projectAddress = projectAddressInput.value;
    const projectName = projectNameInput.value;
    
    if (!Utils.validateAddress(projectAddress) || !projectName) {
      Utils.showNotification('Invalid input', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.authorizeExternalProject(projectAddress, true);
      Utils.showNotification(`Project ${projectName} connected!`, 'success');
      
      projectAddressInput.value = '';
      projectNameInput.value = '';
    } catch (error) {
      console.error('Connect error:', error);
      Utils.showNotification('Connection failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async disconnectProject() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can disconnect projects', 'error');
      return;
    }
    
    const projectAddressInput = document.getElementById('projectContractAddress');
    
    if (!projectAddressInput) {
      Utils.showNotification('Form element not found', 'error');
      return;
    }
    
    const projectAddress = projectAddressInput.value;
    
    if (!Utils.validateAddress(projectAddress)) {
      Utils.showNotification('Invalid address', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.authorizeExternalProject(projectAddress, false);
      Utils.showNotification('Project disconnected', 'success');
      
      projectAddressInput.value = '';
    } catch (error) {
      console.error('Disconnect error:', error);
      Utils.showNotification('Disconnection failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async assignId() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can assign IDs', 'error');
      return;
    }
    
    const addressInput = document.getElementById('assignIdUserAddress');
    
    if (!addressInput) {
      Utils.showNotification('Form element not found', 'error');
      return;
    }
    
    const address = addressInput.value;
    
    if (!Utils.validateAddress(address)) {
      Utils.showNotification('Invalid address', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.assignIdByOwner(address);
      Utils.showNotification('ID assigned successfully!', 'success');
      await this.loadAdminStats();
      
      addressInput.value = '';
    } catch (error) {
      console.error('Assign ID error:', error);
      Utils.showNotification('ID assignment failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async lookupUser() {
    const inputEl = document.getElementById('lookupInput');
    
    if (!inputEl) {
      Utils.showNotification('Form element not found', 'error');
      return;
    }
    
    const input = inputEl.value.trim();
    
    let address;
    if (input.startsWith('GW')) {
      const userId = Utils.parseUserId(input);
      try {
        address = await contracts.getAddressByUserId(userId);
      } catch (error) {
        Utils.showNotification('User not found', 'error');
        return;
      }
    } else if (Utils.validateAddress(input)) {
      address = input;
    } else {
      Utils.showNotification('Invalid input', 'error');
      return;
    }
    
    Utils.showLoader(true);
    try {
      const userInfo = await contracts.getUserFullInfo(address);
      
      const resultAddressEl = document.getElementById('resultAddress');
      const resultUserIdEl = document.getElementById('resultUserId');
      const resultRegisteredEl = document.getElementById('resultRegistered');
      const resultLevelsEl = document.getElementById('resultLevels');
      const resultEarnedEl = document.getElementById('resultEarned');
      const resultReferralsEl = document.getElementById('resultReferrals');
      const lookupResultsEl = document.getElementById('lookupResults');
      
      if (resultAddressEl) resultAddressEl.textContent = Utils.formatAddress(address);
      if (resultUserIdEl) resultUserIdEl.textContent = Utils.formatUserId(userInfo.userId.toNumber());
      if (resultRegisteredEl) resultRegisteredEl.textContent = userInfo.isRegistered ? 'Yes' : 'No';
      if (resultLevelsEl) resultLevelsEl.textContent = userInfo.activeLevels.length;
      if (resultEarnedEl) {
        resultEarnedEl.textContent = `${Utils.formatBNB(ethers.utils.formatEther(userInfo.totalEarned))} BNB`;
      }
      if (resultReferralsEl) resultReferralsEl.textContent = userInfo.referrals.length;
      
      if (lookupResultsEl) lookupResultsEl.style.display = 'block';
    } catch (error) {
      console.error('Lookup error:', error);
      Utils.showNotification('Lookup failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async emergencyWithdraw() {
    if (!this.isFounder) {
      Utils.showNotification('Only Owner/Founders can emergency withdraw', 'error');
      return;
    }
    
    if (!confirm('EMERGENCY WITHDRAW? This is irreversible!')) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.emergencyWithdraw();
      Utils.showNotification('Emergency withdrawal completed', 'success');
      await this.loadAdminStats();
    } catch (error) {
      console.error('Emergency withdraw error:', error);
      Utils.showNotification('Withdrawal failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async processInactive() {
    if (!this.isBoard) {
      Utils.showNotification('Board member rights required', 'error');
      return;
    }
    
    const addressInput = document.getElementById('inactiveUserAddress');
    
    if (!addressInput) {
      Utils.showNotification('Form element not found', 'error');
      return;
    }
    
    const address = addressInput.value;
    
    if (!Utils.validateAddress(address)) {
      Utils.showNotification('Invalid address', 'error');
      return;
    }
    
    if (!confirm(`Process inactive account: ${Utils.formatAddress(address)}?`)) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.processInactiveAccount(address);
      Utils.showNotification('Account processed', 'success');
      
      addressInput.value = '';
    } catch (error) {
      console.error('Process inactive error:', error);
      Utils.showNotification('Processing failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  // ✅ ИСПРАВЛЕНО: Улучшено сообщение об ошибке при отсутствии Governance
  async delegateRights() {
    if (!this.isOwner && !this.isFounder) {
      Utils.showNotification('Only Owner/Founders can delegate rights', 'error');
      return;
    }
    
    // ✅ ИСПРАВЛЕНО: Более детальное сообщение
    if (!contracts.contracts.governance) {
      Utils.showNotification(
        'Governance contract not available. Please reconnect your wallet and try again.', 
        'error'
      );
      console.error('❌ Governance contract missing in contracts.contracts object');
      console.log('Available contracts:', Object.keys(contracts.contracts));
      return;
    }
    
    const addressInput = document.getElementById('delegateAddress');
    const noteInput = document.getElementById('delegationNote');
    
    if (!addressInput || !noteInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const address = addressInput.value;
    const note = noteInput.value;
    
    if (!Utils.validateAddress(address)) {
      Utils.showNotification('Invalid address', 'error');
      return;
    }
    
    const permissions = [];
    document.querySelectorAll('.permission-checkboxes input:checked').forEach(checkbox => {
      permissions.push(checkbox.value);
    });
    
    if (permissions.length === 0) {
      Utils.showNotification('Select at least one permission', 'error');
      return;
    }
    
    if (!confirm(`Delegate rights to ${Utils.formatAddress(address)}?\n\nPermissions: ${permissions.join(', ')}\n\nNote: ${note || 'None'}`)) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.contracts.governance.addBoardMember(address);
      await tx.wait();
      
      Utils.showNotification('Rights delegated successfully!', 'success');
      
      if (!CONFIG.ADMIN.board.includes(address)) {
        CONFIG.ADMIN.board.push(address);
      }
      
      addressInput.value = '';
      noteInput.value = '';
      document.querySelectorAll('.permission-checkboxes input').forEach(cb => cb.checked = false);
      
      Utils.showNotification('⚠️ Please update config.js with the new board member address for permanent access', 'info');
    } catch (error) {
      console.error('Delegation error:', error);
      Utils.showNotification('Delegation failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  // ✅ ИСПРАВЛЕНО: Улучшено сообщение об ошибке при отсутствии Governance
  async blockUser() {
    if (!this.isBoard) {
      Utils.showNotification('Board member rights required', 'error');
      return;
    }
    
    // ✅ ИСПРАВЛЕНО: Более детальное сообщение
    if (!contracts.contracts.governance) {
      Utils.showNotification(
        'Governance contract not available. Please reconnect your wallet and try again.', 
        'error'
      );
      console.error('❌ Governance contract missing in contracts.contracts object');
      console.log('Available contracts:', Object.keys(contracts.contracts));
      return;
    }
    
    const userAddressInput = document.getElementById('blockUserAddress');
    const reasonInput = document.getElementById('blockReason');
    
    if (!userAddressInput || !reasonInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const userAddress = userAddressInput.value;
    const reason = reasonInput.value;
    
    if (!Utils.validateAddress(userAddress)) {
      Utils.showNotification('Invalid user address', 'error');
      return;
    }
    
    if (!reason || reason.trim().length < 10) {
      Utils.showNotification('Please provide a detailed reason (min 10 characters)', 'error');
      return;
    }
    
    if (!confirm(`Block user ${Utils.formatAddress(userAddress)}?\n\nReason: ${reason}`)) return;
    
    Utils.showLoader(true);
    try {
      const tx = await contracts.contracts.governance.blockUser(userAddress, reason);
      await tx.wait();
      
      Utils.showNotification('User blocked successfully!', 'success');
      
      userAddressInput.value = '';
      reasonInput.value = '';
    } catch (error) {
      console.error('Block user error:', error);
      Utils.showNotification('Block failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async replaceAddress() {
    if (!this.isOwner) {
      Utils.showNotification('Only Owner can replace addresses', 'error');
      return;
    }
    
    const oldAddressInput = document.getElementById('replaceOldAddress');
    const newAddressInput = document.getElementById('replaceNewAddress');
    const reasonInput = document.getElementById('replaceReason');
    
    if (!oldAddressInput || !newAddressInput || !reasonInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const oldAddress = oldAddressInput.value;
    const newAddress = newAddressInput.value;
    const reason = reasonInput.value;
    
    if (!Utils.validateAddress(oldAddress) || !Utils.validateAddress(newAddress)) {
      Utils.showNotification('Invalid addresses', 'error');
      return;
    }
    
    if (!reason || reason.trim().length < 10) {
      Utils.showNotification('Please provide a detailed reason (min 10 characters)', 'error');
      return;
    }
    
    if (!confirm(`Replace address?\n\nOld: ${Utils.formatAddress(oldAddress)}\nNew: ${Utils.formatAddress(newAddress)}\n\nReason: ${reason}\n\n⚠️ This action requires manual intervention!`)) return;
    
    Utils.showNotification('Address replacement requires manual database update. Please contact technical support.', 'warning');
    
    console.log('Address replacement request:', {
      oldAddress,
      newAddress,
      reason,
      requestedBy: web3Manager.address,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ ИСПРАВЛЕНО: Улучшено сообщение об ошибке при отсутствии Governance
  async createWithdrawalProposal() {
    if (!this.isBoard) {
      Utils.showNotification('Board member rights required', 'error');
      return;
    }
    
    // ✅ ИСПРАВЛЕНО: Более детальное сообщение
    if (!contracts.contracts.governance) {
      Utils.showNotification(
        'Governance contract not available. Please reconnect your wallet and try again.', 
        'error'
      );
      console.error('❌ Governance contract missing in contracts.contracts object');
      console.log('Available contracts:', Object.keys(contracts.contracts));
      return;
    }
    
    const poolSelect = document.getElementById('withdrawalPool');
    const addressInput = document.getElementById('withdrawalAddress');
    const amountInput = document.getElementById('withdrawalAmount');
    const noteInput = document.getElementById('withdrawalNote');
    
    if (!poolSelect || !addressInput || !amountInput || !noteInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const pool = poolSelect.value;
    const address = addressInput.value;
    const amount = amountInput.value;
    const note = noteInput.value;
    
    if (!Utils.validateAddress(address)) {
      Utils.showNotification('Invalid withdrawal address', 'error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      Utils.showNotification('Invalid amount', 'error');
      return;
    }
    
    if (!note || note.trim().length < 10) {
      Utils.showNotification('Please provide a detailed note (min 10 characters)', 'error');
      return;
    }
    
    const amountBNB = parseFloat(amount);
    const requiresVoting = amountBNB > 5;
    
    if (!confirm(`Create withdrawal proposal?\n\nPool: ${pool}\nTo: ${Utils.formatAddress(address)}\nAmount: ${amount} BNB\n\n${requiresVoting ? '⚠️ Requires 8 votes!' : '✅ Can be executed immediately'}`)) return;
    
    Utils.showLoader(true);
    try {
      const amountWei = ethers.utils.parseEther(amount);
      const tx = await contracts.contracts.governance.createWithdrawalProposal(
        address,
        amountWei,
        pool,
        note
      );
      await tx.wait();
      
      Utils.showNotification(requiresVoting ? 'Withdrawal proposal created! Awaiting votes.' : 'Withdrawal executed!', 'success');
      
      addressInput.value = '';
      amountInput.value = '';
      noteInput.value = '';
    } catch (error) {
      console.error('Withdrawal error:', error);
      Utils.showNotification('Withdrawal failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

  async publishNews() {
    if (!this.isBoard) {
      Utils.showNotification('Board member rights required', 'error');
      return;
    }
    
    const titleInput = document.getElementById('newsTitle');
    const textInput = document.getElementById('newsText');
    const linkInput = document.getElementById('newsLink');
    const photoInput = document.getElementById('newsPhoto');
    
    if (!titleInput || !textInput) {
      Utils.showNotification('Form elements not found', 'error');
      return;
    }
    
    const title = titleInput.value;
    const text = textInput.value;
    const link = linkInput ? linkInput.value : '';
    
    if (!title || title.trim().length < 5) {
      Utils.showNotification('Title is too short (min 5 characters)', 'error');
      return;
    }
    
    if (!text || text.trim().length < 20) {
      Utils.showNotification('News text is too short (min 20 characters)', 'error');
      return;
    }
    
    if (!confirm(`Publish news?\n\nTitle: ${title}\n\nThis will be visible to all users.`)) return;
    
    Utils.showLoader(true);
    try {
      const newsData = {
        title: title.trim(),
        text: text.trim(),
        link: link.trim() || null,
        photo: photoInput && photoInput.files[0] ? photoInput.files[0].name : null,
        publishedBy: web3Manager.address,
        publishedAt: new Date().toISOString()
      };
      
      console.log('News published:', newsData);
      
      Utils.showNotification('News published successfully!', 'success');
      
      titleInput.value = '';
      textInput.value = '';
      if (linkInput) linkInput.value = '';
      if (photoInput) photoInput.value = '';
      
      Utils.showNotification('⚠️ Note: News management requires backend integration', 'info');
    } catch (error) {
      console.error('Publish news error:', error);
      Utils.showNotification('Publishing failed: ' + error.message, 'error');
    } finally {
      Utils.showLoader(false);
    }
  }

const adminManager = new AdminManager();
