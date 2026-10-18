/* Service worker: caché progresivo para uso sin conexión.
   - Precarga el portal y el kit común.
   - El resto (simulaciones, guías) se guarda al visitarlo.
   - Estrategia: red primero con respaldo en caché (así siempre se ve la versión más reciente si hay conexión). */
var CACHE = 'simulaciones-v1';
var PRE = ['./', 'index.html', 'index.en.html', 'manifest.webmanifest', 'icons/icon.svg', 'kit/simkit.css', 'kit/simkit.js', 'kit/simkit.en.js', 'kit/simkit-lite.css', 'kit/simkit-lite.js', 'kit/simkit-lite.en.js', 'kit/langswitch.js', 'kit/mol3d.js', 'kit/vendor/three.min.js', 'kit/vendor/OrbitControls.js', 'kit/vendor/CSS2DRenderer.js'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(PRE.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; }).catch(function () { return caches.match(r, { ignoreSearch: false }).then(function (m) { return m || caches.match(r, { ignoreSearch: true }); }); }));
});
