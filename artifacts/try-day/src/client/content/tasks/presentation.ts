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
  /**
   * A checklist of an emergency kit. V2: each item zooms when tapped and its sheet line
   * initials itself once read; the answer is the set of items read (nothing can be ticked).
   */
  | ({ kind: 'kit'; items: Record<string, { detail: string; status: 'ok' | 'expired' | 'missing' }> } & CloseUpBase)

  /* ---------------- V2 presentations (docs/V2-BUILD.md) ---------------- */

  /**
   * A choice: one thing about the learner is wrong in the mirror. The variant shown is chosen
   * per learner (a hash of the name), so every learner's fault is one of the content's accepted
   * answers; the fine things (badge, tunic) are the wrong options and have a spot on every variant.
   */
  | ({ kind: 'reflection'; variants: Record<string, ReflectionVariant>; spots: Record<string, Spot> } & CloseUpBase)
  /**
   * A checklist of faults on the room photograph. `backdrop` replaces the place photograph until
   * every fault is fixed; tapping a fault reveals the normal photograph inside `fixed` and adds the
   * option to the answer. `fine` spots reply neutrally and are not recorded.
   */
  | { kind: 'find'; backdrop: string; backdropAlt: string; faults: Record<string, FindFault>; fine: FineSpot[]; counter: string; guideLabel?: string }
  /**
   * A choice committed by holding a control to the end of a compressed on-screen clock (the tap,
   * the flush button). Letting go early shows `early` and restarts; nothing is answered. `distractor`
   * is a control that answers with another option when used before the hold (the gloves box).
   * `choose` offers a preface choice (flush duration) and the hold then commits the chosen option.
   */
  | ({ kind: 'hold'; control: string; seconds: number; commits: string; steps?: string[]; early?: string;
      distractor?: { optionId: string; label: string }; choose?: { prompt: string; optionIds: string[]; secondsById?: Record<string, number> };
      clockMinutes?: number; after?: string[]; sound?: 'water-run' | 'chair' | 'flush' } & CloseUpBase)
  /**
   * A sequence done as one continuous drag across zones on the photograph, judged once when the
   * pointer lifts (the answer is the zones crossed, in order). Keyboard: Enter on each zone, then `finish`.
   */
  | { kind: 'path'; zones: Record<string, PathZone>; start: string; finish: string; guideLabel?: string }
  /**
   * Real controls in the room (chair, light, bib, glasses, aspirator, cupboard). The answer is
   * committed when the learner uses `commit` (the door, "Call Dr Reid"): for a sequence, the order
   * the controls were used; for a checklist, the controls in their "on" state at that moment.
   */
  | { kind: 'controls'; controls: Record<string, ControlSpec>; commit: { label: string; spot?: Spot }; start: string; guideLabel?: string }
  /** A choice committed as `commits` once the learner has typed initials matching their own; stamped on `sheets`. */
  | ({ kind: 'initials'; commits: string; sheets: string[] } & CloseUpBase)
  /**
   * The paced segment (Task 3 "four hands"; Task 6 reuses it for one cue). One close-up drives several
   * decisions (`segment.decisions`) through `onAnswerOther`; the decision it is attached to is the first.
   */
  | ({ kind: 'paced'; segment: PacedSegment } & CloseUpBase)
  /** A checklist gathered across three patient conversation moments, one offer at each moment. */
  | ({ kind: 'offers'; moments: OfferMoment[] } & CloseUpBase)
  /** A checklist answered by placing each item in one of several zones; option ids are `<item>:<zone>`. */
  | ({ kind: 'zones'; items: Record<string, ZoneItem>; zones: Record<string, { label: string; note?: string }> } & CloseUpBase)
  /** A checklist or sequence: pouches dragged into the autoclave chamber, judged when the door is shut. */
  | ({ kind: 'autoclave'; items: Record<string, { image?: string; note?: string }>; door: string } & CloseUpBase)
  /** A sequence: jobs placed on a plan board; columns in order, the last column is "Ask". */
  | ({ kind: 'board'; columns: { id: string; label: string }[]; ask: string } & CloseUpBase)
  /** A checklist: lines of a delivery note; flag the ones that are wrong (option id = line id). */
  | ({ kind: 'flags'; lines: FlagLine[]; flag: string } & CloseUpBase)
  /** A choice made after reading a document rendered in HTML (the autoclave printout). */
  | ({ kind: 'printout'; document: PrintoutDoc } & CloseUpBase)
  /** A checklist: peel-and-stick labels dragged onto the fields of the notes (option id = label id). */
  | ({ kind: 'stick'; labels: StickLabel[]; fields: { id: string; label: string; accepts: string }[] } & CloseUpBase)
  /** A clocked reset sequence performed on the room photograph and judged only when the door is opened. */
  | ({ kind: 'turnaround'; start: string; guideLabel?: string; clockLabel: string;
      controls: Record<string, TurnaroundControl>;
      wipe: { optionId: string; finish: string; zones: Record<string, PathZone> };
      commit: { label: string; spot: Spot } } & CloseUpBase)
  /**
   * A checklist: the handover written from the learner's own notebook. Options are entry ids;
   * entries the day recorded (see lib/consequences.ts) and the two non-handover distractors are
   * offered; the answer is the set dragged onto the handover.
   */
  | ({ kind: 'handover'; distractors: Record<string, string>; fixed?: string[]; sheet: string } & CloseUpBase);

