import type { Decision, Presentation } from '@client/content/tasks';

/** Native aspect ratio shared by every workplace backdrop photograph. */
export const BACKDROP_ASPECT = 1.6;

/** Resolve the content author's presentation, including the documented defaults. */
export function presentationFor(decision: Decision): Presentation {
  if (decision.present) return decision.present;
  if (decision.kind === 'choice') return { kind: 'speech' };
  if (decision.kind === 'checklist') {
    return {
      kind: 'paper',
      paper: 'clipboard',
      title: decision.prompt,
      open: 'Open checklist',
    };
  }
  return {
    kind: 'order',
    title: decision.prompt,
    open: 'Put these in order',
  };
}