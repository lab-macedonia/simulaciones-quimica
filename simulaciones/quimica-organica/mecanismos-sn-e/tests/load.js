// Carga los módulos químicos en Node (sin navegador) en el orden de index.html
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const files = ['chem-core.js', 'chem-sn2.js', 'chem-unimolecular.js', 'chem-e2.js', 'chem-predictor.js'];
for (const f of files) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) continue;
  vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: f });
}
module.exports = globalThis.Chem;
