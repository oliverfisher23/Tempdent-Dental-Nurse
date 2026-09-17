import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/task-shell";
import { 
  ORDER_LINES,
  DELIVERY_LINES,
  FISH_CHECKS,
  READING_TOLERANCE_C,
  SHORT_LINE_ID,
  LineStatus,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Thermometer, Box, FileSignature, Fish, Check } from "lucide-react";
import { parseNumber } from "@/lib/simulation";

export default function DeliveryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["check-the-delivery-in"];
  const [dialogue, setDialogue] = useState<Line>(DELIVERY_LINES.driverOpening);
  
  const [activeProbeId, setActiveProbeId] = useState<string | null>(null);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const probeInterval = useRef<number | null>(null);

  useEffect(() => () => {
    if (probeInterval.current !== null) window.clearInterval(probeInterval.current);
  }, []);

  // When they start interacting with the sheet, Marcus steps in
  const handleInitialInteraction = () => {
    if (dialogue === DELIVERY_LINES.driverOpening) {
      setDialogue(DELIVERY_LINES.marcusOpening);
    }
  };

  const handleLineStatus = (id: string, status: LineStatus) => {
    handleInitialInteraction();
    
    // Check if status is wrong
    const line = ORDER_LINES.find(l => l.id === id);
    if (line && status !== line.expectedStatus) {
      setDialogue(DELIVERY_LINES.marcusOnWrongStatus);
    }

    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      lines: {
        ...prev.lines,
        [id]: { ...prev.lines[id], status }
      }
    }));
  };

  const handleLineInput = (id: string, field: "arrived" | "temperature", value: string) => {
    handleInitialInteraction();
    if (field === "arrived" && id === SHORT_LINE_ID && parseNumber(value) === 8) {
      setDialogue(DELIVERY_LINES.driverOnShort);
    }
    updateTask("check-the-delivery-in", (prev) => {
      const lineState = prev.lines[id];
      const newLine = { ...lineState, [field]: value };
      
      if (field === "arrived") {
        newLine.counted = value.trim() !== "";
      }

      return { ...prev, lines: { ...prev.lines, [id]: newLine } };
    });
  };

  const handleProbe = (id: string, actualC: number) => {
    handleInitialInteraction();
    setActiveProbeId(id);
    setProbeValue(null);
    if (probeInterval.current !== null) window.clearInterval(probeInterval.current);
    
    let ticks = 0;
    probeInterval.current = window.setInterval(() => {
      ticks++;
      const wiggle = actualC + (Math.random() * 2 - 1) * Math.exp(-ticks/5);
      setProbeValue(wiggle);
      
      if (ticks > 12) {
        if (probeInterval.current !== null) window.clearInterval(probeInterval.current);
        probeInterval.current = null;
        setProbeValue(actualC);
        
        updateTask("check-the-delivery-in", (prev) => ({
          ...prev,
          lines: {
            ...prev.lines,
            [id]: { ...prev.lines[id], probed: true }
          }
        }));
      }
    }, 100);
  };

  const handleFishCheck = (id: string) => {
    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      fishChecks: { ...prev.fishChecks, [id]: true }
    }));
  };

  const handleRadioMarcus = () => {
    updateTask("check-the-delivery-in", prev => ({ ...prev, radioedMarcus: true }));
    setDialogue(DELIVERY_LINES.marcusOnRadio);
  };

  const handleSign = () => {
    const salmonAmended = parseNumber(state.noteAmendedTo) === 8;
    if (!salmonAmended) {
      setDialogue(DELIVERY_LINES.marcusOnUnamendedNote);
      return;
    }
    
    updateTask("check-the-delivery-in", prev => ({ ...prev, signed: true, signature: progress.initials }));
    setDialogue(DELIVERY_LINES.marcusDone);
  };

  const shortLineState = state.lines[SHORT_LINE_ID];
  const discoveredShort = parseNumber(shortLineState?.arrived ?? "") === 8;

  return (
    <TaskShell 
      id="check-the-delivery-in"
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

        {/* Action Panel for Complications */}
        {discoveredShort && !state.radioedMarcus && (
          <div className="bg-white border-2 border-primary p-6 shadow-md rounded-sm animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-2">Driver says salmon was never loaded.</h3>
            <p className="text-muted-foreground mb-4">You have 8 kg. The sheet says 12 kg. You need to know what to do about tomorrow's lunch.</p>
            <Button onClick={handleRadioMarcus} className="w-full text-base">
              Radio Marcus
            </Button>
          </div>
        )}

        {/* Order Sheet */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">1</span>
            Order Sheet
          </h2>
          
          <div className="paper-sheet p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg text-center uppercase tracking-widest">Morning Intake</h3>
              <p className="text-center text-sm text-muted-foreground font-mono">SUPPLIER: DEVON FRESH / EXMOUTH FISH</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="kitchen-table w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th className="pl-6">Item</th>
                    <th className="w-20 text-center">Ord</th>
                    <th className="w-24 text-center">Arrived</th>
                    <th className="w-24 text-center">Temp °C</th>
                    <th className="w-48 text-center pr-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_LINES.map((line) => {
                    const row = state.lines[line.id];
                    const isActive = activeProbeId === line.id;
                    
                    return (
                      <tr key={line.id} className="group hover:bg-muted/10">
                        <td className="pl-6 py-3">
                          <div className="font-medium text-foreground">{line.item}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Box className="w-3 h-3" /> Trolley {line.trolley}
                          </div>
                        </td>
                        <td className="text-center font-mono text-muted-foreground">
                          {line.ordered} {line.unit}
                        </td>
                        <td className="px-2">
                          <Input 
                            value={row.arrived}
                            onChange={(e) => handleLineInput(line.id, "arrived", e.target.value)}
                             aria-label={`Arrived quantity for ${line.item}`}
                            placeholder="count"
                            className="kitchen-input text-base"
                          />
                        </td>
                        <td className="px-2 text-center">
                          {line.chilled ? (
                            row.probed ? (
                              <Input 
                                value={row.temperature}
                                onChange={(e) => handleLineInput(line.id, "temperature", e.target.value)}
                                 aria-label={`Temperature for ${line.item}`}
                                placeholder="°C"
                                className="kitchen-input text-base"
                              />
                            ) : (
                              <button 
                                onClick={() => handleProbe(line.id, line.actualC!)}
                                 aria-label={`Probe ${line.item}`}
                                className={cn(
                                  "w-12 h-8 inline-flex items-center justify-center rounded-sm border transition-colors",
                                  isActive ? "border-primary bg-primary/10 text-primary font-mono text-xs" : "bg-white border-primary text-primary hover:bg-primary/10"
                                )}
                              >
                                {isActive ? (probeValue !== null ? probeValue.toFixed(1) : "...") : <Thermometer className="w-4 h-4" />}
                              </button>
                            )
                          ) : (
                            <span className="text-muted-foreground/30 text-sm">-</span>
                          )}
                        </td>
                        <td className="pr-6">
                          <div className="flex bg-muted/50 rounded-sm border border-border overflow-hidden">
                            {(["arrived", "short", "refused"] as LineStatus[]).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleLineStatus(line.id, status)}
                                 aria-label={`${status} status for ${line.item}`}
                                 aria-pressed={row.status === status}
                                className={cn(
                                  "flex-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                                  row.status === status 
                                    ? status === "arrived" ? "bg-brand-green/20 text-brand-green" 
                                      : status === "short" ? "bg-primary text-primary-foreground"
                                      : "bg-destructive text-destructive-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                                )}
                              >
                                 {status === "arrived" ? "Arrived" : status === "short" ? "Short" : "Refused"}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Fish Checks */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">2</span>
            Fish Inspection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FISH_CHECKS.map((check) => {
              const checked = state.fishChecks[check.id];
              return (
                <button
                  key={check.id}
                  onClick={() => handleFishCheck(check.id)}
                  aria-pressed={checked}
                  className={cn(
                    "flex flex-col text-left p-4 border rounded-sm transition-all duration-200",
                    checked ? "bg-white border-brand-green/50 shadow-sm" : "bg-muted/30 border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-2">
                      <Fish className="w-4 h-4 text-muted-foreground" /> {check.label}
                    </span>
                    {checked && <Check className="w-4 h-4 text-brand-green" />}
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {checked ? check.whatYouFind : "Click to inspect..."}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Delivery Note */}
        <section className={cn("transition-opacity duration-500", state.radioedMarcus ? "opacity-100" : "opacity-40 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">3</span>
            Delivery Note
          </h2>
          
          <div className="paper-sheet p-8 font-mono text-sm space-y-6">
            <div className="flex justify-between border-b-2 border-foreground pb-4">
              <div>
                <div className="font-bold text-lg">EXMOUTH FISH SUPPLIERS</div>
                <div className="text-muted-foreground">Delivery Note #49281</div>
              </div>
              <div className="text-right">
                <div>Account: MAR-EXETER</div>
                <div>Date: Today</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between font-bold border-b border-border/50 pb-2">
                <span>Description</span>
                <span>Qty</span>
              </div>
              <div className="flex justify-between py-2 group">
                <span>Sea bass, whole</span>
                <span>10</span>
              </div>
              <div className="flex justify-between py-2 group">
                <span>Smoked haddock</span>
                <span>3 kg</span>
              </div>
              <div className="flex justify-between py-2 group items-center">
                <span>Salmon fillet</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-muted-foreground">12 kg</span>
                  <Input
                    value={state.noteAmendedTo}
                    onChange={(e) => updateTask("check-the-delivery-in", prev => ({ ...prev, noteAmendedTo: e.target.value }))}
                     aria-label="Amended salmon quantity"
                     disabled={!state.radioedMarcus}
                    className="w-16 h-8 text-center text-primary font-bold border-primary"
                    placeholder="amend"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-sans font-bold">Received in good condition</div>
                  {state.signed ? (
                    <div className="text-2xl font-serif italic text-foreground px-4 py-2 border-b border-foreground inline-block min-w-48">
                      {state.signature}
                    </div>
                  ) : (
                    <Button onClick={handleSign} disabled={!state.radioedMarcus} variant="outline" className="border-primary text-primary hover:bg-primary/10 w-48">
                      <FileSignature className="w-4 h-4 mr-2" /> Sign Note
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </TaskShell>
  );
}
