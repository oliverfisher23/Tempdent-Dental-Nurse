import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { CloseUp } from '@shell/frame/close-up';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import { playSfx } from '@client/lib/sounds';
import type { InteractionProps } from './types';

export function FlagsInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'flags'>) {
  const saved = Array.isArray(answer) && isAnswered(answer) ? answer : null;
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const answerKey = JSON.stringify(answer);
  useEffect(() => setDraft(saved ? null : []), [answerKey]);
  useEffect(() => { if (isOpen) { playSfx('box-lid'); kitchenAudio.play('page'); } }, [isOpen]);
  const editing = draft !== null && !frozen;
  const flags = editing ? draft : (saved ?? []);
  const answered = saved !== null;
  const right = answered && isCorrect(decision, answer);
  const toggle = (id: string) => { if (editing) { kitchenAudio.play('write'); setDraft(flags.includes(id) ? flags.filter((item) => item !== id) : [...flags, id]); } };
  return <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title} className="max-w-4xl">
    <section data-testid={`decision-${decision.id}`} data-state={answered ? (right ? 'right' : 'wrong') : 'open'} className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl bg-[#f7f0db] text-slate-950">
      <header className="border-b border-slate-400 px-4 py-3"><h2 data-dialog-title className="text-xl font-bold">{presentation.title}</h2><p className="text-sm">{decision.prompt}</p></header>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {presentation.picture && <img src={presentation.picture} alt="Open delivery box" className="mb-3 h-24 w-full rounded object-contain" />}
        <table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr>{['Item', 'Ordered', 'Delivered', 'Note', presentation.flag].map((heading) => <th key={heading} className="border border-slate-400 bg-slate-200 p-2">{heading}</th>)}</tr></thead>
          <tbody>{presentation.lines.map((line) => <tr key={line.id}><td className="border border-slate-400 p-2 font-bold">{line.item}</td><td className="border border-slate-400 p-2">{line.ordered}</td><td className="border border-slate-400 p-2">{line.delivered}</td><td className="border border-slate-400 p-2">{line.note}</td><td className="border border-slate-400 p-2"><button type="button" role="checkbox" aria-checked={flags.includes(line.id)} disabled={!editing} data-testid={`option-${decision.id}-${line.id}`} onClick={() => toggle(line.id)} className={`flex min-h-11 items-center gap-2 rounded border px-3 ${flags.includes(line.id) ? 'border-red-700 bg-red-100' : 'border-slate-500 bg-white'}`}><Flag className="h-4 w-4" />{flags.includes(line.id) ? 'Flagged' : 'Flag'}</button></td></tr>)}</tbody>
        </table>
        <div className="mt-4 flex gap-2">{editing ? <Button data-testid={`confirm-${decision.id}`} disabled={!flags.length} onClick={() => { kitchenAudio.play('confirm'); onAnswer(flags); setDraft(null); }}>Confirm flags</Button> : <><Button onClick={onClose}>Done</Button>{!frozen && <Button variant="secondary" data-testid={`change-${decision.id}`} onClick={() => setDraft(saved ?? [])}>Change answer</Button>}</>}</div>
      </div>
    </section>
  </CloseUp>;
}