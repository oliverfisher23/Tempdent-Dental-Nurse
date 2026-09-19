import assert from 'node:assert/strict';
import test from 'node:test';
import { CHILL_RULES, TASK_ORDER } from '../src/content/activities';
import { clearAnswersForHeading } from '../src/lib/redesign-close';
import {
  evaluateTask,
  initialProgress,
  initialTaskStates,
  loadProgress,
  testProgress,
  traysHaveSpace,
} from '../src/lib/simulation';

test('designer jumps seed only earlier tasks, never later learner answers', () => {
  for (const target of TASK_ORDER) {
    const index = TASK_ORDER.indexOf(target);
    const fixture = testProgress(target);
    assert.deepEqual(fixture.completed, TASK_ORDER.slice(0, index));
    for (const id of TASK_ORDER.slice(index)) {
      assert.deepEqual(fixture.tasks[id], initialTaskStates()[id]);
      assert.equal(evaluateTask(id, fixture.tasks).done, false);
    }
    for (const id of TASK_ORDER.slice(0, index)) {
      assert.equal(evaluateTask(id, fixture.tasks).done, true, `${id} fixture must be valid`);
    }
  }
});

test('new learners start with no practical answers or signatures', () => {
  const progress = initialProgress();
  assert.deepEqual(progress.completed, []);
  for (const id of TASK_ORDER) assert.equal(evaluateTask(id, progress.tasks).done, false, id);
});

test('completed designer fixture satisfies every evaluator', () => {
  const fixture = testProgress(null);
  for (const id of TASK_ORDER) assert.equal(evaluateTask(id, fixture.tasks).done, true, id);
});

test('four shallow trays fit the learner share without compromising spacing', () => {
  const tasks = testProgress(null).tasks;
  const chill = tasks['chill-the-event-batch'];
  chill.redesign = { version: 1, comparisonReviewed: true };
  chill.trays = [4, 4, 4, 1.5];
  chill.shelfByTray = [0, 2, 4, 6];
  assert.equal(evaluateTask('chill-the-event-batch', tasks).done, true);
  chill.trays = [4.5, 4.5, 4.5];
  chill.shelfByTray = [0, 2, 4];
  assert.equal(evaluateTask('chill-the-event-batch', tasks).done, false, 'redesigned task must not permit forced overfilling');
});

test('invalid, duplicate, adjacent and partial shelves are rejected', () => {
  assert.equal(traysHaveSpace([0, 2, 4, 6]), true);
  for (const shelves of [[0, 0, 4], [0, 1, 4], [0, 2, null], [0, 2, 8], [0, 2, 4.1]]) {
    assert.equal(traysHaveSpace(shelves), false);
  }
});

test('an extra cooling reading and a correct final explanation are mandatory', () => {
  const fixture = testProgress(null);
  delete fixture.tasks['chill-the-event-batch'].readings[CHILL_RULES.extraInterval];
  assert.equal(evaluateTask('chill-the-event-batch', fixture.tasks).done, false);
  fixture.tasks['hand-the-kitchen-on'].elenaAnswer = 'colder';
  assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, false);
});

test('delivery requires accepted measurements, fish explanation and an actual discrepancy report', () => {
  for (const invalidate of [
    (state: ReturnType<typeof testProgress>['tasks']['check-the-delivery-in']) => { state.fishReason = 'quantity-only'; },
    (state: ReturnType<typeof testProgress>['tasks']['check-the-delivery-in']) => {
      state.lines.salmon.acceptance = 'refuse';
      state.lines.salmon.acceptedAmount = '0';
    },
    (state: ReturnType<typeof testProgress>['tasks']['check-the-delivery-in']) => { state.reportSentSnapshot = ''; },
    (state: ReturnType<typeof testProgress>['tasks']['check-the-delivery-in']) => { state.radioedMarcus = false; },
    (state: ReturnType<typeof testProgress>['tasks']['check-the-delivery-in']) => { state.noteAmendedTo = '12'; },
  ]) {
    const fixture = testProgress(null);
    invalidate(fixture.tasks['check-the-delivery-in']);
    assert.equal(evaluateTask('check-the-delivery-in', fixture.tasks).done, false);
  }
});

test('dietary completion requires deliberately reviewed rows and ingredient evidence, not prose keywords', () => {
  const fixture = testProgress(null);
  const state = fixture.tasks['check-the-dietary-list'];
  state.redesign!.decisions['priya:dessert'].reason = 'The nuts run throughout the filling. Removing a garnish cannot remove them; the pear proposal still needs preparation checks.';
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, true, 'accept a valid paraphrase without keyword grading');
  state.redesign!.rowReviewConfirmed.pear = false;
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, false);
  state.redesign!.rowReviewConfirmed.pear = true;
  state.redesign!.decisions['priya:dessert'].evidence = ['Ground almonds'];
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, false);
});

test('a guest decision cannot disagree with the saved assignment or silently clear a service hold', () => {
  const fixture = testProgress(null);
  const state = fixture.tasks['check-the-dietary-list'];
  state.redesign!.decisions['tom:main'].proposedDishId = 'beef';
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, false);
  state.redesign!.decisions['tom:main'].proposedDishId = 'wellington';
  state.redesign!.serviceHoldAcknowledged = false;
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, false);
});

