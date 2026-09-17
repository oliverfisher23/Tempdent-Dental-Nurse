import { useEffect, useRef, useState } from "react";
import { FRIDGE_UNITS, OVERNIGHT_LOG, HANDOVER_LINES, READING_TOLERANCE_C, Line } from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { addMinutes, within } from "@/lib/simulation";
import { kitchenAudio } from "@/lib/audio";

import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { PassScene } from "@/components/scenes/handover/pass";
import { CorridorScene } from "@/components/scenes/handover/corridor";

export default function HandoverTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["take-the-handover"];
  
  const [dialogue, setDialogue] = useState<Line>(HANDOVER_LINES.porterOpening);
  
  const dialogueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => () => { if (dialogueTimer.current) clearTimeout(dialogueTimer.current); }, []);

  // Time starts at 06:48 when they start probing on the board
  const baseTime = "06:48";
  
  const handleReadLog = (entryTime: string) => {
    if (!state.logRead.includes(entryTime)) {
      updateTask("take-the-handover", (prev) => ({
        ...prev,
        logRead: [...prev.logRead, entryTime]
      }));
    }
    // Check if this was the last one
    const newLogRead = [...new Set([...state.logRead, entryTime])];
    if (newLogRead.length >= OVERNIGHT_LOG.length) {
      setDialogue(HANDOVER_LINES.porterLeaving);
      if (dialogueTimer.current) clearTimeout(dialogueTimer.current);
      dialogueTimer.current = setTimeout(() => {
        setDialogue(HANDOVER_LINES.marcusOpening);
      }, 3500);
    }
  };

  const handleRowChange = (unitId: string, field: "reading" | "initials" | "note", value: string) => {
    const prev = state;
    const row = prev.rows[unitId] || { reading: '', time: '', initials: '', note: '', probed: false };
    const newRow = { ...row, [field]: value };
    
    if (field === "reading" && value.length > 0 && !row.time) {
      const filledCount = Object.values(prev.rows).filter(r => r.time).length;
      newRow.time = addMinutes(baseTime, filledCount * 2);
      newRow.initials = progress.initials;
    }

    let nextDialogue = dialogue;

    if (field === "reading" && value.length >= 3) {
      const unit = FRIDGE_UNITS.find(u => u.id === unitId);
      if (unit && row.probed) {
        const isRight = within(value, unit.actualC, READING_TOLERANCE_C);
        if (!isRight) {
           nextDialogue = HANDOVER_LINES.marcusOnWrongReading;
           kitchenAudio.play('wrong');
        } else {
           nextDialogue = dialogue.text === HANDOVER_LINES.marcusOnWrongReading.text
               ? (unitId === "larder-2" ? HANDOVER_LINES.marcusOnWarmReading : HANDOVER_LINES.marcusOpening)
               : dialogue;
           
           const allOthersFilled = FRIDGE_UNITS.filter(u => u.id !== unitId).every(u => {
             const r = prev.rows[u.id];
             return r?.reading && r?.time && r?.initials && within(r.reading, u.actualC, READING_TOLERANCE_C);
           });
           const noteOnFlagged = unitId === "larder-2" ? value.length > 0 : (prev.rows["larder-2"]?.note?.length || 0) > 8;
           if (allOthersFilled && isRight && noteOnFlagged) {
             nextDialogue = HANDOVER_LINES.marcusDone;
           }
        }
      }
    }

    if (field === "note" && value.length > 8 && unitId === "larder-2") {
      const allFilled = FRIDGE_UNITS.every(u => {
        const r = u.id === unitId ? newRow : prev.rows[u.id];
        return r?.reading && r?.time && r?.initials && within(r.reading, u.actualC, READING_TOLERANCE_C);
      });
      if (allFilled) nextDialogue = HANDOVER_LINES.marcusDone;
    }

    if (nextDialogue !== dialogue) {
      setDialogue(nextDialogue);
    }

    updateTask("take-the-handover", (old) => ({ ...old, rows: { ...old.rows, [unitId]: newRow } }));
  };

  const handleProbeSettled = (unitId: string) => {
    updateTask("take-the-handover", (prev) => ({
      ...prev,
      rows: { ...prev.rows, [unitId]: { ...(prev.rows[unitId] || { reading: '', time: '', initials: '', note: '' }), probed: true } }
    }));
  };

  // Catch the warm reading dialogue if they open Larder 2
  useEffect(() => {
    if (state.rows['larder-2']?.probed && !state.rows['larder-2']?.reading) {
       setDialogue(HANDOVER_LINES.marcusOnWarmReading);
    }
  }, [state.rows]);

  return (
    <KitchenFrame
      id="take-the-handover"
      dialogue={dialogue}
      scenes={{
        pass: <PassScene onLogRead={handleReadLog} logRead={state.logRead} />,
        corridor: <CorridorScene stateRows={state.rows} onRowChange={handleRowChange} onProbeSettled={handleProbeSettled} logRead={state.logRead} />
      }}
    />
  );
}
