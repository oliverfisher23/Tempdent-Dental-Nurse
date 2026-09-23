import type { ComponentType } from 'react';
import type { PresentationKind } from '@client/content/tasks';
import type { InteractionProps } from './types';
import { PaperInteraction } from './paper';
import { OrderInteraction } from './order';
import { KitInteraction } from './kit';
import { TrayInteraction } from './tray';
import { LabelsInteraction } from './labels';
import { BenchInteraction } from './bench';
import { ZonesInteraction } from './zones';
import { AutoclaveInteraction } from './autoclave';
import { BoardInteraction } from './board';
import { FlagsInteraction } from './flags';
import { PrintoutInteraction } from './printout';
import { PacedInteraction } from './paced';
import { ControlsInteraction } from './controls';
import { OffersInteraction } from './offers';
import { HandoverInteraction } from './handover';
import { ReflectionInteraction } from './reflection';
import { FindInteraction } from './find';
import { HoldInteraction } from './hold';
import { PathInteraction } from './path';
import { InitialsInteraction } from './initials';
import { StickInteraction } from './stick';
import { TurnaroundInteraction } from './turnaround';

export type { InteractionProps } from './types';

type AnyInteraction = ComponentType<InteractionProps<never>>;
const as = (component: ComponentType<any>) => component as unknown as AnyInteraction;

export type CloseUpKind = Exclude<PresentationKind, 'speech' | 'hotspots' | 'find' | 'path' | 'controls'>;
export type StageLayerKind = Extract<PresentationKind, 'find' | 'path' | 'controls'>;

/**
 * Close-up interactions by presentation kind. A V2 entry still on `PendingInteraction`
 * shows the plain decision controls so a task is never blocked; each owner replaces
 * their own line (docs/V2-BUILD.md) as the real component lands.
 */
export const INTERACTIONS: Record<CloseUpKind, AnyInteraction> = {
  paper: as(PaperInteraction),
  order: as(OrderInteraction),
  tray: as(TrayInteraction),
  labels: as(LabelsInteraction),
  bench: as(BenchInteraction),
  kit: as(KitInteraction),
  reflection: as(ReflectionInteraction),
  hold: as(HoldInteraction),
  initials: as(InitialsInteraction),
  paced: as(PacedInteraction),
  offers: as(OffersInteraction),
  zones: as(ZonesInteraction),
  autoclave: as(AutoclaveInteraction),
  board: as(BoardInteraction),
  flags: as(FlagsInteraction),
  printout: as(PrintoutInteraction),
  stick: as(StickInteraction),
  turnaround: as(TurnaroundInteraction),
  handover: as(HandoverInteraction),
};

/**
 * Stage layers: presentations drawn on the room photograph (inside the photo box) with
 * their controls in the panel. The engine renders the layer in place of the hotspot layer.
 */
export const STAGE_LAYERS: Record<StageLayerKind, AnyInteraction> = {
  find: as(FindInteraction),
  path: as(PathInteraction),
  controls: as(ControlsInteraction),
};
