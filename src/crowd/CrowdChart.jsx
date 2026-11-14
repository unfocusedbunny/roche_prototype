/*
 * Sangui crowd chart: "the hill". Try a number, try a crowd.
 * The crowd is one filled shape; the number is a line with a dot on it. A slider under the axis moves the number,
 * the buttons in the question change the crowd, and the split, the two counts, the answer, the status and the text all follow.
 * It starts on a made-up result.
 *
 * Dragging is direct. A change of crowd glides (at once with reduced motion).
 *
 * Everything is driven by the value's entry in content.js (its starting number and `chart` settings) and by src/data/crowds.json.
 * Every word comes from content.js. The drawing follows the prototype Mimi approved, which was 784 px wide. Narrower columns
 * get a narrower, slightly lower hill; the text keeps its size, because cream on the red only passes contrast as large text.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import crowds from '../data/crowds.json';
import { scaleFor, hillHeights, belowCount, answerKind, rangeStatus, pastEdge, hillPaths, placeCounts, MORPH_MS, ease, mix } from './logic.js';
import { CHART, RESULTS, SHOW_GAPS } from '../content.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FULL = 784, PAD = 12, SAMPLES = 181, BAND_TOP = 22, KNOB = 28;
const fill = (text, words) => text.replace(/\{(\w+)\}/g, (_, k) => words[k]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Shows `target`, gliding to it from whatever is on screen when `glideKey` changed (another crowd).
   Any other change (the slider, another value, another width: `jumpKey`) shows at once. */
