(function(){const routes={'/dashboard':'/components/dashboard.html','/partners':'/components/partners.html','/matrix':'/components/matrix.html','/tokens':'/components/tokens.html','/projects':'/components/projects.html','/settings':'/components/settings.html','/admin':'/components/admin.html'};function markActiveNav(hash){try{document.querySelectorAll('.bottom-nav a,.nav a').forEach(a=>a.classList.remove('active'));const link=document.querySelector(`.bottom-nav a[href="#${hash}"]`)||document.querySelector(`.nav a[href="#${hash}"]`);if(link)link.classList.add('active');}catch{}}async function loadComponent(p){const r=await fetch(p,{cache:'no-cache'});if(!r.ok)throw new Error('Cannot load '+p);return await r.text();}async function render(){const hash=location.hash.replace('#','')||'/dashboard';const path=routes[hash]||routes['/dashboard'];const html=await loadComponent(path);markActiveNav(hash);const host=document.getElementById('app');host.innerHTML=html;I18N.apply(host);if(window.GLUE)window.GLUE.wireCurrentPage(hash,host);}window.Router={go:to=>location.hash=to,refresh:render};window.addEventListener('hashchange',render);document.addEventListener('DOMContentLoaded',render);})();(function () {
  const routes = {
    "/dashboard": "/components/dashboard.html",
    "/partners": "/components/partners.html",
    "/matrix": "/components/matrix.html",
    "/tokens": "/components/tokens.html",
    "/projects": "/components/projects.html",
    "/settings": "/components/settings.html",
    "/admin": "/components/admin.html",
  };

  function markActiveNav(hash) {
    try {
      document
        .querySelectorAll(".bottom-nav a, .nav a")
        .forEach((a) => a.classList.remove("active"));
      const link =
        document.querySelector(`.bottom-nav a[href="#${hash}"]`) ||
        document.querySelector(`.nav a[href="#${hash}"]`);
      if (link) link.classList.add("active");
    } catch {}
  }

  async function loadComponent(p) {
    const r = await fetch(p, { cache: "no-cache" });
    if (!r.ok) throw new Error("Cannot load " + p);
    return await r.text();
  }

  async function render() {
    const hash = location.hash.replace("#", "") || "/dashboard";

    // защита: только владелец может на /admin
    if (hash === "/admin" && !window._isOwner) {
      location.hash = "/dashboard";
      return;
    }

    const path = routes[hash] || routes["/dashboard"];
    const html = await loadComponent(path);
    markActiveNav(hash);

    const host = document.getElementById("app");
    host.innerHTML = html;

    // i18n на загруженный фрагмент
    I18N.apply(host);

    // page-specific wiring
    if (window.GLUE) window.GLUE.wireCurrentPage(hash, host);
  }

  window.Router = {
    go: (to) => (location.hash = to),
    refresh: render,
  };

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", render);
})();
