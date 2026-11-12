// nuevo.js — Genera index.html/index.en.html, sim.css y guías ES/EN de una simulación MSim nueva a partir de su ficha.
// Uso: node nuevo.js <raíz del repo> <ficha.js>      (la ficha exporta { id, color, iconPath, oa, route, es: {...}, en: {...} }; ver fichas/)
// Las páginas usan la versión actual de los scripts; si ya existen app.js y app.en.js, también genera las guías.
const fs = require('fs'), path = require('path'), vm = require('vm');
const [, , REPO, FICHA] = process.argv;
const SIM = path.join(REPO, 'simulaciones');
const M = require(path.resolve(FICHA));
const [area, name] = M.id.split('/');
const dir = path.join(SIM, area, name);
// Versiones de los scripts: las mismas que usa una simulación MSim existente (así se mantienen al día solas).
const ref = fs.readFileSync(path.join(SIM, 'quimica-general', 'radiactividad', 'index.html'), 'utf8'), ver = re => (ref.match(re) || [])[1];
const V = { simkit: ver(/kit\/simkit\.js\?v=([^"]+)/), aula: ver(/kit\/aula\.js\?v=([^"]+)/), msim: ver(/kit\/msim\.js\?v=([^"]+)/), app: new Date().toISOString().slice(0, 10).replace(/-/g, '') + 'a', css: '20261018a', lang: ver(/langswitch\.js\?v=([^"]+)/) };
const AREA = { 'fisica': ['Física', 'Physics'], 'biologia': ['Biología', 'Biology'], 'ciencias-tierra': ['Ciencias de la Tierra', 'Earth sciences'], 'quimica-general': ['Química general', 'General chemistry'], 'quimica-organica': ['Química orgánica', 'Organic chemistry'], 'quimica-inorganica': ['Química inorgánica', 'Inorganic chemistry'] };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

function icon(color) {
  const c = color.replace('#', '%23');
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='" + c + "'/%3E%3Cpath d='" + (M.iconPath || 'M14 44c8-20 28-20 36 0M32 14v12') + "' stroke='%23fff' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
}
function page(en) {
  const L = en ? M.en : M.es, x = en ? '.en' : '';
  const scripts = ['../../kit/vendor/three.min.js', '../../kit/vendor/OrbitControls.js', '../../kit/vendor/CSS2DRenderer.js', '../../kit/simkit' + x + '.js?v=' + V.simkit, '../../kit/aula.js?v=' + V.aula, 'practica.js?v=' + V.aula, '../../kit/msim' + x + '.js?v=' + V.msim, 'app' + x + '.js?v=' + V.app, '../../kit/langswitch' + x + '.js?v=' + V.lang];
  return '<!doctype html>\n<html lang="' + (en ? 'en' : 'es') + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<title>' + esc(L.title) + ' · ' + (en ? '3D Simulator' : 'Simulador 3D') + '</title>\n<meta name="description" content="' + esc(L.desc) + '">\n<meta name="color-scheme" content="dark light">\n' +
    '<link rel="icon" href="' + icon(M.color) + '">\n<link rel="stylesheet" href="../../kit/simkit.css?v=20261102a">\n<link rel="stylesheet" href="sim.css?v=' + V.css + '">\n' +
    scripts.map(s => '<script defer src="' + s + '"></script>').join('\n') + '\n' + (en ? '<link rel="alternate" hreflang="es" href="index.html">\n' : '<link rel="alternate" hreflang="en" href="index.en.html">\n') +
    '</head>\n<body>\n<noscript>' + (en ? 'This simulator needs JavaScript.' : 'Este simulador necesita JavaScript.') + '</noscript>\n</body>\n</html>\n';
}

