/* Célula animal — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa ../shared/cell-core.js y cell-app.js */
(function () {
  'use strict';
  var T = THREE, K = CellKit, V3 = K.V3;

  /* ---------- Fichas (comunes + propias de la célula animal) ---------- */
  var INFO = {};
  Object.keys(K.INFO).forEach(function (k) { INFO[k] = Object.assign({}, K.INFO[k]); });
  INFO.microvellosidades = { n: 'Microvellosidades', g: 'lim', col: '#7fc4ff', s: '0,5–1 µm de alto', m: 'Prolongaciones de la membrana', e: 'Dedos de membrana plasmática sostenidos por haces de filamentos de actina.',
    f: 'Aumentan mucho la superficie de contacto con el medio: son clave en la absorción de nutrientes (epitelio del intestino delgado).', c: 'En el intestino delgado las microvellosidades multiplican por ~20 la superficie de absorción.' };
  INFO.membrana.p = 'Contiene colesterol, que regula su fluidez, y un glicocálix de glúcidos en la cara externa que sirve para el reconocimiento entre células.';
  INFO.nucleo.p = 'Ocupa la parte central de la célula y está rodeado por el retículo endoplasmático rugoso.';
  INFO.centrosoma.p = 'Se ubica junto al núcleo y desde él nacen los microtúbulos del citoesqueleto.';
  INFO.lisosoma.p = 'Son características de las células animales: en las vegetales la función digestiva la cumple sobre todo la vacuola.';

  var IDS = ['membrana', 'microvellosidades', 'citosol', 'nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma', 'golgi', 'vesicula', 'mito', 'lisosoma', 'peroxisoma', 'centrosoma', 'mtub', 'actina', 'intermedios'];

  /* ---------- Recorrido guiado ---------- */
  var STAGES = [
    { name: 'Límite', short: 'Membrana', title: 'La membrana plasmática y el medio interno',
      text: '<p>Una <b>bicapa de fosfolípidos</b> con proteínas separa la célula de su entorno. Es <b>selectiva</b>: deja pasar unas sustancias y frena otras.</p><p>Los puntos amarillos son las cabezas de los fosfolípidos; las proteínas azules son canales y transportadores. Abajo, las <b>microvellosidades</b> aumentan la superficie. Dentro está el <b>citosol</b>, el gel donde ocurre el metabolismo.</p>',
      focus: ['membrana', 'microvellosidades', 'citosol'], cam: [0.15, 0.1, 1, 21] },
    { name: 'Información', short: 'Núcleo', title: 'El núcleo guarda y lee el ADN',
      text: '<p>La <b>envoltura nuclear</b> (doble membrana) tiene <b>poros</b> por donde salen los ARN y entran proteínas. Dentro, la <b>cromatina</b> (ADN + histonas) contiene los genes y el <b>nucléolo</b> fabrica las subunidades de los ribosomas.</p>',
      focus: ['nucleo', 'poro', 'nucleolo', 'cromatina'], fly: 'nucleo', dist: 8 },
    { name: 'Síntesis', short: 'Retículo', title: 'Retículos y ribosomas: fábrica de proteínas y lípidos',
      text: '<p>Los <b>ribosomas</b> traducen el ARNm a proteínas. Los que están pegados al <b>retículo rugoso</b> fabrican proteínas que se secretan o van a membranas; los libres, las del citosol.</p><p>El <b>retículo liso</b> sintetiza lípidos y detoxifica.</p>',
      focus: ['rer', 'rel', 'ribosoma'], fly: 'rer', dist: 9.5 },
    { name: 'Secreción', short: 'Golgi', title: 'Golgi y vesículas: empaquetar y enviar',
      text: '<p>Las proteínas del retículo viajan en <b>vesículas</b> hasta la cara <i>cis</i> del <b>aparato de Golgi</b>, donde se modifican y clasifican. Salen por la cara <i>trans</i> y se dirigen a la membrana (<b>exocitosis</b>), a los lisosomas o a otros destinos.</p><p>Observa la vesícula brillante recorriendo la vía secretora.</p>',
      focus: ['golgi', 'vesicula', 'rer', 'membrana'], fly: 'golgi', dist: 10 },
    { name: 'Energía', short: 'Mitocondrias', title: 'Mitocondrias: la central de energía',
      text: '<p>En la <b>matriz</b> y las <b>crestas</b> de la mitocondria se oxidan los nutrientes y se produce <b>ATP</b> (respiración celular). Tienen <b>doble membrana</b>, ADN propio y ribosomas propios: indicios de su origen endosimbiótico.</p>',
      focus: ['mito'], cam: [0.3, 0.2, 1, 18] },
    { name: 'Digestión', short: 'Lisosomas', title: 'Lisosomas y peroxisomas: reciclaje y detoxificación',
      text: '<p>Los <b>lisosomas</b> contienen enzimas hidrolíticas que digieren moléculas, bacterias y orgánulos viejos. Los <b>peroxisomas</b> oxidan ácidos grasos y descomponen el peróxido de hidrógeno (H₂O₂) con la catalasa.</p>',
      focus: ['lisosoma', 'peroxisoma'], cam: [-0.3, 0.25, 1, 18] },
    { name: 'Soporte', short: 'Citoesqueleto', title: 'Citoesqueleto y centrosoma',
      text: '<p>Tres redes de fibras dan forma, resistencia y movimiento: <b>microtúbulos</b> (azul, nacen del centrosoma), <b>filamentos de actina</b> (rosado, bajo la membrana) y <b>filamentos intermedios</b> (verde, anclan el núcleo).</p><p>El <b>centrosoma</b> con sus dos <b>centriolos</b> organiza el huso mitótico.</p>',
      focus: ['mtub', 'actina', 'intermedios', 'centrosoma'], fly: 'centrosoma', dist: 11 },
    { name: 'Conjunto', short: 'Todo', title: 'Una célula, muchos sistemas',
      text: '<p>Todos los componentes trabajan coordinados: el núcleo envía instrucciones, los ribosomas y retículos fabrican, el Golgi empaqueta, las mitocondrias aportan energía y el citoesqueleto sostiene y transporta.</p><p>Cambia a <b>Funciones</b> arriba para colorear por sistema, o haz clic en cualquier componente.</p>',
      focus: null, cam: [0.45, 0.3, 1, 22] }
  ];

  var QUIZ = [
    { q: '¿Qué orgánulo produce la mayor parte del ATP de la célula animal?', options: ['Aparato de Golgi', 'Mitocondria', 'Lisosoma', 'Retículo liso'], answer: 1, why: 'La respiración celular ocurre en las mitocondrias (ciclo de Krebs y cadena respiratoria en las crestas).' },
    { q: 'El retículo endoplasmático rugoso se llama así porque…', options: ['tiene ribosomas adheridos', 'tiene núcleo', 'no tiene membrana', 'sus túbulos son irregulares'], answer: 0, why: 'Los ribosomas unidos a su cara citosólica le dan el aspecto «rugoso» al microscopio.' },
    { q: '¿Qué estructura regula el paso de sustancias entre núcleo y citoplasma?', options: ['Nucléolo', 'Cromatina', 'Poros nucleares', 'Centriolos'], answer: 2, why: 'Los complejos del poro nuclear controlan qué moléculas entran y salen.' },
    { q: 'Los lisosomas contienen…', options: ['clorofila', 'enzimas hidrolíticas', 'ADN circular', 'celulosa'], answer: 1, why: 'Son enzimas que digieren moléculas y orgánulos en un medio ácido.' },
    { q: 'El nucléolo se encarga principalmente de…', options: ['replicar el ADN', 'fabricar ARN ribosomal y subunidades de ribosomas', 'producir lípidos', 'almacenar calcio'], answer: 1, why: 'Allí se transcribe el ARNr y se ensamblan las subunidades ribosomales.' },
    { q: 'Los centriolos participan en…', options: ['la fotosíntesis', 'la formación del huso mitótico', 'la síntesis de lípidos', 'la digestión celular'], answer: 1, why: 'Organizan los microtúbulos del huso que reparte los cromosomas.' },
    { q: 'La vía de una proteína de secreción es:', options: ['Golgi → RE rugoso → membrana', 'RE rugoso → Golgi → vesícula → membrana', 'Núcleo → mitocondria → membrana', 'Lisosoma → núcleo → Golgi'], answer: 1, why: 'Se sintetiza en el RER, se modifica en el Golgi y sale por exocitosis en vesículas.' },
    { q: '¿Cuál de estos NO tiene membrana?', options: ['Ribosoma', 'Mitocondria', 'Lisosoma', 'Peroxisoma'], answer: 0, why: 'Los ribosomas son complejos de ARN y proteínas sin membrana.' },
    { q: 'Los fosfolípidos de la membrana se disponen con…', options: ['las colas hidrófobas hacia el interior de la bicapa', 'las cabezas hacia el interior', 'todas las colas hacia el citosol', 'sin orden'], answer: 0, why: 'Las colas hidrófobas se esconden del agua entre las cabezas hidrófilas.' }
  ];

  var COMPARE = {
    title: 'Célula animal frente a célula vegetal', intro: 'Ambas son eucariontes y comparten núcleo, retículos, Golgi, mitocondrias y citoesqueleto. Las diferencias principales:',
    head: ['Característica', 'Animal (este modelo)', 'Vegetal'],
    rows: [['Pared celular', 'No tiene', 'Sí, de celulosa'], ['Cloroplastos', 'No', 'Sí (fotosíntesis)'], ['Vacuola', 'Pequeñas y temporales', 'Una vacuola central grande'], ['Forma', 'Variable, redondeada', 'Fija, poliédrica'],
      ['Centriolos', 'Sí', 'No (en plantas con flores)'], ['Lisosomas', 'Sí, abundantes', 'Escasos (digiere la vacuola)'], ['Reserva', 'Glucógeno', 'Almidón'], ['Comunicación', 'Uniones comunicantes', 'Plasmodesmos'],
      ['División', 'Anillo contráctil (estrangulamiento)', 'Placa celular'], ['Nutrición', 'Heterótrofa', 'Autótrofa']],
    notes: ['Ambas tienen <b>mitocondrias</b>: las plantas también respiran.', 'Los lisosomas y los centriolos son típicos de la célula animal.', 'Para ver la versión vegetal abre <i>Célula vegetal</i> desde el portal.']
  };

  /* ---------- Escena ---------- */
  var shape = new K.Shape(6.2, 4.7, 4.9, 2.4);
  var NP = V3(-0.7, 0.3, -0.2), NR = 1.75, GP = V3(2.9, -0.15, 0.7);
  var wobble = [], tv, path;

  function build(view) {
    var rng = K.rng(11), place = new K.Placer(rng);
    function add(id, grp, extra) { var I = INFO[id]; return view.add(id, grp, Object.assign({ label: I.n.replace(' (envoltura nuclear)', ''), col: I.col, grp: I.g }, extra || {})); }
    place.add(NP, NR + 1.1); place.add(GP, 1.6); place.add(V3(-0.8, 2.95, 0.4), 0.8);

    add('membrana', K.membrane(shape, rng, 1500), { pr: 2, cuttable: true });
    var mv = K.microvilli(shape, V3(0.05, -1, 0.1), 26, rng, 0.55); add('microvellosidades', mv, { pr: 0 });
    var cy = new T.Group(); var cm = new T.Mesh(shape.geometry(0.965, 56, 36), K.M('#9fd3ff', { o: 0.07, side: T.DoubleSide, r: 0.2 })); cm.renderOrder = 1; cy.add(cm);
    add('citosol', cy, { pr: 2, cuttable: true, anchor: V3(-4.4, -3.3, 1.5) });

    /* núcleo y sus partes */
    var ng = K.nucleus(NR); ng.position.copy(NP); add('nucleo', ng, { pr: 1 });
    var pg = K.nuclearPores(NR, 40); pg.position.copy(NP); add('poro', pg, { pr: 0, anchor: NP.clone().add(V3(NR * 0.95, NR * 0.35, NR * 0.35)) });
    var nl = K.nucleolus(NR); nl.position.copy(NP); add('nucleolo', nl, { pr: 0 });
    var ch = K.chromatin(NR, rng); ch.position.copy(NP); add('cromatina', ch, { pr: 0, anchor: NP.clone().add(V3(-NR * 0.4, NR * 0.55, 0)) });

    /* retículo rugoso + ribosomas */
    var er = K.rer(NR, rng, { n: 4, phi0: -1.0, phiLen: 3.6, th0: 0.95, thLen: 1.3 });
    er.group.position.copy(NP); add('rer', er.group, { pr: 0, anchor: NP.clone().add(V3(2.55, -0.7, 0.9)) });
    var rp = er.ribos.map(function (p) { return p.clone().add(NP); }), k, p;
    for (k = 0; k < 150; k++) {
      p = V3((rng() * 2 - 1) * shape.a, (rng() * 2 - 1) * shape.b, (rng() * 2 - 1) * shape.c);
      if (!shape.inside(p, 0.9) || p.distanceTo(NP) < NR + 0.2 || p.distanceTo(GP) < 1.4) continue; rp.push(p);
    }
    add('ribosoma', K.ribosomes(rp, 0.075), { pr: 0, anchor: V3(-3.7, 1.7, 1.2) });
    var rl = K.rel(rng, 1.7, 0.85); rl.position.set(-0.2, -2.8, 0.5); add('rel', rl, { pr: 0 });

    /* Golgi y vesículas */
    var go = K.golgi(1.15, 6); go.position.copy(GP); go.rotation.set(0.3, 0.4, Math.PI / 2); add('golgi', go, { pr: 0 });
    var vs = new T.Group(), vm;
    [[1.7, 0.55, 0.9, .17], [1.5, -0.7, 1.3, .14], [1.9, 0.1, 0.1, .15], [4.6, 0.8, 1.1, .16], [4.2, -0.9, 1.4, .2], [3.8, 1.5, 0.2, .13], [2.9, 1.5, 1.2, .15], [3.0, -1.7, 0.6, .17], [5.4, 0.1, 0.9, .22], [-2.7, -1.5, 1.7, .15]].forEach(function (v) {
      var m = K.vesicle(v[3]); m.position.set(v[0], v[1], v[2]); vs.add(m);
    });
    tv = K.vesicle(0.2, '#ffb340'); vs.add(tv);
    add('vesicula', vs, { pr: 0, anchor: V3(4.6, 1.2, 1.1) });
    path = [V3(1.9, 0.2, 0.8), V3(2.2, -0.05, 0.75), V3(3.7, -0.15, 0.75), V3(4.8, 0.1, 0.9), shape.surface(V3(1, 0.02, 0.15), 0.99)];

    /* mitocondrias, lisosomas, peroxisomas */
    var mi = new T.Group(), i, s, q, pos;
    for (i = 0; i < 7; i++) {
      s = 0.52 + rng() * 0.2; pos = place.find(shape, s * 1.05); if (!pos) continue;
      q = K.mitochondrion(s); q.position.copy(pos); q.rotation.set(rng() * 3, rng() * 3, rng() * 3); mi.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.07 + rng() * 0.05 });
    }
    add('mito', mi, { pr: 0 });
    var ly = new T.Group(); for (i = 0; i < 6; i++) { s = 0.26 + rng() * 0.12; pos = place.find(shape, s); if (!pos) continue; q = K.lysosome(s, rng); q.position.copy(pos); ly.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.05 }); }
    add('lisosoma', ly, { pr: 0 });
    var pe = new T.Group(); for (i = 0; i < 4; i++) { s = 0.22 + rng() * 0.08; pos = place.find(shape, s); if (!pos) continue; q = K.peroxisome(s); q.position.copy(pos); pe.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.05 }); }
    add('peroxisoma', pe, { pr: 0 });

    /* centrosoma y citoesqueleto */
    var C = V3(-0.8, 2.95, 0.4), cs = K.centrosome(); cs.position.copy(C); cs.rotation.set(0.4, 0.6, 0.3); add('centrosoma', cs, { pr: 0 });
    var mt = new T.Group(), mtm = K.M('#53c7ff', { r: 0.4, e: '#2a8fd0', ei: 0.25 });
    for (i = 0; i < 15; i++) {
      var d = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize(), end = shape.surface(d, 0.95), mid = C.clone().lerp(end, 0.5).add(V3((rng() - .5) * 1.0, (rng() - .5) * 1.0, (rng() - .5) * 1.0));
      if (end.distanceTo(C) < 3) continue; mt.add(K.tube([C.clone(), C.clone().lerp(mid, 0.5), mid, mid.clone().lerp(end, 0.5), end], 0.032, mtm));
    }
    add('mtub', mt, { pr: 0, anchor: V3(-3.0, 3.1, 1.2) });
    var ac = new T.Group(), am = K.M('#ff8ad0', { r: 0.5 });
    for (i = 0; i < 55; i++) {
      var d0 = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize(), pts = [], j;
      for (j = 0; j < 5; j++) { var dd = d0.clone().add(V3((rng() - .5) * .22 * j, (rng() - .5) * .22 * j, (rng() - .5) * .22 * j)); pts.push(shape.surface(dd, 0.93 - (rng() * 0.03))); }
      ac.add(K.tube(pts, 0.022, am));
    }
    add('actina', ac, { pr: 0, anchor: V3(5.3, 2.6, 1.0) });
    var inn = new T.Group(), im = K.M('#9fc86a', { r: 0.6 });
    for (i = 0; i < 9; i++) {
      var dn = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize(), a0 = NP.clone().add(dn.clone().multiplyScalar(NR * 1.04)), a1 = shape.surface(dn, 0.95), md = a0.clone().lerp(a1, 0.5).add(V3((rng() - .5) * .8, (rng() - .5) * .8, (rng() - .5) * .8));
      inn.add(K.tube([a0, a0.clone().lerp(md, .5), md, md.clone().lerp(a1, .5), a1], 0.034, im));
    }
    add('intermedios', inn, { pr: 0, anchor: V3(-4.9, -0.6, 0.3) });
  }

  function animate(view, f) {
    var t = view.time;
    wobble.forEach(function (w) { w.o.position.set(w.b.x + Math.sin(t * 0.5 + w.ph) * w.a, w.b.y + Math.cos(t * 0.4 + w.ph * 1.3) * w.a, w.b.z + Math.sin(t * 0.45 + w.ph * .7) * w.a); w.o.rotation.y += f.dt * 0.1; });
    if (tv && path) {
      var u = ((t * (f.i === 3 ? 0.16 : 0.07)) % 1) * (path.length - 1), k = Math.min(path.length - 2, Math.floor(u)), r = u - k;
      tv.position.copy(path[k]).lerp(path[k + 1], r);
      var sc = k === path.length - 2 ? 1 - Math.pow(r, 3) * 0.8 : 1; tv.scale.setScalar(0.2 * sc * (1 + 0.15 * Math.sin(t * 8)));
    }
  }

  CellApp.run({
    key: 'celula-animal', title: 'Célula animal', subtitle: 'Simulador 3D · biología celular', accent: { dark: '#ff8a5c', light: '#c2410c' }, viewLabel: 'Modelo 3D de la célula animal',
    info: INFO, ids: IDS, stages: STAGES, quiz: QUIZ, compare: COMPARE, build: build, animate: animate, home: [0.5, 0.32, 1, 22], cutZ: 0.7,
    ideas: [
      'La célula animal es <b>eucarionte</b>: tiene núcleo con envoltura y orgánulos delimitados por membranas.',
      'Estructura y función van de la mano: las <b>crestas</b> aumentan la superficie de la mitocondria; las <b>microvellosidades</b>, la de la membrana.',
      'Las proteínas de secreción siguen una vía: <b>ribosoma → retículo rugoso → Golgi → vesícula → membrana</b>.',
      'No todo tiene membrana: ribosomas, centrosoma, nucléolo y citoesqueleto son estructuras sin membrana.'
    ],
    help: {
      intro: 'Sigue la lección con el reproductor inferior o explora libremente: gira arrastrando, acerca con la rueda y haz clic en cualquier componente para ver su ficha.',
      items: [['Clic en el modelo', 'selecciona un componente, lo resalta, atenúa el resto y abre su ficha; vuelve a pulsarlo para quitar la selección.'], ['Capas', 'muestra u oculta los sistemas (límite, información, síntesis, energía, digestión, soporte), las etiquetas y el corte.'],
        ['Corte', 'quita la mitad frontal de la membrana para ver el interior.'], ['Coloreado', '«Funciones» pinta cada componente según el sistema al que pertenece.'], ['Componentes', 'lista completa con acceso directo a cada ficha.'], ['Desafío', 'juego «Identifica en 3D» y preguntas rápidas.']]
    }
  });
})();
