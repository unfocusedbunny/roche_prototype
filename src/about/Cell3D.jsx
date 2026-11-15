/*
 * The red blood cell from the prototype, in 3D, in a card: drag it to turn it.
 * It starts as a still picture. The 3D code (three.js and the Sangui scene) is only fetched when the reader asks for it,
 * and if this browser can't draw 3D the picture simply stays. The scene itself is the prototype's, unchanged:
 * this card starts it on the last scroll step and picks the purple tube, so the dive plays and lands on the cell.
 */
import { useEffect, useRef, useState } from 'react';
import { CELL } from './content.js';

const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export default function Cell3D() {
  const [state, setState] = useState('still'); /* still → loading → on, or failed */
  const [paused, setPaused] = useState(false);
  const canvas = useRef(null), overlay = useRef(null), api = useRef(null);

  useEffect(() => {
    if (state !== 'loading') { return; }
    let gone = false, scene, labels;
    Promise.all([import('../sangui/sangui-scene.js'), import('../sangui/sangui-labels.js')]).then(([s, l]) => {
      if (gone) { return; }
      scene = s.createSanguiScene({ canvas: canvas.current, overlay: overlay.current,
        onEvent(type, d) { if (type === 'frame') { labels && labels.update(d); } else if (type === 'tap') { labels.tap(d.x, d.y); } } });
      labels = l.createSanguiLabels({ root: overlay.current, scene });
      /* the cell sits in the middle of the card, where the prototype keeps it to the left of the text */
      scene.setLayout({ model: { x: .5, y: .5, rw: .2, rh: .3 } });
      scene.setScroll(6, { snap: true });
      api.current = scene; setState('on');
      /* the scene needs a frame at the last step before it lets a tube be picked */
      const tryPick = () => { if (!gone && !scene.pick(1)) { requestAnimationFrame(tryPick); } }; tryPick();
    }).catch(() => { if (!gone) { setState('failed'); } });
    return () => { gone = true; api.current = null; if (labels && labels.dispose) { labels.dispose(); } if (scene) { scene.dispose(); } };
  }, [state === 'still' || state === 'failed']);

  useEffect(() => { if (api.current) { api.current.setPaused(paused); } }, [paused, state]);

  function onKeys(e) {
    const d = ARROWS[e.key];
    if (d && api.current && e.target === e.currentTarget) { e.preventDefault(); api.current.nudge(d[0] * .2, d[1] * .2); }
  }

  const live = state === 'loading' || state === 'on';
  return (
    <figure className="cell3d">
      <div className="stage" tabIndex={live ? 0 : -1} role="group" aria-label={CELL.stage} onKeyDown={onKeys}>
        {!live && <img src={'./' + CELL.still.file} alt={CELL.still.alt} width="1408" height="880" />}
        {live && <canvas ref={canvas} role="img" aria-label={CELL.still.alt} />}
        {live && <div ref={overlay} className="overlay" />}
      </div>
      <figcaption>
        {state === 'still' && <button className="btn" onClick={() => setState('loading')}>{CELL.load}</button>}
        {live && <button className="btn" onClick={() => setPaused(!paused)}>{paused ? CELL.play : CELL.pause}</button>}
        <span>{state === 'failed' ? CELL.failed : live ? CELL.hint : CELL.note}</span>
      </figcaption>
    </figure>
  );
}
