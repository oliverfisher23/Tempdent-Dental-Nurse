import assert from 'node:assert/strict';
import test from 'node:test';
import { FRIDGE_UNITS, OVERNIGHT_LOG } from '../src/content/activities';
import { handoverRoundSaved, handoverRowComplete, nextHandoverUnit } from '../src/lib/handover-round';
import { evaluateTask, initialTaskStates, testProgress } from '../src/lib/simulation';

test('the fridge round still needs deliberate saved records, not probes or media completion', () => {
  const tasks = initialTaskStates();
  const round = tasks['take-the-handover'];
  round.logRead = OVERNIGHT_LOG.map(entry => entry.time);
  for (const unit of FRIDGE_UNITS) {
    assert.equal(nextHandoverUnit(round)?.id, unit.id);
    round.rows[unit.id] = {
      probed: true, reading: String(unit.actualC), time: '06:45',
      initials: 'AB', note: unit.id === 'larder-2' ? 'Moved rice and melon to larder one; kept the door shut.' : '',
      recorded: false,
    };
    assert.equal(handoverRowComplete(unit.id, round.rows[unit.id]), true);
    assert.equal(nextHandoverUnit(round)?.id, unit.id, 'drafts must not advance the round');
    assert.equal(handoverRoundSaved(round), false);
    round.rows[unit.id].recorded = true;
  }
  assert.equal(handoverRoundSaved(round), true);
  assert.equal(evaluateTask('take-the-handover', tasks).done, true);
});

test('wrong readings, missing initials and the warm-fridge note remain mandatory', () => {
  const state = testProgress(null).tasks['take-the-handover'];
  for (const unit of FRIDGE_UNITS) {
    const valid = state.rows[unit.id];
    assert.equal(handoverRowComplete(unit.id, valid), true);
    for (const change of [{ probed: false }, { reading: 'abc' }, { reading: '55' }, { initials: '' }, { time: '' }]) {
      assert.equal(handoverRowComplete(unit.id, { ...valid, ...change }), false);
    }
  }
  assert.equal(handoverRowComplete('larder-2', { ...state.rows['larder-2'], note: '' }), false);
});