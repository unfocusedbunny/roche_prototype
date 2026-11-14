/*
 * Sangui crowd chart: "the hill". The crowd is one filled shape; Robin is a line with a dot on it.
 * The switch changes who Robin is compared with. Robin's number stays; the crowd, the lab's band and the sentence change,
 * and the hill glides into its new shape (at once with reduced motion).
 *
 * Everything is driven by the value's entry in content.js (Robin's number and its `chart` settings) and by src/data/crowds.json.
 * The drawing follows the mock-up Mimi approved, which was 784 px wide. Narrower columns get a narrower, slightly lower hill;
 * the text keeps its size, because cream on the red only passes contrast as large text.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import crowds from '../data/crowds.json';
import { scaleFor, hillHeights, belowCount, pastEdge, hillPaths, placeCounts, MORPH_MS, ease, mix } from './logic.js';
import { CHART } from '../content.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FULL = 784, PAD = 12, SAMPLES = 181, BAND_TOP = 22;
const fill = (text, words) => text.replace(/\{(\w+)\}/g, (_, k) => words[k]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Everything that depends on the group, for a chart `width` px wide. The numbers in here are the ones that glide. */
function targetFor(v, sex, age, width) {
  const data = crowds.values[v.chart.data], group = sex + age, value = +v.value, [from, to] = v.chart.window;
  const s = clamp(width / FULL, .62, 1), base = BAND_TOP + 240 * s, perUnit = (width - 2 * PAD) / (to - from), dx = (width - 2 * PAD) / (SAMPLES - 1);
  const heights = hillHeights(data, group, scaleFor(data, 215 * s), from, to, SAMPLES);
  const robinX = PAD + (value - from) * perUnit;
  const counts = placeCounts(heights, PAD, dx, robinX, { insideTop: base - 78 });
  const bLeft = clamp(counts.below.left, 0, width - 100), aLeft = clamp(counts.above.left, 0, width - 100);
  /* A count that sits beside Robin's line must not run into the hill. On a narrow chart it would, so there the counts
     that are beside the line move up into a strip of their own above the band, and everything above the band moves up with them. */
  const hits = (c, left) => !c.inside && heights.some((h, k) => Math.abs(PAD + k * dx - left - 50) < 32 && h > base - 100);
  const lift = hits(counts.below, bLeft) || hits(counts.above, aLeft) ? 64 : 0, top = (c) => c.inside ? c.top : c.top - lift;
  const lab = v.chart.lab && v.chart.lab[sex];
  /* the "lab's range" label starts at the band's left edge, unless Robin's name is in the way: then it ends at the right edge.
     On a narrow chart neither may be clear; then Robin's name moves up a row. */
  const clear = (left) => Math.abs(left + 46 - robinX) >= 84;
  const atLeft = lab && Math.max(0, PAD + (lab[0] - from) * perUnit), atRight = lab && PAD + (lab[1] - from) * perUnit - 92;
  const labLeft = lab && (clear(atLeft) || !clear(atRight) ? atLeft : atRight), raise = (lab && !clear(labLeft) ? 18 : 0) + lift;
  return {
    fixed: { data, group, value, from, to, base, perUnit, dx, robinX, lab, raise, lift, n: data.groups[group].n, belowIn: counts.below.inside,
      past: to < data.axis.max ? pastEdge(data, group, to) : 0 },
    moving: { heights, below: belowCount(data, group, value), lo: lab ? lab[0] : 0, hi: lab ? lab[1] : 0, labLeft: labLeft || 0,
      bLeft, bTop: top(counts.below), aLeft, aTop: top(counts.above) },
  };
}

/* Glides from whatever is on screen to `target`. A change of `jumpKey` (another value, another width) switches at once. */
function useMorph(target, jumpKey) {
  const [shown, setShown] = useState({ key: jumpKey, v: target });
  const live = useRef(shown); live.current = shown;
  useEffect(() => {
    const from = live.current;
    if (from.v === target) { return; }
    if (REDUCED || from.key !== jumpKey) { setShown({ key: jumpKey, v: target }); return; }
    const t0 = performance.now(); let id;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / MORPH_MS), e = ease(p);
      setShown({ key: jumpKey, v: p >= 1 ? target : Object.fromEntries(Object.keys(target).map(k => [k, mix(from.v[k], target[k], e)])) });
      if (p < 1) { id = requestAnimationFrame(step); }
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, jumpKey]);
  return shown.key === jumpKey ? shown.v : target;
}

const ICONS = { in: 'M3 8.5l3.2 3.2L13 4.8', above: 'M8 13V3.5M3.8 7.5L8 3.3l4.2 4.2', below: 'M8 3v9.5M3.8 8.5L8 12.7l4.2-4.2' };

function Segment({ label, options, value, onPick }) {
  return (
    <span className="seg" role="group" aria-label={label}>
      {Object.entries(options).map(([k, text]) => <button key={k} type="button" aria-pressed={k === value} onClick={() => onPick(k)}>{text}</button>)}
    </span>
  );
}

