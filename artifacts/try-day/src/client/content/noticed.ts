import type { NotepadEntry, TaskId } from '@shell/lib/day';
import { TASKS, isAnswered, isCorrect, type DecisionAnswers } from './tasks';

/**
 * Rebuild the automatic notebook lines that completed seeded answers would
 * already have written during a real learner run.
 */
export function noticedEntriesFromAnswers(
  tasks: Record<string, DecisionAnswers>,
  taskIds: readonly string[],
  atForTask: (taskId: string) => string,
): NotepadEntry[] {
  return taskIds.flatMap((taskId) => {
    const answers = tasks[taskId] ?? {};
    const task = TASKS[taskId];
    if (!task) return [];
    return task.scenes.flatMap((scene) => scene.decisions.flatMap((decision) => {
      if (!decision.noticed) return [];
      const answer = answers[decision.id];
      const records = isAnswered(answer)
        && (decision.noticed.when !== 'right' || isCorrect(decision, answer ?? null));
      if (!records) return [];
      return [{
        id: `fixture:${taskId}:${decision.id}`,
        taskId: taskId as TaskId,
        at: atForTask(taskId),
        label: decision.noticed.label ?? 'Noticed',
        value: decision.noticed.value,
        ref: { decision: decision.id },
      }];
    }));
  });
}