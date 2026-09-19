import type { DietaryState, ChecklistItem, GuestAssignment } from '@/lib/simulation';
import type {
  DietaryRedesignState as BaseDietaryRedesignState,
  DietaryDecision as BaseDietaryDecision,
  DietaryCourse,
} from './redesign-types';
import { ADDED_GUESTS, ALLERGENS, DISHES, type AddedGuest, type AllergenId, type Dish, type Line } from '@/content/activities';
import { wrongChartRows } from '@/lib/simulation';
import {
  ALLERGEN_REFERENCE,
  CHART_HINTS,
  DIETARY_HINTS,
  DIETARY_REDESIGN_LINES,
  OUT_OF_SCOPE_ITEMS,
} from '@/content/scenes/dietary-redesign';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';

/**
 * Task 4, menu-first redesign. Deterministic rules only: the chart is checked against
 * the recipe cards, decisions against the chart, the board against the decisions.
 * Nothing in here can mark a dish "safe" or clear a preparation check; that stays
 * with Terence, outside the exercise (decision register D06/D07).
 */

export type DietaryDecision = BaseDietaryDecision;
export type DietaryRedesignState = BaseDietaryRedesignState;
export type { DietaryCourse };

export const COURSES: DietaryCourse[] = ['main', 'dessert'];
/** The standard plate is the starting plan for every added guest (D02). */
export const PLANNED_DISH: Record<DietaryCourse, string> = { main: 'beef', dessert: 'frangipane' };
/** Evidence id for the frangipane card note. Kept verbatim: saved drafts and fixtures use it. */
export const FRANGIPANE_NOTE_EVIDENCE = 'Almonds are mixed through the prepared tart';
export const REQUIREMENT_EVIDENCE = 'requirement';
export const MAX_HINT_TIER = 4;

export function rowEvidenceId(dishId: string): string {
  return `row:${dishId}`;
}

export function decisionKey(guestId: string, course: DietaryCourse): string {
  return `${guestId}:${course}`;
}

export function emptyDietaryRedesign(): DietaryRedesignState {
  return { version: 1, decisions: {}, serviceHoldAcknowledged: false, rowReviewConfirmed: {}, openQuestions: {}, hintLevels: {}, board: {}, courseReviewed: {} };
}

export function emptyDecision(): DietaryDecision {
  return { action: null, reason: '', evidence: [], category: null, proposedDishId: null };
}

/** The dishes a course can be served from tonight: the planned dish and its alternative on the cards. */
export function courseOptions(course: DietaryCourse): Dish[] {
  const ids = course === 'main' ? ['beef', 'wellington'] : ['frangipane', 'pear'];
  return ids.map((id) => DISHES.find((dish) => dish.id === id)!);
}

export function dishById(id: string | null | undefined): Dish | undefined {
  return id ? DISHES.find((dish) => dish.id === id) : undefined;
}

export function allergenLabel(id: string): string {
  return ALLERGENS.find((allergen) => allergen.id === id)?.label ?? id;
}

// ---------------------------------------------------------------------------
// Chart: row status and graduated hints
// ---------------------------------------------------------------------------

export type RowStatus = 'not-started' | 'in-progress' | 'reviewed' | 'reviewed-question' | 'flagged';

export function rowStatus(state: { chart: Record<string, string[]>; flaggedDishes: string[]; redesign?: DietaryRedesignState }, dishId: string): RowStatus {
  if (state.flaggedDishes.includes(dishId)) return 'flagged';
  const r = state.redesign;
  if (r?.rowReviewConfirmed?.[dishId]) {
    return r.openQuestions?.[dishId]?.trim() ? 'reviewed-question' : 'reviewed';
  }
  return (state.chart[dishId]?.length ?? 0) > 0 ? 'in-progress' : 'not-started';
}

export function rowsReviewed(r: DietaryRedesignState | undefined): boolean {
  return !!r && DISHES.every((dish) => r.rowReviewConfirmed?.[dish.id] === true);
}

export function chartRowDiff(dishId: string, ticked: string[]): { missing: AllergenId[]; extra: string[] } {
  const dish = dishById(dishId);
  if (!dish) return { missing: [], extra: [] };
  return {
    missing: dish.allergens.filter((allergen) => !ticked.includes(allergen)),
    extra: ticked.filter((allergen) => !(dish.allergens as string[]).includes(allergen)),
  };
}

