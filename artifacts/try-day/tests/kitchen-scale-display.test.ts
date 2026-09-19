import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeScale, litSegments, scaleCells, scaleReading, settlingSequence } from '../src/components/kitchen/kitchen-scale-display';

test('the display blanks leading zeros and keeps two decimals, like a real bench scale', () => {
  assert.deepEqual(scaleCells(0), [' ', '0', '0', '0']);
  assert.deepEqual(scaleCells(8), [' ', '8', '0', '0']);
  assert.deepEqual(scaleCells(3), [' ', '3', '0', '0']);
  assert.deepEqual(scaleCells(12.34), ['1', '2', '3', '4']);
  assert.deepEqual(scaleCells(7.985), [' ', '7', '9', '9']);
});

test('anything the scale cannot weigh shows the overload dashes rather than a wrong number', () => {
  assert.deepEqual(scaleCells(15.01), ['-', '-', '-', '-']);
  assert.deepEqual(scaleCells(-1), ['-', '-', '-', '-']);
  assert.deepEqual(scaleCells(Number.NaN), ['-', '-', '-', '-']);
});

test('every digit lights a distinct, valid set of segments', () => {
  const seen = new Set<string>();
  for (const char of '0123456789') {
    const key = [...litSegments(char)].sort().join('');
    assert.ok(key.length > 0, `${char} lights something`);
    assert.ok(!seen.has(key), `${char} is not drawn the same as another digit`);
    seen.add(key);
  }
  assert.deepEqual(litSegments(' '), []);
  assert.deepEqual(litSegments('?'), []);
});

test('the settling sequence hunts around the weight and always ends on the true value', () => {
  for (const kg of [3, 8, 0.5, 12]) {
    const sequence = settlingSequence(kg);
    assert.equal(sequence.at(-1), kg);
    assert.ok(sequence.length >= 4);
    assert.ok(sequence.some((value) => value > kg), `${kg} overshoots`);
    assert.ok(sequence.some((value) => value < kg), `${kg} undershoots`);
    assert.ok(sequence.slice(0, -1).some((value) => value !== kg), `${kg} does not sit on the answer before it settles`);
    assert.ok(sequence.every((value) => value >= 0));
  }
});

test('the reading and description match what is on the display', () => {
  assert.equal(scaleReading(8), '8.00 kg');
  assert.equal(describeScale('idle', 8), 'Bench scales reading 0.00 kg, nothing on the platform.');
  assert.match(describeScale('settling', 8), /settling/);
  assert.match(describeScale('stable', 8), /8\.00 kg/);
});
