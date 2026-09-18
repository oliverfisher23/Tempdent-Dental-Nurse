import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PLACES } from '@/content/kitchen';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { traysHaveSpace } from '@/lib/simulation';
import { Hotspot } from '../../kitchen/hotspot';
import { useKitchen, useKitchenAction } from '../../kitchen/kitchen-context';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
      transition={{ delay: 0.25, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="absolute inset-x-0 top-0 z-10 flex flex-col"
      style={{ bottom: 'var(--dialogue-h, 0px)' }}
    >
      <div className="flex shrink-0 items-center justify-end gap-3 px-3 pt-2 sm:px-5 sm:pt-3">
        <span className="hidden text-[11px] font-bold uppercase tracking-widest text-white/70 md:inline">{title}</span>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-lg outline-none backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-primary"
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
      <div className="absolute inset-0 overflow-hidden bg-black">
        <motion.img
          src={PLACES.bench.backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          decoding="async"
          initial={false}
          animate={reduceMotion ? { scale: 1, x: '0%', y: '0%' } : cam}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-zinc-950"
          initial={false}
          animate={{ opacity: view === 'room' ? 0 : 0.8 }}
          transition={{ duration: 0.6 }}
        />

        {/* Persistent Workspace Navigation */}
        <div className="absolute inset-x-0 top-4 z-20 flex justify-center pointer-events-none">
          <div className="flex gap-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
            <button 
              onClick={() => view !== 'bench' && go('bench')}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                view === 'bench' ? "bg-primary text-white shadow-md cursor-default" : benchState === 'done' ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {L.brattPan}
              {benchState === 'done' && <span className="ml-2 text-[10px] text-emerald-400">✓</span>}
            </button>
            <button 
              onClick={() => chillerState !== 'locked' && view !== 'chiller' && go('chiller')}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center group",
                view === 'chiller' ? "bg-primary text-white shadow-md cursor-default" : chillerState === 'locked' ? "opacity-50 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div>
                {L.blastChiller}
                {chillerState === 'done' && <span className="ml-2 text-[10px] text-emerald-400">✓</span>}
              </div>
              {chillerState === 'locked' && (
                <span className="hidden group-hover:block absolute top-full mt-2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  Portion the beef first
                </span>
              )}
            </button>
            <button 
              onClick={() => recordState !== 'locked' && !recordOpen && openRecord()}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center group",
                recordOpen ? "bg-primary text-white shadow-md cursor-default" : recordState === 'locked' ? "opacity-50 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <div>
                {L.record}
                {recordState === 'done' && <span className="ml-2 text-[10px] text-emerald-400">✓</span>}
              </div>
              {recordState === 'locked' && (
                <span className="hidden group-hover:block absolute top-full mt-2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  Start the chiller first
                </span>
              )}
            </button>
          </div>
        </div>

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
