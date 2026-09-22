/**
 * Simulation state, done-when rules and persistence for the try day.
 *
 * The UI owns how things look. This module owns what counts as done for each
 * task (mapped one-to-one to the doneWhen lines in content/mechanic.json), the
 * shape of the state the UI edits, saving progress so a student can come back,
 * and telling the host page when the whole day is complete.
 */

import mechanic from '@/content/mechanic.json';
import { deliveryReviewIssues } from '@/lib/delivery-workflow';
import type { DeliveryRedesignState, ChillRedesignState, DietaryRedesignState, CloseRedesignState } from './redesign-types';
import { dietaryRedesignChecklist } from './redesign-dietary';
import { handoverDelivered } from './redesign-close';
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
  DIAL_READING_TOLERANCE_C,
  REFUSED_LINE_ID,
  SHORT_LINE_ID,
  TERENCE_CHART_MARKS,
  TERENCE_CHART_ROWS,
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
  type OrderLine,
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
  comparison: 'matches-both' | 'differs-both' | 'differs-order' | 'differs-claim' | null;
  acceptance: 'accept' | 'refuse' | null;
  acceptedAmount: string;
}

export interface DeliveryAmendment {
  amendedTo: string;
  initials: string;
  refused: boolean;
  temperature: string;
}

export interface DeliveryState {
  redesign?: DeliveryRedesignState;
  lines: Record<string, OrderLineState>;
  fishChecks: Record<FishCheckId, boolean>;
  fishReason: null | 'condition-and-temperature' | 'quantity-only' | 'supplier-claim-only';
  /** Marcus has been radioed about the short line. */
  radioedMarcus: boolean;
  /** What the student has written on the delivery note against the short line. */
  noteAmendedTo: string;
  signature: string;
  signed: boolean;
  missingAmount: string;
  noteLineId: string;
  amendmentInitials: string;
  /** Amendments keyed by line. Legacy single-amendment fields remain readable. */
  amendments: Record<string, DeliveryAmendment>;
  contextRevealed: boolean;
  report: {
    productId: string;
    service: 'tomorrow-lunch' | 'tonight-launch' | 'both' | null;
    action: 'contact-supplier' | 'change-tonight-menu' | 'no-follow-up' | null;
  };
  reportAttempted: boolean;
  reportSentSnapshot: string;
}

export interface ChillState {
  redesign?: ChillRedesignState;
  /** Kilos scooped into each of your trays. */
  trays: number[];
  /** Student requested a clean spare tray. */
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
  redesign?: DietaryRedesignState;
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
  redesign?: CloseRedesignState;
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

/**
 * Where the learner was in a task when the page was last saved, so a reload puts
 * them back at their work instead of at the task's first room.
 */
export interface TaskPosition {
  /** The room they were standing in (a PlaceId from the kitchen content). */
  place: string;
  /** The step-guide action of the workspace that was open, or null when they were in the room itself. */
  workspace: string | null;
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
  /** Last known room and open workspace per task; navigation only, never assessed. */
  positions: Partial<Record<TaskId, TaskPosition>>;
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
        ORDER_LINES.map((l) => [l.id, {
          counted: false, arrived: '', probed: false, temperature: '', status: null,
          comparison: null, acceptance: null, acceptedAmount: '',
        }]),
      ),
      fishChecks: Object.fromEntries(FISH_CHECKS.map((c) => [c.id, false])) as Record<FishCheckId, boolean>,
      fishReason: null,
      radioedMarcus: false,
      noteAmendedTo: '',
      signature: '',
      signed: false,
      missingAmount: '',
      noteLineId: '',
      amendmentInitials: '',
      amendments: {},
      contextRevealed: false,
      report: { productId: '', service: null, action: null },
      reportAttempted: false,
      reportSentSnapshot: '',
    },
    'chill-the-event-batch': {
      redesign: { version: 1, comparisonReviewed: false },
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
      redesign: { version: 1, decisions: {}, serviceHoldAcknowledged: false, rowReviewConfirmed: {}, openQuestions: {}, sheetRead: false, hintLevels: {}, board: {}, courseReviewed: {} },
      chart: Object.fromEntries(DISHES.map((d) => [d.id, [...(TERENCE_CHART_MARKS[d.id as keyof typeof TERENCE_CHART_MARKS] ?? [])]])),
      flaggedDishes: [],
      chartChecked: false,
      guests: Object.fromEntries(ADDED_GUESTS.map((g) => [g.id, { main: null, dessert: null }])),
      boardNote: '',
      boardPosted: false,
    },
    'hand-the-kitchen-on': {
      redesign: { version: 1, wasteFocus: '', wasteReason: '', priorities: {}, clarifications: {}, recipientConfirmed: false, attempted: false },
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
    positions: {},
  };
}

