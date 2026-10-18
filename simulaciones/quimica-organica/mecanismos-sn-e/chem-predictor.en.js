/* chem-predictor.js — Guía cualitativa: ¿qué mecanismo predomina?
 * Reglas heurísticas de libro de texto (sustrato × reactivo, ajustadas por disolvente y temperatura).
 * Los porcentajes son TENDENCIAS RELATIVAS orientativas, no resultados experimentales. */
(function (root) {
  'use strict';
  const Chem = root.Chem;

  const sustratos = [
    { id: 'metilo', nombre: "Methyl", ejemplo: "bromomethane", formula: 'CH₃–Br' },
    { id: 'primario', nombre: "Primary (1°)", ejemplo: '1-bromobutano', formula: 'RCH₂–Br' },
    { id: 'secundario', nombre: "Secondary (2°)", ejemplo: '2-bromopropano', formula: 'R₂CH–Br' },
    { id: 'terciario', nombre: "Tertiary (3°)", ejemplo: '2-bromo-2-metilpropano', formula: 'R₃C–Br' }
  ];

  const reactivos = [
    { id: 'nu-fuerte', nombre: "Strong nucleophile, weakly basic", ejemplo: 'NaCN, NaN₃, NaI, RS⁻' },
    { id: 'base-fuerte', nombre: "Small strong base", ejemplo: 'NaOH, NaOCH₃, NaOCH₂CH₃' },
    { id: 'base-voluminosa', nombre: "Bulky strong base", ejemplo: "KOC(CH₃)₃ (tert-butoxide)" },
    { id: 'debil', nombre: "Weak nucleophile/base (solvolysis)", ejemplo: 'H₂O, CH₃OH, CH₃CH₂OH' }
  ];

  const solventes = [
    { id: 'aprotico', nombre: "Polar aprotic", ejemplo: "DMSO, DMF, acetone" },
    { id: 'protico', nombre: "Polar protic", ejemplo: "water, methanol, ethanol" }
  ];

  const temperaturas = [
    { id: 'baja', nombre: "Low/room temperature", ejemplo: '≈ 25 °C' },
    { id: 'alta', nombre: "High temperature", ejemplo: "≈ 80 °C or higher" }
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
    metilo: "Methyl substrate: unhindered and with no β carbons → only SN2 is possible.",
    primario: "Primary substrate: little hindered (SN2 accessible) and its carbocation would be too unstable (SN1/E1 almost nil).",
    secundario: "Secondary substrate: allows SN2 and E2; with weak reagents it can ionize slowly (SN1/E1).",
    terciario: "Tertiary substrate: steric hindrance blocks SN2, but its carbocation is stable (SN1/E1); with strong bases E2 dominates."
  };
  const T_REACTIVO = {
    'nu-fuerte': "Strong, weakly basic nucleophile: it attacks the carbon rather than removing protons (favors SN2).",
    'base-fuerte': "Small strong base: it can attack the carbon or remove a β-H; the balance depends on the substrate.",
    'base-voluminosa': "Bulky base: it cannot approach the hindered carbon, but it can remove a peripheral H → E2.",
    debil: "Weak reagent: it does not force bimolecular reactions; if anything happens, it goes through a carbocation (SN1/E1) and is slow."
  };
  const T_SOLVENTE = {
    aprotico: "Aprotic solvent: it does not solvate anions through hydrogen bonds → more reactive nucleophiles/bases (favors SN2/E2) and it does not stabilize ions (disfavors SN1/E1).",
    protico: "Protic solvent: it stabilizes carbocations and anions through hydrogen bonds → favors SN1/E1 and tempers anionic nucleophiles."
  };
  const T_TEMP = {
    alta: "High temperature: elimination gains ground (it releases more molecules: entropy increases).",
    baja: "Low temperature: substitution is favored over elimination."
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
    if (c.sustrato === 'metilo' && c.reactivo === 'debil') nota = "Solvolysis of a methyl halide is extremely slow: in practice it does not occur without a better nucleophile.";
    else if (c.sustrato === 'primario' && c.reactivo === 'debil') nota = "With a primary substrate and a weak reagent the reaction is very slow: a better nucleophile is needed.";
    else if (c.sustrato === 'secundario' && c.reactivo === 'debil') nota = "The secondary case with a weak reagent usually gives an SN1/E1 mixture (and possible carbocation rearrangements).";
    else if (c.sustrato === 'terciario' && c.reactivo === 'nu-fuerte') nota = "With a tertiary substrate there is no SN2; a good, weakly basic nucleophile in a protic medium rather triggers SN1.";

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
