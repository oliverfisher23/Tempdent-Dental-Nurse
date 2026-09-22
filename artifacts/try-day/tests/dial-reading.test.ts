import assert from 'node:assert/strict';
import test from 'node:test';
import { dialAngle, dialReading, dialZones } from '@kit/dial-scale';

test('the reusable dial maps -30 to +30 over 270 degrees with zero at the top', () => {
  assert.equal(dialAngle(-30), -135);
  assert.equal(dialAngle(0), 0);
  assert.equal(dialAngle(30), 135);
  assert.equal(dialAngle(45), 135, 'clamped at the end of the scale');
  assert.equal(dialReading(3.4), '3.5');
  assert.equal(dialReading(-20.5), '-20.5');
  assert.equal(dialReading(4.1), '4');
});

test('dial zones can represent positive and negative safe limits', () => {
  const positive = dialZones(2);
  assert.deepEqual(positive.find((zone) => zone.tone === 'safe'), { from: 0, to: 2, tone: 'safe' });
  assert.equal(positive.find((zone) => zone.tone === 'warm')?.from, 2);
  assert.deepEqual(dialZones(-18), [
    { from: -30, to: -18, tone: 'safe' },
    { from: -18, to: 30, tone: 'warm' },
  ]);
});
