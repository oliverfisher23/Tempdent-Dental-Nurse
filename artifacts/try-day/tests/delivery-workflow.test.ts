import assert from 'node:assert/strict';
import test from 'node:test';

import { ORDER_LINES, REFUSED_LINE_ID, SHORT_LINE_ID } from '@client/content/activities';
import {
  canSignDelivery,
  deliveryDisclosureReady,
  deliveryReportIssues,
  deliveryReportSnapshot,
  deliveryReviewIssues,
  lineNeedsAmendment,
  reconcileDeliveryUpdate,
} from '@client/lib/delivery-workflow';
import {
  STORAGE_KEY,
  complicationRevealed,
  evaluateDelivery,
  initialProgress,
  loadProgress,
  type DeliveryState,
  expectedAcceptance,
  expectedAcceptedAmount,
} from '@client/lib/simulation';

function completeDelivery(): DeliveryState {
  const state = initialProgress().tasks['check-the-delivery-in'];
  const shortLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
  for (const line of ORDER_LINES) {
    state.lines[line.id] = {
      counted: true,
      arrived: String(line.arrived),
      probed: line.chilled,
      temperature: line.chilled ? String(line.actualC) : '',
      status: line.expectedStatus,
      comparison: line.id === SHORT_LINE_ID ? 'differs-both' : 'matches-both',
      acceptance: expectedAcceptance(line),
      acceptedAmount: String(expectedAcceptedAmount(line)),
    };
  }
  for (const check of Object.keys(state.fishChecks)) state.fishChecks[check as keyof typeof state.fishChecks] = true;
  state.fishReason = 'condition-and-temperature';
  state.missingAmount = String(shortLine.ordered - shortLine.arrived);
  state.noteLineId = SHORT_LINE_ID;
  state.noteAmendedTo = String(shortLine.arrived);
  state.amendmentInitials = 'LD';
  state.amendments = {
    [SHORT_LINE_ID]: { amendedTo: String(shortLine.arrived), initials: 'LD', refused: false, temperature: '' },
    [REFUSED_LINE_ID]: { amendedTo: '0', initials: 'LD', refused: true, temperature: '7.8' },
  };
  state.contextRevealed = true;
  state.report = {
    productId: SHORT_LINE_ID,
    service: 'tomorrow-lunch',
    action: 'contact-supplier',
  };
  state.reportAttempted = true;
  state.reportSentSnapshot = deliveryReportSnapshot(state);
  state.radioedMarcus = true;
  return state;
}

test('typing an answer does not count inspection or reveal the complication', () => {
  const progress = initialProgress();
  const state = progress.tasks['check-the-delivery-in'];
  const shortLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
  state.lines.salmon.arrived = String(shortLine.arrived);
  assert.equal(state.lines.salmon.counted, false);
  assert.equal(deliveryDisclosureReady(state), false);
  assert.equal(complicationRevealed('check-the-delivery-in', progress.tasks), false);

  Object.assign(state.lines.salmon, {
    counted: true,
    probed: true,
    temperature: '2.1',
    comparison: 'differs-both',
    status: 'short',
    acceptance: 'accept',
    acceptedAmount: '8',
  });
  Object.assign(state, {
    missingAmount: String(shortLine.ordered - shortLine.arrived),
    noteLineId: SHORT_LINE_ID,
    noteAmendedTo: String(shortLine.arrived),
  });
  assert.equal(deliveryDisclosureReady(state), true);
  assert.equal(complicationRevealed('check-the-delivery-in', progress.tasks), false);
  state.contextRevealed = true;
  assert.equal(complicationRevealed('check-the-delivery-in', progress.tasks), true);
});

test('the store boundary rejects an early context reveal', () => {
  const before = initialProgress().tasks['check-the-delivery-in'];
  const proposed = { ...before, contextRevealed: true };
  assert.equal(reconcileDeliveryUpdate(before, proposed).contextRevealed, false);

  const ready = completeDelivery();
  ready.contextRevealed = false;
  const reveal = { ...ready, contextRevealed: true };
  assert.equal(reconcileDeliveryUpdate(ready, reveal).contextRevealed, true);
});

