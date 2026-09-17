import { useEffect, useState, useRef } from "react";
import { TaskShell } from "@/components/task-shell";
import { 
  FRIDGE_UNITS, 
  OVERNIGHT_LOG, 
  HANDOVER_LINES, 
  READING_TOLERANCE_C,
  LogEntry,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Thermometer } from "lucide-react";
import { addMinutes, within } from "@/lib/simulation";

export default function HandoverTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["take-the-handover"];
  
  // Local state for the probe animation
  const [activeProbeId, setActiveProbeId] = useState<string | null>(null);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  // A probe still settling when the page is left is stopped, so nothing writes to the store afterwards.
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (probeTimer.current) clearInterval(probeTimer.current); }, []);
  
  // Track which dialogue line to show
  const [dialogue, setDialogue] = useState<Line>(HANDOVER_LINES.porterOpening);

  // Time starts at 06:48 when they start probing
  const baseTime = "06:48";
  
  const handleReadLog = (entryTime: string) => {
    if (!state.logRead.includes(entryTime)) {
      updateTask("take-the-handover", (prev) => ({
        ...prev,
        logRead: [...prev.logRead, entryTime]
      }));
    }
    if (state.logRead.length === 0) {
      setDialogue(HANDOVER_LINES.marcusOpening);
    }
  };

  const handleProbe = (unitId: string, actualC: number) => {
    setActiveProbeId(unitId);
    setProbeValue(null);
    if (probeTimer.current) clearInterval(probeTimer.current);
    
    // Simulate probe settling
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      // Random wiggle around the target
      const wiggle = actualC + (Math.random() * 4 - 2) * Math.exp(-ticks/5);
      setProbeValue(wiggle);
      
      if (ticks > 15) {
        clearInterval(interval);
        probeTimer.current = null;
        setProbeValue(actualC);
        
        // Show specific dialogue for the warm fridge
        if (unitId === "larder-2") {
          setDialogue(HANDOVER_LINES.marcusOnWarmReading);
        } else if (unitId === "larder-1" && state.logRead.includes("04:10")) {
          // If they probe something else after reading the log
        }
        
        // Mark as probed
        updateTask("take-the-handover", (prev) => ({
          ...prev,
          rows: {
            ...prev.rows,
            [unitId]: { ...prev.rows[unitId], probed: true }
          }
        }));
      }
    }, 100);
    probeTimer.current = interval;
  };

  const handleRowChange = (unitId: string, field: "reading" | "initials" | "note", value: string) => {
    updateTask("take-the-handover", (prev) => {
      const row = prev.rows[unitId];
      const newRow = { ...row, [field]: value };
      
      // Auto-fill time and initials if writing a reading for the first time
      if (field === "reading" && value.length > 0 && !row.time) {
        // Calculate minutes based on how many have been probed/filled
        const filledCount = Object.values(prev.rows).filter(r => r.time).length;
        newRow.time = addMinutes(baseTime, filledCount * 2);
        newRow.initials = progress.initials;
      }

      // Check if reading is wrong after a reasonable length
      if (field === "reading" && value.length >= 3) {
        const unit = FRIDGE_UNITS.find(u => u.id === unitId);
        if (unit && row.probed) {
          const isRight = within(value, unit.actualC, READING_TOLERANCE_C);
          if (!isRight) {
             setDialogue(HANDOVER_LINES.marcusOnWrongReading);
          } else {
             // A reading that was flagged while it was still being typed is fine now.
             setDialogue((d) =>
               d.text === HANDOVER_LINES.marcusOnWrongReading.text
                 ? (unitId === "larder-2" ? HANDOVER_LINES.marcusOnWarmReading : HANDOVER_LINES.marcusOpening)
                 : d,
             );
             // If all done, Marcus says done
             const allOthersFilled = FRIDGE_UNITS.filter(u => u.id !== unitId).every(u => {
               const r = prev.rows[u.id];
               return r.reading && r.time && r.initials && within(r.reading, u.actualC, READING_TOLERANCE_C);
             });
             const noteOnFlagged = unitId === "larder-2" ? value.length > 0 : prev.rows["larder-2"]?.note?.length > 8;
             if (allOthersFilled && isRight && noteOnFlagged) {
               setDialogue(HANDOVER_LINES.marcusDone);
             }
          }
        }
      }

      return { ...prev, rows: { ...prev.rows, [unitId]: newRow } };
    });
  };

  return (
    <TaskShell 
      id="take-the-handover"
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
        {/* Overnight Log */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">1</span>
            Overnight Log
          </h2>
          <div className="paper-sheet p-6">
            <div className="space-y-4">
              {OVERNIGHT_LOG.map((entry: LogEntry) => {
                const isRead = state.logRead.includes(entry.time);
                return (
                  <button
                    key={entry.time}
                    onClick={() => handleReadLog(entry.time)}
                    className={cn(
                      "w-full text-left p-4 border transition-all duration-200",
                      isRead ? "bg-muted/30 border-border text-foreground/80" : "bg-white border-primary/40 shadow-sm hover:border-primary"
                    )}
                  >
                    <div className="font-mono text-sm font-bold text-muted-foreground mb-1">
                      {entry.time}
                    </div>
                    <div className={cn("text-base", !isRead && "font-medium")}>
                      {isRead ? entry.text : "Click to read entry..."}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Temperature Board */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">2</span>
            Temperature Board
          </h2>
          
          <div className="paper-sheet p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg text-center uppercase tracking-widest">Daily Fridge Checks</h3>
              <p className="text-center text-sm text-muted-foreground font-mono">06:45 ROUND</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="kitchen-table w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th className="pl-6 w-1/3">Unit / Limit</th>
                    <th className="w-24 text-center">Probe</th>
                    <th className="w-24 text-center">Reading °C</th>
                    <th className="w-20 text-center">Time</th>
                    <th className="w-20 text-center">Initials</th>
                    <th className="pr-6">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {FRIDGE_UNITS.map((unit) => {
                    const row = state.rows[unit.id];
                    const isWarm = unit.actualC > unit.limitC;
                    const isActive = activeProbeId === unit.id;
                    
                    return (
                      <tr key={unit.id} className={cn(
                        unit.id === "larder-2" && state.logRead.includes("04:10") && "bg-primary/5",
                        "group hover:bg-muted/10"
                      )}>
                        <td className="pl-6 py-4">
                          <div className="font-bold text-foreground">{unit.name}</div>
                          <div className="text-xs text-muted-foreground">{unit.where} &bull; {unit.limitLabel}</div>
                        </td>
                        <td className="text-center py-4">
                          <button 
                            type="button"
                            aria-label={row.probed ? `Probe ${unit.name} again` : `Probe ${unit.name}`}
                            onClick={() => handleProbe(unit.id, unit.actualC)}
                            className={cn(
                              "inline-flex flex-col items-center justify-center w-16 h-12 rounded-sm border transition-colors",
                              row.probed ? "bg-muted text-muted-foreground border-transparent" : "bg-white border-primary text-primary hover:bg-primary/10",
                              isActive && "border-primary bg-primary/10 ring-2 ring-primary/20"
                            )}
                          >
                            <Thermometer className="w-4 h-4 mb-1" />
                            {isActive ? (
                              <span className="font-mono text-xs font-bold">
                                {probeValue !== null ? probeValue.toFixed(1) : "..."}
                              </span>
                            ) : row.probed ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider">Probe</span>
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-4">
                          <Input 
                            value={row.reading}
                            onChange={(e) => handleRowChange(unit.id, "reading", e.target.value)}
                            disabled={!row.probed}
                            placeholder="-"
                            inputMode="decimal"
                            aria-label={`Reading for ${unit.name} in degrees C`}
                            className={cn("kitchen-input text-base", !row.probed && "opacity-50")}
                          />
                        </td>
                        <td className="px-2 py-4">
                          <Input 
                            value={row.time}
                            readOnly
                            placeholder="-"
                            aria-label={`Time for ${unit.name}`}
                            className="kitchen-input text-sm text-muted-foreground"
                          />
                        </td>
                        <td className="px-2 py-4">
                          <Input 
                            value={row.initials}
                            onChange={(e) => handleRowChange(unit.id, "initials", e.target.value)}
                            maxLength={3}
                            placeholder="-"
                            aria-label={`Initials for ${unit.name}`}
                            className="kitchen-input uppercase"
                          />
                        </td>
                        <td className="pr-6 py-4">
                          {(isWarm || row.note || unit.id === "larder-2") ? (
                            <Input 
                              value={row.note}
                              onChange={(e) => handleRowChange(unit.id, "note", e.target.value)}
                              placeholder="Write a note"
                              aria-label={`Note for ${unit.name}`}
                              className="kitchen-input text-sm text-left px-2 min-w-[200px]"
                            />
                          ) : (
                            <span className="text-muted-foreground/30 text-sm block px-2 py-1">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </TaskShell>
  );
}
