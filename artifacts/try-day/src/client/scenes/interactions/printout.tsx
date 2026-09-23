import { CloseUp } from '@shell/frame/close-up';
import { kitchenAudio } from '@kit/lib/audio';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect } from '@client/content/tasks';
import type { InteractionProps } from './types';

export function PrintoutInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'printout'>) {
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  return <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title} className="max-w-2xl">
    <section data-testid={`decision-${decision.id}`} data-state={answered ? (right ? 'right' : 'wrong') : 'open'} className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl bg-slate-100 text-slate-950">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <article className="mx-auto max-w-lg border border-dashed border-slate-400 bg-white p-5 font-mono shadow">
          <h2 data-dialog-title className="text-center text-lg font-bold">{presentation.document.title}</h2>
          <dl className="mt-4 divide-y divide-slate-300">{presentation.document.rows.map((row) => <div key={row.label} className="grid grid-cols-2 gap-4 py-2"><dt>{row.label}</dt><dd className="text-right font-bold">{row.value}</dd></div>)}</dl>
          {presentation.document.footer && <p className="mt-4 border-t-2 border-slate-800 pt-3 text-center font-bold">{presentation.document.footer}</p>}
        </article>
        <p className="mt-4 text-sm"><strong>Priya's card:</strong> "Read the printout before you touch the load: cycle complete, time at temperature, and how long it's been sitting."</p>{/* TBC SME */}
        <fieldset disabled={answered || frozen} className="mt-4 space-y-2"><legend className="font-bold">{decision.prompt}</legend>{decision.options.map((option) => <Button key={option.id} variant="secondary" data-testid={`option-${decision.id}-${option.id}`} className="w-full justify-start whitespace-normal text-left" onClick={() => { kitchenAudio.play('page'); onAnswer(option.id); }}>{option.label}</Button>)}</fieldset>
        {answered && <div className="mt-4 flex gap-2"><Button onClick={onClose}>Done</Button>{!frozen && <Button variant="secondary" data-testid={`change-${decision.id}`} onClick={() => onAnswer(null)}>Change answer</Button>}</div>}
      </div>
    </section>
  </CloseUp>;
}