import { useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { kitchenAudio } from '@kit/lib/audio';
import type { InteractionProps } from './types';
import { useHold } from './use-hold';

export function HoldInteraction({ decision, presentation, answer, ownPace, frozen, onAnswer, isOpen, onClose }: InteractionProps<'hold'>) {
  const [chosen, setChosen] = useState(presentation.commits);
  const seconds = presentation.choose?.secondsById?.[chosen] ?? presentation.seconds;
  const hold = useHold({
    seconds, ownPace, disabled: frozen || Boolean(answer) || !isOpen, sound: presentation.sound ?? 'water-run', early: presentation.early ?? '',
    onComplete: () => { kitchenAudio.play('confirm'); onAnswer(chosen); },
  });
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
        <div className="my-3 h-3 overflow-hidden rounded bg-slate-700"><div className="h-full bg-sky-300" style={{ width: `${Math.min(100, hold.elapsed / seconds * 100)}%` }} /></div>
        <button type="button" disabled={frozen || Boolean(answer)} aria-pressed={ownPace ? hold.active : undefined}
          className="min-h-12 w-full rounded bg-sky-300 px-4 font-bold text-slate-950 disabled:opacity-60" {...hold.bind}>
          {hold.label(presentation.control)}
        </button>
        {presentation.distractor && !answer && <Button type="button" variant="secondary" className="mt-2 w-full"
          data-testid={`option-${decision.id}-${presentation.distractor.optionId}`} onClick={() => onAnswer(presentation.distractor!.optionId)}>
          {presentation.distractor.label}
        </Button>}
        {hold.early && <p role="status" className="mt-3 border-l-4 border-amber-400 pl-3 text-sm">{hold.early}</p>}
        {answer && <Button type="button" className="mt-3" onClick={onClose}>Done</Button>}
      </section>
    </CloseUp>
  );
}
