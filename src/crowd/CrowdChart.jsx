/*
 * Sangui crowd chart: "the hill". Try a number, try a crowd.
 * Top to bottom: the number, the answer, a hint on what to do, the hill with a line at the number, the slider that moves
 * the number, the buttons that change the crowd, a line of text, the small print.
 *
 * Dragging is direct. A change of crowd glides (at once with reduced motion).
 *
 * Everything is driven by the value's entry in content.js (its starting number and `chart` settings) and by src/data/crowds.json.
 * Every word comes from content.js. Narrow columns get a narrower, slightly lower hill than the 784 px it was designed at.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import crowds from '../data/crowds.json';
import {
  scaleFor,
  hillHeights,
  belowCount,
  answerKind,
  rangeStatus,
  pastEdge,
  hillPaths,
  MORPH_MS,
  ease,
  mix,
} from './logic.js';
import { CHART, RESULTS, SHOW_GAPS } from '../content.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FULL = 784,
  PAD = 12,
  SAMPLES = 181,
  BAND_TOP = 22,
  KNOB = 28;
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
    if (
      from.target === target ||
      REDUCED ||
      from.jumpKey !== jumpKey ||
      from.glideKey === glideKey
    ) {
      return;
    }
    const t0 = performance.now();
    let id;
    const frame = () => {
      const p = Math.min(1, (performance.now() - t0) / MORPH_MS),
        e = ease(p);
      if (p >= 1) {
        setAnim(null);
        return;
      }
      setAnim({
        to: target,
        v: Object.fromEntries(
          Object.keys(target).map((k) => [k, mix(from.shown[k], target[k], e)]),
        ),
      });
      id = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(id);
  }, [target, glideKey, jumpKey]);
  useLayoutEffect(() => {
    seen.current = { target, shown, glideKey, jumpKey };
  });
  return shown;
}

function Segment({ label, options, value, onPick }) {
  return (
    <span className="seg" role="group" aria-label={label}>
      {Object.entries(options).map(([k, text]) => (
        <button key={k} type="button" aria-pressed={k === value} onClick={() => onPick(k)}>
          {text}
        </button>
      ))}
    </span>
  );
}

/* The picture: band, hill, line, axis. `value` is the number the line stands on; `label` is what the picture says to a screen reader. */
function Hill({ v, who, value, onValue, width, glideKey, label }) {
  const data = crowds.values[v.chart.data],
    group = who.sex + who.age,
    [from, to] = v.chart.window,
    range = v.chart.range && v.chart.range[who.sex];
  const s = clamp(width / FULL, 0.62, 1),
    base = BAND_TOP + 240 * s,
    perUnit = (width - 2 * PAD) / (to - from),
    dx = (width - 2 * PAD) / (SAMPLES - 1);
  const heights = useMemo(
    () => hillHeights(data, group, scaleFor(data, 215 * s), from, to, SAMPLES),
    [data, group, s, from, to],
  );
  const target = useMemo(
    () => ({ heights, lo: range ? range[0] : 0, hi: range ? range[1] : 0 }),
    [heights, range],
  );
  const m = useMorph(target, glideKey, v.key + ' ' + width);

  const x = (val) => PAD + (val - from) * perUnit,
    lineX = x(value);
  const paths = hillPaths(m.heights, PAD, dx, base, lineX);
  /* The line and its dot can be dragged, like the slider's knob. The grip keeps the distance it was picked up at, so nothing jumps. */
  const grip = useRef(0);
  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    grip.current = e.clientX - lineX;
  };
  const move = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      onValue(from + (e.clientX - grip.current - PAD) / perUnit);
    }
  };

  const lo = clamp(m.lo, from, to),
    hi = clamp(m.hi, from, to),
    edges = range
      ? [
          [m.lo, range[0]],
          [m.hi, range[1]],
        ].filter(([at]) => at >= from && at <= to)
      : [];
  /* axis numbers: whole steps, far enough apart to read, and never under one of the range's own numbers */
  const every = [1, 2, 5, 10, 20].find((st) => st * perUnit >= 34) || 50,
    ticks = [];
  for (let t = Math.ceil(from / every) * every; t <= to + 1e-9; t += every) {
    if (!edges.some(([at, text]) => Math.abs(x(at) - x(t)) < String(text).length * 4 + 14)) {
      ticks.push(t);
    }
  }
  const past = v.chart.pastNote ? pastEdge(data, group, to) : 0;

  return (
    <svg
      width={width}
      height={base + 68}
      viewBox={`0 -18 ${width} ${base + 68}`}
      role="img"
      aria-label={label}
    >
      {range && (
        <rect
          x={x(lo)}
          y={BAND_TOP}
          width={x(hi) - x(lo)}
          height={base - BAND_TOP}
          fill="var(--yellow)"
        />
      )}
      {/* the band's sides: yellow on cream is too faint to see for some people, so a thin line marks where it starts and ends */}
      <path
        className="band-edge"
        d={edges.map(([at]) => `M${x(at)} ${BAND_TOP}V${base}`).join('')}
      />
      <path className="ink" d={paths.below} style={{ fill: 'var(--red)' }} />
      <path className="ink" d={paths.above} style={{ fill: 'var(--cream)' }} />
      <path
        className="ink"
        d={`M0 ${base}H${width}` + edges.map(([at]) => `M${x(at)} ${base}v8`).join('')}
      />
      <path className="ink" d={`M${lineX} 26V${paths.lineY}`} />
      <circle
        cx={lineX}
        cy={paths.lineY}
        r="8"
        fill="var(--ink)"
        stroke="var(--cream)"
        strokeWidth="3"
      />
      {ticks.map((t) => (
        <text key={t} className="tick" x={x(t)} y={base + 26} textAnchor="middle">
          {t}
        </text>
      ))}
      {edges.map(([at, text]) => (
        <text key={text} className="edge" x={x(at)} y={base + 26} textAnchor="middle">
          {text}
        </text>
      ))}
      {range && (
        <text
          className="label"
          x={clamp((x(lo) + x(hi)) / 2, 54, width - 54)}
          y={base + 44}
          textAnchor="middle"
        >
          {CHART.range}
        </text>
      )}
      <text className="tick" x={width} y={base - 14} textAnchor="end">
        {v.unit}
      </text>
      {past > 0 && (
        <text className="label" x={width} y={base - 46} textAnchor="end">
          {fill(past === 1 ? CHART.pastOne : CHART.past, { n: past, edge: to })}
        </text>
      )}
      <text className="name" x={clamp(lineX, 20, width - 20)} y="10" textAnchor="middle">
        {CHART.line}
      </text>
      <rect
        className="grab"
        x={lineX - 22}
        y="-18"
        width="44"
        height={base + 18}
        fill="transparent"
        onPointerDown={down}
        onPointerMove={move}
      />
    </svg>
  );
}

