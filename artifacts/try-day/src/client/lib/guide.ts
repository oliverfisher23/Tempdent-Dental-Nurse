import type { DecisionAnswers, TaskContent } from '@client/content/tasks';
import { CLOSE_UP_KINDS } from '@client/content/tasks';
import { currentDecision, locateAll } from '@client/scenes/current';
import { presentationFor } from '@client/scenes/presentation';
import type { StepGuide } from '@shell/copy/step-guide';

function shortInstruction(prompt: string): string {
  const sentence = prompt.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? prompt.trim();
  if (sentence.length <= 90) return sentence;
  return `${sentence.slice(0, 87).trimEnd()}…`;
}

/** Build the shared frame guide from exactly the same current-decision rule as the stage. */
export function taskGuide(task: TaskContent, answers: DecisionAnswers): StepGuide | undefined {
  const all = locateAll(task);
  const located = currentDecision(task, answers) ?? all[all.length - 1];
  if (!located) return undefined;

  const presentation = presentationFor(located.decision);
  const closeUp = CLOSE_UP_KINDS.includes(presentation.kind);
  return {
    id: located.decision.id,
    step: located.step,
    total: located.total,
    title: located.scene.title,
    instruction: shortInstruction(located.decision.prompt),
    actionLabel: closeUp && 'open' in presentation
      ? presentation.open
      : presentation.kind === 'hotspots' ? 'Look' : 'Answer',
    place: located.scene.place,
    action: located.decision.id,
    pattern: closeUp ? 'explore' : presentation.kind === 'hotspots' ? 'tap' : 'list',
  };
}