import mechanic from '@client/content/mechanic.json';
import {
  createDayRuntime,
  initialsFromName,
  type DayRuntime,
  type Evaluation,
  type Progress,
  type ProgressModel,
  type TaskId,
} from '@shell/lib/day';

export const TASK_ID = mechanic.config.tasks[0].id;

export interface DraftTaskState {
  complete: boolean;
}

export interface TaskStates extends Record<string, unknown> {
  [TASK_ID]: DraftTaskState;
}

export function initialTaskStates(): TaskStates {
  return { [TASK_ID]: { complete: false } };
}

export function evaluateTask(id: TaskId, tasks: TaskStates): Evaluation {
  if (id !== TASK_ID) throw new Error(`Unknown task: ${id}`);
  const met = tasks[TASK_ID].complete;
  return {
    done: met,
    checklist: [{ id: 'placeholder', label: 'Placeholder task marked complete', met }],
  };
}

export function testProgress(
  target: TaskId | null | undefined,
  initial: () => Progress<TaskStates>,
): Progress<TaskStates> {
  const progress = initial();
  const knownTarget = target === TASK_ID;
  const finished = target === null;
  return {
    ...progress,
    studentName: target === undefined ? '' : 'Learning Designer',
    initials: target === undefined ? '' : initialsFromName('Learning Designer'),
    startedAt: target === undefined ? null : new Date().toISOString(),
    tasks: { [TASK_ID]: { complete: finished } },
    completed: finished ? [TASK_ID] : [],
    completedAt: finished ? new Date().toISOString() : null,
    clock: mechanic.config.tasks[0].time,
    ...(knownTarget ? {} : {}),
  };
}

export const model: ProgressModel<TaskStates> = {
  initialTaskStates,
  evaluateTask,
  complicationRevealed: () => false,
  testProgress: (target, initial) =>
    testProgress(target === null ? null : target === TASK_ID ? TASK_ID : undefined, initial),
};

export const day: DayRuntime<TaskStates> = createDayRuntime(mechanic, model);
export const STORAGE_KEY = day.spec.STORAGE_KEY;
