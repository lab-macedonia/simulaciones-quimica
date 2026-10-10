/* app.js — Simulador multimecanismo 3D (SN2, SN1, E2, E1)
 * Orquesta: motor químico (Chem), visor 3D (Viewer), diagrama de energía, predictor y desafío. */
(function () {
  'use strict';
  const { V, fmt, predictor } = Chem;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Estado ---------- */
  const MECS = ['sn2', 'sn1', 'e2', 'e1'];
  const MEC_COLOR = { sn2: '#5cc8ff', sn1: '#b58cff', e2: '#ff7a90', e1: '#ffb454' };
  const LAYERS = [
    { k: 'flechas', i: '↷', t: 'Flechas', d: 'Flechas curvas de movimiento de electrones (A)', key: 'a' },
    { k: 'orbitales', i: '◍', t: 'Orbitales', d: 'Lóbulos de los orbitales que participan (O)', key: 'o' },
    { k: 'cargas', i: 'δ', t: 'Cargas', d: 'Cargas formales y parciales (C)', key: 'c' },
    { k: 'halos', i: '☁', t: 'Nube de carga', d: 'Color tipo potencial electrostático: rojo −, azul +' },
    { k: 'hiper', i: '⇢', t: 'Hiperconjugación', d: 'Donación σ(C–H) → p vacío en el carbocatión' },
    { k: 'rotulos', i: 'Aa', t: 'Rótulos', d: 'Símbolos de los átomos' },
    { k: 'medidas', i: '↔', t: 'Medidas', d: 'Distancias en el visor (M)', key: 'm' },
    { k: 'trayectorias', i: '∿', t: 'Trayectorias', d: 'Rastro de nucleófilo y grupo saliente (T)', key: 't' }
  ];
  const state = {
    mech: 'sn2',
    variante: { sn2: 'metilo', sn1: 'opuesta', e2: 'unico', e1: 'unico' },
    t: 0,
    playing: false,
    speed: 1,
    loop: true,
    guided: false,
    guidedFrom: null,
    holdUntil: 0,
    show: { flechas: true, orbitales: false, cargas: true, halos: true, hiper: true, rotulos: false, medidas: false, trayectorias: false },
    spacefill: false,
    autorotate: false,
    follow: true,
    theme: 'dark',
    pred: { sustrato: 'terciario', reactivo: 'debil', solvente: 'protico', temp: 'baja' },
    kinS: 2,
    kinN: 2,
    tab: 'mec',
    challenge: { caso: null, respondido: false, aciertos: 0, total: 0 }
  };

  const cache = {};
  function scenarioFor(mech) {
    const v = state.variante[mech];
    const key = mech + ':' + v;
    if (!cache[key]) cache[key] = Chem.scenarios[mech].create(v);
    return cache[key];
  }
  let sc = null;
  let viewer, energy;

  /* ---------- Persistencia ligera ---------- */
  function load() {
    try {
      const raw = localStorage.getItem('sn-e-sim');
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.theme) state.theme = o.theme;
      if (o.show) Object.assign(state.show, o.show);
      if (typeof o.loop === 'boolean') state.loop = o.loop;
      if (o.speed) state.speed = o.speed;
      if (typeof o.guided === 'boolean') state.guided = o.guided;
      if (typeof o.spacefill === 'boolean') state.spacefill = o.spacefill;
    } catch (e) { /* sin almacenamiento */ }
  }
  function save() {
    try {
      localStorage.setItem('sn-e-sim', JSON.stringify({ theme: state.theme, show: state.show, loop: state.loop, speed: state.speed, guided: state.guided, spacefill: state.spacefill }));
    } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- Utilidades ---------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function phaseIndexAt(t) {
    const f = sc.fases;
    for (let i = 0; i < f.length; i++) if (t >= f[i].t0 && t < f[i].t1) return i;
    return f.length - 1;
  }
  function nearTS(t) {
    return (sc.puntos || []).some(p => p.tipo === 'TS' && Math.abs(p.t - t) < 0.035);
  }
  function prefersReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- Cambio de mecanismo ---------- */
  function setMechanism(mech, opts) {
    if (!MECS.includes(mech)) mech = 'sn2';
    state.mech = mech;
    sc = scenarioFor(mech);
    state.t = opts && typeof opts.t === 'number' ? opts.t : 0;
    state.guidedFrom = null;
    state.holdUntil = 0;
    viewer.setScenario(sc);
    viewer.setModel(state.spacefill);
    energy.setScenario(sc);
    try { history.replaceState(null, '', '#' + mech); } catch (e) { /* file:// */ }

    // pestañas
    $$('.mech-tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mech === mech)));
    const col = MEC_COLOR[mech];
    document.documentElement.style.setProperty('--accent', col);
    $('#eqChip').textContent = sc.corto;
    $('#eqName').textContent = sc.nombre;
    $('#eqBody').innerHTML = sc.ecuacion + '<small>' + sc.subtitulo + '</small>';
    buildVariants();
    buildViews();
    buildStepper();
    buildTimeline();
    buildIdeas();
    buildMeasTable();
    buildKinetics();
    refreshLive(true);
  }

  function buildVariants() {
    const seg = $('#variantSeg');
    const vs = Chem.scenarios[state.mech].variantes;
    if (vs.length < 2) { seg.hidden = true; return; }
    seg.hidden = false;
    seg.innerHTML = '';
    const label = state.mech === 'sn1' ? 'Cara de ataque del H₂O' : 'Sustrato';
    seg.setAttribute('aria-label', label);
    vs.forEach(v => {
      const b = document.createElement('button');
      b.textContent = v.nombre;
      b.setAttribute('aria-pressed', String(state.variante[state.mech] === v.id));
      b.title = label + ': ' + v.nombre;
      b.addEventListener('click', () => {
        state.variante[state.mech] = v.id;
        const keepT = state.t;
        const was = state.playing;
        setMechanism(state.mech, { t: keepT });
        state.playing = was;
        updatePlayIcon();
      });
      seg.appendChild(b);
    });
  }

  function buildViews() {
    const seg = $('#viewSeg');
    seg.innerHTML = '';
    sc.camaras.forEach(c => {
      const b = document.createElement('button');
      b.textContent = c.nombre;
      b.setAttribute('aria-pressed', String(viewer.poseId === c.id));
      b.addEventListener('click', () => selectView(c.id));
      b.dataset.view = c.id;
      seg.appendChild(b);
    });
  }
  function selectView(id) {
    viewer.setPose(id, false);
    $$('#viewSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === id)));
  }
  function cycleView() {
    const ids = sc.camaras.map(c => c.id);
    const i = ids.indexOf(viewer.poseId);
    selectView(ids[(i + 1) % ids.length]);
  }

  function buildStepper() {
    const st = $('#stepper');
    st.innerHTML = '';
    sc.fases.forEach((f, i) => {
      const b = document.createElement('button');
      b.className = 'step';
      b.dataset.i = i;
      b.innerHTML = '<i>' + (i + 1) + '</i><span>' + f.nombre + '</span>';
      b.addEventListener('click', () => seekPhase(i));
      st.appendChild(b);
    });
  }

  function buildTimeline() {
    const segs = $('#segs');
    segs.innerHTML = '';
    const shades = [0.55, 0.8, 0.65, 0.9];
    sc.fases.forEach((f, i) => {
      const d = document.createElement('div');
      d.className = 'seg-i';
      d.style.width = (f.t1 - f.t0) * 100 + '%';
      d.style.background = MEC_COLOR[state.mech];
      d.style.opacity = shades[i % shades.length] * 0.5;
      d.title = f.nombre;
      segs.appendChild(d);
    });
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.id = 'fill';
    segs.appendChild(fill);
    const ticks = $('#ticks');
    ticks.innerHTML = '';
    (sc.puntos || []).forEach(p => {
      if (p.tipo === 'R' || p.tipo === 'P') return;
      const d = document.createElement('i');
      d.className = 'tick' + (p.tipo === 'INT' ? ' int' : '');
      d.style.left = p.t * 100 + '%';
      d.title = p.tipo === 'TS' ? 'Estado de transición ' + p.etiqueta : 'Intermediario';
      ticks.appendChild(d);
    });
  }

  function buildIdeas() {
    $('#ideas').innerHTML = sc.ideas.map(x => '<li>' + x + '</li>').join('');
  }

  function buildMeasTable() {
    const f = sc.frame(0);
    $('#measTable tbody').innerHTML = f.medidas.map(m => '<tr data-id="' + m.id + '"><td>' + m.etiqueta + '</td><td></td></tr>').join('');
    $('#extras').innerHTML = '';
    lastMeasT = -1;
  }

  /* ---------- Cinética ---------- */
  const KIN = [0.25, 0.5, 1, 2, 4];
  function buildKinetics() {
    const k = sc.cinetica;
    $('#rateLaw').textContent = k.ley;
    $('#rateNote').textContent = k.texto;
    const nuLbl = state.mech === 'e1' || state.mech === 'e2' ? '[base]' : '[Nu]';
    $('#kNuLbl').textContent = nuLbl;
    updateKinetics();
  }
  function updateKinetics() {
    const k = sc.cinetica;
    const s = KIN[state.kinS];
    const n = KIN[state.kinN];
    const v = Math.pow(s, k.orden_sustrato) * Math.pow(n, k.orden_nu);
    $('#kSo').textContent = '×' + fmt(s, s < 1 ? 2 : 0).replace(/,00$/, '');
    $('#kNo').textContent = '×' + fmt(n, n < 1 ? 2 : 0).replace(/,00$/, '');
    $('#rateVal').textContent = fmt(v, v < 1 ? 2 : 1);
    const pct = clamp((Math.log2(v) + 4) / 8, 0.03, 1) * 100;
    $('#rateFill').style.width = pct + '%';
    let msg;
    if (k.orden_nu === 0) msg = 'La velocidad depende solo del sustrato: cambiar [' + (state.mech === 'e1' ? 'base' : 'Nu') + '] no la modifica (el nucleófilo o la base entran después del paso lento).';
    else msg = 'La velocidad depende de ambos reactivos (orden global 2): al duplicar cualquiera de ellos, v se duplica.';
    $('#rateMsg').textContent = msg;
  }

  /* ---------- Capas ---------- */
  function buildLayers() {
    const body = $('#layersBody');
    body.innerHTML = '';
    LAYERS.forEach(L => {
      const b = document.createElement('button');
      b.className = 'layer';
      b.setAttribute('aria-pressed', String(!!state.show[L.k]));
      b.title = L.d;
      b.innerHTML = '<i>' + L.i + '</i>' + L.t;
      b.addEventListener('click', () => toggleLayer(L.k));
      b.dataset.k = L.k;
      body.appendChild(b);
    });
    const extra = [
      { k: '_sf', i: '⬤', t: 'Espacio lleno', d: 'Radios de van der Waals: ver el impedimento estérico', get: () => state.spacefill, set: v => { state.spacefill = v; viewer.setModel(v); } },
      { k: '_rot', i: '⟳', t: 'Girar', d: 'Rotación automática de la cámara', get: () => state.autorotate, set: v => { state.autorotate = v; viewer.setAutoRotate(v); } },
      { k: '_fol', i: '◎', t: 'Seguir', d: 'La cámara sigue el centro de la reacción', get: () => state.follow, set: v => { state.follow = v; viewer.setFollow(v); } }
    ];
    extra.forEach(E => {
      const b = document.createElement('button');
      b.className = 'layer';
      b.setAttribute('aria-pressed', String(E.get()));
      b.title = E.d;
      b.innerHTML = '<i>' + E.i + '</i>' + E.t;
      b.addEventListener('click', () => {
        E.set(!E.get());
        b.setAttribute('aria-pressed', String(E.get()));
        save();
      });
      b.dataset.k = E.k;
      body.appendChild(b);
    });
  }
  function toggleLayer(k) {
    state.show[k] = !state.show[k];
    const b = $('.layer[data-k="' + k + '"]');
    if (b) b.setAttribute('aria-pressed', String(state.show[k]));
    save();
  }

  /* ---------- Reproducción ---------- */
  function updatePlayIcon() {
    const use = $('#bPlay use');
    use.setAttribute('href', state.playing ? '#i-pause' : '#i-play');
    $('#bPlay').setAttribute('aria-label', state.playing ? 'Pausar' : 'Reproducir');
  }
  function play() {
    if (state.t >= 0.9995) state.t = 0;
    // en modo por etapas: si estamos justo al final de una etapa, entrar a la siguiente
    const i = phaseIndexAt(state.t);
    if (state.guided && state.t > sc.fases[i].t1 - 0.004 && i < sc.fases.length - 1) state.t = sc.fases[i].t1 + 0.0001;
    state.guidedFrom = phaseIndexAt(state.t);
    state.playing = true;
    state.holdUntil = 0;
    document.querySelector('.dock').classList.remove('pulse-next');
    updatePlayIcon();
  }
  function pause() { state.playing = false; updatePlayIcon(); }
  function toggle() { state.playing ? pause() : play(); }
  function seek(t, keepPlaying) {
    state.t = clamp(t, 0, 1);
    if (!keepPlaying) pause();
    document.querySelector('.dock').classList.remove('pulse-next');
  }
  function seekPhase(i) {
    const f = sc.fases[clamp(i, 0, sc.fases.length - 1)];
    const wasPlaying = state.playing;
    seek(f.t0 + 0.0005, true);
    state.guidedFrom = phaseIndexAt(state.t);
    state.playing = wasPlaying;
    updatePlayIcon();
    flashPhaseCard();
  }
  function stepPhase(dir) {
    const cur = phaseIndexAt(state.t);
    const f = sc.fases[cur];
    let target = cur + dir;
    // «anterior» desde el interior de una etapa vuelve al comienzo de esa misma etapa
    if (dir < 0 && state.t - f.t0 > 0.02) target = cur;
    seekPhase(target);
  }
  function flashPhaseCard() {
    const c = $('.phase-card');
    c.classList.remove('flash');
    void c.offsetWidth;
    c.classList.add('flash');
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.playing && now >= state.holdUntil) {
      // se ralentiza cerca de cada estado de transición
      let prox = 0;
      (sc.puntos || []).forEach(p => { if (p.tipo === 'TS') prox = Math.max(prox, Math.exp(-Math.pow((state.t - p.t) / 0.05, 2))); });
      const warp = 1 - 0.62 * prox;
      const dur = 15 * (sc.pasos > 1 ? 1.15 : 1);
      state.t += (dt * state.speed * warp) / dur;
      if (state.t >= 1) {
        if (state.loop) { state.t = 0; state.holdUntil = now + 900; state.guidedFrom = 0; }
        else { state.t = 1; pause(); }
      } else if (state.guided && state.guidedFrom !== null && phaseIndexAt(state.t) > state.guidedFrom) {
        // modo por etapas: se detiene al terminar la etapa en curso
        state.t = sc.fases[state.guidedFrom].t1 - 0.0004;
        pause();
        document.querySelector('.dock').classList.add('pulse-next');
      }
    }
    refreshLive(false);
    requestAnimationFrame(tick);
  }

  /* ---------- Actualización en vivo ---------- */
  let sliderDrag = false;
  let lastPhase = -1;
  let lastMeasT = -1;
  let lastArrowSig = '';
  let lastLegendSig = '';
  function refreshLive(force) {
    const frame = sc.frame(state.t);
    viewer.update(frame, state.show, state.t);

    // barra de progreso
    const sl = $('#slider');
    if (!sliderDrag || force) sl.value = state.t;
    $('#fill').style.width = state.t * 100 + '%';
    $('#pct').textContent = Math.round(state.t * 100) + ' %';

    // etapa
    const pi = phaseIndexAt(state.t);
    const f = sc.fases[pi];
    const ts = nearTS(state.t) || f.id === 'ts';
    if (pi !== lastPhase || force) {
      lastPhase = pi;
      $('#phStep').textContent = 'Etapa ' + (pi + 1) + ' / ' + sc.fases.length;
      $('#phName').textContent = f.nombre;
      $('#pcKicker').textContent = 'Etapa ' + (pi + 1) + ' de ' + sc.fases.length;
      $('#pcTitle').textContent = f.nombre;
      $('#pcText').innerHTML = f.texto;
      $$('.step').forEach((b, i) => {
        b.classList.toggle('is-on', i === pi);
        b.classList.toggle('done', i < pi);
        b.setAttribute('aria-current', i === pi ? 'step' : 'false');
      });
      if (!force) flashPhaseCard();
    }
    $('#phaseBadge').classList.toggle('is-ts', ts);
    $('#phTs').hidden = !ts;

    // medidas (acotado a ~15 Hz)
    if (force || Math.abs(state.t - lastMeasT) > 0.002) {
      lastMeasT = state.t;
      frame.medidas.forEach(m => {
        const row = $('#measTable tr[data-id="' + m.id + '"] td:last-child');
        if (row) row.textContent = m.texto ? m.valor : fmt(m.valor, m.unidad === '°' ? 1 : 2) + (m.unidad ? ' ' + m.unidad : '');
      });
      const ex = [];
      if (frame.extra.cip) ex.push('<div class="pill-row cip-' + frame.extra.cip.letra + '"><span>' + frame.extra.cip.etiqueta + '</span><b>' + frame.extra.cip.valor + '</b></div>');
      if (frame.extra.hib) ex.push('<div class="pill-row"><span>' + frame.extra.hib.etiqueta + '</span><b>' + frame.extra.hib.valor + '</b></div>');
      const html = ex.join('');
      const box = $('#extras');
      if (box.dataset.h !== html) { box.innerHTML = html; box.dataset.h = html; }
    }

    // leyenda dinámica
    updateLegend(frame);

    if (state.tab === 'ene') energy.setProgress(state.t);
  }

  function updateLegend(frame) {
    const rows = [];
    if (state.show.flechas) {
      (frame.arrows || []).filter(a => a.grupo !== 'hiper' && a.alpha > 0.35).forEach(a => {
        rows.push('<div class="lg-row"><span class="lg-arrow" style="border-color:#' + a.color.toString(16).padStart(6, '0') + ';color:#' + a.color.toString(16).padStart(6, '0') + '"></span><b>' + a.rotulo + '</b></div>');
      });
    }
    if (state.show.hiper) {
      const h = (frame.arrows || []).find(a => a.grupo === 'hiper' && a.alpha > 0.35);
      if (h) rows.push('<div class="lg-row"><span class="lg-arrow" style="border-color:#36d6c8;color:#36d6c8"></span><b>Hiperconjugación: σ(C–H) → p vacío</b></div>');
    }
    if (state.show.orbitales && (frame.orbs || []).some(o => o.alpha > 0.1)) {
      rows.push('<div class="lg-row"><span class="lg-dot" style="background:#2fd3c4"></span><span class="lg-dot" style="background:#d35bd6;margin-left:-4px"></span><span>fases del orbital</span><span class="lg-dot" style="background:#ffc847"></span><span>par libre</span></div>');
    }
    if (state.show.halos) {
      rows.push('<div class="lg-row"><span class="lg-dot" style="background:#ff4a52"></span><span>δ⁻</span><span class="lg-dot" style="background:#3d9bff"></span><span>δ⁺</span></div>');
    }
    const sig = rows.join('');
    if (sig !== lastLegendSig) {
      lastLegendSig = sig;
      $('#legend').innerHTML = sig;
    }
  }

  /* ---------- Predictor ---------- */
  function buildPredictor() {
    const form = $('#predForm');
    form.innerHTML = '';
    const mk = (titulo, lista, clave, dos) => {
      const f = document.createElement('div');
      f.className = 'field';
      f.innerHTML = '<span class="lbl">' + titulo + '</span>';
      const box = document.createElement('div');
      box.className = 'opts' + (dos ? ' two' : '');
      lista.forEach(o => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.setAttribute('aria-pressed', String(state.pred[clave] === o.id));
        b.innerHTML = o.nombre + (o.ejemplo ? '<small>' + o.ejemplo + '</small>' : '');
        b.addEventListener('click', () => {
          state.pred[clave] = o.id;
          $$('.opt', box).forEach(x => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          renderPrediction();
        });
        box.appendChild(b);
      });
      f.appendChild(box);
      form.appendChild(f);
    };
    mk('Sustrato (halogenuro de alquilo)', predictor.sustratos.map(s => ({ id: s.id, nombre: s.nombre + ' — ' + s.formula, ejemplo: s.ejemplo })), 'sustrato', true);
    mk('Reactivo', predictor.reactivos, 'reactivo', false);
    mk('Disolvente', predictor.solventes, 'solvente', true);
    mk('Temperatura', predictor.temperaturas, 'temp', true);
    renderPrediction();
  }

  function renderPrediction() {
    const r = predictor.evaluar(state.pred);
    $('#predBars').innerHTML = r.orden.map((k, i) => {
      const pc = Math.round(r.puntajes[k] * 100);
      return '<div class="bar-row' + (i === 0 ? ' top' : '') + '" style="--mc:' + MEC_COLOR[k] + '"><b style="color:' + MEC_COLOR[k] + '">' + predictor.NOMBRES[k] + '</b><div class="bar-track"><i style="width:' + pc + '%"></i></div><span class="pc">' + pc + ' %</span></div>';
    }).join('');
    $('#predReasons').innerHTML = r.razones.map(x => '<li>' + x + '</li>').join('');
    const note = $('#predNote');
    note.hidden = !r.nota;
    note.textContent = r.nota || '';
    const go = $('#predGo');
    go.textContent = 'Ver ' + predictor.NOMBRES[r.principal] + ' en 3D';
    go.dataset.mech = r.principal;
  }

  /* ---------- Desafío ---------- */
  function challengeStart() {
    const caso = predictor.casoAleatorio();
    state.challenge.caso = caso;
    state.challenge.respondido = false;
    renderChallenge();
  }
  function describe(c) {
    const s = predictor.sustratos.find(x => x.id === c.sustrato);
    const r = predictor.reactivos.find(x => x.id === c.reactivo);
    const d = predictor.solventes.find(x => x.id === c.solvente);
    const t = predictor.temperaturas.find(x => x.id === c.temp);
    return '<b>Sustrato:</b> ' + s.nombre.toLowerCase() + ' (' + s.ejemplo + ')<br><b>Reactivo:</b> ' + r.nombre.toLowerCase() + ' (' + r.ejemplo + ')<br><b>Disolvente:</b> ' + d.nombre.toLowerCase() + ' (' + d.ejemplo + ')<br><b>Temperatura:</b> ' + t.nombre.toLowerCase() + ' (' + t.ejemplo + ')';
  }
  function renderChallenge() {
    const ch = state.challenge;
    const body = $('#chBody');
    if (!ch.caso) {
      body.innerHTML = '<p>Te doy unas condiciones; tú eliges el mecanismo que predomina.</p><button class="btn" id="chStart">Empezar desafío</button>';
      $('#chStart').addEventListener('click', challengeStart);
      return;
    }
    const e = ch.caso.resultado;
    let html = '<p class="q">' + describe(ch.caso.condiciones) + '</p><div class="ans">';
    predictor.ORDEN.forEach(k => {
      let cls = '';
      if (ch.respondido) cls = k === e.principal ? ' right' : (ch.eleccion === k ? ' wrong' : '');
      html += '<button data-k="' + k + '" class="' + cls.trim() + '"' + (ch.respondido ? ' disabled' : '') + ' style="color:' + MEC_COLOR[k] + '">' + predictor.NOMBRES[k] + '</button>';
    });
    html += '</div>';
    if (ch.respondido) {
      const ok = ch.eleccion === e.principal;
      html += '<div class="verdict ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? '¡Correcto!' : 'Predomina ' + predictor.NOMBRES[e.principal] + '.') + '</b> ' + e.razones.slice(0, 3).join(' ') + '</div>';
      html += '<div class="row"><button class="btn primary" id="chNext">Otro caso</button><button class="btn" id="chSee">Ver ' + predictor.NOMBRES[e.principal] + ' en 3D</button></div>';
    }
    html += '<div class="score">Aciertos: ' + ch.aciertos + ' de ' + ch.total + '</div>';
    body.innerHTML = html;
    $$('.ans button', body).forEach(b => b.addEventListener('click', () => {
      ch.respondido = true;
      ch.eleccion = b.dataset.k;
      ch.total++;
      if (ch.eleccion === e.principal) ch.aciertos++;
      renderChallenge();
    }));
    const nx = $('#chNext', body);
    if (nx) nx.addEventListener('click', challengeStart);
    const se = $('#chSee', body);
    if (se) se.addEventListener('click', () => { setMechanism(e.principal); play(); });
  }

  /* ---------- Tema, pantalla completa, captura, ayuda ---------- */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    $('#btnTheme use').setAttribute('href', state.theme === 'dark' ? '#i-sun' : '#i-moon');
    if (viewer) viewer.setTheme(state.theme);
    if (energy) energy.draw();
  }
  function snapshot() {
    const src = viewer.snapshot();
    const w = src.width;
    const h = src.height;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const cs = getComputedStyle(document.documentElement);
    const grad = g.createRadialGradient(w * 0.38, h * 0.38, 0, w * 0.38, h * 0.38, Math.max(w, h) * 0.8);
    grad.addColorStop(0, cs.getPropertyValue('--bg1').trim());
    grad.addColorStop(1, cs.getPropertyValue('--bg0').trim());
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.drawImage(src, 0, 0);
    g.fillStyle = state.theme === 'dark' ? 'rgba(233,238,249,0.85)' : 'rgba(20,26,43,0.85)';
    g.font = '600 ' + Math.round(h * 0.03) + 'px system-ui, sans-serif';
    g.fillText(sc.corto + ' — ' + sc.subtitulo + ' · t = ' + Math.round(state.t * 100) + ' %', w * 0.03, h * 0.95);
    const a = document.createElement('a');
    a.download = 'mecanismo-' + sc.id + '-' + Math.round(state.t * 100) + '.png';
    a.href = cv.toDataURL('image/png');
    a.click();
  }

  /* ---------- Eventos ---------- */
  function bindEvents() {
    $$('.mech-tab').forEach(b => b.addEventListener('click', () => { setMechanism(b.dataset.mech); play(); }));
    $('#bPlay').addEventListener('click', toggle);
    $('#bReset').addEventListener('click', () => { seek(0); });
    $('#bPrev').addEventListener('click', () => stepPhase(-1));
    $('#bNext').addEventListener('click', () => stepPhase(1));
    $('#bLoop').addEventListener('click', e => { state.loop = !state.loop; e.currentTarget.setAttribute('aria-pressed', String(state.loop)); save(); });
    $('#bGuided').addEventListener('click', e => { state.guided = !state.guided; e.currentTarget.setAttribute('aria-pressed', String(state.guided)); save(); });
    $('#speed').addEventListener('change', e => { state.speed = parseFloat(e.target.value); save(); });
    const sl = $('#slider');
    sl.addEventListener('input', () => seek(parseFloat(sl.value)));
    sl.addEventListener('pointerdown', () => { sliderDrag = true; });
    window.addEventListener('pointerup', () => { sliderDrag = false; });
    $('#btnTheme').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(); });
    $('#btnSnap').addEventListener('click', snapshot);
    $('#btnFull').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    });
    $('#btnHelp').addEventListener('click', () => $('#helpDlg').showModal());
    $('#btnPanel').addEventListener('click', e => {
      const p = $('#panel');
      const open = p.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    $('#layersHead').addEventListener('click', e => {
      const ex = e.currentTarget.getAttribute('aria-expanded') === 'true';
      e.currentTarget.setAttribute('aria-expanded', String(!ex));
      $('#layersBody').hidden = ex;
      $('.views').hidden = ex;
    });
    $$('.ptab').forEach(b => b.addEventListener('click', () => selectTab(b.dataset.tab)));
    $('#kS').addEventListener('input', e => { state.kinS = +e.target.value; updateKinetics(); });
    $('#kN').addEventListener('input', e => { state.kinN = +e.target.value; updateKinetics(); });
    $('#predGo').addEventListener('click', e => { setMechanism(e.currentTarget.dataset.mech); play(); });

    window.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if ((tag === 'input' && e.target.type !== 'range') || tag === 'select' || tag === 'textarea') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === ' ' && tag !== 'button') { e.preventDefault(); toggle(); }
      else if (k === 'ArrowRight' || k === 'ArrowLeft') {
        e.preventDefault();
        const d = k === 'ArrowRight' ? 1 : -1;
        if (e.shiftKey) stepPhase(d); else seek(state.t + d * 0.01);
      }
      else if (k >= '1' && k <= '4') { setMechanism(MECS[+k - 1]); }
      else if (k === 'r' || k === 'R') seek(0);
      else if (k === 'v' || k === 'V') cycleView();
      else if (k === '?') $('#helpDlg').showModal();
      else {
        const L = LAYERS.find(x => x.key === k.toLowerCase());
        if (L) toggleLayer(L.k);
      }
    });
    window.addEventListener('hashchange', () => {
      const h = location.hash.replace('#', '');
      if (MECS.includes(h) && h !== state.mech) setMechanism(h);
    });
    document.addEventListener('visibilitychange', () => { last = performance.now(); });
  }

  function selectTab(id) {
    state.tab = id;
    $$('.ptab').forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.tabpane').forEach(p => (p.hidden = p.id !== 'tab-' + id));
    if (id === 'ene') requestAnimationFrame(() => { energy.draw(); energy.setProgress(state.t); });
  }

  /* ---------- Inicio ---------- */
  function init() {
    load();
    viewer = new Viewer($('#canvas-container'));
    energy = new EnergyDiagram($('#energyCanvas'), t => seek(t));
    viewer.setFollow(state.follow);
    applyTheme();
    buildLayers();
    buildPredictor();
    renderChallenge();
    $('#speed').value = String(state.speed);
    $('#bLoop').setAttribute('aria-pressed', String(state.loop));
    $('#bGuided').setAttribute('aria-pressed', String(state.guided));
    if (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) {
      $('#layersHead').setAttribute('aria-expanded', 'false');
      $('#layersBody').hidden = true;
      $('.views').hidden = true;
    }
    bindEvents();
    const h = location.hash.replace('#', '');
    setMechanism(MECS.includes(h) ? h : 'sn2');
    updatePlayIcon();
    last = performance.now();
    requestAnimationFrame(tick);
    if (!prefersReduced()) setTimeout(() => { if (state.t === 0 && !state.playing) play(); }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Para depuración desde la consola
  window.__sim = { state, get sc() { return sc; }, get viewer() { return viewer; }, setMechanism, seek, play, pause };
})();
