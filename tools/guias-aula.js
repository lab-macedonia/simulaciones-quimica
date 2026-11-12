#!/usr/bin/env node
// guias-aula.js — Inserta (o actualiza) en cada guía docente, en español e inglés, la sección «Herramientas de aula»:
// tipos de problemas de la Práctica, etapas con predicción, informe del estudiante y OA del Mineduc con enlace a la página curricular.
// Los datos salen de cada practica.js y de kit/curriculo.js, así que basta volver a correrlo cuando cambien.
// Es idempotente: la sección queda entre <!--aula--> y <!--/aula-->. Uso: node tools/guias-aula.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', 'simulaciones');
const AREAS = ['biologia', 'ciencias-tierra', 'fisica', 'quimica-general', 'quimica-inorganica', 'quimica-organica'];
const aulaSrc = fs.readFileSync(path.join(ROOT, 'kit', 'aula.js'), 'utf8');
const C = (() => { const g = {}; g.window = g; vm.createContext(g); vm.runInContext(fs.readFileSync(path.join(ROOT, 'kit', 'curriculo.js'), 'utf8'), g); return g.SimCurriculo; })();
const nums = (a, and) => { a = a.map(s => s + 1); return a.length > 1 ? a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1] : String(a[0]); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function simData(id, EN) {
  const doc = { documentElement: { lang: EN ? 'en' : 'es' }, currentScript: null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, head: { appendChild() {} }, body: { appendChild() {}, classList: { add() {}, remove() {} } }, readyState: 'loading' };
  const g = { document: doc, location: { pathname: '/' + id + '/index.html', search: '', hash: '' }, console, addEventListener() {}, setTimeout() {}, navigator: {}, history: {} };
  g.window = g; vm.createContext(g); vm.runInContext(aulaSrc, g);
  const p = path.join(ROOT, id, 'practica.js');
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), g);
  const D = g.SimAula.data, L = x => Array.isArray(x) ? x[EN ? 1 : 0] : x;
  return { problems: D.problems.map(q => L(q.name)), stages: Object.keys(D.predict).map(Number).sort((a, b) => a - b) };
}

function section(id, EN, depth) {
  const d = simData(id, EN), cur = C.forSim(id), t = (es, en) => EN ? en : es, up = '../'.repeat(depth);
  const page = up + 'curriculo' + (EN ? '.en' : '') + '.html#sim=' + encodeURIComponent(id);
  let h = '<!--aula--><h2>' + t('Herramientas de aula', 'Classroom tools') + '</h2>' +
    '<p>' + t('El botón <b>«Aula»</b> de la simulación reúne estas herramientas. Ninguna necesita cuenta ni conexión: todo queda en el navegador del estudiante.',
      'The simulation’s <b>«Class»</b> button gathers these tools. None needs an account or a connection: everything stays in the student’s browser.') + '</p><ul>';
  if (d.problems.length) h += '<li><b>' + t('Práctica', 'Practice') + '</b>: ' + t('problemas con valores o casos nuevos en cada intento, con corrección inmediata y solución paso a paso. Tipos: ', 'problems with new values or cases on every attempt, instant feedback and a worked solution. Types: ') +
    d.problems.map(esc).join('; ') + '. ' + t('Sirve como cierre de clase (10 minutos) o tarea: pide al curso una racha de 5 respuestas correctas.', 'Use it as a lesson wrap-up (10 minutes) or homework: ask the class for a streak of 5 correct answers.') + '</li>';
  if (d.stages.length) h += '<li><b>' + t('Predice → observa → explica', 'Predict → observe → explain') + '</b>: ' + t('la lección guiada se detiene en ' + (d.stages.length > 1 ? 'las etapas ' : 'la etapa ') + nums(d.stages, 'y') + ' y pide una predicción antes de mostrar el resultado. Conviene proyectarla y votar a mano alzada antes de continuar.',
    'the guided lesson pauses at stage' + (d.stages.length > 1 ? 's ' : ' ') + nums(d.stages, 'and') + ' and asks for a prediction before showing the result. Project it and take a show of hands before continuing.') + '</li>';
  h += '<li><b>' + t('Informe', 'Report') + '</b>: ' + t('registra la práctica, el desafío y las predicciones con su hora y resultado, más una captura y las observaciones del estudiante. Se imprime o guarda como PDF para entregarlo. Se conserva si se cierra la pestaña y se borra solo tras 12 horas sin uso; en computadores compartidos, pide usar «Empezar de nuevo» al terminar.',
    'records practice, the challenge and predictions with time and result, plus a screenshot and the student’s notes. It can be printed or saved as PDF to hand in. It survives closing the tab and clears itself after 12 hours of inactivity; on shared computers, ask students to use «Start over» when they finish.') + '</li>';
  h += '<li><b>' + t('Escenario compartible y modo proyector', 'Shareable scenario and projector mode') + '</b>: ' + t('copia un enlace que reabre la simulación con los mismos parámetros (útil para dejar una tarea) y agranda los textos para proyectar.', 'copy a link that reopens the simulation with the same parameters (handy for assignments) and enlarge the text for projection.') + '</li></ul>';
  h += '<h3>' + t('Objetivos de aprendizaje (Mineduc)', 'Learning objectives (Mineduc, Chile)') + '</h3>';
  if (cur && cur.oa.length) {
    if (cur.universitario) h += '<p>' + t('Contenido de nivel universitario. OA escolares que sirven de base:', 'University-level content. School objectives it builds on:') + '</p>';
    h += '<ul>' + cur.oa.map(o => '<li><b>' + esc(o.code) + '</b> ' + esc(EN ? o.en : o.es) + '</li>').join('') + '</ul>';
  } else h += '<p>' + t('Sin OA escolar directo (contenido universitario).', 'No direct school objective (university content).') + '</p>';
  h += '<p class="noprint"><a href="' + page + '">' + t('Ver la cobertura curricular completa →', 'See the full curriculum coverage →') + '</a></p><!--/aula-->';
  return h;
}

let n = 0, miss = [];
for (const a of AREAS) for (const s of fs.readdirSync(path.join(ROOT, a))) {
  if (!fs.existsSync(path.join(ROOT, a, s, 'index.html'))) continue;
  const id = a + '/' + s;
  for (const [EN, file, depth] of [[false, path.join(ROOT, 'guias', a, s + '.html'), 2], [true, path.join(ROOT, 'guias', 'en', a, s + '.html'), 3]]) {
    if (!fs.existsSync(file)) { miss.push(path.relative(ROOT, file)); continue; }
    let html = fs.readFileSync(file, 'utf8').replace(/<!--aula-->[\s\S]*?<!--\/aula-->\n?/, '');
    const sec = section(id, EN, depth);
    const m = html.match(/<h2 class="pb">/);
    html = m ? html.slice(0, m.index) + sec + '\n' + html.slice(m.index) : html.replace(/<\/main>/, sec + '</main>');
    fs.writeFileSync(file, html); n++;
  }
}
console.log('guías actualizadas: ' + n + (miss.length ? ' · sin guía: ' + miss.join(', ') : ''));
