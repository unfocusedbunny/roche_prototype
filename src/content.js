/*
 * Sangui: every word on the page lives here, so text can be changed without touching the layout.
 *
 * Where the wording comes from:
 *   - Title page, story steps and the hemoglobin screen: Mimi's Figma frames (12 Nov 2026).
 *   - HbA1c and LDL: the "texts for review" document (AI-drafted, sent to a doctor friend, review pending).
 *   - Iron: one unreviewed draft line from the 3D mockup.
 *   - Anything marked DRAFT (Claude) below was written by Claude and has not been looked at by Mimi yet.
 */

/* true: missing values and the chart's reserved space are shown with a small "to come" note.
   false: missing parts are simply left out. Set to false before sending the link to anyone. */
export const SHOW_GAPS = true;

export const TITLE = {
  name: 'Sangui',
  lines: [
    'A prototype I made for my application to Roche. It shows what I can do with Figma, 3D and AI coding tools.',
    'Use case: Inspired by my own story.',
    'Tools: Figma · React · three.js · Claude'],
  tools: 'Figma · React · three.js · Claude',
  scroll: 'Scroll down',
};

/* One entry per scroll step, 1 to 6. Each line fades in a moment after the one before it. */
export const STEPS = {
  1: ['I suffer from low iron.',
    'Every few years, the clinic boils my blood test down to a call from the doctor prescribing an infusion.',
    'No call if I don’t.',
    'I wanted to know where I land on the scales in those instances when I receive no call at all.'],
  2: ['So I built this to make blood test results more informative, accessible and fun.'],
  3: ['Sangui takes one blood test and explains it against the lab’s own range, and against people of the same sex and age in a US health survey.*'],
  4: ['*Why American data? Because it is open and I could get my hands on it quickly.'],
  5: { heading: 'These are “Robin’s” - prototype patient.',
    body: 'Robin’s blood went into three tubes. The cap colour tells the lab what each one is for. The numbers were picked from real survey data for men aged 40 to 59.' },
  6: { prompt: 'Pick one',
    note: 'A real version would let you bring your own report, securely. This one doesn’t, on purpose. Nothing you do here is collected or stored.' },
};

/* The three tubes, in the scene's order: 0 yellow, 1 purple, 2 rust red.
   value: null means Robin's number has not been picked yet. Nothing is made up to fill it.

   The crowd chart switches on for a value as soon as it has both a number and a `chart` entry:
     value   Robin's number, as text. It has to sit on a step of the survey table (hemoglobin, HbA1c, LDL: 0.1; iron: 0.5).
     chart   data: the value's name in src/data/crowds.json. window: the stretch of the axis that is drawn.
             lab: the lab's range for men (m) and women (w), or null for no yellow band. unitName: the unit read out loud.
   Until then, `status` and `crowd` are shown as plain text. Once the chart is on, it works both out itself. */
export const TUBES = [
  { owner: 'Robin · Blood fats', values: [
    { key: 'ldl', name: 'LDL cholesterol',
      lead: 'The cholesterol that can build up in your artery walls.',
      body: 'LDL particles carry cholesterol to the body’s tissues. Any surplus slowly builds up in artery walls over years, hence “bad” cholesterol, though the body needs some.',
      value: null, unit: 'mmol/L', status: null,
      crowd: 'Higher than 72 of 100 men aged 40–59 in a US survey.',
      range: 'The yellow band is your lab’s range. Ranges differ by lab and by sex.',
      /* lab: null until Mimi decides how LDL's band is shown (it has no single range) */
      chart: { data: 'ldl', unitName: 'millimoles per litre', window: [0, 8], lab: null } }] },
  { owner: 'Robin · Blood count and sugar', values: [
    { key: 'hemoglobin', name: 'Hemoglobin',
      lead: 'Carries oxygen from your lungs to the rest of your body.',
      body: 'It’s an iron-containing protein inside your red cells. Each cell holds about 270 million of them, picking up oxygen in the lungs and letting it go in the body.',
      value: '15.6', unit: 'g/dL',
      range: 'The yellow band is your lab’s range. Ranges differ by lab and by sex.',
      chart: { data: 'hemoglobin', unitName: 'grams per decilitre', window: [10, 19], lab: { m: [14, 18], w: [12, 16] } } },
    { key: 'hba1c', name: 'HbA1c',
      lead: 'Your average blood sugar over the past 2–3 months.',
      body: 'Sugar sticks to hemoglobin, and red cells live about 3 months, so it reflects your average, not just the test day.',
      value: null, unit: '%', status: null,
      crowd: 'Higher than 70 of 100 men aged 40–59 in a US survey.',
      range: 'The yellow band is your lab’s range. Ranges differ by lab and by sex.',
      /* lopsided, so the chart is zoomed in to 4.5–8.5 and says how many people are past the edge */
      chart: { data: 'hba1c', unitName: 'percent', window: [4.5, 8.5], lab: { m: [4, 5.6], w: [4, 5.6] } } }] },
  { owner: 'Robin · Iron', values: [
    { key: 'iron', name: 'Iron',
      lead: 'Your test doesn’t count this iron. It measures iron on the move in your blood.',
      body: null, value: null, unit: null, status: null, crowd: null, range: null,
      chart: { data: 'iron', unitName: 'micromoles per litre', window: [0, 45], lab: { m: [9, 26.9], w: [9, 26.9] } } }] },
];

