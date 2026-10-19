/* Extracción líquido–líquido — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

/* Núcleo común de los simuladores 3D · Laboratorio MACEDONIA (UMCE) — construido sobre ../../kit/simkit.js */
(function () {
  "use strict";
  var T = THREE, fmt = SimKit.fmt, clamp = SimKit.clamp;
  var EL = { H: [0xf2f2f2, 0.31], C: [0x56606b, 0.76], N: [0x4f7cff, 0.71], O: [0xff4d4d, 0.66], S: [0xe6c229, 1.0], P: [0xff9a3d, 1.07], F: [0x7ee08a, 0.57], Cl: [0x3ddc5a, 1.02], Br: [0xa0522d, 1.2], I: [0x9a4fd0, 1.33], Na: [0xab5cf2, 1.5], K: [0x8f40d4, 1.9], Cu: [0xc88033, 1.3], Zn: [0x7d80b0, 1.2], Ag: [0xc0c0c0, 1.4], Fe: [0xe06633, 1.3], Co: [0xf090a0, 1.25], Ni: [0x50d050, 1.25], Cr: [0x8a99c7, 1.3], Mn: [0x9c7ac7, 1.3], Ti: [0xbfc2c7, 1.4], Ca: [0x3dff00, 1.8], Mg: [0x8aff00, 1.5], Pt: [0xd0d0e0, 1.35], Li: [0xcc80ff, 1.3] };
  var matCache = {}, sphereGeo, cylGeo;
  function mat(el) { if (!matCache[el]) { var d = EL[el] || [0xcccccc, 1]; matCache[el] = new T.MeshStandardMaterial({ color: d[0], roughness: 0.4, metalness: 0.1 }); } return matCache[el]; }
  var bondMat = null;
  /* geo = { a: [[el,x,y,z],...], b: [[i,j],...] }, opts = { gs: escala de coordenadas, ar: escala de radios } */
  function mol(geo, o) {
    o = o || {}; var gs = o.gs || 0.5, ar = o.ar || 0.42, g = new T.Group();
    sphereGeo = sphereGeo || new T.SphereGeometry(1, 16, 12); cylGeo = cylGeo || new T.CylinderGeometry(1, 1, 1, 8, 1, true);
    bondMat = bondMat || new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 });
    geo.a.forEach(function (a) { var m = new T.Mesh(sphereGeo, o.mat ? o.mat : mat(a[0])); m.scale.setScalar((EL[a[0]] ? EL[a[0]][1] : 1) * ar * (o.rs || 1)); m.position.set(a[1] * gs, a[2] * gs, a[3] * gs); g.add(m); });
    (geo.b || []).forEach(function (b) {
      var p = new T.Vector3(geo.a[b[0]][1], geo.a[b[0]][2], geo.a[b[0]][3]).multiplyScalar(gs), q = new T.Vector3(geo.a[b[1]][1], geo.a[b[1]][2], geo.a[b[1]][3]).multiplyScalar(gs);
      var d = q.clone().sub(p), len = d.length(), order = b[2] || 1;
      for (var k = 0; k < order; k++) {
        var c = new T.Mesh(cylGeo, bondMat), off = new T.Vector3(0, 0, (k - (order - 1) / 2) * 0.16 * (o.bw || 1));
        c.scale.set(0.055 * (o.bw || 1), len, 0.055 * (o.bw || 1)); c.position.copy(p).add(q).multiplyScalar(0.5).add(off); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); g.add(c);
      }
    });
    return g;
  }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function kv(a, b) { return '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function sci(x, d) { if (x === 0) return '0'; var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10); if (e > -3 && e < 4) return fmt(x, d == null ? (Math.abs(x) < 1 ? 4 : 2) : d); var m = x / Math.pow(10, e); return fmt(m, 2) + ' × 10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }

  function create(def) {
    var ctx = { T: T, THREE: T, fmt: fmt, clamp: clamp, ease: ease, kv: kv, sci: sci, mol: mol, mat: mat, EL: EL, P: { manual: false, camGoal: null }, ui: {}, def: def, now: 0, dt: 0 };
    var nSt = def.nStages || 6, STAGES = []; for (var q = 0; q < nSt; q++) STAGES.push({ name: '', short: '', title: '', text: '', dur: def.dur || 10 });
    var kit, labels = [], lastSync = -1, lastHud = '', lastCalc = '', calcCard = null, graphUi = [];
    ctx.STAGES = STAGES;
    function applyStageDom() {
      var s = STAGES[kit.state.stage]; document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
      var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
      if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
    }
    ctx.refreshStages = function () {
      def.stages(ctx).forEach(function (a, i) { var t = STAGES[i]; if (!t) return; t.name = a[0]; t.short = a[1]; t.title = a[2]; t.text = a[3]; if (a[4]) t.dur = a[4]; });
      if (kit) applyStageDom();
    };
    ctx.goManual = function () { if (!ctx.P.manual) { ctx.P.manual = true; kit.toast("Free mode: you control the simulation"); } if (kit.state.playing) kit.pause(); };
    ctx.toLesson = function () { ctx.P.manual = false; kit.toast("The lesson controls the simulation"); if (def.onStage) def.onStage(kit.state.stage, ctx); };
    ctx.layer = function (id) { return kit.layer(id); };
    ctx.view = function (id) { var v = (def.views || []).filter(function (x) { return x.id === id; })[0]; if (v) ctx.P.camGoal = { pos: new T.Vector3(v.pos[0], v.pos[1], v.pos[2]), target: new T.Vector3(v.target[0], v.target[1], v.target[2]) }; };
    ctx.btnRow = function (list) {
      var r = document.createElement('div'); r.className = 'row';
      list.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn' + (b.primary ? " primary" : ''); e.textContent = b.t; e.addEventListener('click', b.fn); if (b.id) ui(b.id, e); r.appendChild(e); });
      return r;
    };
    function ui(id, e) { ctx.ui[id] = e; }
    ctx.label = function (txt, cls) {
      var d = document.createElement('div'); d.className = 'bond-label ' + (cls || 'bl-d'); d.textContent = txt; var o = new T.CSS2DObject(d); ctx.scene.add(o);
      var L = { d: d, o: o, set: function (t, c) { if (d.textContent !== t) d.textContent = t; if (c && d.className !== 'bond-label ' + c) d.className = 'bond-label ' + c; return L; }, pos: function (x, y, z) { o.position.set(x, y, z); return L; }, vis: function (b) { o.visible = !!b && (L.force !== false) && ctx.layer('labels') !== false; return L; } };
      labels.push(L); return L;
    };
    ctx.redraw = function () { graphUi.forEach(function (g) { g.redraw(); }); };
    function resize() {
      if (!ctx.renderer) return; var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight; if (w < 2 || h < 2) return;
      var cam = ctx.camera; cam.aspect = w / h; cam.zoom = clamp(cam.aspect / 1.6, 0.4, 1.15) * (w > 900 ? (def.zoom || 1) : 0.9);
      var off = w > 900 ? Math.min(280, w * (def.offset == null ? 0.25 : def.offset)) : 0; if (off) cam.setViewOffset(w, h, -off, 0, w, h); else cam.clearViewOffset();
      cam.updateProjectionMatrix(); ctx.renderer.setSize(w, h); ctx.labelRenderer.setSize(w, h);
    }
    function syncHud() {
      if (!def.hud) return; var h = def.hud(ctx), key = JSON.stringify(h); if (key === lastHud) return; lastHud = key; if (h.eq) kit.setEq(h.eq); if (h.legend) kit.setLegend(h.legend);
    }
    var tabs = [];
    if (def.lab) tabs.push({ id: 'lab', label: "Lab", build: function (el, k) { kit = k; ctx.kit = k; def.lab(el, ctx); } });
    if (def.graphs) tabs.push({ id: 'graf', label: "Graphs", build: function (el, k) {
      kit = k; ctx.kit = k; def.graphs.forEach(function (g) {
        var c = kit.ui.card(g.title); var cv = kit.ui.canvas(c, { height: g.h || 220, label: g.label || g.title, draw: function (cx, w, h, col) { g.draw(cx, w, h, col, ctx); } });
        graphUi.push(cv); if (g.note) c.insertAdjacentHTML('beforeend', '<p class="muted small">' + g.note + '</p>'); el.appendChild(c);
      });
    } });
    if (def.calc) tabs.push({ id: 'calc', label: def.calcLabel || "Calculation", build: function (el, k) { kit = k; ctx.kit = k; calcCard = kit.ui.card(''); el.appendChild(calcCard); lastCalc = ''; calcCard.innerHTML = lastCalc = def.calc(ctx); } });
    if (def.quiz) tabs.push({ id: 'quiz', label: "Challenge", build: function (el, k) { kit = k; ctx.kit = k; var c = kit.ui.card("Challenge"); kit.ui.quiz(c, { items: def.quiz, intro: def.quizIntro || ("Review questions (" + def.quiz.length + ').') }); el.appendChild(c); } });
    (def.tabsExtra || []).forEach(function (t) { tabs.push(t); });
    var bg = def.bg || [0x0e131a, 0xdbe6f1];
    ctx.kit = null;
    kit = SimKit.create({
      key: def.key, title: def.title, subtitle: def.subtitle || "3D Simulator", accent: def.accent || { dark: '#7dd3fc', light: '#0369a1' }, viewLabel: def.viewLabel || ("3D viewer · " + def.title),
      stages: STAGES, mainTabLabel: "Guide", tabs: tabs, measuresTitle: "Live measurements", measures: function () { return def.measures ? def.measures(ctx) : []; },
      ideas: def.ideas || [], layers: [{ id: 'labels', label: "Labels", icon: 'Aa' }].concat(def.layers || []),
      onLayer: function (id, on) { if (id === 'labels') labels.forEach(function (l) { l.vis(l.want !== false); }); if (def.onLayer) def.onLayer(id, on, ctx); },
      views: (def.views || [{ id: 'libre', label: "Free", pos: [0, 6, 22], target: [0, 3, 0] }]).map(function (v) { return { id: v.id, label: v.label }; }),
      onView: function (id) { ctx.view(id); },
      onTheme: function (th) { if (ctx.scene) { ctx.scene.background = new T.Color(th === 'dark' ? bg[0] : bg[1]); } ctx.theme = th; if (def.onTheme) def.onTheme(th, ctx); },
      onStage: function (i) { ctx.refreshStages(); if (ctx.P.manual) return; if (def.stageViews && def.stageViews[i]) ctx.view(def.stageViews[i]); if (def.onStage) def.onStage(i, ctx); },
      onGuide: function () { if (ctx.P.manual) ctx.toLesson(); },
      onResize: resize,
      render: function () { ctx.renderer.render(ctx.scene, ctx.camera); ctx.labelRenderer.render(ctx.scene, ctx.camera); },
      onFrame: function (f) {
        var dt = Math.min(f.dt, 0.05); ctx.now = f.now; ctx.dt = dt; ctx.f = f;
        def.frame && def.frame(ctx, f, dt);
        if (ctx.P.camGoal) { ctx.camera.position.lerp(ctx.P.camGoal.pos, 0.08); ctx.controls.target.lerp(ctx.P.camGoal.target, 0.08); if (ctx.camera.position.distanceTo(ctx.P.camGoal.pos) < 0.05) ctx.P.camGoal = null; }
        if (f.now - lastSync > 0.15) { lastSync = f.now; syncHud(); if (calcCard && def.calc) { var h = def.calc(ctx); if (h !== lastCalc) { lastCalc = h; calcCard.innerHTML = h; } } ctx.redraw(); def.sync && def.sync(ctx); }
        ctx.controls.update(); ctx.renderer.render(ctx.scene, ctx.camera); ctx.labelRenderer.render(ctx.scene, ctx.camera);
      },
      init: function (k) {
        kit = k; ctx.kit = k; ctx.kit = k; ctx.kit = k; var cont = k.viewport, v0 = (def.views || [{ pos: [0, 6, 22], target: [0, 3, 0] }])[0];
        var scene = ctx.scene = new T.Scene(), cam = ctx.camera = new T.PerspectiveCamera(45, 1, 0.1, 400); cam.position.set(v0.pos[0], v0.pos[1], v0.pos[2]);
        var r = ctx.renderer = new T.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); cont.appendChild(r.domElement);
        var lr = ctx.labelRenderer = new T.CSS2DRenderer(); lr.domElement.className = 'labels-layer'; cont.appendChild(lr.domElement);
        var c = ctx.controls = new T.OrbitControls(cam, r.domElement); c.enableDamping = true; c.dampingFactor = 0.06; c.minDistance = def.minDist || 5; c.maxDistance = def.maxDist || 80; c.target.set(v0.target[0], v0.target[1], v0.target[2]);
        c.addEventListener('start', function () { ctx.P.camGoal = null; });
        scene.add(new T.AmbientLight(0xffffff, 0.85)); var dl = new T.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 16, 12); scene.add(dl); var dl2 = new T.DirectionalLight(0x88aaff, 0.4); dl2.position.set(-8, 4, -8); scene.add(dl2);
        k.cfg.onTheme(k.state.theme); def.build(ctx); resize(); ctx.refreshStages(); syncHud(); def.afterInit && def.afterInit(ctx);
      },
      help: def.help || { intro: "Follow the lesson with the player or explore freely in the “Lab” tab. With “Back to the lesson” the script takes control again.", items: [] }
    });
    ctx.refreshStages();
    window.__sim = ctx;
    return ctx;
  }
  window.MSim = { create: create, mol: mol, EL: EL, sci: sci };
})();


