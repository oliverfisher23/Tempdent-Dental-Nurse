import { useCallback } from 'react';
import { CHILL_RULES, MARCUS_TRAY_READINGS, MEASURED_DEPTHS_MM, PREP_SHEET, type ChillInterval } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { type ChillState } from '@/lib/simulation';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { Clipboard } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { SignaturePad, type SignatureValue } from '../../kitchen/interact';
import { kitchenAudio } from '@/lib/audio';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fullestTray } from './chiller';
import type { ChillActions } from './types';

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
  const canSign = state.minutesElapsed >= CHILL_RULES.extraInterval && !!state.readings[CHILL_RULES.extraInterval]?.value;
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
          <h3 className="text-center font-sans text-2xl font-bold uppercase tracking-widest text-zinc-900 sm:text-3xl">{L.recordTitle}</h3>
          <p className="mb-6 border-b-2 border-zinc-200 pb-4 text-center font-mono text-xs uppercase tracking-widest text-zinc-500 sm:text-sm">{L.recordBatch}</p>

          <table className="kitchen-table mb-6 w-full">
            <thead>
              <tr>
                {[L.columns.elapsed, L.columns.time, L.columns.yours, L.columns.marcus].map((h) => (
                  <th key={h} className="border-b-2 border-zinc-800 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INTERVALS.map((interval) => {
                // The 120 line only exists once the batch has had to stay in past ninety.
                if (interval === CHILL_RULES.extraInterval && state.minutesElapsed < CHILL_RULES.extraInterval) return null;
                const reached = started && state.minutesElapsed >= interval;
                const row = state.readings[interval];
                const noted = notepad.entryFor('interval', interval);
                return (
                  <tr key={interval} className={cn('border-b border-zinc-200 transition-opacity duration-500', !reached && 'opacity-30')}>
                    <td className="py-2.5 font-mono text-lg font-bold text-zinc-800">
                      {interval} <span className="text-sm text-zinc-400">{L.min}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-lg text-zinc-600" style={{ fontFamily: 'cursive' }}>
                      {row?.time || <span className="text-zinc-300">–</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <Input
                          value={row?.value || ''}
                          onChange={(e) => actions.onReading(interval, e.target.value)}
                          disabled={!reached}
                          placeholder="–"
                          inputMode="decimal"
                          aria-label={`${L.columns.yours}, ${interval} ${L.min}`}
                          className="kitchen-input w-28 text-xl"
                          style={{ fontFamily: 'cursive' }}
                          data-testid={`reading-${interval}`}
                        />
                        {reached && noted && !row?.value && (
                          <button
                            type="button"
                            onClick={() => {
                              kitchenAudio.play('write');
                              actions.onReading(interval, noted.value.replace(/\s*°C$/, ''));
                            }}
                            className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary/20"
                          >
                            {L.useMyNote}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-lg text-zinc-500">{reached ? `${MARCUS_TRAY_READINGS[interval].toFixed(1)}°C` : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {state.measuredDepths && (
            <p className="mb-6 border-l-4 border-zinc-300 pl-3 text-lg text-zinc-700" style={{ fontFamily: 'cursive' }}>
              {L.depthLine(yourDepth, MEASURED_DEPTHS_MM.marcus)}
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
              <div className="inline-block min-w-[200px] border-b-2 border-zinc-200 px-6 py-3 text-sm italic text-zinc-400">{L.elenaSigns}</div>
            </div>
          </div>
        </div>
      </Clipboard>
    </CloseUp>
  );
}
