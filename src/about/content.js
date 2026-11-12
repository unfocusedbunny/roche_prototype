/*
 * How Sangui was made: every word on the page lives here.
 *
 * The wording follows the handover from the planning chat (12 Nov 2026). Nothing is made up to fill a gap:
 * anything written as [MIMI: …] is shown on the page as a yellow note until Mimi replaces it with her own text.
 * To fill one in, replace the whole bracket. To drop a section, set it to null.
 */

export const TOP = {
  title: 'How Sangui was made',
  lead: 'Sangui is a scroll-driven prototype that explains a blood test in plain language. I made it in four days for the Generative AI Designer internship at Roche. [MIMI: adjust]',
  buttons: { prototype: 'Open the prototype', figma: 'Figma file', cv: 'CV (PDF)' },
  tools: 'Figma · React · three.js · Claude · Claude Code',
};

export const WHY = {
  heading: 'Why',
  story: '[MIMI: two or three lines of your own story, as on the prototype’s story steps. Keep the health part general: a period of many blood tests, results you never saw, and numbers you couldn’t read when you asked.]',
  problem: 'Most people never see their blood results, and can’t read them when they do.',
};

export const WHAT = {
  heading: 'What it does',
  points: [
    'A rack of tubes, then three tubes: blood count and sugar (purple cap), blood fats (yellow), iron (rust red), with medically accurate cap colours.',
    'Tap a tube and the camera dives into it, landing on a 3D model of what the result measures: a red blood cell (sugar on it for HbA1c), an LDL particle, iron in its heme ring.',
    'Each result is explained in plain words and compared two ways: against the lab’s range, and against people of the same sex and age in a US health survey.',
    'One made-up person, Robin. Nothing is uploaded, stored or sent to an AI model.'],
  /* Screenshots: save them to public/how-it-was-made/ and list them here, e.g.
     { file: 'tubes.png', alt: 'Three blood tubes with yellow, purple and rust red caps.' }. Every picture needs its alt text. */
  shots: [],
  shotsGap: '[MIMI: one or two screenshots of the prototype]',
};

/* who: who did the work in that step */
export const TIMELINE = {
  heading: 'How it came together',
  steps: [
    { date: '10 Nov', text: 'Picked the subject. A first data check on the US survey (NHANES) changed the design before any screen existed.', who: 'Mimi · data check by Claude in chat' },
    { date: '10–11 Nov', text: 'Figma by hand: colour, spacing and radius variables, text styles, a storyboard of the scroll sequence annotated with motion terms.', who: 'Mimi' },
    { date: '11–12 Nov', text: '3D mockups in Claude chats: tube, cell, rack, dive; then one joined scene.', who: 'Claude in chat · direction and feedback by Mimi' },
    { date: '12 Nov', text: 'Concept change: three tubes became three groups of results (see Decisions).', who: 'Mimi' },
    { date: '12 Nov', text: 'The page built in React and deployed from GitHub.', who: 'Claude in chat · direction and feedback by Mimi' },
    { date: '13 Nov', text: '[MIMI: crowd chart designed in Figma and built in Claude Code; About section built in Claude Code.]', who: null }],
};

export const DECISIONS = {
  heading: 'Decisions that shaped it',
  intro: 'What the data and the testing changed.',
  items: [
    'Men and women need different comparison groups, so the comparison is always “people like you”.',
    'Common is not healthy, so each value shows the lab’s range and the crowd side by side.',
    'High HDL is good news, so colour can’t mean “high = bad”.',
    'HbA1c is lopsided, so a bare “top X%” would mislead.',
    'Three tubes for three sample people became three tubes for three groups of results, after realising cholesterol isn’t drawn into a purple-capped tube. It also stopped one results panel from getting crowded. (Mimi’s call.)',
    'Collect nothing: sample data only, explanations written ahead and checked, no AI call on anyone’s values. (Mimi raised it on day one.)',
    'Pick first, or story first: the page tells the story by scroll, then a tap starts the dive.'],
};