/** Session-only, evaluator-valid fixtures used by the opt-in designer panel. */
export function testProgress(target: TaskId | null | undefined): Progress {
  const p = initialProgress();
  const initials = initialsFromName('Learning Designer');
  const shortDeliveryLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
  const handover: HandoverState = {
    logRead: OVERNIGHT_LOG.map((entry) => entry.time),
    rows: Object.fromEntries(FRIDGE_UNITS.map((unit) => [unit.id, {
      probed: true, reading: String(unit.actualC), time: '06:50', initials, note: unit.id === 'larder-2' ? 'Door found open overnight; move high-risk food and re-check.' : 'Checked and recorded.',
    }])),
  };
  const delivery: DeliveryState = {
    lines: Object.fromEntries(ORDER_LINES.map((line) => [line.id, {
      counted: true, arrived: String(line.arrived), probed: line.chilled,
      temperature: line.chilled ? String(line.actualC) : '', status: line.expectedStatus,
      comparison: line.id === SHORT_LINE_ID ? 'differs-both' : 'matches-both',
      acceptance: expectedAcceptance(line), acceptedAmount: String(expectedAcceptedAmount(line)),
    }])),
    fishChecks: Object.fromEntries(FISH_CHECKS.map((check) => [check.id, true])) as Record<FishCheckId, boolean>,
    fishReason: 'condition-and-temperature',
    radioedMarcus: true, noteAmendedTo: String(shortDeliveryLine.arrived), signature: initials, signed: true,
    missingAmount: String(shortDeliveryLine.ordered - shortDeliveryLine.arrived),
    noteLineId: SHORT_LINE_ID, amendmentInitials: initials,
    amendments: {
      [SHORT_LINE_ID]: {
        amendedTo: String(shortDeliveryLine.arrived), initials, refused: false, temperature: '',
      },
      [REFUSED_LINE_ID]: {
        amendedTo: '0', initials, refused: true,
        temperature: String(ORDER_LINES.find((line) => line.id === REFUSED_LINE_ID)?.actualC ?? ''),
      },
    },
    contextRevealed: true,
    report: { productId: SHORT_LINE_ID, service: 'tomorrow-lunch', action: 'contact-supplier' },
    reportAttempted: true,
    reportSentSnapshot: '',
  };
  delivery.reportSentSnapshot = JSON.stringify({
    productId: SHORT_LINE_ID, service: 'tomorrow-lunch', action: 'contact-supplier',
    checkedAmount: String(shortDeliveryLine.arrived), acceptance: 'accept',
    acceptedAmount: String(shortDeliveryLine.arrived),
    missingAmount: String(shortDeliveryLine.ordered - shortDeliveryLine.arrived),
  });
  const chill: ChillState = {
    redesign: { version: 1, comparisonReviewed: true },
    trays: [4, 4, 4, 1.5], askedForTray: true, shelfByTray: [0, 2, 4, 6],
    probePlacement: 'centre',
    readings: Object.fromEntries(([...CHILL_RULES.intervals, CHILL_RULES.extraInterval] as ChillInterval[]).map((minute) => [
      minute, { value: String(YOUR_TRAY_READINGS[minute]), time: addMinutes(CHILL_RULES.startClock, minute) },
    ])),
    minutesElapsed: 120, ninetyChoice: 'keep-logging', measuredDepths: true, studentSigned: true,
  };
  const dietary: DietaryState = {
    redesign: {
      version: 1,
      sheetRead: true,
      rowReviewConfirmed: Object.fromEntries(DISHES.map((dish) => [dish.id, true])),
      openQuestions: { pear: 'How the pear has been handled and plated in the pastry fridge, before it goes to table 3.' },
      serviceHoldAcknowledged: true,
      hintLevels: {},
      courseReviewed: { 'priya:main': true, 'priya:dessert': true, 'tom:main': true, 'tom:dessert': true },
      board: {
        'priya:dessert': { reason: 'Tree-nut and peanut allergy. The frangipane has ground almonds through it and pistachios on top; the pear card lists milk only.' },
        'tom:main': { reason: 'Vegetarian. The beef card lists beef shin and beef stock; the Wellington is the vegetarian main.' },
      },
      decisions: {
        'priya:main': { action: 'keep', proposedDishId: 'beef', category: 'no-conflict', evidence: ['Beef shin'], reason: 'No nuts are listed in the supplied main ingredients; preparation checks remain pending.' },
        'priya:dessert': { action: 'swap', proposedDishId: 'pear', category: 'ingredient-conflict', evidence: ['Ground almonds', 'Pistachios', 'Almonds are mixed through the prepared tart'], reason: 'Almonds run throughout the filling and pistachios are present. Removing visible nuts cannot fix this. Propose pear, which still contains milk, subject to preparation checks.' },
        'tom:main': { action: 'swap', proposedDishId: 'wellington', category: 'vegetarian-conflict', evidence: ['Beef shin'], reason: 'The beef conflicts with the vegetarian request; the Wellington is the listed vegetarian main.' },
        'tom:dessert': { action: 'keep', proposedDishId: 'frangipane', category: 'no-conflict', evidence: ['Ground almonds'], reason: 'No conflict with the stated vegetarian request is identified in these dessert ingredients.' },
      },
    },
    chart: Object.fromEntries(DISHES.map((dish) => [dish.id, [...dish.allergens]])),
    flaggedDishes: [], chartChecked: true,
    guests: { priya: { main: 'beef', dessert: 'pear' }, tom: { main: 'wellington', dessert: 'frangipane' } },
    boardNote: [
      'Table 3 · Priya Nair · Dessert: Pistachio and raspberry frangipane tart, crème fraîche → Poached pear, vanilla ice cream · Reason: Tree-nut and peanut allergy. The frangipane has ground almonds through it and pistachios on top; the pear card lists milk only. · Preparation check pending: ask Terence before service',
      'Table 6 · Tom Reid · Main: Braised beef shin, horseradish mash, glazed carrots, red wine jus → Wild mushroom, spinach and ricotta Wellington · Reason: Vegetarian. The beef card lists beef shin and beef stock; the Wellington is the vegetarian main.',
      "Open for Terence: Tom Reid's starter, table 6: The smoked haddock tart is not vegetarian and there is no vegetarian starter on the cards. This needs a separate decision from Terence; it is not approved here.",
    ].join('\n'), boardPosted: true,
  };
  const close: CloseState = {
    redesign: {
      version: 1, wasteFocus: 'plate', wasteReason: 'Ask the service team what came back and why before changing anything.',
      priorities: { salmon: 'later', larder2: 'before-service', table3: 'before-service' },
      responsibilities: { salmon: 'Terence', larder2: 'Evening chef', table3: 'Terence and evening service team' },
      clarifications: {
        'salmon.quantity': 'four', 'salmon.meal': 'tomorrow-lunch', 'salmon.status': 'terence-ringing',
        'larder2.finding': 'signed-reading', 'larder2.check': 'recheck-requested',
        'table3.guest': 'table3', 'table3.dessert': 'pear', 'table3.status': 'on-hold',
        'ready.beef': 'signed', 'ready.where': 'honest',
      },
      recipientConfirmed: true,
      attempted: true,
    },
    weighed: Object.fromEntries(WASTE_BINS.map((bin) => [bin.id, true])),
    weights: Object.fromEntries(WASTE_BINS.map((bin) => [bin.id, String(bin.actualKg)])),
    handover: { prepared: 'My four trays of beef shin are on the signed chill record, last reading 5.9°C at 12:45. Frangipane made this morning. I have not seen a record for the tart or the Wellington.', short: 'Salmon: 8 kg came in against 12 ordered, 4 kg short, for tomorrow’s lunch. Terence said he would ring the supplier; nothing confirmed.', walkIn: 'Walk-in read 3.4°C on my morning round. The beef goes in there once it is down. Pear is in the pastry fridge for the bistro.', watch: 'Larder fridge 2 read 8.6°C at 06:50 after the door was found open; it needs re-checking before service. Table 3 pear is on the board, held for Terence’s preparation and service checks.' },
    handedOver: true, elenaAnswer: 'shallower', elenaSigned: true,
  };
  const completeStates: TaskStates = { 'take-the-handover': handover, 'check-the-delivery-in': delivery, 'chill-the-event-batch': chill, 'check-the-dietary-list': dietary, 'hand-the-kitchen-on': close };
  const index = target === null ? TASK_ORDER.length : target === undefined ? 0 : TASK_ORDER.indexOf(target);
  return {
    ...p, studentName: 'Learning Designer', initials, startedAt: new Date().toISOString(),
    // Only seed preceding tasks. Later tasks must still start with blank learner work.
    tasks: Object.fromEntries(TASK_ORDER.map((id, i) => [id, i < index ? completeStates[id] : p.tasks[id]])) as unknown as TaskStates,
    completed: TASK_ORDER.slice(0, index), completedAt: target === null ? new Date().toISOString() : null,
    clock: target === null ? getTask(TASK_ORDER[TASK_ORDER.length - 1]).time : target === undefined ? getTask(TASK_ORDER[0]).time : getTask(target).time,
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
  return !!unit && within(reading, unit.actualC, DIAL_READING_TOLERANCE_C);
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

/** A refused line goes back on the van; everything else is accepted as counted. */
export function expectedAcceptance(line: Pick<OrderLine, 'expectedStatus'>): NonNullable<OrderLineState['acceptance']> {
  return line.expectedStatus === 'refused' ? 'refuse' : 'accept';
}

export function expectedAcceptedAmount(line: Pick<OrderLine, 'expectedStatus' | 'arrived'>): number {
  return line.expectedStatus === 'refused' ? 0 : line.arrived;
}

export function evaluateDelivery(s: DeliveryState): Evaluation {
  const everyMarked = ORDER_LINES.every((l) => {
    const st = s.lines[l.id];
    const differsOrder = l.arrived !== l.ordered;
    const differsClaim = l.arrived !== l.onDeliveryNote;
    const expectedComparison: OrderLineState['comparison'] =
      differsOrder && differsClaim ? 'differs-both'
        : differsOrder ? 'differs-order'
          : differsClaim ? 'differs-claim'
            : 'matches-both';
    return st
      && st.counted
      && parseNumber(st.arrived) === l.arrived
      && lineStatusIsRight(l.id, st.status)
      && st.comparison === expectedComparison
      && st.acceptance === expectedAcceptance(l)
      && parseNumber(st.acceptedAmount) === expectedAcceptedAmount(l);
  });
  const everyChilledTemp = ORDER_LINES.filter((l) => l.chilled).every((l) => {
    const st = s.lines[l.id];
    return st && st.probed && within(st.temperature, l.actualC ?? 0, READING_TOLERANCE_C);
  });
  const fishLooked = FISH_CHECKS.every((c) => s.fishChecks[c.id])
    && s.fishReason === 'condition-and-temperature';
  const signedRight = deliveryReviewIssues(s, true).length === 0;
  const checklist: ChecklistItem[] = [
    { id: 'lines', label: 'Every line is marked as arrived, short or refused', met: everyMarked },
    { id: 'temps', label: 'Every chilled item is marked with a temperature', met: everyChilledTemp },
    { id: 'fish', label: 'The fish is looked at and smelled', met: fishLooked },
    { id: 'note', label: 'Delivery note signed for what you actually accepted', met: signedRight },
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
  return shelves.every((x) => Number.isInteger(x) && x >= 0 && x < CHILLER_SHELVES);
}

export function readingIsRight(interval: ChillInterval, value: string): boolean {
  return within(value, YOUR_TRAY_READINGS[interval], READING_TOLERANCE_C);
}

/** "0, 60 and 90" from a list of minute marks. */
function listMinutes(marks: readonly number[]): string {
  if (marks.length <= 1) return marks.join('');
  return `${marks.slice(0, -1).join(', ')} and ${marks[marks.length - 1]}`;
}

export function evaluateChill(s: ChillState): Evaluation {
  const validTrays = s.trays.length > 0 && s.trays.every((kg) => Number.isFinite(kg) && kg > 0);
  const portioned = validTrays && Math.abs(totalPortionedKg(s) - PREP_SHEET.yourShareKg) < 0.01
    && (!s.redesign || s.trays.every((kg) => kg <= PREP_SHEET.kgPerTrayAtDepth));
  const loaded = s.shelfByTray.length === s.trays.length && traysHaveSpace(s.shelfByTray);
  const probeRight = s.probePlacement !== null && PROBE_PLACEMENTS.find((p) => p.id === s.probePlacement)?.correct === true;
  const timedReadings = CHILL_RULES.intervals.every((i) => {
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
    { id: 'readings', label: `A reading at ${listMinutes(CHILL_RULES.intervals)} minutes on the chill record, each with the time it was taken`, met: timedReadings },
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
  const guestsDone = ADDED_GUESTS.every((g) => guestAssignmentIsSafe(g.id, s.guests[g.id] ?? { main: null, dessert: null }));
  // The menu-first record checks each clause of the same done-when more narrowly (D11):
  // reviewed rows, evidence-backed decisions, a structured board. A legacy record keeps
  // its original checks, so a signed-off day gains no new requirements.
  const checklist: ChecklistItem[] = s.redesign
    ? dietaryRedesignChecklist(s).map((item) => (item.id === 'guests' ? { ...item, met: item.met && guestsDone } : item))
    : [
        { id: 'chart', label: 'Every dish marked against all fourteen allergens', met: chartRight && ALLERGENS.length === 14 && s.chartChecked },
        { id: 'guests', label: 'Each added guest has a dish written against their name', met: guestsDone },
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
  // Redesign: the sheet's wording is never keyword-graded. The evening team's structured questions
  // check that the critical information got across, and the learner confirms their read-back.
  // Legacy records keep the original ten-character test so a signed-off day is not re-judged.
  const handoverFilled = HANDOVER_FIELDS.every((f) => (s.handover[f.id] ?? '').trim().length >= (s.redesign ? 1 : 10));
  const delivered = s.redesign ? handoverDelivered(s) && s.handedOver : s.handedOver;
  const elenaAnswered = s.elenaAnswer !== null && ELENA_QUESTION.options.some((o) => o.id === s.elenaAnswer && o.correct);
  const checklist: ChecklistItem[] = [
    { id: 'waste', label: 'A weight against each of the three rows on the waste sheet', met: weights },
    { id: 'handover', label: 'Handover sheet filled in and handed over to the evening team', met: handoverFilled && delivered },
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
      return tasks[id].contextRevealed;
    }
    case 'chill-the-event-batch':
      return tasks[id].readings[90] !== undefined;
    case 'check-the-dietary-list': {
      const r = tasks[id].redesign;
      // The nut-dessert complication surfaces once the learner has taken a position on
      // Priya's dessert, or asked Terence about it (D09); never before the chart review.
      return r ? !!r.decisions['priya:dessert']?.action || (r.hintLevels?.['priya:dessert'] ?? 0) > 0 : tasks[id].chartChecked;
    }
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
export const TEST_STORAGE_KEY = `${STORAGE_KEY}:designer-test`;
const TEST_MODE_ENABLED =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('testMode') === '1';

export function isTestMode(): boolean {
  return TEST_MODE_ENABLED;
}

export function loadProgress(testMode = isTestMode()): Progress {
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
      const merged = mergeTaskState(base.tasks[id], isRecord(stored) ? stored : {});
      // An already signed legacy record must not acquire assessment requirements retroactively.
      // A legacy cooling cycle already in progress also cannot be re-portioned mid-cycle.
      const completedLegacy = Array.isArray(parsed.completed) && parsed.completed.includes(id);
      const runningLegacyChill = id === 'chill-the-event-batch' && isRecord(stored)
        && isRecord(stored.readings) && Object.keys(stored.readings).length > 0;
      if (isRecord(stored) && !stored.redesign && (completedLegacy || runningLegacyChill)) {
        delete (merged as { redesign?: unknown }).redesign;
      }
      tasks[id] = merged;
    }
    const completed = Array.isArray(parsed.completed)
      ? (TASK_ORDER.filter((id) => (parsed.completed as unknown[]).includes(id)) as TaskId[])
      : [];
    const delivery = tasks['check-the-delivery-in'] as DeliveryState;
    // Legacy completed records remain exactly as signed off. An incomplete legacy
    // record may retain its written signature, but an old boolean cannot sign off
    // newly-required blank decisions.
    if (!completed.includes('check-the-delivery-in') && delivery.signed && deliveryReviewIssues(delivery, false).length > 0) {
      delivery.signed = false;
    }
    // Progress saved before Terence pre-filled his rows holds an empty array for each of
    // them. An untouched empty row takes his marks; a row the learner had already marked
    // keeps their work, and a completed record stays exactly as it was signed off.
    const dietary = tasks['check-the-dietary-list'] as DietaryState;
    if (!completed.includes('check-the-dietary-list')) {
      for (const row of TERENCE_CHART_ROWS) {
        if ((dietary.chart[row] ?? []).length === 0) dietary.chart[row] = [...TERENCE_CHART_MARKS[row]];
      }
    }
    return {
      ...base,
      studentName: typeof parsed.studentName === 'string' ? parsed.studentName : '',
      initials: typeof parsed.initials === 'string' ? parsed.initials : '',
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
      completed,
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
      positions: loadPositions(parsed.positions),
    };
  } catch {
    return initialProgress();
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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

export function saveProgress(p: Progress): void {
  if (typeof window === 'undefined') return;
  withStorage(() => {
    if (isTestMode()) window.sessionStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(p));
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  });
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  withStorage(() => {
    if (isTestMode()) window.sessionStorage.removeItem(TEST_STORAGE_KEY);
    else window.localStorage.removeItem(STORAGE_KEY);
  });
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

/**
 * Posts progress to the parent window. Harmless when the app is opened on its own. The host
 * records a `gate:complete` once per launch and never replies, so nothing here waits on one.
 * The payload names the day and its tasks only; the learner's name never leaves the browser.
 */
export function notifyHost(event: Omit<GateEvent, 'source' | 'format' | 'mechanic' | 'id' | 'completedTasks'>): void {
  if (typeof window === 'undefined' || window.parent === window || isTestMode()) return;
  const message: GateEvent = {
    source: 'springpod',
    format: mechanic.format,
    mechanic: mechanic.config.mechanic,
    id: mechanic.config.id,
    ...event,
    ...(event.event === 'gate:complete' ? { completedTasks: TASK_ORDER } : {}),
  };
  window.parent.postMessage(message, '*');
}
