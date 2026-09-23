import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { playSfx, stopSfx } from '@client/lib/sounds';
import { inReadingOrder } from './layout';
import type { InteractionProps } from './types';

export function ControlsInteraction({
  decision, presentation, answer, frozen, onAnswer, panelSlot,
}: InteractionProps<'controls'>) {
  const saved = Array.isArray(answer) ? answer : [];
  const [used, setUsed] = useState<string[]>(saved);
  const [aside, setAside] = useState('');
  const explained = useRef(false);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => setUsed(saved), [JSON.stringify(saved)]);
  useEffect(() => () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    stopSfx('chair');
  }, []);

  const record = (id: string) => {
    if (frozen) return;
    const spec = presentation.controls[id];
    if (spec.explain && !explained.current) {
      explained.current = true;
      setAside(spec.explain);
      kitchenAudio.play('wrong');
      return;
    }
    setAside('');
    kitchenAudio.play('tap');
    if (id === 'chair') playSfx('chair');
    setUsed((current) => {
      if (decision.kind === 'checklist') {
        const withoutChoice = id === 'water' || id === 'disinfectant'
          ? current.filter((item) => item !== 'water' && item !== 'disinfectant')
          : current;
        return withoutChoice.includes(id)
          ? withoutChoice.filter((item) => item !== id)
          : [...withoutChoice, id];
      }
      return current.includes(id) ? current : [...current, id];
    });
  };

  const beginHold = (id: string) => {
    const spec = presentation.controls[id];
    if (spec.kind !== 'hold' || frozen || holdTimer.current !== null) return;
    if (id === 'chair') playSfx('chair');
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      stopSfx('chair');
      record(id);
    }, (spec.seconds ?? 1) * 1000);
  };
  const cancelHold = () => {
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    stopSfx('chair');
  };
  const keyboardHold = (event: KeyboardEvent<HTMLButtonElement>, id: string, down: boolean) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (down) beginHold(id);
    else cancelHold();
  };

  return (
    <div className="pointer-events-none absolute inset-0" aria-label={presentation.start}>
      {inReadingOrder(Object.entries(presentation.controls), (spec) => spec.spot).map(([id, spec]) => {
        const active = used.includes(id);
        const isHold = spec.kind === 'hold';
        return (
          <button
            key={id}
            type="button"
            data-testid={`option-${decision.id}-${id}`}
            aria-pressed={active}
            disabled={frozen}
            className={`pointer-events-auto absolute min-h-11 max-w-36 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-2 py-1 text-xs font-bold shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
              active ? 'border-emerald-300 bg-emerald-950 text-white' : 'border-white bg-black/80 text-white'
            }`}
            style={{ left: `${spec.spot.x}%`, top: `${spec.spot.y}%` }}
            onClick={() => { if (!isHold) record(id); }}
            onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
              if (isHold) {
                event.currentTarget.setPointerCapture(event.pointerId);
                beginHold(id);
              }
            }}
            onPointerUp={isHold ? cancelHold : undefined}
            onPointerCancel={isHold ? cancelHold : undefined}
            onKeyDown={(event) => { if (isHold) keyboardHold(event, id, true); }}
            onKeyUp={(event) => { if (isHold) keyboardHold(event, id, false); }}
          >
            {active && spec.states ? spec.states[1] : spec.states?.[0] ?? spec.label}
          </button>
        );
      })}
      {aside && (panelSlot ? createPortal(
        <p role="status" className="mt-2 border-l-4 border-amber-400 pl-3 text-sm">{aside}</p>,
        panelSlot,
      ) : (
        <p role="status" className="pointer-events-none absolute bottom-3 left-1/2 w-[min(90%,28rem)] -translate-x-1/2 rounded bg-white p-2 text-center text-xs font-semibold text-foreground shadow">
          {aside}
        </p>
      ))}
      <Button
        type="button"
        size="sm"
        disabled={frozen || used.length === 0}
        data-testid={`confirm-${decision.id}`}
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${presentation.commit.spot?.x ?? 88}%`, top: `${presentation.commit.spot?.y ?? 68}%` }}
        onClick={() => {
          kitchenAudio.play('confirm');
          playSfx('door');
          onAnswer(used);
        }}
      >
        {presentation.commit.label}
      </Button>
    </div>
  );
}