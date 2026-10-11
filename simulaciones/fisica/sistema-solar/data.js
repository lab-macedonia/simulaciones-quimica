/* Sistema Solar 3D — datos de las fichas · Laboratorio MACEDONIA (UMCE)
   Elementos orbitales aproximados a la época J2000. Cifras redondeadas de NASA/JPL y UAI. */
(function (g) {
  'use strict';
  var D = g.SolarData = {};
  D.GROUPS = { est: 'Estrella', roc: 'Planetas rocosos', gas: 'Gigantes gaseosos', hel: 'Gigantes helados', ena: 'Planeta enano', sat: 'Satélites', peq: 'Cinturones de cuerpos menores' };
  D.ORDER = ['est', 'roc', 'gas', 'hel', 'ena', 'sat', 'peq'];
  D.GCOL = { est: '#ffcf5a', roc: '#e0925c', gas: '#d9b48a', hel: '#6fc6e6', ena: '#c9a98c', sat: '#b8c2cc', peq: '#9aa8b8' };
  D.IDS = ['sol', 'mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton', 'luna', 'io', 'europa', 'ganimedes', 'calisto', 'titan', 'triton', 'caronte', 'asteroides', 'kuiper'];
  var B = D.B = {};

  B.sol = { n: 'Sol', grp: 'est', col: '#ffcf5a', type: 'Estrella · enana amarilla (G2V)', Rd: 3.4, rkm: 695700, rot: 609, obl: 7.25, g: 274, ve: 617.5, tex: 'sol',
    h: 'Es la estrella en el centro; contiene el 99,86 % de la masa.',
    st: [['Diámetro', '1 392 700 km (109 × Tierra)'], ['Masa', '1,99×10³⁰ kg (333 000 M⊕)'], ['Gravedad superficial', '274 m/s² (28 g)'], ['Temperatura superficial', '≈ 5 500 °C'], ['Temperatura del núcleo', '≈ 15 millones de °C'], ['Rotación', '≈ 25 d (ecuador) a 35 d (polos)'], ['Edad', '≈ 4 600 millones de años'], ['Luminosidad', '3,8×10²⁶ W']],
    d: 'Estrella enana amarilla de tipo espectral G2V. Concentra el 99,86 % de la masa del Sistema Solar, por lo que su gravedad gobierna el movimiento de todos los demás cuerpos.',
    xl: 'Composición', x: '≈ 73 % de hidrógeno y ≈ 25 % de helio (en masa), con trazas de oxígeno, carbono, neón y hierro. En el núcleo el hidrógeno se fusiona en helio y libera energía.',
    e: 'Observado por SOHO, SDO, Solar Orbiter y la sonda Parker, que se ha acercado a unos 6 millones de km de su superficie.',
    c: 'Cada segundo convierte unos 4 millones de toneladas de materia en energía. Su luz tarda 8 min 20 s en llegar a la Tierra, pero la energía generada en el núcleo demora decenas de miles de años en salir.' };

  B.mercurio = { n: 'Mercurio', grp: 'roc', col: '#b9b0a6', type: 'Planeta rocoso', a: 0.3871, ec: 0.2056, i: 7.00, om: 48.33, vp: 77.46, L: 252.25, T: 87.97, Rd: 0.4, rkm: 2440, rot: 1407.6, obl: 0.03, g: 3.7, ve: 4.25, tex: 'mercurio',
    h: 'El más cercano al Sol y el más pequeño.',
    st: [['Diámetro', '4 879 km (0,38 × Tierra)'], ['Masa', '3,30×10²³ kg (0,055 M⊕)'], ['Gravedad', '3,7 m/s²'], ['Distancia al Sol', '0,387 UA · 57,9 M km'], ['Año (traslación)', '88 días'], ['Día (rotación)', '58,6 d (día solar: 176 d)'], ['Inclinación del eje', '0,03°'], ['Excentricidad', '0,206'], ['Temperatura', '−180 a 430 °C'], ['Satélites', '0'], ['Velocidad orbital', '47,4 km/s'], ['Densidad', '5,43 g/cm³']],
    d: 'El planeta más pequeño y el más cercano al Sol. Su superficie, cubierta de cráteres, recuerda a la de la Luna. Tiene un núcleo de hierro enorme, que ocupa cerca del 85 % de su radio.',
    xl: 'Atmósfera', x: 'Casi inexistente: solo una exosfera tenue de sodio, oxígeno, hidrógeno y helio. Sin atmósfera que reparta el calor, el día es abrasador y la noche, helada.',
    e: 'Mariner 10 (1974–75), MESSENGER (en órbita 2011–2015) y BepiColombo (ESA/JAXA), que llega a su órbita hacia fines de 2026.',
    c: 'Por su lenta rotación y su órbita excéntrica, desde algunos puntos de su superficie el Sol sale, se detiene, retrocede y vuelve a avanzar. Aun así, hay hielo de agua en cráteres polares que están siempre en sombra.' };

  B.venus = { n: 'Venus', grp: 'roc', col: '#e8c685', type: 'Planeta rocoso', a: 0.7233, ec: 0.0068, i: 3.39, om: 76.68, vp: 131.53, L: 181.98, T: 224.70, Rd: 0.62, rkm: 6052, rot: 5832.5, obl: 177.36, g: 8.87, ve: 10.36, tex: 'venus', atm: ['#f3c97a', 2.4],
    h: 'Muy caliente, con atmósfera densa de CO₂ y rotación retrógrada.',
    st: [['Diámetro', '12 104 km (0,95 × Tierra)'], ['Masa', '4,87×10²⁴ kg (0,82 M⊕)'], ['Gravedad', '8,87 m/s²'], ['Distancia al Sol', '0,723 UA · 108,2 M km'], ['Año (traslación)', '224,7 días'], ['Día (rotación)', '243 d, retrógrada (día solar: 117 d)'], ['Inclinación del eje', '177,4°'], ['Excentricidad', '0,007'], ['Temperatura', '465 °C (superficie)'], ['Satélites', '0'], ['Velocidad orbital', '35,0 km/s'], ['Densidad', '5,24 g/cm³']],
    d: 'Casi un gemelo de la Tierra en tamaño y masa, pero con un ambiente infernal. Gira en sentido contrario a la mayoría de los planetas (rotación retrógrada) y su día sideral dura más que su año.',
    xl: 'Atmósfera', x: '≈ 96,5 % de CO₂ y ≈ 3,5 % de N₂, con nubes de ácido sulfúrico. La presión en superficie es unas 92 veces la terrestre. El efecto invernadero la hace más caliente que Mercurio.',
    e: 'Misiones Venera (URSS): Venera 7 (1970) fue la primera sonda en transmitir desde la superficie de otro planeta. Magallanes (NASA) mapeó el planeta con radar en 1990–94 y Akatsuki (JAXA) estudió su atmósfera.',
    c: 'Es el astro más brillante del cielo después de la Luna y se le llama «lucero del alba» o «de la tarde». Un día sideral (243 d) dura más que un año (225 d).' };

  B.tierra = { n: 'Tierra', grp: 'roc', col: '#4f9be8', type: 'Planeta rocoso', a: 1.0000, ec: 0.0167, i: 0, om: 0, vp: 102.94, L: 100.46, T: 365.256, Rd: 0.64, rkm: 6371, rot: 23.934, obl: 23.44, g: 9.81, ve: 11.19, tex: 'tierra', clouds: true, atm: ['#5aa8ff', 2.6],
    h: 'El único planeta con vida conocida y agua líquida en superficie.',
    st: [['Diámetro', '12 742 km'], ['Masa', '5,97×10²⁴ kg (1 M⊕)'], ['Gravedad', '9,81 m/s²'], ['Distancia al Sol', '1 UA · 149,6 M km'], ['Año (traslación)', '365,25 días'], ['Día (rotación)', '23 h 56 min (día solar: 24 h)'], ['Inclinación del eje', '23,4°'], ['Excentricidad', '0,017'], ['Temperatura', '15 °C media (−89 a 58 °C)'], ['Satélites', '1 (la Luna)'], ['Velocidad orbital', '29,8 km/s'], ['Densidad', '5,51 g/cm³']],
    d: 'El único lugar conocido con vida. Es el planeta rocoso más grande y denso del Sistema Solar, con ≈ 71 % de su superficie cubierta por agua líquida y un campo magnético que desvía el viento solar.',
    xl: 'Atmósfera', x: '≈ 78 % N₂, ≈ 21 % O₂ y ≈ 0,9 % argón, con vapor de agua y CO₂ variables. La capa de ozono filtra gran parte de la radiación ultravioleta.',
    e: 'Es el planeta mejor estudiado: satélites de observación (Landsat, Sentinel), la Estación Espacial Internacional y redes de sensores en tierra, mar y aire.',
    c: 'Las estaciones se deben a la inclinación del eje (23,4°) y no a la distancia al Sol: la Tierra pasa más cerca del Sol (perihelio) en enero que en julio.' };

  B.marte = { n: 'Marte', grp: 'roc', col: '#d1623a', type: 'Planeta rocoso', a: 1.5237, ec: 0.0934, i: 1.85, om: 49.56, vp: 336.04, L: 355.45, T: 686.98, Rd: 0.46, rkm: 3390, rot: 24.623, obl: 25.19, g: 3.71, ve: 5.03, tex: 'marte', atm: ['#e0916c', 3.4],
    h: 'El planeta rojo, con el volcán más alto conocido.',
    st: [['Diámetro', '6 779 km (0,53 × Tierra)'], ['Masa', '6,42×10²³ kg (0,107 M⊕)'], ['Gravedad', '3,71 m/s²'], ['Distancia al Sol', '1,524 UA · 227,9 M km'], ['Año (traslación)', '687 días'], ['Día (rotación)', '24 h 37 min'], ['Inclinación del eje', '25,2°'], ['Excentricidad', '0,093'], ['Temperatura', '−63 °C media (−125 a 20 °C)'], ['Satélites', '2 (Fobos y Deimos)'], ['Velocidad orbital', '24,1 km/s'], ['Densidad', '3,93 g/cm³']],
    d: 'El «planeta rojo»: su color viene del óxido de hierro del polvo. Tiene el volcán más alto del Sistema Solar (Olympus Mons, ≈ 22 km), un cañón de unos 4 000 km (Valles Marineris) y casquetes polares de hielo de agua y CO₂.',
    xl: 'Atmósfera', x: 'Muy tenue: ≈ 95 % CO₂, ≈ 2,8 % N₂ y ≈ 1,9 % argón, con una presión de ≈ 0,6 % de la terrestre.',
    e: 'Es el planeta más explorado después de la Tierra: Viking, Pathfinder, Spirit, Opportunity, Curiosity y Perseverance (que busca señales de vida antigua en el cráter Jezero), con el helicóptero Ingenuity.',
    c: 'Hay evidencia de que hace miles de millones de años tuvo ríos y lagos de agua líquida. Un día marciano dura unos 40 minutos más que uno terrestre.' };

  B.jupiter = { n: 'Júpiter', grp: 'gas', col: '#d9b48a', type: 'Gigante gaseoso', a: 5.2026, ec: 0.0489, i: 1.30, om: 100.47, vp: 14.75, L: 34.40, T: 4332.59, Rd: 2.2, rkm: 69911, rot: 9.925, obl: 3.13, g: 24.8, ve: 59.5, tex: 'jupiter', atm: ['#e8c9a0', 4],
    h: 'El más grande de todos los planetas.',
    st: [['Diámetro', '139 820 km (11,2 × Tierra)'], ['Masa', '1,90×10²⁷ kg (318 M⊕)'], ['Gravedad', '24,8 m/s²'], ['Distancia al Sol', '5,20 UA · 778 M km'], ['Año (traslación)', '11,86 años'], ['Día (rotación)', '9 h 56 min'], ['Inclinación del eje', '3,1°'], ['Excentricidad', '0,049'], ['Temperatura', '−108 °C (nivel de 1 bar)'], ['Satélites', 'Más de 95 conocidos'], ['Velocidad orbital', '13,1 km/s'], ['Densidad', '1,33 g/cm³']],
    d: 'El gigante gaseoso: tiene más del doble de la masa de todos los demás planetas juntos. Su rotación rapidísima lo achata y organiza sus nubes en bandas. La Gran Mancha Roja es una tormenta anticiclónica más ancha que la Tierra, observada desde hace más de 150 años.',
    xl: 'Atmósfera', x: '≈ 90 % H₂ y ≈ 10 % He, con amoníaco, metano y vapor de agua. No tiene superficie sólida: bajo las nubes, la presión convierte el hidrógeno en líquido y luego en metálico.',
    e: 'Pioneer, Voyager, Galileo (1995–2003), Juno (llegó en 2016) y Europa Clipper (lanzada en 2024, llegará en 2030).',
    c: 'Irradia más calor del que recibe del Sol: aún libera energía de su formación. Tiene el campo magnético más intenso de los planetas.' };

  B.saturno = { n: 'Saturno', grp: 'gas', col: '#e6cf9a', type: 'Gigante gaseoso', a: 9.5549, ec: 0.0565, i: 2.49, om: 113.66, vp: 92.43, L: 49.94, T: 10759.22, Rd: 1.9, rkm: 58232, rot: 10.7, obl: 26.73, g: 10.4, ve: 35.5, tex: 'saturno', ring: 'saturno', atm: ['#efdcae', 3.6],
    h: 'El de los anillos, menos denso que el agua.',
    st: [['Diámetro', '116 460 km (9,1 × Tierra)'], ['Masa', '5,68×10²⁶ kg (95 M⊕)'], ['Gravedad', '10,4 m/s²'], ['Distancia al Sol', '9,54 UA · 1 432 M km'], ['Año (traslación)', '29,46 años'], ['Día (rotación)', '≈ 10,7 h'], ['Inclinación del eje', '26,7°'], ['Excentricidad', '0,057'], ['Temperatura', '−140 °C (nivel de 1 bar)'], ['Satélites', 'Más de 270 conocidos'], ['Velocidad orbital', '9,7 km/s'], ['Densidad', '0,69 g/cm³']],
    d: 'Famoso por sus anillos, formados por partículas de hielo de agua y roca que van de granos de polvo a bloques como casas. Los anillos principales se extienden unos 280 000 km, pero su grosor típico es de solo unos 10 metros.',
    xl: 'Atmósfera', x: '≈ 96 % H₂ y ≈ 3 % He, con metano y amoníaco. Su densidad media (0,69 g/cm³) es menor que la del agua: «flotaría» en un océano lo bastante grande.',
    e: 'Pioneer 11, Voyager 1 y 2 y Cassini–Huygens (2004–2017), que estudió el sistema y soltó la sonda Huygens sobre Titán en 2005. Dragonfly (NASA) volará a Titán en la década de 2030.',
    c: 'En su polo norte hay una tormenta hexagonal de unos 30 000 km de ancho. Los anillos podrían ser relativamente jóvenes (cientos de millones de años).' };

  B.urano = { n: 'Urano', grp: 'hel', col: '#8fe0e6', type: 'Gigante helado', a: 19.2184, ec: 0.0457, i: 0.77, om: 74.01, vp: 170.96, L: 313.23, T: 30688.5, Rd: 1.25, rkm: 25362, rot: 17.24, obl: 97.77, g: 8.87, ve: 21.3, tex: 'urano', ring: 'urano', atm: ['#a8f0f4', 3.2],
    h: 'Gira «acostado»: su eje está inclinado casi 98°.',
    st: [['Diámetro', '50 724 km (4,0 × Tierra)'], ['Masa', '8,68×10²⁵ kg (14,5 M⊕)'], ['Gravedad', '8,87 m/s²'], ['Distancia al Sol', '19,2 UA · 2 867 M km'], ['Año (traslación)', '84 años'], ['Día (rotación)', '17 h 14 min'], ['Inclinación del eje', '97,8°'], ['Excentricidad', '0,046'], ['Temperatura', '−195 °C media (mín. −224 °C)'], ['Satélites', 'Cerca de 30 conocidos'], ['Velocidad orbital', '6,8 km/s'], ['Densidad', '1,27 g/cm³']],
    d: 'Gigante helado que «rueda» de lado: su eje está inclinado ≈ 98°, probablemente por una colisión antigua, así que cada polo recibe luz solar continua durante unos 42 años. Tiene 13 anillos estrechos y oscuros.',
    xl: 'Atmósfera', x: 'H₂ (≈ 83 %), He (≈ 15 %) y metano (≈ 2 %); el metano absorbe el rojo y le da su color azul verdoso. Bajo la atmósfera hay un manto denso de agua, amoníaco y metano.',
    e: 'Solo la Voyager 2 lo ha visitado (1986). Una misión orbital es la prioridad de la ciencia planetaria para la próxima década.',
    c: 'Tiene la atmósfera más fría del Sistema Solar (hasta −224 °C), aunque Neptuno está mucho más lejos del Sol.' };

  B.neptuno = { n: 'Neptuno', grp: 'hel', col: '#4a78e6', type: 'Gigante helado', a: 30.1104, ec: 0.0113, i: 1.77, om: 131.78, vp: 44.97, L: 304.88, T: 60182, Rd: 1.2, rkm: 24622, rot: 16.11, obl: 28.32, g: 11.15, ve: 23.5, tex: 'neptuno', atm: ['#5b8cff', 3.2],
    h: 'El más lejano; tiene los vientos más veloces.',
    st: [['Diámetro', '49 244 km (3,9 × Tierra)'], ['Masa', '1,02×10²⁶ kg (17,1 M⊕)'], ['Gravedad', '11,2 m/s²'], ['Distancia al Sol', '30,1 UA · 4 515 M km'], ['Año (traslación)', '164,8 años'], ['Día (rotación)', '16 h 6 min'], ['Inclinación del eje', '28,3°'], ['Excentricidad', '0,011'], ['Temperatura', '−200 °C (media)'], ['Satélites', '16 conocidos'], ['Velocidad orbital', '5,4 km/s'], ['Densidad', '1,64 g/cm³']],
    d: 'Gigante helado y el planeta más lejano del Sol. Su existencia se predijo por cálculo (Le Verrier y Adams) a partir de las perturbaciones de Urano y se confirmó por observación en 1846 (Galle). Tiene los vientos más veloces del Sistema Solar, de hasta ≈ 2 100 km/h.',
    xl: 'Atmósfera', x: 'H₂, He y ≈ 1,5 % de metano; su azul intenso se debe al metano y a otras sustancias aún en estudio.',
    e: 'Solo la Voyager 2 lo visitó (1989) y descubrió la Gran Mancha Oscura, una tormenta que después desapareció.',
    c: 'Desde su descubrimiento en 1846 completó una sola órbita alrededor del Sol, en 2011.' };

  B.pluton = { n: 'Plutón', grp: 'ena', col: '#c9a98c', type: 'Planeta enano · cinturón de Kuiper', a: 39.482, ec: 0.2488, i: 17.14, om: 110.30, vp: 224.07, L: 238.93, T: 90560, Rd: 0.34, rkm: 1188, rot: 153.3, obl: 122.5, g: 0.62, ve: 1.21, tex: 'pluton', atm: ['#9fb4d8', 3.8],
    h: 'Planeta enano con órbita muy excéntrica e inclinada.',
    st: [['Diámetro', '2 377 km (0,19 × Tierra)'], ['Masa', '1,30×10²² kg (0,002 M⊕)'], ['Gravedad', '0,62 m/s²'], ['Distancia al Sol', '39,5 UA (29,7–49,3) · 5 906 M km'], ['Año (traslación)', '248 años'], ['Día (rotación)', '6,39 días'], ['Inclinación del eje', '122,5°'], ['Excentricidad', '0,249'], ['Inclinación de la órbita', '17,2°'], ['Temperatura', '−230 °C (media)'], ['Satélites', '5 (Caronte, Estigia, Nix, Cerbero, Hidra)'], ['Densidad', '1,85 g/cm³']],
    d: 'Planeta enano desde 2006, cuando la UAI definió «planeta» como un cuerpo que orbita al Sol, es casi esférico y ha despejado su órbita; Plutón no cumple la última condición. Es uno de los mayores objetos del cinturón de Kuiper.',
    xl: 'Atmósfera y superficie', x: 'Atmósfera tenue de N₂, CH₄ y CO que se congela y cae sobre la superficie al alejarse del Sol. Su superficie tiene hielos de nitrógeno, metano y CO; la región clara en forma de corazón se llama Tombaugh Regio.',
    e: 'New Horizons (NASA) lo sobrevoló el 14 de julio de 2015 y reveló montañas de hielo de agua y glaciares de nitrógeno.',
    c: 'Plutón y Caronte giran en torno a un punto situado fuera de Plutón: forman casi un planeta doble. Entre 1979 y 1999 estuvo más cerca del Sol que Neptuno.' };

  B.luna = { n: 'Luna', grp: 'sat', col: '#c7c7c7', type: 'Satélite de la Tierra', parent: 'tierra', orb: [1.55, 0.55], P: 27.32, inc: 5.1, Rd: 0.18, rkm: 1737, rot: 655.7, obl: 1.5, g: 1.62, ve: 2.38, tex: 'luna',
    h: 'Nuestro único satélite natural.',
    st: [['Diámetro', '3 474 km (0,27 × Tierra)'], ['Masa', '7,35×10²² kg (0,012 M⊕)'], ['Gravedad', '1,62 m/s²'], ['Distancia a la Tierra', '384 400 km'], ['Período orbital', '27,3 días'], ['Rotación', 'Sincrónica (27,3 días)'], ['Excentricidad', '0,055'], ['Temperatura', '−173 a 127 °C'], ['Densidad', '3,34 g/cm³']],
    d: 'Único satélite natural de la Tierra y el quinto mayor del Sistema Solar. Probablemente se formó tras el impacto de un cuerpo del tamaño de Marte contra la Tierra primitiva. Muestra siempre la misma cara porque su rotación está acoplada a su órbita.',
    xl: 'Superficie', x: 'Roca basáltica (los «mares») y anortosita (tierras altas), cubiertas de regolito. Hay hielo de agua en cráteres polares en sombra permanente.',
    e: 'Programa Apolo (1969–1972: 12 astronautas caminaron en ella) y misiones robóticas como Chang’e, Chandrayaan-3 y LRO. El programa Artemis (NASA) busca el regreso de astronautas.',
    c: 'Se aleja de la Tierra unos 3,8 cm por año, y su atracción produce las mareas.' };

  B.io = { n: 'Ío', grp: 'sat', col: '#e8d36a', type: 'Satélite de Júpiter', parent: 'jupiter', orb: [3.7, 0.75], P: 1.769, inc: 0, Rd: 0.2, rkm: 1822, rot: 42.5, obl: 0, g: 1.80, ve: 2.56, tex: 'io',
    h: 'La luna más volcánica del Sistema Solar.',
    st: [['Diámetro', '3 643 km'], ['Distancia a Júpiter', '421 700 km'], ['Período orbital', '1,77 días'], ['Gravedad', '1,80 m/s²'], ['Temperatura', '≈ −130 °C (superficie)']],
    d: 'La luna galileana más cercana a Júpiter y el cuerpo con más actividad volcánica del Sistema Solar, con cientos de volcanes. Su calor viene de las mareas que le provoca Júpiter y de su resonancia con Europa y Ganímedes.',
    xl: 'Superficie', x: 'Azufre y compuestos de azufre (amarillo, rojo y blanco) y una atmósfera muy tenue de SO₂.',
    e: 'Observada de cerca por Galileo y Juno.',
    c: 'Galileo descubrió Ío en 1610 junto con las otras tres lunas «galileanas»: mostraron que no todo gira alrededor de la Tierra.' };
  B.europa = { n: 'Europa', grp: 'sat', col: '#d9d0bd', type: 'Satélite de Júpiter', parent: 'jupiter', orb: [4.6, 0.95], P: 3.551, inc: 0, Rd: 0.18, rkm: 1561, rot: 85.2, obl: 0, g: 1.31, ve: 2.02, tex: 'europa',
    h: 'Océano bajo una corteza de hielo.',
    st: [['Diámetro', '3 122 km'], ['Distancia a Júpiter', '671 000 km'], ['Período orbital', '3,55 días'], ['Gravedad', '1,31 m/s²'], ['Temperatura', '≈ −160 °C (superficie)']],
    d: 'Corteza de hielo de agua sobre un océano global de agua líquida salada, con más agua que todos los océanos de la Tierra.',
    xl: 'Atmósfera', x: 'Muy tenue, de oxígeno. Podría haber plumas de vapor de agua.',
    e: 'Europa Clipper (NASA, lanzada en 2024) la sobrevolará decenas de veces; la misión JUICE (ESA) estudiará el sistema.',
    c: 'Es uno de los lugares más prometedores para buscar vida fuera de la Tierra.' };
  B.ganimedes = { n: 'Ganímedes', grp: 'sat', col: '#a89f93', type: 'Satélite de Júpiter', parent: 'jupiter', orb: [5.7, 1.2], P: 7.155, inc: 0, Rd: 0.28, rkm: 2634, rot: 171.7, obl: 0, g: 1.43, ve: 2.74, tex: 'ganimedes',
    h: 'La luna más grande del Sistema Solar.',
    st: [['Diámetro', '5 268 km'], ['Distancia a Júpiter', '1 070 000 km'], ['Período orbital', '7,15 días'], ['Gravedad', '1,43 m/s²'], ['Temperatura', '≈ −160 °C (superficie)']],
    d: 'La luna más grande del Sistema Solar: mayor que Mercurio, aunque con menos masa. Es el único satélite conocido con campo magnético propio.',
    xl: 'Composición', x: 'Mezcla de hielo y roca; probablemente tiene un océano salado subterráneo.',
    e: 'Galileo y Juno la sobrevolaron; JUICE (ESA) la orbitará hacia 2031.',
    c: 'Sus bandas claras y oscuras muestran una antigua actividad tectónica.' };
  B.calisto = { n: 'Calisto', grp: 'sat', col: '#7d7468', type: 'Satélite de Júpiter', parent: 'jupiter', orb: [7.0, 1.55], P: 16.689, inc: 0, Rd: 0.26, rkm: 2410, rot: 400.5, obl: 0, g: 1.24, ve: 2.44, tex: 'calisto',
    h: 'La superficie más craterizada.',
    st: [['Diámetro', '4 821 km'], ['Distancia a Júpiter', '1 883 000 km'], ['Período orbital', '16,69 días'], ['Gravedad', '1,24 m/s²'], ['Temperatura', '≈ −140 °C (superficie)']],
    d: 'Tiene la superficie más craterizada del Sistema Solar y una de las más antiguas (≈ 4 000 millones de años), señal de poca actividad geológica. Posiblemente alberga un océano subterráneo.',
    xl: 'Composición', x: 'Hielo mezclado con roca y material oscuro.',
    e: 'Estudiada por Galileo y Juno.',
    c: 'Orbita fuera del intenso cinturón de radiación de Júpiter, por lo que se ha propuesto como base para futuras exploraciones.' };
  B.titan = { n: 'Titán', grp: 'sat', col: '#e0a53f', type: 'Satélite de Saturno', parent: 'saturno', orb: [6.0, 1.15], P: 15.945, inc: 0, Rd: 0.27, rkm: 2575, rot: 382.7, obl: 0, g: 1.35, ve: 2.64, tex: 'titan',
    h: 'La luna con atmósfera densa y lagos de metano.',
    st: [['Diámetro', '5 150 km'], ['Distancia a Saturno', '1 222 000 km'], ['Período orbital', '15,95 días'], ['Gravedad', '1,35 m/s²'], ['Temperatura', '≈ −179 °C (superficie)']],
    d: 'La mayor luna de Saturno y la única con una atmósfera densa. Tiene ríos, lagos y mares de metano y etano líquidos.',
    xl: 'Atmósfera', x: '≈ 95 % N₂ y ≈ 5 % CH₄, con una presión en superficie ≈ 1,5 veces la terrestre.',
    e: 'La sonda Huygens (ESA) aterrizó en 2005. Dragonfly (NASA), un dron con rotores, llegará hacia 2034.',
    c: 'Con una atmósfera tan densa y una gravedad tan baja, en teoría una persona podría volar batiendo alas atadas a los brazos.' };
  B.triton = { n: 'Tritón', grp: 'sat', col: '#c8d8e0', type: 'Satélite de Neptuno', parent: 'neptuno', orb: [2.7, 0.5], P: -5.877, inc: 20, Rd: 0.2, rkm: 1353, rot: 141, obl: 0, g: 0.78, ve: 1.46, tex: 'triton',
    h: 'Orbita al revés: probablemente fue capturada.',
    st: [['Diámetro', '2 707 km'], ['Distancia a Neptuno', '354 800 km'], ['Período orbital', '5,88 días (retrógrada)'], ['Gravedad', '0,78 m/s²'], ['Temperatura', '≈ −235 °C (superficie)']],
    d: 'La mayor luna de Neptuno. Orbita en sentido contrario al giro del planeta (órbita retrógrada), lo que sugiere que es un objeto del cinturón de Kuiper capturado por Neptuno.',
    xl: 'Superficie', x: 'Hielos de nitrógeno, entre los lugares más fríos del Sistema Solar, con géiseres de nitrógeno observados por la Voyager 2.',
    e: 'Voyager 2 (1989).',
    c: 'Se acerca lentamente a Neptuno: en un futuro lejano podría desintegrarse y formar anillos.' };
  B.caronte = { n: 'Caronte', grp: 'sat', col: '#a99a94', type: 'Satélite de Plutón', parent: 'pluton', orb: [0.85, 0.3], P: 6.387, inc: 0, Rd: 0.17, rkm: 606, rot: 153.3, obl: 0, g: 0.29, ve: 0.58, tex: 'caronte',
    h: 'La mayor luna de Plutón; forman un sistema doble.',
    st: [['Diámetro', '1 212 km'], ['Distancia a Plutón', '19 600 km'], ['Período orbital', '6,39 días'], ['Gravedad', '0,29 m/s²'], ['Temperatura', '≈ −220 °C (superficie)']],
    d: 'La mayor luna de Plutón, con la mitad de su diámetro. Plutón y Caronte están en rotación sincrónica: se muestran siempre la misma cara.',
    xl: 'Superficie', x: 'Hielo de agua y roca; su polo norte rojizo (Mordor Macula) se debe a compuestos orgánicos llamados tolinas.',
    e: 'New Horizons (2015).',
    c: 'El centro de masa del par queda fuera de Plutón, por eso se considera un sistema doble.' };

  B.asteroides = { n: 'Cinturón de asteroides', grp: 'peq', col: '#9a8f84', type: 'Cuerpos menores · entre Marte y Júpiter', belt: true,
    h: 'Millones de rocas entre Marte y Júpiter.',
    st: [['Ubicación', '2,1 – 3,3 UA'], ['Cuerpos conocidos', 'Más de un millón'], ['Masa total', '≈ 3 % de la masa de la Luna'], ['Mayor cuerpo', 'Ceres (≈ 940 km, planeta enano)'], ['Período orbital', '3 a 6 años'], ['Composición', 'Roca, carbono y metales']],
    d: 'Millones de cuerpos rocosos y metálicos, restos de la formación del Sistema Solar que no llegaron a formar un planeta, en parte por la gravedad de Júpiter. Pese a lo que muestran muchas películas, están muy separados entre sí.',
    xl: 'Tipos', x: 'C (carbonosos, los más comunes), S (silicatos) y M (metálicos).',
    e: 'Dawn visitó Vesta y Ceres; OSIRIS-REx trajo muestras de Bennu (2023); Hayabusa2 trajo muestras de Ryugu; la misión DART desvió el asteroide Dimorphos en 2022.',
    c: 'Los huecos de Kirkwood, causados por resonancias con Júpiter, casi no tienen asteroides.' };
  B.kuiper = { n: 'Cinturón de Kuiper', grp: 'peq', col: '#7fa0c4', type: 'Cuerpos helados · más allá de Neptuno', belt: true,
    h: 'Región helada más allá de Neptuno.',
    st: [['Ubicación', '30 – 50 UA'], ['Cuerpos conocidos', 'Miles; se estiman cientos de miles de más de 100 km'], ['Objetos mayores', 'Plutón, Eris, Haumea y Makemake'], ['Composición', 'Hielos de agua, metano y amoníaco con roca']],
    d: 'Región helada más allá de Neptuno con millones de objetos, de donde proviene parte de los cometas de corto período. Alberga a Plutón y a otros planetas enanos (Eris, Haumea y Makemake).',
    xl: 'Comparación', x: 'Es unas 20 veces más ancho y entre 20 y 200 veces más masivo que el cinturón de asteroides.',
    e: 'New Horizons sobrevoló Arrokoth en 2019, un objeto de dos lóbulos que se formó por fusión suave de dos cuerpos.',
    c: 'Más allá aún está la nube de Oort, una región esférica hipotética de cometas que llegaría a decenas de miles de UA.' };

  /* Tabla comparativa de planetas */
  D.TBL = [['mercurio', '4 879', '0,055', '3,7', '0,39', '88 d', '58,6 d', '0'], ['venus', '12 104', '0,82', '8,9', '0,72', '225 d', '243 d', '0'], ['tierra', '12 742', '1', '9,8', '1,00', '365 d', '24 h', '1'], ['marte', '6 779', '0,11', '3,7', '1,52', '687 d', '24,6 h', '2'],
    ['jupiter', '139 820', '318', '24,8', '5,20', '11,9 a', '9,9 h', '95+'], ['saturno', '116 460', '95,2', '10,4', '9,54', '29,5 a', '10,7 h', '270+'], ['urano', '50 724', '14,5', '8,9', '19,2', '84 a', '17,2 h', '≈ 30'], ['neptuno', '49 244', '17,1', '11,2', '30,1', '165 a', '16,1 h', '16'], ['pluton', '2 377', '0,0022', '0,62', '39,5', '248 a', '6,4 d', '5']];

  /* Recorrido guiado. cam: {t: objetivo, dir, d}; rate: días simulados por segundo */
  var T0 = 'origin';
  D.STAGES = [
    { name: 'Sol', short: 'Sol', title: 'El Sol: la estrella que lo gobierna', focus: ['sol'], cam: { t: 'sol', dir: [0.3, 0.25, 1], d: 17 }, rate: 10,
      text: '<p>El <b>Sol</b> contiene el <b>99,86 %</b> de la masa del Sistema Solar. En su núcleo (≈ 15 millones de °C) el hidrógeno se fusiona en helio y libera la energía que llega a todos los planetas.</p><p>Su gravedad mantiene a cada cuerpo en una órbita.</p>' },
    { name: 'Rocosos', short: 'Planetas rocosos', title: 'Planetas rocosos: Mercurio, Venus, Tierra y Marte', focus: ['mercurio', 'venus', 'tierra', 'marte', 'luna'], cam: { t: T0, dir: [0, 0.9, 0.5], d: 46 }, rate: 20,
      text: '<p>Los planetas interiores son <b>pequeños y densos</b>, con superficie sólida y núcleo metálico. Tienen pocos satélites o ninguno.</p><p>Están cerca del Sol, así que sus <b>años son cortos</b>: Mercurio tarda 88 días; Marte, 687.</p>' },
    { name: 'Asteroides', short: 'Cinturón', title: 'El cinturón de asteroides', focus: ['asteroides', 'marte', 'jupiter'], cam: { t: T0, dir: [0, 0.75, 0.6], d: 58 }, rate: 30,
      text: '<p>Entre Marte y Júpiter orbitan millones de <b>cuerpos rocosos</b> (2,1–3,3 UA), restos de la formación del sistema que la gravedad de <b>Júpiter</b> impidió reunir en un planeta.</p><p>Su masa total es solo ≈ 3 % de la de la Luna. El mayor, <b>Ceres</b>, es un planeta enano.</p>' },
    { name: 'Gaseosos', short: 'Júpiter y Saturno', title: 'Gigantes gaseosos: Júpiter y Saturno', focus: ['jupiter', 'saturno', 'io', 'europa', 'ganimedes', 'calisto', 'titan'], cam: { t: T0, dir: [0, 0.8, 0.6], d: 88 }, rate: 60,
      text: '<p>Júpiter y Saturno son enormes y están formados sobre todo por <b>hidrógeno y helio</b>, sin superficie sólida. Júpiter equivale a <b>318 Tierras</b>.</p><p>Saturno tiene <b>anillos</b> de hielo y una densidad menor que la del agua. Ambos tienen decenas de satélites; busca las lunas galileanas y Titán.</p>' },
    { name: 'Helados', short: 'Urano y Neptuno', title: 'Gigantes helados: Urano y Neptuno', focus: ['urano', 'neptuno', 'triton'], cam: { t: T0, dir: [0, 0.8, 0.6], d: 150 }, rate: 365,
      text: '<p>Urano y Neptuno tienen un manto de <b>agua, amoníaco y metano</b> bajo una atmósfera de hidrógeno y helio. El metano les da su color azul.</p><p>Urano gira «acostado» (eje a 98°) y Neptuno tiene los vientos más veloces. Sus años duran 84 y 165 años terrestres.</p>' },
    { name: 'Kuiper', short: 'Más allá', title: 'Plutón y el cinturón de Kuiper', focus: ['pluton', 'caronte', 'kuiper', 'neptuno'], cam: { t: T0, dir: [0, 0.8, 0.55], d: 165 }, rate: 1200,
      text: '<p>Más allá de Neptuno hay un cinturón de cuerpos helados (30–50 UA). <b>Plutón</b>, <b>planeta enano</b> desde 2006, tiene una órbita muy <b>excéntrica</b> (e = 0,25) e <b>inclinada</b> 17° respecto del plano de los planetas.</p><p>Observa cómo su órbita sale del plano.</p>' },
    { name: 'Kepler', short: 'Leyes de Kepler', title: 'Las leyes de Kepler en Mercurio', focus: ['mercurio', 'sol'], cam: { t: T0, dir: [0, 1, 0.14], d: 48 }, rate: 5, kepler: true,
      text: '<p><b>1.ª ley:</b> las órbitas son <b>elipses</b> con el Sol en un foco (la de Mercurio es la más excéntrica de los planetas).</p><p><b>2.ª ley:</b> el radio vector barre <b>áreas iguales en tiempos iguales</b>: los dos sectores (amarillo y celeste) cubren el mismo tiempo y tienen la misma área, aunque tengan forma distinta. Cerca del perihelio el planeta va más rápido.</p><p><b>3.ª ley:</b> T² ∝ a³ (pestaña Kepler).</p>' },
    { name: 'Conjunto', short: 'Todo', title: 'El Sistema Solar completo', focus: null, cam: { t: T0, dir: [0, 0.55, 1], d: 160 }, rate: 30,
      text: '<p>Un <b>Sol</b>, <b>8 planetas</b> y miles de millones de cuerpos menores. Las distancias aquí están <b>comprimidas</b>: en realidad la luz del Sol tarda 8 min 20 s en llegar a la Tierra y unas 4 h 10 min en llegar a Neptuno.</p><p>Elige un cuerpo para ver su ficha, o cambia a <b>«A escala»</b> para ver los tamaños reales respecto del Sol.</p>' }
  ];

  D.QUIZ = [
    { q: '¿Cuál es el planeta más grande del Sistema Solar?', options: ['Saturno', 'Júpiter', 'Neptuno', 'Tierra'], answer: 1, why: 'Júpiter tiene un diámetro de ≈ 140 000 km y una masa 318 veces la de la Tierra.' },
    { q: '¿Qué planeta tiene un día (rotación) más largo que su año?', options: ['Mercurio', 'Marte', 'Venus', 'Urano'], answer: 2, why: 'Venus rota en 243 días terrestres y orbita al Sol en 225. Mercurio rota en 58,6 días y orbita en 88: su día es más corto que su año.' },
    { q: '¿Qué planeta gira «acostado», con el eje inclinado cerca de 98°?', options: ['Urano', 'Neptuno', 'Saturno', 'Marte'], answer: 0, why: 'Urano rueda de lado, probablemente por una colisión antigua.' },
    { q: 'Según la tercera ley de Kepler, un planeta a 4 UA del Sol tendría un año de…', options: ['4 años', '8 años', '16 años', '64 años'], answer: 1, why: 'T² = a³ → T = 4^1,5 = 8 años.' },
    { q: '¿Por qué Venus es más caliente que Mercurio, aun estando más lejos del Sol?', options: ['Tiene volcanes activos en todo el planeta', 'Su atmósfera de CO₂ produce un intenso efecto invernadero', 'Gira más rápido', 'Tiene más masa'], answer: 1, why: 'Su atmósfera densa de CO₂ atrapa el calor: ≈ 465 °C en superficie.' },
    { q: 'El cinturón de asteroides se ubica entre las órbitas de…', options: ['Venus y la Tierra', 'Marte y Júpiter', 'Saturno y Urano', 'Neptuno y Plutón'], answer: 1, why: 'Entre 2,1 y 3,3 UA, entre Marte y Júpiter.' },
    { q: '¿Cuál es el único planeta menos denso que el agua?', options: ['Júpiter', 'Urano', 'Saturno', 'Neptuno'], answer: 2, why: 'La densidad media de Saturno es 0,69 g/cm³ (la del agua es 1 g/cm³).' },
    { q: 'La segunda ley de Kepler (áreas iguales en tiempos iguales) implica que un planeta se mueve…', options: ['más rápido en el afelio', 'más rápido en el perihelio', 'con rapidez constante', 'más rápido cuanto más lejos del Sol'], answer: 1, why: 'Cerca del Sol el radio vector es corto, así que el planeta debe recorrer más arco en el mismo tiempo.' },
    { q: 'Una persona de 60 kg, ¿en cuál de estos cuerpos pesaría más?', options: ['Marte', 'Luna', 'Júpiter', 'Mercurio'], answer: 2, why: 'En Júpiter g = 24,8 m/s², el valor más alto de los planetas (peso ≈ 1 490 N, frente a 589 N en la Tierra).' },
    { q: 'Plutón dejó de ser planeta en 2006 porque…', options: ['es demasiado pequeño para ser esférico', 'no ha despejado su órbita de otros cuerpos', 'no orbita al Sol', 'no tiene atmósfera'], answer: 1, why: 'La UAI exige a un planeta haber despejado la vecindad de su órbita; Plutón comparte la suya con el cinturón de Kuiper.' },
    { q: 'Una unidad astronómica (UA) equivale aproximadamente a…', options: ['la distancia Tierra–Luna', 'la distancia media Tierra–Sol (≈ 150 millones de km)', 'un año luz', 'el radio del Sol'], answer: 1, why: '1 UA ≈ 149,6 millones de km.' }
  ];
})(window);
