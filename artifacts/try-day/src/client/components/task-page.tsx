import type { ReactNode } from 'react';
import { TASKS } from '@client/content/tasks';
import { useProgress } from '@client/lib/progress';
import { taskGuide } from '@client/lib/guide';
import { StageScene } from '@client/scenes/stage-scene';
import type { TaskStates } from '@client/lib/simulation';
import { KitchenFrame } from '@shell/frame/kitchen-frame';

/**
 * Renders a task from its content file: one hands-on stage per room. The mentor's
 * opening line sits in the
 * dialogue bar until every clause is met, when the sign-off replaces it.
 */
export function TaskPage({ id }: { id: keyof TaskStates & string }) {
  const { progress, evaluations, updateTask, isCompleted } = useProgress();
  const task = TASKS[id];
  const answers = progress.tasks[id] ?? {};
  const frozen = isCompleted(id);
  const done = evaluations[id]?.done ?? false;

  const scenes: Record<string, ReactNode> = {};
  for (const scene of task.scenes) {
    scenes[scene.place] = (
      <StageScene
        key={scene.place}
        taskId={id}
        scene={scene}
        answers={answers}
        frozen={frozen}
        onAnswer={(decisionId, answer) =>
          updateTask(id, (prev) => ({ ...prev, [decisionId]: answer }))
        }
      />
    );
  }

  return (
    <KitchenFrame
      id={id}
      dialogue={done && task.signOff ? task.signOff : task.dialogue}
      scenes={scenes}
      guide={taskGuide(task, answers)}
    />
  );
}
