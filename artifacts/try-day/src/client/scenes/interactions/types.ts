import type { Decision, DecisionAnswer, PresentationKind, PresentationOf } from '@client/content/tasks';

/** Props every close-up interaction receives from the stage engine. */
export interface InteractionProps<K extends PresentationKind = PresentationKind> {
  taskId: string;
  decision: Decision;
  presentation: PresentationOf<K>;
  answer: DecisionAnswer;
  /** The task is signed off: show the answer, allow no changes. */
  frozen: boolean;
  onAnswer: (answer: DecisionAnswer) => void;
  /** The close-up is on screen. The engine owns this flag. */
  isOpen: boolean;
  /** Close the workspace (the learner is done here, or pressed Escape / the close button). */
  onClose: () => void;
}
