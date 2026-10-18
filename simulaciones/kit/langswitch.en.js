/* Selector de idioma ES/EN: enlace flotante entre index.html e index.en.html */
(function () {
  "use strict";
  var en = /\.en\.html$/.test(location.pathname) || document.documentElement.lang === 'en';
  var alt = document.querySelector('link[rel=alternate][hreflang]');
  var href = en ? (alt ? alt.getAttribute('href') : 'index.html') : 'index.en.html';
  function mount() {
    if (document.querySelector('.lang-switch')) return;
    var a = document.createElement('a');
    a.className = 'lang-switch'; a.href = href;
    a.setAttribute('hreflang', en ? 'es' : 'en'); a.lang = en ? 'es' : 'en';
    a.textContent = en ? 'ES' : 'EN';
    a.setAttribute('aria-label', en ? "Ver en español" : "View in English");
    a.title = a.getAttribute('aria-label');
    var s = a.style;
    s.cssText = 'position:fixed;top:8px;right:8px;z-index:60;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;font:600 13px/1 system-ui,sans-serif;letter-spacing:.04em;text-decoration:none;color:#fff;background:#1f6f6f;border:2px solid #fff;border-radius:22px;padding:0 12px;box-shadow:0 1px 6px rgba(0,0,0,.4)';
    var nav = document.createElement('nav'); nav.setAttribute('aria-label', en ? 'Idioma' : 'Language');
    nav.appendChild(a); document.body.appendChild(nav);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  /* PWA: registra el service worker (funciona sin conexión tras la primera visita) */
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      var me = document.currentScript || document.querySelector('script[src*="langswitch"]');
      if (me && me.src) window.addEventListener('load', function () { navigator.serviceWorker.register(new URL('../sw.js', me.src).href).catch(function () {}); });
    }
  } catch (e) {}
})();
