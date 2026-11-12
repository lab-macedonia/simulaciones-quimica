/* Volcanes y erupciones — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js y ../../kit/msim.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;
(function () {
  var T = THREE, f1 = function (x) { return fmt(x, 1); }, f0 = function (x) { return fmt(x, 0); };
  var EJ = [['Villarrica', 'stratovolcano, effusive eruptions and lahars (2015)'], ['Calbuco', 'sub-Plinian explosive eruption (2015)'], ['Chaitén', 'rhyolitic explosive eruption (2008)'], ['Kīlauea (Hawaii)', 'shield volcano, basaltic lava flows']];
  var S = { si: 50, gas: 2, ice: false, run: true, t: 0, alert: 0 };
  var NP = 420, P = [], pts, G = {}, lab = {}, H = 4.2, R = 5;
  function visc() { return Math.pow(10, (S.si - 45) / 30 * 7 + 1); }   // Pa·s aproximado: 10 (basalto) a 10⁸ (riolita)
  function expl() { return clamp((S.si - 52) / 18 * 0.7 + (S.gas - 1) / 5 * 0.5, 0, 1); }
  function vei() { return Math.round(clamp(expl() * 6 + 0.3, 0, 6)); }
  function type() { var e = expl(); return e < 0.25 ? 'effusive' : e < 0.6 ? 'mixed' : 'explosive'; }
  function rock() { return S.si < 52 ? 'basaltic' : S.si < 63 ? 'andesitic' : S.si < 69 ? 'dacitic' : 'rhyolitic'; }
  function surfY(r) { return H * (1 - r / R); }
  function stages() {
    return [
      ['Structure of a volcano', 'Structure', 'Magma chamber, vent, crater and cone',
        '<p>A <b>volcano</b> is an opening through which <b>magma</b> (molten rock with dissolved gases) escapes from the interior. Magma gathers in a <b>magma chamber</b> a few kilometres down, rises through the <b>vent</b> and comes out of the <b>crater</b>. As lava and ash pile up eruption after eruption, the <b>cone</b> is built. Outside the volcano, magma is called <b>lava</b>.</p>'],
      ['Effusive eruption', 'Effusive', 'Runny, gas-poor magma: lava flows',
        '<p>If the magma has <b>little silica</b> (basaltic) it is <b>runny</b> (low viscosity) and gases escape easily. The eruption is <b>effusive</b>: lava pours out in <b>flows</b> that run down the slopes, as in Hawaii. They are spectacular but generally less dangerous to people, because they advance slowly.</p>'],
      ['Explosive eruption', 'Explosive', 'Viscous, gas-rich magma: ash column and pyroclasts',
        '<p>With <b>a lot of silica</b> (andesitic or rhyolitic) the magma is very <b>viscous</b> and traps the gases. As it rises, pressure drops and the gases expand suddenly, like opening a shaken fizzy drink: the eruption is <b>explosive</b> and throws up an <b>ash column</b> several kilometres high, <b>pyroclasts</b> and pyroclastic flows. The Volcanic Explosivity Index (<b>VEI</b>) runs from 0 to 8.</p>'],
      ['Volcanic hazards', 'Hazards', 'Lava flows, ash fall, lahars and gases',
        '<p>Besides lava, an eruption produces <b>ash fall</b> (harmful to lungs, crops, engines and roofs), <b>pyroclastic flows</b> (very fast, scorching clouds), toxic <b>gases</b> and <b>lahars</b>: mudflows that form when the heat <b>melts the summit glacier</b>, as happens at Villarrica. Lahars follow river channels and can travel far.</p>'],
      ['Volcanoes of Chile', 'Chile', 'Chile has about 90 active volcanoes monitored by SERNAGEOMIN',
        '<p>Because of the subduction of the Nazca plate, Chile has about <b>90 geologically active volcanoes</b>. <b>SERNAGEOMIN</b> (the national geology and mining service) monitors them and issues a <b>technical alert</b> (green, yellow, orange or red) according to their activity: earthquakes, ground deformation, gases. Recent examples: Chaitén (2008), Calbuco (2015) and Villarrica (2015). Knowing the evacuation routes is part of prevention.</p>'],
      ['Benefits of volcanoes', 'Benefits', 'Fertile soils, geothermal energy and tourism',
        '<p>Volcanoes also bring benefits: weathered ash forms <b>fertile soils</b>; the internal heat provides <b>geothermal energy</b> (in Chile, the Cerro Pabellón plant in Antofagasta) and <b>hot springs</b>; and their landscapes attract <b>tourism</b>. Volcanic gases also formed the Earth’s early atmosphere and oceans.</p>']
    ];
  }
  function lessonSet(i, l) {
    S.ice = false; S.alert = 0;
    if (i === 0) { S.si = 50; S.gas = 1; S.run = false; }
    else if (i === 1) { S.si = 48; S.gas = 1.5; S.run = true; }
    else if (i === 2) { S.si = 66; S.gas = 5; S.run = true; }
    else if (i === 3) { S.si = 56; S.gas = 3; S.run = true; S.ice = true; }
    else if (i === 4) { S.si = 58; S.gas = 3; S.run = l > 0.3; S.alert = Math.min(3, Math.floor(l * 4)); }
    else { S.si = 50; S.gas = 1; S.run = false; }
  }
  function spawn(p) { p.age = 0; p.kind = expl() > Math.random() * 1.1 ? 'ash' : 'lava'; if (S.ice && Math.random() < 0.25) p.kind = 'lahar'; var a = Math.random() * Math.PI * 2; p.a = a; p.r = 0.3; p.y = H; p.vy = p.kind === 'ash' ? 2.5 + 4 * expl() + Math.random() * 2 : 0; p.vr = p.kind === 'ash' ? 0.2 + Math.random() * 0.6 : 0.15 + 0.6 * (1 - (S.si - 45) / 30) + Math.random() * 0.2; if (p.kind === 'lahar') { p.a = 0.6 + Math.random() * 0.25; p.vr = 1.4; } }
  var def = {
    key: 'volcanes', title: 'Volcanoes and eruptions', subtitle: '3D simulator · Earth sciences', accent: { dark: '#ff8787', light: '#c92a2a' },
    stages: stages, nStages: 6, dur: 12, offset: 0.2,
    views: [{ id: 'libre', label: 'Free', pos: [-2.5, 7, 21], target: [-2.5, 3.2, 0] }, { id: 'corte', label: 'Section', pos: [-2.5, 2.5, 21], target: [-2.5, 1.8, 0] }],
    layers: [{ id: 'int', label: 'Interior (cutaway)', icon: '◐' }],
    build: function (ctx) {
      var s = ctx.scene; G.cone = new T.Mesh(new T.ConeGeometry(R, H, 48, 1, true), new T.MeshStandardMaterial({ color: 0x6d5a4d, roughness: 0.95, transparent: true, opacity: 0.55, side: T.DoubleSide })); G.cone.position.y = H / 2; s.add(G.cone);
      var ground = new T.Mesh(new T.CylinderGeometry(7.5, 7.5, 0.2, 48), new T.MeshStandardMaterial({ color: 0x5c7c3a, roughness: 1 })); ground.position.y = -0.1; s.add(ground);
      var under = new T.Mesh(new T.CylinderGeometry(7.5, 7.5, 3.6, 48, 1, true), new T.MeshStandardMaterial({ color: 0x7a5c48, side: T.DoubleSide, transparent: true, opacity: 0.25, depthWrite: false })); under.position.y = -1.9; s.add(under);
      G.ch = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: 0xff6b2b, emissive: 0x8a2a00 })); G.ch.scale.set(2.2, 0.9, 1.6); G.ch.position.y = -2.4; s.add(G.ch);
      G.cond = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, H + 2.4, 12), new T.MeshStandardMaterial({ color: 0xff8c42, emissive: 0x7a2a00 })); G.cond.position.y = (H - 2.4) / 2; s.add(G.cond);
      G.ice = new T.Mesh(new T.ConeGeometry(1.5, 1.25, 32), new T.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.4 })); G.ice.position.y = H - 0.55; s.add(G.ice);
      var pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3); for (var i = 0; i < NP; i++) { P.push({ age: 9, kind: 'lava' }); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      pts = new T.Points(g, new T.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.95 })); pts.frustumCulled = false; s.add(pts);
      G.flag = new T.Mesh(new T.BoxGeometry(0.9, 0.6, 0.05), new T.MeshBasicMaterial({ color: 0x51cf66 })); G.flag.position.set(-7, 2.4, 3); s.add(G.flag);
      var pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.4, 6), new T.MeshStandardMaterial({ color: 0xadb5bd })); pole.position.set(-7.45, 1.2, 3); s.add(pole);
      ['a', 'b', 'c', 'd', 'e'].forEach(function (k) { lab[k] = ctx.label('', 'bl-d'); });
    },
    frame: function (ctx, f, dt) {
      if (!ctx.P.manual) lessonSet(f.i, f.local);
      var inner = ctx.layer('int'); G.ch.visible = G.cond.visible = inner; G.cone.material.opacity = inner ? 0.45 : 0.95; G.ice.visible = S.ice;
      G.flag.material.color.setHex([0x51cf66, 0xfcc419, 0xff922b, 0xfa5252][S.alert]);
      var pa = pts.geometry.attributes.position.array, ca = pts.geometry.attributes.color.array, ex = expl();
      for (var i = 0; i < NP; i++) {
        var p = P[i];
        if (p.age > (p.kind === 'ash' ? 6 : 8)) { if (S.run && Math.random() < 0.08 + ex * 0.2) spawn(p); else { pa[i * 3 + 1] = -50; continue; } }
        p.age += dt;
        if (p.kind === 'ash') { p.y += p.vy * dt; p.vy -= (p.y > H + 3 + 8 * ex ? 1.6 : 0.15) * dt; p.r += p.vr * dt * (p.y > H + 2 ? 1.6 : 0.5); if (p.y < surfY(Math.min(p.r, R))) p.age = 99; }
        else { p.r = Math.min(R + 2.5, p.r + p.vr * dt * (p.kind === 'lahar' ? 1 : 0.9 - 0.5 * clamp((p.r - 0.3) / R, 0, 1))); p.y = p.r < R ? surfY(p.r) + 0.12 : 0.08; }
        pa[i * 3] = Math.cos(p.a) * p.r; pa[i * 3 + 1] = p.y; pa[i * 3 + 2] = Math.sin(p.a) * p.r;
        var c = p.kind === 'ash' ? [0.55, 0.55, 0.58] : p.kind === 'lahar' ? [0.45, 0.33, 0.22] : [1, clamp(0.55 - p.age * 0.08, 0.1, 0.55), 0.1 * Math.max(0, 1 - p.age)];
        ca[i * 3] = c[0]; ca[i * 3 + 1] = c[1]; ca[i * 3 + 2] = c[2];
      }
      pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
      Object.keys(lab).forEach(function (k) { lab[k].vis(false); });
      lab.a.pos(0, H + 1 + (S.run ? 3 * ex : 0), 0).set(S.run ? 'Eruption: ' + type() + ' · VEI ≈ ' + vei() : 'Volcano at rest', S.run ? 'bl-warn' : 'bl-d').vis(true);
      if (inner) { lab.b.pos(3, -2.4, 0).set('Magma chamber', 'bl-pos').vis(true); lab.c.pos(1.4, 1.4, 0).set('Vent', 'bl-d').vis(true); lab.d.pos(1.2, H + 0.2, 0).set('Crater', 'bl-d').vis(!S.run); }
      if (S.ice) lab.e.pos(4.6, 1.2, 3).set('Lahar: mud from the melted glacier', 'bl-lead').vis(true);
      if (ctx.f && ctx.f.i === 4 && !ctx.P.manual) lab.e.pos(-7, 3.2, 3).set('Technical alert ' + ['green', 'yellow', 'orange', 'red'][S.alert], 'bl-lead').vis(true);
    },
    sync: function (ctx) { var u = ctx.ui; if (!ctx.P.manual) { u.si && u.si.set(S.si); u.gas && u.gas.set(S.gas); } },
    hud: function () { return { eq: { chip: '▲', name: 'Magma ' + rock(), body: '<div class="eqline"><small>Silica</small>' + f0(S.si) + ' % SiO₂</div><div class="eqline"><small>Viscosity</small>≈ 10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s</div><div class="eqline"><small>Gases</small>' + f1(S.gas) + ' %</div><div class="eqline"><small>Type</small>' + type() + '</div>' }, legend: [{ label: 'Orange', color: '#ff922b', text: 'lava' }, { label: 'Grey', color: '#adb5bd', text: 'ash and pyroclasts' }, { label: 'Brown', color: '#8d6e4f', text: 'lahar (mudflow)' }] }; },
    measures: function () { return [['Rock / magma', rock()], ['Silica', f0(S.si) + ' %'], ['Dissolved gases', f1(S.gas) + ' %'], ['Approx. viscosity', '10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s'], ['Eruption type', type()], ['Approx. VEI', String(vei())], ['Ash column', S.run && expl() > 0.25 ? '≈ ' + f0(2 + 30 * expl()) + ' km' : '—']]; },
    ideas: ['Magma: molten rock + gases; outside the volcano it is called lava.', 'Little silica → runny → effusive eruption (flows).', 'Lots of silica and gas → viscous → explosive (ash).', 'Hazards: lava flows, ash, pyroclastic flows, lahars, gases.', 'Chile: ≈ 90 active volcanoes; SERNAGEOMIN alert system.', 'Benefits: fertile soils, geothermal energy, tourism.'],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card('Magma'); el.appendChild(c);
      ui.si = kit.ui.slider({ label: 'Silica SiO₂ (%)', min: 45, max: 75, step: 1, value: S.si, digits: 0, onInput: function (v) { ctx.goManual(); S.si = v; } });
      ui.gas = kit.ui.slider({ label: 'Dissolved gases (%)', min: 0.5, max: 6, step: 0.1, value: S.gas, digits: 1, onInput: function (v) { ctx.goManual(); S.gas = v; } });
      c.appendChild(kit.ui.sliders([ui.si, ui.gas]));
      c.appendChild(ctx.btnRow([{ t: 'Erupt / rest', primary: true, fn: function () { ctx.goManual(); S.run = !S.run; } }, { t: 'Glacier on / off', fn: function () { ctx.goManual(); S.ice = !S.ice; } }, { t: 'Raise alert', fn: function () { ctx.goManual(); S.alert = (S.alert + 1) % 4; } }]));
      el.appendChild(ctx.btnRow([{ t: 'Back to the lesson', fn: function () { ctx.toLesson(); } }]));
      var c2 = kit.ui.card('Example volcanoes'); c2.insertAdjacentHTML('beforeend', kit.ui.table(['Volcano', 'Features'], EJ)); el.appendChild(c2);
    },
    graphs: [
      { title: 'Eruption type by silica and gases', h: 230, note: 'Bottom left: runny, effusive magmas; top right: viscous, explosive ones. The dot is the current magma.', draw: function (cx, w, h, col) {
        var L = 40, R2 = 10, Tp = 10, B = 28, pw = w - L - R2, ph = h - Tp - B, sx = function (s) { return L + pw * (s - 45) / 30; }, sy = function (g) { return Tp + ph - ph * (g - 0.5) / 5.5; }, i, j;
        for (i = 0; i < 30; i++) for (j = 0; j < 22; j++) { var si = 45 + i + 0.5, ga = 0.5 + j * 0.25 + 0.125, e = clamp((si - 52) / 18 * 0.7 + (ga - 1) / 5 * 0.5, 0, 1); cx.fillStyle = 'rgba(' + Math.round(255 * (0.5 + e / 2)) + ',' + Math.round(150 - 90 * e) + ',' + Math.round(60 + 80 * e) + ',.35)'; cx.fillRect(sx(45 + i), sy(0.75 + j * 0.25), pw / 30 + 1, ph / 22 + 1); }
        cx.font = '10.5px system-ui'; cx.fillStyle = col.muted; cx.textAlign = 'center'; for (i = 45; i <= 75; i += 5) cx.fillText(i, sx(i), h - B + 13); cx.fillText('silica (%)  ·  gases (%)', L + pw / 2, h - 3);
        cx.textAlign = 'right'; for (i = 1; i <= 6; i++) cx.fillText(i, L - 5, sy(i) + 3);
        cx.fillStyle = col.ink; cx.textAlign = 'left'; cx.fillText('effusive', sx(46), sy(0.9)); cx.textAlign = 'right'; cx.fillText('explosive', sx(74), sy(5.6));
        cx.fillStyle = '#fff'; cx.strokeStyle = '#c92a2a'; cx.lineWidth = 2; cx.beginPath(); cx.arc(sx(S.si), sy(S.gas), 6, 0, 7); cx.fill(); cx.stroke(); cx.lineWidth = 1;
      } }
    ],
    calc: function () {
      var row = function (a, x) { return '<tr><th>' + a + '</th><td>' + x + '</td></tr>'; };
      return '<div class="card-kicker">Magma ' + rock() + '</div><table class="calc-table">' + row('Silica', f0(S.si) + ' % → ' + (S.si < 52 ? 'runny' : S.si < 63 ? 'intermediate' : 'very viscous')) + row('Viscosity', '≈ 10^' + f1(Math.log(visc()) / Math.LN10) + ' Pa·s (water: 10⁻³; honey: 10)') + row('Gases', f1(S.gas) + ' % dissolved') + row('Expected eruption', '<b>' + type() + '</b> · VEI ≈ ' + vei()) + row('Main hazard', type() === 'effusive' ? 'lava flows' : type() === 'mixed' ? 'ash and lava flows' : 'ash column and pyroclastic flows') + '</table>';
    },
    quiz: [
      { q: 'Magma that reaches the surface is called…', options: ['lava', 'ash', 'lahar', 'crater'], answer: 0, why: 'Magma underground, lava at the surface.' },
      { q: 'A silica-poor magma produces … eruptions', options: ['effusive, with lava flows', 'very explosive', 'lava-free', 'water'], answer: 0, why: 'It is runny and the gases escape easily.' },
      { q: 'The most explosive eruptions have … magma', options: ['viscous, gas-rich', 'runny, gas-free', 'cold, solid', 'salt-water'], answer: 0, why: 'The trapped gases expand suddenly.' },
      { q: 'A lahar is…', options: ['a mudflow of mud and meltwater', 'a lava flow', 'a cloud of gases', 'a volcanic earthquake'], answer: 0, why: 'It forms when the summit glacier melts.' },
      { q: 'Chile has many volcanoes because…', options: ['the Nazca plate subducts beneath the South American plate', 'it has many deserts', 'it is near the South Pole', 'its climate is temperate'], answer: 0, why: 'Subduction generates magma beneath the Andes.' },
      { q: 'The agency that monitors volcanoes in Chile is…', options: ['SERNAGEOMIN', 'the DGAC', 'the SII', 'CONAF'], answer: 0, why: 'It issues the technical volcanic alert.' },
      { q: 'A benefit of volcanoes is…', options: ['geothermal energy', 'ash fall', 'lahars', 'toxic gases'], answer: 0, why: 'Example: Cerro Pabellón, in Antofagasta.' },
      { q: 'Volcanic ash is dangerous because…', options: ['it harms lungs, engines, crops and roofs', 'it is radioactive', 'it is always at 1000 °C', 'it is harmless'], answer: 0, why: 'Fine, abrasive particles of rock and glass.' }
    ],
    help: { intro: 'In «Lab» change the magma’s silica and gas content to go from effusive to explosive eruptions; add a glacier to see a lahar or raise the technical alert.', items: [['Dots', 'orange: lava; grey: ash; brown: lahar.'], ['Interior layer', 'shows the magma chamber and the vent.'], ['Graph', 'map of eruption type by silica and gases.']], try: ['Raise the silica from 48 to 70 %: what changes in the eruption?', 'With little silica, raise the gases a lot: does it become explosive?', 'Turn on the glacier: where does the lahar flow?'] }
  };
  MSim.create(def);
})();
