/**
 * The generic half of a try day: the day document, the progress envelope every
 * client shares, saving and loading it, and telling the host page when the day
 * is done.
 *
 * Nothing here knows what the tasks are. A client supplies its day document and
 * a ProgressModel (what state each task holds, what counts as done, how saved
 * records from older versions are repaired) and gets a DayRuntime back.
 */

// ---------------------------------------------------------------------------
// The day document (the shape of content/mechanic.json for every client)
// ---------------------------------------------------------------------------

export interface DayPerson {
  name: string;
  role: string;
  note: string;
}

export interface DayFrame {
  role: string;
  workplace: string;
  shift: { start: string; end: string; rhythm: string };
  people: DayPerson[];
  morningBrief: string;
  closeOfDay: string;
  tone: string;
}

export interface DayMaterial {
  name: string;
  description: string;
}

export interface DayTask {
  id: string;
  /** Kitchen clock when the task starts, HH:MM. */
  time: string;
  place: string;
  title: string;
  situation: string;
  job: string;
  materials: DayMaterial[];
  interaction: string;
  doneWhen: string;
  whatHappensNext: string;
  complication?: string;
}

export interface DayGate {
  type: string;
  id: string;
  label: string;
}

export interface DayDocument {
  format: string;
  version: number;
  mechanicId: string;
  config: {
    mechanic: string;
    version: number;
    id: string;
    employer: string;
    locale: string;
    frame: DayFrame;
    tasks: DayTask[];
    gate: DayGate;
  };
}

/** Task ids are strings to the shell; each client narrows them to its own union. */
export type TaskId = string;

export interface DaySpec {
  document: DayDocument;
  FRAME: DayFrame;
  GATE: DayGate;
  /** Every task id, once, in the day's order. */
  TASK_ORDER: readonly TaskId[];
  getTask: (id: TaskId) => DayTask;
  taskIndex: (id: TaskId) => number;
  nextTaskId: (id: TaskId) => TaskId | null;
  /** Where progress is kept. Must stay identical across releases or learners lose their day. */
  STORAGE_KEY: string;
  TEST_STORAGE_KEY: string;
}

export function createSpec(document: DayDocument): DaySpec {
  const TASK_ORDER: readonly TaskId[] = document.config.tasks.map((t) => t.id);
  const getTask = (id: TaskId): DayTask => {
    const task = document.config.tasks.find((t) => t.id === id);
    if (!task) throw new Error(`Unknown task: ${id}`);
    return task;
  };
  const taskIndex = (id: TaskId) => TASK_ORDER.indexOf(id);
  const STORAGE_KEY = `springpod:${document.config.id}:v${document.config.version}`;
  return {
    document,
    FRAME: document.config.frame,
    GATE: document.config.gate,
    TASK_ORDER,
    getTask,
    taskIndex,
    nextTaskId: (id) => {
      const i = taskIndex(id);
      return i >= 0 && i < TASK_ORDER.length - 1 ? TASK_ORDER[i + 1] : null;
    },
    STORAGE_KEY,
    TEST_STORAGE_KEY: `${STORAGE_KEY}:designer-test`,
  };
}

// ---------------------------------------------------------------------------
// The progress envelope
// ---------------------------------------------------------------------------

/** One line jotted in the student's pocket notepad at the thing they were looking at. */
export interface NotepadEntry {
  id: string;
  taskId: TaskId;
  /** Kitchen clock when it was written, HH:MM. */
  at: string;
  /** What it is about, e.g. "Larder fridge 2" or "Salmon fillets". */
  label: string;
  /** The value as jotted, e.g. "7.8 °C", "8 kg", "smells clean". */
  value: string;
  /** Machine-readable hook so paperwork can pick the entry up, e.g. { unitId: 'larder-2' }. */
  ref?: Record<string, string | number>;
}

/**
 * Where the learner was in a task when the page was last saved, so a reload puts
 * them back at their work instead of at the task's first room.
 */
export interface TaskPosition {
  /** The room they were standing in (a place id from the client's workplace). */
  place: string;
  /** The step-guide action of the workspace that was open, or null when they were in the room itself. */
  workspace: string | null;
}

export interface Progress<TS = Record<string, unknown>> {
  version: 1;
  studentName: string;
  /** Initials derived from the name, used on every form. */
  initials: string;
  startedAt: string | null;
  /** Task ids the student has finished, in order. */
  completed: TaskId[];
  tasks: TS;
  completedAt: string | null;
  /** The workplace clock, HH:MM. Moves on as the student does things; each task resets it to its start time. */
  clock: string;
  /** The student's own notepad, kept all day. */
  notepad: NotepadEntry[];
  /** Last known room and open workspace per task; navigation only, never assessed. */
  positions: Partial<Record<TaskId, TaskPosition>>;
}

