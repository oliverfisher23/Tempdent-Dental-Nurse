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

export interface DietaryDecision {
  proposedDishId?: string | null;
  action: 'keep' | 'swap' | 'ask' | null;
  reason: string;
  evidence: string[];
  category: 'ingredient-conflict' | 'vegetarian-conflict' | 'no-conflict' | 'information-missing' | null;
}

export interface DietaryRedesignState {
  version: 1;
  decisions: Record<string, DietaryDecision>;
  serviceHoldAcknowledged: boolean;
  rowReviewConfirmed: Record<string, boolean>;
  openQuestions: Record<string, string>;
}

export interface CloseRedesignState {
  version: 1;
  wasteFocus: string;
  wasteReason: string;
  priorities: Record<string, 'before-service' | 'later'>;
  responsibilities?: Record<string, string>;
  clarifications: Record<string, string>;
  recipientConfirmed: boolean;
}