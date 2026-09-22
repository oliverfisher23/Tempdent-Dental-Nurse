import { useEffect, useRef, useState } from "react";
import { KitchenFrame } from "@shell/frame/kitchen-frame";
import { PassScene } from "@client/scenes/close/pass";
import { useProgress } from "@client/lib/progress";
import { CLOSE_LINES, ELENA_QUESTION, Line } from "@client/content/activities";
import { kitchenAudio } from "@kit/lib/audio";
import { getCloseGuide } from "@client/content/guides/dietary-close";

export default function HandoverKitchenTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["hand-the-kitchen-on"];
  
  const [dialogue, setDialogue] = useState<Line>(CLOSE_LINES.eveningTeam);
  const dialogueTimer = useRef<number | null>(null);

  useEffect(() => {
    // Restore proper dialogue if reopening completed task
    if (state.elenaSigned) {
      setDialogue(CLOSE_LINES.marcusDone);
    } else if (state.handedOver) {
      setDialogue(CLOSE_LINES.elenaOpening);
    }

    return () => {
      if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current);
    };
  }, [state.handedOver, state.elenaSigned]);

  const handleHandover = () => {
    updateTask("hand-the-kitchen-on", prev => ({ ...prev, handedOver: true }));
    setDialogue(CLOSE_LINES.elenaOpening);
  };

  const handleElenaAnswer = (id: string) => {
    if (dialogueTimer.current !== null) {
      window.clearTimeout(dialogueTimer.current);
      dialogueTimer.current = null;
    }
    
    const opt = ELENA_QUESTION.options.find(o => o.id === id);
    if (!opt) return;

    if (!opt.correct) {
      kitchenAudio.play('wrong');
    } else {
      kitchenAudio.play('confirm');
    }

    updateTask("hand-the-kitchen-on", prev => ({ ...prev, elenaAnswer: id as any }));
    setDialogue({ speaker: "Terence", text: opt.response });
    
    if (opt.correct) {
      dialogueTimer.current = window.setTimeout(() => {
        setDialogue(CLOSE_LINES.marcusDone);
        dialogueTimer.current = null;
      }, 6000);
    }
  };

  return (
    <KitchenFrame
      id="hand-the-kitchen-on"
      guide={getCloseGuide(state, progress.tasks["chill-the-event-batch"])}
      dialogue={dialogue}
      scenes={{
        pass: (
          <PassScene 
            onHandover={handleHandover}
            onElenaAnswer={handleElenaAnswer}
            dialogue={dialogue}
          />
        )
      }}
    />
  );
}
