/* AtomLab 3D — modelos atómicos históricos y orbitales con Three.js (Laboratorio MACEDONIA · UMCE) */
(function (g) {
  "use strict";
  var T = g.THREE;
  var RM = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var API = { ok: false };
  g.Atom3D = API;
  if (!T || !T.OrbitControls) return;

  function css(v, fb) { var s = getComputedStyle(document.body).getPropertyValue(v).trim(); return s || fb; }
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (x, d) { return Number(x).toFixed(d == null ? 1 : d).replace('.', '.'); };

  /* ---------------- Visor genérico ---------------- */
  var viewers = [];
  function Viewer(canvas, opt) {
    this.c = canvas;
    this.r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.r.setClearColor(0x000000, 0);
    this.scene = new T.Scene();
    this.cam = new T.PerspectiveCamera(opt.fov || 38, 1, 0.1, 600);
    this.scene.add(new T.AmbientLight(0xffffff, 0.7));
    var dl = new T.DirectionalLight(0xffffff, 0.85); dl.position.set(-4, 7, 8); this.scene.add(dl);
    var dl2 = new T.DirectionalLight(0x9db8ff, 0.25); dl2.position.set(6, -3, -4); this.scene.add(dl2);
    this.root = new T.Group(); this.scene.add(this.root);
    this.ctl = new T.OrbitControls(this.cam, canvas);
    this.ctl.enableDamping = true; this.ctl.dampingFactor = 0.08; this.ctl.enablePan = false;
    this.ctl.autoRotate = !RM && opt.auto !== false; this.ctl.autoRotateSpeed = 1.1;
    canvas.style.touchAction = 'pan-y';
    this.tick = null; this.t = 0; this.d0 = 10;
    viewers.push(this);
  }
  Viewer.prototype.setDist = function (d, keepAngle) {
    var dir = keepAngle ? this.cam.position.clone().normalize() : new T.Vector3(0.3, 0.55, 1).normalize();
    this.cam.position.copy(dir.multiplyScalar(d)); this.ctl.target.set(0, 0, 0);
    this.ctl.minDistance = d * 0.35; this.ctl.maxDistance = d * 2.6; this.ctl.update(); this.d0 = d;
  };
  Viewer.prototype.reset = function () { this.setDist(this.d0); };
  Viewer.prototype.clear = function () {
    var self = this;
    (function rm(o) {
      for (var i = o.children.length - 1; i >= 0; i--) {
        var ch = o.children[i]; rm(ch); o.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) { var m = ch.material; if (m.map && m.map.userData && m.map.userData.own) m.map.dispose(); m.dispose(); }
      }
    })(self.root);
    this.tick = null; this.t = 0;
  };
  Viewer.prototype.frame = function (dt) {
    var w = this.c.clientWidth, h = this.c.clientHeight; if (!w || !h) return;
    var dpr = Math.min(g.devicePixelRatio || 1, 2);
    if (this.c.width !== Math.round(w * dpr) || this.c.height !== Math.round(h * dpr)) {
      this.r.setPixelRatio(dpr); this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    }
    this.ctl.update();
    this.t += dt; if (this.tick) this.tick(dt, this.t);
    this.r.render(this.scene, this.cam);
  };
  var last = 0;
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    viewers.forEach(function (v) { if (v.c.offsetParent !== null) v.frame(dt); });
    requestAnimationFrame(loop);
  }

  /* ---------------- Utilidades de escena ---------------- */
  function sphere(r, color, o) {
    return new T.Mesh(new T.SphereGeometry(r, 32, 24), new T.MeshPhongMaterial(Object.assign({ color: color, shininess: 55, specular: 0x333333 }, o || {})));
  }
  function label(txt, color, size) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 96; var x = c.getContext('2d');
    x.font = '700 56px Inter,system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(txt, 128, 50);
    var tx = new T.CanvasTexture(c); tx.userData = { own: true };
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false }));
    sp.scale.set(size * 2.67, size, 1); sp.renderOrder = 10; return sp;
  }
  function circle(r, color, op, seg) {
    var pts = []; seg = seg || 128;
    for (var i = 0; i < seg; i++) { var t = 2 * Math.PI * i / seg; pts.push(new T.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r)); }
    return new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: color, transparent: true, opacity: op }));
  }
  function tilted(rx, rz) { var g2 = new T.Group(); g2.rotation.set(rx, 0, rz); return g2; }
  function fib(n, r) {
    var out = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) { var y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), th = ga * i; out.push(new T.Vector3(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r)); }
    return out;
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  /* ---------------- Modelos históricos ---------------- */
  var CAP = {
    dalton: "solid, indivisible sphere with no internal structure",
    thomson: "diffuse positive sphere with corpuscles in rings (plum pudding)",
    rutherford: "tiny nucleus and an almost empty atom; the model does not explain why orbits would be stable. At real scale: if the atom were 100 m wide, the nucleus would be ~1 mm",
    nucleus: "nucleus with protons (+) and neutrons (n⁰), drawn out of scale; the neutron explains nuclear mass and isotopes",
    bohr: "quantized orbits with r ∝ n²: when jumping level the electron emits light (ΔE = hν). Discharge cycle: 3→2 (red), 2→1 (ultraviolet)",
    wave: "de Broglie standing wave: only orbits where n·λ = 2πr fit (here n = 6)",
    quantum: "probability density |ψ|² of the 1s orbital: where the electron is most likely to be found (there are no trajectories)"
  };
  var H = null;      // visor de la pestaña Historia

  function buildModel(v) {
    var V = H, col = { acc: css('--accent', '#2989b3'), pur: css('--purple', '#7654a4'), mut: css('--muted', '#667085') };
    V.clear();
    var R = V.root, E = function (r) { return sphere(r, col.pur, { emissive: col.pur, emissiveIntensity: 0.18 }); };
    V.ctl.autoRotate = !RM && $('atomRot') ? $('atomRot').checked : !RM;
    var dist = 11, goOrb = $('goOrb'); if (goOrb) goOrb.hidden = (v !== 'quantum');

    if (v === 'dalton') {
      R.add(sphere(2.5, col.acc, { shininess: 100 }));
      dist = 9;
    }
    if (v === 'thomson') {
      R.add(new T.Mesh(new T.SphereGeometry(3, 48, 32), new T.MeshPhongMaterial({ color: col.acc, transparent: true, opacity: 0.16, depthWrite: false, shininess: 60 })));
      R.add(new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(3, 18, 12)), new T.LineBasicMaterial({ color: col.acc, transparent: true, opacity: 0.18 })));
      fib(30, 2.75).forEach(function (p) { var s = label('+', col.acc, 0.55); s.position.copy(p); s.material.opacity = 0.7; R.add(s); });
      var ringG = new T.Group(); R.add(ringG);
      ringG.add(circle(1.7, col.pur, 0.5, 96));
      for (var i = 0; i < 5; i++) { var a = 2 * Math.PI * i / 5, e = E(0.24); e.position.set(Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7); ringG.add(e); }
      R.add(E(0.24));
      V.tick = function (dt) { if (!RM) ringG.rotation.y += dt * 0.6; };
      dist = 11;
    }
    if (v === 'rutherford') {
      var nuc = sphere(0.2, col.acc, { shininess: 100 }); R.add(nuc);
      var rr = [1.7, 2.7, 3.7], tl = [[0.45, 0.2], [-0.6, 0.9], [1.0, -0.5]], sp = [1.3, 0.85, 0.6], el = [];
      rr.forEach(function (r, i) {
        var grp = tilted(tl[i][0], tl[i][1]); grp.add(circle(r, col.pur, 0.4)); var e = E(0.19); grp.add(e); R.add(grp); el.push([e, r, sp[i], i * 2.1]);
      });
      var env = new T.Group(); env.add(circle(4.7, col.mut, 0.35)); var c2 = circle(4.7, col.mut, 0.35); c2.rotation.x = Math.PI / 2; env.add(c2); var c3 = circle(4.7, col.mut, 0.35); c3.rotation.z = Math.PI / 2; env.add(c3); R.add(env);
      V.tick = function (dt, t) { el.forEach(function (o) { var a = o[3] + (RM ? 0 : t * o[2]); o[0].position.set(Math.cos(a) * o[1], 0, Math.sin(a) * o[1]); }); };
      dist = 13;
    }
    if (v === 'nucleus') {
      var cl = new T.Group(), P = [[0, .5, 0, 'p'], [.45, .05, .3, 'n'], [-.45, .1, .25, 'n'], [.1, -.3, .45, 'p'], [-.3, -.4, -.2, 'p'], [.4, -.35, -.25, 'n'], [0, .1, -.5, 'n']];
      P.forEach(function (q) {
        var n = sphere(0.36, q[3] === 'p' ? col.acc : '#9aa3ad', { shininess: 90 }); n.position.set(q[0], q[1], q[2]); cl.add(n);
        if (q[3] === 'p') { var s = label('+', '#ffffff', 0.5); s.position.set(q[0], q[1], q[2] + 0.4); cl.add(s); }
      });
      R.add(cl);
      var o1 = tilted(0.5, 0.2), o2 = tilted(-0.7, 0.9), e1 = E(0.2), e2 = E(0.2);
      o1.add(circle(3.4, col.pur, 0.4)); o1.add(e1); o2.add(circle(4.4, col.pur, 0.4)); o2.add(e2); R.add(o1, o2);
      V.tick = function (dt, t) { var a = RM ? 0 : t; e1.position.set(Math.cos(a * 0.9) * 3.4, 0, Math.sin(a * 0.9) * 3.4); e2.position.set(Math.cos(a * 0.55 + 2) * 4.4, 0, Math.sin(a * 0.55 + 2) * 4.4); };
      dist = 13;
    }
    if (v === 'bohr') {
      R.add(sphere(0.3, col.acc, { shininess: 100 }));
      var RAD = [0.55, 2.2, 4.95];                       // r ∝ n²
      RAD.forEach(function (r, i) { R.add(circle(r, col.mut, 0.6)); var s = label('n=' + (i + 1), col.mut, 0.6); s.position.set(r + 0.15, 0.35, 0); R.add(s); });
      var ele = E(0.24); R.add(ele);
      var ph = new T.Mesh(new T.SphereGeometry(0.2, 16, 12), new T.MeshBasicMaterial({ color: '#d98a2b', transparent: true })); ph.visible = false; R.add(ph);
      var phLab = label('hν', '#d98a2b', 0.6); phLab.visible = false; R.add(phLab);
      var st = { ang: 0 }, CYC = 12;
      V.tick = function (dt, t) {
        var c = RM ? 1 : t % CYC, n, rad;
        // 0–2.5: n=3 · 2.5–3.3: 3→2 · 3.3–6.5: n=2 · 6.5–7.3: 2→1 · 7.3–10.5: n=1 · 10.5–12: reinicio
        if (c < 2.5) { rad = RAD[2]; n = 3; }
        else if (c < 3.3) { rad = RAD[2] + (RAD[1] - RAD[2]) * smooth((c - 2.5) / 0.8); n = 3; }
        else if (c < 6.5) { rad = RAD[1]; n = 2; }
        else if (c < 7.3) { rad = RAD[1] + (RAD[0] - RAD[1]) * smooth((c - 6.5) / 0.8); n = 2; }
        else if (c < 10.5) { rad = RAD[0]; n = 1; }
        else { rad = RAD[0] + (RAD[2] - RAD[0]) * smooth((c - 10.5) / 1.5); n = 1; }
        var w = 1.9 / Math.pow(Math.max(1, rad / 0.55) , 0.9);
        st.ang += dt * w * 2.2;
        ele.position.set(Math.cos(st.ang) * rad, 0, Math.sin(st.ang) * rad);
        var emitAt = c >= 2.5 && c < 6.5 ? 2.5 : (c >= 6.5 && c < 10.5 ? 6.5 : -1);
        if (emitAt >= 0 && !RM) {
          if (!st['p' + emitAt]) { var dd = new T.Vector3(ele.position.x, 0.3, ele.position.z).normalize(); st['p' + emitAt] = { d: dd, p0: ele.position.clone() }; }
          var s = st['p' + emitAt], k = c - emitAt, p = s.p0.clone().add(s.d.clone().multiplyScalar(k * 2.6));
          ph.position.copy(p); phLab.position.copy(p).add(new T.Vector3(0, 0.6, 0));
          var colr = emitAt === 2.5 ? '#e0554d' : '#8a4fe0'; ph.material.color.set(colr); phLab.visible = ph.visible = k < 3.4; ph.material.opacity = Math.max(0, 1 - k / 3.4);
          phLab.material.opacity = ph.material.opacity;
        } else { ph.visible = phLab.visible = false; st['p2.5'] = st['p6.5'] = null; }
        if (c < 0.05) { st['p2.5'] = st['p6.5'] = null; }
      };
      dist = 14;
    }
    if (v === 'wave') {
      R.add(sphere(0.3, col.acc, { shininess: 100 }));
      var RO = 3, A = 0.5, NN = 6, M = 900, pos = new Float32Array(M * 3), geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      var cv = document.createElement('canvas'); cv.width = cv.height = 32; var cx = cv.getContext('2d'); var gr = cx.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
      var tx = new T.CanvasTexture(cv); tx.userData = { own: true };
      var pts = new T.Points(geo, new T.PointsMaterial({ color: col.pur, size: 0.16, map: tx, transparent: true, depthWrite: false, alphaTest: 0.02 })); R.add(pts);
      R.add(circle(RO, col.mut, 0.45));
      V.tick = function (dt, t) {
        var amp = RM ? 1 : Math.cos(t * 1.6);
        for (var i = 0; i < M; i++) {
          var th = 2 * Math.PI * i / M, rr = RO + A * Math.cos(NN * th) * amp;
          pos[i * 3] = Math.cos(th) * rr; pos[i * 3 + 1] = 0.35 * Math.cos(NN * th) * amp; pos[i * 3 + 2] = Math.sin(th) * rr;
        }
        geo.attributes.position.needsUpdate = true;
      };
      dist = 11;
    }
    if (v === 'quantum') {
      var cd = g.Orb.cloud('1s', 9000), f = g.Orb.info('1s'); var sc = 0.95;
      cd.rotation.x = -Math.PI / 2; R.add(cd);
      R.add(sphere(0.16, col.acc, { shininess: 100 }));
      dist = f.r99 * 3.1;
    }
    V.setDist(dist);
    var cap = $('atomCaption'); if (cap) cap.textContent = CAP[v] || '';
  }

  var current = 'dalton';
  API.show = function (v) {
    if (!H) return false;
    current = v; buildModel(v);
    $('atomBox').setAttribute('aria-label', "3D model: " + v + '. Arrastra para girar, rueda o pellizco para acercar.');
    return true;
  };

  /* ---------------- Pestaña Orbitales ---------------- */
  var O = null, oRoot = null;
  function pal() { return { pos: new T.Color('#e0554d'), neg: new T.Color('#3f74e0') }; }
  function rebuildOrb() {
    if (!O) return;
    var k = $('orbSel').value, mode = $('orbMode').value, N = +$('orbPts').value, f = g.Orb.info(k), o = f.o, ext = f.r99 * 1.12;
    O.clear();
    var chem = new T.Group(); chem.rotation.x = -Math.PI / 2; O.root.add(chem);
    if (mode !== 'lobes') chem.add(g.Orb.cloud(k, N, pal()));
    if (mode !== 'cloud') chem.add(g.Orb.lobes(k, f.r99 * (mode === 'both' ? 0.5 : 0.62), pal()));
    if ($('orbNodes').checked) chem.add(g.Orb.nodes(k, ext, css('--muted', '#667085')));
    if ($('orbAxes').checked) {
      var axC = ['#c0504d', '#4f9a5e', '#4a78c8'], dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], nm = ['x', 'y', 'z'];
      dirs.forEach(function (d, i) {
        var geo = new T.BufferGeometry().setFromPoints([new T.Vector3(-d[0] * ext, -d[1] * ext, -d[2] * ext), new T.Vector3(d[0] * ext, d[1] * ext, d[2] * ext)]);
        chem.add(new T.Line(geo, new T.LineBasicMaterial({ color: axC[i], transparent: true, opacity: 0.55 })));
        var s = label(nm[i], axC[i], ext * 0.16); s.position.set(d[0] * ext * 1.08, d[1] * ext * 1.08, d[2] * ext * 1.08); chem.add(s);
      });
    }
    chem.add(sphere(Math.max(0.08, ext * 0.022), css('--accent', '#2989b3'), { shininess: 100 }));
    O.setDist(ext * 3.3);
    O.ctl.autoRotate = !RM && $('orbRot').checked;
    infoOrb(k); drawRad(k);
  }
  function infoOrb(k) {
    var f = g.Orb.info(k), o = f.o, rad = o.n - o.l - 1, A0 = 52.9;
    var nodesTxt = f.nodes.length ? f.nodes.map(function (r) { return fmt(r, 2); }).join(' y ') + ' a₀' : '—';
    var ang = o.l === 0 ? "none (spherical symmetry)" : o.l === 1 ? "1 nodal plane passing through the nucleus" : (o.a === 'dz2' ? "2 conical surfaces" : "2 nodal planes");
    $('orbTitle').innerHTML = 'Orbital ' + o.html;
    $('orbInfo').innerHTML =
      '<table class="orbtab"><tr><th>n · ℓ</th><td>' + o.n + ' · ' + o.l + ' (' + 'spdf'[o.l] + ')</td></tr>' +
      "<tr><th>Energy (H)</th><td>−13.6 / " + o.n + '² = ' + fmt(-13.6 / (o.n * o.n), 2) + ' eV</td></tr>' +
      "<tr><th>Radial nodes</th><td>n − ℓ − 1 = " + rad + (rad ? " · at r = " + nodesTxt : '') + '</td></tr>' +
      "<tr><th>Angular nodes</th><td>ℓ = " + o.l + ' · ' + ang + '</td></tr>' +
      "<tr><th>Most probable radius</th><td>" + fmt(f.rp, 2) + ' a₀ ≈ ' + Math.round(f.rp * A0) + ' pm</td></tr>' +
      "<tr><th>Mean radius ⟨r⟩</th><td>" + fmt(f.rmean, 2) + ' a₀ ≈ ' + Math.round(f.rmean * A0) + ' pm</td></tr></table>';
  }
  function drawRad(k) {
    var cv = $('radCanvas'); if (!cv) return;
    var w = cv.clientWidth || 520, h = cv.clientHeight || 190, dpr = Math.min(g.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    var f = g.Orb.info(k), rr = f.r99 * 1.25, d = g.Orb.radial(k, rr, 300), mx = Math.max.apply(null, d.y) * 1.08;
    var L = 46, Rg = w - 14, Tp = 16, Bt = h - 34, sx = function (x) { return L + (Rg - L) * x / rr; }, sy = function (y) { return Bt - (Bt - Tp) * y / mx; };
    var mut = css('--muted', '#667085'), acc = css('--accent', '#2989b3'), pur = css('--purple', '#7654a4'), brd = css('--border', '#d6dde5');
    c.strokeStyle = brd; c.fillStyle = mut; c.font = '12px Inter,system-ui,sans-serif'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, Tp); c.lineTo(L, Bt); c.lineTo(Rg, Bt); c.stroke();
    var step = rr > 60 ? 20 : rr > 25 ? 10 : rr > 12 ? 5 : 2;
    c.textAlign = 'center'; for (var x = 0; x <= rr; x += step) { c.fillText(String(x), sx(x), Bt + 14); c.beginPath(); c.moveTo(sx(x), Bt); c.lineTo(sx(x), Bt + 3); c.stroke(); }
    c.fillText('r (a₀)', (L + Rg) / 2, h - 4);
    c.save(); c.translate(12, (Tp + Bt) / 2); c.rotate(-Math.PI / 2); c.fillText('P(r) = r²R²', 0, 0); c.restore();
    c.beginPath(); d.x.forEach(function (x, i) { var X = sx(x), Y = sy(d.y[i]); i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
    c.lineTo(sx(rr), Bt); c.lineTo(sx(0), Bt); c.closePath(); c.fillStyle = 'rgba(118,84,164,.16)'; c.fill();
    c.beginPath(); d.x.forEach(function (x, i) { var X = sx(x), Y = sy(d.y[i]); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.strokeStyle = pur; c.lineWidth = 2.2; c.stroke();
    c.setLineDash([4, 4]); c.lineWidth = 1.2; c.strokeStyle = acc; c.fillStyle = acc; c.textAlign = 'left';
    c.beginPath(); c.moveTo(sx(f.rp), Bt); c.lineTo(sx(f.rp), Tp + 4); c.stroke(); c.fillText("most probable", Math.min(sx(f.rp) + 4, Rg - 74), Tp + 12);
    c.strokeStyle = '#d98a2b'; c.fillStyle = '#d98a2b';
    f.nodes.forEach(function (r) { c.beginPath(); c.moveTo(sx(r), Bt); c.lineTo(sx(r), Tp + 24); c.stroke(); c.fillText("node", sx(r) + 3, Tp + 34); });
    c.setLineDash([]);
  }

  /* ---------------- Inicio ---------------- */
  function init() {
    try { if (T.WebGLRenderer && $('atom3d')) H = new Viewer($('atom3d'), { dist: 11 }); } catch (e) { H = null; return; }
    API.ok = !!H;
    if ($('atomRot')) $('atomRot').onchange = function () { H.ctl.autoRotate = !RM && this.checked; };
    if ($('atomReset')) $('atomReset').onclick = function () { H.reset(); };
    if ($('goOrb')) $('goOrb').onclick = function () { var t = document.querySelector('[data-tab="orbitales"]'); if (t) t.click(); };
    if ($('orb3d')) {
      try { O = new Viewer($('orb3d'), { dist: 12 }); } catch (e) { O = null; }
      if (O) {
        var sel = $('orbSel'); sel.innerHTML = g.Orb.LIST.map(function (o) { return '<option value="' + o.k + '">' + o.nm + '</option>'; }).join('');
        var deb = null; var again = function () { clearTimeout(deb); deb = setTimeout(rebuildOrb, 120); };
        ['orbSel', 'orbMode', 'orbNodes', 'orbAxes'].forEach(function (id) { $(id).onchange = rebuildOrb; });
        $('orbPts').oninput = again; $('orbRot').onchange = function () { O.ctl.autoRotate = !RM && this.checked; };
        $('orbReset').onclick = function () { O.reset(); };
        document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.tab === 'orbitales') setTimeout(rebuildOrb, 30); if (b.dataset.tab === 'historia') setTimeout(function () { buildModel(current); }, 30); }); });
        g.addEventListener('resize', function () { if ($('orbitales').classList.contains('active')) drawRad($('orbSel').value); });
        API.setOrbital = function (k, mode) { $('orbSel').value = k; if (mode) $('orbMode').value = mode; rebuildOrb(); };
      }
    }
    var th = $('theme'); if (th) th.addEventListener('click', function () { setTimeout(function () { buildModel(current); if (O && $('orbitales').classList.contains('active')) rebuildOrb(); }, 30); });
    requestAnimationFrame(loop);
  }
  init();
})(window);
