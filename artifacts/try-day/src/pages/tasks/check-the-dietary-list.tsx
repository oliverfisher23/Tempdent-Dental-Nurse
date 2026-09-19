import { useEffect, useState, useMemo } from "react";
import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { 
  DIETARY_LINES,
  ADDED_GUESTS,
  DISHES,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { wrongChartRows, evaluateDietary } from "@/lib/simulation";
import { EventsScene } from "@/components/scenes/dietary/events";
import { kitchenAudio } from "@/lib/audio";
import { getDietaryGuide } from "@/content/guides/dietary-close";
import { DIETARY_REDESIGN_LINES } from "@/content/scenes/dietary-redesign";
import { getDietaryRedesignStage } from "@/lib/redesign-dietary";

export default function DietaryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["check-the-dietary-list"];
  
  const [dialogue, setDialogue] = useState<Line | null>(DIETARY_REDESIGN_LINES.yvieIntro);

  const handleToggleAllergen = (dishId: string, allergenId: string) => {
    if (dialogue?.text === DIETARY_REDESIGN_LINES.yvieIntro.text) {
      setDialogue(DIETARY_REDESIGN_LINES.terenceReviewPrompt);
    }
    
    updateTask("check-the-dietary-list", prev => {
      const current = prev.chart[dishId] || [];
      const next = current.includes(allergenId as any) 
        ? current.filter(a => a !== allergenId)
        : [...current, allergenId as any];
      
      return { 
        ...prev, 
        chart: { ...prev.chart, [dishId]: next },
        chartChecked: false,
        flaggedDishes: [],
        boardPosted: false,
        redesign: prev.redesign ? {
          ...prev.redesign,
          rowReviewConfirmed: { ...prev.redesign.rowReviewConfirmed, [dishId]: false },
          serviceHoldAcknowledged: false,
          decisions: Object.fromEntries(Object.entries(prev.redesign.decisions).map(([key, decision]) => {
            const planned = key.endsWith(':main') ? 'beef' : 'frangipane';
            return [key, planned === dishId || decision.proposedDishId === dishId ? { ...decision, action: null } : decision];
          })),
        } : prev.redesign,
      };
    });
  };

  const handleCheckChart = () => {
    const flagged = wrongChartRows(state.chart);
    const reviewed = !state.redesign || DISHES.every((dish) => state.redesign?.rowReviewConfirmed[dish.id]);
    updateTask("check-the-dietary-list", prev => ({
      ...prev,
      flaggedDishes: flagged,
      chartChecked: flagged.length === 0 && reviewed
    }));
    
    if (flagged.length > 0 || !reviewed) {
      setDialogue(DIETARY_REDESIGN_LINES.terenceChartIncorrect);
      kitchenAudio.play('wrong');
    } else {
      setDialogue(DIETARY_REDESIGN_LINES.terenceChartCorrect);
      kitchenAudio.play('confirm');
    }
  };

  const handleAssignGuest = (guestId: string, field: "main" | "dessert", val: string) => {
    updateTask("check-the-dietary-list", prev => {
      const g = prev.guests[guestId] || { main: null, dessert: null };
      return {
        ...prev,
        guests: { ...prev.guests, [guestId]: { ...g, [field]: val } },
        boardPosted: false,
        redesign: prev.redesign ? { ...prev.redesign, serviceHoldAcknowledged: false } : prev.redesign,
      };
    });
  };

  const handleBoardNoteChange = (val: string) => {
    updateTask("check-the-dietary-list", prev => ({...prev, boardNote: val, boardPosted: false}));
  };

  const handlePostBoard = () => {
    if (!evaluateDietary({ ...state, boardPosted: true }).done) {
      kitchenAudio.play('wrong');
      return;
    }
    updateTask("check-the-dietary-list", prev => ({...prev, boardPosted: true}));
    kitchenAudio.play('complete');
  };

  const stage = getDietaryRedesignStage(state);

  // Handle final dialogue logic
  useEffect(() => {
    if (stage !== 'done') return;
    setDialogue(DIETARY_REDESIGN_LINES.yvieDone);
    const timer = window.setTimeout(() => setDialogue(DIETARY_REDESIGN_LINES.terenceDone), 3500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <KitchenFrame
      id="check-the-dietary-list"
      guide={getDietaryGuide(state)}
      dialogue={dialogue}
      scenes={{
        events: (
          <EventsScene
            stateChart={state.chart}
            flaggedDishes={state.flaggedDishes}
            chartChecked={state.chartChecked}
            onToggleAllergen={handleToggleAllergen}
            onCheckChart={handleCheckChart}
            boardNote={state.boardNote}
            onBoardNoteChange={handleBoardNoteChange}
            boardPosted={state.boardPosted}
            onPostBoard={handlePostBoard}
            allGuestsSafe={false} // not used directly in redesign flow
            stateGuests={state.guests}
            onAssignGuest={handleAssignGuest}
            redesign={state.redesign}
            onUpdateRedesign={(updater) => updateTask("check-the-dietary-list", prev => {
              const before = prev.redesign || { version: 1 as const, decisions: {}, serviceHoldAcknowledged: false, rowReviewConfirmed: {}, openQuestions: {} };
              const next = updater(before);
              const evidenceChanged = next.decisions !== before.decisions || next.openQuestions !== before.openQuestions || next.rowReviewConfirmed !== before.rowReviewConfirmed;
              return {
                ...prev,
                boardPosted: false,
                redesign: { ...next, serviceHoldAcknowledged: evidenceChanged ? false : next.serviceHoldAcknowledged },
              };
            })}
          />
        )
      }}
    />
  );
}
