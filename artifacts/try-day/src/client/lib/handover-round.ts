import { FRIDGE_UNITS, OVERNIGHT_LOG } from '@client/content/activities';
import { rowReadingIsRight, type BoardRow, type HandoverState } from './simulation';

export const FLAGGED_FRIDGE_ID = OVERNIGHT_LOG.find(entry => entry.flagsUnitId)?.flagsUnitId ?? 'larder-2';

export function handoverRowComplete(unitId: string, row: BoardRow | undefined): boolean {
  return !!row
    && row.probed
    && rowReadingIsRight(unitId, row.reading)
    && row.time.trim().length > 0
    && row.initials.trim().length > 0
    && (unitId !== FLAGGED_FRIDGE_ID || row.note.trim().length >= 8);
}

export function handoverRowSaved(unitId: string, row: BoardRow | undefined): boolean {
  // Valid records made before the guided round remain saved. New drafts explicitly
  // set recorded=false so a settled probe or typed number cannot advance the round.
  return handoverRowComplete(unitId, row) && row?.recorded !== false;
}

export function handoverLogRead(state: HandoverState): boolean {
  return OVERNIGHT_LOG.every(entry => state.logRead.includes(entry.time));
}

export function nextHandoverUnit(state: HandoverState) {
  return FRIDGE_UNITS.find(unit => !handoverRowSaved(unit.id, state.rows[unit.id]));
}

export function handoverRoundSaved(state: HandoverState): boolean {
  return handoverLogRead(state) && !nextHandoverUnit(state);
}