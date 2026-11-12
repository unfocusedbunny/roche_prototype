/*
 * Sangui: the flat layer on top of the 3D. Captions under the tubes, and for each model its figure caption,
 * markers, notes with a drawn line, and handwritten edge text that follows the model's outline.
 * Plain DOM and SVG. It only needs the numbers the scene sends with every 'frame' event.
 *
 *   const labels = createSanguiLabels({ root, scene });
 *   createSanguiScene({ ..., onEvent: (type, data) => { if (type === 'frame') labels.update(data); if (type === 'tap') labels.tap(data.x, data.y); } });
 *
 * The marker dots do not take the pointer themselves, so a drag that starts on a dot still turns the model.
 * A tap on a dot arrives through the scene's 'tap' event. Keyboard users reach the dots as normal buttons.
 *
 * All wording here is draft. The notes have not been reviewed by a doctor yet.
 */

/* Left to right: yellow, purple, rust red */
export const TUBE_TEXT = [
  { name: 'Blood fats', line: 'Measures the cholesterol travelling in your blood.' },
  { name: 'Blood count and sugar', line: 'Counts your blood cells and reads your average sugar.' },
  { name: 'Iron', line: 'Measures the iron travelling in your blood.' }];

export const MODEL_TEXT = {
  cell: { fig: 'Fig. 1', caption: 'Red blood cell', edge: 'Erythrocytus', size: 19, notes: [
    ['Dented on both sides', 'More surface for oxygen to pass through.'],
    ['A bendy edge', 'It folds to squeeze through vessels narrower than itself.'],
    ['No nucleus', 'It gave that up to make room for hemoglobin.']] },
  ldl: { fig: 'Fig. 2', caption: 'LDL particle', edge: 'Lipoproteinum densitatis humilis', size: 15, notes: [
    ['The wrapper', 'A thin coat that lets fat travel in watery blood.'],
    ['The cargo', 'Cholesterol, packed in the middle.'],
    ['One long protein', 'It wraps the whole particle like a belt.']] },
  iron: { fig: 'Fig. 3', caption: 'Heme, with its iron', edge: 'Ferrum', size: 19, notes: [
    ['Iron', 'One atom, sitting in the middle of the ring.'],
    ['Heme', 'The ring that holds it. Every hemoglobin has four.'],
    ['Oxygen', 'One molecule per iron. Picked up in the lungs, let go in the body.']] } };

const CSS = `
.sg-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.sg-line{fill:none;stroke:#1E2145;stroke-width:1;stroke-dasharray:1;stroke-dashoffset:1}
.sg-line.on{stroke-dashoffset:0;transition:stroke-dashoffset .45s ease-out}
.sg-edge{font-family:'Playwrite SK',cursive;fill:#1E2145}
.sg-fade{opacity:0;transition:opacity .35s}
.sg-fade.on{opacity:1}
.sg-cap{position:absolute;pointer-events:none;font-size:16px;color:#1E2145;white-space:nowrap}
.sg-mono{font-family:'Atkinson Hyperlegible Mono',ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.04em}
.sg-dot{position:absolute;left:-99px;top:-99px;width:44px;height:44px;margin:-22px 0 0 -22px;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:opacity .2s}
.sg-dot span{position:relative;width:12px;height:12px;border-radius:50%;background:#F4F1E4;border:1.5px solid #1E2145;box-sizing:border-box}
.sg-dot span::after{content:"";position:absolute;inset:-1.5px;border-radius:50%;border:1px solid #1E2145;opacity:0}
.sg-dot[aria-expanded="true"] span{background:#F0E66E}
.sg-dot:focus-visible{outline:2px solid #1E2145;outline-offset:-8px;border-radius:50%}
@media (prefers-reduced-motion:no-preference){.sg-dot[aria-expanded="false"]:not(.sg-paused) span::after{animation:sg-pulse 2.4s ease-out infinite}}
@keyframes sg-pulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.6);opacity:0}}
.sg-note{position:absolute;left:0;top:0;width:160px;border-top:1px solid #1E2145;padding-top:6px;opacity:0;pointer-events:none;color:#1E2145}
.sg-note.on{opacity:1;transition:opacity .3s ease .3s}
.sg-note b{display:block;font-size:14px;font-weight:700;line-height:1.25}
.sg-note p{margin:2px 0 0;font-size:13px;line-height:1.35}
.sg-tube{position:absolute;transform:translateX(-50%);border:0;background:transparent;color:#1E2145;padding:8px 6px;min-height:44px;text-align:center;pointer-events:none;cursor:default;white-space:nowrap}
.sg-tube.pick{pointer-events:auto;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
.sg-tube:focus-visible{outline:2px solid #1E2145;outline-offset:2px;border-radius:6px}
`;

