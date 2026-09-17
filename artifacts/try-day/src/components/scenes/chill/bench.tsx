import { useState, useRef, useEffect } from 'react';
import { PLACES, PEOPLE } from '@/content/kitchen';
import { PREP_SHEET, CHILLER_SHELVES, PROBE_PLACEMENTS, YOUR_TRAY_READINGS, MARCUS_TRAY_READINGS, NINETY_MINUTE_CHOICES, type ProbePlacementId, type NinetyMinuteChoiceId, type ChillInterval } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { traysHaveSpace, type ChillState } from '@/lib/simulation';
import { useNotepad } from '../../kitchen/notepad';
import { Clipboard } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { Hotspot } from '../../kitchen/hotspot';
import { kitchenAudio } from '@/lib/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, ChevronRight, PlusCircle, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function BenchScene({
  state, remaining, onScoop, onAskForTray, onLoadTray, onRemoveTray, onProbePlacement, onWait, onNinetyChoice, onMeasure, onReading, onSign
}: {
  state: ChillState;
  remaining: number;
  onScoop: (i: number) => void;
  onAskForTray: () => void;
  onLoadTray: (trayIndex: number, shelfIndex: number) => void;
  onRemoveTray: (trayIndex: number) => void;
  onProbePlacement: (id: ProbePlacementId) => void;
  onWait: () => void;
  onNinetyChoice: (id: NinetyMinuteChoiceId) => void;
  onMeasure: () => void;
  onReading: (interval: ChillInterval, value: string) => void;
  onSign: () => void;
}) {
  const { progress, jot } = useProgress();
  const notepad = useNotepad();
  const [openModal, setOpenModal] = useState<'portioning' | 'chiller' | 'record' | null>(null);

  const [selectedTray, setSelectedTray] = useState<number | null>(null);

  const portionComplete = remaining === 0;
  // The cycle only starts once every tray is on a shelf with space between them and the probe is in.
  const chillerLoaded = state.probePlacement === 'centre' && traysHaveSpace(state.shelfByTray);
  const needsToRecord = [0, 30, 60, 90, 120].some(i => 
     state.minutesElapsed >= i && !state.readings[i as ChillInterval]?.value
  );
  const needToWait = !needsToRecord && state.minutesElapsed < 120;

  let benchState: 'todo' | 'active' | 'done' | 'locked' = 'locked';
  let chillerState: 'todo' | 'active' | 'done' | 'locked' = 'locked';
  let recordState: 'todo' | 'active' | 'done' | 'locked' = 'locked';

  if (!portionComplete) {
    benchState = 'active';
    chillerState = 'locked';
    recordState = 'locked';
  } else if (!chillerLoaded) {
    benchState = 'done';
    chillerState = 'active';
    recordState = 'locked';
  } else {
    benchState = 'done';
    if (needsToRecord) {
       recordState = 'active';
       chillerState = 'todo';
    } else if (needToWait) {
       chillerState = 'active';
       recordState = 'todo';
    } else if (state.minutesElapsed === 120 && !state.studentSigned) {
       recordState = 'active';
       chillerState = 'done';
    } else {
       recordState = 'done';
       chillerState = 'done';
    }
  }

  // Probe logic
  const [probing, setProbing] = useState(false);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const [probedValue, setProbedValue] = useState<number | null>(null);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setProbedValue(null);
    setProbeValue(null);
    return () => { if (probeTimer.current) clearInterval(probeTimer.current); };
  }, [state.minutesElapsed]);

  const handleProbeStart = () => {
    kitchenAudio.play('tap');
    setProbing(true);
    setProbeValue(null);
    let ticks = 0;
    const target = YOUR_TRAY_READINGS[state.minutesElapsed as keyof typeof YOUR_TRAY_READINGS] || 0;
    probeTimer.current = setInterval(() => {
      ticks++;
      setProbeValue(target + (Math.random() * 4 - 2) * Math.exp(-ticks/5));
      if (ticks > 15) {
        if (probeTimer.current) clearInterval(probeTimer.current);
        setProbing(false);
        setProbeValue(target);
        setProbedValue(target);
        kitchenAudio.play('probe');
      }
    }, 100);
  };

  const handleJot = () => {
    if (probedValue === null) return;
    kitchenAudio.play('write');
    jot({
      taskId: 'chill-the-event-batch',
      label: `Tray at ${state.minutesElapsed}m`,
      value: `${probedValue.toFixed(1)} °C`,
      ref: { interval: state.minutesElapsed }
    });
    setOpenModal('record');
  };

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={PLACES['bench'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      <Hotspot x={35} y={60} label="Prep bench" state={benchState} onClick={() => setOpenModal('portioning')} />
      <Hotspot x={65} y={45} label="Blast chiller" state={chillerState} onClick={() => { setOpenModal('chiller'); kitchenAudio.play('door'); }} />
      <Hotspot x={85} y={70} label="Chill record" state={recordState} onClick={() => { setOpenModal('record'); kitchenAudio.play('page'); }} />

      <CloseUp isOpen={openModal === 'portioning'} onClose={() => setOpenModal(null)} title="Prep bench">
        <div className="p-8 bg-zinc-100 min-h-full">
           <div className="max-w-5xl mx-auto">
             <h2 className="text-3xl font-bold uppercase tracking-widest text-zinc-900 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               Portion the Batch
               <span className="text-base font-bold font-mono text-white bg-black px-4 py-2 rounded-full shadow-lg border border-zinc-700">
                 Remaining: {remaining.toFixed(1)} kg
               </span>
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {state.trays.map((kg, i) => {
                  const depth = PREP_SHEET.depthForKg(kg);
                  return (
                    <div key={i} className="bg-white rounded-xl shadow-xl border-2 border-zinc-200 p-6 flex flex-col items-center">
                      <div className="w-full h-56 bg-zinc-100 border-2 border-zinc-300 rounded relative overflow-hidden mb-6 flex items-end shadow-inner">
                        <div 
                          className="w-full bg-[#5c3a21] transition-[height] duration-200 ease-out shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]" 
                          style={{ height: `${Math.min(100, (depth / 80) * 100)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold mix-blend-difference text-white/50 pointer-events-none">
                          GN 1/1 TRAY
                        </div>
                      </div>
                      <div className="flex justify-between w-full text-base font-mono font-bold mb-6 text-zinc-600 px-2">
                        <span>{kg.toFixed(1)} kg</span>
                        <span>{depth} mm</span>
                      </div>
                      <button 
                        aria-label={`Ladle into tray ${i + 1}`}
                        onClick={() => onScoop(i)}
                        disabled={remaining <= 0 || kg >= 6}
                        className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        + Ladle 0.5 kg
                      </button>
                    </div>
                  );
                })}
             </div>
             
             {!portionComplete && (
               <div className="mt-12 flex justify-center">
                 <button 
                   onClick={onAskForTray}
                   disabled={state.askedForTray}
                   className="bg-transparent border-4 border-dashed border-zinc-300 text-zinc-500 font-bold py-4 px-8 rounded-xl hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-50 transition-colors flex items-center gap-3 text-lg focus-visible:ring-4 focus-visible:ring-primary outline-none"
                 >
                   <PlusCircle className="w-6 h-6" /> Ask Marcus for another tray
                 </button>
               </div>
             )}
           </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={openModal === 'chiller'} onClose={() => setOpenModal(null)} title="Blast chiller" className="bg-zinc-950">
         <div className="text-white min-h-full flex items-center justify-center p-4 md:p-8">
           {!chillerLoaded ? (
             <div className="w-full h-full max-w-5xl flex flex-col md:flex-row gap-6">
               {/* Prep Bench (Left on Desktop, Top on Mobile) */}
               <div className="md:w-72 bg-zinc-900 border-4 border-zinc-800 rounded-xl p-4 md:p-6 flex flex-col shadow-xl shrink-0">
                 <h3 className="font-bold text-zinc-500 uppercase tracking-widest mb-4 text-sm text-center md:text-left">Prep Bench</h3>
                 <div className="flex flex-row md:flex-col gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                   {state.trays.map((kg, tIdx) => {
                     if (state.shelfByTray[tIdx] !== null) return null; // In cabinet
                     const isSelected = selectedTray === tIdx;
                     return (
                       <button
                         key={tIdx}
                         aria-pressed={isSelected}
                         onClick={() => {
                           setSelectedTray(isSelected ? null : tIdx);
                           kitchenAudio.play('tap');
                         }}
                         className={cn(
                           "shrink-0 w-32 h-24 md:w-full md:h-28 bg-white rounded-lg border-4 shadow-xl flex flex-col items-center justify-center transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary",
                           isSelected ? "border-primary scale-[1.02] shadow-primary/20" : "border-zinc-200 hover:border-zinc-400"
                         )}
                       >
                         <div className="font-bold text-zinc-800 text-lg">Tray {tIdx + 1}</div>
                         <div className="text-zinc-500 text-sm font-mono">{kg.toFixed(1)}kg • {PREP_SHEET.depthForKg(kg)}mm</div>
                       </button>
                     );
                   })}
                   {state.shelfByTray.filter(x => x !== null).length === state.trays.length && (
                     <div className="flex-1 flex items-center justify-center text-zinc-600 font-bold uppercase text-sm w-full min-h-[100px]">
                       Bench Empty
                     </div>
                   )}
                 </div>
               </div>

               {/* Chiller Cabinet (Right on Desktop, Bottom on Mobile) */}
               <div className="flex-1 bg-black border-8 border-zinc-800 rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,1)] relative flex flex-col p-4 md:p-8 min-h-[400px]">
                 <h3 className="font-bold text-zinc-600 uppercase tracking-widest mb-4 text-center text-sm">Blast Chiller Cabinet</h3>
                 <div className="flex-1 flex flex-col justify-between">
                   {Array.from({ length: CHILLER_SHELVES }).map((_, i) => {
                     const tIdx = state.shelfByTray.indexOf(i);
                     const hasTray = tIdx !== -1;
                     const hasAbove = state.shelfByTray.includes(i - 1);
                     const hasBelow = state.shelfByTray.includes(i + 1);
                     const isWarning = hasTray && (hasAbove || hasBelow);
                     
                     return (
                       <div key={i} className="relative h-12 md:h-14 flex items-end justify-center group">
                         {/* Shelf runner line */}
                         <div className="absolute bottom-0 inset-x-2 md:inset-x-4 border-b-4 border-zinc-800 shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                         
                         <button
                           aria-label={hasTray ? `Shelf ${i+1} holding Tray ${tIdx+1}` : `Shelf ${i+1}`}
                           onClick={() => {
                             if (hasTray) {
                               onRemoveTray(tIdx);
                               setSelectedTray(tIdx);
                               kitchenAudio.play('tap');
                             } else if (selectedTray !== null) {
                               onLoadTray(selectedTray, i);
                               setSelectedTray(null);
                               kitchenAudio.play('confirm');
                             }
                           }}
                           className={cn(
                             "w-full h-full relative z-10 flex items-end justify-center transition-all outline-none rounded",
                             !hasTray && selectedTray !== null ? "hover:bg-white/5 cursor-pointer" : ""
                           )}
                         >
                           {hasTray ? (
                             <div className={cn(
                               "w-4/5 md:w-3/4 h-10 md:h-12 rounded-t border-t-2 border-x-2 shadow-2xl flex items-center justify-center font-bold transition-all relative",
                               isWarning ? "bg-red-950/80 border-red-500/50 text-red-200" : "bg-[#5c3a21] border-[#7a4c2c] text-white/90"
                             )}>
                               <span>Tray {tIdx + 1}</span>
                               {isWarning && <span className="absolute -right-2 md:-right-4 -top-3 bg-red-600 text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">Too close</span>}
                             </div>
                           ) : (
                             <span className="text-zinc-700 font-mono text-xs opacity-50 mb-1 group-hover:opacity-100 transition-opacity">Shelf {i+1}</span>
                           )}
                         </button>
                       </div>
                     );
                   })}
                 </div>

                 {/* Probe panel at bottom overlay */}
                 <AnimatePresence>
                   {state.shelfByTray.filter(x => x !== null).length === PREP_SHEET.cleanTraysAvailable && (
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }} 
                       animate={{ opacity: 1, y: 0 }} 
                       className="absolute bottom-4 inset-x-4 bg-zinc-900 border-2 border-zinc-700 p-4 md:p-6 rounded-xl shadow-2xl z-20"
                     >
                       <h3 className="font-bold text-zinc-300 uppercase tracking-widest mb-4 text-center md:text-left">Where does the probe go?</h3>
                       <div className="flex flex-col md:flex-row gap-3">
                         {PROBE_PLACEMENTS.map(p => (
                           <button
                             key={p.id}
                             onClick={() => onProbePlacement(p.id)}
                             className={cn(
                               "flex-1 text-center md:text-left p-3 rounded-lg border-2 transition-all font-bold text-xs md:text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none",
                               state.probePlacement === p.id 
                                 ? (p.correct ? "bg-emerald-900/40 border-emerald-500 text-emerald-400" : "bg-red-900/40 border-red-500 text-red-400") 
                                 : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                             )}
                           >
                             {p.label}
                           </button>
                         ))}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>
           ) : (
             <div className="w-full max-w-sm bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
               <div className="text-center mb-8 pb-6 border-b-2 border-zinc-800">
                 <h2 className="text-2xl font-bold text-zinc-300 tracking-widest uppercase">Blast Chiller</h2>
                 <div className="text-emerald-500 text-xs font-bold mt-2 flex items-center justify-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   CYCLE RUNNING
                 </div>
               </div>

               <div className="bg-black rounded-xl border-2 border-zinc-800 p-6 mb-8 relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]">
                  <div className="text-xs text-zinc-500 font-mono mb-2 uppercase tracking-widest">Core Temp</div>
                  <div className="font-mono text-6xl font-bold text-emerald-500 tracking-widest text-center my-6" style={{ textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>
                    {probing ? (probeValue !== null ? probeValue.toFixed(1) : "--.-") : (probedValue !== null ? probedValue.toFixed(1) : "--.-")}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-4 flex justify-between uppercase tracking-widest border-t border-zinc-800 pt-4">
                    <span>Cycle: Timed</span>
                    <span>Elapsed: {state.minutesElapsed}m</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4 mb-4">
                  <button 
                    onClick={handleProbeStart} 
                    disabled={probing}
                    className="bg-zinc-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-zinc-700 disabled:opacity-50 flex items-center justify-center gap-3 text-lg transition-colors border border-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                  >
                    <Thermometer className="w-6 h-6" /> Read the probe
                  </button>
               </div>

               <AnimatePresence>
                 {probedValue !== null && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 overflow-hidden">
                      <button 
                        onClick={handleJot}
                        className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-400 flex items-center justify-center gap-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300 outline-none"
                      >
                        Jot reading down
                      </button>
                    </motion.div>
                 )}
               </AnimatePresence>

               <button 
                  onClick={onWait}
                  disabled={state.minutesElapsed >= 120 || needsToRecord}
                  aria-describedby="chill-wait-hint"
                  className="w-full bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl hover:bg-zinc-700 hover:text-white disabled:opacity-50 flex items-center justify-center gap-2 mt-8 transition-colors border border-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  Wait 30 minutes <ChevronRight className="w-5 h-5" />
               </button>
               <p id="chill-wait-hint" className="text-xs text-zinc-500 text-center mt-2">
                 {needsToRecord && state.minutesElapsed < 120
                   ? `Write the ${state.minutesElapsed}-minute reading on the chill record before the next wait.`
                   : state.minutesElapsed >= 120 ? 'The cycle is finished.' : 'Each wait moves the kitchen clock on half an hour.'}
               </p>

               <AnimatePresence>
                 {state.minutesElapsed === 90 && !state.measuredDepths && (
                   <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }}
                     className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 rounded-2xl"
                   >
                     <div className="bg-white text-black p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg flex flex-col border-4 border-primary relative">
                       <div className="flex items-center gap-4 mb-6">
                         <img src={PEOPLE.find(p => p.id === 'marcus')?.portrait || ''} alt="Marcus" className="w-16 h-16 rounded-full border-2 border-zinc-200 object-cover shadow-sm" />
                         <div>
                           <h3 className="text-xl md:text-2xl font-bold text-primary">Ninety minutes in</h3>
                           <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Marcus</p>
                         </div>
                       </div>
                       
                       <p className="text-zinc-800 mb-8 font-medium leading-relaxed italic border-l-4 border-zinc-200 pl-4 text-lg">
                         "Your tray is still above 8°C. My tray, filled shallower, is below it. What do you do?"
                       </p>
                       
                       <div className="space-y-3 mb-8">
                         {NINETY_MINUTE_CHOICES.map(c => (
                           <button
                             key={c.id}
                             onClick={() => onNinetyChoice(c.id)}
                             className={cn(
                               "w-full text-left p-4 border-2 rounded-lg transition-colors font-bold text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none",
                               state.ninetyChoice === c.id ? "bg-primary/10 border-primary text-primary" : "bg-white border-zinc-200 hover:border-primary/40 text-zinc-700 hover:bg-zinc-50"
                             )}
                           >
                             {c.label}
                           </button>
                         ))}
                       </div>

                       {state.ninetyChoice === 'keep-logging' && (
                         <motion.button 
                           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                           onClick={onMeasure} 
                           className="w-full bg-black text-white font-bold py-4 rounded-lg shadow-lg hover:bg-zinc-800 flex items-center justify-center gap-3 mt-auto active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-500 outline-none"
                         >
                           <Ruler className="w-5 h-5" /> Measure tray depths
                         </motion.button>
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           )}
         </div>
      </CloseUp>

      <CloseUp isOpen={openModal === 'record'} onClose={() => setOpenModal(null)} title="Chill record">
         <Clipboard>
           <div className="p-8 md:p-12 min-h-full">
              <h3 className="font-bold text-3xl text-center uppercase tracking-widest mb-2 font-sans text-zinc-900">Blast Chill Record</h3>
              <p className="text-center text-sm text-zinc-500 font-mono mb-12 uppercase tracking-widest border-b-2 border-zinc-200 pb-8">Batch: Braised Beef Shin</p>
              
              <table className="kitchen-table w-full mb-16">
                <thead>
                  <tr>
                    <th className="text-left py-4 border-b-2 border-zinc-800 font-bold uppercase text-xs tracking-widest text-zinc-500">Elapsed</th>
                    <th className="text-left py-4 border-b-2 border-zinc-800 font-bold uppercase text-xs tracking-widest text-zinc-500">Time</th>
                    <th className="text-left py-4 border-b-2 border-zinc-800 font-bold uppercase text-xs tracking-widest text-zinc-500">Your Tray</th>
                    <th className="text-left py-4 border-b-2 border-zinc-800 font-bold uppercase text-xs tracking-widest text-zinc-500">Marcus's</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 30, 60, 90, 120].map(interval => {
                    const isVisible = state.minutesElapsed >= interval;
                    if (interval === 120 && state.minutesElapsed < 120) return null;
                    
                    const row = state.readings[interval as ChillInterval];
                    const jotted = notepad.entryFor('interval', interval);

                    return (
                      <tr key={interval} className={cn("border-b border-zinc-200 transition-all duration-500", !isVisible && "opacity-20 pointer-events-none")}>
                        <td className="py-6 font-mono font-bold text-zinc-800 text-lg">{interval} <span className="text-sm text-zinc-400">MIN</span></td>
                        <td className="py-6 pr-4">
                          <Input 
                            value={row?.time || ''} 
                            readOnly 
                            placeholder="-" 
                            className="kitchen-input w-24 text-zinc-500 bg-transparent border-none p-0 text-lg shadow-none focus-visible:ring-0" 
                            style={{ fontFamily: 'cursive' }}
                          />
                        </td>
                        <td className="py-6 pr-4">
                          <div className="flex flex-col items-start gap-2">
                            <Input 
                              value={row?.value || ''}
                              onChange={(e) => onReading(interval as ChillInterval, e.target.value)}
                              disabled={!isVisible}
                              placeholder="-"
                              className="kitchen-input w-28 text-xl"
                              style={{ fontFamily: 'cursive' }}
                            />
                            {jotted && !row?.value && (
                              <button
                                onClick={() => {
                                  kitchenAudio.play('write');
                                  onReading(interval as ChillInterval, jotted.value.replace(' °C', ''));
                                }}
                                className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded shadow-sm hover:bg-primary/20 uppercase tracking-wider transition-colors"
                              >
                                From notepad
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-6 font-mono text-zinc-500 text-lg">
                          {isVisible ? `${MARCUS_TRAY_READINGS[interval as ChillInterval].toFixed(1)}°C` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-between items-end border-t-2 border-zinc-800 pt-8">
                 <div>
                   <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Checked By</div>
                   {state.studentSigned ? (
                     <div className="text-4xl text-zinc-800 px-6 py-2 border-b-2 border-zinc-300 min-w-[240px] inline-block" style={{ fontFamily: 'cursive' }}>
                       {progress.initials}
                     </div>
                   ) : (
                     <button 
                       onClick={onSign}
                       disabled={state.minutesElapsed < 120 || !state.readings[120]?.value}
                       className="px-8 py-3 border-2 border-dashed border-zinc-400 text-zinc-400 font-bold rounded-lg hover:bg-zinc-50 hover:text-zinc-600 hover:border-zinc-500 transition-colors disabled:opacity-30 uppercase tracking-widest text-sm"
                     >
                       Sign Here
                     </button>
                   )}
                 </div>
                 <div className="text-right">
                   <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Exec Chef</div>
                   <div className="text-base italic text-zinc-400 px-6 py-3 border-b-2 border-zinc-200 min-w-[240px] inline-block">
                     (Elena signs at end of day)
                   </div>
                 </div>
              </div>
           </div>
         </Clipboard>
      </CloseUp>
    </div>
  );
}
