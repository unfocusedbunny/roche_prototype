/*
 * Sangui: the page. It owns the layout, the text and the scroll; the 3D package in ./sangui owns the canvas.
 * Scroll position drives the scene (0 to 6, one unit per screen). The scene reports back every frame,
 * and the flat parts (title page, step text) are placed from that same number, so text and 3D move together.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSanguiScene, LAYOUTS, TUBES as SCENE_TUBES } from './sangui/sangui-scene.js';
import { createSanguiLabels } from './sangui/sangui-labels.js';
import { createSanguiBlobs, SCROLL_BUTTON_CSS, SCROLL_BUTTON_HTML } from './sangui/sangui-blobs.js';
import CrowdChart, { CrowdNote } from './crowd/CrowdChart.jsx';
import {
  TITLE,
  STEPS,
  TUBES,
  LABELS,
  RESULTS,
  CHART,
  CONTROLS,
  LINKS,
  PRIVACY,
  PICTURE,
  PLAIN,
  SHOW_GAPS,
} from './content.js';
import { FIGMA_URL, CV_FILE } from './links.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* 0 before a, 1 after b, eased in between */
const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/* Where the page puts the 3D, as fractions of the stage (see LAYOUTS in the scene for what each number means).
   Each entry is complete, so switching from one to another (turning a phone, resizing a window) leaves nothing behind.
     wide   the scene's own wide layout, with the three tubes a little smaller and higher so the text under them has room
     low    a low window, such as a laptop zoomed to 200%: the model sits higher and smaller, clear of the buttons below
   Upright screens (phones) have no fixed entry: phonePlacing() works theirs out from the room the text leaves. */
const WIDE = {
  tubeH: 0.46,
  tubeY: 0.48,
  tubeX: LAYOUTS.wide.tubeX,
  rack: LAYOUTS.wide.rack,
  sheet: LAYOUTS.wide.sheet,
  model: LAYOUTS.wide.model,
};
const PLACING = {
  wide: WIDE,
  /* low screens (a laptop at 200% zoom): on the last step the tubes stay left of centre, so "Pick one" and its note fit beside them */
  low: {
    ...WIDE,
    model: { x: 0.27, y: 0.44, rw: 0.15, rh: 0.24 },
    tubeX: [...LAYOUTS.wide.tubeX.slice(0, 4), [0.2, 0.37, 0.54]],
  },
};

/* On a phone, as on wide screens, the tubes step to the left while the results sheet arrives beside them (steps 3 and 4) */
const PHONE_TUBE_X = [
  [0.24, 0.5, 0.76],
  [0.14, 0.37, 0.6],
  [0.14, 0.37, 0.6],
  [0.24, 0.5, 0.76],
  [0.24, 0.5, 0.76],
];
/* Upright screens, top to bottom: the wordmark and links, the 3D, the step's text, the privacy note, the buttons.
   The text's height changes with the screen's width, so the 3D takes whatever room is left above it.
   The numbers are px and go with the phone rules at the end of app.css. Returns the scene's layout and, for the
   results sheet, how far below the top row the model with its caption and note ends. */
/* How wide a step's text is at its longest line. A paragraph that runs over several lines is always as wide as the
   room it is given, so this is measured line by line. */
function longestLine(block) {
  let longest = 0;
  for (const paragraph of block.children) {
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    /* a line with a bold phrase in it comes back in pieces: join the pieces that share a line */
    const lines = [];
    for (const piece of range.getClientRects()) {
      const line = lines.find((l) => Math.abs(l.top - piece.top) < 6);
      if (line) {
        line.left = Math.min(line.left, piece.left);
        line.right = Math.max(line.right, piece.right);
      } else {
        lines.push({ top: piece.top, left: piece.left, right: piece.right });
      }
    }
    for (const line of lines) {
      longest = Math.max(longest, line.right - line.left);
    }
  }
  return longest;
}

