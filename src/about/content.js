/*
 * How Sangui was made: every word on the page lives here.
 *
 * The page is a short case study (Mimi's outline, 15 Nov 2026): cover, facts, context, the prototype,
 * key design moments, design system, reflections, who did what. It is not a day-by-day account.
 *
 * Nothing is made up to fill a gap: anything written as [MIMI: …] is shown on the page as a yellow note until
 * Mimi replaces it with her own text. To fill one in, replace the whole bracket.
 *
 * The texts are Mimi's own words or were drafted with AI from the working log and the handoffs. Mimi has reviewed all of them.
 */

export const TOP = {
  /* the line at the very top: back to the prototype, then where you are */
  back: 'Sangui prototype',
  here: 'Case study',
  cover: {
    file: 'title.png',
    alt: 'The title page of the Sangui prototype: the word Sangui in cream on red, with soft darker red blobs behind it.',
  },
  title: 'How Sangui was made',
  /* the lead starts with the name, which links to the prototype */
  name: 'Sangui',
  lead: ' is a scroll-driven prototype that explains a blood test visually and in plain language. Seeing where I land on a chart helps me understand and remember my result better than ranges of numbers in a table. I started it on 10 Nov 2026 for the Generative AI Designer internship at Roche.',
  /* the row of facts under the title. "Role" is the wording of the project card on Mimi's portfolio. */
  facts: [
    ['Role', ['Idea, story and design', 'Built by directing AI coding tools']],
    ['Timeline', ['10–15 Nov 2026']],
    ['Tools', ['Figma', 'React · three.js', 'Claude · Claude Code']],
    ['Made for', ['Generative AI Designer internship, Roche']],
  ],
  links: { figma: 'Figma file', cv: 'CV (PDF)' },
};

/* the list of sections at the side of the page; the ids match the sections in About.jsx */
export const NAV = {
  label: 'On this page',
  items: [
    ['context', 'Context'],
    ['prototype', 'The prototype'],
    ['moments', 'Key design moments'],
    ['system', 'Design system'],
    ['reflections', 'Reflections'],
    ['credit', 'Who did what'],
  ],
};

export const WHY = {
  heading: 'Context',
  /* Mimi's story, dictated on 15 Nov 2026 and shortened by Claude Code. No values of her own appear. */
  story:
    'I have chronic anemia, so my blood gets checked regularly. I’m usually told a number on the phone between appointments, and it means nothing to me: I don’t know what’s normal or where I stand. Pasting my results into an AI would explain them, but that means handing over my health data. So I built what I wanted: **pick a value and see where it sits**, against an example range and against people of your sex and age, with nothing stored.',
};

export const WHAT = {
  heading: 'The prototype',
  /* The screenshot sits in public/how-it-was-made/. Taken from the prototype on 15 Nov 2026 by Claude Code; swap the file to change it. */
  shot: {
    file: 'tubes.png',
    alt: 'Three blood tubes with yellow, purple and rust red caps under the handwritten words “Pick one”.',
  },
  /* Mimi's own text of 16 Nov 2026, with her reasons kept; tidied by Claude Code */
  points: [
    'Pick a vial: blood fats (yellow cap), blood count and sugar (purple) or iron (rust red), with medically accurate cap colours. We started with vials that belonged to three different example patients. To keep the next steps simple, we made the user the patient instead.',
    'Once a vial is picked, the camera dives in and lands on a [3D model](#model) you can turn, with labels that tell you more. It is a stylised version of what the result measures. I thought this was a fun way to engage the user.',
    'Each result is explained in plain words and shown against an example range and against a crowd from a [US health survey](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/default.aspx?BeginYear=2015). You can slide to any number and switch the crowd. Seeing data this way has always been crucial for understanding what a result actually means for me.',
    'The beauty of entering your own numbers is that nothing has to be uploaded, stored or sent to an AI model. A real version might offer a way to upload a whole blood test result.',
  ],
};

/* The 3D card. The still is a picture of the same card, shown until the reader asks for the 3D and kept if 3D can't run. */
export const CELL = {
  still: {
    file: 'cell.png',
    alt: 'A red blood cell drawn in 3D in flat reds with a dark outline, with three small markers and the handwritten word Erythrocytus along its edge.',
  },
  stage: 'The red blood cell in 3D. Use the arrow keys to turn it.',
  load: 'Load the 3D model',
  note: 'The same model as in the prototype. It loads about 0.2 MB when you ask for it.',
  hint: 'Drag to turn it, or use the arrow keys. Tap a dot for a note.',
  failed: 'This browser can’t show the 3D model, so here is a picture of it.',
};