/* css: what the swatch is painted with. The first four are the shared tokens; the cap colours are the scene's own. */
export const SYSTEM = {
  heading: 'Design system',
  credit: 'Colours, fonts and the Figma file are Mimi’s, made by hand.',
  colours: [
    { name: 'Morning haze', value: '#F4F1E4 → #F7DDD3 → #E6D8F3', css: 'var(--haze)' },
    { name: 'Ink', value: '#1E2145', css: 'var(--ink)' },
    { name: 'Cell red', value: '#D9482F', css: 'var(--red)' },
    { name: 'Highlight', value: '#F0E66E', css: 'var(--yellow)' },
    { name: 'Purple cap', value: '#6A4E9E', css: '#6A4E9E' },
    { name: 'Yellow cap', value: '#F0E66E', css: '#F0E66E' },
    { name: 'Rust red cap', value: '#A84E1B', css: '#A84E1B' }],
  fonts: [
    { name: 'Atkinson Hyperlegible', use: 'Text', why: 'Designed for low-vision readers.', css: 'var(--sans)' },
    { name: 'Atkinson Hyperlegible Mono', use: 'Labels', why: '[MIMI: why this font]', css: 'var(--mono)' },
    { name: 'Playwrite SK', use: 'One handwritten touch', why: '[MIMI: why this font]', css: 'var(--hand)' }],
  figma: { show: 'Show the Figma file', link: 'Open it in Figma', note: 'Nothing loads from Figma until you ask for it.', title: 'The Sangui Figma file' },
};

export const DATA = {
  heading: 'Data',
  points: [
    'Comparison data: CDC NHANES, the US national health survey. It is open and de-identified, with about 5,000 adults per value in one survey round.',
    'Why American data: in Switzerland there’s no representative national dataset (the planned national health study was shelved in 2025), and EU data sits behind research applications. The European Health Data Space opens research access from 2029.',
    'Robin’s values are picked from real percentiles, not real people.',
    '[MIMI: once recomputed from the official files, update the counts.]'],
};

export const REAL = {
  heading: 'What a real version would need',
  text: 'Consent and secure handling of personal results; medical-device rules for software that interprets results; clinician review of every explanation; testing with patients.',
};

export const LIBERTIES = {
  heading: 'Liberties a prototype takes',
  points: [
    'Only the red blood cell is modelled; white cells and platelets appear in the results only (a time call).',
    'The iron model is a diagram of the arrangement, not the real molecule.',
    'Cap colours are adapted to the colour scheme (yellow stands in for a gold serum cap).',
    'Shapes and colours are simplified for clarity.',
    'Robin works for any gender, but the comparison group is men aged 40–59. [MIMI: the line about where the name comes from]'],
};

export const CREDIT = {
  heading: 'Who did what',
  columns: ['Mimi', 'Claude (chats)', 'Claude Code'],
  rows: [
    ['Idea, story, every design decision', '✓', '', ''],
    ['Figma tokens, text styles, storyboard', '✓ (by hand)', '', ''],
    ['3D models and scene code', 'direction and feedback', '✓', ''],
    ['Page code and deploy', 'direction and feedback', '✓', ''],
    ['Crowd chart and this page', 'design', '', '✓ (with Mimi)'],
    ['Data check, research, explanation drafts', 'review', '✓', '']],
  note: 'Explanation texts drafted with AI, reviewed by Mimi, [MIMI: and by a physician. Update when done.]',
};

/* Set to null to cut the section if there is nothing real to report */
export const TESTING = {
  heading: 'Testing',
  text: '[MIMI: number of sessions, who (no names), one or two real findings and what changed. If none yet, cut this section rather than fill it.]',
};

export const FOOTER = { cv: 'CV (PDF)', figma: 'Figma', site: 'unfocused.ch', siteUrl: 'https://unfocused.ch', email: 'mimi@unfocused.ch' };
