import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

const acceptsInstrument = (kind: string) => kind === 'instrument';

export function ZonesInteraction(props: InteractionProps<'zones'>) {
  return (
    <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title}>
      <DragProvider><ZonesWorkspace {...props} /></DragProvider>
    </CloseUp>
  );
}

function ZonesWorkspace({ decision, presentation, answer, memory, frozen, onAnswer, onClose }: InteractionProps<'zones'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answerKey = JSON.stringify(answer);
  useEffect(() => setDraft(saved ? null : []), [answerKey]);
  const editing = draft !== null && !frozen;
  const pairs = editing ? draft : (saved ?? []);
  const place = (itemId: string, zoneId: string) => {
    if (!editing) return;
    kitchenAudio.play('tap');
    setDraft([...pairs.filter((pair) => !pair.startsWith(`${itemId}:`)), `${itemId}:${zoneId}`]);
  };
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);

  return (
    <section data-testid={`decision-${decision.id}`} data-state={answered ? (right ? 'right' : 'wrong') : 'open'} className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-white">
      <header className="shrink-0 border-b border-slate-700 px-4 py-3">
        <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
        <p className="text-sm text-slate-300">{decision.prompt}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {memory.pouchSetAside && (
          <aside className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300/40 bg-amber-950/50 p-3">
            <img src={presentation.items.broken_pouch?.image} alt="Pouch with a broken seal" className="h-16 w-16 object-contain" />
            <p className="text-sm"><strong>Priya's note:</strong> "Your broken-seal set from this morning — goes through with the rest."</p>{/* TBC SME */}
          </aside>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(presentation.items).filter(([id]) => id !== 'broken_pouch').map(([id, item]) => (
            <Instrument key={id} id={id} decisionId={decision.id} label={item.label} image={item.image} finding={item.finding} disabled={!editing} placement={pairs.find((pair) => pair.startsWith(`${id}:`))?.split(':')[1]} />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(presentation.zones).map(([id, zone]) => (
            <InstrumentZone key={id} id={id} decisionId={decision.id} label={zone.label} note={zone.note} disabled={!editing} onDrop={(item) => place(item, id)} count={pairs.filter((pair) => pair.endsWith(`:${id}`)).length} />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {editing ? <Button data-testid={`confirm-${decision.id}`} disabled={pairs.length !== Object.keys(presentation.items).filter((id) => id !== 'broken_pouch').length} onClick={() => { kitchenAudio.play('write'); onAnswer(pairs); setDraft(null); }}>Confirm the sort</Button> : <>
            <Button onClick={onClose}>Done</Button>
            {!frozen && <Button variant="secondary" data-testid={`change-${decision.id}`} onClick={() => setDraft(saved ?? [])}>Change answer</Button>}
          </>}
        </div>
      </div>
    </section>
  );
}

function Instrument({ id, decisionId, label, image, finding, disabled, placement }: { id: string; decisionId: string; label: string; image?: string; finding?: string; disabled: boolean; placement?: string }) {
  const drag = useDraggable({ id, kind: 'instrument', label, disabled });
  return <article {...drag.props} data-testid={`option-${decisionId}-${id}`} className={`relative rounded-lg border p-3 text-left ${drag.isLifted ? 'border-amber-300 bg-amber-950' : 'border-slate-600 bg-slate-900'}`}>
    {image && <img src={image} alt="" className="h-20 w-full rounded bg-white object-contain" />}
    <h3 className="mt-2 font-bold">{label}</h3>
    {finding && <p className="mt-1 text-xs text-slate-300">{finding}</p>}
    {placement && <p className="mt-2 text-xs font-bold uppercase text-amber-200">Placed: {placement.replaceAll('-', ' ')}</p>}
  </article>;
}

function InstrumentZone({ id, decisionId, label, note, disabled, onDrop, count }: { id: string; decisionId: string; label: string; note?: string; disabled: boolean; onDrop: (id: string) => void; count: number }) {
  const zone = useDropZone({ id: `${decisionId}-${id}`, label, accepts: acceptsInstrument, onDrop, disabled });
  return <div ref={zone.ref as React.Ref<HTMLDivElement>} {...zone.props} className={`min-h-24 rounded-lg border-2 border-dashed p-3 ${zone.isOver || zone.isTarget ? 'border-amber-300 bg-amber-950' : 'border-slate-500 bg-slate-800'}`}>
    <h3 className="font-bold">{label}</h3><p className="text-xs text-slate-300">{note}</p><p className="mt-2 text-sm">{zone.carrying ? `Put ${zone.carrying} here` : `${count} placed`}</p>
  </div>;
}