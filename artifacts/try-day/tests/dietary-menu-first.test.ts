import assert from 'node:assert/strict';
import test from 'node:test';
import { ADDED_GUESTS, DIETARY_LINES, DISHES } from '../src/content/activities';
import { DIETARY_HINTS, DIETARY_REDESIGN_LINES } from '../src/content/scenes/dietary-redesign';
import {
  COURSES,
  FRANGIPANE_NOTE_EVIDENCE,
  REQUIREMENT_EVIDENCE,
  applyChartToggle,
  applyDietaryDecision,
  boardComplete,
  chartHint,
  chartRowDiff,
  courseChecked,
  decisionFeedback,
  dietaryChanges,
  dietaryDecisionsReady,
  dietaryHandoverRecord,
  emptyDietaryRedesign,
  evidenceOptions,
  getDietaryRedesignStage,
  isValidDecision,
  recordCourseReview,
  renderBoardNote,
  rowEvidenceId,
  rowStatus,
  type DietaryDecision,
} from '../src/lib/redesign-dietary';
import { complicationRevealed, evaluateDietary, testProgress, type DietaryState } from '../src/lib/simulation';

const priya = ADDED_GUESTS.find((guest) => guest.id === 'priya')!;
const rightChart = Object.fromEntries(DISHES.map((dish) => [dish.id, [...dish.allergens]])) as Record<string, string[]>;
const finishedFixture = (): DietaryState => structuredClone(testProgress('hand-the-kitchen-on').tasks['check-the-dietary-list']);

function decision(partial: Partial<DietaryDecision>): DietaryDecision {
  return { action: null, reason: 'A reason the evening team can read.', evidence: [], category: null, proposedDishId: null, ...partial };
}

test('evidence for a course is the sheet line, the chart rows and the card lines, with the frangipane note verbatim', () => {
  const ids = evidenceOptions(priya, 'dessert', 'pear', rightChart).map((option) => option.id);
  assert.ok(ids.includes(REQUIREMENT_EVIDENCE));
  assert.ok(ids.includes(rowEvidenceId('frangipane')));
  assert.ok(ids.includes(rowEvidenceId('pear')));
  assert.ok(ids.includes('Ground almonds'));
  assert.ok(ids.includes('Pistachios'));
  assert.ok(ids.includes(FRANGIPANE_NOTE_EVIDENCE));
  // The replacement's card only appears once it is proposed.
  const plannedOnly = evidenceOptions(priya, 'dessert', null, rightChart).map((option) => option.id);
  assert.ok(!plannedOnly.includes(rowEvidenceId('pear')));
  // An ingredient on both cards is one line of evidence that names both cards.
  assert.equal(new Set(ids).size, ids.length);
  const shared = evidenceOptions(priya, 'dessert', 'pear', rightChart).find((option) => option.id === 'Sugar');
  assert.deepEqual(shared?.dishIds, ['frangipane', 'pear']);
});

test('removing the pistachio garnish is never the answer for Priya; both nuts and the note are required', () => {
  const assigned = { main: 'beef', dessert: 'pear' } as const;
  const garnishOnly = decision({ action: 'swap', proposedDishId: 'pear', category: 'ingredient-conflict', evidence: ['Pistachios'] });
  assert.equal(isValidDecision('priya', 'dessert', garnishOnly, assigned, rightChart), false);
  const garnishFeedback = decisionFeedback('priya', 'dessert', garnishOnly, assigned, rightChart, 1);
  assert.equal(garnishFeedback.kind, 'hint');
  assert.equal(garnishFeedback.ladder, 'priya:dessert:garnish');

  const complete = decision({ action: 'swap', proposedDishId: 'pear', category: 'ingredient-conflict', evidence: ['Ground almonds', 'Pistachios', FRANGIPANE_NOTE_EVIDENCE] });
  assert.equal(isValidDecision('priya', 'dessert', complete, assigned, rightChart), true);
  const stands = decisionFeedback('priya', 'dessert', complete, assigned, rightChart, 1);
  assert.equal(stands.kind, 'stands');
  assert.doesNotMatch(stands.line.text.toLowerCase(), /is safe|safe to serve|approved to serve|you can serve/);

  // Keeping the frangipane, or proposing it, climbs the conflict ladder; the last rung is the signed-off line.
  const keep = decision({ action: 'keep', proposedDishId: 'frangipane', category: 'no-conflict', evidence: ['Ground almonds'] });
  const keepAssigned = { main: 'beef', dessert: 'frangipane' } as const;
  for (const tier of [1, 2, 3]) {
    const fb = decisionFeedback('priya', 'dessert', keep, keepAssigned, rightChart, tier);
    assert.equal(fb.ladder, 'priya:dessert:conflict');
    assert.doesNotMatch(fb.line.text, /cannot be adapted/i);
  }
  assert.deepEqual(decisionFeedback('priya', 'dessert', keep, keepAssigned, rightChart, 4).line, DIETARY_LINES.marcusOnNutDessert);
  assert.deepEqual(decisionFeedback('priya', 'dessert', keep, keepAssigned, rightChart, 9).line, DIETARY_LINES.marcusOnNutDessert);
  assert.equal(DIETARY_HINTS['priya:dessert:conflict'].length, 4);
});

