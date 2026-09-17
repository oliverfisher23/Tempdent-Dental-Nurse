import { ADDED_GUESTS, FUNCTION_SHEET, DISHES, MAIN_OPTIONS, DESSERT_OPTIONS } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { AlertCircle, PenTool } from 'lucide-react';
import { CloseUp } from '../../kitchen/close-up';
import { Clipboard } from '../../kitchen/paper';

export function FunctionSheetCloseUp({
  isOpen,
  onClose,
  stateGuests,
  onAssignGuest,
  chartChecked
}: {
  isOpen: boolean;
  onClose: () => void;
  stateGuests: Record<string, any>;
  onAssignGuest: (guestId: string, field: 'main' | 'dessert', val: string) => void;
  chartChecked: boolean;
}) {
  const { jot } = useProgress();
  const notepad = useNotepad();

  const handleJot = (guest: typeof ADDED_GUESTS[0]) => {
    kitchenAudio.play('write');
    jot({
      taskId: 'check-the-dietary-list',
      label: `${guest.name} (Table ${guest.table})`,
      value: guest.requirement,
      ref: { guestId: guest.id }
    });
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title="Function sheet" className="max-w-2xl">
      <Clipboard>
        <div className="p-6 md:p-10 space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="font-bold text-xl border-b-2 border-zinc-300 pb-2 uppercase tracking-widest text-center">
            {FUNCTION_SHEET.event}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm font-medium">
            <div>
              <span className="text-zinc-500 uppercase text-xs tracking-wider block">Room</span>
              {FUNCTION_SHEET.room}
            </div>
            <div>
              <span className="text-zinc-500 uppercase text-xs tracking-wider block">Covers</span>
              {FUNCTION_SHEET.covers}
            </div>
          </div>

          <div>
            <span className="text-zinc-500 uppercase text-xs font-bold tracking-wider block border-b border-zinc-200 pb-1 mb-2">Timings</span>
            <div className="space-y-1 text-sm font-medium">
              {FUNCTION_SHEET.timings.map(t => (
                <div key={t.time} className="flex gap-4">
                  <span className="w-12 text-zinc-500">{t.time}</span>
                  <span>{t.what}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-zinc-300">
            <span className="text-zinc-500 uppercase text-xs font-bold tracking-wider block mb-4">Added Guests & Dietaries</span>
            <div className="space-y-6">
              {ADDED_GUESTS.map(g => {
                const assign = stateGuests[g.id] || { main: null, dessert: null };
                const jotted = notepad.entryFor('guestId', g.id);

                return (
                  <div key={g.id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm shadow-sm relative group">
                    <div className="font-bold text-lg mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span>{g.name} <span className="font-normal text-zinc-500">(Table {g.table})</span></span>
                      {!jotted && (
                        <button 
                          onClick={() => handleJot(g)} 
                          className="text-xs bg-white border border-zinc-300 px-2 py-1 rounded shadow-sm hover:bg-zinc-100 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus:opacity-100"
                        >
                          <PenTool className="w-3 h-3" /> Jot needs
                        </button>
                      )}
                      {jotted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                          Jotted
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-700 font-medium mb-4 flex items-center gap-2">
                      {g.mustAvoid.length > 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {g.requirement}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Main</div>
                        <div className="space-y-2">
                          {MAIN_OPTIONS.map(opt => {
                            const dish = DISHES.find(d => d.id === opt)!;
                            return (
                              <button
                                key={opt}
                                onClick={() => { kitchenAudio.play('write'); onAssignGuest(g.id, 'main', opt); }}
                                disabled={!chartChecked}
                                className={cn(
                                  "w-full text-left p-2 text-xs border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                  assign.main === opt ? "bg-zinc-800 text-white border-zinc-800 shadow-inner" : "bg-white hover:border-zinc-400"
                                )}
                              >
                                {dish.name.split(',')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">Dessert</div>
                        <div className="space-y-2">
                          {DESSERT_OPTIONS.map(opt => {
                            const dish = DISHES.find(d => d.id === opt)!;
                            return (
                              <button
                                key={opt}
                                onClick={() => { kitchenAudio.play('write'); onAssignGuest(g.id, 'dessert', opt); }}
                                disabled={!chartChecked}
                                className={cn(
                                  "w-full text-left p-2 text-xs border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                  assign.dessert === opt ? "bg-zinc-800 text-white border-zinc-800 shadow-inner" : "bg-white hover:border-zinc-400"
                                )}
                              >
                                {dish.name.split(',')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Clipboard>
    </CloseUp>
  );
}
