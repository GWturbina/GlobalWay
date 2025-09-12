// src/js/i18n.js
(() => {
  const STORAGE_KEY = 'gw_lang';
  const DEFAULT_LANG = 'ru';

  let _lang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  let _dict = {};

  async function _load(lang) {
    const path = `/src/translations/${lang}.json`;
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Не удалось загрузить ${path}`);
    _dict = await res.json();
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, _lang);
    document.documentElement.setAttribute('lang', _lang);
  }

  function t(key, vars = {}) {
    const val = key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), _dict);
    let out = (val == null ? key : String(val));
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v);
    return out;
  }

  async function setLang(lang) {
    if (lang === _lang && Object.keys(_dict).length) return;
    await _load(lang);
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: _lang } }));
  }

  function applyDOM(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const txt = t(key);
      if (el.hasAttribute('data-i18n-placeholder')) el.setAttribute('placeholder', txt);
      else el.textContent = txt;
    });
  }

  async function init() {
    try {
      await _load(_lang);
    } catch (e) {
      if (_lang !== 'en') await _load('en');
    }
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: _lang } }));
  }

  window.I18N = { init, t, setLang, applyDOM, apply: applyDOM, get lang(){ return _lang; } };
})();
