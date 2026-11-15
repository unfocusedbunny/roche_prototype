/*
 * Sangui: every word on the page lives here, so text can be changed without touching the layout.
 *
 * Where the wording comes from:
 *   - Title page, story steps and the hemoglobin screen: Mimi's Figma frames (12 Nov 2026).
 *   - HbA1c and LDL: the "texts for review" document (AI-drafted, sent to a doctor friend, review pending).
 *   - Iron: one unreviewed draft line from the 3D mockup.
 *   - The crowd chart's wording, the hemoglobin texts under its slider and the starting numbers for HbA1c, LDL and iron:
 *     the chart chat's handoff (14 Nov 2026).
 *   - Anything marked DRAFT (Claude) below was written by Claude and has not been looked at by Mimi yet.
 */

/* true: a missing number or a missing text is shown with a small "to come" note.
   false: missing parts are simply left out. Set to false before sending the link to anyone. */
export const SHOW_GAPS = false;

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
  1: ['I have chronic anemia, so my blood gets checked regularly.',
    'I’m usually told a number on the phone between appointments, and it means nothing to me: I don’t know what’s normal or where I stand.'],
  2: ['Pasting my results into an AI would explain them, but that means handing over my health data.'],
  3: ['So I built what I wanted: pick a value and see where it sits, against an example range and against people of your sex and age, with nothing stored.'],
  /* the story no longer marks this with a *, so the line stands on its own */
  4: ['Why American data? Because it is open and I could get my hands on it quickly.'],
  5: { heading: 'These are example tubes.',
    body: 'One blood test goes into three tubes. The cap colour tells the lab what each one is for. The numbers here are examples. Slide them to your own, and switch the crowd.' },
  6: { prompt: 'Pick one',
    note: 'A real version would let you bring your own report, securely. This one takes no uploads, on purpose. You can slide to your own number, and nothing you do here is collected or stored.' },
};

/* The three tubes, in the scene's order: 0 yellow, 1 purple, 2 rust red.

   Each value has a crowd chart: a hill of real people, a line at a number, and a slider that moves the number.
     value   the number the chart starts on, as text. It has to sit on a step of the survey table (hemoglobin, HbA1c, LDL: 0.1; iron: 0.5).
             15.6 is Mimi's. 5.8, 3.6 and 9.0 are suggestions from the chart chat, picked from the real data for men aged 40 to 59.
             With value: null there is no chart, only a "to come" note. Nothing is made up to fill it.
     chart   data      the value's name in src/data/crowds.json
             unitName  the unit, read out loud
             window    the stretch of the axis that is drawn, and that the slider covers
             range     the example range for men (m) and women (w), or null for no yellow band
             text      the line under the slider, as [bold start, rest]. Either one pair for every number,
                       or { below, in, above } to follow where the number sits. null: nothing written yet.
             textCuts  [a, b]: the three texts change at these two numbers and not at the example range
                       (below: under a · in: from a to under b · above: b or more)
             textAt    { '9.0': [bold start, rest] }: a text of its own for one exact number, as the chart shows it
             pastNote  true: a small note at the right edge says how many of 100 are past the window (HbA1c only) */
