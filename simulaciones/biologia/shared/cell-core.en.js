/* CellKit — núcleo común de los simuladores de célula 3D (Laboratorio MACEDONIA · UMCE)
   Geometrías procedurales de orgánulos + visor Three.js con selección, etiquetas, corte y atenuación por foco. */
(function (g) {
  "use strict";
  var T = g.THREE, K = {};
  g.CellKit = K;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  K.clamp = clamp;
  K.rng = function (seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  function spow(x, e) { return Math.sign(x) * Math.pow(Math.abs(x), e); }
  var V3 = function (x, y, z) { return new T.Vector3(x, y, z); };
  K.V3 = V3;

  /* ------------------------------------------------------------------ Grupos funcionales */
  K.GROUPS = {
    lim: { n: "Boundary and internal medium", c: '#4fb3ff' },
    inf: { n: "Information", c: '#b07cff' },
    sin: { n: "Synthesis and transport", c: '#ffb340' },
    ene: { n: "Energy", c: '#ff6b57' },
    dig: { n: "Digestion, storage and detoxification", c: '#4ad08a' },
    sop: { n: "Support and movement", c: '#ff8ad0' }
  };

  /* ------------------------------------------------------------------ Forma de la célula: |x/a|^m+|y/b|^m+|z/c|^m = 1 */
  function Shape(a, b, c, m) { this.a = a; this.b = b; this.c = c; this.m = m; }
  Shape.prototype.f = function (p) { var m = this.m; return Math.pow(Math.abs(p.x / this.a), m) + Math.pow(Math.abs(p.y / this.b), m) + Math.pow(Math.abs(p.z / this.c), m); };
  Shape.prototype.inside = function (p, k) { return this.f(p) < Math.pow(k == null ? 1 : k, this.m); };
  Shape.prototype.surface = function (dir, k) { var d = dir.clone().normalize(), t = Math.pow(this.f(d), -1 / this.m); return d.multiplyScalar(t * (k == null ? 1 : k)); };
  Shape.prototype.normal = function (p) {
    var m = this.m - 1;
    return V3(spow(p.x / this.a, m) / this.a, spow(p.y / this.b, m) / this.b, spow(p.z / this.c, m) / this.c).normalize();
  };
  Shape.prototype.scaled = function (k, off) { var s = new Shape(this.a * k, this.b * k, this.c * k, this.m); s.off = off; return s; };
  Shape.prototype.geometry = function (k, ws, hs) {
    k = k == null ? 1 : k; ws = ws || 72; hs = hs || 44;
    var e = 2 / this.m, pos = [], idx = [], i, j;
    for (i = 0; i <= hs; i++) {
      var u = -Math.PI / 2 + Math.PI * i / hs, cu = spow(Math.cos(u), e), su = spow(Math.sin(u), e);
      for (j = 0; j <= ws; j++) {
        var v = -Math.PI + 2 * Math.PI * j / ws;
        pos.push(this.a * k * cu * spow(Math.cos(v), e), this.b * k * su, this.c * k * cu * spow(Math.sin(v), e));
      }
    }
    for (i = 0; i < hs; i++) for (j = 0; j < ws; j++) { var a = i * (ws + 1) + j, b = a + ws + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  K.Shape = Shape;

  /* ------------------------------------------------------------------ Colocación sin solapes */
  function Placer(rng) { this.s = []; this.rng = rng; }
  Placer.prototype.add = function (c, r) { this.s.push({ c: c.clone(), r: r }); };
  Placer.prototype.free = function (p, r, pad) {
    pad = pad == null ? 0.12 : pad;
    for (var i = 0; i < this.s.length; i++) if (p.distanceTo(this.s[i].c) < r + this.s[i].r + pad) return false;
    return true;
  };
  Placer.prototype.find = function (shape, r, pred, tries) {
    tries = tries || 900;
    for (var t = 0; t < tries; t++) {
      var p = V3((this.rng() * 2 - 1) * shape.a, (this.rng() * 2 - 1) * shape.b, (this.rng() * 2 - 1) * shape.c);
      var kk = 1 - (r + 0.22) / Math.min(shape.a, shape.b, shape.c);
      if (!shape.inside(p, kk)) continue;
      if (pred && !pred(p)) continue;
      if (!this.free(p, r)) continue;
      this.add(p, r); return p;
    }
    return null;
  };
  K.Placer = Placer;

  /* ------------------------------------------------------------------ Materiales y primitivas */
  var _dot = null;
  function dotTex() {
    if (_dot) return _dot;
    var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d');
    var gr = x.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, '#fff'); gr.addColorStop(.6, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32); _dot = new T.CanvasTexture(c); return _dot;
  }
  function M(color, o) {
    o = o || {};
    var m = new T.MeshStandardMaterial({ color: color, roughness: o.r == null ? 0.5 : o.r, metalness: o.m == null ? 0.05 : o.m, side: o.side || T.FrontSide });
    if (o.e) { m.emissive = new T.Color(o.e); m.emissiveIntensity = o.ei == null ? 0.3 : o.ei; }
    if (o.o != null && o.o < 1) { m.transparent = true; m.opacity = o.o; m.depthWrite = false; }
    return m;
  }
  K.M = M;
  var SG = new T.SphereGeometry(1, 24, 16), SGL = new T.SphereGeometry(1, 40, 28), CG = new T.CylinderGeometry(1, 1, 1, 14, 1), TG = new T.TorusGeometry(1, 0.28, 8, 20);
  function sph(r, mat, seg) { var m = new T.Mesh(seg ? SGL : SG, mat); m.scale.setScalar(r); return m; }
  K.sphere = sph;
  function ell(sx, sy, sz, mat, seg) { var m = new T.Mesh(seg ? SGL : SG, mat); m.scale.set(sx, sy, sz); return m; }
  K.ellipsoid = ell;
  function cylBetween(a, b, r, mat) {
    var d = b.clone().sub(a), L = d.length(), m = new T.Mesh(CG, mat);
    m.scale.set(r, L, r); m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m;
  }
  K.cylBetween = cylBetween;
  function tube(pts, r, mat, closed) {
    var curve = new T.CatmullRomCurve3(pts, !!closed, 'catmullrom', 0.5);
    return new T.Mesh(new T.TubeGeometry(curve, Math.max(12, pts.length * 7), r, 6, !!closed), mat);
  }
  K.tube = tube;
  function fib(n, r) { var out = [], ga = Math.PI * (3 - Math.sqrt(5)); for (var i = 0; i < n; i++) { var y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), th = ga * i; out.push(V3(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r)); } return out; }
  K.fib = fib;
  function wavy(geo, amp, ph) {
    var p = geo.attributes.position, v = V3(0, 0, 0), i;
    for (i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); var L = v.length(), s = 1 + amp * Math.sin(v.x * 2.3 + ph) * Math.cos(v.z * 2.1 - ph) + amp * .6 * Math.sin(v.y * 3.1 + ph * 2);
      p.setXYZ(i, v.x * s, v.y * s, v.z * s);
    }
    geo.computeVertexNormals(); return geo;
  }

  /* ------------------------------------------------------------------ Orgánulos */
  K.nucleus = function (R) {
    var g1 = new T.Group();
    var o = new T.Mesh(SGL, M('#9a86e6', { o: .32, side: T.DoubleSide, r: .35 })); o.scale.setScalar(R); g1.add(o);
    var i2 = new T.Mesh(SGL, M('#7d68d4', { o: .3, side: T.DoubleSide, r: .35 })); i2.scale.setScalar(R * .92); g1.add(i2);
    return g1;
  };
  K.nuclearPores = function (R, n) {
    var g1 = new T.Group(), mat = M('#e9e2ff', { e: '#8f7bd8', ei: .35, r: .4 });
    fib(n || 38, R * 1.0).forEach(function (p) {
      var t = new T.Mesh(TG, mat); t.scale.setScalar(R * .075); t.position.copy(p); t.lookAt(p.clone().multiplyScalar(2)); g1.add(t);
    });
    return g1;
  };
  K.nucleolus = function (R) { var g1 = new T.Group(); var s = sph(R * .27, M('#4b2f93', { r: .8 }), true); s.position.set(R * .22, R * .08, R * .12); g1.add(s); var s2 = sph(R * .13, M('#5d3fb0', { r: .8 })); s2.position.set(R * .02, -R * .12, R * .3); g1.add(s2); return g1; };
  K.chromatin = function (R, rng) {
    var g1 = new T.Group(), mat = M('#d46bd1', { r: .6 }), i, k;
    for (i = 0; i < 9; i++) {
      var pts = [], p = V3((rng() - .5) * R, (rng() - .5) * R, (rng() - .5) * R).multiplyScalar(.9);
      for (k = 0; k < 9; k++) {
        p.add(V3((rng() - .5) * R * .75, (rng() - .5) * R * .75, (rng() - .5) * R * .75));
        if (p.length() > R * .78) p.multiplyScalar(R * .78 / p.length());
        pts.push(p.clone());
      }
      g1.add(tube(pts, R * .028, mat));
    }
    return g1;
  };
  K.mitochondrion = function (s) {
    var g1 = new T.Group();
    g1.add(ell(1.0 * s, .5 * s, .5 * s, M('#ff8a5c', { o: .38, side: T.DoubleSide, r: .4 }), true));
    g1.add(ell(.9 * s, .4 * s, .4 * s, M('#e0583a', { o: .3, side: T.DoubleSide }), false));
    var cm = M('#b8341f', { r: .6 }), i;
    for (i = 0; i < 7; i++) {
      var x = (-.62 + i * .21) * s, up = i % 2 ? 1 : -1;
      var cc = new T.Mesh(SG, cm); cc.scale.set(.03 * s, .27 * s, .27 * s); cc.position.set(x, up * .12 * s, 0); g1.add(cc);
    }
    return g1;
  };
  K.rer = function (R, rng, patch) {
    patch = patch || {};
    var g1 = new T.Group(), n = patch.n || 4, i, mat = M('#37b3a9', { side: T.DoubleSide, r: .55 }), pos = [];
    for (i = 0; i < n; i++) {
      var r = R * (1.28 + i * .17), geo = new T.SphereGeometry(r, 56, 22, patch.phi0 || 0, patch.phiLen || 3.9, patch.th0 || .95, patch.thLen || 1.25);
      wavy(geo, .035, i * 1.7); g1.add(new T.Mesh(geo, mat));
      // ribosomas adheridos en la cara externa
      var cnt = 34; for (var k = 0; k < cnt; k++) {
        var ph = (patch.phi0 || 0) + .1 + rng() * ((patch.phiLen || 3.9) - .2), th = (patch.th0 || .95) + .1 + rng() * ((patch.thLen || 1.25) - .2);
        pos.push(V3(Math.sin(th) * Math.cos(ph) * (r + .04), Math.cos(th) * (r + .04), Math.sin(th) * Math.sin(ph) * (r + .04)));
      }
    }
    return { group: g1, ribos: pos };
  };
  K.ribosomes = function (pts, size) {
    var im = new T.InstancedMesh(SG, M('#2f4f7a', { r: .7 }), pts.length), d = new T.Object3D();
    pts.forEach(function (p, i) { d.position.copy(p); d.scale.setScalar(size || .07); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
    var g1 = new T.Group(); g1.add(im); return g1;
  };
  K.rel = function (rng, R, spread) {
    var g1 = new T.Group(), mat = M('#f2a465', { r: .5 }), i, k;
    for (i = 0; i < 6; i++) {
      var pts = [], p = V3((rng() - .5) * R, (rng() - .5) * R * .5, (rng() - .5) * R);
      for (k = 0; k < 8; k++) { p.add(V3((rng() - .5) * spread, (rng() - .5) * spread * .6, (rng() - .5) * spread)); pts.push(p.clone()); }
      g1.add(tube(pts, .075, mat));
      var j = sph(.12, mat); j.position.copy(pts[3]); g1.add(j);
    }
    return g1;
  };
  K.golgi = function (R, n) {
    var g1 = new T.Group(), i, n2 = n || 6;
    for (i = 0; i < n2; i++) {
      var r = R * (1 - i * .075), geo = new T.SphereGeometry(1, 36, 10, 0, Math.PI * 2, 0, 1.05);
      var m = new T.Mesh(geo, M(['#f2b134', '#eea72c', '#f5bb4c', '#e89d24', '#f2b134', '#eea72c'][i % 6], { side: T.DoubleSide, r: .45 }));
      m.scale.set(r, r * .3, r * .9); m.position.y = i * R * .17; g1.add(m);
    }
    return g1;
  };
  K.vesicle = function (r, color) { return sph(r, M(color || '#ffd27a', { o: .78, r: .3 })); };
  K.lysosome = function (r, rng) {
    var g1 = new T.Group(); g1.add(sph(r, M('#5ec26a', { o: .78, r: .35 })));
    var dm = M('#1d6b2f', { r: .7 }); for (var i = 0; i < 6; i++) { var d = sph(r * .2, dm); d.position.set((rng() - .5) * r, (rng() - .5) * r, (rng() - .5) * r).multiplyScalar(.9); g1.add(d); }
    return g1;
  };
  K.peroxisome = function (r) {
    var g1 = new T.Group(); g1.add(sph(r, M('#3cc7c4', { o: .75, r: .3 })));
    var b = new T.Mesh(new T.BoxGeometry(1, 1, 1), M('#0e6f73', { r: .6 })); b.scale.setScalar(r * .7); b.rotation.set(.4, .6, .2); g1.add(b); return g1;
  };
  K.centrosome = function () {
    var g1 = new T.Group(), mat = M('#6f8bd6', { r: .5 });
    function centriole() {
      var c = new T.Group(), i;
      for (i = 0; i < 9; i++) { var a = i * Math.PI * 2 / 9, t = new T.Mesh(CG, mat); t.scale.set(.034, .55, .034); t.position.set(Math.cos(a) * .12, 0, Math.sin(a) * .12); t.rotation.y = a; c.add(t); }
      return c;
    }
    var c1 = centriole(), c2 = centriole(); c2.rotation.x = Math.PI / 2; c2.position.set(0, .3, -.2); c1.position.set(0, 0, 0); g1.add(c1, c2);
    g1.add(sph(.55, M('#9db3f0', { o: .14 })));
    return g1;
  };
  K.microvilli = function (shape, dir, count, rng, spread) {
    var g1 = new T.Group(), mat = M('#7fc4ff', { r: .45 }), i, n = 0, guard = 0;
    while (n < count && guard++ < 800) {
      var d = dir.clone().add(V3((rng() - .5) * spread, (rng() - .5) * spread * .6, (rng() - .5) * spread)).normalize();
      var p = shape.surface(d, 1), nrm = shape.normal(p), L = .45 + rng() * .4;
      var c = new T.Mesh(CG, mat); c.scale.set(.075, L, .075); c.position.copy(p).add(nrm.clone().multiplyScalar(L / 2 - .05)); c.quaternion.setFromUnitVectors(V3(0, 1, 0), nrm);
      var cap = sph(.075, mat); cap.position.copy(p).add(nrm.clone().multiplyScalar(L - .05));
      g1.add(c, cap); n++;
    }
    return g1;
  };
  K.membrane = function (shape, rng, N, cx) {
    var g1 = new T.Group();
    var shell = new T.Mesh(shape.geometry(1, 80, 50), M('#58b6ff', { o: .14, side: T.DoubleSide, r: .2 })); shell.renderOrder = 2; g1.add(shell);
    var heads = [], tails = [], i, d;
    for (i = 0; i < N; i++) {
      d = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1); if (d.lengthSq() < .01) continue;
      heads.push(shape.surface(d, 1.0)); heads.push(shape.surface(d, .972));
    }
    var hp = new Float32Array(heads.length * 3); heads.forEach(function (p, k) { hp[k * 3] = p.x; hp[k * 3 + 1] = p.y; hp[k * 3 + 2] = p.z; });
    var hg = new T.BufferGeometry(); hg.setAttribute('position', new T.BufferAttribute(hp, 3));
    var pts = new T.Points(hg, new T.PointsMaterial({ color: '#ffd86b', size: .13, map: dotTex(), transparent: true, depthWrite: false, alphaTest: .02 }));
    pts.userData.nopick = true; g1.add(pts);
    // proteínas integrales
    var pm = M('#3b6fe0', { r: .5 });
    for (i = 0; i < 26; i++) {
      d = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1); var p = shape.surface(d, .985), nr = shape.normal(p);
      var c = new T.Mesh(CG, pm); c.scale.set(.11, .34, .11); c.position.copy(p); c.quaternion.setFromUnitVectors(V3(0, 1, 0), nr); g1.add(c);
      var b = sph(.13, pm); b.position.copy(p).add(nr.clone().multiplyScalar(.18)); g1.add(b);
    }
    return g1;
  };

  /* ---- exclusivos de la célula vegetal ---- */
  K.chloroplast = function (L, rng) {
    var g1 = new T.Group();
    g1.add(ell(1 * L, .52 * L, .52 * L, M('#79d26a', { o: .33, side: T.DoubleSide, r: .35 }), true));
    g1.add(ell(.93 * L, .46 * L, .46 * L, M('#a9e58f', { o: .18, side: T.DoubleSide }), false));
    var gm = M('#1f7a3a', { r: .55 }), lm = M('#3fb15c', { r: .6 }), i, k, centers = [];
    for (i = 0; i < 5; i++) {
      var cx = (-.62 + i * .31) * L, cz = (rng() - .5) * .3 * L, cy = (rng() - .5) * .15 * L; centers.push(V3(cx, cy, cz));
      for (k = 0; k < 6; k++) { var d = new T.Mesh(CG, gm); d.scale.set(.13 * L, .028 * L, .13 * L); d.position.set(cx, cy + (k - 2.5) * .055 * L, cz); g1.add(d); }
    }
    for (i = 0; i < 4; i++) { var c = cylBetween(centers[i], centers[i + 1], .014 * L, lm); g1.add(c); }
    var st = ell(.12 * L, .08 * L, .08 * L, M('#f4f1e6', { r: .7 })); st.position.set(.7 * L, -.22 * L, 0); g1.add(st);
    return g1;
  };
  K.amyloplast = function (r, rng) {
    var g1 = new T.Group(); g1.add(sph(r, M('#e8ecd6', { o: .35, side: T.DoubleSide, r: .3 }), true));
    var sm = M('#fffdf2', { r: .6 });
    for (var i = 0; i < 5; i++) { var a = ell(r * .36, r * .28, r * .3, sm); a.position.set((rng() - .5) * r * .9, (rng() - .5) * r * .9, (rng() - .5) * r * .9); g1.add(a); }
    return g1;
  };
  K.vacuole = function (shape) {
    var g1 = new T.Group();
    var v = new T.Mesh(shape.geometry(1, 56, 34), M('#7fd0ff', { o: .26, side: T.DoubleSide, r: .15 })); v.renderOrder = 1; g1.add(v);
    return g1;
  };
  var _fib = null;
  function fiberTex() {
    if (_fib) return _fib;
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
    x.fillStyle = '#b9cf7a'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(70,95,35,.55)'; x.lineWidth = 2;
    for (var i = -128; i < 256; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,220,.4)'; for (i = -128; i < 256; i += 10) { x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); }
    _fib = new T.CanvasTexture(c); _fib.wrapS = _fib.wrapT = T.RepeatWrapping; _fib.repeat.set(10, 5); return _fib;
  }
  K.wall = function (shape) {
    var m = new T.MeshStandardMaterial({ map: fiberTex(), color: '#ffffff', transparent: true, opacity: .42, side: T.DoubleSide, roughness: .7, depthWrite: false });
    var g1 = new T.Group(), a = new T.Mesh(shape.geometry(1.0, 80, 50), m); a.renderOrder = 2; g1.add(a);
    var b = new T.Mesh(shape.geometry(.96, 80, 50), M('#8fb352', { o: .2, side: T.DoubleSide })); b.renderOrder = 2; g1.add(b); return g1;
  };
  K.middleLamella = function (shape) {
    var g1 = new T.Group(), m = new T.Mesh(shape.geometry(1.045, 70, 44), M('#e6cf7e', { o: .17, side: T.DoubleSide, r: .5 })); m.renderOrder = 3; g1.add(m); return g1;
  };
  K.plasmodesmata = function (shape, rng, n) {
    var g1 = new T.Group(), mat = M('#d94f8a', { r: .45 }), dm = M('#5a1f3a', { r: .6 }), i;
    for (i = 0; i < n; i++) {
      var side = i % 2 ? 1 : -1, d = V3(side * 1, (rng() - .5) * .8, (rng() - .5) * .9), p = shape.surface(d, 1.0), nr = shape.normal(p);
      var a = p.clone().add(nr.clone().multiplyScalar(-.55)), b = p.clone().add(nr.clone().multiplyScalar(.5));
      g1.add(cylBetween(a, b, .085, mat)); g1.add(cylBetween(a, b, .03, dm));
      var ring = new T.Mesh(TG, mat); ring.scale.setScalar(.14); ring.position.copy(p); ring.quaternion.setFromUnitVectors(V3(0, 0, 1), nr); g1.add(ring);
    }
    return g1;
  };

  /* ------------------------------------------------------------------ Visor ------------------------------------------------------------------ */
  function View(kit, cfg) {
    var self = this; this.kit = kit; this.cfg = cfg; this.items = {}; this.list = [];
    var cont = kit.viewport;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(42, 1, 0.1, 200);
    this.renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(g.devicePixelRatio || 1, 2));
    this.renderer.localClippingEnabled = true;
    cont.appendChild(this.renderer.domElement);
    this.labelR = new T.CSS2DRenderer(); this.labelR.domElement.className = 'labels-layer'; cont.appendChild(this.labelR.domElement);
    this.controls = new T.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.07; this.controls.autoRotateSpeed = 1.0; this.controls.enablePan = false;
    this.controls.minDistance = 3; this.controls.maxDistance = 45;
    this.goal = null;
    this.controls.addEventListener('start', function () { self.goal = null; });
    this.scene.add(new T.AmbientLight(0xffffff, 0.75));
    var dl = new T.DirectionalLight(0xffffff, 1.05); dl.position.set(7, 10, 9); this.scene.add(dl);
    var dl2 = new T.DirectionalLight(0x8fb2ff, .35); dl2.position.set(-8, -5, -7); this.scene.add(dl2);
    this.root = new T.Group(); this.scene.add(this.root);
    this.plane = new T.Plane(V3(0, 0, -1), 100); this.cutOn = false;
    this.ray = new T.Raycaster(); this.mouse = new T.Vector2();
    this.sel = null; this.hover = null; this.focus = null; this.mode = "structure"; this.labelsAll = true;
    this.ticks = []; this.time = 0;
    var cv = this.renderer.domElement, down = null;
    cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener('pointerup', function (e) {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) { var id = self.pick(e.clientX, e.clientY); if (cfg.onPick) cfg.onPick(id); }
      down = null;
    });
    cv.addEventListener('pointermove', function (e) {
      if (down) return; var id = self.pick(e.clientX, e.clientY); if (id !== self.hover) { self.hover = id; cv.style.cursor = id ? 'pointer' : 'grab'; }
    });
    cv.addEventListener('pointerleave', function () { self.hover = null; });
  }
  View.prototype.add = function (id, group, meta) {
    var it = { id: id, group: group, meta: meta, k: 1, kt: 1, glow: 0, mats: [], vis: true, base: {} };
    var seen = new Set();
    group.traverse(function (o) {
      o.userData.item = id;
      var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(function (m) {
        if (seen.has(m)) return; seen.add(m);
        it.mats.push(m);
        it.base[m.uuid] = { c: m.color.clone(), o: m.opacity, t: m.transparent, dw: m.depthWrite, e: m.emissive ? m.emissive.clone() : null, ei: m.emissiveIntensity };
      });
    });
    (meta.parent || this.root).add(group);
    this.items[id] = it; this.list.push(it);
    return it;
  };
  View.prototype.finalize = function () {
    var self = this; this.scene.updateMatrixWorld(true);
    this.list.forEach(function (it) {
      var box = new T.Box3().setFromObject(it.group), c = box.getCenter(V3(0, 0, 0)), top = V3(c.x, box.max.y, c.z);
      it.center = c; it.size = box.getSize(V3(0, 0, 0));
      var d = document.createElement('div'); d.className = 'cell-label'; d.innerHTML = '<i style="background:' + it.meta.col + '"></i>' + it.meta.label;
      var o = new T.CSS2DObject(d); var wp = it.meta.anchor ? it.meta.anchor.clone() : top.clone().add(V3(0, 0.08, 0));
      it.group.worldToLocal(wp); o.position.copy(wp); it.group.add(o); it.lab = { o: o, d: d };
      d.addEventListener('click', function () { if (self.cfg.onPick) self.cfg.onPick(it.id); });
      d.style.pointerEvents = 'auto';
    });
    this.applyColors(); this.applyCut();
  };
  View.prototype.setMode = function (mode) { this.mode = mode; this.applyColors(); };
  View.prototype.applyColors = function () {
    var fn = this.mode === 'funcion';
    this.list.forEach(function (it) {
      var fc = new T.Color(K.GROUPS[it.meta.grp].c);
      it.mats.forEach(function (m) { var b = it.base[m.uuid]; m.color.copy(b.c); if (fn) m.color.lerp(fc, .82); });
      var lc = fn ? K.GROUPS[it.meta.grp].c : it.meta.col; if (it.lab) it.lab.d.firstChild.style.background = lc;
    });
  };
  View.prototype.setCut = function (on, z) { this.cutOn = on; if (z != null) this.cutZ = z; this.applyCut(); };
  View.prototype.applyCut = function () {
    var self = this; this.plane.constant = this.cutOn ? (this.cutZ == null ? 0.4 : this.cutZ) : 100;
    this.list.forEach(function (it) {
      if (!it.meta.cuttable) return;
      it.mats.forEach(function (m) { m.clippingPlanes = [self.plane]; m.clipShadows = false; m.needsUpdate = true; });
    });
  };
  View.prototype.setFocus = function (ids) { this.focus = ids && ids.length ? ids : null; };
  View.prototype.select = function (id) { this.sel = id; };
  View.prototype.pick = function (cx, cy) {
    var r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.camera);
    var objs = this.list.filter(function (it) { return it.vis && it.group.visible; }).map(function (it) { return it.group; });
    var hits = this.ray.intersectObjects(objs, true), best = null, bp = 99, self = this;
    hits.forEach(function (h) {
      if (h.object.userData.nopick) return;
      var id = h.object.userData.item; if (!id) return; var it = self.items[id];
      if (self.cutOn && it.meta.cuttable && self.plane.distanceToPoint(h.point) < 0) return;
      var pr = it.meta.pr == null ? 0 : it.meta.pr;
      if (pr < bp) { bp = pr; best = id; }
    });
    return best;
  };
  View.prototype.flyTo = function (id, dist) {
    var it = this.items[id]; if (!it) return;
    var c = it.center.clone(), out = c.clone().sub(this.cfg.center || V3(0, 0, 0)); if (out.length() < .5) out.set(.3, .4, 1);
    out.normalize(); out.z = Math.abs(out.z) * .6 + .55; out.normalize();
    var sz = Math.max(it.size.x, it.size.y, it.size.z), d = dist || clamp(sz * 2.3, 4.2, 20);
    this.goal = { pos: c.clone().add(out.multiplyScalar(d)), target: c };
  };
  View.prototype.flyHome = function (dir, d) { this.goal = { pos: dir.clone().normalize().multiplyScalar(d), target: V3(0, 0, 0) }; };
  View.prototype.resize = function () {
    var cont = this.kit.viewport, w = cont.clientWidth, h = cont.clientHeight; if (w < 2 || h < 2) return;
    this.camera.aspect = w / h; this.camera.zoom = clamp(this.camera.aspect / 1.2, 0.5, 1);
    var off = w > 900 ? Math.min(90, w * .08) : 0; if (off) this.camera.setViewOffset(w, h, -off, 0, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); this.labelR.setSize(w, h);
  };
  View.prototype.frame = function (dt) {
    var self = this; this.time += dt;
    if (this.goal) {
      var k = 1 - Math.exp(-dt * 3.2);
      this.camera.position.lerp(this.goal.pos, k); this.controls.target.lerp(this.goal.target, k);
      if (this.camera.position.distanceTo(this.goal.pos) < .05 && this.controls.target.distanceTo(this.goal.target) < .05) this.goal = null;
    }
    this.controls.update();
    this.ticks.forEach(function (f) { f(dt, self.time); });
    var cc = this.cfg.center || V3(0, 0, 0), camDir = this.camera.position.clone().sub(cc).normalize(), tmp = V3(0, 0, 0);
    var foc = this.focus, sel = this.sel, hov = this.hover;
    this.list.forEach(function (it) {
      var on = it.vis, isF = !foc || foc.indexOf(it.id) >= 0 || it.id === sel;
      var dim = (foc || sel) ? ((it.id === sel) || (foc && foc.indexOf(it.id) >= 0) ? 1 : (sel && !foc ? 0.22 : 0.18)) : 1;
      if (sel && foc && foc.indexOf(sel) < 0) dim = it.id === sel ? 1 : 0.16;
      it.kt = dim; it.k += (it.kt - it.k) * (1 - Math.exp(-dt * 8));
      var gl = (it.id === sel ? 1 : 0) * (.55 + .25 * Math.sin(self.time * 4)) + (it.id === hov ? .5 : 0) + (foc && foc.indexOf(it.id) >= 0 && !sel ? .3 + .2 * Math.sin(self.time * 3) : 0);
      it.glow += (gl - it.glow) * (1 - Math.exp(-dt * 10));
      it.mats.forEach(function (m) {
        var b = it.base[m.uuid], tr = b.t || it.k < .98;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        var dw = b.dw && it.k > .98; if (m.depthWrite !== dw) m.depthWrite = dw;
        m.opacity = Math.min(1, b.o * it.k);
        if (m.emissive) { m.emissive.copy(it.glow > .02 ? new T.Color('#ffffff') : (b.e || new T.Color(0))); m.emissiveIntensity = it.glow > .02 ? it.glow * .38 : b.ei; }
      });
      // etiquetas: todas / solo foco+selección; atenuadas si el orgánulo queda detrás
      var show = on && (self.labelsAll || it.id === sel || (foc && foc.indexOf(it.id) >= 0) || it.id === hov);
      if (it.lab) {
        it.lab.o.visible = show;
        if (show) {
          it.group.getWorldPosition(tmp); var front = tmp.clone().sub(cc).dot(camDir) > -0.6;
          it.lab.d.style.opacity = String(clamp(it.k, .12, 1) * (front ? 1 : .38));
          it.lab.d.classList.toggle('sel', it.id === sel); it.lab.d.classList.toggle('foc', !!(foc && foc.indexOf(it.id) >= 0));
        }
      }
    });
    this.renderer.render(this.scene, this.camera); this.labelR.render(this.scene, this.camera);
  };
  K.View = View;

  /* ------------------------------------------------------------------ Textos comunes de orgánulos ------------------------------------------------------------------ */
  K.INFO = {
    membrana: { n: "Plasma membrane", g: 'lim', col: '#58b6ff', s: "7–10 nm thick", m: "Lipid bilayer with proteins", e: "Double layer of phospholipids (hydrophilic heads outward and hydrophobic tails inward) with cholesterol (in animals) and integral and peripheral proteins. It is the “fluid mosaic”.",
      f: "It separates the inside from the outside and controls what enters and leaves (selective permeability): channels, transporters, pumps, endocytosis and exocytosis. It receives signals through receptors.", c: "It is so thin that about 10,000 stacked membranes would be needed to match the thickness of a sheet of paper." },
    citosol: { n: "Cytosol", g: 'lim', nogame: true, col: '#9fd3ff', s: "Occupies much of the cell volume", m: "No membrane", e: "Gel-like solution, ~70–80 % water, with ions, metabolites, proteins, enzymes and free ribosomes. Together with the organelles it forms the cytoplasm.",
      f: "Site of metabolic reactions such as glycolysis and of cytosolic protein synthesis; the medium through which molecules diffuse and vesicles move.", c: "It is very viscous and full of molecules: more a “thick soup” than a free liquid." },
    nucleo: { n: "Nucleus (nuclear envelope)", g: 'inf', col: '#9a86e6', s: '5–10 µm', m: "Double membrane with pores", e: "Envelope of two membranes continuous with the endoplasmic reticulum, perforated by nuclear pores. It contains chromatin, nucleolus and nucleoplasm.",
      f: "It stores the DNA and regulates gene expression; DNA replication and transcription (RNA synthesis) take place there. It controls the activities of the cell.", c: "If you stretched out all the DNA of a human cell it would measure ~2 m, and it fits in a nucleus a few microns wide." },
    poro: { n: "Nuclear pore", g: 'inf', col: '#e9e2ff', s: "~100 nm in diameter", m: "Protein complex (nucleoporins)", e: "Complex of about 30 different proteins with octagonal symmetry that crosses the nuclear envelope.",
      f: "It regulates nucleus ↔ cytoplasm traffic: mRNA, tRNA and ribosomal subunits go out; histones, transcription factors and enzymes come in.", c: "A typical nucleus has thousands of pores and each one can transport hundreds of molecules per second." },
    nucleolo: { n: "Nucleolus", g: 'inf', col: '#4b2f93', s: '1–3 µm', m: "No membrane", e: "Dense region inside the nucleus, made of ribosomal DNA, ribosomal RNA and proteins.",
      f: "It synthesizes ribosomal RNA and assembles the ribosome subunits, which then leave through the nuclear pores.", c: "Cells that make a lot of protein have large nucleoli or several." },
    cromatina: { n: "Chromatin", g: 'inf', col: '#d46bd1', s: "10–30 nm fibers", m: "No membrane", e: "Complex of DNA wound on histones. Less compact (euchromatin, active) or very compact (heterochromatin). When the cell divides it condenses into chromosomes.",
      f: "It packages the DNA and regulates which genes are read; when the cell divides it condenses to distribute the genetic material.", c: "Chromosomes are only “X”-shaped during division; the rest of the time the chromatin is dispersed." },
    rer: { n: "Rough endoplasmic reticulum", g: 'sin', col: '#37b3a9', s: "Flattened sacs with a 20–30 nm lumen", m: "Single membrane", e: "Network of flattened cisternae continuous with the nuclear envelope, with ribosomes attached to its cytosolic face (“rough” appearance).",
      f: "It synthesizes proteins destined for secretion, the membrane and lysosomes/vacuoles; it folds them and adds initial carbohydrates (glycosylation).", c: "It is very abundant in secretory cells, such as those that produce antibodies or digestive enzymes." },
    rel: { n: "Smooth endoplasmic reticulum", g: 'sin', col: '#f2a465', s: "30–60 nm tubules", m: "Single membrane", e: "Network of branched tubules without ribosomes, continuous with the rough one.",
      f: "It synthesizes lipids (phospholipids, steroids), detoxifies drugs and poisons and, in muscle, stores calcium.", c: "In the liver the smooth reticulum is abundant because alcohol and medicines are metabolized there." },
    ribosoma: { n: "Ribosomes", g: 'sin', col: '#2f4f7a', s: '~25 nm (80S en eucariontes)', m: "No membrane", e: "Particles of ribosomal RNA and proteins made of two subunits (60S and 40S). They can be free in the cytosol or attached to the rough reticulum.",
      f: "They translate messenger RNA into proteins. Free ones make proteins for the cytosol, nucleus, mitochondria and chloroplasts; attached ones make those that are secreted or go to membranes.", c: "A growing cell can have millions of ribosomes." },
    golgi: { n: "Golgi apparatus", g: 'sin', col: '#f2b134', s: "5–10 stacked cisternae", m: "Single membrane", e: "Stack of flattened sacs with a cis face (receives vesicles from the reticulum) and a trans face (sends them out). ",
      f: "It modifies, sorts and packages proteins and lipids into vesicles; it completes glycosylation and directs them to the membrane, the lysosomes or the exterior.", c: "It is named after Camillo Golgi, who described it in 1898 by staining neurons with silver nitrate." },
    vesicula: { n: "Vesicles", g: 'sin', col: '#ffd27a', s: '50–200 nm', m: "Single membrane", e: "Small membrane bubbles formed by budding from other compartments.",
      f: "They transport molecules between organelles and toward the membrane (exocytosis) or from it (endocytosis).", c: "A single neuron can release thousands of vesicles with neurotransmitters in seconds." },
    mito: { n: "Mitochondria", g: 'ene', col: '#ff8a5c', s: "1–10 µm long", m: "Double membrane", e: "Smooth outer membrane and inner membrane folded into cristae that surround the matrix, where there are mitochondrial DNA and ribosomes of their own.",
      f: "They produce most of the ATP through cellular respiration (Krebs cycle, respiratory chain and oxidative phosphorylation).", c: "According to the endosymbiotic theory, they descend from bacteria that were taken in by ancestral cells." },
    lisosoma: { n: "Lysosomes", g: 'dig', col: '#5ec26a', s: '0,1–1,2 µm', m: "Single membrane", e: "Vesicles with about 50 hydrolytic enzymes that work at acidic pH (~5).",
      f: "They digest macromolecules, bacteria and old organelles (autophagy). They recycle cell components.", c: "Their acidic pH protects the rest of the cell: if they break, the enzymes hardly act in the cytosol (pH ≈ 7.2)." },
    peroxisoma: { n: "Peroxisomes", g: 'dig', col: '#3cc7c4', s: '0,2–1 µm', m: "Single membrane", e: "Vesicles with oxidases and catalase; often with a dense crystalline core.",
      f: "They oxidize long fatty acids and detoxify substances; catalase breaks down hydrogen peroxide (H₂O₂) into water and oxygen.", c: "In the liver they degrade a good part of the alcohol we consume." },
    centrosoma: { n: "Centrosome and centrioles", g: 'sop', col: '#6f8bd6', s: "Centrioles of 0.2 × 0.5 µm", m: "No membrane", e: "Pair of perpendicular centrioles (9 triplets of microtubules) surrounded by pericentriolar material.",
      f: "They organize the microtubules and form the mitotic spindle to distribute the chromosomes during division.", c: "Flowering plants have no centrioles and organize their spindle in other ways." },
    mtub: { n: "Microtubules", g: 'sop', col: '#53c7ff', s: "25 nm in diameter", m: "No membrane", e: "Hollow tubes of α and β tubulin.",
      f: "They give shape, serve as “highways” for vesicle transport (kinesin and dynein) and form the mitotic spindle, cilia and flagella.", c: "They can grow and shorten in seconds (dynamic instability)." },
    actina: { n: "Actin filaments", g: 'sop', col: '#ff8ad0', s: "7 nm in diameter", m: "No membrane", e: "Double helix of actin monomers; they form a network under the membrane (cell cortex).",
      f: "They give mechanical strength and enable cell movement, phagocytosis, cytokinesis and microvilli. In plants they take part in cytoplasmic streaming.", c: "Together with myosin they produce muscle contraction." },
    intermedios: { n: "Intermediate filaments", g: 'sop', col: '#9fc86a', s: "8–12 nm in diameter", m: "No membrane", e: "“Rope”-type fibers (keratins, lamins, vimentin).",
      f: "They provide tensile strength, anchor the nucleus and the organelles and form the nuclear lamina.", c: "They are the most stable of the cytoskeleton; keratins make up hair and nails." }
  };
})(window);