// Evalúa app.js con objetos de relleno para obtener etapas y preguntas
function appDef(file, en) {
  let def = null;
  const anyObj = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : anyObj, apply: () => anyObj, construct: () => anyObj });
  const fmt = (x, d) => { if (x == null || isNaN(x)) return '—'; const s = (+x).toFixed(d == null ? 2 : d); return en ? s : s.replace('.', ','); };
  const g = { console, Math, JSON, Object, Array, String, Number, isNaN, parseFloat, parseInt, Date, THREE: anyObj, window: {}, document: anyObj,
    SimKit: { fmt, clamp: (v, a, b) => Math.min(b, Math.max(a, v)) }, MSim: { create: d => { def = d; return anyObj; }, sci: (x, d) => fmt(x, d), mol: anyObj, EL: {} } };
  vm.createContext(g); vm.runInContext(fs.readFileSync(file, 'utf8'), g);
  const ctx = { P: { manual: false }, ui: {}, fmt, kit: anyObj };
  return { stages: def.stages(ctx), quiz: def.quiz || [] };
}
function shuffle(n, seed) { const a = [...Array(n).keys()]; let s = seed * 9301 + 49297; for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function guide(en) {
  const L = en ? M.en : M.es, G = L.guide, t = (a, b) => en ? b : a;
  const d = appDef(path.join(dir, en ? 'app.en.js' : 'app.js'), en);
  const quiz = d.quiz.concat(G.mc || []);
  const up = en ? '../../../' : '../../';
  const cssSrc = fs.readFileSync(path.join(SIM, 'guias', 'quimica-general', 'radiactividad.html'), 'utf8').match(/<style>[\s\S]*?<\/style>/)[0];
  let h = '<!doctype html><html lang="' + (en ? 'en' : 'es') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t('Guía docente', 'Teacher guide') + ' · ' + esc(L.title) + '</title>' + cssSrc + '</head><body><main>';
  h += '<div class="top noprint"><a href="../index.html">← ' + t('Guías docentes', 'Teacher guides') + '</a><span>·</span><a href="' + up + (en ? 'index.en.html' : 'index.html') + '">' + t('Colección', 'Collection') + '</a><span>·</span>' +
    (en ? '<a href="../../' + area + '/' + name + '.html" hreflang="es" lang="es">Español</a>' : '<a href="../en/' + area + '/' + name + '.html" hreflang="en" lang="en">English</a>') + '</div>\n';
  h += '<div class="top"><span class="chip">' + AREA[area][en ? 1 : 0] + '</span><span>' + t('Guía docente', 'Teacher guide') + '</span></div>\n';
  h += '<h1>' + esc(L.title) + '</h1><p>' + esc(L.desc) + '</p>\n';
  h += '<p class="noprint"><a class="btn p" href="' + up + area + '/' + name + '/' + (en ? 'index.en.html' : '') + '">' + t('Abrir la simulación', 'Open the simulation') + '</a> <button class="btn" onclick="print()">' + t('Imprimir guía', 'Print guide') + '</button></p>\n';
  h += '<div class="meta"><span>⏱ ' + G.min + ' min</span><span>' + t('Nivel', 'Level') + ': ' + G.nivel + '</span><span>' + quiz.length + t(' preguntas de alternativas · ', ' multiple-choice questions · ') + G.open.length + t(' de desarrollo', ' essay questions') + '</span></div>\n';
  h += '<h2>' + t('Objetivos de aprendizaje', 'Learning objectives') + '</h2><p>' + t('Al terminar, el estudiante podrá:', 'By the end, the student will be able to:') + '</p><ul>' + G.obj.map(x => '<li>' + x + '</li>').join('') + '</ul>\n';
  h += '<h2>' + t('Conocimientos previos', 'Prior knowledge') + '</h2><ul>' + G.prev.map(x => '<li>' + x + '</li>').join('') + '</ul>\n';
  h += '<h2>' + t('Recorrido de la simulación', 'Simulation walkthrough') + '</h2><p>' + t('Usa la <b>lección</b> (reproductor inferior) para el recorrido guiado y la pestaña <b>Lab</b> para explorar libremente; «Volver a la lección» retoma el guion.', 'Use the <b>lesson</b> (bottom player) for the guided walkthrough and the <b>Lab</b> tab to explore freely; “Back to the lesson” resumes the script.') + '</p>\n';
  h += '<table><tr><th>#</th><th>' + t('Etapa', 'Stage') + '</th><th>' + t('Idea central', 'Core idea') + '</th></tr>' + d.stages.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + strip(s[0]) + '</td><td>' + strip(s[2]) + '</td></tr>').join('') + '</table>\n';
  h += '<h2>' + t('Actividad sugerida', 'Suggested activity') + '</h2><p><b>' + G.act.t + '</b></p><ol>' + G.act.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>\n';
  h += '<h2>' + t('Errores frecuentes', 'Common misconceptions') + '</h2><table><tr><th>' + t('Idea errónea', 'Misconception') + '</th><th>' + t('Corrección', 'Correction') + '</th></tr>' + G.err.map(e => '<tr><td>' + e[0] + '</td><td>' + e[1] + '</td></tr>').join('') + '</table>\n';
  h += '<h2 class="pb">' + t('Banco de preguntas', 'Question bank') + '</h2><h3>' + t('A. Alternativas', 'A. Multiple choice') + '</h3>';
  const keys = [];
  quiz.forEach((q, i) => { const o = shuffle(q.options.length, i + 7); keys.push(o.indexOf(q.answer)); h += '<div class="q"><p>' + (i + 1) + '. ' + q.q + '</p><ol>' + o.map(k => '<li>' + q.options[k] + '</li>').join('') + '</ol></div>'; });
  h += '<h3>' + t('B. Desarrollo', 'B. Essay') + '</h3>' + G.open.map((q, i) => '<div class="q"><p>' + (i + 1) + '. ' + q[0] + '</p></div>').join('');
  h += '<h2 class="pb">' + t('Solucionario', 'Answer key') + '</h2><h3>' + t('Alternativas', 'Multiple choice') + '</h3><ol class="sol">' + quiz.map((q, i) => '<li><span class="ok">' + 'ABCDEF'[keys[i]] + '</span>. ' + q.options[q.answer] + ' — ' + q.why + '</li>').join('') + '</ol>';
  h += '<h3>' + t('Desarrollo (pauta)', 'Essay (marking guide)') + '</h3><ol class="sol">' + G.open.map(q => '<li>' + q[1] + '</li>').join('') + '</ol></main></body></html>';
  return h;
}

fs.mkdirSync(dir, { recursive: true });
W(path.join(dir, 'index.html'), page(false));
W(path.join(dir, 'index.en.html'), page(true));
fs.copyFileSync(path.join(SIM, 'quimica-general', 'radiactividad', 'sim.css'), path.join(dir, 'sim.css'));
if (fs.existsSync(path.join(dir, 'app.js')) && fs.existsSync(path.join(dir, 'app.en.js'))) {
  W(path.join(SIM, 'guias', area, name + '.html'), guide(false));
  W(path.join(SIM, 'guias', 'en', area, name + '.html'), guide(true));
  console.log('OK ' + M.id + ' · páginas y guías');
} else console.log('OK ' + M.id + ' · páginas (faltan app.js/app.en.js para las guías)');
