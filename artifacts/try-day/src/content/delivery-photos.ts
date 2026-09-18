import salmon from '@/assets/delivery-photos/fish/salmon.jpg';
import seaBass from '@/assets/delivery-photos/fish/sea-bass.jpg';
import smokedHaddock from '@/assets/delivery-photos/fish/smoked-haddock.jpg';
import chicken from '@/assets/delivery-photos/chilled/chicken.jpg';
import cream from '@/assets/delivery-photos/chilled/cream.jpg';
import butter from '@/assets/delivery-photos/chilled/butter.jpg';
import spinach from '@/assets/delivery-photos/produce/spinach.jpg';
import shallots from '@/assets/delivery-photos/produce/shallots.jpg';
import lemons from '@/assets/delivery-photos/produce/lemons.jpg';
import parsley from '@/assets/delivery-photos/produce/parsley.jpg';
import fishSources from '@/assets/delivery-photos/fish/sources.json';
import chilledSources from '@/assets/delivery-photos/chilled/sources.json';
import produceSources from '@/assets/delivery-photos/produce/sources.json';
import type { DeliveryPhoto } from './delivery-photo-copy';

export const DELIVERY_PHOTOS: Record<string, DeliveryPhoto> = {
  salmon: { ...fishSources.salmon, src: salmon },
  'sea-bass': { ...fishSources['sea-bass'], src: seaBass },
  'smoked-haddock': { ...fishSources['smoked-haddock'], src: smokedHaddock },
  chicken: { ...chilledSources.chicken, src: chicken },
  cream: { ...chilledSources.cream, src: cream },
  butter: { ...chilledSources.butter, src: butter },
  spinach: { ...produceSources.spinach, src: spinach },
  shallots: { ...produceSources.shallots, src: shallots },
  lemons: { ...produceSources.lemons, src: lemons },
  parsley: { ...produceSources.parsley, src: parsley },
};