import { PLACES } from '@/content/kitchen';
import { Hotspot } from '@/components/kitchen/hotspot';
import { useKitchen } from '@/components/kitchen/kitchen-context';
import { SCENE_LABELS } from '@/content/scenes/delivery';

export function PassScene({ hasRadio, onTakeRadio }: { hasRadio: boolean, onTakeRadio: () => void }) {
  const { goTo } = useKitchen();
  const backdrop = PLACES['pass'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {!hasRadio ? (
        <Hotspot
          x={65}
          y={55}
          label={SCENE_LABELS.pickUpRadio}
          state="active"
          onClick={onTakeRadio}
        />
      ) : (
        <Hotspot
          x={85}
          y={40}
          label={SCENE_LABELS.goToBackDoor}
          hint={SCENE_LABELS.backDoorHint}
          state="active"
          onClick={() => goTo('goods-in')}
        />
      )}
    </div>
  );
}