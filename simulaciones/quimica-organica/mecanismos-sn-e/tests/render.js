// Prueba de humo con renderizado real (WebGL por software vía headless-gl + jsdom).
// Uso: NODE_PATH=<node_modules> xvfb-run -a node tests/render.js salida/ sn2:0.5 sn1:0.2:orbitales ...
const path = require('path');
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const createGL = require('gl');
const { PNG } = require('pngjs');

const outDir = process.argv[2] || path.join(__dirname, 'shots');
const jobs = process.argv.slice(3);
fs.mkdirSync(outDir, { recursive: true });
const W = 900, H = 640;

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + String((e.detail && (e.detail.stack || e.detail)) || e.message).split('\n').slice(0, 9).join('\n')));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', (...a) => errors.push('console.warn: ' + a.join(' ').slice(0, 200)));

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.addEventListener('error', ev => errors.push('window.error: ' + (ev.error && ev.error.stack ? ev.error.stack.split('\n').slice(0, 7).join('\n') : ev.message)));
      const orig = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function (type, attrs) {
        if (type === 'webgl' || type === 'experimental-webgl') {
          if (!this._gl) {
            const gl = createGL(W, H, { preserveDrawingBuffer: true, antialias: false, alpha: true, premultipliedAlpha: false });
            const t2d = gl.texImage2D.bind(gl);
            gl.texImage2D = function (...a) {
              if (a.length === 6) {
                const src = a[5];
                if (src && src.getContext) {
                  const c = src.getContext('2d');
                  const d = c.getImageData(0, 0, src.width, src.height);
                  return t2d(a[0], a[1], a[2], src.width, src.height, 0, a[3], a[4], new Uint8Array(d.data.buffer));
                }
              }
              return t2d(...a);
            };
            if (process.env.TRACE_GL) {
              let n = 0;
              const names = Object.getOwnPropertyNames(Object.getPrototypeOf(gl)).filter(k => typeof gl[k] === 'function' && !/^get(Error|Extension|SupportedExtensions|ContextAttributes|Parameter|ShaderPrecisionFormat)$/.test(k));
              names.forEach(k => { const f = gl[k].bind(gl); gl[k] = function (...a) { const r = f(...a); const e = gl.getError(); if (e && n++ < 12) console.log('GL ERROR', e, k, a.map(x => (x && x.length !== undefined && typeof x !== 'string' ? '[' + x.constructor.name + ' ' + x.length + ']' : String(x).slice(0, 40))).join(', ')); return r; }; });
            }
            // Los typed arrays creados en el contexto jsdom pertenecen a otro "realm": se copian a arreglos de Node
            const TA = { Float32Array, Uint16Array, Uint32Array, Uint8Array, Int32Array, Int16Array, Int8Array, Uint8ClampedArray, Float64Array };
            const fixArg = x => {
              if (x && typeof x === 'object' && ArrayBuffer.isView(x)) {
                const n = Object.prototype.toString.call(x).slice(8, -1);
                if (TA[n] && !(x instanceof TA[n])) return new TA[n](x);
              }
              return x;
            };
            ['bufferData', 'bufferSubData', 'uniform1fv', 'uniform2fv', 'uniform3fv', 'uniform4fv', 'uniform1iv', 'uniform2iv', 'uniform3iv', 'uniform4iv',
              'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv', 'vertexAttrib1fv', 'vertexAttrib2fv', 'vertexAttrib3fv', 'vertexAttrib4fv', 'readPixels'].forEach(k => {
              const f = gl[k].bind(gl);
              gl[k] = (...a) => f(...a.map(fixArg));
            });
            gl.canvas = this;
            this._gl = gl;
          }
          return this._gl;
        }
        if (type === 'webgl2') return null;
        return orig.call(this, type, attrs);
      };
      window.HTMLCanvasElement.prototype.toDataURL = window.HTMLCanvasElement.prototype.toDataURL || (() => '');
      // jsdom no calcula layout: se fijan medidas del contenedor del visor
      Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { get() { return this.id === 'canvas-container' ? W : 400; } });
      Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { get() { return this.id === 'canvas-container' ? H : 300; } });
    }
  });
  const { window } = dom;
  await new Promise(r => window.addEventListener('load', r));
  await new Promise(r => setTimeout(r, 300));
  const sim = window.__sim;
  if (!sim) { console.log('NO se creó __sim; errores:', errors); process.exit(1); }
  sim.pause();
  const cv = window.document.querySelector('#canvas-container canvas');
  if (!cv) { console.log('Sin canvas. Errores:\n' + errors.join('\n')); process.exit(1); }
  const gl = cv._gl;

  function shot(name) {
    const buf = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const png = new PNG({ width: W, height: H });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4;
      const o = (y * W + x) * 4;
      const a = buf[i + 3] / 255;
      // sobre fondo degradado oscuro
      const bg = [20 + 14 * (1 - y / H), 26 + 16 * (1 - y / H), 44 + 20 * (1 - y / H)];
      png.data[o] = Math.round(buf[i] * a + bg[0] * (1 - a));
      png.data[o + 1] = Math.round(buf[i + 1] * a + bg[1] * (1 - a));
      png.data[o + 2] = Math.round(buf[i + 2] * a + bg[2] * (1 - a));
      png.data[o + 3] = 255;
    }
    fs.writeFileSync(path.join(outDir, name + '.png'), PNG.sync.write(png));
  }

  if (process.env.DEBUG_SIM) {
    const v = sim.viewer;
    v.update(sim.sc.frame(0.5), sim.state.show, 0.5);
    console.log('render calls', v.renderer.info.render.calls, 'triángulos', v.renderer.info.render.triangles, 'programas', v.renderer.info.programs.length);
    console.log('cámara', v.camera.position.toArray().map(x => x.toFixed(2)), 'target', v.controls.target.toArray().map(x => x.toFixed(2)), 'aspect', v.camera.aspect, 'size', v.renderer.getSize(new window.THREE.Vector2()).toArray());
    console.log('gl error', gl.getError(), 'bounds', JSON.stringify(v.bounds));
    const px = new Uint8Array(4 * 5);
    v.renderer.setClearColor(0xff0000, 1); v.renderer.render(v.scene, v.camera);
    gl.readPixels(5, 5, 5, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); console.log('píxel de fondo tras clear rojo:', Array.from(px.slice(0, 4)));
    v.renderer.setClearColor(0x000000, 0);
    const all = new Uint8Array(W * H * 4); v.renderer.render(v.scene, v.camera); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, all);
    let nz = 0; for (let i = 3; i < all.length; i += 4) if (all[i] > 0) nz++; console.log('píxeles con alfa>0:', nz);
    const prog = v.renderer.info.programs.map(p => p.name + ':' + (p.diagnostics ? 'diag' : 'ok')); console.log(prog.join(', '));
    const T = window.THREE;
    const count = () => { v.renderer.render(v.scene, v.camera); const b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); let n = 0; for (let i = 3; i < b.length; i += 4) if (b[i] > 0) n++; return n; };
    v.renderer.shadowMap.enabled = false; v.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    console.log('sin sombras:', count());
    v.renderer.toneMapping = T.NoToneMapping; v.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    console.log('sin tone mapping:', count());
    v.renderer.outputEncoding = T.LinearEncoding; v.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    console.log('encoding lineal:', count());
    const keep = v.atoms.C.mesh; const vis = []; v.scene.traverse(o => { if (o.isMesh || o.isSprite || o.isLine) { vis.push([o, o.visible]); o.visible = (o === keep); } });
    console.log('solo átomo C:', count());
    vis.forEach(([o, vv]) => (o.visible = vv));
    {
      const sc2 = new T.Scene(); const cam2 = new T.PerspectiveCamera(40, W / H, 0.1, 100); cam2.position.set(0, 0, 5);
      sc2.add(new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: 0xff0000 })));
      v.renderer.render(sc2, cam2); const b = new Uint8Array(4); gl.readPixels(W / 2, H / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, b); console.log('escena mínima, píxel central:', Array.from(b), 'err', gl.getError());
      // mismo con la cámara del visor y el átomo C aislado
      const sc3 = new T.Scene(); const m = new T.Mesh(new T.SphereGeometry(1, 16, 12), new T.MeshBasicMaterial({ color: 0x00ff00 })); m.scale.setScalar(2); sc3.add(m);
      v.renderer.render(sc3, v.camera); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, all); let n3 = 0; for (let i = 3; i < all.length; i += 4) if (all[i] > 0) n3++; console.log('esfera básica con cámara del visor:', n3);
      console.log('cámara matriz proj det', v.camera.projectionMatrix.determinant(), 'near/far', v.camera.near, v.camera.far, 'fov', v.camera.fov, 'zoom', v.camera.zoom);
      console.log('viewport', v.renderer.getViewport(new T.Vector4()).toArray(), 'pixelRatio', v.renderer.getPixelRatio());
    }
    const a = v.atoms.C; console.log('átomo C', a.mesh.visible, a.mesh.position.toArray(), a.mesh.scale.toArray());
  }
  for (const job of jobs) {
    const [mech, tt, ...flags] = job.split(':');
    sim.setMechanism(mech);
    sim.pause();
    // capas
    const show = sim.state.show;
    const defaults = { flechas: true, orbitales: false, cargas: true, halos: true, hiper: true, rotulos: false, medidas: false, trayectorias: false };
    Object.assign(show, defaults);
    flags.forEach(f => { if (f in show) show[f] = true; if (f === 'sin_flechas') show.flechas = false; });
    sim.seek(parseFloat(tt));
    await new Promise(r => setTimeout(r, 120));
    shot(`${mech}_${tt}${flags.length ? '_' + flags.join('+') : ''}`);
    console.log('captura', mech, tt, flags.join(','));
  }
  console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'sin errores de consola');
  process.exit(0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
