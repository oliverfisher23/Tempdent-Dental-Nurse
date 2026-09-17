/**
 * The kitchen as a place: where things are, how the student moves between them,
 * and which parts of the building matter for each task.
 *
 * Map coordinates are percentages of the isometric kitchen illustration
 * (`assets/kitchen/kitchen-map.jpg`, square). Scene backdrops are the close-up
 * views the student stands in while they work.
 */

import type { TaskId } from '@/content/activities';

import mapImg from '@/assets/kitchen/kitchen-map.jpg';
import scenePass from '@/assets/kitchen/scene-pass.jpg';
import sceneCorridor from '@/assets/kitchen/scene-corridor.jpg';
import sceneGoodsIn from '@/assets/kitchen/scene-goods-in.jpg';
import sceneBench from '@/assets/kitchen/scene-bench.jpg';
import sceneEvents from '@/assets/kitchen/scene-events.jpg';
import fridgeInterior from '@/assets/kitchen/fridge-interior.jpg';
import freezerInterior from '@/assets/kitchen/freezer-interior.jpg';
import walkInInterior from '@/assets/kitchen/walk-in-interior.jpg';
import fishBox from '@/assets/kitchen/fish-box.jpg';
import crateSeaBass from '@/assets/kitchen/crate-sea-bass.jpg';
import crateSmokedHaddock from '@/assets/kitchen/crate-smoked-haddock.jpg';
import crateChicken from '@/assets/kitchen/crate-chicken.jpg';
import crateCream from '@/assets/kitchen/crate-cream.jpg';
import crateButter from '@/assets/kitchen/crate-butter.jpg';
import crateSpinach from '@/assets/kitchen/crate-spinach.jpg';
import crateShallots from '@/assets/kitchen/crate-shallots.jpg';
import crateLemons from '@/assets/kitchen/crate-lemons.jpg';
import crateParsley from '@/assets/kitchen/crate-parsley.jpg';
import portraitMarcus from '@/assets/kitchen/portrait-marcus.png';
import portraitSarah from '@/assets/kitchen/portrait-sarah.png';
import portraitElena from '@/assets/kitchen/portrait-elena.png';
import portraitPorter from '@/assets/kitchen/portrait-porter.png';
import portraitDriver from '@/assets/kitchen/portrait-driver.png';

export type PlaceId = 'pass' | 'corridor' | 'goods-in' | 'bench' | 'events';

export interface Place {
  id: PlaceId;
  /** Name as a chef would say it. */
  name: string;
  /** One line for the map tooltip and for screen readers. */
  description: string;
  /** Where the marker sits on the map, as percentages of width and height. */
  map: { x: number; y: number };
  /** The close-up backdrop the student stands in. */
  backdrop: string;
}

export const PLACES: Record<PlaceId, Place> = {
  pass: {
    id: 'pass',
    name: 'The pass',
    description: 'The counter where finished plates are handed to the waiters. The clipboards, the whiteboard, the radio and the clock all live here, so everyone passes through.',
    map: { x: 45, y: 67 },
    backdrop: scenePass,
  },
  corridor: {
    id: 'corridor',
    name: 'The fridges',
    description: 'The row of fridges and freezers along the back wall, with the walk-in (the fridge you can walk into) at the end and the temperature board on the wall.',
    map: { x: 62, y: 31 },
    backdrop: sceneCorridor,
  },
  'goods-in': {
    id: 'goods-in',
    name: 'The back door',
    description: 'Goods-in: the door where deliveries arrive. There is a bench for checking things off and a set of scales.',
    map: { x: 23, y: 20 },
    backdrop: sceneGoodsIn,
  },
  bench: {
    id: 'bench',
    name: 'The prep bench',
    description: 'The big steel bench next to the blast chiller (a cabinet that cools hot food fast). Big batches are split into trays here.',
    map: { x: 66, y: 50 },
    backdrop: sceneBench,
  },
  events: {
    id: 'events',
    name: 'The events kitchen',
    description: 'The smaller kitchen next door where food for functions is finished. The evening board and the allergen chart are on its wall.',
    map: { x: 84, y: 62 },
    backdrop: sceneEvents,
  },
};

