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
    zn_cu: { n: 'Zn + Cu²⁺ (cinc en sulfato de cobre)', eq: 'Zn + Cu²⁺ → Zn²⁺ + Cu', red: 'Zn', oxd: 'Cu2', rn: 'Zn', on: 'Cu²⁺', na: 1, nb: 1, E: 2, hr: 'Zn → Zn²⁺ + 2 e⁻', ho: 'Cu²⁺ + 2 e⁻ → Cu', obs: 'La lámina de cinc se recubre de cobre rojizo y la disolución azul de Cu²⁺ se va decolorando.' },
    cu_ag: { n: 'Cu + Ag⁺ (cobre en nitrato de plata)', eq: 'Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag', red: 'Cu', oxd: 'Ag', rn: 'Cu', on: 'Ag⁺', na: 1, nb: 2, E: 2, hr: 'Cu → Cu²⁺ + 2 e⁻', ho: '2 Ag⁺ + 2 e⁻ → 2 Ag', obs: 'Sobre el alambre de cobre crecen cristales de plata y la disolución se vuelve azul por el Cu²⁺.' },
    na_cl: { n: 'Na + Cl₂ (formación de NaCl)', eq: '2 Na + Cl₂ → 2 NaCl', red: 'Na', oxd: 'Cl', rn: 'Na', on: 'Cl₂', na: 2, nb: 2, E: 2, hr: '2 Na → 2 Na⁺ + 2 e⁻', ho: 'Cl₂ + 2 e⁻ → 2 Cl⁻', obs: 'El sodio arde en cloro gaseoso con llama amarilla y forma cristales blancos de NaCl.' },
    mg_o: { n: 'Mg + O₂ (combustión del magnesio)', eq: '2 Mg + O₂ → 2 MgO', red: 'Mg', oxd: 'O', rn: 'Mg', on: 'O₂', na: 2, nb: 2, E: 4, hr: '2 Mg → 2 Mg²⁺ + 4 e⁻', ho: 'O₂ + 4 e⁻ → 2 O²⁻', obs: 'La cinta de magnesio arde con luz blanca muy intensa y deja un polvo blanco de MgO.' },
    al_cu: { n: 'Al + Cu²⁺ (aluminio en una sal de cobre)', eq: '2 Al + 3 Cu²⁺ → 2 Al³⁺ + 3 Cu', red: 'Al', oxd: 'Cu2', rn: 'Al', on: 'Cu²⁺', na: 2, nb: 3, E: 6, hr: '2 Al → 2 Al³⁺ + 6 e⁻', ho: '3 Cu²⁺ + 6 e⁻ → 3 Cu', obs: 'El aluminio se cubre de cobre y la disolución azul se decolora, porque el Al³⁺ es incoloro.' },
    cl_br: { n: 'Cl₂ + Br⁻ (un halógeno desplaza a un haluro)', eq: 'Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂', red: 'Br', oxd: 'Cl', rn: 'Br⁻', on: 'Cl₂', na: 2, nb: 2, E: 2, hr: '2 Br⁻ → Br₂ + 2 e⁻', ho: 'Cl₂ + 2 e⁻ → 2 Cl⁻', obs: 'La disolución incolora de Br⁻ se vuelve anaranjada al formarse Br₂ por acción del cloro.' }
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
      ['Antes de reaccionar', 'Reactivos', 'Cada especie tiene un número de oxidación',
        '<p>El <b>número de oxidación</b> es la carga que tendría un átomo si los electrones se asignaran al elemento más electronegativo. Aquí hay un átomo de <b>Zn</b> metálico (n.º de oxidación <b>0</b>) junto a un ion <b>Cu²⁺</b> (<b>+2</b>). Las esferas amarillas son los <b>2 e⁻</b> que van a cambiar de dueño en <b>Zn + Cu²⁺ → Zn²⁺ + Cu</b>.</p>', 8],
      ['Oxidación', 'Oxidación', 'Oxidarse es perder electrones',
        '<p><b>Oxidación = pérdida de electrones.</b> El Zn cede sus 2 e⁻: <b>Zn → Zn²⁺ + 2 e⁻</b>. Su número de oxidación <b>aumenta</b> de 0 a +2 y el átomo se encoge al convertirse en catión. Hoy se define por electrones y no por oxígeno: el Zn se oxida aunque aquí no haya O₂.</p>'],
      ['Reducción', 'Reducción', 'Reducirse es ganar electrones',
        '<p><b>Reducción = ganancia de electrones.</b> El Cu²⁺ recibe esos 2 e⁻: <b>Cu²⁺ + 2 e⁻ → Cu</b>. Su número de oxidación <b>disminuye</b> de +2 a 0 y el ion se convierte en un átomo de cobre metálico, más grande que el ion.</p>'],
      ['Dos procesos acoplados', 'Acopladas', 'Los electrones que pierde uno son los que gana el otro',
        '<p>Ninguna de las dos semirreacciones ocurre sola: los electrones que pierde una especie son <b>exactamente</b> los que gana la otra (aquí, 2 e⁻). Al sumarlas resulta la reacción global <b>Zn + Cu²⁺ → Zn²⁺ + Cu</b>, y la suma de los números de oxidación (+2) se conserva.</p>'],
      ['Reductor y oxidante', 'Agentes', 'El que se oxida es el reductor; el que se reduce, el oxidante',
        '<p>La especie que <b>se oxida</b> cede electrones y por eso provoca la reducción de la otra: es el <b>agente reductor</b> (anillo naranja). La que <b>se reduce</b> los capta y provoca la oxidación de la otra: es el <b>agente oxidante</b> (anillo azul). Míralo en tres casos: Zn + Cu²⁺, Na + Cl₂ y Cl₂ + Br⁻.</p>']
    ];
  }

  var def = {
    key: 'oxidacion-reduccion', title: 'Oxidación y reducción: transferencia de electrones', subtitle: 'Simulador 3D · química general', accent: { dark: '#ffa94d', light: '#d9480f' },
    stages: stages, nStages: 5, dur: 10,
    views: [{ id: 'libre', label: 'Libre', pos: [-2.9, 4, 16], target: [-2.9, 2.3, 0] }, { id: 'reductor', label: 'Reductor', pos: [-4.8, 4, 11], target: [-4.8, 2.3, 0] }, { id: 'oxidante', label: 'Oxidante', pos: [2.2, 4, 11], target: [2.2, 2.3, 0] }],
    layers: [{ id: 'e', label: 'Electrones', icon: 'e⁻' }, { id: 'n', label: 'N.º de oxidación', icon: '+2' }, { id: 'ag', label: 'Agentes', icon: '⟳' }],
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
          lr[k].pos(CXR, YC + yR[k] - rad.r[k] - 0.55, 0).set(A.s + sup(zr) + (showN ? '  (n.º ox. ' + nox(zr) + ')' : ''), 'bl-d').vis(true);
        } else lr[k].vis(false);
        if (on2) {
          for (j = 0; j < r.E; j++) if (Math.floor(j / r.rb) === k) fg += clamp((sj(r, j, p) - 0.85) / 0.15, 0, 1);
          fg /= r.rb; rad.o[k] = RS * (B.r0 + (B.r1 - B.r0) * fg); po[k].scale.setScalar(rad.o[k]); po[k].position.set(CXO, YC + yO[k], 0);
          cA.setHex(B.c0); cB.setHex(B.c1); po[k].material.color.copy(cA.lerp(cB, fg));
          ro[k].position.copy(po[k].position); ro[k].scale.setScalar(rad.o[k] * 1.25 * pulse);
          var zo = B.z0 - gained(r, k, p);
          lo[k].pos(CXO, YC + yO[k] - rad.o[k] - 0.55, 0).set(B.s + sup(zo) + (showN ? '  (n.º ox. ' + nox(zo) + ')' : ''), 'bl-d').vis(true);
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
      lab.hr.pos(CXR, topY, 0).set(nl === 0 ? 'Va a oxidarse' : (p < 0.999 ? 'Se oxida: pierde e⁻' : 'Se oxidó · agente reductor'), 'bl-warn').vis(true);
      lab.ho.pos(CXO, topY, 0).set(ng === 0 ? 'Va a reducirse' : (p < 0.999 ? 'Se reduce: gana e⁻' : 'Se redujo · agente oxidante'), 'bl-lead').vis(true);
      lab.mid.pos((CXR + CXO) / 2, topY + 1.4, 0).set('e⁻ perdidos: ' + nl + ' · e⁻ ganados: ' + ng + ' (de ' + r.E + ')', 'bl-d').vis(p > 0.001);
    },
    afterInit: function (ctx) { if (document.body.classList.contains('embed')) { def.views[0].pos = [2.3, 4, 16]; def.views[0].target = [2.3, 2.3, 0]; ctx.camera.position.set(2.3, 4, 16); ctx.controls.target.set(2.3, 2.3, 0); ctx.P.camGoal = null; } },
    sync: function (ctx) { var u = ctx.ui; if (u.r) u.r.set(S.r); if (u.p) u.p.set(Math.round(S.p * 100)); },
    hud: function () {
      var r = R[S.r];
      return { eq: { chip: 'e⁻', name: 'Reacción', body: '<div class="eqline"><small>Ecuación</small>' + r.eq + '</div><div class="eqline"><small>Se oxida (reductor)</small>' + r.rn + '</div><div class="eqline"><small>Se reduce (oxidante)</small>' + r.on + '</div><div class="eqline"><small>e⁻ transferidos</small>' + r.E + '</div>' },
        legend: [{ label: 'Esferas amarillas', color: '#ffd43b', text: 'electrones que pasan del reductor al oxidante' }, { label: 'Anillo naranja', color: '#ff922b', text: 'agente reductor (la especie que se oxida)' }, { label: 'Anillo azul', color: '#4dabf7', text: 'agente oxidante (la especie que se reduce)' }] };
    },
    measures: function () { var r = R[S.r]; return [['Se oxida', r.rn + ' (' + nox(SP[r.red].z0) + ' → ' + nox(SP[r.red].z1) + ')'], ['Se reduce', r.on + ' (' + nox(SP[r.oxd].z0) + ' → ' + nox(SP[r.oxd].z1) + ')'], ['e⁻ perdidos', totLost(r, S.p) + ' de ' + r.E], ['e⁻ ganados', totGained(r, S.p) + ' de ' + r.E], ['Avance', Math.round(S.p * 100) + ' %']]; },
    ideas: ['Oxidación: pérdida de e⁻ (sube el n.º de oxidación).', 'Reducción: ganancia de e⁻ (baja el n.º de oxidación).', 'Se oxida el agente reductor; se reduce el agente oxidante.', 'Los e⁻ perdidos son siempre iguales a los ganados.'],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Reacción redox'); el2.appendChild(c);
      ui.r = kit.ui.options({ label: 'Reacción', cols: 1, value: S.r, options: Object.keys(R).map(function (k) { return { v: k, label: R[k].n }; }), onChange: function (v) { ctx.goManual(); S.r = v; S.anim = false; } });
      ui.p = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 100, step: 1, value: Math.round(S.p * 100), format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.anim = false; S.p = v / 100; } });
      c.appendChild(ui.r); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Reproducir la transferencia', fn: function () { ctx.goManual(); S.p = 0; S.anim = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'N.º de oxidación frente al avance', h: 200, note: 'El número de oxidación de la especie que se oxida sube; el de la que se reduce baja. La línea vertical marca el avance actual.', draw: function (cx, w, h, col) {
      var r = R[S.r], L = 40, B = 30, Tp = 12, pw = w - L - 12, ph = h - Tp - B, i, N = 100, a = SP[r.red], b = SP[r.oxd];
      var lo2 = Math.min(a.z0, a.z1, b.z0, b.z1) - 1, hi2 = Math.max(a.z0, a.z1, b.z0, b.z1) + 1;
      var X = function (p) { return L + pw * p; }, Y = function (v) { return Tp + ph * (1 - (v - lo2) / (hi2 - lo2)); };
      cx.font = '11px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.muted; cx.lineWidth = 1;
      for (i = Math.ceil(lo2); i <= Math.floor(hi2); i++) { cx.globalAlpha = i === 0 ? 0.9 : 0.25; cx.beginPath(); cx.moveTo(L, Y(i)); cx.lineTo(L + pw, Y(i)); cx.stroke(); cx.globalAlpha = 1; cx.fillText(nox(i), L - 6, Y(i) + 4); }
      [[function (p) { return zRed(r, p); }, '#ff922b'], [function (p) { return zOx(r, p); }, '#4dabf7']].forEach(function (d) { cx.strokeStyle = d[1]; cx.lineWidth = 3; cx.beginPath(); for (i = 0; i <= N; i++) { var x = X(i / N), y = Y(d[0](i / N)); if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y); } cx.stroke(); });
      cx.lineWidth = 1; cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(X(S.p), Tp); cx.lineTo(X(S.p), Tp + ph); cx.stroke(); cx.setLineDash([]);
      cx.textAlign = 'left'; cx.fillStyle = '#ff922b'; cx.fillText(r.rn + ' (se oxida)', L + 6, Tp + 12); cx.fillStyle = '#4dabf7'; cx.fillText(r.on + ' (se reduce)', L + 6, Tp + 26);
      cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.fillText('Avance de la reacción', L + pw / 2, h - 8);
    } }],
    calc: function () {
      var r = R[S.r], p = S.p, A = SP[r.red], B = SP[r.oxd], nl = totLost(r, p), ng = totGained(r, p), done = p > 0.999;
      var row = function (a, b, on) { return '<tr' + (on ? '' : ' style="font-style:italic;opacity:.6"') + '><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="calc-step">' + r.eq + '</div><table class="calc-table">' +
        row('Oxidación (pierde e⁻)', r.hr + '<br>n.º de oxidación: ' + nox(A.z0) + ' → ' + nox(A.z1), nl > 0) +
        row('Reducción (gana e⁻)', r.ho + '<br>n.º de oxidación: ' + nox(B.z0) + ' → ' + nox(B.z1), ng > 0) +
        row('Balance de electrones', r.na + ' ' + r.rn + ' × ' + r.ra + ' e⁻ = ' + r.E + ' e⁻ perdidos<br>' + r.nb + ' ' + r.on + ' × ' + r.rb + ' e⁻ = ' + r.E + ' e⁻ ganados', done) +
        row('Agentes', 'Reductor: <b>' + r.rn + '</b> (se oxida)<br>Oxidante: <b>' + r.on + '</b> (se reduce)', done) +
        row('Qué se observa', r.obs, true) + '</table><div class="calc-step">Ahora: ' + nl + ' e⁻ perdidos · ' + ng + ' e⁻ ganados</div>';
    },
    quiz: [
      { q: 'En Zn + Cu²⁺ → Zn²⁺ + Cu, ¿qué especie se oxida?', options: ['Cu²⁺', 'Zn', 'Zn²⁺', 'Cu'], answer: 1, why: 'El Zn pasa de 0 a +2: pierde 2 e⁻.' },
      { q: 'Reducirse significa…', options: ['ganar oxígeno', 'perder electrones', 'ganar electrones', 'aumentar el número de oxidación'], answer: 2, why: 'Al ganar e⁻ el número de oxidación disminuye.' },
      { q: 'El agente reductor es la especie que…', options: ['se oxida', 'se reduce', 'gana electrones', 'no cambia'], answer: 0, why: 'Cede e⁻ y así reduce a la otra especie.' },
      { q: 'En 2 Na + Cl₂ → 2 NaCl, el número de oxidación del Cl pasa de…', options: ['0 a +1', '−1 a 0', '0 a −1', '+1 a −1'], answer: 2, why: 'Cada Cl gana 1 e⁻ y queda como Cl⁻.' },
      { q: 'En 2 Mg + O₂ → 2 MgO, ¿cuántos electrones se transfieren en total?', options: ['2', '4', '6', '1'], answer: 1, why: 'Cada Mg cede 2 e⁻ y hay 2 Mg: 2 × 2 = 4 e⁻.' },
      { q: 'En Cl₂ + 2 Br⁻ → 2 Cl⁻ + Br₂, el agente oxidante es…', options: ['Br⁻', 'Cl₂', 'Cl⁻', 'Br₂'], answer: 1, why: 'El Cl₂ capta e⁻ y oxida al Br⁻.' },
      { q: '¿Cuál de estas reacciones es redox aunque no participa el oxígeno?', options: ['Zn + Cu²⁺ → Zn²⁺ + Cu', 'HCl + NaOH → NaCl + H₂O', 'AgNO₃ + NaCl → AgCl + NaNO₃', 'CaCO₃ → CaO + CO₂'], answer: 0, why: 'Hay transferencia de e⁻: cambian los números de oxidación del Zn y del Cu.' },
      { q: 'Si un reductor cede 6 e⁻ en total, el oxidante debe ganar…', options: ['3 e⁻', '6 e⁻', '12 e⁻', 'ninguno'], answer: 1, why: 'Los e⁻ perdidos son exactamente los ganados.' }
    ],
    help: { intro: 'Elige una reacción y mueve el avance, o pulsa «Reproducir la transferencia». Las esferas amarillas son los electrones que pasan del reductor (izquierda) al oxidante (derecha).', items: [['Partículas', 'a la izquierda, la especie que se oxida (reductor); a la derecha, la que se reduce (oxidante). Los tamaños son esquemáticos, pero respetan la tendencia: un catión es más pequeño que su átomo y un anión es más grande.'], ['Etiquetas', 'cada partícula muestra su símbolo con la carga y, si la capa «N.º de oxidación» está activa, su número de oxidación en ese instante.'], ['Capas', '«Electrones», «N.º de oxidación» y «Agentes» (anillos naranja y azul al terminar la reacción).'], ['Gráfico', 'el número de oxidación de cada especie frente al avance: uno sube y el otro baja.']], try: ['Con Zn + Cu²⁺, mueve el avance despacio y observa cuándo cambia el n.º de oxidación de cada especie.', 'Elige 2 Al + 3 Cu²⁺: ¿por qué hacen falta 2 Al y 3 Cu²⁺ para que los electrones coincidan?', 'Prueba Mg + O₂: el magnesio se oxida, pero ¿el O₂ «oxida» solo por ser oxígeno o por ganar electrones?'] }
  };
  MSim.create(def);
})();
