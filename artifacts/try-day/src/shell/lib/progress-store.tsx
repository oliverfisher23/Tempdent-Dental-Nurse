/**
 * React store for the student's progress through the day.
 *
 * Wrap the app in <ProgressProvider>, inside <TryClientProvider>. Components call
 * useProgress() to read the state and to change it. Every change is saved to
 * localStorage straight away, so a student can close the tab and pick the day up
 * where they left it. The store is generic over the client's task states; a
 * client binds it once (see client/lib/progress.ts) so its pages get typed state.
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

import { useClient } from '@shell/app/client-context';
import {
  addMinutes,
  initialsFromName,
  isTestMode,
  type Evaluation,
  type NotepadEntry,
  type Progress,
  type TaskId,
  type TaskPosition,
} from './day';

type AnyTaskStates = Record<string, unknown>;

export interface ProgressContextValue<TS extends AnyTaskStates = AnyTaskStates> {
  progress: Progress<TS>;
  /** Evaluation (done flag + checklist) for every task, recomputed on each change. */
  evaluations: Record<TaskId, Evaluation>;
  /** The first task that has not been completed, or null once the day is done. */
  currentTaskId: TaskId | null;
  dayComplete: boolean;
  /** Remember where the learner is in a task (room and open workspace) so a reload returns them there. */
  setPosition: (id: TaskId, position: TaskPosition | null) => void;
  /** True when this task may be opened (all earlier tasks are complete). */
  isUnlocked: (id: TaskId) => boolean;
  isCompleted: (id: TaskId) => boolean;
  /** Called from the morning brief; records the name and starts the shift. */
  startDay: (studentName: string) => void;
  /** Update one task's state with an immutable updater. */
  updateTask: <K extends keyof TS & string>(id: K, updater: (prev: TS[K]) => TS[K]) => void;
  /** Marks a task complete. Returns false if its done-when is not met yet. */
  completeTask: (id: TaskId) => boolean;
  /** Wipes everything and starts the day again. */
  reset: () => void;
  /** Move the kitchen clock on by some minutes (probing, walking, weighing all take time). */
  advanceClock: (minutes: number) => void;
  /** Set the clock outright, e.g. to a task's start time or a chill interval. */
  setClock: (clock: string) => void;
  /** Guarded fixture seeding for the opt-in learning designer panel. */
  jumpToTestTarget: (id: TaskId | null | undefined) => void;
  /** Write a line in the student's notepad. Returns the entry. */
  jot: (entry: Omit<NotepadEntry, 'id' | 'at'> & { at?: string }) => NotepadEntry;
  /** Cross a line out of the notepad. */
  unjot: (id: string) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { day } = useClient();
  const {
    spec: { TASK_ORDER, getTask },
    model: { evaluateTask, reconcileUpdate },
    initialProgress,
    testProgress,
    isDayComplete,
    loadProgress,
    saveProgress,
    clearProgress,
    notifyHost,
  } = day;
  const [progress, setProgress] = useState<Progress<AnyTaskStates>>(() => loadProgress());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveProgress(progress);
  }, [progress, saveProgress]);

  // A day that was already finished when the page loaded tells the host again. The host keeps
  // one completion per launch and ignores repeats, so this only helps a learner whose first
  // message was lost (a closed tab, a dropped connection).
  useEffect(() => {
    if (!isDayComplete(progress) || !progress.completedAt) return;
    notifyHost({ event: 'gate:complete', completedAt: progress.completedAt });
    // Once, on load: the first-time completion is posted from completeTask.
  }, []);

  const evaluations = useMemo(() => {
    const out = {} as Record<TaskId, Evaluation>;
    for (const id of TASK_ORDER) out[id] = evaluateTask(id, progress.tasks);
    return out;
  }, [progress.tasks, TASK_ORDER, evaluateTask]);

  const currentTaskId = useMemo(
    () => TASK_ORDER.find((id) => !progress.completed.includes(id)) ?? null,
    [progress.completed, TASK_ORDER],
  );

  const isCompleted = useCallback((id: TaskId) => progress.completed.includes(id), [progress.completed]);

  const isUnlocked = useCallback(
    (id: TaskId) => {
      const i = TASK_ORDER.indexOf(id);
      return TASK_ORDER.slice(0, i).every((t) => progress.completed.includes(t));
    },
    [progress.completed, TASK_ORDER],
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
    <K extends string>(id: K, updater: (prev: unknown) => unknown) => {
      setProgress((prev) => {
        // Signed-off paperwork is frozen: late callbacks and revisits cannot rewrite it.
        if (prev.completed.includes(id)) return prev;
        if (!TASK_ORDER.slice(0, TASK_ORDER.indexOf(id)).every((task) => prev.completed.includes(task))) return prev;
        const proposed = updater(prev.tasks[id]);
        const updated = reconcileUpdate ? reconcileUpdate(id, prev.tasks[id], proposed) : proposed;
        return { ...prev, tasks: { ...prev.tasks, [id]: updated } };
      });
    },
    [TASK_ORDER, reconcileUpdate],
  );

  const setPosition = useCallback((id: TaskId, position: TaskPosition | null) => {
    setProgress((prev) => {
      const current = prev.positions[id];
      const same = position
        ? current?.place === position.place && current?.workspace === position.workspace
        : !current;
      if (same) return prev;
      const positions = { ...prev.positions };
      if (position) positions[id] = position;
      else delete positions[id];
      return { ...prev, positions };
    });
  }, []);

  const completeTask = useCallback(
    (id: TaskId): boolean => {
      if (!TASK_ORDER.slice(0, TASK_ORDER.indexOf(id)).every((task) => progress.completed.includes(task))) return false;
      const evaluation = evaluateTask(id, progress.tasks);
      if (!evaluation.done) return false;
      if (progress.completed.includes(id)) return true;
      const now = new Date().toISOString();
      const completed = [...progress.completed, id];
      const following = TASK_ORDER[TASK_ORDER.indexOf(id) + 1];
      const next: Progress<AnyTaskStates> = {
        ...progress,
        completed,
        completedAt: TASK_ORDER.every((t) => completed.includes(t)) ? now : progress.completedAt,
        clock: following ? getTask(following).time : progress.clock,
      };
      setProgress(next);
      notifyHost({ event: 'task:complete', taskId: id, completedAt: now });
      if (isDayComplete(next)) notifyHost({ event: 'gate:complete', completedAt: now });
      return true;
    },
    [progress, TASK_ORDER, getTask, evaluateTask, isDayComplete, notifyHost],
  );

  const reset = useCallback(() => {
    clearProgress();
    setProgress(initialProgress());
  }, [clearProgress, initialProgress]);

  const jumpToTestTarget = useCallback((id: TaskId | null | undefined) => {
    if (!isTestMode()) return;
    setProgress(testProgress(id));
  }, [testProgress]);

  const advanceClock = useCallback((minutes: number) => {
    setProgress((prev) => ({ ...prev, clock: addMinutes(prev.clock, minutes) }));
  }, []);

  const setClock = useCallback((clock: string) => {
    setProgress((prev) => (prev.clock === clock ? prev : { ...prev, clock }));
  }, []);

  const jot = useCallback(
    (entry: Omit<NotepadEntry, 'id' | 'at'> & { at?: string }): NotepadEntry => {
      const full: NotepadEntry = {
        id: `${entry.taskId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`,
        at: entry.at ?? progress.clock,
        taskId: entry.taskId,
        label: entry.label,
        value: entry.value,
        ...(entry.ref ? { ref: entry.ref } : {}),
      };
      setProgress((prev) =>
        prev.completed.includes(entry.taskId)
          ? prev
          : { ...prev, notepad: [...prev.notepad, { ...full, at: entry.at ?? prev.clock }] },
      );
      return full;
    },
    [progress.clock],
  );

  const unjot = useCallback((id: string) => {
    setProgress((prev) => {
      const entry = prev.notepad.find((e) => e.id === id);
      // Notes belonging to a signed-off task are part of that task's record and stay.
      if (!entry || prev.completed.includes(entry.taskId)) return prev;
      return { ...prev, notepad: prev.notepad.filter((e) => e.id !== id) };
    });
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
      setPosition,
      completeTask,
      reset,
      advanceClock,
      setClock,
      jumpToTestTarget,
      jot,
      unjot,
    }),
    [progress, evaluations, currentTaskId, isDayComplete, isUnlocked, isCompleted, startDay, updateTask, setPosition, completeTask, reset, advanceClock, setClock, jumpToTestTarget, jot, unjot],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/**
 * The store, typed to a client's task states. The shell's own components use the
 * default (untyped) form; a client's pages import a bound version so `updateTask`
 * and `progress.tasks` carry the client's types.
 */
export function useProgress<TS extends AnyTaskStates = AnyTaskStates>(): ProgressContextValue<TS> {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx as unknown as ProgressContextValue<TS>;
}