export const PLACE_ORDER: PlaceId[] = ['pass', 'corridor', 'bench', 'goods-in', 'events'];

/** A waypoint in the open floor between the pass and the back wall; walks route through it. */
export const MAP_CROSSING = { x: 52, y: 52 };

export type DayLight = 'dawn' | 'morning' | 'midday' | 'afternoon';

export interface TaskRoute {
  /** Where the student is standing when the task opens. */
  start: PlaceId;
  /** Every place that has something to do in this task, in the order the work runs. */
  places: PlaceId[];
  /** The light in the kitchen at this point in the day. */
  light: DayLight;
  /** What is waiting at each place, for the map tooltip. */
  whatIsHere: Partial<Record<PlaceId, string>>;
}

export const TASK_ROUTES: Record<TaskId, TaskRoute> = {
  'take-the-handover': {
    start: 'pass',
    places: ['pass', 'corridor'],
    light: 'dawn',
    whatIsHere: {
      pass: 'The night porter is waiting with the overnight log.',
      corridor: 'The fridges to check, the probe and the temperature board.',
    },
  },
  'check-the-delivery-in': {
    start: 'pass',
    places: ['pass', 'goods-in'],
    light: 'morning',
    whatIsHere: {
      pass: 'Marcus, and the radio on its charger.',
      'goods-in': 'The driver is waiting with three trolleys of boxes and the delivery note.',
    },
  },
  'chill-the-event-batch': {
    start: 'bench',
    places: ['bench'],
    light: 'morning',
    whatIsHere: {
      bench: 'The beef, the trays, the probe, the blast chiller and the chill record.',
    },
  },
  'check-the-dietary-list': {
    start: 'pass',
    places: ['pass', 'events'],
    light: 'midday',
    whatIsHere: {
      pass: 'Sarah is waiting with the function sheet.',
      events: 'The recipe cards, the allergen chart and the evening board.',
    },
  },
  'hand-the-kitchen-on': {
    start: 'pass',
    places: ['pass'],
    light: 'afternoon',
    whatIsHere: {
      pass: 'The waste bins and scales, the handover sheet, the evening team and, later on, Elena.',
    },
  },
};

export interface Person {
  id: 'marcus' | 'sarah' | 'elena' | 'porter' | 'driver' | 'evening-team';
  /** The speaker name used in dialogue lines. */
  speaker: string;
  name: string;
  role: string;
  portrait: string | null;
}

export const PEOPLE: Person[] = [
  { id: 'marcus', speaker: 'Marcus', name: 'Marcus Boateng', role: 'Chef de partie, larder', portrait: portraitMarcus },
  { id: 'sarah', speaker: 'Sarah', name: 'Sarah Okonkwo', role: 'Conference and banqueting coordinator', portrait: portraitSarah },
  { id: 'elena', speaker: 'Elena', name: 'Elena Voss', role: 'Executive chef', portrait: portraitElena },
  { id: 'porter', speaker: 'Night porter', name: 'Night porter', role: 'Night porter', portrait: portraitPorter },
  { id: 'driver', speaker: 'Driver', name: 'Driver', role: 'Delivery driver', portrait: portraitDriver },
  { id: 'evening-team', speaker: 'Evening team', name: 'Evening team', role: 'The chefs taking over at 15:00', portrait: null },
];

export function personForSpeaker(speaker: string): Person | undefined {
  return PEOPLE.find((p) => p.speaker === speaker);
}

/** Pictures the scenes open onto. */
export const INTERIORS = {
  fridge: fridgeInterior,
  freezer: freezerInterior,
  walkIn: walkInInterior,
  fishBox,
};

/** What is inside each box on the delivery, keyed by the order line id in `activities.ts`. */
export const CRATE_IMAGES: Record<string, string> = {
  salmon: fishBox,
  'sea-bass': crateSeaBass,
  'smoked-haddock': crateSmokedHaddock,
  chicken: crateChicken,
  cream: crateCream,
  butter: crateButter,
  spinach: crateSpinach,
  shallots: crateShallots,
  lemons: crateLemons,
  parsley: crateParsley,
};

export const MAP_IMAGE = mapImg;
