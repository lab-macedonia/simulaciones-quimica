/* energy.js — Diagrama de energía de reacción (canvas 2D), interactivo. */
(function (root) {
  'use strict';

  class EnergyDiagram {
    constructor(canvas, onSeek) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onSeek = onSeek;
      this.sc = null;
      this.t = 0;
      this.hover = null;
      this.dragging = false;
      this.m = { l: 40, r: 14, t: 22, b: 34 };

      const seek = ev => {
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const t = Math.max(0, Math.min(1, (x - this.m.l) / (rect.width - this.m.l - this.m.r)));
        return t;
      };
      canvas.addEventListener('pointerdown', ev => {
        this.dragging = true;
        canvas.setPointerCapture(ev.pointerId);
        this.onSeek(seek(ev));
      });
      canvas.addEventListener('pointermove', ev => {
        this.hover = seek(ev);
        if (this.dragging) this.onSeek(this.hover);
        this.draw();
      });
      canvas.addEventListener('pointerup', () => { this.dragging = false; });
      canvas.addEventListener('pointerleave', () => { this.hover = null; this.draw(); });
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', "Reaction energy diagram; click to go to a point of the mechanism");
      if (window.ResizeObserver) new ResizeObserver(() => this.draw()).observe(canvas);
    }

    setScenario(sc) { this.sc = sc; this.draw(); }
    setProgress(t) { this.t = t; this.draw(); }

    _colors() {
      const cs = getComputedStyle(this.canvas);
      const g = (n, d) => (cs.getPropertyValue(n).trim() || d);
      return {
        ink: g('--ink', '#e8edf8'), muted: g('--muted', '#8f9bb5'), accent: g('--accent', '#5cc8ff'),
        warn: g('--warn', '#ffb020'), grid: g('--line', 'rgba(255,255,255,0.12)'), bg: g('--panel-solid', '#141826')
      };
    }

    draw() {
      const c = this.canvas;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const g = this.ctx;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const sc = this.sc;
      if (!sc) return;
      const col = this._colors();
      const { l, r, t: top, b } = this.m;
      const pw = w - l - r;
      const ph = h - top - b;

      // rango de energía
      const N = 240;
      const ys = [];
      let ymin = 1e9;
      let ymax = -1e9;
      for (let i = 0; i <= N; i++) {
        const y = sc.energia(i / N);
        ys.push(y);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
      }
      const pad = (ymax - ymin) * 0.16;
      ymin -= pad * 0.6;
      ymax += pad;
      const X = tt => l + tt * pw;
      const Y = e => top + (1 - (e - ymin) / (ymax - ymin)) * ph;

      // ejes
      g.lineWidth = 1.2;
      g.strokeStyle = col.muted;
      g.beginPath();
      g.moveTo(l, top - 4); g.lineTo(l, top + ph); g.lineTo(l + pw + 4, top + ph);
      g.stroke();
      g.fillStyle = col.muted;
      g.font = '11px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText("Reaction coordinate", l + pw / 2, h - 8);
      g.save();
      g.translate(12, top + ph / 2);
      g.rotate(-Math.PI / 2);
      g.fillText("Free energy (qualitative)", 0, 0);
      g.restore();

      // área bajo la curva
      const grad = g.createLinearGradient(0, top, 0, top + ph);
      grad.addColorStop(0, hexA(col.accent, 0.28));
      grad.addColorStop(1, hexA(col.accent, 0.02));
      g.beginPath();
      g.moveTo(X(0), Y(ys[0]));
      for (let i = 1; i <= N; i++) g.lineTo(X(i / N), Y(ys[i]));
      g.lineTo(X(1), top + ph);
      g.lineTo(X(0), top + ph);
      g.closePath();
      g.fillStyle = grad;
      g.fill();

      // línea de reactivos
      g.setLineDash([4, 4]);
      g.strokeStyle = col.grid;
      g.beginPath();
      g.moveTo(l, Y(ys[0])); g.lineTo(l + pw, Y(ys[0]));
      g.stroke();
      g.setLineDash([]);

      // marcadores (TS, intermediarios, extremos)
      g.font = '600 11px system-ui, sans-serif';
      (sc.puntos || []).forEach(p => {
        const x = X(p.t);
        const y = Y(sc.energia(p.t));
        if (p.tipo === 'TS') {
          g.setLineDash([3, 3]);
          g.strokeStyle = col.warn;
          g.globalAlpha = 0.6;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, top + ph); g.stroke();
          g.globalAlpha = 1;
          g.setLineDash([]);
          g.fillStyle = col.warn;
          g.textAlign = 'center';
          g.fillText(p.etiqueta, x, y - 8);
        } else {
          g.fillStyle = col.ink;
          g.textAlign = p.tipo === 'R' ? 'left' : p.tipo === 'P' ? 'right' : 'center';
          const dy = p.tipo === 'INT' ? 18 : -9;
          const dx = p.tipo === 'R' ? 4 : p.tipo === 'P' ? -4 : 0;
          g.fillText(p.etiqueta, x + dx, y + dy);
        }
      });

      // Eₐ
      const ea = sc.energiaEtiquetas && sc.energiaEtiquetas.ea;
      if (ea) {
        const x = X((ea.t0 + ea.t1) / 2 + (ea.t1 - ea.t0) * 0.0);
        const yTop = Y(sc.energia(ea.t1));
        const yBot = Y(sc.energia(ea.t0));
        g.strokeStyle = col.warn;
        g.fillStyle = col.warn;
        g.lineWidth = 1.2;
        const xa = X(ea.t1) - 10;
        arrow(g, xa, yBot, xa, yTop + 2);
        g.textAlign = 'right';
        g.font = '600 11px system-ui, sans-serif';
        g.fillText(ea.texto, xa - 5, (yTop + yBot) / 2 + 4);
      }

      // curva completa (tenue) + tramo recorrido (intenso)
      g.lineWidth = 2;
      g.strokeStyle = hexA(col.accent, 0.4);
      g.beginPath();
      g.moveTo(X(0), Y(ys[0]));
      for (let i = 1; i <= N; i++) g.lineTo(X(i / N), Y(ys[i]));
      g.stroke();
      const kmax = Math.round(this.t * N);
      g.lineWidth = 3;
      g.strokeStyle = col.accent;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(X(0), Y(ys[0]));
      for (let i = 1; i <= kmax; i++) g.lineTo(X(i / N), Y(ys[i]));
      g.stroke();

      // hover
      if (this.hover !== null) {
        const x = X(this.hover);
        g.strokeStyle = col.muted;
        g.setLineDash([2, 3]);
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ph); g.stroke();
        g.setLineDash([]);
      }

      // punto actual con halo
      const cx = X(this.t);
      const cy = Y(sc.energia(this.t));
      const halo = g.createRadialGradient(cx, cy, 0, cx, cy, 16);
      halo.addColorStop(0, hexA(col.accent, 0.55));
      halo.addColorStop(1, hexA(col.accent, 0));
      g.fillStyle = halo;
      g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.strokeStyle = col.accent;
      g.lineWidth = 2.5;
      g.beginPath(); g.arc(cx, cy, 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  }

  function arrow(g, x0, y0, x1, y1) {
    g.beginPath();
    g.moveTo(x0, y0); g.lineTo(x1, y1);
    g.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x1 - 6 * Math.cos(a - 0.45), y1 - 6 * Math.sin(a - 0.45));
    g.lineTo(x1 - 6 * Math.cos(a + 0.45), y1 - 6 * Math.sin(a + 0.45));
    g.closePath();
    g.fill();
  }

  function hexA(color, a) {
    // admite #rrggbb, #rgb y rgb()/rgba()
    const c = color.trim();
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const n = parseInt(h, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(',').map(s => s.trim());
      return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')';
    }
    return c;
  }

  root.EnergyDiagram = EnergyDiagram;
})(typeof window !== 'undefined' ? window : globalThis);