/** The recipe-card line that puts a dish in an allergen column, found through the general reference. */
export function ingredientFor(dish: Dish, allergen: AllergenId): string | undefined {
  const terms = ALLERGEN_REFERENCE.find((entry) => entry.id === allergen)?.terms ?? [];
  return dish.ingredients.find((ingredient) => {
    const text = ingredient.toLowerCase();
    return terms.some((term) => text.includes(term));
  });
}

export function hintTier(r: DietaryRedesignState | undefined, topic: string): number {
  return Math.min(MAX_HINT_TIER, Math.max(0, r?.hintLevels?.[topic] ?? 0));
}

/**
 * A pointer for one wrong row, at the tier the learner has reached: source, then the
 * component, then the mapping, then the explicit comparison. Null when the row is right.
 */
export function chartHint(dishId: string, ticked: string[], tier: number): string | null {
  const dish = dishById(dishId);
  if (!dish) return null;
  const { missing, extra } = chartRowDiff(dishId, ticked);
  if (missing.length === 0 && extra.length === 0) return null;
  const level = Math.min(MAX_HINT_TIER, Math.max(1, tier));
  if (level === 1) return CHART_HINTS.source(dish.short);
  if (missing.length > 0) {
    const allergen = missing[0];
    const ingredient = ingredientFor(dish, allergen) ?? dish.ingredients[0];
    if (level === 2) return CHART_HINTS.missingComponent(dish.short, ingredient);
    if (level === 3) return CHART_HINTS.missingMapping(ingredient, allergenLabel(allergen));
    return CHART_HINTS.missingExplicit(dish.short, allergenLabel(allergen));
  }
  const allergen = extra[0];
  if (level === 2) return CHART_HINTS.extraComponent(dish.short, allergenLabel(allergen));
  if (level === 3) return CHART_HINTS.extraMapping(dish.short, allergenLabel(allergen));
  return CHART_HINTS.extraExplicit(dish.short, allergenLabel(allergen));
}

// ---------------------------------------------------------------------------
// Guest decisions: evidence, validity, feedback
// ---------------------------------------------------------------------------

export interface EvidenceOption {
  id: string;
  label: string;
  group: 'sheet' | 'chart' | 'card';
  dishId?: string;
  /** Every card the line appears on; an ingredient shared by both dishes is one piece of evidence. */
  dishIds?: string[];
}

/**
 * What a learner may cite for one course: the sheet line, their own chart rows, and
 * the recipe-card lines for the planned dish and any proposed replacement.
 */
export function evidenceOptions(
  guest: AddedGuest,
  course: DietaryCourse,
  proposedDishId: string | null | undefined,
  chart: Record<string, string[]> = {},
): EvidenceOption[] {
  const options: EvidenceOption[] = [
    { id: REQUIREMENT_EVIDENCE, label: `Function sheet: ${guest.requirement}`, group: 'sheet' },
  ];
  const dishIds = [PLANNED_DISH[course]];
  if (proposedDishId && proposedDishId !== PLANNED_DISH[course] && courseOptions(course).some((dish) => dish.id === proposedDishId)) {
    dishIds.push(proposedDishId);
  }
  for (const dishId of dishIds) {
    const dish = dishById(dishId)!;
    const marks = (chart[dishId] ?? []).map((mark) => allergenLabel(mark));
    options.push({
      id: rowEvidenceId(dishId),
      label: `${DIETARY_UI.guests.chartRow(dish.short)}: ${marks.length ? marks.join(', ') : DIETARY_UI.guests.noMarks}`,
      group: 'chart',
      dishId,
    });
  }
  const cardLines = new Map<string, EvidenceOption>();
  for (const dishId of dishIds) {
    const dish = dishById(dishId)!;
    for (const ingredient of dish.ingredients) {
      const existing = cardLines.get(ingredient);
      if (existing) {
        existing.dishIds = [...(existing.dishIds ?? []), dishId];
      } else {
        cardLines.set(ingredient, { id: ingredient, label: ingredient, group: 'card', dishId, dishIds: [dishId] });
      }
    }
    if (dishId === 'frangipane') {
      cardLines.set(FRANGIPANE_NOTE_EVIDENCE, { id: FRANGIPANE_NOTE_EVIDENCE, label: `Card note: ${dish.note}`, group: 'card', dishId, dishIds: [dishId] });
    }
  }
  return [...options, ...cardLines.values()];
}

