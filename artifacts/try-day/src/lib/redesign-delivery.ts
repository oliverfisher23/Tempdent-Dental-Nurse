import type { ChecklistItem, DeliveryState } from "./simulation";
import type { DeliveryRedesignState } from "./redesign-types";
import { ORDER_LINES, SHORT_LINE_ID } from "@/content/activities";
import { parseNumber } from "./simulation";

export function deliveryRedesignChecklist(state: DeliveryState): ChecklistItem[] {
  const redesign = state.redesign;
  if (!redesign) return [];

  const checks: ChecklistItem[] = [];

  // All 10 lines checked
  const allCounted = ORDER_LINES.every((line) => {
    const row = state.lines[line.id];
    return row && row.counted;
  });
  checks.push({
    id: "redesign-all-counted",
    label: "All 10 items inspected",
    met: allCounted,
  });

  // Six temperatures checked
  const allProbed = ORDER_LINES.filter((l) => l.chilled).every((line) => {
    const row = state.lines[line.id];
    return row && row.probed;
  });
  checks.push({
    id: "redesign-all-probed",
    label: "6 chilled items have temperatures measured",
    met: allProbed,
  });

  // Four fish checks on sea bass and reason provided
  const allFishChecks = ["eyes", "gills", "smell", "flesh"].every(
    (checkId) => state.fishChecks[checkId as keyof typeof state.fishChecks]
  );
  checks.push({
    id: "redesign-fish-checks",
    label: "Inspected and explained sea bass findings",
    met: allFishChecks && redesign.fishReason.trim().length > 5,
  });

  // Status and acceptance for all lines - goods must be accepted as suitable
  const allStatusAccepted = ORDER_LINES.every((line) => {
    const row = state.lines[line.id];
    return row && row.status === line.expectedStatus && redesign.accepted[line.id] === 'accept';
  });
  checks.push({
    id: "redesign-all-status-accepted",
    label: "Status and acceptance chosen for every item",
    met: allStatusAccepted,
  });

  // Missing quantity reported
  checks.push({
    id: "redesign-missing-quantity",
    label: "Calculated missing quantity",
    met: parseNumber(redesign.missingQuantity) === 4,
  });

  // Report sent and contains text
  checks.push({
    id: "redesign-report",
    label: "Sent shortage report to Terence",
    met: redesign.reportSent && state.radioedMarcus && redesign.report.trim().length > 5,
  });

  // Amendment and signature
  checks.push({
    id: "redesign-amendment-signed",
    label: "Corrected note and signed for goods received",
    met: state.signed,
  });

  return checks;
}
