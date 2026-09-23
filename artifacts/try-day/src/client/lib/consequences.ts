import { TASKS, correctAnswer, isAnswered } from '@client/content/tasks';
import type { TaskStates } from '@client/lib/simulation';
import type { NotepadEntry, Progress } from '@shell/lib/day';

/**
 * V2 (S4): what the day remembers. Nothing is stored for this; every consequence is
 * derived from answers the learner already gave in an earlier task, so a returning
 * learner's saved day carries them without migration. Decision ids named here are
 * fixed by docs/V2-BUILD.md.
 */
export interface DayMemory {
  /** Task 1 tray items the learner left off (option ids from `setup.tray`), e.g. ['matrix']. */
  trayMissing: string[];
  /** The learner set the broken-seal pouch aside in Task 1 (`setup.pouch` answered `aside`). */
  pouchSetAside: boolean;
  /** Every "Noticed" line the notebook wrote itself, oldest first. */
  noticed: NotepadEntry[];
}

const NOTICED_LABEL = 'Noticed';

export function trayMissing(progress: Progress<TaskStates>): string[] {
  const decision = TASKS.setup.scenes.flatMap((scene) => scene.decisions).find((d) => d.id === 'tray');
  const answer = progress.tasks.setup?.tray;
  if (!decision || !Array.isArray(answer) || !isAnswered(answer)) return [];
  const key = correctAnswer(decision);
  if (!Array.isArray(key)) return [];
  const placed = new Set(answer);
  return key.filter((id) => !placed.has(id));
}

export function pouchSetAside(progress: Progress<TaskStates>): boolean {
  return progress.tasks.setup?.pouch === 'aside';
}

export function noticed(progress: Progress<TaskStates>): NotepadEntry[] {
  return progress.notepad.filter((entry) => entry.label === NOTICED_LABEL);
}

export function dayMemory(progress: Progress<TaskStates>): DayMemory {
  return {
    trayMissing: trayMissing(progress),
    pouchSetAside: pouchSetAside(progress),
    noticed: noticed(progress),
  };
}

/** The notepad entry a decision wrote, if it has. */
export function noticedFor(progress: Progress<TaskStates>, decisionId: string): NotepadEntry | undefined {
  return progress.notepad.find((entry) => entry.ref?.decision === decisionId);
}
