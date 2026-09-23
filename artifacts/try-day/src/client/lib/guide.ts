import type { DecisionAnswers, TaskContent } from '@client/content/tasks';
import { CLOSE_UP_KINDS } from '@client/content/tasks';
import { currentDecision, locateAll } from '@client/scenes/current';
import { presentationFor } from '@client/scenes/presentation';
import type { StepGuide } from '@shell/copy/step-guide';

export function shortInstruction(prompt: string): string {
  const sentence = prompt.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? prompt.trim();
  if (sentence.length <= 90) return sentence;
  return `${sentence.slice(0, 87).trimEnd()}…`;
}

/** Build the shared frame guide from exactly the same current-decision rule as the stage. */
export function openingStorageKey(taskId: string, place: string): string {
  return `springpod:tempdent-try-day:opening:${taskId}:${place}`;
}

export function taskGuide(task: TaskContent, answers: DecisionAnswers, openingPlace?: string | null): StepGuide | undefined {
  const all = locateAll(task);
  const located = currentDecision(task, answers) ?? all[all.length - 1];
  if (!located) return undefined;
  const opening = openingPlace === located.scene.place ? located.scene.opening : undefined;
  if (opening) {
    return {
      id: `opening-${located.scene.place}`,
      step: located.step,
      total: located.total,
      title: located.scene.title,
      instruction: shortInstruction(opening.text),
      actionLabel: 'Have a look round',
      place: located.scene.place,
      action: `opening-${located.scene.place}`,
      pattern: 'tap',
    };
  }

  const presentation = presentationFor(located.decision);
  const closeUp = CLOSE_UP_KINDS.includes(presentation.kind);
  const stageLayer = presentation.kind === 'find' || presentation.kind === 'path' || presentation.kind === 'controls';
  return {
    id: located.decision.id,
    step: located.step,
    total: located.total,
    title: located.scene.title,
    instruction: shortInstruction(located.decision.prompt),
    actionLabel: stageLayer
      ? presentation.guideLabel ?? 'Look'
      : closeUp && 'open' in presentation
      ? presentation.open
      : presentation.kind === 'hotspots' ? 'Look' : 'Answer',
    place: located.scene.place,
    action: located.decision.id,
    pattern: closeUp ? 'explore' : presentation.kind === 'find' || presentation.kind === 'hotspots'
      ? 'tap'
      : presentation.kind === 'path' || presentation.kind === 'controls' ? 'drag' : 'list',
  };
}