// web3.js — SafePal-first provider bootstrap for opBNB
(function (global) {
  'use strict';

  const OPBNB_PARAMS = {
    chainId: '0xCC', // 204
    chainName: 'opBNB Mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
    blockExplorerUrls: ['https://opbnbscan.com/'],
  };

  class Web3Manager {
    constructor() {
      this.provider = null;
      this.web3 = null;
    }

    _detectProvider() {
      if (global.safepal && global.safepal.isSafePal) return global.safepal; // SafePal first
      if (global.BinanceChain) return global.BinanceChain;
      if (global.ethereum) return global.ethereum;
      return null;
    }

    async init() {
      console.log('🔌 Initializing Web3Manager...');
      const prov = this._detectProvider();
      if (!prov) throw new Error('No Web3 provider found (SafePal/BNB/ethereum missing)');
      this.provider = prov;

      try { await prov.request({ method: 'eth_requestAccounts' }); } catch (e) { console.warn('Account request rejected:', e); }

      const net = await prov.request({ method: 'eth_chainId' });
      if (net !== OPBNB_PARAMS.chainId) {
        try {
          await prov.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: OPBNB_PARAMS.chainId }] });
          console.log('✅ Switched to opBNB 204');
        } catch (err) {
          if (err && err.code === 4902) {
            await prov.request({ method: 'wallet_addEthereumChain', params: [OPBNB_PARAMS] });
          } else {
            console.warn('Chain switch failed:', err);
          }
        }
      }

      this.web3 = new global.Web3(prov);
      return this.web3;
    }

    getWeb3() {
      if (!this.web3) throw new Error('Web3 not initialized');
      return this.web3;
    }
  }

  global.Web3Manager = Web3Manager;
})(window);
