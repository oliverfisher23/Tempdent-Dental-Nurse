import { useState } from 'react';
import { PLACES } from '@/content/kitchen';
import { kitchenAudio } from '@/lib/audio';
import { Hotspot } from '../../kitchen/hotspot';
import { useKitchenAction, useWorkspaceOpen } from '../../kitchen/kitchen-context';
import { FunctionSheetCloseUp } from './function-sheet';

/** The pass: Yvie hands over the function sheet. Purpose and menu come before any guest detail. */
export function PassScene({
  sheetRead,
  guestDetailsOpen,
  onSheetRead,
}: {
  sheetRead: boolean;
  guestDetailsOpen: boolean;
  onSheetRead: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const open = () => {
    kitchenAudio.play('page');
    setSheetOpen(true);
    if (!sheetRead) onSheetRead();
  };
  useKitchenAction('dietary.open-function-sheet', open);
  useWorkspaceOpen(sheetOpen ? 'dietary.open-function-sheet' : null);

  const backdrop = PLACES['pass'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      <Hotspot
        x={45}
        y={55}
        label="Read the function sheet from Yvie"
        state={sheetRead ? 'done' : 'active'}
        onClick={open}
      />

      <FunctionSheetCloseUp isOpen={sheetOpen} onClose={() => setSheetOpen(false)} guestDetailsOpen={guestDetailsOpen} />
    </div>
  );
}