test('asking about a compatible proposed course is legitimate while service remains held', () => {
  const fixture = testProgress(null);
  const decision = fixture.tasks['check-the-dietary-list'].redesign!.decisions['priya:dessert'];
  decision.action = 'ask';
  decision.category = 'information-missing';
  decision.reason = 'Can Terence check supplier and preparation information for the pear before service? The frangipane has nuts throughout.';
  assert.equal(evaluateTask('check-the-dietary-list', fixture.tasks).done, true);
});

test('the evening-team exchange needs supported answers, before-service timing and a confirmed read-back', () => {
  for (const [key, invalid] of [['salmon.quantity', 'eight'], ['salmon.meal', 'tonight'], ['larder2.check', 'rechecked'], ['table3.status', 'cleared'], ['ready.beef', 'plated']]) {
    const fixture = testProgress(null);
    fixture.tasks['hand-the-kitchen-on'].redesign!.clarifications[key] = invalid;
    assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, false, key);
  }
  for (const invalidate of [
    (rs: NonNullable<ReturnType<typeof testProgress>['tasks']['hand-the-kitchen-on']['redesign']>) => { rs.recipientConfirmed = false; },
    (rs: NonNullable<ReturnType<typeof testProgress>['tasks']['hand-the-kitchen-on']['redesign']>) => { rs.responsibilities = {}; },
    (rs: NonNullable<ReturnType<typeof testProgress>['tasks']['hand-the-kitchen-on']['redesign']>) => { rs.priorities.larder2 = 'later'; },
    (rs: NonNullable<ReturnType<typeof testProgress>['tasks']['hand-the-kitchen-on']['redesign']>) => { rs.priorities.table3 = 'later'; },
  ]) {
    const fixture = testProgress(null);
    invalidate(fixture.tasks['hand-the-kitchen-on'].redesign!);
    assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, false);
  }
});

test('any approved priority order is accepted and the waste question never gates completion', () => {
  const fixture = testProgress(null);
  const rs = fixture.tasks['hand-the-kitchen-on'].redesign!;
  rs.priorities.salmon = 'before-service';
  assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, true, 'salmon may be grouped before service');
  rs.priorities.salmon = 'later';
  rs.wasteFocus = '';
  rs.wasteReason = '';
  assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, true, 'the waste question is optional');
  fixture.tasks['hand-the-kitchen-on'].handover.short = 'Salmon: 8 kg of 12 kg arrived, so 4 kg short. Needed for tomorrow lunch, not tonight. Terence ringing the supplier; nothing confirmed.';
  assert.equal(evaluateTask('hand-the-kitchen-on', fixture.tasks).done, true, 'free text is never keyword-graded');
});

test('editing a heading re-opens only the questions that heading answers', () => {
  const answers = testProgress(null).tasks['hand-the-kitchen-on'].redesign!.clarifications;
  const afterShort = clearAnswersForHeading(answers, 'short');
  assert.equal(afterShort['salmon.quantity'], undefined);
  assert.equal(afterShort['larder2.finding'], answers['larder2.finding']);
  assert.equal(afterShort['ready.beef'], answers['ready.beef']);
  const afterWatch = clearAnswersForHeading(answers, 'watch');
  assert.equal(afterWatch['larder2.check'], undefined);
  assert.equal(afterWatch['table3.dessert'], undefined);
  assert.equal(afterWatch['salmon.meal'], answers['salmon.meal']);
});

test('unfinished draft survives persistence while signed legacy work gains no new requirements', () => {
  const fixture = testProgress('chill-the-event-batch');
  delete fixture.tasks['check-the-delivery-in'].redesign;
  fixture.tasks['chill-the-event-batch'].trays = [1.5, 0.5, 0];
  const saved = JSON.stringify(fixture);
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: () => saved }, sessionStorage: { getItem: () => saved } },
  });
  try {
    const loaded = loadProgress(false);
    assert.deepEqual(loaded.tasks['check-the-delivery-in'], fixture.tasks['check-the-delivery-in']);
    assert.equal(loaded.tasks['check-the-delivery-in'].redesign, undefined);
    assert.deepEqual(loaded.tasks['chill-the-event-batch'].trays, [1.5, 0.5, 0]);
    assert.ok(loaded.tasks['chill-the-event-batch'].redesign);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('a legacy cooling cycle resumes without requiring mid-cycle redistribution', () => {
  const fixture = testProgress('check-the-dietary-list');
  fixture.completed = fixture.completed.filter((id) => id !== 'chill-the-event-batch');
  const chill = fixture.tasks['chill-the-event-batch'];
  delete chill.redesign;
  chill.trays = [4.5, 4.5, 4.5];
  chill.shelfByTray = [0, 2, 4];
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: () => JSON.stringify(fixture) } },
  });
  try {
    const loaded = loadProgress(false);
    assert.equal(loaded.tasks['chill-the-event-batch'].redesign, undefined);
    assert.deepEqual(loaded.tasks['chill-the-event-batch'].readings, chill.readings);
    assert.equal(evaluateTask('chill-the-event-batch', loaded.tasks).done, true);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});