(function () {
  var T = THREE;
  var SOL = { eter: { n: "Diethyl ether", d: 0.71, c: 0xfff3bf }, ac: { n: "Ethyl acetate", d: 0.90, c: 0xffe8cc }, dcm: { n: "Dichloromethane", d: 1.33, c: 0xd0ebff } };
  var CMP = { neu: { n: "Neutral compound", K: 6, kind: 'n', pKa: 0, c: 0xff6b6b }, acid: { n: "Benzoic acid", K: 8, kind: 'a', pKa: 4.2, c: 0xff922b }, base: { n: "Aniline", K: 7, kind: 'b', pKa: 4.6, c: 0x845ef7 } };
  var S = { sol: 'eter', cmp: 'neu', r: 1, n: 1, pH: 7, p: 0 }, lab = [], parts = [], fun = null, top = null, bot = null, g = null;
  function fn(c, pH) { if (c.kind === 'a') return 1 / (1 + Math.pow(10, pH - c.pKa)); if (c.kind === 'b') return 1 / (1 + Math.pow(10, c.pKa - pH)); return 1; }
  function D() { var c = CMP[S.cmp]; return c.K * fn(c, S.pH); }
  function Eorg(n, r, d) { return 1 - Math.pow(1 / (1 + d * r / n), n); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.3, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ["Principle of extraction", "Fundamentals", "A solute is distributed between two immiscible solvents according to its affinity",
        "<p><b>Liquid–liquid extraction</b> transfers a solute from one phase (usually aqueous) to an <b>immiscible</b> organic solvent. The phase of <b>lower density stays on top</b>: ether (0.71) and ethyl acetate (0.90) above water; dichloromethane (1.33) stays <b>below</b>. A <b>separatory funnel</b> is used: shake, vent the pressure and separate the phases.</p>"],
      ["Partition coefficient", "Partition K", "K = [solute]organic / [solute]aqueous at equilibrium",
        "<p>At equilibrium, the solute is distributed according to the <b>partition coefficient</b> K = C<sub>org</sub>/C<sub>aq</sub>. With volumes V<sub>org</sub> and V<sub>aq</sub>, the fraction extracted in one stage is <b>E = K·r/(1 + K·r)</b> with r = V<sub>org</sub>/V<sub>aq</sub>. Change K and r and watch how the dots redistribute between the two phases.</p>"],
      ["Several small extractions", "Multiple", "With the same total volume, n portions extract more than one large one",
        "<p>With the same total volume of organic solvent, <b>several extractions with small portions</b> recover more solute than a single large one. The fraction remaining in the water after n stages is <b>(1/(1 + K·r/n))<sup>n</sup></b>. Usually 3 extractions are a good compromise between yield and work.</p>"],
      ["Acid–base extraction", "Acid–base", "An acid or base becomes water-soluble when it ionizes: the pH controls which phase it is in",
        "<p>A <b>carboxylic acid</b> is neutral (organic-soluble) at pH &lt; pKa and an <b>ionic carboxylate</b> (water-soluble) at pH &gt; pKa. With NaHCO₃ it is extracted into the aqueous phase; on acidifying with HCl it is recovered. With an <b>amine</b> the opposite happens: HCl turns it into an aqueous salt. The effective coefficient is <b>D = K·f<sub>neutral</sub></b>. This is how acids, bases and neutral compounds are separated from a mixture.</p>"],
      ["Laboratory technique", "Technique", "Shake, vent, let it separate and drain the lower phase",
        "<p>Good practice: close the <b>stopcock</b> before adding; invert and <b>vent</b> (especially with ether and with NaHCO₃, which releases CO₂); shake gently; let it <b>settle</b>; remove the stopper before draining; <b>keep both phases</b> until finished. Dry the organic phase with anhydrous Na₂SO₄ or MgSO₄ and evaporate the solvent.</p>"]
    ];
  }
  var def = {
    key: 'extraccion-liquido-liquido', title: "Liquid–liquid extraction", subtitle: "3D simulator · organic chemistry", accent: { dark: '#69db7c', light: '#2b8a3e' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 4, 20], target: [0, 1, 0] }, { id: 'frontal', label: "Front", pos: [0, 1, 22], target: [0, 1, 0] }, { id: 'sup', label: "Top", pos: [0, 22, 4], target: [0, 1, 0] }],
    layers: [{ id: 'sol', label: "Solute molecules", icon: '•' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var glass = mat(0xa5d8ff, 0.22), i;
      fun = new T.Mesh(new T.CylinderGeometry(4.5, 1.1, 11, 28, 1, true), glass); fun.position.y = 2; g.add(fun);
      var cap = new T.Mesh(new T.SphereGeometry(4.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass); cap.position.y = 7.5; g.add(cap);
      var st = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 3, 12), mat(0x495057, 1)); st.position.y = -4.8; g.add(st);
      var key = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1.8, 8), mat(0xe03131, 1)); key.rotation.z = Math.PI / 2; key.position.y = -4.4; g.add(key);
      top = new T.Mesh(new T.CylinderGeometry(4, 3.0, 4, 28), mat(0xfff3bf, 0.5)); g.add(top); bot = new T.Mesh(new T.CylinderGeometry(3.0, 1.2, 4, 28), mat(0x74c0fc, 0.5)); g.add(bot);
      for (i = 0; i < 110; i++) { var m = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), mat(0xff6b6b, 1)); m.userData = { u: Math.random(), a: Math.random() * 6.28, ph: Math.random() * 6.28 }; g.add(m); parts.push(m); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now, so = SOL[S.sol], c = CMP[S.cmp];
      if (!P.manual) { var i = f.i; S.p = Math.min(1, f.local * 1.2); if (i === 0) { S.r = 1; S.n = 1; S.cmp = 'neu'; S.pH = 7; } else if (i === 1) { S.cmp = 'neu'; S.n = 1; S.r = 0.5 + 1.5 * Math.abs(Math.sin(f.local * 3.14)); } else if (i === 2) { S.cmp = 'neu'; S.r = 1; S.n = 1 + Math.round(f.local * 4); } else if (i === 3) { S.cmp = 'acid'; S.n = 1; S.r = 1; S.pH = 1 + 9 * f.local; } else { S.cmp = 'neu'; S.n = 3; } }
      var d = D(), E = Eorg(S.n, S.r, d), orgTop = so.d < 1, ph = 0.5 + 0.5 * S.r / (1 + S.r), Hs = 9, hO = Hs * S.r / (1 + S.r), hA = Hs - hO, y0 = -2.2;
      var yA = y0, yO;
      if (orgTop) { bot.scale.y = hA / 4; bot.position.y = y0 + hA / 2; top.scale.y = hO / 4; top.position.y = y0 + hA + hO / 2; bot.material.color.setHex(0x74c0fc); top.material.color.setHex(so.c); }
      else { bot.scale.y = hO / 4; bot.position.y = y0 + hO / 2; top.scale.y = hA / 4; top.position.y = y0 + hO + hA / 2; bot.material.color.setHex(so.c); top.material.color.setHex(0x74c0fc); }
      var orgLo = orgTop ? y0 + hA : y0, aqLo = orgTop ? y0 : y0 + hO, sOn = ctx.layer('sol'), nOrg = Math.round(110 * E * Math.min(1, S.p + 0.15));
      parts.forEach(function (m, j) { var inOrg = j < nOrg, lo = inOrg ? orgLo : aqLo, h = inOrg ? hO : hA; m.material.color.setHex(inOrg ? c.c : 0x228be6); m.position.set(Math.cos(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u), lo + 0.3 + (h - 0.6) * ((m.userData.u * 7 + Math.sin(now * 0.8 + m.userData.ph) * 0.1) % 1), Math.sin(m.userData.a + now * 0.3) * 2.2 * Math.sqrt(m.userData.u)); m.visible = sOn && h > 0.5; });
      g.rotation.y = now * 0.15;
      lab[0].pos(0, 9.5, 0).set(so.n + ' (' + (orgTop ? "up" : "down") + ', d = ' + fmt(so.d, 2) + ')', 'bl-lead').vis(true);
      lab[1].pos(6.5, orgTop ? y0 + hA + hO / 2 : y0 + hO + hA / 2, 0).set(orgTop ? "Organic phase" : "Aqueous phase", 'bl-d').vis(true);
      lab[2].pos(6.5, orgTop ? y0 + hA / 2 : y0 + hO / 2, 0).set(orgTop ? "Aqueous phase" : "Organic phase", 'bl-d').vis(true);
      lab[3].pos(0, -7.8, 0).set("Extracted: " + fmt(E * 100, 1) + ' % · D = ' + fmt(d, 2), E > 0.9 ? 'bl-pos' : 'bl-neg').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sol) u.sol.set(S.sol); if (u.cmp) u.cmp.set(S.cmp); if (u.r) u.r.set(S.r); if (u.n) u.n.set(S.n); if (u.pH) u.pH.set(S.pH); },
    hud: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return { eq: { chip: fmt(E * 100, 0) + '%', name: c.n, body: '<div class="eqline"><small>K</small>' + fmt(c.K, 1) + "</div><div class=\"eqline\"><small>Effective D</small>" + fmt(d, 2) + "</div><div class=\"eqline\"><small>Stages</small>" + S.n + ' × ' + fmt(S.r / S.n, 2) + " V</div><div class=\"eqline\"><small>Recovered</small>" + fmt(E * 100, 1) + " % in organic</div>" }, legend: [{ label: "Orange dot", color: '#ff922b', text: "solute in the organic phase" }, { label: "Blue dot", color: '#228be6', text: "solute in the aqueous phase" }] }; },
    measures: function () { var c = CMP[S.cmp], d = D(), E = Eorg(S.n, S.r, d); return [["Solute", c.n], ["Solvent", SOL[S.sol].n], ['K', fmt(c.K, 1)], ["Aqueous pH", fmt(S.pH, 1)], ['D = K·f', fmt(d, 2)], ["Extractions", String(S.n)], ["% extracted", fmt(E * 100, 1) + ' %']]; },
    ideas: ["Several small portions > one large one.", "Carboxylic acid: organic at pH < pKa; aqueous at pH > pKa.", "Amine: organic at high pH; aqueous at low pH.", "Vent the funnel to release the pressure."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("System"); el.appendChild(c);
      ui.sol = kit.ui.options({ label: "Organic solvent", cols: 1, value: S.sol, options: Object.keys(SOL).map(function (k) { return { v: k, label: SOL[k].n, sub: 'd = ' + SOL[k].d }; }), onChange: function (v) { ctx.goManual(); S.sol = v; } }); c.appendChild(ui.sol);
      ui.cmp = kit.ui.options({ label: "Solute", cols: 1, value: S.cmp, options: Object.keys(CMP).map(function (k) { return { v: k, label: CMP[k].n, sub: 'K = ' + CMP[k].K + (CMP[k].pKa ? ' · pKa ' + CMP[k].pKa : '') }; }), onChange: function (v) { ctx.goManual(); S.cmp = v; } }); c.appendChild(ui.cmp);
      ui.r = kit.ui.slider({ label: "Total organic / aqueous volume", min: 0.2, max: 3, step: 0.1, value: S.r, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.r = v; } });
      ui.n = kit.ui.slider({ label: "No. of extractions", min: 1, max: 6, step: 1, value: S.n, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.pH = kit.ui.slider({ label: "pH of the aqueous phase", min: 0, max: 14, step: 0.1, value: S.pH, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.pH = v; } });
      c.appendChild(kit.ui.sliders([ui.r, ui.n, ui.pH])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "% extracted by no. of extractions", h: 230, note: "Constant total organic volume, split into n portions.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, d = D(), n, bw = pw / 8; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center';
        for (n = 1; n <= 8; n++) { var e = Eorg(n, S.r, d); cx.fillStyle = n === S.n ? '#40c057' : '#4dabf7'; cx.fillRect(L + (n - 1) * bw + 4, Tp + ph * (1 - e), bw - 8, ph * e); cx.fillStyle = col.ink; cx.fillText(fmt(e * 100, 0), L + (n - 1) * bw + bw / 2, Tp + ph * (1 - e) - 3); cx.fillStyle = col.muted; cx.fillText(n, L + (n - 1) * bw + bw / 2, h - B + 14); }
        cx.fillText("no. of extractions", L + pw / 2, h - 6);
      } },
      { title: "Effective D and % extracted versus pH", h: 230, note: "Acid: extraction drops at pH > pKa. Base: the opposite.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i, k; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 14; i += 2) cx.fillText(i, L + pw * i / 14, h - B + 14); cx.fillText('pH', L + pw / 2, h - 6);
        ['acid', 'base'].forEach(function (key, j) { var c = CMP[key]; cx.strokeStyle = j ? '#845ef7' : '#ff922b'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 70; i++) { var pH = i / 5, e = Eorg(S.n, S.r, c.K * fn(c, pH)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * pH / 14, Tp + ph * (1 - e)); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * S.pH / 14, Tp); cx.lineTo(L + pw * S.pH / 14, Tp + ph); cx.stroke(); cx.setLineDash([]); cx.textAlign = 'left'; cx.fillStyle = '#ff922b'; cx.fillText("benzoic acid", L + 6, Tp + 12); cx.fillStyle = '#845ef7'; cx.fillText("aniline", L + 6, Tp + 24);
      } }
    ],
    calc: function () {
      var c = CMP[S.cmp], f = fn(c, S.pH), d = D(), E1 = Eorg(1, S.r, d), E = Eorg(S.n, S.r, d), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('K', fmt(c.K, 1)) + (c.kind !== 'n' ? row("Neutral fraction f", fmt(f, 4) + ' (pH ' + fmt(S.pH, 1) + ', pKa ' + c.pKa + ')') : '') + row('D = K·f', fmt(d, 3)) + row('r = V<sub>org</sub>/V<sub>ac</sub>', fmt(S.r, 2)) + row("1 stage: E = D·r/(1 + D·r)", fmt(E1 * 100, 1) + ' %') + row(S.n + " stages of r/" + S.n, '<b>' + fmt(E * 100, 1) + ' %</b>') + row("Stays in water", fmt((1 - E) * 100, 2) + ' %') + '</table>';
    },
    quiz: [
      { q: "Dichloromethane (d = 1.33) with water ends up…", options: ["down", "up", "emulsified", "in the middle"], answer: 0, why: "Denser than water." },
      { q: "With the same total volume, it is better to use…", options: ["several small extractions", "one large one", "none", "evaporate"], answer: 0, why: "(1/(1+Kr/n))ⁿ decreases as n increases." },
      { q: "A carboxylic acid passes into the aqueous phase when the pH is…", options: ["greater than its pKa", "lower than its pKa", "always equal to 7", "below 0"], answer: 0, why: "It ionizes to the carboxylate." },
      { q: "An amine is extracted into water with…", options: ["dilute HCl", "NaOH", 'Na₂SO₄', "ethanol"], answer: 0, why: "It forms the water-soluble ammonium salt." },
      { q: "When shaking with ether you must…", options: ["vent the funnel", "close it hermetically", "heat", "add salt"], answer: 0, why: "Ether is volatile and the pressure rises." },
      { q: "K = 6 and r = 1: the fraction extracted in one stage is…", options: ['6/7 ≈ 86 %', '50 %', '14 %', '100 %'], answer: 0, why: 'E = Kr/(1 + Kr).' }
    ],
    help: { intro: "Choose the solvent, solute, volume and number of extractions; with an acid or base change the pH. The orange dots are in the organic phase.", items: [["Upper layer", "less dense phase."], ["Dots", "distributed solute molecules."]] }
  };
  MSim.create(def);
})();
