import type { HandoverState } from '@/lib/simulation';

export interface HandoverRoundProps {
  state: HandoverState;
  frozen?: boolean;
  /** Explicit acknowledgement after all four log entries have been displayed. */
  onReadLog: () => void;
  onProbe: (unitId: string) => void;
  /** Drafts persist but do not advance the current unit. */
  onRowChange: (unitId: string, field: 'reading' | 'initials' | 'note', value: string) => void;
  /** Call after closing the door; false means a required field is not valid. */
  onSaveClose: (unitId: string) => boolean;
}