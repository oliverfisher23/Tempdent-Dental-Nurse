import { useState, useRef, useEffect, useCallback } from 'react';
import { FRIDGE_UNITS, HANDOVER_LINES } from '@/content/activities';
import { InspectionMedia } from './inspection-media';
import { DialThermometer } from './dial-thermometer';
import { getInspectionSelection } from './inspection-selection';
import { cn } from '@/lib/utils';
import { HANDOVER_LABELS } from '@/content/scenes/handover-round';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import type { HandoverState } from '@/lib/simulation';
import { FLAGGED_FRIDGE_ID, handoverRowComplete } from '@/lib/handover-round';
import { rowReadingIsRight } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
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
  
   const [doorPhase, setDoorPhase] = useState<'closed' | 'opening' | 'open'>('closed');
   const doorOpen = doorPhase === 'open';
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [checkedClueIds, setCheckedClueIds] = useState<Set<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const [probePending, setProbePending] = useState(false);
  const [mediaStatus, setMediaStatus] = useState('');
  const { progress, jot } = useProgress();
  const noted = progress.notepad.some((entry) => entry.taskId === 'take-the-handover' && entry.ref?.unitId === unit.id);
  
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
   const probeButtonRef = useRef<HTMLButtonElement>(null);
   const dialRef = useRef<SVGSVGElement>(null);
   const wasProbedRef = useRef(row.probed);
   const finishOpening = useCallback(() => {
     setDoorPhase(phase => phase === 'opening' ? 'open' : phase);
   }, []);
  
  // When unit loads, if closed, focus open button
  useEffect(() => {
     if (doorPhase === 'closed' && !closing) {
       openBtnRef.current?.focus({ preventScroll: true });
    }
   }, [unitId, doorPhase, closing]);

  useEffect(() => {
    if (doorOpen && !closing && !frozen) {
       firstClueRef.current?.focus({ preventScroll: true });
    }
   }, [closing, doorOpen, frozen]);

   // When the needle settles, focus lands on the dial itself so its label is read out before the learner types.
   useEffect(() => {
     if (row.probed && !wasProbedRef.current && !frozen) dialRef.current?.focus({ preventScroll: true });
     wasProbedRef.current = row.probed;
   }, [row.probed, frozen]);

   const handleOpen = () => {
     if (frozen || doorPhase !== 'closed') return;
     kitchenAudio.play('door');
     setDoorPhase(motionEnabled ? 'opening' : 'open');
     setError(null);
   };

  useKitchenAction('handover:workspace', () => {
    if (frozen) return;
     if (doorPhase === 'closed') {
       handleOpen();
     } else if (doorPhase === 'opening') {
       finishOpening();
    } else if (!row.probed) {
       probeButtonRef.current?.focus();
    } else {
      readingInputRef.current?.focus();
    }
  });

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
         setDoorPhase('closed');
      }
    }, delay); 
  };

  const isFlagged = unitId === FLAGGED_FRIDGE_ID;
  const isWarm = unit.actualC > unit.limitC;
  const noteRequired = isFlagged || isWarm;
  const mediaState = doorOpen ? 'open' : 'closed';
  const selection = getInspectionSelection(unitId, mediaState);
  const photo = selection.inspection;
  const activeClue = photo.clues.find(clue => clue.id === activeClueId);
  const media = selection.media;
  // With the door open the needle drifts a little warm; taking the reading lets it settle on the truth.
  const dialPhase = row.probed ? 'settled' : probePending ? 'settling' : 'misted';
  const dialValue = dialPhase === 'misted' ? unit.actualC + 1.6 : unit.actualC;
  const typedReading = row.reading.trim();

  return (
    <div 
      className="absolute inset-0 z-0 bg-black flex flex-col overflow-hidden"
      data-testid="fridge-inspection" 
      data-unit-id={unitId}
       data-door-phase={doorPhase}
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
      {/* The footage is portrait, so beside the panel the picture is sized by height, never by width. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto beside:flex-row beside:overflow-hidden">
      <div className="relative w-full shrink-0 bg-black beside:h-full beside:w-auto beside:max-w-[46%] beside:aspect-[9/16]">
        <InspectionMedia
           key={`${unitId}-${doorPhase}`}
          media={media}
           description={doorOpen ? photo.alt : `${unit.name}, closed door.`}
          motionEnabled={motionEnabled}
          setMotionEnabled={setMotionEnabled}
          active={!closing && !frozen}
           playback={doorPhase === 'closed' ? 'still' : doorPhase === 'opening' ? 'once' : 'loop'}
           onComplete={finishOpening}
           onStatus={setMediaStatus}
        >
          {mediaState === 'open' && (
            <div className="absolute inset-0" role="group" aria-label={HANDOVER_LABELS.inspectPrompt}>
              {selection.visibleClues.map((clue, index) => (
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
                  // Clamped by the marker radius so a clue at the edge of the picture keeps its whole target inside the frame.
                  style={{ left: `clamp(1.5rem, ${clue.x}%, calc(100% - 1.5rem))`, top: `clamp(1.5rem, ${clue.y}%, calc(100% - 1.5rem))` }}
                  aria-label={clue.label}
                  aria-pressed={activeClueId === clue.id}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </InspectionMedia>
      </div>

      {/* Check panel: identity, controls, findings and the board entry share the remaining width. */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-700 bg-zinc-900 text-white beside:border-l beside:border-t-0 beside:overflow-y-auto">
        <div className="@container flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-5 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold leading-tight">{unit.name}</h2>
              <div className="mt-1 text-xs uppercase tracking-wider text-zinc-300">{unit.where} • {unit.limitLabel}</div>
            </div>
            <div className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
              {HANDOVER_LABELS.progress(savedCount, totalCount)}
            </div>
          </div>

          <div className="flex min-h-11 flex-wrap items-center gap-3">
            {doorPhase === 'closed' && (
              <>
                <button ref={openBtnRef} type="button" data-testid="open-fridge" onClick={handleOpen} disabled={frozen}
                  className="min-h-11 rounded-lg border-2 border-white bg-white px-5 py-2 text-base font-bold text-black shadow-lg hover:bg-zinc-200 disabled:opacity-60">
                  {HANDOVER_LABELS.openFridge}
                </button>
                <p className="text-sm text-zinc-300">{FRIDGE_INTERACTION_COPY.closedHint}</p>
              </>
            )}
            {doorPhase === 'opening' && (
              <>
                <p className="font-semibold" role="status">{FRIDGE_INTERACTION_COPY.opening}</p>
                <button type="button" onClick={finishOpening} data-testid="skip-fridge-opening" disabled={frozen}
                  className="min-h-11 rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                  {FRIDGE_INTERACTION_COPY.skipOpening}
                </button>
              </>
            )}
            {doorOpen && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-zinc-300">{HANDOVER_LABELS.inspectHint}</p>
                <p className="text-xs text-zinc-400" role="status" data-testid="inspection-status">{mediaStatus}</p>
              </div>
            )}
          </div>

          {mediaState === 'open' && activeClue && (
            <div className="rounded-lg border border-white/20 bg-black/40 px-4 py-3" data-testid="clue-finding">
              <div className="text-xs font-bold uppercase tracking-wider">{activeClue.label}</div>
              <div className="mt-1 text-sm leading-snug sm:text-base">{activeClue.finding}</div>
            </div>
          )}

          {!doorOpen ? (
            <aside className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
              <h3 className="text-xl">{FRIDGE_INTERACTION_COPY.checkHeading}</h3>
              <p className="text-sm leading-relaxed text-zinc-300">{FRIDGE_INTERACTION_COPY.checkHint}</p>
            </aside>
          ) : (
          <form onSubmit={handleFormSubmit} aria-busy={closing} className="flex w-full flex-col gap-6 border-t border-zinc-800 pt-5">
            
            <div className="grid gap-6 @2xl:grid-cols-[256px_minmax(0,1fr)] @2xl:items-start">
            {/* The fridge's own dial thermometer: misted until the reading is taken, then read by eye. */}
            <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl border border-zinc-700 bg-black p-4 shadow-inner">
               <div
                 className="relative w-full max-w-[224px]"
                 {...(row.probed ? { 'data-testid': 'probe-display' } : {})}
               >
                 <DialThermometer valueC={dialValue} limitC={unit.limitC} phase={dialPhase} focusRef={dialRef} />
                 {/* The button leaves as soon as the wipe starts so the needle can be watched settling. */}
                 {dialPhase === 'misted' && (
                    <button
                      ref={probeButtonRef}
                      type="button"
                      disabled={frozen}
                      onClick={() => {
                        if (probePending) return;
                        setProbePending(true);
                        dialRef.current?.focus({ preventScroll: true });
                        probeTimerRef.current = setTimeout(() => {
                          setProbePending(false);
                          kitchenAudio.play('probe');
                          onProbe(unitId);
                        }, 1600);
                      }}
                      className="absolute left-1/2 top-[56%] w-[84%] min-h-11 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-zinc-300 bg-white px-4 py-2.5 text-left font-bold text-black shadow-[0_6px_24px_rgba(0,0,0,0.45)] outline-none transition-transform duration-200 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-primary/50 disabled:opacity-80 motion-reduce:transition-none"
                    >
                      <span className="block leading-tight">{HANDOVER_LABELS.holdToRead}</span>
                      <span className="mt-1 block text-xs font-normal leading-snug text-zinc-600">{FRIDGE_INTERACTION_COPY.takeSubtitle}</span>
                    </button>
                 )}
               </div>
                <div className="text-center text-sm text-zinc-200" role="status">
                  {row.probed ? (
                    <>
                      <p>{FRIDGE_INTERACTION_COPY.probeReady}</p>
                      <p className="mt-1 font-semibold text-zinc-100">{FRIDGE_INTERACTION_COPY.limitReminder(unit.limitLabel)}</p>
                    </>
                  ) : (
                    <p>{probePending ? FRIDGE_INTERACTION_COPY.settling : FRIDGE_INTERACTION_COPY.noteProbePrompt}</p>
                  )}
                </div>
            </div>

            {/* Record Form Inputs */}
             <div className={cn("flex flex-col gap-5 transition-all duration-200 motion-reduce:duration-0 shrink-0", row.probed ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 pointer-events-none")}>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 p-3">
                  <p className="text-sm font-bold">{FRIDGE_INTERACTION_COPY.evidenceHeading}</p>
                  <p className="mt-1 text-xs text-zinc-300">{FRIDGE_INTERACTION_COPY.evidenceProgress(checkedClueIds.size, photo.clues.length)}</p>
                </div>
               <div className="grid grid-cols-2 gap-4 @xl:grid-cols-3">
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
               </div>
               
               {/* The notebook keeps the learner's own reading, never the hidden value. */}
               <div className="flex min-h-11 flex-wrap items-center gap-3">
                 {noted ? (
                   <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300" role="status" data-testid="notebook-written">
                     <Check className="h-4 w-4" aria-hidden="true" />
                     {HANDOVER_LABELS.inNotebook}
                   </p>
                 ) : (
                   <>
                     <button
                       type="button"
                       disabled={frozen || !row.probed || typedReading === ''}
                       onClick={() => {
                         kitchenAudio.play('write');
                         jot({
                           taskId: 'take-the-handover',
                           label: unit.name,
                           value: `${typedReading} °C`,
                           ref: { unitId: unit.id }
                         });
                         setAnnouncement(FRIDGE_INTERACTION_COPY.notebookSaved);
                       }}
                       className="flex min-h-11 items-center gap-2 rounded border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                     >
                       {HANDOVER_LABELS.writeInNotebook}
                     </button>
                     {typedReading === '' && <p className="text-xs text-zinc-400">{FRIDGE_INTERACTION_COPY.notebookHint}</p>}
                   </>
                 )}
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
          )}
        </div>
      </div>
      </div>
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </div>
  );
}
