// registrar.js — Registra las simulaciones de fichas/*.js en el currículo (kit/curriculo.js), los títulos y rutas de
// kit/aula.js, la portada (index.html / index.en.html) y el índice de guías (ES/EN).
// Es idempotente: lo que ya está registrado no se duplica. Uso (desde la raíz): node tools/nueva-sim/registrar.js
// Una ficha nueva en un área sin sección en la portada (por ejemplo, química) se agrega al final de la última grilla del área;
// si el área no existe, se crea la sección antes de «Física». El README se actualiza a mano.
const fs = require('fs'), path = require('path');
const REPO = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const F = fs.readdirSync(path.join(__dirname, 'fichas')).filter(f => f.endsWith('.js')).map(f => require(path.join(__dirname, 'fichas', f)));
const R = p => fs.readFileSync(path.join(REPO, p), 'utf8'), W = (p, s) => fs.writeFileSync(path.join(REPO, p), s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
// Rutas de aprendizaje: código de la ficha → nombre de la ruta en aula.js
const RUTAS = { mov: ['Movimiento y energía', 'Motion and energy'], ele: ['Electricidad, ondas y universo', 'Electricity, waves and the universe'], tie: ['Tierra dinámica y clima', 'Dynamic Earth and climate'], eco: ['Ecología, microorganismos y salud', 'Ecology, microorganisms and health'] };
const AREA = { 'fisica': ['Física', 'Physics'], 'biologia': ['Biología', 'Biology'], 'ciencias-tierra': ['Ciencias de la Tierra', 'Earth sciences'], 'quimica-general': ['Química general', 'General chemistry'], 'quimica-organica': ['Química orgánica', 'Organic chemistry'], 'quimica-inorganica': ['Química inorgánica', 'Inorganic chemistry'] };
const log = [];

// 1) currículo: entradas nuevas al final de MAP
let cu = R('simulaciones/kit/curriculo.js');
const add1 = F.filter(m => !cu.includes("'" + m.id + "':")).map(m => '    ' + q(m.id) + ': [' + m.oa.map(q).join(', ') + ']');
if (add1.length) { cu = cu.replace(/\]\n  \};\n(\s*var BY)/, '],\n' + add1.join(',\n') + '\n  };\n$1'); W('simulaciones/kit/curriculo.js', cu); log.push('currículo +' + add1.length); }

// 2) aula.js: títulos (al final de TITLES) y rutas
let au = R('simulaciones/kit/aula.js');
const t2 = F.filter(m => !au.includes(q(m.id) + ': [')).map(m => '    ' + q(m.id) + ': [' + q(m.es.short) + ', ' + q(m.en.short) + ']');
if (t2.length) { au = au.replace(/\]\n  \};\n(\s*function R\()/, '],\n' + t2.join(',\n') + '\n  };\n$1'); log.push('títulos +' + t2.length); }
F.forEach(m => {
  const nm = RUTAS[m.route], area = m.id.split('/')[0], s = m.id.split('/')[1]; if (!nm) return;
  const re = new RegExp("(R\\(\\[" + q(nm[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "[^\\n]*?\\[)([^\\n]*?)(\\]\\))");
  const mm = au.match(re);
  if (mm) { if (!mm[2].includes(q(s))) au = au.replace(re, (a, p1, p2, p3) => p1 + p2 + ', ' + q(s) + p3); }
  else { au = au.replace(/\)\n  \];/, '),\n    R([' + q(nm[0]) + ', ' + q(nm[1]) + '], ' + q(area) + ', [' + q(s) + '])\n  ];'); log.push('ruta nueva ' + nm[0]); }
});
W('simulaciones/kit/aula.js', au);

// 3) portada ES/EN
function card(m, en) { const L = en ? m.en : m.es; return '    <a class="card" href="' + m.id + '/' + (en ? 'index.en.html' : '') + '">\n      <h3>' + esc(L.title) + '</h3>\n      <p>' + esc(L.desc) + '</p>\n      <div class="tags">' + L.tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>\n    </a>'; }
for (const en of [false, true]) {
  const p = 'simulaciones/' + (en ? 'index.en.html' : 'index.html'); let h = R(p), n = 0;
  F.forEach(m => {
    if (h.includes('href="' + m.id + '/')) return; const area = m.id.split('/')[0], sec = { 'quimica-general': 'general', 'quimica-organica': 'organica', 'quimica-inorganica': 'inorganica' }[area] || area;
    let i = h.indexOf('<section id="' + sec + '">');
    if (i < 0) { const f = h.indexOf('<section id="fisica">'); h = h.slice(0, f) + '<section id="' + sec + '">\n  <h2>' + AREA[area][en ? 1 : 0] + '</h2>\n  <div class="grid">\n  </div>\n</section>\n\n' + h.slice(f); i = h.indexOf('<section id="' + sec + '">'); }
    const j = h.indexOf('</section>', i), last = h.lastIndexOf('  </div>', j); h = h.slice(0, last) + card(m, en) + '\n' + h.slice(last); n++;
  });
  if (n) { W(p, h); log.push('portada ' + (en ? 'EN' : 'ES') + ' +' + n); }
}

// 4) índice de guías ES/EN
for (const en of [false, true]) {
  const p = 'simulaciones/guias/' + (en ? 'en/' : '') + 'index.html'; let h = R(p), n = 0;
  F.forEach(m => {
    if (h.includes('href="' + m.id + '.html"')) return; const area = m.id.split('/')[0], hd = '<h2>' + AREA[area][en ? 1 : 0] + '</h2>';
    const c = '<a class="card" href="' + m.id + '.html"><b>' + esc((en ? m.en : m.es).title) + '</b><small>' + (en ? 'Guide + question bank' : 'Guía + banco de preguntas') + '</small></a>';
    let i = h.indexOf(hd); if (i < 0) { const f = h.indexOf('<h2>' + AREA.fisica[en ? 1 : 0] + '</h2>'); h = h.slice(0, f) + hd + '<div class="grid"></div>' + h.slice(f); i = h.indexOf(hd); }
    const j = h.indexOf('</div>', h.indexOf('<div class="grid">', i)); h = h.slice(0, j) + c + h.slice(j); n++;
  });
  if (n) { W(p, h); log.push('guías ' + (en ? 'EN' : 'ES') + ' +' + n); }
}
console.log(log.length ? log.join('\n') : 'Nada nuevo que registrar.');
