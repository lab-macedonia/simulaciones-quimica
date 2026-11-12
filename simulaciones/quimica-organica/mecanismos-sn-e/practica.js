/* Práctica · Mecanismos SN1, SN2, E1 y E2. Un solo archivo para ES y EN (ver kit/aula.js). */
(function () {
  var K = { sn2: 'S<sub>N</sub>2', sn1: 'S<sub>N</sub>1', e2: 'E2', e1: 'E1' };
  /* sustrato, reactivo, disolvente/condiciones, mecanismo, razón */
  var C = [['CH₃Br', ['NaOH', 'NaOH'], ['acetona', 'acetone'], 'sn2', ['Metilo: sin impedimento estérico, sin carbocatión posible.', 'Methyl: no steric hindrance, no possible carbocation.']],
    ['CH₃CH₂CH₂Br', ['NaCN', 'NaCN'], ['DMSO', 'DMSO'], 'sn2', ['Primario + buen nucleófilo poco básico + disolvente polar aprótico.', 'Primary + good, weakly basic nucleophile + polar aprotic solvent.']],
    ['(CH₃)₃CBr', ['H₂O', 'H₂O'], ['agua/etanol, 25 °C', 'water/ethanol, 25 °C'], 'sn1', ['Terciario + nucleófilo débil + disolvente prótico, sin calor: carbocatión estable y sustitución.', 'Tertiary + weak nucleophile + protic solvent, no heat: stable carbocation and substitution.']],
    ['(CH₃)₃CBr', ['CH₃CH₂O⁻Na⁺', 'CH₃CH₂O⁻Na⁺'], ['etanol, calor', 'ethanol, heat'], 'e2', ['Terciario + base fuerte: el SN2 está impedido y la base arranca un H β.', 'Tertiary + strong base: SN2 is blocked and the base removes a β H.']],
    ['(CH₃)₃COH', ['H₂SO₄ conc.', 'conc. H₂SO₄'], ['calor', 'heat'], 'e1', ['Alcohol terciario protonado pierde agua → carbocatión → pierde H⁺ (deshidratación).', 'Protonated tertiary alcohol loses water → carbocation → loses H⁺ (dehydration).']],
    ['CH₃CH₂Br', ['(CH₃)₃CO⁻K⁺', '(CH₃)₃CO⁻K⁺'], ['terc-butanol', 'tert-butanol'], 'e2', ['Base fuerte y voluminosa: no puede atacar al carbono, arranca un H β.', 'Strong, bulky base: it cannot attack the carbon, it removes a β H.']],
    ['CH₃CH₂I', ['NaN₃', 'NaN₃'], ['DMF', 'DMF'], 'sn2', ['Primario + nucleófilo fuerte poco básico + polar aprótico.', 'Primary + strong, weakly basic nucleophile + polar aprotic solvent.']],
    ['C₆H₅CH(CH₃)Cl (secundario bencílico)', ['CH₃OH', 'CH₃OH'], ['metanol, 25 °C', 'methanol, 25 °C'], 'sn1', ['Carbocatión bencílico estabilizado por resonancia + nucleófilo débil prótico (solvólisis).', 'Resonance-stabilized benzylic carbocation + weak protic nucleophile (solvolysis).']],
    ['(CH₃)₂CHBr', ['CH₃CH₂O⁻Na⁺', 'CH₃CH₂O⁻Na⁺'], ['etanol, calor', 'ethanol, heat'], 'e2', ['Secundario + base fuerte + calor: predomina la eliminación E2.', 'Secondary + strong base + heat: E2 elimination dominates.']],
    ['(CH₃)₂CHBr', ['NaSCH₃', 'NaSCH₃'], ['DMSO', 'DMSO'], 'sn2', ['Secundario + nucleófilo fuerte poco básico (tiolato) + polar aprótico.', 'Secondary + strong, weakly basic nucleophile (thiolate) + polar aprotic solvent.']]];
  function pr(c, H) { return H.t('Sustrato: <b>' + c[0] + '</b> · reactivo: <b>' + c[1][0] + '</b> · condiciones: ' + c[2][0] + '. ¿Qué mecanismo predomina?', 'Substrate: <b>' + c[0].replace('(secundario bencílico)', '(secondary benzylic)') + '</b> · reagent: <b>' + c[1][1] + '</b> · conditions: ' + c[2][1] + '. Which mechanism dominates?'); }
  SimAula.register({ problemsIntro: ['Ejercicios generados al azar en cada intento. Elige la opción o escribe el número y luego revisa la explicación.', 'Exercises generated at random on each attempt. Choose an option or type the number, then read the explanation.'],
    problems: [
      { name: ['Predecir el mecanismo', 'Predict the mechanism'], gen: function (H) {
        return H.bank(C, function (c) { return pr(c, H); }, function (c) { return K[c[3]]; }, function (c) { return H.L(c[4]); }, [K.sn1, K.sn2, K.e1, K.e2]);
      } },
      { name: ['Ley de velocidad', 'Rate law'], gen: function (H) {
        var m = H.pick(['sn1', 'sn2', 'e1', 'e2']), a = H.pick([2, 3, 4, 0.5]), b = H.pick([2, 3, 0.5]), uni = m === 'sn1' || m === 'e1', f = uni ? a : a * b;
        return { q: H.t('Una reacción ocurre por ' + K[m] + '. Si la concentración del sustrato se multiplica por ' + H.fmt(a, a % 1 ? 1 : 0) + ' y la del nucleófilo/base por ' + H.fmt(b, b % 1 ? 1 : 0) + ', ¿por cuánto se multiplica la velocidad?', 'A reaction proceeds by ' + K[m] + '. If the substrate concentration is multiplied by ' + H.fmt(a, a % 1 ? 1 : 0) + ' and that of the nucleophile/base by ' + H.fmt(b, b % 1 ? 1 : 0) + ', by what factor does the rate change?'), a: f, abs: 0.01, aText: H.fmt(f, f % 1 ? 2 : 0),
          sol: (uni ? 'v = k[RX] (' + H.t('unimolecular: el paso lento es la formación del carbocatión', 'unimolecular: the slow step is carbocation formation') + ') → ×' + H.fmt(a, a % 1 ? 1 : 0) : 'v = k[RX][Nu] (' + H.t('bimolecular: paso único concertado', 'bimolecular: single concerted step') + ') → ×' + H.fmt(a, a % 1 ? 1 : 0) + ' × ' + H.fmt(b, b % 1 ? 1 : 0) + ' = ×' + H.fmt(f, f % 1 ? 2 : 0)) };
      } },
      { name: ['Estereoquímica del producto', 'Product stereochemistry'], gen: function (H) {
        var Q = [[['Un haluro quiral (R) reacciona por S<sub>N</sub>2. ¿Qué configuración tiene el producto en ese carbono (si las prioridades no cambian)?', 'A chiral (R) halide reacts by S<sub>N</sub>2. What configuration does the product have at that carbon (if priorities do not change)?'], ['Invertida (S): inversión de Walden', 'Inverted (S): Walden inversion'], [['Retenida (R)', 'Retained (R)'], ['Mezcla racémica', 'Racemic mixture']], ['El nucleófilo ataca por el lado opuesto al grupo saliente.', 'The nucleophile attacks from the side opposite the leaving group.']],
          [['Un haluro terciario quiral reacciona por S<sub>N</sub>1. ¿Qué se obtiene?', 'A chiral tertiary halide reacts by S<sub>N</sub>1. What is obtained?'], ['Mezcla (casi) racémica', '(Nearly) racemic mixture'], [['Solo inversión', 'Inversion only'], ['Solo retención', 'Retention only']], ['El carbocatión es plano: el nucleófilo entra por ambas caras.', 'The carbocation is planar: the nucleophile enters from both faces.']],
          [['En una E2, ¿qué geometría deben tener el H β y el grupo saliente?', 'In an E2, what geometry must the β H and the leaving group have?'], ['Antiperiplanar (180°)', 'Antiperiplanar (180°)'], [['Sinclinal (60°)', 'Synclinal (60°)'], ['Cualquiera', 'Any']], ['Los orbitales C–H y C–X deben estar alineados para formar el enlace π en un solo paso.', 'The C–H and C–X orbitals must be aligned to form the π bond in a single step.']],
          [['En una eliminación con base pequeña (EtO⁻), ¿qué alqueno predomina?', 'In an elimination with a small base (EtO⁻), which alkene dominates?'], ['El más sustituido (Zaitsev)', 'The more substituted one (Zaitsev)'], [['El menos sustituido (Hofmann)', 'The less substituted one (Hofmann)'], ['Ambos al 50 %', 'Both at 50 %']], ['El alqueno más sustituido es el más estable. Con bases voluminosas (t-BuO⁻) predomina el de Hofmann.', 'The more substituted alkene is the more stable one. With bulky bases (t-BuO⁻) the Hofmann product dominates.']]];
        var q = H.pick(Q);
        return H.mc(H.L(q[0]), q[1], q[2], H.L(q[3]));
      } }
    ]
  });
})();
