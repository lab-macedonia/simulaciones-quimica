/* Simetría molecular y grupos puntuales — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  function ring(n, r, z, el, off) { var a = []; for (var k = 0; k < n; k++) { var t = (off || 0) + k * 2 * Math.PI / n; a.push([el, r * Math.cos(t), r * Math.sin(t), z]); } return a; }
  var Z = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0], D = Math.PI / 180, r3 = Math.sqrt(3) / 2;
  var MOL = {
    h2o: { n: 'Agua', f: 'H₂O', g: 'C₂v', a: [['O', 0, 0, 0.12], ['H', 0.76, 0, -0.47], ['H', -0.76, 0, -0.47]], b: [[0, 1], [0, 2]], po: true, ch: false, lin: false, cn: 'C₂', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₂(z)', 'C', Z, 180], ['σv(xz)', 's', Y], ['σv′(yz)', 's', X]] },
    nh3: { n: 'Amoníaco', f: 'NH₃', g: 'C₃v', a: [['N', 0, 0, 0.3]].concat(ring(3, 0.95, -0.1, 'H', 0)), b: [[0, 1], [0, 2], [0, 3]], po: true, ch: false, lin: false, cn: 'C₃', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(z)', 'C', Z, 120], ['C₃²(z)', 'C', Z, 240], ['σv(xz)', 's', Y], ['σv′', 's', [-r3, -0.5, 0].map(function (v, i) { return i === 0 ? r3 : (i === 1 ? -0.5 : 0); })], ['σv″', 's', [r3, 0.5, 0]]] },
    ch4: { n: 'Metano', f: 'CH₄', g: 'Td', a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', 0.63, -0.63, -0.63], ['H', -0.63, 0.63, -0.63], ['H', -0.63, -0.63, 0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], po: false, ch: false, lin: false, cn: 'C₃ (×4)', c2p: true, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(1,1,1)', 'C', [1, 1, 1], 120], ['C₂(z)', 'C', Z, 180], ['S₄(z)', 'S', Z, 90], ['σd(x=y)', 's', [1, -1, 0]]] },
    bf3: { n: 'Trifluoruro de boro', f: 'BF₃', g: 'D₃h', a: [['B', 0, 0, 0]].concat(ring(3, 1.3, 0, 'F', 0)), b: [[0, 1], [0, 2], [0, 3]], po: false, ch: false, lin: false, cn: 'C₃', c2p: true, sh: true, sv: true, inv: false,
      ops: [['E', 'E'], ['C₃(z)', 'C', Z, 120], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['S₃(z)', 'S', Z, 120]] },
    sf6: { n: 'Hexafluoruro de azufre', f: 'SF₆', g: 'Oh', a: [['S', 0, 0, 0], ['F', 1.56, 0, 0], ['F', -1.56, 0, 0], ['F', 0, 1.56, 0], ['F', 0, -1.56, 0], ['F', 0, 0, 1.56], ['F', 0, 0, -1.56]], b: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]], po: false, ch: false, lin: false, cn: 'C₄', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C₄(z)', 'C', Z, 90], ['C₃(1,1,1)', 'C', [1, 1, 1], 120], ['C₂(1,1,0)', 'C', [1, 1, 0], 180], ['σh(xy)', 's', Z], ['σd(x=y)', 's', [1, -1, 0]], ['i', 'i'], ['S₄(z)', 'S', Z, 90]] },
    co2: { n: 'Dióxido de carbono', f: 'CO₂', g: 'D∞h', a: [['C', 0, 0, 0], ['O', 0, 0, 1.16], ['O', 0, 0, -1.16]], b: [[0, 1, 2], [0, 2, 2]], po: false, ch: false, lin: true, cn: 'C∞', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C∞(z) 60°', 'C', Z, 60], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['i', 'i']] },
    hcl: { n: 'Cloruro de hidrógeno', f: 'HCl', g: 'C∞v', a: [['Cl', 0, 0, -0.64], ['H', 0, 0, 0.64]], b: [[0, 1]], po: true, ch: false, lin: true, cn: 'C∞', c2p: false, sh: false, sv: true, inv: false,
      ops: [['E', 'E'], ['C∞(z) 60°', 'C', Z, 60], ['σv(xz)', 's', Y]] },
    tdce: { n: 'trans-1,2-Dicloroeteno', f: 'C₂H₂Cl₂', g: 'C₂h', a: [['C', -0.67, 0, 0], ['C', 0.67, 0, 0], ['Cl', -1.45, 1.4, 0], ['H', -1.2, -0.95, 0], ['Cl', 1.45, -1.4, 0], ['H', 1.2, 0.95, 0]], b: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]], po: false, ch: false, lin: false, cn: 'C₂', c2p: false, sh: true, sv: false, inv: true,
      ops: [['E', 'E'], ['C₂(z)', 'C', Z, 180], ['σh(xy)', 's', Z], ['i', 'i']] },
    c6h6: { n: 'Benceno', f: 'C₆H₆', g: 'D₆h', a: ring(6, 1.4, 0, 'C', 0).concat(ring(6, 2.48, 0, 'H', 0)), b: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5, 2], [5, 0], [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]], po: false, ch: false, lin: false, cn: 'C₆', c2p: true, sh: true, sv: true, inv: true,
      ops: [['E', 'E'], ['C₆(z)', 'C', Z, 60], ['C₂(x)', 'C', X, 180], ['σh(xy)', 's', Z], ['σv(xz)', 's', Y], ['i', 'i']] },
    chfclbr: { n: 'CHFClBr (quiral)', f: 'CHFClBr', g: 'C₁', a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['F', 0.9, -0.9, -0.9], ['Cl', -1.2, 1.2, -1.2], ['Br', -1.4, -1.4, 1.4]], b: [[0, 1], [0, 2], [0, 3], [0, 4]], po: true, ch: true, lin: false, cn: '—', c2p: false, sh: false, sv: false, inv: false,
      ops: [['E', 'E']] }
  };
  var KEYS = Object.keys(MOL);
  var S = { m: 'h2o', o: 0, run: -1, uT: 0 }, g = null, mg = null, gg = null, axis = null, plane = null, lab = [], key = '', gmat = null;
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function opMatrix(op) {
    var M = new T.Matrix4(); if (op[1] === 'E') return M;
    if (op[1] === 'i') return M.makeScale(-1, -1, -1);
    var n = norm(op[2] || Z), v = new T.Vector3(n[0], n[1], n[2]), R = new T.Matrix4(), P = new T.Matrix4();
    if (op[1] === 'C') return M.makeRotationAxis(v, op[3] * D);
    var refl = function (m) { var a = v.x, b = v.y, c = v.z; m.set(1 - 2 * a * a, -2 * a * b, -2 * a * c, 0, -2 * a * b, 1 - 2 * b * b, -2 * b * c, 0, -2 * a * c, -2 * b * c, 1 - 2 * c * c, 0, 0, 0, 0, 1); return m; };
    if (op[1] === 's') return refl(M);
    R.makeRotationAxis(v, op[3] * D); P = refl(new T.Matrix4()); return P.multiply(R);
  }
  function applyOp(M, p) { return new T.Vector3(p[1], p[2], p[3]).applyMatrix4(M); }
  function valid(m, op) { var M = opMatrix(op), ok = true; m.a.forEach(function (at) { var q = applyOp(M, at), found = false; m.a.forEach(function (b) { if (b[0] === at[0] && Math.hypot(b[1] - q.x, b[2] - q.y, b[3] - q.z) < 0.05) found = true; }); if (!found) ok = false; }); return ok; }
  function stages() {
    return [
      ['Operaciones y elementos', 'Operaciones', 'E, Cₙ, σ, i y Sₙ: operación y elemento de simetría',
        '<p>Una <b>operación de simetría</b> deja la molécula en una posición indistinguible de la inicial; el <b>elemento de simetría</b> es el eje, plano o punto respecto del cual se realiza. Las operaciones son: la <b>identidad E</b>, la <b>rotación propia C<sub>n</sub></b> (360°/n), la <b>reflexión σ</b> en un plano, la <b>inversión i</b> por el centro y la <b>rotación impropia S<sub>n</sub></b> (rotación 360°/n seguida de reflexión en el plano perpendicular). Aquí se aplican al agua.</p>'],
      ['Grupos puntuales', 'Grupos', 'El conjunto de operaciones forma el grupo puntual',
        '<p>El conjunto de todas las operaciones de una molécula es su <b>grupo puntual</b>: H₂O es <b>C₂v</b>, NH₃ <b>C₃v</b>, CH₄ <b>T<sub>d</sub></b>, BF₃ <b>D₃h</b>, SF₆ <b>O<sub>h</sub></b>, CO₂ <b>D<sub>∞h</sub></b>. Recorre las moléculas y comprueba qué operaciones la dejan invariante: el simulador verifica que cada átomo cae sobre otro igual.</p>'],
      ['Asignar el grupo', 'Asignar', 'Diagrama de decisión: lineal → alta simetría → Cₙ → C₂ ⟂ → σ',
        '<p>Para <b>asignar el grupo</b>: 1) ¿es lineal? (D<sub>∞h</sub> si tiene i; C<sub>∞v</sub> si no). 2) ¿tiene simetría alta (varios C<sub>n</sub> con n ≥ 3: T<sub>d</sub>, O<sub>h</sub>)? 3) Busca el <b>eje principal C<sub>n</sub></b>. 4) ¿Hay n ejes C₂ perpendiculares? (D). 5) Planos: σh (D<sub>nh</sub>, C<sub>nh</sub>), σv (C<sub>nv</sub>). La pestaña «Cálculo» recorre el diagrama para la molécula elegida.</p>'],
      ['Polaridad y quiralidad', 'Propiedades', 'Polar: C₁, Cₛ, Cₙ, Cₙv · Quiral: sin eje impropio (C₁, Cₙ, Dₙ)',
        '<p>La simetría predice propiedades. Una molécula puede tener <b>momento dipolar</b> sólo si pertenece a <b>C₁, C<sub>s</sub>, C<sub>n</sub> o C<sub>nv</sub></b> (H₂O, NH₃, HCl). Es <b>quiral</b> si carece de eje impropio S<sub>n</sub> (incluidos σ e i): grupos <b>C₁, C<sub>n</sub> y D<sub>n</sub></b>. CHFClBr es C₁: quiral. SF₆ y CH₄ tienen muchos elementos y no son polares.</p>']
    ];
  }
  function polar(m) { return m.po ? 'sí' : 'no'; }
  var def = {
    key: 'simetria-grupos-puntuales', title: 'Simetría molecular y grupos puntuales', subtitle: 'Simulador 3D · química inorgánica', accent: { dark: '#3bc9db', light: '#0b7285' },
    stages: stages, nStages: 4, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [16, 6, 18], target: [16, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [16, 0, 22], target: [16, 0, 0] }],
    layers: [{ id: 'el', label: 'Elemento', icon: '⟂' }, { id: 'ghost', label: 'Imagen', icon: '◌' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(21, 0, 0); ctx.scene.add(g); mg = new T.Group(); g.add(mg); gg = new T.Group(); gg.matrixAutoUpdate = false; g.add(gg);
      axis = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 8), new T.MeshBasicMaterial({ color: 0xffd43b })); g.add(axis);
      plane = new T.Mesh(new T.CircleGeometry(5, 32), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.28, side: T.DoubleSide, depthWrite: false })); g.add(plane);
      gmat = new T.MeshStandardMaterial({ color: 0xff922b, transparent: true, opacity: 0.45 });
      for (var i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.m = 'h2o'; S.o = Math.min(3, Math.floor(f.local * 4)); S.uT = (f.local * 4) % 1; } if (i === 1) { var ks = ['h2o', 'nh3', 'ch4', 'bf3', 'sf6', 'co2', 'hcl']; var q = Math.min(ks.length - 1, Math.floor(f.local * ks.length)); S.m = ks[q]; S.o = Math.min(MOL[S.m].ops.length - 1, 1 + Math.floor(((f.local * ks.length) % 1) * (MOL[S.m].ops.length - 1))); S.uT = (f.local * ks.length * 2) % 1; } if (i === 2) { var k2 = ['tdce', 'c6h6', 'sf6', 'nh3'], q2 = Math.min(3, Math.floor(f.local * 4)); S.m = k2[q2]; S.o = 1; S.uT = (f.local * 8) % 1; } if (i === 3) { var k3 = ['chfclbr', 'h2o', 'ch4', 'co2'], q3 = Math.min(3, Math.floor(f.local * 4)); S.m = k3[q3]; S.o = Math.min(1, MOL[S.m].ops.length - 1); S.uT = (f.local * 8) % 1; } }
      else if (S.run >= 0) { S.uT += dt * 0.6; if (S.uT >= 1) { S.uT = 1; S.run = -1; } }
      var m = MOL[S.m]; if (S.o >= m.ops.length) S.o = 0;
      if (key !== S.m) { key = S.m; while (mg.children.length) mg.remove(mg.children[0]); while (gg.children.length) gg.remove(gg.children[0]); mg.add(ctx.mol(m, { gs: 3.6, ar: 1.3 })); gg.add(ctx.mol(m, { gs: 3.6, ar: 1.3, mat: gmat })); }
      var op = m.ops[S.o], u = Math.max(0, Math.min(1, S.uT)), e = u * u * (3 - 2 * u), M = opMatrix(op), I = new T.Matrix4(), els = ctx.layer('el'), gh = ctx.layer('ghost');
      mg.quaternion.identity(); mg.matrixAutoUpdate = true; gg.visible = false; axis.visible = false; plane.visible = false;
      if (op[1] === 'C') { var n = norm(op[2]); mg.quaternion.setFromAxisAngle(new T.Vector3(n[0], n[1], n[2]), op[3] * D * e); axis.visible = els; axis.scale.set(1, 15, 1); axis.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n[0], n[1], n[2])); axis.position.set(0, 0, 0); }
      else if (op[1] !== 'E') { gg.visible = gh && u > 0; var Me = new T.Matrix4(); Me.elements = I.elements.map(function (x, k) { return x + e * (M.elements[k] - x); }); gg.matrix.copy(Me); gg.matrixWorldNeedsUpdate = true;
        if (op[1] === 's') { var n2 = norm(op[2]); plane.visible = els; plane.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(n2[0], n2[1], n2[2])); plane.position.set(0, 0, 0); }
        if (op[1] === 'S') { var n3 = norm(op[2]); plane.visible = els; axis.visible = els; plane.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(n3[0], n3[1], n3[2])); axis.scale.set(1, 15, 1); axis.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n3[0], n3[1], n3[2])); }
        if (op[1] === 'i') { axis.visible = false; } }
      var ok = valid(m, op);
      lab[0].pos(21, 6.4, 0).set(m.n + ' (' + m.f + ') · grupo ' + m.g, 'bl-lead').vis(true);
      lab[1].pos(21, -4.2, 0).set('operación: ' + op[0] + (ok ? ' ✓ la molécula coincide consigo misma' : ' ✗'), ok ? 'bl-pos' : 'bl-neg').vis(true);
      lab[2].pos(21, -5.6, 0).set('polar: ' + polar(m) + ' · quiral: ' + (m.ch ? 'sí' : 'no'), 'bl-d').vis(true);
      lab[3].pos(16, 0, 0).set('', 'bl-d').vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.m) u.m.set(S.m); if (u.o) { } },
    hud: function () { var m = MOL[S.m], op = m.ops[Math.min(S.o, m.ops.length - 1)]; return { eq: { chip: m.g, name: 'Grupo puntual', body: '<div class="eqline"><small>Molécula</small>' + m.f + '</div><div class="eqline"><small>Operación</small>' + op[0] + '</div><div class="eqline"><small>Polar</small>' + polar(m) + '</div><div class="eqline"><small>Quiral</small>' + (m.ch ? 'sí' : 'no') + '</div>' }, legend: [{ label: 'Línea amarilla', color: '#ffd43b', text: 'eje de simetría' }, { label: 'Disco azul', color: '#74c0fc', text: 'plano de simetría' }, { label: 'Naranja', color: '#ff922b', text: 'imagen tras la operación' }] }; },
    measures: function () { var m = MOL[S.m]; return [['Molécula', m.f], ['Grupo puntual', m.g], ['Eje principal', m.cn], ['Operaciones mostradas', String(m.ops.length)], ['Polar', polar(m)], ['Quiral', m.ch ? 'sí' : 'no']]; },
    ideas: ['Operación ≠ elemento de simetría.', 'Sₙ = Cₙ seguido de σ perpendicular.', 'Polar: C₁, Cₛ, Cₙ, Cₙv.', 'Quiral: sin ejes impropios.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Molécula y operación'); el.appendChild(c);
      ui.m = kit.ui.options({ label: 'Molécula', cols: 2, value: S.m, options: KEYS.map(function (k) { return { v: k, label: MOL[k].f, sub: MOL[k].g }; }), onChange: function (v) { ctx.goManual(); S.m = v; S.o = 0; S.uT = 0; rebuildOps(); } });
      c.appendChild(ui.m); var holder = document.createElement('div'); c.appendChild(holder);
      function rebuildOps() { holder.innerHTML = ''; var m = MOL[S.m], row = []; m.ops.forEach(function (op, k) { row.push({ t: op[0], fn: function () { ctx.goManual(); S.o = k; S.uT = 0; S.run = k; } }); }); holder.appendChild(ctx.btnRow(row)); }
      rebuildOps(); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Número de operaciones por grupo', h: 190, note: 'Orden del grupo: cuántas operaciones lo forman.', draw: function (cx, w, h, col) {
      var d = [['C₁', 1], ['C₂v', 4], ['C₃v', 6], ['D₃h', 12], ['Td', 24], ['Oh', 48]], L = 12, B = 26, Tp = 14, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * Math.log(x[1] + 1) / Math.log(50), cur = x[0].replace('v', 'v') === MOL[S.m].g.replace('C₂v', 'C₂v'); cx.fillStyle = cur ? '#ffa94d' : '#3bc9db'; cx.fillRect(L + j * bw + 6, Tp + ph - hh, bw - 12, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 10); cx.fillText(String(x[1]), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () {
      var m = MOL[S.m], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, hi = /Td|Oh/.test(m.g);
      var path = [['1. ¿Es lineal?', m.lin ? 'sí → ' + (m.inv ? 'tiene i: <b>D∞h</b>' : 'sin i: <b>C∞v</b>') : 'no']];
      if (!m.lin) { path.push(['2. ¿Varios Cₙ con n ≥ 3?', hi ? 'sí → <b>' + m.g + '</b>' : 'no']); if (!hi) { path.push(['3. Eje principal', m.cn]); path.push(['4. ¿Hay C₂ perpendiculares?', m.c2p ? 'sí → familia D' : 'no → familia C o S']); path.push(['5. Planos', (m.sh ? 'σh presente' : 'sin σh') + ' · ' + (m.sv ? 'σv presentes' : 'sin σv')]); path.push(['Grupo', '<b>' + m.g + '</b>']); } }
      return '<div class="card-kicker">' + m.n + ' (' + m.f + ')</div><table class="calc-table">' + path.map(function (p) { return row(p[0], p[1]); }).join('') + row('Polar', m.po ? 'sí (grupo C₁, Cₛ, Cₙ o Cₙv)' : 'no') + row('Quiral', m.ch ? 'sí (sin ejes impropios)' : 'no (tiene σ, i o Sₙ)') + '</table>';
    },
    quiz: [
      { q: 'El grupo puntual del agua es…', options: ['C₂v', 'C₃v', 'D₂h', 'Cₛ'], answer: 0, why: 'Un C₂ y dos planos σv.' },
      { q: 'Sₙ consiste en…', options: ['rotación 360°/n seguida de reflexión en el plano perpendicular', 'sólo una reflexión', 'inversión doble', 'dos rotaciones'], answer: 0, why: 'Es una rotación impropia.' },
      { q: 'Una molécula polar no puede pertenecer a…', options: ['Td', 'C₂v', 'C₃v', 'C∞v'], answer: 0, why: 'Td tiene dipolo nulo por simetría.' },
      { q: 'CHFClBr es quiral porque su grupo puntual es…', options: ['C₁', 'Cₛ', 'C₂v', 'Td'], answer: 0, why: 'Sin planos, centro ni ejes impropios.' },
      { q: 'El CO₂ tiene grupo…', options: ['D∞h', 'C∞v', 'C₂v', 'D₃h'], answer: 0, why: 'Lineal con centro de inversión.' },
      { q: 'La inversión i lleva el punto (x, y, z) a…', options: ['(−x, −y, −z)', '(x, y, −z)', '(−x, y, z)', '(y, x, z)'], answer: 0, why: 'Reflexión a través del centro.' }
    ],
    help: { intro: 'Elige una molécula y pulsa una operación: la imagen naranja muestra el resultado y se verifica que coincida con la molécula original. «Cálculo» recorre el diagrama para asignar el grupo.', items: [['Elementos', 'línea amarilla = eje de rotación; disco azul = plano de reflexión.'], ['Imagen', 'al aplicar una operación, la imagen naranja muestra el resultado; si coincide con la molécula original, la operación pertenece a su grupo.'], ['Controles', '«Molécula» y los botones de cada operación; la pestaña «Cálculo» recorre el diagrama de flujo para asignar el grupo puntual.'], ['Gráfico', '«Número de operaciones por grupo».']], try: ['Con H₂O aplica C₂ y los dos planos σᵥ: grupo C₂v.', 'Prueba la inversión i en una molécula sin centro de simetría: la imagen no coincide.', 'Con CHFClBr sólo queda la identidad E: grupo C₁, molécula quiral.'] }
  };
  MSim.create(def);
})();
