import { useState } from 'react';
import { DISHES, ALLERGENS } from '@/content/activities';
import { DietaryRedesignState } from '@/lib/redesign-dietary';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

interface ChartWorkspaceProps {
  chart: Record<string, string[]>;
  redesign: DietaryRedesignState;
  flaggedDishes: string[];
  onToggleAllergen: (dishId: string, allergenId: string) => void;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  onReviewWithTerence: () => void;
  chartChecked: boolean;
  onNext?: () => void;
}

export function ChartWorkspace({
  chart,
  redesign,
  flaggedDishes,
  onToggleAllergen,
  onUpdateRedesign,
  onReviewWithTerence,
  chartChecked,
  onNext
}: ChartWorkspaceProps) {
  const [activeDishId, setActiveDishId] = useState<string>(DISHES[0].id);
  const activeDish = DISHES.find(d => d.id === activeDishId)!;

  const handleRowReviewChange = (dishId: string, checked: boolean) => {
    onUpdateRedesign(prev => ({
      ...prev,
      rowReviewConfirmed: {
        ...prev.rowReviewConfirmed,
        [dishId]: checked
      }
    }));
  };

  const handleOpenQuestionChange = (dishId: string, question: string) => {
    onUpdateRedesign(prev => ({
      ...prev,
      openQuestions: {
        ...prev.openQuestions,
        [dishId]: question
      }
    }));
  };

  const allRowsConfirmed = DISHES.every(d => redesign.rowReviewConfirmed[d.id]);

  const currentIndex = DISHES.findIndex(d => d.id === activeDishId);
  const isLast = currentIndex === DISHES.length - 1;

  const handleNextDish = () => {
    if (!isLast) setActiveDishId(DISHES[currentIndex + 1].id);
  };

  return (
    <div className="flex flex-col h-full bg-white text-black p-4 space-y-4 md:space-y-6 overflow-y-auto" data-testid="chart-workspace">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-red-600">{DIETARY_UI.chart.title}</h2>
          <p className="text-gray-600 text-sm max-w-2xl mt-1">{DIETARY_UI.chart.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={onReviewWithTerence}
            className="bg-black text-white hover:bg-gray-800 font-semibold h-11"
            disabled={!allRowsConfirmed || chartChecked}
            aria-live="polite"
          >
            {chartChecked ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> {DIETARY_UI.chart.matchesSupplied}</>
            ) : (
              DIETARY_UI.chart.reviewWithTerence
            )}
          </Button>
          {chartChecked && onNext && (
            <Button onClick={onNext} className="bg-red-600 text-white hover:bg-red-700 font-semibold h-11 motion-safe:transition-all">
              {DIETARY_UI.chart.nextDecisions}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 min-h-0 pb-10 md:pb-0">
        {/* Dish Navigation List */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:pr-2 pb-2 md:pb-0" role="tablist" aria-label="Dishes to review">
          {DISHES.map(dish => {
            const isFlagged = flaggedDishes.includes(dish.id);
            const isConfirmed = redesign.rowReviewConfirmed[dish.id];
            const isActive = activeDishId === dish.id;

            return (
              <button
                key={dish.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`dish-panel-${dish.id}`}
                id={`dish-tab-${dish.id}`}
                onClick={() => setActiveDishId(dish.id)}
                className={`flex-shrink-0 md:flex-shrink flex items-center justify-between text-left p-3 min-w-[180px] md:min-w-0 md:w-full border rounded-md motion-safe:transition-all focus-visible:ring-2 focus-visible:ring-black outline-none ${
                  isActive
                    ? 'border-black bg-gray-50 ring-1 ring-black shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isFlagged ? 'bg-red-50 border-red-200' : ''}`}
              >
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-sm line-clamp-1">{dish.name}</span>
                  <span className="text-xs text-gray-500">{dish.course}</span>
                </div>
                <div className="flex shrink-0">
                  {isFlagged && <AlertCircle className="w-5 h-5 text-red-600" aria-label="Review needed" />}
                  {isConfirmed && !isFlagged && <CheckCircle2 className="w-5 h-5 text-green-600" aria-label="Checked" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Dish Details */}
        <div
          id={`dish-panel-${activeDish.id}`}
          role="tabpanel"
          aria-labelledby={`dish-tab-${activeDish.id}`}
          className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6 overflow-y-auto"
        >
          <div className="mb-6">
            <h3 className="font-serif text-xl md:text-2xl font-bold text-red-600 leading-tight mb-4">{activeDish.name}</h3>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left Column: Ingredients (Evidence) */}
              <div className="flex-1 space-y-4">
                <div key={activeDish.id} className="bg-white p-4 border border-gray-200 rounded-md shadow-sm activity-enter">
                  <h4 className="font-semibold text-sm text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5 rounded-sm text-xs">{DIETARY_UI.chart.recipeEvidence}</span>
                    {DIETARY_UI.chart.ingredients}
                  </h4>
                  <ul className="space-y-1.5 text-sm list-disc pl-5 marker:text-gray-400">
                    {activeDish.ingredients.map((ing, i) => (
                      <li key={i} className="text-gray-800 leading-snug">{ing}</li>
                    ))}
                  </ul>
                  {activeDish.note && (activeDish.id !== 'frangipane' || flaggedDishes.includes('frangipane') || chartChecked) && (
                    <p className="mt-4 text-sm text-gray-800 border-l-4 border-red-500 pl-3 py-1.5 bg-red-50/50" role="note">
                      <span className="font-semibold block mb-0.5 text-red-700">{DIETARY_UI.chart.notePrefix}</span>
                      {activeDish.note}
                    </p>
                  )}
                </div>

                {/* Review Checkbox Area */}
                <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm">
                   <label className="flex items-start gap-3 cursor-pointer p-1 rounded-sm focus-within:ring-2 focus-within:ring-black outline-none motion-safe:transition-colors hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={redesign.rowReviewConfirmed[activeDish.id] || false}
                      onChange={(e) => handleRowReviewChange(activeDish.id, e.target.checked)}
                      className="w-6 h-6 mt-0.5 shrink-0 accent-black rounded cursor-pointer"
                      aria-label={`Confirm review for ${activeDish.name}`}
                    />
                    <span className="text-sm font-medium leading-relaxed text-gray-800">
                      {DIETARY_UI.chart.reviewConfirmation}
                    </span>
                  </label>

                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                    <label htmlFor={`open-q-${activeDish.id}`} className="text-sm font-semibold text-gray-700">{DIETARY_UI.chart.openQuestionsLabel}</label>
                    <Input
                      id={`open-q-${activeDish.id}`}
                      value={redesign.openQuestions[activeDish.id] || ''}
                      onChange={(e) => handleOpenQuestionChange(activeDish.id, e.target.value)}
                      placeholder={DIETARY_UI.chart.openQuestionsPlaceholder}
                      className="text-sm bg-white min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Allergen Checklist */}
              <div className="flex-1 lg:max-w-md space-y-3">
                <h4 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">{DIETARY_UI.chart.allergensPresent}</h4>
                <p className="text-xs text-gray-500 mb-2">{DIETARY_UI.chart.allergensHint}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {ALLERGENS.map(a => {
                    const isTicked = (chart[activeDish.id] || []).includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 p-2.5 border rounded-md text-sm cursor-pointer motion-safe:transition-colors focus-within:ring-2 focus-within:ring-black outline-none ${
                          isTicked
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isTicked}
                          onChange={() => onToggleAllergen(activeDish.id, a.id)}
                          className="w-5 h-5 shrink-0 accent-current rounded-sm focus:ring-0 focus:outline-none cursor-pointer"
                        />
                        <span className="leading-tight font-medium select-none flex-1">{a.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Internal Navigation for Mobile/Flow */}
          {!isLast && (
            <div className="mt-auto pt-6 border-t border-gray-200 flex justify-end">
              <Button
                variant="outline"
                onClick={handleNextDish}
                className="gap-2 bg-white text-black h-11 px-6 border-gray-300 hover:bg-gray-100"
              >
                {DIETARY_UI.chart.nextDish} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