function useMorph(target, glideKey, jumpKey) {
  const [anim, setAnim] = useState(null);
  const shown = anim && anim.to === target ? anim.v : target;
  const seen = useRef({ target, shown, glideKey, jumpKey });
  useLayoutEffect(() => {
    const from = seen.current;
    if (from.target === target || REDUCED || from.jumpKey !== jumpKey || from.glideKey === glideKey) { return; }
    const t0 = performance.now(); let id;
    const frame = () => {
      const p = Math.min(1, (performance.now() - t0) / MORPH_MS), e = ease(p);
      if (p >= 1) { setAnim(null); return; }
      setAnim({ to: target, v: Object.fromEntries(Object.keys(target).map(k => [k, mix(from.shown[k], target[k], e)])) });
      id = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(id);
  }, [target]);
  useLayoutEffect(() => { seen.current = { target, shown, glideKey, jumpKey }; });
  return shown;
}

function Segment({ label, options, value, onPick }) {
  return (
    <span className="seg" role="group" aria-label={label}>
      {Object.entries(options).map(([k, text]) => <button key={k} type="button" aria-pressed={k === value} onClick={() => onPick(k)}>{text}</button>)}
    </span>
  );
}

/* The picture: band, hill, line, counts, axis. `value` is the number the line stands on; `words` fill the description. */
function Hill({ v, who, value, width, glideKey, words }) {
  const data = crowds.values[v.chart.data], group = who.sex + who.age, [from, to] = v.chart.window, range = v.chart.range && v.chart.range[who.sex];
  const s = clamp(width / FULL, .62, 1), base = BAND_TOP + 240 * s, perUnit = (width - 2 * PAD) / (to - from), dx = (width - 2 * PAD) / (SAMPLES - 1);
  const heights = useMemo(() => hillHeights(data, group, scaleFor(data, 215 * s), from, to, SAMPLES), [data, group, s, from, to]);
  const target = useMemo(() => ({ heights, lo: range ? range[0] : 0, hi: range ? range[1] : 0, below: belowCount(data, group, value) }), [heights, value]);
  const m = useMorph(target, glideKey, v.key + ' ' + width);

  const x = (val) => PAD + (val - from) * perUnit, lineX = x(value);
  const paths = hillPaths(m.heights, PAD, dx, base, lineX), below = Math.round(m.below);
  const counts = placeCounts(m.heights, PAD, dx, lineX, width, { insideTop: base - 58 });
  /* The name on the line, kept inside the picture. Its width is judged from its length, since the wording is Mimi's to change. */
  const name = CHART.robin.name, nameX = clamp(lineX, 36, width - 36), nameHalf = name.length * 5 + 2;
  /* A count that doesn't fit inside its half of the hill sits beside the line, on its own side while its digits fit there
     (60 px from the line, closer near the picture's edge), otherwise on the other side. It stays at the prototype's height
     unless the hill under it is taller than that: then it sits just above the hill, and moves sideways clear of the name. */
  const place = (c, n, side) => {
    if (c.inside) { return { x: c.left + 50, y: c.top + 33 }; }
    const half = String(n).length * 11.5 + 1, room = (d) => (d < 0 ? lineX : width - lineX), dir = room(side) >= 2 * half + 12 ? side : -side;
    let at = lineX + dir * Math.min(60, room(dir) - half), top = c.top;
    for (let pass = 0; pass < 3; pass++) {
      at += Math.sign(at - nameX) * Math.max(0, nameHalf + half + 4 - Math.abs(at - nameX)) * clamp((30 - top) / 10, 0, 1);
      let tall = 0;
      m.heights.forEach((h, k) => { if (Math.abs(PAD + k * dx - at) <= half + 8 && h > tall) { tall = h; } });
      top = Math.min(top, base - tall - 44);
    }
    return { x: at, y: top + 33, dir, out: at - half < 0 || at + half > width };
  };
  const b = place(counts.below, below, -1), a = place(counts.above, 100 - below, 1);
  /* On a very narrow chart both counts can end up beside the line on the same side: then only the one that belongs there is drawn.
     And a count that would have to leave the picture is left out. The answer above the chart always says the number. */
  const clash = b.dir && b.dir === a.dir, showB = !b.out && !(clash && b.dir > 0), showA = !a.out && !(clash && a.dir < 0);

  const lo = clamp(m.lo, from, to), hi = clamp(m.hi, from, to), edges = range ? [[m.lo, range[0]], [m.hi, range[1]]].filter(([at]) => at >= from && at <= to) : [];
  /* axis numbers: whole steps, far enough apart to read, and never under one of the range's own numbers */
  const every = [1, 2, 5, 10, 20].find(st => st * perUnit >= 34) || 50, ticks = [];
  for (let t = Math.ceil(from / every) * every; t <= to + 1e-9; t += every) { if (!edges.some(([at, text]) => Math.abs(x(at) - x(t)) < String(text).length * 4 + 14)) { ticks.push(t); } }
  const past = to < data.axis.max ? pastEdge(data, group, to) : 0;

  return (
    <svg width={width} height={base + 68} viewBox={`0 -18 ${width} ${base + 68}`} role="img"
      aria-label={fill(CHART.picture, { ...words, n: target.below }) + (range ? ' ' + fill(CHART.pictureRange, { lo: range[0], hi: range[1] }) : '')}>
      {range && <rect x={x(lo)} y={BAND_TOP} width={x(hi) - x(lo)} height={base - BAND_TOP} fill="var(--yellow)" />}
      <path className="ink" d={paths.below} style={{ fill: 'var(--red)' }} />
      <path className="ink" d={paths.above} style={{ fill: 'var(--cream)' }} />
      <path className="ink" d={`M0 ${base}H${width}` + edges.map(([at]) => `M${x(at)} ${base}v8`).join('')} />
      <path className="ink" d={`M${lineX} 26V${paths.lineY}`} />
      <circle cx={lineX} cy={paths.lineY} r="8" fill="var(--ink)" stroke="var(--cream)" strokeWidth="3" />
      {ticks.map(t => <text key={t} className="tick" x={x(t)} y={base + 26} textAnchor="middle">{t}</text>)}
      {edges.map(([at, text]) => <text key={text} className="edge" x={x(at)} y={base + 26} textAnchor="middle">{text}</text>)}
      {range && <text className="label" x={clamp((x(lo) + x(hi)) / 2, 54, width - 54)} y={base + 44} textAnchor="middle">{CHART.range}</text>}
      <text className="tick" x={width} y={base - 14} textAnchor="end">{v.unit}</text>
      {past > 0 && <text className="label" x={width} y={base - 46} textAnchor="end">{fill(CHART.past, { n: past, edge: to })}</text>}
      <text className="name" x={nameX} y="10" textAnchor="middle">{name}</text>
      {showB && <text className={'count' + (counts.below.inside ? ' on-red' : '')} x={b.x} y={b.y} textAnchor="middle">{below}</text>}
      {showA && <text className="count" x={a.x} y={a.y} textAnchor="middle">{100 - below}</text>}
    </svg>
  );
}

/* v: one value from content.js, with its starting number and chart settings. who: the crowd, { sex: 'm' | 'w', age: 'a' | 'b' | 'c' }. */
export default function CrowdChart({ v, who, setWho }) {
  const data = crowds.values[v.chart.data], [from, to] = v.chart.window;
  const digits = (String(data.step).split('.')[1] || '').length;
  const [value, setValue] = useState(+v.value);
  const box = useRef(null), [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setWidth(Math.min(FULL, Math.floor(box.current.clientWidth)));
    const ro = new ResizeObserver(measure); ro.observe(box.current); measure();
    return () => ro.disconnect();
  }, []);

  const group = who.sex + who.age, range = v.chart.range && v.chart.range[who.sex], number = value.toFixed(digits);
  const status = range ? rangeStatus(value, range[0], range[1]) : null, cuts = v.chart.textCuts;
  const zone = cuts ? (value < cuts[0] - 1e-9 ? 'below' : value < cuts[1] - 1e-9 ? 'in' : 'above') : status;
  const text = v.chart.text && (Array.isArray(v.chart.text) ? v.chart.text : v.chart.text[zone]);
  const n = belowCount(data, group, value), people = CHART.groups[who.sex] + ' ' + CHART.ages[who.age];
  const lead = fill(CHART.answer[answerKind(n)], { n }), rest = fill(CHART.answer.rest, { group: people });

  return (
    <div className="crowd">
      <p className="ask">
        <span>{fill(CHART.ask.lead, { asked: v.chart.asked })}</span>
        <span className="big">{number}</span> <span className="mono unit">{v.unit}</span>
        {status && <span className={'chip ' + status}>{status === 'in' && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" /></svg>}{CHART.status[status]}</span>}
      </p>
      <div className="who">
        <span>{CHART.ask.mid}</span>
        <Segment label={CHART.ask.sex} options={CHART.ask.sexes} value={who.sex} onPick={sex => setWho(w => ({ ...w, sex }))} />
        <span>{CHART.ask.aged}</span>
        <Segment label={CHART.ask.age} options={CHART.ask.ageBands} value={who.age} onPick={age => setWho(w => ({ ...w, age }))} />
        <span>{CHART.ask.end}</span>
      </div>
      <p className="reading"><b>{lead}</b> {rest}</p>
      {/* said aloud after a change, so a screen reader hears what the slider or the buttons did */}
      <p className="sr-only" role="status">{lead + ' ' + rest}{status && ' ' + CHART.status[status] + '.'}</p>

      <div ref={box} className="hill">
        {width > 0 && <>
          <Hill v={v} who={who} value={value} width={width} glideKey={group}
            words={{ name: v.name, group: people, value: number, unit: v.chart.unitName }} />
          {/* as wide as the axis plus one knob, so the knob's centre sits exactly under the line */}
          <input type="range" min={from} max={to} step={data.step} value={value} onChange={e => setValue(+(+e.target.value).toFixed(digits))}
            aria-label={fill(CHART.slider, { name: v.name })} aria-valuetext={number + ' ' + v.chart.unitName}
            style={{ width: width - 2 * PAD + KNOB, marginLeft: PAD - KNOB / 2 }} />
        </>}
      </div>
      <p className="try mono">{CHART.robin.hint}</p>

      {text ? <p className="note"><b>{text[0]}</b> {text[1]}</p> : SHOW_GAPS && <p className="gap mono">{RESULTS.textGap}</p>}
      <p className="small mono">{CHART.demo} {fill(CHART.source.crowd, { people: data.groups[group].n, sex: CHART.groups[who.sex] })}{range && ' ' + CHART.source.range}</p>
    </div>
  );
}
