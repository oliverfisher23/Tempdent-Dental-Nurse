import { useEffect, useRef, useState } from 'react';
import { Scale, Thermometer, ChevronDown, ChevronUp, Search, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FISH_CHECKS, ORDER_LINES } from '@/content/activities';
import { CRATE_IMAGES } from '@/content/kitchen';
import { lowerFirst } from '@/lib/utils';
import { AnalogueThermometer } from '../../kitchen/analogue-thermometer';
import { KitchenScale, scaleReading, type ScalePhase } from '../../kitchen/kitchen-scale';
import { kitchenAudio } from '@/lib/audio';
import { useProgress } from '@/lib/progress-store';
import { deliveryLineIssues } from '@/lib/delivery-workflow';
import { ROW_LABELS } from '@/content/scenes/delivery-row';
import type { DeliveryState, OrderLineState } from '@/lib/simulation';
import { DeliveryFishReason } from './delivery-fish-reason';

type OrderLine = typeof ORDER_LINES[number];

export interface DeliveryRowProps {
   line: OrderLine;
   state: DeliveryState;
   onUpdateState: (recipe: (prev: DeliveryState) => DeliveryState) => void;
   expanded: boolean;
   onToggle: () => void;
   onOpenNote: () => void;
   onOpenComparison: () => void;
}

