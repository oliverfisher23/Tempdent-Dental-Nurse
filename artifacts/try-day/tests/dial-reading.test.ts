import assert from 'node:assert/strict';
import test from 'node:test';
import { FRIDGE_UNITS } from '../src/content/activities';
import { rowReadingIsRight } from '../src/lib/simulation';
import { dialAngle, dialReading, dialZones } from '../src/components/scenes/handover/dial-scale';

test('a careful dial reading of every fridge is accepted, a full degree out is not', () => {
  for (const unit of FRIDGE_UNITS) {
    assert.ok(rowReadingIsRight(unit.id, dialReading(unit.actualC)), `${unit.id} nearest half degree`);
    assert.ok(rowReadingIsRight(unit.id, String(Math.round(unit.actualC))), `${unit.id} nearest whole degree`);
    assert.ok(!rowReadingIsRight(unit.id, (unit.actualC + 1).toFixed(1)), `${unit.id} a degree warm`);
    assert.ok(!rowReadingIsRight(unit.id, (unit.actualC - 1).toFixed(1)), `${unit.id} a degree cold`);
  }
});

test('the dial scale maps -30 to +30 over 270 degrees with zero at the top', () => {
  assert.equal(dialAngle(-30), -135);
  assert.equal(dialAngle(0), 0);
  assert.equal(dialAngle(30), 135);
  assert.equal(dialAngle(45), 135, 'clamped at the end of the scale');
  assert.equal(dialReading(3.4), '3.5');
  assert.equal(dialReading(-20.5), '-20.5');
  assert.equal(dialReading(4.1), '4');
});

test('the green band ends at the unit limit for fridges and freezers alike', () => {
  const fish = dialZones(2);
  assert.deepEqual(fish.find(zone => zone.tone === 'safe'), { from: 0, to: 2, tone: 'safe' });
  assert.equal(fish.find(zone => zone.tone === 'warm')?.from, 2);
  const freezer = dialZones(-18);
  assert.deepEqual(freezer, [
    { from: -30, to: -18, tone: 'safe' },
    { from: -18, to: 30, tone: 'warm' },
  ]);
});
