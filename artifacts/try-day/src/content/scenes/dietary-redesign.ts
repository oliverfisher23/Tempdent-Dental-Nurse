import type { AllergenId, Line } from '@/content/activities';
import { DIETARY_LINES } from '@/content/activities';

/**
 * Task 4 (menu-first redesign) copy: dialogue, graduated hints, categories and the
 * allergen reference. The employer decision register (docs/dietary-learning-redesign.md,
 * section 9) governs what may be said here: no wording ever confirms a dish as safe or
 * cleared to serve, and the answer-giving lines only appear as the last hint tier.
 */

export const DIETARY_REDESIGN_LINES = {
  yvieIntro: {
    speaker: 'Yvie',
    text: "Check what's in each dish. Your chart will help us decide which dishes need changing for tonight's guests. Then explain the changes to the evening team.",
  } as Line,
  yvieSheet: {
    speaker: 'Yvie',
    text: "That's the sheet. The two additions are on tables three and six; you'll get their details once Terence has been through your chart.",
  } as Line,
  terenceReviewPrompt: {
    speaker: 'Terence',
    text: 'Go through every row against the recipe cards before you promise Yvie anything.',
  } as Line,
  terenceChartCorrect: {
    speaker: 'Terence',
    text: "Chart's clean, it matches the cards. Now let's look at the two late additions.",
  } as Line,
  terenceChartIncorrect: {
    speaker: 'Terence',
    text: "Not yet. Go back to the recipe cards for the dishes I've marked; something's ticked that shouldn't be, or missed that should be there.",
  } as Line,
  terencePrefilledChartIncorrect: {
    speaker: 'Terence',
    text: "That one's mine, I left a mark out. Check my row against the card and put it right.",
  } as Line,
  terenceRowsUnreviewed: {
    speaker: 'Terence',
    text: "I'll go through it when every row says you've reviewed it. Open questions are fine; unreviewed rows aren't.",
  } as Line,
  /** D07: the one approved response to asking about Priya's dessert. No assurance is given. */
  terencePriyaAsk: {
    speaker: 'Terence',
    text: "Good. Ask, don't assume. The recipe card tells you what's in the pear, not how it's been handled, and I'll check that myself before anything goes to table three. Put the change on the board and mark my check as pending.",
  } as Line,
  terenceAskElsewhere: {
    speaker: 'Terence',
    text: "Fair question. Write it down as your reason and carry on; I'll pick it up when we go through the board together.",
  } as Line,
  terenceIncomplete: {
    speaker: 'Terence',
    text: "Give me the whole thing: What the chart says, what you checked, what you've decided, and a line on why.",
  } as Line,
  terenceNoConflictThere: {
    speaker: 'Terence',
    text: "Show me the conflict. Which column on that row is this guest's problem? If there isn't one, say so: 'no conflict identified', and move on.",
  } as Line,
  terenceUnnecessaryChange: {
    speaker: 'Terence',
    text: "You've not found a conflict there. You can still change it, but the board needs a real reason; don't invent one.",
  } as Line,
  terencePearSafeWait: {
    speaker: 'Terence',
    text: "The recipe card isn't a preparation check. Ask me before you approve anything for service.",
  } as Line,
  terenceDecisionStands: {
    speaker: 'Terence',
    text: "That reasoning stands up. It goes on the board as a proposal; nothing's cleared until I've checked the preparation.",
  } as Line,
  terenceKeepStands: {
    speaker: 'Terence',
    text: "Agreed, nothing on that card conflicts with what's on the sheet. Keep it, and note what you checked.",
  } as Line,
  terenceBoardIncomplete: {
    speaker: 'Terence',
    text: 'Every change needs a reason the evening team can read at three. Fill in the gaps before it goes up.',
  } as Line,
  yvieDone: {
    speaker: 'Yvie',
    text: "Table three, pear, flagged on the plan. That's what I needed.",
  } as Line,
  terenceDone: DIETARY_LINES.marcusDone,
};

