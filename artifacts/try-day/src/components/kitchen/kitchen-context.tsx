import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { TASK_ROUTES, PlaceId, PLACES, DayLight, type Person } from '@/content/kitchen';
import { TaskId } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { kitchenAudio } from '@/lib/audio';

/**
 * The map is a full-screen picture of the kitchen that the room "zooms out of" and
 * "zooms back into":
 *  - closed:    the student is in a room, no map on screen
 *  - open:      looking at the map, can pick where to go
 *  - walking:   the marker is crossing the map from `walk.from` to `walk.to`
 *  - entering:  the map is diving into the current place's pin and fading away
 */
export type MapPhase = 'closed' | 'open' | 'walking' | 'entering';

export interface Walk {
  from: PlaceId;
  to: PlaceId;
}

interface KitchenContextValue {
  place: PlaceId;
  route: PlaceId[];
  light: DayLight;
  mapPhase: MapPhase;
  /** True from the first frame of a task until the opening map shot has zoomed into the room. */
  establishing: boolean;
  /** The walk in progress while `mapPhase === 'walking'`. */
  walk: Walk | null;
  /** Kept for convenience: any map phase other than closed. */
  mapOpen: boolean;
  travelling: boolean;
  goTo: (to: PlaceId) => void;
  openMap: () => void;
  closeMap: () => void;
  notepadOpen: boolean;
  openNotepad: () => void;
  closeNotepad: () => void;
  /** People the current scene is drawing on screen, so the frame does not draw them a second time. */
  present: Presence[];
  registerPresent: (presence: Presence) => () => void;
  /**
   * When the student last arrived in a room (ms since epoch): the moment the map
   * finished diving in, or the first frame when there was no map shot. Objects in
   * the room time their entrance from it.
   */
  arrivedAt: number;
  /** Claim the next place in the room's arrival order (0, 1, 2…); resets on each arrival. */
  claimArrivalIndex: () => number;
  /**
   * True while the student has stepped up to something in the room (the bench, the
   * chiller) and needs the whole stage for it. The character steps out of the way.
   */
  working: boolean;
  setWorking: (on: boolean) => void;
  pendingAction: { place: PlaceId; action: string } | null;
  openWorkspace: (place: PlaceId, action: string) => void;
  clearAction: () => void;
}

export interface Presence {
  person: Person['id'];
  /**
   * Where the drawn character stands, as a percentage of stage width, so the
   * speech bubble can sit beside them instead of on top of them (desktop only).
   */
  bubbleFrom?: number;
}

/** How long the map spends diving into a pin before the room is fully there. */
export const MAP_ENTER_MS = 400;
/** How long the opening shot of the map holds before it dives into the start room. */
export const MAP_ESTABLISH_MS = 2200;

const KitchenContext = createContext<KitchenContextValue | null>(null);

