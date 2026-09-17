import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { TASK_ROUTES, PlaceId, PLACES, DayLight, MAP_CROSSING } from '@/content/kitchen';
import { TaskId } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { kitchenAudio } from '@/lib/audio';

interface KitchenContextValue {
  place: PlaceId;
  route: PlaceId[];
  light: DayLight;
  travelling: boolean;
  /** Where the student is walking to while travelling. */
  destination: PlaceId | null;
  goTo: (to: PlaceId) => void;
  mapOpen: boolean;
  openMap: () => void;
  closeMap: () => void;
  notepadOpen: boolean;
  openNotepad: () => void;
  closeNotepad: () => void;
}

const KitchenContext = createContext<KitchenContextValue | null>(null);

export function KitchenProvider({ taskId, frozen = false, children }: { taskId: TaskId; frozen?: boolean; children: ReactNode }) {
  const { advanceClock } = useProgress();
  const routeConfig = TASK_ROUTES[taskId];
  const [place, setPlace] = useState<PlaceId>(routeConfig.start);
  const [travelling, setTravelling] = useState(false);
  const [destination, setDestination] = useState<PlaceId | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (travelTimer.current) clearTimeout(travelTimer.current); }, []);
  const [notepadOpen, setNotepadOpen] = useState(false);
  
  const mql = useRef(typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null);
  const reduceMotion = mql.current?.matches ?? false;

  useEffect(() => {
    // Reset to start place if task changes (should normally unmount anyway)
    setPlace(routeConfig.start);
  }, [taskId, routeConfig.start]);

  const goTo = useCallback((to: PlaceId) => {
    if (frozen || to === place || travelling || !routeConfig.places.includes(to)) return;

    setMapOpen(false);
    setNotepadOpen(false);
    
    if (reduceMotion) {
      advanceClock(1);
      setPlace(to);
      kitchenAudio.setPlace(to);
      return;
    }

    setDestination(to);
    setTravelling(true);
    kitchenAudio.footsteps(4, 380);
    
    // Scale duration somewhat by distance
    const fromP = PLACES[place].map;
    const toP = PLACES[to].map;
    const dist = Math.hypot(toP.x - fromP.x, toP.y - fromP.y);
    const duration = Math.max(1200, Math.min(2000, dist * 25));
    
    travelTimer.current = setTimeout(() => {
      advanceClock(dist > 30 ? 2 : 1);
      setPlace(to);
      kitchenAudio.setPlace(to);
      setTravelling(false);
      setDestination(null);
    }, duration);
  }, [frozen, place, travelling, routeConfig.places, advanceClock, reduceMotion]);

  const openMap = useCallback(() => setMapOpen(true), []);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const openNotepad = useCallback(() => setNotepadOpen(true), []);
  const closeNotepad = useCallback(() => setNotepadOpen(false), []);

  return (
    <KitchenContext.Provider
      value={{
        place,
        route: routeConfig.places,
        light: routeConfig.light,
        travelling,
        destination,
        goTo,
        mapOpen,
        openMap,
        closeMap,
        notepadOpen,
        openNotepad,
        closeNotepad,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
}

export function useKitchen() {
  const ctx = useContext(KitchenContext);
  if (!ctx) throw new Error('useKitchen must be used within a KitchenProvider');
  return ctx;
}
