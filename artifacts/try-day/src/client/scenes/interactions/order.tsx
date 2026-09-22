import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { CheckFeedback } from '@kit/check-feedback';
import { kitchenAudio } from '@kit/lib/audio';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

export function OrderInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'order'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  const editing = draft !== null && !frozen;
  const order = editing ? draft : (saved ?? []);
  const steps = Array.isArray(decision.correct) ? decision.correct.length : 1;
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  useEffect(() => {
    if (isOpen) kitchenAudio.play('page');
  }, [isOpen]);

  const pick = (id: string) => {
    if (!editing || order.includes(id)) return;
    kitchenAudio.play('tap');
    const next = [...order, id];
    if (next.length === steps) {
      onAnswer(next);
      setDraft(null);
    } else {
      setDraft(next);
    }
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title} className="max-w-3xl">
      <section
        data-testid={`decision-${decision.id}`}
        data-state={answered ? (right ? 'right' : 'wrong') : 'open'}
        className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-lg bg-zinc-50 text-zinc-900 shadow-2xl"
      >
        <header className="border-b border-zinc-200 px-5 py-4">
          <h2 data-dialog-title className="text-xl font-bold">{presentation.title}</h2>
        </header>
        {presentation.picture && (
          <img
            src={presentation.picture}
            alt=""
            className="mx-5 mt-4 h-[clamp(5rem,24svh,9rem)] w-[calc(100%-2.5rem)] shrink-0 rounded-lg object-cover short:h-14"
          />
        )}
        <div className="min-h-0 overflow-y-auto p-5">
          <p className="mb-2 text-sm font-semibold">{presentation.slotsLabel ?? 'Your order'}</p>
          <ol className="mb-5 grid gap-2">
            {Array.from({ length: steps }, (_, index) => {
              const option = decision.options.find((item) => item.id === order[index]);
              return (
                <li key={index} className="flex min-h-11 items-center gap-3 rounded-md border border-zinc-300 bg-white px-3 py-2">
                  <span className="font-mono font-bold">{index + 1}.</span>
                  <span className={option ? 'kitchen-input' : 'text-zinc-400'}>
                    {option?.label ?? 'Empty'}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap gap-2" role="group" aria-label={decision.prompt}>
            {decision.options.map((option) => {
              const selected = order.includes(option.id);
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  aria-pressed={selected}
                  disabled={!editing || selected}
                  data-testid={`option-${decision.id}-${option.id}`}
                  className="h-auto min-h-11 whitespace-normal text-left disabled:opacity-100"
                  onClick={() => pick(option.id)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>

          {editing && (
            <Button
              type="button"
              variant="secondary"
              disabled={order.length === 0}
              data-testid={`restart-${decision.id}`}
              className="mt-4"
              onClick={() => setDraft([])}
            >
              Start again
            </Button>
          )}

          {answered && !editing && (
            <div className="mt-5 space-y-3">
              <CheckFeedback
                kind={right ? 'ok' : 'issue'}
                speaker={decision.feedback.speaker}
                tone="light"
                testId={`feedback-sheet-${decision.id}`}
              >
                {right ? decision.feedback.right : decision.feedback.wrong}
              </CheckFeedback>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => { kitchenAudio.play('page'); onClose(); }}>Done</Button>
                {!frozen && (
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid={`change-${decision.id}`}
                    onClick={() => setDraft(saved ?? [])}
                  >
                    Change answer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </CloseUp>
  );
}