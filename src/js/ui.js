// src/js/ui.js
(() => {
  function short(addr) {
    return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '0x000...000';
  }

  function setText(id, value) {
    const el = document.querySelector(id);
    if (el) el.textContent = value;
  }

  function disable(sel, v = true) {
    const el = document.querySelector(sel);
    if (el) el.disabled = v;
  }

  function notify(message, type = 'info', timeout = 4000) {
    // Лёгкий тост без зависимостей
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    Object.assign(t.style, {
      position: 'fixed', right: '16px', bottom: '16px',
      padding: '10px 14px', background: 'rgba(0,0,0,.8)',
      color: '#fff', borderRadius: '10px', zIndex: 9999
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), timeout);
  }

  // Формирование реф-ссылки с префиксом
  function makeReferralLink(prefix, userId7) {
    const id = userId7 || '0000000';
    return `https://www.globalway.club/ref${prefix}${id}`;
  }

  const Copy = {
    copyToClipboard(text) {
      navigator.clipboard?.writeText(text)
        .then(() => notify('Скопировано', 'success'))
        .catch(() => notify('Не удалось скопировать', 'error'));
    }
  };

  window.UI = { short, setText, disable, notify, makeReferralLink, Copy };
})();
