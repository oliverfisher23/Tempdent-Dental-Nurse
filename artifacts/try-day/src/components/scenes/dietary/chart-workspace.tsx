import { CHECK_COPY } from '@/content/check';
import { useState } from 'react';
import { ALLERGENS, DISHES, type Dish } from '@/content/activities';
import { ALLERGEN_REFERENCE } from '@/content/scenes/dietary-redesign';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import {
  chartRowMatchesTerenceMarks,
  chartHint,
  hintTier,
  isTerenceChartRow,
  rowStatus,
  type DietaryRedesignState,
  type RowStatus,
} from '@/lib/redesign-dietary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn, upperFirst } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, HelpCircle, MessageSquare, Minus } from 'lucide-react';
import { WorkspaceOpener } from '../../kitchen/workspace-opener';
import { CheckFeedback } from '../../kitchen/check-feedback';

interface ChartWorkspaceProps {
  chart: Record<string, string[]>;
  flaggedDishes: string[];
  chartChecked: boolean;
  redesign: DietaryRedesignState;
  onToggleAllergen: (dishId: string, allergenId: string) => void;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  onCheckChart: () => void;
  onRequestHint: (dishId: string) => void;
  onBack?: () => void;
}

const STATUS_STYLES: Record<RowStatus, string> = {
  'not-started': 'bg-gray-800 text-gray-300 border-gray-700',
  'in-progress': 'bg-sky-950 text-sky-200 border-sky-800',
  reviewed: 'bg-emerald-950 text-emerald-200 border-emerald-800',
  'reviewed-question': 'bg-amber-950 text-amber-200 border-amber-800',
  flagged: 'bg-red-950 text-red-200 border-red-800',
};

