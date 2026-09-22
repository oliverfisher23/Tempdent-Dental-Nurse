/**
 * The kitchen as a place: where things are, how the student moves between them,
 * and which parts of the building matter for each task.
 *
 * Map coordinates are percentages of the isometric kitchen illustration
 * (`assets/kitchen/kitchen-map.jpg`, square). Scene backdrops are the close-up
 * views the student stands in while they work.
 */

import type { TaskId } from './activities';
import type {
  Place as ShellPlace,
  Person as ShellPerson,
  TaskRoute as ShellTaskRoute,
  Workplace,
} from '@shell/lib/client';

import mapImg from '@client/assets/kitchen/kitchen-map.jpg';
// Photographs of Terence in the art'otel Hoxton kitchen: see content/kitchen-photos.json
// for the source frame behind each export and scripts/prepare-kitchen-photos.mjs to regenerate them.
import scenePass from '@client/assets/kitchen/photos/pass.webp';
import sceneCorridor from '@client/assets/kitchen/photos/fridges.webp';
import sceneBench from '@client/assets/kitchen/photos/bench.webp';
import terencePortrait from '@client/assets/kitchen/photos/terence-square.webp';
// Goods-in and the events kitchen keep their illustrated backdrops: no photograph of those areas was supplied.
import sceneGoodsIn from '@client/assets/kitchen/scene-goods-in.jpg';
import sceneEvents from '@client/assets/kitchen/scene-events.jpg';
import fishBox from '@client/assets/kitchen/fish-box.jpg';
import crateSeaBass from '@client/assets/kitchen/crate-sea-bass.jpg';
import crateChicken from '@client/assets/kitchen/crate-chicken.jpg';
import crateCream from '@client/assets/kitchen/crate-cream.jpg';
import crateSpinach from '@client/assets/kitchen/crate-spinach.jpg';
import crateLemons from '@client/assets/kitchen/crate-lemons.jpg';

export type PlaceId = 'pass' | 'corridor' | 'goods-in' | 'bench' | 'events';

export type Place = ShellPlace & { id: PlaceId };

export const PLACES: Record<PlaceId, Place> = {
  pass: {
    id: 'pass',
    name: 'The pass',
    description: 'The counter where finished plates are handed to the waiters. The clipboards, the whiteboard, the radio, and the clock all live here, so everyone passes through.',
    map: { x: 45, y: 67 },
    backdrop: scenePass,
    ambience: { cutoff: 1400, gain: 0.55 },
  },
  corridor: {
    id: 'corridor',
    name: 'The fridges',
    description: 'The row of fridges and freezers along the back wall, with the walk-in (the fridge you can walk into) at the end and the temperature board on the wall.',
    map: { x: 62, y: 31 },
    // Task 1 is a focused workspace with no room navigation, so this photograph is shown
    // faded behind its overnight log and board pages (scenes/handover/fridge-backdrop.tsx).
    backdrop: sceneCorridor,
    ambience: { cutoff: 700, gain: 0.7 },
  },
  'goods-in': {
    id: 'goods-in',
    name: 'The back door',
    description: 'Goods-in: The door where deliveries arrive. There is a bench for checking things off and a set of scales.',
    map: { x: 23, y: 20 },
    backdrop: sceneGoodsIn,
    ambience: { cutoff: 3200, gain: 0.6 },
  },
  bench: {
    id: 'bench',
    name: 'The prep bench',
    description: 'The big steel bench next to the blast chiller (a cabinet that cools hot food fast). Big batches are split into trays here.',
    map: { x: 66, y: 50 },
    backdrop: sceneBench,
    ambience: { cutoff: 1800, gain: 0.6 },
  },
  events: {
    id: 'events',
    name: 'The events kitchen',
    description: 'The smaller kitchen next door where food for functions is finished. The evening board and the allergen chart are on its wall.',
    map: { x: 84, y: 62 },
    backdrop: sceneEvents,
    ambience: { cutoff: 900, gain: 0.35 },
  },
};

