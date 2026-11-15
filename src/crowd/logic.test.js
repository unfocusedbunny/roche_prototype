/* Checks for the sums behind the crowd chart. Run with: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  scaleFor,
  heightAt,
  hillHeights,
  belowCount,
  answerKind,
  rangeStatus,
  pastEdge,
  hillPaths,
  ease,
  mix,
} from './logic.js';

const crowds = JSON.parse(readFileSync(new URL('../data/crowds.json', import.meta.url), 'utf8'));

/* a tiny made-up value: two groups, three samples from 0 to 2 */
const tiny = {
  axis: { min: 0, max: 2 },
  step: 1,
  groups: {
    a: { density: [0, 2, 1], below: [0, 40, 100] },
    b: { density: [0, 4, 0], below: [0, 50, 100] },
  },
};

test('scaleFor: the tallest group peaks at the height asked for', () => {
  assert.equal(scaleFor(tiny, 100), 25);
});

test('heightAt: passes through the stored samples and holds the ends', () => {
  assert.equal(heightAt(tiny, 'a', 10, 1), 20);
  assert.equal(heightAt(tiny, 'a', 10, 2), 10);
  assert.equal(heightAt(tiny, 'a', 10, -5), 0);
  assert.equal(heightAt(tiny, 'a', 10, 99), 10);
});

test('heightAt: never below zero, even where the smooth curve would dip', () => {
  const spike = { axis: { min: 0, max: 4 }, groups: { a: { density: [0, 0, 5, 0, 0] } } };
  for (let x = 0; x <= 4; x += 0.05) {
    assert.ok(heightAt(spike, 'a', 1, x) >= 0, `negative height at ${x}`);
  }
});

test('hillHeights: one height per sample, from the first value to the last', () => {
  const h = hillHeights(tiny, 'a', 10, 0, 2, 5);
  assert.equal(h.length, 5);
  assert.equal(h[0], 0);
  assert.equal(h[2], 20);
  assert.equal(h[4], 10);
});

test('belowCount: reads the table on its steps and stays inside it', () => {
  assert.equal(belowCount(tiny, 'a', 1), 40);
  assert.equal(belowCount(tiny, 'b', 1), 50);
  assert.equal(belowCount(tiny, 'a', -3), 0);
  assert.equal(belowCount(tiny, 'a', 50), 100);
});

test('pastEdge: the people the count leaves over', () => {
  assert.equal(pastEdge(tiny, 'a', 1), 60);
});

test('answerKind: the very ends get their own sentence', () => {
  assert.equal(answerKind(0), 'none');
  assert.equal(answerKind(37), 'some');
  assert.equal(answerKind(100), 'all');
});

test('rangeStatus: both edges of the range count as in range', () => {
  assert.equal(rangeStatus(14, 14, 18), 'in');
  assert.equal(rangeStatus(18, 14, 18), 'in');
  assert.equal(rangeStatus(13.9, 14, 18), 'below');
  assert.equal(rangeStatus(18.1, 14, 18), 'above');
  /* 0.1 + 0.2 is not exactly 0.3 in a computer; it must still count as in range */
  assert.equal(rangeStatus(0.1 + 0.2, 0, 0.3), 'in');
});

test('hillPaths: two closed shapes that meet at the line', () => {
  const { below, above, lineY } = hillPaths([0, 10, 0], 0, 10, 100, 5);
  assert.equal(lineY, 95);
  assert.ok(below.startsWith('M0 100') && below.endsWith('Z'));
  assert.ok(above.startsWith('M5 100 L5 95') && above.endsWith('Z'));
});

test('ease and mix: the glide starts at one shape and ends at the other', () => {
  assert.equal(ease(0), 0);
  assert.equal(ease(0.5), 0.5);
  assert.equal(ease(1), 1);
  assert.equal(mix(0, 10, 0.5), 5);
  assert.deepEqual(mix([0, 10], [10, 20], 0.5), [5, 15]);
});

test('the survey data has the shape the chart expects', () => {
  for (const [name, value] of Object.entries(crowds.values)) {
    const steps = Math.round((value.axis.max - value.axis.min) / value.step) + 1;
    assert.deepEqual(Object.keys(value.groups).sort(), ['ma', 'mb', 'mc', 'wa', 'wb', 'wc'], name);
    for (const [key, group] of Object.entries(value.groups)) {
      const where = `${name} ${key}`;
      assert.equal(group.density.length, 91, where);
      assert.ok(
        group.density.every((d) => d >= 0),
        where,
      );
      assert.equal(group.below.length, steps, where);
      assert.ok(
        group.below.every((b, i) => b >= 0 && b <= 100 && (i === 0 || b >= group.below[i - 1])),
        `${where}: the count below must never fall as the value rises`,
      );
    }
  }
});
