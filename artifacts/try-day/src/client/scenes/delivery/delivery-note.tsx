import { useEffect, useRef, useState } from 'react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { DELIVERY_LINES, ORDER_LINES } from '@client/content/activities';
import { DELIVERY_PAPERWORK } from '@client/content/scenes/delivery-paperwork';
import { canSignDelivery, deliveryAmendment, deliveryReviewIssues, lineNeedsAmendment } from '@client/lib/delivery-workflow';
import { useProgress } from '@client/lib/progress';
import type { DeliveryState } from '@client/lib/simulation';

interface DeliveryNoteProps {
  state: DeliveryState;
  onUpdateState: (recipe: (prev: DeliveryState) => DeliveryState) => void;
  onNavigate: (target: string) => void;
  onClose?: () => void;
}

export function DeliveryNote({ state, onUpdateState, onNavigate }: DeliveryNoteProps) {
  const { progress } = useProgress();
  const [reviewed, setReviewed] = useState(false);
  const [signatureStale, setSignatureStale] = useState(false);
  const wasSigned = useRef(state.signed);
  const copy = DELIVERY_PAPERWORK.note;
  const reviewIssues = deliveryReviewIssues(state);
  const isSignable = canSignDelivery(state);
  // The note offers an amendment wherever the learner's own sheet decision differs from
  // the supplier's claim, so the paperwork never tells them which lines to change.
  const amendmentLines = ORDER_LINES.filter((line) => lineNeedsAmendment(state, line.id));
  const updateAmendment = (lineId: string, updates: Partial<ReturnType<typeof deliveryAmendment>>) => {
    onUpdateState((previous) => ({
      ...previous,
      amendments: {
        ...(previous.amendments ?? {}),
        [lineId]: { ...deliveryAmendment(previous, lineId), ...updates },
      },
    }));
  };

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

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black pb-2 text-xs font-bold uppercase tracking-widest">
          <span>{copy.description}</span><span>{copy.quantity}</span>
        </div>
        {ORDER_LINES.map((line) => {
          const amendment = deliveryAmendment(state, line.id);
          const hasAmendment = Boolean(amendment.amendedTo.trim());
          return (
            <div key={line.id} className={`grid grid-cols-[1fr_auto] items-center gap-4 border-b border-zinc-200 py-3 ${hasAmendment ? 'bg-red-50 px-2' : ''}`}>
              <span className="font-bold">{line.item}</span>
              <div className="text-right">
                <span className="mr-2 text-xs text-zinc-500">{copy.originalClaim}</span>
                <span className={hasAmendment ? 'text-zinc-500 line-through' : ''}>
                  {line.onDeliveryNote} {line.unit}
                </span>
                {hasAmendment && (
                  <span className="ml-3 inline-block text-lg font-bold text-red-700" style={{ fontFamily: 'cursive' }}>
                    {amendment.amendedTo} {line.unit}
                    {amendment.refused && <span className="ml-2 text-sm">refused {amendment.temperature ? `${amendment.temperature} °C` : ''}</span>}
                    {amendment.initials && <span className="ml-2 text-sm">({amendment.initials})</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-5 border-t-2 border-black pt-5 font-sans">
        {amendmentLines.map((line) => {
          const amendment = deliveryAmendment(state, line.id);
          const acceptedAmount = state.lines[line.id]?.acceptedAmount ?? '';
          const hasAmendment = Boolean(amendment.amendedTo.trim());
          const isRefusal = state.lines[line.id]?.acceptance === 'refuse';
          return <fieldset key={line.id} className="space-y-4 rounded border border-zinc-300 p-4">
            <legend className="px-2 font-bold">{line.item}</legend>
            <div className="space-y-2">
              <label htmlFor={`amended-amount-${line.id}`} className="block text-sm font-bold">{copy.amendedAmount} ({line.unit})</label>
              <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`amended-amount-${line.id}`}
              inputMode="decimal"
              value={amendment.amendedTo}
              onChange={(event) => updateAmendment(line.id, { amendedTo: event.target.value })}
              className="h-11 bg-white"
            />
            <Button
              type="button"
              variant="outline"
              disabled={acceptedAmount.trim() === ''}
              onClick={() => updateAmendment(line.id, { amendedTo: acceptedAmount })}
            >
              {copy.useAcceptedAmount}
            </Button>
          </div>
          <p className="text-xs text-zinc-600">
            {!acceptedAmount.trim() ? copy.acceptedAmountUnavailable : copy.amendedAmountHint}
          </p>
        </div>

        {isRefusal && <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 font-bold">
            <input type="checkbox" checked={amendment.refused} onChange={(event) => updateAmendment(line.id, { refused: event.target.checked })} />
            {copy.recordRefused}
          </label>
          <div>
            <label htmlFor={`refusal-temperature-${line.id}`} className="block text-sm font-bold">{copy.refusalTemperature}</label>
            <Input id={`refusal-temperature-${line.id}`} inputMode="decimal" value={amendment.temperature}
              onChange={(event) => updateAmendment(line.id, { temperature: event.target.value })} className="mt-2 h-11 bg-white" />
          </div>
        </div>}

        <div className="space-y-2">
          <label htmlFor={`amendment-initials-${line.id}`} className="block text-sm font-bold">{copy.amendmentInitials}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`amendment-initials-${line.id}`}
              value={amendment.initials}
              disabled={!hasAmendment}
              maxLength={3}
              placeholder={copy.typeInitials}
              onChange={(event) => updateAmendment(line.id, { initials: event.target.value.toUpperCase() })}
              className="h-11 bg-white uppercase"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!hasAmendment || !progress.initials}
              onClick={() => updateAmendment(line.id, { initials: progress.initials })}
            >
              {copy.initialAmendment}
            </Button>
          </div>
          {!hasAmendment && <p className="text-xs text-zinc-600">{copy.initialHint}</p>}
          {hasAmendment && !progress.initials && <p className="text-xs text-zinc-600">{copy.savedInitialsReason}</p>}
        </div>
          </fieldset>;
        })}
        {amendmentLines.length === 0 && (
          <p className="text-sm text-zinc-600">{copy.noAmendments}</p>
        )}
        {amendmentLines.some((line) => deliveryAmendment(state, line.id).refused) && (
          <p className="rounded border border-zinc-300 bg-zinc-50 p-3 text-sm">
            <strong>{DELIVERY_LINES.driverOnRefusal.speaker}: </strong>{DELIVERY_LINES.driverOnRefusal.text}
          </p>
        )}
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
