import { useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { Clipboard } from '@kit/paper';
import { kitchenAudio } from '@kit/lib/audio';
import { useProgress } from '@client/lib/progress';
import type { InteractionProps } from './types';

export function InitialsInteraction({ decision, presentation, answer, frozen, onAnswer, isOpen, onClose }: InteractionProps<'initials'>) {
  const { progress } = useProgress();
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  return <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
    <Clipboard><section data-testid={`decision-${decision.id}`} className="space-y-4 p-5 text-zinc-900">
      <h2 data-dialog-title className="text-xl font-bold">{presentation.title}</h2>
      <ul className="list-disc pl-5">{presentation.sheets.map((sheet) => <li key={sheet}>{sheet}</li>)}</ul>
      <label className="block font-semibold">Your initials
        <input value={value} disabled={frozen || Boolean(answer)} onChange={(e) => setValue(e.target.value)}
          className="mt-1 block min-h-11 w-full rounded border-2 border-zinc-700 px-3" />
      </label>
      {reason && <p role="status" className="text-sm text-red-800">{reason}</p>}
      {!answer ? <Button type="button" data-testid={`confirm-${decision.id}`} onClick={() => {
        if (value.trim().toLowerCase() !== progress.initials.trim().toLowerCase()) { setReason('Enter the initials shown on your learner record.'); return; }
        kitchenAudio.play('write'); onAnswer(presentation.commits);
      }}>Initial both sheets</Button> : <Button type="button" onClick={onClose}>Done</Button>}
    </section></Clipboard>
  </CloseUp>;
}