/* Cromatografía en capa fina y en columna — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CP = { fe: { n: 'Ferroceno', p: 1, c: 0xff922b }, az: { n: 'Azobenceno', p: 2.5, c: 0xf76707 }, fl: { n: 'Fluorenona', p: 4, c: 0xfcc419 }, bh: { n: 'Benzhidrol', p: 6, c: 0x74c0fc }, ba: { n: 'Ácido benzoico', p: 8, c: 0xb197fc } };
  var EL = { hex: { n: 'Hexano', e: 0 }, tol: { n: 'Tolueno', e: 2.5 }, dcm: { n: 'Diclorometano', e: 4 }, ea: { n: 'Acetato de etilo', e: 6 }, ace: { n: 'Acetona', e: 7 }, met: { n: 'Metanol', e: 9 } };
  var S = { sel: { fe: 1, fl: 1, bh: 1, az: 0, ba: 0 }, el: 'dcm', es: 4, mode: 'tlc', p: 0, run: false }, lab = [], g = null, spots = {}, front = null, bands = {}, colm = null;
  function rf(k, e) { return 1 / (1 + Math.exp(0.7 * (CP[k].p - e))); }
  function sel() { return Object.keys(CP).filter(function (k) { return S.sel[k]; }); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ['Fase estacionaria y fase móvil', 'Fundamentos', 'La sílice (polar) retiene más a los compuestos polares; el eluyente los arrastra',
        '<p>En <b>cromatografía de adsorción</b> la <b>fase estacionaria</b> (sílice, polar) retiene los compuestos en proporción a su <b>polaridad</b>; la <b>fase móvil</b> (eluyente) los arrastra. Un compuesto apolar avanza más; uno polar se queda cerca del origen. Un eluyente más polar «compite» con la sílice y mueve todo más rápido.</p>'],
      ['Placa de capa fina (TLC)', 'TLC', 'Rf = distancia del compuesto / distancia del frente del disolvente',
        '<p>En la <b>placa TLC</b> se siembra la muestra sobre la <b>línea base</b> y se coloca en una cámara con eluyente. El disolvente sube por capilaridad. Al sacar la placa se marca el <b>frente</b>. El <b>factor de retención</b> es <b>R<sub>f</sub> = d<sub>compuesto</sub>/d<sub>frente</sub></b>, siempre entre 0 y 1. Un R<sub>f</sub> de 0,3–0,5 suele ser ideal para separar.</p>'],
      ['Elegir el eluyente', 'Eluyente', 'Más polar → Rf mayor. Ajusta hasta separar las manchas',
        '<p>Con <b>hexano</b> (apolar) casi nada se mueve; con <b>metanol</b> todo sube con el frente. Se prueban mezclas hasta lograr que las manchas queden entre R<sub>f</sub> 0,2 y 0,8 y <b>bien separadas</b> (ΔR<sub>f</sub> ≥ 0,1–0,15). Cambia el eluyente y observa el orden de elución: <b>apolares primero</b>.</p>'],
      ['Columna cromatográfica', 'Columna', 'Se separan por bandas que salen en orden de polaridad creciente',
        '<p>La <b>columna</b> es la TLC a escala preparativa: la muestra se carga arriba sobre sílice y se eluye. Las <b>bandas</b> descienden a distinta velocidad, y se recogen <b>fracciones</b> en tubos. El volumen de elución es <b>V<sub>e</sub> = V<sub>0</sub>(1 + k′)</b>, con k′ = (1 − R<sub>f</sub>)/R<sub>f</sub>. Las fracciones se siguen por TLC.</p>'],
      ['Resolución y pureza', 'Resolución', 'Dos manchas se separan bien si ΔRf es grande y las manchas son pequeñas',
        '<p>Para que dos compuestos se separen, la <b>diferencia de R<sub>f</sub></b> debe ser suficiente y las manchas estrechas (no sobrecargar la placa). En columna, la <b>resolución</b> R<sub>s</sub> compara la distancia entre picos con su ancho; R<sub>s</sub> ≥ 1,5 indica separación completa.</p>']
    ];
  }
  var def = {
    key: 'cromatografia', title: 'Cromatografía TLC y columna', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 3, 22], target: [0, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 1, 24], target: [0, 1, 0] }],
    layers: [{ id: 'sp', label: 'Manchas y bandas', icon: '●' }, { id: 'ch', label: 'Cámara', icon: '▢' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var gl = mat(0xa5d8ff, 0.15), i;
      var ch = new T.Mesh(new T.BoxGeometry(9, 12, 4), gl); ch.position.set(-6, 0, 0); ch.name = 'ch'; g.add(ch);
      var pl = new T.Mesh(new T.BoxGeometry(5, 10, 0.2), mat(0xf1f3f5, 1)); pl.position.set(-6, 0.3, 0); g.add(pl);
      var bl = new T.Mesh(new T.BoxGeometry(5.1, 0.08, 0.3), mat(0x495057, 1)); bl.position.set(-6, -3.8, 0.1); g.add(bl);
      front = new T.Mesh(new T.BoxGeometry(5.1, 0.07, 0.25), mat(0x228be6, 1)); front.position.set(-6, -3.8, 0.12); g.add(front);
      var liq = new T.Mesh(new T.BoxGeometry(8.8, 1.6, 3.8), mat(0xbac8ff, 0.4)); liq.position.set(-6, -5.1, 0); g.add(liq);
      Object.keys(CP).forEach(function (k, j) { var s = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.06, 20), mat(CP[k].c, 1)); s.rotation.x = Math.PI / 2; s.position.set(-7.6 + j * 0.8, -3.8, 0.2); g.add(s); spots[k] = s;
        var b = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.5, 20), mat(CP[k].c, 0.85)); b.position.set(6, 6, 0); g.add(b); bands[k] = b; });
      colm = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 11, 24, 1, true), gl); colm.position.set(6, 0.5, 0); g.add(colm);
      var sil = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 9.5, 24), mat(0xe9ecef, 0.8)); sil.position.set(6, 0, 0); g.add(sil); g.userData.sil = sil;
      for (i = 0; i < 6; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, e = EL[S.el].e, ks = sel(), sOn = ctx.layer('sp'), chOn = ctx.layer('ch');
      if (!P.manual) { S.mode = i === 3 ? 'col' : 'tlc'; S.p = Math.min(1, f.local * 1.1); if (i === 0) { S.sel = { fe: 1, fl: 1, bh: 1, az: 0, ba: 0 }; S.el = 'dcm'; } if (i === 2) { S.el = ['hex', 'tol', 'dcm', 'ea', 'ace', 'met'][Math.min(5, Math.floor(f.local * 6))]; S.p = 1; } if (i === 4) { S.p = 1; S.sel = { fe: 1, az: 1, fl: 1, bh: 1, ba: 1 }; S.el = 'dcm'; } e = EL[S.el].e; ks = sel(); }
      else if (S.run) { S.p += dt / 10; if (S.p >= 1) { S.p = 1; S.run = false; } }
      var p = S.p;
      g.children.forEach(function (o) { if (o.name === 'ch') o.visible = chOn; });
      var H = 7.2, fy = -3.8 + H * p;
      front.position.y = fy; front.visible = S.mode === 'tlc';
      Object.keys(CP).forEach(function (k) { var on = S.sel[k] && sOn; spots[k].visible = on && S.mode === 'tlc'; spots[k].position.y = -3.8 + H * p * rf(k, e); spots[k].scale.set(1 + 0.4 * p, 1, 1 + 0.4 * p);
        var b = bands[k]; b.visible = on && S.mode === 'col'; var Vt = p * 30 * 1.0, ke = (1 - rf(k, e)) / rf(k, e), pos = Math.min(1, Vt / (3 * (1 + ke))); b.position.y = 4.5 - pos * 9.5; b.scale.y = 1 + 2 * pos; });
      g.userData.sil.visible = S.mode === 'col'; colm.visible = S.mode === 'col';
      var ls = 0; Object.keys(CP).forEach(function (k, j) { if (S.mode === 'tlc' && S.sel[k]) { lab[ls].pos(-3.2, -3.8 + H * p * rf(k, e), 0.3).set(CP[k].n + ' · Rf ' + fmt(rf(k, e), 2), 'bl-d').vis(p > 0.2 && sOn); ls++; } });
      for (var q = ls; q < 6; q++) lab[q].vis(false);
      if (S.mode === 'col') lab[0].pos(6, 7, 0).set('Columna de sílice · eluyente ' + EL[S.el].n, 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.el) u.el.set(S.el); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var e = EL[S.el].e, ks = sel(); return { eq: { chip: 'Rf', name: 'Eluyente: ' + EL[S.el].n, body: ks.map(function (k) { return '<div class="eqline"><small>' + CP[k].n + '</small>' + fmt(rf(k, e), 2) + '</div>'; }).join('') }, legend: Object.keys(CP).map(function (k) { return { label: CP[k].n, color: '#' + CP[k].c.toString(16).padStart(6, '0'), text: 'polaridad ' + CP[k].p }; }) }; },
    measures: function () { var e = EL[S.el].e, ks = sel().sort(function (a, b) { return rf(b, e) - rf(a, e); }), r = [['Eluyente', EL[S.el].n + ' (fuerza ' + EL[S.el].e + ')']]; ks.forEach(function (k, j) { r.push([CP[k].n, 'Rf ' + fmt(rf(k, e), 2) + (j ? ' · ΔRf ' + fmt(rf(ks[j - 1], e) - rf(k, e), 2) : '')]); }); return r; },
    ideas: ['Apolares salen primero.', 'Eluyente más polar → Rf mayor.', 'Rf óptimo 0,3–0,5.', 'La columna aplica el mismo principio a escala preparativa.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Muestra'); el.appendChild(c);
      var tg = document.createElement('div'); tg.className = 'opts two'; c.appendChild(tg);
      Object.keys(CP).forEach(function (k) { var b = document.createElement('button'); b.className = 'opt'; b.innerHTML = CP[k].n + '<small>polaridad ' + CP[k].p + '</small>'; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); b.addEventListener('click', function () { ctx.goManual(); S.sel[k] = S.sel[k] ? 0 : 1; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); }); tg.appendChild(b); });
      ui.el = kit.ui.options({ label: 'Eluyente', cols: 2, value: S.el, options: Object.keys(EL).map(function (k) { return { v: k, label: EL[k].n }; }), onChange: function (v) { ctx.goManual(); S.el = v; } }); c.appendChild(ui.el);
      ui.p = kit.ui.slider({ label: 'Avance de elución', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: '▶ Eluir TLC', primary: true, fn: function () { ctx.goManual(); S.mode = 'tlc'; S.p = 0; S.run = true; } }, { t: 'Columna', fn: function () { ctx.goManual(); S.mode = 'col'; S.p = 0; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Rf frente a la fuerza del eluyente', h: 240, note: 'Cada curva es un compuesto; línea vertical = eluyente actual.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(i, L + pw * i / 10, h - B + 14); cx.fillText('fuerza del eluyente', L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 4, 2), L - 4, Tp + ph * (1 - i / 4) + 3);
        Object.keys(CP).forEach(function (k) { cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = S.sel[k] ? 3 : 1; cx.beginPath(); for (i = 0; i <= 100; i++) { var e = i / 10; (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * e / 10, Tp + ph * (1 - rf(k, e))); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * EL[S.el].e / 10, Tp); cx.lineTo(L + pw * EL[S.el].e / 10, Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#69db7c'; cx.setLineDash([2, 3]); [0.3, 0.5].forEach(function (v) { cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - v)); cx.lineTo(L + pw, Tp + ph * (1 - v)); cx.stroke(); }); cx.setLineDash([]);
      } },
      { title: 'Cromatograma de elución en columna', h: 230, note: 'Picos gaussianos en V = V₀(1 + k′) con ancho proporcional a √V.', draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, e = EL[S.el].e, Vmax = 40, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('volumen de elución (V₀ = 3 mL)', L + pw / 2, h - 6);
        sel().forEach(function (k) { var ke = (1 - rf(k, e)) / rf(k, e), V = 3 * (1 + ke), s = 0.25 * Math.sqrt(V); cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 200; i++) { var v = Vmax * i / 200, y = Math.exp(-0.5 * Math.pow((v - V) / s, 2)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * v / Vmax, Tp + ph * (1 - y * 0.9)); } cx.stroke(); cx.fillStyle = col.muted; if (V < Vmax) cx.fillText(fmt(V, 0), L + pw * V / Vmax, Tp + ph + 12); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () { var e = EL[S.el].e, ks = sel(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">Eluyente: ' + EL[S.el].n + ' (fuerza ' + e + ')</div><table class="calc-table">' + ks.map(function (k) { var r = rf(k, e), kk = (1 - r) / r; return row(CP[k].n, 'Rf = <b>' + fmt(r, 2) + '</b> · k′ = ' + fmt(kk, 2) + ' · Vₑ = ' + fmt(3 * (1 + kk), 1) + ' mL'); }).join('') + '</table><p class="muted small">Modelo didáctico: Rf = 1/(1 + e<sup>0,7(p − e)</sup>), con p la polaridad del compuesto y e la fuerza del eluyente.</p>'; },
    quiz: [
      { q: 'En sílice, el compuesto que sale primero es el más…', options: ['apolar', 'polar', 'iónico', 'denso'], answer: 0, why: 'Interactúa menos con la sílice.' },
      { q: 'Rf se define como…', options: ['d compuesto / d frente', 'd frente / d compuesto', 'd compuesto − d frente', 'tiempo / masa'], answer: 0, why: 'Siempre entre 0 y 1.' },
      { q: 'Si todas las manchas quedan en la línea base, el eluyente es…', options: ['poco polar; hay que aumentarlo', 'demasiado polar', 'perfecto', 'insoluble'], answer: 0, why: 'No logra desplazar los compuestos de la sílice.' },
      { q: 'Un buen Rf para separar está entre…', options: ['0,3 y 0,5', '0,9 y 1,0', '0,0 y 0,05', '1,2 y 1,5'], answer: 0, why: 'Hay margen a ambos lados.' },
      { q: 'En una columna, el compuesto más polar…', options: ['eluye al final', 'eluye primero', 'no eluye', 'se evapora'], answer: 0, why: 'Está más retenido.' }
    ],
    help: { intro: 'Marca los compuestos de la muestra, elige el eluyente y pulsa «Eluir TLC» o «Columna».', items: [['Cámara', 'en la placa, la línea celeste es el frente del disolvente; cada mancha avanza Rf × la distancia del frente.'], ['Controles', 'marca los compuestos de la muestra, elige el «Eluyente» y usa «▶ Eluir TLC», «Columna» o «Avance de elución».'], ['Gráficos', '«Rf frente a la fuerza del eluyente» y «Cromatograma de elución en columna».']], try: ['Eluye con hexano: los compuestos polares casi no se mueven.', 'Aumenta la polaridad del eluyente hasta dejar el Rf entre 0,3 y 0,5.', 'Pasa a la columna: el compuesto más apolar eluye primero.'] }
  };
  MSim.create(def);
})();
