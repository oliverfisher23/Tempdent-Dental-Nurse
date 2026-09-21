import { CHILL_RULES, PREP_SHEET, nextChillMark, type ChillInterval } from '../activities';
import { CHILL_LABELS as L, describeMinutes } from '../scenes/chill';
import type { InteractionPatternId } from '../interaction-patterns';
import type { StepGuide } from '../step-guide';
import { readingIsRight, traysHaveSpace, type ChillState } from '@/lib/simulation';

export function getChillGuide(state: ChillState, started: boolean, waiting: boolean): StepGuide {
  const guide = (id: string, step: number, title: string, instruction: string, action: string, actionLabel: string, pattern: InteractionPatternId): StepGuide =>
    ({ id, step, total: 6, title, instruction, action, actionLabel, place: 'bench', pattern });
  if (state.trays.reduce((a, b) => a + b, 0) < PREP_SHEET.yourShareKg - 0.01) {
    return guide('chill-portion', 1, 'Portion the beef', 'Choose a tray, then hold Add beef to pour. Use the 0.5 kg buttons if you prefer. Empty your half of the pan into the trays.', 'chill:portion', 'Portion the beef', 'tap');
  }
  if (!traysHaveSpace(state.shelfByTray)) {
    return guide('chill-load', 2, 'Load the chiller', 'Drag each tray from the trolley onto a shelf, or choose a tray and then choose a shelf. Leave an empty shelf between trays.', 'chill:chiller', 'Load the chiller', 'drag');
  }
  if (state.probePlacement !== 'centre') {
    return guide('chill-probe', 3, 'Place the temperature probe', 'Drag the probe onto the fullest tray, or use its Place probe in tray button, then choose where the tip goes.', 'chill:chiller', 'Place the probe', 'drag');
  }
  if (!started) {
    return guide('chill-start', 3, 'Start the chiller', 'The trays and probe are ready. Start the cycle at the control panel.', 'chill:chiller', 'Start the chiller', 'tap');
  }
  const m = state.minutesElapsed as ChillInterval;
  const previousWrong = CHILL_RULES.intervals.find(i => i < m && (!state.readings[i]?.time || !readingIsRight(i, state.readings[i]?.value ?? '')));
  if (previousWrong !== undefined) {
    return guide(`chill-correct-${previousWrong}`, 4, `Check the ${previousWrong}-minute reading`, 'Compare the chill record with your notebook and correct the reading before carrying on.', 'chill:chiller', 'Correct the reading', 'tap');
  }
  if (waiting) {
    return guide('chill-waiting', m >= 90 ? 5 : 4, 'The batch is chilling', 'The clock is moving on. Take another reading when the next half-hour is up.', 'chill:chiller', 'Watch the chiller', 'hold');
  }
  if (!readingIsRight(m, state.readings[m]?.value ?? '')) {
    return guide(`chill-read-${m}`, m >= 90 ? 5 : 4, `Take the ${m}-minute reading`, 'Press and hold the thermometer for a couple of seconds until the needle stops, then write and save the number directly below it.', 'chill:chiller', 'Take the temperature', 'hold');
  }
  if (m === 90 && state.ninetyChoice !== 'keep-logging') {
    return guide('chill-answer', 5, 'Decide what to do with the batch', 'Read Terence’s question and choose your answer below the workspace.', 'chill:chiller', 'Answer Terence', 'tap');
  }
  if (m >= 90 && !state.measuredDepths) {
    return guide('chill-measure', 5, 'Compare the tray depths', 'Drag the ruler onto a tray to measure the depth of the beef, or choose the ruler and then choose the tray.', 'chill:chiller', 'Measure the trays', 'drag');
  }
  if (m < 120) {
    return guide(`chill-wait-${m}`, m >= 90 ? 5 : 4, 'Leave the batch to chill', `Your reading is saved. Leave it ${describeMinutes((nextChillMark(m) ?? 120) - m)} using the control below the thermometer.`, 'chill:chiller', 'Return to the chiller', 'tap');
  }
  return guide('chill-sign', 6, L.next.sign, 'All the readings are written down. Add your signature at the bottom of the chill record.', 'chill:chiller', 'Sign the chill record', 'tap');
}