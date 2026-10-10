const Chem = require('./load');
const { V } = Chem;
const sc = Chem.scenarios.e2.create('unico');
console.log('E2 átomos', sc.atoms.length);
for (const t of [0, 0.25, 0.5, 0.75, 1]) {
  const f = sc.frame(t);
  console.log('t=' + t, f.medidas.map(m => m.etiqueta + '=' + (m.texto ? m.valor : m.valor.toFixed(2))).join(' | '));
}
// longitudes de enlaces completos y planaridad del producto
const f1 = sc.frame(1);
const ids = ['Ca', 'Cb', 'Ha1', 'Ha2', 'Hb1', 'Hb2'];
// planaridad: distancia al plano que pasa por Ca, Cb, Ha1
const n = V.norm(V.cross(V.sub(f1.pos.Cb, f1.pos.Ca), V.sub(f1.pos.Ha1, f1.pos.Ca)));
console.log('desviación del plano (Å):', ids.map(i => Math.abs(V.dot(n, V.sub(f1.pos[i], f1.pos.Ca))).toFixed(3)).join(' '));
console.log('H–C=C ángulos:', V.angle(f1.pos.Ha1, f1.pos.Ca, f1.pos.Cb).toFixed(1), V.angle(f1.pos.Ha1, f1.pos.Ca, f1.pos.Ha2).toFixed(1));
for (let i = 0; i <= 100; i++) { const f = sc.frame(i/100); for (const [k,p] of Object.entries(f.pos)) if (p.some(v=>!isFinite(v))) throw new Error('NaN '+k); }
