// Prueba de humo: carga una simulación en jsdom con WebGL/canvas simulados y recorre etapas, pestañas, frames y desafío.
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]); const errs = []; const vc = new VirtualConsole();
vc.on('jsdomError', e => /requestSubmit|Not implemented/.test(e.message) ? 0 : errs.push('jsdomError: ' + (e.detail && e.detail.stack || e.message)));
vc.on('error', (...a) => errs.push('console.error: ' + a.join(' ')));
const html = fs.readFileSync(path.join(dir, process.env.PAGE||'index.html'), 'utf8');
const dom = new JSDOM(html.replace(/<script[^>]*src=[^>]*><\/script>/g, '').replace(/<link rel="stylesheet"[^>]*>/g, ''), { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
const w = dom.window; const proxyCtx = () => new Proxy(function(){}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop(){} }) : k === 'canvas' ? {} : proxyCtx(), set: () => true, apply: () => proxyCtx() });
w.HTMLCanvasElement.prototype.getContext = function () { return proxyCtx(); };
w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,'; w.HTMLCanvasElement.prototype.toBlob = cb => cb(null);
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} };
w.IntersectionObserver = class { observe(){} disconnect(){} unobserve(){} };
Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get() { return 1000; } }); Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { get() { return 600; } });
w.HTMLElement.prototype.getBoundingClientRect = function () { return { width: 1000, height: 600, left: 0, top: 0, right: 1000, bottom: 600, x: 0, y: 0 }; };
w.HTMLElement.prototype.setPointerCapture = () => {}; w.scrollTo = () => {};
let raf = []; w.requestAnimationFrame = cb => { raf.push(cb); return raf.length; }; w.cancelAnimationFrame = () => {};
const run = f => w.eval(fs.readFileSync(path.resolve(dir, f), 'utf8'));
const kit = path.resolve(dir, '../../kit/vendor/');
w.eval(fs.readFileSync(kit + '/three.min.js', 'utf8'));
w.THREE.WebGLRenderer = class { constructor() { this.domElement = w.document.createElement('canvas'); this.shadowMap = {}; this.capabilities = {}; } setPixelRatio(){} setSize(){} render(){} dispose(){} setClearColor(){} getContext(){ return {}; } };
w.eval(fs.readFileSync(kit + '/OrbitControls.js', 'utf8')); w.eval(fs.readFileSync(kit + '/CSS2DRenderer.js', 'utf8'));
const scripts = [...html.matchAll(/<script[^>]*src="([^"?]+)[^"]*"/g)].map(m => m[1]).filter(s => !/vendor\//.test(s));
try { scripts.forEach(s => w.eval(fs.readFileSync(path.resolve(dir, s), 'utf8'))); } catch (e) { errs.push('LOAD: ' + e.stack); }
const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
try {
  w.document.dispatchEvent(new w.Event('DOMContentLoaded')); 
  let t = 0; const step = (n, dtms) => { for (let i = 0; i < n; i++) { const q = raf; raf = []; t += dtms; q.forEach(cb => { try { cb(t); } catch (e) { errs.push('FRAME: ' + e.stack); } }); } };
  step(30, 33);
  const sim = w.__sim; if (!sim) errs.push('window.__sim no existe');
  const stages = sim ? sim.STAGES.length : 0;
  // barrido de la línea de tiempo (modo lección): cubre todo el guion de cada etapa
  { const sl = w.document.getElementById('slider'); if (sl) { const mn = +sl.min, mx = +sl.max, n = 120; for (let i = 0; i <= n; i++) { try { sl.value = mn + (mx - mn) * i / n; ev(sl, 'input'); ev(sl, 'change'); step(2, 40); } catch (e) { errs.push('TIMELINE ' + i + ': ' + e.stack); } } } }
  // etapas
  const steps = w.document.querySelectorAll('.step'); steps.forEach((b, k) => { try { b.click(); step(25, 50); } catch (e) { errs.push('STAGE ' + k + ': ' + e.stack); } });
  // pestañas
  w.document.querySelectorAll('[role=tab], .tab, .tabs button').forEach((b, k) => { try { b.click(); step(10, 50); } catch (e) { errs.push('TAB ' + k + ': ' + e.stack); } });
  // botones y controles del Lab
  w.document.querySelectorAll('button').forEach((b, k) => { const tx = (b.textContent || '').trim(); if (/^(▶|⏸|Reproducir)/.test(tx)) return; try { b.click(); step(3, 40); } catch (e) { errs.push('BTN ' + tx + ': ' + e.stack); } });
  w.document.querySelectorAll('input[type=range]').forEach((r, k) => { try { const mn = +r.min, mx = +r.max; [mn, mx, (mn + mx) / 2].forEach(v => { r.value = v; ev(r, 'input'); ev(r, 'change'); step(4, 40); }); } catch (e) { errs.push('RANGE ' + k + ': ' + e.stack); } });
  w.document.querySelectorAll('select').forEach((s, k) => { try { for (let i = 0; i < s.options.length; i++) { s.selectedIndex = i; ev(s, 'change'); step(4, 40); } } catch (e) { errs.push('SELECT ' + k + ': ' + e.stack); } });
  w.document.querySelectorAll('.opt, [role=radio], .options button, .seg button').forEach((b, k) => { try { b.click(); step(4, 40); } catch (e) { errs.push('OPT ' + k + ': ' + e.stack); } });
  step(60, 33);
  const txt = w.document.body.textContent; if (/\bNaN\b|undefined|Infinity/.test(txt)) { const m = txt.match(/.{30}(\bNaN\b|undefined|Infinity).{30}/); errs.push('TEXTO sospechoso: ' + (m ? m[0] : '')); }
  console.log(path.basename(dir) + ': etapas=' + stages + ' botones=' + w.document.querySelectorAll('button').length + ' rangos=' + w.document.querySelectorAll('input[type=range]').length);
} catch (e) { errs.push('RUN: ' + e.stack); }
if (errs.length) { console.log('ERRORES (' + errs.length + '):'); [...new Set(errs)].slice(0, 12).forEach(e => console.log(' - ' + e.split('\n').slice(0, 4).join('\n   '))); process.exit(1); } else console.log('OK sin errores');
