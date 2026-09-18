import type { DietaryState, ChecklistItem, GuestAssignment } from "@/lib/simulation";
import type { DietaryRedesignState as BaseDietaryRedesignState, DietaryDecision as BaseDietaryDecision } from "./redesign-types";
import { ADDED_GUESTS, DISHES } from "@/content/activities";
import { wrongChartRows } from "@/lib/simulation";

export interface DietaryDecision extends BaseDietaryDecision {
  proposedDishId?: string | null;
}

export interface DietaryRedesignState extends Omit<BaseDietaryRedesignState, 'decisions'> {
  decisions: Record<string, DietaryDecision>;
  rowReviewConfirmed: Record<string, boolean>;
  openQuestions: Record<string, string>;
}

function isValidDecision(guestId: string, course: 'main' | 'dessert', dec: DietaryDecision | undefined, assigned: { main: string | null; dessert: string | null }): boolean {
  if (!dec || !dec.action || !dec.category || !dec.reason || dec.reason.trim() === '') return false;
  if (!dec.evidence || dec.evidence.length === 0) return false;

  const planned = course === 'main' ? 'beef' : 'frangipane';
  const proposed = dec.proposedDishId || planned;
  const plannedRecipe = DISHES.find(dish => dish.id === planned)!;
  const proposedRecipe = DISHES.find(dish => dish.id === proposed);
  if (!proposedRecipe) return false;
  const supportedEvidence = new Set([
    ...plannedRecipe.ingredients, ...proposedRecipe.ingredients,
    ...(planned === 'frangipane' ? ['Almonds are mixed through the prepared tart'] : []),
  ]);
  if (!dec.evidence.every(evidence => supportedEvidence.has(evidence))) return false;
  
  // Ensure the redesign decision matches the legacy guest assignment state
  if (assigned[course] !== proposed) return false;

  if (dec.action === 'keep' && proposed !== planned) return false;
  if (dec.action === 'swap' && proposed === planned) return false;

  if (guestId === 'priya' && course === 'dessert') {
    if (!['swap', 'ask'].includes(dec.action) || proposed !== 'pear') return false;
    if (dec.category !== 'ingredient-conflict' && !(dec.action === 'ask' && dec.category === 'information-missing')) return false;
    if (!dec.evidence.includes('Ground almonds') || 
        !dec.evidence.includes('Pistachios') || 
        !dec.evidence.includes('Almonds are mixed through the prepared tart')) return false;
  } else if (guestId === 'tom' && course === 'main') {
    if (!['swap', 'ask'].includes(dec.action) || proposed !== 'wellington') return false;
    if (dec.category !== 'vegetarian-conflict' && !(dec.action === 'ask' && dec.category === 'information-missing')) return false;
    if (!dec.evidence.some(e => e.toLowerCase().includes('beef'))) return false;
  } else {
    // Anna both, Tom dessert, Priya main
    // Compatible alternatives are not wrong merely because a change was unnecessary.
    if (dec.category !== 'no-conflict' && dec.category !== 'information-missing') return false;
  }

  return true;
}

export function dietaryDecisionsReady(redesign: DietaryRedesignState, guests: Record<string, { main: string | null; dessert: string | null }>): boolean {
  return ADDED_GUESTS.every(guest => {
    const assigned = guests[guest.id] || { main: null, dessert: null };
    return isValidDecision(guest.id, 'main', redesign.decisions[`${guest.id}:main`], assigned)
      && isValidDecision(guest.id, 'dessert', redesign.decisions[`${guest.id}:dessert`], assigned);
  });
}

export function dietaryRedesignChecklist(state: DietaryState): ChecklistItem[] {
  const r = state.redesign as DietaryRedesignState | undefined;
  if (!r) return [];

  const allRowsReviewed = DISHES.every(d => r.rowReviewConfirmed?.[d.id]);
  
  const mainsAndDessertsDecided = dietaryDecisionsReady(r, state.guests);

  const priyaDec = r.decisions['priya:dessert'];
  const priyaPear = !!priyaDec?.action && ['swap', 'ask'].includes(priyaDec.action) && 
                    priyaDec?.proposedDishId === 'pear' &&
                    priyaDec?.evidence?.includes('Ground almonds') &&
                    priyaDec?.evidence?.includes('Pistachios') &&
                    priyaDec?.evidence?.includes('Almonds are mixed through the prepared tart'); 

  return [
    { 
      id: 'row-reviews', 
      label: 'All five rows explicitly reviewed against supplied evidence', 
      met: allRowsReviewed 
    },
    { 
      id: 'course-reasoning', 
      label: 'Every guest course has a valid decision, category, reason, and selected evidence', 
      met: mainsAndDessertsDecided 
    },
    { 
      id: 'priya-evidence', 
      label: 'Priya’s dessert changed to pear with almond mixture and pistachio evidence noted', 
      met: !!priyaPear 
    },
    { 
      id: 'service-hold', 
      label: 'Service hold acknowledged for unresolved preparation checks', 
      met: !!r.serviceHoldAcknowledged 
    }
  ];
}

export function getDietaryRedesignStage(state: DietaryState): 'chart' | 'guests' | 'board' | 'done' {
  const r = state.redesign as DietaryRedesignState | undefined;
  if (!r) return 'chart';
  
  const chartRight = wrongChartRows(state.chart).length === 0;
  const allRowsReviewed = DISHES.every(d => r.rowReviewConfirmed?.[d.id]);
  
  if (!chartRight || !allRowsReviewed || !state.chartChecked) return 'chart';

  const cl = dietaryRedesignChecklist(state);
  const reasoningMet = cl.find(c => c.id === 'course-reasoning')?.met;
  const priyaEvidenceMet = cl.find(c => c.id === 'priya-evidence')?.met;

  if (!reasoningMet || !priyaEvidenceMet) return 'guests';
  
  if (state.boardPosted && r.serviceHoldAcknowledged) return 'done';
  
  return 'board';
}
