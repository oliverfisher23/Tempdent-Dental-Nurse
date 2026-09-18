import { FISH_CHECKS, ORDER_LINES, READING_TOLERANCE_C, SHORT_LINE_ID } from '@/content/activities';
import { DELIVERY_FEEDBACK as FEEDBACK } from '@/content/delivery-feedback';
import type { DeliveryState, OrderLineState } from '@/lib/simulation';

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

function packageWeightTotal(line: (typeof ORDER_LINES)[number]): number | null {
  const packageKg = Number(line.item.match(/(\d+(?:\.\d+)?)\s*kg/i)?.[1]);
  return Number.isFinite(packageKg) ? packageKg * line.ordered : null;
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
      : line.id === 'shallots'
        && packageWeightTotal(line) !== null
        && sameNumber(entry.arrived, packageWeightTotal(line)!)
        ? FEEDBACK.shallotUnit
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
      message: line.id === SHORT_LINE_ID ? FEEDBACK.salmonQuantityAndCondition : FEEDBACK.status,
    });
  }
  if (entry.acceptance !== 'accept') {
    issues.push({
      target: lineId,
      message: line.id === SHORT_LINE_ID && entry.acceptance === 'refuse'
        ? FEEDBACK.salmonQuantityAndCondition
        : FEEDBACK.acceptance,
    });
  }
  if (!sameNumber(entry.acceptedAmount, line.arrived)) {
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

  const salmon = state.lines[SHORT_LINE_ID];
  if (state.noteLineId !== SHORT_LINE_ID) {
    issues.push({ target: 'note', message: FEEDBACK.noteLine });
  }
  if (!salmon || !sameNumber(state.noteAmendedTo, number(salmon.acceptedAmount) ?? Number.NaN)) {
    issues.push({ target: 'note', message: FEEDBACK.noteAmount });
  }
  if (state.amendmentInitials.trim() === '') {
    issues.push({ target: 'note', message: FEEDBACK.noteInitials });
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