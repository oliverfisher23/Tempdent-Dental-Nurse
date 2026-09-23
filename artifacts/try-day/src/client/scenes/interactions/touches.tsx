import { useEffect, useRef, useState } from 'react';
import { CloseUp } from '@shell/frame/close-up';
import { Button } from '@kit/ui/button';
import { CheckFeedback } from '@kit/check-feedback';
import { kitchenAudio } from '@kit/lib/audio';
import { isAnswered, isCorrect, type PresentationOf } from '@client/content/tasks';
import { playSfx, stopSfx } from '@client/lib/sounds';
import type { InteractionProps } from './types';
import { inReadingOrder } from './layout';
import { useHold } from './use-hold';

type Touches = PresentationOf<'touches'>;

interface Hands {
  washed: boolean;
  wet: boolean;
  gloved: boolean;
  /** The paper towel is still in hand (the next touch can be made through it). */
  towel: boolean;
  /** The tap is running: washed, and no touch has turned it off yet. */
  running: boolean;
  marks: { x: number; y: number }[];
  dirtiedBy: string[];
  worn: string[];
}

/** What the hands are like after a route: derived from the recorded touches, so a reload shows the same. */
export function readHands(route: string[], presentation: Touches): Hands {
  const hands: Hands = {
    washed: false, wet: false, gloved: Boolean(presentation.startGloved), towel: false, running: false, marks: [], dirtiedBy: [], worn: [],
  };
  for (const id of route) {
    if (id === presentation.hold.optionId) {
      // The tap runs either way; only bare hands come out washed, and a wash undoes whatever they touched.
      hands.running = true;
      hands.towel = false;
      if (!hands.gloved) {
        hands.washed = true;
        hands.wet = true;
        hands.marks = [];
        hands.dirtiedBy = [];
      }
      continue;
    }
    const spot = Object.values(presentation.spots).find((item) => item.records === id || item.withTowel === id);
    if (!spot) continue;
    const throughTowel = hands.towel && spot.withTowel === id;
    if (spot.strips) hands.gloved = false;
    if (spot.dries) hands.wet = false;
    if (spot.stopsSound) hands.running = false;
    if (hands.washed && !hands.gloved && spot.dirty && !throughTowel) {
      hands.marks.push(...(spot.marks ?? []));
      hands.dirtiedBy.push(spot.label.toLowerCase());
    }
    if (spot.tapThrough) hands.worn.push(...spot.tapThrough);
    hands.towel = Boolean(spot.holds) && !throughTowel;
    if (id === presentation.commits) hands.gloved = true;
  }
  return hands;
}

/** Where a spot's name chip sits so it stays inside the photograph near the edges. */
function chipPlace(spot: { x: number; y: number }): string {
  const vertical = spot.y > 70 ? 'bottom-full mb-0.5' : 'top-full mt-0.5';
  const horizontal = spot.x < 15 ? 'left-0' : spot.x > 85 ? 'right-0' : 'left-1/2 -translate-x-1/2';
  return `${vertical} ${horizontal}`;
}

function describe(hands: Hands, verdict: 'right' | 'wrong' | null, startGloved: boolean): string {
  const parts: string[] = [];
  if (verdict === 'right') parts.push('Gloves on.');
  else if (verdict === 'wrong') parts.push('The gloves stay in the box.');
  else if (hands.gloved) parts.push(startGloved && !hands.washed ? 'Still in the gloves and apron from the wipe.' : 'Gloved.');
  else if (!hands.washed) parts.push('Not washed yet.');
  else if (hands.dirtiedBy.length > 0) parts.push(`Not clean any more: touched ${hands.dirtiedBy.join(', ')}.`);
  else parts.push(hands.wet ? 'Washed, still wet.' : 'Clean and dry.');
  if (hands.towel) parts.push('Paper towel in hand.');
  if (hands.running) parts.push('The tap is still running.');
  if (hands.worn.length > 0) parts.push(`Wearing: ${hands.worn.join(', ')}.`);
  return parts.join(' ');
}

