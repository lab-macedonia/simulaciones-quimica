/* Aromaticidad y regla de Hückel — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  // tipo: planar + cíclico + conjugado; ne = electrones π; el = elementos del anillo; kek = órdenes de enlace (Kekulé)
  var C = [
    { id: 'benceno', n: 'Benceno', f: 'C₆H₆', ring: 6, ne: 6, el: 'CCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Los seis enlaces C–C miden 1,39 Å (ni simples ni dobles). Energía de resonancia ≈ 150 kJ/mol: no se hidrogena ni se adiciona como un alqueno.' },
    { id: 'cb', n: 'Ciclobutadieno', f: 'C₄H₄', ring: 4, ne: 4, el: 'CCCC', kek: [2, 1, 2, 1], q: '', cls: 'anti', rect: true, note: '4n electrones π: antiaromático. Se distorsiona a rectángulo (1,34 y 1,57 Å) y es tan inestable que solo se aísla a muy baja temperatura.' },
    { id: 'cot', n: 'Ciclooctatetraeno (COT)', f: 'C₈H₈', ring: 8, ne: 8, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '', cls: 'non', tub: true, note: 'Tendría 8 e⁻ π: si fuera plano sería antiaromático. Se pliega en forma de bote y se comporta como cuatro dobles enlaces aislados.' },
    { id: 'cpm', n: 'Anión ciclopentadienilo', f: 'C₅H₅⁻', ring: 5, ne: 6, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁻', cls: 'aro', note: '6 e⁻ π en un anillo plano de 5 C: aromático. Explica la acidez del ciclopentadieno (pKa ≈ 16) y el ferroceno.' },
    { id: 'cpp', n: 'Catión ciclopentadienilo', f: 'C₅H₅⁺', ring: 5, ne: 4, el: 'CCCCC', kek: [2, 1, 2, 1, 1], q: '⁺', cls: 'anti', note: '4 e⁻ π: antiaromático, muy inestable (no se conoce como especie estable).' },
    { id: 'trop', n: 'Catión tropilio', f: 'C₇H₇⁺', ring: 7, ne: 6, el: 'CCCCCCC', kek: [2, 1, 2, 1, 2, 1, 1], q: '⁺', cls: 'aro', note: '6 e⁻ π en 7 C: aromático. Es tan estable que existe como sal (bromuro de tropilio).' },
    { id: 'cpr', n: 'Catión ciclopropenilo', f: 'C₃H₃⁺', ring: 3, ne: 2, el: 'CCC', kek: [2, 1, 1], q: '⁺', cls: 'aro', note: '2 e⁻ π (n = 0): el anillo aromático más pequeño; se prepara como sal estable.' },
    { id: 'cot2', n: 'Dianión de COT', f: 'C₈H₈²⁻', ring: 8, ne: 10, el: 'CCCCCCCC', kek: [2, 1, 2, 1, 2, 1, 2, 1], q: '²⁻', cls: 'aro', note: '10 e⁻ π: el anillo se aplana y es aromático (4n + 2 con n = 2). Se obtiene con K metálico.' },
    { id: 'pirrol', n: 'Pirrol', f: 'C₄H₅N', ring: 5, ne: 6, el: 'NCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', hs: { 0: 'NH' }, note: 'El par libre del N (en un orbital p) aporta 2 e⁻ al sistema π: 4 de los dos C=C + 2 = 6. Por eso el N del pirrol no es básico.' },
    { id: 'piridina', n: 'Piridina', f: 'C₅H₅N', ring: 6, ne: 6, el: 'NCCCCC', kek: [2, 1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Como el benceno: 6 e⁻ π. El par libre del N está en el plano (orbital sp²), fuera del sistema π: la piridina es básica (pKa del ion piridinio ≈ 5,2).' },
    { id: 'furano', n: 'Furano', f: 'C₄H₄O', ring: 5, ne: 6, el: 'OCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'aro', note: 'Un par del O aporta 2 e⁻ al sistema π (el otro par queda en el plano): 6 e⁻ π, aromático moderado.' },
    { id: 'cpd', n: 'Ciclopenta-1,3-dieno', f: 'C₅H₆', ring: 5, ne: 4, el: 'CCCCC', kek: [1, 2, 1, 2, 1], q: '', cls: 'non', sp3: true, note: 'El carbono sp³ (CH₂) interrumpe la conjugación: no es un sistema cíclico completamente conjugado, por lo tanto no es aromático.' }
  ];
  var CID = {}; C.forEach(function (c) { CID[c.id] = c; });
  var CLS = { aro: 'aromático', anti: 'antiaromático', non: 'no aromático' };
  var S = { cs: 'benceno', mo: 0, delo: true, si: 0, run: false, prog: 0 }, grp = null, key_ = '', lobes = [], tor = [], lab = {}, matB, matR;
  function ordr(n) { var ks = []; for (var k = 0; k < n; k++) ks.push(k); ks.sort(function (a, b) { var xa = 2 * Math.cos(2 * Math.PI * a / n), xb = 2 * Math.cos(2 * Math.PI * b / n); return Math.abs(xa - xb) < 1e-9 ? a - b : xb - xa; }); return ks; }
  function xk(n, k) { return 2 * Math.cos(2 * Math.PI * k / n); }
  function occ(n, ne) { var o = ordr(n), res = {}, left = ne, i = 0; while (i < n) { var j = i; while (j < n && Math.abs(xk(n, o[j]) - xk(n, o[i])) < 1e-9) j++; var g = j - i, take = Math.min(left, 2 * g), base = Math.floor(take / g), extra = take - base * g; for (var q = i; q < j; q++) res[o[q]] = base + ((q - i) < extra ? 1 : 0); left -= take; i = j; } return res; }
  function coef(n, k) { var c = []; for (var j = 0; j < n; j++) { if (2 * k === n) c.push(j % 2 ? -1 : 1); else if (k === 0) c.push(1); else if (2 * k < n) c.push(Math.cos(2 * Math.PI * k * j / n)); else c.push(Math.sin(2 * Math.PI * (n - k) * j / n) * 1.0); } return c; }
  function energy(c) { var n = c.ring, o = occ(n, c.ne), s = 0; for (var k = 0; k < n; k++) s += (o[k] || 0) * xk(n, k); return s; }
  function lin(c) { var e = 0, left = c.ne; for (var m = 1; m <= c.ring; m++) { var t = Math.min(2, left); e += t * 2 * Math.cos(m * Math.PI / (c.ring + 1)); left -= t; } return e; }
  function de(c) { return energy(c) - lin(c); }
  function huckel(c) { var m = c.ne - 2; return m % 4 === 0 ? '4n + 2 (n = ' + (m / 4) + ')' : (c.ne % 4 === 0 ? '4n (n = ' + (c.ne / 4) + ')' : '—'); }
  function geo(c) {
    var n = c.ring, A = [], B = [], R = 1.4 / (2 * Math.sin(Math.PI / n)), i;
    for (i = 0; i < n; i++) {
      var th = 2 * Math.PI * i / n - Math.PI / 2, x = R * Math.cos(th), z = R * Math.sin(th), y = 0;
      if (c.rect) { var sx = (i === 0 || i === 3) ? -1 : 1, sz = (i < 2) ? -1 : 1; x = sx * 0.78; z = sz * 0.67; if (i === 1) { x = 0.78; z = -0.67; } if (i === 2) { x = 0.78; z = 0.67; } if (i === 3) { x = -0.78; z = 0.67; } if (i === 0) { x = -0.78; z = -0.67; } }
      if (c.tub) { R = 1.46 / (2 * Math.sin(Math.PI / n)) * 0.9; x = R * Math.cos(th); z = R * Math.sin(th); y = [0.55, 0.55, -0.55, -0.55, 0.55, 0.55, -0.55, -0.55][i]; }
      A.push([c.el[i], x, y, z]);
    }
    for (i = 0; i < n; i++) { var j = (i + 1) % n, ord = (c.cls === 'aro' && S.delo) ? 1 : c.kek[i]; B.push([i, j, ord]); }
    for (i = 0; i < n; i++) {
      var a = A[i]; if (c.el[i] === 'O' || (c.el[i] === 'N' && !(c.hs && c.hs[i]))) continue; var r = Math.sqrt(a[1] * a[1] + a[3] * a[3]) || 1, dx = a[1] / r, dz = a[3] / r;
      if (c.sp3 && i === 0) { A.push(['H', a[1] + dx * 0.6, a[2] + 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); A.push(['H', a[1] + dx * 0.6, a[2] - 0.9, a[3] + dz * 0.6]); B.push([i, A.length - 1, 1]); continue; }
      var L = c.el[i] === 'N' ? 1.01 : 1.09; A.push(['H', a[1] + dx * L, a[2] * 1.1, a[3] + dz * L]); B.push([i, A.length - 1, 1]);
    }
    return { a: A, b: B, R: R };
  }
  function rebuild(ctx) {
    var c = CID[S.cs]; if (grp) ctx.scene.remove(grp); grp = new T.Group(); var g = geo(c); grp.add(ctx.mol(g, { gs: 1, ar: 0.5, bw: 1.2 })); lobes = []; tor = [];
    var sg = new T.SphereGeometry(1, 16, 12);
    for (var i = 0; i < c.ring; i++) { var a = g.a[i]; for (var s = 0; s < 2; s++) { var m = new T.Mesh(sg, matB); m.position.set(a[1], a[2] + (s ? -0.85 : 0.85), a[3]); m.userData = { i: i, s: s, y0: a[2] }; grp.add(m); lobes.push(m); } }
    var rr = Math.max(0.9, g.R); for (var u = 0; u < 2; u++) { var t = new T.Mesh(new T.TorusGeometry(rr, 0.16, 10, 48), new T.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.y = u ? -0.85 : 0.85; grp.add(t); tor.push(t); }
    ctx.scene.add(grp); key_ = S.cs + '|' + S.delo; S.mo = Math.min(S.mo, c.ring - 1);
  }
  function stages() {
    return [
      ['Los cuatro criterios', 'Criterios', 'Cíclica, plana, totalmente conjugada y con 4n + 2 electrones π',
        '<p>Un compuesto es <b>aromático</b> si es <b>cíclico, plano, con un orbital p en cada átomo del anillo (conjugación completa)</b> y tiene <b>4n + 2 electrones π</b> (2, 6, 10, 14…). Si cumple lo demás pero tiene <b>4n e⁻ π</b> (4, 8, 12…) es <b>antiaromático</b> (desestabilizado); si falla alguno de los criterios estructurales es <b>no aromático</b>.</p>'],
      ['El benceno', 'Benceno', 'Seis electrones π deslocalizados sobre todo el anillo',
        '<p>En el <b>benceno</b> los seis orbitales p solapan en dos nubes (toroides) por encima y por debajo del plano: los electrones π no pertenecen a tres dobles enlaces, sino a todo el anillo. Los seis enlaces C–C son iguales (1,39 Å). Cambia entre <b>Kekulé</b> (localizado) y <b>deslocalizado</b> en «Lab» y ve cómo el modelo clásico es solo una de las formas resonantes.</p>'],
      ['Orbitales moleculares π', 'Orbitales π', 'Los n orbitales p dan n OM: energías α + 2β·cos(2πk/n)',
        '<p>Los n orbitales p de un anillo forman n orbitales moleculares con energías <b>E<sub>k</sub> = α + 2β cos(2πk/n)</b>. El <b>círculo de Frost</b> los reúne: un polígono con un vértice abajo inscrito en un círculo de radio 2|β|. Para el benceno: un OM de menor energía, dos degenerados, dos degenerados y uno de mayor energía. Los 6 e⁻ llenan justo los tres OM enlazantes: <b>capa cerrada</b>. Los lóbulos azules y rojos son las fases del OM que se elige.</p>'],
      ['Antiaromaticidad', 'Antiaromáticos', 'Con 4n electrones π quedan electrones desapareados',
        '<p>Con <b>4 e⁻ π</b> (ciclobutadieno) o <b>8 e⁻ π</b> (COT plano) los dos últimos electrones ocupan dos OM <b>degenerados no enlazantes</b>: <b>capa abierta</b>, desapareados y muy reactivos. La molécula escapa de la antiaromaticidad <b>distorsionándose</b>: el ciclobutadieno se hace rectangular y el COT se pliega en forma de bote (no aromático).</p>'],
      ['Iones aromáticos', 'Iones', 'Un anillo con carga también puede ser aromático',
        '<p>El <b>anión ciclopentadienilo</b> (6 e⁻), el <b>catión tropilio</b> (6 e⁻), el <b>catión ciclopropenilo</b> (2 e⁻) y el <b>dianión del COT</b> (10 e⁻) cumplen 4n + 2. Explican por qué el <b>ciclopentadieno</b> tiene un pKa de ≈ 16 (muy ácido para un hidrocarburo) y por qué el bromuro de tropilio es una sal estable.</p>'],
      ['Heterociclos', 'Heterociclos', 'El heteroátomo aporta 0 o 2 electrones al sistema π',
        '<p>En el <b>pirrol</b> y el <b>furano</b> un par libre del heteroátomo está en un orbital p y <b>aporta 2 e⁻</b> al sexteto: 4 + 2 = 6. En la <b>piridina</b>, el par del N está en el plano (sp²) y <b>no cuenta</b>: los 6 e⁻ son de los tres C=C y el N conserva su basicidad. Por eso el pirrol no es básico y la piridina sí.</p>']
    ];
  }
  var LESSON = [['benceno', 'cb', 'cpd', 'benceno'], ['benceno'], ['benceno', 'trop'], ['cb', 'cot', 'cpp'], ['cpm', 'trop', 'cpr', 'cot2'], ['pirrol', 'piridina', 'furano']];
  var def = {
    key: 'aromaticidad-huckel', title: 'Aromaticidad y regla de Hückel', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 6, 11], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 14, 0.5], target: [0, 0, 0] }, { id: 'lado', label: 'Lateral', pos: [0, 0.5, 13], target: [0, 0, 0] }],
    layers: [{ id: 'orb', label: 'Orbital π elegido', icon: '☁' }, { id: 'tor', label: 'Nube π (toroides)', icon: '◯' }, { id: 'spin', label: 'Giro', icon: '⟳' }],
    build: function (ctx) { matB = new T.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.55, depthWrite: false }); matR = new T.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: 0.55, depthWrite: false }); ['t', 'a', 'b'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); }); rebuild(ctx); },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) { var l = LESSON[f.i], ix = Math.min(l.length - 1, Math.floor(f.local * l.length)); if (S._st !== f.i || S._ix !== ix) { S._st = f.i; S._ix = ix; S.cs = l[ix]; S.delo = f.i !== 1 || f.local > 0.4; S.mo = 0; } if (f.i === 2) { S.mo = Math.min(CID[S.cs].ring - 1, Math.floor(f.local * 2 % 1 * CID[S.cs].ring)); } }
      if (S.cs + '|' + S.delo !== key_) rebuild(ctx);
      var c = CID[S.cs], n = c.ring, o = ordr(n), k = o[Math.min(S.mo, n - 1)], cf = coef(n, k), orb = ctx.layer('orb'), tr = ctx.layer('tor');
      if (ctx.layer('spin')) grp.rotation.y += dt * 0.3;
      lobes.forEach(function (m) { var u = m.userData, cc = c.cls === 'non' ? (u.i % 2 ? 0 : 0) : cf[u.i], s = Math.abs(cc), sign = (cc >= 0 ? 1 : -1) * (u.s ? -1 : 1); if (c.tub || c.sp3) { m.visible = false; return; } m.visible = orb && s > 0.02; m.material = sign > 0 ? matB : matR; m.scale.set(0.55 * Math.max(0.15, s), 0.8 * Math.max(0.15, s), 0.55 * Math.max(0.15, s)); m.position.y = u.y0 + (u.s ? -1 : 1) * (0.2 + 0.7 * Math.max(0.15, s)); });
      tor.forEach(function (t) { t.visible = tr && c.cls === 'aro' && S.delo; });
      lab.t.pos(0, 3.3, 0).set(c.n + ' · ' + c.f + (c.q ? '' : ''), 'bl-lead').vis(true); lab.a.pos(0, -3.0, 0).set(c.ne + ' e⁻ π · ' + huckel(c) + ' · ' + CLS[c.cls], c.cls === 'aro' ? 'bl-neg' : (c.cls === 'anti' ? 'bl-warn' : 'bl-d')).vis(true);
      lab.b.pos(0, -3.9, 0).set('OM ' + (Math.min(S.mo, n - 1) + 1) + ' de ' + n + ' · E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β', 'bl-d').vis(orb && !c.tub && !c.sp3);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo) u.mo.set(S.mo); },
    hud: function () { var c = CID[S.cs]; return { eq: { chip: 'Hückel', name: c.n + ' · ' + c.f, body: '<div class="eqline"><small>Electrones π</small>' + c.ne + ' (' + huckel(c) + ')</div><div class="eqline"><small>Clasificación</small>' + CLS[c.cls] + '</div><div class="eqline"><small>Ciclación frente a cadena abierta</small>' + f2(de(c)) + ' β (+ estabiliza, − desestabiliza)</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'fase + del orbital p' }, { label: 'Rojo', color: '#ff6b5e', text: 'fase −' }, { label: 'Morado', color: '#c084fc', text: 'nube π deslocalizada' }] }; },
    measures: function () { var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n); var homo = -9, lumo = 9; od.forEach(function (k) { var x = xk(n, k); if ((o[k] || 0) > 0) homo = Math.max(-9, homo === -9 ? x : Math.min(homo, x)); else lumo = Math.min(lumo, x); }); var open = od.some(function (k) { var v = o[k] || 0; return v === 1; }); return [['Compuesto', c.n], ['Anillo', n + ' átomos'], ['Electrones π', String(c.ne)], ['Regla', huckel(c)], ['Clasificación', CLS[c.cls]], ['Capa', open ? 'abierta (desapareados)' : 'cerrada'], ['Energía π', f2(energy(c)) + ' |β|'], ['E. frente a cadena abierta', f2(de(c)) + ' |β|']]; },
    ideas: ['Aromático: <b>cíclico, plano, conjugado y 4n + 2 e⁻ π</b>.', 'Con <b>4n e⁻ π</b> y planar: antiaromático (capa abierta); la molécula se distorsiona para escapar.', 'El heteroátomo aporta 2 e⁻ si su par está en un orbital p (pirrol, furano) y 0 si está en el plano (piridina).', 'Círculo de Frost: E<sub>k</sub> = α + 2β cos(2πk/n).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sistema π'); el.appendChild(c);
      ui.cs = kit.ui.options({ label: 'Compuesto', cols: 3, value: S.cs, options: C.map(function (x) { return { v: x.id, label: x.n.replace('Ciclooctatetraeno (COT)', 'COT').replace('Catión ', 'Catión ').replace('Anión ciclopentadienilo', 'Cp⁻').replace('Catión ciclopentadienilo', 'Cp⁺').replace('Ciclopenta-1,3-dieno', 'Ciclopentadieno').replace('Dianión de COT', 'COT²⁻'), sub: x.ne + ' e⁻ · ' + CLS[x.cls] }; }), onChange: function (v) { ctx.goManual(); S.cs = v; S.mo = 0; } }); c.appendChild(ui.cs);
      ui.mo = kit.ui.slider({ label: 'Orbital π (de menor a mayor energía)', min: 0, max: 7, step: 1, value: S.mo, format: function (v) { return String(v + 1); }, onInput: function (v) { ctx.goManual(); S.mo = Math.min(v, CID[S.cs].ring - 1); } }); c.appendChild(kit.ui.sliders([ui.mo]));
      ui.dl = kit.ui.seg([{ v: 'd', label: 'Deslocalizado' }, { v: 'k', label: 'Kekulé' }], S.delo ? 'd' : 'k', function (v) { ctx.goManual(); S.delo = v === 'd'; }); var r = document.createElement('div'); r.className = 'row'; r.appendChild(ui.dl); c.appendChild(r);
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      var t = kit.ui.card('Qué observar'); el.appendChild(t); var p = document.createElement('p'); p.className = 'muted small'; t.appendChild(p); ui.tip = p; ui.refresh = function () { if (ui._k !== S.cs) { ui._k = S.cs; p.innerHTML = CID[S.cs].note; } };
    },
    graphs: [
      { title: 'Círculo de Frost y llenado de orbitales', h: 270, note: 'Cada vértice es un OM π; la altura indica su energía (abajo = enlazante). Flechas: electrones. El OM elegido se resalta.', draw: function (cx, w, h, col) {
        var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), mk = od[Math.min(S.mo, n - 1)], r = Math.min(w / 2 - 34, h / 2 - 28), cx0 = w / 2, cy0 = h / 2;
        cx.strokeStyle = col.line; cx.lineWidth = 1; cx.beginPath(); cx.arc(cx0, cy0, r, 0, 7); cx.stroke(); cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(cx0 - r - 10, cy0); cx.lineTo(cx0 + r + 10, cy0); cx.stroke(); cx.setLineDash([]); cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'left'; cx.fillText('α (no enlazante)', cx0 + r + 8 > w - 80 ? 4 : cx0 + r + 6, cy0 - 3);
        cx.strokeStyle = col.muted; cx.beginPath(); for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n, X = cx0 + r * Math.sin(ang), Y = cy0 + r * Math.cos(ang); if (k === 0) cx.moveTo(X, Y); else cx.lineTo(X, Y); } cx.closePath(); cx.stroke();
        for (k = 0; k < n; k++) { var an = 2 * Math.PI * k / n, X2 = cx0 + r * Math.sin(an), Y2 = cy0 + r * Math.cos(an), e = o[k] || 0, sel = k === mk; cx.strokeStyle = sel ? '#f472b6' : col.ink; cx.lineWidth = sel ? 3.2 : 2; cx.beginPath(); cx.moveTo(X2 - 15, Y2); cx.lineTo(X2 + 15, Y2); cx.stroke(); cx.lineWidth = 1; cx.font = 'bold 14px system-ui'; cx.textAlign = 'center'; if (e >= 1) { cx.fillStyle = '#4dabf7'; cx.fillText('↑', X2 - 5, Y2 - 3); } if (e === 2) { cx.fillStyle = '#ff9f43'; cx.fillText('↓', X2 + 5, Y2 - 3); } }
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('antienlazante', cx0, 12); cx.fillText('enlazante', cx0, h - 4);
      } },
      { title: 'Estabilización por ciclación (|β|)', h: 250, note: 'E(anillo) − E(polieno abierto con los mismos átomos y electrones). Positivo: aromático; negativo: antiaromático. (El COT plano tiene capa abierta y se pliega.)', draw: function (cx, w, h, col) {
        var arr = C.filter(function (c) { return c.cls !== 'non'; }), L = 98, R = 40, Tp = 8, B = 10, rh = (h - Tp - B) / arr.length, pw = w - L - R, lo = -1, hi = 1.6, zx = L + pw * (0 - lo) / (hi - lo); cx.font = '10px system-ui';
        cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(zx, Tp); cx.lineTo(zx, h - B); cx.stroke();
        arr.forEach(function (c, i) { var y = Tp + i * rh, v = de(c), sel = c.id === S.cs, x1 = L + pw * (Math.min(0, v) - lo) / (hi - lo), x2 = L + pw * (Math.max(0, v) - lo) / (hi - lo); cx.fillStyle = sel ? '#f472b6' : (c.cls === 'aro' ? '#51cf66' : '#ff8787'); cx.fillRect(x1, y + 3, Math.max(2, x2 - x1), rh - 6); cx.fillStyle = sel ? col.ink : col.muted; cx.textAlign = 'right'; cx.fillText(c.n.replace('Anión ciclopentadienilo', 'Cp⁻').replace('Catión ciclopentadienilo', 'Cp⁺').replace('Catión ', '').replace('Dianión de COT', 'COT²⁻'), L - 5, y + rh / 2 + 3); cx.textAlign = 'left'; cx.fillText(f2(v), (v >= 0 ? x2 : x1) + (v >= 0 ? 4 : -34), y + rh / 2 + 3); });
      } }
    ],
    calc: function () {
      var c = CID[S.cs], n = c.ring, o = occ(n, c.ne), od = ordr(n), row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, rows = od.map(function (k) { return row('OM ' + (od.indexOf(k) + 1), 'E = α ' + (xk(n, k) >= 0 ? '+ ' : '− ') + f2(Math.abs(xk(n, k))) + 'β · ' + (o[k] || 0) + ' e⁻'); }).join('');
      return '<div class="card-kicker">' + c.n + ' · ' + c.f + '</div><div class="calc-step">1 · Conteo de electrones π</div><table class="calc-table">' + row('Electrones π', '<b>' + c.ne + '</b>') + row('Regla', huckel(c)) + row('Estructura', c.sp3 ? 'interrumpida por un C sp³' : (c.tub ? 'no plana (bote)' : 'plana, conjugada')) + row('Clasificación', '<b>' + CLS[c.cls] + '</b>') + '</table><div class="calc-step">2 · Orbitales moleculares (Hückel)</div><table class="calc-table">' + rows + '</table>' +
        '<div class="calc-step">3 · Comparación con el polieno abierto</div><table class="calc-table">' + row('E<sub>π</sub> (anillo)', c.ne + 'α + ' + f2(energy(c)) + 'β') + row('E<sub>π</sub> (cadena abierta de ' + n + ' C)', c.ne + 'α + ' + f2(lin(c)) + 'β') + row('Diferencia', '<b>' + f2(de(c)) + ' |β|</b>' + (de(c) > 0.05 ? ' (el anillo estabiliza)' : ' (el anillo desestabiliza)')) + '</table>';
    },
    quiz: [
      { q: '¿Cuál de estos cumple la regla de Hückel (4n + 2)?', options: ['Benceno (6 e⁻ π)', 'Ciclobutadieno (4 e⁻ π)', 'Ciclooctatetraeno plano (8 e⁻ π)', 'Catión ciclopentadienilo (4 e⁻ π)'], answer: 0, why: '6 = 4(1) + 2.' },
      { q: '¿Por qué el ciclobutadieno es antiaromático?', options: ['Es plano y cíclico con 4 e⁻ π (4n)', 'No es plano', 'No tiene dobles enlaces', 'Tiene demasiados electrones'], answer: 0, why: 'Con 4n e⁻ π hay dos electrones desapareados en OM degenerados no enlazantes.' },
      { q: '¿Por qué el ciclooctatetraeno no es aromático?', options: ['Se pliega en forma de bote para evitar la antiaromaticidad', 'Tiene 6 e⁻ π', 'No tiene carbonos sp²', 'Es demasiado pequeño'], answer: 0, why: 'Con 8 e⁻ π un COT plano sería antiaromático; se distorsiona y no hay conjugación cíclica completa.' },
      { q: '¿Cuántos e⁻ π tiene el anión ciclopentadienilo?', options: ['6', '4', '5', '8'], answer: 0, why: '4 de los dos C=C + 2 del par libre del carbanión = 6: aromático.' },
      { q: '¿Por qué el pirrol no es básico mientras que la piridina sí?', options: ['En el pirrol el par del N forma parte del sexteto π; en la piridina está en el plano', 'La piridina tiene más átomos de carbono', 'El pirrol tiene un N con carga positiva', 'La piridina no es aromática'], answer: 0, why: 'Protonar el N del pirrol destruiría el sexteto aromático; el par de la piridina (sp²) no participa.' },
      { q: '¿Qué molécula es aromática?', options: ['Catión tropilio (C₇H₇⁺)', 'Catión ciclopentadienilo (C₅H₅⁺)', 'Ciclopenta-1,3-dieno', 'Ciclobutadieno'], answer: 0, why: 'El tropilio tiene 6 e⁻ π en un anillo plano y totalmente conjugado.' },
      { q: 'En el círculo de Frost del benceno, ¿cuántos OM π enlazantes hay?', options: ['3', '2', '6', '1'], answer: 0, why: 'Hay un OM de menor energía y dos degenerados, enlazantes; los 6 e⁻ los llenan.' },
      { q: 'Explica la acidez del ciclopentadieno (pKa ≈ 16):', options: ['Su base conjugada es aromática (6 e⁻ π)', 'Tiene un grupo OH', 'Es un ácido carboxílico', 'Pierde un protón vinílico'], answer: 0, why: 'La desprotonación del CH₂ genera el anión ciclopentadienilo, aromático y muy estabilizado.' }
    ],
    help: { intro: 'Elige un compuesto en «Lab» o sigue la lección. Los lóbulos azules/rojos son las fases del orbital π elegido; los toroides morados, la nube π deslocalizada.', items: [['Orbital π', 'el control elige un OM entre los n posibles.'], ['Kekulé / Deslocalizado', 'compara el modelo clásico con la nube π.'], ['Círculo de Frost', 'energías y llenado en «Gráficos».'], ['Cálculo', 'regla de Hückel y energía de deslocalización.'], ['Controles', '«Compuesto» y «Orbital π (de menor a mayor energía)»; «Deslocalizado» o «Kekulé» cambia el modelo.']], try: ['Compara un compuesto con 4n + 2 electrones π y otro con 4n en el círculo de Frost.', 'Recorre los orbitales π de menor a mayor energía: aumenta el número de nodos.', 'Compara pirrol y piridina: sólo en el pirrol el par del N forma parte del sistema π.'] }
  };
  def.sync = function (ctx) { var u = ctx.ui; if (u.cs) u.cs.set(S.cs); if (u.mo && !ctx.P.manual) u.mo.set(S.mo); if (u.refresh) u.refresh(); };
  MSim.create(def);
})();
