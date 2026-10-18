#!/usr/bin/env node
// Prueba de humo de todas las simulaciones (ES y EN) con jsdom. Uso: node tools/run-smoke.js [filtro]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', 'simulaciones'); const filt = process.argv[2] || '';
function walk(d, out = []) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, out); else if (f.name === 'index.html') out.push(path.dirname(p)); } return out; }
const dirs = walk(ROOT).filter(d => { const r = path.relative(ROOT, d); return r && !r.startsWith('guias') && r.split('/').length === 2 && r.includes(filt); }).sort(); let bad = 0;
for (const d of dirs) for (const page of ['index.html', 'index.en.html']) {
  const r = cp.spawnSync('node', [path.join(__dirname, 'smoke.js'), d], { env: Object.assign({}, process.env, { PAGE: page }), encoding: 'utf8', timeout: 180000 });
  const ok = r.status === 0; if (!ok) { bad++; console.log('FALLA ' + path.relative(ROOT, d) + ' (' + page + ')\n' + (r.stdout || '') + (r.stderr || '')); }
}
console.log(dirs.length * 2 + ' páginas probadas, ' + bad + ' con errores'); process.exit(bad ? 1 : 0);
