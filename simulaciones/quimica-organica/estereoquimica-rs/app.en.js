/* Estereoquímica: configuración R/S — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

(function () {
  var fmt = SimKit.fmt;
  var G = {
    H: { t: 'H', z: 1, s: [] }, CH3: { t: 'CH₃', z: 6, s: [1, 1, 1] }, Et: { t: 'CH₂CH₃', z: 6, s: [6, 1, 1] }, CH2OH: { t: 'CH₂OH', z: 6, s: [8, 1, 1] }, Vin: { t: 'CH=CH₂', z: 6, s: [6, 6, 1] }, CHO: { t: 'CHO', z: 6, s: [8, 8, 1] }, COOH: { t: 'COOH', z: 6, s: [8, 8, 8] }, Ph: { t: 'C₆H₅', z: 6, s: [6, 6, 6] },
    NH2: { t: 'NH₂', z: 7, s: [1, 1] }, OH: { t: 'OH', z: 8, s: [1] }, F: { t: 'F', z: 9, s: [] }, SH: { t: 'SH', z: 16, s: [1] }, Cl: { t: 'Cl', z: 17, s: [] }, Br: { t: 'Br', z: 35, s: [] }, I: { t: 'I', z: 53, s: [] }
  };
  var KEYS = ['H', 'CH3', 'Et', 'CH2OH', 'Vin', 'CHO', 'COOH', 'Ph', 'NH2', 'OH', 'F', 'SH', 'Cl', 'Br', 'I'];
  var SYM = { 1: 'H', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 16: 'S', 17: 'Cl', 35: 'Br', 53: 'I' };
  function cmp(a, b) { // >0 si a tiene mayor prioridad
    var A = G[a], B = G[b]; if (A.z !== B.z) return A.z - B.z;
    var sa = A.s.slice().sort(function (x, y) { return y - x; }), sb = B.s.slice().sort(function (x, y) { return y - x; });
    for (var i = 0; i < Math.max(sa.length, sb.length); i++) { var x = sa[i] || 0, y = sb[i] || 0; if (x !== y) return x - y; } return 0;
  }
  var DIR = [[0.943, -0.333, 0], [-0.471, -0.333, 0.816], [-0.471, -0.333, -0.816], [0, 1, 0]];
  var S = { slots: ['Br', 'Cl', 'F', 'H'], mirror: false, rank: true, arc: true, challenge: null, score: [0, 0] };
  function analyze(slots) {
    var idx = [0, 1, 2, 3].sort(function (a, b) { return cmp(slots[b], slots[a]); }), tie = false;
    for (var i = 0; i < 3; i++) if (cmp(slots[idx[i]], slots[idx[i + 1]]) === 0) tie = true;
    for (var a = 0; a < 4; a++) for (var b = a + 1; b < 4; b++) if (slots[a] === slots[b]) tie = true;
    var r = []; idx.forEach(function (s, k) { r[s] = k + 1; });
    var v = function (s) { return DIR[s]; }, r1 = v(idx[0]), r2 = v(idx[1]), r3 = v(idx[2]);
    var t = (r1[1] * r2[2] - r1[2] * r2[1]) * r3[0] + (r1[2] * r2[0] - r1[0] * r2[2]) * r3[1] + (r1[0] * r2[1] - r1[1] * r2[0]) * r3[2];
    return { idx: idx, rank: r, tie: tie, t: t, cfg: tie ? '—' : (t < 0 ? 'R' : 'S') };
  }
  function flipCfg(c) { return c === 'R' ? 'S' : (c === 'S' ? 'R' : c); }
  var grp, grpM, arcMesh, arcHead, labs = [], labsM = [], mirrorPlane, camV;
  function stages() {
    return [
      ["Stereogenic center", "Center", "A carbon with four different substituents is chiral", "<p>A <b>stereogenic center</b> (stereocenter) is an atom with <b>four different substituents</b>. It exists in two spatial arrangements that are <b>non-superimposable mirror images</b>: the <b>enantiomers</b>. Here CHFClBr: C bonded to H, F, Cl and Br. Rotate the molecule with the mouse and compare it with its mirror image.</p>"],
      ["CIP priorities", "Priorities", "Rule 1: higher atomic number, higher priority", "<p><b>Cahn–Ingold–Prelog</b> rules: priority 1 to 4 is assigned according to the <b>atomic number</b> of the atom directly bonded to the stereocenter: <b>Br (35) &gt; Cl (17) &gt; F (9) &gt; H (1)</b>. If there is a tie, the next set of atoms is compared (stage 6).</p>"],
      ["Orient the molecule", "Orient", "Look from the side opposite the lowest-priority substituent", "<p>The molecule is oriented so that the <b>priority 4</b> substituent (H) points <b>away from the observer</b>. The camera is placed opposite the H: you see the other three substituents arranged around the center.</p>"],
      ["Direction 1 → 2 → 3", 'R / S', "Clockwise = R (rectus) · counterclockwise = S (sinister)", "<p>Trace <b>1 → 2 → 3</b>. If the turn is <b>clockwise</b>, the center is <b>R</b>; if it is <b>counterclockwise</b>, it is <b>S</b>. The arrow shows the turn. This case: Br → Cl → F seen with H at the back.</p>"],
      ["Enantiomers", "Mirror", "Swapping two substituents inverts R ↔ S", "<p>The <b>mirror image</b> of an R center is S. Swapping any two substituents also inverts the configuration. Enantiomers have the same physical properties (m.p., b.p., solubility) except that they <b>rotate the plane of polarized light in opposite directions</b>, and they react differently with other chiral molecules (receptors, enzymes).</p>"],
      ["Tie-breakers", "Tie-breaker", "If the first atom ties, the next set is examined", "<p>With –CH₂OH, –CH=CH₂, –CH₃ and –H the three carbons tie at Z = 6. Their substituents are compared: <b>CH₂OH (O,H,H) &gt; CH=CH₂ (C,C,H) &gt; CH₃ (H,H,H)</b>, because the first point of difference is O &gt; C. The double bond is duplicated: C=C counts as (C,C).</p>"]
    ];
  }
  var PATHS = [
    { s: ['Br', 'Cl', 'F', 'H'], rank: false, arc: false, mirror: false, v: 'libre' },
    { s: ['Br', 'Cl', 'F', 'H'], rank: true, arc: false, mirror: false, v: 'libre' },
    { s: ['Br', 'Cl', 'F', 'H'], rank: true, arc: false, mirror: false, v: 'cip' },
    { s: ['Br', 'Cl', 'F', 'H'], rank: true, arc: true, mirror: false, v: 'cip' },
    { s: ['Br', 'Cl', 'F', 'H'], rank: true, arc: false, mirror: true, v: 'frontal' },
    { s: ['CH2OH', 'Vin', 'CH3', 'H'], rank: true, arc: true, mirror: false, v: 'cip' }
  ];
  var mapK = { CH3: 'CH3', Et: 'Et' };
  function clear(g) { while (g.children.length) { var c = g.children.pop(); if (c.geometry && c.userData.own) c.geometry.dispose(); } }
  function rebuild(ctx, slots, mir) {
    var T = ctx.T, a = analyze(slots), colr = { 1: 0xff6b3d, 2: 0xfcc419, 3: 0x4dabf7, 4: 0xced4da };
    [[grp, labs, 0], [grpM, labsM, 1]].forEach(function (pair) {
      var g = pair[0], L = pair[1], sg = pair[2] ? -1 : 1; clear(g);
      var c = new T.Mesh(new T.SphereGeometry(0.55, 24, 18), new T.MeshStandardMaterial({ color: 0x3b4450, roughness: 0.4 })); g.add(c);
      for (var s = 0; s < 4; s++) {
        var d = new T.Vector3(DIR[s][0] * sg, DIR[s][1], DIR[s][2]), len = 2.6, e = G[slots[s]], col = (ctx.EL[SYM[e.z]] || [0xcccccc])[0];
        var cyl = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, len, 10), new T.MeshStandardMaterial({ color: 0xbfc7d1, roughness: 0.5 })); cyl.position.copy(d).multiplyScalar(len / 2); cyl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); g.add(cyl);
        var rad = e.z === 1 ? 0.42 : (e.z > 16 ? 0.95 : (e.z > 8 ? 0.65 : 0.8)), sph = new T.Mesh(new T.SphereGeometry(rad, 24, 18), new T.MeshStandardMaterial({ color: col, roughness: 0.35 })); sph.position.copy(d).multiplyScalar(len); g.add(sph);
        var halo = new T.Mesh(new T.TorusGeometry(rad + 0.18, 0.06, 8, 32), new T.MeshBasicMaterial({ color: colr[a.rank[s]], transparent: true, opacity: S.rank ? 0.95 : 0 })); halo.position.copy(sph.position); halo.userData.halo = true; halo.lookAt(new T.Vector3(0, 0, 0).add(halo.position).add(new T.Vector3(0, 0, 1)).multiplyScalar(1)); g.add(halo);
        var lb = L[s]; lb.d = d.clone().multiplyScalar(len + rad + 0.9);
        lb.set((S.rank ? ['①', '②', '③', '④'][a.rank[s] - 1] + ' ' : '') + e.t, S.rank ? (a.rank[s] === 1 ? 'bl-warn' : a.rank[s] === 4 ? 'bl-d' : 'bl-lead') : 'bl-d');
      }
    });
    // flecha 1→2→3
    if (arcMesh) { ctx.scene.remove(arcMesh); arcMesh.geometry.dispose(); ctx.scene.remove(arcHead); }
    if (!a.tie) {
      var r4 = new T.Vector3(DIR[a.idx[3]][0], DIR[a.idx[3]][1], DIR[a.idx[3]][2]).normalize(), n = r4.clone().negate(), e1 = new T.Vector3(1, 0, 0); if (Math.abs(e1.dot(n)) > .9) e1.set(0, 0, 1); e1.sub(n.clone().multiplyScalar(e1.dot(n))).normalize(); var e2 = new T.Vector3().crossVectors(n, e1);
      var th = [0, 1, 2].map(function (k) { var v = new T.Vector3(DIR[a.idx[k]][0], DIR[a.idx[k]][1], DIR[a.idx[k]][2]); return Math.atan2(v.dot(e2), v.dot(e1)); });
      var TP = Math.PI * 2, sgn = ((th[1] - th[0] + TP) % TP) < ((th[2] - th[0] + TP) % TP) ? 1 : -1, tot = sgn > 0 ? (th[2] - th[0] + TP) % TP : (th[0] - th[2] + TP) % TP; tot += 0.5;
      var pts = [], rr = 1.5, hgt = 0.9; for (var k = 0; k <= 30; k++) { var ang = th[0] + sgn * tot * k / 30; pts.push(e1.clone().multiplyScalar(Math.cos(ang) * rr).add(e2.clone().multiplyScalar(Math.sin(ang) * rr)).add(r4.clone().multiplyScalar(-hgt))); }
      var cur = new T.CatmullRomCurve3(pts); arcMesh = new T.Mesh(new T.TubeGeometry(cur, 40, 0.07, 8, false), new T.MeshBasicMaterial({ color: a.cfg === 'R' ? 0xff6b3d : 0x4dabf7 })); ctx.scene.add(arcMesh);
      var tip = pts[30], tan = pts[30].clone().sub(pts[28]).normalize(); arcHead = new T.Mesh(new T.ConeGeometry(0.22, 0.5, 14), new T.MeshBasicMaterial({ color: a.cfg === 'R' ? 0xff6b3d : 0x4dabf7 })); arcHead.position.copy(tip); arcHead.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan); ctx.scene.add(arcHead);
      camV.pos = [n.x * 17, n.y * 17, n.z * 17]; camV.target = [0, 0, 0];
    } else { arcMesh = null; arcHead = null; camV.pos = [0, 4, 17]; }
    S._a = a;
  }
  function key() { return S.slots.join('|') + S.rank + S.arc + S.mirror; }
  var def = {
    key: 'estereoquimica-rs', title: "Stereochemistry: R/S configuration", subtitle: "3D simulator · organic chemistry", accent: { dark: '#fb923c', light: '#c2410c' },
    stages: stages, dur: 11, offset: 0.12,
    views: [{ id: 'libre', label: "Free", pos: [8, 6, 15], target: [0, 0, 0] }, { id: 'cip', label: "From opposite ④", label2: '', pos: [0, 4, 17], target: [0, 0, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 24], target: [3, 0, 0] }, { id: 'sup', label: "Top", pos: [0, 20, 5], target: [0, 0, 0] }],
    layers: [{ id: 'rank', label: "Priorities", icon: '①' }, { id: 'arc', label: "Arrow 1→2→3", icon: '↻' }, { id: 'mirror', label: "Mirror", icon: '⇋' }],
    build: function (ctx) {
      var T = ctx.T, s = ctx.scene; camV = ctx.def.views[1];
      grp = new T.Group(); grpM = new T.Group(); s.add(grp); s.add(grpM); grpM.position.x = 8;
      mirrorPlane = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshPhysicalMaterial({ color: 0xaad4ff, transparent: true, opacity: 0.18, side: T.DoubleSide, roughness: 0.05 })); mirrorPlane.rotation.y = Math.PI / 2; mirrorPlane.position.x = 4; s.add(mirrorPlane);
      for (var i = 0; i < 4; i++) { labs.push(ctx.label('', 'bl-d')); labsM.push(ctx.label('', 'bl-d')); }
      ctx.lcfg = ctx.label('', 'bl-lead'); ctx.lcfgM = ctx.label('', 'bl-lead'); ctx.lmir = ctx.label("Mirror", 'bl-d'); S._k = '';
    },
    frame: function (ctx, f) {
      if (!ctx.P.manual) { var p = PATHS[f.i]; if (S._st !== f.i) { S._st = f.i; S.slots = p.s.slice(); S.rank = p.rank; S.arc = p.arc; S.mirror = p.mirror; } }
      var k = key(); if (S._k !== k) { S._k = k; rebuild(ctx, S.slots, S.mirror); }
      var a = S._a, showArc = S.arc && ctx.layer('arc') && !a.tie, showM = S.mirror && ctx.layer('mirror');
      if (arcMesh) { arcMesh.visible = showArc; arcHead.visible = showArc; }
      grpM.visible = showM; mirrorPlane.visible = showM; grp.position.x = showM ? -4 : 0; grpM.position.x = 4 + (4); mirrorPlane.position.x = 0 + 0; mirrorPlane.position.x = showM ? 0 : 0; if (showM) { grp.position.x = -5.5; grpM.position.x = 5.5; mirrorPlane.position.x = 0; }
      var sh = ctx.layer('rank');
      grp.children.forEach(function (c) { if (c.userData.halo) c.visible = sh && S.rank; });
      labs.forEach(function (l, i) { l.pos(grp.position.x + l.d.x, l.d.y, l.d.z).vis(true); });
      labsM.forEach(function (l, i) { var d = new ctx.T.Vector3(-DIR[i][0], DIR[i][1], DIR[i][2]).multiplyScalar(3.9); l.pos(grpM.position.x + d.x, d.y, d.z).vis(showM); });
      ctx.lcfg.pos(grp.position.x, -3.9, 0).set(a.tie ? "not a stereocenter" : "Configuration " + a.cfg, 'bl-lead').vis(S.rank);
      ctx.lcfgM.pos(grpM.position.x, -3.9, 0).set("Configuration " + flipCfg(a.cfg), 'bl-lead').vis(showM && !a.tie); ctx.lmir.pos(0, 4.3, 0).vis(showM);
      grp.rotation.y += 0; if (!ctx.P.manual) { } 
    },
    onStage: function (i, ctx) { var p = PATHS[i]; S._st = i; S.slots = p.s.slice(); S.rank = p.rank; S.arc = p.arc; S.mirror = p.mirror; S._k = key(); rebuild(ctx, S.slots, S.mirror); ctx.view(p.v); },
    sync: function (ctx) { var u = ctx.ui; if (ctx.P.manual || !u.sel) return; for (var i = 0; i < 4; i++) u.sel[i].set(S.slots[i]); },
    hud: function () { var a = analyze(S.slots); var rows = a.idx.map(function (s, k) { return '<div class="eqline"><small>' + (k + 1) + '</small>' + G[S.slots[s]].t + '</div>'; }).join(''); return { eq: { chip: a.cfg, name: a.tie ? "Not a stereogenic center" : (a.cfg === 'R' ? "(R) · rectus · clockwise" : "(S) · sinister · counterclockwise"), body: rows }, legend: [{ label: '①', color: '#ff6b3d', text: "highest priority" }, { label: '②', color: '#fcc419', text: "second" }, { label: '③', color: '#4dabf7', text: "third" }, { label: '④', color: '#ced4da', text: "lowest (pointing back)" }] }; },
    measures: function () { var a = analyze(S.slots); return [["Substituents", S.slots.map(function (x) { return G[x].t; }).join(', ')], ["Stereocenter", a.tie ? "no (some are identical)" : "yes"], ["Priority ①", G[S.slots[a.idx[0]]].t], ["Priority ④", G[S.slots[a.idx[3]]].t], ["Configuration", a.cfg], ["Enantiomer", flipCfg(a.cfg)]]; },
    ideas: ["Stereocenter: <b>four different substituents</b>.", "CIP: priority by <b>atomic number</b>; if tied, next sphere.", "Lowest priority <b>at the back</b>; 1→2→3 <b>clockwise = R</b>, counterclockwise = S.", "Swapping two substituents or reflecting <b>inverts</b> R/S.", "R/S does not indicate the sign of optical rotation (+/−)."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Substituents"); el.appendChild(c); ui.sel = [];
      var opts = KEYS.map(function (k) { return { v: k, label: G[k].t }; });
      for (var i = 0; i < 4; i++) (function (i) { var o = kit.ui.options({ label: "Position " + (i + 1), cols: 5, value: S.slots[i], options: opts, onChange: function (v) { ctx.goManual(); S.slots[i] = v; S.rank = true; } }); ui.sel.push(o); c.appendChild(o); })(i);
      c.appendChild(ctx.btnRow([{ t: "Swap 1↔2", primary: true, fn: function () { ctx.goManual(); var t = S.slots[0]; S.slots[0] = S.slots[1]; S.slots[1] = t; ui.sel[0].set(S.slots[0]); ui.sel[1].set(S.slots[1]); } }, { t: "Show mirror", fn: function () { ctx.goManual(); S.mirror = !S.mirror; } }, { t: "View from opposite ④", fn: function () { ctx.goManual(); ctx.view('cip'); } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
      var ch = kit.ui.card("Challenge: R or S?"); el.appendChild(ch); var box = document.createElement('div'); ch.appendChild(box);
      function newQ() { var ks = KEYS.slice(), pick = []; while (pick.length < 4) { var k = ks.splice(Math.floor(Math.random() * ks.length), 1)[0]; pick.push(k); } if (pick.indexOf('H') < 0 && Math.random() < .7) pick[3] = 'H'; var a = analyze(pick); if (a.tie) return newQ(); ctx.goManual(); S.slots = pick; S.rank = false; S.arc = false; S.mirror = false; S.challenge = a.cfg; ui.sel.forEach(function (o, i) { o.set(pick[i]); }); ctx.view('cip'); draw(''); }
      function draw(msg) { box.innerHTML = "<p class=\"small\">We place ④ at the back with the camera; decide the direction 1→2→3. Correct: <b>" + S.score[0] + '</b> / ' + S.score[1] + '</p>' + (msg ? '<p><b>' + msg + '</b></p>' : ''); box.appendChild(ctx.btnRow([{ t: "It is R", primary: true, fn: function () { ans('R'); } }, { t: "It is S", primary: true, fn: function () { ans('S'); } }, { t: "Another compound", fn: newQ }])); }
      function ans(x) { if (!S.challenge) { kit.toast("Press “Another compound” first"); return; } S.score[1]++; var ok = x === S.challenge; if (ok) S.score[0]++; S.rank = true; S.arc = true; draw(ok ? "Correct! It is " + S.challenge : "No: it is " + S.challenge + ". Check the priorities."); S.challenge = null; }
      draw('');
    },
    graphs: [{ title: "CIP hierarchy of the substituents", h: 250, note: "Bars: Z of the first atom; the dotted line marks the sum of Z of its substituents (tie-breaker).", draw: function (cx, w, h, c) {
      var a = analyze(S.slots), L = 8, Tp = 10, B = 18, ph = (h - Tp - B) / 4, mx = 56, sc = (w - 150) / mx;
      cx.font = '11px system-ui';
      a.idx.forEach(function (s, k) { var e = G[S.slots[s]], y = Tp + k * ph + 3; cx.fillStyle = ['#ff6b3d', '#fcc419', '#4dabf7', '#ced4da'][k]; cx.fillRect(110, y, Math.max(2, e.z * sc), ph - 8); cx.fillStyle = c.ink; cx.textAlign = 'right'; cx.fillText((k + 1) + ' · ' + e.t, 104, y + ph / 2); cx.textAlign = 'left'; cx.fillText('Z=' + e.z + (e.s.length ? ' (' + e.s.map(function (z) { return SYM[z]; }).join(',') + ')' : ''), 114 + e.z * sc, y + ph / 2); });
      cx.fillStyle = c.muted; cx.textAlign = 'center'; cx.fillText("atomic number of the first atom", w / 2, h - 3); } }],
    calc: function () {
      var a = analyze(S.slots), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; };
      var rows = a.idx.map(function (s, k) { var e = G[S.slots[s]]; return row("Priority " + (k + 1), '<b>' + e.t + "</b> · atom " + SYM[e.z] + ' (Z = ' + e.z + ')' + (e.s.length ? " bonded to (" + e.s.map(function (z) { return SYM[z]; }).join(', ') + ')' : '')); }).join('');
      return "<div class=\"calc-step\">1 · Order by CIP</div><table class=\"calc-table\">" + rows + "</table><div class=\"calc-step\">2 · Orientation and turn</div><table class=\"calc-table\">" + row("④ at the back", G[S.slots[a.idx[3]]].t) + row("Triple product (r₁×r₂)·r₃", fmt(a.t, 3) + (a.t < 0 ? " &lt; 0 ⇒ clockwise" : " &gt; 0 ⇒ counterclockwise")) + row("Configuration", '<b>' + (a.tie ? "no stereocenter" : a.cfg) + '</b>') + row("Enantiomer", flipCfg(a.cfg)) + '</table>';
    },
    quiz: [
      { q: "Order by CIP priority: –OH, –CH₃, –NH₂, –H (from highest to lowest).", options: ['OH > NH₂ > CH₃ > H', 'NH₂ > OH > CH₃ > H', 'OH > CH₃ > NH₂ > H', 'CH₃ > NH₂ > OH > H'], answer: 0, why: 'Z: O (8) > N (7) > C (6) > H (1).' },
      { q: "Which group has higher priority: –CH₂OH or –CH=CH₂?", options: ['–CH₂OH', '–CH=CH₂', "They tie", "Depends on the solvent"], answer: 0, why: "Both start with C; their sets are (O,H,H) and (C,C,H): O > C at the first point of difference." },
      { q: "Order: –COOH, –CHO, –CH₂OH.", options: ["COOH > CHO > CH₂OH", "CHO > COOH > CH₂OH", "CH₂OH > CHO > COOH", "COOH > CH₂OH > CHO"], answer: 0, why: '(O,O,O) > (O,O,H) > (O,H,H).' },
      { q: "With the lowest-priority substituent at the back, 1→2→3 turns clockwise. The configuration is…", options: ['R', 'S', 'Z', 'E'], answer: 0, why: "Clockwise = R (rectus)." },
      { q: "If two substituents are swapped at an R center, the center becomes…", options: ['S', 'R', "meso", "without configuration"], answer: 0, why: "Swapping two substituents is equivalent to the mirror image: R ↔ S." },
      { q: "What do two enantiomers have in common?", options: ["All physical properties except the direction of optical rotation", "The same sign of optical rotation", "The same R/S configuration", "They are diastereomers"], answer: 0, why: "They are non-superimposable mirror images; they rotate the plane of polarized light in opposite directions." },
      { q: "Which has the highest priority among Br, Cl, F and I?", options: ['I', 'Br', 'Cl', 'F'], answer: 0, why: "Iodine (Z = 53) has the highest atomic number." },
      { q: "Is a carbon with two hydrogens (–CH₂–) a stereocenter?", options: ["No, because it has two identical substituents", "Yes, always", "Only if there is a ring", "Only if it is bonded to oxygen"], answer: 0, why: "A stereocenter requires four different substituents." }
    ],
    help: { intro: "Follow the lesson or choose the four substituents in “Lab”. The “From opposite ④” view places the camera as the CIP rule requires.", items: [["Color halos", "indicate the priority ①–④ of each substituent."], ["Arrow", "shows the 1→2→3 turn (orange = R, blue = S)."], ["Mirror", "shows the enantiomer."], ["Challenge", "guess R or S for random compounds."], ['Controls', 'the substituent at each position, swap 1↔2, show mirror and the view from opposite ④.'], ['Chart', 'CIP hierarchy of the substituents.']], try: ['Use the view from opposite ④ and follow 1→2→3: clockwise means R.', 'Swap two substituents: the configuration is inverted.', 'Show the mirror: the enantiomer has the opposite configuration.'] }
  };
  MSim.create(def);
})();