export interface ChecklistItem {
  id: string;
  label: string;
  met: boolean;
}

export interface Evaluation {
  done: boolean;
  checklist: ChecklistItem[];
}

/** What a client teaches the shell about its tasks' state. */
export interface ProgressModel<TS extends Record<string, unknown>> {
  initialTaskStates: () => TS;
  /** Done-when checks; each checklist item maps to a clause of the task's doneWhen. */
  evaluateTask: (id: TaskId, tasks: TS) => Evaluation;
  /** Whether the task's complication has surfaced yet, so the frame can show the spec's account of it. */
  complicationRevealed: (id: TaskId, tasks: TS) => boolean;
  /** Session-only, evaluator-valid fixtures for the opt-in designer panel. */
  testProgress: (target: TaskId | null | undefined, initial: () => Progress<TS>) => Progress<TS>;
  /**
   * Repair task states parsed from an older save after they have been merged over
   * the initial shape: seed new pre-filled defaults, drop requirements a signed
   * record never had. Mutate and return `tasks`.
   */
  reviveSaved?: (tasks: TS, saved: { stored: Record<string, unknown>; completed: TaskId[] }) => TS;
  /** Adjust a proposed update to one task's state before it is stored (e.g. keep derived fields consistent). */
  reconcileUpdate?: <K extends keyof TS & string>(id: K, prev: TS[K], next: TS[K]) => TS[K];
}

// ---------------------------------------------------------------------------
// Helpers shared by every client
// ---------------------------------------------------------------------------

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function parseNumber(value: string): number | null {
  const n = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(n) && value.trim() !== '' ? n : null;
}

export function within(value: string, target: number, tolerance: number): boolean {
  const n = parseNumber(value);
  return n !== null && Math.abs(n - target) <= tolerance + 1e-9;
}