function Hill({ v, who, width }) {
  const target = useMemo(() => targetFor(v, who.sex, who.age, width), [v, who.sex, who.age, width]);
  const m = useMorph(target.moving, v.key + ' ' + width);
  const { fixed: f } = target, x = (val) => PAD + (val - f.from) * f.perUnit;
  const paths = hillPaths(m.heights, PAD, f.dx, f.base, f.robinX), below = Math.round(m.below);
  const lo = clamp(m.lo, f.from, f.to), hi = clamp(m.hi, f.from, f.to), edges = f.lab ? [[m.lo, f.lab[0]], [m.hi, f.lab[1]]].filter(([at]) => at >= f.from && at <= f.to) : [];
  /* axis numbers: whole steps, far enough apart to read, and never under one of the band's own numbers */
  const every = [1, 2, 5, 10, 20].find(st => st * f.perUnit >= 34) || 50, ticks = [];
  for (let t = Math.ceil(f.from / every) * every; t <= f.to + 1e-9; t += every) { if (!edges.some(([at]) => Math.abs(x(at) - x(t)) < 22)) { ticks.push(t); } }
  const words = { name: v.name, value: v.value, unit: v.chart.unitName || v.unit, n: below, group: CHART.groups[who.sex] + ' ' + CHART.ages[who.age], sex: CHART.groups[who.sex], lo: f.lab && f.lab[0], hi: f.lab && f.lab[1] };
  return (
    <svg width={width} height={f.base + 52 + f.raise} viewBox={`0 ${-18 - f.raise} ${width} ${f.base + 52 + f.raise}`} role="img" aria-label={fill(CHART.picture, { ...words, n: target.moving.below }) + (f.lab ? ' ' + fill(CHART.pictureLab, words) : '')}>
      {f.lab && <rect x={x(lo)} y={BAND_TOP} width={x(hi) - x(lo)} height={f.base - BAND_TOP} fill="var(--yellow)" />}
      <path className="ink" d={paths.below} style={{ fill: 'var(--red)' }} />
      <path className="ink" d={paths.above} style={{ fill: 'var(--cream)' }} />
      <path className="ink" d={`M0 ${f.base}H${width}` + edges.map(([at]) => `M${x(at)} ${f.base}v8`).join('')} />
      <path className="ink" d={`M${f.robinX} ${26 - f.lift}V${paths.robinY}`} />
      <circle cx={f.robinX} cy={paths.robinY} r="8" fill="var(--ink)" stroke="var(--cream)" strokeWidth="3" />
      {ticks.map(t => <text key={t} className="tick" x={x(t)} y={f.base + 26} textAnchor="middle">{t}</text>)}
      {edges.map(([at, text]) => <text key={text} className="edge" x={x(at)} y={f.base + 26} textAnchor="middle">{text}</text>)}
      {f.lab && <text className="label" x={m.labLeft} y={10 - f.lift}>{CHART.lab}</text>}
      <text className="tick" x={width} y={f.base - 14} textAnchor="end">{v.unit}</text>
      {f.past > 0 && <text className="label" x={width} y={f.base - 46} textAnchor="end">{fill(CHART.past, { n: f.past, edge: f.to })}</text>}
      <text className="name" x={f.robinX} y={10 - f.raise} textAnchor="middle">{CHART.robin}</text>
      <g className={f.belowIn ? 'on-red' : ''} textAnchor="middle">
        <text className="count" x={m.bLeft + 50} y={m.bTop + 33}>{below}</text>
        <text className="word" x={m.bLeft + 50} y={m.bTop + 58}>{CHART.below}</text>
      </g>
      <g textAnchor="middle">
        <text className="count" x={m.aLeft + 50} y={m.aTop + 33}>{100 - below}</text>
        <text className="word" x={m.aLeft + 50} y={m.aTop + 58}>{CHART.above}</text>
      </g>
    </svg>
  );
}

/* v: one value from content.js, with Robin's number and its chart settings. who: { sex: 'm' | 'w', age: 'a' | 'b' | 'c' }. */
export default function CrowdChart({ v, who, setWho }) {
  const box = useRef(null), [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setWidth(Math.min(FULL, Math.floor(box.current.clientWidth)));
    const ro = new ResizeObserver(measure); ro.observe(box.current); measure();
    return () => ro.disconnect();
  }, []);

  const data = crowds.values[v.chart.data], group = who.sex + who.age, value = +v.value, lab = v.chart.lab && v.chart.lab[who.sex];
  const state = !lab ? null : value < lab[0] ? 'below' : value > lab[1] ? 'above' : 'in';
  const words = { name: v.name, value: v.value, n: belowCount(data, group, value), people: data.groups[group].n, sex: CHART.groups[who.sex], group: CHART.groups[who.sex] + ' ' + CHART.ages[who.age] };
  const [before, after] = CHART.sentence.split('{count}');

  return (
    <div className="crowd">
      <p className="crowd-head">
        <span className="big">{v.value}</span> <span className="mono unit">{v.unit}</span>
        {state && <span className={'chip ' + state}><svg viewBox="0 0 16 16" aria-hidden="true"><path d={ICONS[state]} /></svg>{CHART.status[state]}</span>}
      </p>
      <p className="reading">{fill(before, words)}<b>{fill(CHART.count, words)}</b>{fill(after, words)}</p>
      <div className="who">
        <span>{CHART.who.lead}</span>
        <Segment label={CHART.who.sex} options={CHART.who.sexes} value={who.sex} onPick={sex => setWho({ ...who, sex })} />
        <span>{CHART.who.aged}</span>
        <Segment label={CHART.who.age} options={CHART.who.ageBands} value={who.age} onPick={age => setWho({ ...who, age })} />
      </div>
      {/* said aloud after a press, so a screen reader hears what the switch changed */}
      <p className="sr-only" role="status">{fill(before, words) + fill(CHART.count, words) + fill(after, words)}{state && ' ' + CHART.status[state] + '.'}</p>
      <div ref={box} className="hill">{width > 0 && <Hill v={v} who={who} width={width} />}</div>
      <p className="small mono">{fill(CHART.source.crowd, words)}{lab && ' ' + CHART.source.lab} {fill(CHART.source.robin, words)}</p>
      {v.range && <p className="small">{v.range}</p>}
    </div>
  );
}