test('asking Terence about the pear is a valid position and gets the agreed Ask line, not an approval', () => {
  const ask = decision({ action: 'ask', proposedDishId: 'pear', category: 'information-missing', evidence: ['Ground almonds', 'Pistachios', FRANGIPANE_NOTE_EVIDENCE] });
  const assigned = { main: 'beef', dessert: 'pear' } as const;
  assert.equal(isValidDecision('priya', 'dessert', ask, assigned, rightChart), true);
  const fb = decisionFeedback('priya', 'dessert', ask, assigned, rightChart, 1);
  assert.equal(fb.kind, 'stands');
  assert.deepEqual(fb.line, DIETARY_REDESIGN_LINES.terencePriyaAsk);
});

test("Tom's main climbs its own ladder; a conflict flagged where the cards show none is answered without a ladder", () => {
  const keepBeef = decision({ action: 'keep', proposedDishId: 'beef', category: 'no-conflict', evidence: ['Beef shin'] });
  const beefAssigned = { main: 'beef', dessert: null } as const;
  assert.equal(isValidDecision('tom', 'main', keepBeef, beefAssigned, rightChart), false);
  assert.equal(decisionFeedback('tom', 'main', keepBeef, beefAssigned, rightChart, 1).ladder, 'tom:main:conflict');
  assert.deepEqual(decisionFeedback('tom', 'main', keepBeef, beefAssigned, rightChart, 4).line, DIETARY_LINES.marcusOnMeatForVegetarian);

  const swap = decision({ action: 'swap', proposedDishId: 'wellington', category: 'vegetarian-conflict', evidence: ['Beef shin'] });
  assert.equal(isValidDecision('tom', 'main', swap, { main: 'wellington', dessert: null }, rightChart), true);
  // The saved assignment must agree with the decision.
  assert.equal(isValidDecision('tom', 'main', swap, { main: 'beef', dessert: null }, rightChart), false);

  const annaFlag = decision({ action: 'swap', proposedDishId: 'wellington', category: 'ingredient-conflict', evidence: ['Beef shin'] });
  const fb = decisionFeedback('anna', 'main', annaFlag, { main: 'wellington', dessert: null }, rightChart, 1);
  assert.equal(fb.kind, 'no-conflict-there');
  assert.equal(fb.ladder, undefined);

  // Tom's dessert has no conflict: the nuts matter for Priya, not for a vegetarian.
  const tomDessert = decision({ action: 'keep', proposedDishId: 'frangipane', category: 'no-conflict', evidence: ['Ground almonds'] });
  assert.equal(isValidDecision('tom', 'dessert', tomDessert, { main: 'wellington', dessert: 'frangipane' }, rightChart), true);
});

test('chart pointers go source, component, mapping, explicit, and keep nuts and peanuts apart', () => {
  const missingNuts = rightChart.frangipane.filter((allergen) => allergen !== 'nuts');
  assert.deepEqual(chartRowDiff('frangipane', missingNuts), { missing: ['nuts'], extra: [] });
  const tiers = [1, 2, 3, 4].map((tier) => chartHint('frangipane', missingNuts, tier)!);
  assert.match(tiers[0], /frangipane card/);
  assert.doesNotMatch(tiers[0], /nuts/i);
  assert.match(tiers[1], /Ground almonds|Pistachios/);
  assert.doesNotMatch(tiers[1], /Nuts \(tree nuts\)/);
  assert.match(tiers[2], /counts as Nuts \(tree nuts\)/);
  assert.match(tiers[3], /Nuts \(tree nuts\) is missing from the frangipane row/);
  assert.equal(chartHint('frangipane', rightChart.frangipane, 3), null);

  // Peanuts marked on a tart with no peanuts is a separate mistake from the missing tree nuts.
  const peanutsExtra = [...rightChart.frangipane, 'peanuts'];
  assert.deepEqual(chartRowDiff('frangipane', peanutsExtra), { missing: [], extra: ['peanuts'] });
  assert.match(chartHint('frangipane', peanutsExtra, 3)!, /Nothing on the frangipane card is a source of Peanuts/);
  assert.match(chartHint('frangipane', peanutsExtra, 4)!, /Take Peanuts off the frangipane row/);
  // Both wrong at once: the missing category is pointed at first.
  assert.match(chartHint('frangipane', [...missingNuts, 'peanuts'], 3)!, /counts as Nuts \(tree nuts\)/);

  // Milk stays in the pear.
  assert.match(chartHint('pear', [], 3)!, /counts as Milk/);
});

