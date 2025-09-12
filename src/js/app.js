(async function(){
  try {
    await window.web3Manager.init();
    await window.contractManager.init();

    async function refreshOwnerUI(){
      const addr = window.web3Manager.getAddress();
      const isOwner = addr ? await window.contractManager.isOwner(addr) : false;

      // Флаг для роутера
      window._isOwner = isOwner;

      // Показать/скрыть все элементы с классом admin-only
      document.querySelectorAll('.admin-only').forEach(el=>{
        el.style.display = isOwner ? '' : 'none';
      });

      // Если не владелец и открыт /admin — вернуть на дашборд
      if (!isOwner && location.hash === '#/admin') {
        location.hash = '/dashboard';
      }
    }

    // Первый прогон (на случай, если кошелёк уже подключён)
    refreshOwnerUI();

    // После нажатия Connect — перепроверить права
    document.getElementById('connectBtn')?.addEventListener('click', async ()=>{
      try {
        await window.web3Manager.connect();
        await refreshOwnerUI();
        window.Router.refresh();
      } catch(e){ console.error(e); }
    });
  } catch(e){ console.error(e); }
})();
