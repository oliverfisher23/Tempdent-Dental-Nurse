import type { Decision, DecisionAnswer, TaskContent } from './types';
import { SETUP_TASK } from './setup';
import { WELCOME_TASK } from './welcome';
import { FILLING_TASK } from './filling';
import { RESET_TASK } from './reset';
import { CHANGE_TASK } from './change';
import { CLOSE_TASK } from './close';

export type {
  BlockedBy, CastMember, Decision, DecisionAnswer, DecisionAnswers, DecisionKind, DecisionOption, Noticed, PersonReaction, PersonState,
  SceneOpening, TaskContent, TaskScene,
} from './types';
export type {
  ControlSpec, FindFault, FineSpot, FlagLine, LabelField, LabelPackage, OfferMoment, PacedCue, PacedSegment, PaperKind, PathZone,
  Presentation, PresentationKind, PresentationOf, PrintoutDoc, ReflectionVariant, Region, Spot, StickLabel, TurnaroundControl, ZoneItem,
} from './presentation';
export { CLOSE_UP_KINDS, STAGE_LAYER_KINDS } from './presentation';

/** Every task's content, keyed by the task id used in mechanic.json. */
export const TASKS: Record<string, TaskContent> = {
  [SETUP_TASK.id]: SETUP_TASK,
  [WELCOME_TASK.id]: WELCOME_TASK,
  [FILLING_TASK.id]: FILLING_TASK,
  [RESET_TASK.id]: RESET_TASK,
  [CHANGE_TASK.id]: CHANGE_TASK,
  [CLOSE_TASK.id]: CLOSE_TASK,
};

/** The task's decisions in scene order, which is also its checklist order. */
export function decisionsOf(taskId: string): Decision[] {
  const task = TASKS[taskId];
  if (!task) throw new Error(`No task content for "${taskId}"`);
  return task.scenes.flatMap((scene) => scene.decisions);
}

/**
 * The record value for a decision nobody has answered yet. A choice starts as
 * null; a checklist or sequence starts as an empty array, because the shell
 * merges saved records over these defaults and keeps the default whenever the
 * saved value's array-ness differs.
 */
export function blankAnswer(decision: Decision): DecisionAnswer {
  return decision.kind === 'choice' ? null : [];
}

/** Whether the learner has given this decision an answer (right or wrong). */
export function isAnswered(answer: DecisionAnswer | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  return typeof answer === 'string' ? answer.length > 0 : answer.length > 0;
}

/** Whether an answer satisfies a decision. An unanswered decision never does. */
export function isCorrect(decision: Decision, answer: DecisionAnswer): boolean {
  if (!isAnswered(answer) || answer === null) return false;
  const { correct } = decision;
  if (decision.kind === 'choice') {
    if (typeof answer !== 'string') return false;
    return typeof correct === 'string' ? answer === correct : correct.includes(answer);
  }
  if (!Array.isArray(answer) || typeof correct === 'string') return false;
  if (decision.kind === 'sequence') {
    return answer.length === correct.length && answer.every((id, i) => id === correct[i]);
  }
  // Checklist: the exact set, in any order, with no repeats.
  const chosen = new Set(answer);
  return answer.length === correct.length && chosen.size === correct.length && correct.every((id) => chosen.has(id));
}

/** The answer a learner who gets everything right would give. */
export function correctAnswer(decision: Decision): DecisionAnswer {
  if (decision.kind === 'choice') {
    return typeof decision.correct === 'string' ? decision.correct : decision.correct[0];
  }
  return [...decision.correct];
}
