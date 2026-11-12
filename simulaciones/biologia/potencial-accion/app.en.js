/* Potencial de membrana y potencial de acción — simulador 3D · Laboratorio MACEDONIA (UMCE). Usa el kit común ../../kit/simkit.js */
var fmt = SimKit.fmt, clamp = SimKit.clamp;



(function () {
  var T = THREE, NS = 16, DLY = 3;
  var S = { ko: 5, ki: 140, nao: 145, nai: 15, pr: 0.04, I: 15, blk: 'none', auto: 1, t: 0, dl: 6, pulse: 0 };
  var X = { V: -65, m: 0.053, h: 0.596, n: 0.318 }, H = [], g = null, seg = [], na = [], kk = [], lab = [], acc = 0, simT = 0, fired = [0, 0], I0 = 0;
  function nern(o, i) { return 61.5 * Math.log(o / i) / Math.LN10; }
  function EK() { return nern(S.ko, S.ki); } function ENa() { return nern(S.nao, S.nai); }
  function gold() { return 61.5 * Math.log((S.ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; }
  function vt(x, y) { return Math.abs(x / y) < 1e-6 ? y : x / (1 - Math.exp(-x / y)); }
  function gNa() { return 120 * (S.blk === 'ttx' ? 0 : 1); } function gK() { return 36 * (S.blk === 'tea' ? 0 : 1); }
  function step(dt) {
    var V = X.V, am = 0.1 * vt(V + 40, 10), bm = 4 * Math.exp(-(V + 65) / 18), ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10)), an = 0.01 * vt(V + 55, 10), bn = 0.125 * Math.exp(-(V + 65) / 80);
    var I = S.pulse > 0 ? S.I : 0; if (S.pulse > 0) S.pulse -= dt;
    X.m += dt * (am * (1 - X.m) - bm * X.m); X.h += dt * (ah * (1 - X.h) - bh * X.h); X.n += dt * (an * (1 - X.n) - bn * X.n);
    X.V += dt * (I - gNa() * Math.pow(X.m, 3) * X.h * (V - ENa()) - gK() * Math.pow(X.n, 4) * (V - EK()) - 0.3 * (V + 54.4));
  }
  function advance(ms) { var k = Math.round(ms / 0.01), j; for (j = 0; j < k; j++) { step(0.01); simT += 0.01; if (j % 10 === 0) { H.push([X.V, X.m, X.h, X.n]); if (H.length > 600) H.shift(); } } }
  function stages() {
    return [
      ["Equilibrium potential (Nernst)", 'Nernst', "E = 61.5 mV · log([ion]ext/[ion]int)",
        "<p>A membrane with channels selective for one ion reaches an <b>equilibrium potential</b> when the chemical gradient is balanced by the electrical one: <b>E = (RT/zF)·ln([ion]out/[ion]in)</b>, ≈ 61.5·log₁₀(out/in) mV at 37 °C for a monovalent cation. With K⁺ at 5 mM outside and 140 mM inside, E<sub>K</sub> ≈ −77 mV; for Na⁺ (145/15 mM), E<sub>Na</sub> ≈ +60 mV.</p>"],
      ["Resting potential (Goldman)", "Rest", "Vm depends on the relative permeability of each ion",
        "<p>The resting neuron is permeable mainly to K⁺ and very little to Na⁺. The <b>Goldman</b> equation weights each ion by its permeability: <b>V<sub>m</sub> = 61.5·log[(P<sub>K</sub>[K]<sub>o</sub> + P<sub>Na</sub>[Na]<sub>o</sub>)/(P<sub>K</sub>[K]<sub>i</sub> + P<sub>Na</sub>[Na]<sub>i</sub>)]</b>. With P<sub>Na</sub>/P<sub>K</sub> = 0.04 the resting potential is close to −65 mV. Change the external [K⁺] and the permeability.</p>"],
      ["Action potential", "Firing", "Depolarization (Na⁺ enters) → repolarization (K⁺ exits)",
        "<p>A stimulus depolarizes the membrane; once the <b>threshold</b> (~−55 mV) is crossed, the <b>voltage-gated Na⁺ channels</b> open: Na⁺ enters and the voltage rises toward E<sub>Na</sub> (<b>depolarization</b>). Then the Na⁺ channels <b>inactivate</b> and the K⁺ channels open: K⁺ exits (<b>repolarization</b>), with a brief <b>hyperpolarization</b>. It is an <b>all-or-none</b> response that propagates along the axon.</p>"],
      ["Threshold and refractory period", "Refractory", "After a spike, Na⁺ channels are inactive: it cannot fire again",
        "<p>During the <b>absolute refractory period</b> the Na⁺ channels are inactivated and no stimulus triggers another action potential; in the <b>relative</b> period a larger stimulus is needed. This limits the firing rate and makes the impulse travel in only one direction. Watch a second stimulus arrive later and later.</p>"],
      ["Blockers: TTX and TEA", "Blockers", "TTX blocks Na⁺ channels; TEA blocks K⁺ channels",
        "<p><b>Tetrodotoxin (TTX)</b> blocks voltage-gated Na⁺ channels: there is no rising phase and the action potential disappears. <b>Tetraethylammonium (TEA)</b> blocks K⁺ channels: repolarization slows down and the potential is prolonged. Compare both conditions.</p>"]
    ];
  }
  var def = {
    key: 'potencial-accion', title: "Membrane potential and action potential", subtitle: "3D Simulator · biology", accent: { dark: '#74c0fc', light: '#1864ab' },
    stages: stages, nStages: 5, dur: 14, offset: 0.1,
    views: [{ id: 'libre', label: "Free", pos: [16, 6, 20], target: [16, 0, 0] }, { id: 'frontal', label: "Front", pos: [16, 2, 24], target: [16, 0, 0] }],
    layers: [{ id: 'ch', label: "Channels", icon: '▮' }],
    build: function (ctx) {
      g = new T.Group(); g.position.x = 1.5; ctx.scene.add(g); var i;
      for (i = 0; i < NS; i++) {
        var r = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 1.1, 22, 1, true), new T.MeshStandardMaterial({ color: 0x4dabf7, side: T.DoubleSide, transparent: true, opacity: 0.85 })); r.rotation.z = Math.PI / 2; r.position.set(8 + i * 1.2, 0, 0); g.add(r); seg.push(r);
        var a = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0xff6b6b })); a.position.set(8 + i * 1.2, 1.7, 0.5); g.add(a); na.push(a);
        var k = new T.Mesh(new T.BoxGeometry(0.35, 1, 0.35), new T.MeshStandardMaterial({ color: 0x4263eb })); k.position.set(8 + i * 1.2, 1.7, -0.5); g.add(k); kk.push(k);
      }
      for (i = 0; i < 4; i++) lab.push(ctx.label('', 'bl-d'));
    },
    frame: function (ctx, f, dt) {
      var P = ctx.P, i = f.i, k, st = P.manual ? -1 : i, d = Math.min(dt || 0.016, 0.05);
      if (!P.manual) {
        if (i === 0) { S.ko = 2 + 18 * f.local; S.blk = 'none'; S.pr = 0.04; } else if (i === 1) { S.ko = 5; S.pr = 0.01 + 0.19 * f.local; S.blk = 'none'; } else { S.ko = 5; S.pr = 0.04; }
        if (i === 2) { S.blk = 'none'; S.I = 15; } if (i === 3) { S.blk = 'none'; S.dl = 3 + 12 * f.local; } if (i === 4) { S.blk = f.local < 0.5 ? 'ttx' : 'tea'; }
        if (i >= 2) { var per = 50; S.t += d * 8; var c = S.t % per; if (i === 3) { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c >= 0.4 && c < 20) { if (c > S.dl && !fired[1]) { S.pulse = 1; fired[1] = 1; } } if (c > 30) { fired = [0, 0]; } if (c < 0.4) fired[1] = 0; } else { if (c < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (c > 5) fired[0] = 0; } }
      } else if (S.auto) { S.t += d * 8; if (S.t % 50 < 0.4 && !fired[0]) { S.pulse = 1; fired[0] = 1; } if (S.t % 50 > 5) fired[0] = 0; }
      advance(d * 8);
      var n = H.length, cur = H[n - 1] || [-65, 0.05, 0.6, 0.3], on = ctx.layer('ch');
      for (k = 0; k < NS; k++) {
        var idx = Math.max(0, n - 1 - k * DLY), s = H[idx] || cur, tv = Math.max(0, Math.min(1, (s[0] + 80) / 130));
        seg[k].material.color.set(0x4dabf7).lerp(new T.Color(0xff6b6b), tv); na[k].visible = kk[k].visible = on;
        var oN = Math.pow(s[1], 3) * s[2] * 3.5, oK = Math.pow(s[3], 4) * 1.5; na[k].scale.y = 0.2 + 2.2 * Math.min(1, oN); kk[k].scale.y = 0.2 + 2.2 * Math.min(1, oK); na[k].position.y = 1.4 + 0.5 * na[k].scale.y; kk[k].position.y = 1.4 + 0.5 * kk[k].scale.y;
      }
      var state = cur[0] > -55 && cur[1] > 0.3 ? "depolarization" : (cur[0] < -68 ? "hyperpolarization" : (cur[3] > 0.5 && cur[0] > -60 ? "repolarization" : 'reposo'));
      lab[0].pos(17.5, 4.6, 0).set('V = ' + fmt(cur[0], 1) + " mV · " + state, cur[0] > -55 ? 'bl-neg' : 'bl-lead').vis(true);
      lab[1].pos(17.5, -3.2, 0).set('E(K⁺) = ' + fmt(EK(), 0) + " mV · E(Na⁺) = " + fmt(ENa(), 0) + ' mV', 'bl-d').vis(true);
      lab[2].pos(10.5, 3.6, 0).set('Na⁺', 'bl-neg').vis(on); lab[3].pos(24.5, 3.6, 0).set('K⁺', 'bl-pos').vis(on);
    },
    sync: function (ctx) { var u = ctx.ui; ['ko', 'ki', 'nao', 'nai', 'pr', 'I'].forEach(function (k) { if (u[k]) u[k].set(S[k]); }); if (u.blk) u.blk.set(S.blk); },
    hud: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return { eq: { chip: 'Vm', name: "Membrane", body: "<div class=\"eqline\"><small>Vm</small>" + fmt(c[0], 1) + " mV</div><div class=\"eqline\"><small>Goldman (rest)</small>" + fmt(gold(), 1) + " mV</div><div class=\"eqline\"><small>E K⁺ / Na⁺</small>" + fmt(EK(), 0) + ' / ' + fmt(ENa(), 0) + " mV</div><div class=\"eqline\"><small>Blocker</small>" + (S.blk === 'none' ? "none" : S.blk.toUpperCase()) + '</div>' }, legend: [{ label: "Red", color: '#ff6b6b', text: "Na⁺ channel (height = opening)" }, { label: "Blue", color: '#4263eb', text: "K⁺ channel" }, { label: "Ring", color: '#4dabf7', text: "local voltage (blue → red)" }] }; },
    measures: function () { var c = H[H.length - 1] || [-65, 0, 0, 0]; return [['Vm', fmt(c[0], 1) + ' mV'], ["E K⁺ (Nernst)", fmt(EK(), 1) + ' mV'], ["E Na⁺ (Nernst)", fmt(ENa(), 1) + ' mV'], ["Rest (Goldman)", fmt(gold(), 1) + ' mV'], ['gNa·m³h', fmt(gNa() * Math.pow(c[1], 3) * c[2], 1) + " mS/cm²"], ['gK·n⁴', fmt(gK() * Math.pow(c[3], 4), 1) + " mS/cm²"]]; },
    ideas: ["Nernst: a single ion.", "Goldman: several ions and permeabilities.", "All-or-none above the threshold.", "TTX blocks Na⁺; TEA blocks K⁺."],
    lab: function (el, ctx) {
      var kit = ctx.kit, ui = ctx.ui, c = kit.ui.card("Ions and stimulus"); el.appendChild(c);
      function sl(k, l, a, b, st, fm) { ui[k] = kit.ui.slider({ label: l, min: a, max: b, step: st, value: S[k], format: fm, onInput: function (v) { ctx.goManual(); S[k] = v; } }); return ui[k]; }
      var mM = function (v) { return fmt(v, 1) + ' mM'; };
      c.appendChild(kit.ui.sliders([sl('ko', "External [K⁺]", 1, 25, 0.5, mM), sl('ki', "[K⁺] internal", 50, 200, 5, mM), sl('nao', "[Na⁺] external", 100, 200, 5, mM), sl('nai', "[Na⁺] internal", 5, 50, 1, mM), sl('pr', "P(Na)/P(K) at rest", 0.01, 0.2, 0.01, function (v) { return fmt(v, 2); }), sl('I', "Stimulus intensity", 0, 40, 1, function (v) { return v + " µA/cm²"; })]));
      ui.blk = kit.ui.options({ label: "Blocker", cols: 3, value: S.blk, options: [{ v: 'none', label: "None" }, { v: 'ttx', label: 'TTX' }, { v: 'tea', label: 'TEA' }], onChange: function (v) { ctx.goManual(); S.blk = v; } }); c.appendChild(ui.blk);
      c.appendChild(ctx.btnRow([{ t: "Stimulate", fn: function () { ctx.goManual(); S.pulse = 1; } }, { t: "Back to the lesson", fn: function () { ctx.toLesson(); } }]));
    },
    graphs: [{ title: "Membrane potential V(t)", h: 210, note: "Last 60 ms. Lines: threshold (−55 mV) and E(Na⁺).", draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, y = function (v) { return Tp + ph * (1 - (v + 90) / 160); }, i, n = Math.min(H.length, 600), s0 = H.length - 600;
      cx.strokeStyle = col.muted; cx.setLineDash && cx.setLineDash([3, 3]); [-55, ENa()].forEach(function (v) { cx.beginPath(); cx.moveTo(L, y(v)); cx.lineTo(L + pw, y(v)); cx.stroke(); }); cx.setLineDash && cx.setLineDash([]);
      cx.strokeStyle = '#74c0fc'; cx.lineWidth = 2; cx.beginPath(); for (i = 0; i < H.length; i++) { var x = L + pw * (i + (600 - H.length)) / 600, yy = y(H[i][0]); i ? cx.lineTo(x, yy) : cx.moveTo(x, yy); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; [-80, -55, 0, 50].forEach(function (v) { cx.fillText(v, L - 4, y(v) + 3); }); cx.textAlign = 'center'; cx.fillText("−60 ms", L, h - 6); cx.fillText('ahora', L + pw, h - 6);
    } }, { title: "Conductances gNa and gK", h: 190, note: "gNa(t) = ḡ·m³h (red) · gK(t) = ḡ·n⁴ (blue).", draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i; [[1, '#ff6b6b'], [3, '#748ffc']].forEach(function (q) { cx.strokeStyle = q[1]; cx.lineWidth = 2; cx.beginPath(); H.forEach(function (s, i2) { var v = q[0] === 1 ? gNa() * Math.pow(s[1], 3) * s[2] : gK() * Math.pow(s[3], 4), x = L + pw * (i2 + (600 - H.length)) / 600, y = Tp + ph * (1 - Math.min(1, v / 40)); i2 ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); }); cx.lineWidth = 1;
      cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'right'; cx.fillText('40', L - 4, Tp + 8); cx.fillText('0', L - 4, Tp + ph); cx.textAlign = 'center'; cx.fillText('mS/cm²', L + 10, h - 6);
    } }, { title: "Resting potential versus external [K⁺] (Goldman)", h: 190, note: "With the chosen permeability; the dot marks your [K⁺]e.", draw: function (cx, w, h, col) {
      var L = 38, R = 10, Tp = 10, B = 22, pw = w - L - R, ph = h - Tp - B, i, y = function (v) { return Tp + ph * (1 - (v + 100) / 100); }; cx.strokeStyle = '#69db7c'; cx.lineWidth = 2; cx.beginPath();
      for (i = 0; i <= 48; i++) { var ko = 1 + i * 0.5, v = 61.5 * Math.log((ko + S.pr * S.nao) / (S.ki + S.pr * S.nai)) / Math.LN10; var x = L + pw * i / 48; i ? cx.lineTo(x, y(v)) : cx.moveTo(x, y(v)); } cx.stroke(); cx.lineWidth = 1;
      cx.fillStyle = '#ff6b6b'; cx.beginPath(); cx.arc(L + pw * (S.ko - 1) / 24, y(gold()), 5, 0, 6.28); cx.fill(); cx.fillStyle = col.muted; cx.font = '10px system-ui'; cx.textAlign = 'center'; cx.fillText("1 mM", L, h - 6); cx.fillText("25 mM", L + pw, h - 6); cx.textAlign = 'right'; cx.fillText('−100', L - 4, y(-100)); cx.fillText('0', L - 4, y(0) + 3);
    } }],
    calc: function () { var row = function (a, b) { return '<tr><th>' + a + '</th><td>' + b + '</td></tr>'; }; return "<div class=\"card-kicker\">37 °C · monovalent ions</div><table class=\"calc-table\">" + row('E(K⁺)', '61,5·log(' + fmt(S.ko, 1) + ' / ' + fmt(S.ki, 0) + ') = <b>' + fmt(EK(), 1) + ' mV</b>') + row('E(Na⁺)', '61,5·log(' + fmt(S.nao, 0) + ' / ' + fmt(S.nai, 0) + ') = <b>' + fmt(ENa(), 1) + ' mV</b>') + row("Vm (Goldman)", '61,5·log[(' + fmt(S.ko, 1) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nao, 0) + ') / (' + fmt(S.ki, 0) + ' + ' + fmt(S.pr, 2) + '·' + fmt(S.nai, 0) + ')] = <b>' + fmt(gold(), 1) + ' mV</b>') + row('Modelo', "Simplified Hodgkin–Huxley (Euler integration, dt = 0.01 ms)") + '</table>'; },
    quiz: [
      { q: "If the external [K⁺] increases, E(K⁺) becomes…", options: ["less negative", "more negative", "does not change", "always positive"], answer: 0, why: "E = 61.5·log(ext/int): rises." },
      { q: "The rising phase of the action potential is due to…", options: ["Na⁺ entry", "K⁺ exit", "Cl⁻ entry", "the Na⁺/K⁺ pump"], answer: 0, why: "Voltage-gated Na⁺ channels." },
      { q: "Tetrodotoxin (TTX) blocks…", options: ["Na⁺ channels", "K⁺ channels", "the Na⁺/K⁺ pump", "Ca²⁺ channels only"], answer: 0, why: "It eliminates the depolarization phase." },
      { q: "In the absolute refractory period…", options: ["the Na⁺ channels are inactivated", "the K⁺ channels are closed", "the membrane is at E(Na⁺)", "the pump stops"], answer: 0, why: "Another potential cannot be generated." },
      { q: "The resting potential approaches E(K⁺) because…", options: ["the membrane is much more permeable to K⁺", "there is no Na⁺ outside", "K⁺ is always smaller than Na⁺", "the pump fixes it at −70 mV"], answer: 0, why: "Goldman weights by permeability." },
      { q: "A subthreshold stimulus produces…", options: ["a local depolarization without an action potential", "a small action potential", "hyperpolarization", "no change"], answer: 0, why: "It is all-or-none." }
    ],
    help: { intro: "Change the ion concentrations and observe Nernst and Goldman. With \"Stimulate\" you fire a potential that travels along the axon; choose TTX or TEA to see its effect.", items: [['Axon', 'red bars = Na⁺ channels (their height shows how open they are) and blue bars = K⁺ channels; the coloured ring is the local voltage (blue → red).'], ['Concentrations', 'when you change them, the panel recalculates each ion’s Nernst potential and the resting potential (Goldman).'], ['Stimulus and blocker', 'the stimulate button fires a potential that travels along the axon; TTX blocks the Na⁺ channels and TEA the K⁺ channels.'], ['Charts', '“Membrane potential V(t)”, “Conductances gNa and gK” and “Resting potential versus external [K⁺] (Goldman)”.']], try: ['Raise external K⁺: the resting potential becomes less negative.', 'Stimulate and follow V(t): the rise matches the opening of the Na⁺ channels and the fall the K⁺ channels.', 'Apply TTX and stimulate: there is only a local depolarisation, no action potential.'] }
  };
  MSim.create(def);
})();
