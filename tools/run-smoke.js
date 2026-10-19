#!/usr/bin/env node
// Prueba de humo de todas las simulaciones (ES y EN) con jsdom. Uso: node tools/run-smoke.js [filtro]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', 'simulaciones'); const filt = process.argv[2] || '';
function walk(d, out = []) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, out); else if (f.name === 'index.html') out.push(path.dirname(p)); } return out; }
const dirs = walk(ROOT).filter(d => { const r = path.relative(ROOT, d); return r && !r.startsWith('guias') && r.split('/').length === 2 && r.includes(filt); }).sort(); const handWritten = d => { const w = (x, o = []) => { for (const f of fs.readdirSync(x, { withFileTypes: true })) { const p = path.join(x, f.name); if (f.isDirectory()) { if (f.name !== 'vendor') w(p, o); } else if (/\.js$/.test(f.name) && !/\.en\.js$/.test(f.name)) o.push(p); } return o; }; return !w(d).some(f => fs.readFileSync(f, 'utf8').includes('MSim.create')); };
let bad = 0; let browser = null; const BS = require('./browser-smoke.js');
(async () => {
for (const d of dirs) for (const page of ['index.html', 'index.en.html']) {
  const r = cp.spawnSync('node', [path.join(__dirname, 'smoke.js'), d], { env: Object.assign({}, process.env, { PAGE: page }), encoding: 'utf8', timeout: 180000 });
  let ok = r.status === 0;
  // Las simulaciones escritas a mano no exponen window.__sim ni corren en jsdom: se prueban en Chromium real.
  if (!ok && handWritten(d)) { try { browser = browser || await BS.launch(); const e = await BS.check(browser, d, page); ok = !e.length; if (!ok) r.stdout = e.join('\n'); } catch (e) { r.stdout = 'navegador no disponible: ' + e.message; } }
  if (!ok) { bad++; console.log('FALLA ' + path.relative(ROOT, d) + ' (' + page + ')\n' + (r.stdout || '') + (r.stderr || '')); }
}
if (browser) await browser.close();
console.log(dirs.length * 2 + ' páginas probadas, ' + bad + ' con errores'); process.exit(bad ? 1 : 0);
})();