function hasNutEvidence(dec: DietaryDecision): { almonds: boolean; pistachios: boolean; note: boolean } {
  const evidence = dec.evidence ?? [];
  return {
    almonds: evidence.includes('Ground almonds'),
    pistachios: evidence.includes('Pistachios'),
    note: evidence.includes(FRANGIPANE_NOTE_EVIDENCE),
  };
}

function isComplete(dec: DietaryDecision | undefined): dec is DietaryDecision {
  if (!dec || !dec.action || !dec.category || !dec.reason || dec.reason.trim() === '') return false;
  if (!dec.evidence || dec.evidence.length === 0) return false;
  if ((dec.action === 'swap' || dec.action === 'ask') && dec.action === 'swap' && !dec.proposedDishId) return false;
  return true;
}

export function isValidDecision(
  guestId: string,
  course: DietaryCourse,
  dec: DietaryDecision | undefined,
  assigned: GuestAssignment,
  chart: Record<string, string[]> = {},
): boolean {
  const guest = ADDED_GUESTS.find((g) => g.id === guestId);
  if (!guest || !isComplete(dec)) return false;

  const planned = PLANNED_DISH[course];
  const proposed = dec.proposedDishId || planned;
  if (!courseOptions(course).some((dish) => dish.id === proposed)) return false;
  const supported = new Set(evidenceOptions(guest, course, proposed, chart).map((option) => option.id));
  // Stale evidence strings from an older draft are ignored rather than failing the decision silently.
  if (!dec.evidence.some((item) => supported.has(item))) return false;

  // The decision and the saved assignment (used by later tasks) must agree.
  if (assigned[course] !== proposed) return false;
  if (dec.action === 'keep' && proposed !== planned) return false;
  if (dec.action === 'swap' && proposed === planned) return false;

  if (guestId === 'priya' && course === 'dessert') {
    if (!['swap', 'ask'].includes(dec.action!) || proposed !== 'pear') return false;
    if (dec.category !== 'ingredient-conflict' && !(dec.action === 'ask' && dec.category === 'information-missing')) return false;
    const nuts = hasNutEvidence(dec);
    // Both nuts and the note: removing the visible garnish is never the answer.
    if (!nuts.almonds || !nuts.pistachios || !nuts.note) return false;
  } else if (guestId === 'tom' && course === 'main') {
    if (!['swap', 'ask'].includes(dec.action!) || proposed !== 'wellington') return false;
    if (dec.category !== 'vegetarian-conflict' && !(dec.action === 'ask' && dec.category === 'information-missing')) return false;
    if (!dec.evidence.some((item) => item.toLowerCase().includes('beef'))) return false;
  } else if (dec.category !== 'no-conflict' && dec.category !== 'information-missing') {
    // Anna's courses, Tom's dessert and Priya's main have no conflict on the cards.
    return false;
  }
  return true;
}

/**
 * A course counts only once Terence has been asked and has accepted it, and nothing about
 * it has changed since. A complete form that was never checked is not a checked course.
 */
export function courseChecked(
  redesign: DietaryRedesignState,
  guestId: string,
  course: DietaryCourse,
  assigned: GuestAssignment,
  chart: Record<string, string[]> = {},
): boolean {
  const key = decisionKey(guestId, course);
  return !!redesign.courseReviewed?.[key] && isValidDecision(guestId, course, redesign.decisions[key], assigned, chart);
}

export function dietaryDecisionsReady(
  redesign: DietaryRedesignState,
  guests: Record<string, GuestAssignment>,
  chart: Record<string, string[]> = {},
): boolean {
  return ADDED_GUESTS.every((guest) => {
    const assigned = guests[guest.id] || { main: null, dessert: null };
    return COURSES.every((course) => courseChecked(redesign, guest.id, course, assigned, chart));
  });
}

