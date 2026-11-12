/* Reacciones electrocíclicas y sigmatrópicas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var S = { rx: 'ec4', hv: false, ee: true, p: 0 }, g = null, lab = [], atoms = [], bonds = [], lobes = [], grp = [];
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function ne() { return { ec4: 4, ec6: 6, ec8: 8 }[S.rx] || 0; }
  function isEC() { return S.rx.indexOf('ec') === 0; }
  function con() { var n = ne(), th = n % 4 === 0; return th !== S.hv; }  // true = conrotatoria
  function homoK() { var n = ne(); return S.hv ? n / 2 + 1 : n / 2; }
  function sameP() { return (homoK() - 1) % 2 === 0; }
  function ringPos(n, p) { var out = [], i; for (i = 0; i < n; i++) { var a = (n + 1 > 0) ? 2 * Math.PI * (i + 0.5) / (n + 1) : 0, b = 2 * Math.PI * i / n, R1 = 1.5 / (2 * Math.sin(Math.PI / (n + 1))), R2 = 1.5 / (2 * Math.sin(Math.PI / n)), x1 = R1 * Math.sin(a), y1 = -R1 * Math.cos(a), x2 = R2 * Math.sin(b + Math.PI / n), y2 = -R2 * Math.cos(b + Math.PI / n); out.push([x1 + (x2 - x1) * p, y1 + (y2 - y1) * p]); } return out; }
  function mkSphere(r, c) { return new T.Mesh(new T.SphereGeometry(r, 14, 10), new T.MeshStandardMaterial({ color: c, roughness: 0.4 })); }
  function mkCyl(c) { return new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), new T.MeshStandardMaterial({ color: c || 0xced4da })); }
  function setCyl(m, a, b, r) { var d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, Math.max(0.001, d.length()), r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); }
  function stages() {
    return [
      ['Reacciones pericíclicas', 'Pericíclicas', 'Se rompen y forman enlaces en un solo paso concertado, a través de un estado de transición cíclico',
        '<p>Las <b>reacciones pericíclicas</b> son <b>concertadas</b>: los electrones se reordenan en un ciclo, sin intermediarios y sin catalizador. Su estereoquímica queda fijada por la <b>simetría de los orbitales</b> (reglas de <b>Woodward–Hoffmann</b>) y depende de si se activan con <b>calor (Δ)</b> o con <b>luz (hν)</b>. Tres familias: cicloadiciones (Diels–Alder), <b>electrociclaciones</b> y <b>reordenamientos sigmatrópicos</b>.</p>'],
      ['Electrociclación de 4 electrones', 'Butadieno', 'Térmica: conrotatoria · Fotoquímica: disrotatoria',
        '<p>Un polieno conjugado cierra un anillo formando un enlace σ entre los extremos. En el <b>butadieno (4 e⁻)</b> la reacción <b>térmica</b> usa el HOMO (ψ₂) cuyos lóbulos terminales tienen <b>fase opuesta</b>: para que solapen, los extremos giran en el <b>mismo sentido (conrotatoria)</b>. Con luz se promueve un e⁻ a ψ₃ (fases iguales): giro <b>disrotatorio</b>. El <i>trans,trans</i>-2,4-hexadieno da por calor <i>trans</i>-3,4-dimetilciclobuteno.</p>'],
      ['6 y 8 electrones', 'Trieno y tetraeno', '4n e⁻: térmica con; 4n + 2 e⁻: térmica dis (y la luz invierte)',
        '<p>La regla: <b>4n electrones</b> (4, 8): térmica <b>conrotatoria</b>, fotoquímica <b>disrotatoria</b>; <b>4n + 2 electrones</b> (6): térmica <b>disrotatoria</b>, fotoquímica <b>conrotatoria</b>. El hexatrieno (6 e⁻) cierra por calor a ciclohexadieno con giro disrotatorio; el octatetraeno (8 e⁻), de nuevo conrotatorio. Cambia el n.º de electrones y la condición para comprobarlo.</p>'],
      ['Estereoquímica del producto', 'Estereoquímica', 'El isómero E/Z del reactivo y el modo de giro determinan cis/trans en el producto',
        '<p>Si los dos sustituyentes de los extremos están hacia <b>afuera</b> (<i>E,E</i>), el giro <b>conrotatorio</b> los lleva a lados opuestos del anillo (<b>trans</b>) y el <b>disrotatorio</b> al mismo lado (<b>cis</b>). Si uno está hacia adentro (<i>E,Z</i>), ocurre lo contrario. La simulación calcula la posición final de los sustituyentes y deduce cis o trans.</p>'],
      ['Desplazamiento sigmatrópico [1,5] de H', '[1,5]-H', 'Un H migra a lo largo de un sistema pentadienilo por la misma cara (suprafacial)',
        '<p>En un <b>reordenamiento sigmatrópico</b> un enlace σ se desplaza al otro extremo de un sistema π. En el <b>ciclopentadieno</b> el H del CH₂ migra a un carbono vecino: [1,5] con <b>6 electrones</b> (2 π + 2 π + 2 σ). Es <b>térmicamente permitido</b> y <b>suprafacial</b> (el H viaja por la misma cara del sistema π). Ocurre a temperatura ambiente, intercambiando las posiciones del sistema diénico.</p>'],
      ['Transposición de Cope [3,3]', 'Cope', '1,5-Hexadieno ⇌ otro 1,5-hexadieno por un estado de transición en silla',
        '<p>El <b>1,5-hexadieno</b> se transpone [3,3]: se rompe el enlace σ C3–C4 y se forma uno nuevo C1–C6, con migración de ambos π. El estado de transición es una <b>silla de 6 centros</b> (6 e⁻: permitido térmicamente, suprafacial–suprafacial). La variante con un O (<b>transposición de Claisen</b>) forma un carbonilo y es irreversible.</p>']
    ];
  }
  var def = {
    key: 'pericliclicas', title: 'Reacciones electrocíclicas y sigmatrópicas', subtitle: 'Simulador 3D · química orgánica avanzada', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 6, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [6, 6, 14], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 16], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 16, 2], target: [0, 0, 0] }],
    layers: [{ id: 'lob', label: 'Orbitales p / fases', icon: '∞' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 8; i++) { var a = mkSphere(0.5, 0x56606b); g.add(a); atoms.push(a); }
      for (i = 0; i < 10; i++) { var b = mkCyl(); g.add(b); bonds.push(b); }
      for (i = 0; i < 16; i++) { var l = mkSphere(0.5, i % 2 ? 0x4dabf7 : 0xff6b6b); l.material.transparent = true; l.material.opacity = 0.55; l.scale.set(1, 1.6, 1); g.add(l); lobes.push(l); }
      for (i = 0; i < 6; i++) { var m = mkSphere(0.3, i < 2 ? 0xffa94d : 0xf1f3f5); g.add(m); grp.push(m); }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, p, n;
      if (!P.manual) { if (i === 0) { S.rx = 'ec4'; S.hv = false; S.ee = true; } if (i === 1) { S.rx = 'ec4'; S.hv = f.local > 0.5; } if (i === 2) { S.rx = ['ec6', 'ec8', 'ec6'][Math.min(2, Math.floor(f.local * 3))]; S.hv = f.local > 0.66; } if (i === 3) { S.rx = 'ec4'; S.hv = false; S.ee = f.local < 0.5; } if (i === 4) S.rx = 'h15'; if (i === 5) S.rx = 'cope'; p = (i === 1 || i === 2) ? ((f.local * (i === 1 ? 2 : 3)) % 1) : (i === 3 ? (f.local * 2) % 1 : Math.min(1, f.local * 1.15)); S.p = p; }
      p = S.p; var q = sm(p), lOn = ctx.layer('lob');
      atoms.forEach(function (a) { a.visible = false; }); bonds.forEach(function (b) { b.visible = false; }); lobes.forEach(function (l) { l.visible = false; }); grp.forEach(function (m) { m.visible = false; }); lab.forEach(function (l) { l.vis(false); });
      if (isEC()) {
        n = ne(); var pos = ringPos(n, q), A = []; for (var k = 0; k < n; k++) { A.push(V(pos[k][0], pos[k][1], 0)); atoms[k].position.copy(A[k]); atoms[k].visible = true; }
        for (k = 0; k < n - 1; k++) { setCyl(bonds[k], A[k], A[k + 1], 0.07 + 0.05 * (((k % 2) === 0) ? 1 - q : q)); bonds[k].visible = true; }
        if (q > 0.7) { setCyl(bonds[n - 1], A[0], A[n - 1], 0.1 * (q - 0.7) / 0.3 + 0.001); bonds[n - 1].visible = true; }
        var phi = Math.PI / 2 * q, cn = con(), ends = [0, n - 1], cen = V(0, 0, 0), memo = [];
        ends.forEach(function (idx, e) {
          var nb = e === 0 ? A[1] : A[n - 2], ax = nb.clone().sub(A[idx]).normalize(), rad = A[idx].clone().sub(cen); rad.z = 0; rad.normalize(); var perpIn = rad.clone().negate(), ang = (e === 0 ? 1 : (cn ? 1 : -1)) * phi;
          var outV = rad.clone().sub(ax.clone().multiplyScalar(rad.dot(ax))).normalize(), inV = outV.clone().negate(), meIn = !(S.ee || e === 0);  // E,Z: Me del extremo derecho hacia adentro
          var meV = meIn ? inV : outV, hV = meIn ? outV : inV, qn = new T.Quaternion().setFromAxisAngle(ax, ang);
          meV = meV.clone().applyQuaternion(qn); hV = hV.clone().applyQuaternion(qn); var pm = A[idx].clone().add(meV.multiplyScalar(1.25)), ph = A[idx].clone().add(hV.multiplyScalar(0.95));
          grp[e * 2].position.copy(pm); grp[e * 2].visible = true; grp[e * 2 + 1].position.copy(ph); grp[e * 2 + 1].visible = true; memo.push(pm.z);
        });
        for (k = 0; k < n; k++) { var phase = (k % 2 === 0 ? 1 : -1); var ph0 = sameP() ? 1 : -1, sg = (k === 0 ? 1 : (k === n - 1 ? ph0 : 0)); }
        // lóbulos terminales (fase del HOMO) que giran con el extremo
        ends.forEach(function (idx, e) { var s0 = e === 0 ? 1 : (sameP() ? 1 : -1), ang2 = (e === 0 ? 1 : (cn ? 1 : -1)) * phi, nb = e === 0 ? A[1] : A[n - 2], ax = nb.clone().sub(A[idx]).normalize(), qq = new T.Quaternion().setFromAxisAngle(ax, ang2), up = V(0, 0, 1).applyQuaternion(qq); [1, -1].forEach(function (sd, j) { var lb = lobes[e * 2 + j]; lb.visible = lOn; lb.position.copy(A[idx]).addScaledVector(up, sd * 0.85); lb.quaternion.setFromUnitVectors(V(0, 1, 0), up); lb.material.color.setHex((sd * s0) > 0 ? 0xff6b6b : 0x4dabf7); }); });
        var cis = (memo[0] * memo[1]) > 0, done = q > 0.95;
        lab[0].pos(0, 5.4, 0).set(n + ' e⁻ π · ' + (S.hv ? 'fotoquímica (hν)' : 'térmica (Δ)') + ' · giro ' + (cn ? 'conrotatorio' : 'disrotatorio'), 'bl-lead').vis(true);
        lab[1].pos(0, -5.2, 0).set(done ? 'producto: sustituyentes ' + (cis ? 'cis' : 'trans') + ' (' + (S.ee ? 'E,E' : 'E,Z') + ')' : 'HOMO' + (S.hv ? '*' : '') + ' (ψ' + homoK() + '): extremos ' + (sameP() ? 'en fase → disrotatoria' : 'en oposición → conrotatoria'), done ? 'bl-pos' : 'bl-d').vis(true);
      } else if (S.rx === 'h15') {
        var R = 1.25, pts = [], c2;
        for (k = 0; k < 5; k++) { var th = Math.PI / 2 + 2 * Math.PI * k / 5; pts.push(V(R * Math.cos(th) * 1.1, R * Math.sin(th) * 1.1, 0)); atoms[k].position.copy(pts[k]); atoms[k].visible = true; }
        var o1 = [2, 1, 2, 1, 1], o2 = [1, 2, 1, 2, 1], ord = function (k) { return o1[k] + (o2[k] - o1[k]) * q; }; // C1-C2, C2-C3, C3-C4, C4-C5, C5-C1
        for (k = 0; k < 5; k++) { setCyl(bonds[k], pts[k], pts[(k + 1) % 5], 0.045 + 0.04 * ord(k)); bonds[k].visible = true; }
        var from = pts[4].clone(), to = pts[0].clone(), mid = from.clone().add(to).multiplyScalar(0.5); mid.z += 1.8 * Math.sin(Math.PI * q); var hp = from.clone().lerp(to, q); hp.z = 1.0 + 1.4 * Math.sin(Math.PI * q) * 0.8; hp.add(from.clone().multiplyScalar(0).add(V(0, 0, 0)));
        grp[0].visible = true; grp[0].position.copy(hp); grp[0].material.color.setHex(0xf1f3f5); grp[0].scale.setScalar(1.2);
        var hs = [pts[4], pts[0]]; [0, 1].forEach(function (j) { var base = hs[j], o = base.clone(); o.z = -0.9; grp[1 + j].visible = true; grp[1 + j].position.copy(base.clone().add(V(0, 0, 0.0))); grp[1 + j].position.z = -0.9; });
        for (k = 0; k < 5; k++) { var lb = lobes[k]; lb.visible = lOn; lb.position.copy(pts[k]).add(V(0, 0, 0.0)); lb.quaternion.setFromUnitVectors(V(0, 1, 0), V(0, 0, 1)); lb.position.z = (k === 0 || k === 4) ? -0.2 : 0; lb.scale.set(0.8, 1.2, 0.8); lb.material.color.setHex(k % 2 ? 0x4dabf7 : 0xff6b6b); }
        lab[0].pos(0, 4.3, 0).set('[1,5]-H en ciclopentadieno (6 e⁻, térmica, suprafacial)', 'bl-lead').vis(true); lab[1].pos(0, -4.4, 0).set(q < 0.5 ? 'H unido a C5 (sp³)' : 'H unido a C1: los dobles enlaces se desplazan', 'bl-d').vis(true);
      } else {
        var Rr = 1.5, P6 = [], ch = [0.45, -0.45]; for (k = 0; k < 6; k++) { var tt = 2 * Math.PI * k / 6; P6.push(V(Rr * Math.cos(tt), ch[k % 2], Rr * Math.sin(tt))); atoms[k].position.copy(P6[k]); atoms[k].visible = true; }
        var ord0 = [2, 1, 1, 1, 2, 0], ord1 = [1, 2, 0, 2, 1, 1], pair = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];
        pair.forEach(function (pr, j) { var o = ord0[j] + (ord1[j] - ord0[j]) * q, bnd = bonds[j]; if (o < 0.05) { bnd.visible = false; } else { setCyl(bnd, P6[pr[0]], P6[pr[1]], 0.03 + 0.045 * o); bnd.visible = true; bnd.material.transparent = true; bnd.material.opacity = Math.min(1, o); } });
        lab[0].pos(0, 3.6, 0).set('Cope [3,3]: C3–C4 se rompe · C1–C6 se forma (silla)', 'bl-lead').vis(true); lab[1].pos(0, -3.6, 0).set('6 e⁻ · térmica · suprafacial–suprafacial', 'bl-d').vis(true);
        grp.forEach(function (m) { m.visible = false; });
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.rx) u.rx.set(S.rx); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { if (!isEC()) return { eq: { chip: S.rx === 'h15' ? '[1,5]' : '[3,3]', name: S.rx === 'h15' ? 'Desplazamiento de H' : 'Transposición de Cope', body: '<div class="eqline"><small>Electrones</small>6</div><div class="eqline"><small>Condición</small>térmica (Δ)</div><div class="eqline"><small>Modo</small>suprafacial</div>' }, legend: [{ label: 'Lóbulos rojo/azul', color: '#ff6b6b', text: 'fases del orbital p' }] }; var n = ne(); return { eq: { chip: n + ' e⁻', name: 'Electrociclación de ' + n + ' e⁻', body: '<div class="eqline"><small>Condición</small>' + (S.hv ? 'fotoquímica (hν)' : 'térmica (Δ)') + '</div><div class="eqline"><small>Giro</small>' + (con() ? 'conrotatorio' : 'disrotatorio') + '</div><div class="eqline"><small>Fase de extremos</small>' + (sameP() ? 'iguales' : 'opuestas') + '</div>' }, legend: [{ label: 'Lóbulo rojo', color: '#ff6b6b', text: 'fase +' }, { label: 'Lóbulo azul', color: '#4dabf7', text: 'fase −' }, { label: 'Esfera naranja', color: '#ffa94d', text: 'grupo metilo' }] }; },
    measures: function () { if (!isEC()) return [['Reacción', S.rx === 'h15' ? '[1,5]-H' : 'Cope [3,3]'], ['Electrones', '6 (4n + 2)'], ['Condición', 'térmica']]; var n = ne(); return [['Electrones π', String(n) + ' (' + (n % 4 === 0 ? '4n' : '4n + 2') + ')'], ['Condición', S.hv ? 'hν' : 'Δ'], ['Giro', con() ? 'conrotatorio' : 'disrotatorio'], ['HOMO usado', 'ψ' + homoK()], ['Isómero de partida', S.ee ? 'E,E' : 'E,Z']]; },
    ideas: ['4n térmica → conrotatoria.', '4n + 2 térmica → disrotatoria.', 'La luz invierte la selección.', 'E,E + con → trans; E,E + dis → cis.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Reacción'); el.appendChild(c);
      ui.rx = kit.ui.options({ label: 'Reacción', cols: 1, value: S.rx, options: [{ v: 'ec4', label: 'Electrociclación 4 e⁻ (butadieno)' }, { v: 'ec6', label: 'Electrociclación 6 e⁻ (hexatrieno)' }, { v: 'ec8', label: 'Electrociclación 8 e⁻ (octatetraeno)' }, { v: 'h15', label: '[1,5]-H sigmatrópico' }, { v: 'cope', label: 'Cope [3,3]' }], onChange: function (v) { ctx.goManual(); S.rx = v; S.p = 0; } }); c.appendChild(ui.rx);
      c.appendChild(kit.ui.options({ label: 'Activación', cols: 2, value: S.hv ? 'hv' : 'd', options: [{ v: 'd', label: 'Térmica (Δ)' }, { v: 'hv', label: 'Fotoquímica (hν)' }], onChange: function (v) { ctx.goManual(); S.hv = v === 'hv'; } }));
      c.appendChild(kit.ui.options({ label: 'Isómero de partida', cols: 2, value: S.ee ? 'ee' : 'ez', options: [{ v: 'ee', label: 'E,E' }, { v: 'ez', label: 'E,Z' }], onChange: function (v) { ctx.goManual(); S.ee = v === 'ee'; } }));
      ui.p = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Tabla de selección de Woodward–Hoffmann', h: 190, note: 'con = conrotatoria · dis = disrotatoria. Resaltado: tu elección.', draw: function (cx, w, h, col) {
      var rows = [4, 6, 8], L = 58, Rr = 10, Tp = 34, cw = (w - L - Rr) / 2, rh = (h - Tp - 8) / 3; cx.font = '11px system-ui'; cx.textAlign = 'center'; cx.fillStyle = col.muted; cx.fillText('Térmica (Δ)', L + cw / 2, 20); cx.fillText('Fotoquímica (hν)', L + cw * 1.5, 20);
      rows.forEach(function (n, r) { cx.textAlign = 'right'; cx.fillStyle = col.ink; cx.fillText(n + ' e⁻', L - 6, Tp + r * rh + rh / 2 + 4); [false, true].forEach(function (hv, c) { var cn = (n % 4 === 0) !== hv, sel = ne() === n && S.hv === hv && isEC(); cx.fillStyle = sel ? '#ff922b' : (cn ? '#4dabf7' : '#69db7c'); cx.globalAlpha = sel ? 1 : 0.65; cx.fillRect(L + c * cw + 3, Tp + r * rh + 3, cw - 6, rh - 6); cx.globalAlpha = 1; cx.fillStyle = '#10181c'; cx.textAlign = 'center'; cx.fillText(cn ? 'con' : 'dis', L + c * cw + cw / 2, Tp + r * rh + rh / 2 + 4); }); });
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (!isEC()) return '<div class="card-kicker">Regla de Woodward–Hoffmann</div><table class="calc-table">' + row('Componentes', S.rx === 'h15' ? 'π4s + σ2s' : 'π2s + σ2s + π2s') + row('Electrones', '6 = 4n + 2 (n = 1)') + row('Resultado', '<b>permitida térmicamente</b> (supra–supra)') + '</table>'; var n = ne(), th = n % 4 === 0; return '<div class="card-kicker">Electrociclación de ' + n + ' e⁻</div><table class="calc-table">' + row('n.º de electrones', n + ' → ' + (th ? '4n con n = ' + n / 4 : '4n + 2 con n = ' + (n - 2) / 4)) + row('Térmica', th ? 'conrotatoria' : 'disrotatoria') + row('Fotoquímica', th ? 'disrotatoria' : 'conrotatoria') + row('Condición actual', (S.hv ? 'hν' : 'Δ') + ' → <b>' + (con() ? 'conrotatoria' : 'disrotatoria') + '</b>') + row('HOMO que cierra', 'ψ' + homoK() + ' (extremos ' + (sameP() ? 'en fase' : 'en oposición') + ')') + '</table>'; },
    quiz: [
      { q: 'Butadieno por calor cierra con giro…', options: ['conrotatorio', 'disrotatorio', 'sin giro', 'aleatorio'], answer: 0, why: '4 e⁻, térmica: conrotatoria.' },
      { q: 'Hexatrieno por calor cierra con giro…', options: ['disrotatorio', 'conrotatorio', 'no ciclan', 'radical'], answer: 0, why: '4n + 2 térmica: disrotatoria.' },
      { q: 'La luz sobre un sistema de 4 e⁻ da giro…', options: ['disrotatorio', 'conrotatorio', 'ninguno', 'ambos'], answer: 0, why: 'Se invierte la selección.' },
      { q: 'La transposición de Cope es…', options: ['[3,3] sigmatrópica', '[1,5] sigmatrópica', 'cicloadición', 'una sustitución'], answer: 0, why: 'Migra el σ C3–C4 a C1–C6.' },
      { q: 'trans,trans-2,4-hexadieno + Δ da…', options: ['trans-3,4-dimetilciclobuteno', 'cis-3,4-dimetilciclobuteno', 'benceno', 'hexano'], answer: 0, why: 'Giro conrotatorio, grupos E,E → trans.' }
    ],
    help: { intro: 'Elige la reacción, la activación (Δ o hν) y el isómero de partida; mueve «Avance» para ver el giro de los extremos. Los lóbulos muestran la fase del HOMO.', items: [['Orbitales', 'lóbulos rojo y azul = fases del HOMO en los orbitales p; las esferas naranjas son los metilos de los extremos.'], ['Controles', '«Reacción» (electrociclaciones de 4, 6 y 8 e⁻, [1,5]-H sigmatrópico o Cope [3,3]), «Activación» (Δ o hν), «Isómero de partida» (E,E o E,Z) y «Avance de la reacción».'], ['Gráfico', '«Tabla de selección de Woodward–Hoffmann».']], try: ['Butadieno con calor: los extremos giran en el mismo sentido (conrotatorio).', 'Cambia a hν: el giro se invierte (disrotatorio).', 'Con E,E y conrotación, mira dónde quedan los metilos: producto trans.'] }
  };
  MSim.create(def);
})();
