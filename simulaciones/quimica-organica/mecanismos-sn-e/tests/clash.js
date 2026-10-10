const Chem = require('./load');
const { V } = Chem;
// distancia mínima entre átomos no enlazados, excluyendo H geminales (mismo átomo pesado) y pares enlazados a un mismo átomo
function clash(sc, label) {
  const nb = {};
  sc.bonds.forEach(([a, b]) => { (nb[a] = nb[a] || new Set()).add(b); (nb[b] = nb[b] || new Set()).add(a); });
  const el = id => sc.atoms.find(a => a.id === id).el;
  let res = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const f = sc.frame(t);
    const ids = Object.keys(f.pos);
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const A = ids[a], B = ids[b];
      if ((nb[A] && nb[A].has(B))) continue;
      // geminales (comparten vecino) y 1,3 se excluyen
      const share = nb[A] && nb[B] && [...nb[A]].some(x => nb[B].has(x));
      if (share) continue;
      const d = V.dist(f.pos[A], f.pos[B]);
      const lim = (el(A) === 'H' && el(B) === 'H') ? 1.6 : (el(A) === 'Br' || el(B) === 'Br') ? 2.4 : 1.9;
      if (d < lim) res.push([d, A + '-' + B, t]);
    }
  }
  res.sort((x, y) => x[0] - y[0]);
  const seen = new Set(); const out = [];
  for (const r of res) { if (!seen.has(r[1])) { seen.add(r[1]); out.push(r[1] + ' d=' + r[0].toFixed(2) + ' @t=' + r[2]); } }
  console.log(label, out.length ? 'CONTACTOS CERCANOS:\n  ' + out.slice(0, 12).join('\n  ') : 'sin choques');
}
for (const [id, v] of [['sn2', 'metilo'], ['sn2', 'butano'], ['sn1', 'opuesta'], ['sn1', 'misma'], ['e1', 'unico'], ['e2', 'unico']]) {
  if (!Chem.scenarios[id]) continue;
  clash(Chem.scenarios[id].create(v), id + ':' + v);
}
