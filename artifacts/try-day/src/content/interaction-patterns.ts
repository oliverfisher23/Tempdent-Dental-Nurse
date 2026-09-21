/**
 * The handful of ways you do things in the Simulation, explained once in plain words.
 * Shown as tiles before the shift starts and again from "How do I do this?" beside
 * the step guide. This is the one place the app is allowed to talk about the
 * controls themselves (see COPY.md, rule 4).
 */
export type InteractionPatternId = 'tap' | 'drag' | 'hold' | 'list' | 'explore';

export interface InteractionPattern {
  id: InteractionPatternId;
  /** Two to four words, the same everywhere. */
  title: string;
  /** One sentence for the tile. */
  summary: string;
  /** Two or three short lines for the card. */
  steps: string[];
  /** One line for keyboard users, shown on the card only. */
  keyboard?: string;
  /** Show this one on the briefing page before the shift starts. */
  onBriefing: boolean;
}

export const INTERACTION_PATTERNS: Record<InteractionPatternId, InteractionPattern> = {
  tap: {
    id: 'tap',
    title: 'Tap to choose',
    summary: 'Cards, rows, trays and tubs are things you can pick. Tap one and it highlights.',
    steps: [
      'Tap a card, row or object to pick it. It highlights so you know it is chosen.',
      'The controls for whatever you picked sit right beside it.',
      'Tap something else to change your mind. Nothing is final until you save or sign.',
    ],
    keyboard: 'Tab moves between things you can pick, Enter or Space picks one.',
    onBriefing: true,
  },
  drag: {
    id: 'drag',
    title: 'Drag, or use the buttons',
    summary: 'Press on a tray, probe or ruler and drag it where it goes. The places it can go light up.',
    steps: [
      'Press on the item and drag it. The places it can go light up while you carry it.',
      'Prefer not to drag? Tap the item once, then tap the place you want it.',
      'There are buttons for the same job beside the item, if you would rather.',
    ],
    keyboard: 'Space picks the item up, the arrow keys choose the place, Enter puts it down, Escape puts it back.',
    onBriefing: true,
  },
  hold: {
    id: 'hold',
    title: 'Hold to read an instrument',
    summary: 'Press and hold a thermometer or probe for a couple of seconds until it settles, then read it yourself.',
    steps: [
      'Press and hold. The ring fills while the reading settles, which takes about three seconds.',
      'Let go once it has settled, then read the number off the instrument and type it in.',
      'The app never writes the number for you. That is the job.',
    ],
    keyboard: 'Press Space once to start and once to stop, or use the "tap here to start" link.',
    onBriefing: true,
  },
  list: {
    id: 'list',
    title: 'Work through the list',
    summary: 'Some steps have several items. The count shows how many are left.',
    steps: [
      'Take the items one at a time. The count at the top shows how many are done.',
      'You can do them in any order unless the step says otherwise.',
      'The next step opens when the count is complete.',
    ],
    onBriefing: false,
  },
  explore: {
    id: 'explore',
    title: 'Look around the room',
    summary: 'The labelled spots in the room are the things you can use.',
    steps: [
      'Labelled spots are the things you can open, pick up or read. The pulsing one is where the step guide is pointing.',
      'A greyed spot opens later, and its label says what unlocks it.',
      'Use the step guide button at the top if you would rather be taken straight there.',
    ],
    onBriefing: false,
  },
};

export const BRIEFING_PATTERNS = (Object.values(INTERACTION_PATTERNS) as InteractionPattern[]).filter((p) => p.onBriefing);

export const PATTERN_COPY = {
  briefingTitle: 'How this works',
  briefingIntro: 'Three things to know before you start. You can see them again at any point from "How do I do this?" beside the step guide.',
  howLink: 'How do I do this?',
  cardEyebrow: 'How this works',
  thisStep: 'This step',
  keyboardLabel: 'Keyboard',
  close: 'Got it',
};