export function DeliveryRow({
   line,
   state,
   onUpdateState,
   expanded,
   onToggle,
   onOpenNote,
   onOpenComparison
}: DeliveryRowProps) {
   const { advanceClock } = useProgress();

   // Row persistence states
   const row = state.lines[line.id];
   
   const [attempted, setAttempted] = useState(false);
   const [fishInspectOpen, setFishInspectOpen] = useState(false);

   // Volatile measurement states
   const [isCounting, setIsCounting] = useState(false);
   const [isProbing, setIsProbing] = useState(false);
   const [probeValue, setProbeValue] = useState<number | null>(null);

   const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
   const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

   useEffect(() => {
      if (!expanded) {
         if (countTimer.current) clearTimeout(countTimer.current);
         if (probeTimer.current) clearInterval(probeTimer.current);
         countTimer.current = null;
         probeTimer.current = null;
         setIsCounting(false);
         setIsProbing(false);
         setProbeValue(null);
      }
      return () => {
         if (countTimer.current) clearTimeout(countTimer.current);
         if (probeTimer.current) clearInterval(probeTimer.current);
      };
   }, [expanded]);

   const updateRow = (updates: Partial<OrderLineState>) => {
      onUpdateState(prev => {
         const currentLineState = prev.lines[line.id];
         return {
            ...prev,
            lines: {
               ...prev.lines,
               [line.id]: { ...currentLineState, ...updates }
            }
         };
      });
   };

   const handleWeigh = () => {
      kitchenAudio.play(line.unit === 'kg' ? 'scale' : 'tap');
      setIsCounting(true);
      advanceClock(1);
      
      if (countTimer.current) clearTimeout(countTimer.current);
      countTimer.current = setTimeout(() => {
         countTimer.current = null;
         setIsCounting(false);
         updateRow({ counted: true });
      }, 1500);
   };

   const handleProbe = () => {
      if (line.actualC === undefined) return;
      kitchenAudio.play('tap');
      setIsProbing(true);
      setProbeValue(null);
      
      if (probeTimer.current) clearInterval(probeTimer.current);
      let ticks = 0;
      
      probeTimer.current = setInterval(() => {
         ticks++;
         setProbeValue(line.actualC! + (Math.random() * 4 - 2) * Math.exp(-ticks / 5));
         if (ticks > 15) {
            if (probeTimer.current) clearInterval(probeTimer.current);
            probeTimer.current = null;
            setProbeValue(line.actualC!);
            setIsProbing(false);
            kitchenAudio.play('probe');
            advanceClock(2);
            updateRow({ probed: true });
         }
      }, 100);
   };

   const handleAccept = () => {
      updateRow({ acceptance: 'accept', acceptedAmount: row.arrived });
   };

   const handleRefuse = () => {
      updateRow({ acceptance: 'refuse', acceptedAmount: '0' });
   };

   const handleFishCheck = (id: string) => {
      if (!state.fishChecks[id as keyof typeof state.fishChecks]) {
         kitchenAudio.play('tap');
         onUpdateState(prev => ({
            ...prev,
            fishChecks: { ...prev.fishChecks, [id]: true }
         }));
      }
   };

   const handleCheckRow = () => {
      kitchenAudio.play('page');
      setAttempted(true);
   };

   const issues = deliveryLineIssues(state, line.id);
   const isSeaBass = line.id === 'sea-bass';
   const isFishTrolley = line.trolley === 1;
   // Kilos go on the bench scales; everything else is counted by hand.
   const isWeighed = line.unit === 'kg';
   const scalePhase: ScalePhase = isCounting ? 'settling' : row.counted ? 'stable' : 'idle';

   return (
      <div className="flex flex-col border border-white/15 rounded-xl bg-zinc-900/80 backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-300">
         <button
             type="button"
             aria-label={`${expanded ? ROW_LABELS.closeItem : ROW_LABELS.openItem} ${lowerFirst(line.item)}`}
            aria-expanded={expanded}
            aria-controls={`row-body-${line.id}`}
            onClick={onToggle}
            className="w-full p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-white/5 text-left outline-none focus-visible:ring-4 focus-visible:ring-primary transition-colors"
         >
            <div className="w-full md:w-[25%] font-bold text-white text-lg flex items-center gap-2">
               {expanded ? <ChevronUp className="w-5 h-5 text-primary shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />}
                <span>{line.item}</span>
            </div>
            <div className="flex gap-4 w-full md:w-[30%] text-sm font-mono bg-black/40 px-3 py-2 rounded-md">
               <div className="text-zinc-300 min-w-[50%]">
                  <span className="text-zinc-500 block text-xs font-sans font-bold uppercase tracking-wider">{ROW_LABELS.order}</span> 
                  {line.ordered} {line.unit}
               </div>
               <div className="text-zinc-300 min-w-[50%]">
                  <span className="text-zinc-500 block text-xs font-sans font-bold uppercase tracking-wider">{ROW_LABELS.supplierSays}</span> 
                  {line.onDeliveryNote} {line.unit}
               </div>
            </div>
            <div className="w-full md:w-[25%] text-sm text-zinc-300 font-mono bg-black/40 px-3 py-2 rounded-md">
               <span className="text-zinc-500 block text-xs font-sans font-bold uppercase tracking-wider">{ROW_LABELS.youChecked}</span>
               {row.arrived ? `${row.arrived} ${line.unit}` : '-'} {row.temperature ? ` | ${row.temperature}°C` : ''}
            </div>
            <div className="w-full md:w-[20%] text-left md:text-right font-bold text-primary">
               <span className="text-zinc-500 block text-xs font-sans font-bold md:text-right uppercase tracking-wider">{ROW_LABELS.decision}</span>
               <span className="block truncate">
                   {row.status ? { arrived: ROW_LABELS.allHere, short: ROW_LABELS.short, refused: ROW_LABELS.refused }[row.status] : ROW_LABELS.noDecision} {row.acceptance === 'accept' ? `(${ROW_LABELS.accept} ${row.acceptedAmount} ${line.unit})` : row.acceptance === 'refuse' ? `(${ROW_LABELS.refuse})` : ''}
               </span>
            </div>
         </button>

         {expanded && (
            <div id={`row-body-${line.id}`} className="p-5 md:p-6 border-t border-white/10 bg-zinc-950 flex flex-col xl:flex-row gap-8">
               
               {/* Context & Evidence Panel */}
               <div className="w-full xl:w-[40%] flex flex-col gap-6">
                  
                  {/* Supplier Source Note */}
                  <div className="bg-zinc-900 p-4 rounded-lg border border-white/5 space-y-2">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                        {ROW_LABELS.supplierSays}
                     </h3>
                     {isFishTrolley ? (
                        <div className="flex flex-col gap-3 items-start">
                            <span className="text-sm text-zinc-300">{ROW_LABELS.fishSource}</span>
                            <Button variant="outline" size="sm" onClick={onOpenNote} className="font-bold bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">
                              {ROW_LABELS.openNote}
                           </Button>
                        </div>
                     ) : (
                        <span className="text-sm text-zinc-400 italic">
                           {ROW_LABELS.suppliedFigure}
                        </span>
                     )}
                  </div>

                  {/* Evidence Collection */}
                  <div className="space-y-4">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                         <Search className="w-4 h-4" /> {ROW_LABELS.evidence}
                     </h3>
                     
                     <div className="aspect-[4/3] rounded-lg overflow-hidden relative shadow-lg">
                        <img src={CRATE_IMAGES[line.id as keyof typeof CRATE_IMAGES]} alt={line.item} className="object-cover w-full h-full" />
                     </div>
                     
                     <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1 font-bold" onClick={handleWeigh} disabled={isCounting || isProbing}>
                           <Scale className="w-4 h-4 mr-2" /> {line.unit === 'kg' ? ROW_LABELS.weigh : ROW_LABELS.count}
                        </Button>
                        {line.chilled && (
                           <Button variant="secondary" className="flex-1 font-bold" onClick={handleProbe} disabled={isCounting || isProbing}>
                              <Thermometer className="w-4 h-4 mr-2" /> {ROW_LABELS.takeTemp}
                           </Button>
                        )}
                     </div>
                      {(isCounting || isProbing) && <p className="text-xs text-zinc-400">{ROW_LABELS.measuringReason}</p>}
                     
                     {/* ARIA Live region for results */}
                     {isWeighed ? (
                        <div className="bg-black/50 p-4 rounded-lg flex flex-col items-center gap-3 border border-white/5">
                           {/* The scales sit outside the live region so only the status line below is read out as it changes. */}
                           <KitchenScale kg={line.arrived} phase={scalePhase} className="max-w-[380px]" />
                           <p aria-live="polite" className="text-sm text-center">
                              {scalePhase === 'settling' ? (
                                 <span className="text-amber-400 animate-pulse font-mono text-lg">{ROW_LABELS.measuring}</span>
                              ) : scalePhase === 'stable' ? (
                                 <>
                                    <span className="sr-only">{ROW_LABELS.scaleSettled} {scaleReading(line.arrived)}. </span>
                                    <span className="text-zinc-300">{ROW_LABELS.readScale}</span>
                                 </>
                              ) : (
                                 <span className="text-zinc-400">{ROW_LABELS.scaleEmpty}</span>
                              )}
                           </p>
                        </div>
                     ) : (
                        <div aria-live="polite" className="bg-black/50 p-4 rounded-lg flex items-center justify-between font-mono text-lg border border-white/5">
                            <span className="text-zinc-400 text-sm font-sans font-bold uppercase tracking-widest">{ROW_LABELS.result}</span>
                           {isCounting ? (
                              <span className="text-amber-400 animate-pulse">{ROW_LABELS.measuring}</span>
                           ) : row.counted ? (
                              <span className="text-emerald-400 font-bold">{line.arrived} {line.unit}</span>
                           ) : (
                               <span className="text-zinc-400">{ROW_LABELS.notChecked}</span>
                           )}
                        </div>
                     )}
                     
                     {line.chilled && (
                        <div aria-live="polite" className="bg-black/50 p-4 rounded-lg flex flex-col items-center border border-white/5 gap-4">
                           {isProbing && <span className="text-amber-400 animate-pulse text-sm font-mono">{ROW_LABELS.measuring}</span>}
                           <AnalogueThermometer
                              value={probeValue !== null ? probeValue : row.probed ? line.actualC ?? null : null}
                              className="w-32 h-32"
                              clip={false}
                           />
                           {!isProbing && row.probed && <span className="text-emerald-400 font-mono font-bold">{line.actualC}°C</span>}
                        </div>
                     )}

                      {/* Specialized Fish Checks */}
                     {isSeaBass && (
                        <div className="mt-4 space-y-3">
                           <Button 
                              variant="outline" 
                               className="w-full font-bold bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
                              onClick={() => setFishInspectOpen(true)}
                              disabled={fishInspectOpen}
                           >
                              {ROW_LABELS.inspectFish}
                           </Button>
                            {fishInspectOpen && <p className="text-xs text-zinc-400">{ROW_LABELS.fishOpenReason}</p>}

                           {fishInspectOpen && (
                              <div className="space-y-2 pt-2 border-t border-white/10 animate-in fade-in zoom-in duration-300">
                                 <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{ROW_LABELS.findings}</h4>
                                 {FISH_CHECKS.map(check => (
                                    <Button
                                       key={check.id}
                                       variant="outline"
                                        className={`w-full justify-start bg-transparent text-left h-auto py-3 transition-colors ${
                                          state.fishChecks[check.id as keyof typeof state.fishChecks] 
                                             ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/40 hover:text-white' 
                                             : 'border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                                       }`}
                                       onClick={() => handleFishCheck(check.id)}
                                    >
                                       <div className="flex flex-col gap-1 w-full">
                                          <span className="font-bold flex items-center justify-between w-full">
                                             {check.label} 
                                             {state.fishChecks[check.id as keyof typeof state.fishChecks] && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                          </span>
                                           {state.fishChecks[check.id] && <span role="status" className="text-xs text-zinc-300 whitespace-normal leading-relaxed">{check.whatYouFind}</span>}
                                       </div>
                                    </Button>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>

               {/* Inputs & Decisions Panel */}
               <div className="w-full xl:w-[60%] flex flex-col gap-8">
                  
                  {/* Hints */}
                  {line.id === 'smoked-haddock' && (
                     <div className="bg-blue-950/40 border border-blue-500/30 text-blue-200 p-4 rounded-lg text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p>{ROW_LABELS.haddockHint}</p>
                     </div>
                  )}
                   {line.id === 'shallots' && (
                     <div className="bg-blue-950/40 border border-blue-500/30 text-blue-200 p-4 rounded-lg text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p>{ROW_LABELS.shallotsHint}</p>
                     </div>
                  )}

                  {/* Manual Entries */}
                  <div className="space-y-4">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest text-primary">1. {ROW_LABELS.youChecked}</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900 p-5 rounded-lg border border-white/5">
                        <div className="space-y-2">
                           <Label htmlFor={`qty-${line.id}`} className="text-zinc-300 font-bold">{ROW_LABELS.quantity} for {line.item} ({line.unit})</Label>
                           <Input
                              id={`qty-${line.id}`}
                               inputMode="decimal"
                              value={row.arrived}
                              onChange={e => updateRow({ arrived: e.target.value })}
                              className="bg-black border-white/10 text-white font-mono h-12 text-lg"
                              placeholder=""
                           />
                        </div>
                        {line.chilled && (
                           <div className="space-y-2">
                              <Label htmlFor={`temp-${line.id}`} className="text-zinc-300 font-bold">{ROW_LABELS.temperature} for {line.item} (°C)</Label>
                              <Input
                                 id={`temp-${line.id}`}
                                  inputMode="decimal"
                                 value={row.temperature}
                                 onChange={e => updateRow({ temperature: e.target.value })}
                                 className="bg-black border-white/10 text-white font-mono h-12 text-lg"
                                 placeholder=""
                              />
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Comparison */}
                  <div className="space-y-4">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest text-primary">2. {ROW_LABELS.comparisonHeading}</h3>
                     <div className="bg-zinc-900 p-5 rounded-lg border border-white/5">
                        <Label id={`comp-label-${line.id}`} className="text-zinc-300 mb-4 block font-bold text-base">{ROW_LABELS.compareBoth}</Label>
                        <RadioGroup 
                           value={row.comparison || ""} 
                            onValueChange={v => updateRow({ comparison: v as OrderLineState['comparison'] })}
                           aria-labelledby={`comp-label-${line.id}`}
                        >
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-md border border-white/5">
                                 <RadioGroupItem value="matches-both" id={`cmp-m-${line.id}`} />
                                 <Label htmlFor={`cmp-m-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.matchesBoth}</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-md border border-white/5">
                                 <RadioGroupItem value="differs-both" id={`cmp-db-${line.id}`} />
                                 <Label htmlFor={`cmp-db-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.differsBoth}</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-md border border-white/5">
                                 <RadioGroupItem value="differs-order" id={`cmp-do-${line.id}`} />
                                 <Label htmlFor={`cmp-do-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.differsOrder}</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-md border border-white/5">
                                 <RadioGroupItem value="differs-claim" id={`cmp-dc-${line.id}`} />
                                 <Label htmlFor={`cmp-dc-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.differsClaim}</Label>
                              </div>
                           </div>
                        </RadioGroup>
                     </div>
                  </div>

                  {/* Status & Acceptance */}
                  <div className="space-y-4">
                     <h3 className="font-bold text-white text-sm uppercase tracking-widest text-primary">3. {ROW_LABELS.decision}</h3>
                     
                     <div className="bg-zinc-900 p-5 rounded-lg border border-white/5 space-y-6">
                        
                        {/* Status */}
                        <div>
                           <Label id={`status-label-${line.id}`} className="text-zinc-300 mb-4 block font-bold text-base">{ROW_LABELS.statusHeading}</Label>
                           <RadioGroup 
                              value={row.status || ""} 
                               onValueChange={v => updateRow({ status: v as OrderLineState['status'] })}
                              aria-labelledby={`status-label-${line.id}`}
                              className="flex flex-wrap gap-4"
                           >
                              <div className="flex items-center space-x-3 bg-black/40 px-4 py-3 rounded-md border border-white/5 flex-1 min-w-[120px]">
                                 <RadioGroupItem value="arrived" id={`stat-arrived-${line.id}`} />
                                 <Label htmlFor={`stat-arrived-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.allHere}</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-black/40 px-4 py-3 rounded-md border border-white/5 flex-1 min-w-[120px]">
                                 <RadioGroupItem value="short" id={`stat-short-${line.id}`} />
                                 <Label htmlFor={`stat-short-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.short}</Label>
                              </div>
                              <div className="flex items-center space-x-3 bg-black/40 px-4 py-3 rounded-md border border-white/5 flex-1 min-w-[120px]">
                                 <RadioGroupItem value="refused" id={`stat-refused-${line.id}`} />
                                 <Label htmlFor={`stat-refused-${line.id}`} className="text-white cursor-pointer w-full">{ROW_LABELS.refused}</Label>
                              </div>
                           </RadioGroup>
                        </div>

                        <div className="w-full h-px bg-white/10" />
                        {isSeaBass && <DeliveryFishReason state={state} onUpdateState={onUpdateState} />}

                        {/* Acceptance */}
                        <div>
                            <Label id={`accept-label-${line.id}`} className="text-zinc-300 mb-4 block font-bold text-base">{ROW_LABELS.acceptanceHeading}</Label>
                            <div role="group" aria-labelledby={`accept-label-${line.id}`} className="flex flex-col sm:flex-row gap-3">
                              <Button
                                 className="flex-1 h-12 font-bold text-base transition-colors"
                                 variant={row.acceptance === 'accept' && row.acceptedAmount === row.arrived ? "default" : "secondary"}
                                 onClick={handleAccept}
                                  aria-pressed={row.acceptance === 'accept' && row.acceptedAmount === row.arrived}
                              >
                                 {ROW_LABELS.accept} {row.arrived ? `${row.arrived} ${line.unit}` : ''}
                              </Button>
                              <Button
                                 className="flex-1 h-12 font-bold text-base transition-colors"
                                 variant={row.acceptance === 'refuse' ? "destructive" : "secondary"}
                                 onClick={handleRefuse}
                                  aria-pressed={row.acceptance === 'refuse'}
                              >
                                 {ROW_LABELS.refuse}
                              </Button>
                           </div>
                           
                           {/* Repeatable confirm if amount changed after snapshot */}
                           {row.acceptance === 'accept' && row.acceptedAmount !== row.arrived && (
                              <div className="text-sm font-bold text-amber-400 mt-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded flex items-center justify-between">
                                 <span>{ROW_LABELS.acceptChanged}</span>
                                 <Button size="sm" variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-950" onClick={handleAccept}>
                                    Confirm {row.arrived} {line.unit}
                                 </Button>
                              </div>
                           )}
                        </div>

                     </div>
                  </div>

                  {/* Explicit Verification / Check Button */}
                  <div className="pt-4 border-t border-white/10">
                     <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full h-14 font-bold text-lg bg-black text-white hover:bg-white/10 border-white/20 transition-colors"
                        onClick={handleCheckRow}
                     >
                        {ROW_LABELS.checkRow}
                     </Button>
                     
                     {/* Feedback Panel (only after attempted) */}
                     {attempted && (
                        <div className="mt-4 p-4 rounded-lg animate-in slide-in-from-top-2 duration-200" aria-live="polite">
                           {issues.length === 0 ? (
                              <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-500/30 p-3 rounded">
                                 <Check className="w-5 h-5" /> {ROW_LABELS.checked}
                              </div>
                           ) : (
                              <div className="text-red-400 bg-red-950/30 border border-red-500/30 p-4 rounded space-y-2">
                                 <p className="font-bold flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" /> {ROW_LABELS.review}
                                 </p>
                                 <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
                                    {issues.map((iss, i) => (
                                       <li key={i}>{iss.message}</li>
                                    ))}
                                 </ul>
                              </div>
                           )}
                        </div>
                     )}
                  </div>

               </div>
            </div>
         )}
      </div>
   );
}
