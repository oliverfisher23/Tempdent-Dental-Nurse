import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { PLACES } from '@/content/kitchen';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { traysHaveSpace } from '@/lib/simulation';
import { useKitchen, useKitchenAction, useWorkspaceOpen } from '@/components/kitchen/kitchen-context';
import { DragProvider } from '../../kitchen/interact';
import { kitchenAudio } from '@/lib/audio';
import { PortioningView } from './portioning';
import { ChillerView } from './chiller';
import { ChillRecord } from './record';
import type { ChillSceneProps, ChillView } from './types';
import { cn } from '@/lib/utils';

/** How the camera frames each part of the room (the backdrop moves; the panel sits on top). */
const CAMERA: Record<ChillView, { scale: number; x: string; y: string }> = {
  room: { scale: 1, x: '0%', y: '0%' },
  bench: { scale: 1.3, x: '10%', y: '-6%' },
  chiller: { scale: 1.3, x: '-10%', y: '4%' },
};

/** A part of the room the student has stepped up to, filling the stage above the dialogue bar. */
function ViewShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : 6, transition: { duration: reduceMotion ? 0 : 0.15 } }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="absolute inset-x-0 top-0 z-10 flex flex-col"
      style={{ bottom: 'var(--dialogue-h, 0px)' }}
    >
      {/* Clears the work-area navigation whatever height its wrapped labels and locked reasons give it on a phone. */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 sm:px-5" style={{ paddingTop: 'calc(var(--bench-nav-h, 3.5rem) + 1rem)' }}>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs font-bold text-white shadow-lg outline-none backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {L.backToRoom}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-3 sm:px-6 sm:pt-2">
        <div className="flex min-h-full flex-col justify-center">{children}</div>
      </div>
    </motion.div>
  );
}

