import type { ProbePlacementId, ChillInterval } from '@/content/activities';
import type { ChillState } from '@/lib/simulation';

/** Where the student is in the room: looking at it, at the bratt pan, or at the chiller. */
export type ChillView = 'room' | 'bench' | 'chiller';

export interface ChillActions {
  /** Beef poured from the ladle into a tray (kg). */
  onPour: (trayIndex: number, kg: number) => void;
  onAskForTray: () => void;
  onLoadTray: (trayIndex: number, shelfIndex: number) => void;
  onRemoveTray: (trayIndex: number) => void;
  onProbePlacement: (id: ProbePlacementId) => void;
  onStart: () => void;
  onWait: () => void;
  onReading: (interval: ChillInterval, value: string) => void;
  onMeasure: () => void;
  onSign: () => void;
}

export interface ChillSceneProps {
  state: ChillState;
  /** Kilos still in the bratt pan. */
  remaining: number;
  /** The chiller has been started: trays and probe stay where they are. */
  started: boolean;
  /** Half an hour is passing on the chiller clock. */
  waiting: boolean;
  actions: ChillActions;
}

/** A 1/1 GN tray is this deep; the beef cannot go higher. */
export const TRAY_DEPTH_MM = 80;
/** The ladle pours this much every tick while it is held over a tray. */
export const POUR_KG = 0.25;
export const POUR_TICK_MS = 180;
/** Dropping the ladle on a tray tips one scoop in. */
export const SCOOP_KG = 0.5;
