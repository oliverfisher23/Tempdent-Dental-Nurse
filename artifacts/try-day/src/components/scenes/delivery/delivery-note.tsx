import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ORDER_LINES } from '@/content/activities';
import { DELIVERY_PAPERWORK } from '@/content/scenes/delivery-paperwork';
import { canSignDelivery, deliveryReviewIssues } from '@/lib/delivery-workflow';
import { useProgress } from '@/lib/progress-store';
import type { DeliveryState } from '@/lib/simulation';

interface DeliveryNoteProps {
  state: DeliveryState;
  onUpdateState: (recipe: (prev: DeliveryState) => DeliveryState) => void;
  onNavigate: (target: string) => void;
  onClose?: () => void;
}

export function DeliveryNote({ state, onUpdateState, onNavigate }: DeliveryNoteProps) {
  const fishLines = ORDER_LINES.filter((line) => line.trolley === 1);
  const { progress } = useProgress();
  const [reviewed, setReviewed] = useState(false);
  const [signatureStale, setSignatureStale] = useState(false);
  const wasSigned = useRef(state.signed);
  const copy = DELIVERY_PAPERWORK.note;
  const selectedLine = fishLines.find((line) => line.id === state.noteLineId);
  const acceptedAmount = selectedLine ? state.lines[selectedLine.id]?.acceptedAmount ?? '' : '';
  const hasAmendment = Boolean(selectedLine && state.noteAmendedTo.trim());
  const reviewIssues = deliveryReviewIssues(state);
  const isSignable = canSignDelivery(state);

  useEffect(() => {
    if (wasSigned.current && !state.signed) setSignatureStale(true);
    if (state.signed) setSignatureStale(false);
    wasSigned.current = state.signed;
  }, [state.signed]);

  return (
    <div className="min-h-full bg-[#fffdf8] p-6 font-mono text-black md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between border-b-2 border-black pb-4">
        <div>
          <h2 className="text-xl font-bold uppercase md:text-2xl">{copy.supplier}</h2>
          <div className="mt-1 text-sm text-zinc-600">{copy.number}</div>
        </div>
        <div className="sm:text-right text-sm text-zinc-600">
          <div>{copy.account}</div>
          <div>{copy.date}</div>
        </div>
      </div>

      <div className="mb-6 space-y-2 font-sans">
        <label htmlFor="affected-fish" className="block text-sm font-bold">{copy.affectedFish}</label>
        <select
          id="affected-fish"
          value={state.noteLineId}
          onChange={(event) => onUpdateState((prev) => ({ ...prev, noteLineId: event.target.value }))}
          className="h-11 w-full rounded-md border border-zinc-400 bg-white px-3 text-base"
        >
          <option value="">{copy.chooseFish}</option>
          {fishLines.map((line) => <option key={line.id} value={line.id}>{line.item}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black pb-2 text-xs font-bold uppercase tracking-widest">
          <span>{copy.description}</span><span>{copy.quantity}</span>
        </div>
        {fishLines.map((line) => {
          const selected = line.id === state.noteLineId;
          return (
            <div key={line.id} className={`grid grid-cols-[1fr_auto] items-center gap-4 border-b border-zinc-200 py-3 ${selected ? 'bg-red-50 px-2' : ''}`}>
              <span className="font-bold">{line.item}</span>
              <div className="text-right">
                <span className="mr-2 text-xs text-zinc-500">{copy.originalClaim}</span>
                <span className={selected && hasAmendment ? 'text-zinc-500 line-through' : ''}>
                  {line.onDeliveryNote} {line.unit}
                </span>
                {selected && hasAmendment && (
                  <span className="ml-3 text-lg font-bold text-red-700" style={{ fontFamily: 'cursive' }}>
                    {state.noteAmendedTo} {line.unit}
                    {state.amendmentInitials && <span className="ml-2 text-sm">({state.amendmentInitials})</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-5 border-t-2 border-black pt-5 font-sans">
        <div className="space-y-2">
          <label htmlFor="amended-amount" className="block text-sm font-bold">{copy.amendedAmount}{selectedLine ? ` (${selectedLine.unit})` : ''}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="amended-amount"
              inputMode="decimal"
              value={state.noteAmendedTo}
              disabled={!selectedLine}
              onChange={(event) => onUpdateState((prev) => ({ ...prev, noteAmendedTo: event.target.value }))}
              className="h-11 bg-white"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!selectedLine || acceptedAmount.trim() === ''}
              onClick={() => onUpdateState((prev) => {
                const savedAmount = prev.noteLineId ? prev.lines[prev.noteLineId]?.acceptedAmount ?? '' : '';
                return { ...prev, noteAmendedTo: savedAmount };
              })}
            >
              {copy.useAcceptedAmount}
            </Button>
          </div>
          <p className="text-xs text-zinc-600">
            {selectedLine && !acceptedAmount.trim() ? copy.acceptedAmountUnavailable : copy.amendedAmountHint}
          </p>
           {!selectedLine && <p className="text-xs text-zinc-600">{copy.chooseFishReason}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="amendment-initials" className="block text-sm font-bold">{copy.amendmentInitials}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="amendment-initials"
              value={state.amendmentInitials}
              disabled={!hasAmendment}
              maxLength={3}
              placeholder={copy.typeInitials}
              onChange={(event) => onUpdateState((prev) => ({ ...prev, amendmentInitials: event.target.value.toUpperCase() }))}
              className="h-11 bg-white uppercase"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!hasAmendment || !progress.initials}
              onClick={() => onUpdateState((prev) => ({ ...prev, amendmentInitials: progress.initials }))}
            >
              {copy.initialAmendment}
            </Button>
          </div>
          {!hasAmendment && <p className="text-xs text-zinc-600">{copy.initialHint}</p>}
           {hasAmendment && !progress.initials && <p className="text-xs text-zinc-600">{copy.savedInitialsReason}</p>}
        </div>
      </div>

      <div className="mt-10 border-t border-black pt-6 font-sans">
        {signatureStale && (
          <p role="status" className="mb-4 border border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
            {copy.signatureStale}
          </p>
        )}
        <div className="mb-2 text-xs font-bold text-zinc-500">{copy.received}</div>
        {state.signed ? (
          <div>
            <div className="max-w-[240px] border-b border-black px-8 py-2 text-center text-3xl text-blue-800" style={{ fontFamily: 'cursive' }}>
              {state.signature}
            </div>
            <span className="sr-only">{copy.signed}</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setReviewed(true)}>
              {copy.review}
            </Button>
            <Button
              type="button"
              disabled={!isSignable || !progress.initials}
              onClick={() => onUpdateState((prev) => ({ ...prev, signed: true, signature: progress.initials }))}
              className="border-2 border-black font-bold"
            >
              {copy.sign}
            </Button>
          </div>
        )}
        {!state.signed && (!isSignable || !progress.initials) && <p className="mt-2 text-xs text-zinc-600">{copy.signReason}</p>}
        {reviewed && reviewIssues.length > 0 && (
          <section aria-labelledby="note-review-heading" aria-live="polite" className="mt-4 rounded border border-red-300 bg-red-50 p-4">
            <h3 id="note-review-heading" className="mb-2 font-bold text-red-900">{copy.reviewHeading}</h3>
            <ul className="space-y-2">
              {reviewIssues.map((issue, index) => (
                <li key={`${issue.target}-${index}`}>
                  <button type="button" onClick={() => onNavigate(issue.target)} className="text-left text-sm text-red-800 underline underline-offset-2">
                    {ORDER_LINES.find((line) => line.id === issue.target)?.item}{ORDER_LINES.some((line) => line.id === issue.target) ? ': ' : ''}{issue.message} <span className="sr-only">{copy.goToSource}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
