// i18n.js — lightweight translator
(function (global) {
  'use strict';
  const LANGS = ['en','uk','ru'];
  const storageKey = 'gw_lang';

  function getLang() {
    const forced = location.hash.match(/lang=(en|uk|ru)/)?.[1];
    if (forced) return forced;
    return localStorage.getItem(storageKey) || 'ru';
  }

  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    localStorage.setItem(storageKey, lang);
    apply();
  }

  function t(key) {
    const lang = getLang();
    const dict = (global.__i18n && global.__i18n[lang]) || {};
    return dict[key] || key;
  }

  function apply(root=document) {
    root.querySelectorAll('[data-translate]').forEach(el => {
      const k = el.getAttribute('data-translate');
      el.textContent = t(k);
    });
  }

  global.i18n = { t, apply, getLang, setLang };
  document.addEventListener('DOMContentLoaded', ()=> apply());
})(window);
