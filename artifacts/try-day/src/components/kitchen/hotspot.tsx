import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { kitchenAudio } from '@/lib/audio';
import { Check } from 'lucide-react';
import { useKitchen } from './kitchen-context';

/** Objects appear one after another once the student is in the room (ms after arrival). */
export const OBJECTS_APPEAR_AFTER_MS = 1100;
export const OBJECT_STAGGER_MS = 140;

/** Seconds until something that arrives `index`-th in the room should show, measured from now. */
export function arrivalDelay(arrivedAt: number, index: number, reduceMotion: boolean | null) {
  if (reduceMotion || !arrivedAt) return 0;
  return Math.max(0, arrivedAt + OBJECTS_APPEAR_AFTER_MS + index * OBJECT_STAGGER_MS - Date.now()) / 1000;
}

interface HotspotProps {
  x: number; // percentage
  y: number; // percentage
  label: string;
  hint?: string;
  state?: 'todo' | 'active' | 'done' | 'locked';
  onClick?: () => void;
  className?: string;
}

export function Hotspot({ x, y, label, hint, state = 'todo', onClick, className }: HotspotProps) {
  const isClickable = state !== 'locked' && onClick;
  const { arrivedAt, claimArrivalIndex } = useKitchen();
  const reduceMotion = useReducedMotion();
  // Each object takes the next place in the room's arrival order the first time it renders after an arrival.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const index = useMemo(() => claimArrivalIndex(), [arrivedAt]);
  const delay = arrivalDelay(arrivedAt, index, reduceMotion);

  const handleClick = () => {
    if (!isClickable) return;
    kitchenAudio.play('tap');
    onClick();
  };

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
        disabled={!isClickable}
        onClick={handleClick}
        className={cn(
          "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all relative outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2",
          state === 'active' && "border-primary bg-primary/20 text-primary scale-110",
          state === 'todo' && "border-white bg-black/40 text-white hover:bg-black/60 hover:scale-105",
          state === 'done' && "border-white/50 bg-black/20 text-white/80 hover:bg-black/40",
          state === 'locked' && "border-white/30 bg-transparent text-transparent cursor-not-allowed",
          isClickable && "cursor-pointer"
        )}
        aria-label={`${label}${hint ? ` - ${hint}` : ''}${state === 'done' ? ' (Done)' : ''}`}
      >
        {state === 'active' && (
          <span className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping motion-reduce:animate-none" />
        )}
        {state === 'done' && <Check className="w-5 h-5" />}
        {(state === 'todo' || state === 'active') && <span className="w-3 h-3 rounded-full bg-current" />}
      </button>

      {/* Tooltip */}
      <div className={cn(
        "absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap pointer-events-none transition-opacity duration-200",
        state === 'active' ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      )}>
        <div className="bg-foreground text-background px-3 py-1.5 rounded text-sm font-bold shadow-lg">
          {label}
        </div>
        {hint && (
          <div className="bg-background text-foreground/80 border border-border px-2 py-1 rounded text-xs text-center mt-1 shadow">
            {hint}
          </div>
        )}
      </div>
    </motion.div>
  );
}
