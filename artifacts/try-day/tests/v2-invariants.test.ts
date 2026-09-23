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
  assert.ok(checked >= 2, 'the path and the turnaround were checked');
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