export const RESULTS = {
  back: 'Back to the tubes',
  /* The texts are AI-drafted and the doctor's review is still out, so this does not say "checked by a person" yet. */
  aiNote: 'Drafted with AI. Review pending.',
  disclaimer: 'Sangui explains. It doesn’t diagnose, and it can’t tell you what to do. That’s what doctors are for.',
  valueGap: 'Robin’s number is still to come.',
  chartGap: 'The crowd chart goes here.',
};

/* The crowd chart's words. {…} parts are filled in by the chart. Lab ranges: ABIM reference table, January 2026 (not signed off by Mimi yet). */
export const CHART = {
  sentence: '{name}: higher than {count} {group} in a US health survey.',
  count: '{n} of 100',
  status: { in: 'In range', above: 'Above range', below: 'Below range' },
  who: { lead: 'Robin is a', aged: 'aged', sex: 'Sex', age: 'Age band', sexes: { m: 'man', w: 'woman' }, ageBands: { a: '20–39', b: '40–59', c: '60+' } },
  groups: { m: 'men', w: 'women' },
  ages: { a: 'aged 20 to 39', b: 'aged 40 to 59', c: 'aged 60 and over' },
  robin: 'Robin', lab: 'LAB’S RANGE', below: 'below', above: 'above',
  past: '{n} OF 100 ARE PAST {edge} →',
  source: {
    crowd: 'Crowd: {people} {sex} in the CDC’s NHANES survey, 2015 to 2016, weighted to stand for US adults.',
    lab: 'Lab range: ABIM reference table, Jan 2026.',
    robin: 'Robin and the {value} are made up.' },
  /* what the chart shows, for people who can't see it */
  picture: '{name} for {group}. Robin is at {value} {unit}, higher than {n} of 100 of them.',
  pictureLab: 'The lab range for {sex}, {lo} to {hi}, is the yellow band.',
};

export const CONTROLS = { skip: 'Skip to the tubes', pause: 'Pause motion', play: 'Play motion' };

/* The small corner link to the project page, the CV and the Figma file */
export const LINKS = { label: 'About this project', about: 'About this project', cv: 'CV', figma: 'Figma' };

/* DRAFT (Claude). Says only what the page itself does; the host keeps ordinary server logs like any website. */
export const PRIVACY = {
  label: 'Privacy note',
  text: 'This page sets no cookies, runs no analytics and stores nothing you do here. The results belong to Robin, who doesn’t exist.',
};

/* What the 3D picture shows, for people who can't see it */
export const PICTURE = {
  steps: ['', 'A rack of eight blood collection tubes.', 'Three tubes with yellow, purple and rust red caps rise out of the rack.',
    'Three blood collection tubes, and a printed results sheet beside them.', 'The results sheet moves towards the tubes.',
    'The results sheet has become the label of one tube. All three tubes are labelled.', 'Three blood collection tubes with yellow, purple and rust red caps.'],
  models: { cell: 'A red blood cell.', ldl: 'An LDL particle with a ribbon round it.',
    iron: 'A ring with an iron atom at its centre and an oxygen molecule landing on it.' },
  stage: '3D stage. Arrow keys turn the tubes or the model.',
};

/* DRAFT (Claude). Shown only where the browser can't draw the 3D scene. */
export const PLAIN = { note: 'This browser can’t show the 3D part, so here is the story as text.' };
