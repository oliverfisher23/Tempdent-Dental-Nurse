import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';

register('./support/asset-loader.mjs', import.meta.url);
const { CLOSE_TASK } = await import('@client/content/tasks/close');
const { WELCOME_TASK } = await import('@client/content/tasks/welcome');
const { TASKS } = await import('@client/content/tasks');
const { day } = await import('@client/lib/simulation');

const decisions = (task: typeof WELCOME_TASK) => task.scenes.flatMap((scene) => scene.decisions);
const byId = (task: typeof WELCOME_TASK, id: string) => decisions(task).find((decision) => decision.id === id)!;

test('Amira and Karim react to every V1 speech option', () => {
  for (const id of ['greet', 'pause', 'antibiotics', 'hurt', 'white']) {
    const decision = byId(WELCOME_TASK, id);
    assert.ok(decision.options.every((option) => option.reaction), `${id} has an option without a reaction`);
  }
  assert.deepEqual(byId(WELCOME_TASK, 'settle').correct, ['coat', 'sit', 'chair', 'bib', 'glasses']);
  assert.equal(byId(WELCOME_TASK, 'settle').present?.kind, 'controls');
  assert.equal(byId(WELCOME_TASK, 'hurt').noticed?.when, 'right');
});

test('Graham reacts to every conversation line and position is judged', () => {
  for (const id of ['position', 'approach', 'offers', 'howbad', 'minute', 'distress', 'note', 'slip']) {
    const decision = byId(CLOSE_TASK, id);
    assert.ok(decision.options.every((option) => option.reaction), `${id} has an option without a reaction`);
  }
  assert.equal(byId(CLOSE_TASK, 'position').correct, 'beside');
  assert.equal(byId(CLOSE_TASK, 'offers').present?.kind, 'offers');
  assert.equal(byId(CLOSE_TASK, 'distress').present?.kind, 'paced');
});

test('close-down is committed at the door and handover keeps the full required set', () => {
  const closeDown = byId(CLOSE_TASK, 'closedown');
  assert.equal(closeDown.present?.kind, 'controls');
  if (closeDown.present?.kind === 'controls') assert.match(closeDown.present.commit.label, /door/i);
  assert.deepEqual(closeDown.correct, ['disinfectant', 'chair', 'light', 'unit']);

  const handover = byId(CLOSE_TASK, 'handover');
  assert.equal(handover.present?.kind, 'handover');
  assert.deepEqual(handover.correct, ['tray', 'glucagon', 'delivery', 'minute', 'slip', 'child-first']);
  assert.ok(handover.options.some((option) => option.id === 'sam-busy'));
  assert.ok(handover.options.some((option) => option.id === 'amira-cried'));
});

test('the later-task fixture rebuilds earlier automatic notebook entries', () => {
  const progress = day.testProgress('close');
  const byRef = new Map(progress.notepad.map((entry) => [entry.ref?.decision, entry]));
  for (const id of ['glucagon', 'pouch', 'delivery']) {
    assert.equal(byRef.get(id)?.label, 'Noticed', `${id} should be seeded as Noticed`);
    const authored = TASKS.setup.scenes.concat(TASKS.change.scenes)
      .flatMap((scene) => scene.decisions)
      .find((decision) => decision.id === id)?.noticed;
    assert.equal(byRef.get(id)?.value, authored?.value);
  }
  assert.equal(byRef.has('minute'), false, 'current Task 6 entries must not be pre-seeded');
});