test('all quantities, temperatures, comparisons and decisions are evaluated', () => {
  const state = completeDelivery();
  state.signature = 'LD';
  state.signed = true;
  assert.equal(evaluateDelivery(state).done, true);

  state.lines.lemons.arrived = '59';
  assert.equal(evaluateDelivery(state).done, false);
  state.lines.lemons.arrived = '60';
  state.lines.cream.temperature = '9';
  assert.equal(evaluateDelivery(state).done, false);
});

test('each count, chilled inspection and fish finding individually prevents signing', () => {
  for (const line of ORDER_LINES) {
    const state = completeDelivery();
    state.lines[line.id].counted = false;
    assert.equal(canSignDelivery(state), false, `${line.id} count`);
  }
  for (const line of ORDER_LINES.filter((candidate) => candidate.chilled)) {
    const state = completeDelivery();
    state.lines[line.id].probed = false;
    assert.equal(canSignDelivery(state), false, `${line.id} temperature inspection`);
  }
  for (const check of Object.keys(completeDelivery().fishChecks)) {
    const state = completeDelivery();
    state.fishChecks[check as keyof typeof state.fishChecks] = false;
    assert.equal(canSignDelivery(state), false, `${check} fish finding`);
  }
});

test('whole sea bass reasoning is mandatory and must use condition and temperature', () => {
  for (const reason of [null, 'quantity-only', 'supplier-claim-only'] as const) {
    const state = completeDelivery();
    state.fishReason = reason;
    assert.equal(canSignDelivery(state), false, String(reason));
    state.signature = 'LD';
    state.signed = true;
    assert.equal(evaluateDelivery(state).done, false);
  }
  const signed = completeDelivery();
  signed.signature = 'LD';
  signed.signed = true;
  const changed = structuredClone(signed);
  changed.fishReason = 'quantity-only';
  const reconciled = reconcileDeliveryUpdate(signed, changed);
  assert.equal(reconciled.signed, false);
  assert.equal(reconciled.radioedMarcus, true, 'fish reasoning does not change salmon report facts');
});

test('every comparison and acceptance decision individually prevents signing', () => {
  for (const line of ORDER_LINES) {
    const comparison = completeDelivery();
    comparison.lines[line.id].comparison = null;
    assert.equal(canSignDelivery(comparison), false, `${line.id} comparison`);

    const acceptance = completeDelivery();
    acceptance.lines[line.id].acceptance = line.id === REFUSED_LINE_ID ? 'accept' : 'refuse';
    acceptance.lines[line.id].acceptedAmount = line.id === REFUSED_LINE_ID ? String(line.arrived) : '0';
    assert.equal(canSignDelivery(acceptance), false, `${line.id} acceptance`);
  }
});

test('a refusal of suitable goods and accepting the warm cream both prevent signing', () => {
  const refusedChicken = completeDelivery();
  refusedChicken.lines.chicken.acceptance = 'refuse';
  refusedChicken.lines.chicken.acceptedAmount = '0';
  assert.equal(canSignDelivery(refusedChicken), false);

  const acceptedCream = completeDelivery();
  acceptedCream.lines.cream.status = 'arrived';
  acceptedCream.lines.cream.acceptance = 'accept';
  acceptedCream.lines.cream.acceptedAmount = '6';
  assert.equal(canSignDelivery(acceptedCream), false);
  // The sheet sends the learner back to the cream; the note must not name the refusal for them.
  const issues = deliveryReviewIssues(acceptedCream);
  assert.ok(issues.some((issue) => issue.target === REFUSED_LINE_ID));
  assert.equal(issues.some((issue) => issue.target === 'note' && /cream/i.test(issue.message)), false);
});

test('a sent report becomes stale when its own saved facts change', () => {
  const state = completeDelivery();
  assert.deepEqual(deliveryReportIssues(state), []);
  assert.equal(deliveryReviewIssues(state).some((issue) => issue.target === 'report'), false);

  const changed = structuredClone(state);
  changed.lines.salmon.arrived = '7';
  const reconciled = reconcileDeliveryUpdate(state, changed);
  assert.equal(reconciled.reportAttempted, true);
  assert.equal(reconciled.radioedMarcus, false);
  assert.equal(reconciled.reportSentSnapshot, '');
});

