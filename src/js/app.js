// src/js/app.js
(async () => {
  const ADDR = {
    GlobalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
    GWTToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc',
    GlobalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4',
  };

  let current = {
    address: null,
    bnb: '0.0000',
    isActive: false,
    activeLevels: new Set(),
    rewards: [],
    prices: [],
  };

  function bindDashboard() {
    // Кнопка Квартальной оплаты
    const btn = document.getElementById('payQuarterlyBtn'); // :contentReference[oaicite:23]{index=23}
    if (btn) {
      btn.addEventListener('click', async () => {
        try {
          // 0.075 BNB → в wei
          const w3 = await Web3GW.getWeb3();
          const valueWei = w3.utils.toWei('0.075', 'ether');
          await ContractsGW.payQuarterly(current.address, valueWei);
          UI.notify('Квартальная активность оплачена', 'success');
          await refreshDashboard();
        } catch (e) {
          UI.notify(`Отклонено/ошибка: ${e?.message || e}`, 'error');
        }
      });
    }

    // Быстрые пакеты (1–4/7/10/12)
    document.querySelectorAll('.quick-buy-btn').forEach((el) => {
      el.addEventListener('click', async () => {
        const max = Number(el.dataset.maxLevel || el.getAttribute('data-max-level') || 4);
        try {
          await ContractsGW.buyPackage(max, current.address);
          UI.notify(`Пакет 1-${max} активирован`, 'success');
          await refreshDashboard();
        } catch (e) {
          UI.notify(`Ошибка покупки пакета: ${e?.message || e}`, 'error');
        }
      });
    });
  }

  function bindPartners() {
    // Вкладки уровней 1..12, таблица partnersTableBody, partnerReferralLink
    const link = document.getElementById('partnerReferralLink'); // :contentReference[oaicite:24]{index=24}
    if (link) {
      // формируем refGW
      const userId = document.getElementById('userId')?.textContent?.trim() || '0000000'; // :contentReference[oaicite:25]{index=25}
      link.value = UI.makeReferralLink('GW', userId);
      const copyBtn = document.getElementById('copyPartnerRefLink');
      copyBtn?.addEventListener('click', () => UI.Copy.copyToClipboard(link.value));
    }
  }

  function bindMatrix() {
    // Рендер на canvas (#matrixCanvas), фильтры и тултип — пока заглушки
    // Всё готово по id: #matrixCanvas, #matrixTooltip, селекторы уровней/статусов/таблица  :contentReference[oaicite:26]{index=26} :contentReference[oaicite:27]{index=27}
  }

  function bindTokens() {
    // Таблица истории #tokenHistoryBody; награды отображаются статически в твоём HTML (5,5,10,...,4500 GWT) :contentReference[oaicite:28]{index=28} :contentReference[oaicite:29]{index=29}
  }

  async function refreshDashboard() {
    // Адрес/баланс
    UI.setText('#userAddress', UI.short(current.address)); // :contentReference[oaicite:30]{index=30}
    current.bnb = await Web3GW.getBNBBalance(current.address);
    UI.setText('#userBalance', `${Number(current.bnb).toFixed(4)} BNB`);

    // Данные пользователя с контракта
    const ud = await ContractsGW.getUserData(current.address); // isRegistered, sponsor, registrationTime, lastActivity, personalInvites, totalEarned, leaderRank
    const st = await ContractsGW.getUserStats(current.address); // activeLevels[], totalEarned и пр.
    current.isActive = await ContractsGW.isUserActive(current.address);

    // userId у тебя хранится off-chain (генерация 7-значного) → пока берём из localStorage или показываем '---'
    const userId = localStorage.getItem('gw_userId') || '---';
    UI.setText('#userId', userId); // :contentReference[oaicite:31]{index=31}

    // Доходы
    const earnedBnB = (Number(st.totalEarned || '0') / 1e18).toFixed(4);
    UI.setText('#totalEarned', `${earnedBnB} BNB`); // :contentReference[oaicite:32]{index=32}

    // Квартал (расчёт простой: lastActivity + 90д)
    if (Number(ud.lastActivity) > 0) {
      const last = new Date(Number(ud.lastActivity) * 1000);
      const next = new Date(last.getTime() + 90 * 24 * 3600 * 1000);
      document.querySelector('#lastQuarterlyPayment')?.replaceChildren(document.createTextNode(last.toLocaleDateString()));
      document.querySelector('#nextQuarterlyDate')?.replaceChildren(document.createTextNode(next.toLocaleDateString()));
      const days = Math.ceil((next - Date.now()) / (24 * 3600 * 1000));
      const warn = document.getElementById('quarterlyWarning');
      if (days <= 10 && warn) {
        warn.classList.remove('hidden');
        document.getElementById('daysRemaining').textContent = Math.max(days, 0);
      }
    }

    // Кнопка оплаты квартала активна, если подключен
    UI.disable('#payQuarterlyBtn', !current.address);

    // Быстрые пакеты — подсказки цен берём из Stats (если нужно показать)
    try {
      const pr = await ContractsGW.getPricesAndRewards(); // prices[], rewards[]
      current.prices = pr.prices;
      // Можно рассчитать суммы пакетов и подставить в #package1Price/#package2Price/...
      const pkg = (n) => pr.prices.slice(0, n).reduce((a, b) => a + Number(b), 0);
      const w3 = await Web3GW.getWeb3();
      const set = (id, sum) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${w3.utils.fromWei(String(sum), 'ether')} BNB`;
      };
      set('package1Price', pkg(4));   // 1–4
      set('package2Price', pkg(7));   // 1–7
      set('package3Price', pkg(10));  // 1–10
      set('package4Price', pkg(12));  // 1–12
    } catch {}
  }

  async function init() {
    try {
      // Лоадер на index.html можно держать до connectSafePalFirst()
      current.address = await Web3GW.connectSafePalFirst();
      await ContractsGW.initContracts();

      bindDashboard();
      bindPartners();
      bindMatrix();
      bindTokens();

      await refreshDashboard();
      UI.notify('Готово: кошелёк подключён (SafePal), сеть opBNB (204).', 'success');
    } catch (e) {
      UI.notify(`Нужно открыть сайт в dApp-браузере SafePal и переключить сеть на opBNB. Детали: ${e?.message || e}`, 'error');
    }
  }

  // Хуки для изменений кошелька/сети
  window.App = {
    onAccountsChanged: async (addr) => {
      current.address = addr || null;
      if (addr) await refreshDashboard();
    },
    onChainChanged: async () => {
      await refreshDashboard();
    },
  };

  // Автостарт через 3–5 секунд лоадера (сплэш на index.html)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 1500); // можно поставить 3000–5000 по вкусу
  });
})();
