// src/js/app.js
(async () => {
  let current = { address:null, bnb:'0.0000', isActive:false, prices:[] };

  function bindDashboard() {
    const btn = document.getElementById('payQuarterlyBtn');
    if (btn) btn.addEventListener('click', async () => {
      try {
        const w3 = await Web3GW.getWeb3();
        const valueWei = w3.utils.toWei('0.075','ether');
        await ContractsGW.payQuarterly(current.address, valueWei);
        UI.notify('Квартальная активность оплачена','success');
        await refreshDashboard();
      } catch(e){ UI.notify(`Ошибка: ${e?.message||e}`,'error'); }
    });
    document.querySelectorAll('.quick-buy-btn').forEach(el=>{
      el.addEventListener('click', async ()=>{
        const max = Number(el.dataset.maxLevel || el.getAttribute('data-max-level') || 4);
        try{
          await ContractsGW.buyPackage(max, current.address);
          UI.notify(`Пакет 1-${max} активирован`,'success');
          await refreshDashboard();
        }catch(e){ UI.notify(`Ошибка покупки: ${e?.message||e}`,'error'); }
      });
    });
  }

  function bindPartners() {
    const link = document.getElementById('partnerReferralLink');
    if (link){
      const userId = localStorage.getItem('gw_userId') || (document.getElementById('userId')?.textContent?.trim() || '0000000');
      link.value = UI.makeReferralLink('GW', userId);
      document.getElementById('copyPartnerRefLink')?.addEventListener('click', ()=> UI.Copy.copyToClipboard(link.value));
    }
  }

  function bindMatrix() { /* готово к подключению on-chain данных */ }
  function bindTokens() { /* история токенов/награды отображаются твоим HTML */ }

  async function refreshDashboard() {
    UI.setText('#userAddress', UI.short(current.address));
    current.bnb = await Web3GW.getBNBBalance(current.address);
    UI.setText('#userBalance', `${Number(current.bnb).toFixed(4)} BNB`);

    const ud = await ContractsGW.getUserData(current.address);
    const st = await ContractsGW.getUserStats(current.address);
    current.isActive = await ContractsGW.isUserActive(current.address);

    const userId = localStorage.getItem('gw_userId') || '---';
    UI.setText('#userId', userId);

    const earnedBnB = (Number(st.totalEarned || '0') / 1e18).toFixed(4);
    UI.setText('#totalEarned', `${earnedBnB} BNB`);

    if (Number(ud.lastActivity) > 0) {
      const last = new Date(Number(ud.lastActivity) * 1000);
      const next = new Date(last.getTime() + 90*24*3600*1000);
      document.querySelector('#lastQuarterlyPayment')?.replaceChildren(document.createTextNode(last.toLocaleDateString()));
      document.querySelector('#nextQuarterlyDate')?.replaceChildren(document.createTextNode(next.toLocaleDateString()));
      const days = Math.ceil((next - Date.now())/(24*3600*1000));
      const warn = document.getElementById('quarterlyWarning');
      if (days <= 10 && warn) { warn.classList.remove('hidden'); document.getElementById('daysRemaining')?.replaceChildren(document.createTextNode(String(Math.max(days,0)))); }
    }

    UI.disable('#payQuarterlyBtn', !current.address);

    try {
      const pr = await ContractsGW.getPricesAndRewards(); // {prices[], rewards[]}
      current.prices = pr.prices;
      const pkg = (n)=> pr.prices.slice(0,n).reduce((a,b)=> a + Number(b), 0);
      const w3 = await Web3GW.getWeb3();
      const set = (id,sum)=>{ const el = document.getElementById(id); if (el) el.textContent = `${w3.utils.fromWei(String(sum),'ether')} BNB`; };
      set('package1Price', pkg(4));
      set('package2Price', pkg(7));
      set('package3Price', pkg(10));
      set('package4Price', pkg(12));
    } catch {}
  }

  async function init() {
    try{
      current.address = await Web3GW.connectSafePalFirst();
      await ContractsGW.initContracts();
      bindDashboard(); bindPartners(); bindMatrix(); bindTokens();
      await refreshDashboard();
      UI.notify('Готово: SafePal подключен, сеть opBNB (204).','success');
    }catch(e){
      UI.notify(`Открой сайт в dApp-браузере SafePal и переключи сеть на opBNB. Детали: ${e?.message||e}`,'error');
    }
  }

  window.App = {
    onAccountsChanged: async (addr)=>{ current.address = addr || null; if (addr) await refreshDashboard(); },
    onChainChanged: async ()=>{ await refreshDashboard(); },
  };

  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(init, 1500); });
})();