test('report validity requires revealed context and full salmon evidence', () => {
  const forged = completeDelivery();
  forged.contextRevealed = false;
  assert.notDeepEqual(deliveryReportIssues(forged), []);
  forged.contextRevealed = true;
  forged.lines.salmon.counted = false;
  assert.notDeepEqual(deliveryReportIssues(forged), []);
  forged.lines.salmon.counted = true;
  forged.lines.salmon.probed = false;
  assert.notDeepEqual(deliveryReportIssues(forged), []);
  forged.lines.salmon.probed = true;
  forged.lines.salmon.temperature = '';
  assert.notDeepEqual(deliveryReportIssues(forged), []);
  forged.lines.salmon.temperature = String(
    ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!.actualC,
  );
  forged.lines.salmon.comparison = 'matches-both';
  assert.notDeepEqual(deliveryReportIssues(forged), []);
  forged.lines.salmon.comparison = 'differs-both';
  forged.lines.salmon.status = 'refused';
  assert.notDeepEqual(deliveryReportIssues(forged), []);
});

test('a corrected report must be explicitly resent with a current snapshot', () => {
  const state = completeDelivery();
  const wrong = structuredClone(state);
  wrong.report.service = 'tonight-launch';
  const stale = reconcileDeliveryUpdate(state, wrong);
  assert.equal(stale.radioedMarcus, false);
  assert.equal(stale.reportSentSnapshot, '');

  const correctedDraft = structuredClone(stale);
  correctedDraft.report.service = 'tomorrow-lunch';
  const corrected = reconcileDeliveryUpdate(stale, correctedDraft);
  const sent = structuredClone(corrected);
  sent.reportAttempted = true;
  sent.reportSentSnapshot = deliveryReportSnapshot(sent);
  sent.radioedMarcus = true;
  const resent = reconcileDeliveryUpdate(corrected, sent);
  assert.equal(resent.radioedMarcus, true);
  assert.equal(resent.reportSentSnapshot, deliveryReportSnapshot(resent));
});

test('acceptance snapshots deliberately and later quantity edits do not repair it', () => {
  const before = initialProgress().tasks['check-the-delivery-in'];
  before.lines.salmon.arrived = '8';
  const accepting = structuredClone(before);
  accepting.lines.salmon.acceptance = 'accept';
  const accepted = reconcileDeliveryUpdate(before, accepting);
  assert.equal(accepted.lines.salmon.acceptedAmount, '8');

  const edited = structuredClone(accepted);
  edited.lines.salmon.arrived = '7';
  const afterEdit = reconcileDeliveryUpdate(accepted, edited);
  assert.equal(afterEdit.lines.salmon.acceptedAmount, '8');

  const refusing = structuredClone(afterEdit);
  refusing.lines.salmon.acceptance = 'refuse';
  assert.equal(reconcileDeliveryUpdate(afterEdit, refusing).lines.salmon.acceptedAmount, '0');
});

test('missing amount, accepted amount and amendment are distinct', () => {
  const state = completeDelivery();
  assert.equal(state.missingAmount, '4');
  assert.equal(state.lines.salmon.acceptedAmount, '8');
  assert.equal(canSignDelivery(state), true);
  state.amendments[SHORT_LINE_ID].amendedTo = state.missingAmount;
  assert.equal(canSignDelivery(state), false);
  const missingCreamRefusal = completeDelivery();
  delete missingCreamRefusal.amendments[REFUSED_LINE_ID];
  assert.equal(canSignDelivery(missingCreamRefusal), false);
});

test('changing amendment facts clears initials and signed paperwork', () => {
  const state = completeDelivery();
  state.signature = 'LD';
  state.signed = true;
  const changed = structuredClone(state);
  changed.amendments[REFUSED_LINE_ID].temperature = '7.7';
  const reconciled = reconcileDeliveryUpdate(state, changed);
  assert.equal(reconciled.amendments[REFUSED_LINE_ID].initials, '');
  assert.equal(reconciled.signature, '');
  assert.equal(reconciled.signed, false);
});

test('editing a signature after signing requires a fresh signature action', () => {
  const state = completeDelivery();
  state.signature = 'LD';
  state.signed = true;
  const changed = { ...state, signature: 'L D' };
  const reconciled = reconcileDeliveryUpdate(state, changed);
  assert.equal(reconciled.signature, '');
  assert.equal(reconciled.signed, false);
});

