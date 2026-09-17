import { useState } from 'react';
import { PLACES } from '@/content/kitchen';
import { DISHES, ALLERGENS } from '@/content/activities';
import { Hotspot } from '../../kitchen/hotspot';
import { CloseUp } from '../../kitchen/close-up';
import { Sheet, Whiteboard } from '../../kitchen/paper';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { boardNoteIsUseful } from '@/lib/simulation';
import { FunctionSheetCloseUp } from './function-sheet';

export function EventsScene({
  stateChart,
  flaggedDishes,
  chartChecked,
  onToggleAllergen,
  onCheckChart,
  boardNote,
  onBoardNoteChange,
  boardPosted,
  onPostBoard,
  allGuestsSafe,
  stateGuests,
  onAssignGuest,
}: {
  stateChart: Record<string, string[]>;
  flaggedDishes: string[];
  chartChecked: boolean;
  onToggleAllergen: (dishId: string, allergenId: string) => void;
  onCheckChart: () => void;
  boardNote: string;
  onBoardNoteChange: (val: string) => void;
  boardPosted: boolean;
  onPostBoard: () => void;
  allGuestsSafe: boolean;
  stateGuests: Record<string, any>;
  onAssignGuest: (guestId: string, field: 'main' | 'dessert', val: string) => void;
}) {
  const [cardsOpen, setCardsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);

  const backdrop = PLACES['events'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      <Hotspot 
        x={35} 
        y={55} 
        label="Recipe cards box" 
        state="todo" 
        onClick={() => { kitchenAudio.play('tap'); setCardsOpen(true); }} 
      />

      <Hotspot 
        x={65} 
        y={40} 
        label="Allergen chart" 
        state={chartChecked ? 'done' : 'active'} 
        onClick={() => { kitchenAudio.play('page'); setChartOpen(true); }} 
      />

      <Hotspot 
        x={80} 
        y={35} 
        label="Evening board" 
        state={boardPosted ? 'done' : (chartChecked && allGuestsSafe ? 'active' : 'todo')} 
        onClick={() => { kitchenAudio.play('page'); setBoardOpen(true); }} 
      />

      <Hotspot 
        x={15} 
        y={25} 
        label="Function sheet (in your pocket)" 
        state="active" 
        onClick={() => { kitchenAudio.play('page'); setSheetOpen(true); }} 
      />

      <FunctionSheetCloseUp 
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        stateGuests={stateGuests}
        onAssignGuest={onAssignGuest}
        chartChecked={chartChecked}
      />

      {/* Recipe Cards Box */}
      <CloseUp isOpen={cardsOpen} onClose={() => setCardsOpen(false)} title="Recipe cards" className="max-w-4xl">
        <div className="bg-zinc-100 p-6 md:p-8 rounded-lg shadow-2xl flex flex-col md:flex-row gap-6 h-[75vh]">
          {/* Card list */}
          <div className="w-full md:w-1/3 flex flex-col gap-2 overflow-y-auto pr-2">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 pl-1">Recipe Box</div>
            {DISHES.map((dish, i) => (
              <button 
                key={dish.id}
                onClick={() => { kitchenAudio.play('page'); setActiveCard(i); }}
                className={cn(
                  "text-left p-3 rounded border text-sm font-medium transition-colors",
                  activeCard === i ? "bg-white shadow-md border-zinc-300 ring-2 ring-primary/20" : "bg-zinc-200/50 border-transparent hover:bg-zinc-200"
                )}
              >
                <div className="text-[10px] text-zinc-500 uppercase mb-1">{dish.course}</div>
                <div className="line-clamp-2 leading-snug text-zinc-800">{dish.name}</div>
              </button>
            ))}
          </div>
          {/* Active Card */}
          <div className="w-full md:w-2/3 h-full flex items-center justify-center">
            <Sheet className="w-full h-full max-h-full">
              <div className="p-6 md:p-10 h-full flex flex-col overflow-y-auto">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-200 pb-3">
                  {DISHES[activeCard].course}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-zinc-800 mb-8 leading-tight font-serif">
                  {DISHES[activeCard].name}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 bg-zinc-50 inline-block px-3 py-1 rounded">Ingredients</div>
                  <ul className="space-y-3">
                    {DISHES[activeCard].ingredients.map((ing, i) => (
                      <li key={i} className="text-zinc-700 font-medium pl-5 relative before:absolute before:left-1 before:top-2 before:w-1.5 before:h-1.5 before:bg-zinc-400 before:rounded-full">
                        {ing}
                      </li>
                    ))}
                  </ul>
                  {DISHES[activeCard].note && (
                    <div className="mt-10 p-5 bg-yellow-50 text-yellow-800 text-sm font-medium border-l-4 border-yellow-400 rounded-r shadow-sm">
                      <span className="uppercase tracking-wider font-bold text-xs block mb-1">Chef's Note</span>
                      {DISHES[activeCard].note}
                    </div>
                  )}
                </div>
              </div>
            </Sheet>
          </div>
        </div>
      </CloseUp>

      {/* Allergen Chart */}
      <CloseUp isOpen={chartOpen} onClose={() => setChartOpen(false)} title="Allergen chart" className="max-w-7xl w-[95vw]">
        <Whiteboard>
          <div className="p-4 md:p-8 flex flex-col h-full max-h-[85vh]">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-6 text-zinc-800 hidden md:block font-sans">Allergen Declaration Chart</h2>
            
            <div className="flex-1 overflow-auto md:border border-zinc-200 md:rounded-sm md:bg-white md:shadow-inner -mx-4 px-4 md:mx-0 md:px-0">
              {/* Mobile View */}
              <div className="flex md:hidden flex-col gap-4 pb-4">
                {DISHES.map(dish => {
                  const ticked = stateChart[dish.id] || [];
                  const isFlagged = flaggedDishes.includes(dish.id);

                  return (
                    <motion.div 
                      key={dish.id}
                      className={cn("bg-white border rounded p-4 shadow-sm relative overflow-hidden", isFlagged ? "border-red-300" : "border-zinc-200")}
                      animate={isFlagged ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {isFlagged && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                      <div className="font-bold text-zinc-800 text-lg mb-1 leading-tight">{dish.name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">{dish.course}</div>
                      
                      <div className="flex flex-wrap gap-2">
                        {ALLERGENS.map(a => {
                          const isTicked = ticked.includes(a.id);
                          return (
                            <button
                              key={a.id}
                              onClick={() => {
                                kitchenAudio.play('write');
                                onToggleAllergen(dish.id, a.id);
                              }}
                              disabled={chartChecked}
                              aria-label={`${a.label} in ${dish.name}`}
                              aria-pressed={isTicked}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-bold transition-colors border",
                                isTicked 
                                  ? "bg-blue-100 border-blue-300 text-blue-800 shadow-inner" 
                                  : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100",
                                chartChecked && "opacity-50 cursor-default"
                              )}
                            >
                              {a.label}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <table className="hidden md:table w-full text-left text-sm border-collapse min-w-[900px] kitchen-table">
                <thead className="sticky top-0 bg-zinc-50 z-20 shadow-sm border-b-2 border-zinc-300">
                  <tr>
                    <th className="p-4 border-r border-zinc-200 font-bold bg-zinc-100 min-w-[250px] shadow-[inset_0_-2px_0_0_#d4d4d8] sticky left-0 z-30">Dish</th>
                    {ALLERGENS.map(a => (
                      <th key={a.id} className="p-2 border-r border-zinc-200 text-center min-w-[44px] max-w-[44px] h-40 align-bottom bg-zinc-50 shadow-[inset_0_-2px_0_0_#d4d4d8]">
                        <div className="text-xs font-bold text-zinc-500 tracking-wider whitespace-nowrap mb-3 inline-block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                          {a.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DISHES.map(dish => {
                    const ticked = stateChart[dish.id] || [];
                    const isFlagged = flaggedDishes.includes(dish.id);
                    
                    return (
                      <motion.tr 
                        key={dish.id} 
                        className={cn("hover:bg-zinc-50/50 transition-colors border-b border-zinc-200", isFlagged && "bg-red-50/50")}
                        animate={isFlagged ? { x: [-3, 3, -3, 3, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <td className="p-4 border-r border-zinc-200 relative bg-white sticky left-0 z-10 shadow-[inset_-1px_0_0_0_#e4e4e7]">
                          <div className="font-bold text-zinc-800 leading-tight">{dish.name}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{dish.course}</div>
                          {isFlagged && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                        </td>
                        {ALLERGENS.map(a => {
                          const isTicked = ticked.includes(a.id);
                          return (
                            <td key={a.id} className="border-r border-zinc-200 text-center p-0 align-middle bg-white">
                              <button
                                onClick={() => {
                                  kitchenAudio.play('write');
                                  onToggleAllergen(dish.id, a.id);
                                }}
                                disabled={chartChecked}
                                aria-label={`${a.label} in ${dish.name}`}
                                aria-pressed={isTicked}
                                className={cn(
                                  "w-full h-16 flex items-center justify-center transition-all text-xl font-bold",
                                  isTicked ? "text-blue-600 bg-blue-50/30" : "text-transparent hover:bg-zinc-100",
                                  chartChecked && "opacity-50 cursor-default"
                                )}
                                style={isTicked ? { fontFamily: 'cursive' } : {}}
                              >
                                {isTicked ? "X" : "·"}
                              </button>
                            </td>
                          );
                        })}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end shrink-0">
              {chartChecked ? (
                <div className="text-emerald-700 font-bold flex items-center gap-2 bg-emerald-50 px-6 py-3 rounded border border-emerald-200 shadow-sm uppercase tracking-wider text-sm">
                  <Check className="w-5 h-5" /> Chart verified
                </div>
              ) : (
                <Button onClick={() => { kitchenAudio.play('tap'); onCheckChart(); }} className="px-8 py-6 text-base font-bold shadow-md">
                  Read it through with Marcus
                </Button>
              )}
            </div>
          </div>
        </Whiteboard>
      </CloseUp>

      {/* Evening Board */}
      <CloseUp isOpen={boardOpen} onClose={() => setBoardOpen(false)} title="Evening board" className="max-w-2xl">
        <Whiteboard>
          <div className="p-8 h-[60vh] flex flex-col relative">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-6 text-zinc-800 font-sans">Evening Board</h2>
            
            <Textarea
              value={boardNote}
              onChange={(e) => onBoardNoteChange(e.target.value)}
              disabled={!chartChecked || boardPosted}
              placeholder={chartChecked ? "Write changes for the evening team here..." : "Verify the allergen chart first..."}
              className="flex-1 kitchen-input text-2xl resize-none bg-transparent border-0 p-4 leading-relaxed focus-visible:ring-0 placeholder:text-zinc-300"
              style={{ fontFamily: 'cursive' }}
            />

            <div className="mt-6 pt-6 border-t border-zinc-200 flex flex-col items-center gap-4">
              <p className="text-sm text-zinc-500 font-medium bg-zinc-50 px-4 py-2 rounded border border-zinc-200">
                Mention Priya or table 3, and that the dish is poached pear.
              </p>
              <Button 
                onClick={() => { kitchenAudio.play('write'); onPostBoard(); }}
                disabled={!chartChecked || !allGuestsSafe || boardPosted || !boardNoteIsUseful(boardNote)}
                className="w-full max-w-sm py-6 text-lg font-bold shadow-md"
              >
                {boardPosted ? "Posted to board" : "Post to board"}
              </Button>
            </div>
          </div>
        </Whiteboard>
      </CloseUp>
    </div>
  );
}
