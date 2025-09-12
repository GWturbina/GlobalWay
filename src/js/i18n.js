// Лёгкий i18n: подгружаем JSON по выбранному языку и проставляем тексты
window.I18N = {
  lang: localStorage.getItem("gw_lang") || "ru",
  dicts: {},

  async setLang(l) {
    this.lang = l;
    localStorage.setItem("gw_lang", l);
    await this._load(l);
    this.apply();
  },

  async _load(l) {
    if (this.dicts[l]) return;
    try {
      const r = await fetch(`/translations/${l}.json`, { cache: "no-cache" });
      this.dicts[l] = r.ok ? await r.json() : {};
    } catch {
      this.dicts[l] = {};
    }
  },

  t(key) {
    return (this.dicts[this.lang] && this.dicts[this.lang][key]) || key;
  },

  apply(root = document) {
    root.querySelectorAll("[data-translate]").forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-translate"));
    });
  },
};

// Автоподключение на загрузке
document.addEventListener("DOMContentLoaded", async () => {
  const s = document.getElementById("langSelect");
  if (s) {
    s.value = I18N.lang;
    s.onchange = (e) => I18N.setLang(e.target.value);
  }
  await I18N.setLang(I18N.lang);
});
