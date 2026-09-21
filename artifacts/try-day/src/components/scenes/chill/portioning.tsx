import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { PREP_SHEET } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { Button } from '@/components/ui/button';
import { WorkspaceOpener } from '@/components/kitchen/workspace-opener';
import { cn } from '@/lib/utils';
import { POUR_KG, POUR_TICK_MS, SCOOP_KG, TRAY_DEPTH_MM, type ChillActions } from './types';

const BEEF = 'linear-gradient(to top, #3f1f0f, #7a4222 70%, #8f5330)';

function Tray({
  index,
  kg,
  selected,
  onSelect,
  pouring,
}: {
  index: number;
  kg: number;
  selected: boolean;
  onSelect: (index: number) => void;
  pouring: boolean;
}) {
  const depth = PREP_SHEET.depthForKg(kg);
  const fill = Math.min(1, depth / TRAY_DEPTH_MM);
  const overSheet = depth > PREP_SHEET.fillDepthMm;

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={selected}
      aria-label={`${L.tray(index + 1)}, ${kg.toFixed(2)} kg, ${depth} mm deep`}
      className={cn(
        "flex flex-col gap-1.5 text-left transition-transform outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-2xl",
        selected ? "scale-105" : "hover:scale-105 opacity-80"
      )}
      data-testid={`tray-${index}`}
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <span className={cn("text-[11px] font-bold uppercase tracking-widest", selected ? "text-primary" : "text-white/70")}>{L.tray(index + 1)}</span>
        <span className={cn('whitespace-nowrap font-mono text-base font-bold', overSheet ? 'text-amber-300' : 'text-white')} aria-live="polite">
          {depth} mm
        </span>
      </div>
      <div
        className={cn(
          'relative h-36 w-full overflow-hidden rounded-b-2xl sm:h-40 md:h-48 border-x-[6px] border-b-[6px] transition-all',
          selected ? 'border-primary shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-zinc-800' : 'border-zinc-400 bg-zinc-800/80 shadow-[inset_0_12px_24px_rgba(0,0,0,0.6)]'
        )}
      >
        {/* The line the sheet asks for */}
        <div className="absolute inset-x-0 z-10 border-t-2 border-dashed border-white/60" style={{ bottom: `${(PREP_SHEET.fillDepthMm / TRAY_DEPTH_MM) * 100}%` }}>
          <span className="absolute right-1 top-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">{PREP_SHEET.fillDepthMm} mm</span>
        </div>
        {/* Max depth line */}
        <div className="absolute inset-x-0 z-10 border-t-2 border-red-500/50" style={{ top: 0 }}>
          <span className="absolute left-1 top-0 text-[10px] font-bold uppercase tracking-wider text-red-300">MAX {TRAY_DEPTH_MM} mm</span>
        </div>
        
        {/* The beef */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-full origin-bottom"
          style={{ background: BEEF }}
          initial={false}
          animate={{ scaleY: fill }}
          transition={{ type: 'tween', duration: 0.18 }}
        />
        <AnimatePresence>
          {pouring && (
            <motion.div
              key="stream"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 top-0 w-3 origin-top -translate-x-1/2 rounded-b-full bg-[#8f5330]"
              style={{ height: `${Math.max(6, (1 - fill) * 100)}%` }}
            />
          )}
        </AnimatePresence>
      </div>
      <span className="px-1 text-right font-mono text-[11px] text-white/60">{kg.toFixed(2)} kg</span>
    </button>
  );
}

export function PortioningView({
  trays,
  remaining,
  askedForTray,
  actions,
  onToChiller,
}: {
  trays: number[];
  remaining: number;
  askedForTray: boolean;
  actions: ChillActions;
  onToChiller: () => void;
}) {
  const panEmpty = remaining <= 0;
  // All at sheet depth: >= 50mm
  const allAtSheetDepth = trays.every((kg) => PREP_SHEET.depthForKg(kg) >= PREP_SHEET.fillDepthMm);
  const canAsk = !panEmpty && allAtSheetDepth && !askedForTray;

  const [selectedTray, setSelectedTray] = useState<number>(0);
  const [pouring, setPouring] = useState(false);
  
  // Ensure selected tray is valid if array shrinks (unlikely, but safe)
  useEffect(() => {
    if (selectedTray >= trays.length) setSelectedTray(trays.length - 1);
  }, [trays.length, selectedTray]);

  const targetDepth = PREP_SHEET.depthForKg(trays[selectedTray]);
  const isTargetFull = trays[selectedTray] >= PREP_SHEET.kgPerTrayAtDepth;
  const moved = PREP_SHEET.yourShareKg - remaining;
  const traysAtDepth = trays.filter((kg) => PREP_SHEET.depthForKg(kg) >= PREP_SHEET.fillDepthMm).length;
  const selectedFeedback = isTargetFull
    ? L.trayFull
    : targetDepth >= PREP_SHEET.fillDepthMm
      ? L.trayAtDepth(targetDepth)
      : L.trayNeedsMore(targetDepth);

  const handlePourTick = useCallback(() => {
    if (remaining > 0 && !isTargetFull) {
      actions.onPour(selectedTray, POUR_KG);
    } else {
      setPouring(false);
    }
  }, [remaining, isTargetFull, actions, selectedTray]);

  useEffect(() => {
    if (!pouring) return;
    const t = setInterval(handlePourTick, POUR_TICK_MS);
    return () => clearInterval(t);
  }, [pouring, handlePourTick]);

  const startPouring = useCallback((e: React.PointerEvent | React.KeyboardEvent) => {
    if (panEmpty || isTargetFull) return;
    e.preventDefault();
    setPouring(true);
    handlePourTick(); // immediate first tick
  }, [panEmpty, isTargetFull, handlePourTick]);

  const stopPouring = useCallback(() => {
    setPouring(false);
  }, []);

  const addScoop = useCallback(() => {
    if (!panEmpty && !isTargetFull) actions.onPour(selectedTray, SCOOP_KG);
  }, [panEmpty, isTargetFull, actions, selectedTray]);

  const returnScoop = useCallback(() => {
    if (trays[selectedTray] > 0) actions.onPour(selectedTray, -SCOOP_KG);
  }, [trays, selectedTray, actions]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-2">
      <WorkspaceOpener
        taskId="chill-the-event-batch"
        what={L.portionOpener.what}
        how={L.portionOpener.how}
        done={L.portionOpener.done}
        progress={{ done: traysAtDepth, total: trays.length, noun: L.portionOpener.noun }}
        pattern="tap"
        tone="dark"
      />
      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start">
      {/* The pan and controls */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-[#D9D0C1] bg-[#F5EFE6] px-4 py-3 text-sm leading-relaxed text-zinc-700 shadow">
          <span className="font-bold uppercase tracking-widest text-zinc-700">Prep sheet</span>{' '}
          {PREP_SHEET.dish}: {PREP_SHEET.batchKg} kg, {PREP_SHEET.trays} trays, {PREP_SHEET.fillDepthMm} mm deep.
          Your half: <strong>{PREP_SHEET.yourShareKg} kg</strong>. {PREP_SHEET.cleanTraysAvailable} clean trays to hand.
        </div>
        <div className="rounded-xl border border-white/15 bg-black/70 p-3 text-white" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span>{L.portionProgress(moved, PREP_SHEET.yourShareKg)}</span>
            <span className="shrink-0 font-mono">{Math.round((moved / PREP_SHEET.yourShareKg) * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <motion.div className="h-full origin-left bg-primary" initial={false} animate={{ scaleX: moved / PREP_SHEET.yourShareKg }} transition={{ duration: 0.18 }} />
          </div>
        </div>
        
        <div className="relative rounded-[28px] border-[6px] border-zinc-500 bg-zinc-800 p-3 shadow-2xl">
          <div className="relative h-24 overflow-hidden rounded-2xl bg-zinc-950 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)]" aria-hidden>
            <motion.div
              className="absolute inset-x-0 bottom-0 h-full origin-bottom"
              style={{ background: BEEF }}
              initial={false}
              animate={{ scaleY: Math.max(panEmpty ? 0 : 0.06, remaining / PREP_SHEET.yourShareKg) }}
              transition={{ type: 'tween', duration: 0.2 }}
            />
            {/* Pan remaining gauge overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="font-mono text-3xl font-bold text-white drop-shadow-md" data-testid="remaining">
                {remaining.toFixed(2)} <span className="text-xl text-white/80">kg</span>
               </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{L.pan}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{L.left}</span>
          </div>
        </div>

        {/* Portioning Controls */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Controls for {L.tray(selectedTray + 1)}</span>
            <span className="text-xs text-zinc-300 font-mono">{L.trayCapacity(trays[selectedTray], PREP_SHEET.kgPerTrayAtDepth)}</span>
          </div>
          <p className="text-sm text-zinc-200" role="status" aria-live="polite">{selectedFeedback}</p>
          
          <button
            onPointerDown={startPouring}
            onPointerUp={stopPouring}
            onPointerLeave={stopPouring}
            onBlur={stopPouring}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') startPouring(e); }}
            onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stopPouring(); }}
            disabled={panEmpty || isTargetFull}
            aria-describedby="add-beef-hint"
            className={cn(
              "relative min-h-11 w-full overflow-hidden py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all select-none touch-none",
              panEmpty || isTargetFull 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : pouring 
                  ? "bg-primary text-primary-foreground scale-95" 
                  : "bg-primary/20 text-white border border-primary/60 hover:bg-primary/30 active:scale-95"
            )}
          >
            <span
              className="pointer-events-none absolute inset-y-0 left-0 rounded-xl bg-primary/35 transition-[width] duration-150"
              style={{ width: `${Math.min(100, (trays[selectedTray] / PREP_SHEET.kgPerTrayAtDepth) * 100)}%` }}
              aria-hidden="true"
            />
            <span className="relative z-10">
            {L.addBeef}
            </span>
          </button>
          <p id="add-beef-hint" className="text-center text-xs text-zinc-400">{L.addBeefHint}</p>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
               className="min-h-11 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 font-bold"
              onClick={returnScoop}
              disabled={trays[selectedTray] <= 0}
               aria-describedby={trays[selectedTray] <= 0 ? 'return-beef-reason' : undefined}
            >
              <Minus className="w-4 h-4 mr-1" /> Return 0.5kg
            </Button>
            <Button 
              variant="outline" 
               className="min-h-11 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 font-bold"
              onClick={addScoop}
              disabled={panEmpty || isTargetFull}
            >
              <Plus className="w-4 h-4 mr-1" /> Scoop 0.5kg
            </Button>
          </div>
           {trays[selectedTray] <= 0 && <p id="return-beef-reason" className="text-center text-xs text-zinc-400">{L.returnBeefHint}</p>}
        </div>
      </div>

      {/* The trays */}
      <div className="flex flex-col gap-5">
        <div className={cn("grid grid-cols-2 gap-3 sm:gap-5", trays.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
          {trays.map((kg, i) => (
            <Tray 
              key={i} 
              index={i} 
              kg={kg} 
              selected={selectedTray === i} 
              onSelect={setSelectedTray} 
              pouring={pouring && selectedTray === i} 
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {panEmpty ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-black/50 p-4 text-white sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium">{L.panEmpty}</p>
              <Button onClick={onToChiller} className="font-bold shadow-lg">
                {L.toTheChiller} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          ) : canAsk ? (
            <motion.div key="ask" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-end">
             <div className="flex flex-col items-end gap-1">
             <Button variant="secondary" onClick={actions.onAskForTray} className="font-bold shadow-lg" disabled={!canAsk} aria-describedby={!canAsk ? 'ask-tray-reason' : undefined}>
                {L.askForTray}
              </Button>
               {!canAsk && <p id="ask-tray-reason" className="text-xs text-white/70">{L.askForTrayHint}</p>}
             </div>
            </motion.div>
           ) : !askedForTray ? (
             <motion.div key="ask-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-end gap-1">
               <Button variant="secondary" className="font-bold shadow-lg" disabled aria-describedby="ask-tray-reason">
                 {L.askForTray}
               </Button>
               <p id="ask-tray-reason" className="text-xs text-white/70">{L.askForTrayHint}</p>
             </motion.div>
           ) : null}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
