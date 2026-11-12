// tr.js — Crea X.i18n.json para i18n.ps1 a partir de pares [español, inglés] (texto sin comillas).
// Cada cadena literal de X.js cuyo contenido coincide con un par se traduce conservando su tipo de comillas.
// Uso: node tr.js <X.js> <pares.js>   → escribe X.i18n.json y lista las cadenas con texto que quedaron sin traducir.
const fs = require('fs'), path = require('path');
const [, , SRC, PARES] = process.argv;
const pairs = require(path.resolve(PARES)), map = new Map(pairs.map(p => [p[0], p[1]]));
const src = fs.readFileSync(SRC, 'utf8');
const RX = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;
const wordy = s => /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}[ ,.;:]+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}/.test(s) || /[áéíóúñ¿¡]/.test(s);
const autoKeep = new Set(), lit = {}, miss = new Set(), used = new Set(), keep = new Set();
for (const m of src.matchAll(RX)) {
  const tok = m[0], q = tok[0], inner = tok.slice(1, -1);
  if (map.has(inner)) { let en = map.get(inner); if (q === "'") en = en.replace(/\\?'/g, "\\'"); lit[tok] = q + en + q; used.add(inner); }
  else if (wordy(inner) && (/px system-ui/.test(inner) || !/[A-Za-záéíóúñ]{3}/.test(inner.replace(/<[^>]*>/g, '')))) autoKeep.add(tok);
  else if (wordy(inner)) miss.add(tok);
  else if (/^[A-ZÁÉÍÓÚa-záéíóúñ][a-záéíóúñ]{2,}/.test(inner) && !/^(px|rgba|system|bl-|calc|card|eqline|row|primary|lab|graf|quiz)/.test(inner) && !/[{}();=]/.test(inner)) keep.add(tok);
}
const out = { nota: 'Diccionario ES→EN. El inglés se genera con tools\\i18n.ps1 generar; no editar el .en.js a mano. keep: textos que no se traducen.', lit: Object.fromEntries(Object.keys(lit).sort().map(k => [k, lit[k]])), lines: {}, keep: [] };
const dictPath = SRC.replace(/\.js$/, '.i18n.json');
const prev = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, 'utf8')) : null;
out.keep = [...new Set([...(prev && prev.keep || []), ...autoKeep])].sort();
fs.writeFileSync(dictPath, JSON.stringify(out));
const unused = pairs.filter(p => !used.has(p[0])).map(p => p[0]);
console.log('traducidas ' + Object.keys(lit).length + ' · sin traducir ' + miss.size + ' · pares sin uso ' + unused.length);
[...miss].forEach(s => console.log('  FALTA ' + s.slice(0, 160)));
unused.forEach(s => console.log('  SIN USO ' + s.slice(0, 120)));
if (keep.size) console.log('  ¿palabras sueltas sin traducir?: ' + [...keep].join(' '));
