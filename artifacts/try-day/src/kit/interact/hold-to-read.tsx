import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@kit/lib/utils';
import { kitchenAudio } from '@kit/lib/audio';

export interface HoldToReadProps {
  target: number;
  label: string;
  unit?: string;
  settleMs?: number;
  disabled?: boolean;
  onSettled?: (value: number) => void;
  onRelease?: (value: number, settled: boolean) => void;
  className?: string;
  children?: ReactNode;
  hintReleasedEarly?: string;
  /** Said before the first press, so nobody has to fail a short tap to learn it needs holding. */
  hintIdle?: string;
}

export function HoldToRead({
  target,
  label,
  unit = '°C',
  settleMs = 2600,
  disabled = false,
  onSettled,
  onRelease,
  className,
  children,
  hintReleasedEarly = 'Hold it in until it settles',
  hintIdle,
}: HoldToReadProps) {
  const seconds = Math.max(1, Math.round(settleMs / 1000));
  const idleHint = hintIdle ?? `Press and hold for about ${seconds} seconds until it settles`;
  const [state, setState] = useState<'idle' | 'holding' | 'settled'>('idle');
  const [reading, setReading] = useState(target);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const readingRef = useRef(target);
  const stateRef = useRef<'idle' | 'holding' | 'settled'>('idle');
  const settledCallback = useRef(onSettled);
  settledCallback.current = onSettled;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    stopTimer();
    readingRef.current = target;
    stateRef.current = 'idle';
    setReading(target);
    setProgress(0);
    setState('idle');
    setShowHint(false);
  }, [stopTimer, target]);

  useEffect(() => stopTimer, [stopTimer]);

  const start = useCallback(() => {
    if (disabled || stateRef.current === 'holding' || stateRef.current === 'settled') return;
    setShowHint(false);
    stateRef.current = 'holding';
    setState('holding');
    startedAt.current = performance.now();
    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAt.current;
      const nextProgress = Math.min(1, elapsed / settleMs);
      setProgress(nextProgress);
      if (elapsed >= settleMs) {
        stopTimer();
        readingRef.current = target;
        setReading(target);
        stateRef.current = 'settled';
        setState('settled');
        kitchenAudio.play('probe');
        settledCallback.current?.(target);
        return;
      }
      const noise = (Math.random() * 4 - 2) * Math.exp(-elapsed / (settleMs / 4));
      readingRef.current = target + noise;
      setReading(readingRef.current);
    }, 100);
  }, [disabled, settleMs, stopTimer, target]);

  const release = useCallback(() => {
    if (stateRef.current !== 'holding' && stateRef.current !== 'settled') return;
    const wasSettled = stateRef.current === 'settled';
    stopTimer();
    onRelease?.(readingRef.current, wasSettled);
    if (!wasSettled) {
      stateRef.current = 'idle';
      setState('idle');
      setShowHint(true);
    }
  }, [onRelease, stopTimer]);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)} data-state={state}>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={(event) => {
          if (event.key !== ' ' && event.key !== 'Enter') return;
          event.preventDefault();
          // A held key auto-repeats keydown; only the first press starts the hold. Releasing
          // happens on keyup, and the toggle link below serves anyone who cannot hold a key.
          if (event.repeat) return;
          if (stateRef.current === 'idle') start();
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (stateRef.current === 'holding' || stateRef.current === 'settled') {
               release();
            }
          }
        }}
        className="relative flex select-none items-center gap-4 rounded-xl border-2 border-border bg-background px-4 py-3 text-left text-foreground shadow-sm outline-none transition-transform active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        aria-label={`${label}. Press and hold until the reading settles`}
      >
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-16 w-16 -rotate-90 text-primary" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          {/* Nothing to read until it is held in: the number only exists while the probe is in the food. */}
          <span className="relative font-mono text-sm font-bold tabular-nums">{state === 'idle' ? '--.-' : reading.toFixed(1)}</span>
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-bold leading-tight">{children ?? label}</span>
          <span className={cn('mt-0.5 text-xs', state === 'idle' ? 'text-foreground/70' : 'text-muted')}>
            {state === 'settled' ? `Settled at ${reading.toFixed(1)} ${unit}` : state === 'holding' ? 'Keep holding, it is settling' : idleHint}
          </span>
        </span>
      </button>
      {!disabled && (
        <button
          type="button"
          onClick={() => {
            if (stateRef.current === 'idle') {
              start();
            } else if (stateRef.current === 'holding' || stateRef.current === 'settled') {
              release();
            }
          }}
          className="text-xs font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
        >
          {state === 'idle' ? 'Or start without holding' : 'Stop the reading'}
        </button>
      )}
      {showHint && <span className="text-sm font-medium text-primary">{hintReleasedEarly}</span>}
      <span className="sr-only" aria-live="polite">
        {state === 'settled' ? `Reading settled: ${target.toFixed(1)} ${unit}` : showHint ? hintReleasedEarly : ''}
      </span>
    </div>
  );
}