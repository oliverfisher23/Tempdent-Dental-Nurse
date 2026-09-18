/**
 * Simulation state, done-when rules and persistence for the try day.
 *
 * The UI owns how things look. This module owns what counts as done for each
 * task (mapped one-to-one to the doneWhen lines in content/mechanic.json), the
 * shape of the state the UI edits, saving progress so a student can come back,
 * and telling the host page when the whole day is complete.
 */

import mechanic from '@/content/mechanic.json';
import {
  ADDED_GUESTS,
  ALLERGENS,
  CHILL_RULES,
  CHILLER_SHELVES,
  DISHES,
  ELENA_QUESTION,
  FISH_CHECKS,
  FRIDGE_UNITS,
  HANDOVER_FIELDS,
  NINETY_MINUTE_CHOICES,
  ORDER_LINES,
  OVERNIGHT_LOG,
  PREP_SHEET,
  PROBE_PLACEMENTS,
  READING_TOLERANCE_C,
  SHORT_LINE_ID,
  TASK_ORDER,
  WASTE_BINS,
  WEIGHT_TOLERANCE_KG,
  YOUR_TRAY_READINGS,
  type AllergenId,
  type ChillInterval,
  type ElenaOptionId,
  type FishCheckId,
  type LineStatus,
  type NinetyMinuteChoiceId,
  type ProbePlacementId,
  type TaskId,
} from '@/content/activities';

// ---------------------------------------------------------------------------
// The spec
// ---------------------------------------------------------------------------

export type Mechanic = typeof mechanic;
export type MechanicTask = Mechanic['config']['tasks'][number];

export const MECHANIC = mechanic;
export const FRAME = mechanic.config.frame;
export const GATE = mechanic.config.gate;

export function getTask(id: TaskId): MechanicTask {
  const task = mechanic.config.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  return task;
}

export function taskIndex(id: TaskId): number {
  return TASK_ORDER.indexOf(id);
}

export function nextTaskId(id: TaskId): TaskId | null {
  const i = taskIndex(id);
  return i >= 0 && i < TASK_ORDER.length - 1 ? TASK_ORDER[i + 1] : null;
}

// ---------------------------------------------------------------------------
// Per-task state (what the student has written and done)
// ---------------------------------------------------------------------------

export interface BoardRow {
  /** Student has put the probe in and seen the reading. */
  probed: boolean;
  /** What they wrote on the board. */
  reading: string;
  /** Written when the reading is entered, e.g. "06:52". */
  time: string;
  initials: string;
  note: string;
  /** False while editing; true once the learner saves the check and closes the door. */
  recorded?: boolean;
}

export interface HandoverState {
  logRead: string[]; // times of the log entries the student has opened
  rows: Record<string, BoardRow>;
}

export interface OrderLineState {
  /** Student has counted the line. */
  counted: boolean;
  arrived: string;
  probed: boolean;
  temperature: string;
  status: LineStatus | null;
}

export interface DeliveryState {
  lines: Record<string, OrderLineState>;
  fishChecks: Record<FishCheckId, boolean>;
  /** Marcus has been radioed about the short line. */
  radioedMarcus: boolean;
  /** What the student has written on the delivery note against the short line. */
  noteAmendedTo: string;
  signature: string;
  signed: boolean;
}

export interface ChillState {
  /** Kilos scooped into each of your trays. */
  trays: number[];
  /** Student asked Marcus for a fourth tray (there isn't one). */
  askedForTray: boolean;
  /** Shelf index for each tray once loaded, or null while it is still on the bench. */
  shelfByTray: (number | null)[];
  probePlacement: ProbePlacementId | null;
  /** Written readings keyed by minute mark. */
  readings: Partial<Record<ChillInterval, { value: string; time: string }>>;
  /** Minutes elapsed on the simulated chiller clock. */
  minutesElapsed: number;
  ninetyChoice: NinetyMinuteChoiceId | null;
  measuredDepths: boolean;
  studentSigned: boolean;
}

export interface GuestAssignment {
  main: 'beef' | 'wellington' | null;
  dessert: 'frangipane' | 'pear' | null;
}

