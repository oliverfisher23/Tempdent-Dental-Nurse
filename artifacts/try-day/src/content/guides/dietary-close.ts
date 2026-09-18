import { ADDED_GUESTS, ELENA_QUESTION, WASTE_BINS } from '@/content/activities';
import type { StepGuide } from '@/content/step-guide';
import { GUIDE_COPY } from '@/content/step-guide';
import {
  evaluateClose,
  evaluateDietary,
  guestAssignmentIsSafe,
  weightIsRight,
  type ChillState,
  type CloseState,
  type DietaryState,
} from '@/lib/simulation';

const DIETARY_TOTAL = 5;
const CLOSE_TOTAL = 5;
const WASTE_GUIDE_NAMES: Record<string, string> = {
  trimmings: 'the trimmings',
  spoilage: 'the spoiled food',
  plate: 'the plate waste',
};

export function getDietaryGuide(state: DietaryState): StepGuide {
  const evaluation = evaluateDietary(state);
  const chartDone = evaluation.checklist.find((item) => item.id === 'chart')?.met ?? false;

  if (!chartDone) {
    return {
      id: 'dietary-chart',
      step: 1,
      total: DIETARY_TOTAL,
      title: 'Check the allergen chart',
      instruction: 'Use the recipe cards to mark every allergen, then go through the chart with Terence.',
      actionLabel: 'Open the chart',
      place: 'events',
      action: 'dietary.open-chart',
    };
  }

  const guestIndex = ADDED_GUESTS.findIndex(
    (guest) => !guestAssignmentIsSafe(
      guest.id,
      state.guests[guest.id] ?? { main: null, dessert: null },
    ),
  );
  if (guestIndex !== -1) {
    const guest = ADDED_GUESTS[guestIndex];
    return {
      id: `dietary-guest-${guest.id}`,
      step: guestIndex + 2,
      total: DIETARY_TOTAL,
      title: `Choose ${guest.name.split(' ')[0]}'s meal`,
      instruction: 'Use the function sheet to choose a safe main and dessert for this guest.',
      actionLabel: 'Open function sheet',
      place: 'pass',
      action: 'dietary.open-function-sheet',
    };
  }

  const boardDone = evaluation.checklist.find((item) => item.id === 'board')?.met ?? false;
  if (!boardDone) {
    return {
      id: 'dietary-board',
      step: 5,
      total: DIETARY_TOTAL,
      title: 'Update the evening board',
      instruction: 'Write the changed dessert and the guest or table it is for.',
      actionLabel: 'Open the board',
      place: 'events',
      action: 'dietary.open-board',
    };
  }

  return {
    id: 'dietary-complete',
    step: DIETARY_TOTAL,
    total: DIETARY_TOTAL,
    title: GUIDE_COPY.complete,
    instruction: GUIDE_COPY.completeHint,
    actionLabel: 'Review the board',
    place: 'events',
    action: 'dietary.open-board',
  };
}

export function getCloseGuide(state: CloseState, chill: ChillState): StepGuide {
  const evaluation = evaluateClose(state, chill);

  for (let index = 0; index < WASTE_BINS.length; index += 1) {
    const bin = WASTE_BINS[index];
    const binName = WASTE_GUIDE_NAMES[bin.id] ?? 'this bin';
    if (!state.weighed[bin.id]) {
      return {
        id: `close-weigh-${bin.id}`,
        step: index + 1,
        total: CLOSE_TOTAL,
        title: `Weigh ${binName}`,
        instruction: 'Put this bin on the scales and write the weight in your notebook.',
        actionLabel: 'Open the scales',
        place: 'pass',
        action: 'close.open-waste',
      };
    }

    if (!weightIsRight(bin.id, state.weights[bin.id] ?? '')) {
      return {
        id: `close-correct-${bin.id}`,
        step: index + 1,
        total: CLOSE_TOTAL,
        title: `Write the weight for ${binName}`,
        instruction: 'Use the weight in your notebook to correct this row on the waste sheet.',
        actionLabel: 'Open handover sheet',
        place: 'pass',
        action: 'close.open-clipboard',
      };
    }
  }

  const handoverDone = evaluation.checklist.find((item) => item.id === 'handover')?.met ?? false;
  if (!handoverDone) {
    return {
      id: 'close-handover',
      step: 4,
      total: CLOSE_TOTAL,
      title: 'Hand the kitchen on',
      instruction: 'Fill in the handover sheet for the evening team, then hand it over.',
      actionLabel: 'Open handover sheet',
      place: 'pass',
      action: 'close.open-clipboard',
    };
  }

  const signaturesDone = evaluation.checklist.find((item) => item.id === 'signatures')?.met ?? false;
  if (!signaturesDone) {
    const answerIsCorrect = ELENA_QUESTION.options.some(
      (option) => option.id === state.elenaAnswer && option.correct,
    );
    return {
      id: answerIsCorrect ? 'close-elena-sign' : 'close-elena-question',
      step: 5,
      total: CLOSE_TOTAL,
      title: answerIsCorrect ? 'Ask Terence to sign' : 'Go through the chill record',
      instruction: answerIsCorrect
        ? 'Terence can sign the chill record after checking your answer.'
        : 'Answer Terence’s question about cooling the beef, then ask him to sign.',
      actionLabel: 'Open chill record',
      place: 'pass',
      action: 'close.open-elena',
    };
  }

  return {
    id: 'close-complete',
    step: CLOSE_TOTAL,
    total: CLOSE_TOTAL,
    title: GUIDE_COPY.complete,
    instruction: GUIDE_COPY.completeHint,
    actionLabel: 'Review chill record',
    place: 'pass',
    action: 'close.open-elena',
  };
}