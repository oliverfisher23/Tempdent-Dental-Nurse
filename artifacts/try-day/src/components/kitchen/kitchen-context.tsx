import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
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
  /**
   * Guide actions whose workspace is open on screen right now, as reported by the
   * scenes, so the step guide can say "you're here" instead of offering to open it again.
   */
  openWorkspaces: string[];
  reportWorkspace: (action: string, open: boolean) => void;
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
  const { advanceClock, progress, setPosition } = useProgress();
  const routeConfig = TASK_ROUTES[taskId];
  // A reload puts the learner back in the room they were in, with the same workspace open.
  // Task 1 is the exception: its round resumes from the saved rows by itself, and re-sending
  // its action would open a fridge door the learner has not opened.
  const [saved] = useState(() => {
    const position = progress.positions[taskId];
    const place = position && routeConfig.places.includes(position.place as PlaceId) ? (position.place as PlaceId) : routeConfig.start;
    const restoresWorkspace = taskId !== 'take-the-handover';
    return { place, workspace: restoresWorkspace && position?.place === place ? position.workspace : null };
  });

  const reduceMotion = useReducedMotion() ?? false;
  // A signed-off task and a reduced-motion student both open straight in the room.
  // The map remains available, but getting started never requires sitting through it.
  const showEstablishingShot = false;

  const [place, setPlace] = useState<PlaceId>(saved.place);
  const [mapPhase, setMapPhase] = useState<MapPhase>(showEstablishingShot ? 'open' : 'closed');
  const [establishing, setEstablishing] = useState(showEstablishingShot);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [notepadOpen, setNotepadOpen] = useState(false);
  // The saved workspace is re-opened the same way the step guide opens one: the scene
  // picks the action up once the room is on screen (see useKitchenAction).
  const [pendingAction, setPendingAction] = useState<{ place: PlaceId; action: string } | null>(
    saved.workspace ? { place: saved.place, action: saved.workspace } : null,
  );

  // Auto-clear pending action if it doesn't get picked up by the destination
  useEffect(() => {
    if (pendingAction && mapPhase === 'closed' && place === pendingAction.place) {
      const timer = setTimeout(() => {
        setPendingAction(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pendingAction, mapPhase, place]);
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

  // Reset to the start place if the task changes under the provider (it should normally
  // unmount instead). Not on mount: that would undo a restored position.
  const mountedFor = useRef(taskId);
  useEffect(() => {
    if (mountedFor.current === taskId) return;
    mountedFor.current = taskId;
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

  const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([]);
  const reportWorkspace = useCallback((action: string, open: boolean) => {
    setOpenWorkspaces((prev) => {
      const has = prev.includes(action);
      if (open === has) return prev;
      return open ? [...prev, action] : prev.filter((a) => a !== action);
    });
  }, []);

  // Remember the room and the open workspace once the learner has actually arrived,
  // never mid-walk. After a reload the saved workspace is kept until the scene reports
  // it open again, so an early save cannot replace it with "nothing open"; if the scene
  // never re-opens it (or the learner moves on), what is actually open is saved instead.
  const [restoringAction, setRestoringAction] = useState(saved.workspace);
  useEffect(() => {
    if (!restoringAction) return;
    const timer = setTimeout(() => setRestoringAction(null), 5000);
    return () => clearTimeout(timer);
  }, [restoringAction]);
  useEffect(() => {
    if (mapPhase !== 'closed' || establishing) return;
    const workspace = openWorkspaces[openWorkspaces.length - 1] ?? null;
    if (restoringAction) {
      if (place === saved.place && workspace !== restoringAction) return;
      setRestoringAction(null);
    }
    setPosition(taskId, { place, workspace });
  }, [taskId, place, mapPhase, establishing, openWorkspaces, restoringAction, saved.place, setPosition]);

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
        openWorkspaces,
        reportWorkspace,
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
 * Tell the step guide that the workspace its action opens is on screen. Pass the
 * exact action string while the workspace is open and null when it is not, e.g.
 * `useWorkspaceOpen(view === 'chiller' ? 'chill:chiller' : null)`.
 */
export function useWorkspaceOpen(action: string | null | undefined) {
  const { reportWorkspace } = useKitchen();
  useEffect(() => {
    if (!action) return undefined;
    reportWorkspace(action, true);
    return () => reportWorkspace(action, false);
  }, [action, reportWorkspace]);
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
