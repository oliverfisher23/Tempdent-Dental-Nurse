import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import { playSfx } from '@client/lib/sounds';
import type { InteractionProps } from './types';

const acceptsLoad = (kind: string) => kind === 'autoclave-load';

export function AutoclaveInteraction(props: InteractionProps<'autoclave'>) {
  return <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title}><DragProvider><AutoclaveWorkspace {...props} /></DragProvider></CloseUp>;
}

function AutoclaveWorkspace({ decision, presentation, answer, frozen, onAnswer, onClose }: InteractionProps<'autoclave'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answerKey = JSON.stringify(answer);
  useEffect(() => setDraft(saved ? null : []), [answerKey]);
  const editing = draft !== null && !frozen;
  const marks = editing ? draft : (saved ?? []);
  const add = (id: string) => { if (editing && !marks.includes(id)) { kitchenAudio.play('tap'); setDraft([...marks, id]); } };
  const chamber = useDropZone({ id: `${decision.id}-chamber`, label: 'Autoclave chamber', accepts: acceptsLoad, onDrop: add, disabled: !editing });
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);
  return <section data-testid={`decision-${decision.id}`} data-state={answered ? (right ? 'right' : 'wrong') : 'open'} className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-white">
    <header className="border-b border-slate-700 px-4 py-3"><h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2><p className="text-sm text-slate-300">{decision.prompt}</p></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">{Object.entries(presentation.items).map(([id, item]) => marks.includes(id) ? null : <LoadItem key={id} id={id} decisionId={decision.id} label={decision.options.find((o) => o.id === id)?.label ?? id} image={item.image} note={item.note} disabled={!editing} />)}</div>
        <div ref={chamber.ref as React.Ref<HTMLDivElement>} {...chamber.props} className={`min-h-44 rounded-t-[3rem] border-4 p-4 ${chamber.isOver || chamber.isTarget ? 'border-sky-300 bg-sky-950' : 'border-slate-500 bg-slate-800'}`}>
          <h3 className="font-bold">Autoclave chamber</h3><p className="text-xs text-slate-300">{chamber.carrying ? `Put ${chamber.carrying} here` : 'Leave room between the trays'}</p>
          <ul className="mt-3 space-y-2">{marks.filter((id) => id in presentation.items).map((id) => <li key={id} className="rounded border border-sky-400 bg-sky-950 p-2">{decision.options.find((o) => o.id === id)?.label}</li>)}</ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['indicator', 'log'].map((id) => <Button key={id} variant={marks.includes(id) ? 'default' : 'secondary'} data-testid={`option-${decision.id}-${id}`} disabled={!editing} onClick={() => add(id)}>{decision.options.find((o) => o.id === id)?.label}</Button>)}
      </div>
      <div className="mt-4 flex gap-2">{editing ? <Button data-testid={`confirm-${decision.id}`} disabled={marks.length < 2} onClick={() => { playSfx('autoclave'); kitchenAudio.play('confirm'); onAnswer(marks); setDraft(null); }}>{presentation.door}</Button> : <><Button onClick={onClose}>Done</Button>{!frozen && <Button variant="secondary" data-testid={`change-${decision.id}`} onClick={() => setDraft(saved ?? [])}>Change answer</Button>}</>}</div>
    </div>
  </section>;
}

function LoadItem({ id, decisionId, label, image, note, disabled }: { id: string; decisionId: string; label: string; image?: string; note?: string; disabled: boolean }) {
  const drag = useDraggable({ id, kind: 'autoclave-load', label, disabled });
  return <div {...drag.props} data-testid={`option-${decisionId}-${id}`} className={`relative flex min-h-16 items-center gap-3 rounded border p-2 ${drag.isLifted ? 'border-sky-300 bg-sky-950' : 'border-slate-500 bg-slate-800'}`}>{image && <img src={image} alt="" className="h-12 w-12 bg-white object-contain" />}<span><strong>{label}</strong>{note && <small className="block text-slate-300">{note}</small>}</span></div>;
}