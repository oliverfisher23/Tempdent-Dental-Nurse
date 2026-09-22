import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Thermometer, Ruler as RulerIcon, ClipboardList, Play, Clock, Check, X } from 'lucide-react';
import { PREP_SHEET, CHILLER_SHELVES, CHILL_RULES, YOUR_TRAY_READINGS, PROBE_PLACEMENTS, nextChillMark, type ProbePlacementId, type ChillInterval } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { CoolingRecordSummary } from './cooling-record-summary';
import { parseNumber, readingIsRight, traysHaveSpace, type ChillState } from '@/lib/simulation';
import { useProgress } from '@/lib/progress-store';
import { useFocusTrap } from '../../kitchen/use-focus-trap';
import { kitchenAudio } from '@/lib/audio';
import { scrollWithinScroller } from '@/lib/scroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, upperFirst } from '@/lib/utils';
import { useDraggable, useDropZone, HoldToRead } from '../../kitchen/interact';
import { TRAY_DEPTH_MM, type ChillActions } from './types';
import { AnalogueThermometer } from '../../kitchen/analogue-thermometer';
import { WorkspaceOpener } from '@/components/kitchen/workspace-opener';

const BEEF = 'linear-gradient(to top, #3f1f0f, #7a4222 70%, #8f5330)';

type SectionZone = 'surface' | 'centre' | 'metal';

/** Which of the student's trays holds the most. Ties go to the first. */
export function fullestTray(trays: number[]): number {
  return trays.reduce((best, kg, i) => (kg > trays[best] ? i : best), 0);
}

// ---------------------------------------------------------------------------
// Trays
// ---------------------------------------------------------------------------

function TrayChip({
  index,
  kg,
  onTrolley,
  touching,
  hasProbe,
  locked,
  canProbe,
  canMeasure,
  measuredMm,
  onProbeDrop,
  onMeasure,
}: {
  index: number;
  kg: number;
  onTrolley: boolean;
  touching: boolean;
  hasProbe: boolean;
  locked: boolean;
  canProbe: boolean;
  canMeasure: boolean;
  measuredMm: number | null;
  onProbeDrop: (trayIndex: number) => void;
  onMeasure: () => void;
}) {
  const label = onTrolley ? L.trayOnTrolley(index + 1, kg) : L.trayLoaded(index + 1, kg);
  const { props, isLifted } = useDraggable({ id: `tray-${index}`, kind: 'tray', label, disabled: locked });
  const accepts = useCallback((kind: string) => (kind === 'probe' && canProbe) || (kind === 'ruler' && canMeasure), [canProbe, canMeasure]);
  const onDrop = useCallback(
    (itemId: string) => {
      if (itemId.startsWith('probe')) onProbeDrop(index);
      else onMeasure();
    },
    [index, onProbeDrop, onMeasure],
  );
  const zone = useDropZone({
    id: `tray-target-${index}`,
    label: L.tray(index + 1),
    accepts,
    onDrop,
    disabled: onTrolley,
  });
  const depth = PREP_SHEET.depthForKg(kg);
  const lit = zone.isOver || zone.isTarget;
  const targetHint = zone.carrying?.toLowerCase().includes('probe') ? L.putProbeHere : L.measureHere;

  return (
    <div
      {...props}
      ref={zone.ref}
      data-drop-zone={zone.props['data-drop-zone']}
      data-can-drop={zone.props['data-can-drop']}
      onClick={(event) => {
        event.stopPropagation();
        zone.props.onClick?.();
      }}
      aria-label={label + (touching ? `. ${L.touching}` : '')}
      className={cn(
        'relative mx-auto h-10 w-[88%] rounded-b-lg border-x-4 border-b-4 border-zinc-300 bg-zinc-100/10 shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-primary',
        isLifted && 'z-50 ring-2 ring-primary',
        touching && 'border-amber-400',
        (lit || zone.canDrop) && 'ring-4 ring-primary ring-offset-2 ring-offset-zinc-950',
        locked && 'cursor-default',
      )}
      style={{ ...props.style, ...zone.props.style }}
      data-testid={`tray-chip-${index}`}
      data-shelved={!onTrolley}
    >
      <div className="absolute inset-x-0 bottom-0 h-full origin-bottom overflow-hidden rounded-b-md" style={{ background: BEEF, transform: `scaleY(${Math.min(1, depth / TRAY_DEPTH_MM)})` }} />
      <div className="relative flex h-full items-center justify-between px-2 text-xs font-bold text-white drop-shadow">
        <span className="uppercase tracking-wider">{L.tray(index + 1)}</span>
        <span className="font-mono">
          {kg.toFixed(2)} kg · {depth} mm
        </span>
      </div>
      {touching && (
        <span className="absolute -top-3 left-2 rounded bg-amber-400 px-1.5 text-xs font-bold uppercase tracking-widest text-black">{L.touching}</span>
      )}
      {hasProbe && (
        <span className="absolute -right-3 -top-4 flex items-center gap-0.5 rounded-full bg-emerald-500 p-1 text-black shadow" title={L.probe}>
          <Thermometer className="h-3.5 w-3.5" />
        </span>
      )}
      {measuredMm !== null && (
        <span className="absolute -bottom-3 right-2 rounded bg-white px-1.5 text-xs font-bold uppercase tracking-widest text-black shadow">{L.depthMeasured(measuredMm)}</span>
      )}
      {zone.canDrop && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-1 text-xs font-bold text-white shadow-lg">
          {targetHint}
        </span>
      )}
    </div>
  );
}

