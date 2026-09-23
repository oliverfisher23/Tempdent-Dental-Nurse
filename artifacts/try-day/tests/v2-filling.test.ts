import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';

register('./support/asset-loader.mjs', import.meta.url);

const { FILLING_TASK } = await import('@client/content/tasks/filling');

const decisions = new Map(FILLING_TASK.scenes[0].decisions.map((decision) => [decision.id, decision]));
const paced = decisions.get('next')?.present;

test('filling keeps the seven judged decisions and V1 speech answer keys', () => {
  assert.deepEqual([...decisions.keys()], ['la', 'next', 'suction', 'transfer', 'signal', 'light', 'restart']);
  assert.equal(decisions.get('la')?.correct, 'leave');
  assert.equal(decisions.get('suction')?.correct, 'near');
  assert.equal(decisions.get('transfer')?.correct, 'chin');
  assert.equal(decisions.get('signal')?.correct, 'say');
  assert.deepEqual(decisions.get('light')?.correct, ['sleeved', 'shield']);
  assert.equal(decisions.get('restart')?.correct, 'clear');
});

test('paced filling owns all linked evidence and uses the authored pass order', () => {
  assert.equal(paced?.kind, 'paced');
  if (paced?.kind !== 'paced') return;
  assert.deepEqual(paced.segment.decisions, ['next', 'suction', 'transfer', 'signal', 'light']);
  assert.deepEqual(paced.segment.cues.map((cue) => cue.option), [
    'etchant', 'bond', 'composite', 'matrix', 'light', 'paper',
  ]);
  assert.deepEqual(decisions.get('next')?.correct, paced.segment.cues.map((cue) => cue.option));
  assert.ok(paced.segment.live);
  assert.ok(paced.segment.speakUp);
  assert.ok(paced.segment.fetch);
});

test('paced spots stay in the safe field area and remain separated', () => {
  assert.equal(paced?.kind, 'paced');
  if (paced?.kind !== 'paced' || !paced.segment.live) return;
  const spots = Object.values(paced.segment.live.zones);
  for (const spot of spots) {
    assert.ok(spot.x >= 8 && spot.x <= 92);
    assert.ok(spot.y >= 15 && spot.y <= 75);
  }
  for (let i = 0; i < spots.length; i += 1) {
    for (let j = i + 1; j < spots.length; j += 1) {
      assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) >= 7);
    }
  }
});