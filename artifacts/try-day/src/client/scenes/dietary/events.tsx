import { useState } from 'react';
import { PLACES } from '@client/content/kitchen';
import { ADDED_GUESTS } from '@client/content/activities';
import { DIETARY_UI } from '@client/content/scenes/dietary-interaction';
import { kitchenAudio } from '@kit/lib/audio';
import type { DietaryState } from '@client/lib/simulation';
import {
  dietaryDecisionsReady,
  getDietaryRedesignStage,
  type DecisionFeedback,
  type DietaryCourse,
  type DietaryDecision,
  type DietaryRedesignState,
} from '@client/lib/redesign-dietary';
import { Hotspot } from '@shell/frame/hotspot';
import { CloseUp } from '@shell/frame/close-up';
import { useKitchenAction, useWorkspaceOpen } from '@shell/frame/kitchen-context';
import { ChartWorkspace } from './chart-workspace';
import { GuestsWorkspace } from './guests-workspace';
import { BoardWorkspace } from './board-workspace';

type Workspace = 'chart' | 'guests' | 'board' | null;

export interface EventsSceneProps {
  state: DietaryState;
  redesign: DietaryRedesignState;
  onToggleAllergen: (dishId: string, allergenId: string) => void;
  onCheckChart: () => void;
  onRequestChartHint: (dishId: string) => void;
  onDecide: (guestId: string, course: DietaryCourse, patch: Partial<DietaryDecision>) => void;
  onCheckDecision: (guestId: string, course: DietaryCourse) => void;
  decisionFeedback: Record<string, DecisionFeedback | undefined>;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  onPostBoard: () => void;
}

/** The events office: chart, guest decisions and the evening board, opened in that order. */
export function EventsScene({
  state,
  redesign,
  onToggleAllergen,
  onCheckChart,
  onRequestChartHint,
  onDecide,
  onCheckDecision,
  decisionFeedback,
  onUpdateRedesign,
  onPostBoard,
}: EventsSceneProps) {
  const [workspace, setWorkspace] = useState<Workspace>(null);
  // Lifted so a trip back to the chart returns to the same guest.
  const [activeGuestId, setActiveGuestId] = useState<string>(ADDED_GUESTS[0].id);
  const stage = getDietaryRedesignStage(state);
  const chartOpen = stage !== 'sheet';
  const guestsOpen = stage === 'guests' || stage === 'board' || stage === 'done';
  const boardOpen = stage === 'board' || stage === 'done';
  const decisionsReady = dietaryDecisionsReady(redesign, state.guests, state.chart);

  const open = (next: Exclude<Workspace, null>) => {
    kitchenAudio.play('page');
    setWorkspace(next);
  };

  useKitchenAction('dietary.open-chart', () => { if (chartOpen) open('chart'); });
  useKitchenAction('dietary.open-guests', () => { if (guestsOpen) open('guests'); });
  useKitchenAction('dietary.open-board', () => { if (boardOpen) open('board'); });
  useWorkspaceOpen(workspace ? `dietary.open-${workspace}` : null);

  const backdrop = PLACES['events'].backdrop;

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {workspace === null && (
        <>
          <Hotspot
            x={62}
            y={42}
            label={DIETARY_UI.chart.hotspot}
            hint={chartOpen ? undefined : DIETARY_UI.chart.hotspotLocked}
            state={stage === 'chart' ? 'active' : chartOpen ? 'done' : 'locked'}
            onClick={() => { if (chartOpen) open('chart'); }}
          />
          <Hotspot
            x={18}
            y={30}
            label={DIETARY_UI.guests.hotspot}
            hint={guestsOpen ? undefined : DIETARY_UI.guests.hotspotLocked}
            state={stage === 'guests' ? 'active' : guestsOpen ? 'done' : 'locked'}
            onClick={() => { if (guestsOpen) open('guests'); }}
          />
          <Hotspot
            x={82}
            y={32}
            label={DIETARY_UI.board.hotspot}
            hint={boardOpen ? undefined : DIETARY_UI.board.hotspotLocked}
            state={stage === 'board' ? 'active' : stage === 'done' ? 'done' : 'locked'}
            onClick={() => { if (boardOpen) open('board'); }}
          />
        </>
      )}

      <CloseUp
        isOpen={workspace === 'chart'}
        title={DIETARY_UI.chart.title}
        onClose={() => setWorkspace(null)}
        className="max-w-[1400px] w-full h-full md:w-[96vw] md:h-[92vh] p-0 rounded-none md:rounded-lg"
      >
        <ChartWorkspace
          chart={state.chart}
          flaggedDishes={state.flaggedDishes}
          chartChecked={state.chartChecked}
          redesign={redesign}
          onToggleAllergen={onToggleAllergen}
          onUpdateRedesign={onUpdateRedesign}
          onCheckChart={onCheckChart}
          onRequestHint={onRequestChartHint}
          onBack={() => setWorkspace(null)}
        />
      </CloseUp>

      <CloseUp
        isOpen={workspace === 'guests'}
        title={DIETARY_UI.guests.title}
        onClose={() => setWorkspace(null)}
        className="max-w-[1400px] w-full h-full md:w-[96vw] md:h-[92vh] p-0 rounded-none md:rounded-lg"
      >
        <GuestsWorkspace
          chart={state.chart}
          redesign={redesign}
          guests={state.guests}
          activeGuestId={activeGuestId}
          onSelectGuest={setActiveGuestId}
          onDecide={onDecide}
          onCheckWithTerence={onCheckDecision}
          feedback={decisionFeedback}
          decisionsReady={decisionsReady}
          onOpenChart={() => open('chart')}
          onBack={() => setWorkspace(null)}
        />
      </CloseUp>

      <CloseUp
        isOpen={workspace === 'board'}
        title={DIETARY_UI.board.title}
        onClose={() => setWorkspace(null)}
        className="max-w-[1400px] w-full h-full md:w-[96vw] md:h-[92vh] p-0 rounded-none md:rounded-lg"
      >
        <BoardWorkspace
          redesign={redesign}
          boardPosted={state.boardPosted}
          onUpdateRedesign={onUpdateRedesign}
          onPostBoard={onPostBoard}
          onBack={() => open('guests')}
        />
      </CloseUp>
    </div>
  );
}
