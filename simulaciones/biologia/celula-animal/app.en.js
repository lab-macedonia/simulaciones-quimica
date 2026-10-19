/* Célula animal — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa ../shared/cell-core.js y cell-app.js */
(function () {
  "use strict";
  var T = THREE, K = CellKit, V3 = K.V3;

  /* ---------- Fichas (comunes + propias de la célula animal) ---------- */
  var INFO = {};
  Object.keys(K.INFO).forEach(function (k) { INFO[k] = Object.assign({}, K.INFO[k]); });
  INFO.microvellosidades = { n: "Microvilli", g: 'lim', col: '#7fc4ff', s: "0.5–1 µm tall", m: "Membrane extensions", e: "Fingers of plasma membrane supported by bundles of actin filaments.",
    f: "They greatly increase the contact surface with the medium: they are key in nutrient absorption (epithelium of the small intestine).", c: "In the small intestine the microvilli multiply the absorption surface by ~20." };
  INFO.membrana.p = "It contains cholesterol, which regulates its fluidity, and a glycocalyx of carbohydrates on the outer face that serves for recognition between cells.";
  INFO.nucleo.p = "It occupies the central part of the cell and is surrounded by the rough endoplasmic reticulum.";
  INFO.centrosoma.p = "It is located next to the nucleus and the cytoskeleton microtubules originate from it.";
  INFO.lisosoma.p = "They are characteristic of animal cells: in plant cells the digestive function is carried out mainly by the vacuole.";

  var IDS = ['membrana', 'microvellosidades', 'citosol', 'nucleo', 'poro', 'nucleolo', 'cromatina', 'rer', 'rel', 'ribosoma', 'golgi', 'vesicula', 'mito', 'lisosoma', 'peroxisoma', 'centrosoma', 'mtub', 'actina', 'intermedios'];

  /* ---------- Recorrido guiado ---------- */
  var STAGES = [
    { name: "Boundary", short: "Membrane", title: "The plasma membrane and the internal medium",
      text: "<p>A <b>phospholipid bilayer</b> with proteins separates the cell from its surroundings. It is <b>selective</b>: it lets some substances through and holds back others.</p><p>The yellow dots are the phospholipid heads; the blue proteins are channels and transporters. Below, the <b>microvilli</b> increase the surface. Inside is the <b>cytosol</b>, the gel where metabolism takes place.</p>",
      focus: ['membrana', 'microvellosidades', 'citosol'], cam: [0.15, 0.1, 1, 21] },
    { name: "Information", short: "Nucleus", title: "The nucleus stores and reads the DNA",
      text: "<p>The <b>nuclear envelope</b> (double membrane) has <b>pores</b> through which RNAs leave and proteins enter. Inside, the <b>chromatin</b> (DNA + histones) contains the genes and the <b>nucleolus</b> makes the ribosome subunits.</p>",
      focus: ['nucleo', 'poro', 'nucleolo', 'cromatina'], fly: 'nucleo', dist: 8 },
    { name: "Synthesis", short: "Reticulum", title: "Reticula and ribosomes: protein and lipid factory",
      text: "<p>The <b>ribosomes</b> translate mRNA into proteins. Those attached to the <b>rough reticulum</b> make proteins that are secreted or go to membranes; the free ones make those of the cytosol.</p><p>The <b>smooth reticulum</b> synthesizes lipids and detoxifies.</p>",
      focus: ['rer', 'rel', 'ribosoma'], fly: 'rer', dist: 9.5 },
    { name: "Secretion", short: 'Golgi', title: "Golgi and vesicles: package and send",
      text: "<p>Proteins from the reticulum travel in <b>vesicles</b> to the <i>cis</i> face of the <b>Golgi apparatus</b>, where they are modified and sorted. They leave through the <i>trans</i> face and go to the membrane (<b>exocytosis</b>), the lysosomes or other destinations.</p><p>Watch the bright vesicle moving along the secretory pathway.</p>",
      focus: ['golgi', 'vesicula', 'rer', 'membrana'], fly: 'golgi', dist: 10 },
    { name: "Energy", short: "Mitochondria", title: "Mitochondria: the power plant",
      text: "<p>In the <b>matrix</b> and the <b>cristae</b> of the mitochondrion nutrients are oxidized and <b>ATP</b> is produced (cellular respiration). They have a <b>double membrane</b>, their own DNA and their own ribosomes: signs of their endosymbiotic origin.</p>",
      focus: ['mito'], cam: [0.3, 0.2, 1, 18] },
    { name: "Digestion", short: "Lysosomes", title: "Lysosomes and peroxisomes: recycling and detoxification",
      text: "<p>The <b>lysosomes</b> contain hydrolytic enzymes that digest molecules, bacteria and old organelles. The <b>peroxisomes</b> oxidize fatty acids and break down hydrogen peroxide (H₂O₂) with catalase.</p>",
      focus: ['lisosoma', 'peroxisoma'], cam: [-0.3, 0.25, 1, 18] },
    { name: "Support", short: "Cytoskeleton", title: "Cytoskeleton and centrosome",
      text: "<p>Three networks of fibers give shape, strength and movement: <b>microtubules</b> (blue, originating at the centrosome), <b>actin filaments</b> (pink, under the membrane) and <b>intermediate filaments</b> (green, anchoring the nucleus).</p><p>The <b>centrosome</b> with its two <b>centrioles</b> organizes the mitotic spindle.</p>",
      focus: ['mtub', 'actina', 'intermedios', 'centrosoma'], fly: 'centrosoma', dist: 11 },
    { name: "Whole", short: "All", title: "One cell, many systems",
      text: "<p>All the components work in coordination: the nucleus sends instructions, the ribosomes and reticula manufacture, the Golgi packages, the mitochondria provide energy and the cytoskeleton supports and transports.</p><p>Switch to <b>Functions</b> above to color by system, or click on any component.</p>",
      focus: null, cam: [0.45, 0.3, 1, 22] }
  ];

  var QUIZ = [
    { q: "Which organelle produces most of the ATP of the animal cell?", options: ["Golgi apparatus", "Mitochondrion", "Lysosome", "Smooth reticulum"], answer: 1, why: "Cellular respiration takes place in the mitochondria (Krebs cycle and respiratory chain on the cristae)." },
    { q: "The rough endoplasmic reticulum is so called because…", options: ["it has attached ribosomes", "it has a nucleus", "it has no membrane", "its tubules are irregular"], answer: 0, why: "The ribosomes bound to its cytosolic face give it the “rough” appearance under the microscope." },
    { q: "Which structure regulates the passage of substances between nucleus and cytoplasm?", options: ["Nucleolus", "Chromatin", "Nuclear pores", "Centrioles"], answer: 2, why: "The nuclear pore complexes control which molecules enter and leave." },
    { q: "Lysosomes contain…", options: ["chlorophyll", "hydrolytic enzymes", "circular DNA", "cellulose"], answer: 1, why: "They are enzymes that digest molecules and organelles in an acidic medium." },
    { q: "The nucleolus is mainly responsible for…", options: ["replicating DNA", "making ribosomal RNA and ribosome subunits", "producing lipids", "storing calcium"], answer: 1, why: "There the rRNA is transcribed and the ribosomal subunits are assembled." },
    { q: "Centrioles take part in…", options: ["photosynthesis", "the formation of the mitotic spindle", "lipid synthesis", "cellular digestion"], answer: 1, why: "They organize the spindle microtubules that distribute the chromosomes." },
    { q: "The pathway of a secretory protein is:", options: ["Golgi → rough ER → membrane", "Rough ER → Golgi → vesicle → membrane", "Nucleus → mitochondrion → membrane", "Lysosome → nucleus → Golgi"], answer: 1, why: "It is synthesized in the RER, modified in the Golgi and leaves by exocytosis in vesicles." },
    { q: "Which of these does NOT have a membrane?", options: ["Ribosome", "Mitochondrion", "Lysosome", "Peroxisome"], answer: 0, why: "Ribosomes are complexes of RNA and proteins without a membrane." },
    { q: "The phospholipids of the membrane are arranged with…", options: ["the hydrophobic tails toward the inside of the bilayer", "the heads toward the inside", "all the tails toward the cytosol", "no order"], answer: 0, why: "The hydrophobic tails hide from water between the hydrophilic heads." }
  ];

  var COMPARE = {
    title: "Animal cell versus plant cell", intro: "Both are eukaryotic and share nucleus, reticula, Golgi, mitochondria and cytoskeleton. The main differences:",
    head: ["Feature", "Animal (this model)", "Plant"],
    rows: [["Cell wall", "None", "Yes, of cellulose"], ["Chloroplasts", 'No', "Yes (photosynthesis)"], ["Vacuole", "Small and temporary", "One large central vacuole"], ["Shape", "Variable, rounded", "Fixed, polyhedral"],
      ["Centrioles", "Yes", "No (in flowering plants)"], ["Lysosomes", "Yes, abundant", "Scarce (the vacuole digests)"], ["Storage", "Glycogen", "Starch"], ["Communication", "Gap junctions", "Plasmodesmata"],
      ["Division", "Contractile ring (pinching)", "Cell plate"], ["Nutrition", "Heterotrophic", "Autotrophic"]],
    notes: ["Both have <b>mitochondria</b>: plants also respire.", "Lysosomes and centrioles are typical of the animal cell.", "To see the plant version open <i>Plant cell</i> from the portal."]
  };

  /* ---------- Escena ---------- */
  var shape = new K.Shape(6.2, 4.7, 4.9, 2.4);
  var NP = V3(-0.7, 0.3, -0.2), NR = 1.75, GP = V3(2.9, -0.15, 0.7);
  var wobble = [], tv, path;

  function build(view) {
    var rng = K.rng(11), place = new K.Placer(rng);
    function add(id, grp, extra) { var I = INFO[id]; return view.add(id, grp, Object.assign({ label: I.n.replace(" (nuclear envelope)", ''), col: I.col, grp: I.g }, extra || {})); }
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
    key: 'celula-animal', title: "Animal cell", subtitle: "3D Simulator · cell biology", accent: { dark: '#ff8a5c', light: '#c2410c' }, viewLabel: "3D model of the animal cell",
    info: INFO, ids: IDS, stages: STAGES, quiz: QUIZ, compare: COMPARE, build: build, animate: animate, home: [0.5, 0.32, 1, 22], cutZ: 0.7,
    ideas: [
      "The animal cell is <b>eukaryotic</b>: it has a nucleus with an envelope and organelles bounded by membranes.",
      "Structure and function go hand in hand: the <b>cristae</b> increase the surface of the mitochondrion; the <b>microvilli</b>, that of the membrane.",
      "Secretory proteins follow a pathway: <b>ribosome → rough reticulum → Golgi → vesicle → membrane</b>.",
      "Not everything has a membrane: ribosomes, centrosome, nucleolus and cytoskeleton are structures without a membrane."
    ],
    help: {
      intro: "Follow the lesson with the player below or explore freely: rotate by dragging, zoom with the wheel and click on any component to see its fact sheet.",
      items: [["Click on the model", "selects a component, highlights it, dims the rest and opens its fact sheet; press it again to clear the selection."], ["Layers", "shows or hides the systems (boundary, information, synthesis, energy, digestion, support), the labels and the cutaway."],
        ["Cutaway", "removes the front half of the membrane to see the inside."], ["Coloring", "“Functions” paints each component according to the system it belongs to."], ["Components", "complete list with direct access to each fact sheet."], ["Challenge", "“Identify in 3D” game and quick questions."]]
    }
  });
})();