export function TouchesInteraction({ decision, presentation, answer, ownPace, frozen, onAnswer, isOpen, onClose }: InteractionProps<'touches'>) {
  const saved = Array.isArray(answer) ? answer : null;
  const answered = isAnswered(answer) && saved !== null;
  const right = answered && isCorrect(decision, answer);
  const [draft, setDraft] = useState<string[]>([]);
  const [line, setLine] = useState('');
  const [tapThrough, setTapThrough] = useState<{ spotId: string; done: number } | null>(null);
  const sheet = useRef<HTMLElement>(null);
  const verdict = useRef<HTMLDivElement>(null);
  const tapControl = useRef<HTMLButtonElement>(null);
  const route = answered ? saved : draft;
  const hands = readHands(route, presentation);
  // A wrong route leaves the gloves in the box: the picture shows the hands as they were before that last touch.
  const shown = answered && !right ? readHands(route.slice(0, -1), presentation) : hands;
  const busy = frozen || answered || tapThrough !== null;
  // The tap can be held again once clean hands have touched something they should not have.
  const clean = hands.washed && hands.dirtiedBy.length === 0;
  const label = (id: string) => decision.options.find((option) => option.id === id)?.label ?? id;

  // The same spot touched twice running is one touch continuing (a second paper towel, a second look at the phone).
  const record = (id: string) => {
    const next = route.at(-1) === id ? route : [...route, id];
    if (id === presentation.commits) onAnswer(next);
    else setDraft(next);
  };
  const hold = useHold({
    seconds: presentation.hold.seconds, ownPace, disabled: busy || clean || !isOpen, sound: 'water-run', early: presentation.hold.early,
    onStart: () => { setLine(hands.gloved && presentation.hold.whileGloved ? presentation.hold.whileGloved : ''); },
    onComplete: () => { kitchenAudio.play('confirm'); record(presentation.hold.optionId); },
  });
  const touch = (spotId: string) => {
    if (busy) return;
    const spot = presentation.spots[spotId];
    kitchenAudio.play('tap');
    if (!hands.washed && spot.beforeWash) {
      setLine(spot.beforeWash);
      return;
    }
    const throughTowel = hands.towel && Boolean(spot.withTowel);
    setLine((throughTowel && spot.lineWithTowel) || spot.line || '');
    if (spot.tapThrough) {
      setTapThrough({ spotId, done: 0 });
      return;
    }
    record(throughTowel ? spot.withTowel! : spot.records);
  };
  const wear = () => {
    if (!tapThrough) return;
    const spot = presentation.spots[tapThrough.spotId];
    const items = spot.tapThrough ?? [];
    kitchenAudio.play('tap');
    if (tapThrough.done + 1 < items.length) {
      setTapThrough({ ...tapThrough, done: tapThrough.done + 1 });
      return;
    }
    setTapThrough(null);
    record(spot.records);
  };
  const restart = () => {
    kitchenAudio.play('page');
    onAnswer([]);
  };

  // The tap keeps running from the end of the wash until a touch turns it off (or the route ends).
  const running = isOpen && !answered && hands.running;
  useEffect(() => {
    if (running) playSfx('water-run');
    else stopSfx('water-run');
    return () => stopSfx('water-run');
  }, [running]);

  // The stage's Try again clears the answer from outside: the route starts afresh, not from the old draft.
  const wasAnswered = useRef(answered);
  const focusTap = useRef(false);
  useEffect(() => {
    if (wasAnswered.current && !answered) {
      setDraft([]);
      setLine('');
      setTapThrough(null);
      focusTap.current = true;
    }
    wasAnswered.current = answered;
  }, [answered]);
  useEffect(() => {
    if (focusTap.current && tapControl.current) {
      focusTap.current = false;
      tapControl.current.focus();
    }
  });

  // The route is committed from the bottom of a scrolled sheet on a short screen: bring the verdict into view and focus.
  useEffect(() => {
    if (!answered || !isOpen) return;
    if (sheet.current) sheet.current.scrollTop = 0;
    verdict.current?.focus();
  }, [answered, isOpen]);

  const litHold = Math.round(hold.elapsed / presentation.hold.seconds * presentation.poster.hold.length);
  const tapIsHold = !hands.washed && !hands.running;
  const spots = inReadingOrder(Object.entries(presentation.spots), (spot) => spot)
    .filter(([, spot]) => !(spot.stopsSound && tapIsHold));
  const wearing = tapThrough ? presentation.spots[tapThrough.spotId].tapThrough ?? [] : [];

  return (
    <CloseUp isOpen={isOpen} onClose={onClose} title={presentation.title}>
      <section ref={sheet} data-testid={`decision-${decision.id}`} className="max-h-full overflow-y-auto rounded-xl bg-slate-950 p-3 text-white">
        <p className="mb-2 text-sm font-semibold">{decision.prompt}</p>
        {answered && (
          <div ref={verdict} tabIndex={-1} className="focus:outline-none">
            <CheckFeedback kind={right ? 'ok' : 'issue'} speaker={decision.feedback.speaker} tone="light" testId={`feedback-sheet-${decision.id}`}>
              {right ? decision.feedback.right : decision.feedback.wrong}
            </CheckFeedback>
            <div className="my-2 flex flex-wrap gap-2">
              <Button type="button" onClick={() => { kitchenAudio.play('page'); onClose(); }}>Done</Button>
              {!frozen && <Button type="button" variant="secondary" data-testid={`restart-${decision.id}`} onClick={restart}>Start again</Button>}
            </div>
          </div>
        )}
        {/* The photograph keeps its 16:10 frame whole (spots are percentages of it), so it is capped by height, not cropped. */}
        <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-lg" style={{ maxWidth: 'calc(min(40svh, 20rem) * 1.6)' }}>
          <img src={presentation.picture} alt="The hand-wash sink and the PPE station beside it" className="h-full w-full object-cover" />
          {!answered && tapIsHold && !frozen && (
            <span aria-hidden="true" className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-sky-300"
              style={{ left: `${presentation.hold.spot.x}%`, top: `${presentation.hold.spot.y}%` }} />
          )}
          {!answered && !frozen && spots.map(([id, spot]) => (
            <button key={id} type="button" data-testid={`touch-${decision.id}-${id}`}
              aria-label={spot.stopsSound && hands.running ? `${spot.label}, running` : spot.label}
              disabled={busy}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/35 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:opacity-60"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onClick={() => touch(id)}>
              <span aria-hidden="true" className={`pointer-events-none absolute whitespace-nowrap rounded bg-slate-950/80 px-1 text-[10px] font-semibold leading-4 ${chipPlace(spot)}`}>{spot.stopsSound && hands.running ? `${spot.label}, running` : spot.label}</span>
            </button>
          ))}
        </div>

        {tapThrough && (
          <div className="my-2 rounded-lg border border-sky-300/60 p-2" data-testid={`wear-${decision.id}`}>
            <p className="text-xs uppercase tracking-widest text-sky-200">{presentation.spots[tapThrough.spotId].label}</p>
            <ol className="my-1 flex flex-wrap gap-1 text-xs" aria-label="Putting on">
              {wearing.map((item, i) => <li key={item} className={`rounded px-1.5 py-0.5 ${i < tapThrough.done ? 'bg-sky-300 text-slate-950' : 'bg-slate-800'}`}>{item}{i < tapThrough.done ? ' on' : ''}</li>)}
            </ol>
            <Button type="button" className="w-full" onClick={wear}>{wearing[tapThrough.done]} on</Button>
          </div>
        )}

        {!answered && !clean && (
          <>
            <div className="my-2 h-2 overflow-hidden rounded bg-slate-700"><div className="h-full bg-sky-300" style={{ width: `${Math.min(100, hold.elapsed / presentation.hold.seconds * 100)}%` }} /></div>
            <button ref={tapControl} type="button" disabled={busy} aria-pressed={ownPace ? hold.active : undefined}
              className="min-h-12 w-full rounded bg-sky-300 px-4 font-bold text-slate-950 disabled:opacity-60" {...hold.bind}>
              {hold.label(presentation.hold.control)}
            </button>
          </>
        )}

        {(hold.early || line) && !answered && <p aria-hidden="true" className="my-2 border-l-4 border-amber-400 pl-3 text-sm">{hold.early || line}</p>}
        <div className="my-2 flex items-start gap-3">
          <div className="relative w-28 shrink-0 overflow-hidden rounded-md" data-testid={`hands-${decision.id}`} data-marks={shown.marks.length}>
            <img src={presentation.hands.image} alt={presentation.hands.alt} className="aspect-[16/10] w-full object-cover" />
            {shown.gloved && <div aria-hidden="true" className="absolute inset-0 bg-sky-500/55 mix-blend-multiply" />}
            {shown.marks.map((mark, i) => (
              <span key={i} aria-hidden="true" className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-700/70 blur-[1px]"
                style={{ left: `${mark.x}%`, top: `${mark.y}%` }} />
            ))}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p role="status" data-testid={`hands-status-${decision.id}`}>
              {!answered && (hold.early || line) ? `${hold.early || line} ` : ''}
              {describe(hands, answered ? (right ? 'right' : 'wrong') : null, Boolean(presentation.startGloved))}
            </p>
            {route.length > 0 && (
              <ol className="mt-1 flex flex-wrap gap-1 text-xs" aria-label="What your hands have touched, in order" data-testid={`route-${decision.id}`}>
                {route.map((id, i) => <li key={`${id}-${i}`} className="rounded bg-slate-800 px-1.5 py-0.5">{i + 1}. {label(id)}</li>)}
              </ol>
            )}
          </div>
        </div>

        <ol className="my-2 grid grid-cols-4 gap-1 sm:grid-cols-6" aria-label="Handwashing poster">
          {presentation.poster.hold.map((step, i) => (
            <li key={step} className={`rounded p-1 text-center text-[11px] leading-tight ${hands.washed || litHold >= i + 1 ? 'bg-sky-300 text-slate-950' : 'bg-slate-800'}`}>{step}</li>
          ))}
          {presentation.poster.then.map((step) => (
            <li key={step.label} className={`rounded p-1 text-center text-[11px] leading-tight ${route.some((id) => step.lit.includes(id)) ? 'bg-sky-300 text-slate-950' : 'bg-slate-800'}`}>{step.label}</li>
          ))}
        </ol>

      </section>
    </CloseUp>
  );
}
