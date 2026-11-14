/*
 * Sangui: the page. It owns the layout, the text and the scroll; the 3D package in ./sangui owns the canvas.
 * Scroll position drives the scene (0 to 6, one unit per screen). The scene reports back every frame,
 * and the flat parts (title page, step text) are placed from that same number, so text and 3D move together.
 */
import { useEffect, useRef, useState } from 'react';
import { createSanguiScene, TUBES as SCENE_TUBES } from './sangui/sangui-scene.js';
import { createSanguiLabels } from './sangui/sangui-labels.js';
import { createSanguiBlobs, SCROLL_BUTTON_CSS, SCROLL_BUTTON_HTML } from './sangui/sangui-blobs.js';
import CrowdChart from './crowd/CrowdChart.jsx';
import { TITLE, STEPS, TUBES, RESULTS, CONTROLS, LINKS, PRIVACY, PICTURE, PLAIN, SHOW_GAPS } from './content.js';
import { FIGMA_URL, CV_FILE } from './links.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* 0 before a, 1 after b, eased in between */
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* Who Robin is compared with, until the switch on the chart says otherwise: men aged 40 to 59 */
const WHO = { sex: 'm', age: 'b' };
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export default function App() {
  const [noGL, setNoGL] = useState(false);
  return noGL ? <PlainPage /> : <Story onNoGL={() => setNoGL(true)} />;
}

/* One value: what it is, Robin's number, and where it sits. With a number and chart settings it gets the crowd chart. */
function Value({ v, who, setWho }) {
  return (<>
    <h2>{v.name}</h2>
    <p className="body">{v.lead}{v.body && <><br />{v.body}</>}</p>
    {v.value && v.chart ? <CrowdChart v={v} who={who} setWho={setWho} /> : <ValueText v={v} />}
  </>);
}

/* A value without a chart yet: the number if there is one, and the plain sentence */
function ValueText({ v }) {
  return (<>
    {v.value ? <p className="big">{v.value} {v.unit}</p> : SHOW_GAPS && <p className="gap mono">{RESULTS.valueGap}</p>}
    {(v.value || v.crowd) && <p className="reading">
      {v.value && <>{v.value} {v.unit}{v.status && ' · ' + v.status}<br /></>}
      {v.crowd}
      {v.crowd && SHOW_GAPS && v.range && <><br />{v.range}</>}
    </p>}
    {v.crowd && SHOW_GAPS && <div className="chart gap mono">{RESULTS.chartGap}</div>}
  </>);
}

