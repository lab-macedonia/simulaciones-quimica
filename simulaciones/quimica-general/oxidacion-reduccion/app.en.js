/* Oxidación y reducción: transferencia de electrones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;

(function () {
  var T = THREE, CXR = -1.2, CXO = 5.8, YC = 3.2, RS = 0.85;
  /* Especies: z0 = número de oxidación antes, z1 = después; tamaños y colores esquemáticos (catión < átomo < anión) */
  var SP = {
    Zn: { s: 'Zn', z0: 0, z1: 2, c0: 0x8d94d6, c1: 0xc5caf5, r0: 1.15, r1: 0.8 },
    Cu: { s: 'Cu', z0: 0, z1: 2, c0: 0xc88033, c1: 0x4dabf7, r0: 1.15, r1: 0.8 },
    Na: { s: 'Na', z0: 0, z1: 1, c0: 0xab5cf2, c1: 0xd9b8ff, r0: 1.5, r1: 0.95 },
    Mg: { s: 'Mg', z0: 0, z1: 2, c0: 0x69db7c, c1: 0xc0f0c8, r0: 1.35, r1: 0.9 },
    Al: { s: 'Al', z0: 0, z1: 3, c0: 0xadb5bd, c1: 0xe9ecef, r0: 1.25, r1: 0.8 },
    Br: { s: 'Br', z0: -1, z1: 0, c0: 0xf4b183, c1: 0xa0522d, r0: 1.5, r1: 1.2 },
    Cu2: { s: 'Cu', z0: 2, z1: 0, c0: 0x4dabf7, c1: 0xc88033, r0: 0.8, r1: 1.15 },
    Ag: { s: 'Ag', z0: 1, z1: 0, c0: 0xe9ecef, c1: 0xc0c0c0, r0: 1.0, r1: 1.25 },
    Cl: { s: 'Cl', z0: 0, z1: -1, c0: 0x3ddc5a, c1: 0xb2f2bb, r0: 1.0, r1: 1.4 },
    O: { s: 'O', z0: 0, z1: -2, c0: 0xff4d4d, c1: 0xffa8a8, r0: 0.85, r1: 1.35 }
  };
  /* na, nb = partículas que reaccionan; E = electrones transferidos; ra, rb = electrones por partícula */
  var R = {
    zn_cu: { n: 'Zn + Cu²⁺ (zinc in copper sulfate)', eq: 'Zn + Cu²⁺ → Zn²⁺ + Cu', red: 'Zn', oxd: 'Cu2', rn: 'Zn', on: 'Cu²⁺', na: 1, nb: 1, E: 2, hr: 'Zn → Zn²⁺ + 2 e⁻', ho: 'Cu²⁺ + 2 e⁻ → Cu', obs: 'The zinc strip becomes coated with reddish copper and the blue Cu²⁺ solution gradually loses its color.' },
    cu_ag: { n: 'Cu + Ag⁺ (copper in silver nitrate)', eq: 'Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag', red: 'Cu', oxd: 'Ag', rn: 'Cu', on: 'Ag⁺', na: 1, nb: 2, E: 2, hr: 'Cu → Cu²⁺ + 2 e⁻', ho: '2 Ag⁺ + 2 e⁻ → 2 Ag', obs: 'Silver crystals grow on the copper wire and the solution turns blue because of Cu²⁺.' },
    na_cl: { n: 'Na + Cl₂ (formation of NaCl)', eq: '2 Na + Cl₂ → 2 NaCl', red: 'Na', oxd: 'Cl', rn: 'Na', on: 'Cl₂', na: 2, nb: 2, E: 2, hr: '2 Na → 2 Na⁺ + 2 e⁻', ho: 'Cl₂ + 2 e⁻ → 2 Cl⁻', obs: 'Sodium burns in chlorine gas with a yellow flame and forms white NaCl crystals.' },
    mg_o: { n: 'Mg + O₂ (burning of magnesium)', eq: '2 Mg + O₂ → 2 MgO', red: 'Mg', oxd: 'O', rn: 'Mg', on: 'O₂', na: 2, nb: 2, E: 4, hr: '2 Mg → 2 Mg²⁺ + 4 e⁻', ho: 'O₂ + 4 e⁻ → 2 O²⁻', obs: 'The magnesium ribbon burns with a very bright white light and leaves a white powder of MgO.' },
    al_cu: { n: 'Al + Cu²⁺ (aluminum in a copper salt)', eq: '2 Al + 3 Cu²⁺ → 2 Al³⁺ + 3 Cu', red: 'Al', oxd: 'Cu2', rn: 'Al', on: 'Cu²⁺', na: 2, nb: 3, E: 6, hr: '2 Al → 2 Al³⁺ + 6 e⁻', ho: '3 Cu²⁺ + 6 e⁻ → 3 Cu', obs: 'Aluminum becomes coated with copper and the blue solution loses its color, because Al³⁺ is colorless.' },
    cl_br: { n: 'Cl₂ + Br⁻ (a halogen displaces a halide)', eq: 'Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂', red: 'Br', oxd: 'Cl', rn: 'Br⁻', on: 'Cl₂', na: 2, nb: 2, E: 2, hr: '2 Br⁻ → Br₂ + 2 e⁻', ho: 'Cl₂ + 2 e⁻ → 2 Cl⁻', obs: 'The colorless Br⁻ solution turns orange as Br₂ forms under the action of chlorine.' }
  };
  Object.keys(R).forEach(function (k) { R[k].ra = R[k].E / R[k].na; R[k].rb = R[k].E / R[k].nb; });
  var LESSON = ['zn_cu', 'na_cl', 'cl_br'];
  var S = { r: 'zn_cu', p: 0, anim: false };
  var g = null, pr = [], po = [], rr = [], ro = [], el = [], lr = [], lo = [], lab = {}, rad = { r: [0, 0, 0], o: [0, 0, 0] };
  var va = new T.Vector3(), vb = new T.Vector3(), cA = new T.Color(), cB = new T.Color();

  function sup(z) { var a = Math.abs(z); return (a > 1 ? ['', '', '²', '³'][a] : '') + (z > 0 ? '⁺' : (z < 0 ? '⁻' : '')); }
  function nox(z) { return z > 0 ? '+' + z : (z < 0 ? '−' + Math.abs(z) : '0'); }
  function ys(n) { return n === 1 ? [0] : (n === 2 ? [-1.9, 1.9] : [-3, 0, 3]); }
  /* avance del electrón j: 0 = en su átomo de origen, 1 = ya llegó al destino */
  function sj(r, j, p) { return clamp((p - (j / r.E) * 0.3) / 0.7, 0, 1); }
  function lost(r, k, p) { var n = 0, j; for (j = 0; j < r.E; j++) if (Math.floor(j / r.ra) === k && sj(r, j, p) > 0.001) n++; return n; }
  function gained(r, k, p) { var n = 0, j; for (j = 0; j < r.E; j++) if (Math.floor(j / r.rb) === k && sj(r, j, p) > 0.999) n++; return n; }
  function totLost(r, p) { var n = 0, j; for (j = 0; j < r.E; j++) if (sj(r, j, p) > 0.001) n++; return n; }
  function totGained(r, p) { var n = 0, j; for (j = 0; j < r.E; j++) if (sj(r, j, p) > 0.999) n++; return n; }
  function zRed(r, p) { return SP[r.red].z0 + lost(r, 0, p); }
  function zOx(r, p) { return SP[r.oxd].z0 - gained(r, 0, p); }
  function orbit(out, c, rd, j, now) { var th = now * 2.2 + j * 2.4, rho = rd + 0.55; return out.set(c.x + rho * Math.cos(th), c.y + rho * 0.5 * Math.sin(th), c.z + rho * 0.87 * Math.sin(th)); }

  function stages() {
    return [
      ['Before reacting', 'Reactants', 'Every species has an oxidation number',
        '<p>The <b>oxidation number</b> is the charge an atom would have if the electrons were assigned to the more electronegative element. Here there is a metallic <b>Zn</b> atom (oxidation number <b>0</b>) next to a <b>Cu²⁺</b> ion (<b>+2</b>). The yellow spheres are the <b>2 e⁻</b> that will change owner in <b>Zn + Cu²⁺ → Zn²⁺ + Cu</b>.</p>', 8],
      ['Oxidation', 'Oxidation', 'To be oxidized is to lose electrons',
        '<p><b>Oxidation = loss of electrons.</b> Zn gives up its 2 e⁻: <b>Zn → Zn²⁺ + 2 e⁻</b>. Its oxidation number <b>increases</b> from 0 to +2 and the atom shrinks as it becomes a cation. Today it is defined by electrons, not by oxygen: Zn is oxidized even though there is no O₂ here.</p>'],
      ['Reduction', 'Reduction', 'To be reduced is to gain electrons',
        '<p><b>Reduction = gain of electrons.</b> Cu²⁺ receives those 2 e⁻: <b>Cu²⁺ + 2 e⁻ → Cu</b>. Its oxidation number <b>decreases</b> from +2 to 0 and the ion becomes a metallic copper atom, larger than the ion.</p>'],
      ['Two coupled processes', 'Coupled', 'The electrons one species loses are the ones the other gains',
        '<p>Neither half-reaction happens alone: the electrons one species loses are <b>exactly</b> those the other gains (here, 2 e⁻). Adding them gives the overall reaction <b>Zn + Cu²⁺ → Zn²⁺ + Cu</b>, and the sum of the oxidation numbers (+2) is conserved.</p>'],
      ['Reducing and oxidizing agents', 'Agents', 'The species that is oxidized is the reducing agent; the one that is reduced is the oxidizing agent',
        '<p>The species that is <b>oxidized</b> gives up electrons and therefore causes the other to be reduced: it is the <b>reducing agent</b> (orange ring). The one that is <b>reduced</b> takes them up and causes the other to be oxidized: it is the <b>oxidizing agent</b> (blue ring). See it in three cases: Zn + Cu²⁺, Na + Cl₂ and Cl₂ + Br⁻.</p>']
    ];
  }

  var def = {
    key: 'oxidacion-reduccion', title: 'Oxidation and reduction: electron transfer', subtitle: '3D simulator · general chemistry', accent: { dark: '#ffa94d', light: '#d9480f' },
    stages: stages, nStages: 5, dur: 10,
    views: [{ id: 'libre', label: 'Free', pos: [-2.9, 4, 16], target: [-2.9, 2.3, 0] }, { id: 'reductor', label: 'Reducing agent', pos: [-4.8, 4, 11], target: [-4.8, 2.3, 0] }, { id: 'oxidante', label: 'Oxidizing agent', pos: [2.2, 4, 11], target: [2.2, 2.3, 0] }],
    layers: [{ id: 'e', label: 'Electrons', icon: 'e⁻' }, { id: 'n', label: 'Oxidation number', icon: '+2' }, { id: 'ag', label: 'Agents', icon: '⟳' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i, sph = new T.SphereGeometry(1, 32, 24), ring = new T.TorusGeometry(1, 0.05, 8, 48);
      [CXR, CXO].forEach(function (x) { var d = new T.Mesh(new T.CylinderGeometry(3.4, 3.4, 0.12, 48), new T.MeshStandardMaterial({ color: 0x868e96, transparent: true, opacity: 0.28 })); d.position.set(x, -2, 0); g.add(d); });
      for (i = 0; i < 3; i++) {
        var a = new T.Mesh(sph, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 })), b = new T.Mesh(sph, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 }));
        g.add(a); g.add(b); pr.push(a); po.push(b);
        var ra = new T.Mesh(ring, new T.MeshBasicMaterial({ color: 0xff922b })), rb = new T.Mesh(ring, new T.MeshBasicMaterial({ color: 0x4dabf7 }));
        ra.rotation.x = rb.rotation.x = Math.PI / 2; g.add(ra); g.add(rb); rr.push(ra); ro.push(rb);
        lr.push(ctx.label('', 'bl-d')); lo.push(ctx.label('', 'bl-d'));
      }
      var em = new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 });
      for (i = 0; i < 6; i++) { var e = new T.Mesh(sph, em); e.scale.setScalar(0.24); g.add(e); el.push(e); }
      lab.hr = ctx.label('', 'bl-warn'); lab.ho = ctx.label('', 'bl-lead'); lab.mid = ctx.label('', 'bl-d');
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, u = ctx.ease(f.local), k, j;
      if (!P.manual) {
        S.anim = false;
        if (i === 4) { S.r = LESSON[Math.min(2, Math.floor(f.local * 3))]; S.p = 1; }
        else { S.r = 'zn_cu'; S.p = [0, 0.35 * u, 0.35 + 0.65 * u, 1][i]; }
      } else if (S.anim) { S.p = Math.min(1, S.p + dt / 7); if (S.p >= 1) S.anim = false; }
      var r = R[S.r], A = SP[r.red], B = SP[r.oxd], p = S.p, yR = ys(r.na), yO = ys(r.nb), nl = totLost(r, p), ng = totGained(r, p), showN = ctx.layer('n');
      var ringsOn = ctx.layer('ag') && (P.manual ? p > 0.97 : i >= 4), pulse = 1 + 0.05 * Math.sin(ctx.now * 4);
      for (k = 0; k < 3; k++) {
        var on1 = k < r.na, on2 = k < r.nb, fl = 0, fg = 0;
        pr[k].visible = on1; po[k].visible = on2; rr[k].visible = on1 && ringsOn; ro[k].visible = on2 && ringsOn;
        if (on1) {
          for (j = 0; j < r.E; j++) if (Math.floor(j / r.ra) === k) fl += clamp(sj(r, j, p) / 0.15, 0, 1);
          fl /= r.ra; rad.r[k] = RS * (A.r0 + (A.r1 - A.r0) * fl); pr[k].scale.setScalar(rad.r[k]); pr[k].position.set(CXR, YC + yR[k], 0);
          cA.setHex(A.c0); cB.setHex(A.c1); pr[k].material.color.copy(cA.lerp(cB, fl));
          rr[k].position.copy(pr[k].position); rr[k].scale.setScalar(rad.r[k] * 1.25 * pulse);
          var zr = A.z0 + lost(r, k, p);
          lr[k].pos(CXR, YC + yR[k] - rad.r[k] - 0.55, 0).set(A.s + sup(zr) + (showN ? '  (ox. no. ' + nox(zr) + ')' : ''), 'bl-d').vis(true);
        } else lr[k].vis(false);
        if (on2) {
          for (j = 0; j < r.E; j++) if (Math.floor(j / r.rb) === k) fg += clamp((sj(r, j, p) - 0.85) / 0.15, 0, 1);
          fg /= r.rb; rad.o[k] = RS * (B.r0 + (B.r1 - B.r0) * fg); po[k].scale.setScalar(rad.o[k]); po[k].position.set(CXO, YC + yO[k], 0);
          cA.setHex(B.c0); cB.setHex(B.c1); po[k].material.color.copy(cA.lerp(cB, fg));
          ro[k].position.copy(po[k].position); ro[k].scale.setScalar(rad.o[k] * 1.25 * pulse);
          var zo = B.z0 - gained(r, k, p);
          lo[k].pos(CXO, YC + yO[k] - rad.o[k] - 0.55, 0).set(B.s + sup(zo) + (showN ? '  (ox. no. ' + nox(zo) + ')' : ''), 'bl-d').vis(true);
        } else lo[k].vis(false);
      }
      var eOn = ctx.layer('e');
      for (j = 0; j < 6; j++) {
        var m = el[j]; m.visible = eOn && j < r.E; if (!m.visible) continue;
        var kr = Math.floor(j / r.ra), ko = Math.floor(j / r.rb), s = sj(r, j, p);
        va.set(CXR, YC + yR[kr], 0); orbit(va, va.clone(), rad.r[kr], j, ctx.now);
        vb.set(CXO, YC + yO[ko], 0); orbit(vb, vb.clone(), rad.o[ko], j, ctx.now);
        if (s <= 0) m.position.copy(va); else if (s >= 1) m.position.copy(vb);
        else { var q = ctx.ease(s); m.position.copy(va).lerp(vb, q); m.position.y += 2.2 * Math.sin(Math.PI * q); }
      }
      var topY = YC + 3 + 2.2;
      lab.hr.pos(CXR, topY, 0).set(nl === 0 ? 'About to be oxidized' : (p < 0.999 ? 'Being oxidized: loses e⁻' : 'Oxidized · reducing agent'), 'bl-warn').vis(true);
      lab.ho.pos(CXO, topY, 0).set(ng === 0 ? 'About to be reduced' : (p < 0.999 ? 'Being reduced: gains e⁻' : 'Reduced · oxidizing agent'), 'bl-lead').vis(true);
      lab.mid.pos((CXR + CXO) / 2, topY + 1.4, 0).set('e⁻ lost: ' + nl + ' · e⁻ gained: ' + ng + ' (of ' + r.E + ')', 'bl-d').vis(p > 0.001);
    },
    afterInit: function (ctx) { if (document.body.classList.contains('embed')) { def.views[0].pos = [2.3, 4, 16]; def.views[0].target = [2.3, 2.3, 0]; ctx.camera.position.set(2.3, 4, 16); ctx.controls.target.set(2.3, 2.3, 0); ctx.P.camGoal = null; } },
    sync: function (ctx) { var u = ctx.ui; if (u.r) u.r.set(S.r); if (u.p) u.p.set(Math.round(S.p * 100)); },
    hud: function () {
      var r = R[S.r];
      return { eq: { chip: 'e⁻', name: 'Reaction', body: '<div class="eqline"><small>Equation</small>' + r.eq + '</div><div class="eqline"><small>Oxidized (reducing agent)</small>' + r.rn + '</div><div class="eqline"><small>Reduced (oxidizing agent)</small>' + r.on + '</div><div class="eqline"><small>e⁻ transferred</small>' + r.E + '</div>' },
        legend: [{ label: 'Yellow spheres', color: '#ffd43b', text: 'electrons passing from the reducing agent to the oxidizing agent' }, { label: 'Orange ring', color: '#ff922b', text: 'reducing agent (the species that is oxidized)' }, { label: 'Blue ring', color: '#4dabf7', text: 'oxidizing agent (the species that is reduced)' }] };
    },
    measures: function () { var r = R[S.r]; return [['Oxidized', r.rn + ' (' + nox(SP[r.red].z0) + ' → ' + nox(SP[r.red].z1) + ')'], ['Reduced', r.on + ' (' + nox(SP[r.oxd].z0) + ' → ' + nox(SP[r.oxd].z1) + ')'], ['e⁻ lost', totLost(r, S.p) + ' of ' + r.E], ['e⁻ gained', totGained(r, S.p) + ' of ' + r.E], ['Progress', Math.round(S.p * 100) + ' %']]; },
    ideas: ['Oxidation: loss of e⁻ (the oxidation number rises).', 'Reduction: gain of e⁻ (the oxidation number falls).', 'The reducing agent is oxidized; the oxidizing agent is reduced.', 'The e⁻ lost always equal the e⁻ gained.'],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Redox reaction'); el2.appendChild(c);
      ui.r = kit.ui.options({ label: 'Reaction', cols: 1, value: S.r, options: Object.keys(R).map(function (k) { return { v: k, label: R[k].n }; }), onChange: function (v) { ctx.goManual(); S.r = v; S.anim = false; } });
      ui.p = kit.ui.slider({ label: 'Reaction progress', min: 0, max: 100, step: 1, value: Math.round(S.p * 100), format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.anim = false; S.p = v / 100; } });
      c.appendChild(ui.r); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Play the transfer', fn: function () { ctx.goManual(); S.p = 0; S.anim = true; } }, { t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Oxidation number vs. progress', h: 200, note: 'The oxidation number of the species that is oxidized rises; that of the one that is reduced falls. The vertical line marks the current progress.', draw: function (cx, w, h, col) {
      var r = R[S.r], L = 40, B = 30, Tp = 12, pw = w - L - 12, ph = h - Tp - B, i, N = 100, a = SP[r.red], b = SP[r.oxd];
      var lo2 = Math.min(a.z0, a.z1, b.z0, b.z1) - 1, hi2 = Math.max(a.z0, a.z1, b.z0, b.z1) + 1;
      var X = function (p) { return L + pw * p; }, Y = function (v) { return Tp + ph * (1 - (v - lo2) / (hi2 - lo2)); };
      cx.font = '11px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.muted; cx.lineWidth = 1;
      for (i = Math.ceil(lo2); i <= Math.floor(hi2); i++) { cx.globalAlpha = i === 0 ? 0.9 : 0.25; cx.beginPath(); cx.moveTo(L, Y(i)); cx.lineTo(L + pw, Y(i)); cx.stroke(); cx.globalAlpha = 1; cx.fillText(nox(i), L - 6, Y(i) + 4); }
      [[function (p) { return zRed(r, p); }, '#ff922b'], [function (p) { return zOx(r, p); }, '#4dabf7']].forEach(function (d) { cx.strokeStyle = d[1]; cx.lineWidth = 3; cx.beginPath(); for (i = 0; i <= N; i++) { var x = X(i / N), y = Y(d[0](i / N)); if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y); } cx.stroke(); });
      cx.lineWidth = 1; cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(X(S.p), Tp); cx.lineTo(X(S.p), Tp + ph); cx.stroke(); cx.setLineDash([]);
      cx.textAlign = 'left'; cx.fillStyle = '#ff922b'; cx.fillText(r.rn + ' (oxidized)', L + 6, Tp + 12); cx.fillStyle = '#4dabf7'; cx.fillText(r.on + ' (reduced)', L + 6, Tp + 26);
      cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.fillText('Reaction progress', L + pw / 2, h - 8);
    } }],
    calc: function () {
      var r = R[S.r], p = S.p, A = SP[r.red], B = SP[r.oxd], nl = totLost(r, p), ng = totGained(r, p), done = p > 0.999;
      var row = function (a, b, on) { return '<tr' + (on ? '' : ' style="font-style:italic;opacity:.6"') + '><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="calc-step">' + r.eq + '</div><table class="calc-table">' +
        row('Oxidation (loses e⁻)', r.hr + '<br>Oxidation number: ' + nox(A.z0) + ' → ' + nox(A.z1), nl > 0) +
        row('Reduction (gains e⁻)', r.ho + '<br>Oxidation number: ' + nox(B.z0) + ' → ' + nox(B.z1), ng > 0) +
        row('Electron balance', r.na + ' ' + r.rn + ' × ' + r.ra + ' e⁻ = ' + r.E + ' e⁻ lost<br>' + r.nb + ' ' + r.on + ' × ' + r.rb + ' e⁻ = ' + r.E + ' e⁻ gained', done) +
        row('Agents', 'Reducing agent: <b>' + r.rn + '</b> (oxidized)<br>Oxidizing agent: <b>' + r.on + '</b> (reduced)', done) +
        row('What you observe', r.obs, true) + '</table><div class="calc-step">Now: ' + nl + ' e⁻ lost · ' + ng + ' e⁻ gained</div>';
    },
    quiz: [
      { q: 'In Zn + Cu²⁺ → Zn²⁺ + Cu, which species is oxidized?', options: ['Cu²⁺', 'Zn', 'Zn²⁺', 'Cu'], answer: 1, why: 'Zn goes from 0 to +2: it loses 2 e⁻.' },
      { q: 'To be reduced means…', options: ['gaining oxygen', 'losing electrons', 'gaining electrons', 'increasing the oxidation number'], answer: 2, why: 'By gaining e⁻ the oxidation number decreases.' },
      { q: 'The reducing agent is the species that…', options: ['is oxidized', 'is reduced', 'gains electrons', 'does not change'], answer: 0, why: 'It gives up e⁻ and thus reduces the other species.' },
      { q: 'In 2 Na + Cl₂ → 2 NaCl, the oxidation number of Cl goes from…', options: ['0 to +1', '−1 to 0', '0 to −1', '+1 to −1'], answer: 2, why: 'Each Cl gains 1 e⁻ and ends up as Cl⁻.' },
      { q: 'In 2 Mg + O₂ → 2 MgO, how many electrons are transferred in total?', options: ['2', '4', '6', '1'], answer: 1, why: 'Each Mg gives up 2 e⁻ and there are 2 Mg: 2 × 2 = 4 e⁻.' },
      { q: 'In Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂, the oxidizing agent is…', options: ['Br⁻', 'Cl₂', 'Cl⁻', 'Br₂'], answer: 1, why: 'Cl₂ takes up e⁻ and oxidizes Br⁻.' },
      { q: 'Which of these reactions is redox even though oxygen does not take part?', options: ['Zn + Cu²⁺ → Zn²⁺ + Cu', 'HCl + NaOH → NaCl + H₂O', 'AgNO₃ + NaCl → AgCl + NaNO₃', 'CaCO₃ → CaO + CO₂'], answer: 0, why: 'There is e⁻ transfer: the oxidation numbers of Zn and Cu change.' },
      { q: 'If a reducing agent gives up 6 e⁻ in total, the oxidizing agent must gain…', options: ['3 e⁻', '6 e⁻', '12 e⁻', 'none'], answer: 1, why: 'The e⁻ lost are exactly the e⁻ gained.' }
    ],
    help: { intro: 'Choose a reaction and move the progress slider, or press “Play the transfer”. The yellow spheres are the electrons moving from the reducing agent (left) to the oxidizing agent (right).', items: [['Particles', 'on the left, the species that is oxidized (reducing agent); on the right, the one that is reduced (oxidizing agent). Sizes are schematic but follow the trend: a cation is smaller than its atom and an anion is larger.'], ['Labels', 'each particle shows its symbol with its charge and, if the “Oxidation number” layer is on, its oxidation number at that instant.'], ['Layers', '“Electrons”, “Oxidation number” and “Agents” (orange and blue rings when the reaction ends).'], ['Graph', 'the oxidation number of each species against progress: one goes up and the other goes down.']], try: ['With Zn + Cu²⁺, move the progress slowly and watch when each species changes its oxidation number.', 'Choose 2 Al + 3 Cu²⁺: why are 2 Al and 3 Cu²⁺ needed for the electrons to match?', 'Try Mg + O₂: magnesium is oxidized, but does O₂ “oxidize” just for being oxygen or for gaining electrons?'] }
  };
  MSim.create(def);
})();
