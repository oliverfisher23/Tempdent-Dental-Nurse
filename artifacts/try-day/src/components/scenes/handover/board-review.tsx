import { FRIDGE_UNITS } from '@/content/activities';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { Whiteboard } from '../../kitchen/paper';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import type { HandoverState } from '@/lib/simulation';
import { FLAGGED_FRIDGE_ID } from '@/lib/handover-round';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

export function BoardReview({
  state,
  onRecheck
}: {
  state: HandoverState;
  onRecheck: (unitId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useKitchenAction('handover:workspace', () => {
    containerRef.current?.focus();
  });

  return (
    <div className="absolute inset-0 z-0 bg-background flex flex-col overflow-y-auto" ref={containerRef} tabIndex={-1} data-testid="handover-board">
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-8 py-12 flex flex-col min-h-full">
        <Whiteboard>
          <div className="p-6 md:p-10 text-zinc-900">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-1 font-sans text-zinc-800">
              {HANDOVER_LABELS.boardTitle}
            </h2>
            <p className="text-center font-mono text-muted-foreground mb-8">{HANDOVER_LABELS.boardRound}</p>
            
            <div className="overflow-hidden">
              {/* Desktop Table */}
              <table className="kitchen-table w-full hidden md:table">
                <thead>
                  <tr>
                    <th className="w-1/4">Unit / Limit</th>
                    <th className="w-24 text-center">Reading °C</th>
                    <th className="w-24 text-center">Time</th>
                    <th className="w-24 text-center">Initials</th>
                    <th>Note</th>
                    <th className="w-24 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {FRIDGE_UNITS.map(unit => {
                    const row = state.rows[unit.id];
                    const isFlagged = unit.id === FLAGGED_FRIDGE_ID;
                    const isWarm = unit.actualC > unit.limitC;
                    
                    return (
                      <tr key={unit.id} className="group hover:bg-black/5 transition-colors">
                        <td className="py-4 px-2">
                          <div className="font-bold text-zinc-900">{unit.name}</div>
                          <div className="text-xs text-zinc-500">{unit.where} • {unit.limitLabel}</div>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className="font-mono text-lg" style={{ fontFamily: 'cursive' }}>
                            {row?.reading || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className="font-mono text-sm text-zinc-500" style={{ fontFamily: 'cursive' }}>
                            {row?.time || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className="font-mono uppercase" style={{ fontFamily: 'cursive' }}>
                            {row?.initials || '-'}
                          </span>
                        </td>
                        <td className="py-4 pl-4 pr-2">
                          <span className={cn("text-sm block py-1 text-left", !row?.note && "text-zinc-300 text-center")} style={{ fontFamily: 'cursive' }}>
                            {row?.note || ((isWarm || isFlagged) ? '' : '-')}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right align-middle">
                           <button
                             aria-label={`Recheck ${unit.name}`}
                             onClick={() => onRecheck(unit.id)}
                             className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-2 rounded transition-colors"
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
              <div className="flex flex-col gap-4 md:hidden">
                {FRIDGE_UNITS.map(unit => {
                  const row = state.rows[unit.id];
                  const isFlagged = unit.id === FLAGGED_FRIDGE_ID;
                  const isWarm = unit.actualC > unit.limitC;

                  return (
                    <div key={unit.id} className="bg-white border border-zinc-200 rounded p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold text-zinc-900 text-lg">{unit.name}</div>
                          <div className="text-xs text-zinc-500">{unit.where} • {unit.limitLabel}</div>
                        </div>
                        <button
                          aria-label={`Recheck ${unit.name}`}
                          onClick={() => onRecheck(unit.id)}
                          className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded shrink-0 transition-colors"
                        >
                          {HANDOVER_LABELS.recheck}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Reading</label>
                          <span className="font-mono text-lg block" style={{ fontFamily: 'cursive' }}>
                            {row?.reading || '-'}
                          </span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Time</label>
                          <span className="font-mono text-sm block" style={{ fontFamily: 'cursive' }}>
                            {row?.time || '-'}
                          </span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Initials</label>
                          <span className="font-mono text-sm block uppercase" style={{ fontFamily: 'cursive' }}>
                            {row?.initials || '-'}
                          </span>
                        </div>
                      </div>

                      {(row?.note || isWarm || isFlagged) && (
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Note</label>
                          <span className={cn("font-mono text-sm block", !row?.note && "text-zinc-400")} style={{ fontFamily: 'cursive' }}>
                            {row?.note || '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Whiteboard>
      </div>
    </div>
  );
}
