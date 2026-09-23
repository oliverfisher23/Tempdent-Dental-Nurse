import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { kitchenAudio } from '@kit/lib/audio';
import { playSfx, stopSfx, type SfxName } from '@client/lib/sounds';
import { inReadingOrder } from './layout';
import type { InteractionProps } from './types';

export function TurnaroundInteraction({
  isOpen, onClose, ...props
}: InteractionProps<'turnaround'>) {
  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={props.presentation.title} className="max-w-5xl">
      <section
        data-testid={`decision-${props.decision.id}`}
        className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl bg-slate-950 text-white shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-700 px-4 py-3">
          <h2 data-dialog-title className="font-bold">{props.presentation.title}</h2>
          <p className="text-sm text-slate-300">{props.decision.prompt}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="relative aspect-[8/5] min-w-[42rem]">
            {props.presentation.picture && <img src={props.presentation.picture} alt="Surgery 2 immediately after Amira's appointment" className="absolute inset-0 h-full w-full object-cover" />}
            <TurnaroundWorkspace {...props} isOpen={isOpen} onClose={onClose} />
          </div>
        </div>
      </section>
    </CloseUp>
  );
}

function TurnaroundWorkspace({
  decision, presentation, answer, ownPace, frozen, onAnswer,
}: InteractionProps<'turnaround'>) {
  const saved = Array.isArray(answer) ? answer : [];
  const [used, setUsed] = useState<string[]>(saved);
  const [elapsed, setElapsed] = useState(0);
  const [activeHold, setActiveHold] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const [wipeMode, setWipeMode] = useState(false);
  const [wipeDraft, setWipeDraft] = useState<string[]>([]);
  const wipeRef = useRef<string[]>([]);
  const drawing = useRef(false);
  const [aside, setAside] = useState('');

  useEffect(() => {
    setUsed(saved);
    setWipeMode(false);
    setWipeDraft([]);
    wipeRef.current = [];
  }, [JSON.stringify(answer)]);

  useEffect(() => {
    if (ownPace || frozen || saved.length) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [ownPace, frozen, saved.length]);

  useEffect(() => () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    stopSfx('flush');
    stopSfx('water-run');
  }, []);

  const sound = (name?: 'tap' | SfxName) => {
    if (!name || name === 'tap') kitchenAudio.play('tap');
    else playSfx(name);
  };
  const record = (id: string) => {
    if (frozen || used.includes(id)) return;
    const spec = presentation.controls[id];
    sound(spec?.sound);
    // A looping world sound (running water) on a one-tap action runs for a moment, not until the room closes.
    if (spec?.sound === 'water-run') window.setTimeout(() => stopSfx('water-run'), 2500);
    setUsed((current) => current.includes(id) ? current : [...current, id]);
    setAside('');
  };
  const stopHoldSound = (id: string) => {
    const name = presentation.controls[id]?.sound;
    if (name && name !== 'tap' && name !== 'wipe' && name !== 'box-lid') stopSfx(name);
  };
  const completeHold = (id: string) => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setActiveHold(null);
    stopHoldSound(id);
    record(id);
  };
  const beginHold = (id: string) => {
    if (frozen || used.includes(id) || activeHold) return;
    setActiveHold(id);
    sound(presentation.controls[id]?.sound);
    if (ownPace) return;
    holdTimer.current = window.setTimeout(() => completeHold(id), (presentation.controls[id]?.seconds ?? 1) * 1000);
  };
  const cancelHold = (id: string) => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setActiveHold(null);
    stopHoldSound(id);
  };
  const keyboardHold = (event: KeyboardEvent<HTMLButtonElement>, id: string, down: boolean) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (down && !event.repeat) beginHold(id);
    else if (!down && activeHold === id && !used.includes(id)) cancelHold(id);
  };

  const addWipeZone = (id: string) => {
    const current = wipeRef.current;
    if (current.at(-1) === id) return;
    const next = [...current, id];
    wipeRef.current = next;
    setWipeDraft(next);
  };
  const locateWipe = (x: number, y: number, rect: DOMRect) => {
    const px = (x - rect.left) / rect.width * 100;
    const py = (y - rect.top) / rect.height * 100;
    for (const [id, zone] of Object.entries(presentation.wipe.zones)) {
      if (Math.hypot(px - zone.x, py - zone.y) <= (zone.r ?? 7)) addWipeZone(id);
    }
  };
  // The wipe is a gesture inside the reset: it counts once the path has covered every zone.
  // Its order is not judged here (the content judges the reset's order at the door, and Task 1
  // assesses the wipe order as its own decision), so an incomplete path is the only thing refused.
  const finishWipe = () => {
    const zones = Object.keys(presentation.wipe.zones);
    const covered = new Set(wipeRef.current);
    if (zones.every((id) => covered.has(id))) {
      playSfx('wipe');
      setUsed((current) => current.includes(presentation.wipe.optionId) ? current : [...current, presentation.wipe.optionId]);
      setWipeMode(false);
      setAside('');
      return;
    }
    kitchenAudio.play('tap');
    setAside('Keep the wipe as one continuous path and cover every zone before you lift off. Start the path again.');
    wipeRef.current = [];
    setWipeDraft([]);
  };

  const waitingMinutes = 10 + Math.floor(elapsed / 60);
  const waitingSeconds = elapsed % 60;
  return (
    <div className="pointer-events-none absolute inset-0" aria-label={presentation.start}>
      <p
        data-testid="turnaround-clock"
        aria-live="polite"
        className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded bg-slate-950/90 px-3 py-1 text-xs font-bold text-white shadow"
      >
        {presentation.clockLabel} {waitingMinutes} min {waitingSeconds.toString().padStart(2, '0')} sec
        {ownPace ? ' — paused at your pace' : ''}
      </p>

      {!wipeMode && inReadingOrder(Object.entries(presentation.controls), (spec) => spec.spot).map(([id, spec]) => {
        const done = used.includes(id);
        const holding = activeHold === id;
        return (
          <button
            key={id}
            type="button"
            data-testid={`option-${decision.id}-${id}`}
            aria-pressed={done}
            disabled={frozen || done}
            className={`pointer-events-auto absolute min-h-11 max-w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-2 py-1 text-xs font-bold text-white shadow-lg focus-visible:ring-4 focus-visible:ring-primary ${
              done ? 'border-emerald-300 bg-emerald-950' : holding ? 'border-sky-200 bg-sky-800' : 'border-white bg-black/80'
            }`}
            style={{ left: `${spec.spot.x}%`, top: `${spec.spot.y}%` }}
            onClick={spec.kind === 'action'
              ? () => record(id)
              : ownPace ? () => holding ? completeHold(id) : beginHold(id) : undefined}
            onPointerDown={spec.kind === 'hold' && !ownPace ? (event: PointerEvent<HTMLButtonElement>) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              beginHold(id);
            } : undefined}
            onPointerUp={spec.kind === 'hold' && !ownPace ? () => {
              if (activeHold === id && !used.includes(id)) cancelHold(id);
            } : undefined}
            onPointerCancel={spec.kind === 'hold' && !ownPace ? () => cancelHold(id) : undefined}
            onKeyDown={spec.kind === 'hold' && !ownPace ? (event) => keyboardHold(event, id, true) : undefined}
            onKeyUp={spec.kind === 'hold' && !ownPace ? (event) => keyboardHold(event, id, false) : undefined}
          >
            {holding && ownPace ? `Finish: ${spec.label}` : done ? `Done: ${spec.label}` : spec.label}
          </button>
        );
      })}

      {!wipeMode && !used.includes(presentation.wipe.optionId) && (
        <button
          type="button"
          data-testid={`option-${decision.id}-${presentation.wipe.optionId}`}
          disabled={frozen}
          className="pointer-events-auto absolute min-h-11 max-w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white bg-black/80 px-2 py-1 text-xs font-bold text-white shadow-lg focus-visible:ring-4 focus-visible:ring-primary"
          style={{ left: `${presentation.wipe.zones.headrest?.x ?? 30}%`, top: `${presentation.wipe.zones.headrest?.y ?? 62}%` }}
          onClick={() => {
            setWipeMode(true);
            wipeRef.current = [];
            setWipeDraft([]);
            setAside('');
          }}
        >
          Start wipe path
        </button>
      )}

      {wipeMode && (
        <div
          className="pointer-events-auto absolute inset-0 bg-sky-950/20"
          onPointerDown={(event) => {
            drawing.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            locateWipe(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
          }}
          onPointerMove={(event) => drawing.current && locateWipe(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())}
          onPointerUp={() => { drawing.current = false; finishWipe(); }}
          onPointerCancel={() => { drawing.current = false; }}
        >
          {inReadingOrder(Object.entries(presentation.wipe.zones), (zone) => zone).map(([id, zone]) => (
            <button
              key={id}
              type="button"
              data-testid={`wipe-zone-${decision.id}-${id}`}
              aria-label={zone.hint ?? id}
              className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${wipeDraft.includes(id) ? 'border-emerald-200 bg-emerald-400/60' : 'border-white bg-black/40'}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              onClick={(event) => { event.stopPropagation(); addWipeZone(id); }}
            />
          ))}
          <button
            type="button"
            data-testid={`finish-wipe-${decision.id}`}
            disabled={wipeDraft.length === 0}
            className="absolute bottom-3 right-3 rounded bg-white px-3 py-2 text-sm font-bold text-slate-900"
            onClick={(event) => { event.stopPropagation(); finishWipe(); }}
          >
            {presentation.wipe.finish}
          </button>
        </div>
      )}

      {aside && (
        <p role="status" className="pointer-events-none absolute bottom-3 left-1/2 z-30 w-[min(90%,30rem)] -translate-x-1/2 rounded bg-white p-2 text-center text-xs font-semibold text-slate-900 shadow">
          {aside}
        </p>
      )}
      {!wipeMode && (
        <button
          type="button"
          data-testid={`confirm-${decision.id}`}
          disabled={frozen || used.length === 0}
          className="pointer-events-auto absolute min-h-11 -translate-x-1/2 -translate-y-1/2 rounded bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow"
          style={{ left: `${presentation.commit.spot.x}%`, top: `${presentation.commit.spot.y}%` }}
          onClick={() => {
            kitchenAudio.play('confirm');
            playSfx('door');
            onAnswer(used);
          }}
        >
          {presentation.commit.label}
        </button>
      )}
    </div>
  );
}