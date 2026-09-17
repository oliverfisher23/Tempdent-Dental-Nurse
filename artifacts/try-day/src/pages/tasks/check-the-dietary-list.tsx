import { useEffect, useState, useMemo } from "react";
import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { 
  DIETARY_LINES,
  ADDED_GUESTS,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { wrongChartRows, guestAssignmentIsSafe } from "@/lib/simulation";
import { PassScene } from "@/components/scenes/dietary/pass";
import { EventsScene } from "@/components/scenes/dietary/events";
import { kitchenAudio } from "@/lib/audio";

export default function DietaryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["check-the-dietary-list"];
  
  const [dialogue, setDialogue] = useState<Line | null>(DIETARY_LINES.sarahOpening);

  const handleToggleAllergen = (dishId: string, allergenId: string) => {
    if (dialogue?.text === DIETARY_LINES.sarahOpening.text) {
      setDialogue(DIETARY_LINES.marcusOpening);
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
        flaggedDishes: []
      };
    });
  };

  const handleCheckChart = () => {
    const flagged = wrongChartRows(state.chart);
    updateTask("check-the-dietary-list", prev => ({
      ...prev,
      flaggedDishes: flagged,
      chartChecked: flagged.length === 0
    }));
    
    if (flagged.length > 0) {
      setDialogue(DIETARY_LINES.marcusOnChartErrors);
      kitchenAudio.play('wrong');
    } else {
      setDialogue({ speaker: "Marcus", text: "Chart's clean. Now sort the three added guests." });
      kitchenAudio.play('confirm');
    }
  };

  const handleAssignGuest = (guestId: string, field: "main" | "dessert", val: string) => {
    updateTask("check-the-dietary-list", prev => {
      const g = prev.guests[guestId] || { main: null, dessert: null };
      return {
        ...prev,
        guests: { ...prev.guests, [guestId]: { ...g, [field]: val } }
      };
    });

    const guest = ADDED_GUESTS.find(g => g.id === guestId);
    if (guest) {
      if (guest.vegetarian && field === "main" && val === "beef") {
        setDialogue(DIETARY_LINES.marcusOnMeatForVegetarian);
        kitchenAudio.play('wrong');
      }
      if (guest.mustAvoid.includes("nuts") && field === "dessert" && val === "frangipane") {
        setDialogue(DIETARY_LINES.marcusOnNutDessert);
        kitchenAudio.play('wrong');
      }
    }
  };

  const handleBoardNoteChange = (val: string) => {
    updateTask("check-the-dietary-list", prev => ({...prev, boardNote: val, boardPosted: false}));
  };

  const handlePostBoard = () => {
    updateTask("check-the-dietary-list", prev => ({...prev, boardPosted: true}));
    kitchenAudio.play('complete');
  };

  const allGuestsSafe = useMemo(() => {
    return ADDED_GUESTS.every(g => guestAssignmentIsSafe(g.id, state.guests[g.id]));
  }, [state.guests]);

  // Handle final dialogue logic
  useEffect(() => {
    if (!allGuestsSafe || !state.chartChecked || state.boardPosted) return;
    setDialogue(DIETARY_LINES.sarahDone);
    const timer = window.setTimeout(() => setDialogue(DIETARY_LINES.marcusDone), 3500);
    return () => window.clearTimeout(timer);
  }, [allGuestsSafe, state.chartChecked, state.boardPosted]);

  return (
    <KitchenFrame
      id="check-the-dietary-list"
      dialogue={dialogue}
      scenes={{
        pass: (
          <PassScene 
            stateGuests={state.guests}
            onAssignGuest={handleAssignGuest}
            chartChecked={state.chartChecked}
          />
        ),
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
            allGuestsSafe={allGuestsSafe}
            stateGuests={state.guests}
            onAssignGuest={handleAssignGuest}
          />
        )
      }}
    />
  );
}
