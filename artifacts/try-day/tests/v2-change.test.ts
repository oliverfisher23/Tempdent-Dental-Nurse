import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';

register('./support/asset-loader.mjs', import.meta.url);

const { TASKS, isCorrect } = await import('@client/content/tasks');
const task = TASKS.change;
const decisions = new Map(task.scenes.flatMap((scene) => scene.decisions).map((decision) => [decision.id, decision]));

test('Task 5 has the eight V2 decisions and every completion clause is judged', () => {
  assert.deepEqual([...decisions.keys()], ['inspect', 'autoclave', 'plan', 'message', 'printout', 'labels', 'examtray', 'delivery']);
  for (const decision of decisions.values()) assert.ok(decision.clause.length > 10);
});

test('instrument zones require one correct destination for every instrument', () => {
  const decision = decisions.get('inspect')!;
  assert.equal(decision.options.length, 18);
  assert.equal((decision.correct as readonly string[]).length, 6);
  assert.equal(isCorrect(decision, ['mirror:forward', 'probe_debris:back', 'tweezers_ok:forward', 'excavator:forward', 'tweezers_bent:aside', 'plastic:forward']), true);
  assert.equal(isCorrect(decision, ['mirror:forward', 'probe_debris:forward', 'tweezers_ok:forward', 'excavator:forward', 'tweezers_bent:aside', 'plastic:forward']), false);
});

test('plan board records columns, the one-hour load and a named Ask job', () => {
  const decision = decisions.get('plan')!;
  assert.equal(isCorrect(decision, ['priya:now', 'surgery:next', 'checkin:later', 'load:later', 'corridor:ask']), true);
  assert.equal(isCorrect(decision, ['priya:now', 'surgery:later', 'corridor:next', 'checkin:later', 'load:later']), false);
});

test('delivery flags exactly the two supervised-storage lines and writes Noticed', () => {
  const decision = decisions.get('delivery')!;
  assert.equal(isCorrect(decision, ['anaesthetic', 'concentrate']), true);
  assert.equal(isCorrect(decision, ['anaesthetic']), false);
  assert.match(decision.noticed?.value ?? '', /anaesthetic.*concentrate/i);
});

test('Task 5 references its stock backdrop and consequence pouch', () => {
  const stock = task.scenes.find((scene) => scene.place === 'stock');
  assert.match(stock?.backdrop ?? '', /stock-delivery/);
  const inspect = decisions.get('inspect')!;
  assert.equal(inspect.present?.kind, 'zones');
  if (inspect.present?.kind === 'zones') assert.match(inspect.present.items.broken_pouch.image ?? '', /pouch-broken/);
});