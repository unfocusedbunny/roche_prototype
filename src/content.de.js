/*
 * Sangui: the German text. Same shape as content.en.js, which is the original; a test checks that the two match.
 *
 * DRAFT by Claude, 19 Nov 2026, translated from the English: Mimi to review every line.
 * Choices made in the draft, each easy to change:
 *   - The reader is addressed as "Sie".
 *   - Standard German spelling (ß). A Swiss version would write ss.
 *   - Decimal numbers use a comma (15,6). The chart does that by itself; in the texts below it is typed.
 *   - The Latin names on the 3D models, the two sources and the unit signs stay as they are.
 *
 * Only words live here. The chart settings (starting numbers, windows, ranges) are taken from the English file,
 * so a number is never written twice.
 */
import * as en from './content.en.js';

export const SHOW_GAPS = en.SHOW_GAPS;

export const TITLE = {
  name: 'Sangui',
  lines: [
    'Ein Prototyp für meine Bewerbung bei Roche. Er zeigt, was ich mit Figma, 3D und KI-Coding-Tools umsetzen kann.',
    'Inspiriert von meinem eigenen Versuch, meine Blutwerte zu verstehen.',
    'Tools: Figma · React · three.js · Claude Code',
  ],
  tools: en.TITLE.tools,
  scroll: 'Nach unten scrollen',
};

export const STEPS = {
  1: [
    'Ich habe eine chronische Anämie, deshalb wird mein Blut regelmäßig untersucht.',
    'Meist bekomme ich zwischen zwei Terminen am Telefon eine Zahl genannt, und sie sagt mir nichts: Ich weiß nicht, was normal ist oder wo ich stehe.',
  ],
  2: [
    'Eine KI könnte mir meine Ergebnisse erklären, aber dafür müsste ich meine Gesundheitsdaten aus der Hand geben.',
  ],
  3: [
    'Also habe ich mir selbst ein Tool gebaut: Man nimmt den eigenen (oder irgendeinen) Wert und sieht, wo er liegt, im Vergleich zu einem Beispielbereich.',
  ],
  4: [
    'Eine US-Gesundheitsstudie* dient als Referenz, um die Werte nach Altersgruppe und Geschlecht einzuordnen.',
  ],
  small: {
    4: '*Daten: NHANES 2015–2016 (CDC). Ich habe amerikanische Daten verwendet, weil sie frei zugänglich sind und ich schnell an sie herankam.',
  },
  5: {
    heading: 'Das sind Beispielröhrchen.',
    body: 'Ein Bluttest verteilt sich auf drei Röhrchen. Die Farbe der Kappe zeigt dem Labor, welche Werte bestimmt werden: Blutbild und Blutzucker, Blutfette und Eisen.',
  },
  6: {
    prompt: 'Eins auswählen',
    note: [
      'In einer echten Version könnten Sie Ihren eigenen Befund sicher mitbringen. Diese hier nimmt bewusst keine Uploads an. Sie können ',
      'den Regler auf Ihren eigenen Wert schieben',
      ', und nichts, was Sie hier tun, wird erfasst oder gespeichert.',
    ],
  },
};

/* One value: the English entry with its settings, and German words laid over it */
const value = (tube, i, words, chartWords) => {
  const v = en.TUBES[tube].values[i];
  return { ...v, ...words, chart: { ...v.chart, ...chartWords } };
};

