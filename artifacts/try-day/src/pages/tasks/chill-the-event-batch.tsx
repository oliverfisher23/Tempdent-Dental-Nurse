import { useState } from "react";
import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { BenchScene } from "@/components/scenes/chill/bench";
import { useProgress } from "@/lib/progress-store";
import { PREP_SHEET, CHILL_RULES, PROBE_PLACEMENTS, NINETY_MINUTE_CHOICES, CHILL_LINES, type Line, type ProbePlacementId, type NinetyMinuteChoiceId, type ChillInterval } from "@/content/activities";
import { addMinutes } from "@/lib/simulation";
import { kitchenAudio } from "@/lib/audio";

export default function ChillTask() {
  const { progress, updateTask, advanceClock } = useProgress();
  const state = progress.tasks["chill-the-event-batch"];
  const [dialogue, setDialogue] = useState<Line>(CHILL_LINES.marcusOpening);

  const totalPortioned = state.trays.reduce((a, b) => a + b, 0);
  const remainingRaw = Math.round((PREP_SHEET.yourShareKg - totalPortioned) * 100) / 100;
  const remaining = Math.max(0, remainingRaw);

  const handleScoop = (trayIndex: number) => {
    if (remaining <= 0) return;
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => {
      const newTrays = [...prev.trays];
      newTrays[trayIndex] = Math.round((newTrays[trayIndex] + Math.min(PREP_SHEET.scoopKg, remaining)) * 100) / 100;
      return { ...prev, trays: newTrays };
    });
  };

  const handleAskForTray = () => {
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => ({ ...prev, askedForTray: true }));
    setDialogue(CHILL_LINES.marcusOnTrayShortage);
  };

  const handleLoadTray = (trayIndex: number, shelfIndex: number) => {
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => {
      const newShelfByTray = [...prev.shelfByTray];
      if (newShelfByTray.includes(shelfIndex)) return prev;
      newShelfByTray[trayIndex] = shelfIndex;
      return { ...prev, shelfByTray: newShelfByTray };
    });
  };

  const handleRemoveTray = (trayIndex: number) => {
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => {
      const newShelfByTray = [...prev.shelfByTray];
      newShelfByTray[trayIndex] = null;
      return { ...prev, shelfByTray: newShelfByTray };
    });
  };

  const handleProbePlacement = (id: ProbePlacementId) => {
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => ({ ...prev, probePlacement: id }));
    const p = PROBE_PLACEMENTS.find(x => x.id === id);
    if (!p?.correct) {
      setDialogue(CHILL_LINES.marcusOnProbe);
      kitchenAudio.play('wrong');
    } else {
      kitchenAudio.play('confirm');
      const shelves = state.shelfByTray.filter(x => x !== null) as number[];
      if (shelves.length === PREP_SHEET.cleanTraysAvailable) {
        shelves.sort((a, b) => a - b);
        let validSpace = true;
        for (let i = 1; i < shelves.length; i++) {
          if (shelves[i] - shelves[i - 1] < 2) validSpace = false;
        }
        if (!validSpace) {
           setDialogue(CHILL_LINES.marcusOnSpacing);
           kitchenAudio.play('wrong');
        }
      }
    }
  };

  const handleWait = () => {
    kitchenAudio.play('tap');
    const nextInterval = state.minutesElapsed === 90 ? 120 : state.minutesElapsed + 30;
    updateTask("chill-the-event-batch", prev => ({ ...prev, minutesElapsed: nextInterval }));
    advanceClock(30);
    if (nextInterval === 90) {
      setDialogue(CHILL_LINES.marcusAtNinety);
    } else if (nextInterval === 120) {
      setDialogue(CHILL_LINES.marcusDone);
    }
  };

  const handleReading = (interval: ChillInterval, value: string) => {
    updateTask("chill-the-event-batch", prev => {
      const time = addMinutes(CHILL_RULES.startClock, interval);
      return {
        ...prev,
        readings: {
          ...prev.readings,
          [interval]: { value, time }
        }
      };
    });
  };

  const handleNinetyChoice = (id: NinetyMinuteChoiceId) => {
    kitchenAudio.play('tap');
    updateTask("chill-the-event-batch", prev => ({ ...prev, ninetyChoice: id }));
    if (id === 'keep-logging') {
       setDialogue(CHILL_LINES.marcusOnRightChoice);
       kitchenAudio.play('confirm');
    } else if (id === 'walk-in') {
       setDialogue(CHILL_LINES.marcusOnWalkIn);
       kitchenAudio.play('wrong');
    } else if (id === 'bin') {
       setDialogue(CHILL_LINES.marcusOnBin);
       kitchenAudio.play('wrong');
    }
  };

  const handleMeasure = () => {
    kitchenAudio.play('confirm');
    updateTask("chill-the-event-batch", prev => ({ ...prev, measuredDepths: true }));
    setDialogue(CHILL_LINES.marcusOnRuler);
  };

  const handleSign = () => {
    kitchenAudio.play('write');
    updateTask("chill-the-event-batch", prev => ({...prev, studentSigned: true}));
  };

  return (
    <KitchenFrame
      id="chill-the-event-batch"
      dialogue={dialogue}
      scenes={{
        bench: <BenchScene 
                 state={state} 
                 remaining={remaining}
                 onScoop={handleScoop}
                 onAskForTray={handleAskForTray}
                 onLoadTray={handleLoadTray}
                 onRemoveTray={handleRemoveTray}
                 onProbePlacement={handleProbePlacement}
                 onWait={handleWait}
                 onNinetyChoice={handleNinetyChoice}
                 onMeasure={handleMeasure}
                 onReading={handleReading}
                 onSign={handleSign}
               />
      }}
    />
  );
}
