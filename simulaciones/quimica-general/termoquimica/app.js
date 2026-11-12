/* Termoquímica y calorimetría — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

(function () {
  var fmt = SimKit.fmt, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var METAL = { Cu: { n: 'cobre', c: 0.385, col: 0xc88033 }, Fe: { n: 'hierro', c: 0.449, col: 0x8b8f98 }, Al: { n: 'aluminio', c: 0.897, col: 0xc9d1d9 }, Pb: { n: 'plomo', c: 0.129, col: 0x6b7280 } };
  var RXN = { neu: { n: 'HCl + NaOH → NaCl + H₂O', dH: -57.1, desc: 'neutralización' }, naoh: { n: 'NaOH(s) → Na⁺(ac) + OH⁻(ac)', dH: -44.5, desc: 'disolución de NaOH' }, cacl2: { n: 'CaCl₂(s) → Ca²⁺(ac) + 2 Cl⁻(ac)', dH: -82.8, desc: 'disolución de CaCl₂' }, nh4no3: { n: 'NH₄NO₃(s) → NH₄⁺(ac) + NO₃⁻(ac)', dH: 25.7, desc: 'disolución de NH₄NO₃' } };
  var FUEL = { ch4: { f: 'CH₄', n: 'metano', hf: -74.8, co2: 1, h2o: 2, o2: 2 }, c3h8: { f: 'C₃H₈', n: 'propano', hf: -103.8, co2: 3, h2o: 4, o2: 5 }, etoh: { f: 'C₂H₅OH', n: 'etanol', hf: -277.7, co2: 2, h2o: 3, o2: 3 }, glu: { f: 'C₆H₁₂O₆', n: 'glucosa', hf: -1273, co2: 6, h2o: 6, o2: 6 } };
  var HF_CO2 = -393.5, HF_H2O = -285.8;
  var S = { mode: 'metal', metal: 'Cu', mm: 100, Tm: 100, mw: 100, Tw: 20, rx: 'neu', n: 0.05, V: 100, Ccal: 10, fuel: 'ch4', pr: 0, run: false, hess: 0 };
  var G = {}, lab = {}, LAD, cupG, blockM, liqM, haloM, therm, thermCol, dots, dpos = [];
  function mt() { return METAL[S.metal]; }
  function Tfin() { var a = S.mm * mt().c, b = S.mw * 4.18; return (a * S.Tm + b * S.Tw) / (a + b); }
  function qMetal() { return S.mw * 4.18 * (Tfin() - S.Tw); }                    // J
  function dTcal() { return -RXN[S.rx].dH * 1000 * S.n / (S.V * 4.18 + S.Ccal); }
  function sprog() { var p = SimKit.clamp(S.pr, 0, 1); return (1 - Math.exp(-4 * p)) / (1 - Math.exp(-4)); }
  function dHcomb(fu) { var u = FUEL[fu]; return u.co2 * HF_CO2 + u.h2o * HF_H2O - u.hf; }
  function Tnow() { var p = sprog(); if (S.mode === 'metal') return S.Tw + (Tfin() - S.Tw) * p; if (S.mode === 'cal') return 22 + dTcal() * p; return 22; }
  function TmNow() { return S.Tm + (Tfin() - S.Tm) * sprog(); }
  var HESS = [
    { t: 'C(s) + O₂(g) → CO₂(g)', levels: [['C(s) + O₂(g)', 0], ['CO(g) + ½ O₂(g)', -110.5], ['CO₂(g)', -393.5]], arrows: [[0, 1, 'ΔH₁ = −110,5'], [1, 2, 'ΔH₂ = −283,0'], [0, 2, 'ΔH = −393,5']], sum: 'ΔH = ΔH₁ + ΔH₂ = −110,5 + (−283,0) = −393,5 kJ' },
    { t: '2 C(s) + 2 H₂(g) → C₂H₄(g) + …', levels: [['C(graf) + O₂(g)', 0], ['CO(g) + ½ O₂(g)', -110.5], ['CO₂(g)', -393.5]], arrows: [], sum: '' }
  ];

  function ladder(ctx) {
    var T = ctx.T, lv, ar, title;
    if (S.mode === 'dh') { var r = RXN[S.rx], exo = r.dH < 0; lv = [['Reactivos', exo ? 0 : r.dH * 0 - 0], ['Productos', r.dH]]; if (!exo) lv = [['Reactivos', 0], ['Productos', r.dH]]; ar = [[0, 1, 'ΔH = ' + (r.dH > 0 ? '+' : '') + f1(r.dH) + ' kJ/mol']]; title = r.desc + (exo ? ' · exotérmica' : ' · endotérmica'); }
    else if (S.mode === 'hess') { var H = HESS[0]; lv = H.levels; ar = H.arrows; title = H.t; }
    else { var u = FUEL[S.fuel], dc = dHcomb(S.fuel), prod = u.co2 * HF_CO2 + u.h2o * HF_H2O; lv = [['Elementos (ΔH°f = 0)', 0], [u.f + ' + ' + u.o2 + ' O₂', u.hf], [u.co2 + ' CO₂ + ' + u.h2o + ' H₂O(l)', prod]]; ar = [[0, 1, 'ΔH°f(' + u.f + ') = ' + f1(u.hf)], [0, 2, 'ΣΔH°f(prod.) = ' + f1(prod)], [1, 2, 'ΔH°c = ' + f1(dc)]]; title = 'Combustión de ' + u.n; }
    return { lv: lv, ar: ar, title: title };
  }
  function Hmin(lv) { var mn = 0, mx = 0; lv.forEach(function (l) { mn = Math.min(mn, l[1]); mx = Math.max(mx, l[1]); }); return [mn, mx]; }
  function hOf(H, rng) { var span = Math.max(1, rng[1] - rng[0]); return 1.2 + (H - rng[0]) / span * 7.5; }

  function buildLadder(ctx) {
    var T = ctx.T; if (LAD.g) { ctx.scene.remove(LAD.g); } LAD.g = new T.Group(); ctx.scene.add(LAD.g); LAD.labs.forEach(function (l) { l.vis(false); l.o.parent && l.o.parent.remove(l.o); }); LAD.labs = [];
    var d = ladder(ctx), rng = Hmin(d.lv), n = d.lv.length, xs = d.lv.length === 2 ? [-2.2, 2.2] : [-4, 0, 4];
    d.lv.forEach(function (l, i) {
      var y = hOf(l[1], rng), b = new T.Mesh(new T.BoxGeometry(3, 0.22, 2.2), new T.MeshStandardMaterial({ color: [0x5cb3ff, 0xe3b341, 0x38a169][i % 3] })); b.position.set(xs[i], y, 0); LAD.g.add(b);
      var L = ctx.label(l[0] + ' · ' + f1(l[1]) + ' kJ', 'bl-d'); L.pos(xs[i] + 5.2 + 0, y + 0.8, 0); LAD.labs.push(L); LAD.g.add(L.o);
      L.o.position.set(xs[i], y + 0.7, 0);
    });
    d.ar.forEach(function (a, k) {
      var y0 = hOf(d.lv[a[0]][1], rng), y1 = hOf(d.lv[a[1]][1], rng), last = d.lv.length - 1, direct = (a[0] === 0 && a[1] === last && d.ar.length > 1 && d.lv.length === 3);
      var xx = d.lv.length === 2 ? 0 : xs[a[1]] + (direct ? 0.9 : -0.9), len = Math.abs(y1 - y0); if (len < 0.05) return;
      var col = y1 < y0 ? 0xff6b3d : 0x4fa3ff;
      var c = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, Math.max(0.1, len - 0.4), 8), new T.MeshBasicMaterial({ color: col })); c.position.set(xx, (y0 + y1) / 2 + (y1 < y0 ? -0.0 : 0), 0.5); LAD.g.add(c);
      var cone = new T.Mesh(new T.ConeGeometry(0.25, 0.5, 12), new T.MeshBasicMaterial({ color: col })); cone.position.set(xx, y1 + (y1 < y0 ? 0.25 : -0.25), 0.5); cone.rotation.z = y1 < y0 ? Math.PI : 0; LAD.g.add(cone);
      var L = ctx.label(a[2], y1 < y0 ? 'bl-warn' : 'bl-lead'); L.o.position.set(xx + (direct ? 2.0 : -2.0) * (d.lv.length === 2 ? -1.6 : 1), (y0 + y1) / 2, 0.5); LAD.g.add(L.o); LAD.labs.push(L);
    });
    var tl = ctx.label(d.title, 'bl-lead'); tl.o.position.set(0, 10.4, 0); LAD.g.add(tl.o); LAD.labs.push(tl);
    LAD.key = S.mode + S.rx + S.fuel; LAD.g.position.x = 4; LAD.g.position.z = 0;
  }

  function stagesTxt() {
    var m = mt(), r = RXN.neu, dc = dHcomb('ch4'), tf = (100 * 0.385 * 100 + 100 * 4.18 * 20) / (100 * 0.385 + 100 * 4.18);
    return [
      ['Sistema y alrededores', 'Sistema', 'La energía se transfiere como calor entre sistema y alrededores',
        '<p>El <b>sistema</b> es la parte que estudiamos (el bloque de metal, la reacción) y los <b>alrededores</b> todo lo demás (el agua del calorímetro). El calor <b>q</b> fluye de lo caliente a lo frío.</p><p>Convención: <b>q &gt; 0</b> si el sistema <b>absorbe</b> calor (endotérmico) y <b>q &lt; 0</b> si lo <b>libera</b> (exotérmico). En un sistema aislado, q<sub>sistema</sub> + q<sub>alrededores</sub> = 0.</p>'],
      ['q = m·c·ΔT', 'm·c·ΔT', 'Un bloque caliente cede calor al agua hasta el equilibrio térmico',
        '<p>El calor intercambiado es <b>q = m · c · ΔT</b>. Un bloque de ' + S.mm + ' g de ' + m.n + ' (c = ' + m.c + ' J/g·°C) a ' + S.Tm + ' °C se sumerge en ' + S.mw + ' g de agua (c = 4,18) a ' + S.Tw + ' °C. Como el calor cedido = el absorbido: <b>m₁c₁(T<sub>f</sub> − T₁) = −m₂c₂(T<sub>f</sub> − T₂)</b> → <b>T<sub>f</sub> = ' + f2(Tfin()) + ' °C</b>. El agua tiene un c muy alto: cambia poco su temperatura.</p>'],
      ['Calorimetría', 'Calorimetría', 'En el calorímetro, ΔT mide el calor de la reacción',
        '<p>En un calorímetro a presión constante, <b>q<sub>reacción</sub> = −(m·c + C<sub>cal</sub>)·ΔT</b> y <b>ΔH = q / n</b>. Para la neutralización HCl + NaOH (ΔH = ' + r.dH + ' kJ/mol) con 0,050 mol en 100 mL: ΔT = ' + f2(57.1 * 1000 * 0.05 / (100 * 4.18)) + ' °C (sin pérdidas ni C<sub>cal</sub>).</p>'],
      ['Exo y endotérmico', 'Entalpía', 'ΔH &lt; 0: los productos tienen menos entalpía; ΔH &gt; 0: más',
        '<p>La <b>entalpía</b> H es el calor a presión constante. <b>ΔH = H<sub>productos</sub> − H<sub>reactivos</sub></b>. En una reacción <b>exotérmica</b> (ΔH &lt; 0, p. ej. neutralización −57,1 kJ/mol) la energía baja y el entorno se calienta; en una <b>endotérmica</b> (ΔH &gt; 0, p. ej. NH₄NO₃ disolviéndose +25,7 kJ/mol) sube y el entorno se enfría.</p>'],
      ['Ley de Hess', 'Hess', 'ΔH depende solo de los estados inicial y final',
        '<p>La entalpía es una <b>función de estado</b>: da igual el camino. C(s) + ½O₂ → CO (−110,5) y CO + ½O₂ → CO₂ (−283,0) suman <b>−393,5 kJ</b>, igual que la reacción directa C + O₂ → CO₂. Al <b>invertir</b> una reacción cambia el signo de ΔH; al <b>multiplicarla</b>, ΔH se multiplica.</p>'],
      ['Entalpías de formación', 'ΔH°f', 'ΔH°<sub>reacción</sub> = Σ ΔH°f(productos) − Σ ΔH°f(reactivos)',
        '<p>Usando elementos (ΔH°f = 0) como referencia: para la combustión del metano, ΔH° = [−393,5 + 2(−285,8)] − [−74,8] = <b>' + f1(dc) + ' kJ/mol</b>. Es el mismo número que se obtiene por la ley de Hess en el ciclo con elementos.</p>']
    ];
  }

  var def = {
    key: 'termoquimica', title: 'Termoquímica y calorimetría', subtitle: 'Simulador 3D · química general', accent: { dark: '#fca5a5', light: '#b91c1c' },
    stages: stagesTxt, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 7, 24], target: [0, 4.2, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 5, 22], target: [0, 4, 0] }, { id: 'cup', label: 'Calorímetro', pos: [-4, 5, 13], target: [-4, 3.2, 0] }, { id: 'lad', label: 'Diagrama', pos: [4, 6, 20], target: [4, 5, 0] }],
    stageViews: ['cup', 'cup', 'cup', 'lad', 'lad', 'lad'],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; LAD = { labs: [], g: null, key: '' };
      cupG = new T.Group(); cupG.position.set(-4.5, 0, 0); s.add(cupG);
      var gm = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.16, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
      var cup = new T.Mesh(new T.CylinderGeometry(2.4, 2.1, 4.6, 36, 1, true), gm); cup.position.y = 2.3; cupG.add(cup);
      var cb = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 0.2, 36), new T.MeshStandardMaterial({ color: 0xaecdee, transparent: true, opacity: 0.6 })); cb.position.y = 0.1; cupG.add(cb);
      liqM = new T.MeshStandardMaterial({ color: 0x6bb8ff, transparent: true, opacity: 0.5, roughness: 0.2 }); var liq = new T.Mesh(new T.CylinderGeometry(2.3, 2.05, 1, 36), liqM); cupG.add(liq); liqM.userData = { mesh: liq };
      haloM = new T.MeshBasicMaterial({ color: 0xff5a3d, transparent: true, opacity: 0, depthWrite: false, side: T.BackSide }); var hm = new T.Mesh(new T.CylinderGeometry(2.7, 2.4, 4.8, 36, 1, true), haloM); hm.position.y = 2.4; cupG.add(hm);
      blockM = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xc88033, roughness: 0.4, metalness: 0.5 })); cupG.add(blockM);
      var tube = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 7, 12, 1, true), gm); tube.position.set(3.4, 3.7, 0); cupG.add(tube);
      thermCol = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1, 10), new T.MeshBasicMaterial({ color: 0xff3030 })); cupG.add(thermCol); var bulb = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), new T.MeshBasicMaterial({ color: 0xff3030 })); bulb.position.set(3.4, 0.35, 0); cupG.add(bulb);
      var sg = new T.SphereGeometry(1, 8, 6); dots = new T.InstancedMesh(sg, new T.MeshStandardMaterial({ color: 0xcfeaff }), 80); dots.frustumCulled = false; cupG.add(dots);
      for (var q = 0; q < 80; q++) dpos.push({ x: (Math.random() - 0.5) * 3.6, y: Math.random() * 3, z: (Math.random() - 0.5) * 3.6, vx: Math.random() - 0.5, vy: Math.random() - 0.5, vz: Math.random() - 0.5 });
      var plate = new T.Mesh(new T.BoxGeometry(22, 0.3, 8), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.8 })); plate.position.set(0, -0.15, 0); s.add(plate); LAD.plate = plate;
      lab.T = ctx.label('', 'bl-lead'); lab.s = ctx.label('', 'bl-d'); lab.m = ctx.label('', 'bl-warn'); lab.q = ctx.label('', 'bl-d');
      cupG.add(lab.T.o); cupG.add(lab.s.o); cupG.add(lab.m.o); cupG.add(lab.q.o);
      buildLadder(ctx);
    },
    frame: function (ctx, f, dt) {
      var i = f.i;
      if (!ctx.P.manual) {
        var m = ['metal', 'metal', 'cal', 'dh', 'hess', 'hf'][i]; S.mode = m; S.pr = i === 0 ? 0 : (i <= 2 ? f.local : 1);
        if (i === 3) S.rx = f.local < 0.5 ? 'neu' : 'nh4no3';
        if (i === 2) { S.rx = 'neu'; S.n = 0.05; S.V = 100; S.Ccal = 0; } if (i < 2) { S.mm = 100; S.Tm = 100; S.mw = 100; S.Tw = 20; S.metal = 'Cu'; } if (i === 5) S.fuel = 'ch4';
      } else if (S.run) { S.pr = Math.min(1, S.pr + dt / 7); if (S.pr >= 1) S.run = false; }
      var key = S.mode + S.rx + S.fuel; var showLad = S.mode === 'dh' || S.mode === 'hess' || S.mode === 'hf';
      if (showLad && LAD.key !== key) buildLadder(ctx);
      LAD.g.visible = showLad; cupG.visible = !showLad; LAD.plate.visible = !showLad; if (showLad) ['T', 's', 'm', 'q'].forEach(function (k) { lab[k].vis(false); }); LAD.labs.forEach(function (l) { l.vis(showLad); });
      if (!showLad) {
        var Tn = Tnow(), hl = 2.9; var liq = liqM.userData.mesh; liq.scale.y = hl; liq.position.y = 0.2 + hl / 2;
        var hot = S.mode === 'metal', sz = Math.cbrt(S.mm) * 0.32;
        blockM.visible = hot; blockM.scale.set(sz, sz, sz);
        var drop = clamp(sprog() * 8, 0, 1), yb = 8 - drop * (8 - (0.2 + hl * 0.45)); if (S.pr <= 0.001) yb = 7.5; blockM.position.set(0, yb, 0);
        var tc = clamp((TmNow() - 20) / 90, 0, 1), c0 = new ctx.T.Color(mt().col), cH = new ctx.T.Color(0xff4d1a); blockM.material.color.copy(c0).lerp(cH, tc * 0.9); blockM.material.emissive.copy(cH).multiplyScalar(tc * 0.55);
        var lc = new ctx.T.Color(0x6bb8ff).lerp(new ctx.T.Color(Tn > 22 ? 0xffd0a0 : 0xa8e4ff), clamp(Math.abs(Tn - 22) / 20, 0, 0.6)); liqM.color.copy(lc);
        var dT = S.mode === 'cal' ? dTcal() * sprog() : (Tn - S.Tw); haloM.color.setHex(dT >= 0 ? 0xff5a3d : 0x4fa3ff); haloM.opacity = clamp(Math.abs(dT) / 12, 0, 0.45) * (S.mode === 'metal' && S.pr === 0 ? 0 : 1);
        var th = 0.4 + clamp((Tn + 5) / 105, 0, 1.1) * 6; thermCol.scale.y = th; thermCol.position.set(3.4, 0.35 + th / 2, 0);
        var sp = 0.6 + 1.8 * Math.sqrt(Math.max(Tn, -20) + 273) / 17; dpos.forEach(function (p, q) { p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.z += p.vz * sp * dt; if (p.x * p.x + p.z * p.z > 3.4) { p.vx *= -1; p.vz *= -1; p.x *= 0.95; p.z *= 0.95; } if (p.y < 0.3) { p.y = 0.3; p.vy = Math.abs(p.vy); } if (p.y > hl) { p.y = hl; p.vy = -Math.abs(p.vy); } });
        var dm = new ctx.T.Object3D(); dots.count = 80; dpos.forEach(function (p, q) { dm.position.set(p.x, p.y + 0.2, p.z); dm.scale.setScalar(0.1); dm.updateMatrix(); dots.setMatrixAt(q, dm.matrix); }); dots.instanceMatrix.needsUpdate = true;
        lab.T.pos(0, 6.1 - (hot ? 0 : 0.4), 0).set('T agua = ' + f2(Tn) + ' °C', 'bl-lead').vis(true);
        lab.s.pos(0, -0.9, 0).set(S.mode === 'metal' ? S.mw + ' g de agua · ' + S.mm + ' g de ' + mt().n : S.V + ' mL · ' + fmt(S.n, 3) + ' mol · ' + RXN[S.rx].desc, 'bl-d').vis(true);
        lab.m.pos(0, yb + sz / 2 + 0.8, 0).set('T metal = ' + f1(TmNow()) + ' °C', 'bl-warn').vis(hot);
        var q = S.mode === 'metal' ? qMetal() * sprog() / 1000 * 1 : -RXN[S.rx].dH * S.n * sprog() * (-1) * -1;
        lab.q.pos(3.4, 8.2, 0).set(S.mode === 'metal' ? 'q agua = ' + f2(qMetal() * sprog() / 1000) + ' kJ' : 'q reacción = ' + f2(RXN[S.rx].dH * S.n * sprog()) + ' kJ', 'bl-d').vis(S.pr > 0);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual) return; u.modeOpts && u.modeOpts.set(S.mode); },
    hud: function () {
      var body;
      if (S.mode === 'metal') body = '<div class="eqline"><small>T final (equilibrio)</small>' + f2(Tfin()) + ' °C</div><div class="eqline"><small>q cedido por el metal</small>' + f2(-qMetal() / 1000) + ' kJ</div>';
      else if (S.mode === 'cal') body = '<div class="eqline"><small>ΔH reacción</small>' + RXN[S.rx].dH + ' kJ/mol</div><div class="eqline"><small>ΔT del calorímetro</small>' + (dTcal() > 0 ? '+' : '') + f2(dTcal()) + ' °C</div>';
      else if (S.mode === 'dh') body = '<div class="eqline"><small>ΔH</small>' + RXN[S.rx].dH + ' kJ/mol</div><div class="eqline"><small>Tipo</small>' + (RXN[S.rx].dH < 0 ? 'exotérmica' : 'endotérmica') + '</div>';
      else if (S.mode === 'hess') body = '<div class="eqline"><small>ΔH total</small>−393,5 kJ</div><div class="eqline"><small>Camino</small>−110,5 + (−283,0)</div>';
      else body = '<div class="eqline"><small>ΔH°c (' + FUEL[S.fuel].f + ')</small>' + f1(dHcomb(S.fuel)) + ' kJ/mol</div>';
      return { eq: { chip: 'Termoquímica', name: { metal: 'q = m·c·ΔT', cal: 'q = −(m·c + C)·ΔT', dh: 'ΔH = H prod − H react', hess: 'Ley de Hess', hf: 'ΔH° = ΣΔH°f(p) − ΣΔH°f(r)' }[S.mode], body: body + '<small>c(agua) = 4,18 J/g·°C · presión constante</small>' },
        legend: [{ label: 'Rojo', color: '#ff6b3d', text: 'calor liberado / T alta' }, { label: 'Azul', color: '#4fa3ff', text: 'calor absorbido / T baja' }] };
    },
    measures: function () { var a = [['Modo', { metal: 'Calor específico', cal: 'Calorimetría', dh: 'Entalpía', hess: 'Ley de Hess', hf: 'ΔH°f' }[S.mode]]]; if (S.mode === 'metal') a = a.concat([['Metal', mt().n + ' (c = ' + mt().c + ' J/g°C)'], ['T final', f2(Tfin()) + ' °C'], ['q agua', f2(qMetal() / 1000) + ' kJ'], ['Progreso', fmt(sprog() * 100, 0) + ' %']]); if (S.mode === 'cal') a = a.concat([['Reacción', RXN[S.rx].desc], ['ΔH', RXN[S.rx].dH + ' kJ/mol'], ['n', fmt(S.n, 3) + ' mol'], ['ΔT', f2(dTcal()) + ' °C'], ['q reacción', f2(RXN[S.rx].dH * S.n) + ' kJ']]); if (S.mode === 'hf') a = a.concat([['Combustible', FUEL[S.fuel].f], ['ΔH°c', f1(dHcomb(S.fuel)) + ' kJ/mol']]); return a; },
    ideas: ['<b>q = m·c·ΔT</b>; q &gt; 0 absorbe, q &lt; 0 libera.', 'Calor cedido = calor absorbido en un sistema aislado.', '<b>ΔH = q<sub>p</sub>/n</b>; exotérmica ΔH &lt; 0, endotérmica ΔH &gt; 0.', '<b>Hess</b>: ΔH no depende del camino (función de estado).', '<b>ΔH° = ΣΔH°f(productos) − ΣΔH°f(reactivos)</b>; ΔH°f de un elemento = 0.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Panel de control'); el.appendChild(c);
      ui.modeOpts = kit.ui.options({ label: 'Experimento', cols: 2, value: S.mode, options: [{ v: 'metal', label: 'Metal en agua', sub: 'q = m·c·ΔT' }, { v: 'cal', label: 'Calorímetro', sub: 'ΔH de reacción' }, { v: 'dh', label: 'Entalpía', sub: 'exo / endo' }, { v: 'hess', label: 'Ley de Hess', sub: 'C → CO → CO₂' }, { v: 'hf', label: 'ΔH°f', sub: 'combustión' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.pr = v === 'metal' || v === 'cal' ? 0 : 1; S.run = false; } });
      c.appendChild(ui.modeOpts);
      var f = document.createElement('div'); f.className = 'fld'; c.appendChild(f);
      ui.metalOpts = kit.ui.options({ label: 'Metal', cols: 4, value: S.metal, options: Object.keys(METAL).map(function (k) { return { v: k, label: k, sub: METAL[k].c + '' }; }), onChange: function (v) { ctx.goManual(); S.metal = v; S.pr = 0; } }); c.appendChild(ui.metalOpts);
      ui.sMm = kit.ui.slider({ label: 'm metal', min: 20, max: 200, step: 5, value: S.mm, format: function (v) { return v + ' g'; }, onInput: function (v) { ctx.goManual(); S.mm = v; } });
      ui.sTm = kit.ui.slider({ label: 'T metal', min: 40, max: 200, step: 5, value: S.Tm, format: function (v) { return v + ' °C'; }, onInput: function (v) { ctx.goManual(); S.Tm = v; } });
      ui.sMw = kit.ui.slider({ label: 'm agua', min: 50, max: 300, step: 10, value: S.mw, format: function (v) { return v + ' g'; }, onInput: function (v) { ctx.goManual(); S.mw = v; } });
      ui.sTw = kit.ui.slider({ label: 'T agua', min: 5, max: 40, step: 1, value: S.Tw, format: function (v) { return v + ' °C'; }, onInput: function (v) { ctx.goManual(); S.Tw = v; } });
      c.appendChild(kit.ui.sliders([ui.sMm, ui.sTm, ui.sMw, ui.sTw]));
      ui.rxOpts = kit.ui.options({ label: 'Reacción (calorímetro / entalpía)', cols: 2, value: S.rx, options: Object.keys(RXN).map(function (k) { return { v: k, label: RXN[k].desc, sub: RXN[k].dH + ' kJ/mol' }; }), onChange: function (v) { ctx.goManual(); S.rx = v; if (S.mode === 'cal') S.pr = 0; } }); c.appendChild(ui.rxOpts);
      ui.sN = kit.ui.slider({ label: 'n', min: 0.01, max: 0.2, step: 0.005, value: S.n, format: function (v) { return fmt(v, 3) + ' mol'; }, onInput: function (v) { ctx.goManual(); S.n = v; } });
      ui.sV = kit.ui.slider({ label: 'Volumen', min: 50, max: 250, step: 10, value: S.V, format: function (v) { return v + ' mL'; }, onInput: function (v) { ctx.goManual(); S.V = v; } });
      ui.sC = kit.ui.slider({ label: 'C cal', min: 0, max: 60, step: 1, value: S.Ccal, format: function (v) { return v + ' J/°C'; }, onInput: function (v) { ctx.goManual(); S.Ccal = v; } });
      c.appendChild(kit.ui.sliders([ui.sN, ui.sV, ui.sC]));
      ui.fuelOpts = kit.ui.options({ label: 'Combustible (ΔH°f)', cols: 2, value: S.fuel, options: Object.keys(FUEL).map(function (k) { return { v: k, label: FUEL[k].f, sub: FUEL[k].n }; }), onChange: function (v) { ctx.goManual(); S.fuel = v; } }); c.appendChild(ui.fuelOpts);
      c.appendChild(ctx.btnRow([{ t: '▶ Iniciar', primary: true, fn: function () { ctx.goManual(); S.pr = 0; S.run = true; } }, { t: 'Reiniciar', fn: function () { ctx.goManual(); S.pr = 0; S.run = false; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
      c.insertAdjacentHTML('beforeend', '<p class="muted small">Se supone calor específico de la disolución 4,18 J/g·°C, densidad 1 g/mL, sin pérdidas de calor. Entalpías estándar: valores de tablas (kJ/mol).</p>');
    },
    graphs: [
      { title: 'Temperatura en el tiempo', h: 220, note: 'Metal en agua: ambas curvas convergen a T<sub>f</sub>. Calorímetro: la temperatura sube (exotérmica) o baja (endotérmica). El punto marca el progreso.', draw: function (cx, w, h, c) {
        var L = 42, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, lo, hi, curves = [];
        if (S.mode === 'cal' || S.mode === 'dh') { var d = dTcal(); lo = 22 + Math.min(0, d) - 1; hi = 22 + Math.max(0, d) + 1; curves = [[function (p) { return 22 + d * p; }, '#ff7a5c']]; } else { lo = Math.min(S.Tw, S.Tm, Tfin()) - 3; hi = Math.max(S.Tw, S.Tm, Tfin()) + 3; curves = [[function (p) { return S.Tw + (Tfin() - S.Tw) * p; }, '#5cb3ff'], [function (p) { return S.Tm + (Tfin() - S.Tm) * p; }, '#ff7a5c']]; }
        var sx = function (p) { return L + pw * p; }, sy = function (T) { return Tp + ph - ph * (T - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(lo + (hi - lo) * i / 4, 1), L - 5, y + 3); }
        cx.textAlign = 'center'; cx.fillText('tiempo → · eje y: T (°C)', L + pw / 2, h - 4);
        curves.forEach(function (cv) { cx.strokeStyle = cv[1]; cx.lineWidth = 2.4; cx.beginPath(); for (var q = 0; q <= 60; q++) { var p = q / 60, s = (1 - Math.exp(-4 * p)) / (1 - Math.exp(-4)), yy = sy(cv[0](s)); if (q === 0) cx.moveTo(sx(p), yy); else cx.lineTo(sx(p), yy); } cx.stroke(); }); cx.lineWidth = 1;
        cx.strokeStyle = c.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.pr), Tp); cx.lineTo(sx(S.pr), Tp + ph); cx.stroke(); cx.setLineDash([]); } },
      { title: 'ΔH de las reacciones (kJ/mol)', h: 190, note: 'Barras a la izquierda del cero: exotérmicas (liberan calor); a la derecha: endotérmicas.', draw: function (cx, w, h, c) {
        var keys = Object.keys(RXN), L = 6, Rr = 10, Tp = 10, B = 18, ph = (h - Tp - B) / keys.length, mid = w * 0.62, sc = (w * 0.45) / 90;
        cx.font = '10.5px system-ui'; cx.strokeStyle = c.ink; cx.beginPath(); cx.moveTo(mid, Tp); cx.lineTo(mid, h - B); cx.stroke();
        keys.forEach(function (k, i) { var v = RXN[k].dH, y = Tp + i * ph + 4; cx.fillStyle = v < 0 ? '#ff7a5c' : '#5cb3ff'; cx.globalAlpha = k === S.rx ? 1 : 0.5; cx.fillRect(Math.min(mid, mid + v * sc), y, Math.abs(v * sc), ph - 8); cx.globalAlpha = 1; cx.fillStyle = c.ink; cx.textAlign = v < 0 ? 'right' : 'left'; cx.fillText(RXN[k].desc.replace('disolución de ', 'disol. ') + ' (' + v + ')', v < 0 ? mid + v * sc - 4 : mid + v * sc + 4, y + ph / 2); });
        } }
    ],
    calc: function () {
      var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, h = '';
      if (S.mode === 'metal') { var m = mt(), a = S.mm * m.c, b = S.mw * 4.18; h = '<div class="card-kicker">Equilibrio térmico</div><div class="calc-step">1 · Capacidades caloríficas (m·c)</div><table class="calc-table">' + row('Metal', S.mm + ' g × ' + m.c + ' = ' + f1(a) + ' J/°C') + row('Agua', S.mw + ' g × 4,18 = ' + f1(b) + ' J/°C') + '</table><div class="calc-step">2 · Temperatura final</div><table class="calc-table">' + row('T<sub>f</sub>', '(' + f1(a) + ' × ' + S.Tm + ' + ' + f1(b) + ' × ' + S.Tw + ') ÷ (' + f1(a) + ' + ' + f1(b) + ') = <b>' + f2(Tfin()) + ' °C</b>') + row('q agua', S.mw + ' × 4,18 × (' + f2(Tfin()) + ' − ' + S.Tw + ') = <b>' + f2(qMetal() / 1000) + ' kJ</b>') + row('q metal', S.mm + ' × ' + m.c + ' × (' + f2(Tfin()) + ' − ' + S.Tm + ') = <b>' + f2(-qMetal() / 1000 * 1) + ' kJ</b>') + row('Suma', f2(0) + ' kJ ✓ (sistema aislado)') + '</table>'; }
      else if (S.mode === 'cal' || S.mode === 'dh') { var r = RXN[S.rx], cap = S.V * 4.18 + S.Ccal; h = '<div class="card-kicker">Calorimetría a presión constante</div><div class="calc-step">1 · Capacidad calorífica total</div><table class="calc-table">' + row('m·c (disolución)', S.V + ' g × 4,18 = ' + f1(S.V * 4.18) + ' J/°C') + row('C calorímetro', S.Ccal + ' J/°C') + row('Total', '<b>' + f1(cap) + ' J/°C</b>') + '</table><div class="calc-step">2 · Calor y ΔT</div><table class="calc-table">' + row('q reacción', r.dH + ' kJ/mol × ' + fmt(S.n, 3) + ' mol = <b>' + f2(r.dH * S.n) + ' kJ</b>') + row('ΔT = −q ÷ capacidad', f2(-r.dH * S.n * 1000) + ' ÷ ' + f1(cap) + ' = <b>' + f2(dTcal()) + ' °C</b>') + row('Conclusión', r.dH < 0 ? 'exotérmica: el agua se calienta' : 'endotérmica: el agua se enfría') + '</table><div class="calc-step">3 · Problema inverso</div><table class="calc-table">' + row('ΔH = −capacidad·ΔT ÷ n', '−' + f1(cap) + ' × ' + f2(dTcal()) + ' ÷ ' + fmt(S.n, 3) + ' ÷ 1000 = <b>' + f1(-cap * dTcal() / S.n / 1000) + ' kJ/mol</b>') + '</table>'; }
      else if (S.mode === 'hess') h = '<div class="card-kicker">Ley de Hess</div><table class="calc-table">' + row('(1) C(s) + ½O₂ → CO', '−110,5 kJ') + row('(2) CO + ½O₂ → CO₂', '−283,0 kJ') + row('(1) + (2)', 'C(s) + O₂ → CO₂ = <b>−393,5 kJ</b>') + '</table><p class="muted small">Invertir una reacción cambia el signo de ΔH; multiplicarla por n multiplica ΔH por n.</p>';
      else { var u = FUEL[S.fuel]; h = '<div class="card-kicker">Combustión de ' + u.n + '</div><table class="calc-table">' + row('Reacción', u.f + ' + ' + u.o2 + ' O₂ → ' + u.co2 + ' CO₂ + ' + u.h2o + ' H₂O(l)') + row('Σ ΔH°f productos', u.co2 + '(−393,5) + ' + u.h2o + '(−285,8) = ' + f1(u.co2 * HF_CO2 + u.h2o * HF_H2O)) + row('Σ ΔH°f reactivos', f1(u.hf) + ' + 0') + row('ΔH°', '<b>' + f1(dHcomb(S.fuel)) + ' kJ/mol</b>') + row('Por gramo', f1(dHcomb(S.fuel) / ({ ch4: 16.04, c3h8: 44.10, etoh: 46.07, glu: 180.16 }[S.fuel])) + ' kJ/g') + '</table>'; }
      return h;
    },
    quiz: [
      { q: '¿Cuánto calor absorben 100 g de agua al calentarse de 20 °C a 30 °C? (c = 4,18 J/g·°C)', options: ['4,18 kJ', '418 kJ', '41,8 kJ', '0,418 kJ'], answer: 0, why: 'q = m·c·ΔT = 100 × 4,18 × 10 = 4180 J = 4,18 kJ.' },
      { q: 'Un bloque de 100 g de cobre (c = 0,385 J/g·°C) a 100 °C se sumerge en 100 g de agua a 20 °C. ¿Cuál es la temperatura final aproximada?', options: ['26,7 °C', '60 °C', '35,4 °C', '20,0 °C'], answer: 0, why: 'Tf = (100·0,385·100 + 100·4,18·20)/(100·0,385 + 100·4,18) = 12 210/456,5 = 26,7 °C.' },
      { q: 'En una reacción exotérmica, ¿qué signo tiene ΔH y qué le pasa al entorno?', options: ['ΔH < 0 y el entorno se calienta', 'ΔH > 0 y el entorno se calienta', 'ΔH < 0 y el entorno se enfría', 'ΔH = 0'], answer: 0, why: 'El sistema libera calor (q < 0, ΔH < 0) y lo cede a los alrededores, que se calientan.' },
      { q: 'La neutralización HCl + NaOH tiene ΔH = −57,1 kJ/mol. Con 0,050 mol en 100 g de disolución (c = 4,18 J/g·°C, sin pérdidas), ¿cuánto sube la temperatura?', options: ['6,8 °C', '57 °C', '0,68 °C', '13,7 °C'], answer: 0, why: 'q = 57,1 × 0,050 = 2,855 kJ = 2855 J; ΔT = 2855/(100 × 4,18) = 6,8 °C.' },
      { q: 'C(s) + ½O₂ → CO tiene ΔH = −110,5 kJ y CO + ½O₂ → CO₂ tiene ΔH = −283,0 kJ. ¿Cuál es ΔH de C(s) + O₂ → CO₂?', options: ['−393,5 kJ', '−172,5 kJ', '+393,5 kJ', '−110,5 kJ'], answer: 0, why: 'Ley de Hess: se suman las ecuaciones y sus ΔH: −110,5 + (−283,0) = −393,5 kJ.' },
      { q: 'Con ΔH°f(CO₂) = −393,5, ΔH°f(H₂O,l) = −285,8 y ΔH°f(CH₄) = −74,8 kJ/mol, ¿cuál es ΔH° de CH₄ + 2 O₂ → CO₂ + 2 H₂O(l)?', options: ['−890,3 kJ', '+890,3 kJ', '−1180,3 kJ', '−604,5 kJ'], answer: 0, why: 'ΔH° = [−393,5 + 2(−285,8)] − [−74,8 + 0] = −965,1 + 74,8 = −890,3 kJ/mol.' },
      { q: 'Si se invierte una reacción y se duplican los coeficientes, ΔH…', options: ['Cambia de signo y se duplica', 'Solo cambia de signo', 'Solo se duplica', 'No cambia'], answer: 0, why: 'ΔH es extensiva (proporcional a las cantidades) y cambia de signo al invertir el sentido.' },
      { q: 'Al disolver NH₄NO₃ en agua (ΔH = +25,7 kJ/mol) la disolución…', options: ['Se enfría', 'Se calienta', 'No cambia de temperatura', 'Ebulle'], answer: 0, why: 'Proceso endotérmico: absorbe calor de la disolución (y el entorno), que se enfría.' }
    ],
    help: { intro: 'Elige el experimento en «Lab» o sigue la lección. «Iniciar» anima el proceso.', items: [['Calorímetro', 'la temperatura del agua (termómetro) cambia según el calor intercambiado; el halo rojo/azul indica liberación/absorción.'], ['Diagramas', 'los niveles de entalpía muestran exo/endotermia, ley de Hess y entalpías de formación.'], ['Gráficos', 'curvas T(t) y comparación de ΔH.'], ['Cálculo', 'resolución paso a paso del experimento actual.'], ['Controles', '«Experimento» (metal en agua, entalpía, ley de Hess o ΔH°f) y sus datos: masas y temperaturas, reacción, n, volumen, capacidad calorífica del calorímetro y combustible.']], try: ['En «Metal en agua» sumerge el metal caliente: el calor que cede es igual al que gana el agua.', 'En «Ley de Hess» compara el camino directo con el de dos pasos: el ΔH total es el mismo.', 'Con ΔH°f calcula el ΔH de combustión de un combustible y compáralo con el panel.'] }
  };
  MSim.create(def);
})();
