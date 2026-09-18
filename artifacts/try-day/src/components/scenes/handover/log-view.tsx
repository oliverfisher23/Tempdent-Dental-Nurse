import { useRef } from 'react';
import { OVERNIGHT_LOG } from '@/content/activities';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import { Clipboard } from '../../kitchen/paper';

export function LogView({ onStart }: { onStart: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useKitchenAction('handover:workspace', () => {
    btnRef.current?.focus();
  });

  return (
    <div className="absolute inset-0 z-0 bg-background flex flex-col overflow-y-auto min-h-0" data-testid="handover-log">
       <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 py-12 flex flex-col min-h-full">
         <Clipboard>
           <div className="p-8 pb-12 bg-white text-foreground">
             <div className="border-b-2 border-foreground pb-4 mb-6">
                 <h2 className="text-2xl font-bold font-sans tracking-widest text-center">{HANDOVER_LABELS.overnightLog}</h2>
                 <p className="text-center font-mono text-muted-foreground mt-1 uppercase">Completed by the night team</p>
             </div>
             
             <div className="space-y-6">
               {OVERNIGHT_LOG.map((entry) => (
                 <div key={entry.time} className="w-full text-left p-4 border rounded relative overflow-hidden bg-zinc-50 border-border text-foreground/80 shadow-inner">
                   <div className="font-mono text-sm font-bold text-muted-foreground mb-2">
                     {entry.time}
                   </div>
                   <div className="text-lg">
                     {entry.text}
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-12 flex justify-center">
                <button
                  ref={btnRef}
                   type="button"
                  data-testid="start-fridge-round"
                  onClick={onStart}
                  className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded hover:bg-primary/90 shadow text-lg"
                >
                  {HANDOVER_LABELS.startRound}
                </button>
             </div>
           </div>
         </Clipboard>
       </div>
    </div>
  );
}
