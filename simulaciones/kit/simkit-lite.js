/* simkit-lite.js — Capa común para simulaciones con diseño propio (Laboratorio MACEDONIA, UMCE).
   Agrega, sin tocar la interfaz existente:
   · Lección guiada por etapas con reproductor (anterior / reproducir / siguiente) y foco en elementos.
   · Barra de herramientas: volver, captura PNG, pantalla completa, tema (opcional) y ayuda con atajos.
   Sin dependencias. Licencia MIT. */
(function (global) {
  'use strict';
  var IC = {
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z" fill="currentColor" stroke="none"/>',
    restart: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3M3.5 4v4.8h4.8"/>',
    prev: '<path d="M6 5v14M19 5.5v13L9 12z"/>',
    next: '<path d="M18 5v14M5 5.5v13L15 12z"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    help: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.4-2.9 4.4M12 17.6h.01"/>',
    home: '<path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"/>',
    theme: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    lesson: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20M9 8h7M9 12h5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function ic(n) { return '<svg class="sk-ic" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function loadCss() {
    if (document.getElementById('sk-lite-css')) return;
    var cur = document.currentScript || (function () { var s = document.querySelectorAll('script[src*="simkit-lite"]'); return s[s.length - 1]; })();
    if (cur && cur.src) {
      var l = document.createElement('link'); l.id = 'sk-lite-css'; l.rel = 'stylesheet'; l.href = cur.src.replace(/simkit-lite\.js.*$/, 'simkit-lite.css'); document.head.appendChild(l);
    }
  }
  loadCss();

  function attach(cfg) {
    var stages = (cfg.stages || []).map(function (s) { s.dur = s.dur || 8; return s; });
    var S = { open: false, i: 0, playing: false, t: 0, speed: 1, helpOpen: false };
    var root = h('div', 'sk-root'); root.setAttribute('data-sk-theme', detectTheme());
    document.body.appendChild(root);

    function detectTheme() {
      var d = document.documentElement, b = document.body;
      var t = d.getAttribute('data-theme') || b.getAttribute('data-theme') || (d.classList.contains('dark') ? 'dark' : d.classList.contains('light') ? 'light' : '');
      if (t === 'dark' || t === 'light') return t;
      if (cfg.forceTheme) return cfg.forceTheme;
      var bg = getComputedStyle(b).backgroundColor; var m = bg.match(/\d+/g);
      if (m && m.length >= 3 && !(m.length === 4 && +m[3] === 0)) { return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) < 128 ? 'dark' : 'light'; }
      return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function syncTheme() { root.setAttribute('data-sk-theme', detectTheme()); }
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });

    /* ---- Barra de herramientas ---- */
    var bar = h('nav', 'sk-bar'); bar.setAttribute('aria-label', 'Herramientas de la simulación');
    function btn(id, icon, title, fn, href) {
      var b = href ? h('a', 'sk-btn') : h('button', 'sk-btn');
      b.id = 'sk-' + id; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = ic(icon);
      if (href) b.href = href; else { b.type = 'button'; b.addEventListener('click', fn); }
      bar.appendChild(b); return b;
    }
    if (cfg.home) btn('home', 'home', 'Volver a las simulaciones', null, cfg.home);
    if (stages.length) btn('lesson', 'lesson', 'Lección guiada (L)', function () { toggleLesson(); });
    if (cfg.snapshot !== false) btn('snap', 'camera', 'Capturar imagen (S)', snapshot);
    btn('full', 'expand', 'Pantalla completa (F)', fullscreen);
    if (cfg.themeToggle) btn('theme', 'theme', 'Cambiar tema claro/oscuro (T)', function () { cfg.themeToggle(); setTimeout(syncTheme, 50); });
    btn('help', 'help', 'Ayuda y atajos (?)', openHelp);
    root.appendChild(bar);

    /* ---- Lección ---- */
    var dock = null, ring = null;
    if (stages.length) {
      dock = h('section', 'sk-dock'); dock.hidden = true; dock.setAttribute('aria-label', 'Lección guiada');
      dock.innerHTML =
        '<div class="sk-dock-head"><span class="sk-kick" id="sk-kick"></span><button class="sk-x" id="sk-close" aria-label="Cerrar lección" title="Cerrar (Esc)">' + ic('close') + '</button></div>' +
        '<h3 id="sk-title"></h3><div class="sk-text" id="sk-text" aria-live="polite"></div>' +
        '<div class="sk-ctl">' +
        '<button class="sk-btn sm" id="sk-reset" aria-label="Reiniciar" title="Reiniciar">' + ic('restart') + '</button>' +
        '<button class="sk-btn sm" id="sk-prev" aria-label="Etapa anterior" title="Anterior (Mayús + ←)">' + ic('prev') + '</button>' +
        '<button class="sk-play" id="sk-play" aria-label="Reproducir" title="Reproducir / pausar (Espacio)">' + ic('play') + '</button>' +
        '<button class="sk-btn sm" id="sk-next" aria-label="Etapa siguiente" title="Siguiente (Mayús + →)">' + ic('next') + '</button>' +
        '<div class="sk-segs" id="sk-segs" role="tablist"></div>' +
        '<select id="sk-speed" aria-label="Velocidad"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select>' +
        '</div>';
      root.appendChild(dock);
      var segs = dock.querySelector('#sk-segs');
      stages.forEach(function (s, i) {
        var b = h('button', 'sk-seg'); b.type = 'button'; b.title = (i + 1) + '. ' + s.name; b.setAttribute('aria-label', 'Ir a la etapa ' + (i + 1) + ': ' + s.name);
        b.innerHTML = '<i></i>'; b.addEventListener('click', function () { goStage(i, false); }); segs.appendChild(b);
      });
      dock.querySelector('#sk-close').addEventListener('click', function () { toggleLesson(false); });
      dock.querySelector('#sk-play').addEventListener('click', togglePlay);
      dock.querySelector('#sk-prev').addEventListener('click', function () { goStage(S.i - 1, false); });
      dock.querySelector('#sk-next').addEventListener('click', function () { goStage(S.i + 1, false); });
      dock.querySelector('#sk-reset').addEventListener('click', function () { goStage(0, false); });
      dock.querySelector('#sk-speed').addEventListener('change', function (e) { S.speed = parseFloat(e.target.value); });
      ring = h('div', 'sk-ring'); ring.hidden = true; root.appendChild(ring);
    }
    function toggleLesson(force) {
      if (!dock) return;
      S.open = force == null ? !S.open : !!force;
      dock.hidden = !S.open; if (!S.open) { S.playing = false; hideRing(); updatePlay(); document.body.classList.remove('sk-lesson-open'); }
      else { document.body.classList.add('sk-lesson-open'); goStage(S.i, false); }
      var lb = document.getElementById('sk-lesson'); if (lb) lb.setAttribute('aria-pressed', S.open ? 'true' : 'false');
    }
    function updatePlay() {
      var p = dock && dock.querySelector('#sk-play'); if (!p) return;
      p.innerHTML = ic(S.playing ? 'pause' : 'play'); p.setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
    }
    function togglePlay() { if (!S.open) return; S.playing = !S.playing; if (S.playing && S.t >= 1) goStage(0, true); updatePlay(); }
    function goStage(i, keepPlay) {
      i = clamp(i, 0, stages.length - 1);
      S.i = i; S.t = 0; if (!keepPlay) { S.playing = false; updatePlay(); }
      var s = stages[i];
      dock.querySelector('#sk-kick').textContent = 'Etapa ' + (i + 1) + ' de ' + stages.length;
      dock.querySelector('#sk-title').innerHTML = s.title || s.name;
      dock.querySelector('#sk-text').innerHTML = s.text || '';
      dock.querySelectorAll('.sk-seg').forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); b.firstChild.style.width = k < i ? '100%' : (k === i ? '0%' : '0%'); });
      if (s.apply) { try { s.apply(api, i); } catch (e) { if (global.console) console.warn('[lección]', e); } }
      focusOn(s.focus);
    }
    function focusOn(sel) {
      hideRing();
      if (!sel) return;
      var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return;
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* nada */ }
      S.focusEl = el; setTimeout(placeRing, 350); setTimeout(placeRing, 800);
    }
    function placeRing() {
      if (!S.focusEl || !S.open) return;
      var r = S.focusEl.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) { ring.hidden = true; return; }
      ring.hidden = false; ring.style.left = (r.left - 6) + 'px'; ring.style.top = (r.top - 6) + 'px'; ring.style.width = (r.width + 12) + 'px'; ring.style.height = (r.height + 12) + 'px';
    }
    function hideRing() { S.focusEl = null; if (ring) ring.hidden = true; }
    window.addEventListener('resize', placeRing); window.addEventListener('scroll', placeRing, true);

    var last = null;
    function loop(now) {
      requestAnimationFrame(loop);
      var dt = last == null ? 0 : Math.min((now - last) / 1000, 0.1); last = now;
      if (!S.open || !stages.length) return;
      if (S.playing) {
        var s = stages[S.i];
        S.t += dt * S.speed / s.dur;
        if (S.t >= 1) { if (S.i < stages.length - 1) goStage(S.i + 1, true); else { S.t = 1; S.playing = false; updatePlay(); } }
        else if (s.tick) { try { s.tick(S.t, api); } catch (e) { /* nada */ } }
      }
      var seg = dock.querySelectorAll('.sk-seg')[S.i]; if (seg) seg.firstChild.style.width = (clamp(S.t, 0, 1) * 100) + '%';
      if (S.focusEl) placeRing();
    }
    requestAnimationFrame(loop);

    /* ---- Captura ---- */
    function pickTargets() {
      var t = typeof cfg.snapshot === 'function' ? cfg.snapshot() : null;
      if (t) return [].concat(t);
      var cvs = Array.prototype.slice.call(document.querySelectorAll('canvas')).filter(function (c) { var r = c.getBoundingClientRect(); return r.width > 80 && r.height > 80 && r.bottom > 0 && r.top < innerHeight; });
      cvs.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
      if (cvs.length) return [cvs[0]];
      var svgs = Array.prototype.slice.call(document.querySelectorAll('svg')).filter(function (c) { var r = c.getBoundingClientRect(); return r.width > 120 && r.height > 120; });
      svgs.sort(function (a, b) { return b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height; });
      return svgs.length ? [svgs[0]] : [];
    }
    function snapshot() {
      if (cfg.beforeSnapshot) { try { cfg.beforeSnapshot(); } catch (e) { /* nada */ } }
      var ts = pickTargets();
      if (!ts.length) { toast('No hay una imagen que capturar'); return; }
      var el = ts[0];
      var dark = root.getAttribute('data-sk-theme') === 'dark';
      function finish(src, w, h2) {
        var out = document.createElement('canvas'); var pad = 0; out.width = w; out.height = h2 + 30; var ctx = out.getContext('2d');
        ctx.fillStyle = dark ? '#0d141c' : '#ffffff'; ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(src, pad, pad, w, h2);
        ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = dark ? '#9fb0c0' : '#55667a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText((cfg.title || 'Simulación') + ' · Laboratorio MACEDONIA · UMCE', 10, h2 + 15);
        var a = document.createElement('a'); a.download = (cfg.key || 'simulacion') + '.png';
        try { a.href = out.toDataURL('image/png'); a.click(); toast('Imagen guardada'); } catch (e) { toast('No se pudo capturar la imagen'); }
      }
      if (el.tagName === 'CANVAS') { finish(el, el.width, el.height); }
      else {
        var r = el.getBoundingClientRect(); var clone = el.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', r.width); clone.setAttribute('height', r.height);
        try { /* conserva los estilos calculados (colores por variables CSS, tipografía) en la copia */
          var PR = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'visibility', 'display'];
          var A = [el].concat([].slice.call(el.querySelectorAll('*'))), B = [clone].concat([].slice.call(clone.querySelectorAll('*')));
          A.forEach(function (n, i) { var cs = getComputedStyle(n), t = B[i]; if (!t || !t.style) return; PR.forEach(function (k) { var v = cs.getPropertyValue(k); if (v) t.style.setProperty(k, v); }); });
        } catch (e) { /* sin estilos en línea */ }
        var xml = new XMLSerializer().serializeToString(clone);
        var img = new Image(); img.onload = function () { finish(img, Math.round(r.width * 2), Math.round(r.height * 2)); };
        img.onerror = function () { toast('No se pudo capturar la imagen'); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      }
    }
    function fullscreen() {
      var d = document;
      if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); } else d.exitFullscreen();
    }
    function toast(msg) { var t = h('div', 'sk-toast'); t.setAttribute('role', 'status'); t.textContent = msg; root.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }

    /* ---- Ayuda ---- */
    var dlg = h('dialog', 'sk-dlg'); dlg.setAttribute('aria-labelledby', 'sk-help-title');
    var keys = [];
    if (stages.length) keys.push(['L', 'Abrir o cerrar la lección guiada'], ['Espacio', 'Reproducir / pausar la lección'], ['Mayús + ← →', 'Etapa anterior / siguiente']);
    keys.push(['S', 'Capturar imagen PNG'], ['F', 'Pantalla completa']);
    if (cfg.themeToggle) keys.push(['T', 'Tema claro / oscuro']);
    keys.push(['?', 'Esta ayuda']); (cfg.extraKeys || []).forEach(function (k) { keys.push(k); });
    dlg.innerHTML = '<form method="dialog"><h2 id="sk-help-title">Cómo usar esta simulación</h2>' +
      ((cfg.help && cfg.help.intro) ? '<p>' + cfg.help.intro + '</p>' : '') +
      ((cfg.help && cfg.help.items) ? '<ul>' + cfg.help.items.map(function (i) { return '<li><b>' + i[0] + '</b>: ' + i[1] + '</li>'; }).join('') + '</ul>' : '') +
      '<table class="sk-keys">' + keys.map(function (k) { return '<tr><td><kbd>' + k[0] + '</kbd></td><td>' + k[1] + '</td></tr>'; }).join('') + '</table>' +
      '<menu><button class="sk-primary" value="ok">Entendido</button></menu></form>';
    root.appendChild(dlg);
    function openHelp() { if (dlg.showModal) dlg.showModal(); }

    window.addEventListener('keydown', function (e) {
      var tg = e.target, tn = tg && tg.tagName;
      if ((tn === 'INPUT' && tg.type !== 'range' && tg.type !== 'checkbox' && tg.type !== 'radio') || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || dlg.open) return;
      var k = e.key;
      if (k === 'l' || k === 'L') { if (stages.length) toggleLesson(); }
      else if (k === 'Escape' && S.open) toggleLesson(false);
      else if (k === ' ' && S.open) { e.preventDefault(); togglePlay(); }
      else if (e.shiftKey && k === 'ArrowRight' && S.open) { e.preventDefault(); goStage(S.i + 1, false); }
      else if (e.shiftKey && k === 'ArrowLeft' && S.open) { e.preventDefault(); goStage(S.i - 1, false); }
      else if (k === 's' || k === 'S') snapshot();
      else if (k === 'f' || k === 'F') fullscreen();
      else if ((k === 't' || k === 'T') && cfg.themeToggle) { cfg.themeToggle(); setTimeout(syncTheme, 50); }
      else if (k === '?') openHelp();
    });

    var api = { goStage: goStage, toggleLesson: toggleLesson, toast: toast, snapshot: snapshot, state: S, root: root, focus: focusOn };
    if (global.location && /[?&]lesson=1/.test(location.search)) setTimeout(function () { toggleLesson(true); }, 400);
    return api;
  }

  global.SimKitLite = { attach: attach };
})(window);