test('new signatures are accepted only for a valid review and explicit signature', () => {
  const valid = completeDelivery();
  valid.signature = 'LD';
  valid.signed = true;
  assert.equal(
    reconcileDeliveryUpdate({ ...valid, signed: false, signature: '' }, valid).signed,
    true,
  );

  const missingSignature = completeDelivery();
  missingSignature.signed = true;
  assert.equal(
    reconcileDeliveryUpdate({ ...missingSignature, signed: false }, missingSignature).signed,
    false,
  );

  const invalid = completeDelivery();
  invalid.lines.lemons.counted = false;
  invalid.signature = 'LD';
  invalid.signed = true;
  assert.equal(reconcileDeliveryUpdate({ ...invalid, signed: false }, invalid).signed, false);
});

test('the complete delivery progression invalidates and repairs dependent decisions explicitly', () => {
  let state = initialProgress().tasks['check-the-delivery-in'];
  const update = (change: (draft: DeliveryState) => void) => {
    const draft = structuredClone(state);
    change(draft);
    state = reconcileDeliveryUpdate(state, draft);
  };

  update((draft) => { draft.contextRevealed = true; });
  assert.equal(state.contextRevealed, false);

  for (const line of ORDER_LINES) {
    update((draft) => {
      Object.assign(draft.lines[line.id], {
        counted: true,
        arrived: String(line.arrived),
        probed: line.chilled,
        temperature: line.chilled ? String(line.actualC) : '',
        status: line.expectedStatus,
        comparison: line.id === SHORT_LINE_ID ? 'differs-both' : 'matches-both',
        acceptance: expectedAcceptance(line),
      });
    });
    assert.equal(state.lines[line.id].acceptedAmount, String(expectedAcceptedAmount(line)));
  }
  for (const check of Object.keys(state.fishChecks)) {
    update((draft) => { draft.fishChecks[check as keyof typeof draft.fishChecks] = true; });
  }
  update((draft) => { draft.fishReason = 'condition-and-temperature'; });

  const shortLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
  update((draft) => {
    draft.missingAmount = String(shortLine.arrived);
    draft.noteLineId = SHORT_LINE_ID;
    draft.noteAmendedTo = String(shortLine.arrived);
  });
  assert.equal(deliveryDisclosureReady(state), true, 'an attempted answer is enough for disclosure');
  update((draft) => { draft.contextRevealed = true; });
  assert.equal(state.contextRevealed, true);
  update((draft) => {
    draft.missingAmount = String(shortLine.ordered - shortLine.arrived);
    draft.report = { productId: SHORT_LINE_ID, service: 'tomorrow-lunch', action: 'contact-supplier' };
  });
  update((draft) => {
    draft.reportAttempted = true;
    draft.reportSentSnapshot = deliveryReportSnapshot(draft);
    draft.radioedMarcus = true;
  });
  update((draft) => { draft.amendmentInitials = 'LD'; });
  update((draft) => {
    draft.amendments = {
      [SHORT_LINE_ID]: { amendedTo: '8', initials: '', refused: false, temperature: '' },
      [REFUSED_LINE_ID]: { amendedTo: '0', initials: '', refused: true, temperature: '7.8' },
    };
  });
  update((draft) => {
    draft.amendments[SHORT_LINE_ID].initials = 'LD';
    draft.amendments[REFUSED_LINE_ID].initials = 'LD';
  });
  assert.equal(canSignDelivery(state), true);
  update((draft) => { draft.signature = 'LD'; draft.signed = true; });
  assert.equal(state.signed, true);

  update((draft) => { draft.lines[SHORT_LINE_ID].arrived = String(shortLine.arrived - 1); });
  assert.equal(state.radioedMarcus, false);
  assert.equal(state.reportSentSnapshot, '');
  assert.equal(state.signed, false);
  assert.equal(state.signature, '');

  update((draft) => { draft.lines[SHORT_LINE_ID].arrived = String(shortLine.arrived); });
  assert.equal(state.radioedMarcus, false, 'repair does not auto-send');
  assert.equal(state.signed, false, 'repair does not auto-sign');
  update((draft) => { draft.noteAmendedTo = String(shortLine.arrived - 1); });
  assert.equal(state.amendmentInitials, '');
  update((draft) => { draft.noteAmendedTo = String(shortLine.arrived); });
  update((draft) => { draft.amendmentInitials = 'LD'; });
  update((draft) => { draft.amendments[SHORT_LINE_ID].initials = 'LD'; });
  update((draft) => {
    draft.reportSentSnapshot = deliveryReportSnapshot(draft);
    draft.radioedMarcus = true;
  });
  assert.equal(canSignDelivery(state), true);
  update((draft) => { draft.signature = 'LD'; draft.signed = true; });
  assert.equal(evaluateDelivery(state).done, true);
});