export const TUBES = [
  { owner: 'Blood fats', values: [
    { key: 'ldl', name: 'LDL cholesterol',
      lead: 'The cholesterol that can build up in your artery walls.',
      body: 'LDL particles carry cholesterol to the body’s tissues. Any surplus slowly builds up in artery walls over years, hence “bad” cholesterol, though the body needs some.',
      value: '3.6', unit: 'mmol/L',
      /* no band and no status: the chart chat's recommendation, Mimi's call. The alternative is a shaded "optimal, under 2.6" zone. */
      chart: { data: 'ldl', unitName: 'millimoles per litre', window: [1, 6], range: null,
        text: ['LDL has no single range.', 'The right number depends on your overall risk.'] } }] },
  { owner: 'Blood count and sugar', values: [
    { key: 'hemoglobin', name: 'Hemoglobin',
      lead: 'Carries oxygen from your lungs to the rest of your body.',
      body: 'It’s an iron-containing protein inside your red cells. Each cell holds about 270 million of them, picking up oxygen in the lungs and letting it go in the body.',
      value: '15.6', unit: 'g/dL',
      chart: { data: 'hemoglobin', unitName: 'grams per decilitre', window: [10, 19], range: { m: [14, 18], w: [12, 16] },
        /* AI-drafted, from the prototype Mimi approved in the chart chat. Review pending. */
        text: {
          below: ['Low (anaemia):', 'often too little iron, blood loss, low B12 or folate, or a long-term illness. Also lower in pregnancy.'],
          in: ['In range:', 'a typical amount for this range.'],
          above: ['High:', 'smoking, high altitude, or dehydration at the time of the test. Less often a lung, heart or bone marrow condition.'] } } },
    { key: 'hba1c', name: 'HbA1c',
      lead: 'Your average blood sugar over the past 2–3 months.',
      body: 'Sugar sticks to hemoglobin, and red cells live about 3 months, so it reflects your average, not just the test day.',
      value: '5.8', unit: '%',
      /* lopsided, so the chart is zoomed in to 4.5–8.5 and says how many people are past the edge.
         The three texts follow Mimi's zones (under 5.7 · 5.7 to 6.4 · 6.5 or more), not the example range. They come from
         "Blood test explainer: texts for review" by way of the chart handoff (14 Nov 2026). The doctor's review is not back. */
      chart: { data: 'hba1c', unitName: 'percent', window: [4.5, 8.5], range: { m: [4, 5.6], w: [4, 5.6] },
        pastNote: true, textCuts: [5.7, 6.5],
        text: {
          below: ['In range:', 'a typical average blood sugar.'],
          in: ['Higher-risk range:', 'not diabetes. An early signal that changes in activity, food and weight often bring down.'],
          above: ['Diabetes range:', 'one result usually isn’t a diagnosis; it’s normally confirmed with another test.'] } } }] },
  { owner: 'Iron', values: [
    { key: 'iron', name: 'Iron',
      lead: 'Your test doesn’t count this iron. It measures iron on the move in your blood.',
      body: null, value: '9.0', unit: 'µmol/L',
      /* The text only says where the number sits against the example range: no causes or symptoms for iron (Mimi, 15 Nov 2026).
         At the starting number, which is the range's bottom edge, it says so. */
      chart: { data: 'iron', unitName: 'micromoles per litre', window: [0, 40], range: { m: [9, 26.9], w: [9, 26.9] },
        text: {
          below: ['Below range:', 'under the example range, 9.0 to 26.9.'],
          in: ['In range:', 'inside the example range, 9.0 to 26.9.'],
          above: ['Above range:', 'over the example range, 9.0 to 26.9.'] },
        textAt: { '9.0': ['In range:', 'It sits right at the bottom edge of the example range, 9.0 to 26.9.'] } } }] },
];

export const RESULTS = {
  back: 'Back to the tubes',
  valueGap: 'The example number is still to come.',
  textGap: 'The text for this number is still to come.',
};

/* The crowd chart's words. {…} parts are filled in by the chart.
   Example ranges: ABIM laboratory reference ranges, January 2026. That table says its ranges are not targets for one person, hence "example range". */
export const CHART = {
  /* the handwritten word on the line */
  line: 'you',
  /* the crowd every chart starts on: men (m) or women (w), aged 20–39 (a), 40–59 (b) or 60+ (c) */
  startCrowd: { sex: 'm', age: 'b' },

  /* the answer, worked out from the data every time. "none" and "all" are for the very ends of the slider. */
  answer: { some: 'Higher than {n} of 100', none: 'Lower than nearly all', all: 'Higher than nearly all', rest: '{group} in a US health survey.' },
  groups: { m: 'men', w: 'women' },
  ages: { a: 'aged 20 to 39', b: 'aged 40 to 59', c: 'aged 60 and over' },

  /* on the picture. The * ties the label to the footnote in source.range. */
  range: 'EXAMPLE RANGE*',
  past: '{n} OF 100 ARE PAST {edge} →', pastOne: '1 OF 100 IS PAST {edge} →',

  /* the hint above the picture (DRAFT (Claude): its second sentence), the slider, and the crowd buttons under the slider */
  slider: '{name} value to try',
  who: { sex: 'Sex', age: 'Age band', sexes: { m: 'man', w: 'woman' }, ageBands: { a: '20–39', b: '40–59', c: '60+' } },
  hint: 'Drag the slider to try another number. Switch the buttons to try another crowd.',

  /* the small print at the very bottom */
  demo: 'A demo: it can’t judge a real blood test, and nothing you do here is stored.',
  source: { crowd: 'Crowd: {people} {sex} in the CDC’s NHANES survey, 2015 to 2016.', range: '* Example range: ABIM table, Jan 2026.' },

  /* what the chart shows, for people who can't see it */
  picture: '{name} for {group}. The line is at {value} {unit}, with {n} of 100 people below it.',
  pictureRange: 'The example range, {lo} to {hi}, is the yellow band.',
};

export const CONTROLS = { skip: 'Skip to the tubes', pause: 'Pause motion', play: 'Play motion' };

/* The small corner link to the project page, the CV and the Figma file */
export const LINKS = { label: 'About this project', about: 'About this project', cv: 'CV', figma: 'Figma' };

/* DRAFT (Claude). Says only what the page itself does; the host keeps ordinary server logs like any website. */
export const PRIVACY = {
  label: 'Privacy note',
  text: 'This page sets no cookies, runs no analytics and stores nothing you do here. The numbers are examples, not anyone’s results.',
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
