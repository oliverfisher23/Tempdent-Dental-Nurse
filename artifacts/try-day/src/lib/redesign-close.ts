import { CloseState, ChecklistItem } from './simulation';
import { HANDOVER_FIELDS } from '../content/activities';

export enum ClarificationKey {
  Salmon = 'salmon',
  Fridge = 'fridge',
  Dietary = 'dietary'
}

export function evaluateCloseRedesign(state: CloseState): ChecklistItem[] {
  const rs = state.redesign;
  if (!rs) return []; // Legacy mode

  const interpreted = !!(rs.wasteFocus && rs.wasteReason);
  
  // Headings filled check for the redesign explicitly
  const headingsFilled = HANDOVER_FIELDS.every((f) => (state.handover[f.id] ?? '').trim().length > 0);
  
  // Priorities must be set for all three keys
  const prioritiesSet = ['larder2', 'salmon', 'table3'].every(id => 
    rs.priorities[id] === 'before-service' || rs.priorities[id] === 'later'
  );
  
  // Clarifications must be correctly answered with the bounded correct values
  const clarificationsDone = 
    rs.clarifications[ClarificationKey.Salmon] === 'tomorrow' &&
    rs.clarifications[ClarificationKey.Fridge] === 'todo' &&
    rs.clarifications[ClarificationKey.Dietary] === 'pear';
  
  const responsibilitiesSet = ['larder2', 'salmon', 'table3'].every(id => !!rs.responsibilities?.[id]?.trim());
  const exchangeComplete = headingsFilled && prioritiesSet && responsibilitiesSet && clarificationsDone && !!rs.recipientConfirmed;

  return [
    {
      id: 'close-interpret',
      label: 'Identify a waste follow-up',
      met: interpreted
    },
    {
      id: 'close-exchange',
      label: 'Clarify the evening priorities',
      met: exchangeComplete
    }
  ];
}

export function isHandoverReady(state: CloseState): boolean {
  const rs = state.redesign;
  if (!rs) return false;
  const headingsFilled = HANDOVER_FIELDS.every((f) => (state.handover[f.id] ?? '').trim().length > 0);
  const prioritiesSet = ['larder2', 'salmon', 'table3'].every(id => 
    rs.priorities[id] === 'before-service' || rs.priorities[id] === 'later'
  );
  const responsibilitiesSet = ['larder2', 'salmon', 'table3'].every(id => !!rs.responsibilities?.[id]?.trim());
  return headingsFilled && prioritiesSet && responsibilitiesSet;
}
