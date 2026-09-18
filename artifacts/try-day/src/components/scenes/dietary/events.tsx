import { useState, useEffect } from 'react';
import { PLACES } from '@/content/kitchen';
import { Hotspot } from '../../kitchen/hotspot';
import { CloseUp } from '../../kitchen/close-up';
import { kitchenAudio } from '@/lib/audio';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import { ChartWorkspace } from './chart-workspace';
import { GuestsWorkspace } from './guests-workspace';
import { BoardWorkspace } from './board-workspace';
import { DietaryRedesignState } from '@/lib/redesign-dietary';
import { wrongChartRows } from '@/lib/simulation';
import { DISHES, ADDED_GUESTS } from '@/content/activities';
import { getDietaryRedesignStage } from '@/lib/redesign-dietary';

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
  redesign,
  onUpdateRedesign,
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
  redesign?: DietaryRedesignState;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
}) {
  const [activeWorkspace, setActiveWorkspace] = useState<'chart' | 'board' | 'guests' | null>(null);

  const stage = getDietaryRedesignStage({
    chart: stateChart,
    flaggedDishes,
    chartChecked,
    guests: stateGuests,
    boardNote,
    boardPosted,
    redesign: redesign as any,
  } as any);

  useKitchenAction('dietary.open-chart', () => setActiveWorkspace('chart'));
  useKitchenAction('dietary.open-board', () => {
    if (stage === 'board' || stage === 'done') {
      setActiveWorkspace('board');
    }
  });
  useKitchenAction('dietary.open-function-sheet', () => {
    if (stage === 'guests' || stage === 'board' || stage === 'done') {
      setActiveWorkspace('guests');
    }
  });

  useEffect(() => {
    if (!redesign) {
      onUpdateRedesign(() => ({
        version: 1,
        decisions: {},
        serviceHoldAcknowledged: false,
        rowReviewConfirmed: {},
        openQuestions: {},
      }));
    }
  }, [redesign, onUpdateRedesign]);

  if (!redesign) return null;

  const backdrop = PLACES['events'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {activeWorkspace === null && (
        <>
          <Hotspot 
            x={65} 
            y={40} 
            label="Allergen matrix & recipe cards" 
            state={stage !== 'chart' ? 'done' : 'active'} 
            onClick={() => { kitchenAudio.play('page'); setActiveWorkspace('chart'); }} 
          />

          <Hotspot 
            x={15} 
            y={25} 
            label="Function sheet & guest decisions" 
            state={stage === 'guests' ? 'active' : (stage === 'chart' ? 'todo' : 'done')} 
            onClick={() => { 
              if (stage !== 'chart') {
                kitchenAudio.play('page'); 
                setActiveWorkspace('guests'); 
              }
            }} 
          />
          
          <Hotspot 
            x={80} 
            y={35} 
            label="Evening board" 
            state={stage === 'board' ? 'active' : (stage === 'done' ? 'done' : 'todo')} 
            onClick={() => { 
              if (stage === 'board' || stage === 'done') {
                kitchenAudio.play('page'); 
                setActiveWorkspace('board'); 
              }
            }} 
          />
        </>
      )}

      <CloseUp 
        isOpen={activeWorkspace === 'chart'} 
        title="Allergen Matrix" 
        onClose={() => setActiveWorkspace(null)} 
        className="max-w-6xl w-[90vw] h-[85vh] md:h-[80vh] p-0"
      >
        <ChartWorkspace 
          chart={stateChart}
          redesign={redesign}
          flaggedDishes={flaggedDishes}
          onToggleAllergen={onToggleAllergen}
          onUpdateRedesign={onUpdateRedesign}
          onReviewWithTerence={onCheckChart}
          chartChecked={chartChecked}
          onNext={() => {
            kitchenAudio.play('page');
            setActiveWorkspace('guests');
          }}
        />
      </CloseUp>

      <CloseUp 
        isOpen={activeWorkspace === 'guests'} 
        title="Guest Decisions" 
        onClose={() => setActiveWorkspace(null)} 
        className="max-w-6xl w-[95vw] h-[90vh] md:w-[90vw] md:h-[80vh] p-0"
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="guest-decisions-scroll">
          <GuestsWorkspace 
            redesign={redesign}
            onUpdateRedesign={onUpdateRedesign}
            stateGuests={stateGuests}
            onAssignGuest={onAssignGuest}
            stateChart={stateChart}
          />
          </div>
          <div className="shrink-0 p-3 bg-white border-t border-gray-200 flex flex-wrap gap-2 justify-between">
            <button 
              onClick={() => {
                kitchenAudio.play('page');
                setActiveWorkspace('chart');
              }}
              className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back to matrix
            </button>
            <button 
              onClick={() => {
                kitchenAudio.play('page');
                setActiveWorkspace('board');
              }}
              disabled={stage === 'guests' || stage === 'chart'}
              className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Evening board
            </button>
          </div>
        </div>
      </CloseUp>

      <CloseUp 
        isOpen={activeWorkspace === 'board'} 
        title="Evening Board" 
        onClose={() => setActiveWorkspace(null)} 
        className="max-w-5xl w-[90vw] h-[85vh] md:h-[70vh] p-0"
      >
        <BoardWorkspace 
          boardNote={boardNote}
          onBoardNoteChange={onBoardNoteChange}
          boardPosted={boardPosted}
          onPostBoard={onPostBoard}
          redesign={redesign}
          onUpdateRedesign={onUpdateRedesign}
          stateGuests={stateGuests}
          onBack={() => {
            kitchenAudio.play('page');
            setActiveWorkspace('guests');
          }}
        />
      </CloseUp>
    </div>
  );
}
