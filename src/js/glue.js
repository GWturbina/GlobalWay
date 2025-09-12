// glue.js — UI glue (full) with anti-skip validation & packages
(function (global) {
  'use strict';

  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const clickLock = new WeakMap(); // element -> true

  function lockClicks(el, ms=1200) {
    if (!el) return false;
    if (clickLock.get(el)) return false;
    clickLock.set(el, true);
    el.classList.add('disabled', 'paused');
    setTimeout(() => { clickLock.delete(el); el.classList.remove('disabled', 'paused'); }, ms);
    return true;
  }

  async function ensureInited() {
    if (!global.web3Manager) global.web3Manager = new global.Web3Manager();
    if (!global.contractManager) {
      const web3 = await global.web3Manager.init();
      global.contractManager = new global.ContractManager(web3);
      await global.contractManager.init();
    }
  }

  async function refreshOverview() {
    try {
      const cm = global.contractManager;
      const [pricesBNB, overview] = await Promise.all([cm.getLevelPrices(), cm.getOverview()]);
      $$('.level-button[data-level]').forEach(btn => {
        const lvl = Number(btn.dataset.level);
        const price = pricesBNB[lvl];
        if (price) {
          const holder = btn.querySelector('.level-price');
          if (holder) holder.textContent = price + ' BNB';
        }
      });
      if (overview) {
        const n = (v)=> (v!=null? String(v): '—');
        $('[data-overview="totalUsers"]')?.replaceChildren(document.createTextNode(n(overview.totalUsers)));
        $('[data-overview="activeUsers"]')?.replaceChildren(document.createTextNode(n(overview.activeUsers)));
        $('[data-overview="totalVolume"]')?.replaceChildren(document.createTextNode(n(overview.totalVolume)));
      }
    } catch (e) { console.warn('refreshOverview failed', e); }
  }

  function parseErr(err) {
    const s = (err && (err.message || err.reason || err.toString())) || 'Unknown error';
    if (/User denied|Rejected|denied/i.test(s)) return 'Пользователь отменил транзакцию';
    if (/insufficient/i.test(s)) return 'Недостаточно средств на gas или value';
    if (/not initialized/i.test(s)) return 'Кошелёк не подключён';
    if (/revert/i.test(s)) return 'Транзакция отклонена контрактом';
    return s;
  }

  function notify(type, message) {
    console[type === 'error' ? 'error' : 'log'](`[${type}] ${message}`);
    const cont = document.querySelector('.notifications-container');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `notification ${type} notification-slide-in`;
    el.textContent = message;
    el.addEventListener('click', () => cont.removeChild(el));
    cont.appendChild(el);
    setTimeout(() => cont.contains(el) && cont.removeChild(el), 5000);
  }

  // ---- Actions ----

  // Single level — only next (no skipping)
  async function onBuyLevel(e) {
    const btn = e.currentTarget;
    if (!lockClicks(btn)) return;
    const level = Number(btn.dataset.level);
    if (!Number.isInteger(level) || level < 1 || level > 12) {
      notify('error', 'Неверный уровень'); return;
    }
    try {
      await ensureInited();
      const cm = global.contractManager;
      const highest = await cm.getHighestActiveLevel();
      const next = highest + 1;
      if (level !== next) {
        if (level <= highest) notify('info', `Уровень ${level} уже активен`);
        else notify('warning', `Нельзя перепрыгивать. Доступен только уровень ${next}.`);
        return;
      }
      await cm.buyLevel(level);
      notify('success', `Уровень ${level} куплен`);
      await refreshOverview();
    } catch (err) { notify('error', parseErr(err)); }
  }

  // Package 1..N — pay only for missing levels
  async function onBuyPackage(e) {
    const btn = e.currentTarget;
    if (!lockClicks(btn)) return;
    const maxLevel = Number(btn.dataset.maxLevel);
    if (!Number.isInteger(maxLevel) || maxLevel < 1 || maxLevel > 12) {
      notify('error', 'Неверный пакет'); return;
    }
    try {
      await ensureInited();
      const cm = global.contractManager;
      const wei = await cm.calculateMissingCost(maxLevel);
      const BN = global.Web3.utils.toBN;
      if (BN(wei).isZero()) {
        notify('info', `Все уровни до ${maxLevel} уже активны`);
        return;
      }
      const bnb = global.Web3.utils.fromWei(wei, 'ether');

      if (!confirm(`Купить пакет 1–${maxLevel}\nНедостающие уровни: ~${bnb} BNB`)) return;
      await cm.buyPackageByMaxLevel(maxLevel);
      notify('success', `Пакет 1–${maxLevel}: покупка отправлена`);
      await refreshOverview();
    } catch (err) { notify('error', parseErr(err)); }
  }

  function wireButtons() {
    $$('.level-button[data-level]').forEach(btn => btn.addEventListener('click', onBuyLevel));
    $$('.package-button[data-max-level]').forEach(btn => btn.addEventListener('click', onBuyPackage));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await ensureInited();
      wireButtons();
      await refreshOverview();
    } catch (e) { console.warn('[GW] init failed:', e); }
  });
})(window);
