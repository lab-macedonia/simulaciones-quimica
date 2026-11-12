/* Orbitales moleculares en diatómicas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); }, T = THREE;
  var MOLS = [
    { id: 'H2', n: 'H₂', ne: 2, g: 1, De: 436, re: 74 },
    { id: 'He2', n: 'He₂', ne: 4, g: 1, De: 0, re: 0 },
    { id: 'Li2', n: 'Li₂', ne: 2, g: 2, De: 105, re: 267 },
    { id: 'Be2', n: 'Be₂', ne: 4, g: 2, De: 9, re: 245 },
    { id: 'B2', n: 'B₂', ne: 6, g: 2, De: 289, re: 159 },
    { id: 'C2', n: 'C₂', ne: 8, g: 2, De: 599, re: 124 },
    { id: 'N2', n: 'N₂', ne: 10, g: 2, De: 945, re: 110 },
    { id: 'O2', n: 'O₂', ne: 12, g: 3, De: 498, re: 121 },
    { id: 'F2', n: 'F₂', ne: 14, g: 3, De: 159, re: 142 },
    { id: 'Ne2', n: 'Ne₂', ne: 16, g: 3, De: 0, re: 0 }
  ], MID = {}; MOLS.forEach(function (m) { MID[m.id] = m; });
  // g=1: 1s; g=2: 2s<2p con mezcla s-p (π antes de σ); g=3: sin mezcla (σ2p antes de π)
  function levels(m) {
    if (m.g === 1) return [{ k: 's', nm: 'σ₁ₛ', t: 'sig', a: 0, d: 1, y: 0.4 }, { k: 'ss', nm: 'σ*₁ₛ', t: 'sig', a: 1, d: 1, y: 4.6 }];
    var L = [{ k: 's', nm: 'σ₂ₛ', t: 'sig', a: 0, d: 1, y: 0.4, s: 1 }, { k: 'ss', nm: 'σ*₂ₛ', t: 'sig', a: 1, d: 1, y: 1.9, s: 1 }];
    if (m.g === 2) L.push({ k: 'p', nm: 'π₂ₚ', t: 'pi', a: 0, d: 2, y: 3.3 }, { k: 'sp', nm: 'σ₂ₚ', t: 'sigp', a: 0, d: 1, y: 3.9 });
    else L.push({ k: 'sp', nm: 'σ₂ₚ', t: 'sigp', a: 0, d: 1, y: 3.2 }, { k: 'p', nm: 'π₂ₚ', t: 'pi', a: 0, d: 2, y: 3.7 });
    L.push({ k: 'ps', nm: 'π*₂ₚ', t: 'pi', a: 1, d: 2, y: 5.4 }, { k: 'sps', nm: 'σ*₂ₚ', t: 'sigp', a: 1, d: 1, y: 6.6 });
    return L;
  }
  function fill(m, ne) { // devuelve ocupación por nivel: array de slots [arriba,abajo]
    var L = levels(m), e = ne, occ = L.map(function (l) { return new Array(l.d).fill(0).map(function () { return [0, 0]; }); }), order = L.map(function (l, i) { return i; }).sort(function (a, b) { return L[a].y - L[b].y; });
    order.forEach(function (i) { var d = L[i].d, n = Math.min(e, 2 * d), s; e -= n; for (s = 0; s < d && n > 0; s++, n--) occ[i][s][0] = 1; for (s = 0; s < d && n > 0; s++, n--) occ[i][s][1] = 1; });
    return occ;
  }
  function stats(m, ne) { var L = levels(m), occ = fill(m, ne), b = 0, a = 0, u = 0; occ.forEach(function (o, i) { o.forEach(function (s) { var c = s[0] + s[1]; if (L[i].a) a += c; else b += c; if (c === 1) u++; }); }); return { bo: (b - a) / 2, b: b, a: a, un: u }; }
  var S = { mol: 'H2', sel: 0, fill: 99, _k: '', _st: -1, anim: false }, lab = [], grp = null, orb = null, lv = [], arrowsM = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function stages() {
    return [
      ["Combination of atomic orbitals", "LCAO", "ψ(σ) = φ_A + φ_B (bonding) · ψ(σ*) = φ_A − φ_B (antibonding)",
        "<p>In <b>molecular orbital (MO) theory</b> atomic orbitals combine (<b>LCAO</b>) and give as many MOs as AOs mixed. Adding equal phases produces a <b>bonding MO</b> (electron density concentrated between the nuclei, lower energy); subtracting gives an <b>antibonding MO (*)</b>, with a <b>nodal plane</b> between the nuclei and higher energy. Blue and red are the phases (sign) of the wave function.</p>"],
      ["H₂ and He₂: bond order", "Bond order", "BO = (bonding e⁻ − antibonding e⁻)/2",
        "<p>Electrons occupy the lowest-energy MOs (<b>Aufbau</b> principle), at most 2 per orbital (<b>Pauli</b>) and with parallel spins in degenerate orbitals (<b>Hund</b>). The <b>bond order</b> = (bonding e⁻ − antibonding e⁻)/2. <b>H₂</b>: σ² → BO = 1 (it exists, 436 kJ/mol). <b>He₂</b>: σ²σ*² → BO = 0: a stable molecule <b>does not form</b>.</p>"],
      ["σ and π orbitals of period 2", 'σ y π', "Head-on (σ) and side-by-side (π) overlap of 2p orbitals",
        "<p>With the <b>2s</b> orbitals, σ₂ₛ and σ*₂ₛ are formed. With the <b>2p</b>: head-on overlap (along the axis) gives <b>σ₂ₚ and σ*₂ₚ</b>; side-by-side overlap of pₓ and p<sub>y</sub> gives two <b>degenerate pairs π₂ₚ and π*₂ₚ</b>, with a nodal plane containing the axis. The π are less stable than the σ for the same kind of overlap because they overlap less.</p>"],
      ["N₂: filling and triple bond", 'N₂', "σ²σ*²π⁴σ² → BO = 3, diamagnetic",
        "<p>N₂ has 10 valence e⁻. In Li₂–N₂, because of <b>s–p mixing</b>, the π₂ₚ lie <b>below</b> the σ₂ₚ. Configuration: <b>σ₂ₛ² σ*₂ₛ² π₂ₚ⁴ σ₂ₚ²</b>: 8 bonding − 2 antibonding → <b>BO = 3</b>, the strongest bond in the series (945 kJ/mol, 110 pm). It has no unpaired e⁻: it is <b>diamagnetic</b>.</p>"],
      ["O₂: paramagnetism", 'O₂', "Two unpaired e⁻ in π*: the molecule is attracted by a magnet",
        "<p>From O₂ on, σ₂ₚ lies <b>below</b> the π₂ₚ. With 12 e⁻ the last two occupy the <b>two degenerate π*₂ₚ with parallel spins</b> (Hund): <b>BO = 2</b> and <b>two unpaired electrons</b>. This is the great success of MO theory: <b>liquid O₂ is attracted by a magnet</b>, something the Lewis structure (O=O with no lone electrons) does not predict.</p>"],
      ["The complete series", "Series", "Higher bond order → shorter and stronger bond",
        "<p>Go through the series: <b>BO</b> = 1 (Li₂), 0 (Be₂), 1 (B₂), 2 (C₂), 3 (N₂), 2 (O₂), 1 (F₂), 0 (Ne₂). The higher the bond order, the <b>greater the bond energy</b> and the <b>shorter the length</b>. B₂ and O₂ are <b>paramagnetic</b>; Be₂ and Ne₂ barely exist. The ionic molecule O₂⁺ (BO 2.5) has a shorter bond than O₂, and O₂⁻ (BO 1.5) a longer one.</p>"]
    ];
  }
  function lobe(c, sx, sy, sz, x, y, z, ph) { var m = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: ph > 0 ? 0x4dabf7 : 0xff6b5e, transparent: true, opacity: 0.62, roughness: 0.4, depthWrite: false })); m.scale.set(sx, sy, sz); m.position.set(x, y, z); c.add(m); }
  function orbital(l) {
    var g = new T.Group(), d = 1.7, b = l.a === 0;
    var nuc = function (x) { var m = new T.Mesh(new T.SphereGeometry(0.28, 14, 10), new T.MeshStandardMaterial({ color: 0xffd43b })); m.position.x = x; g.add(m); }; nuc(-d); nuc(d);
    if (l.t === 'sig') { if (b) { lobe(g, 2.6, 1.7, 1.7, 0, 0, 0, 1); } else { lobe(g, 1.9, 1.5, 1.5, -1.9, 0, 0, 1); lobe(g, 1.9, 1.5, 1.5, 1.9, 0, 0, -1); } }
    else if (l.t === 'sigp') { if (b) { lobe(g, 2.5, 1.0, 1.0, 0, 0, 0, 1); lobe(g, 1.5, 0.8, 0.8, -4.1, 0, 0, -1); lobe(g, 1.5, 0.8, 0.8, 4.1, 0, 0, -1); } else { lobe(g, 1.3, 0.9, 0.9, -1.1, 0, 0, 1); lobe(g, 1.3, 0.9, 0.9, 1.1, 0, 0, -1); lobe(g, 1.6, 0.85, 0.85, -4.0, 0, 0, -1); lobe(g, 1.6, 0.85, 0.85, 4.0, 0, 0, 1); } }
    else { if (b) { lobe(g, 3.3, 1.0, 1.0, 0, 1.2, 0, 1); lobe(g, 3.3, 1.0, 1.0, 0, -1.2, 0, -1); } else { lobe(g, 1.8, 1.0, 1.0, -1.8, 1.2, 0, 1); lobe(g, 1.8, 1.0, 1.0, 1.8, 1.2, 0, -1); lobe(g, 1.8, 1.0, 1.0, -1.8, -1.2, 0, -1); lobe(g, 1.8, 1.0, 1.0, 1.8, -1.2, 0, 1); } }
    return g;
  }
  function rebuild(ctx) {
    var s = ctx.scene; if (grp) s.remove(grp); grp = new T.Group(); var m = MID[S.mol], L = levels(m); lv = [];
    var mk = function (x, y, w, c, dash) { var b = new T.Mesh(new T.BoxGeometry(w, 0.08, 0.08), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: dash ? 0.5 : 1 })); b.position.set(x, y, 0); grp.add(b); return b; };
    var aoy = m.g === 1 ? 2.5 : null;
    if (m.g === 1) { mk(-9.2, 2.5, 1.5, 0x868e96, 1); mk(-4.2, 2.5, 1.5, 0x868e96, 1); }
    else { mk(-9.2, 1.1, 1.5, 0x868e96, 1); mk(-4.2, 1.1, 1.5, 0x868e96, 1); [-0.8, 0, 0.8].forEach(function (o) { mk(-9.2 + o * 0.6, 4.5, 0.45, 0x868e96, 1); mk(-4.2 + o * 0.6, 4.5, 0.45, 0x868e96, 1); }); }
    L.forEach(function (l, i) { var obj = { l: l, ls: [], ar: [] }; for (var s2 = 0; s2 < l.d; s2++) { var x = -6.7 + (l.d === 2 ? (s2 ? 0.8 : -0.8) : 0); obj.ls.push(mk(x, l.y, 1.3, l.a ? 0xff8787 : 0x74c0fc)); for (var k = 0; k < 2; k++) { var cn = new T.Mesh(new T.ConeGeometry(0.17, 0.55, 8), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x665500 })); cn.position.set(x + (k ? 0.28 : -0.28), l.y + 0.35, 0); cn.rotation.z = k ? Math.PI : 0; grp.add(cn); obj.ar.push(cn); } } lv.push(obj); });
    ctx.scene.add(grp); S._k = S.mol;
  }
  function selOrb(ctx) { var m = MID[S.mol], l = levels(m)[Math.max(0, Math.min(levels(m).length - 1, S.sel))]; if (orb) ctx.scene.remove(orb); orb = orbital(l); orb.position.set(6.2, 3, 0); ctx.scene.add(orb); S._ko = S.mol + S.sel; }
  var def = {
    key: 'orbitales-moleculares', title: "Molecular Orbitals in Diatomics", subtitle: "3D Simulator · general chemistry", accent: { dark: '#a78bfa', light: '#5f3dc4' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 22], target: [0, 3, 0] }, { id: 'frontal', label: "Front", pos: [0, 3, 22], target: [0, 3, 0] }, { id: 'orb', label: 'Orbital', pos: [6, 4, 12], target: [6, 3, 0] }],
    layers: [{ id: 'orb', label: "Orbital shape", icon: '☁' }, { id: 'e', label: "Electrons", icon: '↑↓' }],
    build: function (ctx) { for (var i = 0; i < 9; i++) lab.push(ctx.label('', 'bl-d')); lab.t = ctx.label('', 'bl-lead'); lab.b = ctx.label('', 'bl-pos'); lab.c = ctx.label('', 'bl-d'); rebuild(ctx); selOrb(ctx); },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local;
        if (i === 0) { S.mol = 'H2'; S.sel = l < 0.5 ? 0 : 1; S.fill = 99; }
        else if (i === 1) { S.mol = l < 0.5 ? 'H2' : 'He2'; S.sel = (l * 4 | 0) % 2; S.fill = 99; }
        else if (i === 2) { S.mol = 'N2'; S.sel = Math.min(5, Math.floor(l * 6)); S.fill = 99; }
        else if (i === 3) { S.mol = 'N2'; S.sel = 3; S.fill = Math.round(10 * Math.min(1, l / 0.75)); }
        else if (i === 4) { S.mol = 'O2'; S.sel = 4; S.fill = 12; }
        else { var ml = ['Li2', 'Be2', 'B2', 'C2', 'N2', 'O2', 'F2', 'Ne2']; S.mol = ml[Math.min(7, Math.floor(l * 8))]; S.sel = 4; S.fill = 99; }
      }
      var m = MID[S.mol]; if (S._k !== S.mol) rebuild(ctx); S.sel = Math.max(0, Math.min(levels(m).length - 1, S.sel)); if (S._ko !== S.mol + S.sel) selOrb(ctx);
      var L = levels(m), ne = Math.min(m.ne, S.fill), occ = fill(m, ne), eOn = ctx.layer('e');
      lv.forEach(function (o, i) { o.ls.forEach(function (b, s) { b.material.color.setHex(i === S.sel ? 0xffd43b : (o.l.a ? 0xff8787 : 0x74c0fc)); b.scale.y = i === S.sel ? 2.4 : 1; var sl = occ[i][s]; o.ar[s * 2].visible = eOn && !!sl[0]; o.ar[s * 2 + 1].visible = eOn && !!sl[1]; }); });
      orb.visible = ctx.layer('orb'); orb.rotation.x = 0; orb.rotation.y = Math.sin(now * 0.4) * 0.3;
      if (L[S.sel].t === 'pi') orb.rotation.x = (Math.floor(now / 3) % 2) * Math.PI / 2 * 0 + Math.sin(now * 0.8) * 0.4;
      var st = stats(m, ne); L.forEach(function (l, i) { lab[i].pos(-6.7 + (l.d === 2 ? 2.4 : 1.8), l.y, 0).set(l.nm + (l.d === 2 ? ' (×2)' : ''), i === S.sel ? 'bl-lead' : 'bl-d').vis(true); }); for (var k = L.length; k < 9; k++) lab[k].vis(false);
      lab.t.pos(-6.7, 8.2, 0).set(m.n + ' · ' + ne + " valence e⁻", 'bl-lead').vis(true);
      lab.b.pos(6.2, 6.2, 0).set(L[S.sel].nm + (L[S.sel].a ? " (antibonding)" : " (bonding)"), L[S.sel].a ? 'bl-warn' : 'bl-pos').vis(true);
      lab.c.pos(0, -0.8, 0).set("BO = " + fmt(st.bo, 1) + ' · ' + (st.un ? "paramagnetic (" + st.un + " unpaired e⁻)" : "diamagnetic"), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.mol) u.mol.set(S.mol); if (u.sel) u.sel.set(S.sel); if (!ctx.P.manual && u.fill) u.fill.set(Math.min(S.fill, MID[S.mol].ne)); },
    hud: function () { var m = MID[S.mol], st = stats(m, Math.min(m.ne, S.fill)); return { eq: { chip: "MO", name: m.n, body: "<div class=\"eqline\"><small>valence e⁻</small>" + Math.min(m.ne, S.fill) + "</div><div class=\"eqline\"><small>Bonding / anti.</small>" + st.b + ' / ' + st.a + "</div><div class=\"eqline\"><small>Bond order</small>" + fmt(st.bo, 1) + "</div><div class=\"eqline\"><small>Magnetism</small>" + (st.un ? "paramagnetic" : "diamagnetic") + '</div>' }, legend: [{ label: "Blue", color: '#4dabf7', text: "+ phase" }, { label: "Red", color: '#ff6b5e', text: "− phase" }, { label: '↑↓', color: '#ffd43b', text: "electron (spin)" }] }; },
    measures: function () { var m = MID[S.mol], st = stats(m, Math.min(m.ne, S.fill)); return [["Molecule", m.n], ["valence e⁻", String(Math.min(m.ne, S.fill))], ["Bond order", fmt(st.bo, 1)], ["unpaired e⁻", String(st.un)], ["Magnetism", st.un ? "paramagnetic" : "diamagnetic"], ["Bond energy", m.De ? m.De + ' kJ/mol' : "≈ 0 (does not form)"], ["Length", m.re ? m.re + ' pm' : '—']]; },
    ideas: ["AOs combine: <b>n AO → n MO</b>.", "Bonding: sum of phases · antibonding: nodal plane.", "<b>BO = (bonding − antibonding)/2</b>.", "Li₂–N₂: π below σ₂ₚ; O₂–Ne₂: the opposite.", "<b>O₂ is paramagnetic</b> (2 unpaired e⁻ in π*)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Molecule"); el.appendChild(c);
      ui.mol = kit.ui.options({ label: "Diatomic", cols: 5, value: S.mol, options: MOLS.map(function (x) { return { v: x.id, label: x.n }; }), onChange: function (v) { ctx.goManual(); S.mol = v; S.sel = 0; S.fill = 99; } }); c.appendChild(ui.mol);
      ui.sel = kit.ui.slider({ label: "Orbital shown (by energy)", min: 0, max: 7, step: 1, value: S.sel, format: function (v) { var L = levels(MID[S.mol]); return (L[Math.min(v, L.length - 1)] || L[0]).nm; }, onInput: function (v) { ctx.goManual(); S.sel = v; } });
      ui.fill = kit.ui.slider({ label: "Valence electrons placed", min: 0, max: 16, step: 1, value: 16, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.fill = v; } });
      c.appendChild(kit.ui.sliders([ui.sel, ui.fill])); c.appendChild(ctx.btnRow([{ t: "Fill electrons", primary: true, fn: function () { ctx.goManual(); S.fill = 99; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: "Bond order per molecule", h: 220, note: "Bond order of the period-2 diatomics (the current molecule in orange).", draw: function (cx, w, h, col) {
        var ls = MOLS.slice(2), L = 34, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ls.length, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 3; i++) { var y = Tp + ph - ph * i / 3; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; ls.forEach(function (m, k) { var o = stats(m, m.ne).bo, hh = ph * o / 3; cx.fillStyle = m.id === S.mol ? '#ff6b3d' : '#a78bfa'; cx.fillRect(L + k * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(m.n, L + k * bw + bw / 2, h - B + 13); });
      } },
      { title: "Bond energy versus bond order", h: 220, note: "Higher bond order = stronger bond (kJ/mol).", draw: function (cx, w, h, col) {
        var L = 44, Rr = 12, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (b) { return L + pw * b / 3.3; }, sy = function (e) { return Tp + ph - ph * e / 1000; }, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 4; i++) { var y = sy(250 * i); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(250 * i, L - 5, y + 3); } cx.textAlign = 'center'; for (i = 0; i <= 3; i++) cx.fillText(i, sx(i), h - B + 13); cx.fillText("bond order  ·  D (kJ/mol)", L + pw / 2, h - 4);
        MOLS.forEach(function (m) { var o = stats(m, m.ne).bo, cur = m.id === S.mol; cx.fillStyle = cur ? '#ff6b3d' : '#a78bfa'; cx.beginPath(); cx.arc(sx(o), sy(m.De), cur ? 6 : 4, 0, 7); cx.fill(); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(m.n, sx(o) + 7, sy(m.De) - 5); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = MID[S.mol], ne = Math.min(m.ne, S.fill), st = stats(m, ne), L = levels(m), occ = fill(m, ne), conf = L.map(function (l, i) { var c = occ[i].reduce(function (a, s) { return a + s[0] + s[1]; }, 0); return c ? l.nm + '<sup>' + c + '</sup>' : ''; }).filter(Boolean).join(' ');
      return '<div class="card-kicker">' + m.n + "</div><div class=\"calc-step\">1 · Valence electron configuration</div><table class=\"calc-table\">" + row('e⁻', ne) + row("Configuration", conf) + "</table><div class=\"calc-step\">2 · Bond order and magnetism</div><table class=\"calc-table\">" + row("BO", '(' + st.b + ' − ' + st.a + ') / 2 = <b>' + fmt(st.bo, 1) + '</b>') + row("Unpaired", st.un) + row("Property", st.un ? "<span class=\"calc-hi\">paramagnetic</span>" : "<span class=\"calc-ok\">diamagnetic</span>") + row("Existence", st.bo > 0 ? "stable molecule" : "does not form") + '</table>';
    },
    quiz: [
      { q: "What is the bond order of N₂?", options: ['3', '2', '2,5', '1'], answer: 0, why: '(8 − 2)/2 = 3.' },
      { q: "O₂ is paramagnetic because…", options: ["it has 2 unpaired e⁻ in π*", "it has a single bond", "it is very polar", "it has an odd number of e⁻"], answer: 0, why: "The two degenerate π*₂ₚ each receive one electron (Hund)." },
      { q: "Why does He₂ not exist?", options: ['OE = 0', 'OE = 1', 'OE = 2', "its σ* is empty"], answer: 0, why: "σ² σ*²: equal number of bonding and antibonding." },
      { q: "An antibonding MO is characterized by…", options: ["a nodal plane between the nuclei", "maximum density between the nuclei", "lower energy than the AOs", "always being π"], answer: 0, why: "The subtraction of phases produces a node between the nuclei and higher energy." },
      { q: "In C₂ the valence electrons that form bonds are…", options: ["two pairs in π (BO = 2)", "one σ pair", "three pairs", "none"], answer: 0, why: "C₂: σ₂ₛ²σ*₂ₛ²π⁴ → BO = 2, with both pairs in π orbitals." },
      { q: "On going from O₂ to O₂⁺, the bond length…", options: ["decreases", "increases", "does not change", "doubles"], answer: 0, why: "One e⁻ is removed from π*: BO 2 → 2.5." },
      { q: "The 2p AOs that overlap side by side give…", options: ["π MO", "σ MO", "δ MO", "s MO"], answer: 0, why: "Side-by-side overlap produces π MOs." },
      { q: "How many MOs result from combining 6 AOs?", options: ['6', '3', '12', '2'], answer: 0, why: "The number of MOs equals the number of AOs combined." }
    ],
    help: { intro: "Choose the molecule and move “Orbital shown” to see each MO in 3D; the energy ladder shows the electrons. Blue/red = phases of the wave function.", items: [['3D orbital', 'blue and red lobes = + and − phases of the wavefunction; a phase change between the nuclei means a nodal plane (antibonding).'], ['Energy ladder', 'the yellow line marks the MO shown; the ↑↓ arrows are electrons with their spin.'], ['Controls', '“Diatomic”, “Orbital shown (by energy)” and “Valence electrons placed”; “Fill electrons” completes the diagram.'], ['Charts', '“Bond order per molecule” and “Bond energy versus bond order”.']], try: ['Compare H₂ and He₂: He₂ has bond order 0.', 'Fill O₂: two unpaired electrons remain in π* (paramagnetic).', 'Go from Li₂ to Ne₂ and see where the order of σ₂p and π₂p flips.'] }
  };
  MSim.create(def);
})();