function phonePlacing(stage) {
  /* each step's column is made as wide as its longest line (see the phone rules in app.css): first let the text run
     free, then measure, then set the width */
  const columns = [...stage.querySelectorAll('.s1, .s2, .s3, .s4, .s5, .s6b')];
  columns.forEach((block) => block.style.removeProperty('--col'));
  columns.forEach((block) =>
    block.style.setProperty('--col', Math.ceil(longestLine(block)) + 1 + 'px'),
  );
  const W = stage.clientWidth,
    H = stage.clientHeight,
    phone = W <= 640;
  const TOP_ROW = phone ? 56 : H * 0.12, // where the wordmark and the links end
    /* the step text ends this far above the bottom edge: 108 px for the two rows under it, plus the most the browser's
       bars can cover (the stage is as tall as the screen without them; .svh is as tall as the screen with them) */
    TEXT_BOTTOM = 108 + Math.max(0, H - (stage.querySelector('.svh')?.offsetHeight ?? H)),
    PICK = 48, // "Pick one", above the tubes on the last step
    CAPTIONS = 64, // the tubes' names under them, up to three lines
    GAP = 8;
  /* how tall a step's text is, from its first line to its last (the block itself is as tall as the room it sits in) */
  const tallest = (selector) =>
    Math.max(
      0,
      ...[...stage.querySelectorAll(selector)].map((block) => {
        const first = block.firstElementChild,
          last = block.lastElementChild;
        return first ? last.offsetTop + last.offsetHeight - first.offsetTop : 0;
      }),
    );
  /* Under the 3D, each text gets a room of its own height plus AIR above and below, so that even with the browser's
     bars showing it does not touch the 3D or the privacy note. With the bars hidden the room is taller and the text
     sits in its middle. Step 1's room starts under the rack; the room of steps 2 to 6 fits the longest of them. */
  const AIR = 14;
  const text1Top = H - TEXT_BOTTOM - tallest('.s1') - 2 * AIR,
    textTop = H - TEXT_BOTTOM - tallest('.s2, .s3, .s4, .s5, .s6b') - 2 * AIR;
  /* the rack: between the top row and step 1's text */
  const rackBottom = text1Top - GAP;
  /* the tubes: under "Pick one", above their captions and the text of steps 2 to 6 */
  const tubesTop = TOP_ROW + PICK,
    tubesBottom = textTop - CAPTIONS;
  const tubeH = Math.min(0.34, Math.max(0.16, (tubesBottom - tubesTop) / H)),
    tubeY = (tubesTop + tubesBottom) / 2 / H;
  /* the model: just under the top row, as big as the width allows */
  const modelTop = TOP_ROW + 20,
    r = Math.min(W * 0.27, H * 0.13);
  return {
    layout: {
      tubeH,
      tubeY,
      tubeX: PHONE_TUBE_X,
      rack: {
        x: 0.5,
        y: (TOP_ROW + rackBottom) / 2 / H,
        w: 0.9,
        h: ((rackBottom - TOP_ROW) / H) * 0.86,
      },
      sheet: [
        { x: 0.82, y: tubeY, h: tubeH * 0.5 },
        { x: 0.8, y: tubeY + 0.03, h: tubeH * 0.41 },
      ],
      model: { x: 0.5, y: (modelTop + r) / H, rw: 0.27, rh: 0.13 },
    },
    /* where the room for the text starts: under the rack for step 1, under the tubes' names for steps 2 to 6 */
    text1Top,
    textTop,
    sheetTop: TOP_ROW,
    /* 85 px under the model for its caption and its note */
    sheetGap: modelTop + 2 * r + 85 - TOP_ROW,
  };
}

export default function App() {
  const [noGL, setNoGL] = useState(false);
  const onNoGL = useCallback(() => setNoGL(true), []);
  return noGL ? <PlainPage /> : <Story onNoGL={onNoGL} />;
}

/* One value: what it is, and its crowd chart. Without a starting number there is no chart, only a note that it is to come. */
function Value({ v, who, setWho }) {
  return (
    <>
      <h2>{v.name}</h2>
      <p className="body">
        {v.lead}
        {v.body && (
          <>
            <br />
            {v.body}
          </>
        )}
      </p>
      {v.value && v.chart ? (
        <CrowdChart key={v.key} v={v} who={who} setWho={setWho} />
      ) : (
        SHOW_GAPS && <p className="gap mono">{RESULTS.valueGap}</p>
      )}
    </>
  );
}