export function BenchScene({ state, remaining, started, waiting, actions }: ChillSceneProps) {
  const { setWorking } = useKitchen();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<ChillView>('room');
  const [recordOpen, setRecordOpen] = useState(false);
  const [probeTray, setProbeTray] = useState<number | null>(state.probePlacement === 'centre' ? state.trays.indexOf(Math.max(...state.trays)) : null);
  const [workspaceRequest, setWorkspaceRequest] = useState(0);
  // The navigation's height feeds the work areas below it, so their headers never sit under it.
  const navRef = useRef<HTMLElement | null>(null);
  const [navHeight, setNavHeight] = useState(56);
  useEffect(() => {
    const node = navRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setNavHeight(node.offsetHeight));
    observer.observe(node);
    setNavHeight(node.offsetHeight);
    return () => observer.disconnect();
  }, []);
  useKitchenAction('chill:portion', () => {
    setRecordOpen(false);
    setView('bench');
  });
  useKitchenAction('chill:chiller', () => {
    setRecordOpen(false);
    setView('chiller');
    setWorkspaceRequest(n => n + 1);
  });
  useKitchenAction('chill:record', () => setRecordOpen(true));
  useWorkspaceOpen(recordOpen ? 'chill:record' : view === 'bench' ? 'chill:portion' : view === 'chiller' ? 'chill:chiller' : null);

  useEffect(() => {
    setWorking(view !== 'room');
    return () => setWorking(false);
  }, [view, setWorking]);

  const go = useCallback((next: ChillView) => {
    kitchenAudio.play(next === 'chiller' ? 'door' : 'tap');
    setView(next);
  }, []);
  const openRecord = useCallback(() => {
    kitchenAudio.play('page');
    setRecordOpen(true);
  }, []);
  const closeRecord = useCallback(() => setRecordOpen(false), []);

  const portioned = remaining <= 0;
  const chillerLoaded = state.probePlacement === 'centre' && traysHaveSpace(state.shelfByTray);
  const readingDue = started && !state.readings[state.minutesElapsed as 0]?.value;
  const finished = state.minutesElapsed >= 120 && !!state.readings[120]?.value;

  const benchState = portioned ? 'done' : 'active';
  const chillerState = !portioned ? 'locked' : state.studentSigned ? 'done' : !chillerLoaded || !started || readingDue === false ? 'active' : 'todo';
  const recordState = !started ? 'locked' : state.studentSigned ? 'done' : readingDue || (finished && !state.studentSigned) ? 'active' : 'todo';

  const cam = CAMERA[view];

  return (
    <DragProvider>
      {/* overflow-clip, not hidden: the zoomed backdrop overflows this box, and a hidden box is still a
          scroll container, so focusing or scrolling to a control below the fold would shift the whole
          stage (navigation and header included) with no way to scroll it back. */}
      <div className="absolute inset-0 overflow-clip bg-black" style={{ '--bench-nav-h': `${navHeight}px` } as CSSProperties}>
        <motion.img
          src={PLACES.bench.backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[70%_50%] opacity-80"
          decoding="async"
          initial={false}
          animate={reduceMotion ? { scale: 1, x: '0%', y: '0%' } : cam}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-zinc-950"
          initial={false}
          animate={{ opacity: view === 'room' ? 0 : 0.8 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        />

        {/* Persistent Workspace Navigation */}
        <nav ref={navRef} aria-label="Task 3 work areas" className="absolute inset-x-0 top-2 z-20 flex justify-center px-2 pointer-events-none">
          <div className="grid w-full max-w-xl grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-2xl backdrop-blur-md pointer-events-auto">
            <button 
              type="button"
              onClick={() => view !== 'bench' && go('bench')}
              aria-current={view === 'bench' ? 'page' : undefined}
              className={cn(
                "min-h-11 rounded-xl px-2 py-2 text-xs font-bold transition-colors",
                view === 'bench' ? "bg-primary text-white shadow-md cursor-default" : benchState === 'done' ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {L.brattPan}
              {benchState === 'done' && <Check className="ml-1 inline h-3.5 w-3.5 text-emerald-400" aria-label="Finished" />}
            </button>
            <button 
              type="button"
              onClick={() => chillerState !== 'locked' && view !== 'chiller' && go('chiller')}
              disabled={chillerState === 'locked'}
              aria-current={view === 'chiller' ? 'page' : undefined}
              aria-describedby={chillerState === 'locked' ? 'chiller-locked-reason' : undefined}
              className={cn(
                "min-h-11 rounded-xl px-2 py-2 text-xs font-bold transition-colors flex flex-col items-center justify-center",
                view === 'chiller' ? "bg-primary text-white shadow-md cursor-default" : chillerState === 'locked' ? "opacity-50 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div>
                {L.blastChiller}
                {chillerState === 'done' && <Check className="ml-1 inline h-3.5 w-3.5 text-emerald-400" aria-label="Finished" />}
              </div>
              {chillerState === 'locked' && <span id="chiller-locked-reason" className="mt-0.5 text-[9px] font-medium leading-tight text-white/75">{L.navHint.chiller}</span>}
            </button>
            <button 
              type="button"
              onClick={() => recordState !== 'locked' && !recordOpen && openRecord()}
              disabled={recordState === 'locked'}
              aria-current={recordOpen ? 'page' : undefined}
              aria-describedby={recordState === 'locked' ? 'record-locked-reason' : undefined}
              className={cn(
                "min-h-11 rounded-xl px-2 py-2 text-xs font-bold transition-colors flex flex-col items-center justify-center",
                recordOpen ? "bg-primary text-white shadow-md cursor-default" : recordState === 'locked' ? "opacity-50 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div>
                {L.record}
                {recordState === 'done' && <Check className="ml-1 inline h-3.5 w-3.5 text-emerald-400" aria-label="Finished" />}
              </div>
              {recordState === 'locked' && <span id="record-locked-reason" className="mt-0.5 text-[9px] font-medium leading-tight text-white/75">{L.navHint.record}</span>}
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {view === 'bench' && (
            <ViewShell key="bench" title={L.benchTitle} onBack={() => go('room')}>
              <PortioningView trays={state.trays} remaining={remaining} askedForTray={state.askedForTray} actions={actions} onToChiller={() => go('chiller')} />
            </ViewShell>
          )}
          {view === 'chiller' && (
            <ViewShell key="chiller" title={L.chillerTitle} onBack={() => go('room')}>
              <ChillerView
                state={state}
                started={started}
                waiting={waiting}
                workspaceRequest={workspaceRequest}
                actions={actions}
                probeTray={probeTray}
                onProbeTray={setProbeTray}
                onOpenRecord={openRecord}
              />
            </ViewShell>
          )}
        </AnimatePresence>

        <ChillRecord open={recordOpen} onClose={closeRecord} state={state} started={started} actions={actions} />
      </div>
    </DragProvider>
  );
}
