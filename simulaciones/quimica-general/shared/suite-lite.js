/* Lección guiada, captura, pantalla completa y ayuda para los módulos de la suite.
   Se carga al final de cada módulo y elige su guion según <body data-module>. Requiere ../../_kit/simkit-lite.js */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function tab(id) { var t = document.querySelector('[data-tab="' + id + '"]'); if (t) t.click(); }
  function sel(id, v) { var e = $(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event('change', { bubbles: true })); }
  function rng(id, v) { var e = $(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }
  function clk(id) { var e = $(id); if (e) e.click(); }
  function chk(id, on) { var e = $(id); if (e && e.checked !== on) e.click(); }
  function F(s) { return s; }

  var M = document.body.getAttribute('data-module');
  var CFG = {};

  CFG['atomlab'] = {
    title: 'AtomLab', theme: 'theme', before: function () { tab('experimentos'); },
    stages: [
      { name: 'Dalton', title: 'Cada modelo nace de una evidencia', focus: '#timeline',
        text: '<p>La línea de tiempo recorre los modelos atómicos. Cada uno se presenta con la <b>evidencia</b> que lo motivó, lo que <b>explicó</b> y lo que <b>dejó abierto</b>.</p>',
        apply: function () { tab('historia'); showEvent(0); } },
      { name: 'Cuántico', title: 'Hasta la descripción cuántica', focus: '.modelview',
        text: '<p>El último hito de la línea de tiempo es el modelo cuántico, en que los electrones se describen por nubes de probabilidad en vez de órbitas.</p>',
        apply: function () { tab('historia'); showEvent(EVENTS.length - 1); } },
      { name: 'Thomson', title: 'Rayos catódicos: el electrón', focus: '#expCanvas',
        text: '<p>Un campo eléctrico o magnético desvía el haz: las partículas tienen <b>carga negativa</b> y la misma relación carga/masa sea cual sea el gas.</p>',
        apply: function () { tab('experimentos'); sel('expSelect', 'thomson'); clk('runExp'); } },
      { name: 'Millikan', title: 'Gota de aceite: la carga está cuantizada', focus: '#expCanvas',
        text: '<p>La carga de las gotas siempre es múltiplo entero de <b>e</b>. Mueve el control experimental y observa cómo cambia la velocidad de caída.</p>',
        apply: function () { tab('experimentos'); sel('expSelect', 'millikan'); clk('runExp'); } },
      { name: 'Rutherford', title: 'Dispersión alfa: el núcleo', focus: '#expCanvas',
        text: '<p>Casi todas las partículas α atraviesan la lámina, pero unas pocas rebotan hacia atrás: la carga positiva está concentrada en un <b>núcleo</b> diminuto.</p>',
        apply: function () { tab('experimentos'); sel('expSelect', 'rutherford'); clk('runExp'); } },
      { name: 'Bohr', title: 'Espectro del hidrógeno y niveles', focus: '#expCanvas',
        text: '<p>Las líneas del espectro se explican con <b>saltos entre niveles</b> de energía: cada línea corresponde a una diferencia de energía fija.</p>',
        apply: function () { tab('experimentos'); sel('expSelect', 'bohr'); clk('runExp'); } },
      { name: 'Davisson–Germer', title: 'Los electrones se difractan', focus: '#expCanvas',
        text: '<p>Los electrones muestran difracción: se comportan como <b>ondas</b>, lo que abre la puerta al modelo cuántico (de Broglie).</p>',
        apply: function () { tab('experimentos'); sel('expSelect', 'davisson'); clk('runExp'); } },
      { name: 'Compara', title: 'Qué cambia y qué permanece', focus: '#compareGrid',
        text: '<p>Compara los modelos lado a lado: qué objeto cambia (núcleo, electrón) y qué idea se conserva (la materia es discreta).</p>',
        apply: function () { tab('compara'); } },
      { name: 'Tu turno', title: 'Predice antes de observar', focus: '#quiz',
        text: '<p>Elige tus respuestas y pulsa <b>Revisar</b>. Predecir antes de ver el resultado es la mejor forma de detectar ideas previas.</p>',
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: 'Recorre la línea de tiempo, ejecuta los cinco experimentos históricos con su control, compara los modelos y resuelve el desafío.', items: [['Experimenta', 'cinco experimentos con control deslizante y botón Ejecutar.'], ['Historia', 'cada hito con evidencia, explicación y límites.']] }
  };

  CFG['configuracion-electronica'] = {
    title: 'Configuración electrónica', theme: 'themeToggle', noSnap: true,
    stages: [
      { name: 'Carbono', title: 'Una configuración, tres lenguajes', focus: '#configurar',
        text: '<p>Para el <b>carbono</b> (Z = 6) tienes la notación completa, la reducida y el diagrama orbital: tres formas de decir lo mismo. Fíjate en los dos electrones desapareados (regla de Hund).</p>',
        apply: function () { tab('configurar'); selectElement(6); } },
      { name: 'Hierro', title: 'Metales de transición: 4s antes que 3d', focus: '#orbitalDiagram',
        text: '<p>En el <b>hierro</b> (Z = 26) el 4s se llena antes que el 3d. Observa cuántos electrones quedan desapareados: explican su comportamiento magnético.</p>',
        apply: function () { tab('configurar'); selectElement(26); } },
      { name: 'Excepción', title: 'El cromo no sigue el esquema simple', focus: '#exceptionNote',
        text: '<p>El <b>cromo</b> (Z = 24) adopta 3d⁵4s¹ y no 3d⁴4s²: la semillenura del subnivel d es energéticamente favorable.</p>',
        apply: function () { tab('configurar'); selectElement(24); } },
      { name: 'Aufbau', title: 'Llenado paso a paso', focus: '#paso',
        text: '<p>Cada paso agrega electrones siguiendo el orden de Aufbau. Observa la regla que se aplica (Aufbau, Pauli o Hund) en cada subnivel.</p>',
        apply: function () { tab('paso'); rng('stepRange', 3); } },
      { name: 'Iones', title: 'Iones: salen primero los de mayor n', focus: '#iones',
        text: '<p>Al formar <b>Fe³⁺</b> se retiran primero los electrones 4s y luego 3d; por eso el ion queda 3d⁵ (semilleno).</p>',
        apply: function () { tab('iones'); sel('ionElement', 26); sel('ionCharge', 3); clk('ionApply'); } },
      { name: 'Reglas', title: 'Tres reglas para los diagramas', focus: '#reglas',
        text: '<p>Aufbau (menor energía primero), principio de exclusión de Pauli y regla de Hund (un electrón en cada orbital antes de aparear).</p>',
        apply: function () { tab('reglas'); } },
      { name: 'Tu turno', title: 'Desafío de configuración', focus: '#quiz',
        text: '<p>Responde preguntas aleatorias sobre notación, electrones desapareados y bloques.</p>',
        apply: function () { tab('quiz'); } }
    ],
    help: { intro: 'Elige un elemento por lista, búsqueda o tabla mini; revisa el llenado paso a paso, los iones y las reglas.', items: [['Tabla mini', 'clic en un elemento para cargarlo.'], ['Iones', 'elige elemento y carga para ver qué electrones salen primero.']] }
  };

  CFG['propiedades-periodicas'] = {
    title: 'Propiedades periódicas', theme: 'themeToggle',
    before: function () { tab('graficar'); clk('drawChart'); },
    stages: [
      { name: 'Electronegatividad', title: 'Una propiedad pintada sobre la tabla', focus: '#explorar',
        text: '<p>El color indica el valor de la propiedad. La <b>electronegatividad</b> crece hacia arriba y hacia la derecha: haz clic en un elemento para ver sus datos y las flechas de tendencia.</p>',
        apply: function () { tab('explorar'); sel('propertySelect', 'electronegativityPauling'); } },
      { name: 'Ionización', title: 'Energía de ionización', focus: '#periodicTable',
        text: '<p>Se necesita más energía para arrancar un electrón a medida que avanzas en el período, porque la carga nuclear efectiva aumenta.</p>',
        apply: function () { tab('explorar'); sel('propertySelect', 'ionizationEnergyKJ'); } },
      { name: 'Radios', title: 'Radio atómico: la tendencia inversa', focus: '#periodicTable',
        text: '<p>El radio disminuye a lo largo del período (más carga nuclear, mismo nivel) y aumenta al bajar en el grupo (más niveles).</p>',
        apply: function () { tab('explorar'); sel('propertySelect', 'atomicRadiusModelPm'); } },
      { name: 'Comparar', title: 'Sodio frente a cloro', focus: '#comparar',
        text: '<p>Dos elementos del mismo período: el cloro tiene mucha mayor electronegatividad y afinidad electrónica. Cambia la propiedad para contrastar.</p>',
        apply: function () { tab('comparar'); sel('compareA', 11); sel('compareB', 17); sel('compareProperty', 'electronegativityPauling'); clk('compareButton'); } },
      { name: 'Gráfico', title: 'Periodicidad frente a número atómico', focus: '#graficar',
        text: '<p>Los picos corresponden a los gases nobles y los mínimos a los alcalinos: la propiedad se repite con el período.</p>',
        apply: function () { tab('graficar'); sel('chartProperty', 'ionizationEnergyKJ'); clk('drawChart'); } },
      { name: 'Tu turno', title: 'Desafío de tendencias', focus: '#desafio',
        text: '<p>Decide qué elemento tiene mayor valor de la propiedad indicada y comprueba si tu razonamiento coincide con la tendencia.</p>',
        apply: function () { tab('desafio'); } },
      { name: 'Conceptos', title: 'Carga nuclear, apantallamiento y distancia', focus: '#conceptos',
        text: '<p>Todas las tendencias salen de la competencia entre carga nuclear efectiva, apantallamiento y distancia electrónica.</p>',
        apply: function () { tab('conceptos'); } }
    ],
    help: { intro: 'Elige una propiedad, filtra por bloque o busca un elemento. Compara dos elementos y grafica la propiedad entre dos números atómicos.', items: [['Índices “modelo”', 'son comparativos, no valores experimentales.'], ['Gráfico', 'elige propiedad y rango de Z.']] }
  };

  CFG['lewislab'] = {
    title: 'LewisLab', theme: 'theme', before: function () { tab('moleculas'); },
    stages: [
      { name: 'Átomos', title: 'Símbolos de Lewis', focus: '#atomos',
        text: '<p>El símbolo de Lewis representa los <b>electrones de valencia</b>: primero un electrón por lado y luego se aparean.</p>',
        apply: function () { tab('atomos'); } },
      { name: 'Agua', title: 'Construcción guiada: H₂O', focus: '#moleculas',
        text: '<p>Cuenta electrones, elige el átomo central y completa octetos. Avanza con <b>Siguiente</b>. El O queda con dos pares libres.</p>',
        apply: function () { tab('moleculas'); selectMol('H2O'); clk('nextStep'); } },
      { name: 'Cargas formales', title: 'Cargas formales en vivo', focus: '#molSvg',
        text: '<p>La <b>carga formal</b> mide cuánto se aleja cada átomo de su cuenta de valencia. En CO₂ con dobles enlaces todas son cero: es la mejor estructura.</p>',
        apply: function () { tab('moleculas'); selectMol('CO2'); var b = $('fcToggle'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); } },
      { name: 'Polaridad', title: 'Polaridad de enlaces', focus: '#molSvg',
        text: '<p>La diferencia de electronegatividad hace polar al enlace. Aquí se muestra en agua; compara con CO₂, donde los dipolos se cancelan por geometría.</p>',
        apply: function () { tab('moleculas'); selectMol('H2O'); var b = $('polToggle'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); } },
      { name: 'Construye', title: 'Constrúyela tú', focus: '#construir',
        text: '<p>Ajusta los órdenes de enlace y pulsa <b>Comprobar</b>: el verificador revisa el patrón de enlaces del contribuyente.</p>',
        apply: function () { tab('construir'); } },
      { name: 'Resonancia', title: 'Resonancia: estructura deslocalizada', focus: '#resonancia',
        text: '<p>En el <b>ozono</b> hay dos contribuyentes equivalentes. La molécula real no alterna entre ellos: es un híbrido con enlaces de igual longitud.</p>',
        apply: function () { tab('resonancia'); sel('resSelect', 'O3'); } },
      { name: 'Excepciones', title: 'Excepciones al octeto', focus: '#exceptionGrid',
        text: '<p>Radicales (NO₂), octetos incompletos (BF₃) y especies hipervalentes (PCl₅) no cumplen la regla simple del octeto.</p>',
        apply: function () { tab('excepciones'); } },
      { name: 'Tu turno', title: 'Mini‑desafío', focus: '#desafio',
        text: '<p>Responde y pulsa <b>Revisar</b>. Piensa en cargas formales antes de elegir la estructura más estable.</p>',
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: 'Elige moléculas, avanza por la construcción y activa las capas de cargas formales y polaridad. Practica en «Construir» y «Desafíos».', items: [['Cargas formales', 'botón en la barra de la estructura.'], ['Resonancia', 'alterna entre contribuyentes con los botones.']] }
  };

  CFG['geomol'] = {
    title: 'GeoMol', theme: 'theme', before: function () { tab('explora'); },
    stages: [
      { name: 'Agua', title: 'AX₂E₂: forma angular', focus: '#explora',
        text: '<p>Cuatro dominios electrónicos (tetraédrico) pero solo dos átomos enlazados: la forma es <b>angular</b> y los pares libres comprimen el ángulo H–O–H.</p>',
        apply: function () { tab('explora'); sel('molSelect', 'H2O'); chk('loneToggle', true); chk('dipoleToggle', true); } },
      { name: 'Metano', title: 'AX₄: tetraedro perfecto', focus: '#explora',
        text: '<p>Cuatro enlaces idénticos, ningún par libre: ángulos de 109,5° y dipolos que se cancelan, molécula <b>apolar</b>.</p>',
        apply: function () { tab('explora'); sel('molSelect', 'CH4'); } },
      { name: 'Bipirámide', title: 'AX₅ y AX₄E: más allá del octeto', focus: '#explora',
        text: '<p>En la bipirámide trigonal hay posiciones axiales y ecuatoriales distintas. Los pares libres prefieren las ecuatoriales (SF₄, forma de balancín).</p>',
        apply: function () { tab('explora'); sel('molSelect', 'SF4'); } },
      { name: 'Octaedro', title: 'AX₆ y AX₄E₂', focus: '#explora',
        text: '<p>En el octaedro los pares libres se colocan en posiciones opuestas: <b>XeF₄</b> es plano cuadrado y apolar.</p>',
        apply: function () { tab('explora'); sel('molSelect', 'XeF4'); } },
      { name: 'Constructor', title: 'Construye cualquier AXₙEₘ', focus: '#construye',
        text: '<p>Cambia los átomos enlazados y los pares libres: se actualizan geometrías, ángulos e hibridación.</p>',
        apply: function () { tab('construye'); rng('xRange', 3); rng('eRange', 1); } },
      { name: 'Polaridad', title: 'Suma vectorial de dipolos', focus: '#polaridad',
        text: '<p>CO₂ tiene enlaces polares pero dipolos opuestos que se anulan: es apolar. Cambia de molécula para comparar.</p>',
        apply: function () { tab('polaridad'); sel('polSelect', 'CO2'); } },
      { name: 'Compara', title: 'Familias geométricas', focus: '#compareGrid',
        text: '<p>Comparación de las geometrías por número de dominios y de pares libres.</p>',
        apply: function () { tab('compara'); } },
      { name: 'Tu turno', title: 'Mini‑desafío', focus: '#desafio',
        text: '<p>Predice la geometría antes de revisar: cuenta dominios, resta pares libres y decide la forma.</p>',
        apply: function () { tab('desafio'); } }
    ],
    help: { intro: 'Arrastra la molécula para rotarla en 3D. Activa o desactiva pares libres y dipolos. Exporta la imagen con el botón de captura.', items: [['Modo práctica', 'oculta la respuesta para que predigas.'], ['Constructor', 'cualquier AXₙEₘ con X entre 2 y 6.']] }
  };

  CFG['sigma-pi'] = {
    title: 'Enlaces σ y π', theme: 'themeToggle', before: function () { tab('simulador'); },
    stages: [
      { name: 'Simple', title: 'C–C: un enlace sigma', focus: '#simulador',
        text: '<p>El enlace simple es un solo enlace <b>σ</b> (sp³): permite girar libremente alrededor del eje.</p>',
        apply: function () { tab('simulador'); sel('bondSelect', 'single'); } },
      { name: 'Doble', title: 'C=C: σ + π', focus: '#simulador',
        text: '<p>El doble enlace añade un enlace <b>π</b> por solapamiento lateral de orbitales p: la rotación rompería ese solapamiento, por eso existen isómeros cis/trans.</p>',
        apply: function () { tab('simulador'); sel('bondSelect', 'double'); chk('orbitalToggle', true); } },
      { name: 'Rotación', title: 'Girar rompe el enlace π', focus: '#bondCanvas',
        text: '<p>Pulsa <b>Rotar</b>: a medida que se tuerce el enlace, el solapamiento π disminuye y la energía sube hasta un máximo a 90°.</p>',
        apply: function () { tab('simulador'); sel('bondSelect', 'double'); clk('rotateButton'); } },
      { name: 'Triple', title: 'C≡C: σ + 2π', focus: '#simulador',
        text: '<p>El triple enlace tiene un σ y dos π perpendiculares (sp): la molécula es lineal.</p>',
        apply: function () { tab('simulador'); sel('bondSelect', 'triple'); } },
      { name: 'Benceno', title: 'Aromático: π deslocalizado', focus: '#simulador',
        text: '<p>En el benceno los seis electrones π se reparten sobre todo el anillo, por encima y por debajo del plano.</p>',
        apply: function () { tab('simulador'); sel('bondSelect', 'benzene'); } },
      { name: 'Compara', title: 'Tabla comparativa', focus: '#comparar',
        text: '<p>Número de enlaces σ y π, hibridación, geometría y posibilidad de rotación para cada tipo de enlace.</p>',
        apply: function () { tab('comparar'); } },
      { name: 'Aprende', title: 'Origen de σ y π', focus: '#aprender',
        text: '<p>σ: solapamiento frontal, simetría cilíndrica. π: solapamiento lateral, con un plano nodal que contiene el eje.</p>',
        apply: function () { tab('aprender'); } },
      { name: 'Tu turno', title: 'Mini‑quiz', focus: '#quiz',
        text: '<p>Contesta y pulsa <b>Revisar</b>.</p>',
        apply: function () { tab('quiz'); } }
    ],
    help: { intro: 'Elige el tipo de enlace, activa los orbitales y pulsa Rotar para ver la energía de torsión.', items: [['Orbitales', 'muestra lóbulos σ y π.'], ['Rotar', 'torsión del enlace y gráfico de energía.']] }
  };

  var c = CFG[M]; if (!c || !window.SimKitLite) return;
  function findVisual() {
    var p = document.querySelector('.panel.active,.tab-panel.active') || document.body, best = null, area = 0;
    p.querySelectorAll('canvas,svg').forEach(function (e) {
      var r = e.getBoundingClientRect(); var a = r.width * r.height;
      if (r.width > 120 && r.height > 120 && a > area && !e.closest('.sk-root')) { best = e; area = a; }
    });
    return best;
  }
  function snapshotTarget() {
    var t = findVisual();
    if (!t && c.before) { c.before(); t = findVisual(); }   // si la pestaña activa no tiene imagen, ir a la que sí
    return t;
  }
  SimKitLite.attach({
    key: M, title: c.title, home: '../../',
    stages: c.stages, help: c.help,
    themeToggle: c.theme ? function () { clk(c.theme); } : null,
    snapshot: c.noSnap ? false : snapshotTarget
  });
})();
