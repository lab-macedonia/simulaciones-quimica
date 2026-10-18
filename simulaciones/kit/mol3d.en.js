/* Mol3D — capa de render 3D con Three.js para los módulos moleculares (Laboratorio MACEDONIA · UMCE)
   Un único WebGLRenderer compartido dibuja la escena y el resultado se copia a canvases 2D
   (así cada módulo conserva sus rótulos, exportación PNG y entrada de ratón/teclado).
   La cámara reproduce exactamente la proyección con perspectiva que usaban los módulos
   (distancia camd, distancia focal focpx en píxeles, escala 'world'), de modo que los rótulos 2D coinciden. */
(function (g) {
  "use strict";
  var T = g.THREE, R, scene, cam, grp, sph, cyl, cone, ready = false;
  var pools = { s: [], c: [], k: [] }, used = { s: 0, c: 0, k: 0 };
  var Y = null, V = null, Q = null, Q2 = null;
  function init() {
    if (ready) return true;
    if (!T) return false;
    try {
      R = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    } catch (e) { return false; }
    R.setClearColor(0x000000, 0); R.setPixelRatio(1);
    scene = new T.Scene(); cam = new T.PerspectiveCamera(60, 1, 0.1, 80);
    scene.add(new T.AmbientLight(0xffffff, 0.62));
    var dl = new T.DirectionalLight(0xffffff, 0.95); dl.position.set(-3, 5, 7); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x9db8ff, 0.25); dl2.position.set(5, -3, -2); scene.add(dl2);
    grp = new T.Group(); scene.add(grp);
    sph = new T.SphereGeometry(1, 36, 24); cyl = new T.CylinderGeometry(1, 1, 1, 24, 1, false); cone = new T.ConeGeometry(1, 1, 24);
    Y = new T.Vector3(0, 1, 0); V = new T.Vector3(); Q = new T.Quaternion(); Q2 = new T.Quaternion();
    ready = true; return true;
  }
  function take(kind, geo) {
    var arr = pools[kind], i = used[kind]++;
    if (!arr[i]) {
      var m = new T.Mesh(geo, new T.MeshPhongMaterial({ color: 0xffffff, shininess: 70, specular: 0x666666 }));
      grp.add(m); arr.push(m);
    }
    return arr[i];
  }
  function style(m, o) {
    m.visible = true;
    m.material.color.set(o.color || '#888888');
    var op = o.opacity == null ? 1 : o.opacity;
    var tr = op < 1;
    if (m.material.transparent !== tr) { m.material.transparent = tr; m.material.needsUpdate = true; }
    m.material.opacity = op; m.material.depthWrite = !tr;
    m.material.shininess = o.shin == null ? 70 : o.shin;
    m.material.emissive.set(o.emissive || '#000000');
  }
  function orient(m, a, b) {
    V.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); var L = V.length() || 1e-6; V.multiplyScalar(1 / L);
    m.quaternion.setFromUnitVectors(Y, V); return L;
  }
  /* items:
       {t:'s', p:[x,y,z], r, color, opacity}                 esfera
       {t:'c', a:[..], b:[..], r, color, opacity}            cilindro
       {t:'e', c:[..], dir:[..], len, wid, color, opacity}   elipsoide (lóbulo) con semieje 'len' en dir
       {t:'a', a:[..], b:[..], r, head, color}               flecha (cilindro + cono)
     opt: {yaw, pitch, world, camd, focpx}  */
  function render(W, H, opt, items) {
    if (!init()) return null;
    var world = opt.world || 2.15, camd = opt.camd || 6.2, foc = opt.focpx || 257.6;
    R.setSize(W, H, false);
    cam.aspect = W / H; cam.fov = 2 * Math.atan(H / 2 / foc) * 180 / Math.PI; cam.position.set(0, 0, camd); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    grp.scale.setScalar(world);
    Q.setFromAxisAngle(new T.Vector3(1, 0, 0), opt.pitch || 0); Q2.setFromAxisAngle(new T.Vector3(0, 1, 0), -(opt.yaw || 0)); grp.quaternion.copy(Q).multiply(Q2);
    used.s = used.c = used.k = 0;
    items.forEach(function (o) {
      var m;
      if (o.t === 's') { m = take('s', sph); style(m, o); m.position.set(o.p[0], o.p[1], o.p[2]); m.quaternion.identity(); m.scale.setScalar(o.r); }
      else if (o.t === 'c') { m = take('c', cyl); style(m, o); var L = orient(m, o.a, o.b); m.position.set((o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2, (o.a[2] + o.b[2]) / 2); m.scale.set(o.r, L, o.r); }
      else if (o.t === 'e') {
        m = take('s', sph); style(m, o); var d = o.dir; m.quaternion.setFromUnitVectors(Y, V.set(d[0], d[1], d[2]).normalize());
        m.position.set(o.c[0], o.c[1], o.c[2]); m.scale.set(o.wid, o.len, o.wid);
      }
      else if (o.t === 'a') {
        var hd = o.head || 0.14, dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], dz = o.b[2] - o.a[2], LL = Math.hypot(dx, dy, dz) || 1e-6, ux = dx / LL, uy = dy / LL, uz = dz / LL;
        var sh = Math.max(LL - hd, 0.001), e = [o.a[0] + ux * sh, o.a[1] + uy * sh, o.a[2] + uz * sh];
        m = take('c', cyl); style(m, o); orient(m, o.a, e); m.position.set((o.a[0] + e[0]) / 2, (o.a[1] + e[1]) / 2, (o.a[2] + e[2]) / 2); m.scale.set(o.r, sh, o.r);
        var k = take('k', cone); style(k, o); orient(k, o.a, o.b); k.position.set(o.b[0] - ux * hd / 2, o.b[1] - uy * hd / 2, o.b[2] - uz * hd / 2); k.scale.set(o.r * 2.6, hd, o.r * 2.6);
      }
    });
    ['s', 'c', 'k'].forEach(function (kd) { for (var i = used[kd]; i < pools[kd].length; i++) pools[kd][i].visible = false; });
    R.render(scene, cam);
    return R.domElement;
  }
  g.Mol3D = { render: render, available: function () { return init(); } };
})(window);
