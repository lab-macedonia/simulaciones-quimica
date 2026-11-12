/* Solubilidad y producto de solubilidad (Kps) — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE, sci = function (x) { return MSim.sci(x, 2); };
  // a: cationes, b: aniones por fórmula; ka: Ka del ácido conjugado del anión (0 = anión no básico); oh: hidróxido
  var SALTS = [
    { id: 'AgCl', n: 'AgCl', ksp: 1.8e-10, a: 1, b: 1, ion: ['Ag⁺', 'Cl⁻'], col: 0xe9ecef, ka: 0 },
    { id: 'BaSO4', n: 'BaSO₄', ksp: 1.1e-10, a: 1, b: 1, ion: ['Ba²⁺', 'SO₄²⁻'], col: 0xdee2e6, ka: 0 },
    { id: 'PbI2', n: 'PbI₂', ksp: 9.8e-9, a: 1, b: 2, ion: ['Pb²⁺', 'I⁻'], col: 0xffd43b, ka: 0 },
    { id: 'CaF2', n: 'CaF₂', ksp: 3.5e-11, a: 1, b: 2, ion: ['Ca²⁺', 'F⁻'], col: 0xf1f3f5, ka: 6.8e-4, pKa: 3.17 },
    { id: 'CaCO3', n: 'CaCO₃', ksp: 3.4e-9, a: 1, b: 1, ion: ['Ca²⁺', 'CO₃²⁻'], col: 0xe9ecef, ka: 4.7e-11, pKa: 10.33 },
    { id: 'MgOH2', n: 'Mg(OH)₂', ksp: 5.6e-12, a: 1, b: 2, ion: ['Mg²⁺', 'OH⁻'], col: 0xf8f9fa, oh: true }
  ], SID = {};
  SALTS.forEach(function (s) { SID[s.id] = s; });
  var KI = 8.5e-17, KC = 1.8e-10;
  var S = { salt: 'AgCl', lc: -6, pH: 7, rat: 0, T: 0, mode: 'norm', _st: -1 }, NI = 70, NS = 70, lab = {};
  var cat, an, ex, sol, solB, dm, seeds = [];
  function alpha(s, pH) { return s.ka ? s.ka / (s.ka + Math.pow(10, -pH)) : 1; }
  // solubilidad molar (mol/L) con ion común c (M) y pH
  function solub(s, c, pH) {
    if (s.oh) { var oh = Math.pow(10, pH - 14); return Math.min(1, s.ksp / (oh * oh)); }
    var al = alpha(s, pH), lo = -20, hi = 0, g = function (ls) { var x = Math.pow(10, ls); return Math.log(s.a * x) * s.a + s.b * Math.log(al * (s.b * x + c)); };
    var t = Math.log(s.ksp); if (g(hi) < t) return 1; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (g(m) < t) lo = m; else hi = m; } return Math.pow(10, (lo + hi) / 2);
  }
  function cc() { return S.lc <= -6 ? 0 : Math.pow(10, S.lc); }
  function sel(Tt) { var I, Cl, Ag, pI = Math.min(Tt, 0.1), pC = Math.max(0, Tt - 0.1), fl = KI / KC; if (Tt < 0.1) { I = Math.max(0.1 - Tt, fl); Cl = 0.1; Ag = KI / I; } else { Cl = Math.max(0.2 - Tt, 1e-9); Ag = KC / Cl; I = KI / Ag; } return { I: I, Cl: Cl, Ag: Ag, pI: pI, pC: pC }; }
  function stages() {
    var s = SID.AgCl;
    return [
      ['Equilibrio de disolución', 'Kps', 'MₐXᵦ(s) ⇌ aMⁿ⁺ + bXᵐ⁻ → Kps = [M]ᵃ[X]ᵇ',
        '<p>Una sal poco soluble en contacto con su solución saturada está en <b>equilibrio heterogéneo</b>: el sólido se disuelve y los iones precipitan a la misma velocidad. La constante es el <b>producto de solubilidad</b>: <b>Kps = [M]ᵃ[X]ᵇ</b> (el sólido no aparece). Para AgCl: Kps = [Ag⁺][Cl⁻] = <b>' + sci(KC) + '</b>.</p>'],
      ['Solubilidad molar', 'Solubilidad', 'Con s = mol/L disueltos: Kps = aᵃ·bᵇ·s^(a+b)',
        '<p>La <b>solubilidad molar s</b> se obtiene de la estequiometría: [M] = a·s, [X] = b·s ⇒ <b>Kps = aᵃbᵇ·s^(a+b)</b>. Ejemplos: AgCl: s = √Kps = 1,3×10⁻⁵ M; PbI₂: s = ∛(Kps/4) = 1,3×10⁻³ M. <b>¡Cuidado!</b> Un Kps menor no siempre implica menor solubilidad si las sales tienen distinta estequiometría.</p>'],
      ['Efecto del ion común', 'Ion común', 'Añadir un ion de la sal reduce su solubilidad (Le Châtelier)',
        '<p>Si la solución ya contiene uno de los iones (p. ej. <b>Cl⁻ de NaCl</b>), el equilibrio se desplaza hacia el sólido y la <b>solubilidad disminuye</b>. Con [Cl⁻] = c: Kps = s·(s + c) ⇒ s ≈ Kps/c si c ≫ s. Por ejemplo, en NaCl 0,1 M el AgCl tiene s ≈ 1,8×10⁻⁹ M, unas 10 000 veces menos que en agua pura.</p>'],
      ['Efecto del pH', 'pH', 'Los aniones básicos (F⁻, CO₃²⁻, OH⁻) hacen la sal más soluble en medio ácido',
        '<p>Si el anión es la <b>base conjugada de un ácido débil</b> (F⁻, CO₃²⁻, PO₄³⁻, S²⁻), el H⁺ lo consume y desplaza el equilibrio hacia la disolución: <b>la sal se disuelve más al bajar el pH</b>. En los hidróxidos, [OH⁻] fija directamente la solubilidad: Mg(OH)₂ → s = Kps/[OH⁻]². Las sales de aniones de ácidos fuertes (Cl⁻, I⁻, SO₄²⁻) casi no cambian.</p>'],
      ['Q frente a Kps', 'Precipitación', 'Q > Kps: precipita · Q = Kps: saturada · Q < Kps: no hay sólido',
        '<p>Con concentraciones cualesquiera se calcula el <b>cociente de reacción Q = [M]ᵃ[X]ᵇ</b>. Si <b>Q &lt; Kps</b> la solución es insaturada; si <b>Q = Kps</b>, está saturada; si <b>Q &gt; Kps</b> está sobresaturada y <b>precipita</b> la cantidad necesaria para volver a Q = Kps. Mueve el control para ver cómo aparece el sólido.</p>'],
      ['Precipitación selectiva', 'Selectiva', 'Con I⁻ y Cl⁻ 0,1 M y Ag⁺ creciente, precipita primero el AgI',
        '<p>Con <b>[I⁻] = [Cl⁻] = 0,1 M</b> se agrega Ag⁺. El AgI (Kps = ' + sci(KI) + ') precipita con [Ag⁺] ≈ 8,5×10⁻¹⁶ M; el AgCl sólo cuando [Ag⁺] llega a 1,8×10⁻⁹ M. Cuando empieza el AgCl, la [I⁻] residual es Kps(AgI)/[Ag⁺] ≈ <b>4,7×10⁻⁸ M</b>: el 99,99995 % del yoduro ya precipitó. Así se separan iones por <b>precipitación fraccionada</b>.</p>']
    ];
  }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var def = {
    key: 'solubilidad-kps', title: 'Solubilidad y Kps', subtitle: 'Simulador 3D · química general', accent: { dark: '#22d3ee', light: '#0e7490' },
    stages: stages, nStages: 6, dur: 12, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 5, 16], target: [0, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 3, 17], target: [0, 3, 0] }, { id: 'sup', label: 'Superior', pos: [0, 16, 3], target: [0, 2, 0] }],
    layers: [{ id: 'ions', label: 'Iones disueltos', icon: '⊕' }, { id: 'solid', label: 'Sólido', icon: '▦' }],
    build: function (ctx) {
      var s = ctx.scene, g = new T.SphereGeometry(1, 12, 9), box = new T.BoxGeometry(1, 1, 1);
      var mk = function (c, n) { var m = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: c, roughness: 0.4 }), n); m.frustumCulled = false; s.add(m); return m; };
      cat = mk(0x4f8bff, NI); an = mk(0x37b24d, NI); ex = mk(0xcc5de8, NI);
      sol = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.7 }), NS); sol.frustumCulled = false; s.add(sol);
      solB = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.7 }), NS); solB.frustumCulled = false; s.add(solB);
      dm = new T.Object3D();
      var gl = new T.Mesh(new T.CylinderGeometry(4.2, 4.0, 7, 32, 1, true), new T.MeshBasicMaterial({ color: 0xaecbe6, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })); gl.position.y = 3.5; s.add(gl);
      var lq = new T.Mesh(new T.CylinderGeometry(4.1, 3.95, 5.6, 32), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.12, depthWrite: false })); lq.position.y = 2.9; s.add(lq);
      var fl = new T.Mesh(new T.CylinderGeometry(4.0, 4.0, 0.15, 32), new T.MeshStandardMaterial({ color: 0x495057, roughness: 0.6 })); fl.position.y = -0.05; s.add(fl);
      for (var i = 0; i < NI * 2; i++) seeds.push([Math.random(), Math.random(), Math.random(), Math.random() * 6.28]);
      ['t', 'a', 'b', 'c', 'd'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P;
      if (!P.manual) {
        var i = f.i, l = f.local; S.mode = i === 5 ? 'sel' : 'norm';
        if (i === 0) { S.salt = 'AgCl'; S.lc = -6; S.pH = 7; S.rat = 0; }
        else if (i === 1) { S.salt = SALTS[Math.min(2, Math.floor(l * 3))].id; S.lc = -6; S.pH = 7; S.rat = 0; }
        else if (i === 2) { S.salt = 'AgCl'; S.lc = -5 + 5 * sm(l); S.pH = 7; S.rat = 0; }
        else if (i === 3) { S.salt = ['CaF2', 'CaCO3', 'MgOH2'][Math.min(2, Math.floor(l * 3))]; S.lc = -6; S.pH = 1 + 12 * ((l * 3) % 1); S.rat = 0; }
        else if (i === 4) { S.salt = 'AgCl'; S.lc = -6; S.pH = 7; S.rat = -3 + 6 * l; }
        else { S.T = 0.2 * sm(l); }
      }
      var s = SID[S.salt], now = ctx.now, nc, na, ne, fs, fsB = 0, sg = 0, ionOn = ctx.layer('ions'), sOn = ctx.layer('solid');
      var cols = { cat: 0x4f8bff, an: 0x37b24d };
      if (S.mode === 'sel') {
        var r = sel(S.T); nc = Math.max(1, Math.round(6 * Math.min(1, Math.log10(r.Ag / 1e-17 + 1) / 10))); na = Math.round(NI * r.Cl / 0.1 * 0.8); ne = Math.round(NI * r.I / 0.1 * 0.8); if (r.I > 0 && ne < 1) ne = 1; fs = Math.min(1, r.pC / 0.1); fsB = Math.min(1, r.pI / 0.1);
        cat.material.color.setHex(0xadb5bd); an.material.color.setHex(0x37b24d); ex.material.color.setHex(0xcc5de8); sol.material.color.setHex(0xe9ecef);
      } else {
        var c = cc(), sv = solub(s, c, S.pH), vis = function (x) { return Math.max(0, Math.min(1, (Math.log10(Math.max(x, 1e-12)) + 9) / 9)); };
        cat.material.color.setHex(0x4f8bff); an.material.color.setHex(0x37b24d); ex.material.color.setHex(0xcc5de8); sol.material.color.setHex(s.col);
        var Q = S.rat, fr = Q > 0 ? 1 - Math.pow(10, -Q) : 0, cat_c = s.a * sv, ratioQ = Math.pow(10, Q);
        var effv = Q < 0 ? sv * Math.pow(ratioQ, 1 / (s.a + s.b)) : sv;
        nc = Math.round(6 + 60 * vis(effv)); na = Math.round(nc * s.b / s.a); if (na > NI) na = NI; ne = c > 0 ? Math.round(Math.min(NI, 8 + 55 * Math.min(1, (Math.log10(c) + 6) / 6))) : 0;
        fs = S.mode === 'norm' && ctx.P && S._st !== 4 && (P.manual || f.i !== 4) ? 0.55 : 0.55;
        if (!P.manual ? f.i === 4 : S.fq) fs = fr > 0 ? 0.15 + 0.8 * fr : (Q < 0 ? 0 : 0.1); if (!P.manual && f.i !== 4 && !S.fq) fs = 0.55;
      }
      if (S.mode === 'norm') {
        // aniones: si hay ion común en solución, el anión extra se pinta violeta
        // (se muestra con el pool ex)
      }
      var R = 3.3, ymin = 0.8, ymax = 5.2;
      function put(m, n, off, spread) { for (var i = 0; i < NI; i++) { if (i >= n || !ionOn) { dm.scale.setScalar(0.0001); dm.position.set(0, -9, 0); } else { var sd = seeds[i + off], r = R * Math.sqrt(sd[0]) * 0.97, th = sd[1] * 6.283 + Math.sin(now * 0.5 + sd[3]) * 0.4; dm.position.set(r * Math.cos(th) + 0.18 * Math.sin(now * 1.3 + sd[3] * 2), ymin + (ymax - ymin) * sd[2] + 0.2 * Math.sin(now * 1.1 + sd[3]), r * Math.sin(th) + 0.18 * Math.cos(now * 1.2 + sd[3])); dm.scale.setScalar(spread); } dm.updateMatrix(); m.setMatrixAt(i, dm.matrix); } m.instanceMatrix.needsUpdate = true; }
      put(cat, nc, 0, S.mode === 'sel' ? 0.17 : 0.2); put(an, na, 70, 0.3); put(ex, S.mode === 'sel' ? ne : ne, 17, 0.3);
      function pile(m, frac, x0) { var n = Math.round(NS * frac); for (var i = 0; i < NS; i++) { if (i >= n || !sOn) { dm.scale.setScalar(0.0001); dm.position.set(0, -9, 0); } else { var sd = seeds[(i * 3 + 5) % seeds.length], r = 2.6 * Math.sqrt((i + 0.5) / NS) * (x0 === 0 ? 1 : 1); var th = i * 2.4 + x0; dm.position.set(r * Math.cos(th) * (x0 ? 0.9 : 1), 0.2 + 0.18 * (1 - r / 2.6) * 2, r * Math.sin(th) * (x0 ? 0.9 : 1)); dm.rotation.set(sd[0], sd[1] * 3, sd[2]); dm.scale.setScalar(0.28); } dm.updateMatrix(); m.setMatrixAt(i, dm.matrix); dm.rotation.set(0, 0, 0); } m.instanceMatrix.needsUpdate = true; }
      pile(sol, S.mode === 'sel' ? fs : (fs || 0), 1); pile(solB, S.mode === 'sel' ? fsB : 0, 4);
      var txt, ct;
      if (S.mode === 'sel') { var r2 = sel(S.T); lab.t.pos(0, 7.6, 0).set('Ag⁺ añadido: ' + fmt(S.T, 3) + ' mol/L', 'bl-lead').vis(true); lab.a.pos(0, 6.8, 0).set('[Ag⁺] = ' + sci(r2.Ag) + ' M', 'bl-d').vis(true); lab.b.pos(-5.4, 3.5, 0).set('[I⁻] = ' + sci(r2.I) + ' M', 'bl-warn').vis(true); lab.c.pos(5.4, 3.5, 0).set('[Cl⁻] = ' + sci(r2.Cl) + ' M', 'bl-pos').vis(true); lab.d.pos(0, -1.1, 0).set(r2.pC > 0 ? 'precipita también AgCl (blanco)' : (r2.pI > 0 ? 'precipita AgI (amarillo)' : 'sin precipitado'), 'bl-d').vis(true); }
      else {
        var sv2 = solub(s, cc(), S.pH), Qv = Math.pow(sv2 * s.a, s.a) * Math.pow(alpha(s, S.pH) * (s.b * sv2 + cc()), s.b);
        lab.t.pos(0, 7.6, 0).set(s.n + ' · Kps = ' + sci(s.ksp), 'bl-lead').vis(true);
        lab.a.pos(0, 6.8, 0).set('s = ' + sci(sv2) + ' mol/L', 'bl-pos').vis(true);
        lab.b.pos(-5.4, 3.5, 0).set(s.ion[0], 'bl-d').vis(true); lab.c.pos(5.4, 3.5, 0).set(s.ion[1] + (cc() > 0 ? ' (+ ion común)' : ''), 'bl-d').vis(true);
        lab.d.pos(0, -1.1, 0).set(S.rat ? 'Q/Kps = ' + sci(Math.pow(10, S.rat)) + (S.rat > 0 ? ' → precipita' : (S.rat < 0 ? ' → insaturada' : ' → saturada')) : (cc() > 0 ? '[ion común] = ' + sci(cc()) + ' M' : 'agua pura') + (s.ka || s.oh ? ' · pH ' + f1(S.pH) : ''), 'bl-d').vis(true);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.salt) u.salt.set(S.salt); if (!ctx.P.manual) { u.lc && u.lc.set(S.lc); u.pH && u.pH.set(S.pH); u.rat && u.rat.set(S.rat); u.T && u.T.set(S.T); } },
    hud: function () {
      if (S.mode === 'sel') { var r = sel(S.T); return { eq: { chip: 'Kps', name: 'AgI vs AgCl', body: '<div class="eqline"><small>Kps AgI</small>' + sci(KI) + '</div><div class="eqline"><small>Kps AgCl</small>' + sci(KC) + '</div><div class="eqline"><small>[Ag⁺]</small>' + sci(r.Ag) + ' M</div><div class="eqline"><small>[I⁻] residual</small>' + sci(r.I) + ' M</div>' }, legend: [{ label: 'Ag⁺', color: '#adb5bd', text: 'plata' }, { label: 'I⁻', color: '#cc5de8', text: 'yoduro' }, { label: 'Cl⁻', color: '#37b24d', text: 'cloruro' }] }; }
      var s = SID[S.salt], sv = solub(s, cc(), S.pH);
      return { eq: { chip: 'Kps', name: s.n + '(s) ⇌ ' + s.a + s.ion[0] + ' + ' + s.b + s.ion[1], body: '<div class="eqline"><small>Kps</small>' + sci(s.ksp) + '</div><div class="eqline"><small>s</small>' + sci(sv) + ' mol/L</div><div class="eqline"><small>g/L</small>' + sci(sv * (s.mm || 1)) + '</div>' }, legend: [{ label: s.ion[0], color: '#4f8bff', text: 'catión' }, { label: s.ion[1], color: '#37b24d', text: 'anión' }, { label: 'Sólido', color: '#e9ecef', text: 'precipitado' }] };
    },
    measures: function () { if (S.mode === 'sel') { var r = sel(S.T); return [['Ag⁺ añadido', fmt(S.T, 3) + ' M'], ['[Ag⁺]', sci(r.Ag) + ' M'], ['[I⁻]', sci(r.I) + ' M'], ['[Cl⁻]', sci(r.Cl) + ' M'], ['AgI precipitado', fmt(r.pI * 100 / 0.1, 0) + ' %'], ['AgCl precipitado', fmt(r.pC * 100 / 0.1, 0) + ' %']]; } var s = SID[S.salt], sv = solub(s, cc(), S.pH); return [['Sal', s.n], ['Kps', sci(s.ksp)], ['s (mol/L)', sci(sv)], ['pKps', f2(-Math.log10(s.ksp))], ['[ion común]', cc() ? sci(cc()) + ' M' : '—'], ['pH', f1(S.pH)], ['Q/Kps', sci(Math.pow(10, S.rat))]]; },
    ideas: ['<b>Kps = [M]ᵃ[X]ᵇ</b>; se compara con Q para predecir precipitación.', '<b>s</b> depende de la estequiometría: aᵃbᵇ·s^(a+b) = Kps.', '<b>Ion común</b>: baja la solubilidad (s ≈ Kps/c).', '<b>pH</b>: aumenta la solubilidad de sales con aniones básicos en medio ácido.', 'La <b>precipitación selectiva</b> separa iones con Kps muy distintos.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sal y solución'); el.appendChild(c);
      ui.salt = kit.ui.options({ label: 'Sal', cols: 3, value: S.salt, options: SALTS.map(function (x) { return { v: x.id, label: x.n, sub: 'Kps ' + sci(x.ksp) }; }), onChange: function (v) { ctx.goManual(); S.mode = 'norm'; S.fq = false; S.salt = v; } }); c.appendChild(ui.salt);
      ui.lc = kit.ui.slider({ label: 'Ion común (log₁₀ M)', min: -6, max: 0, step: 0.1, value: S.lc, format: function (v) { return v <= -6 ? 'ninguno' : '10^' + f1(v) + ' M'; }, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.lc = v; } });
      ui.pH = kit.ui.slider({ label: 'pH', min: 0, max: 14, step: 0.1, value: S.pH, format: f1, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.pH = v; } });
      ui.rat = kit.ui.slider({ label: 'Q / Kps (log₁₀)', min: -3, max: 3, step: 0.1, value: S.rat, format: function (v) { return '10^' + f1(v); }, onInput: function (v) { ctx.goManual(); S.mode = 'norm'; S.fq = true; S.rat = v; } });
      c.appendChild(kit.ui.sliders([ui.lc, ui.pH, ui.rat]));
      var d = kit.ui.card('Precipitación selectiva'); el.appendChild(d);
      ui.T = kit.ui.slider({ label: 'Ag⁺ añadido', min: 0, max: 0.2, step: 0.002, value: S.T, format: function (v) { return fmt(v, 3) + ' M'; }, onInput: function (v) { ctx.goManual(); S.mode = 'sel'; S.T = v; } }); d.appendChild(kit.ui.sliders([ui.T]));
      d.appendChild(ctx.btnRow([{ t: 'Volver a la lección', primary: true, fn: function () { S.fq = false; ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Solubilidad frente al ion común', h: 220, note: 'log₁₀ s según [ion común]. A concentraciones altas s ≈ Kps/c.', draw: function (cx, w, h, col) {
        var s = SID[S.salt], L = 44, R = 10, Tp = 10, B = 30, pw = w - L - R, ph = h - Tp - B, xs = function (v) { return L + pw * (v + 6) / 6; }, pts = [], i, mn = 1, mx = -30;
        for (i = 0; i <= 60; i++) { var lc = -6 + 6 * i / 60, y = Math.log10(solub(s, lc <= -6 ? 0 : Math.pow(10, lc), S.pH)); pts.push([lc, y]); mn = Math.min(mn, y); mx = Math.max(mx, y); }
        var lo = Math.floor(mn) - 0.5, hi = Math.ceil(mx) + 0.5, ys = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); };
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = Math.ceil(lo); i <= hi; i += Math.max(1, Math.round((hi - lo) / 5))) { cx.beginPath(); cx.moveTo(L, ys(i)); cx.lineTo(L + pw, ys(i)); cx.stroke(); cx.fillText(i, L - 5, ys(i) + 3); }
        cx.textAlign = 'center'; cx.fillText('log [ion común]   ·   log s', L + pw / 2, h - 4); cx.strokeStyle = '#22d3ee'; cx.lineWidth = 2.6; cx.beginPath(); pts.forEach(function (p, k) { if (k) cx.lineTo(xs(p[0]), ys(p[1])); else cx.moveTo(xs(p[0]), ys(p[1])); }); cx.stroke(); cx.lineWidth = 1;
        var cur = Math.log10(solub(s, cc(), S.pH)); cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(xs(S.lc), ys(cur), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } },
      { title: 'Solubilidad frente al pH', h: 220, note: 'La curva sube a pH bajo para F⁻ y CO₃²⁻ (bases conjugadas) y baja a pH alto para Mg(OH)₂.', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 30, pw = w - L - R, ph = h - Tp - B, xs = function (v) { return L + pw * v / 14; }, i, j, all = [];
        var data = ['CaF2', 'CaCO3', 'MgOH2', 'AgCl'].map(function (id) { var s = SID[id], arr = []; for (i = 0; i <= 28; i++) arr.push(Math.log10(solub(s, 0, i / 2))); all = all.concat(arr); return [s, arr]; });
        var lo = Math.floor(Math.min.apply(null, all)) - 0.5, hi = Math.min(0, Math.ceil(Math.max.apply(null, all)) + 0.5), ys = function (v) { return Tp + ph - ph * (v - lo) / (hi - lo); }, cl = ['#ff6b6b', '#fcc419', '#4dabf7', '#adb5bd'];
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = Math.ceil(lo); i <= hi; i += Math.max(1, Math.round((hi - lo) / 5))) { cx.beginPath(); cx.moveTo(L, ys(i)); cx.lineTo(L + pw, ys(i)); cx.stroke(); cx.fillText(i, L - 5, ys(i) + 3); }
        cx.textAlign = 'center'; for (i = 0; i <= 14; i += 2) cx.fillText(i, xs(i), h - B + 13); cx.fillText('pH   ·   log s', L + pw / 2, h - 4);
        data.forEach(function (d, k) { cx.strokeStyle = cl[k]; cx.lineWidth = d[0].id === S.salt ? 3.2 : 1.6; cx.beginPath(); d[1].forEach(function (v, j) { if (j) cx.lineTo(xs(j / 2), ys(v)); else cx.moveTo(xs(0), ys(v)); }); cx.stroke(); cx.fillStyle = cl[k]; cx.textAlign = 'left'; cx.fillText(d[0].n, L + 6 + k * 66, Tp + 10); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'sel') { var r = sel(S.T); return '<div class="card-kicker">AgI y AgCl con Ag⁺ creciente</div><div class="calc-step">1 · [Ag⁺] de inicio de cada precipitación</div><table class="calc-table">' + row('AgI', KI + ' / 0,1 = <b>' + sci(KI / 0.1) + ' M</b>') + row('AgCl', KC + ' / 0,1 = <b>' + sci(KC / 0.1) + ' M</b>') + '</table><div class="calc-step">2 · [I⁻] cuando empieza el AgCl</div><table class="calc-table">' + row('[I⁻]', 'Kps(AgI)/[Ag⁺] = <b>' + sci(KI / (KC / 0.1)) + ' M</b>') + row('Fracción restante', sci(KI / (KC / 0.1) / 0.1)) + '</table><p class="muted small">Ahora: [Ag⁺] = ' + sci(r.Ag) + ' M · [I⁻] = ' + sci(r.I) + ' M.</p>'; }
      var s = SID[S.salt], c = cc(), sv = solub(s, c, S.pH), pf = Math.pow(s.a, s.a) * Math.pow(s.b, s.b), s0 = Math.pow(s.ksp / pf, 1 / (s.a + s.b));
      return '<div class="card-kicker">' + s.n + '(s) ⇌ ' + s.a + ' ' + s.ion[0] + ' + ' + s.b + ' ' + s.ion[1] + '</div><div class="calc-step">1 · Solubilidad en agua pura</div><table class="calc-table">' + row('Kps', sci(s.ksp) + ' = ' + pf + ' s^' + (s.a + s.b)) + row('s', '(Kps / ' + pf + ')^(1/' + (s.a + s.b) + ') = <b>' + sci(s0) + ' mol/L</b>') + '</table>' +
        '<div class="calc-step">2 · Condiciones actuales</div><table class="calc-table">' + row('Ion común', c ? sci(c) + ' M' : '—') + row('pH', f1(S.pH) + (s.ka ? ' (pKa ácido conjugado ' + s.pKa + ' → fracción libre α = ' + sci(alpha(s, S.pH)) + ')' : '')) + row('s', '<b>' + sci(sv) + ' mol/L</b> (' + fmt(sv / s0, 2) + ' × la de agua pura)') + '</table>';
    },
    quiz: [
      { q: '¿Cuál es la expresión de Kps para Ca₃(PO₄)₂?', options: ['[Ca²⁺]³[PO₄³⁻]²', '[Ca²⁺][PO₄³⁻]', '[Ca²⁺]²[PO₄³⁻]³', '[Ca₃(PO₄)₂]'], answer: 0, why: 'Cada concentración se eleva a su coeficiente; el sólido no aparece.' },
      { q: 'La solubilidad molar del AgCl (Kps = 1,8×10⁻¹⁰) es…', options: ['1,3×10⁻⁵ M', '1,8×10⁻¹⁰ M', '9,0×10⁻¹¹ M', '3,6×10⁻¹⁰ M'], answer: 0, why: 's = √Kps = 1,3×10⁻⁵ M.' },
      { q: 'Al agregar NaCl a una solución saturada de AgCl, la solubilidad…', options: ['disminuye (ion común)', 'aumenta', 'no cambia', 'se duplica'], answer: 0, why: 'Efecto del ion común: el equilibrio se desplaza hacia el sólido.' },
      { q: '¿Cuál sal se disuelve más al bajar el pH?', options: ['CaF₂', 'AgCl', 'BaSO₄', 'AgI'], answer: 0, why: 'F⁻ es base conjugada de un ácido débil (HF); Cl⁻, SO₄²⁻ (casi) e I⁻ no reaccionan significativamente.' },
      { q: 'Si Q > Kps…', options: ['precipita sólido', 'se disuelve más sólido', 'la solución está insaturada', 'Kps aumenta'], answer: 0, why: 'La solución está sobresaturada y el exceso precipita hasta Q = Kps.' },
      { q: 'Para Mg(OH)₂, al subir el pH la solubilidad…', options: ['disminuye', 'aumenta', 'no cambia', 'se anula siempre'], answer: 0, why: 'Más OH⁻ en solución: efecto del ion común.' },
      { q: 'Con [I⁻] = [Cl⁻] = 0,1 M y Ag⁺ creciente, precipita primero…', options: ['AgI (Kps menor)', 'AgCl', 'ambos a la vez', 'ninguno'], answer: 0, why: 'Con la misma concentración de aniones y estequiometría 1:1, precipita primero el de menor Kps.' },
      { q: 'Dos sales con estequiometrías distintas se comparan…', options: ['por su solubilidad molar s, no por Kps', 'siempre por Kps', 'por su masa molar', 'por el color'], answer: 0, why: 'Kps = aᵃbᵇ·s^(a+b) depende de la estequiometría.' }
    ],
    help: { intro: 'Elige la sal y mueve ion común, pH y Q/Kps en «Lab». Los puntos azules son cationes, los verdes aniones y los morados el ion extra o yoduro; los cubitos del fondo son el sólido.', items: [['Ion común', 'añade un ion de la sal.'], ['pH', 'afecta a aniones básicos.'], ['Q/Kps', 'por encima de 1 precipita.'], ['Ag⁺ añadido', 'precipitación selectiva AgI/AgCl.'], ['Gráficos', 'solubilidad frente al ion común y frente al pH.']], try: ['Agrega ion común: la solubilidad baja (s ≈ Kps/c).', 'Con una sal de anión básico baja el pH: la solubilidad sube.', 'Agrega Ag⁺ a una mezcla de I⁻ y Cl⁻: precipita primero el AgI, que tiene menor Kps.'] }
  };
  MSim.create(def);
})();