export const TUBES = [
  {
    owner: 'Blutfette',
    values: [
      value(
        0,
        0,
        {
          name: 'LDL-Cholesterin',
          lead: 'Das Cholesterin, das sich in den Wänden Ihrer Arterien ablagern kann.',
          body: 'LDL-Partikel bringen Cholesterin in die Gewebe des Körpers. Was übrig bleibt, lagert sich über Jahre langsam in den Arterienwänden ab, daher „schlechtes“ Cholesterin, obwohl der Körper etwas davon braucht.',
        },
        {
          unitName: 'Millimol pro Liter',
          text: [
            'Für LDL gibt es keinen einheitlichen Bereich.',
            'Der richtige Wert hängt von Ihrem Gesamtrisiko ab.',
          ],
        },
      ),
    ],
  },
  {
    owner: 'Blutbild und Zucker',
    values: [
      value(
        1,
        0,
        {
          name: 'Hämoglobin',
          lead: 'Transportiert Sauerstoff von der Lunge in den ganzen Körper.',
          body: 'Es ist ein eisenhaltiges Protein in Ihren roten Blutkörperchen. Jede Zelle enthält etwa 270 Millionen davon; sie nehmen in der Lunge Sauerstoff auf und geben ihn im Körper wieder ab.',
        },
        {
          unitName: 'Gramm pro Deziliter',
          text: {
            below: [
              'Niedrig (Anämie):',
              'oft zu wenig Eisen, Blutverlust, zu wenig Vitamin B12 oder Folsäure oder eine chronische Erkrankung. In der Schwangerschaft ebenfalls niedriger.',
            ],
            in: ['Im Bereich:', 'eine typische Menge für diesen Bereich.'],
            above: [
              'Hoch:',
              'Rauchen, große Höhe oder Flüssigkeitsmangel zum Zeitpunkt des Tests. Seltener eine Erkrankung von Lunge, Herz oder Knochenmark.',
            ],
          },
        },
      ),
      value(
        1,
        1,
        {
          name: 'HbA1c',
          lead: 'Ihr durchschnittlicher Blutzucker der letzten 2–3 Monate.',
          body: 'Zucker bleibt am Hämoglobin haften, und rote Blutkörperchen leben etwa 3 Monate. Der Wert zeigt deshalb Ihren Durchschnitt, nicht nur den Tag des Tests.',
        },
        {
          unitName: 'Prozent',
          text: {
            below: ['Im Bereich:', 'ein typischer durchschnittlicher Blutzucker.'],
            in: [
              'Bereich mit erhöhtem Risiko:',
              'kein Diabetes. Ein frühes Signal, das sich durch Veränderungen bei Bewegung, Ernährung und Gewicht oft wieder senken lässt.',
            ],
            above: [
              'Diabetes-Bereich:',
              'ein einzelnes Ergebnis ist meist noch keine Diagnose; in der Regel wird es mit einem weiteren Test bestätigt.',
            ],
          },
        },
      ),
    ],
  },
  {
    owner: 'Eisen',
    values: [
      value(
        2,
        0,
        {
          name: 'Serumeisen',
          lead: 'Dieses Eisen zählt Ihr Test nicht mit. Er misst das Eisen, das in Ihrem Blut unterwegs ist.',
        },
        {
          unitName: 'Mikromol pro Liter',
          text: {
            below: [
              'Niedrig:',
              'Blutverlust (starke Regelblutungen oder langsame Blutungen im Magen-Darm-Trakt), zu wenig Eisen in der Nahrung, eine Darmerkrankung, bei der Eisen schlecht aufgenommen wird, oder eine Schwangerschaft. Auch Entzündungen oder Infektionen können den Wert senken, obwohl die Eisenspeicher des Körpers gefüllt sind.¹ ²',
            ],
            in: ['Im Bereich:', 'eine typische Menge für diesen Bereich.'],
            above: [
              'Hoch:',
              'manchmal nur eine Frage des Zeitpunkts, etwa wenn kurz vor dem Test Eisen eingenommen wurde. Seltener zu viel gespeichertes Eisen im Körper (Hämochromatose), eine Leberentzündung, ein zu schneller Abbau roter Blutkörperchen oder viele Bluttransfusionen.¹',
            ],
          },
          textAt: {
            '9.0': [
              'Im Bereich:',
              'Der Wert liegt genau am unteren Rand des Beispielbereichs, 9,0 bis 26,9.',
            ],
          },
        },
      ),
    ],
  },
];

export const LABELS = {
  tubes: TUBES.map((t) => t.owner),
  models: {
    cell: {
      fig: 'Abb. 1',
      caption: 'Rotes Blutkörperchen',
      edge: en.LABELS.models.cell.edge,
      notes: [
        ['Auf beiden Seiten eingedellt', 'Mehr Oberfläche, durch die Sauerstoff gelangen kann.'],
        [
          'Ein biegsamer Rand',
          'Es faltet sich, um durch Gefäße zu passen, die enger sind als es selbst.',
        ],
        ['Kein Zellkern', 'Den hat es aufgegeben, um Platz für Hämoglobin zu schaffen.'],
        [
          'Zucker',
          'Glukose, die am Hämoglobin haften geblieben ist. Je mehr Zucker im Blut, desto mehr bleibt haften.',
        ],
      ],
    },
    ldl: {
      fig: 'Abb. 2',
      caption: 'LDL-Partikel',
      edge: en.LABELS.models.ldl.edge,
      notes: [
        ['Die Hülle', 'Eine dünne Schicht, mit der Fett im wässrigen Blut reisen kann.'],
        ['Die Fracht', 'Cholesterin, dicht gepackt in der Mitte.'],
        ['Ein langes Protein', 'Es umschließt das ganze Partikel wie ein Gürtel.'],
      ],
    },
    iron: {
      fig: 'Abb. 3',
      caption: 'Häm mit seinem Eisen',
      edge: en.LABELS.models.iron.edge,
      notes: [
        ['Eisen', 'Ein einzelnes Atom in der Mitte des Rings.'],
        ['Häm', 'Der Ring, der es hält. Jedes Hämoglobin hat vier davon.'],
        ['Sauerstoff', 'Ein Molekül pro Eisenatom. In der Lunge aufgenommen, im Körper abgegeben.'],
      ],
    },
  },
  note: 'Hinweis: {title}',
};

