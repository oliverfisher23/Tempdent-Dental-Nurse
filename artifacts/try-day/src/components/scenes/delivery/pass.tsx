import { PLACES } from '@/content/kitchen';
import { Hotspot } from '@/components/kitchen/hotspot';
import { useKitchen } from '@/components/kitchen/kitchen-context';
import { SCENE_LABELS } from '@/content/scenes/delivery';

/**
 * Task 2 opens at the pass. The one hotspot in the picture is the route to the
 * delivery itself; the radio is part of the workspace, not a prop to collect.
 */
export function PassScene({ onLeave }: { onLeave?: () => void }) {
  const { goTo } = useKitchen();
  const backdrop = PLACES['pass'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      <Hotspot
        x={85}
        y={40}
        label={SCENE_LABELS.goToBackDoor}
        hint={SCENE_LABELS.backDoorHint}
        state="active"
        onClick={() => {
          onLeave?.();
          goTo('goods-in');
        }}
      />
    </div>
  );
}
