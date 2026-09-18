import { CHILL_RULES, PREP_SHEET, type ChillInterval } from '../activities';
import { CHILL_LABELS as L } from '../scenes/chill';
import type { StepGuide } from '../step-guide';
import { readingIsRight, traysHaveSpace, type ChillState } from '@/lib/simulation';

export function getChillGuide(state: ChillState, started: boolean, waiting: boolean): StepGuide {
  const guide = (id: string, step: number, title: string, instruction: string, action: string, actionLabel: string): StepGuide =>
    ({ id, step, total: 6, title, instruction, action, actionLabel, place: 'bench' });
  if (state.trays.reduce((a, b) => a + b, 0) < PREP_SHEET.yourShareKg - 0.01) {
    return guide('chill-portion', 1, 'Portion the beef', 'Carry the ladle over each tray and hold it there to pour. Empty your half of the pan into the trays.', 'chill:portion', 'Open the prep bench');
  }
  if (!traysHaveSpace(state.shelfByTray)) {
    return guide('chill-load', 2, 'Load the chiller', 'Drag the trays from the trolley onto separate shelves. Leave an empty shelf between them.', 'chill:chiller', 'Open the chiller');
  }
  if (state.probePlacement !== 'centre') {
    return guide('chill-probe', 3, 'Place the temperature probe', 'Carry the probe to the fullest tray, then place its tip in the middle of the beef.', 'chill:chiller', 'Place the probe');
  }
  if (!started) {
    return guide('chill-start', 3, 'Start the chiller', 'The trays and probe are ready. Start the cycle at the control panel.', 'chill:chiller', 'Open the controls');
  }
  const m = state.minutesElapsed as ChillInterval;
  const previousWrong = CHILL_RULES.intervals.find(i => i < m && (!state.readings[i]?.time || !readingIsRight(i, state.readings[i]?.value ?? '')));
  if (previousWrong !== undefined) {
    return guide(`chill-correct-${previousWrong}`, 4, `Check the ${previousWrong}-minute reading`, 'Compare the chill record with your notebook and correct the reading before carrying on.', 'chill:record', 'Open the chill record');
  }
  if (waiting) {
    return guide('chill-waiting', m >= 90 ? 5 : 4, 'The batch is chilling', 'The clock is moving on. Take another reading when the next half-hour is up.', 'chill:chiller', 'Watch the chiller');
  }
  if (!readingIsRight(m, state.readings[m]?.value ?? '')) {
    return guide(`chill-read-${m}`, m >= 90 ? 5 : 4, `Take the ${m}-minute reading`, 'Hold the thermometer until it settles, then write and save the number directly below it.', 'chill:chiller', 'Take the temperature');
  }
  if (m === 90 && state.ninetyChoice !== 'keep-logging') {
    return guide('chill-answer', 5, 'Decide what to do with the batch', 'Read Terence’s question and choose your answer below the workspace.', 'chill:chiller', 'Answer Terence');
  }
  if (m >= 90 && !state.measuredDepths) {
    return guide('chill-measure', 5, 'Compare the tray depths', 'Carry the ruler to a tray to measure the depth of the beef.', 'chill:chiller', 'Find the ruler');
  }
  if (m < 120) {
    return guide(`chill-wait-${m}`, m >= 90 ? 5 : 4, 'Leave the batch to chill', 'Your reading is saved. Leave it 30 minutes using the control below the thermometer.', 'chill:chiller', 'Return to the chiller');
  }
  return guide('chill-sign', 6, L.next.sign, 'All the readings are written down. Add your signature at the bottom of the chill record.', 'chill:record', 'Open the chill record');
}