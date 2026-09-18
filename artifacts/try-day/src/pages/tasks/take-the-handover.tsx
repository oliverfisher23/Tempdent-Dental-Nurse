import { FRIDGE_UNITS, OVERNIGHT_LOG } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { handoverLogRead, handoverRoundSaved, handoverRowComplete, handoverRowSaved } from '@/lib/handover-round';
import { kitchenAudio } from '@/lib/audio';
import { getHandoverGuide } from '@/content/guides/handover-delivery';
import { KitchenFrame } from '@/components/kitchen/kitchen-frame';
import { HandoverRound } from '@/components/scenes/handover/round';
import type { HandoverRoundProps } from '@/components/scenes/handover/round-types';

export default function HandoverTask() {
  const { progress, updateTask, advanceClock } = useProgress();
  const state = progress.tasks['take-the-handover'];
  const frozen = progress.completed.includes('take-the-handover');

  const handleReadLog = () => {
    if (frozen || handoverLogRead(state)) return;
    updateTask('take-the-handover', prev => ({
      ...prev,
      logRead: OVERNIGHT_LOG.map(entry => entry.time),
    }));
    advanceClock(3);
    kitchenAudio.play('page');
  };

  const handleProbe = (unitId: string) => {
    if (frozen || !handoverLogRead(state) || !FRIDGE_UNITS.some(unit => unit.id === unitId)) return;
    updateTask('take-the-handover', prev => {
      const row = prev.rows[unitId];
      return {
        ...prev,
        rows: {
          ...prev.rows,
          [unitId]: {
            ...row,
            probed: true,
            time: row.time || progress.clock,
            initials: row.initials || progress.initials,
            recorded: false,
          },
        },
      };
    });
  };

  const handleRowChange: HandoverRoundProps['onRowChange'] = (unitId, field, value) => {
    if (frozen || !FRIDGE_UNITS.some(unit => unit.id === unitId)) return;
    updateTask('take-the-handover', prev => {
      const row = prev.rows[unitId];
      if (!row?.probed) return prev;
      // Older rounds could have a settled probe but no board entry yet. Stamp
      // their first written entry too, rather than leaving a read-only time blank.
      const measurementDetails = row.time
        ? {}
        : { time: progress.clock, initials: row.initials || progress.initials };
      return {
        ...prev,
        rows: {
          ...prev.rows,
          [unitId]: { ...row, ...measurementDetails, [field]: value, recorded: false },
        },
      };
    });
  };

  const handleSaveClose = (unitId: string): boolean => {
    const row = state.rows[unitId];
    if (frozen || !handoverLogRead(state) || !handoverRowComplete(unitId, row)) return false;
    const wasSaved = handoverRowSaved(unitId, row);
    updateTask('take-the-handover', prev => {
      const current = prev.rows[unitId];
      if (!handoverRowComplete(unitId, current)) return prev;
      return {
        ...prev,
        rows: {
          ...prev.rows,
          [unitId]: {
            ...current,
            reading: current.reading.trim(),
            initials: current.initials.trim(),
            note: current.note.trim(),
            recorded: true,
          },
        },
      };
    });
    if (!wasSaved) advanceClock(2);
    kitchenAudio.play('confirm');
    return true;
  };

  return (
    <KitchenFrame
      id="take-the-handover"
      guide={getHandoverGuide(state)}
      dialogue={null}
      focusedWorkspace
      readyToContinue={handoverRoundSaved(state)}
      scenes={{
        pass: (
          <HandoverRound
            state={state}
            initials={progress.initials}
            onReadLog={handleReadLog}
            onProbe={handleProbe}
            onRowChange={handleRowChange}
            onSaveClose={handleSaveClose}
          />
        ),
      }}
    />
  );
}