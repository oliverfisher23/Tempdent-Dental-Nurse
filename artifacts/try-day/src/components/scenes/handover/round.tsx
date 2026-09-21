import { useState } from 'react';
import type { HandoverRoundProps } from './round-types';
import { handoverLogRead, nextHandoverUnit, handoverRowSaved } from '@/lib/handover-round';
import { FRIDGE_UNITS } from '@/content/activities';
import { LogView } from './log-view';
import { InspectionView } from './inspection-view';
import { BoardReview } from './board-review';
import { useInspectionMotion } from './use-inspection-motion';
import { useWorkspaceOpen } from '@/components/kitchen/kitchen-context';

export function HandoverRound(props: HandoverRoundProps) {
  useWorkspaceOpen('handover:workspace');
  const [recheckUnitId, setRecheckUnitId] = useState<string | null>(null);
  const motion = useInspectionMotion();

  const { state, onReadLog, onProbe, onRowChange, onSaveClose, frozen = false } = props;

  const logRead = handoverLogRead(state);
  const nextUnit = nextHandoverUnit(state);
  const currentUnitId = recheckUnitId || nextUnit?.id || null;
  const savedCount = FRIDGE_UNITS.filter(u => handoverRowSaved(u.id, state.rows[u.id])).length;
  const totalCount = FRIDGE_UNITS.length;

  if (!logRead) {
    return <LogView onStart={onReadLog} />;
  }

  if (currentUnitId) {
    return (
      <InspectionView
        key={currentUnitId}
        {...motion}
        unitId={currentUnitId}
        state={state}
        onProbe={onProbe}
        onRowChange={onRowChange}
        onSaveClose={(id) => {
          const success = onSaveClose(id);
          if (success && recheckUnitId === id) {
             setRecheckUnitId(null);
          }
          return success;
        }}
        savedCount={savedCount}
        totalCount={totalCount}
        frozen={frozen}
        onSelectUnit={(id) => setRecheckUnitId(id === nextUnit?.id ? null : id)}
      />
    );
  }

  return <BoardReview state={state} frozen={frozen} onRecheck={(id) => setRecheckUnitId(id)} />;
}
