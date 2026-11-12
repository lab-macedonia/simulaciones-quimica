/* Diagramas de fase — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

(function () {
  var R = 8.314, fmt = SimKit.fmt, ATM = 101325;
  var SUB = {
    H2O: { name: 'Agua', f: 'H₂O', Tt: 273.16, Pt: 611.657, Tc: 647.1, Pc: 22.064e6, p3: [373.15, ATM], sub: [200, 0.162], dmelt: -13.7e6, Tlo: 200, Thi: 700, lp0: -1, lp1: 8.3, cs: 38, cl: 75.3, cg: 33.6, Hf: 6010, Hv: 40700, nb: 'p. eb. normal 373,15 K (100 °C)' },
    CO2: { name: 'Dióxido de carbono', f: 'CO₂', Tt: 216.55, Pt: 517000, Tc: 304.13, Pc: 7.377e6, p3: [250, 1.785e6], sub: [194.7, ATM], dmelt: 4.6e6, Tlo: 150, Thi: 400, lp0: 2, lp1: 8.3, cs: 50, cl: 85, cg: 37, Hf: 9000, Hv: 15300, nb: 'sublima a 194,7 K (−78,5 °C) a 1 atm' }
  };
  var S = { id: 'H2O', T: 298, lp: 5.0057 }; // lp = log10 P (Pa)
  function D() { return SUB[S.id]; }
  function fit3(d) { // lnP = a + b u + c u^2, u = 1/T
    var pts = [[1 / d.Tt, Math.log(d.Pt)], [1 / d.p3[0], Math.log(d.p3[1])], [1 / d.Tc, Math.log(d.Pc)]];
    var u0 = pts[0][0], u1 = pts[1][0], u2 = pts[2][0], y0 = pts[0][1], y1 = pts[1][1], y2 = pts[2][1];
    var c = ((y2 - y0) / (u2 - u0) - (y1 - y0) / (u1 - u0)) / (u2 - u1), b = (y1 - y0) / (u1 - u0) - c * (u1 + u0), a = y0 - b * u0 - c * u0 * u0;
    return [a, b, c];
  }
  function fitS(d) { var u0 = 1 / d.Tt, u1 = 1 / d.sub[0], b = (Math.log(d.Pt) - Math.log(d.sub[1])) / (u0 - u1); return [Math.log(d.Pt) - b * u0, b]; }
  SUB.H2O.cv = fit3(SUB.H2O); SUB.CO2.cv = fit3(SUB.CO2); SUB.H2O.cs2 = fitS(SUB.H2O); SUB.CO2.cs2 = fitS(SUB.CO2);
  function Pvap(T, d) { d = d || D(); var u = 1 / T, c = d.cv; return Math.exp(c[0] + c[1] * u + c[2] * u * u); }
  function Psub(T, d) { d = d || D(); return Math.exp(d.cs2[0] + d.cs2[1] / T); }
  function Tm(P, d) { d = d || D(); return d.Tt + (P - d.Pt) / d.dmelt; }
  function info(T, P, d) {
    d = d || D(); var r = { s: 0, l: 0, g: 0, sc: 0, name: '', coex: '' };
    var lnP = Math.log(P), eps = 0.03;
    if (Math.abs(T - d.Tt) < 0.35 && Math.abs(lnP - Math.log(d.Pt)) < 0.06) { r.s = r.l = r.g = 1 / 3; r.name = 'Punto triple: sólido + líquido + gas'; r.coex = 'triple'; return r; }
    if (T >= d.Tc && P >= d.Pc) { r.sc = 1; r.name = 'Fluido supercrítico'; return r; }
    if (P < d.Pt) {
      if (T < d.Tt) { var ls = Math.log(Psub(T, d)); if (Math.abs(lnP - ls) < eps) { r.s = .5; r.g = .5; r.name = 'Equilibrio sólido–gas (sublimación)'; r.coex = 'sub'; } else if (lnP > ls) { r.s = 1; r.name = 'Sólido'; } else { r.g = 1; r.name = 'Gas'; } }
      else { r.g = 1; r.name = 'Gas'; }
      return r;
    }
    if (Math.abs(T - Tm(P, d)) < 0.12 && T <= d.Tc) { r.s = .5; r.l = .5; r.name = 'Equilibrio sólido–líquido (fusión)'; r.coex = 'fus'; return r; }
    if (T < Tm(P, d) && d.dmelt > 0 || T > Tm(P, d) && d.dmelt < 0 ? false : false) { }
    var solid = d.dmelt > 0 ? T < Tm(P, d) : T < Tm(P, d);
    if (solid) { r.s = 1; r.name = 'Sólido'; return r; }
    if (T < d.Tc) { var lv = Math.log(Pvap(T, d)); if (T < d.Tt) { r.l = 1; r.name = 'Líquido'; } else if (Math.abs(lnP - lv) < eps) { r.l = .5; r.g = .5; r.name = 'Equilibrio líquido–gas (vaporización)'; r.coex = 'vap'; } else if (lnP > lv) { r.l = 1; r.name = 'Líquido'; } else { r.g = 1; r.name = 'Gas'; } return r; }
    r.g = 1; r.name = 'Gas'; return r;
  }
  function Pnow() { return Math.pow(10, S.lp); }
  function cl(x) { return Math.max(0, Math.min(1, x)); }
  function Ttxt(T) { return fmt(T, 1) + ' K (' + fmt(T - 273.15, 1) + ' °C)'; }
  function Ptxt(P) { return P >= 1e6 ? fmt(P / 1e6, 2) + ' MPa' : (P >= 1e3 ? fmt(P / 1e3, 1) + ' kPa' : fmt(P, 1) + ' Pa'); }
  function Tbp(P, d) { d = d || D(); if (P < d.Pt || P > d.Pc) return NaN; var lo = d.Tt, hi = d.Tc; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (Pvap(m, d) < P) lo = m; else hi = m; } return (lo + hi) / 2; }
  function Tsb(P, d) { d = d || D(); if (P >= d.Pt) return NaN; var lo = 100, hi = d.Tt; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (Psub(m, d) < P) lo = m; else hi = m; } return (lo + hi) / 2; }
  function dHv(T, d) { d = d || D(); var u = 1 / T; return -R * (d.cv[1] + 2 * d.cv[2] * u) / 1000; }

  var N = 100, pts = [], inst, dum, boxT, lid, heat, lab = {}, cur = { s: 0, l: 0, g: 1, sc: 0, H: 6, vh: 6 };
  function stages() {
    var w = SUB.H2O, c = SUB.CO2;
    return [
      ['Estados y fases', 'Fases', 'Una sustancia pura cambia de fase según T y P', '<p>Una <b>fase</b> es una porción homogénea de materia. Para una sustancia pura, el estado más estable depende de la <b>temperatura</b> y la <b>presión</b>. Calentamos agua a 1 atm: el <b>sólido</b> (partículas ordenadas que vibran) pasa a <b>líquido</b> (desordenado pero compacto) y luego a <b>gas</b> (partículas muy separadas). El <b>diagrama de fases</b> es el mapa de P frente a T que muestra qué fase es estable en cada punto.</p>'],
      ['Curvas de equilibrio', 'Curvas', 'Sobre cada curva coexisten dos fases en equilibrio', '<p>Las curvas separan regiones: <b>fusión</b> (sólido–líquido), <b>vaporización</b> (líquido–gas) y <b>sublimación</b> (sólido–gas). Sobre ellas, dos fases coexisten en equilibrio dinámico. La curva de vaporización es la <b>presión de vapor</b> en función de T; el punto donde vale 1 atm es el <b>punto de ebullición normal</b> (agua: 373,15 K). Aquí seguimos esa curva: el líquido y el gas coexisten a cada T con su P de vapor.</p>'],
      ['Punto triple', 'Triple', 'Punto triple: las tres fases coexisten (F = 0)', '<p>En el <b>punto triple</b> coexisten sólido, líquido y gas. Para el agua: <b>273,16 K y 611,657 Pa</b> (0,006 atm); para el CO₂: <b>216,55 K y 517 kPa</b> (5,1 atm). Según la regla de las fases F = C − P + 2 = 1 − 3 + 2 = <b>0</b>: ningún grado de libertad, el punto es único. Por eso el punto triple del agua definió el kelvin hasta 2019.</p>'],
      ['Punto crítico', 'Crítico', 'Sobre T<sub>c</sub> y P<sub>c</sub> no hay distinción líquido–gas', '<p>La curva de vaporización termina en el <b>punto crítico</b> (agua: 647,1 K y 22,06 MPa; CO₂: 304,1 K y 7,38 MPa). Al acercarse, el líquido se expande y el gas se densifica hasta que desaparece el menisco. Por encima de T<sub>c</sub> y P<sub>c</sub> existe un <b>fluido supercrítico</b>: densidad de líquido, difusividad de gas (el CO₂ supercrítico descafeína el café).</p>'],
      ['Agua: pendiente negativa', 'Agua', 'En el agua la presión baja el punto de fusión', '<p>La curva sólido–líquido del agua tiene <b>pendiente negativa</b>: el hielo es menos denso que el agua líquida (ΔV<sub>fus</sub> &lt; 0) y, por Clapeyron <b>dP/dT = ΔH/(TΔV)</b>, aumentar P favorece al líquido. A −1,5 °C el hielo funde si se le aplica unos 20 MPa. En casi todas las demás sustancias la pendiente es positiva.</p>'],
      ['CO₂: hielo seco', 'CO₂', 'A 1 atm el CO₂ sólido sublima, no funde', '<p>El punto triple del CO₂ está a <b>5,1 atm</b>, por encima de la presión atmosférica: a 1 atm no existe CO₂ líquido; el sólido (<b>hielo seco</b>) <b>sublima</b> a 194,7 K (−78,5 °C). Para obtener CO₂ líquido hay que comprimir por encima de 5,1 atm, como en un extintor.</p>']
    ];
  }
  var PATH = [
    function (u) { return ['H2O', 240 + 180 * u, Math.log10(ATM)]; },
    function (u) { var T = 280 + 170 * u; return ['H2O', T, Math.log10(Pvap(T, SUB.H2O))]; },
    function (u) { var k = 1 - Math.min(1, u * 3); return ['H2O', 273.16 + 3 * k, Math.log10(611.657) + 0.6 * k]; },
    function (u) { var T = 570 + 120 * u; return ['H2O', T, T < 647.1 ? Math.log10(Pvap(T, SUB.H2O)) : Math.log10(22.064e6)]; },
    function (u) { return ['H2O', 271.5, 5 + 2.6 * u]; },
    function (u) { return ['CO2', 170 + 70 * u, Math.log10(ATM)]; }
  ];
  function def_() {
    return {
      key: 'diagramas-de-fase', title: 'Diagramas de fase', subtitle: 'Simulador 3D · química general', accent: { dark: '#5eead4', light: '#0f766e' },
      stages: stages, dur: 12, offset: 0.12,
      views: [{ id: 'libre', label: 'Libre', pos: [9, 7, 16], target: [0, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 5, 18], target: [0, 3, 0] }, { id: 'sup', label: 'Superior', pos: [0, 20, 3], target: [0, 2, 0] }, { id: 'lado', label: 'Lateral', pos: [18, 5, 0], target: [0, 3, 0] }],
      layers: [{ id: 'part', label: 'Partículas', icon: '●' }, { id: 'heat', label: 'Calentador', icon: '♨' }],
      build: function (ctx) {
        var T = ctx.T, s = ctx.scene; dum = new T.Object3D();
        var glass = new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.12, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
        boxT = new T.Mesh(new T.BoxGeometry(5.6, 7.4, 5.6), glass); boxT.position.y = 3.7; s.add(boxT);
        var base = new T.Mesh(new T.BoxGeometry(7, 0.5, 7), new T.MeshStandardMaterial({ color: 0x3a4656, roughness: 0.7 })); base.position.y = -0.25; s.add(base);
        heat = new T.Mesh(new T.BoxGeometry(5.4, 0.12, 5.4), new T.MeshStandardMaterial({ color: 0x555555, emissive: 0xff3300, emissiveIntensity: 0, roughness: 0.5 })); heat.position.y = 0.06; s.add(heat);
        lid = new T.Mesh(new T.BoxGeometry(5.5, 0.35, 5.5), new T.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0.6, roughness: 0.35 })); s.add(lid);
        var rod = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 3, 12), new T.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0.6 })); rod.position.y = 2; lid.add(rod); lid.userData.rod = rod;
        inst = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }), N); inst.frustumCulled = false; s.add(inst);
        for (var i = 0; i < N; i++) {
          var li = i % 25, layer = Math.floor(i / 25), gx = li % 5, gz = Math.floor(li / 5);
          pts.push({ lx: (gx - 2) * 0.62, ly: 0.35 + layer * 0.62, lz: (gz - 2) * 0.62, u: Math.random(), v: Math.random(), w: Math.random(), vu: Math.random() - .5, vv: Math.random() - .5, vw: Math.random() - .5, ws: 0, wl: 0, wg: 1, ph: Math.random() * 6.28 });
          inst.setColorAt(i, new T.Color(0xffd43b));
        }
        lab.P = ctx.label('', 'bl-lead'); lab.b = ctx.label('', 'bl-d');
        ctx.cols = { s: new T.Color(0xa5d8ff), l: new T.Color(0x339af0), g: new T.Color(0xffd43b), sc: new T.Color(0xf783ac) }; ctx.tmpc = new T.Color();
      },
      frame: function (ctx, f, dt) {
        var d = D();
        if (!ctx.P.manual) { var p = PATH[f.i](ctx.ease(f.local)); S.id = p[0]; S.T = p[1]; S.lp = p[2]; }
        var P = Pnow(), r = info(S.T, P), vis = ctx.layer('part');
        // fracciones objetivo -> por partícula
        var fs = r.s, fl = r.l, fg = r.g + r.sc, hs = 1.9 * (fs > 0 ? 1 : 0);
        var tgtH = r.sc ? 4.8 : (r.g ? 6.6 : (r.l ? 3.4 : 2.5)); if (r.g && r.l) tgtH = 6.6; if (r.sc) tgtH = 4.8;
        cur.vh += (tgtH - cur.vh) * Math.min(1, dt * 3); var vh = cur.vh;
        var speed = Math.sqrt(S.T / 300) * 0.9, yb = 0.35 + fs * 25 * 0.62 / 5 * 1.0 * 0.0 + Math.ceil(fs * 4) * 0.62;
        inst.count = vis ? N : 0;
        for (var i = 0; i < N; i++) {
          var q = pts[i], x = i / N, ts = x < fs ? 1 : 0, tl = (x >= fs && x < fs + fl) ? 1 : 0, tg = (ts + tl) ? 0 : 1, k = Math.min(1, dt * 2.5);
          q.ws += (ts - q.ws) * k; q.wl += (tl - q.wl) * k; q.wg += (tg - q.wg) * k;
          var sp = speed * (q.wg * 1.3 + q.wl * 0.45 + 0.1) * dt * 0.5;
          q.u += q.vu * sp; q.v += q.vv * sp; q.w += q.vw * sp;
          if (q.u < 0 || q.u > 1) { q.vu *= -1; q.u = cl(q.u); } if (q.v < 0 || q.v > 1) { q.vv *= -1; q.v = cl(q.v); } if (q.w < 0 || q.w > 1) { q.vw *= -1; q.w = cl(q.w); }
          var vib = (0.03 + 0.05 * Math.min(1, S.T / d.Tt * 0.5)), tm = f.now || 0;
          var sx = q.lx + Math.sin(tm * 9 + q.ph) * vib, sy = q.ly + Math.sin(tm * 8 + q.ph * 2) * vib, sz = q.lz + Math.cos(tm * 10 + q.ph) * vib;
          var lx = (q.u - .5) * 4.8, ly = yb + q.v * Math.max(1.2, fl * 2.3 + 0.2), lz = (q.w - .5) * 4.8;
          var gx = (q.u - .5) * 4.8, gy = 0.35 + q.v * (vh - 0.8), gz = (q.w - .5) * 4.8;
          var ww = q.ws + q.wl + q.wg;
          dum.position.set((sx * q.ws + lx * q.wl + gx * q.wg) / ww, (sy * q.ws + ly * q.wl + gy * q.wg) / ww, (sz * q.ws + lz * q.wl + gz * q.wg) / ww);
          dum.scale.setScalar(0.27); dum.updateMatrix(); inst.setMatrixAt(i, dum.matrix);
          var cc = ctx.tmpc; cc.setRGB(0, 0, 0); cc.r = (ctx.cols.s.r * q.ws + ctx.cols.l.r * q.wl + (r.sc ? ctx.cols.sc.r : ctx.cols.g.r) * q.wg) / ww; cc.g = (ctx.cols.s.g * q.ws + ctx.cols.l.g * q.wl + (r.sc ? ctx.cols.sc.g : ctx.cols.g.g) * q.wg) / ww; cc.b = (ctx.cols.s.b * q.ws + ctx.cols.l.b * q.wl + (r.sc ? ctx.cols.sc.b : ctx.cols.g.b) * q.wg) / ww; inst.setColorAt(i, cc);
        }
        inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        lid.position.y = vh + 0.45; lid.userData.rod.position.y = 1.7;
        var hot = cl((S.T - d.Tlo) / (d.Thi - d.Tlo)); heat.material.emissiveIntensity = ctx.layer('heat') ? hot * 2.2 : 0; heat.material.color.setRGB(0.2 + hot * .6, 0.2, 0.2);
        lab.P.pos(0, vh + 1.5, 0).set(r.name, 'bl-lead').vis(true); lab.b.pos(0, -0.9, 0).set(d.f + ' · T = ' + Ttxt(S.T) + ' · P = ' + Ptxt(P), 'bl-d').vis(true);
        ctx._info = r;
      },
      sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual || !u.sT) return; u.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); u.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); u.sub && u.sub.set(S.id); },
      hud: function () { var d = D(), P = Pnow(), r = info(S.T, P); var bp = Tbp(P), sb = Tsb(P);
        return { eq: { chip: d.f, name: r.name, body: '<div class="eqline"><small>T</small>' + fmt(S.T, 1) + ' K · ' + fmt(S.T - 273.15, 1) + ' °C</div><div class="eqline"><small>P</small>' + Ptxt(P) + ' (' + MSim.sci(P / ATM, 2) + ' atm)</div><div class="eqline"><small>T ebullición a esta P</small>' + (isNaN(bp) ? '—' : fmt(bp, 1) + ' K') + '</div>' }, legend: [{ label: 'Sólido', color: '#a5d8ff', text: 'ordenado, vibra' }, { label: 'Líquido', color: '#339af0', text: 'compacto, fluye' }, { label: 'Gas', color: '#ffd43b', text: 'disperso' }, { label: 'Supercrítico', color: '#f783ac', text: 'T>Tc y P>Pc' }] }; },
      measures: function () { var d = D(), P = Pnow(), r = info(S.T, P), bp = Tbp(P), sb = Tsb(P); return [['Sustancia', d.name + ' (' + d.f + ')'], ['Fase', r.name], ['T', fmt(S.T, 1) + ' K'], ['P', Ptxt(P)], ['Punto triple', fmt(d.Tt, 2) + ' K · ' + Ptxt(d.Pt)], ['Punto crítico', fmt(d.Tc, 1) + ' K · ' + Ptxt(d.Pc)], ['T eb. a esta P', isNaN(bp) ? '—' : fmt(bp, 1) + ' K'], ['T sublim. a esta P', isNaN(sb) ? '—' : fmt(sb, 1) + ' K'], ['T fusión a esta P', P >= d.Pt ? fmt(Tm(P), 2) + ' K' : '—']]; },
      ideas: ['Cada punto (T, P) tiene una <b>fase estable</b>; sobre las curvas coexisten dos fases.', '<b>Punto triple</b>: tres fases, F = 0. <b>Punto crítico</b>: termina la curva líquido–gas.', 'Pendiente de fusión: <b>negativa</b> en agua (hielo menos denso), positiva en CO₂.', '<b>Clausius–Clapeyron</b>: d ln P/dT = ΔH<sub>vap</sub>/(RT²).', 'Si P &lt; P<sub>triple</sub> el sólido <b>sublima</b> en vez de fundir.'],
      lab: function (el, ctx) {
        var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Panel de control'); el.appendChild(c);
        ui.sub = kit.ui.options({ label: 'Sustancia', cols: 2, value: S.id, options: [{ v: 'H2O', label: 'H₂O', sub: 'agua' }, { v: 'CO2', label: 'CO₂', sub: 'dióxido de carbono' }], onChange: function (v) { ctx.goManual(); S.id = v; S.T = v === 'H2O' ? 298 : 298; S.lp = Math.log10(ATM); ui.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); ui.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); } });
        c.appendChild(ui.sub);
        ui.sT = kit.ui.slider({ label: 'Temperatura', min: 0, max: 1000, step: 1, value: 300, format: function (v) { var d = D(); return fmt(d.Tlo + (d.Thi - d.Tlo) * v / 1000, 1) + ' K'; }, onInput: function (v) { ctx.goManual(); var d = D(); S.T = d.Tlo + (d.Thi - d.Tlo) * v / 1000; } });
        ui.sP = kit.ui.slider({ label: 'Presión (escala log)', min: 0, max: 1000, step: 1, value: 500, format: function (v) { var d = D(); return Ptxt(Math.pow(10, d.lp0 + (d.lp1 - d.lp0) * v / 1000)); }, onInput: function (v) { ctx.goManual(); var d = D(); S.lp = d.lp0 + (d.lp1 - d.lp0) * v / 1000; } });
        c.appendChild(kit.ui.sliders([ui.sT, ui.sP]));
        function go(T, P) { ctx.goManual(); S.T = T; S.lp = Math.log10(P); ui.sT.set((S.T - D().Tlo) / (D().Thi - D().Tlo) * 1000); ui.sP.set((S.lp - D().lp0) / (D().lp1 - D().lp0) * 1000); }
        c.appendChild(ctx.btnRow([
          { t: 'Punto triple', fn: function () { go(D().Tt, D().Pt); } }, { t: 'Punto crítico', fn: function () { go(D().Tc, D().Pc * 1.02); } },
          { t: '1 atm · 25 °C', fn: function () { go(298.15, ATM); } }, { t: 'Volver a la lección', primary: true, fn: function () { ctx.toLesson(); } }]));
        c.insertAdjacentHTML('beforeend', '<p class="muted small">Las curvas son ajustes a datos experimentales (Antoine ampliado y Clapeyron); los valores son aproximados. Usa la escala logarítmica de P para cubrir muchos órdenes de magnitud.</p>');
      },
      graphs: [
        { title: 'Diagrama de fases P–T', h: 290, note: 'Escala logarítmica en P. Las tres curvas de equilibrio: fusión (S–L), vaporización (L–G) y sublimación (S–G). Punto naranja: estado actual. ● punto triple · ◆ punto crítico.', draw: function (cx, w, h, c) {
          var d = D(), L = 46, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B;
          var sx = function (T) { return L + pw * (T - d.Tlo) / (d.Thi - d.Tlo); }, sy = function (lp) { return Tp + ph - ph * (lp - d.lp0) / (d.lp1 - d.lp0); };
          var img = cx.createImageData ? null : null, step = 4, i, j;
          var colr = { s: 'rgba(160,170,190,.55)', l: 'rgba(51,154,240,.45)', g: 'rgba(255,212,59,.40)', sc: 'rgba(247,131,172,.45)' };
          for (i = 0; i < pw; i += step) for (j = 0; j < ph; j += step) {
            var T = d.Tlo + (d.Thi - d.Tlo) * (i + step / 2) / pw, lp = d.lp0 + (d.lp1 - d.lp0) * (1 - (j + step / 2) / ph), r = info(T, Math.pow(10, lp), d); r.coex = '';
            var Pp = Math.pow(10, lp); var rr = (T >= d.Tc && Pp >= d.Pc) ? 'sc' : (function () { var x = info(T + 0, Pp, d); return x.s >= .5 ? 's' : (x.l >= .5 ? 'l' : 'g'); })();
            cx.fillStyle = colr[rr]; cx.fillRect(L + i, Tp + j, step, step);
          }
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right';
          for (i = Math.ceil(d.lp0); i <= d.lp1; i++) { var y = sy(i); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText('10' + (function (n) { return String(n).split('').map(function (ch) { return ch === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]; }).join(''); })(i), L - 5, y + 3); }
          cx.textAlign = 'center'; var dT = d.Thi - d.Tlo > 300 ? 100 : 50; for (var t = Math.ceil(d.Tlo / dT) * dT; t <= d.Thi; t += dT) cx.fillText(t, sx(t), h - B + 12);
          cx.fillText('T (K)  ·  eje vertical: P (Pa)', L + pw / 2, h - 3);
          cx.strokeStyle = c.ink; cx.lineWidth = 2; cx.beginPath(); var first = true; for (T = d.Tt; T <= d.Tc; T += (d.Tc - d.Tt) / 80) { var lv = Math.log10(Pvap(T, d)); if (first) { cx.moveTo(sx(T), sy(lv)); first = false; } else cx.lineTo(sx(T), sy(lv)); } cx.lineTo(sx(d.Tc), sy(Math.log10(d.Pc))); cx.stroke();
          cx.beginPath(); first = true; for (T = d.Tlo; T <= d.Tt; T += (d.Tt - d.Tlo) / 60) { var ls = Math.log10(Psub(T, d)); if (ls < d.lp0) continue; if (first) { cx.moveTo(sx(T), sy(ls)); first = false; } else cx.lineTo(sx(T), sy(ls)); } cx.stroke();
          cx.beginPath(); var Pm0 = d.Pt, Pm1 = Math.pow(10, d.lp1); cx.moveTo(sx(d.Tt), sy(Math.log10(Pm0))); var Te = Tm(Pm1, d); cx.lineTo(sx(Math.max(d.Tlo, Math.min(d.Thi, Te))), sy(d.lp1)); cx.stroke(); cx.lineWidth = 1;
          cx.fillStyle = c.ink; cx.beginPath(); cx.arc(sx(d.Tt), sy(Math.log10(d.Pt)), 4.5, 0, 7); cx.fill(); cx.save(); cx.translate(sx(d.Tc), sy(Math.log10(d.Pc))); cx.rotate(Math.PI / 4); cx.fillRect(-4, -4, 8, 8); cx.restore();
          cx.font = '600 11px system-ui'; cx.fillStyle = c.ink; cx.textAlign = 'center'; cx.fillText('SÓLIDO', sx(d.Tlo + (d.Tt - d.Tlo) * .45), sy(d.lp0 + (d.lp1 - d.lp0) * .75)); cx.fillText('LÍQUIDO', sx(d.Tt + (d.Tc - d.Tt) * .6), sy(d.lp0 + (d.lp1 - d.lp0) * .7)); cx.fillText('GAS', sx(d.Tt + (d.Thi - d.Tt) * .6), sy(d.lp0 + (d.lp1 - d.lp0) * .12)); cx.fillText('SUPERCRÍTICO', sx(Math.min(d.Thi - 62, d.Tc + (d.Thi - d.Tc) * .5)), sy(Math.log10(d.Pc) + (d.lp1 - Math.log10(d.Pc)) * .55));
          cx.font = 'italic 10px system-ui'; cx.fillStyle = c.muted; cx.textAlign = 'left';
          var Tsb_ = d.Tlo + (d.Tt - d.Tlo) * .3, Tv_ = d.Tt + (d.Tc - d.Tt) * .3, lpf_ = d.lp0 + (d.lp1 - d.lp0) * .55, Pmv_ = Math.pow(10, lpf_);
          cx.fillText('sublimación', sx(Tsb_) + 6, sy(Math.log10(Psub(Tsb_, d))) + 12); cx.fillText('vaporización', sx(Tv_) + 6, sy(Math.log10(Pvap(Tv_, d))) + 14); cx.textAlign = d.dmelt < 0 ? 'right' : 'left'; cx.fillText('fusión', sx(Tm(Pmv_, d)) + (d.dmelt < 0 ? -5 : 5), sy(lpf_));
          var px = sx(Math.max(d.Tlo, Math.min(d.Thi, S.T))), py = sy(Math.max(d.lp0, Math.min(d.lp1, S.lp)));
          cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.6; cx.beginPath(); cx.arc(px, py, 6, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
        { title: 'Curva de calentamiento a la presión actual', h: 210, note: 'Plateaus donde ocurre un cambio de fase (T constante mientras se absorbe calor). El punto marca la T actual.', draw: function (cx, w, h, c) {
          var d = D(), P = Pnow(), L = 46, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, segs = [], T = d.Tlo, prev = info(T, P, d), E = 0, pts_ = [[0, T]], cp = function (r) { return r.s >= .5 ? d.cs : (r.l >= .5 ? d.cl : d.cg); };
          var ph0 = function (r) { return r.s >= .5 ? 's' : (r.l >= .5 ? 'l' : 'g'); }, last = ph0(prev), x;
          for (T = d.Tlo + 1; T <= d.Thi; T += 1) { var r = info(T, P, d), p1 = ph0({ s: r.s, l: r.l, g: r.g + r.sc }); if (r.coex) { continue; } if (p1 !== last) { var dh = (last === 's' && p1 === 'l') ? d.Hf : ((last === 'l' && p1 === 'g') ? d.Hv : (last === 's' && p1 === 'g' ? d.Hf + d.Hv : 0)); if (T >= d.Tc && P >= d.Pc) dh = 0; if (P >= d.Pc && last === 'l') dh = 0; E += dh; pts_.push([E, T - .5]); } E += cp(r); pts_.push([E, T]); last = p1; }
          var Emax = pts_[pts_.length - 1][0], sxx = function (e) { return L + pw * e / Emax; }, syy = function (t) { return Tp + ph - ph * (t - d.Tlo) / (d.Thi - d.Tlo); };
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(fmt(d.Tlo + (d.Thi - d.Tlo) * i / 4, 0), L - 5, y + 3); }
          cx.textAlign = 'center'; cx.fillText('calor absorbido (J/mol) · eje y: T (K)', L + pw / 2, h - 3);
          cx.strokeStyle = '#2f9e8f'; cx.lineWidth = 2.6; cx.beginPath(); pts_.forEach(function (p, k) { if (k === 0) cx.moveTo(sxx(p[0]), syy(p[1])); else cx.lineTo(sxx(p[0]), syy(p[1])); }); cx.stroke(); cx.lineWidth = 1;
          var cur_ = pts_.reduce(function (a, p) { return Math.abs(p[1] - S.T) < Math.abs(a[1] - S.T) ? p : a; }, pts_[0]);
          cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sxx(cur_[0]), syy(cur_[1]), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } },
        { title: 'Presión de vapor (Clausius–Clapeyron)', h: 190, note: 'ln P frente a 1/T es casi una recta de pendiente −ΔH<sub>vap</sub>/R. El punto marca T actual sobre la curva.', draw: function (cx, w, h, c) {
          var d = D(), L = 46, Rr = 10, Tp = 12, B = 28, pw = w - L - Rr, ph = h - Tp - B, u0 = 1 / d.Tc, u1 = 1 / d.Tt, l0 = Math.log10(d.Pt), l1 = Math.log10(d.Pc);
          var sx = function (u) { return L + pw * (u1 - u) / (u1 - u0); }, sy = function (l) { return Tp + ph - ph * (l - l0) / (l1 - l0); };
          cx.font = '10.5px system-ui'; cx.strokeStyle = c.line; cx.fillStyle = c.muted; cx.textAlign = 'right'; for (var i = 0; i <= 4; i++) { var y = Tp + ph - ph * i / 4; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText('10^' + fmt(l0 + (l1 - l0) * i / 4, 1), L - 5, y + 3); }
          cx.textAlign = 'center'; cx.fillText('1000/T (K⁻¹): derecha = T baja', L + pw / 2, h - 3);
          cx.strokeStyle = '#2f9e8f'; cx.lineWidth = 2.6; cx.beginPath(); for (var k = 0; k <= 60; k++) { var u = u0 + (u1 - u0) * k / 60, lp = Math.log10(Math.exp(d.cv[0] + d.cv[1] * u + d.cv[2] * u * u)); if (k === 0) cx.moveTo(sx(u), sy(lp)); else cx.lineTo(sx(u), sy(lp)); } cx.stroke(); cx.lineWidth = 1;
          var Tq = Math.max(d.Tt, Math.min(d.Tc, S.T)); cx.fillStyle = '#fff'; cx.strokeStyle = '#ff6b3d'; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(sx(1 / Tq), sy(Math.log10(Pvap(Tq, d))), 5.5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; } }
      ],
      calc: function () {
        var d = D(), P = Pnow(), r = info(S.T, P), bp = Tbp(P), sb = Tsb(P), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }, Tq = Math.max(d.Tt, Math.min(d.Tc, S.T));
        return '<div class="card-kicker">' + d.name + ' (' + d.f + ')</div><div class="calc-step">1 · Fase en (T, P)</div><table class="calc-table">' + row('T', fmt(S.T, 2) + ' K = ' + fmt(S.T - 273.15, 2) + ' °C') + row('P', Ptxt(P) + ' = ' + MSim.sci(P / ATM, 3) + ' atm') + row('Fase estable', '<b>' + r.name + '</b>') + '</table>' +
          '<div class="calc-step">2 · Puntos y curvas a esa presión</div><table class="calc-table">' + row('Punto triple', fmt(d.Tt, 2) + ' K · ' + Ptxt(d.Pt)) + row('Punto crítico', fmt(d.Tc, 1) + ' K · ' + Ptxt(d.Pc)) + row('T de ebullición', isNaN(bp) ? 'no hay (P fuera de [P<sub>t</sub>, P<sub>c</sub>])' : '<b>' + fmt(bp, 2) + ' K</b> = ' + fmt(bp - 273.15, 2) + ' °C') + row('T de sublimación', isNaN(sb) ? 'no aplica (P ≥ P<sub>t</sub>)' : '<b>' + fmt(sb, 2) + ' K</b>') + row('T de fusión', P >= d.Pt ? '<b>' + fmt(Tm(P), 3) + ' K</b>' : 'no aplica') + '</table>' +
          '<div class="calc-step">3 · Clausius–Clapeyron en T = ' + fmt(Tq, 1) + ' K</div><table class="calc-table">' + row('P de vapor', Ptxt(Pvap(Tq, d))) + row('ΔH<sub>vap</sub> = −R·d(ln P)/d(1/T)', '<b>' + fmt(dHv(Tq, d), 1) + ' kJ/mol</b>') + row('Pendiente de fusión dP/dT', fmt(d.dmelt / 1e6, 2) + ' MPa/K (' + (d.dmelt < 0 ? 'negativa: ΔV<sub>fus</sub> &lt; 0' : 'positiva') + ')') + row('Regla de fases', 'F = C − P + 2 = ' + (r.coex === 'triple' ? '0' : (r.coex ? '1' : '2')) + (r.coex === 'triple' ? ' (triple)' : (r.coex ? ' (sobre una curva)' : ' (una fase)'))) + '</table>';
      },
      quiz: [
        { q: '¿Qué ocurre en el punto triple?', options: ['Coexisten sólido, líquido y gas en equilibrio', 'Desaparece la distinción líquido–gas', 'El sólido sublima', 'Sólo hay gas'], answer: 0, why: 'El punto triple es la única (T, P) en que las tres fases están en equilibrio (F = 0).' },
        { q: '¿Cuáles son T y P del punto triple del agua?', options: ['273,16 K y 611,66 Pa', '273,15 K y 101 325 Pa', '373,15 K y 101 325 Pa', '647,1 K y 22,06 MPa'], answer: 0, why: 'El triple del agua es 273,16 K y ≈0,006 atm. 647,1 K y 22,06 MPa es el crítico.' },
        { q: 'Por encima de T<sub>c</sub> y P<sub>c</sub> la sustancia es…', options: ['un fluido supercrítico', 'un sólido', 'un líquido', 'un gas ideal'], answer: 0, why: 'No hay interfase líquido–gas: el fluido supercrítico tiene propiedades intermedias.' },
        { q: 'La curva de fusión del agua tiene pendiente negativa porque…', options: ['el hielo es menos denso que el agua líquida', 'el agua es polar', 'ΔH<sub>fus</sub> es negativo', 'el agua hierve a 100 °C'], answer: 0, why: 'ΔV<sub>fus</sub> &lt; 0; por Clapeyron, dP/dT = ΔH/(TΔV) &lt; 0: más presión favorece al líquido.' },
        { q: 'A 1 atm, el CO₂ sólido…', options: ['sublima (no hay líquido)', 'funde a −56,6 °C', 'hierve a 100 °C', 'permanece sólido siempre'], answer: 0, why: 'El triple del CO₂ está a 5,1 atm; por debajo de esa presión pasa directamente de sólido a gas (−78,5 °C).' },
        { q: 'Disminuir la presión externa sobre agua en ebullición hace que el punto de ebullición…', options: ['disminuya', 'aumente', 'no cambie', 'llegue al punto crítico'], answer: 0, why: 'Hierve cuando P de vapor = P externa; con menor P externa se alcanza a menor T (ollas a presión: lo contrario).' },
        { q: 'Según la regla de las fases (C = 1), sobre una curva de equilibrio de dos fases F vale…', options: ['1', '0', '2', '3'], answer: 0, why: 'F = C − P + 2 = 1 − 2 + 2 = 1: se puede variar T y P queda fija (o viceversa).' },
        { q: 'En un diagrama P–T, la pendiente de la curva líquido–gas está relacionada con…', options: ['ΔH<sub>vap</sub> (Clausius–Clapeyron)', 'la masa molar', 'la polaridad solamente', 'el volumen del recipiente'], answer: 0, why: 'd ln P/dT = ΔH<sub>vap</sub>/(RT²): cuanto mayor ΔH<sub>vap</sub>, más empinada la curva.' }
      ],
      help: { intro: 'Sigue la lección o elige sustancia, T y P en «Lab»; el recipiente muestra la fase y el diagrama el punto actual.', items: [['Recipiente', 'las partículas muestran el orden de cada fase; el pistón sube con el volumen.'], ['Diagrama', 'curvas de fusión, vaporización y sublimación, con triple y crítico.'], ['Calentamiento', 'plateaus a la presión elegida.'], ['Cálculo', 'T de cambio de fase y ΔH<sub>vap</sub> de Clausius–Clapeyron.'], ['Controles', '«Sustancia» (H₂O o CO₂), «Temperatura» y «Presión (escala log)».']], try: ['Con agua a 1 atm calienta desde el hielo: verás las mesetas de fusión (0 °C) y de ebullición (100 °C).', 'Con CO₂ a 1 atm calienta el sólido: sublima sin fundir, porque 1 atm está bajo su punto triple.', 'Lleva T y P más allá del punto crítico: el líquido y el gas ya no se distinguen (fluido supercrítico).'] }
    };
  }
  MSim.create(def_());
})();
