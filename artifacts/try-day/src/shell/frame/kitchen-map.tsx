import { useEffect, useRef } from "react";
import { useKitchen, MAP_ENTER_MS } from "./kitchen-context";
import { useProgress } from "@shell/lib/progress-store";
import { useClient } from "@shell/app/client-context";
import type { TaskId } from "@shell/lib/day";
import { motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "./use-focus-trap";
import { isTopOverlay } from "./overlay-stack";
import { X, MapPin } from "lucide-react";
import { cn } from "@kit/lib/utils";
import { kitchenAudio } from "@kit/lib/audio";

/** The paper colour of the map picture, so the page around it looks like more of the same sheet. */
const MAP_PAPER = "#F4EFE6";
/** How far the map dives into a pin before the room is fully there. */
const ENTER_SCALE = 3.4;

/**
 * The whole kitchen on one sheet. It fills the screen; leaving it dives into
 * the pin for the room you are in, and the room is there underneath.
 */
export function KitchenMap({ taskId }: { taskId: TaskId }) {
  const { place, mapPhase, establishing, walk, closeMap, goTo, route } =
    useKitchen();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = mapPhase === "open";
  // The trap covers the whole sheet, close button included, so Tab always reaches Close
  // (a one-room task has no other pin to land on).
  useFocusTrap(dialogRef, open && !establishing, true);
  const { progress } = useProgress();
  const { workplace } = useClient();
  const { places: PLACES, map: { image: MAP_IMAGE, alt: MAP_ALT, crossing: MAP_CROSSING } } = workplace;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only while nothing sits on top of the map ("How do I do this?" opens above it).
      if (e.key === "Escape" && open && (establishing || isTopOverlay(dialogRef.current))) {
        e.stopPropagation();
        closeMap();
      }
    };
    if (open) window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, establishing, closeMap]);

  if (mapPhase === "closed") return null;

  const initials = progress.initials || "You";
  const taskRoute = workplace.taskRoutes[taskId];
  const walking = mapPhase === "walking";
  const entering = mapPhase === "entering";
  // The pin the map dives into (and rises out of): where the student is standing.
  const focus = PLACES[place].map;
  const here = walking && walk ? walk.from : place;
  const heading =
    walking && walk
      ? `Walking to ${PLACES[walk.to].name.toLowerCase()}…`
      : establishing
        ? `You're at ${PLACES[place].name.toLowerCase()}`
        : "Where do you want to go?";

  return (
    <motion.div
      key="map"
      initial={{ opacity: establishing ? 1 : 0 }}
      animate={{ opacity: entering ? 0 : 1 }}
      transition={{
        duration: entering ? MAP_ENTER_MS / 1000 : 0.25,
        ease: entering ? [0.7, 0, 0.9, 0.4] : "easeOut",
      }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden",
        entering && "pointer-events-none",
      )}
      style={{ backgroundColor: MAP_PAPER }}
      onClick={(e) => {
        // The paper around the sheet (or anywhere at all during the opening shot) takes you back into the room.
        if (establishing || !(e.target as HTMLElement).closest("[data-map-sheet]")) closeMap();
      }}
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="map-title"
    >
      {/* The sheet sits under a top bar the height of the app header, centred in what is left */}
      <div className="flex-1 flex items-center justify-center pt-14">
        <motion.div
          initial={
            establishing || reduceMotion ? false : { scale: 2.4, opacity: 0.6 }
          }
          animate={{
            scale: entering && !reduceMotion ? ENTER_SCALE : 1,
            opacity: 1,
          }}
          transition={
            entering
              ? { duration: MAP_ENTER_MS / 1000, ease: [0.55, 0, 0.85, 0.35] }
              : { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }
          }
          style={{ transformOrigin: `${focus.x}% ${focus.y}%` }}
          data-map-sheet
          className="relative shrink-0 w-[min(100vw,calc(100dvh-3.5rem))] h-[min(100vw,calc(100dvh-3.5rem))]"
        >
          <img
            src={MAP_IMAGE}
            alt={MAP_ALT}
            className="w-full h-full object-cover select-none pointer-events-none"
            decoding="async"
          />

          {/* Pins */}
          {Object.keys(PLACES).map((pId) => {
            const p = PLACES[pId];
            const inRoute = route.includes(pId);
            const isHere = pId === here;
            const canGo = inRoute && !isHere && open && !establishing;
            const hidden = walking && pId === walk?.from;

            return (
              <div
                key={pId}
                className={cn(
                  "absolute group transform -translate-x-1/2 -translate-y-1/2",
                  hidden && "opacity-0",
                )}
                style={{ left: `${p.map.x}%`, top: `${p.map.y}%` }}
              >
                <button
                  type="button"
                  disabled={!canGo}
                  onClick={(e) => {
                    e.stopPropagation();
                    kitchenAudio.play("tap");
                    goTo(pId);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isHere
                      ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10"
                      : canGo
                        ? "bg-white text-foreground hover:scale-110 shadow-md border-2 border-primary cursor-pointer animate-pulse motion-reduce:animate-none"
                        : inRoute
                          ? "bg-white text-foreground border-2 border-primary/60 shadow"
                          : "bg-white/60 text-foreground/50 border border-border cursor-not-allowed",
                  )}
                  aria-label={
                    isHere
                      ? `${p.name} (you are here)`
                      : inRoute
                        ? `Go to ${p.name.toLowerCase()}`
                        : `${p.name}: Nothing to do here yet`
                  }
                >
                  {isHere ? (
                    <span className="font-bold text-xs">{initials}</span>
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </button>

                {/* Always-on name under the pins on this task's route; other rooms only on hover */}
                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-sm shadow-sm pointer-events-none transition-opacity",
                    isHere
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/90 text-foreground",
                    inRoute
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  )}
                >
                  {p.name}
                </div>

                {/* What is waiting there */}
                {!walking && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-foreground text-background text-xs p-2 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity z-20 text-center shadow-lg">
                    {!inRoute && <p className="font-bold mb-1">{p.name}</p>}
                    <p className="text-white/80">
                      {inRoute
                        ? taskRoute.whatIsHere[pId] || p.description
                        : "Nothing to do here yet"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* The student crossing the map */}
          {walking && walk && (
            <motion.div
              className="absolute w-9 h-9 -ml-[18px] -mt-[18px] bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center font-bold text-xs z-30 pointer-events-none"
              initial={{
                left: `${PLACES[walk.from].map.x}%`,
                top: `${PLACES[walk.from].map.y}%`,
              }}
              animate={{
                left: [
                  `${PLACES[walk.from].map.x}%`,
                  `${MAP_CROSSING.x}%`,
                  `${PLACES[walk.to].map.x}%`,
                ],
                top: [
                  `${PLACES[walk.from].map.y}%`,
                  `${MAP_CROSSING.y}%`,
                  `${PLACES[walk.to].map.y}%`,
                ],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                times: [0, 0.5, 1],
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
        </motion.div>
      </div>

      {/* Caption and close, outside the zooming sheet so they stay readable */}
      <motion.div
        animate={{ opacity: entering ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 top-0 h-14 flex items-center justify-between px-4 sm:px-6 pointer-events-none"
      >
        <div className="flex items-baseline gap-3 min-w-0" id="map-title">
          <span className="text-xs font-bold uppercase tracking-widest text-primary shrink-0">
            Map
          </span>
          <span
            className={cn(
              "font-bold text-foreground truncate",
              walking && "animate-pulse motion-reduce:animate-none",
            )}
            aria-live="polite"
          >
            {heading}
          </span>
        </div>
        {open && !establishing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              kitchenAudio.play("tap");
              closeMap();
            }}
            className="pointer-events-auto bg-white p-2 rounded-full shadow hover:bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Close the map"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </motion.div>
      <motion.p
        animate={{ opacity: entering ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 bottom-3 flex items-center justify-center text-sm text-muted-foreground px-4 text-center pointer-events-none"
      >
        {walking
          ? ""
          : establishing
            ? "Going in…"
            : "Choose where to go"}
      </motion.p>
    </motion.div>
  );
}

export function MiniMap() {
  const { place, openMap } = useKitchen();
  const { workplace: { places: PLACES, map: { image: MAP_IMAGE } } } = useClient();
  const p = PLACES[place];

  return (
    <button
      onClick={() => {
        kitchenAudio.play("page");
        openMap();
      }}
      className="relative w-16 h-16 rounded overflow-hidden border border-border shadow-sm hover:border-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary flex flex-col items-center justify-center bg-zinc-200"
      aria-label="Open the map"
    >
      <img
        src={MAP_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale"
      />
      <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
      <div
        className="absolute w-3 h-3 bg-primary rounded-full shadow border border-white transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${p.map.x}%`, top: `${p.map.y}%` }}
      />
      <span className="relative mt-auto mb-1 text-xs font-bold uppercase tracking-widest text-foreground/80 bg-white/80 px-1.5 rounded-sm">
        Map
      </span>
    </button>
  );
}