function Story({ onNoGL }) {
  const stage = useRef(null), canvas = useRef(null), overlay = useRef(null), blobCanvas = useRef(null);
  const results = useRef(null), title = useRef(null), titleText = useRef(null), slot = useRef(null), word = useRef(null), tools = useRef(null), back = useRef(null);
  const api = useRef(null);
  const [mode, setMode] = useState('scroll');
  const [tube, setTube] = useState(1);
  const [textOn, setTextOn] = useState(false);
  const [valueIdx, setValueIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [privacy, setPrivacy] = useState(false);
  const [who, setWho] = useState(WHO);

  useEffect(() => {
    const el = stage.current, blocks = [...el.querySelectorAll('[data-step]')];
    let scene, labels, lastStep = 0, geo = { dx: 0, dy: 0, s: 1 };

    /* How far the small "Sangui" in the corner is from the big one on the title page, and how much smaller */
    function measure() {
      const w = word.current, keep = w.style.transform; w.style.transform = 'none';
      const a = w.getBoundingClientRect(), b = slot.current.getBoundingClientRect(); w.style.transform = keep;
      geo = { dx: b.left - a.left, dy: b.top - a.top, s: b.height / a.height };
    }

    /* Place every flat thing for scroll position p. With reduced motion p only takes whole numbers and CSS does a plain fade. */
    function paint(p) {
      const t = REDUCED ? (p >= .5 ? 1 : 0) : sm(.05, .55, p); /* 0 on the title page, 1 once the story has started */
      el.style.setProperty('--t', t.toFixed(3));
      if (REDUCED) { title.current.classList.toggle('gone', t === 1); }
      else {
        const o = 1 - sm(.05, .5, p), k = 1 - t;
        title.current.style.opacity = o.toFixed(3); title.current.style.visibility = o > .001 ? 'visible' : 'hidden';
        titleText.current.style.opacity = (1 - sm(0, .2, p)).toFixed(3);
        word.current.style.transform = `translate(${(geo.dx * k).toFixed(1)}px,${(geo.dy * k).toFixed(1)}px) scale(${(1 + (geo.s - 1) * k).toFixed(4)})`;
        tools.current.style.opacity = sm(.45, .6, p).toFixed(3);
      }
      /* step text: each line fades in and rises a little, one after another, and the block leaves together */
      blocks.forEach(b => {
        const n = +b.dataset.step, out = n === 6 ? 0 : sm(n + .2, n + .4, p);
        for (let i = 0; i < b.children.length; i++) {
          const line = b.children[i];
          if (REDUCED) { line.style.opacity = Math.round(p) === n ? 1 : 0; continue; }
          const a = sm(n - .45 + i * .07, n - .3 + i * .07, p);
          line.style.opacity = (a * (1 - out)).toFixed(3);
          line.style.transform = `translateY(${((1 - a) * 16 - out * 16).toFixed(1)}px)`;
        }
      });
    }

    try {
      scene = createSanguiScene({ canvas: canvas.current, overlay: overlay.current,
        onEvent(type, d) {
          /* the frame object is reused by the scene every frame: read from it here, never keep it */
          if (type === 'frame') { labels && labels.update(d); paint(d.p); const s = Math.round(d.p); if (s !== lastStep) { lastStep = s; setStep(s); } }
          else if (type === 'tap') { labels.tap(d.x, d.y); }
          else if (type === 'mode') { setMode(d.mode); setTube(d.tube); }
          else if (type === 'text') { setTextOn(d.show); }
          else if (type === 'returned') { setValueIdx(0); labels.tubeButtons[d.tube].focus({ preventScroll: true }); }
        } });
    } catch (e) { onNoGL(); return; } /* no WebGL here: show the story as plain text */
    labels = createSanguiLabels({ root: overlay.current, scene });
    const blobs = createSanguiBlobs({ canvas: blobCanvas.current });
    api.current = { scene, labels, blobs };

    const onScroll = () => scene.setScroll(window.scrollY / el.clientHeight);
    const ro = new ResizeObserver(() => { measure(); onScroll(); }); ro.observe(el);
    document.fonts.ready.then(measure);
    addEventListener('scroll', onScroll, { passive: true }); measure(); onScroll();
    return () => { removeEventListener('scroll', onScroll); ro.disconnect(); labels.dispose(); blobs.dispose(); scene.dispose(); api.current = null; };
  }, []);

  /* While a tube is open the page must not scroll; the results column scrolls by itself */
  useEffect(() => {
    document.documentElement.classList.toggle('locked', mode !== 'scroll');
    if (mode === 'model' && back.current) { back.current.focus({ preventScroll: true }); }
    return () => document.documentElement.classList.remove('locked');
  }, [mode]);

  /* One pause control for everything that moves by itself */
  useEffect(() => { const a = api.current; if (a) { a.scene.setPaused(paused); a.labels.setPaused(paused); a.blobs.setPaused(paused); } }, [paused]);

  /* Purple tube: HbA1c puts sugar on the cell. A new value starts at the top of the column. */
  useEffect(() => { results.current.scrollTop = 0; if (api.current) { api.current.scene.setValue(TUBES[tube].values[valueIdx].key === 'hba1c' ? 'hba1c' : 'hemoglobin'); } }, [tube, valueIdx]);

  useEffect(() => {
    if (mode !== 'model') return;
    const onKey = e => { if (e.key === 'Escape') { api.current.scene.back(); } };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [mode]);

  const atPick = mode === 'scroll' && step >= 6;
  function skip() {
    window.scrollTo(0, 6 * stage.current.clientHeight); api.current.scene.setScroll(6, { snap: true });
    setTimeout(() => api.current && api.current.labels.tubeButtons[0].focus({ preventScroll: true }), 120);
  }
  function scrollDown() { window.scrollTo({ top: stage.current.clientHeight, behavior: REDUCED ? 'auto' : 'smooth' }); }
  function onKeys(e) {
    const d = ARROWS[e.key];
    if (d && e.target === e.currentTarget && (mode === 'model' || atPick)) { e.preventDefault(); api.current.scene.nudge(d[0] * .2, d[1] * .2); }
  }

  const picture = mode === 'scroll' ? PICTURE.steps[step] : PICTURE.models[SCENE_TUBES[tube].model];
  const t = TUBES[tube], showResults = textOn && mode !== 'returning';

  return (
    <div className="track">
      <div ref={stage} className={'stage' + (REDUCED ? ' rm' : '') + (mode !== 'scroll' ? ' dived' : '')}>
        <style>{SCROLL_BUTTON_CSS}</style>

        <div className="controls">
          {mode === 'scroll' && step < 6 && <button className="pill" onClick={skip}>{CONTROLS.skip}</button>}
          {mode === 'model' && <button ref={back} className="pill" onClick={() => api.current.scene.back()}>{RESULTS.back}</button>}
          <button className="pill" onClick={() => setPaused(!paused)}>{paused ? CONTROLS.play : CONTROLS.pause}</button>
        </div>

        <nav className="links mono" aria-label={LINKS.label}>
          <a href="./how-it-was-made/">{LINKS.about}</a> · <a href={'./' + CV_FILE}>{LINKS.cv}</a> · <a href={FIGMA_URL}>{LINKS.figma}</a>
        </nav>

        <header className="head">
          <h1 ref={word} className="word">{TITLE.name}</h1>
          <p ref={tools} className="mono tools">{TITLE.tools}</p>
        </header>

        <div ref={title} className="title">
          <canvas ref={blobCanvas} aria-hidden="true" />
          <span ref={slot} className="slot" aria-hidden="true">{TITLE.name}</span>
          <div ref={titleText} className="title-text">
            {TITLE.lines.map(l => <p key={l}>{l}</p>)}
            <button className={'sg-scroll' + (paused ? ' paused' : '')} aria-label={TITLE.scroll} onClick={scrollDown} dangerouslySetInnerHTML={{ __html: SCROLL_BUTTON_HTML }} />
          </div>
        </div>

        <div className="scene" tabIndex={0} role="group" aria-label={PICTURE.stage} onKeyDown={onKeys}>
          <canvas ref={canvas} role="img" aria-label={picture} aria-hidden={!picture} />
          <div ref={overlay} className="overlay" />
        </div>

        <div className="steps">
          {[1, 2, 3, 4].map(n => <div key={n} className={'step s' + n} data-step={n}>{STEPS[n].map(l => <p key={l}>{l}</p>)}</div>)}
          <div className="step s5" data-step="5"><p className="lead">{STEPS[5].heading}</p><p className="plain-weight">{STEPS[5].body}</p></div>
          <div className="step s6a" data-step="6"><p className="hand">{STEPS[6].prompt}</p></div>
          <div className="step s6b" data-step="6"><p>{STEPS[6].note}</p></div>
        </div>

        <section ref={results} className={'results' + (showResults ? ' on' : '')} aria-label={t.owner} tabIndex={showResults ? 0 : -1} inert={!showResults}>
          <p className="mono">{t.owner}</p>
          {t.values.length > 1 && <div className="switch" role="group" aria-label="Values in this tube">
            {t.values.map((v, i) => <button key={v.key} className="pill" aria-pressed={i === valueIdx} onClick={() => setValueIdx(i)}>{v.name}</button>)}
          </div>}
          <Value v={t.values[valueIdx]} who={who} setWho={setWho} />
          <p className="small mono">{RESULTS.aiNote}</p>
          <p className="small">{RESULTS.disclaimer}</p>
        </section>

        <div className="privacy">
          <p id="privacy-note" hidden={!privacy}>{PRIVACY.text}</p>
          <button aria-expanded={privacy} aria-controls="privacy-note" onClick={() => setPrivacy(!privacy)}>{PRIVACY.label}</button>
        </div>
      </div>
    </div>
  );
}

/* Without WebGL there is no scene to scroll through, so the same words become an ordinary page */
function PlainPage() {
  const [who, setWho] = useState(WHO);
  return (
    <main className="plain">
      <h1>{TITLE.name}</h1>
      {TITLE.lines.map(l => <p key={l}><b>{l}</b></p>)}
      <p className="mono">{PLAIN.note}</p>
      {[1, 2, 3, 4].flatMap(n => STEPS[n]).map(l => <p key={l}>{l}</p>)}
      <p><b>{STEPS[5].heading}</b> {STEPS[5].body}</p>
      <p>{STEPS[6].note}</p>
      {TUBES.map(t => t.values.map(v => <section key={v.key}><p className="mono">{t.owner}</p><Value v={v} who={who} setWho={setWho} /></section>))}
      <p className="small mono">{RESULTS.aiNote}</p>
      <p className="small">{RESULTS.disclaimer}</p>
      <p className="small">{PRIVACY.text}</p>
    </main>
  );
}
