import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { CheckFeedback } from '@kit/check-feedback';
import { kitchenAudio } from '@kit/lib/audio';
import { Notepaper } from '@kit/paper';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

export function LabelsInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'labels'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  const editing = draft !== null && !frozen;
  const ticked = editing ? draft : (saved ?? []);
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);
  const fields = presentation.packages.flatMap((pack) => pack.fields);
  const toggle = (id: string) => {
    if (!editing) return;
    kitchenAudio.play('write');
    setDraft(ticked.includes(id) ? ticked.filter((fieldId) => fieldId !== id) : [...ticked, id]);
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
      <section
        data-testid={`decision-${decision.id}`}
        data-state={answered && !editing ? (right ? 'right' : 'wrong') : 'open'}
        className="flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-stone-100 text-slate-950 shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-300 bg-white px-4 py-3">
          <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{decision.prompt}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {presentation.picture && (
            <img src={presentation.picture} alt="" className="mb-4 h-[clamp(5rem,24svh,9rem)] w-full rounded object-cover short:h-14" />
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {presentation.packages.map((pack) => (
              <article key={pack.id} className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  {pack.image && <img src={pack.image} alt="" className="h-14 w-14 rounded object-contain" />}
                  <h3 className="font-bold">{pack.name}</h3>
                </div>
                <div className="divide-y divide-slate-300 overflow-hidden rounded border border-slate-400">
                  {pack.fields.map((field) => {
                    const on = ticked.includes(field.optionId);
                    return (
                      <button
                        key={field.optionId}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={!editing}
                        data-testid={`option-${decision.id}-${field.optionId}`}
                        className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-default ${on ? 'bg-sky-100' : 'bg-[#fffdf4]'}`}
                        onClick={() => toggle(field.optionId)}
                      >
                        <span className="w-16 shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">{field.field}</span>
                        <span className="min-w-0 flex-1 break-all font-mono text-sm">{field.value}</span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-sm font-bold ${on ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-500'}`}
                          aria-hidden="true"
                        >
                          {on ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <Notepaper className="mt-4 min-h-32 p-5 text-slate-900">
            <h3 className="font-bold">Notes</h3>
            {ticked.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-sm">
                {fields.filter((field) => ticked.includes(field.optionId)).map((field) => (
                  <li key={field.optionId}>{field.field}: {field.value}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Tick label details to add them here.</p>
            )}
          </Notepaper>

          {answered && !editing && (
            <CheckFeedback kind={right ? 'ok' : 'issue'} speaker={decision.feedback.speaker} tone="light" testId={`feedback-sheet-${decision.id}`} className="mt-4">
              {right ? decision.feedback.right : decision.feedback.wrong}
            </CheckFeedback>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {editing ? (
              <Button
                type="button"
                disabled={ticked.length === 0}
                data-testid={`confirm-${decision.id}`}
                onClick={() => {
                  kitchenAudio.play('write');
                  onAnswer(ticked);
                  setDraft(null);
                }}
              >
                Confirm
              </Button>
            ) : (
              <>
                <Button type="button" onClick={onClose}>Done</Button>
                {!frozen && (
                  <Button type="button" variant="secondary" data-testid={`change-${decision.id}`} onClick={() => setDraft(saved ?? [])}>
                    Change answer
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </CloseUp>
  );
}