export interface ReflectionVariant { image: string; alt: string; fixed: string; fixedAlt: string }
export interface Region { x: number; y: number; w: number; h: number }
export interface FindFault { spot: Spot; fixed: Region; done: string }
export interface FineSpot { spot: Spot; reply: string }
export interface PathZone extends Spot { r?: number }
export interface ControlSpec {
  label: string;
  spot: Spot;
  kind: 'toggle' | 'hold' | 'action';
  /** Off/on labels for a toggle ("Light off" / "Light on"). */
  states?: [string, string];
  /** Hold length on screen, seconds. */
  seconds?: number;
  /** Line a person in the room says when the control is used without being told first (Task 2 chair). */
  explain?: string;
}
export interface ZoneItem { label: string; image?: string; finding?: string }
export interface FlagLine { id: string; item: string; ordered: string; delivered: string; note?: string }
export interface PrintoutDoc { title: string; rows: { label: string; value: string }[]; footer?: string }
export interface StickLabel { id: string; item: string; fields: { field: string; value: string }[] }
export interface TurnaroundControl {
  label: string;
  spot: Spot;
  kind: 'action' | 'hold';
  seconds?: number;
  sound?: 'tap' | 'wipe' | 'water-run' | 'flush' | 'box-lid';
}

/** One cue in the paced segment: what Dr Reid asks for and when, with the tell that precedes it. */
export interface PacedCue {
  /** Decision id and option id this cue answers when the learner acts. */
  decision: string;
  option: string;
  /** Seconds into the segment when the cue is due; the tell shows `tellSeconds` before it. */
  at: number;
  /** Dr Reid's tell (a look, a hand held out) and, if the learner does not act, her cue line. */
  tell: string;
  cue: string;
  /** Options offered on the tray during this cue (the right one is `option`). */
  offer: string[];
  /** Short tray label shown for this beat. */
  label: string;
  /** Play the clinical world sound while this beat is active. */
  sound?: 'handpiece' | 'curing-light';
}
export interface PacedSegment {
  /** Every decision this close-up answers, the attached decision first. */
  decisions: string[];
  /** Length of the segment in seconds at normal tempo. */
  seconds: number;
  tellSeconds: number;
  /**
   * At normal tempo, how long Dr Reid waits after asking before she looks up (default 4).
   * Passing on the ask is fine; passing nothing for this long counts as a look-up. Not used
   * with "at your pace", where every cue waits for the learner.
   */
  waitSeconds?: number;
  cues: PacedCue[];
  /** Labels and imported cut-outs used by the shared tray. */
  items?: Record<string, { label: string; image?: string }>;
  /** Lines shown within the segment. New Task 3 lines remain TBC in its content file. */
  before?: string;
  early?: string;
  wrongItem?: string;
  /** Debrief templates selected from the number of times Dr Reid had to look up. */
  debrief?: { none: string; some: string; more: string; after?: string };
  /** The "Speak up" control: the decision and option it answers, and the moment it is right. */
  speakUp?: { decision: string; option: string; missedOption?: string; at: number; window: number; label: string };
  /** Continuous control (the suction): decision answered by where it is held; option ids by zone. */
  live?: { decision: string; label: string; zones: Record<string, Spot> };
  /** Picture of the working field with its states. */
  field?: { image: string; alt: string; states?: Record<string, { image: string; alt: string }> };
  /** Recoverable Task 1 consequence at the matrix-band cue. */
  fetch?: { item: string; label: string; aside: string };
}
export interface OfferMoment { id: string; line: string; optionIds: string[] }

export type PresentationKind = Presentation['kind'];
export type PresentationOf<K extends PresentationKind> = Extract<Presentation, { kind: K }>;

/** Close-up presentations open a workspace; the others happen on the stage itself. */
export const CLOSE_UP_KINDS: readonly PresentationKind[] = [
  'paper', 'order', 'tray', 'labels', 'bench', 'kit',
  'reflection', 'hold', 'initials', 'paced', 'offers', 'zones', 'autoclave', 'board', 'flags', 'printout', 'stick', 'turnaround', 'handover',
];
/** Presentations drawn on the room photograph and in the panel (a stage layer, not a close-up). */
export const STAGE_LAYER_KINDS: readonly PresentationKind[] = ['find', 'path', 'controls'];
