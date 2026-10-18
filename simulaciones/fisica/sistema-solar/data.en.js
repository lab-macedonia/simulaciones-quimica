/* Sistema Solar 3D — datos de las fichas · Laboratorio MACEDONIA (UMCE)
   Elementos orbitales aproximados a la época J2000. Cifras redondeadas de NASA/JPL y UAI. */
(function (g) {
  'use strict';
  var D = g.SolarData = {};
  D.GROUPS = { est: "Star", roc: "Rocky planets", gas: "Gas giants", hel: "Ice giants", ena: "Dwarf planet", sat: "Moons", peq: "Belts of minor bodies" };
  D.ORDER = ['est', 'roc', 'gas', 'hel', 'ena', 'sat', 'peq'];
  D.GCOL = { est: '#ffcf5a', roc: '#e0925c', gas: '#d9b48a', hel: '#6fc6e6', ena: '#c9a98c', sat: '#b8c2cc', peq: '#9aa8b8' };
  D.IDS = ['sol', 'mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton', 'luna', 'io', 'europa', 'ganimedes', 'calisto', 'titan', 'triton', 'caronte', 'asteroides', 'kuiper'];
  var B = D.B = {};

  B.sol = { n: "Sun", grp: 'est', col: '#ffcf5a', type: "Star · yellow dwarf (G2V)", Rd: 3.4, rkm: 695700, rot: 609, obl: 7.25, g: 274, ve: 617.5, tex: 'sol',
    h: "It is the star at the center; it contains 99.86 % of the mass.",
    st: [["Diameter", "1,392,700 km (109 × Earth)"], ["Mass", "1.99×10³⁰ kg (333,000 M⊕)"], ["Surface gravity", '274 m/s² (28 g)'], ["Surface temperature", '≈ 5 500 °C'], ["Core temperature", "≈ 15 million °C"], ["Rotation", "≈ 25 d (equator) to 35 d (poles)"], ["Age", "≈ 4.6 billion years"], ["Luminosity", '3,8×10²⁶ W']],
    d: "Yellow dwarf star of spectral type G2V. It holds 99.86 % of the mass of the Solar System, so its gravity governs the motion of all the other bodies.",
    xl: "Composition", x: "≈ 73 % hydrogen and ≈ 25 % helium (by mass), with traces of oxygen, carbon, neon and iron. In the core, hydrogen fuses into helium and releases energy.",
    e: "Observed by SOHO, SDO, Solar Orbiter and the Parker probe, which has come within about 6 million km of its surface.",
    c: "Every second it converts about 4 million tonnes of matter into energy. Its light takes 8 min 20 s to reach Earth, but the energy generated in the core takes tens of thousands of years to get out." };

  B.mercurio = { n: "Mercury", grp: 'roc', col: '#b9b0a6', type: "Rocky planet", a: 0.3871, ec: 0.2056, i: 7.00, om: 48.33, vp: 77.46, L: 252.25, T: 87.97, Rd: 0.4, rkm: 2440, rot: 1407.6, obl: 0.03, g: 3.7, ve: 4.25, tex: 'mercurio',
    h: "The closest to the Sun and the smallest.",
    st: [["Diameter", "4,879 km (0.38 × Earth)"], ["Mass", "3.30×10²³ kg (0.055 M⊕)"], ["Gravity", '3,7 m/s²'], ["Distance to the Sun", "0.387 AU · 57.9 M km"], ["Year (revolution)", "88 days"], ["Day (rotation)", "58.6 d (solar day: 176 d)"], ["Axial tilt", '0,03°'], ["Eccentricity", '0,206'], ["Temperature", '−180 a 430 °C'], ["Moons", '0'], ["Orbital speed", "47.4 km/s"], ["Density", "5.43 g/cm³"]],
    d: "The smallest planet and the closest to the Sun. Its cratered surface resembles that of the Moon. It has an enormous iron core, occupying about 85 % of its radius.",
    xl: "Atmosphere", x: "Almost nonexistent: just a tenuous exosphere of sodium, oxygen, hydrogen and helium. With no atmosphere to distribute heat, the day is scorching and the night, freezing.",
    e: "Mariner 10 (1974–75), MESSENGER (in orbit 2011–2015) and BepiColombo (ESA/JAXA), which reaches its orbit toward the end of 2026.",
    c: "Because of its slow rotation and eccentric orbit, from some points on its surface the Sun rises, stops, goes backward and moves forward again. Even so, there is water ice in polar craters that are always in shadow." };

  B.venus = { n: 'Venus', grp: 'roc', col: '#e8c685', type: "Rocky planet", a: 0.7233, ec: 0.0068, i: 3.39, om: 76.68, vp: 131.53, L: 181.98, T: 224.70, Rd: 0.62, rkm: 6052, rot: 5832.5, obl: 177.36, g: 8.87, ve: 10.36, tex: 'venus', atm: ['#f3c97a', 2.4],
    h: "Very hot, with a dense CO₂ atmosphere and retrograde rotation.",
    st: [["Diameter", "12,104 km (0.95 × Earth)"], ["Mass", "4.87×10²⁴ kg (0.82 M⊕)"], ["Gravity", '8,87 m/s²'], ["Distance to the Sun", "0.723 AU · 108.2 M km"], ["Year (revolution)", "224.7 days"], ["Day (rotation)", "243 d, retrograde (solar day: 117 d)"], ["Axial tilt", '177,4°'], ["Eccentricity", '0,007'], ["Temperature", "465 °C (surface)"], ["Moons", '0'], ["Orbital speed", "35.0 km/s"], ["Density", "5.24 g/cm³"]],
    d: "Almost a twin of Earth in size and mass, but with a hellish environment. It rotates in the opposite direction to most planets (retrograde rotation) and its sidereal day lasts longer than its year.",
    xl: "Atmosphere", x: "≈ 96.5 % CO₂ and ≈ 3.5 % N₂, with sulfuric acid clouds. The surface pressure is about 92 times Earth's. The greenhouse effect makes it hotter than Mercury.",
    e: "Venera missions (USSR): Venera 7 (1970) was the first probe to transmit from the surface of another planet. Magellan (NASA) mapped the planet with radar in 1990–94 and Akatsuki (JAXA) studied its atmosphere.",
    c: "It is the brightest object in the sky after the Moon and is called the “morning star” or “evening star”. A sidereal day (243 d) lasts longer than a year (225 d)." };

  B.tierra = { n: "Earth", grp: 'roc', col: '#4f9be8', type: "Rocky planet", a: 1.0000, ec: 0.0167, i: 0, om: 0, vp: 102.94, L: 100.46, T: 365.256, Rd: 0.64, rkm: 6371, rot: 23.934, obl: 23.44, g: 9.81, ve: 11.19, tex: 'tierra', clouds: true, atm: ['#5aa8ff', 2.6],
    h: "The only planet with known life and liquid water on its surface.",
    st: [["Diameter", "12,742 km"], ["Mass", "5.97×10²⁴ kg (1 M⊕)"], ["Gravity", '9,81 m/s²'], ["Distance to the Sun", "1 AU · 149.6 M km"], ["Year (revolution)", "365.25 days"], ["Day (rotation)", "23 h 56 min (solar day: 24 h)"], ["Axial tilt", '23,4°'], ["Eccentricity", '0,017'], ["Temperature", "15 °C mean (−89 to 58 °C)"], ["Moons", "1 (the Moon)"], ["Orbital speed", "29.8 km/s"], ["Density", "5.51 g/cm³"]],
    d: "The only known place with life. It is the largest and densest rocky planet in the Solar System, with ≈ 71 % of its surface covered by liquid water and a magnetic field that deflects the solar wind.",
    xl: "Atmosphere", x: "≈ 78 % N₂, ≈ 21 % O₂ and ≈ 0.9 % argon, with variable water vapor and CO₂. The ozone layer filters a large part of the ultraviolet radiation.",
    e: "It is the best-studied planet: observation satellites (Landsat, Sentinel), the International Space Station and sensor networks on land, sea and air.",
    c: "The seasons are due to the tilt of the axis (23.4°) and not to the distance from the Sun: Earth passes closer to the Sun (perihelion) in January than in July." };

  B.marte = { n: "Mars", grp: 'roc', col: '#d1623a', type: "Rocky planet", a: 1.5237, ec: 0.0934, i: 1.85, om: 49.56, vp: 336.04, L: 355.45, T: 686.98, Rd: 0.46, rkm: 3390, rot: 24.623, obl: 25.19, g: 3.71, ve: 5.03, tex: 'marte', atm: ['#e0916c', 3.4],
    h: "The red planet, with the tallest known volcano.",
    st: [["Diameter", "6,779 km (0.53 × Earth)"], ["Mass", "6.42×10²³ kg (0.107 M⊕)"], ["Gravity", '3,71 m/s²'], ["Distance to the Sun", "1.524 AU · 227.9 M km"], ["Year (revolution)", "687 days"], ["Day (rotation)", '24 h 37 min'], ["Axial tilt", '25,2°'], ["Eccentricity", '0,093'], ["Temperature", "−63 °C mean (−125 to 20 °C)"], ["Moons", "2 (Phobos and Deimos)"], ["Orbital speed", "24.1 km/s"], ["Density", "3.93 g/cm³"]],
    d: "The “red planet”: its color comes from the iron oxide in the dust. It has the tallest volcano in the Solar System (Olympus Mons, ≈ 22 km), a canyon about 4,000 km long (Valles Marineris) and polar caps of water ice and CO₂.",
    xl: "Atmosphere", x: "Very thin: ≈ 95 % CO₂, ≈ 2.8 % N₂ and ≈ 1.9 % argon, with a pressure of ≈ 0.6 % of Earth's.",
    e: "It is the most explored planet after Earth: Viking, Pathfinder, Spirit, Opportunity, Curiosity and Perseverance (which looks for signs of ancient life in Jezero crater), with the Ingenuity helicopter.",
    c: "There is evidence that billions of years ago it had rivers and lakes of liquid water. A Martian day lasts about 40 minutes longer than an Earth one." };

  B.jupiter = { n: "Jupiter", grp: 'gas', col: '#d9b48a', type: "Gas giant", a: 5.2026, ec: 0.0489, i: 1.30, om: 100.47, vp: 14.75, L: 34.40, T: 4332.59, Rd: 2.2, rkm: 69911, rot: 9.925, obl: 3.13, g: 24.8, ve: 59.5, tex: 'jupiter', atm: ['#e8c9a0', 4],
    h: "The largest of all the planets.",
    st: [["Diameter", "139,820 km (11.2 × Earth)"], ["Mass", "1.90×10²⁷ kg (318 M⊕)"], ["Gravity", '24,8 m/s²'], ["Distance to the Sun", "5.20 AU · 778 M km"], ["Year (revolution)", "11.86 years"], ["Day (rotation)", '9 h 56 min'], ["Axial tilt", '3,1°'], ["Eccentricity", '0,049'], ["Temperature", "−108 °C (1 bar level)"], ["Moons", "More than 95 known"], ["Orbital speed", "13.1 km/s"], ["Density", "1.33 g/cm³"]],
    d: "The gas giant: it has more than twice the mass of all the other planets combined. Its extremely fast rotation flattens it and arranges its clouds in bands. The Great Red Spot is an anticyclonic storm wider than Earth, observed for more than 150 years.",
    xl: "Atmosphere", x: "≈ 90 % H₂ and ≈ 10 % He, with ammonia, methane and water vapor. It has no solid surface: beneath the clouds, the pressure turns hydrogen into a liquid and then into a metal.",
    e: "Pioneer, Voyager, Galileo (1995–2003), Juno (arrived in 2016) and Europa Clipper (launched in 2024, arriving in 2030).",
    c: "It radiates more heat than it receives from the Sun: it is still releasing energy from its formation. It has the strongest magnetic field of the planets." };

  B.saturno = { n: "Saturn", grp: 'gas', col: '#e6cf9a', type: "Gas giant", a: 9.5549, ec: 0.0565, i: 2.49, om: 113.66, vp: 92.43, L: 49.94, T: 10759.22, Rd: 1.9, rkm: 58232, rot: 10.7, obl: 26.73, g: 10.4, ve: 35.5, tex: 'saturno', ring: 'saturno', atm: ['#efdcae', 3.6],
    h: "The one with rings, less dense than water.",
    st: [["Diameter", "116,460 km (9.1 × Earth)"], ["Mass", "5.68×10²⁶ kg (95 M⊕)"], ["Gravity", '10,4 m/s²'], ["Distance to the Sun", "9.54 AU · 1,432 M km"], ["Year (revolution)", "29.46 years"], ["Day (rotation)", '≈ 10,7 h'], ["Axial tilt", '26,7°'], ["Eccentricity", '0,057'], ["Temperature", "−140 °C (1 bar level)"], ["Moons", "More than 270 known"], ["Orbital speed", "9.7 km/s"], ["Density", "0.69 g/cm³"]],
    d: "Famous for its rings, formed by particles of water ice and rock ranging from dust grains to blocks the size of houses. The main rings extend about 280,000 km, but their typical thickness is only about 10 meters.",
    xl: "Atmosphere", x: "≈ 96 % H₂ and ≈ 3 % He, with methane and ammonia. Its mean density (0.69 g/cm³) is lower than that of water: it would “float” in a large enough ocean.",
    e: "Pioneer 11, Voyager 1 and 2 and Cassini–Huygens (2004–2017), which studied the system and released the Huygens probe onto Titan in 2005. Dragonfly (NASA) will fly to Titan in the 2030s.",
    c: "At its north pole there is a hexagonal storm about 30,000 km wide. The rings may be relatively young (hundreds of millions of years)." };

  B.urano = { n: "Uranus", grp: 'hel', col: '#8fe0e6', type: "Ice giant", a: 19.2184, ec: 0.0457, i: 0.77, om: 74.01, vp: 170.96, L: 313.23, T: 30688.5, Rd: 1.25, rkm: 25362, rot: 17.24, obl: 97.77, g: 8.87, ve: 21.3, tex: 'urano', ring: 'urano', atm: ['#a8f0f4', 3.2],
    h: "It rotates “lying down”: its axis is tilted almost 98°.",
    st: [["Diameter", "50,724 km (4.0 × Earth)"], ["Mass", "8.68×10²⁵ kg (14.5 M⊕)"], ["Gravity", '8,87 m/s²'], ["Distance to the Sun", "19.2 AU · 2,867 M km"], ["Year (revolution)", "84 years"], ["Day (rotation)", '17 h 14 min'], ["Axial tilt", '97,8°'], ["Eccentricity", '0,046'], ["Temperature", "−195 °C mean (min. −224 °C)"], ["Moons", "About 30 known"], ["Orbital speed", "6.8 km/s"], ["Density", "1.27 g/cm³"]],
    d: "Ice giant that “rolls” on its side: its axis is tilted ≈ 98°, probably because of an ancient collision, so each pole receives continuous sunlight for about 42 years. It has 13 narrow, dark rings.",
    xl: "Atmosphere", x: "H₂ (≈ 83 %), He (≈ 15 %) and methane (≈ 2 %); methane absorbs red and gives it its blue-green color. Beneath the atmosphere there is a dense mantle of water, ammonia and methane.",
    e: "Only Voyager 2 has visited it (1986). An orbital mission is the priority of planetary science for the next decade.",
    c: "It has the coldest atmosphere in the Solar System (down to −224 °C), even though Neptune is much farther from the Sun." };

  B.neptuno = { n: "Neptune", grp: 'hel', col: '#4a78e6', type: "Ice giant", a: 30.1104, ec: 0.0113, i: 1.77, om: 131.78, vp: 44.97, L: 304.88, T: 60182, Rd: 1.2, rkm: 24622, rot: 16.11, obl: 28.32, g: 11.15, ve: 23.5, tex: 'neptuno', atm: ['#5b8cff', 3.2],
    h: "The farthest; it has the fastest winds.",
    st: [["Diameter", "49,244 km (3.9 × Earth)"], ["Mass", "1.02×10²⁶ kg (17.1 M⊕)"], ["Gravity", '11,2 m/s²'], ["Distance to the Sun", "30.1 AU · 4,515 M km"], ["Year (revolution)", "164.8 years"], ["Day (rotation)", '16 h 6 min'], ["Axial tilt", '28,3°'], ["Eccentricity", '0,011'], ["Temperature", "−200 °C (mean)"], ["Moons", "16 known"], ["Orbital speed", "5.4 km/s"], ["Density", "1.64 g/cm³"]],
    d: "Ice giant and the planet farthest from the Sun. Its existence was predicted by calculation (Le Verrier and Adams) from the perturbations of Uranus and confirmed by observation in 1846 (Galle). It has the fastest winds in the Solar System, up to ≈ 2,100 km/h.",
    xl: "Atmosphere", x: "H₂, He and ≈ 1.5 % methane; its intense blue is due to methane and to other substances still under study.",
    e: "Only Voyager 2 visited it (1989) and discovered the Great Dark Spot, a storm that later disappeared.",
    c: "Since its discovery in 1846 it has completed only one orbit around the Sun, in 2011." };

  B.pluton = { n: "Pluto", grp: 'ena', col: '#c9a98c', type: "Dwarf planet · Kuiper belt", a: 39.482, ec: 0.2488, i: 17.14, om: 110.30, vp: 224.07, L: 238.93, T: 90560, Rd: 0.34, rkm: 1188, rot: 153.3, obl: 122.5, g: 0.62, ve: 1.21, tex: 'pluton', atm: ['#9fb4d8', 3.8],
    h: "Dwarf planet with a very eccentric and inclined orbit.",
    st: [["Diameter", "2,377 km (0.19 × Earth)"], ["Mass", "1.30×10²² kg (0.002 M⊕)"], ["Gravity", '0,62 m/s²'], ["Distance to the Sun", "39.5 AU (29.7–49.3) · 5,906 M km"], ["Year (revolution)", "248 years"], ["Day (rotation)", "6.39 days"], ["Axial tilt", '122,5°'], ["Eccentricity", '0,249'], ["Orbital inclination", '17,2°'], ["Temperature", "−230 °C (mean)"], ["Moons", "5 (Charon, Styx, Nix, Kerberos, Hydra)"], ["Density", "1.85 g/cm³"]],
    d: "A dwarf planet since 2006, when the IAU defined “planet” as a body that orbits the Sun, is nearly spherical and has cleared its orbit; Pluto does not meet the last condition. It is one of the largest objects in the Kuiper belt.",
    xl: "Atmosphere and surface", x: "Thin atmosphere of N₂, CH₄ and CO that freezes and falls onto the surface as it moves away from the Sun. Its surface has nitrogen, methane and CO ices; the light heart-shaped region is called Tombaugh Regio.",
    e: "New Horizons (NASA) flew by it on July 14, 2015 and revealed mountains of water ice and nitrogen glaciers.",
    c: "Pluto and Charon revolve around a point located outside Pluto: they form almost a double planet. Between 1979 and 1999 it was closer to the Sun than Neptune." };

  B.luna = { n: "Moon", grp: 'sat', col: '#c7c7c7', type: "Satellite of Earth", parent: 'tierra', orb: [1.55, 0.55], P: 27.32, inc: 5.1, Rd: 0.18, rkm: 1737, rot: 655.7, obl: 1.5, g: 1.62, ve: 2.38, tex: 'luna',
    h: "Our only natural satellite.",
    st: [["Diameter", "3,474 km (0.27 × Earth)"], ["Mass", "7.35×10²² kg (0.012 M⊕)"], ["Gravity", '1,62 m/s²'], ["Distance to Earth", "384,400 km"], ["Orbital period", "27.3 days"], ["Rotation", "Synchronous (27.3 days)"], ["Eccentricity", '0,055'], ["Temperature", '−173 a 127 °C'], ["Density", "3.34 g/cm³"]],
    d: "Earth's only natural satellite and the fifth largest in the Solar System. It probably formed after the impact of a Mars-sized body with the early Earth. It always shows the same face because its rotation is locked to its orbit.",
    xl: "Surface", x: "Basaltic rock (the “seas”) and anorthosite (highlands), covered with regolith. There is water ice in permanently shadowed polar craters.",
    e: "Apollo program (1969–1972: 12 astronauts walked on it) and robotic missions such as Chang’e, Chandrayaan-3 and LRO. NASA's Artemis program seeks the return of astronauts.",
    c: "It moves away from Earth about 3.8 cm per year, and its attraction produces the tides." };

  B.io = { n: "Io", grp: 'sat', col: '#e8d36a', type: "Satellite of Jupiter", parent: 'jupiter', orb: [3.7, 0.75], P: 1.769, inc: 0, Rd: 0.2, rkm: 1822, rot: 42.5, obl: 0, g: 1.80, ve: 2.56, tex: 'io',
    h: "The most volcanic moon in the Solar System.",
    st: [["Diameter", "3,643 km"], ["Distance to Jupiter", "421,700 km"], ["Orbital period", "1.77 days"], ["Gravity", '1,80 m/s²'], ["Temperature", "≈ −130 °C (surface)"]],
    d: "The Galilean moon closest to Jupiter and the body with the most volcanic activity in the Solar System, with hundreds of volcanoes. Its heat comes from the tides that Jupiter causes and from its resonance with Europa and Ganymede.",
    xl: "Surface", x: "Sulfur and sulfur compounds (yellow, red and white) and a very thin atmosphere of SO₂.",
    e: "Observed up close by Galileo and Juno.",
    c: "Galileo discovered Io in 1610 together with the other three “Galilean” moons: they showed that not everything revolves around Earth." };
  B.europa = { n: 'Europa', grp: 'sat', col: '#d9d0bd', type: "Satellite of Jupiter", parent: 'jupiter', orb: [4.6, 0.95], P: 3.551, inc: 0, Rd: 0.18, rkm: 1561, rot: 85.2, obl: 0, g: 1.31, ve: 2.02, tex: 'europa',
    h: "Ocean under a crust of ice.",
    st: [["Diameter", "3,122 km"], ["Distance to Jupiter", "671,000 km"], ["Orbital period", "3.55 days"], ["Gravity", '1,31 m/s²'], ["Temperature", "≈ −160 °C (surface)"]],
    d: "Crust of water ice over a global ocean of salty liquid water, with more water than all of Earth's oceans.",
    xl: "Atmosphere", x: "Very thin, of oxygen. There could be water vapor plumes.",
    e: "Europa Clipper (NASA, launched in 2024) will fly by it dozens of times; the JUICE mission (ESA) will study the system.",
    c: "It is one of the most promising places to look for life beyond Earth." };
  B.ganimedes = { n: "Ganymede", grp: 'sat', col: '#a89f93', type: "Satellite of Jupiter", parent: 'jupiter', orb: [5.7, 1.2], P: 7.155, inc: 0, Rd: 0.28, rkm: 2634, rot: 171.7, obl: 0, g: 1.43, ve: 2.74, tex: 'ganimedes',
    h: "The largest moon in the Solar System.",
    st: [["Diameter", "5,268 km"], ["Distance to Jupiter", "1,070,000 km"], ["Orbital period", "7.15 days"], ["Gravity", '1,43 m/s²'], ["Temperature", "≈ −160 °C (surface)"]],
    d: "The largest moon in the Solar System: larger than Mercury, although with less mass. It is the only known satellite with its own magnetic field.",
    xl: "Composition", x: "Mixture of ice and rock; it probably has a subsurface salty ocean.",
    e: "Galileo and Juno flew by it; JUICE (ESA) will orbit it around 2031.",
    c: "Its light and dark bands show ancient tectonic activity." };
  B.calisto = { n: "Callisto", grp: 'sat', col: '#7d7468', type: "Satellite of Jupiter", parent: 'jupiter', orb: [7.0, 1.55], P: 16.689, inc: 0, Rd: 0.26, rkm: 2410, rot: 400.5, obl: 0, g: 1.24, ve: 2.44, tex: 'calisto',
    h: "The most heavily cratered surface.",
    st: [["Diameter", "4,821 km"], ["Distance to Jupiter", "1,883,000 km"], ["Orbital period", "16.69 days"], ["Gravity", '1,24 m/s²'], ["Temperature", "≈ −140 °C (surface)"]],
    d: "It has the most heavily cratered surface in the Solar System and one of the oldest (≈ 4 billion years), a sign of little geological activity. It possibly harbors a subsurface ocean.",
    xl: "Composition", x: "Ice mixed with rock and dark material.",
    e: "Studied by Galileo and Juno.",
    c: "It orbits outside Jupiter's intense radiation belt, so it has been proposed as a base for future exploration." };
  B.titan = { n: "Titan", grp: 'sat', col: '#e0a53f', type: "Satellite of Saturn", parent: 'saturno', orb: [6.0, 1.15], P: 15.945, inc: 0, Rd: 0.27, rkm: 2575, rot: 382.7, obl: 0, g: 1.35, ve: 2.64, tex: 'titan',
    h: "The moon with a dense atmosphere and methane lakes.",
    st: [["Diameter", "5,150 km"], ["Distance to Saturn", "1,222,000 km"], ["Orbital period", "15.95 days"], ["Gravity", '1,35 m/s²'], ["Temperature", "≈ −179 °C (surface)"]],
    d: "Saturn's largest moon and the only one with a dense atmosphere. It has rivers, lakes and seas of liquid methane and ethane.",
    xl: "Atmosphere", x: "≈ 95 % N₂ and ≈ 5 % CH₄, with a surface pressure ≈ 1.5 times Earth's.",
    e: "The Huygens probe (ESA) landed in 2005. Dragonfly (NASA), a drone with rotors, will arrive around 2034.",
    c: "With such a dense atmosphere and such low gravity, in theory a person could fly by flapping wings tied to the arms." };
  B.triton = { n: "Triton", grp: 'sat', col: '#c8d8e0', type: "Satellite of Neptune", parent: 'neptuno', orb: [2.7, 0.5], P: -5.877, inc: 20, Rd: 0.2, rkm: 1353, rot: 141, obl: 0, g: 0.78, ve: 1.46, tex: 'triton',
    h: "It orbits backward: it was probably captured.",
    st: [["Diameter", "2,707 km"], ["Distance to Neptune", "354,800 km"], ["Orbital period", "5.88 days (retrograde)"], ["Gravity", '0,78 m/s²'], ["Temperature", "≈ −235 °C (surface)"]],
    d: "Neptune's largest moon. It orbits in the direction opposite to the planet's rotation (retrograde orbit), which suggests it is a Kuiper belt object captured by Neptune.",
    xl: "Surface", x: "Nitrogen ices, among the coldest places in the Solar System, with nitrogen geysers observed by Voyager 2.",
    e: 'Voyager 2 (1989).',
    c: "It is slowly approaching Neptune: in the distant future it could break apart and form rings." };
  B.caronte = { n: "Charon", grp: 'sat', col: '#a99a94', type: "Satellite of Pluto", parent: 'pluton', orb: [0.85, 0.3], P: 6.387, inc: 0, Rd: 0.17, rkm: 606, rot: 153.3, obl: 0, g: 0.29, ve: 0.58, tex: 'caronte',
    h: "Pluto's largest moon; they form a double system.",
    st: [["Diameter", "1,212 km"], ["Distance to Pluto", "19,600 km"], ["Orbital period", "6.39 days"], ["Gravity", '0,29 m/s²'], ["Temperature", "≈ −220 °C (surface)"]],
    d: "Pluto's largest moon, with half its diameter. Pluto and Charon are in synchronous rotation: they always show each other the same face.",
    xl: "Surface", x: "Water ice and rock; its reddish north pole (Mordor Macula) is due to organic compounds called tholins.",
    e: 'New Horizons (2015).',
    c: "The center of mass of the pair lies outside Pluto, which is why it is considered a double system." };

  B.asteroides = { n: "Asteroid belt", grp: 'peq', col: '#9a8f84', type: "Minor bodies · between Mars and Jupiter", belt: true,
    h: "Millions of rocks between Mars and Jupiter.",
    st: [["Location", "2.1 – 3.3 AU"], ["Known bodies", "More than a million"], ["Total mass", "≈ 3 % of the mass of the Moon"], ["Largest body", "Ceres (≈ 940 km, dwarf planet)"], ["Orbital period", "3 to 6 years"], ["Composition", "Rock, carbon and metals"]],
    d: "Millions of rocky and metallic bodies, remnants of the formation of the Solar System that did not manage to form a planet, partly because of Jupiter's gravity. Despite what many films show, they are very far apart from one another.",
    xl: "Types", x: "C (carbonaceous, the most common), S (silicates) and M (metallic).",
    e: "Dawn visited Vesta and Ceres; OSIRIS-REx brought samples from Bennu (2023); Hayabusa2 brought samples from Ryugu; the DART mission deflected the asteroid Dimorphos in 2022.",
    c: "The Kirkwood gaps, caused by resonances with Jupiter, have almost no asteroids." };
  B.kuiper = { n: "Kuiper belt", grp: 'peq', col: '#7fa0c4', type: "Icy bodies · beyond Neptune", belt: true,
    h: "Icy region beyond Neptune.",
    st: [["Location", "30 – 50 AU"], ["Known bodies", "Thousands; hundreds of thousands of more than 100 km are estimated"], ["Largest objects", "Pluto, Eris, Haumea and Makemake"], ["Composition", "Ices of water, methane and ammonia with rock"]],
    d: "Icy region beyond Neptune with millions of objects, the source of part of the short-period comets. It is home to Pluto and other dwarf planets (Eris, Haumea and Makemake).",
    xl: "Comparison", x: "It is about 20 times wider and between 20 and 200 times more massive than the asteroid belt.",
    e: "New Horizons flew by Arrokoth in 2019, a two-lobed object that formed by the gentle merging of two bodies.",
    c: "Even farther out is the Oort cloud, a hypothetical spherical region of comets reaching tens of thousands of AU." };

  /* Tabla comparativa de planetas */
  D.TBL = [['mercurio', '4 879', '0,055', '3,7', '0,39', '88 d', '58,6 d', '0'], ['venus', '12 104', '0,82', '8,9', '0,72', '225 d', '243 d', '0'], ['tierra', '12 742', '1', '9,8', '1,00', '365 d', '24 h', '1'], ['marte', '6 779', '0,11', '3,7', '1,52', '687 d', '24,6 h', '2'],
    ['jupiter', '139 820', '318', '24,8', '5,20', '11,9 a', '9,9 h', '95+'], ['saturno', '116 460', '95,2', '10,4', '9,54', '29,5 a', '10,7 h', '270+'], ['urano', '50 724', '14,5', '8,9', '19,2', '84 a', '17,2 h', '≈ 30'], ['neptuno', '49 244', '17,1', '11,2', '30,1', '165 a', '16,1 h', '16'], ['pluton', '2 377', '0,0022', '0,62', '39,5', '248 a', '6,4 d', '5']];

  /* Recorrido guiado. cam: {t: objetivo, dir, d}; rate: días simulados por segundo */
  var T0 = 'origin';
  D.STAGES = [
    { name: "Sun", short: "Sun", title: "The Sun: the star that governs it all", focus: ['sol'], cam: { t: 'sol', dir: [0.3, 0.25, 1], d: 17 }, rate: 10,
      text: "<p>The <b>Sun</b> contains <b>99.86 %</b> of the mass of the Solar System. In its core (≈ 15 million °C) hydrogen fuses into helium and releases the energy that reaches all the planets.</p><p>Its gravity keeps every body in orbit.</p>" },
    { name: "Rocky", short: "Rocky planets", title: "Rocky planets: Mercury, Venus, Earth and Mars", focus: ['mercurio', 'venus', 'tierra', 'marte', 'luna'], cam: { t: T0, dir: [0, 0.9, 0.5], d: 46 }, rate: 20,
      text: "<p>The inner planets are <b>small and dense</b>, with a solid surface and a metallic core. They have few satellites or none.</p><p>They are close to the Sun, so their <b>years are short</b>: Mercury takes 88 days; Mars, 687.</p>" },
    { name: "Asteroids", short: "Belt", title: "The asteroid belt", focus: ['asteroides', 'marte', 'jupiter'], cam: { t: T0, dir: [0, 0.75, 0.6], d: 58 }, rate: 30,
      text: "<p>Between Mars and Jupiter, millions of <b>rocky bodies</b> orbit (2.1–3.3 AU), remnants of the formation of the system that <b>Jupiter's</b> gravity prevented from gathering into a planet.</p><p>Their total mass is only ≈ 3 % of that of the Moon. The largest, <b>Ceres</b>, is a dwarf planet.</p>" },
    { name: "Gaseous", short: "Jupiter and Saturn", title: "Gas giants: Jupiter and Saturn", focus: ['jupiter', 'saturno', 'io', 'europa', 'ganimedes', 'calisto', 'titan'], cam: { t: T0, dir: [0, 0.8, 0.6], d: 88 }, rate: 60,
      text: "<p>Jupiter and Saturn are enormous and are made mostly of <b>hydrogen and helium</b>, with no solid surface. Jupiter equals <b>318 Earths</b>.</p><p>Saturn has ice <b>rings</b> and a density lower than that of water. Both have dozens of satellites; look for the Galilean moons and Titan.</p>" },
    { name: "Icy", short: "Uranus and Neptune", title: "Ice giants: Uranus and Neptune", focus: ['urano', 'neptuno', 'triton'], cam: { t: T0, dir: [0, 0.8, 0.6], d: 150 }, rate: 365,
      text: "<p>Uranus and Neptune have a mantle of <b>water, ammonia and methane</b> beneath an atmosphere of hydrogen and helium. Methane gives them their blue color.</p><p>Uranus rotates “lying down” (axis at 98°) and Neptune has the fastest winds. Their years last 84 and 165 Earth years.</p>" },
    { name: 'Kuiper', short: "Beyond", title: "Pluto and the Kuiper belt", focus: ['pluton', 'caronte', 'kuiper', 'neptuno'], cam: { t: T0, dir: [0, 0.8, 0.55], d: 165 }, rate: 1200,
      text: "<p>Beyond Neptune there is a belt of icy bodies (30–50 AU). <b>Pluto</b>, a <b>dwarf planet</b> since 2006, has a very <b>eccentric</b> orbit (e = 0.25) <b>inclined</b> 17° with respect to the plane of the planets.</p><p>Watch how its orbit leaves the plane.</p>" },
    { name: 'Kepler', short: "Kepler's laws", title: "Kepler's laws on Mercury", focus: ['mercurio', 'sol'], cam: { t: T0, dir: [0, 1, 0.14], d: 48 }, rate: 5, kepler: true,
      text: "<p><b>1st law:</b> orbits are <b>ellipses</b> with the Sun at one focus (Mercury's is the most eccentric of the planets).</p><p><b>2nd law:</b> the radius vector sweeps <b>equal areas in equal times</b>: the two sectors (yellow and sky blue) cover the same time and have the same area, although they have different shapes. Near perihelion the planet moves faster.</p><p><b>3rd law:</b> T² ∝ a³ (Kepler tab).</p>" },
    { name: "Whole", short: "All", title: "The complete Solar System", focus: null, cam: { t: T0, dir: [0, 0.55, 1], d: 160 }, rate: 30,
      text: "<p>One <b>Sun</b>, <b>8 planets</b> and billions of minor bodies. The distances here are <b>compressed</b>: in reality sunlight takes 8 min 20 s to reach Earth and about 4 h 10 min to reach Neptune.</p><p>Choose a body to see its fact sheet, or switch to <b>“To scale”</b> to see the real sizes relative to the Sun.</p>" }
  ];

  D.QUIZ = [
    { q: "What is the largest planet in the Solar System?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1, why: "Jupiter has a diameter of ≈ 140,000 km and a mass 318 times that of Earth." },
    { q: "Which planet has a day (rotation) longer than its year?", options: ["Mercury", "Mars", 'Venus', "Uranus"], answer: 2, why: "Venus rotates in 243 Earth days and orbits the Sun in 225. Mercury rotates in 58.6 days and orbits in 88: its day is shorter than its year." },
    { q: "Which planet rotates “lying down”, with its axis tilted about 98°?", options: ["Uranus", "Neptune", "Saturn", "Mars"], answer: 0, why: "Uranus rolls on its side, probably because of an ancient collision." },
    { q: "According to Kepler's third law, a planet at 4 AU from the Sun would have a year of…", options: ["4 years", "8 years", "16 years", "64 years"], answer: 1, why: "T² = a³ → T = 4^1.5 = 8 years." },
    { q: "Why is Venus hotter than Mercury, even though it is farther from the Sun?", options: ["It has active volcanoes all over the planet", "Its CO₂ atmosphere produces an intense greenhouse effect", "It rotates faster", "It has more mass"], answer: 1, why: "Its dense CO₂ atmosphere traps heat: ≈ 465 °C at the surface." },
    { q: "The asteroid belt is located between the orbits of…", options: ["Venus and Earth", "Mars and Jupiter", "Saturn and Uranus", "Neptune and Pluto"], answer: 1, why: "Between 2.1 and 3.3 AU, between Mars and Jupiter." },
    { q: "Which is the only planet less dense than water?", options: ["Jupiter", "Uranus", "Saturn", "Neptune"], answer: 2, why: "Saturn's mean density is 0.69 g/cm³ (that of water is 1 g/cm³)." },
    { q: "Kepler's second law (equal areas in equal times) implies that a planet moves…", options: ["faster at aphelion", "faster at perihelion", "at constant speed", "faster the farther from the Sun"], answer: 1, why: "Near the Sun the radius vector is short, so the planet must cover more arc in the same time." },
    { q: "A 60 kg person, on which of these bodies would they weigh the most?", options: ["Mars", "Moon", "Jupiter", "Mercury"], answer: 2, why: "On Jupiter g = 24.8 m/s², the highest value of the planets (weight ≈ 1,490 N, versus 589 N on Earth)." },
    { q: "Pluto stopped being a planet in 2006 because…", options: ["it is too small to be spherical", "it has not cleared its orbit of other bodies", "it does not orbit the Sun", "it has no atmosphere"], answer: 1, why: "The IAU requires a planet to have cleared the neighborhood of its orbit; Pluto shares its own with the Kuiper belt." },
    { q: "An astronomical unit (AU) is approximately equal to…", options: ["the Earth–Moon distance", "the mean Earth–Sun distance (≈ 150 million km)", "a light-year", "the radius of the Sun"], answer: 1, why: "1 AU ≈ 149.6 million km." }
  ];
})(window);
