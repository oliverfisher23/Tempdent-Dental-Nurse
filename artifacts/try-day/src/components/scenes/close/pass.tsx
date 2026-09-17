import { useState, useRef, useEffect } from 'react';
import { PLACES, PEOPLE } from '@/content/kitchen';
import { WASTE_BINS, HANDOVER_FIELDS, ELENA_QUESTION, WasteBin } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { CloseUp } from '../../kitchen/close-up';
import { Clipboard, Sheet } from '../../kitchen/paper';
import { Hotspot } from '../../kitchen/hotspot';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, PenTool } from 'lucide-react';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { weightIsRight } from '@/lib/simulation';

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
  const state = progress.tasks['hand-the-kitchen-on'];
  const chillState = progress.tasks['chill-the-event-batch'];
  
  const [activeCloseUp, setActiveCloseUp] = useState<'waste' | 'clipboard' | 'chill' | null>(null);

  // Waste Station State
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [displayWeight, setDisplayWeight] = useState<number | null>(null);
  const weightTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handover Clipboard State
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    setSelectedBin(null);
    setDisplayWeight(null);
  };

  const handleWeightInput = (binId: string, value: string) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      weights: { ...prev.weights, [binId]: value }
    }));
  };

  const handleHandoverInput = (fieldId: string, value: string) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      handover: { ...prev.handover, [fieldId]: value }
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
  const elenaCorrect = state.elenaAnswer && ELENA_QUESTION.options.find(o => o.id === state.elenaAnswer)?.correct;

  return (
    <div className="absolute inset-0 z-0">
      <img src={PLACES['pass'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover" decoding="async" />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Hotspots */}
      <Hotspot
        x={35} y={60}
        label={CLOSE_SCENE.wasteBins}
        state={allWeighed ? 'done' : 'active'}
        onClick={() => setActiveCloseUp('waste')}
      />

      <Hotspot
        x={65} y={60}
        label={CLOSE_SCENE.clipboard}
        state={state.handedOver ? 'done' : (allWeighed ? 'active' : 'todo')}
        onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('clipboard'); }}
      />

      {state.handedOver && (
        <>
          <div className="absolute left-[60%] bottom-[15%] w-[35%] pointer-events-none z-0">
             <img src={PEOPLE.find(p=>p.id==='elena')?.portrait || ''} alt="" className="w-full h-auto drop-shadow-2xl opacity-90 animate-in fade-in duration-1000" />
          </div>
          <Hotspot
            x={75} y={45}
            label={CLOSE_SCENE.elena}
            state={state.elenaSigned ? 'done' : 'active'}
            onClick={() => { kitchenAudio.play('page'); setActiveCloseUp('chill'); }}
          />
        </>
      )}

      {/* CloseUps */}
      <CloseUp isOpen={activeCloseUp === 'waste'} onClose={() => setActiveCloseUp(null)} title="Waste station" className="bg-zinc-950">
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center">
           <h2 className="text-2xl font-bold text-zinc-100 mb-12 tracking-widest uppercase">Floor Scales</h2>
           
           <div className="w-64 h-20 bg-black rounded-lg border-4 border-zinc-800 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-16 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-white/5 pointer-events-none"></div>
             <span className="font-mono text-5xl text-red-500 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
               {displayWeight !== null ? displayWeight.toFixed(2) : "0.00"}
             </span>
             <span className="font-mono text-xl text-red-500/80 ml-2 mt-4">kg</span>
           </div>

           <div className="flex flex-wrap justify-center gap-6 mb-12">
             {WASTE_BINS.map(bin => {
               // A bin counts as weighed only while its note still exists; tear the note up and the bin can go back on the scales.
               const isWeighed = !!state.weighed[bin.id] && progress.notepad.some(n => n.ref?.binId === bin.id || n.label === bin.label);
               const isSelected = selectedBin === bin.id;
               return (
                 <button 
                   key={bin.id}
                   onClick={() => handleSelectBin(bin)}
                   disabled={isWeighed}
                   className={cn(
                     "w-40 h-40 rounded-xl shadow-xl border-4 flex flex-col items-center justify-center text-zinc-100 text-center p-4 transition-all relative overflow-hidden",
                     isWeighed 
                       ? "bg-zinc-900 border-zinc-800 opacity-50 cursor-not-allowed" 
                       : (isSelected ? "bg-zinc-800 border-primary scale-105" : "bg-zinc-900 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800")
                   )}
                 >
                   <div className="font-bold mb-2 relative z-10">{bin.label}</div>
                   {isWeighed && <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-2 relative z-10">Weighed</div>}
                 </button>
               );
             })}
           </div>

           <div className="h-16">
             {selectedBin && displayWeight !== null && displayWeight >= WASTE_BINS.find(b => b.id === selectedBin)!.actualKg && (
                <button 
                  onClick={() => handleWeighConfirm(selectedBin)}
                  className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-xl hover:bg-zinc-200 transition-all animate-in zoom-in-95 flex items-center gap-3 uppercase tracking-widest text-sm hover:scale-105"
                >
                  <PenTool className="w-4 h-4" /> Jot down weight
                </button>
             )}
           </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'clipboard'} onClose={() => setActiveCloseUp(null)} title="Handover clipboard" className="bg-zinc-950">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[90vh] p-4 lg:p-6">
          {/* Left Column: Notepad & Prompts */}
          <div className="w-full lg:w-80 shrink-0 bg-zinc-900 border border-zinc-700 p-5 rounded-xl text-zinc-100 overflow-y-auto shadow-2xl flex flex-col gap-8">
            <div>
              <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Shift Notes
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Tap notes to drop them into the handover sheet. You can edit them once they're in.
              </p>
              <div className="space-y-6">
                {HANDOVER_FIELDS.map(f => (
                  <div key={f.id}>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wider">{f.label}</div>
                    <div className="space-y-2">
                      {f.prompts.map((p, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleInsertPrompt(p)}
                          className="text-xs text-left w-full hover:bg-zinc-800 p-2.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors leading-relaxed text-zinc-300"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-zinc-800 pt-8">
              <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400 mb-4 flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Your Notepad
              </h3>
              {progress.notepad.length === 0 ? (
                <div className="text-xs text-zinc-600 italic">No notes taken today.</div>
              ) : (
                <div className="space-y-2">
                  {progress.notepad.map(n => (
                    <button 
                      key={n.id}
                      onClick={() => handleInsertPrompt(`${n.label}: ${n.value}`)}
                      className="text-xs text-left w-full hover:bg-zinc-800 p-2.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
                    >
                      <div className="font-bold text-zinc-300">{n.label}</div>
                      <div className="text-zinc-500 mt-1">{n.value}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: The Clipboard */}
          <div className="flex-1 overflow-y-auto pr-2 pb-12">
            <Clipboard>
              <div className="p-6 md:p-10 space-y-12 text-zinc-900">
                {/* Waste Sheet Section */}
                <section>
                  <div className="border-b-2 border-zinc-800 pb-3 mb-6 bg-zinc-100/50 -mx-6 md:-mx-10 px-6 md:px-10 pt-4">
                    <h2 className="font-bold text-lg uppercase tracking-widest font-sans">Morning Waste Record</h2>
                  </div>
                  <div className="space-y-8">
                    {WASTE_BINS.map(bin => {
                      const jottedNote = progress.notepad.find(n => n.label === bin.label);
                      return (
                        <div key={bin.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-zinc-200 pb-6 last:border-0 last:pb-0">
                          <div className="flex-1">
                            <div className="font-bold text-base mb-1">{bin.label}</div>
                            <div className="text-sm text-zinc-600 mb-1">{bin.description}</div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-100 inline-block px-2 py-1 rounded">
                              From: {bin.whereFrom}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex flex-col gap-2 items-end w-full md:w-auto">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={state.weights[bin.id] || ''}
                                  onChange={e => handleWeightInput(bin.id, e.target.value)}
                                  placeholder="-"
                                  disabled={!state.weighed[bin.id]}
                                  className={cn("kitchen-input w-24 text-center text-xl bg-transparent border-b-2 border-zinc-300 border-t-0 border-l-0 border-r-0 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary", !state.weighed[bin.id] && "opacity-30")}
                                  style={{ fontFamily: 'cursive' }}
                                />
                                <span className="font-mono text-sm text-zinc-500">kg</span>
                              </div>
                              {jottedNote && !state.weights[bin.id] && state.weighed[bin.id] && (
                                <button
                                  onClick={() => {
                                    kitchenAudio.play('write');
                                    handleWeightInput(bin.id, jottedNote.value.replace(' kg', ''));
                                  }}
                                  className="text-[10px] bg-primary/10 text-primary font-bold px-3 py-1 rounded-sm shadow-sm hover:bg-primary/20 transition-colors uppercase tracking-wider"
                                >
                                  From notepad
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Handover Section */}
                <section className={cn("transition-opacity duration-500", weightsDone ? "opacity-100" : "opacity-30 pointer-events-none")}>
                  <div className="border-b-2 border-zinc-800 pb-3 mb-8 flex flex-wrap justify-between items-end gap-2 bg-zinc-100/50 -mx-6 md:-mx-10 px-6 md:px-10 pt-4">
                    <h2 className="font-bold text-lg uppercase tracking-widest font-sans">Kitchen Handover</h2>
                    <div className="text-xs font-mono text-zinc-500 font-bold bg-zinc-200 px-2 py-1 rounded">SHIFT: 15:00 - CLOSE</div>
                  </div>
                  
                  <div className="space-y-8">
                    {HANDOVER_FIELDS.map(field => (
                      <div key={field.id} className="space-y-2 group">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">{field.label}</label>
                        <Textarea
                          value={state.handover[field.id] || ''}
                          onChange={e => handleHandoverInput(field.id, e.target.value)}
                          onFocus={() => setFocusedField(field.id)}
                          placeholder="Tap notes on the left or type here..."
                          className="kitchen-input min-h-[80px] resize-none text-base border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                          style={{ fontFamily: 'cursive' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 flex justify-end">
                    <button
                      onClick={() => {
                        kitchenAudio.play('confirm');
                        onHandover();
                        setActiveCloseUp(null);
                      }}
                      disabled={!weightsDone || state.handedOver}
                      className="w-full md:w-auto bg-black text-white font-bold px-8 py-4 rounded shadow-lg hover:bg-zinc-800 disabled:opacity-50 transition-all uppercase tracking-wider text-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {state.handedOver ? "Handed to Evening Team" : "Give to Evening Team"}
                    </button>
                  </div>
                </section>
              </div>
            </Clipboard>
          </div>
        </div>
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'chill'} onClose={() => setActiveCloseUp(null)} title="Close with Elena" className="bg-zinc-950">
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

                <table className="w-full text-left border-collapse mb-16">
                  <thead>
                    <tr className="border-b-2 border-zinc-900">
                      <th className="py-3 px-4 font-bold uppercase tracking-widest text-xs">Time</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-widest text-xs">Temp °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(chillState.readings).map(([mins, reading]) => (
                      <tr key={mins} className="border-b border-zinc-200 even:bg-zinc-50/50">
                        <td className="py-4 px-4 font-mono text-zinc-600">{reading.time}</td>
                        <td className="py-4 px-4 font-mono text-xl" style={{ fontFamily: 'cursive' }}>{reading.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-end mt-16 pt-8 border-t-2 border-zinc-900">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">Prepared By</div>
                    <div className="font-mono text-2xl text-zinc-800" style={{ fontFamily: 'cursive' }}>{progress.initials || "JM"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2">Checked By (Exec Chef)</div>
                    {state.elenaSigned ? (
                      <div className="font-serif italic text-3xl text-zinc-900 border-b-2 border-zinc-900 pb-1 pr-8">E. Voss</div>
                    ) : (
                      <div className="w-48 border-b-2 border-zinc-400 border-dashed h-8"></div>
                    )}
                  </div>
                </div>
              </div>
            </Sheet>
          </div>

          {/* Right: Elena's Question */}
          <div className="w-full md:w-[400px] shrink-0 bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl flex flex-col text-zinc-100 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
              <img src={PEOPLE.find(p=>p.id==='elena')?.portrait || ''} alt="" className="w-16 h-16 rounded-full object-cover bg-black border-2 border-zinc-700" />
              <div>
                <div className="font-bold text-lg">Elena Voss</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">Executive Chef</div>
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
                <strong className="block mb-1 opacity-70 text-[10px] uppercase tracking-widest">Elena</strong>
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
                   Elena signs record
                 </button>
              </div>
            )}
          </div>
        </div>
      </CloseUp>
    </div>
  );
}
