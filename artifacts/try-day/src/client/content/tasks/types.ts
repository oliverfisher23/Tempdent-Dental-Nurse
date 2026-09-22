import type { Line } from '@shell/lib/client';

/**
 * A task is a set of scenes (one per room the learner works in), each carrying
 * the decisions the storyboard asks for. Every decision maps to one clause of
 * the task's done-when, so the HUD checklist, the evaluator and the page all
 * read from this single description. All clinical detail here is draft copy
 * pending SME validation.
 */

export type DecisionKind =
  /** Pick one option. */
  | 'choice'
  /** Pick every option that applies, then confirm. Judged as an exact set. */
  | 'checklist'
  /** Tap the options in order. Judged as an exact order. */
  | 'sequence';

export interface DecisionOption {
  id: string;
  label: string;
}

export interface Decision {
  /** Unique within the task; it is the key the answer is saved under. */
  id: string;
  kind: DecisionKind;
  /** The question the learner is asked. */
  prompt: string;
  /** One or two lines of situation shown above the prompt. */
  context?: string;
  options: DecisionOption[];
  /**
   * For a choice, the accepted option id, or several when the storyboard lists
   * more than one acceptable answer. For a checklist, the exact set. For a
   * sequence, the exact order.
   */
  correct: string | readonly string[];
  /** The done-when clause this decision evidences, shown in the task checklist. */
  clause: string;
  /** Mentor feedback shown once the learner has answered. Wrong feedback coaches the principle; it does not list the answer. */
  feedback: { speaker: string; right: string; wrong: string };
  /** Only shown once the named decision has been answered (story order). */
  after?: string;
  /** Answering this decision reveals the task's complication in the frame. */
  revealsComplication?: boolean;
}

export interface TaskScene {
  /** A place id from the workplace map. */
  place: string;
  eyebrow: string;
  title: string;
  intro: string;
  decisions: Decision[];
}

export interface TaskContent {
  id: string;
  /** The mentor's opening line for the task. */
  dialogue: Line;
  /** Replaces the opening line once every clause is met. */
  signOff?: Line;
  scenes: TaskScene[];
}

/** What the learner has answered so far, keyed by decision id. */
export type DecisionAnswer = string | string[] | null;
export type DecisionAnswers = Record<string, DecisionAnswer>;
