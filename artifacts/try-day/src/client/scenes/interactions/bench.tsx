import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { CloseUp } from '@shell/frame/close-up';
import { CheckFeedback } from '@kit/check-feedback';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

export function BenchInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'bench'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const [openFindings, setOpenFindings] = useState<string[]>([]);
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  const editing = draft !== null && !frozen;
  const ticked = editing ? draft : (saved ?? []);
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);
  const toggle = (id: string) => {
    if (!editing) return;
    kitchenAudio.play('write');
    setDraft(ticked.includes(id) ? ticked.filter((itemId) => itemId !== id) : [...ticked, id]);
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
      <section
        data-testid={`decision-${decision.id}`}
        data-state={answered && !editing ? (right ? 'right' : 'wrong') : 'open'}
        className="flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-amber-300/30 bg-slate-950 text-slate-50 shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-700 px-4 py-3">
          <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
          <p className="mt-1 text-sm text-slate-300">{decision.prompt}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {presentation.picture && (
            <img src={presentation.picture} alt="" className="mb-4 h-[clamp(5rem,24svh,9rem)] w-full rounded object-cover short:h-14" />
          )}
          <div className="rounded-full bg-amber-200/20 py-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-amber-100 shadow-[0_12px_40px_rgba(253,230,138,0.2)]">
            Inspection lamp
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decision.options.map((option) => {
              const item = presentation.items[option.id];
              const findingOpen = openFindings.includes(option.id);
              const on = ticked.includes(option.id);
              const findingId = `${decision.id}-${option.id}-finding`;
              return (
                <article key={option.id} className="overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                  {item?.image && <img src={item.image} alt="" className="h-32 w-full bg-white object-contain" />}
                  <div className="p-3">
                    <h3 className="font-bold">{option.label}</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-expanded={findingOpen}
                      aria-controls={findingId}
                      className="mt-3 w-full justify-between"
                      onClick={() => {
                        kitchenAudio.play('tap');
                        setOpenFindings(findingOpen ? openFindings.filter((id) => id !== option.id) : [...openFindings, option.id]);
                      }}
                    >
                      <span className="flex items-center gap-2"><Search aria-hidden="true" />Look closer</span>
                      <ChevronDown className={`transition-transform ${findingOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </Button>
                    {findingOpen && (
                      <p id={findingId} className="mt-3 rounded border border-amber-200/30 bg-amber-50/10 p-3 text-sm leading-relaxed text-amber-50">
                        {item?.finding}
                      </p>
                    )}
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={!editing}
                      data-testid={`option-${decision.id}-${option.id}`}
                      className={`mt-3 flex min-h-11 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-default ${on ? 'border-emerald-400 bg-emerald-950' : 'border-slate-500 bg-slate-800'}`}
                      onClick={() => toggle(option.id)}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-sm font-bold ${on ? 'border-emerald-300 bg-emerald-300 text-emerald-950' : 'border-slate-400'}`}
                        aria-hidden="true"
                      >
                        {on ? '✓' : ''}
                      </span>
                      Goes forward
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {answered && !editing && (
            <CheckFeedback kind={right ? 'ok' : 'issue'} speaker={decision.feedback.speaker} testId={`feedback-sheet-${decision.id}`} className="mt-4">
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