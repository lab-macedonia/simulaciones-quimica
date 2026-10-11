const Chem = require('./load');
const { V } = Chem;
for (const variante of ['metilo', 'butano']) {
  const sc = Chem.scenarios.sn2.create(variante);
  console.log('\n== SN2', variante, 'átomos', sc.atoms.length);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const f = sc.frame(t);
    const m = Object.fromEntries(f.medidas.map(x => [x.id, x.valor]));
    console.log('t=' + t, 'dNu', m.dNu.toFixed(2), 'dX', m.dX.toFixed(2), 'ang', m.ang.toFixed(1), 'umb', m.umb.toFixed(1), f.extra.cip ? f.extra.cip.valor : '');
  }
  // CIP en t=0 y t=1
  if (variante === 'butano') {
    console.log('CIP t=0:', sc.frame(0).extra.cip.valor, ' t=1:', sc.frame(1).extra.cip.valor);
  }
  // NaN y distancias mínimas entre átomos no enlazados
  let minD = 99, who = '';
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const f = sc.frame(t);
    const ids = Object.keys(f.pos);
    for (const id of ids) if (f.pos[id].some(v => !isFinite(v))) throw new Error('NaN ' + id + ' t=' + t);
    const bonded = new Set(sc.bonds.map(b => b[0] + '|' + b[1]).concat(sc.bonds.map(b => b[1] + '|' + b[0])));
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (bonded.has(ids[a] + '|' + ids[b])) continue;
      const d = V.dist(f.pos[ids[a]], f.pos[ids[b]]);
      if (d < minD) { minD = d; who = ids[a] + '-' + ids[b] + '@' + t; }
    }
  }
  console.log('mín. distancia no enlazados:', minD.toFixed(2), who);
}
