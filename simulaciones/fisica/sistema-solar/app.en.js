/* Sistema Solar 3D — Laboratorio MACEDONIA (UMCE). Three.js + SimKit. Texturas procedurales (sin imágenes externas). */
(function () {
  "use strict";
  var T = THREE, D = SolarData, B = D.B, TAU = Math.PI * 2, rad = Math.PI / 180;
  function V3(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function fmt(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', '.'); }
  function thou(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ---------------- Ruido y texturas procedurales ---------------- */
  function H(x, y, z, s) { var h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967295; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vn(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    var a = H(xi, yi, zi, s), b = H(xi + 1, yi, zi, s), c = H(xi, yi + 1, zi, s), d = H(xi + 1, yi + 1, zi, s), e = H(xi, yi, zi + 1, s), f = H(xi + 1, yi, zi + 1, s), g = H(xi, yi + 1, zi + 1, s), h = H(xi + 1, yi + 1, zi + 1, s);
    var x1 = a + (b - a) * xf, x2 = c + (d - c) * xf, x3 = e + (f - e) * xf, x4 = g + (h - g) * xf, y1 = x1 + (x2 - x1) * yf, y2 = x3 + (x4 - x3) * yf;
    return y1 + (y2 - y1) * zf;
  }
  function fbm(x, y, z, s, o) { var v = 0, a = 0.5, f = 1, n = 0; for (var i = 0; i < o; i++) { v += a * vn(x * f, y * f, z * f, s + i); n += a; a *= 0.5; f *= 2.03; } return v / n; }
  function mix(a, b, t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function ss(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function dim(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
  function lonw(l, c) { return ((l - c + Math.PI) % TAU + TAU) % TAU - Math.PI; }
  function mkTex(w, h, fn) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var cx = cv.getContext('2d'), im = cx.createImageData(w, h), d = im.data;
    for (var j = 0; j < h; j++) {
      var lat = (0.5 - (j + 0.5) / h) * Math.PI, cl = Math.cos(lat), ny = Math.sin(lat);
      for (var i = 0; i < w; i++) {
        var lon = ((i + 0.5) / w) * TAU, c = fn(cl * Math.cos(lon), ny, cl * Math.sin(lon), lat, lon), o = (j * w + i) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c.length > 3 ? c[3] : 255;
      }
    }
    cx.putImageData(im, 0, 0); var t = new T.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  var TEX = {
    sol: function (x, y, z) { var n = fbm(x * 7, y * 7, z * 7, 3, 4), m = fbm(x * 2.2, y * 2.2, z * 2.2, 9, 3); return mix([232, 92, 12], [255, 228, 120], n * 1.15 + m * 0.3 - 0.15); },
    mercurio: function (x, y, z) { var n = fbm(x * 3, y * 3, z * 3, 5, 5), c = fbm(x * 14, y * 14, z * 14, 6, 3), g = (92 + 100 * n) * (0.8 + 0.4 * c); g *= 1 - 0.28 * ss(0.62, 0.72, vn(x * 10, y * 10, z * 10, 7)); return [g * 1.02, g * 0.97, g * 0.92]; },
    venus: function (x, y, z) { var w = fbm(x * 2, y * 4, z * 2, 11, 3), n = fbm(x * 2 + w * 1.5, y * 5, z * 2 + w * 1.5, 12, 4); return mix([205, 160, 90], [247, 224, 168], n * 1.3 - 0.1); },
    tierra: function (x, y, z) {
      var h = fbm(x * 1.9 + 3, y * 1.9, z * 1.9, 21, 5), ay = Math.abs(y), c;
      if (h > 0.53) { var e = Math.min(1, (h - 0.53) / 0.2), dz = fbm(x * 3, y * 3, z * 3, 22, 3); c = mix([48, 118, 52], [142, 122, 78], e * 0.9); c = mix(c, [205, 172, 105], ss(0.55, 0.7, dz) * (1 - ss(0.35, 0.6, ay)) * 0.8); }
      else c = mix([8, 30, 92], [28, 92, 168], ss(0.38, 0.53, h));
      return mix(c, [240, 245, 250], ss(0.86, 0.93, ay + (fbm(x * 5, y * 5, z * 5, 23, 3) - 0.5) * 0.12));
    },
    nubes: function (x, y, z) { return [255, 255, 255, ss(0.5, 0.72, fbm(x * 3.2, y * 4.5, z * 3.2, 31, 5)) * 215]; },
    marte: function (x, y, z) {
      var n = fbm(x * 2.5, y * 2.5, z * 2.5, 41, 5), d = fbm(x * 5, y * 5, z * 5, 42, 3), c = mix([188, 100, 58], [225, 150, 95], n * 1.2 - 0.1);
      c = mix(c, [96, 50, 36], ss(0.55, 0.72, fbm(x * 2, y * 2, z * 2, 43, 4)) * 0.7); c = dim(c, 1 - d * 0.18);
      return mix(c, [245, 245, 250], ss(0.9, 0.95, Math.abs(y)));
    },
    jupiter: function (x, y, z, lat, lon) {
      var t = fbm(x * 3, y * 9, z * 3, 51, 4), b = Math.sin(y * 16 + t * 2.6) * 0.5 + 0.5, b2 = Math.sin(y * 37 + t * 4) * 0.5 + 0.5;
      var c = mix([236, 218, 186], [176, 114, 76], b * 0.8 + 0.1); c = mix(c, [247, 240, 226], ss(0.55, 0.9, b2) * 0.5);
      var dl = lonw(lon, 1.3) / 0.26, dy = (lat + 0.4) / 0.1, dd = dl * dl + dy * dy; if (dd < 1) c = mix(c, [196, 84, 56], (1 - dd) * 0.95);
      return c;
    },
    saturno: function (x, y, z) { var t = fbm(x * 2, y * 7, z * 2, 61, 3), b = Math.sin(y * 20 + t * 1.5) * 0.5 + 0.5; return mix(mix([224, 198, 148], [196, 166, 118], b), [242, 228, 192], ss(0.6, 0.9, fbm(x, y * 12, z, 62, 2)) * 0.5); },
    urano: function (x, y, z) { return mix([138, 204, 214], [168, 228, 232], fbm(x, y * 4, z, 71, 3) * 1.2 - 0.1); },
    neptuno: function (x, y, z, lat, lon) {
      var n = fbm(x * 2, y * 6, z * 2, 81, 4), c = mix([30, 64, 190], [72, 128, 235], n * 1.2), dl = lonw(lon, 2.2) / 0.3, dy = (lat + 0.35) / 0.12, dd = dl * dl + dy * dy;
      if (dd < 1) c = mix(c, [14, 30, 120], (1 - dd) * 0.8); return mix(c, [190, 215, 255], ss(0.7, 0.9, fbm(x * 3, y * 14, z * 3, 82, 3)) * 0.25);
    },
    pluton: function (x, y, z, lat, lon) {
      var n = fbm(x * 3.5, y * 3.5, z * 3.5, 91, 5), c = mix([118, 78, 58], [196, 166, 136], n * 1.3);
      var a = Math.pow(lonw(lon, 3.15) / 0.5, 2) + Math.pow((lat - 0.22) / 0.4, 2), b = Math.pow(lonw(lon, 3.7) / 0.42, 2) + Math.pow((lat - 0.05) / 0.45, 2);
      var heart = Math.max(a < 1 ? 1 - a : 0, b < 1 ? 1 - b : 0); return mix(c, [238, 224, 206], heart * 0.9);
    },
    luna: function (x, y, z) {
      var n = fbm(x * 2, y * 2, z * 2, 101, 4), g = 150 + 70 * (n - 0.5); g *= 1 - 0.38 * ss(0.5, 0.6, fbm(x * 1.5 + 4, y * 1.5, z * 1.5, 102, 4)); g += 26 * ss(0.8, 0.9, vn(x * 18, y * 18, z * 18, 103)); return [g, g, g * 0.98];
    },
    io: function (x, y, z) { var c = mix([232, 208, 92], [224, 140, 56], fbm(x * 3, y * 3, z * 3, 111, 4) * 1.3 - 0.1); return mix(c, [60, 42, 34], ss(0.78, 0.85, vn(x * 9, y * 9, z * 9, 112)) * 0.9); },
    europa: function (x, y, z) { var c = mix([228, 218, 198], [244, 238, 228], fbm(x * 3, y * 3, z * 3, 121, 3)); var l = Math.abs(fbm(x * 6, y * 6, z * 6, 122, 3) - 0.5); return mix(c, [150, 98, 72], (1 - ss(0.0, 0.035, l)) * 0.8); },
    ganimedes: function (x, y, z) { var c = mix([112, 102, 92], [176, 166, 154], fbm(x * 3, y * 3, z * 3, 131, 5)); return mix(c, [220, 220, 215], ss(0.78, 0.86, vn(x * 14, y * 14, z * 14, 132)) * 0.7); },
    calisto: function (x, y, z) { var g = 88 + 40 * fbm(x * 4, y * 4, z * 4, 141, 4); g += 60 * ss(0.8, 0.9, vn(x * 20, y * 20, z * 20, 142)); return [g * 1.05, g * 0.97, g * 0.88]; },
    titan: function (x, y, z) { return mix([200, 140, 56], [226, 176, 90], fbm(x * 2, y * 5, z * 2, 151, 3)); },
    triton: function (x, y, z) { var c = mix([214, 198, 198], [236, 224, 220], fbm(x * 3, y * 3, z * 3, 161, 4)); return mix(c, [120, 100, 100], ss(0.7, 0.8, vn(x * 10, y * 3, z * 10, 162)) * 0.55); },
    caronte: function (x, y, z) { var g = 118 + 56 * fbm(x * 3, y * 3, z * 3, 171, 5); return mix([g, g * 0.95, g * 0.92], [158, 78, 60], ss(0.8, 0.95, y)); }
  };
  function ringTex(kind) {
    var w = 1024, cv = document.createElement('canvas'); cv.width = w; cv.height = 4; var cx = cv.getContext('2d'), im = cx.createImageData(w, 4), d = im.data;
    for (var i = 0; i < w; i++) {
      var u = i / w, a = 0, col = [200, 182, 150], n = vn(i * 0.35, 3, 7, 5) * 0.5 + vn(i * 0.04, 1, 1, 6) * 0.5;
      if (kind === 'saturno') {
        var R = 1.24 + u * 1.03;
        if (R < 1.53) { a = 0.16 + 0.12 * n; col = [150, 140, 125]; }
        else if (R < 1.95) { a = 0.55 + 0.4 * n; col = mix([180, 160, 128], [225, 205, 170], n); }
        else if (R < 2.02) a = 0.05;
        else { a = 0.42 + 0.3 * n; col = mix([190, 172, 140], [215, 198, 165], n); if (Math.abs(R - 2.215) < 0.006) a = 0.02; }
        if (u < 0.01 || u > 0.985) a *= 0.4;
      } else {
        var R2 = 1.55 + u * 0.5, hit = [1.64, 1.69, 1.73, 1.78, 1.84, 1.9, 1.96, 2.0], k; col = [150, 160, 165];
        for (k = 0; k < hit.length; k++) a = Math.max(a, 0.5 * (1 - ss(0, 0.007 + (k === 7 ? 0.006 : 0), Math.abs(R2 - hit[k]))));
      }
      for (var r = 0; r < 4; r++) { var o = (r * w + i) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(clamp(a, 0, 1) * 255); }
    }
    cx.putImageData(im, 0, 0); return new T.CanvasTexture(cv);
  }
  function glowTex(inner, outer) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var cx = cv.getContext('2d'), g = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner); g.addColorStop(0.28, outer); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(0, 0, 256, 256); return new T.CanvasTexture(cv);
  }
  function ringGeo(inner, outer) {
    var g = new T.RingGeometry(inner, outer, 128, 1), p = g.attributes.position, uv = g.attributes.uv, v = new T.Vector3();
    for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); } return g;
  }
  function glowMat(col, pw) {
    return new T.ShaderMaterial({ uniforms: { c: { value: new T.Color(col) }, p: { value: pw }, k: { value: 1 } },
      vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 c;uniform float p;uniform float k;varying vec3 vN;varying vec3 vV;void main(){float i=pow(clamp(-dot(vN,vV)*1.9,0.,1.),p);gl_FragColor=vec4(c*i,i*k);}',
      side: T.BackSide, blending: T.AdditiveBlending, transparent: true, depthWrite: false });
  }

  /* ---------------- Estado y escena ---------------- */
  var KS = 4.2 / 695700;                       // escala «real» de tamaños (el Sol mide 4,2 unidades)
  function disp(a) { return 6 + 8.6 * Math.sqrt(a); }   // distancia comprimida (UA → unidades)
  var S = { t: (Date.now() - Date.UTC(2000, 0, 1, 12)) / 864e5, rate: 30, run: true, sel: null, follow: null, goal: null, manual: false, lastStage: -1, mode: 'dida', game: null, hover: null, prevF: null };
  var kit, scene, camera, renderer, labelR, controls, ray, mouse, BODY = {}, ITEMS = [], bodyIds = [], tmp = V3(0, 0, 0), tmp2 = V3(0, 0, 0), wedges = [], beltPts = {}, stars, labelsAll = true, layerOn = {}, rateSel, dateEl, playBtn, selBox, kState = { sel: 'tierra', a: 4 };
  var RATES = [[1, "1 day/s"], [10, "10 days/s"], [30, "1 month/s"], [182.6, "6 months/s"], [365.25, "1 year/s"], [3652.5, "10 years/s"]];

  function solveE(M, e) { var E = M + e * Math.sin(M); for (var k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
  function orbitPoint(d, E, out) {
    var xp = d.a * (Math.cos(E) - d.ec), yp = d.a * Math.sqrt(1 - d.ec * d.ec) * Math.sin(E), w = (d.vp - d.om) * rad, i = d.i * rad, O = d.om * rad;
    var x1 = xp * Math.cos(w) - yp * Math.sin(w), y1 = xp * Math.sin(w) + yp * Math.cos(w), y2 = y1 * Math.cos(i), z2 = y1 * Math.sin(i);
    var X = x1 * Math.cos(O) - y2 * Math.sin(O), Y = x1 * Math.sin(O) + y2 * Math.cos(O), k = d.kf;
    return out.set(X * k, z2 * k, -Y * k);
  }
  function helio(d, t, out) { var M = (((d.L - d.vp) + (360 / d.T) * t) * rad) % TAU; return orbitPoint(d, solveE(M, d.ec), out); }
  function lightTime(a) {
    var s = a * 499.005; if (s < 90) return Math.round(s) + ' s'; if (s < 5400) return Math.floor(s / 60) + ' min ' + Math.round(s % 60) + ' s'; return Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min';
  }
  function radiusOf(id) { var d = B[id]; return S.mode === 'escala' ? d.rkm * KS : d.Rd; }
  function outerOf(id) { var d = B[id]; return d.ring === 'saturno' ? 2.33 : d.ring === 'urano' ? 2.05 : 1; }

  function item(id) {
    var it = { id: id, k: 1, fns: [], glow: 0 }; ITEMS.push(it); BODY[id] = it; return it;
  }
  function regMat(it, m, glow) {
    var b = { o: m.opacity, t: m.transparent };
    it.fns.push(function (k) {
      if (glow) { m.uniforms.k.value = k; return; }
      var tr = b.t || k < 0.99; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = b.o * k; m.depthWrite = !tr || b.t ? m.depthWrite : true;
    });
  }
  function circleLine(color, op, n) {
    var pts = [], i; for (i = 0; i < (n || 96); i++) { var a = i / (n || 96) * TAU; pts.push(V3(Math.cos(a), 0, Math.sin(a))); }
    var l = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: color, transparent: true, opacity: op, depthWrite: false })); return l;
  }
  function makeLabel(it, d) {
    var el = document.createElement('div'); el.className = 'sl-label'; el.innerHTML = '<i style="background:' + d.col + '"></i>' + d.n; el.style.pointerEvents = 'auto';
    el.addEventListener('click', function () { onPick(it.id); });
    var o = new T.CSS2DObject(el); it.orbit.add(o); it.lab = { o: o, d: el };
  }

  function build() {
    var cont = kit.viewport;
    scene = new T.Scene(); scene.background = new T.Color(0x04060b);
    camera = new T.PerspectiveCamera(42, 1, 0.02, 2600);
    renderer = new T.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); cont.appendChild(renderer.domElement);
    labelR = new T.CSS2DRenderer(); labelR.domElement.className = 'labels-layer'; cont.appendChild(labelR.domElement);
    controls = new T.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false; controls.minDistance = 0.12; controls.maxDistance = 420; controls.autoRotateSpeed = 0.8;
    controls.addEventListener('start', function () { S.goal = null; S.manual = true; });
    ray = new T.Raycaster(); ray.params.Points.threshold = 0.9; mouse = new T.Vector2();
    scene.add(new T.AmbientLight(0x8a96b0, 0.36));
    var sun = new T.PointLight(0xfff2dc, 1.4, 0, 0); scene.add(sun);

    // estrellas de fondo
    var sp = [], sc = [], i, c = new T.Color();
    for (i = 0; i < 2600; i++) { var u = Math.random() * 2 - 1, a = Math.random() * TAU, r = Math.sqrt(1 - u * u); sp.push(r * Math.cos(a) * 1500, u * 1500, r * Math.sin(a) * 1500); c.setHSL(0.55 + Math.random() * 0.15, 0.3, 0.55 + Math.random() * 0.4); sc.push(c.r, c.g, c.b); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new T.Float32BufferAttribute(sc, 3));
    stars = new T.Points(sg, new T.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(stars);

    var texCache = {};
    function tex(name, w, h) { return texCache[name] || (texCache[name] = mkTex(w || 512, h || 256, TEX[name])); }
    var markGeo = new T.BufferGeometry().setFromPoints([V3(0, 0, 0)]);
    var selTex = (function () { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.arc(32, 32, 26, 0, TAU); x.stroke(); return new T.CanvasTexture(cv); })();

    D.IDS.forEach(function (id) {
      var d = B[id], it = item(id); bodyIds.push(id); it.def = d;
      it.orbit = new T.Group(); scene.add(it.orbit);
      if (d.belt) { buildBelt(it, d); return; }
      if (d.a) { d.kf = disp(d.a) / d.a; }
      it.tilt = new T.Group(); it.sz = new T.Group(); it.orbit.add(it.tilt); it.tilt.add(it.sz); it.tilt.rotation.z = d.obl * rad;
      it.spin = new T.Group(); it.sz.add(it.spin);
      var small = d.grp === 'sat' || id === 'pluton' || id === 'mercurio';
      var map = tex(d.tex, small ? 256 : 512, small ? 128 : 256);
      var mat = id === 'sol' ? new T.MeshBasicMaterial({ map: map }) : new T.MeshStandardMaterial({ map: map, roughness: 0.95, metalness: 0 });
      it.mesh = new T.Mesh(new T.SphereGeometry(1, 48, 32), mat); it.spin.add(it.mesh); regMat(it, mat);
      if (d.clouds) { var cm = new T.MeshStandardMaterial({ map: tex('nubes'), transparent: true, roughness: 1, depthWrite: false }); it.cloud = new T.Mesh(new T.SphereGeometry(1.012, 48, 32), cm); it.spin.add(it.cloud); regMat(it, cm); }
      if (d.atm) { var gm = glowMat(d.atm[0], d.atm[1]); it.sz.add(new T.Mesh(new T.SphereGeometry(1.13, 40, 28), gm)); regMat(it, gm, true); }
      if (d.ring) {
        var o = outerOf(id), inner = d.ring === 'saturno' ? 1.24 : 1.55, rm = new T.MeshStandardMaterial({ map: ringTex(d.ring), transparent: true, side: T.DoubleSide, roughness: 1, depthWrite: false });
        it.ring = new T.Mesh(ringGeo(inner, o > 2.3 ? 2.27 : 2.05), rm); it.ring.rotation.x = -Math.PI / 2; it.sz.add(it.ring); regMat(it, rm);
      }
      if (id === 'sol') {
        var gs = new T.SpriteMaterial({ map: glowTex('rgba(255,225,140,1)', 'rgba(255,150,40,.35)'), blending: T.AdditiveBlending, transparent: true, depthWrite: false });
        it.glow = new T.Sprite(gs); it.glow.scale.set(5.2, 5.2, 1); it.sz.add(it.glow); regMat(it, gs);
      }
      // eje de rotación
      var ax = new T.Line(new T.BufferGeometry().setFromPoints([V3(0, -1.9, 0), V3(0, 1.9, 0)]), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
      ax.visible = false; it.axis = ax; it.tilt.add(ax); it.sz.add(ax);
      // órbita
      var col = new T.Color(d.col).lerp(new T.Color(0xffffff), 0.25);
      if (d.a) {
        var pts = [], k; for (k = 0; k <= 360; k++) pts.push(orbitPoint(d, k / 360 * TAU, V3(0, 0, 0)));
        it.line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false })); scene.add(it.line); it.lineOp = 0.3; regMat(it, it.line.material);
      } else if (d.parent) {
        it.line = circleLine(col, 0.28); it.line.rotation.x = d.inc * rad; BODY[d.parent].orbit.add(it.line); it.lineOp = 0.28; regMat(it, it.line.material);
        it.ph = Math.random() * TAU; it.parent = BODY[d.parent];
      }
      d.rs = d.rot > 0 ? Math.max(0.8 * 10 / d.rot, 0.05) : 0;  // velocidad visual de giro (rad/s)
      // marcador de píxel constante (modo a escala)
      var pm = new T.PointsMaterial({ color: new T.Color(d.col), size: d.grp === 'sat' ? 3 : 5, sizeAttenuation: false, transparent: true, depthTest: true }); it.mark = new T.Points(markGeo, pm); it.orbit.add(it.mark); it.mark.visible = false; regMat(it, pm);
      // anillo de selección
      var ssm = new T.SpriteMaterial({ map: selTex, sizeAttenuation: false, transparent: true, depthTest: false, opacity: 0.9 }); it.selr = new T.Sprite(ssm); it.selr.scale.set(0.07, 0.07, 1); it.selr.visible = false; it.orbit.add(it.selr);
      // esfera invisible para clic
      it.pick = new T.Mesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ visible: false })); it.pick.userData.item = id; it.orbit.add(it.pick);
      makeLabel(it, d);
    });
    // satélites: aplican etiquetas ocultas por defecto; órbitas de los planetas ya en escena
    buildWedges();
    // sol: luz
    BODY.sol.orbit.add(sun); sun.position.set(0, 0, 0);
    applyMode('dida');
  }

  function buildBelt(it, d) {
    var isA = it.id === 'asteroides', n = isA ? 2600 : 3600, pos = [], i, a0 = isA ? 2.1 : 36, a1 = isA ? 3.3 : 56;
    for (i = 0; i < n; i++) {
      var a = a0 + Math.pow(Math.random(), isA ? 1 : 1.4) * (a1 - a0), r = disp(a), th = Math.random() * TAU, sp = isA ? 0.55 : 3.2;
      pos.push(Math.cos(th) * r, (Math.random() + Math.random() + Math.random() - 1.5) * sp * (isA ? 1 : 1 + 0.3 * r / 40), Math.sin(th) * r);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    var m = new T.PointsMaterial({ color: new T.Color(d.col).lerp(new T.Color(0xffffff), 0.2), size: isA ? 2.1 : 2.3, sizeAttenuation: false, transparent: true, opacity: isA ? 0.85 : 0.6, depthWrite: false });
    var p = new T.Points(g, m); p.userData.item = it.id; it.orbit.add(p); it.pts = p; regMat(it, m); it.spinRate = TAU / (365.25 * (isA ? 4.4 : 280));
    it.lab0 = V3(isA ? 0 : 0, 0.6, isA ? disp(2.7) : -disp(43));
    var el = document.createElement('div'); el.className = 'sl-label'; el.innerHTML = '<i style="background:' + d.col + '"></i>' + d.n; el.style.pointerEvents = 'auto'; el.addEventListener('click', function () { onPick(it.id); });
    var o = new T.CSS2DObject(el); o.position.copy(it.lab0); it.orbit.add(o); it.lab = { o: o, d: el };
  }

  function buildWedges() {
    [0xffd25a, 0x5ad2ff].forEach(function (col, k) {
      var N = 28, g = new T.BufferGeometry(), pos = new Float32Array((N + 2) * 3), idx = [], i;
      for (i = 1; i <= N; i++) idx.push(0, i, i + 1);
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx);
      var m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false })); m.visible = false; m.frustumCulled = false; scene.add(m); wedges.push({ m: m, N: N });
    });
  }
  function setWedge(w, d, t0, t1) {
    var p = w.m.geometry.attributes.position.array, k; p[0] = p[1] = p[2] = 0;
    for (k = 0; k <= w.N; k++) { helio(d, t0 + (t1 - t0) * k / w.N, tmp); p[3 + k * 3] = tmp.x; p[4 + k * 3] = tmp.y; p[5 + k * 3] = tmp.z; }
    w.m.geometry.attributes.position.needsUpdate = true;
  }

  function applyMode(mode) {
    S.mode = mode;
    bodyIds.forEach(function (id) {
      var it = BODY[id], d = it.def; if (d.belt) return;
      var R = radiusOf(id); it.sz.scale.setScalar(R); it.R = R;
      if (it.mark) it.mark.visible = mode === 'escala' && id !== 'sol';
      if (it.lab) it.lab.o.position.set(0, R * (it.ring ? 1.0 : 1.05), 0);
      if (d.parent) { it.orR = mode === 'escala' ? d.orb[1] : d.orb[0]; it.line.scale.setScalar(it.orR); }
      if (id === 'sol' && it.glow) it.glow.scale.setScalar(R * 2.55);
    });
  }

  /* ---------------- Actualización por fotograma ---------------- */
  /* Límite visual de rapidez angular: bajo W1 rad/s el movimiento es exacto; por encima se satura suavemente hacia WM. */
  var W1 = 0.3, WM = 0.9;
  function sat(w) { return w <= W1 ? w : W1 + (WM - W1) * (1 - Math.exp(-(w - W1) / (WM - W1))); }
  function updateBodies(dt) {
    bodyIds.forEach(function (id) {
      var it = BODY[id], d = it.def;
      if (d.belt) { if (S.run) it.pts.rotation.y -= dt * sat(S.rate * it.spinRate); return; }
      var tv = S.t;
      if (d.a || d.parent) {
        var n = TAU / Math.abs(d.a ? d.T : d.P), wr = n * S.rate;
        if (it.tv == null || wr <= W1) it.tv = S.t; else if (S.run) it.tv += sat(wr) / n * dt;
        tv = it.tv;
      }
      if (d.a) helio(d, tv, it.orbit.position);
      else if (d.parent) {
        var th = TAU * (tv / d.P) + it.ph, inc = d.inc * rad, r = it.orR, x = Math.cos(th) * r, z = Math.sin(th) * r;
        it.orbit.position.set(x, z * Math.sin(inc), z * Math.cos(inc)).add(it.parent.orbit.position);
      }
      if (S.run) { var sp = d.rs * dt; if (it.spin) it.spin.rotation.y += sp; if (it.cloud) it.cloud.rotation.y += sp * 0.12; }
    });
    // áreas de Kepler
    var showK = (S.stage === 6 && !S.manual) || layerOn.kep;
    wedges.forEach(function (w) { w.m.visible = !!showK; });
    if (showK) { var m = B.mercurio, dl = m.T / 10, tm = BODY.mercurio.tv == null ? S.t : BODY.mercurio.tv; setWedge(wedges[0], m, tm - dl, tm); setWedge(wedges[1], m, tm - m.T / 2 - dl, tm - m.T / 2); }
  }

  function updateLook(dt) {
    var foc = S.focus, sel = S.sel, hov = S.hover, cam = camera.position;
    ITEMS.forEach(function (it) {
      var d = it.def, on = it.vis !== false;
      var inF = !foc || foc.indexOf(it.id) >= 0, kt = 1;
      if (sel) kt = (it.id === sel || (d.parent && d.parent === sel) || (BODY[sel] && BODY[sel].def.parent === it.id)) ? 1 : 0.2; else if (!inF) kt = 0.16;
      if (it.id === 'sol') kt = Math.max(kt, 0.75);
      it.k += (kt - it.k) * (1 - Math.exp(-dt * 8));
      if (Math.abs(it.k - (it.kShown == null ? -1 : it.kShown)) > 0.004) { it.kShown = it.k; it.fns.forEach(function (f) { f(it.k); }); }
      if (it.line) { it.line.visible = on && layerOn.orb !== false; it.line.material.opacity = (it.id === sel ? 0.85 : it.lineOp) * it.k * (it.id === sel ? 1 : 1); }
      if (it.axis) it.axis.visible = !!layerOn.axis && on;
            if (it.pick) { it.orbit.getWorldPosition(tmp); var dist = cam.distanceTo(tmp); it.pick.scale.setScalar(Math.max(it.R * 1.08, dist * 0.022)); it.pick.visible = false; it.selr.visible = it.id === sel && on && dist > it.R * 12 + 2; }
      if (it.lab) {
        var show = on && !S.game && labelsAll;
        if (d.grp === 'sat') { it.orbit.getWorldPosition(tmp); var pp = it.parent.orbit.position; show = on && !S.game && layerOn.lab !== false && (it.id === sel || it.id === hov || sel === d.parent || cam.distanceTo(pp) < (it.parent.R || 1) * 9 + 8); }
        else if (S.game) show = false;
        it.lab.o.visible = !!show;
        if (show) { it.lab.d.style.opacity = String(clamp(it.k, 0.14, 1)); it.lab.d.classList.toggle('sel', it.id === sel); it.lab.d.classList.toggle('foc', !!(foc && foc.indexOf(it.id) >= 0 && !sel)); }
      }
    });
  }

  /* ---------------- Cámara ---------------- */
  function bodyPos(id, out) { if (!id || id === 'origin') return out.set(0, 0, 0); return out.copy(BODY[id].orbit.position); }
  function setGoal(t, dir, dist) { S.follow = t === 'origin' ? null : t; S.prevF = null; S.goal = { t: t, dir: V3(dir[0], dir[1], dir[2]).normalize(), d: dist }; }
  function viewDist(id) { var d = B[id]; if (d.belt) return id === 'asteroides' ? 56 : 150; var R = radiusOf(id) * outerOf(id); return Math.max(R * (id === 'sol' ? 4.6 : 4.4), d.grp === 'sat' ? 0.3 : 0.25); }
  function flyTo(id) {
    var d = B[id]; if (!d) return;
    if (d.belt) { setGoal('origin', [0, 0.75, 0.6], viewDist(id)); return; }
    bodyPos(id, tmp); var o = tmp.clone(); o = o.length() > 1e-3 ? o.normalize() : V3(1, 0, 0);
    var dir = id === 'sol' ? [0.3, 0.28, 1] : [-o.x * 0.35 - o.z * 0.85, 0.42, -o.z * 0.35 + o.x * 0.85];
    setGoal(id, dir, viewDist(id));
  }
  function stepCamera(dt) {
    if (S.follow) { bodyPos(S.follow, tmp); if (S.prevF) { tmp2.copy(tmp).sub(S.prevF); camera.position.add(tmp2); controls.target.add(tmp2); } S.prevF = (S.prevF || V3(0, 0, 0)).copy(tmp); } else S.prevF = null;
    if (S.goal) {
      var g = S.goal, k = 1 - Math.exp(-dt * 3.2); bodyPos(g.t, tmp); var want = tmp.clone().add(g.dir.clone().multiplyScalar(g.d));
      camera.position.lerp(want, k); controls.target.lerp(tmp, k);
      if (camera.position.distanceTo(want) < Math.max(0.03, g.d * 0.01) && controls.target.distanceTo(tmp) < 0.03) S.goal = null;
    }
    controls.update();
  }
  function resize() {
    if (!renderer) return; var cont = kit.viewport, w = cont.clientWidth, h = cont.clientHeight; if (w < 2 || h < 2) return;
    camera.aspect = w / h; camera.zoom = clamp(camera.aspect / 1.2, 0.5, 1);
    var off = w > 900 ? Math.min(90, w * 0.08) : 0; if (off) camera.setViewOffset(w, h, -off, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h); labelR.setSize(w, h);
  }

  /* ---------------- Selección ---------------- */
  function pickAt(cx, cy) {
    var r = renderer.domElement.getBoundingClientRect(); mouse.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera);
    var best = null, bd = 1e9, belt = null, objs = [];
    ITEMS.forEach(function (it) { if (it.vis === false) return; if (it.pick) { it.pick.visible = true; it.pick.updateMatrixWorld(true); objs.push(it.pick); } if (it.pts) objs.push(it.pts); });
    var hits = ray.intersectObjects(objs, false);
    ITEMS.forEach(function (it) { if (it.pick) it.pick.visible = false; });
    hits.forEach(function (h) { var id = h.object.userData.item; if (!id) return; if (B[id].belt) { if (!belt) belt = id; } else if (h.distance < bd) { bd = h.distance; best = id; } });
    return best || belt;
  }
  function onPick(id) { if (S.game && S.gameClick && S.gameClick(id)) return; choose(id && S.sel === id ? null : id); }
  function choose(id, quiet) {
    if (id && !B[id]) return;
    S.manual = !!id; S.sel = id; S.focus = null;
    if (id) { if (!quiet) flyTo(id); } else { S.lastStage = -1; S.follow = null; }
    paintSel(); document.querySelectorAll('.comp-btn').forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); });
    if (kit) kit.refresh();
  }
  function infoHTML(id) {
    var b = B[id], rows = b.st.slice();
    if (b.a) rows.splice(4, 0, ["Sunlight", lightTime(b.a) + " to arrive"]);
    return '<div class="sel-head"><span class="sel-dot" style="background:' + b.col + '"></span><h3>' + b.n + '</h3></div>' +
      '<div class="chips"><span class="chip" style="--cc:' + D.GCOL[b.grp] + '">' + D.GROUPS[b.grp] + '</span><span class="chip">' + b.type + '</span></div>' +
      '<div class="stats">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>' +
      '<p>' + b.d + '</p><p><b>' + b.xl + '.</b> ' + b.x + "</p><p><b>Exploration.</b> " + b.e + "</p><p class=\"fun\"><b>Did you know…?</b> " + b.c + '</p>' +
      "<div class=\"sel-btns\"><button class=\"btn\" data-a=\"fly\">Zoom in</button><button class=\"btn\" data-a=\"clear\">Clear selection</button></div>";
  }
  function paintSel() {
    if (!selBox) return;
    if (!S.sel) { selBox.innerHTML = "<p class=\"muted\">Click on a body in the 3D model (or on its label), or choose it in the <b>Fact sheets</b> tab, to see its data: size, mass, gravity, period, temperature and more.</p>"; return; }
    selBox.innerHTML = infoHTML(S.sel);
    selBox.querySelector('[data-a="fly"]').onclick = function () { flyTo(S.sel); };
    selBox.querySelector('[data-a="clear"]').onclick = function () { choose(null); };
  }

  /* ---------------- Pestañas ---------------- */
  function buildFichas(el) {
    var c = kit.ui.card("Fact sheets of the bodies");
    c.insertAdjacentHTML('beforeend', "<p class=\"muted\">Press one to zoom in and read its fact sheet in the Guide tab. “Back to the lesson” resumes the tour.</p>");
    D.ORDER.forEach(function (gid) {
      var ids = D.IDS.filter(function (id) { return B[id].grp === gid; }), blk = document.createElement('div'); blk.className = 'comp-grp';
      blk.innerHTML = '<div class="comp-h" style="--cc:' + D.GCOL[gid] + '"><i></i>' + D.GROUPS[gid] + '</div>'; var row = document.createElement('div'); row.className = 'comp-row';
      ids.forEach(function (id) { var b = document.createElement('button'); b.className = 'comp-btn'; b.dataset.id = id; b.innerHTML = '<i style="background:' + B[id].col + '"></i>' + B[id].n; b.onclick = function () { choose(S.sel === id ? null : id); kit.selectTab('main'); }; row.appendChild(b); });
      blk.appendChild(row); c.appendChild(blk);
    });
    var back = document.createElement('button'); back.className = 'btn primary'; back.textContent = "Back to the lesson"; back.onclick = function () { choose(null); kit.selectTab('main'); kit.seekStage && kit.seekStage(kit.state.stage); }; c.appendChild(back); el.appendChild(c);
  }
  function buildCompare(el) {
    var c0 = kit.ui.card("Size of the planets (to scale)"); el.appendChild(c0);
    var order = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno'], ab = { mercurio: 'Me', venus: 'Ve', tierra: 'Ti', marte: 'Ma', jupiter: "Ju", saturno: 'Sa', urano: 'Ur', neptuno: 'Ne' };
    kit.ui.canvas(c0, { height: 134, label: "Relative size of the eight planets", draw: function (ctx, W, Hh, col) {
      var sum = 0, gap = 6; order.forEach(function (id) { sum += B[id].rkm * 2; }); var s = (W - 16 - gap * 7) / sum, x = 8, mid = 54;
      order.forEach(function (id) { var r = Math.max(B[id].rkm * s, 1.6); ctx.beginPath(); ctx.arc(x + r, mid, r, 0, TAU); ctx.fillStyle = B[id].col; ctx.fill(); ctx.fillStyle = col.dark ? '#c9d4df' : '#35414d'; ctx.font = '700 11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ab[id], x + r, id === 'venus' || id === 'marte' ? 126 : 112); x += r * 2 + gap; });
    } });
    c0.insertAdjacentHTML('beforeend', "<p class=\"muted\">At this scale the Sun would measure <b>about 10 times the width of Jupiter</b>, and Earth would fit more than 100 times across the Sun.</p>");
    var c1 = kit.ui.card("Planets in numbers", kit.ui.table(["Planet", "Diam. (km)", "Mass (M⊕)", 'g (m/s²)', "a (AU)", "Year", "Day", "Moons"], D.TBL.map(function (r) { return [B[r[0]].n].concat(r.slice(1)); }), 'cmp')); el.appendChild(c1);
    c1.insertAdjacentHTML('beforeend', "<p class=\"muted\">Rocky planets are small and dense; the giants, enormous and of low density, with many satellites. M⊕ = Earth mass; a = semi-major axis; “Year” = orbital period; “Day” = rotation period.</p>");
    var c2 = kit.ui.card("How much would you weigh on each world?"); el.appendChild(c2);
    var tb = document.createElement('div'), wmass = 60;
    function wt() {
      var ids = ['sol', 'mercurio', 'venus', 'tierra', 'luna', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton'];
      tb.innerHTML = kit.ui.table(["Body", 'g (m/s²)', "Weight (N)", "Equivalent to (kg)", "Escape v. (km/s)"], ids.map(function (id) { var b = B[id]; return [b.n, fmt(b.g, b.g < 10 ? 2 : 1), thou(wmass * b.g), fmt(wmass * b.g / 9.81, 0), fmt(b.ve, b.ve < 10 ? 2 : 1)]; }), 'cmp');
    }
    c2.insertAdjacentHTML('beforeend', "<p class=\"muted\">Your <b>mass</b> is the same everywhere; your <b>weight</b> (W = m·g) changes with gravity. “Equivalent to” is the mass that would give that weight on Earth.</p>");
    c2.appendChild(kit.ui.slider({ label: "Your mass", min: 20, max: 120, step: 1, value: 60, format: function (v) { return v + ' kg'; }, onInput: function (v) { wmass = v; wt(); } })); c2.appendChild(tb); wt();
  }
  function buildKepler(el) {
    var c = kit.ui.card("Kepler's third law"); el.appendChild(c);
    c.insertAdjacentHTML('beforeend', "<p>The square of the orbital period is proportional to the cube of the semi-major axis: <b>T² = a³</b> (T in years, a in AU). On a log–log plot the planets lie on a line of slope 3/2.</p>");
    var pl = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton'];
    var x0 = -0.6, x1 = 1.85, y0 = -1, y1 = 2.6, cv, rd = document.createElement('div'); rd.className = 'kread';
    function layout(W, Hh) { return { L: 38, R: 14, Tp: 12, Bm: 30, w: W - 52, h: Hh - 42 }; }
    function X(a, g) { return g.L + (Math.log10(a) - x0) / (x1 - x0) * g.w; }
    function Y(t, g) { return g.Tp + (1 - (Math.log10(t) - y0) / (y1 - y0)) * g.h; }
    function readout() {
      var b = B[kState.sel], Ty = b.T / 365.25; rd.innerHTML = '<b>' + b.n + '</b>: a = ' + fmt(b.a, 3) + " AU · T = " + fmt(Ty, Ty < 10 ? 3 : 1) + " years → <b>T²/a³ = " + fmt(Ty * Ty / (b.a * b.a * b.a), 3) + '</b>';
    }
    cv = kit.ui.canvas(c, { height: 270, label: "Log–log plot of period versus semi-major axis", draw: function (ctx, W, Hh, col) {
      var g = layout(W, Hh), ink = col.dark ? '#dbe4ee' : '#27323f', mut = col.dark ? '#8b99a8' : '#66727f', grid = col.dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)';
      ctx.font = '11px system-ui,sans-serif'; ctx.lineWidth = 1; ctx.textAlign = 'center';
      [0.5, 1, 2, 5, 10, 20, 50].forEach(function (a) { var x = X(a, g); ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(x, g.Tp); ctx.lineTo(x, g.Tp + g.h); ctx.stroke(); ctx.fillStyle = mut; ctx.fillText(String(a), x, g.Tp + g.h + 14); });
      ctx.textAlign = 'right'; [0.1, 1, 10, 100, 250].forEach(function (t) { var y = Y(t, g); ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(g.L, y); ctx.lineTo(g.L + g.w, y); ctx.stroke(); ctx.fillStyle = mut; ctx.fillText(String(t), g.L - 5, y + 4); });
      ctx.textAlign = 'center'; ctx.fillStyle = mut; ctx.fillText("semi-major axis a (AU)", g.L + g.w / 2, Hh - 3); ctx.save(); ctx.translate(11, g.Tp + g.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("period T (years)", 0, 0); ctx.restore();
      ctx.strokeStyle = col.dark ? '#ffb340' : '#b45309'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(Math.pow(10, x0), g), Y(Math.pow(Math.pow(10, x0), 1.5), g)); ctx.lineTo(X(Math.pow(10, x1), g), Y(Math.pow(Math.pow(10, x1), 1.5), g)); ctx.stroke();
      pl.forEach(function (id) { var b = B[id], x = X(b.a, g), y = Y(b.T / 365.25, g), on = id === kState.sel; ctx.beginPath(); ctx.arc(x, y, on ? 6.5 : 4.5, 0, TAU); ctx.fillStyle = b.col; ctx.fill(); ctx.lineWidth = on ? 2 : 1; ctx.strokeStyle = on ? ink : 'rgba(0,0,0,.4)'; ctx.stroke(); ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.font = (on ? '700 ' : '') + '11px system-ui,sans-serif'; ctx.fillText(b.n, x + 8, y + 14 * (id === 'pluton' ? -0.2 : 0.2)); });
      var hx = X(kState.a, g), hy = Y(Math.pow(kState.a, 1.5), g); ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.PI / 4); ctx.fillStyle = col.dark ? '#7be0a0' : '#15803d'; ctx.fillRect(-5, -5, 10, 10); ctx.restore();
    }, pointer: function (px, py, kind) {
      if (kind !== 'down' && kind !== 'drag') return; var s = cv.size(), g = layout(s.w, s.h), best = null, bd = 1e9;
      pl.forEach(function (id) { var b = B[id], d = Math.hypot(X(b.a, g) - px, Y(b.T / 365.25, g) - py); if (d < bd) { bd = d; best = id; } }); if (best && bd < 40) { kState.sel = best; readout(); cv.redraw(); }
    } });
    c.appendChild(rd); readout();
    c.insertAdjacentHTML('beforeend', "<p class=\"muted\">Tap a planet on the chart to see T²/a³. The green diamond is your imaginary planet (below).</p>");
    var c2 = kit.ui.card("An imaginary planet"); el.appendChild(c2); var out = document.createElement('div'); out.className = 'kread';
    function hyp() { var a = kState.a, Ty = Math.pow(a, 1.5); out.innerHTML = 'a = <b>' + fmt(a, 2) + " AU</b> → T = a<sup>3/2</sup> = <b>" + fmt(Ty, Ty < 10 ? 2 : 1) + " years</b> · mean orbital speed ≈ <b>" + fmt(29.78 / Math.sqrt(a), 1) + " km/s</b> · sunlight: " + lightTime(a); cv && cv.redraw(); }
    c2.insertAdjacentHTML('beforeend', "<p class=\"muted\">Move the semi-major axis and calculate its year with T = a<sup>3/2</sup>. For nearly circular orbits, v ≈ 29.78 km/s / √a: the farther away, the slower.</p>");
    c2.appendChild(kit.ui.slider({ label: "Semi-major axis", min: -0.5, max: 1.8, step: 0.01, value: Math.log10(4), format: function (v) { return fmt(Math.pow(10, v), 2) + " AU"; }, onInput: function (v) { kState.a = Math.pow(10, v); hyp(); } })); c2.appendChild(out); hyp();
    var rows = pl.map(function (id) { var b = B[id], Ty = b.T / 365.25; return [b.n, fmt(b.a, 3), fmt(Ty, Ty < 10 ? 3 : 2), fmt(Ty * Ty, 2), fmt(b.a * b.a * b.a, 2), fmt(Ty * Ty / (b.a * b.a * b.a), 3)]; });
    var c3 = kit.ui.card("Check with real data", kit.ui.table(["Planet", "a (AU)", "T (years)", 'T²', 'a³', 'T²/a³'], rows, 'cmp')); el.appendChild(c3);
    c3.insertAdjacentHTML('beforeend', "<p class=\"muted\">The ratio T²/a³ is ≈ 1 for all of them (with T in years and a in AU). Newton explained it: T² = 4π²a³ / (G·M☉). The constant depends only on the mass of the Sun.</p>");
    var c4 = kit.ui.card("The three laws", "<ol class=\"ideas\"><li><b>Elliptical orbits:</b> each planet describes an ellipse with the Sun at one of its foci.</li><li><b>Equal areas:</b> the Sun–planet radius vector sweeps equal areas in equal times (faster at perihelion, slower at aphelion). Turn it on with the “Kepler areas” layer.</li><li><b>Harmonies:</b> T² ∝ a³.</li></ol>"); el.appendChild(c4);
  }
  function buildChallenge(el) {
    var c1 = kit.ui.card("Identify in 3D"), box = document.createElement('div'); box.className = 'game'; c1.appendChild(box); el.appendChild(c1);
    var pool = ['sol', 'mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton', 'luna'];
    function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function start() { S.game = { n: 0, ok: 0, rounds: 8, order: shuf(pool).slice(0, 8), cur: null }; S.manual = true; S.sel = null; S.focus = null; paintSel(); next(); }
    function paint(msg, cls) {
      var G = S.game;
      if (!G) { box.innerHTML = "<p>I will name a body and you must <b>click on it in the model</b> (the labels are hidden during the game). You can rotate, zoom and stop time. There are 8 rounds.</p><button class=\"btn\" id=\"gStart\">Start</button>"; box.querySelector('#gStart').onclick = start; return; }
      if (G.n >= G.rounds) { box.innerHTML = '<div class="verdict ' + (G.ok >= 6 ? 'ok' : 'no') + "\">Result: <b>" + G.ok + ' / ' + G.rounds + "</b></div><button class=\"btn\" id=\"gAgain\">Play again</button>"; box.querySelector('#gAgain').onclick = start; S.game = null; return; }
      box.innerHTML = "<div class=\"score\">Round " + (G.n + 1) + ' de ' + G.rounds + " · correct: " + G.ok + "</div><div class=\"q\">Click on: <b>" + B[G.cur].n + '</b></div>' + (msg ? '<div class="verdict ' + cls + '">' + msg + '</div>' : '') + "<div class=\"sel-btns\"><button class=\"btn\" id=\"gHint\">Hint</button><button class=\"btn\" id=\"gSkip\">Skip</button><button class=\"btn\" id=\"gEnd\">Finish</button></div>";
      box.querySelector('#gSkip').onclick = function () { G.n++; G.cur = G.order[G.n]; paint(); };
      box.querySelector('#gHint').onclick = function () { paint(B[G.cur].h, 'no'); };
      box.querySelector('#gEnd').onclick = function () { S.game = null; paint(); };
    }
    function next() { var G = S.game; G.cur = G.order[G.n]; paint(); }
    S.gameClick = function (id) {
      var G = S.game; if (!G || G.n >= G.rounds || !id) return false;
      if (id === G.cur) { G.ok++; G.n++; if (G.n < G.rounds) G.cur = G.order[G.n]; paint("Correct! It was " + B[id].n + '.', 'ok'); }
      else paint("That is " + B[id].n + '. Sigue buscando.', 'no');
      return true;
    };
    paint();
    var c2 = kit.ui.card("Quick questions"); el.appendChild(c2); kit.ui.quiz(c2, { intro: "Comprehension of data, comparisons and Kepler's laws.", items: D.QUIZ });
  }

  /* ---------------- Tiempo ---------------- */
  function dateStr() { var d = new Date(Date.UTC(2000, 0, 1, 12) + S.t * 864e5); try { return d.toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d.toISOString().slice(0, 10); } }
  function buildTime(el) {
    var c = kit.ui.card("Simulated time"); el.appendChild(c);
    c.insertAdjacentHTML('beforeend', "<div class=\"tdate\"><span class=\"muted\">Simulated date</span> <b id=\"sDate\"></b></div><div class=\"trow\"><button class=\"btn\" id=\"sPlay\">Pause</button><label class=\"mini-select\"><select id=\"sRate\" aria-label=\"Time speed\"></select></label><button class=\"btn\" id=\"sNow\">Today</button></div><p class=\"muted tnote\">Approximate positions from the orbital elements. The distances of the model are compressed.</p>");
    rateSel = c.querySelector('#sRate'); dateEl = c.querySelector('#sDate'); playBtn = c.querySelector('#sPlay');
    RATES.forEach(function (r) { var o = document.createElement('option'); o.value = r[0]; o.textContent = r[1]; rateSel.appendChild(o); }); setRateUI();
    rateSel.onchange = function () { S.rate = parseFloat(rateSel.value); };
    playBtn.onclick = function () { S.run = !S.run; playBtn.textContent = S.run ? "Pause" : "Resume"; };
    c.querySelector('#sNow').onclick = function () { S.t = (Date.now() - Date.UTC(2000, 0, 1, 12)) / 864e5; };
  }
  function setRateUI() { if (!rateSel) return; var best = 0; RATES.forEach(function (r, i) { if (Math.abs(Math.log(r[0] / S.rate)) < Math.abs(Math.log(RATES[best][0] / S.rate))) best = i; }); rateSel.value = RATES[best][0]; }

  /* ---------------- Guía ---------------- */
  var STAGES = D.STAGES.map(function (s) { s.dur = 9; return s; });
  function applyStage(i) {
    var s = STAGES[i]; if (!s) return; S.focus = s.focus || null; S.stage = i;
    if (s.rate) { S.rate = s.rate; setRateUI(); }
    var c = s.cam; setGoal(c.t, c.dir, c.d);
  }
  function legend() {
    kit.setLegend([{ color: '#ffcf5a', label: "Sun" }, { color: '#9fb4c8', label: "Orbits", text: S.mode === 'escala' ? "(sizes to scale; distances compressed)" : "(sizes and distances enhanced)" }, { color: '#9a8f84', label: "Asteroid and Kuiper belts" }]);
  }
  var MODES = [{ id: 'dida', label: "Didactic", sub: "enhanced sizes", color: '#ffb340' }, { id: 'escala', label: "To scale", sub: "real sizes", color: '#58b6ff' }];

  function init() {
    kit = SimKit.create({
      key: 'sistema-solar', title: "Solar System", subtitle: "3D Simulator · physics and astronomy", accent: { dark: '#ffb340', light: '#b45309' }, viewLabel: "3D model of the Solar System",
      modes: MODES, modesLabel: "Size scale",
      onMode: function (id) { if (!renderer) return; applyMode(id); legend(); },
      stages: STAGES, mainTabLabel: "Guide",
      tabs: [{ id: 'fic', label: "Fact sheets", build: function (el, k) { kit = k; buildFichas(el); } }, { id: 'cmp', label: "Compare", build: function (el, k) { kit = k; buildCompare(el); } },
        { id: 'kep', label: 'Kepler', build: function (el, k) { kit = k; buildKepler(el); } }, { id: 'des', label: "Challenge", build: function (el, k) { kit = k; buildChallenge(el); } }],
      mainTop: function (el, k) { kit = k; var c = kit.ui.card("Selected body"); selBox = document.createElement('div'); selBox.className = 'selbox'; c.appendChild(selBox); el.appendChild(c); paintSel(); buildTime(el); },
      measuresTitle: "Summary",
      measures: function () { return [["Planets", '8'], ["Dwarf planet in the model", "Pluto"], ["Modeled satellites", '8'], ["Simulated date", dateStr()], ["Selected", S.sel ? B[S.sel].n : '—']]; },
      ideas: [
        "The Sun holds <b>99.86 %</b> of the mass: its gravity keeps all the bodies in orbit.",
        "The rocky planets (<b>Mercury, Venus, Earth, Mars</b>) are small and dense; the giants (<b>Jupiter, Saturn, Uranus, Neptune</b>) are enormous and gaseous or icy.",
        "The farther from the Sun, the <b>longer the year</b> and the slower the orbital speed (Kepler's 3rd law).",
        "In the model the <b>distances are compressed</b>: the real Solar System is almost all empty space."
      ],
      layers: [{ id: 'orb', label: "Orbits", icon: '◌' }, { id: 'lab', label: "Labels", icon: 'Aa' }, { id: 'belt', label: "Belts", icon: '∴' }, { id: 'sat', label: "Moons", icon: '○' }, { id: 'axis', label: "Axes", icon: '⟂', on: false }, { id: 'kep', label: "Kepler areas", icon: '◔', on: false }, { id: 'rot', label: "Rotate", icon: '⟳', on: false }],
      onLayer: function (id, on) {
        layerOn[id] = on; if (!renderer) return;
        if (id === 'lab') labelsAll = on;
        if (id === 'belt') { BODY.asteroides.vis = on; BODY.kuiper.vis = on; BODY.asteroides.orbit.visible = on; BODY.kuiper.orbit.visible = on; }
        if (id === 'sat') D.IDS.forEach(function (k) { if (B[k].grp === 'sat') { BODY[k].vis = on; BODY[k].orbit.visible = on; } });
        if (id === 'rot') controls.autoRotate = on;
      },
      views: [{ id: 'libre', label: "Free" }, { id: 'sup', label: "Top" }, { id: 'lat', label: "Side" }, { id: 'todo', label: "All" }],
      onView: function (id) {
        if (!renderer || id === 'libre') return; var dirs = { sup: [0, 1, 0.12], lat: [0, 0.06, 1], todo: [0, 0.55, 1] }; setGoal('origin', dirs[id], id === 'todo' ? 190 : 175); S.manual = true; S.focus = null;
      },
      onStage: function () { if (!renderer) return; S.manual = false; if (S.sel) { S.sel = null; paintSel(); } S.lastStage = -1; },
      onGuide: function () { if (!renderer) return; S.manual = false; S.lastStage = -1; },
      onResize: function () { resize(); },
      render: function () { if (!renderer) return; renderer.render(scene, camera); labelR.render(scene, camera); },
      onFrame: function (f) {
        if (!renderer) return;
        if (!S.manual && f.i !== S.lastStage) { S.lastStage = f.i; applyStage(f.i); }
        var dt = f.dt; if (S.run) S.t += dt * S.rate; S.stage = f.i;
        updateBodies(dt); stepCamera(dt); updateLook(dt);
        S.hover && 0; if (dateEl && (S.fc = (S.fc || 0) + 1) % 6 === 0) dateEl.textContent = dateStr();
        renderer.render(scene, camera); labelR.render(scene, camera);
      },
      init: function (k) {
        kit = k; build(); resize();
        var cv = renderer.domElement, down = null;
        cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
        cv.addEventListener('pointerup', function (e) { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) onPick(pickAt(e.clientX, e.clientY)); down = null; });
        cv.addEventListener('pointermove', function (e) { if (down) return; var id = pickAt(e.clientX, e.clientY); S.hover = id; cv.style.cursor = id ? 'pointer' : 'grab'; });
        cv.addEventListener('pointerleave', function () { S.hover = null; });
        ['orb', 'lab', 'belt', 'sat', 'axis', 'kep', 'rot'].forEach(function (id) { layerOn[id] = kit.layer(id); });
        labelsAll = layerOn.lab !== false; controls.autoRotate = !!layerOn.rot;
        [['asteroides', 'belt'], ['kuiper', 'belt']].forEach(function (p) { BODY[p[0]].vis = layerOn.belt !== false; BODY[p[0]].orbit.visible = layerOn.belt !== false; });
        D.IDS.forEach(function (k2) { if (B[k2].grp === 'sat') { BODY[k2].vis = layerOn.sat !== false; BODY[k2].orbit.visible = layerOn.sat !== false; } });
        camera.position.set(0, 105, 160); controls.target.set(0, 0, 0); controls.update(); legend();
      },
      help: {
        intro: "Follow the lesson with the player below or explore freely: rotate by dragging, zoom with the wheel or the pinch gesture and tap any body to open its fact sheet.",
        items: [["Click on a body", "opens its fact sheet (size, mass, gravity, period, temperature…), highlights it and zooms in; the body stays on screen even if it moves."], ["Size scale", "“Didactic” enlarges the bodies so they can be seen; “To scale” respects the real sizes relative to each other (the planets look very small next to the Sun). The distances are always compressed."],
          ["Simulated time", "pauses or changes the speed (from 1 day/s to 10 years/s); “Today” returns to the current date. At high speeds, short-period bodies (satellites, Mercury, Venus) are limited to a maximum visual speed so they can be followed by eye; their positions stop being exact. Axial rotations run at visual speed."], ["Layers", "orbits, labels, belts, satellites, rotation axes and Kepler areas."], ['Kepler', "T–a chart on a log–log scale and imaginary planet."], ["Challenge", "“Identify in 3D” game and quick questions."]]
      }
    });
    kit.setMode('dida', true);
    window.__sol = { kit: kit, S: S, choose: choose, BODY: BODY, camera: function () { return camera; }, flyTo: flyTo };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
