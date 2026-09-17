import { useEffect, useRef } from 'react';
import { useKitchen } from './kitchen-context';
import { useProgress } from '@/lib/progress-store';
import { PLACES, MAP_IMAGE, MAP_CROSSING, PlaceId, TASK_ROUTES } from '@/content/kitchen';
import { TaskId } from '@/content/activities';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useFocusTrap } from './use-focus-trap';
import { X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenAudio } from '@/lib/audio';

export function KitchenMap({ taskId }: { taskId: TaskId }) {
  const { place, mapOpen, closeMap, goTo, travelling, destination: target, route } = useKitchen();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, mapOpen && !travelling);
  const { progress } = useProgress();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mapOpen) {
        e.stopPropagation();
        closeMap();
      }
    };
    if (mapOpen) window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [mapOpen, closeMap]);

  if (!mapOpen && !travelling) return null;

  const initials = progress.initials || "You";

  const taskRoute = TASK_ROUTES[taskId];

  return (
    <AnimatePresence>
      {(mapOpen || travelling) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !travelling) closeMap(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Kitchen map"
        >
          <div ref={panelRef} tabIndex={-1} className="relative w-full max-w-3xl aspect-square bg-background rounded-sm overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
            {!travelling && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => { kitchenAudio.play('tap'); closeMap(); }}
                  className="bg-white/90 p-2 rounded-full shadow hover:bg-white text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  aria-label="Close map"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="relative flex-1 w-full h-full">
              <img src={MAP_IMAGE} alt="Isometric kitchen map" className="w-full h-full object-cover select-none pointer-events-none" decoding="async" />
              
              {/* Waypoints */}
              {(Object.keys(PLACES) as PlaceId[]).map((pId) => {
                const p = PLACES[pId];
                const inRoute = route.includes(pId);
                const isCurrent = pId === place;
                const active = inRoute && !isCurrent;
                
                return (
                  <div
                    key={pId}
                    className="absolute group transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.map.x}%`, top: `${p.map.y}%` }}
                  >
                    <button
                      type="button"
                      disabled={!active || travelling}
                      onClick={() => {
                        kitchenAudio.play('tap');
                        goTo(pId);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isCurrent && !travelling ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10" :
                        isCurrent && travelling ? "bg-white text-primary border-2 border-primary z-10" :
                        active ? "bg-white text-foreground hover:scale-110 shadow-md border-2 border-primary cursor-pointer animate-pulse" :
                        "bg-white/50 text-foreground/50 border border-border cursor-not-allowed"
                      )}
                      aria-label={p.name}
                    >
                      {isCurrent && !travelling ? <span className="font-bold text-xs">{initials}</span> : <MapPin className="w-4 h-4" />}
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-foreground text-background text-xs p-2 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity z-20 text-center shadow-lg">
                      <p className="font-bold mb-1">{p.name}</p>
                      <p className="text-white/80">
                        {inRoute ? taskRoute.whatIsHere[pId] || p.description : "Nothing for you there right now"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Travelling student marker */}
              {travelling && target && (
                <motion.div
                  className="absolute w-8 h-8 -ml-4 -mt-4 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center font-bold text-xs z-30 pointer-events-none"
                  initial={{ left: `${PLACES[place].map.x}%`, top: `${PLACES[place].map.y}%` }}
                  animate={{ 
                    left: [`${PLACES[place].map.x}%`, `${MAP_CROSSING.x}%`, `${PLACES[target].map.x}%`],
                    top: [`${PLACES[place].map.y}%`, `${MAP_CROSSING.y}%`, `${PLACES[target].map.y}%`]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "easeInOut",
                    times: [0, 0.5, 1] // midpoint crossing
                  }}
                >
                  <motion.div
                    animate={reduceMotion ? undefined : { y: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  >
                    {initials}
                  </motion.div>
                </motion.div>
              )}
            </div>
            
            <div className="bg-white p-4 border-t border-border flex items-center justify-between text-sm">
              <span className="font-bold">{PLACES[place].name}</span>
              {travelling ? (
                <span className="text-primary font-medium animate-pulse motion-reduce:animate-none">Walking to {PLACES[target!].name}...</span>
              ) : (
                <span className="text-muted-foreground">Select a pulsing location to walk there</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MiniMap() {
  const { place, openMap } = useKitchen();
  const p = PLACES[place];
  
  return (
    <button 
      onClick={() => { kitchenAudio.play('page'); openMap(); }}
      className="relative w-16 h-16 rounded overflow-hidden border border-border shadow-sm hover:border-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center bg-zinc-200"
      aria-label="Open kitchen map"
    >
      <img src={MAP_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale" />
      <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
      <div 
        className="absolute w-3 h-3 bg-primary rounded-full shadow border border-white transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${p.map.x}%`, top: `${p.map.y}%` }}
      />
    </button>
  );
}