// ---------------------------------------------------------------------------
// State transitions shared by the page and the tests. Each one is pure.
// ---------------------------------------------------------------------------

/** Ticks or unticks one allergen on one row; the row is unreviewed again and any decision that cited the dish reopens. */
export function applyChartToggle(prev: DietaryState, dishId: string, allergenId: string): DietaryState {
  const current = prev.chart[dishId] ?? [];
  const next = current.includes(allergenId as never)
    ? current.filter((entry) => entry !== allergenId)
    : [...current, allergenId as (typeof current)[number]];
  const r = prev.redesign ?? emptyDietaryRedesign();
  const courseReviewed = { ...(r.courseReviewed ?? {}) };
  const decisions = Object.fromEntries(
    Object.entries(r.decisions).map(([key, decision]) => {
      const planned = key.endsWith(':main') ? PLANNED_DISH.main : PLANNED_DISH.dessert;
      const touched = planned === dishId || decision.proposedDishId === dishId;
      if (touched) courseReviewed[key] = false;
      return [key, touched ? { ...decision, action: null } : decision];
    }),
  );
  return {
    ...prev,
    chart: { ...prev.chart, [dishId]: next },
    chartChecked: false,
    flaggedDishes: prev.flaggedDishes.filter((entry) => entry !== dishId),
    boardPosted: false,
    redesign: {
      ...r,
      decisions,
      courseReviewed,
      rowReviewConfirmed: { ...r.rowReviewConfirmed, [dishId]: false },
      serviceHoldAcknowledged: false,
    },
  };
}

/** Edits one course's decision. The saved assignment follows it and the course needs checking again. */
export function applyDietaryDecision(prev: DietaryState, guestId: string, course: DietaryCourse, patch: Partial<DietaryDecision>): DietaryState {
  const key = decisionKey(guestId, course);
  const r = prev.redesign ?? emptyDietaryRedesign();
  const planned = PLANNED_DISH[course];
  const next: DietaryDecision = { ...(r.decisions[key] ?? emptyDecision()), ...patch };
  if (next.action === 'keep') next.proposedDishId = planned;
  if (next.action === 'swap' && next.proposedDishId === planned) next.proposedDishId = null;
  // The saved assignment (read by later tasks) always follows the decision.
  const assignedDish = next.proposedDishId ?? (next.action === 'ask' ? planned : null);
  const current: GuestAssignment = prev.guests[guestId] ?? { main: null, dessert: null };
  return {
    ...prev,
    boardPosted: false,
    guests: { ...prev.guests, [guestId]: { ...current, [course]: assignedDish } as GuestAssignment },
    redesign: {
      ...r,
      decisions: { ...r.decisions, [key]: next },
      courseReviewed: { ...(r.courseReviewed ?? {}), [key]: false },
      serviceHoldAcknowledged: false,
    },
  };
}

/** Records the outcome of "Check this with Terence" for one course, with the hint tier reached. */
export function recordCourseReview(prev: DietaryState, guestId: string, course: DietaryCourse, passed: boolean, tier: number): DietaryState {
  const key = decisionKey(guestId, course);
  const r = prev.redesign ?? emptyDietaryRedesign();
  return {
    ...prev,
    redesign: {
      ...r,
      courseReviewed: { ...(r.courseReviewed ?? {}), [key]: passed },
      hintLevels: { ...(r.hintLevels ?? {}), [key]: tier },
    },
  };
}

export type DecisionFeedbackKind = 'incomplete' | 'hint' | 'no-conflict-there' | 'stands' | 'unnecessary-change';

export interface DecisionFeedback {
  kind: DecisionFeedbackKind;
  line: Line;
  /** Which hint ladder was used, for tests and for resuming at the same tier. */
  ladder?: string;
  tier?: number;
}

/**
 * Terence's response to "Check this with Terence" for one course. Wrong turns get the
 * next tier of the relevant ladder (the learner's `hintLevels` for the decision key has
 * already been advanced by the caller). Valid decisions get a response that never
 * confirms a dish as safe.
 */
