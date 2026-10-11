/* Orbitales del átomo de hidrógeno (unidades de a₀) — matemática y geometrías Three.js
   Funciones radiales R(n,l) exactas (Z = 1) y partes angulares reales (s, p, d).
   Las nubes se generan muestreando |ψ|² = R²·Y²: radio por transformada inversa de r²R², dirección por rechazo sobre Y². */
(function (g) {
  'use strict';
  var T = g.THREE;
  var S = Math.sqrt;

  /* ---- Radial: R(n,l,r) normalizada ---- */
  var RAD = {
    '10': function (r) { return 2 * Math.exp(-r); },
    '20': function (r) { return (1 / S(2)) * (1 - r / 2) * Math.exp(-r / 2); },
    '21': function (r) { return (1 / (2 * S(6))) * r * Math.exp(-r / 2); },
    '30': function (r) { return (2 / (81 * S(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3); },
    '31': function (r) { return (8 / (27 * S(6))) * r * (1 - r / 6) * Math.exp(-r / 3); },
    '32': function (r) { return (4 / (81 * S(30))) * r * r * Math.exp(-r / 3); },
    '40': function (r) { return 0.25 * (1 - 0.75 * r + r * r / 8 - r * r * r / 192) * Math.exp(-r / 4); }
  };

  /* ---- Angular (reales, sin normalizar; solo importa forma y signo). u = vector unitario químico (x,y,z) ---- */
  var ANG = {
    s: function () { return 1; },
    px: function (x) { return x; },
    py: function (x, y) { return y; },
    pz: function (x, y, z) { return z; },
    dz2: function (x, y, z) { return 3 * z * z - 1; },
    dxz: function (x, y, z) { return x * z; },
    dyz: function (x, y, z) { return y * z; },
    dxy: function (x, y) { return x * y; },
    dx2y2: function (x, y) { return x * x - y * y; }
  };

  /* ---- Catálogo ---- */
  var LIST = [
    { k: '1s', n: 1, l: 0, a: 's', nm: '1s', html: '1s', lab: '1s' },
    { k: '2s', n: 2, l: 0, a: 's', nm: '2s', html: '2s', lab: '2s' },
    { k: '2px', n: 2, l: 1, a: 'px', nm: '2p (eje x)', html: '2p<sub>x</sub>', lab: '2pₓ' },
    { k: '2py', n: 2, l: 1, a: 'py', nm: '2p (eje y)', html: '2p<sub>y</sub>', lab: '2p_y' },
    { k: '2pz', n: 2, l: 1, a: 'pz', nm: '2p (eje z)', html: '2p<sub>z</sub>', lab: '2p_z' },
    { k: '3s', n: 3, l: 0, a: 's', nm: '3s', html: '3s', lab: '3s' },
    { k: '3pz', n: 3, l: 1, a: 'pz', nm: '3p (eje z)', html: '3p<sub>z</sub>', lab: '3p_z' },
    { k: '3dz2', n: 3, l: 2, a: 'dz2', nm: '3d (z²)', html: '3d<sub>z²</sub>', lab: '3d_z²' },
    { k: '3dxz', n: 3, l: 2, a: 'dxz', nm: '3d (xz)', html: '3d<sub>xz</sub>', lab: '3d_xz' },
    { k: '3dyz', n: 3, l: 2, a: 'dyz', nm: '3d (yz)', html: '3d<sub>yz</sub>', lab: '3d_yz' },
    { k: '3dxy', n: 3, l: 2, a: 'dxy', nm: '3d (xy)', html: '3d<sub>xy</sub>', lab: '3d_xy' },
    { k: '3dx2y2', n: 3, l: 2, a: 'dx2y2', nm: '3d (x²−y²)', html: '3d<sub>x²−y²</sub>', lab: '3d_x²−y²' },
    { k: '4s', n: 4, l: 0, a: 's', nm: '4s', html: '4s', lab: '4s' }
  ];
  var BY = {}; LIST.forEach(function (o) { BY[o.k] = o; });
  var RMAX = { 1: 14, 2: 34, 3: 68, 4: 120 };       // radio máximo de muestreo (a₀)

  function R(o, r) { return RAD[o.n + '' + o.l](r); }
  function Y(o, x, y, z) { return ANG[o.a](x, y, z); }

  var cache = {};
  function info(k) {
    if (cache[k]) return cache[k];
    var o = BY[k], rm = RMAX[o.n], N = 4000, i, r, v, cdf = new Float64Array(N + 1), peak = 0, rp = 0, prev = null, nodes = [];
    for (i = 1; i <= N; i++) {
      r = rm * i / N; v = R(o, r);
      var p = r * r * v * v;
      cdf[i] = cdf[i - 1] + p;
      if (p > peak) { peak = p; rp = r; }
      if (prev !== null && prev * v < 0) nodes.push(r - rm / N * 0.5);
      if (v !== 0) prev = v;
    }
    var tot = cdf[N];
    for (i = 0; i <= N; i++) cdf[i] /= tot;
    // máximo de Y² sobre la esfera
    var ym = 0, t;
    for (i = 0; i < 6000; i++) {
      var a = Math.acos(1 - 2 * Math.random()), b = 2 * Math.PI * Math.random();
      t = Y(o, Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)); t *= t; if (t > ym) ym = t;
    }
    // radio que contiene el 99 % de la probabilidad (para encuadre)
    var r99 = rm; for (i = 0; i <= N; i++) if (cdf[i] >= 0.99) { r99 = rm * i / N; break; }
    var rmean = 0.5 * (3 * o.n * o.n - o.l * (o.l + 1));
    var out = { o: o, cdf: cdf, N: N, rm: rm, ymax: ym * 1.04, peak: peak, rp: rp, nodes: nodes, r99: r99, rmean: rmean };
    cache[k] = out; return out;
  }

  /* Distribución radial P(r)=r²R² en n puntos hasta rr */
  function radial(k, rr, n) {
    var o = BY[k], xs = [], ys = [], i, r, v;
    for (i = 0; i <= n; i++) { r = rr * i / n; v = R(o, r); xs.push(r); ys.push(r * r * v * v); }
    return { x: xs, y: ys };
  }

  /* ---- Nube de puntos con color por signo de ψ ---- */
  var cRed = new T.Color('#e0554d'), cBlue = new T.Color('#3f74e0');
  function dotTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    var gr = x.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  }
  var DOT = null;
  function cloud(k, count, pal) {
    var f = info(k), o = f.o, pos = new Float32Array(count * 3), col = new Float32Array(count * 3), n = 0, guard = 0, i, lo, hi, mid, u, r, x, y, z, w, s, c;
    pal = pal || {};
    var cp = pal.pos || cRed, cn = pal.neg || cBlue;
    while (n < count && guard++ < count * 60) {
      u = Math.random(); lo = 0; hi = f.N;
      while (hi - lo > 1) { mid = (lo + hi) >> 1; if (f.cdf[mid] < u) lo = mid; else hi = mid; }
      r = f.rm * (lo + (u - f.cdf[lo]) / Math.max(1e-12, f.cdf[hi] - f.cdf[lo])) / f.N;
      var a = Math.acos(1 - 2 * Math.random()), b = 2 * Math.PI * Math.random();
      x = Math.sin(a) * Math.cos(b); y = Math.sin(a) * Math.sin(b); z = Math.cos(a);
      w = Y(o, x, y, z);
      if (Math.random() * f.ymax > w * w) continue;
      s = (R(o, r) * w) >= 0 ? 1 : -1; c = s > 0 ? cp : cn;
      pos[n * 3] = x * r; pos[n * 3 + 1] = y * r; pos[n * 3 + 2] = z * r;
      col[n * 3] = c.r; col[n * 3 + 1] = c.g; col[n * 3 + 2] = c.b; n++;
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos.subarray(0, n * 3), 3));
    geo.setAttribute('color', new T.BufferAttribute(col.subarray(0, n * 3), 3));
    if (!DOT) DOT = dotTexture();
    var mat = new T.PointsMaterial({ size: Math.max(0.12, f.r99 * 0.028), map: DOT, vertexColors: true, transparent: true, opacity: .85, depthWrite: false, sizeAttenuation: true, alphaTest: .02 });
    return new T.Points(geo, mat);
  }

  /* ---- Superficie polar de la parte angular |Y(θ,φ)|, coloreada por signo ---- */
  function lobes(k, scale, pal) {
    var f = info(k), o = f.o, cp = (pal && pal.pos) || cRed, cn = (pal && pal.neg) || cBlue;
    var NT = 72, NP = 96, pos = [], col = [], idx = [], ymax = Math.sqrt(f.ymax / 1.04), i, j;
    for (i = 0; i <= NT; i++) {
      var th = Math.PI * i / NT;
      for (j = 0; j <= NP; j++) {
        var ph = 2 * Math.PI * j / NP, x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
        var yv = Y(o, x, y, z), rr = scale * Math.abs(yv) / ymax, c = yv >= 0 ? cp : cn;
        pos.push(x * rr, y * rr, z * rr); col.push(c.r, c.g, c.b);
      }
    }
    for (i = 0; i < NT; i++) for (j = 0; j < NP; j++) {
      var a = i * (NP + 1) + j, b = a + NP + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    return new T.Mesh(geo, new T.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: .58, side: T.DoubleSide, shininess: 40, depthWrite: false }));
  }

  /* ---- Nodos: esferas (radiales) y planos / conos (angulares), en coordenadas químicas ---- */
  function nodes(k, ext, color) {
    var f = info(k), o = f.o, grp = new T.Group(), c = new T.Color(color || '#7a8794');
    var mS = function () { return new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .09, side: T.DoubleSide, depthWrite: false }); };
    var ln = function () { return new T.LineBasicMaterial({ color: c, transparent: true, opacity: .55 }); };
    f.nodes.forEach(function (r) {
      grp.add(new T.Mesh(new T.SphereGeometry(r, 40, 28), mS()));
      for (var q = 0; q < 3; q++) {
        var pts = []; for (var i = 0; i <= 96; i++) { var t = 2 * Math.PI * i / 96, cs = Math.cos(t) * r, sn = Math.sin(t) * r; pts.push(q === 0 ? new T.Vector3(cs, sn, 0) : q === 1 ? new T.Vector3(cs, 0, sn) : new T.Vector3(0, cs, sn)); }
        grp.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), ln()));
      }
    });
    var plane = function (nx, ny, nz) {   // plano que pasa por el origen con normal (nx,ny,nz)
      var m = new T.Mesh(new T.PlaneGeometry(ext * 2, ext * 2), mS());
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(nx, ny, nz).normalize()); grp.add(m);
    };
    var a = o.a;
    if (a === 'px') plane(1, 0, 0); if (a === 'py') plane(0, 1, 0); if (a === 'pz') plane(0, 0, 1);
    if (a === 'dxz') { plane(1, 0, 0); plane(0, 0, 1); }
    if (a === 'dyz') { plane(0, 1, 0); plane(0, 0, 1); }
    if (a === 'dxy') { plane(1, 0, 0); plane(0, 1, 0); }
    if (a === 'dx2y2') { plane(1, 1, 0); plane(1, -1, 0); }
    if (a === 'dz2') {
      var h = ext, rad = h * Math.tan(54.7356 * Math.PI / 180);
      [-Math.PI / 2, Math.PI / 2].forEach(function (rx) {
        var cg = new T.ConeGeometry(rad, h, 48, 1, true); cg.translate(0, -h / 2, 0); cg.rotateX(rx);
        grp.add(new T.Mesh(cg, mS()));
      });
    }
    return grp;
  }

  g.Orb = { LIST: LIST, BY: BY, info: info, radial: radial, cloud: cloud, lobes: lobes, nodes: nodes, R: R };
})(window);
