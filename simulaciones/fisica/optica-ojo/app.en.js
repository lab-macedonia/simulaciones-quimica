/* Lentes y el ojo humano — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f2 = function (x) { return fmt(x, 2); };
  var EYE = { normal: { n: 'Normal eye (emmetropic)', L: 2.4 }, miope: { n: 'Myopia (long eye)', L: 2.6 }, hiper: { n: 'Hyperopia (short eye)', L: 2.2 } };
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
      ['Converging lens', 'Lens', 'Rays parallel to the axis are bent and pass through the focus',
        '<p>A <b>converging lens</b> (thicker in the middle) bends light by <b>refraction</b>: rays arriving <b>parallel to the axis</b> meet at the <b>focus</b> F′. The distance from the lens to the focus is the <b>focal length</b> f. Rays through the <b>optical centre</b> are not bent.</p>'],
      ['Real, inverted image', 'Real image', 'Object far from the lens: real, inverted, smaller image',
        '<p>With the object further than <b>2f</b> away, the rays from its tip cross on the other side of the lens and form a <b>real image</b> (it can be projected onto a screen), <b>inverted</b> and <b>smaller</b>. That is how cameras and our eyes work. It obeys <b>1/f = 1/d<sub>o</sub> + 1/d<sub>i</sub></b> and the magnification is m = −d<sub>i</sub>/d<sub>o</sub>.</p>'],
      ['The magnifying glass', 'Magnifier', 'Object inside the focal length: virtual, upright, magnified image',
        '<p>If the object is <b>closer than the focus</b>, the rays leave diverging and do not cross. Our eye traces them back and sees a <b>virtual</b>, <b>upright</b> and <b>larger</b> image on the same side as the object (dashed lines). That is the principle of the <b>magnifying glass</b>.</p>'],
      ['The eye and accommodation', 'Eye', 'Cornea and lens form a real, inverted image on the retina',
        '<p>In the eye, the <b>cornea</b> and the <b>lens</b> act as a converging lens and form a real, inverted image on the <b>retina</b>; the brain interprets it upright. To see up close, the ciliary muscles make the lens rounder and <b>increase its power</b>: this is <b>accommodation</b>. Power is measured in <b>dioptres</b> (D = 1/f in metres).</p>'],
      ['Myopia', 'Myopia', 'The eye is long: distant images form in front of the retina',
        '<p>In <b>myopia</b> the eye is longer than normal (or the lens too strong): distant objects focus <b>in front of the retina</b> and look blurred, although near vision is fine. It is corrected with a <b>diverging lens</b> (negative power), which spreads the rays slightly before they enter the eye.</p>'],
      ['Hyperopia', 'Hyperopia', 'The eye is short: near images fall behind the retina',
        '<p>In <b>hyperopia</b> the eye is shorter: the focus falls <b>behind the retina</b>. By accommodating one can see far away, but near objects look blurred and the eyes tire. It is corrected with a <b>converging lens</b> (positive power). With age the lens loses flexibility (<b>presbyopia</b>) and converging lenses are also needed for reading.</p>']
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
    key: 'optica-ojo', title: 'Lenses and the human eye', subtitle: '3D simulator · physics', accent: { dark: '#4dabf7', light: '#1864ab' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-0.6, 2, 15], target: [-0.6, 0.8, 0] }, { id: 'sup', label: 'Oblique', pos: [-0.6, 7, 12], target: [-0.6, 0, 0] }],
    layers: [{ id: 'rays', label: 'Rays', icon: '╱' }],
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
        if (far) { G.obj.visible = false; G.img.visible = false; if (on) for (var j = 0; j < 3; j++) { var y = (j - 1) * 1.1; setLine(rays[j], [V(-11, y), V(0, y), V(fX, 0), V(fX + (fX) * 1.5, -y * 1.5)]); } lab.a.pos(fX, 1.2, 0).set('Focus: f = ' + fmt(S.f, 0) + ' cm', 'bl-lead').vis(true); return; }
        setArrow(G.obj, oX, hO, 1); var vis = isFinite(im.di) && Math.abs(iX) < 14; if (vis) setArrow(G.img, iX, hI, im.real ? 1 : 0.45); else G.img.visible = false;
        if (on) {
          var end = 11, sl = -hO / fX; setLine(rays[0], [V(oX, hO), V(0, hO), V(end, hO + sl * end)]);
          setLine(rays[1], [V(oX, hO), V(end, hO + (-hO / oX) * (end))]);
          if (S.dO > S.f + 0.01) { var y3 = hO + (0 - oX) * ((0 - hO) / (-fX - oX)); setLine(rays[2], [V(oX, hO), V(0, y3), V(end, y3)]); }
          if (!im.real && vis) { setLine(rays[6], [V(0, hO), V(iX, hI)]); setLine(rays[7], [V(oX, hO), V(iX, hI)]); }
        }
        lab.a.pos(oX, hO + 0.7, 0).set('Object · d₀ = ' + fmt(S.dO, 1) + ' cm', 'bl-neg').vis(true);
        lab.b.pos(vis ? iX : 6, (vis ? hI : 0) + (hI < 0 ? -0.7 : 0.7), 0).set(!isFinite(im.di) ? 'No image (object at the focus)' : 'Image ' + (im.real ? 'real' : 'virtual') + ', ' + (im.m < 0 ? 'inverted' : 'upright') + ' · dᵢ = ' + fmt(im.di, 1) + ' cm · m = ' + f2(im.m), im.real ? 'bl-warn' : 'bl-pos').vis(true);
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
        lab.a.pos(R, R + 0.6, 0).set(EYE[S.eye].n + ' · ' + (S.far ? 'distant object' : 'object at ' + fmt(S.dNear, 0) + ' cm'), 'bl-lead').vis(true);
        lab.b.pos(R + 0.5, R * 0.55, 0).set(e.ok ? 'Sharp image on the retina' : (e.pre ? 'Image in front of the retina: blurred' : 'Image behind the retina: blurred'), e.ok ? 'bl-neg' : 'bl-warn').vis(true);
        lab.c.pos(-2.2, 2.4, 0).set(S.glasses ? 'Lens ' + (S.Pc < 0 ? 'diverging ' : 'converging ') + (S.Pc > 0 ? '+' : '') + f1(S.Pc) + ' D' : '', 'bl-pos').vis(S.glasses);
        lab.d.pos(0.7, -1.9, 0).set('Accommodation +' + f1(e.acc) + ' D', 'bl-d').vis(e.acc > 0.05);
      }
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.mode && u.mode.set(S.mode); u.dO && u.dO.set(Math.min(S.dO, 75)); u.f && u.f.set(S.f); u.eye && u.eye.set(S.eye); } },
    hud: function () { return { eq: { chip: 'f', name: S.mode === 'lente' ? 'Converging lens' : 'Human eye', body: '<div class="eqline"><small>Thin lens</small>1/f = 1/dₒ + 1/dᵢ</div><div class="eqline"><small>Magnification</small>m = −dᵢ / dₒ</div><div class="eqline"><small>Power</small>P = 1/f (dioptres, f in m)</div>' }, legend: [{ label: 'Green', color: '#51cf66', text: 'object' }, { label: 'Red', color: '#ff6b6b', text: 'image (transparent if virtual)' }, { label: 'Dashed', color: '#ff8787', text: 'extended rays (virtual image)' }] }; },
    measures: function () {
      if (S.mode === 'lente') { var im = img(); return [['Focal length', fmt(S.f, 1) + ' cm (' + f1(100 / S.f) + ' D)'], ['Object distance', fmt(S.dO, 1) + ' cm'], ['Image distance', isFinite(im.di) ? fmt(im.di, 1) + ' cm' : '∞'], ['Magnification', isFinite(im.m) ? f2(im.m) : '∞'], ['Type', im.real ? 'real and inverted' : 'virtual and upright']]; }
      var e = eyeCalc(); return [['Eye', EYE[S.eye].n], ['Eye length', f1(e.L * 10) + ' mm'], ['Object', S.far ? 'distant' : fmt(S.dNear, 0) + ' cm'], ['Total power', f1(e.P) + ' D'], ['Accommodation used', f1(e.acc) + ' D (max. 4 D)'], ['Image at', f1(e.di * 10) + ' mm from the cornea'], ['Corrective lens', S.glasses ? (S.Pc > 0 ? '+' : '') + f1(S.Pc) + ' D' : 'no lenses']];
    },
    ideas: ['Converging lens: parallel rays → focus.', '<b>1/f = 1/dₒ + 1/dᵢ</b>; m = −dᵢ/dₒ.', 'dₒ > f: real, inverted image; dₒ < f: virtual and magnified (magnifier).', 'The eye forms a real, inverted image on the retina.', 'Myopia → diverging lens; hyperopia → converging lens.', 'Power in dioptres: P = 1/f (m).'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Lens'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Scene', cols: 2, value: S.mode, options: [{ v: 'lente', label: 'Converging lens' }, { v: 'ojo', label: 'Human eye' }], onChange: function (v) { ctx.goManual(); S.mode = v; } }); c.appendChild(ui.mode);
      ui.dO = kit.ui.slider({ label: 'Object distance (cm)', min: 3, max: 75, step: 0.5, value: Math.min(S.dO, 75), onInput: function (v) { ctx.goManual(); S.mode = 'lente'; S.dO = v; } });
      ui.f = kit.ui.slider({ label: 'Focal length (cm)', min: 5, max: 20, step: 0.5, value: S.f, onInput: function (v) { ctx.goManual(); S.mode = 'lente'; S.f = v; } });
      c.appendChild(kit.ui.sliders([ui.dO, ui.f]));
      var c2 = kit.ui.card('Eye'); el.appendChild(c2);
      ui.eye = kit.ui.options({ label: 'Type of eye', cols: 3, value: S.eye, options: Object.keys(EYE).map(function (k) { return { v: k, label: EYE[k].n.split(' (')[0] }; }), onChange: function (v) { ctx.goManual(); S.mode = 'ojo'; S.eye = v; } }); c2.appendChild(ui.eye);
      ui.far = kit.ui.seg([{ v: true, label: 'Distant object' }, { v: false, label: 'Object at 25 cm' }], S.far, function (v) { ctx.goManual(); S.mode = 'ojo'; S.far = v; }); c2.appendChild(ui.far);
      ui.Pc = kit.ui.slider({ label: 'Corrective lens (D)', min: -6, max: 6, step: 0.25, value: S.Pc, digits: 2, onInput: function (v) { ctx.goManual(); S.mode = 'ojo'; S.Pc = v; S.glasses = Math.abs(v) > 0.01; } }); c2.appendChild(kit.ui.sliders([ui.Pc]));
      el.appendChild(ctx.btnRow([{ t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Image distance against object distance', h: 220, note: 'For dₒ > f the image is real (dᵢ > 0); for dₒ < f it is virtual (dᵢ < 0). At dₒ = f there is no image (dᵢ → ∞).', draw: function (cx, w, h, col) {
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
      if (S.mode === 'lente') { var im = img(); return '<div class="card-kicker">Lens · f = ' + f1(S.f) + ' cm</div><table class="calc-table">' + row('1/dᵢ = 1/f − 1/dₒ', '1/' + f1(S.f) + ' − 1/' + f1(S.dO) + ' → dᵢ = <b>' + (isFinite(im.di) ? f1(im.di) + ' cm' : '∞') + '</b>') + row('Aumento m = −dᵢ/dₒ', '<b>' + (isFinite(im.m) ? f2(im.m) : '∞') + '</b>') + row('Power', 'P = 1/f = 1/' + f2(S.f / 100) + ' m = <b>' + f1(100 / S.f) + ' D</b>') + '</table>'; }
      var e = eyeCalc(); return '<div class="card-kicker">' + EYE[S.eye].n + '</div><table class="calc-table">' + row('Power needed to focus on the retina', f1(100 / e.L + (S.far ? 0 : 100 / S.dNear)) + ' D') + row('Power of the relaxed eye', f1(100 / 2.4) + ' D + accommodation up to 4 D') + row('Suggested corrective lens', S.eye === 'miope' ? '<b>' + f1(100 / e.L - 100 / 2.4) + ' D</b> (diverging) for distance vision' : S.eye === 'hiper' ? '<b>+' + f1(100 / e.L + 100 / 25 - 100 / 2.4 - 4) + ' D</b> or more (converging) for near vision' : 'not needed') + '</table>';
    },
    quiz: [
      { q: 'Rays arriving parallel to the axis of a converging lens…', options: ['pass through the focus', 'stay parallel', 'spread apart', 'go back'], answer: 0, why: 'That is the definition of the focus.' },
      { q: 'An object 30 cm from a lens with f = 10 cm forms its image at…', options: ['15 cm', '30 cm', '10 cm', '20 cm'], answer: 0, why: '1/dᵢ = 1/10 − 1/30 = 2/30.' },
      { q: 'With the object between the focus and the lens, the image is…', options: ['virtual, upright and larger', 'real and inverted', 'real and smaller', 'not formed'], answer: 0, why: 'That is how a magnifying glass works.' },
      { q: 'The image formed on the retina is…', options: ['real and inverted', 'virtual and upright', 'real and upright', 'virtual and inverted'], answer: 0, why: 'The eye is a converging system; the brain interprets the image.' },
      { q: 'Accommodation means…', options: ['increasing the power of the lens to see up close', 'moving the retina', 'closing the pupil', 'changing the length of the eye'], answer: 0, why: 'The ciliary muscles make the lens rounder.' },
      { q: 'A short-sighted person sees blurred…', options: ['far away', 'up close', 'only at night', 'colours'], answer: 0, why: 'The image of distant things forms in front of the retina.' },
      { q: 'Myopia is corrected with…', options: ['diverging lenses', 'converging lenses', 'flat lenses', 'coloured lenses'], answer: 0, why: 'Negative power: they move the focus back to the retina.' },
      { q: 'A +2 D lens has a focal length of…', options: ['50 cm', '2 cm', '20 cm', '2 m'], answer: 0, why: 'f = 1/P = 0.5 m.' }
    ],
    help: { intro: 'In «Lab» choose the lens (move the object and change the focal length) or the eye (normal, short- or long-sighted, with a distant or near object, and a corrective lens).', items: [['Arrows', 'green: object; red: image (transparent if virtual).'], ['Rays', 'yellow: parallel to the axis; blue: through the centre; red: through the focus; dashed: extensions.'], ['Eye', 'the green dot means the focus is on the retina; red, a blurred image.']], try: ['Move the object to the focus: what happens to the image?', 'With the short-sighted eye, find the lens that makes the image sharp.', 'With the long-sighted eye, compare a distant object and one at 25 cm.'] }
  };
  MSim.create(def);
})();
