import { useEffect } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { kitchenAudio } from '@kit/lib/audio';
import { isAnswered } from '@client/content/tasks';
import type { InteractionProps } from './types';

/**
 * Stand-in for a V2 presentation whose real component has not landed yet: the plain
 * decision controls in a close-up, so no task is ever blocked while owners work in
 * parallel (docs/V2-BUILD.md). Not used once every registry line is real.
 */
export function PendingInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps) {
  const title = 'title' in presentation ? presentation.title : decision.prompt;
  const picked = Array.isArray(answer) ? answer : answer ? [answer] : [];

  useEffect(() => {
    if (isOpen) kitchenAudio.play('page');
  }, [isOpen]);

  const pick = (id: string) => {
    if (frozen) return;
    kitchenAudio.play('tap');
    if (decision.kind === 'choice') {
      onAnswer(id);
      return;
    }
    onAnswer(picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id]);
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      <div className="flex max-h-full min-h-0 flex-col gap-3 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presentation pending ({presentation.kind})</p>
        <p className="text-sm">{decision.prompt}</p>
        <ul className="flex flex-col gap-2">
          {decision.options.map((option) => (
            <li key={option.id}>
              <Button
                type="button"
                variant={picked.includes(option.id) ? 'default' : 'secondary'}
                size="sm"
                disabled={frozen}
                data-testid={`option-${decision.id}-${option.id}`}
                onClick={() => pick(option.id)}
              >
                {option.label}
              </Button>
            </li>
          ))}
        </ul>
        {isAnswered(answer) && (
          <Button type="button" size="sm" onClick={onClose}>Done</Button>
        )}
      </div>
    </CloseUp>
  );
}
