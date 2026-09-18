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

const deliveryTotal = ORDER_LINES.length * 2 + FISH_CHECKS.length + 3;

export function getDeliveryGuide(state: DeliveryState): StepGuide {
  const physicalLine = ORDER_LINES.find((line) => {
    const row = state.lines[line.id];
    return !row?.counted || (line.chilled && !row?.probed);
  });
  if (physicalLine) {
    const row = state.lines[physicalLine.id];
    const index = ORDER_LINES.indexOf(physicalLine);
    const needsCount = !row?.counted;
    return {
      id: `delivery-check-${physicalLine.id}-${needsCount ? 'count' : 'temperature'}`,
      step: 1 + index,
      total: deliveryTotal,
      title: `${needsCount ? (physicalLine.unit === 'kg' ? 'Weigh' : 'Count') : 'Take the temperature of'} ${physicalLine.item}`,
      instruction: needsCount
        ? `${physicalLine.unit === 'kg' ? 'Weigh' : 'Count'} what came in and write the result in your notebook.`
        : 'Take the temperature, wait for the probe to settle, then write it in your notebook.',
      actionLabel: `Open ${physicalLine.item}`,
      place: 'goods-in',
      action: `delivery:box:${physicalLine.id}`,
    };
  }

  const fishCheck = FISH_CHECKS.find((check) => !state.fishChecks[check.id]);
  if (fishCheck) {
    const fishIndex = FISH_CHECKS.indexOf(fishCheck);
    return {
      id: `delivery-fish-${fishCheck.id}`,
      step: 1 + ORDER_LINES.length + fishIndex,
      total: deliveryTotal,
      title: `${fishCheck.label === 'Smell' ? 'Smell' : `Check the ${fishCheck.label.toLowerCase()}`} of the fish`,
      instruction: fishCheck.whatYouFind,
      actionLabel: 'Open the sea bass box',
      place: 'goods-in',
      action: 'delivery:box:sea-bass',
    };
  }

  const unfinishedLine = ORDER_LINES.find((line) => {
    const row = state.lines[line.id];
    return !row
      || parseNumber(row.arrived) !== line.arrived
      || row.status !== line.expectedStatus
      || (line.chilled && !within(row.temperature, line.actualC ?? 0, READING_TOLERANCE_C));
  });
  if (unfinishedLine) {
    const index = ORDER_LINES.indexOf(unfinishedLine);
    return {
      id: `delivery-sheet-${unfinishedLine.id}`,
      step: 1 + ORDER_LINES.length + FISH_CHECKS.length + index,
      total: deliveryTotal,
      title: `Write up ${unfinishedLine.item}`,
      instruction: 'Use your notes for the amount and temperature, then mark it all here, short or refused.',
      actionLabel: 'Open the order sheet',
      place: 'goods-in',
      action: 'delivery:order-sheet',
    };
  }

  if (!state.radioedMarcus) {
    return {
      id: 'delivery-report-shortage',
      step: deliveryTotal - 2,
      total: deliveryTotal,
      title: 'Tell Terence about the salmon shortage',
      instruction: 'Use the radio by the back door to tell Terence that four kilos are missing.',
      actionLabel: 'Show the radio',
      place: 'goods-in',
      action: 'delivery:radio',
    };
  }

  if (parseNumber(state.noteAmendedTo) !== ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!.arrived) {
    return {
      id: 'delivery-amend-note',
      step: deliveryTotal - 1,
      total: deliveryTotal,
      title: 'Amend the delivery note',
      instruction: 'Cross out 12 kilos of salmon and write the 8 kilos that came in.',
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