test('an amendment against a line the learner later corrects is dropped and cannot be signed over', () => {
  const start = completeDelivery();
  // Wrong decision first: the lemons are refused and amended on the note.
  const refusedLemons = reconcileDeliveryUpdate(start, {
    ...start,
    lines: { ...start.lines, lemons: { ...start.lines.lemons, status: 'refused', acceptance: 'refuse', acceptedAmount: '0' } },
  });
  assert.equal(lineNeedsAmendment(refusedLemons, 'lemons'), true);
  const amended = reconcileDeliveryUpdate(refusedLemons, {
    ...refusedLemons,
    amendments: {
      ...refusedLemons.amendments,
      lemons: { amendedTo: '0', initials: 'LD', refused: true, temperature: '' },
    },
  });
  assert.equal(canSignDelivery(amended), false);

  // A stale amendment left behind by any route is rejected on review, not just pruned.
  const stale = { ...start, amendments: { ...start.amendments, lemons: { amendedTo: '0', initials: 'LD', refused: true, temperature: '' } } };
  assert.equal(canSignDelivery(stale), false);
  assert.ok(deliveryReviewIssues(stale).some((issue) => issue.target === 'note' && /Lemons/.test(issue.message)));

  // Correcting the row back to accepted removes the amendment and the note signs cleanly.
  const corrected = reconcileDeliveryUpdate(amended, {
    ...amended,
    lines: { ...amended.lines, lemons: { ...start.lines.lemons } },
  });
  assert.equal(lineNeedsAmendment(corrected, 'lemons'), false);
  assert.equal(corrected.amendments.lemons, undefined);
  assert.equal(canSignDelivery(corrected), true);
});

test('partial legacy saves retain old entries and receive blank new decisions', () => {
  const old = initialProgress();
  const oldDelivery = {
    lines: {
      salmon: { counted: true, arrived: '8', probed: true, temperature: '2.1', status: 'short' },
    },
    fishChecks: old.tasks['check-the-delivery-in'].fishChecks,
    radioedMarcus: true,
    noteAmendedTo: '8',
    signature: 'LD',
    signed: true,
  };
  const saved = { ...old, tasks: { ...old.tasks, 'check-the-delivery-in': oldDelivery } };
  const storage = new Map([[STORAGE_KEY, JSON.stringify(saved)]]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    },
  });
  try {
    const loaded = loadProgress(false).tasks['check-the-delivery-in'];
    assert.equal(loaded.lines.salmon.arrived, '8');
    assert.equal(loaded.lines.salmon.comparison, null);
    assert.equal(loaded.lines.salmon.acceptance, null);
    assert.equal(loaded.lines.salmon.acceptedAmount, '');
    assert.equal(loaded.fishReason, null);
    assert.equal(loaded.missingAmount, '');
    assert.equal(loaded.report.productId, '');
    assert.equal(loaded.signature, 'LD');
    assert.equal(loaded.signed, false);
    assert.equal(evaluateDelivery(loaded).done, false);
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});

test('completed legacy delivery records remain frozen without fabricated decisions', () => {
  const old = initialProgress();
  const delivery = old.tasks['check-the-delivery-in'];
  delivery.lines.salmon.arrived = '8';
  delivery.signature = 'LD';
  delivery.signed = true;
  const saved = {
    ...old,
    completed: ['check-the-delivery-in'],
    tasks: { ...old.tasks, 'check-the-delivery-in': delivery },
  };
  const storage = new Map([[STORAGE_KEY, JSON.stringify(saved)]]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null } },
  });
  try {
    const loaded = loadProgress(false);
    const state = loaded.tasks['check-the-delivery-in'];
    assert.equal(loaded.completed.includes('check-the-delivery-in'), true);
    assert.equal(state.signed, true);
    assert.equal(state.signature, 'LD');
    assert.equal(state.lines.salmon.comparison, null);
    assert.equal(state.report.productId, '');
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});