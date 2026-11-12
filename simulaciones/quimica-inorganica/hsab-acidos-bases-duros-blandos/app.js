/* Ácidos y bases duros y blandos (HSAB) — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var AC = {
    h: { n: 'H⁺', q: 1, r: 25, h: 2, p: 0.0 }, li: { n: 'Li⁺', q: 1, r: 76, h: 2, p: 0.1 }, mg: { n: 'Mg²⁺', q: 2, r: 72, h: 2, p: 0.1 }, al: { n: 'Al³⁺', q: 3, r: 54, h: 2, p: 0.05 }, fe3: { n: 'Fe³⁺', q: 3, r: 65, h: 2, p: 0.15 },
    fe2: { n: 'Fe²⁺', q: 2, r: 78, h: 1, p: 0.45 }, cu2: { n: 'Cu²⁺', q: 2, r: 73, h: 1, p: 0.5 }, zn: { n: 'Zn²⁺', q: 2, r: 74, h: 1, p: 0.45 },
    cu1: { n: 'Cu⁺', q: 1, r: 77, h: 0, p: 0.8 }, ag: { n: 'Ag⁺', q: 1, r: 115, h: 0, p: 0.85 }, hg: { n: 'Hg²⁺', q: 2, r: 102, h: 0, p: 0.95 }, pt: { n: 'Pt²⁺', q: 2, r: 80, h: 0, p: 0.8 }
  };
  var BA = {
    f: { n: 'F⁻', q: 1, r: 133, h: 2, p: 0.1 }, oh: { n: 'OH⁻', q: 1, r: 140, h: 2, p: 0.15 }, o: { n: 'O²⁻', q: 2, r: 140, h: 2, p: 0.15 }, h2o: { n: 'H₂O', q: 0, r: 140, h: 2, p: 0.15 }, nh3: { n: 'NH₃', q: 0, r: 150, h: 2, p: 0.25 },
    cl: { n: 'Cl⁻', q: 1, r: 181, h: 1, p: 0.45 }, br: { n: 'Br⁻', q: 1, r: 196, h: 1, p: 0.55 },
    i: { n: 'I⁻', q: 1, r: 220, h: 0, p: 0.85 }, s: { n: 'S²⁻', q: 2, r: 184, h: 0, p: 0.9 }, scn: { n: 'SCN⁻ (S)', q: 1, r: 190, h: 0, p: 0.8 }, cn: { n: 'CN⁻', q: 1, r: 190, h: 0, p: 0.8 }, co: { n: 'CO', q: 0, r: 200, h: 0, p: 0.75 }
  };
  var CL = ['blando', 'frontera', 'duro'], CC = ['#ffa94d', '#74c0fc', '#9775fa'];
  var S = { a: 'al', b: 'f', a2: 'hg', b2: 'o', a3: 'hg', b3: 's' }, g = null, pairs = [], lab = [];
  function score(a, b) {
    var A = AC[a], B = BA[b], d = Math.abs(A.h - B.h), s = 3 - 1.5 * d;
    if (A.h === 2 && B.h === 2) s += 0.6 * Math.min(2.5, (A.q * Math.max(B.q, 0.6)) / ((A.r + B.r) / 100));
    if (A.h === 0 && B.h === 0) s += 1.5 * A.p * B.p;
    return Math.max(0, s);
  }
  function sums() { var r = score(S.a, S.b) + score(S.a2, S.b2), p = score(S.a, S.b2) + score(S.a2, S.b); return { r: r, p: p }; }
  function stages() {
    return [
      ['Duro y blando', 'Duro / blando', 'Duros: pequeños, muy cargados, poco polarizables. Blandos: grandes, poco cargados, muy polarizables',
        '<p>Pearson clasificó ácidos (aceptores de pares de electrones) y bases (donadores) en <b>duros</b> y <b>blandos</b>. Las especies <b>duras</b> son pequeñas, de alta carga y poco <b>polarizables</b> (Al³⁺, F⁻, OH⁻); las <b>blandas</b> son grandes, de baja carga y muy polarizables (Hg²⁺, Ag⁺, I⁻, S²⁻). Las esferas muestran el tamaño y la «nube» translúcida, la polarizabilidad.</p>'],
      ['Clasificación', 'Clasificación', 'Tres categorías: duro, frontera y blando',
        '<p>Entre ambos extremos hay especies <b>frontera</b> (Fe²⁺, Cu²⁺, Zn²⁺; Cl⁻, Br⁻). Recorre la tabla de cationes y bases y observa cómo cambian radio y nube. El criterio es cualitativo: la dureza no es una cantidad medible directamente, sino una guía basada en tendencias.</p>'],
      ['Emparejamiento', 'Emparejamiento', 'Duro con duro, blando con blando',
        '<p>La regla de Pearson: <b>los ácidos duros prefieren bases duras y los blandos, bases blandas</b>. Las uniones duro–duro son sobre todo <b>iónicas</b> (carga/radio); las blando–blando, más <b>covalentes</b> (polarizabilidad). Elige un ácido y una base: el puntaje cualitativo sube cuando ambos coinciden y la esfera se acerca.</p>'],
      ['Reacciones de intercambio', 'Intercambio', 'AB + CD ⇌ AD + CB: favorece los pares duro–duro y blando–blando',
        '<p>En una reacción de <b>intercambio</b> A₁B₁ + A₂B₂ ⇌ A₁B₂ + A₂B₁, el equilibrio se desplaza hacia el lado de <b>mayor puntaje total</b>. Prueba Al³⁺/Hg²⁺ con O²⁻/S²⁻: el aluminio queda con el oxígeno y el mercurio con el azufre.</p>'],
      ['Minerales', 'Minerales', 'Al₂O₃ en óxidos; HgS y Cu₂S en sulfuros',
        '<p>La <b>geoquímica</b> sigue HSAB: los cationes duros (Al³⁺, Mg²⁺, Fe³⁺) aparecen como <b>óxidos y silicatos</b> (bauxita, olivino); los blandos (Hg²⁺, Cu⁺, Ag⁺, Pt²⁺) como <b>sulfuros</b> (cinabrio HgS, calcocita Cu₂S). Esto guía la extracción: los sulfuros se tuestan; los óxidos de aluminio se disuelven en base.</p>']
    ];
  }
  function mkPair(ctx, x, y) {
    var P = { g: new T.Group() }; P.g.position.set(x, y, 0); g.add(P.g);
    P.a = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0x4dabf7 })); P.b = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xff8787 }));
    P.ca = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.2, depthWrite: false })); P.cb = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0xff8787, transparent: true, opacity: 0.2, depthWrite: false }));
    P.g.add(P.a); P.g.add(P.b); P.g.add(P.ca); P.g.add(P.cb); pairs.push(P); return P;
  }
  function setPair(P, a, b, vis) {
    var A = AC[a], B = BA[b], ra = 0.35 + A.r / 100 * 0.9, rb = 0.35 + B.r / 100 * 0.9, sc = score(a, b), d = (ra + rb) * (1.25 - Math.min(1, sc / 4.5) * 0.45);
    P.g.visible = vis; P.a.scale.setScalar(ra); P.b.scale.setScalar(rb); P.ca.scale.setScalar(ra * (1.05 + A.p * 0.7)); P.cb.scale.setScalar(rb * (1.05 + B.p * 0.7));
    P.ca.material.opacity = 0.1 + A.p * 0.3; P.cb.material.opacity = 0.1 + B.p * 0.3; P.a.material.color.set(CC[A.h]); P.b.material.color.set(CC[B.h]);
    P.ca.material.color.set(CC[A.h]); P.cb.material.color.set(CC[B.h]); P.a.position.x = -d / 2 * (rb / (ra + rb)) * 1.0 - 0; P.a.position.x = -d * rb / (ra + rb); P.b.position.x = d * ra / (ra + rb); P.ca.position.x = P.a.position.x; P.cb.position.x = P.b.position.x; return sc;
  }
  var def = {
    key: 'hsab-acidos-bases-duros-blandos', title: 'Ácidos y bases duros y blandos (HSAB)', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [16, 5, 24], target: [16, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [16, 0, 28], target: [16, 0, 0] }],
    layers: [{ id: 'cloud', label: 'Nube', icon: '◌' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); mkPair(ctx, 13, 4); mkPair(ctx, 13, -4); mkPair(ctx, 25, 4); mkPair(ctx, 25, -4);
      for (var i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i, ka = Object.keys(AC), kb = Object.keys(BA);
      if (!P.manual) {
        if (i === 0) { S.a = ['al', 'hg'][f.local < 0.5 ? 0 : 1]; S.b = f.local < 0.5 ? 'f' : 'i'; }
        if (i === 1) { S.a = ka[Math.min(ka.length - 1, Math.floor(f.local * ka.length))]; S.b = kb[Math.min(kb.length - 1, Math.floor(f.local * kb.length))]; }
        if (i === 2) { var st = Math.min(3, Math.floor(f.local * 4)); S.a = ['al', 'al', 'hg', 'hg'][st]; S.b = ['f', 'i', 'f', 'i'][st]; }
        if (i === 3) { S.a = 'al'; S.b = 'o'; S.a2 = 'hg'; S.b2 = 's'; }
        if (i === 4) { var m = Math.min(2, Math.floor(f.local * 3)); S.a = ['al', 'hg', 'cu1'][m]; S.b = 'o'; S.a2 = ['al', 'hg', 'cu1'][m]; S.b2 = 's'; }
      }
      var ex = i >= 3 || (P.manual && false), cl = ctx.layer('cloud'), sm = sums(), s1, s2, s3, s4;
      var stg = P.manual ? 3 : i; ex = stg >= 3;
      if (stg >= 3) {
        if (stg === 3) { S.a = 'al'; S.b = 'o'; S.a2 = 'hg'; S.b2 = 's'; }
        s1 = setPair(pairs[0], S.a, S.b, true); s2 = setPair(pairs[1], S.a2, S.b2, true); s3 = setPair(pairs[2], S.a, S.b2, true); s4 = setPair(pairs[3], S.a2, S.b, true);
      } else { s1 = setPair(pairs[0], S.a, S.b, true); setPair(pairs[1], S.a, S.b, false); setPair(pairs[2], S.a, S.b, false); setPair(pairs[3], S.a, S.b, false); pairs[0].g.position.set(18, 0, 0); }
      pairs[0].g.scale.setScalar(stg >= 3 ? 1 : 1.9);
      if (stg >= 3) pairs[0].g.position.set(13, 4, 0); pairs.forEach(function (p) { p.ca.visible = p.cb.visible = cl; });
      var A = AC[S.a], B = BA[S.b];
      lab[0].pos(stg >= 3 ? 13 : 18, stg >= 3 ? 8 : 4.6, 0).set(stg >= 3 ? AC[S.a].n + ' ' + BA[S.b].n + '  +  ' + AC[S.a2].n + ' ' + BA[S.b2].n : A.n + ' + ' + B.n, 'bl-lead').vis(true);
      lab[1].pos(stg >= 3 ? 13 : 18, stg >= 3 ? -8.3 : -4.2, 0).set(stg >= 3 ? 'reactivos: puntaje ' + fmt(sm.r, 1) : 'ácido ' + CL[A.h] + ' · base ' + CL[B.h] + ' · puntaje ' + fmt(s1, 1), 'bl-d').vis(true);
      lab[2].pos(25, 8, 0).set(stg >= 3 ? AC[S.a].n + ' ' + BA[S.b2].n + '  +  ' + AC[S.a2].n + ' ' + BA[S.b].n : '', 'bl-lead').vis(stg >= 3);
      lab[3].pos(25, -8.3, 0).set(stg >= 3 ? 'productos: puntaje ' + fmt(sm.p, 1) : '', 'bl-d').vis(stg >= 3);
      lab[4].pos(19, 0, 0).set(stg >= 3 ? (sm.r > sm.p + 0.2 ? '← favorece reactivos' : (sm.p > sm.r + 0.2 ? 'favorece productos →' : '≈ equilibrio')) : '', sm.p > sm.r ? 'bl-pos' : 'bl-neg').vis(stg >= 3);
      lab[5].pos(0, 0, 0).set('', 'bl-d').vis(false); lab[6].pos(0, 0, 0).set('', 'bl-d').vis(false); lab[7].pos(0, 0, 0).set('', 'bl-d').vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; ['a', 'b', 'a2', 'b2'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var A = AC[S.a], B = BA[S.b]; return { eq: { chip: 'HSAB', name: 'Pareja', body: '<div class="eqline"><small>Ácido</small>' + A.n + ' (' + CL[A.h] + ')</div><div class="eqline"><small>Base</small>' + B.n + ' (' + CL[B.h] + ')</div><div class="eqline"><small>Puntaje</small>' + fmt(score(S.a, S.b), 2) + '</div><div class="eqline"><small>Intercambio</small>' + (sums().p > sums().r + 0.2 ? 'productos' : (sums().r > sums().p + 0.2 ? 'reactivos' : '≈ equilibrio')) + '</div>' }, legend: [{ label: 'Morado', color: '#9775fa', text: 'duro' }, { label: 'Celeste', color: '#74c0fc', text: 'frontera' }, { label: 'Naranja', color: '#ffa94d', text: 'blando' }] }; },
    measures: function () { var A = AC[S.a], B = BA[S.b], s = sums(); return [['Ácido', A.n + ' · ' + CL[A.h]], ['Radio iónico', A.r + ' pm'], ['Carga/radio', fmt(A.q / A.r * 100, 2)], ['Base', B.n + ' · ' + CL[B.h]], ['Puntaje del par', fmt(score(S.a, S.b), 2)], ['Σ reactivos / productos', fmt(s.r, 1) + ' / ' + fmt(s.p, 1)]]; },
    ideas: ['Duro–duro y blando–blando se prefieren.', 'Duro: pequeño, muy cargado.', 'Blando: grande y polarizable.', 'Sumar puntajes predice el intercambio.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Par ácido–base'); el.appendChild(c);
      function oa(o) { return Object.keys(o).map(function (k) { return { v: k, label: o[k].n, sub: CL[o[k].h] }; }); }
      ui.a = kit.ui.options({ label: 'Ácido (catión)', cols: 3, value: S.a, options: oa(AC), onChange: function (v) { ctx.goManual(); S.a = v; } });
      ui.b = kit.ui.options({ label: 'Base', cols: 3, value: S.b, options: oa(BA), onChange: function (v) { ctx.goManual(); S.b = v; } });
      c.appendChild(ui.a); c.appendChild(ui.b);
      var d = kit.ui.card('Reacción de intercambio'); el.appendChild(d);
      ui.a2 = kit.ui.options({ label: 'Segundo ácido', cols: 3, value: S.a2, options: oa(AC), onChange: function (v) { ctx.goManual(); S.a2 = v; } });
      ui.b2 = kit.ui.options({ label: 'Segunda base', cols: 3, value: S.b2, options: oa(BA), onChange: function (v) { ctx.goManual(); S.b2 = v; } });
      d.appendChild(ui.a2); d.appendChild(ui.b2); d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Puntaje: reactivos frente a productos', h: 190, note: 'El equilibrio se desplaza hacia el lado de mayor puntaje.', draw: function (cx, w, h, col) {
      var s = sums(), L = 20, B = 26, Tp = 14, ph = h - Tp - B, bw = (w - 2 * L) / 2, mx = Math.max(s.r, s.p, 1) * 1.1; cx.font = '11px system-ui'; cx.textAlign = 'center';
      [['Reactivos', s.r, '#74c0fc'], ['Productos', s.p, '#69db7c']].forEach(function (x, j) { var hh = ph * x[1] / mx; cx.fillStyle = x[2]; cx.fillRect(L + j * bw + 20, Tp + ph - hh, bw - 40, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 10); cx.fillText(fmt(x[1], 1), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }, { title: 'Radio iónico y dureza (cationes)', h: 200, note: 'Los blandos (naranja) tienden a ser más grandes y menos cargados.', draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph = h - Tp - B; Object.keys(AC).forEach(function (k) { var a = AC[k], x = L + pw * (a.r / 120), y = Tp + ph * (1 - a.q / 3.4); cx.fillStyle = CC[a.h]; cx.beginPath(); cx.arc(x, y, k === S.a ? 7 : 4.5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '9px system-ui'; cx.textAlign = 'center'; cx.fillText(a.n, x, y - 8); });
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('radio (pm) →', L + pw / 2, h - 8); cx.textAlign = 'right'; cx.fillText('carga', L - 4, Tp + 8);
    } }],
    calc: function () { var s = sums(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, nm = function (a, b) { return AC[a].n + '–' + BA[b].n; }; return '<div class="card-kicker">Puntaje cualitativo: 3 − 1,5·|Δdureza| + términos iónico (duro–duro) o covalente (blando–blando)</div><table class="calc-table">' + row(nm(S.a, S.b), fmt(score(S.a, S.b), 2)) + row(nm(S.a2, S.b2), fmt(score(S.a2, S.b2), 2)) + row(nm(S.a, S.b2), fmt(score(S.a, S.b2), 2)) + row(nm(S.a2, S.b), fmt(score(S.a2, S.b), 2)) + row('Σ reactivos', '<b>' + fmt(s.r, 2) + '</b>') + row('Σ productos', '<b>' + fmt(s.p, 2) + '</b>') + row('Predicción', '<b>' + (s.p > s.r + 0.2 ? 'se favorecen los productos' : (s.r > s.p + 0.2 ? 'se favorecen los reactivos' : 'equilibrio comparable')) + '</b>') + '</table>'; },
    quiz: [
      { q: 'Según HSAB, un ácido duro prefiere unirse a una base…', options: ['dura', 'blanda', 'cualquiera por igual', 'neutra'], answer: 0, why: 'Duro con duro y blando con blando.' },
      { q: 'Es un ácido blando…', options: ['Hg²⁺', 'Al³⁺', 'Mg²⁺', 'H⁺'], answer: 0, why: 'Grande, polarizable y de carga moderada.' },
      { q: 'La polarizabilidad es mayor en…', options: ['I⁻', 'F⁻', 'OH⁻', 'O²⁻'], answer: 0, why: 'Mayor tamaño, nube más deformable.' },
      { q: 'El mercurio aparece en la naturaleza principalmente como…', options: ['sulfuro (HgS)', 'óxido', 'silicato', 'fluoruro'], answer: 0, why: 'Hg²⁺ blando ↔ S²⁻ blando.' },
      { q: 'En Al³⁺ + F⁻ la unión es principalmente…', options: ['iónica', 'covalente apolar', 'metálica', 'de van der Waals'], answer: 0, why: 'Duro–duro: carga/radio alto.' },
      { q: 'HgS + Al₂O₃ ⇌ Hg y Al intercambiados (HgO + Al₂S₃) se desplaza hacia…', options: ['los reactivos', 'los productos', 'no hay preferencia', 'solo gas'], answer: 0, why: 'Los pares originales son duro–duro y blando–blando.' }
    ],
    help: { intro: 'Elige un ácido y una base: el tamaño de las esferas refleja el radio y la nube, la polarizabilidad. Más abajo está el intercambio entre dos pares.', items: [['Esferas', 'el tamaño refleja el radio y la nube translúcida, la polarizabilidad. Morado = duro, celeste = frontera, naranja = blando.'], ['Controles', '«Ácido (catión)» y «Base» forman un par; «Segundo ácido» y «Segunda base» plantean una reacción de intercambio.'], ['Gráficos', '«Puntaje: reactivos frente a productos» y «Radio iónico y dureza (cationes)».']], try: ['Combina Hg²⁺ con I⁻ y luego con F⁻: el ácido blando prefiere la base blanda.', 'Plantea un intercambio y predice hacia qué lado va antes de mirar el puntaje.', 'Compara Al³⁺ y Hg²⁺: pequeño y muy cargado (duro) frente a grande y polarizable (blando).'] }
  };
  MSim.create(def);
})();
