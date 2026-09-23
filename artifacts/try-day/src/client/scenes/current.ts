import { isAnswered, isCorrect, type Decision, type DecisionAnswers, type TaskContent, type TaskScene } from '@client/content/tasks';

/** A decision's place in the task, for the step guide and the progress rail. */
export interface Located {
  scene: TaskScene;
  decision: Decision;
  /** 1-based position among the task's decisions in content order. */
  step: number;
  total: number;
}

/** A decision is visible once the decision it is gated on has any answer. */
export function isVisible(decision: Decision, answers: DecisionAnswers): boolean {
  return !decision.after || isAnswered(answers[decision.after]);
}

export function locateAll(task: TaskContent): Located[] {
  const total = task.scenes.reduce((n, scene) => n + scene.decisions.length, 0);
  const all: Located[] = [];
  for (const scene of task.scenes) {
    for (const decision of scene.decisions) all.push({ scene, decision, step: all.length + 1, total });
  }
  return all;
}

/**
 * The decision to work on next: the first visible unanswered one in content
 * order; failing that, the first answered wrongly; none when all are right.
 * Pass a scene to restrict the search to that room.
 */
export function currentDecision(task: TaskContent, answers: DecisionAnswers, scene?: TaskScene): Located | null {
  const pool = locateAll(task).filter((item) => !scene || item.scene === scene);
  for (const item of pool) {
    if (!isVisible(item.decision, answers) || isAnswered(answers[item.decision.id])) continue;
    const blocker = item.decision.blockedBy?.decision;
    if (!blocker) return item;
    const blocking = pool.find((candidate) => candidate.decision.id === blocker)
      ?? locateAll(task).find((candidate) => candidate.decision.id === blocker);
    if (!blocking || (isAnswered(answers[blocker]) && isCorrect(blocking.decision, answers[blocker] ?? null))) return item;
    // A world rule never lets later work jump ahead of the thing that unlocks it.
    if (isVisible(blocking.decision, answers)) return blocking;
  }
  return pool.find((item) =>
    isVisible(item.decision, answers)
    && isAnswered(answers[item.decision.id])
    && !isCorrect(item.decision, answers[item.decision.id] ?? null)
  ) ?? null;
}
