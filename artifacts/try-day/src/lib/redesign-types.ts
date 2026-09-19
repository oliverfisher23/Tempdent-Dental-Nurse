/** Additive learning records. Legacy signed-off records do not acquire new requirements. */
export interface DeliveryRedesignState {
  version: 1;
  accepted: Record<string, 'accept' | 'refuse'>;
  fishReason: string;
  missingQuantity: string;
  report: string;
  reportSent: boolean;
}

export interface ChillRedesignState {
  version: 1;
  comparisonReviewed: boolean;
}

export type DietaryCourse = 'main' | 'dessert';

export type DietaryDecisionCategory =
  | 'ingredient-conflict'
  | 'vegetarian-conflict'
  | 'no-conflict'
  | 'information-missing';

/** One course for one added guest: what the chart says (category), the evidence behind it, and what the learner proposes. */
export interface DietaryDecision {
  proposedDishId?: string | null;
  action: 'keep' | 'swap' | 'ask' | null;
  reason: string;
  /** Evidence ids: recipe-card ingredient text, the card note, `requirement`, or `row:<dishId>` (the learner's own chart row). */
  evidence: string[];
  category: DietaryDecisionCategory | null;
}

/** The learner's board wording for one actual change; the rest of the entry is assembled from the saved decision. */
export interface DietaryBoardEntry {
  reason: string;
}

export interface DietaryRedesignState {
  version: 1;
  decisions: Record<string, DietaryDecision>;
  /** The board is a held instruction, not permission to serve; the learner acknowledges that before posting. */
  serviceHoldAcknowledged: boolean;
  rowReviewConfirmed: Record<string, boolean>;
  /** "Check needed" notes per dish. Displayed as open questions for Terence, never as allergen marks. */
  openQuestions: Record<string, string>;
  /** The function sheet has been read at the pass (purpose and menu before guest detail). */
  sheetRead?: boolean;
  /** Graduated hint tier reached per topic (`chart:<dishId>` or `<guestId>:<course>`); hints are never penalised. */
  hintLevels?: Record<string, number>;
  /** Board reasons keyed by decision key (`<guestId>:<course>`). */
  board?: Record<string, DietaryBoardEntry>;
  /**
   * Courses Terence has actually been asked to check and accepted, keyed by decision key.
   * Filling the fields in is not the same as checking them; any later edit clears the entry.
   */
  courseReviewed?: Record<string, boolean>;
}

export interface CloseRedesignState {
  version: 1;
  /** Optional formative choice: which waste the learner would look into ('' when skipped). */
  wasteFocus: string;
  /** Optional free text: what the learner would check next. Never graded. */
  wasteReason: string;
  /** Before-service / later grouping for each follow-up (keys: larder2, salmon, table3). */
  priorities: Record<string, 'before-service' | 'later'>;
  responsibilities?: Record<string, string>;
  /** Structured answers to the evening team, keyed `${topic}.${part}` → option id (right or wrong). */
  clarifications: Record<string, string>;
  /** The learner confirmed the evening team's read-back of the resolved handover. */
  recipientConfirmed: boolean;
  /** The learner has walked the evening team through the sheet at least once; wording prompts appear after this. */
  attempted?: boolean;
}
