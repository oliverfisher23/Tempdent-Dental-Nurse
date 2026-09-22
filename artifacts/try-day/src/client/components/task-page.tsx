import type { ReactNode } from 'react';
import { DecisionGroup } from '@client/components/decision-group';
import { DraftNotice } from '@client/components/draft-notice';
import { TASKS, blankAnswer, isAnswered, type DecisionAnswers, type TaskScene } from '@client/content/tasks';
import { useProgress } from '@client/lib/progress';
import type { TaskStates } from '@client/lib/simulation';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

/**
 * Renders a task from its content file: one scene per room, each a scrolling
 * card of decisions in story order. The mentor's opening line sits in the
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
      <SceneCard
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

  return <KitchenFrame id={id} dialogue={done && task.signOff ? task.signOff : task.dialogue} scenes={scenes} />;
}

interface SceneCardProps {
  taskId: string;
  scene: TaskScene;
  answers: DecisionAnswers;
  frozen: boolean;
  onAnswer: (decisionId: string, answer: DecisionAnswers[string]) => void;
}

function SceneCard({ taskId, scene, answers, frozen, onAnswer }: SceneCardProps) {
  // A decision gated on another stays hidden until that one has an answer, right or wrong.
  const visible = scene.decisions.filter((decision) => !decision.after || isAnswered(answers[decision.after]));
  const waitingOn = scene.decisions.find((decision) => decision.after && !isAnswered(answers[decision.after]));

  return (
    <section className="absolute inset-0 overflow-clip bg-zinc-900 text-foreground" data-testid={`scene-${scene.place}`}>
      <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-2xl border border-border border-t-4 border-t-primary bg-background p-5 shadow-2xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{scene.eyebrow}</p>
          <DraftNotice />
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{scene.title}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">{scene.intro}</p>
          <div className="mt-6 flex flex-col gap-5">
            {visible.map((decision) => (
              <DecisionGroup
                key={decision.id}
                taskId={taskId}
                decision={decision}
                answer={answers[decision.id] ?? blankAnswer(decision)}
                frozen={frozen}
                onAnswer={(answer) => onAnswer(decision.id, answer)}
              />
            ))}
            {waitingOn && visible.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="scene-waiting">
                Nothing to do here yet. Finish what you were doing first.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
