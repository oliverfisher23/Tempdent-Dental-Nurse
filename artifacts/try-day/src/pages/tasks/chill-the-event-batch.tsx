import { useState, useEffect } from "react";
import { TaskShell } from "@/components/task-shell";
import { 
  PREP_SHEET, 
  CHILLER_SHELVES,
  CHILL_RULES,
  YOUR_TRAY_READINGS,
  MARCUS_TRAY_READINGS,
  MEASURED_DEPTHS_MM,
  NINETY_MINUTE_CHOICES,
  PROBE_PLACEMENTS,
  CHILL_LINES,
  ProbePlacementId,
  NinetyMinuteChoiceId,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Thermometer, Layers, ChevronRight, PlusCircle, Scale, Ruler } from "lucide-react";
import { addMinutes } from "@/lib/simulation";

export default function ChillTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["chill-the-event-batch"];
  const [dialogue, setDialogue] = useState<Line>(CHILL_LINES.marcusOpening);
  
  const totalPortioned = state.trays.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, PREP_SHEET.yourShareKg - totalPortioned);
  const portionComplete = Math.abs(totalPortioned - PREP_SHEET.yourShareKg) < 0.01;

  const [activeProbeLocation, setActiveProbeLocation] = useState<ProbePlacementId | null>(state.probePlacement);

  const handleScoop = (trayIndex: number) => {
    if (remaining <= 0) return;
    updateTask("chill-the-event-batch", prev => {
      const newTrays = [...prev.trays];
      newTrays[trayIndex] += Math.min(PREP_SHEET.scoopKg, remaining);
      return { ...prev, trays: newTrays };
    });
  };

  const handleAskForTray = () => {
    updateTask("chill-the-event-batch", prev => ({ ...prev, askedForTray: true }));
    setDialogue(CHILL_LINES.marcusOnTrayShortage);
  };

  const handleLoadTray = (trayIndex: number, shelfIndex: number) => {
    updateTask("chill-the-event-batch", prev => {
      const newShelfByTray = [...prev.shelfByTray];
      // if something is already on this shelf, we can't place it
      if (newShelfByTray.includes(shelfIndex)) return prev;
      newShelfByTray[trayIndex] = shelfIndex;
      return { ...prev, shelfByTray: newShelfByTray };
    });
    // Check spacing rule silently, Marcus warns if bad
  };

  const handleRemoveTray = (trayIndex: number) => {
    updateTask("chill-the-event-batch", prev => {
      const newShelfByTray = [...prev.shelfByTray];
      newShelfByTray[trayIndex] = null;
      return { ...prev, shelfByTray: newShelfByTray };
    });
  };

  const handleProbePlacement = (id: ProbePlacementId) => {
    setActiveProbeLocation(id);
    updateTask("chill-the-event-batch", prev => ({ ...prev, probePlacement: id }));
    const p = PROBE_PLACEMENTS.find(x => x.id === id);
    if (!p?.correct) {
      setDialogue(CHILL_LINES.marcusOnProbe);
    } else {
      // Trigger simulation start if spaced right
      const shelves = state.shelfByTray.filter(x => x !== null) as number[];
      if (shelves.length === PREP_SHEET.cleanTraysAvailable) {
        shelves.sort((a, b) => a - b);
        let validSpace = true;
        for (let i = 1; i < shelves.length; i++) {
          if (shelves[i] - shelves[i - 1] < 2) validSpace = false;
        }
        if (!validSpace) setDialogue(CHILL_LINES.marcusOnSpacing);
      }
    }
  };

  const advanceClock = () => {
    const nextInterval = state.minutesElapsed === 90 ? 120 : state.minutesElapsed + 30;
    updateTask("chill-the-event-batch", prev => ({ ...prev, minutesElapsed: nextInterval }));
    if (nextInterval === 90) {
      setDialogue(CHILL_LINES.marcusAtNinety);
    } else if (nextInterval === 120) {
      setDialogue(CHILL_LINES.marcusDone);
    }
  };

  const handleReading = (interval: number, value: string) => {
    updateTask("chill-the-event-batch", prev => {
      const time = addMinutes(CHILL_RULES.startClock, interval);
      return {
        ...prev,
        readings: {
          ...prev.readings,
          [interval as any]: { value, time }
        }
      };
    });
  };

  const handleNinetyChoice = (id: NinetyMinuteChoiceId) => {
    updateTask("chill-the-event-batch", prev => ({ ...prev, ninetyChoice: id }));
    if (id === 'keep-logging') setDialogue(CHILL_LINES.marcusOnRightChoice);
    if (id === 'walk-in') setDialogue(CHILL_LINES.marcusOnWalkIn);
    if (id === 'bin') setDialogue(CHILL_LINES.marcusOnBin);
  };

  const handleMeasure = () => {
    updateTask("chill-the-event-batch", prev => ({ ...prev, measuredDepths: true }));
    setDialogue(CHILL_LINES.marcusOnRuler);
  };

  return (
    <TaskShell 
      id="chill-the-event-batch"
      dialogue={
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs uppercase tracking-widest opacity-60">
            {dialogue.speaker}
          </span>
          <span className="text-lg">"{dialogue.text}"</span>
        </div>
      }
    >
      <div className="space-y-12">

        {/* Portioning */}
        <section className={cn("transition-opacity", portionComplete ? "opacity-60" : "opacity-100")}>
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">1</span>
              Portion the Batch
            </span>
            <span className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <Scale className="w-4 h-4" /> Remaining: {remaining.toFixed(1)} kg
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.trays.map((kg, i) => {
              const depth = PREP_SHEET.depthForKg(kg);
              return (
                <div key={i} className="bg-white border border-border p-4 rounded-sm flex flex-col items-center">
                  <div className="w-full h-32 bg-muted/20 border border-border relative overflow-hidden mb-4 rounded-sm flex items-end">
                    <div 
                      className="w-full bg-brand-brown/40 transition-all duration-300 border-t border-brand-brown" 
                      style={{ height: `${(depth / 80) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold mix-blend-difference text-white/50">
                      GN 1/1 TRAY
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-sm font-mono mb-4 text-muted-foreground">
                    <span>{kg.toFixed(1)} kg</span>
                    <span>{depth} mm</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleScoop(i)}
                     aria-label={`Add 0.5 kg to tray ${i + 1}`}
                    disabled={remaining <= 0 || kg >= 6}
                  >
                    + Scoop 0.5 kg
                  </Button>
                </div>
              );
            })}
            
            {!portionComplete && (
              <div className="md:col-span-3 pt-2">
                <Button 
                  variant="ghost" 
                  className="w-full border-dashed border-2 text-muted-foreground"
                  onClick={handleAskForTray}
                  disabled={state.askedForTray}
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Get another clean tray
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Chiller Loading */}
        <section className={cn("transition-opacity duration-500", portionComplete ? "opacity-100" : "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">2</span>
            Load Chiller & Probe
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-secondary text-secondary-foreground p-6 rounded-sm border border-border">
              <h3 className="font-bold mb-6 text-center uppercase tracking-widest text-sm text-white/60">Blast Chiller Cabinet</h3>
              <div className="space-y-2">
                {Array.from({ length: CHILLER_SHELVES }).map((_, i) => {
                  const trayIndex = state.shelfByTray.indexOf(i);
                  const hasTray = trayIndex !== -1;
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "h-12 border-b-2 border-white/10 flex items-center px-4 transition-colors",
                        hasTray ? "bg-white/10" : "hover:bg-white/5"
                      )}
                    >
                      <span className="w-6 text-xs text-white/30 font-mono">{i+1}</span>
                      {hasTray ? (
                        <button
                          onClick={() => handleRemoveTray(trayIndex)}
                          disabled={!portionComplete}
                          aria-label={`Take tray ${trayIndex + 1} out of shelf ${i + 1}`}
                          className="flex-1 bg-brand-brown/40 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white/80 hover:bg-brand-brown/60"
                        >
                          Tray {trayIndex + 1}
                          <span className="ml-2 font-normal">Take out</span>
                        </button>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          {state.trays.map((_, tIdx) => (
                            state.shelfByTray[tIdx] === null && (
                              <button 
                                key={tIdx}
                                onClick={() => handleLoadTray(tIdx, i)}
                                 disabled={!portionComplete}
                                 aria-label={`Place tray ${tIdx + 1} on shelf ${i + 1}`}
                                className="px-2 py-1 text-[10px] bg-white/5 hover:bg-primary hover:text-primary-foreground rounded-sm uppercase tracking-wider"
                              >
                                Place T{tIdx + 1}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Where does the probe go?</h3>
                <div className="space-y-2">
                  {PROBE_PLACEMENTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProbePlacement(p.id)}
                       disabled={!portionComplete}
                       aria-pressed={activeProbeLocation === p.id}
                      className={cn(
                        "w-full text-left p-3 text-sm border rounded-sm transition-colors",
                        activeProbeLocation === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:border-primary/50"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {activeProbeLocation === 'centre' && (
                <div className="bg-primary/10 p-4 border border-primary/20 rounded-sm text-sm">
                  The probe is in the thickest part of your fullest tray. The chiller cycle starts now.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Chill Record & Timeline */}
        <section className={cn("transition-opacity duration-500", (activeProbeLocation === 'centre' && portionComplete) ? "opacity-100" : "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">3</span>
              Chill Record
            </span>
            <div className="flex items-center gap-4 bg-white px-4 py-2 border border-border shadow-sm rounded-sm">
              <ClockDisplay minutes={state.minutesElapsed} />
              {state.minutesElapsed < 90 && (
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={advanceClock} disabled={activeProbeLocation !== "centre" || !portionComplete}>
                  Wait 30m <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {state.minutesElapsed === 90 && state.measuredDepths && state.ninetyChoice === 'keep-logging' && (
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={advanceClock} disabled={activeProbeLocation !== "centre" || !portionComplete}>
                  Wait 30m <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </h2>

          {state.minutesElapsed === 90 && !state.measuredDepths && (
            <div className="bg-white border-2 border-primary p-6 shadow-md rounded-sm animate-in zoom-in-95 mb-8">
              <h3 className="font-bold text-lg mb-2 text-primary">Complication at 90 Minutes</h3>
              <p className="text-foreground/80 mb-6">Your tray is still above 8°C. Marcus's tray, filled shallower, is below it. What do you do?</p>
              <div className="space-y-3 mb-6">
                {NINETY_MINUTE_CHOICES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleNinetyChoice(c.id)}
                     disabled={activeProbeLocation !== "centre" || !portionComplete}
                     aria-pressed={state.ninetyChoice === c.id}
                    className={cn(
                      "w-full text-left p-4 border transition-colors rounded-sm text-sm",
                      state.ninetyChoice === c.id ? "bg-primary text-primary-foreground border-primary font-medium" : "bg-white hover:bg-muted/50"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              
              {state.ninetyChoice === 'keep-logging' && (
                  <Button onClick={handleMeasure} disabled={activeProbeLocation !== "centre" || !portionComplete} className="w-full" variant="outline">
                  <Ruler className="w-4 h-4 mr-2" /> Get the ruler out and measure the trays
                </Button>
              )}
            </div>
          )}

          <div className="paper-sheet p-0">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg text-center uppercase tracking-widest">Blast Chill Record</h3>
              <p className="text-center text-sm text-muted-foreground font-mono">BATCH: BRAISED BEEF SHIN</p>
            </div>
            
            <div className="p-8">
              <div className="flex mb-8 border-b-2 border-muted pb-8 relative">
                {/* Hold line indicator */}
                <div className="absolute top-12 left-0 right-0 border-t border-dashed border-brand-green flex items-center justify-end pointer-events-none">
                  <span className="bg-white px-2 text-xs font-bold text-brand-green mr-4 translate-y-[-50%]">8°C Hold Line</span>
                </div>
                
                {CHILL_RULES.intervals.concat([120] as any).map((interval: any) => {
                  const isVisible = state.minutesElapsed >= interval;
                  const isExtra = interval === 120;
                  if (isExtra && state.minutesElapsed < 120) return null;
                  
                  const yourReading = YOUR_TRAY_READINGS[interval as keyof typeof YOUR_TRAY_READINGS];
                  const marcusReading = MARCUS_TRAY_READINGS[interval as keyof typeof MARCUS_TRAY_READINGS];
                  
                  return (
                    <div key={interval} className={cn(
                      "flex-1 flex flex-col items-center gap-4 transition-opacity duration-500",
                      isVisible ? "opacity-100" : "opacity-10"
                    )}>
                      <div className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-widest">
                        {interval} MIN
                      </div>
                      
                      {isVisible ? (
                        <div className="flex flex-col gap-6 items-center w-full">
                          {/* Student's Tray */}
                          <div className="text-center w-full">
                            <div className="text-[10px] uppercase text-muted-foreground mb-1">Your Tray</div>
                            <div className="font-mono text-xl font-bold text-primary mb-2">
                              {yourReading.toFixed(1)}°C
                            </div>
                            <Input 
                              value={state.readings[interval as keyof typeof state.readings]?.value || ""}
                              onChange={(e) => handleReading(interval, e.target.value)}
                             aria-label={`Your tray temperature at ${interval} minutes`}
                             disabled={activeProbeLocation !== "centre" || !portionComplete}
                              placeholder="Write °C"
                              className="kitchen-input w-20 mx-auto text-sm"
                            />
                            {state.readings[interval as keyof typeof state.readings]?.time && (
                              <div className="text-[10px] text-muted-foreground mt-1 font-mono">{state.readings[interval as keyof typeof state.readings]?.time}</div>
                            )}
                          </div>
                          
                          {/* Marcus's Tray - Reference */}
                          <div className="text-center w-full pt-6 border-t border-border/50">
                            <div className="text-[10px] uppercase text-muted-foreground mb-1">Marcus's</div>
                            <div className="font-mono text-sm text-foreground/60">
                              {marcusReading.toFixed(1)}°C
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-muted-foreground/20">
                          <Thermometer className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-sans font-bold">Checked by</div>
                  {state.studentSigned ? (
                    <div className="text-xl font-serif italic text-foreground px-4 py-2 border-b border-foreground inline-block min-w-32">
                      {progress.initials}
                    </div>
                  ) : (
                    <Button onClick={() => updateTask("chill-the-event-batch", prev => ({...prev, studentSigned: true}))} disabled={activeProbeLocation !== "centre" || !portionComplete} variant="outline" className="border-primary text-primary hover:bg-primary/10 w-32">
                      Sign
                    </Button>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-sans font-bold">Exec Chef</div>
                  <div className="text-sm text-muted-foreground/30 px-4 py-2 border-b border-border min-w-32 inline-block italic">
                    (Elena signs at end of day)
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

      </div>
    </TaskShell>
  );
}

function ClockDisplay({ minutes }: { minutes: number }) {
  const time = addMinutes(CHILL_RULES.startClock, minutes);
  return (
    <div className="font-mono font-bold text-xl text-foreground flex items-center gap-2">
      {time}
    </div>
  );
}
