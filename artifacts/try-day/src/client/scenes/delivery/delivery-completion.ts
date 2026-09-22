import { FISH_CHECKS, ORDER_LINES } from '@client/content/activities';
import type { DeliveryState } from '@client/lib/simulation';

export function deliveryLineFinished(state: DeliveryState, lineId: string) {
  const line = ORDER_LINES.find((candidate) => candidate.id === lineId);
  if (!line) return false;
  const row = state.lines[line.id];
  return Boolean(
    row.counted
    && row.arrived.trim()
    && row.comparison
    && row.status
    && row.acceptance
    && row.acceptedAmount.trim()
    && (!line.chilled || (row.probed && row.temperature.trim()))
    && (line.id !== 'sea-bass' || (state.fishReason && FISH_CHECKS.every((check) => state.fishChecks[check.id]))),
  );
}

export function finishedDeliveryLineCount(state: DeliveryState) {
  return ORDER_LINES.filter((line) => deliveryLineFinished(state, line.id)).length;
}