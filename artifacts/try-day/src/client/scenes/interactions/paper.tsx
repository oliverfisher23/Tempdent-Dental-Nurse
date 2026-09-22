import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { CheckFeedback } from '@kit/check-feedback';
import { Clipboard, Notepaper, Sheet, Whiteboard } from '@kit/paper';
import { kitchenAudio } from '@kit/lib/audio';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

const PAPER_SURFACES: Record<'clipboard' | 'notepaper' | 'sheet' | 'whiteboard', ComponentType<{ children: ReactNode; className?: string }>> = {
  clipboard: Clipboard,
  notepaper: Notepaper,
  sheet: Sheet,
  whiteboard: Whiteboard,
};

export function PaperInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'paper'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  const editing = draft !== null && !frozen;
  const marks = editing ? draft : (saved ?? []);
  const Surface = PAPER_SURFACES[presentation.paper];
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  useEffect(() => {
    if (isOpen) kitchenAudio.play('page');
  }, [isOpen]);

  const toggleChecklist = (id: string) => {
    if (!editing) return;
    kitchenAudio.play('write');
    setDraft(marks.includes(id) ? marks.filter((mark) => mark !== id) : [...marks, id]);
  };

  const pickSequence = (id: string) => {
    if (!editing || marks.includes(id)) return;
    kitchenAudio.play('write');
    const next = [...marks, id];
    const length = Array.isArray(decision.correct) ? decision.correct.length : 1;
    if (next.length === length) {
      onAnswer(next);
      setDraft(null);
    } else {
      setDraft(next);
    }
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
        <Surface className="max-h-full flex-1">
          <div
            data-testid={`decision-${decision.id}`}
            data-state={answered ? (right ? 'right' : 'wrong') : 'open'}
            className="flex min-h-0 flex-col gap-4 p-5 text-zinc-900 sm:p-7"
          >
          <div>
            <h2 data-dialog-title className="text-xl font-bold">{presentation.heading ?? presentation.title}</h2>
            {presentation.note && <p className="mt-1 text-xs text-zinc-600">{presentation.note}</p>}
          </div>

          <div className="flex flex-col gap-2" role="group" aria-label={decision.prompt}>
            {decision.options.map((option) => {
              const position = marks.indexOf(option.id);
              const selected = position >= 0;
              const mark = decision.kind === 'sequence' && selected ? `${position + 1}.` : null;
              return (
                <button
                  key={option.id}
                  type="button"
                  role={decision.kind === 'checklist' ? 'checkbox' : undefined}
                  aria-checked={decision.kind === 'checklist' ? selected : undefined}
                  aria-pressed={decision.kind === 'sequence' ? selected : undefined}
                  disabled={!editing || (decision.kind === 'sequence' && selected)}
                  data-testid={`option-${decision.id}-${option.id}`}
                  className="kitchen-input flex min-h-11 w-full items-start gap-3 border-b border-zinc-300 px-2 py-2 text-left text-base disabled:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => decision.kind === 'sequence' ? pickSequence(option.id) : toggleChecklist(option.id)}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-foreground/60 text-base font-bold leading-none" aria-hidden="true">
                    {decision.kind === 'checklist' && selected && '✓'}
                    {mark}
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {editing && decision.kind === 'checklist' && (
            <Button
              type="button"
              disabled={marks.length === 0}
              data-testid={`confirm-${decision.id}`}
              className="self-start"
              onClick={() => {
                kitchenAudio.play('page');
                onAnswer(marks);
                setDraft(null);
              }}
            >
              Confirm
            </Button>
          )}

          {editing && decision.kind === 'sequence' && (
            <Button
              type="button"
              variant="secondary"
              disabled={marks.length === 0}
              data-testid={`restart-${decision.id}`}
              className="self-start"
              onClick={() => setDraft([])}
            >
              Start again
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
        </Surface>
      </div>
    </CloseUp>
  );
}