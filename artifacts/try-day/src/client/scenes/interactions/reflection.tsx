import { useMemo, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { kitchenAudio } from '@kit/lib/audio';
import type { InteractionProps } from './types';

export function ReflectionInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'reflection'>) {
  const ids = Object.keys(presentation.variants);
  const variantId = useMemo(() => ids[Math.abs(decision.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0)) % ids.length], [decision.id]);
  const variant = presentation.variants[variantId];
  const [fixed, setFixed] = useState(false);
  const shown = fixed ? variant.fixed : variant.image;
  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
      <section data-testid={`decision-${decision.id}`} className="relative min-h-0 overflow-y-auto rounded-xl bg-slate-950 p-3 text-white">
        <p className="mb-2 text-sm">{decision.prompt}</p>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
          <img src={shown} alt={fixed ? variant.fixedAlt : variant.alt} className="h-full w-full object-cover" />
          {!fixed && !frozen && Object.entries(presentation.spots).map(([id, spot]) => (
            <button key={id} type="button" data-testid={`option-${decision.id}-${id}`}
              aria-label={decision.options.find((o) => o.id === id)?.label ?? id}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/35 focus:ring-4 focus:ring-sky-300"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onClick={() => {
                kitchenAudio.play('tap');
                if (ids.includes(id)) setFixed(true);
                onAnswer(id);
              }}
            />
          ))}
        </div>
        {answer && <button type="button" className="mt-3 rounded bg-white px-3 py-2 font-bold text-slate-900" onClick={onClose}>Done</button>}
      </section>
    </CloseUp>
  );
}