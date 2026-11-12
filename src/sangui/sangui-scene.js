/*
 * Sangui: the 3D scene, in one piece.
 * Rack of 8 tubes -> three tubes rise -> results sheet arrives and lands on a label -> pick a tube ->
 * dive into it -> land on a model (red blood cell, LDL particle, iron in its heme ring) -> and back.
 *
 * Plain three.js (r187). No React in here: the page creates the scene on a canvas and tells it what to do.
 *   const scene = createSanguiScene({ canvas, overlay, onEvent });
 *   scene.setScroll(p);   // 0..6, one unit per scroll step; runs both ways
 *   scene.pick(i);        // 0 yellow (blood fats), 1 purple (blood count and sugar), 2 rust red (iron)
 *   scene.back();         // plays the dive in reverse
 * See README.md for the full list.
 */
import * as THREE from 'three';

const T = THREE, TAU = Math.PI * 2;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = cl(t, 0, 1); return t * t * (3 - 2 * t); };
const wrap = a => ((a % TAU) + TAU + Math.PI) % TAU - Math.PI;

export const COLOURS = { ink: 0x1E2145, blood: 0xD9482F, bloodTop: 0xEF4F34, yellow: 0xF0E66E, purple: 0x6A4E9E, rust: 0xA84E1B,
  teal: 0x17827C, label: 0xDDD8C8, cream: 0xFBF9F2, haze: 0xF4F1E4 };

/* The three tubes, left to right, and what each dive lands on */
export const TUBES = [
  { key: 'fats', cap: 'yellow', model: 'ldl', flood: COLOURS.yellow },
  { key: 'blood', cap: 'purple', model: 'cell', flood: COLOURS.blood },
  { key: 'iron', cap: 'rust', model: 'iron', flood: COLOURS.rust }];

/* Scroll steps. setScroll(n) rests on step n; in between, things move. Names follow the handoff (its steps 2 to 7). */
export const STEPS = ['before', 'rack', 'tubes rise', 'sheet arrives', 'sheet travels', 'labels', 'pick'];

/* Where things sit, as fractions of the stage (x: 0 left to 1 right, y: 0 top to 1 bottom). Measured from the Figma frames.
   tubeX has one row per step from "tubes rise" to "pick". Pass your own with { layout } or setLayout() to tune. */
export const LAYOUTS = {
  wide: { tubeH: .52, tubeY: .5, tubeX: [[.32, .49, .65], [.12, .28, .44], [.12, .28, .44], [.12, .28, .44], [.33, .5, .67]],
    rack: { x: .76, y: .6, w: .44, h: .5 }, sheet: [{ x: .83, y: .4, h: .62 }, { x: .63, y: .47, h: .27 }],
    model: { x: .29, y: .55, rw: .17, rh: .27 } },
  narrow: { tubeH: .36, tubeY: .4, tubeX: [[.24, .5, .76], [.24, .5, .76], [.24, .5, .76], [.24, .5, .76], [.24, .5, .76]],
    rack: { x: .5, y: .45, w: .9, h: .42 }, sheet: [{ x: .5, y: .75, h: .36 }, { x: .5, y: .72, h: .22 }],
    model: { x: .5, y: .27, rw: .3, rh: .17 } } };

/* Markers on each model: a point on the surface and the direction it faces (both in the model's own coordinates).
   The labels layer gives each one its title and note; the order here is the order there. */
const MARKERS = {
  cell: [{ a: [0, .115, 0], n: [0, 1, 0] }, { a: [-.78, .25, -.45], n: [-.47, 1, -.27] }, { a: [.42, .29, .27], n: [.25, 1, .16] }],
  iron: [{ a: [.14, .19, .14], n: [.5, .7, .5] }, { a: [-.86, .1, 0], n: [0, 1, 0] }, { a: [.02, .2, 0], n: [0, 1, 0], on: 'o2' }],
  ldl: [{ a: [-.33, .62, -.2], n: [-.33, .62, -.2] }, { a: [.2, .7, .16], n: [.2, .7, .16] }, { a: [0, 0, .79], n: [0, 0, 1], on: 'ribbon' }] };

