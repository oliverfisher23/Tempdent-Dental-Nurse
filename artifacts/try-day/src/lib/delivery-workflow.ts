import { FISH_CHECKS, ORDER_LINES, READING_TOLERANCE_C, REFUSED_LINE_ID, SHORT_LINE_ID } from '@/content/activities';
import { DELIVERY_FEEDBACK as FEEDBACK } from '@/content/delivery-feedback';
import {
  expectedAcceptance,
  expectedAcceptedAmount,
  type DeliveryAmendment,
  type DeliveryState,
  type OrderLineState,
} from '@/lib/simulation';

export interface DeliveryIssue {
  target: string;
  message: string;
}

function number(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function sameNumber(value: string, expected: number): boolean {
  return number(value) === expected;
}

function expectedComparison(lineId: string): OrderLineState['comparison'] {
  const line = ORDER_LINES.find((candidate) => candidate.id === lineId);
  if (!line) return null;
  const differsOrder = line.arrived !== line.ordered;
  const differsClaim = line.arrived !== line.onDeliveryNote;
  if (differsOrder && differsClaim) return 'differs-both';
  if (differsOrder) return 'differs-order';
  if (differsClaim) return 'differs-claim';
  return 'matches-both';
}

const shortLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
const expectedMissingAmount = shortLine.ordered - shortLine.arrived;

function temperatureIsRight(entry: OrderLineState, expected: number): boolean {
  const temperature = number(entry.temperature);
  return temperature !== null
    && Math.abs(temperature - expected) <= READING_TOLERANCE_C + 1e-9;
}

export function deliveryLineIssues(state: DeliveryState, lineId: string): DeliveryIssue[] {
  const line = ORDER_LINES.find((candidate) => candidate.id === lineId);
  const entry = state.lines[lineId];
  if (!line || !entry) return [{ target: lineId, message: FEEDBACK.missingLine }];

  const issues: DeliveryIssue[] = [];
  if (!entry.counted) issues.push({ target: lineId, message: FEEDBACK.inspectQuantity });
  if (!sameNumber(entry.arrived, line.arrived)) {
    const message = line.id === SHORT_LINE_ID && sameNumber(entry.arrived, line.onDeliveryNote)
      ? FEEDBACK.salmonClaimedAsObserved
      : FEEDBACK.quantity(line.unit);
    issues.push({ target: lineId, message });
  }
  if (line.chilled) {
    if (!entry.probed) issues.push({ target: lineId, message: FEEDBACK.temperatureInspection });
    if (!temperatureIsRight(entry, line.actualC ?? 0)) {
      issues.push({ target: lineId, message: FEEDBACK.temperatureEntry });
    }
  }
  if (entry.comparison !== expectedComparison(line.id)) {
    issues.push({ target: lineId, message: FEEDBACK.comparison });
  }
  if (entry.status !== line.expectedStatus) {
    issues.push({
      target: lineId,
      message: line.id === SHORT_LINE_ID
        ? FEEDBACK.salmonQuantityAndCondition
        : line.id === REFUSED_LINE_ID && entry.status === 'arrived'
          ? FEEDBACK.creamTemperatureDecision
          : FEEDBACK.status,
    });
  }
  if (entry.acceptance !== expectedAcceptance(line)) {
    issues.push({
      target: lineId,
      message: line.id === SHORT_LINE_ID && entry.acceptance === 'refuse'
        ? FEEDBACK.salmonQuantityAndCondition
        : line.id === REFUSED_LINE_ID && entry.acceptance === 'accept'
          ? FEEDBACK.creamTemperatureDecision
          : FEEDBACK.acceptance,
    });
  }
  if (!sameNumber(entry.acceptedAmount, expectedAcceptedAmount(line))) {
    issues.push({
      target: lineId,
      message: line.id === SHORT_LINE_ID && sameNumber(entry.acceptedAmount, expectedMissingAmount)
        ? FEEDBACK.missingVersusAccepted
        : FEEDBACK.acceptedAmount,
    });
  }
  if (line.id === 'sea-bass') {
    const allFishFindings = FISH_CHECKS.every((check) => state.fishChecks[check.id]);
    if (!allFishFindings) issues.push({ target: lineId, message: FEEDBACK.fish });
    else if (state.fishReason !== 'condition-and-temperature') {
      issues.push({ target: lineId, message: FEEDBACK.fishReason });
    }
  }
  return issues;
}

export function deliveryDisclosureReady(state: DeliveryState): boolean {
  const salmon = state.lines[SHORT_LINE_ID];
  return !!salmon
    && salmon.counted
    && salmon.probed
    && salmon.arrived.trim() !== ''
    && salmon.temperature.trim() !== ''
    && salmon.comparison !== null
    && salmon.status !== null
    && salmon.acceptance !== null
    && salmon.acceptedAmount.trim() !== ''
    && state.missingAmount.trim() !== ''
    && state.noteLineId.trim() !== ''
    && state.noteAmendedTo.trim() !== '';
}

const amendmentLineIds = [SHORT_LINE_ID, REFUSED_LINE_ID] as const;

/**
 * A line needs an amendment on the note when the learner's own sheet decision differs from
 * the supplier's claim: a refusal, or an accepted amount that is not the claimed amount.
 * Driven by the learner's decisions, never by the answer key.
 */
export function lineNeedsAmendment(state: DeliveryState, lineId: string): boolean {
  const line = ORDER_LINES.find((candidate) => candidate.id === lineId);
  const entry = state.lines[lineId];
  if (!line || !entry) return false;
  if (entry.acceptance === 'refuse') return true;
  const accepted = number(entry.acceptedAmount);
  return accepted !== null && accepted !== line.onDeliveryNote;
}

function amendmentIsBlank(amendment: DeliveryAmendment): boolean {
  return amendment.amendedTo.trim() === '' && amendment.initials.trim() === ''
    && !amendment.refused && amendment.temperature.trim() === '';
}

/** Drop written amendments against lines whose sheet decision no longer differs from the claim. */
function pruneStaleAmendments(state: DeliveryState): DeliveryState {
  const amendments = state.amendments ?? {};
  const stale = Object.keys(amendments).filter((lineId) => !lineNeedsAmendment(state, lineId));
  if (stale.length === 0) return state;
  const kept = Object.fromEntries(Object.entries(amendments).filter(([lineId]) => !stale.includes(lineId)));
  return { ...state, amendments: kept };
}

export function deliveryAmendment(state: DeliveryState, lineId: string): DeliveryAmendment {
  const saved = state.amendments?.[lineId];
  if (saved) return saved;
  if (lineId === SHORT_LINE_ID && state.noteLineId === SHORT_LINE_ID) {
    return {
      amendedTo: state.noteAmendedTo,
      initials: state.amendmentInitials,
      refused: false,
      temperature: '',
    };
  }
  return { amendedTo: '', initials: '', refused: false, temperature: '' };
}

export function deliveryReportIssues(state: DeliveryState): DeliveryIssue[] {
  const issues: DeliveryIssue[] = [];
  if (!state.contextRevealed) {
    issues.push({ target: 'comparison', message: FEEDBACK.context });
  }
  if (state.report.productId !== SHORT_LINE_ID) {
    issues.push({ target: 'report', message: FEEDBACK.reportProduct });
  }
  if (!sameNumber(state.missingAmount, expectedMissingAmount)) {
    issues.push({
      target: 'comparison',
      message: sameNumber(state.missingAmount, shortLine.arrived)
        ? FEEDBACK.missingVersusAccepted
        : FEEDBACK.missingAmount,
    });
  }
  const salmon = state.lines[SHORT_LINE_ID];
  const salmonEvidenceComplete = !!salmon
    && salmon.counted
    && sameNumber(salmon.arrived, shortLine.arrived)
    && salmon.probed
    && temperatureIsRight(salmon, shortLine.actualC ?? 0)
    && salmon.comparison === expectedComparison(SHORT_LINE_ID)
    && salmon.status === shortLine.expectedStatus
    && salmon.acceptance === 'accept'
    && sameNumber(salmon.acceptedAmount, shortLine.arrived);
  if (!salmonEvidenceComplete) {
    issues.push({
      target: SHORT_LINE_ID,
      message: salmon?.acceptance === 'refuse' || salmon?.status === 'refused'
        ? FEEDBACK.salmonQuantityAndCondition
        : FEEDBACK.reportEvidence,
    });
  }
  if (state.report.service !== 'tomorrow-lunch') {
    issues.push({ target: 'report', message: FEEDBACK.reportService });
  }
  if (state.report.action !== 'contact-supplier') {
    issues.push({ target: 'report', message: FEEDBACK.reportAction });
  }
  return issues;
}

export function deliveryReportText(state: DeliveryState): string {
  const line = ORDER_LINES.find((candidate) => candidate.id === state.report.productId);
  const entry = line ? state.lines[line.id] : undefined;
  const product = line?.item ?? 'Product not selected';
  const checked = entry?.arrived.trim() || 'not entered';
  const accepted = entry?.acceptedAmount.trim() || 'not confirmed';
  const missing = state.missingAmount.trim() || 'not entered';
  const service = state.report.service === 'tomorrow-lunch'
    ? "Tomorrow's lunch is affected."
    : state.report.service === 'tonight-launch'
      ? "Tonight's launch is affected."
      : state.report.service === 'both'
        ? "Tonight's launch and tomorrow's lunch are affected."
        : 'Service not selected.';
  const action = state.report.action === 'contact-supplier'
    ? 'Contact the supplier.'
    : state.report.action === 'change-tonight-menu'
      ? "Change tonight's menu."
      : state.report.action === 'no-follow-up'
        ? 'No follow-up is needed.'
        : 'Follow-up not selected.';
  const claims = line
    ? `The order says ${line.ordered} ${line.unit} and the supplier says ${line.onDeliveryNote} ${line.unit}.`
    : '';
  return `${product}: ${claims} I checked ${checked}${line ? ` ${line.unit}` : ''}, accepted ${accepted}${line ? ` ${line.unit}` : ''}, and recorded ${missing}${line ? ` ${line.unit}` : ''} missing. ${service} ${action}`.replace(/\s+/g, ' ').trim();
}

export function deliveryReportSnapshot(state: DeliveryState): string {
  const line = state.report.productId;
  const entry = line ? state.lines[line] : undefined;
  return JSON.stringify({
    productId: state.report.productId,
    service: state.report.service,
    action: state.report.action,
    checkedAmount: entry?.arrived ?? '',
    acceptance: entry?.acceptance ?? null,
    acceptedAmount: entry?.acceptedAmount ?? '',
    missingAmount: state.missingAmount,
  });
}

export function deliveryReviewIssues(state: DeliveryState, includeSignature = false): DeliveryIssue[] {
  const issues = ORDER_LINES.flatMap((line) => deliveryLineIssues(state, line.id));
  if (!sameNumber(state.missingAmount, expectedMissingAmount)) {
    issues.push({
      target: 'comparison',
      message: sameNumber(state.missingAmount, shortLine.arrived)
        ? FEEDBACK.missingVersusAccepted
        : FEEDBACK.missingAmount,
    });
  }

  issues.push(...deliveryReportIssues(state));
  const reportIsCurrent = state.reportSentSnapshot !== ''
    && state.reportSentSnapshot === deliveryReportSnapshot(state);
  if (!state.reportAttempted || !state.radioedMarcus || !reportIsCurrent) {
    issues.push({ target: 'report', message: FEEDBACK.reportSend });
  }

  for (const lineId of amendmentLineIds) {
    const line = ORDER_LINES.find((candidate) => candidate.id === lineId)!;
    const entry = state.lines[lineId];
    // A refusal the learner has not made yet is a sheet issue, raised above. Naming
    // the note amendment here would hand them the decision.
    if (lineId === REFUSED_LINE_ID && entry?.acceptance !== 'refuse') continue;
    const amendment = deliveryAmendment(state, lineId);
    if (!entry || !sameNumber(amendment.amendedTo, expectedAcceptedAmount(line))) {
      issues.push({ target: 'note', message: FEEDBACK.noteAmountFor(line.item) });
    }
    if (lineId === REFUSED_LINE_ID) {
      if (!amendment.refused) issues.push({ target: 'note', message: FEEDBACK.noteRefusal });
      if (!sameNumber(amendment.temperature, line.actualC ?? Number.NaN)) {
        issues.push({ target: 'note', message: FEEDBACK.noteTemperature });
      }
    }
    if (amendment.initials.trim() === '') {
      issues.push({ target: 'note', message: FEEDBACK.noteInitialsFor(line.item) });
    }
  }
  for (const line of ORDER_LINES) {
    if ((amendmentLineIds as readonly string[]).includes(line.id)) continue;
    const written = state.amendments?.[line.id];
    if (written && !amendmentIsBlank(written)) {
      issues.push({ target: 'note', message: FEEDBACK.noteUnexpectedAmendmentFor(line.item) });
    }
  }
  if (includeSignature && (!state.signed || state.signature.trim() === '')) {
    issues.push({ target: 'signature', message: FEEDBACK.signature });
  }
  return issues;
}

export function canSignDelivery(state: DeliveryState): boolean {
  return deliveryReviewIssues(state, false).length === 0;
}

function acceptedAmountsChanged(previous: DeliveryState, next: DeliveryState): boolean {
  return ORDER_LINES.some((line) =>
    previous.lines[line.id]?.acceptedAmount !== next.lines[line.id]?.acceptedAmount);
}

function substantiveSnapshot(state: DeliveryState): string {
  return JSON.stringify({
    lines: state.lines,
    fishChecks: state.fishChecks,
    fishReason: state.fishReason,
    radioedMarcus: state.radioedMarcus,
    noteAmendedTo: state.noteAmendedTo,
    missingAmount: state.missingAmount,
    noteLineId: state.noteLineId,
    amendmentInitials: state.amendmentInitials,
    amendments: state.amendments,
    report: state.report,
    reportSentSnapshot: state.reportSentSnapshot,
  });
}

export function reconcileDeliveryUpdate(previous: DeliveryState, proposed: DeliveryState): DeliveryState {
  let next: DeliveryState = {
    ...proposed,
    reportAttempted: previous.reportAttempted || proposed.reportAttempted,
    lines: { ...proposed.lines },
  };

  for (const line of ORDER_LINES) {
    const before = previous.lines[line.id];
    const after = next.lines[line.id];
    if (!before || !after || before.acceptance === after.acceptance || before.acceptedAmount !== after.acceptedAmount) continue;
    next.lines[line.id] = {
      ...after,
      acceptedAmount: after.acceptance === 'refuse' ? '0' : after.acceptance === 'accept' ? after.arrived : '',
    };
  }

  if (!previous.contextRevealed && next.contextRevealed && !deliveryDisclosureReady(next)) {
    next = { ...next, contextRevealed: false };
  }

  const amendmentFactsChanged =
    previous.noteLineId !== next.noteLineId
    || previous.noteAmendedTo !== next.noteAmendedTo
    || acceptedAmountsChanged(previous, next);
  if (amendmentFactsChanged) next = { ...next, amendmentInitials: '' };

  const amendmentsChanged = JSON.stringify(previous.amendments ?? {}) !== JSON.stringify(next.amendments ?? {});
  if (amendmentsChanged) {
    const amendments = { ...(next.amendments ?? {}) };
    for (const lineId of amendmentLineIds) {
      const before = deliveryAmendment(previous, lineId);
      const after = deliveryAmendment(next, lineId);
      if (
        before.amendedTo !== after.amendedTo
        || before.refused !== after.refused
        || before.temperature !== after.temperature
      ) {
        amendments[lineId] = { ...after, initials: '' };
      }
    }
    next = { ...next, amendments };
  }
  if (acceptedAmountsChanged(previous, next)) {
    const amendments = { ...(next.amendments ?? {}) };
    for (const lineId of amendmentLineIds) {
      if (previous.lines[lineId]?.acceptedAmount !== next.lines[lineId]?.acceptedAmount && amendments[lineId]) {
        amendments[lineId] = { ...amendments[lineId], initials: '' };
      }
    }
    next = { ...next, amendments };
  }

  next = pruneStaleAmendments(next);

  if (deliveryReportSnapshot(previous) !== deliveryReportSnapshot(next)) {
    next = { ...next, radioedMarcus: false, reportSentSnapshot: '' };
  }

  const validReport = deliveryReportIssues(next).length === 0;
  const currentReport = next.reportSentSnapshot !== ''
    && next.reportSentSnapshot === deliveryReportSnapshot(next);
  if (!validReport || !currentReport) next = { ...next, radioedMarcus: false };

  if (
    previous.signed
    && (
      previous.signature !== next.signature
      || amendmentsChanged
      || substantiveSnapshot(previous) !== substantiveSnapshot(next)
    )
  ) {
    next = { ...next, signed: false, signature: '' };
  }
  if (
    !previous.signed
    && next.signed
    && (next.signature.trim() === '' || !canSignDelivery(next))
  ) {
    next = { ...next, signed: false };
  }
  return next;
}