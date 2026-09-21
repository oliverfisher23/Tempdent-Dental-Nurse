import type { InteractionPatternId } from './interaction-patterns';
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
  /** Which kind of control this step uses, for "How do I do this?" beside the guide. */
  pattern?: InteractionPatternId;
}

export const GUIDE_COPY = {
  complete: 'This job is done',
  completeHint: 'Everything here is finished. Move on when you are ready.',
  nextJob: 'On to the next job',
  finishDay: 'Finish the day',
  opening: 'Opening workspace…',
  /** Replaces the action button once the student is already in the workspace it opens. */
  here: 'You’re here',
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
};
