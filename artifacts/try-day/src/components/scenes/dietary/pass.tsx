import { useState } from 'react';
import { PLACES } from '@/content/kitchen';
import { kitchenAudio } from '@/lib/audio';
import { Hotspot } from '../../kitchen/hotspot';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import { FunctionSheetCloseUp } from './function-sheet';

export function PassScene({
  stateGuests,
  onAssignGuest,
  chartChecked
}: {
  stateGuests: Record<string, any>;
  onAssignGuest: (guestId: string, field: 'main' | 'dessert', val: string) => void;
  chartChecked: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  useKitchenAction('dietary.open-function-sheet', () => setSheetOpen(true));

  const backdrop = PLACES['pass'].backdrop;
  
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      <Hotspot 
        x={45} 
        y={55} 
        label="Take the function sheet from Yvie"
        state="active" 
        onClick={() => { kitchenAudio.play('page'); setSheetOpen(true); }} 
      />

      <FunctionSheetCloseUp 
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        stateGuests={stateGuests}
        onAssignGuest={onAssignGuest}
        chartChecked={chartChecked}
      />
    </div>
  );
}
