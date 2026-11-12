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
      ['Combinación de orbitales atómicos', 'LCAO', 'ψ(σ) = φ_A + φ_B (enlazante) · ψ(σ*) = φ_A − φ_B (antienlazante)',
        '<p>En la <b>teoría de orbitales moleculares (OM)</b> los orbitales atómicos se combinan (<b>LCAO</b>) y dan tantos OM como OA se mezclan. La suma de fases iguales produce un <b>OM enlazante</b> (densidad electrónica concentrada entre los núcleos, energía menor); la resta, un <b>OM antienlazante (*)</b>, con un <b>plano nodal</b> entre los núcleos y energía mayor. Azul y rojo son las fases (signo) de la función de onda.</p>'],
      ['H₂ y He₂: orden de enlace', 'Orden de enlace', 'OE = (e⁻ enlazantes − e⁻ antienlazantes)/2',
        '<p>Los electrones ocupan los OM de menor energía (principio de <b>Aufbau</b>), máximo 2 por orbital (<b>Pauli</b>) y con espines paralelos en orbitales degenerados (<b>Hund</b>). El <b>orden de enlace</b> = (e⁻ enlazantes − e⁻ antienlazantes)/2. <b>H₂</b>: σ² → OE = 1 (existe, 436 kJ/mol). <b>He₂</b>: σ²σ*² → OE = 0: <b>no se forma</b> una molécula estable.</p>'],
      ['Orbitales σ y π del periodo 2', 'σ y π', 'Solapamiento frontal (σ) y lateral (π) de los orbitales 2p',
        '<p>Con los orbitales <b>2s</b> se forman σ₂ₛ y σ*₂ₛ. Con los <b>2p</b>: el solapamiento frontal (a lo largo del eje) da <b>σ₂ₚ y σ*₂ₚ</b>; el solapamiento lateral de los pₓ y p<sub>y</sub> da dos pares <b>degenerados π₂ₚ y π*₂ₚ</b>, con un plano nodal que contiene el eje. Los π son menos estables que los σ en el mismo tipo de solapamiento porque solapan menos.</p>'],
      ['N₂: llenado y triple enlace', 'N₂', 'σ²σ*²π⁴σ² → OE = 3, diamagnética',
        '<p>El N₂ tiene 10 e⁻ de valencia. En Li₂–N₂, por <b>mezcla s–p</b>, los π₂ₚ quedan por <b>debajo</b> del σ₂ₚ. Configuración: <b>σ₂ₛ² σ*₂ₛ² π₂ₚ⁴ σ₂ₚ²</b>: 8 enlazantes − 2 antienlazantes → <b>OE = 3</b>, el enlace más fuerte de la serie (945 kJ/mol, 110 pm). No tiene e⁻ desapareados: es <b>diamagnética</b>.</p>'],
      ['O₂: paramagnetismo', 'O₂', 'Dos e⁻ desapareados en π*: la molécula es atraída por un imán',
        '<p>A partir del O₂ el σ₂ₚ queda <b>por debajo</b> de los π₂ₚ. Con 12 e⁻ los dos últimos ocupan los <b>dos π*₂ₚ degenerados con espines paralelos</b> (Hund): <b>OE = 2</b> y <b>dos electrones desapareados</b>. Es el gran éxito de la teoría OM: <b>el O₂ líquido es atraído por un imán</b>, algo que la estructura de Lewis (O=O sin electrones solitarios) no predice.</p>'],
      ['La serie completa', 'Serie', 'Más orden de enlace → enlace más corto y fuerte',
        '<p>Recorre la serie: <b>OE</b> = 1 (Li₂), 0 (Be₂), 1 (B₂), 2 (C₂), 3 (N₂), 2 (O₂), 1 (F₂), 0 (Ne₂). A mayor orden de enlace, <b>mayor energía de enlace</b> y <b>menor longitud</b>. B₂ y O₂ son <b>paramagnéticas</b>; Be₂ y Ne₂ casi no existen. La molécula iónica O₂⁺ (OE 2,5) tiene un enlace más corto que O₂, y O₂⁻ (OE 1,5) más largo.</p>']
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
    key: 'orbitales-moleculares', title: 'Orbitales moleculares en diatómicas', subtitle: 'Simulador 3D · química general', accent: { dark: '#a78bfa', light: '#5f3dc4' },
    stages: stages, nStages: 6, dur: 13, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 4, 22], target: [0, 3, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 3, 22], target: [0, 3, 0] }, { id: 'orb', label: 'Orbital', pos: [6, 4, 12], target: [6, 3, 0] }],
    layers: [{ id: 'orb', label: 'Forma del orbital', icon: '☁' }, { id: 'e', label: 'Electrones', icon: '↑↓' }],
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
      lab.t.pos(-6.7, 8.2, 0).set(m.n + ' · ' + ne + ' e⁻ de valencia', 'bl-lead').vis(true);
      lab.b.pos(6.2, 6.2, 0).set(L[S.sel].nm + (L[S.sel].a ? ' (antienlazante)' : ' (enlazante)'), L[S.sel].a ? 'bl-warn' : 'bl-pos').vis(true);
      lab.c.pos(0, -0.8, 0).set('OE = ' + fmt(st.bo, 1) + ' · ' + (st.un ? 'paramagnética (' + st.un + ' e⁻ desapareados)' : 'diamagnética'), 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.mol) u.mol.set(S.mol); if (u.sel) u.sel.set(S.sel); if (!ctx.P.manual && u.fill) u.fill.set(Math.min(S.fill, MID[S.mol].ne)); },
    hud: function () { var m = MID[S.mol], st = stats(m, Math.min(m.ne, S.fill)); return { eq: { chip: 'OM', name: m.n, body: '<div class="eqline"><small>e⁻ valencia</small>' + Math.min(m.ne, S.fill) + '</div><div class="eqline"><small>Enlazantes / anti.</small>' + st.b + ' / ' + st.a + '</div><div class="eqline"><small>Orden de enlace</small>' + fmt(st.bo, 1) + '</div><div class="eqline"><small>Magnetismo</small>' + (st.un ? 'paramagnética' : 'diamagnética') + '</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'fase +' }, { label: 'Rojo', color: '#ff6b5e', text: 'fase −' }, { label: '↑↓', color: '#ffd43b', text: 'electrón (espín)' }] }; },
    measures: function () { var m = MID[S.mol], st = stats(m, Math.min(m.ne, S.fill)); return [['Molécula', m.n], ['e⁻ de valencia', String(Math.min(m.ne, S.fill))], ['Orden de enlace', fmt(st.bo, 1)], ['e⁻ desapareados', String(st.un)], ['Magnetismo', st.un ? 'paramagnética' : 'diamagnética'], ['Energía de enlace', m.De ? m.De + ' kJ/mol' : '≈ 0 (no se forma)'], ['Longitud', m.re ? m.re + ' pm' : '—']]; },
    ideas: ['Los OA se combinan: <b>n OA → n OM</b>.', 'Enlazante: suma de fases · antienlazante: plano nodal.', '<b>OE = (enlazantes − antienlazantes)/2</b>.', 'Li₂–N₂: π por debajo de σ₂ₚ; O₂–Ne₂: al revés.', '<b>O₂ paramagnético</b> (2 e⁻ desapareados en π*).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Molécula'); el.appendChild(c);
      ui.mol = kit.ui.options({ label: 'Diatómica', cols: 5, value: S.mol, options: MOLS.map(function (x) { return { v: x.id, label: x.n }; }), onChange: function (v) { ctx.goManual(); S.mol = v; S.sel = 0; S.fill = 99; } }); c.appendChild(ui.mol);
      ui.sel = kit.ui.slider({ label: 'Orbital mostrado (por energía)', min: 0, max: 7, step: 1, value: S.sel, format: function (v) { var L = levels(MID[S.mol]); return (L[Math.min(v, L.length - 1)] || L[0]).nm; }, onInput: function (v) { ctx.goManual(); S.sel = v; } });
      ui.fill = kit.ui.slider({ label: 'Electrones de valencia colocados', min: 0, max: 16, step: 1, value: 16, format: function (v) { return String(v); }, onInput: function (v) { ctx.goManual(); S.fill = v; } });
      c.appendChild(kit.ui.sliders([ui.sel, ui.fill])); c.appendChild(ctx.btnRow([{ t: 'Llenar electrones', primary: true, fn: function () { ctx.goManual(); S.fill = 99; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Orden de enlace por molécula', h: 220, note: 'Orden de enlace de las diatómicas del periodo 2 (la molécula actual en naranja).', draw: function (cx, w, h, col) {
        var ls = MOLS.slice(2), L = 34, Rr = 10, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / ls.length, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 3; i++) { var y = Tp + ph - ph * i / 3; cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(i, L - 5, y + 3); }
        cx.textAlign = 'center'; ls.forEach(function (m, k) { var o = stats(m, m.ne).bo, hh = ph * o / 3; cx.fillStyle = m.id === S.mol ? '#ff6b3d' : '#a78bfa'; cx.fillRect(L + k * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(m.n, L + k * bw + bw / 2, h - B + 13); });
      } },
      { title: 'Energía de enlace frente a orden de enlace', h: 220, note: 'Más orden de enlace = enlace más fuerte (kJ/mol).', draw: function (cx, w, h, col) {
        var L = 44, Rr = 12, Tp = 14, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (b) { return L + pw * b / 3.3; }, sy = function (e) { return Tp + ph - ph * e / 1000; }, i; cx.font = '10.5px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 4; i++) { var y = sy(250 * i); cx.beginPath(); cx.moveTo(L, y); cx.lineTo(L + pw, y); cx.stroke(); cx.fillText(250 * i, L - 5, y + 3); } cx.textAlign = 'center'; for (i = 0; i <= 3; i++) cx.fillText(i, sx(i), h - B + 13); cx.fillText('orden de enlace  ·  D (kJ/mol)', L + pw / 2, h - 4);
        MOLS.forEach(function (m) { var o = stats(m, m.ne).bo, cur = m.id === S.mol; cx.fillStyle = cur ? '#ff6b3d' : '#a78bfa'; cx.beginPath(); cx.arc(sx(o), sy(m.De), cur ? 6 : 4, 0, 7); cx.fill(); cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText(m.n, sx(o) + 7, sy(m.De) - 5); });
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, m = MID[S.mol], ne = Math.min(m.ne, S.fill), st = stats(m, ne), L = levels(m), occ = fill(m, ne), conf = L.map(function (l, i) { var c = occ[i].reduce(function (a, s) { return a + s[0] + s[1]; }, 0); return c ? l.nm + '<sup>' + c + '</sup>' : ''; }).filter(Boolean).join(' ');
      return '<div class="card-kicker">' + m.n + '</div><div class="calc-step">1 · Configuración electrónica de valencia</div><table class="calc-table">' + row('e⁻', ne) + row('Configuración', conf) + '</table><div class="calc-step">2 · Orden de enlace y magnetismo</div><table class="calc-table">' + row('OE', '(' + st.b + ' − ' + st.a + ') / 2 = <b>' + fmt(st.bo, 1) + '</b>') + row('Desapareados', st.un) + row('Propiedad', st.un ? '<span class="calc-hi">paramagnética</span>' : '<span class="calc-ok">diamagnética</span>') + row('Existencia', st.bo > 0 ? 'molécula estable' : 'no se forma') + '</table>';
    },
    quiz: [
      { q: '¿Cuál es el orden de enlace del N₂?', options: ['3', '2', '2,5', '1'], answer: 0, why: '(8 − 2)/2 = 3.' },
      { q: 'El O₂ es paramagnético porque…', options: ['tiene 2 e⁻ desapareados en π*', 'tiene un enlace simple', 'es muy polar', 'tiene un número impar de e⁻'], answer: 0, why: 'Los dos π*₂ₚ degenerados reciben un electrón cada uno (Hund).' },
      { q: '¿Por qué no existe el He₂?', options: ['OE = 0', 'OE = 1', 'OE = 2', 'su σ* está vacío'], answer: 0, why: 'σ² σ*²: igual número de enlazantes y antienlazantes.' },
      { q: 'Un OM antienlazante se caracteriza por…', options: ['un plano nodal entre los núcleos', 'densidad máxima entre los núcleos', 'menor energía que los OA', 'ser siempre π'], answer: 0, why: 'La resta de fases produce un nodo entre los núcleos y mayor energía.' },
      { q: 'En el C₂ los electrones de valencia que forman enlace son…', options: ['dos pares en π (OE = 2)', 'un par σ', 'tres pares', 'ninguno'], answer: 0, why: 'C₂: σ₂ₛ²σ*₂ₛ²π⁴ → OE = 2, con ambos pares en orbitales π.' },
      { q: 'Si pasamos de O₂ a O₂⁺, la longitud de enlace…', options: ['disminuye', 'aumenta', 'no cambia', 'se duplica'], answer: 0, why: 'Se quita un e⁻ de π*: OE 2 → 2,5.' },
      { q: 'Los OA 2p que solapan lateralmente dan…', options: ['OM π', 'OM σ', 'OM δ', 'OM s'], answer: 0, why: 'El solapamiento lateral produce OM π.' },
      { q: '¿Cuántos OM resultan de combinar 6 OA?', options: ['6', '3', '12', '2'], answer: 0, why: 'El número de OM es igual al número de OA combinados.' }
    ],
    help: { intro: 'Elige la molécula y desplaza «Orbital mostrado» para ver cada OM en 3D; la escalera de energía muestra los electrones. Azul/rojo = fases de la función de onda.', items: [['Orbital 3D', 'lóbulos azul y rojo = fases + y − de la función de onda; un cambio de fase entre los núcleos indica un plano nodal (antienlazante).'], ['Escalera de energía', 'la línea amarilla marca el OM mostrado; las flechas ↑↓ son electrones con su espín.'], ['Controles', '«Diatómica», «Orbital mostrado (por energía)» y «Electrones de valencia colocados»; «Llenar electrones» completa el diagrama.'], ['Gráficos', '«Orden de enlace por molécula» y «Energía de enlace frente a orden de enlace».']], try: ['Compara H₂ y He₂: el He₂ tiene orden de enlace 0.', 'Llena el O₂: quedan dos electrones desapareados en π* (paramagnético).', 'Recorre de Li₂ a Ne₂ y observa dónde se invierte el orden de σ₂ₚ y π₂ₚ.'] }
  };
  MSim.create(def);
})();
