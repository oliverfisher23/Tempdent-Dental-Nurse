import mechanic from '@client/content/mechanic.json';
import {
  TASKS,
  blankAnswer,
  correctAnswer,
  decisionsOf,
  isAnswered,
  isCorrect,
  type DecisionAnswers,
} from '@client/content/tasks';
import {
  createDayRuntime,
  initialsFromName,
  type DayRuntime,
  type Evaluation,
  type Progress,
  type ProgressModel,
  type TaskId,
} from '@shell/lib/day';
import { noticedEntriesFromAnswers } from '@client/content/noticed';

/**
 * Every task's record is the learner's answers keyed by decision id, so the
 * content files are the only place a task's evidence is described. A record
 * with a decision the content no longer has is harmless; a new decision is
 * simply unanswered. Reshaping the answer format itself needs a bump to
 * `config.version` in mechanic.json so the storage key changes.
 */
export interface TaskStates extends Record<string, DecisionAnswers> {
  setup: DecisionAnswers;
  welcome: DecisionAnswers;
  filling: DecisionAnswers;
  reset: DecisionAnswers;
  change: DecisionAnswers;
  close: DecisionAnswers;
}

const TASK_IDS = mechanic.config.tasks.map((task) => task.id);

function blankAnswers(taskId: string): DecisionAnswers {
  return Object.fromEntries(decisionsOf(taskId).map((decision) => [decision.id, blankAnswer(decision)]));
}

function fullMarks(taskId: string): DecisionAnswers {
  return Object.fromEntries(decisionsOf(taskId).map((decision) => [decision.id, correctAnswer(decision)]));
}

function statesFrom(fill: (taskId: string) => DecisionAnswers): TaskStates {
  const states: Record<string, DecisionAnswers> = {};
  for (const id of TASK_IDS) states[id] = fill(id);
  return states as TaskStates;
}

export function initialTaskStates(): TaskStates {
  return statesFrom(blankAnswers);
}

/** One checklist line per decision: the done-when clause it evidences. */
export function evaluateTask(id: TaskId, tasks: TaskStates): Evaluation {
  if (!TASKS[id]) throw new Error(`Unknown task: ${id}`);
  const answers = tasks[id] ?? {};
  const checklist = decisionsOf(id).map((decision) => ({
    id: decision.id,
    label: decision.clause,
    met: isCorrect(decision, answers[decision.id] ?? blankAnswer(decision)),
  }));
  return { done: checklist.every((item) => item.met), checklist };
}

/** The frame shows the task's complication once the decision that triggers it is answered. */
export function complicationRevealed(id: TaskId, tasks: TaskStates): boolean {
  const answers = tasks[id] ?? {};
  return decisionsOf(id).some((decision) => decision.revealsComplication && isAnswered(answers[decision.id]));
}

export function testProgress(
  target: TaskId | null | undefined,
  initial: () => Progress<TaskStates>,
): Progress<TaskStates> {
  const progress = initial();
  const finished = target === null;
  const blank = target === undefined;

  const tasks = initialTaskStates();
  const completed: string[] = [];
  let clock = mechanic.config.tasks[0].time;

  if (blank || (target && !TASK_IDS.includes(target))) {
    return {
      ...progress,
      studentName: blank ? '' : 'Learning Designer',
      initials: blank ? '' : initialsFromName('Learning Designer'),
      startedAt: blank ? null : new Date().toISOString(),
      tasks,
      completed: [],
      completedAt: null,
      clock,
    };
  }

  for (const id of TASK_IDS) {
    if (target === id) {
      clock = mechanic.config.tasks.find((task) => task.id === id)!.time;
      break;
    }
    tasks[id] = fullMarks(id);
    completed.push(id);
  }

  if (finished) {
    clock = mechanic.config.tasks[mechanic.config.tasks.length - 1].time;
  }

  return {
    ...progress,
    studentName: 'Learning Designer',
    initials: initialsFromName('Learning Designer'),
    startedAt: new Date().toISOString(),
    tasks,
    notepad: noticedEntriesFromAnswers(
      tasks,
      completed,
      (taskId) => mechanic.config.tasks.find((task) => task.id === taskId)?.time ?? clock,
    ),
    completed,
    completedAt: finished ? new Date().toISOString() : null,
    clock,
  };
}

export const model: ProgressModel<TaskStates> = {
  initialTaskStates,
  evaluateTask,
  complicationRevealed,
  testProgress: (target, initial) => testProgress(target, initial),
};

export const day: DayRuntime<TaskStates> = createDayRuntime(mechanic as any, model);
export const STORAGE_KEY = day.spec.STORAGE_KEY;
