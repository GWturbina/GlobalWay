// src/js/web3.js
(() => {
  const OPBNB_CHAIN_ID_DEC = 204;
  const OPBNB_CHAIN_ID_HEX = '0xCC';

  let _provider = null;
  let _web3 = null;
  let _account = null;

  function isEIP1193(p) { return !!p && typeof p.request === 'function'; }

  async function ensureChain204() {
    const chainId = await _provider.request({ method: 'eth_chainId' });
    if (parseInt(chainId, 16) !== OPBNB_CHAIN_ID_DEC) {
      await _provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OPBNB_CHAIN_ID_HEX }],
      });
    }
  }

  async function connectSafePalFirst() {
    const eth = window.ethereum;
    if (!isEIP1193(eth)) throw new Error('EIP-1193 провайдер не найден. Открой сайт в dApp-браузере SafePal.');
    _provider = eth;
    await ensureChain204();
    const accounts = await _provider.request({ method: 'eth_requestAccounts' });
    _account = (accounts && accounts[0]) || null;
    if (!_account) throw new Error('Аккаунт не получен.');

    if (!_web3) _web3 = new window.Web3(_provider);

    _provider.on?.('accountsChanged', (accs) => {
      _account = (accs && accs[0]) || null;
      window.App?.onAccountsChanged(_account);
    });
    _provider.on?.('chainChanged', async () => {
      try { await ensureChain204(); window.App?.onChainChanged(); } catch {}
    });

    localStorage.setItem('gw_isConnected', 'true');
    localStorage.setItem('gw_address', _account);
    return _account;
  }

  async function getWeb3() {
    if (_web3) return _web3;
    if (!_provider && window.ethereum) {
      _provider = window.ethereum;
      _web3 = new window.Web3(_provider);
    }
    return _web3;
  }

  function getCurrentAddress() {
    return _account || localStorage.getItem('gw_address') || null;
  }

  async function getBNBBalance(address) {
    const w3 = await getWeb3();
    const wei = await w3.eth.getBalance(address);
    return w3.utils.fromWei(wei, 'ether');
  }

  window.Web3GW = { connectSafePalFirst, getWeb3, getCurrentAddress, getBNBBalance, ensureChain204, OPBNB_CHAIN_ID_DEC };
})();
