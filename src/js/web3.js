(function () {
  const OP_BNB_ID = 204;                 // opBNB
  const OP_BNB_HEX = "0x" + OP_BNB_ID.toString(16);

  class Web3Manager {
    constructor() {
      this.web3 = null;
      this.addr = null;
    }

    async init() {
      if (!window.ethereum) {
        throw new Error("Wallet provider not found");
      }
      this.web3 = new Web3(window.ethereum);
      return this;
    }

    async connect() {
      // запрос аккаунта
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      this.addr = accounts[0];

      // переключение сети на opBNB при необходимости
      const chainId = await this.web3.eth.getChainId();
      if (+chainId !== OP_BNB_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: OP_BNB_HEX }],
        });
      }
      return this.addr;
    }

    getWeb3() {
      return this.web3;
    }
    getAddress() {
      return this.addr;
    }
  }

  window.web3Manager = new Web3Manager();
})();
