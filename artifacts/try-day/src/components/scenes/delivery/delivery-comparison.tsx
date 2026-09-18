import { useState } from 'react';
import { DELIVERY_LINES, ORDER_LINES } from '@/content/activities';
import { SCENE_LABELS } from '@/content/scenes/delivery';
import { getTask } from '@/lib/simulation';
import { deliveryDisclosureReady } from '@/lib/delivery-workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DeliveryWorkspaceProps } from './goods-in';

const copy = SCENE_LABELS.comparisonSheet;
const selectStyle = 'mt-2 min-h-11 w-full rounded-md border border-white/25 bg-zinc-900 px-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

export function DeliveryComparison({ state, onUpdateState, onNavigate }: DeliveryWorkspaceProps & { onNavigate: (target: string) => void }) {
  const [attempted, setAttempted] = useState(false);
  const [workedHelp, setWorkedHelp] = useState(false);
  const product = ORDER_LINES.find((line) => line.id === state.report.productId);
  const row = product ? state.lines[product.id] : undefined;
  const noteLine = ORDER_LINES.find((line) => line.id === state.noteLineId);
  const ready = deliveryDisclosureReady(state);
  const check = () => {
    setAttempted(true);
    onUpdateState((previous) => deliveryDisclosureReady(previous) ? { ...previous, contextRevealed: true } : previous);
  };

  return (
    <div className="space-y-6 text-sm">
      <p className="text-zinc-300">{copy.instruction}</p>
      <div>
        <label htmlFor="delivery-compare-product" className="font-bold">{copy.product}</label>
        <select id="delivery-compare-product" className={selectStyle} value={state.report.productId} onChange={(event) => onUpdateState((previous) => ({ ...previous, report: { ...previous.report, productId: event.target.value } }))}>
          <option value="">{copy.choose}</option>
          {ORDER_LINES.map((line) => <option key={line.id} value={line.id}>{line.item}</option>)}
        </select>
      </div>
      {product && (
        <dl className="grid grid-cols-2 gap-4 rounded border border-white/15 bg-black/40 p-4">
          {[[copy.ordered, product.ordered], [copy.claimed, product.onDeliveryNote], [copy.observed, row?.arrived || copy.blank], [copy.accepted, row?.acceptedAmount || copy.blank]].map(([label, value]) => (
            <div key={label}><dt className="text-xs text-zinc-400">{label}</dt><dd className="mt-1 font-mono">{value} {product.unit}</dd></div>
          ))}
        </dl>
      )}
      <div>
        <label htmlFor="delivery-missing" className="font-bold">{copy.missing}{product ? ` (${product.unit})` : ''}</label>
        <Input id="delivery-missing" inputMode="decimal" value={state.missingAmount} onChange={(event) => onUpdateState((previous) => ({ ...previous, missingAmount: event.target.value }))} className="mt-2 max-w-48 border-white/25 bg-zinc-900 text-white" />
      </div>
      <fieldset className="space-y-4 rounded border border-white/20 p-4">
        <legend className="px-2 font-bold">{copy.proposal}</legend>
        <p className="text-zinc-300">{copy.proposalHelp}</p>
        <div>
          <label htmlFor="delivery-proposed-line">{copy.fishLine}</label>
          <select id="delivery-proposed-line" className={selectStyle} value={state.noteLineId} onChange={(event) => onUpdateState((previous) => ({ ...previous, noteLineId: event.target.value }))}>
            <option value="">{copy.chooseFish}</option>
            {ORDER_LINES.filter((line) => line.trolley === 1).map((line) => <option key={line.id} value={line.id}>{line.item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="delivery-proposed-amount">{copy.amount}{noteLine ? ` (${noteLine.unit})` : ''}</label>
          <Input id="delivery-proposed-amount" inputMode="decimal" value={state.noteAmendedTo} onChange={(event) => onUpdateState((previous) => ({ ...previous, noteAmendedTo: event.target.value }))} className="mt-2 max-w-48 border-white/25 bg-zinc-900 text-white" />
        </div>
        <Button variant="secondary" disabled={!noteLine || !state.lines[noteLine.id]?.acceptedAmount} onClick={() => onUpdateState((previous) => ({ ...previous, noteAmendedTo: previous.lines[previous.noteLineId]?.acceptedAmount ?? previous.noteAmendedTo }))}>{copy.useAccepted}</Button>
      </fieldset>
      <details className="rounded border border-white/15 p-3">
        <summary className="cursor-pointer font-bold focus-visible:outline focus-visible:outline-2">{copy.hintTitle}</summary>
        <p className="mt-3">{copy.hintFind}</p><p className="mt-2">{copy.hintMethod}</p>
        {state.contextRevealed && <Button variant="secondary" className="mt-3" onClick={() => setWorkedHelp(true)}>{copy.hintWorked}</Button>}
        {workedHelp && state.contextRevealed && <p className="mt-3">{copy.worked}</p>}
      </details>
      <Button onClick={check}>{copy.check}</Button>
      {attempted && !ready && <p role="alert" className="rounded border border-amber-400/40 p-3 text-amber-100">{copy.incomplete}</p>}
      {state.contextRevealed && (
        <section className="space-y-3 rounded border border-white/25 bg-white/5 p-4" aria-label={copy.serviceContext} aria-live="polite">
          <h3 className="font-bold">{copy.serviceContext}</h3>
          <p>{getTask('check-the-delivery-in').complication}</p>
          <p className="text-zinc-300"><strong>{DELIVERY_LINES.driverOnShort.speaker}: </strong>{DELIVERY_LINES.driverOnShort.text}</p>
          <p className="text-xs text-zinc-400">{copy.editHint}</p>
          <Button onClick={() => onNavigate('report')}>{copy.goReport}</Button>
        </section>
      )}
    </div>
  );
}