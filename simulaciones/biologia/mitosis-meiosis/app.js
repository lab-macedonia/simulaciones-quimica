/* Mitosis y meiosis — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var f1 = function (x) { return fmt(x, 1); }, T = THREE;
  var RED = 0xff6b6b, BLUE = 0x4dabf7, LEN = [1.9, 1.2];
  var RND = [[-1.0, 0.9, 0.5, 0.4], [0.8, -1.1, -0.4, -0.8], [1.1, 1.0, 0.6, 1.2], [-0.7, -0.9, -0.7, 2.1]];
  var S = { mode: 'mit', u: 0, co: true, o0: 0, o1: 1, run: false, _st: -1, auto: false }, ch = [], cells = [], nucs = [], sp = [], cen = [], lab = {};
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function stages() {
    return [
      ['Interfase y duplicación', 'Interfase', 'G1 → S (replicación del ADN) → G2: cada cromosoma pasa a tener dos cromátidas hermanas',
        '<p>Antes de dividirse, la célula pasa por la <b>interfase</b>: <b>G1</b> (crecimiento), <b>S</b> (se replica el ADN) y <b>G2</b> (preparación). Tras la fase S cada cromosoma consta de <b>dos cromátidas hermanas idénticas</b> unidas por el <b>centrómero</b>. En el modelo: <b>2n = 4</b> (dos pares de homólogos: grande y pequeño; <b>rojo</b> = origen materno, <b>azul</b> = paterno). El contenido de ADN pasa de <b>2C a 4C</b>.</p>'],
      ['Mitosis: profase y metafase', 'Profase–Metafase', 'Condensación, ruptura de la envoltura nuclear y alineación en la placa ecuatorial',
        '<p>En la <b>profase</b> los cromosomas se <b>condensan</b>, se rompe la envoltura nuclear y los <b>centrosomas</b> migran a polos opuestos formando el <b>huso mitótico</b>. En la <b>metafase</b> los cromosomas se alinean en la <b>placa ecuatorial</b>, cada cromátida unida por su <b>cinetocoro</b> a microtúbulos de polos opuestos. Es el punto de control del huso: no se avanza hasta que todos estén bien unidos.</p>'],
      ['Mitosis: anafase y citocinesis', 'Anafase–Citocinesis', 'Las cromátidas hermanas se separan y se forman dos células idénticas (2n)',
        '<p>En la <b>anafase</b> se separan los centrómeros y los microtúbulos arrastran <b>cada cromátida hermana</b> a un polo; a partir de ahí cada una es un cromosoma completo. En la <b>telofase</b> se reconstruyen las envolturas nucleares y los cromosomas se descondensan; la <b>citocinesis</b> divide el citoplasma (en animales, por un anillo contráctil). Resultado: <b>dos células hijas 2n, genéticamente idénticas</b>, cada una con 2C de ADN.</p>'],
      ['Meiosis I', 'Meiosis I', 'Sinapsis, entrecruzamiento y separación de cromosomas homólogos (2n → n)',
        '<p>En la <b>profase I</b> los homólogos se emparejan (<b>sinapsis</b>) formando <b>bivalentes</b>, y las cromátidas no hermanas intercambian segmentos en los <b>quiasmas</b> (<b>entrecruzamiento</b>: variabilidad). En la <b>metafase I</b> los bivalentes se alinean y la orientación de cada par hacia un polo es <b>aleatoria</b> (segregación independiente). En la <b>anafase I</b> se separan los <b>homólogos</b> (no las cromátidas). Resultan <b>2 células haploides (n)</b>, con cromosomas aún duplicados (2C).</p>'],
      ['Meiosis II', 'Meiosis II', 'Se separan las cromátidas hermanas: 4 células haploides (n, 1C)',
        '<p>La <b>meiosis II</b> se parece a una mitosis, <b>sin replicación previa del ADN</b>. En la <b>metafase II</b> los cromosomas (aún con dos cromátidas, algunas recombinantes) se alinean en cada célula; en la <b>anafase II</b> se separan las <b>cromátidas hermanas</b>. Se obtienen <b>cuatro células haploides (n = 2) genéticamente distintas</b>, cada una con 1C de ADN: las futuras gametos (óvulo, espermatozoide) o esporas.</p>'],
      ['Variabilidad genética', 'Variabilidad', 'Segregación independiente (2ⁿ) + entrecruzamiento = enorme diversidad',
        '<p>Dos fuentes de variabilidad: (1) <b>segregación independiente</b> de los cromosomas homólogos: con n pares hay <b>2ⁿ</b> combinaciones posibles (aquí 2² = 4; en humanos <b>2²³ ≈ 8,4 millones</b>); (2) el <b>entrecruzamiento</b>, que crea cromátidas recombinantes. Observa cómo cambian los colores de las cromátidas y qué combinación (rojo/azul) recibe cada gameto. Mitosis: clon; meiosis: diversidad.</p>']
    ];
  }
  function phaseName() {
    var u = S.u;
    if (S.mode === 'mit') return u < 0.05 ? 'G1' : (u < 0.1 ? 'Fase S (replicación)' : (u < 0.2 ? 'G2' : (u < 0.3 ? 'Profase' : (u < 0.45 ? 'Metafase' : (u < 0.62 ? 'Anafase' : (u < 0.8 ? 'Telofase' : 'Citocinesis'))))));
    return u < 0.1 ? 'Interfase (S)' : (u < 0.2 ? 'Profase I (sinapsis y entrecruzamiento)' : (u < 0.3 ? 'Metafase I' : (u < 0.42 ? 'Anafase I' : (u < 0.5 ? 'Telofase I y citocinesis' : (u < 0.62 ? 'Profase II / Metafase II' : (u < 0.78 ? 'Anafase II' : 'Telofase II y citocinesis'))))));
  }
  function side(p, h) { var o = p === 0 ? S.o0 : S.o1; return h === o ? -1 : 1; }
  function layout(c, p, h, s) {
    var u = S.u, r = RND[p * 2 + h], e = { vis: true, rz: 0, cond: 0, x: 0, y: 0, z: 0, sp: 0 };
    if (S.mode === 'mit') {
      var cd = sm((u - 0.1) / 0.2) * (1 - sm((u - 0.66) / 0.12)), dup = sm((u - 0.05) / 0.05), m1 = sm((u - 0.2) / 0.12), ap = sm((u - 0.47) / 0.15), tel = sm((u - 0.64) / 0.12), cc = p * 2 + h;
      e.vis = s === 0 || dup > 0.02; e.cond = cd;
      var sx = r[0] * 1.2 + (s - 0.5) * 0.3 * dup, sy = r[1] * 1.2, sz = r[2] * 1.0 + (s - 0.5) * 0.15 * dup, sg = s ? 1 : -1;
      var px = sg * (0.17 + 4.0 * ap), py = (cc - 1.5) * 1.7, pz = 0;
      var x = lerp(sx, px, m1), y = lerp(sy, py, m1), z = lerp(sz, pz, m1);
      var tx = sg * 4.2 + r[0] * 0.4, ty = r[1] * 0.6, tz = r[2] * 0.5;
      e.x = lerp(x, tx, tel); e.y = lerp(y, ty, tel); e.z = lerp(z, tz, tel); e.rz = lerp(lerp(r[3], 0, m1), r[3], tel); e.sp = sg;
    } else {
      var cd2 = sm((u - 0.08) / 0.1) * (1 - sm((u - 0.8) / 0.15)), dup2 = sm((u - 0.02) / 0.05), m_s = sm((u - 0.1) / 0.08), m_m = sm((u - 0.2) / 0.07), a1 = sm((u - 0.3) / 0.12), mII = sm((u - 0.5) / 0.1), a2 = sm((u - 0.62) / 0.15), t2 = sm((u - 0.8) / 0.1), sd = side(p, h);
      e.vis = s === 0 || dup2 > 0.02; e.cond = cd2;
      var sx2 = r[0] * 1.2, sy2 = r[1] * 1.2, sz2 = r[2] * 1.0 + (s - 0.5) * 0.15 * dup2;
      var bx1 = 0, by1 = (p - 0.5) * 3.4 + (h - 0.5) * 0.9, bz1 = (s - 0.5) * 0.34;
      var bx2 = sd * (0.9 + 3.1 * a1), by2 = (p - 0.5) * 3.4, bz2 = (s - 0.5) * 0.34;
      var x1 = lerp(sx2, bx1, m_s), y1 = lerp(sy2, by1, m_s), z1 = lerp(sz2, bz1, m_s);
      var x2 = lerp(x1, bx2, m_m), y2 = lerp(y1, by2, m_m), z2 = lerp(z1, bz2, m_m);
      var cx = sd * 3.8 + (p - 0.5) * 2.0 * (1 - 0.0 * t2), cy = (s ? 1 : -1) * (0.17 + 2.8 * a2), cz = 0;
      e.x = lerp(x2, cx, mII); e.y = lerp(y2, cy, mII); e.z = lerp(z2, cz, mII); e.rz = lerp(0, Math.PI / 2, mII); e.sp = sd; e.sis = s ? 1 : -1;
      if (m_s < 0.05 && u < 0.1) e.rz = r[3] * (1 - m_s);
    }
    return e;
  }
  function arm(g, col, sgn) { var m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.5 })); m.userData.s = sgn; g.add(m); return m; }
  var def = {
    key: 'mitosis-meiosis', title: 'Mitosis y meiosis', subtitle: 'Simulador 3D · biología', accent: { dark: '#f472b6', light: '#be185d' },
    stages: stages, nStages: 6, dur: 14, offset: 0.12,
    views: [{ id: 'libre', label: 'Libre', pos: [0, 3, 19], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 19, 2], target: [0, 0, 0] }],
    layers: [{ id: 'cell', label: 'Membrana y núcleo', icon: '◯' }, { id: 'spindle', label: 'Huso', icon: '⌇' }],
    build: function (ctx) {
      var s = ctx.scene;
      for (var p = 0; p < 2; p++) for (var h = 0; h < 2; h++) for (var sis = 0; sis < 2; sis++) {
        var g = new T.Group(), col = h ? BLUE : RED, a = arm(g, col, 1), b = arm(g, col, -1), cm = new T.Mesh(new T.SphereGeometry(1, 12, 9), new T.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.4 })); g.add(cm); s.add(g);
        ch.push({ g: g, a: a, b: b, cm: cm, p: p, h: h, s: sis, col: col });
      }
      for (var i = 0; i < 4; i++) { var cl = new T.Mesh(new T.SphereGeometry(1, 28, 20), new T.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.1, depthWrite: false })); s.add(cl); cells.push(cl); var nu = new T.Mesh(new T.SphereGeometry(2.4, 24, 16), new T.MeshBasicMaterial({ color: 0xb197fc, transparent: true, opacity: 0.2, depthWrite: false })); s.add(nu); nucs.push(nu); }
      var nu5 = new T.Mesh(new T.SphereGeometry(2.4, 24, 16), new T.MeshBasicMaterial({ color: 0xb197fc, transparent: true, opacity: 0.2, depthWrite: false })); s.add(nu5); nucs.push(nu5);
      for (i = 0; i < 8; i++) { var lg = new T.BufferGeometry().setFromPoints([V(0, 0, 0), V(1, 0, 0)]), ln = new T.Line(lg, new T.LineBasicMaterial({ color: 0xffd8a8, transparent: true, opacity: 0.55 })); ln.frustumCulled = false; s.add(ln); sp.push(ln); }
      for (i = 0; i < 4; i++) { var c2 = new T.Mesh(new T.SphereGeometry(0.28, 12, 9), new T.MeshStandardMaterial({ color: 0x20c997, roughness: 0.4 })); s.add(c2); cen.push(c2); }
      ['t', 'a', 'b', 'c'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, now = ctx.now;
      if (!P.manual) {
        var i = f.i, l = f.local; S.auto = true;
        if (i === 0) { S.mode = 'mit'; S.u = 0.2 * sm(l) * 0.98; } else if (i === 1) { S.mode = 'mit'; S.u = 0.2 + 0.26 * l; } else if (i === 2) { S.mode = 'mit'; S.u = 0.46 + 0.54 * l; }
        else if (i === 3) { S.mode = 'mei'; S.u = 0.5 * l; } else if (i === 4) { S.mode = 'mei'; S.u = 0.5 + 0.5 * l; }
        else { S.mode = 'mei'; var h2 = l < 0.5; S.o0 = h2 ? 0 : 1; S.o1 = h2 ? 1 : 0; S.u = ((l * 2) % 1) * 0.98 + 0.01; }
      } else if (S.run) { S.u += dt / 16; if (S.u >= 1) { S.u = 1; S.run = false; } }
      var u = S.u, mit = S.mode === 'mit', cOn = ctx.layer('cell'), spOn = ctx.layer('spindle');
      // cromátidas
      var pos = {};
      ch.forEach(function (c, k) {
        var e = layout(c, c.p, c.h, c.s); c.e = e; c.g.visible = e.vis; c.g.position.set(e.x, e.y, e.z); c.g.rotation.z = e.rz;
        var L = LEN[c.p] * (1.5 - 0.5 * e.cond) * 0.5, th = 0.08 + 0.1 * e.cond; c.a.scale.set(th, L, th); c.a.position.y = L / 2; c.b.scale.set(th, L, th); c.b.position.y = -L / 2; c.cm.scale.setScalar(0.12 + 0.1 * e.cond);
        var swap = S.mode === 'mei' && S.co && u > 0.16 && c.s !== (c.h ? 0 : 1) ? false : false; // placeholder
        var recomb = S.mode === 'mei' && S.co && u > 0.16 && ((c.h === 0 && c.s === 1) || (c.h === 1 && c.s === 0));
        c.b.material.color.setHex(recomb ? (c.h ? RED : BLUE) : c.col); c.a.material.color.setHex(c.col);
      });
      // células
      var d = 0, r = 5, sx = 1;
      cells.forEach(function (cl) { cl.visible = false; }); nucs.forEach(function (n) { n.visible = false; });
      if (mit) {
        d = 3.7 * sm((u - 0.8) / 0.18); r = lerp(5, 3.6, sm((u - 0.8) / 0.18)); sx = 1 + 0.3 * sm((u - 0.47) / 0.15) * (u < 0.8 ? 1 : 0);
        for (var i2 = 0; i2 < 2; i2++) { var cl = cells[i2]; cl.visible = cOn; cl.position.set((i2 ? 1 : -1) * d, 0, 0); cl.scale.set(r * sx, r, r); }
        nucs[0].visible = cOn; nucs[0].position.set(0, 0, 0); nucs[0].material.opacity = 0.2 * (1 - sm((u - 0.2) / 0.07)) * (u < 0.5 ? 1 : 0);
        var nt = sm((u - 0.66) / 0.1); [1, 2].forEach(function (k) { nucs[k].visible = cOn && nt > 0.02; nucs[k].position.set((k === 1 ? -1 : 1) * 4.2, 0, 0); nucs[k].scale.setScalar(0.95); nucs[k].material.opacity = 0.22 * nt; });
      } else {
        var d1 = 3.8 * sm((u - 0.42) / 0.08), r1 = lerp(5, 3.7, sm((u - 0.42) / 0.08)), sx1 = 1 + 0.25 * sm((u - 0.3) / 0.12) * (u < 0.42 ? 1 : 0), yy = 2.9 * sm((u - 0.78) / 0.18), r2 = lerp(r1, 2.8, sm((u - 0.78) / 0.18));
        cells.forEach(function (cl, k) { cl.visible = cOn && (k < 2 || u > 0.42); var sgx = k % 2 ? 1 : -1, sgy = k < 2 ? 1 : -1; if (k >= 2) { cl.position.set(d1, yy * sgy * (k === 2 ? 1 : -1), 0); } cl.position.set((k < 2 ? -1 : 1) * d1, (k % 2 ? 1 : -1) * yy, 0); cl.scale.set(r2 * (u < 0.42 ? sx1 : 1), r2, r2); if (u < 0.42 && k >= 1) cl.visible = false; if (u >= 0.42 && u < 0.78 && (k === 1 || k === 3)) cl.visible = false; if (u >= 0.78) cl.visible = cOn; });
        nucs[0].visible = cOn; nucs[0].position.set(0, 0, 0); nucs[0].material.opacity = 0.2 * (1 - sm((u - 0.1) / 0.07)) * (u < 0.5 ? 1 : 0);
        var nq = sm((u - 0.84) / 0.12); [[1, -1, 1], [2, -1, -1], [3, 1, 1], [4, 1, -1]].forEach(function (a) { var n = nucs[a[0]]; n.visible = cOn && nq > 0.02; n.position.set(a[1] * 3.8, a[2] * 2.9, 0); n.scale.setScalar(0.5); n.material.opacity = 0.25 * nq; });
        var extra = new T.Vector3(3.8, -2.9, 0);
      }
      // huso
      var lines = sp, nL = 0;
      sp.forEach(function (ln) { ln.visible = false; });
      var showSp = spOn && (mit ? (u > 0.2 && u < 0.62) : ((u > 0.2 && u < 0.42) || (u > 0.5 && u < 0.8)));
      cen.forEach(function (c2) { c2.visible = false; });
      if (showSp) {
        var cenPos = mit ? [V(-5.3, 0, 0), V(5.3, 0, 0)] : (u < 0.5 ? [V(-5.3, 0, 0), V(5.3, 0, 0)] : [V(-3.8, 4.3, 0), V(-3.8, -4.3, 0), V(3.8, 4.3, 0), V(3.8, -4.3, 0)]);
        cenPos.forEach(function (p, k) { cen[k].visible = true; cen[k].position.copy(p); });
        ch.forEach(function (c, k) { if (!c.g.visible) return; var e = c.e, pole; if (mit) pole = V(e.sp * 5.3, 0, 0); else if (u < 0.5) pole = V(e.sp * 5.3, 0, 0); else pole = V(e.sp * 3.8, e.sis * 4.3, 0); var ln = sp[k]; var pts = ln.geometry.attributes.position; pts.setXYZ(0, pole.x, pole.y, pole.z); pts.setXYZ(1, c.g.position.x, c.g.position.y, c.g.position.z); pts.needsUpdate = true; ln.visible = true; });
      }
      var name = phaseName(), ploidy, dna;
      if (mit) { dna = u < 0.05 ? '2C' : (u < 0.8 ? '4C' : '2C por célula hija'); ploidy = u < 0.47 ? '2n = 4 cromosomas' : (u < 0.62 ? '2n → 8 cromátidas-cromosoma' : '2n = 4 por polo'); }
      else { dna = u < 0.05 ? '2C' : (u < 0.45 ? '4C' : (u < 0.8 ? '2C por célula' : '1C por célula')); ploidy = u < 0.3 ? '2n = 4 (bivalentes)' : (u < 0.5 ? 'n = 2 (cromosomas duplicados)' : 'n = 2'); }
      lab.t.pos(0, 6.9, 0).set((mit ? 'Mitosis · ' : 'Meiosis · ') + name, 'bl-lead').vis(true); lab.a.pos(0, -6.2, 0).set(ploidy + ' · ADN: ' + dna, 'bl-pos').vis(true);
      lab.b.pos(0, -7.2, 0).set(!mit && u > 0.14 && u < 0.3 && S.co ? 'quiasmas: intercambio entre cromátidas no hermanas' : (mit ? '' : (u > 0.8 ? '4 células haploides distintas' : '')), 'bl-warn').vis(true); lab.c.vis(false);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.mode) u.mode.set(S.mode); if (!ctx.P.manual && u.u) u.u.set(S.u); },
    hud: function () { var mit = S.mode === 'mit'; return { eq: { chip: mit ? '2n→2n' : '2n→n', name: mit ? 'Mitosis' : 'Meiosis', body: '<div class="eqline"><small>Fase</small>' + phaseName() + '</div><div class="eqline"><small>Células resultantes</small>' + (mit ? '2 (2n)' : '4 (n)') + '</div><div class="eqline"><small>Variabilidad</small>' + (mit ? 'ninguna (clones)' : 'alta') + '</div>' }, legend: [{ label: 'Rojo', color: '#ff6b6b', text: 'cromosoma materno' }, { label: 'Azul', color: '#4dabf7', text: 'cromosoma paterno' }, { label: 'Punto', color: '#ffd43b', text: 'centrómero' }] }; },
    measures: function () { var u = S.u, mit = S.mode === 'mit'; return [['Proceso', mit ? 'Mitosis' : 'Meiosis'], ['Fase', phaseName()], ['Avance', fmt(u * 100, 0) + ' %'], ['Células hijas', mit ? '2 (2n)' : '4 (n)'], ['Entrecruzamiento', mit ? 'no' : (S.co ? 'sí' : 'desactivado')], ['Combinaciones 2ⁿ (n = 2)', '4']]; },
    ideas: ['Mitosis: 1 célula 2n → 2 células 2n idénticas.', 'Meiosis: 1 célula 2n → 4 células n distintas.', 'Meiosis I separa homólogos; meiosis II, cromátidas.', 'Sinapsis y entrecruzamiento: sólo en profase I.', 'Segregación independiente: 2ⁿ gametos.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('División celular'); el.appendChild(c);
      ui.mode = kit.ui.options({ label: 'Proceso', cols: 2, value: S.mode, options: [{ v: 'mit', label: 'Mitosis', sub: '2n → 2n' }, { v: 'mei', label: 'Meiosis', sub: '2n → n' }], onChange: function (v) { ctx.goManual(); S.mode = v; S.u = 0; } }); c.appendChild(ui.mode);
      ui.u = kit.ui.slider({ label: 'Progreso (fase)', min: 0, max: 1, step: 0.005, value: S.u, format: function (v) { var a = S.u; S.u = v; var n = phaseName(); S.u = a; return n; }, onInput: function (v) { ctx.goManual(); S.run = false; S.u = v; } }); c.appendChild(kit.ui.sliders([ui.u]));
      ui.o = kit.ui.options({ label: 'Orientación en metafase I (segregación independiente)', cols: 2, value: String(S.o0), options: [{ v: '0', label: 'Rojo grande ← · azul pequeño →' }, { v: '1', label: 'Azul grande ← · rojo pequeño →' }], onChange: function (v) { ctx.goManual(); S.o0 = +v; S.o1 = 1 - (+v); S.mode = 'mei'; } }); c.appendChild(ui.o);
      ui.co = kit.ui.options({ label: 'Entrecruzamiento', cols: 2, value: S.co ? '1' : '0', options: [{ v: '1', label: 'Con' }, { v: '0', label: 'Sin' }], onChange: function (v) { ctx.goManual(); S.co = v === '1'; } }); c.appendChild(ui.co);
      c.appendChild(ctx.btnRow([{ t: '▶ Animar', primary: true, fn: function () { ctx.goManual(); S.u = 0; S.run = true; } }, { t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Contenido de ADN por célula', h: 220, note: 'C = cantidad de ADN de un genoma haploide. Mitosis: 2C→4C→2C. Meiosis: 2C→4C→2C→1C.', draw: function (cx, w, h, col) {
        var L = 36, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, sx = function (u) { return L + pw * u; }, sy = function (v) { return Tp + ph - ph * v / 4.6; }, i;
        function dnaM(u) { return u < 0.05 ? 2 : (u < 0.1 ? 2 + 2 * (u - 0.05) / 0.05 : (u < 0.8 ? 4 : (u < 0.98 ? 4 - 2 * (u - 0.8) / 0.18 : 2))); }
        function dnaI(u) { return u < 0.05 ? 2 : (u < 0.1 ? 2 + 2 * (u - 0.05) / 0.05 : (u < 0.42 ? 4 : (u < 0.5 ? 4 - 2 * (u - 0.42) / 0.08 : (u < 0.78 ? 2 : (u < 0.98 ? 2 - (u - 0.78) / 0.2 : 1))))); }
        cx.font = '10px system-ui'; cx.strokeStyle = col.line; cx.fillStyle = col.muted; cx.textAlign = 'right'; for (i = 0; i <= 4; i++) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText(i + 'C', L - 5, sy(i) + 3); } cx.textAlign = 'center'; cx.fillText('progreso del proceso', L + pw / 2, h - 4);
        [[dnaM, '#f472b6', 'mitosis'], [dnaI, '#4ade80', 'meiosis']].forEach(function (a, k) { var cur = (S.mode === 'mit') === (k === 0); cx.strokeStyle = a[1]; cx.lineWidth = cur ? 3.2 : 1.6; cx.beginPath(); for (i = 0; i <= 100; i++) { var u = i / 100, y = a[0](u); if (i) cx.lineTo(sx(u), sy(y)); else cx.moveTo(sx(u), sy(y)); } cx.stroke(); cx.fillStyle = a[1]; cx.textAlign = 'left'; cx.fillText('● ' + a[2], L + 6 + k * 70, Tp + 10); }); cx.lineWidth = 1;
        cx.strokeStyle = '#ff6b3d'; cx.setLineDash([3, 3]); cx.beginPath(); cx.moveTo(sx(S.u), Tp); cx.lineTo(sx(S.u), Tp + ph); cx.stroke(); cx.setLineDash([]);
      } },
      { title: 'Combinaciones por segregación independiente', h: 210, note: 'Número de gametos posibles = 2ⁿ (sin contar entrecruzamiento). En humanos n = 23.', draw: function (cx, w, h, col) {
        var L = 44, Rr = 10, Tp = 12, B = 30, pw = w - L - Rr, ph = h - Tp - B, bw = pw / 23, sy = function (e) { return Tp + ph - ph * e / 8; }, i; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillStyle = col.muted; cx.strokeStyle = col.line;
        for (i = 0; i <= 8; i += 2) { cx.beginPath(); cx.moveTo(L, sy(i)); cx.lineTo(L + pw, sy(i)); cx.stroke(); cx.fillText('10^' + i, L - 5, sy(i) + 3); }
        cx.textAlign = 'center'; for (i = 1; i <= 23; i++) { var v = i * Math.log10(2); cx.fillStyle = i === 2 ? '#ff6b3d' : (i === 23 ? '#4ade80' : '#f472b6'); cx.fillRect(L + (i - 1) * bw + 1, sy(v), Math.max(1, bw - 2), Tp + ph - sy(v)); if (i === 2 || i === 23 || i % 5 === 0) { cx.fillStyle = col.muted; cx.fillText(i, L + (i - 1) * bw + bw / 2, h - B + 13); } }
        cx.fillStyle = col.muted; cx.fillText('n pares de cromosomas (n = 2 en el modelo, 23 en humanos)', L + pw / 2, h - 4);
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      return '<div class="card-kicker">Mitosis frente a meiosis</div><div class="calc-step">1 · Comparación</div><table class="calc-table">' + row('Divisiones', 'mitosis 1 · meiosis 2') + row('Células hijas', 'mitosis 2 (2n) · meiosis 4 (n)') + row('Sinapsis y entrecruzamiento', 'sólo meiosis I') + row('Separación en anafase', 'mitosis: cromátidas · meiosis I: homólogos · meiosis II: cromátidas') + row('Variabilidad', 'mitosis: ninguna · meiosis: alta') + '</table>' +
        '<div class="calc-step">2 · Segregación independiente</div><table class="calc-table">' + row('Gametos (n = 2)', '2² = <b>4</b>') + row('Gametos humanos (n = 23)', '2²³ = <b>8 388 608</b>') + row('Cigotos posibles', '(2²³)² ≈ <b>7,0×10¹³</b>') + row('Con entrecruzamiento', 'prácticamente ilimitado') + '</table>';
    },
    quiz: [
      { q: '¿Qué se separa en la anafase I de la meiosis?', options: ['los cromosomas homólogos', 'las cromátidas hermanas', 'los centrosomas', 'los nucléolos'], answer: 0, why: 'Cada homólogo (con sus dos cromátidas) va a un polo.' },
      { q: 'La mitosis produce…', options: ['2 células 2n idénticas', '4 células n', '2 células n', '1 célula 4n'], answer: 0, why: 'Reproducción clonal.' },
      { q: 'El entrecruzamiento ocurre en…', options: ['profase I', 'anafase II', 'metafase de la mitosis', 'G1'], answer: 0, why: 'Durante la sinapsis de los homólogos.' },
      { q: 'La fase S se caracteriza por…', options: ['replicación del ADN', 'condensación de cromosomas', 'citocinesis', 'rotura nuclear'], answer: 0, why: 'El contenido de ADN pasa de 2C a 4C.' },
      { q: 'Tras la meiosis II, el contenido de ADN por célula es…', options: ['1C', '2C', '4C', '0,5C'], answer: 0, why: 'Células haploides con cromosomas de una sola cromátida.' },
      { q: 'La segregación independiente con n = 3 genera…', options: ['8 combinaciones', '6', '9', '3'], answer: 0, why: '2³ = 8.' },
      { q: 'La metafase se define por…', options: ['cromosomas alineados en la placa ecuatorial', 'cromátidas separadas', 'envoltura nuclear formada', 'células divididas'], answer: 0, why: 'Todos los cinetocoros unidos al huso en el ecuador.' },
      { q: 'La meiosis II se parece a…', options: ['una mitosis, sin replicación previa', 'la fase S', 'la meiosis I', 'la citocinesis solamente'], answer: 0, why: 'Se separan cromátidas hermanas.' }
    ],
    help: { intro: 'Cambia entre mitosis y meiosis, mueve el progreso o pulsa Animar. En meiosis puedes cambiar la orientación de los pares en metafase I y activar o no el entrecruzamiento.', items: [['Cromosomas', 'rojo = de origen materno, azul = paterno; el punto marca el centrómero.'], ['Huso y membrana', 'el huso son los microtúbulos que salen de los centrosomas; la capa «Membrana y núcleo» muestra la envoltura que desaparece y se reforma.'], ['Controles', '«Proceso» cambia entre mitosis y meiosis, «Progreso (fase)» recorre las fases y «▶ Animar» las reproduce. En meiosis eliges la «Orientación en metafase I» y si hay «Entrecruzamiento».'], ['Gráficos', '«Contenido de ADN por célula» a lo largo del proceso y «Combinaciones por segregación independiente» (2ⁿ).']], try: ['Recorre la mitosis: las dos células hijas tienen los mismos cromosomas rojos y azules que la célula madre.', 'En meiosis cambia la orientación en metafase I: los gametos reciben otra combinación de cromosomas rojos y azules.', 'Compara la meiosis con y sin entrecruzamiento: con él aparecen cromátidas mixtas rojo-azul.'] }
  };
  MSim.create(def);
})();
