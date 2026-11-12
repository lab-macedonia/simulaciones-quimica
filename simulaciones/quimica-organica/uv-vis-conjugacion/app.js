/* Espectroscopía UV-Vis y conjugación — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
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
  var T = THREE, HC = 1239.84;
  var LAM = [165, 217, 258, 290, 334, 364, 390, 410, 425, 440, 452], NAME = ['Eteno', '1,3-Butadieno', '1,3,5-Hexatrieno', '1,3,5,7-Octatetraeno', 'Decapentaeno', 'Dodecahexaeno', 'Tetradecaheptaeno', 'Hexadecaoctaeno', 'Octadecanonaeno', 'Eicosadecaeno', 'β-Caroteno (11 C=C)'];
  var S = { n: 2, alk: 0, c: 0.00002, l: 1 }, g = null, gm = null, lev = [], ph = null, lab = [], beaker = null, liq = null, key = 0;
  function lam() { return LAM[S.n - 1] + 5 * S.alk; }
  function eps() { return 8000 + 14000 * (S.n - 1) / 1.0 * 0.8 + 4000; }
  function gap() { return HC / lam(); }
  function absorb(x) { var w = 14 + 3 * S.n, L = lam(); return Math.exp(-Math.pow((x - L) / w, 2) / 2); }
  function A() { return eps() * S.c * S.l; }
  function compl() { var L = lam(); if (L < 400) return null; var tab = [[400, 435, '#ffe066'], [435, 480, '#ffa94d'], [480, 500, '#ff6b6b'], [500, 560, '#f06595'], [560, 580, '#7950f2'], [580, 595, '#4dabf7'], [595, 650, '#38d9a9'], [650, 800, '#74c0fc']], i; for (i = 0; i < tab.length; i++) if (L >= tab[i][0] && L < tab[i][1]) return tab[i][2]; return '#ffe066'; }
  function smiles() { var k = Math.min(S.n, 4), s = 'C'; for (var i = 0; i < k; i++) s += (i ? '=C' : '=C') + (i < k - 1 ? 'C' : ''); return k === 1 ? 'C=C' : 'C=CC=C' + (k > 2 ? 'C=C' : '') + (k > 3 ? 'C=C' : ''); }
  function stages() {
    return [
      ['Transición π → π*', 'Transición', 'Un fotón promueve un electrón del HOMO (π) al LUMO (π*)',
        '<p>La espectroscopía <b>UV-Vis</b> mide la absorción de luz que promueve electrones desde un orbital ocupado a uno vacío. En un alqueno, la transición es <b>π → π*</b>: el electrón pasa del <b>HOMO</b> al <b>LUMO</b>. La energía del fotón debe igualar el gap: <b>E = hc/λ</b>. El eteno absorbe a ~165 nm (UV lejano).</p>'],
      ['Conjugación y gap', 'Conjugación', 'A más dobles enlaces conjugados, menor gap y mayor λmax',
        '<p>Al <b>conjugar</b> dobles enlaces, los orbitales π se deslocalizan y se acercan: el <b>gap HOMO–LUMO disminuye</b> y la absorción se desplaza a <b>mayor longitud de onda</b> (efecto <b>batocrómico</b>). Aumenta el número de dobles enlaces y observa cómo λmax sube desde 165 nm hasta la región visible.</p>'],
      ['Espectro y color', 'Espectro y color', 'La disolución se ve del color complementario al absorbido',
        '<p>Cuando λmax entra en el <b>visible</b> (400–700 nm) la sustancia se ve <b>coloreada</b>, con el <b>color complementario</b> del que absorbe: el <b>β-caroteno</b> absorbe azul (~450 nm) y se ve naranja. Por debajo de 400 nm la sustancia es incolora aunque absorba UV.</p>'],
      ['Sustituyentes', 'Sustituyentes', 'Cada grupo alquilo en el cromóforo aporta ~+5 nm (reglas de Woodward)',
        '<p>Los <b>sustituyentes alquilo</b> unidos a los carbonos sp² desplazan λmax unos <b>+5 nm</b> cada uno, según las <b>reglas de Woodward–Fieser</b>. Añade sustituyentes y compara. Los grupos con pares libres (auxocromos como –OR, –NR₂) producen desplazamientos aún mayores.</p>'],
      ['Ley de Beer–Lambert', 'Beer–Lambert', 'A = ε · c · l',
        '<p>La <b>absorbancia</b> sigue la <b>ley de Beer–Lambert</b>: <b>A = ε·c·l</b>, con ε el coeficiente de absorción molar (aumenta con la conjugación), c la concentración y l el paso óptico. Una A entre 0,1 y 1 es la zona útil para medir.</p>']
    ];
  }
  var def = {
    key: 'uv-vis-conjugacion', title: 'Espectroscopía UV-Vis y conjugación', subtitle: 'Simulador 3D · química orgánica', accent: { dark: '#b197fc', light: '#5f3dc4' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [14, 4, 22], target: [14, 1, 0] }, { id: 'frontal', label: 'Frontal', pos: [14, 1, 26], target: [14, 1, 0] }],
    layers: [{ id: 'sol', label: 'Disolución', icon: '▭' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); gm = new T.Group(); gm.position.set(15, 9.5, 0); g.add(gm);
      var i; for (i = 0; i < 2; i++) { var b = new T.Mesh(new T.BoxGeometry(5, 0.25, 1.6), new T.MeshStandardMaterial({ color: i ? 0x4dabf7 : 0xff6b6b })); g.add(b); lev.push(b); }
      ph = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 1, 8), new T.MeshStandardMaterial({ color: 0xb197fc, emissive: 0x6741d9 })); g.add(ph);
      beaker = new T.Mesh(new T.CylinderGeometry(2, 2, 5, 24, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); beaker.position.set(29, 2.5, 0); g.add(beaker);
      liq = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 3.6, 24), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); liq.position.set(29, 1.9, 0); g.add(liq);
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f) {
      var P = ctx.P, i = f.i; if (!P.manual) { if (i === 0) { S.n = 1; S.alk = 0; } if (i === 1) { S.n = 1 + Math.round(10 * f.local); S.alk = 0; } if (i === 2) { S.n = 11; S.alk = 0; S.c = 0.00002; } if (i === 3) { S.n = 2; S.alk = Math.round(4 * f.local); } if (i === 4) { S.n = 5; S.alk = 0; S.c = 0.000005 + 0.00004 * f.local; } }
      var k = Math.min(S.n, 3) * 10 + S.alk * 0; if (key !== Math.min(S.n, 4)) { key = Math.min(S.n, 4); while (gm.children.length) gm.remove(gm.children[0]); gm.add(ctx.mol(MSim.build(smiles()), { gs: 1.1, ar: 0.55 })); gm.rotation.z = 0; }
      gm.rotation.y += 0.004; var L = lam(), gp = gap(), y0 = 0, hy = 1.5 - gp * 0.55 * 0 + 0, gH = Math.max(0.6, Math.min(5, gp * 0.9));
      lev[0].position.set(15, 1.5, 0); lev[1].position.set(15, 1.5 + gH, 0); lev[1].scale.x = lev[0].scale.x = 1;
      ph.position.set(17.5, 1.5 + gH / 2, 0); ph.scale.y = gH; var vis = L >= 400 && L <= 700; ph.material.color.set(vis ? new T.Color().setHSL(Math.max(0, Math.min(0.75, (700 - L) / 300 * 0.75)), 1, 0.55) : new T.Color(0x9775fa)); ph.material.emissive.copy(ph.material.color).multiplyScalar(0.4);
      var cc = compl(); liq.visible = ctx.layer('sol'); beaker.visible = ctx.layer('sol'); liq.material.color.set(cc || '#f8f9fa'); liq.material.opacity = cc ? Math.min(0.9, 0.15 + A() * 0.8) : 0.25;
      lab[0].pos(15, 12.6, 0).set(NAME[S.n - 1] + (S.alk ? ' + ' + S.alk + ' alquilo(s)' : ''), 'bl-lead').vis(true);
      lab[1].pos(11.2, 1.5, 0).set('HOMO (π)', 'bl-d').vis(true); lab[2].pos(11.2, 1.5 + gH, 0).set('LUMO (π*)', 'bl-d').vis(true);
      lab[3].pos(21, 1.5 + gH / 2, 0).set('ΔE = ' + fmt(gp, 2) + ' eV · λmax = ' + fmt(L, 0) + ' nm', 'bl-pos').vis(true);
      lab[4].pos(29, 6, 0).set(cc ? 'se ve ' + (cc ? 'coloreada' : '') : 'incolora (UV)', 'bl-d').vis(ctx.layer('sol'));
    },
    sync: function (ctx) { var u = ctx.ui; ['n', 'alk', 'c', 'l'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { return { eq: { chip: 'λ', name: 'Absorción', body: '<div class="eqline"><small>λmax</small>' + fmt(lam(), 0) + ' nm</div><div class="eqline"><small>ΔE (HOMO–LUMO)</small>' + fmt(gap(), 2) + ' eV</div><div class="eqline"><small>ε aprox.</small>' + fmt(eps(), 0) + ' L/mol·cm</div><div class="eqline"><small>Absorbancia</small>' + fmt(A(), 3) + '</div>' }, legend: [{ label: 'Barra roja', color: '#ff6b6b', text: 'HOMO' }, { label: 'Barra azul', color: '#4dabf7', text: 'LUMO' }, { label: 'Flecha', color: '#b197fc', text: 'fotón absorbido' }] }; },
    measures: function () { return [['Compuesto', NAME[S.n - 1]], ['Dobles enlaces conjugados', String(S.n)], ['λmax', fmt(lam(), 0) + ' nm'], ['ΔE', fmt(gap(), 2) + ' eV'], ['Región', lam() < 400 ? 'ultravioleta' : 'visible'], ['A (Beer–Lambert)', fmt(A(), 3)]]; },
    ideas: ['Más conjugación → menor gap → mayor λmax.', 'E = hc/λ.', 'Cada alquilo ≈ +5 nm.', 'A = ε·c·l.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Cromóforo y muestra'); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      c.appendChild(kit.ui.sliders([sl('n', 'Dobles enlaces conjugados', 1, 11, 1, function (v) { return String(v); }), sl('alk', 'Sustituyentes alquilo', 0, 4, 1, function (v) { return String(v); }), sl('c', 'Concentración', 0.000001, 0.0001, 0.000001, function (v) { return fmt(v * 1e6, 0) + ' µM'; }), sl('l', 'Paso óptico', 0.1, 2, 0.1, function (v) { return fmt(v, 1) + ' cm'; })])); c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: 'Espectro de absorción', h: 210, note: 'Absorbancia relativa frente a λ (nm). La banda se desplaza con la conjugación.', draw: function (cx, w, h, col) {
      var L = 30, R = 10, Tp = 12, B = 26, pw = w - L - R, ph2 = h - Tp - B, i, x0 = 150, x1 = 600; cx.beginPath(); cx.strokeStyle = '#b197fc'; cx.lineWidth = 2;
      for (i = 0; i <= 150; i++) { var xx = x0 + (x1 - x0) * i / 150, a = absorb(xx), px = L + pw * i / 150, py = Tp + ph2 * (1 - a); i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.stroke(); cx.lineWidth = 1;
      var vx0 = L + pw * (400 - x0) / (x1 - x0); cx.fillStyle = 'rgba(255,200,100,.18)'; cx.fillRect(vx0, Tp, L + pw - vx0, ph2); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('150', L, h - 8); cx.fillText('400 (visible →)', vx0 + 20, h - 8); cx.fillText('600 nm', L + pw, h - 8);
    } }, { title: 'λmax según conjugación', h: 190, note: 'Valores experimentales aproximados (7–10 interpolados).', draw: function (cx, w, h, col) {
      var L = 34, R = 10, Tp = 12, B = 24, pw = w - L - R, ph2 = h - Tp - B, i; cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); LAM.forEach(function (v, k) { var x = L + pw * k / 10, y = Tp + ph2 * (1 - (v - 150) / 330); k ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.n - 1) / 10, Tp + ph2 * (1 - (lam() - 150) / 330), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText('n = 1', L, h - 8); cx.fillText('n = 11', L + pw, h - 8); cx.textAlign = 'right'; cx.fillText('nm', L - 4, Tp + 8);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return '<div class="card-kicker">' + NAME[S.n - 1] + '</div><table class="calc-table">' + row('λmax', fmt(LAM[S.n - 1], 0) + ' + 5 × ' + S.alk + ' = <b>' + fmt(lam(), 0) + ' nm</b>') + row('ΔE = hc/λ', '1239,84 / ' + fmt(lam(), 0) + ' = <b>' + fmt(gap(), 2) + ' eV</b>') + row('A = ε·c·l', fmt(eps(), 0) + ' × ' + fmt(S.c * 1e6, 0) + '×10⁻⁶ × ' + fmt(S.l, 1) + ' = <b>' + fmt(A(), 3) + '</b>') + row('Transmitancia', fmt(Math.pow(10, -A()) * 100, 1) + ' %') + row('Color de la disolución', compl() ? 'coloreada' : 'incolora (absorbe en el UV)') + '</table>'; },
    quiz: [
      { q: 'Al aumentar la conjugación, λmax…', options: ['aumenta', 'disminuye', 'no cambia', 'se anula'], answer: 0, why: 'El gap HOMO–LUMO se reduce.' },
      { q: 'La transición característica de los alquenos en UV es…', options: ['π → π*', 'n → σ*', 'σ → σ*', 'd → d'], answer: 0, why: 'Del HOMO π al LUMO π*.' },
      { q: 'Una sustancia que absorbe luz azul (~450 nm) se ve…', options: ['anaranjada', 'azul', 'incolora', 'verde'], answer: 0, why: 'Color complementario.' },
      { q: 'Cada sustituyente alquilo desplaza λmax unos…', options: ['+5 nm', '+50 nm', '−5 nm', '+0,5 nm'], answer: 0, why: 'Regla de Woodward–Fieser.' },
      { q: 'Si se duplica la concentración, la absorbancia…', options: ['se duplica', 'se reduce a la mitad', 'no cambia', 'se cuadruplica'], answer: 0, why: 'A es proporcional a c.' },
      { q: 'La energía del fotón se relaciona con λ por…', options: ['E = hc/λ', 'E = hλ', 'E = c/λ²', 'E = λ/hc'], answer: 0, why: 'Cuanto menor λ, mayor E.' }
    ],
    help: { intro: 'Aumenta los dobles enlaces conjugados y observa cómo disminuye el gap entre HOMO y LUMO y cómo cambia el color de la disolución. «Gráficos» muestra el espectro.', items: [['Diagrama', 'barra roja = HOMO, barra azul = LUMO; la flecha es el fotón absorbido (π → π*).'], ['Vaso', 'la disolución toma el color complementario de la luz absorbida.'], ['Controles', 'número de dobles enlaces conjugados y sustituyentes.'], ['Gráficos', '«Espectro de absorción» y «λmax según conjugación».']], try: ['Pasa del eteno a varios dobles enlaces conjugados: el gap baja y λmax sube.', 'Sigue aumentando la conjugación hasta que la disolución se vea coloreada.', 'Agrega un sustituyente alquilo: λmax sube ≈ 5 nm.'] }
  };
  MSim.create(def);
})();
