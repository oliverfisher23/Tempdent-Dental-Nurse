import { useCallback, useEffect, useRef, useState } from "react";
import { 
  ORDER_LINES,
  DELIVERY_LINES,
  SHORT_LINE_ID,
  LineStatus,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { parseNumber } from "@/lib/simulation";
import { kitchenAudio } from "@/lib/audio";

import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { PassScene } from "@/components/scenes/delivery/pass";
import { GoodsInScene } from "@/components/scenes/delivery/goods-in";

export default function DeliveryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["check-the-delivery-in"];
  const [dialogue, setDialogue] = useState<Line>(DELIVERY_LINES.marcusOpening);
  
  const [hasRadio, setHasRadio] = useState(false);

  const handleLineStatus = useCallback((id: string, status: LineStatus) => {
    const line = ORDER_LINES.find(l => l.id === id);
    if (line && status !== line.expectedStatus) {
      setDialogue(DELIVERY_LINES.marcusOnWrongStatus);
      kitchenAudio.play('wrong');
    }

    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      lines: {
        ...prev.lines,
        [id]: { ...prev.lines[id] || { counted: false, arrived: '', probed: false, temperature: '', status: null }, status }
      }
    }));
  }, [updateTask]);

  const handleLineInput = useCallback((id: string, field: "arrived" | "temperature", value: string) => {
    if (field === "arrived" && id === SHORT_LINE_ID && parseNumber(value) === 8) {
      setDialogue(DELIVERY_LINES.driverOnShort);
    }
    updateTask("check-the-delivery-in", (prev) => {
      const lineState = prev.lines[id] || { counted: false, arrived: '', probed: false, temperature: '', status: null };
      const newLine = { ...lineState, [field]: value };
      
      if (field === "arrived") {
        newLine.counted = value.trim() !== "";
      }

      return { ...prev, lines: { ...prev.lines, [id]: newLine } };
    });
  }, [updateTask]);

  const handleCountSettled = useCallback((id: string) => {
    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      lines: {
        ...prev.lines,
        [id]: { ...prev.lines[id] || { counted: false, arrived: '', probed: false, temperature: '', status: null }, counted: true }
      }
    }));
  }, [updateTask]);

  const handleProbeSettled = useCallback((id: string) => {
    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      lines: {
        ...prev.lines,
        [id]: { ...prev.lines[id] || { counted: false, arrived: '', probed: false, temperature: '', status: null }, probed: true }
      }
    }));
  }, [updateTask]);

  const handleFishCheck = useCallback((id: any) => {
    updateTask("check-the-delivery-in", (prev) => ({
      ...prev,
      fishChecks: { ...prev.fishChecks, [id]: true }
    }));
  }, [updateTask]);

  const radioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (radioTimer.current) clearTimeout(radioTimer.current); }, []);

  const handleRadioMarcus = useCallback(() => {
    kitchenAudio.play('radio');
    if (radioTimer.current) clearTimeout(radioTimer.current);
    radioTimer.current = setTimeout(() => {
      updateTask("check-the-delivery-in", prev => ({ ...prev, radioedMarcus: true }));
      setDialogue(DELIVERY_LINES.marcusOnRadio);
    }, 160);
  }, [updateTask]);

  const handleSign = useCallback(() => {
    const salmonAmended = parseNumber(state.noteAmendedTo) === 8;
    if (!salmonAmended) {
      setDialogue(DELIVERY_LINES.marcusOnUnamendedNote);
      kitchenAudio.play('wrong');
      return;
    }
    
    updateTask("check-the-delivery-in", prev => ({ ...prev, signed: true, signature: progress.initials }));
    setDialogue(DELIVERY_LINES.marcusDone);
  }, [state.noteAmendedTo, updateTask, progress.initials]);
  
  const handleFirstArrival = useCallback(() => {
    if (dialogue.text === DELIVERY_LINES.marcusOpening.text) {
       setDialogue(DELIVERY_LINES.driverOpening);
    }
  }, [dialogue.text]);

  return (
    <KitchenFrame
      id="check-the-delivery-in"
      dialogue={dialogue}
      scenes={{
        pass: <PassScene hasRadio={hasRadio} onTakeRadio={() => { kitchenAudio.play('tap'); setHasRadio(true); }} />,
        'goods-in': <GoodsInScene 
          state={state}
          onLineInput={handleLineInput}
          onLineStatus={handleLineStatus}
          onCountSettled={handleCountSettled}
          onProbeSettled={handleProbeSettled}
          onFishCheck={handleFishCheck}
          onRadioMarcus={handleRadioMarcus}
          onSign={handleSign}
          onNoteAmended={(val: string) => updateTask("check-the-delivery-in", prev => ({ ...prev, noteAmendedTo: val }))}
          onFirstArrival={handleFirstArrival}
        />
      }}
    />
  );
}