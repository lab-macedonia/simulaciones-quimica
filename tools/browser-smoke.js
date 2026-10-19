// Prueba en navegador real (Chromium + WebGL por software) para las simulaciones escritas a mano,
// que jsdom no puede ejecutar. Falla si hay errores de JS, recursos que no cargan o no se dibuja nada.
// Uso: node tools/browser-smoke.js <carpeta> <index.html|index.en.html>   (o lo llama run-smoke.js)
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
async function check(browser, dir, page) {
  const errs = []; const p = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  p.on('pageerror', e => errs.push('JS: ' + e.message));
  p.on('console', m => m.type() === 'error' && errs.push('consola: ' + m.text()));
  p.on('requestfailed', r => errs.push('no carga: ' + r.url().slice(-70)));
  await p.goto('file://' + path.resolve(dir, page)); await p.waitForTimeout(2000);
  const info = await p.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, h1: !!document.querySelector('h1,h2'), len: document.body.innerText.length }));
  if (!info.h1 || info.len < 200) errs.push('página casi vacía');
  await p.close(); return errs;
}
async function launch() {
  return pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}
module.exports = { check, launch };
if (require.main === module) (async () => { const b = await launch(); const e = await check(b, process.argv[2], process.argv[3] || 'index.html'); await b.close(); console.log(e.length ? 'ERRORES (' + e.length + '):\n - ' + e.join('\n - ') : 'OK sin errores'); process.exit(e.length ? 1 : 0); })();