test('row status distinguishes unfinished, reviewed and flagged rows', () => {
  const redesign = { ...emptyDietaryRedesign(), rowReviewConfirmed: { beef: true, pear: true }, openQuestions: { pear: 'Was the pear poached in the nut kitchen?' } };
  const view = { chart: { beef: ['celery'], tart: ['fish'] }, flaggedDishes: ['wellington'], redesign };
  assert.equal(rowStatus(view, 'frangipane'), 'not-started');
  assert.equal(rowStatus(view, 'tart'), 'in-progress');
  assert.equal(rowStatus(view, 'beef'), 'reviewed');
  assert.equal(rowStatus(view, 'pear'), 'reviewed-question');
  assert.equal(rowStatus(view, 'wellington'), 'flagged');
});

test('the board lists every actual change with a pending preparation check for allergy-driven ones only', () => {
  const state = finishedFixture();
  const changes = dietaryChanges(state);
  assert.deepEqual(changes.map((change) => change.key), ['priya:dessert', 'tom:main']);
  assert.equal(changes[0].preparationStatus, 'pending');
  assert.equal(changes[1].preparationStatus, null);
  assert.equal(boardComplete(state), true);

  const note = renderBoardNote(state);
  assert.match(note, /Table 3 · Priya Nair · Dessert: .*frangipane.* → Poached pear/);
  assert.match(note, /Table 6 · Tom Reid · Main: .*beef.* → .*Wellington/);
  assert.match(note, /Preparation check pending: ask Terence before service/);
  assert.match(note, /Open for Terence: Tom Reid's starter/);
  assert.doesNotMatch(note.toLowerCase(), /\bsafe to serve\b|\bcleared\b|\bapproved\b(?! here)/);

  const record = dietaryHandoverRecord(state);
  assert.equal(record.posted, true);
  assert.equal(record.changes.length, 2);
  assert.equal(record.changes[0].preparationStatus, 'pending');
  assert.ok(record.openItems.some((item) => item.includes("Tom Reid's starter")));

  // A change without a written reason is an unfinished board.
  const unfinished = structuredClone(state);
  unfinished.redesign!.board = { 'priya:dessert': { reason: '' }, 'tom:main': { reason: 'Vegetarian; Wellington is the vegetarian main.' } };
  assert.equal(boardComplete(unfinished), false);
  assert.equal(evaluateDietary({ ...unfinished, boardPosted: true }).done, false);
});

test('the stages run sheet, chart, guests, board, done, and the finished record is done', () => {
  const finished = finishedFixture();
  assert.equal(getDietaryRedesignStage(finished), 'done');
  assert.equal(evaluateDietary(finished).done, true);

  const fresh: DietaryState = { ...finished, chart: Object.fromEntries(DISHES.map((dish) => [dish.id, []])), chartChecked: false, boardPosted: false, redesign: emptyDietaryRedesign() };
  assert.equal(getDietaryRedesignStage(fresh), 'sheet');
  assert.equal(getDietaryRedesignStage({ ...fresh, redesign: { ...fresh.redesign!, sheetRead: true } }), 'chart');

  const reviewedNotChecked = { ...finished, chartChecked: false };
  assert.equal(getDietaryRedesignStage(reviewedNotChecked), 'chart');

  const heldBack = structuredClone(finished);
  heldBack.redesign!.serviceHoldAcknowledged = false;
  assert.equal(getDietaryRedesignStage(heldBack), 'board');
  assert.equal(evaluateDietary(heldBack).done, false);

  const noDecision = structuredClone(finished);
  delete noDecision.redesign!.decisions['anna:dessert'];
  assert.equal(getDietaryRedesignStage(noDecision), 'guests');
});

test('filling a course in is not checking it: only a check with Terence advances it, and any later edit reopens it', () => {
  const finished = finishedFixture();
  const checkedWith = (state: DietaryState, guestId: string, course: 'main' | 'dessert') =>
    courseChecked(state.redesign!, guestId, course, state.guests[guestId], state.chart);

  // The same six valid decisions with no check recorded: a complete form, not a checked course.
  const unchecked: DietaryState = { ...finished, boardPosted: false, redesign: { ...finished.redesign!, courseReviewed: {} } };
  for (const guest of ADDED_GUESTS) {
    for (const course of COURSES) {
      assert.equal(isValidDecision(guest.id, course, unchecked.redesign!.decisions[`${guest.id}:${course}`], unchecked.guests[guest.id], unchecked.chart), true);
      assert.equal(checkedWith(unchecked, guest.id, course), false);
    }
  }
  assert.equal(dietaryDecisionsReady(unchecked.redesign!, unchecked.guests, unchecked.chart), false);
  assert.equal(getDietaryRedesignStage(unchecked), 'guests');
  assert.equal(evaluateDietary({ ...unchecked, boardPosted: true }).done, false);
  // A draft saved before checks were recorded is treated the same way.
  const legacyDraft = { ...unchecked.redesign!, courseReviewed: undefined };
  assert.equal(dietaryDecisionsReady(legacyDraft, unchecked.guests, unchecked.chart), false);

  // A failed check records nothing in the learner's favour.
  const wrong = applyDietaryDecision(unchecked, 'priya', 'dessert', { action: 'keep', category: 'no-conflict' });
  assert.equal(wrong.guests.priya.dessert, 'frangipane');
  const wrongValid = isValidDecision('priya', 'dessert', wrong.redesign!.decisions['priya:dessert'], wrong.guests.priya, wrong.chart);
  assert.equal(wrongValid, false);
  const failed = recordCourseReview(wrong, 'priya', 'dessert', wrongValid, 1);
  assert.equal(failed.redesign!.courseReviewed!['priya:dessert'], false);
  assert.equal(failed.redesign!.hintLevels!['priya:dessert'], 1);
  assert.equal(checkedWith(failed, 'priya', 'dessert'), false);

  // Checking each course with Terence, one at a time, is what advances the work.
  let state = unchecked;
  for (const guest of ADDED_GUESTS) {
    for (const course of COURSES) {
      const valid = isValidDecision(guest.id, course, state.redesign!.decisions[`${guest.id}:${course}`], state.guests[guest.id], state.chart);
      state = recordCourseReview(state, guest.id, course, valid, 0);
      assert.equal(checkedWith(state, guest.id, course), true);
    }
  }
  assert.equal(dietaryDecisionsReady(state.redesign!, state.guests, state.chart), true);
  assert.equal(getDietaryRedesignStage(state), 'board');
  const posted: DietaryState = { ...state, boardPosted: true, redesign: { ...state.redesign!, serviceHoldAcknowledged: true } };
  assert.equal(getDietaryRedesignStage(posted), 'done');
  assert.equal(evaluateDietary(posted).done, true);

  // Editing a checked course, even just its reason, reopens that course and the board; the others stay checked.
  const edited = applyDietaryDecision(posted, 'tom', 'main', { reason: 'Vegetarian. The Wellington is the vegetarian main.' });
  assert.equal(checkedWith(edited, 'tom', 'main'), false);
  assert.equal(checkedWith(edited, 'tom', 'dessert'), true);
  assert.equal(edited.boardPosted, false);
  assert.equal(edited.redesign!.serviceHoldAcknowledged, false);
  assert.equal(getDietaryRedesignStage(edited), 'guests');
  assert.equal(evaluateDietary(edited).done, false);

  // Changing a chart row reopens every decision that cited the dish, and the row itself.
  const toggled = applyChartToggle(posted, 'pear', 'milk');
  assert.equal(toggled.redesign!.decisions['priya:dessert'].action, null);
  assert.equal(checkedWith(toggled, 'priya', 'dessert'), false);
  assert.equal(toggled.redesign!.courseReviewed!['tom:main'], true);
  assert.equal(toggled.redesign!.rowReviewConfirmed.pear, false);
  assert.equal(toggled.chartChecked, false);
  assert.equal(toggled.boardPosted, false);
  assert.equal(getDietaryRedesignStage(toggled), 'chart');

  // Ticking a checked course's "Checked" badge back on needs a real check: a valid edit alone is not enough.
  const reworked = applyDietaryDecision(edited, 'tom', 'main', { reason: finished.redesign!.decisions['tom:main'].reason });
  assert.equal(isValidDecision('tom', 'main', reworked.redesign!.decisions['tom:main'], reworked.guests.tom, reworked.chart), true);
  assert.equal(checkedWith(reworked, 'tom', 'main'), false);
});

test('the nut-dessert complication surfaces only once Priya’s dessert has been taken up', () => {
  const tasks = testProgress('hand-the-kitchen-on').tasks;
  const untouched = structuredClone(tasks);
  untouched['check-the-dietary-list'].redesign!.decisions = {};
  untouched['check-the-dietary-list'].redesign!.hintLevels = {};
  assert.equal(complicationRevealed('check-the-dietary-list', untouched), false);

  const asked = structuredClone(untouched);
  asked['check-the-dietary-list'].redesign!.hintLevels = { 'priya:dessert': 1 };
  assert.equal(complicationRevealed('check-the-dietary-list', asked), true);
  assert.equal(complicationRevealed('check-the-dietary-list', tasks), true);
});
