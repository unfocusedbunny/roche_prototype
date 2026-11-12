/*
 * Sangui: the title page's background. Slow blobs in two reds that drift, merge and split, like a lava lamp.
 * Flat, no three.js: one small WebGL shader on its own canvas.
 *
 *   const blobs = createSanguiBlobs({ canvas });     // the canvas is sized by CSS; this follows it
 *   blobs.setPaused(true);                           // wire to the page's pause control
 *   blobs.dispose();
 *
 * It moves by itself for as long as it is on screen, so the page needs a pause control for it.
 * With reduced motion it draws one still frame. It also stops drawing while it is scrolled out of view,
 * or while it (or a parent) has visibility: hidden. Set that once the title page has faded out.
 */
const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `precision mediump float;
uniform vec2 res; uniform float t; uniform vec3 base; uniform vec3 blob;
void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * res) / min(res.x, res.y);
  float asp = res.x / min(res.x, res.y) * .5, f = 0.;
  /* seven blobs on slow looping paths; each adds to a field, and where the field is strong enough there is blob */
  for (int i = 0; i < 7; i++) {
    float k = float(i), r = .16 + .05 * sin(k * 2.4);
    vec2 c = vec2(asp * .95 * sin(t * (.11 + .017 * k) + k * 1.9), .52 * cos(t * (.09 + .013 * k) + k * 2.7));
    vec2 d = uv - c; f += r * r / (dot(d, d) + .0004);
  }
  float edge = 1.5 / min(res.x, res.y) * 8.;
  gl_FragColor = vec4(mix(base, blob, smoothstep(1. - edge, 1. + edge, f)), 1.);
}`;
const rgb = hex => [(hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255];

/* speed: 1 was the first, lively version. Mimi slowed it twice; the default is an eighth of the first pace. */
export function createSanguiBlobs({ canvas, base = 0xD9482F, blob = 0xC53D25, speed = .125, reducedMotion } = {}) {
  const rm = reducedMotion != null ? !!reducedMotion : matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  /* no WebGL: the page's own red background shows through, which is a fine fallback */
  if (!gl) { canvas.style.display = 'none'; return { setPaused() {}, dispose() {}, ok: false }; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  /* the shader did not build: hide the canvas, so the page's red shows and not a black box */
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return { setPaused() {}, dispose() {}, ok: false }; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  gl.uniform3fv(U('base'), rgb(base)); gl.uniform3fv(U('blob'), rgb(blob));
  let paused = false, seen = true, raf = 0, last = 0, time = 40, dirty = true;
  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); } gl.uniform2f(U('res'), w, h); dirty = true; }
  const ro = new ResizeObserver(size); ro.observe(canvas); size();
  const io = new IntersectionObserver(es => { seen = es[0].isIntersecting; }); io.observe(canvas);
  function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min(.1, (now - last) / 1000); last = now;
    const moving = !rm && !paused && seen && getComputedStyle(canvas).visibility !== 'hidden';
    if (moving) { time += dt * speed; dirty = true; }
    if (dirty) { dirty = false; gl.uniform1f(U('t'), time); gl.drawArrays(gl.TRIANGLES, 0, 3); } }
  raf = requestAnimationFrame(frame);
  return { ok: true,
    /** Stop or restart the drift. */
    setPaused(b) { paused = !!b; },
    /* frees what was made here but keeps the canvas usable, so it can be started again (React mounts twice while developing) */
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); gl.deleteProgram(prog); gl.deleteBuffer(buf); } };
}

/* The scroll button that goes with it: a fat, blobby V in cream, pointing down. The V is the whole button.
   It is built from two thick strokes and three round ends, melted together by a filter so the corners go soft.
   The arms sway a few degrees and the ends swell and shrink, each at its own slow pace, so the shape shifts like
   the blobs behind it; the whole V also pulses a little. Copy the markup and the CSS. Plain CSS, no script.
   The colour can be changed with --sg-scroll-ink. The class "paused" stops all movement, and so does reduced motion.
   Mimi asked for a blobby V on 12 Nov; the exact shapes and timings are Claude's.

   <button class="sg-scroll" aria-label="Scroll down">
     <svg viewBox="0 0 100 80" width="55" height="44" aria-hidden="true">
       <defs><filter id="sg-goo" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur in="SourceGraphic" stdDeviation="4"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></defs>
       <g filter="url(#sg-goo)" fill="currentColor" stroke="currentColor" stroke-width="21" stroke-linecap="round">
         <path class="sg-v1" d="M21 23 50 57"/><path class="sg-v2" d="M79 23 50 57"/>
         <circle class="sg-v3" cx="21" cy="23" r="12" stroke="none"/><circle class="sg-v4" cx="79" cy="23" r="12" stroke="none"/><circle class="sg-v5" cx="50" cy="58" r="13" stroke="none"/>
       </g></svg>
   </button>
*/
export const SCROLL_BUTTON_HTML = `<svg viewBox="0 0 100 80" width="55" height="44" aria-hidden="true"><defs><filter id="sg-goo" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur in="SourceGraphic" stdDeviation="4"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></defs><g filter="url(#sg-goo)" fill="currentColor" stroke="currentColor" stroke-width="21" stroke-linecap="round"><path class="sg-v1" d="M21 23 50 57"/><path class="sg-v2" d="M79 23 50 57"/><circle class="sg-v3" cx="21" cy="23" r="12" stroke="none"/><circle class="sg-v4" cx="79" cy="23" r="12" stroke="none"/><circle class="sg-v5" cx="50" cy="58" r="13" stroke="none"/></g></svg>`;
export const SCROLL_BUTTON_CSS = `
.sg-scroll{border:0;padding:6px;background:transparent;color:var(--sg-scroll-ink,#F4F1E4);cursor:pointer;display:grid;place-items:center;border-radius:22px;line-height:0}
.sg-scroll svg{display:block;overflow:visible}
.sg-scroll:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.sg-scroll path,.sg-scroll circle{transform-box:fill-box;transform-origin:center}
.sg-scroll .sg-v1{transform-origin:100% 100%}
.sg-scroll .sg-v2{transform-origin:0% 100%}
@media (prefers-reduced-motion:no-preference){
.sg-scroll:not(.paused) svg{animation:sg-v-pulse 2.6s ease-in-out infinite}
.sg-scroll:not(.paused) .sg-v1{animation:sg-v-sway-a 7s ease-in-out infinite}
.sg-scroll:not(.paused) .sg-v2{animation:sg-v-sway-b 9s ease-in-out infinite}
.sg-scroll:not(.paused) .sg-v3{animation:sg-v-swell 5s ease-in-out infinite}
.sg-scroll:not(.paused) .sg-v4{animation:sg-v-swell 6.5s ease-in-out infinite reverse}
.sg-scroll:not(.paused) .sg-v5{animation:sg-v-swell 8s ease-in-out infinite}}
@keyframes sg-v-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes sg-v-sway-a{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(7deg)}}
@keyframes sg-v-sway-b{0%,100%{transform:rotate(3deg)}50%{transform:rotate(-6deg)}}
@keyframes sg-v-swell{0%,100%{transform:scale(.92)}50%{transform:scale(1.3)}}
`;
