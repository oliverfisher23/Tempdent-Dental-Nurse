import { useState, useRef, useEffect } from 'react';
import { INTERIORS, PLACES } from '@/content/kitchen';
import { FRIDGE_UNITS } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { Whiteboard } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { kitchenAudio } from '@/lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, PenTool, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useKitchenAction } from '../../kitchen/kitchen-context';

function GuideAction({ action, open }: { action: string; open: () => void }) {
  useKitchenAction(action, open);
  return null;
}

export function CorridorScene({ 
  stateRows, 
  onRowChange,
  onProbeSettled,
  logRead 
}: { 
  stateRows: Record<string, any>, 
  onRowChange: (unitId: string, field: "reading" | "initials" | "note", value: string) => void,
  onProbeSettled: (unitId: string) => void,
  logRead: string[]
}) {
  const { jot, advanceClock } = useProgress();
  const notepad = useNotepad();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open unit state
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  
  // Probe state
  const [probing, setProbing] = useState(false);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Board state
  const [boardOpen, setBoardOpen] = useState(false);

  useEffect(() => {
    return () => { if (probeTimer.current) clearInterval(probeTimer.current); };
  }, []);

  const handleOpenUnit = (id: string) => {
    kitchenAudio.play('door');
    setOpenUnitId(id);
    setProbing(false);
    setProbeValue(null);
    if (probeTimer.current) clearInterval(probeTimer.current);
  };

  const handleCloseUnit = () => {
    kitchenAudio.play('doorClose');
    setOpenUnitId(null);
    setProbing(false);
    if (probeTimer.current) clearInterval(probeTimer.current);
  };

  const openBoard = () => {
    if (probeTimer.current) clearInterval(probeTimer.current);
    probeTimer.current = null;
    setProbing(false);
    setOpenUnitId(null);
    setBoardOpen(true);
  };

  const handleProbe = (unit: typeof FRIDGE_UNITS[0]) => {
    kitchenAudio.play('tap');
    setProbing(true);
    setProbeValue(null);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      const wiggle = unit.actualC + (Math.random() * 4 - 2) * Math.exp(-ticks/5);
      setProbeValue(wiggle);
      
      if (ticks > 15) {
        clearInterval(interval);
        probeTimer.current = null;
        setProbeValue(unit.actualC);
        kitchenAudio.play('probe');
        onProbeSettled(unit.id);
      }
    }, 100);
    probeTimer.current = interval;
  };

  const handleJot = (unit: typeof FRIDGE_UNITS[0]) => {
    if (probeValue === null) return;
    kitchenAudio.play('write');
    jot({
      taskId: 'take-the-handover',
      label: unit.name,
      value: `${probeValue.toFixed(1)} °C`,
      ref: { unitId: unit.id }
    });
    advanceClock(2);
    // Let notepad bounce via the store event or visual cue if needed
  };

  const panLeft = () => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const panRight = () => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  const backdrop = PLACES['corridor'].backdrop;

  const GROUPS = [
    { where: 'Pastry corner', ids: ['dairy'] },
    { where: 'Fish section', ids: ['fish'] },
    { where: 'Larder section', ids: ['larder-2', 'larder-1'] },
    { where: 'Back corridor', ids: ['freezer-2', 'freezer-1', 'walk-in'] },
  ];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      {FRIDGE_UNITS.map((unit) => (
        <GuideAction
          key={unit.id}
          action={`handover:fridge:${unit.id}`}
          open={() => {
            setBoardOpen(false);
            handleOpenUnit(unit.id);
          }}
        />
      ))}
      <GuideAction action="handover:board" open={openBoard} />
      {/* Background Atmosphere */}
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {/* Pannable Strip */}
      <div ref={scrollRef} className="absolute inset-0 overflow-x-auto overflow-y-hidden hide-scrollbar flex items-end pt-24 pb-16 px-16 sm:px-32">
        <div className="flex items-end gap-16 min-w-max h-full">
          {GROUPS.map(group => (
            <div key={group.where} className="flex flex-col items-center gap-6 h-full justify-end">
              <div className="bg-black/60 text-white/90 px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase border border-white/10 shadow-xl">
                {group.where}
              </div>
              <div className="flex items-end gap-4 h-[70vh] max-h-[600px]">
                {group.ids.map(id => {
                  const unit = FRIDGE_UNITS.find(u => u.id === id)!;
                  const isFlagged = unit.id === 'larder-2' && logRead.includes('04:10');
                  const isProbed = stateRows[unit.id]?.probed;

                  return (
                    <button
                      key={id}
                      onClick={() => handleOpenUnit(unit.id)}
                      className="relative h-full aspect-[4/9] bg-gradient-to-br from-zinc-200 to-zinc-400 rounded-sm border-2 border-zinc-500 shadow-2xl flex flex-col items-center p-4 hover:brightness-110 transition-all focus-visible:ring-4 focus-visible:ring-primary outline-none group"
                      aria-label={`Open ${unit.name}`}
                    >
                      {/* Name Plate */}
                      <div className="bg-zinc-800 text-zinc-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-inner w-full text-center mt-4">
                        {unit.name}
                      </div>
                      
                      {/* Limit Label */}
                      <div className="bg-primary/20 text-primary-foreground border border-primary/40 px-2 py-0.5 text-[10px] font-bold rounded shadow-sm mt-2">
                        {unit.limitLabel}
                      </div>

                      {/* Display */}
                      <div className="mt-8 bg-black border-2 border-zinc-700 rounded-sm w-20 h-10 flex items-center justify-center">
                        <span className="font-mono font-bold text-emerald-500 tracking-widest">--.-</span>
                      </div>

                      {/* Handle */}
                      <div className="absolute left-4 top-1/3 w-3 h-32 bg-gradient-to-b from-zinc-300 to-zinc-500 rounded-full shadow-lg border border-zinc-400" />

                      {/* Status overlays */}
                      {isFlagged && !isProbed && (
                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-primary rounded-full animate-ping" />
                      )}
                      {isProbed && (
                        <div className="absolute -bottom-4 bg-black/60 text-white rounded-full p-2 shadow-xl">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Temperature Board Section */}
          <div className="flex flex-col items-center gap-6 h-full justify-end ml-8">
            <button
              onClick={() => { kitchenAudio.play('page'); openBoard(); }}
              className="h-[70vh] max-h-[600px] w-64 bg-white rounded shadow-2xl border-4 border-zinc-300 flex flex-col items-center justify-center p-6 hover:bg-zinc-50 transition-colors focus-visible:ring-4 focus-visible:ring-primary outline-none group"
               aria-label="Temperature board"
            >
              <div className="w-16 h-2 bg-zinc-300 rounded-full mb-8" />
              <div className="font-bold text-2xl font-sans uppercase tracking-widest text-center text-zinc-800 mb-2">Temperature<br/>board</div>
              <div className="text-primary font-bold group-hover:scale-110 transition-transform mt-4">
                  Write the readings up
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Panning Controls */}
      <div className="absolute bottom-6 right-6 flex gap-4 z-10">
        <button 
          onClick={panLeft}
          className="bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-lg"
           aria-label="Look left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={panRight}
          className="bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-lg"
           aria-label="Look right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Fridge Interior Modal */}
      <CloseUp isOpen={!!openUnitId} onClose={handleCloseUnit} title={FRIDGE_UNITS.find(unit => unit.id === openUnitId)?.name ?? 'Fridge'} className="max-w-3xl mx-auto h-full max-h-[720px]">
        {openUnitId && (() => {
          const unit = FRIDGE_UNITS.find(u => u.id === openUnitId)!;
          let interiorImg = INTERIORS.fridge;
          if (unit.id.includes('freezer')) interiorImg = INTERIORS.freezer;
          if (unit.id === 'walk-in') interiorImg = INTERIORS.walkIn;
          const isWarm = unit.id === 'larder-2';
          const isProbed = stateRows[unit.id]?.probed;

          return (
            <div className="relative w-full h-full bg-black rounded-lg shadow-2xl overflow-hidden flex flex-col">
              {/* Image filling top area */}
              <div className="relative flex-1 bg-black">
                  <img 
                    src={interiorImg} 
                    alt={`Inside ${unit.name}`} 
                    className={cn(
                      "w-full h-full object-cover",
                      isWarm && "sepia-[0.3] hue-rotate-15 contrast-75 brightness-90"
                    )} 
                  />
                  {!isWarm && (
                    <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />
                  )}
                  {/* Subtle idle vapour if freezer */}
                  {unit.id.includes('freezer') && (
                     <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
                  )}
              </div>
              
              {/* Control Panel always visible at bottom */}
              <div className="bg-zinc-900 border-t-4 border-zinc-700 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                 <div className="text-white">
                   <div className="font-bold text-xl">{unit.name}</div>
                   <div className="text-zinc-400 text-sm">{unit.where} • {unit.limitLabel}</div>
                 </div>

                 <div className="flex items-center gap-6">
                   <div className="bg-black border-2 border-zinc-700 text-white px-6 py-3 rounded-xl shadow-inner min-w-[140px] text-center">
                      <span className="font-mono text-3xl font-bold tracking-widest text-emerald-400">
                        {probeValue !== null ? probeValue.toFixed(1) : "--.-"}
                      </span>
                   </div>

                   <div className="flex flex-col gap-2 min-w-[160px]">
                     <button
                       onClick={() => handleProbe(unit)}
                       disabled={probing || (isProbed && probeValue !== null)}
                       className="bg-primary text-primary-foreground font-bold px-4 py-3 rounded hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow"
                     >
                       <Thermometer className="w-5 h-5" /> 
                       Take the temperature
                     </button>
                     
                     <AnimatePresence>
                        {probeValue === unit.actualC && (
                          <motion.button
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            onClick={() => {
                              handleJot(unit);
                              handleCloseUnit();
                            }}
                            className="bg-white text-black font-bold px-4 py-3 rounded shadow hover:bg-zinc-200 flex items-center justify-center gap-2"
                          >
                            <PenTool className="w-4 h-4" /> Write it in your notebook
                          </motion.button>
                        )}
                     </AnimatePresence>
                   </div>
                 </div>
              </div>
            </div>
          );
        })()}
      </CloseUp>

      {/* Temperature Board Modal */}
      <CloseUp isOpen={boardOpen} onClose={() => setBoardOpen(false)} title="Temperature board" className="max-w-5xl mx-auto">
        <Whiteboard>
          <div className="p-6 md:p-10">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-1 font-sans text-zinc-800">Daily Fridge Checks</h2>
            <p className="text-center font-mono text-muted-foreground mb-8">06:45 ROUND</p>
            
            <div className="overflow-hidden">
              <table className="kitchen-table w-full hidden md:table">
                <thead>
                  <tr>
                    <th className="w-1/4">Unit / Limit</th>
                    <th className="w-24 text-center">Reading °C</th>
                    <th className="w-24 text-center">Time</th>
                    <th className="w-24 text-center">Initials</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {FRIDGE_UNITS.map(unit => {
                    const row = stateRows[unit.id] || { probed: false, reading: '', time: '', initials: '', note: '' };
                    const jottedNote = notepad.entryFor('unitId', unit.id);
                    
                    return (
                      <tr key={unit.id} className="group hover:bg-black/5 transition-colors">
                        <td className="py-4 px-2">
                          <div className="font-bold text-zinc-900">{unit.name}</div>
                          <div className="text-xs text-zinc-500">{unit.where} • {unit.limitLabel}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col gap-1 items-center">
                            <Input
                              value={row.reading}
                              onChange={(e) => onRowChange(unit.id, 'reading', e.target.value)}
                              placeholder="-"
                              className={cn("kitchen-input text-lg", !row.probed && "opacity-30")}
                              disabled={!row.probed}
                              style={{ fontFamily: 'cursive' }}
                            />
                            {jottedNote && row.reading === '' && (
                              <button
                                onClick={() => {
                                  kitchenAudio.play('write');
                                  onRowChange(unit.id, 'reading', jottedNote.value.replace(' °C', ''));
                                }}
                                className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded shadow-sm hover:bg-primary/20 transition-colors"
                              >
                                Use my note
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Input
                            value={row.time}
                            readOnly
                            placeholder="-"
                            className="kitchen-input text-sm text-zinc-500"
                            style={{ fontFamily: 'cursive' }}
                          />
                        </td>
                        <td className="py-4 px-2">
                          <Input
                            value={row.initials}
                            onChange={(e) => onRowChange(unit.id, 'initials', e.target.value)}
                            maxLength={3}
                            placeholder="-"
                            className="kitchen-input uppercase"
                            style={{ fontFamily: 'cursive' }}
                          />
                        </td>
                        <td className="py-4 pl-4 pr-2">
                          {(unit.actualC > unit.limitC || row.note || unit.id === 'larder-2') ? (
                            <Input
                              value={row.note}
                              onChange={(e) => onRowChange(unit.id, 'note', e.target.value)}
                              placeholder="Anything to note?"
                              className="kitchen-input text-sm text-left w-full"
                              style={{ fontFamily: 'cursive' }}
                            />
                          ) : (
                            <span className="text-zinc-300 block py-1 text-center">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="flex flex-col gap-4 md:hidden">
                {FRIDGE_UNITS.map(unit => {
                  const row = stateRows[unit.id] || { probed: false, reading: '', time: '', initials: '', note: '' };
                  const jottedNote = notepad.entryFor('unitId', unit.id);

                  return (
                    <div key={unit.id} className="bg-white border border-zinc-200 rounded p-4 shadow-sm flex flex-col gap-3">
                      <div>
                        <div className="font-bold text-zinc-900 text-lg">{unit.name}</div>
                        <div className="text-xs text-zinc-500">{unit.where} • {unit.limitLabel}</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Reading °C</label>
                          <div className="flex flex-col gap-1 items-start">
                            <Input
                              value={row.reading}
                              onChange={(e) => onRowChange(unit.id, 'reading', e.target.value)}
                              placeholder="-"
                              className={cn("kitchen-input text-lg text-left w-full", !row.probed && "opacity-30")}
                              disabled={!row.probed}
                              style={{ fontFamily: 'cursive' }}
                            />
                            {jottedNote && row.reading === '' && (
                              <button
                                onClick={() => {
                                  kitchenAudio.play('write');
                                  onRowChange(unit.id, 'reading', jottedNote.value.replace(' °C', ''));
                                }}
                                className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded shadow-sm"
                              >
                                Use my note
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Time</label>
                          <Input
                            value={row.time}
                            readOnly
                            placeholder="-"
                            className="kitchen-input text-sm text-zinc-500 text-left w-full"
                            style={{ fontFamily: 'cursive' }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Initials</label>
                          <Input
                            value={row.initials}
                            onChange={(e) => onRowChange(unit.id, 'initials', e.target.value)}
                            maxLength={3}
                            placeholder="-"
                            className="kitchen-input uppercase text-left w-full"
                            style={{ fontFamily: 'cursive' }}
                          />
                        </div>
                      </div>

                      {(unit.actualC > unit.limitC || row.note || unit.id === 'larder-2') && (
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Note</label>
                          <Input
                            value={row.note}
                            onChange={(e) => onRowChange(unit.id, 'note', e.target.value)}
                            placeholder="Anything to note?"
                            className="kitchen-input text-sm text-left w-full"
                            style={{ fontFamily: 'cursive' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Whiteboard>
      </CloseUp>
    </div>
  );
}
