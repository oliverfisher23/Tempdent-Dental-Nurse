import { ADDED_GUESTS, ELENA_QUESTION, WASTE_BINS } from '@/content/activities';
import type { StepGuide } from '@/content/step-guide';
import { GUIDE_COPY } from '@/content/step-guide';
import { getDietaryRedesignStage } from '@/lib/redesign-dietary';
import {
  evaluateClose,
  evaluateDietary,
  guestAssignmentIsSafe,
  weightIsRight,
  type ChillState,
  type CloseState,
  type DietaryState,
} from '@/lib/simulation';

const DIETARY_TOTAL = 3;
const CLOSE_TOTAL = 6;
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
      instruction: 'Read each recipe beside your chart, check all fourteen categories and ask Terence to review your entries.',
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
  if (guestIndex !== -1 || (state.redesign && getDietaryRedesignStage(state) === 'guests')) {
    const guest = ADDED_GUESTS[Math.max(0, guestIndex)];
    return {
      id: `dietary-guest-${guest.id}`,
      step: 2,
      total: DIETARY_TOTAL,
      title: guestIndex !== -1 ? `Review ${guest.name.split(' ')[0]}'s courses` : 'Explain your menu decisions',
      instruction: 'Use your chart and ingredients to explain what you would keep, swap or ask about. Preparation and service checks remain separate.',
      actionLabel: 'Open function sheet',
      place: 'events',
      action: 'dietary.open-function-sheet',
    };
  }

  const boardDone = evaluation.checklist.find((item) => item.id === 'board')?.met ?? false;
  if (!boardDone || !evaluation.done) {
    return {
      id: 'dietary-board',
      step: 3,
      total: DIETARY_TOTAL,
      title: 'Update the evening board',
      instruction: 'Review each proposed change, including guest, table and reason. Keep unresolved checks on hold for Terence.',
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
        instruction: 'Inspect the contents, put this tub on the scales and enter the reading beside it.',
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
        instruction: 'Read the scales and correct this weight on the same sheet.',
        actionLabel: 'Open the scales',
        place: 'pass',
        action: 'close.open-waste',
      };
    }
  }

  if (state.redesign && (!state.redesign.wasteFocus || !state.redesign.wasteReason.trim())) {
    return {
      id: 'close-interpret',
      step: 4,
      total: CLOSE_TOTAL,
      title: 'Choose a waste follow-up',
      instruction: 'Use the weights and contents to suggest something worth investigating. Weight alone does not tell us the cause.',
      actionLabel: 'Review the waste',
      place: 'pass',
      action: 'close.open-waste',
    };
  }

  const handoverDone = evaluation.checklist.find((item) => item.id === 'handover')?.met ?? false;
  if (!handoverDone || (state.redesign && !state.redesign.recipientConfirmed)) {
    return {
      id: 'close-handover',
      step: 5,
      total: CLOSE_TOTAL,
      title: 'Hand the kitchen on',
      instruction: 'Use the saved records and supplied shift facts. Answer the evening team’s questions, clarify timing and responsibility, then hand it over.',
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
      step: 6,
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