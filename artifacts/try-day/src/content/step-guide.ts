import type { PlaceId } from './kitchen';

/** Navigation only: opening a workspace never completes the work inside it. */
export interface StepGuide {
  id: string;
  step: number;
  total: number;
  title: string;
  instruction: string;
  actionLabel: string;
  place: PlaceId;
  action: string;
}

export const GUIDE_COPY = {
  complete: 'Ready to sign off',
  completeHint: 'Everything for this job is finished. Carry on when you’re ready.',
  nextJob: 'On to the next job',
  finishDay: 'Finish the day',
  opening: 'Opening workspace…',
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
};