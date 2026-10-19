/* Célula vegetal — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa ../shared/cell-core.js y cell-app.js */
(function () {
  "use strict";
  var T = THREE, K = CellKit, V3 = K.V3;

  /* ---------- Fichas ---------- */
  var INFO = {};
  Object.keys(K.INFO).forEach(function (k) { INFO[k] = Object.assign({}, K.INFO[k]); });
  delete INFO.centrosoma; delete INFO.lisosoma; delete INFO.intermedios;
  INFO.pared = { n: "Cell wall", g: 'lim', col: '#a8c26a', s: "0.1–10 µm thick", m: "Extracellular matrix (no membrane)",
    e: "Cellulose microfibrils embedded in hemicellulose, pectins and proteins. The primary wall is flexible; in some cells a secondary wall with lignin is added.",
    f: "It gives shape and rigidity, resists turgor pressure (prevents the cell from bursting when it absorbs water), protects against pathogens and guides growth. It is permeable to water and ions.",
    c: "Wood is mostly lignified secondary cell wall of dead cells.", p: "It surrounds the plasma membrane; the microfibrils are seen as the crossed mesh." };
  INFO.lamina = { n: "Middle lamella", g: 'lim', col: '#e6cf7e', s: '~0,1 µm', m: "Pectin layer (no membrane)",
    e: "Pectin-rich layer shared by two neighboring cells, preceding the primary walls.", f: "It cements adjacent cells and holds the tissue together.", c: "The pectins of this layer are what make jams gel." };
  INFO.plasmodesmo = { n: "Plasmodesmata", g: 'lim', col: '#d94f8a', s: "~40 nm in diameter", m: "Membrane-lined channels",
    e: "Pores that cross the wall and connect the cytoplasms of neighboring cells; through their center passes the desmotubule, an extension of the endoplasmic reticulum.",
    f: "They allow the passage of water, ions, sugars, RNA and proteins between cells: they form the “symplast”. They play a role similar to that of animal gap junctions.", c: "Many plant viruses spread using these channels." };
  INFO.vacuola = { n: "Central vacuole", g: 'dig', col: '#7fd0ff', s: "30–90 % of the cell volume", m: "Single membrane (tonoplast)",
    e: "Large compartment surrounded by the tonoplast, full of vacuolar sap: water, ions, sugars, organic acids, pigments (anthocyanins) and hydrolytic enzymes.",
    f: "It maintains turgor (internal pressure), stores nutrients and waste, contains pigments and degrades components (it partly equals the lysosomes).", c: "A plant wilts when its vacuoles lose water and the cells lose turgor.", p: "It pushes the nucleus and the other organelles toward the periphery, leaving only a thin layer of cytoplasm." };
  INFO.cloroplasto = { n: "Chloroplasts", g: 'ene', col: '#79d26a', s: "3–10 µm long", m: "Double membrane",
    e: "Two membranes surround the stroma, where flattened sacs called thylakoids float, stacked in grana. They contain chlorophyll, circular DNA and ribosomes of their own.",
    f: "They carry out photosynthesis: in the thylakoids the light phase captures energy and produces ATP, NADPH and O₂; in the stroma the Calvin cycle fixes CO₂ and makes sugars.", c: "Their origin would be an endosymbiotic cyanobacterium; that is why they have their own DNA and ribosomes.", p: "Light (yellow arrows in the lesson) reaches the chloroplasts, which are located near the wall." };
  INFO.amiloplasto = { n: "Amyloplasts", g: 'dig', col: '#e8ecd6', s: '3–10 µm', m: "Double membrane",
    e: "Colorless plastids (leucoplasts) with starch granules inside.", f: "They store starch, the plant's energy reserve; they are abundant in tubers, roots and seeds.", c: "The potato is rich in starch because its cells are full of amyloplasts." };
  INFO.mito.p = "Plants also respire: at night and in organs without light the mitochondria produce the ATP; by day they cooperate with the chloroplasts.";
  INFO.nucleo.p = "It is usually displaced to the periphery by the large vacuole.";
  INFO.golgi.p = "In plants there are many small dispersed dictyosomes; they synthesize wall polysaccharides (hemicellulose and pectin) and send them in vesicles.";
  INFO.peroxisoma.p = "They take part in photorespiration together with chloroplasts and mitochondria.";
  INFO.membrana.p = "It is pressed against the cell wall, which contains the osmotic pressure.";
  INFO.mtub.p = "They form cortical rings under the membrane that guide the deposition of the cellulose microfibrils.";
  INFO.actina.p = "They generate cytoplasmic streaming (cyclosis), which drags organelles such as chloroplasts.";
  INFO.vesicula.p = "They carry wall material to the outside and form the cell plate when the cell divides.";
  INFO.citosol.p = "It forms only a thin layer between the membrane and the vacuole.";

  var IDS = ['pared', 'lamina', 'membrana', 'plasmodesmo', 'citosol', 'vacuola', 'nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma', 'golgi', 'vesicula', 'cloroplasto', 'amiloplasto', 'mito', 'peroxisoma', 'mtub', 'actina'];

  var STAGES = [
    { name: "Wall", short: "Wall", title: "Cell wall, membrane and plasmodesmata",
      text: "<p>The cellulose <b>cell wall</b> (the crossed mesh) surrounds the plasma membrane and gives it rigidity. Between neighboring cells there is a pectin <b>middle lamella</b>. The <b>plasmodesmata</b> cross the wall and connect the cytoplasms.</p>",
      focus: ['pared', 'lamina', 'membrana', 'plasmodesmo'], cam: [0.2, 0.15, 1, 25] },
    { name: "Vacuole", short: "Vacuole", title: "The central vacuole and turgor",
      text: "<p>The <b>central vacuole</b> occupies much of the cell. Filled with water and solutes, it pushes the cytoplasm against the wall and generates the <b>turgor pressure</b> that keeps the tissue firm. It also stores substances and degrades waste.</p>",
      focus: ['vacuola', 'citosol'], cam: [0.4, 0.35, 1, 21] },
    { name: "Photosynthesis", short: "Chloroplasts", title: "Chloroplasts: light that becomes sugar",
      text: "<p>The <b>chloroplasts</b> capture light with chlorophyll. In the <b>thylakoids</b> (stacked in grana) ATP, NADPH and O₂ are produced; in the <b>stroma</b> the Calvin cycle converts CO₂ into sugars. The <b>amyloplasts</b> store the starch.</p><p>The yellow arrows represent the incident light.</p>",
      focus: ['cloroplasto', 'amiloplasto'], cam: [0.15, 0.9, 1, 22] },
    { name: "Nucleus", short: "Nucleus", title: "Nucleus, reticulum and ribosomes",
      text: "<p>The <b>nucleus</b> stores the DNA (chromatin), with its nucleolus and its pores. The <b>rough reticulum</b> and the <b>ribosomes</b> make proteins; the <b>smooth reticulum</b> synthesizes lipids. Note that the vacuole has displaced the nucleus toward the wall.</p>",
      focus: ['nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma'], fly: 'nucleo', dist: 7.5 },
    { name: "Secretion", short: 'Golgi', title: "Dictyosomes and vesicles: building the wall",
      text: "<p>The <b>dictyosomes</b> (plant Golgi) synthesize the wall polysaccharides (hemicellulose, pectin) and package them in <b>vesicles</b> that fuse with the membrane (exocytosis) and the wall grows. During division they form the <b>cell plate</b>.</p>",
      focus: ['golgi', 'vesicula', 'pared'], cam: [0.3, 0.6, 1, 22] },
    { name: "Energy", short: "Mitochondria", title: "Mitochondria and peroxisomes",
      text: "<p>The <b>mitochondria</b> produce ATP by cellular respiration, day and night. The <b>peroxisomes</b> collaborate with chloroplasts and mitochondria in <b>photorespiration</b> and degrade H₂O₂ with catalase.</p>",
      focus: ['mito', 'peroxisoma', 'cloroplasto'], cam: [-0.3, 0.3, 1, 22] },
    { name: "Support", short: "Cytoskeleton", title: "Cytoskeleton and communication",
      text: "<p>The <b>cortical microtubules</b> form hoops under the membrane and guide the deposition of cellulose. <b>Actin</b> drives <b>cytoplasmic streaming</b>. Plants <b>lack centrioles and typical intermediate filaments</b>.</p>",
      focus: ['mtub', 'actina', 'plasmodesmo'], cam: [0.25, 0.25, 1, 23] },
    { name: "Whole", short: "All", title: "An autotrophic, rigid cell",
      text: "<p>The wall, the vacuole and the chloroplasts distinguish the plant cell. Switch to <b>Functions</b> to color by system, turn off the <b>Cutaway</b> to see the closed cell or click on any component.</p>",
      focus: null, cam: [0.5, 0.4, 1, 26] }
  ];

  var QUIZ = [
    { q: "Which structure gives rigidity to the plant cell and is made of cellulose?", options: ["Plasma membrane", "Cell wall", "Tonoplast", "Nuclear envelope"], answer: 1, why: "The cellulose cell wall surrounds the membrane and supports the cell." },
    { q: "The main function of the central vacuole is…", options: ["producing ATP", "maintaining turgor and storing substances", "synthesizing RNA", "carrying out photosynthesis"], answer: 1, why: "As it fills with water it presses the cytoplasm against the wall (turgor) and stores nutrients and waste." },
    { q: "In which part of the chloroplast does the light phase occur?", options: ["Stroma", "Thylakoids", "Outer membrane", "Cytosol"], answer: 1, why: "The chlorophyll of the thylakoid membranes captures the light; the Calvin cycle occurs in the stroma." },
    { q: "Plasmodesmata are…", options: ["nuclear pores", "channels that connect neighboring cells through the wall", "secretory vesicles", "cellulose fibers"], answer: 1, why: "They connect the cytoplasms of adjacent cells (symplast)." },
    { q: "An organelle present in the plant cell and absent in the animal one is…", options: ["Mitochondrion", "Ribosome", "Chloroplast", "Golgi apparatus"], answer: 2, why: "Chloroplasts (and the wall and the large vacuole) characterize the plant cell." },
    { q: "Amyloplasts store…", options: ["chlorophyll", "starch", "secretory proteins", "DNA"], answer: 1, why: "They are starch-storage plastids." },
    { q: "The plant cell typically does NOT have…", options: ["mitochondria", "nucleus", "centrioles", "endoplasmic reticulum"], answer: 2, why: "Flowering plants organize the spindle without centrioles." },
    { q: "Cytoplasmic streaming (cyclosis) depends mainly on…", options: ["cellulose microfibrils", "actin filaments", "ribosomes", "the middle lamella"], answer: 1, why: "Actin and myosin drag the organelles through the cytoplasm." },
    { q: "When a plant cell is placed in distilled water, it does not burst because…", options: ["it has no membrane", "the wall contains the turgor pressure", "the vacuole disappears", "the chloroplasts absorb water"], answer: 1, why: "The rigid wall resists the pressure generated by the entry of water." }
  ];

  var COMPARE = {
    title: "Plant cell versus animal cell", intro: "Both are eukaryotes with nucleus, reticula, Golgi, mitochondria and cytoskeleton. What is specific to the plant cell:",
    head: ["Feature", "Plant (this model)", 'Animal'],
    rows: [["Cell wall", "Yes, of cellulose", "None"], ["Chloroplasts", "Yes (photosynthesis)", 'No'], ["Vacuole", "One large central vacuole", "Small and temporary"], ["Shape", "Fixed, polyhedral", "Variable, rounded"],
      ["Centrioles", "No (in flowering plants)", "Yes"], ["Lysosomes", "Scarce (the vacuole digests)", "Yes, abundant"], ["Storage", "Starch", "Glycogen"], ["Communication", "Plasmodesmata", "Gap junctions"],
      ["Division", "Cell plate", "Contractile ring"], ["Intermediate filaments", "Absent (typically)", "Present"], ["Nutrition", "Autotrophic", "Heterotrophic"]],
    notes: ["Plants have <b>mitochondria</b> in addition to chloroplasts: they respire and photosynthesize.", "The central vacuole performs functions that in the animal cell are shared by the lysosomes.", "Compare with <i>Animal cell</i> from the portal."]
  };

  /* ---------- Escena ---------- */
  var shape = new K.Shape(7.0, 4.6, 4.4, 7), inner = shape.scaled(0.955), vs = new K.Shape(7.0 * 0.7, 4.6 * 0.64, 4.4 * 0.64, 4);
  var NP = V3(-5.7, 0.9, 0.4), NR = 0.95;
  var wobble = [], chl = [], rays, drift = [];

  function build(view) {
    var rng = K.rng(23), place = new K.Placer(rng), i, s, pos, q;
    function add(id, grp, extra) { var I = INFO[id]; return view.add(id, grp, Object.assign({ label: I.n.replace(" (nuclear envelope)", ''), col: I.col, grp: I.g }, extra || {})); }
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
    key: 'celula-vegetal', title: "Plant cell", subtitle: "3D Simulator · cell biology", accent: { dark: '#7ddc6a', light: '#2e7d32' }, viewLabel: "3D model of the plant cell",
    info: INFO, ids: IDS, stages: STAGES, quiz: QUIZ, compare: COMPARE, build: build, animate: animate, home: [0.5, 0.4, 1, 26], cutZ: 0.8,
    legendExtra: [{ color: '#a8c26a', label: "Cell wall", text: "(cellulose mesh)" }],
    ideas: [
      "What distinguishes the plant cell: <b>cell wall</b>, <b>central vacuole</b> and <b>chloroplasts</b>.",
      "The vacuole generates <b>turgor</b> and the wall contains it: together they give firmness to tissues.",
      "<b>Chloroplasts</b> and <b>mitochondria</b> have a double membrane and their own DNA and ribosomes (endosymbiotic origin).",
      "The <b>plasmodesmata</b> connect cells through the wall."
    ],
    help: {
      intro: "Follow the lesson with the player below or explore freely: rotate by dragging, zoom with the wheel and click on any component to see its fact sheet.",
      items: [["Click on the model", "selects a component, highlights it and dims the rest; press it again to clear the selection."], ["Layers", "shows or hides systems, labels and the cutaway."],
        ["Cutaway", "removes the front half of the wall, membrane and vacuole to see the inside; turn it off to see the closed cell."], ["Coloring", "“Functions” paints each component according to its system."], ["Compare", "table with the differences from the animal cell."], ["Challenge", "“Identify in 3D” game and quick questions."]]
    }
  });
})();