function Shelf({ index, occupied, locked, onLoad, children }: { index: number; occupied: boolean; locked: boolean; onLoad: (trayIndex: number, shelf: number) => void; children?: React.ReactNode }) {
  const accepts = useCallback((kind: string) => kind === 'tray', []);
  const onDrop = useCallback((itemId: string) => onLoad(Number(itemId.replace('tray-', '')), index), [index, onLoad]);
  const { ref, isOver, isTarget, canDrop, carrying, props } = useDropZone({
    id: `shelf-${index}`,
    label: L.shelfZone(index + 1),
    accepts,
    onDrop,
    disabled: occupied || locked,
  });
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'relative flex h-12 items-center border-b border-zinc-800 last:border-b-0 sm:h-[3.25rem]',
        canDrop && !occupied && 'bg-primary/5',
        (isOver || isTarget) && 'bg-primary/25',
      )}
      data-testid={`shelf-${index}`}
    >
      {/* runners */}
      <span className="absolute left-1 top-1/2 h-1 w-3 -translate-y-1/2 rounded bg-zinc-600" />
      <span className="absolute right-1 top-1/2 h-1 w-3 -translate-y-1/2 rounded bg-zinc-600" />
      <span className="absolute left-4 top-1 text-xs font-bold uppercase tracking-widest text-zinc-400">{L.shelf(index + 1)}</span>
      <div className="w-full pt-2">{children}</div>
      {!occupied && !locked && (
        <span className={cn(
          'pointer-events-none absolute inset-x-5 bottom-1 top-4 flex items-center justify-center rounded border border-dashed text-xs font-bold',
          canDrop ? 'border-primary bg-primary/10 text-white' : 'border-zinc-700 text-zinc-400',
        )}>
          {canDrop && carrying ? L.putHere(carrying) : L.emptyShelf}
        </span>
      )}
    </div>
  );
}

function Trolley({ locked, onRemove, children, empty }: { locked: boolean; onRemove: (trayIndex: number) => void; children: React.ReactNode; empty: boolean }) {
  const accepts = useCallback((kind: string) => kind === 'tray', []);
  const onDrop = useCallback((itemId: string) => onRemove(Number(itemId.replace('tray-', ''))), [onRemove]);
  const { ref, isOver, isTarget, props } = useDropZone({ id: 'trolley', label: L.trolleyZone, accepts, onDrop, disabled: locked });
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'flex flex-col gap-4 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-900/60 p-3 transition-colors md:col-start-1 md:row-start-1 md:self-start',
        empty ? 'pb-3' : 'min-h-[9rem] pb-5',
        (isOver || isTarget) && 'border-primary bg-primary/10',
      )}
      data-testid="trolley"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{L.trolley}</span>
      {empty && <span className="text-xs text-zinc-400">{L.trolleyEmpty}</span>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tools on their hooks
// ---------------------------------------------------------------------------

function ProbeTool({ locked, inTray }: { locked: boolean; inTray: number | null }) {
  const { props, isLifted } = useDraggable({ id: 'probe', kind: 'probe', label: L.probe, disabled: locked });
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        {...props}
        aria-label={`${L.probe}: ${L.probeHint}`}
        className={cn('relative flex flex-col items-center outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-lg', isLifted && 'z-50', locked && 'opacity-60')}
        style={props.style}
        data-testid="probe"
      >
        <AnalogueThermometer value={null} className="w-16 h-20 pointer-events-none" />
        <div className="h-10 w-1.5 -mt-3 rounded-b-full bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-sm pointer-events-none" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 text-center max-w-[80px]">
        {inTray !== null ? `${L.probe.replace('The temperature ', '')} in tray ${inTray + 1}` : L.probe.replace('The temperature ', 'Temperature ')}
      </span>
    </div>
  );
}

