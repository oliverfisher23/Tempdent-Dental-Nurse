import { useState } from 'react';
import { useProgress } from '@/lib/progress-store';
import { OVERNIGHT_LOG } from '@/content/activities';
import { PLACES } from '@/content/kitchen';
import { Hotspot } from '../../kitchen/hotspot';
import { Clipboard } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { kitchenAudio } from '@/lib/audio';
import { useKitchen, useKitchenAction, usePresent } from '../../kitchen/kitchen-context';
import { cn } from '@/lib/utils';
import portraitMarcus from '@/assets/kitchen/portrait-marcus.png';
import portraitPorter from '@/assets/kitchen/portrait-porter.png';

function PorterPresence() {
  usePresent('porter', 40);
  return <img src={portraitPorter} className="h-[58%] object-contain -ml-24 drop-shadow-2xl opacity-90 transition-opacity duration-1000" alt="" />;
}

function MarcusPresence() {
  usePresent('marcus', 40);
  return <img src={portraitMarcus} className="h-[62%] object-contain ml-16 drop-shadow-2xl opacity-100 transition-opacity duration-1000 animate-in fade-in" alt="" />;
}

export function PassScene({ onLogRead, logRead }: { onLogRead: (time: string) => void, logRead: string[] }) {
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const { goTo } = useKitchen();
  useKitchenAction('handover:log', () => setClipboardOpen(true));

  const backdrop = PLACES['pass'].backdrop;
  const allRead = logRead.length >= OVERNIGHT_LOG.length;

  return (
    <div className="absolute inset-0 z-0">
      {/* Backdrop */}
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" decoding="async" />
      
      {/* Darken backdrop slightly with plain semi-transparent layer instead of backdrop-filter for performance */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      
      {/* Subtle idle motion: heat lamps breathing at the pass (top edge) */}
      <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-orange-500/10 to-transparent mix-blend-overlay animate-pulse pointer-events-none" style={{ animationDuration: '5s' }} />

      {/* Characters - Presences in scene */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center">
        {!allRead ? (
          <PorterPresence />
        ) : (
          <MarcusPresence />
        )}
      </div>

      {/* Hotspots */}
      <Hotspot 
        x={65} 
        y={55} 
        label="Read the overnight log" 
        state={allRead ? 'done' : 'active'}
        onClick={() => {
          kitchenAudio.play('page');
          setClipboardOpen(true);
        }} 
      />

      {allRead && (
         <Hotspot 
           x={85} 
           y={50} 
           label="Go to the fridges" 
           state="active"
           onClick={() => goTo('corridor')} 
         />
      )}

      {/* Close up modal for Clipboard */}
      <CloseUp isOpen={clipboardOpen} onClose={() => setClipboardOpen(false)} title="Overnight log" className="max-w-3xl mx-auto">
        <Clipboard>
          <div className="p-8 pb-12 bg-white text-foreground">
            <div className="border-b-2 border-foreground pb-4 mb-6">
                <h2 className="text-2xl font-bold font-sans tracking-widest text-center">Overnight log</h2>
                <p className="text-center font-mono text-muted-foreground mt-1 uppercase">Night team to morning</p>
            </div>
            
            <div className="space-y-6">
              {OVERNIGHT_LOG.map((entry) => {
                const isRead = logRead.includes(entry.time);
                return (
                  <button
                    key={entry.time}
                    onClick={() => {
                      if (!isRead) {
                        kitchenAudio.play('confirm');
                        onLogRead(entry.time);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-4 border rounded transition-all duration-300 relative group overflow-hidden focus-visible:ring-2 focus-visible:ring-primary outline-none",
                      isRead 
                        ? "bg-zinc-50 border-border text-foreground/80 shadow-inner" 
                        : "bg-white border-primary/40 shadow hover:border-primary hover:shadow-md cursor-pointer"
                    )}
                  >
                    {!isRead && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-primary group-hover:w-2 transition-all" />
                    )}
                    <div className={cn("font-mono text-sm font-bold mb-2", isRead ? "text-muted-foreground" : "text-primary")}>
                      {entry.time}
                    </div>
                    <div className={cn("text-lg", !isRead && "font-medium text-foreground")}>
                      {isRead ? entry.text : <span className="opacity-50 italic">Read this entry</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Clipboard>
      </CloseUp>
    </div>
  );
}
