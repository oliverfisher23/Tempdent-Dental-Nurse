import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import type { InteractionProps } from './types';

export function OffersInteraction({
  decision, presentation, answer, frozen, onAnswer, isOpen, onClose,
}: InteractionProps<'offers'>) {
  const saved = Array.isArray(answer) ? answer : [];
  const [picked, setPicked] = useState<string[]>(saved);
  useEffect(() => setPicked(saved), [JSON.stringify(saved)]);

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title} className="max-w-2xl">
      <section className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white text-foreground shadow-2xl">
        <header className="shrink-0 border-b p-4">
          <h2 data-dialog-title className="text-xl font-bold">{presentation.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{decision.prompt}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {presentation.moments.map((moment, index) => (
              <fieldset key={moment.id} className="rounded-lg border p-3">
                <legend className="px-1 text-sm font-bold">Moment {index + 1}</legend>
                <p className="mb-3 text-sm">Graham: “{moment.line}”</p>
                <div className="flex flex-col gap-2">
                  {moment.optionIds.map((id) => {
                    const option = decision.options.find((item) => item.id === id);
                    if (!option) return null;
                    const selected = picked.includes(id);
                    return (
                      <Button
                        key={id}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        disabled={frozen}
                        aria-pressed={selected}
                        data-testid={`option-${decision.id}-${id}`}
                        className="h-auto justify-start whitespace-normal text-left"
                        onClick={() => {
                          kitchenAudio.play('tap');
                          const others = new Set(moment.optionIds);
                          setPicked((current) => [...current.filter((item) => !others.has(item)), id]);
                        }}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              disabled={frozen || presentation.moments.some((moment) => !moment.optionIds.some((id) => picked.includes(id)))}
              data-testid={`confirm-${decision.id}`}
              onClick={() => { kitchenAudio.play('confirm'); onAnswer(picked); }}
            >
              Continue
            </Button>
            {saved.length > 0 && <Button type="button" variant="outline" onClick={onClose}>Done</Button>}
          </div>
        </div>
      </section>
    </CloseUp>
  );
}