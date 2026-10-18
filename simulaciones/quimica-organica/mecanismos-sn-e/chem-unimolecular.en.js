/* chem-unimolecular.js — SN1 y E1: comparten la ionización de (CH₃)₃C–Br y el carbocatión.
 * SN1: 2-bromo-2-metilpropano + 2 H₂O → 2-metilpropan-2-ol + H₃O⁺ + Br⁻  (3 etapas)
 * E1 : 2-bromo-2-metilpropano + H₂O   → 2-metilpropeno + H₃O⁺ + Br⁻       (2 etapas) */
(function (root) {
  'use strict';
  const Chem = root.Chem;
  const { V, K, S, ss, clamp01, lerp, polar, basis, methylHs, waterHs, fmt, DEG } = Chem;

  const XHAT = [1, 0, 0];
  const YHAT = [0, 1, 0];
  const ZHAT = [0, 0, 1];
  const bump = (t, a, b, c, d) => S(t, a, b) * (1 - S(t, c, d));
  const C0 = [0, 0, 0];

  /* Ionización compartida por SN1 y E1 */
  const dBr = K([[0, 1.97], [0.1, 2.8], [0.22, 4.0], [0.34, 4.8], [1, 6.2]]);
  const ordenBr = d => 1 - ss(clamp01((d - 1.97) / (3.3 - 1.97)));

  /* Átomos y enlaces del esqueleto (CH₃)₃C–Br */
  function esqueleto() {
    const atoms = [
      { id: 'C', el: 'C', rotulo: 'C⁺' },
      { id: 'Br', el: 'Br' },
      { id: 'M1', el: 'C', rotulo: 'CH₃' },
      { id: 'M2', el: 'C', rotulo: 'CH₃' },
      { id: 'M3', el: 'C', rotulo: 'CH₃' }
    ];
    const bonds = [['C', 'Br'], ['C', 'M1'], ['C', 'M2'], ['C', 'M3']];
    ['a', 'b', 'c'].forEach((l, i) => {
      [1, 2, 3].forEach(k => {
        atoms.push({ id: 'H' + l + k, el: 'H' });
        bonds.push(['M' + (i + 1), 'H' + l + k]);
      });
    });
    return { atoms, bonds };
  }

  /* Carbonos metilo en el cono de ángulo alpha desde +x */
  function metilos(alpha, L) {
    return [0, 120, 240].map((az, i) => polar(C0, XHAT, alpha, az, L[i], YHAT));
  }
  function hsMetilo(M, phi0) {
    return methylHs(M, V.scale(V.norm(M), -1), XHAT, phi0);
  }
  function suma3(pos) {
    return V.angle(pos.M1, C0, pos.M2) + V.angle(pos.M2, C0, pos.M3) + V.angle(pos.M3, C0, pos.M1);
  }

  /* Flechas de hiperconjugación: C–H alineado con el p vacío → C⁺ */
  function flechasHiper(pos, alpha) {
    return ['a', 'b', 'c'].map((l, i) => ({
      id: 'hiper' + l,
      grupo: 'hiper',
      from: V.mid(pos['M' + (i + 1)], pos['H' + l + '1']),
      to: [0.42, 0, 0],
      bulge: V.scale(V.norm(pos['M' + (i + 1)]), 0.55),
      alpha: alpha,
      color: 0x36d6c8,
      rotulo: "σ(C–H) → empty p"
    }));
  }

  /* ============================== SN1 ============================== */
  function createSN1(variant) {
    const f = variant === 'misma' ? 1 : -1; // cara de ataque: -1 = opuesta al Br⁻, +1 = misma cara
    const { atoms, bonds } = esqueleto();
    atoms.push({ id: 'O1', el: 'O', rotulo: 'OH₂' }, { id: 'Hw1', el: 'H' }, { id: 'Hw2', el: 'H' },
      { id: 'O2', el: 'O', rotulo: 'H₂O' }, { id: 'Hv1', el: 'H' }, { id: 'Hv2', el: 'H' });
    bonds.push(['O1', 'Hw1'], ['O1', 'Hw2'], ['O2', 'Hv1'], ['O2', 'Hv2'], ['O2', 'Hw1'], ['C', 'O1']);
    const faltaO2 = new Set(['O2', 'Hv1', 'Hv2']);

    const dO = K([[0, 6.2], [0.42, 5.0], [0.55, 2.7], [0.62, 1.9], [0.7, 1.52], [1, 1.5]]);
    const ordenO = d => ss(clamp01((3.2 - d) / (3.2 - 1.5)));
    const DOO = K([[0, 6.5], [0.6, 5.0], [0.74, 3.6], [0.87, 2.5], [1, 2.65]]);
    const aF = [f, 0, 0];
    const thetaMax = f > 0 ? 55 : 0; // deriva del Br⁻ para no chocar con el agua
    const aliniado = f > 0 ? 60 : 0;

    // Dirección O1→H1 fija (pose final del oxonio), para la transferencia del protón
    const hFinal = waterHs([f * 1.5, 0, 0], aF, 68, 122.8, YHAT, 0.97);
    const dirH = V.norm(V.sub(hFinal[0], [f * 1.5, 0, 0]));

    function frame(t) {
      const pos = { C: C0 };
      const d = dBr(t);
      const oB = ordenBr(d);
      const pI = 1 - oB;
      const dOx = dO(t);
      const pA = ordenO(dOx);
      const g = S(t, 0.78, 0.96); // avance de la transferencia del protón

      // Br⁻ (deriva lateral si la cara de ataque es la misma)
      const th = S(t, 0.15, 0.4) * thetaMax * DEG;
      pos.Br = [d * Math.cos(th), -d * Math.sin(th), 0];

      // Metilos: tetraédrico → plano (cation) → tetraédrico (ataque)
      let alpha = lerp(107.5, 90, pI);
      alpha = alpha + (f > 0 ? 109.5 - 90 : 70.5 - 90) * pA;
      const Lc = lerp(1.53, 1.47, pI) + 0.06 * pA;
      const L3 = [Lc, Lc, Lc];
      const M = metilos(alpha, L3);
      pos.M1 = M[0]; pos.M2 = M[1]; pos.M3 = M[2];
      const phiEff = aliniado ? lerp(lerp(60, 0, S(t, 0, 0.3)), 60, S(t, 0.45, 0.72)) : lerp(60, 0, S(t, 0, 0.3));
      ['a', 'b', 'c'].forEach((l, i) => {
        const hs = hsMetilo(M[i], phiEff);
        pos['H' + l + '1'] = hs[0]; pos['H' + l + '2'] = hs[1]; pos['H' + l + '3'] = hs[2];
      });

      // Agua 1 (nucleófilo) y su transición hacia oxonio
      pos.O1 = V.scale(aF, dOx);
      const a1 = lerp(52.25, 68, pA);
      const dpsi = lerp(180, 122.8, pA);
      const w1 = waterHs(pos.O1, aF, a1, dpsi, YHAT, 0.97);
      pos.Hw1 = w1[0]; pos.Hw2 = w1[1];

      // Agua 2 (base): recibe el protón Hw1
      const doo = DOO(t);
      pos.O2 = V.mad(pos.O1, dirH, doo);
      const dOH1 = lerp(0.97, doo - 0.99, g);
      const a2 = lerp(52.25, 67, g);
      const dpsi2 = lerp(180, 130, g);
      const w2 = waterHs(pos.O2, dirH, a2, dpsi2, ZHAT, 0.97);
      pos.Hv1 = w2[0]; pos.Hv2 = w2[1];
      // Hw1 (el protón que se transfiere) sigue la pose de O1 y migra hacia O2
      const dirW = V.norm(V.sub(w1[0], pos.O1));
      pos.Hw1 = V.mad(pos.O1, V.norm(V.lerp(dirW, dirH, g)), dOH1);

      const orders = {};
      bonds.forEach(b => (orders[b[0] + '-' + b[1]] = 1));
      orders['C-Br'] = oB;
      orders['C-O1'] = pA;
      orders['O1-Hw1'] = 1 - g;
      orders['O2-Hw1'] = g;

      const q = { C: pI - pA, Br: -pI, O1: pA * (1 - g), O2: g };
      const alpha_ = {};
      faltaO2.forEach(id => (alpha_[id] = S(t, 0.4, 0.55)));

      // Flechas
      const arrows = [
        {
          id: 'ioniza', from: V.mid(C0, pos.Br), to: V.add(pos.Br, [0.1, 0.5, 0]), bulge: [0, 0.6, 0],
          alpha: bump(t, 0.0, 0.06, 0.2, 0.32), color: 0xff5470, rotulo: "C–Br bond → Br⁻"
        },
        {
          id: "attack", from: V.add(pos.O1, V.scale(aF, -0.3)), to: V.scale(aF, 0.45),
          bulge: [0, -(0.35 + 0.2 * dOx), 0], alpha: bump(t, 0.4, 0.47, 0.62, 0.72), color: 0xffb020,
          rotulo: "lone pair of H₂O → C⁺"
        },
        {
          id: 'prot-a', from: V.mad(pos.O2, dirH, -0.32), to: V.mad(pos.O1, dirH, Math.min(dOH1, 1.2)),
          bulge: V.scale(V.norm(V.cross(dirH, YHAT)), 0.6), alpha: bump(t, 0.74, 0.8, 0.9, 0.96), color: 0xffb020,
          rotulo: "lone pair → H⁺"
        },
        {
          id: 'prot-b', from: V.mid(pos.O1, V.mad(pos.O1, dirH, Math.min(dOH1, 1.2))), to: V.mad(pos.O1, dirH, -0.25),
          bulge: V.scale(V.norm(V.cross(dirH, YHAT)), -0.55), alpha: bump(t, 0.74, 0.8, 0.9, 0.96), color: 0xff5470,
          rotulo: "O–H bond → O"
        },
        ...flechasHiper(pos, bump(t, 0.24, 0.34, 0.42, 0.5))
      ];

      // Orbitales
      const pvac = bump(t, 0.16, 0.3, 0.44, 0.66);
      const orbs = [
        { id: 'p+', c: [0.75, 0, 0], a: [1, 0, 0], L: 0.7, W: 0.45, color: 'pos', alpha: 0.5 * pvac },
        { id: 'p-', c: [-0.75, 0, 0], a: [-1, 0, 0], L: 0.7, W: 0.45, color: 'neg', alpha: 0.5 * pvac },
        { id: 'lp1', c: V.add(pos.O1, V.scale(aF, -0.55)), a: V.scale(aF, -1), L: 0.55, W: 0.32, color: 'lp', alpha: 0.6 * bump(t, 0.38, 0.5, 0.58, 0.72) }
      ];

      const sum = suma3(pos);
      const medidas = [
        { id: 'dBr', etiqueta: 'd(C···Br)', valor: V.dist(C0, pos.Br), unidad: 'Å', a: 'C', b: 'Br' },
        { id: 'dO', etiqueta: 'd(C···O)', valor: dOx, unidad: 'Å', a: 'C', b: 'O1' },
        { id: 'sum', etiqueta: 'Σ ∠ C–C–C', valor: sum, unidad: '°', a: null, b: null },
        { id: 'ord', etiqueta: "C–Br / C–O order", valor: fmt(oB, 2) + ' / ' + fmt(pA, 2), unidad: '', texto: true }
      ];
      const extra = { hib: { etiqueta: "Central carbon", valor: sum > 350 ? "sp² (planar)" : "sp³ (tetrahedral)" } };
      return { pos, orders, q, arrows, orbs, medidas, extra, alphaAtoms: alpha_, bondOff: {} };
    }

    return {
      id: 'sn1', variante: variant, corto: 'SN1', nombre: "Unimolecular nucleophilic substitution", titulo: 'SN1',
      subtitulo: "2-bromo-2-methylpropane (tert-butyl bromide) + water",
      ecuacion: '(CH₃)₃C–Br + 2 H₂O → (CH₃)₃C–OH + H₃O⁺ + Br⁻',
      producto: "2-methylpropan-2-ol (tert-butanol)",
      cinetica: { ley: 'v = k [R–Br]', orden: 1, orden_sustrato: 1, orden_nu: 0, texto: "Unimolecular: the slow step involves only the substrate." },
      pasos: 3,
      ideas: [
        "Two stages (plus a deprotonation): slow ionization and fast nucleophilic attack.",
        "Unimolecular rate law: v = k[R–Br]; it does not depend on the nucleophile concentration.",
        "Reactivity: 3° > 2° ≫ 1° (carbocation stability through hyperconjugation and inductive effects).",
        "Favored by polar protic solvents (they stabilize ions) and weak nucleophiles.",
        "The carbocation is planar: the nucleophile attacks from both faces → racemization.",
        "A carbocation can rearrange (hydride or methyl shift) toward a more stable one."
      ],
      fases: [
        { id: 'ioniz', t0: 0, t1: 0.3, nombre: "Ionization (slow step)", texto: "<strong>Heterolytic cleavage.</strong> The C–Br bond lengthens and breaks without help from the nucleophile: both electrons stay on the bromine (Br⁻). This unimolecular step is the slowest, so it <em>determines the rate</em>. As the bond weakens, the three methyls flatten toward a trigonal planar geometry." },
        { id: 'cat', t0: 0.3, t1: 0.42, nombre: "Carbocation (intermediate)", texto: "<strong>(CH₃)₃C⁺</strong> — trigonal planar sp² carbon (Σ of C–C–C angles = 360°) with an empty p orbital perpendicular to the plane. It is stabilized by <em>hyperconjugation</em> (the C–H bonds aligned with the empty p donate electron density to it) and by the inductive effect of the methyls. It is an energy minimum: a real intermediate, though a very reactive one." },
        { id: "attack", t0: 0.42, t1: 0.72, nombre: "Nucleophilic attack", texto: "<strong>Water, a weak nucleophile,</strong> attacks the empty p orbital. Since the carbocation is planar, both faces are accessible: at a stereogenic carbon a racemic mixture would form (with a slight excess of inversion due to the ion pair). An oxonium ion, R–OH₂⁺, is generated." },
        { id: 'desprot', t0: 0.72, t1: 1, nombre: "Deprotonation", texto: "<strong>Fast acid–base step.</strong> Another water molecule (the solvent) removes a proton from the oxonium: 2-methylpropan-2-ol and H₃O⁺ are formed." }
      ],
      puntos: [
        { t: 0, tipo: 'R', etiqueta: "Reactants" },
        { t: 0.1, tipo: 'TS', etiqueta: '[‡]₁' },
        { t: 0.38, tipo: 'INT', etiqueta: 'R⁺' },
        { t: 0.55, tipo: 'TS', etiqueta: '[‡]₂' },
        { t: 0.72, tipo: 'INT', etiqueta: 'R–OH₂⁺' },
        { t: 0.87, tipo: 'TS', etiqueta: '[‡]₃' },
        { t: 1, tipo: 'P', etiqueta: "Products" }
      ],
      energia: K([[0, 0], [0.1, 1.0], [0.38, 0.6], [0.55, 0.68], [0.72, 0.3], [0.87, 0.42], [1, -0.2]]),
      energiaEtiquetas: { ea: { t0: 0, t1: 0.1, texto: "Eₐ (slow step)" } },
      atoms, bonds,
      rastro: ['O1', 'Br'],
      camaras: [
        { id: 'libre', nombre: "Free", dir: [0.25, 0.4, 1] },
        { id: 'plano', nombre: "Cation plane", dir: [1, 0.08, 0.04] },
        { id: 'sup', nombre: "Top", dir: [0.04, 1, 0.1] }
      ],
      variantesInfo: 'cara',
      hayCara: true,
      frame
    };
  }

  /* ============================== E1 ============================== */
  function createE1() {
    const { atoms, bonds } = esqueleto();
    atoms.push({ id: 'O1', el: 'O', rotulo: 'H₂O' }, { id: 'Hw1', el: 'H' }, { id: 'Hw2', el: 'H' });
    bonds.push(['O1', 'Hw1'], ['O1', 'Hw2']);
    // Hβ es Ha1 (H de M1 alineado con el p vacío)
    bonds.push(['O1', 'Ha1']);

    const D = K([[0, 7], [0.44, 5.5], [0.6, 3.2], [0.7, 2.55], [0.85, 2.6], [1, 2.7]]);
    const thetaMax = 20;

    function frame(t) {
      const pos = { C: C0 };
      const d = dBr(t);
      const oB = ordenBr(d);
      const pI = 1 - oB;
      const g = S(t, 0.55, 0.85);
      const th = S(t, 0.15, 0.4) * thetaMax * DEG;
      pos.Br = [d * Math.cos(th), -d * Math.sin(th), 0];

      // Metilos: tetraédrico → plano; M1 se acorta (C=C)
      const alpha = lerp(107.5, 90, pI);
      const L1 = lerp(lerp(1.53, 1.47, pI), 1.34, g);
      const L23 = lerp(lerp(1.53, 1.47, pI), 1.51, g);
      const M = metilos(alpha, [L1, L23, L23]);
      pos.M1 = M[0]; pos.M2 = M[1]; pos.M3 = M[2];
      const phi0 = lerp(60, 0, S(t, 0, 0.3));
      ['b', 'c'].forEach(l => {
        const i = l === 'b' ? 1 : 2;
        const hs = hsMetilo(M[i], phi0);
        pos['H' + l + '1'] = hs[0]; pos['H' + l + '2'] = hs[1]; pos['H' + l + '3'] = hs[2];
      });

      // M1: Hβ (φ = 0) y los otros dos H, que se aplanan al formarse el alqueno
      const w = V.scale(V.norm(pos.M1), -1);
      const [e1, e2] = basis(w, XHAT);
      const ca = Math.cos(109.5 * DEG);
      const sa = Math.sin(109.5 * DEG);
      const dirHbFinal = V.norm(V.add(V.scale(w, ca), V.scale(e1, sa)));
      const ph0 = phi0 * DEG;
      const dirHb = V.norm(V.add(V.scale(w, ca), V.scale(V.add(V.scale(e1, Math.cos(ph0)), V.scale(e2, Math.sin(ph0))), sa)));
      const DD = D(t);
      const dCH = lerp(1.09, DD - 0.98, g);
      pos.Ha1 = V.mad(pos.M1, dirHb, dCH);
      [120, 240].forEach((k, idx) => {
        const az = (lerp(k + phi0, idx === 0 ? 90 : 270, g)) * DEG;
        const thH = lerp(109.5, 121.3, g) * DEG;
        const rad = V.add(V.scale(e1, Math.cos(az)), V.scale(e2, Math.sin(az)));
        pos['Ha' + (idx + 2)] = V.add(pos.M1, V.scale(V.add(V.scale(w, Math.cos(thH)), V.scale(rad, Math.sin(thH))), 1.09));
      });

      // Agua (base): O alineado con el enlace M1–Hβ
      pos.O1 = V.mad(pos.M1, dirHbFinal, DD);
      const a1 = lerp(52.25, 67, g);
      const dpsi = lerp(180, 130, g);
      const wh = waterHs(pos.O1, dirHbFinal, a1, dpsi, ZHAT, 0.97);
      pos.Hw1 = wh[0]; pos.Hw2 = wh[1];

      const orders = {};
      bonds.forEach(b => (orders[b[0] + '-' + b[1]] = 1));
      orders['C-Br'] = oB;
      orders['C-M1'] = 1 + g;
      orders['M1-Ha1'] = 1 - g;
      orders['O1-Ha1'] = g;

      const q = { C: pI * (1 - g), Br: -pI, O1: g };

      const mid = V.mid(pos.M1, pos.Ha1);
      const arrows = [
        {
          id: 'ioniza', from: V.mid(C0, pos.Br), to: V.add(pos.Br, [0.1, 0.5, 0]), bulge: [0, 0.6, 0],
          alpha: bump(t, 0.0, 0.06, 0.2, 0.32), color: 0xff5470, rotulo: "C–Br bond → Br⁻"
        },
        {
          id: 'base', from: V.mad(pos.O1, dirHbFinal, -0.3), to: V.mad(pos.M1, dirHbFinal, Math.min(dCH, 1.25)),
          bulge: V.scale(V.norm(V.cross(dirHbFinal, ZHAT)), 0.5), alpha: bump(t, 0.46, 0.54, 0.86, 0.96), color: 0xffb020,
          rotulo: "lone pair of H₂O → H⁺"
        },
        {
          id: 'pi', from: mid, to: V.mid(C0, pos.M1),
          bulge: V.add(V.scale(V.norm(pos.M1), 0.2), [0.65, 0, 0]), alpha: bump(t, 0.5, 0.58, 0.86, 0.96), color: 0xff5470,
          rotulo: "C–H bond → π bond"
        },
        ...flechasHiper(pos, bump(t, 0.24, 0.34, 0.42, 0.5))
      ];

      const pvac = bump(t, 0.16, 0.3, 0.46, 0.7) + 0.0;
      const orbs = [
        { id: 'p+', c: [0.75, 0, 0], a: [1, 0, 0], L: 0.7, W: 0.45, color: 'pos', alpha: 0.5 * pvac },
        { id: 'p-', c: [-0.75, 0, 0], a: [-1, 0, 0], L: 0.7, W: 0.45, color: 'neg', alpha: 0.5 * pvac },
        // π en formación y final: lóbulos sobre y bajo el plano del alqueno (eje x)
        { id: 'pi+', c: V.add(V.mid(C0, pos.M1), [0.5, 0, 0]), a: V.norm(pos.M1), L: 0.55 + 0.4 * g, W: 0.3 + 0.1 * g, color: 'pos', alpha: 0.55 * S(t, 0.62, 0.85), eje: 'largo' },
        { id: 'pi-', c: V.add(V.mid(C0, pos.M1), [-0.5, 0, 0]), a: V.norm(pos.M1), L: 0.55 + 0.4 * g, W: 0.3 + 0.1 * g, color: 'neg', alpha: 0.55 * S(t, 0.62, 0.85), eje: 'largo' }
      ];

      const sum = suma3(pos);
      const medidas = [
        { id: 'dBr', etiqueta: 'd(C···Br)', valor: V.dist(C0, pos.Br), unidad: 'Å', a: 'C', b: 'Br' },
        { id: 'dCH', etiqueta: 'd(Cβ–H)', valor: V.dist(pos.M1, pos.Ha1), unidad: 'Å', a: 'M1', b: 'Ha1' },
        { id: 'dOH', etiqueta: 'd(O···H)', valor: V.dist(pos.O1, pos.Ha1), unidad: 'Å', a: 'O1', b: 'Ha1' },
        { id: 'dCC', etiqueta: 'd(C–Cβ)', valor: V.dist(C0, pos.M1), unidad: 'Å', a: 'C', b: 'M1' },
        { id: 'ord', etiqueta: "C–Cβ order", valor: fmt(1 + g, 2), unidad: '', texto: true }
      ];
      const extra = { hib: { etiqueta: "Central carbon", valor: sum > 350 ? "sp² (planar)" : "sp³ (tetrahedral)" } };
      return { pos, orders, q, arrows, orbs, medidas, extra, bondOff: { 'C-M1': [0, 0, 1] } };
    }

    return {
      id: 'e1', variante: 'unico', corto: 'E1', nombre: "Unimolecular elimination", titulo: 'E1',
      subtitulo: "2-bromo-2-methylpropane (tert-butyl bromide) + water",
      ecuacion: '(CH₃)₃C–Br + H₂O → (CH₃)₂C=CH₂ + H₃O⁺ + Br⁻',
      producto: "2-methylpropene (isobutene)",
      cinetica: { ley: 'v = k [R–Br]', orden: 1, orden_sustrato: 1, orden_nu: 0, texto: "Unimolecular: the base does not take part in the slow step." },
      pasos: 2,
      ideas: [
        "Same first step as SN1: both mechanisms share the carbocation, which is why they compete.",
        "Unimolecular rate law: v = k[R–Br]. The weak base enters after the slow step.",
        "At least one H on a β carbon is needed; here there are 9 possible.",
        "Zaitsev's rule: the more substituted (more stable) alkene predominates.",
        "High temperatures favor E1 over SN1 (elimination increases entropy).",
        "It does not require the strict anti-periplanar geometry of E2: the cation is already planar."
      ],
      fases: [
        { id: 'ioniz', t0: 0, t1: 0.3, nombre: "Ionization (slow step)", texto: "<strong>Identical to the first step of SN1.</strong> The C–Br bond breaks heterolytically and leaves a planar tertiary carbocation. It is the rate-determining step." },
        { id: 'cat', t0: 0.3, t1: 0.46, nombre: "Carbocation: branching point", texto: "<strong>(CH₃)₃C⁺</strong> can be attacked by water (→ SN1) or lose a proton from a neighboring carbon (→ E1). The C–H bonds aligned with the empty p orbital point toward the base; hyperconjugation is already weakening them." },
        { id: 'desprot', t0: 0.46, t1: 0.78, nombre: "β-Deprotonation", texto: "<strong>A weak base (H₂O)</strong> removes the H from the β carbon. The electrons of the C–H bond shift to form the π bond with the cationic carbon. The β carbon goes from sp³ to sp² and the C–C bond shortens." },
        { id: 'alq', t0: 0.78, t1: 1, nombre: "Alkene", texto: "Planar <strong>2-methylpropene</strong>: the C=C double bond (σ + π) has a length of ≈ 1.34 Å. H₃O⁺ appears, and Br⁻ remains free in solution." }
      ],
      puntos: [
        { t: 0, tipo: 'R', etiqueta: "Reactants" },
        { t: 0.1, tipo: 'TS', etiqueta: '[‡]₁' },
        { t: 0.38, tipo: 'INT', etiqueta: 'R⁺' },
        { t: 0.7, tipo: 'TS', etiqueta: '[‡]₂' },
        { t: 1, tipo: 'P', etiqueta: "Products" }
      ],
      energia: K([[0, 0], [0.1, 1.0], [0.38, 0.6], [0.7, 0.8], [1, -0.1]]),
      energiaEtiquetas: { ea: { t0: 0, t1: 0.1, texto: "Eₐ (slow step)" } },
      atoms, bonds,
      rastro: ['O1', 'Br'],
      camaras: [
        { id: 'libre', nombre: "Free", dir: [0.3, 0.45, 1] },
        { id: 'plano', nombre: "Cation plane", dir: [1, 0.08, 0.04] },
        { id: 'sup', nombre: "Top", dir: [0.04, 1, 0.1] }
      ],
      frame
    };
  }

  Chem.scenarios.sn1 = { create: createSN1, variantes: [{ id: 'opuesta', nombre: "Face opposite to Br⁻" }, { id: 'misma', nombre: "Same face as Br⁻" }], variantePorDefecto: 'opuesta' };
  Chem.scenarios.e1 = { create: createE1, variantes: [{ id: 'unico', nombre: '' }], variantePorDefecto: 'unico' };
})(typeof window !== 'undefined' ? window : globalThis);