export function decisionFeedback(
  guestId: string,
  course: DietaryCourse,
  dec: DietaryDecision | undefined,
  assigned: GuestAssignment,
  chart: Record<string, string[]>,
  tier: number,
): DecisionFeedback {
  if (!isComplete(dec)) return { kind: 'incomplete', line: DIETARY_REDESIGN_LINES.terenceIncomplete };
  if (isValidDecision(guestId, course, dec, assigned, chart)) {
    if (dec.action === 'ask') {
      return { kind: 'stands', line: guestId === 'priya' && course === 'dessert' ? DIETARY_REDESIGN_LINES.terencePriyaAsk : DIETARY_REDESIGN_LINES.terenceAskElsewhere };
    }
    if (dec.action === 'swap' && dec.category === 'no-conflict') {
      return { kind: 'unnecessary-change', line: DIETARY_REDESIGN_LINES.terenceUnnecessaryChange };
    }
    return { kind: 'stands', line: dec.action === 'keep' ? DIETARY_REDESIGN_LINES.terenceKeepStands : DIETARY_REDESIGN_LINES.terenceDecisionStands };
  }

  const planned = PLANNED_DISH[course];
  const proposed = dec.proposedDishId || planned;
  const ladderFor = (): string | null => {
    if (guestId === 'priya' && course === 'dessert') {
      const nuts = hasNutEvidence(dec);
      const flagged = dec.category === 'ingredient-conflict' || dec.category === 'information-missing';
      if (!flagged || dec.action === 'keep' || proposed === 'frangipane') return 'priya:dessert:conflict';
      if (proposed !== 'pear') return 'priya:dessert:alternative';
      if (nuts.pistachios && !(nuts.almonds && nuts.note)) return 'priya:dessert:garnish';
      return 'priya:dessert:conflict';
    }
    if (guestId === 'tom' && course === 'main') {
      const flagged = dec.category === 'vegetarian-conflict' || dec.category === 'information-missing';
      if (!flagged || dec.action === 'keep' || proposed === 'beef') return 'tom:main:conflict';
      if (proposed !== 'wellington') return 'tom:main:alternative';
      return 'tom:main:conflict';
    }
    return null;
  };
  const ladder = ladderFor();
  if (!ladder) {
    // A conflict was flagged where the cards show none.
    return { kind: 'no-conflict-there', line: DIETARY_REDESIGN_LINES.terenceNoConflictThere };
  }
  const lines = DIETARY_HINTS[ladder];
  const level = Math.min(lines.length, Math.max(1, tier));
  return { kind: 'hint', line: lines[level - 1], ladder, tier: level };
}

// ---------------------------------------------------------------------------
// Board and the record handed on
// ---------------------------------------------------------------------------

export interface DietaryChange {
  key: string;
  guestId: string;
  guestName: string;
  table: number;
  course: DietaryCourse;
  originalDishId: string;
  replacementDishId: string;
  action: 'swap' | 'ask';
  category: DietaryDecision['category'];
  decisionReason: string;
  boardReason: string;
  /** Allergy-driven changes carry a pending preparation check that this exercise never clears (D06). */
  preparationStatus: 'pending' | null;
}

/** Every actual change to a plate: a proposed dish that differs from the planned one. */
export function dietaryChanges(state: Pick<DietaryState, 'redesign'>): DietaryChange[] {
  const r = state.redesign;
  if (!r) return [];
  const changes: DietaryChange[] = [];
  for (const guest of ADDED_GUESTS) {
    for (const course of COURSES) {
      const key = decisionKey(guest.id, course);
      const dec = r.decisions[key];
      if (!dec || (dec.action !== 'swap' && dec.action !== 'ask')) continue;
      if (!dec.proposedDishId || dec.proposedDishId === PLANNED_DISH[course]) continue;
      changes.push({
        key,
        guestId: guest.id,
        guestName: guest.name,
        table: guest.table,
        course,
        originalDishId: PLANNED_DISH[course],
        replacementDishId: dec.proposedDishId,
        action: dec.action,
        category: dec.category,
        decisionReason: dec.reason,
        boardReason: r.board?.[key]?.reason ?? '',
        preparationStatus: guest.mustAvoid.length > 0 ? 'pending' : null,
      });
    }
  }
  return changes;
}

