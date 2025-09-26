// js/config.js
window.CONFIG = {
  CHAIN_ID: '0xCC',               // 204 (opBNB)
  CHAIN_NAME: 'opBNB',
  RPC_URL: 'https://opbnb-mainnet-rpc.bnbchain.org',
  EXPLORER_URL: 'https://mainnet.opbnbscan.com',
  CONTRACTS: {
    GLOBALWAY: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
    STATS:     '0x23380dDDD0b2F8d83898720c28bE407eCDE69d38',
    TOKEN:     '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc'
  },
  ADDRESSES: {
    OWNER: '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
    FOUNDERS: [
      '0x03284a899147f5a07f82c622f34df92198671635',
      '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
      '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
    ],
    BOARD: [
      '0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA',
      '0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639',
      '0x0561671297Eed07accACB41b4882ED61e87E3644',
      '0x012E0B2b502FE0131Cb342117415a43d59094D6d',
      '0x15b546a61865bdc46783ACfc50c3101a1121c69B',
      '0xB5986B808dad481ad86D63DF152cC0ad7B473e48',
      '0x4d2C77e59538deFe89E3B2951680547FC24aD52C',
      '0xAB17aDbe29c4E1d695C239206682B02ebdB3f707'
    ]
  }
};

// Проверка корректности конфигурации
window.CONFIG.validateNetwork = function(chainId) {
  return chainId === this.CHAIN_ID;
};

window.CONFIG.getNetworkName = function(chainId) {
  const networks = {
    '0xCC': 'opBNB Mainnet',
    '0x61': 'BSC Testnet', 
    '0x38': 'BSC Mainnet',
    '0x1': 'Ethereum Mainnet'
  };
  return networks[chainId] || 'Unknown Network';
};

// Проверяем что все адреса контрактов корректные
Object.values(window.CONFIG.CONTRACTS).forEach(address => {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.error('Invalid contract address detected:', address);
  }
});

console.log('✅ Config loaded for opBNB network');
