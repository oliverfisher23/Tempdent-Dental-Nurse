/** Clues for user-supplied simulation media, not verified footage of the actual site. */
export interface FridgeClue {
  id: string;
  label: string;
  finding: string;
  x: number;
  y: number;
}

export const FRIDGE_INSPECTIONS: Record<string, { alt: string; contents: string; clues: FridgeClue[] }> = {
  'walk-in': {
    alt: 'Walk-in cold room with covered food containers and vegetable crates on stainless steel shelves.',
    contents: 'Prepared vegetables, covered stocks and fresh produce.',
    clues: [
      { id: 'produce', label: 'Check the produce', finding: 'Everything feels properly chilled. The produce is covered and off the floor.', x: 31, y: 60 },
      { id: 'containers', label: 'Check the containers', finding: 'The lids are on and there are no spills. Nothing needs adding to the note.', x: 70, y: 40 },
    ],
  },
  'larder-1': {
    alt: 'Larder fridge shelves holding separate covered containers of prepared vegetables and cold dishes.',
    contents: 'Prepared vegetables and ready-to-eat dishes.',
    clues: [
      { id: 'top-shelf', label: 'Check the top shelf', finding: 'The ready-to-eat food is covered and sitting above the raw ingredients.', x: 48, y: 16 },
      { id: 'door', label: 'Check the door', finding: 'The door shuts cleanly and the seal looks sound.', x: 94, y: 53 },
    ],
  },
  'larder-2': {
    alt: 'Larder fridge with covered rice, cut melon and other prepared food in separate containers.',
    contents: 'Cooked rice, cut melon and prepared food.',
    clues: [
      { id: 'door', label: 'Check the door', finding: 'The door is shut now, but the seal feels warm. This matches the overnight log.', x: 94, y: 52 },
      { id: 'food', label: 'Check the food', finding: 'There is cooked rice and cut melon in here. They need moving to larder one while this fridge cools down.', x: 52, y: 58 },
    ],
  },
  fish: {
    alt: 'Dedicated fish fridge containing covered trays of whole fish and salmon fillets over ice.',
    contents: 'Whole fish and salmon fillets in separate covered trays.',
    clues: [
      { id: 'fish-trays', label: 'Check the fish', finding: 'The fish is covered, separated and sitting over ice. It feels properly cold.', x: 52, y: 53 },
      { id: 'drip', label: 'Check below', finding: 'The shelf underneath is clean and dry. Nothing is dripping onto another tray.', x: 48, y: 82 },
    ],
  },
  dairy: {
    alt: 'Dairy fridge with closed milk bottles, cream, butter and covered pastry cream.',
    contents: 'Milk, cream, butter and pastry cream.',
    clues: [
      { id: 'dairy', label: 'Check the dairy', finding: 'The milk and cream are sealed and in date. Everything feels chilled.', x: 32, y: 18 },
      { id: 'pastry', label: 'Check the pastry cream', finding: 'The pastry cream is covered and labelled. Nothing needs adding to the note.', x: 69, y: 70 },
    ],
  },
  'freezer-1': {
    alt: 'Commercial freezer storing sealed frozen meat in separate trays and closed foodservice boxes.',
    contents: 'Wrapped frozen meat in separate trays.',
    clues: [
      { id: 'packs', label: 'Check the packs', finding: 'The packs are frozen solid with no soft edges or liquid in the trays.', x: 48, y: 59 },
      { id: 'ice', label: 'Check for ice', finding: 'There is no heavy ice build-up around the door or shelves.', x: 86, y: 35 },
    ],
  },
  'freezer-2': {
    alt: 'Commercial freezer with sealed frozen vegetables, berries and covered pastry portions.',
    contents: 'Frozen vegetables, berries and pastry portions.',
    clues: [
      { id: 'berries', label: 'Check the berries', finding: 'The berries are loose in the bag, not frozen into one solid block.', x: 48, y: 16 },
      { id: 'pastry', label: 'Check the pastry', finding: 'The pastry portions are sealed and frozen hard. Nothing needs adding to the note.', x: 30, y: 37 },
    ],
  },
};