/** Presence only: every change carries a board reason. Wording is never graded. */
export function boardComplete(state: Pick<DietaryState, 'redesign'>): boolean {
  const changes = dietaryChanges(state);
  return changes.length > 0 && changes.every((change) => change.boardReason.trim().length > 0);
}

export function openItemsForTerence(state: Pick<DietaryState, 'redesign'>): string[] {
  const r = state.redesign;
  const items = [`${OUT_OF_SCOPE_ITEMS.tomStarter.title}: ${OUT_OF_SCOPE_ITEMS.tomStarter.detail}`];
  for (const dish of DISHES) {
    const question = r?.openQuestions?.[dish.id]?.trim();
    if (question) items.push(`${DIETARY_UI.board.openQuestionPrefix} ${dish.short}: ${question}`);
  }
  return items;
}

/** The board as the evening team read it. Stored in `boardNote` when posted, for the close-of-day record. */
export function renderBoardNote(state: Pick<DietaryState, 'redesign'>): string {
  const lines = dietaryChanges(state).map((change) => {
    const original = dishById(change.originalDishId)!;
    const replacement = dishById(change.replacementDishId)!;
    const course = change.course === 'main' ? 'Main' : 'Dessert';
    const parts = [
      `Table ${change.table} · ${change.guestName} · ${course}: ${original.name} → ${replacement.name}`,
      `Reason: ${change.boardReason.trim()}`,
    ];
    if (change.preparationStatus === 'pending') parts.push(DIETARY_UI.board.prepPending);
    return parts.join(' · ');
  });
  return [...lines, ...openItemsForTerence(state).map((item) => `Open for Terence: ${item}`)].join('\n');
}

/**
 * The record interface for the separate handover redesign (D12). Task 5 is not changed
 * here; it can read this instead of parsing `boardNote`.
 */
export interface DietaryHandoverRecord {
  posted: boolean;
  changes: {
    guest: string;
    table: number;
    course: DietaryCourse;
    original: string;
    replacement: string;
    reason: string;
    preparationStatus: 'pending' | null;
  }[];
  openItems: string[];
}

export function dietaryHandoverRecord(state: Pick<DietaryState, 'redesign' | 'boardPosted'>): DietaryHandoverRecord {
  return {
    posted: state.boardPosted,
    changes: dietaryChanges(state).map((change) => ({
      guest: change.guestName,
      table: change.table,
      course: change.course,
      original: dishById(change.originalDishId)!.name,
      replacement: dishById(change.replacementDishId)!.name,
      reason: change.boardReason,
      preparationStatus: change.preparationStatus,
    })),
    openItems: openItemsForTerence(state),
  };
}

// ---------------------------------------------------------------------------
// Done-when clauses and stage
// ---------------------------------------------------------------------------

export function chartReviewed(state: DietaryState): boolean {
  return wrongChartRows(state.chart).length === 0 && rowsReviewed(state.redesign) && state.chartChecked;
}

/** One tick per clause of the signed-off done-when, in narrower language (D11). */
export function dietaryRedesignChecklist(state: DietaryState): ChecklistItem[] {
  const r = state.redesign;
  if (!r) return [];
  const decided = dietaryDecisionsReady(r, state.guests, state.chart);
  return [
    { id: 'chart', label: 'Chart matches the recipe cards; all five rows reviewed', met: chartReviewed(state) },
    { id: 'guests', label: 'A main and a dessert decided for each added guest, with evidence and a reason', met: decided },
    {
      id: 'board',
      label: 'Every change on the board with guest, table, original, replacement and reason; preparation check pending',
      met: state.boardPosted && decided && boardComplete(state) && r.serviceHoldAcknowledged,
    },
  ];
}

export type DietaryStage = 'sheet' | 'chart' | 'guests' | 'board' | 'done';

export function getDietaryRedesignStage(state: DietaryState): DietaryStage {
  const r = state.redesign;
  if (!r) return 'sheet';
  if (!chartReviewed(state)) return r.sheetRead ? 'chart' : 'sheet';
  if (!dietaryDecisionsReady(r, state.guests, state.chart)) return 'guests';
  if (state.boardPosted && boardComplete(state) && r.serviceHoldAcknowledged) return 'done';
  return 'board';
}
