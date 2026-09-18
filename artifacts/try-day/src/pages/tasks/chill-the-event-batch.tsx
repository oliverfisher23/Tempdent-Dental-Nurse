import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { KitchenFrame } from "@/components/kitchen/kitchen-frame";
import { BenchScene } from "@/components/scenes/chill/bench";
import type { ChillActions } from "@/components/scenes/chill/types";
import { TRAY_DEPTH_MM } from "@/components/scenes/chill/types";
import { useProgress } from "@/lib/progress-store";
import { PREP_SHEET, CHILL_RULES, PROBE_PLACEMENTS, NINETY_MINUTE_CHOICES, CHILL_LINES, type Line, type ProbePlacementId, type NinetyMinuteChoiceId, type ChillInterval } from "@/content/activities";
import { CHILL_LABELS as L } from "@/content/scenes/chill";
import { addMinutes, traysHaveSpace } from "@/lib/simulation";
import { kitchenAudio } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { getChillGuide } from "@/content/guides/chill";

const TASK = "chill-the-event-batch" as const;
/** Half an hour on the chiller clock passes in this many steps, this far apart. */
const WAIT_STEPS = 10;
const WAIT_STEP_MS = 240;
/** A tray cannot take more than 50mm, which is 4kg. */
const TRAY_CAP_KG = 4.0;

