/* viewer.js — Visor 3D (Three.js r128): átomos, enlaces parciales, flechas de electrones,
 * orbitales, nubes de carga, medidas, trayectorias y cámara. Sin lógica química. */
(function (root) {
  'use strict';
  const Chem = root.Chem;
  const { V, ELEMENTOS, fmt } = Chem;

  const COL_ORB = { pos: 0x2fd3c4, neg: 0xd35bd6, lp: 0xffc847 };
  const COL_BOND = { C: 0x9aa3b2, H: 0xe8ebf0, O: 0xe5605c, Br: 0xb5654f };
  const COL_NEG = '#ff7b7b';
  const COL_POS = '#62adff';

  const tv = a => new THREE.Vector3(a[0], a[1], a[2]);
  // r128 interpreta los hex como lineales: se convierten para que, con salida sRGB, los colores se vean como se definieron
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  const setLin = (color, hex) => { color.setHex(hex).convertSRGBToLinear(); return color; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- Texturas auxiliares ---------- */
  function glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  function dashTexture() {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 8, 64);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 8, 36);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearFilter;
    return t;
  }

  /* ---------- Sprites de texto ---------- */
  function makeTextSprite(worldH) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.renderOrder = 30;
    sp.userData = { canvas, tex, key: '', worldH };
    return sp;
  }

  function drawSpriteText(sp, text, o) {
    const key = text + '|' + (o.fg || '') + '|' + (o.bg || '') + '|' + (o.badge ? 1 : 0);
    if (sp.userData.key === key) return;
    sp.userData.key = key;
    const { canvas, tex } = sp.userData;
    const g = canvas.getContext('2d');
    const size = o.size || 40;
    g.font = '600 ' + size + 'px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const tw = Math.ceil(g.measureText(text).width);
    const pad = o.badge ? 12 : 14;
    const w = Math.max((o.badge || o.bg) ? size + pad * 2 : 0, tw + pad * 2);
    const h = size + pad * 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, 256, 128);
    const k = Math.min(128 / h, 252 / w);
    g.setTransform(k, 0, 0, k, (256 - w * k) / 2, (128 - h * k) / 2);
    g.font = '600 ' + size + 'px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (o.badge) {
      g.beginPath();
      g.arc(w / 2, h / 2, Math.min(w, h) / 2 - 3, 0, Math.PI * 2);
      g.fillStyle = o.bg || 'rgba(10,12,20,0.7)';
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = o.fg;
      g.stroke();
    } else if (o.bg) {
      const r = h / 2;
      g.beginPath();
      g.moveTo(r, 2); g.lineTo(w - r, 2); g.arc(w - r, h / 2, r - 2, -Math.PI / 2, Math.PI / 2);
      g.lineTo(r, h - 2); g.arc(r, h / 2, r - 2, Math.PI / 2, Math.PI * 1.5);
      g.closePath();
      g.fillStyle = o.bg;
      g.fill();
    }
    if (!o.badge && !o.bg) {
      g.lineWidth = 6;
      g.strokeStyle = o.halo || 'rgba(8,10,18,0.85)';
      g.lineJoin = 'round';
      g.strokeText(text, w / 2, h / 2 + 2);
    }
    g.fillStyle = o.fg || '#fff';
    g.fillText(text, w / 2, h / 2 + 2);
    tex.needsUpdate = true;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const wh = sp.userData.worldH * 128 / (h * k);
    sp.scale.set(wh * 2, wh, 1);
  }

  /* ---------- Flecha curva (tubo con cabeza) ---------- */
  class CurlyArrow {
    constructor(scene, color) {
      this.N = 30;
      this.M = 7;
      const nv = (this.N + 1) * this.M;
      this.geo = new THREE.BufferGeometry();
      this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
      const idx = [];
      for (let i = 0; i < this.N; i++) {
        for (let j = 0; j < this.M; j++) {
          const a = i * this.M + j;
          const b = i * this.M + ((j + 1) % this.M);
          const c = (i + 1) * this.M + j;
          const d = (i + 1) * this.M + ((j + 1) % this.M);
          idx.push(a, c, b, b, c, d);
        }
      }
      this.geo.setIndex(idx);
      this.mat = new THREE.MeshBasicMaterial({ color: lin(color), transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
      this.tube = new THREE.Mesh(this.geo, this.mat);
      this.tube.frustumCulled = false;
      this.tube.renderOrder = 15;
      this.head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 14), this.mat);
      this.head.renderOrder = 15;
      this.head.frustumCulled = false;
      scene.add(this.tube, this.head);
    }

    set(from, to, bulge, alpha, color) {
      if (alpha < 0.02) {
        this.tube.visible = this.head.visible = false;
        return;
      }
      this.tube.visible = this.head.visible = true;
      this.mat.opacity = 0.95 * alpha;
      if (color !== undefined) setLin(this.mat.color, color);
      const p0 = tv(from);
      const p2 = tv(to);
      const p1 = p0.clone().add(p2).multiplyScalar(0.5).add(tv(bulge));
      const chord = p0.distanceTo(p2);
      const Lapprox = Math.max(0.3, chord * 1.2);
      const uEnd = clamp(1 - 0.12 / Lapprox, 0.5, 1);
      const pos = this.geo.attributes.position.array;
      const r = 0.036;
      let nPrev = null;
      const P = new THREE.Vector3();
      const T = new THREE.Vector3();
      for (let i = 0; i <= this.N; i++) {
        const u = (i / this.N) * uEnd;
        const a = (1 - u) * (1 - u);
        const b = 2 * u * (1 - u);
        const c = u * u;
        P.set(
          a * p0.x + b * p1.x + c * p2.x,
          a * p0.y + b * p1.y + c * p2.y,
          a * p0.z + b * p1.z + c * p2.z
        );
        T.set(
          2 * (1 - u) * (p1.x - p0.x) + 2 * u * (p2.x - p1.x),
          2 * (1 - u) * (p1.y - p0.y) + 2 * u * (p2.y - p1.y),
          2 * (1 - u) * (p1.z - p0.z) + 2 * u * (p2.z - p1.z)
        ).normalize();
        let n;
        if (!nPrev) {
          n = Math.abs(T.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
          n.sub(T.clone().multiplyScalar(n.dot(T))).normalize();
        } else {
          n = nPrev.clone().sub(T.clone().multiplyScalar(nPrev.dot(T))).normalize();
        }
        const bn = new THREE.Vector3().crossVectors(T, n);
        nPrev = n;
        const taper = 0.55 + 0.45 * Math.min(1, i / (this.N * 0.5));
        for (let j = 0; j < this.M; j++) {
          const ang = (j / this.M) * Math.PI * 2;
          const k = (i * this.M + j) * 3;
          pos[k] = P.x + r * taper * (Math.cos(ang) * n.x + Math.sin(ang) * bn.x);
          pos[k + 1] = P.y + r * taper * (Math.cos(ang) * n.y + Math.sin(ang) * bn.y);
          pos[k + 2] = P.z + r * taper * (Math.cos(ang) * n.z + Math.sin(ang) * bn.z);
        }
      }
      this.geo.attributes.position.needsUpdate = true;
      // cabeza: tangente en u = 1
      const Te = new THREE.Vector3(2 * (p2.x - p1.x), 2 * (p2.y - p1.y), 2 * (p2.z - p1.z)).normalize();
      this.head.position.copy(p2).addScaledVector(Te, -0.15);
      this.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Te);
    }

    dispose(scene) {
      scene.remove(this.tube, this.head);
      this.geo.dispose();
      this.mat.dispose();
      this.head.geometry.dispose();
    }
  }

  /* ============================== Visor ============================== */
  class Viewer {
    constructor(container) {
      this.container = container;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
      this.camera.position.set(2, 4, 14);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.07;
      this.controls.minDistance = 3;
      this.controls.maxDistance = 60;
      this.controls.autoRotateSpeed = 1.1;

      this._setupLights();
      this._setupGround();

      this.geoSphere = new THREE.SphereGeometry(1, 40, 28);
      this.geoCyl = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
      this.texGlow = glowTexture();
      this.texDash = dashTexture();

      this.atoms = {};
      this.bonds = [];
      this.orbMeshes = {};
      this.arrowObjs = {};
      this.trails = [];
      this.measure = [];
      this.sc = null;
      this.mix = 0; // 0 = bolas y varillas, 1 = espacio lleno
      this.mixTarget = 0;
      this.follow = true;
      this.tween = null;
      this.theme = 'dark';
      this.lookTarget = new THREE.Vector3();
      this.bounds = { c: [0, 0, 0], r: 6, minY: -3 };

      this._resize = () => this.resize();
      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(this._resize);
        this.ro.observe(container);
      }
      window.addEventListener('resize', this._resize);
      this.resize();
    }

    _setupLights() {
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4256, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 0.95);
      key.position.set(6, 14, 9);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      const sc = key.shadow.camera;
      sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
      key.shadow.bias = -0.0008;
      key.shadow.radius = 4;
      this.scene.add(key);
      this.keyLight = key;
      const rim = new THREE.DirectionalLight(0x7aa7ff, 0.5);
      rim.position.set(-9, 5, -7);
      this.scene.add(rim);
      const fill = new THREE.DirectionalLight(0xffe2c4, 0.28);
      fill.position.set(-4, -2, 10);
      this.scene.add(fill);
    }

    _setupGround() {
      this.groundGroup = new THREE.Group();
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.28 }));
      plane.rotation.x = -Math.PI / 2;
      plane.receiveShadow = true;
      this.groundGroup.add(plane);
      this.grid = new THREE.GridHelper(40, 40, 0xffffff, 0xffffff);
      setLin(this.grid.material.color, 0x7a88a8);
      this.grid.material.transparent = true;
      this.grid.material.opacity = 0.16;
      this.grid.material.depthWrite = false;
      this.groundGroup.add(this.grid);
      this.scene.add(this.groundGroup);
    }

    setTheme(theme) {
      this.theme = theme;
      setLin(this.grid.material.color, theme === 'dark' ? 0x7a88a8 : 0x5b6680);
      this.grid.material.opacity = theme === 'dark' ? 0.16 : 0.22;
      this.groundGroup.children[0].material.opacity = theme === 'dark' ? 0.28 : 0.2;
      this.renderer.toneMappingExposure = theme === 'dark' ? 1.05 : 1.0;
      Object.values(this.atoms).forEach(a => {
        a.halo.material.blending = theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
        a.halo.material.needsUpdate = true;
      });
    }

    resize() {
      const w = this.container.clientWidth || 800;
      const h = this.container.clientHeight || 600;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.camera.aspect = w / h;
      // En pantallas verticales se abre el campo para que quepa la escena
      this.camera.fov = w / h < 0.9 ? 52 : 38;
      this.camera.updateProjectionMatrix();
    }

    /* ---------- Escenario ---------- */
    clearScenario() {
      Object.values(this.atoms).forEach(a => {
        this.scene.remove(a.mesh, a.halo, a.charge, a.label);
        a.mesh.material.dispose();
        a.halo.material.dispose();
        a.charge.material.map.dispose(); a.charge.material.dispose();
        a.label.material.map.dispose(); a.label.material.dispose();
      });
      this.atoms = {};
      this.bonds.forEach(b => b.meshes.forEach(row => row.forEach(m => { this.scene.remove(m); m.material.dispose(); })));
      this.bonds = [];
      Object.values(this.orbMeshes).forEach(m => { this.scene.remove(m); m.material.dispose(); });
      this.orbMeshes = {};
      Object.values(this.arrowObjs).forEach(a => a.dispose(this.scene));
      this.arrowObjs = {};
      this.trails.forEach(t => { this.scene.remove(t.ghost, t.line); t.ghost.geometry.dispose(); t.line.geometry.dispose(); });
      this.trails = [];
      this.measure.forEach(m => { this.scene.remove(m.line, m.sprite); m.line.geometry.dispose(); });
      this.measure = [];
    }

    setScenario(sc, opts) {
      this.clearScenario();
      this.sc = sc;
      const wantsDark = this.theme === 'dark';

      sc.atoms.forEach(a => {
        const el = ELEMENTOS[a.el];
        const mat = new THREE.MeshPhysicalMaterial({
          color: lin(el.color), roughness: 0.3, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.25,
          transparent: true, opacity: 1
        });
        const mesh = new THREE.Mesh(this.geoSphere, mat);
        mesh.castShadow = true;
        mesh.scale.setScalar(el.radio);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.texGlow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
          blending: wantsDark ? THREE.AdditiveBlending : THREE.NormalBlending
        }));
        halo.renderOrder = 1;
        const charge = makeTextSprite(0.62);
        const label = makeTextSprite(0.42);
        charge.visible = false;
        label.visible = false;
        this.scene.add(mesh, halo, charge, label);
        this.atoms[a.id] = { def: a, el, mesh, halo, charge, label };
      });

      sc.bonds.forEach(([a, b]) => {
        const dashed = [0, 1].map(() => [0, 1].map(() => this._bondMaterial(true)));
        const solid = [0, 1].map(() => [0, 1].map(() => this._bondMaterial(false)));
        const meshes = [0, 1].map(line => [0, 1].map(half => {
          const m = new THREE.Mesh(this.geoCyl, solid[line][half]);
          m.castShadow = true;
          m.visible = false;
          this.scene.add(m);
          return m;
        }));
        this.bonds.push({ a, b, key: a + '-' + b, meshes, solid, dashed });
      });

      // Trayectorias precalculadas
      const N = 160;
      (sc.rastro || []).forEach(id => {
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const p = sc.frame(i / N).pos[id];
          pts.push(p[0], p[1], p[2]);
        }
        const colorHex = id.startsWith('O') ? 0xffc847 : id.startsWith('Br') ? 0xff7f66 : 0x9ad1ff;
        const mk = (op) => {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
          const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: lin(colorHex), transparent: true, opacity: op, depthWrite: false }));
          l.frustumCulled = false;
          l.visible = false;
          this.scene.add(l);
          return l;
        };
        this.trails.push({ id, ghost: mk(0.18), line: mk(0.85), N });
      });

      // Medidas: línea discontinua + etiqueta
      sc.frame(0).medidas.filter(m => m.a && m.b).forEach(m => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color: lin(0xcfd6e6), dashSize: 0.12, gapSize: 0.09, transparent: true, opacity: 0.7, depthWrite: false }));
        line.frustumCulled = false;
        line.visible = false;
        const sprite = makeTextSprite(0.38);
        sprite.visible = false;
        this.scene.add(line, sprite);
        this.measure.push({ id: m.id, a: m.a, b: m.b, line, sprite });
      });

      this._computeBounds();
      this.setPose(opts && opts.camara ? opts.camara : sc.camaras[0].id, true);
    }

    _bondMaterial(dashed) {
      const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.05 });
      if (dashed) {
        const t = this.texDash.clone();
        t.needsUpdate = true;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        m.alphaMap = t;
        m.alphaTest = 0.5;
        m.side = THREE.DoubleSide;
      }
      return m;
    }

    _computeBounds() {
      const sc = this.sc;
      let min = [1e9, 1e9, 1e9];
      let max = [-1e9, -1e9, -1e9];
      for (let i = 0; i <= 60; i++) {
        const f = sc.frame(i / 60);
        Object.values(f.pos).forEach(p => {
          for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
        });
      }
      const c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
      const r = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2 + 1.2;
      this.bounds = { c, r, minY: min[1] - 1.6 };
      this.groundGroup.position.y = this.bounds.minY;
      this.groundGroup.position.x = c[0];
      this.groundGroup.position.z = c[2];
    }

    /* ---------- Cámara ---------- */
    setPose(id, instant) {
      const pose = this.sc.camaras.find(c => c.id === id) || this.sc.camaras[0];
      this.poseId = pose.id;
      const dirv = new THREE.Vector3(pose.dir[0], pose.dir[1], pose.dir[2]).normalize();
      const fovRad = (this.camera.fov * Math.PI) / 180;
      const aspect = this.camera.aspect;
      const fitV = this.bounds.r / Math.sin(fovRad / 2);
      const fitH = this.bounds.r / Math.sin(Math.atan(Math.tan(fovRad / 2) * aspect));
      const dist = Math.max(fitV, fitH) * 0.45 + 1.3;
      const target = tv(this.bounds.c);
      const toPos = target.clone().addScaledVector(dirv, dist);
      if (instant) {
        this.camera.position.copy(toPos);
        this.controls.target.copy(target);
        this.lookTarget.copy(target);
        this.controls.update();
        this.tween = null;
      } else {
        this.tween = {
          t0: performance.now(), dur: 900,
          fromPos: this.camera.position.clone(), toPos,
          fromTar: this.controls.target.clone(), toTar: target
        };
      }
    }

    _stepTween() {
      if (!this.tween) return;
      const k = clamp((performance.now() - this.tween.t0) / this.tween.dur, 0, 1);
      const e = k * k * (3 - 2 * k);
      this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, e);
      this.controls.target.lerpVectors(this.tween.fromTar, this.tween.toTar, e);
      this.lookTarget.copy(this.controls.target);
      if (k >= 1) this.tween = null;
    }

    /* ---------- Actualización por cuadro ---------- */
    update(frame, show, t) {
      const sc = this.sc;
      if (!sc) return;
      // transición bolas/espacio lleno
      this.mix += (this.mixTarget - this.mix) * 0.12;
      if (Math.abs(this.mixTarget - this.mix) < 0.002) this.mix = this.mixTarget;
      const mix = this.mix;
      const dark = this.theme === 'dark';
      const labelFg = dark ? '#f3f5fa' : '#10151f';

      // átomos
      Object.entries(this.atoms).forEach(([id, a]) => {
        const p = frame.pos[id];
        const al = frame.alphaAtoms && frame.alphaAtoms[id] !== undefined ? frame.alphaAtoms[id] : 1;
        const vis = al > 0.03;
        a.mesh.visible = vis;
        a.alpha = al;
        if (!vis) { a.halo.visible = a.charge.visible = a.label.visible = false; return; }
        a.mesh.position.set(p[0], p[1], p[2]);
        const r = a.el.radio + (a.el.vdw * 0.9 - a.el.radio) * mix;
        a.r = r;
        a.mesh.scale.setScalar(r * (0.55 + 0.45 * al));
        a.mesh.material.opacity = al;
        a.mesh.material.transparent = al < 0.999;

        // carga
        const q = frame.q && frame.q[id] ? frame.q[id] : 0;
        const aq = Math.abs(q);
        const showHalo = show.halos && aq > 0.12;
        a.halo.visible = showHalo;
        if (showHalo) {
          a.halo.position.set(p[0], p[1], p[2]);
          const s = r * (3.0 + aq * 2.4);
          a.halo.scale.set(s, s, 1);
          setLin(a.halo.material.color, q < 0 ? 0xff4a52 : 0x3d9bff);
          a.halo.material.opacity = Math.min(0.9, aq * (dark ? 0.8 : 0.9)) * al;
        }
        if (show.cargas && aq > 0.12) {
          const entero = aq > 0.88;
          const txt = entero ? (q < 0 ? '−' : '+') : 'δ' + (q < 0 ? '−' : '+');
          drawSpriteText(a.charge, txt, { fg: q < 0 ? COL_NEG : COL_POS, badge: entero, bg: dark ? 'rgba(10,12,22,0.75)' : 'rgba(255,255,255,0.85)', size: entero ? 46 : 44 });
          a.charge.visible = true;
          a.charge.position.set(p[0] + r * 0.5, p[1] + r + 0.38, p[2]);
          a.charge.material.opacity = al;
        } else a.charge.visible = false;

        // rótulo
        const wantLabel = show.rotulos && (a.def.el !== 'H' || a.def.rotulo);
        if (wantLabel) {
          drawSpriteText(a.label, a.def.rotulo || a.def.el, { fg: labelFg, halo: dark ? 'rgba(8,10,18,0.85)' : 'rgba(255,255,255,0.9)', size: 40 });
          a.label.visible = true;
          a.label.position.set(p[0], p[1] - r - 0.32, p[2]);
        } else a.label.visible = false;
      });

      // enlaces
      this.bonds.forEach(b => this._updateBond(b, frame, mix));

      // orbitales
      const seen = new Set();
      (frame.orbs || []).forEach(o => {
        let m = this.orbMeshes[o.id];
        if (!m) {
          m = new THREE.Mesh(this.geoSphere, new THREE.MeshStandardMaterial({
            color: lin(COL_ORB[o.color]), emissive: lin(COL_ORB[o.color]), emissiveIntensity: 0.55, roughness: 0.5, metalness: 0,
            transparent: true, opacity: 0.4, depthWrite: false
          }));
          m.renderOrder = 3;
          this.scene.add(m);
          this.orbMeshes[o.id] = m;
        }
        seen.add(o.id);
        const al = show.orbitales ? o.alpha : 0;
        m.visible = al > 0.02;
        if (!m.visible) return;
        m.material.opacity = al;
        setLin(m.material.color, COL_ORB[o.color]);
        setLin(m.material.emissive, COL_ORB[o.color]);
        m.position.set(o.c[0], o.c[1], o.c[2]);
        m.scale.set(o.W, o.L, o.W);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tv(o.a).normalize());
      });
      Object.keys(this.orbMeshes).forEach(id => { if (!seen.has(id)) this.orbMeshes[id].visible = false; });

      // flechas
      const seenA = new Set();
      (frame.arrows || []).forEach(ar => {
        let obj = this.arrowObjs[ar.id];
        if (!obj) { obj = new CurlyArrow(this.scene, ar.color); this.arrowObjs[ar.id] = obj; }
        seenA.add(ar.id);
        const enabled = ar.grupo === 'hiper' ? show.hiper : show.flechas;
        obj.set(ar.from, ar.to, ar.bulge, enabled ? ar.alpha : 0, ar.color);
      });
      Object.keys(this.arrowObjs).forEach(id => { if (!seenA.has(id)) this.arrowObjs[id].set([0, 0, 0], [0, 0, 1], [0, 0, 0], 0); });

      // trayectorias
      this.trails.forEach(tr => {
        tr.ghost.visible = show.trayectorias;
        tr.line.visible = show.trayectorias;
        if (show.trayectorias) tr.line.geometry.setDrawRange(0, Math.max(2, Math.round(t * tr.N) + 1));
      });

      // medidas
      this.measure.forEach(m => {
        const vis = show.medidas && this.atoms[m.a] && this.atoms[m.b] && this.atoms[m.a].mesh.visible && this.atoms[m.b].mesh.visible;
        m.line.visible = m.sprite.visible = !!vis;
        if (!vis) return;
        const pa = frame.pos[m.a];
        const pb = frame.pos[m.b];
        const arr = m.line.geometry.attributes.position.array;
        arr[0] = pa[0]; arr[1] = pa[1]; arr[2] = pa[2]; arr[3] = pb[0]; arr[4] = pb[1]; arr[5] = pb[2];
        m.line.geometry.attributes.position.needsUpdate = true;
        m.line.computeLineDistances();
        const med = frame.medidas.find(x => x.id === m.id);
        drawSpriteText(m.sprite, fmt(med.valor, 2) + ' Å', { fg: dark ? '#e8edf8' : '#10151f', bg: dark ? 'rgba(18,22,36,0.82)' : 'rgba(255,255,255,0.9)', size: 34 });
        const mid = V.mid(pa, pb);
        m.sprite.position.set(mid[0], mid[1] + 0.42, mid[2]);
      });

      // cámara
      this._stepTween();
      if (this.follow && !this.tween) {
        const c = this._frameCenter(frame);
        const target = this.controls.target;
        const dx = (c[0] - target.x) * 0.045;
        const dy = (c[1] - target.y) * 0.045;
        const dz = (c[2] - target.z) * 0.045;
        target.x += dx; target.y += dy; target.z += dz;
        this.camera.position.x += dx; this.camera.position.y += dy; this.camera.position.z += dz;
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    _frameCenter(frame) {
      let min = [1e9, 1e9, 1e9];
      let max = [-1e9, -1e9, -1e9];
      Object.entries(frame.pos).forEach(([id, p]) => {
        const a = this.atoms[id];
        if (!a || !a.mesh.visible) return;
        for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
      });
      // se mezcla con el centro global para evitar saltos cuando las moléculas se alejan
      const g = this.bounds.c;
      return [0.5 * (min[0] + max[0]) * 0.55 + g[0] * 0.45, 0.5 * (min[1] + max[1]) * 0.55 + g[1] * 0.45, 0.5 * (min[2] + max[2]) * 0.55 + g[2] * 0.45];
    }

    _updateBond(b, frame, mix) {
      const A = this.atoms[b.a];
      const B = this.atoms[b.b];
      const hideAll = () => b.meshes.forEach(row => row.forEach(m => (m.visible = false)));
      if (!A || !B || !A.mesh.visible || !B.mesh.visible) return hideAll();
      const order = frame.orders[b.key] === undefined ? 1 : frame.orders[b.key];
      const bondVis = 1 - mix;
      if (order < 0.05 || bondVis < 0.05) return hideAll();
      const pa = tv(frame.pos[b.a]);
      const pb = tv(frame.pos[b.b]);
      const dir = new THREE.Vector3().subVectors(pb, pa);
      const len = dir.length();
      if (len < 0.05) return hideAll();
      dir.normalize();
      const al = Math.min(A.alpha === undefined ? 1 : A.alpha, B.alpha === undefined ? 1 : B.alpha);
      const heavy = A.def.el !== 'H' && B.def.el !== 'H';
      const baseR = (heavy ? 0.075 : 0.058) * bondVis * (0.4 + 0.6 * al);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      // vector perpendicular para enlaces múltiples
      let off = frame.bondOff && frame.bondOff[b.key] ? tv(frame.bondOff[b.key]) : new THREE.Vector3(0, 0, 1);
      off.sub(dir.clone().multiplyScalar(off.dot(dir)));
      if (off.lengthSq() < 1e-6) off = new THREE.Vector3(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y));
      off.normalize();

      const multiple = order > 1.03;
      const lines = multiple ? 2 : 1;
      for (let line = 0; line < 2; line++) {
        if (line >= lines) { b.meshes[line].forEach(m => (m.visible = false)); continue; }
        const ord = multiple ? (line === 0 ? 1 : order - 1) : Math.min(order, 1);
        const full = ord > 0.97;
        const shift = multiple ? (line === 0 ? 1 : -1) * 0.085 : 0;
        const rad = baseR * (multiple ? 0.8 : 1) * (full ? 1 : 0.55 + 0.45 * clamp(ord, 0, 1));
        for (let half = 0; half < 2; half++) {
          const m = b.meshes[line][half];
          const atomEnd = half === 0 ? A : B;
          const mats = full ? b.solid[line][half] : b.dashed[line][half];
          if (m.material !== mats) m.material = mats;
          setLin(m.material.color, COL_BOND[atomEnd.def.el] || 0xaaaaaa);
          // el material discontinuo necesita su propia repetición según el largo del medio enlace
          const halfLen = len * 0.5;
          const start = half === 0 ? pa : pb;
          const centre = start.clone().addScaledVector(dir, half === 0 ? halfLen / 2 : -halfLen / 2).addScaledVector(off, shift);
          m.position.copy(centre);
          m.quaternion.copy(quat);
          m.scale.set(rad, halfLen, rad);
          if (!full && m.material.alphaMap) m.material.alphaMap.repeat.set(1, Math.max(1, halfLen / 0.2));
          m.visible = rad > 0.004;
        }
      }
    }

    /* ---------- Utilidades públicas ---------- */
    setModel(spacefill) { this.mixTarget = spacefill ? 1 : 0; }
    setAutoRotate(v) { this.controls.autoRotate = !!v; }
    setFollow(v) { this.follow = !!v; }
    render() { this.renderer.render(this.scene, this.camera); }
    snapshot() {
      this.render();
      return this.renderer.domElement;
    }
  }

  root.Viewer = Viewer;
})(typeof window !== 'undefined' ? window : globalThis);
