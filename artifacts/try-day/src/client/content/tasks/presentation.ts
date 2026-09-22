/**
 * How a decision is worked on the stage. The decision itself (options, answer,
 * clause, feedback) is judged the same way whatever its presentation; this only
 * says where the learner does it: in the speech panel, on the room photograph,
 * or in a close-up workspace. A decision without a presentation gets the
 * default for its kind: choice -> speech, checklist -> paper, sequence -> order.
 */

export type PaperKind = 'clipboard' | 'notepaper' | 'sheet' | 'whiteboard';

export interface Spot {
  /** Percent of the backdrop width and height, measured on the place photograph. */
  x: number;
  y: number;
  /** Short hint shown under the label while the spot is active. */
  hint?: string;
}

export interface LabelField {
  /** The option id this field answers for. */
  optionId: string;
  /** The field name printed on the label: REF, LOT, EXP. */
  field: string;
  /** The printed value. */
  value: string;
}

export interface LabelPackage {
  id: string;
  name: string;
  /** Imported picture of the package, if any. */
  image?: string;
  fields: LabelField[];
}

/** Shared by every close-up presentation. */
export interface CloseUpBase {
  /** The close-up's title. */
  title: string;
  /** Label of the button in the speech panel (and the step guide) that opens it. */
  open: string;
  /** Imported photograph shown across the top of the close-up: the thing being looked at. */
  picture?: string;
}

export type Presentation =
  /** A choice (default) or a checklist answered in the speech panel at the foot of the stage. */
  | { kind: 'speech'; speaker?: string }
  /**
   * Options tapped as hotspots on the room photograph: a sequence in order, a checklist
   * ticked then confirmed, a choice answered by one tap. Every option needs a spot, or
   * is listed as offstage (things you do to yourself, not the room) and shown as a
   * button in the panel instead.
   */
  | { kind: 'hotspots'; spots: Record<string, Spot>; offstage?: string[] }
  /** A checklist or sequence ticked on paper in a close-up (default for a checklist). */
  | ({ kind: 'paper'; paper: PaperKind; heading?: string; note?: string } & CloseUpBase)
  /** A sequence put into numbered slots in a close-up (default for a sequence). */
  | ({ kind: 'order'; slotsLabel?: string } & CloseUpBase)
  /** A checklist built by moving items from a shelf onto a tray; the tray is the answer. */
  | ({ kind: 'tray'; shelf: string; images?: Record<string, string> } & CloseUpBase)
  /** A checklist of packaging: tap the printed field on each label that goes in the notes. */
  | ({ kind: 'labels'; packages: LabelPackage[] } & CloseUpBase)
  /** A checklist of items under the lamp, each with a picture and a finding to read before ticking. */
  | ({ kind: 'bench'; items: Record<string, { image?: string; finding: string }> } & CloseUpBase)
  /** A checklist of an emergency kit: each line shows its state; tick only what is ready. */
  | ({ kind: 'kit'; items: Record<string, { detail: string; status: 'ok' | 'expired' | 'missing' }> } & CloseUpBase);

export type PresentationKind = Presentation['kind'];
export type PresentationOf<K extends PresentationKind> = Extract<Presentation, { kind: K }>;

/** Close-up presentations open a workspace; the others happen on the stage itself. */
export const CLOSE_UP_KINDS: readonly PresentationKind[] = ['paper', 'order', 'tray', 'labels', 'bench', 'kit'];
