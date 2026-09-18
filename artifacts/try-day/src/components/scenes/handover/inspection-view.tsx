import { useState, useRef, useEffect } from 'react';
import { FRIDGE_UNITS, HANDOVER_LINES } from '@/content/activities';
import { FRIDGE_INSPECTIONS } from '@/content/fridge-photos';
import { getFridgeMedia } from '@/content/fridge-media';
import { InspectionMedia } from './inspection-media';
import { cn } from '@/lib/utils';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import type { HandoverState } from '@/lib/simulation';
import { FLAGGED_FRIDGE_ID, handoverRowComplete } from '@/lib/handover-round';
import { rowReadingIsRight } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { motion } from 'framer-motion';
import { useProgress } from '@/lib/progress-store';
import { FRIDGE_INTERACTION_COPY } from '@/content/fridge-interaction-copy';

export function InspectionView({
  unitId,
  state,
  onProbe,
  onRowChange,
  onSaveClose,
  savedCount,
  totalCount,
  frozen,
  onSelectUnit,
  motionEnabled,
  setMotionEnabled,
}: {
  unitId: string;
  state: HandoverState;
  onProbe: (id: string) => void;
  onRowChange: (id: string, field: 'reading' | 'initials' | 'note', value: string) => void;
  onSaveClose: (id: string) => boolean;
  savedCount: number;
  totalCount: number;
  frozen: boolean;
  onSelectUnit: (id: string) => void;
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
}) {
  const unit = FRIDGE_UNITS.find(u => u.id === unitId)!;
  const row = state.rows[unitId] || { probed: false, reading: '', time: '', initials: '', note: '' };
  
  const [doorOpen, setDoorOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [checkedClueIds, setCheckedClueIds] = useState<Set<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const [probePending, setProbePending] = useState(false);
  const { jot } = useProgress();
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (probeTimerRef.current) clearTimeout(probeTimerRef.current);
    };
  }, []);

  // Focus management
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const firstClueRef = useRef<HTMLButtonElement>(null);
  const readingInputRef = useRef<HTMLInputElement>(null);
  const initialsInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  
  // When unit loads, if closed, focus open button
  useEffect(() => {
    if (!doorOpen && !closing) {
      openBtnRef.current?.focus();
    }
  }, [unitId, doorOpen, closing]);

  useEffect(() => {
    if (doorOpen && !closing && !frozen) {
      if (row.probed) readingInputRef.current?.focus();
      else firstClueRef.current?.focus({ preventScroll: true });
    }
  }, [closing, doorOpen, frozen, row.probed]);

  useKitchenAction('handover:workspace', () => {
    if (frozen) return;
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
    if (frozen) return;
    kitchenAudio.play('door');
    setDoorOpen(true);
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (frozen) return;
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
    const delay = reducedMotion ? 0 : 200;
    
    timerRef.current = setTimeout(() => {
      setClosing(false);
      const success = onSaveClose(unitId);
      if (success) {
        setAnnouncement(FRIDGE_INTERACTION_COPY.rowSaved(unit.name));
        setDoorOpen(false);
      }
    }, delay); 
  };

  const isFlagged = unitId === FLAGGED_FRIDGE_ID;
  const isWarm = unit.actualC > unit.limitC;
  const noteRequired = isFlagged || isWarm;
  const photo = FRIDGE_INSPECTIONS[unitId];
  const activeClue = photo.clues.find(clue => clue.id === activeClueId);
  const mediaState = doorOpen && !closing ? 'open' : 'closed';
  const media = getFridgeMedia(unitId, mediaState);
  const settledFeedback = isWarm
    ? FRIDGE_INTERACTION_COPY.aboveLimit(unit.actualC.toFixed(1), unit.limitLabel)
    : FRIDGE_INTERACTION_COPY.withinLimit(unit.actualC.toFixed(1), unit.limitLabel);

  return (
    <div 
      className="absolute inset-0 z-0 bg-black flex flex-col overflow-hidden"
      data-testid="fridge-inspection" 
      data-unit-id={unitId}
    >
      <nav className="shrink-0 border-b border-zinc-700 bg-zinc-950 px-3 py-2 text-white" aria-label={FRIDGE_INTERACTION_COPY.roundOrientation}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="list">
          {FRIDGE_UNITS.map((fridge, index) => {
            const saved = handoverRowComplete(fridge.id, state.rows[fridge.id]) && state.rows[fridge.id]?.recorded !== false;
            const current = fridge.id === unitId;
            const available = saved || current;
            const stateLabel = current
              ? FRIDGE_INTERACTION_COPY.currentAppliance
              : saved
                ? FRIDGE_INTERACTION_COPY.checkedAppliance
                : FRIDGE_INTERACTION_COPY.waitingAppliance;
            return (
              <div key={fridge.id} role="listitem" className="shrink-0">
                <button
                  type="button"
                  disabled={!available || frozen}
                  onClick={() => onSelectUnit(fridge.id)}
                  aria-current={current ? 'step' : undefined}
                  aria-label={current ? `${fridge.name}, ${stateLabel}` : saved ? FRIDGE_INTERACTION_COPY.chooseAppliance(fridge.name) : `${fridge.name}, ${stateLabel}`}
                  className={cn(
                    'min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none',
                    current ? 'border-white bg-white text-black' : saved ? 'border-zinc-500 bg-zinc-800 text-white hover:bg-zinc-700' : 'border-zinc-800 text-zinc-500'
                  )}
                >
                  <span className="block">{index + 1}. {fridge.name}</span>
                  <span className="block text-[10px] font-normal">{stateLabel}</span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row">
      {/* Keep the markers relative to the visible portrait, not the surrounding space. */}
      <div className="relative md:h-full md:flex-1 md:min-w-0 bg-black flex flex-col gap-3 p-4 shrink-0 md:shrink">
        {/* We show the unit identity and saved count even when closed */}
        <div className="flex flex-wrap justify-between items-start gap-2 shrink-0">
           <div className="bg-black/60 text-white p-3 rounded-lg backdrop-blur-sm border border-white/10 shadow-xl">
             <h2 className="font-bold text-xl text-white">{unit.name}</h2>
             <div className="text-zinc-300 text-xs mt-1 uppercase tracking-wider">{unit.where} • {unit.limitLabel}</div>
           </div>
           <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10 shadow-xl">
             {HANDOVER_LABELS.progress(savedCount, totalCount)}
           </div>
        </div>

        <InspectionMedia
          key={`${unitId}-${mediaState}`}
          media={media}
          description={mediaState === 'open' ? photo.alt : `${unit.name}, closed door.`}
          motionEnabled={motionEnabled}
          setMotionEnabled={setMotionEnabled}
          active={!closing && !frozen}
        >
          {mediaState === 'closed' && !closing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                ref={openBtnRef}
                type="button"
                data-testid="open-fridge"
                onClick={handleOpen}
                disabled={frozen}
                className="bg-white text-black font-bold px-5 py-4 rounded-xl shadow-2xl hover:bg-zinc-200 transition-colors text-xl tracking-wide border-4 border-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {HANDOVER_LABELS.openFridge}
              </button>
            </div>
          )}
          {mediaState === 'open' && (
            <div className="absolute inset-0" role="group" aria-label={HANDOVER_LABELS.inspectPrompt}>
              {photo.clues.map((clue, index) => (
                <button
                  key={clue.id}
                  ref={index === 0 ? firstClueRef : undefined}
                  type="button"
                  disabled={frozen}
                  onClick={() => {
                    setActiveClueId(clue.id);
                    setCheckedClueIds(previous => new Set(previous).add(clue.id));
                    setAnnouncement(clue.finding);
                    setError(null);
                    kitchenAudio.play('page');
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary text-primary-foreground shadow-[0_2px_16px_rgba(0,0,0,0.8)] h-11 w-11 sm:h-12 sm:w-12 font-bold focus-visible:ring-4 focus-visible:ring-white/70 outline-none hover:scale-110 motion-reduce:transition-none"
                  style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                  aria-label={clue.label}
                  aria-pressed={activeClueId === clue.id}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </InspectionMedia>
        {mediaState === 'open' && (
          <div className="shrink-0 rounded-lg border border-white/20 bg-zinc-900 px-4 py-3 text-white">
            {activeClue ? (
              <>
                <div className="text-xs font-bold uppercase tracking-wider">{activeClue.label}</div>
                <div className="mt-1 text-sm sm:text-base leading-snug">{activeClue.finding}</div>
              </>
            ) : (
              <div className="text-xs font-medium">{HANDOVER_LABELS.inspectHint}</div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel Area */}
      <div 
        className={cn(
           "bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-700 transition-all duration-200 motion-reduce:duration-0 flex-shrink-0 md:w-[400px] lg:w-[500px]",
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
                      disabled={frozen}
                     onClick={() => {
                       kitchenAudio.play('write');
                       jot({
                         taskId: 'take-the-handover',
                         label: unit.name,
                         value: `${unit.actualC.toFixed(1)} °C`,
                         ref: { unitId: unit.id }
                       });
                        setAnnouncement(FRIDGE_INTERACTION_COPY.notebookSaved);
                     }}
                      className="min-h-11 text-sm bg-white/10 border border-white/20 text-white font-bold px-4 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                   >
                     {HANDOVER_LABELS.writeInNotebook}
                   </button>
                 </div>
               ) : (
                  <button
                    type="button"
                    disabled={frozen || probePending}
                    onClick={() => {
                      if (probePending) return;
                      setProbePending(true);
                      setAnnouncement('The probe is settling.');
                      probeTimerRef.current = setTimeout(() => {
                        setProbePending(false);
                        kitchenAudio.play('probe');
                        onProbe(unitId);
                      }, 1600);
                    }}
                    className="min-h-11 rounded-xl border-2 border-zinc-600 bg-white px-5 py-3 text-left font-bold text-black outline-none transition-transform duration-200 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-60 motion-reduce:transition-none"
                  >
                    <span className="block">{HANDOVER_LABELS.holdToRead}</span>
                    <span className="mt-1 block text-xs font-normal text-zinc-600">{probePending ? 'The probe is settling' : 'Start the reading and wait for it to settle'}</span>
                  </button>
               )}
                <div className="mt-3 text-center text-sm text-zinc-200" role="status">
                  {row.probed ? (
                    <>
                      <p>{FRIDGE_INTERACTION_COPY.probeReady}</p>
                      <p className={cn('mt-1 font-semibold', isWarm ? 'text-amber-300' : 'text-emerald-300')}>{settledFeedback}</p>
                    </>
                  ) : (
                    <p>{FRIDGE_INTERACTION_COPY.noteProbePrompt}</p>
                  )}
                </div>
            </div>

            {/* Record Form Inputs */}
             <div className={cn("flex flex-col gap-5 transition-all duration-200 motion-reduce:duration-0 shrink-0", row.probed ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 pointer-events-none")}>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3">
                  <p className="text-sm font-bold">{FRIDGE_INTERACTION_COPY.evidenceHeading}</p>
                  <p className="mt-1 text-xs text-zinc-300">{FRIDGE_INTERACTION_COPY.evidenceProgress(checkedClueIds.size, photo.clues.length)}</p>
                </div>
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
                      onChange={(e) => {
                        setError(null);
                        onRowChange(unitId, 'reading', e.target.value);
                      }}
                     className="min-w-0 w-full bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-xl focus:border-primary outline-none transition-colors"
                     placeholder="-"
                      disabled={!row.probed || closing || frozen}
                      aria-invalid={!!error && !rowReadingIsRight(unitId, row.reading)}
                      aria-describedby={error && !rowReadingIsRight(unitId, row.reading) ? `handover-error-${unitId}` : undefined}
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
                      aria-readonly="true"
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
                    onChange={(e) => {
                      setError(null);
                      onRowChange(unitId, 'initials', e.target.value);
                    }}
                   className="min-w-0 w-full bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-xl uppercase focus:border-primary outline-none transition-colors"
                   placeholder="-"
                    disabled={!row.probed || closing || frozen}
                    aria-invalid={!!error && row.initials.trim().length === 0}
                    aria-describedby={error && row.initials.trim().length === 0 ? `handover-error-${unitId}` : undefined}
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
                    onChange={(e) => {
                      setError(null);
                      onRowChange(unitId, 'note', e.target.value);
                    }}
                   className="bg-black text-white px-4 py-3 rounded border border-zinc-600 font-mono text-lg focus:border-primary outline-none w-full transition-colors"
                   placeholder={HANDOVER_LABELS.notePlaceholder}
                    disabled={!row.probed || closing || frozen}
                    aria-invalid={!!error && rowReadingIsRight(unitId, row.reading) && row.initials.trim().length > 0}
                    aria-describedby={error && rowReadingIsRight(unitId, row.reading) && row.initials.trim().length > 0 ? `handover-error-${unitId}` : undefined}
                 />
               </div>
            </div>

            {/* Error and Submit Actions */}
            <div className="mt-auto pt-4 flex flex-col gap-3 shrink-0">
               <div id={`handover-error-${unitId}`} className="text-destructive font-bold min-h-[1.5rem]" aria-live="assertive" role="alert">
                 {error && (
                   <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm bg-destructive/10 text-destructive border border-destructive/20 p-2 rounded">
                     {error}
                   </motion.div>
                 )}
               </div>
               <button
                 type="submit"
                 data-testid="close-fridge"
                  disabled={!row.probed || closing || frozen}
                 className="bg-white text-black font-bold px-6 py-4 rounded-xl shadow-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-lg w-full"
               >
                 {HANDOVER_LABELS.saveAndClose}
               </button>
            </div>
         </form>
      </div>
      </div>
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </div>
  );
}
