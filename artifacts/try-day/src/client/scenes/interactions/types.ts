import type { Decision, DecisionAnswer, DecisionAnswers, PresentationKind, PresentationOf } from '@client/content/tasks';
import type { DayMemory } from '@client/lib/consequences';

/** Props every close-up interaction and stage layer receives from the stage engine. */
export interface InteractionProps<K extends PresentationKind = PresentationKind> {
  taskId: string;
  decision: Decision;
  presentation: PresentationOf<K>;
  answer: DecisionAnswer;
  /** The whole task record, for presentations that read or drive linked decisions. */
  answers: DecisionAnswers;
  /** Answer another decision of the same task (the tray's "Back to decon" zone answers `pouch`). */
  onAnswerOther: (decisionId: string, answer: DecisionAnswer) => void;
  /** What the day remembers from earlier tasks (lib/consequences.ts). */
  memory: DayMemory;
  /** "At your pace" is on: timed things wait for the learner. */
  ownPace: boolean;
  /** The task is signed off: show the answer, allow no changes. */
  frozen: boolean;
  onAnswer: (answer: DecisionAnswer) => void;
  /** The close-up is on screen. The engine owns this flag. */
  isOpen: boolean;
  /** Close the workspace (the learner is done here, or pressed Escape / the close button). */
  onClose: () => void;
  /**
   * Stage layers only: an element inside the stage panel, under the prompt. A layer portals
   * its status line and finish control here so they never sit behind the panel; when it is
   * absent (a rail-focused layer, node tests) the layer draws them on the photograph instead.
   */
  panelSlot?: HTMLElement | null;
}