const cl = (v, a, b) => Math.max(a, Math.min(b, v));
/* The tightest outline round a set of points (it has no inward curves) */
function hull(p) { p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up); }
/* How far the outline is from the centre in a given direction */
function rad(h, cx, cy, ux, uy) { let best = 0; for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length], ex = b[0] - a[0], ey = b[1] - a[1], den = ux * ey - uy * ex; if (Math.abs(den) < 1e-9) continue;
  const ax = a[0] - cx, ay = a[1] - cy, t = (ax * ey - ay * ex) / den, s = (ax * uy - ay * ux) / den; if (t > 0 && s >= -1e-6 && s <= 1.000001 && t > best) best = t; } return best; }

let uid = 0;
export function createSanguiLabels({ root, scene, showEdgeText = true }) {
  const id = 'sg' + (++uid), NS = 'http://www.w3.org/2000/svg';
  const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
  const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; (parent || root).appendChild(e); return e; };
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'sg-svg sg-fade'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<path id="${id}e" d="M0 0" fill="none" stroke="none"/><path class="sg-line" pathLength="1" d="M0 0"/><text class="sg-edge"><textPath href="#${id}e" startOffset="4%"></textPath></text>`;
  root.appendChild(svg);
  const ep = svg.children[0], lp = svg.children[1], et = svg.children[2], tp = et.firstChild;
  const cap = el('div', 'sg-cap sg-fade', null, '<span class="sg-mono"></span> <b></b>');
  const note = el('div', 'sg-note', null, '<b></b><p></p>'); note.id = id + 'n'; note.setAttribute('aria-live', 'polite');
  const dots = [0, 1, 2].map(i => { const b = el('button', 'sg-dot', null, '<span></span>'); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', note.id); b.addEventListener('click', () => open(i)); return b; });
  const tubeBtns = TUBE_TEXT.map((t, i) => { const b = el('button', 'sg-tube sg-mono sg-fade'); b.textContent = t.name; b.type = 'button'; b.tabIndex = -1; b.addEventListener('click', e => { if (scene.pick(i) && e.detail === 0) { byKey = true; } }); return b; });
  let key = null, cur = -1, edge = showEdgeText, byKey = false, autoTimer = 0, marks = [];
  const TH = [75, 62, 85]; /* where each note sits, as an angle from the model's centre (90 is straight down) */

  function open(i) { cur = cur === i ? -1 : i; dots.forEach((b, j) => b.setAttribute('aria-expanded', j === cur ? 'true' : 'false'));
    lp.classList.remove('on'); note.classList.remove('on');
    if (cur >= 0 && key) { const n = MODEL_TEXT[key].notes[cur]; note.children[0].textContent = n[0]; note.children[1].textContent = n[1]; void note.offsetHeight; void lp.getBoundingClientRect(); lp.classList.add('on'); note.classList.add('on'); } }

  function update(D) {
    /* captions under the tubes: they appear with step 5 and become buttons on the pick step */
    let bottom = 0; D.tubes.forEach(t => { if (t.visible) bottom = Math.max(bottom, t.bottom); });
    const capOn = D.mode === 'scroll' && D.p > 3.55;
    tubeBtns.forEach((b, i) => { const t = D.tubes[i]; b.classList.toggle('on', capOn && t.visible); b.classList.toggle('pick', !!D.atPick); b.tabIndex = D.atPick ? 0 : -1;
      b.style.left = t.cx.toFixed(1) + 'px'; b.style.top = (bottom + 4).toFixed(1) + 'px'; });
    /* the model's labels show once it has settled and the text is in */
    const m = D.model, on = m.shown && m.text && D.mode !== 'returning';
    if (m.key !== key) { key = m.key; cur = -1; open(-1); clearTimeout(autoTimer);
      if (key) { const t = MODEL_TEXT[key]; cap.children[0].textContent = t.fig; cap.children[1].textContent = t.caption; tp.textContent = t.edge; et.style.fontSize = t.size + 'px';
        dots.forEach((b, i) => b.setAttribute('aria-label', 'Note: ' + t.notes[i][0])); } }
    svg.classList.toggle('on', on); cap.classList.toggle('on', on);
    if (!on) { marks = []; dots.forEach(b => { b.style.opacity = 0; b.tabIndex = -1; }); if (cur >= 0) open(cur); clearTimeout(autoTimer); autoTimer = 0; return; }
    if (!autoTimer) { autoTimer = setTimeout(() => { if (cur < 0 && key) open(0); }, 1100); }
    const h = hull(m.outline), c = [m.cx, m.cy], t = MODEL_TEXT[key]; marks = m.markers;
    et.style.display = edge ? '' : 'none';
    if (edge) { /* the path starts at the lower left and runs clockwise over the top; long words get more of the outline */
      const need = t.edge.length * t.size * .62, r0 = rad(h, c[0], c[1], 0, -1) + 9, span = cl(need / r0 * 180 / Math.PI * 1.25, 150, 330), start = -90 - span * .52, steps = Math.ceil(span / 3);
      let d = ''; for (let i = 0; i <= steps; i++) { const a = (start + i * span / steps) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), r = rad(h, c[0], c[1], ux, uy) + 9; d += (i ? 'L' : 'M') + (c[0] + r * ux).toFixed(1) + ' ' + (c[1] + r * uy).toFixed(1); }
      ep.setAttribute('d', d); }
    let low = 0; h.forEach(pt => { low = Math.max(low, pt[1]); });
    /* caption under the model on the left, notes under it on the right; on a small model the caption drops below the notes */
    cap.style.left = cl(m.cx - m.r, 16, D.w - 220).toFixed(1) + 'px'; cap.style.top = cl(low + (m.r < 150 ? 104 : 40), 0, D.h - 40).toFixed(1) + 'px';
    m.markers.forEach((mk, i) => { const b = dots[i]; b.style.left = mk.x.toFixed(1) + 'px'; b.style.top = mk.y.toFixed(1) + 'px'; b.style.opacity = mk.visible ? 1 : 0; b.tabIndex = mk.visible ? 0 : -1;
      if (!mk.visible && i === cur) { open(i); }
      if (mk.visible && i === cur) { const a = TH[i] * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), r = rad(h, c[0], c[1], ux, uy) + 30, px = c[0] + r * ux, py = c[1] + r * uy;
        const left = cl(ux >= 0 ? px - 16 : px - 144, 16, D.w - 176), top = cl(py, 16, D.h - 16 - note.offsetHeight), ex = cl(px, left + 2, left + 158);
        note.style.left = left.toFixed(1) + 'px'; note.style.top = top.toFixed(1) + 'px';
        lp.setAttribute('d', 'M' + mk.x.toFixed(1) + ' ' + mk.y.toFixed(1) + ' L' + ex.toFixed(1) + ' ' + top.toFixed(1)); } });
  }

  return { update,
    /** A tap on the model at x, y (stage pixels): opens the note of the nearest marker within reach, if there is one. */
    tap(x, y) { let best = -1, bd = 26; marks.forEach((mk, i) => { const d = Math.hypot(mk.x - x, mk.y - y); if (mk.visible && d < bd) { bd = d; best = i; } }); if (best >= 0) { open(best); } },
    /** Stop or restart the pulsing rings on the marker dots. Wire it to the same pause control as the scene. */
    setPaused(b) { dots.forEach(d => d.classList.toggle('sg-paused', !!b)); },
    /** Show or hide the handwritten edge text. */
    setEdgeText(b) { edge = !!b; },
    /** The three caption buttons under the tubes, for moving keyboard focus back after "Back to the tubes". */
    tubeButtons: tubeBtns,
    dispose() { clearTimeout(autoTimer); [style, svg, cap, note].concat(dots, tubeBtns).forEach(e => e.remove()); } };
}
