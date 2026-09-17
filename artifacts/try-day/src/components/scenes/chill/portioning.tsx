import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Hand } from 'lucide-react';
import { PREP_SHEET } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDraggable, useDropZone } from '../../kitchen/interact';
import { POUR_KG, POUR_TICK_MS, SCOOP_KG, TRAY_DEPTH_MM, type ChillActions } from './types';

const BEEF = 'linear-gradient(to top, #3f1f0f, #7a4222 70%, #8f5330)';

/** The ladle rests on the rim of the pan until it is picked up. */
function Ladle({ empty }: { empty: boolean }) {
  const { props, isLifted } = useDraggable({ id: 'ladle', kind: 'ladle', label: L.ladle, disabled: empty });
  return (
    <div
      {...props}
      aria-label={`${L.ladle}: ${L.ladleHint}`}
      className={cn(
        'absolute -right-4 -top-10 h-28 w-24 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary',
        isLifted && 'z-50',
        empty && 'opacity-40',
      )}
      style={props.style}
      data-testid="ladle"
    >
      <div
        className={cn(
          'absolute bottom-[2.6rem] left-1/2 h-[4.5rem] w-2.5 origin-bottom rounded-full bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 shadow-md transition-transform',
          isLifted ? '-translate-x-1/2 rotate-[10deg]' : '-translate-x-1/2 rotate-[34deg]',
        )}
      />
      <div className="absolute bottom-1 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border border-zinc-500 shadow-xl [background:radial-gradient(circle_at_35%_30%,#fafafa,#a1a1aa_45%,#3f3f46_100%)]">
        <div
          className={cn('absolute inset-[7px] rounded-full transition-opacity duration-300', empty ? 'opacity-0' : 'opacity-100')}
          style={{ background: BEEF }}
        />
      </div>
      {!isLifted && !empty && (
        <span className="pointer-events-none absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
          <Hand className="h-3 w-3" /> {L.ladle.replace('The ', '')}
        </span>
      )}
    </div>
  );
}

function Tray({
  index,
  kg,
  panEmpty,
  onPour,
}: {
  index: number;
  kg: number;
  panEmpty: boolean;
  onPour: ChillActions['onPour'];
}) {
  const accepts = useCallback((kind: string) => kind === 'ladle', []);
  // Letting go over the tray tips a scoop in, unless the ladle has already been pouring there
  // (a quick tap, or the keyboard route, still puts beef in the tray).
  const pouredHere = useRef(false);
  const onDrop = useCallback(() => {
    if (!pouredHere.current) onPour(index, SCOOP_KG);
    pouredHere.current = false;
  }, [index, onPour]);
  const depth = PREP_SHEET.depthForKg(kg);
  const full = depth >= TRAY_DEPTH_MM;
  const { ref, isOver, isTarget, props } = useDropZone({
    id: `tray-${index}`,
    label: L.trayZone(index + 1),
    accepts,
    onDrop,
    disabled: panEmpty || full,
  });
  const pouring = (isOver || isTarget) && !panEmpty && !full;

  // Beef runs while the ladle is held over the tray.
  useEffect(() => {
    if (!pouring) return;
    const t = setInterval(() => {
      pouredHere.current = true;
      onPour(index, POUR_KG);
    }, POUR_TICK_MS);
    return () => clearInterval(t);
  }, [pouring, index, onPour]);

  const fill = Math.min(1, depth / TRAY_DEPTH_MM);
  const overSheet = depth > PREP_SHEET.fillDepthMm;

  return (
    <div ref={ref} {...props} className="flex flex-col gap-1.5" data-testid={`tray-${index}`} data-kg={kg}>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">{L.tray(index + 1)}</span>
        <span className={cn('whitespace-nowrap font-mono text-base font-bold', overSheet ? 'text-amber-300' : 'text-white')} aria-live="polite">
          {depth} mm
        </span>
      </div>
      <div
        className={cn(
          'relative h-36 overflow-hidden rounded-b-2xl sm:h-40 md:h-48 border-x-[6px] border-b-[6px] border-zinc-400 bg-zinc-800/80 shadow-[inset_0_12px_24px_rgba(0,0,0,0.6)] transition-shadow',
          pouring && 'ring-4 ring-primary ring-offset-2 ring-offset-black',
        )}
      >
        {/* The line the sheet asks for */}
        <div className="absolute inset-x-0 z-10 border-t-2 border-dashed border-white/60" style={{ bottom: `${(PREP_SHEET.fillDepthMm / TRAY_DEPTH_MM) * 100}%` }}>
          <span className="absolute right-1 top-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">{PREP_SHEET.fillDepthMm} mm</span>
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
              className="absolute left-1/2 top-0 w-2 origin-top -translate-x-1/2 rounded-b-full bg-[#8f5330]"
              style={{ height: `${Math.max(6, (1 - fill) * 100)}%` }}
            />
          )}
        </AnimatePresence>
      </div>
      <span className="px-1 text-right font-mono text-[11px] text-white/60">{kg.toFixed(2)} kg</span>
    </div>
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
  const allAtSheetDepth = trays.every((kg) => PREP_SHEET.depthForKg(kg) >= PREP_SHEET.fillDepthMm);
  const canAsk = !panEmpty && allAtSheetDepth && !askedForTray;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pt-2 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start">
      {/* The pan */}
      <div className="relative">
        <div className="rounded-lg border border-[#D9D0C1] bg-[#F5EFE6] px-3 py-2 text-[11px] leading-snug text-zinc-700 shadow">
          <span className="font-bold uppercase tracking-widest text-zinc-500">Prep sheet</span>{' '}
          {PREP_SHEET.dish}: {PREP_SHEET.batchKg} kg, {PREP_SHEET.trays} trays, {PREP_SHEET.fillDepthMm} mm deep.
          Your half: <strong>{PREP_SHEET.yourShareKg} kg</strong>. {PREP_SHEET.cleanTraysAvailable} clean trays to hand.
        </div>
        <div className="relative mt-8 rounded-[28px] border-[6px] border-zinc-500 bg-zinc-800 p-3 shadow-2xl">
          <div className="relative h-32 overflow-hidden rounded-2xl bg-zinc-950 sm:h-44 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)]" aria-hidden>
            <motion.div
              className="absolute inset-x-0 bottom-0 h-full origin-bottom"
              style={{ background: BEEF }}
              initial={false}
              animate={{ scaleY: Math.max(panEmpty ? 0 : 0.06, remaining / PREP_SHEET.yourShareKg) }}
              transition={{ type: 'tween', duration: 0.2 }}
            />
          </div>
          <Ladle empty={panEmpty} />
          <div className="mt-3 flex items-baseline justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{L.pan}</span>
            <span className="font-mono text-2xl font-bold text-white" data-testid="remaining">
              {remaining.toFixed(2)} kg <span className="text-sm font-medium text-white/60">{L.left}</span>
            </span>
          </div>
        </div>
      </div>

      {/* The trays */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {trays.map((kg, i) => (
            <Tray key={i} index={i} kg={kg} panEmpty={panEmpty} onPour={actions.onPour} />
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
              <Button variant="secondary" onClick={actions.onAskForTray} className="font-bold shadow-lg">
                {L.askForTray}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
