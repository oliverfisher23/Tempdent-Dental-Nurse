import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@kit/ui/button';
import { kitchenAudio } from '@kit/lib/audio';
import {
  TASKS,
  isAnswered,
  isCorrect,
  type Decision,
  type DecisionAnswer,
  type DecisionAnswers,
  type PresentationOf,
  type TaskScene,
} from '@client/content/tasks';
import { WORKPLACE } from '@client/content/client';
import { currentDecision, isVisible } from './current';
import { BACKDROP_ASPECT, presentationFor } from './presentation';
import { INTERACTIONS } from './interactions';
import { Hotspot } from '@shell/frame/hotspot';
import { useKitchenAction, useWorkspaceOpen } from '@shell/frame/kitchen-context';
import { ChevronDown, Check, X } from 'lucide-react';

interface StageSceneProps {
  taskId: string;
  scene: TaskScene;
  answers: DecisionAnswers;
  frozen: boolean;
  onAnswer: (decisionId: string, answer: DecisionAnswers[string]) => void;
}

const PAN_HINT_SHOWN = new Set<string>();
const PHOTO_GUTTER = 128;
const PANEL_SCROLL_GAP = 28;
const RAIL_SCROLL_PADDING = 60;
let RAIL_EXPANDED = false;

export function StageScene({ taskId, scene, answers, frozen, onAnswer }: StageSceneProps) {
  const task = TASKS[taskId];
  const next = currentDecision(task, answers, scene);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(() => RAIL_EXPANDED);
  const visible = scene.decisions.filter((decision) => isVisible(decision, answers));
  const focused = focusId ? visible.find((decision) => decision.id === focusId) : undefined;
  const decision = focused ?? next?.decision ?? null;
  const backdrop = WORKPLACE.places[scene.place]?.backdrop;
  const stageRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [panelHeight, setPanelHeight] = useState(0);
  const learnerPanned = useRef(false);
  const centring = useRef(false);
  const [panHint, setPanHint] = useState(false);

  useEffect(() => {
    if (focusId && !visible.some((item) => item.id === focusId)) setFocusId(null);
  }, [focusId, visible]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const photoBox = (() => {
    const { width: stageWidth, height: stageHeight } = stageSize;
    if (!stageWidth || !stageHeight) return { width: 0, height: 0 };
    if (stageWidth / stageHeight > BACKDROP_ASPECT) {
      const height = stageWidth / BACKDROP_ASPECT;
      return { width: stageWidth, height };
    }
    const width = stageHeight * BACKDROP_ASPECT;
    return { width, height: stageHeight };
  })();
  const photoStyle: CSSProperties & { '--dialogue-h': string } = {
    width: photoBox.width,
    height: photoBox.height,
    marginInline: PHOTO_GUTTER,
    marginTop: RAIL_SCROLL_PADDING,
    '--dialogue-h': '0px',
  };
  const canvasStyle: CSSProperties = {
    width: photoBox.width + PHOTO_GUTTER * 2,
    height: RAIL_SCROLL_PADDING + photoBox.height + panelHeight + PANEL_SCROLL_GAP,
  };
  const bottomClearance = panelHeight + PANEL_SCROLL_GAP;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !stageSize.width || learnerPanned.current) return;
    centring.current = true;
    scroller.scrollLeft = Math.max(0, (photoBox.width + PHOTO_GUTTER * 2 - stageSize.width) / 2);
    scroller.scrollTop = RAIL_SCROLL_PADDING + Math.max(0, (photoBox.height - stageSize.height) / 2);
    const frame = requestAnimationFrame(() => { centring.current = false; });
    return () => cancelAnimationFrame(frame);
  }, [photoBox.height, photoBox.width, stageSize.height, stageSize.width]);

  useEffect(() => {
    const overflow = photoBox.width > stageSize.width || photoBox.height > stageSize.height;
    const key = `${taskId}:${scene.place}`;
    if (!overflow || PAN_HINT_SHOWN.has(key) || !window.matchMedia('(pointer: coarse)').matches) return;
    PAN_HINT_SHOWN.add(key);
    setPanHint(true);
    const timer = window.setTimeout(() => setPanHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, [photoBox.height, photoBox.width, scene.place, stageSize.height, stageSize.width, taskId]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let adjusting = false;
    const keepVisible = (target: HTMLElement) => {
      if (adjusting) return;
      const viewport = scroller.getBoundingClientRect();
      const bounds = target.getBoundingClientRect();
      const panel = stageRef.current?.querySelector<HTMLElement>('[data-testid^="decision-"]');
      const panelTop = panel?.getBoundingClientRect().top ?? viewport.bottom - bottomClearance;
      const safeBottom = Math.min(viewport.bottom - bottomClearance, panelTop - 8);
      let top = scroller.scrollTop;
      let left = scroller.scrollLeft;
      const safeHeight = safeBottom - viewport.top - RAIL_SCROLL_PADDING;
      if (bounds.bottom > safeBottom) {
        top += bounds.bottom - safeBottom;
      } else if (safeHeight >= bounds.height && bounds.top < viewport.top + RAIL_SCROLL_PADDING) {
        top += bounds.top - viewport.top - RAIL_SCROLL_PADDING;
      } else if (safeHeight < bounds.height && bounds.top < viewport.top + 4) {
        top += bounds.top - viewport.top - 4;
      }
      if (bounds.left < viewport.left + 12) left += bounds.left - viewport.left - 12;
      else if (bounds.right > viewport.right - 12) left += bounds.right - viewport.right + 12;
      if (top !== scroller.scrollTop || left !== scroller.scrollLeft) {
        adjusting = true;
        scroller.scrollTo({ top, left, behavior: 'auto' });
        adjusting = false;
      }
    };
    const keepFocusedPinVisible = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target === scroller) return;
      queueMicrotask(() => keepVisible(target));
    };
    const correctNativeFocusScroll = () => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && scroller.contains(active)) keepVisible(active);
    };
    const prepareTabTarget = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = [...scroller.querySelectorAll<HTMLElement>('button:not([disabled])')];
      const index = buttons.indexOf(document.activeElement as HTMLElement);
      const next = buttons[index + (event.shiftKey ? -1 : 1)];
      if (next) {
        event.preventDefault();
        keepVisible(next);
        next.focus({ preventScroll: true });
      }
    };
    scroller.addEventListener('focusin', keepFocusedPinVisible);
    scroller.addEventListener('scroll', correctNativeFocusScroll);
    scroller.addEventListener('keydown', prepareTabTarget, true);
    return () => {
      scroller.removeEventListener('focusin', keepFocusedPinVisible);
      scroller.removeEventListener('scroll', correctNativeFocusScroll);
      scroller.removeEventListener('keydown', prepareTabTarget, true);
    };
  }, [bottomClearance]);

  return (
    <section ref={stageRef} className="absolute inset-0 overflow-clip bg-zinc-900 text-foreground" data-testid={`scene-${scene.place}`}>
      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          overscrollBehavior: 'contain',
          touchAction: 'pan-x pan-y',
          scrollPaddingTop: RAIL_SCROLL_PADDING,
          scrollPaddingBottom: bottomClearance,
        }}
        data-testid="photo-scroller"
        onPointerDown={() => { learnerPanned.current = true; }}
        onWheel={() => { learnerPanned.current = true; }}
        onKeyDown={() => { learnerPanned.current = true; }}
        onScroll={() => {
          if (!centring.current) learnerPanned.current = true;
        }}
      >
        <div className="relative" style={canvasStyle}>
          <div ref={photoRef} className="relative" style={photoStyle} data-testid="photo-box">
            {backdrop && <img src={backdrop} alt="" className="h-full w-full" aria-hidden="true" />}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65" />

      <ProgressRail
        scene={scene}
        answers={answers}
        visible={visible}
        currentId={decision?.id}
        open={railOpen}
        onToggle={() => setRailOpen((value) => {
          RAIL_EXPANDED = !value;
          return RAIL_EXPANDED;
        })}
        onFocus={(id) => {
          setFocusId(id);
          setRailOpen(false);
        }}
      />
      {decision ? (
        <DecisionPanel
          key={decision.id}
          taskId={taskId}
          decision={decision}
          answer={answers[decision.id] ?? null}
          photoBox={photoRef.current}
          panHint={panHint}
          compact={stageSize.height < 320}
          onPanelHeight={setPanelHeight}
          frozen={frozen}
          onAnswer={(answer) => {
            setFocusId(decision.id);
            onAnswer(decision.id, answer);
          }}
          onCarryOn={() => setFocusId(null)}
        />
      ) : visible.length === 0 && scene.decisions.length > 0 ? (
        <div className="absolute bottom-4 left-1/2 z-20 w-[min(92%,40rem)] -translate-x-1/2 rounded-md border border-white/20 bg-white/95 p-4 shadow-2xl">
          <p className="text-sm text-muted-foreground" data-testid="scene-waiting">Nothing to do here yet.</p>
        </div>
      ) : (
        <div
          data-testid={`decision-${scene.decisions[scene.decisions.length - 1]?.id}`}
          data-state="right"
          className="absolute bottom-4 left-1/2 z-20 w-[min(92%,40rem)] -translate-x-1/2 rounded-md border border-white/20 bg-white/95 p-4 shadow-2xl"
        >
          <p className="font-semibold">Everything in this room is ready.</p>
        </div>
      )}
    </section>
  );
}

