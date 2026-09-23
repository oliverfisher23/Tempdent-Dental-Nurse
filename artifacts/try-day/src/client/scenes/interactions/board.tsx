import { useEffect, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

const acceptsJob = (kind: string) => kind === 'plan-job';

export function BoardInteraction(props: InteractionProps<'board'>) {
  return <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title} className="max-w-5xl"><DragProvider><BoardWorkspace {...props} /></DragProvider></CloseUp>;
}

function BoardWorkspace({ decision, presentation, answer, frozen, onAnswer, onClose }: InteractionProps<'board'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(!saved && !frozen);
  const jobs = [...new Map(decision.options.map((option) => {
    const id = option.id.split(':')[0];
    return [id, { id, label: option.label }];
  })).values()];
  const answerKey = JSON.stringify(answer);
  useEffect(() => {
    const restored: Record<string, string> = {};
    for (const pair of saved ?? []) {
      const split = pair.lastIndexOf(':');
      if (split > 0) restored[pair.slice(0, split)] = pair.slice(split + 1);
    }
    setPlacements(restored);
    setEditing(!saved && !frozen);
  }, [answerKey, frozen]);
  const place = (job: string, column: string) => { if (editing) { kitchenAudio.play('tap'); setPlacements({ ...placements, [job]: column }); } };
  const result = presentation.columns.flatMap((column) => jobs.filter((job) => placements[job.id] === column.id).map((job) => `${job.id}:${column.id}`));
  const answered = saved !== null && !editing;
  const right = answered && isCorrect(decision, answer);

  return <section data-testid={`decision-${decision.id}`} data-state={answered ? (right ? 'right' : 'wrong') : 'open'} className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-white">
    <header className="border-b border-slate-700 px-4 py-3"><h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2><p className="text-sm text-slate-300">{decision.prompt}</p></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex flex-wrap gap-2">{jobs.filter((job) => !placements[job.id]).map((job) => <Job key={job.id} id={job.id} decisionId={decision.id} label={job.label} disabled={!editing} />)}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{presentation.columns.map((column) => <BoardColumn key={column.id} id={column.id} decisionId={decision.id} label={column.label} jobs={jobs.filter((job) => placements[job.id] === column.id)} disabled={!editing} onDrop={(job) => place(job, column.id)} onRemove={(job) => { const next = { ...placements }; delete next[job]; setPlacements(next); }} />)}</div>
      <p className="mt-3 text-sm text-slate-300">The Ask column names the job you need help with and who you are asking.</p>
      <div className="mt-4 flex gap-2">{editing ? <Button data-testid={`confirm-${decision.id}`} disabled={Object.keys(placements).length !== jobs.length} onClick={() => { kitchenAudio.play('confirm'); onAnswer(result); setEditing(false); }}>Tell Priya the plan</Button> : <><Button onClick={onClose}>Done</Button>{!frozen && <Button variant="secondary" data-testid={`change-${decision.id}`} onClick={() => setEditing(true)}>Change answer</Button>}</>}</div>
    </div>
  </section>;
}

function Job({ id, decisionId, label, disabled }: { id: string; decisionId: string; label: string; disabled: boolean }) {
  const drag = useDraggable({ id, kind: 'plan-job', label, disabled });
  return <div {...drag.props} data-testid={`option-${decisionId}-${id}`} className={`relative min-h-11 rounded border px-3 py-2 text-sm ${drag.isLifted ? 'border-yellow-300 bg-yellow-950' : 'border-slate-500 bg-slate-800'}`}>{label}</div>;
}

function BoardColumn({ id, decisionId, label, jobs, disabled, onDrop, onRemove }: { id: string; decisionId: string; label: string; jobs: { id: string; label: string }[]; disabled: boolean; onDrop: (id: string) => void; onRemove: (id: string) => void }) {
  const zone = useDropZone({ id: `${decisionId}-${id}`, label, accepts: acceptsJob, onDrop, disabled });
  return <section ref={zone.ref as React.Ref<HTMLElement>} {...zone.props} className={`min-h-32 rounded border-2 p-3 ${zone.isOver || zone.isTarget ? 'border-yellow-300 bg-yellow-950' : 'border-slate-500 bg-slate-900'}`}><h3 className="border-b border-slate-600 pb-2 font-bold">{label}</h3><div className="mt-2 space-y-2">{jobs.map((job) => <button key={job.id} type="button" disabled={disabled} onClick={() => onRemove(job.id)} className="min-h-11 w-full rounded bg-white p-2 text-left text-sm text-slate-900">{job.label}</button>)}{!jobs.length && <p className="text-xs text-slate-400">{zone.carrying ? `Put ${zone.carrying} here` : 'Place a job here'}</p>}</div></section>;
}