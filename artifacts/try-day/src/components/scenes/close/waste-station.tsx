import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronRight } from 'lucide-react';
import { WASTE_BINS, type WasteBin } from '@/content/activities';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { CLOSE_INTERACTION } from '@/content/scenes/close-interaction';
import { useProgress } from '@/lib/progress-store';
import { weightIsRight } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WorkspaceOpener } from '../../kitchen/workspace-opener';

const COPY = CLOSE_INTERACTION.waste;

/**
 * Waste tubs and scales (approved decision P1). Each tub is inspected, put on the scales
 * deliberately, and its reading written once on the waste sheet. Nothing is entered for
 * the learner; the notebook stays optional. The follow-up question is formative only.
 */
export function WasteStation({ onGoToHandover }: { onGoToHandover: () => void }) {
  const { progress, updateTask, jot, advanceClock } = useProgress();
  const state = progress.tasks['hand-the-kitchen-on'];
  const rs = state.redesign;

  const [selectedBin, setSelectedBin] = useState<WasteBin['id'] | null>(null);
  const [displayWeight, setDisplayWeight] = useState<number | null>(null);
  const [onScales, setOnScales] = useState<WasteBin['id'] | null>(null);
  const [scaleSettled, setScaleSettled] = useState(false);
  const [noted, setNoted] = useState<Record<string, boolean>>({});
  const weightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tubHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { if (weightTimer.current) clearInterval(weightTimer.current); }, []);

  const bin = WASTE_BINS.find((b) => b.id === selectedBin) ?? null;
  const weighedCount = WASTE_BINS.filter((b) => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? '')).length;
  const weightsDone = WASTE_BINS.every((b) => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? ''));

  const selectBin = (id: WasteBin['id']) => {
    setSelectedBin(id);
    if (weightTimer.current) clearInterval(weightTimer.current);
    setOnScales(null);
    setDisplayWeight(null);
    setScaleSettled(false);
    window.setTimeout(() => tubHeadingRef.current?.focus(), 0);
  };

  const putOnScales = (target: WasteBin) => {
    if (weightTimer.current) clearInterval(weightTimer.current);
    setOnScales(target.id);
    setDisplayWeight(0);
    setScaleSettled(false);
    kitchenAudio.play('scale');
    let w = 0;
    const interval = setInterval(() => {
      w += target.actualKg / 15;
      if (w >= target.actualKg) {
        w = target.actualKg;
        clearInterval(interval);
        setScaleSettled(true);
        // Weighing is the deliberate act; the reading is still the learner's to write.
        updateTask('hand-the-kitchen-on', (prev) => (
          prev.weighed[target.id] ? prev : { ...prev, weighed: { ...prev.weighed, [target.id]: true } }
        ));
        advanceClock(1);
        window.setTimeout(() => weightInputRef.current?.focus(), 0);
      }
      setDisplayWeight(w);
    }, 40);
    weightTimer.current = interval;
  };

  const writeWeight = (id: WasteBin['id'], value: string) => {
    updateTask('hand-the-kitchen-on', (prev) => ({ ...prev, weights: { ...prev.weights, [id]: value } }));
  };

  const writeInNotebook = (target: WasteBin) => {
    kitchenAudio.play('write');
    jot({ taskId: 'hand-the-kitchen-on', label: target.label, value: `${target.actualKg.toFixed(2)} kg`, ref: { binId: target.id } });
    setNoted((prev) => ({ ...prev, [target.id]: true }));
  };

  const updateWaste = (changes: { wasteFocus?: string; wasteReason?: string }) => {
    updateTask('hand-the-kitchen-on', (prev) => (
      prev.redesign ? { ...prev, redesign: { ...prev.redesign, ...changes } } : prev
    ));
  };

  const scaleStatus = onScales
    ? (scaleSettled ? COPY.settled : COPY.settling)
    : COPY.empty;

  const rowStatus = (b: WasteBin) => {
    const value = (state.weights[b.id] ?? '').trim();
    if (!state.weighed[b.id]) return { text: COPY.notWeighed, tone: 'todo' as const };
    if (!value) return { text: COPY.waitingForReading, tone: 'todo' as const };
    if (weightIsRight(b.id, value)) return { text: COPY.correct, tone: 'right' as const };
    return { text: COPY.incorrect, tone: 'wrong' as const };
  };

  const nextUnfinished = WASTE_BINS.find((b) => !(state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? '')) && b.id !== selectedBin);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-[90vh] flex flex-col items-center justify-start overflow-y-auto">
      <WorkspaceOpener
        taskId="hand-the-kitchen-on"
        what={COPY.opener.what}
        how={COPY.opener.how}
        done={COPY.opener.done}
        progress={{ done: weighedCount, total: WASTE_BINS.length, noun: COPY.opener.noun }}
        pattern="tap"
        tone="dark"
        className="w-full mb-4"
      />
      <div className="w-full mb-6">
        <h2 className="text-2xl font-bold text-zinc-100">{COPY.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{COPY.instructions}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
        {/* Tubs and scales */}
        <div className="flex-1 w-full bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-xl shadow-2xl flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label={COPY.chooseTub}>
            {WASTE_BINS.map((b) => {
              const isSelected = selectedBin === b.id;
              const status = rowStatus(b);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBin(b.id)}
                  aria-pressed={isSelected}
                  aria-label={`Look at the tub: ${b.label}. ${status.text}`}
                  className={cn(
                    'group min-h-24 rounded-xl border-2 flex flex-col items-start justify-between text-left text-zinc-100 p-3 shadow-md motion-safe:transition-[background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60',
                    isSelected ? 'bg-zinc-800 border-primary ring-1 ring-primary/40' : 'bg-black border-zinc-700 hover:border-zinc-400 hover:bg-zinc-800 hover:-translate-y-0.5',
                  )}
                >
                  <span className="text-sm font-bold leading-5">{b.label}</span>
                  <span className="mt-2 flex w-full items-center justify-between gap-2">
                    <span className={cn('text-[11px] flex items-center gap-1', status.tone === 'right' ? 'text-emerald-400' : 'text-zinc-400')}>
                      {status.tone === 'right' && <Check className="w-3 h-3" aria-hidden="true" />}
                      {status.tone === 'right' ? COPY.weighed : status.tone === 'wrong' ? COPY.checkReading : status.text}
                    </span>
                    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold', isSelected ? 'bg-primary text-white' : 'bg-white/10 text-zinc-200')}>
                      {isSelected ? COPY.chosen : COPY.choose}
                      {!isSelected && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div
              className="md:w-64 shrink-0 bg-black rounded-lg border-4 border-zinc-700 flex flex-col items-center justify-center py-4 px-3"
              role="status"
              aria-live="polite"
              aria-label={`${COPY.scaleLabel}: ${displayWeight !== null ? `${displayWeight.toFixed(2)} kilograms` : '0.00 kilograms'}. ${scaleStatus}`}
            >
              <div className="flex items-end">
                <span className="font-mono text-5xl text-red-500 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                  {displayWeight !== null ? displayWeight.toFixed(2) : '0.00'}
                </span>
                <span className="font-mono text-xl text-red-500/80 ml-2 mb-1">kg</span>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-400">{scaleStatus}</p>
            </div>

            <div className="flex-1 min-w-0">
              {bin ? (
                <div className="flex flex-col gap-3">
                  <h3 ref={tubHeadingRef} tabIndex={-1} className="text-lg font-bold text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
                    {bin.label}
                  </h3>
                  <dl className="text-sm text-zinc-300 space-y-1">
                    <div><dt className="inline font-bold text-zinc-100">{COPY.inTheTub}: </dt><dd className="inline">{bin.description}</dd></div>
                    <div><dt className="inline font-bold text-zinc-100">{COPY.from}: </dt><dd className="inline">{bin.whereFrom}</dd></div>
                  </dl>
                   <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => putOnScales(bin)}
                      disabled={onScales === bin.id && !scaleSettled}
                       className="min-h-11 bg-primary text-white px-5 py-2 rounded-full font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 text-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                    >
                      {onScales === bin.id && scaleSettled ? COPY.weighAgain : COPY.putOnScales}
                    </button>
                    {onScales === bin.id && scaleSettled && (
                      <button
                        type="button"
                        onClick={() => writeInNotebook(bin)}
                        disabled={!!noted[bin.id]}
                        className="min-h-11 text-sm bg-white/10 border border-white/20 text-white font-bold px-4 py-2 rounded hover:bg-white/20 disabled:opacity-60"
                      >
                        {noted[bin.id] ? COPY.notebookDone : COPY.notebook}
                      </button>
                    )}
                  </div>

                  {state.weighed[bin.id] && (
                    <div className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
                      <label htmlFor={`waste-${bin.id}-weight`} className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {COPY.weightLabel}
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          ref={weightInputRef}
                          id={`waste-${bin.id}-weight`}
                          inputMode="decimal"
                          value={state.weights[bin.id] ?? ''}
                          onChange={(e) => writeWeight(bin.id, e.target.value)}
                          placeholder={COPY.weightPlaceholder}
                          aria-describedby={`waste-${bin.id}-feedback`}
                          aria-invalid={!!(state.weights[bin.id] ?? '').trim() && !weightIsRight(bin.id, state.weights[bin.id] ?? '')}
                          className={cn('w-28 text-center font-mono min-h-11 bg-zinc-900 text-zinc-100 border-zinc-600', weightIsRight(bin.id, state.weights[bin.id] ?? '') && 'border-emerald-500 text-emerald-300')}
                        />
                        <span className="text-sm text-zinc-400 font-mono">kg</span>
                      </div>
                      <p id={`waste-${bin.id}-feedback`} className={cn('mt-2 text-xs', rowStatus(bin).tone === 'right' ? 'text-emerald-400' : rowStatus(bin).tone === 'wrong' ? 'text-amber-300' : 'text-zinc-400')} aria-live="polite">
                        {!(state.weights[bin.id] ?? '').trim() ? COPY.writeIt : rowStatus(bin).text}
                      </p>
                    </div>
                  )}

                  {rowStatus(bin).tone === 'right' && nextUnfinished && (
                    <button type="button" onClick={() => selectBin(nextUnfinished.id)} className="self-start min-h-11 rounded border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-800">
                      {COPY.nextTub}: {nextUnfinished.label}
                    </button>
                  )}
                   {rowStatus(bin).tone !== 'right' && (
                     <div>
                       <button type="button" disabled className="min-h-11 rounded border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-500">
                         {COPY.nextTub}
                       </button>
                       <p className="mt-1 text-xs text-zinc-400">{COPY.nextTubReason}</p>
                     </div>
                   )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">{COPY.chooseTub}</p>
              )}
            </div>
          </div>
        </div>

        {/* Waste sheet */}
        <div className="w-full lg:w-[380px] shrink-0 bg-white border border-zinc-300 rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="bg-zinc-100 border-b border-zinc-300 p-4">
            <h3 className="font-bold uppercase tracking-widest text-sm text-zinc-800">{COPY.sheetTitle}</h3>
            <p className="mt-1 text-xs text-zinc-600">{COPY.sheetHelp}</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="sr-only">
              <tr><th>Tub</th><th>Weight</th><th>Status</th></tr>
            </thead>
            <tbody>
              {WASTE_BINS.map((b) => {
                const status = rowStatus(b);
                const value = (state.weights[b.id] ?? '').trim();
                return (
                  <tr key={b.id} className={cn('border-b border-zinc-200 last:border-0 motion-safe:transition-colors', selectedBin === b.id && 'bg-amber-50 ring-2 ring-inset ring-amber-400', status.tone === 'right' && selectedBin !== b.id && 'bg-emerald-50')}>
                    <td className="px-4 py-3 align-top">
                      <button type="button" onClick={() => selectBin(b.id)} className="text-left font-bold text-zinc-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded">
                        {b.label}
                      </button>
                    </td>
                    <td className="px-2 py-3 align-top font-mono whitespace-nowrap">{value ? `${value} kg` : '—'}</td>
                    <td className={cn('px-4 py-3 align-top text-xs', status.tone === 'right' ? 'text-emerald-700' : status.tone === 'wrong' ? 'text-amber-800' : 'text-zinc-500')}>
                      {status.tone === 'right' ? COPY.correct : status.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t border-zinc-200 bg-zinc-50 p-5 flex flex-col gap-4">
            {!weightsDone && (
              <div>
                <button type="button" disabled className="min-h-11 rounded bg-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600">
                  {COPY.goToHandover}
                </button>
                <p className="mt-1 text-xs text-zinc-600">{COPY.handoverReason}</p>
              </div>
            )}
            {weightsDone && (
              <>
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {COPY.allWeighed}</p>

              {rs && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="text-sm font-bold text-zinc-900">{CLOSE_SCENE.wasteQuestion.title}</legend>
                  <p className="text-xs leading-5 text-zinc-600">{CLOSE_SCENE.wasteQuestion.help}</p>
                  <div className="flex flex-col gap-2" role="group" aria-label={CLOSE_SCENE.wasteQuestion.title}>
                    {CLOSE_SCENE.wasteQuestion.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { kitchenAudio.play('confirm'); updateWaste({ wasteFocus: rs.wasteFocus === opt.id ? '' : opt.id }); }}
                        aria-pressed={rs.wasteFocus === opt.id}
                        className={cn('min-h-11 text-left px-3 py-2 rounded border text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black', rs.wasteFocus === opt.id ? 'bg-primary text-white border-primary' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {rs.wasteFocus && (
                    <div className="flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                      <p className="text-xs leading-5 text-zinc-800 border-l-2 border-primary pl-3" role="status">
                        {CLOSE_SCENE.wasteQuestion.options.find((o) => o.id === rs.wasteFocus)?.feedback}
                      </p>
                      <label htmlFor="waste-follow-up-reason" className="text-xs font-bold text-zinc-700">{CLOSE_SCENE.wasteQuestion.nextLabel}</label>
                      <Textarea
                        id="waste-follow-up-reason"
                        value={rs.wasteReason}
                        onChange={(e) => updateWaste({ wasteReason: e.target.value })}
                        placeholder={CLOSE_SCENE.wasteQuestion.nextPlaceholder}
                        className="text-xs min-h-[72px] bg-white"
                      />
                      <p className="text-[11px] leading-4 text-zinc-500">{CLOSE_SCENE.wasteQuestion.savedNote}</p>
                    </div>
                  )}
                </fieldset>
              )}

              <button type="button" onClick={onGoToHandover} className="min-h-11 rounded bg-black px-4 py-2 text-xs font-bold text-white self-start">
                {COPY.goToHandover}
              </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
