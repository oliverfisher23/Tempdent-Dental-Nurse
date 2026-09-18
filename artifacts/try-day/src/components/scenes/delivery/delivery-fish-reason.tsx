import { FISH_CHECKS } from '@/content/activities';
import { ROW_LABELS } from '@/content/scenes/delivery-row';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DeliveryState } from '@/lib/simulation';

interface DeliveryFishReasonProps {
  state: DeliveryState;
  onUpdateState: (recipe: (previous: DeliveryState) => DeliveryState) => void;
}

export function DeliveryFishReason({ state, onUpdateState }: DeliveryFishReasonProps) {
  const inspected = state.lines['sea-bass'].probed
    && FISH_CHECKS.every((check) => state.fishChecks[check.id]);
  const reasons = [
    ['condition-and-temperature', ROW_LABELS.fishReasonEvidence],
    ['quantity-only', ROW_LABELS.fishReasonQuantity],
    ['supplier-claim-only', ROW_LABELS.fishReasonClaim],
  ] as const;

  return (
    <section aria-labelledby="delivery-fish-reason-heading" className="space-y-3">
      <h4 id="delivery-fish-reason-heading" className="text-base font-bold text-zinc-100">{ROW_LABELS.fishReasonHeading}</h4>
      {!inspected ? <p className="text-sm text-zinc-300">{ROW_LABELS.fishReasonInspect}</p> : (
        <RadioGroup
          aria-labelledby="delivery-fish-reason-heading"
          value={state.fishReason ?? ''}
          onValueChange={(value) => onUpdateState((previous) => ({
            ...previous,
            fishReason: value as DeliveryState['fishReason'],
          }))}
          className="space-y-2"
        >
          {reasons.map(([value, label]) => (
            <div key={value} className="flex items-start gap-3 rounded border border-white/20 bg-black/30 p-3">
              <RadioGroupItem id={`fish-reason-${value}`} value={value} className="mt-1 shrink-0" />
              <Label htmlFor={`fish-reason-${value}`} className="cursor-pointer text-sm leading-relaxed text-white">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </section>
  );
}