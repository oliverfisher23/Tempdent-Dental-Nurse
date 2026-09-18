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
import { BookOpen, PenTool, CheckCircle2, ChevronRight, Check, Info } from 'lucide-react';
import { CLOSE_SCENE } from '@/content/scenes/close';
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
  const weightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localWasteFocus, setLocalWasteFocus] = useState<string>('');
  const [localWasteReason, setLocalWasteReason] = useState<string>('');

  // Handover Clipboard State
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [exchangeStep, setExchangeStep] = useState(0); 
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (weightTimer.current) clearInterval(weightTimer.current); };
  }, []);

  const handleSelectBin = (bin: WasteBin) => {
    setSelectedBin(bin.id);
    setDisplayWeight(0);
    if (weightTimer.current) clearInterval(weightTimer.current);
    kitchenAudio.play('scale');
    
    let w = 0;
    const interval = setInterval(() => {
      w += bin.actualKg / 15;
      if (w >= bin.actualKg) {
        w = bin.actualKg;
        clearInterval(interval);
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

  const handleInsertPrompt = (text: string) => {
    kitchenAudio.play('write');
    const target = focusedField || 'prepared';
    updateTask('hand-the-kitchen-on', prev => {
      const current = prev.handover[target] || '';
      const separator = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
      return {
        ...prev,
        handover: { ...prev.handover, [target]: current + separator + "• " + text }
      };
    });
  };

  const allWeighed = WASTE_BINS.every(b => state.weighed[b.id]);
  const weightsDone = WASTE_BINS.every(b => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? ''));
  const interpreted = !!(rs.wasteFocus && rs.wasteReason);
  const elenaCorrect = state.elenaAnswer && ELENA_QUESTION.options.find(o => o.id === state.elenaAnswer)?.correct;
  
  const handleWasteLog = () => {
    if (!localWasteFocus || !localWasteReason.trim()) return;
    kitchenAudio.play('confirm');
    updateRedesign({ wasteFocus: localWasteFocus, wasteReason: localWasteReason.trim() });
  };

  const startExchange = () => {
    // Check if priorities are set
    const allPrioritiesSet = CLOSE_SCENE.priorities.every(p => rs.priorities[p.id] && rs.responsibilities?.[p.id]?.trim());
    if (!allPrioritiesSet) {
      setExchangeError("Choose the timing and name who will act on each follow-up.");
      return;
    }
    if (!HANDOVER_FIELDS.every(field => state.handover[field.id]?.trim())) {
      setExchangeError("Write something useful under each handover heading first.");
      return;
    }
    setExchangeError(null);
    setExchangeStep(1);
    kitchenAudio.play('page');
  };

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
      <img src={PLACES['pass'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover" decoding="async" />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Hotspots */}
      <Hotspot
        x={35} y={60}
        label={CLOSE_SCENE.wasteBins}
        state={interpreted ? 'done' : 'active'}
        onClick={() => setActiveCloseUp('waste')}
      />

      <Hotspot
        x={65} y={60}
        label={CLOSE_SCENE.clipboard}
        state={rs.recipientConfirmed ? 'done' : (interpreted ? 'active' : 'todo')}
        onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('clipboard'); }}
      />

      {rs.recipientConfirmed && (
        <>
          <Hotspot
            x={75} y={45}
            label={CLOSE_SCENE.elena}
            state={(state.elenaSigned && elenaCorrect) ? 'done' : 'active'}
            onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('chill'); }}
          />
        </>
      )}

      {/* CloseUps */}
      <CloseUp isOpen={activeCloseUp === 'waste'} onClose={() => setActiveCloseUp(null)} title="Waste bins and scales" className="bg-zinc-950">
        <div className="p-4 md:p-8 max-w-6xl mx-auto h-[90vh] flex flex-col items-center justify-start overflow-y-auto">
           <h2 className="text-2xl font-bold text-zinc-100 mb-8 tracking-widest uppercase mt-4">Inspect and Weigh</h2>
           
           <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
             {/* Left: Scales & Bins */}
             <div className="flex-1 w-full bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl flex flex-col items-center">
               <div className="w-64 h-24 bg-black rounded-lg border-4 border-zinc-700 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-8 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-white/5 pointer-events-none"></div>
                 <span className="font-mono text-5xl text-red-500 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                   {displayWeight !== null ? displayWeight.toFixed(2) : "0.00"}
                 </span>
                 <span className="font-mono text-xl text-red-500/80 ml-2 mt-4">kg</span>
               </div>

               <div className="flex flex-wrap justify-center gap-4 w-full">
                 {WASTE_BINS.map(bin => {
                   const isSelected = selectedBin === bin.id;
                   const isWeighed = state.weighed[bin.id];
                   return (
                     <button 
                       key={bin.id}
                       onClick={() => handleSelectBin(bin)}
                       className={cn(
                         "flex-1 min-w-[120px] rounded-xl shadow-xl border-2 flex flex-col items-center justify-center text-zinc-100 text-center p-4 transition-all relative overflow-hidden",
                         isSelected ? "bg-zinc-800 border-primary scale-105" : "bg-black border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800"
                       )}
                     >
                       <div className="font-bold mb-1">{bin.label}</div>
                       <div className="text-[10px] text-zinc-400">From: {bin.whereFrom}</div>
                       {isWeighed && <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1"><Check className="w-3 h-3"/> Weighed</div>}
                     </button>
                   );
                 })}
               </div>

               <div className="h-16 mt-6 w-full flex justify-center">
                 {selectedBin && displayWeight !== null && displayWeight >= WASTE_BINS.find(b => b.id === selectedBin)!.actualKg && !state.weighed[selectedBin] && (
                    <button 
                      onClick={() => handleWeighConfirm(selectedBin)}
                      className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:bg-zinc-200 transition-all animate-in zoom-in-95 flex items-center gap-2 uppercase tracking-widest text-sm hover:scale-105"
                    >
                       <CheckCircle2 className="w-4 h-4" /> Confirm Weight
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
                    return (
                      <div key={bin.id} className="flex justify-between items-center border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                        <div className="text-sm font-bold text-zinc-700">{bin.label}</div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={state.weights[bin.id] || ''}
                            onChange={e => handleWeightInput(bin.id, e.target.value)}
                            placeholder="0.00"
                            disabled={!state.weighed[bin.id]}
                            className={cn("w-20 text-center font-mono bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-1 h-8 focus-visible:ring-0", isRight ? "border-emerald-500 text-emerald-700" : "border-zinc-300")}
                          />
                          <span className="text-xs text-zinc-500 font-mono">kg</span>
                        </div>
                      </div>
                    );
                 })}
               </div>

               {weightsDone && !interpreted && (
                 <div className="p-6 bg-zinc-50 border-t border-zinc-200 animate-in fade-in slide-in-from-bottom-4">
                   <h4 className="font-bold text-sm mb-3">Waste Follow-up</h4>
                   <p className="text-xs text-zinc-600 mb-4">Based on the morning's waste, what is the most useful thing to investigate or improve?</p>
                   
                   <div className="space-y-3 mb-4">
                     {CLOSE_SCENE.wasteOptions.map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setLocalWasteFocus(opt.id)}
                         className={cn("w-full text-left p-3 rounded border transition-colors text-xs font-bold", localWasteFocus === opt.id ? "bg-primary text-white border-primary" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100")}
                       >
                         {opt.label}
                       </button>
                     ))}
                   </div>
                   
                   {localWasteFocus && (
                     <div className="animate-in fade-in zoom-in-95 space-y-3">
                       <p className="text-xs text-zinc-600 font-bold">Why?</p>
                       <Textarea 
                         value={localWasteReason}
                         onChange={e => setLocalWasteReason(e.target.value)}
                         placeholder="Explain your reasoning..."
                         className="text-xs min-h-[80px]"
                       />
                       <button
                         onClick={handleWasteLog}
                         disabled={!localWasteReason.trim()}
                         className="w-full bg-black text-white py-2 rounded font-bold text-xs disabled:opacity-50"
                       >
                         Log Follow-up
                       </button>
                     </div>
                   )}
                 </div>
               )}

               {interpreted && (
                 <div className="p-6 bg-emerald-50 border-t border-emerald-200 flex flex-col items-center justify-center text-center">
                   <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                   <div className="font-bold text-emerald-800 text-sm mb-1">Waste Follow-up Logged</div>
                   <div className="text-xs text-emerald-600">You can now move to the handover.</div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'clipboard'} onClose={() => setActiveCloseUp(null)} title="Handover prep" className="bg-zinc-950">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[90vh] p-4 lg:p-6">
          
          {/* Left Column: Read-only evidence */}
          <div className="w-full lg:w-80 shrink-0 bg-zinc-900 border border-zinc-700 p-5 rounded-xl text-zinc-100 overflow-y-auto shadow-2xl flex flex-col gap-6">
            <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400 flex items-center gap-2">
               <Info className="w-4 h-4" /> Shift Evidence
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Fridges</div>
                <div className="text-xs text-zinc-300">
                  Larder 2 read {handoverState.rows['larder-2']?.reading || '?'}°C. 
                  {handoverState.rows['larder-2']?.note ? ` Note: ${handoverState.rows['larder-2'].note}` : ''}
                </div>
              </div>
              
              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Deliveries</div>
                <div className="text-xs text-zinc-300">
                  Salmon short ({deliveryState.lines[SHORT_LINE_ID]?.arrived || '0'} arrived, 12 ordered). 
                  Supplier note amended. Status: {deliveryState.lines[SHORT_LINE_ID]?.status}.
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Prep</div>
                <div className="text-xs text-zinc-300">
                  Beef shin: {chillState.trays.filter(t => t > 0).length} trays. 
                  Last reading: {chillState.readings[120]?.value || chillState.readings[90]?.value || '?'}°C.
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Dietary</div>
                <div className="text-xs text-zinc-300">
                  {dietaryState.boardPosted ? `Board note: ${dietaryState.boardNote}` : 'Board not yet posted.'}
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded border border-zinc-800 border-l-4 border-l-primary">
                <div className="text-[10px] text-primary uppercase font-bold mb-1">Proposed Follow-up</div>
                <div className="text-xs text-zinc-300">
                  Focus: {CLOSE_SCENE.wasteOptions.find(o => o.id === rs.wasteFocus)?.label || 'None'}.<br/>
                  Reason: {rs.wasteReason}
                </div>
              </div>
            </div>
            
            {/* Show prompts if needed for hints, or leave them out as per redesign "no near-final answers until attempt/hint" */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400 mb-4 flex items-center gap-2">
                 <BookOpen className="w-4 h-4" /> Hints
              </h3>
              {focusedField ? (
                <div className="space-y-2">
                  {HANDOVER_FIELDS.find(f => f.id === focusedField)?.prompts.map((p, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleInsertPrompt(p)}
                      className="text-xs text-left w-full hover:bg-zinc-800 p-2.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors leading-relaxed text-zinc-300"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Focus a field to see hints.</p>
              )}
            </div>
          </div>

          {/* Right Column: Handover Sheet & Priorities */}
          <div className="flex-1 overflow-y-auto pr-2 pb-12 flex flex-col gap-6">
            <Clipboard>
              <div className="p-6 md:p-10 text-zinc-900 flex flex-col h-full min-h-[600px]">
                <div className="border-b-2 border-zinc-800 pb-3 mb-6 flex justify-between items-end gap-2 bg-zinc-100/50 -mx-6 md:-mx-10 px-6 md:px-10 pt-4">
                  <h2 className="font-bold text-lg uppercase tracking-widest font-sans">Kitchen Handover</h2>
                  <div className="text-xs font-mono text-zinc-500 font-bold bg-zinc-200 px-2 py-1 rounded">SHIFT: 15:00 - CLOSE</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-6">
                    {HANDOVER_FIELDS.slice(0, 2).map(field => (
                      <div key={field.id} className="space-y-2 group">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">{field.label}</label>
                        <Textarea
                          value={state.handover[field.id] || ''}
                          onChange={e => handleHandoverInput(field.id, e.target.value)}
                          onFocus={() => setFocusedField(field.id)}
                          placeholder="Summarise from evidence..."
                          className="kitchen-input min-h-[80px] resize-none text-sm border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {HANDOVER_FIELDS.slice(2, 4).map(field => (
                      <div key={field.id} className="space-y-2 group">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">{field.label}</label>
                        <Textarea
                          value={state.handover[field.id] || ''}
                          onChange={e => handleHandoverInput(field.id, e.target.value)}
                          onFocus={() => setFocusedField(field.id)}
                          placeholder="Summarise from evidence..."
                          className="kitchen-input min-h-[80px] resize-none text-sm border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t-2 border-zinc-800 pt-6">
                  <h3 className="font-bold uppercase tracking-widest text-sm text-zinc-800 mb-4">Action Priorities</h3>
                  <div className="space-y-3">
                    {CLOSE_SCENE.priorities.map(p => (
                      <div key={p.id} className="flex flex-col gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                        <span className="text-sm font-bold text-zinc-700">{p.label}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRedesign({ priorities: { ...rs.priorities, [p.id]: 'before-service' } })}
                            className={cn("px-3 py-1 text-xs font-bold rounded uppercase tracking-wider transition-colors", rs.priorities[p.id] === 'before-service' ? "bg-black text-white" : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100")}
                          >
                            Before Service
                          </button>
                          <button
                            onClick={() => updateRedesign({ priorities: { ...rs.priorities, [p.id]: 'later' } })}
                            className={cn("px-3 py-1 text-xs font-bold rounded uppercase tracking-wider transition-colors", rs.priorities[p.id] === 'later' ? "bg-black text-white" : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100")}
                          >
                            Later
                          </button>
                        </div>
                        <label className="text-xs text-zinc-600">
                          Who will follow this up?
                          <Input
                            className="mt-1 bg-white"
                            aria-label={`Person responsible for ${p.label}`}
                            data-testid={`responsibility-${p.id}`}
                            value={rs.responsibilities?.[p.id] ?? ''}
                            onChange={event => updateRedesign({ responsibilities: { ...rs.responsibilities, [p.id]: event.target.value } })}
                            placeholder="Name or role"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  {exchangeError && (
                    <div className="mt-4 text-red-600 font-bold text-sm">
                      {exchangeError}
                    </div>
                  )}
                  
                  {exchangeStep === 0 && !rs.recipientConfirmed && (
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={startExchange}
                        className="bg-black text-white font-bold px-8 py-3 rounded hover:bg-zinc-800 transition-all uppercase tracking-wider text-sm"
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
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400">ET</div>
                  <div>
                    <div className="font-bold text-zinc-100 text-lg">Evening Team</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Shift Handover Exchange</div>
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
                              className="px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-300 transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-primary font-bold">
                          ✓ {CLOSE_SCENE.clarifications.salmon.options.find(o => o.id === rs.clarifications[ClarificationKey.Salmon])?.label}
                        </div>
                      )}
                    </div>
                  )}

                  {exchangeStep >= 2 && (
                    <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 animate-in fade-in">
                      <p className="text-sm text-zinc-300 mb-4">"{CLOSE_SCENE.clarifications.fridge.question}"</p>
                      {!rs.clarifications[ClarificationKey.Fridge] ? (
                        <div className="flex gap-2 flex-wrap">
                          {CLOSE_SCENE.clarifications.fridge.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleClarification(ClarificationKey.Fridge, opt.id)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-300 transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-primary font-bold">
                          ✓ {CLOSE_SCENE.clarifications.fridge.options.find(o => o.id === rs.clarifications[ClarificationKey.Fridge])?.label}
                        </div>
                      )}
                    </div>
                  )}

                  {exchangeStep >= 3 && (
                    <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 animate-in fade-in">
                      <p className="text-sm text-zinc-300 mb-4">"{CLOSE_SCENE.clarifications.dietary.question}"</p>
                      {!rs.clarifications[ClarificationKey.Dietary] ? (
                        <div className="flex gap-2 flex-wrap">
                          {CLOSE_SCENE.clarifications.dietary.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleClarification(ClarificationKey.Dietary, opt.id)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-primary hover:text-white border border-zinc-700 rounded text-sm text-zinc-300 transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-primary font-bold">
                          ✓ {CLOSE_SCENE.clarifications.dietary.options.find(o => o.id === rs.clarifications[ClarificationKey.Dietary])?.label}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {rs.recipientConfirmed && (
               <div className="bg-emerald-950/40 border border-emerald-500/30 p-6 rounded-xl shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                 <div>
                   <div className="text-emerald-200 font-bold text-lg mb-1">Handover Accepted</div>
                   <div className="text-emerald-300/80 text-sm">"Got it. So salmon is for tomorrow, we need to check larder 2 before service, and table 3 gets the pear. We're ready."</div>
                 </div>
                 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
               </div>
            )}

          </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'chill'} onClose={() => setActiveCloseUp(null)} title="Terence, at the pass" className="bg-zinc-950">
        <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto h-[85vh] p-4 lg:p-6">
          {/* Left: Chill Record Sheet */}
          <div className="flex-1 overflow-y-auto pb-8">
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
                    <div className="font-mono text-2xl text-zinc-800" style={{ fontFamily: 'cursive' }}>{progress.initials || "JM"}</div>
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

            <p className="text-sm leading-relaxed mb-8 text-zinc-300 italic border-l-2 border-zinc-700 pl-4 py-1">
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
                      "w-full text-left p-4 rounded-lg border transition-all text-sm leading-relaxed",
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
              <div className={cn("p-4 mt-6 rounded-lg border text-sm leading-relaxed animate-in fade-in zoom-in-95 duration-300", elenaCorrect ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" : "bg-red-950/40 border-red-500/30 text-red-200")}>
                <strong className="block mb-1 opacity-70 text-[10px] uppercase tracking-widest">Terence</strong>
                {ELENA_QUESTION.options.find(o=>o.id===state.elenaAnswer)?.response}
              </div>
            )}

            {elenaCorrect && !state.elenaSigned && (
              <div className="mt-8 pt-6 border-t border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <button 
                   onClick={() => {
                     kitchenAudio.play('write');
                     updateTask('hand-the-kitchen-on', prev => ({ ...prev, elenaSigned: true }));
                   }}
                   className="w-full bg-white text-black font-bold py-4 rounded-lg shadow-xl hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
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
