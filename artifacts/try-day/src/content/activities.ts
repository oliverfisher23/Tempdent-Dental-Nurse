/**
 * Interactive data for each task in the day.
 *
 * mechanic.json is the client-approved spec and is the source of truth for all
 * narrative copy (situation, job, materials, done-when, complications). This file
 * holds the things a student actually touches: fridge units, order lines, recipe
 * cards, bins, and the "truth" values (what the probe really reads, what really
 * arrived) that the done-when checks in lib/simulation.ts compare against.
 *
 * Everything here is en-GB: 24-hour times, degrees Celsius, kilos.
 */

export type TaskId =
  | 'take-the-handover'
  | 'check-the-delivery-in'
  | 'chill-the-event-batch'
  | 'check-the-dietary-list'
  | 'hand-the-kitchen-on';

export const TASK_ORDER: TaskId[] = [
  'take-the-handover',
  'check-the-delivery-in',
  'chill-the-event-batch',
  'check-the-dietary-list',
  'hand-the-kitchen-on',
];

/** Short lines of dialogue from the people in the kitchen. */
export interface Line {
  /** Legacy speaker values remain accepted for saved/imported dialogue; new content uses Terence/Yvie. */
  speaker: 'Terence' | 'Yvie' | 'Night porter' | 'Driver' | 'Evening team' | 'Marcus' | 'Sarah' | 'Elena';
  text: string;
}

// ---------------------------------------------------------------------------
// Task 1: take the handover and walk the fridges (06:45)
// ---------------------------------------------------------------------------

export interface LogEntry {
  time: string;
  text: string;
  /** The entry Marcus points at: the fridge that needs a note next to it. */
  flagsUnitId?: string;
}

export const OVERNIGHT_LOG: LogEntry[] = [
  {
    time: '22:10',
    text: 'Deep clean done. Floors, pass and hot section all sorted. Extraction filters are back in.',
  },
  {
    time: '01:35',
    text: 'Dry goods turned up early. The boxes are still on the trolley by the back door.',
  },
  {
    time: '04:10',
    text: 'Found larder fridge 2 slightly open on my round. Shut it, but no idea how long it was like that.',
    flagsUnitId: 'larder-2',
  },
  {
    time: '06:30',
    text: 'Breakfast is ready. Hot plate is on, juices are out and the bakery delivery is checked.',
  },
];

export interface FridgeUnit {
  id: string;
  name: string;
  /** Where it is, for the walk. */
  where: string;
  /** The line the kitchen works to for this unit. */
  limitLabel: string;
  /** Upper limit in °C. A reading above this is warmer than it should be. */
  limitC: number;
  /** What the probe really reads this morning. */
  actualC: number;
}

export const FRIDGE_UNITS: FridgeUnit[] = [
  { id: 'walk-in', name: 'Walk-in fridge', where: 'Back corridor', limitLabel: '5°C or below', limitC: 5, actualC: 3.4 },
  { id: 'larder-1', name: 'Larder fridge 1', where: 'Larder section', limitLabel: '5°C or below', limitC: 5, actualC: 2.8 },
  { id: 'larder-2', name: 'Larder fridge 2', where: 'Larder section', limitLabel: '5°C or below', limitC: 5, actualC: 8.6 },
  { id: 'fish', name: 'Fish fridge', where: 'Fish section', limitLabel: '2°C or below', limitC: 2, actualC: 1.2 },
  { id: 'dairy', name: 'Dairy fridge', where: 'Pastry corner', limitLabel: '5°C or below', limitC: 5, actualC: 4.1 },
  { id: 'freezer-1', name: 'Freezer 1', where: 'Back corridor', limitLabel: '-18°C or below', limitC: -18, actualC: -20.5 },
  { id: 'freezer-2', name: 'Freezer 2', where: 'Back corridor', limitLabel: '-18°C or below', limitC: -18, actualC: -19.0 },
];

/** How close a written reading has to be to the probe to count. */
export const READING_TOLERANCE_C = 0.3;

