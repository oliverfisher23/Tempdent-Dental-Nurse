import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

register('./support/asset-loader.mjs', import.meta.url);

/**
 * Invariants behind "content judges, scenes present" and "never hint a routine's order" for
 * the V2 presentations that carry positions or field maps of their own.
 */
test('stage spots are rendered in reading order, never in a sequence answer order', async () => {
  const { TASKS } = await import('../src/client/content/tasks/index.ts');
  const { inReadingOrder } = await import('../src/client/scenes/interactions/layout.ts');
  let checked = 0;
  for (const task of Object.values(TASKS)) {
    for (const decision of task.scenes.flatMap((scene) => scene.decisions)) {
      if (decision.kind !== 'sequence' || !Array.isArray(decision.correct)) continue;
      const present = decision.present;
      const spots: Record<string, { x: number; y: number }> | undefined =
        present?.kind === 'path' ? present.zones
          : present?.kind === 'turnaround' || present?.kind === 'controls'
            ? Object.fromEntries(Object.entries(present.controls).map(([id, spec]) => [id, spec.spot]))
            : present?.kind === 'touches'
              ? Object.fromEntries(Object.values(present.spots).map((spot) => [spot.records, spot]))
              : undefined;
      if (!spots) continue;
      checked += 1;
      const rendered = inReadingOrder(Object.entries(spots), (spot) => spot).map(([id]) => id);
      const expected = decision.correct.filter((id) => id in spots);
      assert.notDeepEqual(
        rendered.filter((id) => expected.includes(id)),
        expected,
        `${task.id}/${decision.id}: the rendered spot order equals the answer order`,
      );
    }
  }
  assert.ok(checked >= 4, 'the path, the turnaround and both handwashes were checked');
});

test('a handwash route is recorded, never refused: dirty touches mark the hands and the sequence carries them', async () => {
  const { TASKS } = await import('../src/client/content/tasks/index.ts');
  const { isCorrect } = await import('../src/client/content/tasks/index.ts');
  const { readHands } = await import('../src/client/scenes/interactions/touches.tsx');
  const decisions = Object.fromEntries(TASKS.setup.scenes[0].decisions.map((decision) => [decision.id, decision]));
  for (const id of ['handwash', 'fresh']) {
    const decision = decisions[id];
    assert.equal(decision.present?.kind, 'touches');
    if (decision.present?.kind !== 'touches') continue;
    const good = decision.correct as string[];
    assert.ok(isCorrect(decision, good));
    const clean = readHands(good, decision.present);
    assert.equal(clean.marks.length, 0, `${id}: the answer key leaves the hands clean`);
    assert.equal(clean.running, false, `${id}: the answer key turns the tap off`);
    assert.equal(clean.gloved, true);
    // Tap off by hand after the wash: recorded as a different option, marks the hands, judged wrong by the content.
    const byHand = good.map((step) => (step === 'tap_towel' ? 'tap_hand' : step));
    assert.equal(isCorrect(decision, byHand), false);
    assert.ok(readHands(byHand, decision.present).marks.length > 0, `${id}: touching the tap by hand marks the hands`);
    // Gloves before the wash commit a one-touch route; the content judges it, the scene does not refuse it.
    assert.equal(isCorrect(decision, ['gloves']), false);
    // A second wash after a dirty touch makes the hands clean again; the route still holds the touch for the judge.
    const rewashed = [...good.slice(0, 1), 'phone', ...good];
    assert.equal(isCorrect(decision, rewashed), false);
    assert.equal(readHands(rewashed, decision.present).marks.length, 0, `${id}: a wash undoes what the hands touched`);
  }
  // Arriving gloved, the tap held first washes the gloves, not the hands; the hands are washed only once the gloves are off.
  const fresh = decisions.fresh;
  if (fresh.present?.kind === 'touches') {
    const gloved = readHands(['wash'], fresh.present);
    assert.equal(gloved.washed, false);
    assert.equal(gloved.running, true);
    assert.equal(readHands(['wash', 'ppe_off', 'wash'], fresh.present).washed, true);
  }
});

test('peel-and-stick fields accept exactly the content answer key', async () => {
  const { TASKS } = await import('../src/client/content/tasks/index.ts');
  let checked = 0;
  for (const task of Object.values(TASKS)) {
    for (const decision of task.scenes.flatMap((scene) => scene.decisions)) {
      if (decision.present?.kind !== 'stick') continue;
      checked += 1;
      const accepted = decision.present.fields.map((field) => field.accepts).sort();
      assert.deepEqual(accepted, [...(decision.correct as string[])].sort(),
        `${task.id}/${decision.id}: fields accept labels outside the answer key`);
      const labels = new Set(decision.present.labels.map((label) => label.id));
      for (const option of decision.options) assert.ok(labels.has(option.id), `${decision.id}: no label for ${option.id}`);
    }
  }
  assert.equal(checked, 1);
});