/** "10:45" plus minutes -> "12:15". */
export function addMinutes(clock: string, minutes: number): string {
  const [h, m] = clock.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Formats a °C value the way it is written on the board. */
export function formatC(value: number): string {
  return `${value.toFixed(1)}°C`;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Test mode (the opt-in learning designer panel)
// ---------------------------------------------------------------------------

const TEST_MODE_ENABLED =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('testMode') === '1';

export function isTestMode(): boolean {
  return TEST_MODE_ENABLED;
}

// ---------------------------------------------------------------------------
// Telling the host page (the Springpod platform embeds this in an iframe)
// ---------------------------------------------------------------------------

export interface GateEvent {
  source: 'springpod';
  format: string;
  mechanic: string;
  id: string;
  event: 'task:complete' | 'gate:complete';
  taskId?: TaskId;
  /** On `gate:complete`: every authored task id, once, in the day's order. */
  completedTasks?: readonly TaskId[];
  completedAt: string;
}

export type HostEvent = Omit<GateEvent, 'source' | 'format' | 'mechanic' | 'id' | 'completedTasks'>;

// ---------------------------------------------------------------------------
// The runtime a client gets back
// ---------------------------------------------------------------------------

export interface DayRuntime<TS extends Record<string, unknown>> {
  spec: DaySpec;
  model: ProgressModel<TS>;
  initialProgress: () => Progress<TS>;
  testProgress: (target: TaskId | null | undefined) => Progress<TS>;
  isDayComplete: (p: Progress<TS>) => boolean;
  loadProgress: (testMode?: boolean) => Progress<TS>;
  saveProgress: (p: Progress<TS>) => void;
  clearProgress: () => void;
  notifyHost: (event: HostEvent) => void;
}

export function createDayRuntime<TS extends Record<string, unknown>>(
  document: DayDocument,
  model: ProgressModel<TS>,
): DayRuntime<TS> {
  const spec = createSpec(document);
  const { TASK_ORDER, STORAGE_KEY, TEST_STORAGE_KEY } = spec;

  const initialProgress = (): Progress<TS> => ({
    version: 1,
    studentName: '',
    initials: '',
    startedAt: null,
    completed: [],
    tasks: model.initialTaskStates(),
    completedAt: null,
    clock: spec.getTask(TASK_ORDER[0]).time,
    notepad: [],
    positions: {},
  });

  const isDayComplete = (p: Progress<TS>) => TASK_ORDER.every((id) => p.completed.includes(id));

  function loadProgress(testMode = isTestMode()): Progress<TS> {
    if (typeof window === 'undefined') return initialProgress();
    try {
      const raw = (testMode ? window.sessionStorage : window.localStorage).getItem(testMode ? TEST_STORAGE_KEY : STORAGE_KEY);
      if (!raw) return initialProgress();
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.tasks)) return initialProgress();
      // Merge over the initial shape, record by record, so fields added later get defaults
      // and a partial or hand-edited entry cannot leave a page reading undefined.
      const base = initialProgress();
      const tasks: Record<string, unknown> = {};
      for (const id of TASK_ORDER) {
        const stored = parsed.tasks[id];
        tasks[id] = mergeTaskState(base.tasks[id] as object, isRecord(stored) ? stored : {});
      }
      const completed = Array.isArray(parsed.completed)
        ? TASK_ORDER.filter((id) => (parsed.completed as unknown[]).includes(id))
        : [];
      const revived = model.reviveSaved
        ? model.reviveSaved(tasks as unknown as TS, { stored: parsed.tasks, completed })
        : (tasks as unknown as TS);
      return {
        ...base,
        studentName: typeof parsed.studentName === 'string' ? parsed.studentName : '',
        initials: typeof parsed.initials === 'string' ? parsed.initials : '',
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
        completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
        completed,
        tasks: revived,
        clock: typeof parsed.clock === 'string' && /^\d\d:\d\d$/.test(parsed.clock) ? parsed.clock : base.clock,
        notepad: Array.isArray(parsed.notepad)
          ? (parsed.notepad.filter(
              (e): e is NotepadEntry =>
                isRecord(e) &&
                typeof e.id === 'string' &&
                typeof e.label === 'string' &&
                typeof e.value === 'string' &&
                typeof e.at === 'string' &&
                TASK_ORDER.includes(e.taskId as TaskId),
            ) as NotepadEntry[])
          : [],
        positions: loadPositions(parsed.positions),
      };
    } catch {
      return initialProgress();
    }
  }

  /** Saved positions are advisory: anything malformed is dropped and the task opens at its start room. */
  function loadPositions(stored: unknown): Progress['positions'] {
    const positions: Progress['positions'] = {};
    if (!isRecord(stored)) return positions;
    for (const id of TASK_ORDER) {
      const value = stored[id];
      if (!isRecord(value) || typeof value.place !== 'string') continue;
      positions[id] = { place: value.place, workspace: typeof value.workspace === 'string' ? value.workspace : null };
    }
    return positions;
  }

  function saveProgress(p: Progress<TS>): void {
    if (typeof window === 'undefined') return;
    withStorage(() => {
      if (isTestMode()) window.sessionStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(p));
      else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    });
  }

  function clearProgress(): void {
    if (typeof window === 'undefined') return;
    withStorage(() => {
      if (isTestMode()) window.sessionStorage.removeItem(TEST_STORAGE_KEY);
      else window.localStorage.removeItem(STORAGE_KEY);
    });
  }

  /**
   * Posts progress to the parent window. Harmless when the app is opened on its own. The host
   * records a `gate:complete` once per launch and never replies, so nothing here waits on one.
   * The payload names the day and its tasks only; the learner's name never leaves the browser.
   */
  function notifyHost(event: HostEvent): void {
    if (typeof window === 'undefined' || window.parent === window || isTestMode()) return;
    const message: GateEvent = {
      source: 'springpod',
      format: document.format,
      mechanic: document.config.mechanic,
      id: document.config.id,
      ...event,
      ...(event.event === 'gate:complete' ? { completedTasks: TASK_ORDER } : {}),
    };
    window.parent.postMessage(message, '*');
  }

  return {
    spec,
    model,
    initialProgress,
    testProgress: (target) => model.testProgress(target, initialProgress),
    isDayComplete,
    loadProgress,
    saveProgress,
    clearProgress,
    notifyHost,
  };
}

/** Merge a stored task state over its initial shape. Nested records (rows, lines, guests...) are merged per key. */
export function mergeTaskState<T extends object>(base: T, stored: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, baseValue] of Object.entries(base)) {
    const value = stored[key];
    if (value === undefined) continue;
    if (isRecord(baseValue) && isRecord(value)) {
      const merged: Record<string, unknown> = { ...baseValue };
      for (const [k, v] of Object.entries(value)) {
        const b = merged[k];
        merged[k] = isRecord(b) && isRecord(v) ? { ...b, ...v } : v;
      }
      out[key] = merged;
    } else if (Array.isArray(baseValue) !== Array.isArray(value)) {
      continue; // wrong shape: keep the default
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

let storageWarned = false;

/**
 * Storage can be unavailable (private browsing, a full quota, a policy that blocks it, or a
 * frame without storage access). The day still works; it just will not resume after a reload.
 */
function withStorage(action: () => void): void {
  try {
    action();
  } catch (error) {
    if (storageWarned) return;
    storageWarned = true;
    console.warn('Progress could not be saved in this browser; the day will not resume after a reload.', error);
  }
}
