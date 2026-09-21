import { useCallback } from 'react';
import { CHILL_RULES, MARCUS_TRAY_READINGS, MEASURED_DEPTHS_MM, PREP_SHEET, type ChillInterval } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { evaluateChill, readingIsRight, type ChillState } from '@/lib/simulation';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { Clipboard } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { SignaturePad, type SignatureValue } from '../../kitchen/interact';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fullestTray } from './chiller';
import type { ChillActions } from './types';
import { WorkspaceOpener } from '@/components/kitchen/workspace-opener';

const INTERVALS: ChillInterval[] = [...CHILL_RULES.intervals, CHILL_RULES.extraInterval];

/** The chill record on its clipboard: readings written in by hand, signed at the bottom. */
export function ChillRecord({
  open,
  onClose,
  state,
  started,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  state: ChillState;
  started: boolean;
  actions: ChillActions;
}) {
  const { progress } = useProgress();
  const notepad = useNotepad();
  const canSign = evaluateChill({ ...state, studentSigned: true }).done;
  const yourDepth = PREP_SHEET.depthForKg(state.trays[fullestTray(state.trays)]);

  const onSignature = useCallback(
    (v: SignatureValue) => {
      if (state.studentSigned) return;
      if (v.inked || v.typed.trim() !== '') actions.onSign();
    },
    [state.studentSigned, actions],
  );

  return (
    <CloseUp isOpen={open} onClose={onClose} title={L.recordTitle}>
      <Clipboard>
        <div className="min-h-full px-5 pb-6 pt-9 sm:px-10 sm:py-7">
          <WorkspaceOpener
            taskId="chill-the-event-batch"
            what={L.opener.record.what}
            how={L.opener.record.how}
            done={L.opener.record.done}
            pattern="list"
            tone="light"
            className="mb-6"
          />
          <h3 data-dialog-title className="text-center font-sans text-2xl font-bold text-zinc-900 sm:text-3xl">{L.recordTitle}</h3>
          <p className="mb-6 border-b-2 border-zinc-200 pb-4 text-center font-mono text-xs text-zinc-500 sm:text-sm">{L.recordBatch}</p>

          <table className="kitchen-table mb-6 block w-full sm:table">
            <caption className="sr-only">{L.comparisonNotice}</caption>
            <thead className="sr-only sm:table-header-group">
              <tr>
                {[L.columns.elapsed, L.columns.time, L.columns.yours, L.columns.marcus].map((h) => (
                  <th key={h} className="border-b-2 border-zinc-800 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {INTERVALS.map((interval) => {
                // The 120 line only exists once the batch has had to stay in past ninety.
                if (interval === CHILL_RULES.extraInterval && state.minutesElapsed < CHILL_RULES.extraInterval) return null;
                const reached = started && state.minutesElapsed >= interval;
                const row = state.readings[interval];
                const noted = notepad.entryFor('interval', interval);
                const readingMismatch = !!row?.value && !readingIsRight(interval, row.value);
                const errorId = `chill-record-${interval}-error`;
                return (
                  <tr key={interval} className={cn('mb-3 block rounded-lg border border-zinc-200 p-3 transition-opacity duration-200 sm:mb-0 sm:table-row sm:rounded-none sm:border-x-0 sm:border-t-0 sm:p-0', !reached && 'opacity-40')}>
                    <td className="flex items-center justify-between py-1 font-mono text-lg font-bold text-zinc-800 sm:table-cell sm:py-2.5">
                      <span className="font-sans text-xs font-bold text-zinc-500 sm:hidden">{L.columns.elapsed}</span>
                      {interval} <span className="text-sm text-zinc-600">{L.min}</span>
                    </td>
                    <td className="flex items-center justify-between py-1 text-lg text-zinc-600 sm:table-cell sm:py-2.5 sm:pr-4" style={{ fontFamily: 'cursive' }}>
                      <span className="font-sans text-xs font-bold text-zinc-500 sm:hidden">{L.columns.time}</span>
                      {row?.time || <span className="text-zinc-300">–</span>}
                    </td>
                    <td className="py-2 sm:table-cell sm:py-2.5 sm:pr-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <label htmlFor={`chill-record-${interval}`} className="text-xs font-bold text-zinc-500 sm:sr-only">
                          {L.columns.yours}, {interval} {L.min}
                        </label>
                        <Input
                          id={`chill-record-${interval}`}
                          value={row?.value || ''}
                          onChange={(e) => actions.onReading(interval, e.target.value)}
                          disabled={!reached}
                          placeholder="–"
                          inputMode="decimal"
                          aria-invalid={readingMismatch}
                           aria-describedby={readingMismatch ? errorId : !reached ? `${errorId}-locked` : undefined}
                          className="kitchen-input w-28 text-xl"
                          style={{ fontFamily: 'cursive' }}
                          data-testid={`reading-${interval}`}
                        />
                        {readingMismatch && <p id={errorId} role="alert" className="text-xs font-medium text-red-700">{L.readingMismatch}</p>}
                         {!reached && <p id={`${errorId}-locked`} className="text-xs text-zinc-500">{L.readingLockedHint(interval)}</p>}
                        {reached && noted && !row?.value && <p className="text-xs text-zinc-600">{L.savedNote(noted.value)}</p>}
                      </div>
                    </td>
                    <td className="flex items-center justify-between py-1 font-mono text-lg text-zinc-500 sm:table-cell sm:py-2.5">
                      <span className="font-sans text-xs font-bold text-zinc-500 sm:hidden">{L.columns.marcus}</span>
                      {reached ? `${MARCUS_TRAY_READINGS[interval].toFixed(1)}°C` : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {state.measuredDepths && (
            <p className="mb-6 border-l-4 border-zinc-300 pl-3 text-lg text-zinc-700" style={{ fontFamily: 'cursive' }}>
              {L.depthLine(yourDepth, MEASURED_DEPTHS_MM.yours, MEASURED_DEPTHS_MM.marcus)}
            </p>
          )}

          <div className="flex flex-col gap-8 border-t-2 border-zinc-800 pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{L.checkedBy}</div>
              {state.studentSigned ? (
                <div className="inline-block min-w-[240px] border-b-2 border-zinc-300 px-6 py-2 text-4xl text-zinc-800" style={{ fontFamily: 'cursive' }} data-testid="signed">
                  {progress.studentName}
                </div>
              ) : (
                <div className={cn(!canSign && 'pointer-events-none opacity-40')}>
                  <SignaturePad value={{ inked: false, typed: '' }} onChange={onSignature} label={L.signHere} disabled={!canSign} width={300} height={110} />
                  {!canSign && <p className="mt-2 text-xs text-zinc-500">{L.signHint}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{L.execChef}</div>
              <div className="inline-block min-w-[200px] border-b-2 border-zinc-200 px-6 py-3 text-sm italic text-zinc-600">{L.elenaSigns}</div>
            </div>
          </div>
        </div>
      </Clipboard>
    </CloseUp>
  );
}
