/* Lentes y el ojo humano — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var EYE = { normal: { n: 'Ojo normal (emétrope)', L: 2.4 }, miope: { n: 'Miopía (ojo largo)', L: 2.6 }, hiper: { n: 'Hipermetropía (ojo corto)', L: 2.2 } };
  var S = { mode: 'lente', f: 10, dO: 30, h: 4, eye: 'normal', far: true, dNear: 25, Pc: 0, glasses: false };
  var G = {}, lab = {}, rays = [], K = 0.095, EK = 2.4;   // K: unidades por cm en la lente; EK: unidades por cm en el ojo
  function img() { var di = 1 / (1 / S.f - 1 / S.dO); return { di: di, m: -di / S.dO, real: di > 0 }; }
  function eyeCalc() {
    var e = EYE[S.eye], P0 = 100 / 2.4, dO = S.far ? Infinity : S.dNear, need = 100 / e.L + (isFinite(dO) ? 100 / dO : 0) - (S.glasses ? S.Pc : 0);
    var acc = clamp(need - P0, 0, 4), P = P0 + acc + (S.glasses ? S.Pc : 0), di = 100 / (P - (isFinite(dO) ? 100 / dO : 0));
    return { L: e.L, acc: acc, P: P, di: di, ok: Math.abs(di - e.L) < 0.03, pre: di < e.L - 0.03 };
  }
  function stages() {
    return [
      ['Lente convergente', 'Lente', 'Los rayos paralelos al eje se desvían y pasan por el foco',
        '<p>Una <b>lente convergente</b> (más gruesa al centro) desvía la luz por <b>refracción</b>: los rayos que llegan <b>paralelos al eje</b> se juntan en el <b>foco</b> F′. La distancia de la lente al foco es la <b>distancia focal</b> f. Los rayos que pasan por el <b>centro óptico</b> no se desvían.</p>'],
      ['Imagen real e invertida', 'Imagen real', 'Objeto lejos de la lente: imagen real, invertida y más pequeña',
        '<p>Con el objeto a una distancia mayor que <b>2f</b>, los rayos que salen de su punta se cruzan al otro lado de la lente y forman una <b>imagen real</b> (se puede proyectar en una pantalla), <b>invertida</b> y <b>más pequeña</b>. Así funcionan las cámaras y nuestro ojo. Se cumple <b>1/f = 1/d<sub>o</sub> + 1/d<sub>i</sub></b> y el aumento es m = −d<sub>i</sub>/d<sub>o</sub>.</p>'],
      ['La lupa', 'Lupa', 'Objeto dentro de la distancia focal: imagen virtual, derecha y aumentada',
        '<p>Si el objeto está <b>más cerca que el foco</b>, los rayos salen divergentes y no se cruzan. Nuestro ojo los prolonga hacia atrás y ve una <b>imagen virtual</b>, <b>derecha</b> y <b>más grande</b>, del mismo lado que el objeto (líneas punteadas). Es el principio de la <b>lupa</b>.</p>'],
      ['El ojo y la acomodación', 'Ojo', 'Córnea y cristalino forman una imagen real e invertida sobre la retina',
        '<p>En el ojo, la <b>córnea</b> y el <b>cristalino</b> actúan como una lente convergente y forman en la <b>retina</b> una imagen real e invertida; el cerebro la interpreta derecha. Para ver de cerca, los músculos ciliares abomban el cristalino y <b>aumenta su potencia</b>: es la <b>acomodación</b>. La potencia se mide en <b>dioptrías</b> (D = 1/f en metros).</p>'],
      ['Miopía', 'Miopía', 'El ojo es largo: la imagen de lo lejano se forma delante de la retina',
        '<p>En la <b>miopía</b> el ojo es más largo de lo normal (o el cristalino demasiado potente): los objetos lejanos se enfocan <b>delante de la retina</b> y se ven borrosos, aunque de cerca se ve bien. Se corrige con una <b>lente divergente</b> (potencia negativa), que separa un poco los rayos antes de entrar al ojo.</p>'],
      ['Hipermetropía', 'Hipermetropía', 'El ojo es corto: la imagen de lo cercano queda detrás de la retina',
        '<p>En la <b>hipermetropía</b> el ojo es más corto: el foco queda <b>detrás de la retina</b>. Acomodando se puede ver de lejos, pero los objetos cercanos se ven borrosos y la vista se cansa. Se corrige con una <b>lente convergente</b> (potencia positiva). Con la edad el cristalino pierde flexibilidad (<b>presbicia</b>) y también se necesitan lentes convergentes para leer.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.glasses = false; S.Pc = 0;
    if (i === 0) { S.mode = 'lente'; S.f = 10; S.dO = 200; S.h = 3; }
    else if (i === 1) { S.mode = 'lente'; S.f = 10; S.h = 4; S.dO = 45 - 20 * l; }
    else if (i === 2) { S.mode = 'lente'; S.f = 10; S.h = 2.5; S.dO = 8 - 3 * l; }
    else if (i === 3) { S.mode = 'ojo'; S.eye = 'normal'; S.far = l < 0.5; S.dNear = 25; }
    else if (i === 4) { S.mode = 'ojo'; S.eye = 'miope'; S.far = true; S.glasses = l > 0.5; S.Pc = -3.2; }
    else { S.mode = 'ojo'; S.eye = 'hiper'; S.far = false; S.dNear = 25; S.glasses = l > 0.5; S.Pc = 3.8; }
  }
  function line(c, dashed) { var m = dashed ? new T.LineDashedMaterial({ color: c, dashSize: 0.25, gapSize: 0.18 }) : new T.LineBasicMaterial({ color: c }); var l = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), m); G.root.add(l); return l; }
  function setLine(l, pts) { l.geometry.setFromPoints(pts); if (l.material.isLineDashedMaterial) l.computeLineDistances(); l.visible = true; }
  function arrowObj(c) { var g = new T.Group(), s = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 8), new T.MeshStandardMaterial({ color: c, transparent: true })), h = new T.Mesh(new T.ConeGeometry(0.2, 0.4, 12), new T.MeshStandardMaterial({ color: c, transparent: true })); s.position.y = 0.5; h.position.y = 1.15; g.add(s); g.add(h); g.userData = { s: s, h: h }; G.root.add(g); return g; }
  function setArrow(a, x, H, op) { var sg = H < 0 ? -1 : 1, L = Math.max(0.05, Math.abs(H) - 0.35); a.position.set(x, 0, 0); a.userData.s.scale.y = L; a.userData.s.position.y = sg * L / 2; a.userData.h.position.y = sg * (L + 0.18); a.userData.h.rotation.z = sg < 0 ? Math.PI : 0; a.userData.s.material.opacity = a.userData.h.material.opacity = op; a.visible = true; }
  var V = function (x, y) { return new T.Vector3(x, y, 0); };
  var def = {
    key: 'optica-ojo', title: 'Lentes y el ojo humano', subtitle: 'Simulador 3D · física', accent: { dark: '#4dabf7', light: '#1864ab' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-0.6, 2, 15], target: [-0.6, 0.8, 0] }, { id: 'sup', label: 'Oblicua', pos: [-0.6, 7, 12], target: [-0.6, 0, 0] }],
    layers: [{ id: 'rays', label: 'Rayos', icon: '╱' }],
    build: function (ctx) {
      var s = ctx.scene; G.root = new T.Group(); s.add(G.root);
      G.axis = new T.Mesh(new T.BoxGeometry(22, 0.02, 0.02), new T.MeshBasicMaterial({ color: 0x868e96 })); G.root.add(G.axis);
      G.lens = new T.Mesh(new T.SphereGeometry(1, 32, 24), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.45, roughness: 0.1 })); G.lens.scale.set(0.18, 2.4, 2.4); G.root.add(G.lens);
      G.F1 = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), new T.MeshBasicMaterial({ color: 0xff922b })); G.F2 = G.F1.clone(); G.root.add(G.F1); G.root.add(G.F2);
      G.obj = arrowObj(0x51cf66); G.img = arrowObj(0xff6b6b);
      G.eye = new T.Mesh(new T.SphereGeometry(1, 40, 30), new T.MeshStandardMaterial({ color: 0xf8f9fa, transparent: true, opacity: 0.22, side: T.DoubleSide })); G.root.add(G.eye);
      G.retina = new T.Mesh(new T.SphereGeometry(1, 32, 24, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.9, 1.8), new T.MeshStandardMaterial({ color: 0xff8787, side: T.DoubleSide })); G.root.add(G.retina);
      G.cris = new T.Mesh(new T.SphereGeometry(1, 24, 18), new T.MeshStandardMaterial({ color: 0xffe066, transparent: true, opacity: 0.6 })); G.root.add(G.cris);
      G.gl = new T.Mesh(new T.SphereGeometry(1, 24, 18), new T.MeshStandardMaterial({ color: 0x99e9f2, transparent: true, opacity: 0.45 })); G.gl.scale.set(0.12, 1.9, 1.9); G.root.add(G.gl);
      G.dot = new T.Mesh(new T.SphereGeometry(0.17, 12, 8), new T.MeshBasicMaterial({ color: 0xffd43b })); G.root.add(G.dot);
      for (var i = 0; i < 9; i++) rays.push(line([0xffd43b, 0x74c0fc, 0xff8787, 0xffd43b, 0x74c0fc, 0xff8787, 0xffd43b, 0x74c0fc, 0xff8787][i], i >= 6));
      ['a', 'b', 'c', 'd', 'F1', 'F2'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var on = ctx.layer('rays'), lensM = S.mode === 'lente';
      rays.forEach(function (r) { r.visible = false; }); Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      G.lens.visible = G.F1.visible = G.F2.visible = G.obj.visible = G.img.visible = lensM; G.eye.visible = G.retina.visible = G.cris.visible = !lensM; G.gl.visible = !lensM && S.glasses; G.dot.visible = !lensM;
      if (lensM) {
        var fX = S.f * K, oX = -Math.min(S.dO, 75) * K, hO = S.h * 0.45, im = img(), iX = im.di * K, hI = hO * im.m, far = S.dO > 150;
        G.F1.position.set(-fX, 0, 0); G.F2.position.set(fX, 0, 0); lab.F1.pos(-fX, -0.45, 0).set('F', 'bl-d').vis(true); lab.F2.pos(fX, -0.45, 0).set('F′', 'bl-d').vis(true);
        if (far) { G.obj.visible = false; G.img.visible = false; if (on) for (var j = 0; j < 3; j++) { var y = (j - 1) * 1.1; setLine(rays[j], [V(-11, y), V(0, y), V(fX, 0), V(fX + (fX) * 1.5, -y * 1.5)]); } lab.a.pos(fX, 1.2, 0).set('Foco: f = ' + fmt(S.f, 0) + ' cm', 'bl-lead').vis(true); return; }
        setArrow(G.obj, oX, hO, 1); var vis = isFinite(im.di) && Math.abs(iX) < 14; if (vis) setArrow(G.img, iX, hI, im.real ? 1 : 0.45); else G.img.visible = false;
        if (on) {
          var end = 11, sl = -hO / fX; setLine(rays[0], [V(oX, hO), V(0, hO), V(end, hO + sl * end)]);
          setLine(rays[1], [V(oX, hO), V(end, hO + (-hO / oX) * (end))]);
          if (S.dO > S.f + 0.01) { var y3 = hO + (0 - oX) * ((0 - hO) / (-fX - oX)); setLine(rays[2], [V(oX, hO), V(0, y3), V(end, y3)]); }
          if (!im.real && vis) { setLine(rays[6], [V(0, hO), V(iX, hI)]); setLine(rays[7], [V(oX, hO), V(iX, hI)]); }
        }
        lab.a.pos(oX, hO + 0.7, 0).set('Objeto · d₀ = ' + fmt(S.dO, 1) + ' cm', 'bl-neg').vis(true);
        lab.b.pos(vis ? iX : 6, (vis ? hI : 0) + (hI < 0 ? -0.7 : 0.7), 0).set(!isFinite(im.di) ? 'Sin imagen (objeto en el foco)' : 'Imagen ' + (im.real ? 'real' : 'virtual') + ', ' + (im.m < 0 ? 'invertida' : 'derecha') + ' · dᵢ = ' + fmt(im.di, 1) + ' cm · m = ' + f2(im.m), im.real ? 'bl-warn' : 'bl-pos').vis(true);
      } else {
        var e = eyeCalc(), Lx = e.L * EK, R = Lx / 2, cx0 = 0;
        G.eye.scale.set(R, R * 0.92, R * 0.92); G.eye.position.set(R, 0, 0);
        G.retina.scale.set(R, R * 0.92, R * 0.92); G.retina.position.set(R, 0, 0); G.retina.rotation.set(0, Math.PI / 2, 0);
        G.cris.scale.set(0.35 + e.acc * 0.05, 1.2, 1.2); G.cris.position.set(0.7, 0, 0);
        var dX = e.di * EK; G.dot.position.set(Math.min(dX, 12), 0, 0); G.dot.material.color.setHex(e.ok ? 0x51cf66 : 0xff6b6b);
        G.gl.position.set(-2.2, 0, 0);
        if (on) for (var k = 0; k < 2; k++) {
          var y0 = k ? 1 : -1, start = S.far ? V(-11, y0) : V(-11, y0 * 0.1), gx = -2.2, yg = S.far ? y0 : y0 * 0.1 + (y0 - y0 * 0.1) * (11 - 2.2) / 11;
          var yc = S.glasses ? yg + (gx - (-0)) * 0 + (S.Pc < 0 ? 1 : -1) * Math.abs(S.Pc) * 0.03 * y0 * 2.2 : yg; if (!S.far) yc = y0 * 0.85 + (S.glasses ? 0.04 * S.Pc * -y0 : 0);
          var pts = [start, V(gx, S.far ? y0 : yg), V(0.3, yc), V(dX, 0)]; var slope = (0 - yc) / Math.max(0.1, dX - 0.3); pts.push(V(Lx + 0.4, yc + slope * (Lx + 0.1)));
          setLine(rays[k * 3], pts);
        }
        lab.a.pos(R, R + 0.6, 0).set(EYE[S.eye].n + ' · ' + (S.far ? 'objeto lejano' : 'objeto a ' + fmt(S.dNear, 0) + ' cm'), 'bl-lead').vis(true);
        lab.b.pos(R + 0.5, R * 0.55, 0).set(e.ok ? 'Imagen nítida sobre la retina' : (e.pre ? 'Imagen delante de la retina: borrosa' : 'Imagen detrás de la retina: borrosa'), e.ok ? 'bl-neg' : 'bl-warn').vis(true);
        lab.c.pos(-2.2, 2.4, 0).set(S.glasses ? 'Lente ' + (S.Pc < 0 ? 'divergente ' : 'convergente ') + (S.Pc > 0 ? '+' : '') + f1(S.Pc) + ' D' : '', 'bl-pos').vis(S.glasses);
        lab.d.pos(0.7, -1.9, 0).set('Acomodación +' + f1(e.acc) + ' D', 'bl-d').vis(e.acc > 0.05);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.dO && u.dO.set(Math.min(S.dO, 75)); u.f && u.f.set(S.f); u.eye && u.eye.set(S.eye); } },
    hud: function () { return { eq: { chip: 'f', name: S.mode === 'lente' ? 'Lente convergente' : 'Ojo humano', body: '<div class="eqline"><small>Lente delgada</small>1/f = 1/dₒ + 1/dᵢ</div><div class="eqline"><small>Aumento</small>m = −dᵢ / dₒ</div><div class="eqline"><small>Potencia</small>P = 1/f (dioptrías, f en m)</div>' }, legend: [{ label: 'Verde', color: '#51cf66', text: 'objeto' }, { label: 'Rojo', color: '#ff6b6b', text: 'imagen (transparente si es virtual)' }, { label: 'Punteado', color: '#ff8787', text: 'prolongación de rayos (imagen virtual)' }] }; },
    measures: function () {
      if (S.mode === 'lente') { var im = img(); return [['Distancia focal', fmt(S.f, 1) + ' cm (' + f1(100 / S.f) + ' D)'], ['Distancia al objeto', fmt(S.dO, 1) + ' cm'], ['Distancia a la imagen', isFinite(im.di) ? fmt(im.di, 1) + ' cm' : '∞'], ['Aumento', isFinite(im.m) ? f2(im.m) : '∞'], ['Tipo', im.real ? 'real e invertida' : 'virtual y derecha']]; }
      var e = eyeCalc(); return [['Ojo', EYE[S.eye].n], ['Largo del ojo', f1(e.L * 10) + ' mm'], ['Objeto', S.far ? 'lejano' : fmt(S.dNear, 0) + ' cm'], ['Potencia total', f1(e.P) + ' D'], ['Acomodación usada', f1(e.acc) + ' D (máx. 4 D)'], ['Imagen a', f1(e.di * 10) + ' mm de la córnea'], ['Lente correctora', S.glasses ? (S.Pc > 0 ? '+' : '') + f1(S.Pc) + ' D' : 'sin lentes']];
    },
    ideas: ['Lente convergente: rayos paralelos → foco.', '<b>1/f = 1/dₒ + 1/dᵢ</b>; m = −dᵢ/dₒ.', 'dₒ > f: imagen real e invertida; dₒ < f: virtual y aumentada (lupa).', 'El ojo forma una imagen real e invertida en la retina.', 'Miopía → lente divergente; hipermetropía → convergente.', 'Potencia en dioptrías: P = 1/f (m).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Lente'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Escena', cols: 2, value: S.mode, options: [{ v: 'lente', label: 'Lente convergente' }, { v: 'ojo', label: 'Ojo humano' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.dO = kit.ui.slider({ label: 'Distancia del objeto (cm)', min: 3, max: 75, step: 0.5, value: Math.min(S.dO, 75), onInput: function (v) { ctx.goManual(); S.mode = 'lente'; S.dO = v; } });
      ui.f = kit.ui.slider({ label: 'Distancia focal (cm)', min: 5, max: 20, step: 0.5, value: S.f, onInput: function (v) { ctx.goManual(); S.mode = 'lente'; S.f = v; } });
      c.appendChild(kit.ui.sliders([ui.dO, ui.f]));
      var c2 = kit.ui.card('Ojo'); el.appendChild(c2);
      ui.eye = kit.ui.options({ label: 'Tipo de ojo', cols: 3, value: S.eye, options: Object.keys(EYE).map(function (k) { return { v: k, label: EYE[k].n.split(' (')[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'ojo'; S.eye = v; } }); c2.appendChild(ui.eye);
      ui.far = kit.ui.seg([{ v: true, label: 'Objeto lejano' }, { v: false, label: 'Objeto a 25 cm' }], S.far, function (v) { ctx.goManual(); S.mode = 'ojo'; S.far = v; }); c2.appendChild(ui.far);
      ui.Pc = kit.ui.slider({ label: 'Lente correctora (D)', min: -6, max: 6, step: 0.25, value: S.Pc, digits: 2, onInput: function (v) { ctx.goManual(); S.mode = 'ojo'; S.Pc = v; S.glasses = Math.abs(v) > 0.01; } }); c2.appendChild(kit.ui.sliders([ui.Pc]));
      el.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Distancia de la imagen frente a distancia del objeto', h: 220, note: 'Para dₒ > f la imagen es real (dᵢ > 0); para dₒ < f es virtual (dᵢ < 0). En dₒ = f no hay imagen (dᵢ → ∞).', draw: function (cx, w, h, col) {
        var L = 44, R = 10, Tp = 10, B = 28, pw = w - L - R, ph = h - Tp - B, lim = 60, sx = function (d) { return L + pw * d / 75; }, sy = function (d) { return Tp + ph / 2 - ph / 2 * clamp(d, -lim, lim) / lim; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; [-60, -30, 0, 30, 60].forEach(function (d) { cx.beginPath(); cx.moveTo(L, sy(d)); cx.lineTo(L + pw, sy(d)); cx.stroke(); cx.fillText(d, L - 5, sy(d) + 3); });
        cx.textAlign = 'center'; for (i = 0; i <= 75; i += 15) cx.fillText(i, sx(i), h - B + 13); cx.fillText('dₒ (cm)  ·  dᵢ (cm)', L + pw / 2, h - 3);
        cx.strokeStyle = '#ff922b'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.f), Tp); cx.lineTo(sx(S.f), Tp + ph); cx.stroke(); cx.setLineDash([]);
        cx.strokeStyle = '#4dabf7'; cx.lineWidth = 2.4; [[0.5, S.f - 0.2], [S.f + 0.2, 75]].forEach(function (rg) { cx.beginPath(); for (var k = 0; k <= 80; k++) { var d = rg[0] + (rg[1] - rg[0]) * k / 80, di = 1 / (1 / S.f - 1 / d); if (k) cx.lineTo(sx(d), sy(di)); else cx.moveTo(sx(d), sy(di)); } cx.stroke(); }); cx.lineWidth = 1;
        var im = img(); if (S.dO <= 75) { cx.fillStyle = '#fff'; cx.strokeStyle = '#e8590c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.dO), sy(im.di), 5, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1; }
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      if (S.mode === 'lente') { var im = img(); return '<div class="card-kicker">Lente · f = ' + f1(S.f) + ' cm</div><table class="calc-table">' + row('1/dᵢ = 1/f − 1/dₒ', '1/' + f1(S.f) + ' − 1/' + f1(S.dO) + ' → dᵢ = <b>' + (isFinite(im.di) ? f1(im.di) + ' cm' : '∞') + '</b>') + row('Aumento m = −dᵢ/dₒ', '<b>' + (isFinite(im.m) ? f2(im.m) : '∞') + '</b>') + row('Potencia', 'P = 1/f = 1/' + f2(S.f / 100) + ' m = <b>' + f1(100 / S.f) + ' D</b>') + '</table>'; }
      var e = eyeCalc(); return '<div class="card-kicker">' + EYE[S.eye].n + '</div><table class="calc-table">' + row('Potencia para enfocar en la retina', f1(100 / e.L + (S.far ? 0 : 100 / S.dNear)) + ' D') + row('Potencia del ojo relajado', f1(100 / 2.4) + ' D + acomodación hasta 4 D') + row('Lente correctora sugerida', S.eye === 'miope' ? '<b>' + f1(100 / e.L - 100 / 2.4) + ' D</b> (divergente) para ver de lejos' : S.eye === 'hiper' ? '<b>+' + f1(100 / e.L + 100 / 25 - 100 / 2.4 - 4) + ' D</b> o más (convergente) para ver de cerca' : 'no necesita') + '</table>';
    },
    quiz: [
      { q: 'Los rayos que llegan paralelos al eje de una lente convergente…', options: ['pasan por el foco', 'siguen paralelos', 'se separan', 'vuelven atrás'], answer: 0, why: 'Esa es la definición de foco.' },
      { q: 'Un objeto a 30 cm de una lente de f = 10 cm forma su imagen a…', options: ['15 cm', '30 cm', '10 cm', '20 cm'], answer: 0, why: '1/dᵢ = 1/10 − 1/30 = 2/30.' },
      { q: 'Con el objeto entre el foco y la lente, la imagen es…', options: ['virtual, derecha y mayor', 'real e invertida', 'real y menor', 'no se forma'], answer: 0, why: 'Así funciona la lupa.' },
      { q: 'La imagen formada en la retina es…', options: ['real e invertida', 'virtual y derecha', 'real y derecha', 'virtual e invertida'], answer: 0, why: 'El ojo es un sistema convergente; el cerebro la interpreta.' },
      { q: 'La acomodación consiste en…', options: ['aumentar la potencia del cristalino para ver de cerca', 'mover la retina', 'cerrar la pupila', 'cambiar el largo del ojo'], answer: 0, why: 'Los músculos ciliares abomban el cristalino.' },
      { q: 'Una persona miope ve borroso…', options: ['de lejos', 'de cerca', 'solo de noche', 'los colores'], answer: 0, why: 'La imagen de lo lejano se forma delante de la retina.' },
      { q: 'La miopía se corrige con lentes…', options: ['divergentes', 'convergentes', 'planas', 'de colores'], answer: 0, why: 'Potencia negativa: alejan el foco hacia la retina.' },
      { q: 'Una lente de +2 D tiene una distancia focal de…', options: ['50 cm', '2 cm', '20 cm', '2 m'], answer: 0, why: 'f = 1/P = 0,5 m.' }
    ],
    help: { intro: 'En «Lab» elige la lente (mueve el objeto y cambia la distancia focal) o el ojo (normal, miope o hipermétrope, con objeto lejano o cercano, y lente correctora).', items: [['Flechas', 'verde: objeto; roja: imagen (transparente si es virtual).'], ['Rayos', 'amarillo: paralelo al eje; azul: por el centro; rojo: por el foco; punteados: prolongaciones.'], ['Ojo', 'el punto verde indica foco sobre la retina; rojo, imagen borrosa.']], try: ['Acerca el objeto hasta el foco: ¿qué pasa con la imagen?', 'Con el ojo miope, busca la lente que deja la imagen nítida.', 'Con el ojo hipermétrope, compara objeto lejano y a 25 cm.'] }
  };
  MSim.create(def);
})();