export const RESULTS = {
  back: 'Zurück zu den Röhrchen',
  values: 'Werte in diesem Röhrchen',
  opened: 'Jetzt zu sehen: {name}.',
  valueGap: 'Die Beispielzahl folgt noch.',
  textGap: 'Der Text zu dieser Zahl folgt noch.',
};

export const CHART = {
  line: 'Sie',
  startCrowd: en.CHART.startCrowd,

  /* "Höher als bei 67 von 100" + "Männern zwischen 40 und 59 Jahren in einer US-Gesundheitsstudie." */
  answer: {
    some: 'Höher als bei {n} von 100',
    none: 'Niedriger als bei fast allen',
    all: 'Höher als bei fast allen',
    rest: '{group} in einer US-Gesundheitsstudie.',
  },
  groups: { m: 'Männern', w: 'Frauen' },
  groupsCount: { m: 'Männer', w: 'Frauen' },
  ages: { a: 'zwischen 20 und 39 Jahren', b: 'zwischen 40 und 59 Jahren', c: 'ab 60 Jahren' },

  range: 'BEISPIELBEREICH*',
  past: '{n} VON 100 LIEGEN ÜBER {edge} →',
  pastOne: '1 VON 100 LIEGT ÜBER {edge} →',

  slider: '{name}: Wert zum Ausprobieren',
  who: {
    sex: 'Geschlecht',
    age: 'Altersgruppe',
    sexes: { m: 'Mann', w: 'Frau' },
    ageBands: en.CHART.who.ageBands,
  },
  hint: 'Ziehen Sie den Regler, um eine andere Zahl auszuprobieren. Wechseln Sie mit den Buttons die Vergleichsgruppe.',

  demo: 'Eine Demo: Sie kann keinen echten Bluttest beurteilen, und nichts, was Sie hier tun, wird gespeichert.',
  source: {
    crowd: 'Vergleichsgruppe: {people} {sex} aus der NHANES-Studie der CDC, 2015 bis 2016.',
    range: '* Beispielbereich: ABIM-Tabelle, Jan. 2026.',
  },

  picture:
    '{name} bei {group}. Die Linie steht bei {value} {unit}, {n} von 100 Personen liegen darunter.',
  pictureRange: 'Der Beispielbereich, {lo} bis {hi}, ist das gelbe Band.',
};

export const CONTROLS = {
  skip: 'Direkt zu den Röhrchen',
  pause: 'Bewegung anhalten',
  play: 'Bewegung fortsetzen',
};

/* The project page and the CV are in English only, and their labels say so */
export const LINKS = {
  label: 'Über dieses Projekt',
  about: 'Über dieses Projekt (Englisch)',
  made: 'Wie Sangui entstanden ist (Englisch)',
  aboutShort: 'Über',
  cv: 'Lebenslauf (Englisch)',
  figma: 'Figma',
};

export const PRIVACY = {
  label: 'Datenschutzhinweis',
  text: 'Diese Seite setzt keine Cookies, nutzt keine Analyse-Tools und speichert nichts von dem, was Sie hier tun. Die Zahlen sind Beispiele, keine echten Ergebnisse einer Person.',
};

export const PICTURE = {
  steps: [
    '',
    'Ein Ständer mit acht Blutentnahmeröhrchen.',
    'Drei Röhrchen mit gelber, violetter und rostroter Kappe steigen aus dem Ständer auf.',
    'Drei Blutentnahmeröhrchen, daneben ein gedruckter Befundbogen.',
    'Der Befundbogen bewegt sich auf die Röhrchen zu.',
    'Der Befundbogen ist zum Etikett eines Röhrchens geworden. Alle drei Röhrchen sind beschriftet.',
    'Drei Blutentnahmeröhrchen mit gelber, violetter und rostroter Kappe.',
  ],
  models: {
    cell: 'Ein rotes Blutkörperchen.',
    ldl: 'Ein LDL-Partikel mit einem Band darum.',
    iron: 'Ein Ring mit einem Eisenatom in der Mitte, auf dem ein Sauerstoffmolekül landet.',
  },
  stage: '3D-Bühne. Mit den Pfeiltasten drehen Sie die Röhrchen oder das Modell.',
};

/* The link to the other language, in the top corner. Its words are in that language. */
export const LANGUAGE = {
  code: 'de',
  other: 'en',
  label: 'EN',
  tip: 'English version',
  /* shown under the switch on the title page. Translated from Mimi's English sentence: DRAFT. */
  note: 'Deutsche Fassung mit KI übersetzt und geprüft.',
};

export const PLAIN = {
  note: 'Dieser Browser kann den 3D-Teil nicht anzeigen, deshalb hier die Geschichte als Text.',
};
