#!/usr/bin/env node
// Comprobaciones estáticas (sin dependencias): enlaces locales, sintaxis JS, JSON, versiones ES/EN y guías.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', 'simulaciones'); const errs = [];
function walk(d, out = []) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, out); else out.push(p); } return out; }
const files = walk(ROOT);
// 1) sintaxis JS (excepto vendor)
for (const f of files.filter(f => f.endsWith('.js') && !f.includes('/vendor/'))) { try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); } catch (e) { errs.push('JS ' + path.relative(ROOT, f) + ': ' + e.message); } }
// 2) JSON / manifest
for (const f of files.filter(f => /\.(json|webmanifest)$/.test(f))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { errs.push('JSON ' + path.relative(ROOT, f) + ': ' + e.message); } }
// 3) enlaces locales de cada HTML (src/href), con ancla y query ignoradas
for (const f of files.filter(f => f.endsWith('.html'))) {
  const h = fs.readFileSync(f, 'utf8'); const dir = path.dirname(f);
  for (const m of h.matchAll(/\s(?:src|href)="([^"]+)"/g)) { let u = m[1]; if (/^(https?:|mailto:|data:|#|javascript:)/.test(u)) continue; u = u.split('#')[0].split('?')[0]; if (!u) continue; const t = path.resolve(dir, u); if (!fs.existsSync(t) && !fs.existsSync(path.join(t, 'index.html'))) errs.push('ENLACE ' + path.relative(ROOT, f) + ' → ' + m[1]); }
}
// 4) cada simulación (carpeta con index.html y app.js/js/) tiene versión en inglés y guía docente
const sims = files.filter(f => path.basename(f) === 'index.html').map(f => path.relative(ROOT, path.dirname(f))).filter(d => d && !d.startsWith('guias') && d.split('/').length === 2);
for (const s of sims) {
  if (!fs.existsSync(path.join(ROOT, s, 'index.en.html'))) errs.push('SIN INGLÉS ' + s);
  if (!fs.existsSync(path.join(ROOT, 'guias', s + '.html'))) errs.push('SIN GUÍA ' + s);
  if (!fs.existsSync(path.join(ROOT, 'guias', 'en', s + '.html'))) errs.push('SIN GUÍA EN ' + s);
  const h = fs.readFileSync(path.join(ROOT, s, 'index.html'), 'utf8'); if (!/<title>[^<]+<\/title>/.test(h) || !/name="description"/.test(h)) errs.push('METADATOS ' + s);
}
// 5) todas las simulaciones aparecen en la portada
for (const idx of ['index.html', 'index.en.html']) { const h = fs.readFileSync(path.join(ROOT, idx), 'utf8'); for (const s of sims) if (!h.includes('href="' + s + (idx === 'index.html' ? '/"' : '/index.en.html"'))) errs.push('NO EN PORTADA ' + idx + ': ' + s); }
console.log(sims.length + ' simulaciones · ' + files.length + ' archivos revisados');
if (errs.length) { console.log('ERRORES (' + errs.length + '):'); errs.slice(0, 40).forEach(e => console.log(' - ' + e)); process.exit(1); } else console.log('OK: sin errores');
