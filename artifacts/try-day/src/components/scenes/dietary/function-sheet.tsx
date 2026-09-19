import { ADDED_GUESTS, DISHES, FUNCTION_SHEET } from '@/content/activities';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { kitchenAudio } from '@/lib/audio';
import { AlertCircle, Lock, PenTool } from 'lucide-react';
import { CloseUp } from '../../kitchen/close-up';
import { Clipboard } from '../../kitchen/paper';

/**
 * Yvie's function sheet, read at the pass before anything else: the event, the menu and
 * the requirements already catered for. The three additions are listed by table; their
 * requirement lines open only after Terence has been through the chart (D04).
 */
export function FunctionSheetCloseUp({
  isOpen,
  onClose,
  guestDetailsOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  guestDetailsOpen: boolean;
}) {
  const { jot } = useProgress();
  const notepad = useNotepad();
  const copy = DIETARY_UI.sheet;

  const handleJot = (guest: (typeof ADDED_GUESTS)[number]) => {
    kitchenAudio.play('write');
    jot({
      taskId: 'check-the-dietary-list',
      label: `${guest.name} (Table ${guest.table})`,
      value: guest.requirement,
      ref: { guestId: guest.id },
    });
  };

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={copy.title} className="max-w-2xl">
      <Clipboard>
        <div className="p-6 md:p-10 space-y-6 max-h-[85vh] overflow-y-auto" data-testid="function-sheet">
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
              {FUNCTION_SHEET.timings.map((t) => (
                <div key={t.time} className="flex gap-4">
                  <span className="w-12 text-zinc-500">{t.time}</span>
                  <span>{t.what}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2">{FUNCTION_SHEET.tables}</p>
          </div>

          <section aria-labelledby="sheet-menu">
            <h3 id="sheet-menu" className="text-zinc-500 uppercase text-xs font-bold tracking-wider block border-b border-zinc-200 pb-1 mb-2">
              {copy.menuTitle}
            </h3>
            <ul className="space-y-1 text-sm">
              {DISHES.map((dish) => (
                <li key={dish.id} className="flex gap-3">
                  <span className="w-32 shrink-0 text-zinc-500">{dish.course}</span>
                  <span className="font-medium">{dish.name}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-700 mt-3 font-medium">{copy.standardPlate}</p>
            <p className="text-xs text-zinc-600">{copy.alternatives}</p>
          </section>

          <section aria-labelledby="sheet-existing">
            <h3 id="sheet-existing" className="text-zinc-500 uppercase text-xs font-bold tracking-wider block border-b border-zinc-200 pb-1 mb-2">
              {copy.existingTitle}
            </h3>
            <ul className="space-y-2 text-sm">
              {FUNCTION_SHEET.existingRequirements.map((row) => (
                <li key={row.guest} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
                  <span className="font-medium">{row.guest}</span>
                  <span className="text-zinc-600 text-right">{row.requirement}</span>
                  <span className="col-span-2 text-xs text-zinc-600">{row.catered}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="sheet-additions" className="pt-4 border-t-2 border-zinc-300">
            <h3 id="sheet-additions" className="text-zinc-500 uppercase text-xs font-bold tracking-wider block mb-1">
              {copy.additionsTitle}
            </h3>
            <p className="text-xs text-zinc-600 mb-3 flex items-center gap-1.5">
              {!guestDetailsOpen && <Lock className="w-3 h-3" aria-hidden="true" />}
              {guestDetailsOpen ? copy.additionsOpen : copy.additionsLocked}
            </p>
            <ul className="space-y-3">
              {ADDED_GUESTS.map((guest) => {
                const jotted = notepad.entryFor('guestId', guest.id);
                return (
                  <li key={guest.id} role="group" aria-label={`${guest.name}, table ${guest.table}`} className="bg-zinc-50 border border-zinc-200 p-3 rounded-sm shadow-sm">
                    <div className="font-bold flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {guest.name} <span className="font-normal text-zinc-500">(Table {guest.table})</span>
                      </span>
                      {guestDetailsOpen && !jotted && (
                        <button
                          type="button"
                          onClick={() => handleJot(guest)}
                          aria-label={`${copy.noteGuest}: ${guest.name}`}
                          className="text-xs bg-white border border-zinc-300 px-2 py-1 rounded shadow-sm hover:bg-zinc-100 flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" aria-hidden="true" /> {copy.noteGuest}
                        </button>
                      )}
                      {guestDetailsOpen && jotted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                          {copy.noted}
                        </span>
                      )}
                    </div>
                    {guestDetailsOpen && (
                      <div className="text-sm text-zinc-700 font-medium mt-1 flex items-center gap-2">
                        {guest.mustAvoid.length > 0 && <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />}
                        {guest.requirement}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </Clipboard>
    </CloseUp>
  );
}
