/* chem-sn2.js — SN2: sustitución nucleofílica bimolecular (inversión de Walden).
 * Variantes: 'metilo' (bromometano + HO⁻) y 'butano' ((R)-2-bromobutano + HO⁻, estereogénico). */
(function (root) {
  'use strict';
  const Chem = root.Chem;
  const { V, K, S, step, lerp, basis, polar, methylHs, cip, fmt, DEG } = Chem;

  const XHAT = [1, 0, 0];
  const YHAT = [0, 1, 0];
  const bump = (t, a, b, c, d) => S(t, a, b) * (1 - S(t, c, d)); // sube en [a,b], baja en [c,d]

  function createSN2(variant) {
    const quiral = variant === 'butano';

    const dX = K([[0, 1.94], [0.5, 2.45], [0.72, 3.3], [1, 5.6]]);
    const dN = K([[0, 5.2], [0.25, 3.6], [0.5, 2.15], [0.75, 1.7], [1, 1.43]]);
    const alphaOf = t => lerp(107.5, 72.5, S(t, 0.12, 0.88)); // ángulo sustituyente–C–(eje +x)

    // Azimuts de los tres sustituyentes alrededor del eje de ataque (°)
    const AZ = quiral ? { et: 120, me: 0, h: 240 } : { a: 0, b: 120, c: 240 };

    const atoms = [
      { id: 'C', el: 'C', rotulo: quiral ? 'C2' : 'C' },
      { id: 'Br', el: 'Br' },
      { id: 'O', el: 'O' },
      { id: 'HO', el: 'H' }
    ];
    const bonds = [['C', 'Br'], ['C', 'O'], ['O', 'HO']];

    if (!quiral) {
      ['H1', 'H2', 'H3'].forEach(id => atoms.push({ id, el: 'H' }));
      ['H1', 'H2', 'H3'].forEach(id => bonds.push(['C', id]));
    } else {
      atoms.push({ id: 'H', el: 'H' }, { id: 'Cm', el: 'C', rotulo: 'C1' }, { id: 'Ce', el: 'C', rotulo: 'C3' }, { id: 'Cf', el: 'C', rotulo: 'C4' });
      ['Hm1', 'Hm2', 'Hm3', 'He1', 'He2', 'Hf1', 'Hf2', 'Hf3'].forEach(id => atoms.push({ id, el: 'H' }));
      bonds.push(['C', 'H'], ['C', 'Cm'], ['C', 'Ce'], ['Ce', 'Cf']);
      ['Hm1', 'Hm2', 'Hm3'].forEach(id => bonds.push(['Cm', id]));
      ['He1', 'He2'].forEach(id => bonds.push(['Ce', id]));
      ['Hf1', 'Hf2', 'Hf3'].forEach(id => bonds.push(['Cf', id]));
    }

    function frame(t) {
      const C = [0, 0, 0];
      const pos = { C };
      const aL = alphaOf(t);
      const s = S(t, 0.15, 0.85); // avance de la reacción (0,5 en el TS)

      pos.Br = [dX(t), 0, 0];
      pos.O = [-dN(t), 0, 0];
      const dirOH = [Math.cos(109 * DEG), Math.sin(109 * DEG), 0];
      pos.HO = V.mad(pos.O, dirOH, 0.96);

      if (!quiral) {
        pos.H1 = polar(C, XHAT, aL, AZ.a, 1.09, YHAT);
        pos.H2 = polar(C, XHAT, aL, AZ.b, 1.09, YHAT);
        pos.H3 = polar(C, XHAT, aL, AZ.c, 1.09, YHAT);
      } else {
        pos.H = polar(C, XHAT, aL, AZ.h, 1.09, YHAT);
        const uM = V.norm(polar(C, XHAT, aL, AZ.me, 1, YHAT));
        const uE = V.norm(polar(C, XHAT, aL, AZ.et, 1, YHAT));
        // metilo (C1)
        pos.Cm = V.scale(uM, 1.53);
        const hm = methylHs(pos.Cm, V.scale(uM, -1), XHAT, 20);
        pos.Hm1 = hm[0]; pos.Hm2 = hm[1]; pos.Hm3 = hm[2];
        // etilo (C3–C4)
        pos.Ce = V.scale(uE, 1.53);
        const [e1, e2] = basis(uE, XHAT);
        pos.Cf = V.add(pos.Ce, V.add(V.scale(uE, 0.573), V.scale(e2, 1.419)));
        const toC = V.scale(uE, -1);
        const vCf = V.norm(V.sub(pos.Cf, pos.Ce));
        const bis = V.norm(V.scale(V.add(toC, vCf), -1));
        const nrm = V.norm(V.cross(toC, vCf));
        const th = 53.5 * DEG;
        pos.He1 = V.add(pos.Ce, V.scale(V.add(V.scale(bis, Math.cos(th)), V.scale(nrm, Math.sin(th))), 1.09));
        pos.He2 = V.add(pos.Ce, V.scale(V.add(V.scale(bis, Math.cos(th)), V.scale(nrm, -Math.sin(th))), 1.09));
        const hf = methylHs(pos.Cf, V.norm(V.sub(pos.Ce, pos.Cf)), e1, 60);
        pos.Hf1 = hf[0]; pos.Hf2 = hf[1]; pos.Hf3 = hf[2];
      }

      const orders = {};
      bonds.forEach(b => (orders[b[0] + '-' + b[1]] = 1));
      orders['C-Br'] = 1 - s;
      orders['C-O'] = s;

      const q = { O: -(1 - s), Br: -s };

      // Flechas de movimiento de electrones (curvas)
      const dist = Math.abs(pos.O[0] - 0);
      const arrows = [
        {
          id: 'ataque',
          from: V.add(pos.O, [0.32, 0, 0]),
          to: [-0.45, 0, 0],
          bulge: [0, -(0.35 + 0.22 * dist), 0],
          alpha: bump(t, 0.0, 0.08, 0.72, 0.9),
          color: 0xffb020,
          rotulo: 'par libre → nuevo enlace C–O'
        },
        {
          id: 'salida',
          from: V.mid(C, pos.Br),
          to: V.add(pos.Br, [0.1, 0.5, 0]),
          bulge: [0, 0.55, 0],
          alpha: bump(t, 0.12, 0.26, 0.78, 0.94),
          color: 0xff5470,
          rotulo: 'enlace C–Br → Br⁻'
        }
      ];

      // Orbitales
      const orbs = [
        { id: 'lp', c: V.add(pos.O, [0.55, 0, 0]), a: [1, 0, 0], L: 0.6, W: 0.34, color: 'lp', alpha: 0.6 * (1 - S(t, 0.55, 0.9)) },
        { id: 'sig-back', c: [-0.95, 0, 0], a: [-1, 0, 0], L: 0.8, W: 0.52, color: 'pos', alpha: 0.42 * (1 - S(t, 0.38, 0.62)) },
        { id: 'sig-front', c: V.add(pos.Br, [-0.85, 0, 0]), a: [1, 0, 0], L: 0.45, W: 0.3, color: 'neg', alpha: 0.38 * (1 - S(t, 0.38, 0.62)) },
        { id: 'p+', c: [-0.8, 0, 0], a: [-1, 0, 0], L: 0.7, W: 0.45, color: 'pos', alpha: 0.5 * bump(t, 0.34, 0.46, 0.54, 0.68) },
        { id: 'p-', c: [0.8, 0, 0], a: [1, 0, 0], L: 0.7, W: 0.45, color: 'neg', alpha: 0.5 * bump(t, 0.34, 0.46, 0.54, 0.68) }
      ];

      // Medidas en vivo
      const aHC = quiral ? V.angle(pos.H, C, pos.Br) : V.angle(pos.H1, C, pos.Br);
      const medidas = [
        { id: 'dNu', etiqueta: 'd(C···O)', valor: V.dist(pos.O, C), unidad: 'Å', a: 'C', b: 'O' },
        { id: 'dX', etiqueta: 'd(C···Br)', valor: V.dist(pos.Br, C), unidad: 'Å', a: 'C', b: 'Br' },
        { id: 'ang', etiqueta: '∠ O–C–Br', valor: V.angle(pos.O, C, pos.Br), unidad: '°', a: null, b: null },
        { id: 'umb', etiqueta: '∠ H–C–Br', valor: aHC, unidad: '°', a: null, b: null },
        { id: 'ord', etiqueta: 'Orden C–Br / C–O', valor: fmt(1 - s, 2) + ' / ' + fmt(s, 2), unidad: '', texto: true }
      ];

      const extra = {};
      if (quiral) {
        const heavy = t < 0.5 ? pos.Br : pos.O;
        const r = cip(C, heavy, pos.Ce, pos.Cm);
        // planaridad: los tres sustituyentes que no reaccionan (etilo, metilo, H) coplanares con C
        const a1 = V.sub(pos.Ce, C), a2 = V.sub(pos.Cm, C), a3 = V.sub(pos.H, C);
        const relPlano = Math.abs(V.dot(V.cross(a1, a2), a3)) / (V.len(a1) * V.len(a2) * V.len(a3));
        const plano = relPlano < 0.06;
        extra.cip = { etiqueta: 'Configuración en C2', valor: plano ? 'plano (TS)' : '(' + r.label + ')', plano, letra: plano ? '—' : r.label };
      }

      return { pos, orders, q, arrows, orbs, medidas, extra, bondOff: {} };
    }

    const nombreSustrato = quiral ? '(R)-2-bromobutano' : 'bromometano (bromuro de metilo)';
    const productoNombre = quiral ? '(S)-butan-2-ol' : 'metanol';
    const formulaSustrato = quiral ? 'CH₃CH₂–CHBr–CH₃' : 'CH₃Br';

    return {
      id: 'sn2',
      variante: variant,
      corto: 'SN2',
      nombre: 'Sustitución nucleofílica bimolecular',
      titulo: 'SN2',
      subtitulo: nombreSustrato + ' + ion hidróxido',
      ecuacion: formulaSustrato + ' + HO⁻ → ' + (quiral ? 'CH₃CH₂–CH(OH)–CH₃' : 'CH₃OH') + ' + Br⁻',
      producto: productoNombre,
      cinetica: { ley: 'v = k [R–Br] [HO⁻]', orden: 2, orden_sustrato: 1, orden_nu: 1, texto: 'Bimolecular: la velocidad depende de ambos reactivos.' },
      pasos: 1,
      ideas: [
        'Un solo paso concertado: el enlace C–O se forma a la vez que se rompe el C–Br.',
        'Ataque dorsal (180°) sobre el σ* del enlace C–X → inversión de configuración (Walden).',
        'Velocidad: CH₃– > 1.º > 2.º ≫ 3.º (el impedimento estérico bloquea el ataque dorsal).',
        'Favorecida por nucleófilos fuertes y disolventes polares apróticos (DMSO, DMF, acetona).',
        'No hay intermediario: el estado de transición [‡] es un máximo de energía.'
      ],
      fases: [
        {
          id: 'aprox', t0: 0, t1: 0.36, nombre: 'Aproximación',
          texto: '<strong>Ataque dorsal.</strong> El ion hidróxido, con un par libre de electrones, se acerca al carbono electrofílico por la cara <em>opuesta</em> al bromo (180°). El orbital que recibe los electrones es el σ* del enlace C–Br: su lóbulo mayor está justo detrás del carbono.'
        },
        {
          id: 'ts', t0: 0.36, t1: 0.64, nombre: 'Estado de transición [‡]',
          texto: '<strong>[HO···CH₃···Br]<sup>⁻‡</sup></strong> El carbono es pentacoordinado: los tres sustituyentes quedan en un plano perpendicular al eje O···C···Br (bipirámide trigonal). Ambos enlaces son parciales (orden ≈ 0,5) y la carga negativa se reparte entre el nucleófilo y el grupo saliente. Es un máximo de energía, no un intermediario: no se puede aislar.'
        },
        {
          id: 'inv', t0: 0.64, t1: 1, nombre: 'Inversión y salida',
          texto: '<strong>Inversión de Walden.</strong> El enlace C–O se completa mientras el bromuro se aleja. Los sustituyentes se pliegan como un paraguas que se da vuelta en el viento.' + (quiral ? ' La disposición espacial de los tres grupos restantes queda invertida: (R)-2-bromobutano → (S)-butan-2-ol.' : ' En un carbono estereogénico, la configuración quedaría invertida.')
        }
      ],
      puntos: [
        { t: 0, tipo: 'R', etiqueta: 'Reactivos' },
        { t: 0.5, tipo: 'TS', etiqueta: '[‡]' },
        { t: 1, tipo: 'P', etiqueta: 'Productos' }
      ],
      energia: K([[0, 0], [0.18, -0.1], [0.5, 0.62], [0.82, -0.62], [1, -0.55]]),
      energiaEtiquetas: { ea: { t0: 0.18, t1: 0.5, texto: 'Eₐ' } },
      atoms,
      bonds,
      rastro: ['O', 'Br'],
      camaras: [
        { id: 'libre', nombre: 'Libre', dir: [0.18, 0.32, 1] },
        { id: 'eje', nombre: 'Eje de ataque', dir: [1, 0.12, 0.06] },
        { id: 'sup', nombre: 'Superior', dir: [0.02, 1, 0.05] }
      ],
      hayEsterogenico: quiral,
      frame
    };
  }

  Chem.scenarios.sn2 = { create: createSN2, variantes: [{ id: 'metilo', nombre: 'Bromometano' }, { id: 'butano', nombre: '(R)-2-bromobutano' }], variantePorDefecto: 'metilo' };
})(typeof window !== 'undefined' ? window : globalThis);
