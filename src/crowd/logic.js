/*
 * Sangui crowd chart: the sums behind the hill. Nothing here touches the page.
 * Ported from the chart chat's reference file (14 Nov 2026), which was checked against the mock-up Mimi approved.
 *
 * Data shape (src/data/crowds.json): values[name] = { unit, axis: {min, max}, step, groups: { ma|mb|mc|wa|wb|wc: { n, p, below, density } } }
 * density has 91 evenly spaced samples from axis.min to axis.max.
 */

/* One scale per value, shared by its six groups, so the hills keep comparable areas: the tallest group peaks at peakPx. */
export function scaleFor(valueData, peakPx = 215) {
  let max = 0;
  for (const g of Object.values(valueData.groups)) { for (const d of g.density) { if (d > max) { max = d; } } }
  return peakPx / max;
}

/* Hill height in px at any value: smooth (Catmull-Rom) between the stored samples, never below 0. */
export function heightAt(valueData, groupKey, K, value) {
  const d = valueData.groups[groupKey].density, n = d.length, { min, max } = valueData.axis;
  const t = Math.min(n - 1, Math.max(0, (value - min) / (max - min) * (n - 1)));
  const i = Math.min(n - 2, Math.floor(t)), u = t - i;
  const p0 = d[Math.max(0, i - 1)], p1 = d[i], p2 = d[i + 1], p3 = d[Math.min(n - 1, i + 2)];
  const v = 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
  return Math.max(0, v) * K;
}

/* Heights at `samples` evenly spaced values across [from, to]. These arrays are what the morph glides between. */
export function hillHeights(valueData, groupKey, K, from, to, samples = 181) {
  const out = new Array(samples);
  for (let i = 0; i < samples; i++) { out[i] = heightAt(valueData, groupKey, K, from + (to - from) * i / (samples - 1)); }
  return out;
}

/* "Higher than X of 100": people in the group strictly below `value`. The value must sit on a step of the table. Kept between 1 and 99. */
export function belowCount(valueData, groupKey, value) {
  const i = Math.round((value - valueData.axis.min) / valueData.step);
  const b = valueData.groups[groupKey].below;
  return Math.min(99, Math.max(1, b[Math.min(b.length - 1, Math.max(0, i))]));
}

/* How many of 100 are past the right edge of a zoomed axis (the note on lopsided values such as HbA1c). */
export function pastEdge(valueData, groupKey, edgeValue) {
  const i = Math.round((edgeValue - valueData.axis.min) / valueData.step);
  return 100 - valueData.groups[groupKey].below[i];
}

/* The two closed shapes of the hill, split at Robin. heights[i] belongs to x = x0 + i * dx; robinX is in px. */
export function hillPaths(heights, x0, dx, baseline, robinX) {
  const r = (n) => Math.round(n * 10) / 10;
  const t = Math.min(heights.length - 1, Math.max(0, (robinX - x0) / dx)), i = Math.min(heights.length - 2, Math.floor(t));
  const robinH = heights[i] + (heights[i + 1] - heights[i]) * (t - i);
  let below = 'M' + r(x0) + ' ' + r(baseline), above = 'M' + r(robinX) + ' ' + r(baseline) + ' L' + r(robinX) + ' ' + r(baseline - robinH);
  for (let k = 0; k <= i; k++) { below += ' L' + r(x0 + k * dx) + ' ' + r(baseline - heights[k]); }
  below += ' L' + r(robinX) + ' ' + r(baseline - robinH) + ' L' + r(robinX) + ' ' + r(baseline) + ' Z';
  for (let k = i + 1; k < heights.length; k++) { above += ' L' + r(x0 + k * dx) + ' ' + r(baseline - heights[k]); }
  above += ' L' + r(x0 + (heights.length - 1) * dx) + ' ' + r(baseline) + ' Z';
  return { below, above, robinY: r(baseline - robinH) };
}

/* Where "67 below" and "33 above" go. Each is a 100 px wide centred box (number 40 px bold, word 19 px bold 42 px lower).
   Inside its half of the hill when that half is at least minWidth px wide where the hill is taller than the label; otherwise beside Robin's line near the top. */
export function placeCounts(heights, x0, dx, robinX, opts = {}) {
  const { labelClearance = 78, minWidth = 76, insideTop = 184, besideTop = 34 } = opts;
  const span = (lo, hi) => {
    let a = -1, b = -1;
    for (let k = 0; k < heights.length; k++) { const x = x0 + k * dx; if (x >= lo && x <= hi && heights[k] >= labelClearance) { if (a < 0) { a = x; } b = x; } }
    return a < 0 ? null : [a, b];
  };
  const one = (s, beside) => (s && s[1] - s[0] >= minWidth) ? { left: (s[0] + s[1]) / 2 - 50, top: insideTop, inside: true } : { left: beside, top: besideTop, inside: false };
  return { below: one(span(-Infinity, robinX), robinX - 110), above: one(span(robinX, Infinity), robinX + 10) };
}

/* The morph: 500 ms, this easing. Every number glides from the state on screen to the target. */
export const MORPH_MS = 500;
export const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const mix = (a, b, e) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * e) : a + (b - a) * e);
