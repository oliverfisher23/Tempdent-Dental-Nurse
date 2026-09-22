/**
 * The shell's progress store, typed to this kitchen's task states. Client pages
 * and scenes import useProgress from here so `progress.tasks` and `updateTask`
 * carry the kitchen's types; the shell's own components use the untyped form.
 */
import { useProgress as useShellProgress, type ProgressContextValue } from '@shell/lib/progress-store';
import type { TaskStates } from './simulation';

export type KitchenProgressContextValue = ProgressContextValue<TaskStates>;

export function useProgress(): KitchenProgressContextValue {
  return useShellProgress<TaskStates>();
}
