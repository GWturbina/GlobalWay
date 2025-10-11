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

  // ✅ ИСПРАВЛЕНО: Все адреса из успешного деплоя
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

  ADMIN: {
    owner: '0xC05E7BE81e98B31CdB79A0b837086c00aA1ddd2e',
    
    // ✅ ПРАВИЛЬНО: Адреса из смарт-контракта GlobalWay.sol
    founders: [
      '0x03284A899147f5a07F82C622F34DF92198671635',  // Founder #1
      '0x9b49bD9c9458615e11C051afd1EBe983563b67EE',  // Founder #2
      '0xc2b58114cBc873cf360f7A673e4d8EE25d1431e7'   // Founder #3
    ],
    
    board: [
      '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
      '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
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