export default function ChillTask() {
  const { progress, updateTask, advanceClock } = useProgress();
  const state = progress.tasks[TASK];
  const reduceMotion = useReducedMotion();
  const [dialogue, setDialogue] = useState<Line>(CHILL_LINES.marcusOpening);
  // The chiller only counts as running once the student has pressed START (or the clock already moved).
  const [started, setStarted] = useState(state.minutesElapsed > 0 || !!state.readings[0]?.value);
  const [waiting, setWaiting] = useState(false);
  const waitTimer = useRef<number | null>(null);

  const totalPortioned = state.trays.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, Math.round((PREP_SHEET.yourShareKg - totalPortioned) * 100) / 100);

  useEffect(() => () => {
    if (waitTimer.current) window.clearInterval(waitTimer.current);
  }, []);

  const onPour = useCallback<ChillActions["onPour"]>((trayIndex, kg) => {
    updateTask(TASK, prev => {
      if (kg < 0) {
        // Return to pan
        const current = prev.trays[trayIndex] || 0;
        const remove = Math.min(Math.abs(kg), current);
        if (remove <= 0.001) return prev;
        const trays = [...prev.trays];
        trays[trayIndex] = Math.round((trays[trayIndex] - remove) * 100) / 100;
        return { ...prev, trays };
      }
      
      const left = PREP_SHEET.yourShareKg - prev.trays.reduce((a, b) => a + b, 0);
      const room = TRAY_CAP_KG - prev.trays[trayIndex];
      const amount = Math.min(kg, left, room);
      if (amount <= 0.001) return prev;
      const trays = [...prev.trays];
      trays[trayIndex] = Math.round((trays[trayIndex] + amount) * 100) / 100;
      return { ...prev, trays };
    });
  }, [updateTask]);

  const onAskForTray = useCallback(() => {
    kitchenAudio.play('tap');
    updateTask(TASK, prev => ({ 
      ...prev, 
      askedForTray: true,
      trays: prev.trays.length === 3 ? [...prev.trays, 0] : prev.trays,
      shelfByTray: prev.shelfByTray.length === 3 ? [...prev.shelfByTray, null] : prev.shelfByTray
    }));
    setDialogue(CHILL_LINES.marcusOnTrayShortage);
  }, [updateTask]);

  const onLoadTray = useCallback<ChillActions["onLoadTray"]>((trayIndex, shelfIndex) => {
    if (state.shelfByTray.includes(shelfIndex)) return;
    const shelfByTray = [...state.shelfByTray];
    shelfByTray[trayIndex] = shelfIndex;
    updateTask(TASK, prev => ({ ...prev, shelfByTray }));
    // Marcus only speaks up once every tray is in and they are crowding each other.
    if (shelfByTray.every(s => s !== null) && !traysHaveSpace(shelfByTray)) {
      setDialogue(CHILL_LINES.marcusOnSpacing);
      kitchenAudio.play('wrong');
    } else {
      kitchenAudio.play('tap');
    }
  }, [state.shelfByTray, updateTask]);

  const onRemoveTray = useCallback<ChillActions["onRemoveTray"]>((trayIndex) => {
    kitchenAudio.play('tap');
    updateTask(TASK, prev => {
      const shelfByTray = [...prev.shelfByTray];
      shelfByTray[trayIndex] = null;
      return { ...prev, shelfByTray };
    });
  }, [updateTask]);

  const onProbePlacement = useCallback<ChillActions["onProbePlacement"]>((id: ProbePlacementId) => {
    updateTask(TASK, prev => ({ ...prev, probePlacement: id }));
    if (PROBE_PLACEMENTS.find(x => x.id === id)?.correct) {
      kitchenAudio.play('confirm');
    } else {
      setDialogue(CHILL_LINES.marcusOnProbe);
      kitchenAudio.play('wrong');
    }
  }, [updateTask]);

  const onStart = useCallback(() => {
    kitchenAudio.play('doorClose');
    setStarted(true);
  }, []);

  const onWait = useCallback(() => {
    if (waiting) return;
    kitchenAudio.play('tap');
    const from = state.minutesElapsed;
    const next = (from === 90 ? 120 : from + 30) as ChillInterval;
    const arrive = () => {
      updateTask(TASK, prev => ({ ...prev, minutesElapsed: next }));
      setWaiting(false);
      if (next === 90) setDialogue(CHILL_LINES.marcusAtNinety);
      else if (next === 120) setDialogue(CHILL_LINES.marcusDone);
    };
    if (reduceMotion) {
      advanceClock(30);
      arrive();
      return;
    }
    setWaiting(true);
    let step = 0;
    waitTimer.current = window.setInterval(() => {
      step += 1;
      advanceClock(30 / WAIT_STEPS);
      if (step >= WAIT_STEPS) {
        if (waitTimer.current) window.clearInterval(waitTimer.current);
        waitTimer.current = null;
        arrive();
      }
    }, WAIT_STEP_MS);
  }, [waiting, state.minutesElapsed, reduceMotion, advanceClock, updateTask]);

  const onReading = useCallback<ChillActions["onReading"]>((interval, value) => {
    updateTask(TASK, prev => ({
      ...prev,
      readings: { ...prev.readings, [interval]: { value, time: addMinutes(CHILL_RULES.startClock, interval) } },
    }));
  }, [updateTask]);

  const onNinetyChoice = useCallback((id: NinetyMinuteChoiceId) => {
    kitchenAudio.play('tap');
    updateTask(TASK, prev => ({ ...prev, ninetyChoice: id }));
    if (id === 'keep-logging') {
      setDialogue(CHILL_LINES.marcusOnRightChoice);
      kitchenAudio.play('confirm');
    } else if (id === 'walk-in') {
      setDialogue(CHILL_LINES.marcusOnWalkIn);
      kitchenAudio.play('wrong');
    } else {
      setDialogue(CHILL_LINES.marcusOnBin);
      kitchenAudio.play('wrong');
    }
  }, [updateTask]);

  const onMeasure = useCallback(() => {
    kitchenAudio.play('confirm');
    updateTask(TASK, prev => ({ ...prev, measuredDepths: true }));
    setDialogue(CHILL_LINES.marcusOnRuler);
  }, [updateTask]);

  const onSign = useCallback(() => {
    kitchenAudio.play('write');
    updateTask(TASK, prev => ({ ...prev, studentSigned: true }));
  }, [updateTask]);

  const actions = useMemo<ChillActions>(
    () => ({ onPour, onAskForTray, onLoadTray, onRemoveTray, onProbePlacement, onStart, onWait, onReading, onMeasure, onSign }),
    [onPour, onAskForTray, onLoadTray, onRemoveTray, onProbePlacement, onStart, onWait, onReading, onMeasure, onSign],
  );

  // One line on what to do next.
  const m = state.minutesElapsed as ChillInterval;
  const readingDue = started && !state.readings[m]?.value;
  const now = !state.trays.length ? undefined
    : remaining > 0 ? L.next.portion
    : state.shelfByTray.some(s => s === null) || !traysHaveSpace(state.shelfByTray) ? L.next.load
    : state.probePlacement !== 'centre' ? L.next.probe
    : !started ? L.next.start
    : readingDue ? L.next.read(m)
    : m === 90 && state.ninetyChoice !== 'keep-logging' ? L.next.answer
    : m >= 90 && !state.measuredDepths ? L.next.measure
    : m < 120 ? L.next.wait
    : !state.studentSigned ? L.next.sign
    : L.next.done;

  const askingAtNinety = started && m === 90 && !!state.readings[90]?.value;
  const choices = askingAtNinety ? (
    <div className="flex flex-col gap-2" role="group" aria-label={CHILL_LINES.marcusAtNinety.text}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {NINETY_MINUTE_CHOICES.map(choice => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onNinetyChoice(choice.id)}
          aria-pressed={state.ninetyChoice === choice.id}
          className={cn(
            'min-h-11 rounded-xl border px-4 py-2 text-left text-sm font-semibold shadow outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary',
            state.ninetyChoice === choice.id
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20',
          )}
        >
          {choice.label}
        </button>
      ))}
      </div>
      {state.ninetyChoice && (
        <p className={cn('rounded-lg px-3 py-2 text-sm font-medium', state.ninetyChoice === 'keep-logging' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950')} role="status" aria-live="polite">
          {state.ninetyChoice === 'keep-logging' ? L.choiceRight : L.choiceWrong}
        </p>
      )}
    </div>
  ) : undefined;

  return (
    <KitchenFrame
      id={TASK}
      dialogue={dialogue}
      now={now}
      guide={getChillGuide(state, started, waiting)}
      choices={choices}
      scenes={{
        bench: <BenchScene state={state} remaining={remaining} started={started} waiting={waiting} actions={actions} />,
      }}
    />
  );
}