export const HANDOVER_LINES = {
  porterOpening: {
    speaker: 'Night porter',
      text: "Morning. Log's on the clipboard, four entries. The one you want is larder fridge 2 at ten past four. I've got a bus at seven, so if you're good I'll get off.",
  } satisfies Line,
  porterLeaving: {
    speaker: 'Night porter',
    text: "Right, you've read it. I'm off to catch my bus. See you.",
  } satisfies Line,
  marcusOpening: {
    speaker: 'Terence',
    text: "Have a look at the night notes first, then we'll go round together. Let the probe settle and write down what you actually see. Add the time and your initials as you go.",
  } satisfies Line,
  marcusAtFlaggedUnit: {
    speaker: 'Terence',
    text: "This is the fridge from the night notes. Have a proper look inside before you write anything.",
  } satisfies Line,
  marcusOnWarmReading: {
    speaker: 'Terence',
    text: "Eight point six — that's too warm. Check what's in there. We need to move anything high-risk into larder one and keep this door shut while it cools.",
  } satisfies Line,
  marcusOnWrongReading: {
    speaker: 'Terence',
    text: "Take another look at the probe. Just write the number you can see.",
  } satisfies Line,
  marcusDone: {
    speaker: 'Terence',
    text: "Nice one. I read that board at the end of the day. The delivery's not here until half eight, so grab a coffee.",
  } satisfies Line,
};

// ---------------------------------------------------------------------------
// Task 2: check the delivery in (08:30)
// ---------------------------------------------------------------------------

export type LineStatus = 'arrived' | 'short' | 'refused';

export interface OrderLine {
  id: string;
  trolley: 1 | 2 | 3;
  item: string;
  unit: string;
  ordered: number;
  /** What actually came off the trolley. */
  arrived: number;
  /** What the supplier's delivery note claims was sent. */
  onDeliveryNote: number;
  chilled: boolean;
  /** Probe reading of the box, if chilled. */
  actualC?: number;
  /** Chilled goods have to come in at or below this. */
  limitC?: number;
  /** The right mark for this line, given what arrived. */
  expectedStatus: LineStatus;
}

export const ORDER_LINES: OrderLine[] = [
  { id: 'salmon', trolley: 1, item: 'Salmon fillet, skin on', unit: 'kg', ordered: 12, arrived: 8, onDeliveryNote: 12, chilled: true, actualC: 2.1, limitC: 5, expectedStatus: 'short' },
  { id: 'sea-bass', trolley: 1, item: 'Sea bass, whole, gutted', unit: 'fish', ordered: 10, arrived: 10, onDeliveryNote: 10, chilled: true, actualC: 1.8, limitC: 5, expectedStatus: 'arrived' },
  { id: 'smoked-haddock', trolley: 1, item: 'Smoked haddock, undyed', unit: 'kg', ordered: 3, arrived: 3, onDeliveryNote: 3, chilled: true, actualC: 2.4, limitC: 5, expectedStatus: 'arrived' },
  { id: 'chicken', trolley: 2, item: 'Chicken supreme, skin on', unit: 'pieces', ordered: 96, arrived: 96, onDeliveryNote: 96, chilled: true, actualC: 3.2, limitC: 5, expectedStatus: 'arrived' },
  { id: 'cream', trolley: 2, item: 'Double cream, 2 litre', unit: 'bottles', ordered: 6, arrived: 6, onDeliveryNote: 6, chilled: true, actualC: 4.0, limitC: 5, expectedStatus: 'arrived' },
  { id: 'butter', trolley: 2, item: 'Unsalted butter, 250 g', unit: 'blocks', ordered: 20, arrived: 20, onDeliveryNote: 20, chilled: true, actualC: 4.4, limitC: 5, expectedStatus: 'arrived' },
  { id: 'spinach', trolley: 3, item: 'Baby spinach, 1 kg bag', unit: 'bags', ordered: 8, arrived: 8, onDeliveryNote: 8, chilled: false, expectedStatus: 'arrived' },
  { id: 'shallots', trolley: 3, item: 'Banana shallots, 5 kg', unit: 'sacks', ordered: 2, arrived: 2, onDeliveryNote: 2, chilled: false, expectedStatus: 'arrived' },
  { id: 'lemons', trolley: 3, item: 'Lemons', unit: 'each', ordered: 60, arrived: 60, onDeliveryNote: 60, chilled: false, expectedStatus: 'arrived' },
  { id: 'parsley', trolley: 3, item: 'Flat-leaf parsley', unit: 'bunches', ordered: 10, arrived: 10, onDeliveryNote: 10, chilled: false, expectedStatus: 'arrived' },
];

