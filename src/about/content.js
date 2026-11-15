/*
 * How Sangui was made: every word on the page lives here.
 *
 * The page is a case study in six parts (Mimi's outline, 15 Nov 2026): cover, facts, context, the prototype,
 * key design moments, reflections. It is not a day-by-day account.
 *
 * Nothing is made up to fill a gap: anything written as [MIMI: …] is shown on the page as a yellow note until
 * Mimi replaces it with her own text. To fill one in, replace the whole bracket. To drop a section, set it to null.
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
  label: 'Context',
  heading: 'Most people never see their blood results, and can’t read them when they do.',
  story: '[MIMI: two or three lines of your own story, as on the prototype’s story steps. Keep the health part general: a period of many blood tests, results you never saw, and numbers you couldn’t read when you asked.]',
};

export const WHAT = {
  label: 'The prototype',
  /* DRAFT (Claude): heading */
  heading: 'Three tubes, three groups of results, each explained in plain words.',
  /* Screenshots sit in public/how-it-was-made/. Every picture needs its alt text. These were taken from the
     prototype on 15 Nov 2026 by Claude Code; swap the files to change them. */
  rows: [
    { file: 'tubes.png', alt: 'Three blood tubes with yellow, purple and rust red caps under the handwritten words “Pick one”.',
      title: 'Pick a tube',
      text: 'A rack of tubes, then three tubes: blood fats (yellow cap), blood count and sugar (purple), iron (rust red), with medically accurate cap colours.' },
    { file: 'result.png', alt: 'A red blood cell drawn in 3D on the left. On the right, the text for hemoglobin, the number 15.6 and the crowd chart.',
      title: 'Dive in',
      text: 'Tap a tube and the camera dives into it, landing on a 3D model of what the result measures: a red blood cell (sugar on it for HbA1c), an LDL particle, iron in its heme ring.' }],
  points: [
    'Each result is explained in plain words and shown two ways: against an example range, and against a crowd of people from a US health survey.',
    'The reader can slide to any number and switch between six crowds: men or women, in three age bands.',
    'Example numbers only. Nothing is uploaded, stored or sent to an AI model.'],
};

/*
 * Key design moments: the four Mimi picked on 15 Nov 2026. Each has a heading, the story in a few paragraphs,
 * and a line on who did what. `chart: true` puts the working crowd chart under that moment. `gap` is a picture still to come.
 * DRAFT (Claude): all four headings and texts. The facts are from the working log (entries 44 to 46) and the chart handoff.
 */
export const MOMENTS = {
  label: 'Key design moments',
  heading: 'Four decisions that shaped the crowd chart.',
  items: [
    { key: 'slider',
      title: 'A fixed result made no sense, so the number moves too',
      text: [
        'The first built version let the reader switch the crowd: pick a sex and an age band, and the hill changes shape. Claude had proposed keeping the result fixed while the crowd changed.',
        'I liked the interactivity, but it was convoluted that one patient could be any age or sex while the result stayed the same. My fix was to make the number interactive as well, with a slider and not a typed-in field, limited to where the data still has support. Someone who remembers a value of their own can compare themselves.',
        '[MIMI: the Robin story, in your words. A made-up patient helped explain the data, a tester found it confusing, so it became “you” and example numbers.]'],
      who: 'Slider idea and decisions: Mimi · Prototype: Claude in chat · Build: Claude Code',
      chart: true, chartNote: 'This is the working chart from the prototype, on hemoglobin. Try it.' },
    { key: 'hill',
      title: 'From a hundred dots to a hill',
      text: [
        'The first crowd chart was a quantile dot plot: 100 dots, each standing for one person in a hundred. I rejected it. It didn’t look original and it wasn’t in Sangui’s style. My brief: cohesive with the art style, accuracy before looks.',
        'My references were graphic: smooth filled curves and bold shapes. Claude drew three mock-ups on real hemoglobin numbers: a hill with a pin, outlined pill bars, and the dot plot redrawn in the same style. I chose the hill.'],
      who: 'References, brief and choice: Mimi · Mock-ups: Claude in chat',
      gap: '[MIMI: a picture of the three mock-ups, or of the dot plot next to the hill]' },
    { key: 'data',
      title: 'American data, because Europe’s is behind applications',
      text: [
        'The crowd is the CDC’s NHANES survey, 2015 to 2016: adults aged 20 and over, pregnant women excluded, survey-weighted, in six groups by sex and age. That is 5,123 people for hemoglobin, 5,141 for HbA1c, 5,086 for iron and 2,206 for LDL, which is measured in a fasting subsample. The starting numbers are picked from real percentiles, not real people.',
        'Why American data: Switzerland has no representative national dataset (the planned national health study was shelved in 2025), and EU data sits behind research applications. The European Health Data Space opens research access from 2029. A prototype built today on open data ends up comparing against US adults, so the chart says so.'],
      who: 'CDC files downloaded by Mimi · Research and analysis: Claude in chat' },
    { key: 'range',
      title: '“Example range”, never “your lab’s range”',
      text: [
        'Common is not healthy, so each value shows a range and the crowd side by side. The ranges come from the ABIM laboratory reference table (January 2026), and that table says its ranges are not targets for one person.',
        'So the yellow band is called an example range. A real lab prints its own. LDL has no single range, so its chart has no band and says so.'],
      who: 'Wording: Claude in chat · LDL without a band: Claude’s recommendation, Mimi’s call' }],
};

