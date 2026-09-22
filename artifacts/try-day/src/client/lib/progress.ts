import { useProgress as useShellProgress } from '@shell/lib/progress-store';
import type { TaskStates } from './simulation';

export function useProgress() {
  return useShellProgress<TaskStates>();
}
