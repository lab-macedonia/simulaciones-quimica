const Chem = require('./load');
const { V } = Chem;
function sweep(sc, label, opts = {}) {
  console.log('\n==', label, 'átomos', sc.atoms.length, 'enlaces', sc.bonds.length);
  let minD = 99, who = '', worstBond = 0, wb = '';
  const bondedSet = new Set(sc.bonds.flatMap(b => [b[0] + '|' + b[1], b[1] + '|' + b[0]]));
  const lim = { 'C-H': [1.0, 1.2], 'C-C': [1.3, 1.6], 'O-H': [0.9, 1.05] };
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const f = sc.frame(t);
    for (const [id, p] of Object.entries(f.pos)) if (p.some(v => !isFinite(v))) throw new Error('NaN ' + id + ' t=' + t);
    for (const [k, o] of Object.entries(f.orders)) if (!isFinite(o)) throw new Error('orden NaN ' + k);
    const ids = Object.keys(f.pos);
    // enlaces completos: longitudes razonables
    for (const b of sc.bonds) {
      const o = f.orders[b[0] + '-' + b[1]];
      if (o > 0.97) {
        const d = V.dist(f.pos[b[0]], f.pos[b[1]]);
        const el = [sc.atoms.find(a => a.id === b[0]).el, sc.atoms.find(a => a.id === b[1]).el].sort().join('-');
        const rng = { 'C-H': [1.0, 1.2], 'C-C': [1.3, 1.6], 'H-O': [0.9, 1.05], 'C-O': [1.38, 1.6], 'Br-C': [1.85, 2.1] }[el];
        if (rng && (d < rng[0] || d > rng[1])) { if (Math.abs(d - (rng[0]+rng[1])/2) > worstBond) { worstBond = Math.abs(d - (rng[0]+rng[1])/2); wb = b.join('-') + ' d=' + d.toFixed(2) + ' t=' + t + ' (' + el + ')'; } }
      }
    }
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (bondedSet.has(ids[a] + '|' + ids[b])) continue;
      const d = V.dist(f.pos[ids[a]], f.pos[ids[b]]);
      if (d < minD) { minD = d; who = ids[a] + '-' + ids[b] + '@' + t; }
    }
  }
  console.log('mín. distancia no enlazados:', minD.toFixed(2), who);
  console.log('mayor desviación de longitud (enlaces ord>0,97):', wb || 'ninguna');
  for (const t of [0, 0.1, 0.2, 0.38, 0.55, 0.7, 0.87, 1]) {
    const f = sc.frame(t);
    console.log('t=' + t, f.medidas.map(m => m.etiqueta + '=' + (m.texto ? m.valor : m.valor.toFixed(2))).join(' | '), '| C:', (f.q.C||0).toFixed(2), 'hib', f.extra.hib && f.extra.hib.valor);
  }
}
sweep(Chem.scenarios.sn1.create('opuesta'), 'SN1 opuesta');
sweep(Chem.scenarios.sn1.create('misma'), 'SN1 misma');
sweep(Chem.scenarios.e1.create('unico'), 'E1');
