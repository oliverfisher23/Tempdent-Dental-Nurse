import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
import { TASKS, correctAnswer, decisionsOf, isCorrect } from '@client/content/tasks';
import { day, evaluateTask, complicationRevealed, initialTaskStates } from '@client/lib/simulation';

register('./support/asset-loader.mjs', import.meta.url);

const TASK_IDS = day.spec.TASK_ORDER;

test('every task in mechanic.json has content, and every scene is on the task route', async () => {
  const { WORKPLACE } = await import('@client/content/client');
  for (const id of TASK_IDS) {
    const task = TASKS[id];
    assert.ok(task, `no content for ${id}`);
    assert.equal(task.id, id);
    assert.ok(task.scenes.length > 0, `${id} has no scenes`);
    const route = WORKPLACE.taskRoutes[id];
    for (const scene of task.scenes) {
      assert.ok(route.places.includes(scene.place), `${id}: scene "${scene.place}" is not on the route`);
      assert.ok(scene.decisions.length > 0, `${id}/${scene.place} has no decisions`);
    }
    for (const place of route.places) {
      assert.ok(task.scenes.some((scene) => scene.place === place), `${id}: route place "${place}" has no scene`);
    }
  }
});

test('decisions are well formed: unique ids, answers among the options, gates that exist', () => {
  for (const id of TASK_IDS) {
    const decisions = decisionsOf(id);
    const ids = new Set<string>();
    for (const decision of decisions) {
      const where = `${id}/${decision.id}`;
      assert.ok(!ids.has(decision.id), `${where} duplicated`);
      ids.add(decision.id);
      const optionIds = decision.options.map((option) => option.id);
      assert.equal(new Set(optionIds).size, optionIds.length, `${where} has duplicate option ids`);
      const correct = typeof decision.correct === 'string' ? [decision.correct] : [...decision.correct];
      assert.ok(correct.length > 0, `${where} has no correct answer`);
      for (const c of correct) assert.ok(optionIds.includes(c), `${where}: correct "${c}" is not an option`);
      if (decision.kind === 'choice') {
        assert.ok(correct.length < optionIds.length, `${where}: every option is correct`);
      } else {
        assert.ok(Array.isArray(decision.correct), `${where}: ${decision.kind} needs an array answer`);
        assert.ok(correct.length >= 2, `${where}: a ${decision.kind} needs at least two steps`);
        assert.ok(optionIds.length > correct.length || decision.kind === 'sequence', `${where}: checklist with no distractor`);
      }
      assert.ok(decision.clause.length > 0 && decision.prompt.length > 0, `${where} is missing copy`);
      assert.ok(decision.feedback.right && decision.feedback.wrong && decision.feedback.speaker, `${where} is missing feedback`);
      if (decision.after) {
        assert.ok(decisions.some((other) => other.id === decision.after), `${where}: after "${decision.after}" does not exist`);
        assert.notEqual(decision.after, decision.id, `${where} gates on itself`);
      }
    }
    const first = decisions.find((decision) => !decision.after);
    assert.ok(first, `${id} has no ungated decision`);
    assert.ok(decisions.some((decision) => decision.revealsComplication), `${id} never reveals its complication`);
  }
});

test('the evaluator meets every clause on full marks and none on a blank record', () => {
  const blank = initialTaskStates();
  const finished = day.testProgress(null);
  for (const id of TASK_IDS) {
    const empty = evaluateTask(id, blank);
    assert.equal(empty.done, false, `${id} done with no answers`);
    assert.ok(empty.checklist.every((item) => !item.met), `${id} has a clause met by nothing`);
    assert.equal(empty.checklist.length, decisionsOf(id).length);
    assert.equal(complicationRevealed(id, blank), false);

    const full = evaluateTask(id, finished.tasks);
    assert.equal(full.done, true, `${id} not done on full marks: ${full.checklist.filter((c) => !c.met).map((c) => c.id).join(', ')}`);
    assert.equal(complicationRevealed(id, finished.tasks), true);
  }
});

test('wrong answers, partial sets and shuffled orders are not accepted', () => {
  for (const id of TASK_IDS) {
    for (const decision of decisionsOf(id)) {
      const right = correctAnswer(decision);
      assert.ok(isCorrect(decision, right), `${id}/${decision.id} rejects its own answer`);
      assert.equal(isCorrect(decision, null), false);
      const correct = typeof decision.correct === 'string' ? [decision.correct] : [...decision.correct];
      const wrongOption = decision.options.find((option) => !correct.includes(option.id));
      if (decision.kind === 'choice') {
        assert.ok(wrongOption);
        assert.equal(isCorrect(decision, wrongOption.id), false, `${id}/${decision.id} accepts a wrong option`);
        assert.equal(isCorrect(decision, [right as string]), false, 'a choice does not accept an array');
      } else if (Array.isArray(right)) {
        assert.equal(isCorrect(decision, right.slice(1)), false, `${id}/${decision.id} accepts a partial answer`);
        if (wrongOption) assert.equal(isCorrect(decision, [...right, wrongOption.id]), false, `${id}/${decision.id} accepts an extra item`);
        if (decision.kind === 'sequence') {
          const swapped = [...right];
          [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
          assert.equal(isCorrect(decision, swapped), false, `${id}/${decision.id} accepts a shuffled order`);
        } else {
          assert.equal(isCorrect(decision, [...right].reverse()), true, 'a checklist ignores order');
        }
      }
    }
  }
});

test('a sequence cannot be solved by tapping its options top to bottom', () => {
  for (const id of TASK_IDS) {
    for (const decision of decisionsOf(id)) {
      if (decision.kind !== 'sequence' || typeof decision.correct === 'string') continue;
      const listed = decision.options.map((option) => option.id).filter((optionId) => decision.correct.includes(optionId));
      assert.notDeepEqual(listed, [...decision.correct], `${id}/${decision.id} lists its steps in the right order`);
      const topDown = decision.options.slice(0, decision.correct.length).map((option) => option.id);
      assert.equal(isCorrect(decision, topDown), false, `${id}/${decision.id} is solved top to bottom`);
    }
  }
});

test('saved set answers survive the shell merge over a blank record', async () => {
  const { mergeTaskState } = await import('@shell/lib/day');
  const finished = day.testProgress(null);
  const blank = initialTaskStates();
  for (const id of TASK_IDS) {
    const stored = JSON.parse(JSON.stringify(finished.tasks[id])) as Record<string, unknown>;
    const merged = mergeTaskState(blank[id], stored);
    assert.deepEqual(merged, finished.tasks[id], `${id}: the merge changed a saved answer`);
    assert.equal(evaluateTask(id, { ...blank, [id]: merged }).done, true);
  }
});

test('a checklist with a repeated item is not an exact set', () => {
  for (const id of TASK_IDS) {
    for (const decision of decisionsOf(id)) {
      if (decision.kind !== 'checklist' || typeof decision.correct === 'string') continue;
      const [first, ...rest] = decision.correct;
      assert.equal(isCorrect(decision, [first, first, ...rest]), false, `${id}/${decision.id} accepts a repeat`);
    }
  }
});