/* The demo line: what this is, and how many people the crowd holds. It sits under the chart; the prototype also shows it at the bottom of the page. */
export function CrowdNote({ v, who, className }) {
  const people = crowds.values[v.chart.data].groups[who.sex + who.age].n;
  return (
    <p className={className}>
      {CHART.demo} {fill(CHART.source.crowd, { people, sex: CHART.groups[who.sex] })}
    </p>
  );
}

/* v: one value from content.js, with its starting number and chart settings. who: the crowd, { sex: 'm' | 'w', age: 'a' | 'b' | 'c' }. */
export default function CrowdChart({ v, who, setWho }) {
  const data = crowds.values[v.chart.data],
    [from, to] = v.chart.window;
  const digits = (String(data.step).split('.')[1] || '').length;
  const [value, setValue] = useState(+v.value);
  /* any number from the slider or from dragging the line: kept inside the window and on one of the table's steps */
  const pick = (x) =>
    setValue(
      +(from + Math.round((clamp(x, from, to) - from) / data.step) * data.step).toFixed(digits),
    );
  const box = useRef(null),
    [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setWidth(Math.min(FULL, Math.floor(box.current.clientWidth)));
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    measure();
    return () => ro.disconnect();
  }, []);

  const group = who.sex + who.age,
    range = v.chart.range && v.chart.range[who.sex],
    number = value.toFixed(digits);
  const status = range ? rangeStatus(value, range[0], range[1]) : null,
    cuts = v.chart.textCuts;
  const zone = cuts
    ? value < cuts[0] - 1e-9
      ? 'below'
      : value < cuts[1] - 1e-9
        ? 'in'
        : 'above'
    : status;
  const text =
    (v.chart.textAt && v.chart.textAt[number]) ||
    (v.chart.text && (Array.isArray(v.chart.text) ? v.chart.text : v.chart.text[zone]));
  const n = belowCount(data, group, value),
    people = CHART.groups[who.sex] + ' ' + CHART.ages[who.age];
  const lead = fill(CHART.answer[answerKind(n)], { n }),
    rest = fill(CHART.answer.rest, { group: people });

  return (
    <div className="crowd">
      <p className="value">
        <span className="big">{number}</span> <span className="mono unit">{v.unit}</span>
      </p>
      {/* role="status": said aloud after a change, so a screen reader hears what the slider or the buttons did */}
      <p className="reading" role="status">
        <b>{lead}</b> {rest}
      </p>

      <p className="try">{CHART.hint}</p>
      <div ref={box} className="hill">
        {width > 0 && (
          <>
            <Hill
              v={v}
              who={who}
              value={value}
              onValue={pick}
              width={width}
              glideKey={group}
              label={
                fill(CHART.picture, {
                  name: v.name,
                  group: people,
                  value: number,
                  unit: v.chart.unitName,
                  n,
                }) + (range ? ' ' + fill(CHART.pictureRange, { lo: range[0], hi: range[1] }) : '')
              }
            />
            {/* as wide as the axis plus one knob, so the knob's centre sits exactly under the line */}
            <input
              type="range"
              min={from}
              max={to}
              step={data.step}
              value={value}
              onChange={(e) => pick(+e.target.value)}
              aria-label={fill(CHART.slider, { name: v.name })}
              aria-valuetext={number + ' ' + v.chart.unitName}
              style={{ width: width - 2 * PAD + KNOB, marginLeft: PAD - KNOB / 2 }}
            />
          </>
        )}
      </div>
      <div className="who">
        <Segment
          label={CHART.who.sex}
          options={CHART.who.sexes}
          value={who.sex}
          onPick={(sex) => setWho((w) => ({ ...w, sex }))}
        />
        <Segment
          label={CHART.who.age}
          options={CHART.who.ageBands}
          value={who.age}
          onPick={(age) => setWho((w) => ({ ...w, age }))}
        />
      </div>
      {text ? (
        <p className="note">
          <b>{text[0]}</b> {text[1]}
        </p>
      ) : (
        SHOW_GAPS && <p className="gap mono">{RESULTS.textGap}</p>
      )}

      <CrowdNote v={v} who={who} className="small mono demo-line" />
      {range && <p className="small mono">{CHART.source.range}</p>}
      {v.chart.sources &&
        v.chart.sources.map((line) => (
          <p key={line} className="small mono">
            {line}
          </p>
        ))}
    </div>
  );
}