export function KitchenProvider({ taskId, frozen = false, children }: { taskId: TaskId; frozen?: boolean; children: ReactNode }) {
  const { advanceClock } = useProgress();
  const routeConfig = TASK_ROUTES[taskId];

  const mql = useRef(typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null);
  const reduceMotion = mql.current?.matches ?? false;
  // A signed-off task and a reduced-motion student both open straight in the room.
  // The map remains available, but getting started never requires sitting through it.
  const showEstablishingShot = false;

  const [place, setPlace] = useState<PlaceId>(routeConfig.start);
  const [mapPhase, setMapPhase] = useState<MapPhase>(showEstablishingShot ? 'open' : 'closed');
  const [establishing, setEstablishing] = useState(showEstablishingShot);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ place: PlaceId; action: string } | null>(null);
  const [arrivedAt, setArrivedAt] = useState(() => (showEstablishingShot ? 0 : Date.now()));
  const arrivalCounter = useRef(0);
  const arrivalStamp = useRef(arrivedAt);
  const claimArrivalIndex = useCallback(() => {
    if (arrivalStamp.current !== arrivedAt) {
      arrivalStamp.current = arrivedAt;
      arrivalCounter.current = 0;
    }
    return arrivalCounter.current++;
  }, [arrivedAt]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    // Reset to start place if task changes (should normally unmount anyway)
    setPlace(routeConfig.start);
  }, [taskId, routeConfig.start]);

  /** Dive from the map into the current room, then take the map away. */
  const enterRoom = useCallback(() => {
    if (reduceMotion) {
      setMapPhase('closed');
      setEstablishing(false);
      setArrivedAt(Date.now());
      return;
    }
    setMapPhase('entering');
    later(() => {
      setMapPhase('closed');
      setEstablishing(false);
      setArrivedAt(Date.now());
    }, MAP_ENTER_MS);
  }, [reduceMotion, later]);

  // The opening shot: hold on the map with the student's marker on the start room, then dive in.
  useEffect(() => {
    // Clicking the map early moves the phase on, which clears this timer.
    if (!establishing || mapPhase !== 'open') return;
    const t = later(() => enterRoom(), MAP_ESTABLISH_MS);
    return () => clearTimeout(t);
  }, [establishing, mapPhase, enterRoom, later]);

  const goTo = useCallback((to: PlaceId) => {
    if (frozen || to === place || mapPhase === 'walking' || mapPhase === 'entering' || !routeConfig.places.includes(to)) return;

    setNotepadOpen(false);
    setPendingAction(null);
    setEstablishing(false);

    if (reduceMotion) {
      advanceClock(1);
      setPlace(to);
      kitchenAudio.setPlace(to);
      setMapPhase('closed');
      setArrivedAt(Date.now());
      return;
    }

    const fromP = PLACES[place].map;
    const toP = PLACES[to].map;
    const dist = Math.hypot(toP.x - fromP.x, toP.y - fromP.y);
    // Scale the walk somewhat by distance
    const duration = Math.max(500, Math.min(900, dist * 12));

    setWalk({ from: place, to });
    setMapPhase('walking');
    kitchenAudio.footsteps(4, 380);
    // The room changes under the map while the marker walks, so the new room is
    // already there when the map dives into it.
    setPlace(to);

    later(() => {
      advanceClock(dist > 30 ? 2 : 1);
      kitchenAudio.setPlace(to);
      setWalk(null);
      enterRoom();
    }, duration);
  }, [frozen, place, mapPhase, routeConfig.places, advanceClock, reduceMotion, later, enterRoom]);

  const openMap = useCallback(() => {
    setMapPhase((phase) => (phase === 'closed' ? 'open' : phase));
  }, []);
  const closeMap = useCallback(() => {
    if (mapPhase !== 'open') return;
    enterRoom();
  }, [mapPhase, enterRoom]);
  const openNotepad = useCallback(() => setNotepadOpen(true), []);
  const closeNotepad = useCallback(() => setNotepadOpen(false), []);
  const clearAction = useCallback(() => setPendingAction(null), []);
  const openWorkspace = useCallback((to: PlaceId, action: string) => {
    if (frozen || !routeConfig.places.includes(to) || mapPhase === 'walking' || mapPhase === 'entering') return;
    setNotepadOpen(false);
    if (to !== place) goTo(to);
    else if (mapPhase === 'open') closeMap();
    setPendingAction({ place: to, action });
  }, [frozen, routeConfig.places, mapPhase, place, goTo, closeMap]);

  const [working, setWorking] = useState(false);
  useEffect(() => { setWorking(false); }, [place]);

  const [present, setPresent] = useState<Presence[]>([]);
  const registerPresent = useCallback((presence: Presence) => {
    setPresent((prev) => [...prev, presence]);
    return () => setPresent((prev) => prev.filter((p) => p !== presence));
  }, []);

  return (
    <KitchenContext.Provider
      value={{
        place,
        route: routeConfig.places,
        light: routeConfig.light,
        mapPhase,
        establishing,
        walk,
        mapOpen: mapPhase !== 'closed',
        travelling: mapPhase === 'walking',
        goTo,
        openMap,
        closeMap,
        notepadOpen,
        openNotepad,
        closeNotepad,
        present,
        registerPresent,
        arrivedAt,
        claimArrivalIndex,
        working,
        setWorking,
        pendingAction,
        openWorkspace,
        clearAction,
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

/** Open the real scene control once the destination room has finished entering. */
export function useKitchenAction(action: string, handler: () => void) {
  const { pendingAction, place, mapPhase, clearAction } = useKitchen();
  const latest = useRef(handler);
  latest.current = handler;
  const handled = useRef<typeof pendingAction>(null);
  useEffect(() => {
    if (!pendingAction || handled.current === pendingAction || pendingAction.action !== action
      || pendingAction.place !== place || mapPhase !== 'closed') return;
    handled.current = pendingAction;
    latest.current();
    clearAction();
  }, [pendingAction, place, mapPhase, action, clearAction]);
}

/**
 * Tell the frame which characters this scene draws itself (the driver by his van).
 * While the scene is mounted the frame does not stand that person in the usual
 * spot beside the dialogue bar. (`bubbleFrom` is kept for older scenes; the bar
 * no longer moves.)
 */
export function usePresent(person: Person['id'], bubbleFrom?: number) {
  const { registerPresent } = useKitchen();
  useEffect(() => registerPresent({ person, bubbleFrom }), [registerPresent, person, bubbleFrom]);
}
