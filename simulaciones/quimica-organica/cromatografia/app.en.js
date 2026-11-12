/* Cromatografía en capa fina y en columna — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CP = { fe: { n: "Ferrocene", p: 1, c: 0xff922b }, az: { n: "Azobenzene", p: 2.5, c: 0xf76707 }, fl: { n: "Fluorenone", p: 4, c: 0xfcc419 }, bh: { n: "Benzhydrol", p: 6, c: 0x74c0fc }, ba: { n: "Benzoic acid", p: 8, c: 0xb197fc } };
  var EL = { hex: { n: "Hexane", e: 0 }, tol: { n: "Toluene", e: 2.5 }, dcm: { n: "Dichloromethane", e: 4 }, ea: { n: "Ethyl acetate", e: 6 }, ace: { n: "Acetone", e: 7 }, met: { n: "Methanol", e: 9 } };
  var S = { sel: { fe: 1, fl: 1, bh: 1, az: 0, ba: 0 }, el: 'dcm', es: 4, mode: 'tlc', p: 0, run: false }, lab = [], g = null, spots = {}, front = null, bands = {}, colm = null;
  function rf(k, e) { return 1 / (1 + Math.exp(0.7 * (CP[k].p - e))); }
  function sel() { return Object.keys(CP).filter(function (k) { return S.sel[k]; }); }
  function mat(c, o) { return new T.MeshStandardMaterial({ color: c, roughness: 0.5, transparent: o < 1, opacity: o }); }
  function stages() {
    return [
      ["Stationary phase and mobile phase", "Fundamentals", "Silica (polar) retains polar compounds more; the eluent carries them along",
        "<p>In <b>adsorption chromatography</b> the <b>stationary phase</b> (silica, polar) retains compounds in proportion to their <b>polarity</b>; the <b>mobile phase</b> (eluent) carries them along. A nonpolar compound travels farther; a polar one stays near the origin. A more polar eluent “competes” with the silica and moves everything faster.</p>"],
      ["Thin-layer plate (TLC)", "TLC", "Rf = distance of the compound / distance of the solvent front",
        "<p>On the <b>TLC plate</b> the sample is spotted on the <b>baseline</b> and placed in a chamber with eluent. The solvent rises by capillary action. When the plate is removed the <b>front</b> is marked. The <b>retention factor</b> is <b>R<sub>f</sub> = d<sub>compound</sub>/d<sub>front</sub></b>, always between 0 and 1. An R<sub>f</sub> of 0.3–0.5 is usually ideal for separating.</p>"],
      ["Choosing the eluent", "Eluent", "More polar → higher Rf. Adjust until the spots separate",
        "<p>With <b>hexane</b> (nonpolar) almost nothing moves; with <b>methanol</b> everything rises with the front. Mixtures are tried until the spots lie between R<sub>f</sub> 0.2 and 0.8 and are <b>well separated</b> (ΔR<sub>f</sub> ≥ 0.1–0.15). Change the eluent and watch the elution order: <b>nonpolar first</b>.</p>"],
      ["Chromatographic column", "Column", "They separate into bands that come out in order of increasing polarity",
        "<p>The <b>column</b> is TLC at preparative scale: the sample is loaded on top of the silica and eluted. The <b>bands</b> descend at different speeds, and <b>fractions</b> are collected in tubes. The elution volume is <b>V<sub>e</sub> = V<sub>0</sub>(1 + k′)</b>, with k′ = (1 − R<sub>f</sub>)/R<sub>f</sub>. The fractions are followed by TLC.</p>"],
      ["Resolution and purity", "Resolution", "Two spots separate well if ΔRf is large and the spots are small",
        "<p>For two compounds to separate, the <b>difference in R<sub>f</sub></b> must be sufficient and the spots narrow (do not overload the plate). On a column, the <b>resolution</b> R<sub>s</sub> compares the distance between peaks with their width; R<sub>s</sub> ≥ 1.5 indicates complete separation.</p>"]
    ];
  }
  var def = {
    key: 'cromatografia', title: "TLC and Column Chromatography", subtitle: "3D simulator · organic chemistry", accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [6, 3, 22], target: [0, 1, 0] }, { id: 'frontal', label: "Front", pos: [0, 1, 24], target: [0, 1, 0] }],
    layers: [{ id: 'sp', label: "Spots and bands", icon: '●' }, { id: 'ch', label: "Chamber", icon: '▢' }],
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
      if (S.mode === 'col') lab[0].pos(6, 7, 0).set("Silica column · eluent " + EL[S.el].n, 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.el) u.el.set(S.el); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var e = EL[S.el].e, ks = sel(); return { eq: { chip: 'Rf', name: "Eluent: " + EL[S.el].n, body: ks.map(function (k) { return '<div class="eqline"><small>' + CP[k].n + '</small>' + fmt(rf(k, e), 2) + '</div>'; }).join('') }, legend: Object.keys(CP).map(function (k) { return { label: CP[k].n, color: '#' + CP[k].c.toString(16).padStart(6, '0'), text: "polarity " + CP[k].p }; }) }; },
    measures: function () { var e = EL[S.el].e, ks = sel().sort(function (a, b) { return rf(b, e) - rf(a, e); }), r = [["Eluent", EL[S.el].n + " (strength " + EL[S.el].e + ')']]; ks.forEach(function (k, j) { r.push([CP[k].n, 'Rf ' + fmt(rf(k, e), 2) + (j ? ' · ΔRf ' + fmt(rf(ks[j - 1], e) - rf(k, e), 2) : '')]); }); return r; },
    ideas: ["Nonpolar compounds come out first.", "More polar eluent → higher Rf.", "Optimal Rf 0.3–0.5.", "The column applies the same principle at preparative scale."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Sample"); el.appendChild(c);
      var tg = document.createElement('div'); tg.className = 'opts two'; c.appendChild(tg);
      Object.keys(CP).forEach(function (k) { var b = document.createElement('button'); b.className = 'opt'; b.innerHTML = CP[k].n + "<small>polarity " + CP[k].p + '</small>'; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); b.addEventListener('click', function () { ctx.goManual(); S.sel[k] = S.sel[k] ? 0 : 1; b.setAttribute('aria-pressed', S.sel[k] ? 'true' : 'false'); }); tg.appendChild(b); });
      ui.el = kit.ui.options({ label: "Eluent", cols: 2, value: S.el, options: Object.keys(EL).map(function (k) { return { v: k, label: EL[k].n }; }), onChange: function (v) { ctx.goManual(); S.el = v; } }); c.appendChild(ui.el);
      ui.p = kit.ui.slider({ label: "Elution progress", min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.run = false; S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: "▶ Run TLC", primary: true, fn: function () { ctx.goManual(); S.mode = 'tlc'; S.p = 0; S.run = true; } }, { t: "Column", fn: function () { ctx.goManual(); S.mode = 'col'; S.p = 0; S.run = true; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Rf versus eluent strength", h: 240, note: "Each curve is one compound; vertical line = current eluent.", draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 0; i <= 10; i += 2) cx.fillText(i, L + pw * i / 10, h - B + 14); cx.fillText("eluent strength", L + pw / 2, h - 6); cx.textAlign = 'right'; for (i = 0; i <= 4; i++) cx.fillText(fmt(i / 4, 2), L - 4, Tp + ph * (1 - i / 4) + 3);
        Object.keys(CP).forEach(function (k) { cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = S.sel[k] ? 3 : 1; cx.beginPath(); for (i = 0; i <= 100; i++) { var e = i / 10; (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * e / 10, Tp + ph * (1 - rf(k, e))); } cx.stroke(); });
        cx.lineWidth = 1; cx.strokeStyle = col.ink; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(L + pw * EL[S.el].e / 10, Tp); cx.lineTo(L + pw * EL[S.el].e / 10, Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#69db7c'; cx.setLineDash([2, 3]); [0.3, 0.5].forEach(function (v) { cx.beginPath(); cx.moveTo(L, Tp + ph * (1 - v)); cx.lineTo(L + pw, Tp + ph * (1 - v)); cx.stroke(); }); cx.setLineDash([]);
      } },
      { title: "Column elution chromatogram", h: 230, note: "Gaussian peaks at V = V₀(1 + k′) with width proportional to √V.", draw: function (cx, w, h, col) {
        var L = 30, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, e = EL[S.el].e, Vmax = 40, i; cx.font = '10px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText("elution volume (V₀ = 3 mL)", L + pw / 2, h - 6);
        sel().forEach(function (k) { var ke = (1 - rf(k, e)) / rf(k, e), V = 3 * (1 + ke), s = 0.25 * Math.sqrt(V); cx.strokeStyle = '#' + CP[k].c.toString(16).padStart(6, '0'); cx.lineWidth = 2; cx.beginPath(); for (i = 0; i <= 200; i++) { var v = Vmax * i / 200, y = Math.exp(-0.5 * Math.pow((v - V) / s, 2)); (i ? cx.lineTo : cx.moveTo).call(cx, L + pw * v / Vmax, Tp + ph * (1 - y * 0.9)); } cx.stroke(); cx.fillStyle = col.muted; if (V < Vmax) cx.fillText(fmt(V, 0), L + pw * V / Vmax, Tp + ph + 12); }); cx.lineWidth = 1;
      } }
    ],
    calc: function () { var e = EL[S.el].e, ks = sel(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">Eluent: " + EL[S.el].n + " (strength " + e + ')</div><table class="calc-table">' + ks.map(function (k) { var r = rf(k, e), kk = (1 - r) / r; return row(CP[k].n, 'Rf = <b>' + fmt(r, 2) + '</b> · k′ = ' + fmt(kk, 2) + ' · Vₑ = ' + fmt(3 * (1 + kk), 1) + ' mL'); }).join('') + "</table><p class=\"muted small\">Didactic model: Rf = 1/(1 + e<sup>0.7(p − e)</sup>), with p the polarity of the compound and e the strength of the eluent.</p>"; },
    quiz: [
      { q: "On silica, the compound that comes out first is the most…", options: ["nonpolar", 'polar', "ionic", "dense"], answer: 0, why: "It interacts least with the silica." },
      { q: "Rf is defined as…", options: ["d compound / d front", "d front / d compound", "d compound − d front", "time / mass"], answer: 0, why: "Always between 0 and 1." },
      { q: "If all the spots stay on the baseline, the eluent is…", options: ["not polar enough; increase it", "too polar", "perfect", "insoluble"], answer: 0, why: "It cannot displace the compounds from the silica." },
      { q: "A good Rf for separating lies between…", options: ['0,3 y 0,5', '0,9 y 1,0', '0,0 y 0,05', '1,2 y 1,5'], answer: 0, why: "There is room on both sides." },
      { q: "On a column, the most polar compound…", options: ["elutes last", "elutes first", "does not elute", "evaporates"], answer: 0, why: "It is retained the most." }
    ],
    help: { intro: "Mark the compounds in the sample, choose the eluent and press “Run TLC” or “Column”.", items: [['Chamber', 'on the plate, the light blue line is the solvent front; each spot travels Rf × the distance of the front.'], ['Controls', 'tick the compounds in the sample, choose the “Eluent” and use “▶ Run TLC”, “Column” or “Elution progress”.'], ['Charts', '“Rf versus eluent strength” and “Column elution chromatogram”.']], try: ['Elute with hexane: polar compounds barely move.', 'Increase the eluent polarity until Rf sits between 0.3 and 0.5.', 'Switch to the column: the least polar compound elutes first.'] }
  };
  MSim.create(def);
})();
