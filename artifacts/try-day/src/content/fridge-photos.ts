import walkIn from '@/assets/kitchen/inspections/walk-in.webp';
import larderOne from '@/assets/kitchen/inspections/larder-1.webp';
import larderTwo from '@/assets/kitchen/inspections/larder-2.webp';
import fish from '@/assets/kitchen/inspections/fish.webp';
import dairy from '@/assets/kitchen/inspections/dairy.webp';
import freezerOne from '@/assets/kitchen/inspections/freezer-1.webp';
import freezerTwo from '@/assets/kitchen/inspections/freezer-2.webp';
import closedDoor from '@/assets/kitchen/inspections/closed-door.webp';

export const CLOSED_FRIDGE_PHOTO = closedDoor;

/** Representative generated training imagery, not photographs of the actual site. */
export const FRIDGE_PHOTOS: Record<string, { src: string; alt: string; contents: string }> = {
  'walk-in': {
    src: walkIn,
    alt: 'Walk-in cold room with covered food containers and vegetable crates on stainless steel shelves.',
    contents: 'Prepared vegetables, covered stocks and fresh produce.',
  },
  'larder-1': {
    src: larderOne,
    alt: 'Larder fridge shelves holding separate covered containers of prepared vegetables and cold dishes.',
    contents: 'Prepared vegetables and ready-to-eat dishes.',
  },
  'larder-2': {
    src: larderTwo,
    alt: 'Larder fridge with covered rice, cut melon and other prepared food in separate containers.',
    contents: 'Cooked rice, cut melon and prepared food.',
  },
  fish: {
    src: fish,
    alt: 'Dedicated fish fridge containing covered trays of whole fish and salmon fillets over ice.',
    contents: 'Whole fish and salmon fillets in separate covered trays.',
  },
  dairy: {
    src: dairy,
    alt: 'Dairy fridge with closed milk bottles, cream, butter and covered pastry cream.',
    contents: 'Milk, cream, butter and pastry cream.',
  },
  'freezer-1': {
    src: freezerOne,
    alt: 'Commercial freezer storing sealed frozen meat in separate trays and closed foodservice boxes.',
    contents: 'Wrapped frozen meat in separate trays.',
  },
  'freezer-2': {
    src: freezerTwo,
    alt: 'Commercial freezer with sealed frozen vegetables, berries and covered pastry portions.',
    contents: 'Frozen vegetables, berries and pastry portions.',
  },
};