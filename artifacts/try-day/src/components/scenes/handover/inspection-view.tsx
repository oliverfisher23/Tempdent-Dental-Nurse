import { useState, useRef, useEffect } from 'react';
import { FRIDGE_UNITS, HANDOVER_LINES } from '@/content/activities';
import { CLOSED_FRIDGE_PHOTO, FRIDGE_PHOTOS } from '@/content/fridge-photos';
import { HoldToRead } from '../../kitchen/interact/hold-to-read';
import { cn } from '@/lib/utils';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import type { HandoverState } from '@/lib/simulation';
import { FLAGGED_FRIDGE_ID, handoverRowComplete } from '@/lib/handover-round';
import { rowReadingIsRight } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@/lib/progress-store';

export function InspectionView({
  unitId,
  state,
  initials,
  onProbe,
  onRowChange,
  onSaveClose,
  savedCount,
  totalCount,
}: {
  unitId: string;
  state: HandoverState;
  initials: string;
  onProbe: (id: string) => void;
  onRowChange: (id: string, field: 'reading' | 'initials' | 'note', value: string) => void;
  onSaveClose: (id: string) => boolean;
  savedCount: number;
  totalCount: number;
}) {
  const unit = FRIDGE_UNITS.find(u => u.id === unitId)!;
  const row = state.rows[unitId] || { probed: false, reading: '', time: '', initials: initials || '', note: '' };
  
  const [doorOpen, setDoorOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const { jot } = useProgress();
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Focus management
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const readingInputRef = useRef<HTMLInputElement>(null);
  const initialsInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  
  // When unit loads, if closed, focus open button
  useEffect(() => {
    if (!doorOpen && !closing) {
      openBtnRef.current?.focus();
    }
  }, [unitId, doorOpen, closing]);

  useKitchenAction('handover:workspace', () => {
    if (!doorOpen) {
      setDoorOpen(true);
      setError(null);
      kitchenAudio.play('door');
    } else if (!row.probed) {
      const panelBtn = document.querySelector(`[data-testid="fridge-inspection"] form button[type="button"]`) as HTMLButtonElement | null;
      panelBtn?.focus();
    } else {
      readingInputRef.current?.focus();
    }
  });

  const handleOpen = () => {
    kitchenAudio.play('door');
    setDoorOpen(true);
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!handoverRowComplete(unitId, row)) {
      kitchenAudio.play('wrong');
      if (!rowReadingIsRight(unitId, row.reading)) {
        setError(HANDOVER_LABELS.readingError);
        readingInputRef.current?.focus();
      } else if (row.initials.trim().length === 0) {
        setError(HANDOVER_LABELS.initialsError);
        initialsInputRef.current?.focus();
      } else {
        setError(HANDOVER_LABELS.noteError);
        noteInputRef.current?.focus();
      }
      return;
    }
    
    if (closing) return;
    setClosing(true);
    kitchenAudio.play('doorClose');
    
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reducedMotion ? 0 : 500;
    
    timerRef.current = setTimeout(() => {
      setClosing(false);
      const success = onSaveClose(unitId);
      if (success) {
        setDoorOpen(false);
      }
    }, delay); 
  };

  const isFlagged = unitId === FLAGGED_FRIDGE_ID;
  const isWarm = unit.actualC > unit.limitC;
  const noteRequired = isFlagged || isWarm;
  const photo = FRIDGE_PHOTOS[unitId];
  const activeClue = photo.clues.find(clue => clue.id === activeClueId);

  return (
    <div 
      className="absolute inset-0 z-0 bg-black flex flex-col md:flex-row overflow-y-auto" 
      data-testid="fridge-inspection" 
      data-unit-id={unitId}
    >
      {/* Visual Scene: Photo Area */}
      <div className="relative h-[340px] min-h-[260px] md:h-full md:flex-1 md:min-h-0 bg-black flex flex-col items-center justify-center p-4 shrink-0 md:shrink">
        {/* We show the unit identity and saved count even when closed */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
           <div className="bg-black/60 text-white p-3 rounded-lg backdrop-blur-sm border border-white/10 shadow-xl">
             <h2 className="font-bold text-xl text-white">{unit.name}</h2>
             <div className="text-zinc-300 text-xs mt-1 uppercase tracking-wider">{unit.where} • {unit.limitLabel}</div>
           </div>
           <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10 shadow-xl">
             {HANDOVER_LABELS.progress(savedCount, totalCount)}
           </div>
        </div>

        <div className="relative w-full h-full flex items-center justify-center pt-20 pb-4">
          <div 
            className={cn("absolute inset-0 transition-opacity duration-500 motion-reduce:duration-0", (doorOpen && !closing) ? "opacity-0 pointer-events-none" : "opacity-100")}
          >
             <img src={CLOSED_FRIDGE_PHOTO} alt="Closed fridge door" className="w-full h-full object-contain" />
             {!doorOpen && !closing && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <button
                   ref={openBtnRef}
                   type="button"
                   data-testid="open-fridge"
                   onClick={handleOpen}
                   className="bg-white text-black font-bold px-8 py-4 rounded-xl shadow-2xl hover:bg-zinc-200 hover:scale-105 transition-all motion-reduce:transition-none text-xl md:text-2xl tracking-wide border-4 border-zinc-200"
                 >
                   {HANDOVER_LABELS.openFridge}
                 </button>
               </div>
             )}
          </div>

          <div 
            className={cn("absolute inset-0 transition-opacity duration-500 motion-reduce:duration-0", (doorOpen && !closing) ? "opacity-100" : "opacity-0 pointer-events-none")}
          >
             <img 
                src={photo.src}
                alt={photo.alt}
               className="w-full h-full object-contain" 
             />
             <div className="absolute inset-0" aria-label={HANDOVER_LABELS.inspectPrompt}>
               {photo.clues.map((clue, index) => (
                 <motion.button
                   key={clue.id}
                   type="button"
                   initial={{ opacity: 0, scale: 0.7 }}
                   animate={{ opacity: 1, scale: activeClueId === clue.id ? 1.08 : 1 }}
                   transition={{ delay: 0.12 + index * 0.08, type: 'spring', stiffness: 320, damping: 20 }}
                   onClick={() => {
                     setActiveClueId(clue.id);
                     setError(null);
                     kitchenAudio.play('page');
                   }}
                   className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary text-primary-foreground shadow-[0_2px_16px_rgba(0,0,0,0.8)] h-10 w-10 sm:h-12 sm:w-12 font-bold focus-visible:ring-4 focus-visible:ring-white/70 outline-none hover:scale-110 motion-reduce:transition-none"
                   style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                   aria-label={clue.label}
                   aria-pressed={activeClueId === clue.id}
                 >
                   {index + 1}
                 </motion.button>
               ))}
               <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                 <AnimatePresence mode="wait">
                   {activeClue ? (
                     <motion.div
                       key={activeClue.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 6 }}
                       className="max-w-lg rounded-lg border border-white/20 bg-black/85 px-4 py-3 text-white shadow-xl backdrop-blur-sm"
                       role="status"
                     >
                       <div className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80">{activeClue.label}</div>
                       <div className="mt-1 text-sm sm:text-base leading-snug">{activeClue.finding}</div>
                     </motion.div>
                   ) : (
                     <motion.div
                       key="hint"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="rounded-full bg-black/75 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
                     >
                       {HANDOVER_LABELS.inspectHint}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Control Panel Area */}
      <div 
        className={cn(
          "bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-700 transition-all duration-500 motion-reduce:duration-0 flex-shrink-0 md:w-[400px] lg:w-[500px]", 
          (doorOpen && !closing) ? "opacity-100" : "opacity-0 pointer-events-none md:opacity-100"
        )}
        style={{
          display: (!doorOpen || closing) ? 'none' : 'flex'
        }}
      >
         <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 lg:p-8 text-white flex flex-col gap-6 w-full h-auto md:h-full overflow-visible md:overflow-y-auto">
            
            {/* Probe Action / Display */}
            <div className="bg-black border border-zinc-700 rounded-xl p-6 shadow-inner flex flex-col items-center justify-center min-h-[140px] shrink-0">
               {row.probed ? (
                 <div className="flex flex-col items-center gap-4">
                   <div className="font-mono text-5xl font-bold tracking-widest text-emerald-400" data-testid="probe-display">
                     {unit.actualC.toFixed(1)} <span className="text-2xl text-emerald-500/50">°C</span>
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       kitchenAudio.play('write');
                       jot({
                         taskId: 'take-the-handover',
                         label: unit.name,
                         value: `${unit.actualC.toFixed(1)} °C`,
                         ref: { unitId: unit.id }
                       });
                     }}
                     className="text-sm bg-white/10 border border-white/20 text-white font-bold px-4 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2"
                   >
                     {HANDOVER_LABELS.writeInNotebook}
                   </button>
                 </div>
               ) : (
                 <HoldToRead
                    target={unit.actualC}
                    label={HANDOVER_LABELS.holdToRead}
                    onSettled={() => {
                      kitchenAudio.play('probe');
                      onProbe(unitId);
                    }}
                 />
               )}
            </div>

            {/* Record Form Inputs */}
            <div className={cn("flex flex-col gap-5 transition-all duration-500 motion-reduce:duration-0 shrink-0", row.probed ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 pointer-events-none")}>
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <label htmlFor={`reading-${unitId}`} className="text-xs font-bold uppercase text-zinc-400">{HANDOVER_LABELS.probeValue}</label>
                   <input
                     id={`reading-${unitId}`}
                     name="reading"
                     ref={readingInputRef}
                     data-testid="reading-input"
                     type="text"
                     inputMode={unit.limitC < 0 ? 'text' : 'decimal'}
                     value={row.reading}
                     onChange={(e) => onRowChange(unitId, 'reading', e.target.value)}
                     className="min-w-0 w-full bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-xl focus:border-primary outline-none transition-colors"
                     placeholder="-"
                     disabled={!row.probed || closing}
                   />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label htmlFor={`time-${unitId}`} className="text-xs font-bold uppercase text-zinc-400">{HANDOVER_LABELS.time}</label>
                   <input
                     id={`time-${unitId}`}
                     name="time"
                     type="text"
                     value={row.time}
                     readOnly
                     className="min-w-0 w-full bg-black/50 text-zinc-400 px-4 py-3 rounded border border-zinc-700/50 font-mono text-xl outline-none cursor-not-allowed"
                     placeholder="-"
                   />
                 </div>
               </div>
               
               <div className="flex flex-col gap-2">
                 <label htmlFor={`initials-${unitId}`} className="text-xs font-bold uppercase text-zinc-400">{HANDOVER_LABELS.initials}</label>
                 <input
                   id={`initials-${unitId}`}
                   name="initials"
                   ref={initialsInputRef}
                   data-testid="initials-input"
                   type="text"
                   value={row.initials}
                   maxLength={3}
                   onChange={(e) => onRowChange(unitId, 'initials', e.target.value)}
                   className="min-w-0 w-full bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-xl uppercase focus:border-primary outline-none transition-colors"
                   placeholder="-"
                   disabled={!row.probed || closing}
                 />
               </div>
               
               <div className="flex flex-col gap-2 mt-2">
                  {(isFlagged || (isWarm && row.probed)) && (
                    <div className="bg-primary/15 border border-primary/50 p-3 rounded-lg mb-1 text-zinc-100 font-medium flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0 bg-primary rounded-full p-1 text-white">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     </div>
                     <div className="text-sm">
                        {(isWarm && row.probed) ? HANDOVER_LINES.marcusOnWarmReading.text : HANDOVER_LINES.marcusAtFlaggedUnit.text}
                     </div>
                   </div>
                 )}
                 <label htmlFor={`note-${unitId}`} className="text-xs font-bold uppercase text-zinc-400">
                   {noteRequired ? HANDOVER_LABELS.note : HANDOVER_LABELS.noteOptional}
                 </label>
                 <input
                   id={`note-${unitId}`}
                   name="note"
                   ref={noteInputRef}
                   data-testid="corrective-note"
                   type="text"
                   value={row.note}
                   onChange={(e) => onRowChange(unitId, 'note', e.target.value)}
                   className="bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-lg focus:border-primary outline-none w-full transition-colors"
                   placeholder={HANDOVER_LABELS.notePlaceholder}
                   disabled={!row.probed || closing}
                 />
               </div>
            </div>

            {/* Error and Submit Actions */}
            <div className="mt-auto pt-4 flex flex-col gap-3 shrink-0">
               <div className="text-destructive font-bold min-h-[1.5rem]" aria-live="polite" role="alert">
                 {error && (
                   <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm bg-destructive/10 text-destructive border border-destructive/20 p-2 rounded">
                     {error}
                   </motion.div>
                 )}
               </div>
               <button
                 type="submit"
                 data-testid="close-fridge"
                 disabled={!row.probed || closing}
                 className="bg-white text-black font-bold px-6 py-4 rounded-xl shadow-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-lg w-full"
               >
                 {HANDOVER_LABELS.saveAndClose}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
