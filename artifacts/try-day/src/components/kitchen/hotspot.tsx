import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { kitchenAudio } from '@/lib/audio';
import { Check, Lock } from 'lucide-react';
import { useKitchen } from './kitchen-context';

/** Objects appear one after another once the student is in the room (ms after arrival). */
export const OBJECTS_APPEAR_AFTER_MS = 1100;
export const OBJECT_STAGGER_MS = 140;
/** How long every label stays up after the objects have appeared, so the room explains itself on arrival. */
export const LABELS_SHOWN_FOR_MS = 4000;

/** Seconds until something that arrives `index`-th in the room should show, measured from now. */
export function arrivalDelay(arrivedAt: number, index: number, reduceMotion: boolean | null) {
  if (reduceMotion || !arrivedAt) return 0;
  return Math.max(0, arrivedAt + OBJECTS_APPEAR_AFTER_MS + index * OBJECT_STAGGER_MS - Date.now()) / 1000;
}

interface HotspotProps {
  x: number; // percentage
  y: number; // percentage
  label: string;
  /** For a locked spot, the reason it is locked ("Portion the beef first"); otherwise a short nudge. */
  hint?: string;
  state?: 'todo' | 'active' | 'done' | 'locked';
  onClick?: () => void;
  className?: string;
}

export function Hotspot({ x, y, label, hint, state = 'todo', onClick, className }: HotspotProps) {
  const locked = state === 'locked';
  const isClickable = !locked && !!onClick;
  const { arrivedAt, claimArrivalIndex } = useKitchen();
  const reduceMotion = useReducedMotion();
  // Each object takes the next place in the room's arrival order the first time it renders after an arrival.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const index = useMemo(() => claimArrivalIndex(), [arrivedAt]);
  const delay = arrivalDelay(arrivedAt, index, reduceMotion);

  // Labels show for a few seconds once the spot has appeared, then only on hover or focus.
  const [arriving, setArriving] = useState(true);
  useEffect(() => {
    setArriving(true);
    const timer = window.setTimeout(() => setArriving(false), delay * 1000 + LABELS_SHOWN_FOR_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedAt]);

  // Tapping a locked spot shows its reason, which is how a phone user asks "why not?". The
  // reason stays until the spot unlocks or is tapped again, so there is time to read it.
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    if (!locked) setAsked(false);
  }, [locked]);

  const handleClick = () => {
    if (!isClickable) {
      if (locked && hint) setAsked((was) => !was);
      return;
    }
    kitchenAudio.play('tap');
    onClick();
  };

  // Labels near the edge of the room hang from the spot's side instead of its centre, so they stay on screen.
  const align = x <= 35 ? 'start' : x >= 65 ? 'end' : 'centre';
  const labelShown = state === 'active' || arriving || asked;
  // The reason under a locked spot waits for a hover, focus or tap; on arrival only the labels show, so they do not pile up on a phone.
  const hintShown = Boolean(hint) && (state === 'active' || asked);

  const description = locked && hint ? `${label}. Not yet: ${hint}` : `${label}${hint ? ` - ${hint}` : ''}${state === 'done' ? ' (Done)' : ''}`;

  return (
    <motion.div
      key={arrivedAt}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn("absolute group z-10", className)}
      // y is a share of the room above the dialogue bar, so nothing ends up under it
      style={{ left: `${x}%`, top: `calc(${y}% - ${y / 100} * var(--dialogue-h, 0px))`, x: '-50%', y: '-50%' }}
    >
      <button
        type="button"
        // Locked spots stay focusable so keyboard users can read why they are locked.
        aria-disabled={!isClickable || undefined}
        onClick={handleClick}
        data-state={state}
        className={cn(
          "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all relative outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2",
          state === 'active' && "border-primary bg-primary/20 text-primary scale-110",
          state === 'todo' && "border-white bg-black/40 text-white hover:bg-black/60 hover:scale-105",
          state === 'done' && "border-white/50 bg-black/20 text-white/80 hover:bg-black/40",
          locked && "border-dashed border-white/50 bg-black/30 text-white/70 cursor-not-allowed",
          isClickable && "cursor-pointer"
        )}
        aria-label={description}
      >
        {state === 'active' && (
          <span className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping motion-reduce:animate-none" />
        )}
        {state === 'done' && <Check className="w-5 h-5" />}
        {locked && <Lock className="w-4 h-4" aria-hidden="true" />}
        {(state === 'todo' || state === 'active') && <span className="w-3 h-3 rounded-full bg-current" />}
      </button>

      {/* Label: always for the active spot, briefly on arrival for the rest, and on hover, focus or tap */}
      <div
        data-testid="hotspot-label"
        data-shown={labelShown || undefined}
        className={cn(
          "absolute top-full mt-3 flex w-max max-w-[16rem] flex-col gap-1 pointer-events-none transition-opacity duration-200",
          align === 'start' && "left-1/2 -translate-x-6 items-start text-left",
          align === 'end' && "right-1/2 translate-x-6 items-end text-right",
          align === 'centre' && "left-1/2 -translate-x-1/2 items-center text-center",
          labelShown ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <div className={cn(
          "px-3 py-1.5 rounded text-sm font-bold shadow-lg whitespace-nowrap",
          locked ? "bg-zinc-800 text-white/80 border border-white/20" : "bg-foreground text-background",
        )}>
          {locked && <Lock className="inline-block w-3 h-3 mr-1.5 -mt-0.5" aria-hidden="true" />}
          {label}
        </div>
        {hint && (
          <div
            data-testid="hotspot-hint"
            className={cn(
              "bg-background text-foreground/80 border border-border px-2 py-1 rounded text-xs shadow",
              hintShown ? "block" : "hidden group-hover:block group-focus-within:block",
            )}
          >
            {hint}
          </div>
        )}
      </div>
      {/* Read out when a locked spot is pressed, since pressing it does nothing else. */}
      {locked && hint && (
        <span className="sr-only" aria-live="polite">
          {asked ? `Not yet: ${hint}` : ''}
        </span>
      )}
    </motion.div>
  );
}
