import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { kitchenAudio } from '@kit/lib/audio';
import type { InteractionProps } from './types';

export function FindInteraction({ decision, presentation, answer, frozen, onAnswer, panelSlot }: InteractionProps<'find'>) {
  const saved = Array.isArray(answer) ? answer : [];
  const [found, setFound] = useState(saved);
  const [reply, setReply] = useState('');
  useEffect(() => setFound(saved), [JSON.stringify(saved)]);
  const add = (id: string) => {
    if (frozen || found.includes(id)) return;
    kitchenAudio.play('tap');
    const next = [...found, id];
    setFound(next);
    setReply(presentation.faults[id].done);
    if (next.length === Object.keys(presentation.faults).length) onAnswer(next);
  };
  const status = reply || presentation.counter.replace('{n}', String(Object.keys(presentation.faults).length - found.length));
  return (
    <div className="absolute inset-0">
      <img src={presentation.backdrop} alt={presentation.backdropAlt} className="absolute inset-0 h-full w-full object-cover" />
      {Object.entries(presentation.faults).map(([id, fault]) => (
        <button key={id} type="button" data-testid={`option-${decision.id}-${id}`}
          aria-label={decision.options.find((o) => o.id === id)?.label ?? id} disabled={frozen || found.includes(id)}
          className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 focus:ring-4 focus:ring-sky-300 ${found.includes(id) ? 'border-emerald-300 bg-emerald-300/35' : 'border-white bg-black/30'}`}
          style={{ left: `${fault.spot.x}%`, top: `${fault.spot.y}%` }} onClick={() => add(id)} />
      ))}
      {presentation.fine.map((fine, i) => (
        <button key={i} type="button" aria-label={fine.spot.hint ?? 'Check this area'}
          className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/20"
          style={{ left: `${fine.spot.x}%`, top: `${fine.spot.y}%` }}
          onClick={() => { kitchenAudio.play('tap'); setReply(fine.reply); }} />
      ))}
      {panelSlot ? createPortal(
        <p className="mt-2 text-sm font-semibold" role="status">{status}</p>,
        panelSlot,
      ) : (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/80 px-3 py-2 text-sm font-bold text-white" role="status">
          {status}
        </div>
      )}
    </div>
  );
}