/* How the 3D cell developed: Mimi's screenshots of early versions from the 3D chat (cropped by Claude Code), shown under the 3D card.
   The first picture is tall and sits at the left; the other two are stacked beside it.
   `text` sits under the heading and is Mimi's own wording (16 Nov 2026); its last sentence is from the working log, entry 18.
   `who` stays under the pictures. */
export const PATH = {
  title: 'How the 3D developed',
  shots: [
    {
      file: 'cell-styles.png',
      w: 680,
      h: 930,
      alt: 'Three style options drawn as small diagrams: A, exploded layers of flat planes; B, a faceted solid; C, a wireframe sphere with coloured dots.',
    },
    {
      file: 'cell-stream.png',
      w: 1472,
      h: 774,
      alt: 'An early flat version: pink red cells, purple white cells and small green platelets scattered over a dark background.',
    },
    {
      file: 'cell-three.png',
      w: 1472,
      h: 640,
      alt: 'An early 3D version titled “Your blood”: a salmon red blood cell, a turquoise white cell and three yellow platelets in flat shading with pale outlines, on dark blue.',
    },
  ],
  text: 'I had the look in mind but not its name, so Claude drew three style options. I picked the faceted solid, and asked for it to be cartoony so that it feels friendly. Of the cell versions that followed, I only liked the one with all three cell types together, so we went with it. The prototype later kept one of them: the red blood cell above.',
  who: 'Concept and art direction: Mimi · Technique and code: Claude in chat',
};

/*
 * Key design moments: the four Mimi picked on 15 Nov 2026. `chart: true` puts the working crowd chart under that moment.
 * `shots` are that moment's pictures, shown in one row at the same height.
 * The headings are plain names, at Mimi's request. The facts are from the working log (entries 44 to 46) and the chart handoff.
 */
export const MOMENTS = {
  heading: 'Key design moments',
  items: [
    {
      key: 'slider',
      title: 'The slider',
      text: [
        'The first built version let the reader switch the crowd while the result stayed fixed, as Claude had proposed. I found it convoluted that one patient could be any age or sex with the same result. More importantly, I couldn’t check my own result, which was the original use case. So we added a slider, and made the “you” line on the chart draggable too. Both go only as far as the data we used.',
        /* both paragraphs: Mimi's own text of 16 Nov 2026, tidied by Claude Code */
        'Fun fact: the prototype used to have a made-up patient called Robin. The name works for any gender, and it was once my dog’s. Once the slider let people set their own value, we dropped example patients altogether. Now the reader is the patient, and the line on the chart says “you”.',
      ],
      who: 'Slider idea: Mimi · Prototype: Claude in chat · Build: Claude Code',
      chart: true,
      chartNote: 'The working chart from the prototype. Try it.',
    },
    {
      key: 'hill',
      title: 'The chart type',
      text: [
        'The first chart was 100 dots, one for each person in a hundred. I rejected it: not original, and not in Sangui’s style. From my references of smooth curves and bold shapes, Claude drew three mock-ups on real hemoglobin numbers, and I chose the hill.',
      ],
      who: 'References, brief and choice: Mimi · Mock-ups: Claude in chat',
      /* Mimi's exports from the canvas "Blood test explainer: the crowd" (10 Nov 2026), made smaller. w and h are the pictures' sizes in pixels. */
      shots: [
        {
          file: 'dots-1.png',
          w: 507,
          h: 1300,
          alt: 'The first mock-up on a phone screen: an LDL value of 4.4 above a small chart of 100 dots in a box, with boxes of text under it.',
        },
        {
          file: 'dots-2.png',
          w: 487,
          h: 1300,
          alt: 'The poster version on a phone screen: a very large 4.4, then 100 dots filling the width, with one larger red dot marked “You”.',
        },
        {
          file: 'dots-colours.jpg',
          w: 1300,
          h: 1099,
          alt: 'Six colour studies of the dot chart, five on dark blue and purple backgrounds and one on a light page.',
        },
      ],
      caption:
        'The dot versions from 10 Nov: the first mock-up, the poster version and colour studies.',
    },
    {
      key: 'data',
      title: 'The data',
      text: [
        'The crowd is the CDC’s NHANES survey, 2015 to 2016: about 5,100 adults for each value, and 2,206 for LDL. Switzerland has no representative national dataset, and EU data sits behind research applications. A prototype built on open data ends up comparing against US adults, so the chart says so.',
      ],
      who: 'CDC files downloaded by Mimi · Research and analysis: Claude in chat',
    },
    {
      key: 'range',
      title: 'The example range',
      text: [
        'The ranges come from the ABIM laboratory reference table (January 2026), which says its ranges are not targets for one person. So the yellow band is an example range; a real lab prints its own. LDL has no single range, so its chart has no band.',
      ],
      who: 'Wording: Claude in chat · LDL without a band: Mimi’s call',
    },
  ],
};

