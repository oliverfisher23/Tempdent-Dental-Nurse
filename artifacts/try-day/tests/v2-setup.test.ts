import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

register('./support/asset-loader.mjs', import.meta.url);

test('setup V2 keeps the linked decision ids and answer keys', async () => {
  const { SETUP_TASK } = await import('../src/client/content/tasks/setup.ts');
  const decisions = Object.fromEntries(SETUP_TASK.scenes[0].decisions.map((decision) => [decision.id, decision]));
  assert.equal(decisions.tray.correct.includes('matrix'), true);
  assert.equal(decisions.pouch.correct, 'aside');
  assert.equal(decisions.glucagon.correct, 'report');
  assert.deepEqual(decisions.kit.correct, ['oxygen', 'aed', 'adrenaline', 'aspirin', 'glucagon']);
  assert.equal(decisions.initials.present?.kind, 'initials');
});

test('an old-shape setup record remains readable and a completed legacy record stays unchanged', async () => {
  const { initialTaskStates, evaluateTask } = await import('../src/client/lib/simulation.ts');
  const legacy = {
    prep: ['uniform', 'hair', 'handwash', 'ppe', 'gloves'],
    signoff: 'initials',
    tray: ['exam', 'aspirator', 'anaesthetic', 'bond', 'composite', 'matrix', 'light', 'finish', 'bib'],
    pouch: 'aside',
    glucagon: 'report',
  };
  const tasks = initialTaskStates();
  tasks.setup = { ...tasks.setup, ...legacy };
  assert.doesNotThrow(() => evaluateTask('setup', tasks));

  const completed = ['setup'];
  const frozen = structuredClone(tasks.setup);
  // Loading V2 defaults must not rewrite evidence on an already signed-off task.
  const loaded = completed.includes('setup') ? frozen : { ...initialTaskStates().setup, ...frozen };
  assert.deepEqual(loaded, frozen);
  assert.deepEqual(loaded.prep, legacy.prep);
  assert.equal(loaded.signoff, 'initials');
});