import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { kitchenAudio } from '@kit/lib/audio';
import { playSfx } from '@client/lib/sounds';
import { inReadingOrder } from './layout';
import type { InteractionProps } from './types';

export function PathInteraction({ decision, presentation, answer, frozen, onAnswer, panelSlot }: InteractionProps<'path'>) {
  const [draft, setDraft] = useState<string[]>([]);
  const drawing = useRef(false);
  useEffect(() => setDraft([]), [JSON.stringify(answer)]);
  const add = (id: string) => setDraft((old) => old.at(-1) === id ? old : [...old, id]);
  const locate = (x: number, y: number, rect: DOMRect) => {
    const px = (x - rect.left) / rect.width * 100, py = (y - rect.top) / rect.height * 100;
    for (const [id, zone] of Object.entries(presentation.zones)) if (Math.hypot(px - zone.x, py - zone.y) <= (zone.r ?? 7)) add(id);
  };
  return <div className="absolute inset-0" onPointerDown={(e) => { if (frozen) return; drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); locate(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
    onPointerMove={(e) => drawing.current && locate(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
    onPointerUp={() => { drawing.current = false; if (draft.length) { playSfx('wipe'); onAnswer(draft); } }}>
    {inReadingOrder(Object.entries(presentation.zones), (zone) => zone).map(([id, zone]) => <button key={id} type="button"
      data-testid={`option-${decision.id}-${id}`} aria-label={decision.options.find((o) => o.id === id)?.label ?? id}
      className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${draft.includes(id) ? 'border-emerald-200 bg-emerald-300/45 shadow-[0_0_20px_8px_rgba(110,231,183,.45)]' : 'border-white bg-black/25'}`}
      style={{ left: `${zone.x}%`, top: `${zone.y}%` }} onClick={(e) => { e.stopPropagation(); kitchenAudio.play('tap'); add(id); }} />)}
    {panelSlot ? createPortal(
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground" role="status">{draft.length ? `${draft.length} of ${Object.keys(presentation.zones).length} wiped` : ''}</span>
        <button type="button" disabled={!draft.length} data-testid={`confirm-${decision.id}`} className="rounded bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
          onClick={() => onAnswer(draft)}>{presentation.finish}</button>
      </div>,
      panelSlot,
    ) : (
      <button type="button" disabled={!draft.length} data-testid={`confirm-${decision.id}`} className="absolute bottom-3 right-3 rounded bg-white px-3 py-2 text-sm font-bold text-slate-900"
        onClick={(e) => { e.stopPropagation(); onAnswer(draft); }}>{presentation.finish}</button>
    )}
  </div>;
}