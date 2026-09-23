import { useEffect, useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { CloseUp } from '@shell/frame/close-up';
import { Clipboard } from '@kit/paper';
import { Button } from '@kit/ui/button';
import { CheckFeedback } from '@kit/check-feedback';
import { kitchenAudio } from '@kit/lib/audio';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';
import { useProgress } from '@client/lib/progress';

export function KitInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'kit'>) {
  const { progress } = useProgress();
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  const editing = draft !== null && !frozen;
  const ticked = editing ? draft : (saved ?? []);
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  useEffect(() => {
    if (isOpen) kitchenAudio.play('page');
  }, [isOpen]);

  const [zoomed, setZoomed] = useState<string | null>(null);
  const read = (id: string) => {
    if (!editing) return;
    kitchenAudio.play('page');
    setZoomed(id);
    if (!ticked.includes(id)) setDraft([...ticked, id]);
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title} className="max-w-3xl">
      <div className="flex max-h-full min-h-0 flex-col gap-3">
        {presentation.picture && (
          <img
            src={presentation.picture}
            alt=""
            className="h-[clamp(5rem,24svh,9rem)] w-full shrink-0 rounded-lg object-cover short:h-14"
          />
        )}
        <Clipboard className="max-h-full flex-1">
          <div
            data-testid={`decision-${decision.id}`}
            data-state={answered && !editing ? (right ? 'right' : 'wrong') : 'open'}
            className="flex min-h-0 flex-col gap-4 p-5 text-zinc-900 sm:p-7"
          >
          <header className="border-b-2 border-zinc-800 pb-3">
            <h2 data-dialog-title className="text-xl font-bold">Emergency kit check</h2>
            <p className="mt-1 text-sm">Checked: today</p>
          </header>

          <div className="flex flex-col" role="group" aria-label={decision.prompt}>
            {decision.options.map((option) => {
              const item = presentation.items[option.id];
              const selected = ticked.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={!editing}
                  data-testid={`option-${decision.id}-${option.id}`}
                  className="flex min-h-14 w-full items-start gap-3 border-b border-zinc-300 px-1 py-3 text-left disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => read(option.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-sm text-zinc-600">{selected ? item?.detail : 'Open to read'}</span>
                  </span>
                  {selected && <span className="font-hand text-sm font-bold" aria-label={`Initialled ${progress.initials}`}>{progress.initials}</span>}
                  {answered && !editing && item && (
                    <span className={`flex shrink-0 items-center gap-1 text-xs font-bold ${
                      item.status === 'expired' ? 'text-red-700' : item.status === 'missing' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {item.status === 'expired' && <><AlertCircle className="h-4 w-4" aria-hidden="true" />Out of date</>}
                      {item.status === 'missing' && <><X className="h-4 w-4" aria-hidden="true" />Missing</>}
                      {item.status === 'ok' && <><Check className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Ready</span></>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {zoomed && editing && (
            <div className="rounded-lg border-2 border-zinc-800 bg-white p-4" role="status">
              <p className="font-bold">{decision.options.find((item) => item.id === zoomed)?.label}</p>
              <p className="mt-1 text-lg">{presentation.items[zoomed]?.detail}</p>
              <Button type="button" variant="secondary" className="mt-3" onClick={() => setZoomed(null)}>Back to the kit</Button>
            </div>
          )}

          {editing && (
            <Button
              type="button"
              disabled={ticked.length !== decision.options.length}
              data-testid={`confirm-${decision.id}`}
              className="self-start"
              onClick={() => {
                kitchenAudio.play('page');
                onAnswer(ticked);
                setDraft(null);
              }}
            >
              Confirm
            </Button>
          )}

          {answered && !editing && (
            <>
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
            </>
          )}
          </div>
        </Clipboard>
      </div>
    </CloseUp>
  );
}