import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered } from '@client/content/tasks';
import type { StickLabel } from '@client/content/tasks';
import type { InteractionProps } from './types';

export function StickInteraction(props: InteractionProps<'stick'>) {
  return (
    <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title} className="max-w-3xl">
      <DragProvider>
        <StickWorkspace {...props} />
      </DragProvider>
    </CloseUp>
  );
}

function StickWorkspace({ decision, presentation, answer, frozen, onAnswer, onClose }: InteractionProps<'stick'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [placed, setPlaced] = useState<string[]>(saved ?? []);
  const [aside, setAside] = useState('');

  useEffect(() => {
    setPlaced(saved ?? []);
    setAside('');
  }, [JSON.stringify(answer)]);

  const editing = !frozen && saved === null;
  const put = (fieldId: string, labelId: string) => {
    const field = presentation.fields.find((item) => item.id === fieldId);
    if (!editing || !field) return;
    if (field.accepts !== labelId) {
      kitchenAudio.play('wrong');
      setAside(decision.feedback.wrong);
      return;
    }
    kitchenAudio.play('write');
    setAside('');
    setPlaced((current) => current.includes(labelId) ? current : [...current, labelId]);
  };

  return (
    <section
      data-testid={`decision-${decision.id}`}
      className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-stone-100 text-slate-950 shadow-2xl"
    >
      <header className="shrink-0 border-b border-slate-300 bg-white px-4 py-3">
        <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{decision.prompt}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {presentation.picture && (
          <img src={presentation.picture} alt="The three product packages beside the clinical notes" className="mb-3 h-[clamp(4rem,20svh,8rem)] w-full rounded object-cover short:h-14" />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-600">Peel-off labels</h3>
            <div className="flex flex-wrap gap-2">
              {presentation.labels.filter((label) => !placed.includes(label.id)).map((label) => (
                <StickyLabel key={label.id} decisionId={decision.id} label={label} disabled={!editing} />
              ))}
              {!presentation.labels.some((label) => !placed.includes(label.id)) && <p className="text-sm text-slate-500">All labels placed</p>}
            </div>
          </div>
          <div className="rounded border border-slate-300 bg-[#fffdf4] p-3 shadow-sm">
            <h3 className="font-bold">Clinical notes — batch fields</h3>
            <div className="mt-3 space-y-3">
              {presentation.fields.map((field) => (
                <StickyField
                  key={field.id}
                  decisionId={decision.id}
                  field={field}
                  label={presentation.labels.find((item) => item.id === field.accepts)}
                  filled={placed.includes(field.accepts)}
                  disabled={!editing}
                  onDrop={(labelId) => put(field.id, labelId)}
                />
              ))}
            </div>
          </div>
        </div>
        {aside && <p role="status" className="mt-3 border-l-4 border-amber-500 bg-white p-3 text-sm">{aside}</p>}
        <div className="mt-4 flex gap-2">
          {editing ? (
            <Button
              type="button"
              disabled={placed.length === 0}
              data-testid={`confirm-${decision.id}`}
              onClick={() => onAnswer(placed)}
            >
              Save batch fields
            </Button>
          ) : (
            <Button type="button" onClick={onClose}>Done</Button>
          )}
        </div>
      </div>
    </section>
  );
}

function StickyLabel({ decisionId, label, disabled }: { decisionId: string; label: StickLabel; disabled: boolean }) {
  const draggable = useDraggable({
    id: label.id,
    kind: 'batch-label',
    label: `${label.item} ${label.fields.map((field) => `${field.field} ${field.value}`).join(' ')}`,
    disabled,
  });
  return (
    <div
      {...draggable.props}
      data-testid={`option-${decisionId}-${label.id}`}
      className={`relative min-h-11 max-w-full rotate-[-1deg] rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-left font-mono text-xs shadow ${draggable.isLifted ? 'ring-4 ring-sky-300' : ''}`}
    >
      <strong className="mr-2 font-sans">{label.item}</strong>
      {label.fields.map((field) => <span key={field.field} className="mr-2">{field.field} {field.value}</span>)}
    </div>
  );
}

function StickyField({
  decisionId, field, label, filled, disabled, onDrop,
}: {
  decisionId: string;
  field: { id: string; label: string; accepts: string };
  label?: StickLabel;
  filled: boolean;
  disabled: boolean;
  onDrop: (labelId: string) => void;
}) {
  const zone = useDropZone({
    id: `${decisionId}-${field.id}`,
    label: field.label,
    accepts: (kind) => kind === 'batch-label',
    onDrop,
    disabled: disabled || filled,
  });
  return (
    <div
      ref={zone.ref as React.Ref<HTMLDivElement>}
      {...zone.props}
      className={`min-h-16 rounded border-2 border-dashed p-2 ${zone.isOver || zone.isTarget ? 'border-sky-500 bg-sky-50' : filled ? 'border-emerald-500 bg-emerald-50' : 'border-slate-400'}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{field.label}</p>
      {filled && label ? (
        <p className="mt-1 rotate-[.5deg] rounded-sm bg-amber-50 px-2 py-1 font-mono text-sm shadow-sm">
          {label.fields[0]?.field} {label.fields[0]?.value}
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-500">{zone.carrying ? `Place ${zone.carrying} here` : 'Place one label here'}</p>
      )}
    </div>
  );
}