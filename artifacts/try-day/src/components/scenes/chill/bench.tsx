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

        {view === 'room' && (
          <>
            <Hotspot x={34} y={62} label={L.brattPan} hint={L.brattPanHint} state={benchState} onClick={() => go('bench')} />
            <Hotspot x={72} y={28} label={L.blastChiller} hint={L.blastChillerHint} state={chillerState} onClick={() => go('chiller')} />
            <Hotspot x={56} y={30} label={L.record} hint={L.recordHint} state={recordState} onClick={openRecord} />
          </>
        )}

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
