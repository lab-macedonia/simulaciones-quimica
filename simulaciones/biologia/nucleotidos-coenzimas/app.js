/* Nucleótidos y coenzimas — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var CO = {
    atp: { n: 'ATP', vit: '— (se sintetiza de novo)', vn: '', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'α-fosfato', 0xff922b, 'p'], ['P', 'β-fosfato', 0xff922b, 'p'], ['P', 'γ-fosfato', 0xff6b6b, 'p']], fn: 'moneda energética: ΔG°′ de hidrólisis ≈ −30,5 kJ/mol', e: -30.5 },
    nad: { n: 'NAD⁺ / NADH', vit: 'Niacina (vitamina B3)', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['N', 'Nicotinamida', 0x69db7c, 'ring']], fn: 'transportador de hidruro (H⁻) en rutas catabólicas; E°′ = −0,32 V', e: -0.32 },
    fad: { n: 'FAD / FADH₂', vit: 'Riboflavina (vitamina B2)', mod: [['A', 'Adenina', 0x4dabf7, 'base'], ['R', 'Ribosa', 0xffd43b, 'sugar'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['R', 'Ribitol', 0xffd43b, 'sugar'], ['F', 'Isoaloxazina', 0xfab005, 'ring']], fn: 'acepta 2 e⁻ y 2 H⁺; E°′ ≈ −0,22 V (unido a la enzima varía)', e: -0.22 },
    coa: { n: 'Coenzima A', vit: 'Ácido pantoténico (vitamina B5)', mod: [['A', 'Adenina 3′-fosfato-ribosa', 0x4dabf7, 'base'], ['P', 'Pirofosfato', 0xff922b, 'p'], ['B', 'Pantotenato', 0xb197fc, 'sugar'], ['C', 'β-mercaptoetilamina', 0xf06595, 'sugar'], ['S', 'SH (tiol)', 0xe6c229, 'ring']], fn: 'transporta grupos acilo mediante un tioéster de alta energía (acetil-CoA: ΔG°′ ≈ −31,4 kJ/mol)', e: -31.4 }
  };
  var VIT = [['B1', 'Tiamina', 'TPP', 'descarboxilaciones'], ['B2', 'Riboflavina', 'FAD, FMN', 'redox (2 e⁻)'], ['B3', 'Niacina', 'NAD⁺, NADP⁺', 'hidruros'], ['B5', 'Ác. pantoténico', 'CoA', 'grupos acilo'], ['B6', 'Piridoxina', 'PLP', 'aminoácidos'], ['B7', 'Biotina', 'biocitina', 'carboxilaciones'], ['B9', 'Ácido fólico', 'THF', 'unidades C₁'], ['B12', 'Cobalamina', 'metil/adenosilcobalamina', 'isomerizaciones']];
  var S = { co: 'atp', p: 0, red: false }, g = null, lab = [], blocks = [], ez = null, hyd = null, wat = null;
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function shape(kind, c) {
    var m = new T.MeshStandardMaterial({ color: c, roughness: 0.45, transparent: true, opacity: 0.95 }), gr = new T.Group(), k;
    if (kind === 'base') { for (k = 0; k < 2; k++) { var hx = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.35, k ? 5 : 6), m); hx.position.x = k * 1.5 - 0.7; gr.add(hx); } }
    else if (kind === 'sugar') { gr.add(new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.35, 5), m)); }
    else if (kind === 'p') { var tt = new T.Mesh(new T.TetrahedronGeometry(0.85), m); gr.add(tt); }
    else if (kind === 'ring') { for (k = 0; k < 3; k++) { var h2 = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.35, 6), m); h2.position.x = k * 1.3 - 1.3; if (k === 0) h2.position.x = -0.6; gr.add(h2); } gr.children[2].visible = true; }
    return gr;
  }
  function stages() {
    return [
      ['Nucleótidos: tres partes', 'Nucleótido', 'Base nitrogenada + pentosa + uno o más fosfatos',
        '<p>Un <b>nucleótido</b> está formado por una <b>base nitrogenada</b> (purina o pirimidina), una <b>pentosa</b> (ribosa o desoxirribosa) y de uno a tres <b>fosfatos</b>. Además de ser los monómeros del ADN y ARN, participan en la energía y señalización celular. La base unida a la ribosa por enlace <b>N-glucosídico</b> es un <b>nucleósido</b>; con fosfato, un nucleótido.</p>'],
      ['ATP: la moneda de energía', 'ATP', 'La hidrólisis del enlace fosfoanhídrido libera ≈ 30,5 kJ/mol',
        '<p>El <b>ATP</b> (adenosina trifosfato) tiene dos enlaces <b>fosfoanhídrido</b> de alta energía. Su hidrólisis a ADP + Pᵢ tiene <b>ΔG°′ ≈ −30,5 kJ/mol</b> y en la célula (concentraciones reales) ≈ −50 kJ/mol. Se explica por la <b>repulsión de cargas</b> entre fosfatos, la mejor solvatación de los productos y la <b>estabilización por resonancia</b> del Pᵢ. La energía se transfiere acoplando reacciones.</p>'],
      ['NAD⁺ y NADH', 'NAD⁺', 'El anillo de nicotinamida recibe un ion hidruro (H⁻) en C4',
        '<p>Las <b>deshidrogenasas</b> toman 2 e⁻ y 2 H⁺ del sustrato: el <b>NAD⁺</b> acepta un <b>ion hidruro (H⁻)</b> en el C4 del anillo de nicotinamida, que pasa de piridinio aromático a <b>1,4-dihidropiridina</b> (NADH), y se libera un H⁺. El NADH absorbe a <b>340 nm</b> (el NAD⁺ no), propiedad usada para seguir enzimas. Mueve «Avance» para ver el traspaso.</p>'],
      ['FAD y coenzima A', 'FAD y CoA', 'FAD: redox de 2 e⁻ ; CoA: transporte de grupos acilo por un tioéster',
        '<p>El <b>FAD</b> (de la riboflavina) acepta dos H en N5 y N1 de la isoaloxazina y es el coenzima de la <b>succinato deshidrogenasa</b> y la <b>acil-CoA deshidrogenasa</b>. La <b>coenzima A</b> termina en un <b>tiol (–SH)</b> que forma <b>tioésteres</b> (acetil-CoA), con ΔG°′ de hidrólisis similar al del ATP: grupos acilo «activados».</p>'],
      ['Vitaminas hidrosolubles → coenzimas', 'Vitaminas', 'Las vitaminas del grupo B son los precursores de los coenzimas',
        '<p>Muchos coenzimas derivan de <b>vitaminas del complejo B</b>, que el ser humano no sintetiza y debe obtener de la dieta: <b>niacina→NAD⁺</b>, <b>riboflavina→FAD</b>, <b>pantoténico→CoA</b>, <b>tiamina→TPP</b>, <b>piridoxina→PLP</b>, <b>folato→THF</b>, <b>biotina</b> y <b>B₁₂</b>. Su déficit afecta rutas completas (beriberi, pelagra, anemia megaloblástica…).</p>']
    ];
  }
  var def = {
    key: 'nucleotidos-coenzimas', title: 'Nucleótidos y coenzimas', subtitle: 'Simulador 3D · biología molecular', accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 5, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: 'Libre', pos: [3, 5, 18], target: [0, 0, 0] }, { id: 'frontal', label: 'Frontal', pos: [0, 0, 20], target: [0, 0, 0] }, { id: 'sup', label: 'Superior', pos: [0, 20, 2], target: [0, 0, 0] }],
    layers: [{ id: 'mod', label: 'Módulos', icon: '▤' }, { id: 'lab', label: 'Etiquetas', icon: 'A' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      for (i = 0; i < 5; i++) { var b = new T.Group(); g.add(b); blocks.push(b); }
      ez = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), new T.MeshBasicMaterial({ color: 0xfff3bf })); g.add(ez); hyd = ez;
      wat = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshStandardMaterial({ color: 0x4dabf7 })); g.add(wat);
      for (i = 0; i < 8; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, co; if (!P.manual) { S.co = ['atp', 'atp', 'nad', i === 3 ? (f.local < 0.5 ? 'fad' : 'coa') : 'nad', 'atp'][i]; S.p = i === 4 ? 0 : (i === 0 ? 0 : (f.local * (i === 3 ? 2 : 1)) % 1 * 1.0); }
      co = CO[S.co]; var q = sm(S.p), now = ctx.now, mOn = ctx.layer('mod'), lOn = ctx.layer('lab'), k;
      if (g.userData.k !== S.co) { g.userData.k = S.co; blocks.forEach(function (b, j) { while (b.children.length) b.remove(b.children[0]); if (co.mod[j]) b.add(shape(co.mod[j][3], co.mod[j][2])); }); }
      var n = co.mod.length, step = 3.0, x0 = -(n - 1) * step / 2;
      blocks.forEach(function (b, j) { b.visible = j < n && mOn; b.position.set(x0 + j * step, (j % 2 ? -0.4 : 0.4) * 0 + Math.sin(now + j) * 0.05, 0); b.rotation.y = 0; b.rotation.x = Math.PI / 2 - 0.3; });
      lab.forEach(function (l) { l.vis(false); });
      var extra = '';
      if (S.co === 'atp' && (S.p > 0 || P.manual)) { var last = blocks[4]; last.position.x += 2.8 * q; last.position.y += -1.2 * q; wat.visible = true; wat.position.set(blocks[3].position.x + 1.5 + 0 * q, 2.2 - 1.6 * q, 0); wat.scale.setScalar(1 - 0.4 * q); extra = q < 0.5 ? 'H₂O ataca al fósforo γ' : 'ATP + H₂O → ADP + Pᵢ'; } else wat.visible = false;
      ez.visible = false;
      if (S.co === 'nad') { var ring = blocks[4]; ring.children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(S.red || q > 0.5 ? 0x38d9a9 : 0x69db7c); }); }); ez.visible = true; ez.position.set(ring.position.x + 3.0 - 3.0 * sm(q), 2.4 - 1.0 * sm(q), 0); extra = q < 0.5 ? 'NAD⁺ (anillo aromático, N⁺)' : 'NADH (1,4-dihidropiridina): H⁻ en C4'; }
      if (S.co === 'fad') { extra = q < 0.5 ? 'FAD (oxidado)' : 'FADH₂ (reducido, 2 H en N1 y N5)'; blocks[4].children.forEach(function (c) { c.children.forEach(function (m) { m.material.color.setHex(q > 0.5 ? 0xfff3bf : 0xfab005); }); }); }
      if (S.co === 'coa') { extra = q < 0.5 ? 'CoA–SH (tiol libre)' : 'acetil-CoA: tioéster CH₃CO–S–CoA'; if (q > 0.5) { ez.visible = true; ez.material.color.setHex(0xff922b); ez.scale.setScalar(2); ez.position.set(blocks[4].position.x + 1.4, 0.2, 0); } }
      lab[0].pos(0, 5, 0).set(co.n, 'bl-lead').vis(true); lab[1].pos(0, -4.2, 0).set(extra || co.fn, 'bl-d').vis(true);
      co.mod.forEach(function (m, j) { lab[2 + j].pos(blocks[j].position.x, -2.2, 0).set(m[1], 'bl-d').vis(lOn && j < 5 && 2 + j < 8); });
    },
    sync: function (ctx) { var u = ctx.ui; if (u.co) u.co.set(S.co); if (u.p && !ctx.P.manual) u.p.set(S.p); },
    hud: function () { var c = CO[S.co]; return { eq: { chip: c.n.split(' ')[0], name: c.n, body: '<div class="eqline"><small>Función</small>' + c.fn + '</div><div class="eqline"><small>Vitamina</small>' + c.vit + '</div>' }, legend: [{ label: 'Azul', color: '#4dabf7', text: 'base nitrogenada' }, { label: 'Amarillo', color: '#ffd43b', text: 'pentosa' }, { label: 'Naranja', color: '#ff922b', text: 'fosfato' }] }; },
    measures: function () { var c = CO[S.co]; return [['Coenzima', c.n], ['Vitamina precursora', c.vit], ['Módulos', c.mod.map(function (m) { return m[1]; }).join(' – ')], ['Función', c.fn]]; },
    ideas: ['Nucleótido = base + pentosa + fosfato(s).', 'ATP → ADP + Pᵢ libera ≈ 30,5 kJ/mol.', 'NAD⁺ acepta H⁻ en C4.', 'Vitaminas B → coenzimas.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Coenzima'); el.appendChild(c);
      ui.co = kit.ui.options({ label: 'Elige', cols: 2, value: S.co, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n }; }), onChange: function (v) { ctx.goManual(); S.co = v; S.p = 0; } }); c.appendChild(ui.co);
      ui.p = kit.ui.slider({ label: 'Avance de la reacción', min: 0, max: 1, step: 0.01, value: S.p, format: function (v) { return fmt(v * 100, 0) + ' %'; }, onInput: function (v) { ctx.goManual(); S.p = v; } }); c.appendChild(kit.ui.sliders([ui.p]));
      c.appendChild(ctx.btnRow([{ t: 'Volver a la lección', fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [
      { title: 'Energía libre de hidrólisis (ΔG°′, kJ/mol)', h: 230, note: 'Compuestos de alta energía frente a un éster sencillo.', draw: function (cx, w, h, col) {
        var D = [['PEP', -61.9], ['1,3-BPG', -49.4], ['Fosfocreatina', -43.1], ['ATP → ADP', -30.5], ['Acetil-CoA', -31.4], ['Glucosa-6-P', -13.8], ['Glicerol-3-P', -9.2]], L = 88, Rr = 28, Tp = 8, B = 8, pw = w - L - Rr, bh = (h - Tp - B) / D.length; cx.font = '10px system-ui';
        D.forEach(function (d, j) { var y = Tp + j * bh, cur = (S.co === 'atp' && d[0].indexOf('ATP') === 0) || (S.co === 'coa' && d[0] === 'Acetil-CoA'); cx.fillStyle = cur ? '#ffa94d' : '#4dabf7'; cx.fillRect(L, y + 4, pw * -d[1] / 65, bh - 8); cx.fillStyle = col.ink; cx.textAlign = 'right'; cx.fillText(d[0], L - 4, y + bh / 2 + 3); cx.textAlign = 'left'; cx.fillText(fmt(d[1], 1), L + pw * -d[1] / 65 + 4, y + bh / 2 + 3); });
      } },
      { title: 'Vitaminas del complejo B y sus coenzimas', h: 250, note: 'Tabla de correspondencia.', draw: function (cx, w, h, col) {
        var rh = (h - 10) / (VIT.length + 1); cx.font = '10px system-ui'; cx.textAlign = 'left'; cx.fillStyle = col.muted; cx.fillText('Vit.', 4, rh - 4); cx.fillText('Nombre', 36, rh - 4); cx.fillText('Coenzima', w * 0.42, rh - 4); cx.fillText('Función', w * 0.7, rh - 4);
        VIT.forEach(function (v, j) { var y = (j + 1) * rh + 4; cx.fillStyle = col.ink; cx.fillText(v[0], 4, y + rh - 5); cx.fillText(v[1], 36, y + rh - 5); cx.fillText(v[2], w * 0.42, y + rh - 5); cx.fillText(v[3], w * 0.7, y + rh - 5); cx.strokeStyle = col.line; cx.beginPath(); cx.moveTo(0, y + rh); cx.lineTo(w, y + rh); cx.stroke(); });
      } }
    ],
    calc: function () { var c = CO[S.co], row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; if (S.co === 'atp') { var Q = 0.05, ratio = 1.0; return '<div class="card-kicker">ΔG de la hidrólisis del ATP</div><table class="calc-table">' + row('ΔG°′', '−30,5 kJ/mol') + row('Condiciones celulares', '[ATP]/[ADP][Pᵢ] ≈ 10³ M⁻¹ → ΔG ≈ −50 kJ/mol') + row('Fórmula', 'ΔG = ΔG°′ + RT ln([ADP][Pᵢ]/[ATP])') + row('Con 3 mM ATP, 0,3 mM ADP, 5 mM Pᵢ', 'ΔG = −30,5 + 2,58 ln(0,0003·0,005/0,003) = <b>' + fmt(-30.5 + 2.58 * Math.log(0.0003 * 0.005 / 0.003), 1) + ' kJ/mol</b>') + '</table>'; } if (S.co === 'nad') return '<div class="card-kicker">NAD⁺ + 2H ⇌ NADH + H⁺</div><table class="calc-table">' + row('E°′', '−0,32 V') + row('ΔG°′ de la reducción (n = 2)', '−nFE°′ = <b>+' + fmt(2 * 96485 * 0.32 / 1000, 1) + ' kJ/mol</b>: el NADH es un donador de e⁻ fuerte') + row('λ de absorción', 'NADH 340 nm; NAD⁺ no absorbe') + row('Ley de Beer–Lambert', 'ε₃₄₀ = 6220 M⁻¹cm⁻¹') + '</table>'; return '<div class="card-kicker">' + c.n + '</div><table class="calc-table">' + row('Vitamina', c.vit) + row('Función', c.fn) + '</table>'; },
    quiz: [
      { q: 'Un nucleótido se compone de…', options: ['base + pentosa + fosfato', 'sólo base y fosfato', 'aminoácido + azúcar', 'ácido graso + glicerol'], answer: 0, why: 'Nucleósido + fosfato(s).' },
      { q: 'La vitamina precursora del NAD⁺ es…', options: ['niacina (B3)', 'riboflavina (B2)', 'tiamina (B1)', 'biotina'], answer: 0, why: 'Pelagra por déficit.' },
      { q: 'El NAD⁺ recibe…', options: ['un ion hidruro en C4', 'un protón en N', 'un átomo de O', 'un fosfato'], answer: 0, why: 'Reducción a 1,4-dihidropiridina.' },
      { q: 'La coenzima A forma…', options: ['tioésteres', 'ésteres de fosfato', 'amidas', 'éteres'], answer: 0, why: 'Con su grupo –SH.' },
      { q: 'La hidrólisis del ATP a ADP + Pᵢ tiene ΔG°′ ≈…', options: ['−30,5 kJ/mol', '+30,5 kJ/mol', '0', '−300 kJ/mol'], answer: 0, why: 'Reacción exergónica.' }
    ],
    help: { intro: 'Elige un coenzima: se muestra su estructura modular. Mueve «Avance» para ver la hidrólisis del ATP, el traspaso de hidruro al NAD⁺, la reducción del FAD o la formación del tioéster.', items: [['Módulos', 'cada parte tiene un color: azul = base nitrogenada, amarillo = pentosa, naranja = fosfato.'], ['«Elige»', 'cambia de molécula (ATP, NAD⁺, FAD, coenzima A…); la estructura se arma por módulos.'], ['«Avance de la reacción»', 'muestra la hidrólisis del ATP, el traspaso de hidruro (esfera blanca) al NAD⁺, la reducción del FAD o la formación del tioéster con la CoA.'], ['Gráficos', '«Energía libre de hidrólisis (ΔG°′)» de compuestos fosforilados y la tabla «Vitaminas del complejo B y sus coenzimas».']], try: ['Con ATP, lleva el avance al final: ATP → ADP + Pᵢ libera ≈ 30,5 kJ/mol.', 'Con NAD⁺, observa a qué átomo llega el hidruro: al C4 del anillo de nicotinamida.', 'Busca en la tabla de qué vitamina viene cada coenzima (NAD⁺ ← niacina, FAD ← riboflavina, CoA ← ácido pantoténico).'] }
  };
  MSim.create(def);
})();
