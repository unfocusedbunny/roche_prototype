/*
 * How Sangui was made: an ordinary reading page. No 3D and no animation.
 * The first screen is the red of the prototype's title page; the rest sits on Morning haze, the way the prototype turns when you scroll.
 */
import { useState } from 'react';
import { FIGMA_URL, CV_FILE } from '../links.js';
import { TOP, WHY, WHAT, TIMELINE, DECISIONS, SYSTEM, DATA, REAL, LIBERTIES, CREDIT, TESTING, FOOTER } from './content.js';

/* This page lives one folder below the prototype */
const HOME = '../', CV = '../' + CV_FILE;
const FIGMA_EMBED = FIGMA_URL.replace('https://www.figma.com/', 'https://embed.figma.com/') + '?embed-host=share';

/* Text with its [MIMI: …] gaps shown as yellow notes, so a missing line can't pass for a finished one */
function T({ children }) {
  return children.split(/(\[MIMI:[^\]]*\])/).map((part, i) => part.startsWith('[MIMI:') ? <mark key={i}>{part}</mark> : part);
}

const List = ({ items }) => <ul>{items.map(p => <li key={p}><T>{p}</T></li>)}</ul>;

/* The Figma file is only fetched once the reader asks for it */
function Figma() {
  const [on, setOn] = useState(false);
  return (
    <div className="figma">
      {on && <iframe ref={el => el && el.focus()} title={SYSTEM.figma.title} src={FIGMA_EMBED} allowFullScreen />}
      <p>
        {!on && <button className="btn" onClick={() => setOn(true)}>{SYSTEM.figma.show}</button>}
        <a href={FIGMA_URL}>{SYSTEM.figma.link}</a>
      </p>
      {!on && <p className="mono">{SYSTEM.figma.note}</p>}
    </div>
  );
}

export default function About() {
  return (
    <main>
      <header className="top">
        <div className="wrap">
          <h1>{TOP.title}</h1>
          <p className="lead"><T>{TOP.lead}</T></p>
          <p className="buttons">
            <a className="btn" href={HOME}>{TOP.buttons.prototype}</a>
            <a className="btn" href={FIGMA_URL}>{TOP.buttons.figma}</a>
            <a className="btn" href={CV}>{TOP.buttons.cv}</a>
          </p>
          <p className="tools">{TOP.tools}</p>
        </div>
      </header>

      <div className="rest">
        <div className="wrap">
          <section>
            <h2>{WHY.heading}</h2>
            <p><T>{WHY.story}</T></p>
            <p>{WHY.problem}</p>
          </section>

          <section>
            <h2>{WHAT.heading}</h2>
            <List items={WHAT.points} />
            {WHAT.shots.length
              ? <div className="shots">{WHAT.shots.map(s => <img key={s.file} src={'./' + s.file} alt={s.alt} />)}</div>
              : <p className="gap"><T>{WHAT.shotsGap}</T></p>}
          </section>

          <section>
            <h2>{TIMELINE.heading}</h2>
            <ol className="timeline">
              {TIMELINE.steps.map(s => <li key={s.text}>
                <span className="mono">{s.date}</span>
                <p><T>{s.text}</T>{s.who && <span className="mono who">{s.who}</span>}</p>
              </li>)}
            </ol>
          </section>

          <section>
            <h2>{DECISIONS.heading}</h2>
            <p>{DECISIONS.intro}</p>
            <ol className="decisions">{DECISIONS.items.map(d => <li key={d}>{d}</li>)}</ol>
          </section>

          <section>
            <h2>{SYSTEM.heading}</h2>
            <p>{SYSTEM.credit}</p>
            <ul className="swatches">
              {SYSTEM.colours.map(c => <li key={c.name}><span className="chip" style={{ background: c.css }} />{c.name}<span className="mono">{c.value}</span></li>)}
            </ul>
            <ul className="fonts">
              {SYSTEM.fonts.map(f => <li key={f.name}>
                <span className="specimen" style={{ fontFamily: f.css }}>{f.name}</span>
                <span>{f.use}. <T>{f.why}</T></span>
              </li>)}
            </ul>
            <Figma />
          </section>

          <section>
            <h2>{DATA.heading}</h2>
            <List items={DATA.points} />
          </section>

          <section>
            <h2>{REAL.heading}</h2>
            <p>{REAL.text}</p>
          </section>

          <section>
            <h2>{LIBERTIES.heading}</h2>
            <List items={LIBERTIES.points} />
          </section>

          <section>
            <h2>{CREDIT.heading}</h2>
            <div className="scroll-x">
              <table>
                <thead><tr><td />{CREDIT.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
                <tbody>{CREDIT.rows.map(([work, ...who]) => <tr key={work}><th scope="row">{work}</th>{who.map((w, i) => <td key={i}>{w}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p><T>{CREDIT.note}</T></p>
          </section>

          {TESTING && <section>
            <h2>{TESTING.heading}</h2>
            <p><T>{TESTING.text}</T></p>
          </section>}

          <footer className="mono">
            <a href={CV}>{FOOTER.cv}</a> · <a href={FIGMA_URL}>{FOOTER.figma}</a> · <a href={FOOTER.siteUrl}>{FOOTER.site}</a> · <a href={'mailto:' + FOOTER.email}>{FOOTER.email}</a>
          </footer>
        </div>
      </div>
    </main>
  );
}
