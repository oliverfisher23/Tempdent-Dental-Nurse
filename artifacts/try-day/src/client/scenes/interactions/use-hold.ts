import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { playSfx, stopSfx, type SfxName } from '@client/lib/sounds';

export interface HoldOptions {
  /** Compressed on-screen seconds the control must be held for. */
  seconds: number;
  /** Own pace: the control is a toggle (start, then finish) instead of a press-and-hold. */
  ownPace: boolean;
  /** While true a running hold is cancelled outright (no completion, no early line): the close-up shut, the answer given. */
  disabled: boolean;
  /** World sound looped while held. */
  sound: SfxName;
  /** Shown after an early release; nothing completes. */
  early: string;
  onStart?: () => void;
  onComplete: () => void;
}

export interface HoldControl {
  elapsed: number;
  active: boolean;
  early: string;
  /** What the one control should say: the caller's label, or "Finish hold" while an own-pace hold runs. */
  label: (control: string) => string;
  /** Props for the control: pointer and Space/Enter routes, or a plain start/finish click at own pace. */
  bind: {
    onClick?: () => void;
    onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp?: () => void;
    onPointerCancel?: () => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
  };
}

/**
 * A control held to the end of a compressed clock (the tap, the flush button, the chair). Letting go
 * early resets the clock and shows `early`; at own pace the same control is a start/finish toggle.
 */
export function useHold({ seconds, ownPace, disabled, sound, early: earlyLine, onStart, onComplete }: HoldOptions): HoldControl {
  const [elapsed, setElapsed] = useState(0);
  const [early, setEarly] = useState('');
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const holding = useRef(false);
  const progress = useRef(0);

  const halt = () => {
    holding.current = false;
    setActive(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = undefined;
    stopSfx(sound);
  };
  const stop = (commit: boolean) => {
    if (!holding.current) return;
    const done = commit || progress.current >= seconds;
    halt();
    if (done) {
      progress.current = seconds;
      setElapsed(seconds);
      onComplete();
    } else {
      progress.current = 0;
      setElapsed(0);
      setEarly(earlyLine);
    }
  };
  const start = () => {
    if (disabled || holding.current) return;
    holding.current = true;
    progress.current = 0;
    setElapsed(0);
    setActive(true);
    setEarly('');
    onStart?.();
    playSfx(sound);
    if (ownPace) return;
    const started = Date.now();
    timer.current = setInterval(() => {
      const next = Math.min(seconds, (Date.now() - started) / 1000);
      progress.current = next;
      setElapsed(next);
      if (next >= seconds) stop(true);
    }, 100);
  };

  // A hold that is disabled mid-way (the close-up shut, the route judged) is dropped, not completed or scolded.
  useEffect(() => {
    if (!disabled || !holding.current) return;
    halt();
    progress.current = 0;
    setElapsed(0);
  });
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stopSfx(sound); }, [sound]);

  const release = () => stop(false);
  return {
    elapsed, active, early,
    label: (control) => (ownPace && active ? 'Finish hold' : control),
    bind: ownPace
      ? { onClick: () => (holding.current ? stop(true) : start()) }
      : {
        // Capture the pointer so a release away from the control still ends the hold (never completes it).
        onPointerDown: (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start(); },
        onPointerUp: release,
        onPointerCancel: release,
        onKeyDown: (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } },
        onKeyUp: (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } },
      },
  };
}