/* One tube in a single colour: the cap, the glass and the blood. The air between cap and blood shows the page through. */
function TubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="1.5" width="12" height="5" rx="1.8" fill="currentColor" />
      <path
        d="M8.4 6.5v11a3.6 3.6 0 0 0 7.2 0v-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8.4 11.5h7.2v6a3.6 3.6 0 0 1-7.2 0z" fill="currentColor" />
    </svg>
  );
}

function Story({ onNoGL }) {
  const stage = useRef(null),
    canvas = useRef(null),
    overlay = useRef(null),
    blobCanvas = useRef(null);
  const results = useRef(null),
    title = useRef(null),
    titleText = useRef(null),
    slot = useRef(null),
    word = useRef(null),
    tools = useRef(null),
    back = useRef(null);
  const api = useRef(null);
  const [mode, setMode] = useState('scroll');
  const [tube, setTube] = useState(1);
  const [textOn, setTextOn] = useState(false);
  const [valueIdx, setValueIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [privacy, setPrivacy] = useState(false);
  /* phones: the result card is down, where it starts, and has not been pulled up yet */
  const [sheetDown, setSheetDown] = useState(true);
  const [who, setWho] = useState(
    CHART.startCrowd,
  ); /* the crowd picked on a chart; it stays when you move to another value */

  useEffect(() => {
    const el = stage.current,
      blocks = [...el.querySelectorAll('[data-step]')];
    let alive = true,
      scene,
      labels,
      lastStep = 0,
      geo = { dx: 0, dy: 0, s: 1 };

    /* How far the small "Sangui" in the corner is from the big one on the title page, and how much smaller */
    function measure() {
      const w = word.current,
        keep = w.style.transform;
      w.style.transform = 'none';
      const a = w.getBoundingClientRect(),
        b = slot.current.getBoundingClientRect();
      w.style.transform = keep;
      geo = { dx: b.left - a.left, dy: b.top - a.top, s: b.height / a.height };
    }

    /* Place every flat thing for scroll position p. With reduced motion p only takes whole numbers and CSS does a plain fade. */
    function paint(p) {
      const t = REDUCED
        ? p >= 0.5
          ? 1
          : 0
        : sm(0.05, 0.55, p); /* 0 on the title page, 1 once the story has started */
      el.style.setProperty('--t', t.toFixed(3));
      if (REDUCED) {
        title.current.classList.toggle('gone', t === 1);
      } else {
        const o = 1 - sm(0.05, 0.5, p),
          k = 1 - t;
        title.current.style.opacity = o.toFixed(3);
        title.current.style.visibility = o > 0.001 ? 'visible' : 'hidden';
        titleText.current.style.opacity = (1 - sm(0, 0.2, p)).toFixed(3);
        word.current.style.transform = `translate(${(geo.dx * k).toFixed(1)}px,${(geo.dy * k).toFixed(1)}px) scale(${(1 + (geo.s - 1) * k).toFixed(4)})`;
        tools.current.style.opacity = sm(0.45, 0.6, p).toFixed(3);
      }
      /* step text: each line fades in and rises a little, one after another, and the block leaves together */
      blocks.forEach((b) => {
        const n = +b.dataset.step,
          out = n === 6 ? 0 : sm(n + 0.2, n + 0.4, p);
        for (let i = 0; i < b.children.length; i++) {
          const line = b.children[i];
          if (REDUCED) {
            line.style.opacity = Math.round(p) === n ? 1 : 0;
            continue;
          }
          const a = sm(n - 0.45 + i * 0.07, n - 0.3 + i * 0.07, p);
          line.style.opacity = (a * (1 - out)).toFixed(3);
          line.style.transform = `translateY(${((1 - a) * 16 - out * 16).toFixed(1)}px)`;
        }
      });
    }

    try {
      scene = createSanguiScene({
        canvas: canvas.current,
        overlay: overlay.current,
        onEvent(type, d) {
          /* the frame object is reused by the scene every frame: read from it here, never keep it */
          if (type === 'frame') {
            labels && labels.update(d);
            paint(d.p);
            const s = Math.round(d.p);
            if (s !== lastStep) {
              lastStep = s;
              setStep(s);
            }
          } else if (type === 'tap') {
            labels.tap(d.x, d.y);
          } else if (type === 'mode') {
            setMode(d.mode);
            setTube(d.tube);
          } else if (type === 'text') {
            setTextOn(d.show);
          } else if (type === 'returned') {
            setValueIdx(0);
            /* the tube's caption is hidden during the dive and comes back with this frame, so focus waits for the next one */
            const button = labels.tubeButtons[d.tube];
            requestAnimationFrame(() => button.focus({ preventScroll: true }));
          }
        },
      });
    } catch {
      onNoGL();
      return;
    } /* no WebGL here: show the story as plain text */
    labels = createSanguiLabels({ root: overlay.current, scene, text: LABELS });
    const blobs = createSanguiBlobs({ canvas: blobCanvas.current });
    api.current = { scene, labels, blobs };

    /* a window with no height (a hidden pane, say) would make this 0 / 0 and stall the scene for good; the resize observer calls again once there is a height */
    const onScroll = () => {
      if (el.clientHeight) {
        scene.setScroll(window.scrollY / el.clientHeight);
      }
    };
    /* Pick the placing that fits this screen. The scene switches between its wide and narrow layouts at the same ratio.
       On a phone the page is also told where the results sheet starts (see .results in app.css). */
    const fit = () => {
      if (!alive || !el.clientHeight) {
        return;
      }
      if (el.clientWidth / el.clientHeight < 0.9) {
        const phone = phonePlacing(el);
        scene.setLayout(phone.layout);
        el.style.setProperty('--text-top', Math.round(phone.textTop) + 'px');
        el.style.setProperty('--text-top-1', Math.round(phone.text1Top) + 'px');
        el.style.setProperty('--sheet-top', Math.round(phone.sheetTop) + 'px');
        el.style.setProperty('--sheet-gap', Math.round(phone.sheetGap) + 'px');
      } else {
        scene.setLayout(el.clientHeight < 561 ? PLACING.low : PLACING.wide);
      }
    };
    const ro = new ResizeObserver(() => {
      fit();
      measure();
      onScroll();
    });
    ro.observe(el);
    /* once the fonts are in, the text has its real size: measure again */
    document.fonts.ready.then(() => {
      if (alive) {
        measure();
        fit();
      }
    });
    addEventListener('scroll', onScroll, { passive: true });
    measure();
    onScroll();
    return () => {
      alive = false;
      removeEventListener('scroll', onScroll);
      ro.disconnect();
      labels.dispose();
      blobs.dispose();
      scene.dispose();
      api.current = null;
    };
  }, [onNoGL]);

  /* While a tube is open the page must not scroll; the results column scrolls by itself */
  useEffect(() => {
    document.documentElement.classList.toggle('locked', mode !== 'scroll');
    if (mode === 'model' && back.current) {
      back.current.focus({ preventScroll: true });
    }
    return () => document.documentElement.classList.remove('locked');
  }, [mode]);

  /* One pause control for everything that moves by itself */
  useEffect(() => {
    const a = api.current;
    if (a) {
      a.scene.setPaused(paused);
      a.labels.setPaused(paused);
      a.blobs.setPaused(paused);
    }
  }, [paused]);

  /* Purple tube: HbA1c puts sugar on the cell. A new value starts at the top of the column. */
  useEffect(() => {
    results.current.scrollTop = 0;
    if (api.current) {
      api.current.scene.setValue(
        TUBES[tube].values[valueIdx].key === 'hba1c' ? 'hba1c' : 'hemoglobin',
      );
    }
  }, [tube, valueIdx]);

  useEffect(() => {
    if (mode !== 'model') return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        api.current.scene.back();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [mode]);

  const atPick = mode === 'scroll' && step >= 6;
  function skip() {
    window.scrollTo(0, 6 * stage.current.clientHeight);
    api.current.scene.setScroll(6, { snap: true });
    setTimeout(
      () => api.current && api.current.labels.tubeButtons[0].focus({ preventScroll: true }),
      120,
    );
  }
  /* The V on the title page: it glides to the first step slowly enough for the rack's arrival to play, about two seconds.
     Anything the reader does to scroll stops it. With reduced motion it jumps. */
  const glide = useRef(0);
  useEffect(() => () => cancelAnimationFrame(glide.current), []);
  function scrollDown() {
    const from = window.scrollY,
      to = stage.current.clientHeight;
    if (REDUCED) {
      window.scrollTo(0, to);
      return;
    }
    const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const stop = () => {
      cancelAnimationFrame(glide.current);
      inputs.forEach((name) => removeEventListener(name, stop));
    };
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / 2200);
      window.scrollTo(0, from + (to - from) * p * p * (3 - 2 * p));
      if (p < 1) {
        glide.current = requestAnimationFrame(frame);
      } else {
        stop();
      }
    };
    stop();
    inputs.forEach((name) => addEventListener(name, stop, { passive: true }));
    glide.current = requestAnimationFrame(frame);
  }
  function onKeys(e) {
    const d = ARROWS[e.key];
    if (d && e.target === e.currentTarget && (mode === 'model' || atPick)) {
      e.preventDefault();
      api.current.scene.nudge(d[0] * 0.2, d[1] * 0.2);
    }
  }

  const picture = mode === 'scroll' ? PICTURE.steps[step] : PICTURE.models[SCENE_TUBES[tube].model];
  const t = TUBES[tube],
    showResults = textOn && mode !== 'returning';

  /* On a phone the result is a card under the model that is pulled up as one piece (see .results in app.css). While it
     is down, at the very start of its travel, the model above it can be turned; once it has moved, a drag anywhere
     moves the card. Each time a result opens, the card starts down. */
  useEffect(() => {
    const el = results.current;
    const onScroll = () => setSheetDown(el.scrollTop < 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (showResults) {
      results.current.scrollTop = 0;
    }
  }, [showResults]);

  /* A nudge: shortly after a result opens, the column slides down a little and back, once, to show there is more below.
     Not with reduced or paused motion, and it stops the moment the reader does anything in the column or pauses motion.
     `nudged` keeps it to once per result, so taking the pause off again does not play it a second time. */
  const nudged = useRef(false);
  useEffect(() => {
    const el = results.current;
    if (!showResults) {
      nudged.current = false;
      return;
    }
    if (REDUCED || paused || nudged.current) {
      return;
    }
    let frame, t0;
    const step = (now) => {
      t0 ??= now;
      const p = Math.min(1, (now - t0) / 1200);
      el.scrollTop = 64 * Math.sin(Math.PI * p) ** 2;
      if (p < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    const timer = setTimeout(() => {
      nudged.current = true;
      if (el.scrollTop === 0 && el.scrollHeight > el.clientHeight + 64) {
        frame = requestAnimationFrame(step);
      }
    }, 900);
    const stop = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    events.forEach((e) => el.addEventListener(e, stop, { passive: true }));
    return () => {
      stop();
      events.forEach((e) => el.removeEventListener(e, stop));
    };
  }, [showResults, paused]);

  return (
    <main className="track">
      <div
        ref={stage}
        className={
          'stage' +
          (REDUCED ? ' rm' : '') +
          (mode !== 'scroll' ? ' dived' : '') +
          (sheetDown ? ' sheet-down' : '')
        }
      >
        <style>{SCROLL_BUTTON_CSS}</style>
        <div className="svh" aria-hidden="true" />

        <div className="controls">
          {/* icons only: each button keeps its words as its name for screen readers, and shows them in a small label on hover and on keyboard focus */}
          {mode === 'scroll' && step < 6 && (
            <button
              className="icon"
              aria-label={CONTROLS.skip}
              data-tip={CONTROLS.skip}
              onClick={skip}
            >
              <TubeIcon />
            </button>
          )}
          {mode === 'model' && (
            <button
              ref={back}
              className="icon"
              aria-label={RESULTS.back}
              data-tip={RESULTS.back}
              onClick={() => api.current.scene.back()}
            >
              <TubeIcon />
            </button>
          )}
          <button
            className="icon"
            aria-label={paused ? CONTROLS.play : CONTROLS.pause}
            data-tip={paused ? CONTROLS.play : CONTROLS.pause}
            onClick={() => setPaused(!paused)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {paused ? (
                <path
                  d="M8 5.5 19 12 8 18.5Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M3.5 5.5a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v13a2.5 2.5 0 0 1-2.5 2.5h-2a2.5 2.5 0 0 1-2.5-2.5zm10 0a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v13a2.5 2.5 0 0 1-2.5 2.5h-2a2.5 2.5 0 0 1-2.5-2.5z"
                  fill="currentColor"
                />
              )}
            </svg>
          </button>
        </div>

        {/* icons only, like the two buttons below: the words are each link's name and its hover label */}
        <nav className="links" aria-label={LINKS.label}>
          <a
            className="icon"
            href="./how-it-was-made/"
            aria-label={LINKS.about}
            data-tip={LINKS.about}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.6a1.900 1.900 0 1 1 0 3.800 1.900 1.900 0 0 1 0-3.800zM10.200 11h3.600v7.400h-3.600z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </a>
          <a className="icon" href={'./' + CV_FILE} aria-label={LINKS.cv} data-tip={LINKS.cv}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6.5 2h11A2.500 2.500 0 0 1 20 4.500v15a2.500 2.500 0 0 1-2.500 2.500h-11A2.500 2.500 0 0 1 4 19.500v-15A2.500 2.500 0 0 1 6.500 2zM12 6a2.600 2.600 0 1 0 0 5.200A2.600 2.600 0 0 0 12 6zM7.500 17.500h9c0-2.800-2-4.500-4.500-4.500s-4.500 1.700-4.500 4.500z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </a>
          <a className="icon" href={FIGMA_URL} aria-label={LINKS.figma} data-tip={LINKS.figma}>
            {/* Figma's mark in one colour, its five shapes a hair apart */}
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M11.6 1.900H8.800a3.200 3.200 0 0 0 0 6.400h2.800z" />
              <path d="M12.400 1.900h2.800a3.200 3.200 0 0 1 0 6.400h-2.800z" />
              <path d="M11.600 9.100H8.800a3.200 3.200 0 0 0 0 6.400h2.800z" />
              <circle cx="15.400" cy="12.300" r="3.200" />
              <path d="M8.800 16.300h2.800v2.800a3.200 3.200 0 1 1-2.800-2.800z" />
            </svg>
          </a>
        </nav>

        <header className="head">
          <h1 ref={word} className="word">
            {TITLE.name}
          </h1>
          <p ref={tools} className="mono tools">
            {TITLE.tools}
          </p>
        </header>

        <div ref={title} className="title">
          <canvas ref={blobCanvas} aria-hidden="true" />
          <span ref={slot} className="slot" aria-hidden="true">
            {TITLE.name}
          </span>
          <div ref={titleText} className="title-text">
            {/* a "·" stays with the word before it, so a line never starts with one */}
            {TITLE.lines.map((l) => (
              <p key={l}>{l.replaceAll(' · ', '\u00A0· ')}</p>
            ))}
            <button
              className={'sg-scroll' + (paused ? ' paused' : '')}
              aria-label={TITLE.scroll}
              onClick={scrollDown}
              dangerouslySetInnerHTML={{ __html: SCROLL_BUTTON_HTML }}
            />
          </div>
        </div>

        <div
          className="scene"
          tabIndex={mode === 'model' || atPick ? 0 : -1}
          role="group"
          aria-label={PICTURE.stage}
          onKeyDown={onKeys}
        >
          <canvas ref={canvas} role="img" aria-label={picture} aria-hidden={!picture} />
          <div ref={overlay} className="overlay" />
        </div>

        <div className="steps">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={'step s' + n} data-step={n}>
              {STEPS[n].map((l) => (
                <p key={l}>{l}</p>
              ))}
              {STEPS.small[n] && <p className="fine">{STEPS.small[n]}</p>}
            </div>
          ))}
          <div className="step s5" data-step="5">
            <p className="lead">{STEPS[5].heading}</p>
            <p className="plain-weight">{STEPS[5].body}</p>
          </div>
          <div className="step s6a" data-step="6">
            <p className="hand">{STEPS[6].prompt}</p>
          </div>
          <div className="step s6b" data-step="6">
            <p>
              {STEPS[6].note[0]}
              <b>{STEPS[6].note[1]}</b>
              {STEPS[6].note[2]}
            </p>
          </div>
        </div>

        <section
          ref={results}
          className={'results' + (showResults ? ' on' : '')}
          aria-label={t.owner}
          tabIndex={showResults ? 0 : -1}
          inert={!showResults}
        >
          <div className="sheet">
            <p className="mono">{t.owner}</p>
            {t.values.length > 1 && (
              <div className="switch" role="group" aria-label={RESULTS.values}>
                {t.values.map((v, i) => (
                  <button
                    key={v.key}
                    className="pill"
                    aria-pressed={i === valueIdx}
                    onClick={() => setValueIdx(i)}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
            <Value v={t.values[valueIdx]} who={who} setWho={setWho} />
            {/* where to go next: the case study first, then the CV and the Figma file */}
            <p className="next">
              <a href="./how-it-was-made/">
                {LINKS.made} <span aria-hidden="true">→</span>
              </a>
              <span className="more">
                <a href={'./' + CV_FILE}>{LINKS.cv}</a> · <a href={FIGMA_URL}>{LINKS.figma}</a>
              </span>
            </p>
          </div>
        </section>
        {/* said aloud when a result opens or the value is switched, so a screen reader user knows what is now on screen */}
        <p className="sr-only" role="status">
          {showResults ? RESULTS.opened.replace('{name}', t.values[valueIdx].name) : ''}
        </p>
        {/* the demo line, in the middle of the page's bottom edge while a result is open (on small screens it stays under the chart) */}
        {showResults && t.values[valueIdx].value && (
          <CrowdNote v={t.values[valueIdx]} who={who} className="demo mono" />
        )}

        <div className="privacy">
          <p id="privacy-note" hidden={!privacy}>
            {PRIVACY.text}
          </p>
          <button
            aria-expanded={privacy}
            aria-controls="privacy-note"
            onClick={() => setPrivacy(!privacy)}
          >
            {PRIVACY.label}
          </button>
        </div>
      </div>
    </main>
  );
}

/* Without WebGL there is no scene to scroll through, so the same words become an ordinary page */
function PlainPage() {
  const [who, setWho] = useState(CHART.startCrowd);
  return (
    <main className="plain">
      <h1>{TITLE.name}</h1>
      {TITLE.lines.map((l) => (
        <p key={l}>
          <b>{l}</b>
        </p>
      ))}
      <p className="mono">{PLAIN.note}</p>
      {[1, 2, 3, 4]
        .flatMap((n) => [...STEPS[n], ...(STEPS.small[n] ? [STEPS.small[n]] : [])])
        .map((l) => (
          <p key={l}>{l}</p>
        ))}
      <p>
        <b>{STEPS[5].heading}</b> {STEPS[5].body}
      </p>
      <p>
        {STEPS[6].note[0]}
        <b>{STEPS[6].note[1]}</b>
        {STEPS[6].note[2]}
      </p>
      {TUBES.map((t) =>
        t.values.map((v) => (
          <section key={v.key}>
            <p className="mono">{t.owner}</p>
            <Value v={v} who={who} setWho={setWho} />
          </section>
        )),
      )}
      <p className="small">{PRIVACY.text}</p>
    </main>
  );
}
