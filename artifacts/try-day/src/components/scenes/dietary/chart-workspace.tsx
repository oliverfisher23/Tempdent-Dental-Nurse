import { useState } from 'react';
import { DISHES, ALLERGENS } from '@/content/activities';
import { DietaryRedesignState } from '@/lib/redesign-dietary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col h-full bg-white text-black p-4 space-y-6 overflow-y-auto pb-20">
        <div>
          <h2 className="text-2xl font-serif font-bold text-red-600">Allergen matrix</h2>
          <p className="text-gray-600 text-sm mt-1">Check all 14 categories for every dish against the supplied ingredients.</p>
        </div>
        
        <div className="space-y-2">
          <label className="font-semibold text-sm text-gray-800">Select dish to review:</label>
          <div className="flex overflow-x-auto gap-2 pb-2">
            {DISHES.map(d => (
              <button 
                key={d.id} 
                onClick={() => setActiveDishId(d.id)} 
                className={`px-3 py-2 text-sm border rounded-md whitespace-nowrap flex items-center gap-2 transition-colors ${activeDishId === d.id ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'}`}
              >
                {d.name}
                {flaggedDishes.includes(d.id) && <AlertCircle className="w-4 h-4 text-red-500" />}
                {redesign.rowReviewConfirmed[d.id] && !flaggedDishes.includes(d.id) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 space-y-5 rounded-md shadow-sm">
          <h3 className="font-serif text-lg font-bold text-red-600 leading-tight">{activeDish.name}</h3>
          
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Ingredients</h4>
            <ul className="space-y-1 text-sm list-disc pl-5 marker:text-gray-400">
              {activeDish.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
            {activeDish.note && (activeDish.id !== 'frangipane' || flaggedDishes.includes('frangipane') || chartChecked) && (
              <p className="mt-3 text-sm italic text-gray-600 border-l-2 border-red-500 pl-2 bg-red-50/50 py-1">
                Note: {activeDish.note}
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Allergens present</h4>
            <div className="grid grid-cols-2 gap-3">
              {ALLERGENS.map(a => {
                const isTicked = (chart[activeDish.id] || []).includes(a.id);
                return (
                  <label key={a.id} className={`flex items-start gap-2 p-2 border rounded-md text-sm cursor-pointer transition-colors ${isTicked ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-300'}`}>
                    <input 
                      type="checkbox" 
                      checked={isTicked}
                      onChange={() => onToggleAllergen(activeDish.id, a.id)}
                      className="w-4 h-4 mt-0.5 accent-current rounded-sm"
                    />
                    <span className="leading-tight flex-1">{a.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-white border border-gray-300 rounded-md">
              <input 
                type="checkbox"
                checked={redesign.rowReviewConfirmed[activeDish.id] || false}
                onChange={(e) => handleRowReviewChange(activeDish.id, e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-black rounded"
              />
              <span className="text-sm font-medium leading-snug text-gray-800">
                I've checked all fourteen categories against these ingredients. I've marked those present and noted anything I need to check.
              </span>
            </label>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Open questions (e.g. supplier details)</label>
              <Input 
                value={redesign.openQuestions[activeDish.id] || ''}
                onChange={(e) => handleOpenQuestionChange(activeDish.id, e.target.value)}
                placeholder="Any unresolved details?"
                className="text-sm bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={onReviewWithTerence}
            className="bg-black text-white hover:bg-gray-800 w-full py-6 text-base font-semibold"
            disabled={!allRowsConfirmed || chartChecked}
          >
            {chartChecked ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Matches supplied ingredients</>
            ) : (
              'Review with Terence'
            )}
          </Button>
          
          {chartChecked && onNext && (
            <Button onClick={onNext} className="bg-red-600 text-white hover:bg-red-700 w-full py-6 text-base font-semibold">
              Next: Guest decisions
            </Button>
          )}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-col h-full bg-white text-black p-4 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif font-bold text-red-600">Allergen matrix</h2>
            <p className="text-gray-600 text-sm max-w-2xl mt-1">Check all 14 categories for every dish against the supplied ingredients. Mark those present. Do not invent details you aren't given.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={onReviewWithTerence}
              className="bg-black text-white hover:bg-gray-800 font-semibold"
              disabled={!allRowsConfirmed || chartChecked}
            >
              {chartChecked ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Matches supplied ingredients</>
              ) : (
                'Review with Terence'
              )}
            </Button>
            {chartChecked && onNext && (
              <Button onClick={onNext} className="bg-red-600 text-white hover:bg-red-700 font-semibold">
                Next: Guest decisions
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Left Side: The Matrix */}
          <div className="flex-1 overflow-auto border border-gray-200">
            <table className="w-full text-left text-sm border-collapse relative">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-2 border border-gray-200 font-medium whitespace-nowrap min-w-[200px] text-gray-700">Dish</th>
                  {ALLERGENS.map(a => (
                    <th key={a.id} className="p-2 border border-gray-200 font-medium text-xs text-center min-w-[60px] text-gray-700" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISHES.map(dish => {
                  const isFlagged = flaggedDishes.includes(dish.id);
                  const isConfirmed = redesign.rowReviewConfirmed[dish.id];
                  const isActive = activeDishId === dish.id;

                  return (
                    <tr 
                      key={dish.id} 
                      className={`transition-colors ${isActive ? 'bg-red-50' : 'hover:bg-gray-50'} ${isFlagged ? 'bg-red-100' : ''}`}
                    >
                      <td className="p-0 border border-gray-200">
                        <button 
                          onClick={() => setActiveDishId(dish.id)}
                          className="w-full h-full p-3 flex items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
                          aria-label={`Select ${dish.name} to review ingredients`}
                        >
                          <span className="font-semibold line-clamp-1" title={dish.name}>{dish.name}</span>
                          <div className="flex gap-1 shrink-0">
                            {isFlagged && <AlertCircle className="w-4 h-4 text-red-600" />}
                            {isConfirmed && !isFlagged && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          </div>
                        </button>
                      </td>
                      {ALLERGENS.map(a => {
                        const isTicked = (chart[dish.id] || []).includes(a.id);
                        return (
                          <td key={a.id} className="p-0 border border-gray-200 text-center">
                            <label className="flex items-center justify-center w-full h-full p-2 cursor-pointer hover:bg-black/5">
                              <span className="sr-only">{a.label}</span>
                              <input 
                                type="checkbox"
                                checked={isTicked}
                                onChange={() => { 
                                  setActiveDishId(dish.id); 
                                  onToggleAllergen(dish.id, a.id); 
                                }}
                                className="w-5 h-5 accent-black rounded border-gray-400 focus:ring-black cursor-pointer"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Side: Selected Dish Inspector */}
          <div className="w-[320px] shrink-0 bg-gray-50 border border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto shadow-inner rounded-r-md">
            <h3 className="font-serif text-lg font-bold text-red-600 leading-tight">{activeDish.name}</h3>
            
            <div>
              <h4 className="font-semibold text-xs text-gray-500 mb-2 tracking-wide">Ingredients</h4>
              <ul className="space-y-1 text-sm list-disc pl-4 marker:text-gray-400">
                {activeDish.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
              {activeDish.note && (activeDish.id !== 'frangipane' || flaggedDishes.includes('frangipane') || chartChecked) && (
                <p className="mt-3 text-sm italic text-gray-600 border-l-2 border-red-500 pl-2 bg-red-50/50 py-1">
                  Note: {activeDish.note}
                </p>
              )}
            </div>

            <div className="space-y-4 mt-auto pt-4 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer p-2 -mx-2 hover:bg-white rounded transition-colors">
                <input 
                  type="checkbox"
                  checked={redesign.rowReviewConfirmed[activeDish.id] || false}
                  onChange={(e) => handleRowReviewChange(activeDish.id, e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-black rounded cursor-pointer"
                />
                <span className="text-sm font-medium leading-snug text-gray-800">
                  I've checked all fourteen categories against these ingredients. I've marked those present and noted anything I need to check.
                </span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 tracking-wide">Open questions (e.g. supplier details)</label>
                <Input 
                  value={redesign.openQuestions[activeDish.id] || ''}
                  onChange={(e) => handleOpenQuestionChange(activeDish.id, e.target.value)}
                  placeholder="Any unresolved details?"
                  className="text-sm bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
