/* chem-predictor.js — Guía cualitativa: ¿qué mecanismo predomina?
 * Reglas heurísticas de libro de texto (sustrato × reactivo, ajustadas por disolvente y temperatura).
 * Los porcentajes son TENDENCIAS RELATIVAS orientativas, no resultados experimentales. */
(function (root) {
  'use strict';
  const Chem = root.Chem;

  const sustratos = [
    { id: 'metilo', nombre: 'Metilo', ejemplo: 'bromometano', formula: 'CH₃–Br' },
    { id: 'primario', nombre: 'Primario (1.º)', ejemplo: '1-bromobutano', formula: 'RCH₂–Br' },
    { id: 'secundario', nombre: 'Secundario (2.º)', ejemplo: '2-bromopropano', formula: 'R₂CH–Br' },
    { id: 'terciario', nombre: 'Terciario (3.º)', ejemplo: '2-bromo-2-metilpropano', formula: 'R₃C–Br' }
  ];

  const reactivos = [
    { id: 'nu-fuerte', nombre: 'Nucleófilo fuerte, poco básico', ejemplo: 'NaCN, NaN₃, NaI, RS⁻' },
    { id: 'base-fuerte', nombre: 'Base fuerte pequeña', ejemplo: 'NaOH, NaOCH₃, NaOCH₂CH₃' },
    { id: 'base-voluminosa', nombre: 'Base fuerte voluminosa', ejemplo: 'KOC(CH₃)₃ (terc-butóxido)' },
    { id: 'debil', nombre: 'Nucleófilo/base débil (solvólisis)', ejemplo: 'H₂O, CH₃OH, CH₃CH₂OH' }
  ];

  const solventes = [
    { id: 'aprotico', nombre: 'Polar aprótico', ejemplo: 'DMSO, DMF, acetona' },
    { id: 'protico', nombre: 'Polar prótico', ejemplo: 'agua, metanol, etanol' }
  ];

  const temperaturas = [
    { id: 'baja', nombre: 'Temperatura baja/ambiente', ejemplo: '≈ 25 °C' },
    { id: 'alta', nombre: 'Temperatura alta', ejemplo: '≈ 80 °C o más' }
  ];

  // Pesos base 0–10 (sn2, sn1, e2, e1)
  const W = {
    metilo: {
      'nu-fuerte': [10, 0, 0, 0], 'base-fuerte': [10, 0, 0, 0], 'base-voluminosa': [10, 0, 0, 0], debil: [3, 0, 0, 0]
    },
    primario: {
      'nu-fuerte': [10, 0, 0.5, 0], 'base-fuerte': [7, 0, 3, 0], 'base-voluminosa': [1.5, 0, 8.5, 0], debil: [2, 0.2, 0, 0.1]
    },
    secundario: {
      'nu-fuerte': [8.5, 0, 1.5, 0], 'base-fuerte': [2.5, 0, 7.5, 0], 'base-voluminosa': [0.5, 0, 9.5, 0], debil: [1, 4.5, 0, 2.5]
    },
    terciario: {
      'nu-fuerte': [0, 3.5, 5, 1.5], 'base-fuerte': [0, 0.3, 9.5, 0.2], 'base-voluminosa': [0, 0, 10, 0], debil: [0, 6.5, 0, 3.5]
    }
  };

  const ORDEN = ['sn2', 'sn1', 'e2', 'e1'];
  const NOMBRES = { sn2: 'SN2', sn1: 'SN1', e2: 'E2', e1: 'E1' };

  const T_SUSTRATO = {
    metilo: 'Sustrato metilo: sin impedimento y sin carbonos β → solo es posible SN2.',
    primario: 'Sustrato primario: poco impedido (SN2 accesible) y su carbocatión sería demasiado inestable (SN1/E1 casi nulos).',
    secundario: 'Sustrato secundario: admite SN2 y E2; con reactivos débiles puede ionizar despacio (SN1/E1).',
    terciario: 'Sustrato terciario: el impedimento estérico bloquea SN2, pero su carbocatión es estable (SN1/E1); con bases fuertes domina E2.'
  };
  const T_REACTIVO = {
    'nu-fuerte': 'Nucleófilo fuerte y poco básico: ataca al carbono más que arrancar protones (favorece SN2).',
    'base-fuerte': 'Base fuerte pequeña: puede atacar al carbono o arrancar un H β; la balanza depende del sustrato.',
    'base-voluminosa': 'Base voluminosa: no puede acercarse al carbono impedido, pero sí arrancar un H periférico → E2.',
    debil: 'Reactivo débil: no fuerza reacciones bimoleculares; si ocurre algo, pasa por carbocatión (SN1/E1) y es lento.'
  };
  const T_SOLVENTE = {
    aprotico: 'Disolvente aprótico: no solvata aniones por puentes de hidrógeno → nucleófilos/bases más reactivos (favorece SN2/E2) y no estabiliza iones (desfavorece SN1/E1).',
    protico: 'Disolvente prótico: estabiliza carbocationes y aniones por puentes de hidrógeno → favorece SN1/E1 y atenúa a los nucleófilos aniónicos.'
  };
  const T_TEMP = {
    alta: 'Temperatura alta: la eliminación gana terreno (libera más moléculas: aumenta la entropía).',
    baja: 'Temperatura baja: se favorece la sustitución frente a la eliminación.'
  };

  function evaluar(c) {
    const base = (W[c.sustrato] && W[c.sustrato][c.reactivo]) || [0, 0, 0, 0];
    const anionico = c.reactivo !== 'debil';
    const m = { sn2: 1, sn1: 1, e2: 1, e1: 1 };
    if (c.solvente === 'aprotico') {
      if (anionico) { m.sn2 *= 1.35; m.e2 *= 1.15; m.sn1 *= 0.3; m.e1 *= 0.3; }
      else { m.sn1 *= 0.3; m.e1 *= 0.3; }
    } else if (anionico) {
      m.sn2 *= 0.85; m.e2 *= 0.95;
    } else {
      m.sn1 *= 1.4; m.e1 *= 1.4;
    }
    if (c.temp === 'alta') { m.e2 *= 1.4; m.e1 *= 1.5; m.sn2 *= 0.85; m.sn1 *= 0.8; }
    else { m.e2 *= 0.85; m.e1 *= 0.8; m.sn2 *= 1.05; m.sn1 *= 1.1; }

    const raw = ORDEN.map((k, i) => base[i] * m[k]);
    const suma = raw.reduce((a, b) => a + b, 0) || 1;
    const puntajes = {};
    ORDEN.forEach((k, i) => (puntajes[k] = raw[i] / suma));
    const orden = ORDEN.slice().sort((a, b) => puntajes[b] - puntajes[a]);

    const razones = [T_SUSTRATO[c.sustrato], T_REACTIVO[c.reactivo], T_SOLVENTE[c.solvente], T_TEMP[c.temp]];
    let nota = '';
    if (c.sustrato === 'metilo' && c.reactivo === 'debil') nota = 'La solvólisis de un halogenuro de metilo es extremadamente lenta: en la práctica no ocurre sin un nucleófilo mejor.';
    else if (c.sustrato === 'primario' && c.reactivo === 'debil') nota = 'Con un sustrato primario y un reactivo débil la reacción es muy lenta: se necesita un mejor nucleófilo.';
    else if (c.sustrato === 'secundario' && c.reactivo === 'debil') nota = 'El caso secundario con reactivo débil suele dar una mezcla SN1/E1 (y posibles transposiciones del carbocatión).';
    else if (c.sustrato === 'terciario' && c.reactivo === 'nu-fuerte') nota = 'En un sustrato terciario no hay SN2; un buen nucleófilo poco básico en medio prótico dispara más bien SN1.';

    return { puntajes, orden, principal: orden[0], razones, nota, nombres: NOMBRES };
  }

  /* Caso para el modo «Desafío»: elige condiciones con un ganador claro */
  function casoAleatorio(rnd) {
    const r = rnd || Math.random;
    const pick = a => a[Math.floor(r() * a.length)];
    for (let i = 0; i < 200; i++) {
      const c = {
        sustrato: pick(sustratos).id,
        reactivo: pick(reactivos).id,
        solvente: pick(solventes).id,
        temp: pick(temperaturas).id
      };
      if (c.sustrato === 'metilo' && c.reactivo === 'debil') continue;
      const e = evaluar(c);
      const [a, b] = e.orden;
      if (e.puntajes[a] >= 0.5 && e.puntajes[a] - e.puntajes[b] >= 0.25) return { condiciones: c, resultado: e };
    }
    const c = { sustrato: 'terciario', reactivo: 'debil', solvente: 'protico', temp: 'baja' };
    return { condiciones: c, resultado: evaluar(c) };
  }

  Chem.predictor = { sustratos, reactivos, solventes, temperaturas, evaluar, casoAleatorio, NOMBRES, ORDEN };
})(typeof window !== 'undefined' ? window : globalThis);
