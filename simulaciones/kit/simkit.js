/* simkit.js — Kit común de las simulaciones del Laboratorio MACEDONIA.
   Entrega: barra superior (tema, captura, pantalla completa, ayuda), visor, panel con pestañas,
   capas y vistas, reproductor por etapas con línea de tiempo, ayuda con atajos y utilidades
   de interfaz (controles, barras, gráficos en canvas, desafío tipo quiz).
   Sin dependencias. Licencia MIT. */
(function (global) {
  'use strict';

  var ICONS = {
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z" fill="currentColor" stroke="none"/>',
    restart: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3M3.5 4v4.8h4.8"/>',
    prev: '<path d="M6 5v14M19 5.5v13L9 12z"/>',
    next: '<path d="M18 5v14M5 5.5v13L15 12z"/>',
    loop: '<path d="M17 3l3.5 3.5L17 10M4 11V9.5A3 3 0 0 1 7 6.5h13M7 21l-3.5-3.5L7 14M20 13v1.5a3 3 0 0 1-3 3H4"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>',
    sun: '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    help: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.4-2.9 4.4M12 17.6h.01"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    panel: '<path d="M3.5 5h17v14h-17zM14.5 5v14"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
    home: '<path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
  };
  function icon(id) { return '<svg class="ic" aria-hidden="true" viewBox="0 0 24 24">' + ICONS[id] + '</svg>'; }
  function chev() { return '<svg class="ic hud-chev" aria-hidden="true" viewBox="0 0 24 24">' + ICONS.chev + '</svg>'; }

  function $(s, r) { return (r || document).querySelector(s); }
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(n, d) {
    if (d == null) d = 1;
    if (!isFinite(n)) return '–';
    return Number(n).toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ------------------------------------------------------------------ */
  function create(cfg) {
    var key = 'simkit:' + (cfg.key || 'sim');
    var prefs = store.get(key, {});
    var root = document.documentElement;
    var params = new URLSearchParams(location.search);
    if (params.get('embed') === '1') document.body.classList.add('embed');

    // Colores de acento por tema
    if (cfg.accent) {
      root.style.setProperty('--acc-dark', cfg.accent.dark || cfg.accent);
      root.style.setProperty('--acc-light', cfg.accent.light || cfg.accent.dark || cfg.accent);
    }
    if (cfg.palette) {
      ['a', 'b', 'c', 'd'].forEach(function (k, i) { if (cfg.palette[i]) root.style.setProperty('--k-' + k, cfg.palette[i]); });
    }

    var stages = (cfg.stages || []).map(function (s) { s.dur = s.dur || 4; return s; });
    var total = stages.reduce(function (a, s) { return a + s.dur; }, 0) || 1;
    var starts = []; var acc = 0;
    stages.forEach(function (s) { starts.push(acc / total); acc += s.dur; });
    starts.push(1);

    var S = {
      t: 0, playing: false, loop: prefs.loop !== false, guided: !!prefs.guided, speed: prefs.speed || 1,
      stage: 0, layers: {}, view: null, mode: cfg.modes && cfg.modes[0] ? cfg.modes[0].id : null,
      theme: prefs.theme || (global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    };
    var kit = { state: S, cfg: cfg, icon: icon, fmt: fmt, clamp: clamp, store: store, h: h };

    /* ---------- Estructura ---------- */
    var app = h('div', { id: 'app' });
    var modeTabs = '';
    if (cfg.modes && cfg.modes.length) {
      modeTabs = '<nav class="mode-tabs" role="tablist" aria-label="' + (cfg.modesLabel || 'Modo') + '">' +
        cfg.modes.map(function (m) {
          return '<button role="tab" class="mode-tab" data-mode="' + m.id + '" style="--mc:' + (m.color || 'var(--accent)') + '"><b>' + m.label + '</b>' + (m.sub ? '<span>' + m.sub + '</span>' : '') + '</button>';
        }).join('') + '</nav>';
    }
    var homeHref = cfg.home || '../../';
    app.innerHTML =
      '<header class="topbar">' +
        '<div class="brand"><span class="brand-mark" aria-hidden="true"></span>' +
        '<div class="brand-text"><h1 class="brand-title">' + cfg.title + '</h1><small>' + (cfg.subtitle || '') + '</small></div></div>' +
        modeTabs +
        '<div class="top-actions">' +
          '<a class="icon-btn" id="kHome" href="' + homeHref + '" title="Volver a las simulaciones" aria-label="Volver a las simulaciones">' + icon('home') + '</a>' +
          '<button class="icon-btn" id="kSnap" title="Capturar imagen (S)" aria-label="Capturar imagen">' + icon('camera') + '</button>' +
          '<button class="icon-btn" id="kFull" title="Pantalla completa (F)" aria-label="Pantalla completa">' + icon('expand') + '</button>' +
          '<button class="icon-btn" id="kTheme" title="Cambiar tema claro/oscuro (T)" aria-label="Cambiar tema">' + icon('sun') + '</button>' +
          '<button class="icon-btn" id="kHelp" title="Ayuda y atajos (?)" aria-label="Ayuda">' + icon('help') + '</button>' +
          '<button class="icon-btn" id="kPanelBtn" title="Mostrar/ocultar panel (P)" aria-label="Panel" aria-controls="panel" aria-expanded="true">' + icon('panel') + '</button>' +
        '</div>' +
      '</header>' +
      '<main class="stage" id="main"><div class="sr-only" id="srLive" role="status" aria-live="polite" aria-atomic="true"></div>' +
        '<div id="canvas-container" class="viewport" role="group" tabindex="0" aria-roledescription="visor 3D" aria-label="' + (cfg.viewLabel || 'Visor interactivo') + '" aria-describedby="' + (stages.length ? 'phName ' : '') + 'viewHint"></div><span class="sr-only" id="viewHint">Con el visor enfocado: flechas para girar la cámara, más y menos para acercar o alejar.</span>' +
        '<div class="vignette" aria-hidden="true"></div>' +
        (stages.length ? '<div class="hud hud-phase" id="phaseBadge"><span class="ph-step" id="phStep"></span><span class="ph-name" id="phName"></span><span class="ph-ts" id="phTs" hidden>[‡]</span></div>' : '') +
        '<button class="icon-btn k-clean-btn" id="kClean" title="Ocultar los paneles para ver toda la simulación (O)" aria-label="Ocultar los paneles" aria-pressed="false">' + icon('eyeOff') + '</button>' +
        '<div class="hud-col" id="hudCol">' +
          '<section class="hud hud-eq" id="eqBox" aria-label="Datos en vivo" hidden><div class="eq-head"><span class="eq-chip" id="eqChip"></span><span class="eq-name" id="eqName"></span>' +
            '<button class="hud-x" id="eqToggle" title="Contraer / expandir" aria-label="Datos en vivo" aria-controls="eqBody" aria-expanded="true">' + chev() + '</button></div><div class="eq-body" id="eqBody"></div></section>' +
          '<section class="hud hud-layers" id="layersBox" aria-label="Capas del visor" hidden>' +
            '<button class="layers-head" id="layersHead" aria-expanded="true">' + icon('layers') + '<span>Capas</span>' + chev() + '</button>' +
            '<div class="layers-body" id="layersBody"></div>' +
            '<div class="views" id="viewsBox" hidden><span class="lbl">Vista</span><div class="seg" id="viewSeg" role="group" aria-label="Vista de cámara"></div></div>' +
          '</section>' +
        '</div>' +
        '<section class="hud hud-legend" id="legend" aria-label="Leyenda" hidden>' +
          '<button class="layers-head" id="legendHead" aria-controls="legendBody" aria-expanded="true"><span>Leyenda</span>' + chev() + '</button><div class="lg-body" id="legendBody"></div></section>' +
        '<aside class="panel" id="panel" aria-label="Panel de la simulación"><div class="panel-head"><div class="panel-tabs" role="tablist" id="ptabs"></div>' +
          '<button class="hud-x panel-x" id="kPanelX" title="Ocultar panel (P)" aria-label="Ocultar panel" aria-controls="panel">' + icon('close') + '</button></div>' +
          '<div class="panel-body" id="pbody" tabindex="0"></div></aside>' +
        (stages.length ? dockHTML() : '') +
      '</main>';
    document.body.innerHTML = '';
    document.body.appendChild(app);

    var dlg = h('dialog', { id: 'helpDlg', class: 'help-dlg', 'aria-labelledby': 'helpTitle' });
    document.body.appendChild(dlg);

    function dockHTML() {
      return '<section class="dock" id="dock" aria-label="Controles de reproducción"><div class="dock-row">' +
        '<button class="icon-btn" id="bReset" title="Reiniciar (R)" aria-label="Reiniciar">' + icon('restart') + '</button>' +
        '<button class="icon-btn" id="bPrev" title="Etapa anterior (Mayús + ←)" aria-label="Etapa anterior">' + icon('prev') + '</button>' +
        '<button class="play-btn" id="bPlay" title="Reproducir / pausar (Espacio)" aria-label="Reproducir">' + icon('play') + '</button>' +
        '<button class="icon-btn" id="bNext" title="Etapa siguiente (Mayús + →)" aria-label="Etapa siguiente">' + icon('next') + '</button>' +
        '<button class="icon-btn toggle" id="bLoop" title="Repetir en bucle" aria-label="Repetir" aria-pressed="true">' + icon('loop') + '</button>' +
        '<div class="timeline" id="timeline"><div class="segs" id="segs" aria-hidden="true"></div><div class="ticks" id="ticks" aria-hidden="true"></div>' +
        '<input type="range" id="slider" min="0" max="1" step="0.0005" value="0" aria-label="Progreso de la lección"></div>' +
        '<output class="pct" id="pct">0 %</output>' +
        '<div class="dock-opts"><label class="mini-select" title="Velocidad de reproducción"><select id="speed" aria-label="Velocidad">' +
        '<option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>' +
        '<button class="chip-btn toggle" id="bGuided" aria-pressed="false" title="Pausa al terminar cada etapa">Por etapas</button></div>' +
        '<button class="icon-btn dock-min" id="bDockMin" title="Minimizar / expandir la barra" aria-label="Barra de reproducción" aria-controls="dock" aria-expanded="true">' + chev() + '</button>' +
        '</div></section>';
    }
    function keyRows() {
      var rows = [];
      if (stages.length) rows.push(['Espacio', 'Reproducir / pausar'], ['Mayús + ← →', 'Etapa anterior / siguiente'], ['← →', 'Retroceder / avanzar un poco'], ['R', 'Reiniciar']);
      if (cfg.layers && cfg.layers.length) rows.push(['1 – 9', 'Activar o desactivar capas']);
      if (cfg.views && cfg.views.length) rows.push(['V', 'Cambiar vista de cámara']);
      rows.push(['P', 'Mostrar / ocultar el panel'], ['O', 'Vista despejada: ocultar / mostrar todos los paneles'], ['Esc', 'Salir de la vista despejada']);
      rows.push(['T', 'Tema claro / oscuro'], ['S', 'Capturar imagen PNG'], ['F', 'Pantalla completa'], ['?', 'Esta ayuda']);
      (cfg.extraKeys || []).forEach(function (r) { rows.push(r); });
      return rows.map(function (r) { return '<tr><td><kbd>' + r[0] + '</kbd></td><td>' + r[1] + '</td></tr>'; }).join('');
    }

    kit.viewport = $('#canvas-container');
    kit.panel = $('#panel');
    kit.dock = $('#dock');

    kit.viewport.addEventListener('keydown', function (e) {
      if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      var s = global.__sim; if (!s || !s.camera || !s.controls) return;
      var k = e.key, st = 0.14, c = s.camera, t = s.controls.target, o = c.position.clone().sub(t), r = o.length(), th = Math.atan2(o.x, o.z), ph = Math.acos(Math.max(-1, Math.min(1, o.y / r)));
      if (k === 'ArrowLeft') th -= st; else if (k === 'ArrowRight') th += st; else if (k === 'ArrowUp') ph = Math.max(0.1, ph - st); else if (k === 'ArrowDown') ph = Math.min(Math.PI - 0.1, ph + st); else if (k === '+' || k === '=') r *= 0.9; else if (k === '-' || k === '_') r /= 0.9; else return;
      e.preventDefault(); e.stopPropagation(); if (s.P) s.P.camGoal = null;
      c.position.set(t.x + r * Math.sin(ph) * Math.sin(th), t.y + r * Math.cos(ph), t.z + r * Math.sin(ph) * Math.cos(th)); c.lookAt(t); s.controls.update();
    });
    kit.announce = function (msg) { var r = $('#srLive'); if (!r) return; r.textContent = ''; setTimeout(function () { r.textContent = msg; }, 60); };
    /* ---------- Tema ---------- */
    kit.updateOnAccent = function () {
      var a = (getComputedStyle(root).getPropertyValue('--accent') || '').trim(), m = /^#?([0-9a-f]{6})$/i.exec(a); if (!m) return;
      var n = parseInt(m[1], 16), rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
      function lum(c) { var q = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2]; }
      function cr(l1, l2) { return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
      var dark = [7, 16, 28], dl = lum(dark), white = cr(lum(rgb), 1), blk = cr(lum(rgb), dl), useWhite = white >= blk, bg = rgb.slice(), k = 0;
      while (k++ < 40 && cr(lum(bg), useWhite ? 1 : dl) < 4.6) bg = bg.map(function (v) { return Math.round(useWhite ? v * 0.93 : v + (255 - v) * 0.07); });
      root.style.setProperty('--on-accent', useWhite ? '#ffffff' : '#07101c');
      root.style.setProperty('--accent-solid', 'rgb(' + bg.join(',') + ')');
    };
    function applyTheme() {
      root.setAttribute('data-theme', S.theme);
      var b = $('#kTheme');
      if (b) b.innerHTML = icon(S.theme === 'dark' ? 'sun' : 'moon');
      prefs.theme = S.theme; store.set(key, prefs);
      kit.updateOnAccent();
      if (cfg.onTheme) cfg.onTheme(S.theme, kit);
      kit.redrawCanvases();
    }
    kit.colors = function () {
      var cs = getComputedStyle(root);
      function g(n) { return cs.getPropertyValue(n).trim(); }
      return { ink: g('--ink'), muted: g('--muted'), line: g('--line'), accent: g('--accent'), warn: g('--warn'), ok: g('--ok'), bad: g('--bad'),
        bg0: g('--bg0'), bg1: g('--bg1'), card: g('--card'), a: g('--k-a'), b: g('--k-b'), c: g('--k-c'), d: g('--k-d'), dark: S.theme === 'dark' };
    };

    /* ---------- Utilidades de interfaz ---------- */
    var canvases = [];
    kit.redrawCanvases = function () { canvases.forEach(function (c) { c.resize(); }); };
    kit.ui = {
      card: function (kicker, content, cls) {
        var d = h('div', { class: 'card' + (cls ? ' ' + cls : '') });
        if (kicker) d.appendChild(h('div', { class: 'card-kicker' }, kicker));
        if (content != null) { if (typeof content === 'string') d.insertAdjacentHTML('beforeend', content); else d.appendChild(content); }
        return d;
      },
      seg: function (options, value, onChange) {
        var wrap = h('div', { class: 'seg', role: 'group' });
        options.forEach(function (o) {
          var b = h('button', { 'aria-pressed': o.v === value ? 'true' : 'false', text: o.label });
          b.addEventListener('click', function () {
            wrap.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
            b.setAttribute('aria-pressed', 'true'); onChange(o.v);
          });
          wrap.appendChild(b);
        });
        wrap.set = function (v) { var i = options.findIndex(function (o) { return o.v === v; }); wrap.querySelectorAll('button').forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); };
        return wrap;
      },
      options: function (o) {
        var f = h('div', { class: 'fld' }); if (o.label) f.appendChild(h('span', { class: 'lbl' }, o.label));
        var grid = h('div', { class: 'opts' + (o.cols === 2 ? ' two' : '') }); f.appendChild(grid);
        if (o.cols > 2) { grid.style.gridTemplateColumns = 'repeat(' + o.cols + ', minmax(0, 1fr))'; grid.classList.add('dense'); }
        var cur = o.value;
        function paint() { grid.querySelectorAll('.opt').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === String(cur) ? 'true' : 'false'); }); }
        o.options.forEach(function (op) {
          var b = h('button', { class: 'opt', 'data-v': op.v, 'aria-pressed': 'false' }, op.label + (op.sub ? '<small>' + op.sub + '</small>' : ''));
          b.addEventListener('click', function () { cur = op.v; paint(); o.onChange(op.v); });
          grid.appendChild(b);
        });
        paint();
        f.set = function (v) { cur = v; paint(); };
        f.get = function () { return cur; };
        return f;
      },
      slider: function (o) {
        var lab = h('label', { class: 'sl' }, '<span>' + o.label + '</span><input type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '" value="' + o.value + '"><output></output>');
        var inp = lab.querySelector('input'), out = lab.querySelector('output');
        function show() { out.textContent = o.format ? o.format(+inp.value) : fmt(+inp.value, o.digits == null ? 1 : o.digits); }
        inp.addEventListener('input', function () { show(); o.onInput(+inp.value); });
        show();
        lab.set = function (v) { inp.value = v; show(); };
        lab.get = function () { return +inp.value; };
        return lab;
      },
      sliders: function (list) { var d = h('div', { class: 'sliders' }); list.forEach(function (s) { d.appendChild(s); }); return d; },
      bars: function (host) {
        return function update(rows) {
          host.innerHTML = rows.map(function (r) {
            return '<div class="bar-row' + (r.top ? ' top' : '') + '" style="--mc:' + (r.color || 'var(--accent)') + '"><b>' + r.label + '</b><div class="bar-track"><i style="width:' + Math.round(clamp(r.value, 0, 1) * 100) + '%"></i></div><span class="pc">' + (r.text != null ? r.text : Math.round(r.value * 100) + ' %') + '</span></div>';
          }).join('');
        };
      },
      table: function (head, rows, cls) {
        return '<div class="table-wrap" tabindex="0"><table class="' + (cls || 'cmp') + '">' + (head ? '<thead><tr>' + head.map(function (x) { return '<th>' + (x === '' ? '&mdash;' : x) + '</th>'; }).join('') + '</tr></thead>' : '') +
          '<tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (x, i) { return i === 0 ? '<th>' + x + '</th>' : '<td>' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      },
      canvas: function (host, o) {
        var wrap = h('div', { class: 'canvas-host' });
        var cv = h('canvas'); if (o.label) cv.setAttribute('aria-label', o.label); cv.setAttribute('role', 'img');
        wrap.appendChild(cv); host.appendChild(wrap);
        var ctx = cv.getContext('2d'); var H = o.height || 220, W = 300, dpr = 1;
        var api = {
          canvas: cv,
          resize: function () {
            var r = wrap.getBoundingClientRect(); if (r.width < 4) return;
            dpr = Math.min(global.devicePixelRatio || 1, 2); W = r.width;
            cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
            api.redraw();
          },
          redraw: function () { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); o.draw(ctx, W, H, kit.colors(), api); },
          size: function () { return { w: W, h: H }; }
        };
        if (o.pointer) {
          var down = false;
          function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
          cv.addEventListener('pointerdown', function (e) { down = true; cv.setPointerCapture(e.pointerId); var p = pos(e); o.pointer(p[0], p[1], 'down', e); });
          cv.addEventListener('pointermove', function (e) { var p = pos(e); o.pointer(p[0], p[1], down ? 'drag' : 'move', e); });
          cv.addEventListener('pointerup', function (e) { down = false; var p = pos(e); o.pointer(p[0], p[1], 'up', e); });
        }
        canvases.push(api);
        if (global.ResizeObserver) new ResizeObserver(function () { api.resize(); }).observe(wrap);
        setTimeout(api.resize, 0);
        return api;
      },
      quiz: function (host, o) {
        // o: {title, intro, items:[{q, options:[], answer:index, why}], onDone}
        // Dos modos: práctica (retroalimentación inmediata) y evaluación (sin pistas hasta el final, con nota y resultado copiable)
        var items = o.items.slice(), order = items.map(function (_, i) { return i; });
        var body = h('div', { class: 'challenge' }); host.appendChild(body);
        var idx = 0, score = 0, answered = false, exam = false, rec = [], t0 = 0, who = '';
        function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
        function start(ex) { exam = !!ex; shuffle(order); idx = 0; score = 0; rec = []; t0 = Date.now(); render(); }
        function grade(p) { return p >= 0.6 ? 4 + 3 * (p - 0.6) / 0.4 : 1 + 3 * p / 0.6; }
        function intro() {
          body.innerHTML = '<p>' + (o.intro || 'Pon a prueba lo aprendido con preguntas rápidas.') + '</p><div class="btnrow"><button class="btn" id="qzStart">Práctica (' + items.length + ' preguntas)</button> <button class="btn" id="qzExam">Modo evaluación</button></div><p class="hint">En el modo evaluación no se muestran las respuestas hasta el final y se calcula una nota (escala 1,0–7,0 con 60 % de exigencia).</p>';
          body.querySelector('#qzStart').addEventListener('click', function () { start(false); });
          body.querySelector('#qzExam').addEventListener('click', function () { start(true); });
        }
        function summary() {
          var p = score / order.length, g = grade(p), mins = Math.max(1, Math.round((Date.now() - t0) / 60000)), nota = fmt(g, 1);
          var rows = rec.map(function (r, k) { return '<li class="' + (r.ok ? 'ok' : 'no') + '"><b>' + (r.ok ? '✔' : '✘') + '</b> ' + r.q + '<br><small>Tu respuesta: ' + r.pick + (r.ok ? '' : ' · Correcta: ' + r.right) + (r.why ? ' · ' + r.why : '') + '</small></li>'; }).join('');
          body.innerHTML = '<div class="verdict ' + (p >= 0.6 ? 'ok' : 'no') + '">Resultado: <b>' + score + ' / ' + order.length + '</b> · Nota: <b>' + nota + '</b></div><ol class="qz-review">' + rows + '</ol><label class="qz-name">Nombre (opcional) <input type="text" id="qzName" value="' + who.replace(/"/g, '') + '"></label><div class="btnrow"><button class="btn" id="qzCopy">Copiar resultado</button> <button class="btn" id="qzAgain">Intentar de nuevo</button></div><div id="qzMsg" role="status" aria-live="polite"></div>';
          body.querySelector('#qzAgain').addEventListener('click', function () { start(true); });
          body.querySelector('#qzCopy').addEventListener('click', function () {
            who = body.querySelector('#qzName').value; var txt = (who ? who + ' · ' : '') + document.title + ' · ' + new Date().toLocaleDateString() + ' · ' + score + '/' + order.length + ' · Nota ' + nota + ' · ' + mins + ' min';
            var msg = body.querySelector('#qzMsg');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { msg.textContent = 'Resultado copiado.'; }, function () { msg.textContent = txt; }); else msg.textContent = txt;
          });
        }
        function render() {
          if (idx >= order.length) {
            if (exam) summary();
            else { body.innerHTML = '<div class="verdict ' + (score >= order.length * 0.7 ? 'ok' : 'no') + '">Resultado: <b>' + score + ' / ' + order.length + '</b></div><button class="btn" id="qzAgain">Intentar de nuevo</button>'; body.querySelector('#qzAgain').addEventListener('click', function () { start(false); }); }
            if (o.onDone) o.onDone(score, order.length);
            return;
          }
          var it = items[order[idx]]; answered = false;
          var opts = it.options.map(function (t, i) { return { t: t, i: i }; }); shuffle(opts);
          body.innerHTML = '<div class="score">Pregunta ' + (idx + 1) + ' de ' + order.length + (exam ? ' · modo evaluación' : ' · aciertos: ' + score) + '</div><div class="q">' + it.q + '</div><div class="opts" id="qzOpts"></div><div id="qzOut"></div>';
          var og = body.querySelector('#qzOpts');
          opts.forEach(function (op) {
            var b = h('button', { class: 'opt' }, op.t);
            b.addEventListener('click', function () {
              if (answered) return; answered = true;
              var ok = op.i === it.answer; if (ok) score++;
              if (exam) {
                rec.push({ q: it.q, ok: ok, pick: op.t, right: it.options[it.answer], why: it.why || '' });
                og.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); b.classList.add('picked');
                body.querySelector('#qzOut').innerHTML = '<button class="btn primary" id="qzNext">' + (idx + 1 < order.length ? 'Siguiente' : 'Ver resultado') + '</button>';
                body.querySelector('#qzNext').addEventListener('click', function () { idx++; render(); });
                return;
              }
              og.querySelectorAll('button').forEach(function (x, k) { x.disabled = true; if (opts[k].i === it.answer) x.classList.add('right'); });
              if (!ok) b.classList.add('wrong');
              body.querySelector('#qzOut').innerHTML = '<div class="verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? '¡Correcto! ' : 'No exactamente. ') + (it.why || '') + '</div><button class="btn primary" id="qzNext">' + (idx + 1 < order.length ? 'Siguiente' : 'Ver resultado') + '</button>';
              body.querySelector('#qzNext').addEventListener('click', function () { idx++; render(); });
            });
            og.appendChild(b);
          });
        }
        intro();
      }
    };

    /* ---------- Pestañas del panel ---------- */
    var tabs = [];
    var ptabs = $('#ptabs'), pbody = $('#pbody');
    var mainTab = { id: 'main', label: cfg.mainTabLabel || 'Guía', build: buildMain };
    var tabDefs = [mainTab].concat(cfg.tabs || []);
    tabDefs.forEach(function (t, i) {
      var b = h('button', { role: 'tab', class: 'ptab' + (i === 0 ? ' is-on' : ''), 'data-tab': t.id, 'aria-selected': i === 0 ? 'true' : 'false', text: t.label });
      ptabs.appendChild(b);
      var pane = h('div', { class: 'tabpane' + (i === 0 ? ' is-on' : ''), id: 'tab-' + t.id, role: 'tabpanel' });
      if (i !== 0) pane.hidden = true;
      pbody.appendChild(pane);
      tabs.push({ def: t, btn: b, pane: pane });
      b.addEventListener('click', function () { selectTab(t.id); });
    });
    function selectTab(id) {
      tabs.forEach(function (t) {
        var on = t.def.id === id;
        t.btn.classList.toggle('is-on', on); t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
        t.pane.hidden = !on; t.pane.classList.toggle('is-on', on);
      });
      kit.redrawCanvases();
      if (cfg.onTab) cfg.onTab(id, kit);
    }
    kit.selectTab = selectTab;

    /* ---------- Pestaña principal ---------- */
    var refs = {};
    function buildMain(el) {
      if (stages.length) {
        el.insertAdjacentHTML('beforeend',
          '<div class="card phase-card"><div class="card-kicker" id="pcKicker">Etapa</div><h2 id="pcTitle"></h2><div id="pcText"></div></div>' +
          '<div class="stepper" id="stepper" aria-label="Etapas"></div>');
      }
      if (cfg.mainTop) cfg.mainTop(el, kit);
      if (cfg.measures) {
        el.insertAdjacentHTML('beforeend', '<div class="card"><div class="card-kicker">' + (cfg.measuresTitle || 'Medidas en vivo') + '</div><table class="meas" id="measTable"><tbody></tbody></table><div class="extras" id="extras"></div></div>');
      }
      if (cfg.mainExtra) cfg.mainExtra(el, kit);
      if (cfg.ideas && cfg.ideas.length) {
        el.insertAdjacentHTML('beforeend', '<div class="card"><div class="card-kicker">Ideas clave</div><ul class="ideas">' + cfg.ideas.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>');
      }
    }
    tabs.forEach(function (t) { t.def.build(t.pane, kit); });

    refs.phStep = $('#phStep'); refs.phName = $('#phName'); refs.phTs = $('#phTs'); refs.badge = $('#phaseBadge');
    refs.pcKicker = $('#pcKicker'); refs.pcTitle = $('#pcTitle'); refs.pcText = $('#pcText');
    refs.slider = $('#slider'); refs.pct = $('#pct'); refs.play = $('#bPlay');
    refs.measBody = $('#measTable') && $('#measTable tbody');
    refs.extras = $('#extras');

    /* ---------- Etapas ---------- */
    function stageAt(t) {
      for (var i = stages.length - 1; i >= 0; i--) if (t >= starts[i] - 1e-9) return i;
      return 0;
    }
    function buildStepper() {
      var st = $('#stepper'); if (!st) return;
      st.innerHTML = '';
      stages.forEach(function (s, i) {
        var b = h('button', { class: 'step', 'data-i': i }, '<i>' + (i + 1) + '</i><span>' + (s.short || s.name) + '</span>');
        b.addEventListener('click', function () { seekStage(i, true); });
        st.appendChild(b);
      });
    }
    function buildTimeline() {
      var segs = $('#segs'), ticks = $('#ticks'); if (!segs) return;
      var pal = ['--k-a', '--k-b', '--k-c', '--k-d'];
      segs.innerHTML = '';
      stages.forEach(function (s, i) {
        var d = h('div', { class: 'seg-i' });
        d.style.width = ((starts[i + 1] - starts[i]) * 100) + '%';
        d.style.background = 'var(' + pal[i % 4] + ')';
        segs.appendChild(d);
      });
      segs.appendChild(h('div', { class: 'fill', id: 'fill' }));
      ticks.innerHTML = '';
      stages.forEach(function (s, i) {
        if (s.ts) { var tk = h('div', { class: 'tick' }); tk.style.left = (((starts[i] + starts[i + 1]) / 2) * 100) + '%'; ticks.appendChild(tk); }
      });
      refs.fill = $('#fill');
    }

    function updatePlayIcon() {
      if (!refs.play) return;
      refs.play.innerHTML = icon(S.playing ? 'pause' : 'play');
      refs.play.setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
    }
    function reduced() { return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    function play() {
      if (!stages.length) return;
      if (cfg.onGuide) cfg.onGuide(kit);
      if (S.t >= 0.9999) S.t = 0;
      S.playing = true; if (kit.dock) kit.dock.classList.remove('pulse-next'); updatePlayIcon();
    }
    function pause() { S.playing = false; updatePlayIcon(); }
    function toggle() { S.playing ? pause() : play(); }
    function seek(t, keepPlaying) {
      if (cfg.onGuide) cfg.onGuide(kit);
      S.t = clamp(t, 0, 1);
      if (!keepPlaying) pause();
      sync(true);
    }
    function seekStage(i, andPlay) {
      if (cfg.onGuide) cfg.onGuide(kit);
      i = clamp(i, 0, stages.length - 1);
      S.t = starts[i] + 1e-4;
      sync(true);
      if (andPlay === false) pause();
      if (kit.dock) kit.dock.classList.remove('pulse-next');
    }
    function stepStage(dir) {
      var i = S.stage;
      var local = (S.t - starts[i]) / (starts[i + 1] - starts[i]);
      var target = dir > 0 ? i + 1 : (local > 0.12 ? i : i - 1);
      if (target >= stages.length) { seek(1); return; }
      pause(); seekStage(target, false);
    }
    kit.play = play; kit.pause = pause; kit.toggle = toggle; kit.seek = seek; kit.seekStage = seekStage; kit.stepStage = stepStage;

    var lastStage = -1, lastMeas = 0;
    function stageChanged(i) {
      var s = stages[i];
      if (refs.phStep) refs.phStep.textContent = 'Etapa ' + (i + 1) + ' / ' + stages.length;
      if (refs.phName) refs.phName.textContent = s.name;
      if (kit.announce && S._lastAnn !== i) { S._lastAnn = i; kit.announce('Etapa ' + (i + 1) + ' de ' + stages.length + ': ' + s.name); }
      if (refs.phTs) refs.phTs.hidden = !s.ts;
      if (refs.badge) refs.badge.classList.toggle('is-ts', !!s.ts);
      if (refs.pcKicker) refs.pcKicker.textContent = 'Etapa ' + (i + 1) + ' de ' + stages.length;
      if (refs.pcTitle) refs.pcTitle.innerHTML = s.title || s.name;
      if (refs.pcText) refs.pcText.innerHTML = s.text || '';
      var steps = document.querySelectorAll('.step');
      steps.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.classList.toggle('done', k < i); });
      var pc = $('.phase-card'); if (pc) { pc.classList.remove('flash'); void pc.offsetWidth; pc.classList.add('flash'); }
      if (cfg.onStage) cfg.onStage(i, s, kit);
    }
    function frameObj(dt) {
      var i = S.stage;
      var span = starts[i + 1] - starts[i] || 1;
      return { t: S.t, i: i, stage: stages[i], local: clamp((S.t - starts[i]) / span, 0, 1), playing: S.playing, dt: dt || 0, now: performance.now() / 1000 };
    }
    function sync(force) {
      if (!stages.length) return;
      S.stage = stageAt(S.t);
      if (S.stage !== lastStage || force === 'stage') { lastStage = S.stage; stageChanged(S.stage); }
      if (refs.slider) refs.slider.value = S.t;
      if (refs.pct) refs.pct.textContent = Math.round(S.t * 100) + ' %';
      if (refs.fill) refs.fill.style.width = (S.t * 100) + '%';
      if (force) refreshMeasures(true);
    }

    var lastNow = null;
    function tick(now) {
      requestAnimationFrame(tick);
      var dt = lastNow == null ? 0 : Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      if (stages.length && S.playing) {
        var sp = S.speed * (reduced() ? 0.6 : 1);
        var nt = S.t + dt * sp / total;
        var cur = S.stage, bound = starts[cur + 1];
        if (nt >= bound && cur < stages.length - 1 && S.guided) {
          S.t = bound - 1e-4; pause(); if (kit.dock) kit.dock.classList.add('pulse-next');
        } else if (nt >= 1) {
          if (S.loop && !S.guided) { S.t = 0; } else { S.t = 1; pause(); }
        } else S.t = nt;
        sync(false);
      }
      if (cfg.onFrame) cfg.onFrame(frameObj(dt), kit);
      if (now - lastMeas > 120) { lastMeas = now; refreshMeasures(false); }
    }

    function refreshMeasures(force) {
      if (!cfg.measures) return;
      var rows = cfg.measures(frameObj(0), kit) || [];
      if (!refs.measBody) return;
      var sig = JSON.stringify(rows);
      if (!force && sig === refs._sig) return;
      refs._sig = sig;
      refs.measBody.innerHTML = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
      if (cfg.extras && refs.extras) refs.extras.innerHTML = cfg.extras(frameObj(0), kit) || '';
    }
    kit.refresh = function () { refreshMeasures(true); };

    /* ---------- Capas y vistas ---------- */
    if (cfg.layers && cfg.layers.length) {
      var lb = $('#layersBody'); $('#layersBox').hidden = false;
      var savedL = prefs.layers || {};
      cfg.layers.forEach(function (l, i) {
        S.layers[l.id] = savedL[l.id] != null ? !!savedL[l.id] : l.on !== false;
        var b = h('button', { class: 'layer', 'data-layer': l.id, 'aria-pressed': S.layers[l.id] ? 'true' : 'false', title: l.title || l.label }, '<i>' + (l.icon || (i + 1)) + '</i>' + l.label);
        b.addEventListener('click', function () { toggleLayer(l.id); });
        lb.appendChild(b);
      });
      function setLayersOpen(open) {
        $('#layersHead').setAttribute('aria-expanded', open ? 'true' : 'false');
        lb.hidden = !open; $('#viewsBox').hidden = !open || !(cfg.views && cfg.views.length);
      }
      $('#layersHead').addEventListener('click', function () { setLayersOpen($('#layersHead').getAttribute('aria-expanded') !== 'true'); });
      kit.setLayersOpen = setLayersOpen;
    }
    function toggleLayer(id, val) {
      var on = val == null ? !S.layers[id] : !!val;
      S.layers[id] = on;
      var b = $('.layer[data-layer="' + id + '"]'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
      prefs.layers = S.layers; store.set(key, prefs);
      if (cfg.onLayer) cfg.onLayer(id, on, kit);
    }
    kit.toggleLayer = toggleLayer;
    kit.layer = function (id) { return !!S.layers[id]; };
    if (cfg.views && cfg.views.length) {
      $('#layersBox').hidden = false; $('#viewsBox').hidden = false;
      var vs = $('#viewSeg');
      cfg.views.forEach(function (v) {
        var b = h('button', { 'data-view': v.id, 'aria-pressed': 'false', text: v.label });
        b.addEventListener('click', function () { selectView(v.id); });
        vs.appendChild(b);
      });
    }
    function selectView(id) {
      S.view = id;
      document.querySelectorAll('#viewSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === id ? 'true' : 'false'); });
      if (cfg.onView) cfg.onView(id, kit);
    }
    function cycleView() {
      if (!cfg.views) return;
      var idx = cfg.views.findIndex(function (v) { return v.id === S.view; });
      selectView(cfg.views[(idx + 1) % cfg.views.length].id);
    }
    kit.selectView = selectView;

    /* ---------- Modos (pestañas superiores) ---------- */
    kit.setMode = function (id, silent) {
      S.mode = id;
      document.querySelectorAll('.mode-tab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === id ? 'true' : 'false'); });
      var m = (cfg.modes || []).filter(function (x) { return x.id === id; })[0];
      if (m && m.color) root.style.setProperty('--eqc', m.color);
      if (!silent && cfg.onMode) cfg.onMode(id, kit);
    };
    document.querySelectorAll('.mode-tab').forEach(function (b) { b.addEventListener('click', function () { kit.setMode(b.dataset.mode); }); });

    /* ---------- HUD ---------- */
    kit.setEq = function (o) {
      var box = $('#eqBox'); box.hidden = false;
      if (o.chip != null) $('#eqChip').textContent = o.chip;
      if (o.name != null) $('#eqName').textContent = o.name;
      if (o.body != null) $('#eqBody').innerHTML = o.body;
    };
    kit.setLegend = function (rows) {
      var lg = $('#legend'), lb = $('#legendBody');
      if (!rows || !rows.length) { lg.hidden = true; lb.innerHTML = ''; return; }
      lg.hidden = false;
      lb.innerHTML = rows.map(function (r) {
        var mark = r.arrow ? '<span class="lg-arrow" style="color:' + r.color + ';border-color:' + r.color + '"></span>' : '<span class="lg-dot" style="background:' + r.color + '"></span>';
        return '<div class="lg-row">' + mark + '<span><b>' + r.label + '</b>' + (r.text ? ' ' + r.text : '') + '</span></div>';
      }).join('');
    };
    /* ---------- Cajas colapsables ---------- */
    var narrowMQ = global.matchMedia ? global.matchMedia('(max-width: 980px)') : null;
    function isNarrow() { return !!(narrowMQ && narrowMQ.matches); }
    function setEqOpen(open) {
      $('#eqBox').classList.toggle('collapsed', !open);
      $('#eqToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function setLegendOpen(open) {
      $('#legendHead').setAttribute('aria-expanded', open ? 'true' : 'false');
      $('#legendBody').hidden = !open;
    }
    $('#eqBox .eq-head').addEventListener('click', function () { setEqOpen($('#eqBox').classList.contains('collapsed')); });
    $('#legendHead').addEventListener('click', function () { setLegendOpen($('#legendHead').getAttribute('aria-expanded') !== 'true'); });
    kit.setEqOpen = setEqOpen; kit.setLegendOpen = setLegendOpen;
    // En pantallas estrechas la leyenda se apila con las demás cajas y todas parten contraídas
    function placeHud() {
      var n = isNarrow(), lg = $('#legend');
      if (n && lg.parentNode !== $('#hudCol')) $('#hudCol').appendChild(lg);
      else if (!n && lg.parentNode === $('#hudCol')) $('#main').insertBefore(lg, kit.panel);
      setEqOpen(!n); setLegendOpen(!n);
      if (kit.setLayersOpen) kit.setLayersOpen(!n);
      syncPanel();
    }

    /* ---------- Panel, barra y vista despejada ---------- */
    var panelOff = !!prefs.panelOff;
    S.clean = false;
    function syncPanel() {
      app.classList.toggle('k-panel-off', panelOff);
      var vis = !S.clean && (isNarrow() ? kit.panel.classList.contains('open') : !panelOff);
      $('#kPanelBtn').setAttribute('aria-expanded', vis ? 'true' : 'false');
    }
    function setPanel(open) {
      if (S.clean) setClean(false);
      if (isNarrow()) kit.panel.classList.toggle('open', open);
      else { panelOff = !open; prefs.panelOff = panelOff; store.set(key, prefs); }
      syncPanel();
      if (open) kit.redrawCanvases();
    }
    function panelShown() { return $('#kPanelBtn').getAttribute('aria-expanded') === 'true'; }
    function setDockMini(mini) {
      if (!kit.dock) return;
      kit.dock.classList.toggle('mini', mini);
      $('#bDockMin').setAttribute('aria-expanded', mini ? 'false' : 'true');
      prefs.dockMini = mini; store.set(key, prefs);
    }
    function setClean(on) {
      S.clean = on;
      app.classList.toggle('k-clean', on);
      if (on && isNarrow()) kit.panel.classList.remove('open');
      var b = $('#kClean');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Mostrar los paneles' : 'Ocultar los paneles');
      b.title = on ? 'Mostrar los paneles (O o Esc)' : 'Ocultar los paneles para ver toda la simulación (O)';
      b.innerHTML = icon(on ? 'eye' : 'eyeOff');
      syncPanel();
      kit.announce(on ? 'Vista despejada: paneles ocultos' : 'Paneles visibles');
    }
    kit.setPanel = setPanel; kit.setClean = setClean; kit.setDockMini = setDockMini;
    kit.toast = function (msg) {
      var t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    };

    /* ---------- Captura, pantalla completa, ayuda ---------- */
    kit.snapshot = function () {
      if (cfg.render) { try { cfg.render(kit); } catch (e) { /* nada */ } }
      var cvs = Array.prototype.slice.call(kit.viewport.querySelectorAll('canvas'));
      var big = cvs.filter(function (c) { return c.width > 0; });
      if (!big.length) { kit.toast('No hay nada que capturar'); return; }
      var base = big[0];
      var out = document.createElement('canvas'); out.width = base.width; out.height = base.height;
      var ctx = out.getContext('2d');
      var c = kit.colors();
      ctx.fillStyle = c.bg0 || '#000'; ctx.fillRect(0, 0, out.width, out.height);
      big.forEach(function (cv) { try { ctx.drawImage(cv, 0, 0, out.width, out.height); } catch (e) { /* canvas contaminado */ } });
      ctx.font = Math.round(out.width / 70 + 8) + 'px system-ui, sans-serif';
      ctx.fillStyle = c.muted || '#999'; ctx.textAlign = 'left';
      ctx.fillText(cfg.title + ' · Laboratorio MACEDONIA · UMCE', 14, out.height - 14);
      var a = document.createElement('a');
      a.download = (cfg.key || 'simulacion') + '.png';
      try { a.href = out.toDataURL('image/png'); a.click(); kit.toast('Imagen guardada'); } catch (e) { kit.toast('No se pudo capturar la imagen'); }
    };
    function fullscreen() {
      var d = document;
      if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); }
      else d.exitFullscreen();
    }
    /* ---------- Ayuda: guía de las partes, generada desde la configuración y la interfaz real ---------- */
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
    function uniq(a, max) { var o = [], seen = {}; a.forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; o.push(x); } }); return o.slice(0, max || 99); }
    function quoted(a) { return a.map(function (x) { return '«' + esc(x) + '»'; }).join(', '); }
    function texts(el, sel, max) { return uniq([].map.call(el.querySelectorAll(sel), txt), max); }
    function guideHref() {
      if (cfg.guide === false) return null;
      if (cfg.guide) return cfg.guide;
      var p = location.pathname.split('/').filter(Boolean);
      if (p.length && /\.html?$/i.test(p[p.length - 1])) p.pop();
      return p.length >= 2 ? '../../guias/' + p[p.length - 2] + '/' + p[p.length - 1] + '.html' : null;
    }
    function tabHelp(t) {
      if (t.def.help) return t.def.help;
      var id = t.def.id, pane = t.pane, kick = texts(pane, '.card-kicker', 8), ctrls = texts(pane, '.sl > span, .fld > .lbl', 10);
      if (id === 'main') {
        var parts = [];
        if (stages.length) parts.push('el texto de la <b>etapa actual</b> de la lección y botones numerados para saltar a cualquier etapa');
        if (cfg.measures) parts.push('las <b>' + esc((cfg.measuresTitle || 'medidas en vivo').toLowerCase()) + '</b>, que cambian mientras la simulación avanza');
        if (cfg.ideas && cfg.ideas.length) parts.push('las <b>ideas clave</b> del tema');
        return parts.length ? 'Muestra ' + parts.join('; ') + '.' : 'Información principal del simulador.';
      }
      if (id === 'lab') return 'Controles para experimentar por tu cuenta' + (ctrls.length ? ': ' + quoted(ctrls) : (kick.length ? ' (' + quoted(kick) + ')' : '')) + '.' +
        (cfg.onGuide && stages.length ? ' Al usarlos, la simulación pasa a <b>modo libre</b> y la lección deja de controlarla; pulsa ▶ o elige una etapa para que la lección retome el control.' : '');
      if (id === 'graf') return 'Gráficos que se actualizan en tiempo real con lo que ocurre en el visor' + (kick.length ? ': ' + quoted(kick) : '') + '. Cambia algo en «Lab» y mira cómo responden.';
      if (id === 'calc') return 'Cálculo paso a paso con los valores actuales de la simulación; se rehace solo cuando cambias un control.';
      if (id === 'quiz') return 'Preguntas de repaso con dos modos. <b>Práctica</b>: ves al instante si acertaste y por qué. <b>Evaluación</b>: las respuestas se revelan al final, con nota (escala 1,0–7,0, 60 % de exigencia) y un resultado que se puede copiar para entregarlo.';
      return 'Contenido complementario' + (kick.length ? ': ' + quoted(kick) : (ctrls.length ? ' con los controles ' + quoted(ctrls) : '')) + '.';
    }
    function helpMap() {
      var hasHud = !$('#eqBox').hidden || !$('#layersBox').hidden || !$('#legend').hidden;
      function n(x, y, k) { return '<circle cx="' + x + '" cy="' + y + '" r="9" class="hm-n"/><text x="' + x + '" y="' + (y + 3.5) + '" class="hm-t">' + k + '</text>'; }
      return '<svg class="help-map" viewBox="0 0 320 180" role="img" aria-label="Esquema de la pantalla con sus partes numeradas">' +
        '<rect x="1" y="1" width="318" height="178" rx="10" class="hm-v"/>' +
        '<rect x="1" y="1" width="318" height="24" rx="10" class="hm-b"/>' + n(20, 13, 1) +
        n(110, 92, 2) +
        (hasHud ? '<rect x="10" y="34" width="70" height="44" rx="6" class="hm-b"/>' + n(45, 56, 3) : '') +
        '<rect x="222" y="32" width="90" height="140" rx="8" class="hm-b"/>' + n(267, 102, 4) +
        (stages.length ? '<rect x="10" y="146" width="204" height="26" rx="8" class="hm-b"/>' + n(112, 159, 5) : '') +
        '</svg>';
    }
    function buildHelp() {
      var help = cfg.help || {}, html = [], sec = [];
      var labTab = tabs.filter(function (t) { return t.def.id === 'lab'; })[0], quizTab = tabs.filter(function (t) { return t.def.id === 'quiz'; })[0], grafTab = tabs.filter(function (t) { return t.def.id === 'graf'; })[0];
      html.push('<h2 id="helpTitle">Ayuda · ' + esc(cfg.title) + '</h2>');
      if (help.intro) html.push('<p class="help-lead">' + help.intro + '</p>');

      // Primeros pasos
      var steps = [];
      if (stages.length) steps.push('Pulsa <b>▶</b> en la barra inferior para seguir la <b>lección guiada</b> (' + stages.length + ' etapas). Lee la explicación de cada etapa en la pestaña «' + esc(tabs[0].def.label) + '». Activa «Por etapas» si quieres que se detenga al final de cada una.');
      if (labTab) steps.push('Abre la pestaña «' + esc(labTab.def.label) + '» y cambia los controles para <b>explorar libremente</b>.');
      if (grafTab) steps.push('Revisa «' + esc(grafTab.def.label) + '» para ver los resultados en gráficos.');
      if (quizTab) steps.push('Cuando termines, pon a prueba lo aprendido en «' + esc(quizTab.def.label) + '».');
      if (steps.length) html.push('<h3>Primeros pasos</h3><ol class="help-steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>');

      // Partes de la pantalla
      var modes = (cfg.modes || []).map(function (m) { return m.label; });
      sec.push('<li><b>Barra superior.</b> Nombre del simulador' + (modes.length ? ' y los <b>modos</b> ' + quoted(modes) + ', que cambian lo que se estudia' : '') +
        '. A la derecha: volver a la colección, capturar imagen, pantalla completa, tema claro/oscuro, esta ayuda y mostrar u ocultar el panel.</li>');
      var s3d = global.__sim && global.__sim.controls;
      sec.push('<li><b>Visor.</b> ' + (s3d ? 'Escena 3D: <b>arrastra</b> para girarla, usa la <b>rueda</b> o pellizca para acercar, y arrastra con el <b>botón derecho</b> (o dos dedos) para desplazarla. ' : 'Muestra la simulación. ') +
        (stages.length ? 'Arriba se indica la etapa en curso. ' : '') + 'El botón del ojo oculta todos los paneles para ver la escena completa (tecla O).</li>');
      var hud = [];
      if (!$('#eqBox').hidden) hud.push('<b>datos en vivo</b> (' + (txt($('#eqName')) ? '«' + esc(txt($('#eqName'))) + '»' : 'ecuación y valores actuales') + ')');
      if (cfg.layers && cfg.layers.length) hud.push('<b>capas</b> que muestran u ocultan elementos: ' + cfg.layers.map(function (l, i) { return (i < 9 ? '<kbd>' + (i + 1) + '</kbd> ' : '') + esc(l.label) + (l.title && l.title !== l.label ? ' <span class="muted">(' + esc(l.title) + ')</span>' : ''); }).join(', '));
      if (cfg.views && cfg.views.length > 1) hud.push('<b>vistas</b> de cámara predefinidas: ' + quoted(cfg.views.map(function (v) { return v.label; })) + ' (tecla V)');
      if (!$('#legend').hidden) hud.push('la <b>leyenda</b> de colores y símbolos');
      if (hud.length) sec.push('<li><b>Cajas flotantes.</b> Sobre el visor aparecen ' + hud.join('; ') + '. Pulsa el título de cada caja para contraerla o expandirla.</li>');
      sec.push('<li><b>Panel lateral.</b> Organizado en pestañas:<ul class="help-tabs">' + tabs.map(function (t) { return '<li><b>' + esc(t.def.label) + '</b>: ' + tabHelp(t) + '</li>'; }).join('') + '</ul></li>');
      if (stages.length) sec.push('<li><b>Reproductor.</b> Reiniciar, etapa anterior, reproducir/pausar y etapa siguiente; la línea de tiempo (cada color es una etapa) se puede arrastrar. También eliges la velocidad, «Por etapas» (pausa al final de cada etapa) y el bucle; la flecha minimiza la barra.' +
        '<ol class="help-stages">' + stages.map(function (s) { return '<li>' + esc(s.name || s.short || '') + '</li>'; }).join('') + '</ol></li>');
      html.push('<h3>Partes de la pantalla</h3><div class="help-parts">' + helpMap() + '<ol class="help-list">' + sec.join('') + '</ol></div>');

      // Específico del simulador
      if (help.items && help.items.length) html.push('<h3>En este simulador</h3><ul class="help-list">' + help.items.map(function (i) { return '<li><b>' + i[0] + '</b>: ' + i[1] + '</li>'; }).join('') + '</ul>');
      if (help.try && help.try.length) html.push('<h3>Prueba esto</h3><ol class="help-try">' + help.try.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>');

      html.push('<details class="help-keys"><summary>Atajos de teclado</summary><table class="keys">' + keyRows() + '</table></details>');
      var g = guideHref();
      html.push('<menu>' + (g ? '<a class="btn" href="' + esc(g) + '" target="_blank" rel="noopener">Guía docente ↗</a>' : '') + '<button class="btn primary" value="ok">Entendido</button></menu>');
      return '<form method="dialog" class="dlg">' + html.join('') + '</form>';
    }
    kit.help = function () {
      dlg.innerHTML = buildHelp();
      var hb = $('#kHelp'); if (hb) hb.classList.remove('k-attn');
      if (!prefs.helpSeen) { prefs.helpSeen = true; store.set(key, prefs); }
      if (dlg.showModal) { dlg.showModal(); dlg.scrollTop = 0; }
    };

    /* ---------- Eventos ---------- */
    $('#kSnap').addEventListener('click', kit.snapshot);
    $('#kFull').addEventListener('click', fullscreen);
    $('#kTheme').addEventListener('click', function () { S.theme = S.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
    $('#kHelp').addEventListener('click', kit.help);
    $('#kPanelBtn').addEventListener('click', function () { setPanel(!panelShown()); });
    $('#kPanelX').addEventListener('click', function () { setPanel(false); });
    $('#kClean').addEventListener('click', function () { setClean(!S.clean); });
    if (kit.dock) $('#bDockMin').addEventListener('click', function () { setDockMini(!kit.dock.classList.contains('mini')); });
    if (narrowMQ) {
      if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', placeHud); else if (narrowMQ.addListener) narrowMQ.addListener(placeHud);
    }
    if (stages.length) {
      $('#bPlay').addEventListener('click', toggle);
      $('#bReset').addEventListener('click', function () { pause(); seek(0); });
      $('#bPrev').addEventListener('click', function () { stepStage(-1); });
      $('#bNext').addEventListener('click', function () { stepStage(1); });
      $('#bLoop').addEventListener('click', function () { S.loop = !S.loop; $('#bLoop').setAttribute('aria-pressed', S.loop ? 'true' : 'false'); prefs.loop = S.loop; store.set(key, prefs); });
      $('#bLoop').setAttribute('aria-pressed', S.loop ? 'true' : 'false');
      $('#bGuided').addEventListener('click', function () { S.guided = !S.guided; $('#bGuided').setAttribute('aria-pressed', S.guided ? 'true' : 'false'); prefs.guided = S.guided; store.set(key, prefs); });
      $('#bGuided').setAttribute('aria-pressed', S.guided ? 'true' : 'false');
      $('#speed').value = String(S.speed);
      $('#speed').addEventListener('change', function (e) { S.speed = parseFloat(e.target.value); prefs.speed = S.speed; store.set(key, prefs); });
      refs.slider.addEventListener('input', function () { var was = S.playing; seek(parseFloat(refs.slider.value), was); });
    }
    window.addEventListener('keydown', function (e) {
      var tg = e.target; var tn = tg && tg.tagName;
      if (tn === 'INPUT' && tg.type !== 'range' && tg.type !== 'checkbox' || tn === 'TEXTAREA' || tn === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (dlg.open) return;
      var k = e.key;
      if (k === ' ' && stages.length) { e.preventDefault(); toggle(); }
      else if (k === 'ArrowRight' && stages.length) { e.preventDefault(); e.shiftKey ? stepStage(1) : seek(S.t + 0.02, S.playing); }
      else if (k === 'ArrowLeft' && stages.length) { e.preventDefault(); e.shiftKey ? stepStage(-1) : seek(S.t - 0.02, S.playing); }
      else if ((k === 'r' || k === 'R') && stages.length) { pause(); seek(0); }
      else if (k === 't' || k === 'T') $('#kTheme').click();
      else if (k === 's' || k === 'S') kit.snapshot();
      else if (k === 'f' || k === 'F') fullscreen();
      else if (k === 'v' || k === 'V') cycleView();
      else if (k === 'p' || k === 'P') setPanel(!panelShown());
      else if (k === 'o' || k === 'O') setClean(!S.clean);
      else if (k === 'Escape' && S.clean) setClean(false);
      else if (k === 'Escape' && isNarrow() && kit.panel.classList.contains('open')) setPanel(false);
      else if (k === '?' || k === 'h' || k === 'H') kit.help();
      else if (/^[1-9]$/.test(k) && cfg.layers && cfg.layers[+k - 1]) toggleLayer(cfg.layers[+k - 1].id);
      else if (cfg.onKey) cfg.onKey(e, kit);
    });
    window.addEventListener('resize', function () { kit.redrawCanvases(); if (cfg.onResize) cfg.onResize(kit); });
    if (global.ResizeObserver) new ResizeObserver(function () { if (cfg.onResize) cfg.onResize(kit); }).observe(kit.viewport);

    /* ---------- Arranque ---------- */
    buildStepper(); buildTimeline();
    placeHud(); setDockMini(!!prefs.dockMini);
    updatePlayIcon();
    applyTheme();
    if (cfg.modes && cfg.modes.length) kit.setMode(S.mode, true);
    if (cfg.views && cfg.views.length) selectView(cfg.views[0].id);
    if (cfg.layers) cfg.layers.forEach(function (l) { if (cfg.onLayer) cfg.onLayer(l.id, S.layers[l.id], kit); });
    if (cfg.init) cfg.init(kit);
    if (params.get('help') === '1') setTimeout(kit.help, 300);
    else if (!prefs.helpSeen && !document.body.classList.contains('embed')) setTimeout(function () {
      var hb = $('#kHelp'); if (!hb || prefs.helpSeen) return;
      hb.classList.add('k-attn'); kit.toast('¿Primera vez aquí? Pulsa ? para ver las partes del simulador y cómo usarlo');
    }, 1400);
    sync('stage');
    refreshMeasures(true);
    requestAnimationFrame(tick);
    return kit;
  }

  global.SimKit = { create: create, fmt: fmt, clamp: clamp, icon: icon, store: store };
})(window);
