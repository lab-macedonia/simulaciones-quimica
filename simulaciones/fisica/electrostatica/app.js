/* Electrostática: electrización y fuerza eléctrica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  // serie triboeléctrica: de más positivo (cede electrones) a más negativo (los gana)
  var SERIE = [['vidrio', 'Vidrio'], ['pelo', 'Pelo humano'], ['lana', 'Lana'], ['seda', 'Seda'], ['papel', 'Papel'], ['goma', 'Globo de goma'], ['pvc', 'PVC (plástico)']];
  var NM = {}; SERIE.forEach(function (s, i) { NM[s[0]] = { n: s[1], i: i }; });
  var S = { mode: 'frotar', a: 'goma', b: 'lana', tr: 0, qR: -8, d: 4, qE: 0, gnd: false, q1: 3, q2: -3, dc: 3, rub: false, ph: 0 };
  var G = {}, lab = {}, poolP = [], poolN = [], np = 0, nn = 0, KC = 8.99e9;
  function nTr() { return Math.round(S.tr); }
  function sign(a, b) { return NM[a].i > NM[b].i ? -1 : NM[a].i < NM[b].i ? 1 : 0; }   // signo de la carga que adquiere a frotado con b
  function ind() { return S.qR * clamp(1.6 / (S.d * S.d + 0.4), 0, 0.9) * 0.6; }
  function top() { return S.qE / 2 - ind(); } function bottom() { return S.qE / 2 + ind(); }
  function touch() { if (S.d < 0.25 && S.qR) { var tot = S.qR + S.qE; S.qE = Math.round(tot / 2); S.qR = tot - S.qE; } }
  function stages() {
    return [
      ['La carga eléctrica', 'Carga', 'Los cuerpos neutros tienen igual número de protones y electrones',
        '<p>La materia está formada por átomos con <b>protones (+)</b> en el núcleo y <b>electrones (−)</b> alrededor. Un cuerpo es <b>neutro</b> cuando tiene tantos protones como electrones. Se <b>electriza</b> cuando gana electrones (queda <b>negativo</b>) o los pierde (queda <b>positivo</b>). Solo se mueven los electrones: los protones no salen del núcleo.</p>'],
      ['Electrización por frotamiento', 'Frotamiento', 'Al frotar dos materiales, los electrones pasan de uno a otro',
        '<p>Al frotar un <b>globo de goma</b> con <b>lana</b>, electrones de la lana pasan al globo: el globo queda <b>negativo</b> y la lana <b>positiva</b>, con cargas <b>iguales y opuestas</b>. La carga total se <b>conserva</b>. Qué material gana electrones lo indica la <b>serie triboeléctrica</b>: el que está más abajo en la lista se vuelve negativo.</p>'],
      ['Electrización por contacto', 'Contacto', 'Un cuerpo cargado comparte su carga al tocar un conductor',
        '<p>La barra negativa toca la esfera del <b>electroscopio</b>, que es metálico (conductor). Parte de sus electrones pasan al electroscopio y se reparten por el metal hasta las <b>láminas</b>, que quedan con carga del <b>mismo signo</b> y se <b>repelen</b>: se abren. Al retirar la barra el electroscopio queda cargado con el <b>mismo signo</b> que la barra.</p>'],
      ['Electrización por inducción', 'Inducción', 'Sin tocar, una carga cercana separa las cargas de un conductor',
        '<p>Ahora la barra se acerca <b>sin tocar</b>. Sus cargas negativas repelen a los electrones libres del metal, que se alejan hacia las láminas: arriba queda carga <b>positiva</b> y abajo <b>negativa</b>. Las láminas se abren aunque el electroscopio sigue <b>neutro</b>. Al alejar la barra, los electrones vuelven y las láminas se <b>cierran</b>.</p>'],
      ['Conexión a tierra', 'Tierra', 'Con la barra cerca, la tierra cede o recibe electrones: queda carga opuesta',
        '<p>Con la barra cerca, se conecta el electroscopio a <b>tierra</b>: los electrones repelidos escapan hacia ella. Se desconecta la tierra y luego se aleja la barra: el electroscopio queda con carga <b>opuesta</b> a la de la barra (aquí, positiva) y las láminas se abren. Así se carga un cuerpo por inducción de forma permanente.</p>'],
      ['Fuerza eléctrica: ley de Coulomb', 'Coulomb', 'F = k·q₁·q₂ / r²: cargas iguales se repelen, opuestas se atraen',
        '<p>Las cargas del <b>mismo signo se repelen</b> y las de <b>signo opuesto se atraen</b>. La fuerza es proporcional al producto de las cargas e <b>inversamente proporcional al cuadrado de la distancia</b>: <b>F = k·q₁·q₂/r²</b>, con k = 9·10⁹ N·m²/C². Si la distancia se reduce a la mitad, la fuerza se <b>cuadruplica</b>.</p>']
    ];
  }
  function lessonSet(i, l, ctx) {
    if (ctx._st !== i) { ctx._st = i; S.qE = 0; S.gnd = false; S.tr = 0; S.qR = -8; S.d = 4; }
    if (i === 0) { S.mode = 'frotar'; S.a = 'goma'; S.b = 'lana'; S.tr = 0; S.rub = false; }
    else if (i === 1) { S.mode = 'frotar'; S.a = 'goma'; S.b = 'lana'; S.rub = l > 0.08 && l < 0.85; S.tr = clamp((l - 0.08) / 0.77, 0, 1) * 8; }
    else if (i === 2) { S.mode = 'electro'; S.d = l < 0.4 ? 4 - 3.85 * (l / 0.4) : l < 0.55 ? 0.15 : 0.15 + 3.85 * clamp((l - 0.55) / 0.3, 0, 1); if (l >= 0.4 && l < 0.55 && S.qR === -8) touch(); }
    else if (i === 3) { S.mode = 'electro'; S.d = l < 0.35 ? 4 - 3.2 * (l / 0.35) : l < 0.7 ? 0.8 : 0.8 + 3.2 * clamp((l - 0.7) / 0.25, 0, 1); }
    else if (i === 4) { S.mode = 'electro'; S.d = l < 0.25 ? 4 - 3.2 * (l / 0.25) : l < 0.8 ? 0.8 : 0.8 + 3.2 * clamp((l - 0.8) / 0.18, 0, 1); var g = l > 0.35 && l < 0.6; if (g) S.qE = -2 * Math.round(ind()); S.gnd = g; }
    else { S.mode = 'coulomb'; S.q1 = 3; S.q2 = l < 0.5 ? 3 : -3; S.dc = 4 - 2.6 * ((l < 0.5 ? l : l - 0.5) * 2); }
  }
  function sph(r, c, o) { return new T.Mesh(new T.SphereGeometry(r, 20, 14), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.4 }, o || {}))); }
  function box(w, h, d, c, o) { return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5 }, o || {}))); }
  function charges(list) {
    var ip = 0, ineg = 0;
    list.forEach(function (c) { var arr = c[0] > 0 ? poolP : poolN, k = c[0] > 0 ? ip++ : ineg++; if (k < arr.length) { arr[k].visible = true; arr[k].position.copy(c[1]); } });
    for (var k = ip; k < poolP.length; k++) poolP[k].visible = false; for (k = ineg; k < poolN.length; k++) poolN[k].visible = false; np = ip; nn = ineg;
  }
  function spread(n, sgn, f) { var r = []; for (var k = 0; k < Math.abs(Math.round(n)); k++) r.push([sgn, f(k, Math.abs(Math.round(n)))]); return r; }
  var def = {
    key: 'electrostatica', title: 'Electrostática: electrización y fuerza eléctrica', subtitle: 'Simulador 3D · física', accent: { dark: '#ffd43b', light: '#b08900' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-0.8, 5.5, 11], target: [-0.8, 2.6, 0] }, { id: 'frontal', label: 'Frontal', pos: [-0.8, 3, 12], target: [-0.8, 2.4, 0] }],
    layers: [{ id: 'q', label: 'Cargas en exceso', icon: '±' }, { id: 'F', label: 'Fuerzas', icon: '➜' }],
    build: function (ctx) {
      var s = ctx.scene, i; var floor = box(14, 0.1, 6, 0x343a40); floor.position.y = -0.05; s.add(floor);
      // frotamiento
      G.fro = new T.Group(); s.add(G.fro); G.objA = sph(0.9, 0xff6b6b); G.objA.position.set(-1.2, 2.2, 0); G.fro.add(G.objA); G.objB = box(1.6, 1.6, 0.4, 0xf1e3c6); G.objB.position.set(1.4, 2.2, 0); G.fro.add(G.objB);
      // electroscopio
      G.el = new T.Group(); s.add(G.el); G.el.position.set(1.5, 0, 0);
      var jar = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 2.6, 32, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.18, side: T.DoubleSide })); jar.position.y = 1.3; G.el.add(jar);
      var cap = box(0.9, 0.25, 0.9, 0x495057); cap.position.y = 2.65; G.el.add(cap);
      var rod = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 8), new T.MeshStandardMaterial({ color: 0xced4da, metalness: 0.15, roughness: 0.35 })); rod.position.y = 2.2; G.el.add(rod);
      G.knob = sph(0.35, 0xced4da, { metalness: 0.15, roughness: 0.3 }); G.knob.position.y = 3.5; G.el.add(G.knob);
      G.leaves = []; for (i = 0; i < 2; i++) { var pv = new T.Group(); pv.position.set(0, 0.95, 0); var lf = box(0.06, 1, 0.42, 0xffd43b, { metalness: 0.1, roughness: 0.35, emissive: 0x3d2f00 }); lf.position.y = -0.5; pv.add(lf); G.el.add(pv); G.leaves.push(pv); }
      G.gw = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 6), new T.MeshStandardMaterial({ color: 0x51cf66 })); G.el.add(G.gw);
      G.rodC = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 3, 12), new T.MeshStandardMaterial({ color: 0x868e96, roughness: 0.4 })); G.rodC.rotation.z = Math.PI / 2; s.add(G.rodC);
      // Coulomb
      G.cou = new T.Group(); s.add(G.cou); G.s1 = sph(0.45, 0xdee2e6, { metalness: 0.15, roughness: 0.3 }); G.s2 = sph(0.45, 0xdee2e6, { metalness: 0.15, roughness: 0.3 }); G.cou.add(G.s1); G.cou.add(G.s2);
      G.st1 = box(0.1, 2.3, 0.1, 0xadb5bd); G.st2 = box(0.1, 2.3, 0.1, 0xadb5bd); G.cou.add(G.st1); G.cou.add(G.st2);
      G.f1 = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xff922b, 0.35, 0.25); G.f2 = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xff922b, 0.35, 0.25); s.add(G.f1); s.add(G.f2);
      var gp = new T.SphereGeometry(0.13, 10, 8), mp = new T.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0x661010 }), mn = new T.MeshStandardMaterial({ color: 0x4dabf7, emissive: 0x0b2e55 });
      for (i = 0; i < 40; i++) { var a = new T.Mesh(gp, mp), b = new T.Mesh(gp, mn); a.visible = b.visible = false; s.add(a); s.add(b); poolP.push(a); poolN.push(b); }
      ['a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx);
      else if (S.rub && S.mode === 'frotar') { S.tr = Math.min(12, S.tr + dt * 2); }
      var on = ctx.layer('q'), V = function (x, y, z) { return new T.Vector3(x, y, z); }, list = [];
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      G.fro.visible = S.mode === 'frotar'; G.el.visible = G.rodC.visible = S.mode === 'electro'; G.cou.visible = S.mode === 'coulomb'; G.f1.visible = G.f2.visible = false;
      if (S.mode === 'frotar') {
        var sg = sign(S.a, S.b), n = nTr() * Math.abs(sg); S.ph += dt * (S.rub ? 9 : 0);
        G.objB.position.x = 1.4 - (S.rub ? 0.55 + 0.25 * Math.sin(S.ph) : 0); G.objB.position.y = 2.2 + (S.rub ? 0.35 * Math.cos(S.ph) : 0);
        G.objA.material.color.setHex({ vidrio: 0xa5d8ff, pelo: 0x5c3b1e, lana: 0xf1e3c6, seda: 0xf8f0e3, papel: 0xf8f9fa, goma: 0xff6b6b, pvc: 0x868e96 }[S.a]);
        G.objB.material.color.setHex({ vidrio: 0xa5d8ff, pelo: 0x5c3b1e, lana: 0xf1e3c6, seda: 0xf8f0e3, papel: 0xf8f9fa, goma: 0xff6b6b, pvc: 0x868e96 }[S.b]);
        if (on) { list = list.concat(spread(n, sg, function (k, N) { var a = k / N * Math.PI * 2; return V(-1.2 + 0.98 * Math.cos(a), 2.2 + 0.98 * Math.sin(a), 0.3); })); list = list.concat(spread(n, -sg, function (k, N) { return V(G.objB.position.x - 0.6 + 1.2 * (k % 4) / 3, G.objB.position.y - 0.6 + 0.4 * Math.floor(k / 4), 0.26); })); }
        lab.a.pos(-1.2, 3.6, 0).set(NM[S.a].n + ': ' + (sg ? (sg < 0 ? 'gana ' : 'pierde ') + n + ' e⁻ → ' + (sg < 0 ? '−' : '+') + n : 'sin transferencia'), sg < 0 ? 'bl-lead' : 'bl-pos').vis(true);
        lab.b.pos(1.4, 3.6, 0).set(NM[S.b].n + ': ' + (sg ? (sg < 0 ? '+' : '−') + n : '0'), sg < 0 ? 'bl-pos' : 'bl-lead').vis(true);
        lab.c.pos(0, 0.6, 0).set('Carga total: ' + (n * sg) + ' + (' + (-n * sg) + ') = 0', 'bl-d').vis(true);
      } else if (S.mode === 'electro') {
        var kx = 1.5, ky = 3.5, tip = kx - 0.35 - S.d; G.rodC.position.set(tip - 1.5, ky, 0); G.rodC.visible = S.qR !== 0 || S.d < 3.9;
        G.rodC.material.color.setHex(S.qR < 0 ? 0x868e96 : 0xa5d8ff);
        var b = bottom(), ang = clamp(Math.abs(b) * 0.09, 0, 0.9); G.leaves[0].rotation.z = ang; G.leaves[1].rotation.z = -ang;
        G.gw.visible = S.gnd; if (S.gnd) { G.gw.position.set(0.9, 1.75, 0); G.gw.rotation.z = 0.5; G.gw.scale.y = 3.9; }
        if (on) {
          list = list.concat(spread(S.qR, Math.sign(S.qR), function (k, N) { return V(tip - 0.25 - 2.6 * k / Math.max(1, N), ky + 0.2 * ((k % 2) * 2 - 1), 0.12); }));
          var tp = top(); list = list.concat(spread(tp, Math.sign(tp), function (k, N) { var a = Math.PI * (0.5 + k / Math.max(1, N)); return V(kx + 0.42 * Math.cos(a), ky + 0.42 * Math.sin(a), 0.1); }));
          list = list.concat(spread(b, Math.sign(b), function (k, N) { var side = k % 2 ? 1 : -1, j = Math.floor(k / 2) + 1, L = 0.95 / (Math.ceil(N / 2) + 1) * j; return V(kx + side * Math.sin(ang) * L, 0.95 - Math.cos(ang) * L, 0.18); }));
        }
        lab.a.pos(tip - 1.5, ky + 0.8, 0).set(S.qR ? 'Barra: ' + (S.qR > 0 ? '+' : '') + Math.round(S.qR) : 'Barra neutra', 'bl-lead').vis(S.d < 3.95 || S.qR !== -8);
        lab.b.pos(kx + 2.3, 2.2, 0).set('Electroscopio: carga neta ' + (S.qE > 0 ? '+' : '') + Math.round(S.qE) + (S.gnd ? ' · conectado a tierra' : ''), S.qE ? 'bl-warn' : 'bl-d').vis(true);
        lab.c.pos(kx + 2.3, 1.2, 0).set('Láminas: ' + (ang > 0.05 ? 'abiertas (se repelen)' : 'cerradas'), 'bl-d').vis(true);
      } else {
        var x1 = -S.dc / 2 - 0.8, x2 = S.dc / 2 - 0.8; G.s1.position.set(x1, 2.5, 0); G.s2.position.set(x2, 2.5, 0); G.st1.position.set(x1, 1.15, 0); G.st2.position.set(x2, 1.15, 0);
        var q1 = S.q1 * 1e-6, q2 = S.q2 * 1e-6, r = S.dc * 0.1, F = KC * q1 * q2 / (r * r), rep = F > 0;
        if (ctx.layer('F') && F !== 0) { var L = clamp(0.4 + Math.abs(F) * 0.25, 0.4, 3); G.f1.visible = G.f2.visible = true; G.f1.position.set(x1, 3.3, 0); G.f1.setDirection(V(rep ? -1 : 1, 0, 0)); G.f1.setLength(L, 0.3, 0.22); G.f2.position.set(x2, 3.3, 0); G.f2.setDirection(V(rep ? 1 : -1, 0, 0)); G.f2.setLength(L, 0.3, 0.22); }
        if (on) { list = list.concat(spread(S.q1, Math.sign(S.q1), function (k, N) { var a = k / N * Math.PI * 2; return V(x1 + 0.5 * Math.cos(a), 2.5 + 0.5 * Math.sin(a), 0.2); })); list = list.concat(spread(S.q2, Math.sign(S.q2), function (k, N) { var a = k / N * Math.PI * 2; return V(x2 + 0.5 * Math.cos(a), 2.5 + 0.5 * Math.sin(a), 0.2); })); }
        lab.a.pos(-0.8, 4.4, 0).set((rep ? 'Repulsión' : 'Atracción') + ' · F = ' + f2(Math.abs(F)) + ' N', rep ? 'bl-warn' : 'bl-neg').vis(F !== 0);
        lab.b.pos(-0.8, 0.5, 0).set('q₁ = ' + S.q1 + ' μC · q₂ = ' + S.q2 + ' μC · r = ' + fmt(S.dc * 10, 0) + ' cm', 'bl-d').vis(true);
      }
      charges(on ? list : []);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.d && u.d.set(S.d * 10); u.dc && u.dc.set(S.dc * 10); } },
    hud: function () { return { eq: { chip: 'q', name: { frotar: 'Frotamiento', electro: 'Electroscopio', coulomb: 'Ley de Coulomb' }[S.mode], body: '<div class="eqline"><small>Conservación</small>la carga total no cambia</div><div class="eqline"><small>Signos</small>iguales se repelen · opuestos se atraen</div><div class="eqline"><small>Coulomb</small>F = k·q₁·q₂ / r²</div>' }, legend: [{ label: 'Rojo', color: '#ff4d4d', text: 'carga positiva en exceso' }, { label: 'Azul', color: '#4dabf7', text: 'carga negativa (electrones) en exceso' }] }; },
    measures: function () {
      if (S.mode === 'frotar') { var sg = sign(S.a, S.b); return [['Materiales', NM[S.a].n + ' / ' + NM[S.b].n], ['Electrones transferidos', String(nTr() * Math.abs(sg))], ['Carga total', '0']]; }
      if (S.mode === 'electro') return [['Carga de la barra', String(Math.round(S.qR))], ['Distancia barra–esfera', f1(S.d * 10) + ' cm'], ['Carga neta del electroscopio', String(Math.round(S.qE))], ['Carga en la esfera', f1(top())], ['Carga en las láminas', f1(bottom())], ['Tierra', S.gnd ? 'conectada' : 'desconectada']];
      var r = S.dc * 0.1, F = KC * S.q1 * S.q2 * 1e-12 / (r * r); return [['q₁ · q₂', S.q1 + ' μC · ' + S.q2 + ' μC'], ['Distancia', fmt(S.dc * 10, 0) + ' cm'], ['Fuerza', f2(Math.abs(F)) + ' N (' + (F > 0 ? 'repulsión' : 'atracción') + ')']];
    },
    ideas: ['Solo se transfieren <b>electrones</b>.', 'Ganar e⁻ → carga negativa; perder e⁻ → positiva.', 'La carga total se conserva.', 'Contacto: queda el mismo signo; inducción con tierra: el opuesto.', 'Iguales se repelen, opuestos se atraen.', '<b>F = k·q₁·q₂/r²</b>: a la mitad de distancia, 4 veces la fuerza.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experimento'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Montaje', cols: 3, value: S.mode, options: [{ v: 'frotar', label: 'Frotamiento' }, { v: 'electro', label: 'Electroscopio' }, { v: 'coulomb', label: 'Coulomb' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      var c1 = kit.ui.card('Frotamiento'); el.appendChild(c1);
      ui.a = kit.ui.options({ label: 'Objeto', cols: 2, value: S.a, options: SERIE.map(function (s) { return { v: s[0], label: s[1] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'frotar'; S.a = v; S.tr = 0; } }); c1.appendChild(ui.a);
      ui.b = kit.ui.options({ label: 'Frotado con', cols: 2, value: S.b, options: SERIE.map(function (s) { return { v: s[0], label: s[1] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'frotar'; S.b = v; S.tr = 0; } }); c1.appendChild(ui.b);
      c1.appendChild(ctx.btnRow([{ t: 'Frotar / parar', primary: true, fn: function () { ctx.goManual(); S.mode = 'frotar'; S.rub = !S.rub; } }, { t: 'Descargar', fn: function () { ctx.goManual(); S.tr = 0; } }]));
      var c2 = kit.ui.card('Electroscopio'); el.appendChild(c2);
      ui.d = kit.ui.slider({ label: 'Distancia de la barra (cm)', min: 0, max: 40, step: 1, value: S.d * 10, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'electro'; S.d = v / 10; touch(); if (S.gnd) S.qE = -2 * Math.round(ind()); } }); c2.appendChild(kit.ui.sliders([ui.d]));
      c2.appendChild(ctx.btnRow([{ t: 'Tierra sí / no', fn: function () { ctx.goManual(); S.mode = 'electro'; S.gnd = !S.gnd; if (S.gnd) S.qE = -2 * Math.round(ind()); } }, { t: 'Barra − / +', fn: function () { ctx.goManual(); S.qR = S.qR < 0 ? 8 : -8; } }, { t: 'Descargar todo', fn: function () { ctx.goManual(); S.qE = 0; S.qR = -8; S.gnd = false; } }]));
      var c3 = kit.ui.card('Ley de Coulomb'); el.appendChild(c3);
      ui.q1 = kit.ui.slider({ label: 'Carga q₁ (μC)', min: -6, max: 6, step: 1, value: S.q1, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.q1 = v; } });
      ui.q2 = kit.ui.slider({ label: 'Carga q₂ (μC)', min: -6, max: 6, step: 1, value: S.q2, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.q2 = v; } });
      ui.dc = kit.ui.slider({ label: 'Distancia (cm)', min: 12, max: 60, step: 1, value: S.dc * 10, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.dc = v / 10; } });
      c3.appendChild(kit.ui.sliders([ui.q1, ui.q2, ui.dc]));
      el.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Serie triboeléctrica', h: 230, note: 'Al frotar dos materiales, el que está más abajo gana electrones y queda negativo.', draw: function (cx, w, h, col) {
        var n = SERIE.length, rh = (h - 20) / n; cx.font = '12px system-ui'; cx.textAlign = 'left';
        SERIE.forEach(function (s, i) { var y = 10 + i * rh, act = s[0] === S.a || s[0] === S.b; cx.fillStyle = act ? (sign(s[0], s[0] === S.a ? S.b : S.a) < 0 ? 'rgba(77,171,247,.35)' : 'rgba(255,77,77,.3)') : 'rgba(127,127,127,.08)'; cx.fillRect(40, y + 2, w - 60, rh - 4); cx.fillStyle = col.ink; cx.fillText((i + 1) + '. ' + s[1], 50, y + rh / 2 + 4); });
        cx.fillStyle = col.muted; cx.save(); cx.translate(18, h / 2); cx.rotate(-Math.PI / 2); cx.textAlign = 'center'; cx.fillText('+  cede e⁻        gana e⁻  −', 0, 0); cx.restore();
      } },
      { title: 'Fuerza eléctrica frente a distancia', h: 210, note: 'F = k·q₁·q₂/r² con las cargas elegidas en el montaje Coulomb. El punto es la distancia actual.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Fm = Math.max(0.5, KC * Math.abs(S.q1 * S.q2) * 1e-12 / 0.0144), sx = function (r) { return L + pw * (r - 0.1) / 0.5; }, sy = function (F) { return Tp + ph - ph * Math.min(F, Fm) / Fm; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(Fm * i / 4)); cx.lineTo(L + pw, sy(Fm * i / 4)); cx.stroke(); cx.fillText(fmt(Fm * i / 4, 1), L - 5, sy(Fm * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 1; i <= 6; i++) cx.fillText(fmt(i * 10, 0), sx(i / 10), h - B + 13); cx.fillText('r (cm)  ·  F (N)', L + pw / 2, h - 3);
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 100; i++) { var r = 0.12 + 0.48 * i / 100, F = KC * Math.abs(S.q1 * S.q2) * 1e-12 / (r * r); if (i) cx.lineTo(sx(r), sy(F)); else cx.moveTo(sx(r), sy(F)); } cx.stroke(); cx.lineWidth = 1;
        var r0 = S.dc * 0.1; cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(r0), sy(KC * Math.abs(S.q1 * S.q2) * 1e-12 / (r0 * r0)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, r = S.dc * 0.1, F = KC * S.q1 * S.q2 * 1e-12 / (r * r);
      return '<div class="card-kicker">Ley de Coulomb</div><table class="calc-table">' + row('Datos', 'q₁ = ' + S.q1 + ' μC, q₂ = ' + S.q2 + ' μC, r = ' + f2(r) + ' m') + row('F = k·q₁·q₂/r²', '9·10⁹ · (' + S.q1 + '·10⁻⁶)·(' + S.q2 + '·10⁻⁶) / ' + f2(r) + '² = <b>' + f2(F) + ' N</b>') + row('Tipo', F > 0 ? 'repulsión (mismo signo)' : F < 0 ? 'atracción (signos opuestos)' : 'sin fuerza') + row('A la mitad de distancia', '<b>' + f2(Math.abs(F) * 4) + ' N</b> (4 veces)') + '</table>' +
        '<div class="calc-step">Frotamiento</div><p class="muted small">' + NM[S.a].n + ' con ' + NM[S.b].n + ': ' + (sign(S.a, S.b) < 0 ? NM[S.a].n + ' gana electrones (−).' : sign(S.a, S.b) > 0 ? NM[S.a].n + ' cede electrones (+).' : 'mismo material: no hay transferencia.') + '</p>';
    },
    quiz: [
      { q: 'Un cuerpo queda con carga negativa cuando…', options: ['gana electrones', 'pierde electrones', 'gana protones', 'pierde protones'], answer: 0, why: 'Solo se transfieren electrones; el exceso de e⁻ es carga negativa.' },
      { q: 'Al frotar un globo con lana, el globo queda negativo. La lana queda…', options: ['positiva, con la misma carga en valor', 'negativa', 'neutra', 'positiva, con más carga'], answer: 0, why: 'La carga se conserva: los electrones que gana el globo los pierde la lana.' },
      { q: 'Una barra negativa toca un electroscopio neutro. El electroscopio queda…', options: ['negativo', 'positivo', 'neutro', 'sin cambios'], answer: 0, why: 'En el contacto se comparte carga del mismo signo.' },
      { q: 'Al acercar (sin tocar) una barra cargada, las láminas se abren porque…', options: ['las cargas del metal se separan', 'el electroscopio gana carga', 'el aire se carga', 'las láminas se calientan'], answer: 0, why: 'Inducción: el electroscopio sigue neutro, pero su carga se redistribuye.' },
      { q: 'Por inducción con conexión a tierra, una barra negativa deja al electroscopio…', options: ['positivo', 'negativo', 'neutro', 'con la mitad de la carga de la barra'], answer: 0, why: 'Los electrones repelidos escapan a tierra.' },
      { q: 'Dos esferas con cargas de signo opuesto…', options: ['se atraen', 'se repelen', 'no interactúan', 'se neutralizan a distancia'], answer: 0, why: 'Signos opuestos se atraen.' },
      { q: 'Si la distancia entre dos cargas se duplica, la fuerza…', options: ['se reduce a la cuarta parte', 'se reduce a la mitad', 'se duplica', 'no cambia'], answer: 0, why: 'F ∝ 1/r².' },
      { q: '¿Por qué el electroscopio debe ser metálico?', options: ['porque los electrones se mueven libremente en un conductor', 'porque el metal no tiene electrones', 'porque es más pesado', 'porque atrae al plástico'], answer: 0, why: 'En un conductor la carga se distribuye por todo el cuerpo.' }
    ],
    help: { intro: 'Elige un montaje en «Lab»: frotar dos materiales, cargar un electroscopio por contacto o inducción (con o sin tierra), o medir la fuerza entre dos cargas.', items: [['Esferitas', 'roja: carga positiva en exceso; azul: electrones en exceso.'], ['Electroscopio', 'lleva la barra a 0 cm para tocar; acércala sin tocar para inducir.'], ['Tierra', 'conecta y desconecta con la barra cerca para cargar por inducción.']], try: ['Frota vidrio con seda y luego goma con lana: ¿qué signo queda en cada uno?', 'Acerca la barra sin tocar y aléjala: ¿se queda cargado el electroscopio?', 'Reduce la distancia entre las cargas a la mitad: ¿cuánto cambia la fuerza?'] }
  };
  MSim.create(def);
})();