function ProgressRail({
  scene,
  answers,
  visible,
  currentId,
  open,
  onToggle,
  onFocus,
}: {
  scene: TaskScene;
  answers: DecisionAnswers;
  visible: Decision[];
  currentId?: string;
  open: boolean;
  onToggle: () => void;
  onFocus: (id: string) => void;
}) {
  const allRight = scene.decisions.every((item) =>
    isAnswered(answers[item.id]) && isCorrect(item, answers[item.id] ?? null)
  );
  const currentNumber = allRight
    ? scene.decisions.length
    : Math.max(1, scene.decisions.findIndex((item) => item.id === currentId) + 1);
  return (
    <nav aria-label={`${scene.title} progress`} className="absolute left-3 top-3 z-20 max-w-[min(20rem,calc(100%-1.5rem))]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-10 items-center gap-2 rounded-md border border-white/30 bg-black/75 px-3 text-sm font-bold text-white shadow-lg"
      >
        {currentNumber} of {scene.decisions.length}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <ol className={`${open ? 'mt-1 flex' : 'hidden'} max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-white/20 bg-black/75 p-2 shadow-xl`}>
        {(scene.people?.length ?? 0) > 0 && (
          <li
            data-testid={`people-${scene.place}`}
            className="truncate border-b border-white/20 px-2 pb-2 text-xs font-bold text-white"
          >
            With you: {scene.people
              ?.map((id) => WORKPLACE.people.find((person) => person.id === id)?.name)
              .filter((name): name is string => Boolean(name))
              .join(', ')}
          </li>
        )}
        {scene.decisions.map((item) => {
          const shown = visible.includes(item);
          if (!shown) {
            return (
              <li
                key={item.id}
                data-testid={`rail-${item.id}`}
                data-state="locked"
                aria-hidden="true"
                className="h-7 rounded bg-white/5"
              />
            );
          }
          const answered = isAnswered(answers[item.id]);
          const right = answered && isCorrect(item, answers[item.id] ?? null);
          const state = answered ? (right ? 'right' : 'wrong') : 'open';
          return (
            <li key={item.id}>
              <button
                type="button"
                data-testid={`rail-${item.id}`}
                data-state={state}
                aria-current={item.id === currentId ? 'step' : undefined}
                disabled={!answered}
                onClick={() => onFocus(item.id)}
                className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  item.id === currentId ? 'bg-white/20' : 'hover:bg-white/10'
                } disabled:cursor-default disabled:opacity-70`}
              >
                <span className="mt-0.5 w-4 shrink-0" aria-hidden="true">
                  {right ? <Check className="h-4 w-4" /> : answered ? <X className="h-4 w-4" /> : '–'}
                </span>
                <span>{item.clause}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function DecisionPanel({
  taskId,
  decision,
  answer,
  photoBox,
  panHint,
  compact,
  onPanelHeight,
  frozen,
  onAnswer,
  onCarryOn,
}: {
  taskId: string;
  decision: Decision;
  answer: DecisionAnswer;
  photoBox: HTMLDivElement | null;
  panHint: boolean;
  compact: boolean;
  onPanelHeight: (height: number) => void;
  frozen: boolean;
  onAnswer: (answer: DecisionAnswer) => void;
  onCarryOn: () => void;
}) {
  const presentation = presentationFor(decision);
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  const [editing, setEditing] = useState(!answered);
  const savedList = Array.isArray(answer) ? answer : [];
  const [hotspotDraft, setHotspotDraft] = useState<string[]>(savedList);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (!isAnswered(answer)) setEditing(true);
  }, [answer]);
  useEffect(() => setHotspotDraft(savedList), [JSON.stringify(savedList)]);
  useEffect(() => {
    if (answered && !editing) feedbackRef.current?.focus({ preventScroll: true });
  }, [answered, editing, answer]);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => {
      const height = panel.getBoundingClientRect().height;
      setPanelHeight(height);
      onPanelHeight(height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [onPanelHeight]);

  const change = () => setEditing(true);
  const finish = (value: DecisionAnswer) => {
    onAnswer(value);
    setEditing(false);
  };
  const pickHotspot = (id: string) => {
    if (decision.kind === 'choice') {
      finish(id);
      return;
    }
    if (decision.kind === 'sequence') {
      if (hotspotDraft.includes(id)) return;
      const next = [...hotspotDraft, id];
      setHotspotDraft(next);
      const expected = Array.isArray(decision.correct) ? decision.correct.length : 1;
      if (next.length >= expected) finish(next);
      return;
    }
    setHotspotDraft((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  return (
    <>
      {presentation.kind === 'hotspots' && editing && photoBox && createPortal(
        <HotspotLayer
          decision={decision}
          presentation={presentation}
          frozen={frozen}
          draft={hotspotDraft}
          pick={pickHotspot}
        />,
        photoBox,
      )}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-opacity duration-500 ${
          panHint ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ bottom: panelHeight + (presentation.kind === 'hotspots' && editing ? 20 : 76) }}
      >
        Swipe to look around
      </div>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="group"
        data-testid={`decision-${decision.id}`}
        data-state={answered ? (right ? 'right' : 'wrong') : 'open'}
        className={`absolute left-1/2 z-20 max-h-[52%] w-[min(94%,46rem)] -translate-x-1/2 overflow-y-auto rounded-md border border-white/20 border-t-4 border-t-primary bg-white/95 p-4 shadow-2xl backdrop-blur-sm sm:max-h-[56%] short:max-h-[62%] short:p-3 ${
          presentation.kind === 'hotspots' && editing ? 'bottom-3' : 'bottom-[4.25rem]'
        } ${presentation.kind === 'hotspots' && editing ? 'pointer-events-none' : ''} ${
          workspaceOpen ? 'invisible pointer-events-none' : ''
        }`}
      >
        {(presentation.kind === 'speech' || presentation.kind === 'hotspots') && (
          <InlineGuideAction action={decision.id} target={panelRef} />
        )}
        {answered && !editing ? (
          <div ref={feedbackRef} tabIndex={-1} role="status" data-testid={`feedback-${decision.id}`} className="outline-none">
            <p className={`border-l-4 pl-3 text-sm leading-relaxed ${right ? 'border-primary' : 'border-destructive'}`}>
              <strong>{decision.feedback.speaker}: </strong>
              {right ? decision.feedback.right : decision.feedback.wrong}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onCarryOn}>Carry on</Button>
              {!frozen && (
                <Button type="button" size="sm" variant="secondary" data-testid={`change-${decision.id}`} onClick={change}>
                  Change answer
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {decision.context && <p className="mb-1 text-xs italic text-muted-foreground">{decision.context}</p>}
            <p className="font-semibold">{decision.prompt}</p>
            {presentation.kind === 'hotspots' && decision.kind !== 'choice' && (
              <HotspotLog decision={decision} picked={hotspotDraft} compact={compact} />
            )}
            <div className="mt-3">
              {presentation.kind === 'speech' && (
                decision.kind === 'checklist' ? (
                  <ChecklistButtons
                    decision={decision}
                    draft={hotspotDraft}
                    frozen={frozen}
                    setDraft={setHotspotDraft}
                    onAnswer={finish}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {decision.options.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        variant={answer === option.id ? 'default' : 'outline'}
                        aria-pressed={answer === option.id}
                        disabled={frozen}
                        data-testid={`option-${decision.id}-${option.id}`}
                        className="h-auto justify-start whitespace-normal py-2 text-left"
                        onClick={() => {
                          kitchenAudio.play('tap');
                          finish(option.id);
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )
              )}
              {presentation.kind === 'hotspots' && (
                <HotspotPanel
                  decision={decision}
                  presentation={presentation}
                  frozen={frozen}
                  draft={hotspotDraft}
                  setDraft={setHotspotDraft}
                  pick={pickHotspot}
                  onAnswer={finish}
                />
              )}
              {presentation.kind !== 'speech' && presentation.kind !== 'hotspots' && (
                <CloseUpDecision
                  taskId={taskId}
                  decision={decision}
                  presentation={presentation}
                  answer={answer}
                  frozen={frozen}
                  initiallyOpen={answered}
                  onAnswer={onAnswer}
                  onFinished={() => setEditing(false)}
                  onOpenChange={setWorkspaceOpen}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function HotspotLog({ decision, picked, compact }: { decision: Decision; picked: string[]; compact: boolean }) {
  const labels = picked.flatMap((id) => {
    const option = decision.options.find((item) => item.id === id);
    return option ? [option.label] : [];
  });
  if (compact) {
    const last = labels[labels.length - 1];
    const progress = decision.kind === 'sequence'
      ? `${labels.length} of ${Array.isArray(decision.correct) ? decision.correct.length : decision.options.length} done`
      : `${labels.length} ticked`;
    return (
      <p
        data-testid={`log-${decision.id}`}
        aria-live="polite"
        className="mt-1 truncate text-xs text-muted-foreground"
      >
        {progress}{last ? `, last: ${last}` : ''}
      </p>
    );
  }
  const listClass = 'mt-2 max-h-24 overflow-y-auto rounded border border-border/70 bg-white/70 px-3 py-2 text-xs';
  if (labels.length === 0) return <div data-testid={`log-${decision.id}`} />;
  return (
    <div data-testid={`log-${decision.id}`} aria-live="polite">
      {decision.kind === 'sequence' ? (
        <ol className={`${listClass} list-decimal pl-7`}>
          {labels.map((label, index) => <li key={`${index}:${label}`} className="pl-1">{label}</li>)}
        </ol>
      ) : (
        <ul className={`${listClass} list-disc pl-7`}>
          {labels.map((label) => <li key={label} className="pl-1">{label}</li>)}
        </ul>
      )}
    </div>
  );
}

function ChecklistButtons({
  decision,
  draft,
  frozen,
  setDraft,
  onAnswer,
}: {
  decision: Decision;
  draft: string[];
  frozen: boolean;
  setDraft: (answer: string[]) => void;
  onAnswer: (answer: DecisionAnswer) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {decision.options.map((option) => {
        const selected = draft.includes(option.id);
        return (
          <Button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            variant={selected ? 'default' : 'outline'}
            disabled={frozen}
            data-testid={`option-${decision.id}-${option.id}`}
            className="pointer-events-auto h-auto justify-start whitespace-normal py-2 text-left"
            onClick={() => {
              kitchenAudio.play('write');
              setDraft(selected ? draft.filter((id) => id !== option.id) : [...draft, option.id]);
            }}
          >
            {option.label}
          </Button>
        );
      })}
      <Button
        type="button"
        size="sm"
        disabled={frozen || draft.length === 0}
        data-testid={`confirm-${decision.id}`}
        className="self-start"
        onClick={() => {
          kitchenAudio.play('write');
          onAnswer(draft);
        }}
      >
        Confirm
      </Button>
    </div>
  );
}

function InlineGuideAction({ action, target }: { action: string; target: RefObject<HTMLDivElement | null> }) {
  useKitchenAction(action, () => target.current?.focus({ preventScroll: true }));
  return null;
}

interface HotspotEditorProps {
  decision: Decision;
  presentation: PresentationOf<'hotspots'>;
  frozen: boolean;
  draft: string[];
  pick: (id: string) => void;
  onAnswer: (answer: DecisionAnswer) => void;
}

function HotspotLayer({ decision, presentation, frozen, draft, pick }: Omit<HotspotEditorProps, 'onAnswer'>) {
  const offstage = new Set(presentation.offstage ?? []);
  return (
    <>
      {decision.options.filter((option) => !offstage.has(option.id)).map((option) => {
        const spot = presentation.spots[option.id];
        if (!spot) return null;
        return (
          <div
            key={option.id}
            data-testid={`option-${decision.id}-${option.id}`}
            className="absolute h-12 w-12"
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)' }}
            title={option.label}
          >
            <Hotspot
              x={50}
              y={50}
              label={option.label}
              className="[&_[data-testid=hotspot-label]]:hidden"
              state={frozen ? 'locked' : draft.includes(option.id) ? 'done' : 'todo'}
              onClick={frozen ? undefined : () => pick(option.id)}
            />
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 line-clamp-2 w-max max-w-[11rem] -translate-x-1/2 rounded bg-foreground px-2 py-1 text-center text-xs font-bold leading-tight text-background shadow-lg">
              {spot.hint ?? option.label}
            </span>
          </div>
        );
      })}
    </>
  );
}

function HotspotPanel({
  decision,
  presentation,
  frozen,
  draft,
  setDraft,
  pick,
  onAnswer,
}: HotspotEditorProps & { setDraft: (answer: string[]) => void }) {
  const offstage = new Set(presentation.offstage ?? []);
  return (
    <div className="flex flex-col gap-2">
      {decision.options.filter((option) => offstage.has(option.id)).map((option) => {
        const selected = draft.includes(option.id);
        return (
          <Button
            key={option.id}
            type="button"
            variant={selected ? 'default' : 'outline'}
            aria-pressed={selected}
            disabled={frozen || (decision.kind === 'sequence' && selected)}
            data-testid={`option-${decision.id}-${option.id}`}
            className="pointer-events-auto h-auto justify-start whitespace-normal py-2 text-left"
            onClick={() => {
              kitchenAudio.play(decision.kind === 'checklist' ? 'write' : 'tap');
              pick(option.id);
            }}
          >
            {option.label}
          </Button>
        );
      })}
      <div className="flex gap-2">
        {decision.kind === 'checklist' && (
          <Button
            type="button"
            size="sm"
            disabled={frozen || draft.length === 0}
            data-testid={`confirm-${decision.id}`}
            className="pointer-events-auto"
            onClick={() => {
              kitchenAudio.play('write');
              onAnswer(draft);
            }}
          >
            Confirm
          </Button>
        )}
        {decision.kind === 'sequence' && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={frozen || draft.length === 0}
            data-testid={`restart-${decision.id}`}
            className="pointer-events-auto"
            onClick={() => setDraft([])}
          >
            Start again
          </Button>
        )}
      </div>
    </div>
  );
}

function CloseUpDecision({
  taskId,
  decision,
  presentation,
  answer,
  frozen,
  initiallyOpen,
  onAnswer,
  onFinished,
  onOpenChange,
}: {
  taskId: string;
  decision: Decision;
  presentation: Exclude<ReturnType<typeof presentationFor>, PresentationOf<'speech'> | PresentationOf<'hotspots'>>;
  answer: DecisionAnswer;
  frozen: boolean;
  initiallyOpen: boolean;
  onAnswer: (answer: DecisionAnswer) => void;
  onFinished: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => {
    if (initiallyOpen) kitchenAudio.play('page');
  }, [initiallyOpen]);
  const show = useCallback(() => {
    if (frozen) return;
    kitchenAudio.play('page');
    setOpen(true);
  }, [frozen]);
  const close = useCallback(() => {
    kitchenAudio.play('page');
    setOpen(false);
    if (isAnswered(answer)) onFinished();
  }, [answer, onFinished]);
  useKitchenAction(decision.id, show);
  useWorkspaceOpen(open ? decision.id : null);
  useEffect(() => {
    onOpenChange(open);
    return () => onOpenChange(false);
  }, [onOpenChange, open]);
  const Interaction = INTERACTIONS[presentation.kind];

  return (
    <>
      <Button type="button" disabled={frozen} data-testid={`open-${decision.id}`} onClick={show}>
        {presentation.open}
      </Button>
      <Interaction
        taskId={taskId}
        decision={decision}
        presentation={presentation as never}
        answer={answer}
        frozen={frozen}
        onAnswer={onAnswer}
        isOpen={open}
        onClose={close}
      />
    </>
  );
}