/* CellApp — armado común de los simuladores de célula 3D sobre SimKit (Laboratorio MACEDONIA · UMCE) */
(function (g) {
  'use strict';
  var T = g.THREE, K = g.CellKit, clamp = K.clamp;
  g.CellApp = {
    run: function (def) {
      var kit, view, S = { manual: false, sel: null, lastStage: -1, game: null };
      var INFO = def.info, ORDER = ['lim', 'inf', 'sin', 'ene', 'dig', 'sop'];
      var STAGES = def.stages.map(function (s) { s.dur = s.dur || 8; return s; });
      function grpName(id) { return (def.groupNames && def.groupNames[id]) || K.GROUPS[id].n; }
      function esc(x) { return x; }

      /* ---------- Información del componente seleccionado ---------- */
      var selBox;
      function infoHTML(id) {
        var i = INFO[id], G = K.GROUPS[i.g];
        return '<div class="sel-head"><span class="sel-dot" style="background:' + i.col + '"></span><h3>' + i.n + '</h3></div>' +
          '<div class="chips"><span class="chip" style="--cc:' + G.c + '">' + grpName(i.g) + '</span><span class="chip">' + i.m + '</span><span class="chip">' + i.s + '</span></div>' +
          "<p><b>Structure.</b> " + i.e + "</p><p><b>Function.</b> " + i.f + '</p>' +
          (i.p ? "<p><b>In this cell.</b> " + i.p + '</p>' : '') +
          "<p class=\"fun\"><b>Did you know…?</b> " + i.c + '</p>' +
          "<div class=\"sel-btns\"><button class=\"btn\" data-a=\"fly\">Zoom in</button><button class=\"btn\" data-a=\"clear\">Clear selection</button></div>";
      }
      function paintSel() {
        if (!selBox) return;
        if (!S.sel) {
          selBox.innerHTML = "<p class=\"muted\">Click on any component of the 3D model, on its label, or choose it in the <b>Components</b> tab. You will see its structure, its function and a curious fact.</p>";
          return;
        }
        selBox.innerHTML = infoHTML(S.sel);
        selBox.querySelector('[data-a="fly"]').onclick = function () { view.flyTo(S.sel); };
        selBox.querySelector('[data-a="clear"]').onclick = function () { choose(null); };
        var l = document.querySelectorAll('.comp-btn'); l.forEach(function (b) { b.classList.toggle('on', b.dataset.id === S.sel); });
      }
      function choose(id, quiet) {
        if (id && !INFO[id]) return;
        S.manual = !!id; S.sel = id; view.select(id);
        if (id) { view.setFocus(null); if (!quiet) view.flyTo(id); }
        else { S.lastStage = -1; }
        paintSel(); document.querySelectorAll('.comp-btn').forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); });
        if (kit) kit.refresh();
      }

      /* ---------- Pestañas ---------- */
      function buildComps(el) {
        var c = kit.ui.card("Cell components");
        c.insertAdjacentHTML('beforeend', "<p class=\"muted\">Press one to see it in 3D and read its fact sheet. “Back to the lesson” resumes the guided tour.</p>");
        ORDER.forEach(function (gid) {
          var ids = def.ids.filter(function (id) { return INFO[id].g === gid; }); if (!ids.length) return;
          var G = K.GROUPS[gid], blk = document.createElement('div'); blk.className = 'comp-grp';
          blk.innerHTML = '<div class="comp-h" style="--cc:' + G.c + '"><i></i>' + grpName(gid) + '</div>';
          var row = document.createElement('div'); row.className = 'comp-row';
          ids.forEach(function (id) {
            var b = document.createElement('button'); b.className = 'comp-btn'; b.dataset.id = id; b.innerHTML = '<i style="background:' + INFO[id].col + '"></i>' + INFO[id].n;
            b.onclick = function () { choose(S.sel === id ? null : id); }; row.appendChild(b);
          });
          blk.appendChild(row); c.appendChild(blk);
        });
        var back = document.createElement('button'); back.className = 'btn primary'; back.textContent = "Back to the lesson"; back.onclick = function () { choose(null); kit.selectTab('main'); kit.seekStage && kit.seekStage(kit.state.stage); };
        c.appendChild(back); el.appendChild(c);
      }
      function buildCompare(el) {
        var c = kit.ui.card(def.compare.title);
        c.insertAdjacentHTML('beforeend', '<p class="muted">' + def.compare.intro + '</p>' + kit.ui.table(def.compare.head, def.compare.rows, 'cmp'));
        el.appendChild(c);
        if (def.compare.notes) { var n = kit.ui.card("To remember", '<ul class="ideas">' + def.compare.notes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'); el.appendChild(n); }
      }
      function buildChallenge(el) {
        var c1 = kit.ui.card("Identify in 3D");
        var box = document.createElement('div'); box.className = 'game'; c1.appendChild(box); el.appendChild(c1);
        function pool() { return def.ids.filter(function (id) { return !INFO[id].nogame; }); }
        function start() { S.game = { n: 0, ok: 0, rounds: 8, order: shuf(pool()).slice(0, 8), cur: null, wait: false }; next(); }
        function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
        function paint(msg, cls) {
          var G = S.game; if (!G) { box.innerHTML = "<p>I will name a component and you will have to <b>click on it in the model</b>. You can rotate and zoom. There are 8 rounds.</p><button class=\"btn\" id=\"gStart\">Start</button>"; box.querySelector('#gStart').onclick = start; return; }
          if (G.n >= G.rounds) { box.innerHTML = '<div class="verdict ' + (G.ok >= 6 ? 'ok' : 'no') + "\">Result: <b>" + G.ok + ' / ' + G.rounds + "</b></div><button class=\"btn\" id=\"gAgain\">Play again</button>"; box.querySelector('#gAgain').onclick = start; S.game = null; choose(null, true); return; }
          box.innerHTML = "<div class=\"score\">Round " + (G.n + 1) + ' de ' + G.rounds + " · correct: " + G.ok + "</div><div class=\"q\">Click on: <b>" + INFO[G.cur].n + '</b></div>' + (msg ? '<div class="verdict ' + cls + '">' + msg + '</div>' : '') +
            "<div class=\"sel-btns\"><button class=\"btn\" id=\"gHint\">Hint</button><button class=\"btn\" id=\"gSkip\">Skip</button></div>";
          box.querySelector('#gSkip').onclick = function () { G.n++; G.cur = G.order[G.n]; paint(); };
          box.querySelector('#gHint').onclick = function () { paint(INFO[G.cur].f.split('. ')[0] + '.', 'no'); };
        }
        function next() { var G = S.game; G.cur = G.order[G.n]; S.manual = true; view.select(null); view.setFocus(null); paint(); }
        S.gameClick = function (id) {
          var G = S.game; if (!G || G.n >= G.rounds || !id) return false;
          if (id === G.cur) { G.ok++; G.n++; if (G.n < G.rounds) G.cur = G.order[G.n]; view.select(id); setTimeout(function () { if (S.game) view.select(null); }, 900); paint("Correct! It was " + INFO[id].n + '.', 'ok'); }
          else { paint("That is " + INFO[id].n + '. Sigue buscando.', 'no'); }
          return true;
        };
        paint();
        var c2 = kit.ui.card("Quick questions"); el.appendChild(c2);
        kit.ui.quiz(c2, { intro: "Comprehension questions on structure and function.", items: def.quiz });
      }

      /* ---------- Escena ---------- */
      function legend() {
        if (!kit || !view) return;
        if (view.mode === 'funcion') kit.setLegend(ORDER.map(function (gid) { return { color: K.GROUPS[gid].c, label: grpName(gid) }; }));
        else kit.setLegend([{ color: '#ffd86b', label: "Phospholipid heads", text: "(membrane dots)" }, { color: '#58b6ff', label: "Plasma membrane" }].concat(def.legendExtra || []));
      }
      function applyStage(i) {
        var s = STAGES[i]; if (!s) return;
        view.setFocus(s.focus || null);
        if (s.fly) view.flyTo(s.fly, s.dist); else if (s.cam) view.flyHome(new T.Vector3(s.cam[0], s.cam[1], s.cam[2]), s.cam[3]);
      }
      var MODES = [{ id: "structure", label: "Structure", sub: "real colors", color: def.accent.dark }, { id: "function", label: "Functions", sub: "by system", color: '#ffb340' }];

      function init() {
        kit = SimKit.create({
          key: def.key, title: def.title, subtitle: def.subtitle, accent: def.accent, viewLabel: def.viewLabel,
          modes: MODES, modesLabel: "Coloring",
          onMode: function (id) { if (!view) return; view.setMode(id); legend(); },
          stages: STAGES, mainTabLabel: "Guide",
          tabs: [{ id: 'comp', label: "Components", build: function (el, k) { kit = k; buildComps(el); } },
                 { id: 'cmp', label: "Compare", build: function (el, k) { kit = k; buildCompare(el); } },
                 { id: 'des', label: "Challenge", build: function (el, k) { kit = k; buildChallenge(el); } }],
          mainTop: function (el, k) { kit = k; var c = kit.ui.card("Selected component"); selBox = document.createElement('div'); selBox.className = 'selbox'; c.appendChild(selBox); el.appendChild(c); paintSel(); },
          measuresTitle: "Summary",
          measures: function () {
            var cnt = function (f) { return def.ids.filter(f).length; };
            return [["Components in the model", String(def.ids.length)],
              ["With double membrane", String(cnt(function (id) { return /Doble/.test(INFO[id].m); }))],
              ["With single membrane", String(cnt(function (id) { return /simple/.test(INFO[id].m); }))],
              ["No membrane", String(cnt(function (id) { return /Sin membrana|Sin /.test(INFO[id].m) || /proteico/.test(INFO[id].m); }))],
              ["Selected", S.sel ? INFO[S.sel].n : '—']];
          },
          ideas: def.ideas,
          layers: ORDER.map(function (gid) { return { id: gid, label: grpName(gid).split(',')[0].split(' y ')[0], icon: '●', title: grpName(gid) }; }).concat([
            { id: 'labels', label: "Labels", icon: 'Aa' }, { id: 'cut', label: "Cutaway", icon: '◐' }, { id: 'rot', label: "Rotate", icon: '⟳', on: false }]),
          onLayer: function (id, on) {
            if (!view) return;
            if (K.GROUPS[id]) { view.list.forEach(function (it) { if (it.meta.grp === id) { it.vis = on; it.group.visible = on; } }); }
            if (id === 'labels') view.labelsAll = on;
            if (id === 'cut') view.setCut(on);
            if (id === 'rot') view.controls.autoRotate = on;
          },
          views: [{ id: 'libre', label: "Free" }, { id: 'frontal', label: "Front" }, { id: 'lado', label: "Side" }, { id: 'superior', label: "Top" }, { id: "all", label: "All" }],
          onView: function (id) {
            if (!view || !view.list.length || id === 'libre') return;
            var d = def.home[3], dirs = { frontal: [0, .12, 1], lado: [1, .12, 0], superior: [0, 1, .15], todo: def.home };
            if (dirs[id]) { var v = dirs[id], dd = id === 'todo' ? def.home[3] : d; view.flyHome(new T.Vector3(v[0], v[1], v[2]), dd); }
            S.manual = true; view.setFocus(null);
          },
          onTheme: function (th) { if (view) view.scene.background = new T.Color(th === 'dark' ? 0x0d1218 : 0xdde8f3); },
          onStage: function () { if (!view) return; S.manual = false; if (S.sel) { S.sel = null; view.select(null); paintSel(); } S.lastStage = -1; },
          onGuide: function () { if (!view) return; S.manual = false; S.lastStage = -1; },
          onResize: function () { view && view.resize(); },
          render: function () { if (!view) return; view.renderer.render(view.scene, view.camera); view.labelR.render(view.scene, view.camera); },
          onFrame: function (f) {
            if (!view || !view.list.length) return;
            if (!S.manual && f.i !== S.lastStage) { S.lastStage = f.i; applyStage(f.i); }
            if (def.animate) def.animate(view, f, S);
            view.frame(f.dt);
          },
          init: function (k) {
            kit = k;
            view = new K.View(kit, { center: new T.Vector3(0, 0, 0), onPick: function (id) { if (S.gameClick && S.game && S.gameClick(id)) return; choose(id && S.sel === id ? null : id); } });
            view.resize(); kit.cfg.onTheme(kit.state.theme);
            def.build(view);
            view.finalize();
            view.flyHome(new T.Vector3(def.home[0], def.home[1], def.home[2]), def.home[3]); view.camera.position.copy(view.goal.pos); view.goal = null; view.controls.update();
            view.setCut(kit.layer('cut'), def.cutZ);
            view.labelsAll = kit.layer('labels'); view.controls.autoRotate = kit.layer('rot');
            ORDER.forEach(function (gid) { var on = kit.layer(gid); view.list.forEach(function (it) { if (it.meta.grp === gid) { it.vis = on; it.group.visible = on; } }); });
            legend();
          },
          help: def.help
        });
        kit.setMode("structure", true);
        g.__cell = { kit: kit, view: view, choose: choose, S: S };
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    }
  };
})(window);
