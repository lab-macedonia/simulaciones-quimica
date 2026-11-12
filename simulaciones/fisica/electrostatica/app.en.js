/* Electrostática: electrización y fuerza eléctrica — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  // serie triboeléctrica: de más positivo (cede electrones) a más negativo (los gana)
  var SERIE = [['vidrio', 'Glass'], ['pelo', 'Human hair'], ['lana', 'Wool'], ['seda', 'Silk'], ['papel', 'Paper'], ['goma', 'Rubber balloon'], ['pvc', 'PVC (plastic)']];
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
      ['Electric charge', 'Charge', 'Neutral bodies have equal numbers of protons and electrons',
        '<p>Matter is made of atoms with <b>protons (+)</b> in the nucleus and <b>electrons (−)</b> around it. A body is <b>neutral</b> when it has as many protons as electrons. It becomes <b>charged</b> when it gains electrons (becomes <b>negative</b>) or loses them (becomes <b>positive</b>). Only electrons move: protons do not leave the nucleus.</p>'],
      ['Charging by friction', 'Friction', 'When two materials are rubbed, electrons pass from one to the other',
        '<p>When a <b>rubber balloon</b> is rubbed with <b>wool</b>, electrons pass from the wool to the balloon: the balloon becomes <b>negative</b> and the wool <b>positive</b>, with <b>equal and opposite</b> charges. Total charge is <b>conserved</b>. Which material gains electrons is given by the <b>triboelectric series</b>: the one lower in the list becomes negative.</p>'],
      ['Charging by contact', 'Contact', 'A charged body shares its charge when it touches a conductor',
        '<p>The negative rod touches the knob of the <b>electroscope</b>, which is metallic (a conductor). Some of its electrons move onto the electroscope and spread through the metal down to the <b>leaves</b>, which get charge of the <b>same sign</b> and <b>repel</b>: they open. When the rod is removed the electroscope stays charged with the <b>same sign</b> as the rod.</p>'],
      ['Charging by induction', 'Induction', 'Without touching, a nearby charge separates the charges in a conductor',
        '<p>Now the rod comes close <b>without touching</b>. Its negative charges repel the free electrons in the metal, which move away towards the leaves: the top becomes <b>positive</b> and the bottom <b>negative</b>. The leaves open even though the electroscope is still <b>neutral</b>. When the rod moves away, the electrons return and the leaves <b>close</b>.</p>'],
      ['Grounding', 'Ground', 'With the rod nearby, the ground gives or takes electrons: an opposite charge remains',
        '<p>With the rod nearby, the electroscope is connected to <b>ground</b>: the repelled electrons escape into it. The ground is disconnected and then the rod is moved away: the electroscope keeps a charge <b>opposite</b> to the rod’s (here, positive) and the leaves open. That is how a body is charged permanently by induction.</p>'],
      ['Electric force: Coulomb’s law', 'Coulomb', 'F = k·q₁·q₂ / r²: like charges repel, opposite charges attract',
        '<p>Charges of the <b>same sign repel</b> and charges of <b>opposite sign attract</b>. The force is proportional to the product of the charges and <b>inversely proportional to the square of the distance</b>: <b>F = k·q₁·q₂/r²</b>, with k = 9·10⁹ N·m²/C². If the distance is halved, the force becomes <b>four times</b> larger.</p>']
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
    key: 'electrostatica', title: 'Electrostatics: charging and electric force', subtitle: '3D simulator · physics', accent: { dark: '#ffd43b', light: '#b08900' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-0.8, 5.5, 11], target: [-0.8, 2.6, 0] }, { id: 'frontal', label: 'Front', pos: [-0.8, 3, 12], target: [-0.8, 2.4, 0] }],
    layers: [{ id: 'q', label: 'Excess charges', icon: '±' }, { id: 'F', label: 'Forces', icon: '➜' }],
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
        lab.a.pos(-1.2, 3.6, 0).set(NM[S.a].n + ': ' + (sg ? (sg < 0 ? 'gains ' : 'loses ') + n + ' e⁻ → ' + (sg < 0 ? '−' : '+') + n : 'no transfer'), sg < 0 ? 'bl-lead' : 'bl-pos').vis(true);
        lab.b.pos(1.4, 3.6, 0).set(NM[S.b].n + ': ' + (sg ? (sg < 0 ? '+' : '−') + n : '0'), sg < 0 ? 'bl-pos' : 'bl-lead').vis(true);
        lab.c.pos(0, 0.6, 0).set('Total charge: ' + (n * sg) + ' + (' + (-n * sg) + ') = 0', 'bl-d').vis(true);
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
        lab.a.pos(tip - 1.5, ky + 0.8, 0).set(S.qR ? 'Rod: ' + (S.qR > 0 ? '+' : '') + Math.round(S.qR) : 'Neutral rod', 'bl-lead').vis(S.d < 3.95 || S.qR !== -8);
        lab.b.pos(kx + 2.3, 2.2, 0).set('Electroscope: net charge ' + (S.qE > 0 ? '+' : '') + Math.round(S.qE) + (S.gnd ? ' · grounded' : ''), S.qE ? 'bl-warn' : 'bl-d').vis(true);
        lab.c.pos(kx + 2.3, 1.2, 0).set('Leaves: ' + (ang > 0.05 ? 'open (they repel)' : 'closed'), 'bl-d').vis(true);
      } else {
        var x1 = -S.dc / 2 - 0.8, x2 = S.dc / 2 - 0.8; G.s1.position.set(x1, 2.5, 0); G.s2.position.set(x2, 2.5, 0); G.st1.position.set(x1, 1.15, 0); G.st2.position.set(x2, 1.15, 0);
        var q1 = S.q1 * 1e-6, q2 = S.q2 * 1e-6, r = S.dc * 0.1, F = KC * q1 * q2 / (r * r), rep = F > 0;
        if (ctx.layer('F') && F !== 0) { var L = clamp(0.4 + Math.abs(F) * 0.25, 0.4, 3); G.f1.visible = G.f2.visible = true; G.f1.position.set(x1, 3.3, 0); G.f1.setDirection(V(rep ? -1 : 1, 0, 0)); G.f1.setLength(L, 0.3, 0.22); G.f2.position.set(x2, 3.3, 0); G.f2.setDirection(V(rep ? 1 : -1, 0, 0)); G.f2.setLength(L, 0.3, 0.22); }
        if (on) { list = list.concat(spread(S.q1, Math.sign(S.q1), function (k, N) { var a = k / N * Math.PI * 2; return V(x1 + 0.5 * Math.cos(a), 2.5 + 0.5 * Math.sin(a), 0.2); })); list = list.concat(spread(S.q2, Math.sign(S.q2), function (k, N) { var a = k / N * Math.PI * 2; return V(x2 + 0.5 * Math.cos(a), 2.5 + 0.5 * Math.sin(a), 0.2); })); }
        lab.a.pos(-0.8, 4.4, 0).set((rep ? 'Repulsion' : 'Attraction') + ' · F = ' + f2(Math.abs(F)) + ' N', rep ? 'bl-warn' : 'bl-neg').vis(F !== 0);
        lab.b.pos(-0.8, 0.5, 0).set('q₁ = ' + S.q1 + ' μC · q₂ = ' + S.q2 + ' μC · r = ' + fmt(S.dc * 10, 0) + ' cm', 'bl-d').vis(true);
      }
      charges(on ? list : []);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.d && u.d.set(S.d * 10); u.dc && u.dc.set(S.dc * 10); } },
    hud: function () { return { eq: { chip: 'q', name: { frotar: 'Friction', electro: 'Electroscope', coulomb: 'Coulomb’s law' }[S.mode], body: '<div class="eqline"><small>Conservation</small>total charge does not change</div><div class="eqline"><small>Signs</small>like repel · opposite attract</div><div class="eqline"><small>Coulomb</small>F = k·q₁·q₂ / r²</div>' }, legend: [{ label: 'Red', color: '#ff4d4d', text: 'excess positive charge' }, { label: 'Blue', color: '#4dabf7', text: 'excess negative charge (electrons)' }] }; },
    measures: function () {
      if (S.mode === 'frotar') { var sg = sign(S.a, S.b); return [['Materials', NM[S.a].n + ' / ' + NM[S.b].n], ['Electrons transferred', String(nTr() * Math.abs(sg))], ['Total charge', '0']]; }
      if (S.mode === 'electro') return [['Rod charge', String(Math.round(S.qR))], ['Rod–knob distance', f1(S.d * 10) + ' cm'], ['Net charge of the electroscope', String(Math.round(S.qE))], ['Charge on the knob', f1(top())], ['Charge on the leaves', f1(bottom())], ['Ground', S.gnd ? 'connected' : 'disconnected']];
      var r = S.dc * 0.1, F = KC * S.q1 * S.q2 * 1e-12 / (r * r); return [['q₁ · q₂', S.q1 + ' μC · ' + S.q2 + ' μC'], ['Distance', fmt(S.dc * 10, 0) + ' cm'], ['Force', f2(Math.abs(F)) + ' N (' + (F > 0 ? 'repulsion' : 'attraction') + ')']];
    },
    ideas: ['Only <b>electrons</b> are transferred.', 'Gaining e⁻ → negative charge; losing e⁻ → positive.', 'Total charge is conserved.', 'Contact: same sign remains; induction with grounding: opposite sign.', 'Like charges repel, opposite charges attract.', '<b>F = k·q₁·q₂/r²</b>: half the distance, 4 times the force.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Experiment'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Set-up', cols: 3, value: S.mode, options: [{ v: 'frotar', label: 'Friction' }, { v: 'electro', label: 'Electroscope' }, { v: 'coulomb', label: 'Coulomb' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      var c1 = kit.ui.card('Friction'); el.appendChild(c1);
      ui.a = kit.ui.options({ label: 'Object', cols: 2, value: S.a, options: SERIE.map(function (s) { return { v: s[0], label: s[1] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'frotar'; S.a = v; S.tr = 0; } }); c1.appendChild(ui.a);
      ui.b = kit.ui.options({ label: 'Rubbed with', cols: 2, value: S.b, options: SERIE.map(function (s) { return { v: s[0], label: s[1] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'frotar'; S.b = v; S.tr = 0; } }); c1.appendChild(ui.b);
      c1.appendChild(ctx.btnRow([{ t: 'Rub / stop', primary: true, fn: function () { ctx.goManual(); S.mode = 'frotar'; S.rub = !S.rub; } }, { t: 'Discharge', fn: function () { ctx.goManual(); S.tr = 0; } }]));
      var c2 = kit.ui.card('Electroscope'); el.appendChild(c2);
      ui.d = kit.ui.slider({ label: 'Rod distance (cm)', min: 0, max: 40, step: 1, value: S.d * 10, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'electro'; S.d = v / 10; touch(); if (S.gnd) S.qE = -2 * Math.round(ind()); } }); c2.appendChild(kit.ui.sliders([ui.d]));
      c2.appendChild(ctx.btnRow([{ t: 'Ground on / off', fn: function () { ctx.goManual(); S.mode = 'electro'; S.gnd = !S.gnd; if (S.gnd) S.qE = -2 * Math.round(ind()); } }, { t: 'Rod − / +', fn: function () { ctx.goManual(); S.qR = S.qR < 0 ? 8 : -8; } }, { t: 'Discharge all', fn: function () { ctx.goManual(); S.qE = 0; S.qR = -8; S.gnd = false; } }]));
      var c3 = kit.ui.card('Coulomb’s law'); el.appendChild(c3);
      ui.q1 = kit.ui.slider({ label: 'Charge q₁ (μC)', min: -6, max: 6, step: 1, value: S.q1, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.q1 = v; } });
      ui.q2 = kit.ui.slider({ label: 'Charge q₂ (μC)', min: -6, max: 6, step: 1, value: S.q2, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.q2 = v; } });
      ui.dc = kit.ui.slider({ label: 'Distance (cm)', min: 12, max: 60, step: 1, value: S.dc * 10, digits: 0, onInput: function (v) { ctx.goManual(); S.mode = 'coulomb'; S.dc = v / 10; } });
      c3.appendChild(kit.ui.sliders([ui.q1, ui.q2, ui.dc]));
      el.appendChild(ctx.btnRow([{ t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Triboelectric series', h: 230, note: 'When two materials are rubbed, the one lower down gains electrons and becomes negative.', draw: function (cx, w, h, col) {
        var n = SERIE.length, rh = (h - 20) / n; cx.font = '12px system-ui'; cx.textAlign = 'left';
        SERIE.forEach(function (s, i) { var y = 10 + i * rh, act = s[0] === S.a || s[0] === S.b; cx.fillStyle = act ? (sign(s[0], s[0] === S.a ? S.b : S.a) < 0 ? 'rgba(77,171,247,.35)' : 'rgba(255,77,77,.3)') : 'rgba(127,127,127,.08)'; cx.fillRect(40, y + 2, w - 60, rh - 4); cx.fillStyle = col.ink; cx.fillText((i + 1) + '. ' + s[1], 50, y + rh / 2 + 4); });
        cx.fillStyle = col.muted; cx.save(); cx.translate(18, h / 2); cx.rotate(-Math.PI / 2); cx.textAlign = 'center'; cx.fillText('+  gives e⁻        gains e⁻  −', 0, 0); cx.restore();
      } },
      { title: 'Electric force against distance', h: 210, note: 'F = k·q₁·q₂/r² with the charges chosen in the Coulomb set-up. The dot is the current distance.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, Fm = Math.max(0.5, KC * Math.abs(S.q1 * S.q2) * 1e-12 / 0.0144), sx = function (r) { return L + pw * (r - 0.1) / 0.5; }, sy = function (F) { return Tp + ph - ph * Math.min(F, Fm) / Fm; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(Fm * i / 4)); cx.lineTo(L + pw, sy(Fm * i / 4)); cx.stroke(); cx.fillText(fmt(Fm * i / 4, 1), L - 5, sy(Fm * i / 4) + 3); }
        cx.textAlign = 'center'; for (i = 1; i <= 6; i++) cx.fillText(fmt(i * 10, 0), sx(i / 10), h - B + 13); cx.fillText('r (cm)  ·  F (N)', L + pw / 2, h - 3);
        cx.strokeStyle = '#ff922b'; cx.lineWidth = 2.4; cx.beginPath(); for (i = 0; i <= 100; i++) { var r = 0.12 + 0.48 * i / 100, F = KC * Math.abs(S.q1 * S.q2) * 1e-12 / (r * r); if (i) cx.lineTo(sx(r), sy(F)); else cx.moveTo(sx(r), sy(F)); } cx.stroke(); cx.lineWidth = 1;
        var r0 = S.dc * 0.1; cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(r0), sy(KC * Math.abs(S.q1 * S.q2) * 1e-12 / (r0 * r0)), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, r = S.dc * 0.1, F = KC * S.q1 * S.q2 * 1e-12 / (r * r);
      return '<div class="card-kicker">Coulomb’s law</div><table class="calc-table">' + row('Data', 'q₁ = ' + S.q1 + ' μC, q₂ = ' + S.q2 + ' μC, r = ' + f2(r) + ' m') + row('F = k·q₁·q₂/r²', '9·10⁹ · (' + S.q1 + '·10⁻⁶)·(' + S.q2 + '·10⁻⁶) / ' + f2(r) + '² = <b>' + f2(F) + ' N</b>') + row('Type', F > 0 ? 'repulsion (same sign)' : F < 0 ? 'attraction (opposite signs)' : 'no force') + row('At half the distance', '<b>' + f2(Math.abs(F) * 4) + ' N</b> (4 times)') + '</table>' +
        '<div class="calc-step">Rubbing</div><p class="muted small">' + NM[S.a].n + ' with ' + NM[S.b].n + ': ' + (sign(S.a, S.b) < 0 ? NM[S.a].n + ' gains electrons (−).' : sign(S.a, S.b) > 0 ? NM[S.a].n + ' gives up electrons (+).' : 'same material: no transfer.') + '</p>';
    },
    quiz: [
      { q: 'A body becomes negatively charged when it…', options: ['gains electrons', 'loses electrons', 'gains protons', 'loses protons'], answer: 0, why: 'Only electrons are transferred; an excess of e⁻ is negative charge.' },
      { q: 'After rubbing a balloon with wool, the balloon is negative. The wool is…', options: ['positive, with the same amount of charge', 'negative', 'neutral', 'positive, with more charge'], answer: 0, why: 'Charge is conserved: the electrons gained by the balloon are lost by the wool.' },
      { q: 'A negative rod touches a neutral electroscope. The electroscope becomes…', options: ['negative', 'positive', 'neutral', 'unchanged'], answer: 0, why: 'Contact shares charge of the same sign.' },
      { q: 'When a charged rod is brought close (without touching), the leaves open because…', options: ['the charges in the metal separate', 'the electroscope gains charge', 'the air becomes charged', 'the leaves heat up'], answer: 0, why: 'Induction: the electroscope stays neutral, but its charge is redistributed.' },
      { q: 'By induction with grounding, a negative rod leaves the electroscope…', options: ['positive', 'negative', 'neutral', 'with half the rod’s charge'], answer: 0, why: 'The repelled electrons escape to ground.' },
      { q: 'Two spheres with charges of opposite sign…', options: ['attract', 'repel', 'do not interact', 'neutralise at a distance'], answer: 0, why: 'Opposite signs attract.' },
      { q: 'If the distance between two charges doubles, the force…', options: ['drops to a quarter', 'halves', 'doubles', 'does not change'], answer: 0, why: 'F ∝ 1/r².' },
      { q: 'Why must the electroscope be metallic?', options: ['because electrons move freely in a conductor', 'because metal has no electrons', 'because it is heavier', 'because it attracts plastic'], answer: 0, why: 'In a conductor charge spreads over the whole body.' }
    ],
    help: { intro: 'Choose a set-up in «Lab»: rub two materials, charge an electroscope by contact or induction (with or without grounding), or measure the force between two charges.', items: [['Small spheres', 'red: excess positive charge; blue: excess electrons.'], ['Electroscope', 'bring the rod to 0 cm to touch; bring it close without touching to induce.'], ['Ground', 'connect and disconnect with the rod nearby to charge by induction.']], try: ['Rub glass with silk and then rubber with wool: what sign does each one get?', 'Bring the rod close without touching and take it away: does the electroscope stay charged?', 'Halve the distance between the charges: how much does the force change?'] }
  };
  MSim.create(def);
})();
