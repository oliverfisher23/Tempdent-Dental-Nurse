import { Line } from "@/content/activities";
import { DISHES } from "@/content/activities";

export const DIETARY_REDESIGN_LINES = {
  yvieIntro: {
    speaker: 'Yvie',
    text: "Check what's in each dish. Your chart will help us decide which dishes need changing for tonight's guests. Then explain the changes to the evening team.",
  } as Line,
  terenceReviewPrompt: {
    speaker: 'Terence',
    text: "Review every row against the recipe cards before you promise Yvie anything.",
  } as Line,
  terenceChartCorrect: {
    speaker: 'Terence',
    text: "Chart's clean. Matches the supplied ingredients. Now let's look at the three added guests.",
  } as Line,
  terenceChartIncorrect: {
    speaker: 'Terence',
    text: "Not yet. Go back to the recipe cards for the dishes I've marked; something's ticked that shouldn't be, or missed that should be there.",
  } as Line,
  terencePriyaFrangipane: {
    speaker: 'Terence',
    text: "Stop. This choice conflicts with Priya's allergy. Check the tart's ingredients and your chart.",
  } as Line,
  terenceTomBeef: {
    speaker: 'Terence',
    text: "Stop. Compare the main's ingredients with Tom's vegetarian request.",
  } as Line,
  terencePearSafeWait: {
    speaker: 'Terence',
    text: "The recipe isn't a preparation check. Ask me before approving service.",
  } as Line,
  yvieDone: {
    speaker: 'Yvie',
    text: "Table three, pear, flagged on the plan. That's what I needed.",
  } as Line,
  terenceDone: {
    speaker: 'Terence',
    text: "On the board, big letters. The evening team read that board before they read anything else.",
  } as Line
};

export const DECISION_CATEGORIES = [
  { id: 'ingredient-conflict', label: 'Ingredient conflict identified' },
  { id: 'vegetarian-conflict', label: 'Vegetarian conflict identified' },
  { id: 'no-conflict', label: 'No conflict identified in this course' },
  { id: 'information-missing', label: 'Information missing or preparation unconfirmed' },
] as const;

export const PREPARATION_CHECKS = {
  pear: "Twelve portions are listed in the pastry fridge. The ice cream contains milk. Supplier, preparation and service information has not been supplied; hold the proposal for Terence’s check.",
};

// Generates a list of evidence strings based on dish ingredients + requirements
export function getEvidenceOptions(plannedDishId: string, proposedDishId?: string | null): string[] {
  const options = new Set<string>();
  
  const addIngredients = (dishId: string) => {
    const dish = DISHES.find(d => d.id === dishId);
    if (dish) {
      dish.ingredients.forEach(i => options.add(i));
    }
    if (dishId === 'frangipane') {
      options.add('Almonds are mixed through the prepared tart');
    }
  };

  addIngredients(plannedDishId);
  if (proposedDishId && proposedDishId !== plannedDishId) {
    addIngredients(proposedDishId);
  }

  options.add('Guest Requirement');
  options.add('Preparation Unconfirmed');
  
  return Array.from(options);
}
