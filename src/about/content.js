/*
 * How Sangui was made: every word on the page lives here.
 *
 * The page is a short case study (Mimi's outline, 15 Nov 2026): cover, facts, context, the prototype,
 * key design moments, design system, reflections, who did what. It is not a day-by-day account.
 *
 * Nothing is made up to fill a gap: anything written as [MIMI: …] is shown on the page as a yellow note until
 * Mimi replaces it with her own text. To fill one in, replace the whole bracket.
 *
 * DRAFT (Claude) marks text Claude wrote from the working log and the handoffs, for Mimi to rewrite in her own words.
 * The facts in those drafts are from the log; the wording is not hers yet.
 */

export const TOP = {
  /* the line at the very top: back to the prototype, then where you are */
  back: 'Sangui prototype', here: 'Case study',
  cover: { file: 'title.png', alt: 'The title page of the Sangui prototype: the word Sangui in cream on red, with soft darker red blobs behind it.' },
  title: 'How Sangui was made',
  lead: 'Sangui is a scroll-driven prototype that explains a blood test in plain language. I started it on 10 Nov 2026 for the Generative AI Designer internship at Roche, and it is still in progress. [MIMI: adjust]',
  /* the row of facts under the title. "Role" is the wording of the project card on Mimi's portfolio. */
  facts: [
    ['Role', ['Idea, story and design', 'Built by directing AI coding tools']],
    ['Timeline', ['10 Nov 2026, in progress']],
    ['Tools', ['Figma', 'React · three.js', 'Claude · Claude Code']],
    ['Made for', ['Generative AI Designer internship, Roche']]],
  links: { prototype: 'Open the prototype', figma: 'Figma file', cv: 'CV (PDF)' },
};

/* the list of sections at the side of the page; the ids match the sections in About.jsx */
export const NAV = {
  label: 'On this page',
  items: [['context', 'Context'], ['prototype', 'The prototype'], ['moments', 'Key design moments'], ['system', 'Design system'], ['reflections', 'Reflections'], ['credit', 'Who did what']],
};

export const WHY = {
  heading: 'Most people never see their blood results, and can’t read them when they do.',
  story: '[MIMI: two or three lines of your own story, as on the prototype’s story steps. Keep the health part general: a period of many blood tests, results you never saw, and numbers you couldn’t read when you asked.]',
};

export const WHAT = {
  /* DRAFT (Claude): heading */
  heading: 'Three tubes, three groups of results, each explained in plain words.',
  /* The screenshot sits in public/how-it-was-made/. Taken from the prototype on 15 Nov 2026 by Claude Code; swap the file to change it. */
  shot: { file: 'tubes.png', alt: 'Three blood tubes with yellow, purple and rust red caps under the handwritten words “Pick one”.' },
  points: [
    'Pick a tube: blood fats (yellow cap), blood count and sugar (purple) or iron (rust red), with medically accurate cap colours. The camera dives in and lands on a 3D model of what the result measures.',
    'Each result is explained in plain words and shown against an example range and against a crowd from a US health survey. You can slide to any number and switch the crowd.',
    'Example numbers only. Nothing is uploaded, stored or sent to an AI model.'],
};

/* The 3D card. The still is a picture of the same card, shown until the reader asks for the 3D and kept if 3D can't run. */
export const CELL = {
  still: { file: 'cell.png', alt: 'A red blood cell drawn in 3D in flat reds with a dark outline, with three small markers and the handwritten word Erythrocytus along its edge.' },
  stage: 'The red blood cell in 3D. Use the arrow keys to turn it.',
  load: 'Load the 3D model',
  note: 'The same model as in the prototype. It loads about 0.2 MB when you ask for it.',
  hint: 'Drag to turn it, or use the arrow keys. Tap a dot for a note.',
  pause: 'Pause motion', play: 'Play motion',
  failed: 'This browser can’t show the 3D model, so here is a picture of it.',
};

/*
 * Key design moments: the four Mimi picked on 15 Nov 2026. `chart: true` puts the working crowd chart under that moment.
 * `gap` is a picture still to come.
 * DRAFT (Claude): all four headings and texts. The facts are from the working log (entries 44 to 46) and the chart handoff.
 */