function RulerTool() {
  const { props, isLifted } = useDraggable({ id: 'ruler', kind: 'ruler', label: L.ruler });
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        {...props}
        aria-label={`${L.ruler}: ${L.rulerHint}`}
        className={cn('relative h-24 w-8 rounded-sm border border-amber-700 bg-amber-200 shadow-md outline-none focus-visible:ring-4 focus-visible:ring-primary', isLifted && 'z-50')}
        style={props.style}
        data-testid="ruler"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={cn('absolute left-0 h-px bg-amber-900', i % 2 === 0 ? 'w-3' : 'w-2')} style={{ top: `${8 + i * 10}%` }} />
        ))}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{L.ruler.replace('The ', '')}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The tray in section: where in the food does the probe go?
// ---------------------------------------------------------------------------

function SectionZoneBox({ id, label, style, onPlace }: { id: SectionZone; label: string; style: React.CSSProperties; onPlace: (zone: SectionZone) => void }) {
  const accepts = useCallback((kind: string) => kind === 'probe', []);
  const onDrop = useCallback(() => onPlace(id), [id, onPlace]);
  const { ref, isOver, isTarget, props } = useDropZone({ id: `probe-zone-${id}`, label, accepts, onDrop });
  return (
    <button
      type="button"
      ref={ref}
      {...props}
      style={style}
      className={cn(
        'absolute flex min-h-11 items-center justify-center rounded-md border-2 border-dashed border-white/50 text-center text-xs font-bold uppercase tracking-wider text-white/90 transition-colors focus-visible:ring-4 focus-visible:ring-primary sm:text-xs',
        (isOver || isTarget) && 'border-primary bg-primary/40 text-white',
      )}
      data-testid={`probe-zone-${id}`}
    >
      {label}
    </button>
  );
}

function SectionProbe() {
  const { props, isLifted } = useDraggable({ id: 'probe-in-hand', kind: 'probe', label: L.probe });
  return (
    <div
      {...props}
      aria-label={`${L.probe}: ${L.probeHint}`}
      className={cn('relative flex flex-col items-center rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-primary cursor-grab active:cursor-grabbing', isLifted && 'z-50')}
      style={props.style}
      data-testid="probe-in-hand"
      autoFocus
    >
      <AnalogueThermometer value={null} className="w-20 h-24 pointer-events-none" clip={false} />
      <div className="h-[4.25rem] w-1.5 -mt-3 rounded-b-full bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-sm pointer-events-none" />
    </div>
  );
}

