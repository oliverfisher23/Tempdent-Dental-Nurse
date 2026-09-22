import type { ComponentType } from 'react';
import type { PresentationKind } from '@client/content/tasks';
import type { InteractionProps } from './types';
import { PaperInteraction } from './paper';
import { OrderInteraction } from './order';
import { KitInteraction } from './kit';
import { TrayInteraction } from './tray';
import { LabelsInteraction } from './labels';
import { BenchInteraction } from './bench';

export type { InteractionProps } from './types';

/**
 * Close-up interactions by presentation kind. Each entry is replaced by its
 * real component as it lands; until then the pending close-up shows the plain
 * decision controls so a task is never blocked.
 */
export const INTERACTIONS: Record<Exclude<PresentationKind, 'speech' | 'hotspots'>, ComponentType<InteractionProps<never>>> = {
  paper: PaperInteraction as unknown as ComponentType<InteractionProps<never>>,
  order: OrderInteraction as unknown as ComponentType<InteractionProps<never>>,
  tray: TrayInteraction as unknown as ComponentType<InteractionProps<never>>,
  labels: LabelsInteraction as unknown as ComponentType<InteractionProps<never>>,
  bench: BenchInteraction as unknown as ComponentType<InteractionProps<never>>,
  kit: KitInteraction as unknown as ComponentType<InteractionProps<never>>,
};
