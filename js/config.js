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

  // ✅ ВСЕ 10 КОНТРАКТОВ (обновлено)
  CONTRACTS: {
    GWTToken: '0x66476ACb1B1E955a7dF175384eD5f487608bD82f',
    GlobalWay: '0xC71346392ef7d2776b4Ee702f9C6d00C3701ac58',
    TechAccounts: '0xa6dbB5b5E1557F49d36941a08D990B25f1668478',
    Marketing: '0x36736d03f73905764d5c59F5bbbf7D1bA413d175',
    Quarterly: '0xDaB526f48AFceD053EAE8F223A5E55a3d1741F52',
    Investment: '0x2F311EEF752d95512e50C1B053E2db99A9d99b1d',
    LeaderPool: '0x9eA2f3449650aEa7B9116bB447B40758DFA728a3',
    Stats: '0x9EE0C5671e47c87876a6997A9cB0f3B1230b3268',
    Bridge: '0xC6CB729a7bFE575815058D8e3119F8005Bd363e0',
    Governance: '0xb542241cd7140872f1156a46403EFfdCf0c5FBE1'
  },

  // ⚠️ ПУТЬ К ABI ФАЙЛАМ
  // Если у тебя папка 'contracts/' с frontend-config.json - используй './contracts/'
  // Если у тебя папка 'abi/' с отдельными JSON файлами - используй './abi/'
  ABI_PATH: './contracts/',  // 👈 ИЗМЕНИ НА './abi/' если используешь отдельные файлы

  ADMIN: {
    owner: '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
    
    founders: [
      '0x03284a899147f5a07f82c622f34df92198671635',
      '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
      '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7',
      '0x152b801e3ab0127616774b46531c19bc825e2f5c'
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
    '0.0015',
    '0.003',
    '0.006',
    '0.012',
    '0.024',
    '0.048',
    '0.096',
    '0.192',
    '0.384',
    '0.768',
    '1.536',
    '3.072'
  ],

  TOKEN_REWARDS: [
    5, 5, 10, 15, 35, 75, 150, 300, 600, 1200, 2400, 4500
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