export interface DietaryState {
  /** Ticks on the allergen chart, keyed by dish id. */
  chart: Record<string, AllergenId[]>;
  /** Dish ids Marcus has flagged as wrong on the last check. */
  flaggedDishes: string[];
  chartChecked: boolean;
  guests: Record<string, GuestAssignment>;
  boardNote: string;
  boardPosted: boolean;
}

export interface CloseState {
  weighed: Record<string, boolean>;
  weights: Record<string, string>;
  handover: Record<string, string>;
  handedOver: boolean;
  elenaAnswer: ElenaOptionId | null;
  elenaSigned: boolean;
}

export interface TaskStates {
  'take-the-handover': HandoverState;
  'check-the-delivery-in': DeliveryState;
  'chill-the-event-batch': ChillState;
  'check-the-dietary-list': DietaryState;
  'hand-the-kitchen-on': CloseState;
}

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

export interface Progress {
  version: 1;
  studentName: string;
  /** Initials derived from the name, used on every form. */
  initials: string;
  startedAt: string | null;
  /** Task ids the student has finished, in order. */
  completed: TaskId[];
  tasks: TaskStates;
  completedAt: string | null;
  /** The kitchen clock, HH:MM. Moves on as the student does things; each task resets it to its start time. */
  clock: string;
  /** The student's own notepad, kept all day. */
  notepad: NotepadEntry[];
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function initialTaskStates(): TaskStates {
  return {
    'take-the-handover': {
      logRead: [],
      rows: Object.fromEntries(
        FRIDGE_UNITS.map((u) => [u.id, { probed: false, reading: '', time: '', initials: '', note: '' }]),
      ),
    },
    'check-the-delivery-in': {
      lines: Object.fromEntries(
        ORDER_LINES.map((l) => [l.id, { counted: false, arrived: '', probed: false, temperature: '', status: null }]),
      ),
      fishChecks: Object.fromEntries(FISH_CHECKS.map((c) => [c.id, false])) as Record<FishCheckId, boolean>,
      radioedMarcus: false,
      noteAmendedTo: '',
      signature: '',
      signed: false,
    },
    'chill-the-event-batch': {
      trays: Array.from({ length: PREP_SHEET.cleanTraysAvailable }, () => 0),
      askedForTray: false,
      shelfByTray: Array.from({ length: PREP_SHEET.cleanTraysAvailable }, () => null),
      probePlacement: null,
      readings: {},
      minutesElapsed: 0,
      ninetyChoice: null,
      measuredDepths: false,
      studentSigned: false,
    },
    'check-the-dietary-list': {
      chart: Object.fromEntries(DISHES.map((d) => [d.id, []])),
      flaggedDishes: [],
      chartChecked: false,
      guests: Object.fromEntries(ADDED_GUESTS.map((g) => [g.id, { main: null, dessert: null }])),
      boardNote: '',
      boardPosted: false,
    },
    'hand-the-kitchen-on': {
      weighed: Object.fromEntries(WASTE_BINS.map((b) => [b.id, false])),
      weights: Object.fromEntries(WASTE_BINS.map((b) => [b.id, ''])),
      handover: Object.fromEntries(HANDOVER_FIELDS.map((f) => [f.id, ''])),
      handedOver: false,
      elenaAnswer: null,
      elenaSigned: false,
    },
  };
}

export function initialProgress(): Progress {
  return {
    version: 1,
    studentName: '',
    initials: '',
    startedAt: null,
    completed: [],
    tasks: initialTaskStates(),
    completedAt: null,
    clock: getTask(TASK_ORDER[0]).time,
    notepad: [],
  };
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Done-when checks. Each item maps to a clause of the spec's doneWhen.
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  met: boolean;
}

export interface Evaluation {
  done: boolean;
  checklist: ChecklistItem[];
}

const flaggedUnitId = OVERNIGHT_LOG.find((e) => e.flagsUnitId)?.flagsUnitId ?? 'larder-2';

export function rowReadingIsRight(unitId: string, reading: string): boolean {
  const unit = FRIDGE_UNITS.find((u) => u.id === unitId);
  return !!unit && within(reading, unit.actualC, READING_TOLERANCE_C);
}

export function evaluateHandover(s: HandoverState): Evaluation {
  const rows = FRIDGE_UNITS.map((u) => s.rows[u.id]);
  const everyReading = rows.every((r, i) => r && r.probed && rowReadingIsRight(FRIDGE_UNITS[i].id, r.reading));
  const everyTime = rows.every((r) => r && r.time.trim() !== '');
  const everyInitials = rows.every((r) => r && r.initials.trim() !== '');
  const noteOnFlagged = (s.rows[flaggedUnitId]?.note ?? '').trim().length >= 8;
  const checklist: ChecklistItem[] = [
    { id: 'log', label: 'Overnight log read', met: s.logRead.length >= OVERNIGHT_LOG.length },
    { id: 'readings', label: 'Every row on the board carries a reading', met: everyReading },
    { id: 'time', label: 'A time against every row', met: everyTime },
    { id: 'initials', label: 'Your initials against every row', met: everyInitials },
    { id: 'note', label: 'A note written next to the fridge named in the overnight log', met: noteOnFlagged },
  ];
  return { done: checklist.every((c) => c.met), checklist };
}

export function lineStatusIsRight(lineId: string, status: LineStatus | null): boolean {
  const line = ORDER_LINES.find((l) => l.id === lineId);
  return !!line && status === line.expectedStatus;
}

export function evaluateDelivery(s: DeliveryState): Evaluation {
  const everyMarked = ORDER_LINES.every((l) => {
    const st = s.lines[l.id];
    return st && st.counted && parseNumber(st.arrived) === l.arrived && st.status !== null && lineStatusIsRight(l.id, st.status);
  });
  const everyChilledTemp = ORDER_LINES.filter((l) => l.chilled).every((l) => {
    const st = s.lines[l.id];
    return st && st.probed && within(st.temperature, l.actualC ?? 0, READING_TOLERANCE_C);
  });
  const fishLooked = FISH_CHECKS.every((c) => s.fishChecks[c.id]);
  const shortLine = ORDER_LINES.find((l) => l.id === SHORT_LINE_ID)!;
  const amended = parseNumber(s.noteAmendedTo) === shortLine.arrived;
  const signedRight = s.signed && s.signature.trim() !== '' && amended;
  const checklist: ChecklistItem[] = [
    { id: 'lines', label: 'Every line marked arrived, short or refused', met: everyMarked },
    { id: 'temps', label: 'Every chilled line carries a temperature', met: everyChilledTemp },
    { id: 'fish', label: 'The fish looked at and smelled', met: fishLooked },
    { id: 'note', label: 'Delivery note signed for what you actually took in', met: signedRight },
  ];
  return { done: checklist.every((c) => c.met), checklist };
}

export function totalPortionedKg(s: ChillState): number {
  return Math.round(s.trays.reduce((a, b) => a + b, 0) * 100) / 100;
}

/** True when no two loaded trays sit on neighbouring shelves. */
export function traysHaveSpace(shelfByTray: (number | null)[]): boolean {
  const shelves = shelfByTray.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (shelves.length !== shelfByTray.length) return false;
  for (let i = 1; i < shelves.length; i++) {
    if (shelves[i] - shelves[i - 1] < 2) return false;
  }
  return shelves.every((x) => x >= 0 && x < CHILLER_SHELVES);
}

export function readingIsRight(interval: ChillInterval, value: string): boolean {
  return within(value, YOUR_TRAY_READINGS[interval], READING_TOLERANCE_C);
}

export function evaluateChill(s: ChillState): Evaluation {
  const portioned = Math.abs(totalPortionedKg(s) - PREP_SHEET.yourShareKg) < 0.01;
  const loaded = traysHaveSpace(s.shelfByTray);
  const probeRight = s.probePlacement !== null && PROBE_PLACEMENTS.find((p) => p.id === s.probePlacement)?.correct === true;
  const fourReadings = CHILL_RULES.intervals.every((i) => {
    const r = s.readings[i];
    return r && r.time.trim() !== '' && readingIsRight(i, r.value);
  });
  const rightChoice = NINETY_MINUTE_CHOICES.find((c) => c.id === s.ninetyChoice)?.correct === true;
  const underTheLine = (() => {
    const r = s.readings[CHILL_RULES.extraInterval];
    return !!r && readingIsRight(CHILL_RULES.extraInterval, r.value);
  })();
  const checklist: ChecklistItem[] = [
    { id: 'portion', label: 'The batch portioned into trays', met: portioned },
    { id: 'space', label: 'Trays in the chiller with space between them', met: loaded },
    { id: 'probe', label: 'Probe in the thickest part of the fullest tray', met: probeRight },
    { id: 'readings', label: 'Four readings on the chill record with the time each was taken', met: fourReadings },
    { id: 'ninety', label: 'The batch kept in the chiller and logged until it is under the line', met: rightChoice && s.measuredDepths && underTheLine },
    { id: 'sign', label: 'Your signature on the chill record', met: s.studentSigned },
  ];
  return { done: checklist.every((c) => c.met), checklist };
}

export function chartRowIsRight(dishId: string, ticked: AllergenId[]): boolean {
  const dish = DISHES.find((d) => d.id === dishId);
  if (!dish) return false;
  const a = [...ticked].sort().join(',');
  const b = [...dish.allergens].sort().join(',');
  return a === b;
}

export function wrongChartRows(chart: Record<string, AllergenId[]>): string[] {
  return DISHES.filter((d) => !chartRowIsRight(d.id, chart[d.id] ?? [])).map((d) => d.id);
}

export function guestAssignmentIsSafe(guestId: string, a: GuestAssignment): boolean {
  const guest = ADDED_GUESTS.find((g) => g.id === guestId);
  if (!guest || !a.main || !a.dessert) return false;
  const main = DISHES.find((d) => d.id === a.main)!;
  const dessert = DISHES.find((d) => d.id === a.dessert)!;
  const avoids = (d: typeof main) => d.allergens.every((al) => !guest.mustAvoid.includes(al));
  if (!avoids(main) || !avoids(dessert)) return false;
  if (guest.vegetarian && a.main !== 'wellington') return false;
  return true;
}

/** The board note has to name the guest or her table and the dish that replaces the frangipane. */
export function boardNoteIsUseful(note: string): boolean {
  const priya = ADDED_GUESTS.find((g) => g.id === 'priya')!;
  const n = note.toLowerCase();
  const namesGuest = n.includes(priya.name.split(' ')[0].toLowerCase()) || new RegExp(`table\\s*${priya.table}\\b`).test(n) || new RegExp(`\\bt${priya.table}\\b`).test(n);
  const namesDish = n.includes('pear');
  return namesGuest && namesDish;
}

export function evaluateDietary(s: DietaryState): Evaluation {
  const chartRight = wrongChartRows(s.chart).length === 0;
  const allAllergensConsidered = ALLERGENS.length === 14; // the chart always shows all fourteen
  const guestsDone = ADDED_GUESTS.every((g) => guestAssignmentIsSafe(g.id, s.guests[g.id] ?? { main: null, dessert: null }));
  const checklist: ChecklistItem[] = [
    { id: 'chart', label: 'Every dish marked against all fourteen allergens', met: chartRight && allAllergensConsidered && s.chartChecked },
    { id: 'guests', label: 'Each of the three added guests has a dish written against their name', met: guestsDone },
    { id: 'board', label: 'The changes are up on the evening board', met: s.boardPosted && guestsDone && boardNoteIsUseful(s.boardNote) },
  ];
  return { done: checklist.every((c) => c.met), checklist };
}

export function weightIsRight(binId: string, value: string): boolean {
  const bin = WASTE_BINS.find((b) => b.id === binId);
  return !!bin && within(value, bin.actualKg, WEIGHT_TOLERANCE_KG);
}

export function evaluateClose(s: CloseState, chill: ChillState): Evaluation {
  const weights = WASTE_BINS.every((b) => s.weighed[b.id] && weightIsRight(b.id, s.weights[b.id] ?? ''));
  const handoverFilled = HANDOVER_FIELDS.every((f) => (s.handover[f.id] ?? '').trim().length >= 10);
  const elenaAnswered = s.elenaAnswer !== null && ELENA_QUESTION.options.some((o) => o.id === s.elenaAnswer);
  const checklist: ChecklistItem[] = [
    { id: 'waste', label: 'A weight against each of the three rows on the waste sheet', met: weights },
    { id: 'handover', label: 'Handover sheet filled in and handed over', met: handoverFilled && s.handedOver },
    { id: 'signatures', label: 'Both signatures on the chill record', met: chill.studentSigned && s.elenaSigned && elenaAnswered },
  ];
  return { done: checklist.every((c) => c.met), checklist };
}

export function evaluateTask(id: TaskId, tasks: TaskStates): Evaluation {
  switch (id) {
    case 'take-the-handover':
      return evaluateHandover(tasks[id]);
    case 'check-the-delivery-in':
      return evaluateDelivery(tasks[id]);
    case 'chill-the-event-batch':
      return evaluateChill(tasks[id]);
    case 'check-the-dietary-list':
      return evaluateDietary(tasks[id]);
    case 'hand-the-kitchen-on':
      return evaluateClose(tasks[id], tasks['chill-the-event-batch']);
  }
}

/** Whether the task's complication has surfaced yet, so the shell can show the spec's account of it. */
export function complicationRevealed(id: TaskId, tasks: TaskStates): boolean {
  switch (id) {
    case 'take-the-handover': {
      const t = tasks[id];
      return t.logRead.includes('04:10') || !!t.rows['larder-2']?.probed;
    }
    case 'check-the-delivery-in': {
      const st = tasks[id].lines[SHORT_LINE_ID];
      return !!st && st.counted && st.arrived.trim() !== '';
    }
    case 'chill-the-event-batch':
      return tasks[id].readings[90] !== undefined;
    case 'check-the-dietary-list':
      return tasks[id].chartChecked;
    case 'hand-the-kitchen-on':
      return tasks[id].handedOver;
  }
}

export function isDayComplete(p: Progress): boolean {
  return TASK_ORDER.every((id) => p.completed.includes(id));
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export const STORAGE_KEY = `springpod:${mechanic.config.id}:v${mechanic.config.version}`;

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return initialProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.tasks)) return initialProgress();
    // Merge over the initial shape, record by record, so fields added later get defaults
    // and a partial or hand-edited entry cannot leave a page reading undefined.
    const base = initialProgress();
    const tasks: Record<string, unknown> = {};
    for (const id of TASK_ORDER) {
      const stored = parsed.tasks[id];
      tasks[id] = mergeTaskState(base.tasks[id], isRecord(stored) ? stored : {});
    }
    return {
      ...base,
      studentName: typeof parsed.studentName === 'string' ? parsed.studentName : '',
      initials: typeof parsed.initials === 'string' ? parsed.initials : '',
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
      completed: Array.isArray(parsed.completed)
        ? (TASK_ORDER.filter((id) => (parsed.completed as unknown[]).includes(id)) as TaskId[])
        : [],
      tasks: tasks as unknown as TaskStates,
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
    };
  } catch {
    return initialProgress();
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merge a stored task state over its initial shape. Nested records (rows, lines, guests...) are merged per key. */
function mergeTaskState<T extends object>(base: T, stored: Record<string, unknown>): T {
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

export function saveProgress(p: Progress): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
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
  completedAt: string;
}

/** Posts progress to the parent window. Harmless when the app is opened on its own. */
export function notifyHost(event: Omit<GateEvent, 'source' | 'format' | 'mechanic' | 'id'>): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  const message: GateEvent = {
    source: 'springpod',
    format: mechanic.format,
    mechanic: mechanic.config.mechanic,
    id: mechanic.config.id,
    ...event,
  };
  window.parent.postMessage(message, '*');
}
