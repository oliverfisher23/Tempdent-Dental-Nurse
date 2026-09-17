import { useState, useRef, useEffect } from 'react';
import { PLACES, PEOPLE, INTERIORS } from '@/content/kitchen';
import { ORDER_LINES, FISH_CHECKS, SHORT_LINE_ID, LineStatus } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { useNotepad } from '../../kitchen/notepad';
import { Clipboard, Sheet } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { kitchenAudio } from '@/lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Check, Radio, ClipboardList, Scale, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseNumber } from '@/lib/simulation';
import { SCENE_LABELS } from '@/content/scenes/delivery';

export function GoodsInScene({
  state,
  onLineInput,
  onLineStatus,
  onCountSettled,
  onProbeSettled,
  onFishCheck,
  onRadioMarcus,
  onSign,
  onNoteAmended,
  onFirstArrival
}: any) {
  const { jot, advanceClock } = useProgress();
  const notepad = useNotepad();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const firstArrivalRef = useRef(false);
  useEffect(() => {
    if (!firstArrivalRef.current) {
      firstArrivalRef.current = true;
      onFirstArrival();
    }
  }, [onFirstArrival]);

  const [openCrateId, setOpenCrateId] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  
  const [counting, setCounting] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (countTimer.current) clearTimeout(countTimer.current); if (probeTimer.current) clearInterval(probeTimer.current); }, []);

  useEffect(() => {
    return () => { if (probeTimer.current) clearInterval(probeTimer.current); };
  }, []);

  const handleCloseCrate = () => {
    kitchenAudio.play('doorClose');
    setOpenCrateId(null);
    setCounting(false);
    setProbing(false);
    if (probeTimer.current) clearInterval(probeTimer.current);
  };

  const handleCount = (line: typeof ORDER_LINES[0]) => {
    kitchenAudio.play(line.unit === 'kg' ? 'scale' : 'tap');
    setCounting(true);
    advanceClock(1);
    if (countTimer.current) clearTimeout(countTimer.current);
    countTimer.current = setTimeout(() => {
      setCounting(false);
      onCountSettled(line.id);
    }, 1500);
  };

  const handleProbe = (line: typeof ORDER_LINES[0]) => {
    if (line.actualC === undefined) return;
    kitchenAudio.play('tap');
    setProbing(true);
    setProbeValue(null);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      const wiggle = line.actualC! + (Math.random() * 4 - 2) * Math.exp(-ticks/5);
      setProbeValue(wiggle);
      
      if (ticks > 15) {
        clearInterval(interval);
        probeTimer.current = null;
        setProbeValue(line.actualC!);
        kitchenAudio.play('probe');
        onProbeSettled(line.id);
        advanceClock(2);
        setProbing(false);
      }
    }, 100);
    probeTimer.current = interval;
  };

  const panLeft = () => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const panRight = () => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  const driver = PEOPLE.find(p => p.id === 'driver')!;
  const shortLineState = state.lines[SHORT_LINE_ID];
  const discoveredShort = parseNumber(shortLineState?.arrived ?? "") === 8;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={PLACES['goods-in'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {/* Pannable Strip */}
      <div ref={scrollRef} className="absolute inset-0 overflow-x-auto overflow-y-hidden hide-scrollbar flex items-end pt-24 pb-20 px-16 sm:px-32">
         <div className="flex items-end gap-12 sm:gap-24 min-w-max h-full">
           
           {/* Driver & Delivery Note */}
           <div className="relative flex flex-col items-center justify-end h-full w-48 sm:w-64 pb-8">
              <img src={driver.portrait!} alt="Driver" className="w-full drop-shadow-2xl select-none pointer-events-none" />
              <button 
                onClick={() => { kitchenAudio.play('page'); setNoteOpen(true); }} 
                className="absolute bottom-[20%] -right-4 bg-[#fffdf8] text-black font-bold uppercase tracking-widest px-4 py-3 text-xs shadow-2xl rotate-6 hover:rotate-0 hover:scale-105 transition-all border border-zinc-200 outline-none focus-visible:ring-4 focus-visible:ring-primary"
              >
                 {SCENE_LABELS.deliveryNote}
              </button>
           </div>

           {/* Receiving Bench / Clipboard */}
           <div className="flex flex-col justify-end h-full pb-8">
              <button 
                onClick={() => { kitchenAudio.play('page'); setBoardOpen(true); }} 
                className="w-40 sm:w-48 h-56 sm:h-64 bg-zinc-200 border-4 border-zinc-300 rounded shadow-2xl flex flex-col items-center justify-center hover:-translate-y-2 transition-transform group outline-none focus-visible:ring-4 focus-visible:ring-primary"
              >
                 <ClipboardList className="w-12 h-12 text-zinc-400 group-hover:text-primary transition-colors" />
                 <span className="mt-4 font-bold text-zinc-500 uppercase tracking-widest text-xs">{SCENE_LABELS.orderSheet}</span>
              </button>
           </div>

           {/* Trolleys */}
           {[1, 2, 3].map(t => (
             <div key={t} className="flex flex-col items-center gap-6 h-full justify-end pb-8">
               <div className="bg-black/60 text-white/90 px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase border border-white/10 shadow-xl">
                 Trolley {t}
               </div>
               <div className="flex flex-col gap-3 justify-end h-[60vh] max-h-[500px]">
                 {ORDER_LINES.filter(l => l.trolley === t).map(line => {
                    const row = state.lines[line.id] || { counted: false, probed: false };
                    return (
                       <button 
                         key={line.id} 
                         onClick={() => { kitchenAudio.play('door'); setOpenCrateId(line.id); }} 
                         className="w-48 sm:w-56 bg-zinc-800 border-2 border-zinc-600 rounded-sm shadow-xl hover:brightness-125 transition-all p-3 text-left relative group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                       >
                         <div className="font-bold text-white text-sm truncate pr-6">{line.item}</div>
                         <div className="text-zinc-400 text-[10px] uppercase tracking-wider mt-1">{line.ordered} {line.unit} ord.</div>
                         
                         {/* Status indicators */}
                         <div className="absolute top-2 right-2 flex gap-1">
                           {row.counted && <Check className="w-3.5 h-3.5 text-brand-green" />}
                           {line.chilled && row.probed && <Thermometer className="w-3.5 h-3.5 text-emerald-400" />}
                         </div>
                       </button>
                    );
                 })}
               </div>
             </div>
           ))}
         </div>
      </div>

      {/* Panning Controls */}
      <div className="absolute bottom-6 left-6 flex gap-4 z-10">
        <button onClick={panLeft} className="bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={panRight} className="bg-black/60 text-white p-3 rounded-full hover:bg-black transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Radio button if short discovered */}
      <AnimatePresence>
        {discoveredShort && !state.radioedMarcus && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-6 right-6 sm:right-12 z-20"
          >
            <button 
              onClick={onRadioMarcus} 
              className="w-20 h-28 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-2xl flex flex-col items-center justify-center hover:-translate-y-1 transition-transform group animate-bounce outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ animationDuration: '2s' }}
            >
              <Radio className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold text-white tracking-widest text-center px-1 leading-tight">Call<br/>Marcus</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crate CloseUp */}
      <CloseUp isOpen={!!openCrateId} onClose={handleCloseCrate} title="Crate contents" className="max-w-3xl mx-auto h-[80vh]">
        {openCrateId && (() => {
          const line = ORDER_LINES.find(l => l.id === openCrateId)!;
          const isFish = line.trolley === 1;
          const row = state.lines[line.id] || { counted: false, arrived: '', probed: false };
          
          return (
             <div className="relative w-full h-full bg-black rounded-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="relative flex-1 bg-black">
                   <img 
                     src={isFish ? INTERIORS.fishBox : PLACES['goods-in'].backdrop} 
                     className={cn("w-full h-full object-cover", !isFish && "opacity-40 blur-xl scale-110")} 
                     alt=""
                   />
                   {isFish && (
                     <div className="absolute inset-0 flex flex-wrap gap-4 items-center justify-center p-4 sm:p-8 z-10">
                       {FISH_CHECKS.map(check => {
                         const checked = state.fishChecks[check.id];
                         return (
                           <button 
                             key={check.id}
                             onClick={() => { kitchenAudio.play('tap'); onFishCheck(check.id); }} 
                             className={cn(
                               "p-4 rounded-lg shadow-2xl border-2 transition-all w-36 sm:w-48 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary", 
                               checked ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-black/60 border-zinc-500 text-white hover:bg-black/80"
                             )}
                           >
                              <div className="font-bold mb-1 flex justify-between items-center text-sm sm:text-base">
                                {check.label}
                                {checked && <Check className="w-4 h-4" />}
                              </div>
                              <div className="text-[10px] sm:text-xs leading-relaxed opacity-90">
                                {checked ? check.whatYouFind : "Click to inspect"}
                              </div>
                           </button>
                         )
                       })}
                     </div>
                   )}
                </div>
                
                <div className="bg-zinc-900 border-t-4 border-zinc-700 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                  <div className="text-white text-center sm:text-left">
                    <div className="font-bold text-lg sm:text-xl">{line.item}</div>
                    <div className="text-zinc-400 text-xs sm:text-sm">Ordered: {line.ordered} {line.unit}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Count / Weigh Button */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-black border-2 border-zinc-700 text-white px-3 sm:px-4 py-2 rounded shadow-inner min-w-[90px] sm:min-w-[100px] text-center">
                        <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-amber-400">
                           {counting ? "..." : (row.counted ? `${line.arrived} ${line.unit}` : "-")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 h-8">
                        {!row.counted ? (
                          <button 
                            onClick={() => handleCount(line)}
                            disabled={counting}
                            className="bg-white text-black font-bold px-3 py-1.5 rounded shadow hover:bg-zinc-200 disabled:opacity-50 text-xs flex items-center gap-1"
                          >
                             <Scale className="w-3.5 h-3.5" /> {line.unit === 'kg' ? 'Weigh' : 'Count'}
                          </button>
                        ) : (
                          <button onClick={() => {
                             kitchenAudio.play('write');
                             jot({ taskId: 'check-the-delivery-in', label: line.item, value: `${line.arrived}`, ref: { qtyFor: line.id } });
                          }} className="text-xs text-primary font-bold hover:underline">
                             Jot quantity
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Probe Button */}
                    {line.chilled && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-black border-2 border-zinc-700 text-white px-3 sm:px-4 py-2 rounded shadow-inner min-w-[90px] sm:min-w-[100px] text-center">
                          <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-emerald-400">
                             {probeValue !== null ? probeValue.toFixed(1) : (row.probed ? line.actualC?.toFixed(1) : "-.-")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 h-8">
                          {!row.probed ? (
                            <button 
                              onClick={() => handleProbe(line)}
                              disabled={probing}
                              className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded shadow hover:bg-primary/90 disabled:opacity-50 text-xs flex items-center gap-1"
                            >
                               <Thermometer className="w-3.5 h-3.5" /> Probe
                            </button>
                          ) : (
                            <button onClick={() => {
                               kitchenAudio.play('write');
                               jot({ taskId: 'check-the-delivery-in', label: `${line.item} temp`, value: `${line.actualC?.toFixed(1)} °C`, ref: { tempFor: line.id } });
                            }} className="text-xs text-primary font-bold hover:underline">
                               Jot temp
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          );
        })()}
      </CloseUp>

      {/* Order Sheet CloseUp */}
      <CloseUp isOpen={boardOpen} onClose={() => setBoardOpen(false)} title="Order sheet" className="max-w-5xl mx-auto">
        <Clipboard>
          <div className="p-4 sm:p-6 md:p-10 font-sans">
             <div className="border-b-4 border-black pb-4 mb-6">
               <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-black">Morning Intake</h2>
               <p className="text-zinc-600 font-mono font-bold mt-1 text-sm sm:text-base">SUPPLIER: DEVON FRESH / EXMOUTH FISH</p>
             </div>
             
             {/* Desktop Table */}
             <table className="kitchen-table w-full hidden md:table text-sm">
               <thead>
                 <tr>
                   <th className="w-1/4">Item</th>
                   <th className="w-20 text-center">Ord</th>
                   <th className="w-24 text-center">Arrived</th>
                   <th className="w-24 text-center">Temp °C</th>
                   <th className="w-48 text-center">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {ORDER_LINES.map(line => {
                   const row = state.lines[line.id] || { counted: false, arrived: '', probed: false, temperature: '', status: null };
                   const qtyNote = notepad.entryFor('qtyFor', line.id);
                   const tempNote = notepad.entryFor('tempFor', line.id);
                   return (
                     <tr key={line.id} className={cn("group hover:bg-black/5 transition-colors", row.status === 'short' ? "bg-red-50" : "")}>
                        <td className="py-3 px-2 font-medium text-black">
                           {line.item} <div className="text-[10px] text-zinc-500 uppercase">Trolley {line.trolley}</div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-zinc-500">{line.ordered} {line.unit}</td>
                        <td className="py-3 px-2">
                           <div className="flex flex-col items-center gap-1">
                             <Input 
                               value={row.arrived}
                               onChange={e => onLineInput(line.id, 'arrived', e.target.value)}
                               className="kitchen-input text-center text-lg w-full"
                               style={{ fontFamily: 'cursive' }}
                               placeholder="-"
                             />
                             {qtyNote && row.arrived === '' && (
                               <button onClick={() => { kitchenAudio.play('write'); onLineInput(line.id, 'arrived', qtyNote.value); }} className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded transition-colors hover:bg-primary/20">From notepad</button>
                             )}
                           </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                           {line.chilled ? (
                             <div className="flex flex-col items-center gap-1">
                               <Input 
                                 value={row.temperature}
                                 onChange={e => onLineInput(line.id, 'temperature', e.target.value)}
                                 className={cn("kitchen-input text-center text-lg w-full", !row.probed && "opacity-30")}
                                 style={{ fontFamily: 'cursive' }}
                                 disabled={!row.probed}
                                 placeholder="-"
                               />
                               {tempNote && row.temperature === '' && (
                                 <button onClick={() => { kitchenAudio.play('write'); onLineInput(line.id, 'temperature', tempNote.value.replace(' °C', '')); }} className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded transition-colors hover:bg-primary/20">From notepad</button>
                               )}
                             </div>
                           ) : <span className="text-zinc-400">-</span>}
                        </td>
                        <td className="py-3 px-2">
                           <div className="flex bg-muted rounded-sm border border-border overflow-hidden">
                             {(["arrived", "short", "refused"] as LineStatus[]).map((status) => (
                               <button
                                 key={status}
                                 onClick={() => { kitchenAudio.play('tap'); onLineStatus(line.id, status); }}
                                 className={cn(
                                   "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                                   row.status === status 
                                     ? status === "arrived" ? "bg-brand-green/20 text-brand-green" 
                                       : status === "short" ? "bg-amber-200 text-amber-900"
                                       : "bg-destructive text-destructive-foreground"
                                     : "hover:bg-zinc-200 text-zinc-500"
                                 )}
                               >
                                  {status}
                               </button>
                             ))}
                           </div>
                        </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
             
             {/* Mobile layout */}
             <div className="flex flex-col gap-4 md:hidden text-sm mt-4">
                {ORDER_LINES.map(line => {
                  const row = state.lines[line.id] || { counted: false, arrived: '', probed: false, temperature: '', status: null };
                  const qtyNote = notepad.entryFor('qtyFor', line.id);
                  const tempNote = notepad.entryFor('tempFor', line.id);
                  return (
                    <div key={line.id} className={cn("border border-zinc-200 rounded p-4 shadow-sm flex flex-col gap-3", row.status === 'short' ? "bg-red-50" : "bg-white")}>
                       <div>
                         <div className="font-bold text-black text-base">{line.item}</div>
                         <div className="text-xs text-zinc-500 uppercase">Trolley {line.trolley} • Ord: {line.ordered} {line.unit}</div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Arrived</label>
                            <div className="flex flex-col gap-1 items-start">
                              <Input 
                                value={row.arrived}
                                onChange={e => onLineInput(line.id, 'arrived', e.target.value)}
                                className="kitchen-input text-lg w-full text-center"
                                style={{ fontFamily: 'cursive' }}
                                placeholder="-"
                              />
                              {qtyNote && row.arrived === '' && (
                                <button onClick={() => { kitchenAudio.play('write'); onLineInput(line.id, 'arrived', qtyNote.value); }} className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded w-full transition-colors hover:bg-primary/20">From notepad</button>
                              )}
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Temp °C</label>
                            {line.chilled ? (
                              <div className="flex flex-col gap-1 items-start">
                                <Input 
                                  value={row.temperature}
                                  onChange={e => onLineInput(line.id, 'temperature', e.target.value)}
                                  className={cn("kitchen-input text-lg w-full text-center", !row.probed && "opacity-30")}
                                  style={{ fontFamily: 'cursive' }}
                                  disabled={!row.probed}
                                  placeholder="-"
                                />
                                {tempNote && row.temperature === '' && (
                                  <button onClick={() => { kitchenAudio.play('write'); onLineInput(line.id, 'temperature', tempNote.value.replace(' °C', '')); }} className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded w-full transition-colors hover:bg-primary/20">From notepad</button>
                                )}
                              </div>
                            ) : (
                              <div className="h-10 flex items-center text-zinc-400 px-2">-</div>
                            )}
                         </div>
                       </div>

                       <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1 mt-1">Status</label>
                          <div className="flex bg-muted rounded-sm border border-border overflow-hidden">
                             {(["arrived", "short", "refused"] as LineStatus[]).map((status) => (
                               <button
                                 key={status}
                                 onClick={() => { kitchenAudio.play('tap'); onLineStatus(line.id, status); }}
                                 className={cn(
                                   "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                                   row.status === status 
                                     ? status === "arrived" ? "bg-brand-green/20 text-brand-green" 
                                       : status === "short" ? "bg-amber-200 text-amber-900"
                                       : "bg-destructive text-destructive-foreground"
                                     : "hover:bg-zinc-200 text-zinc-500"
                                 )}
                               >
                                  {status}
                               </button>
                             ))}
                           </div>
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
        </Clipboard>
      </CloseUp>

      {/* Delivery Note CloseUp */}
      <CloseUp isOpen={noteOpen} onClose={() => setNoteOpen(false)} title="Delivery note" className="max-w-xl mx-auto">
        <Sheet>
          <div className="p-6 sm:p-8 font-mono text-sm space-y-6 text-black bg-[#fffdf8]">
            <div className="flex flex-col sm:flex-row sm:justify-between border-b-2 border-black pb-4 gap-2">
              <div>
                <div className="font-bold text-lg sm:text-xl uppercase">Exmouth Fish Suppliers</div>
                <div className="text-zinc-600">Delivery Note #49281</div>
              </div>
              <div className="sm:text-right text-zinc-600">
                <div>Account: MAR-EXETER</div>
                <div>Date: Today</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between font-bold border-b border-black pb-2 uppercase tracking-widest text-xs">
                <span>Description</span>
                <span>Qty</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-200">
                <span>Sea bass, whole</span>
                <span>10 fish</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-200">
                <span>Smoked haddock</span>
                <span>3 kg</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-400 bg-red-50/50 items-center px-2">
                <span className="font-bold">Salmon fillet</span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className={cn("transition-all", parseNumber(state.noteAmendedTo) === 8 && "line-through text-zinc-400")}>12 kg</span>
                  <Input
                    value={state.noteAmendedTo}
                    onChange={(e) => onNoteAmended(e.target.value)}
                    disabled={!state.radioedMarcus}
                    className="kitchen-input w-16 h-8 text-center text-red-600 font-bold border-red-200 bg-white"
                    placeholder="-"
                    style={{ fontFamily: 'cursive' }}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-8 sm:pt-12 mt-8 sm:mt-12 flex flex-col items-end">
              <div className="text-[10px] sm:text-xs text-zinc-500 mb-2 uppercase tracking-widest font-sans font-bold">Received in good condition</div>
              {state.signed ? (
                <div className="text-2xl sm:text-3xl text-blue-800 px-4 sm:px-8 py-2 border-b border-black min-w-[160px] sm:min-w-[200px] text-center" style={{ fontFamily: 'cursive' }}>
                  {state.signature}
                </div>
              ) : (
                <Button 
                  onClick={() => { kitchenAudio.play('write'); onSign(); }} 
                  disabled={!state.radioedMarcus} 
                  variant="outline" 
                  className="border-2 border-black text-black hover:bg-black hover:text-white rounded-none w-40 sm:w-48 h-10 sm:h-12 uppercase tracking-widest font-bold text-xs sm:text-sm"
                >
                   Sign Note
                </Button>
              )}
            </div>
          </div>
        </Sheet>
      </CloseUp>
    </div>
  );
}