/* chem-e2.js — E2: eliminación bimolecular concertada con geometría anti-periplanar.
 * Bromoetano + HO⁻ → eteno + H₂O + Br⁻ (modelo mínimo para ver el diedro H–C–C–Br = 180°). */
(function (root) {
  'use strict';
  const Chem = root.Chem;
  const { V, K, S, lerp, fmt, DEG } = Chem;

  const bump = (t, a, b, c, d) => S(t, a, b) * (1 - S(t, c, d));
  const ZHAT = [0, 0, 1];

  function dihedral(p0, p1, p2, p3) {
    const b0 = V.sub(p0, p1);
    const b1 = V.norm(V.sub(p2, p1));
    const b2 = V.sub(p3, p2);
    const v = V.sub(b0, V.scale(b1, V.dot(b0, b1)));
    const w = V.sub(b2, V.scale(b1, V.dot(b2, b1)));
    const x = V.dot(v, w);
    const y = V.dot(V.cross(b1, v), w);
    return Math.atan2(y, x) / DEG;
  }

  function createE2() {
    const atoms = [
      { id: 'Ca', el: 'C', rotulo: 'Cα' },
      { id: 'Cb', el: 'C', rotulo: 'Cβ' },
      { id: 'Br', el: 'Br' },
      { id: 'Ha1', el: 'H' }, { id: 'Ha2', el: 'H' },
      { id: 'Hb1', el: 'H' }, { id: 'Hb2', el: 'H' },
      { id: 'Hbe', el: 'H', rotulo: 'Hβ' },
      { id: 'O', el: 'O', rotulo: 'HO⁻' }, { id: 'HO', el: 'H' }
    ];
    const bonds = [
      ['Ca', 'Cb'], ['Ca', 'Br'], ['Ca', 'Ha1'], ['Ca', 'Ha2'],
      ['Cb', 'Hb1'], ['Cb', 'Hb2'], ['Cb', 'Hbe'], ['O', 'Hbe'], ['O', 'HO']
    ];

    const dCC = K([[0, 1.52], [0.5, 1.43], [1, 1.33]]);
    const dBr = K([[0, 1.94], [0.5, 2.45], [0.75, 3.5], [1, 5.5]]);
    const D = K([[0, 5.0], [0.25, 3.8], [0.5, 2.55], [0.8, 2.6], [1, 2.8]]);

    // Dirección desde un carbono: theta medido desde el eje C–C hacia fuera; phi en el plano (y,z) desde +y
    function dir(side, theta, phi) {
      const th = theta * DEG;
      const ph = phi * DEG;
      return [side * Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph)];
    }

    function frame(t) {
      const p = S(t, 0.15, 0.85); // avance concertado (0,5 en el TS)
      const h = dCC(t) / 2;
      const Ca = [h, 0, 0];
      const Cb = [-h, 0, 0];
      const pos = { Ca, Cb };

      const thLeave = lerp(70.5, 90, p); // Br y Hβ se alinean con el eje del p que se forma
      const thPlano = lerp(70.5, 58.7, p); // los demás H pasan a sp²
      pos.Br = V.mad(Ca, dir(1, thLeave, 180), dBr(t));
      pos.Ha1 = V.mad(Ca, dir(1, thPlano, lerp(60, 90, p)), 1.09);
      pos.Ha2 = V.mad(Ca, dir(1, thPlano, lerp(300, 270, p)), 1.09);
      pos.Hb1 = V.mad(Cb, dir(-1, thPlano, lerp(120, 90, p)), 1.09);
      pos.Hb2 = V.mad(Cb, dir(-1, thPlano, lerp(240, 270, p)), 1.09);

      // Hβ y base: el protón viaja sobre la línea C···H···O
      const dHb = dir(-1, thLeave, 0);
      const DD = D(t);
      const dCH = lerp(1.09, DD - 0.97, p);
      pos.Hbe = V.mad(Cb, dHb, dCH);
      pos.O = V.mad(Cb, dHb, DD);
      const perp = V.norm([-dHb[1], dHb[0], 0]);
      const dOH = V.add(V.scale(dHb, Math.cos(71 * DEG)), V.scale(perp, Math.sin(71 * DEG)));
      pos.HO = V.mad(pos.O, dOH, 0.96);

      const orders = {};
      bonds.forEach(b => (orders[b[0] + '-' + b[1]] = 1));
      orders['Ca-Cb'] = 1 + p;
      orders['Ca-Br'] = 1 - p;
      orders['Cb-Hbe'] = 1 - p;
      orders['O-Hbe'] = p;

      const q = { O: -(1 - p), Br: -p };

      const arrows = [
        {
          id: 'base', from: V.mad(pos.O, dHb, -0.3), to: V.mad(Cb, dHb, Math.min(dCH, 1.25)),
          bulge: V.scale(perp, 0.55 + 0.1 * DD), alpha: bump(t, 0.0, 0.08, 0.85, 0.96), color: 0xffb020,
          rotulo: "lone pair of HO⁻ → H⁺"
        },
        {
          id: 'pi', from: V.mid(Cb, pos.Hbe), to: V.mid(Ca, Cb),
          bulge: [0, 0.65, 0.0], alpha: bump(t, 0.08, 0.18, 0.82, 0.95), color: 0x36d6c8,
          rotulo: "C–H bond → π bond"
        },
        {
          id: "leaving", from: V.mid(Ca, pos.Br), to: V.add(pos.Br, [0.1, -0.5, 0]),
          bulge: [0.3, -0.5, 0], alpha: bump(t, 0.08, 0.18, 0.82, 0.95), color: 0xff5470,
          rotulo: "C–Br bond → Br⁻"
        }
      ];

      const ang = V.norm(V.sub(Ca, Cb));
      const orbs = [
        { id: 'lp', c: V.mad(pos.O, dHb, -0.55), a: V.scale(dHb, -1), L: 0.55, W: 0.32, color: 'lp', alpha: 0.6 * (1 - S(t, 0.5, 0.9)) },
        // p individuales sobre/bajo cada C (ya paralelos a Hβ–Br)
        { id: 'pa+', c: V.add(Ca, [0, 0.62, 0]), a: [0, 1, 0], L: 0.6, W: 0.34, color: 'pos', alpha: 0.5 * bump(t, 0.18, 0.34, 0.56, 0.78) },
        { id: 'pa-', c: V.add(Ca, [0, -0.62, 0]), a: [0, -1, 0], L: 0.6, W: 0.34, color: 'neg', alpha: 0.5 * bump(t, 0.18, 0.34, 0.56, 0.78) },
        { id: 'pb+', c: V.add(Cb, [0, 0.62, 0]), a: [0, 1, 0], L: 0.6, W: 0.34, color: 'pos', alpha: 0.5 * bump(t, 0.18, 0.34, 0.56, 0.78) },
        { id: 'pb-', c: V.add(Cb, [0, -0.62, 0]), a: [0, -1, 0], L: 0.6, W: 0.34, color: 'neg', alpha: 0.5 * bump(t, 0.18, 0.34, 0.56, 0.78) },
        // π final: dos lóbulos que abarcan ambos carbonos
        { id: 'pi+', c: [0, 0.62, 0], a: ang, L: h + 0.55, W: 0.34, color: 'pos', alpha: 0.55 * S(t, 0.58, 0.9) },
        { id: 'pi-', c: [0, -0.62, 0], a: ang, L: h + 0.55, W: 0.34, color: 'neg', alpha: 0.55 * S(t, 0.58, 0.9) }
      ];

      const diedro = Math.abs(dihedral(pos.Hbe, Cb, Ca, pos.Br));
      const medidas = [
        { id: 'dCH', etiqueta: 'd(Cβ···H)', valor: V.dist(Cb, pos.Hbe), unidad: 'Å', a: 'Cb', b: 'Hbe' },
        { id: 'dOH', etiqueta: 'd(O···H)', valor: V.dist(pos.O, pos.Hbe), unidad: 'Å', a: 'O', b: 'Hbe' },
        { id: 'dBr', etiqueta: 'd(Cα···Br)', valor: V.dist(Ca, pos.Br), unidad: 'Å', a: 'Ca', b: 'Br' },
        { id: 'dCC', etiqueta: 'd(Cα–Cβ)', valor: V.dist(Ca, Cb), unidad: 'Å', a: 'Ca', b: 'Cb' },
        { id: 'die', etiqueta: "H–C–C–Br dihedral", valor: diedro, unidad: '°', a: null, b: null },
        { id: 'ord', etiqueta: "C–C order", valor: fmt(1 + p, 2), unidad: '', texto: true }
      ];
      const extra = { hib: { etiqueta: "C–C carbons", valor: p < 0.5 ? 'sp³ → sp²' : "sp² (planar)" } };
      return { pos, orders, q, arrows, orbs, medidas, extra, bondOff: { 'Ca-Cb': [0, 0, 1] } };
    }

    return {
      id: 'e2', variante: 'unico', corto: 'E2', nombre: "Bimolecular elimination", titulo: 'E2',
      subtitulo: "bromoethane + hydroxide ion (minimal model)",
      ecuacion: 'CH₃CH₂Br + HO⁻ → CH₂=CH₂ + H₂O + Br⁻',
      producto: "ethene (ethylene)",
      cinetica: { ley: 'v = k [R–Br] [HO⁻]', orden: 2, orden_sustrato: 1, orden_nu: 1, texto: "Bimolecular: the base takes part in the rate-determining step." },
      pasos: 1,
      ideas: [
        "A single concerted step: the base removes the β-H as the leaving group departs.",
        "Bimolecular rate law: v = k[R–Br][base].",
        "Anti-periplanar geometry (H–C–C–Br dihedral = 180°): maximum σ(C–H) → σ*(C–Br) overlap.",
        "Strong bases (HO⁻, RO⁻); bulky bases (tert-butoxide) favor E2 over SN2.",
        "Zaitsev: the more substituted alkene predominates; with a bulky base, the Hofmann product.",
        "With a primary substrate such as bromoethane, SN2 competes; 2° and 3° substrates favor E2."
      ],
      fases: [
        { id: 'aprox', t0: 0, t1: 0.3, nombre: "Anti-periplanar approach", texto: "<strong>The base approaches the β-H.</strong> For maximum overlap, the H and the Br must lie on opposite sides of the C–C bond: <em>anti-periplanar arrangement</em> (H–C–C–Br dihedral = 180°). Try the “Newman” view to see it head-on." },
        { id: 'ts', t0: 0.3, t1: 0.7, nombre: "Transition state [‡]", texto: "<strong>Everything happens at once.</strong> The lone pair of HO⁻ bonds to the H, the C–H bond breaks, the π bond forms between the carbons and Br⁻ leaves. The σ(C–H) and σ*(C–Br) orbitals are parallel and overlap: the C–C bond order is ≈ 1.5. The other substituents rotate into a common plane (sp³ → sp²)." },
        { id: 'alq', t0: 0.7, t1: 1, nombre: "Alkene", texto: "<strong>Planar ethene.</strong> All six atoms lie in one plane; the double bond (σ + π) measures ≈ 1.33 Å. The H ends up in the water and the bromide moves away." }
      ],
      puntos: [
        { t: 0, tipo: 'R', etiqueta: "Reactants" },
        { t: 0.5, tipo: 'TS', etiqueta: '[‡]' },
        { t: 1, tipo: 'P', etiqueta: "Products" }
      ],
      energia: K([[0, 0], [0.18, -0.08], [0.5, 0.95], [0.85, -0.2], [1, -0.15]]),
      energiaEtiquetas: { ea: { t0: 0.18, t1: 0.5, texto: 'Eₐ' } },
      atoms, bonds,
      rastro: ['O', 'Br', 'Hbe'],
      camaras: [
        { id: 'libre', nombre: "Free", dir: [0.25, 0.3, 1] },
        { id: 'newman', nombre: "Newman (C–C axis)", dir: [1, 0.001, 0.001] },
        { id: 'sup', nombre: "Top", dir: [0.02, 1, 0.1] }
      ],
      frame
    };
  }

  Chem.scenarios.e2 = { create: createE2, variantes: [{ id: 'unico', nombre: '' }], variantePorDefecto: 'unico' };
})(typeof window !== 'undefined' ? window : globalThis);