export const PLACE_ORDER: PlaceId[] = ['pass', 'corridor', 'bench', 'goods-in', 'events'];

/** A waypoint in the open floor between the pass and the back wall; walks route through it. */
export const MAP_CROSSING = { x: 52, y: 52 };

export type { DayLight } from '@shell/lib/client';

export type TaskRoute = ShellTaskRoute & {
  start: PlaceId;
  places: PlaceId[];
  whatIsHere: Partial<Record<PlaceId, string>>;
};

export const TASK_ROUTES: Record<TaskId, TaskRoute> = {
  'take-the-handover': {
    start: 'pass',
    places: ['pass', 'corridor'],
    light: 'dawn',
    // The fridge round resumes from its saved rows by itself; re-sending the action
    // would open a fridge door the learner has not opened.
    restoresWorkspace: false,
    whatIsHere: {
      pass: 'The night porter is waiting with the overnight log.',
      corridor: 'The fridges to check, the thermometer in each one, and the temperature board.',
    },
  },
  'check-the-delivery-in': {
    start: 'pass',
    places: ['pass', 'goods-in'],
    light: 'morning',
    whatIsHere: {
      pass: 'Terence, and the radio on its charger.',
      'goods-in': 'The driver is waiting with three trolleys of boxes and the delivery note.',
    },
  },
  'chill-the-event-batch': {
    start: 'bench',
    places: ['bench'],
    light: 'morning',
    whatIsHere: {
      bench: 'The beef, the trays, the probe, the blast chiller, and the chill record.',
    },
  },
  'check-the-dietary-list': {
    start: 'pass',
    places: ['pass', 'events'],
    light: 'midday',
    whatIsHere: {
      pass: 'Yvie is waiting with the function sheet.',
      events: 'The recipe cards, the allergen chart, and the evening board.',
    },
  },
  'hand-the-kitchen-on': {
    start: 'pass',
    places: ['pass'],
    light: 'afternoon',
    whatIsHere: {
      pass: 'The waste bins and scales, the handover sheet, the evening team and, later on, Terence.',
    },
  },
};

export type PersonId = 'marcus' | 'sarah' | 'elena' | 'porter' | 'driver' | 'evening-team';

export type Person = ShellPerson & { id: PersonId };

/** Terence is the current on-screen name; the legacy ids remain for saved progress. */

export const PEOPLE: Person[] = [
  { id: 'marcus', speaker: 'Terence', name: 'Terence', role: 'Executive sous chef and mentor', portrait: terencePortrait },
  { id: 'sarah', speaker: 'Yvie', name: 'Yvie', role: 'Events', portrait: null },
  { id: 'elena', speaker: 'Terence', name: 'Terence', role: 'Executive sous chef and mentor', portrait: terencePortrait },
  { id: 'porter', speaker: 'Night porter', name: 'Night porter', role: 'Night porter', portrait: null },
  { id: 'driver', speaker: 'Driver', name: 'Driver', role: 'Delivery driver', portrait: null },
  { id: 'evening-team', speaker: 'Evening team', name: 'Evening team', role: 'The chefs taking over at 15:00', portrait: null },
];

export const TERENCE_PERSON_ID = 'marcus' as const;
export const YVIE_PERSON_ID = 'sarah' as const;

/** What is inside each box on the delivery, keyed by the order line id in `activities.ts`. */
export const CRATE_IMAGES: Record<string, string> = {
  salmon: fishBox,
  'sea-bass': crateSeaBass,
  chicken: crateChicken,
  cream: crateCream,
  spinach: crateSpinach,
  lemons: crateLemons,
};

export const MAP_IMAGE = mapImg;

/** The kitchen as the shell sees it. */
export const WORKPLACE: Workplace = {
  places: PLACES,
  map: { image: MAP_IMAGE, alt: 'The kitchen from above', crossing: MAP_CROSSING },
  taskRoutes: TASK_ROUTES,
  people: PEOPLE,
};
