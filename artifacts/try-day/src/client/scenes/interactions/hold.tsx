import { useEffect, useRef, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { kitchenAudio } from '@kit/lib/audio';
import { playSfx, stopSfx } from '@client/lib/sounds';
import type { InteractionProps } from './types';

export function HoldInteraction({ decision, presentation, answer, ownPace, frozen, onAnswer, isOpen, onClose }: InteractionProps<'hold'>) {
  const [chosen, setChosen] = useState(presentation.commits);
  const [elapsed, setElapsed] = useState(0);
  const [early, setEarly] = useState('');
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const holding = useRef(false);
  const seconds = presentation.choose?.secondsById?.[chosen] ?? presentation.seconds;
  const sound = presentation.sound ?? 'water-run';
  const stop = (commit: boolean) => {
    if (!holding.current) return;
    holding.current = false;
    setActive(false);
    if (timer.current) clearInterval(timer.current);
    stopSfx(sound);
    if (commit || elapsed >= seconds) {
      kitchenAudio.play('confirm');
      onAnswer(chosen);
    } else {
      setElapsed(0);
      setEarly(presentation.early ?? '');
    }
  };
  const start = () => {
    if (frozen || holding.current) return;
    holding.current = true;
    setActive(true);
    setEarly('');
    playSfx(sound);
    if (ownPace) return;
    const started = Date.now();
    timer.current = setInterval(() => {
      const next = Math.min(seconds, (Date.now() - started) / 1000);
      setElapsed(next);
      if (next >= seconds) stop(true);
    }, 100);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stopSfx(sound); }, [sound]);
  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
      <section data-testid={`decision-${decision.id}`} className="max-h-full overflow-y-auto rounded-lg bg-slate-950 p-4 text-white">
        <p className="font-semibold">{decision.prompt}</p>
        {presentation.choose && <div className="my-3 grid gap-2">
          {presentation.choose.optionIds.map((id) => <Button key={id} type="button" variant={chosen === id ? 'default' : 'secondary'}
            data-testid={`option-${decision.id}-${id}`} onClick={() => setChosen(id)}>
            {decision.options.find((o) => o.id === id)?.label}
          </Button>)}
        </div>}
        {presentation.steps && <div className="my-3 grid grid-cols-3 gap-1" aria-label="Handwashing poster">
          {presentation.steps.map((step, i) => <span key={step} className={`rounded p-1 text-center text-xs ${elapsed / seconds * presentation.steps!.length >= i + 1 ? 'bg-sky-300 text-slate-950' : 'bg-slate-800'}`}>{step}</span>)}
        </div>}
        <div className="my-3 h-3 overflow-hidden rounded bg-slate-700"><div className="h-full bg-sky-300" style={{ width: `${Math.min(100, elapsed / seconds * 100)}%` }} /></div>
        <button type="button" disabled={frozen || Boolean(answer)}
          className="min-h-12 w-full rounded bg-sky-300 px-4 font-bold text-slate-950"
          onPointerDown={start} onPointerUp={() => stop(false)} onPointerCancel={() => stop(false)}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(false); } }}>
          {presentation.control}
        </button>
        {ownPace && !answer && <Button className="mt-2 w-full" type="button" onClick={() => holding.current ? stop(true) : start()}>
          {active ? 'Finish hold' : presentation.control}
        </Button>}
        {presentation.distractor && !answer && <Button type="button" variant="secondary" className="mt-2 w-full"
          data-testid={`option-${decision.id}-${presentation.distractor.optionId}`} onClick={() => onAnswer(presentation.distractor!.optionId)}>
          {presentation.distractor.label}
        </Button>}
        {early && <p role="status" className="mt-3 border-l-4 border-amber-400 pl-3 text-sm">{early}</p>}
        {answer && <Button type="button" className="mt-3" onClick={onClose}>Done</Button>}
      </section>
    </CloseUp>
  );
}