/* css: what the swatch is painted with. The first four are the shared tokens; the two other cap colours are the scene's own.
   The yellow is one colour with two jobs (the highlight and the yellow cap), so it is shown once. */
export const SYSTEM = {
  heading: 'Design system',
  credit:
    'The colours, the fonts and the design of the Figma file are Mimi’s. Since 14 Nov Claude builds repetitive pieces in the file through the Figma connector; each one is labelled in the file.',
  colours: [
    { name: 'Morning haze', value: '#F4F1E4 → #F7DDD3 → #E6D8F3', css: 'var(--haze)' },
    { name: 'Ink', value: '#1E2145', css: 'var(--ink)' },
    { name: 'Cell red', value: '#D9482F', css: 'var(--red)' },
    { name: 'Highlight and yellow cap', value: '#F0E66E', css: 'var(--yellow)' },
    { name: 'Purple cap', value: '#6A4E9E', css: '#6A4E9E' },
    { name: 'Rust red cap', value: '#A84E1B', css: '#A84E1B' },
  ],
  figma: {
    show: 'Show the Figma file',
    link: 'Open it in Figma',
    note: 'Nothing loads from Figma until you ask for it.',
    title: 'The Sangui Figma file',
  },
};

/* The mistakes are from the handoff's "mistakes worth keeping". */
export const REFLECTIONS = {
  heading: 'Reflections',
  mistakesTitle: 'Mistakes',
  /* Mimi's own two come first: the first in her words, the second drafted from the working log (entry 46) and approved by her, 15 Nov 2026 */
  mistakes: [
    'I missed the application deadline, but I finished it anyway.',
    'My made-up patient, Robin, confused the one person who tested it. Robin is gone; the reader is the patient now.',
    'Claude named a CDC file for iron that does not exist for 2015–2016.',
    'Claude first proposed keeping the result fixed while the crowd changed. That is the version I found convoluted.',
  ],
  /* from Mimi's dictation, 15 Nov 2026, tidied by Claude Code */
  own: 'Working with an LLM like Claude made me far more productive than I expected, even in a rush. But it only works if you stay organised: write proper handoffs and structure the work, so that different chats and agents stay in sync and don’t work over each other. The LLM can take the boring work off you. It can’t replace your own ideas, your creativity or your critical eye.',
  limits:
    'A prototype takes liberties. Of the blood cells, only the red one is modelled. White cells and platelets are not in this version yet (a time call). The iron model is a diagram and not the real molecule, and the cap colours are adapted to the palette. A real version would need consent and secure handling of results, medical-device rules, clinician review of every text, and testing with patients.',
};

export const CREDIT = {
  heading: 'Who did what',
  columns: ['Mimi', 'Claude (chats)', 'Claude Code'],
  rows: [
    [
      'Idea, story, design decisions, Figma',
      '✓',
      'repetitive Figma pieces, labelled in the file',
      '',
    ],
    ['3D models and scene', 'direction and feedback', '✓', ''],
    [
      'Crowd chart',
      'decisions and the slider idea',
      'mock-ups, prototypes, data analysis',
      'build',
    ],
    ['Page code, this page, deploy', 'direction and feedback', 'first version', '✓ (since 12 Nov)'],
  ],
  note: 'Explanation texts drafted with AI, reviewed by Mimi.',
};

export const FOOTER = {
  cv: 'CV (PDF)',
  figma: 'Figma',
  site: 'unfocused.ch',
  siteUrl: 'https://unfocused.ch',
  email: 'mimi@unfocused.ch',
};
