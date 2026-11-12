/* Balanceo redox: método ion-electrón — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var R = {
    mn_fe: { n: "MnO₄⁻ + Fe²⁺ (acidic medium)", med: "acid", un: "MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺", ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'MnO₄⁻', rds: ['+7', '+2'], rde: 'Mn',
      oxSk: "Fe²⁺ → Fe³⁺", rdSk: "MnO₄⁻ → Mn²⁺", rdAt: "MnO₄⁻ + 8 H⁺ → Mn²⁺ + 4 H₂O", oxAt: "Fe²⁺ → Fe³⁺", oxB: "Fe²⁺ → Fe³⁺ + 1 e⁻", rdB: "MnO₄⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O", mo: 5, mr: 1, e: 5, tot: "MnO₄⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H₂O" },
    cr_fe: { n: "Cr₂O₇²⁻ + Fe²⁺ (acidic medium)", med: "acid", un: "Cr₂O₇²⁻ + Fe²⁺ → Cr³⁺ + Fe³⁺", ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'Cr₂O₇²⁻', rds: ['+6', '+3'], rde: 'Cr',
      oxSk: "Fe²⁺ → Fe³⁺", rdSk: "Cr₂O₇²⁻ → Cr³⁺", rdAt: "Cr₂O₇²⁻ + 14 H⁺ → 2 Cr³⁺ + 7 H₂O", oxAt: "Fe²⁺ → Fe³⁺", oxB: "Fe²⁺ → Fe³⁺ + 1 e⁻", rdB: "Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ → 2 Cr³⁺ + 7 H₂O", mo: 6, mr: 1, e: 6, tot: "Cr₂O₇²⁻ + 6 Fe²⁺ + 14 H⁺ → 2 Cr³⁺ + 6 Fe³⁺ + 7 H₂O" },
    cu_no3: { n: "Cu + NO₃⁻ (acidic medium)", med: "acid", un: "Cu + NO₃⁻ → Cu²⁺ + NO", ox: 'Cu', oxs: ['0', '+2'], oxe: 'Cu', rd: 'NO₃⁻', rds: ['+5', '+2'], rde: 'N',
      oxSk: "Cu → Cu²⁺", rdSk: "NO₃⁻ → NO", rdAt: "NO₃⁻ + 4 H⁺ → NO + 2 H₂O", oxAt: "Cu → Cu²⁺", oxB: "Cu → Cu²⁺ + 2 e⁻", rdB: "NO₃⁻ + 4 H⁺ + 3 e⁻ → NO + 2 H₂O", mo: 3, mr: 2, e: 6, tot: "3 Cu + 2 NO₃⁻ + 8 H⁺ → 3 Cu²⁺ + 2 NO + 4 H₂O" },
    h2o2_fe: { n: "H₂O₂ + Fe²⁺ (acidic medium)", med: "acid", un: "H₂O₂ + Fe²⁺ → H₂O + Fe³⁺", ox: 'Fe²⁺', oxs: ['+2', '+3'], oxe: 'Fe', rd: 'H₂O₂', rds: ['−1', '−2'], rde: 'O',
      oxSk: "Fe²⁺ → Fe³⁺", rdSk: 'H₂O₂ → H₂O', rdAt: 'H₂O₂ + 2 H⁺ → 2 H₂O', oxAt: "Fe²⁺ → Fe³⁺", oxB: "Fe²⁺ → Fe³⁺ + 1 e⁻", rdB: 'H₂O₂ + 2 H⁺ + 2 e⁻ → 2 H₂O', mo: 2, mr: 1, e: 2, tot: "H₂O₂ + 2 Fe²⁺ + 2 H⁺ → 2 H₂O + 2 Fe³⁺" },
    mn_i: { n: "MnO₄⁻ + I⁻ (basic medium)", med: "basic", un: "MnO₄⁻ + I⁻ → MnO₂ + I₂", ox: 'I⁻', oxs: ['−1', '0'], oxe: 'I', rd: 'MnO₄⁻', rds: ['+7', '+4'], rde: 'Mn',
      oxSk: '2 I⁻ → I₂', rdSk: "MnO₄⁻ → MnO₂", rdAt: "MnO₄⁻ + 2 H₂O → MnO₂ + 4 OH⁻", oxAt: '2 I⁻ → I₂', oxB: '2 I⁻ → I₂ + 2 e⁻', rdB: "MnO₄⁻ + 2 H₂O + 3 e⁻ → MnO₂ + 4 OH⁻", mo: 3, mr: 2, e: 6, tot: "2 MnO₄⁻ + 6 I⁻ + 4 H₂O → 2 MnO₂ + 3 I₂ + 8 OH⁻" }
  };
  var STEP = ["Oxidation numbers", 'Semirreacciones', "Atoms, O and H", "Charge with electrons", "Equalize e⁻ and add"];
  var S = { r: 'mn_fe', step: 5 }, g = null, el = [], lab = [], cur = 0;
  function stages() {
    return [
      ["Oxidation numbers", "Ox. number", "Whatever increases its oxidation number is oxidized; whatever decreases it is reduced",
        "<p>Assign <b>oxidation numbers</b> and detect which species <b>loses electrons (is oxidized)</b> and which <b>gains them (is reduced)</b>. The reducing agent is the one that is oxidized; the oxidizing agent, the one that is reduced. Change the reaction in “Lab” to see other cases.</p>"],
      ['Semirreacciones', 'Semirreacciones', "Separate the oxidation and the reduction",
        "<p>Write the <b>two half-reactions</b> separately, with the species that contain the element that changes. They are <b>not</b> balanced yet: only the reactant and product of each are identified.</p>"],
      ["Balance atoms, O and H", "Atoms, O, H", "Acidic medium: O with H₂O and H with H⁺. Basic medium: use OH⁻ and H₂O",
        "<p>First balance the atoms other than O and H; then <b>oxygen with H₂O</b> and <b>hydrogen with H⁺</b>. In basic medium, balance the same way and then add one OH⁻ for each H⁺ on both sides (or balance directly with OH⁻ and H₂O).</p>"],
      ["Balance the charge", "Charge with e⁻", "Add electrons to equalize the charges",
        "<p>Add <b>electrons</b> to the side with more positive charge to equalize the total charges. The electrons end up on the <b>right in the oxidation</b> and on the <b>left in the reduction</b>.</p>"],
      ["Equalize electrons and add", "Final sum", "The electrons gained must equal those lost",
        "<p>Multiply each half-reaction so that the <b>electrons given up</b> equal those <b>gained</b>, add them and cancel what appears on both sides. Check that atoms and charge are balanced.</p>"]
    ];
  }
  var def = {
    key: 'balanceo-redox', title: "Redox balancing: the ion-electron method", subtitle: "3D Simulator · general chemistry", accent: { dark: '#faa2c1', light: '#c2255c' },
    stages: stages, nStages: 5, dur: 10, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [0, 4, 22], target: [0, 2, 0] }, { id: 'frontal', label: "Front", pos: [0, 2, 26], target: [0, 2, 0] }],
    layers: [{ id: 'e', label: "Electrons", icon: 'e⁻' }],
    build: function (ctx) {
      g = new T.Group(); ctx.scene.add(g); var i;
      function beaker(x, c) { var G = new T.Group(); G.position.set(x, 0, 0); g.add(G); var b = new T.Mesh(new T.CylinderGeometry(3, 3, 6, 28, 1, true), new T.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); b.position.y = 3; G.add(b); var l = new T.Mesh(new T.CylinderGeometry(2.9, 2.9, 4.5, 28), new T.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.55 })); l.position.y = 2.25; G.add(l); var r = new T.Mesh(new T.BoxGeometry(0.4, 7, 0.4), new T.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.6, roughness: 0.4 })); r.position.set(0, 4, 0); G.add(r); return G; }
      g.userData.A = beaker(-7, 0xffa8a8); g.userData.B = beaker(7, 0x91a7ff);
      var wire = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 14, 8), new T.MeshStandardMaterial({ color: 0xadb5bd })); wire.rotation.z = Math.PI / 2; wire.position.set(0, 8, 0); g.add(wire);
      var e = new T.SphereGeometry(0.28, 12, 8); for (i = 0; i < 12; i++) { var m = new T.Mesh(e, new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 })); g.add(m); el.push(m); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, r = R[S.r], i = f.i; if (!P.manual) S.step = i + 1; cur = S.step; var on = ctx.layer('e'), n = (S.step >= 4 ? r.e : 0), k;
      el.forEach(function (m, j) { m.visible = on && j < n; if (j < n) { var u = ((ctx.now * 0.35 + j / Math.max(1, n)) % 1); m.position.set(-7 + 14 * u, 8 + 0.9 * Math.sin(u * 3.1416) * 0, 0); } });
      lab[0].pos(-7, 8.2, 0).set("Oxidized: " + r.ox + ' (' + r.oxs[0] + ' → ' + r.oxs[1] + ')', 'bl-neg').vis(S.step >= 1);
      lab[1].pos(7, 8.2, 0).set("Reduced: " + r.rd + ' (' + r.rde + ' ' + r.rds[0] + ' → ' + r.rds[1] + ')', 'bl-pos').vis(S.step >= 1);
      lab[2].pos(0, 10.3, 0).set(S.step >= 4 ? "e⁻ transferred: " + r.e : '', 'bl-lead').vis(S.step >= 4);
      lab[3].pos(-7, -0.8, 0).set("Anode · reducing agent", 'bl-d').vis(true);
      lab[4].pos(7, -0.8, 0).set("Cathode · oxidizing agent", 'bl-d').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (u.r) u.r.set(S.r); if (u.step) u.step.set(S.step); },
    hud: function () { var r = R[S.r]; return { eq: { chip: 'e⁻', name: "Reaction", body: "<div class=\"eqline\"><small>Medium</small>" + r.med + "</div><div class=\"eqline\"><small>Oxidizing agent</small>" + r.rd + "</div><div class=\"eqline\"><small>Reducing agent</small>" + r.ox + "</div><div class=\"eqline\"><small>e⁻ exchanged</small>" + r.e + '</div>' }, legend: [{ label: "Yellow spheres", color: '#ffd43b', text: "electrons passing from the reducing agent to the oxidizing agent" }] }; },
    measures: function () { var r = R[S.r]; return [["Medium", r.med], ["Oxidized", r.ox], ["Reduced", r.rd], ["Oxidation factor", '×' + r.mo], ["Reduction factor", '×' + r.mr], ["e⁻ transferred", String(r.e)]]; },
    ideas: ["Oxidation: loss of e⁻ (the oxidation number increases).", "Reduction: gain of e⁻.", "Equalize the e⁻ given up and gained.", "Check atoms and charge at the end."],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Redox reaction"); el2.appendChild(c);
      ui.r = kit.ui.options({ label: "Reaction", cols: 1, value: S.r, options: Object.keys(R).map(function (k) { return { v: k, label: R[k].n }; }), onChange: function (v) { ctx.goManual(); S.r = v; } });
      ui.step = kit.ui.slider({ label: "Steps shown", min: 1, max: 5, step: 1, value: S.step, format: function (v) { return v + ' · ' + STEP[v - 1]; }, onInput: function (v) { ctx.goManual(); S.step = v; } });
      c.appendChild(ui.r); c.appendChild(kit.ui.sliders([ui.step])); c.appendChild(ctx.btnRow([{ t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Oxidation numbers", h: 190, note: "Change in the oxidation number of the element that is oxidized and the one that is reduced.", draw: function (cx, w, h, col) {
      var r = R[S.r], num = function (s) { return parseInt(String(s).replace('−', '-').replace('+', ''), 10); }, vals = [num(r.oxs[0]), num(r.oxs[1]), num(r.rds[0]), num(r.rds[1])], L = 40, B = 30, Tp = 12, ph = h - Tp - B, pw = w - L - 10, lo = -3, hi = 8, i, y = function (v) { return Tp + ph * (1 - (v - lo) / (hi - lo)); };
      cx.strokeStyle = col.muted; cx.beginPath(); cx.moveTo(L, y(0)); cx.lineTo(L + pw, y(0)); cx.stroke(); cx.font = '11px system-ui'; cx.textAlign = 'center';
      [[0, 1, '#ff8787', r.oxe], [2, 3, '#748ffc', r.rde]].forEach(function (p, k) { var x1 = L + pw * (0.15 + k * 0.5), x2 = x1 + pw * 0.25; cx.strokeStyle = p[2]; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x1, y(vals[p[0]])); cx.lineTo(x2, y(vals[p[1]])); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = p[2]; cx.beginPath(); cx.arc(x1, y(vals[p[0]]), 4, 0, 6.28); cx.arc(x2, y(vals[p[1]]), 4, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.fillText(p[3] + ' ' + (vals[p[0]] > 0 ? '+' : '') + vals[p[0]] + ' → ' + (vals[p[1]] > 0 ? '+' : '') + vals[p[1]], (x1 + x2) / 2, h - 10); });
    } }],
    calc: function () {
      var r = R[S.r], s = S.step, row = function (a, b, on) { return '<tr' + (on ? '' : ' style="font-style:italic"') + '><th>' + a + '</th><td>' + b + '</td></tr>'; };
      return '<div class="card-kicker">' + r.un + " · medium " + r.med + '</div><table class="calc-table">' + row("1. Oxidation no.", r.oxe + ': ' + r.oxs[0] + ' → ' + r.oxs[1] + " (oxidized) · " + r.rde + ': ' + r.rds[0] + ' → ' + r.rds[1] + " (reduced)", s >= 1) + row("2. Half-reactions", "Ox: " + r.oxSk + "<br>Red: " + r.rdSk, s >= 2) + row("3. Atoms, O and H", "Ox: " + r.oxAt + "<br>Red: " + r.rdAt, s >= 3) + row("4. Charge with e⁻", "Ox: " + r.oxB + "<br>Red: " + r.rdB, s >= 4) + row("5. Equalize and add", '× ' + r.mo + " (ox) · × " + r.mr + " (red)<br><b>" + r.tot + '</b>', s >= 5) + '</table>';
    },
    quiz: [
      { q: "In MnO₄⁻ the oxidation number of Mn is…", options: ['+7', '+4', '+2', '−1'], answer: 0, why: "Mn + 4(−2) = −1 → Mn = +7." },
      { q: "In acidic medium, O atoms are balanced with…", options: ['H₂O', 'OH⁻', 'H₂', 'e⁻'], answer: 0, why: "Then the H with H⁺." },
      { q: "In an oxidation half-reaction the electrons appear…", options: ["on the right", "to the left", "on both sides", "they do not appear"], answer: 0, why: "They are lost and are a product." },
      { q: "For MnO₄⁻ → Mn²⁺ in acidic medium, how many e⁻ are gained?", options: ['5', '3', '7', '2'], answer: 0, why: '+7 → +2.' },
      { q: "In Cu + NO₃⁻ → Cu²⁺ + NO the total number exchanged is…", options: ["6 e⁻ (3Cu and 2NO₃⁻)", '2 e⁻', '3 e⁻', '5 e⁻'], answer: 0, why: "The LCM of 2 and 3 is 6." },
      { q: "The reducing agent is the species that…", options: ["is oxidized", "is reduced", "gains electrons", "does not change"], answer: 0, why: "It reduces another by giving up e⁻." }
    ],
    help: { intro: "Choose the reaction and reveal the five steps of the method. The yellow spheres are the electrons going from the reducing agent (left) to the oxidizing agent (right).", items: [['Beakers', 'left = oxidation half-reaction (reducing agent); right = reduction half-reaction (oxidising agent).'], ['Electrons', 'the yellow spheres travel from the reducing agent to the oxidising agent; their number is what gets equalised at the end.'], ['Controls', '“Reaction” picks the system (permanganate, dichromate, nitrate, peroxide or basic medium) and “Steps shown” reveals the ion-electron method step by step.'], ['Chart', '“Oxidation numbers” of each species, to see what is oxidised and what is reduced.']], try: ['With MnO₄⁻ + Fe²⁺, reveal step by step: Mn goes from +7 to +2 and gains 5 e⁻.', 'Before revealing the last step, predict what each half-reaction must be multiplied by.', 'Pick the reaction in basic medium: it is balanced with OH⁻ and H₂O instead of H⁺.'] }
  };
  MSim.create(def);
})();
