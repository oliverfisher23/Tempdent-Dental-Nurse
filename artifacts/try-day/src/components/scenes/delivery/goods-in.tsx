import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { PLACES } from '@/content/kitchen';
import { DELIVERY_LINES, FISH_CHECKS, ORDER_LINES } from '@/content/activities';
import { SCENE_LABELS } from '@/content/scenes/delivery';
import { useKitchenAction, useWorkspaceOpen } from '@/components/kitchen/kitchen-context';
import { WorkspaceOpener } from '@/components/kitchen/workspace-opener';
import { Button } from '@/components/ui/button';
import type { DeliveryState } from '@/lib/simulation';
import { deliveryReviewIssues } from '@/lib/delivery-workflow';
import { DeliveryRow } from './delivery-row';
import { DeliveryNote } from './delivery-note';
import { DeliveryReport } from './delivery-report';
import { DeliveryComparison } from './delivery-comparison';
import { finishedDeliveryLineCount } from './delivery-completion';

type View = 'sheet' | 'comparison' | 'note' | 'report' | 'review';
export interface DeliveryWorkspaceProps {
  state: DeliveryState;
  onUpdateState: (recipe: (previous: DeliveryState) => DeliveryState) => void;
}
const copy = SCENE_LABELS.workspace;
const sections: { view: View; label: string }[] = [
  { view: 'sheet', label: copy.sheet },
  { view: 'comparison', label: copy.comparison },
  { view: 'report', label: copy.report },
  { view: 'note', label: copy.note },
  { view: 'review', label: copy.review },
];

function GuideAction({ action, open }: { action: string; open: () => void }) {
  useKitchenAction(action, open);
  return null;
}

