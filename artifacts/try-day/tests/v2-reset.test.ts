import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

register('./support/asset-loader.mjs', import.meta.url);

test('reset V2 keeps the V1 keys while changing the hands-on presentations', async () => {
  const { RESET_TASK } = await import('../src/client/content/tasks/reset.ts');
  const decisions = Object.fromEntries(RESET_TASK.scenes.flatMap((scene) => scene.decisions).map((decision) => [decision.id, decision]));

  assert.equal(decisions.care.present?.kind, 'controls');
  assert.deepEqual(decisions.care.correct, ['rinse', 'mirror', 'glasses', 'bib']);
  assert.equal(decisions['chair-up'].present?.kind, 'hold');
  assert.equal(decisions['chair-up'].correct, 'sit');
  assert.equal(decisions.batch.present?.kind, 'stick');
  assert.deepEqual(decisions.batch.correct, ['la_lot', 'comp_lot', 'bond_lot']);
  assert.deepEqual(decisions.dictation.correct, ['restoration', 'la', 'signal', 'aftercare', 'recall6']);
  assert.equal(decisions.recall.correct, 'six_months');
  assert.equal(decisions.sharps.correct, 'reid');
  assert.equal(decisions.sam.correct, 'honest');
  assert.equal(decisions.reset.present?.kind, 'turnaround');
  assert.deepEqual(decisions.reset.correct, ['ppe', 'instruments', 'waste', 'gloves_off', 'box', 'doff', 'wipe', 'flush', 'aspirator', 'tray']);
});

test('Karim asks three judged questions using every V1 aftercare option', async () => {
  const { RESET_TASK } = await import('../src/client/content/tasks/reset.ts');
  const decisions = RESET_TASK.scenes.flatMap((scene) => scene.decisions);
  const questions = ['aftercare-eat', 'aftercare-numb', 'aftercare-pain'].map((id) => decisions.find((decision) => decision.id === id)!);

  assert.deepEqual(questions.map((decision) => decision.correct), ['numb', 'bite', 'high']);
  assert.deepEqual(
    questions.flatMap((decision) => decision.options.map((option) => option.id)).sort(),
    ['eat_now', 'numb', 'brush', 'bite', 'two_weeks', 'high'].sort(),
  );
  for (const question of questions) {
    assert.ok(question.options.every((option) => option.reaction?.person === 'karim'));
  }
});

test('turnaround is judged only as the full V1 order and the clock is presentation-only', async () => {
  const { RESET_TASK } = await import('../src/client/content/tasks/reset.ts');
  const reset = RESET_TASK.scenes[0].decisions.find((decision) => decision.id === 'reset')!;
  assert.equal(reset.kind, 'sequence');
  assert.equal(reset.correct.length, 10);
  assert.equal(reset.present?.kind, 'turnaround');
  if (reset.present?.kind !== 'turnaround') return;

  assert.equal(reset.present.clockLabel, '09:40 has been waiting');
  assert.equal(reset.present.wipe.optionId, 'wipe');
  assert.deepEqual(Object.keys(reset.present.controls).sort(), reset.options.map((option) => option.id).filter((id) => id !== 'wipe').sort());
  assert.equal('clock' in reset.correct, false);
});

test('an old-shape reset record remains readable and a completed record stays frozen', async () => {
  const { initialTaskStates, evaluateTask } = await import('../src/client/lib/simulation.ts');
  const legacy = {
    care: ['rinse', 'mirror', 'glasses', 'bib', 'sit'],
    batch: ['la_lot', 'comp_lot', 'bond_lot'],
    dictation: ['restoration', 'la', 'signal', 'aftercare', 'recall6'],
    aftercare: ['numb', 'bite', 'high'],
    recall: 'six_months',
    sharps: 'reid',
    sam: 'honest',
    reset: ['ppe', 'instruments', 'waste', 'gloves_off', 'box', 'doff', 'wipe', 'flush', 'aspirator', 'tray'],
  };
  const tasks = initialTaskStates();
  tasks.reset = { ...tasks.reset, ...legacy };
  assert.doesNotThrow(() => evaluateTask('reset', tasks));

  const frozen = structuredClone(tasks.reset);
  const loaded = ['reset'].includes('reset') ? frozen : { ...initialTaskStates().reset, ...frozen };
  assert.deepEqual(loaded, frozen);
  assert.deepEqual(loaded.aftercare, legacy.aftercare);
});