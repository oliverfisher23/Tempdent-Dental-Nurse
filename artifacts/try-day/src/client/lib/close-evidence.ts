import {
  ADDED_GUESTS,
  DISHES,
  FRIDGE_UNITS,
  FUNCTION_SHEET,
  ORDER_LINES,
  SHORT_LINE_ID,
  WASTE_BINS,
} from '@client/content/activities';
import type { ChillState, DeliveryState, DietaryState, HandoverState, CloseState } from './simulation';

/**
 * Read-only evidence for the closing handover, drawn from the records the learner
 * signed earlier in the day. Nothing here is a completed check: a missing value is
 * reported as missing rather than filled in from the scenario truth.
 */
export interface CloseEvidence {
  larder2: {
    name: string;
    limitLabel: string;
    limitC: number;
    recorded: boolean;
    reading: string;
    time: string;
    initials: string;
    note: string;
    /** null when no numeric reading was recorded. */
    aboveLimit: boolean | null;
  };
  walkIn: { name: string; recorded: boolean; reading: string; time: string };
  salmon: {
    item: string;
    ordered: number;
    /** What the delivery brought, from the order line. */
    arrivedKg: number;
    missingKg: number;
    /** What the learner counted, as written. */
    counted: string;
    status: string | null;
    noteAmendedTo: string;
    signed: boolean;
    radioed: boolean;
  };
  beef: {
    trays: number;
    kg: string;
    readings: { minutes: number; time: string; value: string }[];
    last: { time: string; value: string } | null;
    signed: boolean;
  };
  board: { posted: boolean; note: string };
  table3: { name: string; table: number; requirement: string };
  dessertTime: string;
  frangipaneNote: string;
  pearNote: string;
  waste: { id: string; label: string; value: string }[];
}

interface EvidenceTasks {
  'take-the-handover': HandoverState;
  'check-the-delivery-in': DeliveryState;
  'chill-the-event-batch': ChillState;
  'check-the-dietary-list': DietaryState;
  'hand-the-kitchen-on': CloseState;
}

const NOT_RECORDED = 'not recorded';

export function buildCloseEvidence(tasks: EvidenceTasks): CloseEvidence {
  const handover = tasks['take-the-handover'];
  const delivery = tasks['check-the-delivery-in'];
  const chill = tasks['chill-the-event-batch'];
  const dietary = tasks['check-the-dietary-list'];
  const close = tasks['hand-the-kitchen-on'];

  const larderUnit = FRIDGE_UNITS.find((u) => u.id === 'larder-2')!;
  const larderRow = handover.rows['larder-2'];
  const larderRecorded = !!larderRow && larderRow.reading.trim() !== '';
  const larderReading = larderRecorded ? Number(larderRow.reading) : NaN;

  const walkInUnit = FRIDGE_UNITS.find((u) => u.id === 'walk-in')!;
  const walkInRow = handover.rows['walk-in'];
  const walkInRecorded = !!walkInRow && walkInRow.reading.trim() !== '';

  const line = ORDER_LINES.find((l) => l.id === SHORT_LINE_ID)!;
  const lineState = delivery.lines[SHORT_LINE_ID];

  const readings = Object.entries(chill.readings)
    .map(([minutes, reading]) => ({ minutes: Number(minutes), time: reading.time, value: reading.value }))
    .sort((a, b) => a.minutes - b.minutes);
  const last = readings.length ? readings[readings.length - 1] : null;

  const priya = ADDED_GUESTS.find((g) => g.id === 'priya')!;
  const frangipane = DISHES.find((d) => d.id === 'frangipane')!;
  const pear = DISHES.find((d) => d.id === 'pear')!;

  return {
    larder2: {
      name: larderUnit.name,
      limitLabel: larderUnit.limitLabel,
      limitC: larderUnit.limitC,
      recorded: larderRecorded,
      reading: larderRecorded ? larderRow.reading : NOT_RECORDED,
      time: larderRecorded && larderRow.time ? larderRow.time : '',
      initials: larderRow?.initials ?? '',
      note: larderRow?.note ?? '',
      aboveLimit: Number.isFinite(larderReading) ? larderReading > larderUnit.limitC : null,
    },
    walkIn: {
      name: walkInUnit.name,
      recorded: walkInRecorded,
      reading: walkInRecorded ? walkInRow.reading : NOT_RECORDED,
      time: walkInRecorded && walkInRow.time ? walkInRow.time : '',
    },
    salmon: {
      item: line.item,
      ordered: line.ordered,
      arrivedKg: line.arrived,
      missingKg: line.ordered - line.arrived,
      counted: lineState?.counted && lineState.arrived.trim() !== '' ? lineState.arrived : NOT_RECORDED,
      status: lineState?.status ?? null,
      noteAmendedTo: delivery.noteAmendedTo.trim(),
      signed: delivery.signed,
      radioed: delivery.radioedMarcus,
    },
    beef: {
      trays: chill.trays.filter((kg) => kg > 0).length,
      kg: chill.trays.reduce((sum, kg) => sum + kg, 0).toFixed(1),
      readings,
      last: last ? { time: last.time, value: last.value } : null,
      signed: chill.studentSigned,
    },
    board: { posted: dietary.boardPosted, note: dietary.boardNote.trim() },
    table3: { name: priya.name, table: priya.table, requirement: priya.requirement },
    dessertTime: FUNCTION_SHEET.timings.find((t) => t.what.toLowerCase().startsWith('dessert'))?.time ?? '',
    frangipaneNote: frangipane.note ?? '',
    pearNote: pear.note ?? '',
    waste: WASTE_BINS.map((bin) => ({ id: bin.id, label: bin.label, value: (close.weights[bin.id] ?? '').trim() })),
  };
}