export const MOMENTS = {
  heading: 'Four decisions that shaped the crowd chart.',
  items: [
    { key: 'slider',
      title: 'A fixed result made no sense, so the number moves too',
      text: [
        'The first built version let the reader switch the crowd while the result stayed fixed, as Claude had proposed. I found it convoluted that one patient could be any age or sex with the same result. My fix: make the number move too, with a slider limited to where the data has support.',
        '[MIMI: the Robin story, in your words. A made-up patient helped explain the data, a tester found it confusing, so it became “you” and example numbers.]'],
      who: 'Slider idea: Mimi · Prototype: Claude in chat · Build: Claude Code',
      chart: true, chartNote: 'The working chart from the prototype. Try it.' },
    { key: 'hill',
      title: 'From a hundred dots to a hill',
      text: [
        'The first chart was 100 dots, one for each person in a hundred. I rejected it: not original, and not in Sangui’s style. From my references of smooth curves and bold shapes, Claude drew three mock-ups on real hemoglobin numbers, and I chose the hill.'],
      who: 'References, brief and choice: Mimi · Mock-ups: Claude in chat',
      gap: '[MIMI: a picture of the three mock-ups, or of the dot plot next to the hill]' },
    { key: 'data',
      title: 'American data, because Europe’s is behind applications',
      text: [
        'The crowd is the CDC’s NHANES survey, 2015 to 2016: about 5,100 adults for each value, and 2,206 for LDL. Switzerland has no representative national dataset, and EU data sits behind research applications. A prototype built on open data ends up comparing against US adults, so the chart says so.'],
      who: 'CDC files downloaded by Mimi · Research and analysis: Claude in chat' },
    { key: 'range',
      title: '“Example range”, never “your lab’s range”',
      text: [
        'The ranges come from the ABIM laboratory reference table (January 2026), which says its ranges are not targets for one person. So the yellow band is an example range; a real lab prints its own. LDL has no single range, so its chart has no band.'],
      who: 'Wording: Claude in chat · LDL without a band: Mimi’s call' }],
};

/* css: what the swatch is painted with. The first four are the shared tokens; the cap colours are the scene's own. */
export const SYSTEM = {
  /* DRAFT (Claude): heading */
  heading: 'Seven colours and a Figma file.',
  credit: 'The colours, the fonts and the design of the Figma file are Mimi’s. Since 14 Nov Claude builds repetitive pieces in the file through the Figma connector; each one is labelled in the file.',
  colours: [
    { name: 'Morning haze', value: '#F4F1E4 → #F7DDD3 → #E6D8F3', css: 'var(--haze)' },
    { name: 'Ink', value: '#1E2145', css: 'var(--ink)' },
    { name: 'Cell red', value: '#D9482F', css: 'var(--red)' },
    { name: 'Highlight', value: '#F0E66E', css: 'var(--yellow)' },
    { name: 'Purple cap', value: '#6A4E9E', css: '#6A4E9E' },
    { name: 'Yellow cap', value: '#F0E66E', css: '#F0E66E' },
    { name: 'Rust red cap', value: '#A84E1B', css: '#A84E1B' }],
  figma: { show: 'Show the Figma file', link: 'Open it in Figma', note: 'Nothing loads from Figma until you ask for it.', title: 'The Sangui Figma file' },
};

/* DRAFT (Claude): the heading, the mistakes (from the handoff's "mistakes worth keeping") and the limits line. The lessons are Mimi's to write. */
export const REFLECTIONS = {
  heading: 'What went wrong on the way.',
  mistakes: [
    'Claude named a CDC file for iron that does not exist for 2015–2016.',
    'Claude first proposed keeping the result fixed while the crowd changed. That is the version I found convoluted.',
    'Claude Code’s first layout for this page was the tidy default. I called it too Claude-made; this is the second one.'],
  own: '[MIMI: your own reflections. What you learned about designing with AI, what you would do differently.]',
  limits: 'A prototype takes liberties: white cells and platelets have no model, the iron model is a diagram and not the real molecule, and the cap colours are adapted to the palette. A real version would need consent and secure handling of results, medical-device rules, clinician review of every text, and testing with patients.',
};

export const CREDIT = {
  /* DRAFT (Claude): heading */
  heading: 'Designed by a person, built with AI.',
  columns: ['Mimi', 'Claude (chats)', 'Claude Code'],
  rows: [
    ['Idea, story, design decisions, Figma', '✓', 'repetitive Figma pieces, labelled in the file', ''],
    ['3D models and scene', 'direction and feedback', '✓', ''],
    ['Crowd chart', 'decisions and the slider idea', 'mock-ups, prototypes, data analysis', 'build'],
    ['Page code, this page, deploy', 'direction and feedback', 'first version', '✓ (since 12 Nov)']],
  note: 'Explanation texts drafted with AI, reviewed by Mimi, [MIMI: and by a physician. Update when done.]',
};

export const FOOTER = { cv: 'CV (PDF)', figma: 'Figma', site: 'unfocused.ch', siteUrl: 'https://unfocused.ch', email: 'mimi@unfocused.ch' };
