import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { CloseUp } from '@shell/frame/close-up';
import { CheckFeedback } from '@kit/check-feedback';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

const acceptsTrayItem = (kind: string) => kind === 'tray-item';

export function TrayInteraction(props: InteractionProps<'tray'>) {
  return (
    <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title}>
      <DragProvider>
        <TrayWorkspace {...props} />
      </DragProvider>
    </CloseUp>
  );
}

function TrayWorkspace({ decision, presentation, answer, frozen, onAnswer, onClose }: InteractionProps<'tray'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answerKey = JSON.stringify(answer);

  useEffect(() => {
    setDraft(saved ? null : []);
  }, [answerKey]);

  const editing = draft !== null && !frozen;
  const onTray = editing ? draft : (saved ?? []);
  const moveToTray = (id: string) => {
    if (!editing || onTray.includes(id)) return;
    kitchenAudio.play('tap');
    setDraft([...onTray, id]);
  };
  const moveToShelf = (id: string) => {
    if (!editing || !onTray.includes(id)) return;
    kitchenAudio.play('tap');
    setDraft(onTray.filter((itemId) => itemId !== id));
  };
  const trayZone = useDropZone({
    id: `${decision.id}-tray`,
    label: 'Tray',
    accepts: acceptsTrayItem,
    onDrop: moveToTray,
    disabled: !editing,
  });
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);

  return (
    <section
      data-testid={`decision-${decision.id}`}
      data-state={answered ? (right ? 'right' : 'wrong') : 'open'}
      className="flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-slate-50 shadow-2xl"
    >
      <header className="shrink-0 border-b border-slate-700 px-4 py-3">
        <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
        <p className="mt-1 text-sm text-slate-300">{decision.prompt}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {presentation.picture && (
          <img src={presentation.picture} alt="" className="mb-4 h-[clamp(5rem,24svh,9rem)] w-full rounded object-cover short:h-14" />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-h-32 rounded-lg border border-slate-600 bg-slate-900 p-3">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">{presentation.shelf}</h3>
            <div className="flex flex-wrap gap-2">
              {decision.options.filter((option) => !onTray.includes(option.id)).map((option) => (
                <TrayChip
                  key={option.id}
                  decisionId={decision.id}
                  optionId={option.id}
                  label={option.label}
                  image={presentation.images?.[option.id]}
                  disabled={!editing}
                  chosen={false}
                />
              ))}
              {!decision.options.some((option) => !onTray.includes(option.id)) && <p className="text-sm text-slate-400">Shelf empty</p>}
            </div>
          </div>
          <div
            ref={trayZone.ref as React.Ref<HTMLDivElement>}
            {...trayZone.props}
            className={`min-h-32 rounded-lg border-2 border-dashed p-3 ${trayZone.isOver || trayZone.isTarget ? 'border-sky-300 bg-sky-950' : 'border-slate-500 bg-slate-800'}`}
          >
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Tray</h3>
            <div className="flex flex-wrap gap-2">
              {decision.options.filter((option) => onTray.includes(option.id)).map((option) => (
                <TrayChip
                  key={option.id}
                  decisionId={decision.id}
                  optionId={option.id}
                  label={option.label}
                  image={presentation.images?.[option.id]}
                  disabled={!editing}
                  chosen
                  showTick={answered}
                  onReturn={() => moveToShelf(option.id)}
                />
              ))}
              {onTray.length === 0 && <p className="text-sm text-slate-400">{trayZone.carrying ? `Put ${trayZone.carrying} here` : 'Move items here'}</p>}
            </div>
          </div>
        </div>

        {answered && (
          <CheckFeedback
            kind={right ? 'ok' : 'issue'}
            speaker={decision.feedback.speaker}
            testId={`feedback-sheet-${decision.id}`}
            className="mt-4"
          >
            {right ? decision.feedback.right : decision.feedback.wrong}
          </CheckFeedback>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {editing ? (
            <Button
              type="button"
              disabled={onTray.length === 0}
              data-testid={`confirm-${decision.id}`}
              onClick={() => {
                kitchenAudio.play('write');
                onAnswer(onTray);
                setDraft(null);
              }}
            >
              Tray ready
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
  );
}

function TrayChip({
  decisionId,
  optionId,
  label,
  image,
  disabled,
  chosen,
  showTick = false,
  onReturn,
}: {
  decisionId: string;
  optionId: string;
  label: string;
  image?: string;
  disabled: boolean;
  chosen: boolean;
  showTick?: boolean;
  onReturn?: () => void;
}) {
  const draggable = useDraggable({ id: optionId, kind: 'tray-item', label, disabled });
  const className = `relative flex min-h-11 max-w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium shadow ${chosen ? 'border-sky-400 bg-sky-950' : 'border-slate-500 bg-slate-700'} ${draggable.isLifted ? 'ring-2 ring-sky-300' : ''}`;
  const contents = (
    <>
      {image && <img src={image} alt="" className="h-10 w-10 rounded object-cover" />}
      <span>{label}</span>
      {showTick && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-emerald-300 text-emerald-300" aria-hidden="true">
          <Check className="h-4 w-4 stroke-[3]" />
        </span>
      )}
    </>
  );

  if (chosen) {
    return onReturn && !disabled ? (
      <button
        type="button"
        data-testid={`option-${decisionId}-${optionId}`}
        data-chosen="true"
        className={className}
        onClick={onReturn}
        aria-label={`${label}. Remove from tray`}
      >
        {contents}
      </button>
    ) : (
      <div data-testid={`option-${decisionId}-${optionId}`} data-chosen="true" className={className}>
        {contents}
      </div>
    );
  }

  return (
    <div
      {...draggable.props}
      data-testid={`option-${decisionId}-${optionId}`}
      data-chosen={chosen}
      className={className}
    >
      {contents}
    </div>
  );
}