/** The line the complication hangs on. */
export const SHORT_LINE_ID = 'salmon';

/** What a fresh fish looks, feels and smells like; the student checks each one. */
export const FISH_CHECKS = [
  { id: 'eyes', label: 'Eyes', whatYouFind: 'Clear and bright, slightly domed. Cloudy or sunken eyes mean it is old.' },
  { id: 'gills', label: 'Gills', whatYouFind: 'Deep red and wet. Brown or grey gills are a refusal.' },
  { id: 'smell', label: 'Smell', whatYouFind: 'Clean, of the sea. Anything sour or like ammonia does not come in.' },
  { id: 'flesh', label: 'Flesh', whatYouFind: 'Firm; springs back when pressed. If your finger leaves a dent, it goes back on the van.' },
] as const;

export type FishCheckId = (typeof FISH_CHECKS)[number]['id'];

export const DELIVERY_LINES = {
  driverOpening: {
    speaker: 'Driver',
    text: "Three trolleys, all yours. Sign here and I'm gone — I've got another delivery after this.",
  } satisfies Line,
  marcusOpening: {
    speaker: 'Terence',
    text: "He can wait ten minutes. Count it, probe the cold boxes, look at the fish. You sign for what you took in, not for what his bit of paper says.",
  } satisfies Line,
  driverOnShort: {
    speaker: 'Driver',
    text: "Eight? It says twelve on the note. It'll have never been loaded then. Not me, I just drive it.",
  } satisfies Line,
  marcusOnRadio: {
    speaker: 'Terence',
    text: "Four short on the salmon? Right. Tonight doesn't need it; tomorrow's lunch does. Mark it short, cross the twelve out on his note, write eight and sign next to it. Put it on my list and I'll ring them before ten.",
  } satisfies Line,
  marcusOnWrongStatus: {
    speaker: 'Terence',
    text: "Look at the count again before you mark that line. Arrived means the full order came in; short means some of it did; refused means it's going back on the van.",
  } satisfies Line,
  marcusOnUnamendedNote: {
    speaker: 'Terence',
    text: "Don't sign that yet. It still says twelve kilos of salmon. If you sign for twelve, we pay for twelve.",
  } satisfies Line,
  marcusDone: {
    speaker: 'Terence',
    text: "That's done properly. Store fish and meat first; fruit can wait a minute.",
  } satisfies Line,
};

// ---------------------------------------------------------------------------
// Task 3: chill the batch for tonight (10:45)
// ---------------------------------------------------------------------------

export const PREP_SHEET = {
  dish: 'Braised beef shin for one hundred',
  batchKg: 27,
  trays: 6,
  /** Depth the prep sheet asks for. */
  fillDepthMm: 50,
  /** A 1/1 gastronorm tray takes about 4 kg of this at 50 mm. */
  kgPerTrayAtDepth: 4,
  /** Your half of the batch. Terence pans the other half. */
  yourShareKg: 13.5,
  /** Trays that are clean and to hand right now. */
  cleanTraysAvailable: 3,
  /** Each scoop from the bratt pan. */
  scoopKg: 0.5,
  /** Depth in mm for a given weight in one 1/1 tray. */
  depthForKg: (kg: number) => Math.round(kg * 12.5),
};

/** The blast chiller has eight shelf positions. Trays need an empty shelf between them. */
export const CHILLER_SHELVES = 8;

export const PROBE_PLACEMENTS = [
  { id: 'centre', label: 'Into the thickest part of the fullest tray', correct: true },
  { id: 'surface', label: 'Just under the surface of the nearest tray', correct: false },
  { id: 'metal', label: 'Against the metal of the tray', correct: false },
] as const;

