import type { Line } from '@shell/lib/client';
import type { Presentation } from './presentation';

export * from './presentation';

/**
 * A task is a set of scenes (one per room the learner works in), each carrying
 * the decisions the storyboard asks for. Every decision maps to one clause of
 * the task's done-when, so the HUD checklist, the evaluator and the page all
 * read from this single description. Content follows the signed-off storyboard.
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
  /**
   * V2 people states: answering with this option puts `person` into `state` (a still from
   * content/people.ts) and reads `text` to screen readers ("Amira is holding the armrests").
   */
  reaction?: PersonReaction;
}

export interface PersonReaction {
  person: string;
  state: string;
  text: string;
}

/** V2 (S3): a line the notebook writes itself once the decision is answered (or answered right). */
export interface Noticed {
  value: string;
  /** Defaults to "Noticed". */
  label?: string;
  /** Defaults to 'answered'. */
  when?: 'answered' | 'right';
}

/** V2: a world rule. While `decision` is not yet right, starting this one shows `aside` and the controls stay shut. */
export interface BlockedBy {
  decision: string;
  aside: Line;
}

/** V2 people states: one still per state, with the text a screen reader gets instead of the picture. */
export interface PersonState {
  image: string;
  alt: string;
}

/** V2: a person in the room whose state the learner's answers change (Amira, Karim, Graham). */
export interface CastMember {
  /** Display name; defaults to the workplace person's name. */
  name?: string;
  /** State shown before any option with a reaction has been chosen. */
  initial: string;
  states: Record<string, PersonState>;
}

/** V2 (S6): the scene opens with a look round before the first decision's controls appear. */
export interface SceneOpening {
  text: string;
  speaker?: string;
  /** Seconds before the first controls appear (the learner can always tap "I've had a look" sooner). Default 6. */
  seconds?: number;
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
  /** Where and how the decision is worked on the stage; see presentation.ts for the default per kind. */
  present?: Presentation;
  /** V2 (S3): the notebook entry this decision writes. */
  noticed?: Noticed;
  /** V2: a world rule gating this decision on another being right. */
  blockedBy?: BlockedBy;
  /**
   * V2 (S1): right answers are silent by default (the room answers; `feedback.right` sits behind
   * "Why did that work?"). Set false where the right line must still appear as a panel.
   */
  silent?: boolean;
}

export interface TaskScene {
  /** A place id from the workplace map. */
  place: string;
  /** Optional imported variant of the place photograph for this scene. */
  backdrop?: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** Person ids (from the client's people) who are in the room for this scene. */
  people?: string[];
  /** V2 (S6): the look round before the first decision. */
  opening?: SceneOpening;
  /**
   * V2 people states, keyed by person id (a subset of `people`). The stage shows each cast
   * member as a portrait card whose still and text follow the last chosen option's `reaction`.
   */
  cast?: Record<string, CastMember>;
  /** V2 (S1): the scene's debrief, shown once every decision in the scene is right. */
  debrief?: Line;
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
