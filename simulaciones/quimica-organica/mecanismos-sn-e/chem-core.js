/* chem-core.js — Utilidades matemáticas y químicas puras (sin dependencias).
 * Vectores = arreglos [x, y, z]. Unidades: ångström (Å) y grados.
 * Se carga en el navegador (window.Chem) y en Node (globalThis.Chem) para pruebas. */
(function (root) {
  'use strict';
  const Chem = (root.Chem = root.Chem || {});
  const DEG = Math.PI / 180;

  /* ---------- Vectores ---------- */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    mad: (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    norm: a => {
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    mid: (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    angle: (a, c, b) => {
      // ángulo a–c–b en grados, vértice en c
      const u = V.norm(V.sub(a, c));
      const w = V.norm(V.sub(b, c));
      return Math.acos(Math.max(-1, Math.min(1, V.dot(u, w)))) / DEG;
    }
  };

  /* ---------- Suavizado y curvas ---------- */
  const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = x => x * x * (3 - 2 * x); // smoothstep sobre [0,1]
  const step = (t, a, b) => clamp01((t - a) / (b - a));
  const S = (t, a, b) => ss(step(t, a, b)); // smoothstep entre a y b

  function endSlope(h0, h1, d0, d1) {
    let m = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (Math.sign(m) !== Math.sign(d0)) m = 0;
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(m) > 3 * Math.abs(d0)) m = 3 * d0;
    return m;
  }

  /** Interpolación cúbica monótona (PCHIP) a partir de puntos [[t, v], ...]. */
  function K(pts) {
    const n = pts.length;
    const x = pts.map(p => p[0]);
    const y = pts.map(p => p[1]);
    const h = [];
    const d = [];
    for (let i = 0; i < n - 1; i++) {
      h[i] = x[i + 1] - x[i];
      d[i] = (y[i + 1] - y[i]) / h[i];
    }
    const m = new Array(n).fill(0);
    if (n === 2) {
      m[0] = m[1] = d[0];
    } else {
      for (let i = 1; i < n - 1; i++) {
        if (d[i - 1] * d[i] > 0) {
          const w1 = 2 * h[i] + h[i - 1];
          const w2 = h[i] + 2 * h[i - 1];
          m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
        } else m[i] = 0;
      }
      m[0] = endSlope(h[0], h[1], d[0], d[1]);
      m[n - 1] = endSlope(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
    }
    return function (t) {
      if (t <= x[0]) return y[0];
      if (t >= x[n - 1]) return y[n - 1];
      let i = 0;
      while (t > x[i + 1]) i++;
      const s = (t - x[i]) / h[i];
      const s2 = s * s;
      const s3 = s2 * s;
      return (
        (2 * s3 - 3 * s2 + 1) * y[i] +
        (s3 - 2 * s2 + s) * h[i] * m[i] +
        (-2 * s3 + 3 * s2) * y[i + 1] +
        (s3 - s2) * h[i] * m[i + 1]
      );
    };
  }

  /* ---------- Geometría molecular ---------- */
  /** Base ortonormal (e1, e2) perpendicular a w; e1 = proyección de ref ⟂ w. (e1, e2, w) es diestra. */
  function basis(w, ref) {
    const r = ref || [1, 0, 0];
    const e1 = V.norm(V.sub(r, V.scale(w, V.dot(r, w))));
    const e2 = V.cross(w, e1);
    return [e1, e2];
  }

  /** Punto a distancia L de c, con ángulo alpha (°) respecto al eje y azimut az (°) en la base (e1,e2). */
  function polar(c, axis, alphaDeg, azDeg, L, ref) {
    const [e1, e2] = basis(axis, ref);
    const a = alphaDeg * DEG;
    const z = azDeg * DEG;
    const radial = V.add(V.scale(e1, Math.cos(z)), V.scale(e2, Math.sin(z)));
    return V.add(c, V.scale(V.add(V.scale(axis, Math.cos(a)), V.scale(radial, Math.sin(a))), L));
  }

  /** Tres H de un metilo en C; w = dirección unitaria hacia el vecino; phi0 = giro (°). */
  function methylHs(C, w, ref, phi0, L) {
    const len = L || 1.09;
    const [e1, e2] = basis(w, ref);
    const ca = Math.cos(109.5 * DEG);
    const sa = Math.sin(109.5 * DEG);
    return [0, 120, 240].map(a => {
      const ph = (phi0 + a) * DEG;
      const radial = V.add(V.scale(e1, Math.cos(ph)), V.scale(e2, Math.sin(ph)));
      return V.add(C, V.scale(V.add(V.scale(w, ca), V.scale(radial, sa)), len));
    });
  }

  /** Dos H de una molécula de agua en O. outward = eje que apunta fuera del sitio de ataque;
   *  a = ángulo O–H respecto a outward (°); dpsi = separación azimutal entre H (180° = plana). */
  function waterHs(O, outward, a, dpsi, ref, L) {
    const len = L || 0.97;
    const [e1, e2] = basis(outward, ref);
    const ca = Math.cos(a * DEG);
    const sa = Math.sin(a * DEG);
    return [90 - dpsi / 2, 90 + dpsi / 2].map(psi => {
      const p = psi * DEG;
      const radial = V.add(V.scale(e1, Math.cos(p)), V.scale(e2, Math.sin(p)));
      return V.add(O, V.scale(V.add(V.scale(outward, ca), V.scale(radial, sa)), len));
    });
  }

  /** Descriptor CIP (R/S) por volumen con signo; p1>p2>p3 por prioridad, c = centro, el 4.º apunta "detrás". */
  function cip(c, p1, p2, p3) {
    const a = V.sub(p1, c);
    const b = V.sub(p2, c);
    const d = V.sub(p3, c);
    const vol = V.dot(V.cross(a, b), d);
    // normalizado para detectar centro plano (estado de transición)
    const norm = V.len(a) * V.len(b) * V.len(d) || 1;
    const rel = vol / norm;
    if (Math.abs(rel) < 0.05) return { label: '—', rel, plano: true };
    return { label: rel < 0 ? 'R' : 'S', rel, plano: false };
  }

  /* ---------- Formato (convención: coma decimal) ---------- */
  function fmt(x, d) {
    const n = d === undefined ? 2 : d;
    const s = (Math.abs(x) < 0.5 * Math.pow(10, -n) ? 0 : x).toFixed(n);
    return s.replace('.', ',');
  }

  /* ---------- Datos de elementos ---------- */
  const ELEMENTOS = {
    C: { nombre: 'Carbono', color: 0x3b3f46, radio: 0.4, vdw: 1.7 },
    H: { nombre: 'Hidrógeno', color: 0xf4f5f7, radio: 0.24, vdw: 1.1 },
    O: { nombre: 'Oxígeno', color: 0xe53935, radio: 0.38, vdw: 1.52 },
    Br: { nombre: 'Bromo', color: 0x9c3d2f, radio: 0.56, vdw: 1.85 }
  };

  Object.assign(Chem, { DEG, V, clamp01, lerp, ss, step, S, K, basis, polar, methylHs, waterHs, cip, fmt, ELEMENTOS });
  Chem.scenarios = Chem.scenarios || {};
})(typeof window !== 'undefined' ? window : globalThis);
