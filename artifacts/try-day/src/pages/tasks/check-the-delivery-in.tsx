import { useCallback } from 'react';
import { DELIVERY_LINES } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import type { DeliveryState } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { getDeliveryGuide } from '@/content/guides/handover-delivery';
import { KitchenFrame } from '@/components/kitchen/kitchen-frame';
import { PassScene } from '@/components/scenes/delivery/pass';
import { GoodsInScene } from '@/components/scenes/delivery/goods-in';

export default function DeliveryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks['check-the-delivery-in'];
  const handleUpdateState = useCallback((recipe: (previous: DeliveryState) => DeliveryState) => {
    // The store owns invalidation and the completed-task freeze.
    updateTask('check-the-delivery-in', recipe);
  }, [updateTask]);

  return (
    <KitchenFrame
      id="check-the-delivery-in"
      guide={getDeliveryGuide(state)}
      focusedWorkspace
      dialogue={DELIVERY_LINES.marcusOpening}
      scenes={{
        pass: <PassScene onLeave={() => kitchenAudio.play('tap')} />,
        'goods-in': <GoodsInScene state={state} onUpdateState={handleUpdateState} />,
      }}
    />
  );
}