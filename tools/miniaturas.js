// miniaturas.js — Genera la imagen de portada (miniatura.webp, 560×350) de cada simulación enlazada desde
// simulaciones/index.html, capturando la escena con Edge/Chromium sin interfaz (paneles, barra y avisos ocultos).
// Uso (desde la raíz):   node tools/miniaturas.js            → solo las que faltan
//                        node tools/miniaturas.js --todas    → regenera todas
//                        node tools/miniaturas.js quimica-general/gases biologia/adn   → solo esas
// Requiere playwright (npm i, o NODE_PATH apuntando a una carpeta con playwright) y Edge/Chromium
// (variable CHROMIUM o la ruta por defecto de Edge en Windows).
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', 'simulaciones');
const EXE = process.env.CHROMIUM || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const W = 560, H = 350;

const args = process.argv.slice(2), todas = args.includes('--todas'), pedidas = args.filter(a => !a.startsWith('--'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let sims = [...new Set([...html.matchAll(/class="card" href="([^"]+)\/"/g)].map(m => m[1]))];
if (pedidas.length) sims = pedidas.map(s => s.replace(/\/$/, ''));
else if (!todas) sims = sims.filter(s => !fs.existsSync(path.join(ROOT, s, 'miniatura.webp')));

// Oculta todo lo que no es la escena: modo «limpio» del kit, dock, avisos, botón de idioma, etiquetas 2D.
const CSS = `.k-clean-btn,.dock,.toast,.lang-switch,nav[aria-label=Language],.hud-col,.hud-legend,.hud-phase,.k-hint,.css2d,.label3d{display:none!important}
*{transition:none!important;animation-duration:0s!important}`;

(async () => {
  if (!sims.length) return console.log('Todas las simulaciones ya tienen miniatura.');
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: 1120, height: 700 }, colorScheme: 'light' });
  const conv = await ctx.newPage();
  await conv.setContent('<canvas id="c" width="' + W + '" height="' + H + '"></canvas>');
  let ok = 0;
  for (const s of sims) {
    const p = await ctx.newPage();
    try {
      const url = pathToFileURL(path.join(ROOT, s, 'index.html')).href + '?embed=1';
      await p.goto(url, { waitUntil: 'load', timeout: 30000 });
      await p.addStyleTag({ content: CSS });
      await p.evaluate(() => { const a = document.getElementById('app'); if (a && document.querySelector('.panel')) a.classList.add('k-clean'); window.dispatchEvent(new Event('resize')); });
      await p.waitForTimeout(3500);
      const png = await p.screenshot({ type: 'png' });
      const data = await conv.evaluate(async ([b64, w, h]) => {
        const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
        const IW = im.width, IH = im.height, t = document.createElement('canvas'); t.width = IW; t.height = IH;
        const tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(im, 0, 0); const d = tg.getImageData(0, 0, IW, IH).data;
        // Recuadro del contenido: píxeles que se apartan del fondo (comparado con ambos bordes de la misma fila).
        let x0 = IW, y0 = IH, x1 = -1, y1 = -1; const px = (x, y) => (y * IW + x) * 4;
        for (let y = 0; y < IH; y += 2) {
          const a = px(3, y), z = px(IW - 4, y);
          for (let x = 0; x < IW; x += 2) {
            const i = px(x, y), da = Math.abs(d[i] - d[a]) + Math.abs(d[i + 1] - d[a + 1]) + Math.abs(d[i + 2] - d[a + 2]),
              dz = Math.abs(d[i] - d[z]) + Math.abs(d[i + 1] - d[z + 1]) + Math.abs(d[i + 2] - d[z + 2]);
            if (da > 36 && dz > 36) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          }
        }
        let sx = 0, sy = 0, sw = IW, sh = IH;
        if (x1 > x0 && y1 > y0) {
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = w / h;
          sw = Math.max((x1 - x0) * 1.18, (y1 - y0) * 1.18 * r, IW * 0.42); sh = sw / r;   // margen y zoom máximo ≈ 2,4×
          if (sw > IW) { sw = IW; sh = sw / r; } if (sh > IH) { sh = IH; sw = sh * r; }
          sx = Math.min(Math.max(cx - sw / 2, 0), IW - sw); sy = Math.min(Math.max(cy - sh / 2, 0), IH - sh);
        }
        const c = document.getElementById('c'), g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); return c.toDataURL('image/webp', 0.8);
      }, [png.toString('base64'), W, H]);
      fs.writeFileSync(path.join(ROOT, s, 'miniatura.webp'), Buffer.from(data.split(',')[1], 'base64'));
      ok++; process.stdout.write('✓ ' + s + '\n');
    } catch (e) { console.log('✗ ' + s + ': ' + e.message.split('\n')[0]); }
    await p.close();
  }
  await b.close();
  console.log(ok + '/' + sims.length + ' miniaturas generadas.');
})();
