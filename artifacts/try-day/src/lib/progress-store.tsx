/**
 * React store for the student's progress through the day.
 *
 * Wrap the app in <ProgressProvider>. Components call useProgress() to read the
 * state and to change it. Every change is saved to localStorage straight away,
 * so a student can close the tab and pick the day up where they left it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { TASK_ORDER, type TaskId } from '@/content/activities';
import {
  clearProgress,
  evaluateTask,
  initialProgress,
  initialsFromName,
  isDayComplete,
  loadProgress,
  notifyHost,
  saveProgress,
  type Evaluation,
  type Progress,
  type TaskStates,
} from '@/lib/simulation';

interface ProgressContextValue {
  progress: Progress;
  /** Evaluation (done flag + checklist) for every task, recomputed on each change. */
  evaluations: Record<TaskId, Evaluation>;
  /** The first task that has not been completed, or null once the day is done. */
  currentTaskId: TaskId | null;
  dayComplete: boolean;
  /** True when this task may be opened (all earlier tasks are complete). */
  isUnlocked: (id: TaskId) => boolean;
  isCompleted: (id: TaskId) => boolean;
  /** Called from the morning brief; records the name and starts the shift. */
  startDay: (studentName: string) => void;
  /** Update one task's state with an immutable updater. */
  updateTask: <K extends TaskId>(id: K, updater: (prev: TaskStates[K]) => TaskStates[K]) => void;
  /** Marks a task complete. Returns false if its done-when is not met yet. */
  completeTask: (id: TaskId) => boolean;
  /** Wipes everything and starts the day again. */
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveProgress(progress);
  }, [progress]);

  const evaluations = useMemo(() => {
    const out = {} as Record<TaskId, Evaluation>;
    for (const id of TASK_ORDER) out[id] = evaluateTask(id, progress.tasks);
    return out;
  }, [progress.tasks]);

  const currentTaskId = useMemo(
    () => TASK_ORDER.find((id) => !progress.completed.includes(id)) ?? null,
    [progress.completed],
  );

  const isCompleted = useCallback((id: TaskId) => progress.completed.includes(id), [progress.completed]);

  const isUnlocked = useCallback(
    (id: TaskId) => {
      const i = TASK_ORDER.indexOf(id);
      return TASK_ORDER.slice(0, i).every((t) => progress.completed.includes(t));
    },
    [progress.completed],
  );

  const startDay = useCallback((studentName: string) => {
    setProgress((prev) => ({
      ...prev,
      studentName: studentName.trim(),
      initials: initialsFromName(studentName),
      startedAt: prev.startedAt ?? new Date().toISOString(),
    }));
  }, []);

  const updateTask = useCallback(
    <K extends TaskId>(id: K, updater: (prev: TaskStates[K]) => TaskStates[K]) => {
      setProgress((prev) => ({
        ...prev,
        tasks: { ...prev.tasks, [id]: updater(prev.tasks[id]) },
      }));
    },
    [],
  );

  const completeTask = useCallback(
    (id: TaskId): boolean => {
      const evaluation = evaluateTask(id, progress.tasks);
      if (!evaluation.done) return false;
      if (progress.completed.includes(id)) return true;
      const now = new Date().toISOString();
      const completed = [...progress.completed, id];
      const next: Progress = {
        ...progress,
        completed,
        completedAt: TASK_ORDER.every((t) => completed.includes(t)) ? now : progress.completedAt,
      };
      setProgress(next);
      notifyHost({ event: 'task:complete', taskId: id, completedAt: now });
      if (isDayComplete(next)) notifyHost({ event: 'gate:complete', completedAt: now });
      return true;
    },
    [progress],
  );

  const reset = useCallback(() => {
    clearProgress();
    setProgress(initialProgress());
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      evaluations,
      currentTaskId,
      dayComplete: isDayComplete(progress),
      isUnlocked,
      isCompleted,
      startDay,
      updateTask,
      completeTask,
      reset,
    }),
    [progress, evaluations, currentTaskId, isUnlocked, isCompleted, startDay, updateTask, completeTask, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