function TraySection({ trayIndex, kg, onPlace, onClose }: { trayIndex: number; kg: number; onPlace: (zone: SectionZone) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useFocusTrap(ref, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const depth = PREP_SHEET.depthForKg(kg);
  const pct = (mm: number) => `${(mm / TRAY_DEPTH_MM) * 100}%`;
  const surfaceBand = Math.min(12, depth);
  const centreMm = depth / 2;

  return createPortal(
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={L.sectionTitle(trayIndex + 1)}
      ref={ref}
      tabIndex={-1}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 p-4 text-white shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">{L.sectionTitle(trayIndex + 1)}</h3>
            <p className="text-sm text-zinc-300">{L.sectionQuestion}</p>
          </div>
          <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-zinc-300 hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={L.leaveItOut}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="relative mx-auto h-60 w-full max-w-md">
            {/* the tray, cut through */}
            <div className="absolute inset-x-6 bottom-2 top-6 rounded-b-3xl border-x-8 border-b-8 border-zinc-300 bg-zinc-800/70">
              <div className="absolute inset-x-0 bottom-0" style={{ height: pct(depth), background: BEEF }} />
              <span className="absolute -right-1 top-0 translate-x-full text-xs font-bold uppercase tracking-widest text-zinc-400 pl-2">{TRAY_DEPTH_MM} mm</span>
              <span className="absolute -right-1 translate-x-full pl-2 text-xs font-bold uppercase tracking-widest text-amber-300" style={{ bottom: pct(depth) }}>
                {depth} mm
              </span>
              <SectionZoneBox
                id="surface"
                label={L.sectionZones.surface}
                onPlace={onPlace}
                style={{ left: '20%', right: '20%', bottom: pct(depth - surfaceBand), height: pct(surfaceBand) }}
              />
              <SectionZoneBox
                id="centre"
                label={L.sectionZones.centre}
                onPlace={onPlace}
                style={{ left: '28%', right: '28%', bottom: pct(Math.max(0, centreMm - 8)), height: pct(Math.min(16, Math.max(8, centreMm))) }}
              />
              <SectionZoneBox id="metal" label={L.sectionZones.metal} onPlace={onPlace} style={{ left: 0, right: 0, bottom: 0, height: pct(7) }} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <SectionProbe />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{L.probeHint}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-label={L.sectionQuestion}>
          {(Object.entries(L.sectionZones) as [SectionZone, string][]).map(([zone, label]) => (
            <Button key={zone} type="button" variant="outline" className="min-h-11 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white" onClick={() => onPlace(zone)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// The whole chiller: trolley, cabinet, panel
// ---------------------------------------------------------------------------

export function ChillerView({
  state,
  started,
  waiting,
  workspaceRequest,
  actions,
  probeTray,
  onProbeTray,
  onOpenRecord,
}: {
  state: ChillState;
  started: boolean;
  waiting: boolean;
  workspaceRequest: number;
  actions: ChillActions;
  probeTray: number | null;
  onProbeTray: (i: number | null) => void;
  onOpenRecord: () => void;
}) {
  const { progress, jot } = useProgress();
  const [sectionTray, setSectionTray] = useState<number | null>(null);
  const [probed, setProbed] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const m = state.minutesElapsed as ChillInterval;
  const allShelved = state.shelfByTray.every((s) => s !== null);
  const spaced = traysHaveSpace(state.shelfByTray);
  const probeRight = state.probePlacement === 'centre';
  const fullest = fullestTray(state.trays);
  const readingDue = started && !readingIsRight(m, state.readings[m]?.value ?? '');
  const displayReading = probed ?? (readingIsRight(m, state.readings[m]?.value ?? '') ? parseNumber(state.readings[m]!.value) : null);
  const mustAnswer = m === 90 && state.ninetyChoice !== 'keep-logging';
  const canWait = started && !waiting && !readingDue && m < CHILL_RULES.extraInterval && !mustAnswer;
  const rulerOut = state.ninetyChoice === 'keep-logging' && !state.measuredDepths;
  const placementLabel = PROBE_PLACEMENTS.find((p) => p.id === state.probePlacement)?.label;

  // A new interval on the clock: the display goes blank until the probe is read again.
  useEffect(() => {
    setProbed(null);
    setNote('');
    setNoteError(false);
  }, [state.minutesElapsed]);

  useEffect(() => {
    setSectionTray(null);
    // Keep the controls in reach after entering the chiller, especially on a phone.
    const timer = window.setTimeout(() => {
      if (rulerOut) scrollWithinScroller(toolsRef.current, 'center');
      else if (started || (allShelved && probeRight)) scrollWithinScroller(panelRef.current, 'start');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [workspaceRequest, started, allShelved, probeRight, rulerOut]);

  const touching = state.shelfByTray.map((shelf, i) =>
    shelf !== null && state.shelfByTray.some((other, j) => j !== i && other !== null && Math.abs(other - shelf) < 2),
  );

  const placeProbe = useCallback(
    (zone: SectionZone) => {
      if (sectionTray === null) return;
      const id: ProbePlacementId = zone === 'centre' ? (sectionTray === fullest ? 'centre' : 'surface') : zone;
      onProbeTray(sectionTray);
      setSectionTray(null);
      actions.onProbePlacement(id);
    },
    [sectionTray, fullest, onProbeTray, actions],
  );
  const openSection = useCallback((trayIndex: number) => {
    kitchenAudio.play('tap');
    setSectionTray(trayIndex);
  }, []);
  const closeSection = useCallback(() => setSectionTray(null), []);

  const startHint = !allShelved ? L.startHint.trays : !spaced ? L.startHint.space : !probeRight ? L.startHint.probe : null;
  const measuredDepth = state.measuredDepths ? PREP_SHEET.depthForKg(state.trays[fullest]) : null;
  const loadedCount = state.shelfByTray.filter((s) => s !== null).length;
  const readingsSaved = CHILL_RULES.intervals.filter((interval) => readingIsRight(interval, state.readings[interval]?.value ?? '')).length;
  const availableShelves = Array.from({ length: CHILLER_SHELVES }, (_, shelf) => shelf)
    .filter((shelf) => !state.shelfByTray.includes(shelf));

  const renderTray = (i: number) => (
    <TrayChip
      key={i}
      index={i}
      kg={state.trays[i]}
      onTrolley={state.shelfByTray[i] === null}
      touching={touching[i]}
      hasProbe={probeTray === i && state.probePlacement !== null}
      locked={started}
      canProbe={!started}
      canMeasure={rulerOut}
      measuredMm={state.measuredDepths && i === fullest ? measuredDepth : null}
      onProbeDrop={openSection}
      onMeasure={actions.onMeasure}
    />
  );

  const opener = !allShelved || !spaced
    ? { ...L.opener.load, pattern: 'drag' as const, progress: { done: loadedCount, total: state.trays.length, noun: L.opener.load.noun } }
    : !probeRight
      ? { ...L.opener.probe, pattern: 'drag' as const }
      : !started
        ? { ...L.opener.start, pattern: 'tap' as const }
        : mustAnswer
          ? { ...L.opener.decision, pattern: 'tap' as const }
          : rulerOut
            ? { ...L.opener.ruler, pattern: 'drag' as const }
            : m >= CHILL_RULES.extraInterval && !readingDue
              ? { ...L.opener.sign, pattern: 'tap' as const }
              : { ...L.opener.readings, pattern: 'hold' as const, progress: { done: readingsSaved, total: CHILL_RULES.intervals.length, noun: L.opener.readings.noun } };

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 pt-1">
      <WorkspaceOpener
        taskId="chill-the-event-batch"
        what={opener.what}
        how={opener.how}
        done={opener.done}
        progress={'progress' in opener ? opener.progress : undefined}
        pattern={opener.pattern}
        tone="dark"
      />
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,4.5fr)] md:grid-rows-[auto_1fr] md:gap-5">
      {/* Trolley */}
      <Trolley locked={started} onRemove={actions.onRemoveTray} empty={allShelved}>
        {state.trays.map((_, i) => (state.shelfByTray[i] === null ? renderTray(i) : null))}
      </Trolley>

      {/* Cabinet */}
      <div className="relative md:col-start-2 md:row-span-2 md:row-start-1">
        <div className="relative overflow-hidden rounded-xl border-[10px] border-zinc-700 bg-zinc-950 shadow-2xl" data-testid="cabinet">
          {Array.from({ length: CHILLER_SHELVES }).map((_, s) => {
            const trayHere = state.shelfByTray.findIndex((shelf) => shelf === s);
            return (
              <Shelf key={s} index={s} occupied={trayHere !== -1} locked={started} onLoad={actions.onLoadTray}>
                {trayHere !== -1 && renderTray(trayHere)}
              </Shelf>
            );
          })}
          {/* The door: shut once the cycle is running */}
          <AnimatePresence>
            {started && (
              <motion.div
                key="door"
                initial={{ x: '-102%' }}
                animate={{ x: 0 }}
                exit={{ x: '-102%' }}
                 transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="pointer-events-none absolute inset-0 border-4 border-zinc-500/70 bg-cyan-100/10"
                aria-hidden
              >
                <div className="absolute right-3 top-1/2 h-16 w-2 -translate-y-1/2 rounded bg-zinc-400 shadow" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-1 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">{L.cabinet}</div>
      </div>

      {/* Hooks: beside the cabinet, under the trolley, so the probe is in view while the trays go in.
          On a phone they follow the cabinet, ahead of the tray positions and the panel. */}
      <div ref={toolsRef} className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-white md:col-start-1 md:row-start-2 md:self-start">
        <div className="flex items-start justify-around">
          <ProbeTool locked={started} inTray={state.probePlacement ? probeTray : null} />
          {rulerOut && <RulerTool />}
        </div>
        {!started && (
          <div className="mt-3 border-t border-zinc-700 pt-3">
            <p className="mb-2 text-sm text-zinc-300">{L.probeAlternative}</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {state.trays.map((_, i) => (
                <Button key={i} type="button" variant="outline" className="min-h-11 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white" onClick={() => openSection(i)}>
                  {L.placeProbeIn(i + 1)}
                </Button>
              ))}
            </div>
          </div>
        )}
        {rulerOut && (
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
            {state.trays.map((_, i) => (
              <Button key={i} type="button" variant="outline" className="min-h-11 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white" onClick={actions.onMeasure}>
                <RulerIcon className="mr-2 h-4 w-4" /> {L.rulerZone(i + 1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Tray positions and the panel */}
      <div className="flex flex-col gap-4 md:col-start-3 md:row-span-2 md:row-start-1">
        {!started && (
          <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white" aria-labelledby="tray-position-heading">
            <div className="flex items-center justify-between gap-3">
              <h3 id="tray-position-heading" className="text-sm font-semibold">Tray positions</h3>
              <span className="text-xs text-zinc-300" role="status" aria-live="polite">{L.loadStatus(loadedCount, state.trays.length)}</span>
            </div>
            <div className="mt-3 space-y-2">
              {state.trays.map((_, i) => {
                const shelf = state.shelfByTray[i];
                const selectId = `tray-${i}-shelf`;
                return (
                  <div key={i} className="rounded-lg bg-black/30 p-2">
                    <div className="flex min-h-11 items-center gap-2">
                      <span className="min-w-14 text-sm font-semibold">{L.tray(i + 1)}</span>
                      {shelf === null ? (
                        <>
                          <label htmlFor={selectId} className="sr-only">{L.shelfChoice(i + 1)}</label>
                          <select
                            id={selectId}
                            defaultValue=""
                            onChange={(event) => {
                              const nextShelf = Number(event.target.value);
                              if (Number.isInteger(nextShelf)) actions.onLoadTray(i, nextShelf);
                            }}
                            className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-600 bg-zinc-800 px-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <option value="" disabled>{L.chooseShelf}</option>
                            {availableShelves.map((option) => <option key={option} value={option}>{L.shelf(option + 1)}</option>)}
                          </select>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-zinc-300">{L.shelf(shelf + 1)}</span>
                          <Button type="button" size="sm" variant="outline" className="min-h-11 border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white" onClick={() => actions.onRemoveTray(i)}>
                            {L.returnToTrolley(i + 1)}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {allShelved && <p className={cn('mt-3 text-sm font-medium', spaced ? 'text-emerald-300' : 'text-amber-300')} role="status">{spaced ? L.spacingReady : L.spacingNeeded}</p>}
          </section>
        )}

        <div ref={panelRef} className="rounded-2xl border-4 border-zinc-700 bg-zinc-900 p-4 text-zinc-100 shadow-2xl" data-testid="panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{L.chillerTitle}</span>
            <span className={cn('flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest', started ? 'text-emerald-400' : 'text-zinc-400')}>
              <span className={cn('h-2 w-2 rounded-full', started ? 'bg-emerald-400 animate-pulse motion-reduce:animate-none' : 'bg-zinc-600')} />
              {started ? L.cycleRunning : L.doorOpen}
            </span>
          </div>

          <div className="mt-3 rounded-xl border-2 border-zinc-800 bg-black p-3 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">{waiting ? L.waiting : L.coreTemp}</div>
            <div className="my-2 text-center font-mono text-4xl font-bold text-emerald-400 sm:text-5xl" style={{ textShadow: '0 0 12px rgba(52,211,153,0.5)' }} data-testid="display">
              {waiting ? progress.clock : displayReading !== null ? displayReading.toFixed(1) : '--.-'}
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
              <span className="truncate">{started ? L.readAt(m) : placementLabel ? `${L.probe.replace('The temperature ', '')}: ${upperFirst(placementLabel.toLowerCase())}` : L.probeOut}</span>
              <span className="shrink-0 pl-2">{started ? L.elapsed(m) : L.doorOpen}</span>
            </div>
          </div>

          {!started ? (
            <div className="mt-3">
              <Button onClick={actions.onStart} disabled={!!startHint} className="w-full font-bold shadow-lg" data-testid="start">
                <Play className="mr-1 h-4 w-4" /> {L.start}
              </Button>
              {startHint && <p className="mt-2 text-center text-xs text-zinc-400">{startHint}</p>}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {readingDue && !waiting && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <HoldToRead
                    key={m}
                    target={YOUR_TRAY_READINGS[m]}
                    label={L.holdToRead}
                    onSettled={(v) => setProbed(v)}
                    className="[&_button]:bg-zinc-800 [&_button]:text-white [&_button]:border-zinc-600"
                  >
                    {L.holdToRead}
                  </HoldToRead>
                  {probed !== null && (
                      <form
                        className="w-full space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!readingIsRight(m, note)) { setNoteError(true); return; }
                          kitchenAudio.play('write');
                          jot({ taskId: 'chill-the-event-batch', label: `Tray at ${m} min`, value: `${note.trim()} °C`, ref: { interval: m } });
                          actions.onReading(m, note.trim());
                          setNoteError(false);
                        }}
                      >
                        <p className="text-sm font-semibold text-emerald-300" role="status" aria-live="assertive">{L.settledReading(probed)}</p>
                        <p className="text-xs text-zinc-300">{L.readingHelp}</p>
                        <div className="flex items-center gap-2">
                         <label className="text-xs font-semibold text-white" htmlFor="chill-note">{L.yourReading}</label>
                        <Input
                          id="chill-note"
                          value={note}
                          onChange={(e) => { setNote(e.target.value); setNoteError(false); }}
                          inputMode="decimal"
                          placeholder={L.yourReading}
                          className="h-9 bg-white text-foreground"
                          aria-invalid={noteError}
                          aria-describedby={noteError ? 'chill-reading-error' : undefined}
                        />
                         <Button type="submit" size="sm" variant="secondary" className="shrink-0 font-bold" disabled={!note.trim()} aria-describedby={!note.trim() ? 'save-reading-reason' : undefined}>
                          <Check className="mr-1 h-3.5 w-3.5" /> {L.saveReading}
                        </Button>
                        </div>
                         {!note.trim() && <p id="save-reading-reason" className="text-xs text-zinc-400">{L.saveReadingHint}</p>}
                        {noteError && <p id="chill-reading-error" role="alert" className="text-xs text-amber-300">{L.readingMismatch}</p>}
                      </form>
                  )}
                </div>
              )}
              {!readingDue && <p role="status" className="text-sm font-semibold text-emerald-400">{L.readingSaved(m)}</p>}

              <CoolingRecordSummary state={state} />

              <Button variant="secondary" onClick={onOpenRecord} className="w-full font-bold" data-testid="open-record">
                <ClipboardList className="mr-1 h-4 w-4" /> {m >= CHILL_RULES.extraInterval && !readingDue ? L.reviewAndSign : L.recordTitle}
              </Button>

              <div>
                <Button onClick={actions.onWait} disabled={!canWait} variant="outline" className="w-full border-zinc-600 bg-zinc-800 font-bold text-white hover:bg-zinc-700 hover:text-white" data-testid="wait">
                  <Clock className="mr-1 h-4 w-4" /> {L.wait((nextChillMark(m) ?? CHILL_RULES.extraInterval) - m)}
                </Button>
                <p className="mt-1.5 text-center text-xs text-zinc-400" data-testid="wait-hint">
                  {m >= CHILL_RULES.extraInterval ? L.finished : readingDue ? L.waitHint(m) : mustAnswer ? L.next.answer : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sectionTray !== null && (
          <TraySection key="section" trayIndex={sectionTray} kg={state.trays[sectionTray]} onPlace={placeProbe} onClose={closeSection} />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