export const DECISIONS = {
  heading: 'Smaller decisions',
  items: [
    'Men and women need different comparison groups, so the comparison is always against a crowd you pick.',
    'High HDL is good news, so colour can’t mean “high = bad”.',
    'HbA1c is lopsided, so a bare “top X%” would mislead. Its chart is zoomed in and says how many people are past the edge.',
    'Three tubes for three sample people became three tubes for three groups of results, after realising cholesterol isn’t drawn into a purple-capped tube. It also stopped one results panel from getting crowded. (Mimi’s call.)',
    'Collect nothing: sample data only, explanations written ahead, no AI call on anyone’s values. (Mimi raised it on day one.)',
    'Pick first, or story first: the page tells the story by scroll, then a tap starts the dive.'],
};

/* css: what the swatch is painted with. The first four are the shared tokens; the cap colours are the scene's own. */
export const SYSTEM = {
  label: 'Design system',
  /* DRAFT (Claude): heading */
  heading: 'Colours, fonts and a Figma file.',
  credit: 'The colours, the fonts and the design of the Figma file are Mimi’s. Since 14 Nov Claude builds repetitive pieces in the file through the Figma connector; each one is labelled in the file.',
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

/* DRAFT (Claude): the heading and the four mistakes, from the handoff's "mistakes worth keeping". The lessons are Mimi's to write. */
export const REFLECTIONS = {
  label: 'Reflections',
  heading: 'What went wrong on the way, and what a real version would need.',
  mistakesTitle: 'Mistakes worth keeping',
  mistakes: [
    'Claude named a CDC file for iron that does not exist for 2015–2016. Iron sits in another file.',
    'Claude first proposed keeping the result fixed while the crowd changed. That is the version I found convoluted.',
    'Claude Code’s first layout for this page was the tidy default. I called it too Claude-made, and this is the second one.',
    'Claude Code let the “past the edge” note show on LDL and iron when it was meant for HbA1c only. It was caught on the live check and fixed.'],
  own: '[MIMI: your own reflections. What you learned about designing with AI, what you would do differently.]',
  libertiesTitle: 'Liberties a prototype takes',
  liberties: [
    'Only the red blood cell is modelled; white cells and platelets appear in the results only (a time call).',
    'The iron model is a diagram of the arrangement, not the real molecule.',
    'Cap colours are adapted to the colour scheme (yellow stands in for a gold serum cap).',
    'Shapes and colours are simplified for clarity.'],
  realTitle: 'What a real version would need',
  real: 'Consent and secure handling of personal results; medical-device rules for software that interprets results; clinician review of every explanation; testing with patients.',
};

export const CREDIT = {
  label: 'Who did what',
  /* DRAFT (Claude): heading */
  heading: 'Designed by a person, built with AI, and credited line by line.',
  columns: ['Mimi', 'Claude (chats)', 'Claude Code'],
  rows: [
    ['Idea, story, every design decision', '✓', '', ''],
    ['Figma tokens, text styles, storyboard', '✓ (design, by hand)', 'repetitive pieces, labelled in the file', ''],
    ['3D models and scene code', 'direction and feedback', '✓', ''],
    ['Page code and deploy', 'direction and feedback', '✓', '✓ (since 12 Nov)'],
    ['Crowd chart', 'decisions and the slider idea', '✓ (mock-ups, prototypes, data analysis)', '✓ (build)'],
    ['This page', 'outline and direction', '', '✓'],
    ['Data check, research, explanation drafts', 'review', '✓', '']],
  note: 'Explanation texts drafted with AI, reviewed by Mimi, [MIMI: and by a physician. Update when done.]',
};

/* Set to null to cut the section if there is nothing real to report */
export const TESTING = {
  title: 'Testing',
  text: '[MIMI: number of sessions, who (no names), one or two real findings and what changed. If none yet, cut this section rather than fill it.]',
};

export const FOOTER = { cv: 'CV (PDF)', figma: 'Figma', site: 'unfocused.ch', siteUrl: 'https://unfocused.ch', email: 'mimi@unfocused.ch' };
