import {
  FISH_CHECKS,
  FRIDGE_UNITS,
  ORDER_LINES,
  OVERNIGHT_LOG,
  READING_TOLERANCE_C,
  SHORT_LINE_ID,
} from '@/content/activities';
import type { StepGuide } from '@/content/step-guide';
import type { DeliveryState, HandoverState } from '@/lib/simulation';
import { parseNumber, within } from '@/lib/simulation';
import { handoverLogRead, nextHandoverUnit } from '@/lib/handover-round';

export function getHandoverGuide(state: HandoverState): StepGuide {
  if (!handoverLogRead(state)) {
    return {
      id: 'handover-log',
      step: 1,
      total: 3,
      title: 'See what happened overnight',
      instruction: "Have a quick read of the night team's notes. One fridge needs a closer look.",
      actionLabel: 'Read the notes',
      place: 'pass',
      action: 'handover:workspace',
    };
  }

  const nextUnit = nextHandoverUnit(state);
  if (nextUnit) {
    const index = FRIDGE_UNITS.indexOf(nextUnit);
    return {
      id: `handover-check-${nextUnit.id}`,
      step: 2,
      total: 3,
      title: `${nextUnit.name} — ${index + 1} of ${FRIDGE_UNITS.length}`,
      instruction: "Open it up, look around and take the temperature. Write down anything the next chef should know.",
      actionLabel: state.rows[nextUnit.id]?.probed ? 'Carry on here' : `Check ${nextUnit.name}`,
      place: 'pass',
      action: 'handover:workspace',
    };
  }

  return {
    id: 'handover-finished',
    step: 3,
    total: 3,
    title: 'One last look',
    instruction: "That's all seven. Check the board looks right, then you're done here.",
    actionLabel: 'Check the board',
    place: 'pass',
    action: 'handover:workspace',
  };
}

const deliveryTotal = ORDER_LINES.length + 3;

export function getDeliveryGuide(state: DeliveryState): StepGuide {
  const physicalLine = ORDER_LINES.find((line) => {
    const row = state.lines[line.id];
    return !row?.counted || (line.chilled && !row?.probed)
      || parseNumber(row.arrived) !== line.arrived
      || row.status !== line.expectedStatus
      || (line.chilled && !within(row.temperature, line.actualC ?? 0, READING_TOLERANCE_C))
      || (!!state.redesign && state.redesign.accepted[line.id] !== 'accept');
  });
  if (physicalLine) {
    const row = state.lines[physicalLine.id];
    const index = ORDER_LINES.indexOf(physicalLine);
    const needsCount = !row?.counted;
    const needsProbe = physicalLine.chilled && !row?.probed;
    return {
      id: `delivery-check-${physicalLine.id}-${needsCount ? 'count' : needsProbe ? 'temperature' : 'review'}`,
      step: 1 + index,
      total: deliveryTotal,
      title: `Check ${physicalLine.item}`,
      instruction: needsCount
        ? 'Inspect the goods, measure what arrived and enter it beside the order. Decide whether to accept the checked quantity.'
        : needsProbe
        ? 'Take a temperature reading for this chilled item, then record it beside your checked quantity.'
        : 'Compare your findings with the order and scenario guidance. Finish this row before moving to another item.',
      actionLabel: `Open ${physicalLine.item}`,
      place: 'goods-in',
      action: `delivery:box:${physicalLine.id}`,
    };
  }

  const fishCheck = FISH_CHECKS.find((check) => !state.fishChecks[check.id]);
  if (fishCheck || (state.redesign && state.redesign.fishReason.trim().length <= 5)) {
    return {
      id: `delivery-fish-${fishCheck?.id ?? 'reason'}`,
      step: ORDER_LINES.length + 1,
      total: deliveryTotal,
      title: fishCheck ? 'Inspect the whole fish' : 'Explain the fish decision',
      instruction: 'Reveal each inspection finding, then explain how the evidence supports your decision.',
      actionLabel: 'Open the sea bass box',
      place: 'goods-in',
      action: 'delivery:box:sea-bass',
    };
  }

  if (!state.radioedMarcus || (state.redesign && !state.redesign.reportSent)) {
    return {
      id: 'delivery-report-shortage',
      step: deliveryTotal - 1,
      total: deliveryTotal,
      title: 'Report the discrepancy',
      instruction: 'Compare the order, supplier claim and your checked quantity. Calculate what is missing and write your message to Terence.',
      actionLabel: 'Prepare the report',
      place: 'goods-in',
      action: 'delivery:radio',
    };
  }

  if (parseNumber(state.noteAmendedTo) !== ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!.arrived) {
    return {
      id: 'delivery-amend-note',
      step: deliveryTotal,
      total: deliveryTotal,
      title: 'Amend the delivery note',
      instruction: 'Use your checked and accepted quantity to correct the fish supplier’s note. Keep the original claim visible.',
      actionLabel: 'Open the delivery note',
      place: 'goods-in',
      action: 'delivery:note',
    };
  }

  return {
    id: state.signed && state.signature.trim() !== '' ? 'delivery-finished' : 'delivery-sign-note',
    step: deliveryTotal,
    total: deliveryTotal,
    title: state.signed && state.signature.trim() !== '' ? 'Ready to sign off' : 'Sign the delivery note',
    instruction: state.signed && state.signature.trim() !== ''
      ? 'Every box is checked and the delivery note is right.'
      : 'Check the amended amount, then sign for what came in.',
    actionLabel: 'Open the delivery note',
    place: 'goods-in',
    action: 'delivery:note',
  };
}