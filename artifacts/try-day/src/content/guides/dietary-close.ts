import { ADDED_GUESTS, ELENA_QUESTION, WASTE_BINS } from '@/content/activities';
import type { StepGuide } from '@/content/step-guide';
import { GUIDE_COPY } from '@/content/step-guide';
import { COURSES, courseChecked, getDietaryRedesignStage } from '@/lib/redesign-dietary';
import {
  evaluateClose,
  evaluateDietary,
  weightIsRight,
  type ChillState,
  type CloseState,
  type DietaryState,
} from '@/lib/simulation';

const DIETARY_TOTAL = 4;
const CLOSE_TOTAL = 5;
const WASTE_GUIDE_NAMES: Record<string, string> = {
  trimmings: 'the trimmings',
  spoilage: 'the spoiled food',
  plate: 'the plate waste',
};

export function getDietaryGuide(state: DietaryState): StepGuide {
  const evaluation = evaluateDietary(state);
  const stage = getDietaryRedesignStage(state);

  if (stage === 'sheet') {
    return {
      id: 'dietary-sheet',
      step: 1,
      total: DIETARY_TOTAL,
      title: 'Read the function sheet',
      instruction: 'Take the sheet from Yvie: what the event is, what is on the menu and who is already catered for. The added guests come later.',
      actionLabel: 'Take the sheet',
      place: 'pass',
      action: 'dietary.open-function-sheet',
      pattern: 'tap',
    };
  }

  if (stage === 'chart') {
    const flagged = state.flaggedDishes.length;
    return {
      id: flagged > 0 ? 'dietary-chart-again' : 'dietary-chart',
      step: 2,
      total: DIETARY_TOTAL,
      title: flagged > 0 ? `Look again at ${flagged === 1 ? 'one row' : `${flagged} rows`}` : 'Check the allergen chart',
      instruction: flagged > 0
        ? 'Terence has marked the rows to revisit. Read the card beside each one, correct the marks, confirm the row and ask for another review.'
        : 'Read each recipe card beside its row. Check Terence’s three rows against their cards and mark the two dessert rows yourself, all fourteen columns. Confirm each row, then ask Terence to review the chart.',
      actionLabel: 'Open the chart',
      place: 'events',
      action: 'dietary.open-chart',
      pattern: 'tap',
    };
  }

  if (stage === 'guests') {
    // The next guest with a course Terence has not yet been asked to check.
    const redesign = state.redesign;
    const pending = ADDED_GUESTS.find((guest) =>
      COURSES.some((course) => !redesign || !courseChecked(redesign, guest.id, course, state.guests[guest.id] ?? { main: null, dessert: null }, state.chart)),
    );
    return {
      id: pending ? `dietary-guest-${pending.id}` : 'dietary-guests',
      step: 3,
      total: DIETARY_TOTAL,
      title: pending ? `Decide ${pending.name.split(' ')[0]}’s main and dessert` : 'Explain each decision',
      instruction: 'Use your chart: say what it shows for each course, tick the evidence, keep, swap or ask, give a reason, then check each course with Terence. Preparation checks stay with him.',
      actionLabel: 'Open guest decisions',
      place: 'events',
      action: 'dietary.open-guests',
      pattern: 'tap',
    };
  }

  if (stage === 'board' || !evaluation.done) {
    return {
      id: 'dietary-board',
      step: 4,
      total: DIETARY_TOTAL,
      title: 'Put the changes on the evening board',
      instruction: 'Every change with the guest, table, original, replacement and reason. The preparation check stays pending for Terence.',
      actionLabel: 'Open the board',
      place: 'events',
      action: 'dietary.open-board',
      pattern: 'tap',
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
    pattern: 'tap',
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
        instruction: 'Tap a tub, press Put it on the scales, read the display, then type the weight on its row of the waste sheet.',
        actionLabel: 'Open the scales',
        place: 'pass',
        action: 'close.open-waste',
        pattern: 'tap',
      };
    }

    if (!weightIsRight(bin.id, state.weights[bin.id] ?? '')) {
      return {
        id: `close-correct-${bin.id}`,
        step: index + 1,
        total: CLOSE_TOTAL,
        title: `Write the weight for ${binName}`,
        instruction: 'Read the scales again and correct this row on the waste sheet.',
        actionLabel: 'Open the scales',
        place: 'pass',
        action: 'close.open-waste',
        pattern: 'tap',
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
      instruction: 'Write the four headings in your own words, group the follow-ups, then hand it over, answer the evening team and confirm what they read back.',
      actionLabel: 'Open handover sheet',
      place: 'pass',
      action: 'close.open-clipboard',
      pattern: 'tap',
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
      pattern: 'tap',
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
    pattern: 'tap',
  };
}
