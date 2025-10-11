// Configuration for GlobalWay DApp
const CONFIG = {
  NETWORK: {
    chainId: 204,
    chainIdHex: '0xCC',
    name: 'opBNB Mainnet',
    rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
    explorer: 'https://opbnbscan.com',
    currency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  },

  // ✅ ПРАВИЛЬНЫЕ адреса контрактов
  CONTRACTS: {
    GWTToken: '0xdA10f5d40e5C0E3ad6E7c28D34559fE1BA79eB13',
    GlobalWay: '0x46036EA45e004898B14e1f9d7B910fd6EE0E0Aeb',
    GlobalWayTechAccounts: '0xE5CE95edb4f52d1B7f55e17608b45AaC0fAAACE2',
    GlobalWayMarketing: '0xd9FC117ae11b92644Ddbe1378Dbc00De881E811b',
    GlobalWayQuarterly: '0x4a64d08b73dfcDbf25420B4812921beFdc68EE70',
    GlobalWayLeaderPool: '0xa1004B90df8C9c51aD17E450aB83Fa79F8B5A233',
    GlobalWayInvestment: '0x26F2BF623c9c09AF119A174C20192CC2EC0c32bE',
    GlobalWayGovernance: '0xb4058857C99013C18eDBD0745D8611d38bC3aB53',
    GlobalWayStats: '0xD849b3E460C813B378284eAf35d7968eFf8e5a45'
  },

  // ✅ ПРАВИЛЬНЫЕ адреса администраторов
  ADMIN: {
    owner: '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
    
    founders: [
      '0x03284a899147f5a07f82c622f34df92198671635',
      '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
      '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
    ],
    
    board: [
      '0x11c4FA4126f9B373c4b9A2D43986Cd331E32d2fA',
      '0x0AB97e3934b1Afc9F1F6447CCF676E4f1D8B9639',
      '0x0561671297Eed07accACB41b4882ED61e87E3644',
      '0x012E0B2b502FE0131Cb342117415a43d59094D6d',
      '0x15b546a61865bdc46783ACfc50c3101a1121c69B',
      '0xB5986B808dad481ad86D63DF152cC0ad7B473e48',
      '0x4d2C77e59538deFe89E3B2951680547FC24aD52C',
      '0xAB17aDbe29c4E1d695C239206682B02ebdB3f707'
    ]
  },

  PROJECTS: [
    {
      id: 'CG',
      name: 'KardGift',
      description: 'Gift card marketplace and exchange platform',
      logo: 'assets/icons/CardGift.png',
      status: 'development',
      requiredLevel: 1,
      prefix: 'CG'
    },
    {
      id: 'GT',
      name: 'GlobalTub',
      description: 'Decentralized video streaming platform',
      logo: 'assets/icons/GlobalTub.png',
      status: 'development',
      requiredLevel: 4,
      prefix: 'GT'
    },
    {
      id: 'GM',
      name: 'GlobalMarket',
      description: 'P2P marketplace for goods and services',
      logo: 'assets/icons/GlobalMarket.png',
      status: 'coming',
      requiredLevel: 4,
      prefix: 'GM'
    },
    {
      id: 'GG',
      name: 'GlobalGame',
      description: 'Play-to-earn gaming ecosystem',
      logo: 'assets/icons/GlobalGame.png',
      status: 'coming',
      requiredLevel: 7,
      prefix: 'GG'
    },
    {
      id: 'GS',
      name: 'GlobalSocial',
      description: 'Decentralized social network',
      logo: 'assets/icons/GlobalSocial.png',
      status: 'planning',
      requiredLevel: 7,
      prefix: 'GS'
    },
    {
      id: 'GB',
      name: 'GlobalBank',
      description: 'DeFi banking and lending platform',
      logo: 'assets/icons/GlobalBank.png',
      status: 'planning',
      requiredLevel: 10,
      prefix: 'GB'
    },
    {
      id: 'GE',
      name: 'GlobalEdu',
      description: 'Educational platform and certification',
      logo: 'assets/icons/GlobalEdu.png',
      status: 'planning',
      requiredLevel: 10,
      prefix: 'GE'
    },
    {
      id: 'GL',
      name: 'EcoVillages',
      description: 'Eco-settlements and sustainable living',
      logo: 'assets/icons/EcoVillages.png',
      status: 'planning',
      requiredLevel: 12,
      prefix: 'GL'
    }
  ],

  LEVEL_PRICES: [
    '0.0015',  // 1
    '0.003',   // 2
    '0.006',   // 3
    '0.012',   // 4
    '0.024',   // 5
    '0.048',   // 6
    '0.096',   // 7
    '0.192',   // 8
    '0.384',   // 9
    '0.768',   // 10
    '1.536',   // 11
    '3.072'    // 12
  ],

  TOKEN_REWARDS: [
    5,     // 1
    5,     // 2
    10,    // 3
    15,    // 4
    35,    // 5
    75,    // 6
    150,   // 7
    300,   // 8
    600,   // 9
    1200,  // 10
    2400,  // 11
    4500   // 12
  ],

  QUARTERLY_COST: '0.075',

  DEEP_LINKS: {
    safepal: 'safepal://wc?uri=',
    metamask: 'https://metamask.app.link/dapp/'
  },

  QR_CONFIG: {
    size: 256,
    logo: 'assets/icons/logo-32x32.png'
  }
};
