/* Corrosión y protección del hierro — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE;
  var E = { fe: -0.44, zn: -0.76, sn: -0.14, cu: 0.34, mg: -2.37 };
  var CO = { none: { n: "Bare iron", m: null }, zn: { n: "Galvanized (Zn)", m: 'zn', c: 0x9fb0c8 }, sn: { n: "Tinplate (Sn)", m: 'sn', c: 0xdee2e6 }, cu: { n: "Copper-plated (Cu)", m: 'cu', c: 0xd9822b }, mg: { n: "Sacrificial anode (Mg)", m: 'mg', c: 0xe9ecef } };
  var PILA = [["Zn–C (dry cell)", 1.5, "Zn | MnO₂"], ['Alcalina', 1.5, "Zn | MnO₂ (KOH)"], ['Ni–MH', 1.2, "MH | NiOOH"], ["Lead–acid (cell)", 2.0, "Pb | PbO₂"], ["Lithium-ion", 3.7, "LiC₆ | LiCoO₂"]];
  var S = { coat: 'none', salt: 1, o2: 70, ph: 7, t: 0 }, g = null, fe2 = [], oh = [], el = [], rust = [], plate = null, coatM = null, lab = [], anodeMesh = null, drop = null;
  function anode() { var c = CO[S.coat].m; if (!c) return 'fe'; return E[c] < E.fe ? c : 'fe'; }
  function ecat() { return 1.23 - 0.0592 * S.ph; }
  function rate() { var a = anode(), drive = ecat() - E[a]; return drive * (0.15 + 0.85 * Math.min(1, S.salt / 2)) * (0.1 + 0.9 * S.o2 / 100); }
  function feRate() { if (S.coat === 'none') return rate(); var c = CO[S.coat].m; if (anode() === 'fe') return rate() * (c === 'cu' ? 1.4 : 1.2); return 0; }
  var NM = { fe: 'Fe', zn: 'Zn', sn: 'Sn', cu: 'Cu', mg: 'Mg' };
  function stages() {
    return [
      ["Corrosion is a cell", "Cell", "In the drop there is an anode (Fe → Fe²⁺ + 2e⁻) and a cathode (O₂ + 2H₂O + 4e⁻ → 4OH⁻)",
        "<p>Iron corrodes like a miniature <b>galvanic cell</b>. The center of the droplet, poor in O₂, is the <b>anode</b>: <b>Fe → Fe²⁺ + 2e⁻</b>. The electrons travel through the metal to the edge, rich in O₂, the <b>cathode</b>: <b>O₂ + 2H₂O + 4e⁻ → 4OH⁻</b>. Fe²⁺ and OH⁻ meet and form <b>rust</b>, Fe(OH)₃ / Fe₂O₃·nH₂O.</p>"],
      ["Salt, oxygen and pH", "Factors", "Salt increases conductivity; O₂ is the oxidant; a low pH favors reduction",
        "<p><b>Salt</b> increases the conductivity of the electrolyte and speeds up corrosion; dissolved <b>oxygen</b> is the oxidant; an <b>acidic pH</b> raises the reduction potential of O₂ (E = 1.23 − 0.059·pH). Without moisture or without O₂ there is almost no corrosion. Change the controls and watch the rate index.</p>"],
      ["Coatings", "Coatings", "Zn protects even if scratched; Sn protects only while intact",
        "<p>A <b>coating</b> isolates the iron from the environment. If it is scratched, a cell forms between the two metals: the <b>more active one (lower E°) is oxidized</b>. <b>Zn</b> (−0.76 V) protects Fe (−0.44 V) and is the one that corrodes; <b>Sn</b> (−0.14 V) or <b>Cu</b> (+0.34 V) are <b>less active</b> and, when scratched, accelerate the corrosion of iron.</p>"],
      ["Sacrificial anode", "Sacrifice", "A more active metal connected to the iron corrodes in its place",
        "<p>A block of <b>Mg</b> (−2.37 V) connected to an iron structure acts as a <b>sacrificial anode</b>: it is oxidized and the iron becomes the cathode (<b>cathodic protection</b>). It is used on ship hulls and buried pipes; the block must be replaced when it is consumed.</p>"]
    ];
  }
  var def = {
    key: 'corrosion-pilas', title: "Corrosion and protection of iron", subtitle: "3D Simulator · general chemistry", accent: { dark: '#ffa94d', light: '#c2410c' },
    stages: stages, nStages: 4, dur: 12, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [13, 10, 15], target: [13, 0, 0] }, { id: 'lateral', label: "Side", pos: [13, 2, 22], target: [13, 1, 0] }],
    layers: [{ id: 'e', label: "Electrons", icon: 'e⁻' }, { id: 'ion', label: "Ions", icon: '±' }],
    build: function (ctx) {
      g = new T.Group(); g.position.set(17, 0, 0); ctx.scene.add(g); var i;
      plate = new T.Mesh(new T.BoxGeometry(14, 0.8, 8), new T.MeshStandardMaterial({ color: 0x868e96, metalness: 0.6, roughness: 0.4 })); g.add(plate);
      coatM = new T.Mesh(new T.BoxGeometry(14.05, 0.2, 8.05), new T.MeshStandardMaterial({ color: 0x9fb0c8, metalness: 0.5, roughness: 0.4 })); coatM.position.y = 0.5; g.add(coatM);
      anodeMesh = new T.Mesh(new T.BoxGeometry(2, 1.5, 2), new T.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.4, roughness: 0.5 })); anodeMesh.position.set(-7.8, 0.6, 0); g.add(anodeMesh);
      drop = new T.Mesh(new T.SphereGeometry(4.5, 28, 14, 0, 6.283, 0, 1.2), new T.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.35 })); drop.scale.y = 0.45; drop.position.y = 0.4; g.add(drop);
      for (i = 0; i < 30; i++) { var a = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshStandardMaterial({ color: 0xe8590c })); g.add(a); fe2.push(a); var b = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), new T.MeshStandardMaterial({ color: 0x22b8cf })); g.add(b); oh.push(b); var c = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshStandardMaterial({ color: 0xffd43b, emissive: 0x8a6d00 })); g.add(c); el.push(c); }
      for (i = 0; i < 60; i++) { var r = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshStandardMaterial({ color: 0x8a3b12 })); g.add(r); rust.push(r); }
      for (i = 0; i < 5; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k;
      if (!P.manual) { if (i === 0) { S.coat = 'none'; S.salt = 1; S.o2 = 70; S.ph = 7; } if (i === 1) { S.coat = 'none'; S.salt = 3 * f.local; S.o2 = 100 - 60 * f.local; S.ph = 7 - 3 * Math.sin(f.local * 3.14); } if (i === 2) { S.coat = f.local < 0.5 ? 'zn' : 'sn'; S.salt = 2; S.o2 = 80; S.ph = 7; } if (i === 3) { S.coat = 'mg'; S.salt = 2; S.o2 = 80; S.ph = 7; } }
      var a = anode(), r = rate(), fr = feRate(), cm = CO[S.coat], on = ctx.layer('e'), ion = ctx.layer('ion'); S.t += dt * Math.max(0, r);
      coatM.visible = !!cm.m && S.coat !== 'mg'; if (cm.c) coatM.material.color.setHex(cm.c); anodeMesh.visible = S.coat === 'mg';
      var nI = Math.round(Math.max(0, Math.min(30, r * 14))), th = ctx.now;
      fe2.forEach(function (m, j) { m.visible = ion && j < nI && a === 'fe'; var u = (th * 0.4 + j / 30) % 1; m.position.set(-1 + Math.cos(j * 2.3) * u * 3, 0.6 + u * 1.6, Math.sin(j * 2.3) * u * 3); m.material.color.setHex(0xe8590c); });
      oh.forEach(function (m, j) { m.visible = ion && j < nI; var u = (th * 0.4 + j / 30) % 1, ang = j * 2.1; m.position.set(Math.cos(ang) * (3.3 + u * 0.8), 0.6 + u * 0.8, Math.sin(ang) * (3.3 + u * 0.8)); });
      el.forEach(function (m, j) { m.visible = on && j < nI; var u = (th * 0.5 + j / 30) % 1, ang = j * 2.3; m.position.set(Math.cos(ang) * (0.5 + u * 3.5), 0.45, Math.sin(ang) * (0.5 + u * 3.5)); });
      var nR = Math.min(60, Math.round(S.t * (fr > 0 ? 1 : 0) * 6)); rust.forEach(function (m, j) { m.visible = fr > 0 && j < nR; var ang = j * 2.4, rr = 1 + (j % 7) * 0.5; m.position.set(Math.cos(ang) * rr, 0.45 + 0.01 * j, Math.sin(ang) * rr); });
      lab[0].pos(17, 5.2, 0).set("Anode: " + NM[a] + ' → ' + NM[a] + (a === 'fe' ? '²⁺' : '²⁺') + ' + 2e⁻', 'bl-neg').vis(true);
      lab[1].pos(22, 3.2, 0).set("Cathode: O₂ + 2H₂O + 4e⁻ → 4OH⁻", 'bl-pos').vis(true);
      lab[2].pos(17, -3.6, 0).set(cm.n + ' · ' + (a === 'fe' ? "the iron corrodes" : "the Fe is protected"), a === 'fe' ? 'bl-neg' : 'bl-pos').vis(true);
      lab[3].pos(17, -5.2, 0).set("Fe corrosion index: " + fmt(fr * 10, 1), 'bl-d').vis(true);
      lab[4].pos(9.2, 2.6, 0).set('Mg', 'bl-d').vis(S.coat === 'mg');
    },
    sync: function (ctx) { var u = ctx.ui; if (u.coat) u.coat.set(S.coat); ['salt', 'o2', 'ph'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); },
    hud: function () { var a = anode(); return { eq: { chip: 'E°', name: "Corrosion cell", body: "<div class=\"eqline\"><small>Anode</small>" + NM[a] + ' (' + fmt(E[a], 2) + " V)</div><div class=\"eqline\"><small>E(O₂/OH⁻)</small>" + fmt(ecat(), 2) + ' V</div><div class="eqline"><small>ΔE</small>' + fmt(ecat() - E[a], 2) + " V</div><div class=\"eqline\"><small>Fe corrosion</small>" + fmt(feRate() * 10, 1) + '</div>' }, legend: [{ label: "Orange", color: '#e8590c', text: "Fe²⁺ dissolving" }, { label: "Cyan", color: '#22b8cf', text: "OH⁻ at the cathode" }, { label: "Yellow", color: '#ffd43b', text: "electrons" }] }; },
    measures: function () { var a = anode(); return [["Coating", CO[S.coat].n], ["Oxidized", NM[a]], ["Anode E°", fmt(E[a], 2) + ' V'], ["E (O₂/OH⁻)", fmt(ecat(), 2) + ' V'], ["Driving force", fmt(ecat() - E[a], 2) + ' V'], ["Fe corrosion", feRate() > 0 ? fmt(feRate() * 10, 1) : 'protegido']]; },
    ideas: ["The more active metal (lower E°) is oxidized.", "Salt and O₂ speed up corrosion.", "Zn protects; Sn and Cu do not, if there are scratches.", "Sacrificial anode = cathodic protection."],
    lab: function (el2, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Conditions"); el2.appendChild(c);
      ui.coat = kit.ui.options({ label: "Coating", cols: 1, value: S.coat, options: Object.keys(CO).map(function (k) { return { v: k, label: CO[k].n, sub: CO[k].m ? 'E° = ' + fmt(E[CO[k].m], 2) + ' V' : "E° Fe = −0.44 V" }; }), onChange: function (v) { ctx.goManual(); S.coat = v; S.t = 0; } });
      ui.salt = kit.ui.slider({ label: "Salt (NaCl)", min: 0, max: 3, step: 0.1, value: S.salt, format: function (v) { return fmt(v, 1) + ' %'; }, onInput: function (v) { ctx.goManual(); S.salt = v; } });
      ui.o2 = kit.ui.slider({ label: "Dissolved oxygen", min: 0, max: 100, step: 5, value: S.o2, format: function (v) { return v + ' %'; }, onInput: function (v) { ctx.goManual(); S.o2 = v; } });
      ui.ph = kit.ui.slider({ label: 'pH', min: 2, max: 12, step: 0.5, value: S.ph, format: function (v) { return fmt(v, 1); }, onInput: function (v) { ctx.goManual(); S.ph = v; } });
      c.appendChild(ui.coat); c.appendChild(kit.ui.sliders([ui.salt, ui.o2, ui.ph])); c.appendChild(ctx.btnRow([{ t: "Reset rust", fn: function () { S.t = 0; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Standard reduction potentials", h: 210, note: "More active metal = more negative = oxidized first.", draw: function (cx, w, h, col) {
      var ks = ['mg', 'zn', 'fe', 'sn', 'cu'], L = 40, R = 10, Tp = 10, B = 24, pw = w - L - R, ph = h - Tp - B, y0 = Tp + ph * (2.4 / 2.9), bw = pw / ks.length - 8;
      ks.forEach(function (k, j) { var v = E[k], x = L + j * (bw + 8) + 4, y = Tp + ph * ((0.5 - v) / 2.9); cx.fillStyle = v < E.fe ? '#51cf66' : (v === E.fe ? '#ff922b' : '#ff6b6b'); cx.fillRect(x, Math.min(y, Tp + ph * (0.5 / 2.9)), bw, Math.abs(y - (Tp + ph * (0.5 / 2.9)))); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText(NM[k] + ' ' + fmt(v, 2), x + bw / 2, h - 8); });
    } }],
    calc: function () {
      var a = anode(), row = function (x, y) { return '<tr><th>' + x + '</th><td>' + y + '</td></tr>'; }, pl = PILA.map(function (p) { return p[0] + ': ' + fmt(p[1], 1) + ' V (' + p[2] + ')'; }).join('<br>');
      return '<div class="card-kicker">' + CO[S.coat].n + " · pH " + fmt(S.ph, 1) + '</div><table class="calc-table">' + row("Anode", NM[a] + ' → ' + NM[a] + '²⁺ + 2e⁻ (E° = ' + fmt(E[a], 2) + ' V)') + row('E(O₂/OH⁻)', '1,23 − 0,0592·' + fmt(S.ph, 1) + ' = <b>' + fmt(ecat(), 2) + ' V</b>') + row('ΔE', fmt(ecat(), 2) + ' − (' + fmt(E[a], 2) + ') = <b>' + fmt(ecat() - E[a], 2) + ' V</b>') + row("Fe state", a === 'fe' ? "it corrodes" : "cathodically protected") + row("Commercial batteries", pl) + '</table>';
    },
    quiz: [
      { q: "In the corrosion of iron, the cathode is the zone where…", options: ["O₂ is reduced", "Fe is oxidized", "H₂ is always formed", "there are no electrons"], answer: 0, why: "O₂ + 2H₂O + 4e⁻ → 4OH⁻." },
      { q: "Iron galvanized with Zn, even if scratched…", options: ["remains protected: the Zn is oxidized", "corrodes faster", "does not change", "forms metallic Zn"], answer: 0, why: "E°(Zn) < E°(Fe)." },
      { q: "Scratched tinplate (Sn)…", options: ["accelerates the corrosion of Fe", "protects Fe", "is not affected", "removes oxygen"], answer: 0, why: "Sn is less active than Fe." },
      { q: "Salt increases corrosion because…", options: ["it improves the conductivity of the electrolyte", "it is a strong oxidant", "it lowers the temperature", "it forms a coating"], answer: 0, why: "It makes ion transport easier." },
      { q: "A sacrificial anode must be…", options: ["more active than iron", "less active than iron", "an insulator", "inert"], answer: 0, why: "Example: Mg or Zn." },
      { q: "If the pH decreases, the potential of O₂/OH⁻…", options: ["increases", "decreases", "does not change", "drops to zero"], answer: 0, why: "E = 1.23 − 0.0592·pH." }
    ],
    help: { intro: "Choose the coating and adjust salt, oxygen and pH. The half-reactions and the corrosion index are shown. “Reset rust” clears the accumulation.", items: [['Scene', 'orange spheres = Fe²⁺ dissolving (anode); cyan = OH⁻ at the cathode; yellow = electrons; the brown patches are accumulated rust.'], ['Controls', 'the coating (for example Zn, Sn or Mg), “Salt (NaCl)”, “Dissolved oxygen” and “pH”; the panel shows the half-reactions and the corrosion index. “Reset rust” clears it.'], ['Chart', '“Standard reduction potentials”: the metal with the lower E° is the one that is oxidised.']], try: ['Raise the salt and oxygen: corrosion speeds up.', 'Compare scratched Zn and Sn coatings: Zn keeps protecting; Sn speeds up the corrosion of Fe.', 'Try a Mg sacrificial anode: it is oxidised and the iron stays protected.'] }
  };
  MSim.create(def);
})();
