/*
 * Sangui crowd chart: the sums behind the hill. Nothing here touches the page, and no wording lives here (that is in content.js).
 * Ported from the chart chat's reference file, version 2 (14 Nov 2026, evening), which was checked against the prototype Mimi approved.
 * Since version 2 the number can move: the split, the counts and the status are worked out for any value on a step.
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

/* How many of 100 people in the group are strictly below `value` (0 to 100). The value must sit on a step of the table,
   counted from the table's own axis.min (the drawn window may start later). */
export function belowCount(valueData, groupKey, value) {
  const b = valueData.groups[groupKey].below;
  return b[Math.min(b.length - 1, Math.max(0, Math.round((value - valueData.axis.min) / valueData.step)))];
}

/* Which answer the count calls for. At the very ends there is no honest number, so the sentence says "nearly all". */
export function answerKind(below) {
  return below <= 0 ? 'none' : below >= 100 ? 'all' : 'some';
}

/* Where the value sits against the example range: 'in', 'above' or 'below'. Always shown with a word, never colour alone. */
export function rangeStatus(value, lo, hi) {
  return value > hi + 1e-9 ? 'above' : (value < lo - 1e-9 ? 'below' : 'in');
}

/* How many of 100 are past the right edge of a zoomed axis (the note on lopsided values such as HbA1c). */
export function pastEdge(valueData, groupKey, edgeValue) {
  return 100 - belowCount(valueData, groupKey, edgeValue);
}

/* The two closed shapes of the hill, split at the line. heights[i] belongs to x = x0 + i * dx; lineX is in px and can be anywhere on the axis. */
export function hillPaths(heights, x0, dx, baseline, lineX) {
  const r = (n) => Math.round(n * 10) / 10;
  const t = Math.min(heights.length - 1, Math.max(0, (lineX - x0) / dx)), i = Math.min(heights.length - 2, Math.floor(t));
  const lineH = heights[i] + (heights[i + 1] - heights[i]) * (t - i);
  let below = 'M' + r(x0) + ' ' + r(baseline), above = 'M' + r(lineX) + ' ' + r(baseline) + ' L' + r(lineX) + ' ' + r(baseline - lineH);
  for (let k = 0; k <= i; k++) { below += ' L' + r(x0 + k * dx) + ' ' + r(baseline - heights[k]); }
  below += ' L' + r(lineX) + ' ' + r(baseline - lineH) + ' L' + r(lineX) + ' ' + r(baseline) + ' Z';
  for (let k = i + 1; k < heights.length; k++) { above += ' L' + r(x0 + k * dx) + ' ' + r(baseline - heights[k]); }
  above += ' L' + r(x0 + (heights.length - 1) * dx) + ' ' + r(baseline) + ' Z';
  return { below, above, lineY: r(baseline - lineH) };
}

/* Where the two counts go. Each is a bare number, 40 px bold, in a 100 px wide centred box.
   Inside its half of the hill when that half is at least minWidth px wide where the hill is taller than the number;
   otherwise beside the line near the top, on whichever side has room. plotWidth is the width of the plot area in px. */
export function placeCounts(heights, x0, dx, lineX, plotWidth = 784, opts = {}) {
  const { clearance = 72, minWidth = 76, insideTop = 204, besideTop = 40 } = opts;
  const span = (lo, hi) => {
    let a = -1, b = -1;
    for (let k = 0; k < heights.length; k++) { const x = x0 + k * dx; if (x >= lo && x <= hi && heights[k] >= clearance) { if (a < 0) { a = x; } b = x; } }
    return a < 0 ? null : [a, b];
  };
  const one = (s, beside) => (s && s[1] - s[0] >= minWidth) ? { left: (s[0] + s[1]) / 2 - 50, top: insideTop, inside: true } : { left: beside, top: besideTop, inside: false };
  return {
    below: one(span(-Infinity, lineX), lineX - 110 >= 0 ? lineX - 110 : lineX + 10),
    above: one(span(lineX, Infinity), lineX + 110 <= plotWidth ? lineX + 10 : lineX - 110),
  };
}

/* The morph, used when the crowd changes (dragging the slider is direct): 500 ms, this easing. */
export const MORPH_MS = 500;
export const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const mix = (a, b, e) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * e) : a + (b - a) * e);
