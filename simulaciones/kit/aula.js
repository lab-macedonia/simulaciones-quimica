/* aula.js — Funciones de aula comunes a todas las simulaciones · Laboratorio MACEDONIA (UMCE).
   Un solo archivo para español e inglés (elige el idioma según <html lang>), sin copia .en.
   Aporta:
   · Práctica con problemas generados (valores nuevos en cada intento), definidos en practica.js de cada simulación.
   · Predice → observa → explica durante la lección guiada (pausa en etapas marcadas).
   · Rutas de aprendizaje entre simulaciones (antes / después).
   · Escenario compartible por enlace (?aula=...), informe imprimible y modo proyector.
   Con SimKit se integra en la interfaz (pestaña «Práctica», botón «Aula» en la barra superior);
   en las simulaciones sin SimKit aparece como botón flotante con el mismo menú.
   Datos por simulación: SimAula.register({ problems: [...], predict: {etapa: {...}}, quiz: [...], tour: [...] }).
   Cualquier texto de esos datos puede ser una cadena o un par [es, en]. Licencia MIT. */
(function (g) {
  'use strict';
  if (g.SimAula && g.SimAula.__v) return;
  var doc = document, EN = /^en/i.test(doc.documentElement.lang || '');
  function t(es, en) { return EN ? en : es; }
  function L(x) { return Array.isArray(x) ? (EN ? x[1] : x[0]) : (x == null ? '' : x); }
  function Lo(a) { return (a || []).map(L); }   /* lista de opciones: cada una es cadena o [es, en] */
  function fmt(x, d) { if (!isFinite(x)) return '–'; if (d == null) d = 2; return Number(x).toLocaleString(EN ? 'en-US' : 'es-CL', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false }); }
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sup(n) { return String(n).replace(/-/g, '⁻').replace(/\d/g, function (c) { return SUP[+c]; }); }
  /* n cifras significativas; notación científica fuera de 0,001–99 999 */
  function sig(x, n) {
    if (n == null) n = 3; if (!isFinite(x)) return '–'; if (x === 0) return fmt(0, n - 1);
    var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10), m = x / Math.pow(10, e);
    if (Math.abs(+m.toFixed(n - 1)) >= 10) { e++; m = x / Math.pow(10, e); }
    if (e >= -3 && e <= 4) return fmt(x, Math.max(0, n - 1 - e));
    return fmt(m, n - 1) + ' × 10' + sup(e);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function h(tag, attrs, html) { var e = doc.createElement(tag); if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; }
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || doc).querySelectorAll(s)); }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    sget: function (k, d) { try { var v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    /* Actividad del estudiante (registro, aciertos, notas): sobrevive al cierre de la pestaña, pero vence a las
       ACT_TTL horas sin uso para que en un computador compartido el siguiente curso no herede el informe. */
    aget: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        if (v != null) { var o = JSON.parse(v); if (o && o.at && Date.now() - o.at < ACT_TTL * 3600e3) return o.v; localStorage.removeItem(k); return d; }
        var s = sessionStorage.getItem(k); return s == null ? d : JSON.parse(s);   /* datos de la versión anterior */
      } catch (e) { return d; }
    },
    aset: function (k, v) { try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), v: v })); } catch (e) { store.sset(k, v); } },
    adel: function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
  };
  var ACT_TTL = 12;

  /* ---------- Identidad de la página ---------- */
  var parts = location.pathname.split('/').filter(Boolean).map(function (p) { try { return decodeURIComponent(p); } catch (e) { return p; } });
  if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();
  var SIM = parts.slice(-2).join('/');
  /* Objetivos de aprendizaje del Mineduc (kit/curriculo.js, se carga bajo demanda) */
  var KIT = ((doc.currentScript && doc.currentScript.src) || '').replace(/aula\.js[^/]*$/, '');
  function loadCurriculo() { if (g.SimCurriculo || !KIT || doc.getElementById('aulaCurr')) return; var sc = doc.createElement('script'); sc.id = 'aulaCurr'; sc.src = KIT + 'curriculo.js'; doc.head.appendChild(sc); }
  function curriculoHTML() {
    var C = g.SimCurriculo, e = C && C.forSim(SIM); if (!e) return '';
    var page = KIT + '../curriculo' + (EN ? '.en' : '') + '.html#sim=' + encodeURIComponent(SIM);
    return '<div class="aula-route"><div class="aula-kick">' + t('Objetivos de aprendizaje · Mineduc', 'Learning objectives · Mineduc (Chile)') + '</div>' + (e.universitario ? '<p class="aula-stats" style="margin:0 0 6px">' + t('Contenido de nivel universitario; OA escolares de apoyo:', 'University-level content; supporting school objectives:') + '</p>' : '') +
      (e.oa.length ? '<ul class="aula-oa">' + e.oa.map(function (o) { return '<li><b>' + esc(o.code) + '</b> ' + esc(EN ? o.en : o.es) + '</li>'; }).join('') + '</ul>' : '<p class="aula-stats">' + t('Sin OA escolar directo.', 'No direct school objective.') + '</p>') +
      '<a href="' + page + '">' + t('Ver cobertura curricular completa →', 'See full curriculum coverage →') + '</a></div>';
  }

  /* ---------- Rutas de aprendizaje ---------- */
  var TITLES = {
    'quimica-general/atomlab': ['AtomLab: modelos atómicos', 'AtomLab: atomic models'],
    'quimica-general/transiciones-electronicas': ['Transiciones electrónicas y átomo de Bohr', 'Electronic transitions and the Bohr atom'],
    'quimica-general/ensayo-a-la-llama': ['Ensayo a la llama', 'Flame test'],
    'quimica-general/configuracion-electronica': ['Configuración electrónica', 'Electron configuration'],
    'quimica-general/propiedades-periodicas': ['Propiedades periódicas', 'Periodic properties'],
    'quimica-general/enlace-quimico': ['Enlace químico', 'Chemical bonding'],
    'quimica-general/lewislab': ['LewisLab: estructuras de Lewis', 'LewisLab: Lewis structures'],
    'quimica-general/geomol': ['GeoMol: geometría molecular', 'GeoMol: molecular geometry'],
    'quimica-general/sigma-pi': ['Enlaces sigma y pi', 'Sigma and pi bonds'],
    'quimica-general/orbitales-moleculares': ['Orbitales moleculares en diatómicas', 'Molecular orbitals in diatomics'],
    'quimica-general/interacciones-intermoleculares': ['Interacciones intermoleculares', 'Intermolecular interactions'],
    'quimica-general/solidos-cristalinos': ['Sólidos cristalinos', 'Crystalline solids'],
    'quimica-general/semiconductores-bandas': ['Semiconductores y bandas', 'Semiconductors and bands'],
    'quimica-general/cifras-incertidumbre': ['Cifras significativas e incertidumbre', 'Significant figures and uncertainty'],
    'quimica-general/mol-masa-molar': ['El mol y la masa molar', 'The mole and molar mass'],
    'quimica-general/nomenclatura-inorganica': ['Nomenclatura inorgánica', 'Inorganic nomenclature'],
    'quimica-general/estequiometria': ['Estequiometría y reactivo limitante', 'Stoichiometry and limiting reactant'],
    'quimica-general/disoluciones-diluciones': ['Disoluciones y diluciones', 'Solutions and dilutions'],
    'quimica-general/gases': ['Gases ideales y reales', 'Ideal and real gases'],
    'quimica-general/coligativas': ['Propiedades coligativas', 'Colligative properties'],
    'quimica-general/gravimetria': ['Análisis gravimétrico', 'Gravimetric analysis'],
    'quimica-general/espectrofotometria': ['Espectrofotometría (Beer–Lambert)', 'Spectrophotometry (Beer–Lambert)'],
    'quimica-general/termoquimica': ['Termoquímica y calorimetría', 'Thermochemistry and calorimetry'],
    'quimica-general/entropia-gibbs': ['Entropía y energía libre de Gibbs', 'Entropy and Gibbs free energy'],
    'quimica-general/diagramas-de-fase': ['Diagramas de fase', 'Phase diagrams'],
    'quimica-general/colisiones-estado-transicion': ['Colisiones y estado de transición', 'Collisions and transition state'],
    'quimica-general/cinetica-ordenes': ['Cinética: órdenes de reacción', 'Kinetics: reaction orders'],
    'quimica-general/equilibrio-quimico': ['Equilibrio químico y Le Châtelier', 'Chemical equilibrium and Le Châtelier'],
    'quimica-general/solubilidad-kps': ['Solubilidad y Kps', 'Solubility and Ksp'],
    'quimica-general/acido-base-titulacion': ['Ácido–base, pH y titulación', 'Acid–base, pH and titration'],
    'quimica-general/balanceo-redox': ['Balanceo redox', 'Redox balancing'],
    'quimica-general/pilas-galvanicas': ['Pilas galvánicas y Nernst', 'Galvanic cells and Nernst'],
    'quimica-general/corrosion-pilas': ['Corrosión del hierro', 'Corrosion of iron'],
    'quimica-general/electrolisis-agua': ['Electrólisis del agua', 'Water electrolysis'],
    'quimica-general/radiacion-em': ['Radiación electromagnética', 'Electromagnetic radiation'],
    'quimica-general/radiactividad': ['Radiactividad y química nuclear', 'Radioactivity and nuclear chemistry'],
    'quimica-general/quimica-ambiental-verde': ['Química ambiental y verde', 'Environmental and green chemistry'],
    'quimica-inorganica/nomenclatura-complejos': ['Nomenclatura de complejos', 'Nomenclature of complexes'],
    'quimica-inorganica/isomeria-complejos': ['Isomería de complejos', 'Isomerism of complexes'],
    'quimica-inorganica/quiralidad-delta-lambda': ['Quiralidad Δ / Λ', 'Δ / Λ chirality'],
    'quimica-inorganica/simetria-grupos-puntuales': ['Simetría y grupos puntuales', 'Symmetry and point groups'],
    'quimica-inorganica/campo-cristalino': ['Teoría del campo cristalino', 'Crystal field theory'],
    'quimica-inorganica/om-complejos': ['OM en complejos octaédricos', 'MOs in octahedral complexes'],
    'quimica-inorganica/organometalica-18e': ['Organometálica: regla de 18 e', 'Organometallics: 18-electron rule'],
    'quimica-inorganica/hsab-acidos-bases-duros-blandos': ['Ácidos y bases duros y blandos', 'Hard and soft acids and bases'],
    'quimica-inorganica/quimica-descriptiva-grupos': ['Química descriptiva de los grupos', 'Descriptive chemistry of the groups'],
    'quimica-inorganica/bioinorganica': ['Química bioinorgánica', 'Bioinorganic chemistry'],
    'quimica-organica/grupos-funcionales': ['Grupos funcionales', 'Functional groups'],
    'quimica-organica/nomenclatura-iupac': ['Nomenclatura IUPAC', 'IUPAC nomenclature'],
    'quimica-organica/conformaciones': ['Conformaciones', 'Conformations'],
    'quimica-organica/estereoquimica-rs': ['Estereoquímica R/S', 'R/S stereochemistry'],
    'quimica-organica/acidez-pka': ['Acidez orgánica y pKa', 'Organic acidity and pKa'],
    'quimica-organica/aromaticidad-huckel': ['Aromaticidad y Hückel', 'Aromaticity and Hückel'],
    'quimica-organica/heterociclos': ['Heterociclos aromáticos', 'Aromatic heterocycles'],
    'quimica-organica/mecanismos-sn-e': ['Mecanismos SN1 · SN2 · E1 · E2', 'SN1 · SN2 · E1 · E2 mechanisms'],
    'quimica-organica/radicales-halogenacion': ['Radicales y halogenación', 'Radicals and halogenation'],
    'quimica-organica/adicion-electrofila-sear': ['Adición electrofílica y SEAr', 'Electrophilic addition and SEAr'],
    'quimica-organica/alquinos': ['Alquinos', 'Alkynes'],
    'quimica-organica/alcoholes-eteres-aminas': ['Alcoholes, éteres y aminas', 'Alcohols, ethers and amines'],
    'quimica-organica/oxidacion-reduccion': ['Oxidación y reducción orgánica', 'Organic oxidation and reduction'],
    'quimica-organica/carbonilo': ['Adición nucleófila al carbonilo', 'Nucleophilic addition to the carbonyl'],
    'quimica-organica/grignard-organometalicos': ['Reactivos de Grignard', 'Grignard reagents'],
    'quimica-organica/derivados-acido': ['Ácidos carboxílicos y derivados', 'Carboxylic acids and derivatives'],
    'quimica-organica/enolatos-aldolica': ['Enolatos y aldólica', 'Enolates and aldol'],
    'quimica-organica/diels-alder': ['Diels–Alder', 'Diels–Alder'],
    'quimica-organica/pericliclicas': ['Electrocíclicas y sigmatrópicas', 'Electrocyclic and sigmatropic'],
    'quimica-organica/retrosintesis': ['Retrosíntesis', 'Retrosynthesis'],
    'quimica-organica/punto-fusion': ['Punto de fusión y pureza', 'Melting point and purity'],
    'quimica-organica/recristalizacion': ['Recristalización', 'Recrystallization'],
    'quimica-organica/extraccion-liquido-liquido': ['Extracción líquido–líquido', 'Liquid–liquid extraction'],
    'quimica-organica/destilacion': ['Destilación', 'Distillation'],
    'quimica-organica/cromatografia': ['Cromatografía', 'Chromatography'],
    'quimica-organica/sintesis-aspirina': ['Síntesis de la aspirina', 'Synthesis of aspirin'],
    'quimica-organica/espectroscopia': ['Espectroscopía IR y RMN ¹H', 'IR and ¹H NMR spectroscopy'],
    'quimica-organica/espectrometria-ms-rmn13c': ['Masas y RMN de ¹³C', 'Mass spectrometry and ¹³C NMR'],
    'quimica-organica/uv-vis-conjugacion': ['UV-Vis y conjugación', 'UV-Vis and conjugation'],
    'quimica-organica/lipidos-jabon': ['Lípidos y jabones', 'Lipids and soaps'],
    'quimica-organica/carbohidratos-fischer-haworth': ['Carbohidratos: Fischer → Haworth', 'Carbohydrates: Fischer → Haworth'],
    'quimica-organica/terpenos-esteroides': ['Terpenos y esteroides', 'Terpenes and steroids'],
    'quimica-organica/polimeros': ['Polímeros', 'Polymers'],
    'biologia/celula-animal': ['Célula animal', 'Animal cell'],
    'biologia/celula-vegetal': ['Célula vegetal', 'Plant cell'],
    'biologia/lipidos-membrana': ['Lípidos y membrana', 'Lipids and membrane'],
    'biologia/aminoacidos-proteinas': ['Aminoácidos y proteínas', 'Amino acids and proteins'],
    'biologia/enzimas-cinetica': ['Enzimas y cinética enzimática', 'Enzymes and enzyme kinetics'],
    'biologia/nucleotidos-coenzimas': ['Nucleótidos y coenzimas', 'Nucleotides and coenzymes'],
    'biologia/adn': ['ADN: replicación y transcripción', 'DNA: replication and transcription'],
    'biologia/pcr-electroforesis': ['PCR y electroforesis', 'PCR and electrophoresis'],
    'biologia/operon-lac': ['Operón lac', 'The lac operon'],
    'biologia/mitosis-meiosis': ['Mitosis y meiosis', 'Mitosis and meiosis'],
    'biologia/genetica-mendel': ['Genética mendeliana', 'Mendelian genetics'],
    'biologia/metabolismo': ['Metabolismo energético', 'Energy metabolism'],
    'biologia/fotosintesis': ['Fotosíntesis', 'Photosynthesis'],
    'biologia/metabolismo-lipidos-aminoacidos': ['Metabolismo de lípidos y aminoácidos', 'Lipid and amino acid metabolism'],
    'biologia/potencial-accion': ['Potencial de acción', 'Action potential'],
    'biologia/senalizacion-celular': ['Señalización celular', 'Cell signaling'],
    'biologia/farmacos-receptores': ['Fármacos y receptores', 'Drugs and receptors'],
    'fisica/sistema-solar': ['Sistema Solar', 'Solar System'],
    'fisica/cinematica': ['Cinemática: MRU y MRUA', 'Kinematics'],
    'fisica/fuerzas-newton': ['Fuerzas y leyes de Newton', 'Forces and Newton’s laws'],
    'fisica/energia-mecanica': ['Energía mecánica', 'Mechanical energy'],
    'fisica/momentum-choques': ['Momentum y choques', 'Momentum and collisions'],
    'fisica/electrostatica': ['Electrostática', 'Electrostatics'],
    'fisica/circuitos': ['Circuitos eléctricos', 'Electric circuits'],
    'fisica/ondas-sonido': ['Ondas y sonido', 'Waves and sound'],
    'fisica/optica-ojo': ['Lentes y el ojo', 'Lenses and the eye'],
    'fisica/universo-expansion': ['Universo en expansión', 'Expanding universe'],
    'ciencias-tierra/tectonica-sismos': ['Tectónica y sismos', 'Plate tectonics'],
    'ciencias-tierra/volcanes': ['Volcanes y erupciones', 'Volcanoes'],
    'ciencias-tierra/rocas-fosiles': ['Rocas y fósiles', 'Rocks and fossils'],
    'ciencias-tierra/clima': ['Clima y cambio climático', 'Climate change'],
    'biologia/poblaciones-ecosistemas': ['Poblaciones y ecosistemas', 'Populations and ecosystems'],
    'biologia/epidemias-vacunas': ['Epidemias y vacunas', 'Epidemics and vaccines'],
    'biologia/microorganismos': ['Microorganismos', 'Microorganisms']
  };
  function R(name, base, list) { return { name: name, items: list.map(function (s) { return base + '/' + s; }) }; }
  var ROUTES = [
    R(['Átomo y enlace', 'Atoms and bonding'], 'quimica-general', ['atomlab', 'transiciones-electronicas', 'ensayo-a-la-llama', 'configuracion-electronica', 'propiedades-periodicas', 'enlace-quimico', 'lewislab', 'geomol', 'sigma-pi', 'orbitales-moleculares', 'interacciones-intermoleculares', 'solidos-cristalinos', 'semiconductores-bandas']),
    R(['Materia y cálculo químico', 'Matter and chemical calculations'], 'quimica-general', ['cifras-incertidumbre', 'mol-masa-molar', 'nomenclatura-inorganica', 'estequiometria', 'disoluciones-diluciones', 'gases', 'coligativas', 'gravimetria', 'espectrofotometria']),
    R(['Energía, cinética y equilibrio', 'Energy, kinetics and equilibrium'], 'quimica-general', ['termoquimica', 'entropia-gibbs', 'diagramas-de-fase', 'colisiones-estado-transicion', 'cinetica-ordenes', 'equilibrio-quimico', 'solubilidad-kps', 'acido-base-titulacion']),
    R(['Electroquímica, radiación y ambiente', 'Electrochemistry, radiation and environment'], 'quimica-general', ['balanceo-redox', 'pilas-galvanicas', 'corrosion-pilas', 'electrolisis-agua', 'radiacion-em', 'radiactividad', 'quimica-ambiental-verde']),
    R(['Química de coordinación', 'Coordination chemistry'], 'quimica-inorganica', ['nomenclatura-complejos', 'isomeria-complejos', 'quiralidad-delta-lambda', 'simetria-grupos-puntuales', 'campo-cristalino', 'om-complejos', 'organometalica-18e', 'hsab-acidos-bases-duros-blandos', 'quimica-descriptiva-grupos', 'bioinorganica']),
    R(['Estructura orgánica', 'Organic structure'], 'quimica-organica', ['grupos-funcionales', 'nomenclatura-iupac', 'conformaciones', 'estereoquimica-rs', 'acidez-pka', 'aromaticidad-huckel', 'heterociclos']),
    R(['Reacciones orgánicas', 'Organic reactions'], 'quimica-organica', ['mecanismos-sn-e', 'radicales-halogenacion', 'adicion-electrofila-sear', 'alquinos', 'alcoholes-eteres-aminas', 'oxidacion-reduccion', 'carbonilo', 'grignard-organometalicos', 'derivados-acido', 'enolatos-aldolica', 'diels-alder', 'pericliclicas', 'retrosintesis']),
    R(['Laboratorio orgánico y análisis', 'Organic lab and analysis'], 'quimica-organica', ['punto-fusion', 'recristalizacion', 'extraccion-liquido-liquido', 'destilacion', 'cromatografia', 'sintesis-aspirina', 'espectroscopia', 'espectrometria-ms-rmn13c', 'uv-vis-conjugacion']),
    R(['Biomoléculas y materiales', 'Biomolecules and materials'], 'quimica-organica', ['lipidos-jabon', 'carbohidratos-fischer-haworth', 'terpenos-esteroides', 'polimeros']),
    R(['Célula y biomoléculas', 'Cells and biomolecules'], 'biologia', ['celula-animal', 'celula-vegetal', 'lipidos-membrana', 'aminoacidos-proteinas', 'enzimas-cinetica', 'nucleotidos-coenzimas', 'adn', 'pcr-electroforesis', 'operon-lac', 'mitosis-meiosis', 'genetica-mendel']),
    R(['Energía y señales en la célula', 'Energy and signals in the cell'], 'biologia', ['metabolismo', 'fotosintesis', 'metabolismo-lipidos-aminoacidos', 'potencial-accion', 'senalizacion-celular', 'farmacos-receptores']),
    R(['Movimiento y energía', 'Motion and energy'], 'fisica', ['cinematica', 'fuerzas-newton', 'energia-mecanica', 'momentum-choques']),
    R(['Electricidad, ondas y universo', 'Electricity, waves and the universe'], 'fisica', ['electrostatica', 'circuitos', 'ondas-sonido', 'optica-ojo', 'universo-expansion', 'sistema-solar']),
    R(['Tierra dinámica y clima', 'Dynamic Earth and climate'], 'ciencias-tierra', ['tectonica-sismos', 'volcanes', 'rocas-fosiles', 'clima']),
    R(['Ecología, microorganismos y salud', 'Ecology, microorganisms and health'], 'biologia', ['poblaciones-ecosistemas', 'epidemias-vacunas', 'microorganismos'])
  ];
  function routeOf(id) {
    for (var i = 0; i < ROUTES.length; i++) { var k = ROUTES[i].items.indexOf(id); if (k >= 0) return { r: ROUTES[i], k: k }; }
    return null;
  }
  function simHref(id) { return '../../' + id + '/' + (EN ? 'index.en.html' : 'index.html'); }
  function simTitle(id) { return TITLES[id] ? L(TITLES[id]) : id.split('/').pop(); }
  function routeHTML() {
    var ro = routeOf(SIM); if (!ro) return '';
    var it = ro.r.items, k = ro.k, prev = it[k - 1], next = it[k + 1];
    return '<div class="aula-route"><div class="aula-kick">' + t('Ruta de aprendizaje', 'Learning path') + ' · ' + esc(L(ro.r.name)) + ' · ' + t('paso', 'step') + ' ' + (k + 1) + ' ' + t('de', 'of') + ' ' + it.length + '</div>' +
      '<ol class="aula-dots" aria-hidden="true">' + it.map(function (x, j) { return '<li class="' + (j < k ? 'done' : j === k ? 'on' : '') + '"></li>'; }).join('') + '</ol>' +
      '<div class="aula-route-links">' + (prev ? '<a href="' + simHref(prev) + '">← ' + t('Antes', 'Before') + ': ' + esc(simTitle(prev)) + '</a>' : '<span></span>') +
      (next ? '<a href="' + simHref(next) + '">' + t('Después', 'Next') + ': ' + esc(simTitle(next)) + ' →</a>' : '<span class="muted">' + t('Última de la ruta', 'Last in this path') + '</span>') + '</div></div>';
  }

  /* ---------- Registro de actividad (para el informe) ---------- */
  var LOGK = 'aula:log:' + SIM, LOG = store.aget(LOGK, []);
  function log(kind, txt, ok) { LOG.push({ k: kind, x: txt, ok: ok, at: Date.now() }); if (LOG.length > 200) LOG.shift(); store.aset(LOGK, LOG); }
  function resetActivity() { LOG.length = 0; ['aula:log:', 'aula:stats:', 'aula:notes:'].forEach(function (p) { store.adel(p + SIM); }); }

  /* ---------- Datos de la simulación ---------- */
  var DATA = { problems: [], predict: {}, quiz: [], tour: [] };
  function register(d) {
    if (!d) return;
    if (d.problems) DATA.problems = DATA.problems.concat(d.problems);
    if (d.predict) for (var k in d.predict) DATA.predict[k] = d.predict[k];
    if (d.quiz) DATA.quiz = DATA.quiz.concat(d.quiz);
    if (d.tour) DATA.tour = DATA.tour.concat(d.tour);
    if (d.problemsIntro) DATA.problemsIntro = d.problemsIntro;
  }

  /* ---------- Estilos ---------- */
  var CSS = [
    '.aula-card{background:var(--card,rgba(127,127,127,.08));border:1px solid var(--line,rgba(127,127,127,.35));border-radius:12px;padding:12px 14px;margin:0 0 12px;color:var(--ink,inherit)}',
    '.aula-kick{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#8a94a3);font-weight:700;margin-bottom:6px}',
    '.aula-q{font-size:.98rem;line-height:1.5;margin:6px 0 10px}',
    '.aula-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}',
    '.aula-btn{font:inherit;font-size:.86rem;padding:7px 12px;border-radius:9px;border:1px solid var(--line,rgba(127,127,127,.45));background:transparent;color:var(--ink,inherit);cursor:pointer}',
    '.aula-btn:hover{border-color:var(--accent,#4aa3ff)}.aula-btn.pri{background:var(--accent-solid,var(--accent,#2b6cb0));color:var(--on-accent,#fff);border-color:transparent}',
    '.aula-btn:focus-visible,.aula-in:focus-visible,.aula-fab:focus-visible{outline:2px solid var(--accent,#4aa3ff);outline-offset:2px}',
    '.aula-in{font:inherit;font-size:.95rem;padding:7px 10px;border-radius:9px;border:1px solid var(--line,rgba(127,127,127,.45));background:var(--bg0,transparent);color:var(--ink,inherit);width:9.5em}',
    '.aula-sel{font:inherit;font-size:.86rem;padding:6px 8px;border-radius:9px;border:1px solid var(--line,rgba(127,127,127,.45));background:var(--bg0,transparent);color:var(--ink,inherit);max-width:100%}',
    '.aula-fb{border-radius:9px;padding:8px 10px;margin-top:8px;font-size:.9rem;line-height:1.45}.aula-fb.ok{background:rgba(56,161,105,.16);border:1px solid rgba(56,161,105,.55)}.aula-fb.no{background:rgba(229,62,62,.12);border:1px solid rgba(229,62,62,.5)}.aula-fb.info{background:rgba(66,153,225,.12);border:1px solid rgba(66,153,225,.45)}',
    '.aula-sol{font-size:.88rem;line-height:1.5;margin-top:8px;padding:8px 10px;border-left:3px solid var(--accent,#4aa3ff);background:rgba(127,127,127,.07);border-radius:0 8px 8px 0}',
    '.aula-stats{font-size:.8rem;color:var(--muted,#8a94a3)}',
    '.aula-opts{display:grid;gap:6px;margin:6px 0}.aula-opts .aula-btn{text-align:left}.aula-opts .aula-btn.right{border-color:#38a169;background:rgba(56,161,105,.15)}.aula-opts .aula-btn.wrong{border-color:#e53e3e;background:rgba(229,62,62,.12)}.aula-opts .aula-btn.picked{border-color:var(--accent,#4aa3ff);background:rgba(66,153,225,.15)}',
    '.aula-poe{border:2px solid var(--accent,#4aa3ff)}',
    '.aula-poe-ask .phase-card #pcText,.aula-poe-ask .sk-dock #sk-text{filter:blur(6px);user-select:none;pointer-events:none}',
    '.sk-slot .aula-card{margin:8px 0 6px}',
    '.aula-route{margin-top:4px}.aula-route a{color:var(--accent,#4aa3ff);text-decoration:none;font-size:.86rem}.aula-route a:hover{text-decoration:underline}',
    '.aula-route-links{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.aula-route .muted{color:var(--muted,#8a94a3);font-size:.82rem}',
    '.aula-dots{display:flex;gap:4px;list-style:none;padding:0;margin:4px 0 8px}.aula-dots li{flex:1;height:5px;border-radius:3px;background:var(--line,rgba(127,127,127,.35))}.aula-dots li.done{background:var(--muted,#8a94a3)}.aula-dots li.on{background:var(--accent,#4aa3ff)}',
    '.aula-menu{position:fixed;z-index:9000;min-width:250px;max-width:min(340px,calc(100vw - 24px));background:var(--bg1,#121a24);color:var(--ink,#e8edf3);border:1px solid var(--line,rgba(127,127,127,.4));border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.35);padding:8px}',
    '.aula-menu button,.aula-menu a{display:flex;gap:10px;align-items:center;width:100%;text-align:left;font:inherit;font-size:.9rem;padding:8px 10px;border-radius:8px;border:0;background:transparent;color:inherit;cursor:pointer;text-decoration:none}',
    '.aula-menu button:hover,.aula-menu a:hover,.aula-menu button:focus-visible,.aula-menu a:focus-visible{background:rgba(127,127,127,.16);outline:none}',
    '.aula-menu hr{border:0;border-top:1px solid var(--line,rgba(127,127,127,.35));margin:6px 4px}.aula-menu small{display:block;color:var(--muted,#8a94a3);font-size:.75rem}',
    '.aula-oa{list-style:none;margin:0 0 6px;padding:0;font-size:.8rem;line-height:1.4;max-height:180px;overflow:auto}.aula-oa li{margin:0 0 4px}.aula-oa b{color:inherit}',
    /* Sin SimKit la página no define la paleta del kit: los paneles emergentes usan una paleta oscura propia con contraste AA */
    'html.aula-solo .aula-menu,html.aula-solo .aula-sheet{--ink:#e8edf3;--muted:#aab4c2;--line:rgba(160,172,188,.42);--accent:#7cc0ff;--accent-solid:#2563a8;--on-accent:#fff;--bg0:#0b1219;--bg1:#121a24;--card:rgba(255,255,255,.05)}',
    '.aula-menu .aula-route{padding:4px 8px}.aula-menu .aula-route-links{flex-direction:column}',
    '.aula-fab{position:fixed;left:12px;bottom:12px;z-index:8000;display:flex;align-items:center;gap:6px;font:600 .85rem system-ui,sans-serif;padding:8px 12px;border-radius:999px;border:1px solid rgba(127,127,127,.45);background:rgba(18,26,36,.92);color:#e8edf3;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3)}',
    '.aula-fab svg,.aula-ic{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.aula-sheet{position:fixed;z-index:8500;left:12px;bottom:60px;width:min(420px,calc(100vw - 24px));max-height:min(70vh,640px);overflow:auto;background:var(--bg1,#121a24);color:var(--ink,#e8edf3);border:1px solid var(--line,rgba(127,127,127,.4));border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.4);padding:12px}',
    '.aula-sheet-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}.aula-sheet-head b{font-size:1rem}',
    '.aula-hl{outline:3px solid #f6ad55 !important;outline-offset:3px;border-radius:6px;animation:aulaPulse 1.2s ease-in-out 3}',
    '@keyframes aulaPulse{50%{outline-color:transparent}}',
    '#aulaRep{position:fixed;inset:0;z-index:9500;overflow:auto;background:#fff;color:#111;font:14px/1.5 system-ui,sans-serif}',
    '#aulaRep .rep{max-width:820px;margin:0 auto;padding:24px 20px 60px}#aulaRep h1{font-size:1.4rem;margin:0 0 4px}#aulaRep h2{font-size:1.05rem;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}',
    '#aulaRep table{border-collapse:collapse;width:100%;font-size:.9rem}#aulaRep td,#aulaRep th{border:1px solid #ccc;padding:4px 8px;text-align:left;vertical-align:top}',
    '#aulaRep img{max-width:100%;border:1px solid #ccc;border-radius:6px}#aulaRep textarea,#aulaRep input{font:inherit;width:100%;border:1px solid #999;border-radius:6px;padding:6px;box-sizing:border-box;background:#fff;color:#111}',
    '#aulaRep .bar{display:flex;gap:8px;justify-content:flex-end;position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #ddd}#aulaRep .bar button{font:inherit;padding:7px 14px;border-radius:8px;border:1px solid #888;background:#f4f4f4;cursor:pointer}#aulaRep .bar button.pri{background:#1f5fa8;color:#fff;border-color:#1f5fa8}',
    '#aulaRep .ok{color:#1f7a43}#aulaRep .no{color:#b42318}#aulaRep .meta{color:#555;font-size:.85rem}#aulaRep .fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '@media print{html,body.aula-printing{background:#fff !important}body.aula-printing>*:not(#aulaRep){display:none !important}#aulaRep{position:static;overflow:visible}#aulaRep .bar{display:none}#aulaRep textarea{border:0;resize:none}}',
    /* modo proyector */
    'html.aula-proj .topbar,html.aula-proj .panel,html.aula-proj .hud,html.aula-proj .dock,html.aula-proj .toast,html.aula-proj .aula-menu{zoom:1.2}',
    'html.aula-proj .labels-layer .bond-label{zoom:1.35;font-weight:700}',
    'html.aula-proj.aula-solo body{font-size:118%}html.aula-proj.aula-solo .aula-fab,html.aula-proj.aula-solo .aula-sheet{zoom:1.2}',
    'html.aula-proj .panel{--muted:var(--ink)}',
    '@media (max-width:560px){#aulaRep .fields{grid-template-columns:1fr}}'
  ].join('\n');
  function injectCSS() { if ($('#aulaCss')) return; var s = h('style', { id: 'aulaCss' }); s.textContent = CSS; doc.head.appendChild(s); }

  var ICON = {
    cap: '<path d="M2 9.5l10-5 10 5-10 5z"/><path d="M6 11.5v4.5c3.5 2.6 8.5 2.6 12 0v-4.5M22 9.5v5.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    proj: '<path d="M3 5h18v11H3zM12 16v4M8 20h8"/>',
    pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    path: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h7a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7"/>'
  };
  function ic(id) { return '<svg class="aula-ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[id] + '</svg>'; }

  /* ---------- Práctica con problemas generados ---------- */
  function rnd(a, b, dec) { var v = a + Math.random() * (b - a), p = Math.pow(10, dec == null ? 2 : dec); return Math.round(v * p) / p; }
  function int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  /* Opción múltiple: right y wrong pueden ser cadenas o pares [es, en]; se toman hasta n distractores distintos. */
  function mc(q, right, wrong, sol, n) {
    var r = L(right), seen = {}, w = [];
    seen[r] = 1;
    shuffle(wrong || []).forEach(function (x) { var s = L(x); if (!seen[s]) { seen[s] = 1; w.push(s); } });
    return { q: L(q), options: [r].concat(w.slice(0, n || 3)), answer: 0, sol: L(sol) };
  }
  /* Problema de identificación desde un banco: item al azar, distractores = respuestas de los demás items (más extra). */
  function bank(items, qf, af, sf, extra, n) {
    var it = pick(items), others = items.filter(function (x) { return x !== it; }).map(af);
    return mc(qf(it), af(it), others.concat(extra || []), sf ? sf(it) : '', n);
  }
  var H = { t: t, L: L, EN: EN, fmt: fmt, sig: sig, sup: sup, rnd: rnd, int: int, pick: pick, shuffle: shuffle, mc: mc, bank: bank };
  function parseNum(s) {
    s = String(s || '').trim().replace(/\s+/g, '').replace(/−/g, '-');
    if (!s) return NaN;
    s = s.replace(/[×x\*]10\^?([+-]?\d+)/i, 'e$1');
    // coma decimal (es) o punto decimal (en); separadores de miles ambiguos se ignoran si hay ambos
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) { if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
    else s = s.replace(',', '.');
    var v = Number(s); return v;
  }
  function buildPractice(host, opts) {
    opts = opts || {};
    var gens = DATA.problems; if (!gens.length) return;
    var stats = store.aget('aula:stats:' + SIM, { ok: 0, n: 0, streak: 0 });
    var card = h('div', { class: opts.bare ? '' : 'aula-card' });
    host.appendChild(card);
    var sel = gens.length > 1 ? '<label class="aula-row"><span>' + t('Tipo', 'Type') + '</span> <select class="aula-sel" id="aulaPType"><option value="*">' + t('Cualquiera (al azar)', 'Any (random)') + '</option>' + gens.map(function (gg, i) { return '<option value="' + i + '">' + esc(L(gg.name)) + '</option>'; }).join('') + '</select></label>' : '';
    card.innerHTML = '<div class="aula-kick">' + t('Práctica · problemas que cambian en cada intento', 'Practice · problems change every attempt') + '</div>' +
      '<p class="aula-stats" style="margin:0 0 6px">' + (DATA.problemsIntro ? L(DATA.problemsIntro) : t('Cada problema usa valores nuevos. Escribe tu resultado con coma o punto decimal; se acepta un error relativo pequeño por redondeo.', 'Each problem uses new values. Type your answer with a decimal point; a small relative error is accepted for rounding.')) + '</p>' +
      sel + '<div id="aulaPBody"></div><p class="aula-stats" id="aulaPStats" aria-live="polite"></p>';
    var body = card.querySelector('#aulaPBody'), stEl = card.querySelector('#aulaPStats'), typeSel = card.querySelector('#aulaPType');
    var cur = null, tries = 0, done = false;
    function showStats() { stEl.textContent = t('Correctas', 'Correct') + ': ' + stats.ok + ' / ' + stats.n + (stats.streak > 1 ? ' · ' + t('racha', 'streak') + ': ' + stats.streak : ''); }
    function next() {
      var i = typeSel && typeSel.value !== '*' ? +typeSel.value : Math.floor(Math.random() * gens.length), gg = gens[i], p = null;
      for (var k = 0; k < 20 && !p; k++) { try { p = gg.gen(H); } catch (e) { if (k === 19) console.error(e); } }
      if (!p) return;
      cur = p; cur.name = L(gg.name); tries = 0; done = false;
      var input;
      if (p.options) {
        var order = shuffle(p.options.map(function (o, j) { return j; }));
        input = '<div class="aula-opts" role="group">' + order.map(function (j) { return '<button class="aula-btn" data-j="' + j + '">' + p.options[j] + '</button>'; }).join('') + '</div>';
      } else {
        input = '<div class="aula-row"><label><span class="sr-only">' + t('Tu respuesta', 'Your answer') + '</span><input class="aula-in" id="aulaPIn" inputmode="decimal" autocomplete="off" placeholder="' + t('resultado', 'answer') + '"></label> <span>' + (p.unit || '') + '</span> <button class="aula-btn pri" id="aulaPChk">' + t('Comprobar', 'Check') + '</button></div>';
      }
      body.innerHTML = '<div class="aula-q"><b>' + esc(cur.name) + '.</b> ' + p.q + '</div>' + input +
        '<div class="aula-row"><button class="aula-btn" id="aulaPSol">' + t('Ver solución', 'Show solution') + '</button> <button class="aula-btn" id="aulaPNew">' + t('Otro problema', 'New problem') + '</button></div><div id="aulaPOut" aria-live="polite"></div>';
      var out = body.querySelector('#aulaPOut');
      function finish(ok, given) {
        if (done) return; done = true; stats.n++; if (ok) { stats.ok++; stats.streak++; } else stats.streak = 0; store.aset('aula:stats:' + SIM, stats); showStats();
        log('prob', cur.name + ': ' + stripTags(p.q).slice(0, 140) + ' → ' + given + (ok ? '' : ' (' + t('correcta', 'correct') + ': ' + stripTags(answerText(p)) + ')'), ok);
      }
      function sol(prefix, cls) { out.innerHTML = (prefix ? '<div class="aula-fb ' + cls + '">' + prefix + '</div>' : '') + '<div class="aula-sol">' + (p.sol || '') + '<br><b>' + t('Respuesta', 'Answer') + ': ' + answerText(p) + '</b></div>'; }
      if (p.options) {
        $$('.aula-opts .aula-btn', body).forEach(function (b) {
          b.addEventListener('click', function () {
            if (done) return; var j = +b.dataset.j, ok = j === p.answer;
            $$('.aula-opts .aula-btn', body).forEach(function (x) { x.disabled = true; if (+x.dataset.j === p.answer) x.classList.add('right'); });
            if (!ok) b.classList.add('wrong');
            finish(ok, stripTags(p.options[j])); sol(ok ? t('¡Correcto!', 'Correct!') : t('No es correcta.', 'Not correct.'), ok ? 'ok' : 'no');
          });
        });
      } else {
        var inp = body.querySelector('#aulaPIn');
        var check = function () {
          var v = parseNum(inp.value); if (!isFinite(v)) { out.innerHTML = '<div class="aula-fb info">' + t('Escribe un número (por ejemplo 0,250 o 2,5e-3).', 'Type a number (for example 0.250 or 2.5e-3).') + '</div>'; return; }
          var a = p.a, tol = p.abs != null ? p.abs : Math.abs(a) * (p.tol || 0.02), ok = Math.abs(v - a) <= tol + 1e-12;
          tries++;
          if (ok) { finish(true, inp.value + ' ' + (p.unit || '')); sol(t('¡Correcto!', 'Correct!') + ' ' + (tries > 1 ? t('(al intento ' + tries + ')', '(attempt ' + tries + ')') : ''), 'ok'); return; }
          var hint = '';
          if (a !== 0 && v !== 0) { var r = v / a, lr = Math.log(Math.abs(r)) / Math.LN10; if (Math.abs(lr - Math.round(lr)) < 0.02 && Math.round(lr) !== 0) hint = ' ' + t('Tu resultado difiere en un factor 10' + sup(Math.round(lr)) + ': revisa las unidades o potencias de diez.', 'Your result is off by a factor of 10' + sup(Math.round(lr)) + ': check units or powers of ten.'); else if (r < 0) hint = ' ' + t('Revisa el signo.', 'Check the sign.'); }
          if (p.hint && !hint) hint = ' ' + p.hint;
          if (tries >= 2) { finish(false, inp.value + ' ' + (p.unit || '')); sol(t('Todavía no.', 'Not yet.') + hint, 'no'); }
          else out.innerHTML = '<div class="aula-fb no">' + t('No coincide. Inténtalo otra vez.', 'That does not match. Try again.') + hint + '</div>';
        };
        body.querySelector('#aulaPChk').addEventListener('click', check);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } e.stopPropagation(); });
      }
      body.querySelector('#aulaPSol').addEventListener('click', function () { finish(false, t('(vio la solución)', '(viewed solution)')); sol('', ''); });
      body.querySelector('#aulaPNew').addEventListener('click', next);
    }
    if (typeSel) typeSel.addEventListener('change', next);
    showStats(); next();
  }
  function answerText(p) { return p.options ? p.options[p.answer] : (p.aText || sig(p.a, p.sf || 3)) + (p.unit ? ' ' + p.unit : ''); }
  function stripTags(s) { var d = doc.createElement('div'); d.innerHTML = String(s); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ---------- Desafío simple (simulaciones sin SimKit) ---------- */
  function buildQuiz(host) {
    var items = DATA.quiz; if (!items.length) return;
    var card = h('div', { class: 'aula-card' }); host.appendChild(card);
    var order, idx, score;
    function start() { order = shuffle(items.map(function (_, i) { return i; })); idx = 0; score = 0; render(); }
    function render() {
      if (idx >= order.length) {
        card.innerHTML = '<div class="aula-kick">' + t('Desafío', 'Challenge') + '</div><div class="aula-fb ' + (score >= order.length * 0.6 ? 'ok' : 'no') + '">' + t('Resultado', 'Result') + ': <b>' + score + ' / ' + order.length + '</b></div><div class="aula-row"><button class="aula-btn pri">' + t('Intentar de nuevo', 'Try again') + '</button></div>';
        card.querySelector('button').addEventListener('click', start); log('quiz', t('Desafío', 'Challenge') + ': ' + score + ' / ' + order.length, score >= order.length * 0.6); return;
      }
      var it = items[order[idx]], ops = shuffle(Lo(it.options).map(function (o, j) { return j; }));
      card.innerHTML = '<div class="aula-kick">' + t('Desafío', 'Challenge') + ' · ' + (idx + 1) + ' / ' + order.length + ' · ' + t('aciertos', 'correct') + ': ' + score + '</div><div class="aula-q">' + L(it.q) + '</div><div class="aula-opts">' +
        ops.map(function (j) { return '<button class="aula-btn" data-j="' + j + '">' + Lo(it.options)[j] + '</button>'; }).join('') + '</div><div aria-live="polite" class="aula-out"></div>';
      $$('.aula-opts .aula-btn', card).forEach(function (b) {
        b.addEventListener('click', function () {
          var j = +b.dataset.j, ok = j === it.answer; if (ok) score++;
          $$('.aula-opts .aula-btn', card).forEach(function (x) { x.disabled = true; if (+x.dataset.j === it.answer) x.classList.add('right'); }); if (!ok) b.classList.add('wrong');
          card.querySelector('.aula-out').innerHTML = '<div class="aula-fb ' + (ok ? 'ok' : 'no') + '">' + (ok ? t('¡Correcto! ', 'Correct! ') : t('No exactamente. ', 'Not quite. ')) + L(it.why) + '</div><div class="aula-row"><button class="aula-btn pri">' + (idx + 1 < order.length ? t('Siguiente', 'Next') : t('Ver resultado', 'See result')) + '</button></div>';
          card.querySelector('.aula-out .aula-btn').addEventListener('click', function () { idx++; render(); });
        });
      });
    }
    start();
  }

  /* ---------- Predice → observa → explica (lección guiada de SimKit) ---------- */
  var poeDone = {}, poePending = null, poeHost = null;
  function poeKey(i, kit) { return ((kit && kit.state && kit.state.mode) || '') + ':' + i; }
  // Una predicción puede ser un objeto o una función (kit) → objeto | null, para lecciones cuyas etapas cambian con el modo
  function poeGet(i, kit) { var P = DATA.predict[i]; if (typeof P === 'function') { try { P = P(kit); } catch (e) { console.error(e); P = null; } } return P || null; }
  function poeAsk(i, kit) {
    var P = poeGet(i, kit); if (!P || !poeHost) return;
    poeDone[poeKey(i, kit)] = true; kit.pause();
    if (kit.selectTab) kit.selectTab('main');
    var pb = doc.getElementById('kPanelBtn'); if (kit.setPanel && pb && pb.getAttribute('aria-expanded') !== 'true') kit.setPanel(true);
    doc.documentElement.classList.add('aula-poe-ask');
    var ops = Lo(P.options);
    poeHost.hidden = false;
    poeHost.innerHTML = '<div class="aula-kick">' + t('Antes de seguir: predice', 'Before going on: predict') + '</div><div class="aula-q">' + L(P.q) + '</div><div class="aula-opts">' +
      ops.map(function (o, j) { return '<button class="aula-btn" data-j="' + j + '">' + o + '</button>'; }).join('') + '</div><div class="aula-row"><button class="aula-btn" id="aulaPoeSkip">' + t('Omitir', 'Skip') + '</button></div>';
    if (kit.announce) kit.announce(t('Predice antes de continuar: ', 'Predict before continuing: ') + stripTags(L(P.q)));
    poeHost.scrollIntoView && poeHost.scrollIntoView({ block: 'nearest' });
    function go(j) {
      doc.documentElement.classList.remove('aula-poe-ask');
      if (j == null) { poeHost.hidden = true; kit.play(); return; }
      poePending = { i: i, pick: j, P: P };
      poeHost.innerHTML = '<div class="aula-kick">' + t('Ahora observa', 'Now observe') + '</div><p class="aula-q">' + t('Tu predicción', 'Your prediction') + ': <b>' + ops[j] + '</b>. ' + t('Mira la simulación: al terminar esta etapa la compararemos con lo que ocurrió.', 'Watch the simulation: when this stage ends we will compare it with what happened.') + '</p>';
      kit.play();
    }
    $$('.aula-opts .aula-btn', poeHost).forEach(function (b) { b.addEventListener('click', function () { $$('.aula-opts .aula-btn', poeHost).forEach(function (x) { x.classList.toggle('picked', x === b); }); go(+b.dataset.j); }); });
    poeHost.querySelector('#aulaPoeSkip').addEventListener('click', function () { go(null); });
  }
  function poeReveal(kit) {
    var pd = poePending; poePending = null; if (!pd) return;
    var P = pd.P, ops = Lo(P.options), ok = pd.pick === P.answer;
    log('poe', t('Predicción', 'Prediction') + ' · ' + stripTags(L(P.q)) + ' → ' + stripTags(ops[pd.pick]), ok);
    poeHost.hidden = false;
    poeHost.innerHTML = '<div class="aula-kick">' + t('Explica: compara tu predicción', 'Explain: compare your prediction') + '</div><div class="aula-fb ' + (ok ? 'ok' : 'no') + '">' + (ok ? t('Tu predicción se cumplió.', 'Your prediction was right.') : t('Lo observado no coincide con tu predicción.', 'What happened differs from your prediction.')) + ' ' + t('Respuesta', 'Answer') + ': <b>' + ops[P.answer] + '</b></div><p class="aula-q">' + L(P.why) + '</p><div class="aula-row"><button class="aula-btn">' + t('Entendido', 'Got it') + '</button></div>';
    poeHost.querySelector('.aula-btn').addEventListener('click', function () { poeHost.hidden = true; });
  }

  /* ---------- Estado compartible ---------- */
  function paneControls(pane) {
    return {
      r: $$('input[type=range]', pane), c: $$('input[type=checkbox]', pane), s: $$('select', pane).filter(function (x) { return !/^(speed|aulaPType)$/.test(x.id); }),
      o: $$('.opts', pane).filter(function (x) { return !x.closest('.challenge') && !x.closest('.aula-card'); }), g: $$('.seg', pane)
    };
  }
  function pressedIdx(group) { var bs = $$('button', group); for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute('aria-pressed') === 'true') return i; return -1; }
  function snapPane(pane) {
    var c = paneControls(pane);
    return { r: c.r.map(function (x) { return x.value; }), c: c.c.map(function (x) { return x.checked ? 1 : 0; }), s: c.s.map(function (x) { return x.value; }), o: c.o.map(pressedIdx), g: c.g.map(pressedIdx) };
  }
  function diff(a, b) { var d = {}, any = false; ['o', 'g', 's', 'c', 'r'].forEach(function (k) { (b[k] || []).forEach(function (v, i) { if (!a[k] || a[k][i] !== v) { (d[k] = d[k] || {})[i] = v; any = true; } }); }); return any ? d : null; }
  function setRange(x, v) { x.value = v; x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true })); }
  function applyPane(pane, d) {
    ['o', 'g'].forEach(function (k) { if (!d[k]) return; Object.keys(d[k]).forEach(function (i) { var grp = paneControls(pane)[k][+i], b = grp && $$('button', grp)[d[k][i]]; if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }); });
    if (d.s) Object.keys(d.s).forEach(function (i) { var x = paneControls(pane).s[+i]; if (x && x.value !== d.s[i]) { x.value = d.s[i]; x.dispatchEvent(new Event('change', { bubbles: true })); x.dispatchEvent(new Event('input', { bubbles: true })); } });
    if (d.c) Object.keys(d.c).forEach(function (i) { var x = paneControls(pane).c[+i]; if (x && (x.checked ? 1 : 0) !== d.c[i]) x.click(); });
    if (d.r) Object.keys(d.r).forEach(function (i) { var x = paneControls(pane).r[+i]; if (x) setRange(x, d.r[i]); });
  }
  function shareURL(st) { var u = location.href.split('#')[0].replace(/([?&])aula=[^&]*(&|$)/, function (m, a, b) { return b ? a : ''; }).replace(/[?&]$/, ''); return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'aula=' + encodeURIComponent(JSON.stringify(st)) + location.hash; }
  function readShared() { try { var m = /[?&]aula=([^&#]*)/.exec(location.search); return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch (e) { return null; } }
  function copyText(txt, okMsg, toast) {
    function fallback() { var w = h('div', { class: 'aula-menu', role: 'dialog' }, '<p style="margin:4px 6px 8px;font-size:.85rem">' + t('Copia este enlace:', 'Copy this link:') + '</p><input class="aula-in" style="width:100%" readonly><div class="aula-row"><button class="aula-btn">' + t('Cerrar', 'Close') + '</button></div>'); w.style.left = '12px'; w.style.top = '64px'; doc.body.appendChild(w); var i = w.querySelector('input'); i.value = txt; i.select(); w.querySelector('button').addEventListener('click', function () { w.remove(); }); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast(okMsg); }, fallback); else fallback();
  }

  /* ---------- Informe imprimible ---------- */
  function snapshotData(kit, cfg) {
    try {
      if (cfg && cfg.render) cfg.render(kit);
      var root = kit ? kit.viewport : doc, cvs = $$('canvas', root).filter(function (c) { return c.width > 50 && c.height > 50 && c.offsetParent !== null; });
      cvs.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
      if (!cvs[0]) return null;
      var out = doc.createElement('canvas'), w = cvs[0].width, hh = cvs[0].height, sc = Math.min(1, 1100 / w); out.width = Math.round(w * sc); out.height = Math.round(hh * sc);
      var c = out.getContext('2d'); c.fillStyle = kit ? (kit.colors().bg0 || '#0e131a') : '#0e131a'; c.fillRect(0, 0, out.width, out.height);
      (kit ? cvs : [cvs[0]]).forEach(function (cv) { try { c.drawImage(cv, 0, 0, out.width, out.height); } catch (e) { /* nada */ } });
      return out.toDataURL('image/jpeg', 0.85);
    } catch (e) { return null; }
  }
  function openReport(kit, cfg, link) {
    var old = $('#aulaRep'); if (old) old.remove();
    var title = (cfg && cfg.title) || simTitle(SIM) || doc.title, img = snapshotData(kit, cfg);
    var meas = $$('#measTable tr').map(function (tr) { var c = tr.children; return c.length >= 2 ? '<tr><th>' + c[0].innerHTML + '</th><td>' + c[1].innerHTML + '</td></tr>' : ''; }).join('');
    var stage = '';
    if (kit && kit.state && cfg && cfg.stages && cfg.stages.length) { var s = cfg.stages[kit.state.stage]; if (s) stage = (kit.state.stage + 1) + ' / ' + cfg.stages.length + ' · ' + esc(s.name || ''); }
    var kinds = { quiz: t('Desafío', 'Challenge'), prob: t('Práctica', 'Practice'), poe: t('Predicción', 'Prediction'), tour: t('Recorrido', 'Tour') };
    var rows = LOG.map(function (e) { return '<tr><td>' + new Date(e.at).toLocaleTimeString(EN ? 'en-US' : 'es-CL', { hour: '2-digit', minute: '2-digit' }) + '</td><td>' + (kinds[e.k] || e.k) + '</td><td>' + esc(e.x) + '</td><td class="' + (e.ok === true ? 'ok' : e.ok === false ? 'no' : '') + '">' + (e.ok === true ? '✔' : e.ok === false ? '✘' : '') + '</td></tr>'; }).join('');
    var nOk = LOG.filter(function (e) { return e.ok === true; }).length, nAll = LOG.filter(function (e) { return e.ok != null; }).length;
    var who = store.get('aula:who', { name: '', course: '' });
    var rep = h('div', { id: 'aulaRep', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('Informe de la actividad', 'Activity report'), lang: EN ? 'en' : 'es' });
    rep.innerHTML = '<div class="rep"><div class="bar"><button class="pri" id="aulaRepPrint">' + t('Imprimir o guardar PDF', 'Print or save PDF') + '</button><button id="aulaRepReset">' + t('Empezar de nuevo', 'Start over') + '</button><button id="aulaRepClose">' + t('Cerrar', 'Close') + '</button></div>' +
      '<h1>' + esc(title) + '</h1><p class="meta">' + t('Informe de actividad', 'Activity report') + ' · ' + new Date().toLocaleString(EN ? 'en-US' : 'es-CL') + ' · Laboratorio MACEDONIA · UMCE</p>' +
      '<div class="fields"><label>' + t('Nombre', 'Name') + '<input id="aulaRepName" value="' + esc(who.name) + '"></label><label>' + t('Curso / grupo', 'Course / group') + '<input id="aulaRepCourse" value="' + esc(who.course) + '"></label></div>' +
      '<h2>' + t('Escenario', 'Scenario') + '</h2><p class="meta">' + (stage ? t('Etapa de la lección', 'Lesson stage') + ': ' + stage + '<br>' : '') + t('Enlace para reabrir este escenario', 'Link to reopen this scenario') + ': <br><span style="word-break:break-all">' + esc(link) + '</span></p>' +
      (img ? '<img alt="' + t('Captura de la simulación', 'Simulation screenshot') + '" src="' + img + '">' : '') +
      (meas ? '<h2>' + t('Medidas en el momento del informe', 'Measurements at report time') + '</h2><table>' + meas + '</table>' : '') +
      '<h2>' + t('Actividad registrada en esta sesión', 'Activity recorded in this session') + (nAll ? ' · ' + nOk + ' / ' + nAll + ' ' + t('correctas', 'correct') : '') + '</h2>' +
      (rows ? '<table><thead><tr><th>' + t('Hora', 'Time') + '</th><th>' + t('Tipo', 'Type') + '</th><th>' + t('Detalle', 'Detail') + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<p class="meta">' + t('Aún no hay actividad: resuelve problemas en «Práctica», responde el «Desafío» o las predicciones de la lección.', 'No activity yet: solve problems in «Practice», answer the «Challenge» or the lesson predictions.') + '</p>') +
      '<h2>' + t('Observaciones y conclusiones', 'Observations and conclusions') + '</h2><textarea id="aulaRepNotes" rows="7" placeholder="' + t('¿Qué observaste? ¿Qué relación encontraste entre las variables? ¿Qué te sorprendió?', 'What did you observe? What relationship did you find between the variables? What surprised you?') + '"></textarea>' +
      '<p class="meta" style="margin-top:14px">' + t('La actividad se guarda solo en este navegador: se conserva si cierras la pestaña y se borra sola tras ' + ACT_TTL + ' horas sin uso. En un computador compartido, usa «Empezar de nuevo» al terminar.', 'Activity is stored only in this browser: it survives closing the tab and is cleared automatically after ' + ACT_TTL + ' hours of inactivity. On a shared computer, use «Start over» when you finish.') + '</p></div>';
    doc.body.appendChild(rep);
    var notesK = 'aula:notes:' + SIM, ta = $('#aulaRepNotes'); ta.value = store.aget(notesK, ''); ta.addEventListener('input', function () { store.aset(notesK, ta.value); });
    $('#aulaRepReset').addEventListener('click', function () {
      if (!window.confirm(t('¿Borrar la actividad registrada y las observaciones de esta simulación?', 'Delete the recorded activity and notes for this simulation?'))) return;
      resetActivity(); close(); openReport(kit, cfg, link);
    });
    ['aulaRepName', 'aulaRepCourse'].forEach(function (id) { $('#' + id).addEventListener('input', function () { store.set('aula:who', { name: $('#aulaRepName').value, course: $('#aulaRepCourse').value }); }); });
    $('#aulaRepPrint').addEventListener('click', function () { doc.body.classList.add('aula-printing'); setTimeout(function () { window.print(); doc.body.classList.remove('aula-printing'); }, 50); });
    function close() { rep.remove(); doc.removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (rep.contains(e.target)) e.stopPropagation(); }
    doc.addEventListener('keydown', onKey, true);
    $('#aulaRepClose').addEventListener('click', close);
    $('#aulaRepPrint').focus();
  }

  /* ---------- Modo proyector ---------- */
  function setProj(on, toast) { doc.documentElement.classList.toggle('aula-proj', on); store.set('aula:proj', on); if (toast) toast(on ? t('Modo proyector activado: textos más grandes', 'Projector mode on: larger text') : t('Modo proyector desactivado', 'Projector mode off')); setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30); }

  /* ---------- Menú «Aula» ---------- */
  function openMenu(anchor, items) {
    var old = $('.aula-menu'); if (old) { old._close(); if (old._anchor === anchor) return; }
    /* Panel emergente (dialog) con grupos de acciones (role=menu) y, aparte, información (OA y ruta) con enlaces normales. */
    var m = h('div', { class: 'aula-menu', role: 'dialog', 'aria-label': t('Herramientas de aula', 'Classroom tools') }), list = null; m._anchor = anchor;
    function group() { if (!list) { list = h('div', { role: 'menu', 'aria-label': t('Herramientas de aula', 'Classroom tools') }); m.appendChild(list); } return list; }
    items.forEach(function (it) {
      if (it === '-') { m.appendChild(h('hr')); list = null; return; }
      if (it.html) { m.insertAdjacentHTML('beforeend', it.html); list = null; return; }
      var b = h('button', { role: 'menuitem', type: 'button' }, ic(it.icon) + '<span>' + it.label + (it.sub ? '<small>' + it.sub + '</small>' : '') + '</span>');
      b.addEventListener('click', function () { m._close(); it.fn(); }); group().appendChild(b);
    });
    m._close = function () { m.remove(); anchor.setAttribute('aria-expanded', 'false'); cleanup(); };
    doc.body.appendChild(m); anchor.setAttribute('aria-expanded', 'true');
    var r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    var left = Math.max(12, Math.min(r.right - mw, window.innerWidth - mw - 12)), top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    m.style.left = left + 'px'; m.style.top = top + 'px';
    var first = m.querySelector('button,a'); if (first) first.focus();
    function off(e) { if (!m.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) m._close(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); m._close(); anchor.focus(); } else if (m.contains(e.target)) { e.stopPropagation(); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var f = $$('button,a', m), i = f.indexOf(doc.activeElement); f[(i + (e.key === 'ArrowDown' ? 1 : -1) + f.length) % f.length].focus(); } } }
    function cleanup() { doc.removeEventListener('pointerdown', off, true); doc.removeEventListener('keydown', key, true); }
    setTimeout(function () { doc.addEventListener('pointerdown', off, true); doc.addEventListener('keydown', key, true); }, 0);
  }
  function commonItems(o) {
    var its = [];
    if (o.practice) its.push({ icon: 'pencil', label: t('Práctica con problemas', 'Practice problems'), sub: t('casos nuevos en cada intento', 'new cases every attempt'), fn: o.practice });
    if (o.quiz) its.push({ icon: 'flag', label: t('Desafío', 'Challenge'), fn: o.quiz });
    if (o.tour) its.push({ icon: 'path', label: t('Recorrido guiado', 'Guided tour'), sub: t(DATA.tour.length + ' pasos por la simulación', DATA.tour.length + ' steps through the simulation'), fn: o.tour });
    if (its.length) its.push('-');
    its.push({ icon: 'link', label: t('Copiar enlace a este escenario', 'Copy link to this scenario'), sub: t('guarda los valores de los controles', 'keeps the current control values'), fn: o.share });
    its.push({ icon: 'doc', label: t('Informe de la actividad', 'Activity report'), sub: t('captura, medidas, respuestas y notas', 'screenshot, measurements, answers and notes'), fn: o.report });
    var on = doc.documentElement.classList.contains('aula-proj');
    its.push({ icon: 'proj', label: on ? t('Salir del modo proyector', 'Leave projector mode') : t('Modo proyector', 'Projector mode'), sub: t('textos y etiquetas más grandes', 'larger text and labels'), fn: function () { setProj(!on, o.toast); } });
    var ch = curriculoHTML(); if (ch) { its.push('-'); its.push({ html: ch }); }
    var rh = routeHTML(); if (rh) { its.push('-'); its.push({ html: rh }); }
    return its;
  }

  /* ---------- Integración con SimKit ---------- */
  var attached = false;
  function prepCfg(cfg) {
    cfg.tabs = cfg.tabs || [];
    if (DATA.problems.length && !cfg.tabs.some(function (x) { return x.id === 'practica'; })) {
      var qi = -1; cfg.tabs.forEach(function (x, i) { if (x.id === 'quiz' && qi < 0) qi = i; });
      var tab = { id: 'practica', label: t('Práctica', 'Practice'), build: function (el) { buildPractice(el); },
        help: t('Problemas y ejercicios generados al azar: cada intento trae valores o casos nuevos. En los de cálculo tienes dos intentos; en todos puedes ver la solución explicada.', 'Randomly generated problems and exercises: each attempt brings new values or cases. Calculation problems give you two tries; all of them show an explained solution.') };
      if (qi >= 0) cfg.tabs.splice(qi, 0, tab); else cfg.tabs.push(tab);
    }
    // registrar los resultados del desafío del kit
    var patched = false;
    cfg.tabs.forEach(function (tb) {
      var ob = tb.build; tb.build = function (el, k) {
        if (!patched && k && k.ui && k.ui.quiz) { patched = true; var oq = k.ui.quiz; k.ui.quiz = function (host, o) { var od = o.onDone; o.onDone = function (s, n) { log('quiz', t('Desafío', 'Challenge') + ': ' + s + ' / ' + n, s >= n * 0.6); if (od) od(s, n); }; return oq.call(this, host, o); }; }
        return ob.apply(this, arguments);
      };
    });
    // contenedor para predicciones y ruta en la pestaña principal
    var mt = cfg.mainTop; cfg.mainTop = function (el, k) { poeHost = h('div', { class: 'aula-card aula-poe', id: 'aulaPoe', 'aria-live': 'polite' }); poeHost.hidden = true; el.appendChild(poeHost); if (mt) mt(el, k); };
    var me = cfg.mainExtra; cfg.mainExtra = function (el, k) { if (me) me(el, k); var rh = routeHTML(); if (rh) el.appendChild(h('div', { class: 'aula-card' }, rh)); };
    var os = cfg.onStage; cfg.onStage = function (i, s, k) {
      if (os) os.apply(this, arguments);
      try {
        if (poePending && poePending.i !== i) poeReveal(k);
        var manual = g.__sim && g.__sim.P && g.__sim.P.manual;
        if (DATA.predict[i] && !poeDone[poeKey(i, k)] && k.state.playing && !manual) poeAsk(i, k);
      } catch (e) { console.error(e); }
    };
  }
  function attachKit(kit, cfg) {
    attached = true; injectCSS(); loadCurriculo();
    if (store.get('aula:proj', false)) setProj(true);
    var btn = h('button', { class: 'icon-btn', id: 'kAula', title: t('Aula: práctica, enlace, informe, proyector', 'Classroom: practice, link, report, projector'), 'aria-label': t('Herramientas de aula', 'Classroom tools'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, '<svg class="ic" aria-hidden="true" viewBox="0 0 24 24">' + ICON.cap + '</svg>');
    var help = $('#kHelp'); if (help && help.parentNode) help.parentNode.insertBefore(btn, help);
    // estado inicial de los controles (para guardar solo lo que cambió)
    var base = {};
    function panes() { return $$('.tabpane').filter(function (p) { return !/^tab-(main|quiz|practica)$/.test(p.id); }); }
    function capture() {
      var S = kit.state, st = { v: 1 }, manual = g.__sim && g.__sim.P && g.__sim.P.manual, p = {};
      if (S.mode) st.m = S.mode; if (S.view) st.w = S.view;
      if (cfg.layers && cfg.layers.length) { st.l = {}; cfg.layers.forEach(function (l) { st.l[l.id] = S.layers[l.id] ? 1 : 0; }); }
      var on = $('.ptab.is-on'); if (on) st.tab = on.getAttribute('data-tab');
      // En MSim, mientras la lección controla la simulación, los controles reflejan el guion: se guarda la etapa
      var lessonDriven = g.__sim && g.__sim.P && !manual;
      if (!lessonDriven) panes().forEach(function (pane) { var d = diff(base[pane.id] || {}, snapPane(pane)); if (d) p[pane.id.slice(4)] = d; });
      if (Object.keys(p).length) st.p = p;
      if (cfg.stages && cfg.stages.length && !manual && !st.p) st.s = S.stage;
      return st;
    }
    function share() { copyText(shareURL(capture()), t('Enlace copiado: al abrirlo se recupera este escenario', 'Link copied: opening it restores this scenario'), kit.toast); }
    function report() { openReport(kit, cfg, shareURL(capture())); }
    btn.addEventListener('click', function () {
      openMenu(btn, commonItems({ toast: kit.toast, share: share, report: report, practice: DATA.problems.length ? function () { kit.selectTab('practica'); if (kit.setPanel) kit.setPanel(true); } : null }));
    });
    setTimeout(function () {
      panes().forEach(function (pane) { base[pane.id] = snapPane(pane); });
      var st = readShared(); if (!st) return;
      try {
        if (st.m && kit.setMode && st.m !== kit.state.mode) kit.setMode(st.m);
        if (st.p) Object.keys(st.p).forEach(function (id) { var pane = doc.getElementById('tab-' + id); if (pane) { var was = pane.hidden; applyPane(pane, st.p[id]); pane.hidden = was; } });
        if (st.l) Object.keys(st.l).forEach(function (id) { if (!!kit.state.layers[id] !== !!st.l[id]) kit.toggleLayer(id, !!st.l[id]); });
        if (st.w && kit.selectView) kit.selectView(st.w);
        if (st.s != null && kit.seekStage) kit.seekStage(st.s, false);
        if (st.tab && kit.selectTab) kit.selectTab(st.tab);
        kit.toast(t('Escenario compartido cargado', 'Shared scenario loaded'));
      } catch (e) { console.error(e); }
    }, 450);
  }
  function wrapSimKit() {
    if (!g.SimKit || g.SimKit.__aula) return;
    var orig = g.SimKit.create;
    g.SimKit.create = function (cfg) { try { prepCfg(cfg); } catch (e) { console.error(e); } var kit = orig.apply(this, arguments); try { attachKit(kit, cfg); } catch (e) { console.error(e); } return kit; };
    g.SimKit.__aula = true;
  }

  /* ---------- Lección de SimKit-lite: predice → observa → explica ---------- */
  function hookLite(api) {
    if (!api || !api.onStage || !api.slot || api.__aula) return;
    api.__aula = true; injectCSS();
    poeHost = h('div', { class: 'aula-card aula-poe', id: 'aulaPoe', 'aria-live': 'polite' }); poeHost.hidden = true; api.slot.appendChild(poeHost);
    function kit() { return { state: { playing: api.state.playing, mode: '' }, pause: api.pause, play: api.play }; }
    api.onStage(function (i) {
      try {
        var k = kit();
        if (poePending && poePending.i !== i) poeReveal(k);
        if (DATA.predict[i] && !poeDone[poeKey(i, k)] && k.state.playing) poeAsk(i, k);
      } catch (e) { console.error(e); }
    });
  }
  function wrapLite() { var SL = g.SimKitLite; if (!SL || SL.__aula) return; SL.__aula = true; if (SL.current) hookLite(SL.current); if (SL.hooks) SL.hooks.push(hookLite); }

  /* ---------- Simulaciones sin SimKit: botón flotante ---------- */
  function toast(msg) { var d = h('div', { role: 'status' }, esc(msg)); d.style.cssText = 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:9600;background:#111c;color:#fff;padding:8px 14px;border-radius:10px;font:14px system-ui,sans-serif;max-width:90vw'; doc.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400); }
  function soloControls() { return $$('input[type=range],input[type=checkbox],input[type=number],select').filter(function (x) { return !x.closest('.aula-sheet,.aula-menu,#aulaRep,#lang-switch') && x.id !== 'aulaPType'; }); }
  function soloVal(x) { return x.type === 'checkbox' ? (x.checked ? 1 : 0) : x.value; }
  var sheet = null;
  function openSheet(title, fill) {
    if (sheet) sheet.remove();
    sheet = h('section', { class: 'aula-sheet', role: 'dialog', 'aria-label': title });
    sheet.innerHTML = '<div class="aula-sheet-head"><b>' + title + '</b><button class="aula-btn" aria-label="' + t('Cerrar', 'Close') + '">✕</button></div>';
    sheet.querySelector('button').addEventListener('click', function () { sheet.remove(); sheet = null; });
    sheet.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { sheet.remove(); sheet = null; } });
    doc.body.appendChild(sheet); fill(sheet);
    var f = sheet.querySelector('input,button.aula-btn.pri,.aula-opts button'); if (f) f.focus();
  }
  var tourI = 0;
  function runTour(sh) {
    var steps = DATA.tour; tourI = Math.max(0, Math.min(tourI, steps.length - 1));
    var body = h('div'); sh.appendChild(body);
    function hl(sel) { $$('.aula-hl').forEach(function (e) { e.classList.remove('aula-hl'); }); if (!sel) return; var e = $(sel); if (e) { e.classList.add('aula-hl'); if (e.scrollIntoView) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
    function render() {
      var s = steps[tourI];
      body.innerHTML = '<div class="aula-kick">' + t('Paso', 'Step') + ' ' + (tourI + 1) + ' / ' + steps.length + '</div><ol class="aula-dots" aria-hidden="true">' + steps.map(function (x, j) { return '<li class="' + (j < tourI ? 'done' : j === tourI ? 'on' : '') + '"></li>'; }).join('') + '</ol><h3 style="margin:4px 0 6px;font-size:1rem">' + L(s.t) + '</h3><div class="aula-q">' + L(s.x) + '</div>' + (s.q ? '<p class="aula-q"><b>' + L(s.q) + '</b></p>' : '') +
        (s.ask ? '<div class="aula-opts">' + Lo(s.ask.options).map(function (o, j) { return '<button class="aula-btn" data-j="' + j + '">' + o + '</button>'; }).join('') + '</div><div class="aula-out" aria-live="polite"></div>' : '') +
        '<div class="aula-row"><button class="aula-btn" id="aulaTPrev"' + (tourI ? '' : ' disabled') + '>← ' + t('Anterior', 'Back') + '</button><button class="aula-btn pri" id="aulaTNext">' + (tourI + 1 < steps.length ? t('Siguiente', 'Next') + ' →' : t('Terminar', 'Finish')) + '</button></div>';
      try { if (s.go) s.go(); } catch (e) { console.error(e); }
      setTimeout(function () { hl(s.sel); }, 120);
      if (s.ask) $$('.aula-opts .aula-btn', body).forEach(function (b) { b.addEventListener('click', function () { var j = +b.dataset.j, ok = j === s.ask.answer; $$('.aula-opts .aula-btn', body).forEach(function (x) { x.disabled = true; if (+x.dataset.j === s.ask.answer) x.classList.add('right'); }); if (!ok) b.classList.add('wrong'); body.querySelector('.aula-out').innerHTML = '<div class="aula-fb ' + (ok ? 'ok' : 'no') + '">' + L(s.ask.why) + '</div>'; log('tour', stripTags(L(s.t)) + ': ' + stripTags(Lo(s.ask.options)[j]), ok); }); });
      body.querySelector('#aulaTPrev').addEventListener('click', function () { tourI--; render(); });
      body.querySelector('#aulaTNext').addEventListener('click', function () { if (tourI + 1 < steps.length) { tourI++; render(); } else { hl(null); log('tour', t('Recorrido completado', 'Tour completed'), null); tourI = 0; if (sheet) { sheet.remove(); sheet = null; } toast(t('Recorrido completado', 'Tour completed')); } });
    }
    render();
  }
  function attachSolo() {
    if (attached || doc.body.classList.contains('embed') || /[?&]embed=1/.test(location.search)) return;
    attached = true; injectCSS(); loadCurriculo(); doc.documentElement.classList.add('aula-solo');
    if (store.get('aula:proj', false)) setProj(true);
    var base = soloControls().map(soloVal);
    // El botón va en la barra de herramientas de la página si existe (Mecanismos: .top-actions; SimKit-lite: .sk-bar);
    // si no, como botón flotante.
    var ttl = t('Aula: práctica, recorrido, enlace, informe, proyector', 'Classroom: practice, tour, link, report, projector'), fab;
    var top = $('.top-actions'), sk = $('#sk-help');
    if (top) { fab = h('button', { class: 'icon-btn', id: 'kAulaSolo', type: 'button', title: ttl, 'aria-label': t('Herramientas de aula', 'Classroom tools'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON.cap + '</svg>'); top.insertBefore(fab, $('#btnHelp', top) || null); }
    else if (sk) { fab = h('button', { class: 'sk-btn', id: 'sk-aula', type: 'button', title: ttl, 'aria-label': t('Herramientas de aula', 'Classroom tools'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON.cap + '</svg>'); sk.parentNode.insertBefore(fab, sk); }
    else { fab = h('button', { class: 'aula-fab', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', title: ttl }, '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON.cap + '</svg>' + t('Aula', 'Class')); doc.body.appendChild(fab); }
    function capture() { var st = { v: 1, f: {} }; soloControls().forEach(function (x, i) { var v = soloVal(x); if (v !== base[i]) st.f[i] = v; }); return st; }
    function share() { copyText(shareURL(capture()), t('Enlace copiado: al abrirlo se recupera este escenario', 'Link copied: opening it restores this scenario'), toast); }
    fab.addEventListener('click', function () {
      openMenu(fab, commonItems({ toast: toast, share: share, report: function () { openReport(null, null, shareURL(capture())); },
        practice: DATA.problems.length ? function () { openSheet(t('Práctica', 'Practice'), function (s) { buildPractice(s, { bare: true }); }); } : null,
        quiz: DATA.quiz.length ? function () { openSheet(t('Desafío', 'Challenge'), buildQuiz); } : null,
        tour: DATA.tour.length ? function () { openSheet(t('Recorrido guiado', 'Guided tour'), runTour); } : null }));
    });
    var st = readShared();
    if (st && st.f) setTimeout(function () {
      var cs = soloControls(); Object.keys(st.f).forEach(function (i) { var x = cs[+i]; if (!x) return; if (x.type === 'checkbox') { if ((x.checked ? 1 : 0) !== st.f[i]) x.click(); } else { x.value = st.f[i]; x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true })); } });
      toast(t('Escenario compartido cargado', 'Shared scenario loaded'));
    }, 600);
  }

  /* Ayudas para los recorridos guiados: cambiar de pestaña, fijar un control o pulsar un botón por id */
  var DOM = {
    tab: function (name) { var b = $('[data-tab="' + name + '"]'); if (b) b.click(); },
    set: function (id, v) {
      var e = doc.getElementById(id); if (!e) return false;
      if (e.type === 'checkbox') { if (e.checked !== !!v) e.click(); return true; }
      if (e.tagName === 'SELECT' && ![].some.call(e.options, function (o) { return o.value === String(v); })) return false;
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true;
    },
    click: function (id) { var e = doc.getElementById(id); if (e) e.click(); }
  };

  g.SimAula = { __v: 1, register: register, data: DATA, helpers: H, dom: DOM, routes: ROUTES, titles: TITLES, sim: SIM, log: log, practice: buildPractice };
  wrapSimKit(); wrapLite();
  if (doc.readyState === 'complete') setTimeout(function () { wrapSimKit(); wrapLite(); if (!attached) attachSolo(); }, 600);
  else g.addEventListener('load', function () { wrapLite(); setTimeout(function () { if (!attached) attachSolo(); }, 600); });
})(window);