export function createSanguiScene(opts) {
  const canvas = opts.canvas, overlay = opts.overlay, emit = opts.onEvent || (() => {});
  const rm = opts.reducedMotion != null ? !!opts.reducedMotion : matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Two settings keep the colours exactly as in the r128 mockups (see "Moving to React" in the 3D notes).
     ColorManagement is global to three.js: if the page has another three.js scene, it is affected too. */
  T.ColorManagement.enabled = false;
  const R = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true });
  R.outputColorSpace = T.LinearSRGBColorSpace; R.localClippingEnabled = true; R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, .1, 100); cam.position.set(0, 0, 7);
  const VIS_H = 2 * 7 * Math.tan(17.5 * Math.PI / 180);
  let W = 800, H = 600, visW = VIS_H, L = LAYOUTS.wide, userLayout = opts.layout || null;
  function resize() { W = canvas.clientWidth || 800; H = canvas.clientHeight || 600; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    visW = VIS_H * cam.aspect; const base = cam.aspect < .9 ? LAYOUTS.narrow : LAYOUTS.wide; L = Object.assign({}, base, userLayout || {});
    /* a partial entry such as { model: { x: .3 } } keeps the rest of that entry */
    ['rack', 'model'].forEach(k => { if (userLayout && userLayout[k]) { L[k] = Object.assign({}, base[k], userLayout[k]); } }); }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  /* nothing is drawn while the canvas is scrolled out of view */
  let seen = true; const io = new IntersectionObserver(es => { seen = es[0].isIntersecting; }); io.observe(canvas);
  const wx = nx => (nx - .5) * visW, wy = ny => (.5 - ny) * VIS_H;

  /* ---- Toon shading: three flat bands, one light. The light sits lower for the models so the cell's dent shows. ---- */
  const gm = new T.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, T.RedFormat); gm.minFilter = gm.magFilter = T.NearestFilter; gm.needsUpdate = true;
  const LT = new T.Vector3(3, 4, 5), LC = new T.Vector3(3, 1.6, 5);
  const dl = new T.DirectionalLight(0xffffff, .95 * Math.PI); dl.position.copy(LT); scene.add(dl); scene.add(new T.AmbientLight(0xffffff, .32 * Math.PI));
  const INK = COLOURS.ink, K = .022;
  const toon = c => new T.MeshToonMaterial({ color: c, gradientMap: gm });
  const V2 = (x, y) => new T.Vector2(x, y);
  function lathe(pts, seg, chk) { let g = new T.LatheGeometry(pts, seg); if (g.attributes.normal.getZ(chk) < 0) { g = new T.LatheGeometry(pts.slice().reverse(), seg); } return g; }
  /* Outline: a copy of the shape, pushed out along its normals, drawn in ink from the inside */
  function hullOf(g, k) { const o = g.clone(), p = o.attributes.position, n = o.attributes.normal;
    for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k); } return o; }
  const inkBack = new T.MeshBasicMaterial({ color: INK, side: T.BackSide }), inkFront = new T.MeshBasicMaterial({ color: INK });

  /* ---- Tube geometry (same model as the tube mockup) ---- */
  const R0 = .32, YB = -1.48, YT = 1.8, tp = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI / 2; tp.push(V2(Math.cos(a) * R0, YB + Math.sin(a) * R0)); }
  tp.push(V2(R0, YT));
  const tubeGeo = lathe(tp, 48, 13), tubeHullGeo = hullOf(tubeGeo, K);
  const RB = .27, YF = .75, YC = 1.38, YLOW = YC - (YF + 1.8), bp = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI / 2; bp.push(V2(Math.cos(a) * RB, YB + Math.sin(a) * RB)); }
  bp.push(V2(RB, YC), V2(RB, YC), V2(0, YC));
  const bloodGeo = lathe(bp, 48, 13);
  const RC = .41, cp = [V2(0, 1.40), V2(R0 - .02, 1.40), V2(RC - .03, 1.38), V2(RC, 1.41), V2(RC, 1.45), V2(RC, 1.88), V2(RC, 1.92), V2(RC - .035, 1.99), V2(RC - .09, 2.02), V2(RC - .13, 2.02), V2(0, 2.02)];
  const capGeo = lathe(cp, 132, 4), cpp = capGeo.attributes.position;
  for (let i = 0; i < cpp.count; i++) { const x = cpp.getX(i), y = cpp.getY(i), z = cpp.getZ(i); if (y > 1.44 && y < 1.89) { const f = 1 + .05 * Math.cos(Math.atan2(x, z) * 22); cpp.setXYZ(i, x * f, y, z * f); } }
  capGeo.computeVertexNormals();
  /* Recomputing the normals (needed for the ribs) leaves two flaws: a seam where the turned shape starts and ends,
     and a pinch at the centre of the top and bottom. Both let the outline show through as a dark slit. Join them up. */
  { const n = capGeo.attributes.normal, N = cp.length, S = 132;
    for (let j = 0; j < N; j++) { const a = j, b = S * N + j, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); }
    for (let i = 0; i <= S; i++) { [i * N, i * N + N - 1].forEach(k => n.setXYZ(k, 0, cpp.getY(k) > 1.7 ? 1 : -1, 0)); } }
  const capHullGeo = hullOf(capGeo, K);
  const RL = R0 + .012, L0 = -1.0, L1 = .3, TS = Math.PI * 7 / 6, TL = Math.PI * 5 / 3, LMID = (L0 + L1) / 2;
  const labelGeo = new T.CylinderGeometry(RL, RL, L1 - L0, 48, 1, true, TS, TL);
  const printGeo = new T.CylinderGeometry(RL + .002, RL + .002, L1 - L0, 48, 1, true, TS, TL);
  const ringGeo = new T.CylinderGeometry(RL + .003, RL + .003, .018, 48, 1, true, TS, TL);
  const stripGeo = new T.CylinderGeometry(RL + .003, RL + .003, L1 - L0, 2, 1, true, 0, .055);

  /* Label print: the same bars and small range charts as the results sheet, sized for a tube label */
  function labelPrint(seed) { const c = document.createElement('canvas'); c.width = 1024; c.height = 768; const x = c.getContext('2d'); let r = seed;
    const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647, x0 = 352;
    const bar = (px, py, w, h, a) => { x.globalAlpha = a; x.fillStyle = '#1E2145'; x.beginPath(); x.roundRect(px, py, w, h, h / 2); x.fill(); x.globalAlpha = 1; };
    bar(x0, 92, 200 + rnd() * 60, 30, 1); bar(x0, 140, 130, 14, .5);
    for (let row = 0; row < 5; row++) { const y = 212 + row * 96, w = 90 + rnd() * 70, b0 = .2 + rnd() * .2, b1 = b0 + .25 + rnd() * .15, d = .25 + rnd() * .5;
      bar(x0, y, w, 20, 1); bar(x0, y + 32, w * .6, 11, .45);
      x.fillStyle = '#F0E66E'; x.fillRect(x0 + 190 + 130 * b0, y, 130 * (b1 - b0), 30); x.strokeStyle = '#1E2145'; x.lineWidth = 3; x.strokeRect(x0 + 190 + 130 * b0, y, 130 * (b1 - b0), 30);
      x.fillStyle = '#D9482F'; x.beginPath(); x.arc(x0 + 190 + 130 * d, y + 15, 11, 0, TAU); x.fill(); x.stroke(); }
    const t = new T.CanvasTexture(c); t.anisotropy = R.capabilities.getMaxAnisotropy(); return t; }

  /* One tube. It is see-through, so its outline must not show through its own glass: a hidden mask writes the tube's
     shape into one bit of the stencil buffer, and the outline is drawn only where that bit is not set. Eight bits, eight tubes. */
  const tintShared = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .34, depthWrite: false });
  function makeTube(index, capMat, shared, print) {
    const spin = new T.Group(), bit = 1 << index, own = [];
    const mask = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true });
    mask.stencilWrite = true; mask.stencilRef = bit; mask.stencilWriteMask = bit; mask.stencilFunc = T.AlwaysStencilFunc; mask.stencilZPass = T.ReplaceStencilOp;
    const hull = new T.MeshBasicMaterial({ color: INK, side: T.BackSide, transparent: true, depthWrite: false });
    hull.stencilWrite = true; hull.stencilRef = bit; hull.stencilFuncMask = bit; hull.stencilWriteMask = 0; hull.stencilFunc = T.NotEqualStencilFunc;
    /* Blood fills the whole inside; a level plane cuts it off, so the surface stays level when the tube tips */
    const plane = new T.Plane(new T.Vector3(0, -1, 0), 0);
    const bloodF = toon(COLOURS.blood); bloodF.transparent = true; bloodF.clippingPlanes = [plane];
    const bloodS = new T.MeshBasicMaterial({ color: COLOURS.bloodTop, side: T.BackSide, transparent: true, clippingPlanes: [plane] });
    own.push(hull, bloodF, bloodS);
    const add = (g, m, o) => { const me = new T.Mesh(g, m); me.renderOrder = o || 0; spin.add(me); return me; };
    add(tubeGeo, mask, 1); add(tubeHullGeo, hull, 2); add(tubeGeo, shared.tint, 3); add(bloodGeo, bloodS, 4); add(bloodGeo, bloodF, 5);
    add(capGeo, capMat); add(capHullGeo, shared.inkB);
    let printMat = null;
    if (print) { printMat = new T.MeshBasicMaterial({ map: print.map, transparent: true, opacity: 0, depthWrite: false }); add(print.geo, printMat).position.y = print.y; }
    add(labelGeo, shared.label).position.y = LMID;
    add(ringGeo, shared.inkF).position.y = L1; add(ringGeo, shared.inkF).position.y = L0;
    const s1 = add(stripGeo, shared.inkF); s1.position.y = LMID; s1.rotation.y = TS;
    const s2 = add(stripGeo, shared.inkF); s2.position.y = LMID; s2.rotation.y = TS + TL - .055;
    return { spin, plane, printMat, own };
  }

  /* ---- The rack: a clear holder with ten holes and eight tubes. Three of them are the tubes the story follows. ---- */
  const AX = new T.Vector3(1, 0, 0), AY = new T.Vector3(0, 1, 0), q = new T.Quaternion(), q0 = new T.Quaternion(), q1 = new T.Quaternion();
  const RHOME = new T.Quaternion().setFromAxisAngle(AX, .38).multiply(new T.Quaternion().setFromAxisAngle(AY, -.5));
  const rackPos = new T.Group(), rack = new T.Group(), inner = new T.Group(); scene.add(rackPos); rackPos.add(rack); rack.add(inner); inner.position.y = -.11;
  const rackMats = [], rk = m => { m.userData.o = m.opacity; m.userData.tr = m.transparent; rackMats.push(m); return m; };
  const rShared = { tint: rk(tintShared.clone()), inkF: rk(inkFront.clone()), inkB: rk(inkBack.clone()), label: rk(toon(COLOURS.label)) };
  const rCaps = { teal: rk(toon(COLOURS.teal)), yellow: rk(toon(COLOURS.yellow)) };
  const SP = .98, MARGIN = .62, COLS = 5, X0 = -(COLS - 1) * SP / 2, HALF_W = (COLS - 1) * SP / 2 + MARGIN, HALF_D = SP / 2 + MARGIN;
  const SLOTS = [[0, 1], [1, 1], [2, 1], [4, 1], [0, 0], [2, 0], [3, 0], [4, 0]], REST = ['teal', 'teal', 'yellow', 'teal', 'teal'];
  const slotAt = (i, out) => out.set(X0 + SLOTS[i][0] * SP, 0, (SLOTS[i][1] - .5) * SP);
  const rackTubes = [];
  for (let i = 3; i < 8; i++) { const t = makeTube(i, rCaps[REST[i - 3]], rShared, false); t.own.forEach(rk); slotAt(i, t.spin.position); t.spin.rotation.y = i * .9; inner.add(t.spin); rackTubes.push(t); }
  { const E = .022, unit = new T.BoxGeometry(1, 1, 1), holeGeo = new T.TorusGeometry(.4, .011, 6, 40);
    const veil = rk(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .2, depthWrite: false }));
    const slab = (w, h, d, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z);
      const ve = new T.Mesh(unit, veil); ve.scale.set(w, h, d); ve.renderOrder = 6; g.add(ve);
      const beam = (sx, sy, sz, px, py, pz) => { const b = new T.Mesh(unit, rShared.inkF); b.scale.set(sx, sy, sz); b.position.set(px, py, pz); g.add(b); };
      [-1, 1].forEach(a => [-1, 1].forEach(b => { beam(w + E, E, E, 0, a * h / 2, b * d / 2); beam(E, h + E, E, a * w / 2, 0, b * d / 2); beam(E, E, d + E, a * w / 2, b * h / 2, 0); }));
      inner.add(g); };
    const yBase = -1.86, yLow = -1.2, yUp = .5, TH = .07;
    slab(HALF_W * 2, .08, HALF_D * 2, 0, yBase, 0);
    [yLow, yUp].forEach(y => { slab(HALF_W * 2, TH, HALF_D * 2, 0, y, 0);
      for (let c = 0; c < COLS; c++) { for (let r = 0; r < 2; r++) { const h = new T.Mesh(holeGeo, rShared.inkF); h.rotation.x = Math.PI / 2; h.position.set(X0 + c * SP, y + TH / 2 + .006, (r - .5) * SP); inner.add(h); } } });
    [-1, 1].forEach(s => slab(TH, yUp - yBase, HALF_D * 2, s * (HALF_W - TH / 2), (yUp + yBase) / 2, 0)); }
  function setRackOpacity(o) { rackMats.forEach(m => { m.opacity = m.userData.o * o; m.transparent = m.userData.tr || o < 1; }); }
  const RK = { uq: RHOME.clone(), wx: 0, wy: 0, touch: -1e9, scale: .5 };

  /* ---- The results sheet's print, and paper that can bend ----
     The sheet ends its journey by wrapping round the rust red tube and becoming that tube's label print.
     So the print is painted twice: once on paper (the sheet) and once as ink alone (what stays on the label). */
  const SW = 2.0, SH = SW * 1024 / 724;
  function paintSheet(paper) { const pc = document.createElement('canvas'); pc.width = 724; pc.height = 1024; const x = pc.getContext('2d');
    const bar = (px, py, w, h, a) => { x.globalAlpha = a == null ? 1 : a; x.fillStyle = '#1E2145'; x.beginPath(); x.roundRect(px, py, w, h, h / 2); x.fill(); x.globalAlpha = 1; };
    if (paper) { x.fillStyle = '#FAF7EE'; x.fillRect(0, 0, 724, 1024); }
    bar(64, 70, 300, 34); bar(64, 124, 190, 16, .5);
    x.strokeStyle = '#1E2145'; x.lineWidth = 4; x.beginPath(); x.arc(610, 98, 36, 0, TAU); x.stroke(); bar(588, 90, 44, 16, .5);
    bar(64, 196, 150, 14, .5); bar(64, 222, 240, 14, .5); bar(420, 196, 120, 14, .5); bar(420, 222, 200, 14, .5);
    x.fillStyle = '#1E2145'; x.fillRect(64, 272, 596, 3);
    [[170, .34, .62, .5], [120, .2, .55, .74], [200, .4, .7, .52], [140, .3, .6, .36], [180, .25, .5, .44], [110, .45, .75, .6], [160, .3, .62, .47]].forEach((r, i) => { const y = 312 + i * 88;
      bar(64, y, r[0], 20); bar(64, y + 32, r[0] * .55, 12, .45); bar(300, y + 4, 70, 26);
      const tx = 420, tw = 240; x.fillStyle = '#1E2145'; x.globalAlpha = .3; x.fillRect(tx, y + 15, tw, 3); x.globalAlpha = 1;
      x.fillStyle = '#F0E66E'; x.fillRect(tx + tw * r[1], y + 2, tw * (r[2] - r[1]), 30); x.strokeStyle = '#1E2145'; x.lineWidth = 2.5; x.strokeRect(tx + tw * r[1], y + 2, tw * (r[2] - r[1]), 30);
      x.fillStyle = '#D9482F'; x.beginPath(); x.arc(tx + tw * r[3], y + 17, 11, 0, TAU); x.fill(); x.strokeStyle = '#1E2145'; x.lineWidth = 2.5; x.stroke(); });
    x.fillStyle = '#1E2145'; x.fillRect(64, 936, 596, 3); bar(64, 960, 260, 12, .45); bar(64, 982, 180, 12, .45);
    const tex = new T.CanvasTexture(pc); tex.anisotropy = R.capabilities.getMaxAnisotropy(); return tex; }
  const sheetTex = paintSheet(true), inkTex = paintSheet(false);
  /* Wrapped, the sheet is 90% as tall as a label. FIT is its size then, in tube units; BEND_R is the radius it bends to, in sheet units. */
  const RLP = RL + .003, FIT = 1.17 / SH, BEND_R = RLP / FIT;
  function bendable(w, h) { const g = new T.PlaneGeometry(w, h, 40, 1); g.userData.x0 = g.attributes.position.array.filter((_, i) => i % 3 === 0); return g; }
  /* k = 0 is flat paper, k = 1 is paper wrapped round the tube; the middle of the sheet stays put and the sides curl back */
  function bend(g, k) { const pt = g.attributes.position, x0 = g.userData.x0, c = k / BEND_R;
    for (let i = 0; i < pt.count; i++) { const x = x0[i]; if (c < 1e-4) { pt.setX(i, x); pt.setZ(i, 0); } else { pt.setX(i, Math.sin(x * c) / c); pt.setZ(i, (Math.cos(x * c) - 1) / c); } } pt.needsUpdate = true; }
  /* The print as it sits on the tube once the sheet has landed: the same bend, fixed, in the tube's own coordinates */
  const patchGeo = bendable(SW, SH); bend(patchGeo, 1); patchGeo.scale(FIT, FIT, FIT); patchGeo.translate(0, LMID, RLP);

  /* ---- The three tubes of the story. They start in the rack's first three holes and live in the scene, not in the rack. ---- */
  const HOME = new T.Quaternion().setFromAxisAngle(AX, .2);
  const hShared = { tint: tintShared, inkF: inkFront, inkB: inkBack, label: toon(COLOURS.label) };
  const tubes = TUBES.map((d, i) => { const t = makeTube(i, toon(COLOURS[d.cap]), hShared, i === 2 ? { geo: patchGeo, map: inkTex, y: 0 } : { geo: printGeo, map: labelPrint(7 + i * 13), y: LMID });
    const pos = new T.Group(), kick = new T.Group(), usr = new T.Group(); pos.add(kick); kick.add(usr); usr.add(t.spin); t.spin.position.y = -.11; scene.add(pos);
    return Object.assign(t, { pos, kick, usr, uq: HOME.clone(), uq0: HOME.clone(), s: .6, x: 0, wx: 0, wy: 0, touch: -1e9, contact: false, stage: 0,
      off: new T.Vector3(), vel: new T.Vector3(), ka: new T.Vector3(0, 0, 1), kphi: 0, kv: 0, base: new T.Vector3() }); });

  /* ---- Results sheet: printed paper with an ink edge. Both layers can bend, for the wrap at the end. ---- */
  const sheet = new T.Group(), sheetGeos = [bendable(SW + 2 * K, SH + 2 * K), bendable(SW, SH)]; let sheetBend = -1;
  const sheetMats = [new T.MeshBasicMaterial({ color: INK, transparent: true, side: T.DoubleSide }), new T.MeshBasicMaterial({ map: sheetTex, transparent: true })];
  sheetGeos.forEach((g, i) => { const m = new T.Mesh(g, sheetMats[i]); m.renderOrder = 7 + i; m.frustumCulled = false; if (!i) { m.position.z = -.004; } sheet.add(m); });
  sheet.visible = false; scene.add(sheet);
  const SQ = [new T.Quaternion().setFromEuler(new T.Euler(.1, -.38, -.12)), new T.Quaternion().setFromEuler(new T.Euler(.25, -.7, -.3))];

  /* ---- The three models ---- */
  const modelPos = new T.Group(), model = new T.Group(); scene.add(modelPos); modelPos.add(model); modelPos.visible = false;
  const cellM = new T.Group(), ldlM = new T.Group(), ironM = new T.Group(); model.add(cellM, ldlM, ironM);
  const part = (geo, col, k, parent) => { const g = new T.Group(); g.add(new T.Mesh(geo, toon(col))); g.add(new T.Mesh(hullOf(geo, k), inkBack)); parent.add(g); return g; };
  /* Red blood cell: a sphere squashed with the Evans and Fung (1972) profile, which gives the dent on both sides */
  const cellY = r2 => .5 * (.207 + 2.003 * r2 - 1.123 * r2 * r2);
  { const g = new T.SphereGeometry(1, 64, 40), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) * cellY(Math.min(1, x * x + z * z))); }
    g.computeVertexNormals(); part(g, COLOURS.blood, .02, cellM); }
  /* Sugar on the cell, for HbA1c: small cream hexagons sitting on the surface, both sides */
  const sugar = new T.Group(), SUG = { w: 0, want: 0 }; cellM.add(sugar);
  { const hex = new T.CylinderGeometry(.075, .075, .035, 6), up = new T.Vector3(0, 1, 0), n = new T.Vector3();
    [[.25, .3, 1], [.55, 1.9, 1], [.72, 3.6, 1], [.45, 4.9, 1], [.8, .9, 1], [.62, 5.8, 1], [.5, 2.6, -1], [.75, 4.2, -1], [.3, .8, -1]].forEach(b => {
      const r = b[0], th = b[1], sd = b[2], f = rr => cellY(rr * rr) * Math.sqrt(1 - rr * rr), y = f(r), dy = (f(r + .01) - f(r - .01)) / .02;
      const g = part(hex, COLOURS.cream, .012, sugar); n.set(-dy * Math.cos(th), sd, -dy * Math.sin(th)).normalize();
      g.position.set(r * Math.cos(th), sd * y, r * Math.sin(th)).addScaledVector(n, .012); g.quaternion.setFromUnitVectors(up, n); g.scale.setScalar(.0001); }); }
  /* LDL particle: a slightly lumpy ball, with one ribbon round it for the single long protein that belts the real particle */
  const ribbon = new T.Group();
  { const g = new T.SphereGeometry(.72, 48, 32), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .05 * Math.sin(x * 7) * Math.sin(y * 6 + 1) * Math.sin(z * 7 + 2); p.setXYZ(i, x * f, y * f, z * f); }
    g.computeVertexNormals(); part(g, COLOURS.yellow, .02, ldlM);
    const pr = []; for (let i = 0; i <= 8; i++) { const y = -.1 + i * .025; pr.push(V2(Math.sqrt(.79 * .79 - y * y), y)); } pr.push(V2(.7, .1), V2(.7, -.1), pr[0].clone());
    part(lathe(pr, 72, 4), COLOURS.teal, .014, ribbon); ribbon.rotation.set(.55, 0, .8); ldlM.add(ribbon);
    /* the ribbon's marker sits where the ribbon comes closest to the top of the ball, so it stays in view as the ball turns */
    let best = -9; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, w = new T.Vector3(Math.cos(a), 0, Math.sin(a)).applyEuler(ribbon.rotation); if (w.y > best) { best = w.y; MARKERS.ldl[2].a = [Math.cos(a) * .79, 0, Math.sin(a) * .79]; MARKERS.ldl[2].n = [Math.cos(a), 0, Math.sin(a)]; } } }
  /* Iron in its heme: a flat ring with four lobes, one iron atom held by four spokes, and an oxygen pair that docks onto it */
  const o2 = new T.Group(); let dock = 0;
  { const ringG = new T.TorusGeometry(.86, .17, 14, 72); ringG.rotateX(Math.PI / 2); ringG.scale(1, .55, 1); ringG.computeVertexNormals(); part(ringG, COLOURS.blood, .02, ironM);
    const lobeG = new T.SphereGeometry(.27, 28, 18); lobeG.scale(1, .5, 1); lobeG.computeVertexNormals();
    const spokeG = new T.CylinderGeometry(.045, .045, .5, 12); spokeG.rotateZ(Math.PI / 2);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, lb = part(lobeG, COLOURS.blood, .02, ironM); lb.position.set(Math.cos(a) * .86, 0, Math.sin(a) * .86);
      const b = i * Math.PI / 2, sp = part(spokeG, COLOURS.blood, .016, ironM); sp.position.set(Math.cos(b) * .47, 0, Math.sin(b) * .47); sp.rotation.y = -b; }
    part(new T.SphereGeometry(.27, 36, 24), COLOURS.rust, .02, ironM);
    const oxG = new T.SphereGeometry(.15, 24, 16); part(oxG, COLOURS.teal, .016, o2).position.set(-.1, 0, 0); part(oxG, COLOURS.teal, .016, o2).position.set(.13, .1, 0); o2.position.y = .5; ironM.add(o2); }
  const MODELS = { cell: cellM, ldl: ldlM, iron: ironM };
  const CAX = new T.Vector3(.3, 1, .12).normalize(), CHOME = new T.Quaternion().setFromAxisAngle(AX, .85);
  /* Rest pose per model: the marked side faces you. The cell is tipped a little further so its dent catches the darker band. */
  const POSE = { cell: new T.Quaternion().setFromEuler(new T.Euler(.45, .3, -.6)), ldl: CHOME, iron: CHOME };
  const M = { w: 0, wx: 0, wy: 0, touch: -1e9, key: null };
  /* Points on each model's surface. Their outline on screen is what the edge text follows. */
  const ring = (r, y, n, out) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; out.push(new T.Vector3(r * Math.cos(a), y, r * Math.sin(a))); } };
  const SAMPLES = { cell: [], ldl: [], iron: [] };
  [[1, 0], [.9, .24], [.9, -.24], [.72, .328], [.72, -.328]].forEach(r => ring(r[0], r[1], 40, SAMPLES.cell));
  [[.79, 0], [.69, .38], [.69, -.38], [.4, .68], [.4, -.68], [.05, .79], [.05, -.79]].forEach(r => ring(r[0], r[1], 24, SAMPLES.ldl));
  ring(1.05, .1, 48, SAMPLES.iron); ring(1.05, -.1, 48, SAMPLES.iron);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; for (let j = 0; j < 10; j++) { const b = j / 10 * TAU; SAMPLES.iron.push(new T.Vector3(Math.cos(a) * .86 + .29 * Math.cos(b), 0, Math.sin(a) * .86 + .29 * Math.sin(b))); } }
  [[-.27, .5], [.3, .6], [-.1, .67], [.13, .77]].forEach(pt => SAMPLES.iron.push(new T.Vector3(pt[0], pt[1], 0)));

  /* ---- The colour that fills the screen during the dive: a flat sheet right in front of the camera ---- */
  const floodMat = new T.MeshBasicMaterial({ color: COLOURS.blood, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const flood = new T.Mesh(new T.PlaneGeometry(8, 8), floodMat); flood.position.z = 6; flood.renderOrder = 1000; flood.visible = false; scene.add(flood);

  /* ---- State ---- */
  let P = 0, p = 0, mode = 'scroll', chosen = 1, u = 0, dir = 0, swapped = false, textOn = false, paused = false, last = 0, raf = 0, drag = null, ia = 0, valueKey = 'hemoglobin';
  const DIVE = 2.8, RETURN = 2.0, tubeScale = () => L.tubeH * VIS_H / 3.82;
  const modelScale = () => Math.min(visW * L.model.rw, VIS_H * L.model.rh);
  const v = new T.Vector3(), v2 = new T.Vector3(), up = new T.Vector3(), eu = new T.Euler();

  /* ---- Collisions between the three tubes: each is treated as a capsule (a line with a radius) ---- */
  const A1 = new T.Vector3(), B1 = new T.Vector3(), A2 = new T.Vector3(), B2 = new T.Vector3(), C1 = new T.Vector3(), C2 = new T.Vector3(), D1 = new T.Vector3(), D2 = new T.Vector3(), RR = new T.Vector3(), NRM = new T.Vector3(), CP = new T.Vector3(), CR = .37;
  const seg = (t, a, b) => { a.set(0, -1.48, 0); t.spin.localToWorld(a); b.set(0, 1.66, 0); t.spin.localToWorld(b); };
  function segDist(p1, q1, p2, q2, c1, c2) { D1.subVectors(q1, p1); D2.subVectors(q2, p2); RR.subVectors(p1, p2);
    const a = D1.dot(D1), e = D2.dot(D2), f = D2.dot(RR), c = D1.dot(RR), b = D1.dot(D2), den = a * e - b * b;
    let s = den > 1e-9 ? cl((b * f - c * e) / den, 0, 1) : 0, t = (b * s + f) / e;
    if (t < 0) { t = 0; s = cl(-c / a, 0, 1); } else if (t > 1) { t = 1; s = cl((b - c) / a, 0, 1); }
    c1.copy(p1).addScaledVector(D1, s); c2.copy(p2).addScaledVector(D2, t); return c1.distanceTo(c2); }
  function gap(i, out) { const t = tubes[i]; t.pos.updateMatrixWorld(true); seg(t, A1, B1); let g = 1e9;
    tubes.forEach((o, j) => { if (j === i || !o.pos.visible) return; seg(o, A2, B2); const d = segDist(A1, B1, A2, B2, C1, C2) - CR * (t.s + o.s);
      if (d < g) { g = d; if (out) { out.j = j; NRM.subVectors(C2, C1); if (NRM.lengthSq() < 1e-8) { NRM.set(o.x > t.x ? 1 : -1, 0, 0); } NRM.normalize(); CP.copy(C2); } } }); return g; }
  const hit = { j: -1 };
  function bump(i, j, speed) { if (rm) return; const a = tubes[i], b = tubes[j], k = cl(speed * .02, .18, .6);
    b.vel.addScaledVector(NRM, k * 3); a.vel.addScaledVector(NRM, -k * 1.2);
    v.set(0, 0, 0); b.spin.localToWorld(v); v2.subVectors(CP, v); b.ka.crossVectors(v2, NRM); if (b.ka.lengthSq() < 1e-6) { b.ka.set(0, 0, 1); } b.ka.normalize(); b.kv += k * 2.2;
    try { if (navigator.vibrate) { navigator.vibrate(8); } } catch (_) { /* no vibration here */ } }
  /* Turn a tube, one axis at a time. A step that would push it further into a neighbour is refused. */
  function turnTube(i, ax, ay, speed) { const t = tubes[i]; let blocked = false;
    [[AY, ax], [AX, ay]].forEach(s => { if (!s[1]) return; const g0 = gap(i); q0.copy(t.uq); q.setFromAxisAngle(s[0], s[1]); t.uq.premultiply(q); t.usr.quaternion.copy(t.uq); const g1 = gap(i, hit);
      if (g1 < 0 && g1 < g0 - 1e-4) { t.uq.copy(q0); t.usr.quaternion.copy(q0); blocked = true; if (!t.contact) { t.contact = true; bump(i, hit.j, speed); } } });
    if (!blocked) { t.contact = false; } t.touch = performance.now(); return blocked; }
  const turnQ = (qt, ax, ay) => { q.setFromAxisAngle(AY, ax); qt.premultiply(q); q.setFromAxisAngle(AX, ay); qt.premultiply(q); };

  /* ---- Grab areas: invisible boxes that follow each object, so the page still scrolls everywhere else.
          A press that does not move is a tap. A hard spin carries on after release and slows down. ---- */
  const WMAX = 16, WINDOW = 180, capW = w => cl(w, -WMAX, WMAX), grabs = [], NO_SPIN = { vx: 0, vy: 0, bx: 0, by: 0, amp: 0 };
  /* hand a release over to an object: its carried-on spin (wx, wy) and its settle (direction, strength, clock) */
  const release = (o, r) => { o.wx = r.vx; o.wy = r.vy; o.bx = r.bx; o.by = r.by; o.ba = r.amp; o.bt = 0; o.touch = performance.now(); };
  /* the settle, as a turning speed: forward a touch, back a little less, then still (lasts about a second) */
  const settle = (o, dt) => { if (!(o.ba > 0)) return 0; o.bt += dt; if (o.bt > 1.4) { o.ba = 0; return 0; } return o.ba * Math.exp(-2.6 * o.bt) * Math.sin(8.5 * o.bt) * dt; };
  function grabArea(name, onMove, onTap, onEnd) { const el = document.createElement('div'); el.dataset.sanguiGrab = name;
    el.style.cssText = 'position:absolute;display:none;touch-action:none;cursor:grab;pointer-events:auto'; overlay.appendChild(el);
    const down = e => { const t = performance.now(); drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, el, moved: 0, trail: [{ t, x: e.clientX, y: e.clientY }] };
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* fine */ } el.style.cursor = 'grabbing'; onEnd(NO_SPIN); e.preventDefault(); };
    const move = e => { if (!drag || drag.el !== el) return; if (e.pointerType === 'mouse' && e.buttons === 0) { end(e); return; } const dx = e.clientX - drag.x, dy = e.clientY - drag.y, tn = performance.now();
      drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; drag.trail.push({ t: tn, x: e.clientX, y: e.clientY }); while (drag.trail.length > 2 && tn - drag.trail[1].t > WINDOW) { drag.trail.shift(); }
      if (drag.moved > 6) { onMove(dx * .01, dy * .01, Math.abs(dx) + Math.abs(dy)); } };
    /* Letting go. The spin that carries on comes from how fast the hand was moving over the last moments (so a short, quick flick
       counts, and a pause before letting go counts as slowing down), scaled a little by how long the drag was. Every release also
       gets a small settle: the object rocks on a touch in the drag's direction and back, so it never just stops dead. */
    const end = e => { if (!drag || drag.el !== el) return; const tap = drag.moved <= 6 && e.type === 'pointerup', out = { vx: 0, vy: 0, bx: 0, by: 0, amp: 0 };
      if (!rm && !tap && drag.moved > 6) { const tr = drag.trail, now = performance.now(), b = tr[tr.length - 1]; let i = tr.length - 1; while (i > 0 && b.t - tr[i - 1].t <= WINDOW) { i--; }
        /* speed = distance over the last 180 ms of movement; hold = 1 if let go straight away, fading to 0 after a quarter second of holding still;
           reach = 55% for a flick of a few pixels, rising to 100% from about 220 px */
        const a = tr[i], span = Math.max(.03, (b.t - a.t) / 1000), hold = cl(1 - (now - b.t - 60) / 190, 0, 1), reach = .55 + .45 * Math.min(1, drag.moved / 220);
        out.vx = capW((b.x - a.x) * .01 / span * reach * hold); out.vy = capW((b.y - a.y) * .01 / span * reach * hold);
        let dx = b.x - a.x, dy = b.y - a.y; if (Math.hypot(dx, dy) < 2) { dx = drag.x - drag.x0; dy = drag.y - drag.y0; }
        const d = Math.hypot(dx, dy) || 1; out.bx = dx / d; out.by = dy / d;
        out.amp = (.45 + .35 * Math.min(1, drag.moved / 150)) * (1 - Math.min(1, Math.hypot(out.vx, out.vy) / 4)); }
      drag = null; el.style.cursor = 'grab'; onEnd(out); if (tap && onTap) { onTap(e); } };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
    grabs.push(el); return el; }
  const place = (el, on, x0, y0, x1, y1, pad) => { if (!on) { el.style.display = 'none'; return; } el.style.display = 'block';
    el.style.left = (x0 - pad).toFixed(1) + 'px'; el.style.top = (y0 - pad).toFixed(1) + 'px'; el.style.width = (x1 - x0 + 2 * pad).toFixed(1) + 'px'; el.style.height = (y1 - y0 + 2 * pad).toFixed(1) + 'px'; };
  const tubeGrabs = tubes.map((t, i) => grabArea('tube-' + i, (ax, ay, sp) => { if (mode === 'scroll' && t.stage > .99) { turnTube(i, ax, ay, sp); } },
    () => { pick(i); }, r => { release(t, r); t.contact = false; }));
  const modelGrab = grabArea('model', (ax, ay) => { turnQ(model.quaternion, ax, ay); M.touch = performance.now(); },
    e => { const r = canvas.getBoundingClientRect(); emit('tap', { on: 'model', x: e.clientX - r.left, y: e.clientY - r.top }); }, r => release(M, r));
  const rackGrab = grabArea('rack', (ax, ay) => { turnQ(RK.uq, ax, ay); RK.touch = performance.now(); }, null, r => release(RK, r));

  /* ---- What the page can call ---- */
  function setMode(m) { if (m !== mode) { mode = m; emit('mode', { mode, tube: chosen, model: TUBES[chosen].model }); } }
  function pick(i) { if (mode !== 'scroll' || p < 5.9 || P < 5.9) return false; chosen = i; u = 0; dir = 1; tubes.forEach(t => { t.uq0.copy(t.uq); t.wx = t.wy = 0; t.ba = 0; });
    floodMat.color.setHex(rm ? COLOURS.haze : TUBES[i].flood); setMode('diving'); return true; }
  function back() { if (mode !== 'model' && mode !== 'diving') return false; dir = -1; setMode('returning'); return true; }
  function showModel(key) { M.key = key; Object.keys(MODELS).forEach(k => { MODELS[k].visible = k === key; }); }

  const pr = new T.Vector3();
  const toScreen = (obj, pt, out) => { pr.copy(pt); obj.localToWorld(pr); pr.project(cam); out[0] = (pr.x + 1) / 2 * W; out[1] = (1 - pr.y) / 2 * H; return out; };
  const BP = []; [-1.8, 2.02].forEach(y => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BP.push(new T.Vector3(.43 * Math.cos(a), y, .43 * Math.sin(a))); } });
  const xy = [0, 0], frameData = { w: 0, h: 0, p: 0, mode: 'scroll', tubes: [{}, {}, {}], model: { key: null, shown: false, settled: false, cx: 0, cy: 0, r: 0, outline: [], markers: [] } };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!seen) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    /* 1. Where are we in the scroll? With reduced motion each step is a still. */
    if (rm) { p = Math.round(P); } else { p += (P - p) * (1 - Math.exp(-dt * 12)); if (Math.abs(P - p) < 1e-4) { p = P; } }
    if (mode === 'model' && P < 5.6) { back(); }
    /* 2. Where are we in the dive? u runs 0 to 1 on the way in and 1 to 0 on the way back. */
    if (dir) { u = cl(u + dir * dt / (rm ? .4 : dir > 0 ? DIVE : RETURN), 0, 1);
      if (dir > 0 && u >= 1) { dir = 0; setMode('model'); } else if (dir < 0 && u <= 0) { dir = 0; setMode('scroll'); emit('returned', { tube: chosen }); } }
    const tau = rm ? (u >= .5 ? DIVE : 0) : u * DIVE, S = tubeScale(), ms = modelScale();
    const fl = rm ? 1 - Math.abs(2 * u - 1) : tau < 1.35 ? Math.pow(cl((tau - .85) / .45, 0, 1), 2) : 1 - cl((tau - 1.35) / .6, 0, 1);
    floodMat.opacity = fl; flood.visible = fl > .001;
    const sw = tau >= 1.35;
    if (sw !== swapped) { swapped = sw; modelPos.visible = sw; dl.position.copy(sw ? LC : LT);
      if (sw) { showModel(TUBES[chosen].model); dock = 0; model.quaternion.copy(POSE[M.key]); M.w = 0; M.wx = M.wy = 0; M.ba = 0; M.touch = -1e9; } }
    const tx = dir >= 0 && tau >= 1.95; if (tx !== textOn) { textOn = tx; emit('text', { show: tx, tube: chosen, model: TUBES[chosen].model }); }

    /* 3. The rack: comes in from the right, slightly turned, and settles; later slides out and fades. */
    const rackOn = p > .02 && p < 1.98 && !sw;
    rackPos.visible = rackOn;
    /* it slides in during the first part of the step and is still turning as it arrives, so the turn happens in view */
    const fIn = ease((cl(p, 0, 1) - .04) / .62), fTurn = ease((cl(p, 0, 1) - .28) / .66), fOut = cl(p - 1, 0, 1), gOut = ease((fOut - .35) / .6);
    RK.scale = Math.min(visW * L.rack.w / 5.5, VIS_H * L.rack.h / 4.3);
    if (!drag || drag.el !== rackGrab) { const sr = settle(RK, dt); if (sr) { turnQ(RK.uq, RK.bx * sr, RK.by * sr); }
      if (Math.abs(RK.wx) + Math.abs(RK.wy) > .03) { turnQ(RK.uq, RK.wx * dt, RK.wy * dt); const f = Math.exp(-dt * 4.2); RK.wx *= f; RK.wy *= f; RK.touch = now; }
      else if (!rm && now - RK.touch > 1100 && RK.uq.angleTo(RHOME) > .002) { RK.uq.slerp(RHOME, 1 - Math.exp(-dt * 1.1)); } else if (rm) { RK.uq.copy(RHOME); } }
    const rackX = wx(lerp(lerp(1.6, L.rack.x, fIn), 1.65, gOut)), slide = p > 1 ? rackX - wx(L.rack.x) : 0; /* how far the rack has slid away from where it stood */
    rackPos.position.set(rackX, wy(L.rack.y), 0); rackPos.scale.setScalar(RK.scale);
    const turnIn = (1 - fTurn) - .1 * Math.sin(Math.PI * fTurn); /* 1 as it enters, a small swing past rest, then 0 */
    rack.quaternion.setFromEuler(eu.set(.55 * turnIn, -1.9 * turnIn, -.3 * turnIn)).multiply(RK.uq);
    setRackOpacity(1 - cl((fOut - .55) / .35, 0, 1));
    rackPos.updateMatrixWorld(true); rack.getWorldQuaternion(q1); up.set(0, 1, 0).applyQuaternion(q1);

    /* 4. The three tubes. Idle spin runs at rest; during the label step they all face you so the print can land. */
    const idle = !rm && !paused && mode === 'scroll' && p >= 1.98;
    if (p > 4.02 && p < 4.98) { ia -= wrap(ia) * (1 - Math.exp(-dt * 5)); } else if (idle && !drag) { ia += dt * .2; }
    const turnS = TAU * ease((p - 4.08) / .5), aD = ease(tau / .55), eD = cl((tau - .55) / .8, 0, 1);
    const kk = cl(Math.min(p, 6) - 2, 0, 4), k0 = Math.min(3, Math.floor(kk)), ke = ease((kk - k0 - .08) / .84);
    tubes.forEach((t, i) => {
      const held = drag && drag.el === tubeGrabs[i]; let x, y, z = 0, s, stage;
      slotAt(i, v); rack.localToWorld(v);
      if (p <= 1) { x = v.x; y = v.y; z = v.z; s = RK.scale; stage = 0; }
      else if (p < 2) { const fi = cl((p - 1 - .06 * i) / .88, 0, 1), rise = ease(fi / .5), mv = ease((fi - .25) / .75);
        v.x -= slide; v.addScaledVector(up, 2.2 * RK.scale * rise); x = lerp(v.x, wx(L.tubeX[0][i]), mv); y = lerp(v.y, wy(L.tubeY), mv); z = lerp(v.z, 0, mv); s = lerp(RK.scale, S, mv); stage = mv; }
      else { x = wx(lerp(L.tubeX[k0][i], L.tubeX[k0 + 1][i], ke)); y = wy(L.tubeY); s = S; stage = 1; }
      t.base.set(x, y, z);
      /* user turning: momentum, then a slow drift back upright */
      if (mode === 'scroll' && stage > .99) {
        if (!held) { const st = settle(t, dt); if (st) { const keep = t.touch; turnTube(i, t.bx * st, t.by * st, 0); t.touch = keep; } }
        if (!held && Math.abs(t.wx) + Math.abs(t.wy) > .03) { if (turnTube(i, t.wx * dt, t.wy * dt, (Math.abs(t.wx) + Math.abs(t.wy)) * 3)) { t.wx = t.wy = 0; } else { const f = Math.exp(-dt * 4.2); t.wx *= f; t.wy *= f; } }
        else if (!held && !rm && now - t.touch > 1200 && t.uq.angleTo(HOME) > .002) { t.uq.slerp(HOME, 1 - Math.exp(-dt * 1.1)); } }
      else if (mode === 'scroll') { t.uq.copy(HOME); t.wx = t.wy = 0; }
      let spinA = lerp(i * .9, ia + turnS, stage);
      q.copy(q1).slerp(t.uq, stage);
      /* the dive: the chosen tube straightens, turns the gap in its label to you, comes to the centre and grows; the others shrink away */
      if (tau > 0) {
        if (i !== chosen) { s *= 1 - aD; }
        else { const big = 1 + 11 * eD * eD; x = lerp(x, 0, aD); y = lerp(y, 0, aD) + .45 * (big - 1) + .45 * eD; s = lerp(s, 1, aD) * big;
          q.copy(t.uq0).slerp(HOME, aD); spinA += wrap(Math.PI - spinA) * aD; } }
      t.vel.addScaledVector(t.off, -140 * dt).multiplyScalar(Math.max(0, 1 - 13 * dt)); t.off.addScaledVector(t.vel, dt);
      t.kv += (-160 * t.kphi - 14 * t.kv) * dt; t.kphi += t.kv * dt;
      t.s = s; t.x = x; t.stage = stage; t.pos.visible = p > .02 && s > .01 && !sw;
      t.pos.position.set(x + t.off.x, y + t.off.y, z + t.off.z); t.pos.scale.setScalar(Math.max(s, 1e-4));
      t.kick.quaternion.setFromAxisAngle(t.ka, t.kphi); t.usr.quaternion.copy(q); t.spin.rotation.y = spinA;
      /* label print: the two other tubes get theirs while turned away (mid-turn); the rust red one keeps the sheet's ink as the paper melts into the label */
      t.printMat.opacity = i === 2 ? ease((p - 4.9) / .08) : ease((p - 4.3) / .08);
    });

    /* 5. The results sheet: in from the right, tilts and shrinks, flies to the rust red tube, then wraps round it and becomes its label. */
    const sOn = p > 2.02 && p < 4.985 && !sw; sheet.visible = sOn;
    if (sOn) { const t2 = tubes[2], a = ease((p - 2.08) / .84), b = ease((p - 3.08) / .84), c1 = ease((p - 4.08) / .47), c2 = ease((p - 4.55) / .37), A = L.sheet[0], B = L.sheet[1];
      const sa = VIS_H * A.h / SH, sb = VIS_H * B.h / SH;
      let x = lerp(wx(1.25), wx(A.x), a), y = lerp(wy(A.y + .25), wy(A.y), a), z = .6, s = sa; q.copy(SQ[0]);
      if (p > 3) { x = lerp(x, wx(B.x), b); y = lerp(y, wy(B.y), b); s = lerp(sa, sb, b); q.slerp(SQ[1], b); }
      if (p > 4) { t2.pos.updateMatrixWorld(true);
        /* first to a spot just in front of the label, still flat (the tube is finishing its turn, so this ignores the tube's spin) */
        v.set(0, LMID - .11, RLP + .55); t2.usr.localToWorld(v); t2.usr.getWorldQuaternion(q0);
        x = lerp(x, v.x, c1); y = lerp(y, v.y, c1); z = lerp(z, v.z, c1); s = lerp(s, FIT * t2.s * 1.3, c1); q.slerp(q0, c1);
        /* then onto the label, following the tube exactly, so the wrapped sheet ends where the tube's own print is */
        v.set(0, LMID, RLP); t2.spin.localToWorld(v); t2.spin.getWorldQuaternion(q0);
        x = lerp(x, v.x, c2); y = lerp(y, v.y, c2); z = lerp(z, v.z, c2); s = lerp(s, FIT * t2.s, c2); q.slerp(q0, c2); }
      sheet.position.set(x, y, z); sheet.scale.setScalar(s); sheet.quaternion.copy(q);
      const k = ease((p - 4.6) / .32); if (k !== sheetBend) { sheetBend = k; sheetGeos.forEach(g => bend(g, k)); }
      /* at the very end the paper and its edge melt into the label; the ink stays, now as the tube's print */
      sheetMats[0].opacity = 1 - ease((p - 4.84) / .06); sheetMats[1].opacity = 1 - ease((p - 4.9) / .08); }

    /* 6. The model: arrives big in the middle, mid-tumble, then moves to its place as the text comes in. */
    if (sw) { const m = 1 - Math.pow(1 - cl((tau - 1.35) / .6, 0, 1), 2), n = ease((tau - 1.95) / .85), held = drag && drag.el === modelGrab;
      modelPos.position.set(lerp(0, wx(L.model.x), n), lerp(0, wy(L.model.y), n), 0); modelPos.scale.setScalar(lerp(lerp(3.2 * ms, 1.5 * ms, m), ms, n));
      if (!held) { const sm = settle(M, dt); if (sm) { turnQ(model.quaternion, M.bx * sm, M.by * sm); } }
      if (!held && Math.abs(M.wx) + Math.abs(M.wy) > .03) { turnQ(model.quaternion, M.wx * dt, M.wy * dt); const f = Math.exp(-dt * 4.2); M.wx *= f; M.wy *= f; M.touch = now; }
      /* on the way in the model tumbles into its rest pose; after that it turns slowly about its own axis, which keeps the marked side in view */
      if (mode === 'diving' && !rm) { model.quaternion.setFromAxisAngle(CAX, -2.6 * Math.pow(1 - cl((tau - 1.35) / 1.3, 0, 1), 2)).multiply(POSE[M.key]); }
      /* the slow idle turn picks up again while the settle is fading, so there is no dead moment in between */
      const idleM = !rm && !paused && !held && mode === 'model' && now - M.touch > 450;
      M.w += ((idleM ? .16 : 0) - M.w) * (1 - Math.exp(-dt * 2.4));
      if (!rm && !held && M.w > .001) { q.setFromAxisAngle(AY, M.w * dt); model.quaternion.multiply(q); }
      dock += ((textOn ? 1 : 0) - dock) * (rm ? 1 : 1 - Math.exp(-dt * 2.2));
      o2.position.y = .5 + (1 - dock) * 1.1 + (rm || paused ? 0 : Math.sin(now / 1000 * 1.6) * .025 * dock);
      SUG.want = valueKey === 'hba1c' && M.key === 'cell' && textOn ? 1 : 0; SUG.w += (SUG.want - SUG.w) * (rm ? 1 : 1 - Math.exp(-dt * 5));
      sugar.children.forEach((g, i) => { g.scale.setScalar(Math.max(1e-4, ease(SUG.w * 1.7 - i * .08))); }); sugar.visible = SUG.w > .01; }

    scene.updateMatrixWorld(true);
    /* 7. Keep every tube's blood level */
    const level = (t, s) => { v.set(0, 1, 0).transformDirection(t.spin.matrixWorld); const c = v.y; v2.set(0, YLOW + (YF - YLOW) * (c + 1) / 2, 0); t.spin.localToWorld(v2); t.plane.constant = v2.y + .27 * RB * (1 - Math.abs(c)) * s; };
    tubes.forEach(t => { if (t.pos.visible) { level(t, t.s); } }); if (rackOn) { rackTubes.forEach(t => level(t, RK.scale)); }

    /* 8. Grab areas follow the objects; the same numbers go to the page for captions, markers and edge text. */
    const D = frameData; D.w = W; D.h = H; D.p = p; D.mode = mode; D.chosen = chosen; D.atPick = mode === 'scroll' && p >= 5.9;
    tubes.forEach((t, i) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; BP.forEach(pt => { toScreen(t.spin, pt, xy); x0 = Math.min(x0, xy[0]); y0 = Math.min(y0, xy[1]); x1 = Math.max(x1, xy[0]); y1 = Math.max(y1, xy[1]); });
      const on = mode === 'scroll' && t.stage > .99 && t.pos.visible; place(tubeGrabs[i], on, x0, y0, x1, y1, 10);
      const d = D.tubes[i]; d.visible = t.pos.visible && t.stage > .5; d.left = x0; d.top = y0; d.right = x1; d.bottom = y1; d.cx = (x0 + x1) / 2; });
    { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; [-1, 1].forEach(a => [-1.95, 2.05].forEach(y => [-1, 1].forEach(b => { v2.set(a * HALF_W, y, b * HALF_D); toScreen(inner, v2, xy); x0 = Math.min(x0, xy[0]); y0 = Math.min(y0, xy[1]); x1 = Math.max(x1, xy[0]); y1 = Math.max(y1, xy[1]); })));
      place(rackGrab, rackOn && mode === 'scroll' && p > .9 && p < 1.1, x0, y0, x1, y1, 6); }
    const md = D.model; md.shown = sw; md.key = sw ? M.key : null; md.settled = sw && tau >= DIVE - .01; md.text = textOn; md.value = valueKey;
    if (sw) { v2.set(0, 0, 0); toScreen(modelPos, v2, xy); md.cx = xy[0]; md.cy = xy[1]; md.r = modelPos.scale.x * H / VIS_H;
      place(modelGrab, mode === 'model', md.cx - md.r, md.cy - md.r, md.cx + md.r, md.cy + md.r, 12);
      md.outline = SAMPLES[M.key].map(pt => toScreen(model, pt, [0, 0]));
      md.markers = MARKERS[M.key].map((mk, i) => { const host = mk.on === 'o2' ? o2 : mk.on === 'ribbon' ? ribbon : model, out = md.markers[i] || {};
        v2.set(mk.a[0], mk.a[1], mk.a[2]); toScreen(host, v2, xy); out.x = xy[0]; out.y = xy[1];
        v2.set(mk.a[0], mk.a[1], mk.a[2]); host.localToWorld(v2); v.set(mk.n[0], mk.n[1], mk.n[2]).normalize().transformDirection(host.matrixWorld);
        out.visible = v.dot(v2.subVectors(cam.position, v2)) > .05; return out; }); }
    else { place(modelGrab, false); md.outline = []; md.markers = []; }

    R.render(scene, cam);
    emit('frame', D);
  }
  raf = requestAnimationFrame(frame);

  return {
    /** Scroll position, 0 to 6 (see STEPS). Pass { snap: true } to jump without animating, for a skip link. */
    setScroll(value, o) { P = cl(value, 0, 6); if (o && o.snap) { p = P; } },
    /** Start the dive into tube 0, 1 or 2. Only works while resting on the last step. Returns true if it started. */
    pick,
    /** Play the dive in reverse and end on the pick step. Returns true if it started. */
    back,
    /** For the purple tube: 'hemoglobin' (plain cell) or 'hba1c' (the same cell with sugar on it). */
    setValue(key) { valueKey = key; },
    /** Stop or restart everything that moves by itself (idle spin, the oxygen's hover). */
    setPaused(b) { paused = !!b; },
    /** Override parts of the layout, e.g. { model: { x: .3, y: .5, rw: .17, rh: .27 } }. */
    setLayout(o) { userLayout = Object.assign({}, userLayout || {}, o); resize(); },
    /** Arrow-key turning: turns the model if one is showing, otherwise the three tubes. */
    nudge(ax, ay) { if (mode === 'model') { turnQ(model.quaternion, ax, ay); M.touch = performance.now(); } else if (mode === 'scroll' && p >= 2) { tubes.forEach((t, i) => turnTube(i, ax, ay, 10)); } },
    /** For tests and debugging. */
    getState() { return { scroll: p, target: P, mode, chosen, dive: u, reducedMotion: rm, paused, drawing: seen }; },
    /** Remove everything. Call when the component unmounts. */
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); grabs.forEach(g => g.remove());
      scene.traverse(o => { if (o.geometry) { o.geometry.dispose(); } if (o.material) { [].concat(o.material).forEach(m => { if (m.map) { m.map.dispose(); } m.dispose(); }); } });
      gm.dispose(); R.dispose(); },
  };
}