export type ProbePlacementId = (typeof PROBE_PLACEMENTS)[number]['id'];

/** Chill record rules the kitchen works to. */
export const CHILL_RULES = {
  /** Chilled food has to be held at or below this. */
  holdLineC: 8,
  /** Above this at ninety minutes a batch does not go to service at all. */
  serviceLineC: 21,
  /** Minutes at which a reading is written. */
  intervals: [0, 30, 60, 90] as const,
  extraInterval: 120 as const,
  startClock: '10:45',
};

export type ChillInterval = (typeof CHILL_RULES.intervals)[number] | 120;

/** Authored 56 mm example-batch readings, not a physical prediction of learner portioning. */
export const YOUR_TRAY_READINGS: Record<ChillInterval, number> = {
  0: 74.2,
  30: 41.5,
  60: 19.8,
  90: 11.2,
  120: 5.9,
};

/** Authored comparison readings for Terence's 48 mm example tray. */
export const MARCUS_TRAY_READINGS: Record<ChillInterval, number> = {
  0: 73.8,
  30: 36.1,
  60: 14.6,
  90: 6.4,
  120: 3.2,
};

/** Depths in the authored cooling comparison, distinct from the learner's practice trays. */
export const MEASURED_DEPTHS_MM = { yours: 56, marcus: 48 };

export const NINETY_MINUTE_CHOICES = [
  {
    id: 'keep-logging',
    label: 'Leave it in the chiller and take the temperature again at 120 minutes',
    correct: true,
  },
  {
    id: 'walk-in',
    label: "It's close enough. Move it to the walk-in and let it finish there",
    correct: false,
  },
  {
    id: 'bin',
    label: "It's missed the ninety minutes, so it can't go to service",
    correct: false,
  },
] as const;

export type NinetyMinuteChoiceId = (typeof NINETY_MINUTE_CHOICES)[number]['id'];

export const CHILL_LINES = {
  marcusOpening: {
    speaker: 'Terence',
    text: "You have half of the twenty-seven-kilo batch. Keep the beef no deeper than fifty millimetres. If the trays on the bench will not hold your share at that depth, ask for a clean spare. Then we will work through a recorded cooling comparison.",
  } satisfies Line,
  marcusOnTrayShortage: {
    speaker: 'Terence',
    text: "Here is a clean spare tray. Divide your share without going over fifty millimetres in any tray. You can return beef to the pan and redistribute it before loading.",
  } satisfies Line,
  marcusOnProbe: {
    speaker: 'Terence',
    text: "Probe goes into the food, middle of the fullest tray. Against the metal you're reading the tray, not the beef.",
  } satisfies Line,
  marcusOnSpacing: {
    speaker: 'Terence',
    text: "Leave a shelf between them. Stack them tight and the air can't get round; the middle one stays warm all afternoon.",
  } satisfies Line,
  marcusAtNinety: {
    speaker: 'Terence',
    text: "In this recorded comparison, the shallower tray is at six point four. The deeper tray is still over eight. Use the example readings and the kitchen's limits to decide what happens next.",
  } satisfies Line,
  marcusOnRightChoice: {
    speaker: 'Terence',
    text: "The deeper example batch stays in the chiller while we keep recording. Now compare the example depths with the depth of the trays you prepared.",
  } satisfies Line,
  marcusOnWalkIn: {
    speaker: 'Terence',
    text: "No. I'm taking that one back. The walk-in holds cold food cold; it doesn't make warm food cold, and everything else in there warms up around it. It stays in the chiller.",
  } satisfies Line,
  marcusOnBin: {
    speaker: 'Terence',
    text: "It's eleven, not twenty-one. It's behind, not spoiled. We keep it in and keep logging. Binning one hundred mains because we panicked would be the real mistake.",
  } satisfies Line,
  marcusOnRuler: {
    speaker: 'Terence',
    text: "The example trays were fifty-six and forty-eight millimetres deep. Those are the recorded case depths, not a measurement of your arrangement. Compare their cooling records and use the prep sheet's depth limit for your next batch.",
  } satisfies Line,
  marcusDone: {
    speaker: 'Terence',
    text: "The deeper example batch reaches five point nine at two hours. Record that result and sign your comparison record. The evening team needs to know which readings were checked.",
  } satisfies Line,
};