/**
 * Graduated hints (D11): source → component → mapping → explicit comparison. The
 * final tier is the existing, signed-off answer line. Retries are unlimited.
 */
export const DIETARY_HINTS: Record<string, Line[]> = {
  'priya:dessert:conflict': [
    { speaker: 'Terence', text: "Before you decide her dessert, read the frangipane card and your own chart row for it." },
    { speaker: 'Terence', text: 'Two ingredients on that card sit in the same column. Which column, and which two?' },
    { speaker: 'Terence', text: 'Ground almonds and pistachios are both tree nuts, and the card note tells you where the almonds are.' },
    DIETARY_LINES.marcusOnNutDessert,
  ],
  'priya:dessert:garnish': [
    { speaker: 'Terence', text: 'Your evidence names the garnish. Is that the only nut in the tart?' },
    { speaker: 'Terence', text: 'Read the ingredient list from the top, then the note underneath it.' },
    { speaker: 'Terence', text: "Ground almonds are mixed through the whole tart. Taking the pistachios off the top changes nothing." },
    DIETARY_LINES.marcusOnNutDessert,
  ],
  'tom:main:conflict': [
    { speaker: 'Terence', text: "Read Tom's line on the function sheet again, then the beef card." },
    { speaker: 'Terence', text: "What's the first ingredient on the beef card, and what's the stock made from?" },
    { speaker: 'Terence', text: "Beef shin and beef stock. That main isn't vegetarian, whatever you leave off the plate." },
    DIETARY_LINES.marcusOnMeatForVegetarian,
  ],
  'tom:main:alternative': [
    { speaker: 'Terence', text: "You've spotted the conflict. Now look at the function sheet: which main is already going to the vegetarians on tables two and seven?" },
    { speaker: 'Terence', text: 'There is one vegetarian main on the menu. Check its card for meat before you propose it.' },
    { speaker: 'Terence', text: "The Wellington is mushroom, spinach, and ricotta. That's the vegetarian main on tonight's menu." },
    DIETARY_LINES.marcusOnMeatForVegetarian,
  ],
  'priya:dessert:alternative': [
    { speaker: 'Terence', text: "You've found the nuts. Now find a dessert on the menu whose card lists none." },
    { speaker: 'Terence', text: 'Compare the two dessert rows on your chart, column by column.' },
    { speaker: 'Terence', text: 'The pear row has milk marked and nothing under nuts or peanuts. That is what the recipe says; I still check how it was handled.' },
    DIETARY_LINES.marcusOnNutDessert,
  ],
};

/** Chart hints are built per row from the recipe card; these are the sentence frames. */
export const CHART_HINTS = {
  /** Tier 1: point at the source. */
  source: (dish: string) => `Not yet. Go back to the ${dish} card; something's ticked that shouldn't be, or missed that should be there.`,
  /** Tier 2: point at the component without naming the category. */
  missingComponent: (dish: string, ingredient: string) => `Look again at "${ingredient}" on the ${dish} card. Which column does that belong in?`,
  extraComponent: (dish: string, allergen: string) => `Which ingredient on the ${dish} card made you mark ${allergen}? Show me.`,
  /** Tier 3: the mapping. */
  missingMapping: (ingredient: string, allergen: string) => `"${ingredient}" counts as ${allergen}.`,
  extraMapping: (dish: string, allergen: string) => `Nothing on the ${dish} card is a source of ${allergen}.`,
  /** Tier 4: the explicit comparison. */
  missingExplicit: (dish: string, allergen: string) => `${allergen} is missing from the ${dish} row. Mark it.`,
  extraExplicit: (dish: string, allergen: string) => `Take ${allergen} off the ${dish} row.`,
};

export const DECISION_CATEGORIES: { id: 'ingredient-conflict' | 'vegetarian-conflict' | 'no-conflict' | 'information-missing'; label: string; hint: string }[] = [
  { id: 'ingredient-conflict', label: 'Conflict: An ingredient this guest must avoid', hint: 'Your chart row shows a category this guest cannot have.' },
  { id: 'vegetarian-conflict', label: 'Conflict: Not vegetarian', hint: 'The recipe card lists meat or fish.' },
  { id: 'no-conflict', label: 'No conflict identified in this course', hint: 'You have checked the row and the card against the request.' },
  { id: 'information-missing', label: 'Cannot tell: Information missing', hint: 'Something you need is not on the sheet or the card. Ask.' },
];

