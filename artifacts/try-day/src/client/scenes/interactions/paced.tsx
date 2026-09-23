import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { DragProvider, useDraggable, useDropZone } from '@kit/interact';
import { kitchenAudio } from '@kit/lib/audio';
import { blankAnswer, TASKS } from '@client/content/tasks';
import { playSfx, stopSfx } from '@client/lib/sounds';
import type { PacedCue } from '@client/content/tasks';
import type { InteractionProps } from './types';

type Phase = 'position' | 'ready' | 'tell' | 'cue' | 'shield' | 'done';

export function PacedInteraction(props: InteractionProps<'paced'>) {
  return (
    <CloseUp isOpen={props.isOpen} onClose={props.onClose} title={props.presentation.title} className="max-w-4xl">
      <DragProvider>
        <PacedWorkspace {...props} />
      </DragProvider>
    </CloseUp>
  );
}

function PacedWorkspace({
  taskId, decision, presentation, answers, memory, ownPace, frozen, onAnswer, onAnswerOther,
}: InteractionProps<'paced'>) {
  const segment = presentation.segment;
  const speakOnly = segment.cues.length === 0 && Boolean(segment.speakUp) && !segment.live;
  const [phase, setPhase] = useState<Phase>(segment.live ? 'position' : 'ready');
  const [cueIndex, setCueIndex] = useState(0);
  const [passes, setPasses] = useState<string[]>([]);
  const [suction, setSuction] = useState(typeof answers[segment.live?.decision ?? ''] === 'string'
    ? answers[segment.live?.decision ?? ''] as string : '');
  const [note, setNote] = useState(segment.before ?? '');
  const [lookedUp, setLookedUp] = useState(0);
  const [crossedFace, setCrossedFace] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [shield, setShield] = useState<string[]>([]);
  const [spoke, setSpoke] = useState(false);
  const cue = segment.cues[cueIndex];
  const handMoment = Boolean(segment.speakUp && cue && cue.at >= segment.speakUp.at
    && (segment.cues[cueIndex - 1]?.at ?? 0) < segment.speakUp.at);
  const handActive = !spoke && (handMoment || (speakOnly && (ownPace || phase === 'cue')));

  useEffect(() => () => {
    stopSfx('handpiece');
    stopSfx('curing-light');
  }, []);

  // The tell runs out: Dr Reid asks. Passing on the ask is fine (storyboard T3), so this is not a look-up.
  useEffect(() => {
    if (phase !== 'tell' || ownPace || !cue) return undefined;
    const timer = window.setTimeout(() => {
      setPhase('cue');
      setNote(cue.cue);
      playSfx('cue');
    }, segment.tellSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [cue, ownPace, phase, segment.tellSeconds]);

  // Nothing passed for a while after the ask: Dr Reid looks up and waits (once per cue).
  useEffect(() => {
    if (phase !== 'cue' || ownPace || !cue || speakOnly) return undefined;
    const timer = window.setTimeout(() => {
      setLookedUp((value) => value + 1);
      setNote(`${cue.cue} Dr Reid looks up and waits.`);
    }, (segment.waitSeconds ?? 4) * 1000);
    return () => window.clearTimeout(timer);
  }, [cue, ownPace, phase, segment.waitSeconds, speakOnly]);

  // Amira's hand is up: at normal tempo the learner has the speak-up window before Dr Reid sees it herself.
  useEffect(() => {
    if (!handActive || ownPace || speakOnly || !segment.speakUp?.missedOption) return undefined;
    const { decision: signalDecision, missedOption, window: seconds } = segment.speakUp;
    const timer = window.setTimeout(() => {
      onAnswerOther(signalDecision, missedOption);
      setLookedUp((value) => value + 1);
      setSpoke(true);
      setNote("I need you to be my eyes on Amira. If her hand goes up, you tell me before I've seen it.");
    }, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [handActive, onAnswerOther, ownPace, segment.speakUp, speakOnly]);

  useEffect(() => {
    if (!speakOnly || !segment.speakUp || ownPace || spoke) return undefined;
    const tellAt = Math.max(0, segment.speakUp.at - segment.tellSeconds) * 1000;
    const windowAt = Math.max(0, segment.speakUp.at) * 1000;
    const missedAt = Math.max(0, segment.speakUp.at + segment.speakUp.window + 2) * 1000;
    const tellTimer = window.setTimeout(() => {
      setPhase('tell');
      setNote(decision.prompt);
      playSfx('cue');
    }, tellAt);
    const windowTimer = window.setTimeout(() => {
      setPhase('cue');
      setNote(decision.prompt);
    }, windowAt);
    const missedTimer = window.setTimeout(() => {
      const missed = segment.speakUp?.missedOption
        ?? decision.options.find((option) => option.id === 'carry_on')?.id;
      if (missed) onAnswer(missed);
      setSpoke(true);
      setPhase('done');
    }, missedAt);
    return () => {
      window.clearTimeout(tellTimer);
      window.clearTimeout(windowTimer);
      window.clearTimeout(missedTimer);
    };
  }, [decision, onAnswer, ownPace, segment.speakUp, segment.tellSeconds, speakOnly, spoke]);

  useEffect(() => {
    if (!cue?.sound || (phase !== 'tell' && phase !== 'cue')) return undefined;
    playSfx(cue.sound);
    return () => stopSfx(cue.sound!);
  }, [cue, phase]);

  const currentField = segment.field?.states?.[suction] ?? segment.field;
  const allDecisions = useMemo(
    () => TASKS[taskId].scenes.flatMap((scene) => scene.decisions),
    [taskId],
  );

  const reset = () => {
    for (const id of segment.decisions) {
      const linked = allDecisions.find((item) => item.id === id);
      if (!linked) continue;
      if (id === decision.id) onAnswer(blankAnswer(linked));
      else onAnswerOther(id, blankAnswer(linked));
    }
    setPhase(segment.live ? 'position' : 'ready');
    setCueIndex(0);
    setPasses([]);
    setSuction('');
    setNote(segment.before ?? '');
    setLookedUp(0);
    setCrossedFace(false);
    setFetched(false);
    setShield([]);
    setSpoke(false);
    kitchenAudio.play('page');
  };

  const positionSuction = useCallback((zone: string) => {
    if (!segment.live || frozen) return;
    setSuction(zone);
    onAnswerOther(segment.live.decision, zone);
    kitchenAudio.play(zone === 'near' ? 'confirm' : 'wrong');
    setNote(zone === 'near' ? "That's it." : 'Water is collecting and Dr Reid’s view is not clear.');
    if (zone === 'near') setPhase('ready');
  }, [frozen, onAnswerOther, segment.live]);

  const speakUp = () => {
    if (!segment.speakUp || frozen) return;
    kitchenAudio.play('tap');
    if (!handActive) {
      setNote(speakOnly ? 'Keep watching. Speak up when the change happens.' : 'You spoke up. Amira’s hand is still on the armrest, so Dr Reid carries on.');
      return;
    }
    if (segment.speakUp.decision === decision.id) onAnswer(segment.speakUp.option);
    else onAnswerOther(segment.speakUp.decision, segment.speakUp.option);
    setSpoke(true);
    setNote(speakOnly
      ? decision.options.find((option) => option.id === segment.speakUp?.option)?.label ?? 'You speak up to Dr Reid.'
      : 'Dr Reid — Amira’s hand is up.');
    if (speakOnly) setPhase('done');
    stopSfx('handpiece');
  };

  const finishCue = (item: string, route: 'hand' | 'face') => {
    if (!cue || frozen) return;
    if (handActive && segment.speakUp?.missedOption) {
      onAnswerOther(segment.speakUp.decision, segment.speakUp.missedOption);
      setLookedUp((value) => value + 1);
      setSpoke(true);
      setNote("I need you to be my eyes on Amira. If her hand goes up, you tell me before I've seen it.");
    }
    if (route === 'face') {
      setCrossedFace(true);
      setNote("Nothing passes over the patient's face. Keep the pass below the chin, handle first.");
    } else if (item === cue.option && phase === 'tell') {
      setNote(segment.early ?? '');
    } else if (item !== cue.option) {
      setLookedUp((value) => value + 1);
      setNote(segment.wrongItem ?? 'Not that one.');
    }
    kitchenAudio.play(item === cue.option && route === 'hand' ? 'confirm' : 'wrong');
    const nextPasses = [...passes, item];
    setPasses(nextPasses);

    if (cue.option === 'light') {
      const picked = item === 'light' ? ['sleeved'] : item === 'bare' ? ['bare'] : [];
      setShield(picked);
      setPhase('shield');
      return;
    }
    advance(nextPasses);
  };

  const advance = (nextPasses: string[]) => {
    if (cueIndex >= segment.cues.length - 1) {
      onAnswerOther('transfer', crossedFace ? 'face' : 'chin');
      setPhase('done');
      return;
    }
    setCueIndex((value) => value + 1);
    setPhase(ownPace ? 'cue' : 'tell');
    setNote('');
    playSfx('cue');
  };

  const finishLight = (withShield: boolean) => {
    const answer = withShield ? [...shield, 'shield'] : shield;
    onAnswerOther('light', answer);
    kitchenAudio.play(withShield && shield.includes('sleeved') ? 'confirm' : 'wrong');
    if (!withShield) setLookedUp((value) => value + 1);
    advance(passes);
  };

  const complete = () => {
    onAnswerOther('transfer', crossedFace ? 'face' : 'chin');
    if (segment.speakUp && !spoke && segment.speakUp.missedOption) {
      onAnswerOther(segment.speakUp.decision, segment.speakUp.missedOption);
    }
    onAnswer(passes);
  };

  const debrief = lookedUp === 0
    ? segment.debrief?.none
    : lookedUp <= 2
      ? segment.debrief?.some
      : segment.debrief?.more;

  return (
    <section
      data-testid={`decision-${decision.id}`}
      data-state="open"
      className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-slate-50 shadow-2xl"
    >
      <header className="shrink-0 border-b border-slate-700 px-4 py-3">
        <h2 data-dialog-title className="text-lg font-bold">{presentation.title}</h2>
        <p className="mt-1 text-sm text-slate-300">
          {phase === 'position' ? segment.live?.label : speakOnly ? 'Watch for a change' : `Cue ${Math.min(cueIndex + 1, segment.cues.length)} of ${segment.cues.length}`}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {currentField && (
          <div className="relative mx-auto max-w-2xl">
            <img src={currentField.image} alt={currentField.alt} className="h-[clamp(8rem,34svh,16rem)] w-full rounded-lg object-cover" />
            {phase === 'position' && segment.live && <SuctionZones decisionId={decision.id} zones={segment.live.zones} onDrop={positionSuction} />}
          </div>
        )}

        {phase === 'position' && segment.live && (
          <div className="mt-3">
            <CarryItem id="suction-tip" label={segment.live.label} disabled={frozen} testId={`option-${decision.id}-suction`} />
            <p className="mt-2 text-xs text-slate-300">Drag the suction tip to the field, or pick it up and choose a position.</p>
          </div>
        )}

        {phase === 'ready' && !speakOnly && (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="text-sm leading-relaxed"><strong>Priya: </strong>{note}</p>
            <Button className="mt-3" onClick={() => { setPhase(ownPace ? 'cue' : 'tell'); setNote(''); playSfx('cue'); }}>Start the segment</Button>
          </div>
        )}

        {speakOnly && phase !== 'done' && (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-300">
              {phase === 'ready' ? 'Watch' : phase === 'tell' ? 'Something is changing' : 'Speak up now'}
            </p>
            <p className="mt-1 font-semibold">{decision.prompt}</p>
          </div>
        )}

        {(phase === 'tell' || phase === 'cue') && cue && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_13rem]">
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-300">{phase === 'tell' ? 'Dr Reid’s tell' : 'Dr Reid'}</p>
                <p className="mt-1 font-semibold">{phase === 'tell' ? cue.tell : cue.cue}</p>
                {handActive && <p className="mt-2 rounded border border-amber-400 bg-amber-950 p-2 text-sm">Amira lifts her hand from the armrest.</p>}
              </div>
              <div className="rounded-lg border-2 border-dashed border-sky-400 bg-sky-950 p-3" data-drop-zone={`${decision.id}-hand-static`}>
                <PassZone id={`${decision.id}-hand`} label="Dr Reid’s hand, below Amira’s chin" onDrop={(id) => finishCue(id, 'hand')} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {cue.offer.map((id) => {
                const item = segment.items?.[id] ?? { label: id };
                const missingBand = id === segment.fetch?.item && memory.trayMissing.includes('matrix') && !fetched;
                if (missingBand) return null;
                return <CarryItem key={id} id={id} label={item.label} image={item.image} disabled={frozen} testId={`option-${decision.id}-${id}`} />;
              })}
            </div>
            <PassZone id={`${decision.id}-face`} label="Across Amira’s face" onDrop={(id) => finishCue(id, 'face')} subtle />
            {cue.option === segment.fetch?.item && memory.trayMissing.includes('matrix') && !fetched && (
              <div className="mt-3 rounded border border-amber-400 bg-amber-950 p-3">
                <p className="text-sm">{segment.fetch.aside}</p>
                <Button className="mt-2" onClick={() => { setFetched(true); kitchenAudio.play('tap'); }}>{segment.fetch.label}</Button>
              </div>
            )}
          </>
        )}

        {phase === 'shield' && (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="font-semibold">Dr Reid pauses with the light in her hand. Protect everyone’s eyes before it runs.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => finishLight(true)}>Hold up the orange shield</Button>
              <Button variant="secondary" onClick={() => finishLight(false)}>Run the light without the shield</Button>
            </div>
          </div>
        )}

        {phase !== 'position' && phase !== 'done' && segment.speakUp && (
          <div data-testid={`option-${decision.id}-${segment.speakUp.option}`} className="inline-block">
            <Button className="mt-3 w-full sm:w-auto" variant={handActive ? 'default' : 'secondary'} data-testid="paced-speak-up" onClick={speakUp}>
              {segment.speakUp.label}
            </Button>
          </div>
        )}

        {note && phase !== 'ready' && <p role="status" className="mt-3 border-l-4 border-sky-400 pl-3 text-sm">{note}</p>}

        {phase === 'done' && !speakOnly && (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-4" data-testid="paced-debrief">
            <p><strong>Dr Reid: </strong>{debrief?.replace('{lookedUp}', String(lookedUp))}</p>
            {segment.debrief?.after && spoke && <p className="mt-2 text-sm"><strong>Priya: </strong>{segment.debrief.after}</p>}
            <p className="mt-2 text-xs text-slate-300">Dr Reid looked up {lookedUp} {lookedUp === 1 ? 'time' : 'times'}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={complete}>Finish segment</Button>
              {!frozen && <Button variant="secondary" data-testid={`restart-${decision.id}`} onClick={reset}>Run it again</Button>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CarryItem({ id, label, image, disabled, testId }: { id: string; label: string; image?: string; disabled: boolean; testId: string }) {
  const drag = useDraggable({ id, kind: 'paced-item', label, disabled });
  return (
    <div {...drag.props} data-testid={testId} className={`relative flex min-h-11 max-w-48 items-center gap-2 rounded border px-3 py-2 text-left text-sm font-semibold ${drag.isLifted ? 'border-sky-300 bg-sky-950 ring-2 ring-sky-300' : 'border-slate-500 bg-slate-800'}`}>
      {image && <img src={image} alt="" className="h-10 w-10 rounded object-contain" />}
      <span>{label}</span>
    </div>
  );
}

const acceptsPaced = (kind: string) => kind === 'paced-item';

function PassZone({ id, label, onDrop, subtle = false }: { id: string; label: string; onDrop: (id: string) => void; subtle?: boolean }) {
  const zone = useDropZone({ id, label, accepts: acceptsPaced, onDrop });
  return (
    <div ref={zone.ref as React.Ref<HTMLDivElement>} {...zone.props} className={`${subtle ? 'mt-3 border-slate-600 bg-slate-900' : 'min-h-16 border-sky-400 bg-sky-950'} rounded border-2 border-dashed p-3 text-sm ${zone.isOver || zone.isTarget ? 'ring-2 ring-sky-300' : ''}`}>
      {zone.carrying ? `Put ${zone.carrying} here` : label}
    </div>
  );
}

function SuctionZones({ decisionId, zones, onDrop }: {
  decisionId: string;
  zones: Record<string, { x: number; y: number; hint?: string }>;
  onDrop: (zone: string) => void;
}) {
  return (
    <>
      {Object.entries(zones).map(([id, spot]) => (
        <SuctionZone key={id} id={`${decisionId}-${id}`} zone={id} label={spot.hint ?? id} x={spot.x} y={spot.y} onDrop={onDrop} />
      ))}
    </>
  );
}

function SuctionZone({ id, zone, label, x, y, onDrop }: {
  id: string; zone: string; label: string; x: number; y: number; onDrop: (zone: string) => void;
}) {
  const drop = useDropZone({ id, label, accepts: acceptsPaced, onDrop: () => onDrop(zone) });
  return (
    <div
      ref={drop.ref as React.Ref<HTMLDivElement>}
      {...drop.props}
      className={`absolute flex min-h-11 min-w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed bg-black/70 px-2 text-center text-xs font-bold ${drop.isOver || drop.isTarget ? 'border-sky-200 ring-2 ring-sky-300' : 'border-white'}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {drop.carrying ? `Put here` : label}
    </div>
  );
}