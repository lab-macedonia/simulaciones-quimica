// probar.js — Abre una simulación MSim nueva en Edge (ES y EN), recorre todas las etapas, abre cada pestaña y
// mueve los controles del Lab; informa errores de JS/consola y guarda capturas. Uso: node probar.js <repo> <area/sim> [carpeta capturas]
// Usa Edge instalado (PW_CHANNEL=chrome para Google Chrome) para no depender del Chromium de Playwright.
const path = require('path'), fs = require('fs');
const [, , REPO, ID, SHOTS] = process.argv;
const pw = require(path.join(REPO, 'node_modules', 'playwright'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await pw.chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let bad = 0;
  for (const file of ['index.html', 'index.en.html']) {
    const errs = [], p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => errs.push('JS: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('consola: ' + m.text()));
    p.on('requestfailed', r => errs.push('no carga: ' + r.url().slice(-80)));
    await p.goto('file://' + path.join(REPO, 'simulaciones', ID, file)); await sleep(1500);
    const n = await p.evaluate(() => window.__sim ? window.__sim.STAGES.length : 0);
    if (!n) errs.push('sin window.__sim');
    for (let i = 0; i < n; i++) {
      await p.evaluate(i => { const k = window.__sim.kit; k.seekStage(i); k.play(); }, i); await sleep(900);
      if (SHOTS && file === 'index.html') await p.screenshot({ path: path.join(SHOTS, ID.replace('/', '_') + '_' + i + '.png') });
    }
    for (const tab of ['lab', 'graf', 'calc', 'practica', 'quiz']) { await p.evaluate(t => { try { window.__sim.kit.selectTab(t); } catch (e) {} }, tab); await sleep(300); }
    await p.evaluate(() => window.__sim.kit.selectTab('lab'));
    const moved = await p.evaluate(() => { let k = 0; document.querySelectorAll('#tab-lab input[type=range], .tabpane input[type=range]').forEach(r => { r.value = (+r.min + +r.max) / 2.3 + ''; r.dispatchEvent(new Event('input', { bubbles: true })); k++; }); document.querySelectorAll('.tabpane .opt, .tabpane .seg button').forEach(b => { b.click(); k++; }); return k; });
    await sleep(1200);
    if (SHOTS && file === 'index.html') await p.screenshot({ path: path.join(SHOTS, ID.replace('/', '_') + '_lab.png') });
    const info = await p.evaluate(() => ({ title: document.title, canvas: document.querySelectorAll('canvas').length, meas: (document.querySelector('.measures, #measures') || {}).innerText || '' }));
    console.log(file + ' · ' + info.title + ' · etapas ' + n + ' · controles probados ' + moved + ' · canvas ' + info.canvas + (errs.length ? '\n  ERRORES:\n   - ' + [...new Set(errs)].join('\n   - ') : ' · OK'));
    bad += errs.length; await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('FALLA:', e.message); process.exit(1); });
