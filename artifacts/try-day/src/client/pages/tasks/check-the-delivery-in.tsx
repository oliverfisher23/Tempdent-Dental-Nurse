import { useCallback } from 'react';
import { DELIVERY_LINES } from '@client/content/activities';
import { useProgress } from '@client/lib/progress';
import type { DeliveryState } from '@client/lib/simulation';
import { kitchenAudio } from '@kit/lib/audio';
import { getDeliveryGuide } from '@client/content/guides/handover-delivery';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import { PassScene } from '@client/scenes/delivery/pass';
import { GoodsInScene } from '@client/scenes/delivery/goods-in';

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