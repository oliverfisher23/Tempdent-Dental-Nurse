import { useEffect, useMemo, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import type { InteractionProps } from './types';

export function HandoverInteraction(props: InteractionProps<'handover'>) {
  return (
    <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title} className="max-w-4xl">
      <DragProvider><HandoverSheet {...props} /></DragProvider>
    </CloseUp>
  );
}

function HandoverSheet({
  decision, presentation, answer, memory, frozen, onAnswer, onClose,
}: InteractionProps<'handover'>) {
  const saved = Array.isArray(answer) ? answer : [];
  const [sheet, setSheet] = useState<string[]>(saved);
  useEffect(() => setSheet(saved), [JSON.stringify(saved)]);
  const entries = useMemo(() => {
    const byId = new Map(decision.options.map((option) => [option.id, option.label]));
    const lines = memory.noticed.flatMap((entry) => {
      const id = entry.ref?.decision === undefined ? undefined : String(entry.ref.decision);
      return id ? [{ id, label: byId.get(id) ?? entry.value }] : [];
    });
    for (const id of presentation.fixed ?? []) {
      const label = byId.get(id);
      if (label) lines.push({ id, label });
    }
    for (const [id, label] of Object.entries(presentation.distractors)) lines.push({ id, label });
    return [...new Map(lines.map((line) => [line.id, line])).values()];
  }, [decision.options, memory.noticed, presentation.distractors, presentation.fixed]);
  const zone = useDropZone({
    id: `${decision.id}-sheet`,
    label: presentation.sheet,
    accepts: (kind) => kind === 'handover-line',
    disabled: frozen,
    onDrop: (id) => {
      kitchenAudio.play('write');
      setSheet((current) => current.includes(id) ? current : [...current, id]);
    },
  });

  return (
    <section className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl bg-slate-100 text-slate-950 shadow-2xl">
      <header className="shrink-0 border-b border-slate-300 p-4">
        <h2 data-dialog-title className="text-xl font-bold">{presentation.title}</h2>
        <p className="mt-1 text-sm">{decision.prompt}</p>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">Notebook</h3>
          {!entries.some((entry) => entry.id === 'glucagon') && (
            // TBC SME
            <p role="status" className="mb-3 border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
              <strong>Priya: </strong>Nothing about the glucagon? You found it this morning — and it isn't in the book, so it isn't in the handover, so tomorrow's nurse doesn't know. That's how things get lost. Write down what you notice.
            </p>
          )}
          <div className="space-y-2">
            {entries.filter((entry) => !sheet.includes(entry.id)).map((entry) => (
              <HandoverLine key={entry.id} decisionId={decision.id} {...entry} disabled={frozen} />
            ))}
            {entries.every((entry) => sheet.includes(entry.id)) && <p className="text-sm text-slate-500">No lines left.</p>}
          </div>
        </section>
        <section
          ref={zone.ref as React.Ref<HTMLDivElement>}
          {...zone.props}
          className={`min-h-40 rounded border-2 border-dashed bg-white p-3 ${zone.isOver || zone.isTarget ? 'border-primary' : 'border-slate-400'}`}
        >
          <h3 className="mb-1 font-bold">{presentation.sheet}</h3>
          <p className="mb-3 text-xs text-slate-500">What is ready · What is outstanding · What to watch</p>
          <div className="space-y-2">
            {sheet.map((id) => {
              const line = entries.find((entry) => entry.id === id) ?? { id, label: decision.options.find((option) => option.id === id)?.label ?? id };
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`option-${decision.id}-${id}`}
                  data-chosen="true"
                  disabled={frozen}
                  onClick={() => setSheet((current) => current.filter((item) => item !== id))}
                  className="block min-h-11 w-full rounded border border-slate-300 bg-amber-50 px-3 py-2 text-left text-sm"
                >
                  {line.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <footer className="flex shrink-0 gap-2 border-t border-slate-300 p-4">
        <Button type="button" disabled={frozen || sheet.length === 0} data-testid={`confirm-${decision.id}`} onClick={() => onAnswer(sheet)}>
          Sign handover
        </Button>
        {saved.length > 0 && <Button type="button" variant="outline" onClick={onClose}>Done</Button>}
      </footer>
    </section>
  );
}

function HandoverLine({ decisionId, id, label, disabled }: { decisionId: string; id: string; label: string; disabled: boolean }) {
  const drag = useDraggable({ id, kind: 'handover-line', label, disabled });
  return (
    <div
      {...drag.props}
      data-testid={`option-${decisionId}-${id}`}
      className={`relative min-h-11 rounded border border-slate-300 bg-amber-50 px-3 py-2 text-sm shadow-sm ${drag.isLifted ? 'ring-2 ring-primary' : ''}`}
    >
      {label}
    </div>
  );
}