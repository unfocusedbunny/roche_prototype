/* Checks that the page's words and chart settings fit the survey data and the 3D scene. Run with: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TUBES, LABELS, CHART } from './content.js';
import * as en from './content.en.js';
import * as de from './content.de.js';
import { TUBES as SCENE_TUBES } from './sangui/sangui-scene.js';

const crowds = JSON.parse(readFileSync(new URL('./data/crowds.json', import.meta.url), 'utf8'));
const values = TUBES.flatMap((t) => t.values);
const onStep = (x, min, step) => Math.abs((x - min) / step - Math.round((x - min) / step)) < 1e-6;

test('there is one tube of text for each tube in the scene, each with a name', () => {
  assert.equal(TUBES.length, SCENE_TUBES.length);
  assert.equal(LABELS.tubes.length, SCENE_TUBES.length);
  assert.ok(LABELS.tubes.every((name) => typeof name === 'string' && name.length > 0));
});

test('every 3D model has a caption, an edge name and three notes (the cell has a fourth, for the sugar)', () => {
  for (const { model } of SCENE_TUBES) {
    const text = LABELS.models[model];
    assert.ok(text, `no words for the model "${model}"`);
    assert.ok(text.fig && text.caption && text.edge, model);
    assert.equal(text.notes.length, model === 'cell' ? 4 : 3, model);
    assert.ok(
      text.notes.every((n) => n.length === 2 && n[0] && n[1]),
      model,
    );
  }
});

test('every chart points at data that exists, and starts on a number the table has', () => {
  for (const v of values) {
    if (!v.value || !v.chart) continue;
    const data = crowds.values[v.chart.data];
    assert.ok(data, `${v.key}: no survey data called "${v.chart.data}"`);
    const [from, to] = v.chart.window;
    const start = +v.value;
    assert.ok(from >= data.axis.min && to <= data.axis.max, `${v.key}: the window leaves the data`);
    assert.ok(start >= from && start <= to, `${v.key}: the starting number is outside the window`);
    assert.ok(onStep(start, data.axis.min, data.step), `${v.key}: ${v.value} is not on a step`);
    assert.ok(onStep(from, data.axis.min, data.step), `${v.key}: the window must start on a step`);
    assert.ok(onStep(to, data.axis.min, data.step), `${v.key}: the window must end on a step`);
  }
});

test('example ranges are given for both sexes, lowest number first', () => {
  for (const v of values) {
    const range = v.chart && v.chart.range;
    if (!range) continue;
    for (const sex of Object.keys(CHART.groups)) {
      assert.ok(range[sex] && range[sex][0] < range[sex][1], `${v.key} ${sex}`);
    }
  }
});

test('a chart whose text follows the number has a text for below, in and above', () => {
  for (const v of values) {
    const text = v.chart && v.chart.text;
    if (!text || Array.isArray(text)) continue;
    for (const zone of ['below', 'in', 'above']) {
      assert.equal(text[zone]?.length, 2, `${v.key}: ${zone}`);
    }
  }
});

/* The German text has to have every piece the English has: the same entries, lists of the same length, the same
   {…} gaps in each sentence, and the very same numbers and settings. */
const gaps = (text) => (text.match(/\{\w+\}/g) || []).sort().join(' ');
function sameShape(a, b, where) {
  assert.equal(typeof b, typeof a, where);
  if (typeof a === 'string') {
    assert.equal(b.length > 0, a.length > 0, `${where}: one language has no text here`);
    assert.equal(gaps(b), gaps(a), `${where}: the {…} gaps differ`);
  } else if (a && typeof a === 'object') {
    assert.ok(b, where);
    assert.equal(Array.isArray(b), Array.isArray(a), where);
    assert.deepEqual(Object.keys(b).sort(), Object.keys(a).sort(), `${where}: different entries`);
    for (const key of Object.keys(a)) sameShape(a[key], b[key], `${where}.${key}`);
  } else {
    assert.equal(b, a, `${where}: settings must be the same in both languages`);
  }
}
test('the German text has the same shape as the English text', () => {
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
  for (const name of Object.keys(en)) sameShape(en[name], de[name], name);
});
