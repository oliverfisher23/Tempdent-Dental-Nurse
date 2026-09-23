import { useEffect, useState, type ReactNode } from 'react';
import { TASKS } from '@client/content/tasks';
import { useProgress } from '@client/lib/progress';
import { taskGuide } from '@client/lib/guide';
import { StageScene } from '@client/scenes/stage-scene';
import type { TaskStates } from '@client/lib/simulation';
import { dayMemory } from '@client/lib/consequences';
import { useOwnPace } from '@client/lib/pace';
import { openingStorageKey } from '@client/lib/guide';
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
  const memory = dayMemory(progress);
  const [ownPace, setOwnPace] = useOwnPace();
  const firstOpening = task.scenes.find((scene) =>
    scene.opening
    && !scene.decisions.some((decision) => {
      const answer = answers[decision.id];
      return answer !== null && answer !== undefined && (!Array.isArray(answer) || answer.length > 0);
    })
    && (() => {
      try { return sessionStorage.getItem(openingStorageKey(id, scene.place)) !== '1'; } catch { return true; }
    })()
  )?.place ?? null;
  const [openingPlace, setOpeningPlace] = useState<string | null>(firstOpening);
  useEffect(() => {
    if (openingPlace) return;
    const next = task.scenes.find((scene, index) => {
      if (!scene.opening) return false;
      const previousDone = task.scenes.slice(0, index).every((previous) =>
        previous.decisions.every((decision) => {
          const answer = answers[decision.id];
          return answer !== null && answer !== undefined && (!Array.isArray(answer) || answer.length > 0);
        })
      );
      if (!previousDone || scene.decisions.some((decision) => {
        const answer = answers[decision.id];
        return answer !== null && answer !== undefined && (!Array.isArray(answer) || answer.length > 0);
      })) return false;
      try { return sessionStorage.getItem(openingStorageKey(id, scene.place)) !== '1'; } catch { return true; }
    });
    if (next) setOpeningPlace(next.place);
  }, [answers, id, openingPlace, task.scenes]);

  const scenes: Record<string, ReactNode> = {};
  for (const scene of task.scenes) {
    scenes[scene.place] = (
      <StageScene
        key={scene.place}
        taskId={id}
        scene={scene}
        answers={answers}
        frozen={frozen}
        memory={memory}
        ownPace={ownPace}
        onOwnPace={setOwnPace}
        openingActive={openingPlace === scene.place}
        onOpeningComplete={() => setOpeningPlace((place) => place === scene.place ? null : place)}
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
      guide={taskGuide(task, answers, openingPlace)}
    />
  );
}
