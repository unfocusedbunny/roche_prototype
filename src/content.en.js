/*
 * Sangui: every word on the page lives here, so text can be changed without touching the layout.
 * This is the English text, which also holds the chart settings. The German text is in content.de.js; content.js hands the page
 * whichever of the two the visitor asked for.
 *
 * Where the wording comes from:
 *   - Title page, story steps and the hemoglobin screen: Mimi's Figma frames (12 Nov 2026).
 *   - HbA1c, LDL and iron: the explanation texts document and the 3D mockup. Drafted with AI, reviewed by Mimi.
 *   - The words on the 3D (captions, model names, notes): the 3D mockups. Drafted with AI, reviewed by Mimi.
 *   - The crowd chart's wording, the hemoglobin texts under its slider and the starting numbers for HbA1c, LDL and iron:
 *     the chart chat's handoff (14 Nov 2026).
 *   Mimi has reviewed every text on the page.
 */

/* true: a missing number or a missing text is shown with a small "to come" note.
   false: missing parts are simply left out. Set to false before sending the link to anyone. */
export const SHOW_GAPS = false;

export const TITLE = {
  name: 'Sangui',
  lines: [
    'A prototype I made for my application to Roche. It shows what I can do with Figma, 3D and AI coding tools.',
    'Inspired by my own story of trying to understand my blood results.',
    'Tools: Figma · React · three.js · Claude',
  ],
  tools: 'Figma · React · three.js · Claude',
  scroll: 'Scroll down',
};

