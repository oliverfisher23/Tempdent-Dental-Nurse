import {
  FISH_CHECKS,
  FRIDGE_UNITS,
  ORDER_LINES,
} from '@/content/activities';
import type { StepGuide } from '@/content/step-guide';
import type { DeliveryState, HandoverState } from '@/lib/simulation';
import { handoverLogRead, nextHandoverUnit } from '@/lib/handover-round';
import { canSignDelivery } from '@/lib/delivery-workflow';
import { lowerFirst } from '@/lib/utils';

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
      pattern: 'tap',
    };
  }

  const nextUnit = nextHandoverUnit(state);
  if (nextUnit) {
    const index = FRIDGE_UNITS.indexOf(nextUnit);
    return {
      id: `handover-check-${nextUnit.id}`,
      step: 2,
      total: 3,
      title: `${nextUnit.name} (${index + 1} of ${FRIDGE_UNITS.length})`,
      instruction: "Open it up, look around and take the temperature. Write down anything the next chef should know.",
      actionLabel: state.rows[nextUnit.id]?.probed ? 'Carry on here' : `Check ${nextUnit.name}`,
      place: 'pass',
      action: 'handover:workspace',
      pattern: 'tap',
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
    pattern: 'tap',
  };
}

export function getDeliveryGuide(state: DeliveryState): StepGuide {
  // Navigation checks whether work has been attempted, not whether each answer
  // is correct. The learner requests corrective feedback in the workspace.
  const suggestedOrder = [...ORDER_LINES].sort((a, b) =>
    a.id === 'smoked-haddock' ? -1 : b.id === 'smoked-haddock' ? 1 : 0);
  const unfinished = suggestedOrder.find((line) => {
    const row = state.lines[line.id];
    return !row.counted || !row.arrived.trim() || !row.comparison || !row.status
      || !row.acceptance || !row.acceptedAmount.trim()
      || (line.chilled && (!row.probed || !row.temperature.trim()))
      || (line.id === 'sea-bass' && (!state.fishReason || FISH_CHECKS.some((check) => !state.fishChecks[check.id])));
  });
  if (unfinished) return {
    id: `delivery-check-${unfinished.id}`, step: 1, total: 4,
    title: 'Check each item beside its entry',
    instruction: 'Inspect, write your results and make your decisions. You can choose any item on the sheet.',
    actionLabel: `Open ${lowerFirst(unfinished.item)}`, place: 'goods-in',
    action: `delivery:box:${unfinished.id}`,
    pattern: 'tap',
  };
  if (!state.contextRevealed) return {
    id: 'delivery-compare', step: 2, total: 4,
    title: 'Compare your amounts',
    instruction: 'Work out what is missing and prepare the amount you would put on the supplier note.',
    actionLabel: 'Compare amounts', place: 'goods-in', action: 'delivery:comparison',
    pattern: 'tap',
  };
  if (!state.radioedMarcus) return {
    id: 'delivery-report', step: 3, total: 4,
    title: 'Prepare your report',
    instruction: 'Use your checked amounts and the service information to tell Terence what needs following up.',
    actionLabel: 'Open the report', place: 'goods-in', action: 'delivery:radio',
    pattern: 'tap',
  };
  const ready = canSignDelivery(state);
  return {
    id: state.signed && ready ? 'delivery-finished' : 'delivery-review', step: 4, total: 4,
    title: state.signed && ready ? 'Ready to sign off' : 'Review before signing',
    instruction: state.signed && ready
      ? 'The note is signed. Sign off this task when you are ready to continue.'
      : 'Resolve any unfinished checks, confirm the amendment and initial it, then sign the note.',
    actionLabel: ready ? 'Open the fish note' : 'Review my work', place: 'goods-in',
    action: ready ? 'delivery:note' : 'delivery:review',
    pattern: 'tap',
  };
}
