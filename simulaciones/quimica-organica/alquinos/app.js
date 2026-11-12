/* Alquinos: estructura y reacciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



/* Constructor de geometrías 3D a partir de una notación tipo SMILES (sin anillos, salvo el fenilo «Ph»).
   MSim.build('CC{ol}O{ol}') -> { a:[[el,x,y,z]], b:[[i,j,orden]], tag:[etiqueta|null por átomo] }
   Reglas: sp3 tetraédrico (zigzag anti), sp2 plano (trans), sp lineal; los H se completan por valencia.
   Etiquetas: átomo{nombre} (los H unidos a N, O, S heredan la etiqueta; con «nombre+» también los de C). */
(function () {
  var T = THREE, V = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1 };
  var BL = { 'C-C1': 1.54, 'C-C2': 1.34, 'C-C3': 1.20, 'C-O1': 1.43, 'C-O2': 1.22, 'C-N1': 1.47, 'C-N2': 1.28, 'C-N3': 1.16, 'C-F1': 1.35, 'C-Cl1': 1.77, 'C-Br1': 1.94, 'C-I1': 2.14, 'C-S1': 1.82, 'C-S2': 1.60, 'C-H1': 1.09, 'H-O1': 0.96, 'H-N1': 1.01, 'H-S1': 1.34, 'N-O1': 1.40, 'N-O2': 1.22, 'O-S2': 1.45, 'O-P2': 1.48, 'O-P1': 1.60, 'C-P1': 1.84, 'O-O1': 1.45, 'N-N1': 1.45, 'H-P1': 1.42 };
  function bl(a, b, o) { var k = [a, b].sort().join('-') + o; return BL[k] || BL[[b, a].join('-') + o] || 1.5; }
  function parse(s) {
    var i = 0, root = null, nodes = [];
    function seq(parent, ord) {
      var prev = parent;
      while (i < s.length) {
        var ch = s[i];
        if (ch === '(') { i++; seq(prev, 1); continue; }
        if (ch === ')') { i++; return; }
        if (ch === '=') { ord = 2; i++; continue; } if (ch === '#') { ord = 3; i++; continue; } if (ch === '-') { i++; continue; }
        var el = s[i]; if (s.substr(i, 2) === 'Cl' || s.substr(i, 2) === 'Br' || s.substr(i, 2) === 'Ph') { el = s.substr(i, 2); } i += el.length;
        var nd = { el: el, ord: parent || prev ? ord : 0, kids: [], par: prev, tag: null, inh: false, id: nodes.length }; nodes.push(nd);
        if (prev) prev.kids.push(nd); else root = nd; ord = 1;
        if (s[i] === '{') { var j = s.indexOf('}', i), tg = s.substring(i + 1, j); i = j + 1; if (tg.slice(-1) === '+') { nd.inh = true; tg = tg.slice(0, -1); } nd.tag = tg; }
        prev = nd;
      }
    }
    seq(null, 1); return { root: root, nodes: nodes };
  }
  function hyb(n) {
    if (n.el === 'Ph') return 'ring'; var ords = n.kids.map(function (k) { return k.ord; }); if (n.par) ords.push(n.ord);
    if (ords.indexOf(3) >= 0 || (n.el === 'C' && ords.filter(function (o) { return o === 2; }).length >= 2)) return 'sp';
    if (ords.indexOf(2) >= 0) return 'sp2';
    if (n.el === 'N') { var nb = n.kids.concat(n.par ? [n.par] : []); if (nb.some(function (m) { return m.el === 'C' && ((m.kids.some(function (k) { return k.el === 'O' && k.ord === 2; })) || (m.par === n && false)); })) return 'sp2'; }
    return 'sp3';
  }
  function nH(n) { var sum = n.kids.reduce(function (a, k) { return a + k.ord; }, 0) + (n.par ? n.ord : 0); if (n.el === 'Ph') return 0; if (n.el === 'N' && sum > 3) return 0; return Math.max(0, (V[n.el] || 0) - sum); }
  function perp(u, ref) { var p = ref ? ref.clone().sub(u.clone().multiplyScalar(ref.dot(u))) : null; if (!p || p.lengthSq() < 1e-6) { p = Math.abs(u.x) < 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1); p.sub(u.clone().multiplyScalar(p.dot(u))); } return p.normalize(); }
  function build(s) {
    var tr = parse(s), A = [], B = [], TAG = [];
    function add(el, p, tag) { A.push([el, p.x, p.y, p.z]); TAG.push(tag || null); return A.length - 1; }
    function bond(i, j, o) { B.push([i, j, o || 1]); }
    function dirsFor(h, u, ref, isRoot) {
      var e1 = perp(u, ref), e2 = new T.Vector3().crossVectors(u, e1), out = [];
      if (h === 'sp') { out = [u.clone().negate()]; if (isRoot) out.unshift(u.clone()); return out; }
      if (h === 'sp2') { out = [u.clone().multiplyScalar(-0.5).addScaledVector(e1, -0.866), u.clone().multiplyScalar(-0.5).addScaledVector(e1, 0.866)]; if (isRoot) out.unshift(u.clone()); return out; }
      for (var i = 0; i < 3; i++) { var f = Math.PI + i * 2 * Math.PI / 3; out.push(u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, 0.9428 * Math.cos(f)).addScaledVector(e2, 0.9428 * Math.sin(f))); }
      if (isRoot) out.unshift(u.clone()); return out;
    }
    function place(n, pos, u, gp, idx) {
      n.pos = pos; var ref = gp ? gp.clone().sub(pos) : null; var h = hyb(n), tagH = n.tag && (n.inh || n.el === 'N' || n.el === 'O' || n.el === 'S') ? n.tag : null;
      if (h === 'ring') {
        var R = 1.40, uu = u ? u : new T.Vector3(0, 1, 0), w = perp(uu, ref), ctr = pos.clone().addScaledVector(uu, -R), ids = [idx];
        for (var k = 1; k < 6; k++) { var th = k * Math.PI / 3, p = ctr.clone().addScaledVector(uu, Math.cos(th) * R).addScaledVector(w, Math.sin(th) * R); var id = add('C', p, n.tag); ids.push(id); }
        for (k = 0; k < 6; k++) bond(ids[k], ids[(k + 1) % 6], k % 2 ? 1 : 2);
        for (k = 0; k < 6; k++) { if (k === 0 && u) continue; var q = new T.Vector3(A[ids[k]][1], A[ids[k]][2], A[ids[k]][3]), d = q.clone().sub(ctr).normalize(), hp = q.clone().addScaledVector(d, 1.08), hid = add('H', hp, n.inh ? n.tag : null); bond(ids[k], hid, 1); }
        return;
      }
      var subs = n.kids.slice(), nh = nH(n), dirs = dirsFor(h, u || new T.Vector3(0, 1, 0), ref, !n.par), si = 0;
      subs.forEach(function (c) { var d = dirs[si++] || dirs[0], len = bl(n.el, c.el === 'Ph' ? 'C' : c.el, c.ord), p = pos.clone().addScaledVector(d, len), id = add(c.el === 'Ph' ? 'C' : c.el, p, c.tag); bond(idx, id, c.ord); place(c, p, d.clone().negate(), n.par ? n.par.pos : null, id); });
      for (var k = 0; k < nh; k++) { var d2 = dirs[si++] || dirs[0], hl = bl(n.el, 'H', 1), hp2 = pos.clone().addScaledVector(d2, hl), hid2 = add('H', hp2, tagH); bond(idx, hid2, 1); }
    }
    var r = tr.root, rp = new T.Vector3(0, 0, 0), ri = add(r.el === 'Ph' ? 'C' : r.el, rp, r.tag); place(r, rp, null, null, ri);
    var c = new T.Vector3(); A.forEach(function (a) { c.x += a[1]; c.y += a[2]; c.z += a[3]; }); c.multiplyScalar(1 / A.length); A.forEach(function (a) { a[1] -= c.x; a[2] -= c.y; a[3] -= c.z; });
    return { a: A, b: B, tag: TAG };
  }
  MSim.build = build;
})();