export function GoodsInScene({ state, onUpdateState }: DeliveryWorkspaceProps) {
  const [view, setView] = useState<View>('sheet');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toolbarRefs = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});
  const scrollToRow = useRef(false);
  const reviewIssues = deliveryReviewIssues(state);
  const counted = ORDER_LINES.filter((line) => state.lines[line.id].counted).length;
  const probed = ORDER_LINES.filter((line) => line.chilled && state.lines[line.id].probed).length;
  const fish = FISH_CHECKS.filter((check) => state.fishChecks[check.id]).length;
  const finishedRows = finishedDeliveryLineCount(state);
  const openAction = view === 'sheet'
    ? selectedId ? `delivery:box:${selectedId}` : null
    : view === 'comparison' ? 'delivery:comparison'
      : view === 'report' ? 'delivery:radio'
        : view === 'note' ? 'delivery:note'
          : 'delivery:review';
  useWorkspaceOpen(openAction);

  const navigate = useCallback((target: string) => {
    if (ORDER_LINES.some((line) => line.id === target)) {
      scrollToRow.current = true;
      setSelectedId(target);
      setView('sheet');
      setFocusTarget(target);
    } else {
      const next = target === 'signature' ? 'note' : target;
      setView(sections.some((section) => section.view === next) ? next as View : 'sheet');
      setFocusTarget('heading');
    }
  }, []);

  const backToSheet = () => {
    scrollToRow.current = false;
    setView('sheet');
    setFocusTarget(selectedId ?? 'sheet');
  };

  useEffect(() => {
    if (!focusTarget) return;
    const frame = requestAnimationFrame(() => {
      if (view === 'sheet' && focusTarget !== 'heading') {
        const row = sheetRef.current?.querySelector<HTMLElement>(`[data-line-id="${focusTarget}"]`);
        const button = row?.querySelector<HTMLButtonElement>('button');
        if (button) {
          button.focus({ preventScroll: true });
          // Returning from paperwork preserves the sheet's position.
          if (scrollToRow.current) row?.scrollIntoView({ block: 'start' });
        } else toolbarRefs.current.sheet?.focus();
      } else headingRef.current?.focus({ preventScroll: true });
      setFocusTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTarget, view]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-zinc-950 text-white">
      {ORDER_LINES.map((line) => <GuideAction key={line.id} action={`delivery:box:${line.id}`} open={() => navigate(line.id)} />)}
      <GuideAction action="delivery:order-sheet" open={() => navigate('sheet')} />
      <GuideAction action="delivery:comparison" open={() => navigate('comparison')} />
      <GuideAction action="delivery:verify" open={() => navigate('comparison')} />
      <GuideAction action="delivery:note" open={() => navigate('note')} />
      <GuideAction action="delivery:radio" open={() => navigate('report')} />
      <GuideAction action="delivery:review" open={() => navigate('review')} />
      <GuideAction action="delivery:done" open={() => navigate('review')} />
      <img src={PLACES['goods-in'].backdrop} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" />
      <header className="relative shrink-0 border-b border-white/15 bg-black/70 px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 font-serif text-xl md:text-2xl"><ClipboardList className="h-5 w-5 text-primary" />{copy.title}</h1>
          <p className="text-xs text-zinc-300" aria-live="polite">{copy.inspectionProgress(counted, probed, fish)}</p>
        </div>
        <nav aria-label={copy.title} className="mt-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button key={section.view} ref={(node) => { toolbarRefs.current[section.view] = node; }}
              onClick={() => navigate(section.view)} aria-current={view === section.view ? 'page' : undefined}
              className={`min-h-10 rounded border px-3 py-2 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-white ${view === section.view ? 'border-primary bg-primary text-white' : 'border-white/20 bg-black text-zinc-200 hover:bg-white/10'}`}>
              {section.label}
            </button>
          ))}
        </nav>
      </header>
      {/* Kept mounted so opening paperwork never loses the active row or scroll position. */}
      <div ref={sheetRef} hidden={view !== 'sheet'} className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <WorkspaceOpener
            taskId="check-the-delivery-in"
            what={copy.opener.item.what}
            how={copy.opener.item.how}
            done={copy.opener.item.done}
            progress={{ done: finishedRows, total: ORDER_LINES.length, noun: 'items checked' }}
            pattern="tap"
            tone="dark"
          />
          <section aria-label={copy.allItems}>
            <h2 className="font-serif text-xl">{copy.allItems}</h2>
            <p className="mt-1 text-sm text-zinc-300">{copy.introduction}</p>
            <p className="mt-1 text-xs text-zinc-400">{copy.support}</p>
            <details className="mt-3 rounded border border-white/15 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-bold focus-visible:outline focus-visible:outline-2">{copy.briefing}</summary>
              <p className="mt-3"><strong>{copy.briefingMentor}: </strong>{DELIVERY_LINES.marcusOpening.text}</p>
              <p className="mt-2 text-zinc-300"><strong>{copy.briefingDriver}: </strong>{DELIVERY_LINES.driverOpening.text}</p>
            </details>
          </section>
          {([1, 2, 3] as const).map((trolley) => (
            <section key={trolley} className="space-y-3" aria-labelledby={`delivery-trolley-${trolley}`}>
              <h2 id={`delivery-trolley-${trolley}`} className="border-b border-white/15 pb-2 font-serif text-xl">{SCENE_LABELS.trolleys[trolley]}</h2>
              {ORDER_LINES.filter((line) => line.trolley === trolley).map((line) => {
                const row = state.lines[line.id];
                const hasEvidence = row.counted && (!line.chilled || row.probed);
                const attempted = hasEvidence && row.arrived.trim() && (!line.chilled || row.temperature.trim()) && row.comparison && row.status && row.acceptance && row.acceptedAmount.trim()
                  && (line.id !== 'sea-bass' || (FISH_CHECKS.every((check) => state.fishChecks[check.id]) && state.fishReason));
                return (
                  <div key={line.id} data-line-id={line.id} className="scroll-mt-3">
                    <p className="mb-1 text-xs text-zinc-400">{!row.counted && !row.probed ? copy.unchecked : attempted ? copy.ready : copy.unfinished}</p>
                    <DeliveryRow line={line} state={state} onUpdateState={onUpdateState}
                      expanded={view === 'sheet' && selectedId === line.id}
                      onToggle={() => { setSelectedId((id) => id === line.id ? null : line.id); }}
                      onOpenNote={() => navigate('note')} onOpenComparison={() => navigate('comparison')} />
                  </div>
                );
              })}
            </section>
          ))}
          <p className="text-xs text-zinc-400">{copy.readyHelp}</p>
        </div>
      </div>
      {view !== 'sheet' && (
        <section className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8" aria-labelledby="delivery-workspace-heading">
          <div className="mx-auto max-w-3xl">
            <Button variant="ghost" onClick={backToSheet} className="mb-4 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />{copy.back}</Button>
            <WorkspaceOpener
              taskId="check-the-delivery-in"
              what={copy.opener[view].what}
              how={copy.opener[view].how}
              done={copy.opener[view].done}
              pattern={view === 'review' ? 'list' : 'tap'}
              tone={view === 'note' ? 'light' : 'dark'}
              className="mb-4"
            />
            <h2 ref={headingRef} tabIndex={-1} id="delivery-workspace-heading" className="mb-4 font-serif text-2xl focus-visible:outline focus-visible:outline-2">{sections.find((section) => section.view === view)?.label}</h2>
            {view === 'comparison' && <DeliveryComparison state={state} onUpdateState={onUpdateState} onNavigate={navigate} />}
            {view === 'note' && <DeliveryNote state={state} onUpdateState={onUpdateState} onNavigate={navigate} />}
            {view === 'report' && <DeliveryReport state={state} onUpdateState={onUpdateState} onNavigate={navigate} onClose={backToSheet} />}
            {view === 'review' && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">{copy.reviewHelp}</p>
                <ul className="space-y-2" aria-live="polite">
                  {reviewIssues.map((issue, index) => <li key={`${issue.target}-${index}`}><button onClick={() => navigate(issue.target)} className="w-full rounded border border-amber-400/40 bg-amber-400/10 p-3 text-left text-sm text-amber-100 underline underline-offset-2 focus-visible:outline focus-visible:outline-2">{ORDER_LINES.find((line) => line.id === issue.target)?.item}{ORDER_LINES.some((line) => line.id === issue.target) ? ': ' : ''}{issue.message}</button></li>)}
                </ul>
                {reviewIssues.length === 0 && <p role="status">{state.signed ? copy.signed : copy.reviewClear}</p>}
                <Button onClick={() => navigate('note')}>{copy.openNote}</Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}