// ---------------------------------------------------------------------------
// Task 4: check tonight's dietary list (12:30)
// ---------------------------------------------------------------------------

/** The fourteen allergens that have to be declared by law in the UK. */
export const ALLERGENS = [
  { id: 'celery', label: 'Celery' },
  { id: 'gluten', label: 'Cereals containing gluten' },
  { id: 'crustaceans', label: 'Crustaceans' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
  { id: 'lupin', label: 'Lupin' },
  { id: 'milk', label: 'Milk' },
  { id: 'molluscs', label: 'Molluscs' },
  { id: 'mustard', label: 'Mustard' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'sesame', label: 'Sesame' },
  { id: 'soya', label: 'Soya' },
  { id: 'sulphites', label: 'Sulphur dioxide and sulphites' },
] as const;

export type AllergenId = (typeof ALLERGENS)[number]['id'];

export interface Dish {
  id: string;
  course: 'Starter' | 'Main' | 'Vegetarian main' | 'Dessert' | 'Alternative dessert';
  name: string;
  /** Ingredient list from the recipe card. Allergens are named plainly so a student can find them. */
  ingredients: string[];
  /** The truth the chart is checked against. */
  allergens: AllergenId[];
  /** Already cooked and in the walk-in. */
  alreadyMade: boolean;
  note?: string;
}

export const DISHES: Dish[] = [
  {
    id: 'tart',
    course: 'Starter',
    name: 'Smoked haddock and leek tart, watercress',
    ingredients: ['Shortcrust pastry (wheat flour, butter)', 'Smoked haddock', 'Leeks', 'Double cream', 'Eggs', 'Watercress', 'Lemon'],
    allergens: ['gluten', 'fish', 'milk', 'eggs'],
    alreadyMade: true,
  },
  {
    id: 'beef',
    course: 'Main',
    name: 'Braised beef shin, horseradish mash, glazed carrots, red wine jus',
    ingredients: ['Beef shin', 'Onion, carrot and celery', 'Red wine (contains sulphites)', 'Beef stock', 'Potatoes', 'Butter and milk', 'Horseradish', 'Carrots', 'Thyme'],
    allergens: ['celery', 'sulphites', 'milk'],
    alreadyMade: true,
  },
  {
    id: 'wellington',
    course: 'Vegetarian main',
    name: 'Wild mushroom, spinach and ricotta Wellington',
    ingredients: ['Puff pastry (wheat flour, butter)', 'Wild mushrooms', 'Spinach', 'Ricotta', 'Egg wash', 'Shallots', 'Thyme'],
    allergens: ['gluten', 'milk', 'eggs'],
    alreadyMade: true,
  },
  {
    id: 'frangipane',
    course: 'Dessert',
    name: 'Pistachio and raspberry frangipane tart, crème fraîche',
    ingredients: ['Sweet pastry (wheat flour, butter, egg)', 'Ground almonds', 'Pistachios', 'Butter', 'Eggs', 'Sugar', 'Raspberries', 'Crème fraîche'],
    allergens: ['gluten', 'nuts', 'milk', 'eggs'],
    alreadyMade: true,
    note: 'Made this morning. Nuts through the whole tart; it cannot be adapted.',
  },
  {
    id: 'pear',
    course: 'Alternative dessert',
    name: 'Poached pear, vanilla ice cream',
    ingredients: ['Pears', 'Sugar', 'Vanilla', 'Vanilla ice cream (milk)'],
    allergens: ['milk'],
    alreadyMade: true,
    note: 'In the pastry fridge for the bistro. Twelve portions available.',
  },
];

export const FUNCTION_SHEET = {
  event: "art'otel Hoxton product launch",
  room: 'Exe Suite',
  covers: 100,
  timings: [
    { time: '18:00', what: 'Drinks reception, terrace' },
    { time: '19:00', what: 'Guests seated' },
    { time: '19:15', what: 'Starter away' },
    { time: '19:50', what: 'Main course away' },
    { time: '20:30', what: 'Dessert away' },
    { time: '21:00', what: 'Speeches' },
  ],
  tables: 'Tables 1 to 9, ten covers each. Top table is table 1.',
  /** Requirements already on the earlier version of the sheet, already catered for. */
  existingRequirements: [
    { guest: 'Table 2, one guest', requirement: 'Vegetarian', catered: 'Wellington' },
    { guest: 'Table 5, one guest', requirement: 'Coeliac (no gluten)', catered: 'Plated separately: no tart pastry, beef without jus thickening, poached pear' },
    { guest: 'Table 7, two guests', requirement: 'Vegetarian', catered: 'Wellington' },
  ],
};

export interface AddedGuest {
  id: string;
  name: string;
  table: number;
  requirement: string;
  /** Allergens this guest must not be served. Empty means no allergy. */
  mustAvoid: AllergenId[];
  vegetarian: boolean;
}

export const ADDED_GUESTS: AddedGuest[] = [
  { id: 'priya', name: 'Priya Nair', table: 3, requirement: 'Nut allergy (severe). Carries an adrenaline pen.', mustAvoid: ['nuts', 'peanuts'], vegetarian: false },
  { id: 'tom', name: 'Tom Reid', table: 6, requirement: 'Vegetarian', mustAvoid: [], vegetarian: true },
  { id: 'anna', name: 'Anna Kowalski', table: 9, requirement: 'None stated', mustAvoid: [], vegetarian: false },
];

export const MAIN_OPTIONS = ['beef', 'wellington'] as const;
export const DESSERT_OPTIONS = ['frangipane', 'pear'] as const;

export const DIETARY_LINES = {
  sarahOpening: {
    speaker: 'Yvie',
    text: "Final sheet. Three added since Tuesday, tables three, six and nine. One of them's a nut allergy. I need to know what they're eating before I print the table plan, and I'd like to print it by one.",
  } satisfies Line,
  marcusOpening: {
    speaker: 'Terence',
    text: "Recipe cards are on the pass. Work the chart dish by dish, all fourteen columns, before you promise Yvie anything. Then we go through it together.",
  } satisfies Line,
  marcusOnChartErrors: {
    speaker: 'Terence',
    text: "Not yet. Go back to the recipe cards for the dishes I've marked; something's ticked that shouldn't be, or missed that should be there.",
  } satisfies Line,
  marcusOnNutDessert: {
    speaker: 'Terence',
    text: "Stop. That tart has pistachio and almond all the way through it. She can't have it, and nor can anyone sharing a plate with her. Find her the pear.",
  } satisfies Line,
  marcusOnMeatForVegetarian: {
    speaker: 'Terence',
    text: "He's vegetarian. That's the Wellington, not the beef.",
  } satisfies Line,
  sarahDone: {
    speaker: 'Yvie',
    text: "Table three, pear, flagged on the plan, and I'll tell the floor team to check the name against the table. Thank you. That's what I needed.",
  } satisfies Line,
  marcusDone: {
    speaker: 'Terence',
    text: "On the board, big letters. The evening team read that board before they read anything else.",
  } satisfies Line,
};

// ---------------------------------------------------------------------------
// Task 5: weigh the waste and hand the kitchen on (14:30)
// ---------------------------------------------------------------------------

export interface WasteBin {
  id: 'trimmings' | 'spoilage' | 'plate';
  label: string;
  description: string;
  /** What the scale reads. */
  actualKg: number;
  whereFrom: string;
}

export const WASTE_BINS: WasteBin[] = [
  {
    id: 'trimmings',
    label: 'Trimmings from preparing food',
    description: 'Peelings, fish frames, fat and sinew off the beef, leek tops.',
    actualKg: 6.4,
    whereFrom: 'Larder and fish sections, this morning',
  },
  {
    id: 'spoilage',
    label: 'Food that went off before it was used',
    description: 'Cooked rice and a tray of chopped melon out of larder fridge 2, binned after the door was found open.',
    actualKg: 1.8,
    whereFrom: 'Larder fridge 2',
  },
  {
    id: 'plate',
    label: 'Food that came back from plates',
    description: 'Breakfast and bistro lunch.',
    actualKg: 4.2,
    whereFrom: 'The pass and the wash-up',
  },
];

export const WEIGHT_TOLERANCE_KG = 0.15;

export interface HandoverField {
  id: 'prepared' | 'short' | 'walkIn' | 'watch';
  label: string;
  /** Things from the day a student can pull in with a tap. */
  prompts: string[];
}

export const HANDOVER_FIELDS: HandoverField[] = [
  {
    id: 'prepared',
    label: 'What is prepared',
    prompts: [
      'Which preparation facts are in the supplied shift notes?',
      'What does the recorded cooling comparison show, and what does it not confirm?',
    ],
  },
  {
    id: 'short',
    label: 'What is short',
    prompts: [
      'What was ordered, what was accepted and how much is missing?',
      'Which service needs it, and who needs to follow it up?',
    ],
  },
  {
    id: 'walkIn',
    label: 'What is in the walk-in for tonight',
    prompts: [
      'Use the supplied storage facts; do not turn a proposed move into a completed one.',
      'Keep preparation, example cooling readings and storage information distinct.',
    ],
  },
  {
    id: 'watch',
    label: 'The one thing you would keep an eye on',
    prompts: [
      'Which saved reading needs follow-up, and when?',
      'Which dietary proposal is on hold for a preparation and service check?',
      'Name who should act; a requested check has not happened yet.',
    ],
  },
];

export const ELENA_QUESTION = {
  question: "In the recorded comparison, the deeper tray took two hours to get under the line and the shallower tray took ninety minutes. How would you prepare the trays for the next batch?",
  options: [
    {
      id: 'shallower',
      label: 'Have enough clean trays ready to keep every tray within the depth on the prep sheet',
      correct: true,
      response: "Use the fifty-millimetre limit on the prep sheet and arrange enough clean trays before portioning. The comparison shows why we pay attention to depth; it does not predict the readings of every arrangement.",
    },
    {
      id: 'colder',
      label: 'Turn the blast chiller down colder so it pulls the heat out faster',
      correct: false,
      response: "It was already as cold as it goes. Depth is what decides how fast the middle cools, not the number on the cabinet. Think about the trays, not the machine.",
    },
    {
      id: 'walk-in',
      label: 'Take the trays out at ninety minutes and let the walk-in finish them off',
      correct: false,
      response: "No. The walk-in holds cold food cold; it does not chill warm food, and it would have warmed up everything else in there. I was right to keep it in. Think about what you would change before the chiller, not after.",
    },
  ],
} as const;

export type ElenaOptionId = (typeof ELENA_QUESTION.options)[number]['id'];

export const CLOSE_LINES = {
  elenaOpening: {
    speaker: 'Terence',
    text: "Before you go. Bring the chill record and the temperature board; I want five minutes with you at the pass.",
  } satisfies Line,
  eveningTeam: {
    speaker: 'Evening team',
    text: "Evening. What's short, what's in the walk-in, and what are we watching?",
  } satisfies Line,
  marcusDone: {
    speaker: 'Terence',
    text: "That's a shift. You took the small decisions and you wrote everything down. That's the job.",
  } satisfies Line,
};

/** The three principles that define the art'otel voice. */
export const ARTOTEL_LINES = ['Clever.', 'Cultured.', 'Clear.'];

/** Canonical-name aliases for integrations that can use the updated script names.
 * Legacy exports and state keys above remain unchanged for saved shifts. */
export const TERENCE_LINES = {
  handover: HANDOVER_LINES,
  delivery: DELIVERY_LINES,
  chill: CHILL_LINES,
  dietary: DIETARY_LINES,
  close: CLOSE_LINES,
};
export const YVIE_LINES = DIETARY_LINES;
export const TERENCE_QUESTION = ELENA_QUESTION;