export const DECISION_ACTIONS: { id: 'keep' | 'swap' | 'ask'; label: string; hint: string }[] = [
  { id: 'keep', label: 'Keep', hint: 'Serve the planned dish.' },
  { id: 'swap', label: 'Swap', hint: 'Propose another dish from the menu.' },
  { id: 'ask', label: 'Ask', hint: 'Put a question to Terence before deciding.' },
];

/**
 * Simple reference, not an answer key: general mappings a learner can open.
 * `terms` are matched against recipe-card text to build chart hints.
 */
export const ALLERGEN_REFERENCE: { id: AllergenId; terms: string[]; plain: string }[] = [
  { id: 'celery', terms: ['celery', 'celeriac'], plain: 'Celery and celeriac, including the celery in a stock or braise base.' },
  { id: 'gluten', terms: ['wheat', 'flour', 'pastry', 'bread', 'barley', 'rye'], plain: 'Wheat, barley, rye, and oats, and anything made from them: Flour, pastry, bread, crumb.' },
  { id: 'crustaceans', terms: ['prawn', 'crab', 'lobster', 'langoustine', 'shrimp'], plain: 'Prawns, crab, lobster, langoustine, and shrimp.' },
  { id: 'eggs', terms: ['egg'], plain: 'Whole eggs, egg wash, and anything bound or glazed with egg.' },
  { id: 'fish', terms: ['haddock', 'fish', 'salmon', 'cod', 'anchov'], plain: 'All fish, smoked or fresh, and fish sauces or stocks.' },
  { id: 'lupin', terms: ['lupin'], plain: 'Lupin flour and seeds, sometimes used in bakery goods.' },
  { id: 'milk', terms: ['milk', 'butter', 'cream', 'ricotta', 'cheese', 'crème fraîche', 'ice cream', 'yoghurt'], plain: 'Milk, butter, cream, crème fraîche, ice cream, and all cheeses, including ricotta.' },
  { id: 'molluscs', terms: ['mussel', 'clam', 'oyster', 'squid', 'scallop'], plain: 'Mussels, clams, oysters, scallops, and squid.' },
  { id: 'mustard', terms: ['mustard'], plain: 'Mustard seeds, powder, paste, and leaves.' },
  { id: 'nuts', terms: ['almond', 'pistachio', 'hazelnut', 'walnut', 'cashew', 'pecan'], plain: 'Tree nuts: almonds, pistachios, hazelnuts, walnuts, cashews, pecans. A separate category from peanuts.' },
  { id: 'peanuts', terms: ['peanut', 'groundnut'], plain: 'Peanuts and groundnut oil. A separate category from tree nuts; one allergy does not imply the other.' },
  { id: 'sesame', terms: ['sesame', 'tahini'], plain: 'Sesame seeds, sesame oil, and tahini.' },
  { id: 'soya', terms: ['soy', 'tofu', 'edamame'], plain: 'Soya beans, soy sauce, tofu, and edamame.' },
  { id: 'sulphites', terms: ['sulphite', 'wine', 'vinegar'], plain: 'Sulphur dioxide and sulphites, above ten parts per million: Wine, some vinegars, and dried fruit.' },
];

export const PREPARATION_CHECKS = {
  pear: 'The pear card tells you what is in the dish, not how it has been handled or plated. Terence checks preparation and service before anything goes to the table.',
};

/** The one item outside this exercise's scope that must stay visible (D01). */
export const OUT_OF_SCOPE_ITEMS = {
  tomStarter: {
    title: "Tom Reid's starter, table 6",
    detail: 'The smoked haddock tart is not vegetarian and there is no vegetarian starter on the cards. This needs a separate decision from Terence; it is not approved here.',
  },
};
