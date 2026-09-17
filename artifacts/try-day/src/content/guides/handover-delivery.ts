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

const handoverTotal = 1 + FRIDGE_UNITS.length * 2 + 1;

export function getHandoverGuide(state: HandoverState): StepGuide {
  if (state.logRead.length < OVERNIGHT_LOG.length) {
    return {
      id: 'handover-log',
      step: 1,
      total: handoverTotal,
      title: 'Read the overnight log',
      instruction: 'Read all four entries and remember which fridge was left open.',
      actionLabel: 'Open the log',
      place: 'pass',
      action: 'handover:log',
    };
  }

  const unmeasured = FRIDGE_UNITS.find((unit) => !state.rows[unit.id]?.probed);
  if (unmeasured) {
    const index = FRIDGE_UNITS.indexOf(unmeasured);
    return {
      id: `handover-measure-${unmeasured.id}`,
      step: 2 + index,
      total: handoverTotal,
      title: `Take the temperature of ${unmeasured.name}`,
      instruction: 'Put the temperature probe in, wait for it to settle, then write the reading in your notebook.',
      actionLabel: `Open ${unmeasured.name}`,
      place: 'corridor',
      action: `handover:fridge:${unmeasured.id}`,
    };
  }

  const wrongReading = FRIDGE_UNITS.find((unit) => {
    const reading = state.rows[unit.id]?.reading ?? '';
    return reading.trim() !== '' && !within(reading, unit.actualC, READING_TOLERANCE_C);
  });
  if (wrongReading) {
    const index = FRIDGE_UNITS.indexOf(wrongReading);
    return {
      id: `handover-recheck-${wrongReading.id}`,
      step: 2 + index,
      total: handoverTotal,
      title: `Check ${wrongReading.name} again`,
      instruction: 'Take the temperature again, then use the number shown on the probe.',
      actionLabel: `Open ${wrongReading.name}`,
      place: 'corridor',
      action: `handover:fridge:${wrongReading.id}`,
    };
  }

  const unfinishedRow = FRIDGE_UNITS.find((unit) => {
    const row = state.rows[unit.id];
    return !row
      || !within(row.reading, unit.actualC, READING_TOLERANCE_C)
      || row.time.trim() === ''
      || row.initials.trim() === '';
  });
  if (unfinishedRow) {
    const index = FRIDGE_UNITS.indexOf(unfinishedRow);
    return {
      id: `handover-board-${unfinishedRow.id}`,
      step: 2 + FRIDGE_UNITS.length + index,
      total: handoverTotal,
      title: `Write up ${unfinishedRow.name}`,
      instruction: 'Write the probe reading on the board. Check that the time and your initials are there.',
      actionLabel: 'Open the board',
      place: 'corridor',
      action: 'handover:board',
    };
  }

  const warmUnit = FRIDGE_UNITS.find((unit) => unit.id === 'larder-2')!;
  if ((state.rows[warmUnit.id]?.note ?? '').trim().length < 8) {
    return {
      id: 'handover-warm-note',
      step: handoverTotal,
      total: handoverTotal,
      title: 'Write what happened with the warm fridge',
      instruction: 'Next to Larder fridge 2, write that the food was moved and the door was shut.',
      actionLabel: 'Open the board',
      place: 'corridor',
      action: 'handover:board',
    };
  }

  return {
    id: 'handover-finished',
    step: handoverTotal,
    total: handoverTotal,
    title: 'Ready to sign off',
    instruction: 'The overnight log and every fridge check are finished.',
    actionLabel: 'Open the board',
    place: 'corridor',
    action: 'handover:board',
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
      title: 'Tell Marcus about the salmon shortage',
      instruction: 'Use the radio by the back door to tell Marcus that four kilos are missing.',
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