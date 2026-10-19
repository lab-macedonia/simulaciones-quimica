/* Núcleo geométrico del simulador Fischer → Haworth → silla.
   Sin dependencias de DOM: se usa en el navegador (window.CarboCore) y en Node (tests).

   Idea central: la estereoquímica de cada centro se toma UNA sola vez, de la proyección
   de Fischer (signo del producto triple prev·next·O). En cualquier otra geometría
   (Haworth plano, silla, sobre) las posiciones de los sustituyentes se obtienen
   reproduciendo esa quiralidad sobre el esqueleto del anillo. Así "derecha → abajo",
   axial/ecuatorial y α/β son consecuencias, no datos de entrada. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarboCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  "use strict";

  /* ---------- álgebra vectorial mínima ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.sqrt(dot(a, a));
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const triple = (a, b, c) => dot(cross(a, b), c);
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function rotAxis(v, k, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
  }

  /* longitudes de enlace (Å, ligeramente exageradas las C–H para que se vean) */
  const CC = 1.5, CO = 1.42, CH = 1.05, OHL = 0.95;

  /* ---------- catálogo ----------
     fis: lados de los OH en Fischer para los estereocentros, de arriba abajo
          (para aldosas desde C2; para cetosas desde C3). R = derecha, L = izquierda. */
  const SUGARS = {
    ribosa:     { id: 'ribosa',     stem: 'ribo',    nombre: 'D-ribosa',     aldose: true,  n: 5, fis: 'RRR'  },
    glucosa:    { id: 'glucosa',    stem: 'gluco',   nombre: 'D-glucosa',    aldose: true,  n: 6, fis: 'RLRR' },
    manosa:     { id: 'manosa',     stem: 'manno',   nombre: 'D-manosa',     aldose: true,  n: 6, fis: 'LLRR' },
    galactosa:  { id: 'galactosa',  stem: 'galacto', nombre: 'D-galactosa',  aldose: true,  n: 6, fis: 'RLLR' },
    fructosa:   { id: 'fructosa',   stem: 'fructo',  nombre: 'D-fructosa',   aldose: false, n: 6, fis: 'LRR'  },
    ribulosa:   { id: 'ribulosa',   stem: 'ribulo',  nombre: 'D-ribulosa',   aldose: false, n: 5, fis: 'RR'   }
  };

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sup = k => String(k).split('').map(d => SUP[+d]).join('');
  const sub_ = k => String(k).split('').map(d => SUB[+d]).join('');

  /* ---------- modelo ---------- */
  function buildModel(sugarId, ring, anomer) {
    const S = SUGARS[sugarId];
    if (!S) return null;
    const aldose = S.aldose, n = S.n, c = aldose ? 1 : 2, a = c;
    const z = a + (ring === 'piranosa' ? 4 : 3);
    if (z > n) return null;                       // p. ej. ribulosa no puede formar piranosa
    const fis = {};
    for (let i = c + 1; i <= n - 1; i++) fis[i] = S.fis[i - c - 1];

    const m = { sugar: S, sugarId, aldose, n, c, a, z, ring, anomer, fis, sgn: {}, atoms: [], index: {}, bonds: [] };

    /* átomos */
    const addAtom = (id, el, extra) => { m.index[id] = m.atoms.length; m.atoms.push(Object.assign({ id, el }, extra || {})); };
    for (let i = 1; i <= n; i++) {
      addAtom('C' + i, 'C', { num: i });
      if (i === c) {
        addAtom('Oc', 'O', { role: 'carbonyl' });
        if (aldose) addAtom('H1', 'H', { on: 'C1' });
      } else {
        addAtom('O' + i, 'O', { num: i, role: 'hydroxyl' });
        addAtom('HO' + i, 'H', { on: 'O' + i });
        if (fis[i]) addAtom('Hc' + i, 'H', { on: 'C' + i });
        else { addAtom('Ha' + i, 'H', { on: 'C' + i }); addAtom('Hb' + i, 'H', { on: 'C' + i }); }
      }
    }

    /* enlaces. phase: always | open (solo cadena abierta) | ring (solo anillo) */
    const B = (x, y, order, phase) => m.bonds.push({ a: x, b: y, order: order || 1, phase: phase || 'always' });
    for (let i = 1; i < n; i++) B('C' + i, 'C' + (i + 1));
    B('C' + c, 'Oc', 2);                          // C=O ; la 2ª línea desaparece al ciclar
    if (aldose) B('C1', 'H1');
    for (let i = 1; i <= n; i++) {
      if (i === c) continue;
      B('C' + i, 'O' + i);
      if (i === z) { B('HO' + i, 'O' + i, 1, 'open'); }
      else B('O' + i, 'HO' + i);
      if (fis[i]) B('C' + i, 'Hc' + i); else { B('C' + i, 'Ha' + i); B('C' + i, 'Hb' + i); }
    }
    B('O' + z, 'C' + a, 1, 'ring');               // cierre del anillo (hemiacetal / hemicetal)
    B('HO' + z, 'Oc', 1, 'ring');                 // el H migra del O que ataca al O carbonílico

    /* Fischer y signos de quiralidad */
    const F = fischerFrame(m);
    for (let i = c + 1; i <= n - 1; i++) {
      const Cp = F['C' + i];
      m.sgn[i] = Math.sign(triple(sub(F['C' + (i - 1)], Cp), sub(F['C' + (i + 1)], Cp), sub(F['O' + i], Cp)));
    }

    /* Haworth */
    const flat = ringFlat(m);
    const Hres = completeFrame(m, flat, { anomSign: null });
    m.anomSign = Hres.anomSign;

    /* silla / sobre */
    const conf = [];
    if (ring === 'piranosa') {
      [false, true].forEach(variantB => {
        const r = completeFrame(m, ringChair(m, variantB), { anomSign: m.anomSign });
        conf.push({ variantB, pos: r.pos, name: chairName(m, variantB) });
      });
      conf.forEach(cf => { cf.an = analyze(m, cf.pos); cf.axHeavy = cf.an.filter(s => !s.isH && s.axial).length; });
      if (conf[1].axHeavy < conf[0].axHeavy) conf.reverse();     // la preferida va primero
      m.confKind = 'silla';
    } else {
      [1, 2].forEach(k => {
        const r = completeFrame(m, ringEnvelope(m, k), { anomSign: m.anomSign });
        conf.push({ flap: k, pos: r.pos, name: 'C' + (a + k) + '-endo' });
      });
      conf.forEach(cf => { cf.an = analyze(m, cf.pos); cf.axHeavy = 0; });
      conf.reverse();                                            // por defecto: sobre en C(a+2)
      m.confKind = 'sobre';
    }

    /* centrado: cada fotograma se centra por su caja envolvente; Fischer ya está centrada */
    const toArr = P => m.atoms.map(at => P[at.id]);
    m.frames = {
      F: toArr(F),
      H: toArr(center(Hres.pos)),
      conf: conf.map(cf => toArr(center(cf.pos)))
    };
    m.conf = conf.map(cf => ({ name: cf.name, an: cf.an, axHeavy: cf.axHeavy, variantB: cf.variantB, flap: cf.flap }));
    m.an = analyze(m, Hres.pos);                  // para Haworth: up/down
    return m;
  }

  function center(P) {
    const ids = Object.keys(P);
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    ids.forEach(id => { for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[id][k]); hi[k] = Math.max(hi[k], P[id][k]); } });
    const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    const out = {};
    ids.forEach(id => out[id] = sub(P[id], c));
    return out;
  }

  /* ---------- proyección de Fischer en 3D ----------
     Enlaces horizontales hacia el observador (+z), cadena vertical curvada hacia atrás. */
  function fischerFrame(m) {
    const n = m.n, d = 1.5, P = {};
    for (let i = 1; i <= n; i++) {
      const u = ((i - 1) - (n - 1) / 2) / ((n - 1) / 2);
      P['C' + i] = [0, ((n - 1) / 2 - (i - 1)) * d, 0.9 * (1 - u * u)];
    }
    const terminal = (i, s) => {                  // s = +1 extremo superior, -1 inferior
      const Cp = P['C' + i];
      /* CH2OH terminal en abanico: O a la derecha, un H a la izquierda y otro hacia el extremo,
         de modo que los tres se vean separados en la vista frontal */
      P['O' + i] = add(Cp, [1.0, 0.7 * s, 0.3]);
      P['HO' + i] = add(P['O' + i], [0.6, 0.1 * s, 0.1]);
      P['Ha' + i] = add(Cp, [-0.9, 0.7 * s, 0.3]);
      P['Hb' + i] = add(Cp, [0.05, 0.95 * s, 0.4]);
    };
    for (let i = 1; i <= n; i++) {
      const Cp = P['C' + i];
      if (i === m.c) {
        if (m.aldose) { P.Oc = add(Cp, [0.95, 0.62, 0.22]); P.H1 = add(Cp, [-0.85, 0.5, 0.4]); }
        else P.Oc = add(Cp, [1.2, 0, 0.25]);
      } else if (m.fis[i]) {
        const sx = m.fis[i] === 'R' ? 1 : -1;
        P['O' + i] = add(Cp, [sx * 1.05, 0, 0.62]);
        P['HO' + i] = add(P['O' + i], [sx * 0.55, -0.35, 0.15]);
        P['Hc' + i] = add(Cp, [-sx * 0.85, 0, 0.6]);
      } else {
        terminal(i, i === 1 ? 1 : -1);
      }
    }
    return P;
  }

  /* ---------- esqueletos de anillo ---------- */
  function ringIds(m) {
    const ids = [], nC = m.z - m.a + 1;
    for (let k = 0; k < nC; k++) ids.push('C' + (m.a + k));
    ids.push('O' + m.z);
    return ids;
  }
  function ringFlat(m) {
    const pyr = m.ring === 'piranosa';
    const R = pyr ? 1.5 : 1.3;
    const slots = pyr ? [0, 60, 120, 180, 240, 300] : [342, 54, 126, 198, 270];
    const P = {};
    ringIds(m).forEach((id, k) => {
      const t = slots[k] * Math.PI / 180;
      P[id] = [R * Math.cos(t), 0, R * Math.sin(t)];
    });
    return P;
  }
  /* Silla A: en aldosas C(a+3) arriba y C(a) abajo (⁴C₁); en cetosas C(a) arriba (²C₅). B = inversa. */
  function chairUp(m, k, variantB) {
    let up = m.aldose ? (k % 2 === 1) : (k % 2 === 0);
    return variantB ? !up : up;
  }
  function chairName(m, variantB) {
    const up0 = chairUp(m, 0, variantB);
    const n0 = m.a, n3 = m.a + 3;
    return up0 ? sup(n0) + 'C' + sub_(n3) : sup(n3) + 'C' + sub_(n0);
  }
  function ringChair(m, variantB) {
    const R = 1.45, h = 0.25, P = {};
    ringIds(m).forEach((id, k) => {
      const t = (60 * k) * Math.PI / 180;
      P[id] = [R * Math.cos(t), chairUp(m, k, variantB) ? h : -h, R * Math.sin(t)];
    });
    return P;
  }
  function ringEnvelope(m, flapK) {
    const P = ringFlat(m), ids = ringIds(m);
    P[ids[flapK]] = add(P[ids[flapK]], [0, 0.42, 0]);
    return P;
  }

  /* ---------- colocación de sustituyentes por quiralidad ---------- */
  /* dado el par (a,b) de vectores unitarios que salen del centro, devuelve las dos
     direcciones tetraédricas restantes; X es la que cumple sign(triple(a,b,X)) = signX */
  function placeXY(a, b, signX) {
    const mm = norm(mul(add(a, b), -1));
    const nn = norm(cross(a, b));
    const dp = add(mul(mm, 0.5774), mul(nn, 0.8165));
    const dm = add(mul(mm, 0.5774), mul(nn, -0.8165));
    return signX > 0 ? { X: dp, Y: dm } : { X: dm, Y: dp };
  }
  function perpTo(v, hint) {
    let p = sub(hint, mul(v, dot(hint, v)));
    if (len(p) < 1e-3) { p = cross(v, [0, 0, 1]); if (len(p) < 1e-3) p = cross(v, [1, 0, 0]); }
    return norm(p);
  }
  function placeOH(Opos, Cpos, hint) {
    const v = norm(sub(Opos, Cpos));
    const p = perpTo(v, hint);
    return add(Opos, mul(add(mul(v, 0.3338), mul(p, 0.9426)), OHL));
  }
  function nextDir(Cpos, prevPos, hint) {          // dirección de un sustituyente "libre" que se aleja de hint
    const a = norm(sub(prevPos, Cpos));
    const p = perpTo(a, hint);
    return add(mul(a, -0.3333), mul(p, 0.9428));
  }
  function placeTerminal(Cpos, prevPos, hint) {
    const a = norm(sub(prevPos, Cpos));
    const d0 = nextDir(Cpos, prevPos, hint);
    const d1 = rotAxis(d0, a, 2 * Math.PI / 3), d2 = rotAxis(d0, a, -2 * Math.PI / 3);
    return { O: add(Cpos, mul(d0, CO)), H1: add(Cpos, mul(d1, CH)), H2: add(Cpos, mul(d2, CH)) };
  }

  function completeFrame(m, ring, opts) {
    const P = Object.assign({}, ring);
    const { n, c, a, z, aldose } = m;
    const ids = ringIds(m);
    const cen = [0, 0, 0];
    ids.forEach(id => { for (let k = 0; k < 3; k++) cen[k] += ring[id][k] / ids.length; });
    const outAt = p => { const r = [p[0] - cen[0], 0, p[2] - cen[2]]; return len(r) > 1e-6 ? norm(r) : [1, 0, 0]; };
    const tanAt = p => { const t = cross([0, 1, 0], outAt(p)); return norm(t); };
    const hydroxylH = (i) => { P['HO' + i] = placeOH(P['O' + i], P['C' + i], tanAt(P['C' + i])); };

    /* carbonos estereogénicos dentro del anillo */
    for (let i = a + 1; i <= z - 1; i++) {
      const Cp = P['C' + i];
      const va = norm(sub(P['C' + (i - 1)], Cp)), vb = norm(sub(P['C' + (i + 1)], Cp));
      const { X, Y } = placeXY(va, vb, m.sgn[i]);
      P['O' + i] = add(Cp, mul(X, CO));
      P['Hc' + i] = add(Cp, mul(Y, CH));
      hydroxylH(i);
    }

    /* carbono anomérico (nuevo estereocentro) */
    const Ca = P['C' + a];
    const va = norm(sub(P['O' + z], Ca)), vb = norm(sub(P['C' + (a + 1)], Ca));
    let sg = opts.anomSign;
    if (sg == null) {                              // Haworth: α → OH abajo, β → OH arriba (serie D)
      const probe = placeXY(va, vb, +1);
      const isDown = probe.X[1] < 0;
      sg = (isDown === (m.anomer === 'alfa')) ? +1 : -1;
    }
    const an = placeXY(va, vb, sg);
    P.Oc = add(Ca, mul(an.X, CO));
    P['HO' + z] = placeOH(P.Oc, Ca, tanAt(Ca));    // el H del O que atacó queda sobre el O anomérico
    if (aldose) P.H1 = add(Ca, mul(an.Y, CH));
    else {
      P.C1 = add(Ca, mul(an.Y, CC));
      const t = placeTerminal(P.C1, Ca, outAt(P.C1));
      P.O1 = t.O; P.Ha1 = t.H1; P.Hb1 = t.H2;
      hydroxylH(1);
    }

    /* carbono que cierra el anillo */
    const Cz = P['C' + z];
    const pa = norm(sub(P['C' + (z - 1)], Cz)), pb = norm(sub(P['O' + z], Cz));
    if (z < n) {
      const { X, Y } = placeXY(pa, pb, -m.sgn[z]);
      P['C' + (z + 1)] = add(Cz, mul(X, CC));
      P['Hc' + z] = add(Cz, mul(Y, CH));
    } else {
      const { X, Y } = placeXY(pa, pb, +1);
      P['Ha' + z] = add(Cz, mul(X, CH));
      P['Hb' + z] = add(Cz, mul(Y, CH));
    }

    /* cadena exocíclica */
    for (let k = z + 1; k <= n; k++) {
      const Ck = P['C' + k], prev = P['C' + (k - 1)];
      if (k === n) {
        const t = placeTerminal(Ck, prev, outAt(Ck));
        P['O' + k] = t.O; P['Ha' + k] = t.H1; P['Hb' + k] = t.H2;
        hydroxylH(k);
      } else {
        const d = nextDir(Ck, prev, outAt(Ck));
        P['C' + (k + 1)] = add(Ck, mul(d, CC));
        const va2 = norm(sub(prev, Ck)), vb2 = norm(d);
        const { X, Y } = placeXY(va2, vb2, m.sgn[k]);
        P['O' + k] = add(Ck, mul(X, CO));
        P['Hc' + k] = add(Ck, mul(Y, CH));
        hydroxylH(k);
      }
    }
    return { pos: P, anomSign: sg };
  }

  /* ---------- análisis de sustituyentes del anillo ---------- */
  function grupoExo(m, k) {
    const resto = m.n - m.z;
    if (k === m.a && !m.aldose) return 'CH₂OH';
    if (resto === 1) return 'CH₂OH';
    if (resto === 2) return 'CH(OH)CH₂OH';
    return 'R';
  }
  function analyze(m, P) {
    const out = [];
    const push = (carbon, atomId, grp, isH) => {
      const v = sub(P[atomId], P['C' + carbon]);
      const u = norm(v);
      out.push({ carbon, atomId, grp, isH, up: u[1] > 0, axial: Math.abs(u[1]) > 0.7, y: u[1] });
    };
    for (let k = m.a; k <= m.z; k++) {
      if (k === m.a) {
        push(k, 'Oc', 'OH', false);
        if (m.aldose) push(k, 'H1', 'H', true); else push(k, 'C1', grupoExo(m, k), false);
      } else if (k < m.z) {
        push(k, 'O' + k, 'OH', false);
        push(k, 'Hc' + k, 'H', true);
      } else {
        if (m.z < m.n) { push(k, 'C' + (k + 1), grupoExo(m, k), false); push(k, 'Hc' + k, 'H', true); }
        else { push(k, 'Ha' + k, 'H', true); push(k, 'Hb' + k, 'H', true); }
      }
    }
    return out;
  }

  /* ---------- nombres ---------- */
  function nombre(m) {
    return (m.anomer === 'alfa' ? 'α' : 'β') + '-D-' + m.sugar.stem + (m.ring === 'piranosa' ? "pyranose" : "furanose");
  }

  return { SUGARS, buildModel, nombre, lerp3, add, sub, mul, len, norm, triple, dot, cross };
}));
