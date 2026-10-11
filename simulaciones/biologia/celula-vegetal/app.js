/* Célula vegetal — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa ../shared/cell-core.js y cell-app.js */
(function () {
  'use strict';
  var T = THREE, K = CellKit, V3 = K.V3;

  /* ---------- Fichas ---------- */
  var INFO = {};
  Object.keys(K.INFO).forEach(function (k) { INFO[k] = Object.assign({}, K.INFO[k]); });
  delete INFO.centrosoma; delete INFO.lisosoma; delete INFO.intermedios;
  INFO.pared = { n: 'Pared celular', g: 'lim', col: '#a8c26a', s: '0,1–10 µm de espesor', m: 'Matriz extracelular (sin membrana)',
    e: 'Microfibrillas de celulosa embebidas en hemicelulosa, pectinas y proteínas. La pared primaria es flexible; en algunas células se añade una pared secundaria con lignina.',
    f: 'Da forma y rigidez, resiste la presión de turgencia (evita que la célula estalle al absorber agua), protege de patógenos y orienta el crecimiento. Es permeable a agua e iones.',
    c: 'La madera es, sobre todo, pared celular secundaria lignificada de células muertas.', p: 'Rodea a la membrana plasmática; las microfibrillas se ven como el entramado cruzado.' };
  INFO.lamina = { n: 'Lámina media', g: 'lim', col: '#e6cf7e', s: '~0,1 µm', m: 'Capa de pectinas (sin membrana)',
    e: 'Capa rica en pectinas compartida por dos células vecinas, anterior a las paredes primarias.', f: 'Cementa las células contiguas y mantiene unido al tejido.', c: 'Las pectinas de esta capa son las que hacen gelificar las mermeladas.' };
  INFO.plasmodesmo = { n: 'Plasmodesmos', g: 'lim', col: '#d94f8a', s: '~40 nm de diámetro', m: 'Canales revestidos de membrana',
    e: 'Poros que atraviesan la pared y conectan los citoplasmas de células vecinas; por su centro pasa el desmotúbulo, una extensión del retículo endoplasmático.',
    f: 'Permiten el paso de agua, iones, azúcares, ARN y proteínas entre células: forman el «simplasto». Cumplen un papel parecido al de las uniones comunicantes animales.', c: 'Muchos virus vegetales se propagan usando estos canales.' };
  INFO.vacuola = { n: 'Vacuola central', g: 'dig', col: '#7fd0ff', s: '30–90 % del volumen celular', m: 'Membrana simple (tonoplasto)',
    e: 'Gran compartimiento rodeado por el tonoplasto, lleno de savia vacuolar: agua, iones, azúcares, ácidos orgánicos, pigmentos (antocianos) y enzimas hidrolíticas.',
    f: 'Mantiene la turgencia (presión interna), almacena nutrientes y desechos, contiene pigmentos y degrada componentes (equivale en parte a los lisosomas).', c: 'Una planta se marchita cuando sus vacuolas pierden agua y las células pierden turgencia.', p: 'Empuja al núcleo y a los demás orgánulos hacia la periferia, dejando solo una delgada capa de citoplasma.' };
  INFO.cloroplasto = { n: 'Cloroplastos', g: 'ene', col: '#79d26a', s: '3–10 µm de largo', m: 'Doble membrana',
    e: 'Dos membranas rodean al estroma, donde flotan sacos aplanados llamados tilacoides, apilados en grana. Contienen clorofila, ADN circular y ribosomas propios.',
    f: 'Realizan la fotosíntesis: en los tilacoides la fase luminosa capta energía y produce ATP, NADPH y O₂; en el estroma el ciclo de Calvin fija el CO₂ y fabrica azúcares.', c: 'Su origen sería una cianobacteria endosimbionte; por eso tienen ADN y ribosomas propios.', p: 'La luz (flechas amarillas en la lección) llega a los cloroplastos, que se ubican cerca de la pared.' };
  INFO.amiloplasto = { n: 'Amiloplastos', g: 'dig', col: '#e8ecd6', s: '3–10 µm', m: 'Doble membrana',
    e: 'Plastos incoloros (leucoplastos) con gránulos de almidón en su interior.', f: 'Almacenan almidón, la reserva energética vegetal; abundan en tubérculos, raíces y semillas.', c: 'La papa es rica en almidón porque sus células están llenas de amiloplastos.' };
  INFO.mito.p = 'Las plantas también respiran: de noche y en órganos sin luz las mitocondrias producen el ATP; de día cooperan con los cloroplastos.';
  INFO.nucleo.p = 'Suele quedar desplazado a la periferia por la gran vacuola.';
  INFO.golgi.p = 'En las plantas hay muchos dictiosomas pequeños dispersos; sintetizan polisacáridos de la pared (hemicelulosa y pectina) y los envían en vesículas.';
  INFO.peroxisoma.p = 'Participan en la fotorrespiración junto con cloroplastos y mitocondrias.';
  INFO.membrana.p = 'Está pegada a la pared celular, que contiene la presión osmótica.';
  INFO.mtub.p = 'Forman anillos corticales bajo la membrana que guían el depósito de las microfibrillas de celulosa.';
  INFO.actina.p = 'Generan la corriente citoplasmática (ciclosis), que arrastra orgánulos como los cloroplastos.';
  INFO.vesicula.p = 'Transportan material de la pared hacia el exterior y forman la placa celular cuando la célula se divide.';
  INFO.citosol.p = 'Forma solo una capa delgada entre la membrana y la vacuola.';

  var IDS = ['pared', 'lamina', 'membrana', 'plasmodesmo', 'citosol', 'vacuola', 'nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma', 'golgi', 'vesicula', 'cloroplasto', 'amiloplasto', 'mito', 'peroxisoma', 'mtub', 'actina'];

  var STAGES = [
    { name: 'Pared', short: 'Pared', title: 'Pared celular, membrana y plasmodesmos',
      text: '<p>La <b>pared celular</b> de celulosa (el entramado cruzado) rodea a la membrana plasmática y le da rigidez. Entre células vecinas hay una <b>lámina media</b> de pectinas. Los <b>plasmodesmos</b> atraviesan la pared y comunican los citoplasmas.</p>',
      focus: ['pared', 'lamina', 'membrana', 'plasmodesmo'], cam: [0.2, 0.15, 1, 25] },
    { name: 'Vacuola', short: 'Vacuola', title: 'La vacuola central y la turgencia',
      text: '<p>La <b>vacuola central</b> ocupa gran parte de la célula. Llena de agua y solutos, empuja el citoplasma contra la pared y genera la <b>presión de turgencia</b> que mantiene firme al tejido. También almacena sustancias y degrada desechos.</p>',
      focus: ['vacuola', 'citosol'], cam: [0.4, 0.35, 1, 21] },
    { name: 'Fotosíntesis', short: 'Cloroplastos', title: 'Cloroplastos: luz que se vuelve azúcar',
      text: '<p>Los <b>cloroplastos</b> captan la luz con clorofila. En los <b>tilacoides</b> (apilados en grana) se produce ATP, NADPH y O₂; en el <b>estroma</b> el ciclo de Calvin convierte CO₂ en azúcares. Los <b>amiloplastos</b> guardan el almidón.</p><p>Las flechas amarillas representan la luz incidente.</p>',
      focus: ['cloroplasto', 'amiloplasto'], cam: [0.15, 0.9, 1, 22] },
    { name: 'Núcleo', short: 'Núcleo', title: 'Núcleo, retículo y ribosomas',
      text: '<p>El <b>núcleo</b> guarda el ADN (cromatina), con su nucléolo y sus poros. El <b>retículo rugoso</b> y los <b>ribosomas</b> fabrican proteínas; el <b>retículo liso</b> sintetiza lípidos. Observa que la vacuola desplazó al núcleo hacia la pared.</p>',
      focus: ['nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma'], fly: 'nucleo', dist: 7.5 },
    { name: 'Secreción', short: 'Golgi', title: 'Dictiosomas y vesículas: construir la pared',
      text: '<p>Los <b>dictiosomas</b> (Golgi vegetal) sintetizan los polisacáridos de la pared (hemicelulosa, pectina) y los empaquetan en <b>vesículas</b> que se fusionan con la membrana (exocitosis) y la pared crece. En la división forman la <b>placa celular</b>.</p>',
      focus: ['golgi', 'vesicula', 'pared'], cam: [0.3, 0.6, 1, 22] },
    { name: 'Energía', short: 'Mitocondrias', title: 'Mitocondrias y peroxisomas',
      text: '<p>Las <b>mitocondrias</b> producen ATP por respiración celular, de día y de noche. Los <b>peroxisomas</b> colaboran con cloroplastos y mitocondrias en la <b>fotorrespiración</b> y degradan el H₂O₂ con catalasa.</p>',
      focus: ['mito', 'peroxisoma', 'cloroplasto'], cam: [-0.3, 0.3, 1, 22] },
    { name: 'Soporte', short: 'Citoesqueleto', title: 'Citoesqueleto y comunicación',
      text: '<p>Los <b>microtúbulos corticales</b> forman aros bajo la membrana y orientan el depósito de celulosa. La <b>actina</b> impulsa la <b>corriente citoplasmática</b>. Las plantas <b>no tienen centriolos ni filamentos intermedios típicos</b>.</p>',
      focus: ['mtub', 'actina', 'plasmodesmo'], cam: [0.25, 0.25, 1, 23] },
    { name: 'Conjunto', short: 'Todo', title: 'Una célula autótrofa y rígida',
      text: '<p>La pared, la vacuola y los cloroplastos distinguen a la célula vegetal. Cambia a <b>Funciones</b> para colorear por sistema, apaga el <b>Corte</b> para ver la célula cerrada o haz clic en cualquier componente.</p>',
      focus: null, cam: [0.5, 0.4, 1, 26] }
  ];

  var QUIZ = [
    { q: '¿Qué estructura da rigidez a la célula vegetal y está hecha de celulosa?', options: ['Membrana plasmática', 'Pared celular', 'Tonoplasto', 'Envoltura nuclear'], answer: 1, why: 'La pared celular de celulosa rodea a la membrana y sostiene a la célula.' },
    { q: 'La función principal de la vacuola central es…', options: ['producir ATP', 'mantener la turgencia y almacenar sustancias', 'sintetizar ARN', 'realizar la fotosíntesis'], answer: 1, why: 'Al llenarse de agua presiona el citoplasma contra la pared (turgencia) y almacena nutrientes y desechos.' },
    { q: '¿En qué parte del cloroplasto ocurre la fase luminosa?', options: ['Estroma', 'Tilacoides', 'Membrana externa', 'Citosol'], answer: 1, why: 'La clorofila de las membranas tilacoidales capta la luz; el ciclo de Calvin ocurre en el estroma.' },
    { q: 'Los plasmodesmos son…', options: ['poros nucleares', 'canales que comunican células vecinas a través de la pared', 'vesículas de secreción', 'fibras de celulosa'], answer: 1, why: 'Conectan los citoplasmas de células adyacentes (simplasto).' },
    { q: 'Un orgánulo presente en la célula vegetal y ausente en la animal es…', options: ['Mitocondria', 'Ribosoma', 'Cloroplasto', 'Aparato de Golgi'], answer: 2, why: 'Los cloroplastos (y la pared y la gran vacuola) caracterizan a la célula vegetal.' },
    { q: 'Los amiloplastos almacenan…', options: ['clorofila', 'almidón', 'proteínas de secreción', 'ADN'], answer: 1, why: 'Son plastos de reserva de almidón.' },
    { q: 'La célula vegetal NO tiene típicamente…', options: ['mitocondrias', 'núcleo', 'centriolos', 'retículo endoplasmático'], answer: 2, why: 'Las plantas con flores organizan el huso sin centriolos.' },
    { q: 'La corriente citoplasmática (ciclosis) depende sobre todo de…', options: ['microfibrillas de celulosa', 'filamentos de actina', 'ribosomas', 'la lámina media'], answer: 1, why: 'La actina y la miosina arrastran los orgánulos por el citoplasma.' },
    { q: 'Al poner una célula vegetal en agua destilada, no estalla porque…', options: ['no tiene membrana', 'la pared contiene la presión de turgencia', 'la vacuola desaparece', 'los cloroplastos absorben agua'], answer: 1, why: 'La pared rígida resiste la presión generada por la entrada de agua.' }
  ];

  var COMPARE = {
    title: 'Célula vegetal frente a célula animal', intro: 'Ambas son eucariontes con núcleo, retículos, Golgi, mitocondrias y citoesqueleto. Lo propio de la vegetal:',
    head: ['Característica', 'Vegetal (este modelo)', 'Animal'],
    rows: [['Pared celular', 'Sí, de celulosa', 'No tiene'], ['Cloroplastos', 'Sí (fotosíntesis)', 'No'], ['Vacuola', 'Una vacuola central grande', 'Pequeñas y temporales'], ['Forma', 'Fija, poliédrica', 'Variable, redondeada'],
      ['Centriolos', 'No (en plantas con flores)', 'Sí'], ['Lisosomas', 'Escasos (digiere la vacuola)', 'Sí, abundantes'], ['Reserva', 'Almidón', 'Glucógeno'], ['Comunicación', 'Plasmodesmos', 'Uniones comunicantes'],
      ['División', 'Placa celular', 'Anillo contráctil'], ['Filamentos intermedios', 'Ausentes (típicos)', 'Presentes'], ['Nutrición', 'Autótrofa', 'Heterótrofa']],
    notes: ['Las plantas tienen <b>mitocondrias</b> además de cloroplastos: respiran y hacen fotosíntesis.', 'La vacuola central cumple funciones que en la célula animal reparten los lisosomas.', 'Compara con <i>Célula animal</i> desde el portal.']
  };

  /* ---------- Escena ---------- */
  var shape = new K.Shape(7.0, 4.6, 4.4, 7), inner = shape.scaled(0.955), vs = new K.Shape(7.0 * 0.7, 4.6 * 0.64, 4.4 * 0.64, 4);
  var NP = V3(-5.7, 0.9, 0.4), NR = 0.95;
  var wobble = [], chl = [], rays, drift = [];

  function build(view) {
    var rng = K.rng(23), place = new K.Placer(rng), i, s, pos, q;
    function add(id, grp, extra) { var I = INFO[id]; return view.add(id, grp, Object.assign({ label: I.n.replace(' (envoltura nuclear)', ''), col: I.col, grp: I.g }, extra || {})); }
    place.add(NP, NR + 1.0);

    add('pared', K.wall(shape), { pr: 2, cuttable: true, anchor: V3(-7.0, 3.1, 1.8) });
    add('lamina', K.middleLamella(shape), { pr: 2, cuttable: true, anchor: V3(7.1, 2.4, 1.2) });
    add('membrana', K.membrane(inner, rng, 1700), { pr: 2, cuttable: true, anchor: V3(0, -4.3, 1.6) });
    add('plasmodesmo', K.plasmodesmata(shape, rng, 10), { pr: 0 });
    var cy = new T.Group(), cm = new T.Mesh(inner.geometry(0.97, 56, 36), K.M('#a8e0a0', { o: 0.07, side: T.DoubleSide, r: 0.2 })); cm.renderOrder = 1; cy.add(cm);
    add('citosol', cy, { pr: 2, cuttable: true, anchor: V3(5.3, -1.0, 2.6) });
    add('vacuola', K.vacuole(vs), { pr: 1, cuttable: true, anchor: V3(0, 3.0, 0) });

    var ng = K.nucleus(NR); ng.position.copy(NP); add('nucleo', ng, { pr: 1 });
    var pg = K.nuclearPores(NR, 30); pg.position.copy(NP); add('poro', pg, { pr: 0, anchor: NP.clone().add(V3(NR * 0.2, NR * 1.0, NR * 0.6)) });
    var nl = K.nucleolus(NR); nl.position.copy(NP); add('nucleolo', nl, { pr: 0 });
    var ch = K.chromatin(NR, rng); ch.position.copy(NP); add('cromatina', ch, { pr: 0, anchor: NP.clone().add(V3(-NR * 0.8, -NR * 0.4, 0.2)) });
    var er = K.rer(NR, rng, { n: 3, phi0: Math.PI / 2 - 1.4, phiLen: 2.8, th0: 0.6, thLen: 1.5 });
    er.group.position.copy(NP); add('rer', er.group, { pr: 0, anchor: NP.clone().add(V3(0.2, 1.7, 1.2)) });
    var rp = er.ribos.map(function (p) { return p.clone().add(NP); }), k, p;
    for (k = 0; k < 130; k++) {
      p = V3((rng() * 2 - 1) * inner.a, (rng() * 2 - 1) * inner.b, (rng() * 2 - 1) * inner.c);
      if (!inner.inside(p, 0.93) || vs.inside(p, 1.06) || p.distanceTo(NP) < NR + 0.2) continue; rp.push(p);
    }
    add('ribosoma', K.ribosomes(rp, 0.07), { pr: 0, anchor: V3(-3.9, 3.35, 1.8) });
    var rl = K.rel(rng, 1.0, 0.5); rl.position.set(-5.5, -1.9, 0.9); add('rel', rl, { pr: 0 });

    var cyto = function (r) { return place.find(inner, r, function (pp) { return !vs.inside(pp, 1.1); }); };
    var go = new T.Group();
    for (i = 0; i < 3; i++) { pos = cyto(0.75); if (!pos) continue; q = K.golgi(0.55, 5); q.position.copy(pos); q.rotation.set(rng() * 3, rng() * 3, rng() * 3); go.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.05 }); }
    add('golgi', go, { pr: 0 });
    var vv = new T.Group(); for (i = 0; i < 12; i++) { s = 0.1 + rng() * 0.08; pos = place.find(inner, s, function (pp) { return !vs.inside(pp, 1.08); }); if (!pos) continue; q = K.vesicle(s); q.position.copy(pos); vv.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.06 }); }
    add('vesicula', vv, { pr: 0 });

    var cl = new T.Group();
    for (i = 0; i < 11; i++) {
      s = 0.62 + rng() * 0.14; pos = cyto(s * 0.62); if (!pos) continue;
      q = K.chloroplast(s, rng); q.position.copy(pos); q.rotation.set(rng() * 3, rng() * 3, rng() * 3); cl.add(q);
      wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.09 }); chl.push(pos.clone());
    }
    add('cloroplasto', cl, { pr: 0 });
    var am = new T.Group(); for (i = 0; i < 2; i++) { s = 0.4; pos = cyto(s); if (!pos) continue; q = K.amyloplast(s, rng); q.position.copy(pos); am.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.05 }); }
    add('amiloplasto', am, { pr: 0 });
    var mi = new T.Group(); for (i = 0; i < 6; i++) { s = 0.36 + rng() * 0.1; pos = cyto(s * 0.9); if (!pos) continue; q = K.mitochondrion(s); q.position.copy(pos); q.rotation.set(rng() * 3, rng() * 3, rng() * 3); mi.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.07 }); }
    add('mito', mi, { pr: 0 });
    var pe = new T.Group(); for (i = 0; i < 4; i++) { s = 0.2; pos = cyto(s); if (!pos) continue; q = K.peroxisome(s); q.position.copy(pos); pe.add(q); wobble.push({ o: q, b: pos.clone(), ph: rng() * 6, a: 0.05 }); }
    add('peroxisoma', pe, { pr: 0 });

    /* citoesqueleto cortical: aros de microtúbulos alrededor del eje largo y filamentos de actina */
    var mt = new T.Group(), mm = K.M('#53c7ff', { r: 0.4, e: '#2a8fd0', ei: 0.25 });
    [-0.62, -0.42, -0.22, -0.02, 0.18, 0.38, 0.58, 0.78].forEach(function (tx) {
      var pts = [], j, n = 28; for (j = 0; j < n; j++) { var th = j / n * Math.PI * 2; pts.push(inner.surface(V3(tx * 1.6, Math.cos(th), Math.sin(th)), 0.925)); }
      mt.add(K.tube(pts, 0.04, mm, true));
    });
    add('mtub', mt, { pr: 0, anchor: V3(3.4, 2.7, 3.5) });
    var ac = new T.Group(), amt = K.M('#ff8ad0', { r: 0.5 });
    for (i = 0; i < 40; i++) {
      var d0 = V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize(), pts2 = [], j2;
      for (j2 = 0; j2 < 5; j2++) { pts2.push(inner.surface(d0.clone().add(V3((rng() - .5) * .2 * j2, (rng() - .5) * .2 * j2, (rng() - .5) * .2 * j2)), 0.91)); }
      ac.add(K.tube(pts2, 0.022, amt));
    }
    add('actina', ac, { pr: 0, anchor: V3(-2.0, -3.9, 1.6) });

    /* luz incidente (solo en la etapa de fotosíntesis) */
    rays = new T.Group(); var rm = new T.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.0, depthWrite: false });
    chl.slice(0, 7).forEach(function (c) { rays.add(K.cylBetween(V3(c.x + 0.6, 8.5, c.z + 0.5), c.clone().add(V3(0, 0.3, 0)), 0.045, rm)); });
    rays.userData.m = rm; rays.visible = false; view.root.add(rays);
  }

  function animate(view, f) {
    var t = view.time;
    wobble.forEach(function (w) { w.o.position.set(w.b.x + Math.sin(t * 0.5 + w.ph) * w.a, w.b.y + Math.cos(t * 0.4 + w.ph * 1.3) * w.a, w.b.z + Math.sin(t * 0.45 + w.ph * .7) * w.a); w.o.rotation.y += f.dt * 0.12; });
    if (rays) { var on = f.i === 2 && !(window.__cell && window.__cell.S.manual); rays.userData.m.opacity += ((on ? 0.55 + 0.35 * Math.sin(t * 5) : 0) - rays.userData.m.opacity) * 0.1; rays.visible = rays.userData.m.opacity > 0.03; }
  }

  CellApp.run({
    key: 'celula-vegetal', title: 'Célula vegetal', subtitle: 'Simulador 3D · biología celular', accent: { dark: '#7ddc6a', light: '#2e7d32' }, viewLabel: 'Modelo 3D de la célula vegetal',
    info: INFO, ids: IDS, stages: STAGES, quiz: QUIZ, compare: COMPARE, build: build, animate: animate, home: [0.5, 0.4, 1, 26], cutZ: 0.8,
    legendExtra: [{ color: '#a8c26a', label: 'Pared celular', text: '(entramado de celulosa)' }],
    ideas: [
      'Lo que distingue a la célula vegetal: <b>pared celular</b>, <b>vacuola central</b> y <b>cloroplastos</b>.',
      'La vacuola genera <b>turgencia</b> y la pared la contiene: juntas dan firmeza a los tejidos.',
      'Los <b>cloroplastos</b> y las <b>mitocondrias</b> tienen doble membrana, ADN y ribosomas propios (origen endosimbiótico).',
      'Los <b>plasmodesmos</b> comunican las células a través de la pared.'
    ],
    help: {
      intro: 'Sigue la lección con el reproductor inferior o explora libremente: gira arrastrando, acerca con la rueda y haz clic en cualquier componente para ver su ficha.',
      items: [['Clic en el modelo', 'selecciona un componente, lo resalta y atenúa el resto; vuelve a pulsarlo para quitar la selección.'], ['Capas', 'muestra u oculta sistemas, etiquetas y el corte.'],
        ['Corte', 'quita la mitad frontal de la pared, membrana y vacuola para ver el interior; apágalo para ver la célula cerrada.'], ['Coloreado', '«Funciones» pinta cada componente según su sistema.'], ['Comparar', 'tabla con las diferencias frente a la célula animal.'], ['Desafío', 'juego «Identifica en 3D» y preguntas rápidas.']]
    }
  });
})();
