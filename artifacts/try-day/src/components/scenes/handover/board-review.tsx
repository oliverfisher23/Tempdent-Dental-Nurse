import { FRIDGE_UNITS } from '@/content/activities';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { LogBook, LogBookHeader } from '../../kitchen/log-book';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import type { HandoverState } from '@/lib/simulation';
import { FLAGGED_FRIDGE_ID } from '@/lib/handover-round';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { FridgeBackdrop } from './fridge-backdrop';

export function BoardReview({
  state,
  frozen = false,
  onRecheck
}: {
  state: HandoverState;
  frozen?: boolean;
  onRecheck: (unitId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useKitchenAction('handover:workspace', () => {
    containerRef.current?.focus();
  });

  return (
    <div className="absolute inset-0 z-0 bg-background" data-testid="handover-board">
      {/* The photograph stays put behind the page; only the log book scrolls. */}
      <FridgeBackdrop />
      <div className="absolute inset-0 flex flex-col overflow-y-auto" ref={containerRef} tabIndex={-1}>
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-8 py-12 flex flex-col min-h-full">
        <LogBook>
          <LogBookHeader round={HANDOVER_LABELS.boardRound} />

          <div className="overflow-x-auto pb-4 hide-scrollbar">
            {/* Desktop Table */}
            <table className="log-book-table w-full hidden md:table">
              <thead>
                <tr>
                  <th className="w-1/4">Equipment / Limit</th>
                  <th className="w-24">Reading °C</th>
                  <th className="w-24">Time</th>
                  <th className="w-24">Initials</th>
                  <th>Notes</th>
                  <th className="w-24 bg-white border-0"></th>
                </tr>
              </thead>
              <tbody>
                {FRIDGE_UNITS.map(unit => {
                  const row = state.rows[unit.id];
                  const isFlagged = unit.id === FLAGGED_FRIDGE_ID;
                  const isWarm = unit.actualC > unit.limitC;

                  return (
                    <tr key={unit.id} className="group hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2 px-2 bg-white">
                        <div className="font-bold text-[#272b3b]">{unit.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{unit.where} • {unit.limitLabel}</div>
                      </td>
                      <td className="py-2 px-2 text-center align-middle bg-white">
                        <span className="font-mono text-lg text-[#272b3b]" style={{ fontFamily: 'cursive' }}>
                          {row?.reading || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center align-middle bg-white">
                        <span className="font-mono text-sm text-slate-500" style={{ fontFamily: 'cursive' }}>
                          {row?.time || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center align-middle bg-white">
                        <span className="font-mono uppercase text-[#272b3b]" style={{ fontFamily: 'cursive' }}>
                          {row?.initials || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 align-middle bg-white">
                        <span className={cn("text-sm block py-1 text-left text-[#272b3b]", !row?.note && "text-slate-300 text-center opacity-50")} style={{ fontFamily: 'cursive' }}>
                          {row?.note || ((isWarm || isFlagged) ? '' : '-')}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right align-middle bg-[#f4f7f9] border-0 border-l-2 border-[#272b3b]">
                         <button
                           aria-label={`Recheck ${unit.name}`}
                           onClick={() => onRecheck(unit.id)}
                            disabled={frozen}
                            className="min-h-11 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded transition-colors whitespace-nowrap disabled:opacity-50"
                         >
                           {HANDOVER_LABELS.recheck}
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="flex flex-col gap-4 md:hidden pb-10">
              {FRIDGE_UNITS.map(unit => {
                const row = state.rows[unit.id];
                const isFlagged = unit.id === FLAGGED_FRIDGE_ID;
                const isWarm = unit.actualC > unit.limitC;

                return (
                  <div key={unit.id} className="bg-white border-2 border-[#272b3b] rounded-sm p-4 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4 border-b-2 border-slate-200 pb-2">
                      <div>
                        <div className="font-bold text-[#272b3b] text-lg uppercase tracking-tight">{unit.name}</div>
                        <div className="text-xs text-slate-500 font-bold">{unit.where} • {unit.limitLabel}</div>
                      </div>
                      <button
                        aria-label={`Recheck ${unit.name}`}
                        onClick={() => onRecheck(unit.id)}
                        disabled={frozen}
                        className="min-h-11 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded shrink-0 transition-colors disabled:opacity-50"
                      >
                        {HANDOVER_LABELS.recheck}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="border-r-2 border-slate-200 pr-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#272b3b] block mb-1">Reading</label>
                        <span className="font-mono text-lg block text-[#272b3b]" style={{ fontFamily: 'cursive' }}>
                          {row?.reading || '-'}
                        </span>
                      </div>
                      <div className="border-r-2 border-slate-200 pr-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#272b3b] block mb-1">Time</label>
                        <span className="font-mono text-sm block text-slate-500" style={{ fontFamily: 'cursive' }}>
                          {row?.time || '-'}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#272b3b] block mb-1">Initials</label>
                        <span className="font-mono text-base block uppercase text-[#272b3b]" style={{ fontFamily: 'cursive' }}>
                          {row?.initials || '-'}
                        </span>
                      </div>
                    </div>

                    {(row?.note || isWarm || isFlagged) && (
                      <div className="border-t-2 border-slate-200 pt-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#272b3b] block mb-1">Note</label>
                        <span className={cn("font-mono text-sm block", !row?.note && "text-slate-400 opacity-50")} style={{ fontFamily: 'cursive' }}>
                          {row?.note || '-'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </LogBook>
      </div>
      </div>
    </div>
  );
}
