import { useState, useRef, useEffect } from 'react';
import { PLACES } from '@/content/kitchen';
import { WASTE_BINS, HANDOVER_FIELDS, ELENA_QUESTION, WasteBin, ORDER_LINES, SHORT_LINE_ID, FRIDGE_UNITS } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { CloseUp } from '../../kitchen/close-up';
import { Clipboard, Sheet } from '../../kitchen/paper';
import { Hotspot } from '../../kitchen/hotspot';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, CheckCircle2, Check, Info } from 'lucide-react';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { CLOSE_INTERACTION } from '@/content/scenes/close-interaction';
import { ClarificationKey } from '@/lib/redesign-close';
import { weightIsRight } from '@/lib/simulation';
import { useKitchenAction } from '../../kitchen/kitchen-context';

export function PassScene({ 
  onHandover, 
  onElenaAnswer,
  dialogue 
}: { 
  onHandover: () => void;
  onElenaAnswer: (id: string) => void;
  dialogue: any;
}) {
  const { progress, updateTask, jot, advanceClock } = useProgress();
  
  const handoverState = progress.tasks['take-the-handover'];
  const deliveryState = progress.tasks['check-the-delivery-in'];
  const chillState = progress.tasks['chill-the-event-batch'];
  const dietaryState = progress.tasks['check-the-dietary-list'];
  const state = progress.tasks['hand-the-kitchen-on'];
  
  const [activeCloseUp, setActiveCloseUp] = useState<'waste' | 'clipboard' | 'chill' | null>(null);
  useKitchenAction('close.open-waste', () => setActiveCloseUp('waste'));
  useKitchenAction('close.open-clipboard', () => setActiveCloseUp('clipboard'));
  useKitchenAction('close.open-elena', () => setActiveCloseUp('chill'));

  const rs: NonNullable<typeof state.redesign> = state.redesign || { 
    version: 1 as const, 
    wasteFocus: '', 
    wasteReason: '', 
    priorities: {}, 
    clarifications: {}, 
    recipientConfirmed: false 
  };

  const updateRedesign = (changes: any) => {
    const revisedEvidence = 'priorities' in changes || 'responsibilities' in changes || 'wasteFocus' in changes || 'wasteReason' in changes;
    if (revisedEvidence) setExchangeStep(0);
    updateTask('hand-the-kitchen-on', prev => ({
      ...prev,
      ...(revisedEvidence ? { handedOver: false, elenaSigned: false } : {}),
      redesign: {
        ...(prev.redesign || { version: 1 as const, wasteFocus: '', wasteReason: '', priorities: {}, clarifications: {}, recipientConfirmed: false }),
        ...changes,
        ...(revisedEvidence ? { recipientConfirmed: false, clarifications: {} } : {}),
      }
    }));
  };

  // Waste Station State
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [displayWeight, setDisplayWeight] = useState<number | null>(null);
  const [scaleSettled, setScaleSettled] = useState(false);
  const weightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localWasteFocus, setLocalWasteFocus] = useState<string>(rs.wasteFocus);
  const [localWasteReason, setLocalWasteReason] = useState<string>(rs.wasteReason);
  const [editingWaste, setEditingWaste] = useState(!rs.wasteFocus);

  // Handover Clipboard State
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [exchangeStep, setExchangeStep] = useState(0); 
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const exchangeHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    return () => { if (weightTimer.current) clearInterval(weightTimer.current); };
  }, []);

  const handleSelectBin = (bin: WasteBin) => {
    setSelectedBin(bin.id);
    setDisplayWeight(0);
    setScaleSettled(false);
    if (weightTimer.current) clearInterval(weightTimer.current);
    kitchenAudio.play('scale');
    
    let w = 0;
    const interval = setInterval(() => {
      w += bin.actualKg / 15;
      if (w >= bin.actualKg) {
        w = bin.actualKg;
        clearInterval(interval);
        setScaleSettled(true);
      }
      setDisplayWeight(w);
    }, 40);
    weightTimer.current = interval;
  };

  const handleWeighConfirm = (binId: string) => {
    const bin = WASTE_BINS.find(b => b.id === binId)!;
    kitchenAudio.play('write');
    jot({
      taskId: 'hand-the-kitchen-on',
      label: bin.label,
      value: `${bin.actualKg.toFixed(2)} kg`,
      ref: { binId },
    });
    updateTask('hand-the-kitchen-on', prev => ({ ...prev, weighed: { ...prev.weighed, [binId]: true } }));
    advanceClock(1);
  };

  const handleWeightInput = (binId: string, value: string) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      weights: { ...prev.weights, [binId]: value }
    }));
  };

  const handleHandoverInput = (fieldId: string, value: string) => {
    setExchangeStep(0);
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      handover: { ...prev.handover, [fieldId]: value },
      handedOver: false,
      elenaSigned: false,
      redesign: prev.redesign ? { ...prev.redesign, recipientConfirmed: false, clarifications: {} } : prev.redesign,
    }));
  };

  const weightsDone = WASTE_BINS.every(b => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? ''));
  const interpreted = !!(rs.wasteFocus && rs.wasteReason);
  const elenaCorrect = state.elenaAnswer && ELENA_QUESTION.options.find(o => o.id === state.elenaAnswer)?.correct;
  
  const handleWasteLog = () => {
    if (!localWasteFocus || !localWasteReason.trim()) return;
    kitchenAudio.play('confirm');
    updateRedesign({ wasteFocus: localWasteFocus, wasteReason: localWasteReason.trim() });
    setEditingWaste(false);
  };

  const startExchange = () => {
    // Check if priorities are set
    const allPrioritiesSet = CLOSE_SCENE.priorities.every(p => rs.priorities[p.id] && rs.responsibilities?.[p.id]?.trim());
    if (!allPrioritiesSet) {
      setExchangeError("Choose the timing and name who will act on each follow-up.");
      setShowFieldErrors(true);
      return;
    }
    if (!HANDOVER_FIELDS.every(field => state.handover[field.id]?.trim())) {
      setExchangeError("Write something useful under each handover heading first.");
      setShowFieldErrors(true);
      return;
    }
    setExchangeError(null);
    setShowFieldErrors(false);
    setExchangeStep(1);
    kitchenAudio.play('page');
  };

  useEffect(() => {
    if (exchangeStep > 0) exchangeHeadingRef.current?.focus();
  }, [exchangeStep]);

  const handleClarification = (key: ClarificationKey, optionId: string) => {
    let correctId = '';
    if (key === ClarificationKey.Salmon) correctId = 'tomorrow';
    else if (key === ClarificationKey.Fridge) correctId = 'todo';
    else if (key === ClarificationKey.Dietary) correctId = 'pear';

    if (optionId !== correctId) {
      kitchenAudio.play('wrong');
      setExchangeError("That's not quite right. Check the day's records.");
      return;
    }
    
    kitchenAudio.play('confirm');
    setExchangeError(null);
    updateRedesign({
      clarifications: {
        ...rs.clarifications,
        [key]: optionId
      }
    });

    if (key === ClarificationKey.Salmon) setExchangeStep(2);
    else if (key === ClarificationKey.Fridge) setExchangeStep(3);
    else if (key === ClarificationKey.Dietary) {
      setExchangeStep(4);
      updateRedesign({ recipientConfirmed: true });
      onHandover();
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <img src={PLACES['pass'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover object-[55%_50%]" decoding="async" />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Hotspots */}
      <Hotspot
        x={35} y={60}
        label={CLOSE_SCENE.wasteBins}
        state={interpreted ? 'done' : 'active'}
        onClick={() => setActiveCloseUp('waste')}
      />

      <Hotspot
        x={16} y={42}
        label={CLOSE_SCENE.clipboard}
        state={rs.recipientConfirmed ? 'done' : (interpreted ? 'active' : 'todo')}
        onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('clipboard'); }}
      />

      {rs.recipientConfirmed && (
        <>
          <Hotspot
            x={30} y={74}
            label={CLOSE_SCENE.elena}
            state={(state.elenaSigned && elenaCorrect) ? 'done' : 'active'}
            onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('chill'); }}
          />
        </>
      )}

      {/* CloseUps */}
      <CloseUp isOpen={activeCloseUp === 'waste'} onClose={() => setActiveCloseUp(null)} title="Waste bins and scales" className="bg-zinc-950">
        <div className="p-4 md:p-8 max-w-6xl mx-auto h-[90vh] flex flex-col items-center justify-start overflow-y-auto">
           <div className="w-full mb-6 mt-2">
             <h2 className="text-2xl font-bold text-zinc-100">{CLOSE_INTERACTION.waste.title}</h2>
             <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{CLOSE_INTERACTION.waste.instructions}</p>
           </div>
           
           <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
             {/* Left: Scales & Bins */}
             <div className="flex-1 w-full bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl flex flex-col items-center">
                <div
                  className="w-full max-w-72 h-24 bg-black rounded-lg border-4 border-zinc-700 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-3 relative overflow-hidden"
                  role="status"
                  aria-live="polite"
                  aria-label={selectedBin ? (scaleSettled ? `${CLOSE_INTERACTION.waste.scaleLabel}: ${displayWeight?.toFixed(2)} kilograms. ${CLOSE_INTERACTION.waste.settled}` : CLOSE_INTERACTION.waste.settling) : CLOSE_INTERACTION.waste.notWeighed}
                >
                 <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-white/5 pointer-events-none"></div>
                 <span className="font-mono text-5xl text-red-500 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                   {displayWeight !== null ? displayWeight.toFixed(2) : "0.00"}
                 </span>
                 <span className="font-mono text-xl text-red-500/80 ml-2 mt-4">kg</span>
               </div>
                <p className="mb-6 min-h-5 text-center text-xs text-zinc-300">
                  {selectedBin ? (scaleSettled ? CLOSE_INTERACTION.waste.settled : CLOSE_INTERACTION.waste.settling) : 'Choose a bin to place it on the scales.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full" role="group" aria-label="Waste bins">
                 {WASTE_BINS.map(bin => {
                   const isSelected = selectedBin === bin.id;
                   const isWeighed = state.weighed[bin.id];
                   return (
                     <button 
                       key={bin.id}
                       onClick={() => handleSelectBin(bin)}
                       className={cn(
                          "min-h-24 rounded-xl shadow-xl border-2 flex flex-col items-center justify-center text-zinc-100 text-center p-4 motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                          isSelected ? "bg-zinc-800 border-primary sm:scale-[1.02]" : "bg-black border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800"
                       )}
                        aria-pressed={isSelected}
                        aria-label={`Weigh ${bin.label}. ${isWeighed ? CLOSE_INTERACTION.waste.weighed : CLOSE_INTERACTION.waste.notWeighed}`}
                     >
                       <div className="font-bold mb-1">{bin.label}</div>
                       <div className="text-[10px] text-zinc-400">From: {bin.whereFrom}</div>
                        {isWeighed && <div className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1"><Check className="w-3 h-3" aria-hidden="true"/> {CLOSE_INTERACTION.waste.weighed}</div>}
                     </button>
                   );
                 })}
               </div>

               <div className="h-16 mt-6 w-full flex justify-center">
                  {selectedBin && scaleSettled && !state.weighed[selectedBin] && (
                    <button 
                      onClick={() => handleWeighConfirm(selectedBin)}
                       className="min-h-11 bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:bg-zinc-200 motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200 flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Write this reading down
                    </button>
                 )}
               </div>
             </div>

             {/* Right: Record & Interpretation */}
             <div className="w-full lg:w-[400px] shrink-0 bg-white border border-zinc-300 rounded-xl shadow-xl flex flex-col overflow-hidden">
               <div className="bg-zinc-100 border-b border-zinc-300 p-4">
                 <h3 className="font-bold uppercase tracking-widest text-sm text-zinc-800">Morning Waste Record</h3>
               </div>
               
               <div className="p-6 flex flex-col gap-6">
                 {WASTE_BINS.map(bin => {
                    const isRight = weightIsRight(bin.id, state.weights[bin.id]);
                     const value = state.weights[bin.id] || '';
                     const feedbackId = `waste-${bin.id}-feedback`;
                     const inputId = `waste-${bin.id}-weight`;
                     return (
                       <div key={bin.id} className="border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                         <label htmlFor={inputId} className="text-sm font-bold text-zinc-700">{bin.label}</label>
                         <p className="mt-1 text-xs leading-5 text-zinc-500">{bin.description}</p>
                         <div className="mt-2 flex items-center gap-2">
                          <Input
                             id={inputId}
                             inputMode="decimal"
                             value={value}
                            onChange={e => handleWeightInput(bin.id, e.target.value)}
                             placeholder="Weight"
                            disabled={!state.weighed[bin.id]}
                             aria-describedby={feedbackId}
                             aria-invalid={state.weighed[bin.id] && !!value && !isRight}
                             className={cn("w-28 text-center font-mono bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-1 min-h-11 focus-visible:ring-2", isRight ? "border-emerald-500 text-emerald-700" : "border-zinc-300")}
                          />
                          <span className="text-xs text-zinc-500 font-mono">kg</span>
                        </div>
                         <p id={feedbackId} className={cn("mt-1 min-h-5 text-xs", isRight ? "text-emerald-700" : "text-zinc-600")} aria-live="polite">
                           {!state.weighed[bin.id] ? CLOSE_INTERACTION.waste.notWeighed : !value ? 'Write the reading shown on the scales.' : isRight ? CLOSE_INTERACTION.waste.correct : CLOSE_INTERACTION.waste.incorrect}
                         </p>
                      </div>
                    );
                 })}
               </div>

               {weightsDone && (!interpreted || editingWaste) && (
                  <div className="p-6 bg-zinc-50 border-t border-zinc-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200">
                    <h4 className="font-bold text-sm mb-3">Choose a follow-up</h4>
                    <p className="text-xs leading-5 text-zinc-600 mb-4">{CLOSE_INTERACTION.waste.followUpQuestion}</p>
                   
                   <div className="space-y-3 mb-4">
                     {CLOSE_SCENE.wasteOptions.map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setLocalWasteFocus(opt.id)}
                          className={cn("w-full min-h-11 text-left p-3 rounded border motion-safe:transition-colors motion-safe:duration-200 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black", localWasteFocus === opt.id ? "bg-primary text-white border-primary" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100")}
                          aria-pressed={localWasteFocus === opt.id}
                       >
                         {opt.label}
                       </button>
                     ))}
                   </div>
                   
                   {localWasteFocus && (
                      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 space-y-3">
                        <label htmlFor="waste-follow-up-reason" className="text-xs text-zinc-600 font-bold">{CLOSE_INTERACTION.waste.reasonLabel}</label>
                       <Textarea 
                          id="waste-follow-up-reason"
                         value={localWasteReason}
                         onChange={e => setLocalWasteReason(e.target.value)}
                          placeholder="What would you find out before acting?"
                         className="text-xs min-h-[80px]"
                       />
                       <button
                         onClick={handleWasteLog}
                         disabled={!localWasteReason.trim()}
                          className="w-full min-h-11 bg-black text-white py-2 rounded font-bold text-xs disabled:opacity-50"
                       >
                          Save follow-up
                       </button>
                     </div>
                   )}
                 </div>
               )}

                {interpreted && !editingWaste && (
                 <div className="p-6 bg-emerald-50 border-t border-emerald-200 flex flex-col items-center justify-center text-center">
                   <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <div className="font-bold text-emerald-800 text-sm mb-1">Follow-up saved</div>
                    <div className="text-xs leading-5 text-emerald-800">This is a proposed action, not a completed check.</div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => setEditingWaste(true)} className="min-h-11 rounded border border-emerald-700 px-4 py-2 text-xs font-bold text-emerald-900">Revise follow-up</button>
                      <button type="button" onClick={() => { setActiveCloseUp('clipboard'); kitchenAudio.play('page'); }} className="min-h-11 rounded bg-black px-4 py-2 text-xs font-bold text-white">Write the handover</button>
                    </div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'clipboard'} onClose={() => setActiveCloseUp(null)} title="Handover prep" className="bg-zinc-950">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[90vh] overflow-y-auto lg:overflow-hidden p-4 lg:p-6">
          
          {/* Left Column: Read-only evidence */}
           <div className="w-full lg:w-80 shrink-0 bg-zinc-900 border border-zinc-700 p-5 rounded-xl text-zinc-100 lg:overflow-y-auto shadow-2xl flex flex-col gap-6">
             <div>
               <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                  <Info className="w-4 h-4" aria-hidden="true" /> {CLOSE_INTERACTION.evidence.title}
               </h3>
               <p className="mt-2 text-xs leading-5 text-zinc-400">{CLOSE_INTERACTION.handover.instructions}</p>
             </div>
             <div className="grid gap-2 text-xs" aria-label="Evidence key">
               <p><strong className="text-zinc-100">{CLOSE_INTERACTION.evidence.saved}:</strong> {CLOSE_INTERACTION.evidence.savedHelp}</p>
               <p><strong className="text-zinc-100">{CLOSE_INTERACTION.evidence.supplied}:</strong> {CLOSE_INTERACTION.evidence.suppliedHelp}</p>
               <p><strong className="text-primary">{CLOSE_INTERACTION.evidence.proposed}:</strong> {CLOSE_INTERACTION.evidence.proposedHelp}</p>
             </div>
            <div className="space-y-4">
              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                 <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{CLOSE_INTERACTION.evidence.saved} · Fridges</div>
                <div className="text-xs text-zinc-300">
                  Larder 2 read {handoverState.rows['larder-2']?.reading || '?'}°C. 
                  {handoverState.rows['larder-2']?.note ? ` Note: ${handoverState.rows['larder-2'].note}` : ''}
                </div>
              </div>
              
              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                 <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{CLOSE_INTERACTION.evidence.saved} · Deliveries</div>
                <div className="text-xs text-zinc-300">
                  Salmon short ({deliveryState.lines[SHORT_LINE_ID]?.arrived || '0'} arrived, 12 ordered). 
                  Supplier note amended. Status: {deliveryState.lines[SHORT_LINE_ID]?.status}.
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                 <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{CLOSE_INTERACTION.evidence.saved} · Prep</div>
                <div className="text-xs text-zinc-300">
                  Beef shin: {chillState.trays.filter(t => t > 0).length} trays. 
                  Last reading: {chillState.readings[120]?.value || chillState.readings[90]?.value || '?'}°C.
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                 <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{CLOSE_INTERACTION.evidence.saved} · Dietary</div>
                <div className="text-xs text-zinc-300">
                  {dietaryState.boardPosted ? `Board note: ${dietaryState.boardNote}` : 'Board not yet posted.'}
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800 border-l-4 border-l-primary">
                 <div className="text-[10px] text-primary uppercase font-bold mb-1">{CLOSE_INTERACTION.evidence.proposed}</div>
                <div className="text-xs text-zinc-300">
                  Focus: {CLOSE_SCENE.wasteOptions.find(o => o.id === rs.wasteFocus)?.label || 'None'}.<br/>
                  Reason: {rs.wasteReason}
                </div>
              </div>
            </div>
            
            <div className="border-t border-zinc-800 pt-6">
               <h3 className="font-bold text-xs text-zinc-300 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> Questions to consider
              </h3>
              {focusedField ? (
                 <ul className="list-disc space-y-2 pl-5 text-xs leading-5 text-zinc-300">
                   {HANDOVER_FIELDS.find(f => f.id === focusedField)?.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
                 </ul>
              ) : (
                 <p className="text-xs text-zinc-400">Move to a handover field to see questions that help you check your own wording.</p>
              )}
            </div>
          </div>

          {/* Right Column: Handover Sheet & Priorities */}
           <div className="flex-1 lg:overflow-y-auto lg:pr-2 pb-12 flex flex-col gap-6">
            <Clipboard>
              <div className="p-6 md:p-10 text-zinc-900 flex flex-col h-full min-h-[600px]">
                <div className="border-b-2 border-zinc-800 pb-3 mb-6 flex justify-between items-end gap-2 bg-zinc-100/50 -mx-6 md:-mx-10 px-6 md:px-10 pt-4">
                  <h2 className="font-bold text-lg uppercase tracking-widest font-sans">Kitchen Handover</h2>
                  <div className="text-xs font-mono text-zinc-500 font-bold bg-zinc-200 px-2 py-1 rounded">SHIFT: 15:00 - CLOSE</div>
                </div>
                
                 <p className="mb-6 text-sm leading-6 text-zinc-700">{CLOSE_INTERACTION.handover.instructions}</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-6">
                    {HANDOVER_FIELDS.slice(0, 2).map(field => (
                      <div key={field.id} className="space-y-2 group">
                         <label htmlFor={`handover-${field.id}`} className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary motion-safe:transition-colors">{field.label}</label>
                        <Textarea
                           id={`handover-${field.id}`}
                          value={state.handover[field.id] || ''}
                          onChange={e => handleHandoverInput(field.id, e.target.value)}
                          onFocus={() => setFocusedField(field.id)}
                           placeholder="Write this in your own words"
                           aria-invalid={showFieldErrors && !state.handover[field.id]?.trim()}
                           aria-describedby={showFieldErrors && !state.handover[field.id]?.trim() ? `handover-${field.id}-error` : undefined}
                          className="kitchen-input min-h-[80px] resize-none text-sm border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                        />
                         {showFieldErrors && !state.handover[field.id]?.trim() && <p id={`handover-${field.id}-error`} className="text-xs font-bold text-red-700">{CLOSE_INTERACTION.handover.fieldError}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {HANDOVER_FIELDS.slice(2, 4).map(field => (
                      <div key={field.id} className="space-y-2 group">
                         <label htmlFor={`handover-${field.id}`} className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary motion-safe:transition-colors">{field.label}</label>
                        <Textarea
                           id={`handover-${field.id}`}
                          value={state.handover[field.id] || ''}
                          onChange={e => handleHandoverInput(field.id, e.target.value)}
                          onFocus={() => setFocusedField(field.id)}
                           placeholder="Write this in your own words"
                           aria-invalid={showFieldErrors && !state.handover[field.id]?.trim()}
                           aria-describedby={showFieldErrors && !state.handover[field.id]?.trim() ? `handover-${field.id}-error` : undefined}
                          className="kitchen-input min-h-[80px] resize-none text-sm border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                        />
                         {showFieldErrors && !state.handover[field.id]?.trim() && <p id={`handover-${field.id}-error`} className="text-xs font-bold text-red-700">{CLOSE_INTERACTION.handover.fieldError}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t-2 border-zinc-800 pt-6">
                   <h3 className="font-bold text-sm text-zinc-800">Prioritise the pending actions</h3>
                   <p className="mb-4 mt-2 text-xs leading-5 text-zinc-600">{CLOSE_INTERACTION.handover.prioritiesHelp}</p>
                  <div className="space-y-3">
                    {CLOSE_SCENE.priorities.map(p => (
                       <fieldset key={p.id} className="flex flex-col gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                         <legend className="px-1 text-sm font-bold text-zinc-700">{p.label}</legend>
                         <span className="text-xs font-bold text-amber-800">{CLOSE_INTERACTION.handover.pending}</span>
                         <div className="grid grid-cols-2 gap-2" role="group" aria-label={`Timing for ${p.label}`}>
                          <button
                             type="button"
                            onClick={() => updateRedesign({ priorities: { ...rs.priorities, [p.id]: 'before-service' } })}
                             aria-pressed={rs.priorities[p.id] === 'before-service'}
                             className={cn("min-h-11 px-3 py-2 text-xs font-bold rounded motion-safe:transition-colors motion-safe:duration-200", rs.priorities[p.id] === 'before-service' ? "bg-black text-white" : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100")}
                          >
                             Before service
                          </button>
                          <button
                             type="button"
                            onClick={() => updateRedesign({ priorities: { ...rs.priorities, [p.id]: 'later' } })}
                             aria-pressed={rs.priorities[p.id] === 'later'}
                             className={cn("min-h-11 px-3 py-2 text-xs font-bold rounded motion-safe:transition-colors motion-safe:duration-200", rs.priorities[p.id] === 'later' ? "bg-black text-white" : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100")}
                          >
                             Later
                          </button>
                        </div>
                         <label htmlFor={`responsibility-${p.id}`} className="text-xs text-zinc-600">
                           Person or role responsible
                          <Input
                             id={`responsibility-${p.id}`}
                            className="mt-1 bg-white"
                            aria-label={`Person responsible for ${p.label}`}
                            data-testid={`responsibility-${p.id}`}
                            value={rs.responsibilities?.[p.id] ?? ''}
                            onChange={event => updateRedesign({ responsibilities: { ...rs.responsibilities, [p.id]: event.target.value } })}
                            placeholder="Name or role"
                          />
                        </label>
                         {rs.priorities[p.id] && (
                           <p className="text-xs text-zinc-600" role="status">
                             {(CLOSE_INTERACTION.handover.priorityFeedback as Record<string, Record<string, string>>)[p.id]?.[rs.priorities[p.id]]} The action is still pending.
                           </p>
                         )}
                       </fieldset>
                    ))}
                  </div>
                  {exchangeError && (
                     <div className="mt-4 text-red-700 font-bold text-sm" role="alert">
                      {exchangeError}
                    </div>
                  )}
                  
                  {exchangeStep === 0 && !rs.recipientConfirmed && (
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={startExchange}
                       className="min-h-11 bg-black text-white font-bold px-8 py-3 rounded hover:bg-zinc-800 motion-safe:transition-colors text-sm"
                      >
                        Hand over to evening team
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Clipboard>

            {/* Evening Team Conversation Panel */}
            {exchangeStep > 0 && !rs.recipientConfirmed && (
              <section className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-6 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200" aria-labelledby="evening-exchange-title">
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400">ET</div>
                  <div>
                    <h3 id="evening-exchange-title" ref={exchangeHeadingRef} tabIndex={-1} className="font-bold text-zinc-100 text-lg focus:outline-none">{CLOSE_INTERACTION.handover.exchangeTitle}</h3>
                    <div className="text-xs text-zinc-400">{CLOSE_INTERACTION.handover.exchangeHelp}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {exchangeStep >= 1 && (
                    <div className="bg-black/50 p-4 rounded-lg border border-zinc-800">
                      <p className="text-sm text-zinc-300 mb-4">"{CLOSE_SCENE.clarifications.salmon.question}"</p>
                      {!rs.clarifications[ClarificationKey.Salmon] ? (
                        <div className="flex gap-2 flex-wrap">
                          {CLOSE_SCENE.clarifications.salmon.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleClarification(ClarificationKey.Salmon, opt.id)}
                               className="min-h-11 px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-200 motion-safe:transition-colors motion-safe:duration-200"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                         <div className="text-sm text-primary font-bold" role="status">
                           Answer saved: {CLOSE_SCENE.clarifications.salmon.options.find(o => o.id === rs.clarifications[ClarificationKey.Salmon])?.label}. The delivery remains pending.
                        </div>
                      )}
                    </div>
                  )}

                  {exchangeStep >= 2 && (
                     <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                      <p className="text-sm text-zinc-300 mb-4">"{CLOSE_SCENE.clarifications.fridge.question}"</p>
                      {!rs.clarifications[ClarificationKey.Fridge] ? (
                        <div className="flex gap-2 flex-wrap">
                          {CLOSE_SCENE.clarifications.fridge.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleClarification(ClarificationKey.Fridge, opt.id)}
                               className="min-h-11 px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-200 motion-safe:transition-colors motion-safe:duration-200"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                         <div className="text-sm text-primary font-bold" role="status">
                           Answer saved: {CLOSE_SCENE.clarifications.fridge.options.find(o => o.id === rs.clarifications[ClarificationKey.Fridge])?.label}. The check remains pending.
                        </div>
                      )}
                    </div>
                  )}

                  {exchangeStep >= 3 && (
                     <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                      <p className="text-sm text-zinc-300 mb-4">"{CLOSE_SCENE.clarifications.dietary.question}"</p>
                      {!rs.clarifications[ClarificationKey.Dietary] ? (
                        <div className="flex gap-2 flex-wrap">
                          {CLOSE_SCENE.clarifications.dietary.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleClarification(ClarificationKey.Dietary, opt.id)}
                               className="min-h-11 px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-200 motion-safe:transition-colors motion-safe:duration-200"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                         <div className="text-sm text-primary font-bold" role="status">
                           Answer saved: {CLOSE_SCENE.clarifications.dietary.options.find(o => o.id === rs.clarifications[ClarificationKey.Dietary])?.label}. Preparation and service checks remain pending.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
            
            {rs.recipientConfirmed && (
               <div className="bg-emerald-950/40 border border-emerald-500/30 p-6 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200" role="status">
                 <div>
                    <div className="text-emerald-200 font-bold text-lg mb-1">{CLOSE_INTERACTION.handover.acceptedTitle}</div>
                    <div className="text-emerald-200/90 text-sm leading-6">{CLOSE_INTERACTION.handover.acceptedBody}</div>
                 </div>
                  <button type="button" onClick={() => setActiveCloseUp('chill')} className="min-h-11 shrink-0 rounded bg-white px-4 py-2 text-sm font-bold text-black">Review with Terence</button>
               </div>
            )}

          </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'chill'} onClose={() => setActiveCloseUp(null)} title="Terence, at the pass" className="bg-zinc-950">
        <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto h-[85vh] overflow-y-auto md:overflow-hidden p-4 lg:p-6">
          {/* Left: Chill Record Sheet */}
           <div className="flex-1 md:overflow-y-auto pb-8">
            <Sheet>
              <div className="p-8 font-sans text-zinc-900">
                <div className="border-b-4 border-zinc-900 pb-4 mb-8">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-center">Chill Record</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-10 text-sm bg-zinc-50 p-5 rounded border border-zinc-200">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest mt-1">Product</span>
                    <span className="font-bold text-base">Braised Beef Shin</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest mt-1">Date</span>
                    <span className="font-bold text-base">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest mt-1">Batch Size</span>
                    <span className="font-bold text-base">{chillState.trays.reduce((a,b)=>a+b,0).toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest mt-1">Trays</span>
                    <span className="font-bold text-base">{chillState.trays.filter(t=>t>0).length}</span>
                  </div>
                </div>

                <div className="mb-6 flex gap-4">
                  <div className="flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Your Record</h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-zinc-900">
                          <th className="py-2 px-3 font-bold uppercase tracking-widest text-[10px]">Time</th>
                          <th className="py-2 px-3 font-bold uppercase tracking-widest text-[10px]">Temp °C</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(chillState.readings).map(([mins, reading]) => (
                          <tr key={mins} className="border-b border-zinc-200 even:bg-zinc-50/50">
                            <td className="py-3 px-3 font-mono text-sm text-zinc-600">{reading.time}</td>
                            <td className="py-3 px-3 font-mono text-lg" style={{ fontFamily: 'cursive' }}>{reading.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex-1 bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Reference Scenario</h3>
                    <table className="w-full text-left border-collapse opacity-70">
                      <thead>
                        <tr className="border-b border-zinc-400">
                          <th className="py-2 px-3 font-bold uppercase tracking-widest text-[10px]">Time</th>
                          <th className="py-2 px-3 font-bold uppercase tracking-widest text-[10px]">Temp °C</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-200"><td className="py-2 px-3 font-mono text-xs text-zinc-500">10:45</td><td className="py-2 px-3 font-mono text-sm text-zinc-600">73.8</td></tr>
                        <tr className="border-b border-zinc-200"><td className="py-2 px-3 font-mono text-xs text-zinc-500">11:15</td><td className="py-2 px-3 font-mono text-sm text-zinc-600">36.1</td></tr>
                        <tr className="border-b border-zinc-200"><td className="py-2 px-3 font-mono text-xs text-zinc-500">11:45</td><td className="py-2 px-3 font-mono text-sm text-zinc-600">14.6</td></tr>
                        <tr className="border-b border-zinc-200"><td className="py-2 px-3 font-mono text-xs text-zinc-500">12:15</td><td className="py-2 px-3 font-mono text-sm text-zinc-600">6.4</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-zinc-900">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">Prepared By</div>
                    <div className="font-mono text-2xl text-zinc-800" style={{ fontFamily: 'cursive' }}>{progress.initials || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">Checked By (Exec Chef)</div>
                    {state.elenaSigned && elenaCorrect ? (
                      <div className="font-serif italic text-3xl text-zinc-900 border-b-2 border-zinc-900 pb-1 pr-8">Terence</div>
                    ) : (
                      <div className="w-48 border-b-2 border-zinc-400 border-dashed h-8 flex items-end">
                        {state.elenaSigned && !elenaCorrect && <span className="text-xs text-red-500 ml-2 mb-1">Answer question first</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Sheet>
          </div>

          {/* Right: Terence's question */}
          <div className="w-full md:w-[400px] shrink-0 bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl flex flex-col text-zinc-100 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
              <div>
                <div className="font-bold text-lg">Terence</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">Executive sous chef and mentor</div>
              </div>
            </div>
             <h2 className="text-xl font-bold">{CLOSE_INTERACTION.review.title}</h2>
             <p className="mt-2 mb-6 text-sm leading-6 text-zinc-300">{CLOSE_INTERACTION.review.instructions}</p>

             <p className="text-sm leading-relaxed mb-8 text-zinc-200 border-l-2 border-zinc-700 pl-4 py-1">
              "{ELENA_QUESTION.question}"
            </p>

            <div className="space-y-3 flex-1">
              {ELENA_QUESTION.options.map(opt => {
                const isSelected = state.elenaAnswer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onElenaAnswer(opt.id)}
                    disabled={!!elenaCorrect}
                    className={cn(
                     "w-full min-h-11 text-left p-4 rounded-lg border motion-safe:transition-[background-color,border-color,color] motion-safe:duration-200 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      isSelected 
                        ? (opt.correct ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-red-950/40 border-red-500/50 text-red-100")
                        : "bg-black/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {state.elenaAnswer && (
               <div className={cn("p-4 mt-6 rounded-lg border text-sm leading-relaxed motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200", elenaCorrect ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" : "bg-red-950/40 border-red-500/30 text-red-200")} role={elenaCorrect ? "status" : "alert"}>
                <strong className="block mb-1 opacity-70 text-[10px] uppercase tracking-widest">Terence</strong>
                {ELENA_QUESTION.options.find(o=>o.id===state.elenaAnswer)?.response}
              </div>
            )}

            {elenaCorrect && !state.elenaSigned && (
               <div className="mt-8 pt-6 border-t border-zinc-800 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200">
                 <button 
                   onClick={() => {
                     kitchenAudio.play('write');
                     updateTask('hand-the-kitchen-on', prev => ({ ...prev, elenaSigned: true }));
                   }}
                    className="w-full min-h-11 bg-white text-black font-bold py-4 rounded-lg shadow-xl hover:bg-zinc-200 motion-safe:transition-colors motion-safe:duration-200 text-sm"
                 >
                    Terence signs the record
                 </button>
              </div>
            )}
          </div>
        </div>
      </CloseUp>
    </div>
  );
}