function StatusChip({ status, className }: { status: RowStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap', STATUS_STYLES[status], className)}>
      {status === 'flagged' && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
      {status === 'reviewed' && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
      {status === 'reviewed-question' && <HelpCircle className="w-3 h-3" aria-hidden="true" />}
      {DIETARY_UI.chart.legend[status]}
    </span>
  );
}

export function ChartWorkspace({
  chart,
  flaggedDishes,
  chartChecked,
  redesign,
  onToggleAllergen,
  onUpdateRedesign,
  onCheckChart,
  onRequestHint,
  onBack,
}: ChartWorkspaceProps) {
  const copy = DIETARY_UI.chart;
  const isMobile = useIsMobile();
  const [activeDishId, setActiveDishId] = useState<string>(flaggedDishes[0] ?? DISHES[0].id);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const activeDish = DISHES.find((dish) => dish.id === activeDishId) ?? DISHES[0];
  const activeIndex = DISHES.findIndex((dish) => dish.id === activeDish.id);
  const stateView = { chart, flaggedDishes, redesign };
  const remaining = DISHES.filter((dish) => !redesign.rowReviewConfirmed?.[dish.id]).length;
  const revisiting = flaggedDishes.length > 0;
  const confirmedRows = DISHES.length - remaining;
  const fixedFlaggedRows = flaggedDishes.filter((dishId) => redesign.rowReviewConfirmed?.[dishId]).length;

  const setConfirmed = (dishId: string, confirmed: boolean) =>
    onUpdateRedesign((prev) => ({ ...prev, rowReviewConfirmed: { ...prev.rowReviewConfirmed, [dishId]: confirmed } }));
  const setQuestion = (dishId: string, value: string) =>
    onUpdateRedesign((prev) => ({ ...prev, openQuestions: { ...prev.openQuestions, [dishId]: value } }));

  const terenceAttribution = (dishId: string) => {
    if (!isTerenceChartRow(dishId)) return null;
    const corrected = !chartRowMatchesTerenceMarks(dishId, chart[dishId] ?? []);
    return (
      <span
        data-testid={`chart-attribution-${dishId}`}
        className={cn(
          'inline-flex rounded border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
          corrected ? 'border-violet-700 bg-violet-950 text-violet-200' : 'border-sky-800 bg-sky-950 text-sky-200',
        )}
      >
        {corrected ? copy.correctedByYou : copy.filledByTerence}
      </span>
    );
  };

  const cellContent = (dish: Dish, allergenId: string) => {
    const marked = (chart[dish.id] ?? []).includes(allergenId);
    const status = rowStatus(stateView, dish.id);
    const terenceMark = isTerenceChartRow(dish.id) && chartRowMatchesTerenceMarks(dish.id, chart[dish.id] ?? []);
    if (marked) return <Check aria-hidden="true" className={cn('h-4 w-4', terenceMark ? 'text-sky-300' : 'text-red-300')} strokeWidth={3} />;
    return <Minus aria-hidden="true" className={cn('h-3.5 w-3.5', status === 'reviewed' || status === 'reviewed-question' ? 'text-gray-400' : 'text-gray-600')} />;
  };

  const renderRecipeCard = (dish: Dish) => {
    const status = rowStatus(stateView, dish.id);
    const flagged = flaggedDishes.includes(dish.id);
    const tier = hintTier(redesign, `chart:${dish.id}`);
    const pointer = flagged ? chartHint(dish.id, chart[dish.id] ?? [], Math.max(1, tier)) : null;
    return (
      <div className="space-y-4" data-testid={`recipe-card-${dish.id}`}>
        <div className="bg-[#f7f3e8] text-zinc-900 rounded-sm p-4 shadow-inner border border-amber-100">
          <div className="text-xs uppercase tracking-widest text-zinc-600 font-bold">{copy.recipeEvidence} · {dish.course}</div>
          <h3 className="font-serif font-bold text-lg leading-tight mt-1">{dish.name}</h3>
          <div className="text-xs uppercase tracking-widest text-zinc-600 font-bold mt-3">{copy.ingredients}</div>
          <ul className="list-disc pl-5 text-sm mt-1 space-y-0.5">
            {dish.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
          {dish.note && (
            <p className="mt-3 text-sm border-t border-amber-200 pt-2">
              <span className="font-bold">{copy.notePrefix}:</span> {dish.note}
            </p>
          )}
        </div>

        {pointer && (
          <div role="status" className="bg-red-950/40 border border-red-900 rounded p-3 text-sm text-red-100 flex gap-2" data-testid={`chart-pointer-${dish.id}`}>
            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
            <div>
              <div className="text-xs uppercase tracking-widest text-red-300 font-bold">Terence</div>
              <p>{pointer}</p>
              <div className="flex items-center gap-3 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent border-red-800 text-red-100 hover:bg-red-900/40" onClick={() => onRequestHint(dish.id)} aria-label={`${copy.hintButton}: ${upperFirst(dish.short)}`}>
                  {copy.hintButton}
                </Button>
                <span className="text-xs text-red-300">{copy.hintCount(tier)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden space-y-2">
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">{copy.allergensPresent}</div>
          <p className="text-xs text-gray-400">{copy.allergensHint}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {ALLERGENS.map((allergen) => {
              const marked = (chart[dish.id] ?? []).includes(allergen.id);
              return (
                <label key={allergen.id} className={cn('flex items-center gap-2 rounded border px-2 py-1.5 text-xs cursor-pointer', marked ? 'bg-red-950/50 border-red-800' : 'bg-gray-900 border-gray-800')}>
                  <Checkbox
                    checked={marked}
                    onCheckedChange={() => onToggleAllergen(dish.id, allergen.id)}
                    aria-label={`${allergen.label} in the ${dish.short}`}
                    className="bg-black border-gray-500"
                  />
                  <span>{allergen.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`question-${dish.id}`} className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
            {copy.openQuestionsLabel}
          </label>
          <Textarea
            id={`question-${dish.id}`}
            value={redesign.openQuestions?.[dish.id] ?? ''}
            onChange={(event) => setQuestion(dish.id, event.target.value)}
            placeholder={copy.openQuestionsPlaceholder}
            className="bg-gray-900 border-gray-700 text-white text-sm min-h-[64px]"
          />
          <p className="text-xs text-gray-400">{copy.openQuestionHint}</p>
        </div>

        <label className={cn('flex items-start gap-3 rounded-md border p-3 cursor-pointer', status === 'reviewed' || status === 'reviewed-question' ? 'bg-emerald-950/30 border-emerald-900' : 'bg-gray-800/50 border-gray-700')}>
          <Checkbox
            checked={!!redesign.rowReviewConfirmed?.[dish.id]}
            onCheckedChange={(checked) => setConfirmed(dish.id, checked === true)}
            aria-label={`Row reviewed: ${upperFirst(dish.short)}`}
            className="mt-0.5 bg-black border-gray-500"
          />
          <span className="text-sm text-gray-200 leading-snug">
            {isTerenceChartRow(dish.id) ? copy.terenceReviewConfirmation : copy.reviewConfirmation}
          </span>
        </label>

        <div className="flex md:hidden justify-between gap-2">
          <Button variant="outline" className="bg-transparent border-gray-700 text-white" disabled={activeIndex === 0} onClick={() => setActiveDishId(DISHES[activeIndex - 1].id)}>
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {copy.previousDish}
          </Button>
          <Button variant="outline" className="bg-transparent border-gray-700 text-white" disabled={activeIndex === DISHES.length - 1} onClick={() => setActiveDishId(DISHES[activeIndex + 1].id)}>
            {copy.nextDish} <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 md:p-6 gap-4 overflow-y-auto short:gap-3 short:py-3" data-testid="chart-workspace">
      <WorkspaceOpener
        taskId="check-the-dietary-list"
        what={revisiting ? copy.revisitOpener.what : copy.opener.what}
        how={revisiting ? copy.revisitOpener.how : copy.opener.how}
        done={revisiting ? copy.revisitOpener.done : copy.opener.done}
        progress={{
          done: revisiting ? fixedFlaggedRows : confirmedRows,
          total: revisiting ? flaggedDishes.length : DISHES.length,
          noun: revisiting ? copy.revisitProgressNoun : copy.progressNoun,
        }}
        pattern="tap"
        tone="dark"
      />
      {/* In a short window the heading tightens so the chart itself starts higher up. */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4 short:pb-2 short:gap-2">
        <div>
          <h2 data-dialog-title className="text-2xl md:text-3xl font-serif font-bold text-red-500 short:text-2xl">{copy.title}</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base max-w-2xl short:max-w-none short:text-sm">{copy.description}</p>
          {chartChecked ? (
            <CheckFeedback kind="ok" title={copy.matchesSupplied} tone="dark" className="mt-3 w-fit py-2" testId="rows-remaining" />
          ) : (
            <p className="text-xs text-gray-300 mt-2 font-medium" data-testid="rows-remaining">
              {remaining === 0 ? copy.reviewedAll : copy.rowsRemaining(remaining)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="text-black bg-white hover:bg-gray-200 border-none">
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Back to the room
            </Button>
          )}
          {!chartChecked && (
            <div className="flex flex-col items-start gap-1 md:items-end">
              <Button onClick={onCheckChart} disabled={remaining > 0} className="bg-red-600 text-white hover:bg-red-700 font-semibold" data-testid="review-with-terence">
                {CHECK_COPY.check}
              </Button>
              {remaining > 0 && <p className="max-w-64 text-xs text-gray-400">{copy.reviewLocked}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Desktop: the whole matrix, five rows by fourteen columns. */}
          <div className="hidden md:block overflow-x-auto rounded border border-gray-800">
            <table className="w-full text-xs border-collapse" data-testid="allergen-matrix">
              <caption className="sr-only">{copy.tableCaption}</caption>
              <thead>
                <tr className="bg-gray-900">
                  <th scope="col" className="text-left p-2 sticky left-0 bg-gray-900 z-10 min-w-[150px]">{copy.dishColumn}</th>
                  {ALLERGENS.map((allergen) => (
                    <th key={allergen.id} scope="col" className="p-1 text-center font-medium align-bottom" title={allergen.label}>
                      <span className="block leading-tight" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', height: '5.5rem' }}>
                        {allergen.short}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="p-2 text-left min-w-[120px]">{copy.statusColumn}</th>
                </tr>
              </thead>
              <tbody>
                {DISHES.map((dish) => {
                  const status = rowStatus(stateView, dish.id);
                  const selected = dish.id === activeDish.id;
                  return (
                    <tr key={dish.id} className={cn('border-t border-gray-800', selected ? 'bg-red-950/20' : 'hover:bg-gray-900/60')} aria-selected={selected}>
                      <th scope="row" className={cn('text-left p-0 sticky left-0 z-10', selected ? 'bg-[#1d0b0b]' : 'bg-black')}>
                        <button
                          type="button"
                          onClick={() => setActiveDishId(dish.id)}
                          aria-pressed={selected}
                          aria-label={`${copy.selectedRow}: ${upperFirst(dish.short)}`}
                          className={cn('w-full text-left p-2 border-l-4 cursor-pointer hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400', selected ? 'border-red-500' : 'border-transparent')}
                        >
                          <span className="block text-xs uppercase tracking-wider text-gray-400">{dish.course}</span>
                          <span className="block font-semibold text-sm">{upperFirst(dish.short)}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-300">
                            <BookOpen className="h-3 w-3" aria-hidden="true" /> {copy.opensRecipeCard}
                          </span>
                        </button>
                      </th>
                      {ALLERGENS.map((allergen) => {
                        const marked = (chart[dish.id] ?? []).includes(allergen.id);
                        return (
                          <td key={allergen.id} className="p-0 text-center border-l border-gray-700">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={marked}
                              aria-label={`${allergen.label} in the ${dish.short}`}
                              onClick={() => { setActiveDishId(dish.id); onToggleAllergen(dish.id, allergen.id); }}
                              className={cn('w-full h-11 flex items-center justify-center cursor-pointer border-y border-transparent hover:border-red-500 hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400', marked && 'bg-red-950/40')}
                            >
                              {cellContent(dish, allergen.id)}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-2 border-l border-gray-900">
                        <div className="flex flex-col items-start gap-1">
                          {terenceAttribution(dish.id)}
                          <StatusChip status={status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phone: one dish at a time, the row as a list of fourteen. */}
          {isMobile && <div className="md:hidden">
            <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label={copy.dishColumn}>
              {DISHES.map((dish) => {
                const status = rowStatus(stateView, dish.id);
                const selected = dish.id === activeDish.id;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveDishId(dish.id)}
                    className={cn('shrink-0 rounded border px-2 py-1.5 text-left', selected ? 'border-red-500 bg-red-950/30' : 'border-gray-800 bg-gray-900')}
                  >
                    <span className="block text-xs font-semibold">{upperFirst(dish.short)}</span>
                     {terenceAttribution(dish.id)}
                    <StatusChip status={status} className="mt-1" />
                  </button>
                );
              })}
            </div>
            {renderRecipeCard(activeDish)}
          </div>}

          <div className="hidden md:flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-xs text-gray-400">{copy.legendTitle}:</span>
            {(Object.keys(copy.legend) as RowStatus[]).map((status) => (
              <StatusChip key={status} status={status} />
            ))}
            <span className="ml-2">{copy.cellLegend}</span>
          </div>

          <details className="rounded border border-gray-800 bg-gray-900/60 p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-gray-200">{copy.referenceTitle}</summary>
            <p className="text-xs text-gray-400 mt-2">{copy.referenceHint}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ALLERGENS.map((allergen) => (
                <button
                  key={allergen.id}
                  type="button"
                  aria-pressed={referenceId === allergen.id}
                  onClick={() => setReferenceId(referenceId === allergen.id ? null : allergen.id)}
                  className={cn('rounded border px-2 py-1 text-xs', referenceId === allergen.id ? 'border-red-500 bg-red-950/40' : 'border-gray-700 bg-black')}
                >
                  {allergen.label}
                </button>
              ))}
            </div>
            {referenceId && (
              <p className="mt-2 text-gray-200" data-testid="allergen-reference">
                {ALLERGEN_REFERENCE.find((entry) => entry.id === referenceId)?.plain}
              </p>
            )}
          </details>
        </div>

        {/* Desktop: the selected row's recipe card sits beside the matrix. */}
        {!isMobile && (
          <aside className="hidden md:block w-full md:w-96 shrink-0" aria-label={`${copy.recipeEvidence}: ${upperFirst(activeDish.short)}`}>
            {renderRecipeCard(activeDish)}
          </aside>
        )}
      </div>
    </div>
  );
}
