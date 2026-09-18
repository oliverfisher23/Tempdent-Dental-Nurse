import { Button } from '@/components/ui/button';
import { DELIVERY_LINES, ORDER_LINES } from '@/content/activities';
import { DELIVERY_PAPERWORK } from '@/content/scenes/delivery-paperwork';
import {
  deliveryReportIssues,
  deliveryReportSnapshot,
  deliveryReportText,
} from '@/lib/delivery-workflow';
import { getTask, type DeliveryState } from '@/lib/simulation';

interface DeliveryReportProps {
  state: DeliveryState;
  onUpdateState: (recipe: (prev: DeliveryState) => DeliveryState) => void;
  onNavigate: (target: string) => void;
  onClose: () => void;
}

export function DeliveryReport({ state, onUpdateState, onNavigate, onClose }: DeliveryReportProps) {
  const copy = DELIVERY_PAPERWORK.report;
  const reportIssues = deliveryReportIssues(state);
  const message = deliveryReportText(state);
  const complication = getTask('check-the-delivery-in').complication;
  const unit = ORDER_LINES.find((line) => line.id === state.report.productId)?.unit;

  const updateReport = (patch: Partial<DeliveryState['report']>) => {
    onUpdateState((prev) => ({ ...prev, report: { ...prev.report, ...patch } }));
  };

  const sendReport = () => {
    if (!state.contextRevealed) return;
    onUpdateState((prev) => {
      if (!prev.contextRevealed) return prev;
      const valid = deliveryReportIssues(prev).length === 0;
      return {
        ...prev,
        reportAttempted: true,
        radioedMarcus: valid,
        reportSentSnapshot: valid ? deliveryReportSnapshot(prev) : '',
      };
    });
  };

  return (
    <div className="min-h-full bg-zinc-950 p-6 text-white">
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="report-product" className="block text-sm font-bold">{copy.product}</label>
          <select
            id="report-product"
            value={state.report.productId}
            onChange={(event) => updateReport({ productId: event.target.value })}
            className="h-12 w-full rounded-md border border-white/20 bg-zinc-900 px-3 text-white"
          >
            <option value="">{copy.chooseProduct}</option>
            {ORDER_LINES.map((line) => <option key={line.id} value={line.id}>{line.item}</option>)}
          </select>
        </div>

        <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
          <div className="text-sm font-bold">{copy.savedShortage}</div>
          <div className="mt-1 font-mono text-xl">{state.missingAmount.trim() ? `${state.missingAmount} ${unit ?? ''}` : copy.noSavedShortage}</div>
          <button type="button" onClick={() => onNavigate('comparison')} className="mt-2 text-sm text-sky-300 underline underline-offset-2">
            {copy.editComparison}
          </button>
        </div>

        {!state.contextRevealed ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-900/30 p-4 text-sm text-amber-300">{copy.lockedContext}</p>
        ) : (
          <section aria-labelledby="report-context-heading" className="rounded-lg border border-amber-500/30 bg-amber-900/20 p-4">
            <h3 id="report-context-heading" className="mb-1 font-bold text-amber-300">{copy.contextHeading}</h3>
            <p className="text-sm text-amber-100">{complication}</p>
          </section>
        )}

        <fieldset disabled={!state.contextRevealed} className="space-y-6 disabled:opacity-40">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">{copy.service}</legend>
            {([
              ['tomorrow-lunch', copy.serviceOptions.tomorrowLunch],
              ['tonight-launch', copy.serviceOptions.tonightLaunch],
              ['both', copy.serviceOptions.both],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900 p-3">
                <input type="radio" name="report-service" value={value} checked={state.report.service === value} onChange={() => updateReport({ service: value })} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold">{copy.action}</legend>
            {([
              ['contact-supplier', copy.actionOptions.contactSupplier],
              ['change-tonight-menu', copy.actionOptions.changeTonightMenu],
              ['no-follow-up', copy.actionOptions.noFollowUp],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900 p-3">
                <input type="radio" name="report-action" value={value} checked={state.report.action === value} onChange={() => updateReport({ action: value })} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </fieldset>

        <section aria-labelledby="message-preview-heading" className="rounded-lg border border-sky-500/30 bg-sky-950/40 p-4">
          <h3 id="message-preview-heading" className="font-bold text-sky-200">{copy.previewHeading}</h3>
          <p className="mt-1 text-xs text-sky-300">{copy.previewHint}</p>
          <p className="mt-3 text-sm leading-relaxed text-white">{message}</p>
        </section>

        {state.contextRevealed && state.reportAttempted && (
          <section aria-labelledby="terence-reply-heading" className="rounded-lg border border-white/20 bg-zinc-900 p-4">
            <h3 id="terence-reply-heading" className="mb-1 font-bold">{copy.terenceReply}</h3>
            <p className="text-sm text-zinc-200">{DELIVERY_LINES.marcusOnRadio.text}</p>
          </section>
        )}

        {state.reportAttempted && !state.radioedMarcus && reportIssues.length > 0 && (
          <section aria-labelledby="report-errors-heading" aria-live="polite" className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-red-200">
            <h3 id="report-errors-heading" className="mb-2 font-bold">{copy.correctionHeading}</h3>
            <ul className="space-y-3">
              {reportIssues.map((issue, index) => (
                <li key={`${issue.message}-${index}`} className="text-sm">
                  <span>{issue.message}</span>{' '}
                  <button type="button" onClick={() => onNavigate(issue.target)} className="font-bold underline underline-offset-2">
                    {copy.sourceLink}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Button type="button" className="h-14 w-full text-lg font-bold" disabled={!state.contextRevealed} onClick={sendReport}>
          {state.reportAttempted ? copy.resend : copy.send}
        </Button>

        {state.radioedMarcus && (
          <section aria-labelledby="sent-heading" aria-live="polite" className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-4 text-emerald-200">
            <h3 id="sent-heading" className="font-bold">{copy.sentHeading}</h3>
            <p className="mt-2 text-sm text-white">{message}</p>
            <Button type="button" variant="outline" className="mt-4 bg-transparent border-emerald-500/50 text-emerald-200 hover:bg-emerald-900 hover:text-white" onClick={onClose}>
              {copy.close}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
