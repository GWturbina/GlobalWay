// web3.js - Web3 connection and wallet management
class Web3Manager {
  constructor() {
    this.web3 = null;
    this.account = null;
    this.isConnected = false;
    this.networkId = null;
    this.provider = null;
    
    // opBNB Network Configuration
    this.networks = {
      204: {
        name: 'opBNB Mainnet',
        rpc: 'https://opbnb-mainnet-rpc.bnbchain.org',
        chainId: '0xCC',
        symbol: 'BNB',
        explorer: 'https://opbnbscan.com'
      }
    };
    
    this.targetNetwork = 204;
    this.init();
  }

  async init() {
    console.log('🔌 Initializing Web3Manager...');
    
    if (typeof window.ethereum !== 'undefined') {
      console.log('✅ MetaMask detected');
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        this.handleAccountsChanged(accounts);
      });
      
      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId) => {
        this.handleNetworkChanged(chainId);
      });
      
      // Check if already connected
      this.checkConnection();
    } else {
      console.log('❌ No Web3 provider found');
    }
  }

  async checkConnection() {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        await this.connectWallet();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }

  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask.');
      }

      console.log('🔌 Connecting wallet...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize Web3
      this.web3 = new Web3(window.ethereum);
      this.provider = window.ethereum;
      this.account = accounts[0];
      
      // Get network
      this.networkId = await this.web3.eth.getChainId();
      
      console.log(`✅ Connected to account: ${this.account}`);
      console.log(`🌐 Network ID: ${this.networkId}`);
      
      // Check if on correct network
      if (this.networkId !== this.targetNetwork) {
        await this.switchNetwork();
      }
      
      this.isConnected = true;
      this.updateUI();
      
      // Initialize contracts after connection
      if (window.contractManager) {
        window.contractManager.initContracts();
      }
      
      return this.account;
      
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      this.showNotification('Wallet connection failed: ' + error.message, 'error');
      throw error;
    }
  }

  async switchNetwork() {
    try {
      const targetChainId = '0x' + this.targetNetwork.toString(16);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      console.log(`✅ Switched to network ${this.targetNetwork}`);
      
    } catch (switchError) {
      // Network not added to wallet
      if (switchError.code === 4902) {
        try {
          await this.addNetwork();
        } catch (addError) {
          console.error('❌ Error adding network:', addError);
          throw addError;
        }
      } else {
        console.error('❌ Error switching network:', switchError);
        throw switchError;
      }
    }
  }

  async addNetwork() {
    const network = this.networks[this.targetNetwork];
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x' + this.targetNetwork.toString(16),
        chainName: network.name,
        rpcUrls: [network.rpc],
        blockExplorerUrls: [network.explorer],
        nativeCurrency: {
          name: 'BNB',
          symbol: network.symbol,
          decimals: 18,
        },
      }],
    });
    
    console.log(`✅ Added network ${network.name}`);
  }

  handleAccountsChanged(accounts) {
    console.log('👤 Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      this.disconnect();
    } else if (accounts[0] !== this.account) {
      this.account = accounts[0];
      this.updateUI();
      
      // Refresh contract data
      if (window.contractManager) {
        window.contractManager.refreshUserData();
      }
    }
  }

  handleNetworkChanged(chainId) {
    console.log('🌐 Network changed:', chainId);
    
    this.networkId = parseInt(chainId, 16);
    
    if (this.networkId !== this.targetNetwork) {
      this.showNotification(`Please switch to ${this.networks[this.targetNetwork].name}`, 'warning');
    }
    
    this.updateUI();
  }

  disconnect() {
    console.log('🔌 Disconnecting wallet...');
    
    this.web3 = null;
    this.account = null;
    this.isConnected = false;
    this.networkId = null;
    
    this.updateUI();
    
    // Clear contract data
    if (window.contractManager) {
      window.contractManager.clearUserData();
    }
  }

  async getBalance(address = null) {
    if (!this.web3) return '0';
    
    try {
      const targetAddress = address || this.account;
      const balance = await this.web3.eth.getBalance(targetAddress);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  formatAddress(address, start = 6, end = 4) {
    if (!address) return '0x000...000';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  updateUI() {
    const connectButton = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    const walletBalance = document.getElementById('walletBalance');
    const networkStatus = document.getElementById('networkStatus');

    if (this.isConnected && this.account) {
      if (connectButton) {
        connectButton.style.display = 'none';
      }
      
      if (walletInfo) {
        walletInfo.classList.remove('hidden');
      }
      
      if (walletAddress) {
        walletAddress.textContent = this.formatAddress(this.account);
      }
      
      // Update balance
      this.getBalance().then(balance => {
        if (walletBalance) {
          walletBalance.textContent = `${parseFloat(balance).toFixed(4)} BNB`;
        }
      });
      
    } else {
      if (connectButton) {
        connectButton.style.display = 'flex';
      }
      
      if (walletInfo) {
        walletInfo.classList.add('hidden');
      }
    }
    
    // Update network status
    if (networkStatus) {
      const network = this.networks[this.networkId];
      if (network) {
        networkStatus.textContent = network.name;
        networkStatus.className = 'network-status connected';
      } else {
        networkStatus.textContent = 'Wrong Network';
        networkStatus.className = 'network-status disconnected';
      }
    }
    
    // Update wallet-required elements
    document.querySelectorAll('.wallet-required').forEach(element => {
      if (this.isConnected) {
        element.style.display = 'none';
      } else {
        element.style.display = 'flex';
      }
    });
  }

  showNotification(message, type = 'info') {
    if (window.uiManager) {
      window.uiManager.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Utility methods for contract interactions
  async sendTransaction(transaction, options = {}) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const gasEstimate = await transaction.estimateGas({
        from: this.account,
        ...options
      });

      const gasPrice = await this.web3.eth.getGasPrice();
      
      return await transaction.send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        gasPrice: gasPrice,
        ...options
      });
      
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  async call(method, options = {}) {
    try {
      return await method.call({
        from: this.account,
        ...options
      });
    } catch (error) {
      console.error('Call error:', error);
      throw error;
    }
  }
}

// Initialize Web3Manager
window.web3Manager = new Web3Manager();