(function () {
  var T = THREE;
  var SUB = { prop: { n: 'Propino', s: 'CC#C', t: true }, but1: { n: '1-Butino', s: 'CCC#C', t: true }, but2: { n: '2-Butino', s: 'CC#CC', t: false } };
  var RX = {
    none: { n: 'Sin reacción', r: '' },
    nanh2: { n: 'Desprotonación (NaNH₂)', r: 'NaNH₂, NH₃(l)', note: 'El H terminal (pKa ≈ 25) se desprotona: se forma el acetiluro, un buen nucleófilo.' },
    h2pd: { n: 'H₂ / Pd-C', r: 'H₂ (exceso), Pd/C', note: 'Hidrogenación completa a alcano; no se detiene en el alqueno.' },
    lindlar: { n: 'H₂ / Lindlar', r: 'H₂, Pd/CaCO₃ envenenado', note: 'Adición sin al mismo lado: alqueno cis (Z).' },
    nanh3: { n: 'Na / NH₃(l)', r: 'Na, NH₃(l)', note: 'Reducción por disolución del metal: alqueno trans (E).' },
    h2o: { n: 'H₂O, H₂SO₄, HgSO₄', r: 'H₂O, H₂SO₄, HgSO₄', note: 'Hidratación Markovnikov: el enol se tautomeriza a cetona.' },
    hbo: { n: 'Hidroboración–oxidación', r: '1) R₂BH   2) H₂O₂, NaOH', note: 'Anti-Markovnikov: el enol da un aldehído (alquino terminal).' },
    hx: { n: 'HBr (1 equiv.)', r: 'HBr', note: 'Adición Markovnikov: haloalqueno; con exceso, dihaluro geminal.' }
  };
  var PR = {
    prop: { nanh2: ['CC#C', 'Acetiluro de propino'], h2pd: ['CCC', 'Propano'], lindlar: ['CC=C', 'Propeno'], nanh3: ['CC=C', 'Propeno'], h2o: ['CC(=O)C', 'Propanona (acetona)'], hbo: ['CCC=O', 'Propanal'], hx: ['CC(Br)=C', '2-Bromopropeno'] },
    but1: { nanh2: ['CCC#C', 'Acetiluro de 1-butino'], h2pd: ['CCCC', 'Butano'], lindlar: ['CCC=C', '1-Buteno'], nanh3: ['CCC=C', '1-Buteno'], h2o: ['CCC(=O)C', 'Butanona'], hbo: ['CCCC=O', 'Butanal'], hx: ['CCC(Br)=C', '2-Bromo-1-buteno'] },
    but2: { nanh2: null, h2pd: ['CCCC', 'Butano'], lindlar: ['CC=CC', '(Z)-2-Buteno'], nanh3: ['CC=CC', '(E)-2-Buteno'], h2o: ['CCC(=O)C', 'Butanona'], hbo: ['CCC(=O)C', 'Butanona'], hx: ['CC=C(Br)C', '2-Bromo-2-buteno'] }
  };
  var S = { sub: 'but1', rx: 'none' }, g = null, gS = null, gP = null, arrow = null, lab = [], keyP = '', keyS = '';
  function prod() { var p = PR[S.sub][S.rx]; if (S.rx === 'hbo' && !SUB[S.sub].t) p = PR[S.sub].hbo; return p || null; }
  function cisify(geo) { // gira 180° el fragmento unido al C3 del alqueno CC=CC (convierte trans en cis)
    var a = geo.a, b = geo.b, n = a.length, i, db = null; b.forEach(function (x) { if (x[2] === 2) db = x; }); if (!db) return geo;
    var adj = a.map(function () { return []; }); b.forEach(function (x) { adj[x[0]].push(x[1]); adj[x[1]].push(x[0]); });
    var seen = {}; seen[db[0]] = 1; var st = [db[1]], fr = []; seen[db[1]] = 1; while (st.length) { var u = st.pop(); fr.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; st.push(v); } }); }
    var p0 = new T.Vector3(a[db[0]][1], a[db[0]][2], a[db[0]][3]), p1 = new T.Vector3(a[db[1]][1], a[db[1]][2], a[db[1]][3]), ax = p1.clone().sub(p0).normalize();
    fr.forEach(function (k) { if (k === db[1]) return; var v = new T.Vector3(a[k][1], a[k][2], a[k][3]).sub(p1); v.applyAxisAngle(ax, Math.PI); a[k][1] = p1.x + v.x; a[k][2] = p1.y + v.y; a[k][3] = p1.z + v.z; });
    return geo;
  }
  function stages() {
    return [
      ['Estructura sp', 'Estructura', 'Los carbonos del triple enlace son sp: geometría lineal de 180°',
        '<p>En un <b>alquino</b> los dos carbonos del triple enlace tienen hibridación <b>sp</b>. El enlace C≡C (1,20 Å) es más corto que el C=C (1,34 Å) y los cuatro átomos H–C≡C–C están en <b>línea recta (180°)</b>. Un σ y dos π (perpendiculares entre sí) forman el triple enlace. Cambia entre propino, 1-butino y 2-butino.</p>'],
      ['Acidez y acetiluros', 'Acidez', 'El H terminal es ácido (pKa ≈ 25) porque el carbanión sp tiene 50 % de carácter s',
        '<p>El H de un <b>alquino terminal</b> es ácido (pKa ≈ 25), mucho más que el de un alqueno (44) o un alcano (50), porque el par del carbanión está en un orbital <b>sp (50 % s)</b>, más cercano al núcleo. Una base fuerte como <b>NaNH₂</b> lo desprotona y forma un <b>acetiluro</b>, nucleófilo útil para alargar cadenas. El 2-butino no tiene H terminal y no reacciona.</p>'],
      ['Hidrogenación selectiva', 'Hidrogenación', 'Lindlar → cis · Na/NH₃ → trans · H₂/Pd → alcano',
        '<p>Con <b>H₂/Pd-C</b> el alquino llega hasta el alcano. El catalizador de <b>Lindlar</b> (Pd envenenado) se detiene en el <b>alqueno cis</b>, por adición sin de los dos H. La reducción con <b>Na en NH₃ líquido</b> da el <b>alqueno trans</b> mediante un anión radical. Observa la geometría del producto.</p>'],
      ['Hidratación y tautomería', 'Hidratación', 'Enol → cetona (o aldehído con hidroboración)',
        '<p>La <b>hidratación</b> catalizada por Hg²⁺ sigue la regla de <b>Markovnikov</b> y da un <b>enol</b> inestable que se <b>tautomeriza</b> a <b>cetona</b>. La <b>hidroboración–oxidación</b> es anti-Markovnikov: un alquino terminal produce un <b>aldehído</b>. Un alquino interno simétrico da una única cetona.</p>'],
      ['Adición de HBr', 'Adición de HX', 'Regioquímica de Markovnikov',
        '<p>El <b>HBr</b> se adiciona al triple enlace: el H va al carbono con más H y el Br al más sustituido, vía <b>catión vinílico</b>. Con un equivalente se obtiene el <b>bromoalqueno</b>; con exceso, el <b>dibromuro geminal</b>. Compara el producto de un alquino terminal e interno.</p>']
    ];
  }
  function place(grp, x) { grp.position.set(x, 0, 0); grp.rotation.z = Math.PI / 2; }
  var def = {
    key: 'alquinos', title: 'Alquinos: estructura y reacciones', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [10, 4, 17], target: [10, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [10, 0, 20], target: [10, 0, 0] }],
    layers: [{ id: 'prod', label: 'Producto', icon: '→' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gS = new T.Group(); gP = new T.Group(); g.add(gS); g.add(gP);
      arrow = new T.Group(); var sh = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 4, 10), new T.MeshStandardMaterial({ color: 0xadb5bd })); sh.rotation.z = Math.PI / 2; arrow.add(sh); var hd = new T.Mesh(new T.ConeGeometry(0.4, 0.9, 12), new T.MeshStandardMaterial({ color: 0xadb5bd })); hd.rotation.z = -Math.PI / 2; hd.position.x = 2.2; arrow.add(hd); g.add(arrow);
      for (var i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i;
      if (!P.manual) { if (i === 0) { S.sub = ['prop', 'but1', 'but2'][Math.min(2, Math.floor(f.local * 3))]; S.rx = 'none'; } if (i === 1) { S.sub = f.local < 0.7 ? 'but1' : 'but2'; S.rx = 'nanh2'; } if (i === 2) { S.sub = 'but2'; S.rx = ['lindlar', 'nanh3', 'h2pd'][Math.min(2, Math.floor(f.local * 3))]; } if (i === 3) { S.sub = 'but1'; S.rx = f.local < 0.5 ? 'h2o' : 'hbo'; } if (i === 4) { S.sub = f.local < 0.5 ? 'but1' : 'but2'; S.rx = 'hx'; } }
      var sd = SUB[S.sub], pr = S.rx === 'none' ? null : prod(), kS = S.sub, kP = pr ? S.sub + S.rx : '';
      if (keyS !== kS) { keyS = kS; while (gS.children.length) gS.remove(gS.children[0]); gS.add(ctx.mol(MSim.build(sd.s), { gs: 1.7, ar: 0.8 })); }
      if (keyP !== kP) { keyP = kP; while (gP.children.length) gP.remove(gP.children[0]); if (pr) { var geo = MSim.build(pr[0]); if (S.rx === 'lindlar' && S.sub === 'but2') geo = cisify(geo); gP.add(ctx.mol(geo, { gs: 1.7, ar: 0.8 })); } }
      var showP = !!pr && ctx.layer('prod'); gP.visible = showP; arrow.visible = !!pr; place(gS, 11); place(gP, 23); arrow.position.set(17, 0, 0);
      lab[0].pos(11, 4.2, 0).set(sd.n, 'bl-lead').vis(true);
      lab[1].pos(11, -4, 0).set(i === 0 && !P.manual || S.rx === 'none' ? 'C≡C 1,20 Å · ángulo 180° (sp)' : 'pKa del H≡C–H ≈ 25', 'bl-d').vis(true);
      lab[2].pos(23, 4.2, 0).set(pr ? pr[1] : '', 'bl-pos').vis(showP);
      lab[3].pos(17, 1.4, 0).set(pr ? RX[S.rx].r : '', 'bl-d').vis(!!pr);
      lab[4].pos(23, -4, 0).set(pr && S.rx === 'lindlar' && S.sub === 'but2' ? 'cis (Z)' : (pr && S.rx === 'nanh3' && S.sub === 'but2' ? 'trans (E)' : ''), 'bl-d').vis(showP);
      if (S.rx !== 'none' && !pr) { lab[2].set('No reacciona: no tiene H terminal', 'bl-neg').vis(true).pos(23, 0, 0); }
    },
    sync: function (ctx) { var u = ctx.ui; if (u.sub) u.sub.set(S.sub); if (u.rx) u.rx.set(S.rx); },
    hud: function () { var pr = S.rx === 'none' ? null : prod(); return { eq: { chip: 'C≡C', name: 'Reacción', body: '<div class="eqline"><small>Sustrato</small>' + SUB[S.sub].n + '</div><div class="eqline"><small>Reactivo</small>' + RX[S.rx].n + '</div><div class="eqline"><small>Producto</small>' + (pr ? pr[1] : (S.rx === 'none' ? '—' : 'no reacciona')) + '</div>' }, legend: [{ label: 'Gris', color: '#56606b', text: 'C' }, { label: 'Blanco', color: '#f2f2f2', text: 'H' }, { label: 'Marrón', color: '#a0522d', text: 'Br' }] }; },
    measures: function () { var pr = S.rx === 'none' ? null : prod(); return [['Sustrato', SUB[S.sub].n], ['Terminal', SUB[S.sub].t ? 'sí' : 'no'], ['Reacción', RX[S.rx].n], ['Producto', pr ? pr[1] : '—']]; },
    ideas: ['Alquino: C sp, 180°.', 'Terminal: pKa ≈ 25.', 'Lindlar cis · Na/NH₃ trans.', 'Hidratación: enol → cetona.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Sustrato y reactivo'); el.appendChild(c);
      ui.sub = kit.ui.options({ label: 'Alquino', cols: 3, value: S.sub, options: Object.keys(SUB).map(function (k) { return { v: k, label: SUB[k].n }; }), onChange: function (v) { ctx.goManual(); S.sub = v; } });
      ui.rx = kit.ui.options({ label: 'Reacción', cols: 2, value: S.rx, options: Object.keys(RX).map(function (k) { return { v: k, label: RX[k].n }; }), onChange: function (v) { ctx.goManual(); S.rx = v; } });
      c.appendChild(ui.sub); c.appendChild(ui.rx); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Acidez relativa (pKa)', h: 200, note: 'Menor pKa = más ácido. El H del alquino terminal es mucho más ácido que el de alcanos y alquenos.', draw: function (cx, w, h, col) {
      var d = [['H₂O', 15.7], ['R–C≡C–H', 25], ['NH₃', 38], ['alqueno', 44], ['alcano', 50]], L = 10, B = 26, Tp = 12, ph = h - Tp - B, bw = (w - 2 * L) / d.length; cx.font = '10px system-ui'; cx.textAlign = 'center';
      d.forEach(function (x, j) { var hh = ph * x[1] / 50; cx.fillStyle = x[0] === 'R–C≡C–H' ? '#ff922b' : '#74c0fc'; cx.fillRect(L + j * bw + 5, Tp + ph - hh, bw - 10, hh); cx.fillStyle = col.muted; cx.fillText(x[0], L + j * bw + bw / 2, h - 12); cx.fillText(String(x[1]).replace('.', ','), L + j * bw + bw / 2, Tp + ph - hh - 3); });
    } }],
    calc: function () { var pr = S.rx === 'none' ? null : prod(), row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + SUB[S.sub].n + ' + ' + RX[S.rx].n + '</div><table class="calc-table">' + row('Producto', pr ? '<b>' + pr[1] + '</b>' : (S.rx === 'none' ? 'elige una reacción' : 'no reacciona')) + row('Nota', RX[S.rx].note || 'Observa la geometría lineal del triple enlace.') + row('Grado de insaturación', '2 (triple enlace) → ' + (pr ? (/=O|=C/.test(pr[0]) ? '1' : (pr[0].indexOf('#') >= 0 ? '2' : '0')) : '2')) + '</table>'; },
    quiz: [
      { q: 'La geometría alrededor de un carbono de triple enlace es…', options: ['lineal, 180°', 'trigonal plana, 120°', 'tetraédrica, 109,5°', 'angular'], answer: 0, why: 'Hibridación sp.' },
      { q: 'El alquino terminal es ácido porque el carbanión…', options: ['tiene 50 % de carácter s', 'es sp³', 'es aromático', 'tiene carga positiva'], answer: 0, why: 'El par está más cerca del núcleo.' },
      { q: 'La hidrogenación de 2-butino con Lindlar produce…', options: ['(Z)-2-buteno', '(E)-2-buteno', 'butano', 'butanona'], answer: 0, why: 'Adición sin en catalizador envenenado.' },
      { q: 'La hidratación de 1-butino con HgSO₄/H₂SO₄ da…', options: ['butanona', 'butanal', 'butano', '1-butanol'], answer: 0, why: 'Markovnikov: enol → cetona.' },
      { q: 'Na/NH₃(l) con un alquino interno da…', options: ['alqueno trans', 'alqueno cis', 'alcano', 'cetona'], answer: 0, why: 'Anión radical más estable trans.' },
      { q: '¿Cuál NO reacciona con NaNH₂ como ácido?', options: ['2-butino', '1-butino', 'propino', 'acetileno'], answer: 0, why: 'No tiene H terminal.' }
    ],
    help: { intro: 'Elige un alquino y una reacción: a la izquierda ves el sustrato y a la derecha el producto con su geometría. En «Gráficos» compara las acideces.', items: [['Escena', 'izquierda = sustrato; derecha = producto con su geometría. Gris = C, blanco = H, marrón = Br.'], ['Controles', '«Alquino» y «Reacción»: hidrogenación (Lindlar o Na/NH₃), hidratación o adición de HBr.'], ['Gráfico', '«Acidez relativa (pKa)»: un alquino terminal (pKa ≈ 25) es mucho más ácido que un alqueno o un alcano.']], try: ['Observa el C sp del alquino: geometría lineal, 180°.', 'Hidrogena el 2-butino con Lindlar y luego con Na/NH₃: obtienes el alqueno cis y el trans.', 'Hidrata un alquino: el enol formado pasa a cetona (tautomería).'] }
  };
  MSim.create(def);
})();
