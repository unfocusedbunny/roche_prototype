/*
 * How Sangui was made: a case study. An ordinary reading page, no 3D, and nothing moves by itself.
 * It looks like Mimi's portfolio (light grey page, white cards, Bricolage Grotesque and Newsreader, a mint accent), not like Sangui.
 * The one piece in Sangui's own colours is the working crowd chart, shown as the artifact it is.
 * Order: cover, title and facts, then context, the prototype, key design moments, design system, reflections, who did what.
 */
import { useState } from 'react';
import { FIGMA_URL, CV_FILE } from '../links.js';
import CrowdChart from '../crowd/CrowdChart.jsx';
import { TUBES, CHART } from '../content.js';
import { TOP, NAV, WHY, WHAT, MOMENTS, DECISIONS, SYSTEM, REFLECTIONS, CREDIT, TESTING, FOOTER } from './content.js';

/* This page lives one folder below the prototype */
const HOME = '../', CV = '../' + CV_FILE;
const FIGMA_EMBED = FIGMA_URL.replace('https://www.figma.com/', 'https://embed.figma.com/') + '?embed-host=share';
/* the value the chart on this page shows */
const HEMOGLOBIN = TUBES.flatMap(t => t.values).find(v => v.key === 'hemoglobin');

/* Text with its [MIMI: …] gaps shown as yellow notes, so a missing line can't pass for a finished one */
function T({ children }) {
  return children.split(/(\[MIMI:[^\]]*\])/).map((part, i) => part.startsWith('[MIMI:') ? <mark key={i}>{part}</mark> : part);
}

const List = ({ items }) => <ul className="list">{items.map(p => <li key={p}><T>{p}</T></li>)}</ul>;

/* A section's opening: a small label, then the statement */
const Opening = ({ label, heading }) => <><p className="label">{label}</p><h2>{heading}</h2></>;

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
      {!on && <p className="fine">{SYSTEM.figma.note}</p>}
    </div>
  );
}

/* The working chart from the prototype, in Sangui's own colours and fonts */
function Chart({ note }) {
  const [who, setWho] = useState(CHART.startCrowd);
  return (
    <figure className="sangui">
      <figcaption>{note}</figcaption>
      <p className="valname">{HEMOGLOBIN.name}</p>
      <CrowdChart v={HEMOGLOBIN} who={who} setWho={setWho} />
    </figure>
  );
}

export default function About() {
  return (
    <>
      <header className="bar">
        <p className="crumb"><a href={HOME}><span aria-hidden="true">← </span>{TOP.back}</a><span aria-hidden="true"> / </span><span>{TOP.here}</span></p>
        <p className="out"><a href={FIGMA_URL}>{TOP.links.figma}</a><a href={CV}>{TOP.links.cv}</a></p>
      </header>

      <main>
        <div className="wide">
          <img className="cover" src={'./' + TOP.cover.file} alt={TOP.cover.alt} width="1440" height="900" />
        </div>

        <div className="frame">
          <nav className="toc" aria-label={NAV.label}>
            <ol>{NAV.items.map(([id, name]) => <li key={id}><a href={'#' + id}>{name}</a></li>)}</ol>
          </nav>

          <div className="col">
            <h1>{TOP.title}</h1>
            <p className="lead"><T>{TOP.lead}</T></p>
            <dl className="facts">
              {TOP.facts.map(([k, lines]) => <div key={k}><dt>{k}</dt>{lines.map(l => <dd key={l}>{l}</dd>)}</div>)}
            </dl>
            <p><a className="btn" href={HOME}>{TOP.links.prototype}</a></p>

            <section id="context">
              <Opening label={WHY.label} heading={WHY.heading} />
              <p><T>{WHY.story}</T></p>
            </section>

            <section id="prototype">
              <Opening label={WHAT.label} heading={WHAT.heading} />
              {WHAT.rows.map(r => <div className="row" key={r.file}>
                <img src={'./' + r.file} alt={r.alt} width="1440" height="900" loading="lazy" />
                <div><h3>{r.title}</h3><p>{r.text}</p></div>
              </div>)}
              <List items={WHAT.points} />
            </section>

            <section id="moments">
              <Opening label={MOMENTS.label} heading={MOMENTS.heading} />
              {MOMENTS.items.map((m, i) => <article className="moment" key={m.key}>
                <p className="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
                <h3>{m.title}</h3>
                {m.text.map(p => <p key={p}><T>{p}</T></p>)}
                <p className="by">{m.who}</p>
                {m.chart && <Chart note={m.chartNote} />}
                {m.gap && <p className="gap"><T>{m.gap}</T></p>}
              </article>)}
              <h3>{DECISIONS.heading}</h3>
              <List items={DECISIONS.items} />
            </section>

            <section id="system">
              <Opening label={SYSTEM.label} heading={SYSTEM.heading} />
              <p>{SYSTEM.credit}</p>
              <ul className="swatches">
                {SYSTEM.colours.map(c => <li key={c.name}><span className="chip" style={{ background: c.css }} />{c.name}<span className="fine">{c.value}</span></li>)}
              </ul>
              <ul className="fonts">
                {SYSTEM.fonts.map(f => <li key={f.name}>
                  <span className="specimen" style={{ fontFamily: f.css }}>{f.name}</span>
                  <span>{f.use}. <T>{f.why}</T></span>
                </li>)}
              </ul>
              <Figma />
            </section>

            <section id="reflections">
              <Opening label={REFLECTIONS.label} heading={REFLECTIONS.heading} />
              <h3>{REFLECTIONS.mistakesTitle}</h3>
              <List items={REFLECTIONS.mistakes} />
              <p><T>{REFLECTIONS.own}</T></p>
              <h3>{REFLECTIONS.libertiesTitle}</h3>
              <List items={REFLECTIONS.liberties} />
              <h3>{REFLECTIONS.realTitle}</h3>
              <p>{REFLECTIONS.real}</p>
              {TESTING && <>
                <h3>{TESTING.title}</h3>
                <p><T>{TESTING.text}</T></p>
              </>}
            </section>

            <section id="credit">
              <Opening label={CREDIT.label} heading={CREDIT.heading} />
              <div className="scroll-x">
                <table>
                  <thead><tr><td />{CREDIT.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
                  <tbody>{CREDIT.rows.map(([work, ...who]) => <tr key={work}><th scope="row">{work}</th>{who.map((w, i) => <td key={i}>{w}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <p><T>{CREDIT.note}</T></p>
            </section>

            <footer>
              <a href={CV}>{FOOTER.cv}</a> · <a href={FIGMA_URL}>{FOOTER.figma}</a> · <a href={FOOTER.siteUrl}>{FOOTER.site}</a> · <a href={'mailto:' + FOOTER.email}>{FOOTER.email}</a>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
