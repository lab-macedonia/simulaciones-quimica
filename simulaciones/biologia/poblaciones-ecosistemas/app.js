/* Poblaciones y ecosistemas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f0 = function (x) { return fmt(x, 0); }, f2 = function (x) { return fmt(x, 2); };
  var S = { N: 20, P: 0, C: 0, r: 0.9, K: 400, a: 0.015, b: 0.2, m: 0.3, pred: false, inv: false, hunt: 0, hab: 0, logi: true, t: 0, hist: [] };
  var G = {}, lab = {}, preyM, predM, invM, dm, R = 9;
  function Keff() { return S.K * (1 - S.hab); }
  function deriv(N, P, C) {
    var K = Keff(), dN = S.r * N * (S.logi ? 1 - (N + 1.2 * C) / K : 1) - S.a * N * P, dC = S.inv ? 1.1 * S.r * C * (1 - (C + 0.6 * N) / K) - S.a * 0.6 * C * P : 0, dP = S.pred ? S.b * S.a * (N + 0.6 * C) * P - (S.m + S.hunt) * P : 0;
    return [dN, dP, dC];
  }
  function step(dt) {
    var n = 20, h = dt / n;
    for (var k = 0; k < n; k++) { var d = deriv(S.N, S.P, S.C); S.N = Math.max(0, S.N + d[0] * h); S.P = Math.max(0, S.P + d[1] * h); S.C = Math.max(0, S.C + d[2] * h); if (S.N > 5000) S.N = 5000; }
    S.t += dt; S.hist.push([S.t, S.N, S.P, S.C]); if (S.hist.length > 600) S.hist.shift();
  }
  function reset(N, P, C) { S.N = N; S.P = P; S.C = C || 0; S.t = 0; S.hist = []; }
  function stages() {
    return [
      ['Niveles de organización', 'Niveles', 'Individuo, población, comunidad y ecosistema',
        '<p>Un <b>individuo</b> es un organismo, como un degú. Los degúes de un lugar forman una <b>población</b> (misma especie, mismo lugar y tiempo). Las poblaciones de distintas especies que conviven —pastos, degúes, zorros culpeo— forman una <b>comunidad</b>. La comunidad junto con los factores <b>abióticos</b> (agua, luz, temperatura, suelo) es un <b>ecosistema</b>, como el matorral de Chile central.</p>'],
      ['Crecimiento exponencial', 'Exponencial', 'Con recursos ilimitados la población se multiplica: curva J',
        '<p>Si hay alimento y espacio de sobra y no hay depredadores, cada generación es mayor que la anterior en la misma proporción: el crecimiento es <b>exponencial</b> (curva en forma de J), dN/dt = r·N. Ninguna población puede crecer así por mucho tiempo: los recursos se acaban. Ocurre al colonizar un ambiente nuevo, como el conejo europeo al llegar a Chile.</p>'],
      ['Capacidad de carga', 'Capacidad', 'Los recursos limitan el crecimiento: la población se estabiliza en K',
        '<p>Al aumentar la población, el alimento y el espacio por individuo disminuyen: baja la natalidad y sube la mortalidad. Son <b>factores dependientes de la densidad</b>. La población crece en forma de <b>S</b> (crecimiento <b>logístico</b>) y se estabiliza en la <b>capacidad de carga K</b>: el máximo que el ambiente puede sostener. Otros factores, como una helada o un incendio, actúan sin importar la densidad.</p>'],
      ['Depredador y presa', 'Depredación', 'Las poblaciones de zorros y degúes oscilan desfasadas',
        '<p>Llegan los <b>zorros culpeo</b>. Con muchas presas, los depredadores se alimentan bien y se reproducen; al aumentar, comen más degúes y estos disminuyen; luego, sin alimento, los zorros disminuyen y los degúes se recuperan. Las dos poblaciones <b>oscilan</b>, con el máximo del depredador <b>después</b> del de la presa. La depredación <b>regula</b> ambas poblaciones.</p>'],
      ['Competencia y especies invasoras', 'Competencia', 'Dos especies que usan el mismo recurso compiten',
        '<p>Se introduce el <b>conejo europeo</b>, que come los mismos pastos que el degú: hay <b>competencia interespecífica</b>. El conejo, sin enemigos naturales eficaces en Chile, se reproduce más rápido y desplaza al degú. Las <b>especies invasoras</b> son una de las principales causas de pérdida de biodiversidad. Otras interacciones son el <b>mutualismo</b> (ambos ganan, como abejas y flores) y el <b>parasitismo</b>.</p>'],
      ['Acción humana', 'Humanos', 'Pérdida de hábitat y caza alteran el equilibrio del ecosistema',
        '<p>Las actividades humanas cambian los ecosistemas: la <b>pérdida de hábitat</b> (urbanización, incendios, monocultivos) reduce la capacidad de carga; la <b>caza</b> de depredadores puede provocar explosiones de herbívoros; la <b>contaminación</b> y el <b>cambio climático</b> afectan la natalidad y la mortalidad. Las áreas protegidas y el control de especies invasoras ayudan a conservar la biodiversidad.</p>']
    ];
  }
  function lessonSet(i, l, ctx, dt, f) {
    if (ctx._st !== i) {
      ctx._st = i; S.hunt = 0; S.hab = 0;
      if (i === 0) { S.pred = true; S.inv = false; S.logi = true; reset(300, 18, 0); }
      else if (i === 1) { S.pred = false; S.inv = false; S.logi = false; reset(10, 0, 0); }
      else if (i === 2) { S.pred = false; S.inv = false; S.logi = true; reset(10, 0, 0); }
      else if (i === 3) { S.pred = true; S.inv = false; S.logi = true; reset(250, 6, 0); }
      else if (i === 4) { S.pred = false; S.inv = true; S.logi = true; reset(380, 0, 4); }
      else { S.pred = true; S.inv = false; S.logi = true; reset(250, 20, 0); }
    }
    if (i === 5) { S.hab = l > 0.15 ? 0.5 : 0; S.hunt = l > 0.55 ? 0.6 : 0; }
    if (f.playing) step(dt * (i === 1 ? 0.9 : 2.2));
  }
  var def = {
    key: 'poblaciones-ecosistemas', title: 'Poblaciones y ecosistemas', subtitle: 'Simulador 3D · biología', accent: { dark: '#8ce99a', light: '#2b8a3e' },
    stages: stages, nStages: 6, dur: 14, offset: 0.2,
    views: [{ id: 'libre', label: 'Libre', pos: [-2, 12, 17], target: [-1.5, 0, 0] }, { id: 'sup', label: 'Superior', pos: [-1.5, 24, 1], target: [-1.5, 0, 0] }],
    layers: [{ id: 'veg', label: 'Vegetación', icon: '✿' }],
    build: function (ctx) {
      var s = ctx.scene; dm = new T.Object3D();
      G.ground = new T.Mesh(new T.CylinderGeometry(R + 0.5, R + 0.5, 0.3, 48), new T.MeshStandardMaterial({ color: 0x8c7a4a, roughness: 1 })); G.ground.position.y = -0.15; s.add(G.ground);
      G.lost = new T.Mesh(new T.CylinderGeometry(R + 0.52, R + 0.52, 0.32, 48, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: 0x868e96, roughness: 1 })); G.lost.position.y = -0.14; s.add(G.lost);
      var gg = new T.ConeGeometry(0.18, 0.6, 5); G.grass = new T.InstancedMesh(gg, new T.MeshStandardMaterial({ color: 0x51cf66 }), 260); for (var k = 0; k < 260; k++) { var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R; dm.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r); dm.scale.setScalar(0.7 + Math.random() * 0.8); dm.updateMatrix(); G.grass.setMatrixAt(k, dm.matrix); } s.add(G.grass);
      function herd(n, geo, col) { var m = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: col, roughness: 0.6 }), n); m.frustumCulled = false; m.userData.pos = []; for (var k = 0; k < n; k++) { var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (R - 0.5); m.userData.pos.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: Math.random() * 6.28, s: 0.5 + Math.random() }); } s.add(m); return m; }
      preyM = herd(160, new T.SphereGeometry(0.22, 10, 8), 0xb08155); predM = herd(40, new T.ConeGeometry(0.3, 0.8, 8), 0xe8590c); invM = herd(160, new T.SphereGeometry(0.24, 10, 8), 0xdee2e6);
      ['a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local, ctx, dt, f); else step(dt * 2.2);
      G.grass.visible = ctx.layer('veg'); G.lost.visible = S.hab > 0; G.lost.rotation.y = 0;
      var half = S.hab > 0;
      [[preyM, S.N / 3, 0.22], [predM, S.P, 0.4], [invM, S.C / 3, 0.24]].forEach(function (q) {
        var m = q[0], n = Math.min(m.count, Math.round(q[1]));
        for (var k = 0; k < m.count; k++) {
          var p = m.userData.pos[k];
          if (k < n) { p.h += (Math.random() - 0.5) * 0.4; p.x += Math.cos(p.h) * dt * p.s * 0.8; p.z += Math.sin(p.h) * dt * p.s * 0.8; var rr = Math.hypot(p.x, p.z); if (rr > R - 0.4 || (half && p.z > 0)) { p.h += Math.PI; p.x *= 0.97; p.z = half ? Math.min(p.z, -0.1) * 0.99 : p.z * 0.97; } dm.position.set(p.x, q[2], p.z); dm.rotation.set(0, -p.h, 0); dm.scale.setScalar(1); }
          else { dm.position.set(0, -20, 0); dm.scale.setScalar(0.001); }
          dm.updateMatrix(); m.setMatrixAt(k, dm.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
      lab.a.pos(-1.5, 3.4, 0).set('Degúes ≈ ' + f0(S.N) + (S.pred ? ' · Zorros ≈ ' + f0(S.P) : '') + (S.inv ? ' · Conejos ≈ ' + f0(S.C) : ''), 'bl-lead').vis(true);
      lab.b.pos(-1.5, 2.4, 0).set('t = ' + fmt(S.t, 1) + ' meses · K = ' + f0(Keff()) + (S.logi ? '' : ' (sin límite)'), 'bl-d').vis(true);
      lab.c.pos(0, 1.2, R * 0.55).set('Hábitat perdido', 'bl-warn').vis(half);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.r && u.r.set(S.r); u.K && u.K.set(S.K); } },
    hud: function () { return { eq: { chip: 'N', name: S.inv ? 'Competencia' : S.pred ? 'Depredador–presa' : (S.logi ? 'Crecimiento logístico' : 'Crecimiento exponencial'), body: '<div class="eqline"><small>Exponencial</small>dN/dt = r·N</div><div class="eqline"><small>Logístico</small>dN/dt = r·N·(1 − N/K)</div><div class="eqline"><small>Depredación</small>− a·N·P</div>' }, legend: [{ label: 'Café', color: '#b08155', text: 'degú (presa; cada esfera ≈ 3 individuos)' }, { label: 'Naranja', color: '#e8590c', text: 'zorro culpeo (depredador)' }, { label: 'Blanco', color: '#dee2e6', text: 'conejo europeo (especie invasora)' }] }; },
    measures: function () { return [['Tiempo', fmt(S.t, 1) + ' meses'], ['Degúes', f0(S.N)], ['Zorros', S.pred ? f0(S.P) : '—'], ['Conejos (invasores)', S.inv ? f0(S.C) : '—'], ['Tasa de crecimiento r', f2(S.r) + ' por mes'], ['Capacidad de carga', f0(Keff())], ['Hábitat perdido', f0(S.hab * 100) + ' %'], ['Caza de zorros', S.hunt ? 'sí' : 'no']]; },
    ideas: ['Población: individuos de una especie en un lugar; comunidad: varias poblaciones.', 'Ecosistema = comunidad + factores abióticos.', 'Exponencial (J) con recursos ilimitados; logístico (S) con capacidad de carga K.', 'Depredador y presa oscilan desfasados.', 'Competencia: dos especies por el mismo recurso; invasoras desplazan nativas.', 'Pérdida de hábitat y caza alteran el equilibrio.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Población'); el.appendChild(c);
      ui.r = kit.ui.slider({ label: 'Tasa de crecimiento r (por mes)', min: 0.1, max: 1.5, step: 0.05, value: S.r, digits: 2, onInput: function (v) { ctx.goManual(); S.r = v; } });
      ui.K = kit.ui.slider({ label: 'Capacidad de carga K', min: 100, max: 800, step: 20, value: S.K, digits: 0, onInput: function (v) { ctx.goManual(); S.K = v; } });
      ui.hab = kit.ui.slider({ label: 'Pérdida de hábitat (%)', min: 0, max: 80, step: 5, value: S.hab * 100, digits: 0, onInput: function (v) { ctx.goManual(); S.hab = v / 100; } });
      c.appendChild(kit.ui.sliders([ui.r, ui.K, ui.hab]));
      c.appendChild(ctx.btnRow([{ t: 'Límite de recursos sí / no', fn: function () { ctx.goManual(); S.logi = !S.logi; } }, { t: 'Zorros sí / no', fn: function () { ctx.goManual(); S.pred = !S.pred; if (S.pred && S.P < 1) S.P = 5; } }, { t: 'Conejos invasores sí / no', fn: function () { ctx.goManual(); S.inv = !S.inv; if (S.inv && S.C < 1) S.C = 4; } }, { t: 'Caza de zorros sí / no', fn: function () { ctx.goManual(); S.hunt = S.hunt ? 0 : 0.6; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Reiniciar', primary: true, fn: function () { ctx.goManual(); reset(20, S.pred ? 5 : 0, S.inv ? 4 : 0); } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Poblaciones en el tiempo', h: 230, note: 'Café: degúes; naranja: zorros (×10 para verlos); gris: conejos. Línea punteada: capacidad de carga.', draw: function (cx, w, h, col) {
        var L = 44, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, H = S.hist, t0 = H.length ? H[0][0] : 0, t1 = Math.max(t0 + 10, H.length ? H[H.length - 1][0] : 10), ym = Math.max(S.K * 1.15, 100); H.forEach(function (q) { ym = Math.max(ym, q[1], q[3], q[2] * 10); }); ym = Math.min(ym, 3000);
        var sx = function (t) { return L + pw * (t - t0) / (t1 - t0); }, sy = function (v) { return Tp + ph - ph * Math.min(v, ym) / ym; }, i;
        cx.font = '10.5px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(ym * i / 4)); cx.lineTo(L + pw, sy(ym * i / 4)); cx.stroke(); cx.fillText(fmt(ym * i / 4, 0), L - 5, sy(ym * i / 4) + 3); }
        cx.textAlign = 'center'; cx.fillText('tiempo (meses)  ·  individuos', L + pw / 2, h - 3); cx.fillText(fmt(t0, 0), L, h - B + 13); cx.fillText(fmt(t1, 0), L + pw, h - B + 13);
        if (S.logi) { cx.strokeStyle = col.muted; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(L, sy(Keff())); cx.lineTo(L + pw, sy(Keff())); cx.stroke(); cx.setLineDash([]); }
        [[1, '#b08155', 1], [2, '#e8590c', 10], [3, '#adb5bd', 1]].forEach(function (c) { if (c[0] === 2 && !S.pred) return; if (c[0] === 3 && !S.inv) return; cx.strokeStyle = c[1]; cx.lineWidth = 2.4; cx.beginPath(); H.forEach(function (q, k) { var y = sy(q[c[0]] * c[2]); if (k) cx.lineTo(sx(q[0]), y); else cx.moveTo(sx(q[0]), y); }); cx.stroke(); }); cx.lineWidth = 1;
      } },
      { title: 'Ciclo depredador–presa', h: 210, note: 'Cada punto es un instante (degúes, zorros). Las oscilaciones forman una órbita cerrada.', draw: function (cx, w, h, col) {
        var L = 44, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, xm = Math.max(100, S.K), ym = 60, sx = function (n) { return L + pw * Math.min(n, xm) / xm; }, sy = function (p) { return Tp + ph - ph * Math.min(p, ym) / ym; };
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; cx.fillText('degúes  ·  zorros', L + pw / 2, h - 3); cx.strokeStyle = col.line; cx.strokeRect(L, Tp, pw, ph);
        if (!S.pred) { cx.fillText('Activa los zorros para ver el ciclo', L + pw / 2, Tp + ph / 2); return; }
        cx.strokeStyle = '#e8590c'; cx.lineWidth = 1.8; cx.beginPath(); S.hist.forEach(function (q, k) { if (k) cx.lineTo(sx(q[1]), sy(q[2])); else cx.moveTo(sx(q[1]), sy(q[2])); }); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; }, d = deriv(S.N, S.P, S.C);
      return '<div class="card-kicker">Dinámica en t = ' + fmt(S.t, 1) + ' meses</div><table class="calc-table">' + row('Crecimiento de degúes', S.logi ? 'r·N·(1 − N/K) = ' + f2(S.r) + '·' + f0(S.N) + '·(1 − ' + f0(S.N) + '/' + f0(Keff()) + ')' : 'r·N = ' + f2(S.r) + '·' + f0(S.N)) + row('dN/dt total', '<b>' + fmt(d[0], 1) + ' por mes</b>') + row('Duplicación (exponencial)', 't = ln2/r = <b>' + fmt(Math.LN2 / S.r, 2) + ' meses</b>') + (S.pred ? row('dP/dt (zorros)', '<b>' + fmt(d[1], 2) + ' por mes</b>') : '') + row('Interpretación', Math.abs(d[0]) < 1 ? 'la población está cerca del equilibrio' : d[0] > 0 ? 'la población crece' : 'la población disminuye') + '</table>';
    },
    quiz: [
      { q: 'Todos los degúes que viven en un cerro forman…', options: ['una población', 'una comunidad', 'un ecosistema', 'un individuo'], answer: 0, why: 'Misma especie, mismo lugar y tiempo.' },
      { q: 'Un ecosistema está formado por…', options: ['la comunidad y los factores abióticos', 'solo los animales', 'solo las plantas', 'una sola especie'], answer: 0, why: 'Bióticos + abióticos.' },
      { q: 'El crecimiento exponencial ocurre cuando…', options: ['los recursos son abundantes y no hay limitantes', 'la población alcanzó K', 'hay muchos depredadores', 'hay competencia fuerte'], answer: 0, why: 'Curva J.' },
      { q: 'La capacidad de carga es…', options: ['el número máximo de individuos que el ambiente puede sostener', 'la natalidad máxima', 'el peso de los individuos', 'la cantidad de depredadores'], answer: 0, why: 'Determinada por alimento, espacio, agua…' },
      { q: 'En un ciclo depredador–presa, el máximo de depredadores ocurre…', options: ['después del máximo de presas', 'antes del máximo de presas', 'al mismo tiempo', 'nunca'], answer: 0, why: 'Primero abundan las presas y luego los depredadores que las comen.' },
      { q: 'El conejo europeo en Chile es un ejemplo de…', options: ['especie invasora', 'mutualismo', 'especie endémica', 'depredador tope'], answer: 0, why: 'Introducido, sin control natural, desplaza especies nativas.' },
      { q: 'Si se cazan todos los zorros de un lugar, lo más probable es que los degúes…', options: ['aumenten hasta que se agote el alimento', 'desaparezcan', 'no cambien', 'migren todos'], answer: 0, why: 'Sin depredación crecen hasta la capacidad de carga o más.' },
      { q: 'Un factor dependiente de la densidad es…', options: ['la escasez de alimento', 'una helada', 'una erupción volcánica', 'un incendio'], answer: 0, why: 'Afecta más cuanto más densa es la población.' }
    ],
    help: { intro: 'En «Lab» cambia la tasa de crecimiento y la capacidad de carga, agrega depredadores o una especie invasora, y simula la pérdida de hábitat o la caza.', items: [['Esferas cafés', 'degúes (cada esfera ≈ 3 individuos).'], ['Conos naranjas', 'zorros culpeo; esferas blancas: conejos europeos.'], ['Gráficos', 'poblaciones en el tiempo y ciclo depredador–presa.']], try: ['Quita el límite de recursos: ¿qué forma tiene la curva?', 'Agrega zorros: ¿quién alcanza primero su máximo?', 'Introduce conejos: ¿qué le pasa al degú?'] }
  };
  MSim.create(def);
})();