/* One entry per scroll step, 1 to 6. Each line fades in a moment after the one before it. */
export const STEPS = {
  1: [
    'I have chronic anemia, so my blood gets checked regularly.',
    'I’m usually told a number on the phone between appointments, and it means nothing to me: I don’t know what’s normal or where I stand.',
  ],
  2: [
    'Pasting my results into an AI would explain them, but that means handing over my health data.',
  ],
  3: [
    'So I built a tool for myself: take your (or any) value and see where it sits, against an example range.',
  ],
  4: ['A US health survey* is used as a reference to map the values against age ranges and sexes.'],
  /* small print under a step's text, on the same page. Step 4: which data, and why this data. Mimi's wording, 16 Nov 2026. */
  small: {
    4: '*Data: NHANES 2015–2016 (CDC). I used American data because it is open and I could get my hands on it quickly.',
  },
  5: {
    heading: 'These are example tubes.',
    body: 'One blood test goes into three tubes. The cap colour tells the lab which values to test: blood count and sugar, blood fats and iron.',
  },
  6: {
    prompt: 'Pick one',
    /* [before, bold, after]: the middle part is shown in bold */
    note: [
      'A real version would let you bring your own report, securely. This one takes no uploads, on purpose. You can ',
      'slide to your own number',
      ', and nothing you do here is collected or stored.',
    ],
  },
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
             sources   the footnotes the texts point to with ¹ ², shown in the small print under the chart
             pastNote  true: a small note at the right edge says how many of 100 are past the window (HbA1c only) */
export const TUBES = [
  {
    owner: 'Blood fats',
    values: [
      {
        key: 'ldl',
        name: 'LDL cholesterol',
        lead: 'The cholesterol that can build up in your artery walls.',
        body: 'LDL particles carry cholesterol to the body’s tissues. Any surplus slowly builds up in artery walls over years, hence “bad” cholesterol, though the body needs some.',
        value: '3.6',
        unit: 'mmol/L',
        /* no band and no status: the chart chat's recommendation, Mimi's call. The alternative is a shaded "optimal, under 2.6" zone. */
        chart: {
          data: 'ldl',
          unitName: 'millimoles per litre',
          window: [1, 6],
          range: null,
          text: ['LDL has no single range.', 'The right number depends on your overall risk.'],
        },
      },
    ],
  },
  {
    owner: 'Blood count and sugar',
    values: [
      {
        key: 'hemoglobin',
        name: 'Hemoglobin',
        lead: 'Carries oxygen from your lungs to the rest of your body.',
        body: 'It’s an iron-containing protein inside your red cells. Each cell holds about 270 million of them, picking up oxygen in the lungs and letting it go in the body.',
        /* in g/dL, as the survey and the range table give it (Mimi, 16 Nov 2026) */
        value: '15.6',
        unit: 'g/dL',
        chart: {
          data: 'hemoglobin',
          unitName: 'grams per decilitre',
          window: [10, 19],
          range: { m: [14, 18], w: [12, 16] },
          /* Drafted with AI, from the prototype Mimi approved in the chart chat. */
          text: {
            below: [
              'Low (anaemia):',
              'often too little iron, blood loss, low B12 or folate, or a long-term illness. Also lower in pregnancy.',
            ],
            in: ['In range:', 'a typical amount for this range.'],
            above: [
              'High:',
              'smoking, high altitude, or dehydration at the time of the test. Less often a lung, heart or bone marrow condition.',
            ],
          },
        },
      },
      {
        key: 'hba1c',
        name: 'HbA1c',
        lead: 'Your average blood sugar over the past 2–3 months.',
        body: 'Sugar sticks to hemoglobin, and red cells live about 3 months, so it reflects your average, not just the test day.',
        value: '5.8',
        unit: '%',
        /* lopsided, so the chart is zoomed in to 4.5–8.5 and says how many people are past the edge.
         The three texts follow Mimi's zones (under 5.7 · 5.7 to 6.4 · 6.5 or more), not the example range. They come from
         the explanation texts document by way of the chart handoff (14 Nov 2026). */
        chart: {
          data: 'hba1c',
          unitName: 'percent',
          window: [4.5, 8.5],
          range: { m: [4, 5.6], w: [4, 5.6] },
          pastNote: true,
          textCuts: [5.7, 6.5],
          text: {
            below: ['In range:', 'a typical average blood sugar.'],
            in: [
              'Higher-risk range:',
              'not diabetes. An early signal that changes in activity, food and weight often bring down.',
            ],
            above: [
              'Diabetes range:',
              'one result usually isn’t a diagnosis; it’s normally confirmed with another test.',
            ],
          },
        },
      },
    ],
  },
  {
    owner: 'Iron',
    values: [
      {
        key: 'iron',
        name: 'Serum iron',
        lead: 'Your test doesn’t count this iron. It measures iron on the move in your blood.',
        body: null,
        value: '9.0',
        unit: 'µmol/L',
        /* Low and high give the usual causes, with their two sources as footnotes (Mimi's text, 15 Nov 2026).
         At the starting number, which is the range's bottom edge, the text says so. */
        chart: {
          data: 'iron',
          unitName: 'micromoles per litre',
          window: [0, 40],
          range: { m: [9, 26.9], w: [9, 26.9] },
          text: {
            below: [
              'Low:',
              'blood loss (heavy periods, or slow bleeding in the gut), too little iron in food, a gut condition that absorbs iron poorly, or pregnancy. Inflammation or infection can also lower it while the body’s stores are fine.¹ ²',
            ],
            in: ['In range:', 'a typical amount for this range.'],
            above: [
              'High:',
              'sometimes just timing, such as iron taken shortly before the test. Less often too much iron stored in the body (haemochromatosis), liver inflammation, red cells breaking down too fast, or many blood transfusions.¹',
            ],
          },
          textAt: {
            '9.0': [
              'In range:',
              'It sits right at the bottom edge of the example range, 9.0 to 26.9.',
            ],
          },
          sources: [
            '¹ MedlinePlus, “Serum iron test”, US National Library of Medicine, reviewed Jan 2026.',
            '² Pasricha et al., “Iron deficiency”, The Lancet, 2021.',
          ],
        },
      },
    ],
  },
];

/* The words on the 3D, drawn by src/sangui/sangui-labels.js.
     tubes   the caption under each tube, left to right. They are the tubes' names above, so each name is written once.
     models  for each model: its figure number, its caption, the handwritten name along its edge, and its notes
             as [title, text]. The notes are in the order of the scene's markers (MARKERS in sangui-scene.js).
     note    what a marker dot is called for a screen reader; {title} is the note's title. */
export const LABELS = {
  tubes: TUBES.map((t) => t.owner),
  models: {
    cell: {
      fig: 'Fig. 1',
      caption: 'Red blood cell',
      edge: 'Erythrocytus',
      notes: [
        ['Dented on both sides', 'More surface for oxygen to pass through.'],
        ['A bendy edge', 'It folds to squeeze through vessels narrower than itself.'],
        ['No nucleus', 'It gave that up to make room for hemoglobin.'],
        /* the fourth shows only with HbA1c, on one of the hexagons. Drafted with AI, picked by Mimi (19 Nov 2026). */
        [
          'Sugar',
          'Glucose that has stuck to the hemoglobin. The more sugar in your blood, the more of it sticks.',
        ],
      ],
    },
    ldl: {
      fig: 'Fig. 2',
      caption: 'LDL particle',
      edge: 'Lipoproteinum densitatis humilis',
      notes: [
        ['The wrapper', 'A thin coat that lets fat travel in watery blood.'],
        ['The cargo', 'Cholesterol, packed in the middle.'],
        ['One long protein', 'It wraps the whole particle like a belt.'],
      ],
    },
    iron: {
      fig: 'Fig. 3',
      caption: 'Heme, with its iron',
      edge: 'Ferrum',
      notes: [
        ['Iron', 'One atom, sitting in the middle of the ring.'],
        ['Heme', 'The ring that holds it. Every hemoglobin has four.'],
        ['Oxygen', 'One molecule per iron. Picked up in the lungs, let go in the body.'],
      ],
    },
  },
  note: 'Note: {title}',
};

export const RESULTS = {
  back: 'Back to the tubes',
  /* the name of the row of buttons that switches between a tube's values, for a screen reader */
  values: 'Values in this tube',
  /* read out by a screen reader when a result opens or the value is switched; {name} is the value's name */
  opened: 'Now showing: {name}.',
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
  answer: {
    some: 'Higher than {n} of 100',
    none: 'Lower than nearly all',
    all: 'Higher than nearly all',
    rest: '{group} in a US health survey.',
  },
  groups: { m: 'men', w: 'women' },
  /* the same two words where they are counted ("801 men"): the same in English, another ending in German */
  groupsCount: { m: 'men', w: 'women' },
  ages: { a: 'aged 20 to 39', b: 'aged 40 to 59', c: 'aged 60 and over' },

  /* on the picture. The * ties the label to the footnote in source.range. */
  range: 'EXAMPLE RANGE*',
  past: '{n} OF 100 ARE PAST {edge} →',
  pastOne: '1 OF 100 IS PAST {edge} →',

  /* the hint above the picture, the slider, and the crowd buttons under the slider */
  slider: '{name} value to try',
  who: {
    sex: 'Sex',
    age: 'Age band',
    sexes: { m: 'man', w: 'woman' },
    ageBands: { a: '20–39', b: '40–59', c: '60+' },
  },
  hint: 'Drag the slider to try another number. Switch the buttons to try another crowd.',

  /* the small print at the very bottom */
  demo: 'A demo: it can’t judge a real blood test, and nothing you do here is stored.',
  source: {
    crowd: 'Crowd: {people} {sex} in the CDC’s NHANES survey, 2015 to 2016.',
    range: '* Example range: ABIM table, Jan 2026.',
  },

  /* what the chart shows, for people who can't see it */
  picture: '{name} for {group}. The line is at {value} {unit}, with {n} of 100 people below it.',
  pictureRange: 'The example range, {lo} to {hi}, is the yellow band.',
};

export const CONTROLS = { skip: 'Skip to the tubes', pause: 'Pause motion', play: 'Play motion' };

/* The small corner link to the project page, the CV and the Figma file */
export const LINKS = {
  label: 'About this project',
  about: 'About this project',
  /* the closing line at the end of every result */
  made: 'How Sangui was made',
  /* the same link on a phone, where the top row is short */
  aboutShort: 'About',
  cv: 'CV',
  figma: 'Figma',
};

/* Says only what the page itself does; the host keeps ordinary server logs like any website. */
export const PRIVACY = {
  label: 'Privacy note',
  text: 'This page sets no cookies, runs no analytics and stores nothing you do here. The numbers are examples, not anyone’s results.',
};

/* What the 3D picture shows, for people who can't see it */
export const PICTURE = {
  steps: [
    '',
    'A rack of eight blood collection tubes.',
    'Three tubes with yellow, purple and rust red caps rise out of the rack.',
    'Three blood collection tubes, and a printed results sheet beside them.',
    'The results sheet moves towards the tubes.',
    'The results sheet has become the label of one tube. All three tubes are labelled.',
    'Three blood collection tubes with yellow, purple and rust red caps.',
  ],
  models: {
    cell: 'A red blood cell.',
    ldl: 'An LDL particle with a ribbon round it.',
    iron: 'A ring with an iron atom at its centre and an oxygen molecule landing on it.',
  },
  stage: '3D stage. Arrow keys turn the tubes or the model.',
};

/* The link to the other language, in the top corner. Its words are in that language. */
export const LANGUAGE = { code: 'en', other: 'de', label: 'DE', tip: 'Deutsche Version' };

/* Shown only where the browser can't draw the 3D scene. */
export const PLAIN = { note: 'This browser can’t show the 3D part, so here is the story as text.' };
