/* curriculo-pagina.js — Página «Cobertura curricular»: cruza las simulaciones con los OA del Mineduc (datos en kit/curriculo.js).
   Un solo archivo para español e inglés (según <html lang>). Licencia MIT. */
(function () {
  'use strict';
  var EN = /^en/i.test(document.documentElement.lang || ''), C = window.SimCurriculo, A = window.SimAula || {};
  function t(es, en) { return EN ? en : es; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function title(id) { var T = A.titles && A.titles[id]; if (T) return EN ? T[1] : T[0]; if (id === 'fisica/sistema-solar') return t('Sistema Solar', 'Solar System'); return id.split('/').pop(); }
  function href(id) { return id + '/' + (EN ? 'index.en.html' : ''); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var AREAS = [['quimica-general', t('Química general', 'General chemistry')], ['quimica-inorganica', t('Química inorgánica', 'Inorganic chemistry')], ['quimica-organica', t('Química orgánica', 'Organic chemistry')], ['biologia', t('Biología', 'Biology')], ['ciencias-tierra', t('Ciencias de la Tierra', 'Earth sciences')], ['fisica', t('Física', 'Physics')]];
  var groups = Object.keys(C.GROUPS).sort(function (a, b) { return C.GROUPS[a][5] - C.GROUPS[b][5]; });
  var root = document.getElementById('app');
  var hashSim = (/[#&]sim=([^&]+)/.exec(location.hash) || [])[1]; if (hashSim) hashSim = decodeURIComponent(hashSim);
  var covered = C.OA.filter(function (o) { return C.simsFor(o[0]).length; }).length;
  root.innerHTML =
    '<div class="controls" role="search"><label>' + t('Asignatura y nivel', 'Subject and level') + ' <select id="fg"><option value="*">' + t('Todos', 'All') + '</option>' +
    groups.map(function (k) { var G = C.GROUPS[k]; return '<option value="' + k + '">' + esc((EN ? G[3] : G[2]) + ' · ' + (EN ? G[1] : G[0])) + '</option>'; }).join('') + '</select></label>' +
    '<label class="grow">' + t('Buscar', 'Search') + ' <input id="fq" type="search" placeholder="' + t('p. ej. estequiometría, OA 20, gases', 'e.g. stoichiometry, OA 20, gases') + '"></label>' +
    '<label class="chk"><input id="fgap" type="checkbox"> ' + t('Solo OA sin simulación', 'Only OA without a simulation') + '</label></div>' +
    '<div class="seg" role="tablist"><button role="tab" id="vOA" aria-selected="true">' + t('Por objetivo', 'By objective') + '</button><button role="tab" id="vSim" aria-selected="false">' + t('Por simulación', 'By simulation') + '</button></div>' +
    '<p class="stat" id="stat" aria-live="polite"></p><div id="out"></div>';
  var fg = document.getElementById('fg'), fq = document.getElementById('fq'), fgap = document.getElementById('fgap'), out = document.getElementById('out'), stat = document.getElementById('stat'), view = hashSim ? 'sim' : 'oa';
  function chipOA(o) { return '<a class="chip" href="#oa=' + encodeURIComponent(o.code) + '" title="' + esc(EN ? o.en : o.es) + '">' + esc(o.code) + '</a>'; }
  function chipSim(id) { return '<a class="chip sim" href="' + href(id) + '">' + esc(title(id)) + '</a>'; }
  function render() {
    var g = fg.value, q = norm(fq.value.trim()), gap = fgap.checked;
    document.getElementById('vOA').setAttribute('aria-selected', view === 'oa'); document.getElementById('vSim').setAttribute('aria-selected', view === 'sim');
    fgap.parentNode.hidden = view !== 'oa';
    var html = '', nShown = 0;
    if (view === 'oa') {
      groups.forEach(function (k) {
        if (g !== '*' && g !== k) return;
        var G = C.GROUPS[k], list = C.OA.filter(function (o) { return o[1] === k; }), cov = list.filter(function (o) { return C.simsFor(o[0]).length; }).length;
        var rows = list.map(function (o) {
          var sims = C.simsFor(o[0]); if (gap && sims.length) return '';
          var txt = norm(o[0] + ' ' + (EN ? o[3] : o[2]) + ' ' + sims.map(title).join(' ')); if (q && txt.indexOf(q) < 0) return '';
          nShown++;
          return '<tr id="oa-' + esc(o[0].replace(/\s+/g, '-')) + '"><th scope="row">' + esc(o[0]) + '</th><td>' + esc(EN ? o[3] : o[2]) + '</td><td>' + (sims.length ? sims.map(chipSim).join(' ') : '<span class="none">' + t('Sin simulación', 'No simulation') + '</span>') + '</td></tr>';
        }).join('');
        if (!rows) return;
        html += '<section class="grp"><div class="grp-h"><h2>' + esc(EN ? G[1] : G[0]) + ' <small>' + esc(EN ? G[3] : G[2]) + '</small></h2><span class="cov"><b>' + cov + '</b> / ' + list.length + ' ' + t('OA con simulación', 'OA with a simulation') + '</span><a href="' + G[4] + '" target="_blank" rel="noopener">' + t('Texto oficial', 'Official text') + ' ↗</a></div>' +
          '<div class="tw"><table><thead><tr><th>OA</th><th>' + t('Síntesis', 'Summary') + '</th><th>' + t('Simulaciones', 'Simulations') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
      });
      stat.textContent = t(covered + ' de ' + C.OA.length + ' objetivos tienen al menos una simulación · ' + nShown + ' mostrados', covered + ' of ' + C.OA.length + ' objectives have at least one simulation · ' + nShown + ' shown');
    } else {
      AREAS.forEach(function (a) {
        var ids = Object.keys(C.MAP).filter(function (id) { return id.indexOf(a[0] + '/') === 0; });
        var rows = ids.map(function (id) {
          var e = C.forSim(id), oas = e.oa.filter(function (o) { return g === '*' || o.group === g; });
          if (g !== '*' && !oas.length) return '';
          var txt = norm(title(id) + ' ' + oas.map(function (o) { return o.code + ' ' + (EN ? o.en : o.es); }).join(' ')); if (q && txt.indexOf(q) < 0) return '';
          nShown++;
          return '<li id="s-' + esc(id.replace('/', '--')) + '"' + (id === hashSim ? ' class="hl"' : '') + '><a class="st" href="' + href(id) + '">' + esc(title(id)) + '</a>' + (e.universitario ? ' <span class="uni" title="' + t('Contenido de nivel universitario: los OA indicados son de apoyo', 'University-level content: the listed objectives are supporting ones') + '">' + t('Nivel universitario', 'University level') + '</span>' : '') +
            '<div class="chips">' + (oas.length ? oas.map(chipOA).join(' ') : '<span class="none">' + t('Sin OA escolar directo', 'No direct school objective') + '</span>') + '</div></li>';
        }).join('');
        if (rows) html += '<section class="grp"><div class="grp-h"><h2>' + esc(a[1]) + '</h2></div><ul class="sims">' + rows + '</ul></section>';
      });
      var uni = Object.keys(C.MAP).filter(function (id) { return C.forSim(id).universitario; }).length;
      stat.textContent = t(nShown + ' simulaciones mostradas · ' + uni + ' son de nivel universitario (sirven como profundización)', nShown + ' simulations shown · ' + uni + ' are university level (useful for enrichment)');
    }
    out.innerHTML = html || '<p class="none">' + t('No hay resultados con esos filtros.', 'No results with these filters.') + '</p>';
    if (view === 'sim' && hashSim) { var el = document.getElementById('s-' + hashSim.replace('/', '--')); if (el) { el.scrollIntoView({ block: 'center' }); hashSim = null; } }
  }
  out.addEventListener('click', function (e) {
    var a = e.target.closest('a.chip:not(.sim)'); if (!a) return; e.preventDefault();
    var code = decodeURIComponent(a.getAttribute('href').slice(4)); view = 'oa'; fq.value = code; fg.value = '*'; fgap.checked = false; render();
  });
  fg.addEventListener('change', render); fq.addEventListener('input', render); fgap.addEventListener('change', render);
  document.getElementById('vOA').addEventListener('click', function () { view = 'oa'; render(); });
  document.getElementById('vSim').addEventListener('click', function () { view = 'sim'; render(); });
  render();
})();
