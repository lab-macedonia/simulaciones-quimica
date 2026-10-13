/* CarboLab · De Fischer a Haworth y silla — simulador 3D · Laboratorio MACEDONIA (UMCE)
   Usa el kit común ../../kit/simkit.js y el núcleo geométrico core.js (CarboCore, sin DOM). */
(function () {
  'use strict';
  var C = CarboCore, T3 = THREE, kit;
  var clamp = SimKit.clamp, fmt = SimKit.fmt;
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var sstep = function (a, b, x) { return smooth((x - a) / (b - a)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------- Estado ------------------------- */
  var S = { sugar: 'glucosa', ring: 'piranosa', anomer: 'beta', T: 0, q: 0, qt: 0, zoom: 1, autoView: true };
  var P = { qHand: false };
  var M = null;
  var ui = {};

  var SUG_META = { ribosa: 'aldopentosa', glucosa: 'aldohexosa', manosa: 'aldohexosa', galactosa: 'aldohexosa', fructosa: 'cetohexosa', ribulosa: 'cetopentosa' };
  var SIDE = { R: 'derecha', L: 'izquierda' }, UD = { R: 'abajo', L: 'arriba' };

  /* hash: #glucosa/piranosa/beta */
  function parseHash() {
    var p = location.hash.slice(1).split('/');
    if (p.length === 3 && C.SUGARS[p[0]] && /^(piranosa|furanosa)$/.test(p[1]) && /^(alfa|beta)$/.test(p[2]) && C.buildModel(p[0], p[1], p[2])) return { sugar: p[0], ring: p[1], anomer: p[2] };
    return null;
  }
  var h0 = parseHash(); if (h0) { S.sugar = h0.sugar; S.ring = h0.ring; S.anomer = h0.anomer; }

  /* ------------------------- Temas ------------------------- */
  var TH = {
    dark: { bg: 0x0f1524, C: '#8d98a9', O: '#ff6b6b', H: '#eef2f7', bond: '#7b879b', haA: '#fbbf24', haR: '#2dd4bf', fill: '#7b97ff', warn: '#f87171',
      ox: '#ff7b7b', amber: '#fbb43c', ax: '#ff9a62', eq: '#7fa6ff', cap: '#98a4c0', halo: 'rgba(12,18,32,.92)' },
    light: { bg: 0xe3eaf5, C: '#6b7686', O: '#e5484d', H: '#d5dbe3', bond: '#9aa4b2', haA: '#f59e0b', haR: '#14b8a6', fill: '#2f5bea', warn: '#dc2626',
      ox: '#d62f35', amber: '#b86e00', ax: '#c2410c', eq: '#1d4ed8', cap: '#56627f', halo: 'rgba(235,240,249,.94)' }
  };
  var theme = TH.dark;

  /* ------------------------- Escena three.js ------------------------- */
  var renderer, scene, camera, world, lcv, lctx, dpr = 1;
  var sphereGeo, cylGeo, mats;
  var atomObjs = [], bondObjs = [], haloA, haloR, fillMesh, diaxObjs = [];
  var baseDist = 16, R_fit = 5, VW = 800, VH = 600;
  var ext = { ymax: 3, ymin: -3 };
  var cur = [];
  var rot = { x: 0.04, y: 0 };
  var stageAnchors = [{ x: 0.04, y: 0 }, { x: 0.34, y: -0.04 }, { x: 0.5, y: 0 }, { x: 0.42, y: -0.5 }];
  var tA, tB, tD, tP, UP, Z, v3;

  function buildScene() {
    var cont = kit.viewport;
    scene = new T3.Scene();
    camera = new T3.PerspectiveCamera(34, 1, 0.1, 200);
    renderer = new T3.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    dpr = renderer.getPixelRatio();
    cont.appendChild(renderer.domElement);
    lcv = document.createElement('canvas'); lcv.className = 'labels-cv'; lcv.setAttribute('aria-hidden', 'true');
    cont.appendChild(lcv); lctx = lcv.getContext('2d');
    scene.add(new T3.AmbientLight(0xffffff, 0.66));
    var key = new T3.DirectionalLight(0xffffff, 0.8); key.position.set(4, 8, 11); scene.add(key);
    var fill = new T3.DirectionalLight(0xffffff, 0.22); fill.position.set(-7, -3, 5); scene.add(fill);
    world = new T3.Group(); scene.add(world);
    sphereGeo = new T3.SphereGeometry(1, 28, 20);
    cylGeo = new T3.CylinderGeometry(1, 1, 1, 12, 1, true);
    mats = {
      C: new T3.MeshStandardMaterial({ roughness: 0.42, metalness: 0.04 }),
      O: new T3.MeshStandardMaterial({ roughness: 0.38, metalness: 0.04 }),
      H: new T3.MeshStandardMaterial({ roughness: 0.5, metalness: 0 }),
      bond: new T3.MeshStandardMaterial({ roughness: 0.6, metalness: 0 }),
      haloA: new T3.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false }),
      haloR: new T3.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false }),
      fill: new T3.MeshBasicMaterial({ transparent: true, opacity: 0.1, side: T3.DoubleSide, depthWrite: false }),
      diax: new T3.MeshBasicMaterial({ transparent: true, opacity: 0.8 })
    };
    tA = new T3.Vector3(); tB = new T3.Vector3(); tD = new T3.Vector3(); tP = new T3.Vector3();
    UP = new T3.Vector3(0, 1, 0); Z = new T3.Vector3(0, 0, 1); v3 = new T3.Vector3();
    bindPointer(cont);
  }
  function applyTheme(name) {
    theme = TH[name] || TH.dark;
    if (!scene) return;
    scene.background = new T3.Color(theme.bg);
    mats.C.color.set(theme.C); mats.O.color.set(theme.O); mats.H.color.set(theme.H); mats.bond.color.set(theme.bond);
    mats.haloA.color.set(theme.haA); mats.haloR.color.set(theme.haR); mats.fill.color.set(theme.fill); mats.diax.color.set(theme.warn);
    lastLeg = '';
  }

  function clearScene() {
    atomObjs.forEach(function (o) { world.remove(o); });
    bondObjs.forEach(function (b) { world.remove(b.m1); if (b.m2) world.remove(b.m2); });
    [haloA, haloR, fillMesh].forEach(function (o) { if (o) { world.remove(o); if (o.geometry && o.geometry !== sphereGeo) o.geometry.dispose(); } });
    diaxObjs.forEach(function (o) { world.remove(o.mesh); });
    atomObjs = []; bondObjs = []; diaxObjs = [];
  }
  function ringAtoms() { var ids = []; for (var k = M.a; k <= M.z; k++) ids.push(M.index['C' + k]); ids.push(M.index['O' + M.z]); return ids; }

  /* ------------------------- Construcción ------------------------- */
  function buildModel() {
    M = C.buildModel(S.sugar, S.ring, S.anomer);
    if (!M) { S.ring = 'furanosa'; M = C.buildModel(S.sugar, S.ring, S.anomer); }
    computeDiax();
  }
  function rebuild() {
    buildModel();
    clearScene();
    var rad = { C: 0.3, O: 0.27, H: 0.17 };
    atomObjs = M.atoms.map(function (at) { var m = new T3.Mesh(sphereGeo, mats[at.el]); m.scale.setScalar(rad[at.el]); world.add(m); return m; });
    bondObjs = M.bonds.map(function (b) {
      var i = M.index[b.a], j = M.index[b.b];
      var m1 = new T3.Mesh(cylGeo, mats.bond); world.add(m1);
      var m2 = null; if (b.order === 2) { m2 = new T3.Mesh(cylGeo, mats.bond); world.add(m2); }
      return { b: b, i: i, j: j, m1: m1, m2: m2, h: M.atoms[i].el === 'H' || M.atoms[j].el === 'H' };
    });
    haloA = new T3.Mesh(sphereGeo, mats.haloA); haloA.scale.setScalar(0.58); world.add(haloA);
    haloR = new T3.Mesh(sphereGeo, mats.haloR); haloR.scale.setScalar(0.58); world.add(haloR);
    var rids = ringAtoms(), g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(new Float32Array((rids.length + 1) * 3), 3));
    var idx = []; for (var k = 0; k < rids.length; k++) idx.push(0, 1 + k, 1 + ((k + 1) % rids.length));
    g.setIndex(idx); fillMesh = new T3.Mesh(g, mats.fill); fillMesh.frustumCulled = false; world.add(fillMesh);
    for (var d = 0; d < 6; d++) { var mesh = new T3.Mesh(cylGeo, mats.diax); mesh.visible = false; world.add(mesh); diaxObjs.push({ mesh: mesh }); }

    var R = 0;
    [M.frames.F, M.frames.H].concat(M.frames.conf).forEach(function (fr) { fr.forEach(function (p) { R = Math.max(R, Math.hypot(p[0], p[1], p[2])); }); });
    R_fit = R + 0.9;
    S.q = S.qt = 0; P.qHand = false; lastKey = '';
    fit();
    syncUI();
  }

  function fit() {
    if (!renderer) return;
    var w = kit.viewport.clientWidth, h = kit.viewport.clientHeight;
    if (w < 2 || h < 2) return;
    VW = w; VH = h;
    renderer.setSize(w, h); dpr = renderer.getPixelRatio();
    lcv.width = Math.round(w * dpr); lcv.height = Math.round(h * dpr); lcv.style.width = w + 'px'; lcv.style.height = h + 'px';
    camera.aspect = w / h;
    camera.setViewOffset(w, h, window.innerWidth < 981 ? 0 : -110, window.innerWidth < 981 ? 40 : 48, w, h);   // desplaza la molécula a la derecha de los paneles HUD
    camera.updateProjectionMatrix();
    placeCamera();
  }
  function placeCamera() {
    var t = Math.tan(camera.fov * Math.PI / 360), usable = Math.max(0.5, (VH - (window.innerWidth < 981 ? 230 : 190)) / VH);
    baseDist = Math.max(R_fit / (t * usable), R_fit / (t * camera.aspect)) * 1.0;
    camera.position.set(0, 0, baseDist / S.zoom); camera.updateMatrixWorld();
  }

  /* ------------------------- Posiciones por etapa ------------------------- */
  function rotZ(p, ang) { var c = Math.cos(ang), s = Math.sin(ang); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function posAt(i, T, q) {
    var fr = M.frames, F = fr.F[i];
    if (T <= 1) return rotZ(F, -Math.PI / 2 * smooth(T));
    var R = rotZ(F, -Math.PI / 2), H = fr.H[i];
    if (T <= 2) return mix(R, H, smooth(T - 1));
    var cf = mix(fr.conf[0][i], fr.conf[1][i], smooth(q));
    return mix(H, cf, smooth(T - 2));
  }
  function cyl(mesh, A, B, r, off) {
    tD.subVectors(B, A); var L = tD.length(); if (L < 1e-5) { mesh.visible = false; return; }
    tD.multiplyScalar(1 / L);
    mesh.position.copy(A).addScaledVector(tD, L / 2);
    if (off) { tP.crossVectors(tD, Z); if (tP.lengthSq() < 1e-4) tP.set(1, 0, 0); tP.normalize(); mesh.position.addScaledVector(tP, off); }
    mesh.quaternion.setFromUnitVectors(UP, tD); mesh.scale.set(r, L, r); mesh.visible = true;
  }
  function anchor(i) { return (i === 3 && M.ring === 'furanosa') ? { x: 0.5, y: -0.05 } : stageAnchors[i]; }
  function confIdx() { return S.q < 0.5 ? 0 : 1; }
  function stageOf(T) { return T < 0.5 ? 0 : T < 1.5 ? 1 : T < 2.5 ? 2 : 3; }

  /* pares 1,3-diaxiales */
  var diaxPairs = [[], []];
  function computeDiax() {
    diaxPairs[0] = []; diaxPairs[1] = [];
    if (M.ring !== 'piranosa') return;
    M.conf.forEach(function (cf, ci) {
      var ax = cf.an.filter(function (s) { return !s.isH && s.axial; });
      for (var x = 0; x < ax.length; x++) for (var y = x + 1; y < ax.length; y++) {
        var dk = (ax[x].carbon - ax[y].carbon + 6) % 6;
        if ((dk === 2 || dk === 4) && ax[x].up === ax[y].up) diaxPairs[ci].push([M.index[ax[x].atomId], M.index[ax[y].atomId]]);
      }
    });
  }
  function updateDiaxial(T) {
    var vis = M.ring === 'piranosa' && kit.layer('d13') ? sstep(2.6, 3, T) : 0, list = diaxPairs[confIdx()] || [];
    diaxObjs.forEach(function (o, k) {
      if (vis < 0.05 || !list[k]) { o.mesh.visible = false; return; }
      cyl(o.mesh, tA.set.apply(tA, cur[list[k][0]]), tB.set.apply(tB, cur[list[k][1]]), 0.028, 0);
      o.mesh.material.opacity = 0.8 * vis;
    });
  }

  /* ------------------------- Cuadro a cuadro ------------------------- */
  function drive(f) {
    var st = f.i, loc = f.local, dt = f.dt;
    var target = f.playing ? (st === 0 ? 0 : st - 1 + sstep(0, 0.55, loc)) : st;
    var rate = f.playing ? 10 : 4.5;
    S.T = reduced ? target : S.T + (target - S.T) * (1 - Math.exp(-dt * rate));
    if (Math.abs(target - S.T) < 0.002) S.T = target;
    if (st === 3 && f.playing && !P.qHand && loc > 0.55) S.qt = 1;
    var d = S.qt - S.q; S.q = (reduced || Math.abs(d) < 0.003) ? S.qt : S.q + d * (1 - Math.exp(-dt * 4));
  }
  function sceneFrame(f) {
    var dt = f.dt, time = f.now, T = S.T, q = S.q;
    if (S.autoView) {
      var i0 = Math.min(2, Math.floor(T)), fr = smooth(T - i0), a = anchor(i0), b = anchor(i0 + 1);
      var tx = a.x + (b.x - a.x) * fr, ty = a.y + (b.y - a.y) * fr, k = reduced ? 1 : 1 - Math.exp(-dt * 6);
      rot.x += (tx - rot.x) * k; rot.y += (ty - rot.y) * k;
    }
    world.rotation.set(rot.x, rot.y, 0); world.updateMatrixWorld(true);
    var Rc = 0; ext.ymax = -1e9; ext.ymin = 1e9;
    var showH = kit.layer('h');
    for (var i = 0; i < M.atoms.length; i++) {
      var p = posAt(i, T, q); cur[i] = p;
      var o = atomObjs[i]; o.position.set(p[0], p[1], p[2]);
      o.visible = M.atoms[i].el !== 'H' || showH;
      Rc = Math.max(Rc, Math.hypot(p[0], p[1], p[2])); ext.ymax = Math.max(ext.ymax, p[1]); ext.ymin = Math.min(ext.ymin, p[1]);
    }
    R_fit += ((Rc + 0.75) - R_fit) * (reduced ? 1 : 1 - Math.exp(-dt * 5));
    placeCamera();
    var r = clamp(T - 1, 0, 1);
    var dbl = 1 - sstep(0.45, 0.7, r), openF = 1 - sstep(0.22, 0.48, r), ringF = sstep(0.55, 0.85, r);
    bondObjs.forEach(function (bo) {
      var A = tA.set.apply(tA, cur[bo.i]), B = tB.set.apply(tB, cur[bo.j]);
      var fq = 1;
      if (bo.b.phase === 'open') fq = openF; else if (bo.b.phase === 'ring') fq = ringF;
      var base = bo.h ? 0.05 : 0.075;
      if (fq < 0.03 || (bo.h && !showH)) { bo.m1.visible = false; if (bo.m2) bo.m2.visible = false; return; }
      if (bo.m2) {
        var off = 0.085 * dbl;
        cyl(bo.m1, A, B, base, -off);
        if (dbl < 0.04) bo.m2.visible = false; else cyl(bo.m2, A, B, base * dbl, off);
      } else cyl(bo.m1, A, B, base * fq, 0);
    });
    var pa = cur[M.index['C' + M.a]], pr = cur[M.index['C' + (M.n - 1)]], hi = kit.layer('hi');
    var pulse = reduced ? 1 : 1 + 0.09 * Math.sin(time * 3);
    haloA.visible = hi; haloA.position.set(pa[0], pa[1], pa[2]); haloA.scale.setScalar(0.58 * pulse);
    haloR.visible = hi; haloR.position.set(pr[0], pr[1], pr[2]); haloR.scale.setScalar(0.58 * pulse);
    var rids = ringAtoms(), pos = fillMesh.geometry.attributes.position, cx = 0, cy = 0, cz = 0;
    rids.forEach(function (j) { cx += cur[j][0]; cy += cur[j][1]; cz += cur[j][2]; });
    pos.setXYZ(0, cx / rids.length, cy / rids.length, cz / rids.length);
    rids.forEach(function (j, k) { pos.setXYZ(1 + k, cur[j][0], cur[j][1], cur[j][2]); }); pos.needsUpdate = true;
    fillMesh.material.opacity = 0.13 * sstep(1.55, 1.95, T);
    fillMesh.visible = fillMesh.material.opacity > 0.003;
    updateDiaxial(T);
    renderer.render(scene, camera);
    drawLabels(T);
    updateState();
  }

  /* ------------------------- Rótulos (canvas 2D: salen en la captura PNG) ------------------------- */
  function toScreen(p) {
    v3.set(p[0], p[1], p[2]).applyMatrix4(world.matrixWorld);
    var d = camera.position.distanceTo(v3);
    v3.project(camera);
    return { x: (v3.x * 0.5 + 0.5) * VW, y: (-v3.y * 0.5 + 0.5) * VH, d: d };
  }
  var screenOf = toScreen;   // project() ya incluye el desplazamiento de vista (setViewOffset)
  function text(parts, x, y, op) {
    var w = 0, k;
    for (k = 0; k < parts.length; k++) { lctx.font = parts[k].f; parts[k].w = lctx.measureText(parts[k].t).width; w += parts[k].w; }
    var cx = x - w / 2;
    lctx.globalAlpha = op; lctx.textBaseline = 'middle'; lctx.lineJoin = 'round';
    for (k = 0; k < parts.length; k++) {
      var pt = parts[k]; lctx.font = pt.f;
      lctx.lineWidth = pt.sw || 4; lctx.strokeStyle = pt.halo === false ? 'rgba(0,0,0,.5)' : theme.halo;
      lctx.strokeText(pt.t, cx, y + (pt.dy || 0)); lctx.fillStyle = pt.c; lctx.fillText(pt.t, cx, y + (pt.dy || 0));
      cx += pt.w;
    }
    lctx.globalAlpha = 1;
  }
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  function drawLabels(T) {
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.clearRect(0, 0, VW, VH);
    var sp = cur.map(function (p) { return screenOf(p); });
    var rids = ringAtoms(), rcx = 0, rcy = 0; rids.forEach(function (i) { rcx += sp[i].x; rcy += sp[i].y; }); rcx /= rids.length; rcy /= rids.length;
    var ringFormed = T >= 1.55, inChair = T > 2.55 && M.ring === 'piranosa', ci = confIdx();
    var an = inChair ? M.conf[ci].an : M.an, showUD = T > 1.8;
    var ppu = VH / (2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360)), rpx = 0.27 * ppu;
    var dmin = baseDist / S.zoom - R_fit, span = 2 * R_fit;
    var depthOp = function (d) { return clamp(1 - 0.5 * (d - dmin) / span, 0.35, 1); };

    if (kit.layer('num')) {
      M.atoms.forEach(function (at, i) {
        if (at.el !== 'C') return;
        var s = sp[i]; text([{ t: String(at.num), f: '600 12px ' + FONT, c: '#fff', halo: false, sw: 3 }], s.x, s.y, depthOp(s.d));
      });
    }
    M.atoms.forEach(function (at, i) {
      if (at.el !== 'O') return;
      var s = sp[i], id = at.id, txt = 'OH', anom = false, pIdx, suf = null;
      var sub = null;
      if (id === 'Oc') {
        pIdx = M.index['C' + M.c];
        if (ringFormed) anom = true; else txt = 'O';
        sub = an.find(function (x) { return x.atomId === 'Oc'; });
        if (!(ringFormed && showUD && sub)) sub = null;
      } else if (at.num === M.z) {
        pIdx = M.index['C' + M.z]; txt = ringFormed ? 'O' : 'OH';
      } else {
        pIdx = M.index['C' + at.num];
        sub = an.find(function (x) { return x.atomId === id; });
        if (!(showUD && sub)) sub = null;
      }
      var parts = [{ t: txt, f: '600 13px ' + FONT, c: anom ? theme.amber : theme.ox }];
      if (sub) {
        if (inChair) parts.push({ t: sub.axial ? 'ax' : 'ec', f: '700 9px ' + FONT, c: sub.axial ? theme.ax : theme.eq, dy: 3 });
        else parts.push({ t: sub.up ? '↑' : '↓', f: '600 11px ' + FONT, c: theme.ox });
      }
      var ox, oy;
      if (at.num === M.z && ringFormed) { ox = s.x - rcx; oy = s.y - rcy; } else { var ps = sp[pIdx]; ox = s.x - ps.x; oy = s.y - ps.y; }
      var l = Math.hypot(ox, oy) || 1;
      text(parts, s.x + ox / l * (rpx + 15), s.y + oy / l * (rpx + 9), depthOp(s.d));
    });
    /* derecha / izquierda → abajo / arriba */
    var opF = 1 - sstep(1, 1.3, T);
    if (opF > 0.02) {
      [true, false].forEach(function (right) {
        var p = rotZ([right ? 2.9 : -2.9, 0, 0.9], -Math.PI / 2 * smooth(Math.min(T, 1)));
        var tx = right ? (T < 0.12 ? 'derecha' : 'derecha → abajo') : (T < 0.12 ? 'izquierda' : 'izquierda → arriba');
        var s = screenOf(p);
        text([{ t: tx.toUpperCase(), f: '650 11px ' + FONT, c: theme.cap }], s.x, s.y + (T > 0.12 ? (right ? 12 : -12) : 0), opF * 0.9);
      });
    }
    var opUD = sstep(1.5, 1.9, T) * (1 - sstep(2.4, 2.8, T)) * 0.8;
    if (opUD > 0.02) {
      [true, false].forEach(function (up) {
        var s = screenOf([0, up ? ext.ymax + 0.85 : ext.ymin - 0.85, 0]);
        text([{ t: up ? 'ARRIBA' : 'ABAJO', f: '650 11px ' + FONT, c: theme.cap }], s.x, s.y, opUD);
      });
    }
  }

  /* ------------------------- Texto de la lección ------------------------- */
  var STAGES = [0, 1, 2, 3].map(function () { return { name: '', short: '', title: '', text: '', dur: 5 }; });
  STAGES[0].dur = 4; STAGES[1].dur = 6; STAGES[2].dur = 7; STAGES[3].dur = 7;

  function grupoEx(m) { return m.n - m.z === 1 ? 'CH₂OH' : 'CH(OH)CH₂OH'; }
  function fischerTable(m, withHaworth) {
    var t = '<table class="cl-t"><tr><th>Carbono</th><th>OH en Fischer</th>' + (withHaworth ? '<th>Tras el giro</th>' : '') + '</tr>';
    for (var i = m.c + 1; i <= m.n - 1; i++) t += '<tr><td>C' + i + '</td><td>' + SIDE[m.fis[i]] + '</td>' + (withHaworth ? '<td>' + UD[m.fis[i]] + '</td>' : '') + '</tr>';
    return t + '</table>';
  }
  function haworthTable(m) {
    var t = '<table class="cl-t"><tr><th>Carbono</th><th>Fischer</th><th>Haworth</th></tr>';
    t += '<tr class="hl"><td>C' + m.a + ' (anomérico)</td><td>C=O</td><td>α: OH ↓ · β: OH ↑</td></tr>';
    for (var i = m.a + 1; i <= m.n - 1; i++) {
      if (i < m.z) t += '<tr><td>C' + i + '</td><td>OH ' + SIDE[m.fis[i]] + '</td><td>OH ' + UD[m.fis[i]] + '</td></tr>';
      else if (i === m.z) t += '<tr><td>C' + i + '</td><td>OH ' + SIDE[m.fis[i]] + '</td><td>O en el anillo; ' + grupoEx(m) + ' ' + (m.fis[i] === 'R' ? 'arriba' : 'abajo') + '</td></tr>';
      else t += '<tr><td>C' + i + '</td><td>OH ' + SIDE[m.fis[i]] + '</td><td>cadena lateral</td></tr>';
    }
    if (m.z === m.n) t += '<tr><td>C' + m.n + '</td><td>CH₂OH</td><td>CH₂ del anillo (su O cierra el anillo)</td></tr>';
    return t + '</table>';
  }
  function chairTable(m, cn) {
    var t = '<table class="cl-t"><tr><th>Carbono</th><th>Grupo</th><th>Cara</th><th>Posición</th></tr>';
    cn.an.filter(function (s) { return !s.isH; }).forEach(function (s) {
      t += '<tr' + (s.carbon === m.a ? ' class="hl"' : '') + '><td>C' + s.carbon + '</td><td>' + s.grp + '</td><td>' + (s.up ? 'arriba' : 'abajo') + '</td><td class="' + (s.axial ? 'ax' : 'eq') + '">' + (s.axial ? 'axial' : 'ecuatorial') + '</td></tr>';
    });
    return t + '</table>';
  }
  function stageTitle(st) {
    var pyr = M.ring === 'piranosa';
    return ['Proyección de Fischer', 'Giro de 90° en sentido horario', 'Ciclación: proyección de Haworth', pyr ? 'Conformación silla' : 'Conformación de sobre (envelope)'][st];
  }
  function stageBody(st, ci) {
    var m = M, pyr = m.ring === 'piranosa', alfa = m.anomer === 'alfa';
    var carbonilo = m.aldose ? 'C1 (aldehído)' : 'C2 (cetona)';
    var cn = m.conf[ci], h = '';
    if (st === 0) {
      var der = [], izq = [];
      for (var i = m.c + 1; i <= m.n - 1; i++) (m.fis[i] === 'R' ? der : izq).push('C' + i);
      h += '<p>La cadena se dibuja vertical, con el grupo carbonilo ' + carbonilo + ' arriba. Los enlaces horizontales salen <b>hacia ti</b> y los verticales se alejan.</p>';
      h += '<div class="cl-kv"><div class="r"><b>Serie D</b><span>El C' + (m.n - 1) + ' (estereocentro más alejado del carbonilo, <b>carbono de referencia</b>) tiene el OH a la derecha.</span></div>' +
        '<div><b>OH a la derecha</b><span>' + (der.join(', ') || '—') + '</span></div><div><b>OH a la izquierda</b><span>' + (izq.join(', ') || '—') + '</span></div></div>';
      h += fischerTable(m, false);
    } else if (st === 1) {
      h += '<p>Al girar la cadena 90° en sentido horario, <b>lo que estaba a la derecha queda abajo y lo que estaba a la izquierda queda arriba</b>. La cadena es flexible: al curvarse hacia atrás, el O del C' + m.z + ' puede acercarse al carbono carbonílico (C' + m.a + ').</p>';
      h += fischerTable(m, true);
    } else if (st === 2) {
      var tipoH = m.aldose ? 'hemiacetal' : 'hemicetal';
      h += '<p>El OH del C' + m.z + ' ataca al carbono carbonílico (adición nucleofílica intramolecular) y cierra un anillo de ' + (pyr ? '6' : '5') + ' miembros (' + (pyr ? 'piranosa' : 'furanosa') + '). El producto es un <b>' + tipoH + '</b>; el H del OH migra al O carbonílico, que pasa a ser el <b>OH anomérico</b>.</p>';
      if (m.z < m.n) {
        var arriba = m.fis[m.z] === 'R';
        h += '<p>Para que ese O quede en el plano del anillo, el C' + m.z + ' gira sobre el enlace C' + (m.z - 1) + '–C' + m.z + ': el grupo ' + grupoEx(m) + ' queda hacia <b>' + (arriba ? 'arriba' : 'abajo') + '</b> (el OH del C' + m.z + ' está a la ' + (arriba ? 'derecha' : 'izquierda') + ' en Fischer' + (arriba ? ', como en toda la serie D en el carbono de referencia' : '; es el caso excepcional de la galactosa en C4') + ').</p>';
      } else {
        h += '<p>El C' + m.z + ' es el CH₂ terminal: forma parte del anillo y no hay grupo exocíclico en ese carbono.</p>';
      }
      h += '<div class="cl-kv"><div class="a"><b>C anomérico: C' + m.a + '</b><span>Era el carbono carbonílico (sp²) y ahora es un nuevo estereocentro. Hay dos anómeros: α y β.</span></div>' +
        '<div><b>Estás viendo ' + (alfa ? 'α' : 'β') + '</b><span>OH anomérico hacia <b>' + (alfa ? 'abajo' : 'arriba') + '</b>; ' + (m.aldose ? 'el H' : 'el CH₂OH (C1)') + ' hacia ' + (alfa ? 'arriba' : 'abajo') + '.</span></div></div>';
      h += '<div class="cl-box amber"><b>Regla α / β (serie D).</b> En α, el OH anomérico está del mismo lado que el O del carbono de referencia en la proyección de Fischer (derecha); en Haworth queda hacia <b>abajo</b>. En β es el opuesto: hacia <b>arriba</b>.</div>';
      h += haworthTable(m);
    } else if (pyr) {
      var ax = cn.an.filter(function (s) { return !s.isH && s.axial; }), eq = cn.an.filter(function (s) { return !s.isH && !s.axial; }), other = m.conf[1 - ci];
      var best = cn.axHeavy < other.axHeavy;
      h += '<p>Silla <b>' + cn.name + '</b>' + (best ? ' (la más estable: menos sustituyentes axiales).' : (cn.axHeavy === other.axHeavy ? ' (las dos sillas tienen igual número de axiales).' : ' (la menos favorable).')) + ' Un sustituyente que en Haworth está <i>arriba</i> es axial si su carbono está desplazado hacia arriba en esa silla, y ecuatorial si no.</p>';
      h += '<div class="cl-sum"><span>Axiales (≠H): <b>' + ax.length + '</b></span><span>Ecuatoriales (≠H): <b>' + eq.length + '</b></span><span>Silla alternativa ' + other.name + ': <b>' + other.axHeavy + '</b> axiales</span></div>';
      h += chairTable(m, cn);
      if (ax.length === 0) h += '<div class="cl-box teal">Todos los sustituyentes voluminosos son ecuatoriales: es la distribución más estable' + (m.sugarId === 'glucosa' ? ' y explica la abundancia de la D-glucosa (β-D-glucopiranosa).' : '.') + '</div>';
      else h += '<div class="cl-box">Los sustituyentes axiales (' + ax.map(function (s) { return s.grp + '-' + s.carbon; }).join(', ') + ') sufren repulsión 1,3-diaxial con los H axiales del mismo lado' + (kit && kit.layer && kit.layer('d13') && diaxPairs[ci].length ? '; entre grupos voluminosos se marca en rojo.' : '.') + '</div>';
      var anAx = cn.an.find(function (s) { return s.atomId === 'Oc' && s.axial; });
      if (anAx) h += '<div class="cl-box amber"><b>Efecto anomérico.</b> El OH anomérico axial se estabiliza por hiperconjugación (par libre del O del anillo → σ* C–O), lo que compensa parte de la repulsión estérica; por eso el anómero α no es tan minoritario como cabría esperar solo por impedimento estérico.</div>';
      var epi = { manosa: 'La D-manosa es el epímero de la glucosa en C2: su OH-2 es axial en ⁴C₁.', galactosa: 'La D-galactosa es el epímero de la glucosa en C4: su OH-4 es axial en ⁴C₁.' }[m.sugarId];
      if (epi) h += '<div class="cl-box">' + epi + '</div>';
      if (m.sugarId === 'glucosa') h += '<div class="cl-box"><b>Mutarrotación.</b> En agua la D-glucosa pasa por la cadena abierta (cantidad ínfima) y se equilibra en ≈36 % α-piranosa y ≈64 % β-piranosa. [α]<sub>D</sub>: +112° (α pura), +19° (β pura), +52,7° (equilibrio).</div>';
    } else {
      h += '<p>Los anillos de 5 miembros no son planos: adoptan conformaciones de <b>sobre</b>, con cuatro átomos casi coplanares y uno (<b>' + cn.name.replace('-endo', '') + '</b>) fuera del plano, desplazado hacia arriba (<i>endo</i>, la cara hacia la que apunta el CH₂OH en las D-aldosas). Los sustituyentes pasan a ser pseudo-axiales o pseudo-ecuatoriales y el anillo se interconvierte con facilidad entre sobres (<i>pseudorrotación</i>).</p>';
      h += '<div class="cl-box">Pulsa «Cambiar el pliegue» (panel Lab) para ver el sobre alternativo (' + m.conf[1 - ci].name + ').</div>';
      h += haworthTable(m);
    }
    return h;
  }
  function refreshStages() {
    var ci = confIdx(), pyr = M.ring === 'piranosa';
    var shorts = ['Fischer', 'Giro 90°', 'Haworth', pyr ? 'Silla' : 'Sobre'];
    var names = ['Fischer', 'Giro de 90°', 'Haworth', pyr ? 'Silla' : 'Sobre (envelope)'];
    STAGES.forEach(function (s, i) { s.name = names[i]; s.short = shorts[i]; s.title = stageTitle(i); s.text = stageBody(i, ci); });
    if (!kit || !kit.state) return;
    document.querySelectorAll('.step span').forEach(function (b, k) { if (STAGES[k]) b.textContent = STAGES[k].short; });
    var s = STAGES[kit.state.stage];
    var a = document.getElementById('phName'), b = document.getElementById('pcTitle'), c = document.getElementById('pcText');
    if (a) a.textContent = s.name; if (b) b.innerHTML = s.title; if (c) c.innerHTML = s.text;
  }

  /* ------------------------- HUD, leyenda, medidas ------------------------- */
  var lastKey = '', lastLeg = '';
  function updateState() {
    var st = stageOf(S.T), ci = confIdx(), key = [S.sugar, S.ring, S.anomer, st, ci, kit.layer('d13') ? 1 : 0].join('|');
    if (key !== lastKey) { lastKey = key; refreshStages(); kit.refresh(); }
    var T = S.T, m = M, rows = [];
    if (kit.layer('hi')) {
      rows.push({ color: theme.haA, label: T >= 1.55 ? 'C anomérico (C' + m.a + ')' : 'C carbonílico (C' + m.a + ')', text: T >= 1.55 ? '' : '· futuro C anomérico' });
      rows.push({ color: theme.haR, label: 'C de referencia (C' + (m.n - 1) + ')', text: T < 0.5 ? '· OH a la derecha → serie D' : '' });
    }
    if (T > 2.55 && m.ring === 'piranosa') { rows.push({ color: theme.ax, label: 'ax', text: 'axial' }); rows.push({ color: theme.eq, label: 'ec', text: 'ecuatorial' }); }
    var sig = JSON.stringify(rows) + theme.haA;
    if (sig !== lastLeg) { lastLeg = sig; kit.setLegend(rows); }
  }
  function eqHud() {
    if (!kit || !kit.setEq) return;
    var m = M, kind = (m.aldose ? 'aldo' : 'ceto') + (m.n === 5 ? 'pentosa' : 'hexosa'), fam = m.n === 5 ? 'C₅H₁₀O₅' : 'C₆H₁₂O₆', pyr = m.ring === 'piranosa';
    kit.setEq({
      chip: kind, name: C.nombre(m),
      body: '<div class="eqline"><small>Azúcar de partida</small>' + m.sugar.nombre + ' · ' + fam + '</div>' +
        '<div class="eqline"><small>Carbono anomérico</small>C' + m.a + ' (' + (m.aldose ? 'aldehído → hemiacetal' : 'cetona → hemicetal') + ')</div>' +
        '<small>Forma ' + (pyr ? 'piranosa (anillo de 6)' : 'furanosa (anillo de 5)') + ' · ' + (m.anomer === 'alfa' ? 'α: OH anomérico abajo' : 'β: OH anomérico arriba') + '</small>'
    });
  }
  function measures() {
    if (!M) return [];
    var m = M, st = stageOf(S.T), ci = confIdx(), cn = m.conf[ci], pyr = m.ring === 'piranosa';
    var rows = [['Azúcar', m.sugar.nombre + ' (' + SUG_META[S.sugar] + ')'], ['Carbono anomérico', 'C' + m.a], ['Carbono de referencia (serie D)', 'C' + (m.n - 1)],
      ['Anillo', pyr ? 'piranosa · 6 miembros' : 'furanosa · 5 miembros'], ['Anómero', m.anomer === 'alfa' ? 'α · OH anomérico abajo' : 'β · OH anomérico arriba'],
      ['Grupo exocíclico', m.z < m.n ? grupoEx(m) + (m.fis[m.z] === 'R' ? ' (arriba)' : ' (abajo)') : 'ninguno (el C' + m.n + ' es del anillo)']];
    if (st === 3) {
      rows.push([pyr ? 'Conformación' : 'Sobre', cn.name]);
      if (pyr) rows.push(['Axiales ≠ H', cn.axHeavy + ' (otra silla: ' + m.conf[1 - ci].axHeavy + ')']);
    }
    return rows;
  }

  /* ------------------------- Controles ------------------------- */
  function canPyr() { return !!C.buildModel(S.sugar, 'piranosa', 'alfa'); }
  function syncUI() {
    eqHud();
    if (ui.sugars) ui.sugars.set(S.sugar);
    if (ui.ring) ui.ring.set(S.ring);
    if (ui.an) ui.an.set(S.anomer);
    if (ui.note) ui.note.textContent = canPyr() ? '' : 'La D-ribulosa es una cetopentosa: para cerrar un anillo de 6 miembros haría falta un C6, así que solo forma furanosa.';
    if (ui.flip) ui.flip.textContent = S.ring === 'piranosa' ? '⇄ Invertir silla' : '⇄ Cambiar el pliegue';
    refreshStages();
    if (kit && kit.refresh) kit.refresh();
    try { history.replaceState(null, '', '#' + S.sugar + '/' + S.ring + '/' + S.anomer); } catch (e) { /* sin historial */ }
  }
  function flip() {
    if (kit.state.stage !== 3) kit.seekStage(3, false);
    S.qt = S.qt > 0.5 ? 0 : 1; P.qHand = true; lastKey = '';
  }
  function buildLab(el) {
    var c1 = kit.ui.card('1 · Azúcar (serie D)');
    ui.sugars = kit.ui.options({ cols: 2, value: S.sugar, options: Object.keys(C.SUGARS).map(function (k) { return { v: k, label: C.SUGARS[k].nombre, sub: SUG_META[k] }; }),
      onChange: function (v) { S.sugar = v; if (!C.buildModel(S.sugar, S.ring, S.anomer)) S.ring = 'furanosa'; rebuild(); } });
    c1.appendChild(ui.sugars); el.appendChild(c1);

    var c2 = kit.ui.card('2 · Anillo y anómero');
    var f1 = document.createElement('div'); f1.className = 'fld'; f1.innerHTML = '<span class="lbl">Forma cíclica</span>';
    ui.ring = kit.ui.seg([{ v: 'piranosa', label: 'Piranosa (6)' }, { v: 'furanosa', label: 'Furanosa (5)' }], S.ring, function (v) {
      if (v === 'piranosa' && !canPyr()) { kit.toast('La D-ribulosa solo forma furanosa'); ui.ring.set(S.ring); return; }
      S.ring = v; rebuild();
    });
    f1.appendChild(ui.ring); c2.appendChild(f1);
    var f2 = document.createElement('div'); f2.className = 'fld'; f2.innerHTML = '<span class="lbl">Anómero (serie D)</span>';
    ui.an = kit.ui.seg([{ v: 'alfa', label: 'α · OH abajo' }, { v: 'beta', label: 'β · OH arriba' }], S.anomer, function (v) { S.anomer = v; rebuild(); });
    f2.appendChild(ui.an); c2.appendChild(f2);
    ui.note = document.createElement('p'); ui.note.className = 'muted small'; c2.appendChild(ui.note);
    el.appendChild(c2);

    var c3 = kit.ui.card('3 · Conformación y cámara');
    var row = document.createElement('div'); row.className = 'row';
    ui.flip = document.createElement('button'); ui.flip.className = 'btn primary'; ui.flip.addEventListener('click', flip);
    var rv = document.createElement('button'); rv.className = 'btn'; rv.textContent = '↺ Vista sugerida';
    rv.addEventListener('click', function () { S.autoView = true; S.zoom = 1; kit.selectView('auto'); });
    row.appendChild(ui.flip); row.appendChild(rv); c3.appendChild(row);
    c3.insertAdjacentHTML('beforeend', '<p class="muted small">Arrastra para girar, rueda o pellizco para acercar, doble clic para restablecer. Las capas (teclas 1–4) muestran u ocultan H, numeración, resaltados y repulsiones 1,3-diaxiales.</p>');
    el.appendChild(c3);
    syncUI();
  }
  function buildQuiz(el) {
    var c = kit.ui.card('Desafío');
    kit.ui.quiz(c, {
      intro: 'Diez preguntas sobre Fischer, Haworth, carbono anomérico y conformaciones.',
      items: [
        { q: '¿Cuál es el carbono anomérico de una aldohexosa en su forma cíclica?', options: ['C1', 'C2', 'C5', 'C6'], answer: 0, why: 'Es el antiguo carbono del grupo aldehído (C1); al ciclar se convierte en un nuevo estereocentro.' },
        { q: '¿Cuál es el carbono anomérico de la D-fructosa cíclica?', options: ['C1', 'C2', 'C5', 'C6'], answer: 1, why: 'En las cetosas el carbonilo está en C2; ese es el carbono anomérico.' },
        { q: 'En Fischer, un OH a la derecha de un carbono del anillo queda en Haworth…', options: ['hacia abajo', 'hacia arriba', 'en el plano del anillo', 'depende de α o β'], answer: 0, why: 'Con el anillo en la orientación habitual, derecha en Fischer equivale a abajo en Haworth; izquierda, a arriba.' },
        { q: 'En un azúcar de la serie D, ¿dónde queda el OH anomérico del anómero α en Haworth?', options: ['Hacia abajo', 'Hacia arriba', 'Ecuatorial siempre', 'Sin OH'], answer: 0, why: 'α-D: OH anomérico abajo (del mismo lado que el O del carbono de referencia en Fischer); β-D: arriba.' },
        { q: '¿Por qué la D-ribulosa solo forma furanosa?', options: ['Es una cetopentosa: un anillo de 6 requeriría un C6', 'Porque es una aldosa', 'Porque no tiene OH libres', 'Porque su carbonilo es C1'], answer: 0, why: 'Para cerrar un anillo de 6 miembros el O debería estar en un sexto carbono, que la ribulosa (C₅) no tiene.' },
        { q: 'En una D-aldohexopiranosa, el grupo CH₂OH (C6) queda en Haworth…', options: ['hacia arriba', 'hacia abajo', 'en el plano', 'depende del anómero'], answer: 0, why: 'El OH del C5 está a la derecha en Fischer (serie D); al ciclar, el C6 queda hacia arriba.' },
        { q: '¿Qué ocurre con todos los sustituyentes ≠ H de la β-D-glucopiranosa en la silla ⁴C₁?', options: ['Todos son ecuatoriales', 'Todos son axiales', 'Solo el OH anomérico es axial', 'Alternan axial/ecuatorial'], answer: 0, why: 'Por eso es tan estable y abundante: no hay repulsiones 1,3-diaxiales entre grupos voluminosos.' },
        { q: 'La D-manosa difiere de la D-glucosa en C2. En ⁴C₁, su OH-2 es…', options: ['axial', 'ecuatorial', 'el OH anomérico', 'inexistente'], answer: 0, why: 'La epimerización en C2 invierte la orientación de ese OH, que pasa de ecuatorial a axial.' },
        { q: '¿Qué conformación adoptan típicamente los anillos furanosa?', options: ['Sobre (envelope)', 'Silla perfecta', 'Plana rígida', 'Bote rígido'], answer: 0, why: 'Cuatro átomos casi coplanares y uno fuera del plano; el anillo pseudorrota fácilmente entre sobres.' },
        { q: '¿Qué es la mutarrotación?', options: ['Interconversión de anómeros α ⇄ β en disolución a través de la forma abierta', 'La rotación de 90° de la proyección de Fischer', 'La inversión de una silla en otra', 'La oxidación del C anomérico'], answer: 0, why: 'La cadena abierta (muy minoritaria) permite que el anillo se cierre por una cara o por la otra; cambia la rotación óptica hasta el equilibrio.' }
      ]
    });
    el.appendChild(c);
  }

  /* ------------------------- Cámara con ratón y tacto ------------------------- */
  function bindPointer(view) {
    var ptrs = new Map(), pinch0 = 0, zoom0 = 1;
    view.addEventListener('pointerdown', function (e) {
      view.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { var v = Array.from(ptrs.values()); pinch0 = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); zoom0 = S.zoom; }
    });
    view.addEventListener('pointermove', function (e) {
      var p = ptrs.get(e.pointerId); if (!p) return;
      if (ptrs.size === 1) { S.autoView = false; rot.y += (e.clientX - p.x) * 0.008; rot.x = clamp(rot.x + (e.clientY - p.y) * 0.008, -1.5, 1.5); }
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2) { var v = Array.from(ptrs.values()); S.zoom = clamp(zoom0 * Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) / (pinch0 || 1), 0.6, 3); }
    });
    var end = function (e) { ptrs.delete(e.pointerId); };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    view.addEventListener('wheel', function (e) { e.preventDefault(); S.zoom = clamp(S.zoom * Math.exp(-e.deltaY * 0.0012), 0.6, 3); }, { passive: false });
    view.addEventListener('dblclick', function () { S.autoView = true; S.zoom = 1; kit.selectView('auto'); });
  }
  var VIEWS = { auto: null, frontal: { x: 0, y: 0 }, lado: { x: 0, y: Math.PI / 2 }, superior: { x: 1.35, y: 0 } };

  window.addEventListener('hashchange', function () {
    var h = parseHash();
    if (h && (h.sugar !== S.sugar || h.ring !== S.ring || h.anomer !== S.anomer)) { S.sugar = h.sugar; S.ring = h.ring; S.anomer = h.anomer; rebuild(); }
  });

  /* ------------------------- Arranque ------------------------- */
  function init() {
    buildModel(); refreshStages();
    kit = SimKit.create({
      key: 'carbohidratos-fischer-haworth',
      title: 'Carbohidratos: Fischer → Haworth → silla',
      subtitle: 'Simulador 3D · química orgánica',
      accent: { dark: '#8fb0ff', light: '#2f5bea' },
      viewLabel: 'Visor 3D de la molécula del azúcar',
      stages: STAGES,
      mainTabLabel: 'Guía',
      tabs: [
        { id: 'lab', label: 'Lab', build: function (el, k) { kit = k; buildLab(el); } },
        { id: 'desafio', label: 'Desafío', build: function (el, k) { kit = k; buildQuiz(el); } }
      ],
      measuresTitle: 'Medidas en vivo',
      measures: measures,
      ideas: [
        'La proyección de Fischer fija la estereoquímica; Haworth y la silla se deducen de ella: <b>derecha en Fischer → abajo en Haworth</b>, izquierda → arriba.',
        'El <b>carbono anomérico</b> es el antiguo carbonilo (C1 en aldosas, C2 en cetosas). En la serie D: <b>α = OH anomérico abajo</b>, <b>β = arriba</b>.',
        'Piranosa = anillo de 6; furanosa = anillo de 5. Una cetopentosa como la D-ribulosa solo puede formar furanosa.',
        'En la silla, un sustituyente «arriba» en Haworth es axial si su carbono está desplazado hacia arriba. En la β-D-glucopiranosa todos son ecuatoriales.',
        'Los anillos furanosa no son planos: adoptan conformaciones de sobre (envelope) que se interconvierten por pseudorrotación.'
      ],
      layers: [
        { id: 'h', label: 'Hidrógenos', icon: 'H' },
        { id: 'num', label: 'Numeración de C', icon: '1' },
        { id: 'hi', label: 'Resaltar C anomérico y de referencia', icon: '◎' },
        { id: 'd13', label: 'Repulsión 1,3-diaxial', icon: '⇅' }
      ],
      onLayer: function () { lastKey = ''; },
      views: [{ id: 'auto', label: 'Sugerida' }, { id: 'frontal', label: 'Frontal' }, { id: 'lado', label: 'Lateral' }, { id: 'superior', label: 'Superior' }],
      onView: function (id) {
        var v = VIEWS[id];
        if (!v) { S.autoView = true; return; }
        S.autoView = false; rot.x = v.x; rot.y = v.y;
      },
      onTheme: function (th) { applyTheme(th); },
      onStage: function (i) { if (i !== 3) { S.qt = 0; P.qHand = false; } },
      onResize: fit,
      render: function () { if (renderer) renderer.render(scene, camera); },
      onFrame: function (f) { if (!renderer) return; drive(f); sceneFrame(f); },
      init: function (k) {
        kit = k;
        buildScene(); applyTheme(k.state.theme); rebuild();
        window.__carbo = { S: S, kit: k, rebuild: rebuild, get model() { return M; }, rot: rot, get T() { return S.T; } };
      },
      help: {
        intro: 'Sigue la lección con el reproductor inferior o salta de etapa en «Guía». En el panel <b>Lab</b> eliges el azúcar, la forma cíclica (piranosa o furanosa) y el anómero (α o β). Gira el modelo arrastrando.',
        items: [
          ['Etapas', 'Fischer → giro de 90° → ciclación a Haworth → silla (piranosas) o sobre (furanosas).'],
          ['Capas', 'hidrógenos, numeración, resaltado del C anomérico y del C de referencia, y repulsiones 1,3-diaxiales (teclas 1–4).'],
          ['Vistas', 'la vista sugerida acompaña a cada etapa; también hay vistas frontal, lateral y superior (tecla V).'],
          ['Lab', 'seis azúcares de la serie D (D-ribosa, D-glucosa, D-manosa, D-galactosa, D-fructosa, D-ribulosa), α/β y botón para invertir la silla o cambiar el pliegue del sobre.'],
          ['Enlace directo', 'la dirección guarda tu elección: …/#glucosa/piranosa/beta']
        ]
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
